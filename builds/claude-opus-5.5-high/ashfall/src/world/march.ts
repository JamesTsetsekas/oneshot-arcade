import { Rng } from "../core/rng";
import type { Difficulty } from "../data/types";
import { floodReach } from "../sim/nav";
import { ZoneBuilder, composePack } from "./builder";
import { BLOCK, FLOOR, PIT, ROAD, type ZoneData } from "./types";

export const TILE = 22;
export const GRID = 4;

export const MARCH_TEMPLATES = [
  // anchors
  "refuge_gate", "tollhouse", "waypoint_shrine", "hunter_camp", "elite_ring", "boss_gate",
  // fillers
  "ash_field", "dead_grove", "sinkhole", "broken_wall", "cart_road", "bone_pit", "bell_ruins", "star_crater",
  "cairn_field", "stake_line", "mire", "shrine_ruin", "charred_farm", "crossroads",
] as const;
export type MarchTemplate = (typeof MARCH_TEMPLATES)[number];
const FILLERS = MARCH_TEMPLATES.slice(6) as MarchTemplate[];

export interface MarchTile { gx: number; gy: number; template: MarchTemplate; depth: number; reward: boolean }
type Dir = "n" | "e" | "s" | "w";
const DIRS: [Dir, number, number][] = [["n", 0, -1], ["e", 1, 0], ["s", 0, 1], ["w", -1, 0]];

const key = (x: number, y: number) => `${x},${y}`;

export const MARCH_POOL: [string, number][] = [["ash_crawler", 3], ["soot_archer", 2], ["mire_hound", 2], ["lantern_mite", 1.4], ["bell_husk", 1], ["chain_pilgrim", 1]];

export function generateMarch(seed: number, difficulty: Difficulty): ZoneData {
  for (let attempt = 0; attempt < 40; attempt++) {
    const z = tryGenerate(seed, difficulty, attempt);
    if (z) return z;
  }
  throw new Error("march generation failed");
}

function tryGenerate(seed: number, difficulty: Difficulty, attempt: number): ZoneData | null {
  const rng = Rng.from(seed, "march", difficulty, attempt);
  const vet = difficulty === "veteran";
  const baseLevel = vet ? 14 : 2;
  const start = { x: 0, y: rng.int(1, 2) };
  const end = { x: 3, y: rng.int(0, 3) };

  // main path: dijkstra with random edge weights
  const w: Record<string, number> = {};
  const ew = (a: string, b: string) => { const k = a < b ? a + "|" + b : b + "|" + a; return (w[k] ??= rng.range(1, 4)); };
  const distM: Record<string, number> = { [key(start.x, start.y)]: 0 };
  const prev: Record<string, string> = {};
  const open = new Set([key(start.x, start.y)]);
  const done = new Set<string>();
  while (open.size) {
    let best = "", bd = Infinity;
    for (const k of open) if (distM[k] < bd) { bd = distM[k]; best = k; }
    open.delete(best); done.add(best);
    const [bx, by] = best.split(",").map(Number);
    for (const [, dx, dy] of DIRS) {
      const nx = bx + dx, ny = by + dy;
      if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) continue;
      const nk = key(nx, ny);
      if (done.has(nk)) continue;
      const nd = bd + ew(best, nk);
      if (nd < (distM[nk] ?? Infinity)) { distM[nk] = nd; prev[nk] = best; open.add(nk); }
    }
  }
  const path: string[] = [];
  for (let k: string | undefined = key(end.x, end.y); k; k = prev[k]) path.unshift(k);
  if (path.length < 5) return null;

  const selected = new Set(path);
  const edges = new Set<string>();
  const ek = (a: string, b: string) => (a < b ? a + "|" + b : b + "|" + a);
  for (let i = 0; i + 1 < path.length; i++) edges.add(ek(path[i], path[i + 1]));
  const endK = key(end.x, end.y);
  const target = rng.int(10, 12);
  let guard = 0;
  while (selected.size < target && guard++ < 200) {
    const from = rng.pick([...selected].filter((k) => k !== endK));
    const [fx, fy] = from.split(",").map(Number);
    const [, dx, dy] = rng.pick(DIRS);
    const nx = fx + dx, ny = fy + dy;
    if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) continue;
    const nk = key(nx, ny);
    if (selected.has(nk)) continue;
    selected.add(nk);
    edges.add(ek(from, nk));
  }
  if (selected.size < 10) return null;
  // loops: add 1–2 extra edges not touching the boss tile
  const cands: string[] = [];
  for (const k of selected) {
    if (k === endK) continue;
    const [x, y] = k.split(",").map(Number);
    for (const [, dx, dy] of DIRS) {
      const nk = key(x + dx, y + dy);
      if (!selected.has(nk) || nk === endK) continue;
      const e = ek(k, nk);
      if (!edges.has(e) && !cands.includes(e)) cands.push(e);
    }
  }
  if (!cands.length) return null;
  rng.shuffle(cands);
  const loops = cands.slice(0, Math.min(2, cands.length));
  const shortcut = loops[0];
  for (const e of loops) edges.add(e);

  // degrees and depth (BFS from start over edges)
  const adj: Record<string, string[]> = {};
  for (const e of edges) { const [a, b] = e.split("|"); (adj[a] ??= []).push(b); (adj[b] ??= []).push(a); }
  const depth: Record<string, number> = { [path[0]]: 0 };
  const q = [path[0]];
  while (q.length) { const c = q.shift()!; for (const n of adj[c] ?? []) if (depth[n] === undefined) { depth[n] = depth[c] + 1; q.push(n); } }

  // anchors
  const tiles: Record<string, MarchTile> = {};
  for (const k of selected) { const [gx, gy] = k.split(",").map(Number); tiles[k] = { gx, gy, template: "ash_field", depth: depth[k] ?? 0, reward: false }; }
  tiles[path[0]].template = "refuge_gate";
  tiles[endK].template = "boss_gate";
  const wpK = path[Math.max(1, Math.floor((path.length - 1) / 2))];
  tiles[wpK].template = "waypoint_shrine";
  const free = () => [...selected].filter((k) => tiles[k].template === "ash_field");
  const leaves = () => free().filter((k) => (adj[k]?.length ?? 0) === 1);
  const pathFree = path.filter((k) => tiles[k].template === "ash_field");
  const tollK = pathFree.length ? pathFree[0] : rng.pick(free());
  tiles[tollK].template = "tollhouse";
  const hunterK = leaves().length ? rng.pick(leaves()) : rng.pick(free());
  tiles[hunterK].template = "hunter_camp";
  const eliteCands = leaves().length ? leaves() : free();
  const eliteK = rng.pick(eliteCands);
  tiles[eliteK].template = "elite_ring";
  // fillers: cap 1 use per template (14 fillers ≥ remaining tiles); no two identical adjacent
  const fillers = rng.shuffle(FILLERS.slice());
  let fi = 0;
  for (const k of free()) tiles[k].template = fillers[fi++ % fillers.length];
  // dead-end rewards
  for (const k of selected) if ((adj[k]?.length ?? 0) === 1 && k !== path[0] && k !== endK) tiles[k].reward = true;

  // ── carve ──
  const W = TILE * GRID, H = TILE * GRID;
  const zb = new ZoneBuilder("march", "The Soot March", "march", W, H, seed, difficulty, baseLevel);
  for (const k of selected) {
    const t = tiles[k];
    zb.rect(t.gx * TILE + 2, t.gy * TILE + 2, TILE - 4, TILE - 4, FLOOR);
  }
  const center = (k: string) => { const t = tiles[k]; return { x: t.gx * TILE + TILE / 2, y: t.gy * TILE + TILE / 2 }; };
  // openings + roads
  const edgeInfo: { a: string; b: string; x: number; y: number; shortcut: boolean }[] = [];
  for (const e of edges) {
    const [a, b] = e.split("|");
    const ca = center(a), cb = center(b);
    const off = rng.int(-3, 3);
    const horizontal = ca.y === cb.y;
    const ox = horizontal ? (ca.x + cb.x) / 2 : ca.x + off;
    const oy = horizontal ? ca.y + off : (ca.y + cb.y) / 2;
    // opening through the double border
    if (horizontal) zb.rect(Math.floor(ox) - 3, Math.floor(oy) - 2, 6, 5, ROAD);
    else zb.rect(Math.floor(ox) - 2, Math.floor(oy) - 3, 5, 6, ROAD);
    // roads to both centers
    for (const c of [ca, cb]) {
      zb.corridor(Math.floor(ox), Math.floor(oy), Math.floor(c.x), Math.floor(c.y), 3, ROAD, !horizontal);
      zb.reserve(Math.min(Math.floor(ox), Math.floor(c.x)) - 2, Math.min(Math.floor(oy), Math.floor(c.y)) - 2, Math.abs(Math.floor(ox) - Math.floor(c.x)) + 5, Math.abs(Math.floor(oy) - Math.floor(c.y)) + 5);
    }
    edgeInfo.push({ a, b, x: ox, y: oy, shortcut: e === shortcut });
  }
  for (const k of selected) { const c = center(k); zb.reserveCircle(c.x, c.y, 3); }

  // shortcut: a collapsed stake barricade that the player can pull down from either side
  const sc = edgeInfo.find((e) => e.shortcut)!;
  const scCells: [number, number][] = [];
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) scCells.push([Math.floor(sc.x) + dx, Math.floor(sc.y) + dy]);
  for (const [x, y] of scCells) zb.set(x, y, BLOCK);
  zb.interact("gate", sc.x, sc.y, "Collapsed Barricade", { cells: scCells, shortcut: true, prompt: "Pull down the barricade" });

  // per-tile features
  for (const k of selected) decorateTile(zb, rng, tiles[k], adj[k]?.length ?? 0, baseLevel, difficulty);

  // entries
  const sk = center(path[0]);
  zb.entries.start = { x: tiles[path[0]].gx * TILE + 4.5, y: sk.y + 0.5 };
  zb.rect(tiles[path[0]].gx * TILE + 1, Math.floor(sk.y) - 2, 4, 5, ROAD);

  // validation: everything reachable from start (shortcut barricade counts as closed)
  const reach = floodReach(zb, zb.entries.start.x, zb.entries.start.y);
  const ok = (x: number, y: number) => reach[Math.floor(y) * W + Math.floor(x)] === 1;
  for (const it of zb.interactables) {
    if (it.kind === "gate") continue;
    if (!nearReach(reach, W, it.x, it.y)) return null;
  }
  zb.packs = zb.packs.filter((p) => ok(p.x, p.y));
  zb.props = zb.props.filter((p) => true);
  zb.meta = {
    ...zb.meta,
    tiles: Object.values(tiles), edges: [...edges], loops: loops.length, shortcut, path, tileSize: TILE, grid: GRID,
    templateCounts: countTemplates(Object.values(tiles)), attempt,
  };
  return zb.build();
}

function countTemplates(t: MarchTile[]) {
  const c: Record<string, number> = {};
  for (const x of t) c[x.template] = (c[x.template] ?? 0) + 1;
  return c;
}

export function nearReach(reach: Uint8Array, W: number, x: number, y: number): boolean {
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (reach[(Math.floor(y) + dy) * W + Math.floor(x) + dx]) return true;
  return false;
}

function scatter(zb: ZoneBuilder, rng: Rng, x0: number, y0: number, n: number, kind: "rock" | "deadtree" | "cairn" | "pit" | "bones" | "crystal", block = true) {
  for (let i = 0; i < n; i++) {
    const x = rng.int(x0 + 3, x0 + TILE - 4), y = rng.int(y0 + 3, y0 + TILE - 4);
    if (zb.isReserved(x, y) || !zb.open(x, y)) continue;
    if (kind === "pit") {
      const r = rng.range(1.2, 2.4);
      let clash = false;
      for (let yy = Math.floor(y - r); yy <= y + r; yy++) for (let xx = Math.floor(x - r); xx <= x + r; xx++) if (zb.isReserved(xx, yy)) clash = true;
      if (!clash) zb.circle(x + 0.5, y + 0.5, r, PIT);
      continue;
    }
    const propKind = kind === "cairn" ? "rock" : kind;
    zb.prop(propKind, x + 0.5, y + 0.5, rng.range(0, 6.28), kind === "cairn" ? 0.7 : rng.range(0.8, 1.5), block && kind !== "bones");
  }
}

function placePack(zb: ZoneBuilder, rng: Rng, t: MarchTile, level: number, difficulty: Difficulty, elite = false, kind: "normal" | "elite" = "normal") {
  const x0 = t.gx * TILE, y0 = t.gy * TILE;
  for (let i = 0; i < 40; i++) {
    const x = rng.int(x0 + 4, x0 + TILE - 5), y = rng.int(y0 + 4, y0 + TILE - 5);
    if (!zb.open(x, y) || !zb.open(x + 1, y) || !zb.open(x, y + 1) || !zb.open(x - 1, y) || !zb.open(x, y - 1)) continue;
    if (zb.packs.some((p) => Math.hypot(p.x - x, p.y - y) < 9)) continue;
    const comp = composePack(rng, MARCH_POOL, 5, 10, elite, difficulty);
    const vetElite = difficulty === "veteran" && !elite && rng.chance(0.25);
    if (vetElite) {
      const c2 = composePack(rng, MARCH_POOL, 4, 7, true, difficulty);
      zb.pack({ x: x + 0.5, y: y + 0.5, members: c2.members, kind: "elite", level, points: c2.points });
    } else zb.pack({ x: x + 0.5, y: y + 0.5, members: comp.members, kind, level, points: comp.points });
    return;
  }
}

function decorateTile(zb: ZoneBuilder, rng: Rng, t: MarchTile, degree: number, baseLevel: number, difficulty: Difficulty) {
  const x0 = t.gx * TILE, y0 = t.gy * TILE;
  const cx = x0 + TILE / 2, cy = y0 + TILE / 2;
  const level = baseLevel + Math.min(4, Math.floor(t.depth * 0.75));
  const packs = (n: number) => { for (let i = 0; i < n; i++) placePack(zb, rng, t, level, difficulty); };
  switch (t.template) {
    case "refuge_gate":
      zb.prop("palisade", x0 + 2.5, cy - 3.5, Math.PI / 2, 1);
      zb.prop("palisade", x0 + 2.5, cy + 4.5, Math.PI / 2, 1);
      zb.prop("torch", x0 + 4, cy - 2.5); zb.prop("torch", x0 + 4, cy + 3.5);
      zb.light(x0 + 4, cy, "#ff9a50", 1.2, 9);
      zb.interact("exit", x0 + 2.2, cy + 0.5, "Road to Ember Refuge", { to: "refuge", entry: "gate" });
      zb.landmark("gate", "Refuge Gate", x0 + 3, cy);
      scatter(zb, rng, x0, y0, 10, "deadtree");
      scatter(zb, rng, x0, y0, 8, "rock");
      // one light pack far from the gate
      for (let i = 0; i < 30; i++) {
        const x = rng.int(x0 + 13, x0 + TILE - 5), y = rng.int(y0 + 4, y0 + TILE - 5);
        if (zb.open(x, y) && zb.open(x + 1, y) && zb.open(x, y + 1)) { zb.pack({ x: x + 0.5, y: y + 0.5, members: [{ enemy: "ash_crawler" }, { enemy: "ash_crawler" }, { enemy: "ash_crawler" }, { enemy: "ash_crawler" }, { enemy: "soot_archer" }], kind: "normal", level: baseLevel - 1, points: 6 }); break; }
      }
      break;
    case "tollhouse": {
      // ruined tollhouse: broken walls around a chest
      const hx = cx + (rng.chance(0.5) ? 4 : -6), hy = cy + (rng.chance(0.5) ? 4 : -6);
      for (let i = 0; i < 6; i++) { const wx = hx + i - 1; if (!zb.isReserved(Math.floor(wx), Math.floor(hy - 1))) zb.prop("ruinwall", wx + 0.5, hy - 0.5, 0, 1, true); }
      for (let i = 0; i < 4; i++) { const wy = hy + i; if (!zb.isReserved(Math.floor(hx - 1), Math.floor(wy))) zb.prop("ruinwall", hx - 0.5, wy + 0.5, Math.PI / 2, 1, true); }
      const spot = zb.findSpot(rng, Math.floor(hx), Math.floor(hy), 4, 3, 0) ?? { x: hx + 1.5, y: hy + 1.5 };
      zb.interact("chest", spot.x, spot.y, "Toll Coffer", { tier: 1 });
      zb.landmark("tollhouse", "Ruined Tollhouse", hx + 2, hy + 1);
      zb.prop("cart", cx - 5, cy + 6, 0.6, 1, true);
      zb.prop("torch", hx + 4, hy - 1);
      zb.light(hx + 2, hy + 1, "#ff9050", 0.9, 8);
      scatter(zb, rng, x0, y0, 5, "rock");
      packs(1);
      break;
    }
    case "waypoint_shrine":
      zb.interact("waypoint", cx + 0.5, cy + 0.5, "Ashway Waypoint", { wp: "ashway" });
      zb.landmark("waypoint", "Ashway Shrine", cx, cy);
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; zb.prop("pillar", cx + Math.cos(a) * 5.5, cy + Math.sin(a) * 5.5, a, 0.8, !zb.isReserved(Math.floor(cx + Math.cos(a) * 5.5), Math.floor(cy + Math.sin(a) * 5.5))); }
      zb.light(cx, cy, "#5ff0ff", 1.4, 10);
      scatter(zb, rng, x0, y0, 6, "deadtree");
      packs(1);
      break;
    case "hunter_camp":
      zb.interact("npc", cx + 1.5, cy - 0.5, "Hunter Sela", { npc: "sela" });
      zb.prop("tent", cx - 2, cy - 3, 0.4, 1, true);
      zb.prop("bonfire", cx - 1, cy + 1.5, 0, 0.8, true);
      zb.light(cx - 1, cy + 1.5, "#ffa040", 1.3, 9);
      zb.landmark("hunter_camp", "Hunter's Camp", cx, cy);
      zb.meta.hunterCamp = { x: cx, y: cy, level };
      scatter(zb, rng, x0, y0, 8, "deadtree");
      break;
    case "elite_ring": {
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const px = cx + Math.cos(a) * 6.5, py = cy + Math.sin(a) * 6.5; zb.prop("rock", px, py, a, 1.3, !zb.isReserved(Math.floor(px), Math.floor(py))); }
      zb.interact("chest", cx + 0.5, cy + 0.5, "Ashen Reliquary", { tier: 2 });
      const comp = composePack(rng, MARCH_POOL, 4, 8, true, difficulty);
      zb.pack({ x: cx + 2.5, y: cy + 0.5, members: comp.members, kind: "elite", level: level + 1, points: comp.points });
      zb.landmark("elite", "Ring of Cinders", cx, cy);
      zb.light(cx, cy, "#ff5030", 1.0, 9);
      scatter(zb, rng, x0, y0, 4, "bones", false);
      break;
    }
    case "boss_gate": {
      zb.circle(cx, cy, 9.5, FLOOR);
      zb.reserveCircle(cx, cy, 9.5);
      // crypt entrance on the far (east) side
      zb.rect(Math.floor(cx) + 8, Math.floor(cy) - 2, 4, 4, ROAD);
      zb.interact("exit", cx + 9.5, cy, "Hollow Archive", { to: "archive1", entry: "start", requires: "boss_tollkeeper", sealedText: "The Toll-Keeper's chain bars the way." });
      zb.prop("arch", cx + 10, cy, 0, 1.2);
      zb.landmark("crypt", "Crypt Entrance", cx + 10, cy);
      zb.landmark("vista", "Toll-Keeper's Gate", cx, cy);
      for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; zb.prop("torch", cx + Math.cos(a) * 9, cy + Math.sin(a) * 9); }
      zb.light(cx, cy, "#ff7040", 1.4, 14);
      zb.pack({ x: cx, y: cy, members: [{ enemy: "tollkeeper", boss: true }], kind: "boss", level: level + 2, points: 0, dormant: true });
      zb.meta.arena = { x: cx, y: cy, r: 9.5 };
      zb.entries.crypt = { x: cx + 7.5, y: cy + 0.5 };
      break;
    }
    case "ash_field": scatter(zb, rng, x0, y0, 14, "rock"); packs(2); break;
    case "dead_grove": scatter(zb, rng, x0, y0, 26, "deadtree"); packs(1); break;
    case "sinkhole": zb.circle(cx + rng.int(-3, 3), cy + rng.int(-3, 3), 3.5, PIT); scatter(zb, rng, x0, y0, 6, "rock"); packs(2); break;
    case "broken_wall":
      for (let s = 0; s < 4; s++) { const wx = rng.int(x0 + 4, x0 + 14), wy = rng.int(y0 + 4, y0 + 17); for (let i = 0; i < 5; i++) if (!zb.isReserved(wx + i, wy)) zb.prop("ruinwall", wx + i + 0.5, wy + 0.5, 0, 1, true); }
      packs(2); break;
    case "cart_road": for (let i = 0; i < 3; i++) { const p = zb.findSpot(rng, x0 + 3, y0 + 3, TILE - 6, TILE - 6, 1); if (p) zb.prop("cart", p.x, p.y, rng.range(0, 3), 1, true); } scatter(zb, rng, x0, y0, 6, "rock"); packs(2); break;
    case "bone_pit": scatter(zb, rng, x0, y0, 3, "pit"); scatter(zb, rng, x0, y0, 10, "bones", false); packs(2); break;
    case "bell_ruins": for (let i = 0; i < 5; i++) { const p = zb.findSpot(rng, x0 + 3, y0 + 3, TILE - 6, TILE - 6, 1); if (p) zb.prop("pillar", p.x, p.y, 0, rng.range(0.6, 1.1), true); } packs(2); break;
    case "star_crater": zb.circle(cx + 0.5, cy + 0.5, 2.2, PIT); scatter(zb, rng, x0, y0, 8, "crystal"); zb.light(cx, cy, "#40e0ff", 1.2, 10); packs(2); break;
    case "cairn_field": scatter(zb, rng, x0, y0, 18, "cairn"); packs(2); break;
    case "stake_line": for (let i = 0; i < 3; i++) { const wy = rng.int(y0 + 4, y0 + 17); for (let x = x0 + 3; x < x0 + TILE - 3; x += 2) if (!zb.isReserved(x, wy)) zb.prop("palisade", x + 0.5, wy + 0.5, 0, 0.6, true); } packs(2); break;
    case "mire": scatter(zb, rng, x0, y0, 5, "pit"); scatter(zb, rng, x0, y0, 6, "deadtree"); packs(2); break;
    case "shrine_ruin": for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.4; const px = cx + Math.cos(a) * 4, py = cy + Math.sin(a) * 4; zb.prop("pillar", px, py, 0, 1, !zb.isReserved(Math.floor(px), Math.floor(py))); } zb.interact("shrine", cx + 0.5, cy + 0.5, "Ember Shrine", { buff: "shrine" }); packs(1); break;
    case "charred_farm": zb.prop("well", cx + 4, cy - 4, 0, 1, true); scatter(zb, rng, x0, y0, 8, "rock"); for (let x = x0 + 4; x < x0 + 12; x += 2) if (!zb.isReserved(x, y0 + 5)) zb.prop("palisade", x + 0.5, y0 + 5.5, 0, 0.5, true); packs(2); break;
    case "crossroads": scatter(zb, rng, x0, y0, 8, "rock"); zb.prop("banner", cx + 2, cy + 2, 0, 1, true); packs(2); break;
  }
  if (t.reward && !["hunter_camp", "elite_ring"].includes(t.template)) {
    const p = zb.findSpot(rng, x0 + 4, y0 + 4, TILE - 8, TILE - 8, 1);
    if (p) zb.interact("chest", p.x, p.y, "Forgotten Cache", { tier: 1 });
  }
  // urns for small rewards
  for (let i = 0; i < 2; i++) { const p = zb.findSpot(rng, x0 + 3, y0 + 3, TILE - 6, TILE - 6, 0); if (p && t.template !== "boss_gate") zb.interact("urn", p.x, p.y, "Ash Urn"); }
}
