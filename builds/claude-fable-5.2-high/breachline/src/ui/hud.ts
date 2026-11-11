// client-ui: in-match HUD. A lightweight, batched DOM layer (no React on the input-to-photon path): the game
// fills one state object per frame and the HUD only touches the DOM when a displayed value actually changes.
import type { MapDef } from '../content/mapTypes';
import { MATS } from '../content/mapTypes';
import { TEAM_NAMES } from '../content/tuning';
import { ZONE_NAMES } from '../sim/hitboxes';
import type { HitRecord } from '../protocol/messages';

export interface HudTag { x: number; y: number; text: string; kind: 'mate' | 'enemy' | 'mark' | 'ping' | 'warn' | 'eq' | 'pod'; alpha: number }
export interface MiniDot { x: number; z: number; kind: 'self' | 'mate' | 'enemy' | 'ping' | 'device' | 'danger'; yaw?: number; r?: number; alpha?: number }
export interface MiniLine { x: number; z: number; yaw: number; len: number; width: number }

export interface HudState {
  visible: boolean;
  alive: boolean;
  team: 0 | 1;
  health: number;
  protect: boolean;
  revealed: boolean;
  weaponName: string;
  mag: number; magSize: number; reserve: number;
  altName: string; altMag: number;
  reloading: boolean;
  lethalName: string; lethalReady: number; tacticalName: string; tacticalReady: number;
  spread: number; // crosshair gap in px
  showCrosshair: boolean;
  scope: number;
  score: [number, number]; scoreLimit: number;
  timeLeft: number; phase: number;
  momentum: number; // doubled units
  supports: { name: string; cost: number; ready: boolean; blocked: boolean }[];
  supportSel: number;
  uplink: boolean;
  flash: number; flashDark: boolean;
  smoke: number;
  respawnIn: number;
  loadoutNames: string[]; loadoutSel: number;
  zone: string;
  showBoard: boolean;
  tags: HudTag[];
  dots: MiniDot[];
  lines: MiniLine[];
  selfX: number; selfZ: number; selfYaw: number;
  debug: string;
  countdown: number;
  prompt: string;
}

export interface BoardRow { id: number; name: string; team: number; bot: boolean; kills: number; deaths: number; assists: number; score: number; me: boolean }

const el = (tag: string, cls: string, parent: HTMLElement, html = ''): HTMLElement => {
  const e = document.createElement(tag);
  e.className = cls;
  if (html) e.innerHTML = html;
  parent.appendChild(e);
  return e;
};
const esc = (s: string): string => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);
const fmtTime = (t: number): string => { const s = Math.max(0, Math.ceil(t)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

export class Hud {
  readonly root: HTMLElement;
  private cache: Record<string, string | number | boolean> = {};
  private x: HTMLElement[] = [];
  private xhair: HTMLElement; private hitm: HTMLElement; private hitT = 0;
  private sc: HTMLElement[] = []; private bars: HTMLElement[] = []; private you: HTMLElement[] = [];
  private clock!: HTMLElement; private tm!: HTMLElement; private ph!: HTMLElement;
  private mini: HTMLCanvasElement; private miniBg: HTMLCanvasElement; private loc: HTMLElement;
  private feed: HTMLElement;
  private vitals: HTMLElement; private hp: HTMLElement; private hpb: HTMLElement; private vsub: HTMLElement;
  private ammo: HTMLElement; private wn: HTMLElement; private cnt: HTMLElement; private res: HTMLElement; private alt: HTMLElement;
  private eq: { root: HTMLElement; nm: HTMLElement; fill: HTMLElement }[] = [];
  private pips: HTMLElement[] = []; private sup: { root: HTMLElement; n: HTMLElement; c: HTMLElement }[] = []; private mhint: HTMLElement;
  private center: HTMLElement; private prompt: HTMLElement;
  private banner: HTMLElement; private bA: HTMLElement; private bB: HTMLElement; private bannerT = 0;
  private count: HTMLElement;
  private dmg: { el: HTMLElement; t: number; wx: number; wz: number }[] = [];
  private ovLow: HTMLElement; private ovHit: HTMLElement; private ovFlash: HTMLElement; private ovSmoke: HTMLElement; private ovDead: HTMLElement; private ovScope: HTMLElement;
  private hitFlash = 0;
  private tags: HTMLElement; private tagPool: HTMLElement[] = [];
  private recap: HTMLElement; private recapBody: HTMLElement; private respT: HTMLElement; private los: HTMLElement;
  private board: HTMLElement; private boardBody: HTMLElement; private boardRows: BoardRow[] = []; private boardDirty = true;
  private dbg: HTMLElement; private subs: HTMLElement; private subsT = 0;
  private scale: number; private mw: number; private mh: number;
  private miniT = 0;

  constructor(parent: HTMLElement, private map: MapDef) {
    parent.innerHTML = '';
    const r = (this.root = el('div', 'hud hidden', parent));
    this.ovScope = el('div', 'overlay ov-scope', r);
    this.ovLow = el('div', 'overlay ov-low', r);
    this.ovHit = el('div', 'overlay ov-hit', r);
    this.ovSmoke = el('div', 'overlay ov-smoke', r);
    this.ovFlash = el('div', 'overlay ov-flash', r);
    this.ovDead = el('div', 'overlay ov-dead', r);
    this.tags = el('div', 'tags', r);
    const dd = el('div', 'dmgdir', r);
    for (let i = 0; i < 5; i++) this.dmg.push({ el: el('i', '', dd), t: 0, wx: 0, wz: 0 });
    this.xhair = el('div', 'xhair', r);
    for (const c of ['l', 'r', 'u', 'd', 'dot']) this.x.push(el('i', c, this.xhair));
    this.hitm = el('div', 'hitm', r);
    [45, 135, 225, 315].forEach((a) => { const i = el('i', '', this.hitm); i.style.transform = `rotate(${a}deg) translateX(7px)`; });

    const top = el('div', 'top', r);
    for (const t of [0, 1]) {
      if (t === 1) {
        this.clock = el('div', 'clock box', top);
        this.tm = el('div', 'tm', this.clock, '0:00');
        this.ph = el('div', 'ph', this.clock, 'Warmup');
      }
      const team = el('div', `team box t${t}`, top);
      const row = el('div', 'row', team);
      const left = el('div', '', row);
      el('div', 'nm', left, TEAM_NAMES[t]);
      this.you.push(el('div', 'you', left, ''));
      this.sc.push(el('div', 'sc', row, '0'));
      const bar = el('div', 'bar', team);
      this.bars.push(el('b', '', bar));
    }

    // minimap
    const b = map.bounds;
    this.scale = 2.05;
    this.mw = Math.round((b.maxX - b.minX) * this.scale); this.mh = Math.round((b.maxZ - b.minZ) * this.scale);
    const mini = el('div', 'mini box', r);
    this.mini = document.createElement('canvas');
    this.mini.width = this.mw; this.mini.height = this.mh;
    mini.appendChild(this.mini);
    this.loc = el('div', 'loc', mini, '<b></b><span>K-17</span>');
    this.miniBg = this.drawMiniBg();

    this.feed = el('div', 'feed', r);
    this.vitals = el('div', 'vitals', r);
    this.hp = el('div', 'hp', this.vitals, '100');
    const vr = el('div', '', this.vitals);
    this.vsub = el('div', 'sub', vr, '');
    const hb = el('div', 'hpbar', vr);
    this.hpb = el('b', '', hb);

    this.ammo = el('div', 'ammo', r);
    this.wn = el('div', 'wn', this.ammo, '');
    const cnt = el('div', 'cnt', this.ammo);
    this.cnt = el('span', '', cnt, '30');
    this.res = el('small', '', cnt, '/ 120');
    this.alt = el('div', 'alt', this.ammo, '');
    const eq = el('div', 'eq', this.ammo);
    for (const key of ['Q', 'G']) {
      const e = el('div', 'eqi box', eq);
      el('div', 'key', e, key);
      const nm = el('div', 'nm', e, '');
      const fill = el('div', 'fill', e);
      this.eq.push({ root: e, nm, fill });
    }

    const mo = el('div', 'momentum', r);
    el('div', 'ttl', mo, 'Momentum');
    const pips = el('div', 'pips', mo);
    for (let i = 0; i < 8; i++) this.pips.push(el('i', i === 2 || i === 4 ? 'tier' : '', pips));
    for (let i = 0; i < 3; i++) {
      const s = el('div', 'sup box', mo);
      const n = el('span', 'n', s, '');
      const c = el('span', 'c', s, '');
      this.sup.push({ root: s, n, c });
    }
    this.mhint = el('div', 'hint', mo, '');

    this.center = el('div', 'center', r);
    this.prompt = el('div', 'prompt', r, '');
    this.banner = el('div', 'banner', r);
    this.bA = el('div', 'a', this.banner); this.bB = el('div', 'b', this.banner);
    this.count = el('div', 'count', r);
    this.subs = el('div', 'subs', r);

    this.recap = el('div', 'recap box', r);
    this.recapBody = el('div', '', this.recap);
    const resp = el('div', 'resp', this.recap);
    this.respT = el('div', 't', resp, '');
    this.los = el('div', 'los', resp);

    this.board = el('div', 'board box', r);
    this.boardBody = el('div', '', this.board);
    this.dbg = el('div', 'dbg', r);
  }

  private drawMiniBg(): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = this.mw; c.height = this.mh;
    const g = c.getContext('2d')!;
    const b = this.map.bounds, s = this.scale;
    const X = (x: number) => (x - b.minX) * s, Z = (z: number) => (b.maxZ - z) * s;
    g.fillStyle = 'rgba(16,26,34,0.9)'; g.fillRect(0, 0, c.width, c.height);
    // district tints
    for (const zn of this.map.zones) {
      if (!zn.indoor || zn.maxY - zn.minY > 20) continue;
      g.fillStyle = 'rgba(70,110,128,0.3)';
      g.fillRect(X(zn.minX), Z(zn.maxZ), (zn.maxX - zn.minX) * s, (zn.maxZ - zn.minZ) * s);
    }
    for (const sd of this.map.solids) {
      if (sd.mat === 'boundary' || sd.mat === 'ground' || sd.mat === 'deck' || sd.mat === 'floor' || sd.mat === 'roof' || sd.mat === 'glass') continue;
      const h = sd.max[1] - Math.max(0, sd.min[1]);
      if (sd.min[1] > 2.4 || sd.max[1] < 0.3) continue;
      if (sd.kind === 'ramp') { g.fillStyle = 'rgba(150,175,186,0.28)'; g.fillRect(X(sd.min[0]), Z(sd.max[2]), (sd.max[0] - sd.min[0]) * s, (sd.max[2] - sd.min[2]) * s); continue; }
      g.fillStyle = MATS[sd.mat].see ? 'rgba(150,175,186,0.3)' : h > 1.6 ? 'rgba(188,208,216,0.92)' : 'rgba(140,165,176,0.55)';
      if (sd.kind === 'cyl') { g.beginPath(); g.arc(X((sd.min[0] + sd.max[0]) / 2), Z((sd.min[2] + sd.max[2]) / 2), ((sd.max[0] - sd.min[0]) / 2) * s, 0, 7); g.fill(); }
      else g.fillRect(X(sd.min[0]), Z(sd.max[2]), Math.max(1.2, (sd.max[0] - sd.min[0]) * s), Math.max(1.2, (sd.max[2] - sd.min[2]) * s));
    }
    // tunnel hint
    g.strokeStyle = 'rgba(53,223,240,0.35)'; g.setLineDash([3, 3]); g.strokeRect(X(-17), Z(2), 34 * s, 4 * s); g.setLineDash([]);
    g.strokeStyle = 'rgba(150,195,212,0.5)'; g.lineWidth = 1; g.strokeRect(0.5, 0.5, c.width - 1, c.height - 1);
    return c;
  }

  private set(key: string, v: string | number | boolean, apply: () => void): void {
    if (this.cache[key] === v) return;
    this.cache[key] = v;
    apply();
  }

  // ------------------------------------------------------------------ event-driven widgets
  hitMarker(kind: 'hit' | 'head' | 'kill' | 'device'): void {
    this.hitm.className = 'hitm ' + kind;
    this.hitT = kind === 'kill' ? 0.42 : 0.2;
  }

  damageFrom(wx: number, wz: number, amount: number): void {
    let slot = this.dmg[0];
    for (const d of this.dmg) if (d.t < slot.t) slot = d;
    slot.t = 1.3; slot.wx = wx; slot.wz = wz;
    this.hitFlash = Math.min(1, this.hitFlash + 0.25 + amount / 90);
  }

  killFeed(killer: string, kTeam: number, victim: string, vTeam: number, weapon: string, head: boolean, mine: boolean): void {
    const k = el('div', 'k' + (mine ? ' mine' : ''), this.feed, `<span class="c${kTeam}">${esc(killer)}</span><span class="w">${head ? '<span class="hs">◎</span>' : ''}${esc(weapon)}</span><span class="c${vTeam}">${esc(victim)}</span>`);
    while (this.feed.children.length > 5) this.feed.firstChild!.remove();
    setTimeout(() => { k.style.transition = 'opacity 0.4s'; k.style.opacity = '0'; setTimeout(() => k.remove(), 420); }, 5200);
  }

  scorePopup(label: string, amount: number): void {
    el('div', 'pop', this.center, `<b>+${amount}</b>${esc(label)}`);
    while (this.center.children.length > 4) this.center.firstChild!.remove();
    const node = this.center.lastChild as HTMLElement;
    setTimeout(() => node.remove(), 1650);
  }

  announce(title: string, sub = '', tone: 'good' | 'danger' | 'gold' | '' = '', seconds = 2.6): void {
    this.banner.className = 'banner on ' + tone;
    this.bA.textContent = title; this.bB.textContent = sub;
    this.bannerT = seconds;
  }

  subtitle(text: string): void { this.subs.textContent = text; this.subs.className = 'subs on'; this.subsT = 3; }

  showRecap(killer: string, kTeam: number, weapon: string, dist: number, hits: HitRecord[], killerHealth: number, self: boolean): void {
    const max = Math.max(1, ...hits.map((h) => h.dmg));
    const bars = hits.map((h) => `<div class="hb ${h.zone === 0 ? 'head' : ''} ${h.src !== weapon && !self ? 'other' : ''}" style="height:${Math.round(8 + (h.dmg / max) * 30)}px" title="${ZONE_NAMES[h.zone] ?? ''}"><span>${h.dmg}</span></div>`).join('');
    const first = hits.length ? hits[0].t : 0;
    this.recapBody.innerHTML = `<div class="h">${self ? 'Eliminated' : 'Eliminated by'}</div><div class="who c${kTeam}" style="color:var(--t${kTeam})">${esc(self ? 'Your own equipment' : killer)}</div>`
      + `<div class="meta"><span>Weapon <b>${esc(weapon)}</b></span>${self ? '' : `<span>Distance <b>${dist.toFixed(0)} m</b></span><span>Their health <b>${killerHealth}</b></span>`}<span>Hits <b>${hits.length}</b></span></div>`
      + `<div class="hits">${bars}</div><div class="legend"><span>${first.toFixed(1)} s before death</span><span>◼ gold = headshot · grey = other source</span><span>final hit</span></div>`;
    this.recap.classList.add('on');
  }
  hideRecap(): void { this.recap.classList.remove('on'); }

  setBoard(rows: BoardRow[]): void { this.boardRows = rows; this.boardDirty = true; }

  private renderBoard(score: [number, number]): void {
    this.boardDirty = false;
    const team = (t: number) => {
      const rows = this.boardRows.filter((r) => r.team === t).sort((a, b) => b.score - a.score);
      return `<div><div class="tn c${t}"><span>${TEAM_NAMES[t]}</span><span>${score[t]}</span></div><table><tr><th>Operator</th><th>Score</th><th>K</th><th>D</th><th>A</th><th>Ping</th></tr>`
        + rows.map((r) => `<tr class="${r.me ? 'me' : ''}"><td>${esc(r.name)}${r.bot ? '<span class="bot">BOT</span>' : ''}</td><td>${r.score}</td><td>${r.kills}</td><td>${r.deaths}</td><td>${r.assists}</td><td>${r.bot ? '–' : 'local'}</td></tr>`).join('') + '</table></div>';
    };
    this.boardBody.innerHTML = `<h3><span>Team Clash · Relay Station K-17</span><span>Practice</span></h3><div class="cols">${team(0)}${team(1)}</div>`;
  }

  // ------------------------------------------------------------------ per-frame
  frame(s: HudState, dt: number): void {
    this.set('vis', s.visible, () => this.root.classList.toggle('hidden', !s.visible));
    if (!s.visible) return;
    // crosshair
    const showX = s.showCrosshair && s.alive;
    this.set('xs', showX, () => { this.xhair.style.display = showX ? '' : 'none'; });
    if (showX) {
      const gp = Math.round(s.spread);
      this.set('xg', gp, () => {
        this.x[0].style.left = `${-gp - 9}px`; this.x[1].style.left = `${gp}px`;
        this.x[2].style.top = `${-gp - 9}px`; this.x[3].style.top = `${gp}px`;
      });
    }
    if (this.hitT > 0) { this.hitT -= dt; this.hitm.style.opacity = String(Math.min(1, this.hitT * 8)); } else this.set('hm0', 0, () => { this.hitm.style.opacity = '0'; });
    if (this.hitT > 0) this.cache.hm0 = 1;
    // score + clock
    for (const t of [0, 1]) {
      this.set('sc' + t, s.score[t], () => { this.sc[t].textContent = String(s.score[t]); });
      const w = Math.round(Math.min(1, s.score[t] / Math.max(1, s.scoreLimit)) * 100);
      this.set('bar' + t, w, () => { this.bars[t].style.width = w + '%'; });
      this.set('you' + t, s.team === t, () => { this.you[t].textContent = s.team === t ? 'YOUR TEAM' : ''; });
    }
    const tsec = Math.ceil(s.timeLeft);
    this.set('tm', tsec, () => { this.tm.textContent = fmtTime(s.timeLeft); });
    const phName = s.phase === 0 ? 'Warmup' : s.phase === 2 ? 'Sudden death' : s.phase === 3 ? 'Match over' : `First to ${s.scoreLimit}`;
    this.set('ph', phName, () => { this.ph.textContent = phName; });
    this.set('cw', s.phase === 2 || (s.phase === 1 && s.timeLeft < 30), () => this.clock.classList.toggle('warn', s.phase === 2 || (s.phase === 1 && s.timeLeft < 30)));
    // vitals
    const hp = Math.max(0, Math.ceil(s.health));
    this.set('hp', hp, () => { this.hp.textContent = String(hp); this.hpb.style.width = hp + '%'; });
    this.set('low', hp <= 35 && s.alive, () => this.vitals.classList.toggle('low', hp <= 35 && s.alive));
    const sub = (s.protect ? '<span class="prot">Spawn shield</span>' : '') + (s.revealed ? '<span class="rev">Revealed</span>' : '') + (s.uplink ? '<span class="prot">Team uplink</span>' : '');
    this.set('vsub', sub, () => { this.vsub.innerHTML = sub; });
    this.set('va', s.alive, () => { this.vitals.style.opacity = s.alive ? '1' : '0.35'; this.ammo.style.opacity = s.alive ? '1' : '0.35'; });
    // ammo
    this.set('wn', s.weaponName, () => { this.wn.textContent = s.weaponName; });
    const cntText = s.reloading ? 'RELOAD' : String(s.mag);
    this.set('mag', cntText, () => { this.cnt.textContent = cntText; this.cnt.style.fontSize = s.reloading ? '30px' : ''; });
    this.set('res', s.reserve, () => { this.res.textContent = '/ ' + s.reserve; });
    const lowAmmo = s.mag <= Math.ceil(s.magSize * 0.25);
    this.set('al', (s.mag === 0 ? 2 : lowAmmo ? 1 : 0), () => { this.ammo.classList.toggle('low', lowAmmo && s.mag > 0); this.ammo.classList.toggle('empty', s.mag === 0); });
    const alt = `${s.altName} · ${s.altMag}`;
    this.set('alt', alt, () => { this.alt.textContent = alt; });
    const eqs: [string, number][] = [[s.tacticalName, s.tacticalReady], [s.lethalName, s.lethalReady]];
    eqs.forEach(([name, ready], i) => {
      this.set('eqn' + i, name, () => { this.eq[i].nm.textContent = name; });
      const pct = Math.round(ready * 100);
      this.set('eqr' + i, pct, () => { this.eq[i].fill.style.width = pct + '%'; this.eq[i].root.classList.toggle('off', pct < 100); });
    });
    // momentum
    this.set('mo', s.momentum, () => {
      for (let i = 0; i < 8; i++) {
        const need = (i + 1) * 2;
        this.pips[i].classList.toggle('on', s.momentum >= need);
        this.pips[i].classList.toggle('half', s.momentum === need - 1);
      }
    });
    let anyReady = false;
    s.supports.forEach((sp, i) => {
      const key = `${sp.name}|${sp.ready}|${sp.blocked}|${s.supportSel === i}`;
      if (sp.ready) anyReady = true;
      this.set('sup' + i, key, () => {
        const e = this.sup[i];
        e.n.textContent = sp.name;
        e.c.textContent = sp.ready ? (sp.blocked ? 'WAIT' : 'READY') : `${sp.cost}`;
        e.root.className = 'sup box' + (sp.ready ? ' ready' : '') + (sp.ready && s.supportSel === i ? ' sel' : '') + (sp.blocked ? ' busy' : '');
      });
    });
    this.set('mh', anyReady, () => { this.mhint.textContent = anyReady ? '[3] select  [4] deploy' : ''; });
    // overlays
    const low = s.alive ? Math.max(0, (40 - s.health) / 40) : 0;
    this.set('ovl', Math.round(low * 20), () => { this.ovLow.style.opacity = low.toFixed(2); });
    if (this.hitFlash > 0.01) { this.hitFlash = Math.max(0, this.hitFlash - dt * 2.2); this.ovHit.style.opacity = this.hitFlash.toFixed(2); this.cache.ovh = 1; }
    else this.set('ovh', 0, () => { this.ovHit.style.opacity = '0'; });
    const fl = Math.min(1, s.flash / 1.1);
    this.set('ovf', Math.round(fl * 40), () => { this.ovFlash.style.opacity = (s.flashDark ? fl * 0.96 : fl).toFixed(2); });
    this.set('ovfd', s.flashDark, () => this.ovFlash.classList.toggle('dark', s.flashDark));
    this.set('ovs', Math.round(s.smoke * 20), () => { this.ovSmoke.style.opacity = (s.smoke * 0.93).toFixed(2); });
    this.set('ovd', s.alive, () => { this.ovDead.style.opacity = s.alive ? '0' : '1'; if (s.alive) this.hideRecap(); });
    this.set('ovsc', Math.round(s.scope * 10), () => { this.ovScope.style.opacity = s.scope.toFixed(2); });
    // damage direction arcs follow the source as the view turns
    for (const d of this.dmg) {
      if (d.t <= 0) continue;
      d.t -= dt;
      const ang = Math.atan2(d.wx - s.selfX, d.wz - s.selfZ) - s.selfYaw;
      d.el.style.opacity = String(Math.max(0, Math.min(1, d.t * 1.5)));
      d.el.style.transform = `rotate(${ang}rad)`;
    }
    // banners / countdown / subtitles / prompt
    if (this.bannerT > 0) { this.bannerT -= dt; if (this.bannerT <= 0) this.banner.classList.remove('on'); }
    if (this.subsT > 0) { this.subsT -= dt; if (this.subsT <= 0) this.subs.classList.remove('on'); }
    const cd = s.countdown > 0 ? Math.ceil(s.countdown) : 0;
    this.set('cd', cd, () => { this.count.className = 'count' + (cd > 0 ? ' on' : ''); this.count.innerHTML = cd > 0 ? `${cd}<small>Match begins</small>` : ''; });
    this.set('pr', s.prompt, () => { this.prompt.textContent = s.prompt; });
    // death recap footer
    if (!s.alive && s.phase !== 3) {
      const rt = s.respawnIn > 0.05 ? `Redeploy in ${s.respawnIn.toFixed(1)}` : 'Redeploying';
      this.set('rt', rt, () => { this.respT.textContent = rt; });
      const lk = s.loadoutNames.join('|') + s.loadoutSel;
      this.set('los', lk, () => { this.los.innerHTML = s.loadoutNames.map((n, i) => `<div class="lo${i === s.loadoutSel ? ' sel' : ''}"><b>${i + 1}</b>${esc(n)}</div>`).join(''); });
    }
    // scoreboard
    this.set('bd', s.showBoard, () => this.board.classList.toggle('on', s.showBoard));
    if (s.showBoard && (this.boardDirty || this.cache.bsc !== s.score[0] * 1000 + s.score[1])) { this.cache.bsc = s.score[0] * 1000 + s.score[1]; this.renderBoard(s.score); }
    // world tags
    let ti = 0;
    for (const t of s.tags) {
      let e = this.tagPool[ti];
      if (!e) { e = el('div', 'tag', this.tags); this.tagPool.push(e); }
      e.className = 'tag ' + t.kind;
      if (e.textContent !== t.text) e.textContent = t.text;
      e.style.left = t.x.toFixed(0) + 'px'; e.style.top = t.y.toFixed(0) + 'px';
      e.style.opacity = t.alpha.toFixed(2);
      e.style.display = '';
      ti++;
    }
    for (; ti < this.tagPool.length; ti++) if (this.tagPool[ti].style.display !== 'none') this.tagPool[ti].style.display = 'none';
    this.set('zone', s.zone, () => { (this.loc.firstChild as HTMLElement).textContent = s.zone; });
    this.set('dbg', s.debug, () => { this.dbg.textContent = s.debug; });
    // minimap at ~30 Hz
    this.miniT -= dt;
    if (this.miniT <= 0) { this.miniT = 0.033; this.drawMini(s); }
  }

  private drawMini(s: HudState): void {
    const g = this.mini.getContext('2d')!;
    const b = this.map.bounds, sc = this.scale;
    const X = (x: number) => (x - b.minX) * sc, Z = (z: number) => (b.maxZ - z) * sc;
    g.clearRect(0, 0, this.mw, this.mh);
    g.drawImage(this.miniBg, 0, 0);
    const css = getComputedStyle(document.documentElement);
    const col = [css.getPropertyValue('--t0').trim() || '#35dff0', css.getPropertyValue('--t1').trim() || '#ff8424'];
    const friend = col[s.team], foe = '#ff4a3a';
    for (const l of s.lines) {
      g.save();
      g.translate(X(l.x), Z(l.z)); g.rotate(l.yaw);
      g.fillStyle = 'rgba(255,60,40,0.3)'; g.strokeStyle = 'rgba(255,60,40,0.9)';
      g.fillRect((-l.width / 2) * sc, -l.len * sc, l.width * sc, l.len * sc);
      g.strokeRect((-l.width / 2) * sc, -l.len * sc, l.width * sc, l.len * sc);
      g.restore();
    }
    for (const d of s.dots) {
      const x = X(d.x), y = Z(d.z);
      g.globalAlpha = d.alpha ?? 1;
      if (d.kind === 'danger') { g.strokeStyle = foe; g.fillStyle = 'rgba(255,60,40,0.25)'; g.beginPath(); g.arc(x, y, (d.r ?? 6) * sc, 0, 7); g.fill(); g.stroke(); }
      else if (d.kind === 'ping') { g.strokeStyle = '#ffd166'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y - 5); g.lineTo(x + 5, y); g.lineTo(x, y + 5); g.lineTo(x - 5, y); g.closePath(); g.stroke(); g.lineWidth = 1; }
      else if (d.kind === 'device') { g.fillStyle = friend; g.fillRect(x - 2.5, y - 2.5, 5, 5); }
      else if (d.kind === 'enemy') { g.fillStyle = foe; g.beginPath(); g.arc(x, y, 3.6, 0, 7); g.fill(); }
      else {
        g.save(); g.translate(x, y); g.rotate(d.yaw ?? 0);
        g.fillStyle = d.kind === 'self' ? '#ffffff' : friend;
        g.beginPath();
        if (d.kind === 'self') { g.moveTo(0, -7); g.lineTo(5, 5); g.lineTo(0, 2.5); g.lineTo(-5, 5); } else { g.moveTo(0, -5); g.lineTo(3.6, 3.6); g.lineTo(-3.6, 3.6); }
        g.closePath(); g.fill();
        if (d.kind === 'self') { g.strokeStyle = 'rgba(0,0,0,0.7)'; g.stroke(); }
        g.restore();
      }
    }
    g.globalAlpha = 1;
  }

  reset(): void {
    this.feed.innerHTML = ''; this.center.innerHTML = '';
    this.hideRecap();
    this.banner.classList.remove('on');
    this.cache = {};
    for (const d of this.dmg) { d.t = 0; d.el.style.opacity = '0'; }
    this.hitFlash = 0;
  }
}
