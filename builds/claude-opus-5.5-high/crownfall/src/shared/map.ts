// The Broken Diadem — compact two-lane map. All authored in team-0 (Dawn, west) space;
// team-1 (Dusk, east) content is produced by 180° point rotation so travel/value metrics
// are equivalent without copying lane geometry (upper and lower lanes differ in shape).
import { V2, catmullRom, resample, distToPolyline, pointInPolygon, dist, smoothNoise, polylineLength, pointAlong } from './math';

export const MAP_VERSION = 'broken-diadem-1';
export const MAP_W = 150;
export const MAP_H = 115;
export const MAP_MIN_X = -75;
export const MAP_MIN_Y = -57.5;
export const NAV_CELL = 0.5;
export const NAV_W = MAP_W / NAV_CELL; // 300
export const NAV_H = MAP_H / NAV_CELL; // 230
export const FOG_CELL = 1;
export const FOG_W = MAP_W / FOG_CELL; // 150
export const FOG_H = Math.ceil(MAP_H / FOG_CELL); // 115

export const LANE_HALF = 5;
export const ISLAND_MARGIN = 7;

export const rot = (p: V2): V2 => ({ x: -p.x, y: -p.y });
export type Team = 0 | 1;
export const NEUTRAL = 2;

const TOP_CTRL: V2[] = [
  { x: -58, y: -3 }, { x: -55, y: -11 }, { x: -56, y: -26 }, { x: -46, y: -41 }, { x: -28, y: -48 }, { x: -6, y: -50 },
  { x: 16, y: -48 }, { x: 36, y: -44 }, { x: 50, y: -34 }, { x: 56, y: -20 }, { x: 55, y: -11 }, { x: 58, y: -3 },
];
const BOT_CTRL: V2[] = TOP_CTRL.slice().reverse().map(rot);

/** Lane polylines from team 0 base to team 1 base, sampled every 1 m. */
export const LANES: V2[][] = [resample(catmullRom(TOP_CTRL, 20), 1), resample(catmullRom(BOT_CTRL, 20), 1)];
export const LANE_NAMES = ['Upper', 'Lower'] as const;
export const LANE_LENGTH = polylineLength(LANES[0]);
const LANES_COARSE: V2[][] = LANES.map((l) => resample(l, 2));

export const BASE_CENTER: V2[] = [{ x: -62, y: 0 }, { x: 62, y: 0 }];
export const FOUNTAIN: V2[] = [{ x: -69, y: 0 }, { x: 69, y: 0 }];
export const FOUNTAIN_RADIUS = 7;
export const ENGINE_POS: V2[] = [{ x: -61, y: 0 }, { x: 61, y: 0 }];
export const BASE_RADIUS = 12.5;

/** River / skybridge: self-symmetric under rotation. */
export const RIVER: V2[] = resample(catmullRom([
  { x: -7, y: -54 }, { x: -4, y: -30 }, { x: -1.5, y: -12 }, { x: 0, y: 0 }, { x: 1.5, y: 12 }, { x: 4, y: 30 }, { x: 7, y: 54 },
], 10), 1);
export const RIVER_HALF = 3.6;
export const PIT_CENTER: V2 = { x: 0, y: 0 };
export const PIT_RADIUS = 8;

interface Clearing { x: number; y: number; r: number }
interface Path { pts: V2[]; w: number }

// Team-0 side jungle (west). Mirrored for team 1.
const WEST_CLEARINGS: Clearing[] = [
  { x: -38, y: 0, r: 4.5 }, // mid-west junction
  { x: -36, y: -22, r: 6 }, // north buff
  { x: -22, y: -36, r: 4.6 }, // small N1
  { x: -20, y: -16, r: 4.6 }, // small N2
  { x: -32, y: 24, r: 6 }, // south buff
  { x: -18, y: 34, r: 4.6 }, // small S1
  { x: -22, y: 12, r: 4.6 }, // small S2
  { x: -10, y: -31, r: 5 }, // north catalyst pocket (team-neutral; rotated copy is south pocket)
];
const WEST_PATHS: Path[] = [
  { pts: [{ x: -52, y: 0 }, { x: -38, y: 0 }], w: 2.6 },
  { pts: [{ x: -38, y: 0 }, { x: -37, y: -11 }, { x: -36, y: -22 }], w: 2.3 },
  { pts: [{ x: -36, y: -22 }, { x: -42, y: -29 }, { x: -48, y: -34 }], w: 2.3 },
  { pts: [{ x: -36, y: -22 }, { x: -29, y: -31 }, { x: -22, y: -36 }, { x: -14, y: -38 }, { x: -6, y: -38 }], w: 2.2 },
  { pts: [{ x: -36, y: -22 }, { x: -28, y: -19 }, { x: -20, y: -16 }, { x: -11, y: -15 }, { x: -2, y: -14 }], w: 2.2 },
  { pts: [{ x: -38, y: 0 }, { x: -36, y: 12 }, { x: -32, y: 24 }], w: 2.3 },
  { pts: [{ x: -32, y: 24 }, { x: -38, y: 32 }, { x: -43, y: 38 }], w: 2.3 },
  { pts: [{ x: -32, y: 24 }, { x: -25, y: 30 }, { x: -18, y: 34 }, { x: -8, y: 38 }, { x: 4, y: 39 }], w: 2.2 },
  { pts: [{ x: -38, y: 0 }, { x: -30, y: 6 }, { x: -22, y: 12 }, { x: -12, y: 12 }, { x: 1, y: 11 }], w: 2.2 },
  { pts: [{ x: -20, y: -16 }, { x: -25, y: -4 }, { x: -22, y: 12 }], w: 2.0 },
];
const WEST_BRUSH: Clearing[] = [
  { x: -12, y: -44.5, r: 3.0 }, // upper lane river-side brush
  { x: -31, y: -51.6, r: 2.4 }, // upper lane outer shoulder
  { x: -6.5, y: -22, r: 2.4 }, // river brush north
  { x: -25, y: -4, r: 2.6 }, // central jungle crossing
  { x: -26, y: 30, r: 2.4 }, // south jungle path
  { x: -45, y: -35, r: 2.6 }, // upper lane jungle entrance
  { x: -58.5, y: 28, r: 2.6 }, // lower lane outer shoulder near base
  { x: -40, y: 37, r: 2.4 }, // lower lane jungle entrance
];

export const CLEARINGS: Clearing[] = [...WEST_CLEARINGS, ...WEST_CLEARINGS.map((c) => ({ ...rot(c), r: c.r }))];
export const JUNGLE_PATHS: Path[] = [...WEST_PATHS, ...WEST_PATHS.map((p) => ({ pts: p.pts.map(rot), w: p.w }))];
export const BRUSHES: Clearing[] = [...WEST_BRUSH, ...WEST_BRUSH.map((c) => ({ ...rot(c), r: c.r }))];
const JUNGLE_PATHS_SAMPLED = JUNGLE_PATHS.map((p) => ({ pts: resample(catmullRom(p.pts, 8), 1), w: p.w }));

/** Closed loop around the central mistwood (inside = jungle/forest). */
const LOOP: V2[] = [...LANES_COARSE[0], ...LANES_COARSE[1].slice().reverse()];

// ---------- Structures ----------
export type StructureKind = 'tower' | 'seal' | 'core' | 'engine' | 'fountain';
export type TowerTier = 'outer' | 'inner' | 'guard' | 'core' | 'seal' | 'engine' | 'fountain';
export interface StructureDef { key: string; kind: StructureKind; tier: TowerTier; team: Team; lane: number; x: number; y: number }

function laneDistPoint(lane: number, s: number): V2 {
  return pointAlong(LANES[lane], s / LANE_LENGTH);
}
const TIER_S: Array<[TowerTier, number]> = [['seal', 14], ['guard', 22], ['inner', 42], ['outer', 63]];

function buildStructures(): StructureDef[] {
  const out: StructureDef[] = [];
  for (const team of [0, 1] as Team[]) {
    for (let lane = 0; lane < 2; lane++) {
      for (const [tier, s] of TIER_S) {
        const p = laneDistPoint(lane, team === 0 ? s : LANE_LENGTH - s);
        // nudge towers slightly toward the center side of the lane so they sit on the shoulder
        out.push({ key: `${team}-${lane}-${tier}`, kind: tier === 'seal' ? 'seal' : 'tower', tier, team, lane, x: p.x, y: p.y });
      }
      const c = laneDistPoint(lane, team === 0 ? 5 : LANE_LENGTH - 5);
      out.push({ key: `${team}-${lane}-core`, kind: 'core', tier: 'core', team, lane, x: c.x, y: c.y });
    }
    out.push({ key: `${team}-engine`, kind: 'engine', tier: 'engine', team, lane: -1, x: ENGINE_POS[team].x, y: ENGINE_POS[team].y });
  }
  return out;
}
export const STRUCTURES: StructureDef[] = buildStructures();

// ---------- Jungle camps ----------
export type CampKind = 'buffForge' | 'buffSpring' | 'cogmites' | 'mistlings' | 'rams' | 'crabs' | 'catalystGale' | 'catalystForge' | 'colossus';
export interface CampDef { key: string; kind: CampKind; side: Team | 2; x: number; y: number; leash: number }
const WEST_CAMPS: Array<{ kind: CampKind; x: number; y: number }> = [
  { kind: 'buffForge', x: -36, y: -22 },
  { kind: 'cogmites', x: -22, y: -36 },
  { kind: 'mistlings', x: -20, y: -16 },
  { kind: 'buffSpring', x: -32, y: 24 },
  { kind: 'rams', x: -18, y: 34 },
  { kind: 'crabs', x: -22, y: 12 },
];
export const CAMPS: CampDef[] = [
  ...WEST_CAMPS.map((c, i) => ({ key: `0-${c.kind}-${i}`, kind: c.kind, side: 0 as Team, x: c.x, y: c.y, leash: 9 })),
  ...WEST_CAMPS.map((c, i) => ({ key: `1-${c.kind}-${i}`, kind: c.kind, side: 1 as Team, x: -c.x, y: -c.y, leash: 9 })),
  { key: 'catalyst-north', kind: 'catalystGale', side: 2, x: -10, y: -31, leash: 10 },
  { key: 'catalyst-south', kind: 'catalystForge', side: 2, x: 10, y: 31, leash: 10 },
  { key: 'colossus', kind: 'colossus', side: 2, x: 0, y: 0, leash: 10 },
];

// ---------- Terrain field ----------
export enum Cell { Void = 0, Ground = 1, Forest = 2, Brush = 3 }
export const FLAG_RIVER = 1;
export const FLAG_BASE0 = 2;
export const FLAG_BASE1 = 4;
export const FLAG_LANE = 8;
export const FLAG_PIT = 16;
export const FLAG_JUNGLE = 32;

function islandNoise(x: number, y: number): number {
  return (smoothNoise(x * 0.18, y * 0.18, 7) - 0.5) * 3.2 + (smoothNoise(x * 0.6, y * 0.6, 11) - 0.5) * 1.0;
}

/** Stamp min-distance-to-samples into a grid (fast distance field for sampled polylines). */
function stampDist(out: Float32Array, w: number, h: number, ox: number, oy: number, step: number, pts: V2[], radius: number) {
  const rc = Math.ceil(radius / step);
  for (const p of pts) {
    const ix = Math.round((p.x - ox) / step), iy = Math.round((p.y - oy) / step);
    for (let y = Math.max(0, iy - rc); y <= Math.min(h - 1, iy + rc); y++) {
      const wy = oy + y * step - p.y;
      for (let x = Math.max(0, ix - rc); x <= Math.min(w - 1, ix + rc); x++) {
        const wx = ox + x * step - p.x;
        const d = Math.sqrt(wx * wx + wy * wy);
        const i = y * w + x;
        if (d < out[i]) out[i] = d;
      }
    }
  }
}
function stampMask(out: Uint8Array, w: number, h: number, ox: number, oy: number, step: number, pts: V2[], radius: number, bit: number) {
  const rc = Math.ceil(radius / step);
  const r2 = radius * radius;
  for (const p of pts) {
    const ix = Math.round((p.x - ox) / step), iy = Math.round((p.y - oy) / step);
    for (let y = Math.max(0, iy - rc); y <= Math.min(h - 1, iy + rc); y++) {
      const wy = oy + y * step - p.y;
      for (let x = Math.max(0, ix - rc); x <= Math.min(w - 1, ix + rc); x++) {
        const wx = ox + x * step - p.x;
        if (wx * wx + wy * wy <= r2) out[y * w + x] |= bit;
      }
    }
  }
}
const LANES_FINE: V2[] = [...resample(LANES[0], 0.5), ...resample(LANES[1], 0.5)];
const RIVER_FINE: V2[] = resample(RIVER, 0.5);

export interface MapGrid {
  cells: Uint8Array; // Cell per nav cell
  flags: Uint8Array;
  clearance: Float32Array; // meters to nearest blocked cell
  brushId: Int16Array; // -1 none
  brushCount: number;
  fogBlock: Uint8Array; // per fog cell: 1 blocks vision
  islandF: Float32Array; // island field for rendering contour (nav resolution, +1 border)
}

let _grid: MapGrid | null = null;

export function navIndex(x: number, y: number): number {
  const cx = Math.floor((x - MAP_MIN_X) / NAV_CELL), cy = Math.floor((y - MAP_MIN_Y) / NAV_CELL);
  if (cx < 0 || cy < 0 || cx >= NAV_W || cy >= NAV_H) return -1;
  return cy * NAV_W + cx;
}
export function fogIndex(x: number, y: number): number {
  const cx = Math.floor((x - MAP_MIN_X) / FOG_CELL), cy = Math.floor((y - MAP_MIN_Y) / FOG_CELL);
  if (cx < 0 || cy < 0 || cx >= FOG_W || cy >= FOG_H) return -1;
  return cy * FOG_W + cx;
}
export const navCenterX = (cx: number) => MAP_MIN_X + (cx + 0.5) * NAV_CELL;
export const navCenterY = (cy: number) => MAP_MIN_Y + (cy + 0.5) * NAV_CELL;

export function getMapGrid(): MapGrid {
  if (_grid) return _grid;
  const N = NAV_W * NAV_H;
  const cells = new Uint8Array(N);
  const flags = new Uint8Array(N);
  const VW = NAV_W + 1, VH = NAV_H + 1;
  const islandF = new Float32Array(VW * VH);
  const laneV = new Float32Array(VW * VH).fill(99);
  stampDist(laneV, VW, VH, MAP_MIN_X, MAP_MIN_Y, NAV_CELL, LANES_FINE, ISLAND_MARGIN + 3);
  for (let gy = 0; gy < VH; gy++) {
    for (let gx = 0; gx < VW; gx++) {
      const x = MAP_MIN_X + gx * NAV_CELL, y = MAP_MIN_Y + gy * NAV_CELL;
      const n = islandNoise(x, y);
      let f = ISLAND_MARGIN + n - laneV[gy * VW + gx];
      f = Math.max(f, BASE_RADIUS + 1.5 + n - Math.min(dist(x, y, BASE_CENTER[0].x, BASE_CENTER[0].y), dist(x, y, BASE_CENTER[1].x, BASE_CENTER[1].y)));
      if (f < 4 && pointInPolygon(x, y, LOOP)) f = 4;
      islandF[gy * VW + gx] = f;
    }
  }
  const cox = MAP_MIN_X + NAV_CELL / 2, coy = MAP_MIN_Y + NAV_CELL / 2;
  const laneC = new Float32Array(N).fill(99);
  stampDist(laneC, NAV_W, NAV_H, cox, coy, NAV_CELL, LANES_FINE, LANE_HALF + 1);
  const mask = new Uint8Array(N); // 1 river, 2 jungle open, 4 brush
  stampMask(mask, NAV_W, NAV_H, cox, coy, NAV_CELL, RIVER_FINE, RIVER_HALF, 1);
  for (const p of JUNGLE_PATHS_SAMPLED) stampMask(mask, NAV_W, NAV_H, cox, coy, NAV_CELL, resample(p.pts, 0.5), p.w, 2);
  for (const c of CLEARINGS) stampMask(mask, NAV_W, NAV_H, cox, coy, NAV_CELL, [c], c.r, 2);
  for (const b of BRUSHES) stampMask(mask, NAV_W, NAV_H, cox, coy, NAV_CELL, [b], b.r, 4);
  for (let cy = 0; cy < NAV_H; cy++) {
    for (let cx = 0; cx < NAV_W; cx++) {
      const i = cy * NAV_W + cx;
      const x = navCenterX(cx), y = navCenterY(cy);
      const f = (islandF[cy * VW + cx] + islandF[cy * VW + cx + 1] + islandF[(cy + 1) * VW + cx] + islandF[(cy + 1) * VW + cx + 1]) / 4;
      if (f < 0.6) { cells[i] = Cell.Void; continue; }
      const dLane = laneC[i];
      let fl = 0;
      if (dLane <= LANE_HALF + 0.5) fl |= FLAG_LANE;
      if (dist(x, y, BASE_CENTER[0].x, BASE_CENTER[0].y) <= BASE_RADIUS) fl |= FLAG_BASE0;
      if (dist(x, y, BASE_CENTER[1].x, BASE_CENTER[1].y) <= BASE_RADIUS) fl |= FLAG_BASE1;
      const inRiver = (mask[i] & 1) !== 0;
      if (inRiver) fl |= FLAG_RIVER;
      const inPit = dist(x, y, PIT_CENTER.x, PIT_CENTER.y) <= PIT_RADIUS;
      if (inPit) fl |= FLAG_PIT;
      const inLoop = dLane > LANE_HALF && (fl & (FLAG_BASE0 | FLAG_BASE1)) === 0 ? pointInPolygon(x, y, LOOP) : true;
      let open = !inLoop || dLane <= LANE_HALF || (fl & (FLAG_BASE0 | FLAG_BASE1)) !== 0 || inRiver || inPit;
      if (!open && (mask[i] & 2)) { open = true; fl |= FLAG_JUNGLE; }
      const brush = (mask[i] & 4) !== 0;
      if (brush) open = true;
      // Pit rim: forest ring except river entrances keeps exactly two entrances
      const dp = dist(x, y, PIT_CENTER.x, PIT_CENTER.y);
      if (dp > PIT_RADIUS && dp < PIT_RADIUS + 2.2 && !inRiver) open = false;
      cells[i] = open ? (brush ? Cell.Brush : Cell.Ground) : Cell.Forest;
      flags[i] = fl;
    }
  }
  // clearance via two-pass chamfer distance transform (in cells)
  const INF = 1e9;
  const d = new Float32Array(N);
  for (let i = 0; i < N; i++) d[i] = cells[i] === Cell.Ground || cells[i] === Cell.Brush ? INF : 0;
  const D1 = 1, D2 = Math.SQRT2;
  for (let y = 0; y < NAV_H; y++) for (let x = 0; x < NAV_W; x++) {
    const i = y * NAV_W + x;
    if (d[i] === 0) continue;
    let v = d[i];
    if (x > 0) v = Math.min(v, d[i - 1] + D1); else v = Math.min(v, 0.5);
    if (y > 0) v = Math.min(v, d[i - NAV_W] + D1); else v = Math.min(v, 0.5);
    if (x > 0 && y > 0) v = Math.min(v, d[i - NAV_W - 1] + D2);
    if (x < NAV_W - 1 && y > 0) v = Math.min(v, d[i - NAV_W + 1] + D2);
    d[i] = v;
  }
  for (let y = NAV_H - 1; y >= 0; y--) for (let x = NAV_W - 1; x >= 0; x--) {
    const i = y * NAV_W + x;
    if (d[i] === 0) continue;
    let v = d[i];
    if (x < NAV_W - 1) v = Math.min(v, d[i + 1] + D1); else v = Math.min(v, 0.5);
    if (y < NAV_H - 1) v = Math.min(v, d[i + NAV_W] + D1); else v = Math.min(v, 0.5);
    if (x < NAV_W - 1 && y < NAV_H - 1) v = Math.min(v, d[i + NAV_W + 1] + D2);
    if (x > 0 && y < NAV_H - 1) v = Math.min(v, d[i + NAV_W - 1] + D2);
    d[i] = v;
  }
  const clearance = new Float32Array(N);
  for (let i = 0; i < N; i++) clearance[i] = d[i] === 0 ? 0 : (d[i] - 0.5) * NAV_CELL;
  // brush components
  const brushId = new Int16Array(N).fill(-1);
  let brushCount = 0;
  const stack: number[] = [];
  for (let i = 0; i < N; i++) {
    if (cells[i] !== Cell.Brush || brushId[i] !== -1) continue;
    const id = brushCount++;
    stack.push(i);
    brushId[i] = id;
    while (stack.length) {
      const c = stack.pop()!;
      const cx = c % NAV_W, cy = (c / NAV_W) | 0;
      const nb = [cx > 0 ? c - 1 : -1, cx < NAV_W - 1 ? c + 1 : -1, cy > 0 ? c - NAV_W : -1, cy < NAV_H - 1 ? c + NAV_W : -1];
      for (const n of nb) if (n >= 0 && cells[n] === Cell.Brush && brushId[n] === -1) { brushId[n] = id; stack.push(n); }
    }
  }
  // fog blockers: a fog cell blocks if majority of its nav cells are forest
  const fogBlock = new Uint8Array(FOG_W * FOG_H);
  const ratio = FOG_CELL / NAV_CELL;
  for (let fy = 0; fy < FOG_H; fy++) for (let fx = 0; fx < FOG_W; fx++) {
    let forest = 0, tot = 0;
    for (let sy = 0; sy < ratio; sy++) for (let sx = 0; sx < ratio; sx++) {
      const nx = fx * ratio + sx, ny = fy * ratio + sy;
      if (nx >= NAV_W || ny >= NAV_H) continue;
      tot++;
      if (cells[ny * NAV_W + nx] === Cell.Forest) forest++;
    }
    fogBlock[fy * FOG_W + fx] = tot > 0 && forest * 2 > tot ? 1 : 0;
  }
  _grid = { cells, flags, clearance, brushId, brushCount, fogBlock, islandF };
  return _grid;
}

export function cellAt(x: number, y: number): Cell {
  const i = navIndex(x, y);
  return i < 0 ? Cell.Void : (getMapGrid().cells[i] as Cell);
}
export function isWalkable(x: number, y: number): boolean {
  const c = cellAt(x, y);
  return c === Cell.Ground || c === Cell.Brush;
}
export function clearanceAt(x: number, y: number): number {
  const i = navIndex(x, y);
  return i < 0 ? 0 : getMapGrid().clearance[i];
}
export function brushAt(x: number, y: number): number {
  const i = navIndex(x, y);
  return i < 0 ? -1 : getMapGrid().brushId[i];
}
export function flagsAt(x: number, y: number): number {
  const i = navIndex(x, y);
  return i < 0 ? 0 : getMapGrid().flags[i];
}
export function inFountain(team: Team, x: number, y: number): boolean {
  return dist(x, y, FOUNTAIN[team].x, FOUNTAIN[team].y) <= FOUNTAIN_RADIUS;
}
/** Lane progress (0..1 from team-0 base) of the closest lane point. */
export function laneProgress(lane: number, x: number, y: number): number {
  const pts = LANES[lane];
  let bi = 0, bd = Infinity;
  for (let i = 0; i < pts.length; i += 2) {
    const dd = (pts[i].x - x) ** 2 + (pts[i].y - y) ** 2;
    if (dd < bd) { bd = dd; bi = i; }
  }
  return bi / (pts.length - 1);
}
export function laneDistance(x: number, y: number): { lane: number; d: number } {
  const d0 = distToPolyline(x, y, LANES_COARSE[0]), d1 = distToPolyline(x, y, LANES_COARSE[1]);
  return d0 <= d1 ? { lane: 0, d: d0 } : { lane: 1, d: d1 };
}
