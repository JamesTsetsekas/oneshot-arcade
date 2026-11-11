import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import type { Scene } from '@babylonjs/core/scene';
import type { Material } from '@babylonjs/core/Materials/material';

export type RGBA = [number, number, number, number];
export const hex = (c: number, a = 1): RGBA => [((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255, a];
export const mul = (c: RGBA, k: number): RGBA => [Math.min(1, c[0] * k), Math.min(1, c[1] * k), Math.min(1, c[2] * k), c[3]];
export const tint = (c: RGBA, t: [number, number, number]): RGBA => [Math.min(1, c[0] * t[0]), Math.min(1, c[1] * t[1]), Math.min(1, c[2] * t[2]), c[3]];

/** Accumulates indexed geometry (positions/normals/uvs/vertex colours) for one merged static mesh. */
export class GeoBuilder {
  pos: number[] = [];
  nor: number[] = [];
  uv: number[] = [];
  col: number[] = [];
  idx: number[] = [];

  get vertexCount(): number { return this.pos.length / 3; }

  private vert(x: number, y: number, z: number, nx: number, ny: number, nz: number, u: number, v: number, c: RGBA): void {
    this.pos.push(x, y, z); this.nor.push(nx, ny, nz); this.uv.push(u, v); this.col.push(c[0], c[1], c[2], c[3]);
  }

  /** Quad with explicit corners. Index order assumes a left-handed system (Babylon default) viewed from the normal side. */
  quad(a: number[], b: number[], c: number[], d: number[], n: number[], uvs: number[][], col: RGBA): void {
    const i = this.vertexCount;
    this.vert(a[0], a[1], a[2], n[0], n[1], n[2], uvs[0][0], uvs[0][1], col);
    this.vert(b[0], b[1], b[2], n[0], n[1], n[2], uvs[1][0], uvs[1][1], col);
    this.vert(c[0], c[1], c[2], n[0], n[1], n[2], uvs[2][0], uvs[2][1], col);
    this.vert(d[0], d[1], d[2], n[0], n[1], n[2], uvs[3][0], uvs[3][1], col);
    this.idx.push(i, i + 2, i + 1, i, i + 3, i + 2);
  }

  /**
   * Axis aligned box. Side faces tile metrically (tileW x tileH metres per texture repeat) so windows keep their size.
   */
  box(minX: number, minY: number, minZ: number, maxX: number, maxY: number, maxZ: number, col: RGBA, o: { tileW?: number; tileH?: number; wall?: boolean; top?: boolean; bottom?: boolean; topCol?: RGBA; plain?: boolean } = {}): void {
    const tw = o.tileW ?? 32;
    const th = o.tileH ?? 28;
    const wall = o.wall ?? true;
    const plain = o.plain ?? false;
    const tc = o.topCol ?? col;
    const P: number[][] = [[0, 0], [1, 0], [1, 1], [0, 1]];
    const f = (a: number, b: number) => (plain ? P : [[a / tw, minY / th], [b / tw, minY / th], [b / tw, maxY / th], [a / tw, maxY / th]]);
    if (wall) {
      // +z face (seen from +z looking toward -z): left-to-right runs +x -> -x
      this.quad([maxX, minY, maxZ], [minX, minY, maxZ], [minX, maxY, maxZ], [maxX, maxY, maxZ], [0, 0, 1], f(maxX, minX), col);
      this.quad([minX, minY, minZ], [maxX, minY, minZ], [maxX, maxY, minZ], [minX, maxY, minZ], [0, 0, -1], f(minX, maxX), col);
      this.quad([maxX, minY, minZ], [maxX, minY, maxZ], [maxX, maxY, maxZ], [maxX, maxY, minZ], [1, 0, 0], f(minZ, maxZ), col);
      this.quad([minX, minY, maxZ], [minX, minY, minZ], [minX, maxY, minZ], [minX, maxY, maxZ], [-1, 0, 0], f(maxZ, minZ), col);
    }
    if (o.top ?? true) this.quad([minX, maxY, minZ], [minX, maxY, maxZ], [maxX, maxY, maxZ], [maxX, maxY, minZ], [0, 1, 0], plain ? P : [[minX / tw, minZ / tw], [minX / tw, maxZ / tw], [maxX / tw, maxZ / tw], [maxX / tw, minZ / tw]], tc);
    if (o.bottom) this.quad([minX, minY, minZ], [maxX, minY, minZ], [maxX, minY, maxZ], [minX, minY, maxZ], [0, -1, 0], P, col);
  }

  /** Box rotated around Y about its own centre (for props). */
  rbox(cx: number, cy: number, cz: number, sx: number, sy: number, sz: number, rot: number, col: RGBA, topCol?: RGBA): void {
    const c = Math.cos(rot);
    const s = Math.sin(rot);
    const hx = sx / 2;
    const hz = sz / 2;
    const y0 = cy - sy / 2;
    const y1 = cy + sy / 2;
    const Pt = (lx: number, lz: number): number[] => [cx + lx * c + lz * s, cz - lx * s + lz * c];
    const k = [Pt(-hx, -hz), Pt(hx, -hz), Pt(hx, hz), Pt(-hx, hz)];
    const faces: Array<[number, number, number[]]> = [[1, 0, [0, 0, -1]], [2, 1, [1, 0, 0]], [3, 2, [0, 0, 1]], [0, 3, [-1, 0, 0]]];
    const UV: number[][] = [[0, 0], [1, 0], [1, 1], [0, 1]];
    for (const [a, b, n] of faces) {
      const A = k[a];
      const B = k[b];
      const nx = n[0] * c + n[2] * s;
      const nz = -n[0] * s + n[2] * c;
      this.quad([A[0], y0, A[1]], [B[0], y0, B[1]], [B[0], y1, B[1]], [A[0], y1, A[1]], [nx, 0, nz], UV, col);
    }
    this.quad([k[0][0], y1, k[0][1]], [k[3][0], y1, k[3][1]], [k[2][0], y1, k[2][1]], [k[1][0], y1, k[1][1]], [0, 1, 0], UV, topCol ?? col);
  }

  cylinder(cx: number, y0: number, cz: number, r0: number, r1: number, h: number, segs: number, col: RGBA, cap = true): void {
    const base = this.vertexCount;
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      this.vert(cx + c * r0, y0, cz + s * r0, c, 0.2, s, i / segs, 0, col);
      this.vert(cx + c * r1, y0 + h, cz + s * r1, c, 0.2, s, i / segs, 1, col);
    }
    for (let i = 0; i < segs; i++) {
      const a = base + i * 2;
      this.idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
    if (cap && r1 > 0.001) {
      const t = this.vertexCount;
      this.vert(cx, y0 + h, cz, 0, 1, 0, 0.5, 0.5, col);
      for (let i = 0; i <= segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        this.vert(cx + Math.cos(a) * r1, y0 + h, cz + Math.sin(a) * r1, 0, 1, 0, 0.5, 0.5, col);
      }
      for (let i = 0; i < segs; i++) this.idx.push(t, t + 1 + i, t + 2 + i);
    }
  }

  /** Low-poly UV sphere (optionally only the upper hemisphere). */
  sphere(cx: number, cy: number, cz: number, rx: number, ry: number, rz: number, seg: number, col: RGBA, upperOnly = false): void {
    const base = this.vertexCount;
    const rings = Math.max(4, seg >> 1) * (upperOnly ? 2 : 1);
    const maxRing = upperOnly ? rings / 2 : rings;
    for (let r = 0; r <= maxRing; r++) {
      const phi = (r / rings) * Math.PI;
      for (let s = 0; s <= seg; s++) {
        const th = (s / seg) * Math.PI * 2;
        const nx = Math.sin(phi) * Math.cos(th);
        const ny = Math.cos(phi);
        const nz = Math.sin(phi) * Math.sin(th);
        this.vert(cx + nx * rx, cy + ny * ry, cz + nz * rz, nx, ny, nz, s / seg, r / rings, col);
      }
    }
    for (let r = 0; r < maxRing; r++) for (let s = 0; s < seg; s++) {
      const a = base + r * (seg + 1) + s;
      const b = a + seg + 1;
      this.idx.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }

  build(scene: Scene, name: string, material: Material | null, o: { receive?: boolean; freeze?: boolean } = {}): Mesh {
    const m = new Mesh(name, scene);
    const vd = new VertexData();
    vd.positions = this.pos;
    vd.normals = this.nor;
    vd.uvs = this.uv;
    vd.colors = this.col;
    vd.indices = this.idx;
    vd.applyToMesh(m);
    if (material) m.material = material;
    m.receiveShadows = o.receive ?? false;
    m.isPickable = false;
    if (o.freeze ?? true) { m.freezeWorldMatrix(); m.doNotSyncBoundingInfo = true; }
    return m;
  }
}
