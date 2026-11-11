import { describe, it, expect } from 'vitest';
import { getRapier, getModel } from './helpers';
import { Session, SessionEvent, TRIALS, LESSONS } from '../src/game-session/session';
import { Autopilot } from '../src/tools/autopilot';
import { NEUTRAL_INPUT, InputFrame } from '../src/vehicle/vehicle';
import { DENSITY_COUNTS } from '../src/traffic/traffic';

const model = getModel();

function runAuto(s: Session, maxSeconds: number): SessionEvent[] {
  const ap = new Autopilot();
  const all: SessionEvent[] = [];
  for (let i = 0; i < maxSeconds * 60 && s.phase !== 'ended'; i++) {
    s.step(ap.drive(s));
    all.push(...s.drainEvents());
  }
  return all;
}

describe('Arcade Shift session', () => {
  it('plays a complete loop: countdown, pickup, delivery, time award, shift end, rank', async () => {
    const R = await getRapier();
    const s = new Session(R, model, { mode: 'arcade', taxi: 'breaker', seed: 1234, traffic: 'off', hub: 0 });
    expect(s.clock).toBe(60);
    expect(s.fares.candidates.length).toBeGreaterThanOrEqual(5);
    const ev = runAuto(s, 400);
    const types = ev.map((e) => e.type);
    expect(types).toContain('go');
    expect(types).toContain('pickup');
    expect(types).toContain('delivered');
    expect(types).toContain('bark');
    expect(types[types.length - 1]).toBe('finished');
    const pickup = ev.find((e) => e.type === 'pickup') as Extract<SessionEvent, { type: 'pickup' }>;
    expect(pickup.advance).toBeGreaterThan(5);
    const delivered = ev.filter((e) => e.type === 'delivered') as Extract<SessionEvent, { type: 'delivered' }>[];
    for (const d of delivered) {
      const r = d.result;
      expect(r.total).toBe(r.base + r.timeBonus + r.tips + r.accuracy + r.discovery + r.prefBonus);
      expect(r.timeAward).toBeLessThanOrEqual(6);
    }
    expect(ev.some((e) => e.type === 'time' && e.delta > 0)).toBe(true);
    const r = s.result!;
    expect(r.completed).toBe(true);
    expect(r.deliveries).toBe(delivered.length);
    expect(r.deliveries).toBeGreaterThanOrEqual(1);
    expect(r.score).toBeGreaterThan(500);
    expect(['S', 'A', 'B', 'C', 'D']).toContain(r.rank);
    expect(r.score).toBe(r.fares + r.tips + r.timeBonus + r.bonuses + r.style - r.penalties);
    expect(r.duration).toBeGreaterThan(60);
    s.dispose();
  });

  it('is deterministic: same seed and inputs give identical state hashes', async () => {
    const R = await getRapier();
    const make = (seed: number) => new Session(R, model, { mode: 'arcade', taxi: 'gull', seed, traffic: 'medium', hub: 2 });
    const a = make(99), b = make(99), c = make(100);
    const apA = new Autopilot(), apB = new Autopilot();
    const hashes: number[] = [];
    for (let i = 0; i < 60 * 45; i++) {
      a.step(apA.drive(a));
      b.step(apB.drive(b));
      if (i % 300 === 0) { expect(a.hash()).toBe(b.hash()); hashes.push(a.hash()); }
    }
    expect(a.hash()).toBe(b.hash());
    expect(a.score).toBe(b.score);
    expect(new Set(hashes).size).toBeGreaterThan(3);
    const sig = (s: Session) => s.traffic.agents.map((t) => `${t.lane}:${t.type}`).join();
    expect(sig(c)).not.toBe(sig(make(99)));
    a.dispose(); b.dispose(); c.dispose();
  });

  it('ends when the clock runs out and awards nothing while idle', async () => {
    const R = await getRapier();
    const s = new Session(R, model, { mode: 'arcade', taxi: 'tempest', seed: 5, traffic: 'low', hub: 1 });
    let steps = 0;
    while (s.phase !== 'ended' && steps++ < 60 * 80) { s.step(NEUTRAL_INPUT); s.drainEvents(); }
    expect(s.phase).toBe('ended');
    expect(steps / 60).toBeGreaterThan(62);
    expect(steps / 60).toBeLessThan(66);
    expect(s.result!.score).toBe(0);
    expect(s.result!.rank).toBe('D');
    expect(s.result!.deliveries).toBe(0);
    s.dispose();
  });

  it('manual reset relocates to a road with a time and score penalty', async () => {
    const R = await getRapier();
    const s = new Session(R, model, { mode: 'arcade', taxi: 'breaker', seed: 3, traffic: 'off', hub: 0 });
    const hold: InputFrame = { ...NEUTRAL_INPUT, reset: true };
    for (let i = 0; i < 60 * 4; i++) s.step(NEUTRAL_INPUT);
    const before = s.clock;
    const ev: SessionEvent[] = [];
    for (let i = 0; i < 60; i++) { s.step(hold); ev.push(...s.drainEvents()); }
    expect(ev.some((e) => e.type === 'respawn')).toBe(true);
    expect(s.clock).toBeLessThan(before - 3.5);
    expect(s.penalties).toBe(200);
    expect(s.vehicle.up.y).toBeGreaterThan(0.95);
    expect(['asphalt', 'cobble']).toContain(model.surfaceAt(s.vehicle.pos.x, s.vehicle.pos.z));
    s.dispose();
  });

  it('Quick Shift never extends the clock', async () => {
    const R = await getRapier();
    const s = new Session(R, model, { mode: 'quick', taxi: 'breaker', seed: 11, traffic: 'off', hub: 0 });
    expect(s.clock).toBe(300);
    const ev = runAuto(s, 120);
    expect(ev.some((e) => e.type === 'pickup')).toBe(true);
    expect(ev.some((e) => e.type === 'time' && e.delta > 0)).toBe(false);
    expect(s.clock).toBeLessThan(300 - 100);
    s.dispose();
  });
});

describe('Time Trial', () => {
  it('uses a fixed, repeatable passenger chain with par-based medal times', async () => {
    const R = await getRapier();
    const make = () => new Session(R, model, { mode: 'trial', taxi: 'breaker', seed: 7771, traffic: 'medium', trial: 0 });
    const a = make(), b = make();
    expect(a.fares.candidates.length).toBe(1);
    expect(a.fares.candidates[0].site).toBe(TRIALS[0].chain[0][0]);
    expect(a.fares.candidates[0].dest).toBe(TRIALS[0].chain[0][1]);
    expect(a.medalTimes).toEqual(b.medalTimes);
    expect(a.medalTimes![0]).toBeLessThan(a.medalTimes![1]);
    expect(a.medalTimes![1]).toBeLessThan(a.medalTimes![2]);
    const sig = (s: Session) => s.traffic.agents.map((t) => `${t.lane}:${t.s.toFixed(2)}`).join();
    expect(sig(a)).toBe(sig(b));
    const ev = runAuto(a, 420);
    expect(a.phase).toBe('ended');
    const picks = ev.filter((e) => e.type === 'pickup') as Extract<SessionEvent, { type: 'pickup' }>[];
    expect(picks.map((p) => [p.cand.site, p.cand.dest])).toEqual(TRIALS[0].chain.slice(0, picks.length));
    expect(a.result!.deliveries + a.result!.failures).toBe(3);
    expect(a.result!.medal).not.toBeNull();
    a.dispose(); b.dispose();
  });
});

describe('Skill School', () => {
  it('advances lessons from the same typed events the score system uses', async () => {
    const R = await getRapier();
    const s = new Session(R, model, { mode: 'school', taxi: 'breaker', seed: 4242, traffic: 'off', hub: 0 });
    expect(LESSONS.length).toBe(10);
    expect(s.hasClock).toBe(false);
    expect(s.lesson!.id).toBe('accel');
    for (let i = 0; i < 60 * 14 && s.lessonIndex === 0; i++) s.step({ ...NEUTRAL_INPUT, throttle: 1 });
    expect(s.lessonIndex).toBe(1);
    expect(s.lesson!.id).toBe('brake');
    for (let i = 0; i < 60 * 10 && s.lessonIndex === 1; i++) s.step({ ...NEUTRAL_INPUT, brake: 1 });
    expect(s.lessonIndex).toBe(2);
    // Surge Start: brake at a standstill, release, then throttle inside the window.
    for (let i = 0; i < 40; i++) s.step(NEUTRAL_INPUT);
    for (let i = 0; i < 4; i++) s.step({ ...NEUTRAL_INPUT, brake: 1 });
    for (let i = 0; i < 4; i++) s.step(NEUTRAL_INPUT);
    for (let i = 0; i < 4; i++) s.step({ ...NEUTRAL_INPUT, throttle: 1 });
    expect(s.lessonIndex).toBe(3);
    s.dispose();
  });
});

describe('Traffic soak', () => {
  it('keeps the requested population in lanes, on the surface and out of buildings for two minutes', async () => {
    const R = await getRapier();
    const s = new Session(R, model, { mode: 'quick', taxi: 'breaker', seed: 2024, traffic: 'high', hub: 1 });
    expect(s.traffic.agents.length).toBe(DENSITY_COUNTS.high);
    let stopped = 0;
    const t0 = performance.now();
    for (let i = 0; i < 60 * 120; i++) {
      s.step(NEUTRAL_INPUT);
      s.drainEvents();
      if (i % 120 !== 0) continue;
      for (const a of s.traffic.agents) {
        expect(Number.isFinite(a.x + a.y + a.z)).toBe(true);
        if (a.state !== 'lane' && a.state !== 'cross') continue;
        expect(a.y).toBeGreaterThan(model.heightAt(a.x, a.z) - 0.5);
        expect(model.pointInBuilding(a.x, a.z, 0)).toBe(false);
        if (a.state === 'lane' && a.speed < 0.3) stopped++;
      }
    }
    const ms = (performance.now() - t0) / (60 * 120);
    console.log('traffic soak: ms per sim step', ms.toFixed(3), 'stopped-vehicle samples', stopped);
    expect(stopped).toBeGreaterThan(5); // vehicles do queue at signals
    expect(ms).toBeLessThan(4); // physics + traffic budget from the brief
    expect(s.traffic.agents.filter((a) => a.state === 'lane' || a.state === 'cross').length).toBeGreaterThan(DENSITY_COUNTS.high * 0.8);
    s.dispose();
  });
});

describe('Route pickups', () => {
  it('are collected once, never respawn, and Clock sparks are capped per shift', async () => {
    const R = await getRapier();
    const s = new Session(R, model, { mode: 'arcade', taxi: 'breaker', seed: 8, traffic: 'off', hub: 0 });
    for (let i = 0; i < 60 * 4; i++) s.step(NEUTRAL_INPUT); // countdown
    s.drainEvents();
    const tokens = s.pickups.filter((p) => p.kind === 'tailwind');
    const sparks = s.pickups.filter((p) => p.kind === 'clock');
    expect(tokens.length).toBeGreaterThanOrEqual(10);
    expect(sparks.length).toBe(3);
    const visit = (p: { x: number; y: number; z: number }): SessionEvent[] => {
      s.vehicle.setPose({ x: p.x, y: p.y - 1.5, z: p.z, yaw: 0 });
      const ev: SessionEvent[] = [];
      for (let i = 0; i < 3; i++) { s.step(NEUTRAL_INPUT); ev.push(...s.drainEvents()); }
      return ev.filter((e) => e.type === 'token');
    };
    const before = s.vehicle.tailwind;
    expect(visit(tokens[0]).length).toBe(1);
    expect(s.vehicle.tailwind).toBeGreaterThan(before);
    expect(tokens[0].taken).toBe(true);
    expect(visit(tokens[0]).length).toBe(0); // circling back gives nothing
    const clock = s.clock;
    expect(visit(sparks[0]).length).toBe(1);
    expect(s.clock).toBeGreaterThan(clock + 0.8);
    expect(visit(sparks[0]).length).toBe(0);
    expect(s.sparksTaken).toBe(1);
    s.dispose();
  });
});
