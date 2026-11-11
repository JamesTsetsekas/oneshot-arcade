// Pooled VFX: particles, ground zone decals with shape-language shaders, rings, beams, sweeps, projectiles.
// Effects-low keeps every gameplay boundary/projectile/windup and only reduces particle counts.
import * as THREE from 'three';

// ------------------------------------------------------------------ particles
const PVERT = `
attribute float aSize; attribute vec4 aColor;
varying vec4 vColor;
void main() {
  vColor = aColor;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * (300.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}`;
const PFRAG = `
varying vec4 vColor;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(vColor.rgb, vColor.a * a);
}`;

export class Particles {
  points: THREE.Points;
  private pos: Float32Array; private col: Float32Array; private size: Float32Array;
  private vel: Float32Array; private life: Float32Array; private maxLife: Float32Array; private grav: Float32Array; private baseSize: Float32Array;
  private next = 0;
  constructor(public cap: number) {
    const g = new THREE.BufferGeometry();
    this.pos = new Float32Array(cap * 3); this.col = new Float32Array(cap * 4); this.size = new Float32Array(cap);
    this.vel = new Float32Array(cap * 3); this.life = new Float32Array(cap); this.maxLife = new Float32Array(cap); this.grav = new Float32Array(cap); this.baseSize = new Float32Array(cap);
    for (let i = 0; i < cap; i++) this.pos[i * 3 + 1] = -999;
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aColor', new THREE.BufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 500);
    this.points = new THREE.Points(g, new THREE.ShaderMaterial({ vertexShader: PVERT, fragmentShader: PFRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.points.frustumCulled = false;
    this.points.renderOrder = 10;
  }
  emit(x: number, y: number, z: number, n: number, color: THREE.Color, o: { speed?: number; life?: number; size?: number; up?: number; grav?: number; spread?: number; alpha?: number } = {}) {
    const sp = o.speed ?? 3, life = o.life ?? 0.6, size = o.size ?? 0.5, up = o.up ?? 1, spread = o.spread ?? 0.3;
    for (let k = 0; k < n; k++) {
      const i = this.next; this.next = (this.next + 1) % this.cap;
      const a = Math.random() * Math.PI * 2, s = sp * (0.4 + Math.random() * 0.6);
      this.pos[i * 3] = x + (Math.random() - 0.5) * spread; this.pos[i * 3 + 1] = y + (Math.random() - 0.5) * spread; this.pos[i * 3 + 2] = z + (Math.random() - 0.5) * spread;
      this.vel[i * 3] = Math.cos(a) * s; this.vel[i * 3 + 1] = up * (0.5 + Math.random()) * sp * 0.6; this.vel[i * 3 + 2] = Math.sin(a) * s;
      this.col[i * 4] = color.r; this.col[i * 4 + 1] = color.g; this.col[i * 4 + 2] = color.b; this.col[i * 4 + 3] = o.alpha ?? 1;
      this.life[i] = life * (0.6 + Math.random() * 0.4); this.maxLife[i] = this.life[i];
      this.grav[i] = o.grav ?? 0; this.baseSize[i] = size * (0.6 + Math.random() * 0.6);
    }
  }
  update(dt: number) {
    for (let i = 0; i < this.cap; i++) {
      if (this.life[i] <= 0) { if (this.size[i] !== 0) { this.size[i] = 0; } continue; }
      this.life[i] -= dt;
      const k = Math.max(0, this.life[i] / this.maxLife[i]);
      this.vel[i * 3 + 1] -= this.grav[i] * dt;
      this.vel[i * 3] *= 1 - dt * 2; this.vel[i * 3 + 2] *= 1 - dt * 2;
      this.pos[i * 3] += this.vel[i * 3] * dt; this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt; this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      this.size[i] = this.baseSize[i] * (0.4 + k * 0.6);
      this.col[i * 4 + 3] = Math.min(1, k * 1.5);
    }
    const g = this.points.geometry;
    g.attributes.position.needsUpdate = true; g.attributes.aColor.needsUpdate = true; g.attributes.aSize.needsUpdate = true;
  }
}

// ------------------------------------------------------------------ zone decals
const ZVERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const ZFRAG = `
uniform vec3 uColor; uniform float uTime; uniform float uProgress; uniform float uHostile; uniform float uRect; uniform vec2 uSize; uniform float uAlpha; uniform float uRing;
varying vec2 vUv;
void main(){
  vec2 p = vUv - 0.5;
  float d; float edgeW;
  if (uRect > 0.5) {
    vec2 q = abs(p) * 2.0; d = max(q.x, q.y);
    edgeW = 0.6 / max(1.0, min(uSize.x, uSize.y));
  } else { d = length(p) * 2.0; edgeW = 0.5 / max(1.0, uSize.x); }
  if (d > 1.0) discard;
  float edge = smoothstep(1.0 - edgeW * 2.0, 1.0 - edgeW * 0.5, d);
  float fill = 0.12;
  if (uHostile > 0.5) {
    vec2 w = vUv * uSize;
    float stripe = step(0.55, fract((w.x + w.y) * 0.9 - uTime * 0.8));
    fill = 0.10 + stripe * 0.14;
  }
  float prog = uRect > 0.5 ? step(abs(p.y) * 2.0, uProgress) : step(d, uProgress);
  fill += prog * 0.16;
  if (uRing > 0.5) fill *= 0.35;
  float a = (edge * 0.95 + fill) * uAlpha;
  gl_FragColor = vec4(uColor * (1.0 + edge * 0.5), a);
}`;

export class ZoneDecal {
  mesh: THREE.Mesh;
  mat: THREE.ShaderMaterial;
  constructor() {
    this.mat = new THREE.ShaderMaterial({
      vertexShader: ZVERT, fragmentShader: ZFRAG, transparent: true, depthWrite: false,
      uniforms: { uColor: { value: new THREE.Color() }, uTime: { value: 0 }, uProgress: { value: 0 }, uHostile: { value: 0 }, uRect: { value: 0 }, uSize: { value: new THREE.Vector2(1, 1) }, uAlpha: { value: 1 }, uRing: { value: 0 } },
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.mat);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.renderOrder = 5;
  }
}

// ------------------------------------------------------------------ transient shapes
interface Transient { obj: THREE.Mesh; t: number; dur: number; kind: 'ring' | 'beam' | 'sector' | 'flash'; r0: number; r1: number; base: number }

export class Transients {
  group = new THREE.Group();
  private pool: Transient[] = [];
  private active: Transient[] = [];
  private ringGeo = new THREE.RingGeometry(0.85, 1, 40);
  private beamGeo = new THREE.PlaneGeometry(1, 1);
  private flashGeo = new THREE.CircleGeometry(1, 24);
  private get(kind: Transient['kind'], geo: THREE.BufferGeometry): Transient {
    const p = this.pool.findIndex((x) => x.kind === kind && x.obj.geometry === geo);
    let t: Transient;
    if (p >= 0) t = this.pool.splice(p, 1)[0];
    else {
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      m.renderOrder = 8;
      t = { obj: m, t: 0, dur: 1, kind, r0: 0, r1: 1, base: 1 };
    }
    this.group.add(t.obj);
    this.active.push(t);
    return t;
  }
  ring(x: number, z: number, r0: number, r1: number, dur: number, color: number, y = 0.12) {
    const t = this.get('ring', this.ringGeo);
    t.obj.position.set(x, y, z); t.obj.rotation.set(-Math.PI / 2, 0, 0);
    (t.obj.material as THREE.MeshBasicMaterial).color.set(color);
    t.t = 0; t.dur = dur; t.r0 = r0; t.r1 = r1; t.base = 0.9;
  }
  flash(x: number, z: number, r: number, dur: number, color: number) {
    const t = this.get('flash', this.flashGeo);
    t.obj.position.set(x, 0.1, z); t.obj.rotation.set(-Math.PI / 2, 0, 0);
    (t.obj.material as THREE.MeshBasicMaterial).color.set(color);
    t.t = 0; t.dur = dur; t.r0 = r; t.r1 = r; t.base = 0.55;
  }
  beam(x1: number, z1: number, x2: number, z2: number, width: number, dur: number, color: number, y = 0.4) {
    const t = this.get('beam', this.beamGeo);
    const len = Math.hypot(x2 - x1, z2 - z1);
    t.obj.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
    t.obj.rotation.set(-Math.PI / 2, 0, -Math.atan2(z2 - z1, x2 - x1));
    t.obj.scale.set(len, width, 1);
    (t.obj.material as THREE.MeshBasicMaterial).color.set(color);
    t.t = 0; t.dur = dur; t.r0 = width; t.r1 = width; t.base = 0.9;
  }
  sector(x: number, z: number, ang: number, range: number, half: number, dur: number, color: number) {
    const geo = new THREE.CircleGeometry(range, 16, -half, half * 2);
    const t = this.get('sector', geo);
    t.obj.position.set(x, 0.14, z);
    t.obj.rotation.set(-Math.PI / 2, 0, -ang);
    (t.obj.material as THREE.MeshBasicMaterial).color.set(color);
    t.t = 0; t.dur = dur; t.r0 = 1; t.r1 = 1; t.base = 0.6;
  }
  update(dt: number) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const t = this.active[i];
      t.t += dt;
      const k = t.t / t.dur;
      const mat = t.obj.material as THREE.MeshBasicMaterial;
      if (k >= 1) {
        this.group.remove(t.obj);
        this.active.splice(i, 1);
        if (t.kind === 'sector') { t.obj.geometry.dispose(); mat.dispose(); } else this.pool.push(t);
        continue;
      }
      mat.opacity = t.base * (1 - k);
      if (t.kind === 'ring' || t.kind === 'flash') { const r = t.r0 + (t.r1 - t.r0) * (1 - (1 - k) * (1 - k)); t.obj.scale.set(r, r, 1); }
    }
  }
}

// ------------------------------------------------------------------ projectile looks
export interface ProjLook { color: number; size: number; stretch: number; trail: number }
export function projLook(sub: string, team: number, teamCol: number): ProjLook {
  switch (sub) {
    case 'ricochet': return { color: 0xff8a3a, size: 0.32, stretch: 3, trail: 0xffb36b };
    case 'redline': return { color: 0xff3a3a, size: 0.6, stretch: 6, trail: 0xffa040 };
    case 'swarm': return { color: 0xbff6ff, size: 0.6, stretch: 1, trail: 0xe0ffff };
    case 'linebreak': return { color: 0xff6ad5, size: 0.28, stretch: 5, trail: 0xff9ae8 };
    case 'linebreak-echo': return { color: 0xffb0f0, size: 0.22, stretch: 4, trail: 0xffd0f5 };
    case 'sunbolt': return { color: 0xffe066, size: 0.2, stretch: 3, trail: 0xfff0a0 };
    case 'tower-shot': return { color: teamCol, size: 0.45, stretch: 1.6, trail: teamCol };
    case 'fountain-shot': return { color: 0xffffff, size: 0.6, stretch: 3, trail: teamCol };
    case 'atk-suri': return { color: 0xffa040, size: 0.18, stretch: 3, trail: 0xff8a3a };
    case 'atk-oru': return { color: 0xbff6ff, size: 0.22, stretch: 1.2, trail: 0xbff6ff };
    case 'atk-ilyra': return { color: 0xff6ad5, size: 0.2, stretch: 2, trail: 0xff6ad5 };
    default: return { color: team === 2 ? 0xd0a0ff : teamCol, size: 0.16, stretch: 2, trail: 0 };
  }
}
