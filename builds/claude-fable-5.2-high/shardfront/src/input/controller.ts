// input-camera: pointer/keyboard mapping, selection, command modes and the contextual command card.
// It only ever emits protocol commands; it never mutates simulation state.
import { ABILITY_BY_ID, DEF_INDEX, FACTIONS, TECH_DEFS, TECH_INDEX } from '../data/defs';
import { defTip, techTip } from '../data/describe';
import { keyName, type Settings } from '../app/settings';
import type { AudioEngine } from '../audio/audio';
import type { Command } from '../net/protocol';
import type { GameRenderer, Placement, RangePreview } from '../render/renderer';
import { FL_BRACED, FL_CONSTRUCTING, FL_CURLED, MAX_QUEUE, NEUTRAL, PLACE_OK, PLACE_REASONS, type Sim } from '../sim/sim';
import { MAP_SIZE, heightAt } from '../world/map';
import type { CardButton } from '../ui/store';

export type Mode = 'normal' | 'amove' | 'patrol' | 'guard' | 'rally' | 'place' | 'ability';

export interface Host {
  sim(): Sim;
  issue(cmd: Command): void;
  settings(): Settings;
  toast(text: string): void;
  openMenu(): void;
  togglePerf(): void;
  interactive(): boolean;
  player(): number;
}

const C_MOVE = 0x7dff9a, C_ATTACK = 0xff6a4a, C_GATHER = 0x35e0d0, C_BUILD = 0xffd27a;

export class InputController {
  selection: number[] = [];
  groups: number[][] = Array.from({ length: 10 }, () => []);
  mode: Mode = 'normal';
  page: 'main' | 'build' = 'main';
  placeDef = -1;
  abilityId = '';
  activeDef = -1;
  hover = -1;
  placement: Placement | null = null;
  ranges: RangePreview[] = [];
  dragBox: { x0: number; y0: number; x1: number; y1: number } | null = null;
  lastAlert: { x: number; z: number } | null = null;
  dirty = true;
  cameraMoved = 0;
  private keys = new Set<string>();
  private mouse = { x: 0, y: 0, inside: false };
  private down: { x: number; y: number } | null = null;
  private midDrag: { x: number; z: number } | null = null;
  private lastClick = { t: 0, def: -1 };
  private lastGroupTap = { t: 0, g: -1 };
  private card: CardButton[] = [];
  private cardCodes = new Map<string, string>();
  private g = { x: 0, z: 0 };
  private scr = { x: 0, y: 0 };
  private off: (() => void)[] = [];

  constructor(private canvas: HTMLCanvasElement, private r: GameRenderer, private host: Host, private audio: AudioEngine) {}

  attach(): void {
    const on = <K extends keyof WindowEventMap>(t: EventTarget, type: K | string, fn: (e: never) => void, opts?: AddEventListenerOptions) => {
      t.addEventListener(type, fn as EventListener, opts);
      this.off.push(() => t.removeEventListener(type, fn as EventListener, opts));
    };
    on(this.canvas, 'mousedown', (e: MouseEvent) => this.onDown(e));
    on(window, 'mousemove', (e: MouseEvent) => this.onMove(e));
    on(window, 'mouseup', (e: MouseEvent) => this.onUp(e));
    on(this.canvas, 'wheel', (e: WheelEvent) => { e.preventDefault(); this.r.rig.zoom(e.deltaY * 0.0011); }, { passive: false });
    on(this.canvas, 'contextmenu', (e: Event) => e.preventDefault());
    on(this.canvas, 'mouseleave', () => { this.mouse.inside = false; });
    on(this.canvas, 'mouseenter', () => { this.mouse.inside = true; });
    on(window, 'keydown', (e: KeyboardEvent) => this.onKey(e));
    on(window, 'keyup', (e: KeyboardEvent) => { this.keys.delete(e.code); });
    on(window, 'blur', () => { this.keys.clear(); this.down = null; this.dragBox = null; this.midDrag = null; });
  }

  detach(): void { for (const f of this.off) f(); this.off.length = 0; }

  private sim(): Sim { return this.host.sim(); }
  private me(): number { return this.host.player(); }

  private pos(e: MouseEvent): { x: number; y: number } {
    const b = this.canvas.getBoundingClientRect();
    return { x: e.clientX - b.left, y: e.clientY - b.top };
  }

  // ------------------------------------------------------------------ selection helpers
  private prune(): void {
    const s = this.sim();
    const before = this.selection.length;
    this.selection = this.selection.filter((e) => s.alive[e] && (s.owner[e] === this.me() || this.r.shown[e]));
    if (this.selection.length !== before) this.dirty = true;
    if (this.activeDef >= 0 && !this.selection.some((e) => s.def[e] === this.activeDef)) this.activeDef = -1;
  }

  setSelection(ids: number[]): void {
    const s = this.sim();
    const me = this.me();
    // own units take priority over structures; foreign entities can only be inspected one at a time
    const own = ids.filter((e) => s.owner[e] === me);
    let next = ids;
    if (own.length > 0) {
      const units = own.filter((e) => s.isUnit(e));
      next = units.length > 0 ? units : own;
    } else if (ids.length > 1) next = [ids[0]];
    this.selection = next.slice(0, 200);
    this.activeDef = -1;
    this.page = 'main';
    this.cancelMode();
    this.dirty = true;
  }

  private ownSelected(): number[] {
    const s = this.sim(), me = this.me();
    return this.selection.filter((e) => s.alive[e] && s.owner[e] === me);
  }

  subgroupDef(): number {
    const s = this.sim();
    const own = this.ownSelected();
    if (own.length === 0) return -1;
    if (this.activeDef >= 0 && own.some((e) => s.def[e] === this.activeDef)) return this.activeDef;
    // default subgroup: prefer the type with the richest command set (workers, casters), else the first
    let best = s.def[own[0]], bestScore = -1;
    for (const e of own) {
      const d = s.d(e);
      const score = (d.ability ? 2 : 0) + (d.worker ? 1 : 0) + (d.weapon ? 0.5 : 0);
      if (score > bestScore) { bestScore = score; best = s.def[e]; }
    }
    return best;
  }

  private pick(sx: number, sy: number): number {
    const s = this.sim();
    const r = this.r;
    const cam = r.rig.camera.position;
    const ppuK = r.height / (2 * Math.tan((45 * Math.PI) / 360));
    let best = -1, bestScore = 1e9;
    for (const e of s.ids) {
      if (!s.alive[e] || !r.shown[e]) continue;
      const d = s.d(e);
      const y = heightAt(s.map, s.x[e], s.z[e]) + (d.hover ? 2 : 0);
      if (!r.worldToScreen(s.x[e], y + Math.min(d.height, 3) * 0.4, s.z[e], this.scr)) continue;
      const dist = Math.sqrt((cam.x - s.x[e]) ** 2 + (cam.y - y) ** 2 + (cam.z - s.z[e]) ** 2);
      const rad = (d.footprint > 0 ? d.footprint * 0.58 : d.radius + 0.35) * (ppuK / dist) + 3;
      const dx = this.scr.x - sx, dy = this.scr.y - sy;
      const dd = Math.sqrt(dx * dx + dy * dy);
      if (dd > rad) continue;
      const score = dd / rad + (d.cls === 'unit' ? 0 : 0.5);
      if (score < bestScore) { bestScore = score; best = e; }
    }
    return best;
  }

  /** last-known enemy structure under the cursor (for attack orders into the fog) */
  private pickGhost(sx: number, sy: number): number {
    const s = this.sim();
    const ps = s.players[this.me()];
    for (const g of ps.ghosts.values()) {
      if (ps.visible[s.visIndex(g.x, g.z)]) continue;
      if (!this.r.worldToScreen(g.x, heightAt(s.map, g.x, g.z) + 1, g.z, this.scr)) continue;
      const dx = this.scr.x - sx, dy = this.scr.y - sy;
      if (dx * dx + dy * dy < 30 * 30) return g.id;
    }
    return -1;
  }

  private onScreenSameType(def: number): number[] {
    const s = this.sim(), me = this.me();
    const out: number[] = [];
    for (const e of s.ids) {
      if (!s.alive[e] || s.owner[e] !== me || s.def[e] !== def) continue;
      if (!this.r.worldToScreen(s.x[e], heightAt(s.map, s.x[e], s.z[e]), s.z[e], this.scr)) continue;
      if (this.scr.x < 0 || this.scr.y < 0 || this.scr.x > this.r.width || this.scr.y > this.r.height) continue;
      out.push(e);
    }
    return out;
  }

  // ------------------------------------------------------------------ pointer
  private onDown(e: MouseEvent): void {
    this.audio.init();
    const p = this.pos(e);
    this.mouse.x = p.x; this.mouse.y = p.y; this.mouse.inside = true;
    if (e.button === 1) {
      e.preventDefault();
      if (this.r.screenToGround(p.x, p.y, this.g)) this.midDrag = { x: this.g.x, z: this.g.z };
      return;
    }
    if (e.button === 2) {
      if (this.mode !== 'normal') { this.cancelMode(); return; }
      if (this.host.interactive()) this.contextCommand(p.x, p.y, e.shiftKey, e.altKey);
      return;
    }
    if (e.button !== 0) return;
    if (this.mode !== 'normal' && this.host.interactive()) { this.modeClick(p.x, p.y, e.shiftKey); return; }
    this.down = p;
  }

  private onMove(e: MouseEvent): void {
    const p = this.pos(e);
    this.mouse.x = p.x; this.mouse.y = p.y;
    if (this.midDrag && this.r.screenToGround(p.x, p.y, this.g)) {
      this.r.rig.drag(this.midDrag.x - this.g.x, this.midDrag.z - this.g.z);
      this.cameraMoved += 1;
    }
    if (this.down) {
      const dx = p.x - this.down.x, dy = p.y - this.down.y;
      if (dx * dx + dy * dy > 25) this.dragBox = { x0: this.down.x, y0: this.down.y, x1: p.x, y1: p.y };
    }
  }

  private onUp(e: MouseEvent): void {
    if (e.button === 1) { this.midDrag = null; return; }
    if (e.button !== 0 || !this.down) return;
    const p = this.pos(e);
    const s = this.sim(), me = this.me();
    if (this.dragBox) {
      const b = this.dragBox;
      const x0 = Math.min(b.x0, b.x1), x1 = Math.max(b.x0, b.x1), y0 = Math.min(b.y0, b.y1), y1 = Math.max(b.y0, b.y1);
      const hits: number[] = [];
      for (const en of s.ids) {
        if (!s.alive[en] || s.owner[en] !== me) continue;
        const d = s.d(en);
        if (!this.r.worldToScreen(s.x[en], heightAt(s.map, s.x[en], s.z[en]) + (d.hover ? 2 : 0) + d.height * 0.3, s.z[en], this.scr)) continue;
        if (this.scr.x >= x0 && this.scr.x <= x1 && this.scr.y >= y0 && this.scr.y <= y1) hits.push(en);
      }
      if (hits.length > 0) {
        if (e.shiftKey) this.setSelection([...new Set([...this.ownSelected(), ...hits])]);
        else this.setSelection(hits);
        this.audio.ui('select');
      } else if (!e.shiftKey) this.setSelection([]);
    } else {
      const hit = this.pick(p.x, p.y);
      const now = performance.now();
      if (hit < 0) { if (!e.shiftKey) this.setSelection([]); }
      else if (s.owner[hit] === me) {
        const dbl = now - this.lastClick.t < 320 && this.lastClick.def === s.def[hit];
        if (e.ctrlKey || dbl) this.setSelection(this.onScreenSameType(s.def[hit]));
        else if (e.shiftKey) {
          const cur = this.ownSelected();
          this.setSelection(cur.includes(hit) ? cur.filter((x) => x !== hit) : [...cur, hit]);
        } else this.setSelection([hit]);
        this.lastClick = { t: now, def: s.def[hit] };
        this.audio.ui('select');
      } else { this.setSelection([hit]); this.audio.ui('click'); }
    }
    this.down = null; this.dragBox = null;
  }

  private units(): number[] {
    const s = this.sim();
    return this.ownSelected().filter((e) => s.isUnit(e));
  }

  private contextCommand(sx: number, sy: number, queue: boolean, alt: boolean): void {
    const s = this.sim(), me = this.me();
    const own = this.ownSelected();
    if (own.length === 0) return;
    const units = own.filter((e) => s.isUnit(e));
    let target = this.pick(sx, sy);
    if (!this.r.screenToGround(sx, sy, this.g)) return;
    const gx = Math.min(MAP_SIZE - 1, Math.max(1, this.g.x)), gz = Math.min(MAP_SIZE - 1, Math.max(1, this.g.z));
    if (units.length === 0) {
      // production structures: right-click sets the rally point
      const prod = own.filter((e) => s.d(e).trains.length > 0);
      if (prod.length > 0) {
        this.host.issue({ k: 'rally', ids: prod, x: target >= 0 ? s.x[target] : gx, z: target >= 0 ? s.z[target] : gz, target: target >= 0 ? target : undefined });
        this.r.orderMarker(target >= 0 ? s.x[target] : gx, target >= 0 ? s.z[target] : gz, C_MOVE);
        this.audio.ui('click');
      }
      return;
    }
    if (target < 0) target = this.pickGhost(sx, sy);
    if (target >= 0 && !alt) {
      const td = s.d(target), to = s.owner[target];
      const tx = s.alive[target] ? s.x[target] : gx, tz = s.alive[target] ? s.z[target] : gz;
      if ((to !== me && to !== NEUTRAL) || td.id === 'barrier') {
        this.host.issue({ k: 'attack', ids: units, target, q: queue });
        this.r.orderMarker(tx, tz, C_ATTACK); this.audio.ui('attack');
        return;
      }
      const workers = units.filter((e) => s.d(e).worker);
      if (td.id === 'ore' || (td.tap && to === me && !(s.flags[target] & FL_CONSTRUCTING))) {
        if (workers.length > 0) {
          this.host.issue({ k: 'gather', ids: workers, target, q: queue });
          const rest = units.filter((e) => !s.d(e).worker);
          if (rest.length > 0) this.host.issue({ k: 'move', ids: rest, x: gx, z: gz, q: queue });
          this.r.orderMarker(tx, tz, C_GATHER); this.audio.ui('move');
          return;
        }
      }
      if (to === me && td.cls === 'structure' && workers.length > 0 && s.players[me].faction === 'helix' && ((s.flags[target] & FL_CONSTRUCTING) || s.hp[target] < td.hp)) {
        this.host.issue({ k: 'repair', ids: workers, target, q: queue });
        this.r.orderMarker(tx, tz, C_BUILD); this.audio.ui('move');
        return;
      }
      if (to === me && td.cls === 'unit' && !units.includes(target)) {
        if (workers.length > 0 && s.players[me].faction === 'helix' && td.tags.includes('Mechanical') && s.hp[target] < td.hp) this.host.issue({ k: 'repair', ids: workers, target, q: queue });
        else this.host.issue({ k: 'follow', ids: units, target, q: queue });
        this.r.orderMarker(tx, tz, C_MOVE); this.audio.ui('move');
        return;
      }
    }
    this.host.issue({ k: 'move', ids: units, x: gx, z: gz, q: queue });
    this.r.orderMarker(gx, gz, C_MOVE); this.audio.ui('move');
  }

  private modeClick(sx: number, sy: number, shift: boolean): void {
    const s = this.sim(), me = this.me();
    if (!this.r.screenToGround(sx, sy, this.g)) return;
    const gx = Math.min(MAP_SIZE - 1, Math.max(1, this.g.x)), gz = Math.min(MAP_SIZE - 1, Math.max(1, this.g.z));
    const units = this.units();
    const target = this.pick(sx, sy);
    switch (this.mode) {
      case 'amove': {
        if (target >= 0 && ((s.owner[target] !== me && s.owner[target] !== NEUTRAL) || s.d(target).id === 'barrier')) this.host.issue({ k: 'attack', ids: units, target, q: shift });
        else this.host.issue({ k: 'amove', ids: units, x: gx, z: gz, q: shift });
        this.r.orderMarker(gx, gz, C_ATTACK); this.audio.ui('attack');
        break;
      }
      case 'patrol': this.host.issue({ k: 'patrol', ids: units, x: gx, z: gz, q: shift }); this.r.orderMarker(gx, gz, C_ATTACK); this.audio.ui('move'); break;
      case 'guard': {
        if (target >= 0 && s.owner[target] === me && s.isUnit(target)) { this.host.issue({ k: 'follow', ids: units, target, q: shift }); this.audio.ui('move'); }
        else { this.host.toast('Guard needs a friendly unit'); this.audio.ui('error'); return; }
        break;
      }
      case 'rally': {
        const prod = this.ownSelected().filter((e) => s.d(e).trains.length > 0);
        this.host.issue({ k: 'rally', ids: prod, x: target >= 0 ? s.x[target] : gx, z: target >= 0 ? s.z[target] : gz, target: target >= 0 ? target : undefined });
        this.r.orderMarker(gx, gz, C_MOVE); this.audio.ui('click');
        break;
      }
      case 'ability': {
        const ab = ABILITY_BY_ID[this.abilityId];
        if (ab.target === 'unit') {
          if (target < 0 || s.owner[target] !== me || s.d(target).cls !== 'structure') { this.host.toast('Target a friendly structure'); this.audio.ui('error'); return; }
          this.host.issue({ k: 'ability', ids: units, ability: ab.id, target, q: shift });
        } else this.host.issue({ k: 'ability', ids: units, ability: ab.id, x: gx, z: gz, q: shift });
        this.r.orderMarker(gx, gz, C_BUILD); this.audio.ui('click');
        break;
      }
      case 'place': {
        const pl = this.placement;
        if (!pl) return;
        const d = s.defs[this.placeDef];
        const ps = s.players[me];
        const reason = s.canPlace(me, this.placeDef, pl.x, pl.z);
        if (reason !== PLACE_OK) { this.host.toast(PLACE_REASONS[reason]); this.audio.ui('error'); return; }
        if (ps.ore < d.ore || ps.flux < d.flux) { this.host.toast(ps.ore < d.ore ? 'Not enough Prism Ore' : 'Not enough Flux'); this.audio.ui('error'); return; }
        this.host.issue({ k: 'build', ids: units, def: d.id, x: pl.x, z: pl.z, q: shift });
        this.audio.ui('click');
        if (shift) return;
        break;
      }
    }
    if (!shift) this.cancelMode();
  }

  cancelMode(): void {
    if (this.mode !== 'normal' || this.page !== 'main') this.dirty = true;
    this.mode = 'normal'; this.placeDef = -1; this.abilityId = ''; this.placement = null; this.page = 'main';
  }

  // ------------------------------------------------------------------ keyboard
  private onKey(e: KeyboardEvent): void {
    const tgt = e.target as HTMLElement | null;
    if (tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'SELECT' || tgt.tagName === 'TEXTAREA')) return;
    const keys = this.host.settings().keys;
    const code = e.code;
    if (code === keys.menu || code === 'Escape') {
      e.preventDefault();
      if (code === 'Escape' && (this.mode !== 'normal' || this.page !== 'main')) { this.cancelMode(); return; }
      this.host.openMenu();
      return;
    }
    if (code === keys.perf) { this.host.togglePerf(); return; }
    if (e.repeat && !code.startsWith('Arrow')) { if (['Tab', 'Space'].includes(code)) e.preventDefault(); return; }
    this.keys.add(code);
    if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home'].includes(code)) e.preventDefault();
    const s = this.sim(), me = this.me();
    // control groups
    if (code.startsWith('Digit')) {
      const gi = Number(code.slice(5));
      if (e.ctrlKey || e.altKey) {
        e.preventDefault();
        this.groups[gi] = this.ownSelected().slice();
        this.host.toast(`Group ${gi} set (${this.groups[gi].length})`);
        this.dirty = true;
      } else if (e.shiftKey) {
        this.groups[gi] = [...new Set([...this.groups[gi], ...this.ownSelected()])];
        this.dirty = true;
      } else {
        const g = this.groups[gi].filter((x) => s.alive[x] && s.owner[x] === me);
        this.groups[gi] = g;
        if (g.length > 0) {
          const now = performance.now();
          if (this.lastGroupTap.g === gi && now - this.lastGroupTap.t < 380) this.focusOn(g);
          this.lastGroupTap = { t: now, g: gi };
          this.selection = g.slice(); this.activeDef = -1; this.cancelMode(); this.dirty = true;
          this.audio.ui('select');
        }
      }
      return;
    }
    if (e.ctrlKey || e.metaKey) return;
    // contextual command card hotkeys take priority over camera keys
    if (this.host.interactive()) {
      // the card may be stale if the selection or page changed since the last HUD refresh
      if (this.dirty) this.buildCard();
      const id = this.cardCodes.get(code);
      if (id) { e.preventDefault(); this.activate(id); return; }
    }
    if (code === keys.focus) { const own = this.selection.filter((x) => s.alive[x]); if (own.length) this.focusOn(own); return; }
    if (code === keys.jumpAlert) { if (this.lastAlert) this.r.rig.jump(this.lastAlert.x, this.lastAlert.z); return; }
    if (code === keys.jumpBase) { const st = s.map.starts[me]; this.r.rig.jump(st.x, st.z); return; }
    if (code === keys.cycle) {
      const defs = [...new Set(this.ownSelected().map((x) => s.def[x]))];
      if (defs.length > 1) {
        const cur = defs.indexOf(this.subgroupDef());
        this.activeDef = defs[(cur + (e.shiftKey ? defs.length - 1 : 1)) % defs.length];
        this.page = 'main'; this.dirty = true;
      }
      return;
    }
    if (code === keys.idleWorker) {
      const idle = s.ids.filter((x) => s.alive[x] && s.owner[x] === me && s.d(x).worker && s.orders[x].length === 0);
      if (idle.length > 0) {
        const cur = idle.indexOf(this.selection[0]);
        const next = idle[(cur + 1) % idle.length];
        this.setSelection([next]); this.focusOn([next]);
      }
    }
  }

  private focusOn(ids: number[]): void {
    const s = this.sim();
    let x = 0, z = 0;
    for (const e of ids) { x += s.x[e]; z += s.z[e]; }
    this.r.rig.jump(x / ids.length, z / ids.length);
  }

  // ------------------------------------------------------------------ per-frame update (camera + previews)
  update(dt: number): void {
    const st = this.host.settings();
    const k = this.keys;
    const keys = st.keys;
    let dx = 0, dz = 0;
    if (k.has(keys.panLeft)) dx -= 1;
    if (k.has(keys.panRight)) dx += 1;
    if (k.has(keys.panUp)) dz -= 1;
    if (k.has(keys.panDown)) dz += 1;
    // WASD pans only while nothing is selected (with a selection those keys are unit commands)
    if (this.ownSelected().length === 0 || !this.host.interactive()) {
      if (k.has('KeyA')) dx -= 1;
      if (k.has('KeyD')) dx += 1;
      if (k.has('KeyW')) dz -= 1;
      if (k.has('KeyS')) dz += 1;
    }
    if (st.edgeScroll && this.mouse.inside && !this.down) {
      const m = 10;
      if (this.mouse.x < m) dx -= 1; else if (this.mouse.x > this.r.width - m) dx += 1;
      if (this.mouse.y < m) dz -= 1; else if (this.mouse.y > this.r.height - m) dz += 1;
    }
    if (dx !== 0 || dz !== 0) {
      const l = Math.sqrt(dx * dx + dz * dz);
      this.r.rig.pan(dx / l, dz / l, dt * st.panSpeed, k.has('ShiftLeft') || k.has('ShiftRight'));
      this.cameraMoved += dt * 60;
    }
    this.prune();
    const s = this.sim(), me = this.me();
    // hover + previews
    this.hover = this.mouse.inside && !this.dragBox ? this.pick(this.mouse.x, this.mouse.y) : -1;
    this.ranges.length = 0;
    this.placement = null;
    if (this.mode === 'place' && this.r.screenToGround(this.mouse.x, this.mouse.y, this.g)) {
      const d = s.defs[this.placeDef];
      let x = Math.round(this.g.x), z = Math.round(this.g.z);
      if (d.tap) {
        // snap to the nearest vent
        let best = -1, bd = 36;
        for (const e of s.ids) {
          if (!s.alive[e] || s.d(e).id !== 'vent') continue;
          const dd = (s.x[e] - this.g.x) ** 2 + (s.z[e] - this.g.z) ** 2;
          if (dd < bd) { bd = dd; best = e; }
        }
        if (best >= 0) { x = s.x[best]; z = s.z[best]; }
      }
      x = Math.min(MAP_SIZE - 4, Math.max(4, x)); z = Math.min(MAP_SIZE - 4, Math.max(4, z));
      this.placement = { def: this.placeDef, x, z, ok: s.canPlace(me, this.placeDef, x, z) === PLACE_OK };
      if (d.weapon) this.ranges.push({ x, z, r: d.weapon.range + d.radius, color: 0xffb24a });
      if (d.zone > 0) this.ranges.push({ x, z, r: d.zone, color: 0x9fd8ff });
    } else if (this.mode === 'ability') {
      const ab = ABILITY_BY_ID[this.abilityId];
      const casters = this.units().filter((e) => s.d(e).ability === ab.id);
      if (casters.length > 0 && ab.range > 0) this.ranges.push({ x: s.x[casters[0]], z: s.z[casters[0]], r: ab.range, color: 0xffd27a });
      if (ab.radius > 0 && this.r.screenToGround(this.mouse.x, this.mouse.y, this.g)) this.ranges.push({ x: this.g.x, z: this.g.z, r: ab.radius, color: 0x8cffb4 });
    } else if (this.hover >= 0 && s.owner[this.hover] !== NEUTRAL) {
      const d = s.d(this.hover);
      if (d.weapon && d.cls === 'structure') this.ranges.push({ x: s.x[this.hover], z: s.z[this.hover], r: d.weapon.range + d.radius, color: s.owner[this.hover] === me ? 0xffb24a : 0xff5a4a });
    }
    this.canvas.style.cursor = this.mode === 'normal' ? 'default' : 'crosshair';
  }

  // ------------------------------------------------------------------ command card
  buildCard(): CardButton[] {
    const s = this.sim(), me = this.me();
    const keys = this.host.settings().keys;
    const card: CardButton[] = [];
    this.cardCodes.clear();
    const add = (b: Omit<CardButton, 'key'>, code: string) => {
      card.push({ ...b, key: keyName(code) });
      if (!b.disabled || b.id.startsWith('train') || b.id.startsWith('place') || b.id.startsWith('research')) this.cardCodes.set(code, b.id);
    };
    if (!this.host.interactive()) { this.card = card; return card; }
    const own = this.ownSelected();
    const di = this.subgroupDef();
    if (di < 0) { this.card = card; return card; }
    const d = s.defs[di];
    const ps = s.players[me];
    const slotKeys = [keys.slot1, keys.slot2, keys.slot3, keys.slot4, keys.slot5, keys.slot6];
    if (d.cls === 'unit') {
      if (this.page === 'build' && d.worker) {
        const f = FACTIONS[ps.faction];
        [f.supply, f.production, f.tap, f.tech, f.defense, f.hq].forEach((id, i) => {
          const bd = s.defs[DEF_INDEX[id]];
          const miss = s.missingPrereq(me, bd);
          add({ id: 'place:' + id, slot: i, label: bd.name, icon: id, ore: bd.ore, flux: bd.flux, time: bd.buildTime, disabled: !!miss, reason: miss ? `Requires ${miss}` : '', active: this.mode === 'place' && this.placeDef === DEF_INDEX[id], tip: defTip(bd) }, slotKeys[i]);
        });
        add({ id: 'back', slot: 11, label: 'Back', icon: '', glyph: 'back', tip: ['Return to unit commands.'] }, 'Escape');
        this.card = card;
        return card;
      }
      const armed = own.some((e) => s.isUnit(e) && !!s.d(e).weapon);
      if (armed) add({ id: 'cmd:amove', slot: 0, label: 'Attack-move', icon: '', glyph: 'attack', active: this.mode === 'amove', tip: ['Move to a point, engaging enemies on the way. Click an enemy to focus it.'] }, keys.attackMove);
      add({ id: 'cmd:stop', slot: 1, label: 'Stop', icon: '', glyph: 'stop', tip: ['Cancel all orders.'] }, keys.stop);
      add({ id: 'cmd:hold', slot: 2, label: 'Hold position', icon: '', glyph: 'hold', tip: ['Stand still and only attack enemies in range.'] }, keys.hold);
      if (armed) add({ id: 'cmd:patrol', slot: 3, label: 'Patrol', icon: '', glyph: 'patrol', active: this.mode === 'patrol', tip: ['Attack-move back and forth between here and a point.'] }, keys.patrol);
      add({ id: 'cmd:guard', slot: 4, label: 'Guard', icon: '', glyph: 'guard', active: this.mode === 'guard', tip: ['Follow a friendly unit and defend it.'] }, keys.guard);
      if (d.ability) {
        const ab = ABILITY_BY_ID[d.ability];
        const casters = own.filter((e) => s.def[e] === di);
        const bit = ab.id === 'brace' ? FL_BRACED : FL_CURLED;
        const on = ab.toggle && casters.every((e) => s.flags[e] & bit);
        let cd = 0;
        if (!ab.toggle) cd = Math.min(...casters.map((e) => Math.max(0, s.abilityReady[e] - s.tick))) / (ab.cooldown * 20);
        const tip = [ab.desc];
        if (ab.flux) tip.push(`Costs ${ab.flux} Flux`);
        if (ab.cooldown > 1) tip.push(`Cooldown ${ab.cooldown}s`);
        add({ id: 'ab:' + ab.id, slot: 5, label: ab.name, icon: '', glyph: ab.id, active: !!on || (this.mode === 'ability' && this.abilityId === ab.id), cooldown: cd, flux: ab.flux || undefined, tip }, slotKeys[0]);
      }
      if (d.worker) add({ id: 'cmd:build', slot: 8, label: 'Build', icon: '', glyph: 'build', tip: ['Open the construction palette.'] }, keys.build);
    } else if (d.cls === 'structure') {
      const src = own.find((e) => s.def[e] === di) as number;
      if (s.flags[src] & FL_CONSTRUCTING) {
        add({ id: 'cmd:cancelBuild', slot: 11, label: 'Cancel construction', icon: '', glyph: 'cancel', tip: ['Abort and recover 75% of the cost.'] }, keys.cancel);
        this.card = card;
        return card;
      }
      let slot = 0;
      for (const uid of d.trains) {
        const ud = s.defs[DEF_INDEX[uid]];
        const miss = s.missingPrereq(me, ud);
        let queued = 0;
        for (const e of own) if (s.def[e] === di) for (const q of s.queue[e]) if (q.kind === 'unit' && q.def === DEF_INDEX[uid]) queued++;
        add({ id: 'train:' + uid, slot, label: ud.name, icon: uid, ore: ud.ore, flux: ud.flux, supply: ud.supply, time: ud.buildTime, disabled: !!miss, reason: miss ? `Requires ${miss}` : '', count: queued || undefined, tip: defTip(ud) }, slotKeys[slot]);
        slot++;
      }
      if (d.researches.length > 0) {
        // show the next step of each upgrade line
        const lines: string[][] = [['atk1', 'atk2', 'atk3'], ['arm1', 'arm2', 'arm3'], ['t2']];
        for (const line of lines) {
          const next = line.map((k) => `${ps.faction}_${k}`).find((id) => ps.tech[TECH_INDEX[id]] !== 2);
          if (!next) continue;
          const ti = TECH_INDEX[next];
          const td = TECH_DEFS[ti];
          const busy = ps.tech[ti] === 1;
          const miss = s.missingTechPrereq(me, ti);
          add({ id: 'research:' + next, slot, label: td.name, icon: '', glyph: td.kind, ore: td.ore, flux: td.flux, time: td.time, disabled: busy || !!miss, reason: busy ? 'Research in progress' : miss ? `Requires ${miss}` : '', active: busy, tip: techTip(td) }, slotKeys[slot]);
          slot++;
        }
      }
      if (d.trains.length > 0) add({ id: 'cmd:rally', slot: 8, label: 'Set rally point', icon: '', glyph: 'rally', active: this.mode === 'rally', tip: ['New units move here. Right-click also sets it. Rally workers onto ore to auto-harvest.'] }, keys.rally);
      if (own.some((e) => s.def[e] === di && s.queue[e].length > 0)) add({ id: 'cmd:cancel', slot: 11, label: 'Cancel last', icon: '', glyph: 'cancel', tip: ['Remove the last queued item for a full refund.'] }, keys.cancel);
    }
    this.card = card;
    return card;
  }

  activate(id: string): void {
    if (!this.host.interactive()) return;
    const s = this.sim(), me = this.me();
    const b = this.card.find((c) => c.id === id);
    if (b?.disabled) { this.host.toast(b.reason || 'Unavailable'); this.audio.ui('error'); return; }
    const own = this.ownSelected();
    const units = this.units();
    const di = this.subgroupDef();
    this.dirty = true;
    const [kind, arg] = id.split(':');
    if (id === 'back') { this.cancelMode(); return; }
    if (kind === 'cmd') {
      switch (arg) {
        case 'amove': this.mode = 'amove'; break;
        case 'patrol': this.mode = 'patrol'; break;
        case 'guard': this.mode = 'guard'; break;
        case 'rally': this.mode = 'rally'; break;
        case 'stop': this.host.issue({ k: 'stop', ids: units }); this.cancelMode(); break;
        case 'hold': this.host.issue({ k: 'hold', ids: units }); this.cancelMode(); break;
        case 'build': this.page = 'build'; this.mode = 'normal'; break;
        case 'cancel': {
          // cancel from the structure with the longest queue
          let best = -1, bl = 0;
          for (const e of own) if (s.def[e] === di && s.queue[e].length > bl) { bl = s.queue[e].length; best = e; }
          if (best >= 0) this.host.issue({ k: 'cancel', id: best, index: -1 });
          break;
        }
        case 'cancelBuild': for (const e of own) if (s.flags[e] & FL_CONSTRUCTING) this.host.issue({ k: 'cancelBuild', id: e }); break;
      }
      this.audio.ui('click');
      return;
    }
    if (kind === 'ab') {
      const ab = ABILITY_BY_ID[arg];
      if (ab.toggle) { this.host.issue({ k: 'ability', ids: units, ability: ab.id }); this.audio.ui('click'); }
      else { this.mode = 'ability'; this.abilityId = ab.id; this.audio.ui('click'); }
      return;
    }
    if (kind === 'place') { this.mode = 'place'; this.placeDef = DEF_INDEX[arg]; this.audio.ui('click'); return; }
    if (kind === 'train') {
      const ud = s.defs[DEF_INDEX[arg]];
      const ps = s.players[me];
      if (ps.ore < ud.ore || ps.flux < ud.flux) { this.host.toast(ps.ore < ud.ore ? 'Not enough Prism Ore' : 'Not enough Flux'); this.audio.ui('error'); return; }
      // shortest queue first so multiple structures share the work
      let best = -1, bl = 99;
      for (const e of own) if (s.def[e] === di && !(s.flags[e] & FL_CONSTRUCTING) && s.queue[e].length < bl) { bl = s.queue[e].length; best = e; }
      if (best < 0 || bl >= MAX_QUEUE) { this.host.toast('Queue is full'); this.audio.ui('error'); return; }
      this.host.issue({ k: 'train', id: best, def: arg });
      this.audio.ui('click');
      return;
    }
    if (kind === 'research') {
      const td = TECH_DEFS[TECH_INDEX[arg]];
      const ps = s.players[me];
      if (ps.ore < td.ore || ps.flux < td.flux) { this.host.toast(ps.ore < td.ore ? 'Not enough Prism Ore' : 'Not enough Flux'); this.audio.ui('error'); return; }
      const src = own.find((e) => s.def[e] === di);
      if (src !== undefined) this.host.issue({ k: 'research', id: src, tech: arg });
      this.audio.ui('click');
    }
  }

  modeHint(): string {
    switch (this.mode) {
      case 'amove': return 'Attack-move: left-click a destination or an enemy';
      case 'patrol': return 'Patrol: left-click a point';
      case 'guard': return 'Guard: left-click a friendly unit';
      case 'rally': return 'Rally: left-click a point or a resource';
      case 'ability': return `${ABILITY_BY_ID[this.abilityId].name}: left-click a target`;
      case 'place': return `Place ${this.sim().defs[this.placeDef].name}: left-click to confirm, right-click to cancel (Shift to place several)`;
    }
    return this.page === 'build' ? 'Choose a structure to place' : '';
  }

  /** Orders issued through the minimap. */
  minimapCommand(x: number, z: number, shift: boolean): void {
    if (!this.host.interactive()) return;
    const units = this.units();
    if (units.length === 0) return;
    if (this.mode === 'amove') { this.host.issue({ k: 'amove', ids: units, x, z, q: shift }); this.cancelMode(); this.audio.ui('attack'); }
    else { this.host.issue({ k: 'move', ids: units, x, z, q: shift }); this.audio.ui('move'); }
    this.r.orderMarker(x, z, this.mode === 'amove' ? C_ATTACK : C_MOVE);
  }
}
