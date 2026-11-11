// renderer: original procedural first-person weapon models. Each weapon is assembled from boxes and cylinders
// according to its data-driven model parameters and equipped attachments, with separate moving parts
// (magazine, bolt / slide, pump) for reload and firing animation.
import type { WeaponStats } from '../content/weapons';
import { Color3, CreateBox, CreateCylinder, Mesh, Scene, StandardMaterial, TransformNode, Vector3 } from './bjs';

export interface WeaponRig {
  root: TransformNode;
  mag: TransformNode | null;
  bolt: TransformNode | null;
  pump: TransformNode | null;
  muzzle: Vector3;
  sightY: number;
  adsZ: number;
  hip: Vector3;
  leftHand: Vector3;
  rightHand: Vector3;
  pistol: boolean;
  scoped: boolean;
  kickZ: number;
  kickRot: number;
}

export interface GunMats { dark: StandardMaterial; mid: StandardMaterial; poly: StandardMaterial; lens: StandardMaterial; dot: StandardMaterial; accent: StandardMaterial; brass: StandardMaterial }

export function makeGunMats(scene: Scene): GunMats {
  const mk = (name: string, c: [number, number, number], spec: number, power: number, emissive = 0): StandardMaterial => {
    const m = new StandardMaterial('gun_' + name, scene);
    m.diffuseColor = new Color3(c[0], c[1], c[2]);
    m.specularColor = new Color3(spec, spec, spec);
    m.specularPower = power;
    m.ambientColor = new Color3(c[0], c[1], c[2]); // ambient boost must be tinted by albedo
    if (emissive > 0) { m.emissiveColor = new Color3(c[0] * emissive, c[1] * emissive, c[2] * emissive); m.disableLighting = emissive >= 1; }
    return m;
  };
  return {
    dark: mk('dark', [0.15, 0.158, 0.175], 0.5, 36),
    mid: mk('mid', [0.2, 0.21, 0.23], 0.6, 48),
    poly: mk('poly', [0.13, 0.13, 0.135], 0.16, 18),
    lens: mk('lens', [0.05, 0.12, 0.2], 0.95, 120),
    dot: mk('dot', [1, 0.25, 0.18], 0, 1, 1),
    accent: mk('accent', [0.2, 0.86, 0.95], 0.1, 16, 0.55),
    brass: mk('brass', [0.75, 0.56, 0.22], 0.6, 48),
  };
}

type Group = 'static' | 'mag' | 'bolt' | 'pump';
interface Part { mesh: Mesh; mat: StandardMaterial; group: Group }

export function buildWeapon(scene: Scene, mats: GunMats, st: WeaponStats, key: string): WeaponRig {
  const d = st.def, m = d.model, b = m.bulk;
  const parts: Part[] = [];
  const has = (id: string) => st.attachments.includes(id);
  const box = (w: number, h: number, l: number, x: number, y: number, z: number, mat: StandardMaterial, group: Group = 'static', rx = 0, rz = 0): void => {
    const mesh = CreateBox('wp', { width: w, height: h, depth: l }, scene);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, 0, rz);
    parts.push({ mesh, mat, group });
  };
  const cyl = (r: number, l: number, x: number, y: number, z: number, mat: StandardMaterial, group: Group = 'static', r2 = r, sides = 12, rx = Math.PI / 2, rz = 0): void => {
    const mesh = CreateCylinder('wp', { height: l, diameterTop: r2 * 2, diameterBottom: r * 2, tessellation: sides }, scene);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, 0, rz);
    parts.push({ mesh, mat, group });
  };
  const pistol = m.stock === 0;
  let sightY = 0.104, muzzleZ = 0, muzzleY = 0.045, scoped = false;
  const leftHand = new Vector3(), rightHand = new Vector3(0.004, -0.05, -0.022);

  if (!pistol) {
    const hg = Math.max(0.1, m.len - 0.22);
    const hgEnd = 0.14 + hg;
    // receiver + rail
    box(0.05 * b, 0.075, 0.22, 0, 0.0375, 0.03, mats.dark);
    box(0.036 * b, 0.014, 0.2, 0, 0.082, 0.03, mats.mid);
    box(0.004, 0.022, 0.055, 0.0255 * b, 0.05, 0.055, mats.mid);
    box(0.003, 0.012, 0.07, -0.0255 * b, 0.028, 0.05, mats.accent);
    box(0.003, 0.012, 0.07, 0.0255 * b, 0.028, 0.05, mats.accent);
    // handguard with vents
    box(0.046 * b, 0.058, hg, 0, 0.04, 0.14 + hg / 2, mats.poly);
    box(0.03 * b, 0.012, hg * 0.92, 0, 0.074, 0.14 + hg / 2, mats.mid);
    for (let i = 0; i < 4; i++) {
      const z = 0.14 + hg * (0.18 + i * 0.2);
      box(0.048 * b, 0.012, hg * 0.11, 0, 0.045, z, mats.dark);
    }
    // barrel
    const bl = m.barrel;
    cyl(d.cls === 'lmg' || d.cls === 'shotgun' ? 0.014 : 0.011, bl + 0.02, 0, muzzleY, hgEnd + bl / 2, mats.dark);
    muzzleZ = hgEnd + bl;
    if (has('suppressor')) { cyl(0.022, 0.17, 0, muzzleY, muzzleZ + 0.075, mats.dark, 'static', 0.022, 14); cyl(0.0235, 0.02, 0, muzzleY, muzzleZ + 0.01, mats.mid); muzzleZ += 0.16; }
    else if (has('compensator')) { box(0.034, 0.03, 0.055, 0, muzzleY, muzzleZ + 0.02, mats.mid); box(0.036, 0.008, 0.012, 0, muzzleY + 0.012, muzzleZ + 0.02, mats.dark); muzzleZ += 0.05; }
    else { cyl(0.0155, 0.045, 0, muzzleY, muzzleZ + 0.015, mats.mid); muzzleZ += 0.04; }
    // stock
    const sl = m.stock * (has('lightstock') ? 0.86 : 1);
    if (d.cls === 'smg' || has('lightstock')) {
      box(0.012, 0.014, sl, 0.016, 0.05, -0.08 - sl / 2, mats.mid);
      box(0.012, 0.014, sl, -0.016, 0.05, -0.08 - sl / 2, mats.mid);
      box(0.044, 0.1, 0.022, 0, 0.022, -0.08 - sl, mats.poly);
    } else {
      box(0.036, has('fixedstock') ? 0.085 : 0.066, sl, 0, has('fixedstock') ? 0.014 : 0.022, -0.08 - sl / 2, mats.poly, 'static', -0.06);
      box(0.042, 0.11, 0.026, 0, 0.005, -0.08 - sl, mats.dark);
      if (d.cls === 'marksman') box(0.03, 0.03, sl * 0.5, 0, 0.066, -0.1 - sl * 0.4, mats.poly);
    }
    // grip + guard
    box(0.034, 0.105, 0.046, 0, -0.05, -0.024, mats.poly, 'static', 0.26);
    box(0.012, 0.008, 0.075, 0, -0.032, 0.04, mats.dark);
    box(0.008, 0.022, 0.008, 0, -0.016, 0.03, mats.mid);
    // magazine / feed
    if (d.cls === 'lmg') {
      box(0.095, 0.095, 0.11, -0.012, -0.05, 0.085, mats.poly, 'mag');
      box(0.1, 0.012, 0.115, -0.012, 0.0, 0.085, mats.mid, 'mag');
      box(0.03, 0.03, 0.14, 0, 0.1, 0.02, mats.mid); // carry handle
      box(0.012, 0.03, 0.012, 0, 0.09, -0.04, mats.mid); box(0.012, 0.03, 0.012, 0, 0.09, 0.08, mats.mid);
      cyl(0.006, 0.2, 0.018, 0.0, hgEnd - 0.1, mats.mid); cyl(0.006, 0.2, -0.018, 0.0, hgEnd - 0.1, mats.mid); // folded bipod
    } else if (d.cls === 'shotgun') {
      cyl(0.0135, hg + bl * 0.75, 0, 0.012, 0.14 + (hg + bl * 0.75) / 2, mats.dark);
      box(0.05, 0.046, 0.13, 0, 0.014, 0.14 + hg * 0.55, mats.poly, 'pump');
      for (let i = 0; i < 4; i++) box(0.052, 0.006, 0.014, 0, 0.014, 0.14 + hg * 0.55 - 0.045 + i * 0.03, mats.dark, 'pump');
      box(0.02, 0.012, 0.07, 0, -0.006, 0.07, mats.brass); // loading port hint
    } else {
      const ml = m.mag * (has('extmag') ? 1.32 : 1);
      box(0.028, ml, d.cls === 'smg' ? 0.036 : 0.056, 0, -ml / 2 + 0.004, 0.078, has('quickmag') ? mats.poly : mats.mid, 'mag', d.cls === 'smg' ? 0 : -0.14);
      box(0.03, 0.012, d.cls === 'smg' ? 0.04 : 0.06, 0, -ml + 0.004, 0.078 + (d.cls === 'smg' ? 0 : ml * 0.14), mats.dark, 'mag');
      if (has('quickmag')) box(0.034, 0.02, 0.02, 0, -ml * 0.5, 0.11, mats.accent, 'mag');
    }
    // bolt / charging handle
    if (d.cls === 'marksman') {
      cyl(0.006, 0.05, 0.04, 0.06, -0.02, mats.mid, 'bolt', 0.006, 8, 0, Math.PI / 2 - 0.5);
      cyl(0.011, 0.018, 0.066, 0.048, -0.02, mats.dark, 'bolt', 0.011, 8, 0, Math.PI / 2 - 0.5);
    } else if (d.cls !== 'shotgun') {
      box(0.014, 0.012, 0.03, 0.03 * b, 0.064, 0.0, mats.mid, 'bolt');
    }
    // underbarrel grips
    if (has('angledgrip')) box(0.03, 0.05, 0.09, 0, -0.005, 0.14 + hg * 0.5, mats.poly, 'static', -0.6);
    if (has('stablegrip')) { box(0.03, 0.085, 0.032, 0, -0.03, 0.14 + hg * 0.5, mats.poly); box(0.034, 0.012, 0.036, 0, -0.072, 0.14 + hg * 0.5, mats.dark); }
    leftHand.set(-0.004, has('stablegrip') ? -0.045 : d.cls === 'shotgun' ? -0.012 : 0.004, 0.14 + hg * (d.cls === 'shotgun' ? 0.55 : 0.5));
    // sights / optics
    if (d.cls === 'marksman') {
      scoped = true; sightY = 0.128;
      cyl(0.02, 0.2, 0, sightY, 0.02, mats.dark, 'static', 0.02, 16);
      cyl(0.02, 0.07, 0, sightY, 0.145, mats.dark, 'static', 0.029, 16);
      cyl(0.027, 0.06, 0, sightY, -0.1, mats.dark, 'static', 0.02, 16);
      cyl(0.026, 0.004, 0, sightY, 0.182, mats.lens, 'static', 0.026, 16);
      cyl(0.024, 0.004, 0, sightY, -0.132, mats.lens, 'static', 0.024, 16);
      box(0.018, 0.03, 0.02, 0, 0.098, -0.03, mats.mid); box(0.018, 0.03, 0.02, 0, 0.098, 0.08, mats.mid);
      cyl(0.008, 0.02, 0, sightY + 0.026, 0.03, mats.mid, 'static', 0.008, 8, 0);
    } else if (has('optic2x')) {
      sightY = 0.124;
      cyl(0.02, 0.1, 0, sightY, 0.01, mats.dark, 'static', 0.02, 16);
      cyl(0.02, 0.03, 0, sightY, 0.075, mats.dark, 'static', 0.025, 16);
      cyl(0.022, 0.004, 0, sightY, 0.091, mats.lens, 'static', 0.022, 16);
      cyl(0.019, 0.004, 0, sightY, -0.041, mats.lens, 'static', 0.019, 16);
      box(0.024, 0.022, 0.06, 0, 0.097, 0.01, mats.mid);
    } else if (has('reflex')) {
      sightY = 0.122;
      box(0.03, 0.012, 0.05, 0, 0.094, 0.02, mats.mid);
      box(0.003, 0.03, 0.006, 0.016, sightY, 0.04, mats.dark); box(0.003, 0.03, 0.006, -0.016, sightY, 0.04, mats.dark);
      box(0.035, 0.003, 0.006, 0, sightY + 0.015, 0.04, mats.dark); box(0.035, 0.003, 0.006, 0, sightY - 0.015, 0.04, mats.dark);
      box(0.0022, 0.0022, 0.002, 0, sightY, 0.04, mats.dot);
    } else {
      sightY = 0.108;
      box(0.006, 0.026, 0.006, 0, 0.097, hgEnd - 0.02, mats.dark);
      box(0.02, 0.008, 0.012, 0, 0.086, hgEnd - 0.02, mats.dark);
      box(0.005, 0.02, 0.008, 0.011, 0.1, -0.05, mats.dark); box(0.005, 0.02, 0.008, -0.011, 0.1, -0.05, mats.dark);
      box(0.03, 0.008, 0.014, 0, 0.09, -0.05, mats.dark);
    }
  } else {
    // pistols: frame, reciprocating slide, magazine in the grip
    const L = m.len;
    box(0.03, 0.105, 0.042, 0, -0.05, -0.012, mats.poly, 'static', 0.2);
    box(0.028 * b + 0.004, 0.024, L, 0, 0.012, L / 2 - 0.035, mats.poly);
    box(0.012, 0.008, 0.05, 0, -0.012, 0.035, mats.dark);
    box(0.031 * b + 0.004, 0.034, L + 0.012, 0, 0.042, L / 2 - 0.035, mats.dark, 'bolt');
    for (let i = 0; i < 5; i++) box(0.033 * b + 0.004, 0.026, 0.004, 0, 0.042, -0.06 + i * 0.009, mats.mid, 'bolt');
    cyl(0.0075, 0.03 + m.barrel, 0, 0.044, L - 0.03 + m.barrel / 2, mats.mid);
    box(0.005, 0.01, 0.005, 0, 0.064, L - 0.05, mats.dark, 'bolt');
    box(0.004, 0.01, 0.006, 0.008, 0.064, -0.06, mats.dark, 'bolt'); box(0.004, 0.01, 0.006, -0.008, 0.064, -0.06, mats.dark, 'bolt');
    box(0.003, 0.008, 0.04, 0.017 * b + 0.002, 0.016, 0.02, mats.accent);
    const ml = m.mag;
    box(0.022, ml, 0.03, 0, -ml / 2 - 0.0, -0.012 - (ml - 0.1) * 0.1, mats.mid, 'mag', 0.2);
    box(0.026, 0.012, 0.036, 0, -ml - 0.002, -0.034 - (ml - 0.1) * 0.2, mats.dark, 'mag', 0.2);
    if (d.cls === 'machinePistol') { box(0.024, 0.07, 0.026, 0, -0.03, L - 0.07, mats.poly); box(0.03, 0.03, 0.04, 0, 0.044, L - 0.01, mats.mid); }
    sightY = 0.071;
    muzzleY = 0.044;
    muzzleZ = L - 0.015 + m.barrel;
    leftHand.set(-0.022, -0.045, 0.0);
  }

  // merge per group + material
  const root = new TransformNode('weapon_' + key, scene);
  const groups: Record<Group, TransformNode | null> = { static: root, mag: null, bolt: null, pump: null };
  for (const g of ['mag', 'bolt', 'pump'] as Group[]) {
    if (parts.some((p) => p.group === g)) { const n = new TransformNode(g, scene); n.parent = root; groups[g] = n; }
  }
  const buckets = new Map<string, Part[]>();
  for (const p of parts) {
    const k = p.group + '|' + p.mat.name;
    let arr = buckets.get(k);
    if (!arr) { arr = []; buckets.set(k, arr); }
    arr.push(p);
  }
  for (const arr of buckets.values()) {
    const merged = arr.length > 1 ? Mesh.MergeMeshes(arr.map((p) => p.mesh), true, true) : arr[0].mesh;
    if (!merged) continue;
    if (arr.length === 1) { merged.bakeCurrentTransformIntoVertices(); }
    merged.material = arr[0].mat;
    merged.parent = groups[arr[0].group];
    merged.renderingGroupId = 1;
    merged.isPickable = false;
    merged.receiveShadows = false;
    merged.alwaysSelectAsActiveMesh = true;
  }
  const kick: Record<string, [number, number]> = {
    rifle: [0.03, 0.022], smg: [0.022, 0.016], battle: [0.055, 0.05], shotgun: [0.1, 0.11], lmg: [0.03, 0.02], marksman: [0.11, 0.1], pistol: [0.022, 0.05], heavyPistol: [0.04, 0.1], machinePistol: [0.02, 0.035],
  };
  root.setEnabled(false);
  return {
    root, mag: groups.mag, bolt: groups.bolt, pump: groups.pump,
    muzzle: new Vector3(0, muzzleY, muzzleZ), sightY, adsZ: pistol ? 0.36 : scoped ? 0.2 : 0.27,
    hip: pistol ? new Vector3(0.12, -(sightY + 0.075), 0.44) : new Vector3(0.155, -(sightY + 0.07), 0.34),
    leftHand, rightHand, pistol, scoped, kickZ: kick[d.cls][0], kickRot: kick[d.cls][1],
  };
}
