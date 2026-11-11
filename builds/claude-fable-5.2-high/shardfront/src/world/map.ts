// world: Glass Ravine — a procedurally authored, 180°-rotationally symmetric 1v1 map.
// Gameplay elevation is discrete per cell; render heights are derived per vertex.

export const MAP_SIZE = 160;
export const VIS_CELL = 2;
export const VIS_SIZE = MAP_SIZE / VIS_CELL;

export const F_WALK = 1;
export const F_BUILD = 2;
export const F_BRUSH = 4;
export const F_CHASM = 8;
export const F_ROCK = 16;
export const F_RAMP = 32;
export const F_BRIDGE = 64;
export const F_CLIFF = 128;

export const H_LOW = -3.2;
export const H_MID = 0;
export const H_HIGH = 3.2;

export type SiteKind = 'main' | 'natural' | 'side' | 'center';

export interface MapResource { kind: 'ore' | 'vent'; x: number; z: number; amount: number; site: number }
export interface MapSite { kind: SiteKind; x: number; z: number; /** player whose spawn this site leans toward, -1 = contested */ owner: number }
export interface MapBarrier { x: number; z: number; cells: number[] }

export interface GameMap {
  name: string;
  size: number;
  flags: Uint8Array;
  /** discrete gameplay elevation 0..3 (3 = impassable rock) */
  elev: Uint8Array;
  cellH: Float32Array;
  /** (size+1)^2 vertex heights used by both the terrain mesh and unit height sampling */
  vertH: Float32Array;
  starts: { x: number; z: number }[];
  sites: MapSite[];
  resources: MapResource[];
  pylons: { x: number; z: number }[];
  barriers: MapBarrier[];
  pods: { x: number; z: number }[];
  /** vision-grid data */
  visElev: Uint8Array;
  visBrush: Uint8Array;
}

function hash2(x: number, z: number): number {
  let h = (Math.imul(x, 374761393) + Math.imul(z, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

interface Cell { flags: number; elev: number; h: number }

/** Features authored in player 0's frame (bottom-left spawn); applied again rotated 180° for player 1. */
function sideFeature(px: number, pz: number): Cell | null {
  // --- main plateau (high ground) with a diagonal cut toward the map centre
  const dPlat = Math.max(6 - px, px - 52, 106 - pz, pz - 154, (px - pz + 62) * 0.7071);
  const inRamp = px > 52 && px < 57 && pz >= 128 && pz < 138;
  if (inRamp) {
    const h = H_HIGH * Math.min(1, Math.max(0, (57 - px) / 5));
    return { flags: F_WALK | F_RAMP, elev: h >= 1.6 ? 2 : 1, h };
  }
  if (dPlat <= 0) return { flags: F_WALK | F_BUILD, elev: 2, h: H_HIGH };
  if (dPlat <= 2.5) return { flags: F_CLIFF, elev: 2, h: H_HIGH * (1 - dPlat / 2.6) + 0.4 };
  // --- natural pocket ridges
  if (pz >= 114 && pz < 118 && px >= 55 && px < 104 && !(px >= 70 && px < 80)) return { flags: F_ROCK, elev: 3, h: 4.4 };
  if (px >= 100 && px < 104 && pz >= 114 && pz < 156 && !(pz >= 130 && pz < 138)) return { flags: F_ROCK, elev: 3, h: 4.4 };
  // --- rock outcrops shaping the mid lanes
  if (Math.hypot(px - 52, pz - 84) < 6.5) return { flags: F_ROCK, elev: 3, h: 4.0 };
  if (Math.hypot(px - 96, pz - 100) < 5.5) return { flags: F_ROCK, elev: 3, h: 4.0 };
  if (Math.hypot(px - 24, pz - 60) < 4.5) return { flags: F_ROCK, elev: 3, h: 3.6 };
  // --- brush (blocks vision, not movement)
  if (Math.hypot(px - 64, pz - 99) < 5 || Math.hypot(px - 30, pz - 74) < 5.5 || Math.hypot(px - 113, pz - 126) < 4.5) {
    return { flags: F_WALK | F_BUILD | F_BRUSH, elev: 1, h: H_MID };
  }
  if (Math.hypot(px - 70, pz - 76) < 3.6) return { flags: F_WALK | F_BUILD | F_BRUSH, elev: 0, h: H_LOW };
  return null;
}

function centralFeature(cx: number, cz: number): Cell | null {
  const u = cx - cz;
  const t = (cx + cz) / 2;
  const rb = Math.hypot(cx - 80, cz - 80);
  if (rb < 18) return { flags: F_WALK | F_BUILD, elev: 0, h: H_LOW };
  if (rb < 21.5) {
    const k = Math.min(1, Math.max(0, (rb - 18) / 3.5));
    if (Math.abs(t - 80) < 5) return { flags: F_WALK | F_RAMP, elev: k > 0.5 ? 1 : 0, h: H_LOW * (1 - k) };
    return { flags: F_CLIFF, elev: 1, h: H_LOW * (1 - k) + 0.3 };
  }
  if (Math.abs(u) <= 5.5 && t >= 30 && t <= 130) {
    if (Math.abs(t - 44) < 4 || Math.abs(t - 116) < 4) return { flags: F_WALK | F_BRIDGE, elev: 1, h: -9 };
    if (Math.abs(t - 60) < 2.6 || Math.abs(t - 100) < 2.6) return { flags: F_WALK, elev: 1, h: H_MID };
    return { flags: F_CHASM, elev: 1, h: -9 };
  }
  return null;
}

let cached: GameMap | null = null;

/** Build (or return the cached) static map. The map is immutable; dynamic occupancy lives in the simulation. */
export function getMap(): GameMap {
  if (cached) return cached;
  const S = MAP_SIZE;
  const flags = new Uint8Array(S * S);
  const elev = new Uint8Array(S * S);
  const cellH = new Float32Array(S * S);
  for (let z = 0; z < S; z++) {
    for (let x = 0; x < S; x++) {
      const cx = x + 0.5, cz = z + 0.5;
      let c: Cell | null = null;
      if (x < 4 || z < 4 || x >= S - 4 || z >= S - 4) {
        const edge = Math.min(x, z, S - 1 - x, S - 1 - z);
        c = { flags: F_ROCK, elev: 3, h: 4.5 + (4 - edge) * 0.9 };
      }
      if (!c) c = sideFeature(cx, cz) ?? sideFeature(S - cx, S - cz) ?? centralFeature(cx, cz);
      if (!c) c = { flags: F_WALK | F_BUILD, elev: 1, h: H_MID };
      const i = z * S + x;
      flags[i] = c.flags; elev[i] = c.elev; cellH[i] = c.h;
    }
  }
  // vertex heights: flats stay flat right up to their edges; slopes live inside blocked cells
  const V = S + 1;
  const vertH = new Float32Array(V * V);
  for (let j = 0; j < V; j++) {
    for (let i = 0; i < V; i++) {
      let sw = 0, nw = 0, sa = 0, na = 0;
      for (let dz = -1; dz <= 0; dz++) {
        for (let dx = -1; dx <= 0; dx++) {
          const x = Math.min(S - 1, Math.max(0, i + dx)), z = Math.min(S - 1, Math.max(0, j + dz));
          const f = flags[z * S + x], h = cellH[z * S + x];
          sa += h; na++;
          if ((f & F_WALK) && !(f & F_BRIDGE)) { sw += h; nw++; }
        }
      }
      let h = nw > 0 ? sw / nw : sa / na;
      if (nw === 0) h += (hash2(i, j) - 0.5) * 1.3;
      vertH[j * V + i] = h;
    }
  }

  const rot = (p: { x: number; z: number }) => ({ x: S - p.x, z: S - p.z });
  const sites: MapSite[] = [];
  const resources: MapResource[] = [];
  const addField = (site: number, hx: number, hz: number, a0: number, a1: number, n: number, amount: number, vents: [number, number][], flip: boolean) => {
    const used = new Set<string>();
    for (let k = 0; k < n; k++) {
      const a = ((a0 + ((a1 - a0) * k) / (n - 1)) * Math.PI) / 180;
      let x = Math.round(hx + Math.cos(a) * 9), z = Math.round(hz + Math.sin(a) * 9);
      while (used.has(`${x},${z}`)) x += 2;
      used.add(`${x},${z}`);
      const p = flip ? rot({ x, z }) : { x, z };
      resources.push({ kind: 'ore', x: p.x, z: p.z, amount, site });
    }
    for (const v of vents) {
      const p = flip ? rot({ x: v[0], z: v[1] }) : { x: v[0], z: v[1] };
      resources.push({ kind: 'vent', x: p.x, z: p.z, amount: 2400, site });
    }
  };
  // site order: p0 main, p0 natural, p0-leaning side, p1 main, p1 natural, p1-leaning side, centre
  for (const flip of [false, true]) {
    const o = flip ? 1 : 0;
    const base = sites.length;
    const m = { x: 24, z: 134 }, n = { x: 80, z: 138 }, s = { x: 139, z: 139 };
    sites.push({ kind: 'main', ...(flip ? rot(m) : m), owner: o });
    sites.push({ kind: 'natural', ...(flip ? rot(n) : n), owner: o });
    sites.push({ kind: 'side', ...(flip ? rot(s) : s), owner: o });
    addField(base, m.x, m.z, 78, 202, 8, 1400, [[33, 145], [13, 124]], flip);
    addField(base + 1, n.x, n.z, 20, 140, 6, 1400, [[69, 144]], flip);
    addField(base + 2, s.x, s.z, -18, 108, 7, 1600, [[130, 144]], flip);
  }
  sites.push({ kind: 'center', x: 80, z: 80, owner: -1 });
  for (const p of [[76, 80], [84, 80], [80, 76], [80, 84]]) resources.push({ kind: 'ore', x: p[0], z: p[1], amount: 300, site: 6 });

  const pylonA = { x: 38, z: 54 };
  const pylons = [pylonA, rot(pylonA)];
  const podA = { x: 22, z: 86 }, podB = { x: 116, z: 146 };
  const pods = [podA, podB, rot(podA), rot(podB)];

  // destructible crystal barriers: natural back doors and the two crystal causeways across the rift
  const barriers: MapBarrier[] = [];
  const doorCells: number[] = [], doorCellsR: number[] = [];
  for (let z = 130; z < 138; z++) for (let x = 100; x < 104; x++) {
    doorCells.push(z * S + x);
    doorCellsR.push((S - 1 - z) * S + (S - 1 - x));
  }
  barriers.push({ x: 102, z: 134, cells: doorCells }, { x: S - 102, z: S - 134, cells: doorCellsR });
  const cwA: number[] = [], cwB: number[] = [];
  for (let z = 0; z < S; z++) for (let x = 0; x < S; x++) {
    const cx = x + 0.5, cz = z + 0.5, u = cx - cz, t = (cx + cz) / 2;
    if (Math.abs(u) <= 3.6) {
      if (Math.abs(t - 60) < 2.6) cwA.push(z * S + x);
      if (Math.abs(t - 100) < 2.6) cwB.push(z * S + x);
    }
  }
  barriers.push({ x: 60, z: 60, cells: cwA }, { x: 100, z: 100, cells: cwB });

  // vision grid
  const VS = VIS_SIZE;
  const visElev = new Uint8Array(VS * VS), visBrush = new Uint8Array(VS * VS);
  for (let vz = 0; vz < VS; vz++) for (let vx = 0; vx < VS; vx++) {
    let me = 0, brush = 0;
    for (let dz = 0; dz < VIS_CELL; dz++) for (let dx = 0; dx < VIS_CELL; dx++) {
      const i = (vz * VIS_CELL + dz) * S + vx * VIS_CELL + dx;
      if (elev[i] > me) me = elev[i];
      if (flags[i] & F_BRUSH) brush++;
    }
    visElev[vz * VS + vx] = me;
    visBrush[vz * VS + vx] = brush >= 2 ? 1 : 0;
  }

  cached = {
    name: 'Glass Ravine', size: S, flags, elev, cellH, vertH,
    starts: [{ x: sites[0].x, z: sites[0].z }, { x: sites[3].x, z: sites[3].z }],
    sites, resources, pylons, barriers, pods, visElev, visBrush,
  };
  return cached;
}

/** Ground height at a world position (matches the rendered terrain; bridge decks are flat). */
export function heightAt(map: GameMap, x: number, z: number): number {
  const S = map.size;
  const cx = Math.min(S - 1, Math.max(0, Math.floor(x))), cz = Math.min(S - 1, Math.max(0, Math.floor(z)));
  if (map.flags[cz * S + cx] & F_BRIDGE) return H_MID;
  const V = S + 1;
  const fx = Math.min(1, Math.max(0, x - cx)), fz = Math.min(1, Math.max(0, z - cz));
  const a = map.vertH[cz * V + cx], b = map.vertH[cz * V + cx + 1];
  const c = map.vertH[(cz + 1) * V + cx], d = map.vertH[(cz + 1) * V + cx + 1];
  return (a * (1 - fx) + b * fx) * (1 - fz) + (c * (1 - fx) + d * fx) * fz;
}

export function cellIndex(map: GameMap, x: number, z: number): number {
  const S = map.size;
  const cx = x < 0 ? 0 : x >= S ? S - 1 : x | 0;
  const cz = z < 0 ? 0 : z >= S ? S - 1 : z | 0;
  return cz * S + cx;
}

/** ASCII dump for debugging / map validation. */
export function mapToAscii(map: GameMap, step = 2): string {
  const rows: string[] = [];
  for (let z = 0; z < map.size; z += step) {
    let r = '';
    for (let x = 0; x < map.size; x += step) {
      const f = map.flags[z * map.size + x], e = map.elev[z * map.size + x];
      r += f & F_ROCK ? '#' : f & F_CLIFF ? '%' : f & F_CHASM ? '~' : f & F_BRIDGE ? '=' : f & F_RAMP ? '/' : f & F_BRUSH ? '"' : e === 2 ? '2' : e === 0 ? '_' : '.';
    }
    rows.push(r);
  }
  return rows.join('\n');
}
