import { describe, expect, it } from 'vitest';
import { ECONOMY, RULES_QUICK, TICK_RATE, lossBonus } from '../src/content/rules';
import { makeRoom, nextRid, run, teleport, toLive } from './helpers';
import type { MatchRoom } from '../src/sim/room';
import type { TeamIndex, WinReason } from '../src/protocol/messages';

const buy = (room: MatchRoom, id: number, item: string) =>
  room.submitRequest(id, { rid: nextRid(), kind: 'buy', item: item as never });
const refund = (room: MatchRoom, id: number, item: string) => room.submitRequest(id, { rid: nextRid(), kind: 'refund', item: item as never });
const endRound = (room: MatchRoom, w: TeamIndex, r: WinReason) => (room as unknown as { endRound: (w: TeamIndex, r: WinReason) => void }).endRound(w, r);
const nextRound = (room: MatchRoom) => {
  let g = 0;
  while (room.phase === 'roundEnd' && g++ < TICK_RATE * 30) run(room, 1);
};

describe('economy', () => {
  it('starts at $800 with a free sidearm and rejects invalid purchases', () => {
    const room = makeRoom();
    const a = room.players[0];
    expect(a.money).toBe(ECONOMY.start);
    expect(a.secondary?.id).toBe('vela');
    buy(room, 0, 'vela');
    expect(a.money).toBe(800); // already owned
    buy(room, 0, 'aster');
    expect(a.primary).toBeNull(); // not enough money
    buy(room, 0, 'kit');
    expect(a.kit).toBe(false); // attackers cannot buy the defuse tool
    buy(room, 0, 'nonsense');
    expect(a.money).toBe(800);
  });

  it('buys, refunds unused items, and enforces per-type and total utility caps', () => {
    const room = makeRoom();
    const a = room.players[0];
    a.money = 5000;
    buy(room, 0, 'vest');
    expect(a.armor).toBe(100);
    expect(a.money).toBe(4350);
    refund(room, 0, 'vest');
    expect(a.armor).toBe(0);
    expect(a.money).toBe(5000);
    buy(room, 0, 'flash');
    buy(room, 0, 'flash');
    buy(room, 0, 'flash');
    expect(a.utils.filter((u) => u === 'flash').length).toBe(2);
    buy(room, 0, 'veil');
    buy(room, 0, 'frag');
    buy(room, 0, 'pulse');
    expect(a.utils.length).toBe(4);
    expect(a.money).toBe(5000 - 200 - 200 - 300 - 300);
    buy(room, 0, 'kite');
    const uid = a.primary!.uid;
    refund(room, 0, 'kite');
    expect(a.primary).toBeNull();
    expect(a.money).toBe(5000 - 1000);
    void uid;
  });

  it('cannot refund a fired weapon and cannot buy outside the zone or after the buy phase', () => {
    const room = makeRoom();
    const a = room.players[0];
    a.money = 3000;
    buy(room, 0, 'kite');
    a.primary!.fired = true;
    refund(room, 0, 'kite');
    expect(a.primary?.id).toBe('kite');
    teleport(a, -38, -20); // Cargo Lane, outside the Freight Yard
    buy(room, 0, 'vest');
    expect(a.armor).toBe(0);
    teleport(a, 0, -35);
    toLive(room);
    buy(room, 0, 'vest');
    expect(a.armor).toBe(0);
  });

  it('duplicate request ids are idempotent', () => {
    const room = makeRoom();
    const a = room.players[0];
    a.money = 2000;
    room.submitRequest(0, { rid: 7, kind: 'buy', item: 'vest' });
    room.submitRequest(0, { rid: 7, kind: 'buy', item: 'vest' });
    room.submitRequest(0, { rid: 7, kind: 'buy', item: 'flash' });
    expect(a.money).toBe(1350);
    expect(a.utils.length).toBe(0);
  });

  it('applies the loss bonus ladder and steps it down one tier after a win', () => {
    expect([1, 2, 3, 4, 5].map((t) => lossBonus(t))).toEqual([1900, 2300, 2700, 3100, 3100]);
    const room = makeRoom({ rules: { ...RULES_QUICK, winRounds: 99, halfRounds: 99, maxRounds: 99 } });
    const def = room.players[1];
    const att = room.players[0];
    const before: number[] = [];
    const gains: number[] = [];
    for (let i = 0; i < 4; i++) {
      toLive(room);
      before.push(att.money);
      att.money = 0;
      endRound(room, 1, 'elimination');
      gains.push(att.money);
      nextRound(room);
    }
    expect(gains).toEqual([1900, 2300, 2700, 3100]);
    // a win for the attackers steps their tier down one (4 -> 3), next loss pays tier 4 again
    toLive(room);
    att.money = 0;
    endRound(room, 0, 'elimination');
    expect(att.money).toBe(ECONOMY.win);
    nextRound(room);
    toLive(room);
    att.money = 0;
    endRound(room, 1, 'elimination');
    expect(att.money).toBe(3100);
    void def;
    void before;
  });

  it('attackers alive at time expiry without an arm get a reduced loss bonus', () => {
    const room = makeRoom();
    toLive(room);
    const att = room.players[0];
    att.money = 0;
    endRound(room, 1, 'time');
    expect(att.money).toBe(Math.round(1900 * ECONOMY.timeoutSurvivorLossMult));
  });

  it('caps money at $12,000', () => {
    const room = makeRoom();
    toLive(room);
    room.players[0].money = 11500;
    endRound(room, 0, 'elimination');
    expect(room.players[0].money).toBe(ECONOMY.cap);
  });

  it('survivors keep gear, the dead lose it; halftime resets money and inventory', () => {
    const room = makeRoom({ rules: { ...RULES_QUICK, halfRounds: 2, winRounds: 9, maxRounds: 20 } });
    const att = room.players[0];
    const def = room.players[1];
    att.money = 5000;
    def.money = 5000;
    room.submitRequest(0, { rid: nextRid(), kind: 'buy', item: 'krait' });
    room.submitRequest(1, { rid: nextRid(), kind: 'buy', item: 'aster' });
    toLive(room);
    def.alive = false; // defender died this round
    endRound(room, 0, 'elimination');
    nextRound(room);
    expect(att.primary?.id).toBe('krait');
    expect(def.primary).toBeNull();
    expect(def.secondary?.id).toBe('vela');
    toLive(room);
    endRound(room, 0, 'elimination');
    nextRound(room); // round 3: second half
    expect(room.teamSide[0]).toBe('custodian');
    expect(att.money).toBe(ECONOMY.start);
    expect(att.primary).toBeNull();
  });
});
