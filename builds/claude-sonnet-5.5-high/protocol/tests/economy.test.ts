import { describe, expect, it } from 'vitest';
import { ECON, PHASES, RULESETS } from '../src/content/economy';
import { advance, hold, mk, place, sideOf, toLive } from './helpers';
import { BUY_ZONES } from '../src/sim/map';

describe('economy fixtures', () => {
  it('starts every player with $800 and a starter sidearm', () => {
    const m = mk();
    for (const p of m.players) { expect(p.money).toBe(800); expect(p.slots.secondary?.id).toBe('vela'); expect(p.slots.primary).toBeNull(); }
  });

  it('buys, refunds and rejects invalid purchases', () => {
    const m = mk();
    const p = sideOf(m, 'int')[0];
    expect(m.handleBuy(p, 1, 'vest')).toBe(true);
    expect(p.money).toBe(150);
    expect(p.armor).toBe(100);
    expect(m.handleBuy(p, 2, 'kit')).toBe(false); // attackers cannot buy a defuse tool
    expect(m.handleBuy(p, 3, 'helmet')).toBe(false); // not enough money
    expect(m.handleRefund(p, 4, 'vest')).toBe(true);
    expect(p.money).toBe(800);
    expect(p.armor).toBe(0);
    expect(m.handleRefund(p, 5, 'vest')).toBe(false); // nothing left to refund
    expect(m.handleBuy(p, 6, 'doesnotexist')).toBe(false);
    expect(p.money).toBe(800);
  });

  it('is idempotent: the same request id cannot buy twice', () => {
    const m = mk();
    const p = sideOf(m, 'int')[1];
    expect(m.handleBuy(p, 10, 'flash')).toBe(true);
    expect(m.handleBuy(p, 10, 'flash')).toBe(false);
    expect(p.util).toEqual(['flash']);
    expect(p.money).toBe(600);
  });

  it('enforces utility caps (type limit and 4 slots)', () => {
    const m = mk();
    const p = sideOf(m, 'int')[2];
    p.money = 5000;
    expect(m.handleBuy(p, 1, 'flash')).toBe(true);
    expect(m.handleBuy(p, 2, 'flash')).toBe(true);
    expect(m.handleBuy(p, 3, 'flash')).toBe(false);
    expect(m.handleBuy(p, 4, 'veil')).toBe(true);
    expect(m.handleBuy(p, 5, 'frag')).toBe(true);
    expect(m.handleBuy(p, 6, 'pulse')).toBe(false); // 4 carried
    expect(p.util.length).toBe(4);
  });

  it('refuses buying outside the buy zone and after the buy phase', () => {
    const m = mk();
    const p = sideOf(m, 'cus')[0];
    place(p, 10, 10);
    expect(m.handleBuy(p, 1, 'vest')).toBe(false);
    place(p, BUY_ZONES.cus.x0 + 4, BUY_ZONES.cus.z0 + 4);
    expect(m.handleBuy(p, 2, 'kit')).toBe(true);
    toLive(m);
    expect(m.handleBuy(p, 3, 'vest')).toBe(false);
  });

  it('refund is refused once the item was damaged or fired', () => {
    const m = mk();
    const p = sideOf(m, 'int')[0];
    p.money = 3000;
    m.handleBuy(p, 1, 'aster');
    p.slots.primary!.fresh = false; // as if fired
    expect(m.handleRefund(p, 2, 'aster')).toBe(false);
    m.handleBuy(p, 3, 'vest');
    p.armorFresh = false; // damaged
    expect(m.handleRefund(p, 4, 'vest')).toBe(false);
  });

  it('pays the loss bonus ladder 1900/2300/2700/3100', () => {
    const m = mk({ rules: RULESETS.full });
    const deltas: number[] = [];
    for (let r = 0; r < 4; r++) {
      toLive(m);
      for (const p of m.players) p.money = 800;
      m.endRound(0, 'eliminated');
      deltas.push(m.players.find((p) => p.squad === 1)!.money - 800);
      advance(m, PHASES.roundEnd + 0.1);
      if (m.phase === 'halftime') break;
    }
    expect(deltas).toEqual([1900, 2300, 2700, 3100]);
    expect(m.lossTier[1]).toBe(3);
  });

  it('tier decreases by one after a win', () => {
    const m = mk();
    toLive(m); m.endRound(0, 'eliminated');
    advance(m, 5.1); toLive(m); m.endRound(0, 'eliminated');
    expect(m.lossTier[1]).toBe(2);
    advance(m, 5.1); toLive(m); m.endRound(1, 'eliminated');
    expect(m.lossTier[1]).toBe(1);
  });

  it('awards $3000 for a round win and caps money at $12,000', () => {
    const m = mk();
    toLive(m);
    const winner = m.players.find((p) => p.squad === 0)!;
    winner.money = 11500;
    const other = m.players.find((p) => p.squad === 0 && p.id !== winner.id)!;
    const before = other.money;
    m.endRound(0, 'eliminated');
    expect(other.money - before).toBe(ECON.roundWin);
    expect(winner.money).toBe(ECON.cap);
  });

  it('pays the arm bonus ($300 personal, $600 team) even when attackers lose, and reduces timeout loss', () => {
    const m = mk();
    toLive(m);
    const ints = sideOf(m, 'int');
    const carrier = ints.find((p) => p.spike)!;
    const mate = ints.find((p) => p.id !== carrier.id)!;
    const pre = { c: carrier.money, m: mate.money };
    place(carrier, 19, 21);
    hold(m, carrier, { use: true }, 3.4);
    expect(m.spike.state).toBe('planted');
    expect(carrier.money - pre.c).toBe(ECON.armPersonal);
    m.endRound(m.squadOf('cus'), 'disarmed');
    expect(carrier.money - pre.c).toBe(ECON.armPersonal + ECON.lossBase + ECON.armTeam);
    expect(mate.money - pre.m).toBe(ECON.lossBase + ECON.armTeam);

    advance(m, 5.1); toLive(m);
    const a = sideOf(m, 'int')[0];
    const b4 = a.money;
    m.endRound(m.squadOf('cus'), 'timeExpired');
    expect(a.money - b4).toBe(ECON.lossBase + ECON.lossStep - ECON.timeoutNoArmPenalty);
  });

  it('survivors keep their gear and dead players lose it', () => {
    const m = mk();
    const [s, d] = sideOf(m, 'int');
    s.money = 3000; d.money = 3000;
    m.handleBuy(s, 1, 'aster'); m.handleBuy(d, 2, 'aster');
    toLive(m);
    m.applyDamage(d, null, 500, 0, 'chest', 'world', 'world', false, false);
    expect(d.alive).toBe(false);
    m.endRound(0, 'eliminated');
    advance(m, 5.2);
    expect(s.slots.primary?.id).toBe('aster');
    expect(d.slots.primary).toBeNull();
    expect(s.alive && d.alive).toBe(true);
  });

  it('halftime swaps sides and resets money and loadouts', () => {
    const m = mk({ rules: RULESETS.quick });
    const side0 = m.squadSide[0];
    for (let r = 0; r < RULESETS.quick.halfRounds; r++) {
      toLive(m);
      m.endRound((r % 2) as 0 | 1, 'eliminated');
      advance(m, PHASES.roundEnd + 0.05);
    }
    expect(m.phase).toBe('halftime');
    expect(m.squadSide[0]).not.toBe(side0);
    for (const p of m.players) { expect(p.money).toBe(800); expect(p.slots.primary).toBeNull(); expect(p.side).toBe(m.squadSide[p.squad]); }
    advance(m, PHASES.halftime + 0.1);
    expect(m.phase).toBe('buy');
  });
});
