// Bot soak: runs full headless matches and reports winners, phase progression and server tick cost.
import { Match } from "../src/server/match/match";
import { Mode } from "../src/shared/protocol/protocol";
import type { Pace } from "../src/shared/content/rules";

const runs = Number(process.argv[2] ?? 3);
const pace = (process.argv[3] ?? "blitz") as Pace;
const verbose = process.argv.includes("-v");
let allOk = true;
for (let r = 0; r < runs; r++) {
  const m = new Match({ seed: 1000 + r * 7919, mode: "solo", pace, seats: 24, human: null });
  const times: number[] = [];
  let maxPhase = 0;
  const t0 = performance.now();
  let landed = 0;
  let lastLog = 0;
  const causes: Record<string, number> = {};
  while (m.phase !== "ended" && m.time < 60 * 30) {
    const s = performance.now();
    m.step();
    times.push(performance.now() - s);
    if (verbose) for (const q of m.events) if (q.ev.t === "kill") {
      const v = m.actors[q.ev.victim]!;
      causes[q.ev.cause] = (causes[q.ev.cause] ?? 0) + 1;
      if (process.argv.includes("-k")) console.log(`    kill t=${m.time.toFixed(0)} ${m.actors[q.ev.killer]?.name ?? "-"} > ${v.name} by ${q.ev.cause} at (${v.x.toFixed(0)},${v.y.toFixed(0)},${v.z.toFixed(0)}) mode=${v.mode} storm=${v.stats.stormDamage.toFixed(0)}`);
    }
    m.flushEvents();
    maxPhase = Math.max(maxPhase, m.storm.phase);
    if (verbose && m.time - lastLog >= 20) {
      lastLog = m.time;
      const armed = m.actors.filter((a) => a.alive && a.slots.some((q) => q && q.kind === "weapon")).length;
      const states: Record<string, number> = {};
      m.brains.forEach((b, i) => { if (b && m.actors[i]!.alive) states[b.state] = (states[b.state] ?? 0) + 1; });
      console.log(`  t=${m.time.toFixed(0)} phase=${m.phase} storm=${m.storm.phase}/${m.storm.state} r=${m.storm.r.toFixed(0)} alive=${m.aliveCount} armed=${armed}`, JSON.stringify(states));
    }
  }
  landed = m.actors.filter((a) => a.mode !== Mode.Skiff).length;
  times.sort((a, b) => a - b);
  const p95 = times[Math.floor(times.length * 0.95)]!;
  const mean = times.reduce((a, b) => a + b, 0) / times.length;
  const winners = m.actors.filter((a) => a.placement === 1).length;
  const kills = m.actors.reduce((a, b) => a + b.stats.kills, 0);
  const storm = m.actors.filter((a) => !a.alive && a.stats.stormDamage > 20).length;
  if (verbose) console.log('  causes', JSON.stringify(causes));
  const ok = m.phase === "ended" && winners === 1 && m.winnerId >= 0;
  allOk &&= ok;
  console.log(
    `run ${r} seed ${m.cfg.seed}: ${ok ? "OK" : "FAIL"} winner=${m.actors[m.winnerId]?.name} duration=${(m.endedAt - m.activeStart).toFixed(0)}s (sim ${m.time.toFixed(0)}s) ` +
      `maxStormPhase=${maxPhase} kills=${kills} stormHeavy=${storm} left skiff=${landed}/24 tick mean=${mean.toFixed(3)}ms p95=${p95.toFixed(3)}ms max=${times[times.length - 1]!.toFixed(1)}ms wall=${((performance.now() - t0) / 1000).toFixed(1)}s`,
  );
}
process.exit(allOk ? 0 : 1);
