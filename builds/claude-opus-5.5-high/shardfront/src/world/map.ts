// Glass Ravine — original 1v1 map. Point-symmetric gameplay layout (180° rotation about the
// center) with cosmetic, non-gameplay asymmetry in decoration placement.
//
// Coordinates: x grows right (east), y grows down (south) when viewed with the default camera.
// One cell == one world unit. Player 0 spawns bottom-left, player 1 top-right.

export const MAP_SIZE = 144;

export const F_WALK = 1;   // ground units may stand here (static)
export const F_BUILD = 2;  // structures may be placed here (static)
export const F_HOVER = 4;  // hovering units may pass
export const F_BRUSH = 8;  // blocks vision, not movement
export const F_RAMP = 16;
export const F_CHASM = 32; // hover-only void
export const F_CLIFF = 64;
export const F_ROCK = 128;

export interface ResourceSpot { kind: 'ore' | 'vent'; x: number; y: number; amount: number; base: number }
export interface BaseSpot { id: number; x: number; y: number; kind: 'main' | 'natural' | 'side' | 'center'; owner: number }
export interface Pt { x: number; y: number }

export interface GameMap {
  name: string;
  size: number;
  level: Uint8Array;     // discrete gameplay elevation 0..2
  flags: Uint8Array;
  /** smooth render height per vertex ((size+1)^2) */
  vheight: Float32Array;
  bases: BaseSpot[];
  resources: ResourceSpot[];
  pylons: Pt[];
  pods: Pt[];
  barriers: { x: number; y: number; cells: number[] }[]; // destructible crystal barriers sealing the lower route
  bridges: { x: number; y: number; dx: number; dy: number; len: number; width: number }[];
  starts: Pt[];          // HQ center per player
  decor: { kind: 'crystal' | 'rock' | 'spire'; x: number; y: number; s: number; r: number }[];
  brushPatches: { x: number; y: number; r: number }[];
}

const LEVEL_H = 2.2; // world height per gameplay level

function capsuleDist(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
  const qx = ax + dx * t - px, qy = ay + dy * t - py;
  return Math.sqrt(qx * qx + qy * qy);
}

/** small deterministic hash rng for cosmetic decoration */
function hashRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createGlassRavine(): GameMap {
  const N = MAP_SIZE;
  const level = new Uint8Array(N * N);
  const flags = new Uint8Array(N * N);
  const idx = (x: number, y: number) => y * N + x;
  const mirror = (p: Pt): Pt => ({ x: N - p.x, y: N - p.y });

  // ---------- gameplay shapes for player 0 (mirrored for player 1) ----------
  const mainC = { x: 17, y: 127 };
  const mainR = 25;
  const ramp0 = { ax: 39, ay: 113, bx: 45, by: 108, r: 3.2 }; // main -> natural ramp
  const naturalHQ = { x: 56, y: 129 };
  const sideHQ = { x: 118, y: 130 };
  // rock ridges forming the natural's front choke and its alternate back path
  const ridges0 = [
    { ax: 28, ay: 103, bx: 50, by: 99, r: 2.4 },
    { ax: 50, ay: 99, bx: 66, by: 97, r: 2.4 },
    { ax: 76, ay: 101, bx: 82, by: 132, r: 2.4 },
    { ax: 34, ay: 80, bx: 46, by: 74, r: 2.0 },
    { ax: 96, ay: 124, bx: 100, by: 114, r: 2.2 },
  ];
  // center basin (level 0) and its ramps
  const basin = { x: 72, y: 72, r: 17 };
  const basinRamp0 = { ax: 60, ay: 86, bx: 56, by: 90, r: 3.0 };
  const basinRamp0b = { ax: 78, ay: 86, bx: 80, by: 90, r: 2.6 };

  const inMain = (x: number, y: number, c: Pt) => Math.hypot(x - c.x, y - c.y) < mainR;

  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const cx = x + 0.5, cy = y + 0.5;
      let lv = 1;
      if (inMain(cx, cy, mainC) || inMain(cx, cy, mirror(mainC))) lv = 2;
      if (Math.hypot(cx - basin.x, cy - basin.y) < basin.r) lv = 0;
      level[idx(x, y)] = lv;
      flags[idx(x, y)] = F_WALK | F_BUILD | F_HOVER;
    }
  }

  const applyBoth = (fn: (cx: number, cy: number) => boolean, set: (i: number) => void) => {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const cx = x + 0.5, cy = y + 0.5;
      if (fn(cx, cy) || fn(N - cx, N - cy)) set(idx(x, y));
    }
  };

  // ramps
  const rampShapes = [ramp0, basinRamp0, basinRamp0b];
  applyBoth((cx, cy) => rampShapes.some((r) => capsuleDist(cx, cy, r.ax, r.ay, r.bx, r.by) < r.r), (i) => { flags[i] |= F_RAMP; });

  // chasm along the TL-BR diagonal, with bridges and a central gap (filled by barriers)
  const bridges = [
    { x: 36, y: 36, dx: 0.7071, dy: -0.7071, len: 12, width: 5 },
    { x: 108, y: 108, dx: 0.7071, dy: -0.7071, len: 12, width: 5 },
  ];
  const gapCells: number[] = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const cx = x + 0.5, cy = y + 0.5;
    const d = Math.abs(cy - cx) / Math.SQRT2;
    const along = (cx + cy) / Math.SQRT2; // distance along diagonal
    const centerAlong = N / Math.SQRT2;
    const ac = Math.abs(along - N / Math.SQRT2); // symmetric about the center
    const width = 2.6 + 0.8 * Math.sin(ac * 0.21 + 0.4) + 0.5 * Math.sin(ac * 0.53 + 1.3);
    if (d < width) {
      const nearCenterGap = Math.abs(along - centerAlong) < 3.1;
      let onBridge = false;
      for (const b of bridges) {
        const ox = cx - b.x, oy = cy - b.y;
        const a = Math.abs(ox * b.dx + oy * b.dy);
        const p = Math.abs(ox * -b.dy + oy * b.dx);
        if (a < b.len / 2 && p < b.width / 2) onBridge = true;
      }
      const i = idx(x, y);
      if (!onBridge && !nearCenterGap) {
        flags[i] = F_HOVER | F_CHASM;
      } else if (onBridge) {
        flags[i] = (flags[i] & ~F_BUILD) | F_RAMP; // bridge deck: walkable, not buildable, no cliffs
        level[i] = 1;
      } else {
        flags[i] &= ~F_BUILD;
        gapCells.push(i);
      }
    }
  }

  // rock ridges (blocked)
  const ridgeShapes = ridges0;
  applyBoth((cx, cy) => ridgeShapes.some((r) => capsuleDist(cx, cy, r.ax, r.ay, r.bx, r.by) < r.r), (i) => {
    flags[i] = F_HOVER | F_ROCK;
  });

  // map border: 2 cells blocked for ground; hover can't leave bounds either (handled by clamp)
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (x < 2 || y < 2 || x >= N - 2 || y >= N - 2) flags[idx(x, y)] = F_ROCK | F_HOVER;
  }

  // cliffs: higher cell adjacent to a lower non-ramp cell becomes a cliff (blocked)
  const cliff = new Uint8Array(N * N);
  for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) {
    const i = idx(x, y);
    if (flags[i] & (F_RAMP | F_CHASM)) continue;
    const lv = level[i];
    let isCliff = false;
    for (let oy = -1; oy <= 1 && !isCliff; oy++) for (let ox = -1; ox <= 1; ox++) {
      const j = idx(x + ox, y + oy);
      if (level[j] < lv && !(flags[j] & F_RAMP)) { isCliff = true; break; }
    }
    if (isCliff) cliff[i] = 1;
  }
  for (let i = 0; i < N * N; i++) if (cliff[i]) flags[i] = F_HOVER | F_CLIFF;
  // ramps never buildable; buffer around ramps not buildable either
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (!(flags[idx(x, y)] & F_RAMP)) continue;
    for (let oy = -2; oy <= 2; oy++) for (let ox = -2; ox <= 2; ox++) {
      const xx = x + ox, yy = y + oy;
      if (xx >= 0 && yy >= 0 && xx < N && yy < N) flags[idx(xx, yy)] &= ~F_BUILD;
    }
  }
  // ramp cells adopt the lower level for vision (you can't see up a ramp until you're on top)
  for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) {
    const i = idx(x, y);
    if (!(flags[i] & F_RAMP) || (flags[i] & F_CHASM)) continue;
    // bridges keep level 1
  }

  // brush patches (vision blocking, walkable, not buildable)
  const brush0 = [
    { x: 46, y: 50, r: 3.4 }, { x: 28, y: 62, r: 3.0 }, { x: 62, y: 104, r: 2.6 },
    { x: 86, y: 108, r: 3.0 }, { x: 104, y: 92, r: 2.8 }, { x: 70, y: 80, r: 2.4 },
  ];
  const brushPatches = [...brush0, ...brush0.map((b) => ({ ...mirror(b), r: b.r }))];
  for (const b of brush0) {
    for (let y = Math.floor(b.y - b.r - 1); y <= b.y + b.r + 1; y++) for (let x = Math.floor(b.x - b.r - 1); x <= b.x + b.r + 1; x++) {
      if (x < 0 || y < 0 || x >= N || y >= N) continue;
      const wob = 0.6 * Math.sin((x - b.x) * 1.7 + (y - b.y) * 0.9);
      if (Math.hypot(x + 0.5 - b.x, y + 0.5 - b.y) < b.r + wob) {
        for (const i of [idx(x, y), idx(N - 1 - x, N - 1 - y)]) if (flags[i] & F_WALK) { flags[i] |= F_BRUSH; flags[i] &= ~F_BUILD; }
      }
    }
  }

  // ---------- bases & resources ----------
  const bases: BaseSpot[] = [];
  const resources: ResourceSpot[] = [];
  const addBase = (hq: Pt, kind: BaseSpot['kind'], owner: number, oreDir: Pt, ventDir: Pt, oreAmount: number, oreCount: number, ventAmount: number) => {
    const id = bases.length;
    bases.push({ id, x: hq.x, y: hq.y, kind, owner });
    const len = Math.hypot(oreDir.x, oreDir.y);
    const dx = oreDir.x / len, dy = oreDir.y / len;
    const px = -dy, py = dx;
    for (let k = 0; k < oreCount; k++) {
      const t = (k - (oreCount - 1) / 2) * 1.85;
      const bend = 0.12 * t * t;
      resources.push({ kind: 'ore', x: Math.round(hq.x + dx * (7.6 + bend) + px * t), y: Math.round(hq.y + dy * (7.6 + bend) + py * t), amount: oreAmount, base: id });
    }
    if (ventAmount > 0) {
      const vl = Math.hypot(ventDir.x, ventDir.y);
      resources.push({ kind: 'vent', x: Math.round(hq.x + (ventDir.x / vl) * 8), y: Math.round(hq.y + (ventDir.y / vl) * 8), amount: ventAmount, base: id });
    }
  };
  const ORE_MAIN = 1200, ORE_EXP = 1000, VENT = 2200;
  const p0 = [
    { hq: mainC, kind: 'main' as const, ore: { x: -1, y: 0.75 }, vent: { x: 0.7, y: -1 }, oa: ORE_MAIN, oc: 7, va: VENT },
    { hq: naturalHQ, kind: 'natural' as const, ore: { x: 0, y: 1 }, vent: { x: 1, y: -0.15 }, oa: ORE_EXP, oc: 6, va: VENT },
    { hq: sideHQ, kind: 'side' as const, ore: { x: 1, y: 0.6 }, vent: { x: -0.9, y: 0.6 }, oa: ORE_EXP, oc: 6, va: VENT },
  ];
  for (const b of p0) addBase(b.hq, b.kind, b.kind === 'main' ? 0 : -1, b.ore, b.vent, b.oa, b.oc, b.va);
  for (const b of p0) addBase(mirror(b.hq), b.kind, b.kind === 'main' ? 1 : -1, { x: -b.ore.x, y: -b.ore.y }, { x: -b.vent.x, y: -b.vent.y }, b.oa, b.oc, b.va);
  // depleted central field: a few low-yield seams around the basin floor (no HQ spot)
  const centerOre: Pt[] = [{ x: 66, y: 76 }, { x: 64, y: 72 }, { x: 78, y: 68 }, { x: 80, y: 72 }];
  bases.push({ id: bases.length, x: 72, y: 72, kind: 'center', owner: -1 });
  for (const p of centerOre) resources.push({ kind: 'ore', x: p.x, y: p.y, amount: 300, base: bases.length - 1 });

  const pylons = [{ x: 26, y: 44 }, mirror({ x: 26, y: 44 })];
  const pods = [{ x: 8, y: 84 }, mirror({ x: 8, y: 84 }), { x: 92, y: 140 }, mirror({ x: 92, y: 140 })];
  // two crystal barriers sealing the central lower route; each owns half of the gap cells
  const barriers: GameMap['barriers'] = [{ x: 70.6, y: 70.6, cells: [] }, { x: 73.4, y: 73.4, cells: [] }];
  for (const i of gapCells) {
    const x = i % N, y = (i / N) | 0;
    (x + y + 1 < N ? barriers[0] : barriers[1]).cells.push(i);
  }

  // keep resource / HQ footprints clear of brush & ensure walkable
  const clearAround = (p: Pt, r: number) => {
    for (let y = Math.floor(p.y - r); y <= p.y + r; y++) for (let x = Math.floor(p.x - r); x <= p.x + r; x++) {
      if (x < 2 || y < 2 || x >= N - 2 || y >= N - 2) continue;
      const i = idx(x, y);
      if (flags[i] & F_WALK) flags[i] &= ~F_BRUSH;
    }
  };
  for (const b of bases) clearAround(b, 4);

  // ---------- render heights ----------
  const V = N + 1;
  const vheight = new Float32Array(V * V);
  // base height per cell, cliffs take the average of their neighbors to form slopes
  const cellH = new Float32Array(N * N);
  for (let i = 0; i < N * N; i++) cellH[i] = level[i] * LEVEL_H;
  for (let i = 0; i < N * N; i++) if (flags[i] & F_CHASM) cellH[i] = -6;
  // ramps: blend
  const smooth = new Float32Array(N * N);
  for (let pass = 0; pass < 3; pass++) {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = idx(x, y);
      const f = flags[i];
      if (f & F_CHASM) { smooth[i] = cellH[i]; continue; }
      if (f & (F_RAMP | F_CLIFF)) {
        let sum = 0, n = 0;
        for (let oy = -2; oy <= 2; oy++) for (let ox = -2; ox <= 2; ox++) {
          const xx = Math.min(N - 1, Math.max(0, x + ox)), yy = Math.min(N - 1, Math.max(0, y + oy));
          const j = idx(xx, yy);
          if (flags[j] & F_CHASM) continue;
          sum += cellH[j]; n++;
        }
        smooth[i] = n ? sum / n : cellH[i];
      } else smooth[i] = cellH[i];
    }
    // keep bridge decks flat at level 1
    for (let i = 0; i < N * N; i++) if ((flags[i] & F_RAMP) && level[i] === 1 && isBridgeCell(i)) smooth[i] = LEVEL_H;
    cellH.set(smooth);
  }
  function isBridgeCell(i: number) {
    const x = i % N, y = (i / N) | 0;
    return Math.abs(y - x) < 8 && (Math.abs(x - 36) < 9 || Math.abs(x - 108) < 9);
  }
  const rng = hashRng(1337);
  for (let y = 0; y < V; y++) for (let x = 0; x < V; x++) {
    let sum = 0, n = 0, chasm = 0, rock = 0;
    for (let oy = -1; oy <= 0; oy++) for (let ox = -1; ox <= 0; ox++) {
      const xx = Math.min(N - 1, Math.max(0, x + ox)), yy = Math.min(N - 1, Math.max(0, y + oy));
      const j = idx(xx, yy);
      sum += cellH[j]; n++;
      if (flags[j] & F_CHASM) chasm++;
      if (flags[j] & F_ROCK) rock++;
    }
    let h = sum / n;
    if (chasm > 0 && chasm < 4) h = Math.max(h, -2.5); // soft rim
    if (rock === 4) h += 1.6 + rng() * 1.2;
    // gentle surface undulation (render only)
    h += 0.12 * Math.sin(x * 0.37 + y * 0.11) + 0.09 * Math.sin(y * 0.41 - x * 0.07);
    vheight[y * V + x] = h;
  }

  // smooth the ravine walls (render only): relax vertices touching chasm cells
  const nearChasm = new Uint8Array(V * V);
  for (let y = 0; y < V; y++) for (let x = 0; x < V; x++) {
    for (let oy = -2; oy <= 1 && !nearChasm[y * V + x]; oy++) for (let ox = -2; ox <= 1; ox++) {
      const xx = Math.min(N - 1, Math.max(0, x + ox)), yy = Math.min(N - 1, Math.max(0, y + oy));
      if (flags[idx(xx, yy)] & F_CHASM) { nearChasm[y * V + x] = 1; break; }
    }
  }
  const tmpH = new Float32Array(V * V);
  for (let it = 0; it < 4; it++) {
    tmpH.set(vheight);
    for (let y = 1; y < V - 1; y++) for (let x = 1; x < V - 1; x++) {
      const i = y * V + x;
      if (!nearChasm[i]) continue;
      vheight[i] = (tmpH[i] * 2 + tmpH[i - 1] + tmpH[i + 1] + tmpH[i - V] + tmpH[i + V]) / 6;
    }
  }

  // ---------- decoration (cosmetic; intentionally not mirrored) ----------
  const decor: GameMap['decor'] = [];
  for (let k = 0; k < 520; k++) {
    const x = 2 + rng() * (N - 4), y = 2 + rng() * (N - 4);
    const f = flags[idx(x | 0, y | 0)];
    if (f & F_CLIFF) { if (rng() < 0.55) decor.push({ kind: rng() < 0.5 ? 'crystal' : 'rock', x, y, s: 0.6 + rng() * 0.9, r: rng() * 6.28 }); }
    else if (f & F_ROCK) decor.push({ kind: rng() < 0.3 ? 'spire' : 'rock', x, y, s: 0.8 + rng() * 1.4, r: rng() * 6.28 });
    else if ((f & F_CHASM) && rng() < 0.35) decor.push({ kind: 'crystal', x, y, s: 0.5 + rng() * 0.8, r: rng() * 6.28 });
  }

  return {
    name: 'Glass Ravine', size: N, level, flags, vheight, bases, resources, pylons, pods, barriers, bridges,
    starts: [{ ...mainC }, mirror(mainC)], decor, brushPatches,
  };
}

export const LEVEL_HEIGHT = LEVEL_H;

/** render-space terrain height at a world position (bilinear over vertex heights) */
export function terrainHeight(map: GameMap, x: number, y: number): number {
  const V = map.size + 1;
  const fx = Math.min(map.size - 0.001, Math.max(0, x));
  const fy = Math.min(map.size - 0.001, Math.max(0, y));
  const x0 = fx | 0, y0 = fy | 0;
  const tx = fx - x0, ty = fy - y0;
  const h00 = map.vheight[y0 * V + x0], h10 = map.vheight[y0 * V + x0 + 1];
  const h01 = map.vheight[(y0 + 1) * V + x0], h11 = map.vheight[(y0 + 1) * V + x0 + 1];
  return (h00 * (1 - tx) + h10 * tx) * (1 - ty) + (h01 * (1 - tx) + h11 * tx) * ty;
}
