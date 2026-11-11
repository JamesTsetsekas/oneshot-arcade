import { describe, expect, it } from 'vitest';
import { ECONOMY, RULES_QUICK, TICK_RATE } from '../src/content/rules';
import { BTN } from '../src/protocol/messages';
import { makeRoom, run, teleport, toLive } from './helpers';
import type { MatchRoom } from '../src/sim/room';

function plantAt(room: MatchRoom, x: number, z: number): void {
  const att = room.players[0];
  teleport(att, x, z);
  run(room, Math.ceil(RULES_QUICK.armTime * TICK_RATE) + 2, { 0: { buttons: BTN.USE } });
}

describe('Cipher objective', () => {
  it('one attacker spawns with the Cipher; it can be dropped and picked up', () => {
    const room = makeRoom();
    const att = room.players[0];
    expect(att.hasSpike).toBe(true);
    expect(room.spike.state).toBe('carried');
    toLive(room);
    att.active = 'spike';
    room.submitRequest(0, { rid: 1, kind: 'drop' });
    expect(room.spike.state).toBe('dropped');
    expect(att.hasSpike).toBe(false);
    // walk onto it
    const d = room.drops.find((x) => x.item === 'spike')!;
    teleport(att, d.pos.x, d.pos.z);
    run(room, 2);
    expect(att.hasSpike).toBe(true);
    expect(room.spike.state).toBe('carried');
  });

  it('arms at vault A and vault B but not outside a vault', () => {
    for (const [x, z, site] of [[-35.5, 6.5, 'A'], [35.5, 5, 'B']] as const) {
      const room = makeRoom();
      toLive(room);
      const att = room.players[0];
      att.money = 0;
      plantAt(room, x, z);
      expect(room.spike.state).toBe('planted');
      expect(room.spike.site).toBe(site);
      expect(room.phase).toBe('planted');
      expect(att.money).toBe(ECONOMY.plantPersonal);
    }
    const room = makeRoom();
    toLive(room);
    plantAt(room, 0, -8); // Calibration (mid)
    expect(room.spike.state).toBe('carried');
  });

  it('arming requires 3.2 uninterrupted seconds', () => {
    const room = makeRoom();
    toLive(room);
    const att = room.players[0];
    teleport(att, -35.5, 6.5);
    run(room, Math.floor(3.0 * TICK_RATE), { 0: { buttons: BTN.USE } });
    run(room, 2, { 0: { buttons: 0 } });
    run(room, Math.floor(1.0 * TICK_RATE), { 0: { buttons: BTN.USE } });
    expect(room.spike.state).toBe('carried');
    run(room, Math.ceil(2.4 * TICK_RATE), { 0: { buttons: BTN.USE } });
    expect(room.spike.state).toBe('planted');
  });

  it('disarms in 8 s without a kit and 5 s with one; releasing resets to zero', () => {
    for (const kit of [false, true]) {
      const room = makeRoom();
      toLive(room);
      plantAt(room, -35.5, 6.5);
      const def = room.players[1];
      def.kit = kit;
      teleport(def, room.spike.pos.x + 0.6, room.spike.pos.z);
      const need = kit ? 5 : 8;
      // partial disarm then release: no persistence
      run(room, Math.floor((need - 1) * TICK_RATE), { 1: { buttons: BTN.USE } });
      run(room, 2, { 1: { buttons: 0 } });
      run(room, Math.floor((need - 0.5) * TICK_RATE), { 1: { buttons: BTN.USE } });
      expect(room.spike.state).toBe('planted');
      run(room, Math.ceil(1.0 * TICK_RATE), { 1: { buttons: BTN.USE } });
      expect(room.spike.state).toBe('defused');
      expect(room.lastRound?.reason).toBe('defused');
      expect(room.lastRound?.winnerSide).toBe('custodian');
    }
  });

  it('detonates after 35 s for an Intrusion win, and the arming team bonus is paid on top', () => {
    const room = makeRoom();
    toLive(room);
    plantAt(room, 35.5, 5);
    const att = room.players[0];
    const def = room.players[1];
    teleport(def, 0, 25); // far from the blast
    const m0 = att.money;
    run(room, Math.ceil(RULES_QUICK.spikeTime * TICK_RATE) + 2);
    expect(room.spike.state).toBe('detonated');
    expect(room.lastRound?.reason).toBe('detonated');
    expect(room.lastRound?.winnerSide).toBe('intrusion');
    expect(att.money).toBe(m0 + ECONOMY.win + ECONOMY.plantTeam);
  });

  it('all defenders dead after the arm ends the round at once; all attackers dead does not', () => {
    const r1 = makeRoom();
    toLive(r1);
    plantAt(r1, -35.5, 6.5);
    r1.damage(r1.players[0], r1.players[1], 200, 'test', false, false, 'chest', false, false);
    run(r1, 1);
    expect(r1.phase).toBe('roundEnd');
    expect(r1.lastRound?.reason).toBe('elimination');
    expect(r1.lastRound?.winnerSide).toBe('intrusion');

    const r2 = makeRoom();
    toLive(r2);
    plantAt(r2, -35.5, 6.5);
    r2.damage(r2.players[1], r2.players[0], 200, 'test', false, false, 'chest', false, false);
    run(r2, 5);
    expect(r2.phase).toBe('planted');
  });

  it('time expiry before an arm is a Custodian win', () => {
    const room = makeRoom({ rules: { ...RULES_QUICK, roundTime: 3 } });
    toLive(room);
    run(room, 4 * TICK_RATE);
    expect(room.lastRound?.reason).toBe('time');
    expect(room.lastRound?.winnerSide).toBe('custodian');
  });

  it('defenders cannot see a dropped Cipher in snapshots until they have line of sight', () => {
    const room = makeRoom();
    toLive(room);
    const att = room.players[0];
    teleport(att, -38, -20);
    att.active = 'spike';
    room.submitRequest(0, { rid: 9, kind: 'drop' });
    run(room, 1);
    const defSnap = room.buildSnapshot(1);
    expect(defSnap.spike.known).toBe(false);
    expect(defSnap.drops.some((d) => d.item === 'spike')).toBe(false);
    const attSnap = room.buildSnapshot(0);
    expect(attSnap.spike.known).toBe(true);
  });
});
