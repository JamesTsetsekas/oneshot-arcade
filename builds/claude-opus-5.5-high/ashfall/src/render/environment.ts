import { Color3, Matrix, Mesh, MeshBuilder, PointLight, Quaternion, Scene, TransformNode, Vector3, VertexData, type AbstractMesh } from "@babylonjs/core";
import { Rng } from "../core/rng";
import type { PropKind, ZoneData } from "../world/types";
import { BLOCK, FLOOR, PIT, ROAD } from "../world/types";
import { Kit, box, cyl, hex, merge, sph } from "./kit";

const THEME = {
  march: { floor: [0.82, 0.74, 0.7], road: [0.95, 0.82, 0.64], block: [0.42, 0.37, 0.36], pit: [0.05, 0.04, 0.05], tex: "ash", fog: "#2a2430" },
  refuge: { floor: [0.92, 0.8, 0.66], road: [1.0, 0.88, 0.7], block: [0.45, 0.39, 0.35], pit: [0.05, 0.04, 0.05], tex: "refuge", fog: "#2c2424" },
  archive: { floor: [0.8, 0.8, 0.86], road: [0.74, 0.72, 0.78], block: [0.06, 0.06, 0.08], pit: [0.03, 0.03, 0.04], tex: "stone", fog: "#161820" },
};
export const THEME_FOG = { march: THEME.march.fog, refuge: THEME.refuge.fog, archive: THEME.archive.fog };

export interface WallSet { mesh: Mesh; centers: Float32Array; heights: Float32Array; cur: Float32Array; count: number }
/** Tall props that fade (shrink) when they stand between the camera and the player. */
export interface PropCut { mesh: Mesh; centers: Float32Array; scales: Float32Array; rots: Float32Array; ys: Float32Array; cur: Float32Array; count: number }
const OCCLUDERS = new Set(["deadtree", "pillar", "palisade", "bookcase", "tent", "banner", "torch"]);

export interface ZoneView {
  root: TransformNode;
  ground: Mesh;
  walls: WallSet | null;
  cuts: PropCut[];
  animated: { node: TransformNode | AbstractMesh; kind: string }[];
  emitters: { x: number; y: number; z: number; kind: "fire" | "torch" | "crystal" | "candle" }[];
  lights: ZoneData["lights"];
  casters: AbstractMesh[];
  dispose(): void;
}

function noise2(x: number, y: number, seed: number) {
  const s = Math.sin(x * 12.9898 + y * 78.233 + seed * 0.123) * 43758.5453;
  return s - Math.floor(s);
}
function smoothNoise(x: number, y: number, seed: number) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const a = noise2(xi, yi, seed), b = noise2(xi + 1, yi, seed), c = noise2(xi, yi + 1, seed), d = noise2(xi + 1, yi + 1, seed);
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
}

export function buildZoneView(kit: Kit, z: ZoneData): ZoneView {
  const scene = kit.scene;
  const root = new TransformNode(`zone_${z.id}`, scene);
  const th = THEME[z.theme];
  const W = z.w, H = z.h;
  const cell = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= H ? BLOCK : z.cells[y * W + x]);
  const open = (c: number) => c === FLOOR || c === ROAD;
  const animated: ZoneView["animated"] = [];
  const emitters: ZoneView["emitters"] = [];
  const casters: AbstractMesh[] = [];
  const cuts: PropCut[] = [];

  // ── ground heightfield with vertex colours ──
  const pos: number[] = [], col: number[] = [], uv: number[] = [], idx: number[] = [];
  const raised = z.theme !== "archive";
  for (let vy = 0; vy <= H; vy++) {
    for (let vx = 0; vx <= W; vx++) {
      const cs = [cell(vx - 1, vy - 1), cell(vx, vy - 1), cell(vx - 1, vy), cell(vx, vy)];
      const nOpen = cs.filter(open).length;
      const nPit = cs.filter((c) => c === PIT).length;
      const nRoad = cs.filter((c) => c === ROAD).length;
      let h = 0;
      let c = th.floor.slice();
      const n = smoothNoise(vx * 0.18, vy * 0.18, z.seed);
      if (nOpen === 0 && nPit === 0) {
        h = raised ? 0.45 + n * 1.3 + noise2(vx, vy, 3) * 0.25 : 0;
        c = th.block.slice();
      } else if (nOpen === 0 && nPit > 0) {
        h = -1.8; c = th.pit.slice();
      } else if (nPit > 0) {
        h = -0.15; c = th.pit.map((v, i) => (v + th.floor[i]) / 2);
      } else if (nOpen < 4 && raised) {
        h = 0.05 + noise2(vx, vy, 5) * 0.15; c = th.block.map((v, i) => (v * 0.5 + th.floor[i] * 0.5));
      }
      if (nRoad >= 2) c = th.road.slice();
      const tint = 0.85 + n * 0.3;
      pos.push(vx, h, vy);
      col.push(c[0] * tint, c[1] * tint, c[2] * tint, 1);
      uv.push(vx / 5, vy / 5);
    }
  }
  const stride = W + 1;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const c = cell(x, y);
      if (!raised && c === BLOCK) {
        // archive: skip interior void cells far from floor (walls cover the rest)
        let near = false;
        for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1 && !near; dx++) if (open(cell(x + dx, y + dy))) near = true;
        if (!near) continue;
      }
      const a = y * stride + x, b = a + 1, cc = a + stride, d = cc + 1;
      idx.push(a, b, cc, b, d, cc);
    }
  const ground = new Mesh(`ground_${z.id}`, scene);
  const vd = new VertexData();
  vd.positions = pos; vd.indices = idx; vd.colors = col; vd.uvs = uv;
  const normals: number[] = [];
  VertexData.ComputeNormals(pos, idx, normals);
  vd.normals = normals;
  vd.applyToMesh(ground);
  ground.useVertexColors = true;
  ground.material = kit.mat(`ground_${z.theme}`, "#ffffff", { tex: th.tex, spec: 0.02 });
  ground.receiveShadows = true;
  ground.parent = root;
  ground.isPickable = false;
  ground.freezeWorldMatrix();

  // ── walls (archive) with cutaway support ──
  let walls: WallSet | null = null;
  if (z.theme === "archive") {
    const centers: number[] = [];
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        if (cell(x, y) !== BLOCK) continue;
        if (open(cell(x + 1, y)) || open(cell(x - 1, y)) || open(cell(x, y + 1)) || open(cell(x, y - 1)) || open(cell(x + 1, y + 1)) || open(cell(x - 1, y - 1)) || open(cell(x + 1, y - 1)) || open(cell(x - 1, y + 1))) centers.push(x + 0.5, y + 0.5);
      }
    const count = centers.length / 2;
    const wallMesh = MeshBuilder.CreateBox("wall", { width: 1, height: 1, depth: 1 }, scene);
    wallMesh.material = kit.mat("wall", "#c8c4cc", { tex: "wall", spec: 0.04 });
    wallMesh.parent = root;
    wallMesh.receiveShadows = true;
    const heights = new Float32Array(count), cur = new Float32Array(count);
    const mats = new Float32Array(count * 16);
    const m = new Matrix();
    for (let i = 0; i < count; i++) {
      const hgt = 2.4 + noise2(centers[i * 2], centers[i * 2 + 1], 9) * 0.5;
      heights[i] = hgt; cur[i] = hgt;
      Matrix.ComposeToRef(new Vector3(1, hgt, 1), Quaternion.Identity(), new Vector3(centers[i * 2], hgt / 2, centers[i * 2 + 1]), m);
      m.copyToArray(mats, i * 16);
    }
    wallMesh.thinInstanceSetBuffer("matrix", mats, 16, false);
    wallMesh.isPickable = false;
    walls = { mesh: wallMesh, centers: new Float32Array(centers), heights, cur, count };
  }

  // ── edge decoration for open-air themes ──
  const rng = Rng.from(z.seed, "decor", z.id);
  const deco: { kind: PropKind; x: number; y: number; rot: number; scale: number }[] = [];
  if (raised) {
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        if (cell(x, y) !== BLOCK) continue;
        const edge = open(cell(x + 1, y)) || open(cell(x - 1, y)) || open(cell(x, y + 1)) || open(cell(x, y - 1));
        const r = rng.next();
        if (edge) {
          if (r < 0.32) deco.push({ kind: "rock", x: x + 0.5 + rng.range(-0.2, 0.2), y: y + 0.5 + rng.range(-0.2, 0.2), rot: rng.range(0, 6.28), scale: rng.range(0.8, 1.6) });
          else if (r < 0.5 && z.theme === "march") deco.push({ kind: "deadtree", x: x + 0.5, y: y + 0.5, rot: rng.range(0, 6.28), scale: rng.range(0.8, 1.3) });
        } else if (r < 0.06) deco.push({ kind: z.theme === "march" && rng.chance(0.5) ? "deadtree" : "rock", x: x + 0.5, y: y + 0.5, rot: rng.range(0, 6.28), scale: rng.range(1, 2.2) });
      }
  }
  for (const p of z.props) deco.push(p);

  // ── props as thin instances per kind ──
  const byKind = new Map<string, typeof deco>();
  for (const d of deco) { if (!byKind.has(d.kind)) byKind.set(d.kind, []); byKind.get(d.kind)!.push(d); }
  for (const [kind, list] of byKind) {
    if (kind === "orrery" || kind === "giantbook") {
      for (const p of list) {
        const n = buildAnimatedProp(kit, kind, p.x, p.y, p.scale);
        n.parent = root;
        animated.push({ node: n, kind });
      }
      continue;
    }
    const tpl = propTemplate(kit, kind as PropKind);
    if (!tpl) continue;
    tpl.parent = root;
    const mats = new Float32Array(list.length * 16);
    const m = new Matrix();
    list.forEach((p, i) => {
      const h = groundHeight(z, p.x, p.y);
      Matrix.ComposeToRef(new Vector3(p.scale, p.scale, p.scale), Quaternion.RotationAxis(Vector3.Up(), -p.rot), new Vector3(p.x, h, p.y), m);
      m.copyToArray(mats, i * 16);
      if (kind === "bonfire") emitters.push({ x: p.x, y: 0.6, z: p.y, kind: "fire" });
      if (kind === "torch") emitters.push({ x: p.x, y: 2.1 * p.scale, z: p.y, kind: "torch" });
      if (kind === "crystal") emitters.push({ x: p.x, y: 1.2 * p.scale, z: p.y, kind: "crystal" });
      if (kind === "candles") emitters.push({ x: p.x, y: 0.5, z: p.y, kind: "candle" });
    });
    tpl.thinInstanceSetBuffer("matrix", mats, 16, !OCCLUDERS.has(kind));
    if (OCCLUDERS.has(kind)) {
      const n = list.length;
      const cut: PropCut = { mesh: tpl, centers: new Float32Array(n * 2), scales: new Float32Array(n), rots: new Float32Array(n), ys: new Float32Array(n), cur: new Float32Array(n).fill(1), count: n };
      list.forEach((p, i) => { cut.centers[i * 2] = p.x; cut.centers[i * 2 + 1] = p.y; cut.scales[i] = p.scale; cut.rots[i] = p.rot; cut.ys[i] = groundHeight(z, p.x, p.y); });
      cuts.push(cut);
    }
    tpl.receiveShadows = true;
    tpl.isPickable = false;
    tpl.alwaysSelectAsActiveMesh = true;
    if (kind !== "bones" && kind !== "candles") casters.push(tpl);
  }

  return {
    root, ground, walls, cuts, animated, emitters, lights: z.lights, casters,
    dispose() { root.dispose(false, false); },
  };
}

export function groundHeight(z: ZoneData, x: number, y: number) {
  const c = z.cells[Math.floor(y) * z.w + Math.floor(x)];
  return c === BLOCK && z.theme !== "archive" ? 0.4 : 0;
}

const templates = new Map<string, Mesh>();

function propTemplate(kit: Kit, kind: PropKind): Mesh | null {
  const s = kit.scene;
  const stone = kit.mat("stone", "#948c82", { spec: 0.03 });
  const darkStone = kit.mat("darkstone", "#5c5650");
  const charcoal = kit.mat("charcoal", "#2c2624");
  const wood = kit.mat("wood", "#5a3e2a");
  const brass = kit.mat("brass", "#a47a3a", { spec: 0.3 });
  const cloth = kit.mat("cloth", "#6a3030");
  const flame = kit.mat("flame", "#ffb050", { emissive: "#ff8a30", emissiveK: 1.4, unlit: true });
  const cyan = kit.mat("starmetal", "#4fe6ff", { emissive: "#3fd8ff", emissiveK: 1.1 });
  const bone = kit.mat("bone", "#d8d0bc");
  let parts: Mesh[] = [];
  switch (kind) {
    case "rock": {
      const r = MeshBuilder.CreatePolyhedron("r", { type: 2, size: 0.55 }, s);
      r.scaling.set(1, 0.7, 1.1); r.position.y = 0.25; r.material = darkStone; parts = [r];
      const r2 = MeshBuilder.CreatePolyhedron("r2", { type: 1, size: 0.3 }, s); r2.position.set(0.45, 0.12, 0.2); r2.material = darkStone; parts.push(r2);
      break;
    }
    case "deadtree": {
      parts = [cyl(s, 0.12, 0.34, 3.2, charcoal, 0, 1.6, 0, 6)];
      const b1 = cyl(s, 0.05, 0.12, 1.4, charcoal, 0.35, 2.4, 0, 5); b1.rotation.z = -0.8; parts.push(b1);
      const b2 = cyl(s, 0.04, 0.1, 1.1, charcoal, -0.3, 2.7, 0.1, 5); b2.rotation.z = 0.9; parts.push(b2);
      const b3 = cyl(s, 0.03, 0.08, 0.9, charcoal, 0, 2.9, -0.3, 5); b3.rotation.x = 0.8; parts.push(b3);
      break;
    }
    case "ruinwall": parts = [box(s, 1.02, 1.3 + Math.random() * 0.01, 0.6, stone, 0, 0.65, 0), box(s, 0.5, 0.4, 0.55, stone, 0.2, 1.45, 0)]; break;
    case "pillar": parts = [box(s, 1, 0.3, 1, stone, 0, 0.15, 0), cyl(s, 0.62, 0.7, 3, stone, 0, 1.8, 0, 10), box(s, 0.95, 0.25, 0.95, stone, 0, 3.4, 0)]; break;
    case "bookcase": {
      parts = [box(s, 1.5, 2.1, 0.5, wood, 0, 1.05, 0)];
      const books = kit.mat("books", "#6a4a7a");
      for (let i = 0; i < 3; i++) parts.push(box(s, 1.35, 0.42, 0.42, books, 0, 0.45 + i * 0.6, 0.06));
      break;
    }
    case "sarcophagus": parts = [box(s, 1, 0.8, 2.1, stone, 0, 0.4, 0), box(s, 1.1, 0.15, 2.2, darkStone, 0, 0.85, 0)]; break;
    case "candles": parts = [cyl(s, 0.08, 0.1, 0.4, bone, 0, 0.2, 0), cyl(s, 0.07, 0.09, 0.28, bone, 0.15, 0.14, 0.08), cyl(s, 0.07, 0.09, 0.5, bone, -0.1, 0.25, 0.12), sph(s, 0.1, flame, 0, 0.46, 0), sph(s, 0.08, flame, 0.15, 0.32, 0.08), sph(s, 0.08, flame, -0.1, 0.55, 0.12)]; break;
    case "crystal": { const c = MeshBuilder.CreatePolyhedron("c", { type: 1, size: 0.45 }, s); c.scaling.set(0.6, 2, 0.6); c.position.y = 0.8; c.material = cyan; parts = [c, box(s, 0.6, 0.2, 0.6, darkStone, 0, 0.1, 0)]; break; }
    case "tent": { const t = cyl(s, 0.05, 3, 2.4, kit.mat("canvas", "#7a6a52"), 0, 1.2, 0, 4); parts = [t]; break; }
    case "palisade": for (let i = -1; i <= 1; i++) { parts.push(cyl(s, 0.28, 0.32, 2.2, wood, i * 0.66, 1.1, 0, 6)); parts.push(cyl(s, 0.0, 0.3, 0.45, wood, i * 0.66, 2.42, 0, 6)); } break;
    case "bonfire": parts = [cyl(s, 1.4, 1.6, 0.25, darkStone, 0, 0.12, 0, 10), box(s, 1.4, 0.18, 0.2, wood, 0, 0.3, 0, 0.5), box(s, 1.4, 0.18, 0.2, wood, 0, 0.32, 0, -0.7), cyl(s, 0, 0.8, 1.2, flame, 0, 0.8, 0, 7)]; break;
    case "torch": parts = [cyl(s, 0.08, 0.1, 2, wood, 0, 1, 0, 5), cyl(s, 0.25, 0.12, 0.25, brass, 0, 2, 0, 6), sph(s, 0.26, flame, 0, 2.15, 0, 1, 1.4, 1)]; break;
    case "brazier": parts = [cyl(s, 0.9, 0.5, 0.5, brass, 0, 0.6, 0, 8), cyl(s, 0.2, 0.3, 0.4, brass, 0, 0.2, 0, 6), sph(s, 0.5, flame, 0, 0.9, 0)]; break;
    case "cart": { parts = [box(s, 1.2, 0.5, 2, wood, 0, 0.7, 0)]; for (const z of [-0.65, 0.65]) { const w = cyl(s, 0.9, 0.9, 0.12, charcoal, 0.68, 0.45, z, 10); w.rotation.z = Math.PI / 2; parts.push(w); const w2 = w.clone("w2"); w2.position.x = -0.68; parts.push(w2); } break; }
    case "bones": parts = [box(s, 0.5, 0.08, 0.08, bone, 0, 0.04, 0, 0.4), box(s, 0.4, 0.07, 0.07, bone, 0.1, 0.04, 0.2, -0.6), sph(s, 0.2, bone, -0.2, 0.08, -0.1)]; break;
    case "gear": { const g = cyl(s, 1.2, 1.2, 0.18, brass, 0, 0.6, 0, 12); g.rotation.x = Math.PI / 2; parts = [g, cyl(s, 0.3, 0.3, 0.3, darkStone, 0, 0.6, 0, 8)]; parts[1].rotation.x = Math.PI / 2; break; }
    case "banner": { parts = [cyl(s, 0.08, 0.08, 3, wood, 0, 1.5, 0, 5)]; const f = box(s, 0.9, 1.4, 0.04, cloth, 0.45, 2.2, 0); parts.push(f); break; }
    case "anvil": parts = [box(s, 0.5, 0.5, 0.4, darkStone, 0, 0.25, 0), box(s, 1, 0.3, 0.45, charcoal, 0, 0.62, 0)]; break;
    case "well": parts = [cyl(s, 1.6, 1.7, 0.8, stone, 0, 0.4, 0, 12), cyl(s, 1.2, 1.2, 0.82, kit.mat("void", "#050505"), 0, 0.42, 0, 12), box(s, 0.12, 1.8, 0.12, wood, 0.75, 1.3, 0), box(s, 0.12, 1.8, 0.12, wood, -0.75, 1.3, 0), box(s, 1.8, 0.1, 0.6, wood, 0, 2.2, 0)]; break;
    case "arch": parts = [box(s, 0.7, 3.2, 0.7, stone, 0, 1.6, -1.6), box(s, 0.7, 3.2, 0.7, stone, 0, 1.6, 1.6), box(s, 0.8, 0.7, 4, stone, 0, 3.4, 0)]; break;
    case "stairs": for (let i = 0; i < 4; i++) parts.push(box(s, 2.4 - i * 0.1, 0.12, 0.5, darkStone, 0, -0.06 - i * 0.12, -0.6 + i * 0.4)); parts.push(box(s, 2.6, 0.5, 2.2, kit.mat("void", "#050505"), 0, -0.7, 0.2)); break;
    default: return null;
  }
  const m = merge(`prop_${kind}`, parts);
  m.isVisible = true;
  return m;
}

function buildAnimatedProp(kit: Kit, kind: string, x: number, y: number, scale: number): TransformNode {
  const s = kit.scene;
  const n = new TransformNode(`anim_${kind}`, s);
  n.position.set(x, 0, y);
  n.scaling.setAll(scale);
  const brass = kit.mat("brass", "#a47a3a", { spec: 0.3 });
  const cyan = kit.mat("starmetal", "#4fe6ff", { emissive: "#3fd8ff", emissiveK: 1.1 });
  if (kind === "orrery") {
    const base = cyl(s, 1.6, 2, 0.6, kit.mat("darkstone", "#5c5650"), 0, 0.3, 0, 12); base.parent = n;
    const core = sph(s, 0.8, cyan, 0, 2, 0, 1, 1, 1, 12); core.parent = n;
    for (let i = 0; i < 3; i++) {
      const ring = MeshBuilder.CreateTorus("ring", { diameter: 2 + i * 0.9, thickness: 0.08, tessellation: 32 }, s);
      ring.material = brass; ring.position.y = 2; ring.parent = n; ring.rotation.x = 0.4 + i * 0.5; ring.metadata = { spin: 0.3 + i * 0.25 };
      const planet = sph(s, 0.25, i === 1 ? cyan : brass, (2 + i * 0.9) / 2, 0, 0); planet.parent = ring;
    }
  } else {
    const book = box(s, 1.8, 0.2, 1.3, kit.mat("parch", "#e8dcc0", { emissive: "#a080ff", emissiveK: 0.35 }), 0, 1.6, 0); book.parent = n;
    const cover = box(s, 1.9, 0.08, 1.4, kit.mat("leather", "#3a2030"), 0, 1.45, 0); cover.parent = n;
    const ped = cyl(s, 0.5, 0.8, 1.1, kit.mat("darkstone", "#5c5650"), 0, 0.55, 0, 8); ped.parent = n;
  }
  return n;
}

/** Pool of local point lights assigned to the zone lights nearest the player (dynamic-light budget). */
export class LightPool {
  lights: PointLight[] = [];
  private t = 0;
  constructor(scene: Scene, n = 6) {
    for (let i = 0; i < n; i++) {
      const l = new PointLight(`pl${i}`, new Vector3(0, -100, 0), scene);
      l.intensity = 0; l.range = 8;
      this.lights.push(l);
    }
  }
  update(dt: number, px: number, py: number, list: ZoneData["lights"], time: number) {
    this.t -= dt;
    if (this.t <= 0) {
      this.t = 0.4;
      const sorted = list.map((l) => ({ l, d: (l.x - px) ** 2 + (l.y - py) ** 2 })).sort((a, b) => a.d - b.d).slice(0, this.lights.length);
      this.lights.forEach((pl, i) => {
        const s = sorted[i];
        if (!s) { pl.intensity = 0; pl.metadata = null; return; }
        pl.position.set(s.l.x, 2.2, s.l.y);
        pl.diffuse = hex(s.l.color);
        pl.specular = Color3.Black();
        pl.range = s.l.range * 1.4;
        pl.metadata = { base: s.l.intensity, fire: s.l.color.startsWith("#ff") };
      });
    }
    for (const pl of this.lights) {
      if (!pl.metadata) continue;
      const flick = pl.metadata.fire ? 0.85 + Math.sin(time * 13 + pl.position.x) * 0.08 + Math.sin(time * 23 + pl.position.z) * 0.06 : 1;
      pl.intensity = pl.metadata.base * 1.6 * flick;
    }
  }
}
