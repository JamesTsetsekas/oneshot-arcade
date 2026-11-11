// Deterministic player movement. Query-driven AABB body, stateful crouch, no sprint / slide / mantle.

import { MOVEMENT as M } from '../content/economy';
import { WEAPONS } from '../content/weapons';
import { bodyBlocked, supportHeight } from './collision';
import { clamp, lerp } from './math';
import type { GameEvent, Player } from './types';
import { MAP_HEIGHT, MAP_WIDTH, Zone } from './map';

export interface MoveInput {
  moveX: number;
  moveZ: number;
  jump: boolean;
  crouch: boolean;
  walk: boolean;
}

export interface MoveContext {
  dt: number;
  time: number;
  /** Players may not move at all (interaction lock or freeze). */
  locked: boolean;
  /** Restrict movement to this zone (buy phase). */
  confine: Zone | null;
  emit: (e: GameEvent) => void;
}

export function bodyHeight(p: Pick<Player, 'crouch'>): number {
  return lerp(M.standHeight, M.crouchHeight, p.crouch);
}
export function eyeHeight(crouch: number): number {
  return lerp(M.standEye, M.crouchEye, crouch);
}

/** The weapon that determines base speed: the currently held item. */
export function heldMoveSpeed(p: Player): number {
  if (p.cur === 'primary' && p.slots.primary) return WEAPONS[p.slots.primary.id].moveSpeed;
  if (p.cur === 'secondary' && p.slots.secondary) return WEAPONS[p.slots.secondary.id].moveSpeed;
  if (p.cur.startsWith('util')) return 5.4;
  return WEAPONS.tool.moveSpeed;
}

export function maxSpeed(p: Player, walk: boolean): number {
  let s = heldMoveSpeed(p);
  if (p.crouch > 0.5) s *= M.crouchMul;
  else if (walk) s *= M.walkMul;
  return s;
}

export function horizontalSpeed(p: Player): number {
  return Math.hypot(p.vel.x, p.vel.z);
}

export function stepMovement(p: Player, inp: MoveInput, ctx: MoveContext): void {
  const { dt } = ctx;
  const hw = M.halfWidth;

  // ---- stance (server-stateful, rate limited) ----
  const target = inp.crouch ? 1 : 0;
  if (p.crouch < target) p.crouch = Math.min(target, p.crouch + M.crouchRate * dt);
  else if (p.crouch > target) {
    // Only stand up when there is headroom.
    const nextC = Math.max(target, p.crouch - M.crouchRate * dt);
    const h = lerp(M.standHeight, M.crouchHeight, nextC);
    if (!bodyBlocked(p.pos.x, p.pos.y, p.pos.z, hw, h)) p.crouch = nextC;
  }
  const height = bodyHeight(p);

  // ---- wish direction ----
  let mx = ctx.locked ? 0 : clamp(inp.moveX, -1, 1);
  let mz = ctx.locked ? 0 : clamp(inp.moveZ, -1, 1);
  const mag = Math.hypot(mx, mz);
  if (mag > 1) { mx /= mag; mz /= mag; }
  const sinY = Math.sin(p.yaw), cosY = Math.cos(p.yaw);
  // forward = (-sin, -cos), right = (cos, -sin)
  const wx = -sinY * mz + cosY * mx;
  const wz = -cosY * mz - sinY * mx;
  const wmag = Math.hypot(wx, wz);
  const top = maxSpeed(p, inp.walk);
  const tx = wmag > 0 ? (wx / wmag) * top * Math.min(1, wmag) : 0;
  const tz = wmag > 0 ? (wz / wmag) * top * Math.min(1, wmag) : 0;

  if (p.landPenalty > 0) p.landPenalty = Math.max(0, p.landPenalty - dt * 2.2);

  if (p.onGround) {
    const cur = Math.hypot(p.vel.x, p.vel.z);
    const tgt = Math.hypot(tx, tz);
    // Counter-strafing: input opposing velocity brakes at the higher rate.
    const opposing = cur > 0.1 && tgt > 0 && (p.vel.x * tx + p.vel.z * tz) / (cur * tgt) < 0.2;
    const rate = tgt < cur - 0.01 || opposing ? M.decel : M.accel;
    const dx = tx - p.vel.x, dz = tz - p.vel.z;
    const dl = Math.hypot(dx, dz);
    const step = rate * dt;
    if (dl <= step) { p.vel.x = tx; p.vel.z = tz; } else { p.vel.x += (dx / dl) * step; p.vel.z += (dz / dl) * step; }
  } else if (wmag > 0) {
    // Limited air control; speed never exceeds the grounded maximum, so jumping cannot gain speed.
    p.vel.x += (tx / Math.max(top, 0.01)) * M.airAccel * dt;
    p.vel.z += (tz / Math.max(top, 0.01)) * M.airAccel * dt;
    const s = Math.hypot(p.vel.x, p.vel.z);
    const cap = Math.max(top, 0);
    if (s > cap) { p.vel.x *= cap / s; p.vel.z *= cap / s; }
  }

  // ---- jump (no auto-hop gain: needs a short grounded interval) ----
  if (inp.jump && p.onGround && !ctx.locked && p.landPenalty < 0.55) {
    p.vel.y = M.jumpSpeed;
    p.onGround = false;
    p.vel.x *= 0.9; p.vel.z *= 0.9;
    p.landPenalty = Math.min(1, p.landPenalty + 0.25);
    ctx.emit({ t: 'step', id: p.id, p: { ...p.pos }, loud: 0.7, kind: 'jump' });
  }

  // ---- horizontal move with step-up ----
  let nx = p.pos.x + p.vel.x * dt;
  let nz = p.pos.z + p.vel.z * dt;
  if (ctx.confine) {
    const z = ctx.confine;
    nx = clamp(nx, z.x0 + hw, z.x1 - hw);
    nz = clamp(nz, z.z0 + hw, z.z1 - hw);
  }
  nx = clamp(nx, hw, MAP_WIDTH - hw);
  nz = clamp(nz, hw, MAP_HEIGHT - hw);
  moveAxis(p, 'x', nx, hw, height);
  moveAxis(p, 'z', nz, hw, height);

  // ---- vertical ----
  const support = supportHeight(p.pos.x, p.pos.z, hw, p.pos.y + 0.03);
  if (p.onGround) {
    if (p.pos.y - support > 0.04) {
      p.onGround = false; // walked off a ledge
    } else {
      p.pos.y = support;
      p.vel.y = 0;
    }
  }
  if (!p.onGround) {
    p.vel.y -= M.gravity * dt;
    let ny = p.pos.y + p.vel.y * dt;
    if (p.vel.y > 0) {
      if (bodyBlocked(p.pos.x, ny, p.pos.z, hw, height)) { p.vel.y = 0; ny = p.pos.y; }
      p.pos.y = ny;
    } else {
      const floor = supportHeight(p.pos.x, p.pos.z, hw, p.pos.y + 0.03);
      if (ny <= floor) {
        const impact = -p.vel.y;
        p.pos.y = floor;
        p.vel.y = 0;
        p.onGround = true;
        const pen = clamp((impact - 3) / 8, 0, 1);
        p.landPenalty = Math.max(p.landPenalty, 0.2 + pen * 0.8);
        ctx.emit({ t: 'step', id: p.id, p: { ...p.pos }, loud: 0.5 + pen * 0.5, kind: 'land' });
      } else {
        p.pos.y = ny;
      }
    }
  }

  // ---- footsteps (tactical information) ----
  if (p.onGround) {
    const sp = horizontalSpeed(p);
    p.stepAcc += sp * dt;
    const stride = 1.75;
    if (p.stepAcc >= stride && sp > 0.8) {
      p.stepAcc = 0;
      const frac = sp / Math.max(0.1, heldMoveSpeed(p));
      // Silent walk (52%) and crouch (40%) are nearly silent but never perfectly so.
      const loud = frac > 0.62 ? 1 : 0.12;
      ctx.emit({ t: 'step', id: p.id, p: { ...p.pos }, loud, kind: 'step' });
    }
  }
  if (p.pos.y < -20) { p.pos.y = 0; }
}

function moveAxis(p: Player, axis: 'x' | 'z', target: number, hw: number, height: number): void {
  const old = p.pos[axis];
  if (target === old) return;
  const tryPos = { x: p.pos.x, y: p.pos.y, z: p.pos.z };
  tryPos[axis] = target;
  if (!bodyBlocked(tryPos.x, tryPos.y, tryPos.z, hw, height)) {
    p.pos[axis] = target;
    return;
  }
  // step-up
  if (p.onGround || p.vel.y > -2) {
    for (const lift of [M.stepHeight]) {
      if (!bodyBlocked(tryPos.x, tryPos.y + lift, tryPos.z, hw, height)) {
        const floor = supportHeight(tryPos.x, tryPos.z, hw, tryPos.y + lift + 0.03);
        if (floor > p.pos.y + 0.01 && floor <= p.pos.y + lift + 0.01 && !bodyBlocked(tryPos.x, floor, tryPos.z, hw, height)) {
          p.pos[axis] = target;
          p.pos.y = floor;
          return;
        }
      }
    }
  }
  // slide: try to get as close to the obstacle as possible
  const dir = Math.sign(target - old);
  let lo = 0, hi = Math.abs(target - old);
  for (let i = 0; i < 6; i++) {
    const mid = (lo + hi) / 2;
    tryPos[axis] = old + dir * mid;
    if (bodyBlocked(tryPos.x, tryPos.y, tryPos.z, hw, height)) hi = mid; else lo = mid;
  }
  p.pos[axis] = old + dir * lo;
  p.vel[axis] = 0;
}
