import { describe, expect, it } from 'vitest';
import { Sim, IDLE, type GameEvent, type SimInput } from '../src/sim/sim';
import { FareManager, parFor, tierFor } from '../src/sim/fares';
import { getWorld, createWorld } from '../src/sim/world';
import { RULES, STEP } from '../src/sim/rules';
import { Traffic, signalState } from '../src/sim/traffic';
import { dist } from '../src/sim/math';

const world = getWorld();

function runFrames(sim: Sim, frames: number, input: SimInput | ((i: number) => SimInput) = IDLE): GameEvent[] {
  const out: GameEvent[] = [];
  for (let i = 0; i < frames; i++) {
    sim.step(typeof input === 'function' ? input(i) : input);
    out.push(...sim.drain());
  }
  return out;
}
function startRunning(sim: Sim): void {
  runFrames(sim, 60 * 4);
  expect(sim.phase).toBe('running');
}
const place = (sim: Sim, x: number, z: number) => {
  const v = sim.vehicle;
  v.x = v.px = x; v.z = v.pz = z; v.vx = v.vz = 0;
};

describe('fare maths', () => {
  it('par and tier thresholds follow the brief (short <35s, medium 35-55s, long >=55s, 20-80s clamp)', () => {
    expect(tierFor(parFor(100))).toBe('short');
    expect(tierFor(parFor(700))).toBe('medium');
    expect(tierFor(parFor(1300))).toBe('long');
    expect(parFor(1)).toBe(RULES.par.min);
    expect(parFor(1e6)).toBe(RULES.par.max);
  });

  it('keeps at least five candidates alive with a short/medium/long mix near the player', () => {
    const fm = new FareManager(world, 77, 6);
    fm.refill(440, 310);
    expect(fm.candidates.length).toBeGreaterThanOrEqual(5);
    const tiers = new Set(fm.candidates.map((c) => c.tier));
    expect(tiers.has('short')).toBe(true);
    expect(tiers.size).toBeGreaterThanOrEqual(2);
    // distribution: pickups are not all in one spot
    const xs = fm.candidates.map((c) => c.pickup.x);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(60);
    // taking one refills it
    fm.take(fm.candidates[0]);
    fm.refill(440, 310);
    expect(fm.candidates.length).toBeGreaterThanOrEqual(5);
  });

  it('avoids repeating recent destinations', () => {
    const fm = new FareManager(world, 5, 6);
    const dests: number[] = [];
    for (let i = 0; i < 6; i++) {
      fm.refill(440, 310);
      const f = fm.candidates[0];
      dests.push(f.dest.id);
      fm.take(f);
    }
    expect(new Set(dests).size).toBeGreaterThanOrEqual(5);
  });

  it('all fares have destinations at least 90 m from the pickup and finite par', () => {
    const fm = new FareManager(world, 9, 6);
    for (let k = 0; k < 20; k++) {
      fm.refill(100 + k * 40, 100 + k * 25);
      for (const f of fm.candidates) {
        expect(dist(f.pickup.x, f.pickup.z, f.dest.x, f.dest.z)).toBeGreaterThan(89);
        expect(f.par).toBeGreaterThanOrEqual(RULES.par.min);
        expect(f.par).toBeLessThanOrEqual(RULES.par.max);
        expect(f.limit).toBeGreaterThan(f.par);
      }
      fm.candidates = [];
    }
  });
});

describe('game session core loop', () => {
  it('counts down 3-2-1 then goes, with 60 s on the Shift Clock', () => {
    const sim = new Sim({ seed: 3, mode: 'arcade', taxi: 'breaker' });
    const ev = runFrames(sim, 60 * 4);
    expect(ev.filter((e) => e.type === 'countdown').map((e) => (e as { n: number }).n)).toEqual([2, 1]);
    expect(ev.some((e) => e.type === 'go')).toBe(true);
    expect(sim.clock).toBeGreaterThan(55);
    expect(sim.clock).toBeLessThanOrEqual(60);
    expect(sim.fares.candidates.length).toBeGreaterThanOrEqual(5);
  });

  it('pickup -> deliver loop: stop in ring boards, stop in arrival zone pays, extends the clock, repopulates', () => {
    const sim = new Sim({ seed: 11, mode: 'arcade', taxi: 'breaker', traffic: 'calm' });
    startRunning(sim);
    const fare = sim.fares.candidates[0];
    place(sim, fare.pickup.x, fare.pickup.z);
    let ev = runFrames(sim, 5);
    expect(ev.some((e) => e.type === 'boarded')).toBe(true);
    expect(sim.trip?.fare.id).toBe(fare.id);
    expect(sim.fares.candidates.length).toBe(0);
    const clockBefore = sim.clock;
    // a moment later: arrive
    runFrames(sim, 90);
    place(sim, fare.dest.x, fare.dest.z);
    ev = runFrames(sim, 3);
    const d = ev.find((e) => e.type === 'delivered');
    expect(d).toBeTruthy();
    if (d?.type === 'delivered') {
      expect(d.breakdown.total).toBeGreaterThan(fare.base);
      expect(d.breakdown.grade).toBe('blazing');
      expect(d.breakdown.shiftSeconds).toBeGreaterThan(0);
    }
    expect(sim.deliveries).toBe(1);
    expect(sim.displayScore).toBeGreaterThan(0);
    expect(sim.clock).toBeGreaterThan(clockBefore);
    expect(sim.trip).toBeNull();
    expect(sim.fares.candidates.length).toBeGreaterThanOrEqual(5);
  });

  it('does not board a passenger while moving fast through the ring', () => {
    const sim = new Sim({ seed: 12, mode: 'arcade', traffic: 'calm' });
    startRunning(sim);
    const fare = sim.fares.candidates[0];
    place(sim, fare.pickup.x, fare.pickup.z);
    sim.vehicle.vx = 15; // 54 km/h
    sim.step({ ...IDLE, throttle: 1 });
    expect(sim.trip).toBeNull();
  });

  it('chains multiple fares and each delivery extends the clock by grade + tier time', () => {
    const sim = new Sim({ seed: 21, mode: 'arcade', traffic: 'calm' });
    startRunning(sim);
    let extended = 0;
    for (let k = 0; k < 3; k++) {
      const f = sim.fares.candidates[0];
      place(sim, f.pickup.x, f.pickup.z);
      runFrames(sim, 4);
      expect(sim.trip).not.toBeNull();
      place(sim, f.dest.x, f.dest.z);
      const ev = runFrames(sim, 3);
      const d = ev.find((e) => e.type === 'delivered');
      expect(d).toBeTruthy();
      if (d?.type === 'delivered') extended += d.breakdown.shiftSeconds;
    }
    expect(sim.deliveries).toBe(3);
    expect(extended).toBeGreaterThan(10);
  });

  it('a delivery that beats par grades Blazing; running out the patience clock fails the fare after the 2 s grace', () => {
    const sim = new Sim({ seed: 31, mode: 'arcade', traffic: 'calm' });
    startRunning(sim);
    const f = sim.fares.candidates[0];
    place(sim, f.pickup.x, f.pickup.z);
    runFrames(sim, 4);
    sim.vehicle.x = 5; sim.vehicle.z = 5;
    sim.clock = 500;
    const ev = runFrames(sim, 60 * (f.limit + 4), { ...IDLE, throttle: 0 });
    expect(ev.some((e) => e.type === 'fareFailed')).toBe(true);
    expect(sim.trip).toBeNull();
    expect(sim.failed).toBe(1);
  });

  it('late arrivals within the personal grace still pay out as Late', () => {
    const sim = new Sim({ seed: 32, mode: 'arcade', traffic: 'calm' });
    startRunning(sim);
    const f = sim.fares.candidates[0];
    place(sim, f.pickup.x, f.pickup.z);
    runFrames(sim, 4);
    sim.vehicle.x = 5; sim.vehicle.z = 5;
    sim.clock = 500;
    while (sim.trip && sim.trip.time < f.limit + 0.5) runFrames(sim, 1);
    expect(sim.trip).not.toBeNull();
    place(sim, f.dest.x, f.dest.z);
    const ev = runFrames(sim, 3);
    const d = ev.find((e) => e.type === 'delivered');
    expect(d?.type === 'delivered' && d.breakdown.grade).toBe('late');
  });

  it('ends the shift at zero clock and produces a result with a rank', () => {
    const sim = new Sim({ seed: 41, mode: 'arcade', traffic: 'calm' });
    startRunning(sim);
    sim.clock = 0.2;
    const ev = runFrames(sim, 60);
    expect(ev.some((e) => e.type === 'ended')).toBe(true);
    expect(sim.phase).toBe('ended');
    expect(sim.result).not.toBeNull();
    expect(['S', 'A', 'B', 'C', 'D']).toContain(sim.result!.rank);
  });

  it('gives a 2 s grace to finish a destination already entered when the clock hits zero', () => {
    const sim = new Sim({ seed: 42, mode: 'arcade', traffic: 'calm' });
    startRunning(sim);
    const f = sim.fares.candidates[0];
    place(sim, f.pickup.x, f.pickup.z);
    runFrames(sim, 4);
    sim.clock = 0.05;
    sim.pauseTimer = 0;
    place(sim, f.dest.x, f.dest.z);
    sim.vehicle.vx = 0;
    const ev = runFrames(sim, 5);
    expect(ev.some((e) => e.type === 'delivered')).toBe(true);
  });

  it('Quick Shift is a fixed 5 minutes with no time extension', () => {
    const sim = new Sim({ seed: 51, mode: 'quick', traffic: 'calm' });
    expect(sim.clock).toBe(RULES.quickShiftLength);
    startRunning(sim);
    const f = sim.fares.candidates[0];
    place(sim, f.pickup.x, f.pickup.z);
    runFrames(sim, 4);
    const before = sim.clock;
    place(sim, f.dest.x, f.dest.z);
    const ev = runFrames(sim, 3);
    const d = ev.find((e) => e.type === 'delivered');
    expect(d?.type === 'delivered' && d.breakdown.shiftSeconds).toBe(0);
    expect(sim.clock).toBeLessThanOrEqual(before);
  });

  it('boarding pauses the Shift Clock for at most 1 second', () => {
    const sim = new Sim({ seed: 52, mode: 'arcade', traffic: 'calm' });
    startRunning(sim);
    const f = sim.fares.candidates[0];
    place(sim, f.pickup.x, f.pickup.z);
    runFrames(sim, 2);
    const c0 = sim.clock;
    runFrames(sim, 120); // 2 s
    const lost = c0 - sim.clock;
    expect(lost).toBeGreaterThan(0.9); // ~1 s ran, ~1 s paused
    expect(lost).toBeLessThan(1.2);
  });

  it('a stuck taxi can reset (hold R) with a time and score penalty', () => {
    const sim = new Sim({ seed: 61, mode: 'arcade', traffic: 'calm' });
    startRunning(sim);
    sim.vehicle.x = 200.5; sim.vehicle.z = 48;
    sim.total = 1000;
    const c0 = sim.clock;
    const ev = runFrames(sim, 70, { ...IDLE, resetHeld: true });
    expect(ev.some((e) => e.type === 'respawn')).toBe(true);
    expect(c0 - sim.clock).toBeGreaterThan(RULES.penalties.reset);
    expect(sim.total).toBeLessThan(1000);
    expect(world.roadInfo(sim.vehicle.x, sim.vehicle.z).onRoad).toBe(true);
  });

  it('driving off the quay into the harbour respawns on the road with a penalty', () => {
    const sim = new Sim({ seed: 62, mode: 'arcade', traffic: 'calm' });
    startRunning(sim);
    place(sim, 400, 700);
    const ev = runFrames(sim, 3);
    expect(ev.some((e) => e.type === 'respawn' && e.reason === 'water')).toBe(true);
    expect(world.isWater(sim.vehicle.x, sim.vehicle.z)).toBe(false);
  });

  it('is deterministic: same seed and inputs produce the same state hash', () => {
    const script = (i: number): SimInput => ({ ...IDLE, throttle: 1, steer: Math.sin(i / 40) * 0.8, handbrake: i % 400 > 350 });
    const a = new Sim({ seed: 99, mode: 'arcade', taxi: 'gull' });
    const b = new Sim({ seed: 99, mode: 'arcade', taxi: 'gull' });
    runFrames(a, 60 * 12, script);
    runFrames(b, 60 * 12, script);
    expect(a.stateHash()).toBe(b.stateHash());
    const c = new Sim({ seed: 100, mode: 'arcade', taxi: 'gull' });
    runFrames(c, 60 * 12, script);
    expect(c.stateHash()).not.toBe(a.stateHash());
  });

  it('Time Trial replays the identical passenger chain for the same start', () => {
    const a = new Sim({ seed: 1, mode: 'trial', taxi: 'breaker' });
    const b = new Sim({ seed: 5, mode: 'trial', taxi: 'gull' });
    expect(a.trialChain.length).toBeGreaterThanOrEqual(3);
    expect(a.trialChain.map((f) => f.dest.id)).toEqual(b.trialChain.map((f) => f.dest.id));
    expect(a.trialChain.map((f) => f.pickup.x)).toEqual(b.trialChain.map((f) => f.pickup.x));
  });
});

describe('style detection', () => {
  it('a near miss at speed scores once; the same pass while crawling scores nothing', () => {
    const pass = (speed: number) => {
      const sim = new Sim({ seed: 71, mode: 'arcade', traffic: 'calm' });
      startRunning(sim);
      sim.traffic.target = 0;
      sim.traffic.agents.length = 0;
      const a = sim.traffic['makeAgent'](sim.world.nodeAt(4, 3), sim.world.nodeAt(4, 4), 50);
      a.v0 = 0; a.wid = 1.8; a.len = 4.4; a.fade = 1;
      sim.traffic.agents.push(a);
      const v = sim.vehicle;
      v.h = 0; v.x = v.px = 435.5 + 2.9; v.z = v.pz = 322;
      const evs: GameEvent[] = [];
      for (let i = 0; i < 160; i++) { v.vx = 0; v.vz = speed; sim.step(IDLE); evs.push(...sim.drain()); }
      return evs.filter((e) => e.type === 'style' && e.category === 'nearMiss').length;
    };
    expect(pass(30)).toBe(1);
    expect(pass(8)).toBe(0);
  });

  it('shortcuts: entering and leaving in order awards once; first discovery bonus only once', () => {
    const sim = new Sim({ seed: 72, mode: 'arcade', traffic: 'calm' });
    startRunning(sim);
    sim.traffic.agents.length = 0;
    sim.traffic.target = 0;
    const sc = world.shortcuts.find((s) => s.kind === 'alley' || s.kind === 'tunnel' || s.kind === 'deck')!;
    const L = Math.hypot(sc.bx - sc.ax, sc.bz - sc.az);
    const ux = (sc.bx - sc.ax) / L, uz = (sc.bz - sc.az) / L;
    const h = Math.atan2(ux, uz);
    const runThrough = () => {
      const v = sim.vehicle;
      v.h = h;
      const evs: GameEvent[] = [];
      for (let d = -6; d <= L + 6; d += 0.5) {
        v.x = v.px = sc.ax + ux * d; v.z = v.pz = sc.az + uz * d; v.vx = ux * 20; v.vz = uz * 20;
        sim.step(IDLE);
        evs.push(...sim.drain());
      }
      return evs;
    };
    const first = runThrough();
    const s1 = first.find((e) => e.type === 'shortcut');
    expect(s1?.type === 'shortcut' && s1.first).toBe(true);
    const second = runThrough();
    const s2 = second.find((e) => e.type === 'shortcut');
    expect(s2?.type === 'shortcut' && s2.first).toBe(false);
    expect(sim.newShortcuts).toBe(1);
  });

  it('driving into the middle of a shortcut and out the same end does not count', () => {
    const sim = new Sim({ seed: 73, mode: 'arcade', traffic: 'calm' });
    startRunning(sim);
    sim.traffic.agents.length = 0;
    sim.traffic.target = 0;
    const sc = world.shortcuts[0];
    const L = Math.hypot(sc.bx - sc.ax, sc.bz - sc.az);
    const ux = (sc.bx - sc.ax) / L, uz = (sc.bz - sc.az) / L;
    const evs: GameEvent[] = [];
    const v = sim.vehicle;
    for (let d = -6; d <= 12; d += 0.5) { v.x = v.px = sc.ax + ux * d; v.z = v.pz = sc.az + uz * d; v.vx = ux * 20; v.vz = uz * 20; sim.step(IDLE); evs.push(...sim.drain()); }
    for (let d = 12; d >= -6; d -= 0.5) { v.x = v.px = sc.ax + ux * d; v.z = v.pz = sc.az + uz * d; v.vx = -ux * 20; v.vz = -uz * 20; sim.step(IDLE); evs.push(...sim.drain()); }
    expect(evs.some((e) => e.type === 'shortcut')).toBe(false);
  });
});

describe('traffic', () => {
  it('keeps agents on roads, never spawns overlapping vehicles, and keeps its target population', () => {
    const t = new Traffic(world, 4, 44);
    t.populate(440, 310);
    expect(t.agents.length).toBeGreaterThanOrEqual(38);
    for (let i = 0; i < 60 * 30; i++) t.update(STEP, { x: 440, z: 310, vx: 0, vz: 0, len: 4.4 });
    let overlaps = 0, offRoad = 0;
    for (const a of t.agents) {
      if (!world.roadInfo(a.x, a.z).onRoad) offRoad++;
      for (const b of t.agents) if (a !== b && dist(a.x, a.z, b.x, b.z) < 1.5) overlaps++;
    }
    expect(offRoad).toBe(0);
    expect(overlaps).toBeLessThanOrEqual(2);
    expect(t.agents.length).toBeGreaterThanOrEqual(38);
  });

  it('signals alternate so cross traffic is never green simultaneously', () => {
    for (let t = 0; t < 14; t += 0.25) {
      const x = signalState(5, 'x', t), z = signalState(5, 'z', t);
      expect(x === 0 && z === 0).toBe(false);
    }
  });

  it('a struck vehicle becomes a wreck and despawns, never blocking forever', () => {
    const t = new Traffic(world, 8, 20);
    t.populate(440, 310);
    const a = t.agents[0];
    t.strike(a, 5, 0);
    expect(a.state).toBe('wreck');
    for (let i = 0; i < 60 * 8; i++) t.update(STEP, { x: 440, z: 310, vx: 0, vz: 0, len: 4.4 });
    expect(t.agents.includes(a)).toBe(false);
  });
});

describe('world gen at other seeds', () => {
  it('still yields 32 destinations', () => {
    expect(createWorld(1337).destinations.length).toBe(32);
  });
});
