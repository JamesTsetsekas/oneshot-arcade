// renderer: builds the static K-17 environment from map data. Geometry is merged per material (few draw calls),
// UVs are world-projected so textures tile at real scale, and ambient occlusion / lamp light is baked per vertex.
import type { Decor, Lamp, MapDef, Solid } from '../content/mapTypes';
import type { World } from '../sim/world';
import { Color3, DynamicTexture, Mesh, Scene, StandardMaterial, Texture, VertexData } from './bjs';
import type { MatDef } from './textures';

const CELL = 2.6;

interface Buf { pos: number[]; nrm: number[]; uv: number[]; col: number[]; idx: number[] }

export interface BakeOptions { sunDir: [number, number, number]; vertexSun: boolean }

/** Baked light probe usable at runtime (viewmodel / character ambient boost). */
export class LightBake {
  constructor(private world: World, private lamps: Lamp[], private opts: BakeOptions) {}
  private tilt: [number, number, number][] = [[0.5, 0.86, 0], [-0.5, 0.86, 0], [0, 0.86, 0.5], [0, 0.86, -0.5]];

  skyVis(x: number, y: number, z: number): number {
    let v = this.world.raycast(x, y, z, 0, 1, 0, 60, 'vision') ? 0 : 0.4;
    for (const t of this.tilt) if (!this.world.raycast(x, y, z, t[0], t[1], t[2], 40, 'vision')) v += 0.15;
    return v;
  }

  lampLight(x: number, y: number, z: number, nx: number, ny: number, nz: number, occlude: boolean, out: [number, number, number]): void {
    out[0] = out[1] = out[2] = 0;
    for (const l of this.lamps) {
      const dx = l.x - x, dy = l.y - 0.2 - y, dz = l.z - z;
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 > l.r * l.r) continue;
      const d = Math.sqrt(d2) || 0.001;
      const ndl = Math.max(0, (dx * nx + dy * ny + dz * nz) / d) * 0.65 + 0.35;
      const att = (1 - d / l.r) ** 2;
      if (occlude && !this.world.visible(x, y, z, l.x, l.y - 0.2, l.z)) continue;
      const k = att * ndl * l.power * 1.25;
      out[0] += l.color[0] * k; out[1] += l.color[1] * k; out[2] += l.color[2] * k;
    }
  }

  private tmp: [number, number, number] = [0, 0, 0];
  /** Vertex colour multiplier for a static surface point with the given normal. */
  vertex(x: number, y: number, z: number, nx: number, ny: number, nz: number, out: [number, number, number]): void {
    const px = x + nx * 0.09, py = y + ny * 0.09, pz = z + nz * 0.09;
    const sky = ny < -0.5 ? 0 : this.skyVis(px, py, pz);
    this.lampLight(px, py, pz, nx, ny, nz, true, this.tmp);
    let base = 0.7 + 0.3 * sky + 0.5 * (1 - sky) * (1 - sky);
    if (this.opts.vertexSun) {
      const s = this.opts.sunDir;
      const lit = !this.world.raycast(px, py, pz, -s[0], -s[1], -s[2], 80, 'vision');
      if (!lit) base *= sky < 0.3 ? 0.42 : 0.62;
    }
    out[0] = base + this.tmp[0]; out[1] = base + this.tmp[1]; out[2] = base + this.tmp[2];
  }

  /** Ambient boost colour at a point in space (for dynamic objects). */
  probe(x: number, y: number, z: number, out: [number, number, number]): void {
    const sky = this.skyVis(x, y, z);
    this.lampLight(x, y, z, 0, 1, 0, false, this.tmp);
    const fill = 0.3 * (1 - sky) * (1 - sky);
    out[0] = fill + this.tmp[0] * 0.5; out[1] = fill + this.tmp[1] * 0.5; out[2] = fill + this.tmp[2] * 0.5;
  }
}

export class MapBuilder {
  private bufs = new Map<string, Buf>();
  private col: [number, number, number] = [1, 1, 1];
  constructor(private mats: Record<string, MatDef>, private bake: LightBake | null) {}

  private buf(mat: string): Buf {
    let b = this.bufs.get(mat);
    if (!b) { b = { pos: [], nrm: [], uv: [], col: [], idx: [] }; this.bufs.set(mat, b); }
    return b;
  }

  /** Subdivided parallelogram p0 + s*eu + t*ev with normal n (eu x ev must point along n). */
  quad(mat: string, p0: number[], eu: number[], ev: number[], n: number[], lit = true, cell = CELL): void {
    const b = this.buf(mat);
    const def = this.mats[mat];
    const tile = def ? def.tile : 1, vt = def && def.vtile ? def.vtile : tile;
    const lu = Math.hypot(eu[0], eu[1], eu[2]), lv = Math.hypot(ev[0], ev[1], ev[2]);
    if (lu < 1e-5 || lv < 1e-5) return;
    const nu = Math.max(1, Math.ceil(lu / cell)), nv = Math.max(1, Math.ceil(lv / cell));
    const base = b.pos.length / 3;
    const ax = Math.abs(n[0]), ay = Math.abs(n[1]), az = Math.abs(n[2]);
    for (let j = 0; j <= nv; j++) {
      for (let i = 0; i <= nu; i++) {
        const s = i / nu, t = j / nv;
        const x = p0[0] + eu[0] * s + ev[0] * t, y = p0[1] + eu[1] * s + ev[1] * t, z = p0[2] + eu[2] * s + ev[2] * t;
        b.pos.push(x, y, z);
        b.nrm.push(n[0], n[1], n[2]);
        if (ay >= ax && ay >= az) b.uv.push(x / tile, z / tile);
        else if (ax >= az) b.uv.push((n[0] > 0 ? z : -z) / tile, y / vt); // keep printed text readable on every face
        else b.uv.push((n[2] < 0 ? x : -x) / tile, y / vt);
        if (lit && this.bake) {
          // pull samples slightly inside the quad so shared edges do not sample inside neighbouring geometry
          const si = 0.04 + s * 0.92, ti = 0.04 + t * 0.92;
          this.bake.vertex(p0[0] + eu[0] * si + ev[0] * ti, p0[1] + eu[1] * si + ev[1] * ti, p0[2] + eu[2] * si + ev[2] * ti, n[0], n[1], n[2], this.col);
          b.col.push(this.col[0], this.col[1], this.col[2], 1);
        } else b.col.push(1, 1, 1, 1);
      }
    }
    const w = nu + 1;
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const a = base + j * w + i, c = a + 1, d = a + w, e = d + 1;
        b.idx.push(a, e, c, a, d, e); // Babylon (left-handed) front faces wind clockwise
      }
    }
  }

  box(min: number[], max: number[], mat: string, opts: { skipBottom?: boolean; lit?: boolean; skipTop?: boolean } = {}): void {
    const [x0, y0, z0] = min, [x1, y1, z1] = max;
    const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0;
    const lit = opts.lit !== false;
    if (!opts.skipTop) this.quad(mat, [x0, y1, z0], [0, 0, dz], [dx, 0, 0], [0, 1, 0], lit);
    if (!opts.skipBottom) this.quad(mat, [x0, y0, z0], [dx, 0, 0], [0, 0, dz], [0, -1, 0], lit);
    this.quad(mat, [x1, y0, z0], [0, dy, 0], [0, 0, dz], [1, 0, 0], lit);
    this.quad(mat, [x0, y0, z0], [0, 0, dz], [0, dy, 0], [-1, 0, 0], lit);
    this.quad(mat, [x0, y0, z1], [dx, 0, 0], [0, dy, 0], [0, 0, 1], lit);
    this.quad(mat, [x0, y0, z0], [0, dy, 0], [dx, 0, 0], [0, 0, -1], lit);
  }

  private tri(mat: string, a: number[], b: number[], c: number[], n: number[]): void {
    const buf = this.buf(mat);
    const def = this.mats[mat];
    const tile = def ? def.tile : 1;
    const base = buf.pos.length / 3;
    for (const p of [a, b, c]) {
      buf.pos.push(p[0], p[1], p[2]);
      buf.nrm.push(n[0], n[1], n[2]);
      if (Math.abs(n[0]) > Math.abs(n[2])) buf.uv.push(p[2] / tile, p[1] / tile); else buf.uv.push(p[0] / tile, p[1] / tile);
      if (this.bake) { this.bake.vertex(p[0] * 0.9 + (a[0] + b[0] + c[0]) / 30, p[1] * 0.9 + (a[1] + b[1] + c[1]) / 30, p[2] * 0.9 + (a[2] + b[2] + c[2]) / 30, n[0], n[1], n[2], this.col); buf.col.push(this.col[0], this.col[1], this.col[2], 1); }
      else buf.col.push(1, 1, 1, 1);
    }
    // choose winding so the face is front-facing from the normal side
    const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const cx = e1[1] * e2[2] - e1[2] * e2[1], cy = e1[2] * e2[0] - e1[0] * e2[2], cz = e1[0] * e2[1] - e1[1] * e2[0];
    if (cx * n[0] + cy * n[1] + cz * n[2] > 0) buf.idx.push(base, base + 2, base + 1); else buf.idx.push(base, base + 1, base + 2);
  }

  ramp(s: Solid): void {
    const [x0, y0, z0] = s.min, [x1, y1, z1] = s.max;
    const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0;
    const mat = s.mat;
    switch (s.dir) {
      case 'x+': {
        const l = Math.hypot(dx, dy);
        this.quad(mat, [x0, y0, z0], [0, 0, dz], [dx, dy, 0], [-dy / l, dx / l, 0]);
        this.quad(mat, [x1, y0, z0], [0, dy, 0], [0, 0, dz], [1, 0, 0]);
        this.tri(mat, [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [0, 0, -1]);
        this.tri(mat, [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [0, 0, 1]);
        break;
      }
      case 'x-': {
        const l = Math.hypot(dx, dy);
        this.quad(mat, [x1, y0, z0], [-dx, dy, 0], [0, 0, dz], [dy / l, dx / l, 0]);
        this.quad(mat, [x0, y0, z0], [0, 0, dz], [0, dy, 0], [-1, 0, 0]);
        this.tri(mat, [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [0, 0, -1]);
        this.tri(mat, [x1, y0, z1], [x0, y0, z1], [x0, y1, z1], [0, 0, 1]);
        break;
      }
      case 'z+': {
        const l = Math.hypot(dz, dy);
        this.quad(mat, [x0, y0, z0], [0, dy, dz], [dx, 0, 0], [0, dz / l, -dy / l]);
        this.quad(mat, [x0, y0, z1], [dx, 0, 0], [0, dy, 0], [0, 0, 1]);
        this.tri(mat, [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [-1, 0, 0]);
        this.tri(mat, [x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [1, 0, 0]);
        break;
      }
      default: {
        const l = Math.hypot(dz, dy);
        this.quad(mat, [x0, y0, z1], [dx, 0, 0], [0, dy, -dz], [0, dz / l, dy / l]);
        this.quad(mat, [x0, y0, z0], [0, dy, 0], [dx, 0, 0], [0, 0, -1]);
        this.tri(mat, [x0, y0, z1], [x0, y0, z0], [x0, y1, z0], [-1, 0, 0]);
        this.tri(mat, [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [1, 0, 0]);
        break;
      }
    }
  }

  /** Cylinder between two points (axis-aligned or arbitrary), with end caps. */
  cylinder(a: number[], b: number[], r: number, mat: string, segs = 14, caps = true, r2 = r): void {
    const buf = this.buf(mat);
    const def = this.mats[mat];
    const tile = def ? def.tile : 1;
    const ax = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const len = Math.hypot(ax[0], ax[1], ax[2]);
    if (len < 1e-5) return;
    const d = [ax[0] / len, ax[1] / len, ax[2] / len];
    const ref = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    let u = [d[1] * ref[2] - d[2] * ref[1], d[2] * ref[0] - d[0] * ref[2], d[0] * ref[1] - d[1] * ref[0]];
    const ul = Math.hypot(u[0], u[1], u[2]); u = [u[0] / ul, u[1] / ul, u[2] / ul];
    const v = [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]];
    const rows = Math.max(1, Math.ceil(len / 4));
    const base = buf.pos.length / 3;
    for (let j = 0; j <= rows; j++) {
      const t = j / rows, rr = r + (r2 - r) * t;
      for (let i = 0; i <= segs; i++) {
        const ang = (i / segs) * Math.PI * 2, c = Math.cos(ang), s = Math.sin(ang);
        const nx = u[0] * c + v[0] * s, ny = u[1] * c + v[1] * s, nz = u[2] * c + v[2] * s;
        const x = a[0] + ax[0] * t + nx * rr, y = a[1] + ax[1] * t + ny * rr, z = a[2] + ax[2] * t + nz * rr;
        buf.pos.push(x, y, z); buf.nrm.push(nx, ny, nz);
        buf.uv.push((i / segs) * Math.max(1, Math.round((Math.PI * 2 * r) / tile)), (t * len) / tile);
        if (this.bake) { this.bake.vertex(x, y, z, nx, ny, nz, this.col); buf.col.push(this.col[0], this.col[1], this.col[2], 1); } else buf.col.push(1, 1, 1, 1);
      }
    }
    const w = segs + 1;
    for (let j = 0; j < rows; j++) for (let i = 0; i < segs; i++) {
      const p = base + j * w + i, q = p + 1, s2 = p + w, t2 = s2 + 1;
      // outward normal = u x v rotated; verify orientation numerically once per cylinder via a fixed rule
      buf.idx.push(p, t2, q, p, s2, t2);
    }
    if (caps) {
      for (const end of [0, 1]) {
        const c0 = end ? b : a, n = end ? d : [-d[0], -d[1], -d[2]], rr = end ? r2 : r;
        const cb = buf.pos.length / 3;
        if (this.bake) this.bake.vertex(c0[0], c0[1], c0[2], n[0], n[1], n[2], this.col);
        const cc = this.bake ? [this.col[0], this.col[1], this.col[2]] : [1, 1, 1];
        buf.pos.push(c0[0], c0[1], c0[2]); buf.nrm.push(n[0], n[1], n[2]); buf.uv.push(0.5, 0.5); buf.col.push(cc[0], cc[1], cc[2], 1);
        for (let i = 0; i <= segs; i++) {
          const ang = (i / segs) * Math.PI * 2, c = Math.cos(ang), s = Math.sin(ang);
          buf.pos.push(c0[0] + (u[0] * c + v[0] * s) * rr, c0[1] + (u[1] * c + v[1] * s) * rr, c0[2] + (u[2] * c + v[2] * s) * rr);
          buf.nrm.push(n[0], n[1], n[2]); buf.uv.push(0.5 + c * 0.5, 0.5 + s * 0.5); buf.col.push(cc[0], cc[1], cc[2], 1);
        }
        for (let i = 0; i < segs; i++) { if (end) buf.idx.push(cb, cb + 2 + i, cb + 1 + i); else buf.idx.push(cb, cb + 1 + i, cb + 2 + i); }
      }
    }
  }

  /** Parabolic dish bowl (double sided) with support mast and feed arm. */
  dish(pos: number[]): void {
    const tilt = 0.62, yaw = 0.9;
    const R = 6.4, depth = 1.7, rings = 7, segs = 28;
    const top = [pos[0], pos[1] + 5.2, pos[2]];
    this.cylinder(pos, [pos[0], pos[1] + 4.6, pos[2]], 0.95, 'compositeDark', 14, true, 0.55);
    this.cylinder([pos[0], pos[1] + 4.4, pos[2]], top, 0.75, 'dark', 12, true, 0.9);
    const ct = Math.cos(tilt), st = Math.sin(tilt), cy = Math.cos(yaw), sy = Math.sin(yaw);
    // local dish frame: axis points up-and-out
    const tf = (x: number, y: number, z: number): number[] => {
      const y1 = y * ct - z * st, z1 = y * st + z * ct;
      const x2 = x * cy + z1 * sy, z2 = -x * sy + z1 * cy;
      return [top[0] + x2, top[1] + y1 + 0.3, top[2] + z2];
    };
    const tn = (x: number, y: number, z: number): number[] => {
      const y1 = y * ct - z * st, z1 = y * st + z * ct;
      return [x * cy + z1 * sy, y1, -x * sy + z1 * cy];
    };
    for (const side of [1, -1]) {
      const buf = this.buf(side > 0 ? 'paintWhite' : 'compositeDark');
      const base = buf.pos.length / 3;
      for (let j = 0; j <= rings; j++) {
        const rr = (j / rings) * R, h = depth * (rr / R) ** 2;
        for (let i = 0; i <= segs; i++) {
          const ang = (i / segs) * Math.PI * 2;
          const lx = Math.cos(ang) * rr, lz = Math.sin(ang) * rr;
          const p = tf(lx, h + (side > 0 ? 0 : -0.06), lz);
          const slope = (2 * depth * rr) / (R * R);
          const nl = Math.hypot(slope, 1);
          const n = tn((-Math.cos(ang) * slope) / nl * side, (1 / nl) * side, (-Math.sin(ang) * slope) / nl * side);
          buf.pos.push(p[0], p[1], p[2]); buf.nrm.push(n[0], n[1], n[2]); buf.uv.push(i / segs * 6, j / rings * 2);
          const shade = side > 0 ? 1.0 : 0.82;
          buf.col.push(shade, shade, shade, 1);
        }
      }
      const w = segs + 1;
      for (let j = 0; j < rings; j++) for (let i = 0; i < segs; i++) {
        const p = base + j * w + i, q = p + 1, s2 = p + w, t2 = s2 + 1;
        if (side > 0) buf.idx.push(p, q, t2, p, t2, s2); else buf.idx.push(p, t2, q, p, s2, t2);
      }
    }
    // rim, feed struts and horn
    const feed = tf(0, depth + 3.6, 0);
    for (let k = 0; k < 3; k++) {
      const ang = (k / 3) * Math.PI * 2 + 0.4;
      this.cylinder(tf(Math.cos(ang) * R * 0.96, depth, Math.sin(ang) * R * 0.96), feed, 0.06, 'dark', 6, false);
    }
    this.cylinder(tf(0, depth + 3.1, 0), tf(0, depth + 3.9, 0), 0.32, 'dark', 10, true, 0.2);
    this.cylinder(tf(0, depth + 2.95, 0), tf(0, depth + 3.1, 0), 0.36, 'cyanGlow', 10, true);
    for (let i = 0; i < segs; i++) {
      const a0 = (i / segs) * Math.PI * 2, a1 = ((i + 1) / segs) * Math.PI * 2;
      this.cylinder(tf(Math.cos(a0) * R, depth, Math.sin(a0) * R), tf(Math.cos(a1) * R, depth, Math.sin(a1) * R), 0.07, 'dark', 5, false);
    }
    // back truss
    for (let k = 0; k < 4; k++) {
      const ang = (k / 4) * Math.PI * 2 + 0.2;
      this.cylinder([top[0], top[1], top[2]], tf(Math.cos(ang) * R * 0.6, depth * 0.36 - 0.1, Math.sin(ang) * R * 0.6), 0.09, 'dark', 6, false);
    }
  }

  mast(pos: number[], h: number): void {
    const [x, y, z] = pos;
    this.cylinder([x, y, z], [x, y + h, z], 0.13, 'paintWhite', 8, true, 0.06);
    for (const f of [0.45, 0.7, 0.88]) {
      this.box([x - 0.7 * (1 - f * 0.5), y + h * f - 0.03, z - 0.03], [x + 0.7 * (1 - f * 0.5), y + h * f + 0.03, z + 0.03], 'dark', { lit: false });
      this.box([x - 0.03, y + h * f - 0.03, z - 0.5 * (1 - f * 0.5)], [x + 0.03, y + h * f + 0.03, z + 0.5 * (1 - f * 0.5)], 'dark', { lit: false });
    }
    this.box([x - 0.16, y + h * 0.58, z + 0.12], [x + 0.16, y + h * 0.58 + 0.7, z + 0.22], 'paintWhite', { lit: false });
    this.box([x - 0.07, y + h, z - 0.07], [x + 0.07, y + h + 0.14, z + 0.07], 'orangeGlow', { lit: false });
  }

  build(scene: Scene): Mesh[] {
    const meshes: Mesh[] = [];
    for (const [name, b] of this.bufs) {
      const def = this.mats[name];
      if (!def || b.idx.length === 0) continue;
      const m = new Mesh('map_' + name, scene);
      const vd = new VertexData();
      vd.positions = new Float32Array(b.pos);
      vd.normals = new Float32Array(b.nrm);
      vd.uvs = new Float32Array(b.uv);
      vd.colors = new Float32Array(b.col);
      vd.indices = b.pos.length / 3 > 65535 ? new Uint32Array(b.idx) : new Uint16Array(b.idx);
      vd.applyToMesh(m);
      m.material = def.mat;
      m.useVertexColors = true;
      m.hasVertexAlpha = false;
      m.isPickable = false;
      m.freezeWorldMatrix();
      m.doNotSyncBoundingInfo = true;
      meshes.push(m);
    }
    return meshes;
  }
}

export interface MapMeshes { opaque: Mesh[]; glass: Map<number, Mesh>; signs: Mesh[]; triangles: number }

export function buildMap(scene: Scene, map: MapDef, mats: Record<string, MatDef>, bake: LightBake | null): MapMeshes {
  const mb = new MapBuilder(mats, bake);
  const glass = buildGlass(scene, map, mats);
  for (const s of map.solids) {
    if (s.hidden || s.mat === 'boundary') continue;
    if (s.glass !== undefined) continue;
    if (s.kind === 'box') mb.box(s.min, s.max, s.mat, { skipBottom: s.min[1] <= -3.9 });
    else if (s.kind === 'ramp') mb.ramp(s);
    else {
      const cx = (s.min[0] + s.max[0]) / 2, cz = (s.min[2] + s.max[2]) / 2, r = (s.max[0] - s.min[0]) / 2;
      mb.cylinder([cx, s.min[1], cz], [cx, s.max[1], cz], r, s.mat, 22, true);
      mb.cylinder([cx, s.max[1], cz], [cx, s.max[1] + 0.5, cz], r * 0.98, s.mat, 22, true, r * 0.5);
      for (const f of [0.25, 0.6, 0.9]) mb.cylinder([cx, s.min[1] + (s.max[1] - s.min[1]) * f, cz], [cx, s.min[1] + (s.max[1] - s.min[1]) * f + 0.12, cz], r + 0.05, 'dark', 22, false);
    }
  }
  const signs: Mesh[] = [];
  for (const d of map.decor) {
    if (d.k === 'box') mb.box(d.min, d.max, d.mat, { lit: !['lamp', 'cyanGlow', 'orangeGlow', 'screen'].includes(d.mat), skipBottom: d.min[1] <= 0.021 && d.max[1] < 0.1 });
    else if (d.k === 'cyl') mb.cylinder(d.a, d.b, d.r, d.mat, d.r > 0.3 ? 14 : 8, true);
    else if (d.k === 'dish') mb.dish(d.pos);
    else if (d.k === 'mast') mb.mast(d.pos, d.h);
    else if (d.k === 'sign') signs.push(makeSign(scene, d));
  }
  const opaque = mb.build(scene);
  let triangles = 0;
  for (const m of opaque) triangles += m.getTotalIndices() / 3;
  return { opaque, glass, signs, triangles };
}

function makeSign(scene: Scene, d: Extract<Decor, { k: 'sign' }>): Mesh {
  const pxPerM = 150;
  const w = Math.min(1024, Math.round(d.w * pxPerM)), h = Math.min(256, Math.round(d.h * pxPerM));
  const tex = new DynamicTexture('sign_' + d.text, { width: w, height: h }, scene, true);
  const g = tex.getContext() as unknown as CanvasRenderingContext2D;
  const fg = d.tone === 'cyan' ? '#39dcec' : d.tone === 'orange' ? '#f08a2a' : '#e8ecee';
  g.fillStyle = '#161b21'; g.fillRect(0, 0, w, h);
  g.fillStyle = fg; g.fillRect(0, 0, h * 0.12, h);
  g.strokeStyle = 'rgba(255,255,255,0.14)'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2);
  g.textBaseline = 'middle';
  g.font = `700 ${Math.round(h * (d.sub ? 0.5 : 0.58))}px Bahnschrift, "Arial Narrow", Arial, sans-serif`;
  g.fillText(d.text, h * 0.3, h * (d.sub ? 0.38 : 0.53), w - h * 0.4);
  if (d.sub) {
    g.fillStyle = 'rgba(230,236,240,0.75)';
    g.font = `500 ${Math.round(h * 0.24)}px Bahnschrift, "Arial Narrow", Arial, sans-serif`;
    g.fillText(d.sub, h * 0.32, h * 0.78, w - h * 0.4);
  }
  tex.update(true);
  tex.wrapU = Texture.CLAMP_ADDRESSMODE; tex.wrapV = Texture.CLAMP_ADDRESSMODE;
  const mat = new StandardMaterial('signm_' + d.text, scene);
  mat.diffuseTexture = tex;
  mat.emissiveTexture = tex;
  mat.emissiveColor = new Color3(0.55, 0.55, 0.55);
  mat.specularColor = new Color3(0.05, 0.05, 0.05);
  const mesh = new Mesh('sign', scene);
  const [x, y, z] = d.pos;
  const hw = d.w / 2, hh = d.h / 2;
  // quad corners: bottom-left, bottom-right, top-right, top-left as seen from the facing side
  let p: number[][];
  let n: number[];
  switch (d.face) {
    case 'x+': p = [[x, y - hh, z + hw], [x, y - hh, z - hw], [x, y + hh, z - hw], [x, y + hh, z + hw]]; n = [1, 0, 0]; break;
    case 'x-': p = [[x, y - hh, z - hw], [x, y - hh, z + hw], [x, y + hh, z + hw], [x, y + hh, z - hw]]; n = [-1, 0, 0]; break;
    case 'z+': p = [[x - hw, y - hh, z], [x + hw, y - hh, z], [x + hw, y + hh, z], [x - hw, y + hh, z]]; n = [0, 0, 1]; break;
    default: p = [[x + hw, y - hh, z], [x - hw, y - hh, z], [x - hw, y + hh, z], [x + hw, y + hh, z]]; n = [0, 0, -1]; break;
  }
  const vd = new VertexData();
  vd.positions = p.flat();
  vd.normals = [...n, ...n, ...n, ...n];
  vd.uvs = [1, 0, 0, 0, 0, 1, 1, 1];
  // front face must be clockwise seen from the facing side in a left-handed system
  const e1 = [p[1][0] - p[0][0], p[1][1] - p[0][1], p[1][2] - p[0][2]], e2 = [p[2][0] - p[0][0], p[2][1] - p[0][1], p[2][2] - p[0][2]];
  const cx = e1[1] * e2[2] - e1[2] * e2[1], cy = e1[2] * e2[0] - e1[0] * e2[2], cz = e1[0] * e2[1] - e1[1] * e2[0];
  vd.indices = cx * n[0] + cy * n[1] + cz * n[2] > 0 ? [0, 2, 1, 0, 3, 2] : [0, 1, 2, 0, 2, 3];
  vd.applyToMesh(mesh);
  mesh.material = mat;
  mesh.isPickable = false;
  mesh.freezeWorldMatrix();
  return mesh;
}

export function buildGlass(scene: Scene, map: MapDef, mats: Record<string, MatDef>): Map<number, Mesh> {
  const glass = new Map<number, Mesh>();
  for (const s of map.solids) {
    if (s.glass === undefined) continue;
    const gb = new MapBuilder(mats, null);
    gb.box(s.min, s.max, 'glass', { lit: false });
    const gm = gb.build(scene)[0];
    gm.name = 'glass_' + s.glass;
    gm.useVertexColors = false;
    glass.set(s.glass, gm);
  }
  return glass;
}
