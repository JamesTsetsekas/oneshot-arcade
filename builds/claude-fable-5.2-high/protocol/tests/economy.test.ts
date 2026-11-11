import { describe, expect, it } from 'vitest';
import { RULES_FULL, lossReward } from '../src/content/rules';
import { makeRig, BTN } from './harness';

describe('economy fixtures', () => {
  it('starts everyone at $800 with only the starter sidearm', () => {
    const r = makeRig();
    r.until(() => r.match.phase === 'buy', 30);
    for (const p of r.match.players) {
      expect(p.money).toBe(800);
      expect(p.primary).toBeNull();
      expect(p.sidearm?.id).toBe('vela');
      expect(p.armor).toBe(0);
    }
  });

  it('rejects purchases the player cannot afford and leaves state untouched', () => {
    const r = makeRig();
    r.until(() => r.match.phase === 'buy', 30);
    const p = r.match.players[0];
    expect(r.match.buy(p, 'aster', 1)).toBe(false);
    expect(p.money).toBe(800);
    expect(p.primary).toBeNull();
  });

  it('charges exactly once for a replayed purchase request (idempotent)', () => {
    const r = makeRig();
    r.until(() => r.match.phase === 'buy', 30);
    const p = r.match.players[0];
    expect(r.match.buy(p, 'vest', 42)).toBe(true);
    expect(r.match.buy(p, 'vest', 42)).toBe(false);
    r.match.command(p, { t: 'buy', item: 'flash', reqId: 43 });
    r.match.command(p, { t: 'buy', item: 'flash', reqId: 43 });
    expect(p.money).toBe(800 - 650);
    expect(p.util.length).toBe(0); // $150 left: the flash was unaffordable and the replay is ignored
    expect(p.armor).toBe(100);
  });

  it('only sells inside the buy phase and inside the spawn buy zone', () => {
    const r = makeRig();
    r.until(() => r.match.phase === 'buy', 30);
    const p = r.match.players[0];
    p.money = 5000;
    r.place(p, 40, 40); // Calibration: outside the buy zone
    expect(r.match.buy(p, 'kite', 1)).toBe(false);
    r.place(p, 44, 8);
    r.until(() => r.match.phase === 'live', 60);
    expect(r.match.buy(p, 'kite', 2)).toBe(false);
    expect(p.money).toBe(5000);
  });

  it('enforces per-type and total utility caps, and the defender-only kit', () => {
    const r = makeRig();
    r.until(() => r.match.phase === 'buy', 30);
    const atk = r.side('atk')[0];
    const def = r.side('def')[0];
    atk.money = def.money = 12000;
    expect(r.match.buy(atk, 'flash', 1)).toBe(true);
    expect(r.match.buy(atk, 'flash', 2)).toBe(true);
    expect(r.match.buy(atk, 'flash', 3)).toBe(false); // cap of two
    expect(r.match.buy(atk, 'veil', 4)).toBe(true);
    expect(r.match.buy(atk, 'veil', 5)).toBe(false); // cap of one
    expect(r.match.buy(atk, 'frag', 6)).toBe(true);
    expect(r.match.buy(atk, 'thermite', 7)).toBe(false); // four carried
    expect(atk.util.length).toBe(4);
    expect(r.match.buy(atk, 'kit', 8)).toBe(false);
    expect(r.match.buy(def, 'kit', 9)).toBe(true);
    expect(def.kit).toBe(true);
  });

  it('refunds unused purchases during the buy phase, but not a fired weapon', () => {
    const r = makeRig();
    r.until(() => r.match.phase === 'buy', 30);
    const p = r.match.players[0];
    p.money = 6000;
    r.match.buy(p, 'aster', 1);
    r.match.buy(p, 'vesthelm', 2);
    r.match.buy(p, 'veil', 3);
    expect(p.money).toBe(6000 - 2650 - 1000 - 300);
    expect(r.match.refundable(p).sort()).toEqual(['aster', 'veil', 'vesthelm']);
    expect(r.match.refund(p, 'vesthelm', 4)).toBe(true);
    expect(p.armor).toBe(0);
    expect(p.helmet).toBe(false);
    expect(r.match.refund(p, 'veil', 5)).toBe(true);
    p.primary!.fired = true;
    expect(r.match.refund(p, 'aster', 6)).toBe(false);
    expect(p.money).toBe(6000 - 2650);
    r.until(() => r.match.phase === 'live', 60);
    expect(r.match.refund(p, 'aster', 7)).toBe(false);
  });

  it('buying over a weapon drops the old one; refunding takes it back', () => {
    const r = makeRig();
    r.until(() => r.match.phase === 'buy', 30);
    const p = r.match.players[0];
    p.money = 6000;
    r.match.buy(p, 'kite', 1);
    r.match.buy(p, 'aster', 2);
    expect(p.primary?.id).toBe('aster');
    expect(r.match.items.some((i) => i.inst?.id === 'kite')).toBe(true);
    r.match.refund(p, 'aster', 3);
    expect(p.primary?.id).toBe('kite');
    expect(r.match.items.length).toBe(0);
  });

  it('pays win reward, escalating loss bonus, and steps the streak down one tier after a win', () => {
    expect(lossReward(RULES_FULL, 1)).toBe(1900);
    expect(lossReward(RULES_FULL, 2)).toBe(2300);
    expect(lossReward(RULES_FULL, 3)).toBe(2700);
    expect(lossReward(RULES_FULL, 4)).toBe(3100);
    expect(lossReward(RULES_FULL, 9)).toBe(3100);
    const r = makeRig();
    const m = r.match;
    const atkTeam = m.teamOfSide('atk');
    const defTeam = 1 - atkTeam;
    const killSide = (side: 'atk' | 'def'): void => {
      const victims = r.side(side);
      const killer = r.side(side === 'atk' ? 'def' : 'atk')[0];
      for (const v of victims) m.damage(v, killer, 500, 'chest', 1, 'vela', false, 0, 0, 0);
    };
    // attackers lose three rounds in a row
    const expected = [1900, 2300, 2700];
    for (let i = 0; i < 3; i++) {
      r.toLive();
      const before = m.players.map((p) => p.money);
      killSide('atk');
      r.step(2);
      expect(m.phase).toBe('roundEnd');
      const loser = m.players.find((p) => p.team === atkTeam)!;
      expect(loser.money - before[loser.id]).toBe(expected[i]);
      const winnerNoKills = m.players.filter((p) => p.team === defTeam)[4];
      expect(winnerNoKills.money - before[winnerNoKills.id]).toBe(3000);
    }
    expect(m.teams[atkTeam].lossStreak).toBe(3);
    // attackers win one: their streak drops by exactly one tier, not to zero
    r.toLive();
    killSide('def');
    r.step(2);
    expect(m.teams[atkTeam].lossStreak).toBe(2);
    expect(m.teams[defTeam].lossStreak).toBe(1);
    // and their next loss pays the third tier again
    r.toLive();
    const loser = m.players.filter((p) => p.team === atkTeam)[3];
    loser.money = 0; // keep clear of the money cap
    killSide('atk');
    r.step(2);
    expect(loser.money).toBe(2700);
  });

  it('caps money at $12,000', () => {
    const r = makeRig();
    r.toLive();
    const p = r.match.players[0];
    p.money = 11500;
    r.match.addMoney(p, 3000, 'test');
    expect(p.money).toBe(12000);
  });

  it('pays the arming reward even when attackers lose the round', () => {
    const r = makeRig();
    const m = r.match;
    r.toLive();
    const carrier = m.players.find((p) => p.hasSpike)!;
    const mates = r.side('atk').filter((p) => p !== carrier);
    const before = m.players.map((p) => p.money);
    r.place(carrier, 64, 46);
    r.hold[carrier.id].buttons = BTN.USE;
    r.seconds(3.4);
    expect(m.phase).toBe('armed');
    expect(carrier.money - before[carrier.id]).toBe(300);
    // a defender disarms
    r.hold[carrier.id].buttons = 0;
    const d = r.side('def')[0];
    r.place(d, 64.8, 46);
    r.hold[d.id].buttons = BTN.USE;
    r.seconds(8.2);
    expect(m.phase).toBe('roundEnd');
    expect(m.rounds[0].reason).toBe('disarmed');
    // losing attackers: loss bonus + $600 team arming reward (+$300 for the planter)
    expect(mates[0].money - before[mates[0].id]).toBe(1900 + 600);
    expect(carrier.money - before[carrier.id]).toBe(300 + 1900 + 600);
    expect(d.money - before[d.id]).toBe(3000 + 300);
  });

  it('gives surviving attackers a reduced reward when the clock runs out without an arm', () => {
    const r = makeRig({ roundTime: 5 });
    const m = r.match;
    r.toLive();
    const atk = r.side('atk');
    const before = m.players.map((p) => p.money);
    const killer = r.side('def')[0];
    m.damage(atk[0], killer, 500, 'chest', 1, 'vela', false, 0, 0, 0);
    r.until(() => m.phase === 'roundEnd', 10);
    expect(m.rounds[0].reason).toBe('time');
    expect(atk[0].money - before[atk[0].id]).toBe(1900); // died: normal loss bonus
    expect(atk[1].money - before[atk[1].id]).toBe(RULES_FULL.saveReward); // saved: reduced
  });

  it('lets survivors keep gear, strips the dead, and resets everything at the side swap', () => {
    const r = makeRig({ swapAfter: 1, roundsToWin: 3, maxRounds: 6 });
    const m = r.match;
    r.until(() => m.phase === 'buy', 30);
    const [a0, a1] = r.side('atk');
    a0.money = a1.money = 9000;
    m.buy(a0, 'krait', 1);
    m.buy(a0, 'vesthelm', 2);
    m.buy(a1, 'krait', 3);
    r.until(() => m.phase === 'live', 60);
    const killer = r.side('def')[0];
    m.damage(a1, killer, 500, 'chest', 1, 'vela', false, 0, 0, 0);
    for (const d of r.side('def')) m.damage(d, a0, 500, 'chest', 1, 'krait', false, 0, 0, 0);
    r.step(2);
    expect(m.phase).toBe('roundEnd');
    const a0Team = a0.team;
    // round 1 was the last round of the half here (swapAfter 1): money and gear reset, sides flip
    r.until(() => m.phase === 'buy' && m.round === 2, 30);
    expect(m.teams[a0Team].side).toBe('def');
    for (const p of m.players) {
      expect(p.money).toBe(800);
      expect(p.primary).toBeNull();
      expect(p.armor).toBe(0);
    }
    // now check carry-over inside a half
    a0.money = 9000;
    m.buy(a0, 'aster', 10);
    m.buy(a0, 'vest', 11);
    r.until(() => m.phase === 'live', 60);
    const foe = m.players.find((p) => p.team !== a0Team)!;
    const mate = m.players.find((p) => p.team === a0Team && p !== a0)!;
    mate.primary = null;
    m.damage(mate, foe, 500, 'chest', 1, 'vela', false, 0, 0, 0);
    for (const e of m.players.filter((p) => p.team !== a0Team)) m.damage(e, a0, 500, 'chest', 1, 'aster', false, 0, 0, 0);
    r.step(2);
    r.until(() => m.phase === 'buy' && m.round === 3, 30);
    expect(a0.primary?.id).toBe('aster'); // survivor keeps weapon and armor
    expect(a0.armor).toBe(100);
    expect(mate.primary).toBeNull(); // the dead restart with the starter sidearm
    expect(mate.sidearm?.id).toBe('vela');
  });

  it('logs every transaction into the replay fingerprint', () => {
    const a = makeRig({}, 11);
    const b = makeRig({}, 11);
    a.until(() => a.match.phase === 'buy', 30);
    b.until(() => b.match.phase === 'buy', 30);
    expect(a.match.logHash).toBe(b.match.logHash);
    a.match.buy(a.match.players[0], 'vest', 1);
    expect(a.match.logHash).not.toBe(b.match.logHash);
    b.match.buy(b.match.players[0], 'vest', 1);
    expect(a.match.logHash).toBe(b.match.logHash);
  });
});
