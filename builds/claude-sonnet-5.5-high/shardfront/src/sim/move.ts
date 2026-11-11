// navigation consumer: steering, static collision, stuck recovery.
import { TD } from './ext';
import type { Sim } from './sim';

const tmp = { x: 0, y: 0 };

export function angDiff(a: number, b: number): number {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function unitSpeed(sim: Sim, id: number): number {
  const td = TD[sim.type[id]];
  const e = sim.ext[id];
  let s = td.speed;
  if (sim.tick < e.slowUntil) s *= e.slowF;
  if (td.def.id === 'thornling' && e.target >= 0 && sim.alive[e.target] && sim.hp[e.target] < TD[sim.type[e.target]].maxHp) s *= 1.25;
  if (e.mode > 0 && (td.def.id === 'bulwark' || td.def.id === 'carapace_guard')) s = 0;
  return s;
}

export function turnTo(sim: Sim, id: number, ang: number, rate: number) {
  const d = angDiff(sim.face[id], ang);
  const step = Math.max(-rate, Math.min(rate, d));
  sim.face[id] += step;
  sim.ext[id].turn = step;
  if (sim.face[id] > Math.PI) sim.face[id] -= Math.PI * 2;
  if (sim.face[id] < -Math.PI) sim.face[id] += Math.PI * 2;
}

export function tryMove(sim: Sim, id: number, nx: number, ny: number): boolean {
  const td = TD[sim.type[id]];
  const N = sim.map.size;
  if (td.isHover) {
    sim.x[id] = Math.min(N - 2.5, Math.max(2.5, nx));
    sim.y[id] = Math.min(N - 2.5, Math.max(2.5, ny));
    return true;
  }
  const r = Math.min(td.def.radius, 0.4);
  const x = sim.x[id], y = sim.y[id];
  if (sim.nav.fits(nx, ny, r)) { sim.x[id] = nx; sim.y[id] = ny; return true; }
  if (nx !== x && sim.nav.fits(nx, y, r)) { sim.x[id] = nx; return true; }
  if (ny !== y && sim.nav.fits(x, ny, r)) { sim.y[id] = ny; return true; }
  return false;
}

/** If a unit ended up inside a blocked cell (e.g. a structure was placed on it) move it to the nearest free spot. */
export function nudgeOut(sim: Sim, id: number) {
  const td = TD[sim.type[id]];
  if (td.isHover) return;
  if (sim.nav.fits(sim.x[id], sim.y[id], 0.2)) return;
  const w = sim.nav.nearestWalkable(sim.x[id], sim.y[id], 14);
  if (w) { sim.x[id] = w.x; sim.y[id] = w.y; sim.px[id] = w.x; sim.py[id] = w.y; }
}

/**
 * Move one step towards (tx,ty). Returns 0 while travelling, 1 on arrival, 2 on unrecoverable failure.
 * `key`/`goals` identify a shared flow field (group corridor); direct line of sight skips the field.
 */
export function moveTo(sim: Sim, id: number, tx: number, ty: number, arriveR: number, key: number, goals: () => number[]): number {
  const e = sim.ext[id];
  const td = TD[sim.type[id]];
  const x = sim.x[id], y = sim.y[id];
  const dx = tx - x, dy = ty - y;
  const d = Math.hypot(dx, dy);
  if (d <= arriveR) { e.moving = false; return 1; }
  if (e.gkey !== key) { e.gkey = key; e.stuck = 0; e.lastD = 1e9; e.chk = 0; e.losAge = 99; }
  let ux = dx / d, uy = dy / d;
  if (!td.isHover) {
    if (e.losAge++ >= 5) { e.los = sim.nav.clear(x, y, tx, ty, 0.35); e.losAge = (id & 3); }
    if (!e.los) {
      const f = sim.nav.getField(key, goals);
      if (f && sim.nav.dir(f, x, y, tmp)) { ux = tmp.x; uy = tmp.y; e.dirx = ux; e.diry = uy; }
      else if (e.dirx || e.diry) { ux = e.dirx; uy = e.diry; }
    }
  }
  const spd = unitSpeed(sim, id);
  if (spd <= 0) { e.moving = false; return 0; }
  const want = Math.atan2(uy, ux);
  const turnRate = td.def.speed > 5 ? 0.6 : 0.4;
  const diff = Math.abs(angDiff(sim.face[id], want));
  turnTo(sim, id, want, turnRate);
  const eff = diff > 1.3 ? spd * 0.3 : spd;
  const step = Math.min(eff, e.los || td.isHover ? Math.max(0, d - 0.001) : eff);
  const before = sim.x[id] * 1000 + sim.y[id];
  tryMove(sim, id, x + ux * step, y + uy * step);
  e.moving = true;
  e.deploy = 0;
  void before;
  // stuck detection
  if (++e.chk >= 20) {
    e.chk = 0;
    if (e.lastD - d < 0.5) e.stuck += 20; else e.stuck = 0;
    e.lastD = d;
    if (e.stuck >= 40 && d <= arriveR + 3.6) { e.stuck = 0; return 1; }
    if (e.stuck === 60) { sim.nav.invalidate(key); e.losAge = 99; }
    if (e.stuck >= 160) { e.stuck = 0; e.failTick = sim.tick; return 2; }
  }
  return 0;
}

export function goalCellFor(sim: Sim, x: number, y: number): number {
  const w = sim.nav.nearestWalkable(x, y, 10);
  return sim.cellIdx(w ? w.x : x, w ? w.y : y);
}
