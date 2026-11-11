import { describe, it, expect } from 'vitest';
import { Match } from '../src/sim/match';
import { makeBotSetup } from '../src/services/matchmaker';

function fingerprint(m: Match) {
  return m.units.filter((u) => u.alive).map((u) => `${u.id}:${u.x.toFixed(3)},${u.y.toFixed(3)},${Math.round(u.hp)}`).join('|');
}

describe('headless bot matches', () => {
  it('is deterministic for a given seed', () => {
    const a = new Match(makeBotSetup(21)), b = new Match(makeBotSetup(21));
    for (let i = 0; i < 30 * 150; i++) { a.step(); b.step(); }
    expect(fingerprint(a)).toBe(fingerprint(b));
  });
  it('six bots play a complete match to exactly one authoritative victory, using every system', () => {
    const m = new Match(makeBotSetup(7));
    let worst = 0;
    const t0 = performance.now();
    const states = new Set<string>();
    while (!m.over && m.time < 40 * 60) {
      const a = performance.now();
      m.step();
      worst = Math.max(worst, performance.now() - a);
      if (m.tick % 30 === 0) for (const b of m.bots) states.add(b.state);
    }
    const wall = performance.now() - t0;
    expect(m.over).toBe(true);
    expect([0, 1]).toContain(m.winner);
    expect(m.events.filter((e) => e.ev.e === 'victory').length + (m.victoryFired === 1 ? 0 : 99)).toBeLessThanOrEqual(1);
    const r = m.result();
    const totalK = r.score.reduce((s, x) => s + x.k, 0);
    const cs = r.score.reduce((s, x) => s + x.cs, 0);
    const wards = r.score.reduce((s, x) => s + x.wardScore, 0);
    const items = r.score.reduce((s, x) => s + x.items.length, 0);
    expect(totalK).toBeGreaterThan(0);
    expect(cs).toBeGreaterThan(100);
    expect(wards).toBeGreaterThan(0);
    expect(items).toBeGreaterThan(6);
    for (const s of ['Lane', 'LastHit', 'Push', 'TeamFight', 'Retreat', 'RecallBuy', 'JungleCamp', 'Shop']) expect(states.has(s), `bot state ${s}`).toBe(true);
    expect(r.timeline.some((t) => t.text.includes('Seal'))).toBe(true);
    // performance: average tick well under the 18 ms budget
    expect(wall / m.tick).toBeLessThan(8);
    console.log(`match: ${(m.time / 60).toFixed(1)} min, winner ${m.winner}, kills ${totalK}, cs ${cs}, avg tick ${(wall / m.tick).toFixed(2)} ms, worst ${worst.toFixed(1)} ms, states ${[...states].join(',')}`);
  }, 600000);
});
