// Authored source data for Galeport: terrain, road grid, destinations, shortcuts and ramps.
// Everything here is original to Farestorm. Units are metres; +x is east, +z is north, +y is up.
import { smooth, lerp, distToSeg } from '../core/math';

export const WORLD_VERSION = 3;
export const WORLD_W = 1400;
export const WORLD_D = 1000;
export const CELL = 4;
export const NX = WORLD_W / CELL; // cells along x
export const NZ = WORLD_D / CELL; // cells along z

export const COLS = [70, 210, 350, 490, 630, 770, 910, 1050, 1190, 1330];
export const ROWS = [150, 270, 390, 510, 630, 750, 870];
export const CANAL_Z = 440;
export const CANAL_X0 = 872;

export type Surface = 'asphalt' | 'paving' | 'cobble' | 'grass' | 'sand' | 'deck' | 'dirt' | 'water';
export interface SurfaceInfo {
  grip: number;
  drag: number; // extra rolling deceleration m/s^2 at speed
  style: boolean; // eligible for drift/clean-sector scoring
  code: number;
}
export const SURFACES: Record<Surface, SurfaceInfo> = {
  asphalt: { grip: 1.0, drag: 0, style: true, code: 0 },
  paving: { grip: 0.97, drag: 0.1, style: true, code: 1 },
  cobble: { grip: 0.9, drag: 0.35, style: true, code: 2 },
  grass: { grip: 0.72, drag: 2.2, style: false, code: 3 },
  sand: { grip: 0.62, drag: 3.2, style: false, code: 4 },
  deck: { grip: 0.88, drag: 0.15, style: true, code: 5 },
  dirt: { grip: 0.8, drag: 0.8, style: true, code: 6 },
  water: { grip: 0.45, drag: 7.5, style: false, code: 7 },
};
export const SURFACE_BY_CODE: Surface[] = ['asphalt', 'paving', 'cobble', 'grass', 'sand', 'deck', 'dirt', 'water'];

export type District = 'harbor' | 'beach' | 'oldsteps' | 'civic' | 'lantern' | 'highline';
export const DISTRICT_NAMES: Record<District, string> = {
  harbor: 'Harbor Loop',
  beach: 'Sunward Beach',
  oldsteps: 'Old Steps',
  civic: 'Civic Crown',
  lantern: 'Lantern Ward',
  highline: 'Highline',
};
export function districtAt(x: number, z: number): District {
  if (z < 215) return x < 800 ? 'harbor' : 'beach';
  if (x < 560 && z < 690) return 'oldsteps';
  if (x >= 840 && z < 580) return 'lantern';
  if (x >= 840) return 'highline';
  return 'civic';
}

/** Analytic terrain. Sampled once into the heightfield grid; never called at runtime by gameplay. */
export function terrainFn(x: number, z: number): number {
  const sz = smooth(190, 800, z);
  const wx = 1 - 0.86 * smooth(760, 1010, x);
  let h = 3 + 39 * sz * wx;
  // Old Steps: an extra steep terrace band on the western slope.
  h += 9 * smooth(395, 505, z) * (1 - smooth(430, 570, x));
  // Gentle rolling crests so fast avenues produce airtime.
  h += 1.1 * Math.sin(x * 0.021 + 1.3) * Math.sin(z * 0.017 + 0.4) * sz;
  if (z < 150) {
    const beachT = smooth(790, 860, x);
    let harbor = 3;
    if (z < 100) {
      const onPier = z > 34 && ((x > 380 && x < 536) || (x > 560 && x < 690));
      harbor = onPier ? 3 : lerp(3, -5, smooth(100, 93, z));
    }
    const beach = z >= 140 ? 3 : Math.max(-3.5, 3 - (140 - z) * 0.052);
    h = lerp(harbor, beach, beachT);
  }
  // Lantern Ward canal.
  if (x > CANAL_X0 - 12) {
    const [d] = distToSeg(x, z, CANAL_X0, CANAL_Z, WORLD_W + 20, CANAL_Z);
    if (d < 7.5) h = lerp(-1.8, h, smooth(3.4, 7.2, d));
  }
  // World rim: steep rock walls on the three landward sides.
  const rim = Math.max(smooth(26, 8, x), smooth(WORLD_W - 26, WORLD_W - 8, x), smooth(WORLD_D - 26, WORLD_D - 8, z));
  h += 36 * rim;
  return h;
}

export type RoadClass = 'boulevard' | 'street' | 'narrow' | 'highline' | 'bridge' | 'ramp';
export interface RoadClassInfo {
  hw: number; // half width of drivable asphalt
  laneOffsets: number[]; // lane centre offsets from the centreline, per direction
  speed: number; // traffic cruise m/s
  surface: Surface;
  oncoming: boolean; // oncoming-lane style scoring allowed
  structure: boolean;
}
export const ROAD_CLASSES: Record<RoadClass, RoadClassInfo> = {
  boulevard: { hw: 11, laneOffsets: [2.7, 7.3], speed: 16, surface: 'asphalt', oncoming: true, structure: false },
  street: { hw: 7, laneOffsets: [2.5], speed: 12.5, surface: 'asphalt', oncoming: false, structure: false },
  narrow: { hw: 5.4, laneOffsets: [2.3], speed: 9, surface: 'cobble', oncoming: false, structure: false },
  highline: { hw: 9.5, laneOffsets: [2.5, 6.7], speed: 23, surface: 'asphalt', oncoming: true, structure: true },
  bridge: { hw: 7, laneOffsets: [2.5], speed: 12, surface: 'asphalt', oncoming: false, structure: true },
  ramp: { hw: 5.6, laneOffsets: [2.5], speed: 12, surface: 'asphalt', oncoming: false, structure: true },
};

/** Grid edges removed from the legal road network. 'v r c' = edge (r,c)->(r+1,c); 'h r c' = (r,c)->(r,c+1). */
export const REMOVED_EDGES = new Set(['v 2 1', 'v 3 2', 'v 2 3', 'v 2 7', 'h 2 4']);
export const CANAL_BRIDGE_COLS = [6, 8, 9];

export function gridClass(kind: 'h' | 'v', r: number, c: number): RoadClass {
  if (kind === 'h') {
    if (r === 0) return 'boulevard';
    if (r === 3 && c >= 5) return 'boulevard';
    if (r >= 2 && r <= 4 && c <= 2) return 'narrow';
    return 'street';
  }
  if (c === 5 && r < 5) return 'boulevard';
  if (r >= 2 && r <= 3 && c >= 1 && c <= 3) return 'narrow';
  return 'street';
}

/** Highline control points [x, z, deckY]; first and last are snapped to the terrain. */
export const HIGHLINE_PTS: [number, number, number][] = [
  [770, 750, 41],
  [850, 800, 38.6],
  [980, 812, 33.2],
  [1100, 790, 27.5],
  [1195, 722, 22],
  [1250, 625, 17.4],
  [1268, 520, 14.2],
  [1266, 400, 11.6],
  [1262, 285, 9.8],
  [1266, 205, 3.4],
  [1268, 150, 3],
];
export const HIGHLINE_OFFRAMP_FROM: [number, number] = [1250, 625];

export type LandmarkKind =
  | 'ferry' | 'crane' | 'canopy' | 'lighthouse' | 'tower' | 'clock' | 'arch' | 'dome'
  | 'wheel' | 'hotel' | 'umbrella' | 'sphere' | 'pagoda' | 'windmill' | 'bowl' | 'obelisk' | 'mast';

export interface SiteDef {
  name: string;
  kind: LandmarkKind;
  x: number;
  z: number;
  hue: number; // 0..360 accent colour
  r: number; // landmark footprint radius
}
/** The 32 destinations of Galeport (also used as pickup stands). */
export const SITE_DEFS: SiteDef[] = [
  // Harbor Loop
  { name: 'Gullwing Ferry Terminal', kind: 'ferry', x: 700, z: 120, hue: 190, r: 11 },
  { name: 'Brinecrate Yard', kind: 'crane', x: 420, z: 120, hue: 28, r: 9 },
  { name: 'Saltline Fish Market', kind: 'canopy', x: 280, z: 185, hue: 168, r: 11 },
  { name: 'Harbor Light', kind: 'lighthouse', x: 140, z: 115, hue: 5, r: 7 },
  { name: 'Rope & Anchor Inn', kind: 'tower', x: 280, z: 292, hue: 215, r: 9 },
  { name: 'Customs Clock', kind: 'clock', x: 512, z: 210, hue: 45, r: 8 },
  { name: 'Drydock Nine', kind: 'arch', x: 560, z: 248, hue: 200, r: 10 },
  { name: "Netmenders' Hall", kind: 'dome', x: 92, z: 212, hue: 150, r: 11 },
  // Sunward Beach
  { name: 'Sunward Wheel', kind: 'wheel', x: 980, z: 115, hue: 330, r: 12 },
  { name: 'Hotel Meridian', kind: 'hotel', x: 1120, z: 186, hue: 18, r: 13 },
  { name: 'Coral Lido', kind: 'umbrella', x: 1222, z: 118, hue: 350, r: 11 },
  { name: 'Boardwalk Bandstand', kind: 'dome', x: 840, z: 118, hue: 48, r: 9 },
  { name: 'Surfbreak Hostel', kind: 'tower', x: 980, z: 292, hue: 172, r: 9 },
  { name: 'Tidepool Aquarium', kind: 'sphere', x: 1168, z: 212, hue: 195, r: 11 },
  // Old Steps
  { name: 'Stairhead Chapel', kind: 'clock', x: 280, z: 412, hue: 265, r: 8 },
  { name: 'Lemon Terrace Cafe', kind: 'canopy', x: 140, z: 532, hue: 55, r: 10 },
  { name: 'Tinsmith Row', kind: 'arch', x: 420, z: 488, hue: 30, r: 9 },
  { name: 'Old Steps Funicular', kind: 'pagoda', x: 92, z: 452, hue: 0, r: 9 },
  { name: 'Weathervane Works', kind: 'windmill', x: 280, z: 652, hue: 205, r: 9 },
  { name: 'Marigold Baths', kind: 'dome', x: 420, z: 608, hue: 38, r: 11 },
  // Civic Crown
  { name: 'Crown Museum', kind: 'dome', x: 700, z: 892, hue: 280, r: 16 },
  { name: 'Galeport Stadium', kind: 'bowl', x: 842, z: 720, hue: 12, r: 24 },
  { name: 'Civic Hall', kind: 'clock', x: 560, z: 772, hue: 190, r: 11 },
  { name: 'Crown Plaza Fountain', kind: 'obelisk', x: 700, z: 772, hue: 180, r: 8 },
  { name: 'Observatory Hill', kind: 'sphere', x: 350, z: 892, hue: 235, r: 12 },
  { name: 'Skyline Library', kind: 'tower', x: 652, z: 690, hue: 100, r: 10 },
  { name: 'Windmill Commons', kind: 'windmill', x: 512, z: 684, hue: 345, r: 9 },
  // Lantern Ward
  { name: 'Lantern Gate', kind: 'pagoda', x: 980, z: 368, hue: 352, r: 10 },
  { name: 'Paper Moon Theatre', kind: 'dome', x: 1120, z: 532, hue: 305, r: 12 },
  { name: 'Night Noodle Arcade', kind: 'canopy', x: 980, z: 532, hue: 320, r: 10 },
  // Highline
  { name: 'Highline Exchange', kind: 'hotel', x: 1120, z: 652, hue: 210, r: 13 },
  { name: 'Radio Galeport', kind: 'mast', x: 1352, z: 700, hue: 8, r: 8 },
];

export type ShortcutKind = 'stairs' | 'alley' | 'jump' | 'quay' | 'boardwalk' | 'tunnel' | 'arcade' | 'plaza' | 'garage' | 'park' | 'tramcut' | 'drop' | 'yard';
export interface ShortcutDef {
  id: string;
  name: string;
  kind: ShortcutKind;
  a: [number, number];
  b: [number, number];
  width: number;
  surface: Surface;
  oneWay?: boolean;
  /** Optional explicit heights for entry/exit volumes (elevated structures). */
  ya?: number;
  yb?: number;
  /** Snap corridor ends to grid nodes [r, c]. */
  nodeA?: [number, number];
  nodeB?: [number, number];
  /** Do not carve/paint a corridor (entry/exit only). */
  noCorridor?: boolean;
}
/** The 18 authored shortcuts. Corridors carve buildings out of the way and paint their own ground. */
export const SHORTCUT_DEFS: ShortcutDef[] = [
  { id: 'gullwing-stairs', name: 'Gullwing Stairs', kind: 'stairs', a: [210, 390], b: [210, 510], nodeA: [2, 1], nodeB: [3, 1], width: 8, surface: 'cobble' },
  { id: 'fishwife-stairs', name: 'Fishwife Stairs', kind: 'stairs', a: [350, 510], b: [350, 630], nodeA: [3, 2], nodeB: [4, 2], width: 8, surface: 'cobble' },
  { id: 'chandler-stairs', name: "Chandler's Stairs", kind: 'stairs', a: [490, 390], b: [490, 510], nodeA: [2, 3], nodeB: [3, 3], width: 8, surface: 'cobble' },
  { id: 'saltcrate-alley', name: 'Saltcrate Alley', kind: 'alley', a: [232, 172], b: [328, 248], width: 9, surface: 'paving' },
  { id: 'netmender-alley', name: 'Netmender Alley', kind: 'alley', a: [608, 172], b: [512, 248], width: 9, surface: 'paving' },
  { id: 'ferry-leap', name: 'Ferry Leap', kind: 'jump', a: [420, 70], b: [664, 70], width: 10, surface: 'paving' },
  { id: 'seawall-kicker', name: 'Seawall Kicker', kind: 'quay', a: [108, 110], b: [342, 110], width: 9, surface: 'paving' },
  { id: 'boardwalk-run', name: 'Boardwalk Run', kind: 'boardwalk', a: [806, 101], b: [1300, 101], width: 10, surface: 'deck' },
  { id: 'drainpipe-tunnel', name: 'Drainpipe Tunnel', kind: 'tunnel', a: [1066, 170], b: [1174, 250], width: 9, surface: 'paving' },
  { id: 'lantern-arcade', name: 'Lantern Arcade', kind: 'arcade', a: [1068, 528], b: [1172, 612], width: 9, surface: 'paving' },
  { id: 'canal-hop', name: 'Canal Hop', kind: 'jump', a: [1050, 392], b: [1050, 508], nodeA: [2, 7], nodeB: [3, 7], width: 10, surface: 'asphalt' },
  { id: 'neon-alley', name: 'Neon Alley', kind: 'alley', a: [928, 290], b: [1032, 370], width: 9, surface: 'paving' },
  { id: 'crown-plaza-cut', name: 'Crown Plaza Cut', kind: 'plaza', a: [648, 768], b: [752, 852], width: 12, surface: 'paving' },
  { id: 'garage-drop', name: 'Garage Drop', kind: 'garage', a: [786, 570], b: [1036, 570], width: 11, surface: 'paving', oneWay: true },
  { id: 'terrace-greens', name: 'Terrace Greens', kind: 'park', a: [648, 290], b: [752, 490], width: 9, surface: 'dirt' },
  { id: 'tramline-cut', name: 'Tramline Cut', kind: 'tramcut', a: [368, 648], b: [472, 732], width: 8, surface: 'deck' },
  { id: 'highline-drop', name: 'Highline Drop', kind: 'drop', a: [1267, 548], b: [1214, 510], width: 10, surface: 'asphalt', oneWay: true, ya: 15, noCorridor: true },
  { id: 'girder-yard', name: 'Girder Yard', kind: 'yard', a: [1068, 768], b: [1172, 852], width: 10, surface: 'dirt' },
];

export interface RampDef {
  x: number;
  z: number;
  yaw: number; // direction of ascent: (sin yaw, cos yaw)
  len: number;
  width: number;
  h: number;
  twoWay: boolean; // triangular prism ("kicker") instead of a wedge
}
const E = Math.PI / 2, W = -Math.PI / 2, N = 0, S = Math.PI;
export const RAMP_DEFS: RampDef[] = [
  { x: 523, z: 70, yaw: E, len: 14, width: 9, h: 2.9, twoWay: false }, // Ferry Leap west pier
  { x: 573, z: 70, yaw: W, len: 14, width: 9, h: 2.9, twoWay: false }, // Ferry Leap east pier
  { x: 225, z: 110, yaw: E, len: 18, width: 8, h: 1.7, twoWay: true }, // Seawall Kicker
  { x: 1050, z: 425.2, yaw: N, len: 12, width: 8.5, h: 2.6, twoWay: false }, // Canal Hop south bank
  { x: 1050, z: 454.8, yaw: S, len: 12, width: 8.5, h: 2.6, twoWay: false }, // Canal Hop north bank
  { x: 1050, z: 101, yaw: E, len: 16, width: 8, h: 1.4, twoWay: true }, // Boardwalk hump
  { x: 1120, z: 810, yaw: Math.atan2(104, 84), len: 16, width: 8, h: 1.5, twoWay: true }, // Girder Yard
];

/** Garage Drop: a sloped parking deck that launches cars from Crown Avenue down to the next street. */
export const GARAGE_DECK = { x0: 780, x1: 874, z: 570, hw: 6.5, drop: 4.5 };

/** Spawn hubs: [x, z] approximate, snapped to the nearest lane. */
export const HUB_DEFS: { name: string; x: number; z: number }[] = [
  { name: 'Harbor Rank', x: 385, z: 150 },
  { name: 'Crown Rank', x: 585, z: 750 },
  { name: 'Lido Rank', x: 1085, z: 150 },
];

export const PLAZA_RECT = { x0: 645, x1: 755, z0: 765, z1: 855 };
