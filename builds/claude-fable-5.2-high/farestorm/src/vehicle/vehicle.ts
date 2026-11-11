// Custom raycast-wheel arcade vehicle controller on top of a Rapier rigid body.
// Fixed 60 Hz. All forces are applied as impulses before the physics step; collisions are detected
// from the velocity change produced by the solver during the step.
import type RAPIER_NS from '@dimforge/rapier3d-compat';
import { PhysicsWorld, G_STATIC, G_TAXI, G_TRAFFIC, groups, GRAVITY, DT } from '../physics/physicsWorld';
import { TaxiSpec } from './taxiSpecs';
import { V3, Quat, clamp, clamp01, lerp, rotate, cross, dot, norm, len, quatYaw, sign } from '../core/math';
import { Surface, SURFACES, WORLD_W, WORLD_D } from '../world/galeport';
import { Pose } from '../world/model';

export interface InputFrame {
  throttle: number; // 0..1
  brake: number; // 0..1 (also reverse)
  steer: number; // -1..1, positive = right
  handbrake: boolean;
  boost: boolean;
  reset: boolean;
}
export const NEUTRAL_INPUT: InputFrame = { throttle: 0, brake: 0, steer: 0, handbrake: false, boost: false, reset: false };

export type VehicleEvent =
  | { type: 'collision'; severity: number; hard: boolean }
  | { type: 'surge' }
  | { type: 'gripTurn' }
  | { type: 'driftStart'; snap: boolean }
  | { type: 'driftEnd'; points: number; duration: number; clean: boolean; snap: boolean }
  | { type: 'air'; time: number; aligned: boolean }
  | { type: 'boostStart' }
  | { type: 'boostEnd' };

export interface WheelState {
  mount: V3; // local mount point
  front: boolean;
  grounded: boolean;
  compression: number;
  prevCompression: number;
  spin: number;
  steer: number;
  surface: Surface;
  slip: number; // 0..1 lateral saturation
  contact: V3;
}

const REST_LEN = 0.5;
const MAX_COMP = 0.34;
const MOUNT_Y = 0.05;
export const SURGE_WINDOW = 0.22;
export const SNAP_MIN_SPEED = 35 / 3.6;
export const DRIFT_MIN_SPEED = 35 / 3.6;
export const BOOST_DURATION = 2.2;
export const BOOST_MIN_START = 0.2;

export class Vehicle {
  body: RAPIER_NS.RigidBody;
  wheels: WheelState[] = [];
  events: VehicleEvent[] = [];
  // Kinematic state (refreshed after every physics step).
  pos: V3 = { x: 0, y: 0, z: 0 };
  quat: Quat = { x: 0, y: 0, z: 0, w: 1 };
  vel: V3 = { x: 0, y: 0, z: 0 };
  prevPos: V3 = { x: 0, y: 0, z: 0 };
  prevQuat: Quat = { x: 0, y: 0, z: 0, w: 1 };
  fwd: V3 = { x: 0, y: 0, z: 1 };
  right: V3 = { x: 1, y: 0, z: 0 };
  up: V3 = { x: 0, y: 1, z: 0 };
  speed = 0; // m/s magnitude
  fwdSpeed = 0;
  slipAngle = 0;
  groundedCount = 4;
  surface: Surface = 'asphalt';
  steerAngle = 0;
  // Technique state.
  drifting = false;
  driftTime = 0;
  driftPoints = 0;
  private driftSnap = false;
  private driftPath = 0;
  private driftStart: V3 = { x: 0, y: 0, z: 0 };
  private driftExit = 0;
  gripTurnTimer = 0;
  private gripTurnWindow = 0;
  private gripTurnCooldown = 0;
  surgeTimer = 0;
  private brakeReleaseAge = 99;
  private brakeReleaseOk = false;
  boostActive = false;
  tailwind = 0.35; // 0..1 meter
  airTime = 0;
  private wasAir = false;
  damage = 0; // 0..1 cosmetic/handling
  waterTime = 0;
  flipTime = 0;
  stuckTime = 0;
  outOfBounds = false;
  private collisionCooldown = 0;
  private vPre: V3 = { x: 0, y: 0, z: 0 };
  private prev: InputFrame = { ...NEUTRAL_INPUT };
  private inertia: V3;
  private localCom: V3 = { x: 0, y: -0.26, z: 0.04 };
  frozen = false;
  /** Scales the Surge Start / Grip Turn windows (assist setting). */
  windowScale = 1;
  /** Reduces steering lock for smoother keyboard control when > 1. */
  steerAssist = 1;

  constructor(private phys: PhysicsWorld, public spec: TaxiSpec, pose: Pose) {
    const R = phys.R;
    const h = spec.half;
    const m = spec.mass;
    const desc = R.RigidBodyDesc.dynamic().setCanSleep(false).setCcdEnabled(true).setLinearDamping(0.02).setAngularDamping(0.6);
    this.body = phys.world.createRigidBody(desc);
    const r = 0.1;
    phys.world.createCollider(
      R.ColliderDesc.roundCuboid(h.x - r, h.y - r, h.z - r, r).setTranslation(0, 0.1, 0).setDensity(0)
        .setFriction(0.04).setFrictionCombineRule(R.CoefficientCombineRule.Min).setRestitution(0.12)
        .setCollisionGroups(groups(G_TAXI, G_STATIC | G_TRAFFIC)),
      this.body,
    );
    const sx = h.x * 2, sy = h.y * 2, sz = h.z * 2;
    this.inertia = {
      x: (m / 12) * (sy * sy + sz * sz) * 1.35,
      y: (m / 12) * (sx * sx + sz * sz) * spec.yawInertia,
      z: (m / 12) * (sx * sx + sy * sy) * 2.4,
    };
    this.body.setAdditionalMassProperties(m, this.localCom, this.inertia, { x: 0, y: 0, z: 0, w: 1 }, true);
    for (const [sxn, szn] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
      this.wheels.push({
        mount: { x: (sxn * spec.track) / 2, y: MOUNT_Y, z: (szn * spec.wheelBase) / 2 }, front: szn > 0, grounded: true,
        compression: 0.1, prevCompression: 0.1, spin: 0, steer: 0, surface: 'asphalt', slip: 0, contact: { x: 0, y: 0, z: 0 },
      });
    }
    this.setPose(pose);
  }

  /** Height of the body origin above the road when resting on its suspension. */
  get rideHeight(): number {
    return REST_LEN - 0.1 + this.spec.wheelRadius - MOUNT_Y;
  }

  setPose(pose: Pose): void {
    const q = quatYaw(pose.yaw);
    this.body.setTranslation({ x: pose.x, y: pose.y + this.rideHeight + 0.05, z: pose.z }, true);
    this.body.setRotation(q, true);
    this.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    this.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    this.steerAngle = 0;
    this.endDrift(false, true);
    this.airTime = 0; this.wasAir = false; this.waterTime = 0; this.flipTime = 0; this.stuckTime = 0;
    this.outOfBounds = false;
    for (const w of this.wheels) { w.compression = 0.1; w.prevCompression = 0.1; }
    this.refresh();
    this.prevPos = { ...this.pos };
    this.prevQuat = { ...this.quat };
  }

  private refresh(): void {
    const t = this.body.translation(), q = this.body.rotation(), v = this.body.linvel();
    this.pos = { x: t.x, y: t.y, z: t.z };
    this.quat = { x: q.x, y: q.y, z: q.z, w: q.w };
    this.vel = { x: v.x, y: v.y, z: v.z };
    this.right = rotate(this.quat, { x: 1, y: 0, z: 0 });
    this.up = rotate(this.quat, { x: 0, y: 1, z: 0 });
    this.fwd = rotate(this.quat, { x: 0, y: 0, z: 1 });
    this.speed = len(this.vel);
    this.fwdSpeed = dot(this.vel, this.fwd);
    const vr = dot(this.vel, this.right);
    this.slipAngle = this.speed > 2 ? Math.atan2(vr, Math.abs(this.fwdSpeed)) : 0;
  }

  get yaw(): number {
    return Math.atan2(this.fwd.x, this.fwd.z);
  }
  get speedKmh(): number {
    return this.speed * 3.6;
  }
  addTailwind(amount: number): void {
    if (this.boostActive) return; // cannot recharge while active
    this.tailwind = clamp01(this.tailwind + amount);
  }
  repair(): void {
    this.damage = 0;
  }

  private endDrift(clean: boolean, silent = false): void {
    if (!this.drifting) return;
    this.drifting = false;
    if (silent) return;
    const net = Math.hypot(this.pos.x - this.driftStart.x, this.pos.z - this.driftStart.z);
    const disp = this.driftPath > 1 ? clamp01(net / (0.55 * this.driftPath)) : 0;
    const valid = clean && this.driftTime >= 0.4 && this.driftPoints >= 30;
    this.events.push({ type: 'driftEnd', points: valid ? Math.round(this.driftPoints * disp) : 0, duration: this.driftTime, clean: valid, snap: this.driftSnap });
  }

  /** Apply all vehicle forces for this tick. Call before PhysicsWorld.step(). */
  preStep(input: InputFrame): void {
    const dt = DT;
    const spec = this.spec, body = this.body, m = spec.mass;
    this.prevPos = { ...this.pos };
    this.prevQuat = { ...this.quat };
    if (this.frozen) {
      body.setLinvel({ x: 0, y: Math.min(0, this.vel.y), z: 0 }, true);
      body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      input = { ...NEUTRAL_INPUT, brake: 1 };
    }
    const q = this.quat, pos = this.pos;
    const fwd = this.fwd, right = this.right, up = this.up;
    const av = body.angvel();
    const com = body.worldCom();
    const lv = this.vel;
    const speed = this.speed, vF = this.fwdSpeed, vR = dot(lv, right);
    const prev = this.prev;
    const throttleEdge = input.throttle > 0.5 && prev.throttle <= 0.5;
    const brakeEdge = input.brake > 0.5 && prev.brake <= 0.5;
    const brakeRelease = input.brake <= 0.5 && prev.brake > 0.5;
    const handEdge = input.handbrake && !prev.handbrake;

    // ---- technique timers -------------------------------------------------
    this.gripTurnCooldown = Math.max(0, this.gripTurnCooldown - dt);
    this.gripTurnTimer = Math.max(0, this.gripTurnTimer - dt);
    this.gripTurnWindow = Math.max(0, this.gripTurnWindow - dt);
    this.surgeTimer = Math.max(0, this.surgeTimer - dt);
    this.brakeReleaseAge += dt;
    this.collisionCooldown = Math.max(0, this.collisionCooldown - dt);
    const grounded = this.groundedCount;

    // Surge Start: tap throttle within the window after releasing the brake at low speed.
    if (brakeRelease) { this.brakeReleaseAge = 0; this.brakeReleaseOk = speed < 3 && grounded >= 3; }
    let surgeNow = false;
    if (throttleEdge && this.brakeReleaseOk && this.brakeReleaseAge <= SURGE_WINDOW * this.windowScale && speed < 4 && this.surgeTimer <= 0 && !this.frozen) {
      this.surgeTimer = 0.9;
      this.brakeReleaseOk = false;
      surgeNow = true;
      this.events.push({ type: 'surge' });
    }
    // Grip Turn: during a drift, tap brake then throttle.
    if (this.drifting && brakeEdge) this.gripTurnWindow = 0.45 * this.windowScale;
    if (this.drifting && this.gripTurnWindow > 0 && this.gripTurnCooldown <= 0 && (throttleEdge || (brakeRelease && input.throttle > 0.5))) {
      this.gripTurnTimer = 0.55;
      this.gripTurnCooldown = 1.6;
      this.gripTurnWindow = 0;
      this.events.push({ type: 'gripTurn' });
    }
    // Tailwind boost.
    const wantBoost = input.boost && !this.frozen && this.tailwind > 0 && (this.boostActive || this.tailwind >= BOOST_MIN_START);
    if (wantBoost && !this.boostActive) this.events.push({ type: 'boostStart' });
    if (!wantBoost && this.boostActive) this.events.push({ type: 'boostEnd' });
    this.boostActive = wantBoost;
    if (this.boostActive) this.tailwind = Math.max(0, this.tailwind - dt / BOOST_DURATION);

    // ---- drift state --------------------------------------------------------
    const beta = this.slipAngle, absBeta = Math.abs(beta);
    if (!this.drifting) {
      const snap = handEdge && Math.abs(input.steer) > 0.5 && speed > SNAP_MIN_SPEED && grounded >= 3;
      if (snap || (input.handbrake && speed > 9 && Math.abs(input.steer) > 0.2 && grounded >= 2) || (absBeta > 0.3 && speed > 10 && grounded >= 2)) {
        this.drifting = true; this.driftTime = 0; this.driftPoints = 0; this.driftPath = 0; this.driftExit = 0;
        this.driftSnap = snap; this.driftStart = { ...pos };
        if (snap) body.applyTorqueImpulse({ x: 0, y: sign(input.steer) * spec.snapKick * this.inertia.y, z: 0 }, true);
        this.events.push({ type: 'driftStart', snap });
      }
    } else {
      const styleOk = SURFACES[this.surface].style && grounded >= 2;
      if (speed > DRIFT_MIN_SPEED && absBeta > 0.17 && styleOk) {
        this.driftTime += dt;
        this.driftPoints += 16 * speed * Math.min(absBeta, 0.9) * dt;
      }
      this.driftPath += speed * dt;
      if (absBeta < 0.14 && !input.handbrake) this.driftExit += dt; else this.driftExit = 0;
      if (this.driftExit > 0.15) this.endDrift(true);
      else if (speed < 5.5) this.endDrift(this.driftTime > 0.4);
    }

    // ---- steering -----------------------------------------------------------
    const gripSurf = SURFACES[this.surface].grip;
    const absV = Math.abs(vF);
    const limit = Math.atan((spec.gripFront * gripSurf * GRAVITY * 1.08 * spec.wheelBase) / Math.max(absV * absV, 30));
    let steerMax = Math.min(spec.steerMax, limit);
    if (this.drifting) {
      // Extra lock for catching slides, blended in with slide depth so small slides stay calm.
      const deep = input.handbrake ? 1 : clamp01((absBeta - 0.1) / 0.2);
      steerMax = Math.min(spec.steerMax, Math.max(steerMax * lerp(1, 2.6, deep), lerp(steerMax, 0.24, deep)));
    }
    steerMax /= this.steerAssist;
    const target = clamp(input.steer, -1, 1) * steerMax;
    const rate = (Math.abs(target) < Math.abs(this.steerAngle) ? spec.steerRate * 1.6 : spec.steerRate) * dt;
    this.steerAngle += clamp(target - this.steerAngle, -rate, rate);
    this.steerAngle = clamp(this.steerAngle, -spec.steerMax, spec.steerMax);

    // ---- longitudinal demand --------------------------------------------------
    let vTop = spec.topSpeed;
    let accel = spec.accel * (1 - 0.12 * this.damage);
    if (this.boostActive) { vTop *= 1.14; accel = accel * 1.85 + 2; }
    if (this.surgeTimer > 0) accel *= 1.9;
    let driveAcc = 0; // signed, along wheel forward
    let brakeAcc = 0;
    const reversing = input.brake > 0.1 && vF < 1.2 && input.throttle < 0.1;
    if (input.throttle > 0.02) {
      if (vF < -1.5) brakeAcc = spec.brake * input.throttle;
      else {
        const r = clamp01(vF / vTop);
        driveAcc = vF <= vTop ? accel * input.throttle * (1 - Math.pow(r, 2.4)) : -Math.min(4, (vF / vTop - 1) * 30);
      }
    }
    if (reversing) driveAcc = vF > -13 ? -5.5 * input.brake * (1 - Math.pow(clamp01(-vF / 13), 2)) : 0;
    else if (input.brake > 0.02) brakeAcc = Math.max(brakeAcc, spec.brake * input.brake);
    if (input.throttle <= 0.02 && !reversing && input.brake <= 0.02) brakeAcc = speed < 0.8 ? 3 : 0.7 + 0.012 * speed;
    if (!input.throttle && vF > vTop) driveAcc = -Math.min(4, (vF / vTop - 1) * 30);

    // ---- suspension + tyres -----------------------------------------------------
    const kSpring = (m * GRAVITY) / (4 * 0.1);
    const cDamp = 0.3 * m * Math.sqrt((4 * kSpring) / m);
    const n0 = (m * GRAVITY) / 4;
    const rayLen = REST_LEN + spec.wheelRadius;
    let groundedNow = 0;
    const avgN: V3 = { x: 0, y: 0, z: 0 };
    let bestSurface: Surface = this.surface;
    const hits: ({ p: V3; n: V3; load: number } | null)[] = [];
    for (const w of this.wheels) {
      const mw = rotate(q, w.mount);
      const ox = pos.x + mw.x, oy = pos.y + mw.y, oz = pos.z + mw.z;
      const hit = this.phys.castStatic(ox, oy, oz, -up.x, -up.y, -up.z, rayLen);
      w.prevCompression = w.compression;
      w.steer = w.front ? this.steerAngle : 0;
      if (!hit || dot(hit.normal, up) < 0.45) {
        w.grounded = false; w.compression = Math.max(0, w.compression - 2.5 * dt); w.slip = 0;
        hits.push(null);
        continue;
      }
      const comp = clamp(rayLen - hit.toi, 0, REST_LEN);
      w.compression = comp;
      w.grounded = true;
      groundedNow++;
      const compRate = (comp - w.prevCompression) / dt;
      let f = kSpring * comp + cDamp * compRate;
      if (comp > MAX_COMP) f += (comp - MAX_COMP) * kSpring * 7;
      f = clamp(f, 0, n0 * 5.5);
      const cp = { x: ox - up.x * hit.toi, y: oy - up.y * hit.toi, z: oz - up.z * hit.toi };
      w.contact = cp;
      body.applyImpulseAtPoint({ x: hit.normal.x * f * dt, y: hit.normal.y * f * dt, z: hit.normal.z * f * dt }, cp, true);
      avgN.x += hit.normal.x; avgN.y += hit.normal.y; avgN.z += hit.normal.z;
      w.surface = this.phys.surfaceOf(hit.handle, cp.x, cp.z);
      bestSurface = w.surface;
      hits.push({ p: cp, n: hit.normal, load: f });
    }
    if (groundedNow > 0) {
      // The drive surface is the worst surface under any wheel pair (two wheels on grass = grass).
      const counts = new Map<Surface, number>();
      for (const w of this.wheels) if (w.grounded) counts.set(w.surface, (counts.get(w.surface) ?? 0) + 1);
      let top = 0;
      for (const [s, c] of counts) if (c > top || (c === top && SURFACES[s].grip < SURFACES[bestSurface].grip)) { top = c; bestSurface = s; }
      this.surface = bestSurface;
    }
    const handbrakeOn = input.handbrake && speed > 2;
    let rearMul = 1, frontMul = 1;
    if (this.drifting) rearMul = lerp(1, spec.driftGrip, clamp01((absBeta - 0.12) / 0.25));
    if (handbrakeOn) rearMul = Math.min(rearMul, 0.46);
    if (this.gripTurnTimer > 0) { rearMul = Math.max(rearMul, 1) * 1.25; frontMul = 1.25; }
    const liftH = 0.3;
    for (let i = 0; i < 4; i++) {
      const hit = hits[i];
      const w = this.wheels[i];
      if (!hit) continue;
      const n = hit.n;
      const c = Math.cos(w.steer), s = Math.sin(w.steer);
      let f: V3 = { x: fwd.x * c + right.x * s, y: fwd.y * c + right.y * s, z: fwd.z * c + right.z * s };
      const fn = dot(f, n);
      f = norm({ x: f.x - n.x * fn, y: f.y - n.y * fn, z: f.z - n.z * fn });
      const side = cross(n, f);
      const rx = hit.p.x - com.x, ry = hit.p.y - com.y, rz = hit.p.z - com.z;
      const vx = lv.x + av.y * rz - av.z * ry, vy = lv.y + av.z * rx - av.x * rz, vz = lv.z + av.x * ry - av.y * rx;
      const vLong = vx * f.x + vy * f.y + vz * f.z;
      const vLat = vx * side.x + vy * side.y + vz * side.z;
      const sInfo = SURFACES[w.surface];
      const loadF = clamp(0.55 + (0.45 * hit.load) / n0, 0.4, 1.6);
      const mu = (w.front ? spec.gripFront * frontMul : spec.gripRear * rearMul) * sInfo.grip;
      const maxLat = mu * n0 * loadF * dt;
      const wantLat = -vLat * (m / 4) * 0.55;
      const jLat = clamp(wantLat, -maxLat, maxLat);
      w.slip = clamp01(Math.abs(wantLat) / (maxLat + 1e-6) - 0.6) * clamp01(speed / 6);
      // Longitudinal.
      let jLong = (driveAcc * m * dt) / Math.max(groundedNow, 2);
      let bAcc = brakeAcc;
      if (handbrakeOn && !w.front) bAcc = Math.max(bAcc, 15);
      if (bAcc > 0) {
        const maxB = (bAcc * m * dt) / 4;
        jLong += clamp(-vLong * (m / 4), -maxB, maxB);
      }
      const maxLong = 1.6 * sInfo.grip * n0 * loadF * dt;
      jLong = clamp(jLong, -maxLong, maxLong);
      const p = { x: hit.p.x + up.x * liftH, y: hit.p.y + up.y * liftH, z: hit.p.z + up.z * liftH };
      body.applyImpulseAtPoint({ x: side.x * jLat + f.x * jLong, y: side.y * jLat + f.y * jLong, z: side.z * jLat + f.z * jLong }, p, true);
      w.spin += (handbrakeOn && !w.front ? 0 : vLong / spec.wheelRadius) * dt;
    }
    this.groundedCount = groundedNow;

    // ---- body-level forces -------------------------------------------------------
    const gf = groundedNow / 4;
    const sInfo = SURFACES[this.surface];
    if (speed > 0.5 && groundedNow > 0) {
      // Surface drag and aerodynamic downforce.
      const drag = sInfo.drag * clamp01(speed / 8) * gf;
      const down = 0.0011 * speed * speed;
      body.applyImpulse({ x: (-lv.x / speed) * drag * m * dt - up.x * down * m * dt, y: (-lv.y / speed) * drag * m * dt - up.y * down * m * dt, z: (-lv.z / speed) * drag * m * dt - up.z * down * m * dt }, true);
    }
    if (surgeNow && groundedNow >= 2) body.applyImpulse({ x: fwd.x * m * 2.6, y: fwd.y * m * 2.6, z: fwd.z * m * 2.6 }, true);
    let yawTorque = 0;
    if (this.drifting && groundedNow >= 2) {
      // Arcade drift model.
      //  - Handbrake held: the car pivots hard and scrubs speed (deep slide, up to ~57 degrees).
      //  - Handbrake released: "exit assist" pulls the velocity onto the heading, so the cab goes
      //    where it points and keeps most of its speed. Grip Turn is a stronger, timed version.
      //  - A limiter and yaw damping stop the slide turning into a spin.
      const betaMax = 1.0;
      const assist = Math.max(0, 1 - absBeta / 0.85);
      const into = sign(input.steer) === -sign(beta) || absBeta < 0.12;
      const depth = handbrakeOn ? 1 : clamp01((absBeta - 0.08) / 0.2); // no twitchy assist once nearly straight
      yawTorque += input.steer * spec.driftYaw * (into ? assist : 1) * depth * (handbrakeOn ? 1.3 : 1) * (this.gripTurnTimer > 0 ? 1.5 : 1);
      if (absBeta > betaMax) yawTorque += sign(beta) * (absBeta - betaMax) * 16;
      yawTorque -= dot(av as V3, up) * (absBeta > 0.25 ? 1.7 : handbrakeOn ? 0 : 1.2);
      if (!handbrakeOn && speed > 5) {
        const kappa = (this.gripTurnTimer > 0 ? 0.095 : 0.042) * (input.throttle > 0.3 ? 1 : 0.5);
        const keep = input.throttle > 0.3 ? Math.abs(vR) * kappa * 0.6 : 0;
        body.applyImpulse({ x: (-right.x * vR * kappa + fwd.x * keep) * m, y: 0, z: (-right.z * vR * kappa + fwd.z * keep) * m }, true);
      }
    }
    const airborne = groundedNow === 0;
    let pitchTorque = 0;
    if (airborne) {
      yawTorque += input.steer * 1.3;
      pitchTorque = (input.brake - input.throttle) * 0.5;
    }
    // Upright recovery towards the ground normal (or world up in the air). Bounded.
    const tgt = groundedNow > 0 ? norm(avgN) : { x: 0, y: 1, z: 0 };
    const axis = cross(up, tgt);
    const kUp = airborne ? 9 : 14;
    const cUp = airborne ? 2.2 : 3.5;
    const avRoll = dot(av as V3, fwd), avPitch = dot(av as V3, right);
    const I = (this.inertia.x + this.inertia.z) / 2;
    let tx = (axis.x * kUp - (fwd.x * avRoll + right.x * avPitch) * cUp) * I * dt;
    let ty = (axis.y * kUp - (fwd.y * avRoll + right.y * avPitch) * cUp) * I * dt;
    let tz = (axis.z * kUp - (fwd.z * avRoll + right.z * avPitch) * cUp) * I * dt;
    tx += (up.x * yawTorque * this.inertia.y + right.x * pitchTorque * this.inertia.x) * dt;
    ty += (up.y * yawTorque * this.inertia.y + right.y * pitchTorque * this.inertia.x) * dt;
    tz += (up.z * yawTorque * this.inertia.y + right.z * pitchTorque * this.inertia.x) * dt;
    body.applyTorqueImpulse({ x: tx, y: ty, z: tz }, true);
    // Bounded angular velocity keeps collisions controllable.
    const av2 = body.angvel();
    const avl = Math.hypot(av2.x, av2.y, av2.z);
    if (avl > 4.2) body.setAngvel({ x: (av2.x / avl) * 4.2, y: (av2.y / avl) * 4.2, z: (av2.z / avl) * 4.2 }, true);

    const v = body.linvel();
    this.vPre = { x: v.x, y: v.y, z: v.z };
    this.prev = { ...input };
  }

  /** Read back the solver result, detect collisions/landings/failure states. Call after PhysicsWorld.step(). */
  postStep(input: InputFrame): void {
    const dt = DT;
    this.refresh();
    const dvx = this.vel.x - this.vPre.x, dvz = this.vel.z - this.vPre.z;
    const dH = Math.hypot(dvx, dvz);
    if (dH > 1.3 && this.collisionCooldown <= 0) {
      const hard = dH > 7.5;
      this.collisionCooldown = 0.35;
      this.damage = clamp01(this.damage + dH / 55);
      this.events.push({ type: 'collision', severity: dH, hard });
      if (this.drifting) { this.drifting = false; this.events.push({ type: 'driftEnd', points: 0, duration: this.driftTime, clean: false, snap: this.driftSnap }); }
    }
    // Air time / landing.
    if (this.groundedCount === 0) {
      this.airTime += dt;
      this.wasAir = true;
    } else if (this.wasAir && this.groundedCount >= 2) {
      if (this.airTime >= 0.45) this.events.push({ type: 'air', time: this.airTime, aligned: Math.abs(this.slipAngle) < 0.35 && this.up.y > 0.8 });
      this.airTime = 0;
      this.wasAir = false;
    }
    // Failure states.
    const groundY = this.phys.model.heightAt(this.pos.x, this.pos.z);
    if (groundY < -0.45 && this.pos.y < 1.0) this.waterTime += dt; else this.waterTime = 0;
    if (this.up.y < 0.3) this.flipTime += dt; else this.flipTime = 0;
    if (input.throttle > 0.5 && this.speed < 0.6 && !this.frozen) this.stuckTime += dt; else this.stuckTime = 0;
    this.outOfBounds = this.pos.y < -9 || this.pos.x < 3 || this.pos.x > WORLD_W - 3 || this.pos.z < 3 || this.pos.z > WORLD_D - 3;
  }

  get needsRespawn(): boolean {
    return this.waterTime > 0.9 || this.outOfBounds || this.flipTime > 2.6;
  }
  get canOfferReset(): boolean {
    return this.flipTime > 1.5 || this.stuckTime > 1.5;
  }
  /** Rear tyre slide intensity 0..1 for smoke and audio. */
  get slide(): number {
    return Math.max(this.wheels[2].slip, this.wheels[3].slip, this.drifting ? clamp01(Math.abs(this.slipAngle) * 2) : 0) * (this.groundedCount >= 2 ? 1 : 0);
  }
  drainEvents(): VehicleEvent[] {
    const e = this.events;
    this.events = [];
    return e;
  }
}
