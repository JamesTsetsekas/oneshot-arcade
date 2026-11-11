/** client-runtime input: keyboard + mouse intent -> sequenced commands. The client never mutates simulation state directly. */
import { HERO_BY_ID, type AbilityDef } from '../shared/content';
import { clamp, dist } from '../shared/math';
import type { CommandBody, Unit } from '../sim/types';
import type { Sim } from '../sim/sim';
import type { GameRenderer } from './renderer';
import type { Settings } from './storage';

export interface InputHost {
  sim: Sim; renderer: GameRenderer; settings: Settings;
  send(cmd: CommandBody): void;
  toast(msg: string): void;
  toggleShop(): void; toggleScoreboard(show: boolean): void; toggleMap(): void; togglePause(): void; toggleDebug(): void;
  cancelUi(): boolean; // closes any open overlay, returns true if something closed
  uiBlocking(): boolean;
  onPlayerCommand(kind: string): void;
  ping(x: number, z: number): void;
}

export class Input {
  mouse = { x: 0, y: 0, inside: true };
  aim: { slot: number; held: boolean } | null = null;
  attackMovePending = false;
  private keys = new Set<string>();
  private drag: { x: number; y: number; cx: number; cz: number } | null = null;
  private follow = false;
  private ping = 0;
  private bound: [EventTarget, string, EventListener][] = [];

  constructor(private host: InputHost, private el: HTMLElement) {
    const on = (t: EventTarget, ev: string, fn: (e: never) => void, opts?: AddEventListenerOptions) => {
      t.addEventListener(ev, fn as EventListener, opts);
      this.bound.push([t, ev, fn as EventListener]);
    };
    on(el, 'mousemove', (e: MouseEvent) => this.onMove(e));
    on(el, 'mousedown', (e: MouseEvent) => this.onDown(e));
    on(window, 'mouseup', (e: MouseEvent) => this.onUp(e));
    on(el, 'contextmenu', (e: MouseEvent) => { e.preventDefault(); });
    on(el, 'wheel', (e: WheelEvent) => { e.preventDefault(); this.host.renderer.cam.height = clamp(this.host.renderer.cam.height + Math.sign(e.deltaY) * 2, 28, 42); }, { passive: false });
    on(window, 'keydown', (e: KeyboardEvent) => this.onKey(e, true));
    on(window, 'keyup', (e: KeyboardEvent) => this.onKey(e, false));
    on(window, 'blur', () => { this.keys.clear(); this.follow = false; this.drag = null; });
    on(document, 'mouseleave', () => { this.mouse.inside = false; });
    on(document, 'mouseenter', () => { this.mouse.inside = true; });
  }
  destroy() { for (const [t, ev, fn] of this.bound) t.removeEventListener(ev, fn); this.bound = []; }

  private get hero(): Unit { return this.host.sim.player; }

  private onMove(e: MouseEvent) {
    this.mouse.x = e.clientX; this.mouse.y = e.clientY; this.mouse.inside = true;
    const r = this.host.renderer;
    if (this.drag) {
      const g0 = r.groundPoint(this.drag.x, this.drag.y);
      const g1 = r.groundPoint(e.clientX, e.clientY);
      // dragging moves the world with the cursor: camera moves opposite
      r.cam.x = this.drag.cx - (g1.x - g0.x);
      r.cam.z = this.drag.cz - (g1.z - g0.z);
    }
  }

  private pickEnemy(x: number, y: number): Unit | null {
    const sim = this.host.sim, team = this.hero.team;
    return this.host.renderer.pickUnit(x, y, (u) => u.team !== team && !u.dead && !u.invuln);
  }

  private onDown(e: MouseEvent) {
    if (this.host.uiBlocking()) return;
    const sim = this.host.sim, r = this.host.renderer;
    if (e.button === 1) { e.preventDefault(); this.drag = { x: e.clientX, y: e.clientY, cx: r.cam.x, cz: r.cam.z }; return; }
    if (sim.winner >= 0) return;
    if (e.button === 0) {
      if (e.altKey) { const g = r.groundPoint(e.clientX, e.clientY); this.host.ping(g.x, g.z); return; }
      if (this.aim && !this.aim.held) { this.castAimed(); return; }
      if (this.attackMovePending) {
        const g = r.groundPoint(e.clientX, e.clientY);
        const enemy = this.pickEnemy(e.clientX, e.clientY);
        if (enemy) this.host.send({ c: 'attack', target: enemy.id });
        else this.host.send({ c: 'amove', x: g.x, z: g.z });
        this.marker(g.x, g.z, 0xff6a50);
        this.attackMovePending = false;
        this.host.onPlayerCommand('amove');
        return;
      }
    }
    if (e.button === 2) {
      e.preventDefault();
      if (this.aim) { this.aim = null; this.host.renderer.showIndicator(null); return; }
      this.attackMovePending = false;
      const enemy = this.pickEnemy(e.clientX, e.clientY);
      const g = r.groundPoint(e.clientX, e.clientY);
      if (enemy) { this.host.send({ c: 'attack', target: enemy.id }); this.marker(enemy.x, enemy.z, 0xff5040, 1.1); this.host.onPlayerCommand('attack'); }
      else { this.host.send({ c: 'move', x: g.x, z: g.z }); this.marker(g.x, g.z, 0xffe08a); this.host.onPlayerCommand('move'); }
    }
  }
  private onUp(e: MouseEvent) { if (e.button === 1) this.drag = null; }

  private marker(x: number, z: number, color: number, r = 0.9) {
    this.host.renderer.decals.spawn('ring', x, z, r, color, 0.45);
  }

  private keyName(e: KeyboardEvent): string {
    const k = e.key.toLowerCase();
    return k === 'escape' ? 'escape' : k;
  }

  private onKey(e: KeyboardEvent, down: boolean) {
    const tgt = e.target as HTMLElement | null;
    if (tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA' || tgt.tagName === 'SELECT')) {
      if (down && e.key === 'Escape') { (tgt as HTMLInputElement).blur(); this.host.cancelUi(); }
      return;
    }
    const k = this.keyName(e);
    const K = this.host.settings.keys;
    const sim = this.host.sim;
    if (k === 'tab') { e.preventDefault(); this.host.toggleScoreboard(down); return; }
    if (down && k === 'escape') {
      if (this.aim || this.attackMovePending) { this.aim = null; this.attackMovePending = false; this.host.renderer.showIndicator(null); return; }
      if (this.host.cancelUi()) return;
      this.host.togglePause();
      return;
    }
    if (this.host.uiBlocking() && !(k === K.shop && down)) return;
    if (down) {
      if (e.repeat) { if (k === K.follow) e.preventDefault(); return; }
      this.keys.add(k);
      if (sim.winner >= 0) return;
      const abil = [K.q, K.w, K.e, K.r].indexOf(k);
      if (abil >= 0) {
        e.preventDefault();
        if (e.ctrlKey) { this.host.send({ c: 'rank', ab: abil }); return; }
        this.beginAbility(abil);
        return;
      }
      if (e.ctrlKey || e.metaKey) return;
      if (k === K.talent1 || k === K.talent2) {
        const idx = k === K.talent1 ? 0 : 1;
        const g = this.host.renderer.groundPoint(this.mouse.x, this.mouse.y);
        this.host.send({ c: 'talent', idx, x: g.x, z: g.z });
        return;
      }
      if (/^[1-6]$/.test(k)) { this.host.send({ c: 'use', idx: Number(k) - 1 }); return; }
      if (k === K.recall) { this.host.send({ c: 'recall' }); this.host.onPlayerCommand('recall'); return; }
      if (k === K.shop) { e.preventDefault(); this.host.toggleShop(); return; }
      if (k === K.ward) { const g = this.host.renderer.groundPoint(this.mouse.x, this.mouse.y); this.host.send({ c: 'ward', x: g.x, z: g.z }); this.host.onPlayerCommand('ward'); return; }
      if (k === K.stop) { this.host.send({ c: 'stop' }); return; }
      if (k === K.hold) { this.host.send({ c: 'hold' }); return; }
      if (k === K.attackMove) { this.attackMovePending = true; this.aim = null; this.host.renderer.showIndicator(null); return; }
      if (k === K.follow) { e.preventDefault(); this.follow = true; return; }
      if (k === K.lock) { this.host.renderer.cam.lock = !this.host.renderer.cam.lock; this.host.toast(this.host.renderer.cam.lock ? 'Camera locked' : 'Camera unlocked'); return; }
      if (k === 'f1') { e.preventDefault(); this.host.renderer.cam.x = this.hero.x; this.host.renderer.cam.z = this.hero.z; return; }
      if (k === 'f3') { e.preventDefault(); this.host.toggleDebug(); return; }
      if (k === 'm') { this.host.toggleMap(); return; }
      if (k === 'enter') { return; }
    } else {
      this.keys.delete(k);
      if (k === K.follow) this.follow = false;
      const abil = [K.q, K.w, K.e, K.r].indexOf(k);
      if (abil >= 0 && this.aim && this.aim.slot === abil && this.aim.held) this.castAimed();
    }
  }

  // ------------------------------------------------------------ casting
  def(slot: number): AbilityDef { return HERO_BY_ID[this.hero.hero!.heroId].abilities[slot]; }

  beginAbility(slot: number) {
    const h = this.hero;
    if (h.dead) return;
    const hs = h.hero!;
    const def = this.def(slot);
    if (hs.ranks[slot] <= 0) { this.host.toast(hs.skillPts > 0 ? `Learn ${def.name} first (Ctrl+${def.key})` : `${def.name} is not learned`); return; }
    const rec = hs.rec[slot];
    const isRecast = !!(rec && rec.until > this.host.sim.time);
    if (isRecast || def.targeting === 'self') { this.castNow(slot); return; }
    const mode = this.host.settings.castMode;
    if (mode === 'quick') { this.castNow(slot); return; }
    this.attackMovePending = false;
    this.aim = { slot, held: mode === 'indicator' };
  }

  private castAimed() {
    const a = this.aim;
    this.aim = null;
    this.host.renderer.showIndicator(null);
    if (a) this.castNow(a.slot);
  }

  private resolveTarget(def: AbilityDef): number {
    const sim = this.host.sim, h = this.hero;
    const r = this.host.renderer;
    if (def.targeting === 'unit') {
      let t = r.pickUnit(this.mouse.x, this.mouse.y, (u) => u.team !== h.team && !u.dead && !u.invuln && !u.stype && u.kind !== 'ward');
      if (!t) {
        const g = r.groundPoint(this.mouse.x, this.mouse.y);
        let bd = 6;
        for (const u of sim.units) {
          if (u.dead || u.team === h.team || u.invuln || u.stype || u.kind === 'ward' || !sim.canSee(h.team, u)) continue;
          if (def.key === 'R' && u.kind !== 'hero') continue;
          const d = dist(u.x, u.z, g.x, g.z);
          if (d < bd) { bd = d; t = u; }
        }
      }
      return t ? t.id : 0;
    }
    if (def.targeting === 'ally') {
      let t = r.pickUnit(this.mouse.x, this.mouse.y, (u) => u.team === h.team && u.kind === 'hero' && u.id !== h.id && !u.dead);
      if (!t) {
        let bd = 1e9;
        for (const u of sim.heroes) { if (u.dead || u.team !== h.team || u.id === h.id) continue; const d = dist(u.x, u.z, h.x, h.z); if (d < bd) { bd = d; t = u; } }
      }
      return t ? t.id : 0;
    }
    return 0;
  }

  castNow(slot: number) {
    const h = this.hero;
    const def = this.def(slot);
    const g = this.host.renderer.groundPoint(this.mouse.x, this.mouse.y);
    const target = this.resolveTarget(def);
    if ((def.targeting === 'unit' || def.targeting === 'ally') && !target) { this.host.toast('No valid target'); return; }
    this.host.send({ c: 'cast', ab: slot, x: g.x, z: g.z, target });
    this.host.onPlayerCommand(`cast${slot}`);
    void h;
  }

  /** called every frame: camera pan + aim indicator */
  update(dt: number) {
    const r = this.host.renderer, h = this.hero;
    const pan = 48 * (r.cam.height / 34) * dt;
    let dx = 0, dz = 0; // screen-space (right, up)
    if (this.keys.has('arrowleft')) dx -= 1;
    if (this.keys.has('arrowright')) dx += 1;
    if (this.keys.has('arrowup')) dz += 1;
    if (this.keys.has('arrowdown')) dz -= 1;
    if (this.host.settings.edgeScroll && this.mouse.inside && !this.drag && document.hasFocus() && !this.host.uiBlocking()) {
      const m = 10, w = window.innerWidth, ht = window.innerHeight;
      if (this.mouse.x <= m) dx -= 1; else if (this.mouse.x >= w - m) dx += 1;
      if (this.mouse.y <= m) dz += 1; else if (this.mouse.y >= ht - m) dz -= 1;
    }
    if (dx || dz) {
      const l = Math.hypot(dx, dz) || 1;
      dx /= l; dz /= l;
      // screen right = (+x,+z)/sqrt2, screen up = (+x,-z)/sqrt2
      r.cam.x += ((dx + dz) / Math.SQRT2) * pan;
      r.cam.z += ((dx - dz) / Math.SQRT2) * pan;
    }
    if (this.follow && !h.dead) { r.cam.x += (h.x - r.cam.x) * Math.min(1, dt * 9); r.cam.z += (h.z - r.cam.z) * Math.min(1, dt * 9); }
    // hover highlight + cursor
    const hover = this.host.uiBlocking() ? null : this.pickEnemy(this.mouse.x, this.mouse.y);
    r.setHover(hover ? hover.id : 0);
    this.el.style.cursor = this.attackMovePending || this.aim ? 'crosshair' : hover ? 'pointer' : 'default';
    // aim indicator
    const a = this.aim;
    if (a && !h.dead) {
      const def = this.def(a.slot);
      const g = r.groundPoint(this.mouse.x, this.mouse.y);
      let tx = g.x, tz = g.z;
      if (def.targeting === 'point') { const d = dist(h.x, h.z, g.x, g.z); if (d > def.range) { tx = h.x + ((g.x - h.x) / d) * def.range; tz = h.z + ((g.z - h.z) / d) * def.range; } }
      let kind = def.shape;
      let valid = true;
      if (def.targeting === 'unit' || def.targeting === 'ally') {
        const id = this.resolveTarget(def);
        const t = id ? this.host.sim.byId.get(id) : null;
        valid = !!t && dist(h.x, h.z, t.x, t.z) <= def.range + 0.5;
        if (t) { tx = t.x; tz = t.z; }
        kind = 'unit';
      }
      const hs = h.hero!;
      const ready = hs.cds[a.slot] <= this.host.sim.time && h.mana >= def.cost[Math.max(0, hs.ranks[a.slot] - 1)];
      const ally = def.tags.includes('shield') || def.tags.includes('buff');
      r.showIndicator({ kind, x: h.x, z: h.z, tx, tz, range: def.targeting === 'self' ? 0 : def.range, size: def.size, color: ally ? 0x70e8ff : 0xffa040, valid: valid && ready });
    } else if (this.attackMovePending) {
      r.showIndicator(null);
    } else r.showIndicator(null);
    this.ping = 0;
  }
}
