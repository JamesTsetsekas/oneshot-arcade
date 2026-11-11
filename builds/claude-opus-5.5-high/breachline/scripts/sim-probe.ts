// Dev benchmark: run a headless 12-bot match and print tick timings (see README / report for the command).
import { Room } from "../src/server/room";

const t0 = performance.now();
const room = new Room({ seed: Number(process.argv[2] ?? 7), difficulty: "normal", local: null, warmup: 2 });
const tNav = performance.now();
console.log("room+nav ms", (tNav - t0).toFixed(0), "nodes", room.nav.nodes.length, "spawns", room.map.spawnCandidates.length);
let ticks = 0;
const kinds: Record<string, number> = {};
let maxTick = 0;
while (room.phase !== "ended" && ticks < 60 * 60 * 10) {
  const a = performance.now();
  room.tick();
  maxTick = Math.max(maxTick, performance.now() - a);
  ticks++;
  for (const e of room.drainEvents()) kinds[e.type] = (kinds[e.type] ?? 0) + 1;
  if (ticks % (60 * 30) === 0) {
    console.log(`t=${room.time.toFixed(0)} score ${room.scores.join("-")}`, room.players.map((p) => `${p.name[0]}${p.brain?.state[0]}`).join(" "));
  }
}
console.log("ended", room.phase, "scores", room.scores, "time", room.time.toFixed(1), "ticks", ticks, "avg ms/tick", ((performance.now() - tNav) / ticks).toFixed(3), "max", maxTick.toFixed(2));
console.log(kinds);
for (const p of room.players) console.log(p.team, p.name.padEnd(10), "K", p.stats.kills, "D", p.stats.deaths, "A", p.stats.assists, p.loadout.primary);
