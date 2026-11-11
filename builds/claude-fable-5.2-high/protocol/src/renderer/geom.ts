// Tiny procedural geometry builder: quads, boxes and prisms with per-vertex colour and UVs.
// Every model in the game (map, characters, weapons, utility) is authored in code through this.
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import type { Material } from '@babylonjs/core/Materials/material';
import type { Scene } from '@babylonjs/core/scene';

export type RGB = [number, number, number];
type P = [number, number, number];

export class Geom {
  pos: number[] = [];
  nrm: number[] = [];
  col: number[] = [];
  uv: number[] = [];
  idx: number[] = [];

  get vertexCount(): number {
    return this.pos.length / 3;
  }

  /** Adds a quad. Winding is fixed up automatically so the face points along `n`. */
  quad(a: P, b: P, c: P, d: P, n: P, colors: RGB | [RGB, RGB, RGB, RGB], uvs?: [number, number][]): void {
    // Babylon (left-handed) treats a triangle as front-facing when cross(b-a, c-a) points against the normal.
    const ux = b[0] - a[0];
    const uy = b[1] - a[1];
    const uz = b[2] - a[2];
    const vx = c[0] - a[0];
    const vy = c[1] - a[1];
    const vz = c[2] - a[2];
    const cx = uy * vz - uz * vy;
    const cy = uz * vx - ux * vz;
    const cz = ux * vy - uy * vx;
    const flip = cx * n[0] + cy * n[1] + cz * n[2] > 0;
    const base = this.vertexCount;
    const pts = [a, b, c, d];
    const perVertex = Array.isArray(colors[0]);
    for (let i = 0; i < 4; i++) {
      const p = pts[i];
      this.pos.push(p[0], p[1], p[2]);
      this.nrm.push(n[0], n[1], n[2]);
      const cl = perVertex ? (colors as RGB[])[i] : (colors as RGB);
      this.col.push(cl[0], cl[1], cl[2], 1);
      if (uvs) this.uv.push(uvs[i][0], uvs[i][1]);
      else this.uv.push(i === 0 || i === 3 ? 0 : 1, i < 2 ? 0 : 1);
    }
    if (flip) this.idx.push(base, base + 2, base + 1, base, base + 3, base + 2);
    else this.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }

  /** Axis-aligned (optionally rotated) box centred at c. rot = Euler XYZ radians applied about the centre. */
  box(cx: number, cy: number, cz: number, sx: number, sy: number, sz: number, color: RGB, rot?: P, shade = true): void {
    const hx = sx / 2;
    const hy = sy / 2;
    const hz = sz / 2;
    const corners: P[] = [
      [-hx, -hy, -hz],
      [hx, -hy, -hz],
      [hx, hy, -hz],
      [-hx, hy, -hz],
      [-hx, -hy, hz],
      [hx, -hy, hz],
      [hx, hy, hz],
      [-hx, hy, hz],
    ];
    const faces: [number, number, number, number, P][] = [
      [0, 1, 2, 3, [0, 0, -1]],
      [5, 4, 7, 6, [0, 0, 1]],
      [4, 0, 3, 7, [-1, 0, 0]],
      [1, 5, 6, 2, [1, 0, 0]],
      [3, 2, 6, 7, [0, 1, 0]],
      [4, 5, 1, 0, [0, -1, 0]],
    ];
    const tf = rot ? rotator(rot) : null;
    const T = (p: P): P => {
      const q = tf ? tf(p) : p;
      return [q[0] + cx, q[1] + cy, q[2] + cz];
    };
    for (const f of faces) {
      const n = tf ? tf(f[4]) : f[4];
      // cheap baked directional shading so unlit previews still read as 3D
      const k = shade ? 0.82 + 0.18 * n[1] + 0.06 * n[2] : 1;
      this.quad(T(corners[f[0]]), T(corners[f[1]]), T(corners[f[2]]), T(corners[f[3]]), n, [color[0] * k, color[1] * k, color[2] * k]);
    }
  }

  /** N-sided prism (cylinder approximation) along an axis. r2 allows a taper. */
  cyl(cx: number, cy: number, cz: number, r: number, len: number, axis: 'x' | 'y' | 'z', color: RGB, sides = 8, r2 = r): void {
    const map = (u: number, v: number, w: number): P => (axis === 'z' ? [cx + u, cy + v, cz + w] : axis === 'y' ? [cx + u, cy + w, cz + v] : [cx + w, cy + u, cz + v]);
    const nmap = (u: number, v: number, w: number): P => (axis === 'z' ? [u, v, w] : axis === 'y' ? [u, w, v] : [w, u, v]);
    const h = len / 2;
    for (let i = 0; i < sides; i++) {
      const a0 = (i / sides) * Math.PI * 2;
      const a1 = ((i + 1) / sides) * Math.PI * 2;
      const am = (a0 + a1) / 2;
      const c0 = Math.cos(a0);
      const s0 = Math.sin(a0);
      const c1 = Math.cos(a1);
      const s1 = Math.sin(a1);
      const n = nmap(Math.cos(am), Math.sin(am), 0);
      const k = 0.8 + 0.2 * n[1];
      const cl: RGB = [color[0] * k, color[1] * k, color[2] * k];
      this.quad(map(c0 * r, s0 * r, -h), map(c1 * r, s1 * r, -h), map(c1 * r2, s1 * r2, h), map(c0 * r2, s0 * r2, h), n, cl);
      // caps
      const nb = nmap(0, 0, -1);
      const nf = nmap(0, 0, 1);
      this.quad(map(0, 0, -h), map(c1 * r, s1 * r, -h), map(c0 * r, s0 * r, -h), map(0, 0, -h), nb, [color[0] * 0.8, color[1] * 0.8, color[2] * 0.8]);
      this.quad(map(0, 0, h), map(c0 * r2, s0 * r2, h), map(c1 * r2, s1 * r2, h), map(0, 0, h), nf, color);
    }
  }

  /** Low-poly sphere (lat/long). */
  sphere(cx: number, cy: number, cz: number, r: number, color: RGB, seg = 8, rings = 6): void {
    for (let j = 0; j < rings; j++) {
      const t0 = (j / rings) * Math.PI;
      const t1 = ((j + 1) / rings) * Math.PI;
      for (let i = 0; i < seg; i++) {
        const p0 = (i / seg) * Math.PI * 2;
        const p1 = ((i + 1) / seg) * Math.PI * 2;
        const pt = (t: number, p: number): P => [Math.sin(t) * Math.cos(p), Math.cos(t), Math.sin(t) * Math.sin(p)];
        const a = pt(t0, p0);
        const b = pt(t0, p1);
        const c = pt(t1, p1);
        const d = pt(t1, p0);
        const n: P = pt((t0 + t1) / 2, (p0 + p1) / 2);
        const k = 0.75 + 0.25 * n[1];
        const S = (q: P): P => [cx + q[0] * r, cy + q[1] * r, cz + q[2] * r];
        this.quad(S(a), S(b), S(c), S(d), n, [color[0] * k, color[1] * k, color[2] * k], [
          [i / seg, j / rings],
          [(i + 1) / seg, j / rings],
          [(i + 1) / seg, (j + 1) / rings],
          [i / seg, (j + 1) / rings],
        ]);
      }
    }
  }

  build(name: string, scene: Scene, material: Material | null, updatable = false): Mesh {
    const mesh = new Mesh(name, scene);
    const vd = new VertexData();
    vd.positions = this.pos;
    vd.normals = this.nrm;
    vd.colors = this.col;
    vd.uvs = this.uv;
    vd.indices = this.idx;
    vd.applyToMesh(mesh, updatable);
    mesh.material = material;
    mesh.useVertexColors = true;
    mesh.hasVertexAlpha = false;
    mesh.isPickable = false;
    return mesh;
  }
}

function rotator(rot: P): (p: P) => P {
  const [rx, ry, rz] = rot;
  const cx = Math.cos(rx);
  const sx = Math.sin(rx);
  const cy = Math.cos(ry);
  const sy = Math.sin(ry);
  const cz = Math.cos(rz);
  const sz = Math.sin(rz);
  return (p: P): P => {
    let [x, y, z] = p;
    // X
    let t = y * cx - z * sx;
    z = y * sx + z * cx;
    y = t;
    // Y
    t = x * cy + z * sy;
    z = -x * sy + z * cy;
    x = t;
    // Z
    t = x * cz - y * sz;
    y = x * sz + y * cz;
    x = t;
    return [x, y, z];
  };
}
