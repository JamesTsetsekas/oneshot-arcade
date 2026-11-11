// game-server: spawn director. Scores every candidate and returns a deterministic audit reason.
import type { SpawnPoint } from '../content/mapTypes';

export const SPAWN_TUNING = {
  /** an enemy with direct sight closer than this makes a candidate unsafe */
  unsafeSightDist: 42,
  /** any enemy closer than this makes a candidate unsafe regardless of sight */
  unsafeNearDist: 9,
  enemyDistCap: 46,
  deathRadius: 13,
  deathMemory: 10,
  dangerPenalty: 400,
};

export interface SpawnContext {
  team: 0 | 1;
  enemies: { x: number; y: number; z: number }[];
  mates: { x: number; y: number; z: number }[];
  /** recent deaths of this team: age in seconds */
  deaths: { x: number; z: number; age: number }[];
  /** active explosive / support danger circles */
  dangers: { x: number; z: number; r: number }[];
  /** opaque-geometry line of sight test */
  visible: (ax: number, ay: number, az: number, bx: number, by: number, bz: number) => boolean;
  /** uniform random in [0,1) from the room's seeded generator */
  jitter: () => number;
}

export interface SpawnChoice {
  index: number;
  score: number;
  unsafe: boolean;
  anySafe: boolean;
  reason: string;
}

export interface CandidateEval { score: number; unsafe: boolean; enemyDist: number; sight: boolean; deaths: number; mates: number; danger: boolean }

export function evalCandidate(p: SpawnPoint, ctx: SpawnContext): CandidateEval {
  let enemyDist = Infinity;
  let sight = false;
  let sightDist = Infinity;
  for (const e of ctx.enemies) {
    const d = Math.hypot(e.x - p.x, e.z - p.z, e.y - p.y);
    if (d < enemyDist) enemyDist = d;
    if (d < 70 && d < sightDist && (ctx.visible(p.x, p.y + 1.6, p.z, e.x, e.y + 1.25, e.z) || ctx.visible(p.x, p.y + 1.0, p.z, e.x, e.y + 1.6, e.z))) {
      sight = true;
      sightDist = d;
    }
  }
  let deaths = 0, deathPenalty = 0;
  for (const d of ctx.deaths) {
    if (d.age < SPAWN_TUNING.deathMemory && Math.hypot(d.x - p.x, d.z - p.z) < SPAWN_TUNING.deathRadius) {
      deaths++;
      deathPenalty += 14 * (1 - d.age / SPAWN_TUNING.deathMemory);
    }
  }
  let mates = 0, mateBonus = 0, occupied = false;
  for (const m of ctx.mates) {
    const d = Math.hypot(m.x - p.x, m.z - p.z);
    if (d < 1.3) occupied = true;
    else if (d < 28) { mates++; mateBonus = Math.max(mateBonus, d > 4 ? 12 : 6); }
  }
  let danger = false;
  for (const g of ctx.dangers) if (Math.hypot(g.x - p.x, g.z - p.z) < g.r + 2) danger = true;
  const unsafe = (sight && sightDist < SPAWN_TUNING.unsafeSightDist) || enemyDist < SPAWN_TUNING.unsafeNearDist;
  let score = Math.min(enemyDist, SPAWN_TUNING.enemyDistCap);
  if (sight) score -= 60;
  if (unsafe) score -= 1000;
  score -= deathPenalty;
  score += mateBonus;
  if (occupied) score -= 200;
  if (danger) score -= SPAWN_TUNING.dangerPenalty;
  if (p.home === ctx.team) score += 10;
  return { score, unsafe, enemyDist, sight, deaths, mates, danger };
}

export function chooseSpawn(points: SpawnPoint[], ctx: SpawnContext): SpawnChoice {
  let best = -1, bestScore = -Infinity, bestEval: CandidateEval | null = null;
  let anySafe = false;
  for (let i = 0; i < points.length; i++) {
    const ev = evalCandidate(points[i], ctx);
    if (!ev.unsafe && !ev.danger) anySafe = true;
    const s = ev.score + ctx.jitter() * 4;
    if (s > bestScore) { bestScore = s; best = i; bestEval = ev; }
  }
  const ev = bestEval!;
  const p = points[best];
  const reason = `g${p.group}#${best} score=${bestScore.toFixed(1)} enemyDist=${Number.isFinite(ev.enemyDist) ? ev.enemyDist.toFixed(1) : 'inf'} sight=${ev.sight ? 1 : 0} deaths=${ev.deaths} mates=${ev.mates} danger=${ev.danger ? 1 : 0} home=${p.home === ctx.team ? 1 : 0}`;
  return { index: best, score: bestScore, unsafe: ev.unsafe, anySafe, reason };
}
