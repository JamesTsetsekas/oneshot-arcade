// Shared kinematic character body (player, police, guards, rivals): Rapier capsule + character
// controller, with jump, contextual vault/mantle, swim and knock-down handling.
import { RAPIER, Physics, DT, GRP_CHAR, groups, G_QUERY, G_WORLD, G_VEH, G_PROP, RayHit } from '../physics/physics';
import { approach, clamp, wrapAngle, approachAngle } from '../core/math';
import { terrainH, waterDepthAt, WATER_Y, inCanal, CANAL, COAST_E, COAST_S } from '../world/district';

export interface Look { skin: number; top: number; bottom: number; hair: number; hat: number; pack: number; scale: number }
export type Pose = 'stand' | 'crouch' | 'down' | 'ride' | 'swim' | 'cower' | 'phone' | 'handsup' | 'aim' | 'sit' | 'talk' | 'mantle' | 'hidden';
/** What the renderer needs to draw any humanoid (player, actor or pedestrian). */
export interface HumanView { x: number; y: number; z: number; yaw: number; phase: number; gait: number; pose: Pose; look: Look; armed: number; lean: number }

export const CAP_R = 0.3, CAP_HH = 0.55, CAP_CENTER = CAP_R + CAP_HH; // feet -> capsule centre
const Q_MOVE = groups(G_QUERY, G_WORLD | G_VEH | G_PROP);
const GRAV = 22;
const _hit: RayHit = { dist: 0, nx: 0, ny: 0, nz: 0, body: null };
const _v = { x: 0, y: 0, z: 0 };

export type MoveState = 'normal' | 'mantle' | 'swim' | 'down' | 'vehicle';

export class CharBody {
  body: RAPIER.RigidBody; collider: RAPIER.Collider; ctrl: RAPIER.KinematicCharacterController;
  x = 0; y = 0; z = 0; px = 0; py = 0; pz = 0; yaw = 0;
  vx = 0; vy = 0; vz = 0; grounded = true; airTime = 0; fallSpeed = 0; landed = 0;
  state: MoveState = 'normal'; crouch = false;
  phase = 0; gait = 0; blocked = 0;
  private mT = 0; private mDur = 0; private mx0 = 0; private my0 = 0; private mz0 = 0; private mx1 = 0; private my1 = 0; private mz1 = 0;
  downTime = 0;

  constructor(public phys: Physics, x: number, y: number, z: number, yaw = 0) {
    this.body = phys.world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(x, y + CAP_CENTER, z));
    this.collider = phys.world.createCollider(RAPIER.ColliderDesc.capsule(CAP_HH, CAP_R).setCollisionGroups(GRP_CHAR), this.body);
    this.ctrl = phys.world.createCharacterController(0.03);
    this.ctrl.enableAutostep(0.42, 0.2, false);
    this.ctrl.enableSnapToGround(0.35);
    this.ctrl.setMaxSlopeClimbAngle((52 * Math.PI) / 180);
    this.ctrl.setMinSlopeSlideAngle((45 * Math.PI) / 180);
    this.ctrl.setApplyImpulsesToDynamicBodies(true);
    this.ctrl.setCharacterMass(75);
    this.x = this.px = x; this.y = this.py = y; this.z = this.pz = z; this.yaw = yaw;
  }
  dispose() { this.phys.world.removeCharacterController(this.ctrl); this.phys.world.removeRigidBody(this.body); }
  setEnabled(on: boolean) { this.collider.setEnabled(on); }
  teleport(x: number, y: number, z: number, yaw = this.yaw) {
    this.x = this.px = x; this.y = this.py = y; this.z = this.pz = z; this.yaw = yaw; this.vx = this.vy = this.vz = 0;
    _v.x = x; _v.y = y + CAP_CENTER; _v.z = z;
    this.body.setTranslation(_v, true);
    if (this.state !== 'vehicle') this.state = 'normal';
  }
  get speed2d() { return Math.hypot(this.vx, this.vz); }
  waterSurface(): number { return inCanal(this.x, this.z) ? CANAL.water : this.x > COAST_E || this.z < COAST_S ? WATER_Y : -99; }

  /** Try to start a vault/mantle in the facing direction. Returns true when a ledge was found. */
  tryMantle(dirYaw: number, maxH = 1.75): boolean {
    const fx = Math.sin(dirYaw), fz = Math.cos(dirYaw), ph = this.phys;
    let wall = -1;
    for (const h of [0.35, 0.9, 1.4]) {
      if (ph.castSolid(this.x, this.y + h, this.z, fx, 0, fz, 0.95, _hit)) { wall = wall < 0 ? _hit.dist : Math.min(wall, _hit.dist); }
    }
    if (wall < 0) return false;
    const tx = this.x + fx * (wall + 0.38), tz = this.z + fz * (wall + 0.38);
    const top = this.y + maxH + 0.6;
    if (!ph.castSolid(tx, top, tz, 0, -1, 0, maxH + 0.6, _hit)) return false;
    const ledgeY = top - _hit.dist, h = ledgeY - this.y;
    if (h < 0.4 || h > maxH || _hit.dist < 0.05) return false;
    if (ph.castSolid(tx, ledgeY + 0.15, tz, 0, 1, 0, 1.5, _hit)) return false; // no headroom
    this.startMantle(tx, ledgeY, tz, 0.28 + h * 0.2);
    return true;
  }
  startMantle(tx: number, ty: number, tz: number, dur: number) {
    this.state = 'mantle'; this.mT = 0; this.mDur = dur;
    this.mx0 = this.x; this.my0 = this.y; this.mz0 = this.z; this.mx1 = tx; this.my1 = ty; this.mz1 = tz;
    this.vx = this.vy = this.vz = 0;
  }
  knockDown(seconds: number, ix = 0, iz = 0) {
    if (this.state === 'vehicle') return;
    this.state = 'down'; this.downTime = seconds; this.vx = ix; this.vz = iz; this.vy = 2.5;
  }

  /**
   * Advance one fixed step. wishX/wishZ is the desired horizontal velocity in world space.
   * Must be called before the physics step; `sync()` after it.
   */
  step(wishX: number, wishZ: number, jump: boolean, faceYaw: number | null, dt: number = DT) {
    this.px = this.x; this.py = this.y; this.pz = this.z;
    if (this.state === 'vehicle') return;
    if (this.state === 'mantle') {
      this.mT += dt;
      const t = clamp(this.mT / this.mDur, 0, 1);
      const up = Math.min(1, t / 0.6), fw = t < 0.45 ? 0 : (t - 0.45) / 0.55;
      const e = (k: number) => k * k * (3 - 2 * k);
      _v.x = this.mx0 + (this.mx1 - this.mx0) * e(fw); _v.z = this.mz0 + (this.mz1 - this.mz0) * e(fw);
      _v.y = this.my0 + (this.my1 - this.my0) * e(up) + CAP_CENTER;
      this.body.setNextKinematicTranslation(_v);
      this.gait = 0.6; this.phase += dt * 6;
      if (t >= 1) { this.state = 'normal'; this.vy = 0; this.grounded = true; }
      return;
    }
    if (this.state === 'down') {
      this.downTime -= dt;
      wishX = 0; wishZ = 0; jump = false;
      if (this.downTime <= 0) this.state = 'normal';
    }
    // swim transitions
    const surf = this.waterSurface();
    const depth = waterDepthAt(this.x, this.z);
    if (this.state === 'normal' && depth > 1.5 && this.y < surf - 1.3) { this.state = 'swim'; this.vy *= 0.3; }
    else if (this.state === 'swim' && (depth < 1.2 || this.y > surf - 0.9)) this.state = 'normal';

    const swim = this.state === 'swim';
    const acc = swim ? 8 : this.grounded ? 34 : 7;
    this.vx = approach(this.vx, wishX, acc * dt); this.vz = approach(this.vz, wishZ, acc * dt);
    if (swim) {
      this.vy = clamp((surf - 1.38 - this.y) * 5, -3, 3);
    } else {
      if (this.grounded && this.vy <= 0) this.vy = -3; else this.vy -= GRAV * dt;
      if (jump && this.grounded && this.state === 'normal') { this.vy = Math.sqrt(2 * GRAV * 0.85); this.grounded = false; }
      if (this.vy < -40) this.vy = -40;
    }
    if (faceYaw !== null) this.yaw = approachAngle(this.yaw, faceYaw, 12 * dt);
    this.yaw = wrapAngle(this.yaw);

    _v.x = this.vx * dt; _v.y = this.vy * dt; _v.z = this.vz * dt;
    this.ctrl.computeColliderMovement(this.collider, _v, RAPIER.QueryFilterFlags.EXCLUDE_SENSORS, Q_MOVE);
    const m = this.ctrl.computedMovement();
    const wasGrounded = this.grounded;
    this.grounded = this.ctrl.computedGrounded();
    if (!this.grounded) { this.airTime += dt; this.fallSpeed = Math.min(this.fallSpeed, this.vy); }
    else {
      if (!wasGrounded && !swim) this.landed = -this.fallSpeed;
      this.airTime = 0; this.fallSpeed = 0;
    }
    const want = Math.hypot(_v.x, _v.z), got = Math.hypot(m.x, m.z);
    this.blocked = want > 1e-4 ? clamp(1 - got / want, 0, 1) : 0;
    if (this.vy > 0 && m.y < _v.y * 0.5) this.vy = 0; // bumped head
    _v.x = this.x + m.x; _v.y = this.y + m.y + CAP_CENTER; _v.z = this.z + m.z;
    // never tunnel under the terrain (steep heightfield steps)
    const floor = terrainH(_v.x, _v.z);
    if (_v.y - CAP_CENTER < floor - 1.2 && !swim) { _v.y = floor + CAP_CENTER + 0.05; this.vy = 0; }
    this.body.setNextKinematicTranslation(_v);
    const sp = got / dt;
    this.gait += ((sp / 4.4) - this.gait) * Math.min(1, dt * 10);
    this.phase += dt * (2.2 + sp * 1.55);
  }
  /** Read back the transform after the physics step. */
  sync() {
    if (this.state === 'vehicle') return;
    const t = this.body.translation();
    this.x = t.x; this.y = t.y - CAP_CENTER; this.z = t.z;
  }
}
