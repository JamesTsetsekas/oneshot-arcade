// Relay Station K-17: original fictional island communications facility, ~115 x 95 m.
// Authored as a 1 m cell grid for the west half and mirrored across x=0 so both teams are balanced.
// Output: collision boxes (also used by the renderer), spawn points, nav hints. Pure data; no rendering imports.
import type { Vec3 } from "../math";
import { Rng } from "../math";

export type Mat = "concrete" | "metal" | "glass" | "wood" | "thin" | "rock" | "rail";
export type BoxKind =
  | "wall" | "roof" | "cover" | "glass" | "sill" | "lintel" | "step" | "platform" | "post" | "rail" | "sea" | "pedestal" | "ridge";
export type CoverStyle = "barrier" | "crate" | "container" | "pipes" | "console" | "sheet" | "bench";

export interface MapBox {
  id: number;
  min: Vec3;
  max: Vec3;
  mat: Mat;
  /** energy cost per metre of material for bullet penetration. Infinity = solid. */
  cost: number;
  noRay: boolean; // blocks movement but not bullets (invisible boundary)
  noMove?: boolean; // blocks bullets only (reserved)
  invisible: boolean;
  kind: BoxKind;
  style?: CoverStyle;
  side: -1 | 0 | 1; // -1 west, +1 east, 0 centre (renderer dressing)
  breakable?: boolean;
  alive: boolean;
  mantle: boolean; // valid mantle target (computed)
  indoor?: boolean;
}

export interface SpawnPoint {
  id: number;
  team: 0 | 1;
  pos: Vec3;
  yaw: number;
  group: "home" | "hall" | "lane";
}

export const MAP_W = 115;
export const MAP_H = 95;
export const MAP_MIN_X = -57.5;
export const MAP_MIN_Z = -47.5;
export const SEA_Z = -36.5; // south limit of playable ground

export const PEN_COST: Record<Mat, number> = { concrete: Infinity, rock: Infinity, metal: 1.3, wood: 0.7, thin: 0.3, glass: 0.06, rail: 0 };

export interface DecorLight { x: number; y: number; z: number; w: number; d: number; color: string }
export interface MapData {
  boxes: MapBox[];
  spawns: SpawnPoint[];
  decorLights: DecorLight[];
  indoorAt(x: number, z: number): boolean;
  /** grid helper: true when 1 m cell holds a full-height solid. */
  solidAt(x: number, z: number): boolean;
  holdHints: Array<{ x: number; z: number; yaw: number; lane: "N" | "C" | "S" | "W" }>;
  routeGoals: Array<{ x: number; z: number; lane: "N" | "C" | "S"; weight: number }>;
  windows: Array<{ id: number }>;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
}

const GW = MAP_W;
const GH = MAP_H;
const ci = (x: number) => Math.round(x) + 57;
const cj = (z: number) => Math.round(z) + 47;

export function buildK17(): MapData {
  // cell classes: 0 solid wall h5, 1 outdoor walkable, 2 indoor walkable, 3 rail, 4 sea, 5 window, 6 ridge(h7), 7 pedestal(h3.2)
  const cls = new Uint8Array(GW * GH).fill(0);
  const idx = (i: number, j: number) => j * GW + i;
  const paint = (x1: number, z1: number, x2: number, z2: number, v: number, mirror = true) => {
    for (let x = x1; x <= x2; x++) for (let z = z1; z <= z2; z++) {
      const i = ci(x), j = cj(z);
      if (i >= 0 && i < GW && j >= 0 && j < GH) cls[idx(i, j)] = v;
      if (mirror) {
        const i2 = GW - 1 - i;
        if (i2 >= 0 && i2 < GW) cls[idx(i2, j)] = v;
      }
    }
  };
  const OUT = 1, IN = 2;

  // ---- sea band & ridge
  paint(-57, -47, 57, -37, 4, false);
  paint(-57, 39, 57, 47, 6, false);
  // ---- west operations wing / spawn room (indoor)
  paint(-56, -8, -48, 8, IN);
  paint(-47, 5, -45, 7, IN); // north spawn exit (offset from the control-room axis: no straight sightline into spawn)
  paint(-47, -7, -45, -5, IN); // south spawn exit
  // ops hall
  paint(-44, -26, -38, 26, IN);
  paint(-44, 5, -44, 7, IN);
  paint(-44, -7, -44, -5, IN);
  // hall baffles (solid)
  paint(-44, 10, -42, 11, 0);
  paint(-40, -11, -38, -10, 0);
  paint(-44, 17, -43, 18, 0);
  paint(-44, 3, -43, 4, 0);
  paint(-44, -4, -43, -3, 0);
  paint(-39, -19, -38, -18, 0);
  // control room + doors
  paint(-36, -8, -30, 8, IN);
  paint(-37, -3, -37, 3, IN);
  paint(-29, -4, -29, 4, IN);
  // service tunnels
  paint(-37, 13, -29, 15, IN);
  paint(-37, -15, -29, -13, IN);
  // courtyard
  paint(-28, -18, 0, 18, OUT);
  // lanes
  paint(-44, 27, 0, 38, OUT); // north ridge lane
  paint(-44, -35, 0, -27, OUT); // south utility lane
  paint(-44, -36, 0, -36, 3, true); // sea rail row
  paint(-45, -36, -45, -36, 3, true);
  // hall <-> lanes (hall indoor ends at 26 / -26, lanes at 27 / -27)
  // connectors courtyard <-> lanes
  paint(-17, 19, -12, 26, OUT);
  paint(-17, -26, -12, -19, OUT);
  // dish pedestal (solid, low enough to see the dish above)
  paint(-2, -2, 0, 2, 7);
  // spawn baffles
  paint(-52, -1, -51, 1, 0);
  paint(-49, 4, -49, 5, 0);
  paint(-49, -5, -49, -4, 0);
  // windows between control room and courtyard
  paint(-29, 5, -29, 7, 5);
  paint(-29, -7, -29, -5, 5);

  const get = (i: number, j: number) => (i < 0 || j < 0 || i >= GW || j >= GH ? 0 : cls[idx(i, j)]);
  const isWalk = (c: number) => c === 1 || c === 2;

  const boxes: MapBox[] = [];
  let nextId = 1;
  const add = (b: Partial<MapBox> & { min: Vec3; max: Vec3; mat: Mat; kind: BoxKind }): MapBox => {
    const box: MapBox = {
      id: nextId++, noRay: false, invisible: false, side: 0, alive: true, mantle: false, cost: PEN_COST[b.mat], ...b,
    } as MapBox;
    box.side = (box.min.x + box.max.x) / 2 < -0.5 ? -1 : (box.min.x + box.max.x) / 2 > 0.5 ? 1 : 0;
    boxes.push(box);
    return box;
  };

  // ---- greedy merge helper over grid
  const visited = new Uint8Array(GW * GH);
  const greedy = (match: (c: number) => boolean, emit: (i0: number, j0: number, i1: number, j1: number) => void) => {
    visited.fill(0);
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
      if (visited[idx(i, j)] || !match(get(i, j))) continue;
      let i1 = i;
      while (i1 + 1 < GW && !visited[idx(i1 + 1, j)] && match(get(i1 + 1, j))) i1++;
      let j1 = j;
      outer: while (j1 + 1 < GH) {
        for (let x = i; x <= i1; x++) if (visited[idx(x, j1 + 1)] || !match(get(x, j1 + 1))) break outer;
        j1++;
      }
      for (let y = j; y <= j1; y++) for (let x = i; x <= i1; x++) visited[idx(x, y)] = 1;
      emit(i, j, i1, j1);
    }
  };
  const cellMin = (i: number, j: number) => ({ x: i - 57.5, z: j - 47.5 });

  // solid walls (class 0). Only emit cells adjacent to something walkable-ish to avoid hidden mass; keep full mass for collision simplicity.
  greedy((c) => c === 0, (i0, j0, i1, j1) => {
    const a = cellMin(i0, j0), b = cellMin(i1 + 1, j1 + 1);
    add({ min: { x: a.x, y: 0, z: a.z }, max: { x: b.x, y: 5, z: b.z }, mat: "concrete", kind: "wall" });
  });
  greedy((c) => c === 6, (i0, j0, i1, j1) => {
    const a = cellMin(i0, j0), b = cellMin(i1 + 1, j1 + 1);
    add({ min: { x: a.x, y: 0, z: a.z }, max: { x: b.x, y: 7.5, z: b.z }, mat: "rock", kind: "ridge" });
  });
  greedy((c) => c === 7, (i0, j0, i1, j1) => {
    const a = cellMin(i0, j0), b = cellMin(i1 + 1, j1 + 1);
    add({ min: { x: a.x, y: 0, z: a.z }, max: { x: b.x, y: 3.2, z: b.z }, mat: "concrete", kind: "pedestal" });
  });
  greedy((c) => c === 4, (i0, j0, i1, j1) => {
    const a = cellMin(i0, j0), b = cellMin(i1 + 1, j1 + 1);
    add({ min: { x: a.x, y: -3, z: a.z }, max: { x: b.x, y: 8, z: b.z }, mat: "rail", kind: "sea", noRay: true, invisible: true });
  });
  greedy((c) => c === 3, (i0, j0, i1, j1) => {
    const a = cellMin(i0, j0), b = cellMin(i1 + 1, j1 + 1);
    add({ min: { x: a.x, y: 0, z: a.z }, max: { x: b.x, y: 8, z: b.z }, mat: "rail", kind: "rail", noRay: true });
  });
  // roofs over indoor cells
  greedy((c) => c === 2, (i0, j0, i1, j1) => {
    const a = cellMin(i0, j0), b = cellMin(i1 + 1, j1 + 1);
    add({ min: { x: a.x, y: 4.3, z: a.z }, max: { x: b.x, y: 5, z: b.z }, mat: "concrete", kind: "roof" });
  });
  // windows: sill + lintel + glass pane per contiguous run (all runs are 1 cell wide along x)
  const windows: Array<{ id: number }> = [];
  greedy((c) => c === 5, (i0, j0, i1, j1) => {
    const a = cellMin(i0, j0), b = cellMin(i1 + 1, j1 + 1);
    add({ min: { x: a.x, y: 0, z: a.z }, max: { x: b.x, y: 1.0, z: b.z }, mat: "concrete", kind: "sill" });
    add({ min: { x: a.x, y: 2.5, z: a.z }, max: { x: b.x, y: 5, z: b.z }, mat: "concrete", kind: "lintel" });
    const cx = (a.x + b.x) / 2;
    const g = add({ min: { x: cx - 0.08, y: 1.0, z: a.z }, max: { x: cx + 0.08, y: 2.5, z: b.z }, mat: "glass", kind: "glass", breakable: true });
    windows.push({ id: g.id });
  });

  // ---- cover and props authored in cell coords, mirrored
  const mirrorBox = (b: MapBox, spec: { style?: CoverStyle }) => {
    if (b.min.x <= 0 && b.max.x >= 0) {
      // spans centre: make symmetric
      const m = Math.max(Math.abs(b.min.x), Math.abs(b.max.x));
      b.min.x = -m; b.max.x = m;
      b.side = 0;
      return;
    }
    add({ min: { x: -b.max.x, y: b.min.y, z: b.min.z }, max: { x: -b.min.x, y: b.max.y, z: b.max.z }, mat: b.mat, kind: b.kind, style: spec.style, cost: b.cost, breakable: b.breakable, noRay: b.noRay });
  };
  const cover = (x1: number, z1: number, x2: number, z2: number, h: number, style: CoverStyle, mat: Mat = "concrete", y0 = 0, kind: BoxKind = "cover") => {
    const b = add({ min: { x: x1 - 0.5, y: y0, z: z1 - 0.5 }, max: { x: x2 + 0.5, y: y0 + h, z: z2 + 0.5 }, mat, kind, style });
    mirrorBox(b, { style });
    return b;
  };
  // courtyard
  cover(-18, -12, -18, -7, 1.1, "barrier");
  cover(-18, 7, -18, 12, 1.1, "barrier");
  cover(-12, -4, -11, -3, 1.2, "crate", "wood");
  cover(-12, 3, -11, 4, 1.2, "crate", "wood");
  cover(-8, -13, -5, -12, 2.5, "container", "metal");
  cover(-8, 12, -5, 13, 2.5, "container", "metal");
  cover(-9, -1, -8, 1, 1.1, "barrier");
  cover(-22, 0, -22, 1, 1.0, "crate", "wood");
  cover(-15, 16, -13, 16, 1.1, "barrier");
  cover(-15, -16, -13, -16, 1.1, "barrier");
  cover(-4, 8, -3, 9, 1.0, "crate", "wood");
  cover(-4, -9, -3, -8, 1.0, "crate", "wood");
  cover(-24, 10, -24, 13, 2.2, "sheet", "thin"); // thin penetrable panels
  cover(-24, -13, -24, -10, 2.2, "sheet", "thin");
  // control room consoles
  cover(-34, -6, -33, -5, 1.0, "console", "metal");
  cover(-34, 5, -33, 6, 1.0, "console", "metal");
  cover(-32, -1, -31, 1, 1.0, "console", "metal");
  // hall cover
  cover(-41, 20, -40, 20, 1.1, "barrier");
  cover(-42, -22, -41, -22, 1.1, "barrier");
  cover(-41, 0, -41, 0, 1.0, "crate", "wood");
  // spawn room benches
  cover(-55, -6, -54, -5, 1.0, "bench", "metal");
  cover(-55, 5, -54, 6, 1.0, "bench", "metal");
  // north lane: container baffles interrupt the long sightline
  cover(-36, 27, -35, 33, 2.6, "container", "metal");
  cover(-26, 33, -25, 38, 2.6, "container", "metal");
  cover(-9, 27, -8, 33, 2.6, "container", "metal");
  cover(-1, 33, 0, 38, 2.6, "container", "metal");
  cover(-31, 35, -30, 35, 1.1, "crate", "wood");
  cover(-20, 30, -19, 30, 1.1, "crate", "wood");
  cover(-14, 36, -12, 36, 1.1, "barrier");
  cover(-4, 30, -3, 30, 1.1, "crate", "wood");
  // south lane: pipe stacks alternate sides, low visibility short range
  cover(-39, -35, -38, -31, 3.0, "pipes", "metal");
  cover(-32, -31, -31, -27, 3.0, "pipes", "metal");
  cover(-25, -35, -24, -31, 3.0, "pipes", "metal");
  cover(-19, -31, -18, -28, 3.0, "pipes", "metal");
  cover(-10, -35, -9, -31, 3.0, "pipes", "metal");
  cover(-4, -31, -3, -27, 3.0, "pipes", "metal");
  cover(-28, -33, -28, -33, 1.0, "crate", "wood");
  cover(-14, -34, -13, -34, 1.0, "crate", "wood");

  // catwalk (west half: x -27..-23): stairs, platform, posts, rails (east mirrored)
  for (let k = 0; k < 8; k++) {
    const z0 = -17.5 + 0.5 * k;
    const h = 0.375 * (k + 1);
    const b = add({ min: { x: -26.5, y: 0, z: z0 }, max: { x: -23.5, y: h, z: z0 + 0.5 }, mat: "metal", kind: "step" });
    add({ min: { x: 23.5, y: 0, z: z0 }, max: { x: 26.5, y: h, z: z0 + 0.5 }, mat: "metal", kind: "step" });
    void b;
  }
  const platform = (x1: number, x2: number) => {
    add({ min: { x: x1, y: 2.8, z: -13.5 }, max: { x: x2, y: 3.0, z: -4.5 }, mat: "metal", kind: "platform" });
    for (const pz of [-13.3, -9, -4.7]) for (const px of [x1 + 0.2, x2 - 0.2]) add({ min: { x: px - 0.15, y: 0, z: pz - 0.15 }, max: { x: px + 0.15, y: 2.8, z: pz + 0.15 }, mat: "metal", kind: "post" });
    // rails (waist-high, on courtyard side and north end)
    const cx = x1 < 0 ? x2 : x1; // courtyard-facing edge
    add({ min: { x: cx - 0.08, y: 3.0, z: -13.5 }, max: { x: cx + 0.08, y: 4.0, z: -4.5 }, mat: "rail", kind: "rail", noRay: false, cost: 0.15 });
    add({ min: { x: x1, y: 3.0, z: -4.58 }, max: { x: x2, y: 4.0, z: -4.42 }, mat: "rail", kind: "rail", cost: 0.15 });
    const ox = x1 < 0 ? x1 : x2;
    add({ min: { x: ox - 0.08, y: 3.0, z: -13.5 }, max: { x: ox + 0.08, y: 4.0, z: -4.5 }, mat: "rail", kind: "rail", cost: 0.15 });
  };
  platform(-26.5, -23.5);
  platform(23.5, 26.5);

  // mark mantle-able boxes: top between 0.6 and 1.35 m
  for (const b of boxes) b.mantle = b.kind === "cover" && b.max.y >= 0.6 && b.max.y <= 1.35 && b.min.y === 0;

  // ---- spawns
  const spawns: SpawnPoint[] = [];
  let sid = 0;
  const addSpawn = (team: 0 | 1, x: number, z: number, group: SpawnPoint["group"]) => {
    const yaw = team === 0 ? Math.PI / 2 : -Math.PI / 2;
    spawns.push({ id: sid++, team, pos: { x: team === 0 ? x : -x, y: 0, z }, yaw, group });
  };
  const free = (x: number, z: number) => cls[idx(ci(x), cj(z))] === IN || cls[idx(ci(x), cj(z))] === OUT;
  const coverAt = (x: number, z: number) => boxes.some((b) => b.kind === "cover" && b.min.x - 0.5 < x && b.max.x + 0.5 > x && b.min.z - 0.5 < z && b.max.z + 0.5 > z);
  for (const team of [0, 1] as const) {
    for (let x = -55; x <= -49; x += 2) for (let z = -7; z <= 7; z += 2) {
      const px = team === 0 ? x : -x;
      if (free(x, z) && !coverAt(px, z)) addSpawn(team, x, z, "home");
    }
    for (let z = -22; z <= 22; z += 4) for (const x of [-42, -40]) {
      const px = team === 0 ? x : -x;
      if (free(x, z) && !coverAt(px, z)) addSpawn(team, x, z, "hall");
    }
    for (const [x, z] of [[-42, 30], [-40, 34], [-42, -30], [-40, -32]] as const) {
      if (free(x, z)) addSpawn(team, x, z, "lane");
    }
  }

  const decorLights: DecorLight[] = [];
  for (let x = -54; x <= -50; x += 4) decorLights.push({ x, y: 4.25, z: 0, w: 0.5, d: 6, color: "#dff6ff" });
  for (let z = -22; z <= 22; z += 8) decorLights.push({ x: -41, y: 4.25, z, w: 0.5, d: 3, color: "#dff6ff" });
  decorLights.push({ x: -33, y: 4.25, z: 0, w: 4, d: 0.5, color: "#ffe2b8" });
  const mirroredLights = decorLights.map((l) => ({ ...l, x: -l.x }));
  decorLights.push(...mirroredLights);

  const holdHints: MapData["holdHints"] = [];
  const routeGoals: MapData["routeGoals"] = [];
  const goal = (x: number, z: number, lane: "N" | "C" | "S", weight = 1) => {
    routeGoals.push({ x, z, lane, weight });
    routeGoals.push({ x: -x, z, lane, weight });
  };
  goal(-30, 32, "N"); goal(-14, 30, "N"); goal(-6, 36, "N", 0.6);
  goal(-30, -31, "S"); goal(-14, -30, "S"); goal(-6, -32, "S", 0.6);
  goal(-20, 0, "C", 1.2); goal(-10, 6, "C"); goal(-10, -6, "C"); goal(-14, 14, "C"); goal(-14, -14, "C");
  goal(-4, 0, "C", 0.5);

  const sol = (x: number, z: number) => {
    const c = get(ci(x), cj(z));
    return c === 0 || c === 6 || c === 7 || c === 3 || c === 4 || c === 5;
  };
  return {
    boxes, spawns, decorLights, holdHints, routeGoals, windows,
    indoorAt: (x, z) => get(ci(x), cj(z)) === IN,
    solidAt: (x, z) => sol(x, z),
    bounds: { minX: -57.5, maxX: 57.5, minZ: -36.5, maxZ: 38.5 },
  };
}

let cached: MapData | null = null;
export function getK17(): MapData {
  if (!cached) cached = buildK17();
  return cached;
}
export function freshK17(): MapData { return buildK17(); }
void Rng;
