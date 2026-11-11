// Spawn director: scores candidates by enemy distance, line of sight, recent deaths,
// teammate presence and active danger; always prefers a safe candidate when one exists.
import { CollisionWorld } from "../shared/collision";
import { Vec3, Rng, vdist } from "../shared/math";

export interface SpawnCandidate { pos: Vec3; yaw: number; side: 0 | 1 | -1 }
export interface SpawnContext {
  world: CollisionWorld;
  candidates: SpawnCandidate[];
  team: 0 | 1;
  enemies: Vec3[]; // feet positions of living enemies
  teammates: Vec3[];
  occupied: Vec3[];
  recentDeaths: { pos: Vec3; age: number }[];
  dangers: { pos: Vec3; r: number }[];
}
export interface SpawnChoice { index: number; pos: Vec3; yaw: number; safe: boolean; score: number; reason: string }

export const SPAWN_RULES = { unsafeRadius: 10, sightUnsafeDist: 40 };

export function isCandidateSafe(world: CollisionWorld, p: Vec3, enemies: Vec3[]): { safe: boolean; minDist: number; seen: boolean } {
  let minDist = Infinity, seen = false;
  const head = { x: p.x, y: p.y + 1.5, z: p.z };
  for (const e of enemies) {
    const d = vdist(e, p);
    if (d < minDist) minDist = d;
    if (d < SPAWN_RULES.sightUnsafeDist && !seen) {
      const eye = { x: e.x, y: e.y + 1.6, z: e.z };
      if (world.lineOfSight(eye, head)) seen = true;
    }
  }
  return { safe: minDist >= SPAWN_RULES.unsafeRadius && !seen, minDist, seen };
}

export function chooseSpawn(ctx: SpawnContext, rng: Rng): SpawnChoice {
  let best: SpawnChoice | null = null;
  let bestSafe: SpawnChoice | null = null;
  ctx.candidates.forEach((c, index) => {
    if (ctx.occupied.some((o) => vdist(o, c.pos) < 1.4)) return;
    const s = isCandidateSafe(ctx.world, c.pos, ctx.enemies);
    const reasons: string[] = [];
    let score = Math.min(s.minDist, 60);
    reasons.push(`enemy ${isFinite(s.minDist) ? s.minDist.toFixed(0) : "none"}m`);
    if (s.seen) { score -= 100; reasons.push("enemy LOS"); }
    if (c.side === ctx.team) { score += 22; reasons.push("home"); }
    else if (c.side !== -1) { score -= 45; reasons.push("enemy side"); }
    const mates = ctx.teammates.filter((t) => vdist(t, c.pos) < 22).length;
    if (mates) { score += Math.min(mates, 3) * 4; reasons.push(`${mates} allies`); }
    const deaths = ctx.recentDeaths.filter((d) => d.age < 12 && vdist(d.pos, c.pos) < 10).length;
    if (deaths) { score -= deaths * 9; reasons.push(`${deaths} recent deaths`); }
    const danger = ctx.dangers.filter((d) => vdist(d.pos, c.pos) < d.r + 3).length;
    if (danger) { score -= danger * 35; reasons.push("danger"); }
    score += rng.range(0, 4);
    const choice: SpawnChoice = { index, pos: { ...c.pos }, yaw: c.yaw, safe: s.safe && !danger, score, reason: "" };
    choice.reason = `${choice.safe ? "safe" : "least-bad"}; ${reasons.join(", ")}`;
    if (!best || score > best.score) best = choice;
    if (choice.safe && (!bestSafe || score > bestSafe.score)) bestSafe = choice;
  });
  const pick = bestSafe ?? best;
  if (!pick) return { index: 0, pos: { ...ctx.candidates[0].pos }, yaw: ctx.candidates[0].yaw, safe: false, score: -999, reason: "fallback" };
  return pick;
}
