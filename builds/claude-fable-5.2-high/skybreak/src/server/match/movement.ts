// server-match: authoritative character controller. Every movement mode is validated here; clients only send inputs.
import { ITEMS, GRAPPLE_SPEED } from "../../shared/content/items";
import { MOVE } from "../../shared/content/rules";
import { approach, clamp } from "../../shared/math";
import { Btn, Mode } from "../../shared/protocol/protocol";
import { actorHeight, type Actor } from "./actor";
import type { Match } from "./match";

const R = MOVE.radius;
const BOUND = 790;
const tmpN = { x: 0, y: 0, z: 0 };

function wish(a: Actor): [number, number, number] {
  let mx = clamp(a.input.moveX, -1, 1),
    mz = clamp(a.input.moveZ, -1, 1);
  const l = Math.hypot(mx, mz);
  if (l > 1) {
    mx /= l;
    mz /= l;
  }
  const sy = Math.sin(a.yaw),
    cy = Math.cos(a.yaw);
  return [sy * mz + cy * mx, cy * mz - sy * mx, mz];
}

function moveHorizontal(m: Match, a: Actor, dt: number, y0: number, y1: number): boolean {
  const w = m.world;
  const dx = a.vx * dt,
    dz = a.vz * dt;
  const dist = Math.hypot(dx, dz);
  const steps = Math.max(1, Math.ceil(dist / 0.3));
  let hit = false;
  let x = a.x,
    z = a.z;
  for (let i = 0; i < steps; i++) {
    x += dx / steps;
    z += dz / steps;
    if (w.resolve(x, z, R, y0, y1)) {
      x = w.outX;
      z = w.outZ;
      hit = true;
    }
  }
  a.x = clamp(x, -BOUND, BOUND);
  a.z = clamp(z, -BOUND, BOUND);
  return hit;
}

function land(m: Match, a: Actor, groundY: number, impact: number): void {
  a.y = groundY;
  const wasInsertion = a.insertion;
  if (!a.noFall && impact > MOVE.fallSafeSpeed) {
    m.damage(a, (impact - MOVE.fallSafeSpeed) * MOVE.fallDamagePerSpeed, -1, "fall", "torso", true);
  }
  a.vy = 0;
  a.mode = Mode.Ground;
  a.noFall = false;
  a.ventBoost = false;
  a.insertion = false;
  if (a.alive) m.emit({ t: "land", actor: a.id, hard: impact > 11 || wasInsertion });
  if (wasInsertion) m.onLanded(a);
}

function enterSwim(m: Match, a: Actor): void {
  a.mode = Mode.Swim;
  a.vy = 0;
  a.crouch = false;
  a.noFall = false;
  a.ventBoost = false;
  if (a.insertion) {
    a.insertion = false;
    m.onLanded(a);
  }
  m.emit({ t: "launch", actor: a.id, kind: "splash" });
}

export function tryMantle(m: Match, a: Actor): boolean {
  const w = m.world;
  const grounded = a.mode === Mode.Ground || a.mode === Mode.Slide;
  const feet = a.y;
  const minUp = grounded ? MOVE.mantleMin : 0.25;
  const maxUp = grounded ? MOVE.mantleMax : 1.75;
  const fx = Math.sin(a.yaw),
    fz = Math.cos(a.yaw);
  const h = actorHeight(a);
  for (const d of [0.55, 0.85, 1.15]) {
    const px = a.x + fx * d,
      pz = a.z + fz * d;
    const top = w.support(px, pz, 0.25, feet + maxUp + 0.01);
    if (w.supportBox < 0) continue;
    const up = top - feet;
    if (up < minUp) continue;
    if (w.blocked(px, pz, 0.3, top + 0.05, top + MOVE.crouchHeight)) continue;
    if (top + 1.2 > feet + h && w.blocked(a.x, a.z, 0.3, feet + h, top + 1.2)) continue;
    a.mode = Mode.Mantle;
    a.mantleT = 0;
    a.mantleDur = 0.2 + 0.2 * Math.max(0.5, up);
    a.mfx = a.x;
    a.mfy = a.y;
    a.mfz = a.z;
    a.mtx = px;
    a.mty = top;
    a.mtz = pz;
    a.vx = a.vy = a.vz = 0;
    a.crouch = w.blocked(px, pz, 0.3, top + MOVE.crouchHeight, top + MOVE.height);
    m.emit({ t: "launch", actor: a.id, kind: "mantle" });
    return true;
  }
  return false;
}

export function tryAttachZip(m: Match, a: Actor): boolean {
  const zips = m.island.ziplines;
  const py = a.y + 1.6;
  for (let i = 0; i < zips.length; i++) {
    const zl = zips[i]!;
    const dx = zl.bx - zl.ax,
      dy = zl.by - zl.ay,
      dz = zl.bz - zl.az;
    const len2 = dx * dx + dy * dy + dz * dz;
    const t = clamp(((a.x - zl.ax) * dx + (py - zl.ay) * dy + (a.z - zl.az) * dz) / len2, 0, 1);
    const cx = zl.ax + dx * t,
      cy = zl.ay + dy * t,
      cz = zl.az + dz * t;
    const d = Math.hypot(a.x - cx, py - cy, a.z - cz);
    if (d > 3.0) continue;
    a.mode = Mode.Zip;
    a.zipId = i;
    a.zipT = clamp(t, 0.01, 0.99);
    const look = Math.sin(a.yaw) * dx + Math.cos(a.yaw) * dz;
    a.zipDir = t < 0.1 ? 1 : t > 0.9 ? -1 : look >= 0 ? 1 : -1;
    a.crouch = false;
    m.emit({ t: "launch", actor: a.id, kind: "zip" });
    return true;
  }
  return false;
}

export function zipInRange(m: Match, a: Actor): number {
  const zips = m.island.ziplines;
  const py = a.y + 1.6;
  for (let i = 0; i < zips.length; i++) {
    const zl = zips[i]!;
    const dx = zl.bx - zl.ax,
      dy = zl.by - zl.ay,
      dz = zl.bz - zl.az;
    const len2 = dx * dx + dy * dy + dz * dz;
    const t = clamp(((a.x - zl.ax) * dx + (py - zl.ay) * dy + (a.z - zl.az) * dz) / len2, 0, 1);
    if (Math.hypot(a.x - (zl.ax + dx * t), py - (zl.ay + dy * t), a.z - (zl.az + dz * t)) <= 3.0) return i;
  }
  return -1;
}

export function ascenderInRange(m: Match, a: Actor): number {
  const list = m.island.ascenders;
  for (let i = 0; i < list.length; i++) {
    const s = list[i]!;
    const d = Math.hypot(a.x - s.x, a.z - s.z);
    if (d < 1.7 && Math.abs(a.y - s.y0) < 1.3) return i;
    if (d < 2.6 && Math.abs(a.y - s.y1) < 1.0) return i;
  }
  return -1;
}

export function tryAttachAscender(m: Match, a: Actor): boolean {
  const i = ascenderInRange(m, a);
  if (i < 0) return false;
  const s = m.island.ascenders[i]!;
  a.mode = Mode.Ascend;
  a.ascId = i;
  a.ascDir = Math.abs(a.y - s.y0) < Math.abs(a.y - s.y1) ? 1 : -1;
  a.x = s.x;
  a.z = s.z;
  a.vx = a.vy = a.vz = 0;
  a.crouch = false;
  m.emit({ t: "launch", actor: a.id, kind: "zip" });
  return true;
}

function canDeploy(m: Match, a: Actor): boolean {
  const sup = m.world.support(a.x, a.z, R, a.y + 0.5);
  return a.y - sup >= MOVE.redeployClearance;
}

function stepFreefall(m: Match, a: Actor, dt: number): void {
  const w = m.world;
  const dive = clamp((-a.pitch - 0.15) / 1.0, 0, 1);
  const [wx, wz] = wish(a);
  const steer = MOVE.freefallSteer * (1 - dive * 0.45);
  a.vx = approach(a.vx, wx * steer, 26 * dt);
  a.vz = approach(a.vz, wz * steer, 26 * dt);
  a.vy = approach(a.vy, -(MOVE.freefallTerminal + (MOVE.freefallDive - MOVE.freefallTerminal) * dive), 34 * dt);
  const oldY = a.y;
  a.x = clamp(a.x + a.vx * dt, -BOUND, BOUND);
  a.z = clamp(a.z + a.vz * dt, -BOUND, BOUND);
  const ny = a.y + a.vy * dt;
  const sup = w.support(a.x, a.z, R, oldY + 0.5);
  const clearance = ny - Math.max(sup, 0);
  if (clearance <= MOVE.autoDeployHeight || a.input.pressed & (Btn.Sail | Btn.Jump)) {
    a.y = Math.max(ny, sup);
    a.mode = Mode.Glide;
    a.vy = Math.max(a.vy, -24);
    m.emit({ t: "launch", actor: a.id, kind: "deploy" });
    return;
  }
  a.y = ny;
}

function stepGlide(m: Match, a: Actor, dt: number): void {
  const w = m.world;
  const dive = clamp((-a.pitch - 0.25) / 0.9, 0, 1);
  const mz = clamp(a.input.moveZ, -1, 1),
    mx = clamp(a.input.moveX, -1, 1);
  const fwd = mz > 0.1 ? MOVE.glideSpeed + (MOVE.glideDiveSpeed - MOVE.glideSpeed) * dive : mz < -0.1 ? 8 : 13;
  const sy = Math.sin(a.yaw),
    cy = Math.cos(a.yaw);
  const tx = sy * fwd + cy * mx * 7,
    tz = cy * fwd - sy * mx * 7;
  a.vx = approach(a.vx, tx, 20 * dt);
  a.vz = approach(a.vz, tz, 20 * dt);
  a.vy = approach(a.vy, -(MOVE.glideSink + (MOVE.glideDiveSink - MOVE.glideSink) * dive), 22 * dt);
  const oldY = a.y;
  moveHorizontal(m, a, dt, a.y + 0.4, a.y + MOVE.height);
  const ny = a.y + a.vy * dt;
  const sup = w.support(a.x, a.z, R * 0.8, oldY + 0.5);
  if (ny <= sup) {
    a.noFall = true;
    land(m, a, sup, 0);
    return;
  }
  if (ny < -MOVE.swimDepth - 0.1 && sup < -MOVE.swimDepth) {
    a.y = ny;
    enterSwim(m, a);
    return;
  }
  a.y = ny;
  if (a.input.pressed & Btn.Sail) {
    a.mode = Mode.Air; // stow
  }
}

function stepMantle(m: Match, a: Actor, dt: number): void {
  a.mantleT += dt;
  const p = Math.min(1, a.mantleT / a.mantleDur);
  const up = Math.min(1, p * 1.6);
  const fw = clamp((p - 0.35) / 0.65, 0, 1);
  a.y = a.mfy + (a.mty - a.mfy) * up;
  a.x = a.mfx + (a.mtx - a.mfx) * fw;
  a.z = a.mfz + (a.mtz - a.mfz) * fw;
  if (p >= 1) {
    a.mode = Mode.Ground;
    a.x = a.mtx;
    a.y = a.mty;
    a.z = a.mtz;
    a.noFall = false;
    a.ventBoost = false;
    if (a.insertion) {
      a.insertion = false;
      m.onLanded(a);
    }
  }
}

function stepSwim(m: Match, a: Actor, dt: number): void {
  const w = m.world;
  const [wx, wz] = wish(a);
  const sprint = (a.input.buttons & Btn.Sprint) !== 0 && a.energy > 0 && (wx !== 0 || wz !== 0);
  if (sprint) {
    a.energy = Math.max(0, a.energy - dt / MOVE.sprintEnergy);
    a.lastSprint = m.time;
  }
  a.sprinting = sprint;
  const sp = sprint ? MOVE.swimSprint : MOVE.swim;
  a.vx = approach(a.vx, wx * sp, 18 * dt);
  a.vz = approach(a.vz, wz * sp, 18 * dt);
  moveHorizontal(m, a, dt, a.y + 0.6, a.y + MOVE.height);
  const th = w.terrain(a.x, a.z);
  a.y = Math.max(th, approach(a.y, -1.2, 3 * dt));
  if (th > -MOVE.swimDepth) {
    a.mode = Mode.Ground;
    a.y = Math.max(th, a.y);
    return;
  }
  const sup = w.support(a.x, a.z, 0.32, a.y + 0.6);
  if (w.supportBox >= 0 && sup > a.y - 0.15) {
    a.mode = Mode.Ground;
    a.y = sup;
    return;
  }
  if (a.input.pressed & Btn.Jump) tryMantle(m, a);
}

function stepZip(m: Match, a: Actor, dt: number): void {
  const zl = m.island.ziplines[a.zipId];
  if (!zl) {
    a.mode = Mode.Air;
    return;
  }
  const dx = zl.bx - zl.ax,
    dy = zl.by - zl.ay,
    dz = zl.bz - zl.az;
  const len = Math.hypot(dx, dy, dz);
  a.zipT += (a.zipDir * MOVE.zipSpeed * dt) / len;
  const t = clamp(a.zipT, 0, 1);
  a.x = zl.ax + dx * t;
  a.y = zl.ay + dy * t - 2.15;
  a.z = zl.az + dz * t;
  const k = (a.zipDir * MOVE.zipSpeed) / len;
  a.vx = dx * k;
  a.vy = dy * k;
  a.vz = dz * k;
  if (a.zipT <= 0 || a.zipT >= 1) {
    a.mode = Mode.Air;
    a.vx *= 0.25;
    a.vz *= 0.25;
    a.vy = 0;
    a.coyote = 0;
    return;
  }
  if (a.input.pressed & (Btn.Jump | Btn.Crouch)) {
    a.mode = Mode.Air;
    a.vx *= 0.85;
    a.vz *= 0.85;
    a.vy = a.input.pressed & Btn.Jump ? 4.5 : 0;
    a.coyote = 0;
  }
}

function stepAscend(m: Match, a: Actor, dt: number): void {
  const s = m.island.ascenders[a.ascId];
  if (!s) {
    a.mode = Mode.Air;
    return;
  }
  a.x = s.x;
  a.z = s.z;
  a.y += a.ascDir * MOVE.ascendSpeed * dt;
  a.vx = a.vz = 0;
  a.vy = a.ascDir * MOVE.ascendSpeed;
  if (a.ascDir > 0 && a.y >= s.y1) {
    a.y = s.y1;
    const ex = s.x + Math.sin(s.exitYaw) * 1.3,
      ez = s.z + Math.cos(s.exitYaw) * 1.3;
    if (!m.world.blocked(ex, ez, 0.3, s.y1 + 0.15, s.y1 + 1.2)) {
      a.x = ex;
      a.z = ez;
      a.mode = Mode.Ground;
      a.vy = 0;
    } else {
      a.ascDir = -1; // unsafe exit: ride back down
    }
    return;
  }
  if (a.ascDir < 0 && a.y <= s.y0) {
    a.y = s.y0;
    a.mode = Mode.Ground;
    a.vy = 0;
    return;
  }
  if (a.input.pressed & Btn.Jump) {
    a.mode = Mode.Air;
    a.vx = -Math.sin(s.exitYaw) * 3;
    a.vz = -Math.cos(s.exitYaw) * 3;
    a.vy = 2;
    a.coyote = 0;
  }
}

function stepGrapple(m: Match, a: Actor, dt: number): void {
  const dx = a.grx - a.x,
    dy = a.gry - (a.y + 1.0),
    dz = a.grz - a.z;
  const d = Math.hypot(dx, dy, dz);
  const release = (pop: boolean): void => {
    a.mode = Mode.Air;
    a.noFall = true;
    a.coyote = 0;
    if (pop) {
      a.vx *= 0.3;
      a.vz *= 0.3;
      a.vy = 6.5;
    }
  };
  if (d < 1.6 || m.time > a.grappleEnd) {
    release(true);
    return;
  }
  const k = GRAPPLE_SPEED / d;
  a.vx = dx * k;
  a.vy = dy * k;
  a.vz = dz * k;
  const hit = moveHorizontal(m, a, dt, a.y + 0.5, a.y + MOVE.height);
  const ny = a.y + a.vy * dt;
  const sup = m.world.support(a.x, a.z, R * 0.8, a.y + MOVE.step);
  a.y = Math.max(ny, sup);
  if (hit && d < 4) release(true);
  if (a.input.pressed & Btn.Jump) release(false);
}

function stepWalk(m: Match, a: Actor, dt: number): void {
  const w = m.world;
  const inp = a.input;
  const pressed = inp.pressed;
  const held = inp.buttons;
  const now = m.time;
  const [wx, wz, mzRaw] = wish(a);
  const using = a.useItem ? ITEMS[a.useItem] : null;
  const speedH = Math.hypot(a.vx, a.vz);
  const wantCrouch = (held & Btn.Crouch) !== 0;
  const oldX = a.x,
    oldZ = a.z,
    oldY = a.y;

  // ---- stance ----
  if (a.mode === Mode.Ground) {
    if (pressed & Btn.Crouch && speedH > MOVE.slideMinSpeed && now >= a.slideGate && !using && !a.crouch) {
      a.mode = Mode.Slide;
      a.slideT = 0;
      a.slideSpeed = Math.max(speedH, MOVE.sprint * 0.9) * MOVE.slideBoost;
      a.sdx = a.vx / speedH;
      a.sdz = a.vz / speedH;
      m.emit({ t: "launch", actor: a.id, kind: "slide" });
    } else if (wantCrouch) a.crouch = true;
    else if (a.crouch && !w.blocked(a.x, a.z, R * 0.9, a.y + MOVE.crouchHeight, a.y + MOVE.height)) a.crouch = false;
  }
  const height = actorHeight(a);

  // ---- sprint energy ----
  const ads = (held & Btn.Ads) !== 0;
  let sprinting = false;
  if (a.mode === Mode.Ground && held & Btn.Sprint && mzRaw > 0.3 && !a.crouch && !ads && !using && a.energy > 0 && now > a.lastShot + 0.3 && a.chargeEnd < 0) {
    sprinting = true;
    a.energy = Math.max(0, a.energy - dt / MOVE.sprintEnergy);
    a.lastSprint = now;
  } else if (now - a.lastSprint > MOVE.sprintRegenDelay) {
    a.energy = Math.min(1, a.energy + dt / MOVE.sprintRegenTime);
  }
  a.sprinting = sprinting;

  // ---- horizontal velocity ----
  if (a.mode === Mode.Slide) {
    a.slideT += dt;
    let grade = 0;
    if (Math.abs(a.y - w.terrain(a.x, a.z)) < 0.08) grade = (w.terrain(a.x + a.sdx, a.z + a.sdz) - w.terrain(a.x - a.sdx, a.z - a.sdz)) / 2;
    a.slideSpeed = clamp(a.slideSpeed + (-4.6 - grade * 20) * dt, 0, 14);
    a.vx = a.sdx * a.slideSpeed;
    a.vz = a.sdz * a.slideSpeed;
    const downhill = grade < -0.08;
    const end =
      a.slideSpeed < 3.4 ||
      a.slideT > MOVE.slideMaxDuration ||
      (a.slideT > MOVE.slideDuration && !downhill) ||
      (a.slideT > 0.25 && !wantCrouch);
    if (end) {
      a.mode = Mode.Ground;
      a.slideGate = now + MOVE.slideGate;
      a.crouch = wantCrouch || w.blocked(a.x, a.z, R * 0.9, a.y + MOVE.crouchHeight, a.y + MOVE.height);
    }
  } else if (a.mode === Mode.Ground) {
    let target: number = MOVE.run;
    if (a.crouch) target = MOVE.crouch;
    else if (sprinting) target = MOVE.sprint;
    else if (ads) target = MOVE.walk;
    if (using) target *= using.moveMult;
    const th = w.terrain(a.x, a.z);
    if (th < -0.35 && a.y < -0.3) target *= 0.8; // wading
    if (a.dummy && !a.mover) target = 0;
    a.vx = approach(a.vx, wx * target, 60 * dt);
    a.vz = approach(a.vz, wz * target, 60 * dt);
  } else {
    // air control: steer without exceeding run speed by input alone
    const cap = Math.max(MOVE.run, speedH);
    let nvx = a.vx + wx * 16 * dt,
      nvz = a.vz + wz * 16 * dt;
    const ns = Math.hypot(nvx, nvz);
    if (ns > cap) {
      nvx *= cap / ns;
      nvz *= cap / ns;
    }
    a.vx = nvx;
    a.vz = nvz;
  }

  // ---- jump / mantle ----
  if (pressed & Btn.Jump && !using) {
    if (!tryMantle(m, a)) {
      const canJump = a.mode === Mode.Ground || a.mode === Mode.Slide || (a.mode === Mode.Air && now < a.coyote);
      if (canJump && !w.blocked(a.x, a.z, R * 0.9, a.y + height, a.y + MOVE.height + 0.3)) {
        if (a.mode === Mode.Slide) a.slideGate = now + MOVE.slideGate;
        a.mode = Mode.Air;
        a.vy = MOVE.jumpSpeed;
        a.crouch = false;
        a.coyote = 0;
        m.emit({ t: "launch", actor: a.id, kind: "jump" });
      } else if (a.mode === Mode.Air && tryAttachZip(m, a)) return;
    } else return;
  }

  // ---- air vents ----
  for (const v of m.island.vents) {
    const dx = a.x - v.x,
      dz = a.z - v.z;
    if (dx * dx + dz * dz < v.r * v.r && Math.abs(a.y - v.y) < 1.6 && a.vy <= 1) {
      a.mode = Mode.Air;
      a.vy = MOVE.ventPower;
      a.ventBoost = true;
      a.noFall = true;
      a.crouch = false;
      a.coyote = 0;
      m.emit({ t: "launch", actor: a.id, kind: "vent" });
      break;
    }
  }

  // ---- move ----
  const hitWall = moveHorizontal(m, a, dt, a.y + MOVE.step, a.y + height);
  if (hitWall && a.mode === Mode.Slide) a.slideSpeed *= 0.6;

  if (a.mode === Mode.Ground || a.mode === Mode.Slide) {
    let sup = w.support(a.x, a.z, R * 0.8, a.y + MOVE.step + 0.01);
    if (w.supportBox < 0) {
      // steep terrain: cannot be climbed, and it sheds you downhill
      const ny = w.hf.normal(a.x, a.z, tmpN);
      if (ny < 0.67) {
        const gl = Math.hypot(tmpN.x, tmpN.z) || 1;
        const ux = -tmpN.x / gl,
          uz = -tmpN.z / gl;
        const dxm = a.x - oldX,
          dzm = a.z - oldZ;
        const along = dxm * ux + dzm * uz;
        if (along > 0) {
          a.x -= ux * along;
          a.z -= uz * along;
        }
        a.x -= ux * 5 * dt;
        a.z -= uz * 5 * dt;
        if (w.resolve(a.x, a.z, R, a.y + MOVE.step, a.y + height)) {
          a.x = w.outX;
          a.z = w.outZ;
        }
        sup = w.support(a.x, a.z, R * 0.8, a.y + MOVE.step + 0.01);
      }
    }
    if (sup >= a.y - 0.55) {
      a.y = sup;
      a.vy = 0;
    } else {
      a.mode = Mode.Air;
      a.vy = 0;
      a.coyote = now + 0.12;
    }
    if (a.y < -MOVE.swimDepth && w.terrain(a.x, a.z) < -MOVE.swimDepth) enterSwim(m, a);
  } else {
    // airborne
    a.vy -= MOVE.gravity * dt;
    let ny = a.y + a.vy * dt;
    if (a.vy > 0) {
      const c = w.ceiling(a.x, a.z, R * 0.9, a.y + height, ny + height);
      if (c !== Infinity) {
        ny = c - height - 0.01;
        a.vy = 0;
      }
    }
    const sup = w.support(a.x, a.z, R * 0.8, oldY + MOVE.step);
    if (ny <= sup) {
      land(m, a, sup, -a.vy);
    } else if (ny < -MOVE.swimDepth - 0.1 && sup < -MOVE.swimDepth) {
      a.y = ny;
      enterSwim(m, a);
    } else {
      a.y = ny;
      // wing-sail: manual redeploy with clearance, automatic after vents and during insertion
      const clearance = a.y - Math.max(sup, 0);
      const manual = pressed & Btn.Sail && clearance >= MOVE.redeployClearance;
      const autoVent = a.ventBoost && a.vy < -5 && clearance > 5;
      const autoInsert = a.insertion && a.vy < -18 && clearance < 55;
      if (manual || autoVent || autoInsert) {
        a.mode = Mode.Glide;
        a.vy = Math.max(a.vy, -20);
        m.emit({ t: "launch", actor: a.id, kind: "deploy" });
      }
    }
  }
}

export function stepMovement(m: Match, a: Actor, dt: number): void {
  const px = a.x,
    pz = a.z;
  switch (a.mode) {
    case Mode.Skiff:
      a.x = m.skiff.x;
      a.y = m.skiff.y - 2.5;
      a.z = m.skiff.z;
      a.vx = a.vy = a.vz = 0;
      if (m.canJump && a.input.pressed & (Btn.Jump | Btn.Interact)) m.jumpFromSkiff(a);
      return;
    case Mode.Freefall:
      stepFreefall(m, a, dt);
      break;
    case Mode.Glide:
      stepGlide(m, a, dt);
      break;
    case Mode.Mantle:
      stepMantle(m, a, dt);
      break;
    case Mode.Swim:
      stepSwim(m, a, dt);
      break;
    case Mode.Zip:
      stepZip(m, a, dt);
      break;
    case Mode.Ascend:
      stepAscend(m, a, dt);
      break;
    case Mode.Grapple:
      stepGrapple(m, a, dt);
      break;
    case Mode.Dead:
      return;
    default:
      stepWalk(m, a, dt);
  }
  if (a.mode !== Mode.Ground && a.mode !== Mode.Slide && a.mode !== Mode.Swim && a.mode !== Mode.Air) a.sprinting = false;
  const moved = Math.hypot(a.x - px, a.z - pz);
  if (moved < 5) a.stats.distance += moved;
}

export { canDeploy };
