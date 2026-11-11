// input-camera: pointer / keyboard mapping, selection, control groups, command modes. UI never mutates the sim directly: it issues commands.
import { TD } from '../sim/ext';
import { heightAt } from '../sim/map';
import { Ord } from '../sim/types';
import type { Command, OrderName } from '../sim/types';
import type { Game } from '../app/game';
import type { ViewState } from '../render/renderer';
import { audio } from '../audio/audio';

export type Mode =
  | { kind: 'none' }
  | { kind: 'attackMove' }
  | { kind: 'patrol' }
  | { kind: 'rally' }
  | { kind: 'build'; def: number }
  | { kind: 'ability'; idx: number; target: 'point' | 'structure' | 'grove' | 'unit' };

const SLOT_KEYS = ['q', 'w', 'e', 'r', 'a', 's', 'd', 'f', 'z', 'x', 'c', 'v'];
export { SLOT_KEYS };

export class Input {
  selection: number[] = [];
  groups: number[][] = Array.from({ length: 10 }, () => []);
  mode: Mode = { kind: 'none' };
  cardMode: 'main' | 'build' = 'main';
  activeType = -1;
  hover = -1;
  dragBox: { x0: number; y0: number; x1: number; y1: number } | null = null;
  keys = new Set<string>();
  mouse = { x: 0, y: 0, inside: false };
  private down: { x: number; y: number; button: number; t: number; shift: boolean } | null = null;
  private pan: { x: number; y: number } | null = null;
  private lastClick = { t: 0, id: -1 };
  private lastGroup = { n: -1, t: 0 };
  private g = { x: 0, z: 0 };
  private g2 = { x: 0, z: 0 };
  onSelectionChange: () => void = () => {};
  /** hooks used by the tutorial */
  onGroupAssigned: (n: number) => void = () => {};
  onCommand: (c: string) => void = () => {};
  private bound: Array<[EventTarget, string, EventListener, AddEventListenerOptions | undefined]> = [];
  enabled = true;
  lastAlert: { x: number; y: number } | null = null;

  constructor(private game: Game, private el: HTMLElement) {
    const on = (t: EventTarget, ev: string, fn: (e: never) => void, opt?: AddEventListenerOptions) => {
      t.addEventListener(ev, fn as unknown as EventListener, opt);
      this.bound.push([t, ev, fn as unknown as EventListener, opt]);
    };
    on(el, 'pointerdown', (e: PointerEvent) => this.onDown(e));
    on(window, 'pointermove', (e: PointerEvent) => this.onMove(e));
    on(window, 'pointerup', (e: PointerEvent) => this.onUp(e));
    on(el, 'contextmenu', (e: Event) => e.preventDefault());
    on(el, 'wheel', (e: WheelEvent) => { if (!this.enabled) return; e.preventDefault(); this.game.renderer.cam.zoomBy(e.deltaY); }, { passive: false });
    on(el, 'pointerleave', () => { this.mouse.inside = false; });
    on(el, 'pointerenter', () => { this.mouse.inside = true; });
    on(window, 'keydown', (e: KeyboardEvent) => this.onKeyDown(e));
    on(window, 'keyup', (e: KeyboardEvent) => { this.keys.delete(e.key.toLowerCase()); });
    on(window, 'blur', () => { this.keys.clear(); this.down = null; this.dragBox = null; });
  }
  detach() { for (const [t, ev, fn, opt] of this.bound) t.removeEventListener(ev, fn, opt); this.bound = []; }

  private get sim() { return this.game.sim; }
  private get local() { return this.game.local; }
  private rect() { return this.el.getBoundingClientRect(); }

  // ------------------------------------------------------------ helpers
  private ground(px: number, py: number, out = this.g): boolean {
    const r = this.rect();
    return this.game.renderer.cam.groundPoint(((px - r.left) / r.width) * 2 - 1, -(((py - r.top) / r.height) * 2 - 1), out);
  }
  private local2(e: { clientX: number; clientY: number }) { const r = this.rect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }

  isOwned(id: number) { return this.sim.alive[id] && this.sim.owner[id] === this.local; }
  ownSelected() { return this.selection.filter((id) => this.isOwned(id)); }

  /** entity under the cursor (units win over structures); includes remembered enemy structures */
  pick(px: number, py: number): number {
    const sim = this.sim, R = this.game.renderer;
    const r = this.rect();
    const lx = px - r.left, ly = py - r.top;
    let bestU = -1, bs = 1;
    const tmp = { x: 0, y: 0, z: 0 }, tmp2 = { x: 0, y: 0, z: 0 };
    for (const id of sim.ids) {
      if (!sim.alive[id]) continue;
      const td = TD[sim.type[id]];
      if (!td.isUnit) continue;
      if (!this.visibleForPick(id)) continue;
      const h = heightAt(sim.map, sim.x[id], sim.y[id]) + (td.isHover ? 1.5 : 0);
      R.cam.project(sim.x[id], h + 0.6, sim.y[id], r.width, r.height, tmp);
      if (tmp.z > 1) continue;
      R.cam.project(sim.x[id] + td.def.radius, h + 0.6, sim.y[id], r.width, r.height, tmp2);
      const rad = Math.max(13, Math.abs(tmp2.x - tmp.x) * 1.35);
      const d = Math.hypot(tmp.x - lx, tmp.y - ly);
      const s = d / rad;
      if (s < bs) { bs = s; bestU = id; }
    }
    if (bestU >= 0) return bestU;
    // structures / neutrals: ground point inside footprint
    if (!this.ground(px, py)) return -1;
    const gx = this.g.x, gz = this.g.z;
    let best = -1, bd = 1e9;
    for (const id of sim.ids) {
      if (!sim.alive[id]) continue;
      const td = TD[sim.type[id]];
      if (!td.isStruct && !td.isNeutral) continue;
      const e = sim.ext[id];
      // allow clicking the (taller) model: extend the footprint towards the camera
      if (gx < e.ox - 0.3 || gx > e.ox + e.fw + 0.3 || gz < e.oy - 0.3 - Math.min(2.2, e.fh * 0.5) || gz > e.oy + e.fh + 0.3) continue;
      if (!this.visibleForPick(id) && !(sim.players[Math.max(0, this.local)].seen[sim.cellIdx(sim.x[id], sim.y[id])] && sim.owner[id] !== this.local)) continue;
      const d = Math.hypot(gx - sim.x[id], gz - sim.y[id]);
      if (d < bd) { bd = d; best = id; }
    }
    return best;
  }
  private visibleForPick(id: number): boolean {
    if (this.local < 0) return true;
    if (this.sim.owner[id] === this.local) return true;
    return this.sim.visibleTo(this.local, id);
  }

  // ------------------------------------------------------------ selection
  select(ids: number[], add = false) {
    const set = new Set(add ? this.selection : []);
    for (const id of ids) if (this.sim.alive[id]) set.add(id);
    this.selection = [...set];
    // only own entities mixed; a lone foreign entity is allowed for inspection
    if (this.selection.length > 1) this.selection = this.selection.filter((id) => this.sim.owner[id] === this.local || this.local < 0);
    this.activeType = -1;
    this.cardMode = 'main';
    this.mode = { kind: 'none' };
    this.onSelectionChange();
  }
  private selectSameType(id: number, onScreenOnly: boolean) {
    const sim = this.sim, R = this.game.renderer;
    const r = this.rect();
    const t = sim.type[id], o = sim.owner[id];
    const ids: number[] = [];
    const tmp = { x: 0, y: 0, z: 0 };
    for (const u of sim.ids) {
      if (!sim.alive[u] || sim.type[u] !== t || sim.owner[u] !== o) continue;
      if (onScreenOnly) { R.cam.project(sim.x[u], 1, sim.y[u], r.width, r.height, tmp); if (tmp.x < 0 || tmp.y < 0 || tmp.x > r.width || tmp.y > r.height || tmp.z > 1) continue; }
      ids.push(u);
    }
    return ids;
  }
  pruneSelection() {
    const before = this.selection.length;
    this.selection = this.selection.filter((id) => this.sim.alive[id] && (this.sim.owner[id] === this.local || this.local < 0 || this.visibleForPick(id) || TD[this.sim.type[id]].isNeutral));
    if (this.selection.length !== before) { this.onSelectionChange(); }
  }
  types(): number[] {
    const seen: number[] = [];
    for (const id of this.selection) { const t = this.sim.type[id]; if (!seen.includes(t)) seen.push(t); }
    return seen;
  }
  /** units that a unit-level command applies to (active subtype for abilities) */
  commandIds(abilityOnly = false): number[] {
    const own = this.ownSelected();
    if (!abilityOnly) return own;
    const types = this.types();
    const at = this.activeType >= 0 && types.includes(this.activeType) ? this.activeType : types[0];
    return own.filter((id) => this.sim.type[id] === at);
  }

  // ------------------------------------------------------------ pointer
  private onDown(e: PointerEvent) {
    if (!this.enabled) return;
    this.el.setPointerCapture?.(e.pointerId);
    const p = this.local2(e);
    this.mouse.x = p.x; this.mouse.y = p.y;
    audio.init();
    if (e.button === 1) { this.pan = { x: e.clientX, y: e.clientY }; e.preventDefault(); return; }
    if (e.button === 2) {
      if (this.mode.kind !== 'none') { this.mode = { kind: 'none' }; this.cardMode = this.cardMode === 'build' ? 'build' : 'main'; this.onSelectionChange(); return; }
      this.rightClick(e);
      return;
    }
    if (e.button === 0) this.down = { x: e.clientX, y: e.clientY, button: 0, t: performance.now(), shift: e.shiftKey };
  }
  private onMove(e: PointerEvent) {
    const p = this.local2(e);
    this.mouse.x = p.x; this.mouse.y = p.y;
    if (this.pan) {
      const cam = this.game.renderer.cam;
      const okA = this.ground(this.pan.x, this.pan.y, this.g), okB = this.ground(e.clientX, e.clientY, this.g2);
      if (okA && okB) { cam.tx += this.g.x - this.g2.x; cam.tz += this.g.z - this.g2.z; cam.clamp(); cam.jump = null; }
      this.pan = { x: e.clientX, y: e.clientY };
      return;
    }
    if (this.down && this.mode.kind === 'none') {
      const dx = e.clientX - this.down.x, dy = e.clientY - this.down.y;
      if (Math.hypot(dx, dy) > 6) {
        const r = this.rect();
        this.dragBox = { x0: this.down.x - r.left, y0: this.down.y - r.top, x1: p.x, y1: p.y };
      }
    }
  }
  private onUp(e: PointerEvent) {
    if (e.button === 1) { this.pan = null; return; }
    if (e.button !== 0 || !this.down) return;
    const d = this.down; this.down = null;
    const box = this.dragBox; this.dragBox = null;
    if (!this.enabled) return;
    const r = this.rect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) { if (!box) return; }
    if (box && this.mode.kind === 'none') { this.boxSelect(box, e.shiftKey || d.shift); return; }
    this.leftClick(e);
  }

  private boxSelect(b: { x0: number; y0: number; x1: number; y1: number }, add: boolean) {
    const sim = this.sim, R = this.game.renderer;
    const r = this.rect();
    const x0 = Math.min(b.x0, b.x1), x1 = Math.max(b.x0, b.x1), y0 = Math.min(b.y0, b.y1), y1 = Math.max(b.y0, b.y1);
    const ids: number[] = [];
    const tmp = { x: 0, y: 0, z: 0 };
    for (const id of sim.ids) {
      if (!sim.alive[id] || sim.owner[id] !== this.local) continue;
      const td = TD[sim.type[id]];
      if (!td.isUnit) continue;
      R.cam.project(sim.x[id], heightAt(sim.map, sim.x[id], sim.y[id]) + 0.6 + (td.isHover ? 1.5 : 0), sim.y[id], r.width, r.height, tmp);
      if (tmp.z < 1 && tmp.x >= x0 && tmp.x <= x1 && tmp.y >= y0 && tmp.y <= y1) ids.push(id);
    }
    if (ids.length) { audio.ui_('select', this.game.localFaction()); this.select(ids, add); }
    else if (!add) this.select([]);
  }

  private leftClick(e: PointerEvent) {
    const sim = this.sim;
    const p = this.local2(e);
    // command modes
    if (this.mode.kind !== 'none') { this.modeClick(e); return; }
    const id = this.pick(e.clientX, e.clientY);
    const now = performance.now();
    if (id < 0) { if (!e.shiftKey) this.select([]); return; }
    const own = sim.owner[id] === this.local;
    const dbl = now - this.lastClick.t < 320 && this.lastClick.id === id;
    this.lastClick = { t: now, id };
    if (e.shiftKey) {
      if (!own) return;
      if (this.selection.includes(id)) this.select(this.selection.filter((s) => s !== id));
      else this.select([id], true);
      return;
    }
    if (own && TD[sim.type[id]].isUnit && (dbl || e.ctrlKey)) { this.select(this.selectSameType(id, true)); audio.ui_('select', this.game.localFaction()); return; }
    this.select([id]);
    if (own) audio.ui_('select', TD[sim.type[id]].def.faction === 'verdant' ? 'verdant' : 'helix');
    void p;
  }

  private modeClick(e: PointerEvent) {
    const m = this.mode;
    const ok = this.ground(e.clientX, e.clientY);
    const gx = this.g.x, gz = this.g.z;
    const shift = e.shiftKey;
    const keep = shift;
    if (m.kind === 'attackMove' || m.kind === 'patrol') {
      if (!ok) return;
      this.order(m.kind === 'attackMove' ? 'attackMove' : 'patrol', gx, gz, -1, shift, false);
      if (!keep) this.mode = { kind: 'none' };
      this.onSelectionChange();
    } else if (m.kind === 'rally') {
      const id = this.pick(e.clientX, e.clientY);
      this.setRally(ok ? gx : 0, ok ? gz : 0, id >= 0 && TD[this.sim.type[id]].isNeutral ? id : -1);
      this.mode = { kind: 'none' };
      this.onSelectionChange();
    } else if (m.kind === 'build') {
      if (!ok) return;
      const chk = this.sim.canPlace(this.local, m.def, gx, gz);
      if (!chk.ok) { audio.ui_('error'); this.game.hud.toast(chk.reason); return; }
      this.game.cmd({ c: 'order', ord: 'build', ids: this.ownSelected().filter((id) => TD[this.sim.type[id]].isWorker), x: chk.ox + chk.w / 2, y: chk.oy + chk.h / 2, param: m.def, queue: shift });
      audio.ui_('ack', this.game.localFaction());
      this.game.renderer.vfx.ring(chk.ox + chk.w / 2, heightAt(this.sim.map, gx, gz), chk.oy + chk.h / 2, 0.5, 2.5, 0.5, 0xffe27a);
      this.onCommand('build');
      if (!keep) { this.mode = { kind: 'none' }; this.cardMode = 'main'; }
      this.onSelectionChange();
    } else if (m.kind === 'ability') {
      const ids = this.commandIds(true);
      const tid = m.target === 'point' ? -1 : this.pick(e.clientX, e.clientY);
      if (m.target !== 'point' && tid < 0) { audio.ui_('error'); return; }
      if (m.target === 'point' && !ok) return;
      this.game.cmd({ c: 'order', ord: 'ability', ids, x: m.target === 'point' ? gx : this.sim.x[tid], y: m.target === 'point' ? gz : this.sim.y[tid], target: tid, param: m.idx, queue: shift });
      this.onCommand('ability');
      audio.ui_('ack', this.game.localFaction());
      this.mode = { kind: 'none' };
      this.onSelectionChange();
    }
  }

  private rightClick(e: PointerEvent) {
    const sim = this.sim;
    if (this.local < 0) return;
    const sel = this.ownSelected();
    if (!sel.length) return;
    const ok = this.ground(e.clientX, e.clientY);
    const gx = this.g.x, gz = this.g.z;
    const units = sel.filter((id) => TD[sim.type[id]].isUnit);
    const structs = sel.filter((id) => TD[sim.type[id]].isStruct);
    const tgt = this.pick(e.clientX, e.clientY);
    const shift = e.shiftKey, alt = e.altKey;
    if (!units.length && structs.length) {
      const prod = structs.filter((id) => TD[sim.type[id]].def.produces);
      if (!prod.length) return;
      this.setRally(ok ? gx : 0, ok ? gz : 0, tgt >= 0 && TD[sim.type[tgt]].isNeutral ? tgt : -1);
      return;
    }
    if (!units.length) return;
    if (tgt >= 0 && sim.alive[tgt]) {
      const tt = TD[sim.type[tgt]];
      const to = sim.owner[tgt];
      const workers = units.filter((id) => TD[sim.type[id]].isWorker);
      const nonWorkers = units.filter((id) => !TD[sim.type[id]].isWorker);
      if (to >= 0 && to !== this.local) {
        const attackers = (nonWorkers.length ? nonWorkers : units).filter((id) => TD[sim.type[id]].canAttack);
        const others = units.filter((id) => !attackers.includes(id));
        if (attackers.length) { this.game.cmd({ c: 'order', ord: 'attack', ids: attackers, target: tgt, queue: shift }); this.mark(sim.x[tgt], sim.y[tgt], 0xff6a5a); audio.ui_('attackAck', this.game.localFaction()); }
        if (others.length && ok) this.game.cmd({ c: 'order', ord: 'move', ids: others, x: gx, y: gz, queue: shift });
        this.onCommand('attack');
        return;
      }
      if (tt.def.id === 'crystal_barrier') {
        const attackers = units.filter((id) => TD[sim.type[id]].canAttack && !TD[sim.type[id]].isWorker);
        if (attackers.length) { this.game.cmd({ c: 'order', ord: 'attack', ids: attackers, target: tgt, queue: shift }); this.mark(sim.x[tgt], sim.y[tgt], 0xc690ff); audio.ui_('attackAck', this.game.localFaction()); return; }
      }
      if ((tt.def.id === 'ore_seam' || tt.def.id === 'flux_vent') && workers.length) {
        this.game.cmd({ c: 'order', ord: 'gather', ids: workers, target: tgt, queue: shift });
        const rest = units.filter((id) => !workers.includes(id));
        if (rest.length && ok) this.game.cmd({ c: 'order', ord: 'move', ids: rest, x: gx, y: gz });
        this.mark(sim.x[tgt], sim.y[tgt], 0x5fd7ff); audio.ui_('ack', this.game.localFaction()); this.onCommand('gather');
        return;
      }
      if (tt.def.id === 'watch_pylon') {
        this.game.cmd({ c: 'order', ord: 'capture', ids: units, target: tgt, queue: shift });
        this.mark(sim.x[tgt], sim.y[tgt], 0x9ae8ff); audio.ui_('ack', this.game.localFaction());
        return;
      }
      if (to === this.local && tt.isStruct && workers.length && (!sim.ext[tgt].done || sim.hp[tgt] < tt.maxHp - 0.5)) {
        this.game.cmd({ c: 'order', ord: 'repair', ids: workers, target: tgt, queue: shift });
        this.mark(sim.x[tgt], sim.y[tgt], 0xffe27a); audio.ui_('ack', this.game.localFaction());
        return;
      }
    }
    if (!ok) return;
    this.order('move', gx, gz, -1, shift, alt);
  }

  private mark(x: number, y: number, color: number) {
    this.game.renderer.vfx.ring(x, heightAt(this.sim.map, x, y), y, 0.3, 1.5, 0.45, color);
  }

  /** issue a positional order for the whole own selection */
  order(ord: OrderName, x: number, y: number, target: number, queue: boolean, force: boolean) {
    const ids = this.ownSelected().filter((id) => TD[this.sim.type[id]].isUnit);
    if (!ids.length) return;
    this.game.cmd({ c: 'order', ord, ids, x, y, target, queue, force });
    this.mark(x, y, ord === 'attackMove' || ord === 'patrol' ? 0xff6a5a : 0x7dff9a);
    audio.ui_(ord === 'attackMove' ? 'attackAck' : 'ack', this.game.localFaction());
    this.onCommand(ord);
  }
  setRally(x: number, y: number, target: number) {
    const ids = this.ownSelected().filter((id) => TD[this.sim.type[id]].isStruct && TD[this.sim.type[id]].def.produces);
    if (!ids.length) return;
    if (target >= 0) { x = this.sim.x[target]; y = this.sim.y[target]; }
    this.game.cmd({ c: 'rally', ids, x, y, target });
    this.mark(x, y, 0x7dff9a);
    audio.ui_('ack', this.game.localFaction());
  }

  // ------------------------------------------------------------ keyboard
  private onKeyDown(e: KeyboardEvent) {
    if (!this.enabled) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA')) return;
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    this.keys.add(key.toLowerCase());
    const K = this.game.settings.keys;
    const consume = () => { e.preventDefault(); e.stopPropagation(); };
    if (key === 'Escape') {
      consume();
      if (this.mode.kind !== 'none') { this.mode = { kind: 'none' }; this.onSelectionChange(); }
      else if (this.cardMode === 'build') { this.cardMode = 'main'; this.onSelectionChange(); }
      else this.game.openPause();
      return;
    }
    if (key === K.menu) { consume(); this.game.openPause(); return; }
    if (key === '`' && import.meta.env?.DEV) { this.game.settings.showStats = !this.game.settings.showStats; consume(); return; }
    if (key === 'F3') { consume(); this.game.settings.debugSurfaces = !this.game.settings.debugSurfaces; this.game.renderer.applySettings(this.game.settings); return; }
    // control groups
    if (/^[0-9]$/.test(key)) { consume(); this.groupKey(parseInt(key, 10), e.ctrlKey || e.metaKey, e.shiftKey); return; }
    if (key === K.alert) { consume(); this.jumpAlert(); return; }
    if (key === K.home) { consume(); this.game.centerOnBase(); return; }
    if (key === K.focus) { consume(); this.focusSelection(); return; }
    if (key === K.cycle) { consume(); this.cycleType(e.shiftKey ? -1 : 1); return; }
    if (key === K.rotateLeft) { this.game.renderer.cam.rotate(-1); return; }
    if (key === K.rotateRight) { this.game.renderer.cam.rotate(1); return; }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key) || key === ' ') consume();
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    // command card hotkeys (unit orders, abilities, production, build palette)
    if (this.game.hud.pressKey(key.length === 1 ? key.toLowerCase() : key)) consume();
  }

  private groupKey(n: number, assign: boolean, add: boolean) {
    const now = performance.now();
    if (assign) {
      this.groups[n] = this.ownSelected().slice();
      this.game.hud.toast(`Control group ${n} set (${this.groups[n].length})`);
      audio.ui_('click');
      this.onGroupAssigned(n);
      return;
    }
    const g = this.groups[n].filter((id) => this.sim.alive[id]);
    this.groups[n] = g;
    if (!g.length) return;
    if (add) { this.select(g, true); this.groups[n] = this.ownSelected().slice(); return; }
    const dbl = this.lastGroup.n === n && now - this.lastGroup.t < 350;
    this.lastGroup = { n, t: now };
    this.select(g);
    audio.ui_('select', this.game.localFaction());
    if (dbl) this.focusSelection();
  }

  focusSelection() {
    if (!this.selection.length) return;
    let x = 0, y = 0, n = 0;
    for (const id of this.selection) { if (!this.sim.alive[id]) continue; x += this.sim.x[id]; y += this.sim.y[id]; n++; }
    if (n) this.game.renderer.cam.setTarget(x / n, y / n + 4, false);
  }
  jumpAlert() { const a = this.lastAlert ?? this.game.lastAlertPos(); if (a) this.game.renderer.cam.setTarget(a.x, a.y + 4, false); }
  cycleType(dir: number) {
    const types = this.types();
    if (types.length < 2) return;
    const cur = types.includes(this.activeType) ? types.indexOf(this.activeType) : 0;
    this.activeType = types[(cur + dir + types.length) % types.length];
    this.onSelectionChange();
  }

  // ------------------------------------------------------------ per frame
  update(dt: number) {
    const s = this.game.settings;
    const K = s.keys;
    let px = 0, pz = 0;
    const k = (name: string) => this.keys.has(K[name].toLowerCase());
    if (this.enabled) {
      if (k('panUp') || (s.wasdPan && this.keys.has('w'))) pz -= 1;
      if (k('panDown') || (s.wasdPan && this.keys.has('s'))) pz += 1;
      if (k('panLeft') || (s.wasdPan && this.keys.has('a'))) px -= 1;
      if (k('panRight') || (s.wasdPan && this.keys.has('d'))) px += 1;
      if (s.edgeScroll && this.mouse.inside && !this.down && !this.pan) {
        const r = this.rect();
        const m = 6;
        if (this.mouse.x < m) px -= 1; else if (this.mouse.x > r.width - m) px += 1;
        if (this.mouse.y < m) pz -= 1; else if (this.mouse.y > r.height - m) pz += 1;
      }
    }
    const n = Math.hypot(px, pz) || 1;
    this.game.renderer.cam.update(dt, (px / n) * s.scrollSpeed, (pz / n) * s.scrollSpeed, this.keys.has('shift'));
    this.pruneSelection();
    // hover
    if (this.mouse.inside && !this.down && !this.pan && this.enabled) {
      const r = this.rect();
      this.hover = this.pick(this.mouse.x + r.left, this.mouse.y + r.top);
    } else if (!this.mouse.inside) this.hover = -1;
    const cur = this.mode.kind === 'attackMove' || this.mode.kind === 'patrol' ? 'crosshair' : this.mode.kind === 'build' || this.mode.kind === 'ability' || this.mode.kind === 'rally' ? 'cell' : this.hover >= 0 ? 'pointer' : 'default';
    if (this.el.style.cursor !== cur) this.el.style.cursor = cur;
  }

  buildView(): ViewState {
    const sim = this.sim;
    let placement: ViewState['placement'] = null;
    let rangeCircle: ViewState['rangeCircle'] = null;
    if (this.mode.kind === 'build' && this.mouse.inside) {
      const r = this.rect();
      if (this.ground(this.mouse.x + r.left, this.mouse.y + r.top)) {
        const chk = sim.canPlace(this.local, this.mode.def, this.g.x, this.g.z);
        const mid = sim.map.size / 2;
        placement = {
          def: this.mode.def, x: this.g.x, y: this.g.z, ok: chk.ok, w: chk.w, h: chk.h, ox: chk.ox, oy: chk.oy, reason: chk.reason,
          fields: sim.fieldRadiusFor(this.local), coneFace: Math.atan2(mid - this.g.z, mid - this.g.x),
        };
      }
    } else if (this.mode.kind === 'ability') {
      const ids = this.commandIds(true);
      const id = ids[0];
      const td = id !== undefined ? TD[sim.type[id]] : null;
      const ab = td?.def.abilities?.[this.mode.idx];
      if (ab && ab.range && ab.range < 100 && id !== undefined) rangeCircle = { x: sim.x[id], y: sim.y[id], r: ab.range };
    } else if (this.selection.length === 1) {
      const id = this.selection[0];
      if (sim.alive[id] && sim.owner[id] === this.local && TD[sim.type[id]].canAttack) {
        const td = TD[sim.type[id]];
        if (td.isStruct && td.def.weapon) rangeCircle = { x: sim.x[id], y: sim.y[id], r: td.def.weapon.range };
      }
    }
    return {
      player: this.local, selection: new Set(this.selection), hover: this.hover, fogEnabled: this.game.fogEnabled, placement, rangeCircle, dragBox: this.dragBox,
      showOrders: true, rallyMode: this.mode.kind === 'rally', statsDebug: this.game.debugLines(), attackMoveMode: this.mode.kind === 'attackMove',
    };
  }

  // ------------------------------------------------------------ actions used by the HUD card
  doOrderAll(ord: 'stop' | 'hold') {
    const ids = this.ownSelected().filter((id) => TD[this.sim.type[id]].isUnit);
    if (!ids.length) return;
    this.game.cmd({ c: 'order', ord, ids });
    audio.ui_('click');
    this.onCommand(ord);
  }
  enterMode(m: Mode) { this.mode = m; this.onSelectionChange(); }
  abilityUse(idx: number) {
    const ids = this.commandIds(true);
    if (!ids.length) return;
    const td = TD[this.sim.type[ids[0]]];
    const ab = td.def.abilities?.[idx];
    if (!ab) return;
    if (ab.target === 'toggle') { this.game.cmd({ c: 'order', ord: 'ability', ids, param: idx }); audio.ui_('click'); this.onCommand('ability'); return; }
    this.enterMode({ kind: 'ability', idx, target: ab.target === 'point' ? 'point' : ab.target === 'grove' ? 'grove' : ab.target === 'structure' ? 'structure' : 'unit' });
  }
  train(bid: number, def: number) { this.game.cmd({ c: 'train', target: bid, param: def }); }
  research(bid: number, up: number) { this.game.cmd({ c: 'research', target: bid, param: up }); }
  cancel(bid: number, idx: number) { this.game.cmd({ c: 'cancel', target: bid, param: idx }); audio.ui_('click'); }
  asCommand(c: Omit<Command, 'player'>) { return c; }
  readonly Ord = Ord;
}
