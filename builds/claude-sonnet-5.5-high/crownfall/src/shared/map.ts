/**
 * The Broken Diadem: authored map data + navigation grid, line-of-sight and A* pathfinding.
 * Shared by the simulation, the renderer and the minimap so they can never disagree.
 * The map is 180-degree rotationally symmetric: lane 0 (upper) for blue is rot180 of lane 1 (lower) for red.
 */
import { Vec, clamp, distPointSeg, rot180 } from './math';

export const MAP_W = 150;
export const MAP_H = 115;
export const MAP_X0 = -MAP_W / 2;
export const MAP_Z0 = -MAP_H / 2;
export const CELL = 0.75;
export const GW = Math.ceil(MAP_W / CELL);
export const GH = Math.ceil(MAP_H / CELL);

export interface Obstacle { ax: number; az: number; bx: number; bz: number; r: number; kind: 'rock' | 'wall' | 'pit' | 'struct' }
export interface BrushPatch { x: number; z: number; r: number }
export type StructureType = 'outer' | 'inner' | 'guard' | 'seal' | 'core' | 'engine';
export interface StructureDef { team: 0 | 1; type: StructureType; lane: number; x: number; z: number; id: string }
export interface CampDef {
  id: string; kind: 'small' | 'buff' | 'catalyst' | 'colossus'; x: number; z: number;
  family: string; team: 0 | 1 | 2; // owning side (2 = neutral)
}

const U_BLUE: Vec[] = [
  { x: -47, z: -9 }, { x: -43, z: -20 }, { x: -37, z: -31 }, { x: -22, z: -38 }, { x: -4, z: -36 },
  { x: 14, z: -32 }, { x: 32, z: -35 }, { x: 43, z: -26 }, { x: 47, z: -9 },
];
const L_BLUE: Vec[] = U_BLUE.map(rot180).reverse();
/** Lane polylines from blue base to red base. Index 0 = upper lane (north), 1 = lower lane. */
export const LANES: Vec[][] = [U_BLUE, L_BLUE];

export function laneFor(team: 0 | 1, lane: number): Vec[] {
  const p = LANES[lane];
  return team === 0 ? p : p.slice().reverse();
}
export function pathLength(p: Vec[]): number {
  let s = 0;
  for (let i = 1; i < p.length; i++) s += Math.hypot(p[i].x - p[i - 1].x, p[i].z - p[i - 1].z);
  return s;
}
export function pointAtArc(p: Vec[], arc: number): Vec & { seg: number } {
  let rem = arc;
  for (let i = 1; i < p.length; i++) {
    const l = Math.hypot(p[i].x - p[i - 1].x, p[i].z - p[i - 1].z);
    if (rem <= l) {
      const t = rem / l;
      return { x: p[i - 1].x + (p[i].x - p[i - 1].x) * t, z: p[i - 1].z + (p[i].z - p[i - 1].z) * t, seg: i };
    }
    rem -= l;
  }
  const e = p[p.length - 1];
  return { x: e.x, z: e.z, seg: p.length - 1 };
}

// ---------------------------------------------------------------- structures
const ARC = { seal: 3, guard: 14, inner: 33, outer: 54 };
export const TEAM_BASE: Record<0 | 1, { engine: Vec; cores: Vec[]; fountain: Vec; spawn: Vec }> = {
  0: { engine: { x: -62, z: 0 }, cores: [{ x: -57, z: -9 }, { x: -57, z: 9 }], fountain: { x: -70, z: 0 }, spawn: { x: -66, z: 0 } },
  1: { engine: { x: 62, z: 0 }, cores: [{ x: 57, z: 9 }, { x: 57, z: -9 }], fountain: { x: 70, z: 0 }, spawn: { x: 66, z: 0 } },
};

function buildStructures(): StructureDef[] {
  const out: StructureDef[] = [];
  const types: ('seal' | 'guard' | 'inner' | 'outer')[] = ['seal', 'guard', 'inner', 'outer'];
  for (let lane = 0; lane < 2; lane++) {
    for (const t of types) {
      const p = pointAtArc(LANES[lane], ARC[t]);
      out.push({ team: 0, type: t, lane, x: p.x, z: p.z, id: `b-${t}-${lane}` });
      // red's lane `lane` structure = rot180 of blue's other lane structure
      const q = pointAtArc(LANES[1 - lane], ARC[t]);
      out.push({ team: 1, type: t, lane, x: -q.x, z: -q.z, id: `r-${t}-${lane}` });
    }
  }
  for (const team of [0, 1] as const) {
    const b = TEAM_BASE[team];
    b.cores.forEach((c, i) => out.push({ team, type: 'core', lane: i, x: c.x, z: c.z, id: `${team === 0 ? 'b' : 'r'}-core-${i}` }));
    out.push({ team, type: 'engine', lane: -1, x: b.engine.x, z: b.engine.z, id: `${team === 0 ? 'b' : 'r'}-engine` });
  }
  return out;
}
export const STRUCTURES: StructureDef[] = buildStructures();

// ---------------------------------------------------------------- jungle & objectives
function rotCamp(c: CampDef): CampDef {
  return { ...c, id: c.id.replace(/^b/, 'r'), x: -c.x, z: -c.z, team: c.team === 0 ? 1 : c.team === 1 ? 0 : 2 };
}
const BLUE_CAMPS: CampDef[] = [
  { id: 'b-heart', kind: 'buff', x: -34, z: -12, family: 'heartroot', team: 0 },
  { id: 'b-cinder', kind: 'buff', x: -34, z: 13, family: 'cinder', team: 0 },
  { id: 'b-hounds', kind: 'small', x: -26, z: -21, family: 'hounds', team: 0 },
  { id: 'b-crag', kind: 'small', x: -26, z: 22, family: 'crag', team: 0 },
  { id: 'b-wisps', kind: 'small', x: -16, z: -16, family: 'wisps', team: 0 },
  { id: 'b-thorn', kind: 'small', x: -16, z: 17, family: 'thorn', team: 0 },
];
export const CAMPS: CampDef[] = [
  ...BLUE_CAMPS, ...BLUE_CAMPS.map(rotCamp),
  { id: 'catalyst-n', kind: 'catalyst', x: 0.5, z: -25, family: 'catalyst', team: 2 },
  { id: 'catalyst-s', kind: 'catalyst', x: -0.5, z: 25, family: 'catalyst', team: 2 },
  { id: 'colossus', kind: 'colossus', x: 0, z: 0, family: 'colossus', team: 2 },
];

// ---------------------------------------------------------------- obstacles / brush
const half = (a: [number, number, number][]): [number, number, number][] => a;
const ROCKS_BLUE = half([
  [-38, -21, 2.8], [-31, -30, 2.6], [-21, -27, 2.4], [-30, -6, 2.4], [-22, -3.5, 2.0], [-36, 3.5, 2.2],
  [-28, 8, 2.0], [-30, 29, 2.6], [-20, 26, 2.4], [-38, 22, 2.8], [-10, -20, 2.4], [-9, 21, 2.2], [-20, 8, 1.8],
]);
function buildObstacles(): Obstacle[] {
  const o: Obstacle[] = [];
  const add = (ax: number, az: number, bx: number, bz: number, r: number, kind: Obstacle['kind'] = 'wall') => {
    o.push({ ax, az, bx, bz, r, kind });
    o.push({ ax: -ax, az: -az, bx: -bx, bz: -bz, r, kind });
  };
  // base walls (blue side, rot180 gives red side)
  add(-52, -33, -52, -14, 1.1);
  add(-52, 14, -52, 33, 1.1);
  add(-52, -4.5, -52, -4.5, 1.2);
  add(-52, 4.5, -52, 4.5, 1.2);
  for (const [x, z, r] of ROCKS_BLUE) add(x, z, x, z, r, 'rock');
  // Aether Colossus pit: octagon with entrances east and west
  const R = 8.4;
  const pts: Vec[] = [];
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4 + Math.PI / 8;
    pts.push({ x: Math.cos(a) * R, z: Math.sin(a) * R });
  }
  for (let k = 0; k < 8; k++) {
    const a = pts[k], b = pts[(k + 1) % 8];
    const mid = Math.atan2((a.z + b.z) / 2, (a.x + b.x) / 2);
    const isEntrance = Math.abs(Math.cos(mid)) > 0.95; // east/west edges removed
    if (isEntrance) continue;
    // each of the 8 edges is added once (no rot pair), dedupe: only add for k<4 via add()
    if (k < 4) add(a.x, a.z, b.x, b.z, 1.0, 'pit');
  }
  // structures are solid for pathing (not for sight)
  const rad: Record<string, number> = { outer: 1.6, inner: 1.7, guard: 1.8, seal: 1.9, core: 1.9, engine: 2.8 };
  for (const s of STRUCTURES) o.push({ ax: s.x, az: s.z, bx: s.x, bz: s.z, r: rad[s.type] - 0.3, kind: 'struct' });
  return o;
}
export const OBSTACLES: Obstacle[] = buildObstacles();

function buildBrush(): BrushPatch[] {
  const b: BrushPatch[] = [];
  for (let k = 0; k < 6; k++) {
    const a = (k * Math.PI) / 3 + Math.PI / 6;
    b.push({ x: Math.cos(a) * 14.5, z: Math.sin(a) * 14.5, r: 5.2 });
  }
  const side: [number, number, number][] = [
    [-24, -31, 4.2], [-9, -28, 3.6], [-45, -26, 3.6], [-34, -2, 3.4], [-18, 3, 3.0], [-7, -40, 3.4], [-38, 10, 3.0], [-27, 15, 3.6],
  ];
  for (const [x, z, r] of side) {
    b.push({ x, z, r });
    b.push({ x: -x, z: -z, r });
  }
  return b;
}
export const BRUSH: BrushPatch[] = buildBrush();

export function inIsland(x: number, z: number, margin = 0): boolean {
  const hx = MAP_W / 2 - 1.2 - margin, hz = MAP_H / 2 - 1.2 - margin;
  if (hx <= 0 || hz <= 0) return false;
  const px = Math.abs(x / hx), pz = Math.abs(z / hz);
  return px ** 3 + pz ** 3 < 1;
}

// ---------------------------------------------------------------- navigation grid
export const walk = new Uint8Array(GW * GH); // 1 = walkable for a hero-sized unit
export const solid = new Uint8Array(GW * GH); // 1 = blocks sight (walls/rocks)
export const brushGrid = new Uint8Array(GW * GH); // patch index + 1

function cellCenter(ix: number, iz: number) {
  return { x: MAP_X0 + (ix + 0.5) * CELL, z: MAP_Z0 + (iz + 0.5) * CELL };
}
export function toCell(x: number, z: number) {
  return { ix: Math.floor((x - MAP_X0) / CELL), iz: Math.floor((z - MAP_Z0) / CELL) };
}
function build() {
  for (let iz = 0; iz < GH; iz++) {
    for (let ix = 0; ix < GW; ix++) {
      const { x, z } = cellCenter(ix, iz);
      const i = iz * GW + ix;
      let ok = inIsland(x, z, 0.4);
      let sol = !inIsland(x, z, 0) ? 0 : 0;
      for (const ob of OBSTACLES) {
        const d = distPointSeg(x, z, ob.ax, ob.az, ob.bx, ob.bz).d;
        if (d < ob.r + 0.55) ok = false;
        if (d < ob.r && ob.kind !== 'struct') sol = 1;
      }
      walk[i] = ok ? 1 : 0;
      solid[i] = sol;
      for (let b = 0; b < BRUSH.length; b++) {
        const br = BRUSH[b];
        if ((x - br.x) ** 2 + (z - br.z) ** 2 < br.r * br.r) {
          brushGrid[i] = b + 1;
          break;
        }
      }
    }
  }
}
build();

export function isWalkable(x: number, z: number): boolean {
  const ix = Math.floor((x - MAP_X0) / CELL), iz = Math.floor((z - MAP_Z0) / CELL);
  if (ix < 0 || iz < 0 || ix >= GW || iz >= GH) return false;
  return walk[iz * GW + ix] === 1;
}
export function isSolid(x: number, z: number): boolean {
  const ix = Math.floor((x - MAP_X0) / CELL), iz = Math.floor((z - MAP_Z0) / CELL);
  if (ix < 0 || iz < 0 || ix >= GW || iz >= GH) return true;
  return solid[iz * GW + ix] === 1;
}
export function brushAt(x: number, z: number): number {
  const ix = Math.floor((x - MAP_X0) / CELL), iz = Math.floor((z - MAP_Z0) / CELL);
  if (ix < 0 || iz < 0 || ix >= GW || iz >= GH) return 0;
  return brushGrid[iz * GW + ix];
}
export function inRiver(x: number, z: number): boolean {
  return Math.abs(x) < 3.6 && Math.abs(z) > 14 && Math.abs(z) < 42;
}

/** straight-line walkability check, sampled at half-cell spacing */
export function walkLine(x0: number, z0: number, x1: number, z1: number): boolean {
  const d = Math.hypot(x1 - x0, z1 - z0);
  const n = Math.max(1, Math.ceil(d / (CELL * 0.5)));
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    if (!isWalkable(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t)) return false;
  }
  return true;
}
/** vision line-of-sight: only solid walls/rocks block sight */
export function sightLine(x0: number, z0: number, x1: number, z1: number): boolean {
  const d = Math.hypot(x1 - x0, z1 - z0);
  const n = Math.max(1, Math.ceil(d / CELL));
  for (let i = 1; i < n; i++) {
    const t = i / n;
    if (isSolid(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t)) return false;
  }
  return true;
}

/** nearest walkable point to (x,z) */
export function nearestWalkable(x: number, z: number): Vec {
  if (isWalkable(x, z)) return { x, z };
  for (let r = 1; r < 40; r++) {
    let best: Vec | null = null, bd = Infinity;
    for (let a = 0; a < 16 + r * 4; a++) {
      const ang = (a / (16 + r * 4)) * Math.PI * 2;
      const px = x + Math.cos(ang) * r * CELL, pz = z + Math.sin(ang) * r * CELL;
      if (isWalkable(px, pz)) {
        const d = (px - x) ** 2 + (pz - z) ** 2;
        if (d < bd) { bd = d; best = { x: px, z: pz }; }
      }
    }
    if (best) return best;
  }
  return { x: clamp(x, -60, 60), z: clamp(z, -40, 40) };
}

// ---------------------------------------------------------------- A*
const gScore = new Float32Array(GW * GH);
const cameFrom = new Int32Array(GW * GH);
const stamp = new Uint32Array(GW * GH);
const closed = new Uint32Array(GW * GH);
let stampId = 0;

class Heap {
  keys: number[] = [];
  f: number[] = [];
  push(k: number, f: number) {
    this.keys.push(k); this.f.push(f);
    let i = this.keys.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.f[p] <= this.f[i]) break;
      [this.f[p], this.f[i]] = [this.f[i], this.f[p]];
      [this.keys[p], this.keys[i]] = [this.keys[i], this.keys[p]];
      i = p;
    }
  }
  pop(): number {
    const top = this.keys[0];
    const lk = this.keys.pop()!, lf = this.f.pop()!;
    if (this.keys.length) {
      this.keys[0] = lk; this.f[0] = lf;
      let i = 0;
      const n = this.keys.length;
      for (;;) {
        const l = i * 2 + 1, r = l + 1;
        let m = i;
        if (l < n && this.f[l] < this.f[m]) m = l;
        if (r < n && this.f[r] < this.f[m]) m = r;
        if (m === i) break;
        [this.f[m], this.f[i]] = [this.f[i], this.f[m]];
        [this.keys[m], this.keys[i]] = [this.keys[i], this.keys[m]];
        i = m;
      }
    }
    return top;
  }
  get size() { return this.keys.length; }
}

const NB = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.4142], [-1, 1, 1.4142], [1, -1, 1.4142], [-1, -1, 1.4142]];

/** Shortest walkable path (string-pulled). Blocked endpoints are corrected to the nearest walkable point. */
export function findPath(x0: number, z0: number, x1: number, z1: number): Vec[] {
  const s = nearestWalkable(x0, z0), g = nearestWalkable(x1, z1);
  if (walkLine(s.x, s.z, g.x, g.z)) return [g];
  const sc = toCell(s.x, s.z), gc = toCell(g.x, g.z);
  const sIdx = sc.iz * GW + sc.ix, gIdx = gc.iz * GW + gc.ix;
  stampId++;
  const heap = new Heap();
  gScore[sIdx] = 0; stamp[sIdx] = stampId; cameFrom[sIdx] = -1;
  const h = (ix: number, iz: number) => {
    const dx = Math.abs(ix - gc.ix), dz = Math.abs(iz - gc.iz);
    return Math.max(dx, dz) + 0.4142 * Math.min(dx, dz);
  };
  heap.push(sIdx, h(sc.ix, sc.iz));
  let found = false;
  let iter = 0;
  while (heap.size && iter++ < 60000) {
    const cur = heap.pop();
    if (closed[cur] === stampId) continue;
    closed[cur] = stampId;
    if (cur === gIdx) { found = true; break; }
    const cx = cur % GW, cz = (cur / GW) | 0;
    for (const [dx, dz, c] of NB) {
      const nx = cx + dx, nz = cz + dz;
      if (nx < 0 || nz < 0 || nx >= GW || nz >= GH) continue;
      const ni = nz * GW + nx;
      if (!walk[ni] || closed[ni] === stampId) continue;
      if (dx !== 0 && dz !== 0 && (!walk[cz * GW + nx] || !walk[nz * GW + cx])) continue;
      const ng = gScore[cur] + c;
      if (stamp[ni] !== stampId || ng < gScore[ni]) {
        stamp[ni] = stampId; gScore[ni] = ng; cameFrom[ni] = cur;
        heap.push(ni, ng + h(nx, nz));
      }
    }
  }
  if (!found) return [g];
  const raw: Vec[] = [];
  for (let c = gIdx; c !== -1; c = cameFrom[c]) raw.push(cellCenter(c % GW, (c / GW) | 0));
  raw.reverse();
  raw[0] = s;
  raw[raw.length - 1] = g;
  // string pulling
  const out: Vec[] = [];
  let a = 0;
  while (a < raw.length - 1) {
    let b = raw.length - 1;
    while (b > a + 1 && !walkLine(raw[a].x, raw[a].z, raw[b].x, raw[b].z)) b--;
    out.push(raw[b]);
    a = b;
  }
  return out;
}

export function teamOfBrushVisible(_x: number): boolean {
  return true;
}
