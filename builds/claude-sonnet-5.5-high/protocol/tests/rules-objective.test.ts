import { describe, expect, it } from 'vitest';
import { OBJECTIVE, PHASES, RULESETS } from '../src/content/economy';
import { SITES } from '../src/sim/map';
import { advance, hold, mk, place, sideOf, toLive } from './helpers';
import type { Match } from '../src/sim/match';

function plantAt(m: Match, site: 'A' | 'B' = 'A') {
  toLive(m);
  const carrier = sideOf(m, 'int').find((p) => p.spike)!;
  const z = SITES[site];
  place(carrier, (z.x0 + z.x1) / 2 + 1, (z.z0 + z.z1) / 2 + 1);
  hold(m, carrier, { use: true }, OBJECTIVE.armTime + 0.1);
  return carrier;
}

describe('match rules', () => {
  it('first to 9, win by 2, hard cap 20 with a draw at the cap', () => {
    const m = mk({ rules: RULESETS.full });
    const set = (a: number, b: number) => { m.score = [a, b]; return m.matchResult(); };
    expect(set(8, 7)).toBeNull();
    expect(set(9, 7)?.winner).toBe(0);
    expect(set(9, 8)).toBeNull(); // must win by two
    expect(set(10, 8)?.winner).toBe(0);
    expect(set(8, 9)).toBeNull();
    expect(set(7, 9)?.winner).toBe(1);
    expect(set(11, 9)?.winner).toBe(0);
    expect(set(10, 10)?.winner).toBe(-1); // 20 rounds played, tied
    expect(set(11, 9)?.winner).toBe(0);
    expect(set(9, 10)).toBeNull();
  });

  it('swaps sides after the half and again in overtime, and ends the match with a winner', () => {
    const m = mk({ rules: RULESETS.full });
    const start = m.squadSide[0];
    for (let r = 0; r < 8; r++) { toLive(m); m.endRound((r % 2) as 0 | 1, 'eliminated'); advance(m, PHASES.roundEnd + 0.05); }
    expect(m.phase).toBe('halftime');
    expect(m.squadSide[0]).not.toBe(start);
    advance(m, PHASES.halftime + 0.1);
    // play to 8-8
    for (let r = 0; r < 8; r++) { toLive(m); m.endRound((r % 2) as 0 | 1, 'eliminated'); advance(m, PHASES.roundEnd + 0.05); if (m.phase === 'halftime' && r < 7) advance(m, PHASES.halftime + 0.1); }
    expect(m.score[0] + m.score[1]).toBe(16);
    expect(m.score).toEqual([8, 8]);
    expect(m.phase).toBe('halftime'); // overtime swap
    advance(m, PHASES.halftime + 0.1);
    expect(m.players.every((p) => p.money === 2400)).toBe(true);
    toLive(m); m.endRound(0, 'eliminated'); advance(m, 5.1);
    expect(m.phase).toBe('buy'); // 9-8 does not end it
    toLive(m); m.endRound(0, 'eliminated'); advance(m, 5.1);
    expect(m.phase).toBe('matchEnd');
    expect(m.result()?.winner).toBe(0);
  });
});

describe('Cipher objective', () => {
  it('requires 3.2 uninterrupted seconds inside a vault and is cancelled by releasing', () => {
    const m = mk();
    toLive(m);
    const carrier = sideOf(m, 'int').find((p) => p.spike)!;
    place(carrier, 19, 21);
    hold(m, carrier, { use: true }, 2.0);
    expect(m.spike.state).toBe('carried');
    hold(m, carrier, { use: false }, 0.1);
    expect(carrier.interact.progress).toBe(0);
    hold(m, carrier, { use: true }, 3.0);
    expect(m.spike.state).toBe('carried'); // progress restarted from zero
    hold(m, carrier, { use: true }, 0.4);
    expect(m.spike.state).toBe('planted');
    expect(m.phase).toBe('armed');
  });

  it('cannot arm outside a vault zone or while firing is locked in', () => {
    const m = mk();
    toLive(m);
    const carrier = sideOf(m, 'int').find((p) => p.spike)!;
    place(carrier, 48, 60);
    hold(m, carrier, { use: true }, 4);
    expect(m.spike.state).toBe('carried');
  });

  it('can be armed at either site, then detonates after 35 s and attackers win', () => {
    for (const site of ['A', 'B'] as const) {
      const m = mk();
      plantAt(m, site);
      expect(m.spike.site).toBe(site);
      advance(m, PHASES.armed - OBJECTIVE.armTime * 0 + 0.2);
      expect(m.phase).toBe('roundEnd');
      expect(m.lastRoundEnd?.reason).toBe('detonated');
      expect(m.lastRoundEnd?.winnerSide).toBe('int');
    }
  });

  it('beeps on a fixed accelerating schedule', () => {
    expect(OBJECTIVE.beepInterval(30)).toBe(1.0);
    expect(OBJECTIVE.beepInterval(8)).toBe(0.5);
    expect(OBJECTIVE.beepInterval(3)).toBe(0.25);
    const m = mk();
    plantAt(m);
    const beeps: number[] = [];
    for (let i = 0; i < 64 * 34; i++) { m.step(); for (const e of m.events) if (e.t === 'spike' && e.kind === 'beep') beeps.push(e.remaining!); }
    expect(beeps.length).toBeGreaterThan(40);
    const gaps = beeps.slice(1).map((b, i) => beeps[i] - b);
    expect(Math.max(...gaps)).toBeLessThanOrEqual(1.02);
    expect(Math.min(...gaps)).toBeGreaterThanOrEqual(0.2);
  });

  it('is disarmed in 8 s without a kit and 5 s with a kit, and resumes only from zero', () => {
    for (const kit of [false, true]) {
      const m = mk();
      const carrier = plantAt(m);
      void carrier;
      const d = sideOf(m, 'cus')[0];
      d.kit = kit;
      place(d, m.spike.pos.x + 1, m.spike.pos.z);
      const need = kit ? OBJECTIVE.defuseTimeKit : OBJECTIVE.defuseTime;
      hold(m, d, { use: true }, need - 0.5);
      expect(m.spike.state).toBe('planted');
      hold(m, d, { use: false }, 0.1); // release -> progress resets
      hold(m, d, { use: true }, need - 0.5);
      expect(m.spike.state).toBe('planted');
      hold(m, d, { use: true }, 0.7);
      expect(m.spike.state).toBe('defused');
      expect(m.lastRoundEnd?.reason).toBe('disarmed');
      expect(m.lastRoundEnd?.winnerSide).toBe('cus');
    }
  });

  it('defuse requires being close to the Spike', () => {
    const m = mk();
    plantAt(m);
    const d = sideOf(m, 'cus')[0];
    place(d, m.spike.pos.x + 6, m.spike.pos.z);
    hold(m, d, { use: true }, 9);
    expect(m.spike.state).toBe('planted');
  });

  it('round win resolution: eliminations before and after arming', () => {
    // all attackers die before arming -> custodians win
    let m = mk();
    toLive(m);
    for (const p of sideOf(m, 'int')) m.applyDamage(p, null, 999, 0, 'chest', 'world', 'world', false, false);
    advance(m, 0.1);
    expect(m.lastRoundEnd).toMatchObject({ winnerSide: 'cus', reason: 'eliminated' });

    // all defenders die before arming -> attackers win
    m = mk();
    toLive(m);
    for (const p of sideOf(m, 'cus')) m.applyDamage(p, null, 999, 0, 'chest', 'world', 'world', false, false);
    advance(m, 0.1);
    expect(m.lastRoundEnd).toMatchObject({ winnerSide: 'int', reason: 'eliminated' });

    // attackers die after arming -> round continues
    m = mk();
    plantAt(m);
    for (const p of sideOf(m, 'int')) m.applyDamage(p, null, 999, 0, 'chest', 'world', 'world', false, false);
    advance(m, 0.5);
    expect(m.phase).toBe('armed');

    // defenders die after arming -> attackers win immediately
    m = mk();
    plantAt(m);
    for (const p of sideOf(m, 'cus')) m.applyDamage(p, null, 999, 0, 'chest', 'world', 'world', false, false);
    advance(m, 0.1);
    expect(m.lastRoundEnd).toMatchObject({ winnerSide: 'int', reason: 'defendersEliminated' });
  });

  it('time expiring before arming gives defenders the round; the action clock is 105 s', () => {
    const m = mk();
    toLive(m);
    expect(Math.round(m.phaseRemaining())).toBe(PHASES.action);
    advance(m, PHASES.action + 0.2);
    expect(m.lastRoundEnd).toMatchObject({ winnerSide: 'cus', reason: 'timeExpired' });
  });

  it('the Spike can be dropped on death and picked up by another attacker', () => {
    const m = mk();
    toLive(m);
    const ints = sideOf(m, 'int');
    const carrier = ints.find((p) => p.spike)!;
    const other = ints.find((p) => p.id !== carrier.id)!;
    place(carrier, 48, 60);
    m.applyDamage(carrier, null, 999, 0, 'chest', 'world', 'world', false, false);
    expect(m.spike.state).toBe('dropped');
    place(other, 48.5, 60.3);
    advance(m, 0.1);
    expect(m.spike.state).toBe('carried');
    expect(other.spike).toBe(true);
  });
});
