// South Quay district source: authored grid, road classes, zones, terrain and named anchors.
// Everything else (lots, lanes, sidewalks, meshes, colliders) is derived deterministically from this.
import { clamp01, lerp } from '../core/math';

export interface Rect { x0: number; z0: number; x1: number; z1: number }
export type RoadClass = 'arterial' | 'collector' | 'street';
export type SegKind = 'road' | 'ped' | 'none';
export type Zone = 'canal' | 'glassline' | 'lantern' | 'tide' | 'foundry' | 'breakwater';

export const ZONE_NAMES: Record<Zone, string> = {
  canal: 'Canal Loop', glassline: 'Glassline', lantern: 'Lantern Hill',
  tide: 'Tide Market', foundry: 'Foundry Row', breakwater: 'Breakwater',
};

// Extended grid lines. Index 0 and 9 are district borders (no road).
export const XE = [-450, -390, -290, -170, -70, 50, 150, 280, 390, 450];
export const ZE = [-450, -390, -300, -180, -80, 40, 150, 270, 390, 450];
const XCLS: (RoadClass | null)[] = [null, 'street', 'street', 'arterial', 'street', 'collector', 'street', 'arterial', 'street', null];
const ZCLS: (RoadClass | null)[] = [null, 'collector', 'arterial', 'street', 'collector', 'street', 'street', 'arterial', 'street', null];
export const X_NAMES = ['', 'Tollgate Lane', 'Weir Street', 'Viaduct Avenue', 'Market Street', 'Copperline Road', 'Glazier Street', 'Lantern Avenue', 'Slipway Lane', ''];
export const Z_NAMES = ['', 'Seawall Road', 'Breakwater Drive', 'Anchor Street', 'Tide Street', 'Clocktower Row', 'Ledger Street', 'Meridian Boulevard', 'Highgate Street', ''];
export const HALF_W: Record<RoadClass, number> = { arterial: 8, collector: 6, street: 4 };
export const SPEED_LIMIT: Record<RoadClass, number> = { arterial: 15, collector: 12, street: 9 };
export const hwX = (i: number) => (XCLS[i] ? HALF_W[XCLS[i]!] : 0);
export const hwZ = (j: number) => (ZCLS[j] ? HALF_W[ZCLS[j]!] : 0);

export const WORLD_HALF = 450;
export const COAST_E = 436;
export const COAST_S = -436;
export const WALL_IN = 440; // inner face of the viaduct wall on north (z) and west (-x)
export const WATER_Y = -1.0;
export const SEA_FLOOR = -4.6;
export const CURB = 0.12;
export const CANAL = { x0: -246, x1: -222, floor: -4.2, water: -3.75 };
export const HILL = { x: 300, z: 262, r: 175, h: 27 };
const RAMPS = [
  // slipways from the bank down to the service channel floor: lo end at zLo, hi end at zHi
  { x0: -222, x1: -214, zLo: -66, zHi: -22 },
  { x0: -254, x1: -246, zLo: 190, zHi: 234 },
];

const ZONE_MAP = [
  // bz = 0 (south) .. 8 (north), columns bx 0..8
  'BBBBBBBBB',
  'BBBBBBFFF',
  'CCCTTFFFF',
  'CCCTTTFFF',
  'CCCTTTFFF',
  'CCCTTTLLL',
  'CCCGGGLLL',
  'CCCGGGLLL',
  'CCCGGGLLL',
];
const ZONE_CH: Record<string, Zone> = { B: 'breakwater', C: 'canal', G: 'glassline', L: 'lantern', T: 'tide', F: 'foundry' };

export type LotType = 'bld' | 'plaza' | 'park' | 'yard' | 'docks' | 'parking' | 'canal' | 'warehouse' | 'port' | 'police'
  | 'safehouse' | 'tower' | 'garage' | 'marginN' | 'marginW' | 'quayS' | 'quayE' | 'corner';

const SPECIAL_LOTS: Record<string, LotType> = {
  '4,4': 'plaza', '3,3': 'safehouse', '4,7': 'police', '4,6': 'tower', '5,6': 'parking', '7,7': 'park',
  '7,3': 'warehouse', '3,1': 'garage', '4,1': 'port', '1,5': 'park', '6,5': 'park', '5,2': 'parking',
};

export interface Segment {
  id: number; axis: 'v' | 'h'; line: number; gap: number; kind: SegKind; cls: RoadClass; hw: number;
  rect: Rect; ax: number; az: number; bx: number; bz: number; len: number; name: string; portal: boolean; bridge: boolean;
}
export interface Intersection {
  id: number; i: number; j: number; x: number; z: number; rect: Rect;
  n: Segment | null; s: Segment | null; e: Segment | null; w: Segment | null;
  roadArms: number; signal: boolean; offset: number;
}
export interface Block { id: number; bx: number; bz: number; rect: Rect; zone: Zone; lot: LotType }

const PORTAL_N = [3, 5, 7];   // X-line indices whose road continues north through the viaduct
const PORTAL_W = [2, 4, 7];   // Z-line indices whose road continues west through the viaduct

function vsegKind(i: number, j: number): SegKind {
  if (j === 0) return 'none';
  if (j === 8) return PORTAL_N.includes(i) ? 'road' : 'none';
  if (i === 4 && j === 4) return 'ped';         // Market Street beside the plaza
  return 'road';
}
function hsegKind(i: number, j: number): SegKind {
  if (i === 8) return 'none';
  if (i === 0) return PORTAL_W.includes(j) ? 'road' : 'none';
  if (i === 2 && (j === 3 || j === 6)) return 'none'; // canal has no bridge on Anchor St / Ledger St
  if (i === 7 && j === 6) return 'ped';         // Lantern Hill stair street
  return 'road';
}

export const segments: Segment[] = [];
const vsegs: (Segment | null)[][] = [];
const hsegs: (Segment | null)[][] = [];
export const intersections: Intersection[] = [];
const interGrid: (Intersection | null)[][] = [];
export const blocks: Block[] = [];

(function build() {
  for (let i = 0; i <= 9; i++) { vsegs.push(new Array(9).fill(null)); hsegs.push(new Array(10).fill(null)); interGrid.push(new Array(10).fill(null)); }
  for (let i = 1; i <= 8; i++) for (let j = 0; j <= 8; j++) {
    const kind = vsegKind(i, j);
    const cls = XCLS[i]!; const hw = HALF_W[cls];
    const z0 = ZE[j] + hwZ(j), z1 = j === 8 ? 450 : ZE[j + 1] - hwZ(j + 1);
    const s: Segment = {
      id: segments.length, axis: 'v', line: i, gap: j, kind, cls, hw,
      rect: { x0: XE[i] - hw, x1: XE[i] + hw, z0, z1 }, ax: XE[i], az: z0, bx: XE[i], bz: z1, len: z1 - z0,
      name: X_NAMES[i], portal: j === 8 && kind === 'road', bridge: false,
    };
    segments.push(s); vsegs[i][j] = s;
  }
  for (let j = 1; j <= 8; j++) for (let i = 0; i <= 8; i++) {
    const kind = hsegKind(i, j);
    const cls = ZCLS[j]!; const hw = HALF_W[cls];
    const x0 = i === 0 ? -450 : XE[i] + hwX(i), x1 = XE[i + 1] - hwX(i + 1);
    const s: Segment = {
      id: segments.length, axis: 'h', line: j, gap: i, kind, cls, hw,
      rect: { x0, x1, z0: ZE[j] - hw, z1: ZE[j] + hw }, ax: x0, az: ZE[j], bx: x1, bz: ZE[j], len: x1 - x0,
      name: Z_NAMES[j], portal: i === 0 && kind === 'road', bridge: i === 2 && kind === 'road',
    };
    segments.push(s); hsegs[i][j] = s;
  }
  for (let i = 1; i <= 8; i++) for (let j = 1; j <= 8; j++) {
    const road = (s: Segment | null) => (s && s.kind === 'road' ? s : null);
    const n = road(vsegs[i][j]), s = road(vsegs[i][j - 1]), e = road(hsegs[i][j]), w = road(hsegs[i - 1][j]);
    const roadArms = [n, s, e, w].filter(Boolean).length;
    const major = XCLS[i] !== 'street' || ZCLS[j] !== 'street';
    const it: Intersection = {
      id: intersections.length, i, j, x: XE[i], z: ZE[j],
      rect: { x0: XE[i] - hwX(i), x1: XE[i] + hwX(i), z0: ZE[j] - hwZ(j), z1: ZE[j] + hwZ(j) },
      n, s, e, w, roadArms, signal: roadArms >= 3 && major && XCLS[i] !== 'street' && ZCLS[j] !== 'street',
      offset: (i * 7 + j * 13) % 24,
    };
    intersections.push(it); interGrid[i][j] = it;
  }
  for (let bx = 0; bx <= 8; bx++) for (let bz = 0; bz <= 8; bz++) {
    const rect: Rect = { x0: XE[bx] + hwX(bx), x1: XE[bx + 1] - hwX(bx + 1), z0: ZE[bz] + hwZ(bz), z1: ZE[bz + 1] - hwZ(bz + 1) };
    const zone = ZONE_CH[ZONE_MAP[bz][bx]];
    let lot: LotType = SPECIAL_LOTS[`${bx},${bz}`] ?? 'bld';
    if (lot === 'bld') {
      const edgeX = bx === 0 || bx === 8, edgeZ = bz === 0 || bz === 8;
      if (edgeX && edgeZ) lot = 'corner';
      else if (bx === 2) lot = 'canal';
      else if (bz === 8) lot = 'marginN';
      else if (bx === 0) lot = 'marginW';
      else if (bz === 0) lot = 'quayS';
      else if (bx === 8) lot = 'quayE';
      else if (zone === 'foundry') lot = 'yard';
      else if (zone === 'breakwater') lot = 'docks';
    }
    blocks.push({ id: blocks.length, bx, bz, rect, zone, lot });
  }
})();

export const getVSeg = (i: number, j: number) => (i >= 1 && i <= 8 && j >= 0 && j <= 8 ? vsegs[i][j] : null);
export const getHSeg = (i: number, j: number) => (j >= 1 && j <= 8 && i >= 0 && i <= 8 ? hsegs[i][j] : null);
export const getIntersection = (i: number, j: number) => (i >= 1 && i <= 8 && j >= 1 && j <= 8 ? interGrid[i][j] : null);
export const getBlock = (bx: number, bz: number) => blocks[bx * 9 + bz];

function gapIndex(arr: number[], v: number): number {
  for (let k = 0; k < 9; k++) if (v < arr[k + 1]) return k;
  return 8;
}
export type AreaKind = 'road' | 'intersection' | 'ped' | 'lotstrip' | 'block' | 'sea' | 'outside';
export interface AreaInfo { kind: AreaKind; bx: number; bz: number; seg: Segment | null; inter: Intersection | null }
const _area: AreaInfo = { kind: 'block', bx: 0, bz: 0, seg: null, inter: null };

/** Classify a ground position. Returns a shared object (copy fields if you keep them). */
export function areaAt(x: number, z: number): AreaInfo {
  const a = _area; a.seg = null; a.inter = null;
  if (x > COAST_E || z < COAST_S) { a.kind = 'sea'; a.bx = a.bz = -1; return a; }
  if (x < -450 || z > 450) { a.kind = 'outside'; a.bx = a.bz = -1; return a; }
  const gx = gapIndex(XE, x), gz = gapIndex(ZE, z);
  a.bx = gx; a.bz = gz;
  let onX = -1, onZ = -1;
  if (gx >= 1 && x - XE[gx] <= hwX(gx)) onX = gx; else if (gx + 1 <= 8 && XE[gx + 1] - x <= hwX(gx + 1)) onX = gx + 1;
  if (gz >= 1 && z - ZE[gz] <= hwZ(gz)) onZ = gz; else if (gz + 1 <= 8 && ZE[gz + 1] - z <= hwZ(gz + 1)) onZ = gz + 1;
  if (onX >= 0 && onZ >= 0) { a.kind = 'intersection'; a.inter = interGrid[onX][onZ]; return a; }
  if (onX >= 0) { const s = vsegs[onX][gz]!; a.seg = s; a.kind = s.kind === 'road' ? 'road' : s.kind === 'ped' ? 'ped' : 'lotstrip'; return a; }
  if (onZ >= 0) { const s = hsegs[gx][onZ]!; a.seg = s; a.kind = s.kind === 'road' ? 'road' : s.kind === 'ped' ? 'ped' : 'lotstrip'; return a; }
  a.kind = 'block';
  return a;
}

export function hillHeight(x: number, z: number): number {
  const d = Math.hypot(x - HILL.x, z - HILL.z);
  const t = clamp01(1 - d / HILL.r);
  return HILL.h * t * t * (3 - 2 * t);
}
export const inCanal = (x: number, z: number) => x >= CANAL.x0 && x <= CANAL.x1 && z > COAST_S;

/** Physics/visual terrain height (does not include bridge decks). */
export function terrainH(x: number, z: number): number {
  if (x > COAST_E || z < COAST_S) return SEA_FLOOR;
  if (x >= CANAL.x0 && x <= CANAL.x1) return CANAL.floor;
  for (const r of RAMPS) {
    if (x >= r.x0 && x <= r.x1 && z >= r.zLo && z <= r.zHi) {
      const t = (z - r.zLo) / (r.zHi - r.zLo);
      return r === RAMPS[0] ? lerp(CANAL.floor, CURB, t) : lerp(CANAL.floor, CURB, t);
    }
  }
  const h = hillHeight(x, z);
  const k = areaAt(x, z).kind;
  return k === 'road' || k === 'intersection' ? h : h + CURB;
}

export interface Deck { rect: Rect; y: number; seg: Segment }
/** Bridge decks over the canal (static cuboids + their own meshes; the channel continues underneath). */
export const decks: Deck[] = segments.filter((s) => s.bridge).map((s) => ({
  seg: s, y: 0, rect: { x0: CANAL.x0 - 2, x1: CANAL.x1 + 2, z0: s.rect.z0 - 4, z1: s.rect.z1 + 4 },
}));
export function deckAt(x: number, z: number): Deck | null {
  if (x < CANAL.x0 - 2 || x > CANAL.x1 + 2) return null;
  for (const d of decks) if (z >= d.rect.z0 && z <= d.rect.z1) return d;
  return null;
}
/** Top walkable surface, including bridge decks. Used by kinematic agents. */
export function surfaceY(x: number, z: number): number {
  const d = deckAt(x, z);
  if (d) return z >= d.seg.rect.z0 && z <= d.seg.rect.z1 ? d.y : d.y + CURB;
  return terrainH(x, z);
}
export function waterDepthAt(x: number, z: number): number {
  if (x > COAST_E || z < COAST_S) return WATER_Y - SEA_FLOOR;
  if (inCanal(x, z)) return CANAL.water - CANAL.floor;
  return 0;
}
export function zoneAt(x: number, z: number): Zone {
  const gx = Math.min(8, Math.max(0, gapIndex(XE, x))), gz = Math.min(8, Math.max(0, gapIndex(ZE, z)));
  return ZONE_CH[ZONE_MAP[gz][gx]];
}
export function streetNameAt(x: number, z: number): string {
  const a = areaAt(x, z);
  if (a.seg) return a.seg.name;
  if (a.inter) return `${X_NAMES[a.inter.i]} & ${Z_NAMES[a.inter.j]}`;
  return ZONE_NAMES[zoneAt(x, z)];
}

export interface Anchor { x: number; z: number; yaw?: number; label: string }
/** Named gameplay anchors. Missions, shops and spawns reference these ids only. */
export const ANCHORS = {
  safehouse: { x: -118, z: -88, yaw: 0, label: 'Safehouse — Tide Street' },
  bikeSpot: { x: -106, z: -84.6, yaw: Math.PI / 2, label: 'Courier bay' },
  depot: { x: -96, z: -88, label: 'Kestrel Couriers depot' },
  marketPickup: { x: -40, z: -68, label: 'Tide Market — Saltline Stall' },
  marketPark: { x: -40, z: -75.8, yaw: -Math.PI / 2, label: 'Tide Market loading bay' },
  glassDrop: { x: -11, z: 259.5, label: 'Meridian Exchange lobby' },
  glassPark: { x: -11, z: 264, yaw: Math.PI / 2, label: 'Exchange drop-off bay' },
  quayMart: { x: 62, z: -72, label: 'Quay Mart' },
  clothing: { x: 22, z: 12, label: 'Thread & Tide kiosk' },
  supply: { x: 160, z: -88, label: 'Harbor Supply' },
  garage: { x: -118, z: -334, yaw: Math.PI, label: 'Breakwater Auto & Marine' },
  precinct: { x: -10, z: 280, yaw: Math.PI, label: 'Glassline Substation' },
  policeYard: { x: 14, z: 300, yaw: Math.PI, label: 'Substation yard' },
  odalys: { x: 205, z: -88, label: 'Dockhands Union Hall' },
  viewpoint: { x: 336, z: 330, label: 'Lantern Hill viewpoint' },
  clockTower: { x: -11, z: 14, label: 'Tide Market clock tower' },
  warehouseFront: { x: 337, z: -88, label: 'Foundry warehouse — front gate' },
  warehouseSide: { x: 384, z: -131, label: 'Foundry warehouse — side door' },
  portGate: { x: -11, z: -310, label: 'Port Control gate' },
  canalBridge: { x: -232, z: -72, label: 'Tide Street bridge' },
  circuitStart: { x: 166, z: -304, yaw: Math.PI / 2, label: 'Street Circuit grid' },
} satisfies Record<string, Anchor>;
export type AnchorId = keyof typeof ANCHORS;

export const rectW = (r: Rect) => r.x1 - r.x0;
export const rectD = (r: Rect) => r.z1 - r.z0;
export const rectCx = (r: Rect) => (r.x0 + r.x1) / 2;
export const rectCz = (r: Rect) => (r.z0 + r.z1) / 2;
export const inRect = (r: Rect, x: number, z: number, pad = 0) => x >= r.x0 - pad && x <= r.x1 + pad && z >= r.z0 - pad && z <= r.z1 + pad;
export const insetRect = (r: Rect, d: number): Rect => ({ x0: r.x0 + d, z0: r.z0 + d, x1: r.x1 - d, z1: r.z1 - d });
