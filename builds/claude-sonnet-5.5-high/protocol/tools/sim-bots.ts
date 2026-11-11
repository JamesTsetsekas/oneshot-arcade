import { newMatch, TICK_RATE } from '../src/sim/match';
import { installBots } from '../src/sim/bots';
import { RULESETS } from '../src/content/economy';

const seed = Number(process.argv[2] ?? 1);
const m = newMatch({ seed, rules: RULESETS.quick, humanIds: [] });
installBots(m, 'normal');
const t0 = Date.now();
let lastRound = 0;
let maxTicks = TICK_RATE * 60 * 30;
let kills = 0, plants = 0, defuses = 0, expl = 0;
const log: string[] = [];
while (m.phase !== 'matchEnd' && m.tick < maxTicks) {
  m.step();
  for (const e of m.events) {
    if (e.t === 'kill') kills++;
    if (e.t === 'spike' && e.kind === 'planted') plants++;
    if (e.t === 'spike' && e.kind === 'defused') defuses++;
    if (e.t === 'spike' && e.kind === 'explode') expl++;
    if (e.t === 'roundEnd') log.push(`R${m.round} ${e.winnerSide} by ${e.reason} score ${e.score.join('-')} t=${(m.time - m.liveStart).toFixed(0)}s`);
  }
}
console.log(log.join('\n'));
console.log('phase', m.phase, 'sim sec', m.time.toFixed(0), 'wall ms', Date.now() - t0, 'kills', kills, 'plants', plants, 'defuses', defuses, 'explosions', expl);
console.log('score', m.score, 'winner', m.winnerSquad);
for (const p of m.players) console.log(p.id, p.name, p.side, 'K', p.stats.kills, 'D', p.stats.deaths, 'A', p.stats.assists, 'shots', p.stats.shots, 'hits', p.stats.hits, 'money', p.money);
