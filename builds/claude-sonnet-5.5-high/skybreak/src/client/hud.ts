/** In-match HUD: consumes a per-frame read model and updates DOM only when values change. */
import { AMMO_CAPS, AMMO_COLORS, AMMO_NAMES, AMMO_TYPES, COMBAT, ITEMS, MOVE, RARITIES, WEAPONS, effectiveWeapon, type ItemId, type RarityShape, type WeaponId } from '../shared/content';
import type { Match, Focus } from '../sim/match';
import type { Player, Slot } from '../sim/types';
import { MapRenderer, type MapMarker } from './minimap';
import { drawRarityShape } from './gameview';
import type { Settings } from './settings';

const WEAPON_SHAPES: Record<WeaponId, { len: number; barrel: number; stock: number; mag: number; thick: number; extra?: string }> = {
  wayfarer: { len: 30, barrel: 16, stock: 8, mag: 6, thick: 5 },
  tempest: { len: 24, barrel: 12, stock: 6, mag: 8, thick: 5 },
  breakwater: { len: 30, barrel: 18, stock: 8, mag: 0, thick: 7, extra: 'pump' },
  coil: { len: 28, barrel: 16, stock: 7, mag: 0, thick: 6, extra: 'coil' },
  needler: { len: 20, barrel: 8, stock: 4, mag: 10, thick: 5 },
  sundial: { len: 32, barrel: 20, stock: 8, mag: 5, thick: 4, extra: 'scope' },
  longwake: { len: 34, barrel: 26, stock: 8, mag: 4, thick: 4, extra: 'scope' },
  harbor: { len: 14, barrel: 5, stock: 0, mag: 7, thick: 5 },
  gale: { len: 26, barrel: 12, stock: 6, mag: 0, thick: 7, extra: 'bell' },
};

export function drawWeaponIcon(ctx: CanvasRenderingContext2D, id: WeaponId, w: number, h: number, rarityColor: string): void {
  ctx.clearRect(0, 0, w, h);
  const s = WEAPON_SHAPES[id];
  const def = WEAPONS[id];
  const sc = Math.min(w / 72, h / 30) * 1.0;
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.scale(sc * 1.7, sc * 1.7);
  const x0 = -(s.len + s.barrel) / 2;
  ctx.fillStyle = def.color;
  ctx.strokeStyle = 'rgba(0,0,0,0.65)'; ctx.lineWidth = 0.9;
  const rect = (x: number, y: number, rw: number, rh: number, fill?: string) => { ctx.fillStyle = fill ?? def.color; ctx.fillRect(x, y, rw, rh); ctx.strokeRect(x, y, rw, rh); };
  rect(x0 + s.stock, -s.thick / 2, s.len - s.stock, s.thick);
  if (s.stock) rect(x0, -s.thick / 2 + 1, s.stock, s.thick - 2, '#8a5a3a');
  rect(x0 + s.len, -1.2, s.barrel, 2.4, '#3a3a44');
  if (s.mag) rect(x0 + s.len * 0.45, s.thick / 2, 3.2, s.mag, '#3a3a44');
  rect(x0 + s.stock + 4, s.thick / 2, 2.6, 6, '#3a3a44');
  if (s.extra === 'scope') rect(x0 + s.len * 0.35, -s.thick / 2 - 3.6, s.len * 0.45, 2.8, '#3a3a44');
  if (s.extra === 'bell') { ctx.fillStyle = '#c77d3d'; ctx.beginPath(); ctx.moveTo(x0 + s.len + s.barrel - 2, -4.5); ctx.lineTo(x0 + s.len + s.barrel + 5, -6); ctx.lineTo(x0 + s.len + s.barrel + 5, 6); ctx.lineTo(x0 + s.len + s.barrel - 2, 4.5); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  if (s.extra === 'coil') for (let i = 0; i < 3; i++) rect(x0 + s.len + 3 + i * 4, -3.6, 1.6, 7.2, '#c77d3d');
  if (s.extra === 'pump') rect(x0 + s.len + 3, 1.4, 9, 3, '#6a4630');
  rect(x0 + s.len * 0.62, -s.thick / 2 - 1.8, 2.6, 2.6, rarityColor);
  ctx.restore();
}

export function drawItemIcon(ctx: CanvasRenderingContext2D, id: ItemId, w: number, h: number): void {
  ctx.clearRect(0, 0, w, h);
  const col = ITEMS[id].color;
  ctx.save(); ctx.translate(w / 2, h / 2);
  ctx.fillStyle = col; ctx.strokeStyle = 'rgba(0,0,0,0.65)'; ctx.lineWidth = 2;
  const r = Math.min(w, h) * 0.38;
  switch (id) {
    case 'medInjector': ctx.fillRect(-r * 0.25, -r, r * 0.5, r * 1.5); ctx.strokeRect(-r * 0.25, -r, r * 0.5, r * 1.5); ctx.fillStyle = '#fff'; ctx.fillRect(-r * 0.08, r * 0.5, r * 0.16, r * 0.6); break;
    case 'traumaKit': ctx.fillStyle = '#eee'; ctx.fillRect(-r * 1.1, -r * 0.7, r * 2.2, r * 1.4); ctx.strokeRect(-r * 1.1, -r * 0.7, r * 2.2, r * 1.4); ctx.fillStyle = col; ctx.fillRect(-r * 0.2, -r * 0.55, r * 0.4, r * 1.1); ctx.fillRect(-r * 0.6, -r * 0.2, r * 1.2, r * 0.4); break;
    case 'shieldFlask': ctx.beginPath(); ctx.arc(0, r * 0.2, r * 0.8, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ddd'; ctx.fillRect(-r * 0.2, -r * 0.9, r * 0.4, r * 0.5); break;
    case 'aegisCell': ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * 0.9, -r * 0.5); ctx.lineTo(r * 0.7, r * 0.6); ctx.lineTo(0, r); ctx.lineTo(-r * 0.7, r * 0.6); ctx.lineTo(-r * 0.9, -r * 0.5); ctx.closePath(); ctx.fill(); ctx.stroke(); break;
    case 'mistCapsule': ctx.beginPath(); ctx.arc(-r * 0.4, r * 0.1, r * 0.55, 0, Math.PI * 2); ctx.arc(r * 0.3, -r * 0.1, r * 0.7, 0, Math.PI * 2); ctx.arc(0, r * 0.35, r * 0.5, 0, Math.PI * 2); ctx.fill(); break;
    case 'grappleSpool': ctx.lineWidth = 5; ctx.strokeStyle = col; ctx.beginPath(); ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 2; ctx.strokeStyle = '#000'; ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2); ctx.stroke(); break;
    case 'echoBeacon': ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * 0.8, 0); ctx.lineTo(0, r); ctx.lineTo(-r * 0.8, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); break;
    case 'windOrb': ctx.beginPath(); ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, r * 0.45, 0.4, 4.5); ctx.stroke(); break;
  }
  ctx.restore();
}

export interface HudCtx {
  match: Match;
  human: Player;
  view: Player; // player being displayed (self or spectated)
  spectating: boolean;
  focus: Focus;
  interactHold: number;
  swapPending: boolean;
  yaw: number;
  marker: MapMarker | null;
  settings: Settings;
  fps: number;
  adsT: number;
  stormOutside: boolean;
  trails: { x: number; z: number; age: number }[];
  canLeave: boolean;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', html = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

export class Hud {
  readonly root: HTMLElement;
  private alive!: HTMLElement; private kills!: HTMLElement; private compassStrip!: HTMLElement; private notice!: HTMLElement;
  private killfeed!: HTMLElement; private miniCanvas!: HTMLCanvasElement; private zoneTimer!: HTMLElement;
  private hp!: HTMLElement; private hpT!: HTMLElement; private ag!: HTMLElement; private agT!: HTMLElement; private rs!: HTMLElement; private st!: HTMLElement;
  private hpBar!: HTMLElement; private usingBar!: HTMLElement;
  private slotsEl!: HTMLElement; private slotEls: { root: HTMLElement; canvas: HTMLCanvasElement; nm: HTMLElement; cnt: HTMLElement; rar: HTMLCanvasElement; key: string }[] = [];
  private ammoBig!: HTMLElement; private ammoTypes!: HTMLElement; private weaponName!: HTMLElement;
  private cross!: HTMLElement; private hitm!: HTMLElement; private prompt!: HTMLElement; private dmgArcs!: HTMLElement; private sndRing!: HTMLElement;
  private vignette!: HTMLElement; private hurt!: HTMLElement; private dropPanel!: HTMLElement; private altPanel!: HTMLElement; private fpsEl!: HTMLElement;
  private range!: HTMLElement; private captions!: HTMLElement;
  private specTitle!: HTMLElement; private specBar!: HTMLElement; private hint!: HTMLElement;
  private noticeT = 0; private hitT = 0; private lastPrompt = ''; private lastHud: Record<string, string> = {};
  private minimapCtx!: CanvasRenderingContext2D;
  private mapRenderer: MapRenderer | null = null;
  onLeave: () => void = () => {};
  onNextSpectate: (d: number) => void = () => {};
  onFast: () => void = () => {};
  onHintClick: () => void = () => {};
  fastBtn!: HTMLButtonElement;

  constructor(parent: HTMLElement) {
    this.root = el('div'); this.root.id = 'hud'; this.root.classList.add('hidden');
    parent.appendChild(this.root);
    this.build();
  }

  private build(): void {
    const r = this.root;
    const tl = el('div', 'hud-top-left');
    this.alive = el('div', 'pill', '<span>ALIVE</span><b>24</b>');
    this.kills = el('div', 'pill', '<span>ELIMS</span><b>0</b>');
    this.killfeed = el('div', 'killfeed');
    tl.append(this.alive, this.kills, this.killfeed);
    r.appendChild(tl);

    const comp = el('div', 'compass');
    this.compassStrip = el('div', 'strip');
    const names: Record<number, string> = { 0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SW', 270: 'W', 315: 'NW' };
    for (let b = -180; b <= 540; b += 15) {
      const norm = ((b % 360) + 360) % 360;
      const t = el('div', 'tick' + (norm % 90 === 0 ? ' card' : ''), names[norm] ?? (norm % 45 === 0 ? '' : '·'));
      if (names[norm] === undefined && norm % 45 === 0) t.textContent = '';
      t.style.left = `${b * 3}px`;
      this.compassStrip.appendChild(t);
    }
    comp.append(this.compassStrip, el('div', 'center'));
    this.markerTick = el('div', 'tick marker', '▼'); this.markerTick.style.display = 'none';
    comp.appendChild(this.markerTick);
    r.appendChild(comp);
    this.notice = el('div', 'notice'); r.appendChild(this.notice);

    const mm = el('div', 'minimap-wrap');
    this.miniCanvas = el('canvas'); this.miniCanvas.width = this.miniCanvas.height = 424;
    this.minimapCtx = this.miniCanvas.getContext('2d')!;
    this.zoneTimer = el('div', 'zone-timer', '<span class="lbl">Calmfield</span><span class="tm">--</span>');
    mm.append(this.miniCanvas, this.zoneTimer);
    r.appendChild(mm);

    this.range = el('div', 'range-panel', ''); this.range.classList.add('hidden'); r.appendChild(this.range);

    // vitals
    const v = el('div', 'vitals');
    this.usingBar = el('div', 'using-bar');
    this.hpBar = el('div', 'vbar health', '<i></i><span class="t"></span>');
    const ag = el('div', 'vbar aegis', '<i></i><span class="t"></span>');
    const rs = el('div', 'vbar reserve', '<i></i>');
    const st = el('div', 'vbar stam', '<i></i>');
    v.append(this.usingBar, rs, ag, this.hpBar, st);
    this.hp = this.hpBar.querySelector('i')!; this.hpT = this.hpBar.querySelector('.t')!;
    this.ag = ag.querySelector('i')!; this.agT = ag.querySelector('.t')!; this.rs = rs.querySelector('i')!; this.st = st.querySelector('i')!;
    r.appendChild(v);

    // inventory
    const inv = el('div', 'inv');
    this.weaponName = el('div', 'weapon-name');
    const ammoLine = el('div', 'ammo-line');
    this.ammoBig = el('div', 'ammo-big', '');
    ammoLine.append(this.ammoBig);
    this.ammoTypes = el('div', 'ammo-types');
    this.slotsEl = el('div', 'slots');
    for (let i = 0; i < 5; i++) {
      const s = el('div', 'slot empty');
      const n = el('div', 'n', String(i + 1));
      const cv = el('canvas'); cv.width = 136; cv.height = 68;
      const nm = el('div', 'nm'); const cnt = el('div', 'cnt');
      const rar = el('canvas', 'rar'); rar.width = rar.height = 28;
      s.append(n, cv, nm, cnt, rar);
      this.slotsEl.appendChild(s);
      this.slotEls.push({ root: s, canvas: cv, nm, cnt, rar, key: '' });
    }
    inv.append(this.weaponName, ammoLine, this.ammoTypes, this.slotsEl);
    r.appendChild(inv);

    // crosshair and feedback
    this.cross = el('div', 'crosshair', '<i class="h1"></i><i class="h2"></i><i class="v1"></i><i class="v2"></i><i class="dot"></i>');
    r.appendChild(this.cross);
    this.hitm = el('div', 'hitmarker', '<i></i><i></i><i></i><i></i>'); r.appendChild(this.hitm);
    this.prompt = el('div', 'prompt'); this.prompt.classList.add('hidden'); r.appendChild(this.prompt);
    this.dmgArcs = el('div', 'dmg-arcs'); r.appendChild(this.dmgArcs);
    this.sndRing = el('div', 'snd-ring'); r.appendChild(this.sndRing);
    this.vignette = el('div', 'vignette'); r.appendChild(this.vignette);
    this.hurt = el('div', 'hurt-flash'); r.appendChild(this.hurt);
    this.dropPanel = el('div', 'drop-panel'); this.dropPanel.classList.add('hidden'); r.appendChild(this.dropPanel);
    this.altPanel = el('div', 'alt-panel'); this.altPanel.classList.add('hidden'); r.appendChild(this.altPanel);
    this.captions = el('div', 'captions'); r.appendChild(this.captions);
    this.fpsEl = el('div', 'fps'); r.appendChild(this.fpsEl);

    this.specTitle = el('div', 'spectate-title'); this.specTitle.classList.add('hidden'); r.appendChild(this.specTitle);
    this.specBar = el('div', 'spectate-bar'); this.specBar.classList.add('hidden');
    const prev = el('button', 'btn small dark', '◀ Prev (A)'); const next = el('button', 'btn small dark', 'Next (D) ▶');
    this.fastBtn = el('button', 'btn small alt', 'Fast ×1') as HTMLButtonElement;
    const leave = el('button', 'btn small', 'View Results');
    prev.onclick = () => this.onNextSpectate(-1); next.onclick = () => this.onNextSpectate(1); this.fastBtn.onclick = () => this.onFast(); leave.onclick = () => this.onLeave();
    this.specBar.append(prev, next, this.fastBtn, leave);
    r.appendChild(this.specBar);
    this.hint = el('div', 'pointer-hint', 'Click to capture mouse and play'); this.hint.classList.add('hidden');
    this.hint.onclick = () => this.onHintClick();
    r.appendChild(this.hint);
  }
  private markerTick!: HTMLElement;

  setMap(m: MapRenderer): void { this.mapRenderer = m; }
  show(v: boolean): void { this.root.classList.toggle('hidden', !v); }
  showHint(v: boolean): void { this.hint.classList.toggle('hidden', !v); }
  reset(): void {
    this.killfeed.innerHTML = ''; this.lastHud = {}; this.slotEls.forEach((s) => (s.key = '')); this.notice.classList.remove('show');
    this.dmgArcs.innerHTML = ''; this.sndRing.innerHTML = ''; this.specTitle.classList.add('hidden'); this.specBar.classList.add('hidden');
  }

  notify(text: string, ms = 2600): void {
    this.notice.textContent = text;
    this.notice.classList.add('show');
    this.noticeT = ms / 1000;
  }
  addKillFeed(text: string, you: boolean): void {
    const d = el('div', you ? 'you' : '', text);
    this.killfeed.appendChild(d);
    while (this.killfeed.children.length > 5) this.killfeed.removeChild(this.killfeed.firstChild!);
    setTimeout(() => d.remove(), 6500);
  }
  hitMarker(kind: 'normal' | 'head' | 'shield' | 'kill'): void {
    this.hitm.className = 'hitmarker on ' + (kind === 'normal' ? '' : kind);
    this.hitT = 0.12;
  }
  damageArc(relAngle: number): void {
    const a = el('div', 'dmg-arc');
    a.style.transform = `rotate(${(relAngle * 180) / Math.PI}deg)`;
    this.dmgArcs.appendChild(a);
    this.hurt.classList.add('on');
    setTimeout(() => this.hurt.classList.remove('on'), 60);
    setTimeout(() => a.remove(), 1200);
  }
  soundIndicator(relAngle: number, kind: 'gun' | 'step', caption?: string): void {
    const a = el('div', 'snd-ind' + (kind === 'step' ? ' step' : ''));
    a.style.transform = `rotate(${(relAngle * 180) / Math.PI}deg)`;
    this.sndRing.appendChild(a);
    setTimeout(() => a.remove(), 1600);
    if (caption) {
      this.captions.textContent = caption;
      setTimeout(() => { if (this.captions.textContent === caption) this.captions.textContent = ''; }, 1400);
    }
  }
  private set(key: string, val: string, fn: () => void): void {
    if (this.lastHud[key] !== val) { this.lastHud[key] = val; fn(); }
  }

  update(c: HudCtx, dt: number): void {
    const m = c.match;
    const p = c.view;
    this.noticeT -= dt;
    if (this.noticeT <= 0) this.notice.classList.remove('show');
    this.hitT -= dt;
    if (this.hitT <= 0) this.hitm.classList.remove('on');

    this.set('alive', String(m.aliveCount()), () => { this.alive.innerHTML = `<span>ALIVE</span><b>${m.aliveCount()}</b>`; });
    this.set('kills', String(p.stats.kills), () => { this.kills.innerHTML = `<span>ELIMS</span><b>${p.stats.kills}</b>`; });
    this.alive.style.display = m.mode === 'practice' ? 'none' : '';
    this.kills.style.display = m.mode === 'practice' ? 'none' : '';

    // compass
    let heading = (Math.atan2(Math.sin(c.yaw), -Math.cos(c.yaw)) * 180) / Math.PI;
    heading = ((heading % 360) + 360) % 360;
    this.compassStrip.style.transform = `translateX(${210 - heading * 3}px)`;
    if (c.marker) {
      let b = (Math.atan2(c.marker.x - p.x, -(c.marker.z - p.z)) * 180) / Math.PI;
      let d = ((b - heading + 540) % 360) - 180;
      this.markerTick.style.display = Math.abs(d) < 68 ? '' : 'none';
      this.markerTick.style.left = `${210 + d * 3}px`;
      void b;
    } else this.markerTick.style.display = 'none';

    // minimap
    if (this.mapRenderer) {
      const span = m.mode === 'practice' ? 190 : 520;
      this.mapRenderer.draw(this.minimapCtx, 424, { cx: p.x, cz: p.z, span }, { labels: false, marker: c.marker, humanId: p.id, yaw: c.yaw, showSkiff: m.phase === 'staging' || m.phase === 'skiff', trails: c.trails, colorblind: c.settings.colorblind });
    }
    this.updateZone(c);

    // vitals
    const lowHp = p.health < 30;
    this.hp.style.width = `${Math.max(0, p.health)}%`;
    this.hpBar.classList.toggle('low', lowHp);
    this.set('hpT', `${Math.ceil(p.health)}`, () => { this.hpT.textContent = `${Math.ceil(p.health)}`; });
    this.ag.style.width = `${(p.aegis / COMBAT.maxAegis) * 100}%`;
    this.set('agT', `${Math.ceil(p.aegis)}`, () => { this.agT.textContent = `AEGIS ${Math.ceil(p.aegis)}`; });
    this.rs.style.width = `${(p.reserve / COMBAT.maxReserve) * 100}%`;
    this.st.style.width = `${p.stamina * 100}%`;
    this.rs.parentElement!.style.opacity = p.reserve > 0 ? '1' : '0.35';
    if (p.using) {
      const u = p.using;
      this.usingBar.textContent = `${ITEMS[u.item].name}  ${Math.min(100, Math.round((u.t / u.total) * 100))}%`;
    } else this.usingBar.textContent = '';

    this.updateInventory(c);
    this.updatePrompt(c);

    // environment overlays
    this.vignette.classList.toggle('on', c.stormOutside);
    // crosshair spread
    const sel = p.slots[p.selected];
    const armed = !!sel && sel.kind === 'weapon' && (p.mode === 'ground' || p.mode === 'swim');
    this.cross.style.display = armed && !c.spectating ? '' : 'none';
    if (armed && sel && sel.kind === 'weapon') {
      const eff = effectiveWeapon(sel.weapon, sel.rarity);
      let spread = eff.def.spread * eff.spread;
      spread += (eff.def.adsSpread * eff.spread - spread) * p.adsT;
      spread += p.bloom;
      const px = Math.min(40, 6 + spread * 5.5 * (p.sprinting ? 1.5 : 1));
      const kids = this.cross.children;
      (kids[0] as HTMLElement).style.left = `${-px - 8}px`; (kids[1] as HTMLElement).style.left = `${px}px`;
      (kids[2] as HTMLElement).style.top = `${-px - 8}px`; (kids[3] as HTMLElement).style.top = `${px}px`;
    }

    // drop / skiff panel
    this.updateDropPanels(c);
    this.fpsEl.textContent = c.settings.showFps ? `${Math.round(c.fps)} fps` : '';

    // practice range readout
    if (m.mode !== 'practice') this.range.classList.add('hidden');
    if (m.mode === 'practice') {
      this.range.classList.remove('hidden');
      const rs2 = m.getRangeStats();
      const w = sel && sel.kind === 'weapon' ? effectiveWeapon(sel.weapon, sel.rarity) : null;
      this.range.innerHTML = `<b>PRACTICE RANGE</b><br>Targets respawn. Weapons, ammo and items are on the rack behind you.<br>` +
        (w ? `Weapon: ${w.def.name} (${w.rarity.name})<br>DPS ${Math.round(w.damage * w.def.pellets * w.rpm / 60)} · RPM ${Math.round(w.rpm)} · Mag ${w.mag} · Reload ${w.reload.toFixed(1)}s<br>` : '') +
        `Last hit: <b>${rs2.lastDamage ? Math.round(rs2.lastDamage) : '-'}</b> ${rs2.lastZone} @ ${Math.round(rs2.lastDist)} m<br>Try: slide hill, mantle crates, pool, zipline (E).`;
    }
  }

  private updateZone(c: HudCtx): void {
    const m = c.match;
    const s = m.storm;
    if (m.mode !== 'quick') { this.zoneTimer.style.display = 'none'; return; }
    this.zoneTimer.style.display = '';
    let lbl = 'Calmfield', tm = '--';
    let danger = false;
    if (m.phase === 'staging') { lbl = 'Departure'; tm = fmt(m.stagingLeft); }
    else if (s.phase <= 0) { lbl = 'First contraction'; tm = m.clock < 25 ? '--' : fmt(Math.max(0, 90 - (m.stormClock >= 0 ? m.stormClock : 0))); }
    else if (s.stage === 'wait') { lbl = `Closing in`; tm = fmt(Math.max(0, s.waitLen - s.t)); }
    else if (s.stage === 'shrink') { lbl = 'Contracting'; tm = fmt(Math.max(0, s.shrinkLen - s.t)); danger = c.stormOutside; }
    else { lbl = 'Holding'; tm = '0:00'; }
    if (c.stormOutside) danger = true;
    const dist = Math.hypot(c.view.x - s.cx, c.view.z - s.cz) - s.r;
    this.set('zone', lbl + tm + (dist > 0 ? 'o' : 'i') + s.damage, () => {
      this.zoneTimer.innerHTML = `<span class="lbl">${lbl}${c.stormOutside ? ` · ${s.damage} dmg/s` : ''}</span><span class="tm">${tm}</span>`;
    });
    this.zoneTimer.classList.toggle('danger', danger);
  }

  private updateInventory(c: HudCtx): void {
    const p = c.view;
    p.slots.forEach((s, i) => {
      const e = this.slotEls[i];
      const key = s ? (s.kind === 'weapon' ? `w${s.weapon}${s.rarity}` : `i${s.item}${s.count}`) : '-';
      const full = key + (i === p.selected ? 's' : '') + (c.settings.colorblind ? 'c' : '');
      if (e.key !== full) {
        e.key = full;
        e.root.classList.toggle('empty', !s);
        e.root.classList.toggle('sel', i === p.selected);
        const ctx = e.canvas.getContext('2d')!;
        const rc = e.rar.getContext('2d')!; rc.clearRect(0, 0, 28, 28);
        if (!s) { ctx.clearRect(0, 0, 136, 68); e.nm.textContent = ''; e.cnt.textContent = ''; e.root.style.borderColor = ''; }
        else if (s.kind === 'weapon') {
          const r = RARITIES[s.rarity];
          const col = c.settings.colorblind ? r.colorBlind : r.color;
          drawWeaponIcon(ctx, s.weapon, 136, 68, col);
          e.nm.textContent = WEAPONS[s.weapon].name; e.nm.style.color = col;
          e.cnt.textContent = '';
          e.root.style.borderColor = i === p.selected ? '#fff' : col;
          drawRarityShape(rc, r.shape, col, 14, 14, 11, true);
        } else {
          drawItemIcon(ctx, s.item, 136, 68);
          e.nm.textContent = ITEMS[s.item].name; e.nm.style.color = '';
          e.cnt.textContent = `×${s.count}`;
          e.root.style.borderColor = i === p.selected ? '#fff' : '';
        }
      }
    });
    const sel = p.slots[p.selected];
    if (sel && sel.kind === 'weapon') {
      const def = WEAPONS[sel.weapon];
      const r = RARITIES[sel.rarity];
      this.set('ammo', `${sel.mag}/${p.ammo[def.ammo]}/${sel.weapon}${p.reloading ? 'r' : ''}`, () => {
        this.ammoBig.innerHTML = p.reloading ? `<small>RELOADING</small>` : `${sel.mag}<small> / ${p.ammo[def.ammo]}</small>`;
        this.weaponName.innerHTML = `${def.name} <span style="color:${c.settings.colorblind ? r.colorBlind : r.color}">${r.name}</span>`;
      });
      if (p.reloading) this.ammoBig.innerHTML = `<small>RELOADING ${Math.max(0, p.reloadT).toFixed(1)}s</small>`;
    } else if (sel) {
      this.set('ammo', 'item' + sel.item, () => { this.ammoBig.innerHTML = `<small>${ITEMS[sel.item].blurb}</small>`; this.weaponName.textContent = ITEMS[sel.item].name; });
    } else this.set('ammo', 'none', () => { this.ammoBig.innerHTML = ''; this.weaponName.textContent = 'Unarmed - find a weapon'; });
    this.set('ammot', AMMO_TYPES.map((t) => p.ammo[t]).join(','), () => {
      this.ammoTypes.innerHTML = AMMO_TYPES.map((t) => `<span style="color:${AMMO_COLORS[t]}">${AMMO_NAMES[t][0]} ${p.ammo[t]}/${AMMO_CAPS[t]}</span>`).join('');
    });
  }

  private updatePrompt(c: HudCtx): void {
    const f = c.focus;
    if (!f || c.spectating || c.view.mode !== 'ground') { this.prompt.classList.add('hidden'); this.lastPrompt = ''; return; }
    const m = c.match;
    let html = '';
    if (f.kind === 'loot') {
      const e = m.loot.get(f.id);
      if (!e) { this.prompt.classList.add('hidden'); return; }
      const d = e.data;
      if (d.kind === 'weapon') {
        const r = RARITIES[d.rarity];
        const col = c.settings.colorblind ? r.colorBlind : r.color;
        const eff = effectiveWeapon(d.weapon, d.rarity);
        const cur = c.view.slots[c.view.selected];
        let cmp = '';
        if (cur && cur.kind === 'weapon') {
          const ce = effectiveWeapon(cur.weapon, cur.rarity);
          const dps = eff.damage * eff.def.pellets * eff.rpm / 60, cdps = ce.damage * ce.def.pellets * ce.rpm / 60;
          const arrow = (a: number, b: number, hi = true) => (a === b ? '<span>=</span>' : (a > b) === hi ? '<span class="up">▲</span>' : '<span class="down">▼</span>');
          cmp = `<div class="cmp"><span>DPS ${Math.round(dps)} ${arrow(dps, cdps)}</span><span>Mag ${eff.mag} ${arrow(eff.mag, ce.mag)}</span><span>Reload ${eff.reload.toFixed(1)}s ${arrow(eff.reload, ce.reload, false)}</span><span>Range ${eff.def.falloffEnd} ${arrow(eff.def.falloffEnd, ce.def.falloffEnd)}</span></div>`;
        } else cmp = `<div class="cmp"><span>DPS ${Math.round(eff.damage * eff.def.pellets * eff.rpm / 60)}</span><span>Mag ${eff.mag}</span><span>${AMMO_NAMES[eff.def.ammo]} ammo</span></div>`;
        const full = c.view.slots.every((s) => s);
        html = `<div class="pn" style="color:${col}">${eff.def.name} · ${r.name}</div><div class="ps">${r.note} — ${eff.def.blurb}</div>${cmp}` +
          `<div class="ps" style="margin-top:6px"><span class="keycap">${keyName(c.settings.keys.interact)}</span>${full ? 'Hold to swap with equipped slot' : 'Pick up'}</div>` +
          (full ? `<div class="hold"><i style="width:${Math.min(100, (c.interactHold / 0.45) * 100)}%"></i></div>` : '');
      } else if (d.kind === 'item') {
        const def = ITEMS[d.item];
        html = `<div class="pn" style="color:${def.color}">${def.name}${d.count > 1 ? ` ×${d.count}` : ''}</div><div class="ps">${def.blurb}</div><div class="ps" style="margin-top:6px"><span class="keycap">${keyName(c.settings.keys.interact)}</span>${c.view.slots.every((s) => s) ? 'Hold to swap selected slot' : 'Pick up'}</div>` +
          (c.view.slots.every((s) => s) ? `<div class="hold"><i style="width:${Math.min(100, (c.interactHold / 0.45) * 100)}%"></i></div>` : '');
      } else if (d.kind === 'cache') {
        html = `<div class="pn" style="color:#f2d27a">${d.owner}'s Cache</div><div class="ps">Heals, utility and ammo</div><div class="ps" style="margin-top:6px"><span class="keycap">${keyName(c.settings.keys.interact)}</span>Take all that fits</div>`;
      }
    } else if (f.kind === 'chest') {
      html = `<div class="pn" style="color:#ffd166">${f.label}</div><div class="ps">Hums softly. Open for guaranteed loot.</div><div class="ps" style="margin-top:6px"><span class="keycap">${keyName(c.settings.keys.interact)}</span>Open</div>`;
    } else if (f.kind === 'zipline') {
      html = `<div class="pn">${f.label}</div><div class="ps" style="margin-top:6px"><span class="keycap">${keyName(c.settings.keys.interact)}</span>Ride · ${keyName(c.settings.keys.jump)} to dismount</div>`;
    }
    this.prompt.classList.remove('hidden');
    if (html !== this.lastPrompt) { this.lastPrompt = html; this.prompt.innerHTML = html; }
  }

  private updateDropPanels(c: HudCtx): void {
    const m = c.match;
    const p = c.view;
    let drop = '';
    let alt = '';
    if (m.mode === 'quick' && !c.spectating) {
      if (m.phase === 'staging') {
        drop = `<div class="big">STAGING PIER</div><div class="sub">Skiff departs in ${Math.ceil(m.stagingLeft)}s · ${m.aliveCount()} players · practise movement · press M to plan your drop · <b>Enter</b> to skip</div>`;
      } else if (p.mode === 'skiff') {
        drop = `<div class="big">PRESS <span style="color:#ffd166">${keyName(c.settings.keys.jump)}</span> TO JUMP</div><div class="sub">Open the map (${keyName(c.settings.keys.map)}) and drop onto your landing zone. The skiff leaves the island soon.</div>`;
      } else if (p.mode === 'freefall') {
        drop = `<div class="big">FREEFALL</div><div class="sub">W dive · S slow · wing-sail deploys automatically at ${MOVE.autoDeployAGL} m (${keyName(c.settings.keys.jump)}/${keyName(c.settings.keys.deploy)} to deploy earlier)</div>`;
      } else if (p.mode === 'glide') {
        drop = `<div class="big">WING-SAIL</div><div class="sub">W boost · S brake · steer with the mouse · land near loot</div>`;
      }
      if (p.mode === 'freefall' || p.mode === 'glide') {
        const agl = Math.max(0, p.y - m.world.groundHeight(p.x, p.z, p.y, 0, 0.4, [], []));
        alt = `<div class="pill"><span>ALT</span><b>${Math.round(agl)}</b>m</div><div class="pill"><span>SPEED</span><b>${Math.round(Math.hypot(p.vx, p.vy, p.vz))}</b>m/s</div><div class="pill"><span>WING-SAIL</span><b>${p.mode === 'glide' ? 'OUT' : agl < MOVE.autoDeployAGL ? 'AUTO' : 'READY'}</b></div>`;
      }
    }
    this.set('drop', drop, () => { this.dropPanel.innerHTML = drop; this.dropPanel.classList.toggle('hidden', !drop); });
    this.set('alt', alt, () => { this.altPanel.innerHTML = alt; this.altPanel.classList.toggle('hidden', !alt); });
  }

  setSpectate(on: boolean, title: string, sub: string): void {
    this.set('spec', String(on) + title + sub, () => {
      this.specTitle.classList.toggle('hidden', !on);
      this.specBar.classList.toggle('hidden', !on);
      this.specTitle.innerHTML = `<div class="big">${title}</div><div style="font-size:18px">${sub}</div>`;
    });
  }

  setCrosshair(x: number, y: number): void {
    this.cross.style.left = `${x * 100}%`; this.cross.style.top = `${y * 100}%`;
  }
}

export function keyName(code: string): string {
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  const map: Record<string, string> = { Space: 'SPACE', ShiftLeft: 'SHIFT', ControlLeft: 'CTRL', Tab: 'TAB', Escape: 'ESC', Enter: 'ENTER' };
  return map[code] ?? code;
}
function fmt(sec: number): string {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
export type { Slot, RarityShape };
