import { Match } from '../src/sim/match';
import { makeBotSetup } from '../src/services/matchmaker';
const m = new Match(makeBotSetup(Number(process.argv[2] ?? 7)));
const st: Record<string, number> = {};
while (!m.over && m.time < 40*60) { m.step(); if (m.tick % 30 === 0) for (const b of m.bots) st[b.state] = (st[b.state] ?? 0) + 1; }
for (const e of m.timeline) if (!e.text.includes('defeated')) console.log((e.t/60).toFixed(1), e.text);
console.log(JSON.stringify(st));
