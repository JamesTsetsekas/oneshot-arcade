// GPU particles (stateless: position is a pure function of spawn attributes and time, evaluated
// in the vertex shader — no CPU particle simulation), plus pooled tracers and ground decals.
import * as THREE from 'three';

export class GpuParticles {
  readonly points: THREE.Points;
  private cap: number;
  private head = 0;
  private aStart: THREE.BufferAttribute;
  private aVel: THREE.BufferAttribute;
  private aMeta: THREE.BufferAttribute; // t0, life, size, gravity
  private aColor: THREE.BufferAttribute;
  private dirtyFrom = -1; private dirtyTo = -1;
  readonly material: THREE.ShaderMaterial;
  scale = 1;

  constructor(cap: number) {
    this.cap = cap;
    const g = new THREE.BufferGeometry();
    this.aStart = new THREE.BufferAttribute(new Float32Array(cap * 3), 3);
    this.aVel = new THREE.BufferAttribute(new Float32Array(cap * 3), 3);
    const meta = new Float32Array(cap * 4);
    for (let i = 0; i < cap; i++) meta[i * 4] = -1000;
    this.aMeta = new THREE.BufferAttribute(meta, 4);
    this.aColor = new THREE.BufferAttribute(new Float32Array(cap * 3), 3);
    for (const a of [this.aStart, this.aVel, this.aMeta, this.aColor]) a.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position', this.aStart);
    g.setAttribute('aVel', this.aVel);
    g.setAttribute('aMeta', this.aMeta);
    g.setAttribute('aColor', this.aColor);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(72, 0, 72), 400);
    this.material = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uScale: { value: 300 } },
      vertexShader: `
        attribute vec3 aVel; attribute vec4 aMeta; attribute vec3 aColor;
        uniform float uTime; uniform float uScale;
        varying vec3 vColor; varying float vA;
        void main() {
          float t = uTime - aMeta.x;
          float life = aMeta.y;
          if (t < 0.0 || t > life) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; vA = 0.0; return; }
          vec3 p = position + aVel * t + vec3(0.0, -0.5 * aMeta.w * t * t, 0.0);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          float k = t / life;
          gl_PointSize = aMeta.z * uScale / -mv.z * (1.0 - 0.5 * k);
          vColor = aColor; vA = 1.0 - k;
        }`,
      fragmentShader: `
        varying vec3 vColor; varying float vA;
        void main() {
          vec2 d = gl_PointCoord - 0.5;
          float r = dot(d, d);
          if (r > 0.25) discard;
          float a = (1.0 - r * 4.0) * vA;
          gl_FragColor = vec4(vColor * a, a);
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(g, this.material);
    this.points.frustumCulled = false;
    this.points.renderOrder = 10;
  }

  emit(x: number, y: number, z: number, vx: number, vy: number, vz: number, t0: number, life: number, size: number, grav: number, color: THREE.Color) {
    if (this.scale <= 0) return;
    const i = this.head;
    this.head = (this.head + 1) % this.cap;
    this.aStart.setXYZ(i, x, y, z);
    this.aVel.setXYZ(i, vx, vy, vz);
    this.aMeta.setXYZW(i, t0, life, size, grav);
    this.aColor.setXYZ(i, color.r, color.g, color.b);
    if (this.dirtyFrom < 0) { this.dirtyFrom = i; this.dirtyTo = i; }
    else if (i < this.dirtyFrom) { this.dirtyFrom = 0; this.dirtyTo = this.cap - 1; }
    else this.dirtyTo = Math.max(this.dirtyTo, i);
  }

  burst(x: number, y: number, z: number, n: number, speed: number, t0: number, life: number, size: number, grav: number, color: THREE.Color, rnd: () => number, up = 0.5) {
    const count = Math.max(1, Math.round(n * this.scale));
    for (let k = 0; k < count; k++) {
      const a = rnd() * Math.PI * 2, u = rnd();
      const s = speed * (0.4 + 0.6 * rnd());
      this.emit(x, y, z, Math.cos(a) * s * (1 - u * 0.5), s * (up + u), Math.sin(a) * s * (1 - u * 0.5), t0, life * (0.6 + 0.4 * rnd()), size * (0.7 + 0.6 * rnd()), grav, color);
    }
  }

  flush(time: number, viewportH: number) {
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uScale.value = viewportH * 0.9;
    if (this.dirtyFrom >= 0) {
      for (const [a, sz] of [[this.aStart, 3], [this.aVel, 3], [this.aMeta, 4], [this.aColor, 3]] as const) {
        a.clearUpdateRanges();
        a.addUpdateRange(this.dirtyFrom * sz, (this.dirtyTo - this.dirtyFrom + 1) * sz);
        a.needsUpdate = true;
      }
      this.dirtyFrom = -1;
    }
  }
}

/** Short-lived beams/tracers drawn as stretched instanced quads. */
export class Tracers {
  readonly mesh: THREE.InstancedMesh;
  private items: { a: THREE.Vector3; b: THREE.Vector3; t0: number; life: number; width: number; color: THREE.Color }[] = [];
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private v = new THREE.Vector3();
  private s = new THREE.Vector3();
  private up = new THREE.Vector3(0, 0, 1);
  constructor(cap = 512) {
    const g = new THREE.BoxGeometry(1, 1, 1);
    g.translate(0, 0, 0.5);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
    this.mesh = new THREE.InstancedMesh(g, mat, cap);
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3), 3);
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;
  }
  add(a: THREE.Vector3, b: THREE.Vector3, t0: number, life: number, width: number, color: THREE.Color) {
    if (this.items.length >= this.mesh.instanceMatrix.count) this.items.shift();
    this.items.push({ a: a.clone(), b: b.clone(), t0, life, width, color: color.clone() });
  }
  update(time: number) {
    this.items = this.items.filter((it) => time - it.t0 < it.life);
    let n = 0;
    const c = new THREE.Color();
    for (const it of this.items) {
      const k = 1 - (time - it.t0) / it.life;
      this.v.subVectors(it.b, it.a);
      const len = this.v.length();
      if (len < 1e-3) continue;
      this.q.setFromUnitVectors(this.up, this.v.normalize());
      this.s.set(it.width * k, it.width * k, len);
      this.m.compose(it.a, this.q, this.s);
      this.mesh.setMatrixAt(n, this.m);
      c.copy(it.color).multiplyScalar(k);
      this.mesh.setColorAt(n, c);
      n++;
    }
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
}

/** Ground decal ring material: shows edge, fill, and an activation sweep for area effects. */
export function makeZoneMaterial(color: THREE.Color): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: color.clone() }, uProgress: { value: 1 }, uActive: { value: 1 }, uTime: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `
      uniform vec3 uColor; uniform float uProgress; uniform float uActive; uniform float uTime; varying vec2 vUv;
      void main(){
        vec2 d = vUv - 0.5; float r = length(d) * 2.0;
        if (r > 1.0) discard;
        float edge = smoothstep(0.86, 0.95, r) * (1.0 - smoothstep(0.97, 1.0, r));
        float fill = (uActive > 0.5 ? 0.22 : 0.06) + 0.05 * sin(uTime * 6.0 + r * 10.0);
        float sweep = step(r, uProgress) * (uActive > 0.5 ? 0.0 : 0.25);
        float a = edge * 0.95 + fill + sweep;
        gl_FragColor = vec4(uColor * a, a);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
}
