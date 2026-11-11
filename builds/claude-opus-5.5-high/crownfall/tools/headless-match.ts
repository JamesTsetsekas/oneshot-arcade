// Seedless/seeded headless balance match: six bots play a full match with no renderer.
// Usage: npx vite-node tools/headless-match.ts [seed] [maxMinutes]
import { Match } from '../src/sim/match';
import { makeBotSetup } from '../src/services/matchmaker';
import { getMapGrid } from '../src/shared/map';

const seed = Number(process.argv[2] ?? 7);
const maxMin = Number(process.argv[3] ?? 30);
let t0 = performance.now();
getMapGrid();
console.log(`map grid built in ${(performance.now() - t0).toFixed(0)} ms`);
const m = new Match(makeBotSetup(seed));
t0 = performance.now();
let worst = 0;
let lastMin = -1;
while (!m.over && m.time < maxMin * 60) {
  const a = performance.now();
  m.step();
  const d = performance.now() - a;
  if (d > worst) worst = d;
  const min = Math.floor(m.time / 60);
  if (min !== lastMin) {
    lastMin = min;
    const alive = (team: number) => [...m.structures.values()].filter((s) => s.team === team && s.alive && s.kind !== 'fountain').length;
    const heroes = m.heroes.map((h) => `${h.hero!.id}:L${h.hero!.level} ${h.hero!.k}/${h.hero!.d}/${h.hero!.a} cs${h.hero!.cs} g${Math.round(h.hero!.totalGold)} ${m.bots.find((b) => b.u === h)?.state}`).join(' | ');
    console.log(`${min}m units=${m.units.length} structs ${alive(0)}v${alive(1)} kills ${m.kills.join('-')} :: ${heroes}`);
  }
}
const wall = performance.now() - t0;
console.log(`over=${m.over} winner=${m.winner} time=${(m.time / 60).toFixed(1)}min ticks=${m.tick} wall=${(wall / 1000).toFixed(1)}s avgTick=${(wall / m.tick).toFixed(3)}ms worst=${worst.toFixed(1)}ms`);
for (const e of m.timeline.slice(-12)) console.log(`  ${(e.t / 60).toFixed(1)} ${e.text}`);
