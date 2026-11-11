// Arcade raycast-wheel vehicle. Fixed-step, deterministic, no rendering dependencies.
// Four wheel rays sample the world height field (terrain + authored ramps/decks); a stick-or-fly rule
// decides ground contact, so ramps and crests launch the taxi naturally. Tire forces are an arcade
// bicycle model with a grip mode and a drift mode (rear grip loss) plus speed-sensitive steering.

import { approach, clamp, wrapAngle } from "../math";
import type { World } from "../world/city";
import type { Collider, Surface } from "../world/types";
import type { InputFrame } from "./input";
import { SURFACES, type TaxiSpec } from "./taxis";

export const DT = 1 / 60;
export const G = 9.81;
const MAX_STEP = 0.6;
const STICK = 1.7; // downforce factor for staying on the ground over crests

export interface VehicleState {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  yaw: number; yawRate: number;
  steer: number;
  grounded: boolean;
  airTime: number;
  pitch: number; roll: number; // visual body angles
  groundPitch: number; groundRoll: number;
  susp: [number, number, number, number];
  wheelSpin: number;
  surface: Surface;
  drifting: boolean;
  driftDir: number;
  driftTime: number;
  driftLowAngle: number;
  boosting: boolean;
  surgeTime: number;
  surgeWindow: number;
  brakeHeld: number;
  gripArm: number;
  gripCooldown: number;
  hbBuffer: number;
  damage: number;
  stuckTime: number;
  prevThrottle: boolean;
  prevBrake: boolean;
  prevHandbrake: boolean;
  lastImpact: number;
  slip: number; // tire slip intensity 0..1 for audio/fx
  speedCapMul: number; // modifiers from session (e.g. pedestrian assist)
  maxAirHeight: number;
  takeoffY: number;
}

export type VehicleEvent =
  | { type: "surge" }
  | { type: "snapDrift"; dir: number }
  | { type: "driftEnd"; time: number; clean: boolean }
  | { type: "gripTurn" }
  | { type: "takeoff" }
  | { type: "land"; airTime: number; aligned: boolean; impact: number; height: number }
  | { type: "collision"; impact: number; kind: Collider["kind"] | "ledge"; x: number; z: number }
  | { type: "splash" };

export function createVehicle(x: number, z: number, yaw: number, world: World): VehicleState {
  const y = world.heightAt(x, z);
  return {
    x, y, z, vx: 0, vy: 0, vz: 0, yaw, yawRate: 0, steer: 0, grounded: true, airTime: 0,
    pitch: 0, roll: 0, groundPitch: 0, groundRoll: 0, susp: [0, 0, 0, 0], wheelSpin: 0, surface: "asphalt",
    drifting: false, driftDir: 0, driftTime: 0, driftLowAngle: 0, boosting: false, surgeTime: 0, surgeWindow: 0,
    brakeHeld: 0, gripArm: 0, gripCooldown: 0, hbBuffer: 0, damage: 0, stuckTime: 0, prevThrottle: false, prevBrake: false,
    prevHandbrake: false, lastImpact: 0, slip: 0, speedCapMul: 1, maxAirHeight: 0, takeoffY: y,
  };
}

export function speedOf(v: VehicleState): number {
  return Math.hypot(v.vx, v.vz);
}
export function forwardSpeed(v: VehicleState): number {
  return v.vx * Math.sin(v.yaw) + v.vz * Math.cos(v.yaw);
}
export function driftAngle(v: VehicleState): number {
  const sp = speedOf(v);
  if (sp < 1) return 0;
  const fx = Math.sin(v.yaw), fz = Math.cos(v.yaw);
  const vf = v.vx * fx + v.vz * fz;
  const vr = v.vx * fz - v.vz * fx;
  return Math.atan2(vr, Math.abs(vf));
}

export interface VehicleOptions {
  steerRate: number; // per second, keyboard smoothing
  driftAssist: boolean; // one-button drift preset: drift held while handbrake held
  stabilityAssist: boolean;
}

export const DEFAULT_VEHICLE_OPTIONS: VehicleOptions = { steerRate: 6.5, driftAssist: false, stabilityAssist: true };

const scratch: Collider[] = [];

function sampleGround(v: VehicleState, t: TaxiSpec, world: World, x: number, z: number, out: number[]) {
  const fx = Math.sin(v.yaw), fz = Math.cos(v.yaw);
  const rx = fz, rz = -fx;
  const a = t.wheelbase / 2, b = t.width / 2 - 0.18;
  out[0] = world.heightAt(x + fx * a - rx * b, z + fz * a - rz * b); // FL
  out[1] = world.heightAt(x + fx * a + rx * b, z + fz * a + rz * b); // FR
  out[2] = world.heightAt(x - fx * a - rx * b, z - fz * a - rz * b); // RL
  out[3] = world.heightAt(x - fx * a + rx * b, z - fz * a + rz * b); // RR
}
const gs = [0, 0, 0, 0];

export function stepVehicle(
  v: VehicleState, inp: InputFrame, t: TaxiSpec, world: World, opts: VehicleOptions, ev: VehicleEvent[],
): void {
  const dt = DT;
  const fx = Math.sin(v.yaw), fz = Math.cos(v.yaw);
  const rx = fz, rz = -fx;
  let vf = v.vx * fx + v.vz * fz;
  let vr = v.vx * rx + v.vz * rz;
  const speed = Math.hypot(v.vx, v.vz);
  const surf = SURFACES[v.surface] ?? SURFACES.asphalt;

  // --- steering smoothing (deterministic, part of the sim)
  const target = clamp(inp.steer, -1, 1);
  const returning = Math.abs(target) < Math.abs(v.steer) || Math.sign(target) !== Math.sign(v.steer);
  v.steer = approach(v.steer, target, (returning ? opts.steerRate * 1.4 : opts.steerRate) * dt);

  const throttleDown = inp.throttle > 0.3;
  const brakeDown = inp.brake > 0.3;
  const throttlePress = throttleDown && !v.prevThrottle;
  const brakePress = brakeDown && !v.prevBrake;
  const hbPress = inp.handbrake && !v.prevHandbrake;

  // --- Surge Start: hold brake at low speed, release, then tap throttle within 220 ms.
  if (v.surgeWindow > 0) v.surgeWindow = Math.max(0, v.surgeWindow - dt);
  if (brakeDown && speed < 2) v.brakeHeld += dt;
  if (!brakeDown && v.prevBrake) {
    if (v.brakeHeld >= 0.25 && speed < 2 && !throttleDown) v.surgeWindow = 0.22;
    v.brakeHeld = 0;
  }
  if (!brakeDown && speed >= 2) v.brakeHeld = 0;
  if (throttlePress && v.surgeWindow > 0 && v.grounded) {
    v.surgeTime = 0.9;
    v.surgeWindow = 0;
    ev.push({ type: "surge" });
  }
  if (v.surgeTime > 0) v.surgeTime = Math.max(0, v.surgeTime - dt);

  if (v.gripCooldown > 0) v.gripCooldown -= dt;
  if (v.gripArm > 0) v.gripArm -= dt;
  if (v.hbBuffer > 0) v.hbBuffer -= dt;

  if (v.grounded) {
    // --- gravity along slope
    const gx = (world.heightAt(v.x + 0.6, v.z) - world.heightAt(v.x - 0.6, v.z)) / 1.2;
    const gz = (world.heightAt(v.x, v.z + 0.6) - world.heightAt(v.x, v.z - 0.6)) / 1.2;
    const sgx = clamp(gx, -0.6, 0.6), sgz = clamp(gz, -0.6, 0.6);
    vf += -G * (sgx * fx + sgz * fz) * dt * 0.9;
    vr += -G * (sgx * rx + sgz * rz) * dt * 0.5;

    // --- longitudinal
    const damageMul = v.damage > 0.6 ? 0.88 : 1;
    const boostMul = v.boosting ? 1.75 : 1;
    const surgeMul = v.surgeTime > 0 ? 1.9 : 1;
    const top = t.top * surf.topMul * (v.boosting ? 1.12 : 1) * v.speedCapMul;
    if (throttleDown || inp.throttle > 0.05) {
      if (vf < -0.5) {
        vf = approach(vf, 0, t.brake * inp.throttle * dt);
      } else {
        const ratio = clamp(vf / top, 0, 1.2);
        const curve = Math.max(0, 1 - Math.pow(ratio, 2.4));
        let a = t.accel * inp.throttle * curve * boostMul * surgeMul * damageMul * (0.55 + 0.45 * surf.grip);
        if (v.drifting) a *= 0.85;
        if (ratio > 1) a = -2.5;
        vf += a * dt;
      }
    }
    if (inp.brake > 0.05) {
      if (vf > 0.6) {
        vf = approach(vf, 0, t.brake * inp.brake * (0.6 + 0.4 * surf.grip) * dt);
        if (v.drifting && brakePress) v.gripArm = 0.35;
      } else if (!throttleDown) {
        const rt = t.reverseTop * surf.topMul;
        if (vf > -rt) vf -= t.accel * 0.6 * inp.brake * dt;
      }
    }
    if (inp.handbrake) vf = approach(vf, 0, (v.drifting ? 2.4 : 5.5) * dt);
    // rolling + surface drag + engine braking
    const coast = inp.throttle < 0.05 && inp.brake < 0.05 ? 1.3 : 0;
    const drag = 0.2 + surf.drag + coast + 0.00018 * vf * vf;
    vf = approach(vf, 0, drag * dt);

    // --- drift entry (Snap Drift)
    if (hbPress) v.hbBuffer = 0.2;
    const steerIntent = Math.abs(inp.steer) > 0.3 ? inp.steer : v.steer;
    if (!v.drifting && v.hbBuffer > 0 && inp.handbrake && speed > 9.72 && Math.abs(steerIntent) > 0.25) {
      v.drifting = true;
      v.hbBuffer = 0;
      v.driftDir = Math.sign(steerIntent) || 1;
      v.driftTime = 0;
      v.driftLowAngle = 0;
      v.yawRate += v.driftDir * 0.9;
      ev.push({ type: "snapDrift", dir: v.driftDir });
    }

    // --- yaw
    const sp = Math.max(Math.abs(vf), 0.01);
    const steerAngle = v.steer * (t.steerLow + (t.steerHigh - t.steerLow) * Math.pow(clamp(sp / 32, 0, 1), 0.8));
    let yawTarget = (vf * Math.tan(steerAngle)) / t.wheelbase;
    const latLimit = (t.steerLat * (0.6 + 0.4 * surf.grip)) / Math.max(sp, 1);
    yawTarget = clamp(yawTarget, -latLimit, latLimit);
    if (v.drifting) {
      v.driftTime += dt;
      const into = v.steer * v.driftDir; // +1 steering into the drift, -1 countersteer
      yawTarget = v.driftDir * Math.max(0, t.driftYaw + t.driftSteerYaw * into) * clamp(sp / 20, 0.45, 1.1);
      if (into < -0.3) yawTarget = -v.driftDir * 0.5 * -into; // countersteer unwinds the slide
      if (inp.handbrake) yawTarget *= 1.12;
      if (v.gripCooldown > 0.4) yawTarget *= 1.35;
      const beta = Math.atan2(vr, Math.abs(vf));
      // cap angle (~62 deg) with a stabilizing yaw correction
      if (Math.abs(beta) > 1.08 && Math.sign(-beta) === v.driftDir) yawTarget = -v.driftDir * 0.6;
      // grip turn: tap brake then throttle during a drift
      if (throttlePress && v.gripArm > 0 && v.gripCooldown <= 0) {
        v.yawRate += v.driftDir * 0.8;
        vf *= 0.96;
        v.gripArm = 0;
        v.gripCooldown = 0.8;
        ev.push({ type: "gripTurn" });
      }
      v.yawRate += (yawTarget - v.yawRate) * Math.min(1, t.yawResp * 0.55 * dt);
      // exit conditions
      if (Math.abs(beta) < 0.13) v.driftLowAngle += dt;
      else v.driftLowAngle = 0;
      const assistRelease = opts.driftAssist && !inp.handbrake && v.driftTime > 0.2;
      if (v.driftLowAngle > 0.22 || speed < 6.5 || assistRelease) {
        v.drifting = false;
        ev.push({ type: "driftEnd", time: v.driftTime, clean: true });
      }
    } else {
      let resp = t.yawResp;
      if (inp.handbrake && speed > 4) {
        yawTarget *= 1.35;
        resp *= 1.2;
      }
      v.yawRate += (yawTarget - v.yawRate) * Math.min(1, resp * dt);
    }

    // --- lateral grip / drift slide
    if (v.drifting) {
      // Arcade drift: the velocity direction chases the heading with a target slip angle,
      // so the taxi carves an arc while hanging its tail out. Speed bleeds with slip angle.
      const into = v.steer * v.driftDir;
      const sp2 = Math.hypot(vf, vr);
      const rel = Math.atan2(vr, Math.max(Math.abs(vf), 0.01));
      const targetSlip = v.driftDir * clamp(0.4 + 0.2 * into + (inp.handbrake ? 0.14 : 0), 0.1, 0.8);
      const k = t.driftLat * surf.grip * (v.gripArm < -0.0001 ? 1 : 1) * (v.gripCooldown > 0.4 ? 2.2 : 1);
      const relNew = rel + (-targetSlip - rel) * Math.min(1, k * dt);
      const loss = (0.04 + 0.16 * Math.abs(relNew)) * (throttleDown ? 0.55 : 1.4) * (inp.handbrake ? 1.6 : 1);
      const spNew = sp2 * (1 - loss * dt);
      vf = Math.cos(relNew) * spNew * Math.sign(vf || 1);
      vr = Math.sin(relNew) * spNew;
      v.slip = clamp(0.45 + Math.abs(relNew) * 0.9, 0, 1);
    } else {
      let grip = t.gripLat * surf.grip;
      if (opts.stabilityAssist) grip *= 1.08;
      if (inp.handbrake) grip *= 0.6;
      const before = vr;
      vr = approach(vr, 0, grip * dt);
      v.slip = clamp(Math.abs(before) / 6 + (inp.handbrake && speed > 5 ? 0.3 : 0), 0, 1);
    }
  } else {
    // --- air: subtle yaw control, no traction
    v.yawRate = approach(v.yawRate, clamp(v.steer * 1.1, -1.1, 1.1), 2.2 * dt);
    v.slip = 0;
  }

  // rebuild horizontal velocity from local components
  v.vx = fx * vf + rx * vr;
  v.vz = fz * vf + rz * vr;
  v.yaw = wrapAngle(v.yaw + v.yawRate * dt);

  // --- integrate horizontal position in substeps with static collision
  const sub = 2;
  for (let s = 0; s < sub; s++) {
    const px = v.x, pz = v.z;
    v.x += (v.vx * dt) / sub;
    v.z += (v.vz * dt) / sub;
    // ledge check (walls of decks, terraces, ramp sides)
    sampleGround(v, t, world, v.x, v.z, gs);
    const gAvg = (gs[0] + gs[1] + gs[2] + gs[3]) / 4;
    if (gAvg > v.y + MAX_STEP) {
      v.x = px;
      v.z = pz;
      const imp = Math.hypot(v.vx, v.vz);
      // bounce back along the motion
      v.vx *= -0.2;
      v.vz *= -0.2;
      v.yawRate *= 0.5;
      if (v.drifting) { v.drifting = false; ev.push({ type: "driftEnd", time: v.driftTime, clean: false }); }
      if (imp > 2) ev.push({ type: "collision", impact: imp, kind: "ledge", x: v.x, z: v.z });
      break;
    }
    collideStatic(v, t, world, ev);
  }

  // --- vertical: stick to ground or fly
  sampleGround(v, t, world, v.x, v.z, gs);
  const g0 = (gs[0] + gs[1] + gs[2] + gs[3]) / 4;
  const gFront = (gs[0] + gs[1]) / 2, gRear = (gs[2] + gs[3]) / 2;
  const gLeft = (gs[0] + gs[2]) / 2, gRight = (gs[1] + gs[3]) / 2;
  v.groundPitch = Math.atan2(gFront - gRear, t.wheelbase);
  v.groundRoll = Math.atan2(gLeft - gRight, t.width - 0.36);
  const hs = Math.hypot(v.vx, v.vz);
  if (v.grounded) {
    const follow = (g0 - v.y) / dt;
    const fallLimit = v.vy - G * STICK * dt;
    if (follow < fallLimit - 0.5 && hs > 3) {
      // ground dropped away faster than we can follow: take off
      v.grounded = false;
      v.airTime = 0;
      v.takeoffY = v.y;
      v.maxAirHeight = 0;
      v.y += v.vy * dt;
      v.vy -= G * dt;
      ev.push({ type: "takeoff" });
    } else {
      v.vy = clamp(follow, -30, hs * 0.65 + 0.5);
      v.y = g0;
    }
  } else {
    v.airTime += dt;
    v.vy -= G * dt;
    v.y += v.vy * dt;
    v.maxAirHeight = Math.max(v.maxAirHeight, v.y - g0);
    if (v.y <= g0) {
      const impact = -v.vy;
      v.y = g0;
      v.grounded = true;
      const beta = driftAngle(v);
      const aligned = Math.abs(beta) < 0.35 && Math.abs(wrapAngle(v.groundRoll)) < 0.25;
      if (impact > 7) {
        v.vx *= 0.96;
        v.vz *= 0.96;
      }
      v.vy = 0;
      ev.push({ type: "land", airTime: v.airTime, aligned, impact, height: v.maxAirHeight });
      v.airTime = 0;
    }
  }

  // --- surface
  v.surface = world.surfaceAt(v.x, v.z);

  // --- void (deep water)
  const water = world.waterAt(v.x, v.z);
  if (water !== null && v.y < water - 0.7) ev.push({ type: "splash" });

  // --- visual body motion
  const accelLong = (vf - (v.vx * fx + v.vz * fz)) / dt; // ~0 (rebuilt) — use inputs instead
  void accelLong;
  const pitchTarget = v.grounded ? v.groundPitch + (inp.brake > 0.3 && vf > 2 ? 0.035 : 0) - (inp.throttle > 0.3 && vf < t.top * 0.5 ? 0.025 : 0) : v.pitch + clamp(-v.vy * 0.004, -0.02, 0.02);
  const rollTarget = v.grounded ? v.groundRoll - clamp(v.yawRate * hs * 0.0022, -0.07, 0.07) : v.roll * 0.98;
  v.pitch += (pitchTarget - v.pitch) * Math.min(1, 10 * dt);
  v.roll += (rollTarget - v.roll) * Math.min(1, 8 * dt);
  for (let i = 0; i < 4; i++) v.susp[i] += (gs[i] - g0 - v.susp[i]) * Math.min(1, 15 * dt);
  v.wheelSpin += (vf / 0.34) * dt;

  // --- stuck detection
  if (hs < 0.8 && (inp.throttle > 0.5 || inp.brake > 0.5)) v.stuckTime += dt;
  else v.stuckTime = Math.max(0, v.stuckTime - dt * 2);

  v.prevThrottle = throttleDown;
  v.prevBrake = brakeDown;
  v.prevHandbrake = inp.handbrake;
  if (v.lastImpact > 0) v.lastImpact = Math.max(0, v.lastImpact - dt);
}

/** SAT test between the taxi OBB and an oriented collider. Returns penetration + normal (collider -> taxi). */
export function obbOverlap(
  ax: number, az: number, ahx: number, ahz: number, ayaw: number,
  bx: number, bz: number, bhx: number, bhz: number, byaw: number,
  out: { depth: number; nx: number; nz: number; sep: number },
): boolean {
  const ac = Math.cos(ayaw), as = Math.sin(ayaw);
  const bc = Math.cos(byaw), bs = Math.sin(byaw);
  // axes: right (c, -s) and forward (s, c)
  const axes = [ac, -as, as, ac, bc, -bs, bs, bc];
  const dx = ax - bx, dz = az - bz;
  let minO = Infinity, nx = 0, nz = 0, maxSep = -Infinity;
  for (let i = 0; i < 8; i += 2) {
    const ux = axes[i], uz = axes[i + 1];
    const ra = ahx * Math.abs(ac * ux - as * uz) + ahz * Math.abs(as * ux + ac * uz);
    const rb = bhx * Math.abs(bc * ux - bs * uz) + bhz * Math.abs(bs * ux + bc * uz);
    const d = dx * ux + dz * uz;
    const o = ra + rb - Math.abs(d);
    if (-o > maxSep) maxSep = -o;
    if (o < minO) {
      minO = o;
      const sg = d >= 0 ? 1 : -1;
      nx = ux * sg;
      nz = uz * sg;
    }
  }
  out.depth = minO;
  out.nx = nx;
  out.nz = nz;
  out.sep = maxSep;
  return minO > 0;
}

const ov = { depth: 0, nx: 0, nz: 0, sep: 0 };

function collideStatic(v: VehicleState, t: TaxiSpec, world: World, ev: VehicleEvent[]) {
  world.collidersNear(v.x, v.z, scratch);
  const yBot = v.y + 0.25, yTop = v.y + t.height;
  for (const c of scratch) {
    if (yBot > c.maxY || yTop < c.minY) continue;
    if (!obbOverlap(v.x, v.z, t.width / 2, t.length / 2, v.yaw, c.cx, c.cz, c.hx, c.hz, c.yaw, ov)) continue;
    v.x += ov.nx * ov.depth;
    v.z += ov.nz * ov.depth;
    const vn = v.vx * ov.nx + v.vz * ov.nz;
    if (vn < 0) {
      const e = 0.22;
      v.vx -= (1 + e) * vn * ov.nx;
      v.vz -= (1 + e) * vn * ov.nz;
      // tangential scrub
      const tx = -ov.nz, tz = ov.nx;
      const vt = v.vx * tx + v.vz * tz;
      const scrub = Math.min(Math.abs(vt), -vn * 0.35);
      v.vx -= Math.sign(vt) * scrub * tx;
      v.vz -= Math.sign(vt) * scrub * tz;
      // bounded spin from off-center contact
      const fx = Math.sin(v.yaw), fz = Math.cos(v.yaw);
      const side = fx * tz - fz * tx;
      v.yawRate = clamp(v.yawRate + clamp(-vn * 0.035 * side * Math.sign(vt || 1), -1.2, 1.2), -3, 3);
      const impact = -vn;
      if (impact > 1.5) {
        if (v.drifting) {
          v.drifting = false;
          ev.push({ type: "driftEnd", time: v.driftTime, clean: false });
        }
        if (v.lastImpact <= 0 || impact > 6) {
          ev.push({ type: "collision", impact, kind: c.kind, x: v.x - ov.nx * t.width * 0.5, z: v.z - ov.nz * t.width * 0.5 });
          v.lastImpact = 0.25;
          v.damage = Math.min(1, v.damage + impact * 0.008);
        }
      }
    }
  }
}
