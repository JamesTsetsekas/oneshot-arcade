// Shared, pure player movement. The server runs it authoritatively; the client runs the identical
// function for prediction and replays unacknowledged inputs on reconciliation.
import { PLAYER } from '../content/rules';
import { F_SOLID, type Box, type CollisionWorld } from '../map/world';
import { BTN, type MoveState } from '../protocol/types';

export interface MoveCtx {
  maxSpeed: number;
  frozen: boolean;
  barriers: boolean;
}

export function newMoveState(x = 0, y = 0, z = 0): MoveState {
  return { x, y, z, vx: 0, vy: 0, vz: 0, onGround: true, crouch: 0, jumpHeld: false, landT: 0, fatigue: 0 };
}

export function copyMove(dst: MoveState, src: MoveState): MoveState {
  dst.x = src.x;
  dst.y = src.y;
  dst.z = src.z;
  dst.vx = src.vx;
  dst.vy = src.vy;
  dst.vz = src.vz;
  dst.onGround = src.onGround;
  dst.crouch = src.crouch;
  dst.jumpHeld = src.jumpHeld;
  dst.landT = src.landT;
  dst.fatigue = src.fatigue;
  return dst;
}

export const bodyHeight = (crouch: number): number => PLAYER.standHeight + (PLAYER.crouchHeight - PLAYER.standHeight) * crouch;
export const eyeHeight = (crouch: number): number => PLAYER.standEye + (PLAYER.crouchEye - PLAYER.standEye) * crouch;

const HW = PLAYER.halfWidth;
const EPS = 1e-4;
const JUMP_V = Math.sqrt(2 * PLAYER.gravity * PLAYER.jumpHeight);
const scratch: Box[] = [];

export function stepMove(w: CollisionWorld, s: MoveState, buttons: number, yaw: number, ctx: MoveCtx, dt: number): void {
  // --- stance (rate-limited, needs headroom to stand)
  let wantCrouch = (buttons & BTN.CROUCH) !== 0;
  if (!wantCrouch && s.crouch > 0) {
    const h = bodyHeight(s.crouch);
    if (w.overlaps(s.x - HW, s.y + h, s.z - HW, s.x + HW, s.y + PLAYER.standHeight, s.z + HW, F_SOLID, ctx.barriers)) wantCrouch = true;
  }
  const cstep = dt / PLAYER.crouchTime;
  s.crouch = wantCrouch ? Math.min(1, s.crouch + cstep) : Math.max(0, s.crouch - cstep);
  const height = bodyHeight(s.crouch);

  // --- wish direction
  let fwd = 0;
  let side = 0;
  if (!ctx.frozen) {
    if (buttons & BTN.FWD) fwd += 1;
    if (buttons & BTN.BACK) fwd -= 1;
    if (buttons & BTN.RIGHT) side += 1;
    if (buttons & BTN.LEFT) side -= 1;
  }
  const sy = Math.sin(yaw);
  const cy = Math.cos(yaw);
  let wx = sy * fwd + cy * side;
  let wz = cy * fwd - sy * side;
  const wl = Math.hypot(wx, wz);
  if (wl > 0) {
    wx /= wl;
    wz /= wl;
  }
  let speed = ctx.maxSpeed * (1 - 0.35 * Math.min(1, s.fatigue));
  speed *= 1 + (PLAYER.crouchMul - 1) * s.crouch;
  if (buttons & BTN.WALK && s.crouch < 0.5) speed *= PLAYER.walkMul;
  const tx = wx * speed;
  const tz = wz * speed;

  // --- horizontal acceleration
  if (s.onGround) {
    const ddx = tx - s.vx;
    const ddz = tz - s.vz;
    const dl = Math.hypot(ddx, ddz);
    if (dl > 0) {
      let rate: number;
      if (wl === 0) rate = PLAYER.friction;
      else if (wx * s.vx + wz * s.vz < 0) rate = PLAYER.counterDecel;
      else rate = PLAYER.accel;
      const stp = Math.min(dl, rate * dt);
      s.vx += (ddx / dl) * stp;
      s.vz += (ddz / dl) * stp;
    }
  } else if (wl > 0) {
    // limited air control: steer, never gain speed beyond the ground cap
    const before = Math.hypot(s.vx, s.vz);
    s.vx += wx * PLAYER.airAccel * dt;
    s.vz += wz * PLAYER.airAccel * dt;
    const after = Math.hypot(s.vx, s.vz);
    const cap = Math.max(before, speed * 0.6);
    if (after > cap && after > 0) {
      s.vx *= cap / after;
      s.vz *= cap / after;
    }
  }

  // --- jump (edge-triggered; repeated jumps build fatigue that costs height and speed)
  const jump = (buttons & BTN.JUMP) !== 0 && !ctx.frozen;
  const wasGround = s.onGround;
  let jumped = false;
  if (jump && !s.jumpHeld && s.onGround && s.crouch < 0.6) {
    s.vy = JUMP_V * (1 - 0.3 * Math.min(1, s.fatigue));
    s.fatigue = Math.min(1.2, s.fatigue + 0.55);
    s.onGround = false;
    jumped = true;
  }
  s.jumpHeld = jump;
  if (s.onGround) s.fatigue = Math.max(0, s.fatigue - dt * 0.7);
  if (s.landT > 0) s.landT = Math.max(0, s.landT - dt);

  s.vy -= PLAYER.gravity * dt;
  const vyBefore = s.vy;

  // --- X axis
  if (s.vx !== 0) {
    let nx = s.x + s.vx * dt;
    const hits = w.query(nx - HW, s.y + EPS, s.z - HW, nx + HW, s.y + height, s.z + HW, F_SOLID, ctx.barriers, scratch);
    if (hits.length) {
      let top = -Infinity;
      for (const b of hits) if (b.y1 > top) top = b.y1;
      if (wasGround && !jumped && top - s.y <= PLAYER.stepHeight + EPS && !w.overlaps(nx - HW, top + EPS, s.z - HW, nx + HW, top + height, s.z + HW, F_SOLID, ctx.barriers)) {
        s.y = top;
      } else {
        w.query(nx - HW, s.y + EPS, s.z - HW, nx + HW, s.y + height, s.z + HW, F_SOLID, ctx.barriers, scratch);
        for (const b of scratch) {
          if (s.vx > 0 && b.x0 >= s.x + HW - 0.02) nx = Math.min(nx, b.x0 - HW - EPS);
          else if (s.vx < 0 && b.x1 <= s.x - HW + 0.02) nx = Math.max(nx, b.x1 + HW + EPS);
        }
        s.vx = 0;
      }
    }
    s.x = nx;
  }
  // --- Z axis
  if (s.vz !== 0) {
    let nz = s.z + s.vz * dt;
    const hits = w.query(s.x - HW, s.y + EPS, nz - HW, s.x + HW, s.y + height, nz + HW, F_SOLID, ctx.barriers, scratch);
    if (hits.length) {
      let top = -Infinity;
      for (const b of hits) if (b.y1 > top) top = b.y1;
      if (wasGround && !jumped && top - s.y <= PLAYER.stepHeight + EPS && !w.overlaps(s.x - HW, top + EPS, nz - HW, s.x + HW, top + height, nz + HW, F_SOLID, ctx.barriers)) {
        s.y = top;
      } else {
        w.query(s.x - HW, s.y + EPS, nz - HW, s.x + HW, s.y + height, nz + HW, F_SOLID, ctx.barriers, scratch);
        for (const b of scratch) {
          if (s.vz > 0 && b.z0 >= s.z + HW - 0.02) nz = Math.min(nz, b.z0 - HW - EPS);
          else if (s.vz < 0 && b.z1 <= s.z - HW + 0.02) nz = Math.max(nz, b.z1 + HW + EPS);
        }
        s.vz = 0;
      }
    }
    s.z = nz;
  }
  // --- Y axis
  const ny = s.y + s.vy * dt;
  if (s.vy <= 0) {
    const hits = w.query(s.x - HW, ny, s.z - HW, s.x + HW, s.y + 0.02, s.z + HW, F_SOLID, ctx.barriers, scratch);
    let top = -Infinity;
    for (const b of hits) if (b.y1 <= s.y + 0.02 && b.y1 > top) top = b.y1;
    if (top > -Infinity) {
      s.y = top;
      s.vy = 0;
      s.onGround = true;
    } else {
      s.y = ny;
      s.onGround = false;
    }
  } else {
    const hits = w.query(s.x - HW, s.y + height, s.z - HW, s.x + HW, ny + height, s.z + HW, F_SOLID, ctx.barriers, scratch);
    let bottom = Infinity;
    for (const b of hits) if (b.y0 >= s.y + height - 0.02 && b.y0 < bottom) bottom = b.y0;
    if (bottom < Infinity) {
      s.y = bottom - height - EPS;
      s.vy = 0;
    } else s.y = ny;
    s.onGround = false;
  }
  // --- stay glued to stairs when walking down
  if (wasGround && !jumped && !s.onGround) {
    const hits = w.query(s.x - HW, s.y - PLAYER.stepHeight - 0.02, s.z - HW, s.x + HW, s.y + 0.02, s.z + HW, F_SOLID, ctx.barriers, scratch);
    let top = -Infinity;
    for (const b of hits) if (b.y1 <= s.y + 0.02 && b.y1 > top) top = b.y1;
    if (top > -Infinity) {
      s.y = top;
      s.vy = 0;
      s.onGround = true;
    }
  }
  // --- landing penalty from fall speed
  if (!wasGround && s.onGround) {
    const impact = Math.abs(vyBefore);
    s.landT = Math.min(0.5, Math.max(0.1, impact * 0.045));
    if (impact > 7) {
      s.vx *= 0.55;
      s.vz *= 0.55;
    }
  }
  if (s.y < -5) {
    s.y = 0.01;
    s.vy = 0;
  }
}
