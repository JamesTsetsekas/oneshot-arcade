// Deterministic lot generation: buildings, static parts (walls, props, landmarks), dynamic props,
// lamps, parking spots, CCTV cameras and mission compound anchors for South Quay.
import { Rng } from '../core/math';
import {
  blocks, Block, Rect, Zone, terrainH, ANCHORS, CANAL, decks, segments, XE, ZE, hwX, hwZ, WALL_IN, COAST_E, COAST_S,
  insetRect, rectW, rectD, rectCx, rectCz, getHSeg, intersections, CURB, hillHeight,
} from './district';
import { landRect } from './roads';

export type Shape = 'box' | 'cyl' | 'ball' | 'cone' | 'prism';
export interface Part {
  shape: Shape; x: number; y: number; z: number; hx: number; hy: number; hz: number; yaw: number;
  color: number; collide: boolean; glow: 0 | 1 | 2; // glow 1 = lit at night, 2 = always lit
}
export interface Building {
  id: number; x0: number; z0: number; x1: number; z1: number; base: number; top: number;
  style: number; tint: number; roof: number; zone: Zone; stacked: boolean; shop: boolean; tag: string;
}
export type DynKind = 'bin' | 'cone' | 'crate' | 'barrier';
export interface DynProp { kind: DynKind; x: number; z: number; yaw: number }
export interface Lamp { x: number; y: number; z: number; color: number; r: number }
export interface ParkSpot { id: number; x: number; z: number; yaw: number; lot: boolean; reserved: boolean }
export interface CameraDef { id: string; x: number; y: number; z: number; yaw: number; sweep: number; fov: number; range: number; group: string }

export const STYLE = { deco: 0, glass: 1, brick: 2, stucco: 3, market: 4, concrete: 5, shed: 6, civic: 7 } as const;

export const buildings: Building[] = [];
export const parts: Part[] = [];
export const dynProps: DynProp[] = [];
export const lamps: Lamp[] = [];
export const parkSpots: ParkSpot[] = [];
export const cameras: CameraDef[] = [];
/** Where stall vendors stand and where customers browse (x, z, facing yaw). */
export const vendorSpots: { x: number; z: number; yaw: number }[] = [];
export const browseSpots: { x: number; z: number; yaw: number }[] = [];
/** Invisible blockers (tunnel ends, world bounds). */
export const blockers: { x: number; y: number; z: number; hx: number; hy: number; hz: number }[] = [];

const PAL = {
  stone: [0xe8dcc4, 0xd9c7a8, 0xf0e6d2, 0xcdb89a, 0xe3d3b8],
  stucco: [0xe9a57a, 0xf2c779, 0x8fc1c9, 0xf3ead8, 0xd98570, 0xa9c79a, 0xf0b9a0],
  glass: [0x8fc4d4, 0x78aec2, 0xa3d2cc, 0x6d9db5, 0xb4d8de],
  brick: [0xb5644a, 0x9c5440, 0xc27752, 0x8d6654],
  shed: [0x8a9aa3, 0x9fb0a4, 0xb0a48a, 0x6f8591],
  concrete: [0xc5c8c4, 0xb1b5b2, 0xd6d4cc],
  container: [0xc8553d, 0x2f6f8f, 0xe0a030, 0x3f8f6a, 0x8a8f94, 0xb04a6a, 0xe8e2d0],
  awning: [0xd9482b, 0x1f7a8c, 0xf2b134, 0x2a9d6f, 0xe8e2d0, 0xc2456e],
  copper: 0x56b09a, foliage: [0x4f9a54, 0x5fae5a, 0x3f8650, 0x78b85c], trunk: 0x6b4a33,
  metal: 0x555c63, dark: 0x2c3036, wallStone: 0xcbb99a, neon: [0xff4f7a, 0x35e0d0, 0xffc94a, 0x7c8cff, 0xff8a3c],
};
const FLOOR = 3.4;

function P(shape: Shape, x: number, y: number, z: number, hx: number, hy: number, hz: number, color: number, collide = false, yaw = 0, glow: 0 | 1 | 2 = 0): Part {
  const p: Part = { shape, x, y, z, hx, hy, hz, yaw, color, collide, glow };
  parts.push(p); return p;
}
const gy = (x: number, z: number) => terrainH(x, z);
function groundRange(x0: number, z0: number, x1: number, z1: number): [number, number] {
  let lo = Infinity, hi = -Infinity;
  for (const [x, z] of [[x0, z0], [x1, z0], [x1, z1], [x0, z1], [(x0 + x1) / 2, (z0 + z1) / 2]]) {
    const h = terrainH(x, z); lo = Math.min(lo, h); hi = Math.max(hi, h);
  }
  return [lo, hi];
}
function addBuilding(x0: number, z0: number, x1: number, z1: number, h: number, style: number, tint: number, zone: Zone, opt: Partial<Building> = {}): Building {
  const [lo, hi] = groundRange(x0, z0, x1, z1);
  const b: Building = { id: buildings.length, x0, z0, x1, z1, base: lo - 0.6, top: hi + h, style, tint, roof: 0x8f8a80, zone, stacked: false, shop: false, tag: '', ...opt };
  buildings.push(b); return b;
}
function stack(b: Building, inset: number, h: number, style = b.style, tint = b.tint): Building {
  const s: Building = { ...b, id: buildings.length, x0: b.x0 + inset, z0: b.z0 + inset, x1: b.x1 - inset, z1: b.z1 - inset, base: b.top, top: b.top + h, stacked: true, style, tint, shop: false, tag: '' };
  buildings.push(s); return s;
}

// ------------------------------------------------------------------ prop emitters
function tree(x: number, z: number, s = 1, rng?: Rng) {
  const y = gy(x, z);
  P('cyl', x, y + 1.3 * s, z, 0.18 * s, 1.3 * s, 0.18 * s, PAL.trunk, true);
  const c = PAL.foliage[rng ? rng.int(0, 3) : 0];
  P('ball', x, y + 3.5 * s, z, 1.7 * s, 1.5 * s, 1.7 * s, c);
  P('ball', x + 0.5 * s, y + 4.6 * s, z - 0.3 * s, 1.1 * s, 1.0 * s, 1.1 * s, PAL.foliage[rng ? rng.int(0, 3) : 1]);
}
function palm(x: number, z: number) {
  const y = gy(x, z);
  P('cyl', x, y + 3, z, 0.16, 3, 0.16, 0x8a6f4d, true);
  for (let k = 0; k < 5; k++) { const a = k * 1.256; P('box', x + Math.sin(a) * 1.1, y + 6.0, z + Math.cos(a) * 1.1, 0.28, 0.07, 1.2, 0x4f9a54, false, a); }
}
function lampPost(x: number, z: number, yaw: number, color = 0xffd9a0) {
  const y = gy(x, z);
  P('cyl', x, y + 3, z, 0.09, 3, 0.09, PAL.metal, true);
  const hx = x + Math.sin(yaw) * 1.1, hz = z + Math.cos(yaw) * 1.1;
  P('box', x + Math.sin(yaw) * 0.55, y + 6.0, z + Math.cos(yaw) * 0.55, 0.07, 0.06, 0.65, PAL.metal, false, yaw);
  P('box', hx, y + 5.9, hz, 0.22, 0.07, 0.35, 0xfff1cf, false, yaw, 1);
  lamps.push({ x: hx, y: y + 5.8, z: hz, color, r: 9 });
}
function bench(x: number, z: number, yaw: number) {
  const y = gy(x, z);
  P('box', x, y + 0.42, z, 0.9, 0.05, 0.25, 0x8a5a3a, true, yaw);
  P('box', x - Math.sin(yaw) * 0.25, y + 0.75, z - Math.cos(yaw) * 0.25, 0.9, 0.28, 0.04, 0x8a5a3a, false, yaw);
  P('box', x, y + 0.2, z, 0.8, 0.2, 0.05, PAL.dark, false, yaw);
}
function stall(x: number, z: number, yaw: number, color: number) {
  const y = gy(x, z);
  vendorSpots.push({ x: x - Math.sin(yaw) * 1.3, z: z - Math.cos(yaw) * 1.3, yaw });
  browseSpots.push({ x: x + Math.sin(yaw) * 1.5, z: z + Math.cos(yaw) * 1.5, yaw: yaw + Math.PI });
  P('box', x, y + 0.5, z, 1.5, 0.5, 0.7, 0xb08a5a, true, yaw);
  P('box', x, y + 1.15, z, 1.3, 0.15, 0.5, [0xf2b134, 0xd9482b, 0x8fc46a, 0xf0e0c0][Math.abs(Math.round(x * 3 + z)) % 4], false, yaw);
  for (const sx of [-1.45, 1.45]) for (const sz of [-0.85, 0.85]) {
    const c = Math.cos(yaw), s = Math.sin(yaw);
    P('box', x + sx * c + sz * s, y + 1.25, z - sx * s + sz * c, 0.05, 1.25, 0.05, PAL.metal);
  }
  P('prism', x, y + 2.75, z, 1.15, 0.3, 1.75, color, false, yaw + Math.PI / 2);
  P('box', x, y + 2.42, z, 1.75, 0.04, 1.15, 0xf3ead8, false, yaw);
}
function container(x: number, z: number, yaw: number, color: number, level = 0) {
  const y = gy(x, z) + level * 2.6;
  P('box', x, y + 1.3, z, 1.22, 1.3, 3.05, color, true, yaw);
}
function fence(x0: number, z0: number, x1: number, z1: number, h: number, color: number, thick = 0.12, baseY?: number) {
  const len = Math.hypot(x1 - x0, z1 - z0);
  const n = Math.max(1, Math.round(len / 12));
  for (let k = 0; k < n; k++) {
    const ax = x0 + ((x1 - x0) * k) / n, az = z0 + ((z1 - z0) * k) / n, bx = x0 + ((x1 - x0) * (k + 1)) / n, bz = z0 + ((z1 - z0) * (k + 1)) / n;
    const cx = (ax + bx) / 2, cz = (az + bz) / 2;
    const y = baseY ?? Math.min(gy(ax, az), gy(bx, bz), gy(cx, cz));
    const top = (baseY ?? Math.max(gy(ax, az), gy(bx, bz))) + h;
    P('box', cx, (y + top) / 2 - 0.2, cz, thick, (top - y) / 2 + 0.2, len / n / 2 + 0.02, color, true, Math.atan2(bx - ax, bz - az));
  }
}
function sign(x: number, y: number, z: number, w: number, h: number, yaw: number, color: number, always = false) {
  P('box', x, y, z, w / 2, h / 2, 0.08, color, false, yaw, always ? 2 : 1);
}
function shopFront(x: number, z: number, faceYaw: number, w: number, color: number, awn: number) {
  // faceYaw: direction the storefront faces (outward normal)
  const y = gy(x, z), nx = Math.sin(faceYaw), nz = Math.cos(faceYaw);
  P('box', x + nx * 0.9, y + 2.9, z + nz * 0.9, w / 2, 0.08, 0.9, awn, false, faceYaw);
  sign(x + nx * 0.15, y + 3.9, z + nz * 0.15, w * 0.8, 0.9, faceYaw, color);
  P('box', x + nx * 0.06, y + 1.1, z + nz * 0.06, 0.6, 1.1, 0.05, 0x3a2f2a, false, faceYaw);
  lamps.push({ x: x + nx * 1.5, y: y + 2.6, z: z + nz * 1.5, color, r: 6 });
}

// ------------------------------------------------------------------ lot generators
function sidewalkFurniture(b: Block, rng: Rng, trees: boolean) {
  const r = landRect(b);
  const sides: [number, number, number, number, number][] = [
    [r.x0 + 1, r.z0 + 0.9, r.x1 - 1, r.z0 + 0.9, Math.PI], [r.x1 - 0.9, r.z0 + 1, r.x1 - 0.9, r.z1 - 1, Math.PI / 2],
    [r.x1 - 1, r.z1 - 0.9, r.x0 + 1, r.z1 - 0.9, 0], [r.x0 + 0.9, r.z1 - 1, r.x0 + 0.9, r.z0 + 1, -Math.PI / 2],
  ];
  sides.forEach(([x0, z0, x1, z1, yaw], si) => {
    if (b.bx === 0 && si === 3) return; if (b.bz === 8 && si === 2) return;
    if ((b.bz === 0 && si === 0) || (b.bx === 8 && si === 1)) return;
    const len = Math.hypot(x1 - x0, z1 - z0);
    const n = Math.max(1, Math.floor(len / 30));
    for (let k = 0; k <= n; k++) {
      const t = (k + 0.5) / (n + 1);
      const x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t;
      if (x >= CANAL.x0 - 3 && x <= CANAL.x1 + 3) continue;
      lampPost(x, z, yaw);
      if (trees && k < n) {
        const t2 = (k + 1) / (n + 1);
        const tx = x0 + (x1 - x0) * t2, tz = z0 + (z1 - z0) * t2;
        if (!(tx >= CANAL.x0 - 4 && tx <= CANAL.x1 + 4)) {
          if (rng.chance(0.75)) tree(tx - Math.sin(yaw) * 0.3, tz - Math.cos(yaw) * 0.3, rng.range(0.85, 1.15), rng);
          else if (rng.chance(0.5)) dynProps.push({ kind: 'bin', x: tx, z: tz, yaw: 0 });
        }
      }
    }
  });
}

interface BldParams { target: number; hMin: number; hMax: number; styles: number[]; pal: number[]; alley: number; shop: number; roofs?: boolean; setback?: number }
const ZONE_PARAMS: Record<Zone, BldParams> = {
  tide: { target: 30, hMin: 3, hMax: 6, styles: [STYLE.deco, STYLE.deco, STYLE.market, STYLE.stucco], pal: PAL.stone, alley: 0.45, shop: 0.8, setback: 0.35 },
  glassline: { target: 44, hMin: 7, hMax: 19, styles: [STYLE.glass, STYLE.glass, STYLE.concrete], pal: PAL.glass, alley: 0.3, shop: 0.3, setback: 0.6 },
  lantern: { target: 21, hMin: 2, hMax: 4, styles: [STYLE.stucco], pal: PAL.stucco, alley: 0.6, shop: 0.15, roofs: true },
  canal: { target: 28, hMin: 3, hMax: 6, styles: [STYLE.deco, STYLE.stucco, STYLE.brick], pal: PAL.stucco, alley: 0.4, shop: 0.5, setback: 0.2 },
  foundry: { target: 46, hMin: 2, hMax: 4, styles: [STYLE.brick, STYLE.shed], pal: PAL.brick, alley: 0.5, shop: 0.05 },
  breakwater: { target: 40, hMin: 2, hMax: 3, styles: [STYLE.shed, STYLE.brick], pal: PAL.shed, alley: 0.5, shop: 0.1 },
};
function styleTint(style: number, rng: Rng, fallback: number[]): number {
  if (style === STYLE.glass) return rng.pick(PAL.glass);
  if (style === STYLE.brick) return rng.pick(PAL.brick);
  if (style === STYLE.shed) return rng.pick(PAL.shed);
  if (style === STYLE.concrete || style === STYLE.civic) return rng.pick(PAL.concrete);
  if (style === STYLE.deco || style === STYLE.market) return rng.pick(PAL.stone);
  if (style === STYLE.stucco) return rng.pick(PAL.stucco);
  return rng.pick(fallback);
}
function dressBuilding(bd: Building, p: BldParams, rng: Rng, floors: number) {
  const w = bd.x1 - bd.x0, d = bd.z1 - bd.z0, cx = (bd.x0 + bd.x1) / 2, cz = (bd.z0 + bd.z1) / 2;
  if (p.roofs && w < 30 && d < 30) {
    const alongX = w > d;
    P('prism', cx, bd.top + 1.3, cz, alongX ? d / 2 + 0.4 : w / 2 + 0.4, 1.3, alongX ? w / 2 + 0.4 : d / 2 + 0.4, rng.pick([0xb5563a, 0xa04a36, 0x8a4a3a, 0x5d7a8a]), false, alongX ? Math.PI / 2 : 0);
    return;
  }
  if (bd.style === STYLE.deco || bd.style === STYLE.market) {
    P('box', cx, bd.top + 0.25, cz, w / 2 + 0.35, 0.25, d / 2 + 0.35, PAL.copper);
  }
  if (p.setback && floors >= 4 && rng.chance(p.setback) && w > 16 && d > 16) {
    const up = stack(bd, rng.range(2.5, 5), Math.round(floors * rng.range(0.3, 0.8)) * FLOOR);
    if (bd.style === STYLE.glass && rng.chance(0.5) && up.x1 - up.x0 > 14) {
      const up2 = stack(up, 3, rng.int(2, 5) * FLOOR);
      P('cyl', cx, up2.top + 5, cz, 0.15, 5, 0.15, PAL.metal);
      P('ball', cx, up2.top + 10.2, cz, 0.3, 0.3, 0.3, 0xff4040, false, 0, 2);
    } else if (bd.style !== STYLE.glass) P('box', (up.x0 + up.x1) / 2, up.top + 0.25, (up.z0 + up.z1) / 2, (up.x1 - up.x0) / 2 + 0.3, 0.25, (up.z1 - up.z0) / 2 + 0.3, PAL.copper);
  } else if (w > 12 && d > 12) {
    // rooftop clutter: plant boxes, water tanks, hanging-garden planters
    const n = rng.int(1, 3);
    for (let k = 0; k < n; k++) {
      const x = rng.range(bd.x0 + 3, bd.x1 - 3), z = rng.range(bd.z0 + 3, bd.z1 - 3);
      if (rng.chance(0.4)) { P('cyl', x, bd.top + 1.4, z, 1.1, 1.0, 1.1, 0x9a7b5a); P('cone', x, bd.top + 2.8, z, 1.2, 0.4, 1.2, 0x6b5a4a); }
      else if (rng.chance(0.5)) P('box', x, bd.top + 0.7, z, rng.range(1, 2.4), 0.7, rng.range(1, 2), 0xa9adab);
      else { P('box', x, bd.top + 0.3, z, 2, 0.3, 1, 0x7d5a4a); P('ball', x, bd.top + 0.95, z, 1.9, 0.6, 0.9, PAL.foliage[k % 4]); }
    }
  }
}
function genBld(b: Block, rng: Rng, r: Rect = insetRect(landRect(b), 4), pOverride?: Partial<BldParams>) {
  const p = { ...ZONE_PARAMS[b.zone], ...pOverride };
  const w = rectW(r), d = rectD(r);
  if (w < 10 || d < 10) return;
  const nx = Math.max(1, Math.round(w / p.target)), nz = Math.max(1, Math.round(d / p.target));
  const cut = (n: number, len: number) => {
    // returns [start,end] spans with either tight joints or alley gaps
    const gaps: number[] = [];
    for (let k = 0; k < n - 1; k++) gaps.push(rng.chance(p.alley) ? 5.5 : 0.4);
    const total = len - gaps.reduce((a, c) => a + c, 0);
    const spans: [number, number][] = [];
    let pos = 0;
    const ws: number[] = [];
    let sum = 0;
    for (let k = 0; k < n; k++) { const v = rng.range(0.8, 1.25); ws.push(v); sum += v; }
    for (let k = 0; k < n; k++) { const l = (total * ws[k]) / sum; spans.push([pos, pos + l]); pos += l + (gaps[k] ?? 0); }
    return spans;
  };
  const xs = cut(nx, w), zs = cut(nz, d);
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
    const interior = i > 0 && i < nx - 1 && j > 0 && j < nz - 1;
    const x0 = r.x0 + xs[i][0], x1 = r.x0 + xs[i][1], z0 = r.z0 + zs[j][0], z1 = r.z0 + zs[j][1];
    if (interior || (nx * nz > 3 && rng.chance(0.07))) {
      // courtyard / pocket lot
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      if (rng.chance(0.5)) { tree(cx - 3, cz + 2, 1.1, rng); tree(cx + 4, cz - 3, 0.9, rng); bench(cx, cz, rng.range(0, 6)); }
      else for (let k = 0; k < 3; k++) parkSpots.push({ id: parkSpots.length, x: cx - 4 + k * 4, z: cz, yaw: rng.chance(0.5) ? 0 : Math.PI, lot: true, reserved: false });
      if (rng.chance(0.6)) dynProps.push({ kind: 'crate', x: x0 + 2, z: z0 + 2, yaw: rng.range(0, 3) });
      continue;
    }
    const style = rng.pick(p.styles);
    let floors = rng.int(p.hMin, p.hMax);
    if (b.zone === 'glassline' && rng.chance(0.25)) floors += rng.int(4, 9);
    const bd = addBuilding(x0, z0, x1, z1, floors * FLOOR + 0.8, style, styleTint(style, rng, p.pal), b.zone, { shop: rng.chance(p.shop) });
    dressBuilding(bd, p, rng, floors);
    // neon / shop signage on street-facing sides
    if (bd.shop && rng.chance(0.7)) {
      const south = j === 0, north = j === nz - 1, west = i === 0, east = i === nx - 1;
      const col = rng.pick(PAL.neon), sx = rng.range(x0 + 3, x1 - 3), sz = rng.range(z0 + 3, z1 - 3);
      const y0 = Math.max(gy(sx, z0), gy(sx, z1)) + 4.3;
      if (south) sign(sx, y0, z0 - 0.12, rng.range(2.5, 5), 0.8, Math.PI, col);
      else if (north) sign(sx, y0, z1 + 0.12, rng.range(2.5, 5), 0.8, 0, col);
      else if (west) sign(x0 - 0.12, gy(x0, sz) + 4.3, sz, rng.range(2.5, 5), 0.8, -Math.PI / 2, col);
      else if (east) sign(x1 + 0.12, gy(x1, sz) + 4.3, sz, rng.range(2.5, 5), 0.8, Math.PI / 2, col);
      if (south && rng.chance(0.6)) P('box', sx, y0 - 1.5, z0 - 0.8, rng.range(2, 4), 0.06, 0.8, rng.pick(PAL.awning));
      if (north && rng.chance(0.6)) P('box', sx, y0 - 1.5, z1 + 0.8, rng.range(2, 4), 0.06, 0.8, rng.pick(PAL.awning));
    }
  }
  // alley clutter
  for (let k = 0; k < 3; k++) if (rng.chance(0.5)) dynProps.push({ kind: rng.chance(0.5) ? 'bin' : 'crate', x: rng.range(r.x0 + 2, r.x1 - 2), z: rng.chance(0.5) ? r.z0 - 1.2 : r.z1 + 1.2, yaw: rng.range(0, 3) });
}

function genPlaza(b: Block, rng: Rng) {
  const r = landRect(b), cx = rectCx(r), cz = rectCz(r);
  // clock tower (landmark)
  const ct = ANCHORS.clockTower, y = gy(ct.x, ct.z);
  P('box', ct.x, y + 1.2, ct.z, 3.6, 1.2, 3.6, 0xcdb89a, true);
  P('box', ct.x, y + 13, ct.z, 2.5, 11, 2.5, 0xe8dcc4, true);
  P('box', ct.x, y + 25.5, ct.z, 3.0, 1.6, 3.0, 0xf0e6d2);
  for (const [dx, dz, yaw] of [[0, 3.05, 0], [0, -3.05, Math.PI], [3.05, 0, Math.PI / 2], [-3.05, 0, -Math.PI / 2]] as const)
    P('ball', ct.x + dx, y + 25.5, ct.z + dz, 1.2, 1.2, 0.08, 0xfff3c8, false, yaw, 2);
  P('cone', ct.x, y + 30, ct.z, 3.2, 3, 3.2, PAL.copper);
  P('ball', ct.x, y + 33.3, ct.z, 0.4, 0.4, 0.4, 0xffd27a, false, 0, 2);
  lamps.push({ x: ct.x, y: y + 6, z: ct.z + 6, color: 0xffd9a0, r: 14 });
  // fountain
  P('cyl', cx + 22, gy(cx + 22, cz - 26) + 0.3, cz - 26, 3.4, 0.3, 3.4, 0xcfc6b4, true);
  P('cyl', cx + 22, gy(cx + 22, cz - 26) + 0.5, cz - 26, 2.9, 0.12, 2.9, 0x59b6c9);
  P('cyl', cx + 22, gy(cx + 22, cz - 26) + 1.1, cz - 26, 0.4, 0.8, 0.4, 0xcfc6b4);
  // stalls in two arcs
  for (let i = 0; i < 6; i++) {
    const sx = r.x0 + 14 + i * 13.5;
    stall(sx, r.z0 + 12, 0, PAL.awning[i % 6]);
    if (i !== 2 && i !== 3) stall(sx, r.z0 + 26, Math.PI, PAL.awning[(i + 3) % 6]);
    if (i % 2 === 0) dynProps.push({ kind: 'crate', x: sx + 3.2, z: r.z0 + 12.5, yaw: 0.3 });
  }
  for (let i = 0; i < 4; i++) stall(r.x0 + 12, r.z0 + 46 + i * 12, Math.PI / 2, PAL.awning[(i + 1) % 6]);
  // clothing kiosk
  const k = ANCHORS.clothing, ky = gy(k.x, k.z);
  P('box', k.x + 4, ky + 1.6, k.z, 2.2, 1.6, 3, 0xf3ead8, true);
  P('box', k.x + 4, ky + 3.4, k.z, 2.8, 0.2, 3.6, 0xc2456e);
  sign(k.x + 1.7, ky + 2.6, k.z, 4.5, 0.7, -Math.PI / 2, 0xff4f7a);
  lamps.push({ x: k.x, y: ky + 2.5, z: k.z, color: 0xff7aa0, r: 7 });
  // string-light poles, benches, palms
  for (const [dx, dz] of [[-30, 22], [30, 30], [-34, -34], [36, -8], [8, 40], [-10, -36]]) palm(cx + dx, cz + dz);
  for (let i = 0; i < 5; i++) { bench(cx - 20 + i * 10, cz + 30, 0); lampPost(cx - 40 + i * 20, cz + 2, i % 2 ? 0 : Math.PI, 0xffe2b0); }
  // tram stop shelter on the west side
  P('box', r.x0 + 5, gy(r.x0 + 5, cz) + 2.6, cz + 30, 1.2, 0.08, 5, 0x1f7a8c);
  P('box', r.x0 + 4, gy(r.x0 + 4, cz) + 1.3, cz + 30, 0.05, 1.3, 5, 0xa8cfd6, true);
  sidewalkFurniture(b, rng, false);
}
function genPark(b: Block, rng: Rng) {
  const r = insetRect(landRect(b), 5);
  for (let k = 0; k < 26; k++) {
    const x = rng.range(r.x0, r.x1), z = rng.range(r.z0, r.z1);
    if (Math.hypot(x - ANCHORS.viewpoint.x, z - ANCHORS.viewpoint.z) < 12) continue;
    if (Math.hypot(x - 312, z - 300) < 10) continue;
    tree(x, z, rng.range(0.9, 1.5), rng);
  }
  for (let k = 0; k < 5; k++) bench(rng.range(r.x0 + 4, r.x1 - 4), rng.range(r.z0 + 4, r.z1 - 4), rng.range(0, 6));
  if (b.bx === 7 && b.bz === 7) {
    // the Lantern: hilltop beacon tower, visible across the district
    const x = 312, z = 300, y = gy(x, z);
    P('cyl', x, y + 1, z, 4, 1, 4, 0xd9c7a8, true);
    P('cyl', x, y + 11, z, 2.2, 10, 2.2, 0xf3ead8, true);
    P('cyl', x, y + 21.5, z, 3, 0.4, 3, PAL.copper);
    P('cyl', x, y + 23.6, z, 1.6, 1.7, 1.6, 0xffd27a, false, 0, 2);
    P('cone', x, y + 27, z, 2.6, 1.8, 2.6, PAL.copper);
    lamps.push({ x, y: y + 4, z: z - 6, color: 0xffd27a, r: 18 });
    const v = ANCHORS.viewpoint, vy = gy(v.x, v.z);
    P('cyl', v.x, vy + 0.1, v.z, 6, 0.1, 6, 0xd6c8ad);
    fence(v.x + 7, v.z - 6, v.x + 7, v.z + 6, 1.1, PAL.metal, 0.06);
    bench(v.x + 3, v.z, Math.PI / 2);
    lampPost(v.x - 5, v.z + 5, 2.3);
  }
  sidewalkFurniture(b, rng, true);
}
function containerRows(r: Rect, rng: Rng, density: number) {
  for (let x = r.x0 + 4; x < r.x1 - 3; x += 9) for (let z = r.z0 + 5; z < r.z1 - 5; z += 7.2) {
    if (!rng.chance(density)) continue;
    const yaw = 0;
    const n = rng.int(1, 3);
    for (let l = 0; l < n; l++) container(x, z, yaw, rng.pick(PAL.container), l);
  }
}
function genYard(b: Block, rng: Rng) {
  const r = insetRect(landRect(b), 4), w = rectW(r), d = rectD(r);
  const horiz = w > d;
  // big warehouse on one half, fenced working yard on the other
  const split = rng.range(0.45, 0.6);
  const A: Rect = horiz ? { x0: r.x0, x1: r.x0 + w * split, z0: r.z0, z1: r.z1 } : { x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z0 + d * split };
  const B: Rect = horiz ? { x0: A.x1 + 6, x1: r.x1, z0: r.z0, z1: r.z1 } : { x0: r.x0, x1: r.x1, z0: A.z1 + 6, z1: r.z1 };
  genBld(b, rng, A);
  if (b.bx === 6 && b.bz === 2) {
    // Foundry chimneys landmark
    for (const [dx, h] of [[6, 46], [14, 38], [22, 52]] as const) {
      const x = B.x0 + dx, z = B.z0 + 10, y = gy(x, z);
      P('cyl', x, y + h / 2, z, 1.7, h / 2, 1.7, 0xb5644a, true);
      P('cyl', x, y + h - 2, z, 1.85, 0.5, 1.85, 0xf3ead8);
      P('ball', x, y + h + 0.4, z, 0.3, 0.3, 0.3, 0xff4040, false, 0, 2);
    }
  }
  fence(B.x0, B.z0, B.x1, B.z0, 2.4, 0x77828a, 0.06); fence(B.x1, B.z0, B.x1, B.z1, 2.4, 0x77828a, 0.06);
  const gate = rectCx(B);
  fence(B.x0, B.z1, gate - 5, B.z1, 2.4, 0x77828a, 0.06); fence(gate + 5, B.z1, B.x1, B.z1, 2.4, 0x77828a, 0.06);
  containerRows(insetRect(B, 3), rng, 0.3);
  for (let k = 0; k < 4; k++) dynProps.push({ kind: rng.chance(0.5) ? 'crate' : 'barrier', x: rng.range(B.x0 + 3, B.x1 - 3), z: rng.range(B.z0 + 3, B.z1 - 3), yaw: rng.range(0, 3) });
  sidewalkFurniture(b, rng, false);
}
function genDocks(b: Block, rng: Rng) {
  const r = insetRect(landRect(b), 4);
  const A: Rect = { x0: r.x0, x1: r.x0 + rectW(r) * 0.4, z0: r.z0, z1: r.z1 };
  genBld(b, rng, A);
  containerRows({ x0: A.x1 + 8, x1: r.x1, z0: r.z0, z1: r.z1 }, rng, 0.45);
  sidewalkFurniture(b, rng, false);
}
function genParking(b: Block, rng: Rng) {
  const r = insetRect(landRect(b), 6);
  for (let z = r.z0 + 5; z < r.z1 - 4; z += 17) for (let x = r.x0 + 3; x < r.x1 - 2; x += 3.2) {
    parkSpots.push({ id: parkSpots.length, x, z, yaw: 0, lot: true, reserved: false });
    parkSpots.push({ id: parkSpots.length, x, z: z + 5.6, yaw: Math.PI, lot: true, reserved: false });
  }
  for (let x = r.x0 + 10; x < r.x1; x += 28) for (let z = r.z0 + 2.5; z < r.z1; z += 34) lampPost(x, z + 0.3, 0, 0xe8f0ff);
  P('box', r.x0 + 2, gy(r.x0 + 2, r.z0 - 1) + 1.4, r.z0 - 1, 1.5, 1.4, 1.5, 0xf2b134, true);
  fence(r.x0 - 1, r.z0 + 12, r.x0 - 1, r.z1, 1.0, 0x8a9aa3, 0.08);
  fence(r.x1 + 1, r.z0, r.x1 + 1, r.z1 - 12, 1.0, 0x8a9aa3, 0.08);
  sidewalkFurniture(b, rng, true);
}
function genCanal(b: Block, rng: Rng) {
  const r = landRect(b);
  const zs = getHSeg(2, b.bz), zn = getHSeg(2, b.bz + 1);
  const z0 = zs && zs.kind === 'road' ? r.z0 : b.bz === 0 ? r.z0 : ZE[b.bz], z1 = zn && zn.kind === 'road' ? r.z1 : b.bz === 8 ? r.z1 : ZE[b.bz + 1];
  // quay railings along both banks, with openings at the slipways
  const rail = (x: number, za: number, zb: number) => { if (zb - za > 1) fence(x, za, x, zb, 1.05, 0x4a5a63, 0.07, CURB); };
  if (b.bz === 4) { rail(CANAL.x1 + 0.6, z0, -68); rail(CANAL.x1 + 0.6, -20, z1); rail(CANAL.x1 + 8.6, -64, -24); } else rail(CANAL.x1 + 0.6, z0, z1);
  if (b.bz === 6) { rail(CANAL.x0 - 0.6, z0, 188); rail(CANAL.x0 - 0.6, 236, z1); rail(CANAL.x0 - 8.6, 192, 232); } else rail(CANAL.x0 - 0.6, z0, z1);
  // west bank buildings, east bank promenade + slim buildings facing Viaduct Avenue
  if (b.bz >= 1 && b.bz <= 7) {
    genBld(b, rng, { x0: r.x0 + 4, x1: CANAL.x0 - 12, z0: r.z0 + 4, z1: r.z1 - 4 });
    genBld(b, rng, { x0: CANAL.x1 + 24, x1: r.x1 - 4, z0: r.z0 + 4, z1: r.z1 - 4 }, { target: 24 });
    for (let z = r.z0 + 8; z < r.z1 - 6; z += 14) {
      if (b.bz === 4 && z > -72 && z < -16) continue;
      tree(CANAL.x1 + 5, z, rng.range(0.9, 1.2), rng);
      if (rng.chance(0.4)) bench(CANAL.x1 + 9, z + 5, Math.PI / 2);
      if (rng.chance(0.5)) lampPost(CANAL.x1 + 12, z + 7, -Math.PI / 2, 0xffe2b0);
    }
    for (let z = r.z0 + 10; z < r.z1 - 6; z += 22) {
      if (b.bz === 6 && z > 184 && z < 240) continue;
      tree(CANAL.x0 - 5, z, 1, rng);
    }
  }
  sidewalkFurniture(b, rng, false);
}
/** Hollow shed: four walls with a door gap on one side and a roof slab. */
function shell(x0: number, z0: number, x1: number, z1: number, h: number, color: number, door: { side: 'n' | 's' | 'e' | 'w'; at: number; w: number }, roof = 0x6f7a80) {
  const y = Math.min(gy(x0, z0), gy(x1, z1)), t = 0.3;
  const wallX = (z: number, a: number, bb: number) => { if (bb - a > 0.2) P('box', (a + bb) / 2, y + h / 2, z, (bb - a) / 2, h / 2, t, color, true); };
  const wallZ = (x: number, a: number, bb: number) => { if (bb - a > 0.2) P('box', x, y + h / 2, (a + bb) / 2, t, h / 2, (bb - a) / 2, color, true); };
  const dw = door.w / 2;
  if (door.side === 'n') { wallX(z1, x0, door.at - dw); wallX(z1, door.at + dw, x1); P('box', door.at, y + h - 0.6, z1, dw, 0.6, t, color); } else wallX(z1, x0, x1);
  if (door.side === 's') { wallX(z0, x0, door.at - dw); wallX(z0, door.at + dw, x1); P('box', door.at, y + h - 0.6, z0, dw, 0.6, t, color); } else wallX(z0, x0, x1);
  if (door.side === 'e') { wallZ(x1, z0, door.at - dw); wallZ(x1, door.at + dw, z1); P('box', x1, y + h - 0.6, door.at, t, 0.6, dw, color); } else wallZ(x1, z0, z1);
  if (door.side === 'w') { wallZ(x0, z0, door.at - dw); wallZ(x0, door.at + dw, z1); P('box', x0, y + h - 0.6, door.at, t, 0.6, dw, color); } else wallZ(x0, z0, z1);
  P('box', (x0 + x1) / 2, y + h + 0.2, (z0 + z1) / 2, (x1 - x0) / 2 + 0.5, 0.2, (z1 - z0) / 2 + 0.5, roof, true);
}

/** Story 2 compound. Exported anchors keep the mission data free of magic numbers. */
export const WAREHOUSE = {
  zone: { x0: 292, z0: -172, x1: 382, z1: -90 } as Rect,
  frontGate: { x: 337, z: -90 }, sideDoor: { x: 382, z: -131 },
  manifests: [{ x: 308, z: -160 }, { x: 352, z: -162 }, { x: 368, z: -138 }],
  fuseBox: { x: 300, z: -118 },
  guards: [
    { route: [[330, -104], [350, -104], [350, -118], [318, -118]] },
    { route: [[312, -134], [312, -158], [340, -158], [340, -134]] },
    { route: [[362, -150], [362, -128], [372, -128], [372, -150]] },
  ],
  hallDoor: { x: 337, z: -124 },
};
function genWarehouse(b: Block, rng: Rng) {
  const W = WAREHOUSE.zone;
  const wall = 0xb9a58a;
  // perimeter wall with a vehicle gate (north) and a side door (east)
  fence(W.x0, W.z1, 337 - 4.5, W.z1, 3.2, wall, 0.3); fence(337 + 4.5, W.z1, W.x1, W.z1, 3.2, wall, 0.3);
  fence(W.x0, W.z0, W.x1, W.z0, 3.2, wall, 0.3); fence(W.x0, W.z0, W.x0, W.z1, 3.2, wall, 0.3);
  fence(W.x1, W.z0, W.x1, -131 - 1.3, 3.2, wall, 0.3); fence(W.x1, -131 + 1.3, W.x1, W.z1, 3.2, wall, 0.3);
  P('box', 337 - 5, 2, W.z1, 0.5, 2, 0.5, 0x8a7a66, true); P('box', 337 + 5, 2, W.z1, 0.5, 2, 0.5, 0x8a7a66, true);
  sign(337, 4.4, W.z1 + 0.4, 7, 1, 0, 0xffc94a);
  P('box', 384.4, 2.6, -131, 0.1, 0.25, 1.4, 0x35e0d0, false, 0, 1);
  // hall
  shell(300, -168, 374, -124, 7, 0x9c5440, { side: 'n', at: 337, w: 10 });
  for (const m of WAREHOUSE.manifests) { P('box', m.x, 0.55, m.z, 1.1, 0.45, 0.6, 0x7d5a4a, true); P('box', m.x, 1.05, m.z, 0.5, 0.04, 0.35, 0xf3ead8, false, 0.3, 2); }
  for (let x = 314; x < 366; x += 13) for (const z of [-148, -140]) { if (Math.abs(x - 352) < 5 && z < -150) continue; P('box', x, 1.8, z, 4.2, 1.7, 0.7, 0x5d6a72, true); P('box', x, 2.3, z, 4, 0.5, 0.75, rng.pick(PAL.container)); }
  lamps.push({ x: 337, y: 6, z: -146, color: 0xffe2b0, r: 16 }, { x: 310, y: 6, z: -146, color: 0xffe2b0, r: 12 }, { x: 364, y: 6, z: -146, color: 0xffe2b0, r: 12 });
  // yard cover + fuse box
  container(304, -100, Math.PI / 2, 0x2f6f8f); container(322, -110, 0, 0xc8553d); container(322, -110, 0, 0xe0a030, 1);
  container(358, -100, Math.PI / 2, 0x3f8f6a); container(366, -112, 0, 0x8a8f94);
  const f = WAREHOUSE.fuseBox; P('box', f.x, 1.2, f.z, 0.35, 0.6, 0.2, 0xe0a030, true); P('box', f.x, 0.4, f.z, 0.06, 0.4, 0.06, PAL.metal);
  for (const [x, z] of [[346, -112], [330, -98], [372, -96]]) dynProps.push({ kind: 'crate', x, z, yaw: 0.4 });
  cameras.push({ id: 'wh-yard-w', x: 296, y: 5.5, z: -94, yaw: 2.4, sweep: 0.7, fov: 0.5, range: 30, group: 'warehouse' });
  cameras.push({ id: 'wh-yard-e', x: 378, y: 5.5, z: -122, yaw: -1.9, sweep: 0.6, fov: 0.5, range: 28, group: 'warehouse' });
  for (const c of cameras.slice(-2)) { P('box', c.x, c.y, c.z, 0.2, 0.15, 0.35, 0x2c3036, false, c.yaw); P('cyl', c.x, c.y / 2, c.z, 0.07, c.y / 2, 0.07, PAL.metal, true); }
  lampPost(300, -96, 2.2); lampPost(374, -96, -2.2);
  sidewalkFurniture(b, rng, false);
}
/** Story 4 compound. */
export const PORT = {
  zone: { x0: -62, z0: -380, x1: 40, z1: -312 } as Rect,
  gate: { x: -11, z: -312 },
  terminal: { x: -6, z: -362 }, serverSwitch: { x: -50, z: -352 },
  bikeSpot: { x: 14, z: -322, yaw: 0 }, carSpot: { x: 24, z: -322, yaw: 0 },
  guards: [
    { route: [[-24, -324], [4, -324], [4, -340], [-24, -340]] },
    { route: [[-40, -346], [-40, -366], [-24, -366]] },
    { route: [[20, -350], [30, -366], [12, -368]] },
  ],
  rivalSpawns: [[-11, -296], [-40, -300], [20, -300], [60, -300]],
  officeDoor: { x: -6, z: -352 },
};
function genPort(b: Block, rng: Rng) {
  const Z = PORT.zone, col = 0x6f8591;
  fence(Z.x0, Z.z1, -11 - 5, Z.z1, 3, col, 0.08); fence(-11 + 5, Z.z1, Z.x1, Z.z1, 3, col, 0.08);
  fence(Z.x0, Z.z0, Z.x1, Z.z0, 3, col, 0.08); fence(Z.x0, Z.z0, Z.x0, Z.z1, 3, col, 0.08); fence(Z.x1, Z.z0, Z.x1, Z.z1, 3, col, 0.08);
  P('box', -17, 1.6, Z.z1 + 1.6, 1.4, 1.5, 1.4, 0xf3ead8, true); sign(-11, 4.2, Z.z1 + 0.3, 8, 0.9, 0, 0x35e0d0);
  // control office (open door on the north) and server annex
  shell(-22, -376, 12, -352, 4.2, 0xd6d4cc, { side: 'n', at: -6, w: 3 }, 0x56b09a);
  const t = PORT.terminal; P('box', t.x, 0.6, t.z - 1.2, 1.4, 0.5, 0.5, 0x3a4048, true); P('box', t.x, 1.5, t.z - 1.4, 0.9, 0.4, 0.05, 0x35e0d0, false, 0, 2);
  lamps.push({ x: -6, y: 3.4, z: -364, color: 0xbfe8ff, r: 10 });
  shell(-58, -360, -46, -346, 3.4, 0xb1b5b2, { side: 'e', at: -352, w: 2.4 }, 0x6f7a80);
  const s = PORT.serverSwitch; P('box', s.x - 3, 1.3, s.z, 0.4, 1.3, 1.2, 0x2c3036, true); P('box', s.x - 2.55, 1.6, s.z, 0.03, 0.2, 0.3, 0xff4040, false, 0, 2);
  // radio mast landmark
  P('cyl', 30, 17, -370, 0.35, 17, 0.35, 0xd9482b, true); P('box', 30, 26, -370, 2, 0.1, 0.1, PAL.metal); P('box', 30, 30, -370, 1.4, 0.1, 0.1, PAL.metal);
  P('ball', 30, 34.3, -370, 0.35, 0.35, 0.35, 0xff4040, false, 0, 2);
  container(-40, -322, Math.PI / 2, 0x2f6f8f); container(-28, -334, 0, 0xc8553d); container(26, -340, Math.PI / 2, 0xe0a030); container(26, -340, Math.PI / 2, 0x3f8f6a, 1);
  container(-48, -372, Math.PI / 2, 0x8a8f94); container(30, -356, 0, 0xb04a6a);
  for (const [x, z] of [[-14, -344], [2, -346], [-30, -350]]) P('box', x, 0.55, z, 1.6, 0.55, 0.35, 0xbfc2c0, true);
  for (const [x, z] of [[8, -336], [-34, -344]]) dynProps.push({ kind: 'barrier', x, z, yaw: 0.2 });
  cameras.push({ id: 'port-gate', x: -5, y: 5, z: -313, yaw: Math.PI, sweep: 0.5, fov: 0.5, range: 26, group: 'port' });
  P('cyl', -5, 2.5, -313, 0.07, 2.5, 0.07, PAL.metal, true); P('box', -5, 5, -313, 0.2, 0.15, 0.35, 0x2c3036);
  lampPost(-30, -316, Math.PI); lampPost(20, -316, Math.PI); lampPost(34, -348, -Math.PI / 2);
  sidewalkFurniture(b, rng, false);
}
function genPolice(b: Block, rng: Rng) {
  const r = insetRect(landRect(b), 4);
  const bd = addBuilding(r.x0 + 4, r.z0 + 14, r.x1 - 30, r.z1, 4 * FLOOR + 0.8, STYLE.civic, 0xd6d4cc, b.zone, { tag: 'police' });
  stack(bd, 6, 2 * FLOOR);
  P('box', (bd.x0 + bd.x1) / 2, gy(0, r.z0) + 4.6, bd.z0 - 0.2, 7, 0.6, 0.12, 0x4a7dff, false, Math.PI, 2);
  P('box', ANCHORS.precinct.x, gy(0, r.z0) + 3.2, bd.z0 - 1.2, 4, 0.1, 1.2, 0x2f4f8f);
  for (const dx of [-3.6, 3.6]) P('cyl', ANCHORS.precinct.x + dx, gy(0, r.z0) + 1.6, bd.z0 - 2.2, 0.15, 1.6, 0.15, 0xd6d4cc, true);
  for (let k = 0; k < 5; k++) parkSpots.push({ id: parkSpots.length, x: r.x1 - 22 + k * 4.2, z: r.z0 + 12, yaw: Math.PI, lot: true, reserved: true });
  fence(r.x1 - 26, r.z0 + 22, r.x1, r.z0 + 22, 2.2, 0x77828a, 0.06); fence(r.x1, r.z0 + 3, r.x1, r.z0 + 22, 2.2, 0x77828a, 0.06);
  lampPost(r.x0 + 6, r.z0 + 6, Math.PI, 0xcfe0ff); lampPost(r.x1 - 6, r.z0 + 4, Math.PI, 0xcfe0ff);
  cameras.push({ id: 'substation', x: ANCHORS.precinct.x + 8, y: 6, z: bd.z0 - 0.4, yaw: Math.PI, sweep: 0, fov: 0.7, range: 34, group: 'city' });
  tree(r.x0 + 8, r.z0 + 20, 1.2, rng); tree(r.x0 + 20, r.z0 + 22, 1, rng);
  sidewalkFurniture(b, rng, true);
}
function genSafehouse(b: Block, rng: Rng) {
  const r = insetRect(landRect(b), 4);
  // north row is authored (safehouse + courier depot); the rest is generic
  const sh = addBuilding(-134, r.z1 - 24, -108, r.z1, 3 * FLOOR + 0.8, STYLE.stucco, 0x8fc1c9, b.zone, { tag: 'safehouse' });
  P('box', (sh.x0 + sh.x1) / 2, sh.top + 0.25, (sh.z0 + sh.z1) / 2, 13.4, 0.25, 12.4, PAL.copper);
  shopFront(ANCHORS.safehouse.x, r.z1, 0, 4, 0x35e0d0, 0x1f7a8c);
  const dp = addBuilding(-104, r.z1 - 20, -80, r.z1, 2 * FLOOR + 0.8, STYLE.brick, 0xc27752, b.zone, { tag: 'depot' });
  P('prism', (dp.x0 + dp.x1) / 2, dp.top + 1.1, (dp.z0 + dp.z1) / 2, 10.4, 1.1, 12.4, 0x5d7a8a, false, Math.PI / 2);
  shopFront(ANCHORS.depot.x, r.z1, 0, 6, 0xffc94a, 0xf2b134);
  const w = addBuilding(r.x0, r.z1 - 26, -140, r.z1, 4 * FLOOR + 0.8, STYLE.deco, 0xe8dcc4, b.zone, { shop: true });
  P('box', (w.x0 + w.x1) / 2, w.top + 0.25, (w.z0 + w.z1) / 2, (w.x1 - w.x0) / 2 + 0.35, 0.25, 13.35, PAL.copper);
  genBld(b, rng, { x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1 - 34 });
  sidewalkFurniture(b, rng, true);
}
function genTower(b: Block, rng: Rng) {
  const r = insetRect(landRect(b), 6), cx = rectCx(r), cz = rectCz(r);
  const base = addBuilding(cx - 24, cz - 34, cx + 24, r.z1 - 2, 6 * FLOOR + 0.8, STYLE.glass, 0x78aec2, b.zone, { tag: 'exchange' });
  const t1 = stack(base, 5, 12 * FLOOR), t2 = stack(t1, 4, 8 * FLOOR), t3 = stack(t2, 4, 5 * FLOOR);
  const mz = (t3.z0 + t3.z1) / 2;
  P('cone', cx, t3.top + 6, mz, 4, 6, 4, PAL.copper);
  P('cyl', cx, t3.top + 16, mz, 0.2, 5, 0.2, PAL.metal); P('ball', cx, t3.top + 21.3, mz, 0.45, 0.45, 0.45, 0xff4040, false, 0, 2);
  P('box', cx, base.top + 0.3, (base.z0 + base.z1) / 2, 24.4, 0.3, (base.z1 - base.z0) / 2 + 0.4, PAL.copper);
  const gx = ANCHORS.glassDrop.x, gY = gy(gx, r.z1);
  sign(gx, gY + 5, r.z1 - 1.8, 12, 1.2, 0, 0x35e0d0);
  P('box', gx, gY + 3.4, r.z1 + 0.5, 6, 0.12, 2.5, 0xa8cfd6);
  for (const dx of [-5.5, 5.5]) P('cyl', gx + dx, gY + 1.7, r.z1 + 2.6, 0.18, 1.7, 0.18, PAL.metal, true);
  for (let k = 0; k < 6; k++) { palm(r.x0 + 4 + k * 19, r.z0 + 6); if (k % 2) bench(r.x0 + 12 + k * 19, r.z0 + 9, 0); }
  cameras.push({ id: 'exchange', x: cx + 10, y: 7, z: r.z1 - 1.7, yaw: 0, sweep: 0, fov: 0.7, range: 34, group: 'city' });
  sidewalkFurniture(b, rng, false);
}
function genGarage(b: Block, rng: Rng) {
  const r = insetRect(landRect(b), 4), g = ANCHORS.garage;
  shell(g.x - 16, r.z0 + 2, g.x + 16, g.z - 8, 5.2, 0xe0a030, { side: 'n', at: g.x, w: 14 }, 0x5d6a72);
  sign(g.x, gy(g.x, g.z) + 6.6, g.z - 7.6, 16, 1.3, 0, 0xffc94a);
  P('box', g.x - 11, gy(g.x, g.z) + 0.9, r.z0 + 5, 3, 0.9, 1, 0xc8553d, true); P('box', g.x + 11, gy(g.x, g.z) + 1.2, r.z0 + 5, 1.2, 1.2, 0.8, 0x2f6f8f, true);
  for (let k = 0; k < 3; k++) P('cyl', g.x + 19 + k * 0.2, gy(g.x, g.z) + 0.3 + k * 0.5, g.z - 6, 0.55, 0.22, 0.55, 0x22252a, k === 0);
  lamps.push({ x: g.x, y: 4.6, z: g.z - 14, color: 0xfff1cf, r: 14 }, { x: g.x, y: 5, z: g.z + 2, color: 0xffd9a0, r: 14 });
  for (let k = 0; k < 4; k++) parkSpots.push({ id: parkSpots.length, x: r.x1 - 6 - k * 4, z: g.z - 2, yaw: Math.PI, lot: true, reserved: false });
  genBld(b, rng, { x0: r.x0, x1: g.x - 24, z0: r.z0, z1: r.z1 });
  containerRows({ x0: g.x + 24, x1: r.x1, z0: r.z0, z1: g.z - 16 }, rng, 0.4);
  sidewalkFurniture(b, rng, false);
}
function genMargin(b: Block, rng: Rng) {
  const r = landRect(b);
  if (b.lot === 'marginN') genBld(b, rng, { x0: r.x0 + 4, x1: r.x1 - 4, z0: r.z0 + 4, z1: r.z1 - 1 }, { target: 30, alley: 0.25 });
  else genBld(b, rng, { x0: r.x0 + 1, x1: r.x1 - 4, z0: r.z0 + 4, z1: r.z1 - 4 }, { target: 30, alley: 0.25 });
  sidewalkFurniture(b, rng, b.zone !== 'breakwater');
}
function crane(x: number, z: number, alongX: boolean) {
  const y = gy(x, z), c = 0xe0a030;
  for (const [dx, dz] of [[-7, -5], [7, -5], [-7, 5], [7, 5]]) {
    const px = alongX ? dx : dz, pz = alongX ? dz : dx;
    P('box', x + px, y + 14, z + pz, 0.6, 14, 0.6, c, true);
  }
  P('box', x, y + 28.5, z, alongX ? 8 : 6, 0.9, alongX ? 6 : 8, c);
  const yaw = alongX ? 0 : Math.PI / 2;
  P('box', x + (alongX ? 0 : 14), y + 31, z + (alongX ? -14 : 0), 1.2, 1.0, 26, c, false, yaw + (alongX ? 0 : 0));
  P('box', x, y + 34, z, 1.6, 2.2, 2.4, 0xf3ead8);
  P('ball', x, y + 36.6, z, 0.35, 0.35, 0.35, 0xff4040, false, 0, 2);
}
function genQuay(b: Block, rng: Rng) {
  const r = landRect(b);
  const south = b.lot === 'quayS' || b.lot === 'corner';
  if (hillHeight(rectCx(r), rectCz(r)) > 1.5) { // sloping shore under Lantern Hill
    for (let k = 0; k < 8; k++) tree(rng.range(r.x0 + 4, r.x1 - 6), rng.range(r.z0 + 4, r.z1 - 4), rng.range(0.9, 1.4), rng);
    return;
  }
  if (b.bx === 2) return;
  // mooring bollards along the water edge
  if (b.bz === 0) for (let x = r.x0 + 4; x < r.x1 - 2; x += 9) P('cyl', x, gy(x, r.z0 + 1.2) + 0.35, r.z0 + 1.2, 0.3, 0.35, 0.3, 0x2c3036, true);
  if (b.bx === 8) for (let z = r.z0 + 4; z < r.z1 - 2; z += 9) P('cyl', r.x1 - 1.2, gy(r.x1 - 1.2, z) + 0.35, z, 0.3, 0.35, 0.3, 0x2c3036, true);
  if (b.lot === 'corner') {
    if (b.bx === 8 && b.bz === 0) { // Breakwater light
      const x = r.x1 - 10, z = r.z0 + 10, y = gy(x, z);
      P('cyl', x, y + 1, z, 3.2, 1, 3.2, 0xcfc6b4, true);
      for (let k = 0; k < 5; k++) P('cyl', x, y + 4 + k * 4, z, 1.9 - k * 0.15, 2, 1.9 - k * 0.15, k % 2 ? 0xd9482b : 0xf3ead8, k === 0);
      P('cyl', x, y + 23.2, z, 1.3, 1.2, 1.3, 0xfff1a8, false, 0, 2); P('cone', x, y + 25.6, z, 1.9, 1.2, 1.9, 0xd9482b);
    } else if (b.bz === 0) containerRows(insetRect(r, 6), rng, 0.4);
    else genBld(b, rng, insetRect(r, 5), { target: 30 });
    return;
  }
  if (south) {
    if (b.bx === 1 || b.bx === 5) crane(rectCx(r), r.z0 + 16, true);
    const hasCrane = b.bx === 1 || b.bx === 5;
    containerRows({ x0: r.x0 + (hasCrane ? 4 : 4), x1: hasCrane ? rectCx(r) - 14 : r.x1 - 4, z0: r.z0 + 9, z1: r.z1 + 3 }, rng, 0.4);
    for (let k = 0; k < 2; k++) dynProps.push({ kind: 'barrier', x: rng.range(r.x0 + 6, r.x1 - 6), z: r.z0 + 6, yaw: 0 });
  } else {
    if (b.bz === 2) crane(r.x1 - 16, rectCz(r), false);
    containerRows({ x0: r.x0 + 4, x1: r.x1 - 30, z0: r.z0 + 4, z1: r.z1 - 4 }, rng, 0.3);
  }
  for (let k = 0; k < 2; k++) lampPost(south ? r.x0 + 12 + k * 50 : r.x0 + 6, south ? r.z1 - 3 : r.z0 + 12 + k * 50, south ? Math.PI : Math.PI / 2, 0xe8f0ff);
}

function genViaduct() {
  // The district's north and west edge: a stone tram viaduct with tunnel portals for through roads.
  const H = 11, col = PAL.wallStone;
  const gapsN: [number, number, number][] = []; // x0, x1, lintelY
  for (const s of segments) if (s.portal && s.axis === 'v') gapsN.push([s.rect.x0 - 1, s.rect.x1 + 1, 6]);
  gapsN.push([CANAL.x0 - 1, CANAL.x1 + 1, 1.2]);
  gapsN.sort((a, b) => a[0] - b[0]);
  let x = -452;
  const northRun = (a: number, bb: number) => {
    for (let s = a; s < bb - 0.1; s += 24) {
      const e = Math.min(bb, s + 24), cx = (s + e) / 2;
      const lo = Math.min(gy(s, 438), gy(e, 438), gy(cx, 438)) - 1, hi = Math.max(gy(s, 438), gy(e, 438)) + H;
      P('box', cx, (lo + hi) / 2, 446, (e - s) / 2, (hi - lo) / 2, 6, col, true);
      if (e - s > 10) P('box', cx, lo + 1 + 3.2, 439.85, Math.min(4.5, (e - s) / 2 - 1.5), 3.2, 0.2, 0x8f7f68);
      P('box', cx, hi + 0.4, 440.4, (e - s) / 2, 0.4, 0.4, 0xe8dcc4);
    }
  };
  for (const [g0, g1, ly] of gapsN) {
    northRun(x, g0);
    const base = Math.max(gy(g0, 438), gy(g1, 438));
    P('box', (g0 + g1) / 2, base + (ly + H) / 2, 446, (g1 - g0) / 2, (H - ly) / 2, 6, col, true);
    P('box', (g0 + g1) / 2, base + ly - 0.25, 439.9, (g1 - g0) / 2, 0.35, 0.25, 0x8f7f68);
    blockers.push({ x: (g0 + g1) / 2, y: base + 1, z: 451.5, hx: (g1 - g0) / 2, hy: 8, hz: 0.5 });
    P('box', (g0 + g1) / 2, base + (ly > 3 ? 3 : -1.5), 451.2, (g1 - g0) / 2, ly > 3 ? 3 : 2.8, 0.2, 0x0c0e12);
    x = g1;
  }
  northRun(x, 452);
  const gapsW: [number, number][] = [];
  for (const s of segments) if (s.portal && s.axis === 'h') gapsW.push([s.rect.z0 - 1, s.rect.z1 + 1]);
  gapsW.sort((a, b) => a[0] - b[0]);
  let z = -436;
  const westRun = (a: number, bb: number) => {
    for (let s = a; s < bb - 0.1; s += 24) {
      const e = Math.min(bb, s + 24), cz = (s + e) / 2;
      P('box', -446, (H - 1) / 2, cz, 6, (H + 1) / 2, (e - s) / 2, col, true);
      if (e - s > 10) P('box', -439.85, 3.4, cz, 0.2, 3.2, Math.min(4.5, (e - s) / 2 - 1.5), 0x8f7f68);
      P('box', -440.4, H + 0.4, cz, 0.4, 0.4, (e - s) / 2, 0xe8dcc4);
    }
  };
  for (const [g0, g1] of gapsW) {
    westRun(z, g0);
    P('box', -446, (6 + H) / 2, (g0 + g1) / 2, 6, (H - 6) / 2, (g1 - g0) / 2, col, true);
    P('box', -439.9, 5.75, (g0 + g1) / 2, 0.25, 0.35, (g1 - g0) / 2, 0x8f7f68);
    blockers.push({ x: -451.5, y: 1, z: (g0 + g1) / 2, hx: 0.5, hy: 8, hz: (g1 - g0) / 2 });
    P('box', -451.2, 3, (g0 + g1) / 2, 0.2, 3, (g1 - g0) / 2, 0x0c0e12);
    z = g1;
  }
  westRun(z, 440);
  // catenary masts for the tram on top
  for (let s = -420; s < 440; s += 40) {
    P('box', s, gy(s, 438) + H + 3.2, 449, 0.12, 2.8, 0.12, PAL.metal); P('box', s, gy(s, 438) + H + 5.8, 446.5, 0.08, 0.08, 2.6, PAL.metal);
    if (s < 420) { P('box', -449, H + 3.2, s, 0.12, 2.8, 0.12, PAL.metal); P('box', -446.5, H + 5.8, s, 2.6, 0.08, 0.08, PAL.metal); }
  }
  // world bounds out at sea
  blockers.push({ x: 478, y: 0, z: 0, hx: 1, hy: 30, hz: 480 }, { x: 0, y: 0, z: -478, hx: 480, hy: 30, hz: 1 }, { x: 0, y: 0, z: 453, hx: 480, hy: 40, hz: 1 }, { x: -453, y: 0, z: 0, hx: 1, hy: 40, hz: 480 });
}
function genDecks() {
  for (const d of decks) {
    const cx = (d.rect.x0 + d.rect.x1) / 2, cz = (d.rect.z0 + d.rect.z1) / 2;
    // parapets (the deck slab itself is built by the ground mesher + physics from `decks`)
    for (const z of [d.rect.z0 + 0.25, d.rect.z1 - 0.25]) {
      P('box', cx, d.y + CURB + 0.55, z, (d.rect.x1 - d.rect.x0) / 2, 0.55, 0.22, 0xd9c7a8, true);
      for (const x of [d.rect.x0 + 0.5, d.rect.x1 - 0.5]) { P('box', x, d.y + CURB + 1.0, z, 0.45, 1.0, 0.4, 0xcdb89a, true); P('ball', x, d.y + CURB + 2.25, z, 0.3, 0.3, 0.3, 0xfff1cf, false, 0, 1); lamps.push({ x, y: d.y + 2.2, z, color: 0xffd9a0, r: 6 }); }
    }
    void cz;
  }
}
function genSignals() {
  for (const it of intersections) {
    if (!it.signal) continue;
    // one mast per approach on the far-right corner; lamp colours are driven at runtime
    const corners: [number, number][] = [[it.rect.x1 + 0.8, it.rect.z1 + 0.8], [it.rect.x1 + 0.8, it.rect.z0 - 0.8], [it.rect.x0 - 0.8, it.rect.z0 - 0.8], [it.rect.x0 - 0.8, it.rect.z1 + 0.8]];
    for (const [x, z] of corners) { const y = gy(x, z); P('cyl', x, y + 2.7, z, 0.08, 2.7, 0.08, PAL.dark, true); P('box', x, y + 5.0, z, 0.2, 0.55, 0.2, 0x1c1f24); }
  }
}
function genStreetParking() {
  const reservedAt = [ANCHORS.bikeSpot, ANCHORS.marketPark, ANCHORS.glassPark];
  for (const s of segments) {
    if (s.kind !== 'road' || s.cls !== 'collector' || s.portal || s.bridge) continue;
    for (let d = 14; d < s.len - 14; d += 7.2) for (const side of [1, -1]) {
      const x = s.axis === 'v' ? s.ax + side * 4.75 : s.ax + d, z = s.axis === 'v' ? s.az + d : s.az - side * 4.75;
      const yaw = s.axis === 'v' ? (side > 0 ? 0 : Math.PI) : side > 0 ? Math.PI / 2 : -Math.PI / 2;
      if (reservedAt.some((a) => Math.hypot(a.x - x, a.z - z) < 9)) continue;
      parkSpots.push({ id: parkSpots.length, x, z, yaw, lot: false, reserved: false });
    }
  }
}

let generated = false;
export function generateLots(seed = 20261) {
  if (generated) return;
  generated = true;
  for (const b of blocks) {
    const rng = new Rng(seed + b.id * 7919);
    switch (b.lot) {
      case 'bld': genBld(b, rng); sidewalkFurniture(b, rng, b.zone !== 'lantern' || true); break;
      case 'plaza': genPlaza(b, rng); break;
      case 'park': genPark(b, rng); break;
      case 'yard': genYard(b, rng); break;
      case 'docks': genDocks(b, rng); break;
      case 'parking': genParking(b, rng); break;
      case 'canal': genCanal(b, rng); break;
      case 'warehouse': genWarehouse(b, rng); break;
      case 'port': genPort(b, rng); break;
      case 'police': genPolice(b, rng); break;
      case 'safehouse': genSafehouse(b, rng); break;
      case 'tower': genTower(b, rng); break;
      case 'garage': genGarage(b, rng); break;
      case 'marginN': case 'marginW': genMargin(b, rng); break;
      case 'quayS': case 'quayE': case 'corner': genQuay(b, rng); break;
    }
  }
  // shop fronts for the walk-up stores
  shopFront(ANCHORS.quayMart.x, ANCHORS.quayMart.z + 2, Math.PI, 5, 0x35e0d0, 0x2a9d6f);
  shopFront(ANCHORS.supply.x, ANCHORS.supply.z - 2, 0, 5, 0xff8a3c, 0xd9482b);
  shopFront(ANCHORS.odalys.x, ANCHORS.odalys.z - 2, 0, 6, 0x7c8cff, 0x1f7a8c);
  cameras.push({ id: 'market', x: ANCHORS.clockTower.x, y: 9, z: ANCHORS.clockTower.z - 2.6, yaw: Math.PI, sweep: 0.9, fov: 0.6, range: 38, group: 'city' });
  genViaduct(); genDecks(); genSignals(); genStreetParking();
}
void hwX; void hwZ; void XE; void WALL_IN; void COAST_E; void COAST_S;
