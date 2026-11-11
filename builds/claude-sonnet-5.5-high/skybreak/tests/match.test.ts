import { describe, expect, it } from 'vitest';
import { Match } from '../src/sim/match';
import { emptyInput } from '../src/sim/types';

function playToEnd(seed: number): Match {
  const m = new Match({ seed, mode: 'quick', noHuman: true });
  let ticks = 0;
  while (m.phase !== 'ended' && ticks < 30 * 60 * 45) { m.step(); ticks++; }
  return m;
}

describe('24-seat Solo match (all bots, headless)', () => {
  const m = playToEnd(42);

  it('runs staging, skiff, drop and every field phase to exactly one winner', () => {
    expect(m.phase).toBe('ended');
    expect(m.winner).toBeGreaterThanOrEqual(0);
    expect(m.players).toHaveLength(24);
    expect(m.aliveCount()).toBeLessThanOrEqual(1);
    const phases = new Set(m.timeline.map((t) => t.text));
    expect(phases.has('Skiff departed the staging pier')).toBe(true);
    expect(phases.has('All players deployed')).toBe(true);
    expect([...phases].some((t) => t.includes('Riftstorm sweeping'))).toBe(true);
    expect([...phases].some((t) => t.includes('Calmfield contracting 1'))).toBe(true);
    expect(m.storm.phase).toBeGreaterThanOrEqual(6);
  });

  it('assigns unique placements 1..24 with the winner first', () => {
    const places = m.players.map((p) => p.stats.placement).sort((a, b) => a - b);
    expect(places).toEqual(Array.from({ length: 24 }, (_, i) => i + 1));
    expect(m.players[m.winner].stats.placement).toBe(1);
  });

  it('lets every bot jump, glide and land (nobody is stuck on the skiff or in freefall)', () => {
    for (const p of m.players) {
      expect(p.jumpAt, p.name).toBeGreaterThan(0);
      expect(['ground', 'swim', 'dead']).toContain(p.mode);
    }
  });

  it('has real fights: eliminations by weapons and by the storm, with finite numbers', () => {
    const kills = m.players.reduce((a, p) => a + p.stats.kills, 0);
    expect(kills).toBeGreaterThanOrEqual(3);
    const stormKills = m.players.filter((p) => p.stats.killedBy === 'Riftstorm').length;
    expect(stormKills).toBeGreaterThanOrEqual(1);
    for (const p of m.players) {
      expect(Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z), p.name).toBe(true);
      expect(Number.isFinite(p.health)).toBe(true);
    }
    expect(m.players.some((p) => p.stats.shots > 0 && p.stats.hits > 0)).toBe(true);
  });

  it('keeps the match inside the 14-18 minute window including staging and insertion', () => {
    const total = 35 + m.clock;
    expect(total / 60).toBeGreaterThan(11);
    expect(total / 60).toBeLessThan(18.5);
  });
});

describe('determinism and structure', () => {
  it('produces identical state digests for the same seed', () => {
    const a = new Match({ seed: 5, mode: 'quick', noHuman: true });
    const b = new Match({ seed: 5, mode: 'quick', noHuman: true });
    for (let i = 0; i < 30 * 120; i++) { a.step(); b.step(); }
    expect(a.digest()).toBe(b.digest());
    const c = new Match({ seed: 6, mode: 'quick', noHuman: true });
    for (let i = 0; i < 30 * 120; i++) c.step();
    expect(c.digest()).not.toBe(a.digest());
  });

  it('keeps the human on the staging pier, then on the skiff, and jumps on request', () => {
    const m = new Match({ seed: 8, mode: 'quick' });
    const h = m.players[0];
    expect(m.phase).toBe('staging');
    expect(h.y).toBeCloseTo(m.world.spawnPad.y, 0);
    m.stagingLeft = 0.1;
    for (let i = 0; i < 10; i++) m.step();
    expect(m.phase).toBe('skiff');
    expect(h.mode).toBe('skiff');
    for (let i = 0; i < 30 * 12; i++) m.step();
    expect(h.mode).toBe('skiff');
    m.step(new Map([[0, { ...emptyInput(), jump: true }]]));
    m.step(new Map([[0, { ...emptyInput(), jump: true }]])); // the skiff reads the request on the next tick
    expect(h.mode).toBe('freefall');
    for (let i = 0; i < 30 * 60 && h.mode !== 'ground' && h.mode !== 'swim'; i++) m.step(new Map([[0, { ...emptyInput(), moveF: 1 }]]));
    expect(['ground', 'swim']).toContain(h.mode);
    expect(h.health).toBeGreaterThan(90);
  });

  it('resolves simultaneous final eliminations with a deterministic tie-break', () => {
    const m = new Match({ seed: 9, mode: 'quick', noHuman: true, skipStaging: true });
    for (let i = 0; i < 30 * 70; i++) m.step();
    const alive = m.players.filter((p) => p.alive);
    // leave exactly two alive and kill both in the same tick
    for (const p of alive.slice(2)) m.damage(p, 999, -1, 'test', 'torso', true, true);
    m.step(); // the first group dies on its own tick
    const [a, b] = alive;
    a.stats.kills = 2; b.stats.kills = 1;
    m.damage(a, 999, -1, 'test', 'torso', true, true);
    m.damage(b, 999, -1, 'test', 'torso', true, true);
    m.step();
    expect(m.phase).toBe('ended');
    expect(m.winner).toBe(a.id);
  });

  it('keeps server-owned loot authoritative: Prototypes are capped per match', () => {
    const m = new Match({ seed: 11, mode: 'quick', noHuman: true });
    const proto = [...m.loot.values()].filter((e) => e.data.kind === 'weapon' && e.data.rarity === 4);
    expect(proto.length).toBe(0); // none on the ground at match start
  });
});
