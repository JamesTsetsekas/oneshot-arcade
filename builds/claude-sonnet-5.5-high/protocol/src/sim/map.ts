// Aperture Annex: an original compact research campus. The whole map is authored on a 2 m cell grid with a
// painter API, then converted into axis-aligned collision boxes tagged by material. The very same boxes
// feed the simulation (collision, hitscan, penetration, grenades, visibility) and the renderer, so there is
// no render-vs-ballistic mismatch by construction.

import { hashString } from './math';

export const CELL = 2;
export const GRID_W = 48;
export const GRID_H = 36;

export type MaterialId = 'concrete' | 'metal' | 'glass' | 'thin' | 'foliage' | 'crate' | 'platform';

export interface MaterialDef {
  /** Penetration cost per metre of thickness (Infinity = not penetrable). */
  cost: number;
  /** Blocks line of sight (and bot/visibility checks). */
  opaque: boolean;
  label: string;
}

export const MATERIALS: Record<MaterialId, MaterialDef> = {
  concrete: { cost: Infinity, opaque: true, label: 'Reinforced concrete' },
  metal: { cost: 7, opaque: true, label: 'Metal housing' },
  glass: { cost: 1.6, opaque: false, label: 'Laminated glass' },
  thin: { cost: 3.2, opaque: true, label: 'Service wall' },
  foliage: { cost: 0.55, opaque: true, label: 'Planter foliage' },
  crate: { cost: 4.5, opaque: true, label: 'Cargo crate' },
  platform: { cost: Infinity, opaque: true, label: 'Platform' },
};

export interface Box {
  id: number;
  x0: number; y0: number; z0: number;
  x1: number; y1: number; z1: number;
  mat: MaterialId;
  /** Source glyph; the renderer picks a look from it. */
  glyph: string;
}

export interface Zone { name: string; x0: number; z0: number; x1: number; z1: number }
export interface Callout { name: string; x0: number; z0: number; x1: number; z1: number }
export interface SpawnPoint { x: number; z: number; yaw: number }

type Painter = {
  fill(ch: string): void;
  rect(c0: number, r0: number, c1: number, r1: number, ch: string): void;
  carve(c0: number, r0: number, c1: number, r1: number): void;
  set(c: number, r: number, ch: string): void;
};

/** Glyph legend:
 *  '#' full wall, '.' floor, 'T' turbine housing, 'C' tall crate, 'c' low crate (jumpable), 'H' half wall,
 *  'P' planter foliage, 'w' thin wall E-W, 'v' thin wall N-S, 'g' glass E-W, 'l' glass N-S,
 *  '1'..'4' platform/steps (0.4 m per level), 'k' crawl duct (needs crouch).
 */
export const GLYPH_HEIGHT: Record<string, number> = {
  '#': 6, T: 3.4, C: 1.6, c: 0.7, H: 1.2, P: 1.9, '1': 0.4, '2': 0.8, '3': 1.2, '4': 1.6,
};

export const WALL_H = 6;
/** Roof height. Walls reach it, so every room is enclosed; grenades and bullets cannot pass it. */
export const CEILING_Y = 6;
export const THIN_H = 4.2;
export const THIN_T = 0.4;
export const CRAWL_CLEAR = 1.4;

function authorGrid(): string[][] {
  const g: string[][] = [];
  for (let r = 0; r < GRID_H; r++) g.push(new Array(GRID_W).fill('#'));
  const p: Painter = {
    fill: (ch) => { for (const row of g) row.fill(ch); },
    rect: (c0, r0, c1, r1, ch) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) g[r][c] = ch; },
    carve: (c0, r0, c1, r1) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) g[r][c] = '.'; },
    set: (c, r, ch) => { g[r][c] = ch; },
  };

  // ---------------- Custodian atrium (spawn) ----------------
  p.carve(17, 1, 30, 7);
  p.set(21, 5, 'C'); p.set(26, 5, 'C');
  p.rect(19, 7, 19, 7, '#'); p.rect(28, 7, 28, 7, '#');
  p.carve(14, 4, 16, 5);          // west service link -> A gate
  p.carve(31, 4, 33, 5);          // east service link -> B gate
  p.carve(23, 8, 24, 8);          // atrium south gate -> mid

  // ---------------- Mid: calibration chamber ----------------
  p.carve(19, 9, 28, 21);
  p.rect(22, 13, 25, 17, '2');    // raised calibration deck
  p.rect(23, 14, 24, 16, 'T');    // calibration core: breaks the N-S sightline through mid
  p.rect(23, 12, 24, 12, '1');    // north steps
  p.rect(23, 18, 24, 18, '1');    // south steps
  p.set(20, 10, 'C'); p.set(27, 10, 'C'); p.set(20, 20, 'C'); p.set(27, 20, 'C');
  p.set(19, 16, 'c'); p.set(28, 16, 'c');
  p.carve(22, 22, 24, 26);        // calibration ramp -> yard
  p.set(21, 22, 'H'); p.set(25, 22, 'H');

  // mid links
  p.carve(14, 13, 18, 14);        // turbine ramp (mid west door -> A)
  p.carve(29, 13, 33, 14);        // lab link (mid east door -> B)

  // ---------------- Vault A: turbine hall ----------------
  p.carve(2, 2, 13, 15);
  p.rect(2, 2, 4, 5, '4');        // exposed gantry
  p.rect(5, 2, 5, 3, '3'); p.rect(6, 2, 6, 3, '2'); p.rect(7, 2, 7, 3, '1');
  p.rect(5, 9, 6, 10, 'T');       // turbine housing
  p.rect(11, 7, 11, 12, 'v');     // penetrable service wall splitting off the fallback lane
  p.set(9, 6, 'C'); p.set(10, 12, 'C'); p.set(8, 13, 'c'); p.set(3, 8, 'C'); p.set(3, 13, 'c');
  p.set(8, 9, 'H'); p.set(8, 10, 'H');
  p.set(12, 8, 'c'); p.set(13, 11, 'C');

  // A approaches from the freight yard
  p.carve(3, 16, 4, 28);          // dock lane
  p.carve(9, 16, 10, 26);         // cargo lane
  p.set(4, 20, 'H'); p.set(9, 22, 'H');
  p.set(3, 24, 'c'); p.set(10, 24, 'C');

  // ---------------- Vault B: hydroponics lab ----------------
  p.carve(34, 2, 45, 14);
  p.rect(37, 4, 38, 4, 'P'); p.rect(41, 4, 41, 5, 'P'); p.rect(44, 3, 45, 3, 'P');
  p.rect(37, 8, 37, 9, 'P'); p.rect(40, 7, 41, 7, 'P'); p.rect(43, 9, 44, 9, 'P'); p.set(39, 10, 'P');
  p.set(36, 12, 'C'); p.set(42, 12, 'c'); p.set(45, 6, 'C');
  p.rect(34, 8, 34, 9, 'H');
  p.rect(36, 6, 36, 6, 'H');

  // B approaches
  p.carve(41, 15, 45, 30);        // long glass corridor
  p.rect(43, 15, 43, 26, 'l');    // glass wall running down the corridor
  p.carve(37, 15, 37, 26);        // maintenance crawl
  p.rect(37, 17, 37, 20, 'k');
  p.set(41, 22, 'H'); p.set(45, 25, 'c'); p.set(44, 18, 'C');

  // ---------------- Freight yard (intrusion spawn) ----------------
  p.carve(8, 27, 39, 34);
  p.carve(3, 28, 8, 30);          // west dock link
  p.carve(39, 28, 42, 30);        // east glass link
  // containers
  p.rect(13, 29, 14, 30, 'C'); p.rect(33, 29, 34, 30, 'C');
  p.rect(17, 28, 18, 28, 'C'); p.rect(29, 28, 30, 28, 'C');
  p.rect(22, 29, 25, 29, 'c');
  p.rect(11, 32, 12, 33, 'C'); p.rect(35, 32, 36, 33, 'C');
  p.set(9, 28, 'c'); p.set(38, 28, 'c');
  p.set(15, 32, 'H'); p.set(32, 32, 'H');

  return g;
}

export const GRID: string[][] = authorGrid();

export function cellGlyph(c: number, r: number): string {
  if (c < 0 || r < 0 || c >= GRID_W || r >= GRID_H) return '#';
  return GRID[r][c];
}

export function dumpGrid(): string {
  return GRID.map((row) => row.join('')).join('\n');
}

// ---------------------------------------------------------------------------------------------
// Box generation
// ---------------------------------------------------------------------------------------------

function glyphMaterial(ch: string): MaterialId {
  switch (ch) {
    case 'T': return 'metal';
    case 'C': case 'c': return 'crate';
    case 'P': return 'foliage';
    case 'v': case 'w': return 'thin';
    case 'g': case 'l': return 'glass';
    case '1': case '2': case '3': case '4': return 'platform';
    default: return 'concrete';
  }
}

function buildBoxes(): Box[] {
  const boxes: Box[] = [];
  const push = (b: Omit<Box, 'id'>) => boxes.push({ ...b, id: boxes.length });

  // Merge cell runs of identical glyph into rectangles (solid cell glyphs only).
  const solid = new Set(['#', 'T', 'C', 'c', 'H', 'P', '1', '2', '3', '4']);
  const used: boolean[][] = GRID.map((row) => row.map(() => false));
  for (let r = 0; r < GRID_H; r++) {
    for (let c = 0; c < GRID_W; c++) {
      const ch = GRID[r][c];
      if (!solid.has(ch) || used[r][c]) continue;
      let c1 = c;
      while (c1 + 1 < GRID_W && GRID[r][c1 + 1] === ch && !used[r][c1 + 1]) c1++;
      let r1 = r;
      outer: while (r1 + 1 < GRID_H) {
        for (let k = c; k <= c1; k++) if (GRID[r1 + 1][k] !== ch || used[r1 + 1][k]) break outer;
        r1++;
      }
      for (let rr = r; rr <= r1; rr++) for (let cc = c; cc <= c1; cc++) used[rr][cc] = true;
      push({ x0: c * CELL, x1: (c1 + 1) * CELL, z0: r * CELL, z1: (r1 + 1) * CELL, y0: 0, y1: GLYPH_HEIGHT[ch], mat: glyphMaterial(ch), glyph: ch });
    }
  }

  // Thin walls (E-W: w, g ; N-S: v, l) run through the middle of their cells, merged along their axis.
  const thinSpec: Array<{ ch: string; ns: boolean }> = [
    { ch: 'w', ns: false }, { ch: 'g', ns: false }, { ch: 'v', ns: true }, { ch: 'l', ns: true },
  ];
  for (const { ch, ns } of thinSpec) {
    const seen: boolean[][] = GRID.map((row) => row.map(() => false));
    for (let r = 0; r < GRID_H; r++) {
      for (let c = 0; c < GRID_W; c++) {
        if (GRID[r][c] !== ch || seen[r][c]) continue;
        let r1 = r, c1 = c;
        if (ns) { while (r1 + 1 < GRID_H && GRID[r1 + 1][c] === ch) r1++; } else { while (c1 + 1 < GRID_W && GRID[r][c1 + 1] === ch) c1++; }
        for (let rr = r; rr <= r1; rr++) for (let cc = c; cc <= c1; cc++) seen[rr][cc] = true;
        const mat = glyphMaterial(ch);
        if (ns) {
          const cx = (c + 0.5) * CELL;
          push({ x0: cx - THIN_T / 2, x1: cx + THIN_T / 2, z0: r * CELL, z1: (r1 + 1) * CELL, y0: 0, y1: THIN_H, mat, glyph: ch });
        } else {
          const cz = (r + 0.5) * CELL;
          push({ x0: c * CELL, x1: (c1 + 1) * CELL, z0: cz - THIN_T / 2, z1: cz + THIN_T / 2, y0: 0, y1: THIN_H, mat, glyph: ch });
        }
      }
    }
  }

  // Crawl ducts: a lintel with clearance for a crouched player only.
  const seenK: boolean[][] = GRID.map((row) => row.map(() => false));
  for (let r = 0; r < GRID_H; r++) {
    for (let c = 0; c < GRID_W; c++) {
      if (GRID[r][c] !== 'k' || seenK[r][c]) continue;
      let r1 = r;
      while (r1 + 1 < GRID_H && GRID[r1 + 1][c] === 'k') r1++;
      for (let rr = r; rr <= r1; rr++) seenK[rr][c] = true;
      push({ x0: c * CELL, x1: (c + 1) * CELL, z0: r * CELL, z1: (r1 + 1) * CELL, y0: CRAWL_CLEAR, y1: WALL_H, mat: 'concrete', glyph: 'k' });
    }
  }
  return boxes;
}

export const BOXES: Box[] = buildBoxes();

// ---------------------------------------------------------------------------------------------
// Zones, spawns, callouts
// ---------------------------------------------------------------------------------------------

const cellRect = (c0: number, r0: number, c1: number, r1: number) => ({ x0: c0 * CELL, z0: r0 * CELL, x1: (c1 + 1) * CELL, z1: (r1 + 1) * CELL });

export const SITES: Record<'A' | 'B', Zone> = {
  A: { name: 'A', ...cellRect(6, 8, 10, 12) },
  B: { name: 'B', ...cellRect(38, 5, 44, 10) },
};

export const SPAWNS: { cus: SpawnPoint[]; int: SpawnPoint[] } = {
  cus: [
    { x: 40, z: 5, yaw: Math.PI }, { x: 44, z: 5, yaw: Math.PI }, { x: 48, z: 5, yaw: Math.PI },
    { x: 52, z: 5, yaw: Math.PI }, { x: 56, z: 5, yaw: Math.PI },
  ],
  int: [
    { x: 40, z: 66, yaw: 0 }, { x: 44, z: 66, yaw: 0 }, { x: 48, z: 66, yaw: 0 },
    { x: 52, z: 66, yaw: 0 }, { x: 56, z: 66, yaw: 0 },
  ],
};

/** Buy zones are the protected spawn areas. */
export const BUY_ZONES: { cus: Zone; int: Zone } = {
  cus: { name: 'Atrium', ...cellRect(17, 1, 30, 7) },
  int: { name: 'Yard', ...cellRect(15, 31, 32, 34) },
};

/** Later entries win when callouts overlap. */
export const CALLOUTS: Callout[] = [
  { name: 'Atrium', ...cellRect(17, 1, 30, 7) },
  { name: 'West Link', ...cellRect(14, 4, 16, 5) },
  { name: 'East Link', ...cellRect(31, 4, 33, 5) },
  { name: 'Mid Gate', ...cellRect(23, 8, 24, 8) },
  { name: 'Calibration', ...cellRect(19, 9, 28, 21) },
  { name: 'Mid Deck', ...cellRect(22, 13, 25, 17) },
  { name: 'Cal Ramp', ...cellRect(22, 22, 24, 26) },
  { name: 'Turbine Ramp', ...cellRect(14, 13, 18, 14) },
  { name: 'Lab Link', ...cellRect(29, 13, 33, 14) },
  { name: 'Turbine Hall', ...cellRect(2, 2, 13, 15) },
  { name: 'Gantry', ...cellRect(2, 2, 4, 5) },
  { name: 'Fallback Lane', ...cellRect(12, 7, 13, 12) },
  { name: 'A Site', ...cellRect(6, 8, 10, 12) },
  { name: 'Dock Lane', ...cellRect(3, 16, 4, 28) },
  { name: 'Cargo Lane', ...cellRect(9, 16, 10, 26) },
  { name: 'Hydroponics', ...cellRect(34, 2, 45, 14) },
  { name: 'B Site', ...cellRect(38, 5, 44, 10) },
  { name: 'Glass Corridor', ...cellRect(41, 15, 45, 30) },
  { name: 'Crawl', ...cellRect(37, 15, 37, 26) },
  { name: 'Freight Yard', ...cellRect(8, 27, 39, 34) },
  { name: 'West Dock', ...cellRect(3, 28, 8, 30) },
  { name: 'East Gate', ...cellRect(39, 28, 42, 30) },
];

export function calloutAt(x: number, z: number): string {
  let name = '';
  for (const c of CALLOUTS) if (x >= c.x0 && x <= c.x1 && z >= c.z0 && z <= c.z1) name = c.name;
  return name;
}

export function inZone(z: Zone, x: number, zz: number): boolean {
  return x >= z.x0 && x <= z.x1 && zz >= z.z0 && zz <= z.z1;
}

export const MAP_WIDTH = GRID_W * CELL;
export const MAP_HEIGHT = GRID_H * CELL;

/** Floor theme per cell for the renderer / minimap. */
export type Theme = 'yard' | 'atrium' | 'turbine' | 'hydro' | 'mid' | 'corridor';
export function themeAt(c: number, r: number): Theme {
  if (c >= 2 && c <= 13 && r >= 2 && r <= 15) return 'turbine';
  if (c >= 34 && c <= 45 && r >= 2 && r <= 14) return 'hydro';
  if (c >= 17 && c <= 30 && r >= 1 && r <= 7) return 'atrium';
  if (c >= 19 && c <= 28 && r >= 9 && r <= 21) return 'mid';
  if (r >= 27 && c >= 8 && c <= 39) return 'yard';
  return 'corridor';
}

// ---------------------------------------------------------------------------------------------
// Broad-phase: per-cell lists of overlapping boxes
// ---------------------------------------------------------------------------------------------

const cellBoxes: Box[][] = [];
for (let i = 0; i < GRID_W * GRID_H; i++) cellBoxes.push([]);
for (const b of BOXES) {
  const c0 = Math.max(0, Math.floor(b.x0 / CELL)), c1 = Math.min(GRID_W - 1, Math.floor((b.x1 - 1e-6) / CELL));
  const r0 = Math.max(0, Math.floor(b.z0 / CELL)), r1 = Math.min(GRID_H - 1, Math.floor((b.z1 - 1e-6) / CELL));
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) cellBoxes[r * GRID_W + c].push(b);
}

const scratch: Box[] = [];
const stamp = new Int32Array(BOXES.length + 8);
let stampId = 0;
/** Boxes overlapping the xz rectangle [x0,x1]x[z0,z1]. The returned array is reused between calls. */
export function boxesInRect(x0: number, z0: number, x1: number, z1: number): Box[] {
  scratch.length = 0;
  stampId++;
  const c0 = Math.max(0, Math.floor(x0 / CELL)), c1 = Math.min(GRID_W - 1, Math.floor(x1 / CELL));
  const r0 = Math.max(0, Math.floor(z0 / CELL)), r1 = Math.min(GRID_H - 1, Math.floor(z1 / CELL));
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      for (const b of cellBoxes[r * GRID_W + c]) {
        if (stamp[b.id] === stampId) continue;
        stamp[b.id] = stampId;
        scratch.push(b);
      }
    }
  }
  return scratch;
}

/** Versioned collision hash, identical for client and server builds. */
export const MAP_HASH: string = hashString(
  BOXES.map((b) => [b.x0, b.y0, b.z0, b.x1, b.y1, b.z1, b.mat].join(',')).join(';'),
);
export const MAP_VERSION = 1;
