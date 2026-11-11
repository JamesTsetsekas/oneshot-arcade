// fog of war: line-of-sight vision with high ground and vision-blocking brush.
import type { GameMap } from './map';

export const FOG_UNSEEN = 0;
export const FOG_EXPLORED = 1;
export const FOG_VISIBLE = 2;

const HEIGHT_STEP = 1.6; // height difference that blocks sight
const BRUSH_REVEAL = 3;

interface Offs { dx: Int16Array; dy: Int16Array; d: Float32Array }
const cache = new Map<number, Offs>();
function offsets(r: number): Offs {
  let o = cache.get(r);
  if (o) return o;
  const list: Array<[number, number, number]> = [];
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    const d = Math.hypot(dx, dy);
    if (d <= r + 0.5) list.push([dx, dy, d]);
  }
  o = { dx: Int16Array.from(list.map((v) => v[0])), dy: Int16Array.from(list.map((v) => v[1])), d: Float32Array.from(list.map((v) => v[2])) };
  cache.set(r, o);
  return o;
}

/** Mark all cells visible to a viewer at (vx,vy) with sight radius `sight` into `vis` (value FOG_VISIBLE). */
export function castVision(m: GameMap, vis: Uint8Array, vx: number, vy: number, sight: number, flat = false): void {
  const N = m.size;
  const cx = Math.min(N - 1, Math.max(0, Math.floor(vx))), cy = Math.min(N - 1, Math.max(0, Math.floor(vy)));
  const hv = m.heightC[cy * N + cx];
  const r = Math.round(sight + (hv > 2 ? 2 : 0));
  const o = offsets(r);
  for (let k = 0; k < o.dx.length; k++) {
    const tx = cx + o.dx[k], ty = cy + o.dy[k];
    if (tx < 0 || ty < 0 || tx >= N || ty >= N) continue;
    const ti = ty * N + tx;
    if (vis[ti] === FOG_VISIBLE) continue;
    const dist = o.d[k];
    if (dist <= 1.5 || flat) { vis[ti] = FOG_VISIBLE; continue; }
    const ht = m.heightC[ti];
    const walkable = !m.blocked[ti] && !m.chasm[ti];
    if (m.brush[ti] && dist > BRUSH_REVEAL) continue;
    if (walkable && ht - hv > HEIGHT_STEP && dist > 2.5) continue;
    // march along the ray
    const steps = Math.max(Math.abs(o.dx[k]), Math.abs(o.dy[k]));
    const sx = o.dx[k] / steps, sy = o.dy[k] / steps;
    const lim = Math.max(hv, ht) + HEIGHT_STEP;
    let blocked = false;
    for (let s = 1; s < steps; s++) {
      const ix = Math.round(cx + sx * s), iy = Math.round(cy + sy * s);
      const ii = iy * N + ix;
      if (m.heightC[ii] > lim) { blocked = true; break; }
      if (m.brush[ii] && Math.hypot(ix - cx, iy - cy) > BRUSH_REVEAL) { blocked = true; break; }
    }
    if (!blocked) vis[ti] = FOG_VISIBLE;
  }
}

/** Fold currently visible cells into the explored history. */
export function commitExplored(vis: Uint8Array, seen: Uint8Array): void {
  for (let i = 0; i < vis.length; i++) if (vis[i] === FOG_VISIBLE) seen[i] = 1;
}
