/**
 * World: deterministic procedural island ("The Highwake"), heightfield + simplified collision
 * primitives (boxes, cylinders), loot sockets, traversal links and storm-valid zone centers.
 * This module has no rendering dependencies; the renderer reads the same data.
 */
import { ISLAND_SIZE, WATER_LEVEL } from '../shared/content';
import { Rng, fbm, valueNoise } from '../shared/rng';
import { clamp, lerp, smoothstep, type Vec3 } from '../shared/math';

export interface Box {
  minX: number; minY: number; minZ: number;
  maxX: number; maxY: number; maxZ: number;
  style: number; // palette index used by the renderer
}
export interface Cyl { x: number; z: number; r: number; y0: number; y1: number; kind: 'tree' | 'rock' | 'dish' | 'tank' | 'pillar' | 'stack'; style: number }
export interface Hazard { x0: number; z0: number; x1: number; z1: number; dps: number }
export interface Building {
  id: number; loc: string; x: number; z: number; w: number; d: number; h: number; floorY: number;
  door: 'n' | 's' | 'e' | 'w';
  doorOut: { x: number; z: number };
  doorIn: { x: number; z: number };
}
export interface LocationDef {
  id: string; name: string; x: number; z: number; r: number; tier: number; named: boolean; padH: number;
}
export interface LootSocket { x: number; y: number; z: number; tier: number; kind: 'floor' | 'chest' | 'locker'; loc: string; weaponBias: boolean }
export interface Zipline { id: number; a: Vec3; b: Vec3; name: string }
export interface Vent { x: number; z: number; r: number; y: number; boost: number }

export const BOX_STYLES = {
  limestone: 0, copper: 1, wood: 2, fabricA: 3, fabricB: 4, stone: 5, metal: 6, roof: 7, crate: 8, pier: 9, glass: 10, dark: 11,
};

const CELL = 20;

export class World {
  readonly seed: number;
  readonly half = ISLAND_SIZE / 2;
  readonly res = 4; // heightfield spacing (m)
  readonly n: number; // samples per side
  readonly heights: Float32Array;
  readonly boxes: Box[] = [];
  readonly cyls: Cyl[] = [];
  readonly hazards: Hazard[] = [];
  readonly locations: LocationDef[] = [];
  readonly buildings: Building[] = [];
  readonly sockets: LootSocket[] = [];
  readonly ziplines: Zipline[] = [];
  readonly vents: Vent[] = [];
  readonly zoneCenters: { x: number; z: number; cover: number }[] = [];
  readonly spawnPad = { x: -820, z: 0, y: 400 };
  readonly waterLevel = WATER_LEVEL;
  readonly practice: boolean;
  private grid = new Map<number, { b: number[]; c: number[] }>();
  private gridW: number;
  hash = '';

  private pads: { x: number; z: number; r: number; blend: number; h: number }[] = [];
  private features: ((x: number, z: number, h: number) => number)[] = [];

  constructor(seed: number, opts: { practice?: boolean } = {}) {
    this.seed = seed;
    this.practice = !!opts.practice;
    this.n = Math.round(ISLAND_SIZE / this.res) + 1;
    this.heights = new Float32Array(this.n * this.n);
    this.gridW = Math.ceil((ISLAND_SIZE + 1800) / CELL);
    if (this.practice) this.buildPractice();
    else this.buildIsland();
    this.indexColliders();
    if (!this.practice) this.computeZoneCenters(new Rng(this.seed + 4242));
    this.hash = this.computeHash();
  }

  /* ------------------------------------------------------------ queries */
  private cellKey(cx: number, cz: number): number { return cz * this.gridW + cx; }
  private cellOf(v: number): number { return Math.floor((v + this.half + 900) / CELL); }

  private indexColliders(): void {
    this.grid.clear();
    const add = (cx: number, cz: number, kind: 'b' | 'c', idx: number) => {
      const k = this.cellKey(cx, cz);
      let e = this.grid.get(k);
      if (!e) { e = { b: [], c: [] }; this.grid.set(k, e); }
      e[kind].push(idx);
    };
    this.boxes.forEach((b, i) => {
      for (let cx = this.cellOf(b.minX); cx <= this.cellOf(b.maxX); cx++)
        for (let cz = this.cellOf(b.minZ); cz <= this.cellOf(b.maxZ); cz++) add(cx, cz, 'b', i);
    });
    this.cyls.forEach((c, i) => {
      for (let cx = this.cellOf(c.x - c.r); cx <= this.cellOf(c.x + c.r); cx++)
        for (let cz = this.cellOf(c.z - c.r); cz <= this.cellOf(c.z + c.r); cz++) add(cx, cz, 'c', i);
    });
  }

  /** Collect colliders touching a world-space circle. Results are appended to out arrays (deduped by caller marks). */
  queryCircle(x: number, z: number, r: number, outB: Box[], outC: Cyl[]): void {
    outB.length = 0; outC.length = 0;
    const x0 = this.cellOf(x - r), x1 = this.cellOf(x + r), z0 = this.cellOf(z - r), z1 = this.cellOf(z + r);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cz = z0; cz <= z1; cz++) {
        const e = this.grid.get(this.cellKey(cx, cz));
        if (!e) continue;
        for (const i of e.b) { const b = this.boxes[i]; if (outB.indexOf(b) < 0) outB.push(b); }
        for (const i of e.c) { const c = this.cyls[i]; if (outC.indexOf(c) < 0) outC.push(c); }
      }
    }
  }

  heightAt(x: number, z: number): number {
    const fx = (x + this.half) / this.res, fz = (z + this.half) / this.res;
    if (fx <= 0 || fz <= 0 || fx >= this.n - 1 || fz >= this.n - 1) {
      return this.edgeHeight(x, z);
    }
    const ix = Math.floor(fx), iz = Math.floor(fz);
    const tx = fx - ix, tz = fz - iz;
    const n = this.n, H = this.heights;
    const a = H[iz * n + ix], b = H[iz * n + ix + 1], c = H[(iz + 1) * n + ix], d = H[(iz + 1) * n + ix + 1];
    return a + (b - a) * tx + (c - a) * tz + (a - b - c + d) * tx * tz;
  }
  private edgeHeight(x: number, z: number): number {
    const cx = clamp(x, -this.half, this.half - 0.01), cz = clamp(z, -this.half, this.half - 0.01);
    const fx = (cx + this.half) / this.res, fz = (cz + this.half) / this.res;
    const ix = Math.min(Math.floor(fx), this.n - 2), iz = Math.min(Math.floor(fz), this.n - 2);
    return this.heights[iz * this.n + ix] - Math.hypot(x - cx, z - cz) * 0.2;
  }
  slopeAt(x: number, z: number): number {
    const e = 1.5;
    const dx = (this.heightAt(x + e, z) - this.heightAt(x - e, z)) / (2 * e);
    const dz = (this.heightAt(x, z + e) - this.heightAt(x, z - e)) / (2 * e);
    return Math.hypot(dx, dz);
  }
  /** Highest walkable support (terrain or box top at/below feet + step) under a circle. */
  groundHeight(x: number, z: number, feetY: number, step: number, r: number, tmpB: Box[], tmpC: Cyl[]): number {
    let g = this.heightAt(x, z);
    this.queryCircle(x, z, r, tmpB, tmpC);
    for (const b of tmpB) {
      if (b.maxY <= feetY + step && b.maxY > g && circleOverlapsBox(x, z, r * 0.9, b)) g = b.maxY;
    }
    for (const c of tmpC) {
      if (c.y1 <= feetY + step && c.y1 > g && Math.hypot(x - c.x, z - c.z) < c.r + r * 0.5 && c.kind !== 'tree') g = c.y1;
    }
    return g;
  }
  inHazard(x: number, z: number): number {
    for (const h of this.hazards) if (x >= h.x0 && x <= h.x1 && z >= h.z0 && z <= h.z1) return h.dps;
    return 0;
  }
  isLand(x: number, z: number): boolean { return this.heightAt(x, z) > this.waterLevel + 0.15; }

  /** Ray vs terrain + colliders. Returns hit distance or -1. */
  raycast(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, maxT: number, ignoreTrees = false): number {
    let best = maxT;
    // terrain march
    const step = 1.5;
    let prevT = 0;
    let prevAbove = oy - this.heightAt(ox, oz) > 0;
    for (let t = step; t <= best + step; t += step) {
      const tt = Math.min(t, best);
      const px = ox + dx * tt, py = oy + dy * tt, pz = oz + dz * tt;
      const above = py - this.heightAt(px, pz) > 0;
      if (prevAbove && !above) {
        let lo = prevT, hi = tt;
        for (let i = 0; i < 6; i++) {
          const mid = (lo + hi) / 2;
          const a = oy + dy * mid - this.heightAt(ox + dx * mid, oz + dz * mid) > 0;
          if (a) lo = mid; else hi = mid;
        }
        if (hi < best) best = hi;
        break;
      }
      prevAbove = above; prevT = tt;
      if (tt >= best) break;
    }
    // colliders: walk cells along the ray
    const seenB = new Set<number>();
    const seenC = new Set<number>();
    const len = best;
    const samples = Math.ceil(len / (CELL * 0.6)) + 1;
    for (let s = 0; s <= samples; s++) {
      const t = Math.min(len, (s / samples) * len);
      const cx = this.cellOf(ox + dx * t), cz = this.cellOf(oz + dz * t);
      for (let ax = -1; ax <= 1; ax++) {
        for (let az = -1; az <= 1; az++) {
          const e = this.grid.get(this.cellKey(cx + ax, cz + az));
          if (!e) continue;
          for (const i of e.b) {
            if (seenB.has(i)) continue;
            seenB.add(i);
            const t0 = rayBox(ox, oy, oz, dx, dy, dz, this.boxes[i]);
            if (t0 >= 0 && t0 < best) best = t0;
          }
          if (!ignoreTrees || true) {
            for (const i of e.c) {
              if (seenC.has(i)) continue;
              seenC.add(i);
              const c = this.cyls[i];
              if (ignoreTrees && c.kind === 'tree') continue;
              const t0 = rayCyl(ox, oy, oz, dx, dy, dz, c);
              if (t0 >= 0 && t0 < best) best = t0;
            }
          }
        }
      }
    }
    return best < maxT ? best : -1;
  }
  hasLineOfSight(a: Vec3, b: Vec3): boolean {
    const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
    const d = Math.hypot(dx, dy, dz);
    if (d < 0.01) return true;
    return this.raycast(a.x, a.y, a.z, dx / d, dy / d, dz / d, d - 0.05, true) < 0;
  }

  /* ----------------------------------------------------------- hashing */
  private computeHash(): string {
    let h = 2166136261 >>> 0;
    const mix = (v: number) => { h ^= Math.round(v * 100) | 0; h = Math.imul(h, 16777619) >>> 0; };
    for (let i = 0; i < this.heights.length; i += 7) mix(this.heights[i]);
    for (const b of this.boxes) { mix(b.minX); mix(b.minY); mix(b.minZ); mix(b.maxX); mix(b.maxY); mix(b.maxZ); }
    for (const c of this.cyls) { mix(c.x); mix(c.z); mix(c.r); }
    return h.toString(16).padStart(8, '0');
  }

  /* --------------------------------------------------------- generation */
  private baseHeight(x: number, z: number): number {
    const r = Math.hypot(x, z);
    const warp = 1 + 0.16 * (valueNoise(x / 240 + 7, z / 240 - 3, this.seed) - 0.5) * 2;
    const rr = r * warp;
    const m = 1 - smoothstep(395, 545, rr);
    const land = 7 + 15 * fbm(x / 210, z / 210, this.seed + 11, 4) - 3.5 * Math.abs(valueNoise(x / 90, z / 90, this.seed + 29) - 0.5) * 2 + 3.5 * fbm(x / 60, z / 60, this.seed + 5, 2);
    return lerp(-9, land, Math.pow(m, 0.75));
  }

  private finalHeight(x: number, z: number): number {
    let h = this.baseHeight(x, z);
    for (const p of this.pads) {
      const d = Math.hypot(x - p.x, z - p.z);
      if (d < p.r + p.blend) {
        const w = 1 - smoothstep(p.r, p.r + p.blend, d);
        h = lerp(h, p.h, w);
      }
    }
    for (const f of this.features) h = f(x, z, h);
    return h;
  }

  private bakeHeights(): void {
    for (let iz = 0; iz < this.n; iz++) {
      for (let ix = 0; ix < this.n; ix++) {
        const x = ix * this.res - this.half, z = iz * this.res - this.half;
        this.heights[iz * this.n + ix] = this.finalHeight(x, z);
      }
    }
  }

  private box(minX: number, minY: number, minZ: number, maxX: number, maxY: number, maxZ: number, style: number): Box {
    const b = { minX, minY, minZ, maxX, maxY, maxZ, style };
    this.boxes.push(b);
    return b;
  }
  private cyl(x: number, z: number, r: number, y0: number, y1: number, kind: Cyl['kind'], style = 0): void {
    this.cyls.push({ x, z, r, y0, y1, kind, style });
  }

  /** A hollow building with one door. Returns the building record. */
  private addBuilding(loc: string, cx: number, cz: number, w: number, d: number, h: number, door: 'n' | 's' | 'e' | 'w', floorY: number, wallStyle: number, roofStyle: number, rng: Rng, opts: { crates?: number; chestInside?: boolean } = {}): Building {
    const t = 0.35, dw = 1.1; // wall thickness, door half width
    const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2;
    const top = floorY + h;
    const doorH = 2.6;
    const wall = (ax: number, az: number, bx: number, bz: number, hasDoor: boolean, horizontal: boolean) => {
      // horizontal: wall runs along X at z=az..bz thickness; else along Z
      if (!hasDoor) { this.box(ax, floorY, az, bx, top, bz, wallStyle); return; }
      if (horizontal) {
        const mid = (ax + bx) / 2;
        this.box(ax, floorY, az, mid - dw, top, bz, wallStyle);
        this.box(mid + dw, floorY, az, bx, top, bz, wallStyle);
        this.box(mid - dw, floorY + doorH, az, mid + dw, top, bz, wallStyle);
      } else {
        const mid = (az + bz) / 2;
        this.box(ax, floorY, az, bx, top, mid - dw, wallStyle);
        this.box(ax, floorY, mid + dw, bx, top, bz, wallStyle);
        this.box(ax, floorY + doorH, mid - dw, bx, top, mid + dw, wallStyle);
      }
    };
    wall(x0, z0, x1, z0 + t, door === 'n', true);
    wall(x0, z1 - t, x1, z1, door === 's', true);
    wall(x0, z0 + t, x0 + t, z1 - t, door === 'w', false);
    wall(x1 - t, z0 + t, x1, z1 - t, door === 'e', false);
    // roof slab (standable)
    this.box(x0 - 0.25, top, z0 - 0.25, x1 + 0.25, top + 0.4, z1 + 0.25, roofStyle);
    const dx = door === 'e' ? 1 : door === 'w' ? -1 : 0;
    const dz = door === 's' ? 1 : door === 'n' ? -1 : 0;
    const doorX = cx + dx * (w / 2), doorZ = cz + dz * (d / 2);
    const b: Building = {
      id: this.buildings.length, loc, x: cx, z: cz, w, d, h, floorY, door,
      doorOut: { x: doorX + dx * 3, z: doorZ + dz * 3 },
      doorIn: { x: doorX - dx * 1.8, z: doorZ - dz * 1.8 },
    };
    this.buildings.push(b);
    // cover crates inside
    const crates = opts.crates ?? 1;
    for (let i = 0; i < crates; i++) {
      const px = cx + rng.range(-w / 2 + 2, w / 2 - 2) * 0.8, pz = cz + rng.range(-d / 2 + 2, d / 2 - 2) * 0.8;
      if (Math.hypot(px - b.doorIn.x, pz - b.doorIn.z) < 3.2) continue;
      this.box(px - 0.6, floorY, pz - 0.6, px + 0.6, floorY + 1.1, pz + 0.6, BOX_STYLES.crate);
    }
    // loot sockets
    const locDef = this.locations.find((l) => l.id === loc);
    const tier = locDef ? locDef.tier : 1;
    const nFloor = Math.max(3, Math.min(6, Math.ceil((w * d) / 42)));
    for (let i = 0; i < nFloor; i++) {
      const sx = cx + rng.range(-w / 2 + 1.6, w / 2 - 1.6), sz = cz + rng.range(-d / 2 + 1.6, d / 2 - 1.6);
      if (Math.hypot(sx - b.doorIn.x, sz - b.doorIn.z) < 1.6) continue;
      this.sockets.push({ x: sx, y: floorY + 0.15, z: sz, tier, kind: 'floor', loc, weaponBias: i === 0 });
    }
    if (opts.chestInside) {
      const sx = cx + (door === 'n' || door === 's' ? 0 : -dx * (w / 2 - 1.2)), sz = cz + (door === 'e' || door === 'w' ? 0 : -dz * (d / 2 - 1.2));
      this.sockets.push({ x: sx, y: floorY, z: sz, tier, kind: 'chest', loc, weaponBias: false });
    }
    return b;
  }

  private addStairs(x: number, z: number, dirx: number, dirz: number, rise: number, floorY: number, width: number, style: number): void {
    const stepH = 0.5, run = 0.9;
    const n = Math.ceil(rise / stepH);
    for (let i = 0; i < n; i++) {
      const px = x + dirx * i * run, pz = z + dirz * i * run;
      const hx = dirx !== 0 ? run / 2 : width / 2, hz = dirz !== 0 ? run / 2 : width / 2;
      this.box(px - hx, floorY, pz - hz, px + hx, floorY + Math.min((i + 1) * stepH, rise), pz + hz, style);
    }
  }

  private addLocation(id: string, name: string, x: number, z: number, r: number, tier: number, named: boolean, padH?: number, blend = 30): LocationDef {
    const h = padH ?? Math.max(2.5, this.baseHeight(x, z) * 0.6 + 1.5);
    const def = { id, name, x, z, r, tier, named, padH: h };
    this.locations.push(def);
    this.pads.push({ x, z, r: r * 0.9, blend, h });
    return def;
  }

  private buildIsland(): void {
    const rng = new Rng(this.seed * 7 + 13);

    /* Locations -------------------------------------------------------- */
    const aerie = this.addLocation('aerie', 'Aerie Market', -110, -170, 78, 3, true, 22, 45);
    const array = this.addLocation('array', 'Sunken Array', 180, -235, 85, 2, true, -0.75, 40);
    const kiln = this.addLocation('kiln', 'Kilnworks', 250, 135, 75, 3, true, 12, 40);
    const orchard = this.addLocation('orchard', 'Orchard Steps', -265, 150, 95, 1, true, undefined, 20);
    const abbey = this.addLocation('abbey', 'Wind Abbey', -10, 300, 58, 2, true, 52, 70);
    const docks = this.addLocation('docks', 'Breaker Docks', -385, -70, 70, 2, true, 1.6, 36);
    const huts = this.addLocation('huts', 'Watch Huts', 60, -335, 28, 1, false, undefined, 18);
    const bridge = this.addLocation('bridge', 'Bridge Station', 115, -45, 30, 1, false, undefined, 18);
    const quarry = this.addLocation('quarry', 'Quarry', 335, 275, 40, 2, false, undefined, 18);
    const camp = this.addLocation('camp', 'Driftwood Camp', -200, -345, 26, 1, false, undefined, 16);
    const turbine = this.addLocation('turbine', 'Old Turbine', 150, 335, 26, 1, false, undefined, 16);
    const cave = this.addLocation('cave', 'Hollow Cave', -395, 245, 28, 2, false, undefined, 18);
    const relay = this.addLocation('relay', 'Relay Shack', 25, 70, 20, 1, false, undefined, 14);
    const wreck = this.addLocation('wreck', 'Skiff Wreck', 405, -115, 30, 2, false, undefined, 18);

    // Orchard terraces and Sunken Array basin shape the heightfield directly.
    this.features.push((x, z, h) => {
      const d = Math.hypot(x - orchard.x, z - orchard.z);
      if (d < orchard.r + 45) {
        const w = 1 - smoothstep(orchard.r - 10, orchard.r + 45, d);
        const slopeBase = 12 + (x - orchard.x) * 0.06 - (z - orchard.z) * 0.11;
        const step = 1.25;
        const q = Math.floor(slopeBase / step) * step;
        const f = slopeBase / step - Math.floor(slopeBase / step);
        const terr = q + step * smoothstep(0.7, 1.0, f);
        return lerp(h, terr, w * 0.95);
      }
      return h;
    });
    this.features.push((x, z, h) => {
      const d = Math.hypot(x - array.x, z - array.z);
      if (d < 62) {
        const pools = [[-18, 12], [20, -16]].map(([px, pz]) => Math.hypot(x - array.x - px, z - array.z - pz));
        const pool = Math.min(...pools);
        const w = 1 - smoothstep(10, 22, pool);
        return lerp(h, -2.1, w * (1 - smoothstep(50, 62, d)));
      }
      return h;
    });
    // Hollow Cave: raise a rocky mound
    this.features.push((x, z, h) => {
      const d = Math.hypot(x - cave.x, z - cave.z);
      return d < 34 ? h + 9 * (1 - smoothstep(6, 34, d)) : h;
    });
    // Quarry: sunken pit
    this.features.push((x, z, h) => {
      const d = Math.hypot(x - quarry.x, z - quarry.z);
      return d < 30 ? lerp(h, h - 7, 1 - smoothstep(10, 30, d)) : h;
    });
    // Bridge Station: gully
    this.features.push((x, z, h) => {
      const along = x - bridge.x;
      const d = Math.abs(z - bridge.z + along * 0.0);
      if (Math.abs(along) < 80 && d < 14) return lerp(h, h - 6.5, (1 - smoothstep(4, 14, d)) * (1 - smoothstep(55, 80, Math.abs(along))));
      return h;
    });

    this.bakeHeights();
    const S = BOX_STYLES;
    // staging pier (floating transit dock) and its rails
    this.box(-846, 394, -24, -796, 400, 24, S.pier);
    this.box(-846, 400, -24, -844.6, 401.2, 24, S.metal);
    this.box(-846, 400, 22.6, -796, 401.2, 24, S.metal);
    this.box(-846, 400, -24, -796, 401.2, -22.6, S.metal);

    /* Aerie Market: dense rooftop town on a plateau ---------------------- */
    {
      const y = aerie.padH;
      const slots: [number, number, number, number, number, 'n' | 's' | 'e' | 'w'][] = [
        [-30, -26, 14, 11, 3.6, 's'], [0, -30, 11, 9, 7.2, 's'], [26, -26, 13, 10, 3.6, 's'],
        [-34, 2, 11, 12, 3.6, 'e'], [34, 2, 12, 12, 7.2, 'w'], [-4, 0, 16, 13, 3.6, 'n'],
        [-28, 30, 13, 10, 3.6, 'n'], [4, 32, 11, 11, 3.6, 'n'], [30, 30, 14, 10, 7.2, 'n'],
        [60, -2, 9, 9, 3.6, 'w'], [-62, -4, 9, 10, 3.6, 'e'],
      ];
      slots.forEach(([dx, dz, w, d, h, door], i) => {
        const b = this.addBuilding('aerie', aerie.x + dx, aerie.z + dz, w, d, h, door, y, i % 3 === 0 ? S.limestone : i % 3 === 1 ? S.wood : S.stone, i % 2 ? S.fabricA : S.copper, rng, { crates: 2, chestInside: w * d > 110 || i % 4 === 0 });
        if (h > 7) this.addStairs(b.x + w / 2 + 1.1, b.z - d / 2 + 1.5, 0, 1, h + 0.4, y, 2.2, S.stone);
        else if (i % 2 === 0) this.addStairs(b.x - w / 2 - 1.1, b.z + d / 2 - 1.5, 0, -1, h + 0.4, y, 2.2, S.stone);
      });
      // central plaza props
      this.cyl(aerie.x + 4, aerie.z + 14, 1.6, y, y + 6, 'pillar', S.copper);
      this.cyl(aerie.x - 18, aerie.z + 14, 1.2, y, y + 5, 'pillar', S.copper);
      this.sockets.push({ x: aerie.x + 4, y: y + 0.15, z: aerie.z + 18, tier: 3, kind: 'locker', loc: 'aerie', weaponBias: false });
      this.sockets.push({ x: aerie.x - 20, y: y + 0.15, z: aerie.z + 18, tier: 3, kind: 'locker', loc: 'aerie', weaponBias: false });
      // ziplines between rooftops
      this.ziplines.push({ id: 0, name: 'Market Line', a: { x: aerie.x + 34, y: y + 7.9, z: aerie.z + 8 }, b: { x: aerie.x - 62, y: y + 4.5, z: aerie.z - 4 } });
      this.ziplines.push({ id: 1, name: 'Market Drop', a: { x: aerie.x + 30, y: y + 8.2, z: aerie.z + 36 }, b: { x: aerie.x + 4, y: y + 4.5, z: aerie.z - 36 } });
    }

    /* Sunken Array: flooded dishes ---------------------------------------- */
    {
      const platY = 0.8;
      const spots: [number, number][] = [[-8, -4], [38, 22], [-42, -30], [4, 38]];
      spots.forEach(([dx, dz], i) => {
        const px = array.x + dx, pz = array.z + dz;
        this.box(px - 9, -2.5, pz - 9, px + 9, platY, pz + 9, S.limestone);
        // stepping stones from water
        this.box(px - 11.2, -2.5, pz - 1.5, px - 9, -0.2, pz + 1.5, S.stone);
        this.box(px - 13.0, -2.5, pz - 1.5, px - 11.2, -0.8, pz + 1.5, S.stone);
        if (i < 3) {
          this.addBuilding('array', px, pz, 8, 7, 3.2, (['n', 's', 'e'] as const)[i], platY, S.limestone, S.copper, rng, { crates: 1, chestInside: i === 0 });
        } else {
          this.cyl(px, pz, 5, platY, platY + 5.5, 'dish', S.copper);
        }
      });
      this.cyl(array.x + 22, array.z - 28, 4.2, -0.8, 6.5, 'dish', S.copper);
      this.cyl(array.x - 28, array.z + 22, 4.6, -0.8, 7.5, 'dish', S.copper);
      this.sockets.push({ x: array.x + 28, y: -0.45, z: array.z - 4, tier: 2, kind: 'floor', loc: 'array', weaponBias: true });
      // service tunnel mouth
      this.addBuilding('array', array.x + 52, array.z + 6, 7, 14, 3.0, 'w', 0.4, S.stone, S.stone, rng, { crates: 1 });
    }

    /* Kilnworks: foundry hall, catwalks, vault ------------------------------ */
    {
      const y = kiln.padH;
      const hall = this.addBuilding('kiln', kiln.x - 10, kiln.z - 6, 34, 20, 9, 'e', y, S.metal, S.dark, rng, { crates: 4, chestInside: true });
      // catwalk inside hall mid-height
      this.box(hall.x - 14, y + 4.2, hall.z - 3, hall.x + 14, y + 4.5, hall.z + 3, S.metal);
      this.addStairs(hall.x - 16.5 + 1, hall.z - 5, 0, 1, 4.5, y, 2, S.metal);
      // vault
      const vault = this.addBuilding('kiln', kiln.x + 28, kiln.z + 14, 10, 10, 4.2, 'w', y, S.stone, S.copper, rng, { crates: 0 });
      this.sockets.push({ x: vault.x, y: y, z: vault.z - 1.5, tier: 4, kind: 'chest', loc: 'kiln', weaponBias: false });
      this.sockets.push({ x: vault.x, y: y, z: vault.z + 1.5, tier: 4, kind: 'chest', loc: 'kiln', weaponBias: false });
      this.addBuilding('kiln', kiln.x - 6, kiln.z + 30, 14, 10, 4, 'n', y, S.metal, S.copper, rng, { crates: 2, chestInside: false });
      this.addBuilding('kiln', kiln.x - 40, kiln.z + 22, 10, 9, 3.6, 'e', y, S.stone, S.dark, rng, { crates: 1 });
      this.cyl(kiln.x + 12, kiln.z - 26, 2.6, y, y + 24, 'stack', S.metal);
      this.cyl(kiln.x + 2, kiln.z - 30, 2.1, y, y + 19, 'stack', S.metal);
      this.cyl(kiln.x + 22, kiln.z - 14, 3.2, y, y + 5, 'tank', S.copper);
      // heat channels (damage hazards)
      this.hazards.push({ x0: kiln.x + 14, z0: kiln.z - 34, x1: kiln.x + 16.5, z1: kiln.z - 6, dps: 9 });
      this.hazards.push({ x0: kiln.x - 44, z0: kiln.z + 8, x1: kiln.x - 22, z1: kiln.z + 10.5, dps: 9 });
      this.sockets.push({ x: kiln.x + 16, y: y + 0.15, z: kiln.z + 6, tier: 3, kind: 'locker', loc: 'kiln', weaponBias: false });
    }

    /* Orchard Steps: farms, walls, trees ------------------------------------- */
    {
      const spots: [number, number, number, number, 'n' | 's' | 'e' | 'w'][] = [[-30, -25, 11, 9, 's'], [28, -10, 9, 9, 'w'], [-5, 32, 12, 9, 'n']];
      spots.forEach(([dx, dz, w, d, door], i) => {
        const gx = orchard.x + dx, gz = orchard.z + dz;
        const gy = this.heightAt(gx, gz);
        // flatten footprint by lifting a plinth up to the highest ground under it
        let top = gy;
        for (let a = -w / 2; a <= w / 2; a += 2) for (let b = -d / 2; b <= d / 2; b += 2) top = Math.max(top, this.heightAt(gx + a, gz + b));
        this.box(gx - w / 2 - 0.3, gy - 3, gz - d / 2 - 0.3, gx + w / 2 + 0.3, top, gz + d / 2 + 0.3, S.stone);
        this.addBuilding('orchard', gx, gz, w, d, 3.4, door, top, S.limestone, i % 2 ? S.fabricB : S.wood, rng, { crates: 1, chestInside: i === 0 });
      });
      // stone terrace walls as cover (low walls)
      for (let i = 0; i < 14; i++) {
        const a = rng.range(0, Math.PI * 2), dd = rng.range(15, 85);
        const wx = orchard.x + Math.cos(a) * dd, wz = orchard.z + Math.sin(a) * dd;
        const g = this.heightAt(wx, wz);
        const len = rng.range(4, 8), horiz = rng.chance(0.5);
        this.box(wx - (horiz ? len / 2 : 0.4), g - 0.5, wz - (horiz ? 0.4 : len / 2), wx + (horiz ? len / 2 : 0.4), g + 1.25, wz + (horiz ? 0.4 : len / 2), S.stone);
      }
      for (let gx = -70; gx <= 70; gx += 11) for (let gz = -70; gz <= 70; gz += 11) {
        const px = orchard.x + gx + rng.range(-2, 2), pz = orchard.z + gz + rng.range(-2, 2);
        if (Math.hypot(gx, gz) > 85 || this.nearBuilding(px, pz, 6) || !this.isLand(px, pz)) continue;
        if (rng.chance(0.6)) this.cyl(px, pz, 0.45, this.heightAt(px, pz), this.heightAt(px, pz) + 4.2, 'tree', 1);
      }
      this.sockets.push({ x: orchard.x + 2, y: this.heightAt(orchard.x + 2, orchard.z - 4) + 0.15, z: orchard.z - 4, tier: 1, kind: 'locker', loc: 'orchard', weaponBias: false });
    }

    /* Wind Abbey: hilltop ruin with vent ------------------------------------- */
    {
      const y = abbey.padH;
      // broken walls / arches
      const walls: [number, number, number, number, number][] = [[-22, -14, 20, 1.2, 5], [22, -14, 1.2, 14, 6], [-22, 14, 14, 1.2, 4], [4, 18, 1.2, 10, 7], [0, 0, 6, 1, 2.5]];
      walls.forEach(([dx, dz, w, d, h]) => this.box(abbey.x + dx - w / 2, y, abbey.z + dz - d / 2, abbey.x + dx + w / 2, y + h, abbey.z + dz + d / 2, S.limestone));
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2, px = abbey.x + Math.cos(a) * 14, pz = abbey.z + Math.sin(a) * 14;
        this.cyl(px, pz, 1.1, y, y + (i % 2 ? 6 : 3.4), 'pillar', S.limestone);
      }
      this.addBuilding('abbey', abbey.x - 6, abbey.z - 2, 11, 9, 4.4, 's', y, S.limestone, S.fabricB, rng, { crates: 1, chestInside: true });
      this.addBuilding('abbey', abbey.x + 26, abbey.z + 8, 8, 8, 3.6, 'w', y, S.stone, S.stone, rng, { crates: 0 });
      this.vents.push({ x: abbey.x + 10, z: abbey.z - 14, r: 4.2, y, boost: 22 });
      this.vents.push({ x: abbey.x - 30, z: abbey.z + 22, r: 4.2, y, boost: 22 });
      this.sockets.push({ x: abbey.x + 12, y: y + 0.15, z: abbey.z + 4, tier: 2, kind: 'floor', loc: 'abbey', weaponBias: true });
    }

    /* Breaker Docks: warehouses, piers, cranes ------------------------------- */
    {
      const y = docks.padH;
      this.addBuilding('docks', docks.x - 18, docks.z - 22, 24, 13, 6.0, 'e', y, S.metal, S.dark, rng, { crates: 3, chestInside: true });
      this.addBuilding('docks', docks.x - 18, docks.z + 12, 22, 13, 6.0, 'e', y, S.metal, S.dark, rng, { crates: 3, chestInside: false });
      this.addBuilding('docks', docks.x + 14, docks.z - 4, 12, 10, 3.8, 's', y, S.wood, S.fabricA, rng, { crates: 2, chestInside: true });
      // piers extending west toward... sea (east side is sea? docks are on the west coast)
      this.box(docks.x - 70, y - 0.6, docks.z - 36, docks.x - 46, y + 0.05, docks.z - 31, S.pier);
      this.box(docks.x - 78, y - 0.6, docks.z + 8, docks.x - 44, y + 0.05, docks.z + 13, S.pier);
      for (let i = 0; i < 4; i++) {
        this.box(docks.x - 14 + i * 7, y, docks.z + 30, docks.x - 9 + i * 7, y + 2.2, docks.z + 34, S.crate);
      }
      // cranes (pillar legs + beam)
      const cranes: [number, number][] = [[docks.x + 24, docks.z + 28], [docks.x - 40, docks.z - 4]];
      cranes.forEach(([cx, cz], i) => {
        this.cyl(cx, cz, 0.9, y, y + 17, 'pillar', S.copper);
        this.cyl(cx + 6, cz, 0.9, y, y + 17, 'pillar', S.copper);
        this.box(cx - 0.5, y + 16.5, cz - 0.5, cx + 14, y + 17.4, cz + 0.5, S.copper);
        this.sockets.push({ x: cx + 3, y: y + 0.15, z: cz + 3, tier: 2, kind: 'floor', loc: 'docks', weaponBias: i === 0 });
      });
      this.ziplines.push({ id: 2, name: 'Crane Run', a: { x: docks.x + 24, y: y + 16.2, z: docks.z + 28 }, b: { x: docks.x - 60, y: y + 1.2, z: docks.z - 33 } });
    }

    /* Landmarks ---------------------------------------------------------------- */
    {
      const flatTop = (x: number, z: number, w: number, d: number) => {
        let top = -99, bot = 99;
        for (let a = -w / 2; a <= w / 2; a += 1.5) for (let b = -d / 2; b <= d / 2; b += 1.5) { const hh = this.heightAt(x + a, z + b); top = Math.max(top, hh); bot = Math.min(bot, hh); }
        return top;
      };
      const small = (loc: LocationDef, dx: number, dz: number, w: number, d: number, h: number, door: 'n' | 's' | 'e' | 'w', style: number, chest = false) => {
        const x = loc.x + dx, z = loc.z + dz;
        const top = flatTop(x, z, w, d);
        this.box(x - w / 2 - 0.3, top - 3, z - d / 2 - 0.3, x + w / 2 + 0.3, top, z + d / 2 + 0.3, S.stone);
        return this.addBuilding(loc.id, x, z, w, d, h, door, top, style, S.wood, rng, { crates: 1, chestInside: chest });
      };
      // Watch Huts: stilted huts
      small(huts, -8, 0, 7, 6, 3.2, 'e', S.wood, true); small(huts, 10, 6, 6, 6, 3.2, 'w', S.wood);
      // Bridge Station: station house + bridge deck across gully
      small(bridge, 0, 18, 9, 7, 3.4, 'n', S.limestone, true);
      const by = this.heightAt(bridge.x - 30, bridge.z);
      this.box(bridge.x - 20, by - 0.4, bridge.z - 2.6, bridge.x + 20, by + 0.2, bridge.z + 2.6, S.pier);
      // Quarry
      small(quarry, 22, -6, 8, 7, 3.4, 'w', S.stone, true);
      for (let i = 0; i < 6; i++) this.cyl(quarry.x + rng.range(-24, 24), quarry.z + rng.range(-24, 24), rng.range(1.6, 3), -20, this.heightAt(quarry.x, quarry.z) + 4, 'rock', S.stone);
      // Driftwood Camp
      small(camp, 0, 0, 6, 6, 3, 's', S.fabricA);
      this.sockets.push({ x: camp.x + 6, y: this.heightAt(camp.x + 6, camp.z + 3) + 0.15, z: camp.z + 3, tier: 1, kind: 'floor', loc: 'camp', weaponBias: true });
      // Turbine
      const ty = this.heightAt(turbine.x, turbine.z);
      this.cyl(turbine.x, turbine.z, 1.8, ty, ty + 22, 'pillar', S.copper);
      small(turbine, 8, 6, 6, 5, 3, 'w', S.copper);
      // Hollow Cave: stone arch entrance
      {
        const cy = this.heightAt(cave.x, cave.z);
        small(cave, 0, 6, 9, 8, 3.6, 'n', S.stone, true);
        this.box(cave.x - 9, cy, cave.z - 2, cave.x - 4, cy + 6, cave.z + 3, S.stone);
        this.box(cave.x + 4, cy, cave.z - 2, cave.x + 9, cy + 6, cave.z + 3, S.stone);
      }
      // Relay Shack
      small(relay, 0, 0, 6, 6, 3.2, 's', S.metal, true);
      // Wreck
      const wy = this.heightAt(wreck.x, wreck.z);
      this.box(wreck.x - 9, wy + 0.2, wreck.z - 3, wreck.x + 5, wy + 3.4, wreck.z + 3, S.copper);
      this.box(wreck.x + 5, wy + 0.6, wreck.z - 2.2, wreck.x + 11, wy + 2.4, wreck.z + 2.2, S.fabricA);
      this.sockets.push({ x: wreck.x - 3, y: wy + 3.6, z: wreck.z, tier: 2, kind: 'floor', loc: 'wreck', weaponBias: true });
      this.sockets.push({ x: wreck.x + 3, y: wy + 0.3, z: wreck.z + 6, tier: 2, kind: 'chest', loc: 'wreck', weaponBias: false });
    }

    /* Trees and boulders ---------------------------------------------------------- */
    const forestNoise = (x: number, z: number) => fbm(x / 120 + 40, z / 120 + 40, this.seed + 77, 3);
    let attempts = 0;
    let trees = 0;
    while (trees < 760 && attempts < 9000) {
      attempts++;
      const x = rng.range(-480, 480), z = rng.range(-480, 480);
      const y = this.heightAt(x, z);
      if (y < 1.2 || y > 44 || this.slopeAt(x, z) > 0.55) continue;
      if (forestNoise(x, z) < 0.5 + rng.range(-0.1, 0.1)) continue;
      if (this.nearBuilding(x, z, 10) || this.locations.some((l) => l.id !== 'orchard' && Math.hypot(x - l.x, z - l.z) < l.r * 0.75)) continue;
      if (this.hazards.length && this.inHazard(x, z)) continue;
      const kind = rng.chance(0.78) ? 'tree' : 'rock';
      const r = kind === 'tree' ? 0.42 : rng.range(1.0, 2.2);
      this.cyl(x, z, r, y - 0.5, y + (kind === 'tree' ? rng.range(4.5, 7.5) : r * 1.4), kind, rng.int(0, 3));
      trees++;
    }
    for (let i = 0; i < 90; i++) {
      const x = rng.range(-470, 470), z = rng.range(-470, 470);
      const y = this.heightAt(x, z);
      if (y < 1.5 || this.nearBuilding(x, z, 8) || this.slopeAt(x, z) > 0.8) continue;
      const r = rng.range(1.2, 3);
      this.cyl(x, z, r, y - 1, y + r * 1.1, 'rock', rng.int(0, 3));
    }
    // sparse loose loot sockets around landmarks and forest paths
    for (let i = 0; i < 40; i++) {
      const x = rng.range(-430, 430), z = rng.range(-430, 430);
      const y = this.heightAt(x, z);
      if (y < 2 || this.slopeAt(x, z) > 0.5) continue;
      this.sockets.push({ x, y: y + 0.15, z, tier: 1, kind: 'floor', loc: 'wild', weaponBias: i % 3 === 0 });
    }

  }

  private nearBuilding(x: number, z: number, margin: number): boolean {
    for (const b of this.buildings) {
      if (Math.abs(x - b.x) < b.w / 2 + margin && Math.abs(z - b.z) < b.d / 2 + margin) return true;
    }
    return false;
  }

  /** Authored-valid zone center candidates: land, gentle slope, cover-rich, not hazardous. */
  private computeZoneCenters(_rng: Rng): void {
    const tB: Box[] = [], tC: Cyl[] = [];
    for (let x = -420; x <= 420; x += 20) {
      for (let z = -420; z <= 420; z += 20) {
        const y = this.heightAt(x, z);
        if (y < 1.8 || this.slopeAt(x, z) > 0.45 || this.inHazard(x, z)) continue;
        if (Math.hypot(x, z) > 440) continue;
        this.queryCircle(x, z, 35, tB, tC);
        const cover = tB.length * 0.6 + tC.length;
        if (cover < 6) continue;
        // reject centers sitting on roofs
        const g = this.groundHeight(x, z, y + 0.1, 0.1, 0.4, [], []);
        if (g > y + 2) continue;
        this.zoneCenters.push({ x, z, cover });
      }
    }
  }

  /* ----------------------------------------------------------- practice */
  private buildPractice(): void {
    const S = BOX_STYLES;
    this.locations.push({ id: 'range', name: 'Practice Range', x: 0, z: 0, r: 80, tier: 3, named: true, padH: 4 });
    this.features.push((x, z) => {
      const d = Math.max(Math.abs(x), Math.abs(z));
      if (d > 120) return -9;
      const edge = smoothstep(86, 100, d);
      let h = 4 - edge * 14;
      // swimming pool in the east corner
      const pd = Math.hypot(x - 50, z + 45);
      if (pd < 14) h = lerp(h, -2.2, 1 - smoothstep(8, 14, pd));
      // slide hill: descends toward +z around x=-66
      if (Math.abs(x + 66) < 14) h += 6 * (1 - smoothstep(-70, -34, z)) * (1 - smoothstep(8, 14, Math.abs(x + 66)));
      return h;
    });
    this.bakeHeights();
    // boundary walls
    this.box(-90, 0, -91, 90, 12, -88, S.stone); this.box(-90, 0, 88, 90, 12, 91, S.stone);
    this.box(-91, 0, -90, -88, 12, 90, S.stone); this.box(88, 0, -90, 91, 12, 90, S.stone);
    // mantle course
    [0.7, 1.1, 1.45].forEach((h, i) => this.box(-70 + i * 6, 4, 20, -66 + i * 6, 4 + h, 24, S.crate));
    this.box(-74, 4, 28, -56, 4 + 1.3, 31, S.stone);
    // cover and building
    this.addBuilding('range', 30, 40, 12, 9, 3.6, 's', 4, S.limestone, S.copper, new Rng(5), { crates: 2 });
    for (let i = 0; i < 5; i++) this.box(-20 + i * 9, 4, -30, -17 + i * 9, 4 + 1.2 + (i % 2) * 0.8, -28, S.stone);
    this.cyl(20, -20, 1.4, 4, 9, 'pillar', S.copper);
    this.cyl(-30, -10, 2.2, 2, 6, 'rock', S.stone);
    // zipline
    this.ziplines.push({ id: 0, name: 'Range Line', a: { x: 30, y: 12, z: 40 }, b: { x: -10, y: 5.2, z: 0 } });
    this.vents.push({ x: 60, z: 60, r: 4, y: 4, boost: 22 });
  }
}

/* -------------------------------------------------------------- geometry */
export function circleOverlapsBox(x: number, z: number, r: number, b: Box): boolean {
  const cx = clamp(x, b.minX, b.maxX), cz = clamp(z, b.minZ, b.maxZ);
  const dx = x - cx, dz = z - cz;
  return dx * dx + dz * dz < r * r;
}

export function rayBox(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, b: Box): number {
  let tmin = 0, tmax = Infinity;
  const slab = (o: number, d: number, mn: number, mx: number): boolean => {
    if (Math.abs(d) < 1e-9) return o >= mn && o <= mx;
    let t1 = (mn - o) / d, t2 = (mx - o) / d;
    if (t1 > t2) { const tt = t1; t1 = t2; t2 = tt; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    return tmin <= tmax;
  };
  if (!slab(ox, dx, b.minX, b.maxX)) return -1;
  if (!slab(oy, dy, b.minY, b.maxY)) return -1;
  if (!slab(oz, dz, b.minZ, b.maxZ)) return -1;
  return tmin;
}

export function rayCyl(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, c: Cyl): number {
  const fx = ox - c.x, fz = oz - c.z;
  const a = dx * dx + dz * dz;
  if (a < 1e-9) return -1;
  const bq = 2 * (fx * dx + fz * dz);
  const cq = fx * fx + fz * fz - c.r * c.r;
  const disc = bq * bq - 4 * a * cq;
  if (disc < 0) return -1;
  const s = Math.sqrt(disc);
  let t = (-bq - s) / (2 * a);
  if (t < 0) t = (-bq + s) / (2 * a);
  if (t < 0) return -1;
  const y = oy + dy * t;
  if (y < c.y0 || y > c.y1) return -1;
  return t;
}

/** Ray vs vertical capsule-ish player volume: returns hit t and the hit height above feet. */
export function rayVerticalCylinder(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, cx: number, cz: number, r: number, y0: number, y1: number): { t: number; y: number } | null {
  const fx = ox - cx, fz = oz - cz;
  const a = dx * dx + dz * dz;
  if (a < 1e-9) return null;
  const bq = 2 * (fx * dx + fz * dz);
  const cq = fx * fx + fz * fz - r * r;
  const disc = bq * bq - 4 * a * cq;
  if (disc < 0) return null;
  const s = Math.sqrt(disc);
  let t = (-bq - s) / (2 * a);
  if (t < 0) t = (-bq + s) / (2 * a);
  if (t < 0) return null;
  const y = oy + dy * t;
  if (y < y0 || y > y1) return null;
  return { t, y };
}
