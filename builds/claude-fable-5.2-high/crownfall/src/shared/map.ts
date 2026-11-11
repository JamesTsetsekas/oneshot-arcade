// The Broken Diadem — map definition, signed-distance terrain, navigation and vision queries.
//
// The island is authored as a list of "carve" capsules (lanes, base plateaus, jungle trails, river,
// camp clearings). Everything not carved is mistwood / cliff. A signed-distance grid is baked from
// the carves once and then drives walkability, pathfinding, line of sight, brush membership and the
// terrain mesh, so collision, vision and visuals always agree.
//
// Teams are mirrored left/right (x -> W - x) for fairness; the upper and lower lanes are *not*
// mirrors of each other (long arcing upper lane, shorter lower lane, different jungle layouts).

import { Vec, clamp, dist, pointAlong, pointSegDist, polylineLength } from './math';

export const MAP_W = 150;
export const MAP_H = 115;
export const CELL = 0.5;
export const GW = Math.round(MAP_W / CELL) + 1;
export const GH = Math.round(MAP_H / CELL) + 1;
export const NAV_CLEAR = 0.5;
/** A sight line is blocked once it is this deep inside terrain (walls thicker than ~1 m block vision). */
export const LOS_DEPTH = 0.5;

export type Surf = 0 | 1 | 2 | 3 | 4 | 5; // jungle, lane, base, river, pit, camp
export const SURF = { jungle: 0, lane: 1, base: 2, river: 3, pit: 4, camp: 5 } as const;

interface Carve {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  r: number;
  surf: Surf;
}

export type StructKind = 'tower' | 'seal' | 'core' | 'engine';
export interface StructDef {
  key: string;
  kind: StructKind;
  tier: 'outer' | 'inner' | 'guard' | 'seal' | 'core' | 'engine';
  team: 0 | 1;
  lane: number; // 0 upper, 1 lower, -1 base
  x: number;
  y: number;
  radius: number;
}

export type CampType = 'thorn' | 'moss' | 'brass' | 'mist' | 'catalystN' | 'catalystS' | 'colossus';
export interface CampDef {
  id: number;
  side: 0 | 1 | 2; // 2 = contested / neutral ground
  type: CampType;
  x: number;
  y: number;
}

export interface BrushDef {
  id: number;
  ax: number;
  ay: number;
  bx: number;
  by: number;
  r: number;
}

const mx = (x: number): number => MAP_W - x;

function poly(pts: number[][], r: number, surf: Surf): Carve[] {
  const out: Carve[] = [];
  for (let i = 0; i < pts.length - 1; i++) out.push({ ax: pts[i][0], ay: pts[i][1], bx: pts[i + 1][0], by: pts[i + 1][1], r, surf });
  return out;
}
const circ = (x: number, y: number, r: number, surf: Surf): Carve => ({ ax: x, ay: y, bx: x, by: y, r, surf });

// ---- Authoring data (team 0 / west half; mirrored for team 1) -------------------------------

const UPPER_HALF = [
  [26, 69],
  [34, 84],
  [50, 95],
  [75, 98],
];
const LOWER_HALF = [
  [26, 46],
  [36, 33],
  [54, 25],
  [75, 23],
];
const LANE_R = 5.5;

const HALF_CARVES: Carve[] = [
  circ(20, 57.5, 15, SURF.base),
  circ(8.5, 57.5, 6.5, SURF.base),
  ...poly(UPPER_HALF, LANE_R, SURF.lane),
  ...poly(LOWER_HALF, LANE_R, SURF.lane),
  // base mid exit into the jungle hub
  ...poly(
    [
      [33, 57.5],
      [45, 57.5],
    ],
    3.2,
    SURF.jungle,
  ),
  // upper jungle trails
  ...poly(
    [
      [45, 57.5],
      [47, 70],
      [52, 82],
      [51, 91],
    ],
    2.8,
    SURF.jungle,
  ),
  ...poly(
    [
      [47, 70],
      [60, 73],
      [70, 80],
    ],
    2.8,
    SURF.jungle,
  ),
  ...poly(
    [
      [52, 82],
      [58, 84],
    ],
    2.5,
    SURF.jungle,
  ),
  // lower jungle trails
  ...poly(
    [
      [45, 57.5],
      [47, 45],
      [53, 35],
      [54, 29],
    ],
    2.8,
    SURF.jungle,
  ),
  ...poly(
    [
      [47, 45],
      [60, 43],
      [70, 37],
    ],
    2.8,
    SURF.jungle,
  ),
  ...poly(
    [
      [53, 35],
      [59, 35.5],
    ],
    2.5,
    SURF.jungle,
  ),
  // camp clearings
  circ(40.5, 66, 3.7, SURF.camp),
  circ(57, 67, 3.7, SURF.camp),
  circ(61, 84.5, 4.3, SURF.camp),
  circ(41, 49, 3.7, SURF.camp),
  circ(58, 49, 3.7, SURF.camp),
  circ(62, 36, 4.3, SURF.camp),
];

const CENTER_CARVES: Carve[] = [
  ...poly(
    [
      [75, 98],
      [75, 23],
    ],
    4.5,
    SURF.river,
  ),
  circ(75, 85, 6.5, SURF.river),
  circ(75, 36, 6.5, SURF.river),
  circ(75, 60.5, 9, SURF.pit),
  // the vision ledge: a small alcove overlooking the pit from the west and east rims
  circ(63.3, 60.5, 2.6, SURF.jungle),
  circ(86.7, 60.5, 2.6, SURF.jungle),
  ...poly(
    [
      [58, 49],
      [62, 55],
      [63.3, 60.5],
    ],
    2.2,
    SURF.jungle,
  ),
  ...poly(
    [
      [92, 49],
      [88, 55],
      [86.7, 60.5],
    ],
    2.2,
    SURF.jungle,
  ),
];

const HALF_CAMPS: Array<[CampType, number, number]> = [
  ['thorn', 40.5, 66],
  ['moss', 57, 67],
  ['brass', 61, 84.5],
  ['thorn', 41, 49],
  ['moss', 58, 49],
  ['mist', 62, 36],
];

const HALF_BRUSH: number[][] = [
  // ax, ay, bx, by, r
  [57, 101.2, 66, 102.4, 1.9], // upper lane, outer edge
  [59, 20.4, 68, 19.6, 1.9], // lower lane, outer edge
  [49.2, 75.5, 50.2, 78, 2.7], // upper jungle trail
  [49.4, 41, 50.6, 39, 2.7], // lower jungle trail
  [66, 77, 69, 79.2, 2.6], // river mouth north
  [66, 39.6, 69, 37.6, 2.6], // river mouth south
  [38, 57.5, 41, 57.5, 2.9], // base exit
];
const CENTER_BRUSH: number[][] = [
  [75, 72.5, 75, 72.5, 3.4],
  [75, 48.5, 75, 48.5, 3.4],
  [75, 92.5, 75, 92.5, 2.6],
  [75, 28, 75, 28, 2.6],
];

export const WARD_SPOTS: Vec[] = [];
for (const [x, y] of [
  [75, 72.5],
  [75, 48.5],
  [62, 101.5],
  [63, 20],
  [68, 78.5],
  [68, 38.2],
  [49.7, 76.5],
  [50, 40],
]) {
  WARD_SPOTS.push({ x, y });
  if (x !== 75) WARD_SPOTS.push({ x: mx(x), y });
}

export const FOUNTAIN: Vec[] = [
  { x: 8.5, y: 57.5 },
  { x: mx(8.5), y: 57.5 },
];
export const FOUNTAIN_RADIUS = 7.5;
export const COLOSSUS_POS: Vec = { x: 75, y: 60.5 };

function mirrorCarve(c: Carve): Carve {
  return { ax: mx(c.ax), ay: c.ay, bx: mx(c.bx), by: c.by, r: c.r, surf: c.surf };
}

function buildLane(half: number[][]): Vec[] {
  const pts: Vec[] = half.map(([x, y]) => ({ x, y }));
  for (let i = half.length - 2; i >= 0; i--) pts.push({ x: mx(half[i][0]), y: half[i][1] });
  return pts;
}

// ---- Heap for A* ---------------------------------------------------------------------------

class MinHeap {
  ids: number[] = [];
  keys: number[] = [];
  get size(): number {
    return this.ids.length;
  }
  clear(): void {
    this.ids.length = 0;
    this.keys.length = 0;
  }
  push(id: number, key: number): void {
    const ids = this.ids;
    const keys = this.keys;
    let i = ids.length;
    ids.push(id);
    keys.push(key);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (keys[p] <= key) break;
      ids[i] = ids[p];
      keys[i] = keys[p];
      i = p;
    }
    ids[i] = id;
    keys[i] = key;
  }
  pop(): number {
    const ids = this.ids;
    const keys = this.keys;
    const top = ids[0];
    const lastId = ids.pop() as number;
    const lastKey = keys.pop() as number;
    const n = ids.length;
    if (n > 0) {
      let i = 0;
      for (;;) {
        let c = i * 2 + 1;
        if (c >= n) break;
        if (c + 1 < n && keys[c + 1] < keys[c]) c++;
        if (keys[c] >= lastKey) break;
        ids[i] = ids[c];
        keys[i] = keys[c];
        i = c;
      }
      ids[i] = lastId;
      keys[i] = lastKey;
    }
    return top;
  }
}

export type BlockFn = (x: number, y: number) => boolean;

export class GameMap {
  readonly sdfTerrain = new Float32Array(GW * GH); // carves only (vision / projectiles)
  readonly sdfNav = new Float32Array(GW * GH); // carves + structure footprints (movement)
  readonly surf = new Uint8Array(GW * GH);
  readonly brushGrid = new Int8Array(GW * GH).fill(-1);
  readonly lanes: Vec[][] = []; // lane polyline west -> east
  readonly lanePaths: Vec[][][] = []; // [lane][team] minion waypoints
  readonly structs: StructDef[] = [];
  readonly camps: CampDef[] = [];
  readonly brush: BrushDef[] = [];
  readonly carves: Carve[] = [];

  // A* scratch
  private readonly NW = MAP_W;
  private readonly NH = MAP_H;
  private readonly navOk = new Uint8Array(MAP_W * MAP_H);
  private readonly gScore = new Float32Array(MAP_W * MAP_H);
  private readonly cameFrom = new Int32Array(MAP_W * MAP_H);
  private readonly stamp = new Uint32Array(MAP_W * MAP_H);
  private readonly closed = new Uint32Array(MAP_W * MAP_H);
  private gen = 0;
  private readonly heap = new MinHeap();

  constructor() {
    this.carves.push(...HALF_CARVES, ...HALF_CARVES.map(mirrorCarve), ...CENTER_CARVES);
    this.lanes.push(buildLane(UPPER_HALF), buildLane(LOWER_HALF));
    this.buildStructs();
    this.buildCamps();
    this.buildBrush();
    this.bake();
    this.buildLanePaths();
  }

  private buildStructs(): void {
    const add = (key: string, kind: StructKind, tier: StructDef['tier'], lane: number, x: number, y: number, radius: number): void => {
      this.structs.push({ key: `t0-${key}`, kind, tier, team: 0, lane, x, y, radius });
      this.structs.push({ key: `t1-${key}`, kind, tier, team: 1, lane, x: mx(x), y, radius });
    };
    // Lane structures sit 3.1 m off the lane centre line, toward the island interior, so waves
    // march past them instead of colliding with them.
    for (let lane = 0; lane < 2; lane++) {
      const pts = this.lanes[lane];
      const side = lane === 0 ? 1 : -1; // which perpendicular points toward the interior
      const place = (s: number): Vec => {
        const p = pointAlong(pts, s);
        return { x: p.x + p.dy * side * 3.1, y: p.y - p.dx * side * 3.1 };
      };
      const lname = lane === 0 ? 'up' : 'low';
      const seal = place(2.5);
      const guard = place(10.5);
      const inner = place(26);
      const outer = place(lane === 0 ? 43 : 41.5);
      add(`${lname}-seal`, 'seal', 'seal', lane, seal.x, seal.y, 1.5);
      add(`${lname}-guard`, 'tower', 'guard', lane, guard.x, guard.y, 1.3);
      add(`${lname}-inner`, 'tower', 'inner', lane, inner.x, inner.y, 1.3);
      add(`${lname}-outer`, 'tower', 'outer', lane, outer.x, outer.y, 1.3);
    }
    add('core-a', 'core', 'core', -1, 30.5, 63.2, 1.5);
    add('core-b', 'core', 'core', -1, 30.5, 51.8, 1.5);
    add('engine', 'engine', 'engine', -1, 20.5, 57.5, 2.4);
  }

  private buildCamps(): void {
    let id = 0;
    for (const [type, x, y] of HALF_CAMPS) this.camps.push({ id: id++, side: 0, type, x, y });
    for (const [type, x, y] of HALF_CAMPS) this.camps.push({ id: id++, side: 1, type, x: mx(x), y });
    this.camps.push({ id: id++, side: 2, type: 'catalystN', x: 75, y: 85.5 });
    this.camps.push({ id: id++, side: 2, type: 'catalystS', x: 75, y: 35.5 });
    this.camps.push({ id: id++, side: 2, type: 'colossus', x: COLOSSUS_POS.x, y: COLOSSUS_POS.y });
  }

  private buildBrush(): void {
    let id = 0;
    for (const b of HALF_BRUSH) this.brush.push({ id: id++, ax: b[0], ay: b[1], bx: b[2], by: b[3], r: b[4] });
    for (const b of HALF_BRUSH) this.brush.push({ id: id++, ax: mx(b[0]), ay: b[1], bx: mx(b[2]), by: b[3], r: b[4] });
    for (const b of CENTER_BRUSH) this.brush.push({ id: id++, ax: b[0], ay: b[1], bx: b[2], by: b[3], r: b[4] });
  }

  private bake(): void {
    const carves = this.carves;
    const n = carves.length;
    const M = 12;
    const bx0 = new Float32Array(n);
    const bx1 = new Float32Array(n);
    const by0 = new Float32Array(n);
    const by1 = new Float32Array(n);
    const bias = new Float32Array(n);
    for (let k = 0; k < n; k++) {
      const c = carves[k];
      bx0[k] = Math.min(c.ax, c.bx) - c.r - M;
      bx1[k] = Math.max(c.ax, c.bx) + c.r + M;
      by0[k] = Math.min(c.ay, c.by) - c.r - M;
      by1[k] = Math.max(c.ay, c.by) + c.r + M;
      // lanes and bases win ties so their paving reads cleanly over trails/river
      bias[k] = c.surf === SURF.lane || c.surf === SURF.base ? 0.6 : c.surf === SURF.pit ? 0.3 : 0;
    }
    const rowList: number[] = [];
    for (let j = 0; j < GH; j++) {
      const y = j * CELL;
      rowList.length = 0;
      for (let k = 0; k < n; k++) if (y >= by0[k] && y <= by1[k]) rowList.push(k);
      for (let i = 0; i < GW; i++) {
        const x = i * CELL;
        let best = 1e9;
        let trueD = M;
        let surf: Surf = 0;
        for (let q = 0; q < rowList.length; q++) {
          const k = rowList[q];
          if (x < bx0[k] || x > bx1[k]) continue;
          const c = carves[k];
          const d = pointSegDist(x, y, c.ax, c.ay, c.bx, c.by) - c.r;
          if (d < trueD) trueD = d;
          if (d - bias[k] < best) {
            best = d - bias[k];
            surf = c.surf;
          }
        }
        // keep a hard island edge margin so nothing is walkable at the grid border
        const edge = Math.min(x, y, MAP_W - x, MAP_H - y);
        if (edge < 2) trueD = Math.max(trueD, 2 - edge);
        const idx = j * GW + i;
        this.sdfTerrain[idx] = trueD;
        this.sdfNav[idx] = trueD;
        this.surf[idx] = surf;
      }
    }
    // structure footprints block movement (not vision)
    for (const s of this.structs) {
      const R = s.radius + 1.5;
      const i0 = Math.max(0, Math.floor((s.x - R) / CELL));
      const i1 = Math.min(GW - 1, Math.ceil((s.x + R) / CELL));
      const j0 = Math.max(0, Math.floor((s.y - R) / CELL));
      const j1 = Math.min(GH - 1, Math.ceil((s.y + R) / CELL));
      for (let j = j0; j <= j1; j++)
        for (let i = i0; i <= i1; i++) {
          const sd = s.radius - dist(i * CELL, j * CELL, s.x, s.y);
          const idx = j * GW + i;
          if (sd > this.sdfNav[idx]) this.sdfNav[idx] = sd;
        }
    }
    for (const b of this.brush) {
      const i0 = Math.max(0, Math.floor((Math.min(b.ax, b.bx) - b.r) / CELL));
      const i1 = Math.min(GW - 1, Math.ceil((Math.max(b.ax, b.bx) + b.r) / CELL));
      const j0 = Math.max(0, Math.floor((Math.min(b.ay, b.by) - b.r) / CELL));
      const j1 = Math.min(GH - 1, Math.ceil((Math.max(b.ay, b.by) + b.r) / CELL));
      for (let j = j0; j <= j1; j++)
        for (let i = i0; i <= i1; i++) {
          const idx = j * GW + i;
          if (this.sdfTerrain[idx] < 0 && this.brushGrid[idx] < 0 && pointSegDist(i * CELL, j * CELL, b.ax, b.ay, b.bx, b.by) <= b.r) this.brushGrid[idx] = b.id;
        }
    }
    for (let j = 0; j < this.NH; j++) {
      for (let i = 0; i < this.NW; i++) {
        this.navOk[j * this.NW + i] = this.sdf(i + 0.5, j + 0.5) < -(NAV_CLEAR + 0.08) ? 1 : 0;
      }
    }
  }

  private buildLanePaths(): void {
    for (let lane = 0; lane < 2; lane++) {
      const pts = this.lanes[lane];
      const total = polylineLength(pts);
      const way: Vec[] = [];
      for (let s = 4; s <= total - 4; s += 7) {
        const p = pointAlong(pts, s);
        way.push({ x: p.x, y: p.y });
      }
      const e0 = this.structs.find((s) => s.key === 't0-engine') as StructDef;
      const e1 = this.structs.find((s) => s.key === 't1-engine') as StructDef;
      const toEast = [...way, { x: e1.x - 4.5, y: lane === 0 ? 61.5 : 53.5 }];
      const toWest = [...way].reverse();
      toWest.push({ x: e0.x + 4.5, y: lane === 0 ? 61.5 : 53.5 });
      this.lanePaths.push([toEast, toWest]);
    }
  }

  // ---- Queries -----------------------------------------------------------------------------

  private sample(grid: Float32Array, x: number, y: number): number {
    const gx = clamp(x / CELL, 0, GW - 1.001);
    const gy = clamp(y / CELL, 0, GH - 1.001);
    const i = gx | 0;
    const j = gy | 0;
    const fx = gx - i;
    const fy = gy - j;
    const idx = j * GW + i;
    const a = grid[idx];
    const b = grid[idx + 1];
    const c = grid[idx + GW];
    const d = grid[idx + GW + 1];
    return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
  }

  /** Signed distance for movement: negative inside walkable ground. */
  sdf(x: number, y: number): number {
    return this.sample(this.sdfNav, x, y);
  }
  /** Signed distance to terrain only (structures ignored): used by vision and projectiles. */
  sdfT(x: number, y: number): number {
    return this.sample(this.sdfTerrain, x, y);
  }
  surfAt(x: number, y: number): Surf {
    const i = clamp(Math.round(x / CELL), 0, GW - 1);
    const j = clamp(Math.round(y / CELL), 0, GH - 1);
    return this.surf[j * GW + i] as Surf;
  }
  brushAt(x: number, y: number): number {
    const i = clamp(Math.round(x / CELL), 0, GW - 1);
    const j = clamp(Math.round(y / CELL), 0, GH - 1);
    return this.brushGrid[j * GW + i];
  }
  inRiver(x: number, y: number): boolean {
    return this.surfAt(x, y) === SURF.river && this.sdfT(x, y) < 0;
  }
  walkable(x: number, y: number, clear = NAV_CLEAR): boolean {
    return this.sdf(x, y) < -clear;
  }
  gradient(x: number, y: number, terrainOnly = false): Vec {
    const e = 0.35;
    const f = terrainOnly ? this.sdfTerrain : this.sdfNav;
    const gx = this.sample(f, x + e, y) - this.sample(f, x - e, y);
    const gy = this.sample(f, x, y + e) - this.sample(f, x, y - e);
    const l = Math.hypot(gx, gy);
    return l < 1e-6 ? { x: 0, y: 0 } : { x: gx / l, y: gy / l };
  }

  /** Straight-line walk test at hero clearance. */
  segmentClear(ax: number, ay: number, bx: number, by: number, blocked?: BlockFn): boolean {
    const d = dist(ax, ay, bx, by);
    const n = Math.max(1, Math.ceil(d / 0.4));
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      const x = ax + (bx - ax) * t;
      const y = ay + (by - ay) * t;
      if (this.sdf(x, y) > -(NAV_CLEAR - 0.06)) return false;
      if (blocked && blocked(x, y)) return false;
    }
    return true;
  }

  /** Vision test: terrain blocks sight once the ray is well inside a wall. */
  losClear(ax: number, ay: number, bx: number, by: number): boolean {
    const d = dist(ax, ay, bx, by);
    if (d < 0.5) return true;
    const dx = (bx - ax) / d;
    const dy = (by - ay) / d;
    return this.rayDist(ax, ay, dx, dy, d, LOS_DEPTH) >= d;
  }

  /** Sphere-traced ray against terrain; returns travelled distance until sdfT > thresh. */
  rayDist(x: number, y: number, dx: number, dy: number, maxD: number, thresh: number): number {
    let t = 0;
    while (t < maxD) {
      const d = this.sdfT(x + dx * t, y + dy * t);
      if (d > thresh) return t;
      t += Math.max(0.35, (thresh - d) * 0.85);
    }
    return maxD;
  }

  /** Nearest point that a hero can stand on. */
  nearestWalkable(x: number, y: number): Vec {
    x = clamp(x, 1, MAP_W - 1);
    y = clamp(y, 1, MAP_H - 1);
    const need = -(NAV_CLEAR + 0.1);
    let px = x;
    let py = y;
    for (let it = 0; it < 24; it++) {
      const d = this.sdf(px, py);
      if (d < need) return { x: px, y: py };
      const g = this.gradient(px, py);
      if (g.x === 0 && g.y === 0) break;
      const step = Math.max(0.25, d - need);
      px -= g.x * step;
      py -= g.y * step;
    }
    // spiral over nav nodes
    const ci = clamp(Math.floor(x), 0, this.NW - 1);
    const cj = clamp(Math.floor(y), 0, this.NH - 1);
    let best = -1;
    let bestD = 1e9;
    for (let r = 0; r < 40 && best < 0; r++) {
      for (let j = cj - r; j <= cj + r; j++) {
        if (j < 0 || j >= this.NH) continue;
        for (let i = ci - r; i <= ci + r; i++) {
          if (i < 0 || i >= this.NW) continue;
          if (Math.max(Math.abs(i - ci), Math.abs(j - cj)) !== r) continue;
          if (!this.navOk[j * this.NW + i]) continue;
          const dd = (i + 0.5 - x) ** 2 + (j + 0.5 - y) ** 2;
          if (dd < bestD) {
            bestD = dd;
            best = j * this.NW + i;
          }
        }
      }
    }
    if (best < 0) return { x: FOUNTAIN[0].x, y: FOUNTAIN[0].y };
    return { x: (best % this.NW) + 0.5, y: Math.floor(best / this.NW) + 0.5 };
  }

  private nearestNode(x: number, y: number): number {
    const ci = clamp(Math.floor(x), 0, this.NW - 1);
    const cj = clamp(Math.floor(y), 0, this.NH - 1);
    if (this.navOk[cj * this.NW + ci]) return cj * this.NW + ci;
    let best = -1;
    let bestD = 1e9;
    for (let r = 1; r < 30 && best < 0; r++) {
      for (let j = cj - r; j <= cj + r; j++) {
        if (j < 0 || j >= this.NH) continue;
        for (let i = ci - r; i <= ci + r; i++) {
          if (i < 0 || i >= this.NW) continue;
          if (!this.navOk[j * this.NW + i]) continue;
          const dd = (i + 0.5 - x) ** 2 + (j + 0.5 - y) ** 2;
          if (dd < bestD) {
            bestD = dd;
            best = j * this.NW + i;
          }
        }
      }
    }
    return best;
  }

  /**
   * A* over the 1 m nav grid followed by string pulling against the SDF.
   * Returns waypoints (excluding the start). The goal is snapped to walkable ground.
   */
  findPath(sx: number, sy: number, tx: number, ty: number, blocked?: BlockFn): Vec[] {
    const goal = this.nearestWalkable(tx, ty);
    if (this.segmentClear(sx, sy, goal.x, goal.y, blocked)) return [goal];
    const start = this.nearestNode(sx, sy);
    const end = this.nearestNode(goal.x, goal.y);
    if (start < 0 || end < 0) return [];
    const NW = this.NW;
    const NH = this.NH;
    const gen = ++this.gen;
    const heap = this.heap;
    heap.clear();
    const ex = end % NW;
    const ey = (end / NW) | 0;
    const h = (n: number): number => {
      const dx = Math.abs((n % NW) - ex);
      const dy = Math.abs(((n / NW) | 0) - ey);
      return (dx + dy) + (Math.SQRT2 - 2) * Math.min(dx, dy);
    };
    this.gScore[start] = 0;
    this.stamp[start] = gen;
    this.cameFrom[start] = -1;
    heap.push(start, h(start));
    let found = false;
    let expanded = 0;
    while (heap.size > 0) {
      const cur = heap.pop();
      if (this.closed[cur] === gen) continue;
      this.closed[cur] = gen;
      if (cur === end) {
        found = true;
        break;
      }
      if (++expanded > 9000) break;
      const cx = cur % NW;
      const cy = (cur / NW) | 0;
      const g = this.gScore[cur];
      for (let dy = -1; dy <= 1; dy++) {
        const ny = cy + dy;
        if (ny < 0 || ny >= NH) continue;
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = cx + dx;
          if (nx < 0 || nx >= NW) continue;
          const n = ny * NW + nx;
          if (!this.navOk[n] || this.closed[n] === gen) continue;
          if (dx !== 0 && dy !== 0 && (!this.navOk[cy * NW + nx] || !this.navOk[ny * NW + cx])) continue;
          if (blocked && blocked(nx + 0.5, ny + 0.5)) continue;
          const ng = g + (dx !== 0 && dy !== 0 ? Math.SQRT2 : 1);
          if (this.stamp[n] !== gen || ng < this.gScore[n]) {
            this.gScore[n] = ng;
            this.stamp[n] = gen;
            this.cameFrom[n] = cur;
            heap.push(n, ng + h(n));
          }
        }
      }
    }
    if (!found) return [];
    const raw: Vec[] = [];
    for (let n = end; n >= 0; n = this.cameFrom[n]) raw.push({ x: (n % NW) + 0.5, y: ((n / NW) | 0) + 0.5 });
    raw.reverse();
    raw.push(goal);
    // string pulling
    const out: Vec[] = [];
    let ax = sx;
    let ay = sy;
    let i = 0;
    while (i < raw.length) {
      let far = i;
      // look ahead as far as visibility allows (bounded for cost)
      const lim = Math.min(raw.length - 1, i + 40);
      for (let k = lim; k > i; k--) {
        if (this.segmentClear(ax, ay, raw[k].x, raw[k].y, blocked)) {
          far = k;
          break;
        }
      }
      out.push(raw[far]);
      ax = raw[far].x;
      ay = raw[far].y;
      i = far + 1;
    }
    return out;
  }

  /** Walking distance estimate along a found path (used by fairness tests and bots). */
  pathLength(sx: number, sy: number, tx: number, ty: number): number {
    const p = this.findPath(sx, sy, tx, ty);
    if (!p.length) return Infinity;
    let l = 0;
    let px = sx;
    let py = sy;
    for (const q of p) {
      l += dist(px, py, q.x, q.y);
      px = q.x;
      py = q.y;
    }
    return l;
  }

  /** Vision fan for the client fog texture: polygon of ray hits around a source. */
  visionFan(x: number, y: number, radius: number, rays: number, out: Float32Array): void {
    for (let i = 0; i < rays; i++) {
      const a = (i / rays) * Math.PI * 2;
      const dx = Math.cos(a);
      const dy = Math.sin(a);
      const d = Math.min(radius, this.rayDist(x, y, dx, dy, radius, LOS_DEPTH) + 0.9);
      out[i * 2] = x + dx * d;
      out[i * 2 + 1] = y + dy * d;
    }
  }
}

let cached: GameMap | null = null;
export function getMap(): GameMap {
  if (!cached) cached = new GameMap();
  return cached;
}
