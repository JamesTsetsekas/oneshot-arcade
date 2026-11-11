/**
 * Autopilot used only for automated verification (`?bot=1`): it follows the same guidance the player
 * sees, so end-to-end runs (pickup -> deliver -> results) can be exercised headlessly. Not a game feature.
 */
import { wrapAngle, clamp } from './sim/math';
import type { Sim, SimInput } from './sim/sim';

export class Bot {
  private stuck = 0;
  private reverse = 0;
  private lock: number | null = null;
  private stuckEvents = 0;
  private resetFrames = 0;
  private lastStuckAt = -99;
  next(sim: Sim): SimInput {
    const v = sim.vehicle;
    const out: SimInput = { throttle: 0, brake: 0, steer: 0, handbrake: false, boost: false, resetHeld: false };
    if (sim.phase !== 'running') return out;
    // choose a target
    let tx = v.x, tz = v.z, ring = 3, direct = false;
    const trip = sim.trip;
    let point = null as null | { x: number; z: number; a: number; b: number; ta: number; len: number };
    if (trip) { point = trip.fare.dest.point; tx = trip.fare.dest.x; tz = trip.fare.dest.z; ring = trip.fare.dest.radius * 0.5; }
    else {
      let chosen = sim.fares.candidates.find((f) => f.id === this.lock) ?? null;
      if (!chosen) {
        let best = 1e9;
        for (const f of sim.fares.candidates) {
          const d0 = Math.hypot(f.pickup.x - v.x, f.pickup.z - v.z);
          if (d0 < best) { best = d0; chosen = f; }
        }
        this.lock = chosen ? chosen.id : null;
      }
      if (chosen) { point = chosen.pickup; tx = chosen.pickup.x; tz = chosen.pickup.z; }
      ring = 1.5;
    }
    const d = Math.hypot(tx - v.x, tz - v.z);
    let ax = tx, az = tz;
    if (point && d > 42) {
      const hop = sim.world.nextHop(v.x, v.z, point);
      // keep to the right-hand lane of the road we are travelling along
      const L = Math.hypot(hop.x - v.x, hop.z - v.z) || 1;
      const dx = (hop.x - v.x) / L, dz = (hop.z - v.z) / L;
      const snapX = Math.abs(dx) > Math.abs(dz);
      const rx = snapX ? 0 : -Math.sign(dz), rz = snapX ? Math.sign(dx) : 0;
      ax = hop.x + rx * 4.2; az = hop.z + rz * 4.2;
    } else direct = true;
    const desired = Math.atan2(ax - v.x, az - v.z);
    const err = wrapAngle(desired - v.h);
    out.steer = clamp(-err * 2.4, -1, 1);
    const hopD = Math.hypot(ax - v.x, az - v.z);
    let target = 22;
    if (Math.abs(err) > 0.4) target = 8;
    if (Math.abs(err) > 0.9) target = 5;
    if (!direct && hopD < 40 && Math.abs(err) > 0.2) target = 7;
    if (direct) target = clamp(Math.sqrt(Math.max(0, d - ring)) * 2.6, 0, 22);
    if (direct && d < ring) target = 0;
    const spd = v.fwd;
    if (this.resetFrames > 0) { this.resetFrames--; out.resetHeld = true; return out; }
    if (this.reverse > 0) {
      this.reverse -= 1 / 60;
      out.brake = 1; out.steer = -out.steer;
      return out;
    }
    if (spd < target - 1) out.throttle = 1;
    else if (spd > target + 2) out.brake = clamp((spd - target) / 8, 0.2, 1);
    if (target === 0 && spd < 3) out.brake = 1;
    if (sim.score.tailwind > 0.9 && Math.abs(err) < 0.1 && !direct && spd > 15) out.boost = true;
    // stuck handling
    if (v.speed < 0.6 && target > 3) this.stuck += 1 / 60; else this.stuck = 0;
    if (this.stuck > 1.5) {
      this.reverse = 1.3; this.stuck = 0;
      this.stuckEvents = sim.time - this.lastStuckAt < 14 ? this.stuckEvents + 1 : 1;
      this.lastStuckAt = sim.time;
      if (this.stuckEvents >= 3) { this.resetFrames = 75; this.stuckEvents = 0; }
    }
    return out;
  }
}
