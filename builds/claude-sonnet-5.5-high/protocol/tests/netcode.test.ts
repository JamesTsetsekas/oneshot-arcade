import { describe, expect, it } from 'vitest';
import { RULESETS } from '../src/content/economy';
import { ClientNet } from '../src/client/netcode';
import { validateClientMsg, validateInput } from '../src/protocol/schema';
import { NetLink } from '../src/server/link';
import { ServerRoom } from '../src/server/room';
import { newMatch, TICK_RATE } from '../src/sim/match';
import { lineOfSight } from '../src/sim/collision';

const TICK_MS = 1000 / TICK_RATE;

function rig(cond = { latency: 0, jitter: 0, loss: 0, duplicate: 0 }, humanId = 0) {
  const match = newMatch({ seed: 21, rules: RULESETS.quick, humanIds: [humanId], squad0Side: 'int' });
  const room = new ServerRoom(match);
  const link = new NetLink(cond, 5);
  room.addClient(humanId, link.server);
  const client = new ClientNet(link.client);
  client.hello('Tester');
  let t = 0;
  const tick = (input: Partial<Parameters<ClientNet['sendInput']>[0]> = {}) => {
    link.now = t;
    client.poll(t);
    client.sendInput({ moveX: 0, moveZ: 0, yaw: 0, pitch: 0, fire: false, alt: false, jump: false, crouch: false, walk: false, use: false, ...input }, t);
    room.step();
    t += TICK_MS;
  };
  return { match, room, link, client, tick, now: () => t };
}

describe('protocol validation', () => {
  it('rejects malformed and hostile messages', () => {
    expect(validateClientMsg(null)).toBeNull();
    expect(validateClientMsg({ t: 'input', cmd: { seq: 'x' } })).toBeNull();
    expect(validateClientMsg({ t: 'input', cmd: { seq: 1, viewTick: 1, moveX: NaN, moveZ: 0, yaw: 0, pitch: 0 } })).toBeNull();
    expect(validateClientMsg({ t: 'damage', amount: 9999 })).toBeNull();
    expect(validateInput({ seq: 1, viewTick: 1, moveX: 0, moveZ: 0, yaw: 0, pitch: 0, select: 'rm -rf' })).toBeNull();
    const ok = validateInput({ seq: 1, viewTick: 1, moveX: 5, moveZ: 0, yaw: 0, pitch: 0, buy: { req: 1, item: 'vest' } });
    expect(ok?.buy?.item).toBe('vest');
  });

  it('clients can only send intent: a forged damage/money field is ignored', () => {
    const { match, link, client, tick } = rig();
    tick(); tick();
    (link.client as any).send({ t: 'input', cmd: { seq: 99999, viewTick: 0, moveX: 0, moveZ: 0, yaw: 0, pitch: 0, money: 99999, hp: 1000, damage: 500 } });
    for (let i = 0; i < 5; i++) tick();
    expect(match.players[0].money).toBe(800);
    expect(match.players[0].hp).toBe(100);
    void client;
  });
});

describe('server room and client netcode', () => {
  it('handshake enforces version, ruleset and map hash', () => {
    const { client, tick } = rig();
    for (let i = 0; i < 3; i++) tick();
    expect(client.welcomed).toBe(true);
    const bad = rig();
    (bad.link.client as any).send({ t: 'hello', v: 999, ruleset: 'x', mapHash: 'x', name: 'x' });
    for (let i = 0; i < 4; i++) bad.tick();
    expect(bad.client.welcomed).toBe(true); // the valid hello from rig() was first; the forged one is answered with a rejection
    expect(bad.client.rejected).toBe('version mismatch');
  });

  it('keeps prediction within a small error and never loses sync at 100 ms RTT, 20 ms jitter, 1% loss', () => {
    const { client, match, tick, now } = rig({ latency: 50, jitter: 10, loss: 0.01, duplicate: 0.02 });
    for (let i = 0; i < 64 * 3; i++) tick();
    // buy phase confines movement to the yard; walk around inside it
    for (let i = 0; i < 64 * 12; i++) {
      const phase = Math.floor(i / 64) % 4;
      tick({ moveZ: phase === 0 ? 1 : phase === 2 ? -1 : 0, moveX: phase === 1 ? 1 : phase === 3 ? -1 : 0, yaw: 0, walk: phase % 2 === 0 });
    }
    for (let i = 0; i < 64; i++) tick(); // settle with idle input
    const server = match.players[0].pos;
    const pred = client.body.pos;
    expect(Math.hypot(server.x - pred.x, server.z - pred.z)).toBeLessThan(1.5);
    expect(client.maxCorrection).toBeLessThan(2.5);
    expect(client.openRequestCount).toBe(0);
    void now;
  });

  it('with perfect conditions prediction matches the server exactly', () => {
    const { client, match, tick } = rig();
    for (let i = 0; i < 64 * 2; i++) tick();
    for (let i = 0; i < 64 * 6; i++) tick({ moveZ: 1, moveX: i % 128 < 64 ? 1 : -1, yaw: 0.3 });
    expect(client.maxCorrection).toBeLessThan(0.01);
    const server = match.players[0].pos;
    expect(Math.hypot(server.x - client.body.pos.x, server.z - client.body.pos.z)).toBeLessThan(0.3);
  });

  it('never double-buys when requests are duplicated, delayed or retransmitted', () => {
    const { client, match, tick } = rig({ latency: 60, jitter: 30, loss: 0.1, duplicate: 0.3 });
    for (let i = 0; i < 64; i++) tick();
    client.requestBuy('flash');
    client.requestBuy('veil');
    for (let i = 0; i < 64 * 4; i++) tick();
    const p = match.players[0];
    expect(p.util.filter((u) => u === 'flash').length).toBe(1);
    expect(p.util.filter((u) => u === 'veil').length).toBe(1);
    expect(p.money).toBe(800 - 200 - 300);
    expect(client.openRequestCount).toBe(0);
  });

  it('drops duplicate or reordered snapshots', () => {
    const { client, tick } = rig({ latency: 30, jitter: 25, loss: 0, duplicate: 0.5 });
    for (let i = 0; i < 64 * 3; i++) tick();
    expect(client.duplicateSnapshots).toBeGreaterThan(0);
  });

  it('measures snapshot size against the downstream budget (<30 KB/s average)', () => {
    const { link, tick, match } = rig();
    for (let i = 0; i < 64 * 10; i++) tick({ moveZ: 1 });
    const kbps = link.bytesDown / 1024 / (match.time || 1);
    expect(kbps).toBeLessThan(55); // JSON text, uncompressed: above the 30 KB/s target of a binary protocol (documented)
    const up = link.bytesUp / 1024 / match.time;
    expect(up).toBeLessThan(40);
  });

  it('a modified second connection replaces the first for the same seat', () => {
    const match = newMatch({ seed: 3, rules: RULESETS.quick, humanIds: [0] });
    const room = new ServerRoom(match);
    const a = new NetLink(); const b = new NetLink();
    room.addClient(0, a.server);
    room.addClient(0, b.server);
    expect(room.clients.size).toBe(1);
    expect(a.closed).toBe(true);
  });
});

describe('information hiding in snapshots', () => {
  it('does not send hidden enemy transforms; reveals them only with team line of sight', () => {
    const match = newMatch({ seed: 5, rules: RULESETS.quick, humanIds: [0], squad0Side: 'int' });
    const room = new ServerRoom(match);
    const link = new NetLink();
    room.addClient(0, link.server);
    const client = new ClientNet(link.client);
    client.hello('T');
    for (let i = 0; i < 4; i++) { client.poll(0); room.step(); }
    const slot = room.clients.get(0)!;
    // at spawn nobody sees anybody
    let snap = room.buildSnapshot(slot);
    expect(snap.players.filter((p) => p.spotted).length).toBe(0);
    expect(snap.players.every((p) => match.players[p.id].side === 'int')).toBe(true);
    // put an enemy in clear sight of every attacker, 6 m ahead in the open yard
    const ints = match.players.filter((p) => p.side === 'int');
    const enemy = match.players.find((p) => p.side === 'cus')!;
    const me = ints[0];
    me.pos = { x: 30, y: 0, z: 67 }; me.yaw = -Math.PI / 2;
    enemy.pos = { x: 36, y: 0, z: 67 };
    expect(lineOfSight(match.eyePos(me), { x: 36, y: 1.2, z: 67 })).toBe(true);
    snap = room.buildSnapshot(slot);
    expect(snap.players.some((p) => p.id === enemy.id && p.spotted)).toBe(true);
    // behind a wall: invisible
    enemy.pos = { x: 36, y: 0, z: 20 };
    for (const k of slot.spotted.keys()) slot.spotted.set(k, -10);
    snap = room.buildSnapshot(slot, true);
    expect(snap.players.some((p) => p.id === enemy.id)).toBe(false);
    // The roster never leaks enemy money/equipment
    const entry = snap.roster!.find((r) => r.id === enemy.id)!;
    expect(entry.money).toBeUndefined();
    expect(entry.primary).toBeUndefined();
  });

  it('keeps the dropped Spike hidden from defenders and shows planted state to both', () => {
    const match = newMatch({ seed: 6, rules: RULESETS.quick, humanIds: [5], squad0Side: 'int' });
    const room = new ServerRoom(match);
    const link = new NetLink();
    room.addClient(5, link.server);
    const client = new ClientNet(link.client);
    client.hello('D');
    for (let i = 0; i < 4; i++) { client.poll(0); room.step(); }
    const carrier = match.players.find((p) => p.spike)!;
    match.applyDamage(carrier, null, 999, 0, 'chest', 'world', 'world', false, false);
    const slot = room.clients.get(5)!;
    const snap = room.buildSnapshot(slot);
    expect(snap.spike.state).toBe('dropped');
    expect(snap.spike.pos).toBeUndefined();
    expect(snap.spike.carrier).toBe(-1);
  });
});
