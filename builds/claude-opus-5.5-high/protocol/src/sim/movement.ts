// Shared, pure-ish player movement: acceleration, counter-strafe deceleration,
// walk/crouch, jump with fatigue, stepped AABB collision against the static map.

import { PLAYER, TICK_RATE } from '../content/rules';
import type { GameMap } from '../map/runtime';
import { BTN } from '../protocol/messages';
import { clamp } from './math';
import type { Player } from './state';

const tmp: number[] = [];
const EPS = 0.001;

export function playerHeight(crouchAmt: number): number {
  return PLAYER.height + (PLAYER.crouchHeight - PLAYER.height) * crouchAmt;
}
export function eyeHeight(crouchAmt: number): number {
  return PLAYER.eye + (PLAYER.crouchEye - PLAYER.eye) * crouchAmt;
}

export function overlapsWorld(map: GameMap, x: number, y: number, z: number, h: number, r = PLAYER.radius): boolean {
  map.queryAABB(x - r, y, z - r, x + r, y + h, z + r, tmp);
  return tmp.length > 0;
}

export interface MoveOptions {
  maxSpeed: number;
  frozen: boolean;
  clampRect: [number, number, number, number] | null;
  tick: number;
}

export const jumpVelocity = (): number => Math.sqrt(2 * PLAYER.gravity * PLAYER.jumpApex);

/** Advance a player one fixed tick. Returns 'land' fall speed if landed this tick (else 0). */
export function stepMovement(map: GameMap, p: Player, buttons: number, dt: number, o: MoveOptions): number {
  // ---- crouch (server stateful, rate limited) ----
  const wantCrouch = (buttons & BTN.CROUCH) !== 0;
  if (wantCrouch !== p.crouchHeld) {
    const window = o.tick - TICK_RATE;
    p.crouchToggleTicks = p.crouchToggleTicks.filter((t) => t > window);
    if (p.crouchToggleTicks.length < PLAYER.maxCrouchTogglesPerSec * 2) {
      p.crouchHeld = wantCrouch;
      p.crouchToggleTicks.push(o.tick);
    }
  }
  const crouchRate = dt / PLAYER.crouchTransition;
  if (p.crouchHeld) p.crouchAmt = Math.min(1, p.crouchAmt + crouchRate);
  else if (p.crouchAmt > 0) {
    const next = Math.max(0, p.crouchAmt - crouchRate);
    // only stand up if there is headroom
    if (!overlapsWorld(map, p.pos.x, p.pos.y + 0.01, p.pos.z, playerHeight(next) - 0.01)) p.crouchAmt = next;
  }
  const h = playerHeight(p.crouchAmt);

  // ---- wish direction ----
  let fwd = 0;
  let side = 0;
  if (!o.frozen) {
    if (buttons & BTN.FWD) fwd += 1;
    if (buttons & BTN.BACK) fwd -= 1;
    if (buttons & BTN.RIGHT) side += 1;
    if (buttons & BTN.LEFT) side -= 1;
  }
  const sy = Math.sin(p.yaw);
  const cy = Math.cos(p.yaw);
  let wx = sy * fwd + cy * side;
  let wz = cy * fwd - sy * side;
  const wl = Math.hypot(wx, wz);
  if (wl > 0) {
    wx /= wl;
    wz /= wl;
  }
  p.walking = (buttons & BTN.WALK) !== 0;
  let speed = o.maxSpeed;
  if (p.crouchAmt > 0.5) speed *= PLAYER.crouchMult;
  else if (p.walking) speed *= PLAYER.walkMult;
  if (o.frozen) speed = 0;
  const tx = wx * speed;
  const tz = wz * speed;

  if (p.onGround) {
    const dvx = tx - p.vel.x;
    const dvz = tz - p.vel.z;
    const curSp = Math.hypot(p.vel.x, p.vel.z);
    const accelerating = wl > 0 && tx * p.vel.x + tz * p.vel.z >= -0.01 && speed >= curSp - 0.05;
    const rate = (accelerating ? PLAYER.accel : PLAYER.decel) * dt;
    const dl = Math.hypot(dvx, dvz);
    if (dl > rate) {
      p.vel.x += (dvx / dl) * rate;
      p.vel.z += (dvz / dl) * rate;
    } else {
      p.vel.x = tx;
      p.vel.z = tz;
    }
    // jump: requires a fresh press, no auto-hop gain
    const jump = (buttons & BTN.JUMP) !== 0;
    if (jump && !p.jumpHeldPrev && !o.frozen && p.crouchAmt < 0.6) {
      p.vel.y = jumpVelocity();
      p.onGround = false;
      const since = o.tick - p.landTick;
      if (since < TICK_RATE * 0.5) {
        // repeated jumps bleed speed
        p.vel.x *= 0.72;
        p.vel.z *= 0.72;
      }
      p.lastJumpTick = o.tick;
    }
  } else if (wl > 0) {
    // limited air control, can't exceed ground speed
    const ax = tx - p.vel.x;
    const az = tz - p.vel.z;
    const al = Math.hypot(ax, az);
    const rate = PLAYER.airAccel * dt;
    if (al > 0) {
      const k = Math.min(1, rate / al);
      p.vel.x += ax * k;
      p.vel.z += az * k;
    }
  }
  p.jumpHeldPrev = (buttons & BTN.JUMP) !== 0;

  // ---- gravity ----
  if (!p.onGround) p.vel.y -= PLAYER.gravity * dt;
  else p.vel.y = Math.max(p.vel.y, 0);

  // ---- horizontal collide with step-up ----
  const wasGround = p.onGround;
  moveHorizontal(map, p, p.vel.x * dt, p.vel.z * dt, h);

  // ---- vertical ----
  let landed = 0;
  const dy = p.vel.y * dt;
  if (dy !== 0) {
    const ny = p.pos.y + dy;
    map.queryAABB(p.pos.x - PLAYER.radius, Math.min(ny, p.pos.y), p.pos.z - PLAYER.radius, p.pos.x + PLAYER.radius, Math.max(ny, p.pos.y) + h, p.pos.z + PLAYER.radius, tmp);
    if (dy < 0) {
      let floor = -Infinity;
      for (const bi of tmp) {
        const b = map.boxes[bi];
        if (b.maxY <= p.pos.y + EPS && b.maxY > floor) floor = b.maxY;
      }
      if (floor > ny) {
        landed = -p.vel.y;
        p.pos.y = floor;
        p.vel.y = 0;
        p.onGround = true;
      } else {
        p.pos.y = ny;
        p.onGround = false;
      }
    } else {
      let ceil = Infinity;
      for (const bi of tmp) {
        const b = map.boxes[bi];
        if (b.minY >= p.pos.y + h - EPS && b.minY < ceil) ceil = b.minY;
      }
      if (ceil < ny + h) {
        p.pos.y = ceil - h - EPS;
        p.vel.y = 0;
      } else p.pos.y = ny;
      p.onGround = false;
    }
  } else if (p.onGround) {
    // stick to ground / walk off ledges & down stairs
    if (!overlapsWorld(map, p.pos.x, p.pos.y - 0.04, p.pos.z, 0.04)) {
      const down = findFloorBelow(map, p, PLAYER.stepHeight + 0.02, h);
      if (down !== null && wasGround) p.pos.y = down;
      else {
        p.onGround = false;
      }
    }
  }

  if (o.clampRect) {
    const [x0, z0, x1, z1] = o.clampRect;
    const r = PLAYER.radius;
    if (p.pos.x < x0 + r) { p.pos.x = x0 + r; p.vel.x = Math.max(0, p.vel.x); }
    if (p.pos.x > x1 - r) { p.pos.x = x1 - r; p.vel.x = Math.min(0, p.vel.x); }
    if (p.pos.z < z0 + r) { p.pos.z = z0 + r; p.vel.z = Math.max(0, p.vel.z); }
    if (p.pos.z > z1 - r) { p.pos.z = z1 - r; p.vel.z = Math.min(0, p.vel.z); }
  }

  if (landed > 0) {
    p.landTick = o.tick;
    p.landPenalty = clamp((landed - 2) / 8, 0, 1);
  }
  p.landPenalty = Math.max(0, p.landPenalty - dt * 2.8);
  return landed;
}

function findFloorBelow(map: GameMap, p: Player, maxDrop: number, h: number): number | null {
  map.queryAABB(p.pos.x - PLAYER.radius, p.pos.y - maxDrop, p.pos.z - PLAYER.radius, p.pos.x + PLAYER.radius, p.pos.y, p.pos.z + PLAYER.radius, tmp);
  let floor = -Infinity;
  for (const bi of tmp) {
    const b = map.boxes[bi];
    if (b.maxY <= p.pos.y + EPS && b.maxY > floor) floor = b.maxY;
  }
  if (floor === -Infinity) return null;
  if (overlapsWorld(map, p.pos.x, floor + EPS, p.pos.z, h - 2 * EPS)) return null;
  return floor;
}

function moveHorizontal(map: GameMap, p: Player, dx: number, dz: number, h: number): void {
  if (dx === 0 && dz === 0) return;
  const { pos } = p;
  if (!overlapsWorld(map, pos.x + dx, pos.y + EPS, pos.z + dz, h - EPS)) {
    pos.x += dx;
    pos.z += dz;
    return;
  }
  // step up
  if (p.onGround) {
    const up = PLAYER.stepHeight;
    if (
      !overlapsWorld(map, pos.x, pos.y + up, pos.z, h) &&
      !overlapsWorld(map, pos.x + dx, pos.y + up, pos.z + dz, h)
    ) {
      // find the step top under the destination
      map.queryAABB(pos.x + dx - PLAYER.radius, pos.y, pos.z + dz - PLAYER.radius, pos.x + dx + PLAYER.radius, pos.y + up + EPS, pos.z + dz + PLAYER.radius, tmp);
      let top = pos.y;
      for (const bi of tmp) top = Math.max(top, map.boxes[bi].maxY);
      if (top - pos.y <= up + EPS && !overlapsWorld(map, pos.x + dx, top + EPS, pos.z + dz, h - EPS)) {
        pos.x += dx;
        pos.z += dz;
        pos.y = top;
        return;
      }
    }
  }
  // slide per axis
  slideAxis(map, p, 'x', dx, h);
  slideAxis(map, p, 'z', dz, h);
}

function slideAxis(map: GameMap, p: Player, axis: 'x' | 'z', d: number, h: number): void {
  if (d === 0) return;
  const { pos } = p;
  const r = PLAYER.radius;
  const nx = axis === 'x' ? pos.x + d : pos.x;
  const nz = axis === 'z' ? pos.z + d : pos.z;
  map.queryAABB(nx - r, pos.y + EPS, nz - r, nx + r, pos.y + h - EPS, nz + r, tmp);
  if (tmp.length === 0) {
    pos.x = nx;
    pos.z = nz;
    return;
  }
  let lim = axis === 'x' ? nx : nz;
  for (const bi of tmp) {
    const b = map.boxes[bi];
    if (axis === 'x') {
      if (d > 0) lim = Math.min(lim, b.minX - r - EPS);
      else lim = Math.max(lim, b.maxX + r + EPS);
    } else {
      if (d > 0) lim = Math.min(lim, b.minZ - r - EPS);
      else lim = Math.max(lim, b.maxZ + r + EPS);
    }
  }
  if (axis === 'x') {
    if ((d > 0 && lim >= pos.x) || (d < 0 && lim <= pos.x)) pos.x = lim;
    p.vel.x = 0;
  } else {
    if ((d > 0 && lim >= pos.z) || (d < 0 && lim <= pos.z)) pos.z = lim;
    p.vel.z = 0;
  }
}
