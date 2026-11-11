// South Quay district definition. Pure data + deterministic generation, no rendering.
// The always-loaded "lightweight" layer: road grid, blocks, building footprints,
// colliders, surfaces, water, anchors. Rendering streams visual cells from this.

import { Rng, clamp, smoothstep } from "../core/math";

export type DistrictId = "tide" | "foundry" | "glassline" | "lantern" | "breakwater" | "canal";
export type Surface = "asphalt" | "concrete" | "gravel" | "dirt" | "metal" | "water" | "grass";
export type BuildingStyle = "deco" | "glass" | "industrial" | "brick" | "house" | "shed";

export const DISTRICT_NAMES: Record<DistrictId, string> = {
  tide: "Tide Market",
  foundry: "Foundry Row",
  glassline: "Glassline",
  lantern: "Lantern Hill",
  breakwater: "Breakwater",
  canal: "Canal Loop",
};

export const WORLD_MIN = -450;
export const WORLD_MAX = 450;
export const CELL = 100;
export const CELLS = 9;
export const X_LINES = [-400, -300, -200, -100, 0, 100, 200, 300, 400];
export const Z_LINES = [-370, -280, -190, -100, -10, 110, 200, 290, 390];
export const LANE_W = 3.5;
export const SIDEWALK = 4;
export const CANAL_Z0 = 44;
export const CANAL_Z1 = 56;
export const QUAY_Z = -392;
export const WATER_LEVEL = -0.8;
export const VIADUCT_Z = -182.3;
export const VIADUCT_H = 8;

const ARTERIAL_X = new Set([0, 4, 8]);
const ARTERIAL_Z = new Set([0, 3, 8]);

export const xLanes = (i: number) => (ARTERIAL_X.has(i) ? 2 : 1);
export const zLanes = (j: number) => (ARTERIAL_Z.has(j) ? 2 : 1);
export const xHalfW = (i: number) => xLanes(i) * LANE_W + 0.5;
export const zHalfW = (j: number) => zLanes(j) * LANE_W + 0.5;

/** Removed grid edges, written as "x1,z1|x2,z2". Creates plaza, big blocks, canal barriers. */
const REMOVED = new Set([
  "-100,-190|0,-190", // Tide Market plaza
  "-300,-190|-300,-100", // Foundry Row freight shed block
  "-300,-10|-300,110", // canal: no bridge
  "300,-10|300,110", // canal: no bridge
  "-300,290|-300,390", // Lantern Hill viewpoint park
  "-200,200|-200,290", // Lantern Hill stair alleys
]);

export function hasEdgeNS(i: number, j: number) {
  if (i < 0 || i > 8 || j < 0 || j > 7) return false;
  return !REMOVED.has(`${X_LINES[i]},${Z_LINES[j]}|${X_LINES[i]},${Z_LINES[j + 1]}`);
}
export function hasEdgeEW(i: number, j: number) {
  if (i < 0 || i > 7 || j < 0 || j > 8) return false;
  return !REMOVED.has(`${X_LINES[i]},${Z_LINES[j]}|${X_LINES[i + 1]},${Z_LINES[j]}`);
}

export interface Rect { x0: number; z0: number; x1: number; z1: number }
export const rectContains = (r: Rect, x: number, z: number, m = 0) =>
  x >= r.x0 - m && x <= r.x1 + m && z >= r.z0 - m && z <= r.z1 + m;
export const rectsOverlap = (a: Rect, b: Rect, m = 0) =>
  a.x0 < b.x1 + m && a.x1 > b.x0 - m && a.z0 < b.z1 + m && a.z1 > b.z0 - m;

export type BlockKind =
  | "buildings" | "plaza" | "towers" | "warehouse" | "docks" | "houses" | "park" | "canalside" | "edge";

export interface Block extends Rect {
  id: number;
  district: DistrictId;
  kind: BlockKind;
  surface: Surface;
}

export interface Building extends Rect {
  id: number;
  baseY: number;
  topY: number;
  style: BuildingStyle;
  color: [number, number, number];
  roof: [number, number, number];
  cell: number;
  landmark?: string;
}

export type ColliderKind = "building" | "wall" | "rail" | "prop" | "container" | "pillar" | "bound" | "tree";
export interface Collider extends Rect {
  y0: number;
  y1: number;
  kind: ColliderKind;
  /** Thin cover (wood/sheet metal): bullets penetrate with reduced damage. */
  thin?: boolean;
  /** Interior wall group; hidden/visible with interior. */
  interior?: string;
}

export type PropType =
  | "lamp" | "bin" | "bench" | "cone" | "tree" | "stall" | "crate" | "container" | "bollard"
  | "crane" | "planter" | "barrier" | "hydrant";

export interface PropDef {
  id: number;
  type: PropType;
  x: number;
  z: number;
  y: number;
  yaw: number;
  /** Breakable/movable dynamic prop (lamps, bins, cones, benches, barriers). */
  breakable: boolean;
  color?: [number, number, number];
  stack?: number;
  cell: number;
}

export type InteriorId = "safehouse" | "store" | "kiosk" | "garage" | "police" | "warehouse" | "portoffice";
export interface Door { side: "n" | "s" | "e" | "w"; offset: number; width: number }
export interface Interior extends Rect {
  id: InteriorId;
  name: string;
  h: number;
  baseY: number;
  doors: Door[];
  /** Partition walls inside (simple axis aligned segments with a gap). */
  partitions: Rect[];
  color: [number, number, number];
  floor: [number, number, number];
}

export type InteractKind =
  | "rest" | "board" | "locker" | "shop" | "kiosk" | "repair" | "police" | "contact"
  | "terminal" | "server" | "manifest" | "sidedoor" | "frontdesk" | "viewpoint";

export interface InteractPoint {
  id: string;
  kind: InteractKind;
  x: number;
  z: number;
  r: number;
  label: string;
  interior?: InteriorId;
}

export interface Landmark { id: string; name: string; x: number; z: number; district: DistrictId }

export interface District {
  blocks: Block[];
  buildings: Building[];
  props: PropDef[];
  colliders: Collider[];
  interiors: Interior[];
  interacts: InteractPoint[];
  landmarks: Landmark[];
  reserved: Rect[];
  spawns: Record<string, { x: number; z: number; yaw: number }>;
}

// ---------------------------------------------------------------- terrain & water

export function isBridgeX(x: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (!hasEdgeNS(i, 4)) continue;
    if (Math.abs(x - X_LINES[i]) <= xHalfW(i) + SIDEWALK) return true;
  }
  return false;
}

export function onPier(x: number, z: number) {
  return (x >= -330 && x <= -270 && z >= -452) || (x >= 140 && x <= 160 && z >= -452);
}

export function inHarbor(x: number, z: number) {
  return z < QUAY_Z && !onPier(x, z);
}

export function inCanal(x: number, z: number) {
  return z > CANAL_Z0 && z < CANAL_Z1 && !isBridgeX(x);
}

/** Base terrain height (no curbs). Lantern Hill rises to the north-west. */
export function terrainHeight(x: number, z: number): number {
  if (inHarbor(x, z)) return -6;
  if (inCanal(x, z)) return -3;
  const hill = 34 * smoothstep(115, 395, z) * smoothstep(260, -380, x);
  return hill;
}

export function waterSurfaceAt(x: number, z: number): number | null {
  if (inHarbor(x, z) || inCanal(x, z)) return WATER_LEVEL;
  return null;
}

export function districtAt(x: number, z: number): DistrictId {
  if (z < -300) return "breakwater";
  if (z < -10) return x < -150 ? "foundry" : x < 150 ? "tide" : "glassline";
  if (z < 110) return "canal";
  return x < 100 ? "lantern" : "glassline";
}

/** Road query: returns road half width info if (x,z) is on a carriageway. */
export function roadAt(x: number, z: number): { onRoad: boolean; onSidewalk: boolean } {
  let onRoad = false, onSidewalk = false;
  for (let i = 0; i < 9; i++) {
    const dx = Math.abs(x - X_LINES[i]);
    const hw = xHalfW(i);
    if (dx > hw + SIDEWALK) continue;
    for (let j = 0; j < 8; j++) {
      if (!hasEdgeNS(i, j)) continue;
      if (z >= Z_LINES[j] - 1 && z <= Z_LINES[j + 1] + 1) {
        if (dx <= hw) onRoad = true; else onSidewalk = true;
      }
    }
  }
  for (let j = 0; j < 9; j++) {
    const dz = Math.abs(z - Z_LINES[j]);
    const hw = zHalfW(j);
    if (dz > hw + SIDEWALK) continue;
    for (let i = 0; i < 8; i++) {
      if (!hasEdgeEW(i, j)) continue;
      if (x >= X_LINES[i] - 1 && x <= X_LINES[i + 1] + 1) {
        if (dz <= hw) onRoad = true; else onSidewalk = true;
      }
    }
  }
  if (onRoad) onSidewalk = false;
  return { onRoad, onSidewalk };
}

// ---------------------------------------------------------------- generation

const PALETTES: Record<DistrictId, [number, number, number][]> = {
  tide: [[0.93, 0.72, 0.55], [0.86, 0.5, 0.42], [0.95, 0.86, 0.66], [0.55, 0.74, 0.72], [0.98, 0.78, 0.5], [0.8, 0.62, 0.78]],
  foundry: [[0.55, 0.5, 0.45], [0.42, 0.47, 0.5], [0.6, 0.38, 0.3], [0.5, 0.55, 0.45], [0.66, 0.6, 0.5]],
  glassline: [[0.55, 0.7, 0.78], [0.45, 0.6, 0.7], [0.7, 0.78, 0.82], [0.5, 0.66, 0.62], [0.62, 0.68, 0.8]],
  lantern: [[0.96, 0.88, 0.75], [0.92, 0.7, 0.62], [0.72, 0.84, 0.78], [0.95, 0.8, 0.55], [0.82, 0.76, 0.9], [0.98, 0.94, 0.86]],
  breakwater: [[0.62, 0.58, 0.52], [0.45, 0.55, 0.6], [0.7, 0.5, 0.35], [0.5, 0.5, 0.5]],
  canal: [[0.72, 0.42, 0.34], [0.78, 0.55, 0.4], [0.85, 0.75, 0.6], [0.6, 0.45, 0.4], [0.9, 0.8, 0.7]],
};
const CONTAINER_COLORS: [number, number, number][] = [
  [0.75, 0.25, 0.2], [0.2, 0.45, 0.65], [0.85, 0.6, 0.15], [0.25, 0.55, 0.4], [0.55, 0.3, 0.55], [0.8, 0.8, 0.78],
];

export const cellIndexOf = (x: number, z: number) => {
  const cx = clamp(Math.floor((x - WORLD_MIN) / CELL), 0, CELLS - 1);
  const cz = clamp(Math.floor((z - WORLD_MIN) / CELL), 0, CELLS - 1);
  return cz * CELLS + cx;
};

function footprintHeights(r: Rect) {
  const hs = [terrainHeight(r.x0, r.z0), terrainHeight(r.x1, r.z0), terrainHeight(r.x0, r.z1), terrainHeight(r.x1, r.z1),
    terrainHeight((r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2)];
  return { min: Math.min(...hs), max: Math.max(...hs) };
}

const INTERIORS: Interior[] = [
  { id: "safehouse", name: "Rowan's Loft (Safehouse)", x0: -62, x1: -48, z0: 75, z1: 89, h: 6, baseY: 0, doors: [{ side: "n", offset: 0, width: 2.4 }], partitions: [], color: [0.86, 0.72, 0.56], floor: [0.55, 0.4, 0.3] },
  { id: "store", name: "Harbor Supply", x0: 22, x1: 38, z0: -128, z1: -116, h: 5, baseY: 0, doors: [{ side: "n", offset: 0, width: 3 }], partitions: [], color: [0.95, 0.9, 0.78], floor: [0.75, 0.75, 0.72] },
  { id: "kiosk", name: "Tidewear Kiosk", x0: -34, x1: -26, z0: -258, z1: -252, h: 3.6, baseY: 0, doors: [{ side: "n", offset: 0, width: 4 }], partitions: [], color: [0.95, 0.55, 0.45], floor: [0.7, 0.6, 0.5] },
  { id: "garage", name: "Breakwater Repair", x0: -161, x1: -139, z0: -348, z1: -332, h: 7, baseY: 0, doors: [{ side: "s", offset: 0, width: 9 }], partitions: [], color: [0.5, 0.55, 0.58], floor: [0.45, 0.45, 0.45] },
  { id: "police", name: "Glassline Police Substation", x0: 239, x1: 261, z0: -132, z1: -118, h: 6, baseY: 0, doors: [{ side: "n", offset: 0, width: 3 }], partitions: [], color: [0.85, 0.88, 0.92], floor: [0.7, 0.72, 0.75] },
  { id: "warehouse", name: "Calloway Freight Shed 4", x0: -325, x1: -275, z0: -165, z1: -135, h: 10, baseY: 0, doors: [{ side: "s", offset: 6, width: 6 }, { side: "w", offset: 4, width: 2.2 }], partitions: [{ x0: -290, x1: -289.7, z0: -165, z1: -152 }], color: [0.55, 0.5, 0.44], floor: [0.42, 0.4, 0.38] },
  { id: "portoffice", name: "Port Control Office", x0: 237, x1: 263, z0: -323, z1: -307, h: 6, baseY: 0, doors: [{ side: "n", offset: -4, width: 2.6 }], partitions: [{ x0: 254, x1: 254.3, z0: -323, z1: -312 }], color: [0.82, 0.84, 0.86], floor: [0.5, 0.52, 0.55] },
];

const RESERVED: Rect[] = [
  { x0: -70, x1: -40, z0: 58, z1: 104 }, // safehouse yard
  { x0: 18, x1: 44, z0: -132, z1: -110 }, // store
  { x0: -164, x1: -136, z0: -360, z1: -326 }, // garage apron
  { x0: 232, x1: 292, z0: -138, z1: -110 }, // police lot
  { x0: -345, x1: -255, z0: -183, z1: -110 }, // freight shed yard
  { x0: 226, x1: 274, z0: -338, z1: -287 }, // port office
  { x0: -372, x1: -308, z0: 306, z1: 374 }, // viewpoint park
];

export function generateDistrict(seed = 1337): District {
  const rng = new Rng(seed);
  const blocks: Block[] = [];
  const buildings: Building[] = [];
  const props: PropDef[] = [];
  const colliders: Collider[] = [];
  const interiors = INTERIORS.map((i) => ({ ...i, partitions: i.partitions.map((p) => ({ ...p })), doors: i.doors.map((d) => ({ ...d })) }));
  let propId = 0;
  const addProp = (p: Omit<PropDef, "id" | "cell" | "y"> & { y?: number }) => {
    const y = p.y ?? terrainHeight(p.x, p.z);
    const def: PropDef = { ...p, y, id: propId++, cell: cellIndexOf(p.x, p.z) } as PropDef;
    props.push(def);
    return def;
  };

  // ---- blocks
  let blockId = 0;
  const blockKind = (d: DistrictId, i: number, j: number): BlockKind => {
    if (i === 3 && (j === 1 || j === 2)) return "plaza";
    if (d === "glassline") return "towers";
    if (d === "foundry") return "warehouse";
    if (d === "breakwater") return "docks";
    if (d === "lantern") return (i === 0 || i === 1) && j === 7 ? "park" : "houses";
    if (d === "canal") return "canalside";
    return "buildings";
  };
  const surfaceFor = (k: BlockKind): Surface =>
    k === "warehouse" ? "gravel" : k === "docks" ? "concrete" : k === "park" || k === "houses" ? "dirt" : "concrete";

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      // Merged blocks: removed edge interior boundaries.
      let x0 = X_LINES[i] + (hasEdgeNSAny(i, j) ? xHalfW(i) + SIDEWALK : 0);
      let x1 = X_LINES[i + 1] - (hasEdgeNSAny(i + 1, j) ? xHalfW(i + 1) + SIDEWALK : 0);
      let z0 = Z_LINES[j] + (hasEdgeEWAny(i, j) ? zHalfW(j) + SIDEWALK : 0);
      let z1 = Z_LINES[j + 1] - (hasEdgeEWAny(i, j + 1) ? zHalfW(j + 1) + SIDEWALK : 0);
      const cx = (X_LINES[i] + X_LINES[i + 1]) / 2, cz = (Z_LINES[j] + Z_LINES[j + 1]) / 2;
      const d = districtAt(cx, cz);
      const k = blockKind(d, i, j);
      if (j === 4) {
        // canal splits block
        blocks.push({ id: blockId++, x0, x1, z0, z1: CANAL_Z0 - 1.5, district: "canal", kind: "canalside", surface: "concrete" });
        blocks.push({ id: blockId++, x0, x1, z0: CANAL_Z1 + 4.5, z1, district: "canal", kind: "canalside", surface: "concrete" });
      } else {
        blocks.push({ id: blockId++, x0, x1, z0, z1, district: d, kind: k, surface: surfaceFor(k) });
      }
    }
  }
  // edge strips outside the arterial loop (skyline wall)
  const edgeW = { x0: WORLD_MIN + 3, x1: X_LINES[0] - xHalfW(0) - SIDEWALK };
  const edgeE = { x0: X_LINES[8] + xHalfW(8) + SIDEWALK, x1: WORLD_MAX - 3 };
  for (let j = 0; j < 8; j++) {
    const z0 = Z_LINES[j] + (j === 0 ? zHalfW(0) + SIDEWALK : SIDEWALK + 1), z1 = Z_LINES[j + 1] - SIDEWALK - 1;
    for (const e of [edgeW, edgeE]) {
      const d = districtAt((e.x0 + e.x1) / 2, (z0 + z1) / 2);
      if (j === 4) {
        blocks.push({ id: blockId++, x0: e.x0, x1: e.x1, z0, z1: CANAL_Z0 - 1.5, district: d, kind: "edge", surface: "concrete" });
        blocks.push({ id: blockId++, x0: e.x0, x1: e.x1, z0: CANAL_Z1 + 4.5, z1, district: d, kind: "edge", surface: "concrete" });
      } else blocks.push({ id: blockId++, x0: e.x0, x1: e.x1, z0, z1, district: d, kind: "edge", surface: "concrete" });
    }
  }
  blocks.push({ id: blockId++, x0: WORLD_MIN + 3, x1: WORLD_MAX - 3, z0: Z_LINES[8] + zHalfW(8) + SIDEWALK, z1: WORLD_MAX - 3, district: "lantern", kind: "edge", surface: "dirt" });

  // ---- buildings
  let bId = 0;
  const reservedHit = (r: Rect) => RESERVED.some((q) => rectsOverlap(q, r, 1.5)) || interiors.some((q) => rectsOverlap(q, r, 2));
  const viaductHit = (r: Rect) => r.z0 < VIADUCT_Z + 1.2 && r.z1 > VIADUCT_Z - 1.2;
  const addBuilding = (r: Rect, h: number, style: BuildingStyle, d: DistrictId, landmark?: string) => {
    if (r.x1 - r.x0 < 3 || r.z1 - r.z0 < 3) return;
    if (reservedHit(r)) return;
    if (r.z1 > CANAL_Z0 - 1 && r.z0 < CANAL_Z1 + 4) return;
    const fh = footprintHeights(r);
    const pal = PALETTES[d];
    const color = rng.pick(pal);
    const roofTone = style === "glass" ? [0.35, 0.38, 0.42] : style === "industrial" || style === "shed" ? [0.45, 0.47, 0.5] : [0.55, 0.42, 0.36];
    const b: Building = {
      ...r, id: bId++, baseY: fh.min - 0.5, topY: fh.max + h, style, color: [...color] as any,
      roof: roofTone as any, cell: cellIndexOf((r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2), landmark,
    };
    buildings.push(b);
    colliders.push({ x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1, y0: b.baseY, y1: b.topY, kind: "building" });
  };

  const styleFor = (d: DistrictId, k: BlockKind): BuildingStyle =>
    k === "towers" ? "glass" : d === "foundry" ? "industrial" : d === "breakwater" ? "shed" : d === "lantern" ? "house" : d === "canal" ? "brick" : d === "glassline" ? "glass" : "deco";

  const fillPerimeter = (bl: Rect, d: DistrictId, style: BuildingStyle, depth: [number, number], width: [number, number], hr: [number, number], alley: number) => {
    const W = bl.x1 - bl.x0, D = bl.z1 - bl.z0;
    const maxDepth = Math.min(depth[1], D / 2 - 3, W / 2 - 3);
    if (maxDepth < 5) {
      addBuilding({ x0: bl.x0 + 0.5, x1: bl.x1 - 0.5, z0: bl.z0 + 0.5, z1: bl.z1 - 0.5 }, rng.range(hr[0], hr[1]), style, d);
      return;
    }
    const dN = rng.range(Math.min(depth[0], maxDepth), maxDepth);
    const dS = rng.range(Math.min(depth[0], maxDepth), maxDepth);
    const dW = rng.range(Math.min(depth[0], maxDepth), maxDepth);
    const dE = rng.range(Math.min(depth[0], maxDepth), maxDepth);
    let forcedAlley = false;
    const strip = (a0: number, a1: number, place: (s0: number, s1: number) => void, allowAlley: boolean) => {
      let c = a0;
      while (c < a1 - 2) {
        let w = rng.range(width[0], width[1]);
        if (c + w > a1 - width[0] * 0.6) w = a1 - c;
        place(c, c + w);
        c += w;
        if (allowAlley && c < a1 - width[0] && (rng.chance(alley) || !forcedAlley)) {
          c += rng.range(3.6, 5.2);
          forcedAlley = true;
        }
      }
    };
    strip(bl.x0, bl.x1, (s0, s1) => addBuilding({ x0: s0 + 0.3, x1: s1 - 0.3, z0: bl.z1 - dN, z1: bl.z1 - 0.5 }, rng.range(hr[0], hr[1]), style, d), true);
    strip(bl.x0, bl.x1, (s0, s1) => addBuilding({ x0: s0 + 0.3, x1: s1 - 0.3, z0: bl.z0 + 0.5, z1: bl.z0 + dS }, rng.range(hr[0], hr[1]), style, d), true);
    strip(bl.z0 + dS + 4, bl.z1 - dN - 4, (s0, s1) => addBuilding({ x0: bl.x0 + 0.5, x1: bl.x0 + dW, z0: s0 + 0.3, z1: s1 - 0.3 }, rng.range(hr[0], hr[1]), style, d), true);
    strip(bl.z0 + dS + 4, bl.z1 - dN - 4, (s0, s1) => addBuilding({ x0: bl.x1 - dE, x1: bl.x1 - 0.5, z0: s0 + 0.3, z1: s1 - 0.3 }, rng.range(hr[0], hr[1]), style, d), true);
    return { x0: bl.x0 + dW, x1: bl.x1 - dE, z0: bl.z0 + dS, z1: bl.z1 - dN };
  };

  const courtyard = (c: Rect, d: DistrictId) => {
    // Trees, benches, parked-car spots are decided by traffic module from these.
    const n = Math.floor(((c.x1 - c.x0) * (c.z1 - c.z0)) / 500);
    for (let k = 0; k < n; k++) {
      const x = rng.range(c.x0 + 3, c.x1 - 3), z = rng.range(c.z0 + 3, c.z1 - 3);
      if (RESERVED.some((q) => rectContains(q, x, z, 2))) continue;
      const t = rng.next();
      if (t < 0.5) addProp({ type: "tree", x, z, yaw: rng.range(0, 6.28), breakable: false });
      else if (t < 0.7) addProp({ type: "bench", x, z, yaw: rng.pick([0, Math.PI / 2]), breakable: true });
      else if (t < 0.85) addProp({ type: "planter", x, z, yaw: 0, breakable: false });
      else addProp({ type: "crate", x, z, yaw: rng.range(0, 1.5), breakable: true });
    }
  };

  for (const bl of blocks) {
    const d = bl.district;
    const style = styleFor(d, bl.kind);
    const inner = { x0: bl.x0 + 1, x1: bl.x1 - 1, z0: bl.z0 + 1, z1: bl.z1 - 1 };
    if (viaductHit(inner) && bl.z1 > VIADUCT_Z && bl.z0 < VIADUCT_Z) {
      // keep footprints off the viaduct pillar line (blocks start just south of it)
    }
    if (bl.z0 < VIADUCT_Z + 2 && bl.z0 > VIADUCT_Z - 4) inner.z0 = Math.max(inner.z0, VIADUCT_Z + 1.6);
    switch (bl.kind) {
      case "plaza": break;
      case "park": break;
      case "towers": {
        const W = inner.x1 - inner.x0, D = inner.z1 - inner.z0;
        const nx = W > 60 ? 2 : 1, nz = D > 60 ? 2 : 1;
        for (let a = 0; a < nx; a++) for (let b = 0; b < nz; b++) {
          const cw = W / nx, cd = D / nz;
          const tw = rng.range(cw * 0.55, cw * 0.8), td = rng.range(cd * 0.55, cd * 0.8);
          const cx = inner.x0 + cw * (a + 0.5) + rng.range(-3, 3), cz = inner.z0 + cd * (b + 0.5) + rng.range(-3, 3);
          const isSpire = rectContains(inner, 250, -55) && a === 0 && b === 0;
          const h = isSpire ? 118 : rng.range(28, 82);
          addBuilding({ x0: cx - tw / 2, x1: cx + tw / 2, z0: cz - td / 2, z1: cz + td / 2 }, h, "glass", d, isSpire ? "Meridian Spire" : undefined);
        }
        courtyard(inner, d);
        break;
      }
      case "warehouse": {
        const W = inner.x1 - inner.x0, D = inner.z1 - inner.z0;
        const n = W > 120 ? 3 : 2;
        for (let a = 0; a < n; a++) {
          const cw = W / n;
          const w = rng.range(cw * 0.6, cw * 0.85), dd = rng.range(D * 0.4, D * 0.6);
          const cx = inner.x0 + cw * (a + 0.5), cz = rng.chance(0.5) ? inner.z0 + dd / 2 + 2 : inner.z1 - dd / 2 - 2;
          addBuilding({ x0: cx - w / 2, x1: cx + w / 2, z0: cz - dd / 2, z1: cz + dd / 2 }, rng.range(9, 14), "industrial", d);
        }
        // yard crates & barriers
        for (let k = 0; k < 10; k++) {
          const x = rng.range(inner.x0 + 4, inner.x1 - 4), z = rng.range(inner.z0 + 4, inner.z1 - 4);
          if (buildings.some((b) => rectContains(b, x, z, 2.5)) || RESERVED.some((q) => rectContains(q, x, z, 1)) || interiors.some((q) => rectContains(q, x, z, 3))) continue;
          addProp({ type: rng.chance(0.7) ? "crate" : "barrier", x, z, yaw: rng.range(0, 3), breakable: true });
        }
        break;
      }
      case "docks": {
        // container stacks in rows, plus sheds
        const W = inner.x1 - inner.x0;
        for (let x = inner.x0 + 6; x < inner.x1 - 6; x += 8.5) {
          for (let z = inner.z0 + 8; z < inner.z1 - 8; z += 16) {
            if (rng.chance(0.25)) continue;
            const cx = x, cz = z;
            if (RESERVED.some((q) => rectContains(q, cx, cz, 5)) || interiors.some((q) => rectContains(q, cx, cz, 6))) continue;
            const stack = rng.int(1, 3);
            const p = addProp({ type: "container", x: cx, z: cz, yaw: 0, breakable: false, color: rng.pick(CONTAINER_COLORS), stack });
            colliders.push({ x0: cx - 1.25, x1: cx + 1.25, z0: cz - 6.1, z1: cz + 6.1, y0: p.y - 0.2, y1: p.y + 2.6 * stack, kind: "container" });
          }
        }
        if (W > 40 && rng.chance(0.6)) addProp({ type: "crane", x: (inner.x0 + inner.x1) / 2, z: inner.z0 + 6, yaw: 0, breakable: false });
        break;
      }
      case "houses": {
        const c = fillPerimeter(inner, d, "house", [9, 13], [8, 13], [6, 12], 0.25);
        if (c) courtyard(c, d);
        break;
      }
      case "edge": {
        // skyline wall: deep buildings, no courtyard
        const W = inner.x1 - inner.x0, D = inner.z1 - inner.z0;
        if (W < D) {
          let z = inner.z0;
          while (z < inner.z1 - 6) {
            const w = Math.min(rng.range(12, 26), inner.z1 - z);
            addBuilding({ x0: inner.x0, x1: inner.x1, z0: z + 0.3, z1: z + w - 0.3 }, rng.range(10, 34), styleFor(d, "buildings"), d);
            z += w;
          }
        } else {
          let x = inner.x0;
          while (x < inner.x1 - 6) {
            const w = Math.min(rng.range(12, 26), inner.x1 - x);
            addBuilding({ x0: x + 0.3, x1: x + w - 0.3, z0: inner.z0, z1: inner.z1 }, rng.range(10, 30), "house", d);
            x += w;
          }
        }
        break;
      }
      default: {
        const hr: [number, number] = d === "tide" ? [9, 19] : d === "canal" ? [9, 16] : [8, 22];
        const c = fillPerimeter(inner, d, style, [12, 18], [10, 20], hr, 0.3);
        if (c) courtyard(c, d);
      }
    }
  }

  // ---- authored interiors: wall colliders (doors are gaps)
  for (const it of interiors) {
    const fh = footprintHeights(it);
    it.baseY = fh.min;
    const t = 0.35;
    const y0 = it.baseY - 0.5, y1 = it.baseY + it.h;
    const wallSeg = (side: Door["side"]) => {
      const horizontal = side === "n" || side === "s";
      const a0 = horizontal ? it.x0 : it.z0, a1 = horizontal ? it.x1 : it.z1;
      const fixed = side === "n" ? it.z1 : side === "s" ? it.z0 : side === "e" ? it.x1 : it.x0;
      const gaps = it.doors.filter((d) => d.side === side).map((d) => {
        const mid = (a0 + a1) / 2 + d.offset;
        return [mid - d.width / 2, mid + d.width / 2] as [number, number];
      }).sort((a, b) => a[0] - b[0]);
      let c = a0;
      const segs: [number, number][] = [];
      for (const g of gaps) { if (g[0] > c) segs.push([c, g[0]]); c = g[1]; }
      if (c < a1) segs.push([c, a1]);
      for (const s of segs) {
        if (horizontal) colliders.push({ x0: s[0], x1: s[1], z0: fixed - t / 2, z1: fixed + t / 2, y0, y1, kind: "wall", interior: it.id });
        else colliders.push({ x0: fixed - t / 2, x1: fixed + t / 2, z0: s[0], z1: s[1], y0, y1, kind: "wall", interior: it.id });
      }
    };
    (["n", "s", "e", "w"] as const).forEach(wallSeg);
    for (const p of it.partitions) colliders.push({ ...p, y0, y1, kind: "wall", interior: it.id });
  }

  // interior furniture doubles as cover
  for (const [x, z] of [[-320, -152], [-312, -144], [-305, -160], [-300, -152], [-293, -140], [-283, -150], [-316, -141]]) colliders.push({ x0: x - 1.2, x1: x + 1.2, z0: z - 1.2, z1: z + 1.2, y0: -0.5, y1: 1.25, kind: "prop", thin: true });
  colliders.push({ x0: 241, x1: 248, z0: -320.5, z1: -319.5, y0: -0.5, y1: 1.0, kind: "prop" });
  colliders.push({ x0: 26, x1: 34, z0: -125.5, z1: -124.6, y0: -0.5, y1: 1.05, kind: "prop" });

  // ---- street furniture along sidewalks
  for (let i = 0; i < 9; i++) for (let j = 0; j < 8; j++) {
    if (!hasEdgeNS(i, j)) continue;
    const X = X_LINES[i], off = xHalfW(i) + SIDEWALK - 0.9;
    for (let z = Z_LINES[j] + 18; z < Z_LINES[j + 1] - 14; z += 32) {
      if (inCanal(X, z) || (z > CANAL_Z0 - 2 && z < CANAL_Z1 + 2)) continue;
      for (const s of [-1, 1]) {
        const x = X + s * off;
        if (RESERVED.some((q) => rectContains(q, x, z, 0.5)) && rng.chance(0.5)) continue;
        addProp({ type: "lamp", x, z, yaw: s > 0 ? -Math.PI / 2 : Math.PI / 2, breakable: true });
        if (rng.chance(0.35)) addProp({ type: rng.chance(0.6) ? "bin" : "hydrant", x, z: z + 6, yaw: 0, breakable: true });
      }
    }
  }
  for (let j = 0; j < 9; j++) for (let i = 0; i < 8; i++) {
    if (!hasEdgeEW(i, j)) continue;
    const Z = Z_LINES[j], off = zHalfW(j) + SIDEWALK - 0.9;
    for (let x = X_LINES[i] + 18; x < X_LINES[i + 1] - 14; x += 32) {
      for (const s of [-1, 1]) {
        const z = Z + s * off;
        if (j === 0 && s < 0) continue; // seawall side handled below
        if (Math.abs(z - VIADUCT_Z) < 1.5) continue;
        addProp({ type: "lamp", x, z, yaw: s > 0 ? Math.PI : 0, breakable: true });
        if (rng.chance(0.3)) addProp({ type: rng.chance(0.5) ? "bin" : "bench", x: x + 7, z, yaw: s > 0 ? Math.PI : 0, breakable: true });
      }
    }
  }
  // seawall promenade
  for (let x = -440; x < 440; x += 22) {
    addProp({ type: "lamp", x, z: QUAY_Z + 2.5, yaw: 0, breakable: true });
    if (!onPier(x, QUAY_Z - 1)) addProp({ type: "bollard", x: x + 11, z: QUAY_Z + 0.8, yaw: 0, breakable: false });
    if (rng.chance(0.4)) addProp({ type: "bench", x: x + 6, z: QUAY_Z + 5, yaw: Math.PI, breakable: true });
  }
  // canal railings (gaps at bridges), bike path lamps
  {
    let runStart: number | null = null;
    const flush = (endX: number) => {
      if (runStart === null) return;
      for (const zz of [CANAL_Z0 - 0.15, CANAL_Z1 + 0.15]) colliders.push({ x0: runStart, x1: endX, z0: zz - 0.12, z1: zz + 0.12, y0: -0.5, y1: 1.05, kind: "rail" });
      runStart = null;
    };
    for (let x = WORLD_MIN; x <= WORLD_MAX; x += 1) {
      const br = isBridgeX(x);
      if (!br && runStart === null) runStart = x;
      if (br && runStart !== null) flush(x);
    }
    flush(WORLD_MAX);
    for (let i = 0; i < 9; i++) {
      if (!hasEdgeNS(i, 4)) continue;
      const X = X_LINES[i], hw = xHalfW(i) + SIDEWALK;
      for (const s of [-1, 1]) colliders.push({ x0: X + s * hw - 0.15, x1: X + s * hw + 0.15, z0: CANAL_Z0, z1: CANAL_Z1, y0: -0.5, y1: 1.05, kind: "rail" });
    }
    for (let x = -440; x < 440; x += 26) if (!isBridgeX(x)) addProp({ type: "lamp", x, z: CANAL_Z1 + 3.6, yaw: Math.PI, breakable: true });
  }
  // viaduct pillars along the tram line
  for (let x = -440; x <= 440; x += 25) {
    if (Math.abs(x - X_LINES.reduce((a, b) => (Math.abs(b - x) < Math.abs(a - x) ? b : a))) < 9) continue;
    colliders.push({ x0: x - 0.6, x1: x + 0.6, z0: VIADUCT_Z - 0.6, z1: VIADUCT_Z + 0.6, y0: -1, y1: VIADUCT_H + 1.2, kind: "pillar" });
  }

  // ---- Tide Market plaza: stalls, clock tower, trees
  const plaza = blocks.find((b) => b.kind === "plaza" && b.z0 < -200)!;
  {
    const px0 = -90, px1 = -14, pz0 = -270, pz1 = -114;
    for (let row = 0; row < 3; row++) {
      for (let k = 0; k < 6; k++) {
        const x = px0 + 8 + k * 11.5, z = -232 + row * 12;
        if (Math.abs(x + 52) < 8 && Math.abs(z + 192) < 9) continue;
        if (k === 3 && row === 1) continue;
        addProp({ type: "stall", x, z, yaw: row % 2 ? Math.PI : 0, breakable: false, color: rng.pick(PALETTES.tide) });
        colliders.push({ x0: x - 1.6, x1: x + 1.6, z0: z - 1.1, z1: z + 1.1, y0: 0, y1: 2.6, kind: "prop", thin: true });
      }
    }
    for (let k = 0; k < 14; k++) {
      const x = rng.range(px0 + 2, px1 - 2), z = rng.chance(0.5) ? rng.range(pz0 + 2, -245) : rng.range(-168, pz1 - 2);
      if (RESERVED.some((q) => rectContains(q, x, z, 2)) || interiors.some((q) => rectContains(q, x, z, 3))) continue;
      if (Math.abs(x + 80) < 5 && Math.abs(z + 125) < 5) continue;
      addProp({ type: rng.chance(0.55) ? "tree" : "bench", x, z, yaw: rng.pick([0, Math.PI / 2, Math.PI]), breakable: rng.chance(0.5) });
    }
    // clock tower (landmark)
    const cr = { x0: -55, x1: -49, z0: -195, z1: -189 };
    addBuilding(cr, 26, "deco", "tide", "Tide Clock");
    void plaza;
  }
  // viewpoint park
  for (let k = 0; k < 24; k++) {
    const x = rng.range(-385, -215), z = rng.range(300, 375);
    if (Math.abs(x + 340) < 12 && Math.abs(z - 340) < 12) continue;
    addProp({ type: "tree", x, z, yaw: rng.range(0, 6), breakable: false });
  }
  addBuilding({ x0: -342.5, x1: -337.5, z0: 337.5, z1: 342.5 }, 22, "deco", "lantern", "The Lantern");
  // lighthouse on the breakwater pier
  addBuildingRaw(buildings, colliders, { x0: 147, x1: 153, z0: -443, z1: -437 }, -0.5, 30, "deco", [0.95, 0.95, 0.92], "Breakwater Light");
  // piers: container dock cranes
  addProp({ type: "crane", x: -300, z: -425, yaw: 0, breakable: false });
  addProp({ type: "crane", x: -60, z: -398, yaw: Math.PI / 2, breakable: false });
  for (let k = 0; k < 6; k++) {
    const p = addProp({ type: "container", x: -322 + (k % 3) * 8, z: -415 - Math.floor(k / 3) * 15, yaw: 0, breakable: false, color: rng.pick(CONTAINER_COLORS), stack: rng.int(1, 2) });
    colliders.push({ x0: p.x - 1.25, x1: p.x + 1.25, z0: p.z - 6.1, z1: p.z + 6.1, y0: p.y - 0.2, y1: p.y + 2.6 * (p.stack ?? 1), kind: "container" });
  }
  // crane leg colliders
  for (const p of props) if (p.type === "crane") {
    const legs = p.yaw === 0 ? [[-6, -4], [6, -4], [-6, 4], [6, 4]] : [[-4, -6], [4, -6], [-4, 6], [4, 6]];
    for (const [lx, lz] of legs) colliders.push({ x0: p.x + lx - 0.5, x1: p.x + lx + 0.5, z0: p.z + lz - 0.5, z1: p.z + lz + 0.5, y0: -1, y1: 30, kind: "pillar" });
  }
  // freight shed yard props & fence, police lot barriers, garage props
  for (let k = 0; k < 8; k++) addProp({ type: "crate", x: -335 + k * 4.5, z: -175, yaw: 0, breakable: true });
  for (let k = 0; k < 4; k++) addProp({ type: "cone", x: -150 + k * 2.2 - 3, z: -352, yaw: 0, breakable: true });
  for (let k = 0; k < 5; k++) addProp({ type: "barrier", x: 268 + k * 4, z: -134, yaw: 0, breakable: true });

  // trees / props: static colliders for non-breakables
  for (const p of props) {
    if (p.type === "tree") colliders.push({ x0: p.x - 0.35, x1: p.x + 0.35, z0: p.z - 0.35, z1: p.z + 0.35, y0: p.y - 0.5, y1: p.y + 6, kind: "tree" });
    if (p.type === "planter") colliders.push({ x0: p.x - 1, x1: p.x + 1, z0: p.z - 1, z1: p.z + 1, y0: p.y - 0.3, y1: p.y + 0.7, kind: "prop" });
    if (p.type === "bollard") colliders.push({ x0: p.x - 0.25, x1: p.x + 0.25, z0: p.z - 0.25, z1: p.z + 0.25, y0: p.y - 0.3, y1: p.y + 0.9, kind: "prop" });
  }

  // world bounds
  const B = 4;
  colliders.push({ x0: WORLD_MIN - B, x1: WORLD_MIN, z0: WORLD_MIN - B, z1: WORLD_MAX + B, y0: -20, y1: 200, kind: "bound" });
  colliders.push({ x0: WORLD_MAX, x1: WORLD_MAX + B, z0: WORLD_MIN - B, z1: WORLD_MAX + B, y0: -20, y1: 200, kind: "bound" });
  colliders.push({ x0: WORLD_MIN - B, x1: WORLD_MAX + B, z0: WORLD_MAX, z1: WORLD_MAX + B, y0: -20, y1: 200, kind: "bound" });
  colliders.push({ x0: WORLD_MIN - B, x1: WORLD_MAX + B, z0: WORLD_MIN - B, z1: WORLD_MIN, y0: -20, y1: 200, kind: "bound" });

  const interacts: InteractPoint[] = [
    { id: "rest", kind: "rest", x: -59, z: 78, r: 1.8, label: "Rest & save", interior: "safehouse" },
    { id: "board", kind: "board", x: -51, z: 78, r: 1.8, label: "Mission board (replay)", interior: "safehouse" },
    { id: "locker", kind: "locker", x: -60, z: 85.5, r: 1.8, label: "Gear locker", interior: "safehouse" },
    { id: "shop", kind: "shop", x: 30, z: -124, r: 2.2, label: "Harbor Supply counter", interior: "store" },
    { id: "kiosk", kind: "kiosk", x: -30, z: -255.5, r: 2.2, label: "Tidewear — change outfit", interior: "kiosk" },
    { id: "repair", kind: "repair", x: -150, z: -340, r: 5, label: "Breakwater Repair bay", interior: "garage" },
    { id: "police", kind: "police", x: 250, z: -127, r: 2.2, label: "Police lobby — pay impound & fines", interior: "police" },
    { id: "contact_mara", kind: "contact", x: -80, z: -125, r: 2.4, label: "Talk to Mara (Quayside Couriers)" },
    { id: "contact_ines", kind: "contact", x: 114, z: 58.3, r: 2.4, label: "Talk to Ines Calder" },
    { id: "viewpoint", kind: "viewpoint", x: -330, z: 333, r: 6, label: "Lantern viewpoint" },
  ];

  const landmarks: Landmark[] = [
    { id: "clock", name: "Tide Clock", x: -52, z: -192, district: "tide" },
    { id: "lantern", name: "The Lantern", x: -340, z: 340, district: "lantern" },
    { id: "light", name: "Breakwater Light", x: 150, z: -440, district: "breakwater" },
    { id: "spire", name: "Meridian Spire", x: 250, z: 40, district: "glassline" },
    { id: "shed4", name: "Freight Shed 4", x: -300, z: -150, district: "foundry" },
    { id: "cranes", name: "Pier Cranes", x: -300, z: -425, district: "breakwater" },
    { id: "canal", name: "Canal Loop Bridges", x: 0, z: 50, district: "canal" },
  ];

  const spire = buildings.find((b) => b.landmark === "Meridian Spire");
  if (spire) { const l = landmarks.find((q) => q.id === "spire")!; l.x = (spire.x0 + spire.x1) / 2; l.z = (spire.z0 + spire.z1) / 2; }

  const spawns: District["spawns"] = {
    safehouse: { x: -55, z: 81, yaw: 0 },
    safehouseYard: { x: -55, z: 93, yaw: 0 },
    motoSpot: { x: -47, z: 96, yaw: Math.PI / 2 },
    garageSlot: { x: -64, z: 97, yaw: Math.PI / 2 },
    precinct: { x: 250, z: -112, yaw: 0 },
    hospital: { x: -55, z: 93, yaw: 0 },
  };

  return { blocks, buildings, props, colliders, interiors, interacts, landmarks, reserved: RESERVED, spawns };
}

function addBuildingRaw(buildings: Building[], colliders: Collider[], r: Rect, baseY: number, h: number, style: BuildingStyle, color: [number, number, number], landmark?: string) {
  buildings.push({ ...r, id: buildings.length + 10000, baseY, topY: baseY + h, style, color, roof: [0.8, 0.25, 0.2], cell: cellIndexOf((r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2), landmark });
  colliders.push({ ...r, y0: baseY, y1: baseY + h, kind: "building" });
}

function hasEdgeNSAny(i: number, j: number) {
  // Is there a N-S road at line i along block row j?
  return hasEdgeNS(i, j);
}
function hasEdgeEWAny(i: number, j: number) {
  return hasEdgeEW(i, j);
}

let cached: District | null = null;
export function getDistrict(): District {
  if (!cached) cached = generateDistrict();
  return cached;
}

/** Surface material for vehicles/footsteps. */
export function surfaceAt(d: District, x: number, z: number): Surface {
  if (waterSurfaceAt(x, z) !== null) return "water";
  const r = roadAt(x, z);
  if (r.onRoad) return "asphalt";
  if (r.onSidewalk) return "concrete";
  if (z < QUAY_Z + 0.5 && onPier(x, z)) return "metal";
  for (const b of d.blocks) if (rectContains(b, x, z)) return b.surface;
  return "concrete";
}
