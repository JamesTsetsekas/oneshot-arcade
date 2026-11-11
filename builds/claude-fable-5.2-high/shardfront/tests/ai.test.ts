import { describe, expect, it } from 'vitest';
import { FACTIONS } from '../src/data/defs';
import { createSim, skirmishConfig } from '../src/sim/create';
import { FL_CONSTRUCTING } from '../src/sim/sim';

describe('skirmish AI', () => {
  it('normal AI builds workers, supply, production, expands, techs and attacks without cheating', () => {
    const s = createSim(skirmishConfig(21, 'chorus', 'helix', 'ai', 'normal', 'normal'));
    const seen = [new Set<string>(), new Set<string>()];
    const maxWorkers = [0, 0];
    const states = [new Set<string>(), new Set<string>()];
    for (let i = 0; i < 20 * 60 * 9 && s.winner < 0; i++) {
      s.step();
      if (i % 40 !== 0) continue;
      for (let p = 0; p < 2; p++) {
        maxWorkers[p] = Math.max(maxWorkers[p], s.players[p].workers);
        states[p].add(s.thinkers[p]!.label());
        // no resource cheats: the AI can never be in debt
        expect(s.players[p].ore).toBeGreaterThanOrEqual(0);
        expect(s.players[p].flux).toBeGreaterThanOrEqual(0);
        expect(s.players[p].supplyUsed).toBeLessThanOrEqual(Math.max(12, s.players[p].supplyCap));
      }
      for (const e of s.ids) if (s.alive[e] && s.owner[e] < 2 && s.d(e).cls === 'structure' && !(s.flags[e] & FL_CONSTRUCTING)) seen[s.owner[e]].add(s.d(e).id);
    }
    for (let p = 0; p < 2; p++) {
      const f = FACTIONS[s.cfg.players[p].faction];
      expect(maxWorkers[p], `P${p} workers`).toBeGreaterThanOrEqual(14);
      expect(seen[p].has(f.supply), `P${p} supply`).toBe(true);
      expect(seen[p].has(f.production), `P${p} production`).toBe(true);
      expect(seen[p].has(f.tap), `P${p} tap`).toBe(true);
      expect(s.players[p].stats.unitsCreated, `P${p} units`).toBeGreaterThan(20);
      expect(s.players[p].stats.fluxCollected).toBeGreaterThan(0);
    }
    // at least one side expanded, teched and attacked within nine minutes
    expect(s.players.some((p) => p.stats.firstExpansionTick >= 0)).toBe(true);
    expect([...seen[0], ...seen[1]].some((id) => id === 'signal_foundry' || id === 'memory_bloom')).toBe(true);
    expect(s.players[0].stats.unitsLost + s.players[1].stats.unitsLost).toBeGreaterThan(5);
    expect(states[0].has('Attack') || states[1].has('Attack')).toBe(true);
  });

  it('matches between AIs always resolve (no permanent stalemate)', () => {
    for (const [seed, a, b] of [[5, 'helix', 'chorus'], [6, 'chorus', 'chorus']] as const) {
      const s = createSim(skirmishConfig(seed, a, b, 'ai', 'normal', 'normal'));
      for (let i = 0; i < 20 * 60 * 36 && s.winner < 0; i++) s.step();
      expect(s.winner, `seed ${seed} ${a} vs ${b} ended by ${Math.round(s.tick / 1200)} min`).toBeGreaterThanOrEqual(0);
    }
  });

  it('hard AI out-produces easy AI', () => {
    const s = createSim(skirmishConfig(8, 'helix', 'helix', 'ai', 'easy', 'hard'));
    for (let i = 0; i < 20 * 60 * 6 && s.winner < 0; i++) s.step();
    expect(s.players[1].stats.unitsCreated).toBeGreaterThan(s.players[0].stats.unitsCreated);
    expect(s.players[1].stats.oreCollected).toBeGreaterThan(s.players[0].stats.oreCollected);
  });
});
