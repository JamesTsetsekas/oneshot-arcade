import { Mesh, MeshBuilder, TransformNode, type AbstractMesh, type StandardMaterial } from "@babylonjs/core";
import type { Enemy, Player } from "../sim/types";
import { Kit, box, cyl, hex, merge, sph, ringMesh } from "./kit";
import { ELITE_BY_ID } from "../data/enemies";

export interface Rig {
  root: TransformNode; // position + facing
  body: TransformNode; // bob/lean
  armL: TransformNode; armR: TransformNode;
  legL: TransformNode; legR: TransformNode;
  head: TransformNode;
  extra: TransformNode[];
  meshes: AbstractMesh[];
  ring?: Mesh;
  scale: number;
  kind: string;
  height: number;
  plates?: AbstractMesh[];
  glow?: AbstractMesh[];
}

const protoCache = new Map<string, Mesh>();

/** Shared hidden prototype mesh; actors use instances of it (one draw call per prototype). */
function proto(kit: Kit, key: string, build: () => Mesh): Mesh {
  let m = protoCache.get(key);
  if (m && !m.isDisposed()) return m;
  m = build();
  m.name = `proto_${key}`;
  m.isVisible = true;
  m.setEnabled(true);
  m.position.set(0, -1000, 0);
  m.isPickable = false;
  protoCache.set(key, m);
  return m;
}

function inst(kit: Kit, key: string, build: () => Mesh, parent: TransformNode, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1): AbstractMesh {
  const p = proto(kit, key, build);
  const i = p.createInstance(`${key}_i`);
  i.parent = parent;
  i.position.set(x, y, z);
  i.rotation.set(rx, ry, rz);
  i.scaling.setAll(s);
  i.isPickable = false;
  return i;
}

function node(name: string, parent: TransformNode, x = 0, y = 0, z = 0): TransformNode {
  const n = new TransformNode(name, parent.getScene());
  n.parent = parent;
  n.position.set(x, y, z);
  return n;
}

function baseRig(kit: Kit, kind: string, scale: number): Rig {
  const s = kit.scene;
  const root = new TransformNode(`actor_${kind}`, s);
  const body = node("body", root);
  root.scaling.setAll(scale);
  return { root, body, armL: node("armL", body), armR: node("armR", body), legL: node("legL", body), legR: node("legR", body), head: node("head", body), extra: [], meshes: [], scale, kind, height: 1.8 };
}

const M = (kit: Kit) => ({
  iron: kit.mat("iron", "#4a4a52", { spec: 0.25 }),
  darkIron: kit.mat("darkiron", "#2a2a30", { spec: 0.2 }),
  brass: kit.mat("brass", "#a47a3a", { spec: 0.3 }),
  ember: kit.mat("emberglow", "#ff7030", { emissive: "#ff5010", emissiveK: 1.3 }),
  teal: kit.mat("tealglow", "#3ff0d0", { emissive: "#20d0b0", emissiveK: 1.1 }),
  cyan: kit.mat("starmetal", "#4fe6ff", { emissive: "#3fd8ff", emissiveK: 1.1 }),
  leather: kit.mat("leatherA", "#4a3424"),
  skin: kit.mat("skin", "#b89a80"),
  bone: kit.mat("bone", "#d8d0bc"),
  ash: kit.mat("ashflesh", "#3a3434"),
  soot: kit.mat("soot", "#1e1c20"),
  red: kit.mat("redeye", "#ff3030", { emissive: "#ff2020", emissiveK: 1.4, unlit: true }),
  violet: kit.mat("violetglow", "#b44dff", { emissive: "#9030ff", emissiveK: 1.2 }),
  pale: kit.mat("paleblue", "#9cb0c8"),
  robe: kit.mat("robe", "#4a4a5e"),
  wood: kit.mat("wood", "#5a3e2a"),
  straw: kit.mat("straw", "#b89a58"),
  lantern: kit.mat("lantern", "#ffc040", { emissive: "#ffa020", emissiveK: 1.5, unlit: true }),
});

// ───────────────────────── player ─────────────────────────
export function buildPlayerRig(kit: Kit, cls: "cinder" | "ranger", preset: { body: number; tint: number }, tint: string): Rig {
  const s = kit.scene;
  const m = M(kit);
  const bodyScale = [1, 1.08, 1.04][preset.body] ?? 1;
  const r = baseRig(kit, `player_${cls}`, 1);
  r.root.scaling.set(bodyScale, [1, 0.98, 1.1][preset.body] ?? 1, bodyScale);
  const clothMat = kit.mat(`pcloth_${tint}`, tint);
  const add = (mesh: Mesh, parent: TransformNode) => { mesh.parent = parent; r.meshes.push(mesh); return mesh; };
  // legs
  for (const [leg, x] of [[r.legL, -0.17], [r.legR, 0.17]] as const) {
    leg.position.set(0, 0.9, x);
    add(box(s, 0.22, 0.85, 0.22, cls === "cinder" ? m.iron : m.leather, 0, -0.45, 0), leg);
    add(box(s, 0.28, 0.14, 0.3, m.darkIron, 0.05, -0.85, 0), leg);
  }
  if (cls === "cinder") {
    add(box(s, 0.42, 0.72, 0.6, m.iron, 0, 1.28, 0), r.body);
    add(box(s, 0.44, 0.3, 0.62, clothMat, 0, 0.88, 0), r.body);
    add(box(s, 0.05, 0.4, 0.12, m.ember, 0.22, 1.3, 0), r.body); // ember seam
    // pauldrons — strong shoulder silhouette
    for (const side of [-1, 1]) {
      const pd = add(box(s, 0.62, 0.22, 0.46, m.darkIron, 0, 1.68, side * 0.44), r.body); pd.rotation.x = side * 0.35;
      const tr = add(box(s, 0.64, 0.06, 0.48, kit.mat("trim", "#5e4422", { spec: 0.05 }), 0, 1.8, side * 0.47), r.body); tr.rotation.x = side * 0.35;
    }
    r.head.position.set(0, 1.85, 0);
    add(sph(s, 0.34, m.iron, 0, 0, 0, 1, 1.1, 1, 10), r.head);
    add(box(s, 0.1, 0.06, 0.24, m.ember, 0.16, 0.02, 0), r.head); // visor slit glow
    r.armR.position.set(0, 1.55, 0.42);
    add(box(s, 0.2, 0.7, 0.2, m.iron, 0, -0.35, 0), r.armR);
    const mace = new TransformNode("mace", s); mace.parent = r.armR; mace.position.set(0.1, -0.7, 0); r.extra.push(mace);
    add(cyl(s, 0.07, 0.07, 0.9, m.wood, 0.0, 0.35, 0, 6), mace).rotation.z = 0;
    add(sph(s, 0.32, m.darkIron, 0, 0.85, 0, 1, 1, 1, 8), mace);
    add(sph(s, 0.14, m.ember, 0, 0.85, 0.15), mace);
    r.armL.position.set(0, 1.55, -0.42);
    add(box(s, 0.2, 0.7, 0.2, m.iron, 0, -0.35, 0), r.armL);
    const shield = add(box(s, 0.12, 0.9, 0.7, kit.mat("shieldmat", "#6a5030", { spec: 0.08 }), 0.18, -0.45, -0.05), r.armL);
    r.extra.push(shield as any);
  } else {
    add(cyl(s, 0.4, 0.62, 0.9, clothMat, 0, 1.2, 0, 8), r.body);
    add(box(s, 0.32, 0.5, 0.44, m.leather, 0, 1.35, 0), r.body);
    // hooded cloak and quiver
    add(cyl(s, 0.2, 0.75, 1.1, kit.mat("cloak", "#2c3a38"), -0.08, 1.1, 0, 8), r.body);
    add(cyl(s, 0.16, 0.18, 0.7, m.leather, -0.28, 1.45, 0.18, 6), r.body).rotation.x = 0.3;
    r.head.position.set(0, 1.78, 0);
    add(sph(s, 0.3, m.skin, 0.02, 0, 0), r.head);
    add(cyl(s, 0.05, 0.46, 0.5, kit.mat("cloak", "#2c3a38"), -0.02, 0.08, 0, 8), r.head);
    add(box(s, 0.04, 0.04, 0.16, m.teal, 0.15, 0.02, 0), r.head);
    r.armR.position.set(0, 1.5, 0.3);
    add(box(s, 0.16, 0.62, 0.16, m.leather, 0, -0.3, 0), r.armR);
    r.armL.position.set(0, 1.5, -0.3);
    add(box(s, 0.16, 0.62, 0.16, m.leather, 0, -0.3, 0), r.armL);
    const bow = MeshBuilder.CreateTorus("bow", { diameter: 1.3, thickness: 0.06, tessellation: 20, }, s);
    bow.material = m.wood; bow.scaling.set(0.35, 1, 1); bow.rotation.set(Math.PI / 2, 0, 0); bow.position.set(0.25, -0.55, 0);
    add(bow, r.armL);
    add(box(s, 0.02, 1.1, 0.02, m.teal, 0.05, -0.55, 0), r.armL);
  }
  for (const mm of r.meshes) { mm.isPickable = false; (mm as Mesh).receiveShadows = false; }
  r.root.scaling.scaleInPlace(1.18);
  r.height = 2.3;
  return r;
}

// ───────────────────────── enemies ─────────────────────────
export function buildEnemyRig(kit: Kit, e: Enemy): Rig {
  const s = kit.scene;
  const m = M(kit);
  const id = e.def.id;
  const elite = e.isElite;
  const r = baseRig(kit, id, (elite ? 1.15 : 1) * (e.split ? 0.8 : 1) * (e.isBoss ? 1 : 1.12));
  const I = (key: string, build: () => Mesh, parent: TransformNode, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sc = 1) => { const i = inst(kit, key, build, parent, x, y, z, rx, ry, rz, sc); r.meshes.push(i); return i; };
  const humanLegs = (mat: StandardMaterial, h = 0.8, w = 0.2) => {
    r.legL.position.set(0, h, -0.16); r.legR.position.set(0, h, 0.16);
    I(`leg_${mat.name}_${h}`, () => box(s, w, h, w, mat, 0, -h / 2, 0), r.legL);
    I(`leg_${mat.name}_${h}`, () => box(s, w, h, w, mat, 0, -h / 2, 0), r.legR);
  };
  switch (id) {
    case "ash_crawler": {
      r.body.position.y = 0.35;
      I("crawler_body", () => sph(s, 0.9, m.ash, 0, 0, 0, 1.3, 0.55, 1), r.body);
      I("crawler_crack", () => sph(s, 0.5, m.ember, 0, 0.12, 0, 1.4, 0.3, 0.6), r.body);
      r.head.position.set(0.5, 0.05, 0);
      I("crawler_eyes", () => merge("ce", [sph(s, 0.12, m.red, 0.05, 0.05, 0.12), sph(s, 0.12, m.red, 0.05, 0.05, -0.12)]), r.head);
      for (let i = 0; i < 3; i++) for (const side of [-1, 1]) {
        const leg = node("l", r.body, -0.3 + i * 0.3, 0, side * 0.3);
        I("crawler_leg", () => box(s, 0.06, 0.06, 0.55, m.soot, 0, -0.1, 0.25), leg, 0, 0, 0, side * 0.5, 0, 0).scaling.z = side;
        r.extra.push(leg);
      }
      r.height = 0.8;
      break;
    }
    case "bell_husk": {
      humanLegs(m.ash, 0.9, 0.34);
      I("husk_torso", () => cyl(s, 0.9, 0.7, 1.1, m.ash, 0, 0, 0, 8), r.body, 0, 1.45, 0);
      r.head.position.set(0, 2.25, 0);
      I("husk_bell", () => merge("bell", [cyl(s, 0.45, 1.05, 0.95, m.brass, 0, 0, 0, 12), cyl(s, 0.2, 0.2, 0.25, m.brass, 0, 0.55, 0, 6), sph(s, 0.3, m.ember, 0, -0.45, 0)]), r.head);
      r.armL.position.set(0, 1.9, -0.6); r.armR.position.set(0, 1.9, 0.6);
      I("husk_arm", () => box(s, 0.34, 1.2, 0.34, m.ash, 0, -0.6, 0), r.armL);
      I("husk_arm", () => box(s, 0.34, 1.2, 0.34, m.ash, 0, -0.6, 0), r.armR);
      I("husk_fist", () => sph(s, 0.5, m.darkIron), r.armL, 0, -1.25, 0);
      I("husk_fist", () => sph(s, 0.5, m.darkIron), r.armR, 0, -1.25, 0);
      r.height = 2.8;
      break;
    }
    case "soot_archer": {
      humanLegs(m.soot, 0.85, 0.16);
      I("archer_torso", () => box(s, 0.3, 0.75, 0.42, m.soot), r.body, 0, 1.25, 0);
      r.head.position.set(0, 1.8, 0);
      I("archer_head", () => merge("ah", [sph(s, 0.3, m.ash), box(s, 0.05, 0.05, 0.2, m.red, 0.14, 0.02, 0)]), r.head);
      r.armL.position.set(0, 1.55, -0.25); r.armR.position.set(0, 1.55, 0.25);
      I("archer_arm", () => box(s, 0.12, 0.6, 0.12, m.soot, 0, -0.3, 0), r.armL);
      I("archer_arm", () => box(s, 0.12, 0.6, 0.12, m.soot, 0, -0.3, 0), r.armR);
      I("archer_bow", () => { const b = MeshBuilder.CreateTorus("ab", { diameter: 1.1, thickness: 0.05, tessellation: 16 }, s); b.material = m.wood; b.scaling.set(0.35, 1, 1); b.rotation.x = Math.PI / 2; return b; }, r.armL, 0.2, -0.5, 0);
      break;
    }
    case "grave_scribe":
    case "repair_scribe": {
      const robe = id === "grave_scribe" ? m.pale : kit.mat("cyanrobe", "#5a8a9a");
      I(`scribe_robe_${id}`, () => cyl(s, 0.3, 0.85, 1.5, robe, 0, 0, 0, 8), r.body, 0, 0.75, 0);
      r.head.position.set(0, 1.65, 0);
      I("scribe_hood", () => merge("sh", [sph(s, 0.42, robe), sph(s, 0.14, m.cyan, 0.15, 0, 0)]), r.head);
      r.armR.position.set(0, 1.3, 0.3);
      const book = node("book", r.body, 0.6, 1.5, 0); r.extra.push(book);
      I("scribe_book", () => box(s, 0.42, 0.08, 0.32, m.cyan), book);
      r.legL.position.y = 0; r.legR.position.y = 0;
      r.height = 1.9;
      break;
    }
    case "lantern_mite": {
      r.body.position.y = 0.3;
      I("mite_body", () => sph(s, 0.55, m.soot, 0, 0, 0, 1, 0.8, 1), r.body);
      const lan = node("lantern", r.body, -0.1, 0.45, 0); r.extra.push(lan);
      I("mite_lantern", () => sph(s, 0.55, m.lantern, 0, 0, 0, 1, 1.2, 1, 10), lan);
      I("mite_cap", () => cyl(s, 0.2, 0.45, 0.15, m.brass, 0, 0.35, 0, 6), lan);
      for (const side of [-1, 1]) { const leg = node("l", r.body, 0, -0.1, side * 0.2); I("mite_leg", () => box(s, 0.08, 0.3, 0.08, m.soot, 0, -0.15, 0), leg); r.extra.push(leg); }
      r.height = 1.1;
      break;
    }
    case "chain_pilgrim": {
      humanLegs(m.robe, 0.7, 0.2);
      I("pilgrim_robe", () => cyl(s, 0.5, 0.9, 1.3, m.robe, 0, 0, 0, 8), r.body, 0, 1.15, 0, 0, 0, -0.25);
      r.head.position.set(0.25, 1.8, 0);
      I("pilgrim_hood", () => sph(s, 0.45, m.robe, 0, 0, 0, 1, 1.15, 1), r.head);
      I("pilgrim_chain", () => torus(s, 1.2, 0.08, m.iron), r.body, 0, 1.4, 0, 0.6, 0, 0.3);
      r.armR.position.set(0, 1.55, 0.4);
      I("pilgrim_arm", () => box(s, 0.16, 0.7, 0.16, m.robe, 0, -0.35, 0), r.armR);
      I("pilgrim_flail", () => sph(s, 0.32, m.darkIron), r.armR, 0, -0.85, 0);
      break;
    }
    case "archive_warden": {
      humanLegs(m.iron, 0.9, 0.26);
      I("warden_torso", () => merge("wt", [box(s, 0.5, 0.85, 0.7, m.brass), box(s, 0.06, 0.5, 0.2, m.cyan, 0.26, 0.05, 0)]), r.body, 0, 1.4, 0);
      r.head.position.set(0, 2.0, 0);
      I("warden_helm", () => merge("wh", [box(s, 0.42, 0.45, 0.42, m.brass), box(s, 0.05, 0.06, 0.3, m.cyan, 0.22, 0, 0)]), r.head);
      r.armL.position.set(0.2, 1.7, -0.45);
      I("warden_shield", () => merge("ws", [box(s, 0.14, 1.7, 1.0, m.brass), box(s, 0.16, 1.2, 0.12, m.cyan, 0.02, 0, 0)]), r.armL, 0.35, -0.5, 0.2);
      r.armR.position.set(0, 1.75, 0.45);
      I("warden_arm", () => box(s, 0.22, 0.8, 0.22, m.iron, 0, -0.4, 0), r.armR);
      r.height = 2.4;
      break;
    }
    case "quill_swarm": {
      r.body.position.y = 1.1;
      for (let i = 0; i < 9; i++) {
        const q = node("q", r.body, Math.cos(i * 2.1) * 0.45, Math.sin(i * 1.3) * 0.3, Math.sin(i * 2.1) * 0.45);
        I("quill", () => cyl(s, 0, 0.09, 0.6, m.bone, 0, 0, 0, 4), q, 0, 0, 0, 1.2, 0, 0.6);
        r.extra.push(q);
      }
      I("quill_ink", () => sph(s, 0.3, kit.mat("ink", "#202030", { emissive: "#303060", emissiveK: 0.6 })), r.body);
      r.height = 1.8;
      break;
    }
    case "mire_hound": {
      r.body.position.y = 0.65;
      I("hound_body", () => box(s, 1.3, 0.5, 0.5, kit.mat("houndhide", "#3a2a40")), r.body);
      r.head.position.set(0.75, 0.15, 0);
      I("hound_head", () => merge("hh", [box(s, 0.5, 0.35, 0.36, kit.mat("houndhide", "#3a2a40")), sph(s, 0.09, m.violet, 0.2, 0.08, 0.12), sph(s, 0.09, m.violet, 0.2, 0.08, -0.12)]), r.head);
      for (const [x, z] of [[0.45, 0.2], [0.45, -0.2], [-0.45, 0.2], [-0.45, -0.2]]) { const leg = node("l", r.body, x, -0.2, z); I("hound_leg", () => box(s, 0.12, 0.5, 0.12, m.soot, 0, -0.22, 0), leg); r.extra.push(leg); }
      r.height = 1.2;
      break;
    }
    case "censer_adept": {
      I("adept_robe", () => cyl(s, 0.32, 0.8, 1.5, kit.mat("violetrobe", "#4a2a5a"), 0, 0, 0, 8), r.body, 0, 0.75, 0);
      r.head.position.set(0, 1.65, 0);
      I("adept_hood", () => sph(s, 0.42, kit.mat("violetrobe", "#4a2a5a")), r.head);
      r.armR.position.set(0, 1.4, 0.35);
      I("adept_chain", () => box(s, 0.03, 0.8, 0.03, m.iron, 0, -0.4, 0), r.armR);
      I("adept_censer", () => sph(s, 0.3, m.violet), r.armR, 0, -0.85, 0);
      r.height = 1.9;
      break;
    }
    case "training_dummy": {
      I("dummy_post", () => cyl(s, 0.12, 0.14, 1.9, m.wood, 0, 0, 0, 6), r.body, 0, 0.95, 0);
      I("dummy_sack", () => cyl(s, 0.55, 0.6, 0.9, m.straw, 0, 0, 0, 8), r.body, 0, 1.3, 0);
      I("dummy_bar", () => box(s, 0.12, 0.12, 1.3, m.wood), r.body, 0, 1.55, 0);
      I("dummy_head", () => sph(s, 0.38, m.straw), r.body, 0, 1.95, 0);
      r.height = 2.1;
      break;
    }
    case "tollkeeper": {
      r.body.position.y = 0;
      I("toll_robe", () => cyl(s, 0.9, 2.0, 2.6, kit.mat("tollrobe", "#3a2c24"), 0, 0, 0, 10), r.body, 0, 1.3, 0);
      r.head.position.set(0.1, 2.9, 0);
      I("toll_hood", () => merge("th", [sph(s, 0.9, kit.mat("tollrobe", "#3a2c24"), 0, 0, 0, 1, 1.2, 1), sph(s, 0.2, m.lantern, 0.35, 0, 0.15), sph(s, 0.2, m.lantern, 0.35, 0, -0.15)]), r.head);
      r.plates = [];
      for (let i = 0; i < 4; i++) { const p = I("toll_plate", () => box(s, 0.2, 0.7, 0.9, m.darkIron), r.body, Math.cos(i * 1.57) * 0.75, 1.5, Math.sin(i * 1.57) * 0.75, 0, -i * 1.57, 0); r.plates.push(p); }
      for (let i = 0; i < 3; i++) I("toll_chainring", () => torus(s, 1.7 - i * 0.2, 0.07, m.iron), r.body, 0, 0.8 + i * 0.6, 0, 0.15 * (i - 1), 0, 0.1);
      r.armR.position.set(0, 2.2, 0.9);
      I("toll_arm", () => box(s, 0.35, 1.4, 0.35, kit.mat("tollrobe", "#3a2c24"), 0, -0.7, 0), r.armR);
      I("toll_lantern", () => merge("tl", [sph(s, 0.55, m.lantern), cyl(s, 0.3, 0.5, 0.2, m.brass, 0, 0.35, 0, 6)]), r.armR, 0, -1.6, 0);
      r.armL.position.set(0, 2.2, -0.9);
      I("toll_arm", () => box(s, 0.35, 1.4, 0.35, kit.mat("tollrobe", "#3a2c24"), 0, -0.7, 0), r.armL);
      I("toll_hook", () => torus(s, 0.6, 0.1, m.iron), r.armL, 0, -1.5, 0, Math.PI / 2);
      r.height = 3.8;
      break;
    }
    case "engine": {
      I("engine_base", () => merge("eb", [cyl(s, 3.6, 4.6, 0.8, m.darkIron, 0, 0.4, 0, 16), cyl(s, 2.6, 3.4, 0.6, m.brass, 0, 1.1, 0, 16)]), r.body);
      const core = node("core", r.body, 0, 3, 0); r.extra.push(core);
      I("engine_core", () => sph(s, 2.0, m.cyan, 0, 0, 0, 1, 1, 1, 16), core);
      for (let i = 0; i < 3; i++) { const ring = node("ring", r.body, 0, 3, 0); r.extra.push(ring); I(`engine_ring${i}`, () => torus(s, 3.2 + i * 0.8, 0.14, m.brass), ring, 0, 0, 0, 0.5 + i * 0.6, 0, 0.3 * i); }
      for (let i = 0; i < 6; i++) I("engine_spike", () => cyl(s, 0, 0.4, 1.8, m.darkIron, 0, 0, 0, 6), r.body, Math.cos(i) * 1.9, 1.6, Math.sin(i) * 1.9, Math.sin(i) * 0.4, 0, Math.cos(i) * 0.4);
      r.height = 5.5;
      break;
    }
    case "conduit": {
      I("conduit_base", () => cyl(s, 1.0, 1.3, 0.5, m.brass, 0, 0.25, 0, 8), r.body);
      const c = node("crystal", r.body, 0, 1.6, 0); r.extra.push(c);
      I("conduit_crystal", () => { const p = MeshBuilder.CreatePolyhedron("cc", { type: 1, size: 0.55 }, s); p.scaling.set(0.7, 2.2, 0.7); p.material = m.cyan; return p; }, c);
      r.height = 3;
      break;
    }
    default:
      I("unknown", () => box(s, 0.6, 1.6, 0.6, m.ash), r.body, 0, 0.8, 0);
  }
  if (elite || e.isBoss) {
    const col = e.isBoss ? "#ff6030" : ELITE_BY_ID[e.elite[0]]?.color ?? "#ffd060";
    const ring = ringMesh("elitering", s, e.radius * 1.15, e.radius * 1.15 + (e.isBoss ? 0.25 : 0.14), Math.PI * 2, 40);
    ring.material = kit.mat(`ring_${col}`, col, { emissive: col, emissiveK: 1, unlit: true, alpha: 0.8 });
    ring.position.y = 0.04;
    ring.parent = r.root;
    ring.scaling.setAll(1 / r.scale);
    ring.isPickable = false;
    r.ring = ring;
  }
  return r;
}

function torus(s: any, d: number, t: number, mat: StandardMaterial): Mesh {
  const m = MeshBuilder.CreateTorus("t", { diameter: d, thickness: t, tessellation: 24 }, s);
  m.material = mat;
  return m;
}


/** Procedural animation: decisive anticipation and recovery, foot planting, no floaty blends. */
export function animateRig(r: Rig, anim: string, t: number, speed: number, time: number, extra: { windupFrac?: number; heavy?: boolean; flash?: number; kind?: string; staggered?: boolean; armor?: number } = {}) {
  const b = r.body, aL = r.armL, aR = r.armR, lL = r.legL, lR = r.legR;
  const walk = anim === "move" ? Math.sin(time * speed * 2.2) : 0;
  lL.rotation.z = walk * 0.6; lR.rotation.z = -walk * 0.6;
  aL.rotation.z = -walk * 0.4; aR.rotation.z = walk * 0.4;
  b.position.y = (r.kind.startsWith("player") || r.kind === "tollkeeper" ? 0 : b.position.y) + 0;
  const bob = anim === "move" ? Math.abs(Math.sin(time * speed * 2.2)) * 0.06 : Math.sin(time * 2) * 0.015;
  if (r.kind.startsWith("player") || ["bell_husk", "soot_archer", "chain_pilgrim", "archive_warden"].includes(r.kind)) b.position.y = bob;
  b.rotation.z = 0; b.rotation.x = 0;
  aR.rotation.y = 0; aL.rotation.y = 0;
  switch (anim) {
    case "windup": {
      const k = Math.min(1, extra.windupFrac ?? 0.7);
      b.rotation.z = 0.25 * k;
      aR.rotation.z = -2.2 * k;
      if (r.kind === "bell_husk" || r.kind === "tollkeeper") { aL.rotation.z = -2.4 * k; aR.rotation.z = -2.4 * k; }
      break;
    }
    case "attack": {
      const k = Math.max(0, 1 - t / 0.18);
      b.rotation.z = -0.35 * k;
      aR.rotation.z = 1.4 * k - 0.2;
      if (r.kind === "bell_husk" || r.kind === "tollkeeper") { aL.rotation.z = 1.2 * k; aR.rotation.z = 1.2 * k; }
      if (r.kind === "player_ranger") { aL.rotation.z = -1.5; aR.rotation.z = -1.3 + 0.8 * k; }
      break;
    }
    case "recover":
      b.rotation.z = -0.12;
      aR.rotation.z = 0.5;
      if (r.kind === "player_ranger") { aL.rotation.z = -1.3; aR.rotation.z = -1.0; }
      break;
    case "evade":
      b.rotation.z = -0.5; aL.rotation.z = 0.9; aR.rotation.z = 0.9; lL.rotation.z = 0.8; lR.rotation.z = -0.4;
      break;
    case "stun":
      b.rotation.x = Math.sin(time * 9) * 0.15; aL.rotation.z = 0.3; aR.rotation.z = 0.3;
      break;
    case "channel":
      aL.rotation.z = -2.8; aR.rotation.z = -2.8; b.position.y = 0.1 + Math.sin(time * 4) * 0.05;
      break;
    case "cast":
      aR.rotation.z = -1.8 + Math.sin(time * 6) * 0.2;
      break;
    case "dead":
      break;
  }
  if (r.kind === "player_ranger" && (anim === "windup")) { aL.rotation.z = -1.5; aR.rotation.z = -1.5 + 0.3 * (extra.windupFrac ?? 0); }
  // kind specifics
  switch (r.kind) {
    case "ash_crawler":
      r.extra.forEach((l, i) => (l.rotation.y = Math.sin(time * 18 + i) * (anim === "move" ? 0.5 : 0.08)));
      b.position.y = 0.35 + (anim === "windup" ? -0.12 : 0);
      break;
    case "lantern_mite": {
      const lan = r.extra[0];
      const k = anim === "windup" ? 1 + (extra.windupFrac ?? 0) * 0.9 + Math.sin(time * 40) * 0.12 : 1 + Math.sin(time * 5) * 0.05;
      lan.scaling.setAll(k);
      b.position.y = 0.3 + (anim === "move" ? Math.abs(Math.sin(time * 14)) * 0.12 : 0);
      break;
    }
    case "quill_swarm":
      r.extra.forEach((q, i) => { const a = time * (2 + (i % 3)) + i * 2.1; q.position.set(Math.cos(a) * 0.5, Math.sin(time * 3 + i) * 0.3, Math.sin(a) * 0.5); q.rotation.y = -a; });
      b.position.y = 1.1 + Math.sin(time * 2) * 0.1;
      break;
    case "grave_scribe":
    case "repair_scribe":
      if (r.extra[0]) { r.extra[0].position.y = 1.5 + Math.sin(time * 3) * 0.12; r.extra[0].rotation.y = time; }
      b.position.y = Math.sin(time * 1.5) * 0.08 + 0.05;
      break;
    case "mire_hound":
      r.extra.forEach((l, i) => (l.rotation.z = Math.sin(time * 16 + (i % 2) * Math.PI) * (anim === "move" ? 0.7 : 0)));
      b.rotation.z = anim === "windup" ? 0.2 : 0;
      b.position.y = 0.65 + (anim === "windup" ? -0.15 : 0);
      break;
    case "engine":
      r.extra.forEach((n, i) => { if (i === 0) n.scaling.setAll(1 + Math.sin(time * 3) * 0.05 + (extra.staggered ? Math.sin(time * 30) * 0.08 : 0)); else n.rotation.y = time * (0.4 + i * 0.25) * (i % 2 ? 1 : -1); });
      b.rotation.set(0, 0, 0);
      aL.rotation.set(0, 0, 0); aR.rotation.set(0, 0, 0);
      break;
    case "conduit":
      if (r.extra[0]) { r.extra[0].rotation.y = time * 1.5; r.extra[0].position.y = 1.6 + Math.sin(time * 2) * 0.15; }
      b.rotation.set(0, 0, 0);
      break;
    case "tollkeeper":
      if (r.plates) for (const p of r.plates) p.setEnabled((extra.armor ?? 1) > 0);
      break;
    case "training_dummy":
      b.rotation.x = (extra.flash ?? 0) > 0 ? Math.sin(time * 40) * 0.12 : 0;
      break;
  }
  // hit pop
  if ((extra.flash ?? 0) > 0) { const k = 1 + (extra.flash ?? 0) * 0.6; b.scaling.set(k, 2 - k, k); } else b.scaling.set(1, 1, 1);
}

export function disposeRig(r: Rig) {
  r.root.dispose(false, false);
}

export { hex };
