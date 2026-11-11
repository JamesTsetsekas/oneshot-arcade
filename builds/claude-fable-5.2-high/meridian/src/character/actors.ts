// Foot NPCs that share the player's character controller: police officers, security guards, rivals.
// Utility/state-machine AI: perceive (range, FOV, line of sight, smoke), then chase, arrest, attack,
// investigate noises, or patrol. Nonlethal hits stun; lethal hits incapacitate.
import type { Sim } from '../game-session/sim';
import type { Unit } from '../police/units';
import { CharBody, HumanView, Look, Pose } from './character';
import { WEAPONS, WeaponSpec, resolveShot } from './weapons';
import { angleDiff, clamp } from '../core/math';
import { terrainH } from '../world/district';

export type Faction = 'police' | 'security' | 'rival';
export type ActorState = 'Idle' | 'Patrol' | 'Investigate' | 'Chase' | 'Attack' | 'Arrest' | 'Search' | 'Return' | 'Stunned' | 'Down';
const LOOKS: Record<Faction, Look> = {
  police: { skin: 0xc68d6a, top: 0x1f2f55, bottom: 0x1a2238, hair: 0x2a1f1a, hat: 2, pack: 0, scale: 1.02 },
  security: { skin: 0xe0ac86, top: 0x6a7078, bottom: 0x2c3036, hair: 0x4a3524, hat: 1, pack: 0, scale: 1.03 },
  rival: { skin: 0xa5714f, top: 0x2a2a2e, bottom: 0x3a2a2a, hair: 0x1a1a1f, hat: 0, pack: 0, scale: 1.0 },
};
const SKINS = [0xf1c9a5, 0xe0ac86, 0xc68d6a, 0xa5714f, 0x8a5a3c];
let nextActor = 1;

export class Actor {
  id = nextActor++;
  body: CharBody; look: Look;
  hp = 100; ko = 0; dead = false; stunT = 0; inVehicle = false;
  state: ActorState = 'Idle'; stateT = 0;
  tx = 0; tz = 0; sees = false; seeT = 0; lastSeenT = -99; alerted = false; ignoreUntil = 0;
  fireCd = 1; sideT = 0; sideSign = 1; blockedT = 0; meleeCd = 0; burst = 0;
  patrol: number[][] | null = null; pi = 0; homeX = 0; homeZ = 0; homeYaw = 0;
  unit: Unit | null = null; group = ''; wantBoard = false; removeMe = false; aiming = false;
  weapon: WeaponSpec; dmgScale = 0.4; visionRange = 55; fov = 1.35;
  constructor(public sim: Sim, public faction: Faction, x: number, z: number, yaw: number) {
    this.body = new CharBody(sim.phys, x, sim.phys.groundBelow(x, terrainH(x, z) + 3, z), z, yaw);
    this.look = { ...LOOKS[faction], skin: sim.rng.pick(SKINS), scale: LOOKS[faction].scale * sim.rng.range(0.96, 1.04) };
    this.weapon = faction === 'rival' ? WEAPONS.sparrow : WEAPONS.wren;
    this.homeX = this.tx = x; this.homeZ = this.tz = z; this.homeYaw = yaw;
    if (faction === 'security') { this.visionRange = 21; this.fov = 1.0; }
    if (faction === 'rival') { this.visionRange = 60; this.fov = 2.4; this.dmgScale = 0.45; this.look.top = sim.rng.pick([0x2a2a2e, 0x5a1f24, 0x3a3a22]); }
  }
  get x() { return this.body.x; } get y() { return this.body.y; } get z() { return this.body.z; }
  get disabled() { return this.dead || this.stunT > 0; }
  view(): HumanView {
    const b = this.body;
    const pose: Pose = this.dead || this.stunT > 0 || b.state === 'down' ? 'down' : b.state === 'mantle' ? 'mantle' : this.aiming ? 'aim' : 'stand';
    return { x: b.x, y: b.y, z: b.z, yaw: b.yaw, phase: b.phase, gait: b.gait, pose, look: this.look, armed: this.faction === 'security' ? 3 : this.aiming ? 1 : 0, lean: 0 };
  }
  hit(dmg: number, lethal: boolean, byPlayer: boolean) {
    if (this.dead) return;
    const sim = this.sim;
    if (!lethal) {
      if (dmg <= 0) this.stunT = Math.max(this.stunT, 10);
      else { this.ko += dmg; if (this.ko >= 70) { this.stunT = 25; this.ko = 0; } else this.stunT = Math.max(this.stunT, 1.3); }
      this.body.knockDown(this.stunT);
    } else {
      this.hp -= dmg;
      if (this.hp <= 0) { this.dead = true; this.body.knockDown(99999); this.body.setEnabled(false); } else this.stunT = Math.max(this.stunT, 0.25);
    }
    sim.bus.emit('sfx', { name: 'grunt', x: this.x, y: this.y + 1.4, z: this.z });
    this.alerted = true; this.lastSeenT = sim.time;
    if (byPlayer) {
      if (this.faction === 'police') sim.police.crime('attackPolice', this.x, this.z, { source: 'police', scale: lethal ? 1 : 0.5 });
      else if (this.faction === 'security') { sim.actors.alertGroup(this.group); sim.police.crime('assault', this.x, this.z, { source: lethal ? 'guard' : undefined }); }
    }
  }
}

export class Actors {
  list: Actor[] = [];
  constructor(public sim: Sim) {
    sim.bus.on('noise', (n) => {
      for (const a of this.list) {
        if (a.disabled || a.faction === 'police') continue;
        const d = Math.hypot(a.x - n.x, a.z - n.z);
        if (d > n.radius) continue;
        if (n.kind === 'chirper' && !a.alerted) { a.state = 'Investigate'; a.stateT = 8; a.tx = n.x; a.tz = n.z; }
        else if ((n.kind === 'gunshot' || n.kind === 'melee') && n.byPlayer && d < 40) { a.alerted = true; a.lastSeenT = sim.time; a.tx = n.x; a.tz = n.z; if (a.faction === 'security') this.alertGroup(a.group); }
      }
    });
  }
  spawn(faction: Faction, x: number, z: number, yaw = 0, group = ''): Actor {
    const a = new Actor(this.sim, faction, x, z, yaw);
    a.group = group; this.list.push(a);
    return a;
  }
  remove(a: Actor) { const i = this.list.indexOf(a); if (i >= 0) { this.list.splice(i, 1); a.body.dispose(); } }
  removeGroup(group: string) { for (const a of [...this.list]) if (a.group === group) this.remove(a); }
  alertGroup(group: string) { if (!group) return; for (const a of this.list) if (a.group === group && !a.alerted) { a.alerted = true; a.lastSeenT = this.sim.time; a.tx = this.sim.player.x; a.tz = this.sim.player.z; } }
  groupAlive(group: string) { return this.list.filter((a) => a.group === group && !a.disabled).length; }

  canSee(a: Actor, range = a.visionRange): boolean {
    const sim = this.sim, p = sim.player;
    if (p.downed) return false;
    const dx = p.x - a.x, dz = p.z - a.z, d = Math.hypot(dx, dz);
    if (d > range * (1 - 0.25 * sim.clock.night) * (p.body.crouch && !p.vehicle ? 0.6 : 1)) return false;
    if (d > 2.5 && Math.abs(angleDiff(Math.atan2(dx, dz), a.body.yaw)) > a.fov) return false;
    return sim.losClear(a.x, a.y + 1.6, a.z, p.x, p.y + (p.body.crouch && !p.vehicle ? 0.8 : 1.3), p.z);
  }
  private move(a: Actor, tx: number, tz: number, speed: number, dt: number, face: number | null = null) {
    const b = a.body, dx = tx - b.x, dz = tz - b.z, dist = Math.hypot(dx, dz);
    let dir = Math.atan2(dx, dz);
    if (a.sideT > 0) { dir += a.sideSign * 1.25; a.sideT -= dt; }
    const sp = dist < 0.4 ? 0 : speed;
    b.step(Math.sin(dir) * sp, Math.cos(dir) * sp, false, face ?? (sp > 0 ? dir : null), dt);
    if (b.blocked > 0.6 && sp > 0) {
      a.blockedT += dt;
      if (a.blockedT > 0.3) { a.blockedT = 0; if (!b.tryMantle(Math.atan2(dx, dz), 1.5)) { a.sideSign = this.sim.rng.chance(0.5) ? 1 : -1; a.sideT = 0.7; } }
    } else a.blockedT = Math.max(0, a.blockedT - dt);
    return dist;
  }
  private idle(a: Actor, dt: number, face: number | null = null) { a.body.step(0, 0, false, face, dt); }
  private shoot(a: Actor, spec: WeaponSpec, dmgScale: number) {
    const sim = this.sim, p = sim.player;
    const ox = a.x + Math.sin(a.body.yaw) * 0.4, oy = a.y + 1.42, oz = a.z + Math.cos(a.body.yaw) * 0.4;
    const ty = p.y + (p.vehicle ? 0.9 : p.body.crouch ? 0.7 : 1.15);
    let dx = p.x - ox, dy = ty - oy, dz = p.z - oz; const d = Math.hypot(dx, dy, dz) || 1; dx /= d; dy /= d; dz /= d;
    const spread = 0.018 + d * 0.0011 + p.speed * 0.0065 + (sim.clock.night > 0.5 ? 0.008 : 0);
    dx += (sim.rng.next() + sim.rng.next() - 1) * spread; dy += (sim.rng.next() + sim.rng.next() - 1) * spread * 0.6; dz += (sim.rng.next() + sim.rng.next() - 1) * spread;
    const l = Math.hypot(dx, dy, dz); dx /= l; dy /= l; dz /= l;
    resolveShot(sim, ox, oy, oz, dx, dy, dz, spec, a.id, dmgScale);
    sim.bus.emit('sfx', { name: spec.lethal ? 'shot' : 'shot_stun', x: ox, y: oy, z: oz, vol: 0.8 });
    sim.bus.emit('vfx', { kind: 'muzzle', x: ox, y: oy, z: oz, dx, dy, dz });
    if (spec.lethal) sim.bus.emit('noise', { kind: 'gunshot', x: a.x, z: a.z, radius: 55, byPlayer: false });
  }

  private officer(a: Actor, dt: number) {
    const sim = this.sim, pol = sim.police, p = sim.player;
    const dist = Math.hypot(p.x - a.x, p.z - a.z);
    a.sees = this.canSee(a);
    if (a.sees && pol.recognises(dist)) { pol.sight('officer'); a.lastSeenT = sim.time; }
    a.aiming = false;
    if (pol.tier === 0 || a.wantBoard) {
      a.state = 'Return';
      const v = a.unit?.vehicle;
      if (v) { this.move(a, v.x, v.z, 4.2, dt); } else this.idle(a, dt);
      return;
    }
    const fresh = sim.time - a.lastSeenT < 2.5;
    const face = Math.atan2(p.x - a.x, p.z - a.z);
    if (fresh && pol.tier >= 3) {
      a.state = 'Attack'; a.aiming = true;
      if (dist > 17) this.move(a, p.x, p.z, 5.2, dt, face); else if (dist < 6) this.move(a, a.x - Math.sin(face) * 4, a.z - Math.cos(face) * 4, 2.4, dt, face); else this.idle(a, dt, face);
      a.fireCd -= dt;
      if (a.sees && a.fireCd <= 0 && dist < 45) { a.fireCd = 0.7 + sim.rng.next() * 0.8; this.shoot(a, WEAPONS.wren, a.dmgScale); }
      return;
    }
    if (fresh) {
      a.state = pol.detain > 0 ? 'Arrest' : 'Chase';
      if (dist > 1.9) this.move(a, p.x, p.z, pol.detain > 0 ? 2.2 : 5.7, dt, dist < 6 ? face : null); else this.idle(a, dt, face);
      a.fireCd -= dt;
      if (pol.tier >= 2 && pol.detain <= 0 && a.sees && !p.vehicle && dist > 3.5 && dist < 15 && p.speed > 3.2 && a.fireCd <= 0) { a.fireCd = 2.8 + sim.rng.next(); a.aiming = true; this.shoot(a, WEAPONS.halcyon, 1); }
      return;
    }
    // lost sight: converge on the last known position, then sweep around it
    a.state = 'Search';
    const ox = Math.sin(a.id * 2.4 + Math.floor(sim.time / 7)) * Math.min(18, pol.searchR * 0.3), oz = Math.cos(a.id * 1.7 + Math.floor(sim.time / 7)) * Math.min(18, pol.searchR * 0.3);
    const d = this.move(a, pol.lastKnown.x + ox, pol.lastKnown.z + oz, 4.4, dt);
    if (d < 2) a.body.yaw += dt * 1.2;
    if (a.unit && a.unit.vehicle && Math.hypot(p.x - a.x, p.z - a.z) > 60) a.wantBoard = true;
  }
  private guard(a: Actor, dt: number) {
    const sim = this.sim, p = sim.player;
    const dist = Math.hypot(p.x - a.x, p.z - a.z);
    a.sees = sim.time > a.ignoreUntil && this.canSee(a, a.alerted ? 34 : a.visionRange) && (a.alerted || sim.police.inRestricted(p.x, p.z));
    if (a.sees) { a.seeT += dt; a.lastSeenT = sim.time; } else a.seeT = Math.max(0, a.seeT - dt * 0.5);
    if (!a.alerted && a.seeT > 0.75) {
      a.alerted = true; this.alertGroup(a.group);
      sim.bus.emit('subtitle', { speaker: 'Guard', text: sim.rng.pick(['Hey! This yard is closed!', 'Intruder by the stacks! Stop right there!', 'You are not on the manifest. Hold it!']) });
      sim.bus.emit('sfx', { name: 'alert_up', vol: 0.6 });
      sim.police.crime('trespass', p.x, p.z, { source: 'guard' });
    }
    a.meleeCd -= dt;
    if (a.alerted) {
      if (sim.time - a.lastSeenT > 9) { a.alerted = false; a.state = 'Patrol'; this.idle(a, dt); return; }
      a.state = 'Chase';
      const tx = a.sees ? p.x : a.tx, tz = a.sees ? p.z : a.tz;
      if (a.sees) { a.tx = p.x; a.tz = p.z; }
      const d = this.move(a, tx, tz, 5.0, dt);
      if (a.sees && dist < 1.9 && a.meleeCd <= 0 && !p.vehicle) {
        a.meleeCd = 1.15; p.takeDamage(15, 'baton'); p.stunned = Math.max(p.stunned, 0.9);
        sim.bus.emit('sfx', { name: 'baton_hit', x: p.x, y: p.y + 1, z: p.z });
      }
      if (!a.sees && d < 1.5) a.body.yaw += dt * 2;
      return;
    }
    if (a.state === 'Investigate') {
      a.stateT -= dt;
      const d = this.move(a, a.tx, a.tz, 2.4, dt);
      if (d < 1.6) a.body.yaw += dt * 1.4;
      if (a.stateT <= 0) a.state = 'Patrol';
      return;
    }
    a.state = 'Patrol';
    if (a.patrol && a.patrol.length) {
      const wp = a.patrol[a.pi % a.patrol.length];
      if (this.move(a, wp[0], wp[1], 1.5, dt) < 1.0) { a.pi++; }
    } else this.idle(a, dt, a.homeYaw);
  }
  private rival(a: Actor, dt: number) {
    const sim = this.sim, p = sim.player;
    const dist = Math.hypot(p.x - a.x, p.z - a.z);
    a.sees = this.canSee(a);
    if (a.sees) { a.lastSeenT = sim.time; a.tx = p.x; a.tz = p.z; a.alerted = true; }
    const face = Math.atan2(p.x - a.x, p.z - a.z);
    a.aiming = a.sees;
    if (!a.alerted) { this.idle(a, dt); return; }
    if (a.sees && dist < 22) {
      a.state = 'Attack';
      // strafe between bursts so the fight is not a static line
      a.sideT -= dt;
      if (a.sideT < -1.6) { a.sideT = 0; a.sideSign = -a.sideSign; }
      const sx = Math.cos(face) * a.sideSign, sz = -Math.sin(face) * a.sideSign;
      const back = dist < 8 ? -1 : dist > 15 ? 1 : 0;
      a.body.step((sx * 1.6 + Math.sin(face) * back * 2.2), (sz * 1.6 + Math.cos(face) * back * 2.2), false, face, dt);
      a.fireCd -= dt;
      if (a.fireCd <= 0) {
        this.shoot(a, a.weapon, a.dmgScale); a.burst++;
        if (a.burst >= 4) { a.burst = 0; a.fireCd = 1.2 + sim.rng.next() * 1.2; } else a.fireCd = 0.12;
      }
    } else { a.state = 'Chase'; const sv = a.sideT; a.sideT = Math.max(0, a.sideT); this.move(a, a.tx, a.tz, 5.0, dt); if (sv < 0) a.sideT = 0; }
  }

  update(dt: number) {
    const sim = this.sim;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const a = this.list[i];
      if (a.removeMe) { this.remove(a); continue; }
      if (a.inVehicle) continue;
      if (a.dead) { a.body.step(0, 0, false, null, dt); continue; }
      if (a.stunT > 0) {
        a.stunT -= dt; a.state = 'Stunned'; a.aiming = false; a.body.step(0, 0, false, null, dt);
        if (a.stunT <= 0) { a.body.state = 'normal'; a.body.downTime = 0; }
        continue;
      }
      if (a.faction === 'police') this.officer(a, dt); else if (a.faction === 'security') this.guard(a, dt); else this.rival(a, dt);
      // officers left behind by the simulation bubble are retired out of sight
      if (a.faction === 'police' && !a.unit?.vehicle) {
        const d = Math.hypot(a.x - sim.player.x, a.z - sim.player.z);
        if (d > 130 && !sim.isVisible(a.x, a.y + 1, a.z)) a.removeMe = true;
      }
    }
  }
  sync() { for (const a of this.list) if (!a.inVehicle) a.body.sync(); }
}
void clamp;
