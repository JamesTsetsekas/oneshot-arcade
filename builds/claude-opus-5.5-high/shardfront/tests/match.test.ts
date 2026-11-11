import { describe, expect, test } from 'vitest';
import { MatchRunner } from '../src/game/runner';
import { makeSetup } from './helpers';
import { TPS } from '../src/simulation-core/sim';

function playOut(r: MatchRunner, maxMin = 26) {
  const log: string[] = [];
  while (!r.sim.over && r.sim.tick < TPS * 60 * maxMin) {
    r.step();
    for (const ai of r.ais) if (ai.log.length && !log.includes(ai.player + ai.log[ai.log.length - 1])) log.push(ai.player + ai.log[ai.log.length - 1]);
  }
  return log;
}

describe('full matches (AI vs AI, headless deterministic runner)', () => {
  test('Normal Helix vs Normal Verdant ends with an HQ-destruction victory and exercises the whole loop', () => {
    const r = new MatchRunner(makeSetup(7, 'helix', 'verdant', ['normal', 'normal']));
    const states = playOut(r);
    const sim = r.sim;
    expect(sim.over).toBe(true);
    expect([0, 1]).toContain(sim.winner);
    const loser = 1 - sim.winner;
    expect(sim.structuresOf(loser).filter((s) => sim.sdef(s).isHQ)).toHaveLength(0);
    for (const p of sim.players) {
      expect(p.stats.oreCollected).toBeGreaterThan(3000);
      expect(p.stats.fluxCollected).toBeGreaterThan(300);
      expect(p.stats.unitsCreated).toBeGreaterThan(30);
      expect(p.stats.expansions.length).toBeGreaterThanOrEqual(1);
      expect(p.techs.size).toBeGreaterThanOrEqual(1);
    }
    const all = states.join(' ');
    expect(all).toMatch(/Attack/);
    expect(all).toMatch(/Expand/);
    expect(sim.timeline.length).toBeGreaterThan(10);
  });

  test('Hard AI beats Easy AI (same rules, no cheats)', () => {
    const r = new MatchRunner(makeSetup(8, 'verdant', 'helix', ['hard', 'easy']));
    playOut(r);
    expect(r.sim.over).toBe(true);
    expect(r.sim.winner).toBe(0);
    // no resource cheats: every ore spent was collected (start 150 + collected >= current)
    for (const p of r.sim.players) expect(p.ore).toBeLessThanOrEqual(150 + p.stats.oreCollected + 1e-6);
  });

  test('replaying a recorded match reproduces every periodic state hash and the outcome', () => {
    const r = new MatchRunner(makeSetup(9, 'helix', 'helix', ['hard', 'normal']));
    playOut(r, 30);
    const replay = r.toReplay();
    // through the storage encoding
    const stored = JSON.parse(JSON.stringify(replay));
    const p = new MatchRunner(stored.setup, stored);
    while (!p.sim.over && p.sim.tick < replay.endTick + 5) p.step();
    expect(p.hashMismatch).toBe(-1);
    expect(p.sim.hashes).toEqual(replay.hashes);
    expect(p.sim.winner).toBe(replay.winner);
    expect(p.sim.tick).toBe(replay.endTick);
  });

  test('simulation result is independent of render frame rate (fixed-step accumulator)', () => {
    const drive = (frameMs: number[]) => {
      const r = new MatchRunner(makeSetup(10, 'verdant', 'verdant', ['normal', 'normal']));
      let acc = 0, i = 0;
      while (r.sim.tick < 1200) { acc += frameMs[i++ % frameMs.length] / 1000; while (acc >= 1 / TPS && r.sim.tick < 1200) { acc -= 1 / TPS; r.step(); } }
      return r.sim.stateHash();
    };
    const a = drive([16.7]), b = drive([33.3, 8, 50, 7]), c = drive([6.94]);
    expect(a).toBe(b);
    expect(b).toBe(c);
  });
});
