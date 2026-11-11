// client-renderer: pooled VFX — a single GPU point-sprite particle system, transient ground
// flashes (rings / cones / rects / beams), gameplay zone decals, projectiles and aim indicators.
// Shape language: danger = warm saturated edge + striped fill; allied/beneficial = cool edge.

import * as THREE from 'three';
import type { ProjView, ZoneView } from '../../shared/protocol';

const DECAL_VERT = /* glsl */ `
varying vec2 vUv;
varying vec3 vW;
void main() {
  vUv = uv;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const DECAL_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uProg;
uniform float uDanger;
uniform float uTime;
uniform float uShape;
uniform vec2 uSize;
uniform float uAlpha;
varying vec2 vUv;
varying vec3 vW;
void main() {
  float edge;
  float fill;
  if (uShape < 0.5) {
    float r = length(vUv - 0.5) * 2.0;
    if (r > 1.0) discard;
    float px = (1.0 - r) * uSize.x;
    edge = 1.0 - smoothstep(0.0, 0.16, px);
    fill = r < uProg ? 0.34 : 0.12;
    edge += (1.0 - smoothstep(0.0, 0.05, abs(r - uProg))) * step(uProg, 0.995) * 0.7;
  } else {
    vec2 d = (1.0 - abs(vUv - 0.5) * 2.0) * uSize * 0.5;
    float px = min(d.x, d.y);
    edge = 1.0 - smoothstep(0.0, 0.16, px);
    fill = vUv.x < uProg ? 0.34 : 0.12;
  }
  float stripes = uDanger * step(0.5, fract((vW.x + vW.z) * 0.75 + uTime * 0.7)) * 0.13;
  float a = clamp(edge * 0.95 + fill * (0.6 + 0.4 * uDanger) + stripes, 0.0, 1.0) * uAlpha;
  gl_FragColor = vec4(uColor * (1.0 + edge * 0.6), a);
}`;

function decalMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: DECAL_VERT,
    fragmentShader: DECAL_FRAG,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { uColor: { value: new THREE.Color() }, uProg: { value: 1 }, uDanger: { value: 0 }, uTime: { value: 0 }, uShape: { value: 0 }, uSize: { value: new THREE.Vector2(1, 1) }, uAlpha: { value: 1 } },
  });
}

const circleGeo = new THREE.CircleGeometry(1, 56);
circleGeo.rotateX(-Math.PI / 2);
const rectGeo = new THREE.PlaneGeometry(1, 1);
rectGeo.rotateX(-Math.PI / 2);
rectGeo.translate(0.5, 0, 0);
const wallGeo = new THREE.BoxGeometry(1, 1, 1);
wallGeo.translate(0.5, 0.5, 0);
const ringGeo = new THREE.RingGeometry(0.9, 1, 48);
ringGeo.rotateX(-Math.PI / 2);
const thinRingGeo = new THREE.RingGeometry(0.975, 1, 72);
thinRingGeo.rotateX(-Math.PI / 2);
const beamGeo = new THREE.BoxGeometry(1, 1, 1);
beamGeo.translate(0.5, 0, 0);
const sphereGeo = new THREE.IcosahedronGeometry(1, 1);
const coneCache = new Map<number, THREE.BufferGeometry>();
function coneGeo(halfArc: number): THREE.BufferGeometry {
  const k = Math.round(halfArc * 100);
  let g = coneCache.get(k);
  if (!g) {
    g = new THREE.CircleGeometry(1, 24, -halfArc, halfArc * 2);
    g.rotateX(-Math.PI / 2);
    coneCache.set(k, g);
  }
  return g;
}

interface Transient {
  mesh: THREE.Mesh;
  age: number;
  life: number;
  grow: number;
  base: number;
  kind: 'ring' | 'flash' | 'beam';
}

const ZONE_COLORS: Record<string, number> = {
  hush: 0x7a5ad0,
  fen: 0x5fae52,
  footnote: 0xb48cff,
  slipstream: 0xffb04a,
  anchor: 0x8fd0ff,
  colossusSlam: 0xff5ad6,
  monsterSlam: 0xff8a3a,
};

export class Vfx {
  private scene: THREE.Scene;
  // particles
  private max: number;
  private pPos: Float32Array;
  private pCol: Float32Array;
  private pSize: Float32Array;
  private pVel: Float32Array;
  private pLife: Float32Array;
  private pMax: Float32Array;
  private pBase: Float32Array;
  private pGrav: Float32Array;
  private cursor = 0;
  private points: THREE.Points;
  private transients: Transient[] = [];
  private zones = new Map<number, { mesh: THREE.Mesh; view: ZoneView; seen: boolean }>();
  private projs = new Map<number, { mesh: THREE.Mesh; seen: boolean; kind: string; trail: number }>();
  private tmpC = new THREE.Color();
  particleScale = 1;
  enemyColor = 0xff4a3a;
  allyColor = 0x4ad0e8;

  constructor(scene: THREE.Scene, quality: 'low' | 'medium' | 'high') {
    this.scene = scene;
    this.max = quality === 'low' ? 1200 : quality === 'medium' ? 3000 : 5000;
    this.particleScale = quality === 'low' ? 0.4 : quality === 'medium' ? 0.8 : 1;
    const n = this.max;
    this.pPos = new Float32Array(n * 3);
    this.pCol = new Float32Array(n * 3);
    this.pSize = new Float32Array(n);
    this.pVel = new Float32Array(n * 3);
    this.pLife = new Float32Array(n);
    this.pMax = new Float32Array(n).fill(1);
    this.pBase = new Float32Array(n);
    this.pGrav = new Float32Array(n);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pPos, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(this.pCol, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(this.pSize, 1));
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uScale: { value: 600 } },
      vertexShader: /* glsl */ `
        attribute vec3 aColor; attribute float aSize; varying vec3 vC; uniform float uScale;
        void main(){ vC = aColor; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = aSize * uScale / -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: /* glsl */ `
        varying vec3 vC; void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; float a = smoothstep(1.0, 0.1, d); gl_FragColor = vec4(vC * a, a); }`,
    });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 10;
    scene.add(this.points);
  }

  setViewport(h: number): void {
    (this.points.material as THREE.ShaderMaterial).uniforms.uScale.value = h * 0.9;
  }

  /** Spawn n particles at a sim position (x, y) and height z. */
  burst(x: number, y: number, h: number, color: number, n: number, speed: number, life: number, size: number, up = 0.5, grav = 3): void {
    n = Math.max(1, Math.round(n * this.particleScale));
    this.tmpC.setHex(color);
    for (let i = 0; i < n; i++) {
      const k = this.cursor;
      this.cursor = (this.cursor + 1) % this.max;
      const a = Math.random() * Math.PI * 2;
      const el = (Math.random() - 0.5 + up) * 1.4;
      const sp = speed * (0.35 + Math.random() * 0.65);
      this.pPos[k * 3] = x + (Math.random() - 0.5) * 0.2;
      this.pPos[k * 3 + 1] = h + (Math.random() - 0.5) * 0.2;
      this.pPos[k * 3 + 2] = -y + (Math.random() - 0.5) * 0.2;
      this.pVel[k * 3] = Math.cos(a) * sp * Math.cos(el);
      this.pVel[k * 3 + 1] = Math.sin(el) * sp;
      this.pVel[k * 3 + 2] = Math.sin(a) * sp * Math.cos(el);
      const v = 0.7 + Math.random() * 0.5;
      this.pCol[k * 3] = this.tmpC.r * v;
      this.pCol[k * 3 + 1] = this.tmpC.g * v;
      this.pCol[k * 3 + 2] = this.tmpC.b * v;
      this.pLife[k] = life * (0.6 + Math.random() * 0.4);
      this.pMax[k] = this.pLife[k];
      this.pBase[k] = size * (0.6 + Math.random() * 0.7);
      this.pGrav[k] = grav;
    }
  }

  private transient(geo: THREE.BufferGeometry, color: number, life: number, kind: Transient['kind'], grow = 0, opacity = 0.85): THREE.Mesh {
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.renderOrder = 6;
    this.scene.add(mesh);
    this.transients.push({ mesh, age: 0, life, grow, base: opacity, kind });
    return mesh;
  }

  ring(x: number, y: number, r: number, color: number, life = 0.45): void {
    const m = this.transient(ringGeo, color, life, 'ring', r);
    m.position.set(x, 0.09, -y);
    m.scale.setScalar(r * 0.25);
  }
  flashCircle(x: number, y: number, r: number, color: number, life = 0.35): void {
    const m = this.transient(circleGeo, color, life, 'flash', 0, 0.5);
    m.position.set(x, 0.08, -y);
    m.scale.set(r, 1, r);
  }
  cone(x: number, y: number, ang: number, r: number, halfArc: number, color: number): void {
    const m = this.transient(coneGeo(halfArc), color, 0.3, 'flash', 0, 0.7);
    m.position.set(x, 0.1, -y);
    m.rotation.y = ang;
    m.scale.set(r, 1, r);
  }
  rect(x: number, y: number, ang: number, len: number, width: number, color: number): void {
    const m = this.transient(rectGeo, color, 0.35, 'flash', 0, 0.7);
    m.position.set(x, 0.1, -y);
    m.rotation.y = ang;
    m.scale.set(len, 1, width);
  }
  beam(x1: number, y1: number, x2: number, y2: number, color: number, width = 0.14, h = 1.2, life = 0.28): void {
    const m = this.transient(beamGeo, color, life, 'beam', 0, 0.9);
    const dx = x2 - x1;
    const dy = y2 - y1;
    m.position.set(x1, h, -y1);
    m.rotation.y = Math.atan2(dy, dx);
    m.scale.set(Math.hypot(dx, dy), width, width);
  }

  // ---- gameplay zones -------------------------------------------------------------------

  syncZones(list: ZoneView[], tick: number, time: number): void {
    for (const z of this.zones.values()) z.seen = false;
    for (const v of list) {
      let z = this.zones.get(v.id);
      if (!z) {
        let mesh: THREE.Mesh;
        if (v.shape === 'wall') {
          mesh = new THREE.Mesh(wallGeo, new THREE.MeshLambertMaterial({ color: 0xbdb49c, flatShading: true }));
          mesh.scale.set(v.r, 0.1, v.w);
          mesh.castShadow = true;
          mesh.position.set(v.x, 0, -v.y);
        } else {
          const mat = decalMaterial();
          const geo = v.shape === 'rect' ? rectGeo : v.shape === 'cone' ? coneGeo(v.arc) : circleGeo;
          mesh = new THREE.Mesh(geo, mat);
          mesh.renderOrder = 3;
          if (v.shape === 'rect') {
            mesh.scale.set(v.r, 1, v.w);
            mat.uniforms.uShape.value = 1;
            mat.uniforms.uSize.value.set(v.r, v.w);
          } else {
            mesh.scale.set(v.r, 1, v.r);
            mat.uniforms.uSize.value.set(v.r, v.r);
          }
          const special = ZONE_COLORS[v.kind];
          const col = special ?? (v.danger ? this.enemyColor : this.allyColor);
          mat.uniforms.uColor.value.setHex(v.kind === 'hush' || v.kind === 'fen' || v.kind === 'footnote' ? (v.danger ? this.enemyColor : col) : col);
          if ((v.kind === 'hush' || v.kind === 'fen') && v.danger) mat.uniforms.uColor.value.lerp(new THREE.Color(special), 0.45);
          mat.uniforms.uDanger.value = v.danger ? 1 : 0;
          mesh.position.set(v.x, 0.06 + (v.id % 7) * 0.004, -v.y);
        }
        mesh.rotation.y = v.ang;
        this.scene.add(mesh);
        z = { mesh, view: v, seen: true };
        this.zones.set(v.id, z);
      }
      z.seen = true;
      z.view = v;
      if (v.shape === 'wall') {
        const age = (tick - v.t0) / 30;
        z.mesh.scale.y = Math.min(1.7, 0.1 + age * 9);
      } else {
        const u = (z.mesh.material as THREE.ShaderMaterial).uniforms;
        const span = Math.max(1, v.t1 - v.t0);
        u.uProg.value = v.t1 > v.t0 ? Math.min(1, (tick - v.t0) / span) : 1;
        u.uTime.value = time;
        const left = (v.t2 - tick) / 30;
        u.uAlpha.value = Math.min(1, Math.max(0.15, left * 3)) * (v.t1 <= v.t0 || tick >= v.t1 ? 0.75 : 1);
      }
    }
    for (const [id, z] of this.zones) {
      if (!z.seen) {
        this.scene.remove(z.mesh);
        if (z.view.shape !== 'wall') (z.mesh.material as THREE.Material).dispose();
        this.zones.delete(id);
      }
    }
  }

  // ---- projectiles ----------------------------------------------------------------------

  private projStyle(kind: string, team: number, viewer: number): { c: number; r: number; len: number; h: number; trail: number } {
    const tc = team === viewer ? 0x7fc4ff : team === 2 ? 0xffd27a : 0xff8a70;
    switch (kind) {
      case 'atk_suri':
        return { c: 0xff9a3c, r: 0.16, len: 3.5, h: 1.4, trail: 1 };
      case 'atk_oru':
        return { c: 0xbff5e6, r: 0.2, len: 1.2, h: 1.5, trail: 1 };
      case 'atk_ilyra':
        return { c: 0xc7a6ff, r: 0.18, len: 2.2, h: 1.6, trail: 1 };
      case 'atk_tower':
        return { c: tc, r: 0.36, len: 1.5, h: 2.6, trail: 3 };
      case 'atk_siege':
        return { c: tc, r: 0.3, len: 1.2, h: 1.3, trail: 1 };
      case 'atk_brass':
        return { c: 0xffb04a, r: 0.26, len: 1.2, h: 1.3, trail: 1 };
      case 'ricochet':
        return { c: 0xffb347, r: 0.3, len: 3.2, h: 1.2, trail: 3 };
      case 'redline':
        return { c: 0xff6a2a, r: 0.6, len: 6, h: 1.3, trail: 8 };
      case 'swarm':
        return { c: 0x9be7d8, r: 0.62, len: 1, h: 1.3, trail: 4 };
      case 'linebreak':
        return { c: 0xb48cff, r: 0.3, len: 5, h: 1.3, trail: 3 };
      case 'linebreak2':
        return { c: 0xf2e8ff, r: 0.22, len: 4, h: 1.3, trail: 2 };
      case 'migration':
        return { c: 0x9be7d8, r: 0.5, len: 1, h: 1.2, trail: 14 };
      case 'spoke':
        return { c: 0xffe07a, r: 0.14, len: 2.5, h: 1.3, trail: 1 };
      default:
        return { c: tc, r: 0.15, len: 1.6, h: 1.2, trail: 0 };
    }
  }

  syncProjs(list: ProjView[], ahead: number, viewer: number): void {
    for (const p of this.projs.values()) p.seen = false;
    for (const v of list) {
      const st = this.projStyle(v.kind, v.t, viewer);
      let p = this.projs.get(v.id);
      if (!p) {
        const mesh = new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({ color: st.c, transparent: true, opacity: v.kind === 'migration' ? 0.3 : 0.95, depthWrite: false, blending: THREE.AdditiveBlending }));
        if (v.kind === 'migration') mesh.scale.set(0.5, 1.4, 4.5);
        else mesh.scale.set(st.r * st.len, st.r, st.r);
        mesh.renderOrder = 8;
        this.scene.add(mesh);
        p = { mesh, seen: true, kind: v.kind, trail: st.trail };
        this.projs.set(v.id, p);
      }
      p.seen = true;
      const x = v.x + v.vx * ahead;
      const y = v.y + v.vy * ahead;
      p.mesh.position.set(x, st.h, -y);
      p.mesh.rotation.y = Math.atan2(v.vy, v.vx);
      if (st.trail > 0) {
        if (v.kind === 'migration') {
          const px = -v.vy;
          const py = v.vx;
          const l = Math.hypot(px, py) || 1;
          for (let i = 0; i < 3; i++) {
            const o = (Math.random() - 0.5) * 9;
            this.burst(x + (px / l) * o, y + (py / l) * o, 0.4 + Math.random() * 1.6, i % 2 ? 0xf3e6a8 : st.c, 1, 1.2, 0.6, 0.28, 0.6, -0.5);
          }
        } else this.burst(x, y, st.h, st.c, st.trail > 2 ? 2 : 1, 0.8, 0.3 + st.trail * 0.03, 0.1 + st.r * 0.5, 0.3, 0.5);
      }
    }
    for (const [id, p] of this.projs) {
      if (!p.seen) {
        this.scene.remove(p.mesh);
        (p.mesh.material as THREE.Material).dispose();
        this.projs.delete(id);
      }
    }
  }

  update(dt: number): void {
    const n = this.max;
    for (let k = 0; k < n; k++) {
      if (this.pLife[k] <= 0) {
        if (this.pSize[k] !== 0) this.pSize[k] = 0;
        continue;
      }
      this.pLife[k] -= dt;
      const f = Math.max(0, this.pLife[k] / this.pMax[k]);
      this.pVel[k * 3 + 1] -= this.pGrav[k] * dt;
      this.pPos[k * 3] += this.pVel[k * 3] * dt;
      this.pPos[k * 3 + 1] += this.pVel[k * 3 + 1] * dt;
      this.pPos[k * 3 + 2] += this.pVel[k * 3 + 2] * dt;
      if (this.pPos[k * 3 + 1] < 0.05) {
        this.pPos[k * 3 + 1] = 0.05;
        this.pVel[k * 3 + 1] *= -0.3;
      }
      this.pSize[k] = this.pBase[k] * (0.3 + 0.7 * f);
    }
    const g = this.points.geometry;
    g.getAttribute('position').needsUpdate = true;
    g.getAttribute('aColor').needsUpdate = true;
    g.getAttribute('aSize').needsUpdate = true;
    for (const t of this.transients) {
      t.age += dt;
      const f = Math.min(1, t.age / t.life);
      const mat = t.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = t.base * (1 - f) * (1 - f);
      if (t.kind === 'ring') t.mesh.scale.setScalar(t.grow * (0.25 + 0.75 * (1 - (1 - f) * (1 - f))));
    }
    if (this.transients.some((t) => t.age >= t.life)) {
      this.transients = this.transients.filter((t) => {
        if (t.age < t.life) return true;
        this.scene.remove(t.mesh);
        (t.mesh.material as THREE.Material).dispose();
        return false;
      });
    }
  }
}

// ---- aim indicators -----------------------------------------------------------------------

export class Indicators {
  readonly group = new THREE.Group();
  private range: THREE.Mesh;
  private line: THREE.Mesh;
  private line2: THREE.Mesh;
  private circle: THREE.Mesh;
  private cones = new Map<number, THREE.Mesh>();
  private activeCone: THREE.Mesh | null = null;
  private marker: THREE.Mesh;
  private markerAge = 9;
  private hover: THREE.Mesh;
  private towerRing: THREE.Mesh;
  private atkRange: THREE.Mesh;

  constructor(scene: THREE.Scene) {
    const mk = (geo: THREE.BufferGeometry, color: number, opacity: number): THREE.Mesh => {
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide }));
      m.visible = false;
      m.renderOrder = 5;
      this.group.add(m);
      return m;
    };
    this.range = mk(thinRingGeo, 0xbfe6ff, 0.75);
    this.atkRange = mk(thinRingGeo, 0xffffff, 0.35);
    this.line = mk(rectGeo, 0xbfe6ff, 0.34);
    this.line2 = mk(rectGeo, 0xffd27a, 0.3);
    this.circle = mk(circleGeo, 0xbfe6ff, 0.3);
    this.marker = mk(ringGeo, 0x7dff9a, 0.9);
    this.hover = mk(ringGeo, 0xff5f4a, 0.9);
    this.towerRing = mk(thinRingGeo, 0xff5f4a, 0.55);
    scene.add(this.group);
  }

  hideAim(): void {
    this.range.visible = this.line.visible = this.line2.visible = this.circle.visible = false;
    if (this.activeCone) this.activeCone.visible = false;
    this.activeCone = null;
  }
  showRange(x: number, y: number, r: number): void {
    this.range.visible = r > 0;
    this.range.position.set(x, 0.07, -y);
    this.range.scale.setScalar(r);
  }
  showAttackRange(x: number, y: number, r: number, on: boolean): void {
    this.atkRange.visible = on;
    this.atkRange.position.set(x, 0.06, -y);
    this.atkRange.scale.setScalar(r);
  }
  showLine(x: number, y: number, ang: number, len: number, width: number, second?: { x: number; y: number; ang: number; len: number }): void {
    this.line.visible = true;
    this.line.position.set(x, 0.08, -y);
    this.line.rotation.y = ang;
    this.line.scale.set(len, 1, width);
    this.line2.visible = !!second;
    if (second) {
      this.line2.position.set(second.x, 0.08, -second.y);
      this.line2.rotation.y = second.ang;
      this.line2.scale.set(second.len, 1, width);
    }
  }
  showCircle(x: number, y: number, r: number): void {
    this.circle.visible = true;
    this.circle.position.set(x, 0.08, -y);
    this.circle.scale.set(r, 1, r);
  }
  showCone(x: number, y: number, ang: number, r: number, halfArc: number): void {
    const k = Math.round(halfArc * 100);
    let m = this.cones.get(k);
    if (!m) {
      m = new THREE.Mesh(coneGeo(halfArc), new THREE.MeshBasicMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide }));
      m.renderOrder = 5;
      this.group.add(m);
      this.cones.set(k, m);
    }
    if (this.activeCone && this.activeCone !== m) this.activeCone.visible = false;
    this.activeCone = m;
    m.visible = true;
    m.position.set(x, 0.08, -y);
    m.rotation.y = ang;
    m.scale.set(r, 1, r);
  }
  click(x: number, y: number, attack: boolean): void {
    this.marker.visible = true;
    this.marker.position.set(x, 0.1, -y);
    (this.marker.material as THREE.MeshBasicMaterial).color.setHex(attack ? 0xff5f4a : 0x7dff9a);
    this.markerAge = 0;
  }
  setHover(x: number, y: number, r: number, on: boolean, color: number): void {
    this.hover.visible = on;
    if (!on) return;
    this.hover.position.set(x, 0.09, -y);
    this.hover.scale.setScalar(r);
    (this.hover.material as THREE.MeshBasicMaterial).color.setHex(color);
  }
  setTowerRing(x: number, y: number, r: number, on: boolean, hot: boolean): void {
    this.towerRing.visible = on;
    if (!on) return;
    this.towerRing.position.set(x, 0.07, -y);
    this.towerRing.scale.setScalar(r);
    const m = this.towerRing.material as THREE.MeshBasicMaterial;
    m.color.setHex(hot ? 0xff2a1a : 0xff9a70);
    m.opacity = hot ? 0.95 : 0.5;
  }
  update(dt: number): void {
    if (this.marker.visible) {
      this.markerAge += dt;
      const f = Math.min(1, this.markerAge / 0.45);
      this.marker.scale.setScalar(0.9 - 0.6 * f);
      (this.marker.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - f);
      if (f >= 1) this.marker.visible = false;
    }
  }
}
