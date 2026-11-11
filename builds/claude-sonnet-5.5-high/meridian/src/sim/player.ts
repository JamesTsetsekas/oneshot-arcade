import { approach, clamp, damp, dampAngle, fwd, rgt } from '../core/math';
import type { Game } from './game';
import type { InputFrame } from './types';
import { resolveHuman } from './collision';
import { equipped, playerFire, playerMelee, traceShot } from './combat';
import { WEAPONS } from './weapons';
import { stepVehicle } from './vehicle';
import type { Vehicle } from './vehicle';

export const WALK = 2.1;
export const JOG = 4.4;
export const SPRINT = 6.2;
export const CROUCH = 1.8;
export const STAMINA_MAX = 8;
const GRAV = 19.6;
const JUMP_V = Math.sqrt(2 * GRAV * 0.85); // apex 0.85 m

export function updatePlayer(g: Game, inp: InputFrame, dt: number): void {
  const P = g.player;
  const h = P.human;
  // camera look ----------------------------------------------------------------
  P.camYaw += inp.lookDX;
  P.camPitch = clamp(P.camPitch + inp.lookDY, -0.85, 1.05);
  if (inp.swap) P.shoulder = (P.shoulder * -1) as 1 | -1;
  P.spread = Math.max(0, P.spread - dt * 1.6);
  P.fireCd = Math.max(0, P.fireCd - dt);
  g.meleeSwingT = Math.max(0, g.meleeSwingT - dt);
  g.damageFlash = Math.max(0, g.damageFlash - dt * 1.4);
  P.exitCool = Math.max(0, P.exitCool - dt);
  g.sprintingNow = false;

  if (!h.alive) return;
  regen(g, dt);
  if (inp.heal) useMedkit(g);

  const veh = g.playerVehicle();
  if (P.enterT > 0) {
    P.enterT -= dt;
    const target = P.enterTarget !== null ? g.vehicleById(P.enterTarget) : null;
    if (target) {
      h.x += (target.x - h.x) * Math.min(1, dt * 9);
      h.z += (target.z - h.z) * Math.min(1, dt * 9);
    }
    if (P.enterT <= 0 && target) seat(g, target);
    return;
  }
  if (veh) {
    drivePlayer(g, inp, dt, veh);
    return;
  }
  walkPlayer(g, inp, dt);
}

function regen(g: Game, dt: number): void {
  const P = g.player;
  const h = P.human;
  if (g.t - P.lastDamageT > 8 && h.hp < 30) h.hp = Math.min(30, h.hp + dt * 4);
}

export function useMedkit(g: Game): void {
  const P = g.player;
  if (P.inv.medkits <= 0) { g.toast('No medical kits', 'warn'); return; }
  if (P.human.hp >= 100) { g.toast('Health already full', 'info'); return; }
  P.inv.medkits--;
  P.human.hp = Math.min(100, P.human.hp + 60);
  g.emit({ type: 'sfx', name: 'heal' });
  g.toast('Medical kit used', 'good');
}

function walkPlayer(g: Game, inp: InputFrame, dt: number): void {
  const P = g.player;
  const h = P.human;
  const world = g.world;
  const surface = world.surfaceAt(h.x, h.z);
  const swimming = surface === 'water';
  if (swimming && !h.swimming) g.emit({ type: 'sfx', name: 'splash', x: h.x, z: h.z });
  h.swimming = swimming;
  // vault in progress ---------------------------------------------------------
  if (P.vaultT > 0 && P.vaultFrom && P.vaultTo) {
    P.vaultT -= dt;
    const total = P.vaultY > 1.05 ? 0.8 : 0.55;
    const k = clamp(1 - P.vaultT / total, 0, 1);
    h.x = P.vaultFrom.x + (P.vaultTo.x - P.vaultFrom.x) * k;
    h.z = P.vaultFrom.z + (P.vaultTo.z - P.vaultFrom.z) * k;
    h.y = Math.sin(k * Math.PI) * (P.vaultY + 0.25);
    h.anim += dt * 6;
    h.vx = h.vz = 0;
    if (P.vaultT <= 0) { h.y = 0; P.vaultFrom = null; P.vaultTo = null; }
    P.aimPoint = computeAim(g);
    return;
  }
  P.aiming = inp.aim && !P.holstered && !h.swimming;
  const sprintWanted = inp.sprint && inp.moveY > 0.1 && !P.aiming && !h.crouch && !h.swimming;
  h.crouch = inp.crouch && !h.swimming;
  // stamina
  let sprinting = false;
  if (sprintWanted && P.stamina > 0.2) { sprinting = true; P.stamina = Math.max(0, P.stamina - dt); }
  else P.stamina = Math.min(STAMINA_MAX, P.stamina + dt * (Math.hypot(inp.moveX, inp.moveY) < 0.1 ? 2.2 : 0.9));
  g.sprintingNow = sprinting;
  // desired velocity
  const cf = { x: Math.sin(P.camYaw), z: Math.cos(P.camYaw) };
  const cr = { x: Math.cos(P.camYaw), z: -Math.sin(P.camYaw) };
  let wx = cf.x * inp.moveY + cr.x * inp.moveX;
  let wz = cf.z * inp.moveY + cr.z * inp.moveX;
  const wl = Math.hypot(wx, wz);
  if (wl > 1) { wx /= wl; wz /= wl; }
  let speed = JOG;
  if (h.crouch) speed = CROUCH;
  else if (sprinting) speed = SPRINT;
  else if (P.aiming) speed = WALK;
  if (h.swimming) speed = 2.3;
  if (surface === 'shallow') speed *= 0.8;
  const tvx = wx * speed;
  const tvz = wz * speed;
  const acc = (h.swimming ? 8 : 28) * dt;
  h.vx = approach(h.vx, tvx, acc);
  h.vz = approach(h.vz, tvz, acc);
  // jump / vault
  const grounded = h.y <= 0.001;
  if (inp.jump && grounded && !h.swimming) {
    if (!tryVault(g, wx, wz)) { h.vy = JUMP_V; g.emit({ type: 'sfx', name: 'step', x: h.x, z: h.z }); }
  }
  h.vy -= GRAV * dt;
  h.y = Math.max(0, h.y + h.vy * dt);
  if (h.y === 0) h.vy = 0;
  const px = h.x;
  const pz = h.z;
  const nx = h.x + h.vx * dt;
  const nz = h.z + h.vz * dt;
  const pos = { x: nx, z: nz };
  resolveHuman(world, pos, 0.35, h.y, h.swimming);
  // keep inside the world
  pos.x = clamp(pos.x, -296, 296);
  pos.z = clamp(pos.z, -332, 296);
  h.x = pos.x;
  h.z = pos.z;
  if (Math.hypot(pos.x - nx, pos.z - nz) > 1e-4) { h.vx *= 0.5; h.vz *= 0.5; }
  const moved = Math.hypot(h.x - px, h.z - pz);
  P.stats.distance += moved;
  h.speed = moved / Math.max(dt, 1e-5);
  h.anim += moved * 1.9;
  // heading
  if (P.aiming || (inp.fire && !P.holstered && P.slot !== 0) || g.t - g.lastShotT < 0.6) h.heading = dampAngle(h.heading, P.camYaw, 16, dt);
  else if (wl > 0.1) h.heading = dampAngle(h.heading, Math.atan2(wx, wz), 12, dt);
  if (h.swimming) {
    P.swimT += dt;
    if (P.swimT > 22 || h.z < -318) { g.toast('Hauled out of the harbor', 'warn'); respawnAtQuay(g); }
  } else P.swimT = 0;

  // aim ray + weapons ------------------------------------------------------------
  P.aimPoint = computeAim(g);
  handleWeapons(g, inp, dt);
}

function respawnAtQuay(g: Game): void {
  const h = g.player.human;
  h.x = clamp(h.x, -200, 200);
  h.z = -250;
  h.vx = h.vz = 0;
  g.player.swimT = 0;
  h.swimming = false;
}

/** Try a contextual vault (0.5-1.0 m) or mantle (1.0-1.6 m) over a thin obstacle straight ahead. */
function tryVault(g: Game, wx: number, wz: number): boolean {
  const h = g.player.human;
  const P = g.player;
  const dir = Math.hypot(wx, wz) > 0.1 ? { x: wx / Math.hypot(wx, wz), z: wz / Math.hypot(wx, wz) } : fwd(h.heading);
  const hit = g.world.raycast(h.x, h.z, dir.x, dir.z, 1.3, 0.5, 0, 0.5);
  if (!hit) return false;
  const c = hit.c;
  if (c.h < 0.5 || c.h > 1.6) return false;
  if (c.tag === 'building' || c.tag === 'pole' || c.tag === 'plant') return false;
  // find landing point beyond the obstacle (probe up to 3.2 m)
  for (let d = hit.t + 0.7; d <= hit.t + 3.2; d += 0.35) {
    const lx = h.x + dir.x * d;
    const lz = h.z + dir.z * d;
    const probe = { x: lx, z: lz };
    resolveHuman(g.world, probe, 0.35, 0.01);
    if (Math.hypot(probe.x - lx, probe.z - lz) < 0.02 && g.world.surfaceAt(lx, lz) !== 'shallow' || (c.tag === 'rail' && lz < -272)) {
      // free spot found
      P.vaultFrom = { x: h.x, z: h.z };
      P.vaultTo = { x: lx, z: lz };
      P.vaultY = c.h;
      P.vaultT = c.h > 1.05 ? 0.8 : 0.55;
      g.emit({ type: 'sfx', name: 'step', x: h.x, z: h.z });
      return true;
    }
  }
  return false;
}

export function computeAim(g: Game): { x: number; y: number; z: number; hitKind: string } {
  const P = g.player;
  const c = g.cam.pose;
  const d = g.cam.dir();
  const hit = traceShot(g, c.x, c.y, c.z, d.x, d.y, d.z, 160, P.human);
  // ignore hits closer than camera-to-player (camera clipped by a wall behind us)
  const hp = P.human;
  const toPlayer = Math.hypot(c.x - hp.x, c.z - hp.z);
  if (hit.t < toPlayer + 0.5 && hit.kind !== 'none') {
    const far = traceShot(g, hp.x, 1.4 + hp.y, hp.z, d.x, d.y, d.z, 160, P.human);
    return { x: far.x, y: far.y, z: far.z, hitKind: far.kind };
  }
  return { x: hit.x, y: hit.y, z: hit.z, hitKind: hit.kind };
}

function handleWeapons(g: Game, inp: InputFrame, dt: number): void {
  const P = g.player;
  const h = P.human;
  // slot selection
  if (inp.select >= 0 && inp.select <= 2) selectSlot(g, inp.select);
  if (inp.select === 3 || inp.select === 4) { g.gadgetIdx = inp.select - 3; g.toast(WEAPONS[P.inv.gadgets[g.gadgetIdx] ?? 'smoke']?.name ?? 'Gadget', 'info'); }
  if (inp.cycle !== 0) {
    const order = [0, 1, ...(P.inv.longGun ? [2] : [])];
    const i = order.indexOf(P.slot);
    selectSlot(g, order[(i + (inp.cycle > 0 ? 1 : order.length - 1)) % order.length]);
  }
  if (inp.holster) { P.holstered = !P.holstered; g.emit({ type: 'sfx', name: 'click' }); }
  if (inp.aim && P.holstered) P.holstered = false;
  const w = equipped(g);
  // throw gadget
  if (inp.throwItem) throwGadget(g);
  // melee (F)
  if (inp.exit && P.fireCd <= 0) { playerMelee(g); return; }
  if (!w) return;
  if (w.slot === 'melee') {
    if (inp.firePressed && P.fireCd <= 0) playerMelee(g);
    return;
  }
  // reload
  if (P.reloadT > 0) {
    P.reloadT -= dt;
    if (P.reloadT <= 0) finishReload(g, w.id);
    return;
  }
  const mag = P.inv.mags[w.id] ?? 0;
  if (inp.reload && mag < w.mag && P.inv.ammo[w.ammo] > 0) { startReload(g, w.id); return; }
  const want = w.auto ? inp.fire : inp.firePressed;
  if (want && P.fireCd <= 0) {
    if (mag <= 0) {
      if (P.inv.ammo[w.ammo] > 0) startReload(g, w.id);
      else { P.fireCd = 0.3; g.emit({ type: 'sfx', name: 'click' }); g.toast('Out of ammo', 'warn'); }
      return;
    }
    // keep drawn weapon aimed with the camera
    h.heading = P.camYaw;
    playerFire(g, w);
    g.lastShotT = g.t;
    P.camPitch = clamp(P.camPitch - g.playerRecoil * 0.6, -0.85, 1.05);
  }
  // weapon display crime (aimed gun in front of witnesses)
  if (P.aiming && w.lethal) g.police.weaponDisplay(h.x, h.z);
}

export function selectSlot(g: Game, slot: number): void {
  const P = g.player;
  if (slot === 2 && !P.inv.longGun) return;
  P.slot = slot;
  P.holstered = false;
  P.reloadT = 0;
  g.emit({ type: 'sfx', name: 'click' });
}

function startReload(g: Game, id: string): void {
  const w = WEAPONS[id];
  g.player.reloadT = w.reload;
  g.emit({ type: 'sfx', name: 'reload' });
}

function finishReload(g: Game, id: string): void {
  const P = g.player;
  const w = WEAPONS[id];
  const need = w.mag - (P.inv.mags[id] ?? 0);
  const take = Math.min(need, P.inv.ammo[w.ammo] ?? 0);
  P.inv.mags[id] = (P.inv.mags[id] ?? 0) + take;
  P.inv.ammo[w.ammo] -= take;
}

function throwGadget(g: Game): void {
  const P = g.player;
  const id = P.inv.gadgets[g.gadgetIdx] ?? P.inv.gadgets[0];
  if (!id) return;
  if ((P.inv.gadgetCount[id] ?? 0) <= 0) { g.toast('Out of ' + WEAPONS[id].name, 'warn'); return; }
  P.inv.gadgetCount[id]--;
  const h = P.human;
  const ap = P.aimPoint;
  let dx = ap.x - h.x;
  let dz = ap.z - h.z;
  const d = Math.hypot(dx, dz) || 1;
  const reach = Math.min(d, WEAPONS[id].range);
  dx = (dx / d) * reach;
  dz = (dz / d) * reach;
  const tx = h.x + dx;
  const tz = h.z + dz;
  // stop short of walls
  const hit = g.world.raycast(h.x, h.z, dx / reach, dz / reach, reach, 1.5, 0, 1);
  const t = hit ? Math.max(0.5, hit.t - 0.4) : reach;
  const gx = h.x + (dx / reach) * t;
  const gz = h.z + (dz / reach) * t;
  void tx; void tz;
  if (id === 'smoke') g.deploySmoke(gx, gz);
  else g.deployChirper(gx, gz);
  g.emit({ type: 'sfx', name: 'click' });
}

// ------------------------------------------------------------------------ vehicles
export function drivePlayer(g: Game, inp: InputFrame, dt: number, v: Vehicle): void {
  const P = g.player;
  const h = P.human;
  h.x = v.x;
  h.z = v.z;
  h.vx = v.vx;
  h.vz = v.vz;
  h.speed = Math.hypot(v.vx, v.vz);
  h.heading = v.heading;
  P.stats.distance += Math.hypot(v.vx, v.vz) * dt;
  // keyboard smoothing
  const speed = Math.abs(v.speed);
  const tgtSteer = inp.steer;
  const rate = Math.abs(tgtSteer) > Math.abs(P.steerIn) || Math.sign(tgtSteer) !== Math.sign(P.steerIn) ? 5.5 : 8.5;
  P.steerIn = approach(P.steerIn, tgtSteer, rate * dt * (1 - clamp(speed / 60, 0, 0.4)));
  const tgtThr = inp.throttle;
  P.throttleIn = approach(P.throttleIn, tgtThr, 7 * dt);
  const assists = g.settings.driveAssist;
  if (!v.engineOn) v.engineOn = true;
  stepVehicle(v, { throttle: P.throttleIn, steer: P.steerIn * (assists ? 1 : 1), handbrake: inp.handbrake }, dt, g.world.surfaceAt(v.x, v.z));
  // mild stability assist: damp excess yaw when not using the handbrake
  if (assists && !inp.handbrake && speed > 8) v.yawRate *= 1 - 0.8 * dt * clamp((speed - 8) / 30, 0, 1);
  if (inp.horn) { v.horn = 0.3; g.emit({ type: 'horn', id: v.id }); }
  v.lights = g.hour < 6.5 || g.hour > 18.5;
  if (inp.exit && P.exitCool <= 0) exitVehicle(g, v);
  if (v.health <= 0 && !g.vehicleDisabledToasted.has(v.id)) { g.vehicleDisabledToasted.add(v.id); g.toast('Vehicle disabled - get out or repair it', 'warn'); }
}

export function seat(g: Game, v: Vehicle): void {
  const P = g.player;
  const h = P.human;
  h.vehicleId = v.id;
  v.driverId = 0;
  v.engineOn = true;
  if (v.owner !== 'police' && v.owner !== 'mission' && v.owner !== 'rival') v.owner = 'player';
  P.steerIn = 0;
  P.throttleIn = 0;
  P.camYaw = v.heading;
  P.holstered = true;
  g.emit({ type: 'sfx', name: 'door', x: v.x, z: v.z });
  g.onPlayerEnteredVehicle(v);
}

export function exitVehicle(g: Game, v: Vehicle, force = false): boolean {
  const P = g.player;
  const h = P.human;
  if (!force && Math.abs(v.speed) > 9) { g.toast('Too fast to get out', 'warn'); P.exitCool = 0.6; return false; }
  const r = rgt(v.heading);
  const f = fwd(v.heading);
  const side = v.def.width / 2 + 0.9;
  const candidates = [
    { x: v.x - r.x * side, z: v.z - r.z * side },
    { x: v.x + r.x * side, z: v.z + r.z * side },
    { x: v.x - f.x * (v.def.length / 2 + 1), z: v.z - f.z * (v.def.length / 2 + 1) },
    { x: v.x + f.x * (v.def.length / 2 + 1), z: v.z + f.z * (v.def.length / 2 + 1) },
  ];
  let spot = candidates[0];
  for (const c of candidates) {
    const p = { x: c.x, z: c.z };
    resolveHuman(g.world, p, 0.4, 0);
    if (Math.hypot(p.x - c.x, p.z - c.z) < 0.05 && g.world.surfaceAt(c.x, c.z) !== 'water') { spot = c; break; }
  }
  h.x = spot.x;
  h.z = spot.z;
  h.y = 0;
  h.vx = v.vx * 0.5;
  h.vz = v.vz * 0.5;
  h.vehicleId = null;
  v.driverId = null;
  v.engineOn = false;
  v.lights = false;
  P.exitCool = 0.5;
  P.camYaw = v.heading + Math.PI * (v.speed < 0 ? 1 : 0);
  g.emit({ type: 'sfx', name: 'door', x: v.x, z: v.z });
  g.onPlayerExitedVehicle(v);
  return true;
}

void damp;
