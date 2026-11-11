// Full-match server simulations: 10 bots play complete matches headlessly
// through the same input path as humans.
import { describe, expect, it } from 'vitest';
import { RULES_QUICK, RULES_STANDARD, TICK_RATE } from '../src/content/rules';
import { MatchRoom } from '../src/sim/room';
import { map, nav } from './helpers';

function playMatch(seed: number, rules = RULES_QUICK) {
  const room = new MatchRoom({ rules, seed, map, nav, humans: [], teamSize: 5, botDifficulty: 0.55 });
  const sides: string[] = [];
  let lastRound = 0;
  let maxTickMs = 0;
  const t0 = performance.now();
  while (room.phase !== 'matchEnd' && room.tick < TICK_RATE * 60 * 60) {
    const s = performance.now();
    room.step();
    maxTickMs = Math.max(maxTickMs, performance.now() - s);
    if (room.round !== lastRound) {
      lastRound = room.round;
      sides.push(room.teamSide[0]);
    }
  }
  return { room, sides, ms: performance.now() - t0, maxTickMs };
}

describe('full matches', () => {
  it('a quick match completes with one winner, a side swap and valid economy', () => {
    const { room, sides, ms } = playMatch(1234);
    expect(room.phase).toBe('matchEnd');
    const r = room.result!;
    expect(r.winner === 0 || r.winner === 1).toBe(true);
    const [a, b] = r.scores;
    expect(Math.max(a, b)).toBeGreaterThanOrEqual(RULES_QUICK.winRounds);
    expect(r.rounds.length).toBe(a + b);
    expect(r.rounds.length).toBeLessThanOrEqual(RULES_QUICK.maxRounds);
    // sides swapped after the first half
    if (r.rounds.length > RULES_QUICK.halfRounds) expect(sides[RULES_QUICK.halfRounds]).not.toBe(sides[0]);
    for (const p of room.players) {
      expect(p.money).toBeGreaterThanOrEqual(0);
      expect(p.money).toBeLessThanOrEqual(12000);
    }
    expect(r.signature).toMatch(/^[0-9a-f]{8}$/);
    // eslint-disable-next-line no-console
    console.log(`quick match ${a}-${b} in ${r.rounds.length} rounds, ${(room.tick / TICK_RATE / 60).toFixed(1)} sim-min, ${ms.toFixed(0)} ms wall; reasons:`, r.rounds.map((x) => `${x.winnerSide[0]}:${x.reason}`).join(' '));
  });

  it('is deterministic: the same seed replays to the identical signed result', () => {
    const a = playMatch(777);
    const b = playMatch(777);
    expect(a.room.result!.signature).toBe(b.room.result!.signature);
    expect(a.room.eventHash).toBe(b.room.eventHash);
    const c = playMatch(778);
    expect(c.room.result!.signature).not.toBe(a.room.result!.signature);
  });

  it('bots execute the objective: across full matches they arm, and rounds end in varied ways', () => {
    const reasons = new Set<string>();
    let plants = 0;
    let defuses = 0;
    let siteA = 0;
    let siteB = 0;
    let worstTick = 0;
    for (const seed of [11, 12]) {
      const { room, maxTickMs } = playMatch(seed, RULES_STANDARD);
      worstTick = Math.max(worstTick, maxTickMs);
      const r = room.result!;
      expect(r.rounds.length).toBeGreaterThanOrEqual(9);
      for (const x of r.rounds) {
        reasons.add(x.reason);
        if (x.armed) {
          if (x.site === 'A') siteA++;
          if (x.site === 'B') siteB++;
        }
      }
      for (const p of r.players) {
        plants += p.stats.plants;
        defuses += p.stats.defuses;
      }
      // eslint-disable-next-line no-console
      console.log(`standard seed ${seed}: ${r.scores.join('-')} (${r.rounds.length} rounds, ${(room.tick / TICK_RATE / 60).toFixed(1)} sim-min) reasons:`, r.rounds.map((x) => `${x.winnerSide[0]}:${x.reason}${x.armed ? '@' + x.site : ''}`).join(' '));
    }
    // eslint-disable-next-line no-console
    console.log({ plants, defuses, siteA, siteB, reasons: [...reasons], worstTickMs: worstTick.toFixed(2) });
    expect(plants).toBeGreaterThan(3);
    expect(siteA).toBeGreaterThan(0);
    expect(siteB).toBeGreaterThan(0);
    expect(reasons.size).toBeGreaterThanOrEqual(2);
  });
});
