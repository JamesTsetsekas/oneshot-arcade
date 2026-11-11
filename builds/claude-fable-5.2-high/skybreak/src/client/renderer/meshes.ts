// Procedural mesh factory. Every model in the game is authored here from primitives with baked vertex colours.
import { Color4, Mesh, MeshBuilder, Scene, VertexBuffer, VertexData } from "@babylonjs/core";
import type { ItemId } from "../../shared/content/items";
import type { AmmoType, WeaponId } from "../../shared/content/weapons";
import { hexToRgb } from "./palette";

export type Rgb = [number, number, number];

const C = {
  cream: hexToRgb(0xf3ead2),
  ceramic: hexToRgb(0xe6dcc2),
  copper: hexToRgb(0xc8793d),
  copperDark: hexToRgb(0x8c5330),
  teal: hexToRgb(0x1fb0a6),
  tealGlow: hexToRgb(0x7ff5e6),
  wood: hexToRgb(0x8f6238),
  woodDark: hexToRgb(0x62432a),
  metal: hexToRgb(0x56616c),
  dark: hexToRgb(0x2f363d),
  coral: hexToRgb(0xea6a50),
  saffron: hexToRgb(0xf4b63a),
  violet: hexToRgb(0xb678ff),
  mint: hexToRgb(0x9fe8c8),
  white: hexToRgb(0xffffff),
  red: hexToRgb(0xe2504f),
  blue: hexToRgb(0x56c8ff),
};

/** Paints a mesh with one colour, optionally shading the bottom darker (cheap ambient occlusion). */
export function paint(mesh: Mesh, rgb: Rgb, grad = 0): Mesh {
  const pos = mesh.getVerticesData(VertexBuffer.PositionKind)!;
  const n = pos.length / 3;
  const colors = new Float32Array(n * 4);
  let minY = 1e9,
    maxY = -1e9;
  for (let i = 0; i < n; i++) {
    minY = Math.min(minY, pos[i * 3 + 1]!);
    maxY = Math.max(maxY, pos[i * 3 + 1]!);
  }
  for (let i = 0; i < n; i++) {
    const t = maxY > minY ? (pos[i * 3 + 1]! - minY) / (maxY - minY) : 1;
    const k = 1 - grad * (1 - t);
    colors[i * 4] = rgb[0] * k;
    colors[i * 4 + 1] = rgb[1] * k;
    colors[i * 4 + 2] = rgb[2] * k;
    colors[i * 4 + 3] = 1;
  }
  mesh.setVerticesData(VertexBuffer.ColorKind, colors);
  return mesh;
}

type PrimKind = "box" | "cyl" | "cone" | "sphere" | "ico";

/** A primitive with transform baked in and a flat colour. Cylinders/cones point along +Y unless rotated. */
export function prim(
  scene: Scene, kind: PrimKind, sx: number, sy: number, sz: number, px: number, py: number, pz: number, rgb: Rgb,
  rx = 0, ry = 0, rz = 0, tess = 8,
): Mesh {
  let m: Mesh;
  switch (kind) {
    case "box": m = MeshBuilder.CreateBox("p", { size: 1 }, scene); break;
    case "cyl": m = MeshBuilder.CreateCylinder("p", { height: 1, diameter: 1, tessellation: tess }, scene); break;
    case "cone": m = MeshBuilder.CreateCylinder("p", { height: 1, diameterTop: 0, diameterBottom: 1, tessellation: tess }, scene); break;
    case "sphere": m = MeshBuilder.CreateSphere("p", { diameter: 1, segments: 6 }, scene); break;
    default: m = MeshBuilder.CreateIcoSphere("p", { radius: 0.5, subdivisions: 1, flat: true }, scene);
  }
  m.scaling.set(sx, sy, sz);
  m.rotation.set(rx, ry, rz);
  m.position.set(px, py, pz);
  m.bakeCurrentTransformIntoVertices();
  paint(m, rgb);
  return m;
}

export function merge(name: string, parts: Mesh[]): Mesh {
  const m = Mesh.MergeMeshes(parts, true, true, undefined, false, false)!;
  m.name = name;
  return m;
}

/** Triangular prism: ridge along X, apex up. Unit size centred on the origin. */
export function createPrism(scene: Scene): Mesh {
  const p: number[] = [];
  const nrm: number[] = [];
  const idx: number[] = [];
  const quad = (a: number[], b: number[], c: number[], d: number[]): void => {
    const base = p.length / 3;
    const ux = b[0]! - a[0]!, uy = b[1]! - a[1]!, uz = b[2]! - a[2]!;
    const vx = c[0]! - a[0]!, vy = c[1]! - a[1]!, vz = c[2]! - a[2]!;
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1;
    nx /= l; ny /= l; nz /= l;
    for (const q of [a, b, c, d]) {
      p.push(q[0]!, q[1]!, q[2]!);
      nrm.push(nx, ny, nz);
    }
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };
  const tri = (a: number[], b: number[], c: number[]): void => {
    const base = p.length / 3;
    const ux = b[0]! - a[0]!, uy = b[1]! - a[1]!, uz = b[2]! - a[2]!;
    const vx = c[0]! - a[0]!, vy = c[1]! - a[1]!, vz = c[2]! - a[2]!;
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1;
    nx /= l; ny /= l; nz /= l;
    for (const q of [a, b, c]) {
      p.push(q[0]!, q[1]!, q[2]!);
      nrm.push(nx, ny, nz);
    }
    idx.push(base, base + 1, base + 2);
  };
  const A = [-0.5, -0.5, -0.5], B = [0.5, -0.5, -0.5], Cc = [0.5, -0.5, 0.5], D = [-0.5, -0.5, 0.5];
  const E = [-0.5, 0.5, 0], F = [0.5, 0.5, 0];
  quad(A, E, F, B); // -z slope
  quad(Cc, F, E, D); // +z slope
  quad(A, B, Cc, D); // bottom
  tri(A, D, E);
  tri(B, F, Cc);
  const m = new Mesh("prism", scene);
  const vd = new VertexData();
  vd.positions = p;
  vd.normals = nrm;
  vd.indices = idx;
  vd.applyToMesh(m);
  paint(m, [1, 1, 1], 0.12);
  return m;
}

/** Bevelled limestone block: flat top and sides so collision boxes match what players see. */
export function createRock(scene: Scene): Mesh {
  const m = MeshBuilder.CreateBox("rock", { size: 1 }, scene);
  // chamfer by pulling corners inward: use a low-poly sphere-box blend
  const src = MeshBuilder.CreateSphere("r", { diameter: 1, segments: 3 }, scene);
  const pos = src.getVerticesData(VertexBuffer.PositionKind)!;
  for (let i = 0; i < pos.length; i += 3) {
    const x = pos[i]!, y = pos[i + 1]!, z = pos[i + 2]!;
    const mx = Math.max(Math.abs(x), Math.abs(y), Math.abs(z)) || 1;
    // push the sphere out toward a cube, keeping rounded edges
    const k = 0.5 / mx;
    const t = 0.72;
    pos[i] = x * (1 - t) + x * k * t;
    pos[i + 1] = y * (1 - t) + y * k * t;
    pos[i + 2] = z * (1 - t) + z * k * t;
  }
  src.setVerticesData(VertexBuffer.PositionKind, pos);
  src.convertToFlatShadedMesh();
  m.dispose();
  src.name = "rock";
  paint(src, [1, 1, 1], 0.22);
  return src;
}

/** Flat fan polygon in the XZ plane (y up), for rarity markers. */
function fan(scene: Scene, name: string, pts: [number, number][]): Mesh {
  const p: number[] = [0, 0, 0];
  const nrm: number[] = [0, 1, 0];
  const idx: number[] = [];
  for (const [x, z] of pts) {
    p.push(x, 0, z);
    nrm.push(0, 1, 0);
  }
  for (let i = 1; i <= pts.length; i++) idx.push(0, i, i === pts.length ? 1 : i + 1);
  const m = new Mesh(name, scene);
  const vd = new VertexData();
  vd.positions = p;
  vd.normals = nrm;
  vd.indices = idx;
  vd.applyToMesh(m);
  return m;
}

/** Rarity ground markers: circle, chevron, diamond, crown, star (shape + colour, never colour alone). */
export function createRarityShapes(scene: Scene): Mesh[] {
  const circle: [number, number][] = [];
  for (let i = 0; i < 18; i++) circle.push([Math.sin((i / 18) * Math.PI * 2) * 0.42, Math.cos((i / 18) * Math.PI * 2) * 0.42]);
  const chevron: [number, number][] = [[0, 0.5], [0.5, -0.05], [0.5, -0.45], [0, 0.05], [-0.5, -0.45], [-0.5, -0.05]];
  const diamond: [number, number][] = [[0, 0.55], [0.42, 0], [0, -0.55], [-0.42, 0]];
  const crown: [number, number][] = [[-0.5, -0.35], [-0.5, 0.4], [-0.25, 0.08], [0, 0.5], [0.25, 0.08], [0.5, 0.4], [0.5, -0.35]];
  const star: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 0.55 : 0.24;
    star.push([Math.sin((i / 10) * Math.PI * 2) * r, Math.cos((i / 10) * Math.PI * 2) * r]);
  }
  // chevron and crown are concave: fan from a point inside the kernel
  const shapes = [fan(scene, "rCircle", circle), fan(scene, "rChevron", chevron.map(([x, z]) => [x, z - 0.02] as [number, number])), fan(scene, "rDiamond", diamond), fan(scene, "rCrown", crown), fan(scene, "rStar", star)];
  // re-centre concave fans so the hub lies inside the shape
  for (const [mesh, hub] of [[shapes[1]!, [0, 0.12]], [shapes[3]!, [0, -0.2]]] as [Mesh, [number, number]][]) {
    const pos = mesh.getVerticesData(VertexBuffer.PositionKind)!;
    pos[0] = hub[0];
    pos[2] = hub[1];
    mesh.setVerticesData(VertexBuffer.PositionKind, pos);
  }
  return shapes;
}

/** Original weapon silhouettes: wind instruments, ceramic housings, copper mechanisms. Barrel along +Z. */
export function createWeapons(scene: Scene): Record<WeaponId, Mesh> {
  const s = scene;
  const H = Math.PI / 2;
  const out = {} as Record<WeaponId, Mesh>;
  out.wayfarer = merge("w_wayfarer", [
    prim(s, "box", 0.075, 0.13, 0.5, 0, 0, 0.05, C.ceramic),
    prim(s, "cyl", 0.045, 0.5, 0.045, 0, 0.02, 0.5, C.copper, H),
    prim(s, "cyl", 0.07, 0.07, 0.07, 0, 0.02, 0.76, C.copperDark, H),
    prim(s, "box", 0.06, 0.15, 0.26, 0, -0.03, -0.32, C.wood),
    prim(s, "box", 0.05, 0.2, 0.09, 0, -0.15, 0.08, C.teal, 0.25),
    prim(s, "box", 0.04, 0.035, 0.04, 0, 0.085, 0.0, C.teal),
    prim(s, "box", 0.04, 0.035, 0.04, 0, 0.085, 0.12, C.teal),
    prim(s, "box", 0.04, 0.035, 0.04, 0, 0.085, 0.24, C.teal),
    prim(s, "box", 0.045, 0.13, 0.06, 0, -0.12, -0.12, C.woodDark, -0.3),
  ]);
  out.tempest = merge("w_tempest", [
    prim(s, "box", 0.08, 0.12, 0.4, 0, 0, 0.02, C.coral),
    prim(s, "cyl", 0.032, 0.36, 0.032, 0.022, 0.03, 0.38, C.copper, H),
    prim(s, "cyl", 0.032, 0.36, 0.032, -0.022, 0.03, 0.38, C.copper, H),
    prim(s, "cyl", 0.16, 0.07, 0.16, 0, -0.1, 0.08, C.copperDark, 0, 0, H),
    prim(s, "box", 0.05, 0.1, 0.2, 0, -0.01, -0.28, C.dark),
    prim(s, "box", 0.045, 0.12, 0.055, 0, -0.11, -0.1, C.dark, -0.3),
    prim(s, "box", 0.09, 0.03, 0.14, 0, 0.075, 0.02, C.cream),
  ]);
  out.breakwater = merge("w_breakwater", [
    prim(s, "box", 0.09, 0.12, 0.34, 0, 0, 0, C.woodDark),
    prim(s, "cyl", 0.06, 0.5, 0.06, 0, 0.02, 0.4, C.ceramic, H),
    prim(s, "cone", 0.2, 0.18, 0.2, 0, 0.02, 0.7, C.cream, -H),
    prim(s, "cyl", 0.085, 0.16, 0.085, 0, -0.04, 0.34, C.copper, H),
    prim(s, "box", 0.07, 0.15, 0.3, 0, -0.04, -0.3, C.wood),
    prim(s, "box", 0.05, 0.12, 0.06, 0, -0.11, -0.08, C.wood, -0.3),
  ]);
  out.coil = merge("w_coil", [
    prim(s, "box", 0.085, 0.12, 0.36, 0, 0, 0, C.metal),
    prim(s, "cyl", 0.055, 0.42, 0.055, 0, 0.02, 0.38, C.ceramic, H),
    prim(s, "cyl", 0.12, 0.035, 0.12, 0, 0.02, 0.26, C.copper, H),
    prim(s, "cyl", 0.12, 0.035, 0.12, 0, 0.02, 0.36, C.copper, H),
    prim(s, "cyl", 0.12, 0.035, 0.12, 0, 0.02, 0.46, C.copper, H),
    prim(s, "cone", 0.14, 0.1, 0.14, 0, 0.02, 0.62, C.cream, -H),
    prim(s, "box", 0.06, 0.13, 0.26, 0, -0.03, -0.28, C.teal),
    prim(s, "box", 0.05, 0.12, 0.06, 0, -0.11, -0.08, C.dark, -0.3),
  ]);
  out.needler = merge("w_needler", [
    prim(s, "box", 0.08, 0.13, 0.3, 0, 0, 0, C.teal),
    prim(s, "cyl", 0.022, 0.34, 0.022, 0, 0.02, 0.3, C.cream, H),
    prim(s, "cone", 0.05, 0.08, 0.05, 0, 0.02, 0.5, C.copper, H),
    prim(s, "box", 0.045, 0.2, 0.07, 0, 0.14, 0.02, C.cream),
    prim(s, "box", 0.05, 0.13, 0.055, 0, -0.12, -0.06, C.dark, -0.25),
    prim(s, "box", 0.04, 0.05, 0.16, 0, 0.0, -0.2, C.copperDark),
  ]);
  out.sundial = merge("w_sundial", [
    prim(s, "box", 0.07, 0.11, 0.5, 0, 0, 0.05, C.cream),
    prim(s, "cyl", 0.038, 0.62, 0.038, 0, 0.015, 0.58, C.ceramic, H),
    prim(s, "cyl", 0.17, 0.02, 0.17, 0, 0.1, -0.05, C.copper, 0, 0, H),
    prim(s, "box", 0.012, 0.11, 0.012, 0, 0.12, -0.05, C.dark),
    prim(s, "cyl", 0.06, 0.06, 0.06, 0, 0.015, 0.9, C.copperDark, H),
    prim(s, "box", 0.06, 0.16, 0.32, 0, -0.04, -0.36, C.wood),
    prim(s, "box", 0.05, 0.12, 0.08, 0, -0.11, 0.06, C.woodDark),
  ]);
  out.longwake = merge("w_longwake", [
    prim(s, "box", 0.08, 0.13, 0.42, 0, 0, 0, C.dark),
    prim(s, "box", 0.02, 0.035, 0.85, 0.03, 0.03, 0.6, C.ceramic),
    prim(s, "box", 0.02, 0.035, 0.85, -0.03, 0.03, 0.6, C.ceramic),
    prim(s, "box", 0.018, 0.018, 0.8, 0, 0.03, 0.6, C.tealGlow),
    prim(s, "cyl", 0.06, 0.26, 0.06, 0, 0.13, 0.02, C.copper, H),
    prim(s, "cyl", 0.075, 0.03, 0.075, 0, 0.13, 0.16, C.tealGlow, H),
    prim(s, "box", 0.06, 0.15, 0.3, 0, -0.03, -0.34, C.metal),
    prim(s, "box", 0.05, 0.13, 0.06, 0, -0.12, -0.08, C.dark, -0.3),
  ]);
  out.harbor = merge("w_harbor", [
    prim(s, "box", 0.06, 0.09, 0.26, 0, 0.03, 0.06, C.ceramic),
    prim(s, "cyl", 0.05, 0.05, 0.05, 0, 0.035, 0.2, C.copper, H),
    prim(s, "box", 0.05, 0.16, 0.07, 0, -0.07, -0.03, C.wood, -0.25),
    prim(s, "box", 0.02, 0.02, 0.04, 0, 0.085, 0.16, C.teal),
  ]);
  out.gale = merge("w_gale", [
    prim(s, "cyl", 0.17, 0.5, 0.17, 0, 0.02, 0.12, C.mint, H, 0, 0, 10),
    prim(s, "cone", 0.34, 0.2, 0.34, 0, 0.02, 0.46, C.cream, -H, 0, 0, 10),
    prim(s, "cyl", 0.2, 0.04, 0.2, 0, 0.02, -0.02, C.copper, H, 0, 0, 10),
    prim(s, "cyl", 0.2, 0.04, 0.2, 0, 0.02, -0.1, C.copper, H, 0, 0, 10),
    prim(s, "cyl", 0.2, 0.04, 0.2, 0, 0.02, -0.18, C.copper, H, 0, 0, 10),
    prim(s, "box", 0.06, 0.14, 0.2, 0, -0.04, -0.34, C.wood),
    prim(s, "box", 0.05, 0.13, 0.06, 0, -0.14, 0.02, C.dark, -0.3),
  ]);
  return out;
}

export function createItems(scene: Scene): Record<ItemId, Mesh> {
  const s = scene;
  const H = Math.PI / 2;
  const out = {} as Record<ItemId, Mesh>;
  out.injector = merge("i_injector", [
    prim(s, "cyl", 0.12, 0.34, 0.12, 0, 0, 0, C.red),
    prim(s, "cyl", 0.14, 0.06, 0.14, 0, 0.19, 0, C.cream),
    prim(s, "cyl", 0.03, 0.14, 0.03, 0, -0.23, 0, C.metal),
  ]);
  out.trauma = merge("i_trauma", [
    prim(s, "box", 0.42, 0.24, 0.3, 0, 0, 0, C.coral),
    prim(s, "box", 0.2, 0.02, 0.07, 0, 0.125, 0, C.cream),
    prim(s, "box", 0.07, 0.02, 0.2, 0, 0.125, 0, C.cream),
    prim(s, "box", 0.16, 0.05, 0.04, 0, 0.14, 0.15, C.dark),
  ]);
  out.flask = merge("i_flask", [
    prim(s, "sphere", 0.28, 0.3, 0.28, 0, 0, 0, C.blue),
    prim(s, "cyl", 0.1, 0.14, 0.1, 0, 0.2, 0, C.cream),
    prim(s, "cyl", 0.12, 0.05, 0.12, 0, 0.29, 0, C.copper),
  ]);
  out.cell = merge("i_cell", [
    prim(s, "cyl", 0.22, 0.3, 0.22, 0, 0, 0, C.tealGlow, 0, 0, 0, 6),
    prim(s, "cyl", 0.26, 0.05, 0.26, 0, 0.17, 0, C.copper, 0, 0, 0, 6),
    prim(s, "cyl", 0.26, 0.05, 0.26, 0, -0.17, 0, C.copper, 0, 0, 0, 6),
  ]);
  out.mist = merge("i_mist", [
    prim(s, "sphere", 0.26, 0.26, 0.26, 0, 0, 0, hexToRgb(0xdfe6f5)),
    prim(s, "cyl", 0.29, 0.05, 0.29, 0, 0, 0, C.metal),
    prim(s, "cyl", 0.07, 0.08, 0.07, 0, 0.16, 0, C.copper),
  ]);
  out.grapple = merge("i_grapple", [
    prim(s, "cyl", 0.3, 0.14, 0.3, 0, 0, 0, C.saffron, H),
    prim(s, "cyl", 0.36, 0.03, 0.36, 0, 0, 0.08, C.copperDark, H),
    prim(s, "cyl", 0.36, 0.03, 0.36, 0, 0, -0.08, C.copperDark, H),
    prim(s, "cone", 0.1, 0.18, 0.1, 0.2, 0.14, 0, C.metal, 0, 0, -0.9),
  ]);
  out.beacon = merge("i_beacon", [
    prim(s, "cone", 0.26, 0.34, 0.26, 0, 0.02, 0, C.violet, 0, 0, 0, 5),
    prim(s, "cyl", 0.3, 0.05, 0.3, 0, -0.16, 0, C.dark, 0, 0, 0, 5),
    prim(s, "sphere", 0.1, 0.1, 0.1, 0, 0.24, 0, C.white),
  ]);
  out.orb = merge("i_orb", [
    prim(s, "ico", 0.3, 0.3, 0.3, 0, 0, 0, C.mint),
    prim(s, "cyl", 0.34, 0.04, 0.34, 0, 0, 0, C.copper, 0.5),
    prim(s, "cyl", 0.34, 0.04, 0.34, 0, 0, 0, C.copper, -0.5, 0, 0.6),
  ]);
  return out;
}

export function createAmmo(scene: Scene): Record<AmmoType, Mesh> {
  const s = scene;
  const mk = (name: string, body: Rgb, band: Rgb): Mesh =>
    merge(name, [
      prim(s, "box", 0.34, 0.2, 0.22, 0, 0, 0, body),
      prim(s, "box", 0.35, 0.06, 0.23, 0, 0.02, 0, band),
      prim(s, "box", 0.12, 0.04, 0.03, 0, 0.11, 0, C.dark),
    ]);
  return {
    light: mk("a_light", C.cream, C.teal),
    shell: mk("a_shell", C.red, C.copper),
    heavy: mk("a_heavy", C.dark, C.saffron),
    charge: mk("a_charge", C.violet, C.tealGlow),
  };
}

export interface ChestMeshes {
  chest: Mesh;
  chestOpen: Mesh;
  locker: Mesh;
  lockerOpen: Mesh;
  cache: Mesh;
  capsule: Mesh;
  capsuleOpen: Mesh;
  vault: Mesh;
  vaultOpen: Mesh;
}

export function createChests(scene: Scene): ChestMeshes {
  const s = scene;
  const chest = (name: string, body: Rgb, trim: Rgb, glow: Rgb, open: boolean): Mesh =>
    merge(name, [
      prim(s, "box", 1.1, 0.5, 0.7, 0, 0.25, 0, body),
      prim(s, "box", 1.16, 0.1, 0.76, 0, 0.1, 0, trim),
      prim(s, "box", 1.16, 0.08, 0.76, 0, 0.48, 0, trim),
      open ? prim(s, "box", 1.1, 0.24, 0.7, 0, 0.82, -0.4, body, -1.15) : prim(s, "box", 1.1, 0.24, 0.7, 0, 0.62, 0, body),
      open ? prim(s, "box", 0.9, 0.06, 0.5, 0, 0.5, 0, glow) : prim(s, "box", 0.22, 0.2, 0.08, 0, 0.5, 0.36, glow),
      open ? prim(s, "box", 1.16, 0.08, 0.76, 0, 0.9, -0.5, trim, -1.15) : prim(s, "box", 1.16, 0.08, 0.76, 0, 0.72, 0, trim),
    ]);
  const locker = (name: string, open: boolean): Mesh =>
    merge(name, [
      prim(s, "box", 0.9, 1.9, 0.6, 0, 0.95, 0, C.metal),
      prim(s, "box", 0.96, 0.1, 0.66, 0, 1.9, 0, C.dark),
      prim(s, "box", 0.96, 0.1, 0.66, 0, 0.05, 0, C.dark),
      open ? prim(s, "box", 0.8, 1.7, 0.05, 0.62, 0.95, 0.55, C.saffron, 0, 1.2) : prim(s, "box", 0.8, 1.7, 0.05, 0, 0.95, 0.31, C.saffron),
      open ? prim(s, "box", 0.76, 0.05, 0.5, 0, 1.0, 0, C.dark) : prim(s, "box", 0.08, 0.3, 0.05, 0.28, 1.0, 0.35, C.dark),
      prim(s, "box", 0.5, 0.12, 0.02, 0, 1.6, open ? -0.2 : 0.345, C.cream),
    ]);
  const capsule = (name: string, open: boolean): Mesh =>
    merge(name, [
      prim(s, "cyl", 1.3, 1.5, 1.3, 0, 0.85, 0, C.cream, 0, 0, 0, 10),
      prim(s, "cone", 1.3, 0.7, 1.3, 0, open ? 1.3 : 1.95, open ? -0.9 : 0, C.saffron, open ? -1.2 : 0, 0, 0, 10),
      prim(s, "cyl", 1.42, 0.16, 1.42, 0, 0.4, 0, C.copper, 0, 0, 0, 10),
      prim(s, "cyl", 1.42, 0.16, 1.42, 0, 1.3, 0, C.copper, 0, 0, 0, 10),
      prim(s, "box", 0.1, 0.5, 0.7, 0.72, 0.3, 0, C.dark),
      prim(s, "box", 0.1, 0.5, 0.7, -0.72, 0.3, 0, C.dark),
      prim(s, "box", 0.7, 0.5, 0.1, 0, 0.3, 0.72, C.dark),
      prim(s, "box", 0.5, 0.5, 0.06, 0, 0.9, 0.64, open ? C.dark : C.tealGlow),
    ]);
  return {
    chest: chest("c_chest", C.wood, C.copper, C.tealGlow, false),
    chestOpen: chest("c_chestOpen", C.wood, C.copper, C.tealGlow, true),
    locker: locker("c_locker", false),
    lockerOpen: locker("c_lockerOpen", true),
    cache: merge("c_cache", [
      prim(s, "box", 0.7, 0.5, 0.5, 0, 0.27, 0, hexToRgb(0x6b7a52)),
      prim(s, "box", 0.74, 0.12, 0.54, 0, 0.42, 0, C.copperDark),
      prim(s, "cyl", 0.2, 0.7, 0.2, 0, 0.6, 0, hexToRgb(0x8a9a6a), 0, 0, Math.PI / 2),
      prim(s, "box", 0.2, 0.2, 0.06, 0, 0.3, 0.27, C.saffron),
    ]),
    capsule: capsule("c_capsule", false),
    capsuleOpen: capsule("c_capsuleOpen", true),
    vault: chest("c_vault", C.dark, C.saffron, C.violet, false),
    vaultOpen: chest("c_vaultOpen", C.dark, C.saffron, C.violet, true),
  };
}

/** The transit skiff: a wind-driven airship. Faces +Z. */
export function createSkiff(scene: Scene): Mesh {
  const s = scene;
  const H = Math.PI / 2;
  const sail = hexToRgb(0xf4b63a);
  return merge("skiff", [
    prim(s, "box", 5.2, 1.6, 15, 0, 0, 0, C.wood),
    prim(s, "box", 5.6, 0.3, 15.4, 0, 0.85, 0, C.woodDark),
    prim(s, "cone", 5.2, 5, 1.6, 0, 0, 10, C.wood, H, 0, 0, 4),
    prim(s, "box", 4.4, 1.2, 3, 0, -0.2, -8.6, C.woodDark),
    prim(s, "cyl", 1.7, 12, 1.7, -4.1, -0.6, -1, C.copper, H, 0, 0, 10),
    prim(s, "cyl", 1.7, 12, 1.7, 4.1, -0.6, -1, C.copper, H, 0, 0, 10),
    prim(s, "cone", 1.7, 2.6, 1.7, -4.1, -0.6, 6.3, C.copperDark, H, 0, 0, 10),
    prim(s, "cone", 1.7, 2.6, 1.7, 4.1, -0.6, 6.3, C.copperDark, H, 0, 0, 10),
    prim(s, "box", 1.2, 0.3, 3, -2.9, -0.4, -1, C.woodDark),
    prim(s, "box", 1.2, 0.3, 3, 2.9, -0.4, -1, C.woodDark),
    prim(s, "cyl", 0.35, 9, 0.35, 0, 5.2, 2, C.woodDark),
    prim(s, "cyl", 0.3, 7, 0.3, 0, 4.2, -4.5, C.woodDark),
    prim(s, "box", 0.12, 5.5, 6.5, 0, 6.2, 1.2, sail, 0, 0.12),
    prim(s, "box", 0.12, 4.2, 4.6, 0, 5.2, -5.0, C.teal, 0, -0.1),
    prim(s, "box", 9.5, 0.14, 4.2, 0, 2.2, -1.5, C.coral, 0, 0, 0),
    prim(s, "box", 0.2, 1.4, 0.2, -2.4, 1.5, 0.4, C.woodDark),
    prim(s, "box", 0.2, 1.4, 0.2, 2.4, 1.5, 0.4, C.woodDark),
    prim(s, "box", 0.2, 1.4, 0.2, -2.4, 1.5, -3.4, C.woodDark),
    prim(s, "box", 0.2, 1.4, 0.2, 2.4, 1.5, -3.4, C.woodDark),
    prim(s, "cyl", 2.6, 0.3, 2.6, -4.1, -0.6, -7.2, C.cream, H, 0, 0, 10),
    prim(s, "cyl", 2.6, 0.3, 2.6, 4.1, -0.6, -7.2, C.cream, H, 0, 0, 10),
    prim(s, "box", 5.7, 0.9, 0.2, 0, 1.4, 7.5, C.copper),
    prim(s, "box", 8.5, 0.14, 5.4, -8.6, 2.3, -0.5, sail, 0, 0, -0.3),
    prim(s, "box", 8.5, 0.14, 5.4, 8.6, 2.3, -0.5, sail, 0, 0, 0.3),
    prim(s, "box", 3.2, 0.14, 3.2, -13.6, 3.9, -1.2, C.teal, 0, 0, -0.3),
    prim(s, "box", 3.2, 0.14, 3.2, 13.6, 3.9, -1.2, C.teal, 0, 0, 0.3),
    prim(s, "box", 0.25, 0.25, 9, -5, 1.0, -0.5, C.woodDark, 0, 0, 0),
    prim(s, "box", 0.25, 0.25, 9, 5, 1.0, -0.5, C.woodDark, 0, 0, 0),
    prim(s, "box", 6, 0.14, 2.6, 0, 2.6, -9.4, C.coral, 0.25, 0, 0),
    prim(s, "box", 0.2, 0.9, 15, -2.75, 1.4, 0, C.copper),
    prim(s, "box", 0.2, 0.9, 15, 2.75, 1.4, 0, C.copper),
  ]);
}

export function createCaravan(scene: Scene): Mesh {
  const s = scene;
  return merge("caravan", [
    prim(s, "ico", 2.4, 1.5, 2.4, 0, 0, 0, C.cream),
    prim(s, "cyl", 3.2, 0.25, 3.2, 0, 0, 0, C.copper, 0, 0, 0, 10),
    prim(s, "box", 1.2, 0.9, 1.2, 0, -1.0, 0, C.saffron),
    prim(s, "cyl", 1.1, 0.12, 1.1, 2.0, 0.5, 0, C.teal, 0, 0, 0, 8),
    prim(s, "cyl", 1.1, 0.12, 1.1, -2.0, 0.5, 0, C.teal, 0, 0, 0, 8),
    prim(s, "cyl", 1.1, 0.12, 1.1, 0, 0.5, 2.0, C.teal, 0, 0, 0, 8),
    prim(s, "cyl", 1.1, 0.12, 1.1, 0, 0.5, -2.0, C.teal, 0, 0, 0, 8),
    prim(s, "sphere", 0.5, 0.5, 0.5, 0, -1.55, 0, C.violet),
  ]);
}

/** Wing-sail: two swept fabric panels on a copper spar. Unit colour, tinted per actor. */
export function createSail(scene: Scene): Mesh {
  const p = [
    0, 0, 0.5, -2.3, 0.25, -0.5, -0.3, 0, -0.75, // left
    0, 0, 0.5, 0.3, 0, -0.75, 2.3, 0.25, -0.5, // right
    0, 0.02, 0.5, -0.3, 0.02, -0.75, 0.3, 0.02, -0.75, // centre
  ];
  const idx = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  const m = new Mesh("sail", scene);
  const vd = new VertexData();
  vd.positions = p;
  vd.indices = idx;
  const normals: number[] = [];
  VertexData.ComputeNormals(p, idx, normals);
  vd.normals = normals;
  vd.applyToMesh(m);
  return m;
}

export function whiteColor(): Color4 {
  return new Color4(1, 1, 1, 1);
}
