// Map construction kit. A map is authored as carved rooms on a 1 m grid plus explicit prop boxes;
// the builder turns that into merged collision boxes, render metadata, zones and lights.
import { CollisionWorld, F_SOLID, MATS, type Box, type MatId } from './world';

export type Theme = 'yard' | 'dock' | 'hall' | 'lab' | 'atrium' | 'corridor' | 'mid' | 'service' | 'glasshall';

export interface Rect {
  x0: number;
  z0: number;
  x1: number;
  z1: number;
}

export interface RoomDef extends Rect {
  id: number;
  name: string;
  floor: number;
  ceil: number; // Infinity = open sky
  theme: Theme;
}

export interface LightDef {
  x: number;
  y: number;
  z: number;
  r: number;
  g: number;
  b: number;
  radius: number;
  /** render a ceiling fixture for this light */
  fixture: boolean;
}

export interface Spot {
  x: number;
  z: number;
  y?: number;
  lookX: number;
  lookZ: number;
  name?: string;
}

export interface EntryDef {
  name: string;
  /** staging point outside the site */
  stage: { x: number; z: number; y?: number };
  /** waypoints walked in order during the execute */
  path: { x: number; z: number; y?: number }[];
  viaMid: boolean;
}

export interface SiteDef {
  id: 'A' | 'B';
  name: string;
  zone: Rect;
  center: { x: number; z: number };
  plantSpots: { x: number; z: number }[];
  holds: Spot[];
  postPlant: Spot[];
  entries: EntryDef[];
  /** where attackers want sight blocked during an execute */
  veilTargets: { x: number; z: number }[];
  /** defender-facing approach points, used for retakes */
  retake: { x: number; z: number; y?: number }[];
}

export interface SpawnPoint {
  x: number;
  z: number;
  yaw: number;
}

export interface SignDef {
  text: string;
  x: number;
  y: number;
  z: number;
  /** outward normal of the wall the sign sits on */
  nx: number;
  nz: number;
  color: string;
}

export interface MapData {
  name: string;
  version: string;
  sizeX: number;
  sizeZ: number;
  wallTop: number;
  open: Uint8Array;
  floor: Float32Array;
  ceil: Float32Array;
  roomAt: Int16Array;
  rooms: RoomDef[];
  props: Box[];
  world: CollisionWorld;
  lights: LightDef[];
  signs: SignDef[];
  spawns: { atk: SpawnPoint[]; def: SpawnPoint[] };
  buyZones: { atk: Rect; def: Rect };
  sites: { A: SiteDef; B: SiteDef };
  midHolds: Spot[];
  calloutRects: (Rect & { name: string; minY?: number })[];
  collisionHash: string;
}

/** Wall collision extends above the visible wall so thrown utility cannot leave the playfield. */
export const WALL_COLLISION_TOP = 16;

export class MapBuilder {
  open: Uint8Array;
  floor: Float32Array;
  ceil: Float32Array;
  roomAt: Int16Array;
  rooms: RoomDef[] = [];
  propDefs: (Omit<Box, 'idx' | 'flags'> & { flags?: number })[] = [];
  lights: LightDef[] = [];
  signs: SignDef[] = [];
  calloutRects: (Rect & { name: string; minY?: number })[] = [];

  constructor(
    public name: string,
    public version: string,
    public sizeX: number,
    public sizeZ: number,
    public wallTop: number,
  ) {
    const n = sizeX * sizeZ;
    this.open = new Uint8Array(n);
    this.floor = new Float32Array(n);
    this.ceil = new Float32Array(n).fill(Infinity);
    this.roomAt = new Int16Array(n).fill(-1);
  }

  /** Carves an open room out of solid mass. Coordinates are whole metres, upper bounds exclusive. */
  room(name: string, x0: number, z0: number, x1: number, z1: number, theme: Theme, opts: { floor?: number; ceil?: number } = {}): RoomDef {
    const r: RoomDef = { id: this.rooms.length, name, x0, z0, x1, z1, theme, floor: opts.floor ?? 0, ceil: opts.ceil ?? Infinity };
    this.rooms.push(r);
    for (let z = z0; z < z1; z++) {
      for (let x = x0; x < x1; x++) {
        const i = z * this.sizeX + x;
        this.open[i] = 1;
        this.floor[i] = r.floor;
        this.ceil[i] = r.ceil;
        this.roomAt[i] = r.id;
      }
    }
    return r;
  }

  prop(x0: number, z0: number, x1: number, z1: number, y0: number, y1: number, mat: MatId, style: string, flags?: number): void {
    this.propDefs.push({ x0, y0, z0, x1, y1, z1, mat, kind: 'prop', style, flags });
  }

  /** A staircase rising from yLow to yHigh toward `dir`. Steps never exceed the player's step height. */
  stairs(x0: number, z0: number, x1: number, z1: number, dir: '+x' | '-x' | '+z' | '-z', yLow: number, yHigh: number, mat: MatId = 'concrete'): void {
    const rise = yHigh - yLow;
    const n = Math.ceil(rise / 0.27);
    const alongX = dir === '+x' || dir === '-x';
    const len = alongX ? x1 - x0 : z1 - z0;
    const run = len / n;
    for (let i = 0; i < n; i++) {
      const top = yLow + ((i + 1) * rise) / n;
      let bx0 = x0;
      let bx1 = x1;
      let bz0 = z0;
      let bz1 = z1;
      if (dir === '+x') {
        bx0 = x0 + i * run;
        bx1 = x0 + (i + 1) * run;
      } else if (dir === '-x') {
        bx1 = x1 - i * run;
        bx0 = x1 - (i + 1) * run;
      } else if (dir === '+z') {
        bz0 = z0 + i * run;
        bz1 = z0 + (i + 1) * run;
      } else {
        bz1 = z1 - i * run;
        bz0 = z1 - (i + 1) * run;
      }
      this.propDefs.push({ x0: bx0, y0: yLow, z0: bz0, x1: bx1, y1: top, z1: bz1, mat, kind: 'stair', style: 'stair' });
    }
  }

  barrier(x0: number, z0: number, x1: number, z1: number, y0 = 0, y1 = 3.2): void {
    this.propDefs.push({ x0, y0, z0, x1, y1, z1, mat: 'barrier', kind: 'barrier', style: 'barrier' });
  }

  light(x: number, y: number, z: number, color: [number, number, number], radius: number, fixture = true): void {
    this.lights.push({ x, y, z, r: color[0], g: color[1], b: color[2], radius, fixture });
  }

  /** Regular grid of ceiling lights inside a rectangle. */
  lightGrid(r: Rect, y: number, spacing: number, color: [number, number, number], radius: number): void {
    const nx = Math.max(1, Math.round((r.x1 - r.x0) / spacing));
    const nz = Math.max(1, Math.round((r.z1 - r.z0) / spacing));
    for (let i = 0; i < nx; i++)
      for (let j = 0; j < nz; j++)
        this.light(r.x0 + ((i + 0.5) * (r.x1 - r.x0)) / nx, y, r.z0 + ((j + 0.5) * (r.z1 - r.z0)) / nz, color, radius);
  }

  sign(text: string, x: number, y: number, z: number, nx: number, nz: number, color = '#e8e4da'): void {
    this.signs.push({ text, x, y, z, nx, nz, color });
  }

  callout(name: string, x0: number, z0: number, x1: number, z1: number, minY?: number): void {
    this.calloutRects.push({ name, x0, z0, x1, z1, minY });
  }

  private mergeCells(match: (i: number) => boolean, key: (i: number) => number, emit: (x0: number, z0: number, x1: number, z1: number, k: number) => void): void {
    const sx = this.sizeX;
    const sz = this.sizeZ;
    const used = new Uint8Array(sx * sz);
    for (let z = 0; z < sz; z++) {
      for (let x = 0; x < sx; x++) {
        const i = z * sx + x;
        if (used[i] || !match(i)) continue;
        const k = key(i);
        let w = 1;
        while (x + w < sx && !used[i + w] && match(i + w) && key(i + w) === k) w++;
        let h = 1;
        outer: while (z + h < sz) {
          for (let xx = 0; xx < w; xx++) {
            const j = (z + h) * sx + x + xx;
            if (used[j] || !match(j) || key(j) !== k) break outer;
          }
          h++;
        }
        for (let zz = 0; zz < h; zz++) for (let xx = 0; xx < w; xx++) used[(z + zz) * sx + x + xx] = 1;
        emit(x, z, x + w, z + h, k);
      }
    }
  }

  finish(extra: Pick<MapData, 'spawns' | 'buyZones' | 'sites' | 'midHolds'>): MapData {
    const world = new CollisionWorld(this.sizeX, this.sizeZ);
    // walls
    this.mergeCells(
      (i) => !this.open[i],
      () => 0,
      (x0, z0, x1, z1) => world.add({ x0, y0: -2, z0, x1, y1: WALL_COLLISION_TOP, z1, mat: 'concrete', kind: 'wall' }),
    );
    // floors
    this.mergeCells(
      (i) => !!this.open[i],
      (i) => Math.round(this.floor[i] * 1000),
      (x0, z0, x1, z1, k) => world.add({ x0, y0: -2, z0, x1, y1: k / 1000, z1, mat: 'concrete', kind: 'floor' }),
    );
    // ceilings and lintels
    this.mergeCells(
      (i) => !!this.open[i] && isFinite(this.ceil[i]),
      (i) => Math.round(this.ceil[i] * 1000),
      (x0, z0, x1, z1, k) => world.add({ x0, y0: k / 1000, z0, x1, y1: WALL_COLLISION_TOP, z1, mat: 'concrete', kind: 'ceil' }),
    );
    // invisible sky lid over open areas keeps grenades in bounds
    world.add({ x0: 0, y0: WALL_COLLISION_TOP, z0: 0, x1: this.sizeX, y1: WALL_COLLISION_TOP + 1, z1: this.sizeZ, mat: 'concrete', kind: 'ceil', flags: F_SOLID });
    const props: Box[] = [];
    for (const p of this.propDefs) props.push(world.add({ ...p, flags: p.flags ?? MATS[p.mat].flags }));
    world.finalize();
    return {
      name: this.name,
      version: this.version,
      sizeX: this.sizeX,
      sizeZ: this.sizeZ,
      wallTop: this.wallTop,
      open: this.open,
      floor: this.floor,
      ceil: this.ceil,
      roomAt: this.roomAt,
      rooms: this.rooms,
      props,
      world,
      lights: this.lights,
      signs: this.signs,
      calloutRects: this.calloutRects,
      collisionHash: world.hash(),
      ...extra,
    };
  }
}

export function inRect(r: Rect, x: number, z: number): boolean {
  return x >= r.x0 && x < r.x1 && z >= r.z0 && z < r.z1;
}

/** Short location name for a world position (HUD callout, bot radio). */
export function calloutAt(map: MapData, x: number, z: number, y = 0): string {
  for (const c of map.calloutRects) {
    if (inRect(c, x, z) && (c.minY === undefined || y >= c.minY)) return c.name;
  }
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  if (ix < 0 || iz < 0 || ix >= map.sizeX || iz >= map.sizeZ) return '';
  const r = map.roomAt[iz * map.sizeX + ix];
  return r >= 0 ? map.rooms[r].name : '';
}
