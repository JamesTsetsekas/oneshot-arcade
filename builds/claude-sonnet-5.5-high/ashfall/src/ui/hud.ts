// Combat HUD: orbs, skill bar, boss bar, minimap, floating numbers, ground labels, toasts, tutorial.
import { POTIONS } from '../data/items';
import { CLASS_SKILLS, SKILL_BY_ID, xpForLevel } from '../data/skills';
import { QUESTS } from '../data/quests';
import { DT_CSS, getEffect } from '../sim/combat';
import type { Enemy } from '../sim/entities';
import type { Game } from '../sim/game';
import type { GameEvent, PotionKind, Rarity } from '../sim/types';
import type { GameView } from '../render/view';
import { RARITY_CSS, RARITY_ICON, potionIcon, skillIcon } from './icons';
import { keyLabel, type Action, type Settings } from './settings';
import { esc, skillTooltip } from './tooltip';
import { rarityRank } from '../sim/loot';

export interface HudHost {
  game: Game | null;
  view: GameView;
  settings: Settings;
  onPickupClick(id: number): void;
  tooltip(html: string | null, x?: number, y?: number): void;
  altHeld: boolean;
  respawn(): void;
  fps: { median: number; low: number; cur: number };
}

interface FloatText {
  x: number;
  z: number;
  text: string;
  color: string;
  size: number;
  age: number;
  vx: number;
  life: number;
  down: boolean;
}

const SLOTS: { slot: 'rmb' | 'q' | 'w' | 'e' | 'r'; action?: Action; label: string }[] = [
  { slot: 'rmb', label: 'RMB' },
  { slot: 'q', action: 'skillQ', label: 'Q' },
  { slot: 'w', action: 'skillW', label: 'W' },
  { slot: 'e', action: 'skillE', label: 'E' },
  { slot: 'r', action: 'skillR', label: 'R' },
];
const POTS: { kind: PotionKind; action: Action }[] = [
  { kind: 'health', action: 'potion1' },
  { kind: 'focus', action: 'potion2' },
  { kind: 'cleanse', action: 'potion3' },
  { kind: 'tonic', action: 'potion4' },
];
const BUFF_INFO: Record<string, { label: string; bad?: boolean; cls: string }> = {
  guard: { label: 'Guard', cls: 'good' }, furnace: { label: 'Furnace', cls: 'good' }, cloak: { label: 'Cloaked', cls: 'good' }, dodge: { label: 'Evade ready', cls: 'good' }, haste: { label: 'Haste', cls: 'good' },
  tonic: { label: 'Resist +25%', cls: 'good' }, resolve: { label: 'Resolve', cls: 'good' }, laststand: { label: 'Last Stand', cls: 'good' }, slow: { label: 'Slowed', bad: true, cls: 'bad' }, root: { label: 'Rooted', bad: true, cls: 'bad' },
  burn: { label: 'Burning', bad: true, cls: 'bad' }, blight: { label: 'Blight', bad: true, cls: 'bad' }, stun: { label: 'Stunned', bad: true, cls: 'bad' },
};

const TUTORIAL: { id: string; text: string }[] = [
  { id: 'move', text: 'Left-click the ground to move' },
  { id: 'attack', text: 'Left-click a training dummy to attack' },
  { id: 'skillpoint', text: 'Press K and spend your skill point' },
  { id: 'skill', text: 'Right-click to use your core skill' },
  { id: 'evade', text: 'Press Space to evade' },
  { id: 'potion', text: 'Press 1 to drink a health potion' },
  { id: 'inventory', text: 'Press I to open your inventory' },
];

export class Hud {
  root: HTMLElement;
  private overlay: HTMLCanvasElement;
  private octx: CanvasRenderingContext2D;
  private labelsEl: HTMLElement;
  private labelPool: HTMLElement[] = [];
  private floats: FloatText[] = [];
  private arrows: { x: number; z: number; t: number; label: string }[] = [];
  private mini: HTMLCanvasElement;
  private mctx: CanvasRenderingContext2D;
  private miniT = 0;
  private el: Record<string, HTMLElement> = {};
  private slotEls: Record<string, HTMLElement> = {};
  private potEls: Record<string, HTMLElement> = {};
  private bannerT = 0;
  private vignetteT = 0;
  private lowFlash = 0;
  automapOverlay = false;
  private lastSkillSig = '';
  private deathEl: HTMLElement;
  private hoverEnemy = 0;

  constructor(private host: HudHost, parent: HTMLElement) {
    this.root = document.createElement('div');
    this.root.id = 'hud';
    this.root.innerHTML = `
      <canvas id="overlay"></canvas>
      <div id="labels"></div>
      <div id="vignette"></div>
      <div class="hud-tl"><div id="zoneName"></div><div id="buffs"></div></div>
      <div class="hud-tc"><div id="bossbar" class="hidden"><div class="boss-name"></div><div class="bar hp"><div class="fill"></div></div><div class="bar armor"><div class="fill"></div><span></span></div><div class="bar over hidden"><div class="fill"></div><span></span></div><div class="boss-sub"></div></div><div id="toasts"></div></div>
      <div class="hud-tr"><canvas id="minimap" width="210" height="210"></canvas><div id="tracker"></div></div>
      <div id="banner"></div>
      <div id="tutorial"></div>
      <div id="hint"></div>
      <div id="fps"></div>
      <div class="hud-bottom">
        <div class="orb hp" id="orbHp"><div class="fill"></div><div class="gloss"></div><span></span></div>
        <div class="center">
          <div id="resource"></div>
          <div id="evade"></div>
          <div class="bars"><div id="skillbar"></div><div id="potbar"></div></div>
          <div id="xp"><div class="fill"></div><span></span></div>
        </div>
        <div class="orb fp" id="orbFp"><div class="fill"></div><div class="gloss"></div><span></span></div>
      </div>
      <div id="death" class="hidden"></div>`;
    parent.appendChild(this.root);
    this.overlay = this.root.querySelector('#overlay') as HTMLCanvasElement;
    this.octx = this.overlay.getContext('2d')!;
    this.labelsEl = this.root.querySelector('#labels') as HTMLElement;
    this.mini = this.root.querySelector('#minimap') as HTMLCanvasElement;
    this.mctx = this.mini.getContext('2d')!;
    for (const id of ['zoneName', 'buffs', 'bossbar', 'toasts', 'tracker', 'banner', 'tutorial', 'hint', 'fps', 'orbHp', 'orbFp', 'resource', 'evade', 'skillbar', 'potbar', 'xp']) this.el[id] = this.root.querySelector('#' + id) as HTMLElement;
    this.deathEl = this.root.querySelector('#death') as HTMLElement;
    this.buildSlots();
    this.root.addEventListener('mousemove', (e) => {
      const t = e.target as HTMLElement;
      const slot = t.closest('[data-skill]') as HTMLElement | null;
      if (slot && this.host.game) this.host.tooltip(skillTooltip(this.host.game, slot.dataset.skill!), e.clientX, e.clientY);
      else if (!(t.closest('.gl'))) this.host.tooltip(null);
    });
  }

  private buildSlots() {
    const sb = this.el.skillbar;
    sb.innerHTML = '';
    for (const s of SLOTS) {
      const d = document.createElement('div');
      d.className = 'slot';
      d.dataset.slot = s.slot;
      d.innerHTML = '<img alt=""><div class="cdov"></div><div class="key"></div><div class="charges"></div>';
      sb.appendChild(d);
      this.slotEls[s.slot] = d;
    }
    const pb = this.el.potbar;
    pb.innerHTML = '';
    for (const p of POTS) {
      const d = document.createElement('div');
      d.className = 'slot pot';
      d.title = `${POTIONS[p.kind].name}: ${POTIONS[p.kind].desc}`;
      d.innerHTML = `<img alt="" src="${potionIcon(p.kind)}"><div class="cdov"></div><div class="key"></div><div class="count"></div>`;
      pb.appendChild(d);
      this.potEls[p.kind] = d;
    }
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = this.root.clientWidth;
    const h = this.root.clientHeight;
    this.overlay.width = Math.round(w * dpr);
    this.overlay.height = Math.round(h * dpr);
    this.overlay.style.width = w + 'px';
    this.overlay.style.height = h + 'px';
    this.octx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  show(v: boolean) {
    this.root.classList.toggle('hidden', !v);
  }

  /** Projects to HUD coordinates (CSS px divided by the UI zoom factor). */
  private pr(x: number, y: number, z: number, out = { x: 0, y: 0, vis: true }) {
    this.host.view.project(x, y, z, out);
    const s = this.host.settings.uiScale || 1;
    out.x /= s;
    out.y /= s;
    return out;
  }
  private lastToast = { text: '', t: 0 };
  toast(text: string, kind = 'info', dur = 4) {
    const now = performance.now();
    if (this.lastToast.text === text && now - this.lastToast.t < 1500) return; // de-duplicate rapid repeats
    this.lastToast = { text, t: now };
    const d = document.createElement('div');
    d.className = `toast ${kind}`;
    d.textContent = text;
    this.el.toasts.appendChild(d);
    while (this.el.toasts.children.length > 5) this.el.toasts.firstChild?.remove();
    window.setTimeout(() => d.classList.add('out'), dur * 1000);
    window.setTimeout(() => d.remove(), dur * 1000 + 600);
  }

  banner(text: string, sub = '') {
    this.el.banner.innerHTML = `<div class="b1">${esc(text)}</div>${sub ? `<div class="b2">${esc(sub)}</div>` : ''}`;
    this.el.banner.classList.remove('show');
    void this.el.banner.offsetWidth;
    this.el.banner.classList.add('show');
    this.bannerT = 3.2;
  }

  handleEvents(events: GameEvent[]) {
    const g = this.host.game;
    if (!g) return;
    const s = this.host.settings;
    for (const ev of events) {
      switch (ev.t) {
        case 'toast':
          this.toast(ev.text, ev.kind ?? 'info', ev.kind === 'quest' ? 6 : 4);
          break;
        case 'hit': {
          if (!s.damageNumbers && !ev.onPlayer) break;
          const big = ev.crit;
          this.floats.push({
            x: ev.x + (Math.random() - 0.5) * 0.6, z: ev.z, text: `${Math.round(ev.amount)}${ev.crit ? '!' : ''}`, color: ev.onPlayer ? '#ff6a5a' : DT_CSS[ev.dtype], size: ev.onPlayer ? 20 : big ? 30 : ev.amount > 40 ? 22 : 17,
            age: 0, vx: (Math.random() - 0.5) * 24, life: big ? 1.2 : 0.9, down: ev.onPlayer,
          });
          if (ev.onPlayer && ev.amount > 0.5) this.vignetteT = Math.min(0.6, ev.amount / g.d.maxHp + 0.15);
          if (this.floats.length > 70) this.floats.shift();
          break;
        }
        case 'text':
          this.floats.push({ x: ev.x, z: ev.z, text: ev.text, color: ev.color, size: ev.big ? 28 : 16, age: 0, vx: 0, life: ev.big ? 1.8 : 1.2, down: false });
          break;
        case 'pickup':
          if (ev.kind === 'item') this.toast(`Picked up: ${ev.text}`, 'loot', 2.2);
          else if (ev.kind === 'potion') this.toast(`+ ${ev.text}`, 'loot', 1.6);
          break;
        case 'zone':
          this.banner(g.zone.name, g.zone.kind === 'march' || g.zone.kind.startsWith('archive') || g.zone.kind === 'hunt' ? `Area level ${g.zone.level}${g.ch.difficulty === 'veteran' ? ' - Veteran' : ''}` : 'Safe haven');
          break;
        case 'levelup':
          this.banner('Level Up', `You are now level ${ev.level}`);
          break;
        case 'bossIntro': {
          const e = g.boss;
          if (e) this.banner(e.name, e.type === 'toll_keeper' ? 'Break the armor. Mind the lanterns.' : 'Destroy the conduits. Win the stagger race.');
          break;
        }
        case 'telegraph': {
          const e = g.enemies.find((x) => x.id === ev.enemy);
          if (e && (e.def.heavy || e.boss || e.def.attack === 'shoot' || e.def.attack === 'hook')) {
            const p = this.pr(ev.x, 1, ev.z);
            const w = this.root.clientWidth;
            const h = this.root.clientHeight;
            if (p.x < 10 || p.y < 10 || p.x > w - 10 || p.y > h - 10) this.arrows.push({ x: ev.x, z: ev.z, t: 1.4, label: '!' });
          }
          break;
        }
        case 'death':
          this.showDeath(ev.cause, ev.dtype);
          break;
        default:
          break;
      }
    }
  }

  private showDeath(cause: string, dtype: string) {
    const g = this.host.game!;
    const info = g.deathInfo;
    this.deathEl.classList.remove('hidden');
    this.deathEl.innerHTML = `<div class="death-box">
      <h2>You Have Fallen</h2>
      <p class="cause">Slain by <b>${esc(cause)}</b> <span class="dt ${dtype}">(${dtype === 'phys' ? 'physical' : dtype} damage)</span></p>
      <p>You will awaken at your last waypoint. Your equipped gear lost 5% durability.</p>
      <p>${info && info.echo > 0 ? `An <b>Echo</b> holding ${info.echo} gold (10% of what you carried) lingers where you fell. Reclaim it once for an 8% maximum-health blessing. Dying again moves the Echo but never compounds the loss.` : 'An Echo already waits for you; dying again only moves it.'}</p>
      <button class="btn primary" id="respawnBtn">Rise at the waypoint</button></div>`;
    (this.deathEl.querySelector('#respawnBtn') as HTMLElement).onclick = () => {
      this.deathEl.classList.add('hidden');
      this.host.respawn();
    };
  }
  hideDeath() {
    this.deathEl.classList.add('hidden');
  }

  setHoverEnemy(id: number) {
    this.hoverEnemy = id;
  }

  // ------------------------------------------------------------ per-frame
  update(dt: number) {
    const g = this.host.game;
    if (!g) return;
    const p = g.player;
    const d = g.d;
    const keys = this.host.settings.keys;
    // orbs
    const hpF = Math.max(0, Math.min(1, p.hp / p.maxHp));
    (this.el.orbHp.querySelector('.fill') as HTMLElement).style.height = hpF * 100 + '%';
    (this.el.orbHp.querySelector('span') as HTMLElement).textContent = `${Math.ceil(p.hp)} / ${p.maxHp}`;
    const fpF = Math.max(0, Math.min(1, p.focus / p.maxFocus));
    (this.el.orbFp.querySelector('.fill') as HTMLElement).style.height = fpF * 100 + '%';
    (this.el.orbFp.querySelector('span') as HTMLElement).textContent = `${Math.floor(p.focus)} / ${p.maxFocus}`;
    this.el.orbHp.classList.toggle('low', hpF < 0.3);
    // xp
    const need = xpForLevel(g.ch.level);
    (this.el.xp.querySelector('.fill') as HTMLElement).style.width = (g.ch.level >= 20 ? 100 : (g.ch.xp / need) * 100) + '%';
    (this.el.xp.querySelector('span') as HTMLElement).textContent = `Level ${g.ch.level} ${g.ch.level >= 20 ? '(max)' : `- ${g.ch.xp}/${need} XP`}${g.ch.skillPoints > 0 ? ` - ${g.ch.skillPoints} skill pt (K)` : ''}${g.ch.attrPoints > 0 ? ` - ${g.ch.attrPoints} attr pt (C)` : ''}`;
    // skill slots
    const sig = JSON.stringify(g.ch.hotbar) + g.ch.cls + JSON.stringify(keys);
    for (const s of SLOTS) {
      const id = g.ch.hotbar[s.slot];
      const el = this.slotEls[s.slot];
      const img = el.querySelector('img') as HTMLImageElement;
      if (sig !== this.lastSkillSig) {
        el.dataset.skill = id ?? '';
        if (id) {
          const sk = SKILL_BY_ID[id];
          img.src = skillIcon(id, sk.tags);
          img.style.visibility = 'visible';
        } else img.style.visibility = 'hidden';
        (el.querySelector('.key') as HTMLElement).textContent = s.action ? keyLabel(keys[s.action]) : s.label;
        el.classList.toggle('empty', !id);
      }
      const cd = el.querySelector('.cdov') as HTMLElement;
      const ch = el.querySelector('.charges') as HTMLElement;
      if (id) {
        const sk = SKILL_BY_ID[id];
        let frac = 0;
        if (sk.charges) {
          const c = p.charges[id] ?? sk.charges;
          ch.textContent = String(c);
          frac = c <= 0 ? Math.max(0, p.chargeT[id] ?? 0) / Math.max(0.1, sk.cooldown) : 0;
        } else {
          ch.textContent = '';
          frac = sk.cooldown > 0 ? (p.cds[id] ?? 0) / (sk.cooldown * (1 - d.cdr / 100)) : 0;
        }
        const noFocus = p.focus < sk.cost || (id === 'furnace_heart' && p.heat < 15);
        cd.style.height = Math.min(100, frac * 100) + '%';
        el.classList.toggle('nofocus', noFocus);
        el.classList.toggle('casting', p.castSkill === id);
      }
    }
    if (sig !== this.lastSkillSig) this.lastSkillSig = sig;
    for (const pk of POTS) {
      const el = this.potEls[pk.kind];
      (el.querySelector('.key') as HTMLElement).textContent = keyLabel(keys[pk.action]);
      const cnt = g.ch.belt[pk.kind];
      (el.querySelector('.count') as HTMLElement).textContent = `${cnt}/${g.ch.beltCap}`;
      el.classList.toggle('empty', cnt <= 0);
      (el.querySelector('.cdov') as HTMLElement).style.height = Math.min(100, ((p.potionCd[pk.kind] ?? 0) / (pk.kind === 'health' ? 6 : 8)) * 100) + '%';
    }
    // resource + evade
    let res = '';
    if (g.ch.cls === 'cinder') res = `<div class="heat"><div class="fill" style="width:${p.heat}%"></div><span>Heat ${Math.floor(p.heat)}</span></div>`;
    else {
      const marks = g.enemies.reduce((n, e) => n + (e.alive ? (getEffect(e, 'mark')?.mag ?? 0) : 0), 0);
      res = `<div class="trace">Trace marks on enemies: <b>${marks}</b></div>`;
    }
    this.el.resource.innerHTML = res;
    this.el.evade.innerHTML = Array.from({ length: 3 }, (_, i) => `<i class="${i < p.evadeCharges ? 'on' : ''}"></i>`).join('') + `<span>${keyLabel(keys.evade)} evade</span>`;
    // buffs
    let bh = '';
    for (const e of p.effects) {
      const inf = BUFF_INFO[e.k];
      if (!inf) continue;
      bh += `<span class="buff ${inf.cls}">${inf.label}${e.t < 90 ? ` ${Math.ceil(e.t)}s` : ''}</span>`;
    }
    if (g.blessingT > 0) bh += `<span class="buff good">Echo blessing +8% HP ${Math.ceil(g.blessingT)}s</span>`;
    if (p.channel) bh += `<span class="buff good">Town gate ${(p.channel.dur - p.channel.t).toFixed(1)}s</span>`;
    if (this.el.buffs.innerHTML !== bh) this.el.buffs.innerHTML = bh;
    // boss bar
    const bb = this.el.bossbar;
    const boss = g.boss;
    if (boss && boss.alive && boss.boss_state?.engaged) {
      bb.classList.remove('hidden');
      const s = boss.boss_state;
      (bb.querySelector('.boss-name') as HTMLElement).textContent = boss.name;
      (bb.querySelector('.hp .fill') as HTMLElement).style.width = Math.max(0, (boss.hp / boss.maxHp) * 100) + '%';
      const armorBar = bb.querySelector('.armor') as HTMLElement;
      const overBar = bb.querySelector('.over') as HTMLElement;
      if (s.id === 'toll_keeper') {
        armorBar.classList.remove('hidden');
        const f = s.broken > 0 ? s.broken / 5.5 : s.armor / s.armorMax;
        (armorBar.querySelector('.fill') as HTMLElement).style.width = Math.max(0, f * 100) + '%';
        armorBar.classList.toggle('broken', s.broken > 0);
        (armorBar.querySelector('span') as HTMLElement).textContent = s.broken > 0 ? 'ARMOR BROKEN' : 'Armor';
        (bb.querySelector('.boss-sub') as HTMLElement).textContent = `Phase ${s.phase} - kill the Toll Lanterns first`;
        overBar.classList.add('hidden');
      } else {
        if (s.phase === 3) {
          armorBar.classList.remove('hidden');
          (armorBar.querySelector('.fill') as HTMLElement).style.width = Math.min(100, (s.armor / s.armorMax) * 100) + '%';
          (armorBar.querySelector('span') as HTMLElement).textContent = s.broken > 0 ? 'STAGGERED' : 'Stagger';
          armorBar.classList.toggle('broken', s.broken > 0);
          overBar.classList.remove('hidden');
          (overBar.querySelector('.fill') as HTMLElement).style.width = Math.min(100, s.overload * 100) + '%';
          (overBar.querySelector('span') as HTMLElement).textContent = 'Overload';
          (bb.querySelector('.boss-sub') as HTMLElement).textContent = 'Phase 3 - fill the stagger bar before the Overload completes';
        } else {
          armorBar.classList.add('hidden');
          overBar.classList.add('hidden');
          (bb.querySelector('.boss-sub') as HTMLElement).textContent = s.invuln ? 'Phase 2 - shielded: destroy the three conduits' : s.phase === 2 ? 'Phase 2 - engine exposed' : 'Phase 1 - dodge the beam lanes, kill the Repair Scribes';
        }
      }
    } else bb.classList.add('hidden');
    // hint
    const use = g.nearestUsable();
    this.el.hint.textContent = use && !p.dead ? `[${keyLabel(keys.interact)}] ${use.kind === 'pickup' ? 'Pick up' : 'Interact'}: ${use.label}` : '';
    this.el.hint.classList.toggle('on', !!use && !p.dead);
    // tracker
    this.updateTracker(g);
    // banner fade
    if (this.bannerT > 0) {
      this.bannerT -= dt;
      if (this.bannerT <= 0) this.el.banner.classList.remove('show');
    }
    const vg = this.root.querySelector('#vignette') as HTMLElement;
    this.vignetteT = Math.max(0, this.vignetteT - dt * 1.6);
    const low = p.hp / p.maxHp < 0.3 && !p.dead ? 0.25 + 0.15 * Math.sin(performance.now() / 260) : 0;
    vg.style.opacity = String(this.host.settings.reducedFlash ? Math.min(0.25, this.vignetteT) : Math.max(this.vignetteT, low));
    // fps
    const fe = this.el.fps;
    if (this.host.settings.showFps) {
      fe.style.display = 'block';
      fe.textContent = `${this.host.fps.cur.toFixed(0)} fps | median ${this.host.fps.median.toFixed(0)} | 1% low ${this.host.fps.low.toFixed(0)} | enemies ${g.enemies.filter((e) => e.alive).length} | draws ${this.host.view.renderer.info.render.calls} | tris ${Math.round(this.host.view.renderer.info.render.triangles / 1000)}k`;
    } else fe.style.display = 'none';
    // minimap
    this.miniT -= dt;
    if (this.miniT <= 0) {
      this.miniT = 0.12;
      this.drawMap(this.mctx, 210, 2.2, true, g);
    }
    this.drawOverlay(g, dt);
    this.updateLabels(g);
  }

  private trackerSig = '';
  private updateTracker(g: Game) {
    const ch = g.ch;
    let html = '';
    const tutDone = TUTORIAL.every((t) => ch.tutorial[t.id]);
    for (const q of QUESTS) {
      const st = ch.quests[q.id];
      if (st !== 'active') continue;
      html += `<div class="q ${q.optional ? 'opt' : ''}"><b>${esc(q.name)}</b>${q.optional ? ' <i>(optional)</i>' : ''}<div>${esc(q.objective)}</div></div>`;
    }
    if (!ch.quests.ashway) html += '<div class="q"><b>Speak to Marshal Orsa Vell</b><div>She waits near the banners in Ember Refuge.</div></div>';
    if (ch.actComplete && g.zone.id === 'refuge') html += '<div class="q"><b>Act complete</b><div>Use the Ashen Portal to hunt bosses or begin a Veteran expedition.</div></div>';
    if (html !== this.trackerSig) {
      this.trackerSig = html;
      this.el.tracker.innerHTML = html;
    }
    const tut = this.el.tutorial;
    if (tutDone) {
      if (tut.innerHTML) tut.innerHTML = '';
      tut.style.display = 'none';
    } else {
      tut.style.display = 'block';
      const t = `<div class="t-h">Training</div>` + TUTORIAL.map((s) => `<div class="${ch.tutorial[s.id] ? 'done' : ''}">${ch.tutorial[s.id] ? '✓' : '○'} ${esc(s.text)}</div>`).join('');
      if (tut.innerHTML !== t) tut.innerHTML = t;
    }
  }

  // ------------------------------------------------------------ minimap / automap
  drawMap(ctx: CanvasRenderingContext2D, size: number, scale: number, rotate: boolean, g: Game, full = false) {
    const z = g.zone;
    const p = g.player;
    ctx.save();
    ctx.clearRect(0, 0, size, size);
    ctx.beginPath();
    ctx.rect(0, 0, size, size);
    ctx.clip();
    ctx.fillStyle = 'rgba(8,8,12,0.55)';
    ctx.fillRect(0, 0, size, size);
    ctx.translate(size / 2, size / 2);
    if (rotate) ctx.rotate(Math.PI / 4);
    const cx = full ? z.w / 2 : p.x;
    const cz = full ? z.h / 2 : p.z;
    ctx.translate(-cx * scale, -cz * scale);
    const r = full ? Math.max(z.w, z.h) : Math.ceil(size / scale);
    const x0 = Math.max(0, Math.floor(cx - r));
    const x1 = Math.min(z.w, Math.ceil(cx + r));
    const z0 = Math.max(0, Math.floor(cz - r));
    const z1 = Math.min(z.h, Math.ceil(cz + r));
    const cells = z.grid.cells;
    for (let zz = z0; zz < z1; zz++)
      for (let x = x0; x < x1; x++) {
        const i = zz * z.w + x;
        if (!z.explored[i]) continue;
        const c = cells[i];
        ctx.fillStyle = c === 1 ? '#6a6760' : c === 2 ? '#3d3a38' : '#2c2a2f';
        ctx.fillRect(x * scale, zz * scale, scale + 0.4, scale + 0.4);
      }
    const known = (x: number, zz: number) => z.explored[Math.floor(zz) * z.w + Math.floor(x)] === 1;
    for (const it of z.interactables) {
      if (it.hidden || !known(it.x, it.z)) continue;
      const col = it.kind === 'waypoint' ? '#5ee8ff' : it.kind.startsWith('gate') || it.kind.startsWith('stairs') || it.kind === 'archive_gate' ? '#ffd56a' : it.kind === 'chest' && !it.used ? '#d8a050' : it.kind === 'cage' ? '#ff9a50' : '';
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(it.x * scale, it.z * scale, it.kind === 'waypoint' ? 3.2 : 2.4, 0, 7);
      ctx.fill();
    }
    for (const e of g.enemies) {
      if (!e.alive || e.neutral) continue;
      if (Math.hypot(e.x - p.x, e.z - p.z) > 16 && !full) continue;
      if (!known(e.x, e.z)) continue;
      ctx.fillStyle = e.boss ? '#ff2a2a' : e.elite ? '#ffb040' : '#e0503a';
      ctx.fillRect(e.x * scale - 1.2, e.z * scale - 1.2, e.boss ? 5 : 2.6, e.boss ? 5 : 2.6);
    }
    for (const k of g.pickups) {
      if (k.dead || k.kind !== 'echo') continue;
      ctx.fillStyle = '#9fd4ff';
      ctx.beginPath();
      ctx.arc(k.x * scale, k.z * scale, 3, 0, 7);
      ctx.fill();
    }
    // player arrow
    ctx.save();
    ctx.translate(p.x * scale, p.z * scale);
    ctx.rotate(p.facing);
    ctx.fillStyle = '#ffe08a';
    ctx.strokeStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(5, 0);
    ctx.lineTo(-3, -3.2);
    ctx.lineTo(-1.5, 0);
    ctx.lineTo(-3, 3.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.restore();
    ctx.strokeStyle = 'rgba(200,170,110,0.6)';
    ctx.strokeRect(0.5, 0.5, size - 1, size - 1);
  }

  // ------------------------------------------------------------ overlay (bars, numbers)
  private drawOverlay(g: Game, dt: number) {
    const ctx = this.octx;
    const w = this.root.clientWidth;
    const h = this.root.clientHeight;
    ctx.clearRect(0, 0, w, h);
    const view = this.host.view;
    const pt = { x: 0, y: 0, vis: true };
    const alpha = 1;
    void alpha;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // NPC / interactable names
    ctx.font = '600 13px Georgia, serif';
    for (const it of g.zone.interactables) {
      if (it.hidden) continue;
      if (!['captain', 'vendor', 'healer', 'artificer', 'waypoint', 'stash', 'gate_march', 'gate_refuge', 'portal_ashen', 'portal_return', 'archive_gate', 'cage', 'stairs_down', 'stairs_up', 'shrine', 'chest', 'cache', 'lever', 'door', 'hunt_exit', 'exit_summary'].includes(it.kind)) continue;
      const d = Math.hypot(it.x - g.player.x, it.z - g.player.z);
      if (d > 11 && this.host.view.game && !this.host.altHeld) continue;
      if (it.used && (it.kind === 'chest' || it.kind === 'lever' || it.kind === 'door' || it.kind === 'cage' || it.kind === 'cache')) continue;
      this.pr(it.x, it.kind === 'waypoint' ? 4.2 : 2.6, it.z, pt);
      if (!pt.vis || pt.x < 60 || pt.x > w - 60 || pt.y < 30 || pt.y > h - 175) continue;
      const a = Math.max(0.35, Math.min(1, 1.4 - d / 12));
      ctx.fillStyle = `rgba(0,0,0,${0.6 * a})`;
      const label = it.label;
      const tw = ctx.measureText(label).width + 10;
      ctx.fillRect(pt.x - tw / 2, pt.y - 10, tw, 20);
      ctx.fillStyle = it.kind === 'waypoint' ? `rgba(120,235,255,${a})` : `rgba(240,220,170,${a})`;
      ctx.fillText(label, pt.x, pt.y);
    }
    // enemy bars
    for (const e of g.enemies) {
      if (!e.alive || e.neutral && e.type !== 'dummy') continue;
      if (e.boss && e.boss_state?.engaged) continue;
      const showBar = e.type === 'dummy' ? false : e.hp < e.maxHp || e.aggro || e.elite || this.hoverEnemy === e.id;
      if (!showBar) continue;
      const hh = e.def.scale * (e.elite ? 1.18 : 1) * (e.type === 'toll_keeper' ? 2.2 : e.type === 'orison_engine' ? 2.2 : e.type === 'husk' || e.type === 'warden' ? 1.9 : 1.55);
      this.pr(e.x, hh + 0.4, e.z, pt);
      if (!pt.vis || pt.x < -40 || pt.x > w + 40 || pt.y < -40 || pt.y > h + 40) continue;
      const bw = e.boss ? 120 : e.elite ? 78 : 44;
      const bh = e.elite || e.boss ? 7 : 5;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(pt.x - bw / 2 - 1, pt.y - bh / 2 - 1, bw + 2, bh + 2);
      const f = Math.max(0, e.hp / e.maxHp);
      ctx.fillStyle = e.elite ? '#e8a040' : e.type === 'ward' ? '#b36bff' : '#c83a3a';
      ctx.fillRect(pt.x - bw / 2, pt.y - bh / 2, bw * f, bh);
      if (e.elite || this.hoverEnemy === e.id) {
        ctx.font = '600 12px Georgia, serif';
        ctx.fillStyle = e.elite ? '#ffd060' : '#e8e0d0';
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.lineWidth = 3;
        const nm = `${e.name} (Lv ${e.level})`;
        ctx.strokeText(nm, pt.x, pt.y - 12);
        ctx.fillText(nm, pt.x, pt.y - 12);
        if (e.elite) {
          ctx.font = '11px Georgia, serif';
          ctx.fillStyle = '#ffcf80';
          const mods = e.mods.map((m) => m.replace('_', ' ')).join(' · ');
          ctx.strokeText(mods, pt.x, pt.y + 14);
          ctx.fillText(mods, pt.x, pt.y + 14);
        }
      }
    }
    // dummy dps
    const dummies = g.enemies.filter((x) => x.type === 'dummy').sort((a, b) => Math.hypot(a.x - g.player.x, a.z - g.player.z) - Math.hypot(b.x - g.player.x, b.z - g.player.z));
    for (const e of dummies.slice(0, 1)) {
      this.pr(e.x, 2.7, e.z, pt);
      if (!pt.vis || pt.x < 120 || pt.x > w - 120 || pt.y < 30 || pt.y > h - 60) continue;
      if (Math.hypot(e.x - g.player.x, e.z - g.player.z) > 14) continue;
      ctx.font = '600 13px Georgia, serif';
      ctx.fillStyle = '#e8d8a8';
      ctx.strokeStyle = 'rgba(0,0,0,0.9)';
      ctx.lineWidth = 3;
      const t = `Training Dummy – DPS ${g.dummyDps().toFixed(0)} · total ${Math.round(g.dummyDamage)}`;
      ctx.strokeText(t, pt.x, pt.y);
      ctx.fillText(t, pt.x, pt.y);
    }
    // floating numbers
    for (let i = this.floats.length - 1; i >= 0; i--) {
      const f = this.floats[i];
      f.age += dt;
      if (f.age > f.life) {
        this.floats.splice(i, 1);
        continue;
      }
      this.pr(f.x, 1.8, f.z, pt);
      const k = f.age / f.life;
      const y = pt.y + (f.down ? 1 : -1) * (k * 46) - 18;
      const x = pt.x + f.vx * k * 1.5;
      ctx.globalAlpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
      const pop = k < 0.12 ? 1 + (0.12 - k) * 3 : 1;
      ctx.font = `700 ${Math.round(f.size * pop)}px Georgia, serif`;
      ctx.strokeStyle = 'rgba(0,0,0,0.9)';
      ctx.lineWidth = 4;
      ctx.strokeText(f.text, x, y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, x, y);
      ctx.globalAlpha = 1;
    }
    // off-screen threat arrows (visual equivalent of directional audio warning)
    for (let i = this.arrows.length - 1; i >= 0; i--) {
      const a = this.arrows[i];
      a.t -= dt;
      if (a.t <= 0) {
        this.arrows.splice(i, 1);
        continue;
      }
      this.pr(a.x, 1, a.z, pt);
      const cx = w / 2;
      const cy = h / 2;
      const ang = Math.atan2(pt.y - cy, pt.x - cx);
      const ex = Math.max(30, Math.min(w - 30, cx + Math.cos(ang) * w));
      const ey = Math.max(30, Math.min(h - 30, cy + Math.sin(ang) * h));
      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate(ang);
      ctx.fillStyle = `rgba(255,90,50,${Math.min(1, a.t)})`;
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(-8, -10);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-8, 10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    // move invalid cursor marker handled by view; stand-still indicator
    if (g.player.standStill) {
      this.pr(g.player.x, 0.05, g.player.z, pt);
      ctx.strokeStyle = 'rgba(255,224,138,0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y, 26, 13, 0, 0, 7);
      ctx.stroke();
    }
  }

  // ------------------------------------------------------------ ground labels
  private updateLabels(g: Game) {
    const s = this.host.settings;
    const view = this.host.view;
    const pt = { x: 0, y: 0, vis: true };
    type L = { k: (typeof g.pickups)[number]; x: number; y: number; text: string; cls: string; rank: number; d: number };
    const list: L[] = [];
    const minRank = rarityRank(s.labelMin as Rarity);
    for (const k of g.pickups) {
      if (k.dead || k.kind === 'gold' && false) continue;
      const d = Math.hypot(k.x - g.player.x, k.z - g.player.z);
      if (d > 26) continue;
      let text = '';
      let cls: string = k.kind;
      let rank = 0;
      if (k.kind === 'item') {
        const it = k.item!;
        rank = rarityRank(it.rarity);
        if (rank < minRank && !this.host.altHeld) continue;
        if (it.rarity === 'worn' && !this.host.altHeld && s.labelMin === 'worn' && d > 14) continue;
        text = `${RARITY_ICON[it.rarity]} ${it.name}${it.identified ? '' : ' ?'}`;
        cls = `item ${it.rarity}`;
      } else if (k.kind === 'gold') {
        text = `${k.amount} gold`;
        rank = 0;
      } else if (k.kind === 'dust') text = `${k.amount} glyph dust`;
      else if (k.kind === 'potion') text = POTIONS[k.potion!].name;
      else if (k.kind === 'echo') text = `Echo (${k.amount} gold)`;
      else continue;
      this.pr(k.x, 0.9, k.z, pt);
      if (!pt.vis) continue;
      list.push({ k, x: pt.x, y: pt.y, text, cls, rank, d });
    }
    // rarity priority + collision avoidance (stack upward)
    list.sort((a, b) => b.rank - a.rank || a.d - b.d);
    const placed: { x: number; y: number; w: number }[] = [];
    while (this.labelPool.length < list.length) {
      const el = document.createElement('div');
      el.className = 'gl';
      this.labelsEl.appendChild(el);
      this.labelPool.push(el);
      el.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        const id = Number(el.dataset.id);
        if (e.button === 0) this.host.onPickupClick(id);
      });
      el.addEventListener('mouseenter', () => {
        const id = Number(el.dataset.id);
        const gm = this.host.game;
        const k = gm?.pickups.find((x) => x.id === id);
        if (k?.item && gm) this.host.tooltip(`<div class="tt-name" style="color:${RARITY_CSS[k.item.rarity]}">${esc(k.item.name)}</div><div class="tt-sub">Click to pick up</div>`, el.getBoundingClientRect().right, el.getBoundingClientRect().top);
      });
      el.addEventListener('mouseleave', () => this.host.tooltip(null));
    }
    list.forEach((l, i) => {
      const el = this.labelPool[i];
      const w = l.text.length * 7.2 + 14;
      let y = l.y;
      for (let tries = 0; tries < 12; tries++) {
        const hit = placed.find((p) => Math.abs(p.x - l.x) < (p.w + w) / 2 && Math.abs(p.y - y) < 20);
        if (!hit) break;
        y = hit.y - 21;
      }
      placed.push({ x: l.x, y, w });
      el.style.display = 'block';
      el.style.left = l.x + 'px';
      el.style.top = y + 'px';
      el.style.opacity = String(Math.max(0.45, Math.min(1, 1.5 - l.d / 22)));
      el.className = `gl ${l.cls}`;
      el.dataset.id = String(l.k.id);
      if (el.textContent !== l.text) el.textContent = l.text;
    });
    for (let i = list.length; i < this.labelPool.length; i++) this.labelPool[i].style.display = 'none';
  }
}

export { CLASS_SKILLS };
export type { Enemy };
