export interface Vec2 { x: number; y: number }

export const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const dist = (ax: number, ay: number, bx: number, by: number) => Math.hypot(bx - ax, by - ay);
export const dist2 = (ax: number, ay: number, bx: number, by: number) => (bx - ax) * (bx - ax) + (by - ay) * (by - ay);

export function angleTo(ax: number, ay: number, bx: number, by: number): number {
  return Math.atan2(by - ay, bx - ax);
}

/** Smallest signed difference b - a in (-PI, PI]. */
export function angleDiff(a: number, b: number): number {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d <= -Math.PI) d += Math.PI * 2;
  return d;
}

export function rotateToward(cur: number, target: number, maxStep: number): number {
  const d = angleDiff(cur, target);
  if (Math.abs(d) <= maxStep) return target;
  return cur + Math.sign(d) * maxStep;
}

/** Distance from point p to segment ab. */
export function pointSegDist(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const abx = bx - ax, aby = by - ay;
  const len2 = abx * abx + aby * aby;
  let t = len2 > 0 ? ((px - ax) * abx + (py - ay) * aby) / len2 : 0;
  t = clamp(t, 0, 1);
  return Math.hypot(px - (ax + abx * t), py - (ay + aby * t));
}

/** Is point inside a cone (sector) at origin facing angle with half-angle, radius r (plus target radius slack). */
export function inCone(ox: number, oy: number, facing: number, halfAngle: number, r: number, px: number, py: number, pr = 0): boolean {
  const d = dist(ox, oy, px, py);
  if (d > r + pr) return false;
  if (d < pr + 0.3) return true;
  const a = angleTo(ox, oy, px, py);
  const slack = Math.asin(clamp(pr / Math.max(d, 0.001), 0, 1));
  return Math.abs(angleDiff(facing, a)) <= halfAngle + slack;
}

/** Is point inside oriented rectangle that starts at origin and extends length along facing, with given half width. */
export function inLine(ox: number, oy: number, facing: number, length: number, halfWidth: number, px: number, py: number, pr = 0): boolean {
  const c = Math.cos(facing), s = Math.sin(facing);
  const dx = px - ox, dy = py - oy;
  const along = dx * c + dy * s;
  const across = -dx * s + dy * c;
  return along >= -pr && along <= length + pr && Math.abs(across) <= halfWidth + pr;
}

export function fmt(n: number, digits = 0): string {
  return n.toFixed(digits);
}
