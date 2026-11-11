// shared-simulation: the per-player fixed step (movement, stance, mantle, weapon timing, ammo, equipment).
// This exact function runs on the authoritative room for every player and on the client for prediction.
// All state is a flat record of float32-rounded numbers, so server and client stay bit-identical.
import { COMBAT, DT, JUMP_V, MOVE } from '../content/tuning';
import type { ResolvedLoadout } from '../content/loadout';
import type { WeaponStats } from '../content/weapons';
import { approach, clamp, hash3, lerp, smooth, TAU } from './math';
import { eyeHeight } from './hitboxes';
import type { World } from './world';

export const BTN = {
  FIRE: 1,
  ADS: 2,
  SPRINT: 4,
  CROUCH: 8,
  JUMP: 16,
  RELOAD: 32,
  MELEE: 64,
  LETHAL: 128,
  TACTICAL: 256,
  SUPPORT: 512,
  PING: 1024,
} as const;

export interface InputCmd {
  seq: number;
  /** server tick the client was rendering remote players at (lag compensation) */
  rt: number;
  mx: number;
  mz: number;
  yaw: number;
  pitch: number;
  buttons: number;
  slot: number;
  /** selected support tier */
  sel: number;
}

export const STATE_FIELDS = [
  'px', 'py', 'pz', 'vx', 'vy', 'vz', 'yaw', 'pitch', 'grounded', 'crouch', 'crouchT', 'sprint', 'sprintHold', 'sprintOut', 'airT',
  'mantleT', 'mantleDur', 'mfx', 'mfy', 'mfz', 'mtx', 'mty', 'mtz',
  'slot', 'pendingSlot', 'swapT', 'mag0', 'res0', 'mag1', 'res1', 'fireCd', 'fireBuf', 'reloadT', 'reloadDur', 'reloadEmpty', 'reloadIn',
  'adsT', 'bloom', 'burst', 'sinceShot', 'shotSeq', 'actT', 'lethal', 'lethalRe', 'tactical', 'tacticalRe', 'cookT', 'btn', 'moved', 'fired',
] as const;
export type StateField = (typeof STATE_FIELDS)[number];
export type PlayerState = Record<StateField, number>;

export type SimEvent =
  | { t: 'shot'; slot: number; seq: number; ox: number; oy: number; oz: number; dirs: number[]; burst: number; ads: number }
  | { t: 'dry' }
  | { t: 'reload'; empty: boolean; dur: number }
  | { t: 'reloadStage'; stage: number }
  | { t: 'reloadEnd'; done: boolean }
  | { t: 'shell' }
  | { t: 'swapStart'; to: number }
  | { t: 'swap'; slot: number }
  | { t: 'melee' }
  | { t: 'cook' }
  | { t: 'throw'; kind: 'lethal' | 'tactical'; ox: number; oy: number; oz: number; vx: number; vy: number; vz: number; fuse: number }
  | { t: 'jump' }
  | { t: 'land'; speed: number }
  | { t: 'mantle'; dur: number };

export interface StepCtx {
  world: World;
  lo: ResolvedLoadout;
  id: number;
  frozen: boolean;
  equipMult: number;
  /** null while replaying acknowledged-pending inputs (no side effects) */
  ev: SimEvent[] | null;
}

export function newPlayerState(x: number, y: number, z: number, yaw: number, lo: ResolvedLoadout): PlayerState {
  const s = {} as PlayerState;
  for (const f of STATE_FIELDS) s[f] = 0;
  s.px = x; s.py = y; s.pz = z; s.yaw = yaw;
  s.grounded = 1;
  s.mantleT = -1;
  s.reloadT = -1;
  s.cookT = -1;
  s.mag0 = lo.weapons[0].mag; s.res0 = lo.weapons[0].reserve;
  s.mag1 = lo.weapons[1].mag; s.res1 = lo.weapons[1].reserve;
  s.lethal = 1; s.tactical = 1;
  quantize(s);
  return s;
}

export function copyState(dst: PlayerState, src: PlayerState): void {
  for (let i = 0; i < STATE_FIELDS.length; i++) dst[STATE_FIELDS[i]] = src[STATE_FIELDS[i]];
}
export function cloneState(src: PlayerState): PlayerState { return { ...src }; }

function quantize(s: PlayerState): void {
  for (let i = 0; i < STATE_FIELDS.length; i++) s[STATE_FIELDS[i]] = Math.fround(s[STATE_FIELDS[i]]);
}

/** Current cone half-angle in degrees (also drives the crosshair). */
export function currentSpread(s: PlayerState, w: WeaponStats): number {
  const d = w.def;
  const speed = Math.sqrt(s.vx * s.vx + s.vz * s.vz);
  const moveFrac = Math.min(1, speed / MOVE.walk);
  let hip = (d.hip.base + d.hip.move * moveFrac + s.bloom) * w.hipMul;
  if (s.crouch) hip *= 0.8;
  if (!s.grounded) hip = hip * 1.5 + 1.5;
  hip = Math.min(hip, d.hip.max * w.hipMul * 1.4 + 2);
  const ads = d.adsSpread * (1 + 0.6 * moveFrac) + (d.pellets > 1 ? 0 : s.grounded ? 0 : 1.2);
  const a = s.adsT * s.adsT * s.adsT;
  return lerp(hip, ads, a);
}

const fwd = { x: 0, y: 0, z: 0 };

export function stepPlayer(s: PlayerState, cmd: InputCmd, ctx: StepCtx): void {
  s.yaw = cmd.yaw;
  s.pitch = clamp(cmd.pitch, -1.55, 1.55);
  const pressed = cmd.buttons & ~s.btn;
  if (ctx.frozen) {
    s.vx = 0; s.vz = 0;
    s.btn = cmd.buttons;
    quantize(s);
    return;
  }
  stepMove(s, cmd, pressed, ctx);
  stepWeapon(s, cmd, pressed, ctx);
  s.btn = cmd.buttons;
  quantize(s);
}

function stepMove(s: PlayerState, cmd: InputCmd, pressed: number, ctx: StepCtx): void {
  const lo = ctx.lo, perks = lo.perks, w = lo.weapons[s.slot];
  const world = ctx.world;
  if (s.mantleT >= 0) {
    s.mantleT += DT;
    const u = Math.min(1, s.mantleT / s.mantleDur);
    const uy = 1 - (1 - Math.min(1, u / 0.62)) ** 2;
    const uh = smooth(Math.max(0, (u - 0.3) / 0.7));
    const ox = s.px, oz = s.pz;
    s.px = lerp(s.mfx, s.mtx, uh);
    s.pz = lerp(s.mfz, s.mtz, uh);
    s.py = lerp(s.mfy, s.mty, uy);
    s.moved += Math.hypot(s.px - ox, s.pz - oz);
    s.vx = 0; s.vy = 0; s.vz = 0;
    s.grounded = 0; s.sprint = 0; s.sprintHold = 0;
    if (u >= 1) {
      s.mantleT = -1;
      s.grounded = 1;
      s.airT = 0;
      s.vx = Math.sin(s.yaw) * 2.2;
      s.vz = Math.cos(s.yaw) * 2.2;
    }
    return;
  }
  // stance
  const wantCrouch = (cmd.buttons & BTN.CROUCH) !== 0;
  if (wantCrouch && !s.crouch) s.crouch = 1;
  else if (!wantCrouch && s.crouch && world.fits(s.px, s.py, s.pz, false)) s.crouch = 0;
  s.crouchT = approach(s.crouchT, s.crouch, MOVE.crouchRate * DT);

  let mx = cmd.mx, mz = cmd.mz;
  const len = Math.hypot(mx, mz);
  if (len > 1) { mx /= len; mz /= len; }
  const moving = len > 0.05;

  const sprintCond = (cmd.buttons & BTN.SPRINT) !== 0 && mz > 0.5 && !s.crouch && (cmd.buttons & (BTN.ADS | BTN.FIRE)) === 0 && s.actT <= 0 && s.cookT < 0;
  if (sprintCond) s.sprintHold += DT; else s.sprintHold = 0;
  const sprinting = sprintCond && s.sprintHold >= MOVE.sprintDelay * perks.sprintDelayMul && (s.grounded === 1 || s.sprint === 1);
  s.sprint = sprinting ? 1 : 0;

  let speed = s.crouch ? MOVE.crouch : sprinting ? MOVE.sprint * perks.sprintMul : MOVE.walk;
  speed *= w.def.moveMult;
  if (!sprinting) speed *= lerp(1, Math.min(1, w.adsMove * perks.adsMoveMul), s.adsT);
  if (mz < -0.1 && !sprinting) speed *= 0.92;

  const sy = Math.sin(s.yaw), cy = Math.cos(s.yaw);
  const tx = (mx * cy + mz * sy) * speed;
  const tz = (-mx * sy + mz * cy) * speed;
  if (s.grounded || moving) {
    const acc = s.grounded ? (moving ? MOVE.accel : MOVE.decel) : MOVE.accel * MOVE.airControl;
    let dvx = tx - s.vx, dvz = tz - s.vz;
    if (!s.grounded) {
      // air control only nudges; it never adds speed beyond the current target speed
      const cur = Math.hypot(s.vx, s.vz);
      if (cur > speed) { dvx = tx * (cur / Math.max(speed, 0.01)) - s.vx; dvz = tz * (cur / Math.max(speed, 0.01)) - s.vz; }
    }
    const dl = Math.hypot(dvx, dvz);
    const maxd = acc * DT;
    if (dl > maxd) { dvx *= maxd / dl; dvz *= maxd / dl; }
    s.vx += dvx; s.vz += dvz;
  }

  // jump / mantle
  if (pressed & BTN.JUMP) {
    if (tryMantle(s, ctx)) return;
    if (s.grounded) {
      s.vy = JUMP_V;
      s.grounded = 0;
      s.airT = 0.0001;
      if (s.crouch && world.fits(s.px, s.py, s.pz, false)) s.crouch = 0;
      ctx.ev?.push({ t: 'jump' });
    }
  } else if ((cmd.buttons & BTN.JUMP) && !s.grounded && s.vy < 2.5 && mz > 0.2) {
    if (tryMantle(s, ctx)) return;
  }

  // While grounded we pass no vertical motion and let snap-to-ground follow slopes and steps: feeding gravity
  // into the kinematic controller every tick makes it clip the horizontal move on ~2% of ticks.
  const jumping = s.vy > 0;
  const wasGrounded = s.grounded === 1;
  const held = wasGrounded && !jumping;
  if (held) s.vy = 0; else s.vy = Math.max(-32, s.vy - MOVE.gravity * DT);
  const preVy = s.vy;
  const r = world.move(s.px, s.py, s.pz, s.crouch === 1, s.vx * DT, held ? 0 : s.vy * DT, s.vz * DT);
  s.px += r.x; s.py += r.y; s.pz += r.z;
  s.moved += Math.hypot(r.x, r.z);
  if (r.grounded && !jumping) {
    if (!wasGrounded && s.airT > 0.12) ctx.ev?.push({ t: 'land', speed: -preVy });
    s.grounded = 1;
    s.airT = 0;
    s.vy = 0;
  } else {
    s.grounded = 0;
    s.airT += DT;
    if (s.vy > 0 && r.y < s.vy * DT * 0.4) s.vy = 0; // bumped a ceiling
  }
  s.vx = r.x / DT;
  s.vz = r.z / DT;
  if (s.py < -20) { s.py = 0.1; s.vy = 0; } // safety net; unreachable in normal play
}

function tryMantle(s: PlayerState, ctx: StepCtx): boolean {
  const world = ctx.world;
  const fx = Math.sin(s.yaw), fz = Math.cos(s.yaw);
  let wall = world.raycast(s.px, s.py + 0.45, s.pz, fx, 0, fz, MOVE.mantleReach + MOVE.radius, 'bullet');
  let wallT = wall ? wall.t : -1;
  if (wallT < 0) {
    wall = world.raycast(s.px, s.py + 0.95, s.pz, fx, 0, fz, MOVE.mantleReach + MOVE.radius, 'bullet');
    wallT = wall ? wall.t : -1;
  }
  if (wallT < 0) return false;
  const startY = s.py + MOVE.mantleMax + 0.45;
  const maxDown = MOVE.mantleMax + 0.45 - MOVE.mantleMin + 0.01;
  for (const reach of [0.45, 0.14]) {
    const tx = s.px + fx * (wallT + reach), tz = s.pz + fz * (wallT + reach);
    const down = world.raycast(tx, startY, tz, 0, -1, 0, maxDown, 'bullet');
    if (!down || down.t <= 0.002 || down.ny < 0.7) continue;
    const topY = startY - down.t;
    const h = topY - s.py;
    if (h < MOVE.mantleMin || h > MOVE.mantleMax) continue;
    let crouch = false;
    if (!world.fits(tx, topY + 0.03, tz, false)) {
      if (!world.fits(tx, topY + 0.03, tz, true)) continue;
      crouch = true;
    }
    if (!world.fits(s.px, topY + 0.03, s.pz, true)) continue; // need headroom to rise
    s.mantleT = 0;
    s.mantleDur = (0.3 + 0.24 * (h / MOVE.mantleMax)) * ctx.lo.perks.mantleMul;
    s.mfx = s.px; s.mfy = s.py; s.mfz = s.pz;
    s.mtx = tx; s.mty = topY + 0.025; s.mtz = tz;
    if (crouch) s.crouch = 1;
    s.vx = 0; s.vy = 0; s.vz = 0;
    s.grounded = 0; s.sprint = 0;
    ctx.ev?.push({ t: 'mantle', dur: s.mantleDur });
    return true;
  }
  return false;
}

function stepWeapon(s: PlayerState, cmd: InputCmd, pressed: number, ctx: StepCtx): void {
  const lo = ctx.lo, perks = lo.perks, ev = ctx.ev;
  const mantling = s.mantleT >= 0;
  if (s.actT > 0) s.actT = Math.max(0, s.actT - DT);
  s.sinceShot += DT;

  // weapon swap
  const want = cmd.slot ? 1 : 0;
  if (want !== s.pendingSlot && s.cookT < 0 && s.actT <= 0) {
    s.pendingSlot = want;
    s.swapT = (0.16 + lo.weapons[want].swapTime) * perks.swapMul;
    if (s.reloadT >= 0) { s.reloadT = -1; ev?.push({ t: 'reloadEnd', done: false }); }
    ev?.push({ t: 'swapStart', to: want });
  }
  if (s.swapT > 0) {
    s.swapT = Math.max(0, s.swapT - DT);
    const raise = lo.weapons[s.pendingSlot].swapTime * perks.swapMul;
    if (s.slot !== s.pendingSlot && s.swapT <= raise) {
      s.slot = s.pendingSlot;
      s.burst = 0; s.bloom = 0; s.fireCd = 0; s.fireBuf = 0; s.adsT = 0;
      ev?.push({ t: 'swap', slot: s.slot });
    }
  }
  const w = lo.weapons[s.slot], d = w.def;
  let mag = s.slot ? s.mag1 : s.mag0;
  let res = s.slot ? s.res1 : s.res0;
  const busy = s.swapT > 0 || mantling || s.actT > 0 || s.cookT >= 0;

  if (s.sprint) s.sprintOut = w.sprintOut * perks.sprintOutMul;
  else if (s.sprintOut > 0) s.sprintOut = Math.max(0, s.sprintOut - DT);

  // ADS blend
  const wantAds = (cmd.buttons & BTN.ADS) !== 0 && !s.sprint && !busy && s.reloadT < 0;
  const adsStep = DT / w.adsTime;
  s.adsT = wantAds ? Math.min(1, s.adsT + adsStep) : Math.max(0, s.adsT - adsStep * 1.3);

  // spread recovery / recoil pattern reset
  if (s.sinceShot > Math.max(0.11, w.interval * 1.25)) s.bloom = Math.max(0, s.bloom - d.hip.recover * (s.crouch ? 1.35 : 1) * DT);
  if (s.sinceShot > 0.3 + w.interval) s.burst = 0;

  // reload progress
  if (s.reloadT >= 0) {
    if (busy) {
      s.reloadT = -1;
      ev?.push({ t: 'reloadEnd', done: false });
    } else if (d.shell) {
      s.reloadT += DT;
      if (s.reloadIn === 0) {
        if (s.reloadT >= d.shell.start) { s.reloadIn = 1; s.reloadT = 0; }
      } else if (s.reloadIn === 1) {
        if (s.reloadT >= d.shell.per) {
          mag++; res--; s.reloadT = 0;
          ev?.push({ t: 'shell' });
          if (mag >= w.mag || res <= 0) s.reloadIn = 2;
        }
        if ((cmd.buttons & BTN.FIRE) && mag > 0) s.reloadIn = 2; // fire interrupts the shell loop
      } else if (s.reloadT >= d.shell.end) {
        s.reloadT = -1;
        ev?.push({ t: 'reloadEnd', done: true });
      }
    } else {
      const prev = s.reloadT;
      s.reloadT += DT;
      const tOut = s.reloadDur * d.reload.outAt, tIn = s.reloadDur * d.reload.inAt;
      if (prev < tOut && s.reloadT >= tOut) ev?.push({ t: 'reloadStage', stage: 1 });
      if (prev < tIn && s.reloadT >= tIn) {
        const take = Math.min(w.mag - mag, res);
        mag += take; res -= take;
        s.reloadIn = 1;
        ev?.push({ t: 'reloadStage', stage: 2 });
      }
      if (s.reloadEmpty && prev < s.reloadDur * 0.88 && s.reloadT >= s.reloadDur * 0.88) ev?.push({ t: 'reloadStage', stage: 3 });
      if (s.reloadT >= s.reloadDur) {
        s.reloadT = -1;
        ev?.push({ t: 'reloadEnd', done: true });
      }
    }
  }
  // start a reload (manual, or automatic shortly after running dry)
  if (s.reloadT < 0 && !busy && mag < w.mag && res > 0 && ((pressed & BTN.RELOAD) !== 0 || (mag === 0 && s.sinceShot > 0.22))) {
    s.reloadT = 0;
    s.reloadIn = 0;
    s.reloadEmpty = mag === 0 ? 1 : 0;
    s.reloadDur = d.shell ? 0 : (mag === 0 ? d.reload.empty : d.reload.tactical) * w.reloadMul;
    ev?.push({ t: 'reload', empty: mag === 0, dur: d.shell ? d.shell.start + d.shell.per * Math.min(w.mag - mag, res) + d.shell.end : s.reloadDur });
  }

  // trigger
  if (s.fireCd > -DT) s.fireCd -= DT;
  if (pressed & BTN.FIRE) s.fireBuf = 0.13;
  else if (s.fireBuf > 0) s.fireBuf -= DT;
  const trigger = d.fire === 'auto' ? (cmd.buttons & BTN.FIRE) !== 0 : s.fireBuf > 0;
  const canFire = !busy && s.reloadT < 0 && s.sprintOut <= 0;
  if (trigger && canFire && s.fireCd <= 0) {
    if (mag <= 0) {
      if (pressed & BTN.FIRE) ev?.push({ t: 'dry' });
      s.fireBuf = 0;
    } else {
      mag--;
      s.fireBuf = 0;
      s.fireCd = (s.sinceShot > w.interval * 1.5 ? 0 : s.fireCd) + w.interval;
      const spread = currentSpread(s, w);
      s.shotSeq += 1;
      if (ev) {
        const eye = eyeHeight(s.crouchT);
        const cp = Math.cos(s.pitch), sp = Math.sin(s.pitch), sy = Math.sin(s.yaw), cy = Math.cos(s.yaw);
        fwd.x = sy * cp; fwd.y = sp; fwd.z = cy * cp;
        const rx = cy, rz = -sy; // right
        const ux = -sp * sy, uy = cp, uz = -sp * cy; // up
        const dirs: number[] = [];
        for (let p = 0; p < d.pellets; p++) {
          const u1 = hash3(ctx.id * 7919 + 13, s.shotSeq, p * 2 + 1), u2 = hash3(ctx.id * 7919 + 13, s.shotSeq, p * 2 + 2);
          const ang = Math.tan(((spread * Math.PI) / 180) * Math.sqrt(u1));
          const phi = u2 * TAU;
          const a = Math.cos(phi) * ang, b = Math.sin(phi) * ang;
          let dx = fwd.x + rx * a + ux * b, dy = fwd.y + uy * b, dz = fwd.z + rz * a + uz * b;
          const l = Math.hypot(dx, dy, dz);
          dx /= l; dy /= l; dz /= l;
          dirs.push(dx, dy, dz);
        }
        ev.push({ t: 'shot', slot: s.slot, seq: s.shotSeq, ox: s.px, oy: s.py + eye, oz: s.pz, dirs, burst: s.burst, ads: s.adsT });
      }
      s.bloom = Math.min(d.hip.max, s.bloom + d.hip.perShot * w.bloomMul);
      s.burst += 1;
      s.sinceShot = 0;
      s.fired = 1;
    }
  }

  // melee
  if ((pressed & BTN.MELEE) && !busy) {
    s.actT = COMBAT.meleeTime;
    s.fired = 1;
    if (s.reloadT >= 0) { s.reloadT = -1; ev?.push({ t: 'reloadEnd', done: false }); }
    ev?.push({ t: 'melee' });
  }

  // equipment recharge + use
  if (s.lethal < 1) {
    s.lethalRe += DT * ctx.equipMult;
    if (s.lethalRe >= lo.lethal.recharge) { s.lethal = 1; s.lethalRe = 0; }
  }
  if (s.tactical < 1) {
    s.tacticalRe += DT * ctx.equipMult;
    if (s.tacticalRe >= lo.tactical.recharge) { s.tactical = 1; s.tacticalRe = 0; }
  }
  const idle = s.swapT <= 0 && !mantling && s.actT <= 0;
  if (s.cookT >= 0) {
    s.cookT += DT;
    if ((cmd.buttons & BTN.LETHAL) === 0 || s.cookT >= lo.lethal.fuse - 0.04) {
      emitThrow(s, ctx, 'lethal', Math.max(0.02, lo.lethal.fuse - s.cookT));
      s.cookT = -1;
      s.lethal = 0; s.lethalRe = 0;
      s.actT = COMBAT.throwTime;
    }
  } else if ((pressed & BTN.LETHAL) && s.lethal >= 1 && idle) {
    if (s.reloadT >= 0) { s.reloadT = -1; ev?.push({ t: 'reloadEnd', done: false }); }
    if (lo.lethal.cook) {
      s.cookT = 0;
      ev?.push({ t: 'cook' });
    } else {
      emitThrow(s, ctx, 'lethal', lo.lethal.fuse);
      s.lethal = 0; s.lethalRe = 0;
      s.actT = COMBAT.throwTime;
    }
    s.fired = 1;
  } else if ((pressed & BTN.TACTICAL) && s.tactical >= 1 && idle) {
    if (s.reloadT >= 0) { s.reloadT = -1; ev?.push({ t: 'reloadEnd', done: false }); }
    emitThrow(s, ctx, 'tactical', lo.tactical.fuse);
    s.tactical = 0; s.tacticalRe = 0;
    s.actT = COMBAT.throwTime;
    s.fired = 1;
  }

  if (s.slot) { s.mag1 = mag; s.res1 = res; } else { s.mag0 = mag; s.res0 = res; }
}

function emitThrow(s: PlayerState, ctx: StepCtx, kind: 'lethal' | 'tactical', fuse: number): void {
  if (!ctx.ev) return;
  const def = kind === 'lethal' ? ctx.lo.lethal : ctx.lo.tactical;
  const pitch = Math.min(1.4, s.pitch + (def.id === 'dart' ? 0.01 : 0.11));
  const cp = Math.cos(pitch), sp = Math.sin(pitch), sy = Math.sin(s.yaw), cy = Math.cos(s.yaw);
  const dx = sy * cp, dy = sp, dz = cy * cp;
  const eye = eyeHeight(s.crouchT);
  ctx.ev.push({
    t: 'throw', kind,
    ox: s.px + dx * 0.35 + cy * 0.18, oy: s.py + eye - 0.12 + dy * 0.35, oz: s.pz + dz * 0.35 - sy * 0.18,
    vx: dx * def.speed + s.vx * 0.5, vy: dy * def.speed + Math.max(0, s.vy * 0.3), vz: dz * def.speed + s.vz * 0.5,
    fuse,
  });
}

/** Recoil for shot number `burst` of a spray: [yawDeg, pitchDeg]. Deterministic pattern plus small seeded variance. */
export function recoilKick(w: WeaponStats, burst: number, adsT: number, crouch: boolean, id: number, seq: number, out: { yaw: number; pitch: number }): void {
  const r = w.def.recoil;
  const side = r.side[burst % r.side.length] * w.recoilSideMul * (1 + Math.min(burst, 12) * 0.03);
  let up = w.recoilUp * (burst === 0 ? 1.25 : burst < 4 ? 1.1 : 0.82);
  const v = w.variance;
  let yaw = side + (hash3(id * 31 + 7, seq, 91) - 0.5) * 2 * v;
  up += (hash3(id * 31 + 7, seq, 17) - 0.5) * v;
  const m = lerp(1, r.adsMult, adsT) * (crouch ? r.crouchMult : 1);
  yaw *= m; up *= m;
  out.yaw = yaw;
  out.pitch = up;
}
