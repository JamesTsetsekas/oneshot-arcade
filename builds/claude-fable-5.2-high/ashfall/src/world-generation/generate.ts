import { Rng, hashSeed } from '../core/rng';
import { CELL, type Interactable, type Zone } from '../entity-combat/types';
import { DOOR, FLOOR, LOW, WALL, flood, isLowWall } from '../navigation-ai/grid';
import { TILE, TILES, TOWN_MAP, rotateRows } from './tiles';

export interface ZoneInfo { name: string; kind: Zone['kind']; level: [number, number]; prev?: string; next?: string }
export const ZONE_INFO: Record<string, ZoneInfo> = {
  refuge: { name: 'Ember Refuge', kind: 'town', level: [1, 1], next: 'march' },
  march: { name: 'The Soot March', kind: 'wild', level: [1, 15], prev: 'refuge', next: 'archive1' },
  archive1: { name: 'Hollow Archive · Reliquary Stacks', kind: 'crypt', level: [4, 17], prev: 'march', next: 'archive2' },
  archive2: { name: "Hollow Archive · Scholars' Deep", kind: 'crypt', level: [6, 18], prev: 'archive1', next: 'archive3' },
  archive3: { name: 'Hollow Archive · Engine Vault', kind: 'crypt', level: [8, 20], prev: 'archive2' },
  hunt_toll: { name: 'Target Hunt · The Tollhouse', kind: 'wild', level: [4, 18], prev: 'refuge' },
  hunt_engine: { name: 'Target Hunt · Engine Vault', kind: 'crypt', level: [8, 20], prev: 'refuge' },
};
const TS = 12;
interface Placed { name: string; gx: number; gy: number; rot: number; dist: number }
interface Layout { gw: number; gh: number; tiles: Placed[]; edges: [number, number][] }
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function grow(rng: Rng, gw: number, gh: number, start: number, count: number) {
  const set = new Set<number>([start]);
  const edges: [number, number][] = [];
  let guard = 0;
  while (set.size < count && guard++ < 500) {
    const from = rng.pick([...set]);
    const [dx, dy] = rng.pick(NB);
    const x = (from % gw) + dx, y = Math.floor(from / gw) + dy;
    if (x < 0 || y < 0 || x >= gw || y >= gh || set.has(y * gw + x)) continue;
    set.add(y * gw + x); edges.push([from, y * gw + x]);
  }
  return { set, edges };
}
function bfs(start: number, edges: [number, number][]): Map<number, number> {
  const d = new Map<number, number>([[start, 0]]);
  const q = [start];
  while (q.length) {
    const c = q.shift()!;
    for (const [a, b] of edges) {
      const n = a === c ? b : b === c ? a : -1;
      if (n >= 0 && !d.has(n)) { d.set(n, d.get(c)! + 1); q.push(n); }
    }
  }
  return d;
}
const degree = (s: number, edges: [number, number][]) => edges.filter(([a, b]) => a === s || b === s).length;

/** Soot March: 10–12 of 16 slots, required anchors, at least one loop, crypt reachable only through the tollhouse. */
export function planMarch(rng: Rng): Layout | null {
  const gw = 4, gh = 4, total = rng.int(10, 12);
  const start = (gh - 1) * gw + rng.int(0, gw - 1);
  const { set, edges } = grow(rng, gw, gh, start, total - 1);
  if (set.size < total - 1) return null;
  const d = bfs(start, edges);
  const freeNb = (s: number) => NB.map(([dx, dy]) => [(s % gw) + dx, Math.floor(s / gw) + dy]).filter(([x, y]) => x >= 0 && y >= 0 && x < gw && y < gh && !set.has(y * gw + x));
  const tollC = [...set].filter((s) => d.get(s)! >= 3 && freeNb(s).length > 0).sort((a, b) => d.get(b)! - d.get(a)! || a - b);
  if (!tollC.length) return null;
  const toll = tollC[0];
  const [cx, cy] = rng.pick(freeNb(toll));
  const crypt = cy * gw + cx;
  // Loop edges (shortcuts) between adjacent placed slots that the spanning tree did not connect.
  const extra: [number, number][] = [];
  for (const a of set) for (const [dx, dy] of [[1, 0], [0, 1]]) {
    const x = (a % gw) + dx, y = Math.floor(a / gw) + dy, b = y * gw + x;
    if (x < gw && y < gh && set.has(b) && !edges.some(([p, q]) => (p === a && q === b) || (p === b && q === a))) extra.push([a, b]);
  }
  if (!extra.length) return null;
  rng.shuffle(extra);
  edges.push(...extra.slice(0, Math.min(extra.length, rng.int(1, 2))));
  const assign = new Map<number, string>([[start, 'gate'], [toll, 'tollhouse']]);
  const un = () => [...set].filter((s) => !assign.has(s));
  const way = un().sort((a, b) => Math.abs(d.get(a)! - 2) - Math.abs(d.get(b)! - 2) || a - b)[0];
  if (way === undefined) return null;
  assign.set(way, 'ashway');
  const tollNb = un().filter((s) => edges.some(([a, b]) => (a === toll && b === s) || (b === toll && a === s)));
  const vista = tollNb[0] ?? un()[0];
  if (vista === undefined) return null;
  assign.set(vista, 'vista');
  const leaves = un().filter((s) => degree(s, edges) === 1);
  const hunter = leaves[0] ?? un()[0];
  if (hunter === undefined) return null;
  assign.set(hunter, 'huntercamp');
  const elite = un().sort((a, b) => d.get(b)! - d.get(a)! || a - b)[0];
  if (elite === undefined) return null;
  assign.set(elite, 'stonering');
  const generic = TILES.filter((t) => t.kind === 'wild' && !t.anchor);
  const used: Record<string, number> = {};
  const tiles: Placed[] = [];
  for (const s of set) {
    let name = assign.get(s), rot = 0;
    if (!name) {
      const pool = generic.filter((t) => (used[t.name] ?? 0) < 2);
      const t = rng.pick(pool);
      used[t.name] = (used[t.name] ?? 0) + 1; name = t.name; rot = rng.int(0, 3);
    }
    tiles.push({ name, gx: s % gw, gy: Math.floor(s / gw), rot, dist: d.get(s)! });
  }
  const tx = toll % gw, ty = Math.floor(toll / gw);
  tiles.push({ name: 'cryptdoor', gx: cx, gy: cy, rot: ty > cy ? 0 : tx < cx ? 1 : ty < cy ? 2 : 3, dist: d.get(toll)! + 1 });
  edges.push([toll, crypt]);
  return { gw, gh, tiles, edges };
}
/** Archive floors: 5–7 rooms on a 3x3 graph, entry and exit maximally separated, capped template repeats. */
export function planCrypt(rng: Rng, floor: number): Layout | null {
  const gw = 3, gh = 3;
  const start = rng.int(0, 8);
  const { set, edges } = grow(rng, gw, gh, start, rng.int(5, 7));
  const d = bfs(start, edges);
  const exit = [...set].sort((a, b) => d.get(b)! - d.get(a)! || a - b)[0];
  if (d.get(exit)! < 2) return null;
  const generic = TILES.filter((t) => t.kind === 'crypt' && !t.anchor);
  const used: Record<string, number> = {};
  const tiles: Placed[] = [];
  for (const s of set) {
    let name = s === start ? (floor === 1 ? 'c_entry' : 'c_entry2') : s === exit ? (floor === 1 ? 'c_stairs' : 'c_lever') : '', rot = 0;
    if (!name) {
      const t = rng.weighted(generic.filter((g) => (used[g.name] ?? 0) < 2), (g) => g.weight![floor - 1]);
      used[t.name] = (used[t.name] ?? 0) + 1; name = t.name; rot = rng.int(0, 3);
    }
    tiles.push({ name, gx: s % gw, gy: Math.floor(s / gw), rot, dist: d.get(s)! });
  }
  for (const a of set) for (const [dx, dy] of [[1, 0], [0, 1]]) {
    const x = (a % gw) + dx, y = Math.floor(a / gw) + dy, b = y * gw + x;
    if (x < gw && y < gh && set.has(b) && !edges.some(([p, q]) => (p === a && q === b) || (p === b && q === a)) && rng.chance(0.35)) edges.push([a, b]);
  }
  return { gw, gh, tiles, edges };
}
function stamp(layout: Layout, wide: boolean): { g: string[][]; lv: number[][] } {
  const w = layout.gw * TS, h = layout.gh * TS;
  const g: string[][] = Array.from({ length: h }, () => Array(w).fill('#'));
  const lv: number[][] = Array.from({ length: h }, () => Array(w).fill(0));
  for (const t of layout.tiles) {
    const rows = rotateRows(TILE[t.name].rows, t.rot);
    for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) { g[t.gy * TS + y][t.gx * TS + x] = rows[y]?.[x] ?? '#'; lv[t.gy * TS + y][t.gx * TS + x] = t.dist; }
  }
  const [o0, o1] = wide ? [3, 8] : [5, 6];
  const carve = (x: number, y: number, dx: number, dy: number) => {
    for (let i = 0; i < 6; i++) { const cx = x + dx * i, cy = y + dy * i; if (g[cy][cx] !== '#') break; g[cy][cx] = '.'; }
  };
  for (const [a, b] of layout.edges) {
    const ax = a % layout.gw, ay = Math.floor(a / layout.gw), bx = b % layout.gw, by = Math.floor(b / layout.gw);
    const lx = Math.min(ax, bx), ly = Math.min(ay, by);
    for (let o = o0; o <= o1; o++) {
      if (ay === by) { carve(lx * TS + TS - 1, ay * TS + o, -1, 0); carve((lx + 1) * TS, ay * TS + o, 1, 0); }
      else { carve(ax * TS + o, ly * TS + TS - 1, 0, -1); carve(ax * TS + o, (ly + 1) * TS, 0, 1); }
    }
  }
  return { g, lv };
}
function vault(hunt: boolean): string[][] {
  const w = 17, h = 28;
  const g: string[][] = Array.from({ length: h }, () => Array(w).fill('#'));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (Math.hypot(x - 8, y - 8) <= 6.6) g[y][x] = '.';
    if (x >= 7 && x <= 9 && y >= 14 && y <= 22) g[y][x] = '.';
    if (x >= 5 && x <= 11 && y >= 22 && y <= 26) g[y][x] = '.';
  }
  g[8][8] = 'B'; g[25][8] = 'S'; g[24][6] = 'W'; g[26][8] = 'X';
  g[23][5] = 'u'; g[23][11] = 'u'; g[25][10] = 'h';
  if (!hunt) g[18][8] = 'P';
  return g;
}
const NPCS: Record<string, [string, string]> = { '1': ['elder', 'Elder Maren'], '2': ['vendor', 'Quartermaster Bren'], '3': ['healer', 'Sister Ysolde'], '5': ['artificer', 'Artificer Ilse'], H: ['hunter', 'Hunter Orrin'] };

/** Builds a deterministic zone from (run seed, zone id, difficulty). Retries plans until validation passes. */
export function generateZone(id: string, runSeed: number, difficulty: number): Zone {
  const info = ZONE_INFO[id];
  const seed = hashSeed(runSeed, `${id}:${difficulty}`);
  for (let attempt = 0; attempt < 60; attempt++) {
    const rng = new Rng(hashSeed(seed, 'plan' + attempt));
    let g: string[][], lv: number[][] | null = null, layout: Layout | null = null;
    if (id === 'refuge') g = TOWN_MAP.map((r) => r.split(''));
    else if (id === 'archive3' || id === 'hunt_engine') g = vault(id === 'hunt_engine');
    else {
      layout = id === 'march' ? planMarch(rng) : id === 'hunt_toll'
        ? { gw: 1, gh: 2, tiles: [{ name: 'tollhouse', gx: 0, gy: 0, rot: 0, dist: 3 }, { name: 'gate', gx: 0, gy: 1, rot: 0, dist: 3 }], edges: [[0, 1]] }
        : planCrypt(rng, id === 'archive1' ? 1 : 2);
      if (!layout) continue;
      ({ g, lv } = stamp(layout, info.kind === 'wild'));
    }
    const zone = finalize(id, info, g, lv, seed, difficulty);
    if (layout) {
      zone.tiles = layout.tiles.map((t) => ({ name: t.name, gx: t.gx, gy: t.gy }));
      zone.edges = layout.edges.map(([a, b]) => `${Math.min(a, b)}-${Math.max(a, b)}`);
    }
    if (!validateZone(zone).length) return zone;
  }
  throw new Error(`World generation failed for ${id} seed ${runSeed}`);
}
function finalize(id: string, info: ZoneInfo, g: string[][], lv: number[][] | null, seed: number, difficulty: number): Zone {
  const h = g.length, w = g[0].length;
  const zone: Zone = {
    id, name: info.name, kind: info.kind, level: info.level[Math.min(1, difficulty)], w, h, seed,
    cells: new Uint8Array(w * h), discovered: new Uint8Array(w * h), props: [], actors: [], projectiles: [], areas: [], pickups: [], inter: [],
    entries: {}, time: 0, safe: info.kind === 'town', landmarks: {}, tiles: [], edges: [], spawns: [],
  };
  let nid = 1;
  const inter = (x: number, y: number, type: Interactable['type'], label: string, extra: Partial<Interactable> = {}) => {
    const it: Interactable = { id: nid++, x, y, type, label, state: 0, ...extra }; zone.inter.push(it); return it;
  };
  const doorCells: number[] = [];
  const hash = (x: number, y: number) => hashSeed(seed, `${x},${y}`);
  for (let cy = 0; cy < h; cy++) for (let cx = 0; cx < w; cx++) {
    const ch = g[cy][cx], i = cy * w + cx, x = cx * CELL + CELL / 2, y = cy * CELL + CELL / 2;
    const lvOff = lv ? Math.min(3, Math.floor(lv[cy][cx] / (info.kind === 'wild' ? 1.5 : 2.5))) : 0;
    const spawn = (kind: string) => zone.spawns.push({ x, y, kind: `${kind}:${lvOff}` });
    zone.cells[i] = FLOOR;
    switch (ch) {
      case '#': zone.cells[i] = WALL; break;
      case 'o': zone.cells[i] = LOW; zone.props.push({ type: info.kind === 'crypt' ? 'pillar' : 'rock', x, y, rot: (hash(cx, cy) % 628) / 100, scale: 0.85 + (hash(cy, cx) % 40) / 100 }); break;
      case 'l': zone.cells[i] = LOW; zone.props.push({ type: 'statue', x, y, rot: 0, scale: 1 }); zone.landmarks.vista = { x, y }; break;
      case 'f': zone.cells[i] = LOW; zone.props.push({ type: 'campfire', x, y, rot: 0, scale: 1 }); break;
      case 'n': zone.cells[i] = LOW; zone.props.push({ type: 'tent', x, y, rot: (hash(cx, cy) % 4) * 0.4, scale: 1 }); break;
      case 'x': zone.cells[i] = LOW; zone.props.push({ type: 'crate', x, y, rot: (hash(cx, cy) % 628) / 100, scale: 1 }); break;
      case 'D': zone.cells[i] = DOOR; doorCells.push(i); break;
      case 'u': spawn('urn'); break;
      case 'b': spawn('brazier'); break;
      case 'd': spawn('dummy'); break;
      case 'p': case 'P': case 'E': case 'B': spawn(ch); if (ch === 'B') zone.landmarks.boss = { x, y }; if (ch === 'E') zone.landmarks.elite = { x, y }; break;
      case 'c': inter(x, y, 'chest', 'Chest'); break;
      case 'h': inter(x, y, 'shrine', 'Ember Shrine'); break;
      case 'W': inter(x, y, 'waypoint', id === 'refuge' ? 'Refuge Waypoint' : id === 'march' ? 'Ashway Waypoint' : 'Vault Waypoint', { key: id }); zone.entries.waypoint = { x: x + 1.6, y: y + 1.2 }; zone.landmarks.waypoint = { x, y }; break;
      case 'X': { const to = info.prev ?? info.next!; inter(x, y, 'exit', `To ${ZONE_INFO[to].name}`, { to }); zone.landmarks.exitBack = { x, y }; break; }
      case 'Y': if (info.next) { inter(x, y, 'exit', `To ${ZONE_INFO[info.next].name}`, { to: info.next }); zone.landmarks.exitNext = { x, y }; } break;
      case 'Z': if (info.next) inter(x, y, 'exit', `Shortcut to ${ZONE_INFO[info.next].name}`, { to: info.next, key: 'shortcut' }); break;
      case 'S': zone.entries.start = { x, y }; break;
      case 'L': inter(x, y, 'lever', 'Rusted Lever'); zone.landmarks.lever = { x, y }; break;
      case 't': inter(x, y, 'trap', '', { t: (hash(cx, cy) % 30) / 10 }); break;
      case 'K': inter(x, y, 'cage', 'Iron Cage'); zone.landmarks.cage = { x, y }; break;
      case 'T': inter(x, y, 'portal', 'Hunt Portal', { key: 'hunt' }); break;
      case '4': inter(x, y, 'stash', 'Stash'); break;
      case '1': case '2': case '3': case '5': case 'H': inter(x, y, 'npc', NPCS[ch][1], { npc: NPCS[ch][0] }); if (ch === 'H') zone.landmarks.hunter = { x, y }; break;
      default: break;
    }
  }
  if (doorCells.length) inter((doorCells[0] % w) * CELL + CELL / 2, Math.floor(doorCells[0] / w) * CELL + CELL / 2, 'door', 'Sealed Door', { cells: doorCells, key: 'shortcut' });
  if (info.kind === 'crypt') {
    // Torches sit on the camera-facing side of tall walls (camera looks toward +x,+y) so they are always visible.
    const open = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && zone.cells[y * w + x] !== WALL;
    for (let cy = 1; cy < h; cy++) for (let cx = 0; cx < w; cx++) {
      if (zone.cells[cy * w + cx] !== WALL || hash(cx, cy) % 4 !== 0) continue;
      if (open(cx, cy - 1) && !isLowWall(zone, cx, cy)) zone.props.push({ type: 'torch', x: cx * CELL + 1, y: cy * CELL - 0.12, rot: 0, scale: 1 });
    }
  }
  if (id === 'archive3' || id === 'hunt_engine') zone.arena = { x: 17, y: 17, r: 13 };
  if (id === 'hunt_toll' || id === 'march') { const b = zone.landmarks.boss; if (b) zone.arena = { x: b.x + 1, y: b.y + 1, r: 11 }; }
  if (!zone.entries.start) zone.entries.start = { x: w, y: h };
  for (const it of zone.inter) {
    if (it.type !== 'exit' || it.key === 'shortcut') continue;
    let best = zone.entries.start, bd = Infinity;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const x = it.x + dx * CELL, y = it.y + dy * CELL;
      if ((!dx && !dy) || zone.cells[Math.floor(y / CELL) * w + Math.floor(x / CELL)] !== FLOOR) continue;
      const d = Math.hypot(x - zone.entries.start.x, y - zone.entries.start.y);
      if (d < bd) { bd = d; best = { x, y }; }
    }
    zone.entries['from:' + it.to] ??= best;
  }
  return zone;
}
/** Structural validation: required landmarks exist and every objective, spawn and exit is reachable from the start. */
export function validateZone(zone: Zone): string[] {
  const problems: string[] = [];
  const s = zone.entries.start;
  const seen = flood(zone, s.x, s.y);
  const reach = (x: number, y: number) => seen[Math.floor(y / CELL) * zone.w + Math.floor(x / CELL)] === 1;
  if (!reach(s.x, s.y)) problems.push('start blocked');
  for (const it of zone.inter) {
    if (it.key === 'shortcut') continue;
    const ok = reach(it.x, it.y) || [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => reach(it.x + dx * CELL, it.y + dy * CELL));
    if (!ok) problems.push(`unreachable ${it.type} ${it.label}`);
  }
  for (const sp of zone.spawns) if (!reach(sp.x, sp.y)) problems.push(`unreachable spawn ${sp.kind}`);
  const need: Record<string, string[]> = {
    march: ['waypoint', 'boss', 'cage', 'exitBack', 'exitNext', 'hunter', 'elite', 'vista'], archive1: ['exitBack', 'exitNext'],
    archive2: ['exitBack', 'exitNext', 'lever', 'elite'], archive3: ['boss', 'waypoint', 'exitBack'], refuge: ['waypoint', 'exitBack'],
    hunt_toll: ['boss', 'exitBack'], hunt_engine: ['boss', 'exitBack'],
  };
  for (const k of need[zone.id] ?? []) {
    if (k === 'exitBack' && zone.id === 'refuge') { if (!zone.inter.some((i) => i.type === 'exit')) problems.push('missing exit'); continue; }
    if (!zone.landmarks[k]) problems.push(`missing landmark ${k}`);
  }
  if (zone.id === 'march') {
    if (zone.tiles.length < 10 || zone.tiles.length > 12) problems.push(`tile count ${zone.tiles.length}`);
    if (zone.edges.length < zone.tiles.length) problems.push('no loop');
    const names = zone.tiles.map((t) => t.name);
    for (const t of new Set(names)) if (names.filter((n) => n === t).length > 2) problems.push(`template ${t} repeated too often`);
  }
  return problems;
}
