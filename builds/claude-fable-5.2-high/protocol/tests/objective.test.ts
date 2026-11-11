import { describe, expect, it } from 'vitest';
import { beepInterval } from '../src/content/rules';
import { makeRig, BTN, type Rig } from './harness';
import type { Player } from '../src/sim/state';

function arm(r: Rig, x = 64, z = 46): Player {
  const m = r.match;
  r.toLive();
  const carrier = m.players.find((p) => p.hasSpike)!;
  r.place(carrier, x, z);
  r.hold[carrier.id].buttons = BTN.USE;
  r.seconds(3.3);
  r.hold[carrier.id].buttons = 0;
  return carrier;
}

describe('Cipher Spike objective', () => {
  it('assigns the Spike to exactly one attacker each round', () => {
    const r = makeRig();
    r.until(() => r.match.phase === 'buy', 30);
    const carriers = r.match.players.filter((p) => p.hasSpike);
    expect(carriers.length).toBe(1);
    expect(r.match.sideOf(carriers[0])).toBe('atk');
  });

  it('arms only inside a vault and only after 3.2 uninterrupted seconds', () => {
    const r = makeRig();
    const m = r.match;
    r.toLive();
    const c = m.players.find((p) => p.hasSpike)!;
    // outside a vault nothing happens
    r.place(c, 40, 35);
    r.hold[c.id].buttons = BTN.USE;
    r.seconds(4);
    expect(m.phase).toBe('live');
    expect(c.plantT).toBe(0);
    // inside Vault B: releasing early resets progress to zero
    r.place(c, 14.8, 43);
    r.seconds(2.5);
    expect(c.plantT).toBeGreaterThan(2.3);
    r.hold[c.id].buttons = 0;
    r.step(2);
    expect(c.plantT).toBe(0);
    r.hold[c.id].buttons = BTN.USE;
    r.seconds(3.1);
    expect(m.phase).toBe('live');
    r.seconds(0.2);
    expect(m.phase).toBe('armed');
    expect(m.spike.site).toBe('B');
    expect(c.hasSpike).toBe(false);
  });

  it('cannot fire while arming, and movement is locked', () => {
    const r = makeRig();
    const m = r.match;
    r.toLive();
    const c = m.players.find((p) => p.hasSpike)!;
    r.place(c, 64, 46);
    const ammo = c.sidearm!.ammo;
    r.hold[c.id].buttons = BTN.USE | BTN.FIRE | BTN.FWD;
    r.seconds(1);
    expect(c.sidearm!.ammo).toBe(ammo);
    expect(Math.hypot(c.move.x - 64, c.move.z - 46)).toBeLessThan(0.05);
  });

  it('detonates 35 seconds after arming and awards the attackers', () => {
    const r = makeRig();
    const m = r.match;
    arm(r);
    expect(m.phase).toBe('armed');
    const armedAt = m.time;
    r.until(() => m.phase === 'roundEnd', 40);
    expect(m.time - armedAt).toBeGreaterThan(34.9);
    expect(m.time - armedAt).toBeLessThan(35.1);
    expect(m.rounds[0].reason).toBe('detonated');
    expect(m.rounds[0].winnerSide).toBe('atk');
  });

  it('disarms in 8 s without a kit and 5 s with one; releasing restarts from zero', () => {
    for (const kit of [false, true]) {
      const r = makeRig();
      const m = r.match;
      arm(r);
      const d = r.side('def')[0];
      d.kit = kit;
      r.place(d, 64.9, 46.2);
      r.hold[d.id].buttons = BTN.USE;
      const need = kit ? 5 : 8;
      r.seconds(need - 1);
      expect(m.phase).toBe('armed');
      expect(d.defuseT).toBeGreaterThan(need - 1.2);
      // interrupt: no partial persistence
      r.hold[d.id].buttons = 0;
      r.step(2);
      expect(d.defuseT).toBe(0);
      r.hold[d.id].buttons = BTN.USE;
      r.seconds(need - 0.2);
      expect(m.phase).toBe('armed');
      r.seconds(0.4);
      expect(m.phase).toBe('roundEnd');
      expect(m.rounds[0].reason).toBe('disarmed');
      expect(m.rounds[0].winnerSide).toBe('def');
      expect(d.stats.defuses).toBe(1);
    }
  });

  it('rejects a disarm from out of range or through a wall', () => {
    const r = makeRig();
    const m = r.match;
    arm(r, 60, 48.5); // tucked behind the west turbine
    const d = r.side('def')[0];
    r.place(d, 63, 48.5); // 3 m away
    r.hold[d.id].buttons = BTN.USE;
    r.seconds(1);
    expect(d.defuseT).toBe(0);
    r.place(d, 60.5, 43.5); // other side of the turbine: close in a straight line only through metal
    r.seconds(1);
    expect(d.defuseT).toBe(0);
    expect(m.phase).toBe('armed');
  });

  it('keeps the round alive when all attackers die after the arm', () => {
    const r = makeRig();
    const m = r.match;
    arm(r);
    const killer = r.side('def')[0];
    for (const a of r.side('atk')) m.damage(a, killer, 500, 'chest', 1, 'vela', false, 0, 0, 0);
    r.seconds(1);
    expect(m.phase).toBe('armed');
    r.until(() => m.phase === 'roundEnd', 40);
    expect(m.rounds[0].reason).toBe('detonated');
  });

  it('ends immediately for the attackers when no defender is left to disarm', () => {
    const r = makeRig();
    const m = r.match;
    const c = arm(r);
    for (const d of r.side('def')) m.damage(d, c, 500, 'chest', 1, 'vela', false, 0, 0, 0);
    r.step(2);
    expect(m.phase).toBe('roundEnd');
    expect(m.rounds[0].winnerSide).toBe('atk');
    expect(m.rounds[0].reason).toBe('eliminated');
  });

  it('gives defenders the round on time expiry or attacker elimination before an arm', () => {
    const a = makeRig({ roundTime: 3 });
    a.toLive();
    a.until(() => a.match.phase === 'roundEnd', 10);
    expect(a.match.rounds[0]).toMatchObject({ winnerSide: 'def', reason: 'time' });
    const b = makeRig();
    b.toLive();
    const killer = b.side('def')[0];
    for (const p of b.side('atk')) b.match.damage(p, killer, 500, 'chest', 1, 'vela', false, 0, 0, 0);
    b.step(2);
    expect(b.match.rounds[0]).toMatchObject({ winnerSide: 'def', reason: 'eliminated' });
  });

  it('drops the Spike where its carrier dies and lets a teammate pick it up', () => {
    const r = makeRig();
    const m = r.match;
    r.toLive();
    const c = m.players.find((p) => p.hasSpike)!;
    r.place(c, 40, 20);
    r.step(2);
    const killer = r.side('def')[0];
    m.damage(c, killer, 500, 'chest', 1, 'vela', false, 0, 0, 0);
    expect(m.spike.state).toBe('dropped');
    expect(Math.hypot(m.spike.x - 40, m.spike.z - 20)).toBeLessThan(1.2);
    // a defender walking over it cannot take it
    r.place(killer, m.spike.x, m.spike.z);
    r.seconds(0.5);
    expect(m.spike.state).toBe('dropped');
    const mate = r.side('atk').find((p) => p.alive)!;
    r.place(mate, m.spike.x, m.spike.z);
    r.seconds(0.2);
    expect(mate.hasSpike).toBe(true);
    expect(m.spike.state).toBe('carried');
  });

  it('can be dropped on purpose with the tool in hand', () => {
    const r = makeRig();
    const m = r.match;
    r.toLive();
    const c = m.players.find((p) => p.hasSpike)!;
    m.command(c, { t: 'select', slot: 'tool' });
    m.command(c, { t: 'drop' });
    expect(c.hasSpike).toBe(false);
    expect(m.spike.state).toBe('dropped');
  });

  it('uses a fixed, accelerating beep schedule', () => {
    expect(beepInterval(30)).toBe(1);
    expect(beepInterval(15)).toBe(0.5);
    expect(beepInterval(7)).toBe(0.25);
    expect(beepInterval(2)).toBe(0.125);
  });

  it('locks damage the moment the round is decided', () => {
    const r = makeRig({ roundTime: 2 });
    const m = r.match;
    r.toLive();
    r.until(() => m.phase === 'roundEnd', 10);
    const v = m.players.find((p) => p.alive)!;
    const dealt = m.damage(v, m.players.find((p) => p.team !== v.team)!, 80, 'chest', 1, 'aster', false, 0, 0, 0);
    expect(dealt).toBe(0);
    expect(v.hp).toBe(100);
  });
});

describe('match structure', () => {
  const win = (r: Rig, side: 'atk' | 'def'): void => {
    r.toLive();
    const losers = r.side(side === 'atk' ? 'def' : 'atk');
    const killer = r.side(side)[0];
    for (const v of losers) r.match.damage(v, killer, 500, 'chest', 1, 'vela', false, 0, 0, 0);
    r.step(2);
    r.until(() => r.match.phase !== 'roundEnd', 30);
  };

  it('swaps sides after the configured round and keeps the score', () => {
    const r = makeRig({ roundsToWin: 5, swapAfter: 4, maxRounds: 12 });
    const m = r.match;
    for (let i = 0; i < 4; i++) win(r, 'atk');
    expect(m.teams[0].score).toBe(4);
    expect(m.teams[0].side).toBe('def');
    expect(m.teams[1].side).toBe('atk');
    expect(m.round).toBe(5);
  });

  it('ends at the target score and reports one winner', () => {
    const r = makeRig({ roundsToWin: 5, swapAfter: 4, maxRounds: 12 });
    const m = r.match;
    for (let i = 0; i < 4; i++) win(r, 'atk'); // team 0: 4-0
    win(r, 'def'); // team 0 now defends: 5-0
    expect(m.phase).toBe('matchEnd');
    expect(m.summary?.winnerTeam).toBe(0);
    expect(m.summary?.score).toEqual([5, 0]);
    expect(m.summary?.rounds.length).toBe(5);
  });

  it('requires a two-round lead in overtime and stops at the round limit', () => {
    const r = makeRig({ roundsToWin: 3, swapAfter: 2, maxRounds: 8 });
    const m = r.match;
    // 2-2 at the end of regulation-style play
    win(r, 'atk');
    win(r, 'def'); // 1-1
    win(r, 'atk'); // after swap team 1 attacks: 1-2
    win(r, 'def'); // 2-2
    expect(m.phase).not.toBe('matchEnd');
    win(r, 'def'); // 3-2: reached the target but only one ahead
    expect(m.phase).not.toBe('matchEnd');
    win(r, 'atk'); // 3-3
    win(r, 'def'); // 4-3
    expect(m.phase).not.toBe('matchEnd');
    win(r, 'atk'); // 4-4 at the limit of eight rounds: draw
    expect(m.phase).toBe('matchEnd');
    expect(m.summary?.winnerTeam).toBe(-1);
  });
});
