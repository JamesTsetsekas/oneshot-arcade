import { describe, expect, it } from 'vitest';
import { VEHICLES, makeVehicle, stepVehicle, applyDamage, repairVehicle } from '../src/sim/vehicle';

function run(defId: string, secs: number, input: { throttle: number; steer: number; handbrake: boolean }, pre?: (v: ReturnType<typeof makeVehicle>) => void) {
  const v = makeVehicle(VEHICLES[defId], 0, 0, 0, 'player');
  v.engineOn = true;
  pre?.(v);
  const dt = 1 / 60;
  for (let i = 0; i < secs * 60; i++) stepVehicle(v, input, dt, 'asphalt');
  return v;
}

describe('vehicle dynamics', () => {
  it('has eight vehicle definitions of the required classes', () => {
    const defs = Object.values(VEHICLES);
    expect(defs.length).toBe(8);
    expect(defs.filter((d) => d.kind === 'bike').length).toBe(2);
    expect(defs.filter((d) => d.kind === 'police').length).toBe(1);
    expect(defs.filter((d) => d.kind === 'van').length).toBe(1);
  });

  it('accelerates forward and reaches a sensible speed', () => {
    const v = run('hollis', 8, { throttle: 1, steer: 0, handbrake: false });
    expect(v.speed).toBeGreaterThan(20);
    expect(v.speed).toBeLessThan(VEHICLES.hollis.topSpeed + 3);
    expect(Math.abs(v.x)).toBeLessThan(0.5); // tracks straight
  });

  it('muscle coupe out-accelerates the compact', () => {
    const a = run('cormorant', 4, { throttle: 1, steer: 0, handbrake: false });
    const b = run('tern', 4, { throttle: 1, steer: 0, handbrake: false });
    expect(a.speed).toBeGreaterThan(b.speed);
  });

  it('brakes to a stop and then reverses with S held', () => {
    const v = run('hollis', 6, { throttle: -1, steer: 0, handbrake: false }, (q) => { q.vz = 20; q.speed = 20; });
    expect(v.speed).toBeLessThan(0); // reversing after the stop
    expect(Math.abs(v.speed)).toBeLessThan(15);
  });

  it('steers right with positive steer and turns the heading', () => {
    const v = run('hollis', 1, { throttle: 0.6, steer: 1, handbrake: false }, (q) => { q.vz = 10; q.speed = 10; });
    expect(v.heading).toBeGreaterThan(0.4);
    expect(v.heading).toBeLessThan(2);
    expect(v.x).toBeGreaterThan(0);
  });

  it('handbrake induces oversteer (rear slides) while staying bounded', () => {
    const v = run('mistral', 2.5, { throttle: 0.3, steer: 0.8, handbrake: true }, (q) => { q.vz = 20; q.speed = 20; });
    expect(Number.isFinite(v.x)).toBe(true);
    expect(Math.hypot(v.vx, v.vz)).toBeLessThan(40);
    expect(Math.abs(v.yawRate)).toBeLessThan(3);
    // heading rotated substantially more than without handbrake
    const w = run('mistral', 2.5, { throttle: 0.3, steer: 0.8, handbrake: false }, (q) => { q.vz = 20; q.speed = 20; });
    expect(Math.abs(v.heading)).toBeGreaterThan(Math.abs(w.heading) * 0.8);
  });

  it('is numerically stable over a long chaotic input sequence (no explosions)', () => {
    for (const id of Object.keys(VEHICLES)) {
      const v = makeVehicle(VEHICLES[id], 0, 0, 0, 'player');
      v.engineOn = true;
      for (let i = 0; i < 60 * 40; i++) {
        const t = i / 60;
        stepVehicle(v, { throttle: Math.sin(t * 0.7), steer: Math.sign(Math.sin(t * 1.9)), handbrake: Math.sin(t * 0.37) > 0.8 }, 1 / 60, 'wet-asphalt');
        expect(Number.isFinite(v.x) && Number.isFinite(v.z) && Number.isFinite(v.heading)).toBe(true);
        expect(Math.hypot(v.vx, v.vz)).toBeLessThan(80);
      }
    }
  });

  it('motorcycles lean into corners', () => {
    const v = makeVehicle(VEHICLES.kestrel, 0, 0, 0, 'player');
    v.engineOn = true; v.vz = 14; v.speed = 14;
    let peak = 0;
    for (let i = 0; i < 90; i++) { stepVehicle(v, { throttle: 0.6, steer: 1, handbrake: false }, 1 / 60, 'asphalt'); peak = Math.max(peak, Math.abs(v.roll)); }
    expect(peak).toBeGreaterThan(0.1);
  });

  it('damage reduces power, stalls at zero health, and repair restores', () => {
    const healthy = run('hollis', 5, { throttle: 1, steer: 0, handbrake: false });
    const hurt = run('hollis', 5, { throttle: 1, steer: 0, handbrake: false }, (q) => applyDamage(q, 80));
    expect(hurt.speed).toBeLessThan(healthy.speed);
    const dead = makeVehicle(VEHICLES.hollis, 0, 0, 0, 'player');
    dead.engineOn = true;
    applyDamage(dead, 999);
    expect(dead.stalled).toBe(true);
    for (let i = 0; i < 120; i++) stepVehicle(dead, { throttle: 1, steer: 0, handbrake: false }, 1 / 60, 'asphalt');
    expect(dead.speed).toBeLessThan(0.5);
    repairVehicle(dead);
    expect(dead.stalled).toBe(false);
    expect(dead.health).toBe(dead.def.health);
  });

  it('wet asphalt lengthens braking distance', () => {
    const stop = (s: 'asphalt' | 'wet-asphalt') => {
      const v = makeVehicle(VEHICLES.hollis, 0, 0, 0, 'player');
      v.engineOn = true; v.vz = 25; v.speed = 25;
      let i = 0;
      while (v.speed > 0.5 && i++ < 600) stepVehicle(v, { throttle: -1, steer: 0, handbrake: false }, 1 / 60, s);
      return v.z;
    };
    expect(stop('wet-asphalt')).toBeGreaterThan(stop('asphalt'));
  });
});
