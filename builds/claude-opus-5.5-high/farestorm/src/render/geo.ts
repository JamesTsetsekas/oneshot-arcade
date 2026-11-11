// Tiny merged-geometry builder with vertex colors + UVs. Used for the whole procedural art set.

import { Mesh, VertexData, type Scene, type Material } from "@babylonjs/core";

export type RGB = [number, number, number];

export function hex(c: string): RGB {
  const n = parseInt(c.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
export function mix(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
export function scale(a: RGB, k: number): RGB {
  return [a[0] * k, a[1] * k, a[2] * k];
}

export class Geo {
  pos: number[] = [];
  nrm: number[] = [];
  col: number[] = [];
  uv: number[] = [];
  idx: number[] = [];

  get vertexCount() {
    return this.pos.length / 3;
  }

  vert(x: number, y: number, z: number, nx: number, ny: number, nz: number, c: RGB, u = 0, v = 0, a = 1): number {
    this.pos.push(x, y, z);
    this.nrm.push(nx, ny, nz);
    this.col.push(c[0], c[1], c[2], a);
    this.uv.push(u, v);
    return this.pos.length / 3 - 1;
  }

  /** Quad from 4 corners (counter-clockwise when viewed from the normal side in a left-handed system). */
  quad(
    p0: number[], p1: number[], p2: number[], p3: number[], c: RGB,
    uv: [number, number, number, number] = [0, 0, 1, 1], flatNormal = true, a = 1,
  ) {
    const ux = p1[0] - p0[0], uy = p1[1] - p0[1], uz = p1[2] - p0[2];
    const vx = p3[0] - p0[0], vy = p3[1] - p0[1], vz = p3[2] - p0[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1;
    nx /= -l; ny /= -l; nz /= -l;
    void flatNormal;
    const [u0, v0, u1, v1] = uv;
    const i0 = this.vert(p0[0], p0[1], p0[2], nx, ny, nz, c, u0, v0, a);
    const i1 = this.vert(p1[0], p1[1], p1[2], nx, ny, nz, c, u1, v0, a);
    const i2 = this.vert(p2[0], p2[1], p2[2], nx, ny, nz, c, u1, v1, a);
    const i3 = this.vert(p3[0], p3[1], p3[2], nx, ny, nz, c, u0, v1, a);
    this.idx.push(i0, i2, i1, i0, i3, i2);
  }

  /** Axis-aligned (then yawed) box. uvScale > 0 maps side UVs in meters / uvScale. */
  box(
    cx: number, cy: number, cz: number, sx: number, sy: number, sz: number, c: RGB,
    yaw = 0, opts: { top?: RGB; bottom?: boolean; uvW?: number; uvH?: number; sides?: RGB } = {},
  ) {
    const hx = sx / 2, hy = sy / 2, hz = sz / 2;
    const cs = Math.cos(yaw), sn = Math.sin(yaw);
    const P = (x: number, y: number, z: number) => [cx + x * cs + z * sn, cy + y, cz - x * sn + z * cs];
    const side = opts.sides ?? c;
    const uw = opts.uvW ?? 0, uh = opts.uvH ?? 0;
    const suv = (w: number): [number, number, number, number] => (uw > 0 ? [0, 0, w / uw, sy / uh] : [0, 0, 1, 1]);
    // +z face
    this.quad(P(hx, -hy, hz), P(-hx, -hy, hz), P(-hx, hy, hz), P(hx, hy, hz), side, suv(sx));
    // -z face
    this.quad(P(-hx, -hy, -hz), P(hx, -hy, -hz), P(hx, hy, -hz), P(-hx, hy, -hz), side, suv(sx));
    // +x face
    this.quad(P(hx, -hy, -hz), P(hx, -hy, hz), P(hx, hy, hz), P(hx, hy, -hz), side, suv(sz));
    // -x face
    this.quad(P(-hx, -hy, hz), P(-hx, -hy, -hz), P(-hx, hy, -hz), P(-hx, hy, hz), side, suv(sz));
    // top
    this.quad(P(-hx, hy, -hz), P(hx, hy, -hz), P(hx, hy, hz), P(-hx, hy, hz), opts.top ?? c, [0, 0, 0, 0]);
    if (opts.bottom) this.quad(P(-hx, -hy, hz), P(hx, -hy, hz), P(hx, -hy, -hz), P(-hx, -hy, -hz), c, [0, 0, 0, 0]);
  }

  /** Tapered box: bottom size (bx,bz), top size (tx,tz), optional top offset along z. */
  taper(cx: number, y0: number, cz: number, bx: number, bz: number, tx: number, tz: number, h: number, c: RGB, yaw = 0, topOffZ = 0, top?: RGB) {
    const cs = Math.cos(yaw), sn = Math.sin(yaw);
    const P = (x: number, y: number, z: number) => [cx + x * cs + z * sn, y, cz - x * sn + z * cs];
    const b = [P(-bx / 2, y0, -bz / 2), P(bx / 2, y0, -bz / 2), P(bx / 2, y0, bz / 2), P(-bx / 2, y0, bz / 2)];
    const y1 = y0 + h;
    const t = [P(-tx / 2, y1, -tz / 2 + topOffZ), P(tx / 2, y1, -tz / 2 + topOffZ), P(tx / 2, y1, tz / 2 + topOffZ), P(-tx / 2, y1, tz / 2 + topOffZ)];
    this.quad(b[2], b[3], t[3], t[2], c); // +z
    this.quad(b[0], b[1], t[1], t[0], c); // -z
    this.quad(b[1], b[2], t[2], t[1], c); // +x
    this.quad(b[3], b[0], t[0], t[3], c); // -x
    this.quad(t[0], t[1], t[2], t[3], top ?? c, [0, 0, 0, 0]);
  }

  /** Cylinder / cone along an axis. */
  cyl(cx: number, cy: number, cz: number, rBot: number, rTop: number, h: number, seg: number, c: RGB, axis: "y" | "x" | "z" = "y", caps = true, topC?: RGB) {
    const map = (a: number, b: number, y: number): number[] => {
      if (axis === "y") return [cx + a, cy + y, cz + b];
      if (axis === "x") return [cx + y, cy + a, cz + b];
      return [cx + a, cy + b, cz + y];
    };
    const base = this.vertexCount;
    for (let i = 0; i <= seg; i++) {
      const t = (i / seg) * Math.PI * 2;
      const ca = Math.cos(t), sa = Math.sin(t);
      const n = axis === "y" ? [ca, 0, sa] : axis === "x" ? [0, ca, sa] : [ca, sa, 0];
      const p0 = map(ca * rBot, sa * rBot, -h / 2);
      const p1 = map(ca * rTop, sa * rTop, h / 2);
      this.vert(p0[0], p0[1], p0[2], n[0], n[1], n[2], c, i / seg, 0);
      this.vert(p1[0], p1[1], p1[2], n[0], n[1], n[2], c, i / seg, 1);
    }
    for (let i = 0; i < seg; i++) {
      const a = base + i * 2;
      this.idx.push(a, a + 1, a + 3, a, a + 3, a + 2);
    }
    if (caps) {
      for (const [y, r, sgn, cc] of [[h / 2, rTop, 1, topC ?? c], [-h / 2, rBot, -1, c]] as [number, number, number, RGB][]) {
        if (r <= 0.001) continue;
        const n = axis === "y" ? [0, sgn, 0] : axis === "x" ? [sgn, 0, 0] : [0, 0, sgn];
        const cpos = map(0, 0, y);
        const ci = this.vert(cpos[0], cpos[1], cpos[2], n[0], n[1], n[2], cc);
        const first = this.vertexCount;
        for (let i = 0; i <= seg; i++) {
          const t = (i / seg) * Math.PI * 2;
          const p = map(Math.cos(t) * r, Math.sin(t) * r, y);
          this.vert(p[0], p[1], p[2], n[0], n[1], n[2], cc);
        }
        for (let i = 0; i < seg; i++) {
          if (sgn > 0) this.idx.push(ci, first + i + 1, first + i);
          else this.idx.push(ci, first + i, first + i + 1);
        }
      }
    }
  }

  /** Low-poly UV sphere (or hemisphere when half=true). */
  sphere(cx: number, cy: number, cz: number, r: number, c: RGB, seg = 10, rings = 6, half = false, sy = 1) {
    const base = this.vertexCount;
    const maxRing = half ? rings / 2 : rings;
    for (let j = 0; j <= maxRing; j++) {
      const phi = (j / rings) * Math.PI;
      for (let i = 0; i <= seg; i++) {
        const th = (i / seg) * Math.PI * 2;
        const nx = Math.sin(phi) * Math.cos(th), ny = Math.cos(phi), nz = Math.sin(phi) * Math.sin(th);
        this.vert(cx + nx * r, cy + ny * r * sy, cz + nz * r, nx, ny, nz, c);
      }
    }
    for (let j = 0; j < maxRing; j++)
      for (let i = 0; i < seg; i++) {
        const a = base + j * (seg + 1) + i, b = a + seg + 1;
        this.idx.push(a, a + 1, b, a + 1, b + 1, b);
      }
  }

  /** Extruded 2D polygon (xz plane) between y0 and y1. */
  prism(pts: [number, number][], cx: number, y0: number, cz: number, y1: number, c: RGB, top?: RGB, yaw = 0) {
    const cs = Math.cos(yaw), sn = Math.sin(yaw);
    const P = (x: number, z: number, y: number) => [cx + x * cs + z * sn, y, cz - x * sn + z * cs];
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n];
      this.quad(P(a[0], a[1], y0), P(b[0], b[1], y0), P(b[0], b[1], y1), P(a[0], a[1], y1), c);
    }
    // fan cap (convex or star-shaped around centroid)
    let mx = 0, mz = 0;
    for (const p of pts) { mx += p[0]; mz += p[1]; }
    mx /= n; mz /= n;
    const tc = top ?? c;
    const center = P(mx, mz, y1);
    const ci = this.vert(center[0], center[1], center[2], 0, 1, 0, tc);
    const first = this.vertexCount;
    for (const p of pts) {
      const q = P(p[0], p[1], y1);
      this.vert(q[0], q[1], q[2], 0, 1, 0, tc);
    }
    for (let i = 0; i < n; i++) this.idx.push(ci, first + ((i + 1) % n), first + i);
    const center2 = P(mx, mz, y0);
    const ci2 = this.vert(center2[0], center2[1], center2[2], 0, -1, 0, c);
    const first2 = this.vertexCount;
    for (const p of pts) {
      const q = P(p[0], p[1], y0);
      this.vert(q[0], q[1], q[2], 0, -1, 0, c);
    }
    for (let i = 0; i < n; i++) this.idx.push(ci2, first2 + i, first2 + ((i + 1) % n));
  }

  /** Flat ring on the ground (annulus) */
  ring(cx: number, cy: number, cz: number, r0: number, r1: number, seg: number, c: RGB, a = 1) {
    const base = this.vertexCount;
    for (let i = 0; i <= seg; i++) {
      const t = (i / seg) * Math.PI * 2;
      const ca = Math.cos(t), sa = Math.sin(t);
      this.vert(cx + ca * r0, cy, cz + sa * r0, 0, 1, 0, c, i / seg, 0, a);
      this.vert(cx + ca * r1, cy, cz + sa * r1, 0, 1, 0, c, i / seg, 1, a);
    }
    for (let i = 0; i < seg; i++) {
      const k = base + i * 2;
      this.idx.push(k, k + 3, k + 1, k, k + 2, k + 3);
    }
  }

  append(o: Geo) {
    const off = this.vertexCount;
    this.pos.push(...o.pos);
    this.nrm.push(...o.nrm);
    this.col.push(...o.col);
    this.uv.push(...o.uv);
    for (const i of o.idx) this.idx.push(i + off);
  }

  toMesh(name: string, scene: Scene, mat: Material | null, opts: { uv?: boolean } = {}): Mesh {
    const m = new Mesh(name, scene);
    const vd = new VertexData();
    vd.positions = this.pos;
    vd.normals = this.nrm;
    vd.colors = this.col;
    if (opts.uv !== false) vd.uvs = this.uv;
    vd.indices = this.idx.length > 65535 * 3 ? new Uint32Array(this.idx) : this.idx;
    vd.applyToMesh(m, false);
    m.material = mat;
    m.useVertexColors = true;
    m.hasVertexAlpha = false;
    return m;
  }
}

export function starPoints(n: number, r0: number, r1: number): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? r1 : r0;
    const t = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
    out.push([Math.cos(t) * r, Math.sin(t) * r]);
  }
  return out;
}
export function polyPoints(n: number, r: number, rot = 0): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2 + rot;
    out.push([Math.cos(t) * r, Math.sin(t) * r]);
  }
  return out;
}
