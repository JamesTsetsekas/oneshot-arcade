// Tiny procedural mesh builder. Handles Babylon's winding so callers only think in outward normals.
import { Mesh, VertexData, Scene, Material } from '@babylonjs/core';
import { V3, Quat, rotate, cross, sub, norm, dot } from '../core/math';

export type RGB = [number, number, number] | [number, number, number, number];

export class MeshBuf {
  pos: number[] = [];
  nrm: number[] = [];
  uv: number[] = [];
  col: number[] = [];
  idx: number[] = [];

  get vertexCount(): number {
    return this.pos.length / 3;
  }
  vert(p: V3, n: V3, u: number, v: number, c: RGB): number {
    this.pos.push(p.x, p.y, p.z);
    this.nrm.push(n.x, n.y, n.z);
    this.uv.push(u, v);
    this.col.push(c[0], c[1], c[2], c[3] ?? 1);
    return this.pos.length / 3 - 1;
  }
  /** Triangle from existing vertex indices, wound so that `n` is the front face. */
  triIdx(a: number, b: number, c: number, pa: V3, pb: V3, pc: V3, n: V3): void {
    const cr = cross(sub(pb, pa), sub(pc, pa));
    if (dot(cr, n) > 0) this.idx.push(a, c, b);
    else this.idx.push(a, b, c);
  }
  tri(a: V3, b: V3, c: V3, color: RGB, nHint?: V3): void {
    let n = norm(cross(sub(b, a), sub(c, a)));
    if (nHint && dot(n, nHint) < 0) n = { x: -n.x, y: -n.y, z: -n.z };
    const i = this.vert(a, n, 0, 0, color), j = this.vert(b, n, 1, 0, color), k = this.vert(c, n, 0, 1, color);
    this.triIdx(i, j, k, a, b, c, n);
  }
  /** Quad a-b-c-d (loop order). uv = [u0, v0, u1, v1] maps a->(u0,v0), b->(u1,v0), c->(u1,v1), d->(u0,v1). */
  quad(a: V3, b: V3, c: V3, d: V3, color: RGB, nHint?: V3, uv: [number, number, number, number] = [0, 0, 1, 1], colorTop?: RGB): void {
    let n = norm(cross(sub(b, a), sub(d, a)));
    if (nHint && dot(n, nHint) < 0) n = { x: -n.x, y: -n.y, z: -n.z };
    const ct = colorTop ?? color;
    const i = this.vert(a, n, uv[0], uv[1], color), j = this.vert(b, n, uv[2], uv[1], color);
    const k = this.vert(c, n, uv[2], uv[3], ct), l = this.vert(d, n, uv[0], uv[3], ct);
    this.triIdx(i, j, k, a, b, c, n);
    this.triIdx(i, k, l, a, c, d, n);
  }
  /** Oriented box. `skipBottom` omits the hidden underside. */
  box(c: V3, hx: number, hy: number, hz: number, q: Quat | null, color: RGB, skipBottom = false, topColor?: RGB): void {
    const P = (x: number, y: number, z: number): V3 => {
      const l = { x: x * hx, y: y * hy, z: z * hz };
      const r = q ? rotate(q, l) : l;
      return { x: c.x + r.x, y: c.y + r.y, z: c.z + r.z };
    };
    const N = (x: number, y: number, z: number): V3 => (q ? rotate(q, { x, y, z }) : { x, y, z });
    this.quad(P(-1, -1, 1), P(1, -1, 1), P(1, 1, 1), P(-1, 1, 1), color, N(0, 0, 1));
    this.quad(P(1, -1, -1), P(-1, -1, -1), P(-1, 1, -1), P(1, 1, -1), color, N(0, 0, -1));
    this.quad(P(1, -1, 1), P(1, -1, -1), P(1, 1, -1), P(1, 1, 1), color, N(1, 0, 0));
    this.quad(P(-1, -1, -1), P(-1, -1, 1), P(-1, 1, 1), P(-1, 1, -1), color, N(-1, 0, 0));
    this.quad(P(-1, 1, 1), P(1, 1, 1), P(1, 1, -1), P(-1, 1, -1), topColor ?? color, N(0, 1, 0));
    if (!skipBottom) this.quad(P(-1, -1, -1), P(1, -1, -1), P(1, -1, 1), P(-1, -1, 1), color, N(0, -1, 0));
  }
  /** Vertical frustum (cylinder/cone) from y0 to y1 around (cx, cz). */
  cyl(cx: number, cz: number, y0: number, y1: number, r0: number, r1: number, segs: number, color: RGB, capTop = true, colorTop?: RGB): void {
    const ct = colorTop ?? color;
    for (let i = 0; i < segs; i++) {
      const a0 = (i / segs) * Math.PI * 2, a1 = ((i + 1) / segs) * Math.PI * 2;
      const am = (a0 + a1) / 2;
      const p = (a: number, r: number, y: number): V3 => ({ x: cx + Math.cos(a) * r, y, z: cz + Math.sin(a) * r });
      const slope = (r0 - r1) / Math.max(1e-3, y1 - y0);
      const n0 = norm({ x: Math.cos(a0), y: slope, z: Math.sin(a0) }), n1 = norm({ x: Math.cos(a1), y: slope, z: Math.sin(a1) });
      const A = p(a0, r0, y0), B = p(a1, r0, y0), C = p(a1, r1, y1), D = p(a0, r1, y1);
      const i0 = this.vert(A, n0, 0, 0, color), i1 = this.vert(B, n1, 1, 0, color), i2 = this.vert(C, n1, 1, 1, ct), i3 = this.vert(D, n0, 0, 1, ct);
      const nm = { x: Math.cos(am), y: slope, z: Math.sin(am) };
      this.triIdx(i0, i1, i2, A, B, C, nm);
      if (r1 > 1e-3) this.triIdx(i0, i2, i3, A, C, D, nm);
      if (capTop && r1 > 1e-3) this.tri({ x: cx, y: y1, z: cz }, D, C, ct, { x: 0, y: 1, z: 0 });
    }
  }
  /** Cylinder whose axis runs along x (wheels, drums). */
  cylX(c: V3, r: number, halfLen: number, segs: number, color: RGB, capColor?: RGB): void {
    const cc = capColor ?? color;
    for (let i = 0; i < segs; i++) {
      const a0 = (i / segs) * Math.PI * 2, a1 = ((i + 1) / segs) * Math.PI * 2;
      const p = (a: number, x: number, rr = r): V3 => ({ x: c.x + x, y: c.y + Math.cos(a) * rr, z: c.z + Math.sin(a) * rr });
      this.quad(p(a0, -halfLen), p(a0, halfLen), p(a1, halfLen), p(a1, -halfLen), color, { x: 0, y: Math.cos((a0 + a1) / 2), z: Math.sin((a0 + a1) / 2) });
      for (const sgn of [-1, 1]) this.tri({ x: c.x + sgn * halfLen, y: c.y, z: c.z }, p(a0, sgn * halfLen), p(a1, sgn * halfLen), cc, { x: sgn, y: 0, z: 0 });
    }
  }
  /** Ellipsoid. */
  sphere(c: V3, rx: number, ry: number, rz: number, segs: number, color: RGB, colorTop?: RGB): void {
    const rings = Math.max(3, Math.floor(segs / 2));
    const ct = colorTop ?? color;
    const grid: number[][] = [];
    for (let j = 0; j <= rings; j++) {
      const row: number[] = [];
      const phi = (j / rings) * Math.PI;
      const k = j / rings;
      const cc: RGB = [color[0] + (ct[0] - color[0]) * (1 - k), color[1] + (ct[1] - color[1]) * (1 - k), color[2] + (ct[2] - color[2]) * (1 - k)];
      for (let i = 0; i <= segs; i++) {
        const th = (i / segs) * Math.PI * 2;
        const n = { x: Math.sin(phi) * Math.cos(th), y: Math.cos(phi), z: Math.sin(phi) * Math.sin(th) };
        row.push(this.vert({ x: c.x + n.x * rx, y: c.y + n.y * ry, z: c.z + n.z * rz }, n, i / segs, k, cc));
      }
      grid.push(row);
    }
    const P = (i: number): V3 => ({ x: this.pos[i * 3], y: this.pos[i * 3 + 1], z: this.pos[i * 3 + 2] });
    for (let j = 0; j < rings; j++) for (let i = 0; i < segs; i++) {
      const a = grid[j][i], b = grid[j][i + 1], d = grid[j + 1][i], e = grid[j + 1][i + 1];
      const out = sub(P(d), c);
      if (j > 0) this.triIdx(a, b, e, P(a), P(b), P(e), out);
      if (j < rings - 1) this.triIdx(a, e, d, P(a), P(e), P(d), out);
    }
  }
  /** Extrude a side profile [z, y] along x with per-point half widths; convex profiles only. */
  prism(profile: [number, number][], halfW: number | number[], color: RGB, origin: V3 = { x: 0, y: 0, z: 0 }, capColor?: RGB): void {
    const n = profile.length;
    const hw = (i: number) => (typeof halfW === 'number' ? halfW : halfW[i]);
    let cz = 0, cy = 0;
    for (const [z, y] of profile) { cz += z / n; cy += y / n; }
    const centre = { x: origin.x, y: origin.y + cy, z: origin.z + cz };
    const pt = (i: number, s: number): V3 => ({ x: origin.x + s * hw(i), y: origin.y + profile[i][1], z: origin.z + profile[i][0] });
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const a = pt(i, -1), b = pt(i, 1), c = pt(j, 1), d = pt(j, -1);
      const mid = { x: origin.x, y: (a.y + d.y) / 2, z: (a.z + d.z) / 2 };
      this.quad(a, b, c, d, color, sub(mid, centre));
    }
    for (const s of [-1, 1]) {
      const cc = capColor ?? color;
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        let hwAvg = 0;
        for (let k = 0; k < n; k++) hwAvg += hw(k) / n;
        this.tri({ x: origin.x + s * hwAvg, y: centre.y, z: centre.z }, pt(i, s), pt(j, s), cc, { x: s, y: 0, z: 0 });
      }
    }
  }
  /** Convex solid from faces given as point loops; oriented away from the centroid. */
  convexFaces(faces: V3[][], color: RGB): void {
    let cx = 0, cy = 0, cz = 0, k = 0;
    for (const f of faces) for (const p of f) { cx += p.x; cy += p.y; cz += p.z; k++; }
    const centre = { x: cx / k, y: cy / k, z: cz / k };
    for (const f of faces) {
      const fc = { x: 0, y: 0, z: 0 };
      for (const p of f) { fc.x += p.x / f.length; fc.y += p.y / f.length; fc.z += p.z / f.length; }
      const out = sub(fc, centre);
      if (f.length === 4) this.quad(f[0], f[1], f[2], f[3], color, out);
      else this.tri(f[0], f[1], f[2], color, out);
    }
  }
  toMesh(name: string, scene: Scene, material: Material | null): Mesh {
    const mesh = new Mesh(name, scene);
    const vd = new VertexData();
    vd.positions = new Float32Array(this.pos);
    vd.normals = new Float32Array(this.nrm);
    vd.uvs = new Float32Array(this.uv);
    vd.colors = new Float32Array(this.col);
    vd.indices = this.vertexCount > 65535 ? new Uint32Array(this.idx) : new Uint16Array(this.idx);
    vd.applyToMesh(mesh);
    mesh.material = material;
    return mesh;
  }
}

export function hsl(h: number, s: number, l: number): [number, number, number] {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)];
}
export function hex(c: string): [number, number, number] {
  const v = parseInt(c.slice(1), 16);
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
}
export function mul(c: RGB, k: number): [number, number, number] {
  return [c[0] * k, c[1] * k, c[2] * k];
}
export function mix(a: RGB, b: RGB, t: number): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
