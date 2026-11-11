// Unit locomotion: flow-field following with string pulling, local separation (circle
// avoidance), static collision with sliding, deterministic stuck detection and recovery.
import type { Sim } from './sim';
import { Kind } from './types';

const tmp = { x: 0, y: 0 };

/** Request movement toward (x,y). Returns true once within `range` (or the group arrived nearby). */
export function moveTo(sim: Sim, id: number, x: number, y: number, range: number, key?: string, seeds?: () => number[]): boolean {
  const e = sim.ext[id];
  const d = Math.hypot(x - sim.x[id], y - sim.y[id]);
  if (d <= range) { e.hasGoal = false; return true; }
  if (e.nearArrive) { e.nearArrive = false; e.hasGoal = false; return true; }
  const n = sim.map.size;
  const k = key ?? 'c' + (Math.floor(y) * n + Math.floor(x));
  if (!e.hasGoal || e.fieldKey !== k) {
    e.fieldKey = k;
    e.seedFn = seeds ?? (() => [sim.nav.nearestPassable(Math.floor(x), Math.floor(y), 24)]);
    e.bestDist = 1e9; e.stuckTicks = 0; e.direct = false;
  }
  e.hasGoal = true; e.goalX = x; e.goalY = y; e.goalRange = range;
  return false;
}

/** Ring of passable cells around an entity footprint — seeds for "go next to this" fields. */
export function ringSeeds(sim: Sim, cells: number[]): number[] {
  const n = sim.map.size;
  const set = new Set(cells);
  const out: number[] = [];
  for (const c of cells) {
    const x = c % n, y = (c / n) | 0;
    for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
      const xx = x + ox, yy = y + oy;
      const j = yy * n + xx;
      if (!set.has(j) && sim.nav.passable(xx, yy)) { set.add(j); out.push(j); }
    }
  }
  return out;
}

export function moveToEntity(sim: Sim, id: number, target: number, range: number): boolean {
  const e = sim.ext[target];
  const k = sim.kind[target];
  if (e.cells.length && (k === Kind.Structure || k === Kind.Ore || k === Kind.Vent || k === Kind.Barrier || k === Kind.Pylon)) {
    const d = sim.edgeDist(id, target);
    if (d <= range) { sim.ext[id].hasGoal = false; return true; }
    return moveTo(sim, id, sim.x[target], sim.y[target], -1, 'e' + target, () => ringSeeds(sim, e.cells));
  }
  // mobile target: coarse goal key so chasing units share and reuse fields
  const d = sim.edgeDist(id, target);
  if (d <= range) { sim.ext[id].hasGoal = false; return true; }
  const n = sim.map.size;
  const cx = Math.floor(sim.x[target] / 3), cy = Math.floor(sim.y[target] / 3);
  moveTo(sim, id, sim.x[target], sim.y[target], range, 'm' + (cy * n + cx));
  return false;
}

function unitSpeed(sim: Sim, id: number): number {
  const d = sim.udef(id);
  const e = sim.ext[id];
  let s = d.speed / 20;
  if (e.slowUntil > sim.tick) s *= 1 - e.slowAmount;
  if (e.speedBoostUntil > sim.tick) s *= 1.35;
  if (e.braced || e.curled || e.toggleTicks > 0) s = 0;
  const w = d.weapon;
  if (w?.setupTicks && e.setup > 0) s = 0; // deployed mortar must pack (handled by resetting setup)
  return s;
}

function immovable(sim: Sim, id: number): boolean {
  const e = sim.ext[id];
  if (e.braced || e.curled) return true;
  const o = e.orders[0];
  if (o && o.t === 'hold') return true;
  if (e.phase === 'mining' || e.phase === 'constructing' || e.phase === 'planting') return true;
  if (e.setup > 0) return true;
  return false;
}

function ghostWorker(sim: Sim, id: number): boolean {
  const e = sim.ext[id];
  return e.phase === 'toNode' || e.phase === 'toDrop' || e.phase === 'mining' || e.phase === 'waiting';
}

export function updateMovement(sim: Sim) {
  const n = sim.map.size;
  const lo = 2.2, hi = n - 2.2;
  for (let id = 1; id < sim.nextId; id++) {
    if (!sim.alive[id] || sim.kind[id] !== Kind.Unit) continue;
    const e = sim.ext[id];
    sim.moving[id] = 0;
    if (!e.hasGoal) { e.vx = 0; e.vy = 0; continue; }
    const hover = sim.isHover(id);
    const x = sim.x[id], y = sim.y[id];
    let gx = e.goalX, gy = e.goalY;
    const dist = Math.hypot(gx - x, gy - y);
    if (e.goalRange >= 0 && dist <= e.goalRange) { e.hasGoal = false; continue; }
    const speed = unitSpeed(sim, id);
    if (speed <= 0) {
      // a deployed mortar packs up before moving
      if (e.setup > 0 && !e.braced && !e.curled) e.setup = Math.max(0, e.setup - 2);
      continue;
    }
    let tx = gx, ty = gy;
    let pathMetric = -1; // flow-field path distance when following a field
    if (!hover) {
      if (dist < 2) e.direct = sim.nav.lineClear(x, y, gx, gy);
      else if ((sim.tick + id) % 6 === 0) e.direct = sim.nav.lineClear(x, y, gx, gy);
      if (!e.direct) {
        const field = sim.nav.field(e.fieldKey, e.seedFn ?? (() => [sim.nav.nearestPassable(Math.floor(gx), Math.floor(gy))]));
        if (field && sim.nav.steer(field, x, y, tmp)) {
          const c = Math.floor(y) * n + Math.floor(x);
          if (field[c] === 0 && e.goalRange < 0) { e.nearArrive = true; e.hasGoal = false; continue; }
          tx = tmp.x; ty = tmp.y;
          if (Number.isFinite(field[c])) pathMetric = field[c];
        } else {
          // unreachable goal: fail fast so orders can fall back
          e.pathFailed = true; e.hasGoal = false;
          continue;
        }
      }
    }
    let dx = tx - x, dy = ty - y;
    const l = Math.hypot(dx, dy) || 1;
    dx /= l; dy /= l;
    if (e.sidestep > 0) {
      e.sidestep--;
      const s = id & 1 ? 1 : -1;
      const sx = -dy * s, sy = dx * s;
      dx = dx * 0.4 + sx * 0.9; dy = dy * 0.4 + sy * 0.9;
      const l2 = Math.hypot(dx, dy) || 1; dx /= l2; dy /= l2;
    }
    const step = Math.min(speed, Math.max(dist, 0.02));
    e.vx = dx * step; e.vy = dy * step;
    let nx = x + e.vx, ny = y + e.vy;
    if (hover) {
      nx = Math.max(lo, Math.min(hi, nx)); ny = Math.max(lo, Math.min(hi, ny));
    } else if (!sim.nav.passableW(x, y)) {
      // inside a blocked cell (e.g. a structure was placed on top): walk out to the nearest free cell
      const c = sim.nav.nearestPassable(Math.floor(x), Math.floor(y), 6);
      if (c >= 0) { const ex = (c % n) + 0.5 - x, ey = ((c / n) | 0) + 0.5 - y, el = Math.hypot(ex, ey) || 1; nx = x + (ex / el) * speed; ny = y + (ey / el) * speed; }
    } else if (!sim.nav.passableW(nx, ny)) {
      if (sim.nav.passableW(nx, y)) ny = y;
      else if (sim.nav.passableW(x, ny)) nx = x;
      else {
        // wedged against a corner: ease toward the centre of the current cell, then re-steer
        nx = x + (Math.floor(x) + 0.5 - x) * 0.35; ny = y + (Math.floor(y) + 0.5 - y) * 0.35;
        e.direct = false;
      }
    }
    if (nx !== x || ny !== y) sim.moving[id] = 1;
    sim.x[id] = nx; sim.y[id] = ny;
    // facing eases toward velocity (turn rate)
    const tf = 0.35;
    let fx = sim.fx[id] + (dx - sim.fx[id]) * tf, fy = sim.fy[id] + (dy - sim.fy[id]) * tf;
    const fl = Math.hypot(fx, fy) || 1; fx /= fl; fy /= fl;
    sim.fx[id] = fx; sim.fy[id] = fy;
    e.setup = 0;
    // progress / stuck tracking
    const nd = Math.hypot(gx - nx, gy - ny);
    // progress is measured along the path (field distance) so legitimate detours never count as stuck
    const metric = pathMetric >= 0 ? pathMetric + 1000 : nd;
    if ((pathMetric >= 0) !== (e.bestDist >= 1000)) e.bestDist = 1e9;
    if (metric < e.bestDist - 0.08) { e.bestDist = metric; e.stuckTicks = 0; }
    else e.stuckTicks++;
    const spread = sim.groupSpread.get(e.groupId) ?? 1;
    if (e.stuckTicks > 14 && nd < spread + 1.2) { e.nearArrive = true; e.hasGoal = false; }
    else if (e.stuckTicks > 40) {
      e.stuckTicks = 0; e.bestDist = 1e9; e.repaths++; e.sidestep = 12; e.direct = false;
      if (e.repaths > 3) { e.pathFailed = true; e.hasGoal = false; e.repaths = 0; }
    }
    gx = gy = 0;
  }
  separate(sim);
  sim.quantizePositions();
}

function separate(sim: Sim) {
  for (let id = 1; id < sim.nextId; id++) {
    if (!sim.alive[id] || sim.kind[id] !== Kind.Unit) continue;
    const ri = sim.radius[id];
    const hi = sim.isHover(id);
    const gi = ghostWorker(sim, id);
    sim.spatial.query(sim.x[id], sim.y[id], ri + 1.2, (j) => {
      if (j <= id || !sim.alive[j] || sim.kind[j] !== Kind.Unit) return;
      if (sim.isHover(j) !== hi) return; // hover layer separates only with itself
      if (gi && ghostWorker(sim, j)) return; // harvesting workers pass through each other
      const rj = sim.radius[j];
      let dx = sim.x[j] - sim.x[id], dy = sim.y[j] - sim.y[id];
      let d = Math.hypot(dx, dy);
      const min = (ri + rj) * 0.92;
      if (d >= min) return;
      if (d < 1e-4) { // deterministic tie-break for exact overlap
        dx = ((id * 7 + j * 13) % 11) / 11 - 0.5; dy = ((id * 5 + j * 3) % 7) / 7 - 0.5; d = Math.hypot(dx, dy) || 1;
      }
      const overlap = min - d;
      const ux = dx / d, uy = dy / d;
      const im = immovable(sim, id), jm = immovable(sim, j);
      let wi = 0.5, wj = 0.5;
      const mi = sim.ext[id].hasGoal, mj = sim.ext[j].hasGoal;
      if (im && jm) return;
      if (im) { wi = 0; wj = 1; } else if (jm) { wi = 1; wj = 0; }
      else if (mi && !mj) { wi = 0.25; wj = 0.75; } else if (mj && !mi) { wi = 0.75; wj = 0.25; }
      const push = Math.min(overlap, 0.12);
      const ax = sim.x[id] - ux * push * wi, ay = sim.y[id] - uy * push * wi;
      const bx = sim.x[j] + ux * push * wj, by = sim.y[j] + uy * push * wj;
      if (hi || sim.nav.passableW(ax, ay)) { sim.x[id] = ax; sim.y[id] = ay; }
      if (hi || sim.nav.passableW(bx, by)) { sim.x[j] = bx; sim.y[j] = by; }
    });
  }
}
