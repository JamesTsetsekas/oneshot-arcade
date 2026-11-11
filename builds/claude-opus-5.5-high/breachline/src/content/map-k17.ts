// Relay Station K-17 — original map authored as axis-aligned collision boxes.
// ~115 x 95 m. x = west(-)/east(+), z = south(-)/north(+), y up.
// Collision is the authoritative source; the renderer builds visuals from the same boxes.
import { Box, MaterialTag, THIN_MATERIALS } from "../shared/collision";
import { Vec3 } from "../shared/math";

export type Shape = "box" | "cylX" | "cylY" | "cylZ";
export interface MapBox extends Box { shape?: Shape; noRender?: boolean }

export interface Decor {
  kind: "dish" | "mast" | "sign" | "lightPanel" | "lightBox" | "steam" | "beacon" | "smallDish" | "tire" | "flag";
  pos: Vec3;
  rot?: number;
  size?: number;
  text?: string;
  color?: string;
}

export interface Zone { id: string; name: string; min: Vec3; max: Vec3 }

export interface MapDef {
  id: string;
  name: string;
  boxes: MapBox[];
  decor: Decor[];
  zones: Zone[];
  spawnCandidates: { pos: Vec3; yaw: number; side: 0 | 1 | -1 }[];
  teamBase: [Vec3, Vec3];
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
}

let nextId = 0;
const boxes: MapBox[] = [];
const decor: Decor[] = [];

function B(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, mat: MaterialTag, opts: Partial<MapBox> = {}): MapBox {
  const b: MapBox = {
    id: nextId++,
    min: { x: Math.min(x0, x1), y: Math.min(y0, y1), z: Math.min(z0, z1) },
    max: { x: Math.max(x0, x1), y: Math.max(y0, y1), z: Math.max(z0, z1) },
    mat, active: true, pen: THIN_MATERIALS[mat], ...opts,
  };
  if (mat === "glass") { b.breakable = true; b.seeThrough = true; }
  if (mat === "clip") { b.clip = true; b.noRender = true; }
  boxes.push(b);
  return b;
}

type Opening = { a: number; b: number; y0: number; y1: number; glass?: boolean };

/** Wall perpendicular to X (runs along Z), centred on x with thickness t. */
function wallX(x: number, z0: number, z1: number, y0: number, y1: number, t: number, ops: Opening[], mat: MaterialTag) {
  wallGeneric("x", x, z0, z1, y0, y1, t, ops, mat);
}
/** Wall perpendicular to Z (runs along X). */
function wallZ(z: number, x0: number, x1: number, y0: number, y1: number, t: number, ops: Opening[], mat: MaterialTag) {
  wallGeneric("z", z, x0, x1, y0, y1, t, ops, mat);
}
function wallGeneric(axis: "x" | "z", c: number, s0: number, s1: number, y0: number, y1: number, t: number, ops: Opening[], mat: MaterialTag) {
  const mk = (a: number, b: number, ya: number, yb: number, m: MaterialTag) => {
    if (b - a < 0.01 || yb - ya < 0.01) return;
    if (axis === "x") B(c - t / 2, c + t / 2, ya, yb, a, b, m);
    else B(a, b, ya, yb, c - t / 2, c + t / 2, m);
  };
  const sorted = ops.map((o) => ({ ...o, y0: Math.max(o.y0, y0), y1: Math.min(o.y1, y1) })).filter((o) => o.y1 > o.y0 && o.b > s0 && o.a < s1).sort((p, q) => p.a - q.a);
  let cur = s0;
  for (const o of sorted) {
    mk(cur, o.a, y0, y1, mat);
    mk(o.a, o.b, y0, o.y0, mat);
    mk(o.a, o.b, o.y1, y1, mat);
    if (o.glass) {
      if (axis === "x") B(c - 0.04, c + 0.04, o.y0, o.y1, o.a, o.b, "glass");
      else B(o.a, o.b, o.y0, o.y1, c - 0.04, c + 0.04, "glass");
    }
    cur = o.b;
  }
  mk(cur, s1, y0, y1, mat);
}

/** Solid staircase. Steps rise from (low end) to (high end) along the given axis. */
function stairs(axis: "x" | "z", low: number, high: number, c0: number, c1: number, yLow: number, yHigh: number, n: number, mat: MaterialTag = "concrete") {
  for (let i = 0; i < n; i++) {
    const a = low + ((high - low) * i) / n;
    const b = low + ((high - low) * (i + 1)) / n;
    const top = yLow + ((yHigh - yLow) * (i + 1)) / n;
    if (axis === "x") B(a, b, yLow - 0.4, top, c0, c1, mat);
    else B(c0, c1, yLow - 0.4, top, a, b, mat);
  }
}

/** Floor slab with rectangular holes (xz). */
function floorWithHoles(x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, holes: [number, number, number, number][], mat: MaterialTag) {
  const xs = new Set<number>([x0, x1]);
  for (const h of holes) { xs.add(h[0]); xs.add(h[1]); }
  const xa = [...xs].filter((x) => x >= x0 && x <= x1).sort((a, b) => a - b);
  for (let i = 0; i < xa.length - 1; i++) {
    const sx0 = xa[i], sx1 = xa[i + 1];
    const mid = (sx0 + sx1) / 2;
    const cut = holes.filter((h) => mid > h[0] && mid < h[1]).map((h) => [h[2], h[3]] as [number, number]).sort((a, b) => a[0] - b[0]);
    let cz = z0;
    for (const [hz0, hz1] of cut) { if (hz0 > cz) B(sx0, sx1, y0, y1, cz, hz0, mat); cz = Math.max(cz, hz1); }
    if (cz < z1) B(sx0, sx1, y0, y1, cz, z1, mat);
  }
}

const cylY = (cx: number, cz: number, r: number, y0: number, y1: number, mat: MaterialTag = "metal") => B(cx - r, cx + r, y0, y1, cz - r, cz + r, mat, { shape: "cylY", pen: undefined });
const pipeX = (x0: number, x1: number, cz: number, y0: number, y1: number, mat: MaterialTag = "pipe") => { const r = (y1 - y0) / 2; return B(x0, x1, y0, y1, cz - r, cz + r, mat, { shape: "cylX" }); };
const crate = (cx: number, cz: number, s = 1.4, h = 1.4) => B(cx - s / 2, cx + s / 2, 0, h, cz - s / 2, cz + s / 2, "crate");
const lowWall = (x0: number, x1: number, z0: number, z1: number, h = 1.1, y = 0) => B(x0, x1, y, y + h, z0, z1, "concrete");
const container = (x0: number, x1: number, z0: number, z1: number, y = 0, color?: string) => B(x0, x1, y, y + 2.6, z0, z1, "container", { color });

// =================== Ground, tunnel, boundary ===================
const HOLE_W: [number, number, number, number] = [-24, -19, -13, -10];
const HOLE_E: [number, number, number, number] = [19, 24, -13, -10];
floorWithHoles(-57.5, 57.5, -47.5, 20, -0.5, 0, [HOLE_W, HOLE_E], "concrete");
// North ridge plateau (top y = 2.4)
B(-57.5, 57.5, -0.5, 2.4, 20, 47.5, "rock");

// Service tunnel S-1 below the courtyard
B(-24.4, 24.4, -3.6, -3.2, -13.4, -9.6, "tile");
B(-24.4, 24.4, -3.6, -0.5, -13.8, -13, "concrete");
B(-24.4, 24.4, -3.6, -0.5, -10, -9.2, "concrete");
B(-24.8, -24, -3.6, 0, -13.4, -9.6, "concrete");
B(24, 24.8, -3.6, 0, -13.4, -9.6, "concrete");
stairs("x", -19, -24, -13, -10, -3.2, 0, 11, "concrete");
stairs("x", 19, 24, -13, -10, -3.2, 0, 11, "concrete");
crate(-6, -11.5, 1.2, 1.1);
B(4, 5.4, -3.2, -2.0, -12.9, -11.6, "orange");
// Rails around tunnel stairwells
for (const [hx0, hx1, hz0, hz1] of [HOLE_W, HOLE_E]) {
  B(hx0, hx1, 0, 1.0, hz0 - 0.12, hz0, "metal");
  B(hx0, hx1, 0, 1.0, hz1, hz1 + 0.12, "metal");
}
B(-19, -18.88, 0, 1.0, -13, -10, "metal");
B(18.88, 19, 0, 1.0, -13, -10, "metal");

// Boundary: invisible clip walls + visible parapets
B(-58.5, -57.5, -5, 20, -48.5, 48.5, "clip");
B(57.5, 58.5, -5, 20, -48.5, 48.5, "clip");
B(-58.5, 58.5, -5, 20, -48.5, -47.5, "clip");
B(-58.5, 58.5, -5, 20, 47.5, 48.5, "clip");
B(-57.5, -57, 0, 1.0, -47.5, 20, "concrete");
B(57, 57.5, 0, 1.0, -47.5, 20, "concrete");
B(-57.5, 57.5, 0, 1.0, -47.5, -47, "concrete");
B(-57.5, -57, 2.4, 3.4, 20, 47.5, "concrete");
B(57, 57.5, 2.4, 3.4, 20, 47.5, "concrete");
B(-57.5, 57.5, 2.4, 3.4, 47, 47.5, "concrete");

// =================== West Operations Wing ===================
{
  const H = 3.6, T = 0.4;
  // exterior
  wallX(-44, -14, 14, 0, H, T, [{ a: -7.5, b: -5.5, y0: 0, y1: 2.6 }, { a: 5.5, b: 7.5, y0: 0, y1: 2.6 }], "composite");
  wallX(-28, -14, 14, 0, H, T, [{ a: -7.5, b: -5.5, y0: 0, y1: 2.6 }, { a: 5.5, b: 7.5, y0: 0, y1: 2.6 }, { a: -2.5, b: 2.5, y0: 1.0, y1: 2.4, glass: true }], "composite");
  wallZ(14, -44, -28, 0, H, T, [{ a: -37, b: -35, y0: 0, y1: 2.6 }, { a: -32, b: -30, y0: 1.1, y1: 2.3 }], "composite");
  wallZ(-14, -44, -28, 0, H, T, [{ a: -37, b: -35, y0: 0, y1: 2.6 }, { a: -42, b: -40, y0: 1.1, y1: 2.3 }], "composite");
  B(-44.2, -27.8, H, H + 0.4, -14.2, 14.2, "roof", { roofOf: "ops" });
  // inner bands with doors
  wallZ(9.5, -43.8, -28.2, 0, H, 0.25, [{ a: -42, b: -40.5, y0: 0, y1: 2.5 }, { a: -31.5, b: -30, y0: 0, y1: 2.5 }], "composite");
  wallZ(-9.5, -43.8, -28.2, 0, H, 0.25, [{ a: -42, b: -40.5, y0: 0, y1: 2.5 }, { a: -31.5, b: -30, y0: 0, y1: 2.5 }], "composite");
  // control room
  wallX(-40, -4.5, 4.5, 0, H, 0.25, [{ a: -2.5, b: 2.5, y0: 1.0, y1: 2.4, glass: true }], "composite");
  wallX(-32, -4.5, 4.5, 0, H, 0.25, [{ a: -2.5, b: 2.5, y0: 1.0, y1: 2.4, glass: true }], "composite");
  wallZ(4.5, -40, -32, 0, H, 0.25, [{ a: -37, b: -35, y0: 0, y1: 2.5 }], "composite");
  wallZ(-4.5, -40, -32, 0, H, 0.25, [{ a: -37, b: -35, y0: 0, y1: 2.5 }], "composite");
  B(-38.5, -33.5, 0, 0.9, -1.0, 1.0, "graphite"); // console bank
  B(-39.6, -38.8, 0, 1.6, 2.6, 4.2, "graphite");
  B(-33.2, -32.4, 0, 1.6, -4.2, -2.6, "graphite");
  // offices
  B(-43, -41, 0, 0.8, 11.5, 13, "graphite");
  B(-38, -34, 0, 0.8, 11.2, 12.4, "crate");
  B(-33, -29, 0, 1.4, 12.6, 13.5, "graphite");
  B(-43, -40, 0, 0.8, -13, -11.5, "graphite");
  B(-34, -31, 0, 0.8, -12.6, -11.2, "crate");
  B(-30, -29, 0, 1.8, -13.6, -12.2, "orange");
  // corridor clutter
  B(-43.6, -42.6, 0, 1.2, -1, 1, "crate");
  B(-29.4, -28.4, 0, 1.0, 3, 4.2, "crate");
  decor.push({ kind: "sign", pos: { x: -27.75, y: 3.0, z: -6.5 }, rot: Math.PI / 2, text: "OPS WING", color: "#2ec4d6" });
  decor.push({ kind: "sign", pos: { x: -44.25, y: 3.0, z: 0 }, rot: -Math.PI / 2, text: "K-17 OPERATIONS", color: "#2ec4d6" });
  for (const [x, z] of [[-42, 0], [-30, 0], [-36, 7], [-36, -7], [-36, 0], [-36, 12], [-36, -12]] as const)
    decor.push({ kind: "lightPanel", pos: { x, y: H - 0.02, z } });
}

// =================== Central Dish Courtyard ===================
{
  B(-3.5, 3.5, 0, 1.2, -3.5, 3.5, "concrete");
  B(-0.6, 0.6, 1.2, 7, -0.6, 0.6, "metal", { pen: undefined });
  decor.push({ kind: "dish", pos: { x: 0, y: 7, z: 0 }, size: 4.2 });
  lowWall(-16, -12, -7, -6.4); lowWall(-16, -12, 6.4, 7);
  lowWall(12, 16, -7, -6.4); lowWall(12, 16, 6.4, 7);
  lowWall(-6, -2, 10, 10.6); lowWall(2, 6, -16.6, -16);
  lowWall(-22, -21.4, -3, 3); lowWall(21.4, 22, -3, 3);
  lowWall(-9, -6, -7.5, -6.9); lowWall(6, 9, 6.9, 7.5);
  crate(-9, -14); crate(8, 14); crate(-20, 9); crate(20.5, -15.5); crate(-1.5, 12.5, 1.2, 1.2); crate(9.5, 2, 1.2, 1.0);
  B(-10.6, -9.4, 0, 2.0, 3.6, 4.4, "orange"); B(9.4, 10.6, 0, 2.0, -4.4, -3.6, "orange");
  B(-0.6, 0.6, 0, 2.0, 13.6, 14.4, "orange"); B(-14.6, -13.4, 0, 2.0, -14.4, -13.6, "orange");
  container(-20, -14, 13, 15.4, 0, "#2f6f7a");
  container(14, 20, -17.6, -15.2, 0, "#b5562a");
  // South fence of courtyard with two gaps into utility
  wallZ(-18, -26, 26, 0, 3.0, 0.4, [{ a: -12, b: -8, y0: 0, y1: 3.0 }, { a: 6, b: 10, y0: 0, y1: 3.0 }], "composite");
  // North retaining wall face is the ridge box; stairs up to the ridge
  stairs("z", 15.2, 20, -12, -9, 0, 2.4, 8);
  stairs("z", 15.2, 20, 9, 12, 0, 2.4, 8);
  decor.push({ kind: "sign", pos: { x: -21.5, y: 1.3, z: -9.86 }, rot: 0, size: 0.6, text: "SERVICE TUNNEL S-1", color: "#e8a33d" });
  decor.push({ kind: "sign", pos: { x: 21.5, y: 1.3, z: -9.86 }, rot: 0, size: 0.6, text: "SERVICE TUNNEL S-1", color: "#e8a33d" });
  for (let x = -16; x <= 16; x += 8) decor.push({ kind: "lightBox", pos: { x, y: -0.9, z: -12.93 } }, { kind: "lightBox", pos: { x: x + 4, y: -0.9, z: -10.07 } });
}

// =================== East Maintenance Bay ===================
{
  const H = 8, T = 0.4;
  // West wall: structural lower, penetrable sheet-metal upper (power position)
  wallX(28.2, -14, 14, 0, 3.6, T, [{ a: -3, b: 3, y0: 0, y1: 4.5 }], "composite");
  wallX(28.2, -14, 14, 3.6, H, T, [{ a: -3, b: 3, y0: 0, y1: 4.5 }, { a: -11, b: -6, y0: 4.6, y1: 5.9 }, { a: 6, b: 11, y0: 4.6, y1: 5.9 }], "metal");
  wallX(45.8, -14, 14, 0, H, T, [{ a: -6, b: -4, y0: 0, y1: 2.8 }, { a: 4, b: 6, y0: 0, y1: 2.8 }], "composite");
  wallZ(13.8, 28, 46, 0, H, T, [{ a: 40, b: 42, y0: 0, y1: 2.8 }], "composite");
  wallZ(-13.8, 28, 46, 0, H, T, [{ a: 40, b: 42.5, y0: 0, y1: 2.8 }], "composite");
  B(28, 46, H, H + 0.4, -14, 14, "roof", { roofOf: "bay" });
  // Catwalk
  B(28.4, 31, 3.4, 3.6, -13.6, 13.6, "grate");
  B(30.9, 31, 3.6, 4.6, -11.8, 11.8, "grate");
  stairs("x", 37, 31, 11.8, 13.6, 0, 3.6, 12, "metal");
  // Mantle stack to the catwalk at the south end
  B(33, 34.6, 0, 1.2, -13.6, -11.8, "crate");
  B(31, 33, 0, 2.4, -13.6, -11.8, "container");
  // Vehicle props
  B(41.2, 43.6, 0, 2.6, -7, -3, "orange");
  B(35, 41.2, 0.7, 3.3, -7.2, -2.8, "container", { color: "#d4d1c8" });
  B(35.2, 41, 0, 0.7, -6.6, -3.4, "graphite");
  B(37, 39.4, 0, 2.2, 4, 6, "orange");
  B(42, 44, 0, 1.4, 8, 10, "crate"); B(42.3, 43.7, 1.4, 2.6, 8.3, 9.7, "crate");
  B(33, 35, 0, 1.0, -1, 1, "graphite");
  B(43.5, 45.4, 0, 2.0, -12.5, -9.5, "orange");
  decor.push({ kind: "sign", pos: { x: 27.95, y: 6.6, z: 0 }, rot: -Math.PI / 2, text: "BAY 2 · MAINTENANCE", color: "#e8a33d" });
  decor.push({ kind: "tire", pos: { x: 36.2, y: 0.45, z: -7.4 } }); decor.push({ kind: "tire", pos: { x: 39.8, y: 0.45, z: -7.4 } });
  decor.push({ kind: "tire", pos: { x: 36.2, y: 0.45, z: -2.6 } }); decor.push({ kind: "tire", pos: { x: 39.8, y: 0.45, z: -2.6 } });
  for (const [x, z] of [[33, -8], [33, 8], [40, -8], [40, 8], [40, 0], [33, 0]] as const) decor.push({ kind: "lightPanel", pos: { x, y: H - 0.02, z } });
}

// =================== Spawns ===================
{
  // Halyard (west) and Vantor (east) staging pads
  container(-50.5, -48, -12, -6, 0, "#2f6f7a");
  container(-50.5, -48, 4, 10, 0, "#2f6f7a");
  crate(-54, -2); crate(-54, 6); B(-56.5, -55, 0, 2.2, -14, -10, "orange");
  container(48, 50.5, -12, -6, 0, "#b5562a");
  container(48, 50.5, 4, 10, 0, "#b5562a");
  crate(54, 2); crate(54, -6); B(55, 56.5, 0, 2.2, 10, 14, "orange");
  // sight blockers toward the ridge
  container(-54, -48, 13, 15.4, 0, "#2f6f7a");
  container(48, 54, 13, 15.4, 0, "#b5562a");
  stairs("z", 15.2, 20, -57, -54.5, 0, 2.4, 8);
  stairs("z", 15.2, 20, 54.5, 57, 0, 2.4, 8);
  decor.push({ kind: "flag", pos: { x: -56, y: 0, z: 0 }, color: "#29b6c8" });
  decor.push({ kind: "flag", pos: { x: 56, y: 0, z: 0 }, color: "#e2702b" });
}

// =================== North Yard + Ridge ===================
{
  stairs("z", 15.2, 20, -40, -37, 0, 2.4, 8);
  stairs("z", 15.2, 20, 37, 40, 0, 2.4, 8);
  crate(-31, 17); crate(31, 17.5); B(-45, -43.6, 0, 2.0, 16, 18, "orange"); B(43.6, 45, 0, 2.0, 16, 18, "orange");
  const Y = 2.4;
  // relay shed (cross route)
  wallZ(29, -4, 4, Y, Y + 3, 0.3, [{ a: -1, b: 1, y0: Y, y1: Y + 2.4 }], "composite");
  wallZ(35, -4, 4, Y, Y + 3, 0.3, [{ a: -1, b: 1, y0: Y, y1: Y + 2.4 }], "composite");
  wallX(-4, 29, 35, Y, Y + 3, 0.3, [{ a: 31, b: 33, y0: Y + 1.1, y1: Y + 2.2 }], "composite");
  wallX(4, 29, 35, Y, Y + 3, 0.3, [{ a: 31, b: 33, y0: Y + 1.1, y1: Y + 2.2 }], "composite");
  B(-4.2, 4.2, Y + 3, Y + 3.3, 28.8, 35.2, "roof", { roofOf: "shed" });
  B(-3, -1.5, Y, Y + 1.0, 33, 34.6, "graphite");
  // rock outcrops interrupt the long lane
  B(-31, -23, Y, Y + 3.6, 25, 32, "rock");
  B(-29, -25, Y, Y + 5, 26, 30, "rock");
  B(21, 29, Y, Y + 3.6, 36, 43, "rock");
  B(23, 27, Y, Y + 5, 37, 41, "rock");
  lowWall(-16, -12, 27, 27.6, 1.1, Y); lowWall(12, 16, 31, 31.6, 1.1, Y);
  lowWall(-42, -38, 36, 36.6, 1.1, Y); lowWall(38, 42, 26, 26.6, 1.1, Y);
  lowWall(-8, -5, 23.5, 24.1, 1.1, Y); lowWall(5, 8, 41, 41.6, 1.1, Y);
  container(-11, -5, 40, 42.4, Y, "#d4d1c8"); container(6, 12, 24, 26.4, Y, "#d4d1c8");
  container(-36, -30, 41, 43.4, Y, "#2f6f7a"); container(30, 36, 41, 43.4, Y, "#b5562a");
  for (const [x, z] of [[-18, 40], [18, 24], [0, 42], [-48, 30], [48, 38]] as const) {
    B(x - 0.25, x + 0.25, Y, Y + 9, z - 0.25, z + 0.25, "metal", { pen: undefined });
    decor.push({ kind: "mast", pos: { x, y: Y, z }, size: 9 });
  }
  B(-46.5, -43.5, Y, Y + 1.4, 36.5, 39.5, "concrete"); decor.push({ kind: "smallDish", pos: { x: -45, y: Y + 1.4, z: 38 }, rot: 0.6 });
  B(43.5, 46.5, Y, Y + 1.4, 28.5, 31.5, "concrete"); decor.push({ kind: "smallDish", pos: { x: 45, y: Y + 1.4, z: 30 }, rot: -2.4 });
  decor.push({ kind: "sign", pos: { x: 0, y: Y + 2.6, z: 28.83 }, rot: Math.PI, text: "NORTH ARRAY · RELAY 3", color: "#2ec4d6" });
  decor.push({ kind: "beacon", pos: { x: 0, y: Y + 3.3, z: 32 } });
}

// =================== South Utility Route ===================
{
  // low pipe rack with gaps (mantle / jump over elsewhere)
  const gaps = [[-46, -44], [-30, -27], [-12, -8], [6, 10], [26, 29], [44, 46]];
  let cx = -46;
  for (const [g0, g1] of gaps) { if (g0 > cx) pipeX(cx, g0, -22.3, 0.15, 0.95); cx = g1; }
  // overhead pipes force a crouch through two of the gaps
  pipeX(-12.5, -7.5, -22.3, 1.38, 1.98); pipeX(5.5, 10.5, -22.3, 1.38, 1.98);
  for (const x of [-12.6, -7.4, 5.4, 10.6]) B(x - 0.2, x + 0.2, 0, 2.0, -22.7, -21.9, "metal", { pen: undefined });
  // tanks
  cylY(-34, -32, 2.5, 0, 4.5, "metal"); cylY(-16, -39, 2.2, 0, 4.0, "metal"); cylY(2, -31, 2.5, 0, 5.0, "metal");
  cylY(18, -39.5, 2.2, 0, 4.0, "metal"); cylY(34, -30, 2.5, 0, 4.5, "metal");
  // stacked pipe walls split the route into north/south lanes
  pipeX(-26, -6, -34.6, 0, 1.3); pipeX(-26, -6, -34.6, 1.3, 2.6);
  pipeX(9, 28, -35.6, 0, 1.3); pipeX(9, 28, -35.6, 1.3, 2.6);
  // machinery
  B(-25, -23, 0, 1.3, -28, -26.5, "orange"); B(12, 14, 0, 1.3, -27, -25.5, "orange");
  B(25, 27, 0, 1.6, -44, -42, "orange"); B(-5, -3, 0, 1.6, -45, -43, "orange");
  crate(-40, -40); crate(40, -26); crate(-8, -28); crate(22, -44);
  container(-48, -42, -45, -42.6, 0, "#2f6f7a"); container(42, 48, -32, -29.6, 0, "#b5562a");
  lowWall(-46, -42, -30, -29.4); lowWall(42, 46, -40.6, -40);
  for (const [x, z] of [[-20, -30], [8, -41], [28, -24], [-38, -45]] as const) decor.push({ kind: "steam", pos: { x, y: 0, z } });
  decor.push({ kind: "sign", pos: { x: -10, y: 2.4, z: -18.24 }, rot: Math.PI, text: "UTILITY · LOW CLEARANCE", color: "#e8a33d" });
}

export const ZONES: Zone[] = [
  { id: "ops", name: "Operations Wing", min: { x: -46, y: -1, z: -16 }, max: { x: -26, y: 10, z: 16 } },
  { id: "courtyard", name: "Dish Courtyard", min: { x: -26, y: -1, z: -18 }, max: { x: 26, y: 10, z: 20 } },
  { id: "bay", name: "Maintenance Bay", min: { x: 26, y: -1, z: -16 }, max: { x: 46, y: 10, z: 16 } },
  { id: "ridge", name: "North Ridge", min: { x: -57.5, y: 1.5, z: 20 }, max: { x: 57.5, y: 20, z: 47.5 } },
  { id: "utility", name: "South Utility", min: { x: -57.5, y: -1, z: -47.5 }, max: { x: 57.5, y: 10, z: -18 } },
  { id: "tunnel", name: "Service Tunnel", min: { x: -25, y: -4, z: -14 }, max: { x: 25, y: -0.6, z: -9 } },
  { id: "westSpawn", name: "Halyard Staging", min: { x: -57.5, y: -1, z: -18 }, max: { x: -46, y: 10, z: 20 } },
  { id: "eastSpawn", name: "Vantor Staging", min: { x: 46, y: -1, z: -18 }, max: { x: 57.5, y: 10, z: 20 } },
];

export function zoneAt(p: Vec3): Zone | null {
  // tunnel first (it sits inside courtyard bounds)
  for (const z of ZONES) {
    if (p.x >= z.min.x && p.x <= z.max.x && p.y >= z.min.y && p.y <= z.max.y && p.z >= z.min.z && p.z <= z.max.z) {
      if (z.id === "courtyard" && p.y < -0.6) continue;
      return z;
    }
  }
  return null;
}

// Spawn candidates: base pads plus neutral fallbacks used when bases are contested.
const spawnCandidates: MapDef["spawnCandidates"] = [];
for (const z of [-15, -8, -4, 0, 2.5, 11.5]) for (const x of [-55.5, -52.5]) spawnCandidates.push({ pos: { x, y: 0, z }, yaw: Math.PI / 2, side: 0 });
for (const z of [-15, -8, -4, 0, 2.5, 11.5]) for (const x of [55.5, 52.5]) spawnCandidates.push({ pos: { x, y: 0, z }, yaw: -Math.PI / 2, side: 1 });
for (const [x, z, yaw] of [
  [-42, -12.5, Math.PI / 2], [-42, 12.5, Math.PI / 2], [-30, 11.5, -Math.PI / 2], [-30, -11, -Math.PI / 2],
  [44, 12, -Math.PI / 2], [44, -12.5, -Math.PI / 2], [30, 9, Math.PI / 2], [32, -9, Math.PI / 2],
  [-44, -38, Math.PI / 2], [44, -37, -Math.PI / 2], [-30, -44, 0], [30, -45, 0],
  [-50, -30, Math.PI / 2], [50, -24, -Math.PI / 2],
] as const) spawnCandidates.push({ pos: { x, y: 0, z }, yaw, side: -1 });
for (const [x, z, yaw] of [[-50, 26, Math.PI / 2], [-40, 44, Math.PI / 2], [50, 44, -Math.PI / 2], [40, 33, -Math.PI / 2]] as const)
  spawnCandidates.push({ pos: { x, y: 2.4, z }, yaw, side: -1 });

export const K17: MapDef = {
  id: "k17",
  name: "Relay Station K-17",
  boxes,
  decor,
  zones: ZONES,
  spawnCandidates,
  teamBase: [{ x: -53, y: 0, z: 0 }, { x: 53, y: 0, z: 0 }],
  bounds: { minX: -57.5, maxX: 57.5, minZ: -47.5, maxZ: 47.5 },
};
