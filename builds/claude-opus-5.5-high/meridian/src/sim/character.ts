// Shared character body: capsule locomotion, jump/vault/mantle/swim, health and status.

import { clamp, approach } from "../core/math";
import type { StaticWorld } from "../world/collision";
import type { Vehicle } from "./vehicle";
import type { WeaponId } from "./weapons";

export type CharKind = "player" | "civilian" | "police" | "guard" | "rival";
export type PedRole = "commuter" | "vendor" | "dock" | "tourist" | "courier" | "musician" | "resident" | "security" | "police" | "rival" | "player";

export interface Look {
  top: [number, number, number];
  bottom: [number, number, number];
  skin: [number, number, number];
  hair: [number, number, number];
  accent: [number, number, number];
  hat: boolean;
  bag: boolean;
  scale: number;
  build: number; // 0.85..1.15 width
}

export const SKINS: [number, number, number][] = [
  [0.96, 0.8, 0.67], [0.87, 0.66, 0.5], [0.72, 0.52, 0.38], [0.55, 0.38, 0.27], [0.4, 0.27, 0.2], [0.93, 0.74, 0.6],
];
export const HAIRS: [number, number, number][] = [
  [0.1, 0.08, 0.07], [0.3, 0.2, 0.12], [0.55, 0.4, 0.25], [0.8, 0.7, 0.5], [0.7, 0.7, 0.7], [0.45, 0.15, 0.1],
];

export interface FootEnv {
  world: StaticWorld;
  ground(x: number, z: number): number; // terrain + curbs
  water(x: number, z: number): number | null;
}

let charSeq = 1;

export class Character {
  id: string;
  kind: CharKind;
  role: PedRole;
  x = 0; y = 0; z = 0; yaw = 0;
  vx = 0; vz = 0; vy = 0;
  px = 0; py = 0; pz = 0; pyaw = 0;
  radius = 0.33;
  height = 1.8;
  health = 100;
  maxHealth = 100;
  armor = 0;
  alive = true;
  /** normal | knocked | stunned | subdued | dead */
  status: "normal" | "knocked" | "stunned" | "subdued" | "dead" = "normal";
  statusTimer = 0;
  grounded = true;
  crouch = false;
  sprint = false;
  aiming = false;
  swimming = false;
  wading = false;
  mantle: { t: number; dur: number; x0: number; y0: number; z0: number; x1: number; y1: number; z1: number; kind: "vault" | "mantle" } | null = null;
  vehicle: Vehicle | null = null;
  weapon: WeaponId = "fists";
  look: Look;
  animPhase = 0;
  animSpeed = 0;
  lastHurt = -100;
  hitFlash = 0;
  recoil = 0;
  fireCooldown = 0;
  reloadTimer = 0;
  meleeTimer = 0;
  talkTimer = 0;
  wave = 0;
  phoneUp = false;
  handsUp = false;
  enterTimer = 0;
  enterTarget: Vehicle | null = null;
  /** free-form tag for missions */
  tag = "";
  removeMe = false;

  constructor(kind: CharKind, role: PedRole, look: Look, x: number, z: number, y = 0) {
    this.id = `${kind[0]}${charSeq++}`;
    this.kind = kind; this.role = role; this.look = look;
    this.x = this.px = x; this.z = this.pz = z; this.y = this.py = y;
  }

  savePrev() { this.px = this.x; this.py = this.y; this.pz = this.z; this.pyaw = this.yaw; }

  get downed() { return this.status !== "normal"; }
  get eyeY() { return this.y + (this.crouch ? 1.15 : 1.62); }
  get chestY() { return this.y + (this.crouch ? 0.9 : 1.3); }

  knock(seconds: number, status: "knocked" | "stunned" | "subdued" = "knocked") {
    if (!this.alive) return;
    this.status = status;
    this.statusTimer = Math.max(this.statusTimer, seconds);
    this.vx = 0; this.vz = 0;
    this.aiming = false; this.phoneUp = false;
  }

  hurt(dmg: number, now: number) {
    if (!this.alive) return;
    if (this.armor > 0) {
      const toArmor = Math.min(this.armor, dmg * 0.7);
      this.armor -= toArmor; dmg -= toArmor;
    }
    this.health = Math.max(0, this.health - dmg);
    this.lastHurt = now;
    this.hitFlash = 0.25;
    if (this.health <= 0) { this.alive = false; this.status = "dead"; this.statusTimer = 0; this.vx = this.vz = 0; }
  }

  updateStatus(dt: number) {
    if (this.hitFlash > 0) this.hitFlash -= dt;
    if (this.status !== "normal" && this.status !== "dead") {
      this.statusTimer -= dt;
      if (this.statusTimer <= 0) { this.status = "normal"; this.statusTimer = 0; }
    }
  }
}

export const WALK = 2.1, JOG = 4.4, SPRINT = 6.2, CROUCH = 1.8, SWIM = 1.9;
export const JUMP_V = Math.sqrt(2 * 9.81 * 0.85);
const G = 9.81;

/**
 * Locomotion step for a character controlled by an input vector (world-space wish direction,
 * magnitude 0..1) and a target speed. Handles collisions, steps, jump, vault/mantle, swim.
 */
export function stepFoot(c: Character, dt: number, wishX: number, wishZ: number, speed: number, jump: boolean, env: FootEnv, faceYaw?: number) {
  if (c.mantle) {
    const m = c.mantle;
    m.t += dt;
    const t = clamp(m.t / m.dur, 0, 1);
    const e = t * t * (3 - 2 * t);
    c.x = m.x0 + (m.x1 - m.x0) * e;
    c.z = m.z0 + (m.z1 - m.z0) * e;
    const arc = m.kind === "vault" ? Math.sin(t * Math.PI) * 0.45 : 0;
    c.y = m.y0 + (m.y1 - m.y0) * Math.min(1, e * 1.4) + arc;
    if (t >= 1) { c.mantle = null; c.vy = 0; c.grounded = true; }
    c.animSpeed = 0.3;
    return;
  }

  const ground = groundUnder(c, c.x, c.z, env);
  const water = env.water(c.x, c.z);
  const depth = water !== null ? water - ground : 0;
  c.swimming = water !== null && depth > 1.05 && c.y < water - 0.6;
  c.wading = water !== null && !c.swimming && depth > 0.3;

  const mag = Math.min(1, Math.hypot(wishX, wishZ));
  let sp = speed;
  if (c.swimming) sp = SWIM;
  else if (c.wading) sp = Math.min(sp, 2.4);
  const tvx = mag > 0.01 ? (wishX / Math.max(1e-6, Math.hypot(wishX, wishZ))) * sp * mag : 0;
  const tvz = mag > 0.01 ? (wishZ / Math.max(1e-6, Math.hypot(wishX, wishZ))) * sp * mag : 0;
  const accel = c.swimming ? 4 : c.grounded ? 28 : 5;
  c.vx = approach(c.vx, tvx, accel * dt);
  c.vz = approach(c.vz, tvz, accel * dt);

  // facing
  const targetYaw = faceYaw ?? (mag > 0.05 ? Math.atan2(wishX, wishZ) : c.yaw);
  let d = targetYaw - c.yaw;
  d = Math.atan2(Math.sin(d), Math.cos(d));
  c.yaw += d * Math.min(1, (faceYaw !== undefined ? 20 : 12) * dt);

  // vault / mantle on jump with a ledge ahead
  if (jump && !c.swimming && c.grounded) {
    const fx = Math.sin(c.yaw), fz = Math.cos(c.yaw);
    const ledge = env.world.ledgeAhead(c.x, c.z, fx, fz, c.y, 0.75);
    if (ledge) {
      const rel = ledge.top - c.y;
      if (rel <= 1.05 && ledge.depth < 1.6) {
        const over = ledge.depth + 0.95;
        const nx = c.x + fx * over, nz = c.z + fz * over;
        const res = env.world.resolveCircle(nx, nz, c.radius, c.y + 0.2, c.y + c.height);
        if (!res.hit) {
          c.mantle = { t: 0, dur: 0.5, x0: c.x, y0: c.y, z0: c.z, x1: nx, y1: groundUnder(c, nx, nz, env), z1: nz, kind: "vault" };
          return;
        }
      }
      if (rel <= 1.7) {
        const nx = c.x + fx * 0.85, nz = c.z + fz * 0.85;
        c.mantle = { t: 0, dur: 0.75, x0: c.x, y0: c.y, z0: c.z, x1: nx, y1: ledge.top, z1: nz, kind: "mantle" };
        return;
      }
    }
    if (!c.crouch) { c.vy = JUMP_V; c.grounded = false; }
  }
  // swimming: climb out at low edges
  if (c.swimming && water !== null && (jump || mag > 0.5)) {
    const fx = Math.sin(c.yaw), fz = Math.cos(c.yaw);
    const ax = c.x + fx * 0.9, az = c.z + fz * 0.9;
    const g2 = env.ground(ax, az);
    if (g2 > water - 0.2 && g2 - water < 1.7 && env.water(ax, az) === null) {
      c.mantle = { t: 0, dur: 0.8, x0: c.x, y0: c.y, z0: c.z, x1: ax + fx * 0.4, y1: g2, z1: az + fz * 0.4, kind: "mantle" };
      c.swimming = false;
      return;
    }
  }

  // horizontal move with collisions
  let nx = c.x + c.vx * dt, nz = c.z + c.vz * dt;
  const stepUp = 0.45;
  const res = env.world.resolveCircle(nx, nz, c.radius, c.y + stepUp, c.y + c.height - 0.1);
  nx = res.x; nz = res.z;
  // terrain step blocking (canal walls, quay edge when swimming)
  const gNew = groundUnder(c, nx, nz, env);
  if (gNew > c.y + stepUp && !(c.swimming && false)) {
    // try sliding along axes
    const gx = groundUnder(c, nx, c.z, env), gz = groundUnder(c, c.x, nz, env);
    if (gx <= c.y + stepUp) nz = c.z;
    else if (gz <= c.y + stepUp) nx = c.x;
    else { nx = c.x; nz = c.z; }
    c.vx *= 0.5; c.vz *= 0.5;
  }
  if (res.hit) {
    // remove velocity into wall
    const vn = c.vx * res.nx + c.vz * res.nz;
    if (vn < 0) { c.vx -= vn * res.nx; c.vz -= vn * res.nz; }
  }
  c.x = nx; c.z = nz;

  // vertical
  const g = groundUnder(c, c.x, c.z, env);
  if (c.swimming && water !== null) {
    c.y = approach(c.y, water - 1.25, 3 * dt);
    c.vy = 0;
    c.grounded = false;
  } else {
    c.vy -= G * dt;
    c.y += c.vy * dt;
    if (c.y <= g) {
      if (c.vy < -13 && c.kind === "player") c.hurt((-c.vy - 13) * 9, 0);
      c.y = g; c.vy = 0; c.grounded = true;
    } else if (c.y - g < 0.25 && c.vy <= 0 && c.grounded) {
      c.y = g; c.vy = 0; // stick to slopes/stairs
    } else {
      c.grounded = false;
    }
  }
  c.animSpeed = Math.hypot(c.vx, c.vz);
  c.animPhase += c.animSpeed * dt * (c.swimming ? 1.2 : 2.2);
}

export function groundUnder(c: { y: number; radius: number }, x: number, z: number, env: FootEnv) {
  const t = env.ground(x, z);
  const s = env.world.supportTop(x, z, c.radius, c.y + 0.5);
  return Math.max(t, s);
}

/** Simplified NPC mover: steer toward a point at speed with collisions. Returns distance left. */
export function moveToward(c: Character, dt: number, tx: number, tz: number, speed: number, env: FootEnv, collide = true): number {
  const dx = tx - c.x, dz = tz - c.z;
  const d = Math.hypot(dx, dz);
  if (d < 0.05) { c.vx = c.vz = 0; c.animSpeed = 0; return 0; }
  const step = Math.min(d, speed * dt);
  c.vx = (dx / d) * speed; c.vz = (dz / d) * speed;
  let nx = c.x + (dx / d) * step, nz = c.z + (dz / d) * step;
  if (collide) {
    const r = env.world.resolveCircle(nx, nz, c.radius, c.y + 0.45, c.y + c.height - 0.1);
    nx = r.x; nz = r.z;
  }
  c.x = nx; c.z = nz;
  const g = env.ground(c.x, c.z);
  c.y += (g - c.y) * Math.min(1, 12 * dt);
  const ty = Math.atan2(dx, dz);
  let a = ty - c.yaw; a = Math.atan2(Math.sin(a), Math.cos(a));
  c.yaw += a * Math.min(1, 10 * dt);
  c.animSpeed = speed;
  c.animPhase += speed * dt * 2.2;
  return d - step;
}
