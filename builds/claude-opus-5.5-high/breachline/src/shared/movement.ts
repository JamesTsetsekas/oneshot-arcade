// Deterministic fixed-step capsule (AABB-approximated) movement shared by the
// authoritative room and any future client prediction. No rendering imports.
import { CollisionWorld, Box } from "./collision";
import { Vec3, flatForward, flatRight, clamp } from "./math";
import { MOVE } from "../content/tuning";

export interface MantleState { t: number; dur: number; from: Vec3; to: Vec3; crouchAfter: boolean }

export interface MoveState {
  pos: Vec3;
  vel: Vec3;
  onGround: boolean;
  crouch: boolean;
  sprinting: boolean;
  sprintHold: number;
  mantle: MantleState | null;
  /** seconds since landing for landing impulse visuals */
  landT: number;
  landSpeed: number;
  jumpPrev: boolean;
  /** distance moved this tick (horizontal) */
  moved: number;
}

export interface MoveInput {
  mx: number; // strafe -1..1 (right +)
  mz: number; // forward -1..1
  yaw: number;
  jump: boolean;
  crouch: boolean;
  sprint: boolean;
  ads: number; // 0..1 ads progress
  adsMove: number; // ADS speed multiplier at full ADS
  canSprint: boolean;
  sprintDelay: number;
  mantleTime: number;
  speedMult?: number;
}

export function newMoveState(pos: Vec3): MoveState {
  return { pos: { ...pos }, vel: { x: 0, y: 0, z: 0 }, onGround: true, crouch: false, sprinting: false, sprintHold: 0, mantle: null, landT: 9, landSpeed: 0, jumpPrev: false, moved: 0 };
}

export const heightOf = (s: MoveState) => (s.crouch ? MOVE.crouchHeight : MOVE.standHeight);

const tmpMin = { x: 0, y: 0, z: 0 }, tmpMax = { x: 0, y: 0, z: 0 };
function aabbAt(x: number, y: number, z: number, h: number, r = MOVE.radius) {
  tmpMin.x = x - r; tmpMin.y = y; tmpMin.z = z - r;
  tmpMax.x = x + r; tmpMax.y = y + h; tmpMax.z = z + r;
}
export function fits(world: CollisionWorld, x: number, y: number, z: number, h: number, r = MOVE.radius): boolean {
  aabbAt(x, y + 0.002, z, h - 0.004, r);
  return !world.overlaps(tmpMin, tmpMax);
}

const overlapBuf: Box[] = [];
/** Highest box top under the footprint in [y - down, y + up]. */
export function groundHeight(world: CollisionWorld, x: number, y: number, z: number, down: number, up = 0.01, r = MOVE.radius): number {
  tmpMin.x = x - r + 0.02; tmpMin.z = z - r + 0.02; tmpMax.x = x + r - 0.02; tmpMax.z = z + r - 0.02;
  tmpMin.y = y - down; tmpMax.y = y + up;
  world.overlapping(tmpMin, tmpMax, overlapBuf);
  let best = -Infinity;
  for (const b of overlapBuf) if (b.max.y <= y + up + 1e-6 && b.max.y > best) best = b.max.y;
  return best;
}

/** Try to find a valid mantle target ahead of the player. */
export function findMantle(world: CollisionWorld, s: MoveState, yaw: number): { to: Vec3; crouchAfter: boolean } | null {
  const f = flatForward(yaw);
  const p = s.pos;
  // Something must block us at waist/chest level directly ahead.
  const probeDist = MOVE.radius + 0.3;
  const px = p.x + f.x * probeDist, pz = p.z + f.z * probeDist;
  const top = groundHeight(world, px, p.y + MOVE.mantleMax, pz, MOVE.mantleMax - MOVE.mantleMin + 0.02, 0.0, 0.12);
  if (!isFinite(top)) return null;
  const rise = top - p.y;
  if (rise < MOVE.mantleMin - 0.02 || rise > MOVE.mantleMax + 0.02) return null;
  // Target: a little past the edge.
  for (const reach of [MOVE.mantleReach, MOVE.mantleReach + 0.35]) {
    const tx = p.x + f.x * reach, tz = p.z + f.z * reach;
    const floor = groundHeight(world, tx, top + 0.02, tz, 0.3, 0.02);
    if (!isFinite(floor) || Math.abs(floor - top) > 0.25) continue;
    // Clearance: vertical column above current position up to the ledge + body.
    if (!fits(world, p.x, p.y, p.z, rise + MOVE.crouchHeight)) return null;
    if (fits(world, tx, floor, tz, MOVE.standHeight)) return { to: { x: tx, y: floor, z: tz }, crouchAfter: false };
    if (fits(world, tx, floor, tz, MOVE.crouchHeight)) return { to: { x: tx, y: floor, z: tz }, crouchAfter: true };
  }
  return null;
}

/** Advance one fixed step. Returns event flags for audio/visual hooks. */
export function stepMovement(world: CollisionWorld, s: MoveState, inp: MoveInput, dt: number): { jumped: boolean; landed: boolean; mantled: boolean } {
  const ev = { jumped: false, landed: false, mantled: false };
  s.landT += dt;
  const startX = s.pos.x, startZ = s.pos.z;
  const jumpPressed = inp.jump && !s.jumpPrev;
  s.jumpPrev = inp.jump;

  if (s.mantle) {
    const m = s.mantle;
    m.t += dt;
    const k = clamp(m.t / m.dur, 0, 1);
    const up = clamp(k / 0.6, 0, 1);
    const fwd = clamp((k - 0.35) / 0.65, 0, 1);
    s.pos.x = m.from.x + (m.to.x - m.from.x) * fwd;
    s.pos.z = m.from.z + (m.to.z - m.from.z) * fwd;
    s.pos.y = m.from.y + (m.to.y - m.from.y) * (1 - (1 - up) * (1 - up));
    if (k >= 1) {
      s.pos = { ...m.to };
      s.vel = { x: 0, y: 0, z: 0 };
      s.onGround = true;
      if (m.crouchAfter) s.crouch = true;
      s.mantle = null;
    }
    s.sprinting = false;
    s.moved = Math.hypot(s.pos.x - startX, s.pos.z - startZ);
    return ev;
  }

  // Stance
  if (inp.crouch && !s.crouch) s.crouch = true;
  else if (!inp.crouch && s.crouch) {
    if (fits(world, s.pos.x, s.pos.y, s.pos.z, MOVE.standHeight)) s.crouch = false;
  }
  // Sprint (forward only, not while crouched or aiming)
  const wantsSprint = inp.sprint && inp.mz > 0.3 && inp.canSprint && s.onGround && inp.ads < 0.3;
  if (wantsSprint && s.crouch && fits(world, s.pos.x, s.pos.y, s.pos.z, MOVE.standHeight)) s.crouch = false;
  if (wantsSprint && !s.crouch) s.sprintHold += dt; else s.sprintHold = 0;
  s.sprinting = wantsSprint && !s.crouch && s.sprintHold >= inp.sprintDelay;

  // Wish velocity
  const f = flatForward(inp.yaw), r = flatRight(inp.yaw);
  let wx = f.x * inp.mz + r.x * inp.mx, wz = f.z * inp.mz + r.z * inp.mx;
  const wl = Math.hypot(wx, wz);
  if (wl > 1) { wx /= wl; wz /= wl; }
  let speed = s.sprinting ? MOVE.sprintSpeed : s.crouch ? MOVE.crouchSpeed : MOVE.standSpeed;
  speed *= 1 + (inp.adsMove - 1) * inp.ads;
  speed *= inp.speedMult ?? 1;
  const tx = wx * speed, tz = wz * speed;

  if (s.onGround) {
    const accel = wl > 0.01 ? MOVE.groundAccel : MOVE.groundDecel;
    const dx = tx - s.vel.x, dz = tz - s.vel.z;
    const dl = Math.hypot(dx, dz);
    const step = accel * dt;
    if (dl <= step) { s.vel.x = tx; s.vel.z = tz; } else { s.vel.x += (dx / dl) * step; s.vel.z += (dz / dl) * step; }
  } else if (wl > 0.01) {
    const before = Math.hypot(s.vel.x, s.vel.z);
    const dx = tx - s.vel.x, dz = tz - s.vel.z;
    const dl = Math.hypot(dx, dz);
    const step = MOVE.groundAccel * MOVE.airControl * dt;
    if (dl <= step) { s.vel.x = tx; s.vel.z = tz; } else { s.vel.x += (dx / dl) * step; s.vel.z += (dz / dl) * step; }
    // never gain horizontal speed in the air beyond max(before, target)
    const cap = Math.max(before, speed);
    const after = Math.hypot(s.vel.x, s.vel.z);
    if (after > cap) { s.vel.x *= cap / after; s.vel.z *= cap / after; }
  }

  // Jump / mantle
  if (jumpPressed || (inp.jump && !s.onGround && s.vel.y < 1.5)) {
    const m = (inp.mz > 0.1 || !s.onGround) ? findMantle(world, s, inp.yaw) : null;
    if (m && (jumpPressed || !s.onGround)) {
      s.mantle = { t: 0, dur: inp.mantleTime, from: { ...s.pos }, to: m.to, crouchAfter: m.crouchAfter };
      s.vel = { x: 0, y: 0, z: 0 };
      s.sprinting = false; s.sprintHold = 0;
      ev.mantled = true;
      return ev;
    }
    if (jumpPressed && s.onGround && !s.crouch) {
      s.vel.y = MOVE.jumpVel;
      s.onGround = false;
      ev.jumped = true;
    } else if (jumpPressed && s.onGround && s.crouch) {
      if (fits(world, s.pos.x, s.pos.y, s.pos.z, MOVE.standHeight)) s.crouch = false;
    }
  }

  // Gravity
  if (!s.onGround) s.vel.y = Math.max(s.vel.y - MOVE.gravity * dt, -MOVE.maxFallSpeed);

  const h = heightOf(s);
  // Horizontal axes with step-up
  for (const axis of ["x", "z"] as const) {
    const dv = (axis === "x" ? s.vel.x : s.vel.z) * dt;
    if (dv === 0) continue;
    const nx = axis === "x" ? s.pos.x + dv : s.pos.x;
    const nz = axis === "z" ? s.pos.z + dv : s.pos.z;
    if (fits(world, nx, s.pos.y, nz, h)) { s.pos.x = nx; s.pos.z = nz; continue; }
    if (s.onGround) {
      const top = groundHeight(world, nx, s.pos.y + MOVE.stepHeight, nz, MOVE.stepHeight, 0);
      if (isFinite(top) && top > s.pos.y && top - s.pos.y <= MOVE.stepHeight && fits(world, nx, top, nz, h)) {
        s.pos.x = nx; s.pos.z = nz; s.pos.y = top; continue;
      }
    }
    if (axis === "x") s.vel.x = 0; else s.vel.z = 0;
  }

  // Vertical
  if (!s.onGround) {
    const ny = s.pos.y + s.vel.y * dt;
    if (s.vel.y <= 0) {
      const top = groundHeight(world, s.pos.x, s.pos.y + 0.01, s.pos.z, s.pos.y - ny + 0.02, 0.01);
      if (isFinite(top) && top >= ny) {
        ev.landed = true;
        s.landSpeed = -s.vel.y; s.landT = 0;
        s.pos.y = top; s.vel.y = 0; s.onGround = true;
      } else s.pos.y = ny;
    } else {
      if (fits(world, s.pos.x, ny, s.pos.z, h)) s.pos.y = ny;
      else s.vel.y = 0;
    }
  } else {
    // Stay grounded / step down stairs
    const top = groundHeight(world, s.pos.x, s.pos.y + 0.01, s.pos.z, MOVE.stepHeight + 0.05, 0.01);
    if (isFinite(top) && s.pos.y - top <= MOVE.stepHeight + 0.04) s.pos.y = top;
    else { s.onGround = false; s.vel.y = Math.min(s.vel.y, 0); }
  }
  // Safety: if somehow embedded, push up
  if (!fits(world, s.pos.x, s.pos.y, s.pos.z, MOVE.crouchHeight)) {
    for (let k = 1; k <= 20; k++) if (fits(world, s.pos.x, s.pos.y + k * 0.1, s.pos.z, MOVE.crouchHeight)) { s.pos.y += k * 0.1; break; }
  }
  s.moved = Math.hypot(s.pos.x - startX, s.pos.z - startZ);
  return ev;
}

export function eyeHeight(crouchT: number): number {
  return MOVE.eyeStand + (MOVE.eyeCrouch - MOVE.eyeStand) * crouchT;
}
