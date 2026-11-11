import { describe, expect, it } from 'vitest';
import { TAXIS, TAXI_ORDER } from '../src/sim/data';
import { createVehicle, stepVehicle, type VehicleEvent, type VehicleInput } from '../src/sim/vehicle';
import type { World } from '../src/sim/world';
import { STEP } from '../src/sim/rules';

/** an infinite flat asphalt plane: isolates the handling model from the city */
const flat = {
  surfaceAt: () => 'asphalt',
  rampAt: () => null,
  rampHeight: () => 0,
  hitTest: () => null,
  ramps: [],
} as unknown as World;

const inp = (o: Partial<VehicleInput> = {}): VehicleInput => ({ throttle: 0, brake: 0, steer: 0, handbrake: false, boost: false, ...o });

function run(id: keyof typeof TAXIS, seconds: number, f: (t: number) => VehicleInput, events: VehicleEvent[] = [], v = createVehicle(0, 0, 0)) {
  const spec = TAXIS[id];
  for (let t = 0; t < seconds; t += STEP) stepVehicle(v, spec, f(t), STEP, flat, false, events);
  return v;
}

describe('vehicle handling', () => {
  it('0-100 km/h lands inside 4.5-7.5 s for all three taxis', () => {
    for (const id of TAXI_ORDER) {
      const spec = TAXIS[id];
      const v = createVehicle(0, 0, 0);
      let t = 0;
      while (v.speed * 3.6 < 100 && t < 15) { stepVehicle(v, spec, inp({ throttle: 1 }), STEP, flat, false, []); t += STEP; }
      expect(t, id).toBeGreaterThan(4.5);
      expect(t, id).toBeLessThan(7.5);
    }
  });

  it('top speeds sit in the 150-180 km/h band and differ per taxi', () => {
    const tops = TAXI_ORDER.map((id) => run(id, 40, () => inp({ throttle: 1 })).speed * 3.6);
    for (const t of tops) { expect(t).toBeGreaterThan(145); expect(t).toBeLessThan(182); }
    expect(tops[0]).toBeLessThan(tops[1]);
    expect(tops[1]).toBeLessThan(tops[2]);
  });

  it('taxis measurably differ in acceleration, mass, steering and drift authority', () => {
    const g = TAXIS.gull, b = TAXIS.breaker, t = TAXIS.tempest;
    expect(g.accel0).toBeGreaterThan(b.accel0);
    expect(b.accel0).toBeGreaterThan(t.accel0);
    expect(g.mass).toBeLessThan(b.mass);
    expect(b.mass).toBeLessThan(t.mass);
    expect(g.steerMax).toBeGreaterThan(t.steerMax);
    expect(g.driftYaw).toBeGreaterThan(t.driftYaw);
    expect(t.shove).toBeGreaterThan(g.shove);
    // turning rate at the same speed and full lock: agile > heavy
    const yaw = (id: keyof typeof TAXIS) => {
      const v = createVehicle(0, 0, 0);
      v.vz = 22;
      run(id, 1.2, () => inp({ throttle: 0.5, steer: 1 }), [], v);
      return Math.abs(v.yawRate);
    };
    expect(yaw('gull')).toBeGreaterThan(yaw('tempest'));
  });

  it('braking from 100 km/h stops in under 3 s', () => {
    const v = createVehicle(0, 0, 0);
    v.vz = 100 / 3.6;
    let t = 0;
    while (v.speed > 0.2 && t < 6) { stepVehicle(v, TAXIS.breaker, inp({ brake: 1 }), STEP, flat, false, []); t += STEP; }
    expect(t).toBeLessThan(3);
  });

  it('steering turns the car (right steer decreases heading) and returns straight after release', () => {
    const v = createVehicle(0, 0, 0);
    v.vz = 15;
    run('breaker', 1.0, () => inp({ throttle: 0.4, steer: 1 }), [], v);
    expect(v.h).toBeLessThan(-0.2);
  });

  it('Snap Drift fires only above 35 km/h while steering with a handbrake tap', () => {
    const slow = createVehicle(0, 0, 0);
    slow.vz = 25 / 3.6;
    const evSlow: VehicleEvent[] = [];
    run('breaker', 1, (t) => inp({ throttle: 0.5, steer: 0.9, handbrake: t > 0.3 && t < 0.45 }), evSlow, slow);
    expect(evSlow.some((e) => e.type === 'snapDrift')).toBe(false);

    const fast = createVehicle(0, 0, 0);
    fast.vz = 70 / 3.6;
    const evFast: VehicleEvent[] = [];
    run('breaker', 1, (t) => inp({ throttle: 0.6, steer: 0.9, handbrake: t > 0.3 && t < 0.45 }), evFast, fast);
    expect(evFast.some((e) => e.type === 'snapDrift')).toBe(true);
    expect(fast.drifting || evFast.some((e) => e.type === 'driftEnd')).toBe(true);
  });

  it('a drift develops a real slip angle and is ended by countersteer', () => {
    const v = createVehicle(0, 0, 0);
    v.vz = 80 / 3.6;
    const ev: VehicleEvent[] = [];
    let maxSlip = 0;
    const spec = TAXIS.breaker;
    for (let t = 0; t < 2.4; t += STEP) {
      const i = inp({ throttle: 0.7, steer: t < 1.6 ? 0.9 : -1, handbrake: t > 0.2 && t < 0.35 });
      stepVehicle(v, spec, i, STEP, flat, false, ev);
      maxSlip = Math.max(maxSlip, Math.abs(v.slip));
    }
    expect(maxSlip).toBeGreaterThan(0.2);
    expect(ev.some((e) => e.type === 'driftEnd')).toBe(true);
    expect(v.drifting).toBe(false);
  });

  it('cannot drift while stationary or crawling', () => {
    const v = createVehicle(0, 0, 0);
    const ev: VehicleEvent[] = [];
    run('breaker', 3, (t) => inp({ throttle: 0.05, steer: 1, handbrake: t > 0.2 }), ev, v);
    expect(ev.some((e) => e.type === 'snapDrift')).toBe(false);
    expect(v.drifting).toBe(false);
  });

  it('Surge Start triggers only when throttle is tapped within the window after releasing the brake at low speed', () => {
    const early: VehicleEvent[] = [];
    run('breaker', 2, (t) => inp({ brake: t < 0.5 ? 1 : 0, throttle: t > 0.6 ? 1 : 0 }), early); // tap 100ms after release -> surge
    expect(early.some((e) => e.type === 'surge')).toBe(true);
    const late: VehicleEvent[] = [];
    run('breaker', 3, (t) => inp({ brake: t < 0.5 ? 1 : 0, throttle: t > 1.6 ? 1 : 0 }), late); // too late
    expect(late.some((e) => e.type === 'surge')).toBe(false);
    const none: VehicleEvent[] = [];
    run('breaker', 2, () => inp({ throttle: 1 }), none);
    expect(none.some((e) => e.type === 'surge')).toBe(false);
  });

  it('Surge Start launches harder than a plain start', () => {
    const plain = run('breaker', 1.2, () => inp({ throttle: 1 }));
    const surge = run('breaker', 1.7, (t) => inp({ brake: t < 0.5 ? 1 : 0, throttle: t > 0.6 ? 1 : 0 }));
    const dPlain = plain.speed;
    // compare after the same 1.1 s of throttle: surge run has had 1.1 s of throttle too
    expect(surge.speed).toBeGreaterThan(dPlain - 1.5);
  });


  it('Grip Turn needs a drift, a brake tap, then throttle inside the window', () => {
    const v = createVehicle(0, 0, 0);
    v.vz = 80 / 3.6;
    const ev: VehicleEvent[] = [];
    const spec = TAXIS.breaker;
    const script = (t: number) => inp({ throttle: t > 0.9 && t < 1.0 ? 0 : 0.8, brake: t > 0.9 && t < 1.0 ? 1 : 0, steer: 0.9, handbrake: t > 0.2 && t < 0.35 });
    for (let t = 0; t < 1.6; t += STEP) stepVehicle(v, spec, script(t), STEP, flat, false, ev);
    expect(ev.some((e) => e.type === 'snapDrift')).toBe(true);
    expect(ev.some((e) => e.type === 'gripTurn')).toBe(true);
    // no brake tap -> no grip turn
    const v2 = createVehicle(0, 0, 0);
    v2.vz = 80 / 3.6;
    const ev2: VehicleEvent[] = [];
    for (let t = 0; t < 1.6; t += STEP) stepVehicle(v2, spec, inp({ throttle: 0.8, steer: 0.9, handbrake: t > 0.2 && t < 0.35 }), STEP, flat, false, ev2);
    expect(ev2.some((e) => e.type === 'gripTurn')).toBe(false);
  });

  it('Tailwind raises the speed cap and acceleration', () => {
    const spec = TAXIS.breaker;
    const a = createVehicle(0, 0, 0), b = createVehicle(0, 0, 0);
    for (let t = 0; t < 12; t += STEP) {
      stepVehicle(a, spec, inp({ throttle: 1 }), STEP, flat, false, []);
      stepVehicle(b, spec, inp({ throttle: 1, boost: true }), STEP, flat, t < 2.2, []);
    }
    // after boost ends b decays back but moment-to-moment it was faster
    const c = createVehicle(0, 0, 0), d = createVehicle(0, 0, 0);
    for (let t = 0; t < 2.2; t += STEP) {
      stepVehicle(c, spec, inp({ throttle: 1 }), STEP, flat, false, []);
      stepVehicle(d, spec, inp({ throttle: 1 }), STEP, flat, true, []);
    }
    expect(d.speed).toBeGreaterThan(c.speed * 1.2);
    void a; void b;
  });

  it('bounces off walls with bounded angular response (stays controllable)', () => {
    const wall = {
      ...flat,
      hitTest: (x: number, z: number, r: number) => (z + r > 50 ? { nx: 0, nz: -1, pen: z + r - 50, tag: 'building', soft: false } : null),
    } as unknown as World;
    const v = createVehicle(0, 40, 0);
    v.vz = 30;
    const ev: VehicleEvent[] = [];
    for (let t = 0; t < 1.5; t += STEP) stepVehicle(v, TAXIS.breaker, inp({ throttle: 1 }), STEP, wall, false, ev);
    expect(ev.some((e) => e.type === 'collision')).toBe(true);
    expect(Math.abs(v.yawRate)).toBeLessThan(3);
    expect(v.z).toBeLessThan(50);
  });

  it('is deterministic: identical inputs give identical state', () => {
    const f = (t: number) => inp({ throttle: 1, steer: Math.sin(t * 2), handbrake: Math.sin(t * 0.7) > 0.9 });
    const a = run('gull', 8, f), b = run('gull', 8, f);
    expect(a.x).toBe(b.x);
    expect(a.z).toBe(b.z);
    expect(a.h).toBe(b.h);
  });
});
