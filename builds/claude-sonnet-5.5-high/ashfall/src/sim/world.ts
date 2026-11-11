// World generation: Ember Refuge (authored), Soot March (seeded 4x4 tile graph), Hollow Archive (3 floors, room graph),
// plus boss-hunt routes. Pure data output; the renderer and game session consume Zone objects.
import { ELITE_MODS, ENEMIES, ROLE_POINTS } from '../data/enemies';
import type { Difficulty } from './types';
import { FLOOR, SOLID, WALL, flood, makeGrid, pathLength, type Grid } from './nav';
import { Rng, seedFrom } from './rng';

export type PropType =
  | 'rock' | 'tree' | 'pillar' | 'ruinwall' | 'grave' | 'crate' | 'urn' | 'brazier' | 'tent' | 'banner' | 'bookcase' | 'lamppost' | 'machine'
  | 'bones' | 'statue' | 'arch' | 'anvil' | 'stairs' | 'bell' | 'cage' | 'conduit' | 'spikes' | 'orrery' | 'colossus' | 'wagon' | 'fence'
  | 'obelisk' | 'chain_post' | 'pool' | 'campfire' | 'column_lib' | 'dais' | 'rune';

export interface Prop {
  type: PropType;
  x: number;
  z: number;
  rot: number;
  s: number;
  tall?: boolean;
  tint?: number;
}
export interface Light {
  x: number;
  z: number;
  color: number;
  intensity: number;
  dist: number;
  flicker?: boolean;
}
export type InteractKind =
  | 'gate_march' | 'gate_refuge' | 'waypoint' | 'captain' | 'vendor' | 'healer' | 'artificer' | 'stash' | 'chest' | 'lever' | 'cage' | 'door'
  | 'stairs_down' | 'stairs_up' | 'shrine' | 'portal_ashen' | 'portal_return' | 'cache' | 'archive_gate' | 'engine_door' | 'hunt_exit' | 'exit_summary';
export interface Interactable {
  id: string;
  kind: InteractKind;
  x: number;
  z: number;
  r: number;
  label: string;
  state: Record<string, number | string | boolean>;
  used?: boolean;
  hidden?: boolean;
  cells?: number[]; // grid cells blocked by this object (doors)
}
export interface SpawnGroup {
  id: string;
  x: number;
  z: number;
  members: string[];
  level: number;
  elite?: { type: string; mods: string[] };
  boss?: string;
  tag?: string;
  dormant?: boolean;
}
export interface Trap {
  x: number;
  z: number;
  r: number;
  period: number;
  phase: number;
}
export type ZoneKind = 'refuge' | 'march' | 'archive1' | 'archive2' | 'archive3' | 'hunt';
export type Theme = 'town' | 'wild' | 'crypt';

export interface Zone {
  id: string;
  name: string;
  kind: ZoneKind;
  theme: Theme;
  seed: number;
  w: number;
  h: number;
  grid: Grid;
  props: Prop[];
  lights: Light[];
  interactables: Interactable[];
  spawns: SpawnGroup[];
  traps: Trap[];
  playerStart: { x: number; z: number };
  anchors: Record<string, { x: number; z: number }>;
  level: number;
  safe: boolean;
  explored: Uint8Array;
  bossArena?: { x: number; z: number; r: number; boss: string };
  meta: Record<string, unknown>;
}

function makeZone(id: string, name: string, kind: ZoneKind, theme: Theme, seed: number, w: number, h: number, fill = WALL): Zone {
  return {
    id, name, kind, theme, seed, w, h, grid: makeGrid(w, h, fill), props: [], lights: [], interactables: [], spawns: [], traps: [],
    playerStart: { x: 2, z: 2 }, anchors: {}, level: 1, safe: false, explored: new Uint8Array(w * h), meta: {},
  };
}

// ------------------------------------------------------------------ helpers
function carveRect(z: Zone, x0: number, z0: number, w: number, h: number, v = FLOOR) {
  for (let zz = z0; zz < z0 + h; zz++) for (let xx = x0; xx < x0 + w; xx++) if (xx >= 0 && zz >= 0 && xx < z.w && zz < z.h) z.grid.cells[zz * z.w + xx] = v;
}
function carveCircle(z: Zone, cx: number, cz: number, rad: number, v = FLOOR) {
  for (let zz = Math.floor(cz - rad); zz <= Math.ceil(cz + rad); zz++)
    for (let xx = Math.floor(cx - rad); xx <= Math.ceil(cx + rad); xx++) {
      if (xx < 1 || zz < 1 || xx >= z.w - 1 || zz >= z.h - 1) continue;
      if (Math.hypot(xx + 0.5 - cx, zz + 0.5 - cz) <= rad) z.grid.cells[zz * z.w + xx] = v;
    }
}
function setCell(z: Zone, x: number, zz: number, v: number) {
  if (x >= 0 && zz >= 0 && x < z.w && zz < z.h) z.grid.cells[zz * z.w + x] = v;
}
function getCell(z: Zone, x: number, zz: number): number {
  if (x < 0 || zz < 0 || x >= z.w || zz >= z.h) return WALL;
  return z.grid.cells[zz * z.w + x];
}
function solidCircle(z: Zone, cx: number, cz: number, rad: number) {
  for (let zz = Math.floor(cz - rad); zz <= Math.ceil(cz + rad); zz++)
    for (let xx = Math.floor(cx - rad); xx <= Math.ceil(cx + rad); xx++) {
      if (getCell(z, xx, zz) !== FLOOR) continue;
      if (Math.hypot(xx + 0.5 - cx, zz + 0.5 - cz) <= rad + 0.15) setCell(z, xx, zz, SOLID);
    }
}
function addProp(z: Zone, type: PropType, x: number, zz: number, o: { rot?: number; s?: number; solid?: number; tall?: boolean; tint?: number } = {}) {
  z.props.push({ type, x, z: zz, rot: o.rot ?? 0, s: o.s ?? 1, tall: o.tall, tint: o.tint });
  if (o.solid) solidCircle(z, x, zz, o.solid);
}
function addLight(z: Zone, x: number, zz: number, color: number, intensity: number, dist: number, flicker = false) {
  z.lights.push({ x, z: zz, color, intensity, dist, flicker });
}
let interactCounter = 0;
function addInteract(z: Zone, kind: InteractKind, x: number, zz: number, label: string, r = 1.6, state: Interactable['state'] = {}): Interactable {
  const it: Interactable = { id: `${z.id}:${kind}:${interactCounter++}`, kind, x, z: zz, r, label, state };
  z.interactables.push(it);
  return it;
}
function isFloorArea(z: Zone, x: number, zz: number, r: number): boolean {
  for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) if (getCell(z, Math.floor(x + dx), Math.floor(zz + dz)) !== FLOOR) return false;
  return true;
}
function lvl(base: number, diff: Difficulty): number {
  return base + (diff === 'veteran' ? 9 : 0);
}

export function composePack(rng: Rng, pool: string[], budget: number): string[] {
  const members: string[] = [];
  let pts = 0;
  let guard = 0;
  while (pts < budget && guard++ < 30 && members.length < 9) {
    const t = rng.pick(pool);
    const p = ROLE_POINTS[ENEMIES[t].role];
    if (pts + p > budget + 1 && members.length >= 2) continue;
    members.push(t);
    pts += p;
  }
  return members;
}
export function packPoints(members: string[]): number {
  return members.reduce((s, t) => s + ROLE_POINTS[ENEMIES[t].role], 0);
}

export function pickEliteMods(rng: Rng, count: number): string[] {
  const out: string[] = [];
  let tries = 0;
  while (out.length < count && tries++ < 20) {
    const m = rng.pick(ELITE_MODS);
    if (out.includes(m.id)) continue;
    if (out.some((o) => m.incompatible.includes(o) || ELITE_MODS.find((e) => e.id === o)!.incompatible.includes(m.id))) continue;
    out.push(m.id);
  }
  return out;
}

// ------------------------------------------------------------------ Ember Refuge
export function buildRefuge(): Zone {
  const z = makeZone('refuge', 'Ember Refuge', 'refuge', 'town', 1, 52, 38);
  z.safe = true;
  z.level = 1;
  carveRect(z, 2, 2, 48, 34);
  // irregular edges
  const rng = new Rng(777);
  for (let i = 0; i < 40; i++) {
    const side = rng.int(0, 3);
    const t = rng.int(2, 48);
    const d = rng.int(0, 2);
    if (side === 0) carveRect(z, t, 2, rng.int(1, 3), d + 1, WALL);
    else if (side === 1) carveRect(z, t, 36 - d - 1, rng.int(1, 3), d + 1, WALL);
    else if (side === 2) carveRect(z, 2, t, d + 1, rng.int(1, 3), WALL);
    else if (side === 3 && !(t > 14 && t < 24)) carveRect(z, 50 - d - 1, t, d + 1, rng.int(1, 3), WALL);
  }
  carveRect(z, 46, 14, 5, 8, FLOOR); // east gate gap
  z.playerStart = { x: 11, z: 19 };
  z.anchors.gate = { x: 49, z: 18 };
  // central star-metal waypoint
  const wp = addInteract(z, 'waypoint', 24, 15, 'Ashway Waypoint', 2.2, { id: 'refuge' });
  addProp(z, 'obelisk', wp.x, wp.z, { s: 1.15, solid: 1.1, tall: true });
  addLight(z, wp.x, wp.z, 0x5ee8ff, 2.2, 14);
  z.anchors.waypoint = { x: wp.x, z: wp.z };
  addProp(z, 'rune', wp.x, wp.z, { s: 1.6 });
  // quest giver
  addInteract(z, 'captain', 15, 12, 'Marshal Orsa Vell', 2.0);
  addProp(z, 'banner', 13.5, 11, { s: 1.0 });
  addProp(z, 'banner', 16.5, 11, { s: 1.0 });
  // vendor stall
  addInteract(z, 'vendor', 33, 12, 'Peddler Dov (Vendor)', 2.2);
  addProp(z, 'tent', 33, 10.5, { s: 1.2, solid: 1.6, tall: true });
  addProp(z, 'crate', 31, 12.3, { s: 0.8 });
  addProp(z, 'crate', 35.2, 12.6, { s: 0.7, rot: 0.6 });
  // healer shrine
  addInteract(z, 'healer', 33, 25, 'Embertender Sael (Healer)', 2.2);
  addProp(z, 'brazier', 31.5, 25, { s: 1, solid: 0.5 });
  addProp(z, 'brazier', 34.5, 25, { s: 1, solid: 0.5 });
  addLight(z, 33, 25, 0xff9a50, 1.6, 9, true);
  // stash
  addInteract(z, 'stash', 17, 25, 'Stash', 1.8);
  addProp(z, 'crate', 17, 25, { s: 1.4, solid: 0.9 });
  addProp(z, 'crate', 18.4, 25.6, { s: 0.8 });
  // artificer station
  const art = addInteract(z, 'artificer', 40, 19, 'Artificer Station', 2.2, { rescued: false });
  addProp(z, 'anvil', 39, 18.6, { s: 1.2, solid: 0.8 });
  addProp(z, 'tent', 41.5, 16.5, { s: 1.1, solid: 1.4, tall: true });
  addLight(z, 40, 19, 0xffa060, 1.4, 8, true);
  art.state.rescued = false;
  // training dummies are spawned as neutral enemies
  for (let i = 0; i < 3; i++) z.spawns.push({ id: `dummy${i}`, x: 7 + i * 3.2, z: 25, members: ['dummy'], level: 1, tag: 'dummy' });
  addProp(z, 'fence', 8.5, 27.2, { s: 1.3 });
  addProp(z, 'fence', 11.5, 27.2, { s: 1.3 });
  // east gate arch
  addInteract(z, 'gate_march', 48.5, 18, 'Gate to the Soot March', 2.4);
  addProp(z, 'arch', 49.5, 18, { s: 1.4, rot: Math.PI / 2, tall: true });
  addLight(z, 47, 15.5, 0xff9a50, 1.3, 8, true);
  addLight(z, 47, 20.5, 0xff9a50, 1.3, 8, true);
  addProp(z, 'brazier', 47, 15.5, { s: 1, solid: 0.5 });
  addProp(z, 'brazier', 47, 20.5, { s: 1, solid: 0.5 });
  // Ashen portal (post-victory) and return portal (town gate)
  addInteract(z, 'portal_ashen', 24, 27, 'Ashen Portal', 2.4, {}).hidden = true;
  addProp(z, 'dais', 24, 27, { s: 1.3 });
  addInteract(z, 'portal_return', 20, 20, 'Return Portal', 2.0, {}).hidden = true;
  // decor
  const decor: [PropType, number, number, number][] = [
    ['tent', 8, 8, 1.1], ['tent', 11, 6.5, 1.0], ['tent', 40, 28, 1.1], ['tent', 44, 25, 1.0], ['lamppost', 20, 10, 1], ['lamppost', 28, 22, 1], ['lamppost', 12, 22, 1],
    ['rock', 5, 15, 1.2], ['rock', 6.5, 22, 1], ['rock', 44, 8, 1.4], ['rock', 25, 33, 1.3], ['bones', 21, 31, 1], ['grave', 4.5, 33, 1], ['grave', 6, 33.4, 1], ['grave', 7.5, 33.2, 1],
    ['statue', 24, 6, 1.3], ['pillar', 22, 6.5, 1], ['pillar', 26, 6.5, 1], ['crate', 9, 12, 1], ['crate', 43, 12, 1],
  ];
  for (const [t, x, zz, s] of decor) {
    if (getCell(z, Math.floor(x), Math.floor(zz)) !== FLOOR) continue;
    addProp(z, t, x, zz, { s, rot: rng.range(0, 6.28), solid: t === 'tent' ? 1.3 : t === 'rock' ? 0.8 : t === 'pillar' ? 0.5 : t === 'statue' ? 0.8 : t === 'lamppost' ? 0.3 : t === 'grave' ? 0.3 : 0, tall: t === 'tent' || t === 'pillar' || t === 'statue' });
    if (t === 'lamppost') addLight(z, x, zz, 0xffb070, 1.0, 9, true);
  }
  return z;
}

// ------------------------------------------------------------------ Soot March
export const TILE = 22;
const TILE_RECIPES: { name: string; rocks: number; trees: number; ruins: number; graves: number; pillars: number; wagons: number; pools: number; bones: number }[] = [
  { name: 'Ashen Flats', rocks: 3, trees: 1, ruins: 0, graves: 0, pillars: 0, wagons: 0, pools: 0, bones: 2 },
  { name: 'Dead Orchard', rocks: 1, trees: 9, ruins: 0, graves: 0, pillars: 0, wagons: 0, pools: 0, bones: 1 },
  { name: 'Gravefield', rocks: 1, trees: 2, ruins: 0, graves: 9, pillars: 0, wagons: 0, pools: 0, bones: 2 },
  { name: 'Broken Causeway', rocks: 2, trees: 0, ruins: 5, graves: 0, pillars: 2, wagons: 0, pools: 0, bones: 0 },
  { name: 'Cinder Hollow', rocks: 4, trees: 0, ruins: 0, graves: 0, pillars: 0, wagons: 0, pools: 3, bones: 1 },
  { name: 'Toll Road', rocks: 1, trees: 1, ruins: 1, graves: 0, pillars: 0, wagons: 3, pools: 0, bones: 2 },
  { name: 'Bell Yard', rocks: 1, trees: 0, ruins: 2, graves: 1, pillars: 5, wagons: 0, pools: 0, bones: 0 },
  { name: 'Bonefall', rocks: 4, trees: 0, ruins: 0, graves: 0, pillars: 0, wagons: 1, pools: 0, bones: 8 },
  { name: 'Scorched Chapel', rocks: 1, trees: 1, ruins: 4, graves: 3, pillars: 3, wagons: 0, pools: 0, bones: 0 },
  { name: 'Thornfield', rocks: 4, trees: 6, ruins: 0, graves: 0, pillars: 0, wagons: 0, pools: 0, bones: 1 },
  { name: 'Pilgrim Rest', rocks: 2, trees: 2, ruins: 1, graves: 1, pillars: 0, wagons: 2, pools: 0, bones: 1 },
  { name: 'Mire Edge', rocks: 3, trees: 3, ruins: 0, graves: 0, pillars: 0, wagons: 0, pools: 4, bones: 1 },
  { name: 'Stone Ring', rocks: 1, trees: 0, ruins: 0, graves: 0, pillars: 8, wagons: 0, pools: 0, bones: 0 },
  { name: 'Ruined Mill', rocks: 2, trees: 1, ruins: 6, graves: 0, pillars: 0, wagons: 1, pools: 0, bones: 0 },
  { name: 'Obelisk Garden', rocks: 2, trees: 2, ruins: 0, graves: 2, pillars: 4, wagons: 0, pools: 0, bones: 0 },
  { name: 'Charred Grove', rocks: 1, trees: 12, ruins: 0, graves: 0, pillars: 0, wagons: 0, pools: 0, bones: 2 },
  { name: 'Slag Heaps', rocks: 9, trees: 0, ruins: 0, graves: 0, pillars: 0, wagons: 1, pools: 1, bones: 1 },
  { name: 'Chapel Steps', rocks: 1, trees: 0, ruins: 3, graves: 5, pillars: 2, wagons: 0, pools: 0, bones: 1 },
  { name: 'Quiet Ford', rocks: 2, trees: 2, ruins: 0, graves: 0, pillars: 0, wagons: 0, pools: 5, bones: 0 },
  { name: "Watcher's Rise", rocks: 3, trees: 0, ruins: 1, graves: 0, pillars: 6, wagons: 0, pools: 0, bones: 0 },
];
export const TILE_TEMPLATE_COUNT = TILE_RECIPES.length;

export interface MarchLayout {
  tiles: { tx: number; ty: number; template: number }[];
  start: { tx: number; ty: number };
  crypt: { tx: number; ty: number };
  path: { tx: number; ty: number }[];
  edges: [number, number][]; // indices into tiles
  shortcutEdge: [number, number] | null;
}

function key(tx: number, ty: number) {
  return ty * 4 + tx;
}

export function layoutMarch(seed: number): MarchLayout {
  for (let attempt = 0; attempt < 200; attempt++) {
    const rng = new Rng(seedFrom('march', seed, attempt));
    const start = { tx: rng.int(0, 1), ty: 3 };
    const crypt = { tx: rng.int(2, 3), ty: 0 };
    const chosen = new Map<number, { tx: number; ty: number }>();
    const path: { tx: number; ty: number }[] = [];
    let cur = { ...start };
    chosen.set(key(cur.tx, cur.ty), cur);
    path.push(cur);
    let guard = 0;
    while ((cur.tx !== crypt.tx || cur.ty !== crypt.ty) && guard++ < 60) {
      const opts: { tx: number; ty: number }[] = [];
      if (cur.ty > crypt.ty) opts.push({ tx: cur.tx, ty: cur.ty - 1 });
      if (cur.tx < crypt.tx) opts.push({ tx: cur.tx + 1, ty: cur.ty });
      if (cur.tx > crypt.tx) opts.push({ tx: cur.tx - 1, ty: cur.ty });
      if (rng.chance(0.25)) {
        const side = [{ tx: cur.tx + 1, ty: cur.ty }, { tx: cur.tx - 1, ty: cur.ty }].filter((p) => p.tx >= 0 && p.tx < 4 && !chosen.has(key(p.tx, p.ty)));
        if (side.length) opts.push(rng.pick(side));
      }
      const nxt = rng.pick(opts);
      cur = nxt;
      if (!chosen.has(key(cur.tx, cur.ty))) {
        chosen.set(key(cur.tx, cur.ty), cur);
        path.push(cur);
      }
    }
    if (cur.tx !== crypt.tx || cur.ty !== crypt.ty) continue;
    const target = rng.int(10, 12);
    let g2 = 0;
    while (chosen.size < target && g2++ < 100) {
      const cands: { tx: number; ty: number; n: number }[] = [];
      for (let ty = 0; ty < 4; ty++)
        for (let tx = 0; tx < 4; tx++) {
          if (chosen.has(key(tx, ty))) continue;
          let n = 0;
          for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (chosen.has(key(tx + dx, ty + dz)) && tx + dx >= 0 && tx + dx < 4) n++;
          if (n > 0) cands.push({ tx, ty, n });
        }
      if (!cands.length) break;
      const pick = rng.weighted(cands, (c) => c.n * c.n);
      chosen.set(key(pick.tx, pick.ty), { tx: pick.tx, ty: pick.ty });
    }
    if (chosen.size < 10) continue;
    const tiles = [...chosen.values()].map((t) => ({ ...t, template: 0 }));
    const idx = new Map(tiles.map((t, i) => [key(t.tx, t.ty), i]));
    const edges: [number, number][] = [];
    for (const t of tiles) {
      const a = idx.get(key(t.tx, t.ty))!;
      const r = t.tx + 1 < 4 ? idx.get(key(t.tx + 1, t.ty)) : undefined;
      const d = t.ty + 1 < 4 ? idx.get(key(t.tx, t.ty + 1)) : undefined;
      if (r !== undefined) edges.push([a, r]);
      if (d !== undefined) edges.push([a, d]);
    }
    if (edges.length < tiles.length) continue; // need at least one cycle (E >= V)
    // template assignment: unique templates, anchors take specific ones
    const tpl = rng.shuffle([...Array(TILE_RECIPES.length).keys()]);
    tiles.forEach((t, i) => (t.template = tpl[i]));
    // shortcut edge: a cycle edge with the greatest detour
    let shortcut: [number, number] | null = null;
    let bestDetour = 2;
    for (const e of edges) {
      const dist = bfsDist(tiles.length, edges.filter((x) => x !== e), e[0], e[1]);
      if (dist < Infinity && dist > bestDetour) {
        bestDetour = dist;
        shortcut = e;
      }
    }
    return { tiles, start, crypt, path, edges, shortcutEdge: shortcut };
  }
  throw new Error('march layout failed');
}

function bfsDist(n: number, edges: [number, number][], a: number, b: number): number {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [x, y] of edges) {
    adj[x].push(y);
    adj[y].push(x);
  }
  const d = new Array(n).fill(Infinity);
  d[a] = 0;
  const q = [a];
  while (q.length) {
    const c = q.shift()!;
    for (const nx of adj[c]) if (d[nx] === Infinity) {
      d[nx] = d[c] + 1;
      q.push(nx);
    }
  }
  return d[b];
}

export function buildMarch(seed: number, diff: Difficulty): Zone {
  const lay = layoutMarch(seed);
  const rng = new Rng(seedFrom('marchdeco', seed));
  const W = TILE * 4;
  const z = makeZone('march', 'The Soot March', 'march', 'wild', seed, W, W);
  z.meta.layout = lay;
  const tileIdx = new Map(lay.tiles.map((t, i) => [key(t.tx, t.ty), i]));
  const has = (tx: number, ty: number) => tx >= 0 && ty >= 0 && tx < 4 && ty < 4 && tileIdx.has(key(tx, ty));
  const edgeSet = new Set(lay.edges.map((e) => `${Math.min(e[0], e[1])}-${Math.max(e[0], e[1])}`));
  const isShortcut = (a: number, b: number) => lay.shortcutEdge && Math.min(a, b) === Math.min(...lay.shortcutEdge) && Math.max(a, b) === Math.max(...lay.shortcutEdge);
  for (const t of lay.tiles) carveRect(z, t.tx * TILE, t.ty * TILE, TILE, TILE);
  // walls along borders
  const GAP0 = 6;
  const GAP1 = TILE - 6;
  for (const t of lay.tiles) {
    const x0 = t.tx * TILE;
    const z0 = t.ty * TILE;
    const sides: [number, number, boolean][] = [[0, -1, false], [0, 1, false], [-1, 0, true], [1, 0, true]];
    for (const [dx, dz, vertical] of sides) {
      const nx = t.tx + dx;
      const ny = t.ty + dz;
      const open = has(nx, ny);
      const a = tileIdx.get(key(t.tx, t.ty))!;
      const closedShortcut = open && isShortcut(a, tileIdx.get(key(nx, ny))!);
      for (let i = 0; i < TILE; i++) {
        const inGap = i >= GAP0 && i < GAP1 && open && !closedShortcut;
        // door gap for shortcut: narrow 4-wide opening blocked by a gate
        if (inGap) continue;
        if (vertical) {
          const xx = dx < 0 ? x0 : x0 + TILE - 1;
          setCell(z, xx, z0 + i, WALL);
          if (!open) setCell(z, dx < 0 ? x0 + 1 : x0 + TILE - 2, z0 + i, WALL);
        } else {
          const zz = dz < 0 ? z0 : z0 + TILE - 1;
          setCell(z, x0 + i, zz, WALL);
          if (!open) setCell(z, x0 + i, dz < 0 ? z0 + 1 : z0 + TILE - 2, WALL);
        }
      }
    }
  }
  // closed shortcut gate: a 4-wide opening that stays walled until the gate is opened
  if (lay.shortcutEdge) {
    const [ia, ib] = lay.shortcutEdge;
    const A = lay.tiles[ia];
    const B = lay.tiles[ib];
    const cells: number[] = [];
    const horizontal = A.ty === B.ty;
    let gx: number;
    let gz: number;
    if (horizontal) {
      const bx = (Math.min(A.tx, B.tx) + 1) * TILE;
      const zc = A.ty * TILE + TILE / 2;
      gx = bx;
      gz = zc;
      for (let r = -2; r < 2; r++) for (const c of [bx - 1, bx]) {
        setCell(z, c, zc + r, WALL);
        cells.push((zc + r) * z.w + c);
      }
    } else {
      const bz = (Math.min(A.ty, B.ty) + 1) * TILE;
      const xc = A.tx * TILE + TILE / 2;
      gx = xc;
      gz = bz;
      for (let c = -2; c < 2; c++) for (const r of [bz - 1, bz]) {
        setCell(z, xc + c, r, WALL);
        cells.push(r * z.w + xc + c);
      }
    }
    const door = addInteract(z, 'door', gx, gz, 'Rusted Shortcut Gate', 3.0, { open: false });
    door.cells = cells;
    z.meta.shortcutDoor = door.id;
    addProp(z, 'arch', gx, gz, { s: 1.0, rot: horizontal ? Math.PI / 2 : 0, tall: true });
  }
  // corner chunks
  for (const t of lay.tiles) {
    const x0 = t.tx * TILE;
    const z0 = t.ty * TILE;
    for (const [cx, cz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      const size = rng.int(2, 4);
      for (let dz = 0; dz < size; dz++)
        for (let dx = 0; dx < size - dz; dx++) {
          const xx = cx === 0 ? x0 + dx : x0 + TILE - 1 - dx;
          const zz = cz === 0 ? z0 + dz : z0 + TILE - 1 - dz;
          if (xx >= x0 + 1 && xx < x0 + TILE - 1 && zz >= z0 + 1 && zz < z0 + TILE - 1) setCell(z, xx, zz, WALL);
          else if (xx > x0 - 1 && xx < x0 + TILE && zz > z0 - 1 && zz < z0 + TILE) setCell(z, xx, zz, WALL);
        }
    }
  }
  const tcenter = (t: { tx: number; ty: number }) => ({ x: t.tx * TILE + TILE / 2, z: t.ty * TILE + TILE / 2 });
  // anchors
  const startT = lay.tiles[tileIdx.get(key(lay.start.tx, lay.start.ty))!];
  const cryptT = lay.tiles[tileIdx.get(key(lay.crypt.tx, lay.crypt.ty))!];
  const pathIdx = lay.path.map((p) => tileIdx.get(key(p.tx, p.ty))!);
  const wayT = lay.tiles[pathIdx[Math.floor(pathIdx.length / 2)]];
  const tollT = lay.tiles[pathIdx[pathIdx.length - 2]];
  const degree = (t: { tx: number; ty: number }) => [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => has(t.tx + dx, t.ty + dy)).length;
  const off = lay.tiles.filter((t) => !pathIdx.includes(tileIdx.get(key(t.tx, t.ty))!));
  const huntT = off.sort((a, b) => degree(a) - degree(b))[0] ?? lay.tiles.find((t) => t !== startT && t !== cryptT && t !== wayT && t !== tollT)!;

  const sc = tcenter(startT);
  // refuge gate in the start tile (south wall)
  const gateX = sc.x;
  const gateZ = startT.ty * TILE + TILE - 2.4;
  z.playerStart = { x: sc.x, z: gateZ - 4 };
  addInteract(z, 'gate_refuge', gateX, gateZ + 0.2, 'Gate to Ember Refuge', 2.4);
  addProp(z, 'arch', gateX, startT.ty * TILE + TILE - 1.3, { s: 1.5, tall: true });
  addLight(z, gateX - 3, gateZ - 1, 0xff9a50, 1.3, 9, true);
  addLight(z, gateX + 3, gateZ - 1, 0xff9a50, 1.3, 9, true);
  addProp(z, 'brazier', gateX - 3, gateZ - 1, { s: 1, solid: 0.5 });
  addProp(z, 'brazier', gateX + 3, gateZ - 1, { s: 1, solid: 0.5 });
  z.anchors.gate = { x: gateX, z: gateZ };

  // waypoint shrine in way tile
  const wc = tcenter(wayT);
  const wpt = addInteract(z, 'waypoint', wc.x, wc.z, 'Ashway Shrine', 2.2, { id: 'ashway' });
  addProp(z, 'obelisk', wc.x, wc.z, { s: 1.0, solid: 1.0, tall: true });
  addProp(z, 'rune', wc.x, wc.z, { s: 1.4 });
  for (const [dx, dz] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) addProp(z, 'pillar', wc.x + dx, wc.z + dz, { s: 0.9, solid: 0.5, tall: true });
  addLight(z, wc.x, wc.z, 0x5ee8ff, 2.2, 13);
  z.anchors.waypoint = { x: wpt.x, z: wpt.z };

  // ruined tollhouse (quadrant NE of toll tile) with chest + elite
  const tc = tcenter(tollT);
  const thx = tc.x + 3;
  const thz = tc.z - 8;
  for (let dx = 0; dx < 8; dx++) {
    for (let dz = 0; dz < 5; dz++) {
      const edge = dx === 0 || dx === 7 || dz === 0 || dz === 4;
      if (edge && !(dz === 4 && dx >= 3 && dx <= 4) && !(dx === 0 && dz === 2)) setCell(z, Math.floor(thx + dx), Math.floor(thz + dz), WALL);
    }
  }
  const tollChest = addInteract(z, 'chest', thx + 4, thz + 2, 'Tollhouse Strongbox', 1.6, { tier: 1 });
  addProp(z, 'crate', thx + 4, thz + 2, { s: 1.2, tint: 0xc9a468 });
  z.anchors.tollhouse = { x: thx + 4, z: thz + 2 };
  z.meta.tollChest = tollChest.id;
  addProp(z, 'banner', thx + 2, thz + 0.8, { s: 0.9 });

  // hunter camp w/ cache
  const hc = tcenter(huntT);
  const cache = addInteract(z, 'cache', hc.x + 4, hc.z + 4, "Hunter's Cache", 1.8, { triggered: false });
  addProp(z, 'campfire', hc.x + 2.5, hc.z + 4, { s: 1 });
  addLight(z, hc.x + 2.5, hc.z + 4, 0xff9040, 1.7, 9, true);
  addProp(z, 'tent', hc.x + 6, hc.z + 6, { s: 1.0, solid: 1.3, tall: true });
  addProp(z, 'tent', hc.x + 1, hc.z + 7, { s: 0.9, solid: 1.2, tall: true, rot: 1 });
  addProp(z, 'crate', cache.x, cache.z, { s: 1.0, tint: 0x8a6a40 });
  z.anchors.hunterCamp = { x: cache.x, z: cache.z };
  z.meta.huntTile = huntT;

  // crypt tile: gate vista + boss arena
  const cc = tcenter(cryptT);
  z.anchors.crypt = { x: cc.x, z: cryptT.ty * TILE + 3 };
  // clear everything inside the crypt tile centre to make the arena
  carveCircle(z, cc.x, cc.z, 8.5);
  z.bossArena = { x: cc.x, z: cc.z + 1, r: 9, boss: 'toll_keeper' };
  const gate = addInteract(z, 'archive_gate', cc.x, cryptT.ty * TILE + 2.4, 'Archive Gate (sealed)', 2.8, { open: false });
  const gateCells: number[] = [];
  for (let i = -2; i <= 1; i++) {
    for (let k = 0; k < 2; k++) {
      setCell(z, Math.floor(cc.x + i), cryptT.ty * TILE + 1 + k, WALL);
    }
  }
  // approach floor to the gate
  for (let zz = cryptT.ty * TILE + 3; zz < cryptT.ty * TILE + 6; zz++) for (let xx = Math.floor(cc.x - 3); xx <= Math.floor(cc.x + 3); xx++) setCell(z, xx, zz, FLOOR);
  for (let i = -2; i <= 1; i++) for (let k = 0; k < 2; k++) gateCells.push((cryptT.ty * TILE + 1 + k) * z.w + Math.floor(cc.x + i));
  gate.cells = gateCells;
  addProp(z, 'colossus', cc.x, cryptT.ty * TILE + 1.2, { s: 2.6, tall: true });
  addProp(z, 'arch', cc.x, cryptT.ty * TILE + 2.5, { s: 1.8, tall: true });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    addProp(z, 'chain_post', cc.x + Math.cos(a) * 8.6, cc.z + 1 + Math.sin(a) * 8.6, { s: 1.0, solid: 0.45, tall: true });
  }
  addProp(z, 'bell', cc.x - 6, cc.z + 4, { s: 1.2, solid: 0.7, tall: true });
  addLight(z, cc.x, cryptT.ty * TILE + 4, 0xff7040, 2.0, 14, true);
  addLight(z, cc.x, cc.z, 0x8aa0c8, 0.8, 18);

  // decorate tiles
  const reserved: { x: number; z: number; r: number }[] = [
    { x: gateX, z: gateZ, r: 6 }, { x: wc.x, z: wc.z, r: 6 }, { x: thx + 4, z: thz + 2, r: 7 }, { x: hc.x + 4, z: hc.z + 5, r: 9 }, { x: cc.x, z: cc.z, r: 11 },
  ];
  for (const t of lay.tiles) {
    const rec = TILE_RECIPES[t.template];
    const x0 = t.tx * TILE;
    const z0 = t.ty * TILE;
    const place = (type: PropType, n: number, solid: number, o: { s?: [number, number]; tall?: boolean } = {}) => {
      for (let i = 0; i < n; i++) {
        for (let tries = 0; tries < 20; tries++) {
          const px = x0 + rng.range(2.5, TILE - 2.5);
          const pz = z0 + rng.range(2.5, TILE - 2.5);
          // keep centre cross lanes free
          if (Math.abs(px - (x0 + TILE / 2)) < 3.2 || Math.abs(pz - (z0 + TILE / 2)) < 3.2) continue;
          if (reserved.some((r) => Math.hypot(px - r.x, pz - r.z) < r.r)) continue;
          if (!isFloorArea(z, px, pz, Math.ceil(solid) + 1)) continue;
          const s = rng.range(o.s?.[0] ?? 0.8, o.s?.[1] ?? 1.4);
          addProp(z, type, px, pz, { rot: rng.range(0, 6.28), s, solid: solid > 0 ? solid * s : 0, tall: o.tall });
          break;
        }
      }
    };
    place('rock', rec.rocks, 0.9, { s: [0.9, 1.7] });
    place('tree', rec.trees, 0.45, { tall: true, s: [0.9, 1.5] });
    place('ruinwall', rec.ruins, 1.1, { s: [0.9, 1.3], tall: true });
    place('grave', rec.graves, 0.3, { s: [0.8, 1.2] });
    place('pillar', rec.pillars, 0.5, { tall: true, s: [0.9, 1.3] });
    place('wagon', rec.wagons, 1.2, { s: [1.0, 1.2] });
    place('pool', rec.pools, 0, { s: [1.5, 3] });
    place('bones', rec.bones, 0, { s: [0.8, 1.3] });
  }
  // lights: a few ember glows
  for (const t of lay.tiles) if (rng.chance(0.6)) {
    const lx = t.tx * TILE + rng.range(4, TILE - 4);
    const lz = t.ty * TILE + rng.range(4, TILE - 4);
    if (isFloorArea(z, lx, lz, 1)) {
      addProp(z, 'brazier', lx, lz, { s: 1, solid: 0.5 });
      addLight(z, lx, lz, 0xff8a44, 1.4, 10, true);
    }
  }

  // ------------- encounters
  z.level = lvl(1, diff);
  const pool1 = ['crawler', 'crawler', 'archer', 'husk', 'hound', 'swarm', 'mite', 'pilgrim'];
  const progressOf = (t: { tx: number; ty: number }) => {
    const i = pathIdx.indexOf(tileIdx.get(key(t.tx, t.ty))!);
    if (i >= 0) return i / Math.max(1, pathIdx.length - 1);
    // off-path: distance proxy
    return Math.min(1, Math.hypot(t.tx - lay.start.tx, t.ty - lay.start.ty) / 4.5);
  };
  let packN = 0;
  const free = (px: number, pz: number, r = 1.5) => isFloorArea(z, px, pz, Math.ceil(r));
  for (const t of lay.tiles) {
    if (t === startT) continue;
    const prog = progressOf(t);
    const base = Math.round(1 + prog * 6);
    const packs = t === cryptT ? 0 : t === wayT ? 1 : rng.chance(0.55) ? 2 : 1;
    for (let p = 0; p < packs; p++) {
      for (let tries = 0; tries < 30; tries++) {
        const px = t.tx * TILE + rng.range(4, TILE - 4);
        const pz = t.ty * TILE + rng.range(4, TILE - 4);
        if (!free(px, pz, 2)) continue;
        if (Math.hypot(px - z.playerStart.x, pz - z.playerStart.z) < 22) continue;
        if (reserved.some((r) => r !== reserved[4] && Math.hypot(px - r.x, pz - r.z) < 7)) continue;
        const members = composePack(rng, pool1, rng.int(5, 10));
        const sg: SpawnGroup = { id: `march_p${packN++}`, x: px, z: pz, members, level: lvl(Math.max(1, base + rng.int(-1, 0)), diff), tag: 'pack' };
        if (diff === 'veteran' && rng.chance(0.3)) sg.elite = { type: rng.pick(['husk', 'warden', 'hound']), mods: pickEliteMods(rng, 2) };
        z.spawns.push(sg);
        break;
      }
    }
  }
  // tollhouse elite
  z.spawns.push({
    id: 'toll_elite', x: thx + 4, z: thz + 7.5, members: ['crawler', 'crawler', 'archer'], level: lvl(5, diff), tag: 'elite',
    elite: { type: 'husk', mods: pickEliteMods(rng, diff === 'veteran' ? 2 : 1) },
  });
  // chests / urns / explosive powder kegs
  const chestTiles = lay.tiles.filter((t) => t !== startT && t !== cryptT);
  for (let i = 0; i < 3; i++) {
    const t = rng.pick(chestTiles);
    for (let tries = 0; tries < 20; tries++) {
      const px = t.tx * TILE + rng.range(4, TILE - 4);
      const pz = t.ty * TILE + rng.range(4, TILE - 4);
      if (!free(px, pz, 1) || reserved.some((r) => Math.hypot(px - r.x, pz - r.z) < 5)) continue;
      addInteract(z, 'chest', px, pz, 'Weathered Chest', 1.5, { tier: 0 });
      addProp(z, 'crate', px, pz, { s: 1.1, tint: 0x6a5238 });
      break;
    }
  }
  for (let i = 0; i < 16; i++) {
    const t = rng.pick(lay.tiles);
    const px = t.tx * TILE + rng.range(3, TILE - 3);
    const pz = t.ty * TILE + rng.range(3, TILE - 3);
    if (!free(px, pz, 1) || Math.hypot(px - z.playerStart.x, pz - z.playerStart.z) < 5) continue;
    z.spawns.push({ id: `urn${i}`, x: px, z: pz, members: [rng.chance(0.2) ? 'powder' : 'urn'], level: z.level, tag: 'breakable' });
  }
  // shrine (healing)
  const shrineT = rng.pick(lay.tiles.filter((t) => t !== startT && t !== cryptT && t !== wayT));
  addInteract(z, 'shrine', shrineT.tx * TILE + 6, shrineT.ty * TILE + 6, 'Mending Shrine', 1.8, { used: false });
  addProp(z, 'dais', shrineT.tx * TILE + 6, shrineT.ty * TILE + 6, { s: 0.9 });
  addLight(z, shrineT.tx * TILE + 6, shrineT.ty * TILE + 6, 0x5ee0a0, 1.2, 8);
  z.meta.paths = pathIdx;
  return z;
}

export interface MarchValidation {
  ok: boolean;
  errors: string[];
  tileCount: number;
  hasLoop: boolean;
}

/** Validates the generated march: connectivity, anchors, shortcut and dead-end reward rule. */
export function validateMarch(z: Zone): MarchValidation {
  const errors: string[] = [];
  const lay = z.meta.layout as MarchLayout;
  if (lay.tiles.length < 10 || lay.tiles.length > 12) errors.push(`tile count ${lay.tiles.length}`);
  const hasLoop = lay.edges.length >= lay.tiles.length;
  if (!hasLoop) errors.push('no loop');
  if (!lay.shortcutEdge) errors.push('no shortcut');
  // ignore closed shortcut doors: flood treats WALL as blocked => objectives must be reachable without it
  const reach = flood(z.grid, z.playerStart.x, z.playerStart.z);
  const need: [string, { x: number; z: number }][] = [
    ['gate', z.anchors.gate], ['waypoint', z.anchors.waypoint], ['tollhouse', z.anchors.tollhouse], ['hunterCamp', z.anchors.hunterCamp],
    ['bossArena', { x: z.bossArena!.x, z: z.bossArena!.z }], ['crypt', z.anchors.crypt],
  ];
  for (const [name, p] of need) {
    if (!p) {
      errors.push(`missing anchor ${name}`);
      continue;
    }
    // look for any reachable floor cell within 3 cells
    let ok = false;
    for (let dz = -3; dz <= 3 && !ok; dz++) for (let dx = -3; dx <= 3 && !ok; dx++) {
      const cx = Math.floor(p.x) + dx;
      const cz = Math.floor(p.z) + dz;
      if (cx >= 0 && cz >= 0 && cx < z.w && cz < z.h && reach[cz * z.w + cx]) ok = true;
    }
    if (!ok) errors.push(`unreachable anchor ${name}`);
  }
  // door-gated shortcut must shorten some route when open
  // dead-end reward rule: tiles of degree 1 (other than start/crypt) must hold a chest/cache
  const degree = new Array(lay.tiles.length).fill(0);
  for (const [a, b] of lay.edges) {
    degree[a]++;
    degree[b]++;
  }
  lay.tiles.forEach((t, i) => {
    if (degree[i] !== 1) return;
    if ((t.tx === lay.start.tx && t.ty === lay.start.ty) || (t.tx === lay.crypt.tx && t.ty === lay.crypt.ty)) return;
    const x0 = t.tx * TILE;
    const z0 = t.ty * TILE;
    const reward = z.interactables.some((it) => (it.kind === 'chest' || it.kind === 'cache' || it.kind === 'shrine' || it.kind === 'waypoint') && it.x >= x0 && it.x < x0 + TILE && it.z >= z0 && it.z < z0 + TILE);
    const rewardSpawn = z.spawns.some((s) => s.tag === 'elite' && s.x >= x0 && s.x < x0 + TILE && s.z >= z0 && s.z < z0 + TILE);
    if (!reward && !rewardSpawn) errors.push(`dead-end tile ${t.tx},${t.ty} has no reward`);
  });
  // no spawn within 4m of the player start
  for (const s of z.spawns) if (Math.hypot(s.x - z.playerStart.x, s.z - z.playerStart.z) < 4 && s.tag !== 'dummy') errors.push(`spawn ${s.id} too close to start`);
  // pack budgets 5..10
  for (const s of z.spawns) if (s.tag === 'pack') {
    const p = packPoints(s.members);
    if (p < 4 || p > 12) errors.push(`pack ${s.id} budget ${p}`);
  }
  return { ok: errors.length === 0, errors, tileCount: lay.tiles.length, hasLoop };
}

export function shortcutShortens(z: Zone): boolean {
  const lay = z.meta.layout as MarchLayout;
  if (!lay.shortcutEdge) return false;
  const door = z.interactables.find((i) => i.kind === 'door');
  if (!door || !door.cells) return false;
  const closed = pathLength(z.grid, z.playerStart.x, z.playerStart.z, z.anchors.crypt.x, z.anchors.crypt.z + 2);
  const copy: Grid = { w: z.grid.w, h: z.grid.h, cells: new Uint8Array(z.grid.cells) };
  for (const c of door.cells) copy.cells[c] = FLOOR;
  const open = pathLength(copy, z.playerStart.x, z.playerStart.z, z.anchors.crypt.x, z.anchors.crypt.z + 2);
  return open <= closed;
}

// ------------------------------------------------------------------ Hollow Archive
type RoomTpl = 'hall' | 'cross' | 'pillars' | 'library' | 'cistern' | 'foundry' | 'orrery';
const ROOM_TPLS: RoomTpl[] = ['hall', 'cross', 'pillars', 'library', 'cistern', 'foundry'];

export interface ArchiveRoom {
  x: number;
  z: number;
  w: number;
  h: number;
  tpl: RoomTpl;
  role: string;
}

export function buildArchive(seed: number, floor: 1 | 2, diff: Difficulty): Zone {
  const rng = new Rng(seedFrom('archive', seed, floor));
  const CELL = 28;
  const COLS = 3;
  const ROWS = 3;
  const z = makeZone(`archive${floor}`, floor === 1 ? 'Hollow Archive - Lower Stacks' : 'Hollow Archive - Scholars\' Gallery', floor === 1 ? 'archive1' : 'archive2', 'crypt', seed, COLS * CELL, ROWS * CELL);
  z.level = lvl(floor === 1 ? 8 : 10, diff);
  // meta-grid chain
  let chain: { c: number; r: number }[] = [];
  for (let attempt = 0; attempt < 80; attempt++) {
    const c0 = { c: rng.int(0, COLS - 1), r: ROWS - 1 };
    const ch = [c0];
    const seen = new Set([c0.c + c0.r * COLS]);
    const want = 5;
    let cur = c0;
    while (ch.length < want) {
      const nb = [[1, 0], [-1, 0], [0, -1], [0, 1]]
        .map(([dc, dr]) => ({ c: cur.c + dc, r: cur.r + dr }))
        .filter((p) => p.c >= 0 && p.c < COLS && p.r >= 0 && p.r < ROWS && !seen.has(p.c + p.r * COLS));
      if (!nb.length) break;
      // prefer moving up
      cur = rng.weighted(nb, (p) => (p.r < cur.r ? 3 : 1));
      ch.push(cur);
      seen.add(cur.c + cur.r * COLS);
    }
    if (ch.length === want) {
      chain = ch;
      break;
    }
  }
  const rooms: ArchiveRoom[] = [];
  const used: Record<string, number> = {};
  let lastTpl: RoomTpl | null = null;
  chain.forEach((cell, i) => {
    let tpl: RoomTpl;
    do tpl = rng.pick(ROOM_TPLS);
    while ((used[tpl] ?? 0) >= 2 || tpl === lastTpl);
    used[tpl] = (used[tpl] ?? 0) + 1;
    lastTpl = tpl;
    const w = rng.int(14, 20);
    const h = rng.int(14, 20);
    const cx = cell.c * CELL + CELL / 2 + rng.int(-2, 2);
    const cz = cell.r * CELL + CELL / 2 + rng.int(-2, 2);
    const role = i === 0 ? 'start' : i === chain.length - 1 ? 'exit' : i === 2 ? 'landmark' : 'combat';
    rooms.push({ x: Math.round(cx - w / 2), z: Math.round(cz - h / 2), w, h, tpl: role === 'landmark' ? 'orrery' : tpl, role });
  });
  for (const r of rooms) carveRect(z, r.x, r.z, r.w, r.h);
  const centre = (r: ArchiveRoom) => ({ x: Math.round(r.x + r.w / 2), z: Math.round(r.z + r.h / 2) });
  const corridor = (a: { x: number; z: number }, b: { x: number; z: number }, wdt = 4) => {
    const x0 = Math.min(a.x, b.x);
    const x1 = Math.max(a.x, b.x);
    carveRect(z, x0 - wdt / 2, a.z - wdt / 2, x1 - x0 + wdt, wdt);
    const z0 = Math.min(a.z, b.z);
    const z1 = Math.max(a.z, b.z);
    carveRect(z, b.x - wdt / 2, z0 - wdt / 2, wdt, z1 - z0 + wdt);
  };
  for (let i = 0; i < rooms.length - 1; i++) corridor(centre(rooms[i]), centre(rooms[i + 1]));
  // side room (dead end with reward) off the landmark room
  const lm = rooms[2];
  let sideRoom: ArchiveRoom | null = null;
  for (const ai of [2, 1, 3, 0, 4]) {
    const cc = chain[ai];
    const opts = [[1, 0], [-1, 0], [0, -1], [0, 1]].map(([dc, dr]) => ({ c: cc.c + dc, r: cc.r + dr })).filter((p) => p.c >= 0 && p.c < COLS && p.r >= 0 && p.r < ROWS && !chain.some((q) => q.c === p.c && q.r === p.r));
    if (!opts.length) continue;
    const p = rng.pick(opts);
    sideRoom = { x: p.c * CELL + CELL / 2 - 6, z: p.r * CELL + CELL / 2 - 6, w: 12, h: 12, tpl: 'hall', role: 'side' };
    carveRect(z, sideRoom.x, sideRoom.z, 12, 12);
    corridor(centre(rooms[ai]), centre(sideRoom));
    rooms.push(sideRoom);
    break;
  }
  void lm;
  // templates
  for (const r of rooms) {
    const c = centre(r);
    switch (r.tpl) {
      case 'pillars':
        for (let px = r.x + 4; px < r.x + r.w - 3; px += 5) for (let pz = r.z + 4; pz < r.z + r.h - 3; pz += 5) if (Math.hypot(px - c.x, pz - c.z) > 3.5) addProp(z, 'pillar', px + 0.5, pz + 0.5, { s: 1, solid: 0.55, tall: true });
        break;
      case 'cross':
        for (const [sx, sz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) carveRect(z, sx ? r.x + r.w - 4 : r.x, sz ? r.z + r.h - 4 : r.z, 4, 4, WALL);
        break;
      case 'library':
        for (let px = r.x + 3; px < r.x + r.w - 3; px += 5) {
          for (const side of [r.z + 2, r.z + r.h - 3]) {
            addProp(z, 'bookcase', px + 1, side + 0.5, { s: 1, solid: 1.0, tall: true });
          }
        }
        break;
      case 'cistern':
        addProp(z, 'pool', c.x, c.z, { s: Math.min(r.w, r.h) * 0.14 });
        solidCircle(z, c.x, c.z, 2.2);
        break;
      case 'foundry':
        addProp(z, 'machine', c.x, c.z, { s: 1.3, solid: 1.5, tall: true });
        addLight(z, c.x, c.z, 0xff6a30, 1.8, 12, true);
        break;
      case 'orrery':
        addProp(z, 'orrery', c.x, c.z, { s: floor === 1 ? 1.6 : 1.3, solid: 1.8, tall: true });
        addLight(z, c.x, c.z, 0x5ee8ff, 2.0, 15);
        break;
      case 'hall':
        for (const dz of [r.z + 2, r.z + r.h - 3]) for (let px = r.x + 3; px < r.x + r.w - 2; px += 4) addProp(z, 'pillar', px + 0.5, dz + 0.5, { s: 0.9, solid: 0.5, tall: true });
        break;
    }
    // braziers
    if (r.tpl !== 'foundry' && r.tpl !== 'orrery') {
      addProp(z, 'brazier', r.x + 1.5, r.z + 1.5, { s: 1, solid: 0.5 });
      addLight(z, r.x + 1.5, r.z + 1.5, 0xff8844, 1.3, 11, true);
    }
  }
  if (floor === 2) {
    // library column landmark in the landmark room
    const c = centre(rooms[2]);
    addProp(z, 'column_lib', c.x, c.z, { s: 1.4, tall: true });
  }
  const startR = rooms[0];
  const exitR = rooms[chain.length - 1];
  const sc = centre(startR);
  z.playerStart = { x: sc.x, z: sc.z + 2 };
  const ec = centre(exitR);
  // stairs & waypoint
  if (floor === 1) {
    addInteract(z, 'stairs_up', sc.x - 4, startR.z + 2.5, 'Stairs to the Soot March', 2.2);
    addProp(z, 'stairs', sc.x - 4, startR.z + 2, { s: 1.1, rot: 0 });
    const wp = addInteract(z, 'waypoint', sc.x + 1, sc.z, 'Archive Gate Waypoint', 2.2, { id: 'archive' });
    addProp(z, 'obelisk', wp.x, wp.z, { s: 0.95, solid: 1.0, tall: true });
    addProp(z, 'rune', wp.x, wp.z, { s: 1.3 });
    addLight(z, wp.x, wp.z, 0x5ee8ff, 2.0, 12);
  } else {
    addInteract(z, 'stairs_up', sc.x - 4, startR.z + 2.5, 'Stairs up', 2.2);
    addProp(z, 'stairs', sc.x - 4, startR.z + 2, { s: 1.1 });
  }
  addInteract(z, 'stairs_down', ec.x + 4, exitR.z + exitR.h - 3, floor === 1 ? 'Stairs down to the Scholars\' Gallery' : 'Stairs down to the Engine Approach', 2.2);
  addProp(z, 'stairs', ec.x + 4, exitR.z + exitR.h - 2.6, { s: 1.1, rot: Math.PI });
  z.anchors.stairsDown = { x: ec.x + 4, z: exitR.z + exitR.h - 3 };
  z.anchors.stairsUp = { x: sc.x - 4, z: startR.z + 2.5 };
  z.anchors.landmark = centre(rooms[2]);
  z.meta.rooms = rooms;
  // artificer cage in floor 1 side room
  if (floor === 1 && sideRoom) {
    const sc2 = centre(sideRoom);
    addInteract(z, 'cage', sc2.x, sc2.z, 'Caged Artificer', 2.2, { open: false });
    addProp(z, 'cage', sc2.x, sc2.z, { s: 1.3, solid: 1.0, tall: true });
    addLight(z, sc2.x, sc2.z, 0xffb070, 1.4, 9, true);
    z.anchors.cage = sc2;
    z.spawns.push({ id: 'cage_guard', x: sc2.x + 3, z: sc2.z + 3, members: ['warden', 'mite', 'mite'], level: z.level, tag: 'guard' });
    addInteract(z, 'chest', sc2.x - 4, sc2.z - 3, 'Archivist\'s Coffer', 1.6, { tier: 1 });
    addProp(z, 'crate', sc2.x - 4, sc2.z - 3, { s: 1.2, tint: 0x9aa09a });
  } else if (sideRoom) {
    const sc2 = centre(sideRoom);
    addInteract(z, 'chest', sc2.x, sc2.z, 'Sealed Vault', 1.7, { tier: 2 });
    addProp(z, 'crate', sc2.x, sc2.z, { s: 1.5, tint: 0x9aa09a });
    addLight(z, sc2.x, sc2.z, 0x5ee0a0, 1.2, 9);
    z.spawns.push({ id: 'vault_guard', x: sc2.x + 2, z: sc2.z + 2, members: ['scribe', 'adept', 'swarm'], level: z.level, tag: 'guard' });
  }
  // floor 2 lever shortcut
  if (floor === 2) {
    const a = centre(rooms[1]);
    const b = centre(rooms[chain.length - 1]);
    corridor(a, b, 4);
    const inRoom = (x: number, zz: number) => rooms.some((r) => x >= r.x - 1 && x < r.x + r.w + 1 && zz >= r.z - 1 && zz < r.z + r.h + 1);
    const cands: { cells: number[]; x: number; z: number }[] = [];
    const stepX = Math.sign(b.x - a.x) || 1;
    for (let x = a.x; x !== b.x; x += stepX) {
      if (inRoom(x, a.z)) continue;
      cands.push({ cells: [-2, -1, 0, 1].map((k) => (a.z + k) * z.w + x), x, z: a.z });
    }
    const stepZ = Math.sign(b.z - a.z) || 1;
    for (let zz = a.z; zz !== b.z; zz += stepZ) {
      if (inRoom(b.x, zz)) continue;
      cands.push({ cells: [-2, -1, 0, 1].map((k) => zz * z.w + b.x + k), x: b.x, z: zz });
    }
    const lr = rooms[chain.length - 2];
    for (const cd of cands) {
      const saved = cd.cells.map((c) => z.grid.cells[c]);
      if (saved.some((v) => v !== FLOOR)) continue;
      for (const c of cd.cells) z.grid.cells[c] = WALL;
      const reach = flood(z.grid, sc.x, sc.z + 2);
      const near = (p: { x: number; z: number }) => {
        for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) {
          const cx = Math.floor(p.x) + dx;
          const cz = Math.floor(p.z) + dz;
          if (cx >= 0 && cz >= 0 && cx < z.w && cz < z.h && reach[cz * z.w + cx]) return true;
        }
        return false;
      };
      const ok = near(ec) && near(centre(lr)) && near(centre(rooms[2]));
      if (!ok) {
        cd.cells.forEach((c, i) => (z.grid.cells[c] = saved[i]));
        continue;
      }
      const door = addInteract(z, 'door', cd.x + 0.5, cd.z, 'Barred Gate', 2.4, { open: false });
      door.cells = cd.cells;
      z.meta.shortcutDoor = door.id;
      const lc = centre(lr);
      addInteract(z, 'lever', lc.x - 3, lc.z - 3, 'Lever', 1.6, { pulled: false });
      addProp(z, 'machine', lc.x - 3, lc.z - 3, { s: 0.6 });
      break;
    }
    // elite guardian at exit stairs
    z.spawns.push({
      id: 'guardian', x: ec.x, z: ec.z - 1, members: ['scribe', 'swarm'], level: z.level + 1, tag: 'elite',
      elite: { type: 'warden', mods: pickEliteMods(rng, diff === 'veteran' ? 2 : 1) },
    });
  }
  // traps (floor 1 teaches traps)
  if (floor === 1) {
    for (const r of rooms) {
      if (r.role === 'start' || r.role === 'side') continue;
      for (let i = 0; i < 3; i++) {
        const tx = r.x + rng.range(3, r.w - 3);
        const tz = r.z + rng.range(3, r.h - 3);
        if (isFloorArea(z, tx, tz, 1)) z.traps.push({ x: tx, z: tz, r: 1.1, period: rng.range(3.4, 4.6), phase: rng.range(0, 3) });
      }
    }
  }
  // packs
  const pool = floor === 1 ? ['warden', 'mite', 'crawler', 'husk', 'mite', 'archer'] : ['scribe', 'adept', 'swarm', 'archer', 'hound', 'warden', 'pilgrim'];
  let pn = 0;
  for (const r of rooms) {
    if (r.role === 'start' || r.role === 'side') continue;
    const n = r.role === 'exit' ? 1 : rng.int(1, 2);
    for (let i = 0; i < n; i++) {
      for (let tries = 0; tries < 25; tries++) {
        const px = r.x + rng.range(3, r.w - 3);
        const pz = r.z + rng.range(3, r.h - 3);
        if (!isFloorArea(z, px, pz, 2)) continue;
        if (Math.hypot(px - z.playerStart.x, pz - z.playerStart.z) < 10) continue;
        z.spawns.push({ id: `${z.id}_p${pn++}`, x: px, z: pz, members: composePack(rng, pool, rng.int(6, 10)), level: z.level, tag: 'pack' });
        break;
      }
    }
  }
  // urns
  for (let i = 0; i < 10; i++) {
    const r = rng.pick(rooms);
    const px = r.x + rng.range(2, r.w - 2);
    const pz = r.z + rng.range(2, r.h - 2);
    if (isFloorArea(z, px, pz, 1) && Math.hypot(px - z.playerStart.x, pz - z.playerStart.z) > 5) z.spawns.push({ id: `${z.id}_urn${i}`, x: px, z: pz, members: [rng.chance(0.25) ? 'powder' : 'urn'], level: z.level, tag: 'breakable' });
  }
  return z;
}

export function validateArchive(z: Zone): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const reach = flood(z.grid, z.playerStart.x, z.playerStart.z);
  const check = (name: string, p?: { x: number; z: number }) => {
    if (!p) {
      errors.push(`missing ${name}`);
      return;
    }
    let ok = false;
    for (let dz = -3; dz <= 3 && !ok; dz++) for (let dx = -3; dx <= 3 && !ok; dx++) {
      const cx = Math.floor(p.x) + dx;
      const cz = Math.floor(p.z) + dz;
      if (cx >= 0 && cz >= 0 && cx < z.w && cz < z.h && reach[cz * z.w + cx]) ok = true;
    }
    if (!ok) errors.push(`unreachable ${name}`);
  };
  check('stairsDown', z.anchors.stairsDown);
  check('stairsUp', z.anchors.stairsUp);
  check('landmark', z.anchors.landmark);
  if (z.kind === 'archive1') check('cage', z.anchors.cage);
  const rooms = z.meta.rooms as ArchiveRoom[];
  const tplCount: Record<string, number> = {};
  for (const r of rooms) if (r.role !== 'landmark') tplCount[r.tpl] = (tplCount[r.tpl] ?? 0) + 1;
  for (const [k, v] of Object.entries(tplCount)) if (v > 3) errors.push(`template ${k} repeated ${v}`);
  return { ok: errors.length === 0, errors };
}

// ------------------------------------------------------------------ Engine approach + boss routes
function carveArena(z: Zone, cx: number, cz: number, radius: number, bossId: string) {
  carveCircle(z, cx, cz, radius);
  z.bossArena = { x: cx, z: cz, r: radius, boss: bossId };
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    addProp(z, 'pillar', cx + Math.cos(a) * (radius - 1.2), cz + Math.sin(a) * (radius - 1.2), { s: 1.0, solid: 0.5, tall: true });
  }
  addProp(z, 'dais', cx, cz, { s: 3.6 });
  addLight(z, cx, cz, 0x5ee8ff, 2.4, 22);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    addLight(z, cx + Math.cos(a) * 11, cz + Math.sin(a) * 11, 0xff7a3c, 1.2, 12, true);
  }
}

export function buildEngineFloor(seed: number, diff: Difficulty, hunt = false): Zone {
  const z = makeZone(hunt ? 'hunt_engine' : 'archive3', hunt ? 'Target Hunt: Orison Engine' : 'Hollow Archive - Engine Approach', hunt ? 'hunt' : 'archive3', 'crypt', seed, 50, 92);
  z.level = lvl(12, diff);
  const rng = new Rng(seedFrom('engine', seed));
  const cx = 25;
  carveArena(z, cx, 24, 19, 'orison_engine');
  // door gap + approach hall
  carveRect(z, cx - 6, 42, 12, 34); // hall
  carveRect(z, cx - 8, 76, 16, 12); // start room
  z.playerStart = { x: cx, z: 83 };
  addInteract(z, 'stairs_up', cx - 5, 79, 'Stairs up', 2.2);
  addProp(z, 'stairs', cx - 5, 78.6, { s: 1.1 });
  const wp = addInteract(z, 'waypoint', cx + 2, 82, 'Engine Approach Waypoint', 2.2, { id: 'approach' });
  addProp(z, 'obelisk', wp.x, wp.z, { s: 0.95, solid: 1.0, tall: true });
  addProp(z, 'rune', wp.x, wp.z, { s: 1.3 });
  addLight(z, wp.x, wp.z, 0x5ee8ff, 2.0, 12);
  z.anchors.waypoint = { x: wp.x, z: wp.z };
  // hall pillars
  for (let pz = 46; pz < 74; pz += 6) {
    addProp(z, 'pillar', cx - 4, pz + 0.5, { s: 1, solid: 0.5, tall: true });
    addProp(z, 'pillar', cx + 4, pz + 0.5, { s: 1, solid: 0.5, tall: true });
    addLight(z, cx, pz, 0xff8844, 0.9, 10, true);
  }
  addProp(z, 'brazier', cx - 7, 80, { s: 1, solid: 0.5 });
  addProp(z, 'brazier', cx + 7, 80, { s: 1, solid: 0.5 });
  const door = addInteract(z, 'engine_door', cx, 43, 'Engine Door', 2.6, { open: true });
  door.hidden = true;
  z.anchors.arena = { x: cx, z: 24 };
  z.anchors.arenaDoor = { x: cx, z: 43 };
  if (hunt) {
    z.playerStart = { x: cx, z: 82 };
    z.interactables = z.interactables.filter((i) => i.kind !== 'stairs_up' && i.kind !== 'waypoint');
    z.level = lvl(14, diff);
  }
  const pool = ['warden', 'scribe', 'adept', 'husk', 'swarm'];
  let n = 0;
  for (const zz of [66, 56, 47]) {
    z.spawns.push({ id: `${z.id}_p${n++}`, x: cx + rng.range(-3, 3), z: zz, members: composePack(rng, pool, rng.int(7, 10)), level: z.level, tag: 'pack' });
  }
  for (let i = 0; i < 6; i++) z.spawns.push({ id: `${z.id}_urn${i}`, x: cx + rng.range(-5, 5), z: rng.range(50, 74), members: [rng.chance(0.25) ? 'powder' : 'urn'], level: z.level, tag: 'breakable' });
  return z;
}

export function buildTollHunt(seed: number, diff: Difficulty): Zone {
  const z = makeZone('hunt_toll', 'Target Hunt: The Toll-Keeper', 'hunt', 'wild', seed, 50, 80);
  z.level = lvl(7, diff);
  const rng = new Rng(seedFrom('tollhunt', seed));
  const cx = 25;
  carveArena(z, cx, 22, 14, 'toll_keeper');
  carveRect(z, cx - 5, 35, 10, 30);
  carveRect(z, cx - 8, 64, 16, 12);
  z.playerStart = { x: cx, z: 71 };
  z.anchors.arena = { x: cx, z: 22 };
  for (let i = 0; i < 10; i++) addProp(z, rng.chance(0.5) ? 'rock' : 'grave', cx + (rng.chance(0.5) ? -3.5 : 3.5) + rng.range(-0.5, 0.5), 38 + i * 2.7, { s: 1, solid: 0.4 });
  addLight(z, cx, 55, 0xff8844, 1.2, 12, true);
  addLight(z, cx, 45, 0xff8844, 1.2, 12, true);
  z.spawns.push({ id: 'th_p0', x: cx, z: 54, members: composePack(rng, ['crawler', 'archer', 'hound', 'husk'], 8), level: z.level, tag: 'pack' });
  z.spawns.push({ id: 'th_p1', x: cx, z: 42, members: composePack(rng, ['crawler', 'mite', 'archer', 'swarm'], 8), level: z.level, tag: 'pack' });
  return z;
}

export function addHuntExit(z: Zone) {
  const a = z.bossArena!;
  const it = addInteract(z, 'hunt_exit', a.x, a.z + 4, 'Return to Ember Refuge', 2.4, {});
  it.hidden = true;
  addProp(z, 'dais', a.x, a.z + 4, { s: 1.2 });
  return it;
}

export function addVictoryExit(z: Zone) {
  const a = z.bossArena!;
  const it = addInteract(z, 'exit_summary', a.x, a.z + 6, 'Orison Gateway', 2.4, {});
  it.hidden = true;
  return it;
}

export function openCells(z: Zone, cells: number[]) {
  for (const c of cells) z.grid.cells[c] = FLOOR;
}
