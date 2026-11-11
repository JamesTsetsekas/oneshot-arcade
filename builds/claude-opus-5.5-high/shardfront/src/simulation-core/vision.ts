// Fog of war. Per-player visible/explored grids with discrete high-ground and brush rules.
import { F_BRUSH } from '../world/map';
import type { Sim } from './sim';
import { Kind } from './types';
import { STRUCTURES } from '../faction-data';

const circleCache = new Map<number, Int16Array>();
/** offsets (dx,dy,distSq*4 packed) inside an integer-ish radius */
function circle(r: number): Int16Array {
  const key = Math.round(r * 2);
  let c = circleCache.get(key);
  if (c) return c;
  const rr = key / 2;
  const out: number[] = [];
  const R = Math.ceil(rr);
  for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
    const d2 = dx * dx + dy * dy;
    if (d2 <= rr * rr) out.push(dx, dy, Math.min(32000, d2));
  }
  c = new Int16Array(out);
  circleCache.set(key, c);
  return c;
}

export function stampVision(sim: Sim, vis: Uint8Array, explored: Uint8Array, x: number, y: number, sight: number, hover: boolean) {
  const n = sim.map.size;
  const cx = Math.floor(x), cy = Math.floor(y);
  if (cx < 0 || cy < 0 || cx >= n || cy >= n) return;
  const lvl = sim.map.level;
  const flags = sim.map.flags;
  const myLevel = lvl[cy * n + cx];
  const myBrush = flags[cy * n + cx] & F_BRUSH;
  const r = sight + (myLevel === 2 && !hover ? 2 : 0);
  const c = circle(r);
  for (let k = 0; k < c.length; k += 3) {
    const xx = cx + c[k], yy = cy + c[k + 1];
    if (xx < 0 || yy < 0 || xx >= n || yy >= n) continue;
    const j = yy * n + xx;
    if (!hover && lvl[j] > myLevel) continue; // cannot see up cliffs
    if ((flags[j] & F_BRUSH) && c[k + 2] > 5 && !(myBrush && c[k + 2] <= 20)) continue; // brush hides its interior
    vis[j] = 1;
    explored[j] = 1;
  }
}

export function updateVision(sim: Sim) {
  const n = sim.map.size;
  const reveal = sim.tick < sim.revealUntil;
  for (const p of sim.players) {
    const vis = p.visible;
    vis.fill(0);
    if (reveal) { vis.fill(1); p.explored.fill(1); continue; }
    for (let id = 1; id < sim.nextId; id++) {
      if (!sim.alive[id] || sim.owner[id] !== p.id) continue;
      const k = sim.kind[id];
      let sight = 0;
      let hover = false;
      if (k === Kind.Unit) { const d = sim.udef(id); sight = d.sight; hover = !!d.hover; }
      else if (k === Kind.Structure) { const d = sim.sdef(id); sight = sim.built[id] ? d.sight : 4; }
      else if (k === Kind.Spike) sight = 6;
      if (sight > 0) stampVision(sim, vis, p.explored, sim.x[id], sim.y[id], sight, hover);
    }
    // captured, uncontested watch pylons
    for (const pid of sim.pylonIds) {
      const e = sim.ext[pid];
      if (e.captureOwner === p.id && !e.contested) stampVision(sim, vis, p.explored, sim.x[pid], sim.y[pid], 15, true);
    }
  }
  // last-known structure memory
  for (const p of sim.players) {
    const vis = p.visible;
    for (let id = 1; id < sim.nextId; id++) {
      if (!sim.alive[id] || sim.kind[id] !== Kind.Structure || sim.owner[id] === p.id) continue;
      if (sim.isVisibleTo(p.id, id)) {
        const d = sim.sdef(id);
        p.ghosts.set(id, { id, def: d.id, owner: sim.owner[id], x: sim.x[id], y: sim.y[id], progress: sim.built[id] ? 1 : sim.progress[id], seenTick: sim.tick, size: d.size });
      }
    }
    for (const [gid, g] of p.ghosts) {
      const c = Math.floor(g.y) * n + Math.floor(g.x);
      if (vis[c] && (!sim.alive[gid] || sim.kind[gid] !== Kind.Structure)) p.ghosts.delete(gid);
    }
    void vis;
  }
  void STRUCTURES;
}
