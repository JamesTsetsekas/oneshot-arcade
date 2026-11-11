// Modular island kit: turns authored structure calls into collision boxes, render decor and gameplay sockets.
import { BoxFlag, Surf, makeBox, type Box, type Heightfield } from "./collision";

export const Shape = { Box: 0, Cyl: 1, Cone: 2, Sphere: 3, Prism: 4 } as const;

export interface Decor {
  shape: number;
  x: number;
  y: number;
  z: number;
  sx: number;
  sy: number;
  sz: number;
  rx: number;
  ry: number;
  rz: number;
  color: number;
  glow: number;
}

export interface LootSocket {
  x: number;
  y: number;
  z: number;
  loc: number;
  tier: number;
  cluster: number;
  guaranteed: boolean;
}
export interface ChestSocket {
  x: number;
  y: number;
  z: number;
  yaw: number;
  loc: number;
  tier: number;
  kind: "chest" | "locker" | "vault";
}
export interface Zipline {
  ax: number;
  ay: number;
  az: number;
  bx: number;
  by: number;
  bz: number;
}
export interface Ascender {
  x: number;
  z: number;
  y0: number;
  y1: number;
  exitYaw: number;
}
export interface Vent {
  x: number;
  y: number;
  z: number;
  r: number;
}
export interface Hazard {
  x: number;
  y: number;
  z: number;
  hx: number;
  hz: number;
  yaw: number;
}
export interface TreeInst {
  x: number;
  y: number;
  z: number;
  s: number;
  kind: number;
  tint: number;
}
export interface RockInst {
  x: number;
  y: number;
  z: number;
  sx: number;
  sy: number;
  sz: number;
  yaw: number;
  tint: number;
}
export interface Spinner {
  x: number;
  y: number;
  z: number;
  yaw: number;
  r: number;
  color: number;
}

export const COL = {
  lime: 0xeadfc4,
  limeDark: 0xcbbf9f,
  limeWarm: 0xf3e4bd,
  limeCool: 0xdcdccf,
  copper: 0xc27a42,
  copperDark: 0x8f5631,
  verdigris: 0x5fb3a1,
  wood: 0x94693f,
  woodDark: 0x6d4b2d,
  metal: 0x5b6772,
  metalDark: 0x3d464f,
  teal: 0x1fb0a6,
  coral: 0xea6a50,
  saffron: 0xf4b63a,
  magenta: 0xcc4c9f,
  indigo: 0x4f63d6,
  roof: 0xb95a3e,
  roofDark: 0x8d4630,
  concrete: 0xaeb0aa,
  concreteDark: 0x8b8e89,
  rust: 0xa3552f,
  heat: 0xff7a1c,
  slate: 0x6f7a86,
  cream: 0xf6efdc,
  rock: 0xd9cfb4,
} as const;

export const FABRICS: readonly number[] = [COL.teal, COL.coral, COL.saffron, COL.magenta, COL.indigo];

const T = 0.35;
export const FLOOR = 0.2;

export interface HouseOpts {
  h?: number;
  color?: number;
  roofColor?: number;
  roof?: "flat" | "parapet" | "gable";
  doors?: string; // any of f,b,l,r
  doorW?: number;
  windows?: boolean;
  stairs?: boolean;
  upper?: boolean;
  canopy?: number;
  loot?: number;
  chest?: boolean;
  locker?: boolean;
  crates?: number;
}

export class Kit {
  boxes: Box[] = [];
  decor: Decor[] = [];
  sockets: LootSocket[] = [];
  chests: ChestSocket[] = [];
  ziplines: Zipline[] = [];
  ascenders: Ascender[] = [];
  vents: Vent[] = [];
  hazards: Hazard[] = [];
  trees: TreeInst[] = [];
  rocks: RockInst[] = [];
  spinners: Spinner[] = [];
  buildingSpots: { x: number; z: number; loc: number }[] = [];

  loc = -1;
  tier = 1;
  cluster = 0;

  ox = 0;
  oy = 0;
  oz = 0;
  yaw = 0;
  private c = 1;
  private s = 0;

  constructor(readonly hf: Heightfield, private rand: () => number) {}

  at(x: number, y: number, z: number, yaw: number): this {
    this.ox = x;
    this.oy = y;
    this.oz = z;
    this.yaw = yaw;
    this.c = Math.cos(yaw);
    this.s = Math.sin(yaw);
    return this;
  }
  /** Place the frame on the terrain; y is the highest ground under the given footprint. */
  ground(x: number, z: number, yaw: number, w = 0, d = 0): this {
    this.at(x, 0, z, yaw);
    let y = this.hf.height(x, z);
    if (w > 0) {
      for (const [lx, lz] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]] as const) {
        y = Math.max(y, this.hf.height(this.wx(lx, lz), this.wz(lx, lz)));
      }
    }
    this.oy = y;
    return this;
  }
  wx(lx: number, lz: number): number {
    return this.ox + lx * this.c + lz * this.s;
  }
  wz(lx: number, lz: number): number {
    return this.oz - lx * this.s + lz * this.c;
  }

  /** Solid box: local centre (lx,lz), bottom y0 relative to the frame, full sizes. */
  box(lx: number, y0: number, lz: number, w: number, h: number, d: number, color: number, surf: number = Surf.Stone, flags: number = BoxFlag.Solid, localYaw = 0): Box {
    const b = makeBox(this.wx(lx, lz), this.oy + y0 + h / 2, this.wz(lx, lz), w / 2, h / 2, d / 2, this.yaw + localYaw, color, surf, flags);
    this.boxes.push(b);
    return b;
  }
  dec(shape: number, lx: number, y: number, lz: number, sx: number, sy: number, sz: number, color: number, rx = 0, ry = 0, rz = 0, glow = 0): void {
    this.decor.push({ shape, x: this.wx(lx, lz), y: this.oy + y, z: this.wz(lx, lz), sx, sy, sz, rx, ry: this.yaw + ry, rz, color, glow });
  }
  socket(lx: number, y: number, lz: number, guaranteed = false): void {
    this.sockets.push({ x: this.wx(lx, lz), y: this.oy + y, z: this.wz(lx, lz), loc: this.loc, tier: this.tier, cluster: this.cluster, guaranteed });
  }
  chest(lx: number, y: number, lz: number, yaw: number, kind: "chest" | "locker" | "vault" = "chest", tier = this.tier): void {
    this.chests.push({ x: this.wx(lx, lz), y: this.oy + y, z: this.wz(lx, lz), yaw: this.yaw + yaw, loc: this.loc, tier, kind });
  }
  vent(lx: number, y: number, lz: number): void {
    const x = this.wx(lx, lz),
      z = this.wz(lx, lz);
    this.box(lx, y - 0.6, lz, 5.2, 0.75, 5.2, COL.metalDark, Surf.Metal);
    this.dec(Shape.Cyl, lx, y + 0.2, lz, 4.6, 0.14, 4.6, COL.verdigris, 0, 0, 0, 0.6);
    this.dec(Shape.Cyl, lx, y + 0.22, lz, 3.0, 0.14, 3.0, COL.cream, 0, 0, 0, 0.9);
    this.vents.push({ x, y: this.oy + y + 0.15, z, r: 2.4 });
  }
  ascender(lx: number, lz: number, y0: number, y1: number, exitLocalYaw: number): void {
    this.ascenders.push({ x: this.wx(lx, lz), z: this.wz(lx, lz), y0: this.oy + y0, y1: this.oy + y1, exitYaw: this.yaw + exitLocalYaw });
    this.dec(Shape.Cyl, lx, y0 + (y1 - y0) / 2 + 1.3, lz, 0.12, y1 - y0 + 2.6, 0.12, COL.saffron, 0, 0, 0, 0.5);
    this.dec(Shape.Cyl, lx, y0 + 0.08, lz, 1.5, 0.16, 1.5, COL.saffron, 0, 0, 0, 0.4);
  }
  /** Zipline between two world points (line height). Adds poles. */
  zipWorld(ax: number, ay: number, az: number, bx: number, by: number, bz: number, poleA = 3.1, poleB = 3.1): void {
    this.ziplines.push({ ax, ay, az, bx, by, bz });
    const save = [this.ox, this.oy, this.oz, this.yaw] as const;
    for (const [x, y, z, p] of [[ax, ay, az, poleA], [bx, by, bz, poleB]] as const) {
      this.at(x, y, z, 0);
      this.dec(Shape.Cyl, 0, -p / 2 + 0.2, 0, 0.28, p + 0.4, 0.28, COL.copperDark);
      this.dec(Shape.Box, 0, 0.25, 0, 0.9, 0.2, 0.9, COL.saffron, 0, 0, 0, 0.4);
    }
    this.at(save[0], save[1], save[2], save[3]);
  }

  /** Axis-aligned (in local frame) wall with door/window openings: [centre along wall, width, y0, y1]. */
  wall(x0: number, z0: number, x1: number, z1: number, y0: number, h: number, color: number, ops: [number, number, number, number][] = [], thick = T, surf: number = Surf.Stone): void {
    const alongX = Math.abs(x1 - x0) >= Math.abs(z1 - z0);
    const L = alongX ? Math.abs(x1 - x0) : Math.abs(z1 - z0);
    const sx = alongX ? Math.min(x0, x1) : x0;
    const sz = alongX ? z0 : Math.min(z0, z1);
    const seg = (a: number, b: number, yy: number, hh: number): void => {
      if (b - a < 0.05 || hh < 0.05) return;
      const mid = (a + b) / 2;
      if (alongX) this.box(sx + mid, yy, sz, b - a, hh, thick, color, surf);
      else this.box(sx, yy, sz + mid, thick, hh, b - a, color, surf);
    };
    const sorted = [...ops].sort((a, b) => a[0] - b[0]);
    let cur = 0;
    for (const [at, w, oy0, oy1] of sorted) {
      const a = Math.max(cur, at - w / 2),
        b = Math.min(L, at + w / 2);
      seg(cur, a, y0, h);
      seg(a, b, y0, oy0);
      seg(a, b, y0 + oy1, h - oy1);
      cur = b;
    }
    seg(cur, L, y0, h);
  }

  /** Stacked solid steps rising along +dirZ (local) starting at (lx, lz). Returns run length. */
  stairs(lx: number, lz: number, dirX: number, dirZ: number, rise: number, width: number, color: number, y0 = 0, surf: number = Surf.Stone): number {
    const n = Math.max(1, Math.ceil(rise / 0.32));
    const stepH = rise / n;
    const run = 0.42;
    for (let i = 0; i < n; i++) {
      const cx = lx + dirX * (i + 0.5) * run,
        cz = lz + dirZ * (i + 0.5) * run;
      const w = dirX !== 0 ? run : width,
        d = dirX !== 0 ? width : run;
      this.box(cx, y0 - 1.5, cz, w, 1.5 + (i + 1) * stepH, d, color, surf);
    }
    return n * run;
  }

  crate(lx: number, lz: number, size = 1.1, y0 = 0, color: number = COL.wood, yaw = 0): void {
    this.box(lx, y0, lz, size, size, size, color, Surf.Wood, BoxFlag.Solid, yaw);
  }

  /** Fabric canopy on four poles (render only) with an optional solid counter underneath. */
  stall(lx: number, lz: number, color: number, counter = true): void {
    const y = FLOOR;
    for (const [px, pz] of [[-1.6, -1.2], [1.6, -1.2], [-1.6, 1.2], [1.6, 1.2]] as const)
      this.dec(Shape.Cyl, lx + px, 1.35, lz + pz, 0.12, 2.7, 0.12, COL.woodDark);
    this.dec(Shape.Box, lx, 2.85, lz, 4.2, 0.1, 3.3, color, 0.16);
    this.dec(Shape.Box, lx, 2.62, lz + 1.72, 4.2, 0.4, 0.06, color);
    if (counter) {
      this.box(lx, y - 0.2, lz - 0.6, 3.0, 1.05, 0.8, COL.wood, Surf.Wood);
      this.crate(lx + 1.0, lz + 0.8, 0.8, 0, COL.woodDark, 0.3);
    }
  }

  /** A one-room building with openings, roof, optional exterior stairs / upper room / loot. */
  house(w: number, d: number, o: HouseOpts = {}): { roofY: number } {
    const H = o.h ?? 3.2;
    const color = o.color ?? COL.lime;
    const roofColor = o.roofColor ?? COL.limeDark;
    const doors = o.doors ?? "f";
    const doorW = o.doorW ?? 1.9;
    const doorH = Math.min(2.4, H - 0.5);
    this.cluster++;
    this.buildingSpots.push({ x: this.ox, z: this.oz, loc: this.loc });
    // foundation / floor
    this.box(0, -3, 0, w, 3 + FLOOR, d, COL.limeDark);
    const win = (len: number, n: number): [number, number, number, number][] =>
      o.windows === false ? [] : Array.from({ length: n }, (_, i) => [((i + 1) * len) / (n + 1), 1.4, 1.0, 2.1] as [number, number, number, number]);
    const door = (len: number, frac = 0.5): [number, number, number, number] => [len * frac, doorW, 0, doorH];
    const fz = d / 2 - T / 2,
      lxw = w / 2 - T / 2;
    const frontOps = doors.includes("f") ? [door(w, w > 9 ? 0.3 : 0.5), ...(w > 9 ? [[w * 0.72, 1.4, 1.0, 2.1] as [number, number, number, number]] : [])] : win(w, w > 8 ? 2 : 1);
    const backOps = doors.includes("b") ? [door(w, w > 9 ? 0.7 : 0.5)] : win(w, w > 8 ? 2 : 1);
    const sideLen = d - 2 * T;
    const leftOps = doors.includes("l") ? [door(sideLen)] : win(sideLen, 1);
    const rightOps = doors.includes("r") ? [door(sideLen)] : o.stairs ? [] : win(sideLen, 1);
    this.wall(-w / 2, fz, w / 2, fz, FLOOR, H, color, frontOps);
    this.wall(-w / 2, -fz, w / 2, -fz, FLOOR, H, color, backOps);
    this.wall(-lxw, -d / 2 + T, -lxw, d / 2 - T, FLOOR, H, color, leftOps);
    this.wall(lxw, -d / 2 + T, lxw, d / 2 - T, FLOOR, H, color, rightOps);
    // doorsteps
    if (doors.includes("f")) this.box(-w / 2 + w * (w > 9 ? 0.3 : 0.5), -3, d / 2 + 0.6, doorW + 0.6, 3.0, 1.2, COL.limeDark);
    if (doors.includes("b")) this.box(-w / 2 + w * (w > 9 ? 0.7 : 0.5), -3, -d / 2 - 0.6, doorW + 0.6, 3.0, 1.2, COL.limeDark);
    if (doors.includes("l")) this.box(-w / 2 - 0.6, -3, 0, 1.2, 3.0, doorW + 0.6, COL.limeDark);
    if (doors.includes("r")) this.box(w / 2 + 0.6, -3, 0, 1.2, 3.0, doorW + 0.6, COL.limeDark);
    const roofY = FLOOR + H;
    const style = o.roof ?? "flat";
    // cornice
    this.dec(Shape.Box, 0, roofY - 0.18, 0, w + 0.24, 0.36, d + 0.24, roofColor);
    if (style === "gable") {
      this.box(0, roofY, 0, w + 0.6, 0.3, d + 0.6, o.roofColor ?? COL.roof);
      this.box(0, roofY + 0.3, 0, w + 0.6, 0.42, d * 0.62, o.roofColor ?? COL.roof, Surf.Stone, BoxFlag.Solid | BoxFlag.NoRender);
      this.box(0, roofY + 0.72, 0, w + 0.6, 0.42, d * 0.3, o.roofColor ?? COL.roof, Surf.Stone, BoxFlag.Solid | BoxFlag.NoRender);
      this.dec(Shape.Prism, 0, roofY + 0.3 + 0.75, 0, w + 0.9, 1.5, d + 0.9, o.roofColor ?? COL.roof);
    } else {
      this.box(0, roofY, 0, w + 0.4, 0.3, d + 0.4, roofColor);
      if (style === "parapet") {
        const py = roofY + 0.3,
          ph = 0.75;
        this.wall(-w / 2 - 0.2, d / 2 + 0.05, w / 2 + 0.2, d / 2 + 0.05, py, ph, color);
        this.wall(-w / 2 - 0.2, -d / 2 - 0.05, w / 2 + 0.2, -d / 2 - 0.05, py, ph, color);
        this.wall(-w / 2 - 0.05, -d / 2 + 0.1, -w / 2 - 0.05, d / 2 - 0.1, py, ph, color);
        if (!o.stairs) this.wall(w / 2 + 0.05, -d / 2 + 0.1, w / 2 + 0.05, d / 2 - 0.1, py, ph, color);
      }
    }
    if (o.stairs && d >= 6) {
      // exterior stairs along the right wall, rising toward the back
      const rise = roofY + 0.3;
      const n = Math.ceil(rise / 0.32);
      const run = n * 0.42;
      const start = Math.min(d / 2, -d / 2 + run + 0.2);
      this.stairs(w / 2 + 0.2 + 0.65, start, 0, -1, rise, 1.3, COL.limeDark);
      // landing
      this.box(w / 2 + 0.85, -1.5, start - run - 0.6, 1.3, 1.5 + rise, 1.2, COL.limeDark);
    }
    if (o.upper && style !== "gable") {
      const uw = Math.max(4.5, w * 0.55),
        ud = Math.max(4.5, d * 0.6);
      const ux = -w / 2 + uw / 2 + 0.3,
        uz = -d / 2 + ud / 2 + 0.3;
      const y0 = roofY + 0.3;
      const UH = 2.9;
      this.wall(ux - uw / 2, uz + ud / 2 - T / 2, ux + uw / 2, uz + ud / 2 - T / 2, y0, UH, color, [[uw / 2, 1.7, 0, 2.2]]);
      this.wall(ux - uw / 2, uz - ud / 2 + T / 2, ux + uw / 2, uz - ud / 2 + T / 2, y0, UH, color, [[uw / 2, 1.3, 1.0, 2.0]]);
      this.wall(ux - uw / 2 + T / 2, uz - ud / 2 + T, ux - uw / 2 + T / 2, uz + ud / 2 - T, y0, UH, color);
      this.wall(ux + uw / 2 - T / 2, uz - ud / 2 + T, ux + uw / 2 - T / 2, uz + ud / 2 - T, y0, UH, color, [[(ud - 2 * T) / 2, 1.3, 1.0, 2.0]]);
      this.box(ux, y0 + UH, uz, uw + 0.4, 0.3, ud + 0.4, roofColor);
      this.dec(Shape.Box, ux, y0 + UH - 0.15, uz, uw + 0.24, 0.3, ud + 0.24, o.canopy ?? COL.copper);
      this.socket(ux, y0, uz, false);
      if (this.rand() < 0.5) this.chest(ux - uw / 2 + 1.0, y0, uz - ud / 2 + 1.0, Math.PI / 4);
    }
    if (o.canopy !== undefined && doors.includes("f")) {
      const dx = -w / 2 + w * (w > 9 ? 0.3 : 0.5);
      this.dec(Shape.Box, dx, FLOOR + 2.75, d / 2 + 1.1, doorW + 1.6, 0.09, 2.3, o.canopy, 0.22);
    }
    // interior
    const nLoot = o.loot ?? 2;
    const spots: [number, number][] = [[-w / 4, -d / 4], [w / 4, d / 5], [w / 4, -d / 4], [-w / 4, d / 5], [0, 0]];
    for (let i = 0; i < nLoot && i < spots.length; i++) this.socket(spots[i]![0], FLOOR, spots[i]![1], i === 0);
    if (o.chest) this.chest(-w / 2 + 1.1, FLOOR, -d / 2 + 1.1, Math.PI / 4);
    if (o.locker) this.chest(w / 2 - 0.9, FLOOR, -d / 2 + 1.6, -Math.PI / 2, "locker");
    const nCr = o.crates ?? 1;
    for (let i = 0; i < nCr; i++) {
      const cx = (this.rand() - 0.5) * (w - 3),
        cz = (this.rand() - 0.5) * (d - 3.4);
      // keep door lanes clear
      if (Math.abs(cz) > d / 2 - 2.2 || Math.abs(cx) > w / 2 - 2.0) continue;
      this.box(cx, FLOOR, cz, 1.6 + this.rand() * 0.8, 1.05, 0.8, COL.wood, Surf.Wood, BoxFlag.Solid, this.rand() < 0.5 ? 0 : Math.PI / 2);
    }
    return { roofY: roofY + 0.3 };
  }

  /** Free-standing straight wall between two local points, any direction. */
  wallFree(x0: number, z0: number, x1: number, z1: number, y0: number, h: number, thick: number, color: number): void {
    const dx = x1 - x0,
      dz = z1 - z0;
    const L = Math.hypot(dx, dz);
    const yaw = Math.atan2(dx, dz);
    this.box((x0 + x1) / 2, y0, (z0 + z1) / 2, thick, h, L, color, Surf.Stone, BoxFlag.Solid, yaw);
  }

  tree(x: number, z: number, s: number, kind: number, tint: number): void {
    const y = this.hf.height(x, z);
    this.trees.push({ x, y, z, s, kind, tint });
    const hx = 0.28 * s;
    this.boxes.push(makeBox(x, y + 2.2 * s, z, hx, 2.4 * s, hx, 0, COL.woodDark, Surf.Wood, BoxFlag.Solid | BoxFlag.NoRender));
  }

  rock(x: number, z: number, sx: number, sy: number, sz: number, yaw: number, tint = 0, sink = 0.3): void {
    const y = this.hf.height(x, z) - sy * sink;
    this.rocks.push({ x, y: y + sy / 2, z, sx, sy, sz, yaw, tint });
    this.boxes.push(makeBox(x, y + sy / 2, z, sx * 0.44, sy * 0.5, sz * 0.44, yaw, COL.rock, Surf.Stone, BoxFlag.Solid | BoxFlag.NoRender));
  }
}
