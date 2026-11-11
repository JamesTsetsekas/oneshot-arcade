// In-frame HUD. Plain DOM (no framework) driven by a snapshot adapter so it never blocks the render path.

import { ECON } from '../content/economy';
import { WEAPONS, WeaponId } from '../content/weapons';
import { UTILITY } from '../content/economy';
import type { Settings } from '../client/settings';
import type { RosterEntry, Snapshot } from '../protocol/schema';
import { calloutAt } from '../sim/map';
import type { Side } from '../sim/types';
import { MapDraw, drawMap } from './minimap';

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', html = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

export interface HudFrame {
  snap: Snapshot;
  serverTime: number;
  settings: Settings;
  /** Whose first-person view this is (self or spectated teammate). */
  viewId: number;
  spectating: boolean;
  spread: number;
  vfov: number;
  mapData: MapDraw;
  pos: { x: number; z: number };
  scopeLevel: number;
  fps: number;
  names: string[];
  highlight: string;
}

const REASONS: Record<string, string> = {
  detonated: 'Cipher detonated',
  eliminated: 'Team eliminated',
  disarmed: 'Cipher disarmed',
  timeExpired: 'Time expired',
  defendersEliminated: 'Defenders eliminated',
};

export class Hud {
  readonly root: HTMLElement;
  private cache = new Map<string, string>();
  private refs: Record<string, HTMLElement> = {};
  private radar: HTMLCanvasElement;
  private radarCtx: CanvasRenderingContext2D;
  private killfeed: HTMLElement;
  private toast: HTMLElement;
  private captions: HTMLElement;
  private ch: HTMLElement;
  private chParts: HTMLElement[] = [];
  private chDot: HTMLElement;
  private dmgInd: HTMLElement;
  private bannerT = 0;
  private hitT = 0;
  private flashLevel = 0;
  private bloodLevel = 0;
  private scope: HTMLElement;

  constructor(root: HTMLElement) {
    this.root = root;
    root.innerHTML = '';
    const top = el('div', 'hud-top');
    const bar = el('div', 'scorebar');
    const mk = (name: string, cls: string): HTMLElement => {
      const t = el('div', 'score-team ' + cls);
      const nm = el('div', 'tname'); const sc = el('div', 'tscore'); const pips = el('div', 'pips');
      t.append(nm, sc, pips); this.refs[name + 'Name'] = nm; this.refs[name + 'Score'] = sc; this.refs[name + 'Pips'] = pips; this.refs[name + 'Team'] = t;
      return t;
    };
    const mid = el('div', 'score-mid');
    this.refs.phase = el('div', 'phase-label'); this.refs.timer = el('div', 'timer'); this.refs.round = el('div', 'phase-label');
    mid.append(this.refs.phase, this.refs.timer, this.refs.round);
    bar.append(mk('left', 'cus'), mid, mk('right', 'int'));
    this.refs.objective = el('div', 'objective hidden');
    top.append(bar, this.refs.objective);

    const radarWrap = el('div'); radarWrap.id = 'radar-wrap';
    this.radar = el('canvas'); this.radar.id = 'radar'; this.radar.width = 448; this.radar.height = 336;
    radarWrap.append(this.radar);
    this.radarCtx = this.radar.getContext('2d')!;

    this.refs.callout = el('div', 'callout');
    this.killfeed = el('div', 'killfeed');
    this.toast = el('div', 'toast');
    this.captions = el('div', 'captions');

    this.ch = el('div', 'crosshair');
    for (let i = 0; i < 4; i++) { const p = el('div', 'ch'); this.ch.append(p); this.chParts.push(p); }
    this.chDot = el('div', 'dot'); this.ch.append(this.chDot);
    this.refs.hit = el('div', 'hitmarker');
    this.refs.prompt = el('div', 'prompt hidden');
    this.refs.banner = el('div', 'banner hidden');

    const bl = el('div', 'bottom-left');
    const hp = el('div', 'stat hp'); hp.innerHTML = '<div class="num">100</div><div class="cap">Health</div><div class="bar"><i></i></div>';
    const ar = el('div', 'stat armor'); ar.innerHTML = '<div class="num">0</div><div class="cap">Armor</div><div class="bar"><i></i></div>';
    this.refs.hp = hp; this.refs.armor = ar;
    this.refs.money = el('div', 'money');
    const left = el('div'); left.append(this.refs.money, el('div', ''));
    const statRow = el('div'); statRow.style.display = 'flex'; statRow.style.gap = '10px'; statRow.append(hp, ar);
    left.append(statRow);
    bl.append(left);

    const br = el('div', 'bottom-right');
    this.refs.ammo = el('div', 'ammo');
    this.refs.slots = el('div', 'slots');
    this.refs.utils = el('div', 'slots');
    br.append(this.refs.ammo, this.refs.slots, this.refs.utils);

    this.refs.spectate = el('div', 'spectate hidden');
    this.refs.fps = el('div', 'fps hidden');
    this.refs.dmg = el('div', 'dmg-ind');
    this.dmgInd = this.refs.dmg;
    this.scope = el('div', 'scope-overlay hidden');

    const flash = el('div'); flash.id = 'flash-overlay';
    const blood = el('div'); blood.id = 'blood-overlay';
    const smoke = el('div'); smoke.id = 'smoke-overlay';
    this.refs.flash = flash; this.refs.blood = blood; this.refs.smoke = smoke;
    document.body.append(flash, blood, smoke);

    root.append(top, radarWrap, this.refs.callout, this.killfeed, this.toast, this.captions, this.ch, this.refs.hit, this.refs.prompt, this.refs.banner, bl, br, this.refs.spectate, this.refs.fps, this.dmgInd, this.scope);
  }

  setText(key: string, text: string): void {
    if (this.cache.get(key) === text) return;
    this.cache.set(key, text);
    this.refs[key].textContent = text;
  }
  private setHtml(key: string, html: string): void {
    if (this.cache.get(key) === html) return;
    this.cache.set(key, html);
    this.refs[key].innerHTML = html;
  }

  // ------------------------------------------------------------------ events
  killEntry(killerName: string, killerSide: Side, victimName: string, victimSide: Side, weapon: string, head: boolean, wall: boolean, selfInvolved: 'killer' | 'victim' | null): void {
    const k = el('div', 'kill' + (selfInvolved === 'killer' ? ' me' : selfInvolved === 'victim' ? ' died' : ''));
    k.innerHTML = `<span class="${killerSide}">${esc(killerName)}</span><span class="wpn">${esc(weapon)}${wall ? ' ▪ wall' : ''}</span>${head ? '<span class="hs">◉ HEAD</span>' : ''}<span class="${victimSide}">${esc(victimName)}</span>`;
    this.killfeed.prepend(k);
    while (this.killfeed.children.length > 6) this.killfeed.lastElementChild!.remove();
    setTimeout(() => k.remove(), 6500);
  }

  popup(text: string, kind: 'pos' | 'neg' | '' = ''): void {
    const d = el('div', kind, esc(text));
    this.toast.append(d);
    while (this.toast.children.length > 4) this.toast.firstElementChild!.remove();
    setTimeout(() => d.remove(), 2800);
  }

  caption(text: string): void {
    const d = el('div', '', esc(text));
    this.captions.append(d);
    while (this.captions.children.length > 3) this.captions.firstElementChild!.remove();
    setTimeout(() => d.remove(), 1800);
  }

  hitMarker(head: boolean, kill: boolean): void {
    const h = this.refs.hit;
    h.className = 'hitmarker';
    void h.offsetWidth;
    h.className = 'hitmarker on' + (kill ? ' kill' : head ? ' head' : '');
    this.hitT = 0.3;
  }

  damageFrom(angle: number): void {
    const i = document.createElement('i');
    i.style.transform = `rotate(${angle}rad)`;
    i.style.opacity = '1';
    i.style.transition = 'opacity 1.2s ease-out';
    this.dmgInd.append(i);
    requestAnimationFrame(() => { i.style.opacity = '0'; });
    setTimeout(() => i.remove(), 1300);
    this.bloodLevel = Math.min(0.8, this.bloodLevel + 0.4);
  }

  flash(duration: number, full: number, reduce: boolean): void {
    this.flashLevel = Math.max(this.flashLevel, duration);
    this.flashFull = Math.max(this.flashFull, full);
    this.flashReduce = reduce;
  }
  private flashFull = 0;
  private flashReduce = false;

  showBanner(win: boolean, reason: string, sub: string, highlight: string): void {
    const b = this.refs.banner;
    b.className = 'banner ' + (win ? 'win' : 'lose');
    b.innerHTML = `<div class="big">${win ? 'Round won' : 'Round lost'}</div><div class="small">${esc(REASONS[reason] ?? reason)}</div>${sub ? `<div class="small">${esc(sub)}</div>` : ''}${highlight ? `<div class="hl">${esc(highlight)}</div>` : ''}`;
    this.bannerT = 4.2;
  }
  showStatusBanner(big: string, small: string, ms = 2500): void {
    const b = this.refs.banner;
    b.className = 'banner';
    b.innerHTML = `<div class="big">${esc(big)}</div><div class="small">${esc(small)}</div>`;
    this.bannerT = ms / 1000;
  }
  hideBanner(): void { this.bannerT = 0; this.refs.banner.classList.add('hidden'); }

  clearTransient(): void {
    this.killfeed.innerHTML = '';
    this.toast.innerHTML = '';
    this.flashLevel = 0; this.flashFull = 0; this.bloodLevel = 0;
    this.refs.flash.style.opacity = '0';
    this.refs.blood.style.opacity = '0';
    this.refs.smoke.style.opacity = '0';
  }

  // ------------------------------------------------------------------ per frame
  update(dt: number, f: HudFrame, smokeFill: number): void {
    const { snap, settings } = f;
    const me = snap.self;
    const mySquad = me.id < 5 ? 0 : 1;
    const mySide = snap.squadSide[mySquad];
    const otherSide: Side = mySide === 'cus' ? 'int' : 'cus';

    // team colours
    this.refs.leftTeam.className = 'score-team ' + mySide;
    this.refs.rightTeam.className = 'score-team ' + otherSide;
    this.setText('leftName', mySide === 'cus' ? 'Custodian · You' : 'Intrusion · You');
    this.setText('rightName', otherSide === 'cus' ? 'Custodian' : 'Intrusion');
    this.setText('leftScore', String(snap.score[mySquad]));
    this.setText('rightScore', String(snap.score[1 - mySquad]));
    const alive = (side: Side) => snap.roster ? snap.roster.filter((r) => r.side === side) : [];
    this.pips('leftPips', alive(mySide));
    this.pips('rightPips', alive(otherSide));

    // timer
    const rem = Math.max(0, snap.phaseRemaining - Math.max(0, f.serverTime - snap.time));
    const m = Math.floor(rem / 60), s = Math.floor(rem % 60);
    const armed = snap.phase === 'armed';
    let label = 'Round ' + snap.round;
    let phase = '';
    switch (snap.phase) {
      case 'buy': phase = 'Buy phase'; break;
      case 'live': phase = 'Live'; break;
      case 'armed': phase = 'Cipher armed'; break;
      case 'roundEnd': phase = 'Round over'; break;
      case 'halftime': phase = 'Sides swap'; break;
      case 'matchEnd': phase = 'Match over'; break;
      default: phase = '';
    }
    this.setText('phase', phase);
    this.setText('timer', snap.phase === 'roundEnd' || snap.phase === 'matchEnd' ? '–:––' : `${m}:${String(s).padStart(2, '0')}`);
    this.refs.timer.className = 'timer' + (armed ? ' armed' : rem < 10 && snap.phase === 'live' ? ' low' : '');
    const target = snap.rules.winRounds;
    this.setText('round', label + ' · first to ' + target);

    // objective line
    const sp = snap.spike;
    let obj = '';
    let objCls = 'objective hidden';
    if (armed) {
      obj = mySide === 'int' ? 'Defend the Cipher · ' + Math.ceil(sp.remaining - Math.max(0, f.serverTime - snap.time)) + 's' : 'Disarm the Cipher at ' + (sp.site ?? '') + ' · ' + Math.ceil(sp.remaining - Math.max(0, f.serverTime - snap.time)) + 's';
      objCls = 'objective armed';
      if (sp.defuser >= 0 && sp.defuseProgress > 0) obj += ' · defusing';
    } else if (snap.phase === 'live' || snap.phase === 'buy') {
      if (mySide === 'int') {
        if (me.spike) obj = 'You carry the Cipher Spike · arm it inside a vault (E)';
        else if (sp.state === 'dropped') obj = sp.pos ? 'The Cipher Spike is on the ground' : 'The Spike was dropped';
        else if (sp.state === 'carried') obj = 'Escort the Spike carrier to a vault';
        objCls = obj ? 'objective' : 'objective hidden';
      } else { obj = 'Stop the Intrusion from arming the Cipher at A or B'; objCls = 'objective'; }
    }
    this.setText('objective', obj);
    this.refs.objective.className = objCls;

    // callout
    this.setText('callout', calloutAt(f.pos.x, f.pos.z));

    // vitals (of the viewed player)
    const viewMate = f.snap.roster?.find((r) => r.id === f.viewId);
    const hpv = f.spectating ? (viewMate?.hp ?? 0) : me.hp;
    const arv = f.spectating ? (viewMate?.armor ?? 0) : me.armor;
    this.setHtml('hp', `<div class="num">${Math.max(0, Math.round(hpv))}</div><div class="cap">Health</div><div class="bar"><i style="width:${clamp01(hpv / 100) * 100}%"></i></div>`);
    this.refs.hp.className = 'stat hp' + (hpv < 30 ? ' low' : '');
    this.setHtml('armor', `<div class="num">${Math.round(arv)}</div><div class="cap">Armor${(f.spectating ? viewMate?.helmet : me.helmet) ? ' + Helm' : ''}</div><div class="bar"><i style="width:${clamp01(arv / 100) * 100}%"></i></div>`);
    const showMoney = snap.phase === 'buy' || snap.phase === 'roundEnd' || snap.phase === 'halftime';
    this.setText('money', f.spectating ? '' : (showMoney || snap.self.canBuy ? '$' + me.money.toLocaleString() : '$' + me.money.toLocaleString()));
    this.refs.money.style.opacity = showMoney ? '1' : '0.75';

    // ammo and slots
    this.drawAmmo(f);

    // prompt
    let prompt = '';
    let progress = 0;
    if (!f.spectating && me.alive) {
      if (me.interact.kind === 'arm') { prompt = 'Arming the Cipher…'; progress = me.interact.progress / 3.2; }
      else if (me.interact.kind === 'defuse') { prompt = 'Disarming…'; progress = me.interact.progress / sp.defuseNeeded; }
      else if (me.spike && snap.phase === 'live') { if (inSite(f.pos)) prompt = 'Hold [E] to arm the Cipher'; }
      else if (mySide === 'cus' && armed && sp.pos && Math.hypot(sp.pos.x - f.pos.x, sp.pos.z - f.pos.z) < 2.4) prompt = 'Hold [E] to disarm' + (me.kit ? ' (kit: 5 s)' : ' (8 s)');
      else if (snap.phase === 'buy' && me.canBuy) prompt = 'Press [B] to open the buy menu';
    }
    if (prompt) {
      this.refs.prompt.classList.remove('hidden');
      this.setHtml('prompt', `<div>${esc(prompt)}</div>${progress > 0 ? `<div class="pbar"><i style="width:${clamp01(progress) * 100}%"></i></div>` : ''}`);
    } else this.refs.prompt.classList.add('hidden');

    // spectate bar
    if (f.spectating) {
      this.refs.spectate.classList.remove('hidden');
      this.setHtml('spectate', `Spectating <b>${esc(f.names[f.viewId] ?? '')}</b><small>Click or ←/→ to switch teammate · you can only see what your team sees</small>`);
    } else this.refs.spectate.classList.add('hidden');

    // crosshair
    this.updateCrosshair(f, settings);

    // radar
    drawMap(this.radarCtx, this.radar.width, this.radar.height, f.mapData, false);

    // overlays
    if (this.hitT > 0) this.hitT -= dt;
    if (this.bannerT > 0) { this.bannerT -= dt; this.refs.banner.classList.toggle('hidden', this.bannerT <= 0); }
    // flash: fades from full white to clear
    if (this.flashLevel > 0) {
      this.flashLevel -= dt;
      this.flashFull -= dt;
      const reduce = this.flashReduce ? 0.55 : 1;
      let op = this.flashFull > 0 ? 1 : Math.max(0, this.flashLevel / Math.max(0.3, Math.min(1.5, this.flashLevel + this.flashFull + 0.5)));
      op = Math.min(1, op * 1.0) * reduce;
      this.refs.flash.style.opacity = String(Math.max(0, op));
    } else { this.refs.flash.style.opacity = '0'; this.flashFull = 0; }
    if (this.bloodLevel > 0) { this.bloodLevel = Math.max(0, this.bloodLevel - dt * 0.6); }
    const low = !f.spectating && me.alive && me.hp < 30 ? 0.35 : 0;
    this.refs.blood.style.opacity = String(Math.max(this.bloodLevel, low));
    this.refs.smoke.style.opacity = String(smokeFill);

    // scope overlay
    this.scope.classList.toggle('hidden', f.scopeLevel <= 0);
    // fps
    this.refs.fps.classList.toggle('hidden', !settings.showFps);
    if (settings.showFps) this.setText('fps', f.fps.toFixed(0) + ' fps');
  }

  private pips(key: string, roster: RosterEntry[]): void {
    const html = roster.map((r) => `<div class="pip${r.alive ? '' : ' dead'}"></div>`).join('');
    this.setHtml(key, html);
  }

  private drawAmmo(f: HudFrame): void {
    const me = f.snap.self;
    const cur = me.cur;
    const w = cur === 'primary' ? me.weapons.primary : cur === 'secondary' ? me.weapons.secondary : cur === 'tool' ? me.weapons.tool : null;
    const def = w ? WEAPONS[w.id] : null;
    const reloading = !!w?.reloading;
    if (f.spectating) {
      const mate = f.snap.roster?.find((r) => r.id === f.viewId);
      this.setHtml('ammo', `<div class="wname">${esc(mate?.primary ? WEAPONS[mate.primary].name : mate?.secondary ? WEAPONS[mate.secondary].name : '')}</div>`);
      this.refs.slots.innerHTML = ''; this.refs.utils.innerHTML = '';
      this.cache.delete('slots'); this.cache.delete('utils');
      return;
    }
    if (def && def.mode !== 'melee') this.setHtml('ammo', `<div class="wname">${esc(def.name)}${reloading ? ' · reloading' : ''}</div><div class="mag">${w!.mag}<small>/ ${w!.reserve}</small></div>`);
    else if (def) this.setHtml('ammo', `<div class="wname">${esc(def.name)}</div><div class="mag">—</div>`);
    else if (cur.startsWith('util')) { const u = me.util[Number(cur.slice(4))]; this.setHtml('ammo', `<div class="wname">${u ? esc(UTILITY[u].name) : ''}</div><div class="mag" style="font-size:22px">LMB throw · RMB lob</div>`); }
    this.refs.ammo.className = 'ammo' + (reloading ? ' reloading' : '');
    const slot = (key: string, label: string, name: string | null, on: boolean) => name ? `<div class="slot${on ? ' on' : ''}"><b>${key}</b>${esc(label)}</div>` : '';
    this.setHtml('slots',
      slot('1', me.weapons.primary ? WEAPONS[me.weapons.primary.id].name : '', me.weapons.primary ? 'p' : null, cur === 'primary') +
      slot('2', me.weapons.secondary ? WEAPONS[me.weapons.secondary.id].name : '', me.weapons.secondary ? 's' : null, cur === 'secondary') +
      slot('3', 'Tool', 't', cur === 'tool'));
    this.setHtml('utils', me.util.map((u, i) => `<div class="slot util${cur === 'util' + i ? ' on' : ''}" style="border-bottom:3px solid ${UTILITY[u].color}"><b>${4 + i}</b>${esc(UTILITY[u].name.split(' ')[0])}</div>`).join('') + (me.kit ? '<div class="slot util">Kit</div>' : '') + (me.spike ? '<div class="slot util" style="border-color:#ff3fa6">Spike</div>' : ''));
  }

  private updateCrosshair(f: HudFrame, s: Settings): void {
    const c = s.crosshair;
    const hidden = f.scopeLevel > 0 || (f.spectating);
    this.ch.style.display = hidden ? 'none' : 'block';
    if (hidden) return;
    const pxPerRad = (window.innerHeight / 2) / Math.tan((f.vfov * Math.PI) / 360);
    const dyn = c.dynamic ? Math.tan(f.spread) * pxPerRad : 0;
    const gap = c.gap + Math.min(60, dyn);
    const sz = c.size, th = c.thickness;
    this.ch.style.setProperty('--ch-color', c.color);
    this.ch.style.opacity = String(c.opacity);
    const parts = this.chParts;
    const place = (e: HTMLElement, x: number, y: number, w: number, h: number) => { e.style.left = x + 'px'; e.style.top = y + 'px'; e.style.width = w + 'px'; e.style.height = h + 'px'; e.className = 'ch' + (c.outline ? ' outline' : ''); };
    place(parts[0], -th / 2, -gap - sz, th, sz);
    place(parts[1], -th / 2, gap, th, sz);
    place(parts[2], -gap - sz, -th / 2, sz, th);
    place(parts[3], gap, -th / 2, sz, th);
    this.chDot.style.display = c.dot ? 'block' : 'none';
    this.chDot.style.width = this.chDot.style.height = Math.max(2, th + 1) + 'px';
  }

  setVisible(v: boolean): void { this.root.classList.toggle('hidden', !v); document.getElementById('flash-overlay')!.style.display = v ? 'block' : 'none'; }

  destroy(): void {
    this.refs.flash.remove(); this.refs.blood.remove(); this.refs.smoke.remove();
  }
}

function clamp01(v: number): number { return Math.max(0, Math.min(1, v)); }
export function esc(s: string): string { return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!); }

import { SITES, inZone } from '../sim/map';
function inSite(p: { x: number; z: number }): boolean { return inZone(SITES.A, p.x, p.z) || inZone(SITES.B, p.x, p.z); }
export { ECON };
export type { WeaponId };
