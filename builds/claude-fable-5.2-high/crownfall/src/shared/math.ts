// Small deterministic math helpers shared by the simulation and the client.

export interface Vec {
  x: number;
  y: number;
}

export const TICK_RATE = 30;
export const DT = 1 / TICK_RATE;
export const secs = (s: number): number => Math.round(s * TICK_RATE);

export const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const dist = (ax: number, ay: number, bx: number, by: number): number => Math.hypot(bx - ax, by - ay);
export const dist2 = (ax: number, ay: number, bx: number, by: number): number => {
  const dx = bx - ax;
  const dy = by - ay;
  return dx * dx + dy * dy;
};

export function norm(x: number, y: number): Vec {
  const l = Math.hypot(x, y);
  return l < 1e-6 ? { x: 1, y: 0 } : { x: x / l, y: y / l };
}

/** Distance from point p to segment a-b. */
export function pointSegDist(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const l2 = dx * dx + dy * dy;
  let t = l2 < 1e-9 ? 0 : ((px - ax) * dx + (py - ay) * dy) / l2;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}

export function angleDiff(a: number, b: number): number {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function lerpAngle(a: number, b: number, t: number): number {
  return a + angleDiff(a, b) * t;
}

/** Point at arc-length s along a polyline. */
export function pointAlong(pts: Vec[], s: number): Vec & { dx: number; dy: number } {
  let rem = s;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const l = dist(a.x, a.y, b.x, b.y);
    if (rem <= l || i === pts.length - 2) {
      const t = l < 1e-6 ? 0 : clamp(rem / l, 0, 1);
      return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), dx: (b.x - a.x) / l, dy: (b.y - a.y) / l };
    }
    rem -= l;
  }
  const last = pts[pts.length - 1];
  return { x: last.x, y: last.y, dx: 1, dy: 0 };
}

export function polylineLength(pts: Vec[]): number {
  let l = 0;
  for (let i = 0; i < pts.length - 1; i++) l += dist(pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y);
  return l;
}

/** Shape tests used by ability zones (all in sim 2D space). */
export function inCone(px: number, py: number, ox: number, oy: number, ang: number, range: number, halfArc: number, pad = 0): boolean {
  const dx = px - ox;
  const dy = py - oy;
  const d = Math.hypot(dx, dy);
  if (d > range + pad) return false;
  if (d < 0.4 + pad) return true;
  return Math.abs(angleDiff(ang, Math.atan2(dy, dx))) <= halfArc + Math.atan2(pad, d);
}

/** Rectangle starting at origin o, extending `len` along ang, `width` wide in total. */
export function inRect(px: number, py: number, ox: number, oy: number, ang: number, len: number, width: number, pad = 0): boolean {
  const dx = px - ox;
  const dy = py - oy;
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  const along = dx * c + dy * s;
  const side = -dx * s + dy * c;
  return along >= -pad && along <= len + pad && Math.abs(side) <= width / 2 + pad;
}
