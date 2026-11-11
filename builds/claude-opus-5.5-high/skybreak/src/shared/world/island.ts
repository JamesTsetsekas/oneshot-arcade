// The Highwake — authored-by-code island. This module produces the
// lightweight gameplay/collision source of truth (heightfield, boxes,
// traversal links, loot sockets, valid storm centres) plus a separate list of
// render-only decor. Server and client generate it identically from a fixed
// island seed; a manifest hash validates both sides agree.

import { fbm, fnv1a, Rng } from '../rng';
import { clamp, lerp, smoothstep } from '../math';

export const ISLAND_SEED = 0x5ab7;
export const WORLD_HALF = 600;
export const GRID_RES = 2; // metres per heightfield sample
export const GRID_N = WORLD_HALF * 2 / GRID_RES + 1; // 601
export const WATER_LEVEL = 0;
export const BOUNDARY = 640;

export type Mat =
  | 'stone' | 'plaster' | 'wood' | 'metal' | 'copper' | 'roofRed' | 'roofTeal' | 'roofGold'
  | 'ruin' | 'dock' | 'container' | 'crate' | 'rock' | 'trunk' | 'glass' | 'kiln' | 'pier' | 'target';

export type BoxKind = 'wall' | 'floor' | 'roof' | 'prop' | 'rock' | 'tree' | 'stair' | 'foundation';

export interface Box {
  minX: number; minY: number; minZ: number;
  maxX: number; maxY: number; maxZ: number;
  mat: Mat;
  kind: BoxKind;
  loc: number; // location index, -1 = wild
}

export interface Zipline { id: number; a: { x: number; y: number; z: number }; b: { x: number; y: number; z: number } }
export interface Ascender { id: number; x: number; z: number; y0: number; y1: number; exitX: number; exitZ: number }
export interface Vent { id: number; x: number; y: number; z: number; r: number }
export interface Hazard { id: number; minX: number; maxX: number; minZ: number; maxZ: number; y0: number; y1: number; dps: number }
export interface Tree { x: number; y: number; z: number; h: number; r: number; kind: 'pine' | 'broad' | 'fruit' }
export interface LootSocket { x: number; y: number; z: number; tier: number; cluster: number; loc: number }
export interface ContainerSpawn { kind: 'chest' | 'locker'; x: number; y: number; z: number; yaw: number; tier: number; loc: number }
export interface Location { id: number; name: string; x: number; z: number; r: number; tier: number; kind: 'named' | 'landmark' | 'pier' }
export interface Decor { type: string; x: number; y: number; z: number; yaw: number; s: number; s2?: number; color?: string }
export interface WaterVolume { minX: number; maxX: number; minZ: number; maxZ: number; level: number }

export interface IslandData {
  heights: Float32Array;
  boxes: Box[];
  ziplines: Zipline[];
  ascenders: Ascender[];
  vents: Vent[];
  hazards: Hazard[];
  trees: Tree[];
  sockets: LootSocket[];
  containers: ContainerSpawn[];
  locations: Location[];
  decor: Decor[];
  stormCenters: { x: number; z: number; cover: number }[];
  pier: { minX: number; maxX: number; minZ: number; maxZ: number; y: number; spawn: { x: number; y: number; z: number } };
  manifestHash: string;
}

// ---------------------------------------------------------------- locations
export const NAMED: readonly Omit<Location, 'id'>[] = [
  { name: 'Aerie Market', x: -200, z: 170, r: 80, tier: 3, kind: 'named' },
  { name: 'Sunken Array', x: 235, z: 245, r: 75, tier: 2, kind: 'named' },
  { name: 'Kilnworks', x: 250, z: -205, r: 75, tier: 3, kind: 'named' },
  { name: 'Orchard Steps', x: -250, z: -205, r: 85, tier: 1, kind: 'named' },
  { name: 'Wind Abbey', x: 15, z: -15, r: 45, tier: 2, kind: 'named' },
  { name: 'Breaker Docks', x: 420, z: 10, r: 70, tier: 2, kind: 'named' },
  { name: 'Watch Huts', x: -60, z: 385, r: 25, tier: 1, kind: 'landmark' },
  { name: 'Bridge Station', x: 95, z: 140, r: 25, tier: 1, kind: 'landmark' },
  { name: 'Old Quarry', x: -330, z: 30, r: 30, tier: 1, kind: 'landmark' },
  { name: 'Campsite', x: 100, z: -390, r: 22, tier: 1, kind: 'landmark' },
  { name: 'Copper Turbine', x: 300, z: -380, r: 20, tier: 1, kind: 'landmark' },
  { name: 'Hollow Cave', x: -390, z: 230, r: 22, tier: 1, kind: 'landmark' },
  { name: 'Relay Shack', x: 300, z: 360, r: 20, tier: 1, kind: 'landmark' },
  { name: 'Skiff Wreck', x: -40, z: -440, r: 25, tier: 1, kind: 'landmark' },
];

export const PIER_CENTER = { x: -470, z: -470 };

// ---------------------------------------------------------------- terrain
function naturalHeight(x: number, z: number): number {
  const r = Math.sqrt(x * x + z * z);
  const ang = Math.atan2(z, x);
  const edge = 470 + 55 * (fbm(ISLAND_SEED + 7, Math.cos(ang) * 2.2 + 5, Math.sin(ang) * 2.2 + 5, 3) - 0.5) * 2;
  const mask = smoothstep(edge + 25, edge - 70, r);
  const hills = fbm(ISLAND_SEED, x / 210 + 11, z / 210 + 3, 5);
  const ridgeN = fbm(ISLAND_SEED + 3, x / 140 - 4, z / 140 + 9, 4);
  const ridge = 1 - Math.abs(ridgeN * 2 - 1);
  const detail = fbm(ISLAND_SEED + 5, x / 28, z / 28, 2) - 0.5;
  const land = 5 + hills * 30 + ridge * ridge * 16 + detail * 1.6;
  return lerp(-14, land, mask);
}

interface Shaper { (x: number, z: number, h: number): number }

const plateau = (cx: number, cz: number, r: number, fall: number, target: number): Shaper => (x, z, h) => {
  const d = Math.hypot(x - cx, z - cz);
  if (d > r + fall) return h;
  return lerp(h, target, smoothstep(r + fall, r, d));
};

const SHAPERS: Shaper[] = [
  plateau(-200, 170, 78, 50, 20), // Aerie Market
  plateau(250, -205, 72, 45, 14), // Kilnworks
  // Wind Abbey hill
  (x, z, h) => {
    const d = Math.hypot(x - 15, z + 15);
    if (d > 200) return h;
    const t = smoothstep(200, 42, d);
    return lerp(h, 52 + 4 * smoothstep(42, 0, d), t);
  },
  // Sunken Array: flooded basin with rim.
  (x, z, h) => {
    const d = Math.hypot(x - 235, z - 245);
    if (d > 130) return h;
    const rim = lerp(h, 8, smoothstep(130, 95, d));
    return lerp(rim, -4.5, smoothstep(72, 52, d));
  },
  // Breaker Docks: low shelf by the eastern shore.
  (x, z, h) => {
    const dz = Math.abs(z - 10);
    if (x < 330 || dz > 110) return h;
    const w = smoothstep(110, 75, dz) * smoothstep(330, 370, x);
    const shelf = x < 478 ? 3 : lerp(3, -10, smoothstep(478, 490, x));
    return lerp(h, shelf, w);
  },
  // Orchard Steps: four terraces descending to the south, 1.2m each.
  (x, z, h) => {
    const cx = -250, cz = -205;
    const dx = Math.abs(x - cx), dz = Math.abs(z - cz);
    if (dx > 120 || dz > 100) return h;
    const w = smoothstep(120, 80, dx) * smoothstep(100, 70, dz);
    const step = clamp(Math.floor((z - (cz - 64)) / 32), 0, 3);
    return lerp(h, 9 + step * 1.2, w);
  },
  plateau(-330, 30, 32, 30, 6), // quarry pit floor
  plateau(PIER_CENTER.x, PIER_CENTER.z, 0, 1, -14),
];

function shapedHeight(x: number, z: number): number {
  let h = naturalHeight(x, z);
  for (const s of SHAPERS) h = s(x, z, h);
  return h;
}

export function sampleGrid(heights: Float32Array, x: number, z: number): number {
  const gx = clamp((x + WORLD_HALF) / GRID_RES, 0, GRID_N - 1.001);
  const gz = clamp((z + WORLD_HALF) / GRID_RES, 0, GRID_N - 1.001);
  const ix = Math.floor(gx), iz = Math.floor(gz);
  const fx = gx - ix, fz = gz - iz;
  const i = iz * GRID_N + ix;
  const a = heights[i], b = heights[i + 1], c = heights[i + GRID_N], d = heights[i + GRID_N + 1];
  return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
}

// ---------------------------------------------------------------- builder
class Builder {
  boxes: Box[] = [];
  ziplines: Zipline[] = [];
  ascenders: Ascender[] = [];
  vents: Vent[] = [];
  hazards: Hazard[] = [];
  trees: Tree[] = [];
  sockets: LootSocket[] = [];
  containers: ContainerSpawn[] = [];
  decor: Decor[] = [];
  cluster = 0;
  rng = new Rng(ISLAND_SEED * 31 + 7);
  constructor(public heights: Float32Array) {}

  h(x: number, z: number) { return sampleGrid(this.heights, x, z); }

  box(minX: number, minY: number, minZ: number, maxX: number, maxY: number, maxZ: number, mat: Mat, kind: BoxKind, loc: number) {
    this.boxes.push({
      minX: Math.min(minX, maxX), minY: Math.min(minY, maxY), minZ: Math.min(minZ, maxZ),
      maxX: Math.max(minX, maxX), maxY: Math.max(minY, maxY), maxZ: Math.max(minZ, maxZ), mat, kind, loc,
    });
  }

  footprintHeights(cx: number, cz: number, hw: number, hd: number) {
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i <= 4; i++) for (let j = 0; j <= 4; j++) {
      const y = this.h(cx - hw + (2 * hw * i) / 4, cz - hd + (2 * hd * j) / 4);
      lo = Math.min(lo, y); hi = Math.max(hi, y);
    }
    return { lo, hi };
  }

  /**
   * Axis-aligned building with door gaps. `doors` lists sides: 0=+z,1=+x,2=-z,3=-x.
   * Returns floor height and roof height.
   */
  building(loc: number, tier: number, cx: number, cz: number, w: number, d: number, opts: {
    floors?: number; doors?: number[]; wall?: Mat; roof?: Mat; sockets?: number; chest?: boolean; locker?: boolean; ascender?: boolean; canopy?: string; floorY?: number;
  } = {}) {
    const floors = opts.floors ?? 1;
    const hw = w / 2, hd = d / 2, t = 0.3, fh = 3.2;
    const fp = this.footprintHeights(cx, cz, hw, hd);
    const floorY = opts.floorY ?? fp.hi + 0.25;
    const wall = opts.wall ?? 'plaster';
    const doors = opts.doors ?? [0, 2];
    const top = floorY + fh * floors;
    // foundation + floor
    this.box(cx - hw, Math.min(fp.lo - 1, floorY - 1), cz - hd, cx + hw, floorY, cz + hd, 'stone', 'foundation', loc);
    const doorW = 2.2, doorH = 2.5;
    const side = (s: number) => {
      // returns wall segment along a side
      const isZ = s === 0 || s === 2;
      const sign = s === 0 || s === 1 ? 1 : -1;
      const len = isZ ? w : d;
      const hasDoor = doors.includes(s);
      const off = hasDoor ? (this.rng.next() - 0.5) * Math.max(0, len - doorW - 3) : 0;
      const mk = (a0: number, a1: number, y0: number, y1: number) => {
        if (a1 - a0 < 0.05) return;
        if (isZ) {
          const z0 = cz + sign * hd - (sign > 0 ? t : 0);
          this.box(cx + a0, y0, z0, cx + a1, y1, z0 + t, wall, 'wall', loc);
        } else {
          const x0 = cx + sign * hw - (sign > 0 ? t : 0);
          this.box(x0, y0, cz + a0, x0 + t, y1, cz + a1, wall, 'wall', loc);
        }
      };
      const L = len / 2;
      for (let f = 0; f < floors; f++) {
        const y0 = floorY + f * fh, y1 = y0 + fh;
        if (hasDoor && f === 0) {
          mk(-L, off - doorW / 2, y0, y1);
          mk(off + doorW / 2, L, y0, y1);
          mk(off - doorW / 2, off + doorW / 2, y0 + doorH, y1);
        } else if (f > 0) {
          // window gap on upper floor
          mk(-L, -0.9, y0, y1);
          mk(0.9, L, y0, y1);
          mk(-0.9, 0.9, y0, y0 + 1.0);
          mk(-0.9, 0.9, y0 + 2.2, y1);
        } else {
          mk(-L, L, y0, y1);
        }
      }
      return { off, isZ, sign };
    };
    for (let s = 0; s < 4; s++) side(s);
    // parapet roof
    this.box(cx - hw, top, cz - hd, cx + hw, top + 0.3, cz + hd, opts.roof ?? 'roofRed', 'roof', loc);
    if (floors > 1) {
      // stairs along -x interior wall rising towards +z, then upper slab with stairwell hole
      const steps = 8, rise = fh / steps, run = 0.55, sw = 1.3;
      const sx0 = cx - hw + t, sx1 = sx0 + sw;
      const sz0 = cz - hd + t + 0.6;
      for (let i = 0; i < steps; i++) {
        this.box(sx0, floorY, sz0 + i * run, sx1, floorY + rise * (i + 1), sz0 + (i + 1) * run, 'wood', 'stair', loc);
      }
      const holeZ1 = sz0 + steps * run;
      const y = floorY + fh;
      // slab pieces leaving hole over stairs
      this.box(sx1, y - 0.25, cz - hd + t, cx + hw - t, y, cz + hd - t, 'wood', 'floor', loc);
      this.box(sx0, y - 0.25, holeZ1, sx1, y, cz + hd - t, 'wood', 'floor', loc);
    }
    // loot sockets inside (ground floor and upper floor)
    const nS = opts.sockets ?? 2;
    const cl = this.cluster++;
    for (let i = 0; i < nS; i++) {
      const fl = floors > 1 && i % 2 === 1 ? 1 : 0;
      const sx = cx + (this.rng.next() - 0.5) * (w - 2.4) + (fl ? 0.8 : 0);
      const sz = cz + (this.rng.next() - 0.5) * (d - 2.4);
      this.sockets.push({ x: sx, y: floorY + fl * fh, z: sz, tier, cluster: cl, loc });
    }
    if (opts.chest) this.containers.push({ kind: 'chest', x: cx + hw - 1.2, y: floorY, z: cz + hd - 1.2, yaw: 0, tier, loc });
    if (opts.locker) this.containers.push({ kind: 'locker', x: cx - hw + 0.8, y: floorY, z: cz + hd - 0.9, yaw: Math.PI / 2, tier, loc });
    if (opts.ascender) {
      // exterior ascender on +x side
      const ax = cx + hw + 0.6, az = cz;
      this.ascenders.push({ id: this.ascenders.length, x: ax, z: az, y0: this.h(ax, az), y1: top + 0.3, exitX: -1, exitZ: 0 });
    }
    if (opts.canopy) this.decor.push({ type: 'canopy', x: cx, y: top + 0.3, z: cz, yaw: 0, s: w * 0.45, s2: d * 0.45, color: opts.canopy });
    return { floorY, top: top + 0.3 };
  }

  crate(loc: number, x: number, z: number, s = 1.2, mat: Mat = 'crate') {
    const y = this.h(x, z);
    this.box(x - s / 2, y - 0.3, z - s / 2, x + s / 2, y + s, z + s / 2, mat, 'prop', loc);
    return y + s;
  }

  zipline(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) {
    this.ziplines.push({ id: this.ziplines.length, a, b });
    this.decor.push({ type: 'zipPost', x: a.x, y: a.y - 3.2, z: a.z, yaw: 0, s: 3.2 });
    this.decor.push({ type: 'zipPost', x: b.x, y: b.y - 3.2, z: b.z, yaw: 0, s: 3.2 });
  }
}

// ---------------------------------------------------------------- generator
let cached: IslandData | null = null;

export function getIsland(): IslandData {
  if (cached) return cached;
  cached = generateIsland();
  return cached;
}

function generateIsland(): IslandData {
  const heights = new Float32Array(GRID_N * GRID_N);
  for (let j = 0; j < GRID_N; j++) {
    const z = -WORLD_HALF + j * GRID_RES;
    for (let i = 0; i < GRID_N; i++) {
      const x = -WORLD_HALF + i * GRID_RES;
      heights[j * GRID_N + i] = shapedHeight(x, z);
    }
  }
  const B = new Builder(heights);
  const locations: Location[] = NAMED.map((l, i) => ({ ...l, id: i }));
  const R = B.rng;

  // --- Aerie Market (loc 0): dense rooftop town on a plateau, ziplines.
  {
    const L = 0, cx = -200, cz = 170;
    const canopies = ['#e0523f', '#2bb3a6', '#f2b233', '#d9488e', '#3f7fe0'];
    const tops: { x: number; z: number; y: number }[] = [];
    const lots: [number, number, number, number, number][] = [
      // dx, dz, w, d, floors
      [-50, -40, 12, 10, 2], [-30, -42, 10, 12, 1], [-10, -45, 12, 9, 1], [14, -40, 10, 12, 2], [36, -44, 12, 10, 1],
      [-52, -12, 10, 12, 1], [-30, -14, 12, 10, 2], [30, -12, 12, 12, 2], [52, -14, 10, 10, 1],
      [-50, 18, 12, 10, 2], [-26, 20, 10, 10, 1], [26, 20, 10, 12, 1], [50, 16, 12, 12, 2],
      [-40, 46, 12, 10, 1], [-14, 46, 10, 10, 2], [12, 48, 12, 10, 1], [38, 46, 10, 12, 1],
    ];
    lots.forEach(([dx, dz, w, d, f], i) => {
      const r = B.building(L, 3, cx + dx, cz + dz, w, d, {
        floors: f, doors: i % 2 ? [0, 1] : [2, 3], wall: 'plaster', roof: i % 3 === 0 ? 'roofTeal' : 'roofRed',
        sockets: f > 1 ? 4 : 2, chest: i % 4 === 0, locker: i % 5 === 2, ascender: f > 1 && i % 2 === 0, canopy: canopies[i % canopies.length],
      });
      if (f > 1) tops.push({ x: cx + dx, z: cz + dz, y: r.top });
    });
    // market stalls in the central square
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const sx = cx + Math.cos(a) * 14, sz = cz + Math.sin(a) * 9;
      const y = B.crate(L, sx, sz, 1.1, 'wood');
      B.decor.push({ type: 'stall', x: sx, y, z: sz, yaw: a, s: 1, color: canopies[i % canopies.length] });
    }
    B.containers.push({ kind: 'chest', x: cx, y: B.h(cx, cz), z: cz, yaw: 0, tier: 3, loc: L });
    // ziplines between tall roofs
    const zips: [number, number][] = [[0, 2], [1, 4], [3, 5]];
    for (const [a, b] of zips) {
      if (!tops[a] || !tops[b]) continue;
      B.zipline({ x: tops[a].x, y: tops[a].y + 3.2, z: tops[a].z }, { x: tops[b].x, y: tops[b].y + 3.2, z: tops[b].z });
    }
    // zip from town edge down into the valley (alternate exit)
    const t0 = tops[0];
    if (t0) {
      const ex = cx - 120, ez = cz - 60;
      B.zipline({ x: t0.x, y: t0.y + 3.2, z: t0.z }, { x: ex, y: B.h(ex, ez) + 3.2, z: ez });
    }
  }

  // --- Sunken Array (loc 1): flooded dishes, service tunnels.
  {
    const L = 1, cx = 235, cz = 245;
    const dishes = [[-30, -20], [25, -28], [5, 30]];
    for (const [dx, dz] of dishes) {
      const x = cx + dx, z = cz + dz;
      const y = B.h(x, z);
      B.box(x - 1.2, y - 1, z - 1.2, x + 1.2, 7, z + 1.2, 'metal', 'prop', L); // pylon
      B.box(x - 4, 6.6, z - 4, x + 4, 7.2, z + 4, 'metal', 'floor', L); // service platform
      B.decor.push({ type: 'dish', x, y: 7.2, z, yaw: Math.atan2(dx, dz), s: 9 });
      B.ascenders.push({ id: B.ascenders.length, x: x + 4.6, z, y0: Math.max(y, -1.0), y1: 7.4, exitX: -1, exitZ: 0 });
      B.sockets.push({ x, y: 7.2, z: z + 2, tier: 2, cluster: B.cluster, loc: L });
      B.sockets.push({ x: x - 2, y: 7.2, z: z - 2, tier: 2, cluster: B.cluster++, loc: L });
    }
    B.containers.push({ kind: 'chest', x: cx + 5 - 2.5, y: 7.2, z: cz + 30 + 2.5, yaw: 0, tier: 2, loc: L });
    // service buildings on the rim
    B.building(L, 2, cx - 85, cz + 10, 12, 10, { doors: [1, 3], wall: 'metal', roof: 'roofTeal', sockets: 3, chest: true });
    B.building(L, 2, cx + 80, cz - 30, 10, 12, { doors: [3, 0], wall: 'metal', roof: 'roofTeal', sockets: 3, locker: true });
    B.building(L, 2, cx + 20, cz + 92, 14, 10, { doors: [2, 1], wall: 'metal', roof: 'roofTeal', sockets: 3 });
    B.building(L, 2, cx - 40, cz - 88, 10, 10, { doors: [0, 3], wall: 'metal', roof: 'roofTeal', sockets: 2, chest: true });
    // zipline across the basin
    const ya = B.h(cx - 85, cz + 10) + 6, yb = B.h(cx + 80, cz - 30) + 6;
    B.zipline({ x: cx - 78, y: ya, z: cz + 10 }, { x: cx + 73, y: yb, z: cz - 30 });
    // floating service catwalk segments (cover in water)
    for (let i = 0; i < 6; i++) {
      const x = cx - 40 + i * 16, z = cz + (i % 2 ? 8 : -6);
      B.box(x - 3, -0.2, z - 1, x + 3, 0.5, z + 1, 'metal', 'prop', L);
    }
  }

  // --- Kilnworks (loc 2): foundry halls, catwalks, heat channels, vault.
  {
    const L = 2, cx = 250, cz = -205;
    const halls: [number, number, number, number][] = [[-42, -30, 18, 14], [-40, 26, 16, 16], [38, -34, 16, 18], [42, 26, 18, 14], [0, 52, 14, 10]];
    halls.forEach(([dx, dz, w, d], i) => {
      B.building(L, 3, cx + dx, cz + dz, w, d, { floors: 2, doors: [0, 1, 2], wall: 'kiln', roof: 'copper', sockets: 4, chest: i % 2 === 0, locker: i % 2 === 1, ascender: i < 2 });
    });
    // central vault: small, heavily guarded tier-3
    const v = B.building(L, 3, cx, cz, 8, 8, { doors: [0, 2], wall: 'metal', roof: 'copper', sockets: 2, floorY: 14.25 });
    B.containers.push({ kind: 'chest', x: cx - 2.5, y: v.floorY, z: cz - 2.5, yaw: 0, tier: 3, loc: L });
    // heat channels (hazards) crossing the yard
    const fy = 14;
    const chans: [number, number, number, number][] = [[-60, -4, -7, -2], [7, -4, 60, -2], [-3, -60, -1, -16], [1, 16, 3, 44]];
    for (const [x0, z0, x1, z1] of chans) {
      B.hazards.push({ id: B.hazards.length, minX: cx + x0, maxX: cx + x1, minZ: cz + z0, maxZ: cz + z1, y0: fy - 2, y1: fy + 1.2, dps: 15 });
      B.decor.push({ type: 'heat', x: cx + (x0 + x1) / 2, y: fy + 0.02, z: cz + (z0 + z1) / 2, yaw: 0, s: x1 - x0, s2: z1 - z0 });
    }
    // catwalk between two halls
    const cy = fy + 6.6;
    B.box(cx - 34, cy - 0.25, cz - 24, cx - 32, cy, cz + 18, 'metal', 'floor', L);
    B.box(cx + 30, cy - 0.25, cz - 25, cx + 32, cy, cz + 19, 'metal', 'floor', L);
    B.zipline({ x: cx - 33, y: cy + 3.4, z: cz + 17 }, { x: cx + 31, y: cy + 3.0, z: cz - 24 });
    for (let i = 0; i < 10; i++) {
      const a = R.next() * Math.PI * 2, rr = 18 + R.next() * 40;
      B.crate(L, cx + Math.cos(a) * rr, cz + Math.sin(a) * rr, 1.3, i % 2 ? 'metal' : 'crate');
    }
    B.vents.push({ id: B.vents.length, x: cx, y: fy, z: cz + 12, r: 2.2 });
    B.decor.push({ type: 'chimney', x: cx - 42, y: fy + 6.7, z: cz - 30, yaw: 0, s: 14 });
    B.decor.push({ type: 'chimney', x: cx + 42, y: fy + 6.7, z: cz + 26, yaw: 0, s: 12 });
  }

  // --- Orchard Steps (loc 3): terraces, stone walls, fruit rows, farmhouses.
  {
    const L = 3, cx = -250, cz = -205;
    for (let k = 1; k <= 3; k++) {
      const z = cz - 64 + k * 32;
      const y = 9 + k * 1.2;
      // retaining walls with ramp gaps
      for (let seg = -3; seg <= 3; seg++) {
        if (seg === -1 || seg === 2) continue;
        const x0 = cx + seg * 24 - 11, x1 = cx + seg * 24 + 11;
        B.box(x0, y - 3, z - 1.2, x1, y + 0.9, z + 0.6, 'stone', 'wall', L);
      }
    }
    for (let row = 0; row < 4; row++) {
      for (let i = 0; i < 9; i++) {
        const x = cx - 72 + i * 18 + (row % 2) * 6, z = cz - 52 + row * 32;
        if (Math.abs(x - cx) < 14) continue;
        B.trees.push({ x, y: B.h(x, z), z, h: 4 + R.next() * 1.5, r: 2.2, kind: 'fruit' });
      }
    }
    B.building(L, 1, cx - 30, cz - 40, 12, 9, { doors: [0, 3], wall: 'wood', roof: 'roofGold', sockets: 2, chest: true });
    B.building(L, 1, cx + 36, cz - 12, 10, 10, { doors: [2, 1], wall: 'wood', roof: 'roofGold', sockets: 2 });
    B.building(L, 1, cx - 10, cz + 22, 12, 10, { floors: 2, doors: [0, 2], wall: 'wood', roof: 'roofRed', sockets: 3, locker: true, ascender: true });
    B.building(L, 1, cx + 58, cz + 46, 9, 9, { doors: [3], wall: 'wood', roof: 'roofGold', sockets: 2 });
    B.decor.push({ type: 'windmill', x: cx - 70, y: B.h(cx - 70, cz + 50), z: cz + 50, yaw: 0.6, s: 10 });
  }

  // --- Wind Abbey (loc 4): hilltop ruin, long sightlines, air vent.
  {
    const L = 4, cx = 15, cz = -15;
    const y = B.h(cx, cz);
    // broken curtain walls
    const segs: [number, number, number, number, number][] = [
      [-22, -22, 22, -21, 4.5], [-22, 21, -4, 22, 3.5], [6, 21, 22, 22, 5], [-23, -22, -22, 0, 4], [-23, 6, -22, 22, 2.5],
      [22, -22, 23, -6, 3], [22, 4, 23, 22, 4.5],
    ];
    for (const [x0, z0, x1, z1, hgt] of segs) B.box(cx + x0, y - 1.5, cz + z0, cx + x1, y + hgt, cz + z1, 'ruin', 'wall', L);
    // pillars / broken colonnade
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const px = cx + Math.cos(a) * 12, pz = cz + Math.sin(a) * 12;
      const ph = i % 3 === 0 ? 1.2 : 2.5 + (i % 4);
      B.box(px - 0.7, y - 1, pz - 0.7, px + 0.7, y + ph, pz + 0.7, 'ruin', 'prop', L);
    }
    B.building(L, 2, cx + 30, cz - 2, 10, 12, { doors: [3, 2], wall: 'ruin', roof: 'roofTeal', sockets: 3, chest: true });
    B.building(L, 2, cx - 34, cz + 6, 10, 10, { floors: 2, doors: [1, 0], wall: 'ruin', roof: 'roofTeal', sockets: 3, locker: true, ascender: true });
    B.containers.push({ kind: 'chest', x: cx + 5, y, z: cz - 15, yaw: 0, tier: 2, loc: L });
    for (let i = 0; i < 4; i++) B.sockets.push({ x: cx + (i - 1.5) * 7, y, z: cz + 8, tier: 2, cluster: B.cluster, loc: L });
    B.cluster++;
    B.vents.push({ id: B.vents.length, x: cx, y, z: cz, r: 2.5 });
    B.decor.push({ type: 'belltower', x: cx - 12, y, z: cz - 14, yaw: 0, s: 16 });
    B.box(cx - 14.5, y - 1, cz - 16.5, cx - 9.5, y + 16, cz - 11.5, 'ruin', 'prop', L);
  }

  // --- Breaker Docks (loc 5): warehouses, containers, cranes, pier.
  {
    const L = 5, cx = 420, cz = 10;
    const wh: [number, number, number, number][] = [[-40, -50, 16, 20], [-40, 0, 16, 18], [-40, 48, 16, 18], [0, -30, 14, 16], [0, 30, 14, 16]];
    wh.forEach(([dx, dz, w, d], i) => B.building(L, 2, cx + dx, cz + dz, w, d, { doors: [1, 3], wall: 'metal', roof: i % 2 ? 'roofRed' : 'roofTeal', sockets: 3, chest: i % 2 === 0, locker: i % 2 === 1, ascender: i === 1 }));
    const colors: Mat[] = ['container'];
    for (let i = 0; i < 16; i++) {
      const x = cx + 26 + (i % 4) * 8, z = cz - 60 + Math.floor(i / 4) * 34 + (i % 2) * 4;
      const y = B.h(x, z);
      const stack = 1 + (i % 3 === 0 ? 1 : 0);
      B.box(x - 1.25, y - 0.5, z - 3, x + 1.25, y + 2.6 * stack, z + 3, colors[0], 'prop', L);
      B.decor.push({ type: 'containerColor', x, y, z, yaw: 0, s: stack, color: ['#c2452d', '#2d7fc2', '#d9a92b', '#3e9e5e'][i % 4] });
    }
    // pier into the sea
    B.box(cx + 58, -3, cz - 6, cx + 110, 2.6, cz + 6, 'dock', 'floor', L);
    for (const dz of [-40, 40]) {
      const x = cx + 62, z = cz + dz;
      const y = B.h(x, z);
      B.box(x - 1.2, y - 1, z - 1.2, x + 1.2, y + 22, z + 1.2, 'metal', 'prop', L);
      B.decor.push({ type: 'crane', x, y, z, yaw: dz > 0 ? 0.3 : -0.3, s: 22 });
      B.zipline({ x, y: y + 22, z: z + 1.5 * Math.sign(dz) }, { x: cx - 10, y: B.h(cx - 10, cz + dz * 0.5) + 3.2, z: cz + dz * 0.5 });
    }
    for (let i = 0; i < 4; i++) B.sockets.push({ x: cx + 70 + i * 9, y: 2.6, z: cz, tier: 2, cluster: B.cluster, loc: L });
    B.cluster++;
  }

  // --- Landmarks
  const lm = (id: number) => locations[id];
  {
    const w = lm(6); // Watch Huts
    B.building(w.id, 1, w.x - 8, w.z, 6, 6, { doors: [2], wall: 'wood', roof: 'roofRed', sockets: 1 });
    B.building(w.id, 1, w.x + 8, w.z + 4, 6, 6, { floors: 2, doors: [3], wall: 'wood', roof: 'roofRed', sockets: 2, chest: true });
  }
  {
    const b = lm(7); // Bridge Station: elevated platform
    const y = B.h(b.x, b.z);
    B.box(b.x - 20, y + 5, b.z - 3, b.x + 20, y + 5.4, b.z + 3, 'metal', 'floor', b.id);
    for (const dx of [-18, 0, 18]) B.box(b.x + dx - 0.8, y - 1, b.z - 0.8, b.x + dx + 0.8, y + 5, b.z + 0.8, 'stone', 'prop', b.id);
    B.ascenders.push({ id: B.ascenders.length, x: b.x - 21, z: b.z, y0: B.h(b.x - 21, b.z), y1: y + 5.6, exitX: 1, exitZ: 0 });
    B.building(b.id, 1, b.x + 4, b.z + 12, 8, 6, { doors: [0, 2], wall: 'plaster', roof: 'roofTeal', sockets: 2, locker: true });
    B.sockets.push({ x: b.x + 6, y: y + 5.4, z: b.z, tier: 2, cluster: B.cluster++, loc: b.id });
  }
  {
    const q = lm(8); // Old Quarry
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const x = q.x + Math.cos(a) * 26, z = q.z + Math.sin(a) * 26;
      const y = B.h(x, z);
      B.box(x - 3, y - 2, z - 2, x + 3, y + 2 + (i % 3), z + 2, 'rock', 'rock', q.id);
    }
    B.building(q.id, 1, q.x, q.z, 8, 7, { doors: [0, 1], wall: 'wood', roof: 'roofGold', sockets: 2, chest: true });
  }
  {
    const c = lm(9); // Campsite
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      const x = c.x + Math.cos(a) * 9, z = c.z + Math.sin(a) * 9;
      B.decor.push({ type: 'tent', x, y: B.h(x, z), z, yaw: a, s: 2.6, color: ['#e0523f', '#f2b233', '#2bb3a6', '#3f7fe0'][i] });
      B.box(x - 1.3, B.h(x, z) - 0.5, z - 1.3, x + 1.3, B.h(x, z) + 1.6, z + 1.3, 'wood', 'prop', c.id);
      B.sockets.push({ x: x + 1.8, y: B.h(x + 1.8, z), z, tier: 1, cluster: B.cluster, loc: c.id });
    }
    B.cluster++;
    B.containers.push({ kind: 'chest', x: c.x, y: B.h(c.x, c.z), z: c.z, yaw: 0, tier: 1, loc: c.id });
  }
  {
    const t = lm(10); // Copper Turbine
    const y = B.h(t.x, t.z);
    B.box(t.x - 2, y - 1, t.z - 2, t.x + 2, y + 18, t.z + 2, 'copper', 'prop', t.id);
    B.decor.push({ type: 'turbine', x: t.x, y: y + 18, z: t.z, yaw: 0.8, s: 9 });
    B.ascenders.push({ id: B.ascenders.length, x: t.x + 2.6, z: t.z, y0: y, y1: y + 18.4, exitX: -1, exitZ: 0 });
    B.box(t.x - 3, y + 18, t.z - 3, t.x + 3, y + 18.4, t.z + 3, 'metal', 'floor', t.id);
    B.containers.push({ kind: 'chest', x: t.x, y: y + 18.4, z: t.z + 1.5, yaw: 0, tier: 2, loc: t.id });
    B.building(t.id, 1, t.x - 12, t.z + 8, 7, 6, { doors: [1], wall: 'metal', roof: 'copper', sockets: 2 });
  }
  {
    const c = lm(11); // Hollow Cave: rock arch shelter
    const y = B.h(c.x, c.z);
    B.box(c.x - 10, y - 1, c.z - 8, c.x - 7, y + 5, c.z + 8, 'rock', 'rock', c.id);
    B.box(c.x + 7, y - 1, c.z - 8, c.x + 10, y + 5, c.z + 8, 'rock', 'rock', c.id);
    B.box(c.x - 10, y + 5, c.z - 8, c.x + 10, y + 8, c.z + 8, 'rock', 'roof', c.id);
    B.box(c.x - 10, y - 1, c.z + 8, c.x + 10, y + 8, c.z + 10, 'rock', 'rock', c.id);
    B.containers.push({ kind: 'chest', x: c.x, y, z: c.z + 6, yaw: 0, tier: 2, loc: c.id });
    for (let i = 0; i < 3; i++) B.sockets.push({ x: c.x - 4 + i * 4, y, z: c.z, tier: 1, cluster: B.cluster, loc: c.id });
    B.cluster++;
  }
  {
    const r = lm(12); // Relay Shack
    B.building(r.id, 1, r.x, r.z, 8, 8, { doors: [2, 3], wall: 'plaster', roof: 'roofTeal', sockets: 2, locker: true });
    const y = B.h(r.x + 8, r.z);
    B.box(r.x + 7.5, y - 1, r.z - 0.5, r.x + 8.5, y + 14, r.z + 0.5, 'metal', 'prop', r.id);
    B.decor.push({ type: 'antenna', x: r.x + 8, y: y + 14, z: r.z, yaw: 0, s: 3 });
  }
  {
    const w = lm(13); // Skiff Wreck on the southern shore
    const y = Math.max(B.h(w.x, w.z), 0.5);
    B.box(w.x - 14, y - 1, w.z - 3, w.x + 10, y + 3.2, w.z - 2.6, 'wood', 'wall', w.id);
    B.box(w.x - 14, y - 1, w.z + 2.6, w.x + 6, y + 2.6, w.z + 3, 'wood', 'wall', w.id);
    B.box(w.x + 2, y - 1, w.z - 2.6, w.x + 3, y + 4.5, w.z + 2.6, 'wood', 'wall', w.id);
    B.decor.push({ type: 'wreck', x: w.x, y, z: w.z, yaw: 0.0, s: 1 });
    B.containers.push({ kind: 'chest', x: w.x - 8, y: B.h(w.x - 8, w.z), z: w.z, yaw: 0, tier: 2, loc: w.id });
    B.sockets.push({ x: w.x - 4, y: B.h(w.x - 4, w.z), z: w.z, tier: 1, cluster: B.cluster, loc: w.id });
    B.sockets.push({ x: w.x + 6, y: B.h(w.x + 6, w.z + 6), z: w.z + 6, tier: 1, cluster: B.cluster++, loc: w.id });
  }

  // --- Scattered huts / wild loot for unpopular drops
  for (let i = 0; i < 10; i++) {
    let x = 0, z = 0, ok = false;
    for (let tries = 0; tries < 40 && !ok; tries++) {
      x = (R.next() - 0.5) * 760; z = (R.next() - 0.5) * 760;
      const h = B.h(x, z);
      ok = h > 3 && Math.hypot(x, z) < 400 && locations.every((l) => Math.hypot(l.x - x, l.z - z) > l.r + 30);
    }
    if (!ok) continue;
    B.building(-1, 1, x, z, 6, 6, { doors: [i % 4], wall: i % 2 ? 'wood' : 'plaster', roof: 'roofRed', sockets: 2, locker: i % 3 === 0 });
  }

  // --- Staging pier / Practice Range (off the south-west shore).
  const P = PIER_CENTER;
  const py = 3;
  const pier = { minX: P.x - 40, maxX: P.x + 40, minZ: P.z - 28, maxZ: P.z + 28, y: py, spawn: { x: P.x - 30, y: py, z: P.z } };
  const pierLoc = locations.length;
  locations.push({ id: pierLoc, name: 'Staging Pier', x: P.x, z: P.z, r: 45, tier: 0, kind: 'pier' });
  {
    B.box(pier.minX, -6, pier.minZ, pier.maxX, py, pier.maxZ, 'pier', 'floor', pierLoc);
    // remove the middle pool section by splitting: instead use a pool box region at +x side (swim area)
    // movement course: mantle blocks of increasing height
    [0.6, 0.9, 1.2, 1.5].forEach((hh, i) => B.box(P.x - 20 + i * 3.2, py, P.z - 22, P.x - 18 + i * 3.2, py + hh, P.z - 20, 'crate', 'prop', pierLoc));
    // tower + ascender + zipline
    B.box(P.x + 22, py, P.z - 24, P.x + 28, py + 10, P.z - 18, 'stone', 'prop', pierLoc);
    B.ascenders.push({ id: B.ascenders.length, x: P.x + 21.3, z: P.z - 21, y0: py, y1: py + 10.3, exitX: 1, exitZ: 0 });
    B.zipline({ x: P.x + 25, y: py + 13.2, z: P.z - 17 }, { x: P.x - 25, y: py + 3.6, z: P.z + 20 });
    B.vents.push({ id: B.vents.length, x: P.x + 32, y: py, z: P.z + 18, r: 2.2 });
    // cover walls for the shooting lane
    for (let i = 0; i < 3; i++) B.box(P.x - 8 + i * 8, py, P.z + 4, P.x - 5 + i * 8, py + 1.3, P.z + 5, 'stone', 'wall', pierLoc);
    // pool: a second, lower deck the player can drop into (water level 0, deck at -3 -> 3m deep)
    B.box(P.x + 40, -14, P.z - 12, P.x + 64, -3, P.z + 12, 'pier', 'floor', pierLoc);
    B.box(P.x + 64, -3, P.z - 12, P.x + 65, py, P.z + 12, 'pier', 'wall', pierLoc);
    B.box(P.x + 40, -3, P.z - 13, P.x + 65, py, P.z - 12, 'pier', 'wall', pierLoc);
    B.box(P.x + 40, -3, P.z + 12, P.x + 65, py, P.z + 13, 'pier', 'wall', pierLoc);
    // steps out of the pool
    for (let i = 0; i < 14; i++) B.box(P.x + 40 + (13 - i) * 0.6, -3, P.z - 2, P.x + 40.6 + (13 - i) * 0.6, -3 + (i + 1) * 0.43, P.z + 2, 'pier', 'stair', pierLoc);
    B.decor.push({ type: 'banner', x: P.x - 38, y: py, z: P.z, yaw: Math.PI / 2, s: 6, color: '#2bb3a6' });
  }

  // --- Foliage & boulders (wild), deterministic.
  const TR = new Rng(ISLAND_SEED + 99);
  const occupied = (x: number, z: number, pad: number) => {
    for (const l of locations) if (l.kind !== 'landmark' && Math.hypot(l.x - x, l.z - z) < l.r * 0.85 + pad) return true;
    return false;
  };
  const boxOverlap = (x: number, z: number, r: number) => {
    for (const b of B.boxes) if (x + r > b.minX && x - r < b.maxX && z + r > b.minZ && z - r < b.maxZ && b.maxY - b.minY > 0.4) return true;
    return false;
  };
  for (let i = 0; i < 4200 && B.trees.length < 1500; i++) {
    const x = (TR.next() - 0.5) * 1000, z = (TR.next() - 0.5) * 1000;
    const h = B.h(x, z);
    if (h < 2.5) continue;
    const dens = fbm(ISLAND_SEED + 41, x / 90, z / 90, 3);
    if (dens < 0.5 && TR.next() > 0.15) continue;
    if (occupied(x, z, 6) || boxOverlap(x, z, 2)) continue;
    const kind = h > 34 ? 'pine' : TR.next() < 0.5 ? 'broad' : 'pine';
    B.trees.push({ x, y: h, z, h: 6 + TR.next() * 6, r: kind === 'pine' ? 2.2 : 3.2, kind });
  }
  for (const t of B.trees) {
    const tr = t.kind === 'fruit' ? 0.22 : 0.32;
    B.box(t.x - tr, t.y - 0.5, t.z - tr, t.x + tr, t.y + t.h * 0.7, t.z + tr, 'trunk', 'tree', -1);
  }
  let rocks = 0;
  for (let i = 0; i < 3000 && rocks < 420; i++) {
    const x = (TR.next() - 0.5) * 980, z = (TR.next() - 0.5) * 980;
    const h = B.h(x, z);
    if (h < 0.5) continue;
    if (occupied(x, z, 3) || boxOverlap(x, z, 3)) continue;
    const s = 1.2 + TR.next() * 2.4;
    const sx = s * (0.8 + TR.next() * 0.6), sz = s * (0.8 + TR.next() * 0.6), sy = s * (0.6 + TR.next() * 0.5);
    B.box(x - sx, h - 0.8, z - sz, x + sx, h + sy, z + sz, 'rock', 'rock', -1);
    rocks++;
  }

  // --- Valid storm centres: on land, gentle slope, enough nearby cover.
  const stormCenters: { x: number; z: number; cover: number }[] = [];
  const coverPts: { x: number; z: number }[] = B.boxes.filter((b) => b.kind !== 'floor' && b.kind !== 'foundation').map((b) => ({ x: (b.minX + b.maxX) / 2, z: (b.minZ + b.maxZ) / 2 }));
  const cg = new Map<string, number>();
  for (const p of coverPts) {
    const k = `${Math.floor(p.x / 20)},${Math.floor(p.z / 20)}`;
    cg.set(k, (cg.get(k) ?? 0) + 1);
  }
  for (let x = -420; x <= 420; x += 20) {
    for (let z = -420; z <= 420; z += 20) {
      const h = B.h(x, z);
      if (h < 2) continue;
      const slope = Math.max(Math.abs(B.h(x + 6, z) - B.h(x - 6, z)), Math.abs(B.h(x, z + 6) - B.h(x, z - 6))) / 12;
      if (slope > 0.45) continue;
      let water = 0;
      for (let a = 0; a < 8; a++) if (B.h(x + Math.cos(a) * 25, z + Math.sin(a) * 25) < 0.3) water++;
      if (water > 1) continue;
      let cover = 0;
      const gx = Math.floor(x / 20), gz = Math.floor(z / 20);
      for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) cover += cg.get(`${gx + i},${gz + j}`) ?? 0;
      if (cover < 8) continue;
      stormCenters.push({ x, z, cover });
    }
  }

  const manifestSrc = JSON.stringify([B.boxes.length, B.boxes.slice(0, 400).map((b) => [b.minX.toFixed(2), b.maxY.toFixed(2)]), B.ziplines.length, B.ascenders.length, heights[12345].toFixed(3), heights[GRID_N * 300 + 300].toFixed(3)]);

  return {
    heights, boxes: B.boxes, ziplines: B.ziplines, ascenders: B.ascenders, vents: B.vents, hazards: B.hazards,
    trees: B.trees, sockets: B.sockets, containers: B.containers, locations, decor: B.decor, stormCenters, pier,
    manifestHash: fnv1a(manifestSrc),
  };
}
