import { describe, expect, it } from 'vitest';
import { Sim, IDLE, type GameEvent } from '../src/sim/sim';
import { getWorld } from '../src/sim/world';
import { createVehicle, stepVehicle, type VehicleEvent } from '../src/sim/vehicle';
import { TAXIS } from '../src/sim/data';
import { STEP } from '../src/sim/rules';

const world = getWorld();

function ready(seed = 1) {
  const sim = new Sim({ seed, mode: 'arcade', traffic: 'calm' });
  for (let i = 0; i < 60 * 4; i++) sim.step(IDLE);
  sim.drain();
  sim.traffic.agents.length = 0;
  sim.traffic.target = 0;
  return sim;
}
function styles(sim: Sim, frames: number, drive: (i: number) => void): string[] {
  const out: string[] = [];
  for (let i = 0; i < frames; i++) {
    drive(i);
    sim.step(IDLE);
    for (const e of sim.drain() as GameEvent[]) if (e.type === 'style') out.push(e.category);
  }
  return out;
}

describe('style detectors fire only under their specified conditions', () => {
  it('Oncoming: wrong lane of a marked boulevard at speed scores; the right lane and plain streets do not', () => {
    // vertical boulevard x=440 (index 4). Southbound (+z) keeps to the west side (x < 440).
    const wrong = ready();
    const a = styles(wrong, 60 * 3, () => { const v = wrong.vehicle; v.x = v.px = 445; v.z += 0; v.h = 0; v.vx = 0; v.vz = 24; v.z = v.pz = 120 + (v.z % 300 > 0 ? 0 : 0); });
    // vehicle teleports back to x=445 each frame but z advances through its own velocity integration
    expect(a).toContain('oncoming');
    const right = ready();
    const b = styles(right, 60 * 3, () => { const v = right.vehicle; v.x = v.px = 435; v.h = 0; v.vx = 0; v.vz = 24; });
    expect(b).not.toContain('oncoming');
    const plain = ready();
    const c = styles(plain, 60 * 3, () => { const v = plain.vehicle; v.x = v.px = 335; v.h = 0; v.vx = 0; v.vz = 24; });
    expect(c).not.toContain('oncoming'); // x=330 column is a plain two-way street
    const slow = ready();
    const d = styles(slow, 60 * 3, () => { const v = slow.vehicle; v.x = v.px = 445; v.h = 0; v.vx = 0; v.vz = 8; });
    expect(d).not.toContain('oncoming');
  });

  it('Clean Sector: 10 s above 60 km/h with a passenger and no collision; a collision restarts the count', () => {
    const sim = ready(2);
    const f = sim.fares.candidates[0];
    const v = sim.vehicle;
    v.x = v.px = f.pickup.x; v.z = v.pz = f.pickup.z;
    for (let i = 0; i < 4; i++) sim.step(IDLE);
    expect(sim.trip).not.toBeNull();
    sim.drain();
    // cruise through open air on the quay deck road (z=630 boulevard, heading east)
    const cruise = (frames: number) => styles(sim, frames, () => { v.x = v.px = 100 + ((sim.time * 20) % 600); v.z = v.pz = 636; v.h = Math.PI / 2; v.vx = 20; v.vz = 0; });
    const early = cruise(60 * 8);
    expect(early).not.toContain('clean');
    const later = cruise(60 * 3);
    expect(later).toContain('clean');
    // a collision resets it
    sim.trip!.cleanSector = 9;
    sim['onCollision'](10, 'building', v.x, v.z);
    expect(sim.trip!.cleanSector).toBe(0);
  });

  it('Airtime: a real ramp jump produces takeoff + landing with airtime above the scoring threshold; flat driving never does', () => {
    const r = world.ramps[0];
    const spec = TAXIS.breaker;
    const veh = createVehicle(r.x - r.dx * 30, r.z - r.dz * 30, Math.atan2(r.dx, r.dz));
    veh.vx = r.dx * 30; veh.vz = r.dz * 30;
    const ev: VehicleEvent[] = [];
    for (let t = 0; t < 4; t += STEP) stepVehicle(veh, spec, { throttle: 0.3, brake: 0, steer: 0, handbrake: false, boost: false }, STEP, world, false, ev);
    const take = ev.find((e) => e.type === 'takeoff');
    const land = ev.find((e) => e.type === 'landing');
    expect(take).toBeTruthy();
    expect(land && land.type === 'landing' && land.airTime).toBeGreaterThan(0.35);
    // flat road: no takeoff
    const flat = createVehicle(440 - 4, 100, 0);
    flat.vz = 30;
    const ev2: VehicleEvent[] = [];
    for (let t = 0; t < 3; t += STEP) stepVehicle(flat, spec, { throttle: 1, brake: 0, steer: 0, handbrake: false, boost: false }, STEP, world, false, ev2);
    expect(ev2.some((e) => e.type === 'takeoff')).toBe(false);
  });

  it('Precision stop: a centred low-speed arrival pays the accuracy bonus; a sloppy one pays less', () => {
    const play = (offset: number) => {
      const sim = ready(3);
      const f = sim.fares.candidates[0];
      const v = sim.vehicle;
      v.x = v.px = f.pickup.x; v.z = v.pz = f.pickup.z;
      for (let i = 0; i < 4; i++) sim.step(IDLE);
      v.x = v.px = f.dest.x + offset; v.z = v.pz = f.dest.z;
      v.vx = v.vz = 0;
      let bonus = -1;
      for (let i = 0; i < 4; i++) { sim.step(IDLE); for (const e of sim.drain()) if (e.type === 'delivered') bonus = e.breakdown.accuracy; }
      return bonus;
    };
    expect(play(0.5)).toBe(250);
    expect(play(6)).toBeLessThan(250);
  });

  it('upright recovery: a taxi flung at a building at speed bounces back and remains controllable', () => {
    const sim = ready(4);
    sim.traffic.agents.length = 0;
    // face a building from the road
    const b = world.blocks.find((x) => x.kind === 'B')!;
    const v = sim.vehicle;
    v.x = v.px = (b.inner.minX + b.inner.maxX) / 2;
    v.z = v.pz = b.rect.minZ - 6;
    v.h = 0; v.vx = 0; v.vz = 40;
    let hit = false;
    for (let i = 0; i < 120; i++) { sim.step({ ...IDLE, throttle: 1 }); for (const e of sim.drain()) if (e.type === 'collision') hit = true; }
    expect(hit).toBe(true);
    expect(Math.abs(v.yawRate)).toBeLessThan(3);
    expect(world.hitTest(v.x, v.z, 1)).toBeNull();
  });
});
