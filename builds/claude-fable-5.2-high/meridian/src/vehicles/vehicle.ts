// Raycast-wheel vehicle dynamics on top of Rapier rigid bodies.
// One model drives every vehicle in the city: the player's, traffic, police and mission actors.
// Per wheel: suspension ray -> spring/damper impulse, then an impulse-based tyre model with a
// friction circle. Assists (traction control, counter-steer, motorcycle auto-balance) sit on top.
import { RAPIER, Physics, DT, GRP_VEH, RayHit } from '../physics/physics';
import { VehicleSpec, VEHICLES } from './specs';
import { Bus } from '../core/events';
import { V3, Quat, v3, clamp, clamp01, approach, quatRotate, quatRotateInv, yawFromQuat, quatFromYaw, damp } from '../core/math';
import { areaAt, WATER_Y, inCanal, getBlock } from '../world/district';

export interface VehicleControls { throttle: number; brake: number; steer: number; handbrake: boolean; reverse: boolean; horn: boolean }
export type DriverKind = 'none' | 'player' | 'civilian' | 'police' | 'rival' | 'mission';
export type Surface = 'asphalt' | 'paver' | 'grass' | 'water';
export interface Wheel {
  lx: number; lz: number; front: boolean; driven: boolean;
  len: number; grounded: boolean; spin: number; slip: number; burst: boolean;
  cx: number; cy: number; cz: number;
}
export interface Assists { traction: boolean; stability: boolean }

const G = 9.81;
const _up = v3(), _fw = v3(), _rt = v3(), _o = v3(), _t = v3();
const _hit: RayHit = { dist: 0, nx: 0, ny: 0, nz: 0, body: null };
let nextId = 1;
const PLATE_CH = 'ABCDEFGHJKLMNPRSTUVWXYZ';

export function maxSteerAt(spec: VehicleSpec, speed: number): number {
  const s = Math.abs(speed) / 12;
  return spec.steerHigh + (spec.steerMax - spec.steerHigh) / (1 + s * s);
}

export class Vehicle {
  id = nextId++;
  spec: VehicleSpec;
  body: RAPIER.RigidBody;
  color: number;
  plate: string;
  ctl: VehicleControls = { throttle: 0, brake: 0, steer: 0, handbrake: false, reverse: false, horn: false };
  driver: DriverKind = 'none';
  // cached transform / motion (current and previous fixed step, for render interpolation)
  x = 0; y = 0; z = 0; q: Quat = { x: 0, y: 0, z: 0, w: 1 }; yaw = 0;
  px = 0; py = 0; pz = 0; pq: Quat = { x: 0, y: 0, z: 0, w: 1 };
  vx = 0; vy = 0; vz = 0; speed = 0; speedAbs = 0; yawRate = 0; sideSpeed = 0; upY = 1;
  wheels: Wheel[] = [];
  steerAngle = 0; rpm = 0.2; gear = 1; lean = 0;
  engine = 100; hull = 100; stalled = false; steerPull = 0; submerged = false;
  groundedWheels = 0; airTime = 0; flipTime = 0; restTime = 0; asleep = false;
  surface: Surface = 'asphalt'; skid = 0; brakeLight = false; siren = false; hazard = false;
  locked = false; owned = false; persistent = false; ref = ''; parkSpotId = -1; stolen = false;
  cargo = 100; // mission cargo integrity (Hot Cargo)
  lastImpact = 0; lastImpactTime = -99; everDriven = false;
  preVx = 0; preVz = 0;
  // derived tuning
  k: number; c: number; hpY: number; maxLen: number;

  constructor(spec: VehicleSpec, phys: Physics, x: number, y: number, z: number, yaw: number, color: number) {
    this.spec = spec; this.color = color;
    this.plate = Array.from({ length: 3 }, (_, i) => PLATE_CH[(this.id * 7 + i * 11 + (color & 15)) % PLATE_CH.length]).join('') + '-' + String(100 + ((this.id * 137) % 900));
    const w = (2 * Math.PI * spec.suspFreq);
    const mw = spec.mass / 4;
    this.k = mw * w * w; this.c = 2 * spec.suspDamp * Math.sqrt(this.k * mw);
    const sag = G / (w * w);
    this.hpY = spec.suspRest - sag + spec.wheelRadius;
    this.maxLen = spec.suspRest + spec.wheelRadius;
    const desc = RAPIER.RigidBodyDesc.dynamic().setTranslation(x, y + 0.05, z).setRotation(quatFromYaw(yaw))
      .setAngularDamping(spec.moto ? 1.2 : 0.5).setLinearDamping(0).setCcdEnabled(true).setCanSleep(true);
    this.body = phys.world.createRigidBody(desc);
    const bodyH = (spec.moto ? spec.height * 0.72 : spec.height) - spec.clearance;
    const hx = spec.width / 2 - 0.04, hy = bodyH / 2, hz = spec.length / 2 - 0.05;
    const hh = spec.height, l = spec.length, wd = Math.max(spec.width, 0.9);
    const inertia = { x: (spec.mass / 12) * (hh * hh + l * l), y: (spec.mass / 12) * (wd * wd + l * l) * (spec.moto ? 2.2 : 1.15), z: (spec.mass / 12) * (wd * wd + hh * hh) * 1.6 };
    phys.world.createCollider(RAPIER.ColliderDesc.cuboid(hx, hy, hz).setTranslation(0, spec.clearance + hy, 0)
      .setMassProperties(spec.mass, { x: 0, y: spec.comH, z: 0 }, inertia, { x: 0, y: 0, z: 0, w: 1 })
      .setFriction(0.25).setRestitution(0.12).setCollisionGroups(GRP_VEH), this.body);
    const tx = spec.track / 2, wz = spec.wheelbase / 2;
    for (const [lx, lz] of [[-tx, wz], [tx, wz], [-tx, -wz], [tx, -wz]]) {
      const front = lz > 0;
      this.wheels.push({ lx, lz, front, driven: spec.drive === 'awd' || (spec.drive === 'fwd') === front, len: spec.suspRest - sag, grounded: false, spin: 0, slip: 0, burst: false, cx: 0, cy: 0, cz: 0 });
    }
    this.x = this.px = x; this.y = this.py = y; this.z = this.pz = z; this.yaw = yaw;
    const q0 = quatFromYaw(yaw); this.q = { ...q0 }; this.pq = { ...q0 };
  }
  get isMoto() { return this.spec.moto; }
  /** World position of the driver's door (left side), used for enter/exit. */
  doorPos(out: V3, side = -1): V3 {
    quatRotate(this.q, side * (this.spec.width / 2 + 0.55), 0, this.spec.moto ? 0 : 0.15, out);
    out.x += this.x; out.y += this.y; out.z += this.z;
    return out;
  }
  wake() {
    if (this.asleep) { this.asleep = false; this.body.setGravityScale(1, true); }
    this.body.wakeUp(); this.restTime = 0;
  }
  teleport(x: number, y: number, z: number, yaw: number) {
    this.wake();
    this.body.setTranslation({ x, y: y + 0.05, z }, true); this.body.setRotation(quatFromYaw(yaw), true);
    this.body.setLinvel({ x: 0, y: 0, z: 0 }, true); this.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    this.x = this.px = x; this.y = this.py = y; this.z = this.pz = z; this.yaw = yaw;
    const q0 = quatFromYaw(yaw); this.q = { ...q0 }; this.pq = { ...q0 };
    this.vx = this.vy = this.vz = 0; this.speed = this.speedAbs = 0;
  }
  repair() { this.engine = 100; this.hull = 100; this.stalled = false; this.steerPull = 0; for (const w of this.wheels) w.burst = false; }
  damage(amount: number, zone: 'front' | 'rear' | 'side' = 'front', sideSign = 0) {
    this.hull = Math.max(0, this.hull - amount);
    this.engine = Math.max(0, this.engine - amount * (zone === 'front' ? 1 : zone === 'side' ? 0.5 : 0.3));
    if (zone === 'side') this.steerPull = clamp(this.steerPull + sideSign * amount * 0.0012, -0.06, 0.06);
    if (this.engine <= 0) this.stalled = true;
  }
}

export class VehicleSystem {
  list: Vehicle[] = [];
  byHandle = new Map<number, Vehicle>();
  wetness = 0;
  assists: Assists = { traction: true, stability: true };
  time = 0;
  constructor(public phys: Physics, public bus: Bus) {}

  spawn(type: string, x: number, z: number, yaw: number, color?: number, y?: number): Vehicle {
    const spec = VEHICLES[type];
    const gy = y ?? this.phys.groundBelow(x, 40, z);
    const v = new Vehicle(spec, this.phys, x, gy, z, yaw, color ?? spec.colors[0]);
    this.list.push(v); this.byHandle.set(v.body.handle, v);
    return v;
  }
  remove(v: Vehicle) {
    const i = this.list.indexOf(v);
    if (i < 0) return;
    this.list.splice(i, 1); this.byHandle.delete(v.body.handle);
    this.phys.world.removeRigidBody(v.body);
  }
  fromBody(b: RAPIER.RigidBody | null): Vehicle | null { return b ? this.byHandle.get(b.handle) ?? null : null; }
  nearest(x: number, z: number, maxDist: number, filter?: (v: Vehicle) => boolean): Vehicle | null {
    let best: Vehicle | null = null, bd = maxDist * maxDist;
    for (const v of this.list) {
      const d = (v.x - x) * (v.x - x) + (v.z - z) * (v.z - z);
      if (d < bd && (!filter || filter(v))) { bd = d; best = v; }
    }
    return best;
  }

  /** Apply suspension, tyre and assist impulses. Call before the physics step. */
  preStep(dt: number = DT) {
    this.time += dt;
    for (const v of this.list) this.stepVehicle(v, dt);
  }

  private stepVehicle(v: Vehicle, dt: number) {
    const b = v.body, spec = v.spec, ctl = v.ctl;
    if (v.asleep) {
      if (b.isSleeping() && v.driver === 'none') return;
      v.asleep = false; b.setGravityScale(1, true);
    }
    const t = b.translation(), q = b.rotation(), lv = b.linvel(), av = b.angvel();
    quatRotate(q, 0, 1, 0, _up); quatRotate(q, 0, 0, 1, _fw); quatRotate(q, 1, 0, 0, _rt);
    const ux = _up.x, uy = _up.y, uz = _up.z, fx = _fw.x, fy = _fw.y, fz = _fw.z, rx = _rt.x, ry = _rt.y, rz = _rt.z;
    const comX = t.x + ux * spec.comH, comY = t.y + uy * spec.comH, comZ = t.z + uz * spec.comH;
    const speedF = lv.x * fx + lv.y * fy + lv.z * fz;
    const speedS = lv.x * rx + lv.y * ry + lv.z * rz;
    const speedAbs = Math.hypot(lv.x, lv.z);

    // --- surface & grip
    const a = areaAt(t.x, t.z);
    let surf: Surface = 'asphalt', surfMul = 1;
    if (inCanal(t.x, t.z) && t.y < -2) { surf = 'water'; surfMul = 0.72; }
    else if (a.kind === 'block' && a.bx >= 0 && getBlock(a.bx, a.bz).lot === 'park') { surf = 'grass'; surfMul = 0.78; }
    else if (a.kind !== 'road' && a.kind !== 'intersection') { surf = 'paver'; surfMul = 0.96; }
    v.surface = surf;
    const gripMul = surfMul * (1 - 0.2 * this.wetness);

    // --- controls -> steering angle (smoothed, speed sensitive, optional counter-steer assist)
    const hasDriver = v.driver !== 'none';
    let steerTarget = clamp(ctl.steer, -1, 1) * maxSteerAt(spec, speedF) + v.steerPull;
    if (this.assists.stability && v.driver === 'player' && speedAbs > 7 && v.groundedWheels >= 2 && !ctl.handbrake) {
      const beta = Math.atan2(speedS, Math.abs(speedF) + 0.5);
      steerTarget += clamp(beta * 0.45, -0.22, 0.22);
    }
    const rate = Math.abs(steerTarget) < Math.abs(v.steerAngle) ? 3.6 : 2.2;
    v.steerAngle = approach(v.steerAngle, steerTarget, rate * dt);

    // --- drive force
    const engineFactor = v.stalled || v.submerged ? 0 : v.engine < 20 ? 0.45 : v.engine < 50 ? 0.72 : 1;
    let drive = 0;
    const throttle = hasDriver ? clamp01(ctl.throttle) : 0;
    let brake = hasDriver ? clamp01(ctl.brake) : 0;
    if (throttle > 0 && engineFactor > 0) {
      const vabs = Math.abs(speedF);
      const top = ctl.reverse ? 9 : spec.topSpeed * (v.engine < 50 ? 0.8 : 1);
      let F = Math.min(spec.maxForce, spec.power / Math.max(vabs, 3)) * throttle * engineFactor;
      if (vabs > top * 0.9) F *= clamp01((top - vabs) / (top * 0.1));
      drive = ctl.reverse ? -F * 0.6 : F;
    }
    const idleHold = throttle === 0 && brake === 0 && Math.abs(speedF) < 0.7;
    if (idleHold) brake = 0.35;
    if (!hasDriver) brake = Math.max(brake, 0.5);
    v.brakeLight = (hasDriver && ctl.brake > 0.05) || (hasDriver && idleHold && v.driver !== 'player');
    const handbrake = hasDriver ? ctl.handbrake : false;
    const nDriven = spec.drive === 'awd' ? 4 : 2;

    // --- wheels
    let Jx = 0, Jy = 0, Jz = 0, Tx = 0, Ty = 0, Tz = 0, grounded = 0, skid = 0;
    const mw = spec.mass / 4;
    const downX = -ux, downY = -uy, downZ = -uz;
    for (let i = 0; i < 4; i++) {
      const w = v.wheels[i];
      quatRotate(q, w.lx, v.hpY, w.lz, _o);
      const ox = t.x + _o.x, oy = t.y + _o.y, oz = t.z + _o.z;
      w.grounded = false; w.slip = 0;
      if (uy < 0.15 || !this.phys.castWorld(ox, oy, oz, downX, downY, downZ, v.maxLen, _hit) || _hit.ny < 0.3) {
        w.len = approach(w.len, spec.suspRest, 2 * dt);
        w.spin += (speedF / spec.wheelRadius) * dt;
        continue;
      }
      const nx = _hit.nx, ny = _hit.ny, nz = _hit.nz;
      let suspLen = _hit.dist - spec.wheelRadius;
      const minLen = spec.suspRest - spec.suspTravel;
      const cx = ox + downX * _hit.dist, cy = oy + downY * _hit.dist, cz = oz + downZ * _hit.dist;
      w.cx = cx; w.cy = cy; w.cz = cz;
      const relX = cx - comX, relY = cy - comY, relZ = cz - comZ;
      const pvx = lv.x + (av.y * relZ - av.z * relY), pvy = lv.y + (av.z * relX - av.x * relZ), pvz = lv.z + (av.x * relY - av.y * relX);
      const vn = pvx * nx + pvy * ny + pvz * nz;
      const comp = spec.suspRest - suspLen;
      let Fs = v.k * comp - v.c * vn;
      if (suspLen < minLen) { Fs += v.k * 5 * (minLen - suspLen); suspLen = minLen; }
      Fs = clamp(Fs, 0, spec.mass * G * 2.5);
      w.len = suspLen; w.grounded = true; grounded++;
      const N = Fs;
      // suspension impulse along the ground normal at the contact
      let ix = nx * Fs * dt, iy = ny * Fs * dt, iz = nz * Fs * dt;
      Jx += ix; Jy += iy; Jz += iz;
      Tx += relY * iz - relZ * iy; Ty += relZ * ix - relX * iz; Tz += relX * iy - relY * ix;

      // tyre basis on the ground plane
      const sa = w.front ? v.steerAngle : 0;
      const sn = Math.sin(sa), cs = Math.cos(sa);
      let wfx = fx * cs + rx * sn, wfy = fy * cs + ry * sn, wfz = fz * cs + rz * sn;
      const d = wfx * nx + wfy * ny + wfz * nz;
      wfx -= nx * d; wfy -= ny * d; wfz -= nz * d;
      const fl = Math.hypot(wfx, wfy, wfz) || 1; wfx /= fl; wfy /= fl; wfz /= fl;
      const sx = ny * wfz - nz * wfy, sy = nz * wfx - nx * wfz, sz = nx * wfy - ny * wfx;
      const vF = pvx * wfx + pvy * wfy + pvz * wfz, vS = pvx * sx + pvy * sy + pvz * sz;

      const mu = (w.front ? spec.gripF : spec.gripR) * gripMul * (w.burst ? 0.45 : 1);
      const limit = mu * N * dt;
      let jLat = -vS * mw * 0.9;
      let jLong = 0;
      if (w.driven && drive !== 0) {
        jLong = (drive / nDriven) * dt;
        if (this.assists.traction || v.driver !== 'player') jLong = clamp(jLong, -0.9 * limit, 0.9 * limit);
      }
      const locked = handbrake && !w.front;
      if (locked) {
        jLong = clamp(-vF * mw, -limit * 0.85, limit * 0.85);
        const latLim = limit * spec.handbrakeGrip;
        if (Math.abs(jLat) > latLim) { jLat = Math.sign(jLat) * latLim; w.slip = 1; }
        if (Math.abs(vF) > 3) w.slip = 1;
      } else if (brake > 0) {
        const fb = brake * spec.brakeForce * (w.front ? 0.6 : 0.4) * 0.5 * dt;
        jLong += clamp(-vF * mw, -fb, fb);
      }
      const mag = Math.hypot(jLong, jLat);
      if (mag > limit && mag > 1e-6) {
        const over = mag / limit;
        const s = (limit / mag) * (over > 1.15 ? 0.88 : 1); // sliding friction is a little lower than peak
        jLong *= s; jLat *= s;
        w.slip = Math.max(w.slip, clamp01((over - 1) * 1.5));
      }
      if (!locked) w.spin += (vF / spec.wheelRadius) * dt;
      if (speedAbs > 3) skid = Math.max(skid, w.slip);
      // apply closer to the CoM height to tame roll/pitch (arcade stability)
      const hc = (comX - cx) * nx + (comY - cy) * ny + (comZ - cz) * nz;
      const rl = hc * (1 - spec.rollInfluence), pl = hc * 0.6;
      ix = sx * jLat; iy = sy * jLat; iz = sz * jLat;
      let ax = relX + nx * rl, ay = relY + ny * rl, az = relZ + nz * rl;
      Jx += ix; Jy += iy; Jz += iz;
      Tx += ay * iz - az * iy; Ty += az * ix - ax * iz; Tz += ax * iy - ay * ix;
      ix = wfx * jLong; iy = wfy * jLong; iz = wfz * jLong;
      ax = relX + nx * pl; ay = relY + ny * pl; az = relZ + nz * pl;
      Jx += ix; Jy += iy; Jz += iz;
      Tx += ay * iz - az * iy; Ty += az * ix - ax * iz; Tz += ax * iy - ay * ix;
    }
    v.groundedWheels = grounded;
    v.skid += (skid - v.skid) * damp(10, dt);

    // --- body forces: drag, rolling resistance, engine braking, light downforce
    const cd = spec.drag * 1.25;
    Jx -= lv.x * speedAbs * cd * dt; Jz -= lv.z * speedAbs * cd * dt;
    if (grounded >= 2) {
      const res = (0.015 * spec.mass * G + (throttle === 0 ? 0.5 * spec.mass : 0)) * dt * clamp(speedF / 1.5, -1, 1);
      Jx -= fx * res; Jy -= fy * res; Jz -= fz * res;
      const down = 0.35 * speedAbs * speedAbs * dt;
      Jx -= ux * down; Jy -= uy * down; Jz -= uz * down;
    }
    if (v.submerged) { Jx -= lv.x * spec.mass * 2 * dt; Jz -= lv.z * spec.mass * 2 * dt; Jy += spec.mass * 5 * dt - lv.y * spec.mass * 2 * dt; }
    _t.x = Jx; _t.y = Jy; _t.z = Jz; b.applyImpulse(_t, true);
    _t.x = Tx; _t.y = Ty; _t.z = Tz; b.applyTorqueImpulse(_t, true);

    // --- attitude assists
    if (spec.moto) {
      // auto-balance: drive the roll rate so the bike stays upright; visual lean is cosmetic
      const w2 = b.angvel();
      const rollRate = w2.x * fx + w2.y * fy + w2.z * fz;
      const target = clamp(-9 * ry, -7, 7);
      const dr = target - rollRate;
      _t.x = w2.x + fx * dr; _t.y = w2.y + fy * dr; _t.z = w2.z + fz * dr;
      b.setAngvel(_t, true);
    } else if (grounded === 0 && uy > -0.2) {
      // airborne: keep the horizon, damp tumbling
      const w2 = b.angvel(), k = 1 - 1.5 * dt;
      _t.x = w2.x * k + (uy * 0 - uz * 1) * 2.2 * dt; _t.y = w2.y * k; _t.z = w2.z * k + (ux * 1 - uy * 0) * 2.2 * dt;
      b.setAngvel(_t, true);
    }
    const pre = b.linvel();
    v.preVx = pre.x; v.preVz = pre.z;
    v.airTime = grounded === 0 ? v.airTime + dt : 0;
  }

  /** Read back transforms, detect impacts, update damage and derived state. Call after the physics step. */
  postStep(dt: number = DT) {
    for (const v of this.list) {
      v.px = v.x; v.py = v.y; v.pz = v.z; v.pq.x = v.q.x; v.pq.y = v.q.y; v.pq.z = v.q.z; v.pq.w = v.q.w;
      if (v.asleep) continue;
      const b = v.body, t = b.translation(), q = b.rotation(), lv = b.linvel(), av = b.angvel();
      v.x = t.x; v.y = t.y; v.z = t.z; v.q.x = q.x; v.q.y = q.y; v.q.z = q.z; v.q.w = q.w;
      v.yaw = yawFromQuat(q);
      quatRotateInv(q, lv.x, lv.y, lv.z, _o);
      v.speed = _o.z; v.sideSpeed = _o.x; v.speedAbs = Math.hypot(lv.x, lv.z);
      quatRotate(q, 0, 1, 0, _up); v.upY = _up.y;
      v.yawRate = av.x * _up.x + av.y * _up.y + av.z * _up.z;
      const dvx = lv.x - v.preVx, dvz = lv.z - v.preVz, dv = Math.hypot(dvx, dvz);
      v.vx = lv.x; v.vy = lv.y; v.vz = lv.z;
      if (dv > 2.2 && this.time - v.lastImpactTime > 0.12) {
        quatRotateInv(q, dvx, 0, dvz, _o);
        const side = Math.abs(_o.x) > Math.abs(_o.z);
        const dmg = (dv - 2.2) * 2.4;
        v.damage(dmg, side ? 'side' : _o.z < 0 ? 'front' : 'rear', Math.sign(_o.x));
        v.cargo = Math.max(0, v.cargo - dmg * 0.9);
        v.lastImpact = dv; v.lastImpactTime = this.time;
        this.bus.emit('vehicleImpact', { vehicleId: v.id, dv, x: v.x, y: v.y + 0.6, z: v.z, byPlayer: v.driver === 'player' });
      }
      // gears / rpm for audio + HUD
      const top = v.spec.topSpeed, f = clamp01(Math.abs(v.speed) / top);
      const bands = [0, 0.13, 0.27, 0.44, 0.63, 0.82, 1.01];
      let g = 1; while (g < 6 && f > bands[g]) g++;
      v.gear = v.speed < -0.5 ? 0 : g;
      const inBand = (f - bands[g - 1]) / (bands[g] - bands[g - 1]);
      const targetRpm = v.stalled ? 0 : 0.22 + 0.7 * clamp01(inBand) * (0.55 + 0.45 * clamp01(v.ctl.throttle)) + 0.1 * clamp01(v.ctl.throttle);
      v.rpm += (targetRpm - v.rpm) * damp(v.driver === 'none' ? 2 : 7, dt);
      const leanT = v.spec.moto ? clamp((v.speed * v.yawRate) / 9.81, -0.75, 0.75) : 0;
      v.lean += (leanT - v.lean) * damp(6, dt);
      // water
      if (!v.submerged && t.y < WATER_Y - 0.9 && areaAt(t.x, t.z).kind === 'sea') { v.submerged = true; v.stalled = true; this.bus.emit('vfx', { kind: 'splash', x: t.x, y: WATER_Y, z: t.z, n: 30 }); this.bus.emit('sfx', { name: 'splash', x: t.x, y: WATER_Y, z: t.z }); }
      // flip recovery (keeps traffic and the player from being stranded on a roof)
      if (v.upY < 0.35 && v.speedAbs < 2.5 && !v.submerged) {
        v.flipTime += dt;
        if (v.flipTime > 2.2) {
          b.setRotation(quatFromYaw(v.yaw), true); b.setTranslation({ x: t.x, y: t.y + 0.9, z: t.z }, true);
          b.setLinvel({ x: 0, y: 0, z: 0 }, true); b.setAngvel({ x: 0, y: 0, z: 0 }, true); v.flipTime = 0;
        }
      } else v.flipTime = 0;
      // custom sleep for empty, settled vehicles (raycast suspension would otherwise keep them awake)
      if (v.driver === 'none' && v.speedAbs < 0.15 && Math.abs(lv.y) < 0.15 && Math.hypot(av.x, av.y, av.z) < 0.15 && v.groundedWheels >= 3) {
        v.restTime += dt;
        if (v.restTime > 1.0) {
          v.asleep = true; b.setLinvel({ x: 0, y: 0, z: 0 }, false); b.setAngvel({ x: 0, y: 0, z: 0 }, false);
          b.setGravityScale(0, false); b.sleep();
          v.px = v.x; v.py = v.y; v.pz = v.z; v.pq = { ...v.q }; v.vx = v.vy = v.vz = 0; v.speed = v.speedAbs = 0;
        }
      } else v.restTime = 0;
    }
  }
}

/** Pure-pursuit steering toward a world point. Returns steer input in [-1,1]. */
export function steerToward(v: Vehicle, tx: number, tz: number): number {
  const dx = tx - v.x, dz = tz - v.z;
  const c = Math.cos(v.yaw), s = Math.sin(v.yaw);
  let lx = dx * c - dz * s, lz = dx * s + dz * c;
  let d2 = lx * lx + lz * lz;
  if (d2 < 0.01) return 0;
  if (lz < 0) return lx >= 0 ? 1 : -1;
  // a far target is pulled in along its bearing so the arc stays tight (look-ahead of 7-16 m)
  const maxL = clamp(7 + Math.abs(v.speed) * 0.45, 7, 16);
  if (d2 > maxL * maxL) { const k = maxL / Math.sqrt(d2); lx *= k; lz *= k; d2 = maxL * maxL; }
  const delta = Math.atan((2 * v.spec.wheelbase * lx) / d2);
  return clamp(delta / maxSteerAt(v.spec, v.speed), -1, 1);
}
/** Simple longitudinal controller used by all AI drivers. */
export function driveToSpeed(v: Vehicle, target: number) {
  const err = target - v.speed, c = v.ctl;
  c.reverse = false;
  if (target <= 0.15) { c.throttle = 0; c.brake = v.speed > 4 ? 1 : v.speed > 0.4 ? 0.6 : 0.5; return; }
  if (err > 0) { c.throttle = clamp(err * 0.45 + 0.08, 0, 1); c.brake = 0; }
  else { c.throttle = 0; c.brake = err < -1.2 ? clamp(-err * 0.22, 0, 1) : 0; }
}
