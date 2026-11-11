import { describe, it, expect, beforeAll } from 'vitest';
import { Physics } from '../src/physics/physics';
import { VehicleSystem, Vehicle } from '../src/vehicles/vehicle';
import { VEHICLES, VEHICLE_IDS } from '../src/vehicles/specs';
import { Bus } from '../src/core/events';
import { terrainH } from '../src/world/district';

let phys: Physics, sys: VehicleSystem, bus: Bus;
beforeAll(async () => { phys = await Physics.create(); bus = new Bus(); sys = new VehicleSystem(phys, bus); });

function run(seconds: number, each?: (t: number) => void) {
  const n = Math.round(seconds * 60);
  for (let i = 0; i < n; i++) { each?.(i / 60); sys.preStep(); phys.step(); sys.postStep(); }
}
function fresh(type: string, x = -120, z = -304, yaw = Math.PI / 2): Vehicle {
  for (const v of [...sys.list]) sys.remove(v);
  const v = sys.spawn(type, x, z, yaw);
  v.driver = 'mission';
  run(1.0);
  return v;
}
const finite = (v: Vehicle) => [v.x, v.y, v.z, v.speed, v.q.w].every(Number.isFinite);

describe('vehicle dynamics (all eight vehicles)', () => {
  for (const id of VEHICLE_IDS) {
    it(`${id}: settles, accelerates, brakes and stays upright`, () => {
      const v = fresh(id);
      expect(finite(v)).toBe(true);
      expect(Math.abs(v.y - terrainH(v.x, v.z))).toBeLessThan(0.12); // rests at ride height
      expect(v.groundedWheels).toBe(4);
      v.ctl.throttle = 1;
      run(5);
      const v5 = v.speed;
      expect(v5).toBeGreaterThan(VEHICLES[id].cls === 'van' ? 12 : 15);
      expect(v5).toBeLessThan(VEHICLES[id].topSpeed + 1);
      expect(Math.abs(v.z - -304)).toBeLessThan(1.2); // tracks straight along Breakwater Drive
      v.ctl.throttle = 0; v.ctl.brake = 1;
      const x0 = v.x;
      run(4);
      expect(Math.abs(v.speed)).toBeLessThan(0.3);
      const stopDist = v.x - x0;
      console.log(id, 'v@5s', v5.toFixed(1), 'stop', stopDist.toFixed(1), 'restY', (v.y - terrainH(v.x, v.z)).toFixed(3));
      expect(stopDist).toBeLessThan(v5 * v5 / (2 * 6)); // at least ~0.6 g of braking
      expect(v.upY).toBeGreaterThan(0.97);
      expect(finite(v)).toBe(true);
    });
  }

  it('cars steer, hold a corner without rolling, and the handbrake breaks rear grip', () => {
    const v = fresh('tern');
    v.ctl.throttle = 0.6;
    run(3);
    const yaw0 = v.yaw;
    v.ctl.steer = 1; v.ctl.throttle = 0.4;
    run(1.2);
    expect(v.yaw - yaw0).toBeGreaterThan(0.25); // positive steer turns toward +yaw (right)
    expect(v.upY).toBeGreaterThan(0.93);
    // handbrake turn
    const v2 = fresh('cutlass');
    v2.ctl.throttle = 1; run(3.2);
    v2.ctl.throttle = 0; v2.ctl.steer = 1; v2.ctl.handbrake = true;
    let maxSlip = 0;
    run(1.0, () => { maxSlip = Math.max(maxSlip, Math.abs(Math.atan2(v2.sideSpeed, Math.abs(v2.speed) + 0.1))); });
    expect(maxSlip).toBeGreaterThan(0.2);
    v2.ctl.handbrake = false; v2.ctl.steer = 0; v2.ctl.brake = 1;
    run(3);
    expect(v2.upY).toBeGreaterThan(0.9);
    expect(Math.abs(v2.speed)).toBeLessThan(0.5);
  });

  it('reverse gear works', () => {
    const v = fresh('dart');
    v.ctl.throttle = 1; v.ctl.reverse = true;
    run(2.5);
    expect(v.speed).toBeLessThan(-3);
    expect(v.speed).toBeGreaterThan(-10);
  });

  it('motorcycles stay balanced through hard steering', () => {
    for (const id of ['swift', 'sirocco']) {
      const v = fresh(id);
      v.ctl.throttle = 1; run(2.5);
      let minUp = 1;
      v.ctl.steer = 1; run(0.8, () => { minUp = Math.min(minUp, v.upY); });
      v.ctl.steer = -1; run(0.8, () => { minUp = Math.min(minUp, v.upY); });
      expect(minUp).toBeGreaterThan(0.9);
      expect(finite(v)).toBe(true);
    }
  });

  it('collisions damage the engine and can stall it; repair restores it', () => {
    const v = fresh('coaster', -120, -304, 0); // facing north into the buildings across the road
    const impacts: number[] = [];
    const off = bus.on('vehicleImpact', (e) => impacts.push(e.dv));
    v.ctl.throttle = 1;
    run(6);
    off();
    expect(impacts.length).toBeGreaterThan(0);
    expect(v.engine).toBeLessThan(100);
    v.damage(200, 'front');
    expect(v.stalled).toBe(true);
    v.repair();
    expect(v.stalled).toBe(false); expect(v.engine).toBe(100);
    expect(finite(v)).toBe(true);
  });

  it('parks on Lantern Hill without rolling and sleeps when empty', () => {
    const v = fresh('tern', 284, 180, 0);
    v.driver = 'none';
    const z0 = v.z;
    run(4);
    expect(Math.abs(v.z - z0)).toBeLessThan(0.6);
    expect(v.asleep).toBe(true);
  });

  it('climbs the hill road and survives the crest at speed', () => {
    const v = fresh('warden', 284, 110, 0);
    v.ctl.throttle = 1;
    let maxY = -99;
    run(9, () => { maxY = Math.max(maxY, v.y); });
    expect(maxY).toBeGreaterThan(20);
    expect(finite(v)).toBe(true);
    expect(v.upY).toBeGreaterThan(0.5);
  });
});
