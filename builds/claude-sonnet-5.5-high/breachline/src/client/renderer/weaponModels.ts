// Procedural weapon, hand and equipment models. Every weapon is original geometry assembled from primitives.
import { Color3, Mesh, MeshBuilder, Quaternion, Scene, StandardMaterial, TransformNode, Vector3 } from "@babylonjs/core";
import type { WeaponDef } from "../../shared/content/weapons";

export interface WeaponMats {
  graphite: StandardMaterial;
  polymer: StandardMaterial;
  metal: StandardMaterial;
  lens: StandardMaterial;
  glove: StandardMaterial;
  sleeve: StandardMaterial;
  accents: Map<string, StandardMaterial>;
  flash: StandardMaterial;
}

export function buildWeaponMats(scene: Scene): WeaponMats {
  const mk = (n: string, c: string, spec = 0.3, power = 40) => {
    const m = new StandardMaterial(n, scene);
    m.diffuseColor = Color3.FromHexString(c);
    m.specularColor = new Color3(spec, spec, spec); m.specularPower = power;
    return m;
  };
  const lens = mk("w_lens", "#0a2a33", 0.9, 120);
  lens.emissiveColor = new Color3(0.05, 0.35, 0.45); lens.alpha = 0.28;
  const flash = new StandardMaterial("w_flash", scene);
  flash.emissiveColor = new Color3(1, 0.8, 0.4); flash.disableLighting = true; flash.alpha = 0.95;
  return {
    graphite: mk("w_graphite", "#24292e", 0.55, 60), polymer: mk("w_polymer", "#383e44", 0.25, 30), metal: mk("w_metal", "#6f7880", 0.8, 80),
    lens, glove: mk("w_glove", "#1d2226", 0.1, 20), sleeve: mk("w_sleeve", "#3a443f", 0.05, 10), accents: new Map(), flash,
  };
}

function accent(mats: WeaponMats, scene: Scene, hex: string): StandardMaterial {
  let m = mats.accents.get(hex);
  if (!m) {
    m = new StandardMaterial("w_acc_" + hex, scene);
    m.diffuseColor = Color3.FromHexString(hex); m.emissiveColor = Color3.FromHexString(hex).scale(0.06); m.specularColor = new Color3(0.2, 0.2, 0.2);
    mats.accents.set(hex, m);
  }
  return m;
}

export interface WeaponModel {
  root: TransformNode;
  muzzle: TransformNode;
  magazine: TransformNode;
  bolt: TransformNode;
  pump: TransformNode | null;
  meshes: Mesh[];
  rightHand: Vector3; // grip location in weapon space
  leftHand: Vector3;
  len: number;
  height: number;
  sightHeight: number; // y offset of the sight line above weapon origin
}

function box(scene: Scene, parent: TransformNode, mat: StandardMaterial, w: number, h: number, d: number, x: number, y: number, z: number, out: Mesh[], rx = 0): Mesh {
  const m = MeshBuilder.CreateBox("wp", { width: w, height: h, depth: d }, scene);
  m.parent = parent; m.position.set(x, y, z); m.rotation.x = rx; m.material = mat; m.isPickable = false;
  out.push(m);
  return m;
}
function cyl(scene: Scene, parent: TransformNode, mat: StandardMaterial, dia: number, len: number, x: number, y: number, z: number, out: Mesh[], axis: "z" | "x" | "y" = "z", seg = 10): Mesh {
  const m = MeshBuilder.CreateCylinder("wc", { height: len, diameter: dia, tessellation: seg }, scene);
  m.parent = parent; m.position.set(x, y, z);
  if (axis === "z") m.rotation.x = Math.PI / 2; else if (axis === "x") m.rotation.z = Math.PI / 2;
  m.material = mat; m.isPickable = false; out.push(m);
  return m;
}

export function buildWeaponModel(scene: Scene, def: WeaponDef, attachments: string[], mats: WeaponMats): WeaponModel {
  const L = def.look;
  const root = new TransformNode("weapon_" + def.id, scene);
  const meshes: Mesh[] = [];
  const acc = accent(mats, scene, L.accent);
  const h = L.height;
  const muzzle = new TransformNode("muzzle", scene); muzzle.parent = root;
  const magazine = new TransformNode("mag", scene); magazine.parent = root;
  const bolt = new TransformNode("bolt", scene); bolt.parent = root;
  let pump: TransformNode | null = null;
  let sightHeight = h / 2 + 0.035;
  let rightHand = new Vector3(0, -h / 2 - 0.045, -0.06);
  let leftHand = new Vector3(0, -0.04, L.len * 0.32);

  if (L.hand === "pistol") {
    // slide, frame, grip, mag
    box(scene, root, mats.graphite, 0.034, 0.045, L.len, 0, 0.03, 0.02, meshes);
    box(scene, root, mats.polymer, 0.032, 0.03, L.len * 0.8, 0, -0.005, 0.0, meshes);
    box(scene, root, mats.polymer, 0.032, 0.1, 0.05, 0, -0.065, -0.085, meshes, 0.22);
    box(scene, magazine, mats.metal, 0.028, 0.09, 0.04, 0, -0.1, -0.1, meshes, 0.22).parent = magazine;
    box(scene, root, acc, 0.036, 0.008, 0.07, 0, 0.056, 0.02, meshes);
    box(scene, root, mats.metal, 0.008, 0.014, 0.012, 0, 0.06, L.len / 2 + 0.01, meshes);
    box(scene, root, mats.metal, 0.02, 0.012, 0.012, 0, 0.06, -L.len / 2 + 0.02, meshes);
    box(scene, bolt, mats.graphite, 0.036, 0.04, 0.04, 0, 0.032, -L.len / 2 + 0.02, meshes).parent = bolt;
    box(scene, root, mats.graphite, 0.006, 0.03, 0.05, 0, -0.04, 0.03, meshes); // trigger guard
    muzzle.position.set(0, 0.03, L.len / 2 + 0.02);
    sightHeight = 0.07;
    rightHand = new Vector3(0, -0.08, -0.09);
    leftHand = new Vector3(-0.02, -0.07, -0.07);
    if (attachments.includes("suppressor")) { cyl(scene, root, mats.graphite, 0.034, 0.14, 0, 0.03, L.len / 2 + 0.07, meshes); muzzle.position.z += 0.14; }
    return { root, muzzle, magazine, bolt, pump, meshes, rightHand, leftHand, len: L.len, height: h, sightHeight };
  }

  const len = L.len;
  const zRecv = -len * 0.08;
  const rLen = len * 0.42;
  // receiver (upper + lower)
  box(scene, root, mats.graphite, 0.052, h * 0.55, rLen, 0, h * 0.22, zRecv, meshes);
  box(scene, root, mats.polymer, 0.05, h * 0.55, rLen * 0.9, 0, -h * 0.2, zRecv - 0.01, meshes);
  // barrel + handguard
  const bz = zRecv + rLen / 2;
  if (L.mag === "tube") {
    cyl(scene, root, mats.metal, 0.026, L.barrel + 0.1, 0, h * 0.2, bz + (L.barrel + 0.1) / 2, meshes);
    cyl(scene, root, mats.graphite, 0.034, L.barrel * 0.85, 0, -0.025, bz + (L.barrel * 0.85) / 2, meshes);
    pump = new TransformNode("pump", scene); pump.parent = root;
    box(scene, pump, mats.polymer, 0.058, 0.055, 0.2, 0, -0.025, bz + 0.2, meshes).parent = pump;
    box(scene, pump, acc, 0.06, 0.012, 0.06, 0, 0.0, bz + 0.2, meshes).parent = pump;
    leftHand = new Vector3(0, -0.07, bz + 0.2);
    muzzle.position.set(0, h * 0.2, bz + L.barrel + 0.1);
  } else {
    const hgLen = L.barrel * 0.62;
    box(scene, root, mats.polymer, 0.056, 0.058, hgLen, 0, h * 0.12, bz + hgLen / 2, meshes);
    box(scene, root, acc, 0.058, 0.01, hgLen * 0.5, 0, h * 0.12 + 0.03, bz + hgLen * 0.45, meshes);
    cyl(scene, root, mats.metal, 0.02, L.barrel, 0, h * 0.2, bz + L.barrel / 2, meshes);
    box(scene, root, mats.graphite, 0.04, 0.028, 0.05, 0, h * 0.2, bz + L.barrel + 0.01, meshes); // brake
    muzzle.position.set(0, h * 0.2, bz + L.barrel + 0.04);
    leftHand = new Vector3(0, h * 0.12 - 0.065, bz + hgLen * 0.55);
    if (def.cls === "lmg") {
      // bipod folded + carry handle
      box(scene, root, mats.metal, 0.012, 0.012, 0.18, 0.025, h * 0.12 - 0.04, bz + hgLen * 0.7, meshes, 0.0);
      box(scene, root, mats.polymer, 0.028, 0.03, 0.2, 0, h * 0.62, zRecv + 0.1, meshes);
    }
  }
  // stock
  const sz = zRecv - rLen / 2 - L.stock / 2 + 0.02;
  box(scene, root, mats.polymer, 0.042, h * 0.9, L.stock, 0, h * 0.0, sz, meshes);
  box(scene, root, acc, 0.046, 0.016, L.stock * 0.35, 0, h * 0.0, sz, meshes);
  box(scene, root, mats.graphite, 0.046, h * 1.0, 0.025, 0, 0, sz - L.stock / 2, meshes);
  // pistol grip + trigger guard
  box(scene, root, mats.polymer, 0.034, 0.105, 0.042, 0, -h * 0.55 - 0.04, zRecv - rLen * 0.28, meshes, 0.3);
  box(scene, root, mats.graphite, 0.008, 0.03, 0.07, 0, -h * 0.55 + 0.015, zRecv - rLen * 0.05, meshes);
  rightHand = new Vector3(0, -h * 0.55 - 0.05, zRecv - rLen * 0.28);
  // magazine
  if (L.mag === "box") {
    const ext = attachments.includes("extmag") ? 1.35 : attachments.includes("quickmag") ? 0.85 : 1;
    box(scene, magazine, mats.metal, 0.03, 0.15 * ext, 0.055, 0, -h * 0.55 - 0.08 * ext, zRecv + 0.05, meshes, 0.12).parent = magazine;
    box(scene, magazine, acc, 0.032, 0.012, 0.057, 0, -h * 0.55 - 0.006, zRecv + 0.05, meshes, 0.12).parent = magazine;
  } else if (L.mag === "drum") {
    cyl(scene, magazine, mats.graphite, 0.17, 0.075, 0, -h * 0.55 - 0.07, zRecv + 0.05, meshes, "x", 16).parent = magazine;
    cyl(scene, magazine, acc, 0.1, 0.08, 0, -h * 0.55 - 0.07, zRecv + 0.05, meshes, "x", 12).parent = magazine;
  } else if (L.mag === "tube") {
    box(scene, root, mats.graphite, 0.05, 0.02, 0.07, 0, -h * 0.55 - 0.01, zRecv + 0.05, meshes);
  }
  // bolt / charging handle
  box(scene, bolt, mats.metal, 0.012, 0.016, 0.05, 0.034, h * 0.3, zRecv + 0.03, meshes).parent = bolt;
  // sights & optics
  const hasOptic = attachments.includes("reflex") || attachments.includes("optic2x") || L.scope;
  if (attachments.includes("reflex") && !L.scope) {
    box(scene, root, mats.graphite, 0.045, 0.012, 0.06, 0, h * 0.5 + 0.006, zRecv + 0.04, meshes);
    box(scene, root, mats.graphite, 0.04, 0.006, 0.05, 0, h * 0.5 + 0.054, zRecv + 0.05, meshes);
    box(scene, root, mats.graphite, 0.004, 0.044, 0.05, 0.02, h * 0.5 + 0.03, zRecv + 0.05, meshes);
    box(scene, root, mats.graphite, 0.004, 0.044, 0.05, -0.02, h * 0.5 + 0.03, zRecv + 0.05, meshes);
    box(scene, root, mats.lens, 0.036, 0.04, 0.003, 0, h * 0.5 + 0.03, zRecv + 0.075, meshes);
    sightHeight = h * 0.5 + 0.03;
  } else if (attachments.includes("optic2x") || L.scope) {
    const dia = L.scope ? 0.05 : 0.042, sl = L.scope ? 0.26 : 0.17;
    cyl(scene, root, mats.graphite, dia, sl, 0, h * 0.5 + 0.042, zRecv + 0.03, meshes, "z", 14);
    cyl(scene, root, mats.lens, dia * 0.9, 0.004, 0, h * 0.5 + 0.042, zRecv + 0.03 + sl / 2 + 0.002, meshes, "z", 14);
    cyl(scene, root, mats.lens, dia * 0.7, 0.004, 0, h * 0.5 + 0.042, zRecv + 0.03 - sl / 2 - 0.002, meshes, "z", 14);
    box(scene, root, mats.metal, 0.02, 0.02, 0.05, 0, h * 0.5 + 0.012, zRecv + 0.03, meshes);
    sightHeight = h * 0.5 + 0.042;
  }
  if (!hasOptic) {
    box(scene, root, mats.metal, 0.006, 0.03, 0.01, 0, h * 0.5 + 0.015 + (L.mag === "tube" ? 0 : 0), bz + L.barrel * 0.85, meshes); // front post
    box(scene, root, mats.graphite, 0.03, 0.018, 0.012, 0, h * 0.5 + 0.009, zRecv - rLen * 0.3, meshes);
    sightHeight = h * 0.5 + 0.025;
  }
  // barrel attachments
  if (attachments.includes("suppressor")) { cyl(scene, root, mats.graphite, 0.04, 0.2, 0, h * 0.2, bz + L.barrel + 0.1, meshes); muzzle.position.z += 0.2; }
  if (attachments.includes("compensator")) { box(scene, root, mats.metal, 0.044, 0.036, 0.06, 0, h * 0.2, bz + L.barrel + 0.04, meshes); }
  if (attachments.includes("angled")) box(scene, root, mats.polymer, 0.032, 0.05, 0.1, 0, -0.07, bz + 0.12, meshes, -0.6);
  if (attachments.includes("stable")) box(scene, root, mats.polymer, 0.03, 0.1, 0.035, 0, -0.1, bz + 0.1, meshes);
  return { root, muzzle, magazine, bolt, pump, meshes, rightHand, leftHand, len, height: h, sightHeight };
}

/** Cylinder limb from point a to b (used for forearms). */
export function limb(scene: Scene, parent: TransformNode, mat: StandardMaterial, a: Vector3, b: Vector3, r0: number, r1: number, name = "limb"): Mesh {
  const dir = b.subtract(a);
  const len = dir.length();
  const m = MeshBuilder.CreateCylinder(name, { height: len, diameterTop: r1 * 2, diameterBottom: r0 * 2, tessellation: 8 }, scene);
  m.parent = parent;
  m.position = a.add(b).scale(0.5);
  // cylinder axis is +y by default; rotate to dir
  const up = new Vector3(0, 1, 0);
  const d = dir.normalizeToNew();
  const axis = Vector3.Cross(up, d);
  const ang = Math.acos(Math.max(-1, Math.min(1, Vector3.Dot(up, d))));
  if (axis.length() > 1e-5) m.rotationQuaternion = Quaternion.RotationAxis(axis.normalize(), ang);
  m.material = mat; m.isPickable = false;
  return m;
}

export function buildHands(scene: Scene, parent: TransformNode, model: WeaponModel, mats: WeaponMats, pistol: boolean): { right: TransformNode; left: TransformNode; meshes: Mesh[] } {
  const meshes: Mesh[] = [];
  const right = new TransformNode("hand_r", scene); right.parent = parent;
  const left = new TransformNode("hand_l", scene); left.parent = parent;
  right.position.copyFrom(model.rightHand); left.position.copyFrom(model.leftHand);
  // gloves
  const mkHand = (p: TransformNode, w: number) => {
    const g = MeshBuilder.CreateBox("glove", { width: w, height: 0.07, depth: 0.1 }, scene);
    g.parent = p; g.material = mats.glove; g.isPickable = false; meshes.push(g);
    const knuckle = MeshBuilder.CreateBox("knuckle", { width: w * 0.9, height: 0.02, depth: 0.06 }, scene);
    knuckle.parent = p; knuckle.position.set(0, 0.04, 0.0); knuckle.material = mats.metal; knuckle.isPickable = false; meshes.push(knuckle);
    for (let i = 0; i < 3; i++) {
      const f = MeshBuilder.CreateBox("finger", { width: 0.012, height: 0.014, depth: 0.05 }, scene);
      f.parent = p; f.position.set(-w * 0.3 + i * w * 0.3, 0.0, 0.06); f.material = mats.glove; f.isPickable = false; meshes.push(f);
    }
  };
  mkHand(right, 0.06); mkHand(left, 0.06);
  // forearms heading off-screen (toward camera / outward)
  const rEnd = pistol ? new Vector3(0.1, -0.12, -0.42) : new Vector3(0.16, -0.18, -0.42);
  const lEnd = pistol ? new Vector3(-0.08, -0.14, -0.4) : new Vector3(-0.2, -0.22, -0.18);
  meshes.push(limb(scene, right, mats.sleeve, new Vector3(0, -0.01, -0.03), rEnd.subtract(model.rightHand), 0.04, 0.05, "forearm_r"));
  meshes.push(limb(scene, left, mats.sleeve, new Vector3(0, -0.01, -0.03), lEnd.subtract(model.leftHand), 0.04, 0.05, "forearm_l"));
  // cuffs
  return { right, left, meshes };
}
