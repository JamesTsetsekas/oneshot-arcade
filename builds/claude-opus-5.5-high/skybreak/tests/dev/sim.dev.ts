import { test } from 'vitest';
import { Match } from '../../src/server/match';
test('sim', () => {
  let t0 = performance.now();
  const m = new Match({ seed: Number(process.env.SEED ?? 42), mode: 'solo', pace: (process.env.PACE as any) ?? 'standard', stagingSeconds: 2 });
  console.log('init ms', performance.now() - t0, 'centers', m.island.stormCenters.length, 'boxes', m.island.boxes.length, 'loot', m.loot.size);
  t0 = performance.now();
  const empty = new Map();
  let lastAlive = 99, lastLog = 0;
  while (m.phase !== 'ended' && m.tick < 30 * 1300) {
    m.step(empty);
    if (m.tick % (30 * 30) === 0) {
      const alive = m.aliveCount();
      const states: Record<string, number> = {};
      for (const p of m.players) if (p.alive && p.bot) states[p.bot.state] = (states[p.bot.state] ?? 0) + 1;
      const modes: Record<string, number> = {};
      for (const p of m.players) if (p.alive) modes[p.ms.mode] = (modes[p.ms.mode] ?? 0) + 1;
      const weap = m.players.filter(p => p.alive && p.slots.some(s => s?.kind === 'weapon')).length;
      console.log(`t=${m.matchClock().toFixed(0)} phase=${m.phase} alive=${alive} armed=${weap} storm=${m.stormNow.phase}/${m.stormNow.stage} r=${m.stormNow.cur.r.toFixed(0)}`, JSON.stringify(states), JSON.stringify(modes));
    }
  }
  const dt = performance.now() - t0;
  console.log('ticks', m.tick, 'ms', dt.toFixed(0), 'per tick', (dt / m.tick).toFixed(3), 'winner', m.winner?.name, 'clock', m.matchClock().toFixed(0));
  const kills = m.players.map(p => `${p.name}:${p.stats.kills}k/${Math.round(p.stats.damage)}d/${p.stats.placement}/${p.stats.deathCause} loot=${p.stats.loot.length} ${p.bot?.dropLoc}`);
  console.log(kills.join('\n'));
});
