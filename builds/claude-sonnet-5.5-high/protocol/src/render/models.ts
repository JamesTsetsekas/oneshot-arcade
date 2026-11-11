// Procedural models: weapons (shared by viewmodel, third person and drops), characters, utility, Spike.
// Original silhouettes built from simple primitives; no external assets.

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { UtilityId } from '../content/economy';
import { WEAPONS, WeaponId } from '../content/weapons';
import type { Side } from '../sim/types';

const GUNMETAL = 0x2c3238;
const POLYMER = 0x1b1f24;
const STEEL = 0x6c7681;

const ACCENT: Record<WeaponId, number> = {
  vela: 0x4de0ff, rook: 0xffb24a, needle: 0xb06cff, kite: 0xf2d84a, vectora: 0xff5d73, aster: 0x38d6b5, krait: 0xff8a3c,
  lumen: 0xff3fa6, longglass: 0x6fa8ff, sable: 0x7bd96a, rampart: 0xc98a5a, atlas: 0xa3b34a, tool: 0xff3fa6,
};

const matCache = new Map<number, THREE.MeshStandardMaterial>();
function mat(color: number, rough = 0.6, metal = 0.35): THREE.MeshStandardMaterial {
  const key = color * 100 + Math.round(rough * 10) + Math.round(metal * 3);
  let m = matCache.get(key);
  if (!m) { m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal }); matCache.set(key, m); }
  return m;
}
const emissiveCache = new Map<number, THREE.MeshBasicMaterial>();
function glow(color: number): THREE.MeshBasicMaterial {
  let m = emissiveCache.get(color);
  if (!m) { m = new THREE.MeshBasicMaterial({ color }); emissiveCache.set(color, m); }
  return m;
}

function box(parent: THREE.Object3D, w: number, h: number, d: number, m: THREE.Material, x = 0, y = 0, z = 0, rx = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(x, y, z);
  mesh.rotation.x = rx;
  mesh.castShadow = false;
  parent.add(mesh);
  return mesh;
}
function cyl(parent: THREE.Object3D, r: number, len: number, m: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), m);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

const bakedMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, metalness: 0.2 });

/** Merge the direct mesh children of a group into one vertex-coloured mesh (keeps draw calls low). */
export function bakeGroup(g: THREE.Object3D, keep: THREE.Object3D[] = [], cast = false): void {
  const geos: THREE.BufferGeometry[] = [];
  const remove: THREE.Object3D[] = [];
  for (const c of g.children) {
    if (!(c instanceof THREE.Mesh) || keep.includes(c)) continue;
    const mat = c.material as THREE.MeshStandardMaterial | THREE.MeshBasicMaterial;
    c.updateMatrix();
    const geo = c.geometry.clone().applyMatrix4(c.matrix);
    const n = geo.attributes.position.count;
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { col[i * 3] = mat.color.r; col[i * 3 + 1] = mat.color.g; col[i * 3 + 2] = mat.color.b; }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geos.push(geo);
    remove.push(c);
  }
  if (!geos.length) return;
  for (const r of remove) g.remove(r);
  const merged = mergeGeometries(geos, false);
  if (!merged) return;
  const mesh = new THREE.Mesh(merged, bakedMat);
  mesh.castShadow = cast;
  g.add(mesh);
}

export interface WeaponModel {
  group: THREE.Group;
  /** Muzzle position in model space. */
  muzzle: THREE.Object3D;
  /** Parts that animate (slide/bolt/pump). */
  mover?: THREE.Object3D;
  /** Where the support hand sits in model space. */
  supportHand: THREE.Vector3;
  gripHand: THREE.Vector3;
  scopeLens?: THREE.Mesh;
}

/** Weapon points along -Z (forward). Origin roughly at the grip. */
export function buildWeaponModel(id: WeaponId): WeaponModel {
  const g = new THREE.Group();
  const metal = mat(GUNMETAL), poly = mat(POLYMER, 0.8, 0.1), steel = mat(STEEL, 0.4, 0.7), accent = glow(ACCENT[id]);
  const muzzle = new THREE.Object3D();
  let mover: THREE.Object3D | undefined;
  let support = new THREE.Vector3(0, -0.02, -0.25);
  let grip = new THREE.Vector3(0, -0.04, 0.02);
  let scopeLens: THREE.Mesh | undefined;
  const def = WEAPONS[id];

  switch (def.cls) {
    case 'pistol': {
      const slide = new THREE.Group(); g.add(slide); mover = slide;
      box(slide, 0.034, 0.042, 0.2, metal, 0, 0.03, -0.08);
      box(slide, 0.036, 0.006, 0.14, accent, 0, 0.054, -0.07);
      box(g, 0.03, 0.07, 0.19, poly, 0, -0.0, -0.08);
      box(g, 0.03, 0.1, 0.045, poly, 0, -0.07, 0.01, -0.2);
      box(g, 0.02, 0.03, 0.05, steel, 0, -0.03, -0.1);
      if (id === 'rook') { cyl(g, 0.016, 0.09, steel, 0, 0.012, -0.2); box(g, 0.04, 0.055, 0.16, metal, 0, 0.03, -0.1); }
      if (id === 'needle') { box(g, 0.028, 0.1, 0.035, poly, 0, -0.085, -0.04); }
      muzzle.position.set(0, 0.035, id === 'rook' ? -0.255 : -0.185);
      support = new THREE.Vector3(0.0, -0.06, 0.0); grip = new THREE.Vector3(0, -0.07, 0.01);
      break;
    }
    case 'smg': {
      box(g, 0.05, 0.075, 0.3, metal, 0, 0, -0.1);
      box(g, 0.052, 0.012, 0.22, accent, 0, 0.044, -0.1);
      box(g, 0.03, 0.12, 0.05, poly, 0, -0.1, -0.12, 0.12);
      box(g, 0.035, 0.1, 0.05, poly, 0, -0.07, 0.02, -0.25);
      box(g, 0.045, 0.06, 0.12, poly, 0, 0.0, 0.14);
      cyl(g, 0.012, 0.18, steel, 0, 0.01, -0.34);
      box(g, 0.03, 0.04, 0.12, poly, 0, -0.045, -0.22);
      muzzle.position.set(0, 0.01, -0.44);
      support = new THREE.Vector3(0, -0.07, -0.22); grip = new THREE.Vector3(0, -0.08, 0.03);
      break;
    }
    case 'rifle': {
      const bull = id === 'lumen';
      box(g, 0.055, 0.085, bull ? 0.46 : 0.5, metal, 0, 0, bull ? -0.08 : -0.15);
      box(g, 0.058, 0.014, bull ? 0.3 : 0.32, accent, 0, 0.05, -0.15);
      if (!bull) box(g, 0.05, 0.055, 0.28, poly, 0, -0.005, -0.5);
      cyl(g, 0.011, bull ? 0.14 : 0.3, steel, 0, 0.012, bull ? -0.4 : -0.76);
      box(g, 0.045, 0.1, 0.22, poly, 0, -0.01, 0.2);
      box(g, 0.035, 0.14, 0.06, poly, 0, -0.1, -0.1, id === 'krait' ? 0.12 : 0.28);
      box(g, 0.035, 0.1, 0.05, poly, 0, -0.08, 0.03, -0.25);
      box(g, 0.03, 0.03, 0.12, steel, 0, 0.068, -0.12); // sight rail
      if (id === 'krait') box(g, 0.06, 0.04, 0.12, metal, 0, 0.1, -0.28);
      muzzle.position.set(0, 0.012, bull ? -0.5 : -0.95);
      support = new THREE.Vector3(0, -0.05, bull ? -0.2 : -0.5); grip = new THREE.Vector3(0, -0.08, 0.03);
      break;
    }
    case 'sniper': case 'dmr': {
      const long = def.cls === 'sniper';
      box(g, 0.05, 0.08, 0.6, metal, 0, 0, -0.2);
      cyl(g, 0.012, long ? 0.62 : 0.42, steel, 0, 0.01, long ? -0.85 : -0.78);
      box(g, 0.045, 0.1, 0.26, poly, 0, -0.01, 0.22);
      box(g, 0.035, 0.1, 0.05, poly, 0, -0.08, 0.04, -0.25);
      box(g, 0.034, 0.1, 0.06, poly, 0, -0.09, -0.12);
      // scope
      cyl(g, 0.032, 0.3, poly, 0, 0.095, -0.2);
      cyl(g, 0.038, 0.06, steel, 0, 0.095, -0.34);
      cyl(g, 0.038, 0.06, steel, 0, 0.095, -0.06);
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.03, 14), glow(0x6fd0ff));
      lens.position.set(0, 0.095, -0.355);
      g.add(lens); scopeLens = lens;
      const bolt = new THREE.Group(); g.add(bolt); mover = bolt;
      box(bolt, 0.012, 0.012, 0.07, steel, 0.045, 0.03, -0.05);
      cyl(bolt, 0.012, 0.025, accent as unknown as THREE.Material, 0.07, 0.03, -0.05);
      muzzle.position.set(0, 0.01, long ? -1.18 : -1.0);
      support = new THREE.Vector3(0, -0.06, -0.46); grip = new THREE.Vector3(0, -0.08, 0.04);
      break;
    }
    case 'shotgun': {
      box(g, 0.05, 0.08, 0.3, metal, 0, 0, -0.05);
      cyl(g, 0.02, 0.7, steel, 0, 0.02, -0.55);
      cyl(g, 0.016, 0.6, metal, 0, -0.03, -0.5);
      const pump = new THREE.Group(); g.add(pump); mover = pump;
      box(pump, 0.06, 0.05, 0.16, poly, 0, -0.03, -0.45);
      box(pump, 0.062, 0.01, 0.1, accent, 0, -0.005, -0.45);
      box(g, 0.045, 0.1, 0.24, poly, 0, -0.01, 0.2, 0.06);
      box(g, 0.035, 0.1, 0.05, poly, 0, -0.08, 0.03, -0.25);
      muzzle.position.set(0, 0.02, -0.9);
      support = new THREE.Vector3(0, -0.06, -0.45); grip = new THREE.Vector3(0, -0.08, 0.03);
      break;
    }
    case 'lmg': {
      box(g, 0.07, 0.1, 0.5, metal, 0, 0, -0.15);
      box(g, 0.072, 0.014, 0.34, accent, 0, 0.06, -0.15);
      cyl(g, 0.016, 0.45, steel, 0, 0.02, -0.72);
      box(g, 0.05, 0.05, 0.24, poly, 0, 0, -0.55);
      box(g, 0.14, 0.12, 0.14, poly, 0, -0.1, -0.08);
      box(g, 0.05, 0.1, 0.26, poly, 0, -0.01, 0.24);
      box(g, 0.035, 0.1, 0.05, poly, 0, -0.09, 0.04, -0.25);
      box(g, 0.01, 0.12, 0.01, steel, 0.04, -0.09, -0.6, 0.4); box(g, 0.01, 0.12, 0.01, steel, -0.04, -0.09, -0.6, 0.4);
      muzzle.position.set(0, 0.02, -0.96);
      support = new THREE.Vector3(0, -0.06, -0.48); grip = new THREE.Vector3(0, -0.08, 0.03);
      break;
    }
    case 'melee': default: {
      box(g, 0.035, 0.035, 0.16, poly, 0, 0, 0);
      box(g, 0.04, 0.012, 0.05, accent, 0, 0.0, -0.09);
      const blade = box(g, 0.012, 0.07, 0.24, steel, 0, 0.02, -0.22);
      blade.rotation.x = 0.1;
      box(g, 0.004, 0.012, 0.2, accent, 0, 0.056, -0.22);
      muzzle.position.set(0, 0, -0.4);
      support = new THREE.Vector3(0, -0.05, 0.0); grip = new THREE.Vector3(0, -0.02, 0.04);
    }
  }
  g.add(muzzle);
  if (mover) bakeGroup(mover);
  bakeGroup(g, scopeLens ? [scopeLens] : []);
  return { group: g, muzzle, mover, supportHand: support, gripHand: grip, scopeLens };
}

export interface Palette { cus: number; int: number }
export const PALETTES: Record<string, Palette> = {
  default: { cus: 0x2fe0ff, int: 0xffa726 },
  deuteranopia: { cus: 0x3d8bff, int: 0xffd23f },
  protanopia: { cus: 0x4da3ff, int: 0xffe14a },
  mono: { cus: 0xffffff, int: 0xffd23f },
};

export interface CharacterRig {
  root: THREE.Group;
  body: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  armR: THREE.Group;
  armL: THREE.Group;
  head: THREE.Group;
  weaponSlot: THREE.Group;
  accentMats: THREE.MeshBasicMaterial[];
  weaponId: WeaponId | 'util' | null;
  weaponModel: WeaponModel | null;
  phase: number;
  deadT: number;
  glint: THREE.Mesh;
  paletteKey: number;
}

export function buildCharacter(side: Side, palette: Palette): CharacterRig {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const accentColor = side === 'cus' ? palette.cus : palette.int;
  const suit = mat(side === 'cus' ? 0xc4d0dc : 0x8a6f52, 0.75, 0.1);
  const suitDark = mat(side === 'cus' ? 0x5d6b7c : 0x45372b, 0.8, 0.1);
  const skin = mat(0x2a2c30, 0.6, 0.2);
  const accent = new THREE.MeshBasicMaterial({ color: accentColor });
  const accentMats = [accent];

  const mk = (parent: THREE.Object3D, w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number): THREE.Mesh => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  };

  // legs pivot at hip (y=0.9)
  const legL = new THREE.Group(); legL.position.set(-0.12, 0.9, 0); body.add(legL);
  const legR = new THREE.Group(); legR.position.set(0.12, 0.9, 0); body.add(legR);
  for (const leg of [legL, legR]) {
    mk(leg, 0.17, 0.46, 0.2, suit, 0, -0.23, 0);
    mk(leg, 0.15, 0.4, 0.17, suitDark, 0, -0.65, 0.01);
    mk(leg, 0.17, 0.08, 0.28, mat(0x16191d), 0, -0.86, -0.04);
    mk(leg, 0.19, 0.06, 0.22, accentMats[0], 0, -0.46, 0);
  }
  // torso
  const torso = new THREE.Group(); torso.position.y = 0.9; body.add(torso);
  mk(torso, 0.46, 0.52, 0.27, suit, 0, 0.3, 0);
  mk(torso, 0.4, 0.14, 0.24, suitDark, 0, 0.02, 0);
  mk(torso, 0.2, 0.2, 0.01, accent, 0, 0.38, -0.14); // chest IFF plate
  mk(torso, 0.4, 0.05, 0.2, accent, 0, 0.58, 0);
  if (side === 'cus') {
    mk(torso, 0.62, 0.12, 0.3, suitDark, 0, 0.5, 0); // broad shoulders
    mk(torso, 0.3, 0.34, 0.12, suitDark, 0, 0.32, 0.2); // slim pack
  } else {
    mk(torso, 0.5, 0.1, 0.28, suitDark, 0, 0.52, 0);
    mk(torso, 0.4, 0.46, 0.22, suitDark, 0, 0.32, 0.24); // tall rucksack
    mk(torso, 0.34, 0.06, 0.2, accent, 0, 0.58, 0.24);
  }
  // head
  const head = new THREE.Group(); head.position.set(0, 1.5, 0); body.add(head);
  mk(head, 0.2, 0.22, 0.22, skin, 0, 0.0, 0);
  if (side === 'cus') {
    const helm = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 10), mat(0xf1f4f8, 0.5, 0.2));
    helm.scale.set(1, 0.95, 1.1); helm.position.set(0, 0.05, 0.01); helm.castShadow = true; head.add(helm);
    mk(head, 0.2, 0.06, 0.05, accent, 0, 0.02, -0.17);
  } else {
    mk(head, 0.26, 0.2, 0.28, mat(0x3b2f27, 0.7, 0.2), 0, 0.07, 0.01);
    mk(head, 0.28, 0.05, 0.3, accent, 0, 0.18, 0.01);
    mk(head, 0.2, 0.06, 0.05, accent, 0, 0.0, -0.15);
  }
  // arms: pivot at shoulder
  const armR = new THREE.Group(); armR.position.set(0.3, 1.38, 0); body.add(armR);
  const armL = new THREE.Group(); armL.position.set(-0.3, 1.38, 0); body.add(armL);
  for (const arm of [armR, armL]) {
    mk(arm, 0.12, 0.32, 0.13, suit, 0, -0.16, 0);
    mk(arm, 0.11, 0.3, 0.12, suitDark, 0, -0.45, 0);
    mk(arm, 0.1, 0.1, 0.1, mat(0x14171a), 0, -0.64, 0);
  }
  // The weapon rides on the right hand: arm local -Y is the arm direction, so the model's -Z (muzzle) is rotated onto it.
  const weaponSlot = new THREE.Group();
  weaponSlot.position.set(0, -0.6, -0.02);
  weaponSlot.rotation.x = -Math.PI / 2;
  armR.add(weaponSlot);
  // scope glint (only drawn at narrow opponent-facing angles by the renderer)
  const glint = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  glint.visible = false;
  body.add(glint);

  for (const part of [legL, legR, torso, head, armR, armL]) bakeGroup(part, [weaponSlot], true);
  return { root, body, legL, legR, armR, armL, head, weaponSlot, accentMats, weaponId: null, weaponModel: null, phase: 0, deadT: 0, glint, paletteKey: accentColor };
}

export function setRigWeapon(rig: CharacterRig, id: WeaponId | 'util'): void {
  if (rig.weaponId === id) return;
  rig.weaponId = id;
  if (rig.weaponModel) rig.weaponSlot.remove(rig.weaponModel.group);
  if (id === 'util') { rig.weaponModel = null; return; }
  const m = buildWeaponModel(id);
  rig.weaponSlot.add(m.group);
  m.group.traverse((o) => { o.castShadow = false; });
  rig.weaponModel = m;
}

export function rigPaletteKey(side: Side, palette: Palette): number { return side === 'cus' ? palette.cus : palette.int; }

export function buildGrenadeModel(type: UtilityId): THREE.Group {
  const g = new THREE.Group();
  const colors: Record<UtilityId, number> = { veil: 0x9fb3c8, flash: 0xfff1b0, thermite: 0xff8a3c, pulse: 0x4de0ff, frag: 0xff5d73 };
  const body = new THREE.Mesh(
    type === 'veil' ? new THREE.CylinderGeometry(0.05, 0.05, 0.16, 12) : type === 'pulse' ? new THREE.OctahedronGeometry(0.08) : new THREE.SphereGeometry(0.075, 12, 10),
    mat(0x333a42, 0.5, 0.5),
  );
  g.add(body);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 6, 14), glow(colors[type]));
  band.rotation.x = Math.PI / 2;
  g.add(band);
  return g;
}

export function buildSpikeModel(): THREE.Group {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.26), mat(0x20252b, 0.5, 0.5));
  base.position.y = 0.06;
  g.add(base);
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.14, 12), glow(0xff3fa6));
  core.position.y = 0.16;
  g.add(core);
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.02, 0.2), glow(0xff3fa6));
  top.position.y = 0.13;
  g.add(top);
  return g;
}
