import { makeWorld } from "../tests/helpers";
import { defaultLoadouts } from "../src/shared/content/loadout";
import type { Difficulty } from "../src/shared/sim/types";
const diff = (process.argv[2] ?? "normal") as Difficulty;
const w = makeWorld({ warmup: 0.2, seed: Number(process.argv[3] ?? 3), difficulty: diff });
const l = defaultLoadouts();
for (let i = 0; i < 6; i++) { w.addPlayer({ name: `A${i}`, team: 0, isBot: true, loadout: l[i % 5] }); w.addPlayer({ name: `B${i}`, team: 1, isBot: true, loadout: l[(i + 1) % 5] }); }
const t0 = performance.now();
let guard = 0;
const use: Record<string, number> = {};
while (w.match.phase !== "ended" && guard++ < 60 * 700) {
  w.tick();
  for (const e of w.drainEvents()) { if (e.t === "supportUse") use[e.support] = (use[e.support] ?? 0) + 1; if (e.t === "throw") use["throw:" + e.kind] = (use["throw:" + e.kind] ?? 0) + 1; if (e.t === "kill") use["kill:" + e.weapon] = (use["kill:" + e.weapon] ?? 0) + 1; }
}
console.log("phase", w.match.phase, "score", w.match.teamScore, "clock", w.match.clock.toFixed(0), "winner", w.match.winner, w.match.endReason, "wall ms", (performance.now() - t0).toFixed(0), "avg tick ms", w.tickMs.toFixed(3));
for (const p of w.players) console.log(p.name.padEnd(4), `K${p.stats.kills} D${p.stats.deaths} A${p.stats.assists} shots ${p.stats.shots} acc ${(p.stats.hits / Math.max(1, p.stats.shots) * 100).toFixed(0)}% bestMom ${p.stats.bestMomentum}`);
console.log(use);
