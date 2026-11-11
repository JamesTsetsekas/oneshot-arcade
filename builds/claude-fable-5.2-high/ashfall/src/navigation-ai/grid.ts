import { type Vec, dist } from '../core/math';
import { CELL, type Zone } from '../entity-combat/types';

export const FLOOR = 0, WALL = 1, DOOR = 2, LOW = 3; // LOW = blocking prop (blocks movement, not sight)
/** Camera-aware cutaway: a wall is drawn low when floor lies within two cells behind it (camera looks toward +x,+y). */
export function isLowWall(z: Zone, cx: number, cy: number): boolean {
  for (let dy = 0; dy <= 2; dy++) for (let dx = 0; dx <= 2; dx++) {
    if (!dx && !dy) continue;
    const x = cx + dx, y = cy + dy;
    if (x < z.w && y < z.h && z.cells[y * z.w + x] !== WALL) return true;
  }
  return false;
}
export const cellIdx = (z: Zone, cx: number, cy: number) => cy * z.w + cx;
export const cellOf = (v: number) => Math.floor(v / CELL);
export function cellAt(z: Zone, cx: number, cy: number): number {
  return cx < 0 || cy < 0 || cx >= z.w || cy >= z.h ? WALL : z.cells[cy * z.w + cx];
}
export const blockedAt = (z: Zone, x: number, y: number) => cellAt(z, cellOf(x), cellOf(y)) !== FLOOR;
export function circleFree(z: Zone, x: number, y: number, r: number): boolean {
  const x0 = cellOf(x - r), x1 = cellOf(x + r), y0 = cellOf(y - r), y1 = cellOf(y + r);
  for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
    if (cellAt(z, cx, cy) === FLOOR) continue;
    const nx = Math.max(cx * CELL, Math.min(x, cx * CELL + CELL)), ny = Math.max(cy * CELL, Math.min(y, cy * CELL + CELL));
    if ((x - nx) * (x - nx) + (y - ny) * (y - ny) < r * r) return false;
  }
  return true;
}
/** Moves a circle with axis-separated sliding against the grid. Returns true if any movement was blocked. */
export function moveCircle(z: Zone, a: { x: number; y: number }, dx: number, dy: number, r: number): boolean {
  let hit = false;
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 0.4));
  const sx = dx / steps, sy = dy / steps;
  for (let i = 0; i < steps; i++) {
    if (circleFree(z, a.x + sx, a.y, r)) a.x += sx; else hit = true;
    if (circleFree(z, a.x, a.y + sy, r)) a.y += sy; else hit = true;
  }
  return hit;
}
/** Line of sight: walls and closed doors block, low props do not. */
export function los(z: Zone, ax: number, ay: number, bx: number, by: number): boolean {
  const d = dist(ax, ay, bx, by);
  const n = Math.ceil(d / 0.5);
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const c = cellAt(z, cellOf(ax + (bx - ax) * t), cellOf(ay + (by - ay) * t));
    if (c === WALL || c === DOOR) return false;
  }
  return true;
}
export function walkLine(z: Zone, ax: number, ay: number, bx: number, by: number, r: number): boolean {
  const d = dist(ax, ay, bx, by);
  const n = Math.max(1, Math.ceil(d / 0.5));
  for (let i = 1; i <= n; i++) { const t = i / n; if (!circleFree(z, ax + (bx - ax) * t, ay + (by - ay) * t, r)) return false; }
  return true;
}
/** Nearest walkable point to (x,y), searching outward ring by ring. */
export function nearestFree(z: Zone, x: number, y: number, r = 0.45, maxRing = 8): Vec | null {
  if (circleFree(z, x, y, r)) return { x, y };
  const cx = cellOf(x), cy = cellOf(y);
  let best: Vec | null = null, bd = Infinity;
  for (let ring = 0; ring <= maxRing && !best; ring++) {
    for (let j = cy - ring; j <= cy + ring; j++) for (let i = cx - ring; i <= cx + ring; i++) {
      if (Math.max(Math.abs(i - cx), Math.abs(j - cy)) !== ring || cellAt(z, i, j) !== FLOOR) continue;
      const px = Math.max(i * CELL + r + 0.05, Math.min(x, i * CELL + CELL - r - 0.05)), py = Math.max(j * CELL + r + 0.05, Math.min(y, j * CELL + CELL - r - 0.05));
      const d = dist(x, y, px, py);
      if (d < bd && circleFree(z, px, py, r)) { bd = d; best = { x: px, y: py }; }
    }
  }
  return best;
}
const N8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
/** Grid A* with no corner cutting, then greedy line-of-walk smoothing so click-to-move paths hug corners tightly. */
export function findPath(z: Zone, ax: number, ay: number, bx: number, by: number, r = 0.45, maxNodes = 2600): Vec[] | null {
  if (walkLine(z, ax, ay, bx, by, r)) return [{ x: bx, y: by }];
  const sx = cellOf(ax), sy = cellOf(ay), tx = cellOf(bx), ty = cellOf(by);
  if (cellAt(z, tx, ty) !== FLOOR || cellAt(z, sx, sy) !== FLOOR) return null;
  const n = z.w * z.h;
  const g = new Float32Array(n).fill(Infinity), came = new Int32Array(n).fill(-1), closed = new Uint8Array(n);
  const open: number[] = [], f = new Float32Array(n);
  const push = (i: number) => { open.push(i); let c = open.length - 1; while (c > 0) { const p = (c - 1) >> 1; if (f[open[p]] <= f[open[c]]) break; [open[p], open[c]] = [open[c], open[p]]; c = p; } };
  const pop = () => {
    const top = open[0], last = open.pop()!;
    if (open.length) { open[0] = last; let c = 0; for (;;) { const l = c * 2 + 1, rr = l + 1; let m = c; if (l < open.length && f[open[l]] < f[open[m]]) m = l; if (rr < open.length && f[open[rr]] < f[open[m]]) m = rr; if (m === c) break; [open[m], open[c]] = [open[c], open[m]]; c = m; } }
    return top;
  };
  const start = sy * z.w + sx, goal = ty * z.w + tx;
  g[start] = 0; f[start] = Math.hypot(tx - sx, ty - sy); push(start);
  let visited = 0;
  while (open.length && visited++ < maxNodes) {
    const cur = pop();
    if (cur === goal) break;
    if (closed[cur]) continue;
    closed[cur] = 1;
    const cx = cur % z.w, cy = (cur / z.w) | 0;
    for (const [dx, dy] of N8) {
      const nx = cx + dx, ny = cy + dy;
      if (cellAt(z, nx, ny) !== FLOOR) continue;
      if (dx && dy && (cellAt(z, cx + dx, cy) !== FLOOR || cellAt(z, cx, cy + dy) !== FLOOR)) continue;
      const ni = ny * z.w + nx, ng = g[cur] + (dx && dy ? 1.4142 : 1);
      if (ng < g[ni]) { g[ni] = ng; came[ni] = cur; f[ni] = ng + Math.hypot(tx - nx, ty - ny); push(ni); }
    }
  }
  if (came[goal] < 0) return null;
  const pts: Vec[] = [{ x: bx, y: by }];
  for (let c = came[goal]; c >= 0 && c !== start; c = came[c]) pts.push({ x: (c % z.w) * CELL + CELL / 2, y: ((c / z.w) | 0) * CELL + CELL / 2 });
  pts.reverse();
  const out: Vec[] = [];
  let px = ax, py = ay, i = 0;
  while (i < pts.length) {
    let j = pts.length - 1;
    while (j > i && !walkLine(z, px, py, pts[j].x, pts[j].y, r)) j--;
    out.push(pts[j]); px = pts[j].x; py = pts[j].y; i = j + 1;
  }
  return out;
}
/** Flood fill over floor cells from a world position; used for layout validation and reachability checks. */
export function flood(z: Zone, x: number, y: number): Uint8Array {
  const seen = new Uint8Array(z.w * z.h);
  const stack = [cellOf(y) * z.w + cellOf(x)];
  if (z.cells[stack[0]] !== FLOOR) return seen;
  seen[stack[0]] = 1;
  while (stack.length) {
    const c = stack.pop()!;
    const cx = c % z.w, cy = (c / z.w) | 0;
    for (let k = 0; k < 4; k++) {
      const nx = cx + N8[k][0], ny = cy + N8[k][1];
      if (cellAt(z, nx, ny) !== FLOOR) continue;
      const ni = ny * z.w + nx;
      if (!seen[ni]) { seen[ni] = 1; stack.push(ni); }
    }
  }
  return seen;
}
