/** client-ui combat HUD: reads batched read models from the sim at ~10 Hz; per-frame work is canvas-only (no React, no per-frame DOM churn). */
import { HERO_BY_ID, ITEM_BY_ID, TALENT_BY_ID, abilityText, MAX_LEVEL, XP_TO_LEVEL, CATALYST_SPAWN, COLOSSUS_SPAWN } from '../shared/content';
import { MAP_H, MAP_W, STRUCTURES, TEAM_BASE, CAMPS, OBSTACLES, BRUSH, walk, GW, GH, MAP_X0, MAP_Z0, CELL } from '../shared/map';
import { clamp, dist } from '../shared/math';
import type { Sim } from '../sim/sim';
import type { SimEvent, Unit } from '../sim/types';
import { TEAM_NAMES } from '../sim/rules';
import { h, fmtTime, clear, fmtNum } from './dom';
import { paintMapArt, paintObstacles } from './mapart';
import { audio } from './audio';
import { Shop } from './shop';
import type { GameRenderer } from './renderer';
import type { Settings } from './storage';
import { TEAM_COLOR, TEAM_COLOR_CB } from './models';

export interface HudHost {
  sim: Sim; renderer: GameRenderer; settings: Settings;
  send(cmd: Record<string, unknown>): void;
  castSlot(slot: number): void; rankUp(slot: number): void;
  mode: 'match' | 'tutorial';
  tutorialPanel?: () => HTMLElement | null;
}
interface Floater { x: number; z: number; text: string; color: string; t: number; size: number; vy: number; life: number }

const css = (n: number) => '#' + n.toString(16).padStart(6, '0');

export class Hud {
  el: HTMLElement;
  private bars: HTMLCanvasElement; private bctx: CanvasRenderingContext2D;
  private mini: HTMLCanvasElement; private mctx: CanvasRenderingContext2D; private miniBg: HTMLCanvasElement;
  private big: HTMLCanvasElement | null = null;
  private bigWrap: HTMLElement;
  private shop: Shop;
  private tip: HTMLElement;
  private feed: HTMLElement; private banner: HTMLElement; private toastEl: HTMLElement;
  private score0!: HTMLElement; private score1!: HTMLElement; private clock!: HTMLElement; private kda!: HTMLElement; private objs!: HTMLElement;
  private abEls: { root: HTMLElement; cd: HTMLElement; cdt: HTMLElement; pips: HTMLElement; plus: HTMLElement }[] = [];
  private talEls: { root: HTMLElement; cd: HTMLElement; cdt: HTMLElement }[] = [];
  private itemEls: { root: HTMLElement; ico: HTMLElement; cd: HTMLElement; qty: HTMLElement }[] = [];
  private trinketEl!: HTMLElement; private recallEl!: HTMLElement;
  private portrait!: HTMLElement; private hpFill!: HTMLElement; private mpFill!: HTMLElement; private hpTxt!: HTMLElement; private mpTxt!: HTMLElement;
  private xpRing!: HTMLElement; private lvl!: HTMLElement; private stats!: HTMLElement; private goldEl!: HTMLElement;
  private veil!: HTMLElement; private veilBody!: HTMLElement; private recallBar!: HTMLElement; private recallFill!: HTMLElement; private recallTxt!: HTMLElement;
  private board!: HTMLElement; private tutorialEl!: HTMLElement;
  private floaters: Floater[] = [];
  private pings: { x: number; z: number; t: number }[] = [];
  private lastPing = -9;
  private hintEl: HTMLElement | null = null;
  private pendingDmg = new Map<number, { sum: number; t: number; color: string; x: number; z: number; crit: boolean; shield: number }>();
  private toastTimer = 0; private bannerTimer = 0; private bannerQueue: { text: string; team: number; priority: number }[] = [];
  private slowAcc = 0; private miniAcc = 0;
  private boardShown = false; private debug = false; private mapShown = false;
  private lastAnnounce = '';
  private deathRecapAt = 0;
  captions: string[] = [];
  private inner!: HTMLElement;

  constructor(private host: HudHost) {
    const sim = host.sim;
    this.el = h('div', { class: 'hud' });
    this.bars = h('canvas', { class: 'bars' });
    this.bctx = this.bars.getContext('2d')!;
    this.mini = h('canvas', { class: 'minimap', width: 220, height: 220 });
    this.mctx = this.mini.getContext('2d')!;
    this.miniBg = document.createElement('canvas');
    this.miniBg.width = 220; this.miniBg.height = 220;
    this.paintMiniBg(this.miniBg, 220);
    this.tip = h('div', { class: 'tip hidden' });
    this.feed = h('div', { class: 'feed' });
    this.banner = h('div', { class: 'banner hidden' });
    this.toastEl = h('div', { class: 'toast hidden' });
    this.bigWrap = h('div', { class: 'bigmap hidden' });
    this.shop = new Shop(sim, (c) => host.send(c), () => this.toggleShop(false));
    this.build();
    const inner = h('div', { class: 'hud-inner' }, this.buildTop(), this.feed, this.banner, this.toastEl, this.tutorialEl, this.buildBottom(), this.veil, this.recallBar, this.board, this.shop.el, this.bigWrap);
    this.el.append(this.bars, inner, this.tip);
    this.inner = inner;
  }

  // ------------------------------------------------------------ construction
  private build() {
    this.board = h('div', { class: 'scoreboard panel hidden' });
    this.tutorialEl = h('div', { class: 'tutorial hidden' });
    this.veilBody = h('div', { class: 'veil-body' });
    this.veil = h('div', { class: 'veil hidden' }, this.veilBody);
    this.recallFill = h('div', { class: 'fill' });
    this.recallTxt = h('div', { class: 'txt' });
    this.recallBar = h('div', { class: 'recallbar hidden' }, h('div', { class: 'bar' }, this.recallFill), this.recallTxt);
  }

  private buildTop(): HTMLElement {
    this.score0 = h('div', { class: 'score blue' }, '0');
    this.score1 = h('div', { class: 'score red' }, '0');
    this.clock = h('div', { class: 'clock' }, '0:00');
    this.kda = h('div', { class: 'kda' }, '0 / 0 / 0');
    this.objs = h('div', { class: 'objs' });
    return h('div', { class: 'top' },
      h('div', { class: 'topbar' }, h('div', { class: 'team blue' }, TEAM_NAMES[0]), this.score0, h('div', { class: 'mid' }, this.clock, this.kda), this.score1, h('div', { class: 'team red' }, TEAM_NAMES[1])),
      this.objs);
  }

  private tipOn(el: HTMLElement, html: () => string) {
    el.addEventListener('mouseenter', () => { this.tip.innerHTML = html(); this.tip.classList.remove('hidden'); this.placeTip(el); });
    el.addEventListener('mousemove', () => this.placeTip(el));
    el.addEventListener('mouseleave', () => this.tip.classList.add('hidden'));
  }
  private placeTip(el: HTMLElement) {
    const r = el.getBoundingClientRect();
    const t = this.tip.getBoundingClientRect();
    this.tip.style.left = `${clamp(r.left + r.width / 2 - t.width / 2, 8, window.innerWidth - t.width - 8)}px`;
    this.tip.style.top = `${Math.max(8, r.top - t.height - 10)}px`;
  }

  private buildBottom(): HTMLElement {
    const sim = this.host.sim;
    const hero = sim.player;
    const def = HERO_BY_ID[hero.hero!.heroId];
    // portrait
    this.lvl = h('div', { class: 'lvl' }, '1');
    this.xpRing = h('div', { class: 'xpring' });
    this.portrait = h('div', { class: 'portrait' }, this.xpRing, h('div', { class: 'face', style: { background: `radial-gradient(circle at 35% 30%, ${css(def.accent)}, ${css(def.color)} 70%)` } }, def.name[0]), this.lvl);
    this.hpFill = h('div', { class: 'fill hp' }); this.mpFill = h('div', { class: `fill ${def.resource === 'energy' ? 'en' : 'mp'}` });
    this.hpTxt = h('span', {}); this.mpTxt = h('span', {});
    this.stats = h('div', { class: 'stats' });
    this.goldEl = h('div', { class: 'gold' });
    const hero1 = h('div', { class: 'hero-card panel' }, this.portrait,
      h('div', { class: 'bars2' }, h('div', { class: 'name' }, `${def.name} · ${def.title}`), h('div', { class: 'bar' }, this.hpFill, this.hpTxt), h('div', { class: 'bar thin' }, this.mpFill, this.mpTxt), this.stats, this.goldEl));
    // abilities
    const abil = h('div', { class: 'abilities' });
    def.abilities.forEach((a, i) => {
      const cd = h('div', { class: 'cd' }), cdt = h('div', { class: 'cdt' }), pips = h('div', { class: 'pips' });
      const plus = h('button', { class: 'plus hidden', title: `Learn ${a.name} (Ctrl+${a.key})`, onclick: (e: Event) => { e.stopPropagation(); this.host.rankUp(i); } }, '+');
      const root = h('div', { class: `ab${a.ult ? ' ult' : ''}`, onclick: () => this.host.castSlot(i) }, h('div', { class: 'ico' }, a.icon), h('div', { class: 'key' }, this.host.settings.keys[a.key.toLowerCase()].toUpperCase()), pips, cd, cdt, plus);
      this.tipOn(root, () => this.abilityTip(i));
      this.abEls.push({ root, cd, cdt, pips, plus });
      abil.append(root);
    });
    // passive
    const passive = h('div', { class: 'ab passive' }, h('div', { class: 'ico' }, '✦'), h('div', { class: 'key' }, 'P'));
    this.tipOn(passive, () => `<h4>${def.passive.name} <small>Passive</small></h4><p>${def.passive.desc}</p>`);
    abil.prepend(passive);
    // talents
    const tal = h('div', { class: 'talents' });
    [0, 1].forEach((i) => {
      const t = TALENT_BY_ID[hero.hero!.talents[i]];
      const cd = h('div', { class: 'cd' }), cdt = h('div', { class: 'cdt' });
      const root = h('div', { class: 'ab small', onclick: () => this.host.send({ c: 'talent', idx: i, x: hero.x, z: hero.z }) }, h('div', { class: 'ico' }, t.icon), h('div', { class: 'key' }, (i ? this.host.settings.keys.talent2 : this.host.settings.keys.talent1).toUpperCase()), cd, cdt);
      this.tipOn(root, () => `<h4>${t.name} <small>Talent · ${t.cd}s</small></h4><p>${t.desc}</p>`);
      this.talEls.push({ root, cd, cdt });
      tal.append(root);
    });
    // items
    const items = h('div', { class: 'items' });
    for (let i = 0; i < 6; i++) {
      const ico = h('div', { class: 'ico' }), cd = h('div', { class: 'cd' }), qty = h('div', { class: 'qty' });
      const root = h('div', { class: 'ab small item', onclick: () => this.host.send({ c: 'use', idx: i }) }, ico, h('div', { class: 'key' }, String(i + 1)), cd, qty);
      this.tipOn(root, () => this.itemTip(i));
      this.itemEls.push({ root, ico, cd, qty });
      items.append(root);
    }
    this.trinketEl = h('div', { class: 'ab small trinket', onclick: () => this.host.send({ c: 'ward', x: hero.x + 2, z: hero.z + 2 }) }, h('div', { class: 'ico' }, '👁'), h('div', { class: 'key' }, this.host.settings.keys.ward.toUpperCase()), h('div', { class: 'qty' }));
    this.tipOn(this.trinketEl, () => `<h4>Ward Trinket <small>${this.host.settings.keys.ward.toUpperCase()}</small></h4><p>Place a ward at the cursor (range 9). Lasts 90s, hidden from enemies unless they come close. Recharges every 40s up to 2 charges. Visible to true sight only.</p>`);
    this.recallEl = h('div', { class: 'ab small', onclick: () => this.host.send({ c: 'recall' }) }, h('div', { class: 'ico' }, '⌂'), h('div', { class: 'key' }, this.host.settings.keys.recall.toUpperCase()));
    this.tipOn(this.recallEl, () => '<h4>Recall <small>B</small></h4><p>Channel for 7 seconds to return to the fountain. Cancelled by moving, casting or taking damage.</p>');
    const shopBtn = h('div', { class: 'ab small', onclick: () => this.toggleShop() }, h('div', { class: 'ico' }, '⚖'), h('div', { class: 'key' }, this.host.settings.keys.shop.toUpperCase()));
    this.tipOn(shopBtn, () => '<h4>Shop <small>P</small></h4><p>Buy items at the fountain. Walk back or recall to shop.</p>');
    const bar = h('div', { class: 'actionbar panel' }, abil, h('div', { class: 'sep' }), tal, h('div', { class: 'sep' }), items, h('div', { class: 'sep' }), h('div', { class: 'util' }, this.trinketEl, this.recallEl, shopBtn));
    // minimap
    this.mini.addEventListener('mousedown', (e) => this.miniClick(e));
    this.mini.addEventListener('contextmenu', (e) => e.preventDefault());
    const mm = h('div', { class: 'minimap-wrap panel' }, this.mini, h('button', { class: 'mapbtn', title: 'Expanded map (M)', onclick: () => this.toggleMap() }, '⤢'));
    return h('div', { class: 'bottom' }, hero1, bar, mm);
  }

  // ------------------------------------------------------------ tooltips
  private abilityTip(i: number): string {
    const hero = this.host.sim.player;
    const hs = hero.hero!;
    const def = HERO_BY_ID[hs.heroId].abilities[i];
    const rank = hs.ranks[i];
    const cd = def.cd[Math.max(0, rank - 1)], cost = def.cost[Math.max(0, rank - 1)];
    const ranksHtml = def.v && Object.keys(def.v).length ? `<div class="ranks">${Object.entries(def.v).map(([k, v]) => `<span>${k}: ${v.join(' / ')}</span>`).join('')}</div>` : '';
    return `<h4>${def.name} <small>${def.key}${def.ult ? ' · Ultimate' : ''}${def.recast ? ' · Recast' : ''}</small></h4>
      <div class="meta">${rank ? `Rank ${rank}/${def.ult ? 2 : 4}` : 'Not learned'} · Cost ${cost} ${HERO_BY_ID[hs.heroId].resource} · Cooldown ${cd}s · Range ${def.range || 'self'}${def.castTime > 0.3 ? ` · Cast ${def.castTime}s` : ''}</div>
      <p>${abilityText(def, rank)}</p>${ranksHtml}<div class="tags">${def.tags.map((t) => `<i>${t}</i>`).join('')}</div>`;
  }
  private itemTip(i: number): string {
    const s = this.host.sim.player.hero!.items[i];
    if (!s) return '<h4>Empty slot</h4><p>Buy items at the fountain (P).</p>';
    const it = ITEM_BY_ID[s.id];
    return `<h4 style="color:${it.color}">${it.name} <small>${it.tier}</small></h4>
      <ul>${Object.entries(it.stats).map(([k, v]) => `<li>${k}: ${v}</li>`).join('')}</ul>${it.passive ? `<p><b>Passive:</b> ${it.passive}</p>` : ''}${it.active ? `<p><b>Active:</b> ${it.active} (click or press ${i + 1})</p>` : ''}`;
  }

  // ------------------------------------------------------------ public toggles
  toggleShop(v?: boolean) {
    const open = v ?? !this.shop.open;
    if (open && !this.host.sim.inShop(this.host.sim.player)) { this.toast('The shop is only open at your fountain'); audio.play('error'); return; }
    this.shop.show(open);
  }
  get shopOpen() { return this.shop.open; }
  get blocking() { return this.shop.open || this.mapShown; }
  showBoard(v: boolean) { this.boardShown = v; this.board.classList.toggle('hidden', !v); if (v) this.renderBoard(); }
  toggleMap() { this.mapShown = !this.mapShown; this.bigWrap.classList.toggle('hidden', !this.mapShown); if (this.mapShown) this.renderBigMap(); }
  toggleDebug() { this.debug = !this.debug; this.toast(this.debug ? 'Debug overlay on (walkability, brush, tower ranges) — open map with M' : 'Debug overlay off'); if (this.mapShown) this.renderBigMap(); }
  closeOverlays(): boolean {
    if (this.shop.open) { this.shop.show(false); return true; }
    if (this.mapShown) { this.toggleMap(); return true; }
    return false;
  }
  addPing(x: number, z: number): boolean {
    const now = this.host.sim.time;
    if (now - this.lastPing < 1.2) return false; // rate limit
    this.lastPing = now;
    this.pings.push({ x, z, t: now });
    this.addFeed('<span class="ann">Ping: danger / look here</span>');
    return true;
  }
  showHint(html: string, secs: number) {
    this.hintEl?.remove();
    this.hintEl = h('div', { class: 'hint panel', html });
    this.inner.append(this.hintEl);
    const el = this.hintEl;
    setTimeout(() => { el.classList.add('fade'); setTimeout(() => el.remove(), 800); }, secs * 1000);
  }
  toast(msg: string) {
    this.toastEl.textContent = msg;
    this.toastEl.classList.remove('hidden');
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toastEl.classList.add('hidden'), 1800);
  }
  setTutorial(el: HTMLElement | null) {
    clear(this.tutorialEl);
    if (el) { this.tutorialEl.append(el); this.tutorialEl.classList.remove('hidden'); } else this.tutorialEl.classList.add('hidden');
  }

  // ------------------------------------------------------------ minimap
  private mapT(size: number, k: number) {
    const c = size / 2;
    return { a: k / Math.SQRT2, b: -k / Math.SQRT2, c: k / Math.SQRT2, d: k / Math.SQRT2, e: c, f: c };
  }
  private paintMiniBg(cv: HTMLCanvasElement, size: number) {
    const ctx = cv.getContext('2d')!;
    ctx.fillStyle = '#081230'; ctx.fillRect(0, 0, size, size);
    const k = (size / ((MAP_W + MAP_H) / Math.SQRT2)) * 0.98;
    const t = this.mapT(size, k);
    ctx.save();
    ctx.setTransform(t.a, t.b, t.c, t.d, t.e, t.f);
    paintMapArt(ctx, false);
    paintObstacles(ctx);
    ctx.restore();
  }
  private toMini(x: number, z: number, size: number) {
    const k = (size / ((MAP_W + MAP_H) / Math.SQRT2)) * 0.98;
    return { x: (k / Math.SQRT2) * (x + z) + size / 2, y: (k / Math.SQRT2) * (z - x) + size / 2 };
  }
  private fromMini(px: number, py: number, size: number) {
    const k = (size / ((MAP_W + MAP_H) / Math.SQRT2)) * 0.98;
    const A = ((px - size / 2) * Math.SQRT2) / k, B = ((py - size / 2) * Math.SQRT2) / k;
    return { x: (A - B) / 2, z: (A + B) / 2 };
  }
  private miniClick(e: MouseEvent) {
    const r = this.mini.getBoundingClientRect();
    const p = this.fromMini(((e.clientX - r.left) / r.width) * 220, ((e.clientY - r.top) / r.height) * 220, 220);
    if (e.button === 2) { this.host.send({ c: 'move', x: p.x, z: p.z }); return; }
    this.host.renderer.cam.x = p.x; this.host.renderer.cam.z = p.z;
  }
  private drawMini(ctx: CanvasRenderingContext2D, size: number, bg: HTMLCanvasElement, big = false) {
    const sim = this.host.sim, pt = sim.player.team;
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(bg, 0, 0, size, size);
    const tc = this.host.settings.colorblind ? TEAM_COLOR_CB : TEAM_COLOR;
    const sc = big ? 1.6 : 1;
    // fog tint on minimap
    for (const s of STRUCTURES) {
      const u = [...sim.rules.structures.values()].find((x) => x.defId === s.id);
      const p = this.toMini(s.x, s.z, size);
      const alive = !!u && !u.dead;
      ctx.fillStyle = alive ? css(tc[s.team]) : 'rgba(255,255,255,0.15)';
      const sz = (s.type === 'engine' ? 7 : s.type === 'core' ? 5 : s.type === 'seal' ? 5 : 4) * sc * (size / 220);
      if (s.type === 'seal') { ctx.beginPath(); ctx.arc(p.x, p.y, sz * 0.7, 0, 7); ctx.fill(); if (alive && u!.invuln) { ctx.strokeStyle = '#ff7ad8'; ctx.lineWidth = 1.2; ctx.stroke(); } }
      else ctx.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz);
      if (alive && sim.time - u!.lastDamagedAt < 1.5 && u!.team === pt) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p.x, p.y, sz + 2 + Math.sin(sim.time * 12) * 1.5, 0, 7); ctx.stroke(); }
    }
    for (const u of sim.units) {
      if (u.dead || u.stype) continue;
      const mine = u.team === pt;
      const vis = mine || u.visUntil[pt] > sim.time;
      if (!vis) continue;
      const p = this.toMini(u.x, u.z, size);
      if (u.kind === 'minion') { ctx.fillStyle = css(tc[u.team]); ctx.fillRect(p.x - 1, p.y - 1, 2 * sc, 2 * sc); }
      else if (u.kind === 'monster') { ctx.fillStyle = '#ffd060'; ctx.beginPath(); ctx.arc(p.x, p.y, (u.radius > 1.5 ? 4 : u.radius > 0.8 ? 3 : 1.8) * sc, 0, 7); ctx.fill(); }
      else if (u.kind === 'ward') { ctx.fillStyle = '#9ff4ff'; ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3); }
      else if (u.kind === 'hero') {
        ctx.beginPath(); ctx.arc(p.x, p.y, 5 * sc, 0, 7);
        ctx.fillStyle = css(tc[u.team]); ctx.fill();
        ctx.lineWidth = u === sim.player ? 2 : 1; ctx.strokeStyle = u === sim.player ? '#ffe08a' : '#0a1530'; ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = `bold ${7 * sc}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(HERO_BY_ID[u.hero!.heroId].name[0], p.x, p.y + 0.5);
      }
    }
    // objectives
    for (const c of CAMPS) {
      if (c.kind !== 'catalyst' && c.kind !== 'colossus') continue;
      const p = this.toMini(c.x, c.z, size);
      const alive = sim.units.some((u) => u.kind === 'monster' && !u.dead && u.camp?.id === c.id);
      ctx.strokeStyle = alive ? '#ff7ad8' : 'rgba(255,255,255,0.3)'; ctx.lineWidth = alive ? 2 : 1;
      ctx.beginPath(); ctx.moveTo(p.x, p.y - 5 * sc); ctx.lineTo(p.x + 4 * sc, p.y); ctx.lineTo(p.x, p.y + 5 * sc); ctx.lineTo(p.x - 4 * sc, p.y); ctx.closePath(); ctx.stroke();
    }
    // pings
    this.pings = this.pings.filter((p) => sim.time - p.t < 4);
    for (const p of this.pings) {
      const q = this.toMini(p.x, p.z, size);
      const k = ((sim.time - p.t) % 1) * 12 * sc;
      ctx.strokeStyle = 'rgba(255,224,138,0.95)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(q.x, q.y, 3 + k, 0, 7); ctx.stroke();
    }
    // camera viewport
    const r = this.host.renderer;
    const corners = [[0, 0], [r.width, 0], [r.width, r.height], [0, r.height]].map(([cx, cy]) => { const g = r.groundPoint(cx + r.canvas.getBoundingClientRect().left, cy + r.canvas.getBoundingClientRect().top); return this.toMini(g.x, g.z, size); });
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.2; ctx.beginPath(); corners.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); ctx.stroke();
    if (this.debug && big) this.drawDebug(ctx, size);
  }

  private drawDebug(ctx: CanvasRenderingContext2D, size: number) {
    ctx.fillStyle = 'rgba(255,60,60,0.35)';
    for (let iz = 0; iz < GH; iz += 1) for (let ix = 0; ix < GW; ix += 1) {
      if (walk[iz * GW + ix]) continue;
      const x = MAP_X0 + (ix + 0.5) * CELL, z = MAP_Z0 + (iz + 0.5) * CELL;
      const p = this.toMini(x, z, size);
      ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
    }
    ctx.strokeStyle = 'rgba(80,255,120,0.9)';
    for (const b of BRUSH) { const p = this.toMini(b.x, b.z, size); ctx.beginPath(); ctx.arc(p.x, p.y, b.r * (size / 220) * 1.45, 0, 7); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,200,60,0.9)';
    for (const s of this.host.sim.rules.structures.values()) { if (s.dead || !s.range) continue; const p = this.toMini(s.x, s.z, size); ctx.beginPath(); ctx.arc(p.x, p.y, s.range * (size / 220) * 1.45, 0, 7); ctx.stroke(); }
    void OBSTACLES;
  }
  private renderBigMap() {
    clear(this.bigWrap);
    const size = 640;
    this.big = h('canvas', { width: size, height: size, class: 'bigcanvas' });
    const bg = document.createElement('canvas'); bg.width = size; bg.height = size;
    this.paintMiniBg(bg, size);
    this.bigBg = bg;
    this.big.addEventListener('mousedown', (e) => {
      const r = this.big!.getBoundingClientRect();
      const p = this.fromMini(((e.clientX - r.left) / r.width) * size, ((e.clientY - r.top) / r.height) * size, size);
      this.host.renderer.cam.x = p.x; this.host.renderer.cam.z = p.z; this.toggleMap();
    });
    this.bigWrap.append(h('div', { class: 'panel bigpanel' }, h('div', { class: 'bm-head' }, h('b', {}, 'The Broken Diadem'), h('span', {}, 'Click to jump the camera · F3 toggles debug overlays (walkability, brush, tower range) · M to close'), h('button', { class: 'x', onclick: () => this.toggleMap() }, '×')), this.big));
  }
  private bigBg: HTMLCanvasElement | null = null;

  // ------------------------------------------------------------ events
  handleEvents(events: SimEvent[]) {
    const sim = this.host.sim, me = sim.player, pt = me.team;
    for (const e of events) {
      switch (e.t) {
        case 'damage': {
          if (!this.host.settings.showDamage) break;
          const t = sim.byId.get(e.target);
          if (!t || (t.team !== pt && t.visUntil[pt] <= sim.time)) break;
          const src = sim.byId.get(e.src);
          const mineOut = src && (src.id === me.id || src.owner === me.id);
          const mineIn = t.id === me.id;
          if (!mineOut && !mineIn && !(t.kind === 'hero' && src?.kind === 'hero')) break;
          const color = mineIn ? '#ff6a6a' : e.dtype === 'arcane' ? '#b88aff' : e.dtype === 'pure' ? '#ffffff' : '#ffd27a';
          if (e.shield) { this.addFloater(t.x, t.z, `${e.amount}`, '#7fe8ff', 15, 0.8); break; }
          const k = t.id + (mineIn ? 100000 : 0);
          const p = this.pendingDmg.get(k);
          if (p) { p.sum += e.amount; p.t = sim.time; } else this.pendingDmg.set(k, { sum: e.amount, t: sim.time, color, x: t.x, z: t.z, crit: false, shield: 0 });
          break;
        }
        case 'heal': { const t = sim.byId.get(e.target); if (t && t.id === me.id && this.host.settings.showDamage) this.addFloater(t.x, t.z, `+${e.amount}`, '#8dff9a', 15, 0.8); break; }
        case 'gold': { if (e.unit === me.id) this.addFloater(e.x, e.z, `+${e.amount}`, '#ffd24a', 17, 1.1); break; }
        case 'levelup': { if (e.unit === me.id) { this.addFloater(me.x, me.z, `LEVEL ${e.level}`, '#ffe27a', 26, 1.6); audio.play('levelup'); } break; }
        case 'kill': {
          const k = sim.byId.get(e.killer), v = sim.byId.get(e.victim);
          const kn = k?.hero?.name ?? k?.name ?? 'The wild', vn = v?.hero?.name ?? '?';
          const own = (k?.team ?? -1) === pt;
          this.addFeed(`<b class="${own ? 'ally' : 'foe'}">${kn}</b> defeated <b class="${v?.team === pt ? 'ally' : 'foe'}">${vn}</b>${e.assists.length ? ` <small>+${e.assists.length} assist</small>` : ''}${e.gold ? ` <em>+${e.gold}g</em>` : ''}`);
          if (e.first) this.queueBanner('First Blood', k?.team ?? 0, 2);
          else if (e.streak >= 3) this.queueBanner(`${kn} is on a ${e.streak}-kill streak`, k?.team ?? 0, 1);
          if (e.victim === me.id) { audio.play('death'); this.deathRecapAt = sim.time; }
          else audio.play(own ? 'kill' : 'alert', 0.7);
          break;
        }
        case 'announce': {
          if (e.sound === 'alert' && e.team !== pt) break;
          this.queueBanner(e.text, e.team, e.priority);
          this.addFeed(`<span class="ann">${e.text}</span>`);
          audio.play(e.sound, 0.9);
          break;
        }
        case 'structure': { break; }
        case 'reject': { if (e.unit === me.id) { this.toast(e.reason); audio.play('error', 0.6); } break; }
        case 'victory': break;
        case 'sfx': { audio.at(e.name, e.x, e.z, 0.8); break; }
        case 'buy': { if (e.unit === me.id) { const it = ITEM_BY_ID[e.item]; this.toast(`Purchased ${it.name}`); if (this.shop.open) this.shop.refresh(); } break; }
        case 'ward': { if (e.team === pt) this.addFeed(`<span class="ann">Ward placed</span>`); break; }
        default: break;
      }
    }
  }

  private addFloater(x: number, z: number, text: string, color: string, size: number, life: number) {
    this.floaters.push({ x: x + (Math.random() - 0.5) * 0.8, z, text, color, t: 0, size, vy: 1.3, life });
    if (this.floaters.length > 60) this.floaters.shift();
  }
  private addFeed(html: string) {
    const row = h('div', { class: 'row', html });
    this.feed.prepend(row);
    while (this.feed.children.length > 6) this.feed.lastElementChild?.remove();
    setTimeout(() => row.classList.add('fade'), 6500);
    setTimeout(() => row.remove(), 7500);
  }
  private queueBanner(text: string, team: number, priority: number) {
    this.captions.push(text);
    if (this.captions.length > 20) this.captions.shift();
    if (text === this.lastAnnounce && this.bannerQueue.length) return;
    this.lastAnnounce = text;
    this.bannerQueue.push({ text, team, priority });
    if (this.banner.classList.contains('hidden')) this.nextBanner();
  }
  private nextBanner() {
    const n = this.bannerQueue.sort((a, b) => b.priority - a.priority).shift();
    if (!n) { this.banner.classList.add('hidden'); return; }
    const pt = this.host.sim.player.team;
    this.banner.className = `banner ${n.team === 2 ? 'neutral' : n.team === pt ? 'ally' : 'foe'}`;
    this.banner.textContent = n.text;
    clearTimeout(this.bannerTimer);
    this.bannerTimer = window.setTimeout(() => { this.banner.classList.add('hidden'); setTimeout(() => this.nextBanner(), 250); }, 3200);
  }

  // ------------------------------------------------------------ per-frame canvas overlay
  frame(dt: number) {
    const r = this.host.renderer, sim = this.host.sim;
    const W = r.width, H = r.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (this.bars.width !== Math.round(W * dpr) || this.bars.height !== Math.round(H * dpr)) { this.bars.width = Math.round(W * dpr); this.bars.height = Math.round(H * dpr); }
    const c = this.bctx;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, W, H);
    const pt = sim.player.team;
    const tc = this.host.settings.colorblind ? TEAM_COLOR_CB : TEAM_COLOR;
    const alpha = 1;
    void alpha;
    const draw = (u: Unit) => {
      if (u.dead) return;
      const vis = u.team === pt || u.visUntil[pt] > sim.time || u.stype;
      if (!vis || u.kind === 'ward') return;
      if (u.kind === 'decoy') return;
      const a = 0; void a;
      const ix = u.x, iz = u.z;
      const hgt = u.kind === 'hero' ? 3.5 : u.stype ? (u.stype === 'engine' ? 8.2 : u.stype === 'seal' ? 5.6 : 7.4) : u.kind === 'monster' ? (u.radius > 2 ? 8 : u.radius > 0.9 ? 3.8 : 2.0) : u.mtype === 'vanguard' ? 3.3 : 2.3;
      const p = r.project(ix, hgt, iz);
      if (!p.visible) return;
      const ally = u.team === pt, neutral = u.team === 2;
      const col = neutral ? '#ffd060' : css(tc[u.team]);
      let w = u.kind === 'hero' ? 76 : u.stype ? (u.stype === 'engine' ? 130 : 96) : u.kind === 'monster' ? (u.radius > 2 ? 170 : u.radius > 0.9 ? 84 : 46) : u.mtype === 'vanguard' ? 56 : 36;
      const hh = u.kind === 'hero' ? 9 : u.stype ? 10 : u.kind === 'monster' ? 7 : 5;
      const x0 = p.x - w / 2, y0 = p.y - hh;
      const ratio = clamp(u.hp / u.maxHp, 0, 1);
      c.fillStyle = 'rgba(6,10,24,0.82)'; c.fillRect(x0 - 1.5, y0 - 1.5, w + 3, hh + 3);
      c.fillStyle = 'rgba(40,40,50,0.9)'; c.fillRect(x0, y0, w, hh);
      c.fillStyle = u.invuln && u.stype ? '#9a7ad8' : ally ? (this.host.settings.colorblind ? '#4a90ff' : '#4fd06a') : neutral ? '#e8b64a' : (this.host.settings.colorblind ? '#ffb000' : '#e8584a');
      c.fillRect(x0, y0, w * ratio, hh);
      if (u.shield > 0) { c.fillStyle = 'rgba(127,232,255,0.9)'; c.fillRect(x0, y0, Math.min(w, (w * u.shield) / u.maxHp), 3); }
      if (u.kind === 'hero' || u.stype) {
        c.fillStyle = 'rgba(0,0,0,0.55)';
        const seg = u.kind === 'hero' ? 200 : 500;
        for (let hp = seg; hp < u.maxHp; hp += seg) c.fillRect(x0 + (w * hp) / u.maxHp, y0, 1, hh);
      }
      c.strokeStyle = col; c.lineWidth = 1.5; c.strokeRect(x0 - 1, y0 - 1, w + 2, hh + 2);
      if (u.kind === 'hero') {
        // resource bar
        c.fillStyle = 'rgba(6,10,24,0.82)'; c.fillRect(x0, y0 + hh + 1, w, 5);
        c.fillStyle = HERO_BY_ID[u.hero!.heroId].resource === 'energy' ? '#ffd24a' : '#4a8cff'; c.fillRect(x0, y0 + hh + 1, w * clamp(u.mana / Math.max(1, u.maxMana), 0, 1), 5);
        // level badge + name
        c.fillStyle = '#0a1230'; c.beginPath(); c.arc(x0 - 11, y0 + 6, 10, 0, 7); c.fill(); c.strokeStyle = col; c.lineWidth = 2; c.stroke();
        c.fillStyle = '#fff'; c.font = 'bold 11px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(u.hero!.level), x0 - 11, y0 + 6.5);
        c.font = '600 11px sans-serif'; c.fillStyle = ally ? '#bfe0ff' : '#ffc4b8'; c.strokeStyle = 'rgba(0,0,0,0.8)'; c.lineWidth = 3;
        c.strokeText(u.hero!.name, p.x, y0 - 9); c.fillText(u.hero!.name, p.x, y0 - 9);
        // crowd control tags
        const tags: string[] = [];
        if (sim.has(u, 'stun')) tags.push('STUN'); if (sim.has(u, 'airborne')) tags.push('AIRBORNE'); if (sim.has(u, 'root')) tags.push('ROOT'); if (sim.has(u, 'silence')) tags.push('SILENCE');
        if (u.hushed) tags.push('HUSHED'); if (sim.has(u, 'slow')) tags.push('SLOW'); if (sim.has(u, 'prism')) tags.push('MARKED');
        if (u.hero!.recallStart > 0) tags.push('RECALL');
        if (tags.length) { c.font = 'bold 10px sans-serif'; c.fillStyle = '#ffe08a'; c.strokeText(tags.join(' · '), p.x, y0 - 21); c.fillText(tags.join(' · '), p.x, y0 - 21); }
      }
      if (u.stype && (u.kind === 'tower' || u.kind === 'core') && u.tramp > 0 && sim.time - u.lastDamagedAt >= 0) {
        // tower ramp indicator when aiming at a hero
        const tg = sim.byId.get(u.ttarget);
        if (tg && tg.kind === 'hero') { c.font = 'bold 11px sans-serif'; c.fillStyle = '#ff8a7a'; c.strokeStyle = 'rgba(0,0,0,0.8)'; c.lineWidth = 3; c.strokeText(`FOCUS ×${(1 + u.tramp * 0.15).toFixed(2)}`, p.x, y0 - 8); c.fillText(`FOCUS ×${(1 + u.tramp * 0.15).toFixed(2)}`, p.x, y0 - 8); }
      }
      if (u.stype === 'seal' && u.invuln) { c.font = 'bold 10px sans-serif'; c.fillStyle = '#ff9ae8'; c.textAlign = 'center'; c.fillText('SEALED', p.x, y0 - 6); }
      if (u.stype === 'core' && u.invuln) { c.font = 'bold 10px sans-serif'; c.fillStyle = '#ff9ae8'; c.textAlign = 'center'; c.fillText('PROTECTED', p.x, y0 - 6); }
      if (u.stype === 'engine' && u.invuln) { c.font = 'bold 10px sans-serif'; c.fillStyle = '#ff9ae8'; c.textAlign = 'center'; c.fillText('CORES STAND', p.x, y0 - 6); }
      if (u.kind === 'monster' && u.radius > 2) { c.font = 'bold 12px sans-serif'; c.fillStyle = '#ffd1ff'; c.textAlign = 'center'; c.strokeStyle = 'rgba(0,0,0,0.8)'; c.lineWidth = 3; c.strokeText(u.name.toUpperCase(), p.x, y0 - 8); c.fillText(u.name.toUpperCase(), p.x, y0 - 8); }
    };
    // draw structures first (back), then others sorted by depth
    const list = sim.units.filter((u) => !u.dead).sort((a, b) => (a.x - a.z) - (b.x - b.z));
    for (const u of list) if (u.stype) draw(u);
    for (const u of list) if (!u.stype && u.kind !== 'hero') draw(u);
    for (const u of list) if (u.kind === 'hero') draw(u);
    // ward icons
    for (const u of list) {
      if (u.kind !== 'ward' || u.team !== pt) continue;
      const p = r.project(u.x, 1.6, u.z);
      c.fillStyle = 'rgba(159,244,255,0.9)'; c.font = '10px sans-serif'; c.textAlign = 'center'; c.fillText(`${Math.max(0, Math.ceil(u.expires - sim.time))}s`, p.x, p.y);
    }
    // flush aggregated damage numbers
    for (const [k, p] of this.pendingDmg) if (sim.time - p.t > 0.28) {
      this.addFloater(p.x, p.z, String(Math.round(p.sum)), p.color, k >= 100000 ? 18 : Math.min(30, 16 + p.sum / 40), 0.9);
      this.pendingDmg.delete(k);
    }
    // floaters
    for (let i = this.floaters.length - 1; i >= 0; i--) {
      const f = this.floaters[i];
      f.t += dt;
      if (f.t > f.life) { this.floaters.splice(i, 1); continue; }
      const p = r.project(f.x, 2.4 + f.t * f.vy, f.z);
      c.globalAlpha = clamp(1 - (f.t / f.life) ** 2, 0, 1);
      c.font = `800 ${f.size}px "Trebuchet MS", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.lineWidth = 4; c.strokeStyle = 'rgba(0,0,0,0.85)'; c.strokeText(f.text, p.x, p.y);
      c.fillStyle = f.color; c.fillText(f.text, p.x, p.y);
      c.globalAlpha = 1;
    }
    // minimap
    this.miniAcc += dt;
    if (this.miniAcc > 0.06) { this.miniAcc = 0; this.drawMini(this.mctx, 220, this.miniBg); if (this.mapShown && this.big && this.bigBg) this.drawMini(this.big.getContext('2d')!, 640, this.bigBg, true); }
    this.slowAcc += dt;
    if (this.slowAcc > 0.1) { this.slowAcc = 0; this.slow(); }
  }

  // ------------------------------------------------------------ ~10 Hz DOM read model
  private slow() {
    const sim = this.host.sim, me = sim.player, hs = me.hero!, def = HERO_BY_ID[hs.heroId], now = sim.time;
    this.score0.textContent = String(sim.teams[0].kills); this.score1.textContent = String(sim.teams[1].kills);
    this.clock.textContent = fmtTime(now);
    this.kda.textContent = `${hs.kills} / ${hs.deaths} / ${hs.assists}  ·  ${hs.lastHits + hs.monsterKills} CS`;
    // vitals
    this.hpFill.style.width = `${clamp(me.hp / me.maxHp, 0, 1) * 100}%`;
    this.mpFill.style.width = `${clamp(me.mana / Math.max(1, me.maxMana), 0, 1) * 100}%`;
    this.hpTxt.textContent = `${Math.ceil(me.hp)} / ${me.maxHp}${me.shield > 0 ? ` (+${Math.round(me.shield)})` : ''}`;
    this.mpTxt.textContent = `${Math.floor(me.mana)} / ${me.maxMana}`;
    this.lvl.textContent = String(hs.level);
    const lo = XP_TO_LEVEL[hs.level], hi = XP_TO_LEVEL[Math.min(MAX_LEVEL, hs.level + 1)];
    const xp = hs.level >= MAX_LEVEL ? 1 : (hs.xp - lo) / Math.max(1, hi - lo);
    this.xpRing.style.background = `conic-gradient(#ffd24a ${xp * 360}deg, rgba(255,255,255,0.1) 0)`;
    this.stats.innerHTML = `<span title="Attack damage">⚔ ${Math.round(me.ad)}</span><span title="Ability power">✦ ${Math.round(me.ap)}</span><span title="Armor">⛨ ${Math.round(me.armor)}</span><span title="Ward">☁ ${Math.round(me.ward)}</span><span title="Attack speed">➶ ${me.as.toFixed(2)}</span><span title="Move speed">» ${me.ms.toFixed(2)}</span><span title="Ability haste">⌛ ${Math.round(me.haste)}</span>`;
    this.goldEl.textContent = `◉ ${Math.floor(hs.gold)}${sim.inShop(me) ? '  ·  Shop open (P)' : ''}`;
    // abilities
    this.abEls.forEach((el, i) => {
      const a = def.abilities[i];
      const rank = hs.ranks[i];
      const cd = hs.cds[i] - now;
      const rec = hs.rec[i];
      const recast = !!(rec && rec.until > now);
      const cost = a.cost[Math.max(0, rank - 1)];
      el.root.classList.toggle('locked', rank === 0);
      el.root.classList.toggle('nomana', rank > 0 && me.mana < cost);
      el.root.classList.toggle('recast', recast);
      el.cd.style.height = rank === 0 || recast ? '0%' : `${clamp(cd / Math.max(0.5, a.cd[Math.max(0, rank - 1)]), 0, 1) * 100}%`;
      el.cdt.textContent = cd > 0 && !recast && rank > 0 ? (cd > 9 ? String(Math.ceil(cd)) : cd.toFixed(1)) : recast ? '↺' : '';
      const max = a.ult ? 2 : 4;
      el.pips.innerHTML = Array.from({ length: max }, (_, k) => `<i class="${k < rank ? 'on' : ''}"></i>`).join('');
      const canLearn = hs.skillPts > 0 && (a.ult ? rank < 2 && hs.level >= (rank === 0 ? 6 : 11) : rank < 4 && hs.level >= rank * 2 + 1 - 0);
      el.plus.classList.toggle('hidden', !canLearn);
    });
    this.talEls.forEach((el, i) => {
      const cd = hs.talentCds[i] - now;
      el.cd.style.height = `${clamp(cd / TALENT_BY_ID[hs.talents[i]].cd, 0, 1) * 100}%`;
      el.cdt.textContent = cd > 0 ? String(Math.ceil(cd)) : '';
    });
    this.itemEls.forEach((el, i) => {
      const s = hs.items[i];
      const it = s ? ITEM_BY_ID[s.id] : null;
      el.ico.textContent = it ? it.icon : '';
      el.ico.style.color = it?.color ?? '';
      el.root.classList.toggle('empty', !it);
      el.qty.textContent = s && s.qty > 1 ? String(s.qty) : '';
      el.cd.style.height = s && s.cdUntil > now ? `${clamp((s.cdUntil - now) / 90, 0, 1) * 100}%` : '0%';
    });
    (this.trinketEl.querySelector('.qty') as HTMLElement).textContent = String(hs.trinketCharges);
    this.trinketEl.classList.toggle('empty', hs.trinketCharges <= 0);
    // objectives
    this.renderObjectives();
    // recall
    const rc = hs.recallStart > 0;
    this.recallBar.classList.toggle('hidden', !rc);
    if (rc) { const p = clamp((now - hs.recallStart) / hs.recallDur, 0, 1); this.recallFill.style.width = `${p * 100}%`; this.recallTxt.textContent = `Recalling… ${(hs.recallDur * (1 - p)).toFixed(1)}s`; }
    // death
    this.veil.classList.toggle('hidden', !me.dead);
    if (me.dead && this.hintEl) { this.hintEl.remove(); this.hintEl = null; }
    if (me.dead) this.renderDeath();
    if (this.boardShown) this.renderBoard();
    if (this.shop.open) this.shop.tick();
    // music intensity
    let near = 0;
    for (const e of sim.heroes) if (e.team !== me.team && !e.dead && dist(e.x, e.z, me.x, me.z) < 18) near++;
    const fight = now - me.lastCombatAt < 4 ? 0.5 : 0;
    audio.setIntensity(near ? 0.7 + near * 0.1 : fight);
    audio.listener.x = this.host.renderer.cam.x; audio.listener.z = this.host.renderer.cam.z;
  }

  private objChip(icon: string, label: string, state: string, cls: string): HTMLElement {
    return h('div', { class: `obj ${cls}`, title: label }, h('b', {}, icon), h('span', {}, state));
  }
  private renderObjectives() {
    const sim = this.host.sim, now = sim.time, rules = sim.rules;
    clear(this.objs);
    const camp = (id: string) => rules.camps.find((c) => c.def.id === id);
    const chip = (id: string, icon: string, name: string, spawnAt: number) => {
      const c = camp(id);
      const alive = c?.spawned && c.members.some((m) => !m.dead);
      const m = c?.members.find((x) => !x.dead);
      let state = '';
      let cls = '';
      if (alive && m) { state = `${Math.round((m.hp / m.maxHp) * 100)}%`; cls = 'alive'; }
      else { const t = (c?.respawnAt ?? spawnAt) - now; state = fmtTime(Math.max(0, t)); cls = 'down'; }
      return this.objChip(icon, name, state, cls);
    };
    this.objs.append(chip('catalyst-n', '◈', 'Northern Catalyst: movement boon', CATALYST_SPAWN), chip('colossus', '☗', 'Aether Colossus: siege window', COLOSSUS_SPAWN), chip('catalyst-s', '◈', 'Southern Catalyst: structure damage boon', CATALYST_SPAWN));
    const pt = sim.player.team;
    const t = sim.teams[pt];
    const buffs: string[] = [];
    if (t.buffMoveUntil > now) buffs.push(`Swift roads ${fmtTime(t.buffMoveUntil - now)}`);
    if (t.buffStructUntil > now) buffs.push(`Siege power ${fmtTime(t.buffStructUntil - now)}`);
    if (t.colossusUntil > now) buffs.push(`Colossus empowerment ${fmtTime(t.colossusUntil - now)}`);
    const sealTxt = (team: 0 | 1) => sim.teams[team].sealDown.some(Boolean) ? '⚠' : '◍';
    this.objs.append(h('div', { class: 'obj seals', title: 'Seal status (◍ intact, ⚠ broken)' }, h('b', {}, '◍'), h('span', {}, `${sealTxt(0)} vs ${sealTxt(1)}`)));
    if (buffs.length) this.objs.append(h('div', { class: 'obj buffs' }, buffs.join(' · ')));
  }

  private renderDeath() {
    const sim = this.host.sim, me = sim.player, hs = me.hero!;
    const left = Math.max(0, hs.respawnAt - sim.time);
    const rec = hs.recap.filter((x) => sim.time - x.t < 12 && x.t >= hs.deathAt - 8);
    const by = new Map<string, { sum: number; types: Set<string>; label: string }>();
    for (const x of rec) { const k = x.srcName; const e = by.get(k) ?? { sum: 0, types: new Set(), label: x.label }; e.sum += x.amount; e.types.add(x.type); e.label = x.label; by.set(k, e); }
    const rows = [...by.entries()].sort((a, b) => b[1].sum - a[1].sum).slice(0, 5);
    const total = rows.reduce((s, r) => s + r[1].sum, 0) || 1;
    this.veilBody.innerHTML = `<h2>You were defeated</h2><div class="rt">Respawn in <b>${Math.ceil(left)}</b>s</div>
      <div class="recap"><h4>Death recap — damage in the last 8 seconds</h4>${rows.map(([n, v]) => `<div class="rr"><span>${n}</span><i style="width:${(v.sum / total) * 100}%"></i><em>${Math.round(v.sum)}</em><small>${[...v.types].join('/')}</small></div>`).join('') || '<div class="rr"><span>Damage taken unknown</span></div>'}</div>
      <p class="hint">You may still shop at the fountain. Camera is free: use the minimap or arrow keys.</p>`;
    void this.deathRecapAt;
  }

  private renderBoard() {
    const sim = this.host.sim;
    const pt = sim.player.team;
    const rows = (team: 0 | 1) => sim.heroes.filter((x) => x.team === team).map((u) => {
      const s = u.hero!, d = HERO_BY_ID[s.heroId];
      const own = team === pt;
      return `<tr class="${u === sim.player ? 'me' : ''}${u.dead ? ' dead' : ''}"><td><b>${d.name}</b> <small>${s.controller === 'player' ? 'you' : 'bot'}</small></td><td>${s.level}</td><td>${s.kills}/${s.deaths}/${s.assists}</td><td>${s.lastHits + s.monsterKills}</td>
      <td class="it">${s.items.map((i) => (i ? `<span style="color:${ITEM_BY_ID[i.id].color}" title="${ITEM_BY_ID[i.id].name}">${ITEM_BY_ID[i.id].icon}</span>` : '<span class="e">·</span>')).join('')}</td>
      <td>${own || sim.winner >= 0 ? fmtNum(s.totalGold) : '—'}</td><td>${s.objectives}</td><td>${s.wardsPlaced}/${s.wardsKilled}</td><td>local</td></tr>`;
    }).join('');
    const head = '<tr><th>Hero</th><th>Lv</th><th>K/D/A</th><th>CS</th><th>Items</th><th>Gold</th><th>Obj</th><th>Wards</th><th>Ping</th></tr>';
    this.board.innerHTML = `<h3>Scoreboard <small>${fmtTime(sim.time)}</small></h3>
      <div class="side blue"><h4>${TEAM_NAMES[0]} — ${sim.teams[0].kills} kills · ${sim.teams[0].structuresLost} structures lost</h4><table>${head}${rows(0)}</table></div>
      <div class="side red"><h4>${TEAM_NAMES[1]} — ${sim.teams[1].kills} kills · ${sim.teams[1].structuresLost} structures lost</h4><table>${head}${rows(1)}</table></div>`;
  }

  destroy() { clearTimeout(this.toastTimer); clearTimeout(this.bannerTimer); this.el.remove(); }
  _unused() { void TEAM_BASE; void MAP_H; }
}
