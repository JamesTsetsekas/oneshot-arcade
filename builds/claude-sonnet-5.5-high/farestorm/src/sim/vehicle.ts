/**
 * Arcade vehicle model. Velocity lives in world space and the heading rotates independently, so
 * slip (drift) emerges from the difference. Grip is a damping rate on lateral velocity; handbrake /
 * drift lowers it, countersteer or lifting off ends it. Fixed 60 Hz, deterministic, no DOM.
 */
import type { TaxiSpec } from './data';
import { clamp, damp, saturate, wrapAngle } from './math';
import { SURFACES, type Surface, type World } from './world';

export interface VehicleInput {
  throttle: number; // 0..1
  brake: number; // 0..1
  steer: number; // -1 (left) .. +1 (right)
  handbrake: boolean;
  boost: boolean;
}
export const NO_INPUT: VehicleInput = { throttle: 0, brake: 0, steer: 0, handbrake: false, boost: false };

export type VehicleEvent =
  | { type: 'surge' }
  | { type: 'snapDrift'; dir: number }
  | { type: 'gripTurn' }
  | { type: 'driftEnd'; duration: number; points: number; clean: boolean }
  | { type: 'collision'; impact: number; tag: string; nx: number; nz: number; px: number; pz: number }
  | { type: 'takeoff'; speed: number }
  | { type: 'landing'; airTime: number; align: number; impact: number }
  | { type: 'splash' };

export interface VehicleState {
  x: number;
  z: number;
  h: number;
  vx: number;
  vz: number;
  yawRate: number;
  y: number;
  vy: number;
  pitch: number;
  roll: number;
  airborne: boolean;
  airTime: number;
  steer: number;
  grip: number;
  surface: Surface;
  // drift
  drifting: boolean;
  driftDir: number;
  driftTime: number;
  driftAngle: number; // rad, signed (velocity vs heading)
  driftScore: number;
  slip: number;
  // input edge tracking
  clock: number;
  prevHand: boolean;
  prevThrottle: number;
  prevBrake: number;
  brakeDownAt: number;
  brakeTapEnd: number;
  brakeReleaseAt: number;
  surgeTimer: number;
  gripTurnTimer: number;
  collideCd: number;
  prevGroundH: number;
  prevRampAlong: number;
  lastRamp: number;
  damage: number; // 0..1 cosmetic -> mild accel loss
  // interpolation snapshot
  px: number;
  pz: number;
  ph: number;
  py: number;
  // derived
  speed: number;
  fwd: number;
  lat: number;
  boosting: boolean;
}

export function createVehicle(x: number, z: number, h: number): VehicleState {
  return {
    x, z, h, vx: 0, vz: 0, yawRate: 0, y: 0, vy: 0, pitch: 0, roll: 0, airborne: false, airTime: 0, steer: 0, grip: 9, surface: 'asphalt',
    drifting: false, driftDir: 0, driftTime: 0, driftAngle: 0, driftScore: 0, slip: 0,
    clock: 0, prevHand: false, prevThrottle: 0, prevBrake: 0, brakeDownAt: -9, brakeTapEnd: -9, brakeReleaseAt: -9,
    surgeTimer: 0, gripTurnTimer: 0, collideCd: 0, prevGroundH: 0, prevRampAlong: 0, lastRamp: -1, damage: 0,
    px: x, pz: z, ph: h, py: 0, speed: 0, fwd: 0, lat: 0, boosting: false,
  };
}

const GRAVITY = 24;
const PROXY_R = 1.05;

export function forwardOf(h: number): [number, number] {
  return [Math.sin(h), Math.cos(h)];
}
export function rightOf(h: number): [number, number] {
  return [-Math.cos(h), Math.sin(h)];
}

export function stepVehicle(
  v: VehicleState,
  spec: TaxiSpec,
  inp: VehicleInput,
  dt: number,
  world: World,
  boosting: boolean,
  events: VehicleEvent[],
): void {
  v.px = v.x; v.pz = v.z; v.ph = v.h; v.py = v.y;
  v.clock += dt;
  const [fx, fz] = forwardOf(v.h);
  const [rx, rz] = rightOf(v.h);
  let vf = v.vx * fx + v.vz * fz;
  let vl = v.vx * rx + v.vz * rz;
  const speedBefore = Math.hypot(v.vx, v.vz);
  v.boosting = boosting;

  // --- input edges
  const handEdge = inp.handbrake && !v.prevHand;
  if (inp.brake > 0.3 && v.prevBrake <= 0.3) v.brakeDownAt = v.clock;
  if (inp.brake <= 0.3 && v.prevBrake > 0.3) {
    v.brakeReleaseAt = v.clock;
    if (v.clock - v.brakeDownAt < 0.3) v.brakeTapEnd = v.clock;
  }
  const throttleEdge = inp.throttle > 0.5 && v.prevThrottle <= 0.5;

  // --- keyboard-friendly steering smoothing (slower at speed, quick return)
  const sp0 = Math.abs(vf);
  const steerRate = (inp.steer === 0 ? 11 : Math.sign(inp.steer) !== Math.sign(v.steer) && v.steer !== 0 ? 13 : 7.5) * (1 - 0.35 * saturate(sp0 / 40));
  v.steer = damp(v.steer, inp.steer, steerRate, dt);
  if (Math.abs(v.steer) < 0.003 && inp.steer === 0) v.steer = 0;

  const surf: Surface = v.airborne ? 'asphalt' : world.surfaceAt(v.x, v.z);
  v.surface = surf;
  const S = SURFACES[surf];
  const dmgMul = 1 - 0.12 * v.damage;

  // --- special inputs
  if (!v.airborne) {
    if (throttleEdge && v.clock - v.brakeReleaseAt < 0.26 && speedBefore < 8 && v.surgeTimer <= 0) {
      v.surgeTimer = 0.9;
      events.push({ type: 'surge' });
    }
    if (v.drifting && throttleEdge && v.clock - v.brakeTapEnd < 0.4 && v.gripTurnTimer <= 0) {
      v.gripTurnTimer = 0.75;
      events.push({ type: 'gripTurn' });
    }
  }
  v.surgeTimer = Math.max(0, v.surgeTimer - dt);
  v.gripTurnTimer = Math.max(0, v.gripTurnTimer - dt);

  const kmh = speedBefore * 3.6;
  if (!v.airborne) {
    // --- drift state machine
    const slipAng = vf > 1 ? Math.atan2(vl, vf) : 0;
    v.driftAngle = slipAng;
    if (!v.drifting) {
      const steering = Math.abs(v.steer) > 0.3;
      if (kmh > 35 && steering && (handEdge || (inp.handbrake && Math.abs(v.steer) > 0.2))) {
        v.drifting = true;
        v.driftDir = Math.sign(v.steer);
        v.driftTime = 0;
        v.driftScore = 0;
        v.yawRate += -v.driftDir * 0.75 * saturate(speedBefore / 22);
        if (handEdge) events.push({ type: 'snapDrift', dir: v.driftDir });
      }
    } else {
      v.driftTime += dt;
      const counter = v.steer * v.driftDir < -0.45;
      const ang = Math.abs(slipAng);
      const ended = counter || speedBefore < 7.5 || (ang < 0.12 && v.driftTime > 0.5 && !inp.handbrake) || (inp.throttle < 0.1 && !inp.handbrake && ang < 0.35 && v.driftTime > 0.7);
      if (ended) {
        v.drifting = false;
        events.push({ type: 'driftEnd', duration: v.driftTime, points: v.driftScore, clean: true });
        v.driftScore = 0;
      }
    }

    // --- longitudinal
    const topV = spec.topSpeed * (boosting ? 1.22 : 1) * (1 - 0.05 * v.damage);
    if (inp.throttle > 0 && vf > -1.5) {
      let a = spec.accel0 * Math.max(0, 1 - (vf / topV) * (vf / topV));
      a = Math.max(a, 0.6 * spec.accel0 * (boosting ? 1 : 0));
      if (boosting) a *= 1.8;
      if (v.surgeTimer > 0) a *= 1.55;
      if (v.drifting) a *= 0.9;
      vf += a * inp.throttle * S.accel * dmgMul * dt;
    } else if (inp.throttle > 0 && vf <= -1.5) {
      vf += spec.brake * inp.throttle * dt;
    }
    if (inp.brake > 0) {
      if (vf > 0.8) vf = Math.max(0, vf - spec.brake * inp.brake * dt * (surf === 'sand' ? 0.8 : 1));
      else vf = Math.max(-11, vf - 8 * inp.brake * dt - (inp.throttle > 0 ? 0 : 0));
      if (vf > 0 && vf <= 0.8 && inp.brake > 0.3) vf = Math.max(0, vf - 14 * dt);
    }
    // passive resistance
    const sgn = vf >= 0 ? 1 : -1;
    const roll = (0.7 * S.drag + (S.drag - 1) * 0.13 * Math.abs(vf)) * dt;
    const coast = inp.throttle === 0 && inp.brake === 0 ? 1.1 * dt : 0;
    vf -= sgn * Math.min(Math.abs(vf), roll + coast);
    if (vf > topV) vf = damp(vf, topV, 1.2, dt);
    if (inp.handbrake) vf -= sgn * Math.min(Math.abs(vf), (v.drifting ? 1.2 : 4.5) * dt);

    // --- grip
    let target = (v.drifting || inp.handbrake ? spec.gripDrift : spec.gripBase) * S.grip;
    if (v.gripTurnTimer > 0) target = spec.gripBase * 0.55 * S.grip;
    v.grip = target < v.grip ? damp(v.grip, target, 40, dt) : damp(v.grip, target, v.drifting ? 3 : 5.5, dt);
    const dvl = vl * (1 - Math.exp(-v.grip * dt));
    vl -= dvl;
    vf += (vf >= 0 ? 1 : -1) * Math.abs(dvl) * 0.62; // momentum is redirected, not lost

    // --- yaw
    const sp = Math.abs(vf);
    const dirf = clamp(vf / 3.5, -1, 1);
    const speedScale = 1 / (1 + Math.pow(sp / 26, 1.4));
    const steerAng = v.steer * spec.steerMax * (0.35 + 0.65 * speedScale) * (boosting ? 0.85 : 1);
    let yawTarget = ((dirf * sp) / spec.wheelBase) * Math.tan(steerAng);
    const cap = (spec.latGrip * S.grip) / Math.max(sp, 5) * (v.gripTurnTimer > 0 ? 1.45 : 1);
    yawTarget = clamp(yawTarget, -cap, cap);
    if (v.drifting) {
      const ds = clamp(sp / 16, 0.35, 1);
      yawTarget = -v.steer * spec.driftYaw * ds * (v.gripTurnTimer > 0 ? 1.4 : 1);
      // keep the car rotating a little in the drift direction when steering is light
      yawTarget += -v.driftDir * 0.22 * ds * (1 - Math.abs(v.steer));
    } else if (inp.handbrake) {
      yawTarget *= 1.35;
    } else {
      yawTarget = -yawTarget;
    }
    if (!v.drifting && !inp.handbrake) {
      // yawTarget sign convention: positive steer == right == negative yaw (handled above)
    } else if (!v.drifting) {
      yawTarget = -yawTarget;
    }
    // stability assist: damp spin when slip gets extreme
    const slipNow = Math.abs(Math.atan2(vl, Math.abs(vf) + 0.5));
    if (slipNow > 0.85) yawTarget *= 0.4;
    v.yawRate = damp(v.yawRate, yawTarget, spec.yawResponse * (v.drifting ? 0.75 : 1), dt);
    v.h = wrapAngle(v.h + v.yawRate * dt);
  } else {
    // --- airborne: subtle yaw control, pitch bias
    v.yawRate = damp(v.yawRate, -v.steer * 1.1, 3, dt);
    v.h = wrapAngle(v.h + v.yawRate * dt);
    vf -= Math.sign(vf) * Math.min(Math.abs(vf), 0.35 * dt);
    vl = damp(vl, vl, 0, dt);
  }

  // --- recompose velocity in (possibly rotated) heading frame, keeping world momentum
  const [nfx, nfz] = forwardOf(v.h);
  const [nrx, nrz] = rightOf(v.h);
  // vf, vl were computed in the old frame; the world-frame velocity is preserved across the yaw step
  v.vx = vf * fx + vl * rx;
  v.vz = vf * fz + vl * rz;
  void nfx; void nfz; void nrx; void nrz;

  // --- integrate
  v.x += v.vx * dt;
  v.z += v.vz * dt;

  // --- vertical (ramps / airtime)
  const ramp = world.rampAt(v.x, v.z);
  const ground = ramp ? world.rampHeight(v.x, v.z) : 0;
  if (!v.airborne) {
    const heightDrop = v.prevGroundH - ground;
    if (!ramp && v.prevGroundH > 0.5 && heightDrop > 0.4 && v.lastRamp >= 0) {
      const r = world.ramps[v.lastRamp];
      const along = v.vx * r.dx + v.vz * r.dz;
      if (along > 6) {
        v.airborne = true;
        v.airTime = 0;
        v.vy = (along * r.height) / r.len * 1.0;
        v.y = v.prevGroundH;
        events.push({ type: 'takeoff', speed: along });
      }
    }
    if (!v.airborne) {
      v.y = ground;
      const slope = ramp ? ramp.height / ramp.len : 0;
      v.pitch = damp(v.pitch, ramp ? -Math.atan(slope) : 0, 14, dt);
      if (ramp) v.lastRamp = world.ramps.indexOf(ramp);
      else if (v.prevGroundH <= 0.05) v.lastRamp = -1;
    }
  }
  if (v.airborne) {
    v.vy -= GRAVITY * dt;
    v.y += v.vy * dt;
    v.airTime += dt;
    const spd = Math.hypot(v.vx, v.vz);
    const targetPitch = -Math.atan2(v.vy, Math.max(spd, 1)) * 0.9 + (inp.brake - inp.throttle) * 0.12;
    v.pitch = damp(v.pitch, targetPitch, 4, dt);
    if (v.y <= ground && v.vy < 0) {
      const impact = -v.vy;
      v.y = ground;
      v.airborne = false;
      const [lfx, lfz] = forwardOf(v.h);
      const sp = Math.hypot(v.vx, v.vz);
      const align = sp > 1 ? Math.abs(Math.acos(clamp((v.vx * lfx + v.vz * lfz) / sp, -1, 1))) : 0;
      events.push({ type: 'landing', airTime: v.airTime, align, impact });
      if (impact > 8) {
        const loss = 1 - clamp((impact - 8) * 0.03, 0, 0.25);
        v.vx *= loss; v.vz *= loss;
      }
      v.vy = 0;
      v.pitch = 0;
    }
  }
  v.prevGroundH = v.airborne ? 0 : ground;

  // --- collisions (three proxy circles along the body)
  v.collideCd = Math.max(0, v.collideCd - dt);
  if (!v.airborne || v.y < 1.2) collide(v, spec, world, events);

  // --- bookkeeping
  v.speed = Math.hypot(v.vx, v.vz);
  const [ffx, ffz] = forwardOf(v.h);
  const [rrx, rrz] = rightOf(v.h);
  v.fwd = v.vx * ffx + v.vz * ffz;
  v.lat = v.vx * rrx + v.vz * rrz;
  v.slip = v.fwd > 1 ? Math.atan2(v.lat, v.fwd) : 0;
  v.roll = damp(v.roll, clamp(-v.lat * 0.012 + v.steer * v.speed * 0.0018 * (v.fwd > 0 ? 1 : -1), -0.16, 0.16), 8, dt);
  if (v.drifting) v.driftScore += dt;
  v.prevHand = inp.handbrake;
  v.prevThrottle = inp.throttle;
  v.prevBrake = inp.brake;
}

function collide(v: VehicleState, spec: TaxiSpec, world: World, events: VehicleEvent[]): void {
  const [fx, fz] = forwardOf(v.h);
  const half = spec.length / 2 - PROXY_R + 0.15;
  const offs = [half, 0, -half];
  const r = PROXY_R + (spec.width - 1.9) * 0.2;
  for (let iter = 0; iter < 2; iter++) {
    for (const o of offs) {
      const hit = world.hitTest(v.x + fx * o, v.z + fz * o, r);
      if (!hit) continue;
      v.x += hit.nx * hit.pen;
      v.z += hit.nz * hit.pen;
      const vn = v.vx * hit.nx + v.vz * hit.nz;
      if (vn < 0) {
        const impact = -vn;
        const e = hit.soft ? 0.05 : 0.3;
        v.vx -= (1 + e) * vn * hit.nx;
        v.vz -= (1 + e) * vn * hit.nz;
        // glancing hits slide with a little friction; head-on hits lose a lot more
        const tFric = hit.soft ? 0.985 : 0.955;
        v.vx *= tFric; v.vz *= tFric;
        // bounded angular impulse so the car stays controllable
        const rxo = -Math.cos(v.h), rzo = Math.sin(v.h);
        const lever = (rxo * hit.nx + rzo * hit.nz) * o;
        v.yawRate += clamp(-lever * impact * 0.05 + (hit.nx * fz - hit.nz * fx) * impact * 0.015, -1.1, 1.1);
        if (impact > 1.5 && v.collideCd <= 0) {
          v.collideCd = 0.3;
          events.push({ type: 'collision', impact, tag: hit.tag, nx: hit.nx, nz: hit.nz, px: v.x + fx * o, pz: v.z + fz * o });
          if (v.drifting && impact > 4) {
            v.drifting = false;
            events.push({ type: 'driftEnd', duration: v.driftTime, points: v.driftScore, clean: false });
            v.driftScore = 0;
          }
        }
      }
    }
  }
}
