// ui: in-game HUD (DOM). It only reads the sim through read models and dispatches commands via Input / Game.
import { allDefs, allUpgrades, defIndex, defById, upgradeIndex, type EntityDef, type UpgradeDef } from '../data';
import { TD } from '../sim/ext';
import { SLOT_KEYS } from '../input/input';
import { Ord } from '../sim/types';
import { FOG_VISIBLE } from '../sim/vision';
import { heightAt } from '../sim/map';
import type { Game } from '../app/game';
import { audio } from '../audio/audio';
import { defIcon, iconURL } from './icons';

interface CardBtn {
  slot: number;
  key: string;
  label: string;
  icon: string;
  enabled: boolean;
  reason: string;
  onClick: () => void;
  cost?: { ore: number; flux: number };
  tip: () => string;
  cd?: number;
  active?: boolean;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const mmss = (ticks: number) => { const s = Math.floor(ticks / 20); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

export function weaponLine(d: EntityDef): string {
  const w = d.weapon;
  if (!w) return '';
  const dps = (w.damage / w.period).toFixed(1);
  const bonus = w.bonus ? Object.entries(w.bonus).map(([t, v]) => `<span class="bonus">+${v} vs ${t}</span>`).join(', ') : '';
  const bits = [`Damage <b>${w.damage}</b> / ${w.period}s (${dps} dps)`, `Range <b>${w.range}</b>${w.minRange ? ` (min ${w.minRange})` : ''}`];
  if (w.projectileSpeed) bits.push(`Projectile ${w.projectileSpeed}/s`); else if (!w.delayed) bits.push('Instant');
  if (w.delayed) bits.push(`Eruption ${w.delayed}s delay`);
  if (w.splash) bits.push(`Splash ${w.splash}`);
  if (w.pierce) bits.push('Pierces one Light unit');
  if (w.slow) bits.push(`Slows ${(100 - w.slow.factor * 100).toFixed(0)}% for ${w.slow.duration}s`);
  if (w.cone) bits.push(`Cone ±${Math.round((w.cone * 180) / Math.PI)}°`);
  if (w.setup) bits.push(`Setup ${w.setup}s`);
  bits.push(w.targets === 'ground' ? 'Targets ground' : w.targets === 'air' ? 'Targets air' : 'Targets ground & air');
  return bits.join(' · ') + (bonus ? `<br>${bonus}` : '');
}

export function defTipHtml(d: EntityDef, long: boolean, key?: string, reason?: string): string {
  const cost = d.cost.ore || d.cost.flux ? `<span style="color:#44e9d0">${d.cost.ore} ore</span>${d.cost.flux ? ` <span style="color:#ff8be0">${d.cost.flux} flux</span>` : ''}` : '';
  let h = `<b class="n">${esc(d.name)}</b>${key ? ` <span class="k">[${esc(key.toUpperCase())}]</span>` : ''}<br>${cost}${d.supply ? ` · ${d.supply} supply` : ''}${d.buildTime ? ` · ${d.buildTime}s` : ''}<br><span class="c">${esc(d.role)} · ${d.tags.join(', ')}</span>`;
  if (reason) h += `<br><span style="color:#ffb347">${esc(reason)}</span>`;
  h += `<hr>${esc(d.desc)}`;
  if (long) {
    h += `<hr>HP <b>${d.hp}</b> · Armor <b>${d.armor}</b>${d.speed ? ` · Speed <b>${d.speed}</b>` : ''} · Sight <b>${d.sight}</b>${d.shield ? ` · Shield <b>${d.shield}</b>` : ''}`;
    if (d.weapon) h += `<br>${weaponLine(d)}`;
    for (const a of d.abilities ?? []) h += `<br><b>${esc(a.name)}</b>: ${esc(a.desc)}`;
    if (d.requires?.length) h += `<br><span class="c">Requires: ${d.requires.map((r) => (r in upgradeIndex ? allUpgrades[upgradeIndex[r]].name : defById(r).name)).join(', ')}</span>`;
    if (d.counter) h += `<br><span class="c">Counter: ${esc(d.counter)}</span>`;
  }
  return h;
}

export function upgradeTipHtml(u: UpgradeDef, long: boolean, key?: string, reason?: string): string {
  let h = `<b class="n">${esc(u.name)}</b>${key ? ` <span class="k">[${esc(key.toUpperCase())}]</span>` : ''}<br><span style="color:#44e9d0">${u.cost.ore} ore</span> <span style="color:#ff8be0">${u.cost.flux} flux</span> · ${u.time}s`;
  if (reason) h += `<br><span style="color:#ffb347">${esc(reason)}</span>`;
  h += `<hr>${esc(u.desc)}`;
  if (long) h += `<br><span class="c">${u.effect.kind === 'attack' ? 'Attack upgrades add ' + Math.round(u.effect.amount * 100) + '% damage (never more than 12% alone).' : u.effect.kind === 'armor' ? 'Armor reduces damage by roughly 8-9% per point.' : 'Unlocks new technology.'}</span>`;
  return h;
}

export class Hud {
  root: HTMLDivElement;
  cardButtons: CardBtn[] = [];
  private el: Record<string, HTMLElement> = {};
  private tipEl: HTMLDivElement;
  private tipTimer = 0;
  private hoverSlot = -1;
  private alerts: Array<{ text: string; kind: string; x: number; y: number; t: number; el: HTMLElement }> = [];
  private toastEl: HTMLDivElement;
  private toastT = 0;
  private lastSig = '';
  private lastSelHtml = '';
  private tick = 0;
  private mm!: Minimap;
  private incomeHist: Array<[number, number]> = [];
  pings: Array<{ x: number; y: number; t: number }> = [];

  constructor(private game: Game, parent: HTMLElement) {
    this.root = document.createElement('div');
    this.root.id = 'hud';
    this.root.innerHTML = `
      <div class="menubtn hudbox" id="h-menu">Menu · F10</div>
      <div class="objective hudbox" id="h-obj" style="display:none"></div>
      <div class="topbar hudbox">
        <div class="res" id="h-ore"><img class="ic" src="${iconURL('tap', '#44e9d0', 36)}"><div><span class="val">0</span><span class="sub">PRISM ORE</span></div></div>
        <div class="res" id="h-flux"><img class="ic" src="${iconURL('tap', '#ff8be0', 36)}"><div><span class="val">0</span><span class="sub">FLUX</span></div></div>
        <div class="res" id="h-sup"><img class="ic" src="${iconURL('supply', '#ffc75a', 36)}"><div><span class="val">0/0</span><span class="sub">SUPPLY</span></div></div>
        <div class="res click" id="h-wrk" title="Click: select idle workers"><img class="ic" src="${iconURL('worker', '#9fd0ff', 36)}"><div><span class="val">0</span><span class="sub">WORKERS</span></div></div>
        <div class="res" id="h-time"><div><span class="val">0:00</span><span class="sub">TIME</span></div></div>
      </div>
      <div class="bases" id="h-bases"></div>
      <div class="alerts" id="h-alerts"></div>
      <div class="tut hudbox" id="h-tut" style="display:none"></div>
      <div class="toast" id="h-toast" style="opacity:0"></div>
      <div class="bottom">
        <div class="minimap hudbox"><canvas id="h-mm" width="190" height="190"></canvas></div>
        <div class="selpanel hudbox empty" id="h-sel"></div>
        <div class="card hudbox" id="h-card"></div>
      </div>`;
    parent.appendChild(this.root);
    for (const id of ['h-menu', 'h-obj', 'h-ore', 'h-flux', 'h-sup', 'h-wrk', 'h-time', 'h-bases', 'h-alerts', 'h-sel', 'h-card', 'h-toast', 'h-tut']) this.el[id] = this.root.querySelector('#' + id) as HTMLElement;
    this.toastEl = this.el['h-toast'] as HTMLDivElement;
    this.tipEl = document.createElement('div');
    this.tipEl.className = 'tip';
    this.tipEl.style.display = 'none';
    document.body.appendChild(this.tipEl);
    this.el['h-menu'].onclick = () => game.openPause();
    this.el['h-wrk'].onclick = () => this.selectIdleWorkers();
    this.mm = new Minimap(game, this.root.querySelector('#h-mm') as HTMLCanvasElement, this);
    // card delegation
    const card = this.el['h-card'];
    card.addEventListener('click', (e) => { const b = (e.target as HTMLElement).closest('[data-slot]') as HTMLElement | null; if (b) this.click(parseInt(b.dataset.slot!, 10)); });
    card.addEventListener('mouseover', (e) => { const b = (e.target as HTMLElement).closest('[data-slot]') as HTMLElement | null; if (b) this.showTipFor(parseInt(b.dataset.slot!, 10), e as MouseEvent); });
    card.addEventListener('mousemove', (e) => this.moveTip(e as MouseEvent));
    card.addEventListener('mouseleave', () => this.hideTip());
    game.input.onSelectionChange = () => { this.lastSig = ''; this.refresh(true); };
  }

  dispose() { this.root.remove(); this.tipEl.remove(); }

  // ------------------------------------------------------------ small helpers
  toast(text: string) {
    this.toastEl.textContent = text;
    this.toastEl.style.opacity = '1';
    this.toastT = 2.2;
  }
  setObjective(title: string, text: string) {
    const o = this.el['h-obj'];
    if (!text) { o.style.display = 'none'; return; }
    o.style.display = 'block';
    o.innerHTML = `<small>${esc(title)}</small>${esc(text)}`;
  }
  setTutorialPanel(html: string) {
    const t = this.el['h-tut'];
    t.style.display = html ? 'block' : 'none';
    t.innerHTML = html;
  }
  pushAlert(text: string, kind: string, x: number, y: number) {
    const now = performance.now();
    const dup = this.alerts.find((a) => a.text === text && now - a.t < 3500);
    if (dup) { dup.t = now; return; }
    const el = document.createElement('div');
    el.className = 'alert ' + kind;
    el.textContent = text;
    el.onclick = () => this.game.renderer.cam.setTarget(x, y + 4, false);
    this.el['h-alerts'].appendChild(el);
    this.alerts.push({ text, kind, x, y, t: now, el });
    while (this.alerts.length > 5) { this.alerts.shift()!.el.remove(); }
    if (x || y) this.pings.push({ x, y, t: now });
  }
  private selectIdleWorkers() {
    const sim = this.game.sim;
    const ids = sim.ids.filter((id) => sim.alive[id] && sim.owner[id] === this.game.local && TD[sim.type[id]].isWorker && sim.ext[id].orders.length === 0);
    if (ids.length) { this.game.input.select(ids); this.game.input.focusSelection(); } else this.toast('No idle workers');
  }

  // ------------------------------------------------------------ command card
  private buildCard(): CardBtn[] {
    const g = this.game, sim = g.sim, inp = g.input, K = g.settings.keys;
    const loc = g.local;
    const out: CardBtn[] = [];
    if (loc < 0) return out;
    const pl = sim.players[loc];
    const f = pl.faction;
    const sel = inp.ownSelected();
    if (!sel.length) return out;
    const unitSel = sel.filter((id) => TD[sim.type[id]].isUnit);
    const structSel = sel.filter((id) => TD[sim.type[id]].isStruct);
    const afford = (c: { ore: number; flux: number }) => (pl.ore < c.ore ? 'Not enough Prism Ore' : pl.flux < c.flux ? 'Not enough Flux' : '');
    const add = (b: Omit<CardBtn, 'tip'> & { tip?: () => string }) => out.push({ tip: () => esc(b.label), ...b } as CardBtn);

    if (inp.cardMode === 'build' && unitSel.some((id) => TD[sim.type[id]].isWorker)) {
      f.structures.forEach((sid, i) => {
        const d = defById(sid);
        const miss = sim.missingReq(loc, d.requires);
        const why = miss ? `Requires ${miss}` : afford(d.cost);
        const di = defIndex[sid];
        add({
          slot: i, key: SLOT_KEYS[i], label: d.name, icon: defIcon(sid), enabled: !miss, reason: why, cost: d.cost, active: inp.mode.kind === 'build' && inp.mode.def === di,
          onClick: () => { if (miss) { audio.ui_('error'); this.toast(why); return; } inp.enterMode({ kind: 'build', def: di }); audio.ui_('click'); },
          tip: () => defTipHtml(d, true, SLOT_KEYS[i], why),
        });
      });
      add({ slot: 11, key: 'Escape', label: 'Back', icon: iconURL('back', '#9fb3c4'), enabled: true, reason: '', onClick: () => { inp.cardMode = 'main'; inp.mode = { kind: 'none' }; this.refresh(true); }, tip: () => '<b class="n">Back</b> [Esc]' });
      return out;
    }

    if (unitSel.length) {
      const types = inp.types().filter((t) => TD[t].isUnit);
      const at = types.includes(inp.activeType) ? inp.activeType : types[0];
      const td = TD[at];
      const hasWorker = unitSel.some((id) => TD[sim.type[id]].isWorker);
      const m = inp.mode.kind;
      add({ slot: 0, key: K.move, label: 'Move', icon: iconURL('move', '#7dff9a'), enabled: true, reason: '', onClick: () => { this.toast('Right-click the ground to move'); }, tip: () => '<b class="n">Move</b> [Right-click]<br>Move to a point. Hold Shift to queue waypoints, Alt to force-move without auto-acquiring targets.' });
      add({ slot: 1, key: K.stop, label: 'Stop', icon: iconURL('stop', '#9fb3c4'), enabled: true, reason: '', onClick: () => inp.doOrderAll('stop'), tip: () => '<b class="n">Stop</b> [' + K.stop.toUpperCase() + ']<br>Cancel all orders.' });
      add({ slot: 2, key: K.hold, label: 'Hold', icon: iconURL('hold', '#9fb3c4'), enabled: true, reason: '', onClick: () => inp.doOrderAll('hold'), tip: () => '<b class="n">Hold position</b> [' + K.hold.toUpperCase() + ']<br>Stay put and only shoot what comes into range.' });
      add({ slot: 3, key: K.attackMove, label: 'Attack', icon: iconURL('attackmove', '#ff6a5a'), enabled: unitSel.some((id) => TD[sim.type[id]].canAttack), reason: 'No armed units', active: m === 'attackMove', onClick: () => inp.enterMode({ kind: 'attackMove' }), tip: () => '<b class="n">Attack-move</b> [' + K.attackMove.toUpperCase() + ']<br>Then click: advance and engage anything met on the way.' });
      add({ slot: 4, key: K.patrol, label: 'Patrol', icon: iconURL('patrol', '#ffb347'), enabled: true, reason: '', active: m === 'patrol', onClick: () => inp.enterMode({ kind: 'patrol' }), tip: () => '<b class="n">Patrol</b> [' + K.patrol.toUpperCase() + ']<br>Then click: patrol between here and there, attacking on the way.' });
      if (hasWorker) add({ slot: 5, key: K.build, label: 'Build', icon: iconURL('build', '#ffe27a'), enabled: true, reason: '', onClick: () => { inp.cardMode = 'build'; this.refresh(true); }, tip: () => '<b class="n">Build</b> [' + K.build.toUpperCase() + ']<br>Open the construction palette.' });
      (td.def.abilities ?? []).forEach((ab, i) => {
        const cd = inp.commandIds(true).reduce((mx, id) => Math.max(mx, sim.ext[id].cds[i]), 0);
        const e0 = inp.commandIds(true)[0];
        const energyOk = !ab.energy || (e0 !== undefined && sim.ext[e0].energy >= ab.energy);
        const fluxOk = !ab.flux || pl.flux >= ab.flux;
        const why = cd > 0 ? 'Recharging' : !energyOk ? 'Not enough energy' : !fluxOk ? 'Not enough Flux' : '';
        const toggled = ab.target === 'toggle' && e0 !== undefined && sim.ext[e0].mode > 0;
        add({
          slot: 8 + i, key: ab.hotkey, label: ab.name, icon: iconURL('ability', td.def.faction === 'verdant' ? '#c9a0ff' : '#ffc75a'), enabled: !why, reason: why, cd: cd / Math.max(1, ab.cooldown * 20), active: toggled || (inp.mode.kind === 'ability' && inp.mode.idx === i),
          onClick: () => { if (why) { audio.ui_('error'); this.toast(why); return; } inp.abilityUse(i); },
          tip: () => `<b class="n">${esc(ab.name)}</b> <span class="k">[${ab.hotkey.toUpperCase()}]</span>${ab.flux ? ` · <span style="color:#ff8be0">${ab.flux} flux</span>` : ''}${ab.energy ? ` · ${ab.energy} energy` : ''}<br>${esc(ab.desc)}${ab.cooldown > 2 ? `<br><span class="c">Cooldown ${ab.cooldown}s</span>` : ''}`,
        });
      });
      return out;
    }

    // structures
    const s0 = structSel[0];
    if (s0 === undefined) return out;
    const ts = TD[sim.type[s0]];
    const e0 = sim.ext[s0];
    if (!e0.done) {
      add({ slot: 11, key: 'x', label: 'Cancel', icon: iconURL('cancel', '#ff6a5a'), enabled: true, reason: '', onClick: () => { inp.cancel(s0, -1); inp.select([]); }, tip: () => '<b class="n">Cancel construction</b> [X]<br>Refunds 75% of the cost.' });
      return out;
    }
    const prods = structSel.filter((id) => TD[sim.type[id]].def.produces);
    let slot = 0;
    for (const uid of ts.def.produces ?? []) {
      const d = defById(uid);
      const miss = sim.missingReq(loc, d.requires);
      const why = miss ? `Requires ${miss}` : afford(d.cost);
      const di = defIndex[uid];
      const key = SLOT_KEYS[slot];
      add({
        slot: slot++, key, label: d.name, icon: defIcon(uid), enabled: !miss, reason: why, cost: d.cost,
        onClick: () => {
          if (miss) { audio.ui_('error'); this.toast(why); return; }
          if (why) { audio.ui_('error'); this.toast(why); return; }
          const best = prods.filter((b) => sim.ext[b].done && TD[sim.type[b]].def.produces?.includes(uid)).sort((a, b) => sim.ext[a].q.length - sim.ext[b].q.length)[0];
          if (best !== undefined) { inp.train(best, di); audio.ui_('queue'); }
        },
        tip: () => defTipHtml(d, true, key, why),
      });
    }
    for (const uid of ts.def.researches ?? []) {
      const u = allUpgrades[upgradeIndex[uid]];
      if (pl.upg[upgradeIndex[uid]]) continue;
      const queued = sim.ids.some((id) => sim.alive[id] && sim.owner[id] === loc && sim.ext[id].q.some((q) => q.kind === 'research' && q.idx === upgradeIndex[uid]));
      const miss = sim.missingReq(loc, u.requires);
      const why = queued ? 'Already researching' : miss ? `Requires ${miss}` : afford(u.cost);
      const key = SLOT_KEYS[slot];
      if (slot >= 11) break;
      add({
        slot: slot++, key, label: u.name, icon: iconURL(u.effect.kind === 'attack' ? 'attack' : u.effect.kind === 'armor' ? 'armor' : 'unlock', f.id === 'verdant' ? '#c9a0ff' : '#ffc75a'), enabled: !miss && !queued, reason: why, cost: u.cost,
        onClick: () => { if (why) { audio.ui_('error'); this.toast(why); return; } const best = prods.filter((b) => TD[sim.type[b]].def.researches?.includes(uid) && sim.ext[b].done).sort((a, b) => sim.ext[a].q.length - sim.ext[b].q.length)[0]; if (best !== undefined) { inp.research(best, upgradeIndex[uid]); audio.ui_('queue'); } },
        tip: () => upgradeTipHtml(u, true, key, why),
      });
    }
    if (ts.def.produces) add({ slot: 11, key: K.rally, label: 'Rally', icon: iconURL('rally', '#7dff9a'), enabled: true, reason: '', active: inp.mode.kind === 'rally', onClick: () => inp.enterMode({ kind: 'rally' }), tip: () => '<b class="n">Rally point</b> [' + K.rally.toUpperCase() + ']<br>Then click the ground (or an ore seam for workers). Right-click also sets it.' });
    return out;
  }

  pressKey(key: string): boolean {
    for (const b of this.cardButtons) {
      if (b.key === key && (b.enabled || b.reason)) { b.onClick(); this.refresh(true); return true; }
    }
    return false;
  }
  private click(slot: number) {
    const b = this.cardButtons.find((x) => x.slot === slot);
    if (!b) return;
    audio.init();
    b.onClick();
    this.refresh(true);
  }

  // ------------------------------------------------------------ tooltips
  private showTipFor(slot: number, e: MouseEvent) {
    const b = this.cardButtons.find((x) => x.slot === slot);
    if (!b) return;
    this.hoverSlot = slot;
    const d = b;
    this.tipEl.innerHTML = this.shortTip(d);
    this.tipEl.style.display = 'block';
    this.moveTip(e);
    clearTimeout(this.tipTimer);
    this.tipTimer = window.setTimeout(() => { this.tipEl.innerHTML = d.tip(); this.moveTip(e); }, 350);
  }
  private shortTip(b: CardBtn): string {
    const c = b.cost ? `<br><span style="color:#44e9d0">${b.cost.ore} ore</span>${b.cost.flux ? ` <span style="color:#ff8be0">${b.cost.flux} flux</span>` : ''}` : '';
    return `<b class="n">${esc(b.label)}</b> <span class="k">[${esc(b.key === ' ' ? 'Space' : b.key.length === 1 ? b.key.toUpperCase() : b.key)}]</span>${c}${b.reason && !b.enabled ? `<br><span style="color:#ffb347">${esc(b.reason)}</span>` : ''}`;
  }
  private moveTip(e: MouseEvent) {
    const r = this.tipEl.getBoundingClientRect();
    this.tipEl.style.left = Math.max(4, Math.min(window.innerWidth - r.width - 4, e.clientX - r.width + 20)) + 'px';
    this.tipEl.style.top = Math.max(4, e.clientY - r.height - 14) + 'px';
  }
  hideTip() { clearTimeout(this.tipTimer); this.tipEl.style.display = 'none'; this.hoverSlot = -1; }

  // ------------------------------------------------------------ refresh
  refresh(force = false) {
    const g = this.game, sim = g.sim, inp = g.input;
    const pl = sim.players[Math.max(0, g.local)];
    // signature of things that change the card
    const sig = [inp.selection.join(','), inp.cardMode, inp.mode.kind, inp.activeType, Math.floor(pl.ore / 25), Math.floor(pl.flux / 25), pl.supplyUsed, pl.upg.join(''), inp.selection.map((id) => sim.alive[id] ? (sim.ext[id].q.length + ':' + (sim.ext[id].done ? 1 : 0) + ':' + sim.ext[id].mode + ':' + Math.ceil(Math.max(...sim.ext[id].cds) / 40)) : 'x').join(',')].join('|');
    if (!force && sig === this.lastSig) return;
    this.lastSig = sig;
    this.cardButtons = this.buildCard();
    const card = this.el['h-card'];
    const map = new Map(this.cardButtons.map((b) => [b.slot, b]));
    let html = '';
    for (let s = 0; s < 12; s++) {
      const b = map.get(s);
      if (!b) { html += '<div></div>'; continue; }
      const k = b.key === 'Escape' ? 'Esc' : b.key === ' ' ? '␣' : b.key.length === 1 ? b.key.toUpperCase() : b.key;
      html += `<button class="cbtn${b.enabled ? '' : ' dis'}${b.active ? ' act' : ''}" data-slot="${s}"><img src="${b.icon}" alt=""><span class="lbl">${esc(b.label)}</span><span class="key">${esc(k)}</span>${b.cost ? `<span class="cost">${b.cost.ore}${b.cost.flux ? `<br><span style="color:#ff8be0">${b.cost.flux}</span>` : ''}</span>` : ''}${b.cd && b.cd > 0 ? `<span class="cd" style="height:${Math.round(b.cd * 100)}%"></span>` : ''}</button>`;
    }
    card.innerHTML = html;
    this.renderSelection();
  }

  private renderSelection() {
    const g = this.game, sim = g.sim, inp = g.input;
    const panel = this.el['h-sel'];
    const sel = inp.selection.filter((id) => sim.alive[id]);
    if (!sel.length) { this.lastSelHtml = ''; panel.className = 'selpanel hudbox empty'; panel.innerHTML = '<div>Drag to box-select · Right-click to command · B to build · Space jumps to the latest alert</div>'; return; }
    panel.className = 'selpanel hudbox';
    const loc = g.local;
    if (sel.length === 1) {
      const id = sel[0];
      const td = TD[sim.type[id]], e = sim.ext[id], d = td.def;
      const own = sim.owner[id] === loc;
      const hpf = sim.hp[id] / td.maxHp;
      const col = d.faction === 'verdant' ? '#c9a0ff' : d.faction === 'helix' ? '#ffc75a' : '#7de9d6';
      let stats = '';
      if (td.isUnit || td.isStruct) {
        const pl = sim.players[Math.max(0, sim.owner[id])];
        const atk = 1 + (sim.owner[id] >= 0 ? pl.atkBonus : 0);
        const armor = d.armor + (td.isUnit && sim.owner[id] >= 0 ? pl.armorBonus : 0);
        stats = `<div class="statline"><span>Armor <b>${armor}</b></span>${d.speed ? `<span>Speed <b>${d.speed}</b></span>` : ''}<span>Sight <b>${d.sight}</b></span>${d.supply ? `<span>Supply <b>${d.supply}</b></span>` : ''}${d.weapon && atk > 1 ? `<span>Attack bonus <b>+${Math.round((atk - 1) * 100)}%</b></span>` : ''}</div>`;
        if (d.weapon) stats += `<div class="statline" style="font-size:11px;color:#9fb3c4">${weaponLine(d).split('<br>').pop()}</div>`;
      }
      let extra = '';
      if (td.isNeutral && e.maxAmount) extra = `<div class="statline"><span>${d.id === 'flux_vent' ? 'Flux' : 'Ore'} remaining <b>${Math.floor(e.amount)}</b> / ${e.maxAmount}</span></div>`;
      if (td.isNeutral && d.id === 'watch_pylon') extra = `<div class="statline"><span>${e.capOwner < 0 ? 'Uncaptured - channel 3s with any unit' : e.capOwner === loc ? 'Captured: vision over the route' : 'Held by the enemy'}</span></div>`;
      if (td.isUnit && own) {
        const bits: string[] = [];
        if (td.isWorker && e.carry > 0) bits.push(`Carrying <b>${e.carry.toFixed(0)}</b> ${e.carryT === 1 ? 'ore' : 'flux'}`);
        if (td.maxEnergy) bits.push(`Energy <b>${Math.floor(e.energy)}</b>/${td.maxEnergy}`);
        if (d.shield) bits.push(`Shield <b>${Math.floor(e.shield)}</b>/${d.shield}`);
        const o = e.orders[0];
        const names: Record<number, string> = { [Ord.Move]: 'Moving', [Ord.AttackMove]: 'Attack-moving', [Ord.Attack]: 'Attacking', [Ord.Hold]: 'Holding', [Ord.Patrol]: 'Patrolling', [Ord.Gather]: 'Gathering', [Ord.Build]: 'Building', [Ord.Repair]: 'Repairing', [Ord.Ability]: 'Casting', [Ord.Capture]: 'Capturing', [Ord.Resume]: 'Building' };
        bits.push(`Order: <b>${o ? names[o.k] : e.target >= 0 ? 'Engaging' : 'Idle'}</b>`);
        extra += `<div class="statline">${bits.join('<span style="color:#456">|</span>')}</div>`;
      }
      let queue = '';
      if (td.isStruct && own) {
        if (!e.done) extra += `<div class="statline"><span>Under construction <b>${Math.floor((e.prog / Math.max(1, e.total)) * 100)}%</b></span></div>`;
        else {
          if (td.isHall) extra += this.baseInfo(id);
          queue = '<div class="queue">' + e.q.map((q, i) => {
            const isU = q.kind === 'unit';
            const name = isU ? allDefs[q.idx].name : allUpgrades[q.idx].name;
            const ic = isU ? defIcon(allDefs[q.idx].id) : iconURL(allUpgrades[q.idx].effect.kind === 'attack' ? 'attack' : allUpgrades[q.idx].effect.kind === 'armor' ? 'armor' : 'unlock', '#ffc75a');
            const pg = Math.round((1 - q.left / q.total) * 100);
            return `<div class="qitem${q.paused ? ' paused' : ''}" data-q="${i}" title="${esc(name)} - click to cancel (full refund)"><img src="${ic}" alt="">${i === 0 ? `<div class="pg" style="width:${pg}%"></div>` : ''}${q.paused ? `<div class="pz">${q.paused === 'supply' ? 'SUPPLY<br>BLOCKED' : 'LOCKED'}</div>` : ''}</div>`;
          }).join('') + '</div>';
          if (e.q[0]) queue += `<div class="statline" style="font-size:11px;color:#9fb3c4">${e.q[0].paused === 'supply' ? 'Paused: need more supply (build a ' + sim.players[loc].faction.supply.replace(/_/g, ' ') + ')' : `${(e.q[0].kind === 'unit' ? allDefs[e.q[0].idx].name : allUpgrades[e.q[0].idx].name)} - ${Math.ceil(e.q[0].left / 20)}s`}</div>`;
        }
      }
      const html1 = `
        <div class="portrait" data-sel="${id}"><img src="${defIcon(d.id)}" alt=""><div class="nm" style="color:${col}">${esc(d.role)}</div></div>
        <div class="info">
          <h4 style="color:${own ? '#fff' : '#ff9a8a'}">${esc(d.name)}${own ? '' : sim.owner[id] >= 0 ? ' (enemy)' : ''}</h4>
          <div class="role">${d.tags.join(' · ')}</div>
          ${td.isNeutral && !e.maxAmount ? '' : `<div class="bar"><i style="width:${Math.max(0, hpf * 100)}%;background:${hpf > 0.6 ? '#3fe06b' : hpf > 0.3 ? '#e8c43a' : '#e8503a'}"></i><span>${Math.ceil(sim.hp[id])} / ${td.maxHp}</span></div>`}
          ${stats}${extra}${queue}
        </div>`;
      if (html1 === this.lastSelHtml) return; // unchanged: keep the DOM (and any in-flight click) intact
      this.lastSelHtml = html1;
      panel.innerHTML = html1;
      panel.querySelectorAll('[data-q]').forEach((n) => ((n as HTMLElement).onclick = () => { inp.cancel(id, parseInt((n as HTMLElement).dataset.q!, 10)); this.refresh(true); }));
      return;
    }
    // multi selection
    const groups = new Map<number, number>();
    for (const id of sel) groups.set(sim.type[id], (groups.get(sim.type[id]) ?? 0) + 1);
    const types = inp.types();
    const at = types.includes(inp.activeType) ? inp.activeType : types[0];
    const shown = sel.slice(0, 60);
    const html2 = `
      <div class="info" style="flex:none;width:170px">
        <h4>${sel.length} selected</h4>
        <div class="role">${[...groups.entries()].map(([t, n]) => `${n}× ${TD[t].def.name}`).join(', ')}</div>
        <div class="statline"><span>Total HP <b>${Math.round(sel.reduce((s, id) => s + sim.hp[id], 0))}</b></span></div>
        ${groups.size > 1 ? '<div class="role">Tab cycles subtype: <b style="color:#fff">' + TD[at].def.name + '</b></div>' : ''}
      </div>
      <div class="grid">${shown.map((id) => { const t = TD[sim.type[id]]; const f = sim.hp[id] / t.maxHp; return `<div class="mini${sim.type[id] === at && groups.size > 1 ? ' active' : ''}" data-id="${id}" title="${esc(t.def.name)}"><img src="${defIcon(t.def.id)}" alt=""><div class="hp"><i style="width:${f * 100}%;background:${f > 0.6 ? '#3fe06b' : f > 0.3 ? '#e8c43a' : '#e8503a'}"></i></div></div>`; }).join('')}${sel.length > 60 ? `<div class="role" style="align-self:center">+${sel.length - 60}</div>` : ''}</div>`;
    if (html2 === this.lastSelHtml) return;
    this.lastSelHtml = html2;
    panel.innerHTML = html2;
    panel.querySelectorAll('[data-id]').forEach((n) => {
      (n as HTMLElement).onclick = (ev) => {
        const id = parseInt((n as HTMLElement).dataset.id!, 10);
        if ((ev as MouseEvent).shiftKey) inp.select(inp.selection.filter((s) => s !== id));
        else if ((ev as MouseEvent).ctrlKey) inp.select(inp.selection.filter((s) => sim.type[s] === sim.type[id]));
        else inp.select([id]);
      };
    });
  }

  private baseInfo(hall: number): string {
    const b = this.baseStats().find((x) => x.hall === hall);
    if (!b) return '';
    const ineff = b.workers > b.ideal ? Math.round((1 - b.ideal / b.workers) * 100) : 0;
    return `<div class="statline"><span>Workers here <b>${b.workers}</b> / ideal <b>${b.ideal}</b></span><span>Travel inefficiency <b style="color:${ineff > 0 ? '#ffb347' : '#5dff8a'}">${ineff > 0 ? ineff + '% wasted (over-saturated)' : '0%'}</b></span></div>`;
  }

  private baseStats(): Array<{ hall: number; workers: number; ideal: number; name: string }> {
    const sim = this.game.sim, loc = this.game.local;
    const out: Array<{ hall: number; workers: number; ideal: number; name: string }> = [];
    if (loc < 0) return out;
    const f = sim.players[loc].faction;
    const halls = sim.ids.filter((id) => sim.alive[id] && sim.owner[id] === loc && TD[sim.type[id]].isHall && sim.ext[id].done);
    halls.forEach((h, i) => {
      let seams = 0, taps = 0;
      for (const n of sim.ids) {
        if (!sim.alive[n]) continue;
        if (sim.type[n] === defIndex['ore_seam'] && Math.hypot(sim.x[n] - sim.x[h], sim.y[n] - sim.y[h]) < 16 && sim.ext[n].amount > 0) seams++;
        if (sim.owner[n] === loc && sim.type[n] === defIndex[f.tap] && sim.ext[n].done && Math.hypot(sim.x[n] - sim.x[h], sim.y[n] - sim.y[h]) < 20) taps++;
      }
      let workers = 0;
      for (const w of sim.ids) {
        if (!sim.alive[w] || sim.owner[w] !== loc || !TD[sim.type[w]].isWorker) continue;
        const o = sim.ext[w].orders[0];
        if (o && o.k === Ord.Gather && Math.hypot(sim.x[o.t] - sim.x[h], sim.y[o.t] - sim.y[h]) < 20) workers++;
      }
      out.push({ hall: h, workers, ideal: seams * 2 + taps * 3, name: i === 0 ? 'Main' : `Base ${i + 1}` });
    });
    return out;
  }

  // ------------------------------------------------------------ per-frame update
  update(dt: number) {
    this.tick++;
    const g = this.game, sim = g.sim;
    const loc = g.local;
    const pl = sim.players[Math.max(0, loc)];
    this.toastT -= dt;
    if (this.toastT <= 0) this.toastEl.style.opacity = '0';
    const now = performance.now();
    for (let i = this.alerts.length - 1; i >= 0; i--) if (now - this.alerts[i].t > 7000) { this.alerts[i].el.remove(); this.alerts.splice(i, 1); }
    this.pings = this.pings.filter((p) => now - p.t < 4000);
    if (this.tick % 6 === 0) {
      const set = (id: string, v: string, sub?: string) => { const e = this.el[id]; const val = e.querySelector('.val')!; if (val.textContent !== v) val.textContent = v; if (sub !== undefined) e.querySelector('.sub')!.textContent = sub; };
      this.incomeHist.push([sim.tick, pl.stats.ore]);
      while (this.incomeHist.length > 1 && sim.tick - this.incomeHist[0][0] > 600) this.incomeHist.shift();
      const h0 = this.incomeHist[0];
      const rate = h0 && sim.tick > h0[0] ? Math.round(((pl.stats.ore - h0[1]) / (sim.tick - h0[0])) * 20 * 60) : 0;
      set('h-ore', String(Math.floor(pl.ore)), `PRISM ORE  +${rate}/min`);
      set('h-flux', String(Math.floor(pl.flux)));
      set('h-sup', `${pl.supplyUsed}/${pl.supplyCap}`);
      this.el['h-sup'].classList.toggle('warn', loc >= 0 && sim.ids.some((id) => sim.alive[id] && sim.owner[id] === loc && sim.ext[id].q[0]?.paused === 'supply'));
      let workers = 0, idle = 0;
      for (const id of sim.ids) if (sim.alive[id] && sim.owner[id] === loc && TD[sim.type[id]].isWorker) { workers++; if (!sim.ext[id].orders.length) idle++; }
      set('h-wrk', String(workers), idle ? `${idle} IDLE` : 'WORKERS');
      this.el['h-wrk'].classList.toggle('warn', idle > 0 && sim.tick > 400);
      set('h-time', mmss(sim.tick));
      // bases
      if (this.tick % 12 === 0) {
        this.el['h-bases'].innerHTML = this.baseStats().map((b) => {
          const cls = b.workers <= b.ideal ? 'ok' : b.workers > b.ideal * 1.4 ? 'bad' : 'over';
          return `<div class="basechip ${cls}" title="Workers assigned / ideal saturation. Over-saturation wastes travel time.">${b.name} <b>${b.workers}/${b.ideal}</b></div>`;
        }).join('');
      }
      this.refresh(false);
    }
    // live refresh for single selection bars
    if (this.tick % 10 === 0 && g.input.selection.length) this.renderSelection();
    this.mm.draw(dt);
  }
}

// ----------------------------------------------------------------------------------------------------------------
class Minimap {
  private base: HTMLCanvasElement;
  private fog: HTMLCanvasElement;
  private fogImg: ImageData;
  private size = 190;
  private dragging = false;
  private acc = 0;
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;

  constructor(private game: Game, private cv: HTMLCanvasElement, private hud: Hud) {
    const N = game.sim.map.size;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(this.size * this.dpr); cv.height = Math.round(this.size * this.dpr);
    this.ctx = cv.getContext('2d')!;
    this.base = document.createElement('canvas');
    this.base.width = N; this.base.height = N;
    const bctx = this.base.getContext('2d')!;
    const img = bctx.createImageData(N, N);
    const m = game.sim.map;
    for (let i = 0; i < N * N; i++) {
      const h = m.heightC[i];
      let r = 38 + h * 6, gg = 46 + h * 7, b = 56 + h * 6;
      if (m.chasm[i]) { r = 8; gg = 14; b = 24; }
      else if (m.blocked[i]) { r = 26; gg = 28; b = 34; if (h > 2) { r = 70; gg = 74; b = 80; } }
      else if (m.brush[i]) { r = 30; gg = 70; b = 62; }
      else if (m.bridge[i]) { r = 160; gg = 130; b = 70; }
      else if (h < -0.5) { r = 24; gg = 60; b = 66; }
      img.data[i * 4] = r; img.data[i * 4 + 1] = gg; img.data[i * 4 + 2] = b; img.data[i * 4 + 3] = 255;
    }
    bctx.putImageData(img, 0, 0);
    this.fog = document.createElement('canvas'); this.fog.width = N; this.fog.height = N;
    this.fogImg = this.fog.getContext('2d')!.createImageData(N, N);
    const onPtr = (e: PointerEvent) => this.pointer(e);
    cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); audio.init(); if (e.button === 0) { this.dragging = true; if (this.game.input.mode.kind === 'attackMove') { this.order(e, 'attackMove'); this.game.input.mode = { kind: 'none' }; this.dragging = false; return; } onPtr(e); } else if (e.button === 2) this.order(e, e.shiftKey ? 'move' : 'move'); });
    cv.addEventListener('pointermove', (e) => { if (this.dragging) onPtr(e); });
    cv.addEventListener('pointerup', () => { this.dragging = false; });
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  private toWorld(e: PointerEvent) {
    const r = this.cv.getBoundingClientRect();
    const N = this.game.sim.map.size;
    return { x: Math.min(N, Math.max(0, ((e.clientX - r.left) / r.width) * N)), y: Math.min(N, Math.max(0, ((e.clientY - r.top) / r.height) * N)) };
  }
  private pointer(e: PointerEvent) { const w = this.toWorld(e); this.game.renderer.cam.setTarget(w.x, w.y + 4, true); }
  private order(e: PointerEvent, ord: 'move' | 'attackMove') {
    const w = this.toWorld(e);
    this.game.input.order(ord, w.x, w.y, -1, e.shiftKey, false);
  }

  draw(dt: number) {
    this.acc += dt;
    if (this.acc < 0.08) return;
    this.acc = 0;
    const g = this.game, sim = g.sim, N = sim.map.size;
    const ctx = this.ctx;
    const S = this.cv.width;
    const k = S / N;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.base, 0, 0, S, S);
    const loc = g.local;
    // fog
    const all = loc < 0 || !g.fogEnabled || sim.pulseActive();
    if (!all) {
      const pl = sim.players[loc];
      const d = this.fogImg.data;
      for (let i = 0; i < N * N; i++) {
        const v = pl.vis[i] === FOG_VISIBLE ? 0 : pl.seen[i] ? 120 : 238;
        d[i * 4] = 2; d[i * 4 + 1] = 4; d[i * 4 + 2] = 8; d[i * 4 + 3] = v;
      }
      this.fog.getContext('2d')!.putImageData(this.fogImg, 0, 0);
      ctx.drawImage(this.fog, 0, 0, S, S);
    }
    const hex = (c: number) => '#' + c.toString(16).padStart(6, '0');
    const tcol = g.renderer.teamHex;
    // resources
    for (const id of sim.ids) {
      if (!sim.alive[id]) continue;
      const t = TD[sim.type[id]];
      const o = sim.owner[id];
      const x = sim.x[id] * k, y = sim.y[id] * k;
      if (t.isNeutral) {
        if (!all && !sim.players[Math.max(0, loc)].seen[sim.cellIdx(sim.x[id], sim.y[id])]) continue;
        const nid = t.def.id;
        ctx.fillStyle = nid === 'ore_seam' ? '#44e9d0' : nid === 'flux_vent' ? '#ff8be0' : nid === 'crystal_barrier' ? '#a58cff' : nid === 'salvage_pod' ? '#ffc04d' : sim.ext[id].capOwner >= 0 ? hex(tcol[sim.ext[id].capOwner]) : '#dfe8f0';
        if (nid === 'watch_pylon') { ctx.beginPath(); ctx.moveTo(x, y - 4 * this.dpr); ctx.lineTo(x + 3.5 * this.dpr, y); ctx.lineTo(x, y + 4 * this.dpr); ctx.lineTo(x - 3.5 * this.dpr, y); ctx.closePath(); ctx.fill(); }
        else ctx.fillRect(x - 1 * this.dpr, y - 1 * this.dpr, (nid === 'crystal_barrier' ? 3 : 2) * this.dpr, (nid === 'crystal_barrier' ? 3 : 2) * this.dpr);
        continue;
      }
      if (o !== loc && loc >= 0 && !all && !sim.visibleTo(loc, id)) continue;
      ctx.fillStyle = hex(tcol[Math.max(0, o)]);
      const s = (t.isStruct ? 4.2 : t.def.radius > 0.8 ? 3 : 2.2) * this.dpr;
      ctx.fillRect(x - s / 2, y - s / 2, s, s);
    }
    // remembered enemy structures
    for (const gh of g.renderer.getGhosts()) {
      if (sim.alive[gh.id] && sim.visibleTo(loc, gh.id)) continue;
      ctx.fillStyle = '#7b8794';
      const s = 4 * this.dpr;
      ctx.fillRect(gh.x * k - s / 2, gh.y * k - s / 2, s, s);
    }
    // pings
    const now = performance.now();
    for (const p of this.hud.pings) {
      const a = (now - p.t) / 4000;
      ctx.strokeStyle = `rgba(255,90,70,${1 - a})`; ctx.lineWidth = 2 * this.dpr;
      ctx.beginPath(); ctx.arc(p.x * k, p.y * k, (4 + ((now - p.t) / 200) % 10) * this.dpr, 0, Math.PI * 2); ctx.stroke();
    }
    // camera quad
    const cam = g.renderer.cam;
    const o = { x: 0, z: 0 };
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.2 * this.dpr;
    ctx.beginPath();
    [[-1, 1], [1, 1], [1, -1], [-1, -1]].forEach(([nx, ny], i) => {
      cam.groundPoint(nx, ny * 0.95, o);
      const px = Math.max(0, Math.min(S, o.x * k)), py = Math.max(0, Math.min(S, o.z * k));
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    });
    ctx.closePath(); ctx.stroke();
    void heightAt;
  }
}
