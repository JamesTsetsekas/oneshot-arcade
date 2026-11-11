import { clamp, damp, fwd, rgt, smoothstep, wrapAngle } from '../core/math';
import type { Surface } from './world';

export type VehicleKind = 'car' | 'van' | 'police' | 'bike';
export type Drive = 'fwd' | 'rwd';

/** Data-driven vehicle definition (tuning sheet lives in docs/vehicle-tuning.md, generated from this table). */
export interface VehicleDef {
  id: string;
  name: string;
  kind: VehicleKind;
  mass: number;            // kg
  length: number; width: number; height: number;
  wheelbase: number;
  cgFront: number;         // CG -> front axle (m)
  power: number;           // W peak
  maxDrive: number;        // N peak traction force at launch
  topSpeed: number;        // m/s (soft limit via drag + power)
  brake: number;           // N total
  grip: number;            // tyre mu (front)
  gripRear: number;        // tyre mu (rear)
  handbrakeGrip: number;   // rear mu multiplier while handbrake held
  steerMax: number;        // rad at standstill
  steerFalloff: number;    // speed (m/s) where steering authority halves
  steerRate: number;       // rad/s toward target
  cdA: number;             // drag area (0.5*rho*Cd*A)
  yawInertia: number;      // multiplier on m*a*b
  drive: Drive;
  health: number;
  seats: number;
  gears: number[];
  colors: number[];
  hp: number;              // display only
  wheelRadius: number;
}

const COLORS = {
  warm: [0xd9553b, 0xe3b53b, 0x2f8f83, 0x3b6fd9, 0xeeeeee, 0x2a2e35, 0x8e3b6b],
  muted: [0x7d8a96, 0xb8b2a2, 0x3f5a73, 0x8a4a3a, 0xdddddd, 0x20252b],
};

export const VEHICLES: Record<string, VehicleDef> = {
  tern: {
    id: 'tern', name: 'Tern T1 (compact)', kind: 'car', mass: 1020, length: 3.7, width: 1.7, height: 1.5, wheelbase: 2.4, cgFront: 1.15,
    power: 65000, maxDrive: 7000, topSpeed: 40, brake: 11000, grip: 1.55, gripRear: 1.5, handbrakeGrip: 0.34, steerMax: 0.62, steerFalloff: 20, steerRate: 5.5,
    cdA: 0.55, yawInertia: 1.0, drive: 'fwd', health: 100, seats: 4, gears: [3.6, 2.2, 1.5, 1.1, 0.85], colors: COLORS.warm, hp: 88, wheelRadius: 0.3,
  },
  hollis: {
    id: 'hollis', name: 'Hollis Harbor Sedan', kind: 'car', mass: 1380, length: 4.5, width: 1.82, height: 1.45, wheelbase: 2.7, cgFront: 1.3,
    power: 95000, maxDrive: 8500, topSpeed: 46, brake: 13500, grip: 1.5, gripRear: 1.45, handbrakeGrip: 0.32, steerMax: 0.56, steerFalloff: 22, steerRate: 5.0,
    cdA: 0.66, yawInertia: 1.05, drive: 'fwd', health: 110, seats: 4, gears: [3.4, 2.1, 1.45, 1.05, 0.8], colors: COLORS.muted, hp: 128, wheelRadius: 0.32,
  },
  mistral: {
    id: 'mistral', name: 'Mistral GT Sedan', kind: 'car', mass: 1250, length: 4.3, width: 1.78, height: 1.38, wheelbase: 2.65, cgFront: 1.25,
    power: 115000, maxDrive: 8800, topSpeed: 50, brake: 14000, grip: 1.55, gripRear: 1.5, handbrakeGrip: 0.3, steerMax: 0.55, steerFalloff: 24, steerRate: 5.2,
    cdA: 0.6, yawInertia: 1.0, drive: 'rwd', health: 100, seats: 4, gears: [3.4, 2.1, 1.45, 1.05, 0.8], colors: COLORS.warm, hp: 156, wheelRadius: 0.32,
  },
  cormorant: {
    id: 'cormorant', name: 'Cormorant V8 Coupe', kind: 'car', mass: 1580, length: 4.7, width: 1.9, height: 1.3, wheelbase: 2.75, cgFront: 1.3,
    power: 205000, maxDrive: 11500, topSpeed: 59, brake: 15500, grip: 1.45, gripRear: 1.35, handbrakeGrip: 0.28, steerMax: 0.5, steerFalloff: 26, steerRate: 5.0,
    cdA: 0.68, yawInertia: 1.15, drive: 'rwd', health: 110, seats: 2, gears: [3.2, 2.0, 1.4, 1.05, 0.8], colors: [0xc23b2b, 0x1d1f24, 0xe8b923, 0x2f5fb3], hp: 275, wheelRadius: 0.34,
  },
  dray: {
    id: 'dray', name: 'Dray 3T Delivery Van', kind: 'van', mass: 2150, length: 5.3, width: 2.0, height: 2.3, wheelbase: 3.3, cgFront: 1.55,
    power: 95000, maxDrive: 8800, topSpeed: 40, brake: 16000, grip: 1.3, gripRear: 1.25, handbrakeGrip: 0.35, steerMax: 0.5, steerFalloff: 18, steerRate: 4.0,
    cdA: 1.1, yawInertia: 1.3, drive: 'rwd', health: 140, seats: 3, gears: [4.0, 2.4, 1.6, 1.1, 0.85], colors: [0xeeeeee, 0x2f8f83, 0xd9b43b], hp: 128, wheelRadius: 0.36,
  },
  sentinel: {
    id: 'sentinel', name: 'Sentinel PX Interceptor', kind: 'police', mass: 1760, length: 4.8, width: 1.9, height: 1.45, wheelbase: 2.85, cgFront: 1.35,
    power: 220000, maxDrive: 12500, topSpeed: 58, brake: 17500, grip: 1.55, gripRear: 1.5, handbrakeGrip: 0.3, steerMax: 0.54, steerFalloff: 26, steerRate: 5.5,
    cdA: 0.7, yawInertia: 1.1, drive: 'rwd', health: 140, seats: 4, gears: [3.2, 2.0, 1.4, 1.05, 0.8], colors: [0x1b2a41], hp: 295, wheelRadius: 0.34,
  },
  kestrel: {
    id: 'kestrel', name: 'Kestrel 250 Courier Bike', kind: 'bike', mass: 190, length: 2.0, width: 0.8, height: 1.3, wheelbase: 1.35, cgFront: 0.66,
    power: 24000, maxDrive: 1600, topSpeed: 36, brake: 2800, grip: 1.7, gripRear: 1.7, handbrakeGrip: 0.4, steerMax: 0.55, steerFalloff: 12, steerRate: 7.0,
    cdA: 0.35, yawInertia: 0.8, drive: 'rwd', health: 60, seats: 2, gears: [3.2, 2.0, 1.4, 1.0], colors: [0xe8742b, 0x1f6fd1], hp: 33, wheelRadius: 0.3,
  },
  wren: {
    id: 'wren', name: 'Wren RS Sport Bike', kind: 'bike', mass: 200, length: 2.05, width: 0.78, height: 1.2, wheelbase: 1.4, cgFront: 0.68,
    power: 85000, maxDrive: 2400, topSpeed: 62, brake: 3600, grip: 1.8, gripRear: 1.75, handbrakeGrip: 0.4, steerMax: 0.5, steerFalloff: 14, steerRate: 7.5,
    cdA: 0.32, yawInertia: 0.8, drive: 'rwd', health: 55, seats: 2, gears: [3.0, 2.0, 1.4, 1.0, 0.8, 0.65], colors: [0x1d1f24, 0xc23b2b, 0x2f9d6b], hp: 115, wheelRadius: 0.31,
  },
};

export const CIVILIAN_VEHICLES = ['tern', 'hollis', 'mistral', 'cormorant', 'dray', 'tern', 'hollis'];

export interface DriveInput {
  throttle: number;   // -1..1 (negative = brake/reverse intent)
  steer: number;      // -1..1 (positive = right)
  handbrake: boolean;
}

export type VehicleOwner = 'player' | 'traffic' | 'parked' | 'police' | 'rival' | 'mission' | 'free';

export interface Vehicle {
  id: number;
  def: VehicleDef;
  color: number;
  x: number; z: number; heading: number;
  vx: number; vz: number; yawRate: number;
  steer: number;
  throttle: number; brake: number; handbrake: boolean;
  rpm: number; gear: number;
  health: number; tireDamage: number;
  engineOn: boolean; stalled: boolean;
  lights: boolean; siren: boolean; horn: number;
  owner: VehicleOwner;
  locked: boolean;
  driverId: number | null; // human id (0 = player)
  slip: number;            // 0..1 for tyre fx
  lean: number; pitch: number; roll: number;
  speed: number;           // signed forward m/s (read only)
  surface: Surface;
  plate: string;
  tag?: string;
  cargo?: number;          // mission cargo integrity 0..100
  alive: boolean;
}

let nextVehicleId = 1;
export function resetVehicleIds(): void { nextVehicleId = 1; }

export function makeVehicle(def: VehicleDef, x: number, z: number, heading: number, owner: VehicleOwner = 'parked', color?: number): Vehicle {
  const letters = 'ABCDEFGHJKLMNPRSTUVWXYZ';
  const id = nextVehicleId++;
  const plate = letters[(id * 7) % letters.length] + letters[(id * 13 + 3) % letters.length] + '-' + (100 + ((id * 37) % 900));
  return {
    id, def, color: color ?? def.colors[id % def.colors.length], x, z, heading, vx: 0, vz: 0, yawRate: 0, steer: 0,
    throttle: 0, brake: 0, handbrake: false, rpm: 900, gear: 1, health: def.health, tireDamage: 0, engineOn: false, stalled: false,
    lights: false, siren: false, horn: 0, owner, locked: false, driverId: null, slip: 0, lean: 0, pitch: 0, roll: 0, speed: 0,
    surface: 'asphalt', plate, alive: true,
  };
}

const SURFACE_GRIP: Record<Surface, number> = {
  asphalt: 1, 'wet-asphalt': 0.78, concrete: 0.92, gravel: 0.7, metal: 0.82, shallow: 0.55, water: 0.2,
};
export const surfaceGrip = (s: Surface): number => SURFACE_GRIP[s];

/** Slightly soft-saturating tyre curve: rises with slip angle, plateaus, then loses a little when sliding. */
function tyreCurve(alpha: number): number {
  const a = Math.abs(alpha);
  const base = Math.tanh(a * 7.5);
  const slide = 1 - 0.22 * smoothstep(0.22, 0.65, a);
  return Math.sign(alpha) * base * slide;
}

const G = 9.81;
const LAT = 0.82;

/** Advance one vehicle by dt using a bicycle model with a friction-circle on the driven axle. */
export function stepVehicle(v: Vehicle, input: DriveInput, dt: number, surface: Surface): void {
  const d = v.def;
  v.surface = surface;
  const f = fwd(v.heading);
  const r = rgt(v.heading);
  let vf = v.vx * f.x + v.vz * f.z;
  let vl = v.vx * r.x + v.vz * r.z;
  const dmg = 1 - v.health / d.health; // 0 healthy .. 1 wrecked
  const running = v.engineOn && !v.stalled;
  const a = d.cgFront;
  const b = d.wheelbase - d.cgFront;
  const mu = surfaceGrip(surface) * (1 - 0.35 * v.tireDamage);
  const isBike = d.kind === 'bike';

  // --- steering (speed sensitive, smoothed) --------------------------------
  const speedAbs = Math.abs(vf);
  const authority = 1 / (1 + (speedAbs / d.steerFalloff) ** 2);
  // grip-limited steering: never ask for more lateral acceleration than the tyres can give
  const gripLimit = Math.atan((d.wheelbase * mu * d.grip * LAT * G * 1.1) / Math.max(speedAbs * speedAbs, 4));
  let target = clamp(input.steer, -1, 1) * Math.min(d.steerMax * authority, gripLimit);
  target += dmg > 0.5 ? (dmg - 0.5) * 0.1 : 0; // steering pull when badly damaged
  const rate = Math.abs(target) > Math.abs(v.steer) ? d.steerRate : d.steerRate * 1.6;
  v.steer += clamp(target - v.steer, -rate * dt, rate * dt);

  // --- driver intent ---------------------------------------------------------
  let drive = 0;
  let brake = 0;
  const t = running ? clamp(input.throttle, -1, 1) : 0;
  if (t > 0) { if (vf < -1) brake = t; else drive = t; }
  else if (t < 0) { if (vf > 1) brake = -t; else drive = t; }
  if (!running && Math.abs(input.throttle) > 0.1) { /* engine dead: coast */ }
  v.throttle = Math.abs(drive);
  v.brake = brake;
  v.handbrake = input.handbrake;

  // --- longitudinal force ------------------------------------------------------
  const powerMul = 1 - 0.45 * dmg;
  let Fx = 0;
  if (drive !== 0) {
    const sp = Math.max(Math.abs(vf), 2.0);
    const fromPower = (d.power * powerMul) / sp;
    const maxF = Math.min(d.maxDrive * powerMul, fromPower);
    const revLimit = drive < 0 ? (vf < -9 ? 0 : 0.45) : 1;
    Fx = Math.sign(drive) * Math.abs(drive) * maxF * revLimit;
    if (drive > 0 && vf > d.topSpeed) Fx = 0;
  }
  let Fbrake = brake * d.brake;
  const traction = mu * d.mass * G;
  Fbrake = Math.min(Fbrake, traction * 0.96); // ABS-ish: never exceeds friction
  // drive-axle friction circle
  const Fz_f = d.mass * G * (b / d.wheelbase);
  const Fz_r = d.mass * G * (a / d.wheelbase);
  const drivenFz = d.drive === 'rwd' ? Fz_r : Fz_f;
  const muDrive = (d.drive === 'rwd' ? d.gripRear : d.grip) * mu;
  const driveLimit = muDrive * drivenFz * (d.drive === 'rwd' ? 1.0 : 1.1);
  const FxClamped = clamp(Fx, -driveLimit, driveLimit);
  const driveUse = clamp(Math.abs(FxClamped) / Math.max(driveLimit, 1), 0, 1);

  // --- lateral (bicycle) -------------------------------------------------------------
  const vlf = vl + a * v.yawRate;
  const vlr = vl - b * v.yawRate;
  const den = Math.max(Math.abs(vf), 2.4);
  const sgn = vf >= 0 ? 1 : -1;
  const cosD = Math.cos(v.steer);
  const sinD = Math.sin(v.steer);
  // wheel-frame slip at the front
  const latW = vlf * cosD - vf * sinD * 1;
  const lonW = vf * cosD + vlf * sinD;
  const alphaF = Math.atan2(latW * sgn, Math.max(Math.abs(lonW), 2.4));
  const alphaR = Math.atan2(vlr * sgn, den);
  const hb = input.handbrake ? d.handbrakeGrip : 1;
  const frontCircle = d.drive === 'fwd' ? Math.sqrt(Math.max(0, 1 - driveUse * driveUse * 0.5)) : 1;
  const FyF = -tyreCurve(alphaF) * d.grip * LAT * mu * Fz_f * sgn * frontCircle;
  let rearCircle = d.drive === 'rwd' ? Math.sqrt(Math.max(0, 1 - driveUse * driveUse * 0.9)) : 1;
  if (input.handbrake) rearCircle = Math.min(rearCircle, 1);
  const FyR = -tyreCurve(alphaR) * d.gripRear * LAT * mu * Fz_r * hb * rearCircle * sgn;

  // handbrake also brakes the rear axle a little
  const Fhb = input.handbrake ? 0.25 * d.brake * Math.min(1, speedAbs / 3) : 0;

  const dragF = -d.cdA * 1.2 * vf * Math.abs(vf) * 0.5 - 90 * (isBike ? 0.4 : 1) * Math.sign(vf) * Math.min(1, speedAbs); // aero + rolling
  const longForce = FxClamped * (running ? 1 : 0) - Math.sign(vf) * (Fbrake + Fhb) + dragF - FyF * sinD;
  const latForce = FyR + FyF * cosD - 0.5 * d.cdA * vl * Math.abs(vl);

  // --- integrate -------------------------------------------------------------------------
  const m = d.mass;
  const Iz = m * a * b * d.yawInertia * (isBike ? 1.2 : 1);
  let torque = a * FyF * cosD - b * FyR;
  const yawDamp = (1.2 + 3.2 * (1 - smoothstep(1, 6, speedAbs))) * Iz;
  torque -= v.yawRate * yawDamp * 0.5;
  const dvf = (longForce / m) * dt;
  // do not let braking flip direction in one step
  if (Fbrake + Fhb > 0 && (vf + dvf) * vf < 0 && Math.abs(Fx) < 1) vf = 0; else vf += dvf;
  vl += (latForce / m) * dt;
  v.yawRate += (torque / Iz) * dt;
  v.yawRate = clamp(v.yawRate, -2.8, 2.8);

  // low speed: pure kinematic assist so the car never twitches at standstill
  if (speedAbs < 3.2) {
    const k = 1 - smoothstep(0.5, 3.2, speedAbs);
    const kin = (vf * Math.tan(v.steer)) / d.wheelbase;
    v.yawRate = v.yawRate * (1 - k) + kin * k;
    vl = damp(vl, 0, 12 * k + 0.5, dt);
  }
  // idle/no-power drag stop
  if (drive === 0 && brake === 0 && Math.abs(vf) < 0.25) vf *= 0.9;

  // lean for bikes / body roll for cars
  const latAcc = latForce / m / G;
  v.roll = damp(v.roll, isBike ? clamp(-latAcc * 0.9 - v.steer * 0.25 * clamp(speedAbs / 12, 0, 1), -0.75, 0.75) : clamp(-latAcc * 0.06, -0.08, 0.08), 8, dt);
  v.pitch = damp(v.pitch, clamp((-longForce / m / G) * 0.045, -0.06, 0.06), 6, dt);
  v.slip = clamp(Math.max(Math.abs(alphaR), Math.abs(alphaF)) * 3 + (input.handbrake && speedAbs > 5 ? 0.5 : 0), 0, 1);
  v.lean = v.roll;

  // back to world frame
  v.heading = wrapAngle(v.heading + v.yawRate * dt);
  const f2 = fwd(v.heading);
  const r2 = rgt(v.heading);
  v.vx = f2.x * vf + r2.x * vl;
  v.vz = f2.z * vf + r2.z * vl;
  v.x += v.vx * dt;
  v.z += v.vz * dt;
  v.speed = vf;

  // gearbox / rpm (presentation + audio)
  const g = d.gears;
  const ws = Math.abs(vf);
  const per = d.topSpeed / g.length;
  const gi = clamp(Math.floor(ws / (per * 0.92)), 0, g.length - 1);
  v.gear = vf < -0.5 ? -1 : gi + 1;
  const inGear = ws / (per * (gi + 1) * 0.95);
  const targetRpm = running ? 900 + 5600 * clamp(inGear, 0, 1.05) * (0.35 + 0.65 * clamp(Math.abs(drive) + 0.25, 0, 1)) : 0;
  v.rpm = damp(v.rpm, targetRpm, 9, dt);
  if (v.health <= 0 && v.engineOn) { v.stalled = true; }
}

/** Free-rolling vehicle (parked/abandoned): decays velocity with the handbrake effectively applied. */
export function stepIdle(v: Vehicle, dt: number, surface: Surface): void {
  if (Math.hypot(v.vx, v.vz) < 0.05 && Math.abs(v.yawRate) < 0.01) { v.vx = v.vz = v.yawRate = 0; v.speed = 0; return; }
  stepVehicle(v, { throttle: 0, steer: 0, handbrake: true }, dt, surface);
  v.vx *= 1 - 0.8 * dt;
  v.vz *= 1 - 0.8 * dt;
}

export function applyDamage(v: Vehicle, amount: number): void {
  if (amount <= 0) return;
  v.health = Math.max(0, v.health - amount);
  v.tireDamage = clamp(v.tireDamage + amount / (v.def.health * 3.5), 0, 0.8);
  if (v.health <= 0) { v.stalled = true; }
}

export function repairVehicle(v: Vehicle): void {
  v.health = v.def.health;
  v.tireDamage = 0;
  v.stalled = false;
}

export const kmh = (v: Vehicle): number => Math.abs(v.speed) * 3.6;
export const vehicleSpeed = (v: Vehicle): number => Math.hypot(v.vx, v.vz);
