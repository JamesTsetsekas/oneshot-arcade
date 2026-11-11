// renderer: visual effects. GPU-simulated particles (the CPU only writes spawn parameters), decorative
// projectile visuals that follow simulation-resolved hits, beams and ground decals.
import * as THREE from 'three';

const MAX_PARTICLES = 6000;
const MAX_PROJ = 256;
const MAX_BEAMS = 96;
const MAX_DECALS = 40;

interface ProjVis { active: boolean; sx: number; sy: number; sz: number; tx: number; ty: number; tz: number; target: number; t0: number; dur: number; arc: number; color: THREE.Color; size: number; trail: number }
interface BeamVis { ax: number; ay: number; az: number; bx: number; by: number; bz: number; t0: number; life: number; width: number; color: THREE.Color }
interface Decal { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; t0: number; life: number; r0: number; r1: number; kind: number; active: boolean; a0: number }

export class FxSystem {
  readonly group = new THREE.Group();
  time = 0;
  shake = 0;
  quality = 1;
  private pGeo: THREE.BufferGeometry;
  private pPos: Float32Array; private pVel: Float32Array; private pData: Float32Array; private pCol: Float32Array;
  private pNext = 0;
  private pDirty = false;
  private pMat: THREE.ShaderMaterial;
  private projs: ProjVis[] = [];
  private projMesh: THREE.InstancedMesh;
  private beams: BeamVis[] = [];
  private beamMesh: THREE.InstancedMesh;
  private decals: Decal[] = [];
  private ringGeo: THREE.BufferGeometry;
  private discGeo: THREE.BufferGeometry;
  private m4 = new THREE.Matrix4(); private q = new THREE.Quaternion(); private v = new THREE.Vector3(); private s = new THREE.Vector3(); private up = new THREE.Vector3(0, 0, 1); private dir = new THREE.Vector3();
  private col = new THREE.Color();
  /** resolves the current render position of an entity (for homing projectile visuals) */
  entityPos: (id: number, out: THREE.Vector3) => boolean = () => false;

  constructor() {
    // ---- particles
    this.pPos = new Float32Array(MAX_PARTICLES * 3); this.pVel = new Float32Array(MAX_PARTICLES * 3);
    this.pData = new Float32Array(MAX_PARTICLES * 4); this.pCol = new Float32Array(MAX_PARTICLES * 3);
    for (let i = 0; i < MAX_PARTICLES; i++) this.pData[i * 4] = -1000;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pPos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aVel', new THREE.BufferAttribute(this.pVel, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aData', new THREE.BufferAttribute(this.pData, 4).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aCol', new THREE.BufferAttribute(this.pCol, 3).setUsage(THREE.DynamicDrawUsage));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(80, 0, 80), 400);
    this.pGeo = g;
    this.pMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uScale: { value: 600 } },
      vertexShader: /* glsl */ `
        attribute vec3 aVel; attribute vec4 aData; attribute vec3 aCol;
        uniform float uTime; uniform float uScale;
        varying vec3 vCol; varying float vA;
        void main() {
          float age = uTime - aData.x;
          float t = age / aData.y;
          if (age < 0.0 || t > 1.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; return; }
          vec3 p = position + aVel * (1.0 - exp(-2.5 * age)) / 2.5 + vec3(0.0, -aData.w * age * age, 0.0);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = max(1.0, aData.z * uScale / -mv.z * (1.0 - t * 0.55));
          vCol = aCol; vA = 1.0 - t * t;
        }`,
      fragmentShader: /* glsl */ `
        varying vec3 vCol; varying float vA;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          float a = smoothstep(0.5, 0.05, d) * vA;
          gl_FragColor = vec4(vCol * a, a);
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const pts = new THREE.Points(g, this.pMat);
    pts.frustumCulled = false;
    pts.renderOrder = 20;
    this.group.add(pts);

    // ---- projectiles
    const pg = new THREE.OctahedronGeometry(0.5);
    pg.scale(0.35, 0.35, 1);
    this.projMesh = new THREE.InstancedMesh(pg, new THREE.MeshBasicMaterial({ toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }), MAX_PROJ);
    this.projMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.projMesh.frustumCulled = false; this.projMesh.count = 0; this.projMesh.renderOrder = 19;
    this.projMesh.setColorAt(0, this.col.set(1, 1, 1));
    this.group.add(this.projMesh);
    for (let i = 0; i < MAX_PROJ; i++) this.projs.push({ active: false, sx: 0, sy: 0, sz: 0, tx: 0, ty: 0, tz: 0, target: -1, t0: 0, dur: 1, arc: 0, color: new THREE.Color(), size: 1, trail: 0 });

    // ---- beams
    const bg = new THREE.BoxGeometry(1, 1, 1);
    bg.translate(0, 0, 0.5);
    this.beamMesh = new THREE.InstancedMesh(bg, new THREE.MeshBasicMaterial({ toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }), MAX_BEAMS);
    this.beamMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.beamMesh.frustumCulled = false; this.beamMesh.count = 0; this.beamMesh.renderOrder = 19;
    this.beamMesh.setColorAt(0, this.col.set(1, 1, 1));
    this.group.add(this.beamMesh);

    // ---- decals
    this.ringGeo = new THREE.RingGeometry(0.88, 1, 48); this.ringGeo.rotateX(-Math.PI / 2);
    this.discGeo = new THREE.CircleGeometry(1, 40); this.discGeo.rotateX(-Math.PI / 2);
    for (let i = 0; i < MAX_DECALS; i++) {
      const mat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0 });
      const mesh = new THREE.Mesh(this.ringGeo, mat);
      mesh.visible = false; mesh.renderOrder = 15;
      this.group.add(mesh);
      this.decals.push({ mesh, mat, t0: 0, life: 1, r0: 1, r1: 1, kind: 0, active: false, a0: 1 });
    }
  }

  setViewport(heightPx: number, fovDeg: number): void {
    this.pMat.uniforms.uScale.value = heightPx / (2 * Math.tan((fovDeg * Math.PI) / 360));
  }

  particle(x: number, y: number, z: number, vx: number, vy: number, vz: number, life: number, size: number, gravity: number, color: number, bright = 1): void {
    const i = this.pNext;
    this.pNext = (i + 1) % MAX_PARTICLES;
    this.pPos[i * 3] = x; this.pPos[i * 3 + 1] = y; this.pPos[i * 3 + 2] = z;
    this.pVel[i * 3] = vx; this.pVel[i * 3 + 1] = vy; this.pVel[i * 3 + 2] = vz;
    this.pData[i * 4] = this.time; this.pData[i * 4 + 1] = life; this.pData[i * 4 + 2] = size; this.pData[i * 4 + 3] = gravity;
    this.col.setHex(color, THREE.SRGBColorSpace);
    this.pCol[i * 3] = this.col.r * bright; this.pCol[i * 3 + 1] = this.col.g * bright; this.pCol[i * 3 + 2] = this.col.b * bright;
    this.pDirty = true;
  }

  burst(x: number, y: number, z: number, n: number, speed: number, life: number, size: number, color: number, up = 0.6, gravity = 3, bright = 1): void {
    n = Math.max(1, Math.round(n * this.quality));
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, u = Math.random();
      const sp = speed * (0.35 + Math.random() * 0.65);
      const h = Math.sqrt(1 - u * u * up * up);
      this.particle(x, y, z, Math.cos(a) * h * sp, (0.15 + u * up) * sp, Math.sin(a) * h * sp, life * (0.6 + Math.random() * 0.6), size * (0.6 + Math.random() * 0.7), gravity, color, bright);
    }
  }

  projectile(sx: number, sy: number, sz: number, tx: number, ty: number, tz: number, target: number, dur: number, arc: number, color: number, size: number, trail: number): void {
    for (const p of this.projs) {
      if (p.active) continue;
      p.active = true; p.sx = sx; p.sy = sy; p.sz = sz; p.tx = tx; p.ty = ty; p.tz = tz; p.target = target;
      p.t0 = this.time; p.dur = Math.max(0.03, dur); p.arc = arc; p.color.setHex(color, THREE.SRGBColorSpace); p.size = size; p.trail = trail;
      return;
    }
  }

  beam(ax: number, ay: number, az: number, bx: number, by: number, bz: number, color: number, width: number, life: number): void {
    if (this.beams.length >= MAX_BEAMS) this.beams.shift();
    this.beams.push({ ax, ay, az, bx, by, bz, t0: this.time, life, width, color: new THREE.Color().setHex(color, THREE.SRGBColorSpace) });
  }

  /** kind 0: ring r0->r1, 1: filled disc r0->r1 */
  decal(x: number, y: number, z: number, r0: number, r1: number, life: number, color: number, kind = 0, alpha = 0.9): void {
    let d = this.decals.find((c) => !c.active);
    if (!d) { d = this.decals[0]; for (const c of this.decals) if (c.t0 < d.t0) d = c; }
    d.active = true; d.t0 = this.time; d.life = life; d.r0 = r0; d.r1 = r1; d.kind = kind; d.a0 = alpha;
    d.mesh.geometry = kind === 1 ? this.discGeo : this.ringGeo;
    d.mat.color.setHex(color, THREE.SRGBColorSpace);
    d.mesh.position.set(x, y + 0.12, z);
    d.mesh.visible = true;
  }

  update(dt: number): void {
    this.time += dt;
    this.pMat.uniforms.uTime.value = this.time;
    if (this.pDirty) {
      for (const k of ['position', 'aVel', 'aData', 'aCol']) (this.pGeo.getAttribute(k) as THREE.BufferAttribute).needsUpdate = true;
      this.pDirty = false;
    }
    this.shake = Math.max(0, this.shake - dt * 5);
    // projectiles
    let n = 0;
    for (const p of this.projs) {
      if (!p.active) continue;
      const t = (this.time - p.t0) / p.dur;
      if (t >= 1) { p.active = false; continue; }
      if (p.target >= 0 && this.entityPos(p.target, this.v)) { p.tx = this.v.x; p.ty = this.v.y; p.tz = this.v.z; }
      const x = p.sx + (p.tx - p.sx) * t, z = p.sz + (p.tz - p.sz) * t;
      const y = p.sy + (p.ty - p.sy) * t + Math.sin(t * Math.PI) * p.arc;
      const t2 = Math.min(1, t + 0.04);
      this.dir.set(p.sx + (p.tx - p.sx) * t2 - x, p.sy + (p.ty - p.sy) * t2 + Math.sin(t2 * Math.PI) * p.arc - y, p.sz + (p.tz - p.sz) * t2 - z);
      if (this.dir.lengthSq() < 1e-8) this.dir.set(0, 0, 1);
      this.dir.normalize();
      this.q.setFromUnitVectors(this.up, this.dir);
      this.v.set(x, y, z);
      this.s.set(p.size, p.size, p.size * 1.6);
      this.m4.compose(this.v, this.q, this.s);
      this.projMesh.setMatrixAt(n, this.m4);
      this.projMesh.setColorAt(n, p.color);
      n++;
      if (p.trail > 0 && Math.random() < p.trail * this.quality) this.particle(x, y, z, (Math.random() - 0.5) * 0.4, 0.2, (Math.random() - 0.5) * 0.4, 0.35, p.size * 0.9, 0, p.color.getHex(THREE.SRGBColorSpace), 0.7);
    }
    this.projMesh.count = n;
    if (n > 0) { this.projMesh.instanceMatrix.needsUpdate = true; if (this.projMesh.instanceColor) this.projMesh.instanceColor.needsUpdate = true; }
    // beams
    n = 0;
    for (let i = this.beams.length - 1; i >= 0; i--) {
      const b = this.beams[i];
      const t = (this.time - b.t0) / b.life;
      if (t >= 1) { this.beams.splice(i, 1); continue; }
      this.dir.set(b.bx - b.ax, b.by - b.ay, b.bz - b.az);
      const len = this.dir.length();
      if (len < 1e-4) continue;
      this.dir.multiplyScalar(1 / len);
      this.q.setFromUnitVectors(this.up, this.dir);
      this.v.set(b.ax, b.ay, b.az);
      const w = b.width * (1 - t * 0.6);
      this.s.set(w, w, len);
      this.m4.compose(this.v, this.q, this.s);
      this.beamMesh.setMatrixAt(n, this.m4);
      this.col.copy(b.color).multiplyScalar(1 - t);
      this.beamMesh.setColorAt(n, this.col);
      n++;
    }
    this.beamMesh.count = n;
    if (n > 0) { this.beamMesh.instanceMatrix.needsUpdate = true; if (this.beamMesh.instanceColor) this.beamMesh.instanceColor.needsUpdate = true; }
    // decals
    for (const d of this.decals) {
      if (!d.active) continue;
      const t = (this.time - d.t0) / d.life;
      if (t >= 1) { d.active = false; d.mesh.visible = false; continue; }
      const r = d.r0 + (d.r1 - d.r0) * (d.kind === 1 ? t : 1 - (1 - t) * (1 - t));
      d.mesh.scale.set(r, 1, r);
      d.mat.opacity = d.a0 * (d.kind === 1 ? 0.25 + t * 0.3 : 1 - t);
    }
  }

  clear(): void {
    for (const p of this.projs) p.active = false;
    this.beams.length = 0;
    for (const d of this.decals) { d.active = false; d.mesh.visible = false; }
    for (let i = 0; i < MAX_PARTICLES; i++) this.pData[i * 4] = -1000;
    this.pDirty = true;
  }
}
