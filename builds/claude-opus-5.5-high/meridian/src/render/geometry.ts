// Tiny mesh builder: accumulates positions/normals/uvs/colors and emits Babylon meshes.
import { Mesh, VertexData, type Scene, type Material } from "@babylonjs/core";

export type RGB = [number, number, number];

export class Geo {
  pos: number[] = [];
  nrm: number[] = [];
  uv: number[] = [];
  col: number[] = [];
  idx: number[] = [];

  get empty() { return this.idx.length === 0; }

  quad(
    ax: number, ay: number, az: number, bx: number, by: number, bz: number,
    cx: number, cy: number, cz: number, dx: number, dy: number, dz: number,
    c: RGB, uvs: [number, number, number, number, number, number, number, number] = [0, 0, 1, 0, 1, 1, 0, 1], a = 1,
  ) {
    const b0 = this.pos.length / 3;
    this.pos.push(ax, ay, az, bx, by, bz, cx, cy, cz, dx, dy, dz);
    // normal from (b-a)x(d-a)
    const ux = bx - ax, uy = by - ay, uz = bz - az, vx = dx - ax, vy = dy - ay, vz = dz - az;
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1;
    nx /= l; ny /= l; nz /= l;
    for (let i = 0; i < 4; i++) { this.nrm.push(nx, ny, nz); this.col.push(c[0], c[1], c[2], a); }
    this.uv.push(...uvs);
    this.idx.push(b0, b0 + 1, b0 + 2, b0, b0 + 2, b0 + 3);
  }

  /** Axis-aligned box. uvScale: world meters per texture repeat on walls (u,v), 0 = unit uvs. */
  box(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, c: RGB, opts: { top?: boolean; bottom?: boolean; uvU?: number; uvV?: number; topColor?: RGB; sides?: boolean } = {}) {
    const U = opts.uvU ?? 0, V = opts.uvV ?? 0;
    const uvw = (w: number, h: number, o = 0): [number, number, number, number, number, number, number, number] =>
      U > 0 ? [o / U, y0 / V, (o + w) / U, y0 / V, (o + w) / U, (y0 + h) / V, o / U, (y0 + h) / V] : [0, 0, 1, 0, 1, 1, 0, 1];
    const h = y1 - y0;
    if (opts.sides !== false) {
      // -z face (south): outward normal -z
      this.quad(x0, y0, z0, x0, y1, z0, x1, y1, z0, x1, y0, z0, c, swapUv(uvw(x1 - x0, h, x0)));
      // +z face
      this.quad(x1, y0, z1, x1, y1, z1, x0, y1, z1, x0, y0, z1, c, swapUv(uvw(x1 - x0, h, -x1)));
      // -x face
      this.quad(x0, y0, z1, x0, y1, z1, x0, y1, z0, x0, y0, z0, c, swapUv(uvw(z1 - z0, h, -z1)));
      // +x face
      this.quad(x1, y0, z0, x1, y1, z0, x1, y1, z1, x1, y0, z1, c, swapUv(uvw(z1 - z0, h, z0)));
    }
    if (opts.top !== false) this.quad(x0, y1, z0, x0, y1, z1, x1, y1, z1, x1, y1, z0, opts.topColor ?? c);
    if (opts.bottom) this.quad(x0, y0, z0, x1, y0, z0, x1, y0, z1, x0, y0, z1, c);
  }

  /** Box with arbitrary yaw around its center (for props / vehicle parts in local space). */
  obox(cx: number, cy: number, cz: number, sx: number, sy: number, sz: number, yaw: number, c: RGB, taper = 0) {
    const hx = sx / 2, hy = sy / 2, hz = sz / 2;
    const cs = Math.cos(yaw), sn = Math.sin(yaw);
    const P = (x: number, y: number, z: number): [number, number, number] => {
      const t = y > 0 ? 1 - taper : 1;
      const lx = x * t, lz = z * (y > 0 ? 1 - taper * 0.6 : 1);
      return [cx + lx * cs + lz * sn, cy + y, cz - lx * sn + lz * cs];
    };
    const v = [P(-hx, -hy, -hz), P(hx, -hy, -hz), P(hx, hy, -hz), P(-hx, hy, -hz), P(-hx, -hy, hz), P(hx, -hy, hz), P(hx, hy, hz), P(-hx, hy, hz)];
    const f = (a: number, b: number, c2: number, d: number) => this.quad(...v[a], ...v[b], ...v[c2], ...v[d], c);
    f(0, 3, 2, 1); f(5, 6, 7, 4); f(4, 7, 3, 0); f(1, 2, 6, 5); f(3, 7, 6, 2); f(0, 1, 5, 4);
  }

  /** Vertical cylinder approximation (n sides). */
  cyl(cx: number, cy: number, cz: number, r: number, h: number, c: RGB, n = 8, rTop = r) {
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
      const x0 = Math.sin(a0), z0 = Math.cos(a0), x1 = Math.sin(a1), z1 = Math.cos(a1);
      this.quad(cx + x0 * r, cy, cz + z0 * r, cx + x0 * rTop, cy + h, cz + z0 * rTop, cx + x1 * rTop, cy + h, cz + z1 * rTop, cx + x1 * r, cy, cz + z1 * r, c);
      if (rTop > 0.01) this.quad(cx, cy + h, cz, cx, cy + h, cz, cx + x0 * rTop, cy + h, cz + z0 * rTop, cx + x1 * rTop, cy + h, cz + z1 * rTop, c);
    }
  }

  build(name: string, scene: Scene, mat: Material, opts: { colors?: boolean } = {}): Mesh | null {
    if (this.empty) return null;
    const m = new Mesh(name, scene);
    const vd = new VertexData();
    vd.positions = this.pos; vd.normals = this.nrm; vd.uvs = this.uv; vd.indices = this.idx;
    if (opts.colors !== false) vd.colors = this.col;
    vd.applyToMesh(m, false);
    m.hasVertexAlpha = false;
    m.material = mat;
    return m;
  }
}

function swapUv(u: [number, number, number, number, number, number, number, number]): [number, number, number, number, number, number, number, number] {
  // quad vertex order is (bottom-left, top-left, top-right, bottom-right)
  return [u[0], u[1], u[6], u[7], u[4], u[5], u[2], u[3]];
}
