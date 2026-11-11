import { test } from 'vitest';
import { Match } from '../../src/server/match';
test('ttfw', () => {
  for (const seed of [42, 7]) {
    const m = new Match({ seed, mode: 'solo', pace: 'standard', stagingSeconds: 2 });
    const first = new Map<number, number>();
    const landed = new Map<number, number>();
    while (m.tick < 30 * 240) {
      m.step(new Map());
      for (const p of m.players) {
        if (!landed.has(p.id) && p.ms.mode === 'ground' && m.phase !== 'staging' && m.stormStart >= 0) landed.set(p.id, m.matchClock());
        if (!first.has(p.id) && p.slots.some((s) => s?.kind === 'weapon')) first.set(p.id, m.matchClock());
      }
    }
    const rows = m.players.map((p) => `${p.name}: land ${landed.get(p.id)?.toFixed(0)} weapon ${first.get(p.id)?.toFixed(0) ?? '-'} alive=${p.alive} state=${p.bot?.state} goal=${p.bot?.goal?.kind ?? '-'} bl=${p.bot?.blacklist.size} loot=${p.stats.loot.length} drop=${p.bot?.dropLoc}`);
    console.log(rows.join('\n'));
  }
});
