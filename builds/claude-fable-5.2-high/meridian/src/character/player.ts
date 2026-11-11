// Rowan Vey: on-foot movement, stamina, weapons, gadgets, interaction and vehicle enter/exit.
// Reads an abstract PlayerInput so the same code runs in the browser and in headless tests.
import type { Sim } from '../game-session/sim';
import { CharBody, HumanView, Look } from './character';
import { Vehicle } from '../vehicles/vehicle';
import { Inventory, defaultInventory, WEAPONS, WeaponSpec, WeaponSlot, BATON, resolveShot, LIMITS } from './weapons';
import { RayHit, DT } from '../physics/physics';
import { clamp, clamp01, v3, angleDiff, approach } from '../core/math';
import { terrainH } from '../world/district';

export interface PlayerInput {
  moveX: number; moveZ: number; camYaw: number; camPitch: number; camX: number; camY: number; camZ: number;
  sprint: boolean; crouch: boolean; jump: boolean; interact: boolean; interactHeld: boolean; enterExit: boolean;
  fire: boolean; firePressed: boolean; aim: boolean; reload: boolean; melee: boolean; gadget: boolean; gadgetCycle: boolean;
  medkit: boolean; horn: boolean; handbrake: boolean; slot: number; holster: boolean; resetHeld: boolean;
}
export const emptyInput = (): PlayerInput => ({
  moveX: 0, moveZ: 0, camYaw: 0, camPitch: 0, camX: 0, camY: 2, camZ: 0, sprint: false, crouch: false, jump: false,
  interact: false, interactHeld: false, enterExit: false, fire: false, firePressed: false, aim: false, reload: false,
  melee: false, gadget: false, gadgetCycle: false, medkit: false, horn: false, handbrake: false, slot: -1, holster: false, resetHeld: false,
});
export interface Interactable {
  id: string; x: number; z: number; r: number; hold?: number;
  label: () => string | null; use: () => void; vehicleOk?: boolean;
  /** Mission interactions outrank shops and other ambient prompts that share a spot. */
  priority?: number;
}
export const OUTFITS: { name: string; top: number; bottom: number; price: number }[] = [
  { name: 'Kestrel courier jacket', top: 0xf2b134, bottom: 0x2f3a4a, price: 0 },
  { name: 'Harbor grey windbreaker', top: 0x8a9aa3, bottom: 0x3a3f46, price: 120 },
  { name: 'Tide Market stripe', top: 0x1f7a8c, bottom: 0xe8e2d0, price: 160 },
  { name: 'Foundry rust overshirt', top: 0xb5644a, bottom: 0x2c3036, price: 160 },
  { name: 'Lantern night bomber', top: 0x2b2f4a, bottom: 0x1c1f24, price: 220 },
];
const _hit: RayHit = { dist: 0, nx: 0, ny: 0, nz: 0, body: null };
const _p = v3();
type SlotName = 'none' | WeaponSlot;

export class Player {
  body: CharBody;
  vehicle: Vehicle | null = null;
  mode: 'foot' | 'entering' | 'vehicle' = 'foot';
  health = 100; stamina = 1; staminaDelay = 0; downed = false; downTime = 0;
  inv: Inventory = defaultInventory();
  slot: SlotName = 'none'; lastSlot: SlotName = 'sidearm';
  gadget: 'chirper' | 'smoke' = 'chirper';
  cooldown = 0; reloadT = 0; meleeT = 0; healT = 0; aiming = false; firedAt = -99;
  outfit = 0; stunned = 0; lastDamage = -99; recoil = 0;
  prompt: { text: string; progress: number } | null = null;
  private holdT = 0; private holdId = ''; private scanT = 0;
  private target: Interactable | null = null; private targetVeh: Vehicle | null = null;
  private enterVeh: Vehicle | null = null; private enterT = 0;
  ownedVehicle: Vehicle | null = null;
  weaponShownT = 0;
  crouchToggle = false; private crouchWas = false;
  stats = { shotsFired: 0, civiliansHurt: 0, crashes: 0, distance: 0 };
  constructor(public sim: Sim, x: number, z: number, yaw: number) {
    this.body = new CharBody(sim.phys, x, terrainH(x, z), z, yaw);
  }
  get look(): Look { const o = OUTFITS[this.outfit]; return { skin: 0xc68d6a, top: o.top, bottom: o.bottom, hair: 0x3a2a22, hat: this.vehicle?.isMoto ? 3 : 0, pack: 1, scale: 1 }; }
  get x() { return this.vehicle ? this.vehicle.x : this.body.x; }
  get y() { return this.vehicle ? this.vehicle.y : this.body.y; }
  get z() { return this.vehicle ? this.vehicle.z : this.body.z; }
  get speed() { return this.vehicle ? this.vehicle.speedAbs : this.body.speed2d; }
  get armed() { return this.slot !== 'none' && !this.vehicle; }
  get lethalArmed() { return this.armed && this.slot !== 'stun'; }
  weapon(): WeaponSpec | null {
    if (this.slot === 'sidearm' && this.inv.sidearm) return WEAPONS[this.inv.sidearm];
    if (this.slot === 'long' && this.inv.long) return WEAPONS[this.inv.long];
    if (this.slot === 'stun' && this.inv.stun) return WEAPONS.halcyon;
    return null;
  }
  selectSlot(s: SlotName) {
    if (s === 'sidearm' && !this.inv.sidearm) return;
    if (s === 'long' && !this.inv.long) return;
    if (s === 'stun' && !this.inv.stun) return;
    if (s !== this.slot) { this.slot = s; this.reloadT = 0; this.cooldown = 0.25; if (s !== 'none') { this.lastSlot = s; this.sim.bus.emit('sfx', { name: 'draw' }); } }
  }
  view(): HumanView {
    const b = this.body, v = this.vehicle;
    if (v) {
      return { x: v.x, y: v.y, z: v.z, yaw: v.yaw, phase: 0, gait: 0, pose: v.isMoto ? 'ride' : 'hidden', look: this.look, armed: 0, lean: v.lean };
    }
    const w = this.weapon();
    const pose = this.downed || b.state === 'down' ? 'down' : b.state === 'swim' ? 'swim' : b.state === 'mantle' ? 'mantle'
      : (this.aiming || this.sim.time - this.firedAt < 0.5) && w ? 'aim' : b.crouch ? 'crouch' : 'stand';
    return { x: b.x, y: b.y, z: b.z, yaw: b.yaw, phase: b.phase, gait: b.gait, pose, look: this.look, armed: !w ? (this.meleeT > 0 ? 3 : 0) : w.slot === 'long' ? 2 : 1, lean: 0 };
  }

  takeDamage(amount: number, cause: string, stun = false) {
    if (this.downed || this.sim.godMode) return;
    if (stun) { this.stunned = 2.2; this.sim.bus.emit('sfx', { name: 'stun' }); this.sim.bus.emit('shake', { amount: 0.5 }); return; }
    if (amount <= 0) return;
    let dmg = amount * this.sim.damageScale;
    if (this.inv.armor > 0) { const ab = Math.min(this.inv.armor, dmg * 0.7); this.inv.armor -= ab; dmg -= ab; }
    this.health -= dmg; this.lastDamage = this.sim.time;
    this.sim.bus.emit('shake', { amount: clamp(dmg / 25, 0.2, 1) });
    this.sim.bus.emit('sfx', { name: 'hurt' });
    if (this.health <= 0) {
      this.health = 0; this.downed = true; this.downTime = 0;
      if (this.vehicle) this.exitVehicle(true);
      this.body.knockDown(9999);
      this.sim.bus.emit('playerDown', { cause });
    }
  }
  heal(n: number) { this.health = Math.min(100, this.health + n); }
  /** Put the player back on their feet somewhere safe (respawn / arrest / checkpoint). */
  respawn(x: number, z: number, yaw: number, health = 100) {
    if (this.vehicle) this.exitVehicle(true);
    this.downed = false; this.health = health; this.stunned = 0; this.stamina = 1;
    this.body.state = 'normal'; this.body.setEnabled(true);
    this.body.teleport(x, this.sim.phys.groundBelow(x, 30, z), z, yaw);
    this.mode = 'foot'; this.enterVeh = null; this.reloadT = 0;
  }

  enterVehicle(v: Vehicle, instant = false) {
    if (this.downed) return;
    if (instant) { this.attach(v); return; }
    this.mode = 'entering'; this.enterVeh = v; this.enterT = 0;
  }
  private attach(v: Vehicle) {
    const sim = this.sim;
    const occupied = v.driver !== 'none';
    if (occupied) sim.traffic.ejectDriver(v, true);
    if (!v.owned && !v.stolen) { v.stolen = true; sim.police.crime(occupied || v.spec.cls === 'police' ? 'vehicleTheft' : 'vehicleTheftParked', v.x, v.z, { vehicle: v }); }
    this.vehicle = v; v.driver = 'player'; v.everDriven = true; v.wake(); v.persistent = true;
    v.ctl.throttle = 0; v.ctl.brake = 0; v.ctl.steer = 0; v.ctl.handbrake = false; v.ctl.reverse = false;
    this.mode = 'vehicle'; this.body.state = 'vehicle'; this.body.setEnabled(false);
    this.enterVeh = null; this.aiming = false; this.prompt = null;
    sim.bus.emit('sfx', { name: v.isMoto ? 'mount' : 'door', x: v.x, y: v.y, z: v.z });
    sim.onPlayerVehicleChanged(v);
  }
  exitVehicle(force = false): boolean {
    const v = this.vehicle;
    if (!v) return false;
    if (!force && v.speedAbs > 9) { this.sim.bus.emit('toast', { text: 'Slow down to get out', kind: 'info' }); return false; }
    // pick a clear door: left, right, then roof
    let ex = v.x, ey = v.y + v.spec.height + 0.2, ez = v.z;
    for (const side of [-1, 1]) {
      v.doorPos(_p, side);
      const gy = this.sim.phys.groundBelow(_p.x, v.y + 1.2, _p.z);
      if (Math.abs(gy - v.y) < 1.6 && this.sim.phys.los(v.x, v.y + 1.1, v.z, _p.x, gy + 1.1, _p.z) && this.sim.phys.los(_p.x, gy + 0.3, _p.z, _p.x, gy + 1.7, _p.z)) { ex = _p.x; ey = gy; ez = _p.z; break; }
    }
    v.driver = 'none'; v.ctl.throttle = 0; v.ctl.steer = 0; v.ctl.horn = false;
    v.persistent = v.owned || v.ref !== '';
    this.vehicle = null; this.mode = 'foot';
    this.body.state = 'normal'; this.body.setEnabled(true);
    this.body.teleport(ex, ey, ez, v.yaw);
    this.body.vx = v.vx * 0.5; this.body.vz = v.vz * 0.5;
    if (v.speedAbs > 6 && !force) { this.body.knockDown(1.1, v.vx * 0.6, v.vz * 0.6); this.takeDamage((v.speedAbs - 5) * 2.5, 'bail'); }
    this.sim.bus.emit('sfx', { name: v.isMoto ? 'mount' : 'door', x: ex, y: ey, z: ez });
    this.sim.onPlayerVehicleChanged(null);
    return true;
  }

  update(inp: PlayerInput, dt: number = DT) {
    const sim = this.sim, b = this.body;
    this.cooldown -= dt; this.meleeT -= dt; this.stunned -= dt; this.recoil = Math.max(0, this.recoil - dt * 0.4);
    if (this.downed) { this.downTime += dt; b.step(0, 0, false, null, dt); this.prompt = null; return; }
    // slow regeneration up to 30 after 8 s out of trouble
    if (this.health < 30 && sim.time - this.lastDamage > 8) this.health = Math.min(30, this.health + 4 * dt);
    if (inp.medkit && this.inv.medkits > 0 && this.health < 100 && this.healT <= 0) { this.healT = 1.1; sim.bus.emit('sfx', { name: 'medkit' }); }
    if (this.healT > 0) { this.healT -= dt; if (this.healT <= 0) { this.inv.medkits--; this.heal(60); sim.bus.emit('toast', { text: 'Medkit used', kind: 'good' }); } }

    if (this.mode === 'vehicle' && this.vehicle) { this.updateVehicle(inp, dt); return; }

    // ---- on foot
    if (inp.crouch && !this.crouchWas && sim.toggleCrouch) this.crouchToggle = !this.crouchToggle;
    this.crouchWas = inp.crouch;
    b.crouch = (sim.toggleCrouch ? this.crouchToggle : inp.crouch) && b.state === 'normal';
    const cy = inp.camYaw, sn = Math.sin(cy), cs = Math.cos(cy);
    let mx = inp.moveX, mz = inp.moveZ;
    const ml = Math.hypot(mx, mz); if (ml > 1) { mx /= ml; mz /= ml; }
    let wx = cs * mx + sn * mz, wz = -sn * mx + cs * mz;
    const moving = ml > 0.1;
    this.aiming = inp.aim && this.armed && b.state === 'normal';
    let speed = 4.4;
    const sprinting = inp.sprint && moving && !this.aiming && !b.crouch && this.stamina > 0.02 && b.state === 'normal' && mz > -0.2;
    if (b.state === 'swim') speed = 2.3;
    else if (b.crouch) speed = 1.8;
    else if (this.aiming) speed = 2.1;
    else if (sprinting) speed = 6.2;
    if (sprinting) { this.stamina = Math.max(0, this.stamina - dt / 8); this.staminaDelay = 1; }
    else { this.staminaDelay -= dt; if (this.staminaDelay <= 0) this.stamina = Math.min(1, this.stamina + dt / (moving ? 6 : 3.5)); }
    if (this.stunned > 0) speed *= 0.4;
    if (this.healT > 0) speed = Math.min(speed, 2.1);

    if (this.mode === 'entering' && this.enterVeh) {
      const v = this.enterVeh;
      if (moving || !sim.vehicles.list.includes(v) || v.speedAbs > 6) { this.mode = 'foot'; this.enterVeh = null; }
      else {
        this.enterT += dt;
        const dl = v.doorPos(_p, -1), d = Math.hypot(dl.x - b.x, dl.z - b.z);
        const dr = v.doorPos(v3(), 1), d2 = Math.hypot(dr.x - b.x, dr.z - b.z);
        const tx = d2 < d ? dr.x : dl.x, tz = d2 < d ? dr.z : dl.z, dm = Math.min(d, d2);
        if (dm < 1.0 || this.enterT > 1.5) { this.attach(v); return; }
        wx = ((tx - b.x) / dm); wz = ((tz - b.z) / dm); speed = 4.4;
        b.step(wx * speed, wz * speed, false, Math.atan2(wx, wz), dt);
        this.prompt = null;
        return;
      }
    }
    let face: number | null = null;
    if (this.aiming || sim.time - this.firedAt < 0.6) face = cy;
    else if (moving) face = Math.atan2(wx, wz);
    let jump = false;
    if (inp.jump && b.state === 'normal') {
      if (!(moving && b.tryMantle(Math.atan2(wx, wz))) && !b.tryMantle(b.yaw)) jump = b.grounded;
      if (jump) sim.bus.emit('sfx', { name: 'jump' });
    } else if (b.state === 'swim' && (inp.jump || (b.blocked > 0.7 && moving))) this.climbOut(moving ? Math.atan2(wx, wz) : b.yaw);
    b.step(wx * speed, wz * speed, jump, face, dt);
    if (b.landed > 0) {
      if (b.landed > 13) this.takeDamage((b.landed - 13) * 6, 'fall');
      if (b.landed > 5) sim.bus.emit('sfx', { name: 'land', vol: clamp01(b.landed / 14) });
      b.landed = 0;
    }
    this.stats.distance += b.speed2d * dt;
    this.updateWeapons(inp, dt);
    this.updateInteraction(inp, dt);
  }

  private climbOut(yaw: number) {
    const b = this.body, surf = b.waterSurface();
    for (const da of [0, 0.5, -0.5, 1.0, -1.0]) for (const d of [1.2, 2.0, 2.8]) {
      const x = b.x + Math.sin(yaw + da) * d, z = b.z + Math.cos(yaw + da) * d;
      const gy = this.sim.phys.groundBelow(x, surf + 3, z);
      if (gy > surf + 0.2 && gy < surf + 3.2) { b.startMantle(x, gy, z, 0.9); this.sim.bus.emit('sfx', { name: 'splash', vol: 0.4 }); return; }
    }
  }

  private updateVehicle(inp: PlayerInput, dt: number) {
    const v = this.vehicle!, c = v.ctl, sim = this.sim;
    if (inp.moveZ > 0.05) {
      if (v.speed < -1.5) { c.throttle = 0; c.brake = 1; c.reverse = false; } else { c.throttle = inp.moveZ; c.brake = 0; c.reverse = false; }
    } else if (inp.moveZ < -0.05) {
      if (v.speed > 1.5) { c.throttle = 0; c.brake = 1; c.reverse = false; } else { c.throttle = -inp.moveZ; c.brake = 0; c.reverse = true; }
    } else { c.throttle = 0; c.brake = 0; }
    c.steer = clamp(inp.moveX * sim.steerSensitivity, -1, 1);
    c.handbrake = inp.handbrake; c.horn = inp.horn;
    if (inp.horn && sim.tick % 30 === 0) sim.bus.emit('noise', { kind: 'horn', x: v.x, z: v.z, radius: 25, byPlayer: true });
    this.body.x = v.x; this.body.y = v.y; this.body.z = v.z; this.body.yaw = v.yaw;
    this.body.px = v.px; this.body.py = v.py; this.body.pz = v.pz;
    this.stats.distance += v.speedAbs * dt;
    this.prompt = null;
    if (v.submerged) { this.exitVehicle(true); sim.bus.emit('toast', { text: `${v.spec.name} lost to the harbor`, kind: 'bad' }); return; }
    this.updateInteraction(inp, dt);
    if (inp.enterExit) this.exitVehicle();
  }

  private updateWeapons(inp: PlayerInput, dt: number) {
    const sim = this.sim, b = this.body;
    if (inp.gadgetCycle) { this.gadget = this.gadget === 'chirper' ? 'smoke' : 'chirper'; sim.bus.emit('toast', { text: `Gadget: ${this.gadget === 'chirper' ? 'Distraction chirper' : 'Smoke canister'}`, kind: 'info' }); }
    if (inp.holster) this.selectSlot(this.slot === 'none' ? this.lastSlot : 'none');
    if (inp.slot === 1) this.selectSlot('sidearm'); else if (inp.slot === 2) this.selectSlot('long'); else if (inp.slot === 3) this.selectSlot('stun'); else if (inp.slot === 0) this.selectSlot('none');
    if (b.state !== 'normal') return;
    const w = this.weapon();
    if (this.reloadT > 0 && w) {
      this.reloadT -= dt;
      if (this.reloadT <= 0) {
        const have = this.inv.mags[w.id] ?? 0, need = Math.min(w.mag - have, this.inv.ammo[w.ammo]);
        this.inv.mags[w.id] = have + need; this.inv.ammo[w.ammo] -= need;
      }
    }
    if (w && inp.reload && this.reloadT <= 0 && (this.inv.mags[w.id] ?? 0) < w.mag && this.inv.ammo[w.ammo] > 0) { this.reloadT = w.reload; sim.bus.emit('sfx', { name: 'reload' }); }
    if (!w && (inp.firePressed || inp.aim) && this.lastSlot !== 'none' && inp.firePressed) this.selectSlot(this.lastSlot);
    if (w && inp.fire && (w.auto || inp.firePressed) && this.cooldown <= 0 && this.reloadT <= 0) {
      const mag = this.inv.mags[w.id] ?? 0;
      if (mag > 0) this.shoot(w, inp);
      else if (inp.firePressed) {
        sim.bus.emit('sfx', { name: 'empty' });
        if (this.inv.ammo[w.ammo] > 0) { this.reloadT = w.reload; sim.bus.emit('sfx', { name: 'reload' }); }
      }
    }
    // visible weapon near bystanders is itself reportable
    if (this.lethalArmed) { this.weaponShownT += dt; if (this.weaponShownT > 2.5) { this.weaponShownT = 0; sim.police.crime('weaponDisplay', b.x, b.z); } } else this.weaponShownT = 0;
    if (inp.melee && this.meleeT <= 0) this.melee();
    if (inp.gadget) this.throwGadget(inp);
  }
  private aimDir(inp: PlayerInput, out: { x: number; y: number; z: number }) {
    const cp = Math.cos(inp.camPitch);
    out.x = Math.sin(inp.camYaw) * cp; out.y = Math.sin(inp.camPitch); out.z = Math.cos(inp.camYaw) * cp;
  }
  private shoot(w: WeaponSpec, inp: PlayerInput) {
    const sim = this.sim, b = this.body, d = { x: 0, y: 0, z: 0 };
    this.aimDir(inp, d);
    // camera ray finds the intended point (skipping the stretch between camera and character) ...
    const skip = Math.max(0, (b.x - inp.camX) * d.x + (b.y + 1.4 - inp.camY) * d.y + (b.z - inp.camZ) * d.z);
    const sx = inp.camX + d.x * skip, sy = inp.camY + d.y * skip, sz = inp.camZ + d.z * skip;
    let dist = 200;
    if (sim.phys.castSolid(sx, sy, sz, d.x, d.y, d.z, 200, _hit)) dist = Math.max(_hit.dist, 2.5);
    const tx = sx + d.x * dist, ty = sy + d.y * dist, tz = sz + d.z * dist;
    // ... then the shot leaves the muzzle toward it, so bullets cannot pass camera-only gaps
    const fy = b.yaw, mxp = b.x + Math.cos(fy) * 0.22 + Math.sin(fy) * 0.35, mzp = b.z - Math.sin(fy) * 0.22 + Math.cos(fy) * 0.35, myp = b.y + (b.crouch ? 0.95 : 1.42);
    let ax = tx - mxp, ay = ty - myp, az = tz - mzp; const al = Math.hypot(ax, ay, az) || 1; ax /= al; ay /= al; az /= al;
    const spread = w.spread * (this.aiming ? 1 : 2.4) * (b.crouch ? 0.7 : 1) + (b.speed2d > 1.2 ? w.moveSpread : 0) + this.recoil * 0.35;
    for (let k = 0; k < w.pellets; k++) {
      const rx = (sim.rng.next() + sim.rng.next() - 1) * spread, ry = (sim.rng.next() + sim.rng.next() - 1) * spread;
      // perturb in the plane perpendicular to the aim
      let px = ax + Math.cos(inp.camYaw) * rx, py = ay + ry, pz = az - Math.sin(inp.camYaw) * rx;
      const pl = Math.hypot(px, py, pz); px /= pl; py /= pl; pz /= pl;
      resolveShot(sim, mxp, myp, mzp, px, py, pz, w, -1);
    }
    this.inv.mags[w.id]--; this.cooldown = w.interval; this.recoil = Math.min(0.12, this.recoil + w.recoil); this.firedAt = sim.time;
    this.stats.shotsFired++;
    sim.bus.emit('sfx', { name: w.lethal ? (w.slot === 'long' ? 'shot_long' : 'shot') : 'shot_stun', x: mxp, y: myp, z: mzp });
    sim.bus.emit('vfx', { kind: 'muzzle', x: mxp + ax * 0.3, y: myp + ay * 0.3, z: mzp + az * 0.3, dx: ax, dy: ay, dz: az });
    sim.bus.emit('noise', { kind: w.lethal ? 'gunshot' : 'melee', x: b.x, z: b.z, radius: w.noise, byPlayer: true });
    if (w.lethal) sim.police.crime('gunfire', b.x, b.z);
  }
  private melee() {
    const sim = this.sim, b = this.body;
    this.meleeT = BATON.interval;
    let bestA = null as (typeof sim.actors.list)[number] | null, bestP = null as (typeof sim.peds.list)[number] | null, bd = BATON.range;
    for (const a of sim.actors.list) {
      if (a.dead || a.inVehicle) continue;
      const d = Math.hypot(a.body.x - b.x, a.body.z - b.z);
      if (d < bd && Math.abs(angleDiff(Math.atan2(a.body.x - b.x, a.body.z - b.z), b.yaw)) < 1.1) { bd = d; bestA = a; }
    }
    for (const p of sim.peds.list) {
      if (p.gone || p.down) continue;
      const d = Math.hypot(p.x - b.x, p.z - b.z);
      if (d < bd && Math.abs(angleDiff(Math.atan2(p.x - b.x, p.z - b.z), b.yaw)) < 1.0) { bd = d; bestP = p; bestA = null; }
    }
    if (!bestA && !bestP) {
      // nothing to hit: F doubles as "get in" when a vehicle is right there
      if (this.targetVeh) { this.tryEnter(this.targetVeh); this.meleeT = 0.2; return; }
    }
    sim.bus.emit('sfx', { name: bestA || bestP ? 'baton_hit' : 'baton', x: b.x, y: b.y + 1, z: b.z });
    if (bestA) { bestA.hit(BATON.damage, false, true); sim.bus.emit('vfx', { kind: 'impact', x: bestA.body.x, y: bestA.body.y + 1.2, z: bestA.body.z, n: 3 }); }
    else if (bestP) bestP.hit(sim, 0, false, true);
    if (bestA || bestP) sim.bus.emit('noise', { kind: 'melee', x: b.x, z: b.z, radius: 14, byPlayer: true });
  }
  private throwGadget(inp: PlayerInput) {
    const sim = this.sim, b = this.body, kind = this.gadget;
    if ((kind === 'chirper' ? this.inv.chirper : this.inv.smoke) <= 0) { sim.bus.emit('toast', { text: 'None left', kind: 'info' }); return; }
    if (kind === 'chirper') this.inv.chirper--; else this.inv.smoke--;
    const d = { x: 0, y: 0, z: 0 }; this.aimDir(inp, d);
    const range = clamp(9 + inp.camPitch * 14, 4, 16);
    let tx = b.x + Math.sin(inp.camYaw) * range, tz = b.z + Math.cos(inp.camYaw) * range;
    if (sim.phys.castWorld(b.x, b.y + 1.4, b.z, Math.sin(inp.camYaw), 0, Math.cos(inp.camYaw), range, _hit)) { tx = b.x + Math.sin(inp.camYaw) * (_hit.dist - 0.5); tz = b.z + Math.cos(inp.camYaw) * (_hit.dist - 0.5); }
    sim.gadgets.push({ kind, x: tx, y: sim.phys.groundBelow(tx, b.y + 2, tz), z: tz, t: -0.6, life: kind === 'chirper' ? 9 : 14, sx: b.x, sy: b.y + 1.5, sz: b.z });
    sim.bus.emit('sfx', { name: 'throw' });
  }

  private tryEnter(v: Vehicle) {
    if (v.locked) { this.sim.bus.emit('toast', { text: 'Locked. Find another.', kind: 'info' }); this.sim.bus.emit('sfx', { name: 'locked' }); return; }
    if (v.driver === 'police') { this.sim.bus.emit('toast', { text: 'Occupied by officers', kind: 'info' }); return; }
    this.enterVehicle(v);
  }
  private updateInteraction(inp: PlayerInput, dt: number) {
    const sim = this.sim, inVeh = !!this.vehicle;
    this.scanT -= dt;
    if (this.scanT <= 0) {
      this.scanT = 0.1;
      let best: Interactable | null = null, bd = Infinity, bp = -1;
      for (const it of sim.interactables) {
        if (inVeh && !it.vehicleOk) continue;
        const d = Math.hypot(it.x - this.x, it.z - this.z), pr = it.priority ?? 0;
        if (d < it.r && (pr > bp || (pr === bp && d < bd)) && it.label() !== null) { bd = d; best = it; bp = pr; }
      }
      this.target = best; this.targetVeh = null;
      if (!inVeh) {
        const v = sim.vehicles.nearest(this.body.x, this.body.z, 4.2, (c) => !c.submerged && Math.abs(c.y - this.body.y) < 2.5 && c.speedAbs < 5);
        if (v) {
          const d = Math.hypot(v.x - this.body.x, v.z - this.body.z) - v.spec.length * 0.3;
          if (d < 2.6 && (!best || d < bd)) { this.targetVeh = v; this.target = null; }
        }
      }
    }
    const t = this.target, tv = this.targetVeh;
    if (tv) {
      const occupied = tv.driver !== 'none';
      const txt = tv.locked ? `${tv.spec.maker} ${tv.spec.name} — locked` : tv.owned ? `E — ${tv.isMoto ? 'Ride' : 'Drive'} your ${tv.spec.name}`
        : tv.spec.cls === 'police' ? `E — Take the ${tv.spec.name}; officers will respond` : `E — Take ${tv.spec.maker} ${tv.spec.name}; ${occupied ? 'driver' : 'owner'} may report`;
      this.prompt = { text: txt, progress: 0 };
      if (inp.interact) this.tryEnter(tv);
      return;
    }
    if (!t) { this.prompt = null; this.holdT = 0; return; }
    const label = t.label();
    if (label === null) { this.prompt = null; return; }
    const hold = t.hold ?? 0;
    if (hold > 0) {
      if (inp.interactHeld && this.holdId === t.id) this.holdT += dt; else if (inp.interactHeld) { this.holdId = t.id; this.holdT = dt; } else this.holdT = approach(this.holdT, 0, dt * 2);
      this.prompt = { text: label, progress: clamp01(this.holdT / hold) };
      if (this.holdT >= hold) { this.holdT = 0; this.holdId = ''; t.use(); }
    } else {
      this.prompt = { text: label, progress: 0 };
      if (inp.interact) t.use();
    }
  }
}
export { LIMITS };
