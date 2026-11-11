// Visual effects: telegraph decals (analytic shader shapes) and a CPU particle system rendered as GL points.
import * as THREE from 'three';
import type { Hazard } from '../sim/entities';

// ------------------------------------------------------------------ decals
const DECAL_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const DECAL_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform vec3 uFill;
uniform vec3 uEdge;
uniform float uProg;
uniform float uShape; // 0 circle 1 cone 2 line 3 ring
uniform float uR;
uniform float uInner;
uniform float uArc;
uniform float uLen;
uniform float uW;
uniform vec2 uSize;
uniform float uOff;
uniform float uTime;
uniform float uStripes;
uniform float uAlpha;
float sdBand(float d, float a, float b) { return max(a - d, d - b); }
void main() {
  vec2 p = (vUv - 0.5) * uSize;
  p.x += uOff;
  float sd = 1.0; // signed distance, negative inside
  float fillT = 0.0;
  if (uShape < 0.5) {
    float d = length(p);
    sd = d - uR;
    fillT = d / uR;
  } else if (uShape < 1.5) {
    float d = length(p);
    float ang = abs(atan(p.y, p.x));
    float halfArc = uArc * 0.5;
    float sdr = d - uR;
    float sda = (ang - halfArc) * max(d, 0.001);
    sd = max(sdr, sda);
    fillT = d / uR;
  } else if (uShape < 2.5) {
    float sdx = max(-p.x, p.x - uLen);
    float sdy = abs(p.y) - uW * 0.5;
    sd = max(sdx, sdy);
    fillT = clamp(p.x / uLen, 0.0, 1.0);
  } else {
    float d = length(p);
    sd = max(d - uR, uInner - d);
    fillT = clamp((d - uInner) / max(uR - uInner, 0.001), 0.0, 1.0);
  }
  if (sd > 0.12) discard;
  float inside = 1.0 - smoothstep(-0.02, 0.04, sd);
  float edge = (1.0 - smoothstep(0.0, 0.1, abs(sd + 0.05))) * 0.95;
  float filled = step(fillT, uProg) * inside;
  float stripe = mix(1.0, 0.55 + 0.45 * step(0.5, fract((p.x + p.y) * 2.4 - uTime * 0.4)), uStripes);
  float pulse = 0.85 + 0.15 * sin(uTime * 14.0) * step(0.8, uProg);
  float a = (0.13 * inside + 0.42 * filled * stripe) * pulse;
  vec3 col = mix(uFill, uEdge, clamp(edge, 0.0, 1.0));
  a = max(a, edge * 0.85);
  gl_FragColor = vec4(col, a * uAlpha);
}`;

export interface DecalStyle {
  stripes: boolean;
  alpha: number;
}

const COLORS = {
  playerFill: new THREE.Color(0x5ee6c0),
  playerEdge: new THREE.Color(0xffe08a),
  enemyEdge: new THREE.Color(0xff5a30),
  phys: new THREE.Color(0xffd8c0),
  ember: new THREE.Color(0xff6a2a),
  frost: new THREE.Color(0x9fd4ff),
  blight: new THREE.Color(0xb36bff),
};

export class DecalPool {
  group = new THREE.Group();
  private pool: THREE.Mesh[] = [];
  private active = new Map<number, THREE.Mesh>();
  private geo = new THREE.PlaneGeometry(1, 1);
  style: DecalStyle = { stripes: false, alpha: 1 };

  constructor(scene: THREE.Scene) {
    this.geo.rotateX(-Math.PI / 2);
    scene.add(this.group);
  }

  private make(): THREE.Mesh {
    const mat = new THREE.ShaderMaterial({
      vertexShader: DECAL_VERT,
      fragmentShader: DECAL_FRAG,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uFill: { value: new THREE.Color() },
        uEdge: { value: new THREE.Color() },
        uProg: { value: 0 },
        uShape: { value: 0 },
        uR: { value: 1 },
        uInner: { value: 0 },
        uArc: { value: 1 },
        uLen: { value: 1 },
        uW: { value: 1 },
        uSize: { value: new THREE.Vector2(1, 1) },
        uOff: { value: 0 },
        uTime: { value: 0 },
        uStripes: { value: 0 },
        uAlpha: { value: 1 },
      },
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const m = new THREE.Mesh(this.geo, mat);
    m.renderOrder = 2;
    m.frustumCulled = false;
    this.group.add(m);
    return m;
  }

  update(hazards: Hazard[], time: number, extra: { trapPulse?: boolean } = {}) {
    const seen = new Set<number>();
    for (const h of hazards) {
      if (h.dead || (!h.telegraph && !h.trap && h.kind !== 'pool')) continue;
      if (h.owner === 'player' && !h.trap && h.kind !== 'pool' && h.kind !== 'preview' && h.delay <= 0.12) continue;
      const wants = h.telegraph || h.trap || h.kind === 'pool';
      if (!wants) continue;
      seen.add(h.id);
      let m = this.active.get(h.id);
      if (!m) {
        m = this.pool.pop() ?? this.make();
        m.visible = true;
        this.active.set(h.id, m);
      }
      const u = (m.material as THREE.ShaderMaterial).uniforms;
      const prog = h.active || h.dur > 0 && h.delay <= 0 ? 1 : h.trap ? (h.active ? 1 : 1 - Math.max(0, h.delay) / Math.max(0.01, h.totalDelay)) : 1 - Math.max(0, h.delay) / Math.max(0.01, h.totalDelay);
      let sx = 1;
      let sz = 1;
      let off = 0;
      let shape = 0;
      switch (h.shape) {
        case 'circle':
          shape = 0;
          sx = sz = (h.radius + 0.4) * 2;
          break;
        case 'ring':
          shape = 3;
          sx = sz = (h.radius + 0.4) * 2;
          break;
        case 'cone':
          shape = 1;
          sx = sz = (h.radius + 0.4) * 2;
          break;
        case 'line':
          shape = 2;
          sx = h.length + 0.8;
          sz = h.width + 0.6;
          off = h.length / 2;
          break;
      }
      u.uShape.value = shape;
      u.uR.value = h.radius;
      u.uInner.value = h.inner;
      u.uArc.value = h.arc;
      u.uLen.value = h.length;
      u.uW.value = h.width;
      u.uSize.value.set(sx, sz);
      u.uOff.value = off;
      u.uProg.value = prog;
      u.uTime.value = time;
      u.uStripes.value = this.style.stripes ? 1 : 0;
      u.uAlpha.value = this.style.alpha * (h.kind === 'preview' ? 0.55 : h.trap ? (h.active ? 0.8 : 0.5) : 1);
      const fill = (u.uFill.value as THREE.Color);
      const edge = (u.uEdge.value as THREE.Color);
      if (h.owner === 'player') {
        fill.copy(COLORS.playerFill);
        edge.copy(COLORS.playerEdge);
        if (h.trap || h.dtype === 'blight' || h.kind === 'pool') fill.copy(COLORS.blight).lerp(COLORS.playerFill, 0.3);
      } else {
        const base = COLORS[h.dtype] ?? COLORS.phys;
        fill.copy(base);
        edge.copy(h.dtype === 'blight' ? COLORS.blight : h.dtype === 'frost' ? COLORS.frost : COLORS.enemyEdge);
      }
      if (h.kind === 'summon') {
        fill.setHex(h.color);
        edge.setHex(h.color);
      }
      // position + orientation
      m.position.set(h.x + (h.shape === 'line' ? Math.cos(h.dir) * (h.length / 2) : 0), 0.06, h.z + (h.shape === 'line' ? Math.sin(h.dir) * (h.length / 2) : 0));
      m.rotation.y = h.shape === 'circle' || h.shape === 'ring' ? 0 : -h.dir;
      m.scale.set(sx, 1, sz);
      void extra;
    }
    for (const [id, m] of this.active) {
      if (!seen.has(id)) {
        m.visible = false;
        this.pool.push(m);
        this.active.delete(id);
      }
    }
  }

  clear() {
    for (const [, m] of this.active) {
      m.visible = false;
      this.pool.push(m);
    }
    this.active.clear();
  }
}

// ------------------------------------------------------------------ particles
const P_VERT = /* glsl */ `
attribute float aSize;
attribute vec4 aColor;
varying vec4 vColor;
uniform float uScale;
void main() {
  vColor = aColor;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uScale / -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const P_FRAG = /* glsl */ `
precision mediump float;
varying vec4 vColor;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.05, d);
  gl_FragColor = vec4(vColor.rgb, vColor.a * a);
}`;

const TMP_COLOR = new THREE.Color();

export interface BurstOpts {
  count: number;
  color: number;
  color2?: number;
  speed?: number;
  spread?: number; // horizontal spread factor
  up?: number; // vertical velocity
  life?: number;
  size?: number;
  gravity?: number;
  drag?: number;
  dir?: number; // direction angle (xz) for cones
  cone?: number; // cone half-angle; omit for radial
  y?: number;
  radius?: number; // spawn radius
}

export class Particles {
  readonly max: number;
  private pos: Float32Array;
  private vel: Float32Array;
  private col: Float32Array;
  private size: Float32Array;
  private life: Float32Array;
  private maxLife: Float32Array;
  private grav: Float32Array;
  private drag: Float32Array;
  private baseSize: Float32Array;
  private baseCol: Float32Array;
  private next = 0;
  points: THREE.Points;
  private geo = new THREE.BufferGeometry();
  private mat: THREE.ShaderMaterial;
  density = 1;

  constructor(scene: THREE.Scene, max = 3200) {
    this.max = max;
    this.pos = new Float32Array(max * 3);
    this.vel = new Float32Array(max * 3);
    this.col = new Float32Array(max * 4);
    this.size = new Float32Array(max);
    this.life = new Float32Array(max);
    this.maxLife = new Float32Array(max).fill(1);
    this.grav = new Float32Array(max);
    this.drag = new Float32Array(max);
    this.baseSize = new Float32Array(max);
    this.baseCol = new Float32Array(max * 3);
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('aColor', new THREE.BufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    this.mat = new THREE.ShaderMaterial({
      vertexShader: P_VERT,
      fragmentShader: P_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uScale: { value: 800 } },
    });
    this.points = new THREE.Points(this.geo, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 5;
    scene.add(this.points);
  }

  setViewport(h: number, fovDeg: number) {
    this.mat.uniforms.uScale.value = h / (2 * Math.tan((fovDeg * Math.PI) / 360));
  }

  emit(x: number, y: number, z: number, vx: number, vy: number, vz: number, life: number, size: number, color: number, gravity = 0, drag = 0.5) {
    const i = this.next;
    this.next = (this.next + 1) % this.max;
    this.pos[i * 3] = x;
    this.pos[i * 3 + 1] = y;
    this.pos[i * 3 + 2] = z;
    this.vel[i * 3] = vx;
    this.vel[i * 3 + 1] = vy;
    this.vel[i * 3 + 2] = vz;
    this.life[i] = life;
    this.maxLife[i] = life;
    this.baseSize[i] = size;
    this.grav[i] = gravity;
    this.drag[i] = drag;
    const c = TMP_COLOR.setHex(color);
    this.baseCol[i * 3] = c.r;
    this.baseCol[i * 3 + 1] = c.g;
    this.baseCol[i * 3 + 2] = c.b;
  }

  burst(x: number, z: number, o: BurstOpts) {
    const n = Math.max(1, Math.round(o.count * this.density));
    const c1 = new THREE.Color(o.color);
    const c2 = new THREE.Color(o.color2 ?? o.color);
    const tmp = new THREE.Color();
    for (let k = 0; k < n; k++) {
      let ang = Math.random() * Math.PI * 2;
      if (o.cone !== undefined && o.dir !== undefined) ang = o.dir + (Math.random() - 0.5) * 2 * o.cone;
      const sp = (o.speed ?? 3) * (0.4 + Math.random() * 0.8);
      const sr = (o.radius ?? 0) * Math.random();
      tmp.copy(c1).lerp(c2, Math.random());
      this.emit(
        x + Math.cos(ang) * sr,
        (o.y ?? 0.5) + Math.random() * 0.2,
        z + Math.sin(ang) * sr,
        Math.cos(ang) * sp * (o.spread ?? 1),
        (o.up ?? 2) * (0.4 + Math.random() * 0.9),
        Math.sin(ang) * sp * (o.spread ?? 1),
        (o.life ?? 0.6) * (0.6 + Math.random() * 0.8),
        (o.size ?? 0.35) * (0.6 + Math.random() * 0.8),
        tmp.getHex(),
        o.gravity ?? 6,
        o.drag ?? 1.2,
      );
    }
  }

  update(dt: number) {
    for (let i = 0; i < this.max; i++) {
      let l = this.life[i];
      if (l <= 0) {
        this.col[i * 4 + 3] = 0;
        this.size[i] = 0;
        continue;
      }
      l -= dt;
      this.life[i] = l;
      if (l <= 0) {
        this.col[i * 4 + 3] = 0;
        this.size[i] = 0;
        continue;
      }
      const d = Math.max(0, 1 - this.drag[i] * dt);
      this.vel[i * 3] *= d;
      this.vel[i * 3 + 2] *= d;
      this.vel[i * 3 + 1] = this.vel[i * 3 + 1] * d - this.grav[i] * dt;
      this.pos[i * 3] += this.vel[i * 3] * dt;
      this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      if (this.pos[i * 3 + 1] < 0.03) {
        this.pos[i * 3 + 1] = 0.03;
        this.vel[i * 3 + 1] *= -0.3;
      }
      const t = l / this.maxLife[i];
      this.col[i * 4] = this.baseCol[i * 3];
      this.col[i * 4 + 1] = this.baseCol[i * 3 + 1];
      this.col[i * 4 + 2] = this.baseCol[i * 3 + 2];
      this.col[i * 4 + 3] = Math.min(1, t * 1.6) * 0.9;
      this.size[i] = this.baseSize[i] * (0.4 + 0.6 * t);
    }
    (this.geo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (this.geo.getAttribute('aColor') as THREE.BufferAttribute).needsUpdate = true;
    (this.geo.getAttribute('aSize') as THREE.BufferAttribute).needsUpdate = true;
  }
}
