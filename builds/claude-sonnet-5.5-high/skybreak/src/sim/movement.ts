/**
 * Authoritative character controller: ground, slide, crouch, jump, mantle, swim,
 * freefall, wing-sail glide, zipline and grapple. Pure functions of (world, player, input, dt).
 */
import { COMBAT, MOVE } from '../shared/content';
import { clamp, dirFromYawPitch, rightFromYaw } from '../shared/math';
import { circleOverlapsBox, type Box, type Cyl, type World } from './world';
import type { Player, PlayerInput } from './types';

export interface MoveResult {
  landSpeed: number; // >0 when landed this tick (vertical speed)
  fallDamage: number;
  mantled: boolean;
  slid: boolean;
  jumped: boolean;
  deployed: boolean;
  stepped: boolean;
}

const tB: Box[] = [];
const tC: Cyl[] = [];
const gB: Box[] = [];
const gC: Cyl[] = [];

export function playerHeight(p: Player): number {
  if (p.mode === 'swim') return MOVE.heightSwim;
  if (p.sliding) return MOVE.heightSlide;
  if (p.crouching) return MOVE.heightCrouch;
  return MOVE.heightStand;
}

function blockedAt(w: World, p: Player, nx: number, nz: number, h: number): boolean {
  w.queryCircle(nx, nz, MOVE.radius + 0.05, tB, tC);
  const feet = p.y;
  for (const b of tB) {
    if (b.maxY <= feet + MOVE.stepHeight && p.onGround) continue; // steppable
    if (b.maxY <= feet + 0.02) continue;
    if (b.minY >= feet + h) continue;
    if (circleOverlapsBox(nx, nz, MOVE.radius, b)) return true;
  }
  for (const c of tC) {
    if (c.y1 <= feet + MOVE.stepHeight && c.kind !== 'tree') continue;
    if (c.y0 >= feet + h || c.y1 <= feet) continue;
    const d = Math.hypot(nx - c.x, nz - c.z);
    if (d < c.r + MOVE.radius) return true;
  }
  return false;
}

function groundUnder(w: World, x: number, z: number, feet: number, step: number): number {
  return w.groundHeight(x, z, feet, step, MOVE.radius, gB, gC);
}

/** Try horizontal displacement with per-axis sliding and slope limits. Returns true if fully blocked. */
function moveHorizontal(w: World, p: Player, dx: number, dz: number, h: number): void {
  const dist = Math.hypot(dx, dz);
  if (dist < 1e-6) return;
  const steps = Math.max(1, Math.ceil(dist / 0.25));
  const sx = dx / steps, sz = dz / steps;
  for (let i = 0; i < steps; i++) {
    for (const axis of [0, 1] as const) {
      const mx = axis === 0 ? sx : 0, mz = axis === 1 ? sz : 0;
      if (mx === 0 && mz === 0) continue;
      const nx = p.x + mx, nz = p.z + mz;
      if (blockedAt(w, p, nx, nz, h)) continue;
      if (p.onGround && p.mode !== 'swim') {
        const g = groundUnder(w, nx, nz, p.y, MOVE.stepHeight);
        const rise = g - p.y;
        const run = Math.hypot(mx, mz);
        if (rise > Math.max(0.12, run * MOVE.slopeLimit)) continue; // too steep
      } else if (!p.onGround && p.mode !== 'swim') {
        const t = w.heightAt(nx, nz);
        if (t > p.y + 0.4 && p.vy < 3) continue; // cliff face in the air
      } else if (p.mode === 'swim') {
        const g = groundUnder(w, nx, nz, p.y, 0.2);
        if (g > p.y + 0.9) continue;
      }
      p.x = nx; p.z = nz;
    }
  }
  if (p.y < 250) {
    const lim = w.half + 40;
    p.x = clamp(p.x, -lim, lim);
    p.z = clamp(p.z, -lim, lim);
  }
}

function findMantle(w: World, p: Player, fx: number, fz: number): { tx: number; ty: number; tz: number; h: number } | null {
  const probes = [0.62, 0.8];
  for (const pr of probes) {
    const px = p.x + fx * pr, pz = p.z + fz * pr;
    w.queryCircle(px, pz, 0.25, tB, tC);
    let best: Box | null = null;
    for (const b of tB) {
      const rel = b.maxY - p.y;
      if (rel < MOVE.mantleMin || rel > MOVE.mantleMax) continue;
      if (b.minY > p.y + 0.5) continue;
      if (!circleOverlapsBox(px, pz, 0.25, b)) continue;
      if (!best || b.maxY > best.maxY) best = b;
    }
    if (!best) continue;
    const tx = p.x + fx * (pr + 0.55), tz = p.z + fz * (pr + 0.55);
    // landing spot must be on top of the box and have headroom
    if (tx < best.minX - 0.1 || tx > best.maxX + 0.1 || tz < best.minZ - 0.1 || tz > best.maxZ + 0.1) {
      // thin wall: still allowed if there is room on the other side at the same level
      if (blockedAtTop(w, tx, tz, best.maxY)) continue;
    }
    if (blockedAtTop(w, tx, tz, best.maxY, best)) continue;
    return { tx, ty: best.maxY, tz, h: best.maxY - p.y };
  }
  return null;
}
function blockedAtTop(w: World, x: number, z: number, topY: number, ignore?: Box): boolean {
  w.queryCircle(x, z, MOVE.radius, tB, tC);
  for (const b of tB) {
    if (b === ignore) continue;
    if (b.maxY <= topY + 0.05) continue;
    if (b.minY >= topY + MOVE.heightStand) continue;
    if (circleOverlapsBox(x, z, MOVE.radius, b)) return true;
  }
  return false;
}

export function newMoveResult(): MoveResult {
  return { landSpeed: 0, fallDamage: 0, mantled: false, slid: false, jumped: false, deployed: false, stepped: false };
}

export function stepMovement(w: World, p: Player, inp: PlayerInput, prev: PlayerInput, dt: number, res: MoveResult, healSlow: number): void {
  p.yaw = inp.yaw;
  p.pitch = inp.pitch;
  const px0 = p.x, pz0 = p.z;

  switch (p.mode) {
    case 'freefall': stepFreefall(w, p, inp, prev, dt, res); break;
    case 'glide': stepGlide(w, p, inp, prev, dt, res); break;
    case 'zipline': stepZipline(w, p, inp, prev, dt); break;
    case 'grapple': stepGrapple(w, p, dt); break;
    case 'mantle': stepMantle(p, dt); break;
    case 'ground':
    case 'swim': stepGround(w, p, inp, prev, dt, res, healSlow); break;
    default: break;
  }
  if (p.mode !== 'staging' && p.mode !== 'skiff') p.stats.distance += Math.hypot(p.x - px0, p.z - pz0);
}

function stepMantle(p: Player, dt: number): void {
  const m = p.mantle;
  if (!m) { p.mode = 'ground'; return; }
  m.t += dt;
  const k = clamp(m.t / m.dur, 0, 1);
  // vertical first, then forward
  const ky = clamp(k * 1.6, 0, 1), kh = clamp((k - 0.35) / 0.65, 0, 1);
  p.y = m.sy + (m.ty - m.sy) * ky;
  p.x = m.sx + (m.tx - m.sx) * kh;
  p.z = m.sz + (m.tz - m.sz) * kh;
  p.vx = p.vy = p.vz = 0;
  if (k >= 1) { p.mode = 'ground'; p.mantle = null; p.onGround = true; p.y = m.ty; }
}

function stepFreefall(w: World, p: Player, inp: PlayerInput, prev: PlayerInput, dt: number, res: MoveResult): void {
  const fwd = dirFromYawPitch(inp.yaw, 0);
  const right = rightFromYaw(inp.yaw);
  const dive = inp.moveF > 0.3, brake = inp.moveF < -0.3;
  const hTarget = dive ? MOVE.freefallHoriz : brake ? MOVE.freefallHorizMin : (MOVE.freefallHoriz + MOVE.freefallHorizMin) * 0.55;
  const vTerm = dive ? MOVE.freefallDive : brake ? 48 : MOVE.freefallTerminal;
  const tx = fwd.x * hTarget + right.x * inp.moveR * 9, tz = fwd.z * hTarget + right.z * inp.moveR * 9;
  const k = 1 - Math.exp(-2.2 * dt);
  p.vx += (tx - p.vx) * k; p.vz += (tz - p.vz) * k;
  if (p.vy > -vTerm) p.vy = Math.max(-vTerm, p.vy - 24 * dt);
  else p.vy += (-vTerm - p.vy) * (1 - Math.exp(-1.5 * dt));
  p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
  const ground = groundUnder(w, p.x, p.z, p.y, 0);
  const agl = p.y - ground;
  const wantDeploy = (inp.deploy && !prev.deploy) || (inp.jump && !prev.jump);
  if (p.ventLaunch && p.vy < 0 && agl > 8) { deploy(p, res); return; }
  if (!p.ventLaunch && ((wantDeploy && agl > MOVE.minDeployAGL) || agl <= MOVE.autoDeployAGL) && agl > MOVE.minDeployAGL * 0.4) { deploy(p, res); return; }
  if (agl <= 0) landFromAir(w, p, res, ground);
}

function deploy(p: Player, res: MoveResult): void {
  p.mode = 'glide';
  p.wingOut = true;
  p.ventLaunch = false;
  res.deployed = true;
}

function stepGlide(w: World, p: Player, inp: PlayerInput, prev: PlayerInput, dt: number, res: MoveResult): void {
  const fwd = dirFromYawPitch(inp.yaw, 0);
  const right = rightFromYaw(inp.yaw);
  const boost = inp.moveF > 0.3, slow = inp.moveF < -0.3;
  const speed = boost ? MOVE.glideSpeedBoost : slow ? 11 : MOVE.glideSpeed;
  const descent = boost ? 8.8 : slow ? 4.6 : MOVE.glideDescent;
  const tx = fwd.x * speed + right.x * inp.moveR * 5, tz = fwd.z * speed + right.z * inp.moveR * 5;
  const k = 1 - Math.exp(-2.0 * dt);
  p.vx += (tx - p.vx) * k; p.vz += (tz - p.vz) * k;
  p.vy += (-descent - p.vy) * (1 - Math.exp(-3 * dt));
  p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
  const ground = groundUnder(w, p.x, p.z, p.y, 0.1);
  // water landing
  if (p.y - ground <= 0.05) {
    p.wingOut = false;
    p.y = ground;
    p.vx *= 0.3; p.vz *= 0.3; p.vy = 0;
    p.onGround = true;
    p.mode = 'ground';
    res.landSpeed = 4;
    return;
  }
  if (inp.deploy && !prev.deploy && p.y - ground > MOVE.minDeployAGL * 1.6) { p.mode = 'freefall'; p.wingOut = false; }
}

function landFromAir(w: World, p: Player, res: MoveResult, ground: number): void {
  const vy = p.vy;
  p.y = ground;
  p.onGround = true;
  p.mode = 'ground';
  p.wingOut = false;
  p.ventLaunch = false;
  const water = w.waterLevel - ground;
  if (water > MOVE.swimDepth) { p.mode = 'swim'; p.vy = 0; return; }
  const speed = -vy;
  res.landSpeed = speed;
  if (speed > COMBAT.fallDamageSpeed) res.fallDamage = (speed - COMBAT.fallDamageSpeed) * COMBAT.fallDamagePerMs;
  p.vy = 0;
  p.vx *= 0.4; p.vz *= 0.4;
}

function stepZipline(w: World, p: Player, inp: PlayerInput, prev: PlayerInput, dt: number): void {
  const z = p.zip;
  if (!z) { p.mode = 'ground'; return; }
  const line = w.ziplines[z.id];
  const a = line.a, b = line.b;
  const len = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
  z.dist += MOVE.zipSpeed * dt;
  const t = clamp(z.dist / len, 0, 1);
  const from = z.dir > 0 ? a : b, to = z.dir > 0 ? b : a;
  p.x = from.x + (to.x - from.x) * t;
  p.y = from.y + (to.y - from.y) * t - 1.9;
  p.z = from.z + (to.z - from.z) * t;
  p.vx = ((to.x - from.x) / len) * MOVE.zipSpeed; p.vy = ((to.y - from.y) / len) * MOVE.zipSpeed; p.vz = ((to.z - from.z) / len) * MOVE.zipSpeed;
  const dismount = (inp.jump && !prev.jump) || (inp.crouch && !prev.crouch) || (inp.interact && !prev.interact);
  if (t >= 1 || dismount) {
    p.zip = null;
    p.mode = 'ground';
    p.onGround = false;
    p.vx *= 0.6; p.vz *= 0.6; p.vy = dismount && inp.jump ? 3 : 0;
    const g = groundUnder(w, p.x, p.z, p.y, 0.1);
    if (p.y <= g) { p.y = g; p.onGround = true; p.vy = 0; }
  }
}

function stepGrapple(w: World, p: Player, dt: number): void {
  const g = p.grapple;
  if (!g) { p.mode = 'ground'; return; }
  g.t -= dt;
  const dx = g.x - p.x, dy = g.y - p.y, dz = g.z - p.z;
  const d = Math.hypot(dx, dy, dz);
  if (d < 1.6 || g.t <= 0) {
    p.grapple = null; p.mode = 'ground'; p.onGround = false;
    p.vx *= 0.3; p.vz *= 0.3; p.vy = 2;
    return;
  }
  const sp = Math.min(MOVE.grappleSpeed, d / dt);
  p.vx = (dx / d) * sp; p.vy = (dy / d) * sp; p.vz = (dz / d) * sp;
  p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
  void w;
}

function stepGround(w: World, p: Player, inp: PlayerInput, prev: PlayerInput, dt: number, res: MoveResult, healSlow: number): void {
  const fwd = dirFromYawPitch(inp.yaw, 0);
  const right = rightFromYaw(inp.yaw);
  let wx = fwd.x * inp.moveF + right.x * inp.moveR;
  let wz = fwd.z * inp.moveF + right.z * inp.moveR;
  const wl = Math.hypot(wx, wz);
  if (wl > 1) { wx /= wl; wz /= wl; }
  const moving = wl > 0.05;

  // ---- swim transition
  const g0 = groundUnder(w, p.x, p.z, p.y, 0.3);
  const depth = w.waterLevel - g0;
  if (p.mode === 'ground' && depth > MOVE.swimDepth && p.y < w.waterLevel + 0.2) {
    p.mode = 'swim'; p.sliding = false; p.crouching = false; p.mantle = null;
  } else if (p.mode === 'swim' && depth <= MOVE.swimDepth - 0.05) {
    p.mode = 'ground'; p.onGround = true; p.y = g0;
  }

  if (p.mode === 'swim') {
    const sprint = inp.sprint && inp.moveF > 0.3;
    const sp = (sprint ? MOVE.swimSprint : MOVE.swim) * healSlow;
    const k = 1 - Math.exp(-6 * dt);
    p.vx += (wx * sp - p.vx) * k; p.vz += (wz * sp - p.vz) * k;
    moveHorizontal(w, p, p.vx * dt, p.vz * dt, MOVE.heightSwim);
    const targetY = w.waterLevel - 1.15;
    p.y += (Math.max(targetY, g0) - p.y) * (1 - Math.exp(-8 * dt));
    p.vy = 0; p.onGround = true; p.sprinting = false;
    p.stamina = Math.min(1, p.stamina + dt / 4);
    return;
  }

  // ---- stance
  const prevCrouch = prev.crouch;
  const canSlide = p.onGround && !p.sliding && p.slideCd <= 0 && Math.hypot(p.vx, p.vz) > MOVE.slideMinSpeed && p.sprinting;
  if (inp.crouch && !prevCrouch && canSlide) {
    const sp = Math.hypot(p.vx, p.vz);
    p.sliding = true; p.slideT = MOVE.slideDuration; p.slideDirX = p.vx / sp; p.slideDirZ = p.vz / sp; p.slideSpeed = Math.max(sp, MOVE.sprint) * MOVE.slideSpeedBoost;
    res.slid = true;
  }
  if (p.sliding) {
    p.slideT -= dt;
    // downhill carries momentum
    const e = 1.2;
    const sx = (w.heightAt(p.x + e, p.z) - w.heightAt(p.x - e, p.z)) / (2 * e);
    const sz = (w.heightAt(p.x, p.z + e) - w.heightAt(p.x, p.z - e)) / (2 * e);
    const down = -(sx * p.slideDirX + sz * p.slideDirZ);
    p.slideSpeed += down * 22 * dt - 4.2 * dt;
    p.slideSpeed = clamp(p.slideSpeed, 0, 12);
    if (p.slideT <= 0 || p.slideSpeed < 3.2 || !inp.crouch && p.slideT < 0.6 || (inp.jump && !prev.jump)) {
      p.sliding = false; p.slideCd = MOVE.slideCooldown;
    }
  }
  p.crouching = inp.crouch && !p.sliding;
  p.slideCd = Math.max(0, p.slideCd - dt);

  // ---- speed selection
  let speed: number = MOVE.run;
  const wantsSprint = inp.sprint && inp.moveF > 0.3 && !inp.ads && !p.crouching && p.stamina > 0.02 && !p.using;
  if (inp.ads) speed = MOVE.walk;
  if (p.crouching) speed = MOVE.crouch;
  if (wantsSprint && moving) { speed = MOVE.sprint; p.sprinting = true; p.stamina = Math.max(0, p.stamina - dt / MOVE.sprintEnergy); p.sprintDelay = MOVE.sprintRegenDelay; }
  else {
    p.sprinting = false;
    p.sprintDelay -= dt;
    if (p.sprintDelay <= 0) p.stamina = Math.min(1, p.stamina + dt / 3.2);
  }
  speed *= healSlow;

  // ---- jump / mantle
  const jumpPressed = inp.jump && !prev.jump;
  if ((p.onGround || p.vy > -5) && !p.sliding && inp.jump && p.mode === 'ground') {
    const m = findMantle(w, p, fwd.x, fwd.z);
    if (m && (moving || jumpPressed)) {
      p.mode = 'mantle';
      p.mantle = { t: 0, dur: 0.35 + 0.3 * m.h, sx: p.x, sy: p.y, sz: p.z, tx: m.tx, ty: m.ty, tz: m.tz };
      p.vx = p.vz = p.vy = 0;
      res.mantled = true;
      return;
    }
  }
  if (p.onGround && jumpPressed && !p.crouching) {
    p.vy = MOVE.jumpSpeed;
    p.onGround = false;
    p.sliding = false;
    res.jumped = true;
  }

  // ---- horizontal velocity
  const h = playerHeight(p);
  if (p.sliding) {
    p.vx = p.slideDirX * p.slideSpeed; p.vz = p.slideDirZ * p.slideSpeed;
  } else {
    const accel = p.onGround ? MOVE.accelGround : MOVE.accelAir;
    const tvx = wx * speed, tvz = wz * speed;
    const dvx = tvx - p.vx, dvz = tvz - p.vz;
    const dl = Math.hypot(dvx, dvz);
    const maxd = accel * dt;
    if (dl <= maxd || dl < 1e-6) { p.vx = tvx; p.vz = tvz; } else { p.vx += (dvx / dl) * maxd; p.vz += (dvz / dl) * maxd; }
  }
  moveHorizontal(w, p, (p.vx + p.knockX) * dt, (p.vz + p.knockZ) * dt, h);
  const kd = Math.exp(-3.2 * dt);
  p.knockX *= kd; p.knockZ *= kd;
  if (Math.abs(p.knockX) < 0.05) p.knockX = 0;
  if (Math.abs(p.knockZ) < 0.05) p.knockZ = 0;

  // ---- vertical
  const ground = groundUnder(w, p.x, p.z, p.y, p.onGround ? MOVE.stepHeight : 0.05);
  if (p.onGround) {
    if (p.y - ground > 0.55) {
      p.onGround = false; // walked off a ledge
      p.vy = 0;
    } else {
      // smooth step up/down
      const dy = ground - p.y;
      p.y += Math.abs(dy) < 0.02 ? dy : dy * (1 - Math.exp(-30 * dt));
      if (Math.abs(ground - p.y) < 0.03) p.y = ground;
      p.vy = 0;
      p.fallSpeed = 0;
    }
  }
  if (!p.onGround) {
    p.vy -= MOVE.gravity * dt;
    const ny = p.y + p.vy * dt;
    // head bump under solid boxes
    const g2 = groundUnder(w, p.x, p.z, Math.max(p.y, ny), 0.0);
    const supportY = groundUnder(w, p.x, p.z, p.y, 0.12);
    if (ny <= supportY && p.vy <= 0) {
      p.y = supportY;
      const vyImpact = p.vy;
      p.vy = vyImpact;
      landFromAir(w, p, res, supportY);
    } else {
      p.y = ny;
      void g2;
    }
  }
}

