import { describe, expect, it } from 'vitest';
import { ScoreState, rankFor } from '../src/sim/score';
import { RULES, STEP } from '../src/sim/rules';

describe('Pulse and style scoring', () => {
  it('starts at 1x and climbs 1x -> 2x -> 3x -> 5x with varied events', () => {
    const s = new ScoreState();
    expect(s.mult).toBe(1);
    const cats = ['nearMiss', 'drift', 'air', 'shortcut', 'needle', 'oncoming', 'clean', 'nearMiss', 'drift', 'air', 'shortcut', 'needle', 'oncoming', 'clean', 'tech'] as const;
    const seen: number[] = [];
    for (const c of cats) { s.award(c, 100); seen.push(s.mult); }
    expect(seen).toContain(2);
    expect(seen).toContain(3);
    expect(s.mult).toBe(5);
  });

  it('repeating one category yields diminishing returns and does not climb as fast', () => {
    const farm = new ScoreState();
    const varied = new ScoreState();
    const cats = ['nearMiss', 'drift', 'air', 'shortcut', 'needle', 'oncoming', 'clean', 'tech'] as const;
    let farmPts = 0, variedPts = 0;
    for (let i = 0; i < 8; i++) {
      farmPts += farm.award('nearMiss', 100).points;
      variedPts += varied.award(cats[i], 100).points;
    }
    expect(farmPts).toBeLessThan(variedPts);
    expect(farm.mult).toBeLessThan(varied.mult);
    // falloff is floored
    const f = new ScoreState();
    let last = 0;
    for (let i = 0; i < 12; i++) last = f.award('nearMiss', 100).falloff;
    expect(last).toBeGreaterThanOrEqual(RULES.pulse.minFalloff);
  });

  it('decays and banks after 3.5 s with no valid event', () => {
    const s = new ScoreState();
    s.award('nearMiss', 100);
    s.award('drift', 100);
    const pending = s.chainPoints;
    expect(pending).toBeGreaterThan(0);
    let banked = 0;
    for (let t = 0; t < 3.4; t += STEP) banked += s.tick(STEP);
    expect(banked).toBe(0);
    for (let t = 0; t < 0.3; t += STEP) banked += s.tick(STEP);
    expect(banked).toBe(pending);
    expect(s.mult).toBe(1);
    expect(s.bankedTips).toBe(pending);
  });

  it('minor collisions drop one tier, hard crashes forfeit the chain', () => {
    const s = new ScoreState();
    for (const c of ['nearMiss', 'drift', 'air', 'shortcut', 'needle', 'oncoming', 'clean', 'tech'] as const) s.award(c, 100);
    const t0 = s.tier;
    expect(t0).toBeGreaterThanOrEqual(2);
    expect(s.collide(RULES.collision.minorSpeed + 1)).toBe('tier');
    expect(s.tier).toBe(t0 - 1);
    const pts = s.chainPoints;
    expect(pts).toBeGreaterThan(0);
    expect(s.collide(RULES.collision.hardSpeed + 1)).toBe('break');
    expect(s.tier).toBe(0);
    expect(s.chainPoints).toBe(0);
  });

  it('tiny bumps do not touch the chain', () => {
    const s = new ScoreState();
    s.award('nearMiss', 100);
    expect(s.collide(RULES.collision.minorSpeed - 1)).toBe('none');
    expect(s.chainPoints).toBeGreaterThan(0);
  });

  it('charges Tailwind from style, but not while boosting (no circular farming)', () => {
    const s = new ScoreState();
    s.tailwind = 0;
    s.award('drift', 600);
    const charged = s.tailwind;
    expect(charged).toBeGreaterThan(0.2);
    s.award('air', 600, true);
    expect(s.tailwind).toBe(charged);
  });

  it('ranks by total score', () => {
    expect(rankFor(0)).toBe('D');
    expect(rankFor(RULES.rank.C)).toBe('C');
    expect(rankFor(RULES.rank.B)).toBe('B');
    expect(rankFor(RULES.rank.A)).toBe('A');
    expect(rankFor(RULES.rank.S)).toBe('S');
  });
});
