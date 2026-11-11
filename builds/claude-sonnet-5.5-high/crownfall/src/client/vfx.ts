/** Pooled VFX: one-draw-call GPU-style particle cloud plus ground decals (rings, cones, rects, beams, zones). */
import * as THREE from 'three';

function canvasTex(size: number, draw: (c: CanvasRenderingContext2D, s: number) => void): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  draw(cv.getContext('2d')!, size);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class Particles {
  readonly max: number;
  readonly points: THREE.Points;
  private pos: Float32Array; private col: Float32Array; private size: Float32Array; private alpha: Float32Array;
  private vel: Float32Array; private life: Float32Array; private age: Float32Array; private grav: Float32Array; private base: Float32Array;
  private head = 0;
  low = false;
  constructor(max = 5000) {
    this.max = max;
    this.pos = new Float32Array(max * 3); this.col = new Float32Array(max * 3); this.size = new Float32Array(max); this.alpha = new Float32Array(max);
    this.vel = new Float32Array(max * 3); this.life = new Float32Array(max); this.age = new Float32Array(max).fill(1e9); this.grav = new Float32Array(max); this.base = new Float32Array(max);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('color', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('size', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('alpha', new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage));
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { scale: { value: 700 } },
      vertexShader: `attribute float size; attribute float alpha; attribute vec3 color; varying float vA; varying vec3 vC; uniform float scale;
        void main(){ vA = alpha; vC = color; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = size * scale / -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `varying float vA; varying vec3 vC; void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d); if (r > 0.5) discard; float a = smoothstep(0.5, 0.0, r) * vA; gl_FragColor = vec4(vC * a * 1.4, a); }`,
    });
    this.points = new THREE.Points(g, m);
    this.points.frustumCulled = false;
    this.points.renderOrder = 20;
  }
  setScale(h: number) { (this.points.material as THREE.ShaderMaterial).uniforms.scale.value = h * 0.9; }
  emit(x: number, y: number, z: number, vx: number, vy: number, vz: number, color: number, size: number, life: number, grav = 0) {
    const i = this.head; this.head = (this.head + 1) % this.max;
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z;
    this.vel[i * 3] = vx; this.vel[i * 3 + 1] = vy; this.vel[i * 3 + 2] = vz;
    const c = new THREE.Color(color);
    this.col[i * 3] = c.r; this.col[i * 3 + 1] = c.g; this.col[i * 3 + 2] = c.b;
    this.base[i] = size; this.size[i] = size; this.life[i] = life; this.age[i] = 0; this.grav[i] = grav; this.alpha[i] = 1;
  }
  burst(x: number, y: number, z: number, color: number, n: number, speed: number, life = 0.6, size = 0.35, grav = 4) {
    const count = this.low ? Math.ceil(n * 0.4) : n;
    for (let k = 0; k < count; k++) {
      const a = Math.random() * Math.PI * 2, e = Math.random() * 1.2 - 0.1, s = speed * (0.4 + Math.random() * 0.8);
      this.emit(x, y, z, Math.cos(a) * s * Math.cos(e), Math.sin(e) * s + speed * 0.3, Math.sin(a) * s * Math.cos(e), color, size * (0.6 + Math.random() * 0.8), life * (0.6 + Math.random() * 0.7), grav);
    }
  }
  update(dt: number) {
    for (let i = 0; i < this.max; i++) {
      const a = this.age[i];
      if (a >= this.life[i]) { this.alpha[i] = 0; continue; }
      this.age[i] = a + dt;
      this.vel[i * 3 + 1] -= this.grav[i] * dt;
      this.pos[i * 3] += this.vel[i * 3] * dt; this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt; this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      if (this.pos[i * 3 + 1] < 0.05) { this.pos[i * 3 + 1] = 0.05; this.vel[i * 3 + 1] *= -0.3; }
      const t = this.age[i] / this.life[i];
      this.alpha[i] = (1 - t) * (t < 0.1 ? t * 10 : 1);
      this.size[i] = this.base[i] * (1 - t * 0.5);
    }
    const g = this.points.geometry;
    (g.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (g.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    (g.attributes.size as THREE.BufferAttribute).needsUpdate = true;
    (g.attributes.alpha as THREE.BufferAttribute).needsUpdate = true;
  }
}

type FxKind = 'ring' | 'disc' | 'cone' | 'rect' | 'beam' | 'zone' | 'warn';
interface Fx { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; t0: number; dur: number; kind: FxKind; r: number; sticky: boolean; pulse: boolean; follow?: () => { x: number; z: number } | null }

export class Decals {
  group = new THREE.Group();
  private tex: Record<string, THREE.Texture>;
  private active: Fx[] = [];
  private pool: Record<string, Fx[]> = {};
  now = 0;
  constructor() {
    const ringTex = canvasTex(256, (c, s) => {
      const g = c.createRadialGradient(s / 2, s / 2, s * 0.36, s / 2, s / 2, s / 2);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.55, 'rgba(255,255,255,0.95)'); g.addColorStop(0.7, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.fillRect(0, 0, s, s);
    });
    const discTex = canvasTex(256, (c, s) => {
      const g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      g.addColorStop(0, 'rgba(255,255,255,0.85)'); g.addColorStop(0.7, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.fillRect(0, 0, s, s);
    });
    // danger zone: saturated edge + diagonal stripe fill
    const zoneTex = canvasTex(256, (c, s) => {
      c.beginPath(); c.arc(s / 2, s / 2, s / 2 - 4, 0, Math.PI * 2); c.clip();
      c.fillStyle = 'rgba(255,255,255,0.16)'; c.fillRect(0, 0, s, s);
      c.strokeStyle = 'rgba(255,255,255,0.28)'; c.lineWidth = 7;
      for (let i = -s; i < s * 2; i += 26) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i - s, s); c.stroke(); }
      c.restore?.();
    });
    const zoneEdge = canvasTex(256, (c, s) => {
      c.strokeStyle = 'rgba(255,255,255,1)'; c.lineWidth = 8; c.beginPath(); c.arc(s / 2, s / 2, s / 2 - 6, 0, Math.PI * 2); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.14)'; c.beginPath(); c.arc(s / 2, s / 2, s / 2 - 8, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.3)'; c.lineWidth = 5; c.save(); c.beginPath(); c.arc(s / 2, s / 2, s / 2 - 10, 0, Math.PI * 2); c.clip();
      for (let i = -s; i < s * 2; i += 28) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i - s, s); c.stroke(); }
      c.restore();
    });
    const coneTex = canvasTex(256, (c, s) => {
      // 100-degree sector pointing +x from left-center
      const cx = 8, cy = s / 2;
      c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, s - 12, -0.9, 0.9); c.closePath();
      const g = c.createRadialGradient(cx, cy, 10, cx, cy, s - 12);
      g.addColorStop(0, 'rgba(255,255,255,0.15)'); g.addColorStop(1, 'rgba(255,255,255,0.55)');
      c.fillStyle = g; c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = 5; c.stroke();
    });
    const rectTex = canvasTex(128, (c, s) => {
      c.fillStyle = 'rgba(255,255,255,0.28)'; c.fillRect(0, 0, s, s);
      c.strokeStyle = 'rgba(255,255,255,0.3)'; c.lineWidth = 6;
      for (let i = -s; i < s * 2; i += 20) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i - s, s); c.stroke(); }
      c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = 8; c.strokeRect(3, 3, s - 6, s - 6);
    });
    const beamTex = canvasTex(64, (c, s) => {
      const g = c.createLinearGradient(0, 0, 0, s);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.fillRect(0, 0, s, s);
    });
    this.tex = { ring: ringTex, disc: discTex, zone: zoneTex, zoneEdge, cone: coneTex, rect: rectTex, beam: beamTex };
  }

  private get(kind: FxKind, color: number): Fx {
    const key = kind;
    const p = this.pool[key] ?? (this.pool[key] = []);
    let fx = p.pop();
    if (!fx) {
      const mat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
      const tex = kind === 'ring' ? this.tex.ring : kind === 'disc' ? this.tex.disc : kind === 'cone' ? this.tex.cone : kind === 'rect' ? this.tex.rect : kind === 'beam' ? this.tex.beam : kind === 'warn' ? this.tex.zoneEdge : this.tex.zoneEdge;
      mat.map = tex;
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.renderOrder = 10;
      fx = { mesh, mat, t0: 0, dur: 1, kind, r: 1, sticky: false, pulse: false };
    }
    fx.mat.color.setHex(color);
    this.group.add(fx.mesh);
    return fx;
  }

  spawn(kind: FxKind, x: number, z: number, r: number, color: number, dur: number, dx = 1, dz = 0, opts: { sticky?: boolean; y?: number; pulse?: boolean; follow?: () => { x: number; z: number } | null } = {}) {
    const fx = this.get(kind, color);
    fx.t0 = this.now; fx.dur = dur; fx.r = r; fx.sticky = !!opts.sticky; fx.pulse = !!opts.pulse; fx.follow = opts.follow;
    const m = fx.mesh;
    m.visible = true;
    m.position.set(x, (opts.y ?? 0.08) + (kind === 'beam' ? 0.5 : 0), z);
    m.rotation.set(-Math.PI / 2, 0, 0);
    if (kind === 'cone') { m.rotation.z = -Math.atan2(dz, dx) + 0; m.position.x = x; m.scale.set(r * 1.08, r * 1.08, 1); m.position.x += Math.cos(Math.atan2(dz, dx)) * r * 0.5; m.position.z += Math.sin(Math.atan2(dz, dx)) * r * 0.5; }
    else if (kind === 'rect') { m.rotation.z = -Math.atan2(dz, dx); m.scale.set(r, opts.y !== undefined ? 1 : 3.2, 1); const a = Math.atan2(dz, dx); m.position.x += 0; m.position.z += 0; m.userData.a = a; }
    else if (kind === 'beam') { const a = Math.atan2(dz, dx); m.rotation.z = -a; m.scale.set(r, 0.9, 1); m.position.x = x + Math.cos(a) * r / 2; m.position.z = z + Math.sin(a) * r / 2; }
    else m.scale.set(r * 2, r * 2, 1);
    fx.mat.opacity = 1;
    this.active.push(fx);
    return fx;
  }

  /** persistent zone fx: returns handle to remove */
  update(now: number) {
    this.now = now;
    for (let i = this.active.length - 1; i >= 0; i--) {
      const f = this.active[i];
      const t = (now - f.t0) / f.dur;
      if (t >= 1) { f.mesh.visible = false; this.group.remove(f.mesh); this.active.splice(i, 1); this.pool[f.kind].push(f); continue; }
      const m = f.mesh;
      if (f.follow) { const p = f.follow(); if (p) { m.position.x = p.x; m.position.z = p.z; } }
      if (f.kind === 'ring') { const s = f.r * 2 * (0.35 + 0.65 * Math.min(1, t * 1.6)); m.scale.set(s, s, 1); f.mat.opacity = 1 - t * t; }
      else if (f.kind === 'disc') { f.mat.opacity = (1 - t) * 0.8; }
      else if (f.kind === 'beam') { f.mat.opacity = 1 - t; m.scale.y = 0.9 * (1 - t * 0.7); }
      else if (f.kind === 'cone' || f.kind === 'rect') { f.mat.opacity = t < 0.15 ? t / 0.15 : (1 - t) * 1.1; }
      else if (f.kind === 'warn') { const s = f.r * 2; m.scale.set(s, s, 1); f.mat.opacity = 0.45 + 0.35 * Math.sin(t * 22); }
      else { f.mat.opacity = f.pulse ? 0.7 + 0.25 * Math.sin(now * 5) : Math.min(0.9, (1 - t) * 3); }
    }
  }
  clear() {
    for (const f of this.active) { f.mesh.visible = false; this.group.remove(f.mesh); this.pool[f.kind].push(f); }
    this.active = [];
  }
}

/** Persistent (looping) ground zones tied to sim zones; created/destroyed by the renderer. */
export function makeZoneMesh(tex: THREE.Texture, color: number): THREE.Mesh {
  const mat = new THREE.MeshBasicMaterial({ map: tex, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, opacity: 0.85 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 9;
  return m;
}
export function zoneTexture(): THREE.Texture {
  return canvasTex(256, (c, s) => {
    c.fillStyle = 'rgba(255,255,255,0.13)'; c.beginPath(); c.arc(s / 2, s / 2, s / 2 - 8, 0, Math.PI * 2); c.fill();
    c.save(); c.beginPath(); c.arc(s / 2, s / 2, s / 2 - 10, 0, Math.PI * 2); c.clip();
    c.strokeStyle = 'rgba(255,255,255,0.22)'; c.lineWidth = 5;
    for (let i = -s; i < s * 2; i += 28) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i - s, s); c.stroke(); }
    c.restore();
    c.strokeStyle = 'rgba(255,255,255,1)'; c.lineWidth = 8; c.beginPath(); c.arc(s / 2, s / 2, s / 2 - 6, 0, Math.PI * 2); c.stroke();
  });
}
