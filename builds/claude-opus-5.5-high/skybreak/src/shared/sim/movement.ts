// Shared character controller. The server runs it authoritatively; the
// client may run it for prediction. Pure function of (state, input, world).

import { MOVE } from '../content/rules';
import { CollisionWorld } from '../world/collision';
import { BOUNDARY, WATER_LEVEL } from '../world/island';
import { clamp } from '../math';

export type MoveMode = 'ground' | 'air' | 'swim' | 'zip' | 'ascend' | 'mantle' | 'freefall' | 'glide' | 'grapple' | 'skiff' | 'dead';

export interface MoveState {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  yaw: number; pitch: number;
  mode: MoveMode;
  crouch: boolean;
  slide: number; // seconds remaining
  slideGate: number;
  stamina: number;
  staminaDelay: number;
  sprinting: boolean;
  onGround: boolean;
  canGlide: boolean;
  insertion: boolean; // dropped from skiff and not yet landed
  fallProtect: number;
  mantle: { fx: number; fy: number; fz: number; tx: number; ty: number; tz: number; t: number; dur: number } | null;
  zipId: number; zipT: number; zipDir: number;
  ascId: number;
  grapple: { x: number; y: number; z: number; t: number } | null;
  ventCooldown: number;
  distance: number;
}

export interface MoveInput {
  mx: number; // strafe -1..1 (right +)
  mz: number; // forward -1..1
  yaw: number;
  pitch: number;
  jump: boolean; // edge
  sprint: boolean;
  crouch: boolean; // resolved held state
  deploy: boolean; // edge
  walk: boolean; // ADS / slow walk
  speedMult: number; // heal slow etc.
}

export interface MoveEvents {
  landed?: number; // impact speed
  fallDamage?: number;
  jumped?: boolean;
  slid?: boolean;
  mantled?: number;
  splash?: boolean;
  vent?: boolean;
  deployed?: boolean;
  stowed?: boolean;
  zipOn?: boolean;
  zipOff?: boolean;
  ascendOn?: boolean;
  footstep?: boolean;
}

export function newMoveState(x: number, y: number, z: number, yaw = 0): MoveState {
  return {
    x, y, z, vx: 0, vy: 0, vz: 0, yaw, pitch: 0, mode: 'ground', crouch: false, slide: 0, slideGate: 0,
    stamina: MOVE.staminaMax, staminaDelay: 0, sprinting: false, onGround: true, canGlide: false, insertion: false,
    fallProtect: 0, mantle: null, zipId: -1, zipT: 0, zipDir: 1, ascId: -1, grapple: null, ventCooldown: 0, distance: 0,
  };
}

export const playerHeight = (s: MoveState) => (s.crouch || s.slide > 0 ? MOVE.crouchHeight : MOVE.height);

/** Find a zipline or ascender the player can attach to right now. */
export function findTraversal(s: MoveState, w: CollisionWorld): { kind: 'zip'; id: number; t: number } | { kind: 'ascend'; id: number } | null {
  if (s.mode !== 'ground' && s.mode !== 'air' && s.mode !== 'swim') return null;
  const hx = s.x, hy = s.y + 1.7, hz = s.z;
  for (const z of w.island.ziplines) {
    const dx = z.b.x - z.a.x, dy = z.b.y - z.a.y, dz = z.b.z - z.a.z;
    const L2 = dx * dx + dy * dy + dz * dz;
    let t = ((hx - z.a.x) * dx + (hy - z.a.y) * dy + (hz - z.a.z) * dz) / L2;
    t = clamp(t, 0.01, 0.99);
    const px = z.a.x + dx * t, py = z.a.y + dy * t, pz = z.a.z + dz * t;
    const d = Math.hypot(px - hx, (py - hy) * 0.8, pz - hz);
    if (d < 2.4) return { kind: 'zip', id: z.id, t };
  }
  for (const a of w.island.ascenders) {
    if (Math.hypot(a.x - s.x, a.z - s.z) < 1.6 && s.y < a.y1 - 1 && s.y > a.y0 - 1.5) return { kind: 'ascend', id: a.id };
  }
  return null;
}

function moveHorizontal(s: MoveState, w: CollisionWorld, dx: number, dz: number, allowStep: boolean) {
  const r = MOVE.radius;
  const h = playerHeight(s);
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dz)) / 0.3));
  const sx = dx / n, sz = dz / n;
  for (let i = 0; i < n; i++) {
    for (let axis = 0; axis < 2; axis++) {
      const nx = axis === 0 ? s.x + sx : s.x;
      const nz = axis === 1 ? s.z + sz : s.z;
      if (axis === 0 && sx === 0) continue;
      if (axis === 1 && sz === 0) continue;
      const b = w.blocked(nx, s.y, nz, r, h);
      if (!b) { s.x = nx; s.z = nz; continue; }
      if (allowStep && b.maxY - s.y <= MOVE.stepHeight && !w.blocked(nx, b.maxY + 0.01, nz, r, h)) {
        s.x = nx; s.z = nz; s.y = b.maxY;
        continue;
      }
      if (axis === 0) s.vx = 0; else s.vz = 0;
    }
  }
  s.x = clamp(s.x, -BOUNDARY, BOUNDARY);
  s.z = clamp(s.z, -BOUNDARY, BOUNDARY);
}

function tryMantle(s: MoveState, w: CollisionWorld, ev: MoveEvents): boolean {
  const fx = Math.sin(s.yaw), fz = Math.cos(s.yaw);
  const px = s.x + fx * 0.75, pz = s.z + fz * 0.75;
  // need an obstacle ahead at knee-to-chest height
  const b = w.blocked(px, s.y + 0.3, pz, 0.2, 1.3);
  if (!b) return false;
  const top = w.support(px, pz, 0.25, s.y + MOVE.mantleMax + 0.05);
  const hgt = top - s.y;
  if (hgt < MOVE.mantleMin - 0.05 || hgt > MOVE.mantleMax + 0.05) return false;
  // clearance on top (stand) and over the path
  const tx = s.x + fx * 1.1, tz = s.z + fz * 1.1;
  if (w.blocked(tx, top + 0.02, tz, MOVE.radius, MOVE.crouchHeight)) return false;
  if (w.blocked(s.x, top + 0.02, s.z, MOVE.radius * 0.6, 1.0)) return false;
  s.mode = 'mantle';
  s.mantle = { fx: s.x, fy: s.y, fz: s.z, tx, ty: top + 0.02, tz, t: 0, dur: 0.22 + hgt * 0.22 };
  s.vx = s.vy = s.vz = 0;
  ev.mantled = hgt;
  return true;
}

function agl(s: MoveState, w: CollisionWorld) {
  return s.y - Math.max(w.support(s.x, s.z, 0.3, s.y + 0.1), WATER_LEVEL);
}

export function stepMovement(s: MoveState, inp: MoveInput, w: CollisionWorld, dt: number): MoveEvents {
  const ev: MoveEvents = {};
  s.yaw = inp.yaw;
  s.pitch = clamp(inp.pitch, -1.45, 1.45);
  s.fallProtect = Math.max(0, s.fallProtect - dt);
  s.slideGate = Math.max(0, s.slideGate - dt);
  s.ventCooldown = Math.max(0, s.ventCooldown - dt);
  const ox = s.x, oz = s.z;
  const fwdX = Math.sin(s.yaw), fwdZ = Math.cos(s.yaw);
  const rightX = Math.cos(s.yaw), rightZ = -Math.sin(s.yaw);
  let ix = inp.mx, iz = inp.mz;
  const il = Math.hypot(ix, iz);
  if (il > 1) { ix /= il; iz /= il; }
  const wishX = fwdX * iz + rightX * ix, wishZ = fwdZ * iz + rightZ * ix;
  const moving = il > 0.1;

  // traversal attach via jump
  if (inp.jump && (s.mode === 'ground' || s.mode === 'air' || s.mode === 'swim')) {
    const t = findTraversal(s, w);
    if (t) {
      attachTraversal(s, w, t);
      if (t.kind === 'zip') ev.zipOn = true; else ev.ascendOn = true;
      return ev;
    }
  }

  // stamina
  const wantsSprint = inp.sprint && iz > 0.3 && !inp.walk && !s.crouch && s.stamina > 0.05 && inp.speedMult >= 0.99;
  s.sprinting = wantsSprint && (s.mode === 'ground' || s.mode === 'swim');
  if (s.sprinting && moving) {
    s.stamina = Math.max(0, s.stamina - dt);
    s.staminaDelay = MOVE.staminaRegenDelay;
  } else if (s.staminaDelay > 0) {
    s.staminaDelay -= dt;
  } else {
    s.stamina = Math.min(MOVE.staminaMax, s.stamina + MOVE.staminaRegenRate * dt);
  }

  switch (s.mode) {
    case 'skiff':
    case 'dead':
      return ev;
    case 'mantle': {
      const m = s.mantle!;
      m.t += dt;
      const k = clamp(m.t / m.dur, 0, 1);
      const up = clamp(k * 1.6, 0, 1);
      const fw = clamp((k - 0.35) / 0.65, 0, 1);
      s.x = m.fx + (m.tx - m.fx) * fw;
      s.z = m.fz + (m.tz - m.fz) * fw;
      s.y = m.fy + (m.ty - m.fy) * up;
      if (k >= 1) { s.mode = 'ground'; s.mantle = null; s.onGround = true; }
      break;
    }
    case 'zip': {
      const z = w.island.ziplines[s.zipId];
      const L = Math.hypot(z.b.x - z.a.x, z.b.y - z.a.y, z.b.z - z.a.z);
      s.zipT += (s.zipDir * MOVE.zipSpeed * dt) / L;
      const dirX = (z.b.x - z.a.x) / L * s.zipDir, dirY = (z.b.y - z.a.y) / L * s.zipDir, dirZ = (z.b.z - z.a.z) / L * s.zipDir;
      const ended = s.zipT <= 0.0 || s.zipT >= 1.0;
      s.zipT = clamp(s.zipT, 0, 1);
      s.x = z.a.x + (z.b.x - z.a.x) * s.zipT;
      s.y = z.a.y + (z.b.y - z.a.y) * s.zipT - 2.0;
      s.z = z.a.z + (z.b.z - z.a.z) * s.zipT;
      s.vx = dirX * MOVE.zipSpeed; s.vy = dirY * MOVE.zipSpeed; s.vz = dirZ * MOVE.zipSpeed;
      if (inp.jump || ended) {
        // directional dismount: carry momentum, small hop, steer with input
        s.mode = 'air';
        s.vx = s.vx * 0.55 + wishX * 3; s.vz = s.vz * 0.55 + wishZ * 3; s.vy = 3.5;
        s.zipId = -1;
        s.fallProtect = 0.4;
        s.canGlide = agl(s, w) > 14;
        ev.zipOff = true;
      }
      break;
    }
    case 'ascend': {
      const a = w.island.ascenders[s.ascId];
      s.x = a.x; s.z = a.z;
      s.y += MOVE.ascendSpeed * dt;
      s.vx = s.vz = 0; s.vy = MOVE.ascendSpeed;
      if (s.y >= a.y1 - 0.05) {
        const ex = a.x + a.exitX * 1.6, ez = a.z + a.exitZ * 1.6;
        if (!w.blocked(ex, a.y1 + 0.05, ez, MOVE.radius, MOVE.height)) {
          s.x = ex; s.z = ez; s.y = a.y1;
        } else s.y = a.y1;
        s.mode = 'ground'; s.ascId = -1; s.vy = 0;
      } else if (inp.jump && s.y > a.y0 + 0.5) {
        s.mode = 'air'; s.ascId = -1; s.vy = 2; s.vx = -fwdX * 2; s.vz = -fwdZ * 2;
      }
      break;
    }
    case 'grapple': {
      const g = s.grapple!;
      g.t += dt;
      const dx = g.x - s.x, dy = g.y + 0.3 - s.y, dz = g.z - s.z;
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d < 1.4 || g.t > 2.6) {
        s.mode = 'air'; s.grapple = null; s.vy = 4; s.vx *= 0.3; s.vz *= 0.3; s.fallProtect = 1.2;
        break;
      }
      s.vx = (dx / d) * MOVE.grappleSpeed; s.vy = (dy / d) * MOVE.grappleSpeed; s.vz = (dz / d) * MOVE.grappleSpeed;
      const px = s.x, pz = s.z;
      moveHorizontal(s, w, s.vx * dt, s.vz * dt, true);
      const ny = s.y + s.vy * dt;
      if (!w.blocked(s.x, ny, s.z, MOVE.radius, MOVE.height)) s.y = Math.max(ny, w.support(s.x, s.z, MOVE.radius, ny + 0.4));
      if (Math.hypot(s.x - px, s.z - pz) < 0.05 && Math.abs(s.vy * dt) < 0.05) {
        s.mode = 'air'; s.grapple = null; s.fallProtect = 1.2;
      }
      break;
    }
    case 'freefall': {
      const target = inp.pitch < -0.8 && iz > 0.3 ? MOVE.freefallDive : MOVE.freefallTerminal;
      s.vy = Math.max(-target, s.vy - MOVE.gravity * dt);
      if (s.vy < -target) s.vy = -target;
      const hs = MOVE.freefallHoriz * (inp.pitch < -0.8 && iz > 0.3 ? 0.7 : 1);
      s.vx += (wishX * hs - s.vx) * Math.min(1, dt * 1.6);
      s.vz += (wishZ * hs - s.vz) * Math.min(1, dt * 1.6);
      s.x += s.vx * dt; s.z += s.vz * dt; s.y += s.vy * dt;
      s.x = clamp(s.x, -BOUNDARY, BOUNDARY); s.z = clamp(s.z, -BOUNDARY, BOUNDARY);
      const a = agl(s, w);
      if (a < MOVE.glideAutoDeploy || inp.deploy) {
        s.mode = 'glide'; ev.deployed = true;
        s.vy = -MOVE.glideDescent;
      }
      break;
    }
    case 'glide': {
      const spd = iz > 0.3 ? MOVE.glideSpeed : iz < -0.3 ? 10 : 16;
      const desc = iz > 0.3 ? 8 : iz < -0.3 ? MOVE.glideDescentBrake : MOVE.glideDescent;
      const tx = fwdX * spd + rightX * ix * 6, tz = fwdZ * spd + rightZ * ix * 6;
      s.vx += (tx - s.vx) * Math.min(1, dt * 1.4);
      s.vz += (tz - s.vz) * Math.min(1, dt * 1.4);
      s.vy += (-desc - s.vy) * Math.min(1, dt * 2.5);
      moveHorizontal(s, w, s.vx * dt, s.vz * dt, false);
      const ny = s.y + s.vy * dt;
      const ground = w.support(s.x, s.z, MOVE.radius, s.y + 0.05);
      if (ny <= ground) {
        s.y = ground; land(s, w, ev, true);
      } else if (ny <= WATER_LEVEL - 1.2) {
        s.y = WATER_LEVEL - 1.2; land(s, w, ev, true);
      } else s.y = ny;
      if (inp.deploy && !s.insertion && s.mode === 'glide') {
        s.mode = 'air'; ev.stowed = true; s.canGlide = agl(s, w) > MOVE.glideManualMin;
      } else if (inp.deploy && s.insertion && s.mode === 'glide' && agl(s, w) > MOVE.glideAutoDeploy + 10) {
        s.mode = 'freefall'; ev.stowed = true;
      }
      break;
    }
    case 'swim': {
      const max = s.sprinting ? MOVE.swimSprint : MOVE.swimSpeed;
      const tx = wishX * max * inp.speedMult, tz = wishZ * max * inp.speedMult;
      s.vx += (tx - s.vx) * Math.min(1, dt * 6);
      s.vz += (tz - s.vz) * Math.min(1, dt * 6);
      moveHorizontal(s, w, s.vx * dt, s.vz * dt, true);
      const floor = w.support(s.x, s.z, MOVE.radius, s.y + MOVE.stepHeight + 0.6);
      const depth = WATER_LEVEL - floor;
      if (depth < MOVE.swimDepth - 0.15) {
        s.mode = 'ground'; s.y = Math.max(floor, s.y); s.vy = 0; s.onGround = true;
      } else {
        s.y = WATER_LEVEL - 1.25; s.vy = 0;
        if (inp.jump) {
          // climb out onto a ledge if possible
          if (!tryMantleFromWater(s, w, ev)) { /* no-op */ }
        }
      }
      break;
    }
    case 'ground':
    case 'air': {
      const onGround = s.mode === 'ground';
      // stance & slide
      const speedH = Math.hypot(s.vx, s.vz);
      if (onGround && inp.crouch && s.sprinting && speedH > MOVE.slideMinSpeed && s.slide <= 0 && s.slideGate <= 0) {
        s.slide = MOVE.slideDuration;
        s.slideGate = MOVE.slideDuration + MOVE.slideGate;
        const boost = Math.max(speedH, MOVE.slideBoost);
        s.vx = (s.vx / speedH) * boost; s.vz = (s.vz / speedH) * boost;
        ev.slid = true;
      }
      if (s.slide > 0) {
        s.slide -= dt;
        // downhill momentum
        const gx = w.terrain(s.x + 1, s.z) - w.terrain(s.x - 1, s.z);
        const gz = w.terrain(s.x, s.z + 1) - w.terrain(s.x, s.z - 1);
        s.vx -= gx * 4.5 * dt; s.vz -= gz * 4.5 * dt;
        const f = Math.max(0, 1 - dt * 1.3);
        s.vx *= f; s.vz *= f;
        if (s.slide <= 0 || Math.hypot(s.vx, s.vz) < 3) { s.slide = 0; }
        s.crouch = true;
        if (inp.jump && onGround) { s.slide = 0; s.vy = MOVE.jumpVel; s.mode = 'air'; ev.jumped = true; s.crouch = false; }
      } else {
        if (inp.crouch) s.crouch = true;
        else if (s.crouch && !w.blocked(s.x, s.y + 0.02, s.z, MOVE.radius, MOVE.height)) s.crouch = false;
        let max = s.crouch ? MOVE.crouch : s.sprinting ? MOVE.sprint : inp.walk ? MOVE.walk : MOVE.run;
        max *= inp.speedMult;
        // shallow water slows
        const depth = WATER_LEVEL - s.y;
        if (depth > 0.3) max *= 0.8;
        const tx = wishX * max, tz = wishZ * max;
        const accel = onGround ? 14 : 2.2;
        s.vx += (tx - s.vx) * Math.min(1, dt * accel);
        s.vz += (tz - s.vz) * Math.min(1, dt * accel);
        if (onGround && inp.jump) {
          if (!tryMantle(s, w, ev)) { s.vy = MOVE.jumpVel; s.mode = 'air'; ev.jumped = true; }
          else break;
        }
      }
      if (s.mode === 'air' && inp.jump && iz > 0.2 && s.vy < 3) {
        if (tryMantle(s, w, ev)) break;
      }
      // vent launch
      if (s.ventCooldown <= 0) {
        for (const v of w.island.vents) {
          if (Math.hypot(v.x - s.x, v.z - s.z) < v.r && s.y > v.y - 1 && s.y < v.y + 4) {
            s.mode = 'air'; s.vy = MOVE.ventLaunch; s.canGlide = true; s.fallProtect = 99; s.ventCooldown = 2;
            s.crouch = false; s.slide = 0; ev.vent = true;
            break;
          }
        }
      }
      moveHorizontal(s, w, s.vx * dt, s.vz * dt, s.mode === 'ground');
      if (s.mode === 'ground') {
        const ground = w.support(s.x, s.z, MOVE.radius, s.y + MOVE.stepHeight);
        if (ground >= s.y - 0.55 && s.vy <= 0) {
          s.y = ground; s.vy = 0; s.onGround = true;
        } else {
          s.mode = 'air'; s.onGround = false;
        }
      } else {
        s.vy -= MOVE.gravity * dt;
        let ny = s.y + s.vy * dt;
        if (s.vy > 0 && w.blocked(s.x, ny, s.z, MOVE.radius, playerHeight(s))) { s.vy = 0; ny = s.y; }
        const ground = w.support(s.x, s.z, MOVE.radius, s.y + 0.05);
        if (ny <= ground) {
          s.y = ground; land(s, w, ev, false);
        } else s.y = ny;
        // auto-deploy after vent or high fall when allowed
        if (s.mode === 'air' && s.canGlide) {
          const a = agl(s, w);
          if ((inp.deploy && a > MOVE.glideManualMin) || (s.vy < -4 && s.fallProtect > 50 && a < 45)) {
            s.mode = 'glide'; ev.deployed = true; s.canGlide = false; s.fallProtect = 0;
          }
        } else if (s.mode === 'air' && s.vy < -10 && agl(s, w) > 30) {
          s.canGlide = true; // high jump: allow redeploy
        }
      }
      // water check
      if (s.mode === 'ground' || s.mode === 'air') {
        const floor = w.support(s.x, s.z, MOVE.radius, s.y + 0.1);
        if (WATER_LEVEL - floor > MOVE.swimDepth && s.y < WATER_LEVEL - 1.0) {
          if (s.mode === 'air' && s.vy < -6) ev.splash = true;
          s.mode = 'swim'; s.vy = 0; s.y = WATER_LEVEL - 1.25; s.crouch = false; s.slide = 0; s.fallProtect = 0;
        }
      }
      break;
    }
  }
  const moved = Math.hypot(s.x - ox, s.z - oz);
  s.distance += moved;
  return ev;
}

function tryMantleFromWater(s: MoveState, w: CollisionWorld, ev: MoveEvents) {
  const fx = Math.sin(s.yaw), fz = Math.cos(s.yaw);
  const px = s.x + fx * 0.8, pz = s.z + fz * 0.8;
  const top = w.support(px, pz, 0.25, s.y + 2.4);
  const hgt = top - s.y;
  if (hgt < 0.4 || hgt > 2.4) return false;
  if (w.blocked(px, top + 0.02, pz, MOVE.radius, MOVE.crouchHeight)) return false;
  s.mode = 'mantle';
  s.mantle = { fx: s.x, fy: s.y, fz: s.z, tx: s.x + fx * 1.1, ty: top + 0.02, tz: s.z + fz * 1.1, t: 0, dur: 0.6 };
  ev.mantled = hgt;
  return true;
}

function land(s: MoveState, w: CollisionWorld, ev: MoveEvents, gliding: boolean) {
  const impact = -s.vy;
  ev.landed = impact;
  if (!gliding && s.fallProtect <= 0 && impact > MOVE.fallDamageSpeed) {
    ev.fallDamage = Math.round((impact - MOVE.fallDamageSpeed) * MOVE.fallDamagePerMs);
  }
  s.vy = 0;
  s.mode = 'ground';
  s.onGround = true;
  s.insertion = false;
  s.canGlide = false;
  if (s.fallProtect > 10) s.fallProtect = 0;
  if (gliding) { s.vx *= 0.3; s.vz *= 0.3; }
}

export function attachTraversal(s: MoveState, w: CollisionWorld, t: NonNullable<ReturnType<typeof findTraversal>>) {
  if (t.kind === 'zip') {
    const z = w.island.ziplines[t.id];
    const dx = z.b.x - z.a.x, dz = z.b.z - z.a.z;
    const look = Math.sin(s.yaw) * dx + Math.cos(s.yaw) * dz;
    s.mode = 'zip'; s.zipId = t.id; s.zipT = t.t; s.zipDir = look >= 0 ? 1 : -1;
    s.crouch = false; s.slide = 0;
  } else {
    const a = w.island.ascenders[t.id];
    s.mode = 'ascend'; s.ascId = t.id; s.x = a.x; s.z = a.z; s.y = Math.max(s.y, a.y0);
    s.crouch = false; s.slide = 0;
  }
}

/** Start a grapple pull if the target is valid. */
export function startGrapple(s: MoveState, target: { x: number; y: number; z: number }): boolean {
  const d = Math.hypot(target.x - s.x, target.y - s.y, target.z - s.z);
  if (d > MOVE.grappleRange || d < 3) return false;
  if (s.mode === 'zip' || s.mode === 'ascend' || s.mode === 'skiff' || s.mode === 'dead' || s.mode === 'freefall' || s.mode === 'glide') return false;
  s.mode = 'grapple';
  s.grapple = { ...target, t: 0 };
  s.crouch = false; s.slide = 0;
  return true;
}
