// Procedural scavenger characters (four original body silhouettes sharing one
// hitbox family), weapon models, wing-sails, and cosmetic pose animation.
// Gameplay hitboxes are server-side and independent of these poses.

import { Scene, TransformNode, Mesh, MeshBuilder, StandardMaterial, Color3, VertexData, ShadowGenerator } from '@babylonjs/core';
import type { ActorView } from '../../shared/protocol/messages';
import type { WeaponId } from '../../shared/content/weapons';
import { WEAPONS } from '../../shared/content/weapons';
import { RARITIES } from '../../shared/content/rarity';
import { GLIDER_SKINS } from '../settings';
import { Geo, hex, vertexColorMaterial } from './world';

const BODIES = [
  { name: 'Scout', main: '#2a9d8f', second: '#f4e9cd', pack: '#c8763e', skin: '#d9a77c', hat: 'band', bulk: 0.92 },
  { name: 'Tinker', main: '#e07a2f', second: '#3b4a5a', pack: '#7d8c96', skin: '#b5835a', hat: 'goggles', bulk: 1.08 },
  { name: 'Drifter', main: '#efe0bf', second: '#7a5235', pack: '#4b6b8a', skin: '#8f5f42', hat: 'hood', bulk: 1.0 },
  { name: 'Warden', main: '#6a4fc2', second: '#d9a733', pack: '#2f3e4c', skin: '#e3b58f', hat: 'crest', bulk: 1.05 },
];

const matCache = new Map<string, StandardMaterial>();
function mat(scene: Scene, c: string, emissive = 0) {
  const k = `${c}|${emissive}`;
  let m = matCache.get(k);
  if (!m || m.getScene() !== scene) {
    m = new StandardMaterial(`a_${k}`, scene);
    m.diffuseColor = Color3.FromHexString(c);
    m.specularColor = new Color3(0.12, 0.12, 0.12);
    if (emissive) m.emissiveColor = Color3.FromHexString(c).scale(emissive);
    matCache.set(k, m);
  }
  return m;
}
export function clearActorMaterialCache() { matCache.clear(); }

function box(scene: Scene, name: string, w: number, h: number, d: number, c: string, parent: TransformNode, x = 0, y = 0, z = 0, em = 0) {
  const m = MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, scene);
  m.material = mat(scene, c, em);
  m.parent = parent;
  m.position.set(x, y, z);
  m.isPickable = false;
  return m;
}

type B = [number, number, number, string, number, number, number]; // w,h,d,color,x,y,z
function part(scene: Scene, name: string, parent: TransformNode, boxes: B[]) {
  const g = new Geo();
  for (const [w, h, d, c, x, y, z] of boxes) g.box(x - w / 2, y - h / 2, z - d / 2, x + w / 2, y + h / 2, z + d / 2, hex(c));
  const m = g.mesh(name, scene, vertexColorMaterial(scene), false);
  m.parent = parent;
  return m;
}

/** Original weapon silhouettes: ceramic housings, wind-instrument bells, copper coils. One draw call each. */
export function buildWeaponMesh(scene: Scene, id: WeaponId, rarity: number, parent: TransformNode): TransformNode {
  const n = new TransformNode(`w_${id}`, scene);
  n.parent = parent;
  const cer = '#ece6d6', cop = '#c27a44', dark = '#36404a';
  const rc = RARITIES[rarity].color;
  const cls = WEAPONS[id].cls;
  const L = { rifle: 0.95, carbine: 0.78, shotgun: 0.9, smg: 0.55, dmr: 1.12, rail: 1.3, pistol: 0.32, launcher: 0.85 }[cls];
  const b: B[] = [[0.1, 0.13, L, cer, 0, 0, L * 0.35], [0.07, 0.16, 0.09, dark, 0, -0.12, L * 0.05], [0.105, 0.03, L * 0.5, rc, 0, 0.075, L * 0.35]];
  if (cls === 'rifle' || cls === 'carbine' || cls === 'smg') b.push([0.06, 0.2, 0.1, cop, 0, -0.14, L * 0.35], [0.045, 0.045, L * 0.4, dark, 0, 0.02, L * 0.85]);
  if (cls === 'shotgun') b.push([0.09, 0.09, L * 0.45, dark, 0, 0, L * 0.85], [0.12, 0.08, 0.18, cop, 0, -0.08, L * 0.65]);
  if (cls === 'dmr' || cls === 'rail') {
    b.push([0.07, 0.07, 0.3, dark, 0, 0.12, L * 0.3]);
    const coils = cls === 'rail' ? 4 : 1;
    for (let i = 0; i < coils; i++) b.push([0.15, 0.15, 0.04, cls === 'rail' ? '#4ad8ff' : cop, 0, 0, L * (0.6 + i * 0.1)]);
  }
  if (cls === 'launcher') b.push([0.26, 0.26, 0.12, cop, 0, 0, L * 0.85], [0.2, 0.2, 0.12, cop, 0, 0, L * 0.75]);
  if (cls === 'pistol') b.push([0.05, 0.05, 0.12, dark, 0, 0.03, L * 0.75]);
  part(scene, 'weapon', n, b);
  return n;
}

function wingMesh(scene: Scene, color: string, accent: string, parent: TransformNode) {
  const n = new TransformNode('wing', scene);
  n.parent = parent;
  const m = new Mesh('sail', scene);
  const vd = new VertexData();
  // two swept triangles forming an original kite-like wing-sail
  vd.positions = [0, 0, 0.6, -3.2, 0.2, -0.7, -0.4, 0, -0.9, 0, 0, 0.6, 0.4, 0, -0.9, 3.2, 0.2, -0.7];
  vd.indices = [0, 1, 2, 3, 4, 5];
  const nrm: number[] = [];
  VertexData.ComputeNormals(vd.positions, vd.indices, nrm);
  vd.normals = nrm;
  vd.applyToMesh(m);
  const mt = new StandardMaterial('sailMat', scene);
  mt.diffuseColor = Color3.FromHexString(color);
  mt.emissiveColor = Color3.FromHexString(color).scale(0.25);
  mt.backFaceCulling = false;
  m.material = mt;
  m.parent = n;
  m.isPickable = false;
  const spar = MeshBuilder.CreateBox('spar', { width: 6.4, height: 0.06, depth: 0.08 }, scene);
  spar.material = mat(scene, accent);
  spar.parent = n; spar.position.set(0, 0.15, -0.6); spar.isPickable = false;
  n.position.y = 2.1;
  return n;
}

export class ActorModel {
  root: TransformNode;
  body: TransformNode;
  legL: TransformNode; legR: TransformNode;
  armL: TransformNode; armR: TransformNode;
  hand: TransformNode;
  wing: TransformNode;
  weapon: TransformNode | null = null;
  weaponKey = '';
  glint: Mesh;
  phase = 0;
  deathT = 0;
  meshes: Mesh[] = [];

  constructor(public scene: Scene, bodyIdx: number, glider: number, shadow: ShadowGenerator | null) {
    const b = BODIES[bodyIdx % BODIES.length];
    this.root = new TransformNode('actor', scene);
    this.body = new TransformNode('body', scene);
    this.body.parent = this.root;
    const k = b.bulk;
    const hips = new TransformNode('hips', scene); hips.parent = this.body; hips.position.y = 0.92;
    this.legL = new TransformNode('legL', scene); this.legL.parent = hips; this.legL.position.x = -0.13;
    this.legR = new TransformNode('legR', scene); this.legR.parent = hips; this.legR.position.x = 0.13;
    const leg: B[] = [[0.2 * k, 0.9, 0.22, b.second, 0, -0.45, 0], [0.22 * k, 0.14, 0.3, '#3a2c22', 0, -0.86, 0.04]];
    part(scene, 'legL', this.legL, leg);
    part(scene, 'legR', this.legR, leg);
    const torso: B[] = [
      [0.52 * k, 0.62, 0.3 * k, b.main, 0, 1.25, 0], [0.54 * k, 0.08, 0.32 * k, '#3a2c22', 0, 0.96, 0],
      [0.42 * k, 0.52, 0.24, b.pack, 0, 1.3, -0.27], [0.48, 0.12, 0.14, '#d9cfae', 0, 1.6, -0.28],
      [0.3, 0.32, 0.3, b.skin, 0, 1.72, 0], [0.12, 0.1, 0.12, b.skin, 0, 1.55, 0],
    ];
    if (b.hat === 'crest') torso.push([0.18, 0.1, 0.3, b.second, -0.32, 1.55, 0], [0.18, 0.1, 0.3, b.second, 0.32, 1.55, 0], [0.06, 0.14, 0.34, b.second, 0, 1.92, 0]);
    if (b.hat === 'band') torso.push([0.33, 0.07, 0.33, b.pack, 0, 1.8, 0]);
    if (b.hat === 'goggles') torso.push([0.3, 0.08, 0.06, '#4ad8ff', 0, 1.76, 0.16]);
    if (b.hat === 'hood') torso.push([0.36, 0.2, 0.36, b.main, 0, 1.86, -0.02], [0.36, 0.3, 0.06, b.main, 0, 1.72, -0.17]);
    part(scene, 'torso', this.body, torso);
    this.armL = new TransformNode('armL', scene); this.armL.parent = this.body; this.armL.position.set(-0.33 * k, 1.5, 0);
    this.armR = new TransformNode('armR', scene); this.armR.parent = this.body; this.armR.position.set(0.33 * k, 1.5, 0);
    const arm: B[] = [[0.15, 0.6, 0.16, b.main, 0, -0.28, 0], [0.12, 0.1, 0.12, b.skin, 0, -0.62, 0]];
    part(scene, 'armL', this.armL, arm);
    part(scene, 'armR', this.armR, arm);
    this.hand = new TransformNode('hand', scene); this.hand.parent = this.body; this.hand.position.set(0.2, 1.32, 0.3);
    const gs = GLIDER_SKINS[glider % GLIDER_SKINS.length];
    this.wing = wingMesh(scene, gs.color, gs.accent, this.body);
    this.wing.setEnabled(false);
    this.glint = MeshBuilder.CreatePlane('glint', { size: 0.9 }, scene);
    const gm = new StandardMaterial('glintMat', scene);
    gm.emissiveColor = new Color3(1, 0.95, 0.75); gm.disableLighting = true; gm.alpha = 0.9;
    this.glint.material = gm;
    this.glint.billboardMode = Mesh.BILLBOARDMODE_ALL;
    this.glint.parent = this.body; this.glint.position.set(0.2, 1.5, 0.6);
    this.glint.setEnabled(false);
    this.glint.isPickable = false;
    this.root.getChildMeshes().forEach((m) => { this.meshes.push(m as Mesh); if (shadow && m !== this.glint) shadow.addShadowCaster(m, false); });
  }

  setWeapon(id: WeaponId | null, rarity: number) {
    const key = id ? `${id}_${rarity}` : '';
    if (key === this.weaponKey) return;
    this.weaponKey = key;
    this.weapon?.dispose();
    this.weapon = id ? buildWeaponMesh(this.scene, id, rarity, this.hand) : null;
  }

  update(a: { x: number; y: number; z: number; yaw: number; pitch: number; mode: string; crouch: boolean; slide: boolean; vx: number; vz: number; alive: boolean; ads?: boolean; weapon: WeaponId | null; rarity: number; healing?: boolean }, dt: number, showGlint: boolean) {
    this.root.position.set(a.x, a.y, a.z);
    this.root.rotation.y = a.yaw;
    this.setWeapon(a.alive ? a.weapon : null, a.rarity);
    const speed = Math.hypot(a.vx, a.vz);
    this.phase += dt * Math.min(speed, 9) * 1.6;
    const sw = Math.sin(this.phase) * Math.min(1, speed / 4) * 0.7;
    this.body.rotation.set(0, 0, 0);
    this.body.position.set(0, 0, 0);
    this.body.scaling.set(1, 1, 1);
    this.legL.rotation.x = sw; this.legR.rotation.x = -sw;
    this.armL.rotation.set(-1.1 - a.pitch * 0.6, 0, 0.35);
    this.armR.rotation.set(-1.2 - a.pitch * 0.6, 0, -0.1);
    this.hand.rotation.x = -a.pitch;
    this.wing.setEnabled(a.mode === 'glide');
    if (!a.weapon) { this.armL.rotation.set(sw * 0.8, 0, 0.1); this.armR.rotation.set(-sw * 0.8, 0, -0.1); }
    if (a.healing) { this.armL.rotation.set(-0.9, 0, 0.7); this.armR.rotation.set(-0.9, 0, -0.7); }
    switch (a.mode) {
      case 'freefall':
        this.body.rotation.x = 1.25; this.body.position.y = 0.9;
        this.armL.rotation.set(-0.3, 0, 1.2); this.armR.rotation.set(-0.3, 0, -1.2);
        this.legL.rotation.x = 0.3; this.legR.rotation.x = 0.3;
        break;
      case 'glide':
        this.body.rotation.x = 0.35;
        this.armL.rotation.set(-2.9, 0, 0.3); this.armR.rotation.set(-2.9, 0, -0.3);
        this.legL.rotation.x = 0.4; this.legR.rotation.x = 0.2;
        break;
      case 'swim':
        this.body.rotation.x = 1.0; this.body.position.y = 0.6;
        this.armL.rotation.set(-2.2 + sw, 0, 0.3); this.armR.rotation.set(-2.2 - sw, 0, -0.3);
        break;
      case 'zip': case 'ascend':
        this.armL.rotation.set(-3.0, 0, 0.1); this.armR.rotation.set(-3.0, 0, -0.1);
        this.legL.rotation.x = 0.5; this.legR.rotation.x = 0.2;
        break;
      case 'mantle':
        this.armL.rotation.set(-2.4, 0, 0.2); this.armR.rotation.set(-2.4, 0, -0.2);
        break;
      case 'grapple':
        this.armR.rotation.set(-2.6, 0, 0); this.body.rotation.x = 0.4;
        break;
    }
    if (a.slide) { this.body.rotation.x = -0.6; this.body.position.y = -0.25; this.legL.rotation.x = -1.2; this.legR.rotation.x = -0.9; }
    else if (a.crouch && a.mode === 'ground') { this.body.scaling.y = 0.72; this.legL.rotation.x = sw * 0.5 - 0.3; this.legR.rotation.x = -sw * 0.5 - 0.3; }
    if (!a.alive) {
      this.deathT += dt;
      this.body.rotation.z = Math.min(1.5, this.deathT * 3);
      this.body.position.y = -Math.max(0, this.deathT - 3) * 0.4;
      this.wing.setEnabled(false);
    } else this.deathT = 0;
    this.glint.setEnabled(showGlint && a.alive && !!a.ads && (a.weapon === 'longwake' || a.weapon === 'sundial'));
  }

  setVisible(v: boolean) { this.root.setEnabled(v); }
  dispose() { this.root.dispose(false, false); }
}
