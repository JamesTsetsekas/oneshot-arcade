// Spawn director: scores candidate spawns by enemy distance/sight, recent deaths, teammates and danger. Keeps an audit reason string.
import type { World } from "./world";
import type { PlayerState } from "./types";
import type { SpawnPoint } from "../map/k17";
import { dist2D } from "../math";

export const UNSAFE_SIGHT_DIST = 45;
export const UNSAFE_NEAR_DIST = 14;

export interface SpawnChoice { spawn: SpawnPoint; score: number; reason: string; safe: boolean }

export interface SpawnEval { score: number; safe: boolean; minDist: number; los: boolean; heat: number; friends: number; danger: boolean }

export function evaluateSpawn(world: World, p: Pick<PlayerState, "team" | "id">, c: SpawnPoint): SpawnEval {
  const eye = { x: c.pos.x, y: 1.6, z: c.pos.z };
  let minDist = 999;
  let los = false;
  let friends = 0;
  for (const q of world.players) {
    if (!q.alive || q.id === p.id) continue;
    const d = dist2D(q.pos, c.pos);
    if (q.team !== p.team) {
      if (d < minDist) minDist = d;
      if (d < UNSAFE_SIGHT_DIST && !los) {
        const qe = { x: q.pos.x, y: q.pos.y + 1.5, z: q.pos.z };
        if (world.col.lineClear(eye, qe, world.time)) los = true;
      }
    } else if (d < 25) friends++;
  }
  let heat = 0;
  for (const h of world.deathHeat) {
    if (h.team !== p.team) continue;
    const d = Math.hypot(h.x - c.pos.x, h.z - c.pos.z);
    if (d < 14 && world.time - h.t < 14) heat += (14 - d) * (1 - (world.time - h.t) / 14);
  }
  let danger = false;
  for (const pr of world.projectiles) {
    if (!pr.alive || pr.team === p.team) continue;
    if (Math.hypot(pr.pos.x - c.pos.x, pr.pos.z - c.pos.z) < 8) danger = true;
  }
  for (const s of world.support.activeStrikeZones()) {
    if (s.team !== p.team && Math.hypot(s.x - c.pos.x, s.z - c.pos.z) < s.r) danger = true;
  }
  const safe = !los && minDist >= UNSAFE_NEAR_DIST && !danger;
  let score = Math.min(minDist, 70) - heat * 2 + Math.min(friends, 3) * 3;
  if (los) score -= 120;
  if (danger) score -= 80;
  score += c.group === "home" ? 12 : c.group === "hall" ? 0 : -8;
  return { score, safe, minDist, los, heat, friends, danger };
}

export function chooseSpawn(world: World, p: PlayerState | Pick<PlayerState, "team" | "id">): SpawnChoice {
  const cands = world.map.spawns.filter((s) => s.team === p.team);
  const occupied = (c: SpawnPoint) => world.players.some((q) => q.alive && q.id !== p.id && dist2D(q.pos, c.pos) < 1.4);
  const evals: Array<{ c: SpawnPoint; e: SpawnEval }> = [];
  for (const c of cands) {
    if (occupied(c)) continue;
    evals.push({ c, e: evaluateSpawn(world, p, c) });
  }
  if (!evals.length) { const c = cands[0]; return { spawn: c, score: 0, reason: "fallback: all candidates occupied", safe: false }; }
  const safe = evals.filter((x) => x.e.safe);
  const pool = safe.length ? safe : evals;
  let best = pool[0];
  let bestScore = -Infinity;
  for (const x of pool) {
    const s = x.e.score + world.rng.next() * 3;
    if (s > bestScore) { bestScore = s; best = x; }
  }
  const e = best.e;
  return {
    spawn: best.c, score: bestScore, safe: e.safe,
    reason: `${best.c.group}#${best.c.id} score=${bestScore.toFixed(1)} enemyDist=${e.minDist.toFixed(0)} los=${e.los ? 1 : 0} heat=${e.heat.toFixed(1)} friends=${e.friends} ${safe.length ? "safe" : "no-safe-candidate"}`,
  };
}
