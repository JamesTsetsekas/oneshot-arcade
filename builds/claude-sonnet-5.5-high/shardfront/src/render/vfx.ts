// renderer: cosmetic effects. Everything here is presentation only; gameplay (damage, hits) is resolved in the simulation.
import * as THREE from 'three';

const MAXP = 5000;

export class Vfx {
  group = new THREE.Group();
  private pos = new Float32Array(MAXP * 3);
  private col = new Float32Array(MAXP * 3);
  private siz = new Float32Array(MAXP);
  private vel = new Float32Array(MAXP * 3);
  private life = new Float32Array(MAXP);
  private maxLife = new Float32Array(MAXP);
  private grav = new Float32Array(MAXP);
  private base = new Float32Array(MAXP);
  private alpha = new Float32Array(MAXP);
  private n = 0;
  private points: THREE.Points;
  private mat: THREE.ShaderMaterial;
  private beams: THREE.Mesh[] = [];
  private beamT: number[] = [];
  private rings: THREE.Mesh[] = [];
  private ringData: Array<{ t: number; dur: number; r0: number; r1: number; active: boolean }> = [];
  private ringGeo = new THREE.RingGeometry(0.88, 1, 40);
  private tmpC = new THREE.Color();
  private telegraphs: THREE.Mesh[] = [];
  private bolts: THREE.Points;
  private boltPos = new Float32Array(300 * 3);
  private boltCol = new Float32Array(300 * 3);
  private boltSiz = new Float32Array(300);
  private boltAlpha = new Float32Array(300);
  reduced = false;
  density = 1;

  constructor() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    g.setAttribute('size', new THREE.BufferAttribute(this.siz, 1));
    g.setAttribute('alpha', new THREE.BufferAttribute(this.alpha, 1));
    this.mat = new THREE.ShaderMaterial({
      uniforms: { uPx: { value: 600 } },
      vertexShader: `attribute float size; attribute float alpha; attribute vec3 color; varying vec3 vC; varying float vA; uniform float uPx;
        void main(){ vC=color; vA=alpha; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=max(1.0,size*uPx/-mv.z); gl_Position=projectionMatrix*mv; }`,
      fragmentShader: `varying vec3 vC; varying float vA; void main(){ vec2 d=gl_PointCoord-0.5; float r=length(d)*2.0; float a=smoothstep(1.0,0.0,r); gl_FragColor=vec4(vC*(1.0+a),a*vA); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(g, this.mat);
    this.points.frustumCulled = false;
    this.group.add(this.points);
    // projectile heads
    const bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.BufferAttribute(this.boltPos, 3));
    bg.setAttribute('color', new THREE.BufferAttribute(this.boltCol, 3));
    bg.setAttribute('size', new THREE.BufferAttribute(this.boltSiz, 1));
    bg.setAttribute('alpha', new THREE.BufferAttribute(this.boltAlpha, 1));
    this.bolts = new THREE.Points(bg, this.mat);
    this.bolts.frustumCulled = false;
    this.group.add(this.bolts);
    // beams
    const bgeo = new THREE.BoxGeometry(1, 1, 1);
    for (let i = 0; i < 24; i++) {
      const m = new THREE.Mesh(bgeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
      m.visible = false;
      this.beams.push(m); this.beamT.push(0);
      this.group.add(m);
    }
    for (let i = 0; i < 40; i++) {
      const m = new THREE.Mesh(this.ringGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      m.rotation.x = -Math.PI / 2;
      m.visible = false;
      this.rings.push(m); this.ringData.push({ t: 0, dur: 1, r0: 1, r1: 1, active: false });
      this.group.add(m);
    }
    for (let i = 0; i < 12; i++) {
      const m = new THREE.Mesh(new THREE.CircleGeometry(1, 36), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, depthWrite: false, side: THREE.DoubleSide }));
      m.rotation.x = -Math.PI / 2;
      m.visible = false;
      this.telegraphs.push(m);
      this.group.add(m);
    }
  }

  setViewport(heightPx: number, fovDeg: number) {
    this.mat.uniforms.uPx.value = heightPx / (2 * Math.tan((fovDeg * Math.PI) / 360));
  }

  emit(x: number, y: number, z: number, vx: number, vy: number, vz: number, life: number, size: number, color: number, grav = 0, alpha = 1) {
    if (this.n >= MAXP) return;
    const i = this.n++;
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z;
    this.vel[i * 3] = vx; this.vel[i * 3 + 1] = vy; this.vel[i * 3 + 2] = vz;
    this.life[i] = life; this.maxLife[i] = life; this.siz[i] = size; this.base[i] = size; this.grav[i] = grav; this.alpha[i] = alpha;
    this.tmpC.setHex(color);
    this.col[i * 3] = this.tmpC.r; this.col[i * 3 + 1] = this.tmpC.g; this.col[i * 3 + 2] = this.tmpC.b;
  }

  burst(x: number, y: number, z: number, n: number, color: number, speed: number, life: number, size: number, grav = 3) {
    n = Math.max(1, Math.round(n * this.density));
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, e = Math.random() * 1.2 - 0.2;
      const sp = speed * (0.4 + Math.random() * 0.8);
      this.emit(x, y, z, Math.cos(a) * sp, Math.max(0.1, e) * sp, Math.sin(a) * sp, life * (0.6 + Math.random() * 0.6), size * (0.7 + Math.random() * 0.6), color, grav);
    }
  }

  flash(x: number, y: number, z: number, color: number, size: number) {
    this.emit(x, y, z, 0, 0, 0, 0.09, size, color, 0, 1);
  }

  beam(ax: number, ay: number, az: number, bx: number, by: number, bz: number, color: number, width: number, dur: number) {
    let k = this.beamT.findIndex((t) => t <= 0);
    if (k < 0) k = 0;
    const m = this.beams[k];
    const dx = bx - ax, dy = by - ay, dz = bz - az;
    const len = Math.hypot(dx, dy, dz);
    m.position.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2);
    m.scale.set(len, width, width);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), new THREE.Vector3(dx / len, dy / len, dz / len));
    (m.material as THREE.MeshBasicMaterial).color.setHex(color);
    m.visible = true;
    this.beamT[k] = dur;
    (m as THREE.Mesh & { dur?: number }).dur = dur;
  }

  ring(x: number, y: number, z: number, r0: number, r1: number, dur: number, color: number) {
    let k = this.ringData.findIndex((r) => !r.active);
    if (k < 0) k = 0;
    const d = this.ringData[k];
    d.t = 0; d.dur = dur; d.r0 = r0; d.r1 = r1; d.active = true;
    const m = this.rings[k];
    m.position.set(x, y + 0.08, z);
    (m.material as THREE.MeshBasicMaterial).color.setHex(color);
    m.visible = true;
    m.scale.set(r0, r0, 1);
  }

  /** telegraph decals for pending ground effects (re-set every frame) */
  setTelegraphs(list: Array<{ x: number; y: number; z: number; r: number; color: number; fill: number }>) {
    for (let i = 0; i < this.telegraphs.length; i++) {
      const m = this.telegraphs[i];
      const t = list[i];
      if (!t) { m.visible = false; continue; }
      m.visible = true;
      m.position.set(t.x, t.y + 0.1, t.z);
      m.scale.set(t.r, t.r, 1);
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.color.setHex(t.color);
      mat.opacity = 0.12 + 0.3 * t.fill;
    }
  }

  setBolts(list: Array<{ x: number; y: number; z: number; color: number; size: number }>) {
    const n = Math.min(300, list.length);
    for (let i = 0; i < n; i++) {
      const b = list[i];
      this.boltPos[i * 3] = b.x; this.boltPos[i * 3 + 1] = b.y; this.boltPos[i * 3 + 2] = b.z;
      this.tmpC.setHex(b.color);
      this.boltCol[i * 3] = this.tmpC.r; this.boltCol[i * 3 + 1] = this.tmpC.g; this.boltCol[i * 3 + 2] = this.tmpC.b;
      this.boltSiz[i] = b.size; this.boltAlpha[i] = 1;
    }
    for (let i = n; i < 300; i++) { this.boltSiz[i] = 0; this.boltAlpha[i] = 0; this.boltPos[i * 3 + 1] = -50; }
    const g = this.bolts.geometry;
    (g.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (g.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    (g.attributes.size as THREE.BufferAttribute).needsUpdate = true;
    (g.attributes.alpha as THREE.BufferAttribute).needsUpdate = true;
  }

  update(dt: number) {
    let w = 0;
    for (let i = 0; i < this.n; i++) {
      const l = this.life[i] - dt;
      if (l <= 0) continue;
      const j = w++;
      if (j !== i) {
        for (let k = 0; k < 3; k++) { this.pos[j * 3 + k] = this.pos[i * 3 + k]; this.vel[j * 3 + k] = this.vel[i * 3 + k]; this.col[j * 3 + k] = this.col[i * 3 + k]; }
        this.siz[j] = this.siz[i]; this.maxLife[j] = this.maxLife[i]; this.grav[j] = this.grav[i]; this.base[j] = this.base[i]; this.alpha[j] = this.alpha[i];
      }
      this.life[j] = l;
      this.vel[j * 3 + 1] -= this.grav[j] * dt;
      this.pos[j * 3] += this.vel[j * 3] * dt; this.pos[j * 3 + 1] += this.vel[j * 3 + 1] * dt; this.pos[j * 3 + 2] += this.vel[j * 3 + 2] * dt;
      if (this.pos[j * 3 + 1] < 0 && this.grav[j] > 0) { this.pos[j * 3 + 1] = 0; this.vel[j * 3 + 1] *= -0.3; }
      const t = l / this.maxLife[j];
      this.siz[j] = this.base[j] * (0.35 + 0.65 * t);
      this.alpha[j] = Math.min(1, t * 2);
    }
    for (let i = w; i < this.n; i++) this.siz[i] = 0;
    this.n = w;
    const g = this.points.geometry;
    for (const k of ['position', 'color', 'size', 'alpha']) (g.attributes[k] as THREE.BufferAttribute).needsUpdate = true;
    g.setDrawRange(0, Math.max(w, 1));
    for (let i = 0; i < this.beams.length; i++) {
      if (this.beamT[i] > 0) {
        this.beamT[i] -= dt;
        const m = this.beams[i];
        const d = (m as THREE.Mesh & { dur?: number }).dur ?? 0.1;
        (m.material as THREE.MeshBasicMaterial).opacity = Math.max(0, this.beamT[i] / d);
        if (this.beamT[i] <= 0) m.visible = false;
      }
    }
    for (let i = 0; i < this.rings.length; i++) {
      const d = this.ringData[i];
      if (!d.active) continue;
      d.t += dt;
      const k = d.t / d.dur;
      const m = this.rings[i];
      if (k >= 1) { d.active = false; m.visible = false; continue; }
      const r = d.r0 + (d.r1 - d.r0) * (1 - (1 - k) * (1 - k));
      m.scale.set(r, r, 1);
      (m.material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.9;
    }
  }
}
