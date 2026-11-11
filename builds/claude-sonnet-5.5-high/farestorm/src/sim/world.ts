/**
 * Galeport: procedural-but-fixed city. The layout is generated from a constant seed so that the
 * map is identical on every launch (map knowledge is a core skill). Everything here is pure data +
 * queries: no rendering, no DOM.
 */
import { Rng } from './rng';
import { clamp, dist, segDist, type Rect } from './math';
import { DESTINATION_NAMES, SHORTCUT_NAMES, type DistrictId } from './data';

export type Surface = 'asphalt' | 'cobble' | 'sand' | 'grass' | 'metal' | 'shallow' | 'water';
export const SURFACES: Record<Surface, { grip: number; drag: number; accel: number; label: string }> = {
  asphalt: { grip: 1, drag: 1, accel: 1, label: 'asphalt' },
  cobble: { grip: 0.84, drag: 1.05, accel: 0.96, label: 'cobble' },
  sand: { grip: 0.66, drag: 2.1, accel: 0.8, label: 'sand' },
  grass: { grip: 0.74, drag: 1.6, accel: 0.88, label: 'grass' },
  metal: { grip: 0.88, drag: 1, accel: 1, label: 'metal deck' },
  shallow: { grip: 0.5, drag: 5, accel: 0.6, label: 'shallow water' },
  water: { grip: 0.1, drag: 9, accel: 0.1, label: 'water' },
};

export type BlockKind = 'B' | 'A' | 'N' | 'P' | 'Z' | 'S' | 'R' | 'Y' | 'W';

export interface Building {
  rect: Rect;
  h: number;
  color: number;
  roof: number;
  style: 'stucco' | 'glass' | 'neon' | 'warehouse' | 'tower' | 'hotel';
  landmark?: number; // index into world.destinations when this lot hosts a landmark
}

export interface Prop {
  kind: 'tree' | 'palm' | 'fountain' | 'container' | 'hut' | 'statue' | 'umbrella' | 'bench' | 'pond' | 'crane' | 'pillar' | 'boulder';
  x: number;
  z: number;
  r: number; // collision radius (0 = decorative)
  w?: number;
  d?: number;
  h: number;
  color: number;
  rot: number;
}

export interface Block {
  i: number;
  j: number;
  idx: number;
  rect: Rect; // road edge to road edge
  inner: Rect; // minus sidewalk
  kind: BlockKind;
  district: DistrictId;
  open: boolean;
  openSurface: Surface;
  alleyAxis?: 'x' | 'z';
  alleyCenter?: number;
  alleyHalf: number;
  buildings: Building[];
  props: Prop[];
}

export interface RoadNode {
  id: number;
  i: number;
  j: number;
  x: number;
  z: number;
}
export interface RoadEdge {
  a: number;
  b: number;
  axis: 'x' | 'z'; // axis the edge runs along
  len: number;
  width: number;
}

export interface RoadPoint {
  x: number;
  z: number;
  a: number; // edge endpoint node ids
  b: number;
  ta: number; // distance along edge from a
  len: number;
}

export interface Landmark {
  type: number;
  x: number;
  z: number;
  rect: Rect;
  h: number;
  color: number;
  accent: number;
}

export interface Destination {
  id: number;
  name: string;
  district: DistrictId;
  x: number;
  z: number;
  radius: number;
  point: RoadPoint;
  landmark: Landmark;
  blockIdx: number;
}

export type ShortcutKind = 'alley' | 'tunnel' | 'deck' | 'tram' | 'garage' | 'ferry' | 'terrace' | 'dune' | 'plaza' | 'yard';
export interface Shortcut {
  id: number;
  name: string;
  kind: ShortcutKind;
  ax: number;
  az: number;
  bx: number;
  bz: number;
  mx: number;
  mz: number;
  width: number;
  surface: Surface;
  blockIdx: number;
  covered: boolean;
  ramp: boolean;
  saves: number; // metres saved vs the road route (estimate used by tests/tools)
}

export interface Ramp {
  x: number;
  z: number;
  dx: number;
  dz: number;
  len: number;
  width: number;
  height: number;
}

export interface PickupToken {
  id: number;
  kind: 'tailwind' | 'spark';
  x: number;
  z: number;
}

export interface Hub {
  name: string;
  x: number;
  z: number;
  heading: number;
}

export interface Collider {
  kind: 'aabb' | 'circle';
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  x: number;
  z: number;
  r: number;
  tag: 'building' | 'prop' | 'wall' | 'landmark';
  soft?: boolean; // knock-over style props (soft hit: less speed loss)
}

export interface Hit {
  nx: number;
  nz: number;
  pen: number;
  tag: Collider['tag'];
  soft: boolean;
}

export interface World {
  seed: number;
  xs: number[];
  zs: number[];
  wx: number[];
  wz: number[];
  cols: number;
  rows: number;
  bounds: Rect;
  nodes: RoadNode[];
  edges: RoadEdge[];
  adj: number[][];
  dmat: Float32Array; // all-pairs node distances
  blocks: Block[];
  destinations: Destination[];
  shortcuts: Shortcut[];
  ramps: Ramp[];
  tokens: PickupToken[];
  hubs: Hub[];
  colliders: Collider[];
  pickupSpots: RoadPoint[];
  quayZ: number;
  beachX: number;
  shallowX: number;
  wallX: number;
  nodeAt(i: number, j: number): number;
  nearestNode(x: number, z: number): number;
  blockAt(x: number, z: number): Block | null;
  surfaceAt(x: number, z: number): Surface;
  isWater(x: number, z: number): boolean;
  rampHeight(x: number, z: number): number;
  rampAt(x: number, z: number): Ramp | null;
  hitTest(x: number, z: number, r: number): Hit | null;
  roadInfo(x: number, z: number): RoadInfo;
  pathLength(p: RoadPoint, q: RoadPoint): number;
  roadPose(x: number, z: number): { x: number; z: number; heading: number };
  nextHop(fromX: number, fromZ: number, target: RoadPoint): { x: number; z: number; node: number };
  isOnRoad(x: number, z: number): boolean;
}

export interface RoadInfo {
  onRoad: boolean;
  axis: 'x' | 'z' | null;
  lat: number; // signed offset from centreline along the perpendicular axis
  width: number;
  boulevard: boolean;
  intersection: boolean;
}

// ---------------------------------------------------------------- layout constants
const XS = [0, 110, 215, 330, 440, 550, 660, 770, 880];
const ZS = [0, 100, 205, 310, 415, 520, 630];
const WX = [14, 12, 13, 12, 18, 12, 13, 12, 14];
const WZ = [14, 12, 12, 18, 12, 12, 22];
const SIDEWALK = 3.5;

// block kind plan: rows j=0..5 (north->south), cols i=0..7 (west->east)
const PLAN = [
  'BABNPBSR',
  'NBABBNSS',
  'ABBZBPSR',
  'BNBZZBSS',
  'APNBABSS',
  'YWYWYWYY',
];

const PALETTES: Record<DistrictId, { walls: number[]; roofs: number[] }> = {
  lantern: { walls: [0x3a2f5c, 0x59407a, 0x7a3f6b, 0x2f4a6b, 0x6a4c93, 0x8f5a8a], roofs: [0x24203a, 0x35294f] },
  steps: { walls: [0xf2e3c4, 0xe9cfa0, 0xf4d9b8, 0xe8b9a0, 0xd9c7a8, 0xf0e8d8], roofs: [0xc8553d, 0xb5483a, 0xd9694a] },
  civic: { walls: [0xf6efe0, 0xdfe9e4, 0xbfe3e0, 0xf3e3d3, 0xcfe4f0, 0xeadfcc], roofs: [0x9fc9c4, 0xe7ded0] },
  beach: { walls: [0xfff3df, 0xffd9c2, 0xbfeeea, 0xffe9a8, 0xf9c6d0, 0xc4f0d8], roofs: [0xff7a59, 0x2ac4b3] },
  harbor: { walls: [0xc9d3d6, 0xa7b9c2, 0xd7c9b3, 0x8fa8b5, 0xc9b49a, 0xb8c6a4], roofs: [0x5a6b75, 0x7b6a5a] },
};

function districtOf(i: number, j: number): DistrictId {
  if (j === 5) return 'harbor';
  if (i >= 6) return 'beach';
  if (i <= 1 && j >= 2) return 'steps';
  if (j <= 1) return 'lantern';
  return 'civic';
}

function buildEdgeLists(cols: number, rows: number, xs: number[], zs: number[], wx: number[], wz: number[]) {
  const nodes: RoadNode[] = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) nodes.push({ id: j * cols + i, i, j, x: xs[i], z: zs[j] });
  const edges: RoadEdge[] = [];
  const adj: number[][] = nodes.map(() => []);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const a = j * cols + i;
      if (i + 1 < cols) {
        const b = a + 1;
        edges.push({ a, b, axis: 'x', len: xs[i + 1] - xs[i], width: wz[j] });
        adj[a].push(b);
        adj[b].push(a);
      }
      if (j + 1 < rows) {
        const b = a + cols;
        edges.push({ a, b, axis: 'z', len: zs[j + 1] - zs[j], width: wx[i] });
        adj[a].push(b);
        adj[b].push(a);
      }
    }
  }
  return { nodes, edges, adj };
}

function allPairs(nodes: RoadNode[], adj: number[][], edgeLen: (a: number, b: number) => number): Float32Array {
  const n = nodes.length;
  const d = new Float32Array(n * n).fill(1e9);
  for (let s = 0; s < n; s++) {
    // simple Dijkstra (n is tiny)
    const dist = new Float32Array(n).fill(1e9);
    const done = new Uint8Array(n);
    dist[s] = 0;
    for (let it = 0; it < n; it++) {
      let u = -1;
      let best = 1e9;
      for (let k = 0; k < n; k++) if (!done[k] && dist[k] < best) { best = dist[k]; u = k; }
      if (u < 0) break;
      done[u] = 1;
      for (const v of adj[u]) {
        const nd = dist[u] + edgeLen(u, v);
        if (nd < dist[v]) dist[v] = nd;
      }
    }
    for (let k = 0; k < n; k++) d[s * n + k] = dist[k];
  }
  return d;
}

function splitLots(rect: Rect, nx: number, ny: number, gap: number, rng: Rng): Rect[] {
  const lots: Rect[] = [];
  const w = rect.maxX - rect.minX;
  const h = rect.maxZ - rect.minZ;
  // jittered split lines
  const xsplit: number[] = [rect.minX];
  for (let k = 1; k < nx; k++) xsplit.push(rect.minX + (w * (k + rng.range(-0.12, 0.12))) / nx);
  xsplit.push(rect.maxX);
  const zsplit: number[] = [rect.minZ];
  for (let k = 1; k < ny; k++) zsplit.push(rect.minZ + (h * (k + rng.range(-0.12, 0.12))) / ny);
  zsplit.push(rect.maxZ);
  for (let a = 0; a < nx; a++)
    for (let b = 0; b < ny; b++)
      lots.push({
        minX: xsplit[a] + (a === 0 ? 0 : gap / 2),
        maxX: xsplit[a + 1] - (a === nx - 1 ? 0 : gap / 2),
        minZ: zsplit[b] + (b === 0 ? 0 : gap / 2),
        maxZ: zsplit[b + 1] - (b === ny - 1 ? 0 : gap / 2),
      });
  return lots;
}

export function createWorld(seed = 1337): World {
  const xs = XS, zs = ZS, wx = WX, wz = WZ;
  const cols = xs.length, rows = zs.length;
  const { nodes, edges, adj } = buildEdgeLists(cols, rows, xs, zs, wx, wz);
  const edgeLenMap = new Map<number, number>();
  for (const e of edges) { edgeLenMap.set(e.a * 1000 + e.b, e.len); edgeLenMap.set(e.b * 1000 + e.a, e.len); }
  const dmat = allPairs(nodes, adj, (a, b) => edgeLenMap.get(a * 1000 + b)!);
  const N = nodes.length;

  const bounds: Rect = { minX: xs[0] - wx[0] / 2 - 11, maxX: 962, minZ: zs[0] - wz[0] / 2 - 11, maxZ: 662 };
  const quayZ = zs[rows - 1] + wz[rows - 1] / 2 + 21; // 662
  const beachX = xs[cols - 1] + wx[cols - 1] / 2; // 887
  const shallowX = 938;
  const wallX = 962;

  const colliders: Collider[] = [];
  const addAabb = (r: Rect, tag: Collider['tag'], soft = false) =>
    colliders.push({ kind: 'aabb', minX: r.minX, maxX: r.maxX, minZ: r.minZ, maxZ: r.maxZ, x: 0, z: 0, r: 0, tag, soft });
  const addCircle = (x: number, z: number, r: number, tag: Collider['tag'], soft = false) =>
    colliders.push({ kind: 'circle', minX: x - r, maxX: x + r, minZ: z - r, maxZ: z + r, x, z, r, tag, soft });

  // perimeter walls (visible in render as sea wall / hill walls)
  const W = 40;
  addAabb({ minX: bounds.minX - W, maxX: bounds.minX, minZ: bounds.minZ - W, maxZ: bounds.maxZ + W }, 'wall');
  addAabb({ minX: bounds.minX - W, maxX: bounds.maxX + W, minZ: bounds.minZ - W, maxZ: bounds.minZ }, 'wall');
  addAabb({ minX: bounds.maxX, maxX: bounds.maxX + W, minZ: bounds.minZ - W, maxZ: bounds.maxZ + W }, 'wall');

  const blocks: Block[] = [];
  const shortcuts: Shortcut[] = [];
  const ramps: Ramp[] = [];
  const names = SHORTCUT_NAMES.slice();
  let blockIdx = 0;
  const rootRng = new Rng(seed);

  type LotRef = { block: Block; lot: Rect; side: 'N' | 'S' | 'E' | 'W'; building: Building };
  const lotRefs: LotRef[] = [];

  for (let j = 0; j < rows - 1; j++) {
    for (let i = 0; i < cols - 1; i++) {
      const kind = PLAN[j][i] as BlockKind;
      const district = districtOf(i, j);
      const rng = new Rng((seed * 7919 + blockIdx * 104729) >>> 0);
      const rect: Rect = { minX: xs[i] + wx[i] / 2, maxX: xs[i + 1] - wx[i + 1] / 2, minZ: zs[j] + wz[j] / 2, maxZ: zs[j + 1] - wz[j + 1] / 2 };
      const inner: Rect = { minX: rect.minX + SIDEWALK, maxX: rect.maxX - SIDEWALK, minZ: rect.minZ + SIDEWALK, maxZ: rect.maxZ - SIDEWALK };
      const open = kind === 'P' || kind === 'Z' || kind === 'S' || kind === 'Y';
      const openSurface: Surface = kind === 'P' ? 'grass' : kind === 'S' ? 'sand' : kind === 'Z' ? 'cobble' : 'metal';
      const block: Block = { i, j, idx: blockIdx, rect, inner, kind, district, open, openSurface, alleyHalf: 3.8, buildings: [], props: [] };
      const pal = PALETTES[district];
      const cx = (rect.minX + rect.maxX) / 2;
      const cz = (rect.minZ + rect.maxZ) / 2;

      const heightFor = (): number => {
        switch (district) {
          case 'lantern': return rng.range(14, 30);
          case 'steps': return rng.range(9, 22);
          case 'civic': return rng.range(20, 62);
          case 'beach': return rng.range(10, 24);
          default: return rng.range(8, 15);
        }
      };
      const styleFor = (): Building['style'] => {
        if (district === 'lantern') return rng.chance(0.55) ? 'neon' : 'stucco';
        if (district === 'civic') return rng.chance(0.55) ? 'glass' : 'tower';
        if (district === 'harbor') return 'warehouse';
        if (district === 'beach') return 'hotel';
        return 'stucco';
      };
      const makeBuilding = (r: Rect): Building => ({
        rect: r, h: heightFor(), color: rng.pick(pal.walls), roof: rng.pick(pal.roofs), style: styleFor(),
      });
      const pushBuilding = (r: Rect, side: LotRef['side']) => {
        const b = makeBuilding(r);
        block.buildings.push(b);
        lotRefs.push({ block, lot: r, side, building: b });
      };

      if (kind === 'B' || kind === 'R') {
        const nx = rng.chance(0.4) ? 3 : 2;
        const lots = splitLots(inner, nx, 2, 5, rng);
        lots.forEach((l, k) => {
          // front side: the lot at row 0 faces north, row 1 faces south
          pushBuilding(l, k % 2 === 0 ? 'N' : 'S');
        });
      } else if (kind === 'A' || kind === 'N' || kind === 'W') {
        const axisX = kind === 'A';
        block.alleyAxis = axisX ? 'x' : 'z';
        const half = block.alleyHalf;
        if (axisX) {
          block.alleyCenter = cz + rng.range(-5, 5);
          const c = block.alleyCenter;
          const north: Rect = { minX: inner.minX, maxX: inner.maxX, minZ: inner.minZ, maxZ: c - half };
          const south: Rect = { minX: inner.minX, maxX: inner.maxX, minZ: c + half, maxZ: inner.maxZ };
          splitLots(north, 2, 1, 5, rng).forEach((l) => pushBuilding(l, 'N'));
          splitLots(south, 2, 1, 5, rng).forEach((l) => pushBuilding(l, 'S'));
        } else {
          block.alleyCenter = cx + rng.range(-5, 5);
          const c = block.alleyCenter;
          const west: Rect = { minX: inner.minX, maxX: c - half, minZ: inner.minZ, maxZ: inner.maxZ };
          const east: Rect = { minX: c + half, maxX: inner.maxX, minZ: inner.minZ, maxZ: inner.maxZ };
          splitLots(west, 1, 2, 5, rng).forEach((l, k) => pushBuilding(l, k === 0 ? 'N' : 'S'));
          splitLots(east, 1, 2, 5, rng).forEach((l, k) => pushBuilding(l, k === 0 ? 'N' : 'S'));
        }
      } else {
        // open blocks: choose a diagonal corridor kept clear of props
        const flip = rng.chance(0.5);
        const inset = 9;
        const ax = inner.minX + inset, bx = inner.maxX - inset;
        const az = flip ? inner.minZ + inset : inner.maxZ - inset;
        const bz = flip ? inner.maxZ - inset : inner.minZ + inset;
        const corridorHalf = 6.5;
        const clearOf = (x: number, z: number, r: number) => segDist(x, z, ax, az, bx, bz) > corridorHalf + r;
        const tries = kind === 'Y' ? 26 : kind === 'S' ? 18 : 22;
        for (let t = 0; t < tries; t++) {
          const x = rng.range(inner.minX + 3, inner.maxX - 3);
          const z = rng.range(inner.minZ + 3, inner.maxZ - 3);
          if (kind === 'P') {
            if (!clearOf(x, z, 1.5)) continue;
            block.props.push({ kind: 'tree', x, z, r: 0.9, h: rng.range(5, 8), color: rng.pick([0x2f9e5b, 0x3dbb6a, 0x1f8a5e]), rot: 0 });
          } else if (kind === 'S') {
            if (!clearOf(x, z, 2)) continue;
            const k = rng.next();
            if (k < 0.55) block.props.push({ kind: 'palm', x, z, r: 0.6, h: rng.range(6, 9), color: 0x2fa85a, rot: rng.range(0, 6.28) });
            else if (k < 0.85) block.props.push({ kind: 'umbrella', x, z, r: 0, h: 2.6, color: rng.pick([0xff5e57, 0x19b3a6, 0xffd34d, 0xff3df2]), rot: 0 });
            else block.props.push({ kind: 'hut', x, z, r: 0, w: 5, d: 4, h: 3.2, color: rng.pick([0xfff1e0, 0x7be0b0, 0xffb7a0]), rot: 0 });
          } else if (kind === 'Z') {
            if (!clearOf(x, z, 2)) continue;
            if (rng.chance(0.5)) block.props.push({ kind: 'bench', x, z, r: 0, w: 2.2, d: 0.7, h: 0.9, color: 0x8a5a3b, rot: 0 });
            else block.props.push({ kind: 'tree', x, z, r: 0.8, h: rng.range(4, 6), color: 0x3dbb6a, rot: 0 });
          } else {
            const w = 6.1, d = 2.5;
            if (!clearOf(x, z, 4.2)) continue;
            block.props.push({ kind: 'container', x, z, r: 0, w: rng.chance(0.5) ? w : d, d: rng.chance(0.5) ? d : w, h: 2.6 * (rng.chance(0.3) ? 2 : 1), color: rng.pick([0xe2574c, 0x2f6bff, 0x19b3a6, 0xf2a93b, 0xcfd8dc]), rot: 0 });
          }
        }
        if (kind === 'Z') {
          // fountain + statues in the off-diagonal corners
          const fx = flip ? inner.maxX - 16 : inner.minX + 16;
          const fz = flip ? inner.minZ + 16 : inner.minZ + 16;
          if (clearOf(fx, fz, 5)) block.props.push({ kind: 'fountain', x: fx, z: fz, r: 4, h: 3, color: 0x7fd8e8, rot: 0 });
          const sx = flip ? inner.minX + 16 : inner.maxX - 16;
          const sz = flip ? inner.maxZ - 16 : inner.maxZ - 16;
          if (clearOf(sx, sz, 3)) block.props.push({ kind: 'statue', x: sx, z: sz, r: 1.6, h: 6, color: 0xe6d6b8, rot: 0 });
        }
        if (kind === 'S') {
          // a rock outcrop to frame the dune line
          const rx = flip ? inner.minX + 12 : inner.maxX - 12;
          const rz = flip ? inner.maxZ - 12 : inner.minZ + 12;
          if (clearOf(rx, rz, 3)) block.props.push({ kind: 'boulder', x: rx, z: rz, r: 2.6, h: 3.2, color: 0xc9b79c, rot: 0 });
        }
        for (const p of block.props) {
          if (p.r > 0) addCircle(p.x, p.z, p.r, 'prop');
          else if (p.kind === 'container' || p.kind === 'hut') {
            const w = (p.w ?? 4) / 2, d = (p.d ?? 4) / 2;
            addAabb({ minX: p.x - w, maxX: p.x + w, minZ: p.z - d, maxZ: p.z + d }, 'prop');
          }
        }
        // the open-block shortcut
        const kindMap: Record<string, ShortcutKind> = { P: 'terrace', S: 'dune', Z: 'plaza', Y: 'yard' };
        const withRamp = kind === 'S' || kind === 'Y' || (kind === 'P' && j === 0);
        shortcuts.push({
          id: shortcuts.length, name: names[shortcuts.length % names.length], kind: kindMap[kind], ax, az, bx, bz,
          mx: (ax + bx) / 2, mz: (az + bz) / 2, width: corridorHalf * 2, surface: openSurface, blockIdx, covered: false, ramp: withRamp,
          saves: 0,
        });
        if (withRamp) {
          const dxl = bx - ax, dzl = bz - az;
          const L = Math.hypot(dxl, dzl);
          const ux = dxl / L, uz = dzl / L;
          const t = 0.32;
          ramps.push({ x: ax + dxl * t, z: az + dzl * t, dx: ux, dz: uz, len: 13, width: 7.5, height: 3.1 });
        }
      }

      // building colliders
      for (const b of block.buildings) addAabb(b.rect, 'building');

      // alley shortcut
      if (block.alleyAxis) {
        const kmap: ShortcutKind[] = block.district === 'harbor' ? ['ferry', 'deck'] : block.district === 'civic' ? ['garage', 'tram', 'tunnel'] : block.district === 'beach' ? ['tunnel'] : block.district === 'steps' ? ['alley', 'tram'] : ['alley', 'tunnel', 'deck'];
        const sk = rng.pick(kmap);
        const covered = sk === 'tunnel' || sk === 'garage';
        const surface: Surface = sk === 'deck' || sk === 'ferry' ? 'metal' : sk === 'garage' ? 'asphalt' : 'cobble';
        const horizontal = block.alleyAxis === 'x';
        const c = block.alleyCenter!;
        shortcuts.push({
          id: shortcuts.length, name: names[shortcuts.length % names.length], kind: sk,
          ax: horizontal ? rect.minX : c, az: horizontal ? c : rect.minZ,
          bx: horizontal ? rect.maxX : c, bz: horizontal ? c : rect.maxZ,
          mx: horizontal ? (rect.minX + rect.maxX) / 2 : c, mz: horizontal ? c : (rect.minZ + rect.maxZ) / 2,
          width: block.alleyHalf * 2, surface, blockIdx, covered, ramp: false, saves: 0,
        });
      }

      blocks.push(block);
      blockIdx++;
    }
  }
  void rootRng;

  // ---- road helper geometry
  const nodeAt = (i: number, j: number) => j * cols + i;
  const nearestNode = (x: number, z: number) => {
    let bi = 0, bj = 0, bd = 1e9;
    for (let i = 0; i < cols; i++) if (Math.abs(xs[i] - x) < bd) { bd = Math.abs(xs[i] - x); bi = i; }
    bd = 1e9;
    for (let j = 0; j < rows; j++) if (Math.abs(zs[j] - z) < bd) { bd = Math.abs(zs[j] - z); bj = j; }
    return nodeAt(bi, bj);
  };

  const blockAt = (x: number, z: number): Block | null => {
    let bi = -1, bj = -1;
    for (let i = 0; i < cols - 1; i++) if (x >= xs[i] + wx[i] / 2 && x <= xs[i + 1] - wx[i + 1] / 2) { bi = i; break; }
    if (bi < 0) return null;
    for (let j = 0; j < rows - 1; j++) if (z >= zs[j] + wz[j] / 2 && z <= zs[j + 1] - wz[j + 1] / 2) { bj = j; break; }
    if (bj < 0) return null;
    return blocks[bj * (cols - 1) + bi];
  };

  const makeRoadPoint = (x: number, z: number, axis: 'x' | 'z', ia: number, ja: number): RoadPoint => {
    // edge starting at node (ia, ja) running along axis
    const a = nodeAt(ia, ja);
    const b = axis === 'x' ? nodeAt(ia + 1, ja) : nodeAt(ia, ja + 1);
    const len = axis === 'x' ? xs[ia + 1] - xs[ia] : zs[ja + 1] - zs[ja];
    const ta = axis === 'x' ? x - xs[ia] : z - zs[ja];
    return { x, z, a, b, ta, len };
  };

  // ---- destinations & landmarks
  const dRng = new Rng(seed ^ 0xbeef);
  const quota: Record<DistrictId, number> = { lantern: 7, steps: 5, civic: 9, beach: 4, harbor: 7 };
  const destinations: Destination[] = [];
  const usedBlock = new Map<number, number>();
  let lmType = 0;
  (Object.keys(quota) as DistrictId[]).forEach((dist) => {
    const pool = dRng.shuffle(lotRefs.filter((l) => l.block.district === dist && !l.block.open));
    const names2 = DESTINATION_NAMES[dist];
    let n = 0;
    for (const pass of [0, 1]) for (const ref of pool) {
      if (n >= quota[dist]) break;
      const used = usedBlock.get(ref.block.idx) ?? 0;
      if (used >= (pass === 0 ? 2 : 3)) continue;
      if (ref.building.landmark !== undefined) continue;
      // second landmark in a block must face the opposite side
      const blk = ref.block;
      const lot = ref.lot;
      const lx = (lot.minX + lot.maxX) / 2;
      const lz = (lot.minZ + lot.maxZ) / 2;
      let px = lx, pz = lz, axis: 'x' | 'z';
      let ia: number, ja: number;
      if (ref.side === 'N') { pz = blk.rect.minZ - 3.4; axis = 'x'; ia = blk.i; ja = blk.j; }
      else if (ref.side === 'S') { pz = blk.rect.maxZ + 3.4; axis = 'x'; ia = blk.i; ja = blk.j + 1; }
      else if (ref.side === 'E') { px = blk.rect.maxX + 3.4; axis = 'z'; ia = blk.i + 1; ja = blk.j; }
      else { px = blk.rect.minX - 3.4; axis = 'z'; ia = blk.i; ja = blk.j; }
      // keep ring away from intersections
      const t = axis === 'x' ? px - xs[ia] : pz - zs[ja];
      const len = axis === 'x' ? xs[ia + 1] - xs[ia] : zs[ja + 1] - zs[ja];
      const margin = pass === 0 ? 26 : 19;
      if (t < margin || t > len - margin) continue;
      const w = lot.maxX - lot.minX, d = lot.maxZ - lot.minZ;
      if (w < 12 || d < 12) continue;
      const id = destinations.length;
      const accentPool = [0xff5e57, 0x19b3a6, 0x2f6bff, 0xffb02e, 0xff3df2, 0x7be0b0, 0xa855f7];
      const landmark: Landmark = {
        type: lmType++ % 12, x: lx, z: lz, rect: lot, h: 0, color: ref.building.color, accent: accentPool[(id * 3 + 1) % accentPool.length],
      };
      landmark.h = 26 + ((id * 7) % 5) * 7;
      ref.building.landmark = id;
      ref.building.h = landmark.h;
      destinations.push({
        id, name: names2[n], district: dist, x: px, z: pz, radius: 8.5,
        point: makeRoadPoint(px, pz, axis, ia, ja), landmark, blockIdx: blk.idx,
      });
      usedBlock.set(blk.idx, used + 1);
      n++;
    }
  });

  // pickup spots: curb lanes on every edge
  const pickupSpots: RoadPoint[] = [];
  for (const e of edges) {
    const A = nodes[e.a];
    for (const f of [0.28, 0.72]) {
      for (const side of [-1, 1]) {
        let x: number, z: number;
        if (e.axis === 'x') { x = A.x + e.len * f; z = A.z + side * (e.width / 2 - 3.1); }
        else { x = A.x + side * (e.width / 2 - 3.1); z = A.z + e.len * f; }
        pickupSpots.push(makeRoadPoint(x, z, e.axis, A.i, A.j));
      }
    }
  }

  // Tokens (tailwind / clock sparks) placed in shortcut corridors and off-line corners
  const tokens: PickupToken[] = [];
  const tRng = new Rng(seed ^ 0x51ed);
  shortcuts.forEach((s, k) => {
    if (k % 2 === 0) tokens.push({ id: tokens.length, kind: 'tailwind', x: s.mx + (s.bx - s.ax) * 0.18, z: s.mz + (s.bz - s.az) * 0.18 });
  });
  const sparkSpots = [3, 9, 14, 17, 11];
  sparkSpots.forEach((k) => {
    const s = shortcuts[k % shortcuts.length];
    tokens.push({ id: tokens.length, kind: 'spark', x: s.mx - (s.bx - s.ax) * 0.1, z: s.mz - (s.bz - s.az) * 0.1 });
  });
  void tRng;

  // shortcut time savings estimate: (graph route between ends) - straight line
  for (const s of shortcuts) {
    const na = nearestNode(s.ax, s.az), nb = nearestNode(s.bx, s.bz);
    const straight = dist(s.ax, s.az, s.bx, s.bz);
    const road = Math.abs(s.ax - s.bx) + Math.abs(s.az - s.bz);
    s.saves = Math.max(0, road - straight);
    void na; void nb;
  }

  const hubs: Hub[] = [
    { name: 'Harbor Hub', x: xs[4] - wx[4] / 4, z: zs[5] + 20, heading: 0 },
    { name: 'Crown Hub', x: xs[4] + wx[4] / 4, z: zs[3] - 30, heading: Math.PI },
    { name: 'Beach Hub', x: xs[6] + 30, z: zs[1] + wz[1] / 4, heading: Math.PI / 2 },
  ];

  // ---- spatial hash
  const CELL = 16;
  const hash = new Map<number, Collider[]>();
  const key = (cx: number, cz: number) => (cx + 200) * 1000 + (cz + 200);
  for (const c of colliders) {
    const x0 = Math.floor(c.minX / CELL), x1 = Math.floor(c.maxX / CELL);
    const z0 = Math.floor(c.minZ / CELL), z1 = Math.floor(c.maxZ / CELL);
    for (let a = x0; a <= x1; a++) for (let b = z0; b <= z1; b++) {
      const k = key(a, b);
      let arr = hash.get(k);
      if (!arr) { arr = []; hash.set(k, arr); }
      arr.push(c);
    }
  }
  // landmark footprints collide as buildings already (their lot rect is the building rect)

  const hitTest = (x: number, z: number, r: number): Hit | null => {
    const x0 = Math.floor((x - r) / CELL), x1 = Math.floor((x + r) / CELL);
    const z0 = Math.floor((z - r) / CELL), z1 = Math.floor((z + r) / CELL);
    let best: Hit | null = null;
    for (let a = x0; a <= x1; a++) for (let b = z0; b <= z1; b++) {
      const arr = hash.get(key(a, b));
      if (!arr) continue;
      for (const c of arr) {
        let nx: number, nz: number, pen: number;
        if (c.kind === 'circle') {
          const dx = x - c.x, dz = z - c.z;
          const d = Math.hypot(dx, dz);
          pen = r + c.r - d;
          if (pen <= 0) continue;
          if (d < 1e-5) { nx = 1; nz = 0; } else { nx = dx / d; nz = dz / d; }
        } else {
          const qx = clamp(x, c.minX, c.maxX), qz = clamp(z, c.minZ, c.maxZ);
          const dx = x - qx, dz = z - qz;
          const d2 = dx * dx + dz * dz;
          if (d2 >= r * r) continue;
          if (d2 > 1e-8) { const d = Math.sqrt(d2); pen = r - d; nx = dx / d; nz = dz / d; }
          else {
            // centre inside the box: push out along the shallowest axis
            const l = x - c.minX, rr = c.maxX - x, t = z - c.minZ, bt = c.maxZ - z;
            const m = Math.min(l, rr, t, bt);
            pen = r + m;
            if (m === l) { nx = -1; nz = 0; } else if (m === rr) { nx = 1; nz = 0; } else if (m === t) { nx = 0; nz = -1; } else { nx = 0; nz = 1; }
          }
        }
        if (!best || pen > best.pen) best = { nx, nz, pen, tag: c.tag, soft: !!c.soft };
      }
    }
    return best;
  };

  const rampAt = (x: number, z: number): Ramp | null => {
    for (const r of ramps) {
      const rx = x - r.x, rz = z - r.z;
      const along = rx * r.dx + rz * r.dz;
      const side = -rx * r.dz + rz * r.dx;
      if (along >= 0 && along <= r.len && Math.abs(side) <= r.width / 2) return r;
    }
    return null;
  };
  const rampHeight = (x: number, z: number): number => {
    const r = rampAt(x, z);
    if (!r) return 0;
    const along = (x - r.x) * r.dx + (z - r.z) * r.dz;
    return (along / r.len) * r.height;
  };

  const isWater = (x: number, z: number) => z > quayZ;

  const roadInfo = (x: number, z: number): RoadInfo => {
    let vi = -1, hj = -1;
    for (let i = 0; i < cols; i++) if (Math.abs(x - xs[i]) <= wx[i] / 2) { vi = i; break; }
    for (let j = 0; j < rows; j++) if (Math.abs(z - zs[j]) <= wz[j] / 2) { hj = j; break; }
    const inZ = z >= zs[0] - wz[0] / 2 && z <= zs[rows - 1] + wz[rows - 1] / 2;
    const inX = x >= xs[0] - wx[0] / 2 && x <= xs[cols - 1] + wx[cols - 1] / 2;
    if (vi >= 0 && hj >= 0) return { onRoad: true, axis: null, lat: 0, width: wx[vi], boulevard: false, intersection: true };
    if (vi >= 0 && inZ) return { onRoad: true, axis: 'z', lat: x - xs[vi], width: wx[vi], boulevard: vi === 4, intersection: false };
    if (hj >= 0 && inX) return { onRoad: true, axis: 'x', lat: z - zs[hj], width: wz[hj], boulevard: hj === 3 || hj === rows - 1, intersection: false };
    return { onRoad: false, axis: null, lat: 0, width: 0, boulevard: false, intersection: false };
  };

  const surfaceAt = (x: number, z: number): Surface => {
    if (z > quayZ) return 'water';
    if (x > shallowX) return 'shallow';
    if (z > zs[rows - 1] + wz[rows - 1] / 2) return 'metal';
    if (x > beachX) return 'sand';
    const blk = blockAt(x, z);
    if (blk) {
      if (blk.open) {
        const r = blk.rect;
        if (x - r.minX < SIDEWALK || r.maxX - x < SIDEWALK || z - r.minZ < SIDEWALK || r.maxZ - z < SIDEWALK) return 'asphalt';
        return blk.openSurface;
      }
      if (blk.alleyAxis) {
        const sc = shortcuts.find((s) => s.blockIdx === blk.idx);
        if (sc) {
          const inside = blk.alleyAxis === 'x' ? Math.abs(z - blk.alleyCenter!) < blk.alleyHalf + 0.5 : Math.abs(x - blk.alleyCenter!) < blk.alleyHalf + 0.5;
          if (inside) return sc.surface;
        }
      }
      return 'asphalt';
    }
    // roads: cobbles in Old Steps
    if (x < xs[2] + wx[2] / 2 && z > zs[2] - wz[2] / 2) return 'cobble';
    return 'asphalt';
  };

  const isOnRoad = (x: number, z: number) => roadInfo(x, z).onRoad;

  const pathLength = (p: RoadPoint, q: RoadPoint): number => {
    let best = 1e9;
    if (p.a === q.a && p.b === q.b) best = Math.abs(p.ta - q.ta);
    const pe: [number, number][] = [[p.a, p.ta], [p.b, p.len - p.ta]];
    const qe: [number, number][] = [[q.a, q.ta], [q.b, q.len - q.ta]];
    for (const [pn, pd] of pe) for (const [qn, qd] of qe) best = Math.min(best, pd + dmat[pn * N + qn] + qd);
    return best;
  };

  const roadPose = (x: number, z: number) => {
    // snap to the nearest road lane centre, pointing along the road toward the city centre
    let best = { x, z, heading: 0 };
    let bd = 1e9;
    for (let i = 0; i < cols; i++) {
      const lane = xs[i] + (z < (zs[0] + zs[rows - 1]) / 2 ? -wx[i] / 4 : wx[i] / 4);
      const d = Math.abs(x - lane);
      if (d < bd) { bd = d; best = { x: lane, z: clamp(z, zs[0] + 25, zs[rows - 1] - 25), heading: z < (zs[0] + zs[rows - 1]) / 2 ? 0 : Math.PI }; }
    }
    for (let j = 0; j < rows; j++) {
      const lane = zs[j] + (x < (xs[0] + xs[cols - 1]) / 2 ? wz[j] / 4 : -wz[j] / 4);
      const d = Math.abs(z - lane);
      if (d < bd) { bd = d; best = { x: clamp(x, xs[0] + 25, xs[cols - 1] - 25), z: lane, heading: x < (xs[0] + xs[cols - 1]) / 2 ? Math.PI / 2 : -Math.PI / 2 }; }
    }
    return best;
  };

  /** next intersection to steer for to reach `target` along the road graph (arrow guidance). */
  const nextHop = (fx: number, fz: number, target: RoadPoint) => {
    const restFrom = (c: number) => Math.min(dmat[c * N + target.a] + target.ta, dmat[c * N + target.b] + (target.len - target.ta));
    const near = nearestNode(fx, fz);
    const bn = nodes[near];
    if (dist(fx, fz, bn.x, bn.z) < 18) {
      // at a decision point: aim at the target itself when it lies on an adjoining road,
      // otherwise at the neighbouring intersection that continues the shortest route
      if (target.a === near || target.b === near) return { x: target.x, z: target.z, node: near };
      let nb = adj[near][0], ns = 1e9;
      for (const c of adj[near]) {
        const sc = dist(bn.x, bn.z, nodes[c].x, nodes[c].z) + restFrom(c);
        if (sc < ns) { ns = sc; nb = c; }
      }
      return { x: nodes[nb].x, z: nodes[nb].z, node: nb };
    }
    // on a road segment: find it, then pick the endpoint that gives the cheapest route
    let be: RoadEdge = edges[0], bd = 1e9;
    for (const e of edges) {
      const A = nodes[e.a], B = nodes[e.b];
      const d = segDist(fx, fz, A.x, A.z, B.x, B.z);
      if (d < bd) { bd = d; be = e; }
    }
    if ((target.a === be.a && target.b === be.b) || (target.a === be.b && target.b === be.a)) return { x: target.x, z: target.z, node: be.a };
    const A = nodes[be.a], B = nodes[be.b];
    const cA = dist(fx, fz, A.x, A.z) + restFrom(be.a);
    const cB = dist(fx, fz, B.x, B.z) + restFrom(be.b);
    const pick = cA <= cB ? A : B;
    return { x: pick.x, z: pick.z, node: pick.id };
  };

  return {
    seed, xs, zs, wx, wz, cols, rows, bounds, nodes, edges, adj, dmat, blocks, destinations, shortcuts, ramps, tokens, hubs, colliders,
    pickupSpots, quayZ, beachX, shallowX, wallX, nodeAt, nearestNode, blockAt, surfaceAt, isWater, rampHeight, rampAt, hitTest, roadInfo,
    pathLength, roadPose, nextHop, isOnRoad,
  };
}

let cached: World | null = null;
export function getWorld(): World {
  if (!cached) cached = createWorld();
  return cached;
}
