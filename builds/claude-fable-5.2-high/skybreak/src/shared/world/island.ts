// The Highwake: authored island source. Produces lightweight collision + gameplay metadata (used by the
// authoritative sim) and render descriptors (used only by the client). Deterministic: same island every match.
import { Rng, clamp, fbm2, pointInPolygon, smoothstep } from "../math";
import { BoxFlag, Heightfield, Surf, World, WORLD_HALF, makeBox } from "./collision";
import { COL, FABRICS, FLOOR, Kit, Shape, type Ascender, type ChestSocket, type Decor, type Hazard, type LootSocket, type RockInst, type Spinner, type TreeInst, type Vent, type Zipline } from "./kit";
import { NavGrid } from "./nav";

export const MAP_VERSION = "highwake-1";
const SEED = 0x51b3a4;

export interface LocationDef {
  idx: number;
  name: string;
  x: number;
  z: number;
  r: number;
  tier: number;
  named: boolean;
}

export const LOCATIONS: LocationDef[] = [
  { idx: 0, name: "Aerie Market", x: -130, z: 190, r: 95, tier: 3, named: true },
  { idx: 1, name: "Sunken Array", x: 240, z: 260, r: 90, tier: 2, named: true },
  { idx: 2, name: "Kilnworks", x: 270, z: -130, r: 85, tier: 3, named: true },
  { idx: 3, name: "Orchard Steps", x: -270, z: -110, r: 100, tier: 1, named: true },
  { idx: 4, name: "Wind Abbey", x: 20, z: -20, r: 60, tier: 2, named: true },
  { idx: 5, name: "Breaker Docks", x: -80, z: -468, r: 90, tier: 2, named: true },
  { idx: 6, name: "Gantry Huts", x: 385, z: 60, r: 32, tier: 2, named: false },
  { idx: 7, name: "Span Station", x: 158, z: -55, r: 38, tier: 2, named: false },
  { idx: 8, name: "Chalk Quarry", x: -30, z: 395, r: 45, tier: 2, named: false },
  { idx: 9, name: "Drifters' Camp", x: -400, z: 110, r: 30, tier: 1, named: false },
  { idx: 10, name: "Old Turbine", x: 110, z: -335, r: 30, tier: 2, named: false },
  { idx: 11, name: "Echo Hollow", x: -180, z: -300, r: 28, tier: 2, named: false },
  { idx: 12, name: "Relay Shack", x: 60, z: 330, r: 28, tier: 2, named: false },
  { idx: 13, name: "The Keelwreck", x: 400, z: -250, r: 30, tier: 3, named: false },
];

const GULLY: readonly [number, number][] = [
  [175, 215], [150, 110], [165, 0], [150, -110], [175, -230], [210, -360], [262, -540],
];

/** Authored polygons where late Calmfield centres are allowed (land, cover, reachable). */
export const VALID_ZONES: readonly (readonly [number, number][])[] = [
  [[-230, 110], [-40, 110], [-30, 280], [-220, 290]], // Aerie Market and its slopes
  [[-370, -200], [-170, -200], [-170, -20], [-370, -20]], // Orchard Steps
  [[-70, -110], [110, -110], [110, 60], [-70, 60]], // Wind Abbey hill
  [[190, -210], [350, -210], [350, -50], [190, -50]], // Kilnworks
  [[-170, -430], [10, -430], [10, -330], [-170, -330]], // Docks hinterland
  [[-60, 280], [130, 280], [130, 400], [-60, 400]], // Quarry / Relay meadow
  [[60, -330], [190, -330], [190, -150], [60, -150]], // Turbine / Span Station
  [[300, 0], [420, 0], [420, 130], [300, 130]], // Gantry Huts
];

export interface PierInfo {
  x: number;
  y: number;
  z: number;
  spawns: [number, number][];
  weaponSpots: [number, number, number][];
  itemSpots: [number, number, number][];
  dummies: { x: number; y: number; z: number; yaw: number; mover: boolean }[];
}

export interface IslandData {
  version: string;
  hf: Heightfield;
  world: World;
  nav: NavGrid;
  decor: Decor[];
  sockets: LootSocket[];
  chests: ChestSocket[];
  ziplines: Zipline[];
  ascenders: Ascender[];
  vents: Vent[];
  hazards: Hazard[];
  trees: TreeInst[];
  rocks: RockInst[];
  spinners: Spinner[];
  locations: LocationDef[];
  buildingSpots: { x: number; z: number; loc: number }[];
  finalCenters: [number, number][];
  pier: PierInfo;
  /** Stable hash of collision metadata; a real client/server pair would compare this. */
  collisionHash: number;
}

function distToPolyline(x: number, z: number, pts: readonly [number, number][]): number {
  let best = 1e9;
  for (let i = 0; i < pts.length - 1; i++) {
    const ax = pts[i]![0], az = pts[i]![1], bx = pts[i + 1]![0], bz = pts[i + 1]![1];
    const dx = bx - ax, dz = bz - az;
    const t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz), 0, 1);
    const d = Math.hypot(x - (ax + dx * t), z - (az + dz * t));
    if (d < best) best = d;
  }
  return best;
}

function baseHeight(x: number, z: number): number {
  const r = Math.hypot(x, z);
  const ang = Math.atan2(z, x);
  const coast = 505 + (fbm2(Math.cos(ang) * 1.6 + 7.3, Math.sin(ang) * 1.6 + 3.1, 4, SEED) - 0.5) * 150 + 26 * Math.sin(ang * 3 + 1.1);
  const d = coast - r;
  if (d < 0) return -14 * smoothstep(0, 70, -d);
  const n1 = fbm2(x / 300 + 11, z / 300 + 5, 4, SEED + 1);
  const n2 = fbm2(x / 70 + 3, z / 70 + 9, 3, SEED + 2);
  const rdg = 1 - Math.abs(2 * fbm2(x / 220 + 40, z / 220 + 17, 3, SEED + 3) - 1);
  const inland = 5 + n1 * 30 + (n2 - 0.5) * 9 + Math.pow(rdg, 3) * 20;
  return smoothstep(0, 150, d) * inland + Math.min(d, 14) / 14 * 1.4;
}

function buildHeightfield(): Heightfield {
  const hf = new Heightfield(WORLD_HALF, 4);
  const n = hf.n;
  const L = LOCATIONS;
  const flat = (h: number, x: number, z: number, c: { x: number; z: number }, inner: number, outer: number, target: number): number => {
    const d = Math.hypot(x - c.x, z - c.z);
    if (d >= outer) return h;
    const wgt = smoothstep(outer, inner, d);
    return h + (target - h) * wgt;
  };
  // Pass 1: base + hill + gully so stamp targets can read natural heights.
  const natural = (x: number, z: number): number => {
    let h = baseHeight(x, z);
    const dab = Math.hypot(x - L[4]!.x, z - L[4]!.z);
    h += 30 * Math.exp(-(dab * dab) / (115 * 115)) * smoothstep(-2, 6, h);
    const dg = distToPolyline(x, z, GULLY);
    if (dg < 26) {
      const carve = 9 * smoothstep(26, 6, dg);
      h = Math.min(h, Math.max(h - carve, -0.8));
    }
    return h;
  };
  const targets = L.map((l) => natural(l.x, l.z));
  targets[0] = Math.max(22, targets[0]!); // market plateau
  targets[1] = -0.7; // flooded basin
  targets[2] = Math.max(9, Math.min(16, targets[2]!));
  targets[5] = 2.4;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const x = -hf.half + i * hf.cell,
        z = -hf.half + j * hf.cell;
      let h = natural(x, z);
      // Orchard terraces
      {
        const d = Math.hypot(x - L[3]!.x, z - L[3]!.z);
        if (d < 125) {
          const q = Math.round(h / 3.2) * 3.2;
          h += (q - h) * smoothstep(125, 90, d) * 0.92;
          h = Math.max(h, 3 * smoothstep(125, 100, d));
        }
      }
      h = flat(h, x, z, L[0]!, 78, 118, targets[0]!);
      h = flat(h, x, z, L[1]!, 66, 112, targets[1]!);
      h = flat(h, x, z, { x: L[1]!.x - 26, z: L[1]!.z + 24 }, 10, 20, -2.6);
      h = flat(h, x, z, L[2]!, 72, 108, targets[2]!);
      h = flat(h, x, z, L[4]!, 34, 60, targets[4]!);
      h = flat(h, x, z, L[5]!, 78, 112, targets[5]!);
      for (let k = 6; k < L.length; k++) {
        if (k === 7 || k === 8) continue;
        h = flat(h, x, z, L[k]!, L[k]!.r * 0.6, L[k]!.r * 1.3, Math.max(2.2, targets[k]!));
      }
      // Quarry pit with terraces
      {
        const d = Math.hypot(x - L[8]!.x, z - L[8]!.z);
        if (d < 60) {
          const pit = Math.max(3, targets[8]! - 9);
          const stepped = pit + Math.round((smoothstep(16, 52, d) * 9) / 3) * 3;
          h += (Math.min(h, stepped) - h) * smoothstep(60, 48, d);
        }
      }
      hf.data[j * n + i] = h;
    }
  }
  hf.computeMax();
  return hf;
}

function rot(cx: number, cz: number, yaw: number, lx: number, lz: number): [number, number] {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  return [cx + lx * c + lz * s, cz - lx * s + lz * c];
}

/** Shortens a downhill zipline until the rider clears the terrain everywhere. */
function safeZip(k: Kit, ax: number, ay: number, az: number, dirX: number, dirZ: number, maxLen: number): void {
  const hf = k.hf;
  for (let len = maxLen; len >= 30; len -= 8) {
    const bx = ax + dirX * len, bz = az + dirZ * len;
    const by = hf.height(bx, bz) + 3.3;
    if (by > ay - 2) continue;
    let ok = true;
    for (let i = 1; i < 24; i++) {
      const t = i / 24;
      if (ay + (by - ay) * t - 2.9 < hf.height(ax + (bx - ax) * t, az + (bz - az) * t) && t < 0.92) {
        ok = false;
        break;
      }
    }
    if (ok) {
      k.zipWorld(ax, ay, az, bx, by, bz);
      return;
    }
  }
}

function buildMarket(k: Kit, rng: Rng, L: LocationDef): void {
  k.loc = L.idx;
  k.tier = 3;
  const yaw = 0.32;
  const sp = 27;
  const roofs: { x: number; z: number; y: number; d: number }[] = [];
  for (let gx = -2; gx <= 2; gx++)
    for (let gz = -2; gz <= 1; gz++) {
      if (gx === 0 && (gz === -1 || gz === 0)) continue;
      const lx = gx * sp + rng.range(-2, 2),
        lz = (gz + 0.5) * sp + rng.range(-2, 2);
      const [x, z] = rot(L.x, L.z, yaw, lx, lz);
      const w = rng.range(9, 12.5),
        d = rng.range(8, 11.5);
      const rel = Math.abs(lx) > Math.abs(lz) ? (lx < 0 ? Math.PI / 2 : -Math.PI / 2) : lz < 0 ? 0 : Math.PI;
      const style = rng.next();
      const fabric = rng.pick(FABRICS);
      k.ground(x, z, yaw + rel, w, d);
      const stairs = style < 0.68;
      const res = k.house(w, d, {
        color: rng.pick([COL.lime, COL.limeWarm, COL.limeCool, COL.cream]),
        roof: style < 0.36 ? "flat" : "parapet",
        upper: style < 0.36,
        stairs,
        doors: "f" + (rng.chance(0.5) ? "b" : "l"),
        canopy: fabric,
        chest: rng.chance(0.6),
        locker: rng.chance(0.22),
        loot: rng.int(1, 2),
        crates: 2,
      });
      if (!stairs) {
        k.crate(-w / 2 - 0.9, 0, 1.3, 0, COL.wood);
        k.crate(-w / 2 - 0.95, 1.4, 1.3, 0, COL.woodDark);
        k.crate(-w / 2 - 0.85, 0.05, 1.2, 1.3, COL.woodDark, 0.2);
      }
      if (rng.chance(0.45)) k.socket(0, res.roofY, d / 4, false);
      roofs.push({ x, z, y: k.oy + res.roofY, d: Math.hypot(lx, lz) });
    }
  // Plaza
  k.ground(L.x, L.z, yaw);
  k.box(0, -2, 0, 2.0, 2 + 8.5, 2.0, COL.copper, Surf.Metal);
  k.dec(Shape.Cyl, 0, 0.4, 0, 6, 0.8, 6, COL.limeDark);
  k.box(0, -1, 0, 5.2, 1.75, 5.2, COL.limeDark, Surf.Stone, BoxFlag.Solid | BoxFlag.NoRender);
  k.dec(Shape.Cyl, 0, 8.9, 0, 3.6, 0.3, 3.6, COL.verdigris);
  k.dec(Shape.Cone, 0, 10.0, 0, 2.6, 2.0, 2.6, COL.copper);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.4;
    const lx = Math.sin(a) * 9.5,
      lz = Math.cos(a) * 15;
    const save = [k.ox, k.oy, k.oz] as const;
    const [sx, sz] = rot(L.x, L.z, yaw, lx, lz);
    k.ground(sx, sz, yaw + a + Math.PI);
    k.stall(0, 0, FABRICS[i % FABRICS.length]!);
    if (i % 2 === 0) k.socket(0, 0.05, 1.6, false);
    k.at(save[0], save[1], save[2], yaw);
  }
  {
    const [vx, vz] = rot(L.x, L.z, yaw, -6.5, -19);
    k.ground(vx, vz, yaw);
    k.vent(0, 0.1, 0);
  }
  // Aerie Spire: hollow tower with an ascender to the roof and ziplines out.
  {
    const [tx, tz] = rot(L.x, L.z, yaw, 7.5, 21);
    k.ground(tx, tz, yaw + Math.PI, 7, 7);
    k.cluster++;
    const H = 11;
    k.box(0, -3, 0, 7, 3 + FLOOR, 7, COL.limeDark);
    const c = COL.limeWarm;
    k.wall(-3.5, 3.3, 3.5, 3.3, FLOOR, H, c, [[3.5, 2.0, 0, 2.5]], 0.4);
    k.wall(-3.5, -3.3, 3.5, -3.3, FLOOR, H, c, [[3.5, 1.2, 4.5, 6.5]], 0.4);
    k.wall(-3.3, -3.1, -3.3, 3.1, FLOOR, H, c, [[3.1, 1.2, 4.5, 6.5]], 0.4);
    k.wall(3.3, -3.1, 3.3, 3.1, FLOOR, H, c, [[3.1, 1.2, 4.5, 6.5]], 0.4);
    const top = FLOOR + H;
    k.box(0, top, 0, 8.2, 0.3, 8.2, COL.limeDark);
    k.wall(-4.1, 4.0, 4.1, 4.0, top + 0.3, 0.8, c, [[4.1, 1.6, 0, 0.8]]);
    k.wall(-4.1, -4.0, 4.1, -4.0, top + 0.3, 0.8, c);
    k.wall(-4.0, -3.8, -4.0, 3.8, top + 0.3, 0.8, c);
    k.wall(4.0, -3.8, 4.0, 3.8, top + 0.3, 0.8, c);
    k.dec(Shape.Box, 0, top - 0.2, 0, 8.5, 0.4, 8.5, COL.copper);
    k.dec(Shape.Box, 0, 6, 0, 7.2, 0.3, 7.2, COL.copper);
    k.ascender(0, -1.2, FLOOR, top + 0.3, 0);
    k.socket(-1.8, FLOOR, 1.2, true);
    k.chest(2.2, top + 0.3, -2.4, -Math.PI / 4);
    k.socket(-2, top + 0.3, 2, false);
    const zy = k.oy + top + 0.3 + 3.0;
    const far = [...roofs].sort((a, b) => b.d - a.d);
    const pickA = far.find((r) => r.z < L.z - 20) ?? far[0]!;
    const pickB = far.find((r) => r.x < L.x - 30 && r !== pickA) ?? far[1]!;
    k.zipWorld(k.wx(-2.5, -2.5), zy, k.wz(-2.5, -2.5), pickA.x, pickA.y + 3.0, pickA.z);
    k.zipWorld(k.wx(2.5, 2.5), zy, k.wz(2.5, 2.5), pickB.x, pickB.y + 3.0, pickB.z);
  }
  // Downhill line toward the abbey
  {
    const south = [...roofs].sort((a, b) => a.z - b.z)[0]!;
    const dx = LOCATIONS[4]!.x - south.x,
      dz = LOCATIONS[4]!.z - south.z;
    const l = Math.hypot(dx, dz);
    safeZip(k, south.x + 1.5, south.y + 3.0, south.z - 1.5, dx / l, dz / l, 110);
  }
}

function buildArray(k: Kit, rng: Rng, L: LocationDef): void {
  k.loc = L.idx;
  k.tier = 2;
  const yaw = 0.5;
  const padTop = 0.5;
  const pad = (lx: number, lz: number, size: number, dish: boolean, idx: number): void => {
    const [x, z] = rot(L.x, L.z, yaw, lx, lz);
    const a = Math.atan2(-lx, -lz);
    k.at(x, 0, z, lx === 0 && lz === 0 ? yaw : yaw + a);
    k.cluster++;
    k.box(0, -3, 0, size, 3 + padTop, size, COL.concrete);
    for (const sgn of [1, -1]) {
      k.box(0, -3, sgn * (size / 2 + 0.5), 4, 3.2, 1.0, COL.concreteDark);
      k.box(0, -3, sgn * (size / 2 + 1.5), 4, 2.9, 1.0, COL.concreteDark);
      k.box(0, -3, sgn * (size / 2 + 2.5), 4, 2.6, 1.0, COL.concreteDark);
    }
    if (dish) {
      k.box(0, padTop, 0, 2.4, 5.2, 2.4, COL.concreteDark);
      k.dec(Shape.Cyl, 0, padTop + 5.5, 0, 3.2, 0.8, 3.2, COL.copper);
      const tilt = 0.45 + (idx % 3) * 0.12;
      k.dec(Shape.Cone, 0, padTop + 7.6, 0.6, 12.5, 3.2, 12.5, COL.cream, tilt, idx * 1.3, Math.PI);
      k.dec(Shape.Cyl, 0, padTop + 8.2, 0.9, 13, 0.25, 13, COL.copper, tilt, idx * 1.3, 0);
      k.dec(Shape.Cyl, 0, padTop + 9.8, 1.6, 0.25, 4.6, 0.25, COL.metalDark, tilt, idx * 1.3, 0);
      k.dec(Shape.Sphere, 0, padTop + 12.0, 2.6, 0.9, 0.9, 0.9, COL.verdigris, 0, 0, 0, 0.7);
      k.socket(3.5, padTop, 3.5, true);
      k.socket(-3.5, padTop, -3.2, false);
      if (idx % 2 === 0) k.chest(-3.8, padTop, 3.6, Math.PI * 0.75);
      else k.chest(3.9, padTop, -3.9, -Math.PI / 4, "locker");
      k.crate(4, -3.5, 1.1, padTop, COL.metal);
    }
  };
  const R = 46;
  pad(0, 0, 17, false, 0);
  let idx = 1;
  for (const ang of [0.25, 0.75, 1.25, 1.75]) {
    const a = ang * Math.PI;
    pad(Math.sin(a) * R, Math.cos(a) * R, 12, true, idx++);
    // service tunnel from the hub toward this pad
    const [hx, hz] = rot(L.x, L.z, yaw, 0, 0);
    k.at(hx, 0, hz, yaw + a);
    k.cluster++;
    for (const sx of [-2.1, 2.1]) {
      k.box(sx, -2.5, 16, 0.45, 2.5 + 3.0, 8, COL.concrete);
      k.box(sx, -2.5, 30, 0.45, 2.5 + 3.0, 12, COL.concrete);
    }
    k.box(0, 3.0, 23, 5.0, 0.4, 26, COL.concreteDark);
    k.dec(Shape.Box, 0, 3.5, 23, 1.2, 0.5, 26, COL.copper);
    k.socket(0, 0.1, 16, false);
    k.socket(0.8, 0.1, 31, true);
  }
  // Control block on the hub pad
  {
    const [x, z] = rot(L.x, L.z, yaw, 0, 0);
    k.at(x, padTop - FLOOR + 0.02, z, yaw + Math.PI / 4);
    k.house(9.5, 8, { color: COL.concrete, roofColor: COL.concreteDark, doors: "fb", chest: true, locker: true, loot: 3, canopy: COL.teal, roof: "parapet", stairs: true });
    k.dec(Shape.Cyl, 3, 8, -2, 0.3, 8, 0.3, COL.metalDark);
    k.dec(Shape.Sphere, 3, 12.2, -2, 0.8, 0.8, 0.8, COL.coral, 0, 0, 0, 0.8);
  }
  for (let i = 0; i < 7; i++) {
    const a = rng.range(0, Math.PI * 2),
      r = rng.range(55, 80);
    k.rock(L.x + Math.sin(a) * r, L.z + Math.cos(a) * r, rng.range(2.5, 5), rng.range(2.2, 3.6), rng.range(2.5, 5), rng.range(0, 3), 1, 0.2);
  }
}

function hall(k: Kit, w: number, d: number, H: number, side: "l" | "r", rng: Rng): number {
  k.cluster++;
  k.buildingSpots.push({ x: k.ox, z: k.oz, loc: k.loc });
  const c = COL.rust;
  k.box(0, -3, 0, w, 3 + FLOOR, d, COL.concreteDark);
  const fz = d / 2 - 0.2;
  k.wall(-w / 2, fz, w / 2, fz, FLOOR, H, c, [[w / 2, 4.4, 0, 3.8]], 0.4, Surf.Metal);
  k.wall(-w / 2, -fz, w / 2, -fz, FLOOR, H, c, [[w / 2, 4.4, 0, 3.8]], 0.4, Surf.Metal);
  const sideLen = d - 0.8;
  const doorSide: [number, number, number, number][] = [[sideLen * 0.5, 2.4, 0, 2.5], [sideLen * 0.2, 2.2, 4.4, 6], [sideLen * 0.8, 2.2, 4.4, 6]];
  const winSide: [number, number, number, number][] = [[sideLen * 0.25, 2.4, 4.6, 6.2], [sideLen * 0.75, 2.4, 4.6, 6.2]];
  k.wall(-w / 2 + 0.2, -d / 2 + 0.4, -w / 2 + 0.2, d / 2 - 0.4, FLOOR, H, c, side === "l" ? doorSide : winSide, 0.4, Surf.Metal);
  k.wall(w / 2 - 0.2, -d / 2 + 0.4, w / 2 - 0.2, d / 2 - 0.4, FLOOR, H, c, side === "r" ? doorSide : winSide, 0.4, Surf.Metal);
  const roofY = FLOOR + H;
  k.box(0, roofY, 0, w + 0.6, 0.3, d + 0.6, COL.metalDark, Surf.Metal);
  k.dec(Shape.Prism, 0, roofY + 0.3 + 0.6, 0, w * 0.4, 1.2, d * 0.8, COL.metal);
  k.dec(Shape.Box, 0, FLOOR + 0.5, d / 2 + 0.02, w + 0.1, 1.0, 0.1, COL.saffron);
  // catwalk on the wall opposite the side door
  const cx = side === "l" ? w / 2 - 1.9 : -w / 2 + 1.9;
  const rise = 3.5;
  const run = k.stairs(cx, d / 2 - 2.2, 0, -1, rise, 2.2, COL.metal, FLOOR, Surf.Metal);
  const cwStart = d / 2 - 2.2 - run;
  const cwEnd = -d / 2 + 0.6;
  k.box(cx, FLOOR + rise - 0.3, (cwStart + cwEnd) / 2, 3.0, 0.3, cwStart - cwEnd, COL.metal, Surf.Metal);
  const railX = cx + (side === "l" ? -1.5 : 1.5);
  k.box(railX, FLOOR + rise, (cwStart + cwEnd) / 2, 0.12, 0.95, cwStart - cwEnd, COL.saffron, Surf.Metal);
  k.chest(cx, FLOOR + rise, cwEnd + 1.2, 0);
  k.socket(cx, FLOOR + rise, (cwStart + cwEnd) / 2, false);
  // furnace
  const fx = side === "l" ? -1.5 : 1.5;
  k.box(fx, FLOOR, -2, 4.2, 4.2, 4.2, COL.metalDark, Surf.Metal, BoxFlag.Solid | BoxFlag.NoRender);
  k.dec(Shape.Cyl, fx, FLOOR + 2.1, -2, 4.8, 4.2, 4.8, COL.metalDark);
  k.dec(Shape.Cyl, fx, FLOOR + 4.4, -2, 3.2, 0.5, 3.2, COL.heat, 0, 0, 0, 1.4);
  k.dec(Shape.Cyl, fx, FLOOR + 6.2, -2, 1.4, 3.4, 1.4, COL.copperDark);
  k.socket(fx, FLOOR, 4, true);
  k.socket(-fx * 2, FLOOR, -d / 2 + 4, false);
  k.socket(fx, FLOOR, d / 2 - 5, false);
  for (let i = 0; i < 4; i++) k.crate(fx + rng.range(-3, 3), rng.range(6, d / 2 - 4) * (i % 2 ? 1 : -1) - (i % 2 ? 0 : 3), rng.range(1.0, 1.4), FLOOR, i % 2 ? COL.wood : COL.metal, rng.range(0, 1));
  return roofY + 0.3;
}

function buildKilnworks(k: Kit, rng: Rng, L: LocationDef): void {
  k.loc = L.idx;
  k.tier = 3;
  const yaw = -0.2;
  const P = (lx: number, lz: number): [number, number] => rot(L.x, L.z, yaw, lx, lz);
  let [x, z] = P(-24, 8);
  k.ground(x, z, yaw, 16, 30);
  const roofA = hall(k, 16, 30, 7, "r", rng);
  const ya = k.oy + roofA;
  k.ascender(-8.9, 9, 0, roofA, Math.PI / 2);
  const ax = k.wx(-5, 0), az = k.wz(-5, 0);
  [x, z] = P(24, 8);
  k.ground(x, z, yaw, 16, 30);
  const roofB = hall(k, 16, 30, 7, "l", rng);
  const yb = k.oy + roofB;
  k.ascender(8.9, -9, 0, roofB, -Math.PI / 2);
  k.zipWorld(ax, ya + 3.0, az, k.wx(5, 0), yb + 3.0, k.wz(5, 0));
  // Heat channels between the halls
  k.ground(L.x, L.z, yaw);
  for (const hx of [-5.5, 5.5]) {
    const [cx, cz] = P(hx, 6);
    const gy = k.hf.height(cx, cz);
    k.hazards.push({ x: cx, y: gy, z: cz, hx: 1.4, hz: 21, yaw });
    k.at(cx, gy, cz, yaw);
    k.dec(Shape.Box, 0, 0.07, 0, 2.8, 0.1, 42, COL.heat, 0, 0, 0, 1.6);
    k.dec(Shape.Box, -1.6, 0.12, 0, 0.4, 0.24, 42.4, COL.metalDark);
    k.dec(Shape.Box, 1.6, 0.12, 0, 0.4, 0.24, 42.4, COL.metalDark);
  }
  // footbridges over the channels
  for (const bz of [-6, 16]) {
    const [cx, cz] = P(0, bz);
    k.ground(cx, cz, yaw);
    k.box(-5.5, 0.0, 0, 4.2, 0.4, 2.6, COL.metal, Surf.Metal);
    k.box(5.5, 0.0, 0, 4.2, 0.4, 2.6, COL.metal, Surf.Metal);
  }
  // Central vault
  [x, z] = P(0, -34);
  k.ground(x, z, yaw, 10, 10);
  k.cluster++;
  k.buildingSpots.push({ x, z, loc: k.loc });
  k.box(0, -3, 0, 10, 3 + FLOOR, 10, COL.concreteDark);
  const vc = COL.slate;
  k.wall(-5, 4.55, 5, 4.55, FLOOR, 3.6, vc, [[5, 2.0, 0, 2.5]], 0.9, Surf.Metal);
  k.wall(-5, -4.55, 5, -4.55, FLOOR, 3.6, vc, [], 0.9, Surf.Metal);
  k.wall(-4.55, -4.1, -4.55, 4.1, FLOOR, 3.6, vc, [], 0.9, Surf.Metal);
  k.wall(4.55, -4.1, 4.55, 4.1, FLOOR, 3.6, vc, [], 0.9, Surf.Metal);
  k.box(0, FLOOR + 3.6, 0, 10.6, 0.5, 10.6, COL.metalDark, Surf.Metal);
  k.dec(Shape.Box, 0, FLOOR + 1.8, 0, 10.1, 0.4, 10.1, COL.copper);
  k.dec(Shape.Cyl, 0, FLOOR + 4.6, 0, 3, 1.0, 3, COL.copper);
  k.chest(-2.2, FLOOR, -2.6, 0, "vault", 4);
  k.chest(2.2, FLOOR, -2.6, 0, "vault", 4);
  k.socket(0, FLOOR, 1.5, true);
  // Chimneys, tanks, vent
  for (const [lx, lz] of [[-40, -16], [40, -14], [0, 40]] as const) {
    const [cx, cz] = P(lx, lz);
    k.ground(cx, cz, yaw);
    k.box(0, -2, 0, 3.0, 2 + 24, 3.0, COL.rust, Surf.Metal, BoxFlag.Solid | BoxFlag.NoRender);
    k.dec(Shape.Cyl, 0, 12, 0, 3.6, 24, 3.6, COL.rust);
    k.dec(Shape.Cyl, 0, 24.2, 0, 4.0, 0.7, 4.0, COL.metalDark);
    k.dec(Shape.Cyl, 0, 20, 0, 3.75, 1.2, 3.75, COL.cream);
    k.socket(2.6, 0.05, 0.5, false);
  }
  for (const [lx, lz] of [[36, -36], [-36, -38], [-44, 30]] as const) {
    const [cx, cz] = P(lx, lz);
    k.ground(cx, cz, yaw);
    k.box(0, -2, 0, 5.4, 2 + 6.5, 5.4, COL.verdigris, Surf.Metal, BoxFlag.Solid | BoxFlag.NoRender);
    k.dec(Shape.Cyl, 0, 3.25, 0, 6.4, 6.5, 6.4, COL.verdigris);
    k.dec(Shape.Cyl, 0, 6.6, 0, 5.4, 0.5, 5.4, COL.copper);
  }
  [x, z] = P(-13, -22);
  k.ground(x, z, yaw);
  k.vent(0, 0.1, 0);
  // Office + yard clutter
  [x, z] = P(42, 34);
  k.ground(x, z, yaw + Math.PI, 9, 8);
  k.house(9, 8, { color: COL.concrete, roofColor: COL.rust, doors: "fl", chest: true, locker: true, loot: 2, roof: "parapet", stairs: true, canopy: COL.saffron });
  for (let i = 0; i < 12; i++) {
    const [cx, cz] = P(rng.range(-50, 50), rng.range(-45, 45));
    if (k.hf.height(cx, cz) < 1) continue;
    const save = k.boxes.length;
    k.ground(cx, cz, yaw + rng.range(0, 1));
    k.crate(0, 0, rng.range(1.1, 1.6), 0, rng.chance(0.5) ? COL.metal : COL.wood);
    // drop crates that landed inside a structure
    const b = k.boxes[save]!;
    for (let j = 0; j < save; j++) {
      const o = k.boxes[j]!;
      if (Math.abs(o.x - b.x) < o.hx + 1.5 && Math.abs(o.z - b.z) < o.hz + 1.5 && Math.abs(o.y - b.y) < o.hy + 2) {
        k.boxes.length = save;
        break;
      }
    }
  }
}

function buildOrchard(k: Kit, rng: Rng, L: LocationDef): void {
  k.loc = L.idx;
  k.tier = 1;
  const hf = k.hf;
  const spots: [number, number][] = [[-30, 20], [34, -22], [10, 46], [-42, -40], [48, 30], [-6, -8]];
  const n = { x: 0, y: 0, z: 0 };
  spots.forEach(([lx, lz], i) => {
    const x = L.x + lx, z = L.z + lz;
    hf.normal(x, z, n);
    const yaw = Math.atan2(n.x, n.z) + (i % 2 ? 0 : Math.PI / 2);
    if (i < 4) {
      k.ground(x, z, yaw, 9, 7);
      k.house(9, 7, { color: COL.cream, roof: "gable", roofColor: i % 2 ? COL.roof : COL.roofDark, doors: "fb", chest: i % 2 === 0, locker: i === 1, loot: 2, canopy: FABRICS[i]! });
      k.crate(-5.6, 2, 1.1, 0);
    } else if (i === 4) {
      k.ground(x, z, yaw, 6, 5);
      k.house(6, 5, { color: COL.wood, roofColor: COL.woodDark, doors: "f", windows: false, loot: 2, crates: 0 });
    } else {
      // windmill
      k.ground(x, z, yaw, 5, 5);
      k.cluster++;
      k.box(0, -2, 0, 4.4, 2 + 11, 4.4, COL.cream, Surf.Stone, BoxFlag.Solid | BoxFlag.NoRender);
      k.dec(Shape.Cyl, 0, 5.5, 0, 5.2, 11, 5.2, COL.cream);
      k.dec(Shape.Cone, 0, 12.2, 0, 6, 2.6, 6, COL.roof);
      k.spinners.push({ x: k.wx(0, 3.0), y: k.oy + 9.5, z: k.wz(0, 3.0), yaw, r: 7.5, color: COL.saffron });
      k.socket(3.4, 0.05, 1, true);
      k.chest(-3.3, 0, 1.5, 1.2);
    }
  });
  // Dry-stone walls along the terrace contours
  for (let gx = -4; gx <= 4; gx++)
    for (let gz = -4; gz <= 4; gz++) {
      const x = L.x + gx * 23 + rng.range(-6, 6),
        z = L.z + gz * 23 + rng.range(-6, 6);
      if (Math.hypot(x - L.x, z - L.z) > 105) continue;
      const ny = hf.normal(x, z, n);
      if (ny > 0.985 || ny < 0.8) continue;
      if (spots.some(([lx, lz]) => Math.hypot(L.x + lx - x, L.z + lz - z) < 11)) continue;
      const yaw = Math.atan2(n.x, n.z) + Math.PI / 2;
      const len = rng.range(8, 15);
      k.ground(x, z, yaw);
      k.box(0, -1.2, 0, 0.7, 1.2 + 1.15, len, COL.limeDark);
    }
  // Orchard rows on the flats
  for (let gx = -10; gx <= 10; gx++)
    for (let gz = -10; gz <= 10; gz++) {
      const x = L.x + gx * 9.5 + rng.range(-1, 1),
        z = L.z + gz * 9.5 + rng.range(-1, 1);
      if (Math.hypot(x - L.x, z - L.z) > 108) continue;
      if (hf.normal(x, z, n) < 0.975) continue;
      if (spots.some(([lx, lz]) => Math.hypot(L.x + lx - x, L.z + lz - z) < 10)) continue;
      if (rng.chance(0.25)) continue;
      k.tree(x, z, rng.range(0.62, 0.8), 2, rng.int(0, 2));
    }
  k.ground(L.x + 12, L.z + 12, 0);
  k.socket(0, 0.05, 0, false);
  k.ground(L.x - 60, L.z + 30, 0);
  k.socket(0, 0.05, 0, false);
  k.crate(1.5, 0.5, 1.1, 0);
}

function buildAbbey(k: Kit, rng: Rng, L: LocationDef): void {
  k.loc = L.idx;
  k.tier = 2;
  const yaw = 0.15;
  const P = (lx: number, lz: number): [number, number] => rot(L.x, L.z, yaw, lx, lz);
  k.ground(L.x, L.z, yaw);
  k.cluster++;
  const stone = COL.lime;
  // Nave floor and broken walls
  k.box(0, -3, 0, 15, 3 + 0.15, 32, COL.limeDark);
  for (const sx of [-7.2, 7.2]) {
    for (let i = 0; i < 9; i++) {
      const lz = -14 + i * 3.5;
      if (i === 4 && sx < 0) continue; // side breach
      const h = i === 0 || i === 8 ? 6.5 : rng.range(1.3, 6.2);
      k.box(sx, 0.15, lz, 0.8, h, 3.2, stone);
      if (h > 4.4) k.dec(Shape.Box, sx, 0.15 + h + 0.15, lz, 1.0, 0.3, 3.4, COL.limeDark);
    }
  }
  k.wall(-7.2, -15.7, 7.2, -15.7, 0.15, 7.5, stone, [[7.2, 2.6, 0, 3.4], [7.2, 2.2, 4.6, 6.6]], 0.8);
  k.wall(-7.2, 15.7, 7.2, 15.7, 0.15, 5.0, stone, [[7.2, 3.6, 0, 5.0]], 0.8);
  for (const sx of [-3.6, 3.6])
    for (let i = 0; i < 5; i++) {
      const lz = -10 + i * 5;
      const h = rng.chance(0.3) ? rng.range(1.2, 2.6) : 5.2;
      k.box(sx, 0.15, lz, 0.95, h, 0.95, COL.cream);
      if (h > 5 && i < 4 && rng.chance(0.6)) k.dec(Shape.Box, sx, 5.55, lz + 2.5, 0.8, 0.5, 5.0, COL.limeDark);
    }
  // Altar dais
  k.box(0, 0.15, -12.2, 6, 0.4, 4, COL.cream);
  k.chest(0, 0.55, -12.6, 0);
  k.socket(-4.5, 0.15, 5, true);
  k.socket(4.6, 0.15, -4, false);
  k.socket(0, 0.15, 10, false);
  // Bell tower with ascender and zipline
  {
    const [tx, tz] = P(14, -8);
    k.ground(tx, tz, yaw, 6.4, 6.4);
    k.cluster++;
    const H = 15;
    k.box(0, -3, 0, 6.4, 3 + FLOOR, 6.4, COL.limeDark);
    k.wall(-3.2, 2.95, 3.2, 2.95, FLOOR, H, stone, [[3.2, 1.9, 0, 2.5]], 0.5);
    k.wall(-3.2, -2.95, 3.2, -2.95, FLOOR, H, stone, [[3.2, 1.0, 6, 9]], 0.5);
    k.wall(-2.95, -2.7, -2.95, 2.7, FLOOR, H, stone, [[2.7, 1.0, 6, 9]], 0.5);
    k.wall(2.95, -2.7, 2.95, 2.7, FLOOR, H, stone, [[2.7, 1.0, 6, 9]], 0.5);
    const top = FLOOR + H;
    k.box(0, top, 0, 7.2, 0.35, 7.2, COL.limeDark);
    for (const [px, pz] of [[-3.2, -3.2], [3.2, -3.2], [-3.2, 3.2], [3.2, 3.2]] as const) k.box(px, top + 0.35, pz, 0.7, 3.2, 0.7, COL.cream);
    k.wall(-2.85, 3.3, 2.85, 3.3, top + 0.35, 0.9, stone, [], 0.3);
    k.wall(-2.85, -3.3, 2.85, -3.3, top + 0.35, 0.9, stone, [], 0.3);
    k.wall(3.3, -2.85, 3.3, 2.85, top + 0.35, 0.9, stone, [], 0.3);
    k.dec(Shape.Box, 0, top + 3.75, 0, 7.6, 0.4, 7.6, COL.limeDark);
    k.dec(Shape.Cone, 0, top + 5.6, 0, 8.4, 3.4, 8.4, COL.verdigris);
    k.dec(Shape.Sphere, 0, top + 2.2, 0, 1.5, 1.7, 1.5, COL.copper);
    k.ascender(0, -1.0, FLOOR, top + 0.35, 0);
    k.chest(1.8, top + 0.35, -1.8, -0.8);
    const m = LOCATIONS[0]!;
    const dx = m.x - tx, dz = m.z - tz, l = Math.hypot(dx, dz);
    safeZip(k, k.wx(-2.4, 1.5), k.oy + top + 0.35 + 3.0, k.wz(-2.4, 1.5), dx / l, dz / l, 150);
    const d2 = LOCATIONS[2]!;
    const ex = d2.x - tx, ez = d2.z - tz, el = Math.hypot(ex, ez);
    safeZip(k, k.wx(2.4, -1.5), k.oy + top + 0.35 + 3.0, k.wz(2.4, -1.5), ex / el, ez / el, 120);
  }
  // Cloister remnants and courtyard vent
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const r = rng.range(24, 40);
    const [x, z] = P(Math.sin(a) * r, Math.cos(a) * r);
    k.ground(x, z, a + rng.range(-0.4, 0.4));
    if (i % 3 === 0) {
      // arch
      k.box(-2, -1, 0, 0.9, 1 + 4.2, 0.9, COL.cream);
      k.box(2, -1, 0, 0.9, 1 + 4.2, 0.9, COL.cream);
      k.box(0, 4.2, 0, 5.4, 0.7, 1.0, COL.limeDark);
    } else {
      k.box(0, -1.2, 0, rng.range(4, 8), 1.2 + rng.range(1.0, 2.4), 0.8, stone);
    }
    if (i % 4 === 1) k.socket(0, 0.05, 1.6, false);
  }
  {
    const [x, z] = P(-16, 6);
    k.ground(x, z, yaw);
    k.vent(0, 0.1, 0);
  }
  {
    const [x, z] = P(-17, -14);
    k.ground(x, z, yaw + 1.2, 6, 5);
    k.house(6, 5, { color: stone, doors: "f", loot: 2, locker: true, crates: 0, roof: "flat" });
  }
}

function buildDocks(k: Kit, rng: Rng, L: LocationDef): void {
  k.loc = L.idx;
  k.tier = 2;
  const colors = [COL.teal, COL.coral, COL.saffron, COL.indigo, COL.rust, COL.verdigris];
  const wh: [number, number, number][] = [[-42, 24, 0], [-8, 30, 0], [30, 22, 0], [48, -14, Math.PI / 2]];
  const roofs: [number, number, number][] = [];
  wh.forEach(([lx, lz, yaw], i) => {
    k.ground(L.x + lx, L.z + lz, yaw, 22, 14);
    k.cluster++;
    k.buildingSpots.push({ x: k.ox, z: k.oz, loc: k.loc });
    const H = 5.2;
    const c = i % 2 ? COL.limeCool : COL.cream;
    k.box(0, -3, 0, 22, 3 + FLOOR, 14, COL.concreteDark);
    k.wall(-11, 6.8, 11, 6.8, FLOOR, H, c, [[6, 4.2, 0, 3.4], [16, 1.6, 1.1, 2.3]], 0.4);
    k.wall(-11, -6.8, 11, -6.8, FLOOR, H, c, [[16, 4.2, 0, 3.4], [5, 1.6, 1.1, 2.3]], 0.4);
    k.wall(-10.8, -6.4, -10.8, 6.4, FLOOR, H, c, [[6.4, 1.9, 0, 2.4]], 0.4);
    k.wall(10.8, -6.4, 10.8, 6.4, FLOOR, H, c, [[6.4, 1.6, 1.1, 2.3]], 0.4);
    k.box(0, FLOOR + H, 0, 22.6, 0.3, 14.6, colors[i]!, Surf.Metal);
    k.dec(Shape.Prism, 0, FLOOR + H + 0.3 + 0.5, 0, 22.8, 1.0, 9, colors[i]!);
    k.box(0, FLOOR + H + 0.3, 0, 22.6, 0.45, 6, colors[i]!, Surf.Metal, BoxFlag.Solid | BoxFlag.NoRender);
    k.dec(Shape.Box, 0, FLOOR + H - 0.5, 0, 22.2, 0.5, 14.2, COL.metalDark);
    k.socket(-6, FLOOR, 2, true);
    k.socket(5, FLOOR, -2, false);
    k.socket(8, FLOOR, 3.5, false);
    if (i % 2 === 0) k.chest(-9.2, FLOOR, -4.8, Math.PI / 4);
    else k.chest(9.4, FLOOR, 0, -Math.PI / 2, "locker");
    for (let j = 0; j < 5; j++) {
      const cx = rng.range(-8, 8), cz = rng.range(-4, 4);
      if (Math.abs(cx - -5) < 3 || Math.abs(cx - 5) < 3) continue;
      k.crate(cx, cz, rng.range(1.1, 1.5), FLOOR, rng.chance(0.5) ? COL.wood : COL.woodDark, rng.range(0, 1));
    }
    roofs.push([k.ox, k.oy + FLOOR + H + 0.75, k.oz]);
  });
  // Container yard
  for (let i = 0; i < 14; i++) {
    const lx = -30 + (i % 5) * 9 + rng.range(-1, 1),
      lz = -14 - Math.floor(i / 5) * 9 + rng.range(-1, 1);
    const yaw = rng.chance(0.7) ? 0 : Math.PI / 2;
    k.ground(L.x + lx, L.z + lz, yaw + rng.range(-0.06, 0.06));
    const c = rng.pick(colors);
    k.box(0, -0.5, 0, 2.5, 0.5 + 2.6, 6.1, c, Surf.Metal);
    k.dec(Shape.Box, 0, 1.3, 3.06, 2.2, 2.3, 0.06, COL.metalDark);
    if (rng.chance(0.35)) k.box(0, 2.6, 0, 2.5, 2.6, 6.1, rng.pick(colors), Surf.Metal);
    if (i % 4 === 0) k.socket(2.2, 0.05, 0, i === 0);
    if (i === 7) k.chest(-2.2, 0, 1, Math.PI / 2);
  }
  // Cranes
  const cranes: [number, number][] = [[-18, -52], [22, -50]];
  cranes.forEach(([lx, lz], i) => {
    k.ground(L.x + lx, L.z + lz, 0);
    k.cluster++;
    const H = 15;
    for (const [px, pz] of [[-3, -2.2], [3, -2.2], [-3, 2.2], [3, 2.2]] as const) k.box(px, -2, pz, 0.8, 2 + H, 0.8, COL.saffron, Surf.Metal);
    k.box(0, H, 0, 7.4, 0.4, 5.4, COL.metalDark, Surf.Metal);
    k.box(0, H + 0.4, -9, 2.2, 0.5, 13, COL.saffron, Surf.Metal);
    k.dec(Shape.Box, 0, H + 2.0, 6, 1.4, 0.5, 14, COL.saffron);
    k.box(0, H + 0.4, 1.4, 3, 2.4, 2.2, COL.cream, Surf.Metal);
    k.dec(Shape.Box, 0, H - 3.5, -13.5, 0.12, 8, 0.12, COL.metalDark);
    k.dec(Shape.Box, 0, H - 8, -13.5, 1.6, 1.2, 1.6, COL.copperDark);
    k.dec(Shape.Box, 0, 7.5, -2.2, 6.8, 0.25, 0.25, COL.saffron, 0, 0, 0.9);
    k.dec(Shape.Box, 0, 7.5, 2.2, 6.8, 0.25, 0.25, COL.saffron, 0, 0, -0.9);
    k.ascender(-4.3, 0, 0, H + 0.4, Math.PI / 2);
    k.chest(2.6, H + 0.4, -1.6, 0);
    k.socket(-2, H + 0.4, -1.2, true);
    const r = roofs[i === 0 ? 1 : 2]!;
    k.zipWorld(k.wx(0, 2.2), k.oy + H + 0.4 + 3.0, k.wz(0, 2.2), r[0], r[1] + 2.6, r[2]);
  });
  // Piers
  for (const lx of [-40, 0, 40]) {
    k.at(L.x + lx, 0, L.z - 66, 0);
    k.box(0, 1.0, -20, 4.4, 0.4, 62, COL.wood, Surf.Wood);
    for (let i = 0; i < 7; i++) {
      k.dec(Shape.Cyl, -1.9, -1.5, 8 - i * 9, 0.5, 5.4, 0.5, COL.woodDark);
      k.dec(Shape.Cyl, 1.9, -1.5, 8 - i * 9, 0.5, 5.4, 0.5, COL.woodDark);
    }
    // steps down into the water at the seaward end
    for (let s = 0; s < 8; s++) k.box(3.2, -4, -47 + s * 0.6, 2.0, 4 + 1.1 - s * 0.32, 0.6, COL.woodDark, Surf.Wood);
    k.crate(0.8, -30, 1.1, 1.4);
    if (lx === 0) k.chest(0, 1.4, -48, 0);
    else k.socket(0, 1.45, -44, false);
  }
  k.ground(L.x - 10, L.z + 2, 0, 9, 8);
  k.house(9, 8, { color: COL.limeWarm, doors: "fr", upper: true, stairs: false, chest: true, loot: 2, canopy: COL.coral, roof: "flat" });
  k.crate(-5.4, 0, 1.3, 0);
  k.crate(-5.45, 1.5, 1.3, 0, COL.woodDark);
  k.crate(-5.4, 0.1, 1.2, 1.3, COL.woodDark);
}

function stiltHut(k: Kit, x: number, z: number, yaw: number): { x: number; y: number; z: number } {
  k.ground(x, z, yaw, 6, 6);
  k.cluster++;
  k.buildingSpots.push({ x, z, loc: k.loc });
  const H = 5.2;
  for (const [px, pz] of [[-2.3, -2.3], [2.3, -2.3], [-2.3, 2.3], [2.3, 2.3]] as const) k.box(px, -2, pz, 0.45, 2 + H, 0.45, COL.woodDark, Surf.Wood);
  k.box(0, H, 0, 6, 0.3, 6, COL.wood, Surf.Wood);
  const y = H + 0.3;
  k.wall(-3, -2.85, 3, -2.85, y, 1.05, COL.wood, [], 0.25, Surf.Wood);
  k.wall(-2.85, -2.7, -2.85, 2.7, y, 1.05, COL.wood, [], 0.25, Surf.Wood);
  k.wall(2.85, -2.7, 2.85, 2.7, y, 1.05, COL.wood, [], 0.25, Surf.Wood);
  for (const [px, pz] of [[-2.7, -2.7], [2.7, -2.7], [-2.7, 2.7], [2.7, 2.7]] as const) k.dec(Shape.Cyl, px, y + 1.5, pz, 0.2, 3.0, 0.2, COL.woodDark);
  k.dec(Shape.Prism, 0, y + 3.0 + 0.8, 0, 7.2, 1.6, 7.2, COL.teal);
  k.ascender(0, 3.7, 0, y, Math.PI);
  k.chest(-1.6, y, -1.8, 0.5);
  k.socket(1.4, y, -1.2, true);
  k.socket(1.2, 0.05, 0.5, false);
  k.crate(-1.2, -0.8, 1.1, 0);
  return { x: k.wx(0, 0), y: k.oy + y, z: k.wz(0, 0) };
}

function buildLandmarks(k: Kit, rng: Rng): void {
  const L = LOCATIONS;
  const hf = k.hf;
  // 6: Gantry Huts
  {
    const l = L[6]!;
    k.loc = l.idx;
    k.tier = l.tier;
    const a = stiltHut(k, l.x - 14, l.z - 4, 0.6);
    const b = stiltHut(k, l.x + 15, l.z + 8, -2.2);
    k.zipWorld(a.x, a.y + 3.0, a.z, b.x, b.y + 3.0, b.z);
    k.ground(l.x, l.z - 16, 0.3);
    k.crate(0, 0, 1.3, 0);
    k.crate(1.6, 0.4, 1.0, 0, COL.woodDark);
    k.socket(-1.5, 0.05, 0.5, false);
  }
  // 7: Span Station (bridge over the gully)
  {
    const l = L[7]!;
    k.loc = l.idx;
    k.tier = l.tier;
    const hA = hf.height(l.x - 34, l.z), hB = hf.height(l.x + 34, l.z);
    const top = Math.min(hA, hB) + 0.25;
    k.at(l.x, top, l.z, Math.PI / 2);
    k.cluster++;
    k.box(0, -0.6, 0, 5.4, 0.6, 72, COL.wood, Surf.Wood);
    k.box(-2.6, 0, 0, 0.2, 0.95, 60, COL.copperDark, Surf.Metal);
    k.box(2.6, 0, 0, 0.2, 0.95, 60, COL.copperDark, Surf.Metal);
    for (const pz of [-14, 14]) {
      k.box(0, -14, pz, 1.6, 13.5, 1.6, COL.limeDark);
      k.dec(Shape.Box, -2.6, 2.2, pz, 0.4, 4.4, 0.4, COL.copper);
      k.dec(Shape.Box, 2.6, 2.2, pz, 0.4, 4.4, 0.4, COL.copper);
      k.dec(Shape.Box, 0, 4.5, pz, 5.8, 0.4, 0.5, COL.copper);
    }
    k.socket(0, 0.05, 0, false);
    k.crate(1.2, 6, 1.1, 0);
    k.crate(-1.2, -9, 1.1, 0);
    k.ground(l.x + 40, l.z + 9, Math.PI, 8, 6);
    k.house(8, 6, { color: COL.limeWarm, doors: "fl", chest: true, locker: true, loot: 2, canopy: COL.indigo, roof: "parapet", stairs: true });
    k.ground(l.x - 40, l.z - 8, 0.4, 5, 4);
    k.house(5, 4.5, { color: COL.wood, roofColor: COL.woodDark, doors: "f", windows: false, loot: 1, crates: 0 });
  }
  // 8: Chalk Quarry
  {
    const l = L[8]!;
    k.loc = l.idx;
    k.tier = l.tier;
    for (let i = 0; i < 16; i++) {
      const a = rng.range(0, Math.PI * 2), r = rng.range(4, 40);
      const x = l.x + Math.sin(a) * r, z = l.z + Math.cos(a) * r;
      k.ground(x, z, rng.range(0, 3));
      k.box(0, -0.8, 0, rng.range(1.6, 3.2), 0.8 + rng.range(1.0, 1.9), rng.range(1.6, 3.4), COL.cream);
      if (i % 5 === 0) k.socket(2.4, 0.05, 0.4, i === 0);
    }
    k.ground(l.x + 6, l.z - 4, 0.8, 7, 5);
    k.house(7, 5.5, { color: COL.wood, roofColor: COL.rust, doors: "fb", windows: false, chest: true, loot: 2, crates: 1 });
    k.ground(l.x - 12, l.z + 8, 0.2);
    k.box(0, -2, 0, 1.2, 2 + 9, 1.2, COL.saffron, Surf.Metal);
    k.dec(Shape.Box, 0, 9.3, 4, 0.8, 0.6, 12, COL.saffron);
    k.dec(Shape.Box, 0, 6.5, 9.5, 0.1, 5, 0.1, COL.metalDark);
    k.dec(Shape.Box, 0, 3.6, 9.5, 2, 1.4, 2, COL.cream);
    k.chest(2.4, 0, 0.6, 1.0, "locker");
  }
  // 9: Drifters' Camp
  {
    const l = L[9]!;
    k.loc = l.idx;
    k.tier = l.tier;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.3;
      const x = l.x + Math.sin(a) * 9.5, z = l.z + Math.cos(a) * 9.5;
      k.ground(x, z, a);
      k.cluster++;
      k.buildingSpots.push({ x, z, loc: k.loc });
      k.box(0, -0.5, 0, 3.0, 0.5 + 1.5, 3.8, FABRICS[i]!, Surf.Fabric, BoxFlag.Solid | BoxFlag.NoRender);
      k.dec(Shape.Prism, 0, 1.05, 0, 3.8, 2.1, 4.2, FABRICS[i]!, 0, Math.PI / 2);
      k.socket(0, 0.05, -3.0, i === 0 || i === 3);
    }
    k.ground(l.x, l.z, 0);
    k.dec(Shape.Cone, 0, 0.5, 0, 1.0, 1.0, 1.0, COL.heat, 0, 0, 0, 1.6);
    k.dec(Shape.Cyl, 0, 0.12, 0, 2.2, 0.24, 2.2, COL.metalDark);
    k.crate(3, 2, 1.1, 0);
    k.crate(-3.5, -1, 0.9, 0, COL.woodDark, 0.4);
    k.chest(-2.2, 0, 3.2, 2.4);
    k.box(4, -0.5, -3, 3.4, 0.5 + 0.5, 0.6, COL.woodDark, Surf.Wood, BoxFlag.Solid, 0.5);
  }
  // 10: Old Turbine
  {
    const l = L[10]!;
    k.loc = l.idx;
    k.tier = l.tier;
    k.ground(l.x, l.z, 0.9);
    k.cluster++;
    k.box(0, -2, 0, 3.2, 2 + 32, 3.2, COL.cream, Surf.Metal, BoxFlag.Solid | BoxFlag.NoRender);
    k.dec(Shape.Cyl, 0, 16, 0, 3.8, 32, 3.8, COL.cream);
    k.dec(Shape.Cyl, 0, 1.2, 0, 6, 2.4, 6, COL.limeDark);
    k.dec(Shape.Box, 0, 32.6, 0.6, 2.6, 2.4, 7, COL.copper);
    k.dec(Shape.Cyl, 0, 20, 0, 4.0, 0.8, 4.0, COL.copper);
    k.spinners.push({ x: k.wx(0, 4.6), y: k.oy + 32.6, z: k.wz(0, 4.6), yaw: 0.9, r: 17, color: COL.cream });
    k.ground(l.x + 12, l.z + 4, 0.9 + Math.PI / 2, 6, 5);
    k.house(6.5, 5.5, { color: COL.concrete, roofColor: COL.copperDark, doors: "f", chest: true, loot: 2, crates: 0, roof: "flat" });
    k.ground(l.x - 9, l.z + 7, 0);
    k.vent(0, 0.1, 0);
    k.ground(l.x - 4, l.z - 9, 0.2);
    k.crate(0, 0, 1.3, 0, COL.metal);
    k.socket(1.6, 0.05, 0, false);
  }
  // 11: Echo Hollow (rock shelter)
  {
    const l = L[11]!;
    k.loc = l.idx;
    k.tier = l.tier;
    const base = hf.height(l.x, l.z);
    for (let i = 0; i < 7; i++) {
      const a = 0.9 + (i / 7) * Math.PI * 1.55;
      k.rock(l.x + Math.sin(a) * 9.5, l.z + Math.cos(a) * 9.5, rng.range(6.5, 8.5), rng.range(7.5, 9), rng.range(6.5, 8.5), a, 1, 0.22);
    }
    k.at(l.x, base, l.z, 0.4);
    k.cluster++;
    k.buildingSpots.push({ x: l.x, z: l.z, loc: k.loc });
    k.box(0, 4.6, 0, 20, 1.8, 20, COL.rock);
    k.dec(Shape.Box, 1, 6.5, -1, 15, 1.0, 14, COL.limeDark, 0, 0.5);
    k.chest(0, 0.05, 3.5, Math.PI);
    k.socket(-2.5, 0.05, 0, true);
    k.socket(2.6, 0.05, -1.5, false);
    k.crate(3, 3, 1.1, 0);
    k.dec(Shape.Sphere, 0, 3.9, 0, 0.7, 0.7, 0.7, COL.verdigris, 0, 0, 0, 1.2);
  }
  // 12: Relay Shack
  {
    const l = L[12]!;
    k.loc = l.idx;
    k.tier = l.tier;
    k.ground(l.x, l.z, 2.2, 6.5, 5.5);
    k.house(6.5, 5.5, { color: COL.limeCool, roofColor: COL.copperDark, doors: "f", locker: true, chest: true, loot: 2, crates: 0 });
    k.ground(l.x - 10, l.z + 3, 0.3);
    k.cluster++;
    const H = 9;
    k.box(0, -2, 0, 1.1, 2 + 24, 1.1, COL.metal, Surf.Metal);
    k.box(0, H, 0, 4.6, 0.3, 4.6, COL.metalDark, Surf.Metal);
    k.dec(Shape.Cone, 0, 22, 1.0, 3.0, 1.0, 3.0, COL.cream, 1.2, 0, Math.PI);
    k.dec(Shape.Sphere, 0, 24.4, 0, 0.7, 0.7, 0.7, COL.coral, 0, 0, 0, 1.0);
    for (const [px, pz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]] as const) k.dec(Shape.Cyl, px, H / 2, pz, 0.18, H, 0.18, COL.metalDark);
    k.ascender(0, 3.0, 0, H + 0.3, Math.PI);
    k.socket(-1.2, H + 0.3, -1.2, true);
    const m = L[0]!;
    const dx = m.x - k.ox, dz = m.z - k.oz, d = Math.hypot(dx, dz);
    safeZip(k, k.wx(1.5, -1.5), k.oy + H + 0.3 + 3.0, k.wz(1.5, -1.5), dx / d, dz / d, 110);
  }
  // 13: The Keelwreck — pushed out to the shoreline
  {
    const l = L[13]!;
    k.loc = l.idx;
    k.tier = l.tier;
    const dir = Math.atan2(l.x, l.z);
    let r = Math.hypot(l.x, l.z);
    for (; r < 620; r += 2) if (hf.height(Math.sin(dir) * r, Math.cos(dir) * r) < 1.1) break;
    r -= 9;
    l.x = Math.sin(dir) * r;
    l.z = Math.cos(dir) * r;
    k.ground(l.x, l.z, dir + 0.5);
    k.cluster++;
    k.buildingSpots.push({ x: l.x, z: l.z, loc: k.loc });
    // fore half
    k.box(0, -1, 0, 6.4, 1 + 0.5, 15, COL.woodDark, Surf.Wood);
    k.box(-3.1, 0.5, 0, 0.35, 2.6, 15, COL.wood, Surf.Wood);
    k.box(3.1, 0.5, 0, 0.35, 2.6, 15, COL.wood, Surf.Wood);
    k.box(0, 0.5, -7.4, 6.4, 2.6, 0.35, COL.wood, Surf.Wood);
    k.dec(Shape.Prism, 0, 1.8, -10.4, 6.4, 2.6, 6, COL.woodDark, Math.PI / 2, 0, 0);
    k.dec(Shape.Cyl, 0, 5.5, -2, 0.4, 10, 0.4, COL.copperDark, 0, 0, 0.35);
    k.dec(Shape.Box, 1.6, 6.5, -2, 4.4, 5, 0.08, COL.coral, 0, 0, 0.35);
    k.dec(Shape.Cyl, -3.8, 1.2, 3, 2.4, 1.4, 2.4, COL.copper, 0, 0, Math.PI / 2);
    k.dec(Shape.Cyl, 3.8, 1.2, 3, 2.4, 1.4, 2.4, COL.copper, 0, 0, Math.PI / 2);
    k.chest(0, 0.5, -5.6, 0);
    k.socket(-1.5, 0.5, 2, true);
    k.socket(1.5, 0.5, -1.5, false);
    k.crate(1.6, 4.5, 1.2, 0.5);
    // aft half, broken away
    k.ground(l.x + Math.sin(dir + 1.9) * 15, l.z + Math.cos(dir + 1.9) * 15, dir - 0.7);
    k.box(0, -1, 0, 6.0, 1 + 0.6, 9, COL.woodDark, Surf.Wood);
    k.box(-2.9, 0.6, 0, 0.35, 2.0, 9, COL.wood, Surf.Wood);
    k.box(0, 0.6, 4.4, 6.0, 2.6, 0.35, COL.wood, Surf.Wood);
    k.socket(0.5, 0.6, 0, false);
    k.chest(1.4, 0.6, 2.8, Math.PI);
    k.crate(-1, -2.5, 1.1, 0.6);
  }
}

const PIER = { x: -655, y: 6, z: -655 };

function buildPier(k: Kit): PierInfo {
  k.loc = -1;
  k.tier = 2;
  k.at(PIER.x, PIER.y, PIER.z, 0);
  k.box(0, -1, 0, 78, 1, 48, COL.wood, Surf.Wood);
  for (let i = -3; i <= 3; i++)
    for (const pz of [-20, 0, 20]) k.dec(Shape.Cyl, i * 12, -6.5, pz, 1.1, 13, 1.1, COL.woodDark);
  const rail = COL.copperDark;
  k.wall(-39, -23.8, 39, -23.8, 0, 1.0, rail, [], 0.3, Surf.Wood);
  k.wall(-39, 23.8, 39, 23.8, 0, 1.0, rail, [[39, 3.2, 0, 1.0]], 0.3, Surf.Wood);
  k.wall(-38.8, -23.5, -38.8, 23.5, 0, 1.0, rail, [], 0.3, Surf.Wood);
  k.wall(38.8, -23.5, 38.8, 23.5, 0, 1.0, rail, [], 0.3, Surf.Wood);
  // backboard + racks
  k.box(-20, 0, -21.5, 30, 2.6, 0.4, COL.woodDark, Surf.Wood);
  k.dec(Shape.Box, -20, 2.9, -20.4, 30.6, 0.1, 3.0, COL.teal, 0.18);
  const weaponSpots: [number, number, number][] = [];
  for (let i = 0; i < 9; i++) weaponSpots.push([k.wx(-32 + i * 3, -18.6), PIER.y, k.wz(-32 + i * 3, -18.6)]);
  const itemSpots: [number, number, number][] = [];
  for (let i = 0; i < 8; i++) itemSpots.push([k.wx(-30.5 + i * 3, -15.2), PIER.y, k.wz(-30.5 + i * 3, -15.2)]);
  k.chest(-36.5, 0, -19, Math.PI / 2, "locker");
  k.chest(-3.5, 0, -19, -Math.PI / 2, "locker");
  // firing line counter
  k.box(-2, 0, -8, 0.7, 1.0, 9, COL.woodDark, Surf.Wood);
  const dummies: PierInfo["dummies"] = [];
  const dy = PIER.y;
  dummies.push({ x: k.wx(8, -11), y: dy, z: k.wz(8, -11), yaw: -Math.PI / 2, mover: false });
  dummies.push({ x: k.wx(18, -6), y: dy, z: k.wz(18, -6), yaw: -Math.PI / 2, mover: true });
  dummies.push({ x: k.wx(32, -10), y: dy, z: k.wz(32, -10), yaw: -Math.PI / 2, mover: false });
  for (const [dx, dz] of [[64, -12], [104, -5]] as const) {
    k.box(dx, -1, dz, 7, 1, 7, COL.wood, Surf.Wood);
    k.dec(Shape.Cyl, dx, -6.5, dz, 1.1, 13, 1.1, COL.woodDark);
    k.box(dx + 3.2, 0, dz, 0.3, 2.4, 7, COL.teal, Surf.Wood);
    dummies.push({ x: k.wx(dx, dz), y: dy, z: k.wz(dx, dz), yaw: -Math.PI / 2, mover: false });
  }
  // movement course
  k.crate(-32, 9, 0.9, 0);
  k.crate(-29.6, 9, 1.3, 0, COL.woodDark);
  k.box(-26.6, 0, 9, 2.4, 1.5, 2.4, COL.wood, Surf.Wood);
  k.box(-22.4, 0, 9, 5, 2.9, 3, COL.woodDark, Surf.Wood);
  // tower with ascender + zipline
  const H = 7;
  for (const [px, pz] of [[-2.2, -2.2], [2.2, -2.2], [-2.2, 2.2], [2.2, 2.2]] as const) k.box(-8 + px, 0, 14 + pz, 0.45, H, 0.45, COL.woodDark, Surf.Wood);
  k.box(-8, H, 14, 5.6, 0.3, 5.6, COL.wood, Surf.Wood);
  k.ascender(-8, 10.4, 0, H + 0.3, 0);
  k.zipWorld(k.wx(-6, 14), PIER.y + H + 0.3 + 3.0, k.wz(-6, 14), k.wx(33, 14), PIER.y + 3.2, k.wz(33, 14));
  k.vent(16, 0.05, 4);
  // swim stairs off the +z edge
  k.stairs(0, 24 + 9.66, 0, -1, 7.2, 3.0, COL.woodDark, -7.2, Surf.Wood);
  k.dec(Shape.Box, 0, 0.08, 20, 3, 0.05, 6, COL.teal);
  // canopy
  k.dec(Shape.Box, 20, 4.4, 14, 12, 0.12, 8, COL.coral, 0.1);
  for (const [px, pz] of [[14.5, 10.5], [25.5, 10.5], [14.5, 17.5], [25.5, 17.5]] as const) k.dec(Shape.Cyl, px, 2.2, pz, 0.2, 4.4, 0.2, COL.woodDark);
  const spawns: [number, number][] = [];
  for (let i = 0; i < 24; i++) spawns.push([k.wx(-10 + (i % 8) * 3.2, -2 + Math.floor(i / 8) * 3), k.wz(-10 + (i % 8) * 3.2, -2 + Math.floor(i / 8) * 3)]);
  return { x: PIER.x, y: PIER.y, z: PIER.z, spawns, weaponSpots, itemSpots, dummies };
}

function scatter(k: Kit, rng: Rng): void {
  const hf = k.hf;
  const n = { x: 0, y: 0, z: 0 };
  const nearLoc = (x: number, z: number, pad: number): boolean => LOCATIONS.some((l) => Math.hypot(x - l.x, z - l.z) < l.r + pad);
  const nearLink = (x: number, z: number): boolean => {
    for (const zl of k.ziplines) {
      const d = distToPolyline(x, z, [[zl.ax, zl.az], [zl.bx, zl.bz]]);
      if (d < 5) return true;
    }
    return false;
  };
  // Trees: forest patches by noise
  for (let i = 0; i < 5200 && k.trees.length < 1750; i++) {
    const x = rng.range(-580, 580), z = rng.range(-580, 580);
    const h = hf.height(x, z);
    if (h < 2.2) continue;
    const forest = fbm2(x / 130 + 31, z / 130 + 57, 3, SEED + 9);
    if (forest < 0.47 && !rng.chance(0.05)) continue;
    if (hf.normal(x, z, n) < 0.83) continue;
    if (nearLoc(x, z, 4) || distToPolyline(x, z, GULLY) < 14 || nearLink(x, z)) continue;
    k.tree(x, z, rng.range(0.85, 1.5), forest > 0.56 ? 0 : 1, rng.int(0, 2));
  }
  // Boulders: everywhere, denser on ridges, so open ground always has cover
  for (let i = 0; i < 2600 && k.rocks.length < 620; i++) {
    const x = rng.range(-560, 560), z = rng.range(-560, 560);
    const h = hf.height(x, z);
    if (h < 0.8) continue;
    const ny = hf.normal(x, z, n);
    if (ny > 0.97 && !rng.chance(0.3)) continue;
    if (nearLoc(x, z, -6) || nearLink(x, z)) continue;
    const s = rng.range(1.6, 4.6);
    k.rock(x, z, s * rng.range(0.9, 1.5), s * rng.range(0.7, 1.05), s * rng.range(0.9, 1.5), rng.range(0, Math.PI), rng.int(0, 2));
  }
}

function computeFinalCenters(world: World, nav: NavGrid, rng: Rng): [number, number][] {
  const out: [number, number][] = [];
  const n = { x: 0, y: 0, z: 0 };
  for (const poly of VALID_ZONES) {
    let minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
    for (const [x, z] of poly) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z);
    }
    let found = 0;
    for (let i = 0; i < 400 && found < 10; i++) {
      const x = rng.range(minX, maxX), z = rng.range(minZ, maxZ);
      if (!pointInPolygon(x, z, poly)) continue;
      if (world.terrain(x, z) < 1.5) continue; // reject open water
      if (world.hf.normal(x, z, n) < 0.9) continue; // reject severe slopes
      if (!nav.walkableAt(x, z)) continue; // reject inaccessible roofs / interiors of solids
      // cover check: count solid cover pieces within 32 m
      let cover = 0;
      for (let a = 0; a < 12; a++) {
        const ang = (a / 12) * Math.PI * 2;
        for (const r of [8, 16, 26]) if (world.hasBoxesNear(x + Math.sin(ang) * r, z + Math.cos(ang) * r)) cover++;
      }
      if (cover < 6) continue; // reject cover-poor ground
      // dry land ring: no deep water inside the 30 m endgame field
      let wet = false;
      for (let a = 0; a < 8 && !wet; a++) {
        const ang = (a / 8) * Math.PI * 2;
        if (world.terrain(x + Math.sin(ang) * 28, z + Math.cos(ang) * 28) < -0.9) wet = true;
      }
      if (wet) continue;
      out.push([x, z]);
      found++;
    }
  }
  return out;
}

let cached: IslandData | null = null;

export function buildIsland(onProgress?: (label: string, frac: number) => void): IslandData {
  if (cached) return cached;
  const rng = new Rng(SEED);
  onProgress?.("Raising the Highwake", 0.05);
  const hf = buildHeightfield();
  const k = new Kit(hf, () => rng.next());
  onProgress?.("Placing settlements", 0.3);
  const L = LOCATIONS;
  buildMarket(k, rng.fork(1), L[0]!);
  buildArray(k, rng.fork(2), L[1]!);
  buildKilnworks(k, rng.fork(3), L[2]!);
  buildOrchard(k, rng.fork(4), L[3]!);
  buildAbbey(k, rng.fork(5), L[4]!);
  buildDocks(k, rng.fork(6), L[5]!);
  buildLandmarks(k, rng.fork(7));
  const pier = buildPier(k);
  scatter(k, rng.fork(8));
  onProgress?.("Indexing collision", 0.55);
  const world = new World(hf, k.boxes);
  onProgress?.("Charting navigation", 0.65);
  const nav = new NavGrid(world, L.map((l) => [l.x, l.z] as [number, number]), k.hazards);
  // Keep only loot sockets a ground-bound actor can actually stand next to, or that sit on reachable structures.
  const finalCenters = computeFinalCenters(world, nav, rng.fork(9));
  let hash = 2166136261;
  for (const b of k.boxes) {
    for (const v of [b.x, b.y, b.z, b.hx, b.hy, b.hz, b.yaw]) {
      hash ^= Math.round(v * 100) | 0;
      hash = Math.imul(hash, 16777619);
    }
  }
  for (let i = 0; i < hf.data.length; i += 7) {
    hash ^= Math.round(hf.data[i]! * 100) | 0;
    hash = Math.imul(hash, 16777619);
  }
  onProgress?.("Island ready", 0.8);
  cached = {
    version: MAP_VERSION, hf, world, nav,
    decor: k.decor, sockets: k.sockets, chests: k.chests, ziplines: k.ziplines, ascenders: k.ascenders,
    vents: k.vents, hazards: k.hazards, trees: k.trees, rocks: k.rocks, spinners: k.spinners,
    locations: L, buildingSpots: k.buildingSpots, finalCenters, pier, collisionHash: hash >>> 0,
  };
  return cached;
}

export function locationAt(x: number, z: number): LocationDef | null {
  let best: LocationDef | null = null;
  let bd = 1e9;
  for (const l of LOCATIONS) {
    const d = Math.hypot(x - l.x, z - l.z);
    if (d < l.r * 1.25 && d < bd) {
      bd = d;
      best = l;
    }
  }
  return best;
}

export { makeBox };
