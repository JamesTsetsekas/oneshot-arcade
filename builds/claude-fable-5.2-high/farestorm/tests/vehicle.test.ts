import { describe, it, expect, beforeAll } from 'vitest';
import { getRapier, getModel } from './helpers';
import { PhysicsWorld } from '../src/physics/physicsWorld';
import { Vehicle, NEUTRAL_INPUT, InputFrame, BOOST_DURATION, SURGE_WINDOW } from '../src/vehicle/vehicle';
import { TAXIS, TAXI_ORDER, TaxiId } from '../src/vehicle/taxiSpecs';
import { wrapAngle, clamp } from '../src/core/math';

let phys: PhysicsWorld;
const model = getModel();
const START = { x: 100, z: 152.7, yaw: Math.PI / 2 }; // Harbor boulevard, heading east

function spawn(id: TaxiId, x = START.x, z = START.z, yaw = START.yaw, v0 = 0): Vehicle {
  const v = new Vehicle(phys, TAXIS[id], { x, z, y: model.heightAt(x, z), yaw });
  if (v0) v.body.setLinvel({ x: Math.sin(yaw) * v0, y: 0, z: Math.cos(yaw) * v0 }, true);
  return v;
}
function step(v: Vehicle, input: Partial<InputFrame>, n = 1): string[] {
  const types: string[] = [];
  for (let i = 0; i < n; i++) {
    const f = { ...NEUTRAL_INPUT, ...input };
    v.preStep(f); phys.step(); v.postStep(f);
    for (const e of v.drainEvents()) types.push(e.type);
  }
  return types;
}
function done(v: Vehicle): void {
  phys.world.removeRigidBody(v.body);
}

describe('taxi handling', () => {
  beforeAll(async () => {
    phys = new PhysicsWorld(await getRapier(), model);
  });

  const telemetry: Record<string, { t100: number; top: number; brake: number }> = {};
  it('meets the acceleration, top speed and braking targets for all three cabs', () => {
    for (const id of TAXI_ORDER) {
      const v = spawn(id);
      let t100 = -1, top = 0, minUp = 1;
      for (let i = 0; i < 60 * 22 && v.pos.x < 1230; i++) {
        step(v, { throttle: 1 });
        if (t100 < 0 && v.speedKmh >= 100) t100 = i / 60;
        top = Math.max(top, v.speedKmh);
        minUp = Math.min(minUp, v.up.y);
      }
      const x0 = v.pos.x;
      let n = 0;
      while (v.fwdSpeed > 0.5 && n++ < 600) step(v, { brake: 1 });
      telemetry[id] = { t100, top, brake: v.pos.x - x0 };
      expect(t100, `${id} 0-100`).toBeGreaterThan(4.4);
      expect(t100, `${id} 0-100`).toBeLessThan(7);
      expect(top, `${id} top speed`).toBeGreaterThan(150);
      expect(top, `${id} top speed`).toBeLessThan(182);
      expect(minUp).toBeGreaterThan(0.95);
      expect(v.pos.x - x0, `${id} braking distance`).toBeLessThan(95);
      done(v);
    }
    console.log('taxi telemetry', JSON.stringify(telemetry));
  });

  it('cabs measurably differ without one dominating', () => {
    const { gull, breaker, tempest } = telemetry;
    expect(gull.t100).toBeLessThan(breaker.t100);
    expect(breaker.t100).toBeLessThan(tempest.t100);
    expect(tempest.top).toBeGreaterThan(breaker.top);
    expect(breaker.top).toBeGreaterThan(gull.top);
    expect(TAXIS.tempest.mass).toBeGreaterThan(TAXIS.gull.mass * 1.5);
    expect(TAXIS.gull.steerRate).toBeGreaterThan(TAXIS.tempest.steerRate);
    expect(TAXIS.gull.driftGrip).toBeLessThan(TAXIS.tempest.driftGrip);
  });

  it('stays upright and controllable through a full-lock slalom', () => {
    const v = spawn('breaker');
    let minUp = 1;
    let driftSteps = 0;
    for (let i = 0; i < 60 * 14; i++) {
      // Lane-change slalom: alternate half-lock every 0.9 s around the heading of the boulevard.
      const wobble = Math.floor(i / 54) % 2 ? 0.55 : -0.55;
      step(v, { throttle: 1, steer: clamp(wobble + wrapAngle(Math.PI / 2 - v.yaw) * 1.5 + (152.7 - v.pos.z) * 0.02, -1, 1) });
      minUp = Math.min(minUp, v.up.y);
      if (v.drifting) driftSteps++;
    }
    console.log('slalom: speed', v.speedKmh.toFixed(0), 'km/h, drifting steps', driftSteps, 'z', v.pos.z.toFixed(1));
    expect(minUp).toBeGreaterThan(0.9);
    expect(v.speedKmh).toBeGreaterThan(90);
    expect(driftSteps).toBeLessThan(60); // grip steering alone should not throw the cab into slides
    done(v);
  });

  it('Surge Start only triggers inside the window after releasing the brake at low speed', () => {
    const inside = spawn('breaker');
    step(inside, {}, 30);
    step(inside, { brake: 1 }, 10);
    step(inside, {}, 6); // 0.1 s after release
    expect(step(inside, { throttle: 1 }, 2)).toContain('surge');
    done(inside);
    const late = spawn('breaker');
    step(late, {}, 30);
    step(late, { brake: 1 }, 10);
    step(late, {}, Math.round(SURGE_WINDOW * 60) + 12);
    expect(step(late, { throttle: 1 }, 5)).not.toContain('surge');
    done(late);
    const rolling = spawn('breaker', START.x, START.z, START.yaw, 15);
    step(rolling, { throttle: 1 }, 20);
    step(rolling, { brake: 1 }, 6);
    step(rolling, {}, 3);
    expect(step(rolling, { throttle: 1 }, 5)).not.toContain('surge');
    done(rolling);
  });

  it('Snap Drift needs speed above 35 km/h; a handbrake turn carries all three cabs through a 90 degree corner', () => {
    const slow = spawn('breaker', START.x, START.z, START.yaw, 6);
    expect(step(slow, { throttle: 0.3, steer: -1, handbrake: true }, 30)).not.toContain('driftStart');
    done(slow);
    // Approach the Harbor boulevard / Customs Street junction heading east, turn left (north).
    const n = model.nodes[model.gridNode[0][3]];
    for (const id of TAXI_ORDER) {
      const v = spawn(id, n.x - 80, n.z - 2.7, Math.PI / 2, 22);
      let phase = 0, snap = false, banked = 0, clean = false, hits = 0, entry = 0;
      for (let i = 0; i < 420; i++) {
        const herr = wrapAngle(0 - v.yaw);
        let f: InputFrame;
        if (phase === 0) { if (n.x - v.pos.x < 26) { phase = 1; entry = v.speedKmh; } f = { ...NEUTRAL_INPUT, throttle: 1 }; }
        else if (phase === 1) { if (Math.abs(herr) < 0.6) phase = 2; f = { ...NEUTRAL_INPUT, throttle: 1, steer: -1, handbrake: true }; }
        else f = { ...NEUTRAL_INPUT, throttle: 1, steer: clamp(herr * 2.2 + (n.x - 2.7 - v.pos.x) * 0.06, -1, 1) };
        v.preStep(f); phys.step(); v.postStep(f);
        for (const e of v.drainEvents()) {
          if (e.type === 'driftStart' && e.snap) snap = true;
          if (e.type === 'driftEnd' && e.points > banked) { banked = e.points; clean = e.clean; }
          if (e.type === 'collision' && e.severity > 4) hits++;
        }
      }
      console.log(`corner ${id}: entry ${entry.toFixed(0)} km/h, banked ${banked}, exit ${v.speedKmh.toFixed(0)} km/h at x=${(v.pos.x - n.x).toFixed(1)} z=+${(v.pos.z - n.z).toFixed(0)}`);
      expect(entry, id).toBeGreaterThan(95);
      expect(snap, id).toBe(true);
      expect(clean, id).toBe(true);
      expect(banked, id).toBeGreaterThan(80);
      expect(hits, id).toBe(0);
      expect(Math.abs(wrapAngle(v.yaw)), id).toBeLessThan(0.35); // now heading north
      expect(Math.abs(v.pos.x - n.x), id).toBeLessThan(9); // still on the street
      expect(v.pos.z - n.z, id).toBeGreaterThan(60);
      expect(v.up.y).toBeGreaterThan(0.9);
      done(v);
    }
  });

  it('drift scoring cannot be farmed while stationary or doing donuts', () => {
    const v = spawn('breaker');
    let points = 0;
    for (let i = 0; i < 600; i++) {
      const f = { ...NEUTRAL_INPUT, throttle: 1, brake: i < 200 ? 1 : 0, steer: 1, handbrake: i % 40 < 24 };
      v.preStep(f); phys.step(); v.postStep(f);
      for (const e of v.drainEvents()) if (e.type === 'driftEnd') points += e.points;
    }
    expect(points).toBeLessThan(60);
    done(v);
  });

  it('Grip Turn only fires during a drift', () => {
    const v = spawn('breaker', START.x, START.z, START.yaw, 22);
    step(v, { throttle: 1 }, 5);
    step(v, { brake: 1 }, 2);
    expect(step(v, { throttle: 1 }, 6)).not.toContain('gripTurn');
    step(v, { throttle: 1, steer: -1, handbrake: true }, 16);
    expect(v.drifting).toBe(true);
    step(v, { steer: -1, brake: 1 }, 3);
    expect(step(v, { throttle: 1, steer: -1 }, 4)).toContain('gripTurn');
    done(v);
  });

  it('Tailwind drains within 2.2 s, raises speed, and cannot recharge while active', () => {
    const v = spawn('breaker', START.x, START.z, START.yaw, 30);
    v.tailwind = 1;
    const base = spawn('breaker', START.x, START.z + 4.6, START.yaw, 30);
    let active = 0;
    for (let i = 0; i < 60 * 4; i++) {
      step(v, { throttle: 1, boost: true });
      step(base, { throttle: 1 });
      if (v.boostActive) { active++; v.addTailwind(0.5); }
    }
    expect(active / 60).toBeLessThanOrEqual(BOOST_DURATION + 0.05);
    expect(active / 60).toBeGreaterThan(1.8);
    expect(v.pos.x).toBeGreaterThan(base.pos.x + 4);
    v.tailwind = 0.1; // below the start threshold
    expect(step(v, { throttle: 1, boost: true }, 3)).not.toContain('boostStart');
    done(v);
    done(base);
  });

  it('jump ramps give real airtime and a flat road does not', () => {
    const v = spawn('breaker', 120, 110, Math.PI / 2);
    let air = 0;
    for (let i = 0; i < 480; i++) {
      const f = { ...NEUTRAL_INPUT, throttle: 1, steer: clamp(wrapAngle(Math.PI / 2 - v.yaw) * 2 + (110 - v.pos.z) * 0.05, -1, 1) };
      v.preStep(f); phys.step(); v.postStep(f);
      for (const e of v.drainEvents()) if (e.type === 'air') air = Math.max(air, e.time);
    }
    expect(air).toBeGreaterThan(0.45);
    done(v);
    const flat = spawn('breaker');
    expect(step(flat, { throttle: 1 }, 600)).not.toContain('air');
    done(flat);
  });

  it('the Ferry Leap and Canal Hop are makeable at speed and land upright', () => {
    for (const [x, z, yaw, tx, tz] of [[395, 70, Math.PI / 2, 900, 70], [1050, 300, 0, 1050, 900]]) {
      const v = spawn('breaker', x, z, yaw);
      let air = 0, respawn = false;
      for (let i = 0; i < 620 && !respawn; i++) {
        const f = { ...NEUTRAL_INPUT, throttle: 1, steer: clamp(wrapAngle(Math.atan2(tx - v.pos.x, tz - v.pos.z) - v.yaw) * 2.5, -1, 1) };
        v.preStep(f); phys.step(); v.postStep(f);
        for (const e of v.drainEvents()) if (e.type === 'air') air = Math.max(air, e.time);
        respawn = v.needsRespawn;
        if (air > 0) break;
      }
      expect(respawn).toBe(false);
      expect(air).toBeGreaterThan(0.8);
      expect(v.up.y).toBeGreaterThan(0.85);
      expect(model.heightAt(v.pos.x, v.pos.z)).toBeGreaterThan(2); // landed on the far bank
      done(v);
    }
  });

  it('a wall hit is reported as a collision and the cab recovers upright', () => {
    const b = model.buildings.find((bb) => bb.z > 160 && bb.z < 190 && bb.x > 150 && bb.x < 600 && Math.abs(Math.sin(bb.yaw)) > 0.9)!;
    const v = spawn('tempest', b.x, 152, 0, 0);
    const ev = step(v, { throttle: 1 }, 240);
    expect(ev).toContain('collision');
    step(v, {}, 120);
    expect(v.up.y).toBeGreaterThan(0.9);
    expect(v.damage).toBeGreaterThan(0);
    done(v);
  });

  it('driving into the harbor triggers a respawn request', () => {
    const v = spawn('gull', 300, 125, Math.PI);
    let asked = false;
    for (let i = 0; i < 600 && !asked; i++) { step(v, { throttle: 1 }); asked = v.needsRespawn; }
    expect(asked).toBe(true);
    done(v);
  });
});
