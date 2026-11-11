import { Rng } from "../core/rng";
import type { Difficulty } from "../data/types";
import { floodReach } from "../sim/nav";
import { ZoneBuilder, composePack } from "./builder";
import { nearReach } from "./march";
import { BLOCK, FLOOR, ROAD, type ZoneData, type ZoneId } from "./types";

export const SLOT = 18;
export const ROOM_TEMPLATES = [
  "entry_stair", "exit_stair", "cage_chamber", "orrery_hall", "spike_gallery", "vent_corridor", "brazier_hall",
  "pillar_crypt", "ossuary", "collapsed_stacks", "reading_hall", "scriptorium", "lever_vault", "guardian_hall", "machine_shop",
] as const;
export type RoomTemplate = (typeof ROOM_TEMPLATES)[number];
export const ROOM_REPEAT_CAP = 2;

export interface Room { gx: number; gy: number; x: number; y: number; w: number; h: number; template: RoomTemplate; depth: number; onPath: boolean }

const F1_POOL: [string, number][] = [["ash_crawler", 2.5], ["bell_husk", 1.2], ["lantern_mite", 1.6], ["archive_warden", 1.2], ["soot_archer", 1]];
const F2_POOL: [string, number][] = [["grave_scribe", 1.4], ["censer_adept", 1.4], ["quill_swarm", 1.8], ["chain_pilgrim", 1.3], ["archive_warden", 0.8], ["ash_crawler", 1.5]];
const F3_POOL: [string, number][] = [["grave_scribe", 1], ["archive_warden", 1.2], ["quill_swarm", 1], ["bell_husk", 1], ["censer_adept", 1], ["mire_hound", 1]];

const key = (x: number, y: number) => `${x},${y}`;
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];

export function generateArchiveFloor(seed: number, difficulty: Difficulty, floor: 1 | 2): ZoneData {
  for (let attempt = 0; attempt < 40; attempt++) {
    const z = tryFloor(seed, difficulty, floor, attempt);
    if (z) return z;
  }
  throw new Error("archive generation failed");
}

function tryFloor(seed: number, difficulty: Difficulty, floor: 1 | 2, attempt: number): ZoneData | null {
  const rng = Rng.from(seed, "archive", floor, difficulty, attempt);
  const GW = 4, GH = 3;
  const vet = difficulty === "veteran";
  const level = (vet ? 17 : 6) + (floor - 1) * 3;
  const id: ZoneId = floor === 1 ? "archive1" : "archive2";
  const zb = new ZoneBuilder(id, floor === 1 ? "Hollow Archive — Lower Stacks" : "Hollow Archive — Scriptorium Deep", "archive", GW * SLOT, GH * SLOT, seed, difficulty, level);

  // random walk main path of length 6-7 from left column to right column
  const start = { x: 0, y: rng.int(0, GH - 1) };
  const path: string[] = [key(start.x, start.y)];
  const used = new Set(path);
  let cur = start;
  const want = rng.int(6, 7);
  let guard = 0;
  while (path.length < want && guard++ < 100) {
    const opts = DIRS.map(([dx, dy]) => ({ x: cur.x + dx, y: cur.y + dy })).filter((p) => p.x >= 0 && p.y >= 0 && p.x < GW && p.y < GH && !used.has(key(p.x, p.y)));
    if (!opts.length) return null;
    // bias eastward
    const nxt = rng.weighted(opts, (p) => (p.x > cur.x ? 3 : p.x === cur.x ? 1.5 : 0.4))!;
    path.push(key(nxt.x, nxt.y)); used.add(key(nxt.x, nxt.y)); cur = nxt;
  }
  if (path.length < 6) return null;
  const edges = new Set<string>();
  const ek = (a: string, b: string) => (a < b ? a + "|" + b : b + "|" + a);
  for (let i = 0; i + 1 < path.length; i++) edges.add(ek(path[i], path[i + 1]));
  // branches: 2
  const branches: string[] = [];
  for (let b = 0; b < 2; b++) {
    for (let t = 0; t < 30; t++) {
      const from = rng.pick(path.slice(1, -1));
      const [fx, fy] = from.split(",").map(Number);
      const [dx, dy] = rng.pick(DIRS);
      const nx = fx + dx, ny = fy + dy;
      if (nx < 0 || ny < 0 || nx >= GW || ny >= GH || used.has(key(nx, ny))) continue;
      used.add(key(nx, ny)); branches.push(key(nx, ny)); edges.add(ek(from, key(nx, ny)));
      break;
    }
  }
  if (branches.length < 1) return null;

  // shortcut edge (floor 2): connect entry-adjacent room with a later path room via a lever gate
  let shortcutEdge: string | null = null;
  if (floor === 2) {
    const cands: string[] = [];
    for (const k of used) {
      const [x, y] = k.split(",").map(Number);
      for (const [dx, dy] of DIRS) {
        const nk = key(x + dx, y + dy);
        if (!used.has(nk)) continue;
        const e = ek(k, nk);
        if (edges.has(e) || cands.includes(e)) continue;
        const ia = path.indexOf(k), ib = path.indexOf(nk);
        if (ia >= 0 && ib >= 0 && Math.abs(ia - ib) >= 3 && Math.min(ia, ib) <= 1) cands.push(e);
      }
    }
    if (!cands.length) return null;
    shortcutEdge = rng.pick(cands);
    edges.add(shortcutEdge);
  }

  // depth
  const adj: Record<string, string[]> = {};
  for (const e of edges) { if (e === shortcutEdge) continue; const [a, b] = e.split("|"); (adj[a] ??= []).push(b); (adj[b] ??= []).push(a); }
  const depth: Record<string, number> = { [path[0]]: 0 };
  const q = [path[0]];
  while (q.length) { const c = q.shift()!; for (const n of adj[c] ?? []) if (depth[n] === undefined) { depth[n] = depth[c] + 1; q.push(n); } }

  // assign templates
  const rooms: Record<string, Room> = {};
  const counts: Record<string, number> = {};
  const fixedKeys = new Set<string>();
  const assign = (k: string, t: RoomTemplate, fixed = false) => {
    if (rooms[k].template && counts[rooms[k].template] && fixedKeys.has(k)) counts[rooms[k].template]--;
    rooms[k].template = t; counts[t] = (counts[t] ?? 0) + 1;
    if (fixed) fixedKeys.add(k);
  };
  for (const k of used) {
    const [gx, gy] = k.split(",").map(Number);
    const big = k === path[path.length - 2];
    const w = big ? rng.int(13, 15) : rng.int(9, 14), h = big ? rng.int(12, 14) : rng.int(9, 13);
    const x = gx * SLOT + Math.floor((SLOT - w) / 2) + rng.int(-1, 1), y = gy * SLOT + Math.floor((SLOT - h) / 2) + rng.int(-1, 1);
    rooms[k] = { gx, gy, x, y, w, h, template: "pillar_crypt", depth: depth[k] ?? 0, onPath: path.includes(k) };
  }
  assign(path[0], "entry_stair", true);
  assign(path[path.length - 1], "exit_stair", true);
  if (floor === 1) {
    assign(branches[branches.length - 1], "cage_chamber", true);
    assign(path[Math.floor(path.length / 2)], "orrery_hall", true);
  } else {
    assign(path[path.length - 2], "guardian_hall", true);
    const mid = path[Math.floor(path.length / 2)];
    if (!fixedKeys.has(mid)) assign(mid, "scriptorium", true);
    const [a, b] = shortcutEdge!.split("|");
    const far = path.indexOf(a) > path.indexOf(b) ? a : b;
    if (!fixedKeys.has(far)) assign(far, "lever_vault", true);
    zb.meta.leverRoom = far;
  }
  const fillerPool: RoomTemplate[] = floor === 1
    ? ["spike_gallery", "vent_corridor", "brazier_hall", "pillar_crypt", "ossuary", "collapsed_stacks", "machine_shop"]
    : ["reading_hall", "collapsed_stacks", "brazier_hall", "pillar_crypt", "ossuary", "vent_corridor"];
  // floor 1 must teach traps: the first free rooms along the path become spike + vent rooms
  const order = [...path, ...branches];
  const required: RoomTemplate[] = floor === 1 ? ["spike_gallery", "vent_corridor"] : [];
  let prevT: RoomTemplate | null = null;
  for (const k of order) {
    if (fixedKeys.has(k)) { prevT = rooms[k].template; continue; }
    let t: RoomTemplate | undefined = required.shift();
    if (!t) {
      const opts = fillerPool.filter((f) => (counts[f] ?? 0) < ROOM_REPEAT_CAP && f !== prevT);
      t = rng.pick(opts.length ? opts : fillerPool);
    }
    counts["pillar_crypt"] = counts["pillar_crypt"] ?? 0;
    rooms[k].template = t; counts[t] = (counts[t] ?? 0) + 1;
    prevT = t;
  }
  // validate repeat cap and no identical adjacent along path
  for (const [t, c] of Object.entries(counts)) if (c > ROOM_REPEAT_CAP) return null;
  for (let i = 0; i + 1 < path.length; i++) if (rooms[path[i]].template === rooms[path[i + 1]].template) return null;

  // carve rooms & corridors
  for (const r of Object.values(rooms)) zb.rect(r.x, r.y, r.w, r.h, FLOOR);
  const center = (k: string) => { const r = rooms[k]; return { x: Math.floor(r.x + r.w / 2), y: Math.floor(r.y + r.h / 2) }; };
  let shortcutCells: [number, number][] = [];
  for (const e of edges) {
    const [a, b] = e.split("|");
    const ca = center(a), cb = center(b);
    const before = zb.cells.slice();
    zb.corridor(ca.x, ca.y, cb.x, cb.y, 3, ROAD, rooms[a].gy === rooms[b].gy);
    if (e === shortcutEdge) {
      // gate cells: corridor cells between the two rooms (outside both rooms)
      const ra = rooms[a], rb = rooms[b];
      const inRoom = (x: number, y: number, r: Room) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
      const changed: [number, number][] = [];
      for (let y = 0; y < zb.h; y++) for (let x = 0; x < zb.w; x++) if (before[y * zb.w + x] === BLOCK && zb.cells[y * zb.w + x] === ROAD && !inRoom(x, y, ra) && !inRoom(x, y, rb)) changed.push([x, y]);
      // choose the band of corridor cells nearest to the midpoint as the gate
      const mx = (ca.x + cb.x) / 2, my = (ca.y + cb.y) / 2;
      shortcutCells = changed.filter(([x, y]) => Math.abs(x + 0.5 - mx) + Math.abs(y + 0.5 - my) < 2.6);
      if (!shortcutCells.length) shortcutCells = changed.slice(0, 6);
    }
  }
  for (const r of Object.values(rooms)) zb.reserveCircle(r.x + r.w / 2, r.y + r.h / 2, 2);
  // reserve door bands
  for (let y = 0; y < zb.h; y++) for (let x = 0; x < zb.w; x++) if (zb.get(x, y) === ROAD) zb.reserve(x - 1, y - 1, 3, 3);

  for (const k of order) decorateRoom(zb, rng, rooms[k], floor, level, difficulty);

  if (shortcutEdge) {
    for (const [x, y] of shortcutCells) zb.set(x, y, BLOCK);
    const sx = shortcutCells.reduce((s, c) => s + c[0] + 0.5, 0) / shortcutCells.length;
    const sy = shortcutCells.reduce((s, c) => s + c[1] + 0.5, 0) / shortcutCells.length;
    const gate = zb.interact("gate", sx, sy, "Archive Portcullis", { cells: shortcutCells, lever: true, prompt: "The portcullis is chained from the other side." });
    const lr = rooms[zb.meta.leverRoom as string];
    const lp = zb.findSpot(rng, lr.x + 1, lr.y + 1, lr.w - 2, lr.h - 2, 0) ?? { x: lr.x + 2.5, y: lr.y + 2.5 };
    zb.interact("lever", lp.x, lp.y, "Portcullis Lever", { gate: gate.id });
    zb.meta.shortcutGate = gate.id;
  }

  const reach = floodReach(zb, zb.entries.start.x, zb.entries.start.y);
  for (const it of zb.interactables) {
    if (it.kind === "gate") continue;
    if (!nearReach(reach, zb.w, it.x, it.y)) return null;
  }
  for (const p of zb.packs) if (!nearReach(reach, zb.w, p.x, p.y)) return null;
  zb.meta = { ...zb.meta, rooms: Object.values(rooms), path, branches, edges: [...edges], shortcutEdge, counts, attempt, slot: SLOT };
  return zb.build();
}

function roomPacks(zb: ZoneBuilder, rng: Rng, r: Room, n: number, pool: [string, number][], level: number, difficulty: Difficulty, elite = false) {
  for (let i = 0; i < n; i++) {
    for (let t = 0; t < 30; t++) {
      const x = rng.int(r.x + 2, r.x + r.w - 3), y = rng.int(r.y + 2, r.y + r.h - 3);
      if (!zb.open(x, y) || !zb.open(x + 1, y) || !zb.open(x, y + 1)) continue;
      if (zb.packs.some((p) => Math.hypot(p.x - x, p.y - y) < 5)) continue;
      const vetElite = difficulty === "veteran" && !elite && rng.chance(0.3);
      const comp = composePack(rng, pool, elite || vetElite ? 4 : 5, elite || vetElite ? 7 : 10, elite || vetElite, difficulty);
      zb.pack({ x: x + 0.5, y: y + 0.5, members: comp.members, kind: elite || vetElite ? "elite" : "normal", level: level + (r.depth > 3 ? 1 : 0), points: comp.points });
      break;
    }
  }
}

function decorateRoom(zb: ZoneBuilder, rng: Rng, r: Room, floor: number, level: number, difficulty: Difficulty) {
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  const pool = floor === 1 ? F1_POOL : F2_POOL;
  const corners = [[r.x + 1.5, r.y + 1.5], [r.x + r.w - 1.5, r.y + 1.5], [r.x + 1.5, r.y + r.h - 1.5], [r.x + r.w - 1.5, r.y + r.h - 1.5]];
  const candlesAndLight = (color = "#ffb060") => { for (const [x, y] of corners) if (!zb.isReserved(Math.floor(x), Math.floor(y))) zb.prop("candles", x, y); zb.light(cx, cy, color, 0.9, Math.max(r.w, r.h) * 0.8); };
  switch (r.template) {
    case "entry_stair": {
      zb.entries.start = { x: cx + 0.5, y: cy + 1.5 };
      zb.prop("stairs", cx + 0.5, r.y + 1.5, 0, 1);
      if (floor === 1) zb.interact("exit", cx + 0.5, r.y + 1.2, "Stairs to the Soot March", { to: "march", entry: "crypt" });
      else {
        zb.interact("exit", cx + 0.5, r.y + 1.2, "Stairs to the Lower Stacks", { to: "archive1", entry: "down" });
        zb.interact("waypoint", cx - 3.5, cy + 0.5, "Archive Depths Waypoint", { wp: "depths" });
        zb.landmark("waypoint", "Depths Waypoint", cx - 3.5, cy);
      }
      zb.light(cx, cy, "#7ad8ff", 1.0, 10);
      break;
    }
    case "exit_stair": {
      zb.prop("stairs", cx + 0.5, cy + 0.5, 0, 1);
      if (floor === 1) { zb.interact("exit", cx + 0.5, cy + 0.5, "Stairs Down", { to: "archive2", entry: "start" }); zb.entries.down = { x: cx + 0.5, y: cy + 2.5 }; }
      else { zb.interact("exit", cx + 0.5, cy + 0.5, "Descent to the Engine", { to: "archive3", entry: "start", requires: "guardian", sealedText: "A guardian's ward seals the descent." }); zb.entries.up = { x: cx + 0.5, y: cy + 2.5 }; }
      zb.landmark("exit", "Stairs Down", cx, cy);
      roomPacks(zb, rng, r, 1, pool, level, difficulty);
      candlesAndLight("#8ad8ff");
      break;
    }
    case "cage_chamber": {
      zb.interact("cage", cx + 0.5, cy + 0.5, "Calder's Cage", { npc: "calder" });
      zb.landmark("cage", "Artificer's Cage", cx, cy);
      for (let i = 0; i < 4; i++) zb.prop("gear", r.x + 2 + i * 2.5, r.y + r.h - 2, 0, 0.8);
      const comp = composePack(rng, pool, 4, 7, true, difficulty);
      zb.pack({ x: cx + 3.5, y: cy + 0.5, members: comp.members, kind: "elite", level: level + 1, points: comp.points });
      candlesAndLight("#ffd080");
      break;
    }
    case "orrery_hall": {
      zb.prop("orrery", cx + 0.5, cy + 0.5, 0, 1.4, true);
      zb.set(Math.floor(cx) + 1, Math.floor(cy), BLOCK); zb.set(Math.floor(cx), Math.floor(cy) + 1, BLOCK); zb.set(Math.floor(cx) + 1, Math.floor(cy) + 1, BLOCK);
      zb.landmark("orrery", "Brass Orrery", cx, cy);
      zb.light(cx, cy, "#50e8ff", 1.5, 12);
      roomPacks(zb, rng, r, 2, pool, level, difficulty);
      break;
    }
    case "spike_gallery": {
      for (let y = r.y + 2; y < r.y + r.h - 2; y += 3) for (let x = r.x + 2; x < r.x + r.w - 2; x += 3) if (rng.chance(0.55)) zb.hazard({ kind: "spikes", x: x + 1, y: y + 1, rot: 0, period: 3.2, offset: rng.range(0, 3.2) });
      zb.landmark("traps", "Spike Gallery", cx, cy);
      roomPacks(zb, rng, r, 1, pool, level, difficulty);
      candlesAndLight();
      break;
    }
    case "vent_corridor": {
      for (let i = 0; i < 3; i++) {
        const y = r.y + 2 + Math.floor(((i + 0.5) / 3) * (r.h - 4));
        zb.hazard({ kind: "vent", x: r.x + 0.8, y: y + 0.5, rot: 0, period: 4, offset: i * 1.3 });
        zb.prop("gear", r.x + 0.6, y + 0.5, 0, 0.6);
      }
      roomPacks(zb, rng, r, 1, pool, level, difficulty);
      candlesAndLight("#ff9050");
      break;
    }
    case "brazier_hall": {
      for (let i = 0; i < 3; i++) { const p = zb.findSpot(rng, r.x + 2, r.y + 2, r.w - 4, r.h - 4, 1); if (p) zb.interact("explosive", p.x, p.y, "Volatile Brazier"); }
      roomPacks(zb, rng, r, 2, pool, level, difficulty);
      zb.light(cx, cy, "#ff7030", 1.1, 10);
      break;
    }
    case "pillar_crypt": {
      for (let y = r.y + 2; y < r.y + r.h - 2; y += 3) for (let x = r.x + 2; x < r.x + r.w - 2; x += 4) if (!zb.isReserved(x, y)) zb.prop("pillar", x + 0.5, y + 0.5, 0, 1, true);
      roomPacks(zb, rng, r, 1, pool, level, difficulty);
      candlesAndLight();
      break;
    }
    case "ossuary": {
      for (let i = 0; i < 4; i++) { const p = zb.findSpot(rng, r.x + 2, r.y + 2, r.w - 4, r.h - 4, 1); if (p) zb.prop("sarcophagus", p.x, p.y, rng.chance(0.5) ? 0 : Math.PI / 2, 1, true); }
      for (let i = 0; i < 3; i++) { const p = zb.findSpot(rng, r.x + 1, r.y + 1, r.w - 2, r.h - 2, 0); if (p) zb.interact("urn", p.x, p.y, "Bone Urn"); }
      roomPacks(zb, rng, r, 1, pool, level, difficulty);
      candlesAndLight();
      break;
    }
    case "collapsed_stacks": {
      for (let i = 0; i < 6; i++) { const p = zb.findSpot(rng, r.x + 1, r.y + 1, r.w - 2, r.h - 2, 0); if (p) zb.prop("bookcase", p.x, p.y, rng.range(-0.5, 0.5), 1, true); }
      roomPacks(zb, rng, r, 1, pool, level, difficulty);
      if (rng.chance(0.5)) { const p = zb.findSpot(rng, r.x + 2, r.y + 2, r.w - 4, r.h - 4, 0); if (p) zb.interact("chest", p.x, p.y, "Archive Strongbox", { tier: 1 }); }
      candlesAndLight();
      break;
    }
    case "reading_hall": {
      for (let x = r.x + 2; x < r.x + r.w - 2; x += 3) for (const y of [r.y + 2, r.y + r.h - 3]) if (!zb.isReserved(x, y)) zb.prop("bookcase", x + 0.5, y + 0.5, 0, 1, true);
      roomPacks(zb, rng, r, 2, pool, level, difficulty);
      candlesAndLight("#c0f0ff");
      break;
    }
    case "scriptorium": {
      zb.prop("giantbook", cx + 0.5, cy + 0.5, 0, 1.3, true);
      zb.landmark("scriptorium", "Floating Codex", cx, cy);
      zb.light(cx, cy, "#a080ff", 1.4, 12);
      roomPacks(zb, rng, r, 2, pool, level, difficulty);
      break;
    }
    case "lever_vault": {
      zb.landmark("lever", "Lever Vault", cx, cy);
      roomPacks(zb, rng, r, 1, pool, level, difficulty);
      zb.interact("chest", cx + 2.5, cy + 0.5, "Vault Coffer", { tier: 2 });
      candlesAndLight("#ffd070");
      break;
    }
    case "guardian_hall": {
      for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + Math.PI / 4; zb.prop("pillar", cx + Math.cos(a) * 4.5, cy + Math.sin(a) * 4.5, 0, 1.2, true); }
      const comp = composePack(rng, [["archive_warden", 2], ["grave_scribe", 1], ["chain_pilgrim", 1]], 4, 7, true, difficulty);
      // guardian leader is always an Archive Warden with an extra modifier slot
      comp.members[0].enemy = "archive_warden";
      zb.pack({ x: cx + 0.5, y: cy + 0.5, members: comp.members, kind: "guardian", level: level + 2, points: comp.points });
      zb.landmark("guardian", "Guardian's Hall", cx, cy);
      zb.light(cx, cy, "#ff5050", 1.2, 12);
      break;
    }
    case "machine_shop": {
      for (let i = 0; i < 4; i++) { const p = zb.findSpot(rng, r.x + 2, r.y + 2, r.w - 4, r.h - 4, 1); if (p) zb.prop("gear", p.x, p.y, rng.range(0, 3), 1.2, true); }
      roomPacks(zb, rng, r, 2, pool, level, difficulty);
      zb.light(cx, cy, "#ffb060", 1.0, 10);
      break;
    }
  }
}

/** Floor 3: handcrafted boss approach and arena. */
export function generateArchive3(seed: number, difficulty: Difficulty): ZoneData {
  const rng = Rng.from(seed, "archive3", difficulty);
  const vet = difficulty === "veteran";
  const level = vet ? 22 : 11;
  const W = 48, H = 78;
  const zb = new ZoneBuilder("archive3", "Hollow Archive — Engine Vault", "archive", W, H, seed, difficulty, level);
  // entry room (bottom)
  zb.rect(16, 64, 16, 11, FLOOR);
  zb.entries.start = { x: 24.5, y: 70.5 };
  zb.prop("stairs", 24.5, 73.5, 0, 1);
  zb.interact("exit", 24.5, 73.6, "Stairs to the Scriptorium", { to: "archive2", entry: "up" });
  zb.light(24, 69, "#7ad8ff", 1, 10);
  // approach hall with alcoves
  zb.rect(20, 40, 8, 24, ROAD);
  zb.rect(12, 46, 8, 8, FLOOR); zb.rect(28, 52, 8, 8, FLOOR);
  for (let y = 42; y < 62; y += 4) { zb.prop("pillar", 20.5, y + 0.5, 0, 1); zb.prop("pillar", 27.5, y + 0.5, 0, 1); }
  for (let y = 44; y < 62; y += 8) { zb.prop("candles", 21.2, y); zb.prop("candles", 26.8, y + 4); }
  zb.light(24, 55, "#ffa060", 1, 12);
  zb.light(24, 44, "#ffa060", 1, 12);
  const p1 = composePack(rng, F3_POOL, 6, 10, false, difficulty);
  zb.pack({ x: 24.5, y: 55.5, members: p1.members, kind: "normal", level, points: p1.points });
  const p2 = composePack(rng, F3_POOL, 6, 10, vet, difficulty);
  zb.pack({ x: 15.5, y: 49.5, members: p2.members, kind: vet ? "elite" : "normal", level, points: p2.points });
  zb.interact("chest", 32.5, 55.5, "Sealed Reliquary", { tier: 2 });
  // antechamber with checkpoint waypoint
  zb.rect(17, 30, 14, 10, FLOOR);
  zb.interact("waypoint", 24.5, 35.5, "Engine Threshold Waypoint", { wp: "threshold" });
  zb.landmark("waypoint", "Threshold Waypoint", 24.5, 35.5);
  zb.entries.threshold = { x: 24.5, y: 37.5 };
  zb.light(24, 35, "#5ff0ff", 1.3, 10);
  // arena
  zb.rect(22, 24, 4, 7, ROAD);
  zb.circle(24, 12, 13.5, FLOOR);
  zb.reserveCircle(24, 12, 13.5);
  zb.meta.arena = { x: 24, y: 12, r: 13 };
  zb.pack({ x: 24, y: 10, members: [{ enemy: "engine", boss: true }], kind: "boss", level: level + 2, points: 0, dormant: true });
  zb.landmark("engine", "Orison Engine", 24, 10);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; zb.prop("crystal", 24 + Math.cos(a) * 13.2, 12 + Math.sin(a) * 13.2, a, 1.2); }
  zb.light(24, 12, "#40e0ff", 1.8, 20);
  zb.meta.rooms = [];
  return zb.build();
}
