// Vehicle dynamics: planar rigid body with a bicycle tire model (load transfer, saturating
// lateral grip, traction circle, handbrake), per-wheel height sampling for suspension,
// slope gravity, airborne state, arcade assists and gameplay damage. Deterministic, no DOM.

import { clamp, approach } from "../core/math";
import type { Surface } from "../world/district";

export type VehicleModel = "pella" | "varro" | "osprey" | "brava" | "hauler" | "warden" | "kestrel" | "vanta";
export type VehicleClass = "compact" | "sedan" | "muscle" | "van" | "police" | "moto";

export interface VehicleSpec {
  id: VehicleModel;
  name: string;
  cls: VehicleClass;
  mass: number;
  length: number; width: number; height: number;
  wheelbase: number; track: number;
  /** fraction of wheelbase from CG to front axle */
  cgFront: number;
  cgHeight: number;
  engineForce: number;
  topSpeed: number;
  reverseSpeed: number;
  brakeForce: number;
  /** tire peak friction and normalized cornering stiffness (per rad) */
  mu: number; stiffF: number; stiffR: number;
  handbrakeGrip: number;
  drag: number; rolling: number;
  maxSteer: number; steerRate: number;
  drive: "fwd" | "rwd" | "awd";
  rideHeight: number;
  suspStiff: number; suspDamp: number;
  gears: number;
  camDist: number; camHeight: number;
  moto: boolean;
  durability: number;
  colors: [number, number, number][];
  audio: { idle: number; max: number; tone: "buzzy" | "deep" | "smooth" | "diesel" | "sport" };
}

const G = 9.81;

export const VEHICLES: Record<VehicleModel, VehicleSpec> = {
  pella: {
    id: "pella", name: "Pella Compact", cls: "compact", mass: 1050, length: 3.9, width: 1.75, height: 1.5,
    wheelbase: 2.45, track: 1.5, cgFront: 0.42, cgHeight: 0.5, engineForce: 5200, topSpeed: 44, reverseSpeed: 9,
    brakeForce: 11000, mu: 1.05, stiffF: 9, stiffR: 9.5, handbrakeGrip: 0.45, drag: 0.42, rolling: 14,
    maxSteer: 0.62, steerRate: 3.2, drive: "fwd", rideHeight: 0.32, suspStiff: 38, suspDamp: 6, gears: 5,
    camDist: 5.4, camHeight: 2.0, moto: false, durability: 85,
    colors: [[0.85, 0.3, 0.25], [0.95, 0.85, 0.55], [0.4, 0.65, 0.7], [0.9, 0.9, 0.88], [0.3, 0.45, 0.35]],
    audio: { idle: 38, max: 150, tone: "buzzy" },
  },
  varro: {
    id: "varro", name: "Varro Sedan", cls: "sedan", mass: 1380, length: 4.6, width: 1.85, height: 1.48,
    wheelbase: 2.8, track: 1.58, cgFront: 0.45, cgHeight: 0.52, engineForce: 6800, topSpeed: 50, reverseSpeed: 9,
    brakeForce: 14500, mu: 1.05, stiffF: 9, stiffR: 10, handbrakeGrip: 0.45, drag: 0.4, rolling: 16,
    maxSteer: 0.58, steerRate: 3, drive: "fwd", rideHeight: 0.33, suspStiff: 34, suspDamp: 6, gears: 5,
    camDist: 6, camHeight: 2.1, moto: false, durability: 100,
    colors: [[0.2, 0.24, 0.3], [0.62, 0.64, 0.66], [0.55, 0.15, 0.18], [0.85, 0.85, 0.82], [0.25, 0.35, 0.55]],
    audio: { idle: 32, max: 130, tone: "smooth" },
  },
  osprey: {
    id: "osprey", name: "Osprey Tourer", cls: "sedan", mass: 1520, length: 4.75, width: 1.9, height: 1.55,
    wheelbase: 2.85, track: 1.62, cgFront: 0.47, cgHeight: 0.55, engineForce: 8200, topSpeed: 53, reverseSpeed: 10,
    brakeForce: 16000, mu: 1.1, stiffF: 9.5, stiffR: 10, handbrakeGrip: 0.5, drag: 0.42, rolling: 16,
    maxSteer: 0.56, steerRate: 3, drive: "awd", rideHeight: 0.36, suspStiff: 32, suspDamp: 6, gears: 6,
    camDist: 6.1, camHeight: 2.15, moto: false, durability: 110,
    colors: [[0.1, 0.12, 0.14], [0.75, 0.72, 0.65], [0.2, 0.4, 0.35], [0.6, 0.35, 0.2]],
    audio: { idle: 30, max: 140, tone: "smooth" },
  },
  brava: {
    id: "brava", name: "Brava GT", cls: "muscle", mass: 1560, length: 4.7, width: 1.95, height: 1.32,
    wheelbase: 2.75, track: 1.62, cgFront: 0.5, cgHeight: 0.48, engineForce: 11500, topSpeed: 62, reverseSpeed: 10,
    brakeForce: 17000, mu: 1.08, stiffF: 9.5, stiffR: 8.8, handbrakeGrip: 0.4, drag: 0.38, rolling: 15,
    maxSteer: 0.56, steerRate: 3.1, drive: "rwd", rideHeight: 0.3, suspStiff: 42, suspDamp: 7, gears: 5,
    camDist: 6.2, camHeight: 2.0, moto: false, durability: 115,
    colors: [[0.85, 0.45, 0.1], [0.12, 0.13, 0.15], [0.15, 0.5, 0.45], [0.75, 0.1, 0.12], [0.92, 0.9, 0.85]],
    audio: { idle: 26, max: 120, tone: "deep" },
  },
  hauler: {
    id: "hauler", name: "Quayline Hauler", cls: "van", mass: 2300, length: 5.4, width: 2.05, height: 2.4,
    wheelbase: 3.3, track: 1.75, cgFront: 0.45, cgHeight: 0.9, engineForce: 9000, topSpeed: 38, reverseSpeed: 8,
    brakeForce: 20000, mu: 0.95, stiffF: 8.5, stiffR: 9.5, handbrakeGrip: 0.55, drag: 0.6, rolling: 22,
    maxSteer: 0.6, steerRate: 2.6, drive: "rwd", rideHeight: 0.42, suspStiff: 26, suspDamp: 5, gears: 5,
    camDist: 7.6, camHeight: 2.9, moto: false, durability: 140,
    colors: [[0.95, 0.95, 0.92], [0.95, 0.75, 0.2], [0.3, 0.5, 0.65]],
    audio: { idle: 28, max: 95, tone: "diesel" },
  },
  warden: {
    id: "warden", name: "Warden Interceptor", cls: "police", mass: 1650, length: 4.9, width: 1.95, height: 1.5,
    wheelbase: 2.9, track: 1.64, cgFront: 0.48, cgHeight: 0.5, engineForce: 11000, topSpeed: 58, reverseSpeed: 11,
    brakeForce: 18500, mu: 1.12, stiffF: 9.8, stiffR: 10.2, handbrakeGrip: 0.45, drag: 0.4, rolling: 15,
    maxSteer: 0.56, steerRate: 3.3, drive: "awd", rideHeight: 0.33, suspStiff: 40, suspDamp: 7, gears: 6,
    camDist: 6.2, camHeight: 2.1, moto: false, durability: 140,
    colors: [[0.92, 0.94, 0.96]],
    audio: { idle: 30, max: 135, tone: "deep" },
  },
  kestrel: {
    id: "kestrel", name: "Kestrel 250 Courier", cls: "moto", mass: 230, length: 2.0, width: 0.75, height: 1.25,
    wheelbase: 1.38, track: 0.1, cgFront: 0.5, cgHeight: 0.6, engineForce: 1650, topSpeed: 38, reverseSpeed: 3,
    brakeForce: 3400, mu: 1.15, stiffF: 11, stiffR: 11.5, handbrakeGrip: 0.6, drag: 0.32, rolling: 4,
    maxSteer: 0.7, steerRate: 4, drive: "rwd", rideHeight: 0.34, suspStiff: 30, suspDamp: 6, gears: 5,
    camDist: 5.4, camHeight: 2.3, moto: true, durability: 60,
    colors: [[0.95, 0.5, 0.15]],
    audio: { idle: 55, max: 220, tone: "buzzy" },
  },
  vanta: {
    id: "vanta", name: "Vanta 800", cls: "moto", mass: 260, length: 2.1, width: 0.78, height: 1.2,
    wheelbase: 1.42, track: 0.1, cgFront: 0.5, cgHeight: 0.6, engineForce: 2700, topSpeed: 56, reverseSpeed: 3,
    brakeForce: 4400, mu: 1.2, stiffF: 11.5, stiffR: 11, handbrakeGrip: 0.55, drag: 0.3, rolling: 4,
    maxSteer: 0.65, steerRate: 4.2, drive: "rwd", rideHeight: 0.33, suspStiff: 34, suspDamp: 7, gears: 6,
    camDist: 5.4, camHeight: 2.3, moto: true, durability: 60,
    colors: [[0.12, 0.12, 0.14], [0.2, 0.55, 0.75], [0.8, 0.15, 0.2]],
    audio: { idle: 60, max: 260, tone: "sport" },
  },
};

export const SURFACE_GRIP: Record<Surface, number> = {
  asphalt: 1, concrete: 0.96, gravel: 0.72, dirt: 0.7, metal: 0.82, water: 0.55, grass: 0.66,
};

export interface VehicleControls { throttle: number; brake: number; steer: number; handbrake: boolean }

export interface VehicleEnv {
  height(x: number, z: number): number;
  /** visual-only: terrain plus curbs */
  surfaceHeight(x: number, z: number): number;
  surface(x: number, z: number): Surface;
  wet: number;
  water(x: number, z: number): number | null;
}

let nextVehicleId = 1;
const PLATE_CHARS = "ABCDEFGHJKLMNPRSTUVWXYZ23456789";

export type VehicleRole = "civilian" | "parked" | "player" | "police" | "mission" | "rival";

export class Vehicle {
  id = nextVehicleId++;
  spec: VehicleSpec;
  x = 0; z = 0; y = 0; vy = 0; yaw = 0;
  vx = 0; vz = 0; w = 0;
  steer = 0;
  throttleIn = 0; brakeIn = 0; handbrake = false;
  // visuals
  pitch = 0; roll = 0; lean = 0; heave = 0; pitchV = 0; rollV = 0;
  wheelSpin = 0;
  susp = [0, 0, 0, 0];
  slip = 0;
  skid = 0;
  airborne = false;
  landedImpact = 0;
  rpm = 0; gear = 1;
  // gameplay
  health = 100;
  stalled = false;
  tiresPopped = 0;
  sinking = 0;
  locked = false;
  siren = false;
  hazard = false;
  color: [number, number, number];
  plate: string;
  role: VehicleRole = "civilian";
  /** who is driving: "player" | npc id | null */
  driver: string | null = null;
  occupants: string[] = [];
  /** "rails" = kinematic lane follower; "physics" = full dynamics */
  mode: "rails" | "physics" = "physics";
  lastImpact = 0;
  impactTimer = 0;
  steerPull = 0;
  lastHitBy = 0;
  // interpolation
  px = 0; pz = 0; py = 0; pyaw = 0;
  // assists
  assist = { stability: 0.6, traction: true, steerSmoothing: true };
  // misc tags
  tag = "";
  cargo = 100;
  /** NPC crew (first = driver) — Character objects, typed loosely to avoid a cycle */
  crew: any[] = [];
  /** player has driven it (abandoned identified vehicle tracking) */
  playerUsed = false;
  parkedSpot = -1;
  despawnable = true;

  constructor(model: VehicleModel, x: number, z: number, yaw: number, seed = 0) {
    this.spec = VEHICLES[model];
    this.x = this.px = x; this.z = this.pz = z; this.yaw = this.pyaw = yaw;
    const c = this.spec.colors;
    this.color = [...c[(seed >>> 0) % c.length]] as [number, number, number];
    let p = "";
    let s = (seed * 2654435761 + this.id * 40503) >>> 0;
    for (let i = 0; i < 6; i++) { p += PLATE_CHARS[s % PLATE_CHARS.length]; s = Math.floor(s / 7) + 1013 * (i + 3); if (i === 1) p += " "; }
    this.plate = "PM " + p;
  }

  get speed() { return Math.hypot(this.vx, this.vz); }
  get fwdSpeed() { return this.vx * Math.sin(this.yaw) + this.vz * Math.cos(this.yaw); }
  get hw() { return this.spec.width / 2; }
  get hl() { return this.spec.length / 2; }
  get rect() { return { cx: this.x, cz: this.z, hw: this.hw, hl: this.hl, yaw: this.yaw }; }
  get invMass() { return 1 / this.spec.mass; }
  get inertia() { const s = this.spec; return (s.mass * (s.length * s.length + s.width * s.width)) / 12; }
  get conditionLabel() { return this.health > 70 ? "Good" : this.health > 40 ? "Damaged" : this.health > 0 ? "Critical" : "Stalled"; }

  savePrev() { this.px = this.x; this.pz = this.z; this.py = this.y; this.pyaw = this.yaw; }

  applyImpulse(px: number, pz: number, jx: number, jz: number) {
    const im = this.invMass;
    this.vx += jx * im; this.vz += jz * im;
    const rx = px - this.x, rz = pz - this.z;
    // yaw is rotation about +y; with x east/z north, torque_y = rz*jx - rx*jz
    this.w += (rz * jx - rx * jz) / this.inertia;
  }

  /** Damage from an impact with given normal speed change (m/s). */
  damage(dv: number) {
    if (dv < 3) return;
    const amt = (dv - 3) * (dv - 3) * 0.9 * (100 / this.spec.durability);
    this.health = Math.max(0, this.health - amt);
    this.lastImpact = dv;
    this.impactTimer = 0.4;
    if (this.health < 45 && this.steerPull === 0) this.steerPull = (this.id % 2 ? 1 : -1) * 0.05;
    if (this.health <= 0) this.stalled = true;
  }

  repair() {
    this.health = 100; this.stalled = false; this.steerPull = 0; this.tiresPopped = 0;
  }

  /** Full dynamics step. */
  step(dt: number, c: VehicleControls, env: VehicleEnv) {
    const s = this.spec;
    const sinY = Math.sin(this.yaw), cosY = Math.cos(this.yaw);
    // forward f = (sin, cos), right r = (cos, -sin)
    let vLong = this.vx * sinY + this.vz * cosY;
    let vLat = this.vx * cosY - this.vz * sinY;
    const speed = Math.hypot(vLong, vLat);

    // --- inputs with smoothing (keyboard friendly)
    const stalled = this.stalled || this.sinking > 0;
    const thr = stalled ? 0 : clamp(c.throttle, 0, 1);
    const brk = clamp(c.brake, 0, 1);
    this.throttleIn = thr; this.brakeIn = brk; this.handbrake = c.handbrake;
    const speedFactor = 1 / (1 + Math.max(0, Math.abs(vLong) - 4) / (s.moto ? 22 : 16));
    const steerTarget = clamp(c.steer + this.steerPull * (Math.abs(vLong) > 3 ? 1 : 0), -1, 1) * s.maxSteer * speedFactor;
    const rate = (Math.abs(steerTarget) < Math.abs(this.steer) ? s.steerRate * 1.6 : s.steerRate) * (this.assist.steerSmoothing ? 1 : 3);
    this.steer = approach(this.steer, steerTarget, rate * dt * Math.max(0.35, s.maxSteer));

    // --- ground
    const ground = env.height(this.x, this.z);
    const water = env.water(this.x, this.z);
    const surf = env.surface(this.x, this.z);
    let grip = SURFACE_GRIP[surf] * (surf === "asphalt" || surf === "concrete" ? 1 - env.wet * 0.15 : 1);
    if (this.tiresPopped) grip *= 0.55;
    if (this.health < 25) grip *= 0.9;

    // airborne / grounded vertical model on smooth terrain
    const gx = (env.height(this.x + 0.5, this.z) - env.height(this.x - 0.5, this.z));
    const gz = (env.height(this.x, this.z + 0.5) - env.height(this.x, this.z - 0.5));
    const slopeOk = Math.abs(gx) < 0.6 && Math.abs(gz) < 0.6;
    const gvy = slopeOk ? this.vx * gx + this.vz * gz : 0;
    const predicted = this.y + this.vy * dt;
    let grounded: boolean;
    if (ground >= predicted - 0.03 || (!this.airborne && ground > this.y - 0.35 && slopeOk)) {
      if (this.airborne && this.vy < -5) this.landedImpact = -this.vy;
      if (this.airborne && this.vy < -9) this.damage(-this.vy * 0.6);
      grounded = true;
      this.airborne = false;
      this.y = ground;
      this.vy = gvy;
    } else {
      grounded = false;
      this.airborne = true;
      this.vy -= G * dt;
      this.y += this.vy * dt;
    }

    // water: sinking disables the vehicle
    if (water !== null && this.y < water - 0.4) {
      this.sinking += dt;
      this.y = Math.max(this.y, water - 2.2);
      if (this.y <= water - 0.4) { this.vy = Math.max(this.vy, -0.8); }
      this.vx *= 1 - Math.min(1, 2.5 * dt); this.vz *= 1 - Math.min(1, 2.5 * dt); this.w *= 1 - Math.min(1, 2 * dt);
    }

    let ax = 0, az = 0, alpha = 0; // world accel, yaw accel
    const L = s.wheelbase;
    const a = s.cgFront * L, b = L - a;
    const m = s.mass;

    if (grounded && this.sinking === 0) {
      // --- longitudinal drive / brake
      const vAbs = Math.abs(vLong);
      const powerScale = (this.health < 50 ? 0.55 + 0.9 * (this.health / 100) : 1);
      let Fdrive = 0, Fbrake = 0;
      const top = s.topSpeed * (this.health < 30 ? 0.75 : 1);
      if (thr > 0) {
        if (vLong > -1.0) {
          const t = clamp(vLong / top, 0, 1);
          Fdrive = thr * s.engineForce * powerScale * Math.pow(1 - t, 0.65);
        } else {
          Fbrake = thr * s.brakeForce; // pressing W while rolling backwards brakes
        }
      }
      if (brk > 0) {
        if (vLong > 1.0) Fbrake += brk * s.brakeForce;
        else if (!stalled) {
          // reverse
          const t = clamp(-vLong / s.reverseSpeed, 0, 1);
          Fdrive -= brk * s.engineForce * 0.55 * (1 - t);
        }
      }
      // weight transfer from last step's accel
      const aLongPrev = this.lastALong;
      const transfer = (s.cgHeight / L) * m * aLongPrev;
      let Nf = clamp(m * G * (b / L) - transfer, m * G * 0.15, m * G * 0.85);
      let Nr = m * G - Nf;
      if (s.moto) { Nf = m * G * 0.5 - transfer * 0.6; Nr = m * G - Nf; }

      // slip angles
      const vlAbs = Math.max(Math.abs(vLong), 0.5);
      const slipF = Math.atan2(vLat + this.w * a, vlAbs) - Math.sign(vLong || 1) * this.steer;
      const slipR = Math.atan2(vLat - this.w * b, vlAbs);
      const muF = s.mu * grip, muR = s.mu * grip * (c.handbrake ? s.handbrakeGrip : 1);
      const kF = s.stiffF, kR = s.stiffR * (c.handbrake ? 0.6 : 1);
      let FyF = -tire(slipF, kF, muF) * Nf;
      let FyR = -tire(slipR, kR, muR) * Nr;

      // distribute drive
      const driveF = s.drive === "fwd" ? 1 : s.drive === "awd" ? 0.4 : 0;
      let FxF = Fdrive * driveF, FxR = Fdrive * (1 - driveF);
      // brakes: 65/35 front/rear; handbrake locks rear
      const sv = Math.sign(vLong);
      FxF -= sv * Fbrake * 0.65;
      FxR -= sv * Fbrake * 0.35;
      if (c.handbrake && vAbs > 0.5) FxR -= sv * Math.min(s.brakeForce * 0.4, muR * Nr * 0.7);

      // traction circle per axle
      const limF = muF * Nf * 1.05, limR = muR * Nr * 1.05;
      let combR = Math.hypot(FxR, FyR);
      if (combR > limR) {
        const tc = this.assist.traction && !c.handbrake;
        if (tc) FxR *= Math.max(0.3, Math.sqrt(Math.max(0, limR * limR - FyR * FyR)) / Math.max(1, Math.abs(FxR)));
        combR = Math.hypot(FxR, FyR);
        if (combR > limR) { const k = limR / combR; FxR *= k; FyR *= k; }
      }
      const combF = Math.hypot(FxF, FyF);
      if (combF > limF) { const k = limF / combF; FxF *= k; FyF *= k; }
      this.slip = Math.min(1, Math.max(Math.abs(slipR) * 3 + (c.handbrake && vAbs > 4 ? 0.6 : 0), Math.max(0, combR / limR - 0.95) * 6)
        * clamp(speed / 6, 0, 1));
      this.skid = Fbrake > 0 && vAbs > 8 && brk > 0.9 ? Math.min(1, this.skid + dt * 3) : Math.max(0, this.skid - dt * 3);

      const cs = Math.cos(this.steer), sn = Math.sin(this.steer);
      // forces in body frame (long, lat)
      let fLong = FxR + FxF * cs - FyF * sn;
      let fLat = FyR + FyF * cs + FxF * sn;
      // drag & rolling
      fLong -= s.drag * vLong * Math.abs(vLong) + s.rolling * vLong * (surf === "water" ? 6 : surf === "gravel" || surf === "dirt" ? 2 : 1);
      fLat -= s.drag * 0.5 * vLat * Math.abs(vLat);
      // yaw torque
      let torque = a * (FyF * cs + FxF * sn) - b * FyR;
      // yaw sign: body frame lateral is +right; positive yaw turns toward +right (clockwise from above)
      alpha = torque / this.inertia;

      // to world
      const aLong = fLong / m, aLat = fLat / m;
      this.lastALong = aLong;
      this.lastALat = aLat;
      ax = aLong * sinY + aLat * cosY;
      az = aLong * cosY - aLat * sinY;
      // slope gravity
      if (slopeOk) { ax -= G * gx * 0.98; az -= G * gz * 0.98; }

      // low speed: blend toward kinematic bicycle model for stability
      const blend = clamp((speed - 1.5) / 3.5, 0, 1);
      const wKin = (vLong * Math.tan(this.steer)) / L;
      if (blend < 1) {
        this.w += (wKin - this.w) * (1 - blend) * Math.min(1, 12 * dt);
        // kill lateral velocity at walking pace
        const kill = (1 - blend) * Math.min(1, 10 * dt);
        this.vx -= vLat * cosY * kill; this.vz -= -vLat * sinY * kill;
      }
      // stability assist: damp yaw toward the kinematic target (not while handbraking)
      if (!c.handbrake && this.assist.stability > 0 && speed > 4) {
        const excess = this.w - wKin;
        this.w -= excess * this.assist.stability * Math.min(1, 2.2 * dt);
      }
      // standstill friction
      if (thr === 0 && brk === 0 && speed < 0.4) { this.vx *= 0.85; this.vz *= 0.85; this.w *= 0.85; }
      if (brk > 0 && vLong > 0 && vLong < 1.0 && thr === 0) { this.vx *= 0.8; this.vz *= 0.8; }
    } else if (!grounded) {
      // airborne: keep momentum, slight drag; yaw damped
      this.w *= 1 - Math.min(1, 0.4 * dt);
      this.slip = 0;
    }

    this.vx += ax * dt; this.vz += az * dt;
    this.w += alpha * dt;
    this.w = clamp(this.w, -4, 4);
    this.yaw += this.w * dt;
    this.x += this.vx * dt; this.z += this.vz * dt;

    // --- visuals: wheel spin, suspension, pitch/roll/lean
    vLong = this.vx * Math.sin(this.yaw) + this.vz * Math.cos(this.yaw);
    this.wheelSpin += (vLong / 0.33) * dt;
    if (this.impactTimer > 0) this.impactTimer -= dt;
    this.updateSuspension(dt, env);
    if (s.moto) {
      const targetLean = clamp(Math.atan((vLong * this.w) / G), -0.8, 0.8) * clamp(Math.abs(vLong) / 4, 0, 1);
      this.lean += (targetLean - this.lean) * Math.min(1, 8 * dt);
    }
    // rpm & gear (simplified drive ratio presentation)
    const v = Math.abs(vLong);
    const band = s.topSpeed / s.gears;
    this.gear = vLong < -0.5 ? -1 : clamp(Math.floor(v / band) + 1, 1, s.gears);
    const inGear = this.gear < 0 ? v / s.reverseSpeed : (v - (this.gear - 1) * band) / band;
    const targetRpm = stalled ? 0 : 0.18 + 0.75 * clamp(inGear, 0, 1) * (this.gear === 1 ? 1 : 0.7 + 0.3) + thr * 0.08 + this.slip * 0.2;
    this.rpm += (targetRpm - this.rpm) * Math.min(1, 10 * dt);
  }

  lastALong = 0; lastALat = 0;

  updateSuspension(dt: number, env: VehicleEnv) {
    const s = this.spec;
    const sinY = Math.sin(this.yaw), cosY = Math.cos(this.yaw);
    const a = s.cgFront * s.wheelbase, b = s.wheelbase - a;
    const ht = s.moto ? 0 : s.track / 2;
    const wheels = [[-ht, a], [ht, a], [-ht, -b], [ht, -b]];
    const base = this.airborne ? this.y : env.height(this.x, this.z);
    let hF = 0, hR = 0, hL = 0, hRt = 0;
    for (let i = 0; i < 4; i++) {
      const [lx, lz] = wheels[i];
      const wx = this.x + cosY * lx + sinY * lz;
      const wz = this.z - sinY * lx + cosY * lz;
      const h = this.airborne ? base - 0.15 : env.surfaceHeight(wx, wz);
      const comp = clamp(h - base, -0.25, 0.25);
      this.susp[i] += (comp - this.susp[i]) * Math.min(1, s.suspStiff * 0.5 * dt);
      if (i < 2) hF += this.susp[i] / 2; else hR += this.susp[i] / 2;
      if (i % 2 === 0) hL += this.susp[i] / 2; else hRt += this.susp[i] / 2;
    }
    const tPitch = Math.atan2(hF - hR, s.wheelbase) + clamp(this.lastALong * 0.012, -0.08, 0.08) + (this.airborne ? -0.02 : 0);
    const tRoll = s.moto ? 0 : Math.atan2(hL - hRt, Math.max(0.5, s.track)) + clamp(this.lastALat * 0.012, -0.07, 0.07);
    // spring-damper for body motion
    const k = s.suspStiff, d = s.suspDamp;
    this.pitchV += ((tPitch - this.pitch) * k - this.pitchV * d) * dt;
    this.rollV += ((tRoll - this.roll) * k - this.rollV * d) * dt;
    this.pitch += this.pitchV * dt;
    this.roll += this.rollV * dt;
    this.heave = (hF + hR) / 2;
  }

  /** Terrain pitch from front/back sample — used by rails-mode traffic. */
  alignToGround(env: VehicleEnv) {
    this.y = env.height(this.x, this.z);
    this.airborne = false;
    this.vy = 0;
  }
}

/** Saturating tire curve: rises linearly, peaks at mu, slight falloff past the peak. */
function tire(slip: number, k: number, mu: number) {
  const x = (k * Math.abs(slip)) / mu;
  const f = x <= 1 ? x * (2 - x) : Math.max(0.82, 1 - 0.06 * (x - 1));
  return Math.sign(slip) * mu * f;
}
