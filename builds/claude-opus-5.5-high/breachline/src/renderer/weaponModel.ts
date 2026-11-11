// Procedural original weapon models (shared by viewmodel and third-person views).
import { Scene, Mesh, MeshBuilder, StandardMaterial, Color3, TransformNode, Vector3 } from "@babylonjs/core";
import { WEAPONS } from "../content/weapons";

export interface WeaponModel {
  root: TransformNode;
  mag: TransformNode;
  bolt: TransformNode;
  muzzle: TransformNode;
  sightHeight: number;
  scope: boolean;
  meshes: Mesh[];
  length: number;
}

export interface WeaponMats { metal: StandardMaterial; polymer: StandardMaterial; accent: StandardMaterial; glow: StandardMaterial; lens: StandardMaterial; dot: StandardMaterial }

export function weaponMats(scene: Scene, prefix: string, accentHex: string): WeaponMats {
  const mk = (n: string, c: Color3, spec = 0.3, emissive?: Color3) => {
    const m = new StandardMaterial(`${prefix}_${n}`, scene);
    m.diffuseColor = c; m.specularColor = new Color3(spec, spec, spec); m.specularPower = 64;
    if (emissive) { m.emissiveColor = emissive; m.disableLighting = true; }
    return m;
  };
  return {
    metal: mk("metal", new Color3(0.22, 0.235, 0.25), 0.5),
    polymer: mk("poly", new Color3(0.3, 0.31, 0.32), 0.18),
    accent: mk("accent", Color3.FromHexString(accentHex).scale(1.4), 0.15),
    glow: mk("glow", Color3.Black(), 0, new Color3(0.2, 0.9, 1.0)),
    lens: mk("lens", new Color3(0.05, 0.12, 0.16), 1.0),
    dot: mk("dot", Color3.Black(), 0, new Color3(1, 0.2, 0.15)),
  };
}

export function buildWeaponModel(scene: Scene, id: string, attachments: string[], mats: WeaponMats, name = "w"): WeaponModel {
  const def = WEAPONS[id];
  const md = def.model;
  const root = new TransformNode(`${name}_root`, scene);
  const meshes: Mesh[] = [];
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, mat: StandardMaterial, parent: TransformNode = root) => {
    const m = MeshBuilder.CreateBox(`${name}_p`, { width: w, height: h, depth: d }, scene);
    m.position.set(x, y, z); m.material = mat; m.parent = parent; m.isPickable = false; meshes.push(m); return m;
  };
  const cyl = (dia: number, len: number, x: number, y: number, z: number, mat: StandardMaterial, parent: TransformNode = root, tess = 12) => {
    const m = MeshBuilder.CreateCylinder(`${name}_c`, { diameter: dia, height: len, tessellation: tess }, scene);
    m.rotation.x = Math.PI / 2; m.position.set(x, y, z); m.material = mat; m.parent = parent; m.isPickable = false; meshes.push(m); return m;
  };
  const pistol = md.mag === "pistol";
  const body = md.body, barrel = md.barrel, stock = md.stock;
  const mag = new TransformNode(`${name}_mag`, scene); mag.parent = root;
  const bolt = new TransformNode(`${name}_bolt`, scene); bolt.parent = root;
  const muzzle = new TransformNode(`${name}_muzzle`, scene); muzzle.parent = root;
  let sightHeight = 0.075;
  let front = body / 2 + barrel;

  if (pistol) {
    box(0.034, 0.05, body, 0, 0.0, 0.03, mats.polymer); // frame
    box(0.038, 0.04, body * 1.02, 0, 0.045, 0.03, mats.metal, bolt); // slide (moves)
    box(0.012, 0.012, 0.012, 0, 0.07, 0.03 + body * 0.45, mats.glow, bolt); // front sight with tritium glow
    box(0.03, 0.012, 0.012, 0, 0.07, 0.03 - body * 0.42, mats.metal, bolt);
    box(0.032, 0.11, 0.05, 0, -0.07, -0.04, mats.accent).rotation.x = 0.25; // grip
    box(0.026, 0.1, 0.04, 0, -0.08, -0.04, mats.metal, mag).rotation.x = 0.25;
    box(0.02, 0.012, 0.05, 0, -0.02, 0.06, mats.polymer); // trigger guard
    if (id === "rook") box(0.03, 0.035, 0.06, 0, 0.0, 0.03 + body * 0.55, mats.metal); // heavy barrel shroud
    if (id === "cinder") box(0.026, 0.06, 0.03, 0, -0.04, 0.12, mats.accent); // forward grip
    sightHeight = 0.07;
    front = 0.03 + body * 0.55;
  } else {
    box(0.062, 0.09, body, 0, 0, 0.04, mats.metal); // receiver
    box(0.07, 0.035, body * 0.5, 0, -0.05, 0.12, mats.accent); // mag well / lower
    box(0.034, 0.018, body * 0.85, 0, 0.054, 0.04, mats.polymer); // top rail
    box(0.07, 0.075, barrel * 0.75, 0, 0.002, body / 2 + barrel * 0.37 + 0.02, mats.accent); // handguard
    cyl(0.024, barrel + 0.06, 0, 0.012, body / 2 + barrel / 2 + 0.04, mats.metal); // barrel
    box(0.012, 0.03, 0.02, 0.04, 0.01, 0.06, mats.metal, bolt); // charging handle (moves)
    box(0.008, 0.008, 0.06, -0.033, 0.03, 0.0, mats.glow); // status strip
    box(0.036, 0.1, 0.05, 0, -0.085, -0.06, mats.polymer).rotation.x = 0.3; // pistol grip
    if (stock > 0) {
      box(0.036, 0.045, stock, 0, -0.025, -body / 2 - stock / 2 + 0.04, mats.polymer);
      box(0.045, 0.11, 0.04, 0, -0.05, -body / 2 - stock + 0.04, mats.accent);
    }
    // magazine variants
    if (md.mag === "box") { const m = box(0.042, 0.17, 0.075, 0, -0.13, 0.12, mats.polymer, mag); m.rotation.x = -0.12; }
    if (md.mag === "drum") { const d = cyl(0.17, 0.08, 0, -0.12, 0.12, mats.polymer, mag, 16); d.rotation.x = 0; d.rotation.z = Math.PI / 2; box(0.05, 0.06, 0.08, 0, -0.06, 0.12, mats.metal, mag); }
    if (md.mag === "tube") { cyl(0.03, barrel * 0.9, 0, -0.03, body / 2 + barrel * 0.45, mats.metal); box(0.072, 0.05, 0.16, 0, -0.035, body / 2 + 0.16, mats.accent, bolt); box(0.03, 0.05, 0.05, 0, -0.04, 0.04, mats.polymer, mag); }
    if (md.mag === "long") { box(0.04, 0.07, 0.09, 0, -0.08, 0.1, mats.polymer, mag); box(0.012, 0.012, 0.05, 0.045, 0.035, -0.02, mats.metal, bolt); }
    if (md.mag === "box" || md.mag === "drum" || md.mag === "long") { /* trigger guard */ box(0.02, 0.012, 0.06, 0, -0.06, 0.03, mats.metal); }
  }

  // optics
  const optic = attachments.find((a) => a === "reflex" || a === "optic2x");
  if (md.scope) {
    cyl(0.05, 0.3, 0, 0.1, 0.05, mats.metal);
    cyl(0.062, 0.05, 0, 0.1, 0.21, mats.metal); cyl(0.058, 0.04, 0, 0.1, -0.11, mats.metal);
    const lens = cyl(0.046, 0.005, 0, 0.1, 0.236, mats.lens);
    void lens;
    box(0.02, 0.04, 0.02, 0, 0.068, 0.12, mats.metal); box(0.02, 0.04, 0.02, 0, 0.068, -0.03, mats.metal);
    sightHeight = 0.1;
  } else if (optic === "reflex") {
    box(0.04, 0.012, 0.06, 0, 0.069, 0.04, mats.metal);
    box(0.004, 0.04, 0.004, 0.022, 0.095, 0.06, mats.metal); box(0.004, 0.04, 0.004, -0.022, 0.095, 0.06, mats.metal);
    box(0.048, 0.004, 0.004, 0, 0.116, 0.06, mats.metal);
    const glass = box(0.04, 0.036, 0.002, 0, 0.096, 0.061, mats.lens); glass.visibility = 0.35;
    box(0.004, 0.004, 0.002, 0, 0.096, 0.0625, mats.dot);
    sightHeight = pistol ? 0.11 : 0.096;
  } else if (optic === "optic2x") {
    cyl(0.04, 0.16, 0, 0.095, 0.04, mats.metal);
    cyl(0.048, 0.03, 0, 0.095, 0.12, mats.metal);
    cyl(0.036, 0.004, 0, 0.095, 0.137, mats.lens);
    box(0.02, 0.03, 0.04, 0, 0.068, 0.04, mats.metal);
    sightHeight = 0.095;
  } else if (!pistol) {
    box(0.03, 0.03, 0.015, 0, 0.075, -body / 2 + 0.06, mats.metal); // rear aperture
    box(0.005, 0.03, 0.006, 0, 0.06, body / 2 + barrel * 0.7, mats.metal); // front post
    box(0.006, 0.006, 0.006, 0, 0.078, body / 2 + barrel * 0.7, mats.glow);
    sightHeight = 0.077;
  }
  // barrel attachments
  if (attachments.includes("suppressor")) { cyl(0.042, 0.17, 0, pistol ? 0.03 : 0.012, front + 0.085, mats.metal); front += 0.17; }
  else if (attachments.includes("compensator")) { box(0.045, 0.04, 0.06, 0, pistol ? 0.03 : 0.012, front + 0.03, mats.metal); front += 0.06; }
  if (attachments.includes("angledGrip") && !pistol) { const g = box(0.03, 0.05, 0.07, 0, -0.055, body / 2 + barrel * 0.3, mats.polymer); g.rotation.x = -0.5; }
  if (attachments.includes("stableGrip") && !pistol) box(0.028, 0.09, 0.03, 0, -0.08, body / 2 + barrel * 0.35, mats.polymer);
  if (attachments.includes("extMag") && md.mag === "box") { const m = box(0.042, 0.08, 0.075, 0, -0.25, 0.135, mats.accent, mag); m.rotation.x = -0.12; }
  muzzle.position.set(0, pistol ? 0.03 : 0.012, front + 0.01);
  return { root, mag, bolt, muzzle, sightHeight, scope: !!md.scope, meshes, length: front + body / 2 + stock };
}

export function disposeModel(m: WeaponModel) { m.root.dispose(false, false); for (const x of m.meshes) x.dispose(); }
export const _v = Vector3;
