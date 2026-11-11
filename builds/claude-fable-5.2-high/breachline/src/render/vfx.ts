// renderer: pooled, capped effects - billboard particles, tracers, impact decals, explosions, obscurant clouds.
// Everything is drawn with thin instances (a handful of draw calls regardless of how much is happening).
import { Color3, CreateBox, CreatePlane, Mesh, Scene, StandardMaterial } from './bjs';
import type { Renderer } from './renderer';
import { radialTexture } from './textures';

interface Particle { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; max: number; size: number; grow: number; r: number; g: number; b: number; a: number; grav: number; drag: number; rot: number; spin: number }
interface Tracer { ax: number; ay: number; az: number; dx: number; dy: number; dz: number; len: number; s: number; r: number; g: number; b: number; w: number }
interface Volume { x: number; y: number; z: number; r: number; fade: number; seed: number }

const MAX_ALPHA = 520, MAX_ADD = 420, MAX_TRACER = 64, MAX_DECAL = 240;

class BillboardPool {
  mesh: Mesh;
  mat: Float32Array;
  col: Float32Array;
  list: Particle[] = [];
  constructor(scene: Scene, name: string, private max: number, additive: boolean, tex: string) {
    this.mesh = CreatePlane(name, { size: 1 }, scene);
    const m = new StandardMaterial(name + 'Mat', scene);
    // unlit: with lighting disabled the standard material outputs emissive * texture * instance colour
    m.disableLighting = true;
    m.diffuseColor = new Color3(0, 0, 0);
    m.emissiveColor = new Color3(1, 1, 1);
    m.specularColor = new Color3(0, 0, 0);
    const t = tex === 'soft'
      ? radialTexture(scene, name + 'Tex', [[0, 'rgba(255,255,255,1)'], [0.35, 'rgba(255,255,255,0.75)'], [0.7, 'rgba(255,255,255,0.25)'], [1, 'rgba(255,255,255,0)']])
      : radialTexture(scene, name + 'Tex', [[0, 'rgba(255,255,255,1)'], [0.2, 'rgba(255,255,255,0.9)'], [0.5, 'rgba(255,255,255,0.25)'], [1, 'rgba(255,255,255,0)']]);
    m.diffuseTexture = t;
    m.useAlphaFromDiffuseTexture = true;
    m.alphaMode = additive ? 1 : 2;
    m.disableDepthWrite = true;
    m.backFaceCulling = false;
    m.fogEnabled = !additive;
    this.mesh.material = m;
    this.mesh.hasVertexAlpha = true;
    this.mesh.isPickable = false;
    this.mesh.alwaysSelectAsActiveMesh = true;
    this.mesh.doNotSyncBoundingInfo = true;
    this.mat = new Float32Array(max * 16);
    this.col = new Float32Array(max * 4);
    this.mesh.thinInstanceSetBuffer('matrix', this.mat, 16, false);
    this.mesh.thinInstanceSetBuffer('color', this.col, 4, false);
    this.mesh.thinInstanceCount = 0;
  }
  add(p: Particle): void {
    if (this.list.length >= this.max) this.list.shift();
    this.list.push(p);
  }
  private write(i: number, x: number, y: number, z: number, size: number, rot: number, rx: number, ry: number, rz: number, ux: number, uy: number, uz: number, r: number, g: number, b: number, a: number): void {
    const o = i * 16, m = this.mat;
    const c = Math.cos(rot) * size, s = Math.sin(rot) * size;
    m[o] = rx * c + ux * s; m[o + 1] = ry * c + uy * s; m[o + 2] = rz * c + uz * s; m[o + 3] = 0;
    m[o + 4] = ux * c - rx * s; m[o + 5] = uy * c - ry * s; m[o + 6] = uz * c - rz * s; m[o + 7] = 0;
    m[o + 8] = 0; m[o + 9] = 0; m[o + 10] = size; m[o + 11] = 0;
    m[o + 12] = x; m[o + 13] = y; m[o + 14] = z; m[o + 15] = 1;
    const q = i * 4;
    this.col[q] = r; this.col[q + 1] = g; this.col[q + 2] = b; this.col[q + 3] = a;
  }
  update(dt: number, rx: number, ry: number, rz: number, ux: number, uy: number, uz: number, volumes: Volume[] | null): void {
    let n = 0;
    const list = this.list;
    let w = 0;
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      p.life -= dt;
      if (p.life <= 0) continue;
      const d = Math.exp(-p.drag * dt);
      p.vx *= d; p.vy = p.vy * d - p.grav * dt; p.vz *= d;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      p.size += p.grow * dt;
      p.rot += p.spin * dt;
      const t = p.life / p.max;
      const fade = Math.min(1, t * 2.2) * Math.min(1, (1 - t) * 12);
      if (n < this.max) this.write(n++, p.x, p.y, p.z, p.size, p.rot, rx, ry, rz, ux, uy, uz, p.r, p.g, p.b, p.a * fade);
      list[w++] = p;
    }
    list.length = w;
    if (volumes) {
      // obscurant: dense, authoritative-shaped cloud of large soft sprites (opaque on every quality tier)
      const time = performance.now() / 1000;
      for (const v of volumes) {
        let seed = v.seed * 9301 + 49297;
        const rnd = () => { seed = (seed * 233280 + 12345) % 2147483647; return seed / 2147483647; };
        for (let k = 0; k < 26 && n < this.max; k++) {
          const a = rnd() * 6.283, e = (rnd() - 0.35) * 1.3, rr = Math.cbrt(rnd()) * v.r * 0.72;
          const bob = Math.sin(time * 0.35 + k) * 0.25;
          const x = v.x + Math.cos(a) * Math.cos(e) * rr + bob * 0.4, y = v.y + Math.sin(e) * rr * 0.7 + 0.3 + bob * 0.2, z = v.z + Math.sin(a) * Math.cos(e) * rr;
          const sh = 0.7 + rnd() * 0.18;
          this.write(n++, x, y, z, v.r * (1.05 + rnd() * 0.5) * (0.35 + 0.65 * v.fade), time * 0.05 * (k % 2 ? 1 : -1) + k, rx, ry, rz, ux, uy, uz, sh, sh * 1.02, sh * 1.04, 0.95 * v.fade);
        }
      }
    }
    this.mesh.thinInstanceCount = n;
    if (n > 0) { this.mesh.thinInstanceBufferUpdated('matrix'); this.mesh.thinInstanceBufferUpdated('color'); }
  }
}

export class Vfx {
  shake = 0;
  volumes: Volume[] = [];
  private alpha: BillboardPool;
  private add: BillboardPool;
  private tracers: Tracer[] = [];
  private tracerMesh: Mesh;
  private tMat = new Float32Array(MAX_TRACER * 16);
  private tCol = new Float32Array(MAX_TRACER * 4);
  private decalMesh: Mesh;
  private dMat = new Float32Array(MAX_DECAL * 16);
  private dCol = new Float32Array(MAX_DECAL * 4);
  private decalN = 0;
  private decalI = 0;
  private printMesh: Mesh;
  private pMat = new Float32Array(96 * 16);
  private pCol = new Float32Array(96 * 4);
  private prints: { x: number; y: number; z: number; yaw: number; life: number }[] = [];

  constructor(private scene: Scene, private renderer: Renderer) {
    this.alpha = new BillboardPool(scene, 'pAlpha', MAX_ALPHA, false, 'soft');
    this.add = new BillboardPool(scene, 'pAdd', MAX_ADD, true, 'hot');
    const mk = (name: string, mesh: Mesh, additive: boolean, color: Color3 | null, tex: boolean): StandardMaterial => {
      const m = new StandardMaterial(name, scene);
      m.disableLighting = true;
      m.diffuseColor = new Color3(0, 0, 0);
      m.emissiveColor = color ?? new Color3(1, 1, 1);
      m.specularColor = new Color3(0, 0, 0);
      if (tex) { m.diffuseTexture = radialTexture(scene, name + 'T', [[0, 'rgba(255,255,255,1)'], [0.45, 'rgba(255,255,255,0.8)'], [1, 'rgba(255,255,255,0)']], 64); m.useAlphaFromDiffuseTexture = true; }
      m.alphaMode = additive ? 1 : 2;
      m.disableDepthWrite = true;
      m.backFaceCulling = false;
      m.zOffset = -2;
      mesh.material = m;
      mesh.hasVertexAlpha = true;
      mesh.isPickable = false;
      mesh.alwaysSelectAsActiveMesh = true;
      mesh.doNotSyncBoundingInfo = true;
      return m;
    };
    this.tracerMesh = CreateBox('tracers', { size: 1 }, scene);
    mk('tracerMat', this.tracerMesh, true, null, false);
    this.tracerMesh.thinInstanceSetBuffer('matrix', this.tMat, 16, false);
    this.tracerMesh.thinInstanceSetBuffer('color', this.tCol, 4, false);
    this.tracerMesh.thinInstanceCount = 0;
    this.decalMesh = CreatePlane('decals', { size: 1 }, scene);
    mk('decalMat', this.decalMesh, false, null, true);
    this.decalMesh.thinInstanceSetBuffer('matrix', this.dMat, 16, false);
    this.decalMesh.thinInstanceSetBuffer('color', this.dCol, 4, false);
    this.decalMesh.thinInstanceCount = 0;
    this.printMesh = CreatePlane('prints', { size: 1 }, scene);
    mk('printMat', this.printMesh, true, null, true);
    this.printMesh.thinInstanceSetBuffer('matrix', this.pMat, 16, false);
    this.printMesh.thinInstanceSetBuffer('color', this.pCol, 4, false);
    this.printMesh.thinInstanceCount = 0;
  }

  private p(pool: BillboardPool, x: number, y: number, z: number, vx: number, vy: number, vz: number, life: number, size: number, grow: number, r: number, g: number, b: number, a: number, grav = 0, drag = 1.5): void {
    pool.add({ x, y, z, vx, vy, vz, life, max: life, size, grow, r, g, b, a, grav, drag, rot: Math.random() * 6.28, spin: (Math.random() - 0.5) * 2 });
  }

  /** Bullet impact: decal + a short surface-specific puff (kept under 100 ms of visual obstruction). surf: 1 concrete 2 metal 3 wood 4 glass 5 dirt 6 flesh */
  impact(x: number, y: number, z: number, nx: number, ny: number, nz: number, surf: number): void {
    const R = Math.random;
    if (surf === 6) {
      for (let i = 0; i < 5; i++) this.p(this.alpha, x, y, z, nx * 1.5 + (R() - 0.5) * 2, ny + R() * 1.5, nz * 1.5 + (R() - 0.5) * 2, 0.22 + R() * 0.12, 0.1, 0.9, 0.55, 0.06, 0.05, 0.75, 6, 3);
      return;
    }
    const col = surf === 2 ? [0.75, 0.75, 0.78] : surf === 3 ? [0.62, 0.48, 0.3] : surf === 5 ? [0.5, 0.47, 0.4] : surf === 4 ? [0.8, 0.92, 0.95] : [0.72, 0.71, 0.68];
    for (let i = 0; i < 4; i++) this.p(this.alpha, x + nx * 0.05, y + ny * 0.05, z + nz * 0.05, nx * (1 + R() * 2) + (R() - 0.5) * 1.5, ny * (1 + R() * 2) + R(), nz * (1 + R() * 2) + (R() - 0.5) * 1.5, 0.28 + R() * 0.2, 0.09, 1.1, col[0], col[1], col[2], 0.5, 1.5, 4);
    if (surf === 2 || surf === 1) for (let i = 0; i < (surf === 2 ? 6 : 2); i++) this.p(this.add, x, y, z, nx * 3 + (R() - 0.5) * 6, ny * 3 + R() * 4, nz * 3 + (R() - 0.5) * 6, 0.12 + R() * 0.16, 0.035, -0.1, 1, 0.75, 0.35, 1, 12, 1);
    if (surf !== 4) this.decal(x, y, z, nx, ny, nz, 0.07 + R() * 0.05, surf === 2 ? 0.5 : 0.75);
  }

  decal(x: number, y: number, z: number, nx: number, ny: number, nz: number, size: number, alpha: number): void {
    // basis around the normal
    let tx = ny * 0 - nz * 1, ty = nz * 0 - nx * 0, tz = nx * 1 - ny * 0;
    if (Math.abs(ny) > 0.9) { tx = 1; ty = 0; tz = 0; }
    const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
    const bx = ny * tz - nz * ty, by = nz * tx - nx * tz, bz = nx * ty - ny * tx;
    const i = this.decalI, o = i * 16, m = this.dMat;
    m[o] = tx * size; m[o + 1] = ty * size; m[o + 2] = tz * size; m[o + 3] = 0;
    m[o + 4] = bx * size; m[o + 5] = by * size; m[o + 6] = bz * size; m[o + 7] = 0;
    m[o + 8] = nx; m[o + 9] = ny; m[o + 10] = nz; m[o + 11] = 0;
    m[o + 12] = x + nx * 0.012; m[o + 13] = y + ny * 0.012; m[o + 14] = z + nz * 0.012; m[o + 15] = 1;
    this.dCol[i * 4] = 0.05; this.dCol[i * 4 + 1] = 0.05; this.dCol[i * 4 + 2] = 0.05; this.dCol[i * 4 + 3] = alpha;
    this.decalI = (i + 1) % MAX_DECAL;
    this.decalN = Math.min(MAX_DECAL, this.decalN + 1);
    this.decalMesh.thinInstanceCount = this.decalN;
    this.decalMesh.thinInstanceBufferUpdated('matrix');
    this.decalMesh.thinInstanceBufferUpdated('color');
  }

  tracer(ax: number, ay: number, az: number, bx: number, by: number, bz: number, friendly: boolean, own: boolean): void {
    const dx = bx - ax, dy = by - ay, dz = bz - az;
    const len = Math.hypot(dx, dy, dz);
    if (len < 2.5) return;
    if (this.tracers.length >= MAX_TRACER) this.tracers.shift();
    this.tracers.push({ ax, ay, az, dx: dx / len, dy: dy / len, dz: dz / len, len, s: own ? 1.5 : 0.5, r: friendly ? 0.75 : 1, g: friendly ? 0.9 : 0.72, b: friendly ? 1 : 0.4, w: own ? 0.014 : 0.022 });
  }

  /** World-space muzzle flash for other operators. */
  muzzle(x: number, y: number, z: number, dx: number, dy: number, dz: number, suppressed: boolean): void {
    if (suppressed) { this.p(this.alpha, x, y, z, dx * 2, dy * 2 + 0.3, dz * 2, 0.18, 0.08, 0.8, 0.7, 0.7, 0.7, 0.3, 0, 3); return; }
    this.p(this.add, x + dx * 0.1, y + dy * 0.1, z + dz * 0.1, dx * 2, dy * 2, dz * 2, 0.055, 0.42, 1, 1, 0.8, 0.45, 1, 0, 0);
    this.p(this.add, x + dx * 0.3, y + dy * 0.3, z + dz * 0.3, dx * 4, dy * 4, dz * 4, 0.04, 0.26, 1, 1, 0.9, 0.6, 0.9, 0, 0);
  }

  shellCasing(x: number, y: number, z: number, vx: number, vy: number, vz: number): void {
    this.p(this.add, x, y, z, vx, vy, vz, 0.5, 0.022, 0, 0.95, 0.72, 0.3, 0.9, 9.8, 0.6);
  }

  explosion(x: number, y: number, z: number, radius: number, kind: string, camDist: number): void {
    const R = Math.random;
    if (kind === 'flash') {
      this.p(this.add, x, y, z, 0, 0, 0, 0.16, 5, 22, 1, 1, 1, 1, 0, 0);
      for (let i = 0; i < 10; i++) this.p(this.add, x, y, z, (R() - 0.5) * 16, R() * 10, (R() - 0.5) * 16, 0.3 + R() * 0.3, 0.07, 0, 1, 1, 1, 1, 10, 1);
      this.light(x, y + 0.4, z, 14, 1, 1, 1);
      return;
    }
    if (kind === 'smoke') {
      for (let i = 0; i < 12; i++) this.p(this.alpha, x, y + 0.3, z, (R() - 0.5) * 6, R() * 3, (R() - 0.5) * 6, 1.1 + R(), 1.2, 2.2, 0.78, 0.8, 0.82, 0.8, -0.3, 1.8);
      return;
    }
    if (kind === 'device') {
      for (let i = 0; i < 14; i++) this.p(this.add, x, y, z, (R() - 0.5) * 10, R() * 7, (R() - 0.5) * 10, 0.3 + R() * 0.4, 0.05, 0, 1, 0.8, 0.4, 1, 10, 1);
      for (let i = 0; i < 5; i++) this.p(this.alpha, x, y, z, (R() - 0.5) * 2, R() * 2, (R() - 0.5) * 2, 0.8 + R() * 0.5, 0.5, 1.2, 0.25, 0.25, 0.27, 0.7, -0.4, 1.5);
      this.light(x, y, z, 5, 1, 0.8, 0.5);
      return;
    }
    const big = radius > 6;
    this.p(this.add, x, y + 0.4, z, 0, 0, 0, 0.14, radius * 0.9, radius * 6, 1, 0.95, 0.8, 1, 0, 0);
    for (let i = 0; i < (big ? 16 : 11); i++) {
      const a = R() * 6.28, sp = 2 + R() * 6;
      this.p(this.add, x, y + 0.3, z, Math.cos(a) * sp, 1.5 + R() * 5, Math.sin(a) * sp, 0.3 + R() * 0.3, 0.8 + R() * 0.8, 3.5, 1, 0.55 + R() * 0.25, 0.18, 0.95, -1, 3);
    }
    for (let i = 0; i < (big ? 16 : 10); i++) {
      const a = R() * 6.28, sp = 1 + R() * 3.5;
      this.p(this.alpha, x + Math.cos(a) * 0.6, y + 0.5, z + Math.sin(a) * 0.6, Math.cos(a) * sp, 1.2 + R() * 3.2, Math.sin(a) * sp, 1.6 + R() * 1.6, 1.1 + R(), 1.6, 0.2 + R() * 0.1, 0.2 + R() * 0.1, 0.21, 0.8, -0.25, 1.6);
    }
    for (let i = 0; i < 22; i++) {
      const a = R() * 6.28, sp = 5 + R() * 14;
      this.p(this.add, x, y + 0.3, z, Math.cos(a) * sp, 3 + R() * 12, Math.sin(a) * sp, 0.5 + R() * 0.7, 0.05, 0, 1, 0.8, 0.4, 1, 14, 0.8);
    }
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * 6.28;
      this.p(this.alpha, x + Math.cos(a) * 0.8, y + 0.15, z + Math.sin(a) * 0.8, Math.cos(a) * radius * 1.3, 0.4, Math.sin(a) * radius * 1.3, 0.9, 0.9, 1.8, 0.62, 0.6, 0.55, 0.45, 0, 2.6);
    }
    this.decal(x, y - 0.25, z, 0, 1, 0, radius * 0.55, 0.55);
    this.light(x, y + 0.8, z, big ? 26 : 18, 1, 0.72, 0.42);
    this.shake = Math.max(this.shake, Math.max(0, 1.2 - camDist / (radius * 3.2)));
  }

  private light(x: number, y: number, z: number, intensity: number, r: number, g: number, b: number): void {
    const l = this.renderer.blastLight;
    l.position.set(x, y, z);
    l.diffuse.set(r, g, b);
    l.intensity = intensity;
  }

  glassShatter(x: number, y: number, z: number): void {
    const R = Math.random;
    for (let i = 0; i < 26; i++) this.p(this.add, x + (R() - 0.5) * 2.4, y + (R() - 0.5) * 1.2, z + (R() - 0.5) * 2.4, (R() - 0.5) * 4, R() * 2, (R() - 0.5) * 4, 0.5 + R() * 0.5, 0.05 + R() * 0.05, 0, 0.7, 0.9, 1, 0.8, 11, 0.6);
    for (let i = 0; i < 6; i++) this.p(this.alpha, x, y, z, (R() - 0.5) * 2, R(), (R() - 0.5) * 2, 0.5, 0.5, 1, 0.85, 0.93, 0.96, 0.25, 0, 2);
  }

  dust(x: number, y: number, z: number, amount: number): void {
    const R = Math.random;
    for (let i = 0; i < amount; i++) this.p(this.alpha, x + (R() - 0.5) * 0.4, y + 0.05, z + (R() - 0.5) * 0.4, (R() - 0.5) * 1.2, 0.3 + R() * 0.5, (R() - 0.5) * 1.2, 0.5 + R() * 0.4, 0.2, 0.7, 0.72, 0.7, 0.66, 0.22, 0, 2.5);
  }

  /** Vertical dust column + sparks along a strafing run. */
  strafeHit(x: number, y: number, z: number): void {
    const R = Math.random;
    for (let i = 0; i < 4; i++) this.p(this.alpha, x + (R() - 0.5), y + 0.2, z + (R() - 0.5), (R() - 0.5) * 2, 4 + R() * 6, (R() - 0.5) * 2, 0.9 + R() * 0.6, 0.7, 1.6, 0.6, 0.58, 0.52, 0.6, 3, 1.2);
    for (let i = 0; i < 4; i++) this.p(this.add, x, y + 0.2, z, (R() - 0.5) * 8, 3 + R() * 9, (R() - 0.5) * 8, 0.3 + R() * 0.3, 0.06, 0, 1, 0.8, 0.4, 1, 14, 0.8);
    this.p(this.add, x, y + 0.4, z, 0, 0, 0, 0.09, 1.6, 6, 1, 0.85, 0.6, 0.9, 0, 0);
  }

  footprint(x: number, y: number, z: number, yaw: number): void {
    if (this.prints.length >= 96) this.prints.shift();
    this.prints.push({ x, y: y + 0.03, z, yaw, life: 5 });
  }

  update(dt: number): void {
    const v = this.renderer.camera.getViewMatrix().m;
    const rx = v[0], ry = v[4], rz = v[8], ux = v[1], uy = v[5], uz = v[9];
    this.alpha.update(dt, rx, ry, rz, ux, uy, uz, this.volumes);
    this.add.update(dt, rx, ry, rz, ux, uy, uz, null);
    this.shake = Math.max(0, this.shake - dt * 2.4);
    // tracers
    let n = 0;
    const cam = this.renderer.camera.position;
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      t.s += dt * 260;
      const head = Math.min(t.len, t.s), tail = Math.max(0, t.s - Math.min(9, t.len * 0.5));
      if (tail >= t.len) { this.tracers.splice(i, 1); continue; }
      const L = head - tail, c = (head + tail) / 2;
      // build basis: z along dir, x toward camera-perpendicular
      const px = t.ax + t.dx * c, py = t.ay + t.dy * c, pz = t.az + t.dz * c;
      let sx = t.dy * (cam.z - pz) - t.dz * (cam.y - py), sy = t.dz * (cam.x - px) - t.dx * (cam.z - pz), sz = t.dx * (cam.y - py) - t.dy * (cam.x - px);
      const sl = Math.hypot(sx, sy, sz) || 1; sx /= sl; sy /= sl; sz /= sl;
      const wx = t.dy * sz - t.dz * sy, wy = t.dz * sx - t.dx * sz, wz = t.dx * sy - t.dy * sx;
      const o = n * 16, m = this.tMat;
      m[o] = sx * t.w; m[o + 1] = sy * t.w; m[o + 2] = sz * t.w; m[o + 3] = 0;
      m[o + 4] = wx * t.w * 0.3; m[o + 5] = wy * t.w * 0.3; m[o + 6] = wz * t.w * 0.3; m[o + 7] = 0;
      m[o + 8] = t.dx * L; m[o + 9] = t.dy * L; m[o + 10] = t.dz * L; m[o + 11] = 0;
      m[o + 12] = px; m[o + 13] = py; m[o + 14] = pz; m[o + 15] = 1;
      this.tCol[n * 4] = t.r; this.tCol[n * 4 + 1] = t.g; this.tCol[n * 4 + 2] = t.b; this.tCol[n * 4 + 3] = 0.85;
      n++;
    }
    this.tracerMesh.thinInstanceCount = n;
    if (n) { this.tracerMesh.thinInstanceBufferUpdated('matrix'); this.tracerMesh.thinInstanceBufferUpdated('color'); }
    // Trace Reader footprints
    let pn = 0;
    for (let i = this.prints.length - 1; i >= 0; i--) {
      const p = this.prints[i];
      p.life -= dt;
      if (p.life <= 0) { this.prints.splice(i, 1); continue; }
      const o = pn * 16, m = this.pMat, c = Math.cos(p.yaw), s = Math.sin(p.yaw);
      m[o] = c * 0.16; m[o + 1] = 0; m[o + 2] = -s * 0.16; m[o + 3] = 0;
      m[o + 4] = s * 0.34; m[o + 5] = 0; m[o + 6] = c * 0.34; m[o + 7] = 0;
      m[o + 8] = 0; m[o + 9] = 1; m[o + 10] = 0; m[o + 11] = 0;
      m[o + 12] = p.x; m[o + 13] = p.y; m[o + 14] = p.z; m[o + 15] = 1;
      this.pCol[pn * 4] = 1; this.pCol[pn * 4 + 1] = 0.55; this.pCol[pn * 4 + 2] = 0.15; this.pCol[pn * 4 + 3] = Math.min(0.8, p.life * 0.3);
      pn++;
    }
    this.printMesh.thinInstanceCount = pn;
    if (pn) { this.printMesh.thinInstanceBufferUpdated('matrix'); this.printMesh.thinInstanceBufferUpdated('color'); }
  }

  /** True when a point is inside any obscurant volume (camera overlay). */
  insideSmoke(x: number, y: number, z: number): number {
    let best = 0;
    for (const v of this.volumes) {
      const d = Math.hypot(v.x - x, v.y - y, v.z - z);
      if (d < v.r) best = Math.max(best, Math.min(1, (v.r - d) / 1.2) * v.fade);
    }
    return best;
  }

  clear(): void {
    this.alpha.list.length = 0; this.add.list.length = 0; this.tracers.length = 0; this.volumes.length = 0; this.prints.length = 0;
    this.decalN = 0; this.decalI = 0; this.decalMesh.thinInstanceCount = 0;
  }
}
