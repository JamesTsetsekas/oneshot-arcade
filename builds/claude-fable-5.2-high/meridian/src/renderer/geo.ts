// Minimal geometry accumulator for procedural, merged, vertex-coloured meshes.
import { Mesh, VertexData, Scene, Material } from '@babylonjs/core';

export const rgb = (c: number): [number, number, number] => [((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255];

export class Geo {
  pos: number[] = []; nrm: number[] = []; col: number[] = []; uv: number[] = []; idx: number[] = [];
  get empty() { return this.idx.length === 0; }
  get verts() { return this.pos.length / 3; }
  /** Quad a-b-c-d (loop order) facing along n. UVs: a(u0,v0) b(u1,v0) c(u1,v1) d(u0,v1). */
  quad(ax: number, ay: number, az: number, bx: number, by: number, bz: number, cx: number, cy: number, cz: number, dx: number, dy: number, dz: number,
    nx: number, ny: number, nz: number, r: number, g: number, b: number, u0 = 0, v0 = 0, u1 = 0, v1 = 0, shadeLow = 1) {
    const i = this.pos.length / 3;
    this.pos.push(ax, ay, az, bx, by, bz, cx, cy, cz, dx, dy, dz);
    this.nrm.push(nx, ny, nz, nx, ny, nz, nx, ny, nz, nx, ny, nz);
    this.col.push(r * shadeLow, g * shadeLow, b * shadeLow, 1, r * shadeLow, g * shadeLow, b * shadeLow, 1, r, g, b, 1, r, g, b, 1);
    this.uv.push(u0, v0, u1, v0, u1, v1, u0, v1);
    // Babylon (left-handed) treats a triangle as front-facing when its right-hand normal points away from the viewer.
    const ex = bx - ax, ey = by - ay, ez = bz - az, fx = cx - ax, fy = cy - ay, fz = cz - az;
    const d = (ey * fz - ez * fy) * nx + (ez * fx - ex * fz) * ny + (ex * fy - ey * fx) * nz;
    if (d > 0) this.idx.push(i, i + 2, i + 1, i, i + 3, i + 2); else this.idx.push(i, i + 1, i + 2, i, i + 2, i + 3);
  }
  tri(ax: number, ay: number, az: number, bx: number, by: number, bz: number, cx: number, cy: number, cz: number, nx: number, ny: number, nz: number, r: number, g: number, b: number) {
    const i = this.pos.length / 3;
    this.pos.push(ax, ay, az, bx, by, bz, cx, cy, cz);
    this.nrm.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
    this.col.push(r, g, b, 1, r, g, b, 1, r, g, b, 1); this.uv.push(0, 0, 0, 0, 0, 0);
    const ex = bx - ax, ey = by - ay, ez = bz - az, fx = cx - ax, fy = cy - ay, fz = cz - az;
    const d = (ey * fz - ez * fy) * nx + (ez * fx - ex * fz) * ny + (ex * fy - ey * fx) * nz;
    if (d > 0) this.idx.push(i, i + 2, i + 1); else this.idx.push(i, i + 1, i + 2);
  }
  /** Oriented box (yaw about Y). `faces` bitmask: 1 top, 2 bottom, 4 sides. */
  box(cx: number, cy: number, cz: number, hx: number, hy: number, hz: number, yaw: number, color: number, faces = 7, uvTile?: [number, number, number, number]) {
    const [r, g, b] = rgb(color), c = Math.cos(yaw), s = Math.sin(yaw);
    const P = (lx: number, ly: number, lz: number): [number, number, number] => [cx + lx * c + lz * s, cy + ly, cz - lx * s + lz * c];
    const N = (lx: number, lz: number): [number, number] => [lx * c + lz * s, -lx * s + lz * c];
    const u = uvTile ?? [0, 0, 0, 0];
    const face = (a: number[], bb: number[], cc: number[], d: number[], nx: number, ny: number, nz: number, k = 1) =>
      this.quad(a[0], a[1], a[2], bb[0], bb[1], bb[2], cc[0], cc[1], cc[2], d[0], d[1], d[2], nx, ny, nz, r * k, g * k, b * k, u[0], u[1], u[2], u[3]);
    if (faces & 1) face(P(-hx, hy, -hz), P(hx, hy, -hz), P(hx, hy, hz), P(-hx, hy, hz), 0, 1, 0, 1.06);
    if (faces & 2) face(P(-hx, -hy, -hz), P(hx, -hy, -hz), P(hx, -hy, hz), P(-hx, -hy, hz), 0, -1, 0, 0.6);
    if (faces & 4) {
      let n = N(0, 1); face(P(-hx, -hy, hz), P(hx, -hy, hz), P(hx, hy, hz), P(-hx, hy, hz), n[0], 0, n[1]);
      n = N(0, -1); face(P(hx, -hy, -hz), P(-hx, -hy, -hz), P(-hx, hy, -hz), P(hx, hy, -hz), n[0], 0, n[1]);
      n = N(1, 0); face(P(hx, -hy, hz), P(hx, -hy, -hz), P(hx, hy, -hz), P(hx, hy, hz), n[0], 0, n[1], 0.94);
      n = N(-1, 0); face(P(-hx, -hy, -hz), P(-hx, -hy, hz), P(-hx, hy, hz), P(-hx, hy, -hz), n[0], 0, n[1], 0.94);
    }
  }
  /** Vertical prism with `sides` sides; top radius scale lets it double as a cone/taper. */
  cyl(cx: number, cy: number, cz: number, rx: number, hy: number, rz: number, color: number, sides = 8, topScale = 1) {
    const [r, g, b] = rgb(color);
    for (let i = 0; i < sides; i++) {
      const a0 = (i / sides) * Math.PI * 2, a1 = ((i + 1) / sides) * Math.PI * 2, am = (a0 + a1) / 2;
      const x0 = Math.sin(a0), z0 = Math.cos(a0), x1 = Math.sin(a1), z1 = Math.cos(a1);
      const k = 0.86 + 0.14 * Math.cos(am - 0.8);
      if (topScale > 0.02) this.quad(cx + x0 * rx, cy - hy, cz + z0 * rz, cx + x1 * rx, cy - hy, cz + z1 * rz, cx + x1 * rx * topScale, cy + hy, cz + z1 * rz * topScale, cx + x0 * rx * topScale, cy + hy, cz + z0 * rz * topScale, Math.sin(am), 0.2 * (1 - topScale), Math.cos(am), r * k, g * k, b * k);
      else this.tri(cx + x0 * rx, cy - hy, cz + z0 * rz, cx + x1 * rx, cy - hy, cz + z1 * rz, cx, cy + hy, cz, Math.sin(am), 0.5, Math.cos(am), r * k, g * k, b * k);
      if (topScale > 0.02) this.tri(cx, cy + hy, cz, cx + x0 * rx * topScale, cy + hy, cz + z0 * rz * topScale, cx + x1 * rx * topScale, cy + hy, cz + z1 * rz * topScale, 0, 1, 0, r, g, b);
    }
  }
  /** Low-poly ellipsoid (yaw-rotated) with smooth normals. */
  ball(cx: number, cy: number, cz: number, rx: number, ry: number, rz: number, color: number, yaw = 0, seg = 8, rings = 5) {
    const [r, g, b] = rgb(color), c = Math.cos(yaw), s = Math.sin(yaw);
    const base = this.pos.length / 3;
    for (let j = 0; j <= rings; j++) {
      const v = j / rings, ph = v * Math.PI, y = Math.cos(ph), rr = Math.sin(ph);
      for (let i = 0; i <= seg; i++) {
        const th = (i / seg) * Math.PI * 2, lx = Math.sin(th) * rr, lz = Math.cos(th) * rr;
        const px = lx * rx, pz = lz * rz;
        this.pos.push(cx + px * c + pz * s, cy + y * ry, cz - px * s + pz * c);
        this.nrm.push(lx * c + lz * s, y, -lx * s + lz * c);
        const k = 0.82 + 0.18 * y;
        this.col.push(r * k, g * k, b * k, 1); this.uv.push(0, 0);
      }
    }
    for (let j = 0; j < rings; j++) for (let i = 0; i < seg; i++) {
      const a = base + j * (seg + 1) + i, bb = a + 1, cc = a + seg + 1, d = cc + 1;
      this.orient(a, bb, cc); this.orient(bb, d, cc);
    }
  }
  /** Push a triangle by vertex index, wound to face along the vertices' stored normals. */
  private orient(i0: number, i1: number, i2: number) {
    const p = this.pos, n = this.nrm;
    const ex = p[i1 * 3] - p[i0 * 3], ey = p[i1 * 3 + 1] - p[i0 * 3 + 1], ez = p[i1 * 3 + 2] - p[i0 * 3 + 2];
    const fx = p[i2 * 3] - p[i0 * 3], fy = p[i2 * 3 + 1] - p[i0 * 3 + 1], fz = p[i2 * 3 + 2] - p[i0 * 3 + 2];
    const nx = n[i0 * 3] + n[i1 * 3] + n[i2 * 3], ny = n[i0 * 3 + 1] + n[i1 * 3 + 1] + n[i2 * 3 + 1], nz = n[i0 * 3 + 2] + n[i1 * 3 + 2] + n[i2 * 3 + 2];
    const d = (ey * fz - ez * fy) * nx + (ez * fx - ex * fz) * ny + (ex * fy - ey * fx) * nz;
    if (d > 0) this.idx.push(i0, i2, i1); else this.idx.push(i0, i1, i2);
  }
  /** Gabled roof prism: ridge along local z, half-width hx, height 2*hy, half-length hz. */
  prism(cx: number, cy: number, cz: number, hx: number, hy: number, hz: number, yaw: number, color: number) {
    const [r, g, b] = rgb(color), c = Math.cos(yaw), s = Math.sin(yaw);
    const P = (lx: number, ly: number, lz: number): [number, number, number] => [cx + lx * c + lz * s, cy + ly, cz - lx * s + lz * c];
    const a = P(-hx, -hy, -hz), bb = P(hx, -hy, -hz), cc = P(hx, -hy, hz), d = P(-hx, -hy, hz), e = P(0, hy, -hz), f = P(0, hy, hz);
    const nl = Math.hypot(hx, 2 * hy);
    const n1 = [(2 * hy / nl) * c, hx / nl, -(2 * hy / nl) * s], n2 = [-(2 * hy / nl) * c, hx / nl, (2 * hy / nl) * s];
    this.quad(bb[0], bb[1], bb[2], cc[0], cc[1], cc[2], f[0], f[1], f[2], e[0], e[1], e[2], n1[0], n1[1], n1[2], r, g, b);
    this.quad(d[0], d[1], d[2], a[0], a[1], a[2], e[0], e[1], e[2], f[0], f[1], f[2], n2[0], n2[1], n2[2], r * 0.9, g * 0.9, b * 0.9);
    this.tri(a[0], a[1], a[2], bb[0], bb[1], bb[2], e[0], e[1], e[2], -s, 0, -c, r * 0.8, g * 0.8, b * 0.8);
    this.tri(cc[0], cc[1], cc[2], d[0], d[1], d[2], f[0], f[1], f[2], s, 0, c, r * 0.8, g * 0.8, b * 0.8);
  }
  toMesh(name: string, scene: Scene, material: Material | null, updatable = false): Mesh {
    const m = new Mesh(name, scene);
    const vd = new VertexData();
    vd.positions = this.pos; vd.normals = this.nrm; vd.colors = this.col; vd.uvs = this.uv; vd.indices = this.idx;
    vd.applyToMesh(m, updatable);
    m.material = material;
    m.isPickable = false;
    return m;
  }
}
