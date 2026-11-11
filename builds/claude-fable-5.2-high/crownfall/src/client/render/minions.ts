// client-renderer: lane minions drawn with instancing — two draw calls per minion class
// (vertex-coloured body + team-tinted accent), regardless of how many are on screen.

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { ANIM } from '../../shared/protocol';

type Part = [geo: THREE.BufferGeometry, color: number, sx: number, sy: number, sz: number, x: number, y: number, z: number, rz?: number, rx?: number];

const BOX = new THREE.BoxGeometry(1, 1, 1);
const CYL = new THREE.CylinderGeometry(1, 1, 1, 8);
const CONE = new THREE.ConeGeometry(1, 1, 5);

function bake(parts: Part[]): THREE.BufferGeometry {
  const geos: THREE.BufferGeometry[] = [];
  const c = new THREE.Color();
  const m = new THREE.Matrix4();
  const e = new THREE.Euler();
  const q = new THREE.Quaternion();
  for (const [geo, color, sx, sy, sz, x, y, z, rz, rx] of parts) {
    const g = geo.clone().toNonIndexed();
    e.set(rx ?? 0, 0, rz ?? 0);
    q.setFromEuler(e);
    m.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(sx, sy, sz));
    g.applyMatrix4(m);
    c.setHex(color);
    const n = g.getAttribute('position').count;
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.deleteAttribute('uv');
    geos.push(g);
  }
  const out = mergeGeometries(geos) as THREE.BufferGeometry;
  out.computeVertexNormals();
  return out;
}

const BRASS = 0xb08d57;
const STEEL = 0x8a8fa0;
const DARK = 0x4d5068;
const WOOD = 0x6b5a44;
const W = 0xffffff;

const DEFS: Record<string, { body: Part[]; accent: Part[] }> = {
  guard: {
    body: [
      [BOX, DARK, 0.2, 0.45, 0.2, 0, 0.22, 0.16],
      [BOX, DARK, 0.2, 0.45, 0.2, 0, 0.22, -0.16],
      [BOX, BRASS, 0.48, 0.55, 0.62, 0, 0.72, 0],
      [BOX, STEEL, 0.32, 0.3, 0.34, 0.02, 1.15, 0],
      [BOX, STEEL, 0.1, 0.74, 0.66, 0.36, 0.72, -0.08],
      [CYL, WOOD, 0.035, 1.5, 0.035, 0.3, 0.95, 0.42, -0.5],
    ],
    accent: [
      [BOX, W, 0.12, 0.3, 0.3, 0.42, 0.74, -0.08],
      [BOX, W, 0.34, 0.12, 0.12, -0.04, 1.36, 0],
      [CONE, W, 0.07, 0.24, 0.07, 0.68, 1.6, 0.42, -0.5],
    ],
  },
  bolt: {
    body: [
      [CYL, STEEL, 0.3, 0.85, 0.3, 0, 0.45, 0],
      [BOX, BRASS, 0.4, 0.22, 0.52, 0, 0.92, 0],
      [BOX, DARK, 0.28, 0.28, 0.28, 0.02, 1.2, 0],
      [CYL, WOOD, 0.035, 1.6, 0.035, 0.28, 0.85, 0.34],
    ],
    accent: [
      [BOX, W, 0.24, 0.24, 0.24, 0.28, 1.72, 0.34, 0.78, 0.78],
      [BOX, W, 0.08, 0.1, 0.2, 0.17, 1.22, 0],
    ],
  },
  siege: {
    body: [
      [BOX, WOOD, 1.3, 0.42, 0.85, 0, 0.55, 0],
      [CYL, DARK, 0.32, 0.14, 0.32, 0.42, 0.32, 0.5, 0, Math.PI / 2],
      [CYL, DARK, 0.32, 0.14, 0.32, 0.42, 0.32, -0.5, 0, Math.PI / 2],
      [CYL, DARK, 0.32, 0.14, 0.32, -0.42, 0.32, 0.5, 0, Math.PI / 2],
      [CYL, DARK, 0.32, 0.14, 0.32, -0.42, 0.32, -0.5, 0, Math.PI / 2],
      [CYL, BRASS, 0.2, 1.25, 0.2, 0.35, 1.0, 0, -1.2],
      [BOX, STEEL, 0.5, 0.3, 0.6, -0.3, 0.9, 0],
    ],
    accent: [
      [CYL, W, 0.24, 0.12, 0.24, 0.82, 1.18, 0, -1.2],
      [BOX, W, 0.05, 0.5, 0.4, -0.62, 1.35, 0],
    ],
  },
  vanguard: {
    body: [
      [BOX, DARK, 0.36, 0.8, 0.36, 0, 0.4, 0.32],
      [BOX, DARK, 0.36, 0.8, 0.36, 0, 0.4, -0.32],
      [BOX, 0x5a5f78, 0.85, 1.0, 1.15, 0, 1.3, 0],
      [BOX, BRASS, 0.7, 0.42, 0.5, 0, 1.75, 0.75],
      [BOX, BRASS, 0.7, 0.42, 0.5, 0, 1.75, -0.75],
      [BOX, STEEL, 0.4, 0.38, 0.42, 0.05, 2.0, 0],
      [CONE, BRASS, 0.1, 0.42, 0.1, 0.05, 2.36, 0.2],
      [CONE, BRASS, 0.1, 0.42, 0.1, 0.05, 2.36, -0.2],
      [CYL, WOOD, 0.06, 1.7, 0.06, 0.5, 1.2, 0.85, -0.4],
      [BOX, STEEL, 0.44, 0.44, 0.44, 0.86, 1.95, 0.85],
    ],
    accent: [
      [BOX, W, 0.14, 0.4, 0.4, 0.43, 1.35, 0],
      [BOX, W, 0.46, 0.1, 0.1, 0, 2.24, 0],
      [BOX, W, 0.48, 0.12, 0.48, 0.86, 1.95, 0.85],
    ],
  },
};

const MAX = 128;

export class MinionRenderer {
  private meshes = new Map<string, { body: THREE.InstancedMesh; accent: THREE.InstancedMesh; n: number }>();
  private m = new THREE.Matrix4();
  private p = new THREE.Vector3();
  private q = new THREE.Quaternion();
  private s = new THREE.Vector3();
  private c = new THREE.Color();
  private e = new THREE.Euler();

  constructor(scene: THREE.Scene, shadows: boolean) {
    for (const [type, def] of Object.entries(DEFS)) {
      const body = new THREE.InstancedMesh(bake(def.body), new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }), MAX);
      const accent = new THREE.InstancedMesh(bake(def.accent), new THREE.MeshBasicMaterial(), MAX);
      body.castShadow = shadows;
      body.frustumCulled = accent.frustumCulled = false;
      body.count = accent.count = 0;
      accent.setColorAt(0, this.c.setHex(0xffffff));
      scene.add(body, accent);
      this.meshes.set(type, { body, accent, n: 0 });
    }
  }

  begin(): void {
    for (const m of this.meshes.values()) m.n = 0;
  }

  add(type: string, x: number, y: number, facing: number, color: number, anim: number, prog: number, time: number, id: number, big: boolean): void {
    const m = this.meshes.get(type) ?? this.meshes.get('guard')!;
    if (m.n >= MAX) return;
    const ph = id * 1.7;
    let bob = 0;
    let lunge = 0;
    let lean = 0;
    if (anim === ANIM.run) {
      bob = Math.abs(Math.sin(time * 9 + ph)) * 0.08;
      lean = -0.08;
    } else if (anim === ANIM.attack) {
      const sw = Math.sin(Math.min(1, prog) * Math.PI);
      lunge = sw * 0.28;
      lean = -sw * 0.3;
    }
    this.e.set(0, facing, lean, 'YXZ');
    this.q.setFromEuler(this.e);
    this.p.set(x + Math.cos(facing) * lunge, bob, -y - Math.sin(facing) * lunge);
    const sc = big ? 1.18 : 1;
    this.s.set(sc, sc, sc);
    this.m.compose(this.p, this.q, this.s);
    m.body.setMatrixAt(m.n, this.m);
    m.accent.setMatrixAt(m.n, this.m);
    m.accent.setColorAt(m.n, this.c.setHex(color));
    m.n++;
  }

  end(): void {
    for (const m of this.meshes.values()) {
      m.body.count = m.accent.count = m.n;
      m.body.instanceMatrix.needsUpdate = true;
      m.accent.instanceMatrix.needsUpdate = true;
      if (m.accent.instanceColor) m.accent.instanceColor.needsUpdate = true;
    }
  }
}
