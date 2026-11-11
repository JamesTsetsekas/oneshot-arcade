// Client/server protocol behaviour: prediction and reconciliation under a simulated network,
// input validation, idempotent purchases, the snapshot interest filter and lag compensation.
import { describe, expect, it } from 'vitest';
import { DT, RULES_FULL } from '../src/content/rules';
import { getAnnex } from '../src/map/annex';
import { ClientSession } from '../src/netcode/session';
import { LoopbackTransport, type NetConditions } from '../src/netcode/transport';
import { BTN, type GameEvent, type ServerFrame } from '../src/protocol/types';
import { Room } from '../src/server/room';
import { eyeHeight } from '../src/sim/movement';
import { newWeapon } from '../src/sim/state';

const map = getAnnex();

function makeNet(cond: NetConditions, seed = 21) {
  const room = new Room({ map, rules: RULES_FULL, seed, humans: [{ name: 'Tester', team: 0 }], team0Side: 'atk', difficulty: 'easy' });
  const tr = new LoopbackTransport(cond, true);
  const session = new ClientSession(tr, map.world, 0);
  const events: GameEvent[] = [];
  session.onEvent = (e) => events.push(e);
  room.connect(0, (f) => tr.sendDown(f));
  const step = (buttons: number, yaw: number, pitch = 0): void => {
    session.sendInput(buttons, yaw, pitch);
    tr.now += DT * 1000;
    tr.pumpUp((m) => room.receive(0, m));
    room.tick();
    tr.pumpDown((f) => session.onFrame(f));
  };
  const run = (seconds: number, buttons: number, yaw: number): void => {
    for (let i = 0; i < Math.round(seconds / DT); i++) step(buttons, yaw);
  };
  return { room, tr, session, events, step, run, me: room.match.players[0] };
}

/** A varied movement script inside the attacker spawn (the buy-phase barriers keep it self-contained). */
function wander(n: ReturnType<typeof makeNet>, seconds: number): void {
  const pattern: [number, number][] = [
    [BTN.FWD, 0.2],
    [BTN.FWD | BTN.LEFT, -0.9],
    [BTN.RIGHT, 1.4],
    [BTN.BACK | BTN.JUMP, 2.5],
    [BTN.FWD | BTN.CROUCH, -2.2],
    [BTN.LEFT | BTN.WALK, 0.7],
    [0, 0],
  ];
  const each = seconds / pattern.length;
  for (const [b, yaw] of pattern) n.run(each, b, yaw);
}

describe('prediction and reconciliation', () => {
  it('predicts exactly on an ideal link (zero correction)', () => {
    const n = makeNet({ latency: 0, jitter: 0, loss: 0 });
    n.run(5, 0, 0); // warmup -> buy
    wander(n, 10);
    expect(n.session.maxCorrection).toBe(0);
    expect(n.session.predicted.x).toBeCloseTo(n.me.move.x, 9);
    expect(n.session.predicted.z).toBeCloseTo(n.me.move.z, 9);
  });

  it('stays bounded and converges at 100 ms RTT, 20 ms jitter and 1% loss', () => {
    const n = makeNet({ latency: 50, jitter: 20, loss: 0.01 });
    n.run(5, 0, 0);
    let worst = 0;
    const pattern: [number, number][] = [
      [BTN.FWD, 0.2],
      [BTN.FWD | BTN.LEFT, -0.9],
      [BTN.RIGHT, 1.4],
      [BTN.BACK | BTN.JUMP, 2.5],
      [BTN.FWD | BTN.CROUCH, -2.2],
      [BTN.LEFT | BTN.WALK, 0.7],
    ];
    for (let rep = 0; rep < 3; rep++) {
      for (const [b, yaw] of pattern) {
        for (let i = 0; i < 64; i++) {
          n.step(b, yaw);
          worst = Math.max(worst, Math.hypot(n.session.predicted.x - n.me.move.x, n.session.predicted.z - n.me.move.z));
        }
      }
    }
    // the prediction leads the server by latency, never by more than a short burst of movement
    expect(worst).toBeLessThan(1.6);
    expect(n.session.maxCorrection).toBeLessThan(0.75);
    // release everything: no stuck input, client and server settle on the same spot
    n.run(1.5, 0, 0);
    expect(Math.hypot(n.me.move.vx, n.me.move.vz)).toBe(0);
    expect(Math.hypot(n.session.predicted.x - n.me.move.x, n.session.predicted.z - n.me.move.z)).toBeLessThan(0.02);
    expect(n.tr.stats.lostUp + n.tr.stats.lostDown).toBeGreaterThan(0);
    const kbps = n.tr.stats.bytesDown / (n.tr.now / 1000) / 1000;
    console.log(`downstream ${kbps.toFixed(1)} kB/s as uncompressed JSON; max correction ${(n.session.maxCorrection * 100).toFixed(1)} cm`);
  });

  it('delivers each reliable event exactly once', () => {
    const n = makeNet({ latency: 40, jitter: 30, loss: 0.02 });
    n.run(30, 0, 0);
    const phases = n.events.filter((e) => e.t === 'phase').map((e) => (e as Extract<GameEvent, { t: 'phase' }>).phase + (e as Extract<GameEvent, { t: 'phase' }>).round);
    expect(new Set(phases).size).toBe(phases.length);
    expect(phases).toContain('buy1');
    expect(phases).toContain('live1');
  });
});

describe('server authority', () => {
  it('charges once when a purchase request is retransmitted', () => {
    const n = makeNet({ latency: 30, jitter: 10, loss: 0 });
    n.run(5, 0, 0);
    expect(n.room.match.phase).toBe('buy');
    for (let i = 0; i < 4; i++) n.session.command({ t: 'buy', item: 'vest', reqId: 77 });
    n.run(0.5, 0, 0);
    expect(n.me.money).toBe(800 - 650);
    expect(n.me.armor).toBe(100);
    expect(n.events.filter((e) => e.t === 'buy').length).toBe(1);
  });

  it('ignores malformed, replayed and flooding input', () => {
    const n = makeNet({ latency: 0, jitter: 0, loss: 0 });
    n.run(5, 0, 0);
    const link = n.room.clients.get(0)!;
    const before = { x: n.me.move.x, z: n.me.move.z, yaw: n.me.yaw };
    n.room.receive(0, { t: 'input', cmd: { seq: link.ack + 1, buttons: BTN.FWD, yaw: Number.NaN, pitch: 0, renderTick: 0 } });
    n.room.receive(0, { t: 'input', cmd: { seq: link.ack, buttons: BTN.FWD, yaw: 1, pitch: 0, renderTick: 0 } }); // replay of an old sequence
    n.room.receive(0, { t: 'input', cmd: { seq: 1.5 as number, buttons: BTN.FWD, yaw: 1, pitch: 0, renderTick: 0 } });
    expect(link.queue.length).toBe(0);
    // a burst far beyond the tick rate cannot bank inputs to replay later
    for (let i = 1; i <= 1000; i++) n.room.receive(0, { t: 'input', cmd: { seq: link.ack + i, buttons: BTN.FWD, yaw: 0, pitch: 0, renderTick: 0 } });
    expect(link.queue.length).toBeLessThanOrEqual(6);
    expect(link.dropped).toBeGreaterThan(500);
    expect(n.me.move.x).toBe(before.x);
    expect(n.me.move.z).toBe(before.z);
  });

  it('never lets a client set money, health or position directly', () => {
    const n = makeNet({ latency: 0, jitter: 0, loss: 0 });
    n.run(5, 0, 0);
    // the only messages a client can send are inputs and commands; unknown ones are dropped
    n.room.receive(0, { t: 'cmd', cmd: { t: 'buy', item: 'longglass', reqId: 1 } });
    n.room.receive(0, { t: 'hello', protocol: 1, collisionHash: 'x', ruleset: 'y' });
    n.room.receive(0, { t: 'setMoney', money: 99999 } as never);
    n.run(0.2, 0, 0);
    expect(n.me.money).toBe(800);
    expect(n.me.primary).toBeNull();
    // and a client cannot speak for another seat
    n.room.receive(3, { t: 'cmd', cmd: { t: 'drop' } });
    expect(n.room.match.players[3].sidearm).not.toBeNull();
  });
});

describe('snapshot interest filter', () => {
  function duelRoom() {
    const room = new Room({ map, rules: RULES_FULL, seed: 5, humans: [{ name: 'A', team: 0 }, { name: 'B', team: 1 }], team0Side: 'atk', difficulty: 'easy', teamSize: 1 });
    const frames: [ServerFrame | null, ServerFrame | null] = [null, null];
    room.connect(0, (f) => (frames[0] = f.world ? f : frames[0]));
    room.connect(1, (f) => (frames[1] = f.world ? f : frames[1]));
    const m = room.match;
    while (m.phase !== 'live') room.tick();
    const [a, b] = m.players;
    const put = (p: typeof a, x: number, z: number): void => {
      p.move.x = x;
      p.move.z = z;
      p.move.y = 0;
      p.move.vx = p.move.vz = 0;
    };
    return { room, m, a, b, frames, put, tick: (k = 2) => { for (let i = 0; i < k; i++) room.tick(); } };
  }

  it('omits enemy transforms without line of sight and includes them with it', () => {
    const d = duelRoom();
    d.put(d.a, 40, 20); // Spine
    d.put(d.b, 66, 46); // Vault A, behind several walls
    d.tick();
    expect(d.frames[0]!.world!.players.map((p) => p.id)).toEqual([0]);
    expect(d.frames[1]!.world!.players.map((p) => p.id)).toEqual([1]);
    d.put(d.b, 40, 25); // same corridor
    d.tick();
    expect(d.frames[0]!.world!.players.map((p) => p.id).sort()).toEqual([0, 1]);
    // a thin concrete wall between them hides again, regardless of distance
    d.put(d.b, 46, 20);
    d.tick();
    expect(d.frames[0]!.world!.players.some((p) => p.id === 1)).toBe(false);
  });

  it('hides enemy money, health and loadout in the roster', () => {
    const d = duelRoom();
    d.tick();
    const enemy = d.frames[0]!.world!.roster[1];
    expect(enemy.money).toBe(-1);
    expect(enemy.hp).toBe(-1);
    expect(enemy.primary).toBe('');
    expect(enemy.armor).toBe(-1);
    expect(d.frames[0]!.world!.roster[0].money).toBe(d.a.money);
  });

  it('treats Veil smoke as a sight blocker in the filter', () => {
    const d = duelRoom();
    d.put(d.a, 40, 5);
    d.put(d.b, 40, 13);
    d.tick();
    expect(d.frames[0]!.world!.players.some((p) => p.id === 1)).toBe(true);
    d.m.grenades.push({ id: 900, type: 'veil', owner: 0, team: 0, x: 40, y: 0.1, z: 9, vx: 0, vy: 0, vz: 0, born: d.m.time - 5, rest: true, bounces: 1 });
    d.tick(90);
    expect(d.frames[0]!.world!.players.some((p) => p.id === 1)).toBe(false);
  });

  it('gives defenders the dropped Spike position only once they can see it', () => {
    const d = duelRoom();
    d.put(d.a, 40, 20);
    d.put(d.b, 66, 46);
    d.tick();
    d.m.dropSpike(d.a);
    d.tick();
    expect(d.frames[0]!.world!.spike.x).toBeDefined(); // attackers always know
    expect(d.frames[1]!.world!.spike.x).toBeUndefined();
    expect(d.frames[1]!.world!.items.some((i) => i.kind === 'spike')).toBe(false);
    d.put(d.b, 40, 25);
    d.tick();
    expect(d.frames[1]!.world!.spike.x).toBeDefined();
  });

  it('gives a dead player no view and no enemy data once the whole team is down', () => {
    const d = duelRoom();
    d.put(d.a, 40, 20);
    d.put(d.b, 40, 25);
    d.tick();
    d.m.damage(d.a, d.b, 500, 'chest', 1, 'vela', false, 0, 0, 0);
    let last: ServerFrame | null = null;
    d.room.clients.get(0)!.send = (f) => (last = f);
    d.put(d.b, 40, 24);
    d.room.tick();
    d.room.tick();
    const f = last as unknown as ServerFrame;
    expect(f.own.alive).toBe(false);
    expect(f.view).toBeNull();
    if (f.world) expect(f.world.players.some((p) => p.id === 1)).toBe(false);
  });
});

describe('lag compensation', () => {
  it('rewinds targets to the shooter\'s render time, but never more than 200 ms', () => {
    const shotAt = (ticksBack: number): number => {
      const room = new Room({ map, rules: RULES_FULL, seed: 9, humans: [{ name: 'A', team: 0 }, { name: 'B', team: 1 }], team0Side: 'atk', difficulty: 'easy', teamSize: 1 });
      room.connect(0, () => undefined);
      room.connect(1, () => undefined);
      const m = room.match;
      while (m.phase !== 'live') room.tick();
      const [a, b] = m.players;
      a.sidearm = newWeapon('rook', 5000);
      a.drawEnd = 0;
      // an open stretch of the Freight yard
      a.move.x = 39;
      a.move.z = 5;
      b.move.x = 39;
      b.move.z = 12.5;
      let seq = 10000;
      const history: { x: number; z: number }[] = [];
      // the target strafes east at full speed; record where it was each tick
      for (let i = 0; i < 40; i++) {
        seq++;
        room.receive(0, { t: 'input', cmd: { seq, buttons: 0, yaw: 0, pitch: 0, renderTick: m.tick } });
        room.receive(1, { t: 'input', cmd: { seq, buttons: BTN.RIGHT, yaw: 0, pitch: 0, renderTick: m.tick } });
        room.tick();
        history[m.tick] = { x: b.move.x, z: b.move.z };
      }
      // aim at where the target was `ticksBack` ticks ago and tell the server that is what we were seeing
      const old = history[m.tick - ticksBack];
      const ey = a.move.y + eyeHeight(0);
      const yaw = Math.atan2(old.x - a.move.x, old.z - a.move.z);
      const pitch = Math.atan2(1.25 - ey, Math.hypot(old.x - a.move.x, old.z - a.move.z));
      seq++;
      room.receive(0, { t: 'input', cmd: { seq, buttons: BTN.FIRE, yaw, pitch, renderTick: m.tick - ticksBack } });
      room.receive(1, { t: 'input', cmd: { seq, buttons: BTN.RIGHT, yaw: 0, pitch: 0, renderTick: m.tick } });
      room.tick();
      return b.hp;
    };
    expect(shotAt(0)).toBeLessThan(100); // no latency: hits the current position
    expect(shotAt(5)).toBeLessThan(100); // ~80 ms in the past: compensated
    expect(shotAt(11)).toBeLessThan(100); // ~170 ms: still inside the window
    expect(shotAt(30)).toBe(100); // ~470 ms claimed: clamped to 200 ms, so the stale aim misses
  });
});
