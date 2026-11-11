// Navigation: A* over the clearance grid with string-pulling, static collision, line tests.
import { getMapGrid, NAV_CELL, NAV_W, NAV_H, MAP_MIN_X, MAP_MIN_Y, navCenterX, navCenterY, Cell } from '../shared/map';
import type { V2 } from '../shared/math';

const N = NAV_W * NAV_H;
let g: Float32Array, f: Float32Array, came: Int32Array, stamp: Uint32Array, closedStamp: Uint32Array;
let gen = 1;
function ensure() {
  if (!g) {
    g = new Float32Array(N); f = new Float32Array(N); came = new Int32Array(N); stamp = new Uint32Array(N); closedStamp = new Uint32Array(N);
  }
}

export const toCell = (x: number, y: number) => {
  const cx = Math.floor((x - MAP_MIN_X) / NAV_CELL), cy = Math.floor((y - MAP_MIN_Y) / NAV_CELL);
  return { cx, cy };
};

export function passable(cx: number, cy: number, r: number): boolean {
  if (cx < 0 || cy < 0 || cx >= NAV_W || cy >= NAV_H) return false;
  return getMapGrid().clearance[cy * NAV_W + cx] >= r;
}

export function walkableAt(x: number, y: number, r = 0): boolean {
  const { cx, cy } = toCell(x, y);
  return passable(cx, cy, r);
}

/** Nearest point with clearance >= r (spiral search up to maxR meters). */
export function nearestWalkable(x: number, y: number, r: number, maxR = 8): V2 | null {
  if (walkableAt(x, y, r)) return { x, y };
  const { cx, cy } = toCell(x, y);
  const maxC = Math.ceil(maxR / NAV_CELL);
  for (let rad = 1; rad <= maxC; rad++) {
    let best: V2 | null = null, bd = Infinity;
    for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue;
      if (passable(cx + dx, cy + dy, r)) {
        const px = navCenterX(cx + dx), py = navCenterY(cy + dy);
        const d = (px - x) ** 2 + (py - y) ** 2;
        if (d < bd) { bd = d; best = { x: px, y: py }; }
      }
    }
    if (best) return best;
  }
  return null;
}

/** True when a circle of radius r can travel straight from a to b. */
export function lineClear(ax: number, ay: number, bx: number, by: number, r: number): boolean {
  const d = Math.hypot(bx - ax, by - ay);
  const steps = Math.max(1, Math.ceil(d / (NAV_CELL * 0.5)));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    if (!walkableAt(ax + (bx - ax) * t, ay + (by - ay) * t, r)) return false;
  }
  return true;
}

class Heap {
  a: number[] = [];
  push(i: number) {
    const a = this.a; a.push(i);
    let k = a.length - 1;
    while (k > 0) {
      const p = (k - 1) >> 1;
      if (f[a[p]] <= f[a[k]]) break;
      [a[p], a[k]] = [a[k], a[p]]; k = p;
    }
  }
  pop(): number {
    const a = this.a; const top = a[0]; const last = a.pop()!;
    if (a.length) {
      a[0] = last;
      let k = 0;
      for (;;) {
        const l = 2 * k + 1, r = l + 1; let m = k;
        if (l < a.length && f[a[l]] < f[a[m]]) m = l;
        if (r < a.length && f[a[r]] < f[a[m]]) m = r;
        if (m === k) break;
        [a[m], a[k]] = [a[k], a[m]]; k = m;
      }
    }
    return top;
  }
  get size() { return this.a.length; }
}

export let pathQueries = 0;

/** A* path from (sx,sy) to (tx,ty) for a unit of radius r. Returns smoothed waypoints (excluding start) or null. */
export function findPath(sx: number, sy: number, tx: number, ty: number, r: number, maxExpand = 40000): V2[] | null {
  ensure();
  pathQueries++;
  const rr = Math.min(r, 0.6);
  let start = toCell(sx, sy);
  if (!passable(start.cx, start.cy, rr)) {
    const p = nearestWalkable(sx, sy, rr, 3);
    if (!p) return null;
    start = toCell(p.x, p.y);
  }
  let goalPt: V2 = { x: tx, y: ty };
  if (!walkableAt(tx, ty, rr)) {
    const p = nearestWalkable(tx, ty, rr, 10);
    if (!p) return null;
    goalPt = p;
  }
  if (lineClear(sx, sy, goalPt.x, goalPt.y, rr)) return [goalPt];
  const goal = toCell(goalPt.x, goalPt.y);
  const si = start.cy * NAV_W + start.cx, gi = goal.cy * NAV_W + goal.cx;
  gen++;
  const heap = new Heap();
  const h = (i: number) => {
    const dx = Math.abs((i % NAV_W) - goal.cx), dy = Math.abs(((i / NAV_W) | 0) - goal.cy);
    return (dx + dy + (Math.SQRT2 - 2) * Math.min(dx, dy));
  };
  g[si] = 0; f[si] = h(si); stamp[si] = gen; came[si] = -1;
  heap.push(si);
  let found = false, expanded = 0;
  const clr = getMapGrid().clearance;
  while (heap.size) {
    const cur = heap.pop();
    if (closedStamp[cur] === gen) continue;
    closedStamp[cur] = gen;
    if (cur === gi) { found = true; break; }
    if (++expanded > maxExpand) break;
    const cx = cur % NAV_W, cy = (cur / NAV_W) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= NAV_W || ny >= NAV_H) continue;
      const ni = ny * NAV_W + nx;
      if (clr[ni] < rr) continue;
      if (dx && dy && (clr[cy * NAV_W + nx] < rr || clr[ny * NAV_W + cx] < rr)) continue; // no corner cutting
      if (closedStamp[ni] === gen) continue;
      // slight preference to stay away from walls (reduces hugging)
      const cost = (dx && dy ? Math.SQRT2 : 1) * (clr[ni] < rr + 0.5 ? 1.25 : 1);
      const ng = g[cur] + cost;
      if (stamp[ni] !== gen || ng < g[ni]) {
        stamp[ni] = gen; g[ni] = ng; f[ni] = ng + h(ni); came[ni] = cur;
        heap.push(ni);
      }
    }
  }
  if (!found) return null;
  const raw: V2[] = [];
  for (let c = gi; c !== -1 && c !== si; c = came[c]) raw.push({ x: navCenterX(c % NAV_W), y: navCenterY((c / NAV_W) | 0) });
  raw.reverse();
  raw[raw.length - 1] = goalPt;
  // string pulling against corners
  // greedy forward string pulling: O(n) visibility tests instead of O(n^2)
  const out: V2[] = [];
  let ax = sx, ay = sy, i = 0;
  while (i < raw.length) {
    let j = i;
    while (j + 1 < raw.length && lineClear(ax, ay, raw[j + 1].x, raw[j + 1].y, rr)) j++;
    out.push(raw[j]);
    ax = raw[j].x; ay = raw[j].y;
    i = j + 1;
  }
  return out;
}

/** Push a circle out of blocked cells. Returns corrected position. */
export function resolveStatic(x: number, y: number, r: number): V2 {
  const grid = getMapGrid();
  const { cx, cy } = toCell(x, y);
  if (cx >= 0 && cy >= 0 && cx < NAV_W && cy < NAV_H && grid.clearance[cy * NAV_W + cx] > r + NAV_CELL) return { x, y };
  let px = x, py = y;
  for (let iter = 0; iter < 3; iter++) {
    const c = toCell(px, py);
    const span = Math.ceil(r / NAV_CELL) + 1;
    let moved = false;
    for (let dy = -span; dy <= span; dy++) for (let dx = -span; dx <= span; dx++) {
      const nx = c.cx + dx, ny = c.cy + dy;
      const blocked = nx < 0 || ny < 0 || nx >= NAV_W || ny >= NAV_H || grid.cells[ny * NAV_W + nx] === Cell.Void || grid.cells[ny * NAV_W + nx] === Cell.Forest;
      if (!blocked) continue;
      const minX = MAP_MIN_X + nx * NAV_CELL, minY = MAP_MIN_Y + ny * NAV_CELL;
      const qx = Math.max(minX, Math.min(px, minX + NAV_CELL));
      const qy = Math.max(minY, Math.min(py, minY + NAV_CELL));
      const ddx = px - qx, ddy = py - qy;
      const d = Math.hypot(ddx, ddy);
      if (d < r) {
        if (d < 1e-5) {
          // center inside block: push toward cell-away direction
          const ccx = minX + NAV_CELL / 2, ccy = minY + NAV_CELL / 2;
          const ax = px - ccx, ay = py - ccy, al = Math.hypot(ax, ay) || 1;
          px += (ax / al) * r * 0.5; py += (ay / al) * r * 0.5;
        } else {
          px += (ddx / d) * (r - d); py += (ddy / d) * (r - d);
        }
        moved = true;
      }
    }
    if (!moved) break;
  }
  return { x: px, y: py };
}

/** March a segment and return the first point where it enters a blocked cell (for projectiles / dashes). */
export function raycastWall(ax: number, ay: number, bx: number, by: number): { x: number; y: number; nx: number; ny: number; t: number } | null {
  const d = Math.hypot(bx - ax, by - ay);
  const steps = Math.max(1, Math.ceil(d / (NAV_CELL * 0.5)));
  let prevX = ax, prevY = ay;
  const grid = getMapGrid();
  const isBlocked = (x: number, y: number) => {
    const { cx, cy } = toCell(x, y);
    if (cx < 0 || cy < 0 || cx >= NAV_W || cy >= NAV_H) return true;
    const c = grid.cells[cy * NAV_W + cx];
    return c === Cell.Forest;
  };
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = ax + (bx - ax) * t, y = ay + (by - ay) * t;
    if (isBlocked(x, y)) {
      // estimate normal from neighboring samples
      const bxx = isBlocked(x + 0.3, y) ? 1 : 0, bxm = isBlocked(x - 0.3, y) ? 1 : 0;
      const byy = isBlocked(x, y + 0.3) ? 1 : 0, bym = isBlocked(x, y - 0.3) ? 1 : 0;
      let nx = bxm - bxx, ny = bym - byy;
      const nl = Math.hypot(nx, ny);
      if (nl < 0.01) { nx = -(bx - ax) / d; ny = -(by - ay) / d; } else { nx /= nl; ny /= nl; }
      return { x: prevX, y: prevY, nx, ny, t: (i - 1) / steps };
    }
    prevX = x; prevY = y;
  }
  return null;
}

/** Line of sight for vision/targeting checks (forest blocks). */
export function losClear(ax: number, ay: number, bx: number, by: number): boolean {
  return raycastWall(ax, ay, bx, by) === null;
}

export function pathLength(sx: number, sy: number, path: V2[]): number {
  let l = 0, px = sx, py = sy;
  for (const p of path) { l += Math.hypot(p.x - px, p.y - py); px = p.x; py = p.y; }
  return l;
}
