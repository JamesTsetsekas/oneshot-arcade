export interface Vec { x: number; y: number }
export const TAU = Math.PI * 2;
export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const dist = (ax: number, ay: number, bx: number, by: number) => Math.hypot(bx - ax, by - ay);
export const dist2 = (ax: number, ay: number, bx: number, by: number) => (bx - ax) * (bx - ax) + (by - ay) * (by - ay);
export const angTo = (ax: number, ay: number, bx: number, by: number) => Math.atan2(by - ay, bx - ax);
/** Signed smallest difference a-b wrapped to [-PI, PI]. */
export function angDiff(a: number, b: number): number {
  let d = (a - b) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}
export function turnToward(cur: number, target: number, maxStep: number): number {
  const d = angDiff(target, cur);
  return Math.abs(d) <= maxStep ? target : cur + Math.sign(d) * maxStep;
}
/** Point-in-shape tests used by areas (authored query shapes). `pr` is the target radius. */
export function inCircle(px: number, py: number, pr: number, x: number, y: number, r: number) {
  return dist2(px, py, x, y) <= (r + pr) * (r + pr);
}
export function inCone(px: number, py: number, pr: number, x: number, y: number, dir: number, r: number, angle: number) {
  const d = dist(px, py, x, y);
  if (d > r + pr) return false;
  if (d < pr + 0.3) return true;
  const slack = Math.asin(clamp(pr / Math.max(d, 0.001), 0, 1));
  return Math.abs(angDiff(angTo(x, y, px, py), dir)) <= angle / 2 + slack;
}
export function inRect(px: number, py: number, pr: number, x: number, y: number, dir: number, len: number, width: number) {
  const dx = px - x, dy = py - y;
  const c = Math.cos(dir), s = Math.sin(dir);
  const along = dx * c + dy * s, across = -dx * s + dy * c;
  return along >= -pr && along <= len + pr && Math.abs(across) <= width / 2 + pr;
}
export const fmt = (n: number) => (Math.abs(n) >= 100 || Number.isInteger(n) ? Math.round(n).toString() : n.toFixed(1));
