// Procedural actor models and animation. Silhouette-first: strong shoulders/weapons, emissive eyes and marks.
import * as THREE from 'three';
import { ENEMIES } from '../data/enemies';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { box, cone, cyl, dodeca, octa, sph, torus } from './geo';

export interface AnimCtx {
  dt: number;
  time: number;
  speed: number; // 0..1 movement amount
  phase: number; // walk phase accumulator
  atk: number; // -1 none, 0..1 windup progress, >1 strike progress (1..2)
  cast: number; // player: -1 none, 0..1 cast progress
  castKind: string;
  flash: number;
  dead: number; // 0..1
  heat: number; // 0..1 player heat or enemy glow
  boss: { phase: number; invuln: boolean; broken: boolean; pattern: string; armor: number } | null;
  moveDir: number;
}

export interface ActorModel {
  root: THREE.Group;
  body: THREE.Group;
  parts: Record<string, THREE.Object3D>;
  mats: THREE.MeshStandardMaterial[];
  accentMats: THREE.MeshBasicMaterial[];
  height: number;
  radius: number;
  update(a: AnimCtx): void;
  setLoadout?(weapon: string, shield: boolean): void;
  noMerge?: boolean;
  tintAccent?(hex: number): void;
  dispose(): void;
}

function mk(geo: THREE.BufferGeometry, color: number, mats: THREE.MeshStandardMaterial[], o: { r?: number; m?: number; e?: number; ei?: number } = {}): THREE.Mesh {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: o.r ?? 0.75, metalness: Math.min(0.12, (o.m ?? 0.1) * 0.25), emissive: o.e ?? 0x2a2e3a, emissiveIntensity: o.ei ?? 1 });
  mats.push(mat);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  return mesh;
}
function glow(geo: THREE.BufferGeometry, color: number, acc: THREE.MeshBasicMaterial[], additive = false): THREE.Mesh {
  const mat = new THREE.MeshBasicMaterial({ color, toneMapped: false });
  if (additive) {
    mat.transparent = true;
    mat.blending = THREE.AdditiveBlending;
    mat.depthWrite = false;
  }
  acc.push(mat);
  return new THREE.Mesh(geo, mat);
}
function place<T extends THREE.Object3D>(o: T, x: number, y: number, z: number, parent?: THREE.Object3D): T {
  o.position.set(x, y, z);
  parent?.add(o);
  return o;
}

interface Builder {
  root: THREE.Group;
  body: THREE.Group;
  parts: Record<string, THREE.Object3D>;
  mats: THREE.MeshStandardMaterial[];
  acc: THREE.MeshBasicMaterial[];
}
function newBuilder(): Builder {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  return { root, body, parts: {}, mats: [], acc: [] };
}

/**
 * Draw-call optimisation: lit primitives inside each animated group are baked into one vertex-coloured mesh.
 * Animated groups (body, legs, arms, ...) stay separate so procedural animation keeps working; emissive
 * (MeshBasicMaterial) parts are left alone because several of them are animated individually.
 */
function mergeStatic(m: ActorModel) {
  const animated = new Set<THREE.Object3D>([m.body, ...Object.values(m.parts)]);
  const roots = new Set<THREE.Object3D>([m.body]);
  for (const o of Object.values(m.parts)) if (!(o as THREE.Mesh).isMesh) roots.add(o);
  const shared = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0.05, emissive: 0x2a2e3a, emissiveIntensity: 1 });
  shared.userData.base = 1;
  shared.userData.emis = 0x2a2e3a;
  let merged = 0;
  const tmp = new THREE.Color();
  for (const root of roots) {
    const list: { mesh: THREE.Mesh; mat: THREE.Matrix4 }[] = [];
    const walk = (node: THREE.Object3D, acc: THREE.Matrix4) => {
      for (const ch of [...node.children]) {
        ch.updateMatrix();
        const next = new THREE.Matrix4().multiplyMatrices(acc, ch.matrix);
        const mesh = ch as THREE.Mesh;
        if (mesh.isMesh && mesh.material instanceof THREE.MeshStandardMaterial && mesh.visible) list.push({ mesh, mat: next });
        else if (!mesh.isMesh && !animated.has(ch)) walk(ch, next);
      }
    };
    walk(root, new THREE.Matrix4());
    if (list.length < 2) continue;
    const geos = list.map(({ mesh, mat }) => {
      const g = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
      g.applyMatrix4(mat);
      const n = g.getAttribute('position').count;
      const col = new Float32Array(n * 3);
      tmp.copy((mesh.material as THREE.MeshStandardMaterial).color);
      for (let i = 0; i < n; i++) {
        col[i * 3] = tmp.r;
        col[i * 3 + 1] = tmp.g;
        col[i * 3 + 2] = tmp.b;
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      if (!g.getAttribute('uv')) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
      return g;
    });
    const geo = mergeGeometries(geos, false);
    if (!geo) continue;
    for (const { mesh } of list) {
      mesh.parent?.remove(mesh);
      (mesh.material as THREE.Material).dispose();
      mesh.geometry.dispose();
    }
    const out = new THREE.Mesh(geo, shared);
    out.castShadow = true;
    root.add(out);
    merged += list.length;
  }
  if (merged > 0) m.mats = [shared];
}

function finish(b: Builder, height: number, radius: number, extra?: Partial<ActorModel>, anim?: (a: AnimCtx) => void): ActorModel {
  const base = new THREE.Color();
  void base;
  const model: ActorModel = {
    root: b.root,
    body: b.body,
    parts: b.parts,
    mats: b.mats,
    accentMats: b.acc,
    height,
    radius,
    update(a: AnimCtx) {
      commonAnim(model, a);
      anim?.(a);
    },
    dispose() {
      b.root.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          (m.material as THREE.Material).dispose();
        }
      });
    },
    ...extra,
  };
  if (!extra?.noMerge) mergeStatic(model);
  return model;
}

function commonAnim(m: ActorModel, a: AnimCtx) {
  const p = m.parts;
  const sw = Math.sin(a.phase) * 0.85 * Math.min(1, a.speed);
  if (p.legL) p.legL.rotation.x = sw;
  if (p.legR) p.legR.rotation.x = -sw;
  const idle = 1 - Math.min(1, a.speed);
  const bob = Math.abs(Math.sin(a.phase)) * 0.08 * Math.min(1, a.speed) + Math.sin(a.time * 2 + m.radius * 7) * 0.012 * idle;
  m.body.position.y = bob;
  // arms: walk swing, replaced by attack/cast poses
  let armR = -sw * 0.7;
  let armL = sw * 0.7;
  let lean = 0;
  let twist = 0;
  const pose = a.atk >= 0 ? a.atk : a.cast >= 0 ? a.cast * 0.9 : -1;
  if (pose >= 0) {
    if (pose <= 1) {
      const k = pose * pose;
      armR = -2.4 * k;
      lean = -0.18 * k;
      twist = 0.5 * k;
    } else {
      const k = Math.min(1, pose - 1);
      armR = -2.4 + 3.4 * Math.min(1, k * 2.2) - k * 0.4;
      lean = -0.18 + 0.5 * Math.min(1, k * 2);
      twist = 0.5 - 1.1 * Math.min(1, k * 2);
    }
  }
  if (p.armR) p.armR.rotation.x = armR;
  if (p.armL) p.armL.rotation.x = a.cast >= 0 && a.castKind === 'bow' ? -1.3 : armL;
  if (p.torso) {
    p.torso.rotation.x = lean;
    p.torso.rotation.y = twist;
  } else m.body.rotation.x = lean * 0.6;
  // death
  if (a.dead > 0) {
    m.root.rotation.z = 0;
    m.body.rotation.x = Math.min(1.45, a.dead * 3) * -1;
    m.body.position.y = -a.dead * 0.25;
  } else if (!p.torso) m.body.rotation.x = lean * 0.6;
  // flash
  for (const mat of m.mats) {
    mat.emissiveIntensity = a.flash > 0 ? 0.42 * Math.min(1, a.flash * 7) : mat.userData.base ?? 0;
    if (a.flash > 0) mat.emissive.setHex(0xffb89a);
    else mat.emissive.setHex(mat.userData.emis ?? 0x000000);
  }
}

function lockBaseEmis(b: Builder) {
  for (const m of b.mats) {
    m.userData.base = m.emissiveIntensity;
    m.userData.emis = m.emissive.getHex();
  }
}

// ------------------------------------------------------------------ players
const STEEL = 0x3c3f46;
const STEEL_L = 0x6a6e78;
const BRASS = 0x9a8545;

export function buildPlayer(cls: 'cinder' | 'ranger', look = 0): ActorModel {
  const b = newBuilder();
  const accents = [0xffb347, 0x5ee0d0, 0xd8dde4];
  const accent = accents[look % 3];
  const legs = (color: number, w = 0.2) => {
    for (const s of [-1, 1]) {
      const g = place(new THREE.Group(), s * 0.16, 0.9, 0, b.body);
      g.add(place(mk(box(w, 0.9, 0.24), color, b.mats), 0, -0.45, 0));
      g.add(place(mk(box(w + 0.04, 0.16, 0.34), 0x1d1b1a, b.mats), 0, -0.88, 0.05));
      b.parts[s < 0 ? 'legL' : 'legR'] = g;
    }
  };
  if (cls === 'cinder') {
    legs(0x2f3136, 0.24);
    const torso = place(new THREE.Group(), 0, 1.3, 0, b.body);
    b.parts.torso = torso;
    torso.add(place(mk(box(0.78, 0.72, 0.46), STEEL, b.mats, { m: 0.5, r: 0.5 }), 0, 0, 0));
    torso.add(place(mk(box(0.82, 0.1, 0.5), BRASS, b.mats, { m: 0.6 }), 0, -0.3, 0));
    const plate = glow(box(0.18, 0.18, 0.04), accent, b.acc);
    torso.add(place(plate, 0, 0.1, 0.25));
    for (const s of [-1, 1]) {
      const sp = mk(sph(0.3, 10, 8), STEEL_L, b.mats, { m: 0.5, r: 0.45 });
      sp.scale.set(1.1, 0.7, 1);
      torso.add(place(sp, s * 0.5, 0.34, 0));
      torso.add(place(mk(torus(0.28, 0.04, 5, 14), BRASS, b.mats, { m: 0.6 }), s * 0.5, 0.3, 0)).rotation.x = Math.PI / 2;
    }
    const head = place(new THREE.Group(), 0, 0.62, 0, torso);
    head.add(place(mk(box(0.34, 0.36, 0.36), STEEL, b.mats, { m: 0.5 }), 0, 0.12, 0));
    head.add(place(glow(box(0.3, 0.05, 0.04), accent, b.acc), 0, 0.14, 0.19));
    head.add(place(mk(box(0.06, 0.22, 0.34), STEEL_L, b.mats), 0, 0.36, -0.02));
    // right arm + weapons
    const armR = place(new THREE.Group(), 0.52, 0.28, 0, torso);
    armR.add(place(mk(cyl(0.09, 0.08, 0.6, 6), STEEL, b.mats), 0, -0.3, 0));
    const mace = place(new THREE.Group(), 0, -0.6, 0.1, armR);
    mace.add(place(mk(cyl(0.04, 0.04, 0.8, 6), 0x4a3a2c, b.mats), 0, 0.3, 0.2)).rotation.x = Math.PI / 2.6;
    const mhead = place(new THREE.Group(), 0, 0.5, 0.52, mace);
    mhead.add(mk(box(0.26, 0.26, 0.26), STEEL_L, b.mats, { m: 0.6 }));
    for (let i = 0; i < 4; i++) mhead.add(place(mk(cone(0.05, 0.14, 4), STEEL_L, b.mats), Math.cos(i * 1.57) * 0.16, 0, Math.sin(i * 1.57) * 0.16)).rotation.z = Math.cos(i * 1.57) * -1.2;
    const heatGlow = glow(sph(0.2, 8, 6), 0xff6a2a, b.acc, true);
    (heatGlow.material as THREE.MeshBasicMaterial).opacity = 0.0;
    mhead.add(heatGlow);
    b.parts.maceGroup = mace;
    b.parts.heatGlow = heatGlow;
    const maul = place(new THREE.Group(), 0, -0.55, 0.1, armR);
    maul.add(place(mk(cyl(0.05, 0.05, 1.5, 6), 0x4a3a2c, b.mats), 0, 0.5, 0.35)).rotation.x = Math.PI / 2.8;
    maul.add(place(mk(box(0.5, 0.42, 0.4), STEEL_L, b.mats, { m: 0.6 }), 0, 1.05, 0.95));
    maul.visible = false;
    b.parts.maulGroup = maul;
    // shield on left arm
    const armL = place(new THREE.Group(), -0.52, 0.28, 0, torso);
    armL.add(place(mk(cyl(0.09, 0.08, 0.5, 6), STEEL, b.mats), 0, -0.28, 0));
    const shield = place(new THREE.Group(), -0.2, -0.3, 0.1, armL);
    shield.add(mk(box(0.1, 0.9, 0.62), STEEL, b.mats, { m: 0.55, r: 0.4 }));
    shield.add(place(mk(cyl(0.12, 0.12, 0.08, 8), BRASS, b.mats, { m: 0.6 }), -0.07, 0, 0)).rotation.z = Math.PI / 2;
    shield.add(place(glow(box(0.02, 0.5, 0.06), accent, b.acc), -0.1, 0, 0));
    b.parts.shield = shield;
    b.parts.armR = armR;
    b.parts.armL = armL;
    // cape
    b.body.add(place(mk(box(0.7, 1.0, 0.05), 0x35282a, b.mats, { r: 1 }), 0, 1.25, -0.3)).rotation.x = 0.12;
  } else {
    legs(0x2b2f2c, 0.16);
    const torso = place(new THREE.Group(), 0, 1.28, 0, b.body);
    b.parts.torso = torso;
    torso.add(place(mk(box(0.56, 0.7, 0.34), 0x3a4a42, b.mats, { r: 0.8 }), 0, 0, 0));
    torso.add(place(mk(box(0.6, 0.12, 0.38), 0x2a2420, b.mats), 0, -0.28, 0));
    for (const s of [-1, 1]) {
      const sp = mk(sph(0.2, 8, 6), 0x2d3a36, b.mats);
      sp.scale.set(1, 0.7, 1);
      torso.add(place(sp, s * 0.36, 0.33, 0));
    }
    // cloak
    const cloak = mk(cone(0.55, 1.5, 8), 0x1f2e2b, b.mats, { r: 1 });
    cloak.scale.set(1, 1, 0.55);
    cloak.rotation.x = 0.14;
    torso.add(place(cloak, 0, -0.1, -0.22));
    // scarf glow
    torso.add(place(glow(box(0.5, 0.1, 0.38), accent, b.acc), 0, 0.37, 0.02));
    const head = place(new THREE.Group(), 0, 0.62, 0, torso);
    head.add(place(mk(sph(0.2, 8, 7), 0x8a6a52, b.mats), 0, 0.1, 0));
    const hood = mk(cone(0.28, 0.55, 7), 0x2d3a36, b.mats, { r: 1 });
    hood.rotation.x = -0.25;
    head.add(place(hood, 0, 0.22, -0.05));
    head.add(place(glow(sph(0.035, 5, 4), accent, b.acc), -0.08, 0.1, 0.17));
    head.add(place(glow(sph(0.035, 5, 4), accent, b.acc), 0.08, 0.1, 0.17));
    // bow (left hand)
    const armL = place(new THREE.Group(), -0.4, 0.28, 0, torso);
    armL.add(place(mk(cyl(0.07, 0.06, 0.55, 6), 0x3a4a42, b.mats), 0, -0.28, 0));
    const bow = place(new THREE.Group(), 0, -0.55, 0.2, armL);
    const arc = mk(new THREE.TorusGeometry(0.62, 0.035, 5, 18, Math.PI * 0.85), 0x5a4030, b.mats);
    arc.rotation.set(0, Math.PI / 2, Math.PI / 2 - Math.PI * 0.425);
    bow.add(arc);
    bow.add(place(mk(cyl(0.006, 0.006, 1.15, 3), 0xd8d0b8, b.mats), 0.0, 0, -0.1));
    b.parts.bow = bow;
    const armR = place(new THREE.Group(), 0.4, 0.28, 0, torso);
    armR.add(place(mk(cyl(0.07, 0.06, 0.55, 6), 0x3a4a42, b.mats), 0, -0.28, 0));
    b.parts.armR = armR;
    b.parts.armL = armL;
    // quiver
    const quiver = place(mk(cyl(0.09, 0.09, 0.7, 7), 0x4a3426, b.mats), 0.14, 0.2, -0.28, torso);
    quiver.rotation.z = 0.25;
    for (let i = 0; i < 4; i++) quiver.add(place(mk(cone(0.025, 0.1, 4), 0xd8d0b8, b.mats), (i - 1.5) * 0.04, 0.4, 0));
    // trap satchel
    torso.add(place(mk(box(0.2, 0.2, 0.14), 0x4a3426, b.mats), -0.28, -0.25, -0.22));
  }
  lockBaseEmis(b);
  const model = finish(b, 1.95, 0.45, {
    setLoadout(weapon: string, shield: boolean) {
      if (cls !== 'cinder') return;
      b.parts.maceGroup.visible = weapon !== 'maul';
      b.parts.maulGroup.visible = weapon === 'maul';
      b.parts.shield.visible = shield;
    },
    tintAccent(hex: number) {
      for (const m of b.acc) if (m !== (b.parts.heatGlow as THREE.Mesh)?.material) m.color.setHex(hex);
    },
  }, (a) => {
    const hg = b.parts.heatGlow as THREE.Mesh | undefined;
    if (hg) {
      const m = hg.material as THREE.MeshBasicMaterial;
      m.opacity = a.heat * 0.85;
      hg.scale.setScalar(1 + a.heat * 0.9);
    }
  });
  return model;
}

// ------------------------------------------------------------------ NPCs
export function buildNpc(kind: string): ActorModel {
  const b = newBuilder();
  const robe = { captain: 0x4a3030, vendor: 0x4a4030, healer: 0xd9d2c0, artificer: 0x2f3a3a }[kind] ?? 0x444444;
  const accent = { captain: 0xd8b070, vendor: 0xc9a468, healer: 0xffb060, artificer: 0xff7a30 }[kind] ?? 0xffffff;
  const robeMesh = mk(cone(0.55, 1.5, 9), robe, b.mats, { r: 0.9 });
  b.body.add(place(robeMesh, 0, 0.75, 0));
  const torso = place(new THREE.Group(), 0, 1.3, 0, b.body);
  b.parts.torso = torso;
  torso.add(place(mk(sph(0.2, 8, 7), 0x8a6a52, b.mats), 0, 0.38, 0));
  torso.add(place(mk(sph(0.27, 8, 6), robe, b.mats), 0, 0.5, -0.03)).scale.set(1, 0.9, 1);
  if (kind === 'captain') {
    torso.add(place(mk(box(0.8, 0.4, 0.5), STEEL, b.mats, { m: 0.5 }), 0, 0, 0));
    torso.add(place(mk(box(0.1, 0.5, 0.16), 0x7a2a2a, b.mats), 0, 0.85, -0.05));
    b.body.add(place(mk(cyl(0.03, 0.03, 2.2, 5), 0x4a3a2c, b.mats), 0.55, 1.1, 0.1));
    b.body.add(place(mk(cone(0.12, 0.3, 5), STEEL_L, b.mats), 0.55, 2.3, 0.1));
  } else if (kind === 'vendor') {
    torso.add(place(mk(box(0.8, 0.9, 0.5), 0x5a4636, b.mats), 0, -0.1, -0.4));
    torso.add(place(mk(box(0.7, 0.2, 0.45), 0x7a6648, b.mats), 0, 0.5, -0.4));
    b.body.add(place(glow(sph(0.1, 6, 5), accent, b.acc), 0.45, 0.9, 0.3));
  } else if (kind === 'healer') {
    b.body.add(place(mk(cyl(0.03, 0.03, 2.0, 5), 0x6a5a40, b.mats), 0.5, 1.0, 0.2));
    b.body.add(place(glow(sph(0.14, 7, 6), accent, b.acc), 0.5, 2.1, 0.2));
  } else {
    // artificer: goggles + brass arm
    torso.add(place(glow(box(0.3, 0.07, 0.04), accent, b.acc), 0, 0.42, 0.19));
    torso.add(place(mk(box(0.14, 0.14, 0.7), BRASS, b.mats, { m: 0.6 }), 0.5, 0, 0.3));
    torso.add(place(mk(box(0.5, 0.5, 0.08), 0x6a5a40, b.mats), 0, -0.1, 0.25));
  }
  lockBaseEmis(b);
  return finish(b, 1.9, 0.5, undefined, (a) => {
    b.body.rotation.y = Math.sin(a.time * 0.6) * 0.1;
  });
}

// ------------------------------------------------------------------ enemies
export function buildEnemy(type: string, elite = false): ActorModel {
  const def = ENEMIES[type];
  const b = newBuilder();
  const C = def.color;
  const A = def.accent;
  let height = 1.4;
  const eyes = (y: number, z: number, sp = 0.1, r = 0.04, parent: THREE.Object3D = b.body) => {
    for (const s of [-1, 1]) parent.add(place(glow(sph(r, 5, 4), A, b.acc), s * sp, y, z));
  };
  const legsOf = (y: number, x: number, color: number, h = 0.7, w = 0.14) => {
    for (const s of [-1, 1]) {
      const g = place(new THREE.Group(), s * x, y, 0, b.body);
      g.add(place(mk(box(w, h, w), color, b.mats), 0, -h / 2, 0));
      b.parts[s < 0 ? 'legL' : 'legR'] = g;
    }
  };
  let anim: ((a: AnimCtx) => void) | undefined;
  switch (type) {
    case 'crawler': {
      height = 0.8;
      const body = mk(sph(0.38, 9, 7), C, b.mats);
      body.scale.set(1.2, 0.6, 1.5);
      b.body.add(place(body, 0, 0.42, 0));
      for (let i = 0; i < 6; i++) {
        const s = i % 2 ? 1 : -1;
        const leg = place(new THREE.Group(), s * 0.3, 0.38, -0.3 + Math.floor(i / 2) * 0.3, b.body);
        leg.add(place(mk(cyl(0.025, 0.02, 0.5, 4), 0x1d1b1a, b.mats), s * 0.18, -0.12, 0)).rotation.z = s * 0.9;
        b.parts['leg' + i] = leg;
      }
      eyes(0.5, 0.52, 0.12, 0.05);
      b.body.add(place(glow(cone(0.08, 0.3, 4), A, b.acc), 0, 0.55, -0.4)).rotation.x = -1.2;
      anim = (a) => {
        for (let i = 0; i < 6; i++) b.parts['leg' + i].rotation.x = Math.sin(a.phase * 1.4 + i) * 0.5 * Math.min(1, a.speed);
        if (a.atk >= 0) b.body.position.z = a.atk <= 1 ? -0.3 * a.atk : -0.3 + 0.9 * Math.min(1, a.atk - 1);
        else b.body.position.z = 0;
      };
      break;
    }
    case 'husk': {
      height = 2.0;
      legsOf(0.8, 0.22, 0x3a3836, 0.8, 0.28);
      const torso = place(new THREE.Group(), 0, 1.2, 0, b.body);
      b.parts.torso = torso;
      const bell = mk(cone(0.78, 1.2, 10), C, b.mats, { m: 0.5, r: 0.6 });
      bell.rotation.x = Math.PI;
      torso.add(place(bell, 0, 0.1, 0));
      torso.add(place(mk(torus(0.55, 0.06, 5, 14), def.accent, b.mats, { m: 0.6 }), 0, 0.25, 0)).rotation.x = Math.PI / 2;
      torso.add(place(mk(sph(0.26, 8, 7), 0x2b2928, b.mats), 0, 0.85, 0.05));
      eyes(0.88, 0.26, 0.08, 0.045, torso);
      const armR = place(new THREE.Group(), 0.75, 0.55, 0, torso);
      armR.add(place(mk(cyl(0.16, 0.14, 0.9, 6), C, b.mats), 0, -0.45, 0));
      armR.add(place(mk(box(0.5, 0.5, 0.55), 0x4a4640, b.mats, { m: 0.5 }), 0, -1.0, 0.1));
      b.parts.armR = armR;
      const armL = place(new THREE.Group(), -0.75, 0.55, 0, torso);
      armL.add(place(mk(cyl(0.16, 0.14, 0.9, 6), C, b.mats), 0, -0.45, 0));
      b.parts.armL = armL;
      break;
    }
    case 'archer': {
      height = 1.8;
      legsOf(0.85, 0.12, 0x24262a, 0.85, 0.12);
      const torso = place(new THREE.Group(), 0, 1.25, 0, b.body);
      b.parts.torso = torso;
      torso.add(place(mk(box(0.46, 0.7, 0.28), C, b.mats), 0, 0, 0));
      const hood = mk(cone(0.26, 0.6, 7), 0x1f2024, b.mats, { r: 1 });
      torso.add(place(hood, 0, 0.7, 0));
      eyes(0.56, 0.17, 0.07, 0.035, torso);
      const armL = place(new THREE.Group(), -0.34, 0.25, 0, torso);
      armL.add(place(mk(cyl(0.05, 0.05, 0.55, 5), C, b.mats), 0, -0.27, 0));
      const bow = mk(new THREE.TorusGeometry(0.55, 0.03, 4, 14, Math.PI * 0.9), 0x3a2a20, b.mats);
      bow.rotation.set(0, Math.PI / 2, Math.PI / 2 - Math.PI * 0.45);
      armL.add(place(bow, 0, -0.5, 0.2));
      const armR = place(new THREE.Group(), 0.34, 0.25, 0, torso);
      armR.add(place(mk(cyl(0.05, 0.05, 0.5, 5), C, b.mats), 0, -0.25, 0));
      b.parts.armL = armL;
      b.parts.armR = armR;
      break;
    }
    case 'scribe':
    case 'scribe_repair': {
      height = 1.9;
      b.body.add(place(mk(cone(0.5, 1.5, 9), C, b.mats, { r: 0.95 }), 0, 0.75, 0));
      const torso = place(new THREE.Group(), 0, 1.3, 0, b.body);
      b.parts.torso = torso;
      torso.add(place(mk(sph(0.2, 8, 7), 0xb8a890, b.mats), 0, 0.4, 0));
      torso.add(place(mk(cone(0.28, 0.5, 7), 0x2a2030, b.mats), 0, 0.62, -0.02));
      eyes(0.42, 0.17, 0.07, 0.035, torso);
      const book = place(new THREE.Group(), 0.5, 0.2, 0.25, torso);
      book.add(mk(box(0.34, 0.06, 0.26), 0x5a3a6a, b.mats));
      book.add(place(glow(box(0.3, 0.01, 0.2), A, b.acc), 0, 0.04, 0));
      b.parts.book = book;
      b.parts.armR = place(new THREE.Group(), 0.4, 0.2, 0, torso);
      anim = (a) => {
        book.position.y = 0.2 + Math.sin(a.time * 2) * 0.06;
        book.rotation.y = a.time * 1.2;
      };
      break;
    }
    case 'mite':
    case 'lantern': {
      height = type === 'mite' ? 0.9 : 1.1;
      const body = mk(sph(0.3, 9, 7), C, b.mats);
      body.scale.set(1, 0.8, 1.2);
      b.body.add(place(body, 0, 0.45, 0));
      const lamp = glow(sph(type === 'mite' ? 0.2 : 0.26, 8, 7), A, b.acc, true);
      b.parts.lamp = place(lamp, 0, 0.82, 0.05, b.body);
      b.body.add(place(mk(cyl(0.02, 0.02, 0.32, 4), 0x2a2420, b.mats), 0, 0.68, 0.05));
      for (let i = 0; i < 6; i++) {
        const s = i % 2 ? 1 : -1;
        const leg = place(new THREE.Group(), s * 0.22, 0.4, -0.2 + Math.floor(i / 2) * 0.22, b.body);
        leg.add(place(mk(cyl(0.02, 0.015, 0.4, 4), 0x1d1b1a, b.mats), s * 0.12, -0.1, 0)).rotation.z = s * 0.8;
        b.parts['leg' + i] = leg;
      }
      eyes(0.5, 0.35, 0.1, 0.035);
      anim = (a) => {
        for (let i = 0; i < 6; i++) b.parts['leg' + i].rotation.x = Math.sin(a.phase * 1.6 + i) * 0.6 * Math.min(1, a.speed);
        const pulse = a.atk >= 0 && a.atk <= 1 ? 1 + 1.2 * a.atk + Math.sin(a.time * 40) * 0.25 * a.atk : 1;
        lamp.scale.setScalar(pulse);
        (lamp.material as THREE.MeshBasicMaterial).color.setHex(a.atk >= 0 && Math.sin(a.time * 30) > 0 ? 0xffffff : A);
      };
      break;
    }
    case 'pilgrim': {
      height = 1.9;
      legsOf(0.8, 0.18, 0x3a3835, 0.8, 0.2);
      const torso = place(new THREE.Group(), 0, 1.2, 0.05, b.body);
      b.parts.torso = torso;
      torso.add(place(mk(box(0.66, 0.7, 0.4), C, b.mats), 0, 0, 0)).rotation.x = 0.25;
      torso.add(place(mk(sph(0.2, 8, 7), 0x8a7a62, b.mats), 0, 0.5, 0.15));
      eyes(0.52, 0.32, 0.07, 0.035, torso);
      for (let i = 0; i < 3; i++) torso.add(place(mk(torus(0.42, 0.04, 5, 14), 0x3a3a3c, b.mats, { m: 0.6 }), 0, -0.15 + i * 0.22, 0)).rotation.x = Math.PI / 2 + i * 0.2;
      const armR = place(new THREE.Group(), 0.45, 0.25, 0, torso);
      armR.add(place(mk(cyl(0.08, 0.07, 0.7, 6), C, b.mats), 0, -0.35, 0));
      armR.add(place(mk(new THREE.TorusGeometry(0.14, 0.03, 4, 8, Math.PI * 1.4), 0xc9a468, b.mats, { m: 0.6 }), 0, -0.8, 0.1));
      b.parts.armR = armR;
      b.parts.armL = place(new THREE.Group(), -0.45, 0.25, 0, torso);
      (b.parts.armL as THREE.Group).add(place(mk(cyl(0.08, 0.07, 0.7, 6), C, b.mats), 0, -0.35, 0));
      break;
    }
    case 'warden': {
      height = 2.1;
      legsOf(0.8, 0.2, 0x3e4a4a, 0.8, 0.24);
      const torso = place(new THREE.Group(), 0, 1.2, 0, b.body);
      b.parts.torso = torso;
      torso.add(place(mk(box(0.8, 0.78, 0.5), C, b.mats, { m: 0.5, r: 0.5 }), 0, 0, 0));
      torso.add(place(mk(box(0.34, 0.38, 0.36), 0x3a4646, b.mats, { m: 0.5 }), 0, 0.6, 0));
      torso.add(place(glow(box(0.3, 0.04, 0.04), A, b.acc), 0, 0.64, 0.19));
      for (const s of [-1, 1]) torso.add(place(mk(sph(0.28, 8, 6), 0x4a5858, b.mats, { m: 0.5 }), s * 0.52, 0.34, 0)).scale.set(1.1, 0.7, 1);
      const armR = place(new THREE.Group(), 0.54, 0.28, 0, torso);
      armR.add(place(mk(cyl(0.1, 0.09, 0.6, 6), C, b.mats), 0, -0.3, 0));
      armR.add(place(mk(box(0.1, 0.1, 1.5), 0x8a9aa0, b.mats, { m: 0.7 }), 0, -0.7, 0.5));
      b.parts.armR = armR;
      const shield = place(new THREE.Group(), 0, 0, 0.55, torso);
      shield.add(place(mk(box(1.1, 1.5, 0.12), 0x4e5c5c, b.mats, { m: 0.6, r: 0.4 }), 0, -0.1, 0));
      shield.add(place(glow(box(0.7, 0.05, 0.02), A, b.acc), 0, 0.2, 0.07));
      shield.add(place(glow(box(0.05, 0.9, 0.02), A, b.acc), 0, -0.1, 0.07));
      b.parts.shield = shield;
      break;
    }
    case 'swarm':
    case 'swarmlet': {
      height = 1.2;
      for (let i = 0; i < (type === 'swarm' ? 7 : 3); i++) {
        const q = place(new THREE.Group(), 0, 0.8, 0, b.body);
        q.add(place(mk(octa(0.16 + (i % 3) * 0.04), C, b.mats), 0.5 + (i % 3) * 0.12, 0, 0)).scale.set(0.5, 1.6, 0.5);
        q.add(place(glow(sph(0.035, 4, 3), A, b.acc), 0.5 + (i % 3) * 0.12, 0.1, 0.05));
        q.userData.o = i;
        b.parts['q' + i] = q;
      }
      anim = (a) => {
        for (const k of Object.keys(b.parts)) {
          if (!k.startsWith('q')) continue;
          const q = b.parts[k];
          const o = q.userData.o as number;
          q.rotation.y = a.time * (2 + o * 0.3) + o * 1.1;
          q.position.y = 0.8 + Math.sin(a.time * 3 + o) * 0.25;
        }
        if (a.atk >= 0) b.body.position.z = a.atk <= 1 ? -0.25 * a.atk : -0.25 + 0.7 * Math.min(1, a.atk - 1);
        else b.body.position.z = 0;
      };
      break;
    }
    case 'hound': {
      height = 1.1;
      const body = mk(box(0.5, 0.45, 1.1), C, b.mats);
      b.body.add(place(body, 0, 0.65, 0));
      const head = place(new THREE.Group(), 0, 0.85, 0.7, b.body);
      head.add(mk(box(0.36, 0.34, 0.5), C, b.mats));
      head.add(place(mk(box(0.2, 0.14, 0.3), 0x24272a, b.mats), 0, -0.1, 0.35));
      for (const s of [-1, 1]) head.add(place(glow(sph(0.045, 5, 4), A, b.acc), s * 0.1, 0.07, 0.24));
      b.parts.head = head;
      for (const [x, z, k] of [[-1, 0.4, 'legL'], [1, 0.4, 'legR'], [-1, -0.4, 'legBL'], [1, -0.4, 'legBR']] as [number, number, string][]) {
        const l = place(new THREE.Group(), x * 0.2, 0.5, z, b.body);
        l.add(place(mk(box(0.1, 0.5, 0.12), 0x24272a, b.mats), 0, -0.25, 0));
        b.parts[k] = l;
      }
      for (let i = 0; i < 4; i++) b.body.add(place(mk(cone(0.05, 0.22, 4), 0x24272a, b.mats), 0, 0.92, -0.3 + i * 0.22));
      anim = (a) => {
        const sw = Math.sin(a.phase * 1.3) * 0.8 * Math.min(1, a.speed);
        b.parts.legBL.rotation.x = -sw;
        b.parts.legBR.rotation.x = sw;
        b.body.rotation.x = a.atk >= 0 ? (a.atk <= 1 ? 0.35 * a.atk : -0.2) : 0;
      };
      break;
    }
    case 'adept': {
      height = 1.9;
      b.body.add(place(mk(cone(0.5, 1.5, 9), C, b.mats, { r: 0.95 }), 0, 0.75, 0));
      const torso = place(new THREE.Group(), 0, 1.3, 0, b.body);
      b.parts.torso = torso;
      torso.add(place(mk(sph(0.2, 8, 7), 0x8a7a62, b.mats), 0, 0.4, 0));
      torso.add(place(mk(cone(0.3, 0.5, 7), 0x3a3426, b.mats), 0, 0.62, -0.02));
      eyes(0.42, 0.17, 0.07, 0.035, torso);
      const armR = place(new THREE.Group(), 0.42, 0.2, 0, torso);
      armR.add(place(mk(cyl(0.06, 0.05, 0.6, 5), C, b.mats), 0, -0.3, 0));
      const censer = place(new THREE.Group(), 0, -0.9, 0.1, armR);
      censer.add(place(mk(cyl(0.01, 0.01, 0.5, 3), 0x4a4a4a, b.mats), 0, 0.25, 0));
      censer.add(mk(sph(0.17, 8, 6), BRASS, b.mats, { m: 0.6 }));
      censer.add(place(glow(sph(0.1, 6, 5), A, b.acc, true), 0, 0.02, 0));
      b.parts.censer = censer;
      b.parts.armR = armR;
      anim = (a) => {
        censer.rotation.z = Math.sin(a.time * 2) * 0.3;
      };
      break;
    }
    case 'ward': {
      height = 1.6;
      const crystal = glow(octa(0.35), A, b.acc, true);
      crystal.scale.set(0.8, 1.7, 0.8);
      b.body.add(place(crystal, 0, 1.0, 0));
      b.body.add(place(glow(octa(0.2), 0xffffff, b.acc), 0, 1.0, 0)).scale.set(0.8, 1.7, 0.8);
      b.body.add(place(mk(cyl(0.3, 0.4, 0.15, 6), 0x2a2030, b.mats), 0, 0.08, 0));
      anim = (a) => {
        crystal.rotation.y = a.time * 1.5;
        crystal.position.y = 1.0 + Math.sin(a.time * 2) * 0.1;
      };
      break;
    }
    case 'conduit': {
      height = 3.0;
      b.body.add(place(mk(cyl(0.6, 0.8, 0.4, 8), 0x3a3f42, b.mats), 0, 0.2, 0));
      const cr = glow(octa(0.6), A, b.acc, true);
      cr.scale.set(0.8, 1.9, 0.8);
      b.body.add(place(cr, 0, 1.6, 0));
      b.body.add(place(mk(torus(0.8, 0.06, 5, 16), BRASS, b.mats, { m: 0.6 }), 0, 1.6, 0));
      anim = (a) => {
        cr.rotation.y = a.time;
        b.parts.ringc = b.body.children[b.body.children.length - 1];
        b.parts.ringc.rotation.x = a.time * 0.8;
      };
      break;
    }
    case 'dummy': {
      height = 1.9;
      b.body.add(place(mk(cyl(0.1, 0.12, 1.7, 6), 0x5a4636, b.mats), 0, 0.85, 0));
      b.body.add(place(mk(box(0.9, 0.12, 0.12), 0x5a4636, b.mats), 0, 1.3, 0));
      const sack = mk(sph(0.36, 8, 7), 0x8a7a58, b.mats, { r: 1 });
      sack.scale.set(1, 1.3, 0.9);
      b.body.add(place(sack, 0, 1.0, 0.12));
      b.body.add(place(mk(sph(0.2, 7, 6), 0x9a8a68, b.mats, { r: 1 }), 0, 1.75, 0.05));
      b.body.add(place(glow(box(0.5, 0.05, 0.02), 0xc9a468, b.acc), 0, 1.05, 0.46));
      anim = (a) => {
        b.body.rotation.z = a.flash > 0 ? Math.sin(a.time * 40) * 0.12 * a.flash * 6 : 0;
      };
      break;
    }
    case 'urn': {
      height = 1.1;
      const u = mk(sph(0.4, 9, 7), 0x6a5a48, b.mats, { r: 0.9 });
      u.scale.set(1, 1.2, 1);
      b.body.add(place(u, 0, 0.5, 0));
      b.body.add(place(mk(cyl(0.2, 0.28, 0.22, 8), 0x5a4a38, b.mats), 0, 1.02, 0));
      b.body.add(place(glow(box(0.5, 0.04, 0.02), 0xc9a468, b.acc), 0, 0.55, 0.38));
      break;
    }
    case 'powder': {
      height = 1.2;
      b.body.add(place(mk(cyl(0.38, 0.38, 0.8, 10), 0x5a3a2a, b.mats), 0, 0.4, 0));
      for (const y of [0.15, 0.65]) b.body.add(place(mk(torus(0.38, 0.03, 4, 12), 0x2a2a2c, b.mats), 0, y, 0)).rotation.x = Math.PI / 2;
      b.body.add(place(glow(box(0.5, 0.18, 0.02), 0xff4a2a, b.acc), 0, 0.42, 0.39));
      const fuse = place(glow(sph(0.07, 5, 4), 0xffc060, b.acc, true), 0, 0.9, 0, b.body);
      anim = (a) => fuse.scale.setScalar(1 + Math.sin(a.time * 12) * 0.4);
      break;
    }
    case 'toll_keeper': {
      height = 2.0;
      for (const s of [-1, 1]) {
        const g = place(new THREE.Group(), s * 0.35, 0.8, 0, b.body);
        g.add(place(mk(box(0.38, 0.8, 0.42), 0x3a3633, b.mats), 0, -0.4, 0));
        b.parts[s < 0 ? 'legL' : 'legR'] = g;
      }
      const torso = place(new THREE.Group(), 0, 1.35, 0, b.body);
      b.parts.torso = torso;
      const bell = mk(cone(1.05, 1.6, 12), 0x5e5144, b.mats, { m: 0.55, r: 0.55 });
      bell.rotation.x = Math.PI;
      torso.add(place(bell, 0, 0.1, 0));
      torso.add(place(mk(torus(0.78, 0.09, 6, 18), BRASS, b.mats, { m: 0.7 }), 0, 0.38, 0)).rotation.x = Math.PI / 2;
      torso.add(place(mk(torus(0.55, 0.07, 6, 16), BRASS, b.mats, { m: 0.7 }), 0, -0.2, 0)).rotation.x = Math.PI / 2;
      const head = place(new THREE.Group(), 0, 1.05, 0.05, torso);
      head.add(mk(box(0.5, 0.55, 0.5), 0x2c2a29, b.mats, { m: 0.5 }));
      head.add(place(glow(box(0.4, 0.07, 0.04), A, b.acc), 0, 0.06, 0.26));
      head.add(place(mk(cone(0.12, 0.5, 5), BRASS, b.mats), 0, 0.5, 0));
      for (const s of [-1, 1]) torso.add(place(mk(sph(0.42, 8, 7), 0x4a4540, b.mats, { m: 0.5 }), s * 0.95, 0.65, 0)).scale.set(1.1, 0.75, 1);
      const armR = place(new THREE.Group(), 1.05, 0.5, 0, torso);
      armR.add(place(mk(cyl(0.2, 0.17, 1.0, 7), 0x4a4540, b.mats), 0, -0.5, 0));
      const key = place(new THREE.Group(), 0, -1.0, 0.2, armR);
      key.add(place(mk(cyl(0.06, 0.06, 2.0, 6), 0x4a3a2c, b.mats), 0, 0.4, 0.6)).rotation.x = Math.PI / 2.4;
      key.add(place(mk(box(0.8, 0.8, 0.7), 0x3a3a3c, b.mats, { m: 0.6 }), 0, 1.35, 1.35));
      b.parts.armR = armR;
      const armL = place(new THREE.Group(), -1.05, 0.5, 0, torso);
      armL.add(place(mk(cyl(0.2, 0.17, 1.0, 7), 0x4a4540, b.mats), 0, -0.5, 0));
      b.parts.armL = armL;
      // hanging chains
      for (let i = 0; i < 6; i++) {
        const link = place(mk(torus(0.14, 0.035, 4, 8), 0x3a3a3c, b.mats, { m: 0.6 }), -0.5 + i * 0.2, -0.2 - (i % 2) * 0.12, 0.62, torso);
        link.rotation.x = i * 0.7;
      }
      // armor glow plates (visible while armor intact)
      const plates = glow(box(0.7, 0.5, 0.05), A, b.acc, true);
      torso.add(place(plates, 0, 0.1, 0.78));
      b.parts.plates = plates;
      anim = (a) => {
        const armorOn = a.boss ? a.boss.armor > 0 && !a.boss.broken : true;
        plates.visible = armorOn;
        (plates.material as THREE.MeshBasicMaterial).opacity = 0.35 + 0.25 * Math.sin(a.time * 3);
      };
      break;
    }
    case 'orison_engine': {
      height = 3.0;
      b.body.add(place(mk(cyl(1.4, 1.7, 0.7, 14), 0x3a3f42, b.mats, { m: 0.5 }), 0, 0.35, 0));
      b.body.add(place(mk(cyl(0.7, 0.9, 1.4, 12), 0x4a5a5c, b.mats, { m: 0.6 }), 0, 1.3, 0));
      const core = glow(sph(0.62, 14, 10), A, b.acc);
      b.parts.core = place(core, 0, 2.5, 0, b.body);
      const halo = glow(sph(0.95, 12, 9), A, b.acc, true);
      (halo.material as THREE.MeshBasicMaterial).opacity = 0.22;
      b.parts.halo = place(halo, 0, 2.5, 0, b.body);
      const ringA = place(new THREE.Group(), 0, 2.5, 0, b.body);
      ringA.add(mk(torus(1.5, 0.1, 7, 32), BRASS, b.mats, { m: 0.7 }));
      const ringB = place(new THREE.Group(), 0, 2.5, 0, b.body);
      ringB.add(mk(torus(1.2, 0.08, 7, 28), 0x4f7a6a, b.mats, { m: 0.6 }));
      const ringC = place(new THREE.Group(), 0, 2.5, 0, b.body);
      ringC.add(mk(torus(1.85, 0.06, 6, 36), 0x6a6a68, b.mats, { m: 0.6 }));
      b.parts.ringA = ringA;
      b.parts.ringB = ringB;
      b.parts.ringC = ringC;
      const emit = place(new THREE.Group(), 0, 2.5, 0, b.body);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        const e = place(new THREE.Group(), Math.cos(a) * 1.9, 0, Math.sin(a) * 1.9, emit);
        e.add(mk(cyl(0.2, 0.3, 0.8, 7), 0x3a3f42, b.mats, { m: 0.6 })).rotation.z = Math.PI / 2;
        e.rotation.y = -a;
        e.add(place(glow(sph(0.18, 6, 5), 0xff7a30, b.acc), 0.5, 0, 0));
      }
      b.parts.emit = emit;
      const shield = glow(sph(2.6, 18, 12), 0x5ee8ff, b.acc, true);
      (shield.material as THREE.MeshBasicMaterial).opacity = 0.0;
      b.parts.shieldBubble = place(shield, 0, 1.8, 0, b.body);
      anim = (a) => {
        ringA.rotation.set(a.time * 0.5, a.time * 0.3, 0);
        ringB.rotation.set(0.6, a.time * -0.7, a.time * 0.4);
        ringC.rotation.set(Math.PI / 2 + Math.sin(a.time * 0.4) * 0.3, 0, a.time * 0.2);
        emit.rotation.y = a.time * 0.4;
        const ph = a.boss?.phase ?? 1;
        const hot = ph === 3 ? 0xff5a30 : ph === 2 ? 0xb36bff : 0x5ee8ff;
        (core.material as THREE.MeshBasicMaterial).color.setHex(a.boss?.broken ? 0xffe070 : hot);
        (halo.material as THREE.MeshBasicMaterial).color.setHex(hot);
        core.scale.setScalar(1 + Math.sin(a.time * (ph === 3 ? 9 : 3)) * 0.08);
        (shield.material as THREE.MeshBasicMaterial).opacity = a.boss?.invuln ? 0.2 + 0.06 * Math.sin(a.time * 5) : 0;
        b.body.rotation.x = 0;
      };
      break;
    }
    default:
      b.body.add(place(mk(sph(0.4), C, b.mats), 0, 0.5, 0));
  }
  lockBaseEmis(b);
  const m = finish(b, height, def.r, type === 'conduit' ? { noMerge: true } : undefined, anim);
  m.root.scale.setScalar(def.scale * (elite ? 1.18 : 1));
  if (elite) {
    // crown shards float above elites
    for (let i = 0; i < 3; i++) {
      const sh = glow(octa(0.09), 0xffd060, b.acc);
      sh.scale.set(0.7, 1.5, 0.7);
      sh.position.set(Math.cos(i * 2.1) * 0.35, height + 0.35, Math.sin(i * 2.1) * 0.35);
      sh.userData.crown = i;
      b.root.add(sh);
    }
    const oldUpdate = m.update;
    m.update = (a) => {
      oldUpdate(a);
      b.root.children.forEach((c) => {
        if (c.userData.crown !== undefined) {
          const i = c.userData.crown as number;
          c.position.x = Math.cos(a.time * 1.4 + i * 2.1) * 0.35;
          c.position.z = Math.sin(a.time * 1.4 + i * 2.1) * 0.35;
          c.position.y = height + 0.35 + Math.sin(a.time * 3 + i) * 0.06;
          c.rotation.y = a.time * 2;
        }
      });
    };
  }
  return m;
}

export { dodeca };
