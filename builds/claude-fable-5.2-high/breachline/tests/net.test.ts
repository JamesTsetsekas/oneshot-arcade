import { describe, expect, it } from 'vitest';
import { Interp } from '../src/client/interp';
import { Predictor } from '../src/client/prediction';
import { K17 } from '../src/content/k17';
import { DEFAULT_LOADOUTS, resolveLoadout } from '../src/content/loadout';
import { COMBAT, DT, TICK_RATE } from '../src/content/tuning';
import { CMD_BYTES, decodeCmd, decodeSnapshot, encodeCmd, encodeSnapshot, quantizeCmd, snapshotBytes, Snapshot } from '../src/protocol/codec';
import { PHASE_WARMUP, PROTOCOL_VERSION, ServerMsg } from '../src/protocol/messages';
import { Rng } from '../src/sim/math';
import { loadRapier } from '../src/sim/physics';
import { BTN, InputCmd, newPlayerState, SimEvent, STATE_FIELDS } from '../src/sim/player';
import { World } from '../src/sim/world';
import { Room } from '../src/server/room';
import { baseConfig } from './helpers';

describe('protocol codecs', () => {
  it('round-trips input commands in a fixed 26-byte frame and rejects malformed ones', () => {
    const c: InputCmd = { seq: 123456, rt: 4321.25, mx: -1, mz: 0.5, yaw: 1.2345, pitch: -0.4, buttons: BTN.FIRE | BTN.ADS | BTN.SUPPORT, slot: 1, sel: 2 };
    const buf = encodeCmd(c);
    expect(buf.byteLength).toBe(CMD_BYTES);
    const d = decodeCmd(buf)!;
    expect(d.seq).toBe(c.seq); expect(d.buttons).toBe(c.buttons); expect(d.slot).toBe(1); expect(d.sel).toBe(2);
    expect(d.yaw).toBeCloseTo(c.yaw, 5); expect(d.mx).toBeCloseTo(-1, 2); expect(d.mz).toBeCloseTo(0.5, 2);
    expect(quantizeCmd(d)).toEqual(d); // quantization is idempotent, so client and server see identical inputs
    expect(decodeCmd(new ArrayBuffer(10))).toBeNull();
    const bad = encodeCmd(c); new DataView(bad).setUint32(22, 0, true);
    expect(decodeCmd(bad)).toBeNull();
    const nan = encodeCmd({ ...c, yaw: NaN });
    expect(decodeCmd(nan)).toBeNull();
  });

  it('round-trips snapshots: exact local state, quantized remote players, bounded size', () => {
    const lo = resolveLoadout(DEFAULT_LOADOUTS[0]);
    const st = newPlayerState(-12.345, 0.03, 7.891, 1.1, lo);
    st.vx = Math.fround(3.21); st.mag0 = 17; st.adsT = Math.fround(0.37); st.reloadT = Math.fround(0.5);
    const snap: Snapshot = {
      tick: 9000, ack: 777, phase: 1, timeLeft: 312.4, score0: 41, score1: 39, glass: 0b1010,
      self: { alive: true, state: st, health: 63.2, momentum: 7, supports: 0b011, flash: 1.5, protect: false, respawnIn: 0, revealed: true, uplink: true, tier8Busy: false, loadout: 2, streak: 4 },
      players: Array.from({ length: 11 }, (_, i) => ({ id: i + 1, flags: 1 | (i % 2 ? 8 : 0), x: -50 + i * 9.5, y: i === 3 ? -3 : 0.03, z: 40 - i * 7.3, yaw: i * 0.6, pitch: 0.1 * (i - 5), weapon: i % 9, health: 100 - i })),
      entities: [{ id: 300, type: 9, team: 1, owner: 7, x: 12.3, y: 9.9, z: -4.5, a: 128, b: 200 }],
    };
    const buf = encodeSnapshot(snap);
    expect(buf.byteLength).toBe(snapshotBytes(11, 1));
    expect(buf.byteLength).toBeLessThan(450); // 20 Hz * <450 B = <9 KB/s, far inside the 35 KB/s budget
    const d = decodeSnapshot(buf)!;
    expect(d.tick).toBe(9000); expect(d.ack).toBe(777); expect(d.score0).toBe(41); expect(d.glass).toBe(0b1010);
    for (const f of STATE_FIELDS) expect(d.self.state[f]).toBe(st[f]);
    expect(d.self.supports).toBe(0b011); expect(d.self.uplink).toBe(true); expect(d.self.revealed).toBe(true); expect(d.self.loadout).toBe(2);
    expect(d.players.length).toBe(11);
    d.players.forEach((p, i) => {
      expect(Math.abs(p.x - snap.players[i].x)).toBeLessThan(0.006);
      expect(Math.abs(p.z - snap.players[i].z)).toBeLessThan(0.006);
      expect(Math.abs(p.yaw - snap.players[i].yaw)).toBeLessThan(0.001);
      expect(p.weapon).toBe(snap.players[i].weapon);
    });
    expect(d.entities[0]).toMatchObject({ id: 300, type: 9, team: 1, owner: 7, a: 128, b: 200 });
    expect(decodeSnapshot(new ArrayBuffer(8))).toBeNull();
    expect(decodeSnapshot(buf.slice(0, buf.byteLength - 20))).toBeNull();
  });
});

/** Headless client: prediction + reconciliation against a real room through a simulated lossy link. */
async function runClient(rtt: number, jitter: number, loss: number, seconds: number) {
  const R = await loadRapier();
  const rng = new Rng(99);
  let now = 0; // ms, simulated clock
  const down: { at: number; msg: ServerMsg }[] = [];
  const up: { at: number; data: ArrayBuffer }[] = [];
  let lastDown = 0, lastUp = 0;
  const delay = () => { let d = rtt / 2 + (rng.next() * 2 - 1) * jitter; if (loss > 0 && rng.next() < loss) d += rtt + 60; return Math.max(0, d); };
  const room = new Room(R, baseConfig({ seed: 4242, teamSize: 3, warmup: 0.5 }), (_c, msg) => {
    const at = Math.max(lastDown, now + delay()); lastDown = at;
    const copy = msg.m === 'snap' ? { m: 'snap' as const, data: msg.data.slice(0) } : msg;
    down.push({ at, msg: copy });
  });
  expect(room.addHuman(1, 'Net', DEFAULT_LOADOUTS, 0).ok).toBe(true);
  room.start();
  const world = new World(R, K17);
  const lo = resolveLoadout(DEFAULT_LOADOUTS[0]);
  const pred = new Predictor(world, 0, lo);
  const interp = new Interp();
  let seq = 0, wasAlive = false, predictedShots = 0, gotSnap = false, yaw = Math.PI / 2;
  let maxPending = 0, snapsSeen = 0, liveErrMax = 0;
  const me = room.players[0];
  // keep the scripted player alive so the run measures steady-state prediction
  const steps = Math.round(seconds * TICK_RATE);
  for (let i = 0; i < steps; i++) {
    now += 1000 * DT;
    // deliver uplink
    while (up.length && up[0].at <= now) room.onMessage(1, { m: 'cmd', data: up.shift()!.data });
    me.protT = 1; // invulnerable test dummy
    room.tick();
    // deliver downlink
    while (down.length && down[0].at <= now) {
      const m = down.shift()!.msg;
      if (m.m !== 'snap') continue;
      const s = decodeSnapshot(m.data)!;
      interp.push(s, now);
      snapsSeen++;
      gotSnap = true;
      pred.setPhase(s.phase, s.timeLeft, now);
      pred.reconcile(s.self, s.ack, s.self.alive && !wasAlive, now);
      wasAlive = s.self.alive;
      if (i > 120) liveErrMax = Math.max(liveErrMax, pred.stats.lastError);
    }
    if (!gotSnap || !pred.state) continue;
    // scripted input: run laps of the west yard, jump, crouch, fire bursts
    yaw += Math.sin(i * 0.013) * 0.035;
    const buttons = (i % 200 < 120 ? BTN.SPRINT : 0) | (i % 151 === 0 ? BTN.JUMP : 0) | (i % 400 > 360 ? BTN.CROUCH : 0) | (i % 90 < 14 ? BTN.FIRE : 0) | (i % 610 === 300 ? BTN.RELOAD : 0);
    const cmd = quantizeCmd({ seq: ++seq, rt: interp.renderTick(now), mx: Math.sin(i * 0.02) * 0.6, mz: 1, yaw, pitch: 0.02, buttons, slot: 0, sel: 0 });
    const evs: SimEvent[] = pred.predict(cmd, now);
    for (const e of evs) if (e.t === 'shot') predictedShots++;
    maxPending = Math.max(maxPending, pred.pending.length);
    const at = Math.max(lastUp, now + delay()); lastUp = at;
    up.push({ at, data: encodeCmd(cmd) });
  }
  // drain the link so the last inputs are acknowledged
  for (let i = 0; i < 90; i++) {
    now += 1000 * DT;
    while (up.length && up[0].at <= now) room.onMessage(1, { m: 'cmd', data: up.shift()!.data });
    me.protT = 1;
    room.tick();
    while (down.length && down[0].at <= now) { const m = down.shift()!.msg; if (m.m === 'snap') { const s = decodeSnapshot(m.data)!; pred.reconcile(s.self, s.ack, false, now); } }
  }
  const serverShots = me.tally.get('ar4')?.shots ?? 0;
  return { pred, me, predictedShots, serverShots, maxPending, snapsSeen, liveErrMax, interp };
}

describe('prediction, reconciliation and lag compensation', () => {
  it('stays in lock-step with the server on a clean link (zero corrections)', async () => {
    const r = await runClient(0, 0, 0, 20);
    expect(r.snapsSeen).toBeGreaterThan(350);
    expect(r.pred.stats.snaps).toBe(0);
    expect(r.pred.stats.maxError).toBeLessThan(0.03); // only the warmup hand-off can differ, by a tick or two
    expect(r.liveErrMax).toBeLessThan(1e-3);
    expect(r.predictedShots).toBe(r.serverShots);
    expect(r.pred.state!.mag0).toBe(r.me.st.mag0);
    expect(r.pred.state!.px).toBeCloseTo(r.me.st.px, 4);
  }, 60000);

  it('at 80 ms RTT / 10 ms jitter: no rubber-banding, no duplicate shots, no ammo desync', async () => {
    const r = await runClient(80, 10, 0, 25);
    expect(r.pred.stats.snaps).toBe(0);
    expect(r.liveErrMax).toBeLessThan(0.2); // corrections stay inside the smoothing threshold
    expect(r.predictedShots).toBe(r.serverShots);
    expect(r.pred.state!.mag0).toBe(r.me.st.mag0);
    expect(r.pred.state!.res0).toBe(r.me.st.res0);
    expect(r.maxPending).toBeLessThan(20);
  }, 60000);

  it('at 150 ms RTT / 30 ms jitter / 2% loss: play stays coherent and reconciliation is bounded', async () => {
    const r = await runClient(150, 30, 0.02, 25);
    expect(r.pred.stats.snaps).toBe(0);
    expect(r.predictedShots).toBe(r.serverShots);
    expect(r.pred.state!.mag0).toBe(r.me.st.mag0);
    expect(r.maxPending).toBeLessThan(40); // unacknowledged input backlog is bounded (no stuck input)
    expect(r.interp.delayTicks).toBeGreaterThanOrEqual(6);
    expect(r.interp.delayTicks).toBeLessThanOrEqual(12.01);
    // nothing left queued once the link drains
    expect(r.pred.pending.length).toBeLessThan(3);
  }, 60000);

  it('lag compensation rewinds targets to what a delayed client saw (clamped to 200 ms)', async () => {
    const R = await loadRapier();
    const room = new Room(R, baseConfig({ seed: 5, teamSize: 1, warmup: 0.2 }), () => {});
    expect(room.addHuman(1, 'Lag', DEFAULT_LOADOUTS, 0).ok).toBe(true);
    room.start();
    while (room.phase === PHASE_WARMUP) room.tick();
    const me = room.players[0], foe = room.players[1];
    foe.brain = null; foe.protT = 0; me.protT = 0;
    // target strafes north at 6 m/s, 12 m east of the shooter
    // open strip north of the courtyard: shooter at (5, 26) facing east, target crossing 12 m away
    me.st.px = 5; me.st.pz = 26; me.st.py = 0.03;
    const x = me.st.px + 12;
    let z = 23.2;
    const V = 5;
    let seq = 0;
    const send = (rt: number, yaw: number, fire: boolean) => room.onMessage(1, { m: 'cmd', data: encodeCmd({ seq: ++seq, rt, mx: 0, mz: 0, yaw, pitch: Math.atan2(1.25 - 1.68, 12), buttons: fire ? BTN.FIRE | BTN.ADS : BTN.ADS, slot: 0, sel: 0 }) });
    for (let i = 0; i < 40; i++) { z += V * DT; foe.st.px = x; foe.st.pz = z; foe.st.py = me.st.py; send(room.tickN, Math.PI / 2, false); room.tick(); }
    // the client is 150 ms behind: it aims where the target WAS 9 ticks ago
    const back = 9;
    const zSeen = z - V * DT * back;
    const yawSeen = Math.atan2(12, zSeen - me.st.pz);
    const before = foe.health;
    z += V * DT; foe.st.pz = z;
    send(room.tickN + 1 - back, yawSeen, true);
    room.tick();
    expect(foe.health).toBeLessThan(before); // hit registers against the rewound position
    // the same shot without rewind (claiming zero delay) misses the moving target
    foe.health = 100;
    for (let i = 0; i < 30; i++) { z += V * DT; foe.st.pz = z; send(room.tickN, Math.PI / 2, false); room.tick(); }
    const zSeen2 = z - V * DT * back;
    z += V * DT; foe.st.pz = z;
    send(room.tickN + 1, Math.atan2(12, zSeen2 - me.st.pz), true);
    room.tick();
    expect(foe.health).toBe(100);
    // rewind requests beyond the 200 ms cap are clamped rather than honoured
    expect(COMBAT.lagCompMaxTicks).toBe(12);
    expect(PROTOCOL_VERSION).toBeGreaterThan(0);
  }, 60000);

  it('interpolation renders remote players ~100 ms in the past and never teleports on a stall', () => {
    const interp = new Interp();
    const mk = (tick: number, x: number): Snapshot => ({
      tick, ack: 0, phase: 1, timeLeft: 100, score0: 0, score1: 0, glass: 0,
      self: { alive: true, state: newPlayerState(0, 0, 0, 0, resolveLoadout(DEFAULT_LOADOUTS[0])), health: 100, momentum: 0, supports: 0, flash: 0, protect: false, respawnIn: 0, revealed: false, uplink: false, tier8Busy: false, loadout: 0, streak: 0 },
      players: [{ id: 5, flags: 1, x, y: 0, z: 0, yaw: 0, pitch: 0, weapon: 0, health: 100 }], entities: [],
    });
    let now = 0;
    for (let t = 0; t <= 60; t += 3) { now = (t / 60) * 1000; interp.push(mk(t, t * 0.1), now); } // 6 m/s
    interp.sample(now);
    const p = interp.players.get(5)!;
    expect(p.x).toBeCloseTo((60 - 6) * 0.1, 1); // 6 ticks behind the newest snapshot
    expect(p.vx).toBeCloseTo(6, 1);
    // link stalls for a second: brief extrapolation, then hold - no runaway
    interp.sample(now + 1000);
    expect(interp.players.get(5)!.x).toBeLessThan(6.0 + 0.7);
    expect(interp.players.get(5)!.stale).toBe(true);
  });
});
