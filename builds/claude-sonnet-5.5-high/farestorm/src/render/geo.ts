import * as THREE from 'three';

/** Tiny merged-geometry builder: accumulates coloured, lit triangles into one BufferGeometry. */
export class Geo {
  pos: number[] = [];
  nor: number[] = [];
  col: number[] = [];
  uv: number[] = [];
  idx: number[] = [];
  private c = new THREE.Color();

  private vert(x: number, y: number, z: number, nx: number, ny: number, nz: number, r: number, g: number, b: number, u = 0, v = 0): number {
    const i = this.pos.length / 3;
    this.pos.push(x, y, z);
    this.nor.push(nx, ny, nz);
    this.col.push(r, g, b);
    this.uv.push(u, v);
    return i;
  }

  /** quad from 4 corners (counter-clockwise seen from the normal side) */
  quad(p: number[][], color: number, shade = [1, 1, 1, 1], uvs?: number[][]): void {
    this.c.setHex(color);
    const a = p[0], b = p[1], c = p[2];
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1;
    nx /= l; ny /= l; nz /= l;
    const base: number[] = [];
    for (let k = 0; k < 4; k++) {
      const s = shade[k];
      base.push(this.vert(p[k][0], p[k][1], p[k][2], nx, ny, nz, this.c.r * s, this.c.g * s, this.c.b * s, uvs ? uvs[k][0] : 0, uvs ? uvs[k][1] : 0));
    }
    this.idx.push(base[0], base[1], base[2], base[0], base[2], base[3]);
  }

  /** flat horizontal rectangle facing up */
  flat(x0: number, z0: number, x1: number, z1: number, y: number, color: number, shade = 1): void {
    this.quad([[x0, y, z0], [x0, y, z1], [x1, y, z1], [x1, y, z0]], color, [shade, shade, shade, shade]);
  }

  /** oriented flat rectangle centred at (cx,cz), length along direction (dx,dz) */
  strip(cx: number, cz: number, dx: number, dz: number, len: number, wid: number, y: number, color: number): void {
    const rx = -dz, rz = dx;
    const hl = len / 2, hw = wid / 2;
    this.quad([
      [cx - dx * hl - rx * hw, y, cz - dz * hl - rz * hw],
      [cx - dx * hl + rx * hw, y, cz - dz * hl + rz * hw],
      [cx + dx * hl + rx * hw, y, cz + dz * hl + rz * hw],
      [cx + dx * hl - rx * hw, y, cz + dz * hl - rz * hw],
    ], color);
  }

  /** axis-aligned box with baked vertical gradient; windows=true gives wall UVs for a window texture */
  box(cx: number, y0: number, cz: number, sx: number, sy: number, sz: number, color: number, opts: { windows?: boolean; topColor?: number; noBottom?: boolean; glow?: number; cell?: number } = {}): void {
    const x0 = cx - sx / 2, x1 = cx + sx / 2, z0 = cz - sz / 2, z1 = cz + sz / 2, y1 = y0 + sy;
    const lo = 0.72, hi = 1;
    const cell = opts.cell ?? 5;
    const wu = (len: number) => Math.max(1, Math.round(len / cell));
    const wv = Math.max(1, Math.round(sy / 3.6));
    const W = opts.windows;
    // +Z face
    this.quad([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], color, [lo, lo, hi, hi], W ? [[0, 0], [wu(sx), 0], [wu(sx), wv], [0, wv]] : undefined);
    // -Z face
    this.quad([[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], color, [lo, lo, hi, hi], W ? [[0, 0], [wu(sx), 0], [wu(sx), wv], [0, wv]] : undefined);
    // +X face
    this.quad([[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], color, [lo, lo, hi, hi], W ? [[0, 0], [wu(sz), 0], [wu(sz), wv], [0, wv]] : undefined);
    // -X face
    this.quad([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], color, [lo, lo, hi, hi], W ? [[0, 0], [wu(sz), 0], [wu(sz), wv], [0, wv]] : undefined);
    // top
    const tc = opts.topColor ?? color;
    this.quad([[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], tc, [1, 1, 1, 1], W ? [[0.02, 0.02], [0.03, 0.02], [0.03, 0.03], [0.02, 0.03]] : undefined);
    if (!opts.noBottom) this.quad([[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], color, [0.6, 0.6, 0.6, 0.6]);
  }

  /** merge a three.js geometry (position/normal) with a transform and colour */
  add(g: THREE.BufferGeometry, m: THREE.Matrix4, color: number, shadeBottom = true): void {
    const p = g.getAttribute('position');
    const n = g.getAttribute('normal');
    const ind = g.getIndex();
    const nm = new THREE.Matrix3().getNormalMatrix(m);
    const v = new THREE.Vector3();
    const nv = new THREE.Vector3();
    this.c.setHex(color);
    const base = this.pos.length / 3;
    let minY = Infinity, maxY = -Infinity;
    const ys: number[] = [];
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(m);
      ys.push(v.y);
      minY = Math.min(minY, v.y); maxY = Math.max(maxY, v.y);
    }
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(m);
      nv.fromBufferAttribute(n, i).applyMatrix3(nm).normalize();
      const t = shadeBottom && maxY > minY ? 0.78 + 0.22 * ((ys[i] - minY) / (maxY - minY)) : 1;
      this.vert(v.x, v.y, v.z, nv.x, nv.y, nv.z, this.c.r * t, this.c.g * t, this.c.b * t);
    }
    if (ind) for (let i = 0; i < ind.count; i++) this.idx.push(base + ind.getX(i));
    else for (let i = 0; i < p.count; i++) this.idx.push(base + i);
  }

  private static tmpM = new THREE.Matrix4();
  cyl(cx: number, y0: number, cz: number, rTop: number, rBot: number, h: number, color: number, seg = 10): void {
    const g = new THREE.CylinderGeometry(rTop, rBot, h, seg, 1);
    Geo.tmpM.makeTranslation(cx, y0 + h / 2, cz);
    this.add(g, Geo.tmpM, color);
    g.dispose();
  }
  sphere(cx: number, cy: number, cz: number, r: number, color: number, sx = 1, sy = 1, sz = 1, seg = 8): void {
    const g = new THREE.SphereGeometry(r, seg, Math.max(4, seg - 2));
    Geo.tmpM.compose(new THREE.Vector3(cx, cy, cz), new THREE.Quaternion(), new THREE.Vector3(sx, sy, sz));
    this.add(g, Geo.tmpM, color);
    g.dispose();
  }
  torus(cx: number, cy: number, cz: number, R: number, r: number, color: number, rotX = 0, rotY = 0, arc = Math.PI * 2, seg = 24): void {
    const g = new THREE.TorusGeometry(R, r, 6, seg, arc);
    Geo.tmpM.compose(new THREE.Vector3(cx, cy, cz), new THREE.Quaternion().setFromEuler(new THREE.Euler(rotX, rotY, 0)), new THREE.Vector3(1, 1, 1));
    this.add(g, Geo.tmpM, color, false);
    g.dispose();
  }
  /** rotated box (yaw around Y, optional tilt around local X) */
  rbox(cx: number, cy: number, cz: number, sx: number, sy: number, sz: number, color: number, yaw = 0, tilt = 0): void {
    const g = new THREE.BoxGeometry(sx, sy, sz);
    Geo.tmpM.compose(new THREE.Vector3(cx, cy, cz), new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt, yaw, 0, 'YXZ')), new THREE.Vector3(1, 1, 1));
    this.add(g, Geo.tmpM, color);
    g.dispose();
  }

  get empty(): boolean {
    return this.pos.length === 0;
  }

  build(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setIndex(this.idx);
    g.computeBoundingSphere();
    g.computeBoundingBox();
    return g;
  }
}

export function windowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const g = c.getContext('2d')!;
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 64, 64);
  // window glass (darker teal) with a bright sill and a subtle highlight
  g.fillStyle = '#7fa4b3';
  g.fillRect(14, 12, 36, 34);
  g.fillStyle = '#a9ccd8';
  g.fillRect(14, 12, 36, 8);
  g.fillStyle = '#5b7f8f';
  g.fillRect(31, 12, 2, 34);
  g.fillStyle = '#e8e0d0';
  g.fillRect(11, 46, 42, 4);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
