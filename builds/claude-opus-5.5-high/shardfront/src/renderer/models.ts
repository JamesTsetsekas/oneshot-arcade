// Procedural, original low-poly models. Each model is three merged geometries:
//   body   — lit, vertex colored
//   glow   — unlit, vertex colored (lamps, bioluminescence)
//   accent — unlit, tinted per instance with team color (base ring / stripe)
// Units face +Z with their feet at y = 0. One world unit == one map cell.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export interface ModelGeo { body: THREE.BufferGeometry; glow: THREE.BufferGeometry | null; accent: THREE.BufferGeometry | null; height: number }

type Part = 'body' | 'glow' | 'accent';

class Builder {
  parts: Record<Part, THREE.BufferGeometry[]> = { body: [], glow: [], accent: [] };
  add(g: THREE.BufferGeometry, color: number | string, part: Part = 'body', pos: [number, number, number] = [0, 0, 0], rot: [number, number, number] = [0, 0, 0], scale: [number, number, number] = [1, 1, 1]) {
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(...pos),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)),
      new THREE.Vector3(...scale),
    );
    let geo = g.index ? g.toNonIndexed() : g.clone();
    geo.applyMatrix4(m);
    // drop uvs so all parts merge cleanly
    geo.deleteAttribute('uv');
    const c = new THREE.Color(color);
    const n = geo.attributes.position.count;
    const cols = new Float32Array(n * 3);
    // slight per-face shading variation for a faceted, hand-made look
    for (let i = 0; i < n; i++) {
      const v = 1 - ((Math.floor(i / 3) * 7) % 5) * 0.025;
      cols[i * 3] = c.r * v; cols[i * 3 + 1] = c.g * v; cols[i * 3 + 2] = c.b * v;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    if (!geo.attributes.normal) geo.computeVertexNormals();
    this.parts[part].push(geo);
    return this;
  }
  box(w: number, h: number, d: number, color: number | string, pos: [number, number, number], part: Part = 'body', rot: [number, number, number] = [0, 0, 0]) {
    return this.add(new THREE.BoxGeometry(w, h, d), color, part, pos, rot);
  }
  cyl(rt: number, rb: number, h: number, seg: number, color: number | string, pos: [number, number, number], part: Part = 'body', rot: [number, number, number] = [0, 0, 0]) {
    return this.add(new THREE.CylinderGeometry(rt, rb, h, seg), color, part, pos, rot);
  }
  sphere(r: number, color: number | string, pos: [number, number, number], part: Part = 'body', scale: [number, number, number] = [1, 1, 1], detail = 1) {
    return this.add(new THREE.IcosahedronGeometry(r, detail), color, part, pos, [0, 0, 0], scale);
  }
  cone(r: number, h: number, seg: number, color: number | string, pos: [number, number, number], part: Part = 'body', rot: [number, number, number] = [0, 0, 0]) {
    return this.add(new THREE.ConeGeometry(r, h, seg), color, part, pos, rot);
  }
  ring(r: number, w: number, color: number | string, y = 0.04, part: Part = 'accent') {
    return this.add(new THREE.RingGeometry(r - w, r, 28), color, part, [0, y, 0], [-Math.PI / 2, 0, 0]);
  }
  build(height: number): ModelGeo {
    const merge = (a: THREE.BufferGeometry[]) => (a.length ? mergeGeometries(a, false) : null);
    const body = merge(this.parts.body) ?? new THREE.BoxGeometry(0.1, 0.1, 0.1);
    return { body, glow: merge(this.parts.glow), accent: merge(this.parts.accent), height };
  }
}

// palettes
const H = { hull: '#5d636d', plate: '#9aa0a8', dark: '#2a2e35', lamp: '#ffc46b', white: '#fff1d6', joint: '#3d4350', rust: '#8a6a4a' };
const V = { membrane: '#8c63c9', pale: '#c9b2ef', stalk: '#3f3152', bark: '#2d2638', glow: '#e3a6ff', teal: '#7ff5e0', flesh: '#b07fd6' };

function leg(b: Builder, x: number, z: number, h: number, color: string, w = 0.12) {
  b.box(w, h, w, color, [x, h / 2, z]);
}

const UNIT_MODELS: Record<string, (b: Builder) => number> = {
  fabricator: (b) => {
    b.box(0.6, 0.32, 0.7, H.hull, [0, 0.42, 0]);
    b.box(0.5, 0.12, 0.5, H.plate, [0, 0.64, -0.05]);
    for (const [x, z] of [[-0.25, 0.25], [0.25, 0.25], [-0.25, -0.25], [0.25, -0.25]]) leg(b, x, z, 0.3, H.joint);
    b.box(0.08, 0.08, 0.45, H.joint, [0.22, 0.55, 0.4]);
    b.sphere(0.07, H.lamp, [0.22, 0.55, 0.65], 'glow');
    b.box(0.16, 0.08, 0.04, H.lamp, [-0.1, 0.5, 0.36], 'glow');
    b.box(0.62, 0.05, 0.1, '#fff', [0, 0.6, -0.36], 'accent');
    b.ring(0.48, 0.07, '#fff');
    return 0.75;
  },
  kestrel: (b) => {
    b.box(0.7, 0.22, 1.0, H.hull, [0, 0.36, 0]);
    b.box(0.5, 0.16, 0.5, H.plate, [0, 0.54, -0.1], 'body');
    for (const [x, z] of [[-0.4, 0.33], [0.4, 0.33], [-0.4, -0.33], [0.4, -0.33]]) b.cyl(0.17, 0.17, 0.12, 10, H.dark, [x, 0.17, z], 'body', [0, 0, Math.PI / 2]);
    b.cyl(0.03, 0.03, 0.55, 5, H.joint, [0, 0.85, -0.25]);
    b.sphere(0.07, H.lamp, [0, 1.12, -0.25], 'glow');
    b.box(0.3, 0.06, 0.05, H.white, [0, 0.42, 0.51], 'glow');
    b.box(0.06, 0.06, 0.4, H.dark, [0.18, 0.55, 0.35]);
    b.box(0.72, 0.05, 0.12, '#fff', [0, 0.49, -0.45], 'accent');
    b.ring(0.55, 0.07, '#fff');
    return 1.1;
  },
  bulwark: (b) => {
    leg(b, -0.2, 0, 0.55, H.joint, 0.16); leg(b, 0.2, 0, 0.55, H.joint, 0.16);
    b.box(0.24, 0.1, 0.36, H.dark, [-0.2, 0.05, 0.06]); b.box(0.24, 0.1, 0.36, H.dark, [0.2, 0.05, 0.06]);
    b.box(0.66, 0.42, 0.5, H.hull, [0, 0.8, 0]);
    b.box(0.72, 0.14, 0.4, H.plate, [0, 1.06, -0.03]);
    b.box(0.1, 0.1, 0.7, H.dark, [0.28, 0.82, 0.45]);
    b.box(0.3, 0.07, 0.05, H.lamp, [0, 0.92, 0.26], 'glow');
    b.box(0.68, 0.06, 0.08, '#fff', [0, 0.66, -0.26], 'accent');
    b.ring(0.6, 0.08, '#fff');
    return 1.2;
  },
  arc_lancer: (b) => {
    leg(b, -0.28, 0.1, 0.6, H.joint, 0.18); leg(b, 0.28, 0.1, 0.6, H.joint, 0.18); leg(b, 0, -0.25, 0.6, H.joint, 0.18);
    b.box(0.85, 0.45, 0.75, H.hull, [0, 0.85, 0]);
    b.box(0.3, 0.3, 0.3, H.plate, [-0.45, 1.05, 0], 'body', [0, 0, 0.3]);
    b.box(0.3, 0.3, 0.3, H.plate, [0.45, 1.05, 0], 'body', [0, 0, -0.3]);
    b.cyl(0.07, 0.1, 1.2, 6, H.dark, [0, 1.0, 0.65], 'body', [Math.PI / 2, 0, 0]);
    for (let i = 0; i < 3; i++) b.cyl(0.13, 0.13, 0.06, 8, H.white, [0, 1.0, 0.35 + i * 0.25], 'glow', [Math.PI / 2, 0, 0]);
    b.box(0.86, 0.07, 0.08, '#fff', [0, 0.7, -0.38], 'accent');
    b.ring(0.7, 0.09, '#fff');
    return 1.4;
  },
  mender_rig: (b) => {
    b.cyl(0.35, 0.45, 0.3, 8, H.hull, [0, 0.7, 0]);
    b.box(1.1, 0.08, 0.16, H.joint, [0, 0.72, 0]);
    b.box(0.16, 0.08, 1.1, H.joint, [0, 0.72, 0]);
    for (const [x, z] of [[0.55, 0], [-0.55, 0], [0, 0.55], [0, -0.55]]) b.cyl(0.13, 0.13, 0.06, 10, H.dark, [x, 0.78, z]);
    b.sphere(0.16, '#ffe9b0', [0, 0.95, 0], 'glow');
    b.cyl(0.25, 0.25, 0.04, 12, '#fff', [0, 0.52, 0], 'accent');
    b.ring(0.58, 0.08, '#fff');
    return 1.1;
  },
  mortar_crawler: (b) => {
    for (const s of [-1, 1]) for (const z of [-0.35, 0, 0.35]) b.box(0.4, 0.1, 0.1, H.joint, [s * 0.5, 0.2, z], 'body', [0, 0, s * 0.5]);
    b.box(0.8, 0.35, 1.0, H.hull, [0, 0.45, 0]);
    b.box(0.6, 0.2, 0.6, H.plate, [0, 0.72, -0.1]);
    b.cyl(0.16, 0.2, 0.9, 8, H.dark, [0, 1.05, 0.1], 'body', [-0.75, 0, 0]);
    b.box(0.2, 0.05, 0.05, H.lamp, [0.2, 0.65, 0.51], 'glow');
    b.box(0.2, 0.05, 0.05, H.lamp, [-0.2, 0.65, 0.51], 'glow');
    b.box(0.82, 0.06, 0.1, '#fff', [0, 0.5, -0.5], 'accent');
    b.ring(0.75, 0.09, '#fff');
    return 1.4;
  },
  aegis_frame: (b) => {
    leg(b, -0.38, 0, 0.8, H.joint, 0.26); leg(b, 0.38, 0, 0.8, H.joint, 0.26);
    b.box(1.2, 0.7, 0.9, H.hull, [0, 1.2, 0]);
    b.box(1.35, 0.22, 0.8, H.plate, [0, 1.62, -0.05]);
    b.box(0.35, 0.35, 0.35, H.plate, [-0.75, 1.35, 0]); b.box(0.35, 0.35, 0.35, H.plate, [0.75, 1.35, 0]);
    b.box(0.14, 0.14, 0.8, H.dark, [0.75, 1.15, 0.45]); b.box(0.14, 0.14, 0.8, H.dark, [-0.75, 1.15, 0.45]);
    b.box(1.5, 1.1, 0.06, '#9fe8ff', [0, 1.15, 0.85], 'glow');
    b.box(0.5, 0.08, 0.05, H.lamp, [0, 1.4, 0.46], 'glow');
    b.box(1.22, 0.08, 0.1, '#fff', [0, 1.0, -0.46], 'accent');
    b.ring(1.0, 0.11, '#fff');
    return 2.1;
  },
  // ---------- Verdant ----------
  tender: (b) => {
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; b.cone(0.06, 0.4, 5, V.stalk, [Math.sin(a) * 0.22, 0.2, Math.cos(a) * 0.22], 'body', [Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5]); }
    b.sphere(0.3, V.membrane, [0, 0.55, 0], 'body', [1, 0.8, 1.1]);
    b.sphere(0.12, V.glow, [0, 0.82, 0.05], 'glow');
    b.sphere(0.06, V.teal, [0.12, 0.6, 0.28], 'glow');
    b.cyl(0.22, 0.3, 0.06, 8, '#fff', [0, 0.36, 0], 'accent');
    b.ring(0.46, 0.07, '#fff');
    return 0.9;
  },
  glimmerwing: (b) => {
    b.sphere(0.22, V.flesh, [0, 0.0, 0], 'body', [0.8, 0.7, 1.5]);
    b.add(new THREE.CircleGeometry(0.6, 7), V.pale, 'body', [0.55, 0.05, 0], [-Math.PI / 2, 0, 0.3], [1, 0.6, 1]);
    b.add(new THREE.CircleGeometry(0.6, 7), V.pale, 'body', [-0.55, 0.05, 0], [-Math.PI / 2, 0, -0.3], [1, 0.6, 1]);
    b.add(new THREE.CircleGeometry(0.6, 7), V.pale, 'body', [0.55, 0.05, 0], [Math.PI / 2, 0, -0.3], [1, 0.6, 1]);
    b.add(new THREE.CircleGeometry(0.6, 7), V.pale, 'body', [-0.55, 0.05, 0], [Math.PI / 2, 0, 0.3], [1, 0.6, 1]);
    b.sphere(0.1, V.teal, [0, 0.08, 0.3], 'glow');
    b.sphere(0.08, V.glow, [0, 0.02, -0.3], 'glow');
    b.cyl(0.18, 0.18, 0.04, 8, '#fff', [0, -0.15, 0], 'accent');
    return 0.6;
  },
  thornling: (b) => {
    b.sphere(0.28, V.flesh, [0, 0.4, 0], 'body', [0.9, 0.7, 1.2]);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; b.cone(0.06, 0.35, 4, V.bark, [Math.sin(a) * 0.2, 0.55, Math.cos(a) * 0.2 - 0.05], 'body', [Math.cos(a) * 0.9, 0, -Math.sin(a) * 0.9]); }
    for (const [x, z] of [[-0.18, 0.2], [0.18, 0.2], [-0.18, -0.2], [0.18, -0.2]]) b.cone(0.05, 0.3, 4, V.stalk, [x, 0.15, z], 'body', [Math.PI, 0, 0]);
    b.cone(0.07, 0.3, 4, V.pale, [0, 0.4, 0.42], 'body', [Math.PI / 2, 0, 0]);
    b.sphere(0.05, V.glow, [0.1, 0.5, 0.3], 'glow'); b.sphere(0.05, V.glow, [-0.1, 0.5, 0.3], 'glow');
    b.cyl(0.18, 0.24, 0.05, 8, '#fff', [0, 0.3, -0.1], 'accent');
    b.ring(0.46, 0.07, '#fff');
    return 0.8;
  },
  sporecaster: (b) => {
    for (const s of [-1, 1]) b.cone(0.06, 0.6, 5, V.stalk, [s * 0.18, 0.3, 0], 'body', [0, 0, s * 0.25 + Math.PI]);
    b.sphere(0.35, V.membrane, [0, 0.85, 0], 'body', [1, 1.1, 1]);
    b.sphere(0.2, V.pale, [0, 0.9, 0.22], 'body', [1, 0.8, 0.6]);
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; b.sphere(0.06, V.teal, [Math.sin(a) * 0.3, 1.0 + Math.cos(a) * 0.1, Math.cos(a) * 0.25], 'glow'); }
    b.cyl(0.06, 0.1, 0.3, 6, V.bark, [0, 0.95, 0.45], 'body', [Math.PI / 2, 0, 0]);
    b.cyl(0.25, 0.3, 0.05, 8, '#fff', [0, 0.55, 0], 'accent');
    b.ring(0.5, 0.07, '#fff');
    return 1.25;
  },
  carapace_guard: (b) => {
    b.add(new THREE.SphereGeometry(0.75, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), V.bark, 'body', [0, 0.25, 0], [0, 0, 0], [1, 0.9, 1.15]);
    for (let i = 0; i < 4; i++) b.box(1.3 - i * 0.15, 0.1, 0.18, V.membrane, [0, 0.6 + i * 0.12 - Math.abs(i - 1.5) * 0.05, -0.45 + i * 0.3]);
    for (const [x, z] of [[-0.45, 0.35], [0.45, 0.35], [-0.45, -0.35], [0.45, -0.35]]) b.cone(0.1, 0.35, 4, V.stalk, [x, 0.17, z], 'body', [Math.PI, 0, 0]);
    b.sphere(0.07, V.glow, [0.18, 0.55, 0.78], 'glow'); b.sphere(0.07, V.glow, [-0.18, 0.55, 0.78], 'glow');
    b.box(1.0, 0.06, 0.1, '#fff', [0, 0.32, -0.8], 'accent');
    b.ring(0.8, 0.09, '#fff');
    return 1.1;
  },
  bloom_sage: (b) => {
    b.cyl(0.08, 0.16, 1.2, 6, V.stalk, [0, 0.6, 0]);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; b.sphere(0.2, V.pale, [Math.sin(a) * 0.28, 1.35, Math.cos(a) * 0.28], 'body', [1, 0.3, 1.6]); }
    b.sphere(0.16, V.glow, [0, 1.42, 0], 'glow');
    for (const s of [-1, 1]) b.cone(0.05, 0.5, 4, V.bark, [s * 0.25, 0.6, 0.1], 'body', [0.4, 0, s * 0.8]);
    for (const s of [-1, 1]) b.sphere(0.05, V.teal, [s * 0.43, 0.75, 0.2], 'glow');
    b.cyl(0.25, 0.32, 0.06, 8, '#fff', [0, 0.1, 0], 'accent');
    b.ring(0.55, 0.07, '#fff');
    return 1.6;
  },
  rift_stag: (b) => {
    for (const [x, z] of [[-0.25, 0.4], [0.25, 0.4], [-0.25, -0.4], [0.25, -0.4]]) b.cone(0.07, 0.85, 5, V.stalk, [x, 0.42, z], 'body', [Math.PI, 0, 0]);
    b.sphere(0.4, V.flesh, [0, 1.0, 0], 'body', [0.8, 0.7, 1.4]);
    b.cyl(0.1, 0.16, 0.6, 6, V.flesh, [0, 1.3, 0.55], 'body', [0.7, 0, 0]);
    b.sphere(0.17, V.membrane, [0, 1.55, 0.8], 'body', [0.8, 0.8, 1.2]);
    for (const s of [-1, 1]) {
      b.cone(0.04, 0.6, 4, V.glow, [s * 0.18, 1.95, 0.75], 'glow', [0.2, 0, s * 0.5]);
      b.cone(0.03, 0.35, 4, V.glow, [s * 0.35, 1.95, 0.6], 'glow', [-0.4, 0, s * 1.0]);
    }
    b.sphere(0.12, V.teal, [0, 1.05, -0.45], 'glow');
    b.box(0.5, 0.06, 0.1, '#fff', [0, 0.85, -0.5], 'accent');
    b.ring(0.75, 0.09, '#fff');
    return 2.1;
  },
  crownbeast: (b) => {
    for (const [x, z] of [[-0.5, 0.55], [0.5, 0.55], [-0.5, -0.55], [0.5, -0.55]]) b.cyl(0.14, 0.2, 0.8, 6, V.bark, [x, 0.4, z]);
    b.sphere(0.75, V.flesh, [0, 1.15, 0], 'body', [1.0, 0.75, 1.3]);
    b.sphere(0.45, V.membrane, [0, 1.2, 0.95], 'body', [1, 0.85, 0.9]);
    for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; b.cone(0.08, 0.6, 4, V.glow, [Math.sin(a) * 0.35, 1.9, Math.cos(a) * 0.35 + 0.1], 'glow', [Math.cos(a) * 0.4, 0, -Math.sin(a) * 0.4]); }
    for (let i = 0; i < 5; i++) b.cone(0.1, 0.45, 4, V.bark, [0, 1.65 - i * 0.05, -0.3 - i * 0.22], 'body', [-0.9, 0, 0]);
    b.sphere(0.08, V.teal, [0.2, 1.35, 1.35], 'glow'); b.sphere(0.08, V.teal, [-0.2, 1.35, 1.35], 'glow');
    b.box(1.3, 0.07, 0.1, '#fff', [0, 0.95, -0.95], 'accent');
    b.ring(1.05, 0.11, '#fff');
    return 2.3;
  },
};

const STRUCTURE_MODELS: Record<string, (b: Builder, s: number) => number> = {
  core_relay: (b, s) => {
    b.cyl(s * 0.5, s * 0.52, 0.5, 6, H.dark, [0, 0.25, 0]);
    b.cyl(s * 0.42, s * 0.46, 0.8, 6, H.hull, [0, 0.9, 0]);
    b.box(s * 0.35, 1.8, s * 0.35, H.plate, [0, 2.0, 0]);
    b.cyl(0.15, 0.15, 2.2, 6, H.joint, [0, 3.8, 0]);
    for (let i = 0; i < 3; i++) b.cyl(0.6 - i * 0.12, 0.6 - i * 0.12, 0.06, 12, H.lamp, [0, 3.0 + i * 0.5, 0], 'glow');
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + Math.PI / 6; b.box(0.5, 0.3, 0.12, H.lamp, [Math.sin(a) * s * 0.44, 1.0, Math.cos(a) * s * 0.44], 'glow', [0, a, 0]); }
    b.box(s * 0.9, 0.1, 0.5, H.rust, [0, 0.55, s * 0.42]);
    b.cyl(s * 0.53, s * 0.53, 0.12, 6, '#fff', [0, 0.52, 0], 'accent');
    return 5;
  },
  grid_pylon: (b, s) => {
    b.box(s * 0.7, 0.3, s * 0.7, H.dark, [0, 0.15, 0]);
    b.cyl(0.18, 0.32, 2.6, 4, H.hull, [0, 1.6, 0]);
    b.cyl(0.55, 0.55, 0.08, 16, H.lamp, [0, 2.2, 0], 'glow');
    b.sphere(0.2, H.white, [0, 3.05, 0], 'glow');
    b.box(s * 0.72, 0.08, 0.12, '#fff', [0, 0.32, s * 0.35], 'accent');
    return 3.2;
  },
  assembly_bay: (b, s) => {
    b.box(s * 0.95, 0.4, s * 0.95, H.dark, [0, 0.2, 0]);
    b.box(s * 0.85, 1.7, s * 0.75, H.hull, [0, 1.25, -0.2]);
    b.box(s * 0.9, 0.25, s * 0.8, H.plate, [0, 2.2, -0.2]);
    b.box(s * 0.5, 1.2, 0.1, '#1b1d22', [0, 1.0, s * 0.18]);
    for (let i = 0; i < 4; i++) b.box(0.12, 0.12, 0.08, H.lamp, [-s * 0.3 + i * s * 0.2, 1.75, s * 0.19], 'glow');
    b.box(0.3, 1.5, 0.3, H.joint, [s * 0.38, 2.5, -s * 0.3]);
    b.box(s * 0.9, 0.1, 0.12, '#fff', [0, 0.42, s * 0.47], 'accent');
    return 3;
  },
  flux_tap: (b, s) => {
    b.cyl(s * 0.45, s * 0.5, 0.4, 8, H.dark, [0, 0.2, 0]);
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.78; b.box(0.15, 2.6, 0.15, H.joint, [Math.sin(a) * 0.9, 1.4, Math.cos(a) * 0.9], 'body', [Math.cos(a) * 0.25, 0, -Math.sin(a) * 0.25]); }
    b.cyl(0.35, 0.45, 1.4, 8, H.hull, [0, 1.0, 0]);
    b.sphere(0.35, '#ff9a3c', [0, 2.6, 0], 'glow');
    b.cyl(0.5, 0.5, 0.1, 10, '#ffbf6b', [0, 1.8, 0], 'glow');
    b.cyl(s * 0.5, s * 0.5, 0.1, 8, '#fff', [0, 0.42, 0], 'accent');
    return 3;
  },
  signal_foundry: (b, s) => {
    b.box(s * 0.95, 0.4, s * 0.95, H.dark, [0, 0.2, 0]);
    b.box(s * 0.7, 1.3, s * 0.7, H.hull, [-0.3, 1.05, 0]);
    b.box(s * 0.35, 2.2, s * 0.35, H.plate, [s * 0.25, 1.5, s * 0.2]);
    b.add(new THREE.SphereGeometry(0.9, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2.4), H.plate, 'body', [-0.3, 2.3, 0], [0.5, 0, 0.3]);
    b.cyl(0.05, 0.05, 1.0, 4, H.joint, [-0.3, 2.6, 0]);
    b.sphere(0.12, H.lamp, [-0.3, 3.1, 0], 'glow');
    for (let i = 0; i < 3; i++) b.box(0.4, 0.08, 0.06, H.white, [s * 0.25, 1.0 + i * 0.5, s * 0.38], 'glow');
    b.box(s * 0.9, 0.1, 0.12, '#fff', [0, 0.42, s * 0.47], 'accent');
    return 3.2;
  },
  sentry_arc: (b, s) => {
    b.cyl(s * 0.4, s * 0.48, 0.5, 8, H.dark, [0, 0.25, 0]);
    b.cyl(0.4, 0.45, 0.4, 8, H.hull, [0, 0.7, 0]);
    b.box(0.6, 0.35, 0.7, H.plate, [0, 1.05, 0.1]);
    b.box(0.08, 0.08, 0.9, H.dark, [0.15, 1.05, 0.7]); b.box(0.08, 0.08, 0.9, H.dark, [-0.15, 1.05, 0.7]);
    b.box(0.3, 0.06, 0.05, H.lamp, [0, 1.2, 0.46], 'glow');
    b.cyl(s * 0.49, s * 0.49, 0.08, 8, '#fff', [0, 0.5, 0], 'accent');
    return 1.4;
  },
  // ---------- Verdant ----------
  heartgrove: (b, s) => {
    for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; b.cone(0.35, s * 0.55, 5, V.bark, [Math.sin(a) * s * 0.33, 0.25, Math.cos(a) * s * 0.33], 'body', [Math.PI / 2 - 0.2, a, 0]); }
    b.sphere(s * 0.34, V.membrane, [0, 1.1, 0], 'body', [1, 0.75, 1]);
    b.cyl(0.4, 0.7, 2.4, 7, V.stalk, [0, 2.2, 0]);
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + 0.3; b.sphere(0.7, V.pale, [Math.sin(a) * 1.0, 3.5 + (i % 2) * 0.3, Math.cos(a) * 1.0], 'body', [1, 0.5, 1]); }
    b.sphere(0.5, V.glow, [0, 3.7, 0], 'glow');
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; b.sphere(0.14, V.teal, [Math.sin(a) * s * 0.3, 0.9, Math.cos(a) * s * 0.3], 'glow'); }
    b.cyl(s * 0.5, s * 0.52, 0.1, 9, '#fff', [0, 0.06, 0], 'accent');
    return 4.4;
  },
  root_node: (b, s) => {
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.4; b.cone(0.12, 1.0, 4, V.bark, [Math.sin(a) * 0.5, 0.15, Math.cos(a) * 0.5], 'body', [Math.PI / 2 - 0.15, a, 0]); }
    b.sphere(0.55, V.membrane, [0, 0.75, 0], 'body', [1, 1.3, 1]);
    b.sphere(0.25, V.glow, [0, 1.35, 0], 'glow');
    b.cyl(s * 0.48, s * 0.5, 0.08, 8, '#fff', [0, 0.05, 0], 'accent');
    return 1.6;
  },
  brood_hollow: (b, s) => {
    b.add(new THREE.SphereGeometry(s * 0.48, 12, 7, 0, Math.PI * 2, 0, Math.PI / 2), V.bark, 'body', [0, 0, 0], [0, 0, 0], [1, 0.75, 1]);
    b.sphere(0.6, '#140f1c', [0, 0.45, s * 0.38], 'body', [1.2, 0.9, 0.5]);
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; b.sphere(0.45, V.membrane, [Math.sin(a) * s * 0.3, 1.2, Math.cos(a) * s * 0.3 - 0.2], 'body', [1, 0.7, 1]); }
    for (let i = 0; i < 4; i++) b.sphere(0.1, V.glow, [-0.6 + i * 0.4, 0.95, s * 0.36], 'glow');
    b.sphere(0.25, V.teal, [0, 1.8, -0.2], 'glow');
    b.cyl(s * 0.5, s * 0.52, 0.08, 10, '#fff', [0, 0.05, 0], 'accent');
    return 2.2;
  },
  flux_siphon: (b, s) => {
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; b.cone(0.15, 1.2, 4, V.stalk, [Math.sin(a) * 0.9, 0.5, Math.cos(a) * 0.9], 'body', [Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5]); }
    b.sphere(0.8, V.membrane, [0, 1.1, 0], 'body', [1, 0.8, 1]);
    b.sphere(0.4, '#ffb070', [0, 1.7, 0], 'glow');
    b.cyl(s * 0.48, s * 0.5, 0.08, 9, '#fff', [0, 0.05, 0], 'accent');
    return 2.2;
  },
  memory_bloom: (b, s) => {
    b.cyl(0.35, 0.6, 2.2, 6, V.stalk, [0, 1.1, 0]);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; b.sphere(0.65, i % 2 ? V.pale : V.membrane, [Math.sin(a) * 1.0, 2.5, Math.cos(a) * 1.0], 'body', [0.8, 0.25, 1.8]); }
    b.sphere(0.5, V.glow, [0, 2.7, 0], 'glow');
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.5; b.cone(0.3, 1.2, 5, V.bark, [Math.sin(a) * s * 0.35, 0.3, Math.cos(a) * s * 0.35], 'body', [Math.PI / 2 - 0.3, a, 0]); }
    b.cyl(s * 0.5, s * 0.52, 0.08, 10, '#fff', [0, 0.05, 0], 'accent');
    return 3.1;
  },
  needle_pod: (b, s) => {
    b.sphere(0.6, V.bark, [0, 0.55, 0], 'body', [1, 0.9, 1]);
    for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; b.cone(0.07, 0.8, 4, V.pale, [Math.sin(a) * 0.45, 0.95, Math.cos(a) * 0.45], 'body', [Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5]); }
    b.sphere(0.2, V.teal, [0, 1.1, 0.35], 'glow');
    b.cyl(s * 0.48, s * 0.5, 0.08, 8, '#fff', [0, 0.05, 0], 'accent');
    return 1.6;
  },
};

const NEUTRAL_MODELS: Record<string, (b: Builder) => number> = {
  ore: (b) => {
    const pts = [[0, 0, 0, 1.2], [0.4, 0.2, 0.7], [-0.45, -0.3, 0.8], [0.1, -0.5, 0.6], [-0.2, 0.45, 0.55]];
    for (const [x, z, h, sc] of pts.map((p) => [p[0], p[1], p[2] ?? 1, p[3] ?? 1])) {
      b.cyl(0.18 * sc, 0.24 * sc, 1.3 * h * sc, 6, '#39e0d0', [x, 0.6 * h * sc, z], 'glow', [x * 0.4, 0, z * 0.4]);
      b.cone(0.18 * sc, 0.35 * sc, 6, '#a9fff4', [x + x * 0.25 * h, 1.3 * h * sc + 0.1, z + z * 0.25 * h], 'glow', [x * 0.4, 0, z * 0.4]);
    }
    b.cyl(0.8, 0.95, 0.18, 7, '#2e3440', [0, 0.05, 0]);
    return 1.5;
  },
  vent: (b) => {
    b.cyl(1.3, 1.5, 0.3, 9, '#2b2a2e', [0, 0.1, 0]);
    b.cyl(0.8, 1.0, 0.32, 9, '#16151a', [0, 0.14, 0]);
    b.cyl(0.6, 0.6, 0.05, 9, '#ff8b2e', [0, 0.31, 0], 'glow');
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; b.box(0.3, 0.5, 0.3, '#3a3640', [Math.sin(a) * 1.3, 0.3, Math.cos(a) * 1.3], 'body', [0.2, a, 0.1]); }
    return 0.6;
  },
  pylon: (b) => {
    b.cyl(0.9, 1.1, 0.3, 8, '#3a3d44', [0, 0.15, 0]);
    b.cyl(0.15, 0.35, 3.2, 4, '#6f7580', [0, 1.8, 0]);
    b.add(new THREE.OctahedronGeometry(0.45), '#e8f6ff', 'accent', [0, 3.7, 0]);
    b.cyl(0.7, 0.7, 0.06, 12, '#e8f6ff', [0, 2.6, 0], 'accent');
    return 4.2;
  },
  barrier: (b) => {
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4, r = (i % 3) * 0.55;
      b.cyl(0.35, 0.5, 2.6 - (i % 4) * 0.4, 5, i % 2 ? '#bfe9ff' : '#8fd8ff', [Math.sin(a) * r, 1.1, Math.cos(a) * r], 'glow', [Math.sin(a) * 0.3, 0, Math.cos(a) * 0.3]);
    }
    b.cyl(1.6, 1.8, 0.3, 8, '#2a3038', [0, 0.1, 0]);
    return 2.6;
  },
  pod: (b) => {
    b.cyl(0.35, 0.35, 0.9, 8, '#7d848f', [0, 0.35, 0], 'body', [Math.PI / 2, 0, 0.4]);
    b.sphere(0.36, '#7d848f', [0.17, 0.35, 0.4], 'body', [1, 1, 0.7]);
    b.box(0.5, 0.08, 0.3, '#ffe08a', [0, 0.72, 0], 'glow', [0, 0.4, 0]);
    return 0.8;
  },
  sensor_spike: (b) => {
    b.cone(0.12, 1.2, 4, '#c8ccd4', [0, 0.6, 0]);
    b.sphere(0.12, '#ffb347', [0, 1.25, 0], 'glow');
    return 1.3;
  },
};

const cache = new Map<string, ModelGeo>();
export function modelFor(key: string, size = 0): ModelGeo {
  const k = key + ':' + size;
  const c = cache.get(k);
  if (c) return c;
  const b = new Builder();
  let h = 1;
  if (UNIT_MODELS[key]) h = UNIT_MODELS[key](b);
  else if (STRUCTURE_MODELS[key]) h = STRUCTURE_MODELS[key](b, size);
  else if (NEUTRAL_MODELS[key]) h = NEUTRAL_MODELS[key](b);
  else { b.box(1, 1, 1, '#f0f', [0, 0.5, 0]); }
  const m = b.build(h);
  cache.set(k, m);
  return m;
}

/** Decorative props for the terrain kit. */
export function decorGeometry(kind: 'crystal' | 'rock' | 'spire'): ModelGeo {
  const b = new Builder();
  if (kind === 'crystal') {
    b.cyl(0.12, 0.22, 1.1, 5, '#41d6c8', [0, 0.5, 0], 'glow', [0.2, 0, 0.1]);
    b.cyl(0.08, 0.16, 0.7, 5, '#7cf3e6', [0.25, 0.3, 0.1], 'glow', [-0.1, 0, -0.5]);
    b.cyl(0.07, 0.14, 0.6, 5, '#2bb3aa', [-0.2, 0.25, -0.1], 'glow', [0.3, 0, 0.5]);
  } else if (kind === 'rock') {
    b.add(new THREE.DodecahedronGeometry(0.6, 0), '#3b3e45', 'body', [0, 0.3, 0], [0.3, 0.5, 0.1], [1.2, 0.7, 1]);
    b.add(new THREE.DodecahedronGeometry(0.35, 0), '#8c8a84', 'body', [0.5, 0.2, 0.2], [0.8, 0.2, 0.4], [1, 0.6, 1]);
  } else {
    b.cyl(0.15, 0.55, 2.4, 5, '#4a4d55', [0, 1.1, 0], 'body', [0.08, 0, 0.05]);
    b.cyl(0.05, 0.12, 0.8, 5, '#41d6c8', [0.2, 1.6, 0.1], 'glow', [0, 0, -0.6]);
  }
  return b.build(1);
}
