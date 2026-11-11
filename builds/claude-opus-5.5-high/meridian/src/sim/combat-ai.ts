// Hostile/neutral armed actors: police on foot, security guards (stealth mission), rivals.
// Utility-flavoured state machine: patrol, investigate, engage from cover, flank, retreat,
// chase and nonlethal arrest attempts at low threat.

import { clamp, dist2, Rng, wrapAngle } from "../core/math";
import { Character, moveToward } from "./character";
import { WEAPONS, type WeaponId } from "./weapons";
import type { Game } from "./game";
import type { Rect } from "../world/district";

export type Team = "police" | "security" | "rival";
export type CombatState = "Patrol" | "Guard" | "Investigate" | "Engage" | "Cover" | "Flank" | "Retreat" | "Chase" | "Arrest" | "Search" | "Return" | "Idle";

export interface CombatBrain {
  team: Team;
  state: CombatState;
  hostile: boolean;
  weapon: WeaponId;
  mag: number;
  reload: number;
  fireCd: number;
  burst: number;
  accuracy: number;
  waypoints: { x: number; z: number }[];
  wi: number;
  wait: number;
  tx: number; tz: number;
  timer: number;
  suspicion: number;
  sees: boolean;
  seenX: number; seenZ: number; seenT: number;
  cover: { x: number; z: number } | null;
  coverT: number;
  flankT: number;
  fov: number;
  range: number;
  zone: Rect | null;
  canShoot: boolean;
  unitId: number;
  homeX: number; homeZ: number;
  meleeCd: number;
  investigateX: number; investigateZ: number;
  barkCd: number;
}

const BARKS: Record<Team, { spot: string[]; lost: string[]; hit: string[]; arrest: string[] }> = {
  police: {
    spot: ["Warden unit, visual on suspect!", "Stop right there!", "Hands where I can see them!"],
    lost: ["Lost visual. Sweep the block.", "Where'd they go?", "Check the alleys."],
    hit: ["Officer hit!", "Taking fire!"],
    arrest: ["On the ground, now!", "Hands up — you're coming with us."],
  },
  security: {
    spot: ["Hey! Restricted area!", "Intruder on the floor!", "You shouldn't be in here."],
    lost: ["Must have been the wind.", "Thought I saw someone…", "Keep your eyes open."],
    hit: ["I'm hit!", "Call it in!"],
    arrest: ["Don't move!"],
  },
  rival: {
    spot: ["There's the courier!", "Get them!", "That's the one — take the cargo!"],
    lost: ["Find them!", "Spread out!"],
    hit: ["Argh!", "They've got teeth!"],
    arrest: ["Hand it over!"],
  },
};

export class CombatSystem {
  brains = new Map<string, CombatBrain>();
  private rng = new Rng(31337);

  constructor(private g: Game) {}

  add(c: Character, team: Team, opts: Partial<CombatBrain> = {}): CombatBrain {
    const b: CombatBrain = {
      team, state: opts.waypoints?.length ? "Patrol" : "Guard", hostile: false, weapon: "pistol", mag: 12, reload: 0, fireCd: 0, burst: 0,
      accuracy: team === "police" ? 0.55 : team === "rival" ? 0.45 : 0.4, waypoints: [], wi: 0, wait: 0, tx: c.x, tz: c.z, timer: 0,
      suspicion: 0, sees: false, seenX: 0, seenZ: 0, seenT: -100, cover: null, coverT: 0, flankT: 0, fov: 1.05, range: 34, zone: null,
      canShoot: true, unitId: 0, homeX: c.x, homeZ: c.z, meleeCd: 0, investigateX: 0, investigateZ: 0, barkCd: 0,
      ...opts,
    };
    b.mag = WEAPONS[b.weapon].mag || 0;
    c.weapon = b.weapon;
    this.brains.set(c.id, b);
    if (!this.g.chars.includes(c)) this.g.chars.push(c);
    return b;
  }

  remove(c: Character) { this.brains.delete(c.id); }

  /** Hearing event (gunshot, chirper, noise). */
  hear(x: number, z: number, radius: number, kind: "gunfire" | "chirper" | "noise") {
    for (const [id, b] of this.brains) {
      const c = this.g.charById(id);
      if (!c || !c.alive || c.status !== "normal") continue;
      if (dist2(c.x, c.z, x, z) > radius) continue;
      if (kind === "gunfire" && b.team !== "police") { b.hostile = true; }
      if (b.state === "Engage" || b.state === "Cover" || b.state === "Chase") continue;
      b.state = "Investigate"; b.investigateX = x; b.investigateZ = z; b.timer = kind === "chirper" ? 9 : 12;
      b.suspicion = Math.max(b.suspicion, kind === "gunfire" ? 0.8 : 0.4);
    }
  }

  private bark(c: Character, b: CombatBrain, kind: "spot" | "lost" | "hit" | "arrest") {
    if (b.barkCd > 0) return;
    b.barkCd = 5;
    this.g.say(c, this.rng.pick(BARKS[b.team][kind]), 2, true);
  }

  update(dt: number) {
    const g = this.g;
    const P = g.player;
    const pv = P.vehicle;
    const px = pv ? pv.x : P.x, pz = pv ? pv.z : P.z, py = pv ? pv.y + 1 : P.chestY;
    const night = g.clock.isNight;
    for (const [id, b] of this.brains) {
      const c = g.charById(id);
      if (!c) { this.brains.delete(id); continue; }
      c.updateStatus(dt);
      if (!c.alive || c.status !== "normal" || c.vehicle) { c.aiming = false; continue; }
      if (b.fireCd > 0) b.fireCd -= dt;
      if (b.barkCd > 0) b.barkCd -= dt;
      if (b.meleeCd > 0) b.meleeCd -= dt;
      if (b.reload > 0) { b.reload -= dt; if (b.reload <= 0) b.mag = WEAPONS[b.weapon].mag; }

      // perception
      const d = dist2(c.x, c.z, px, pz);
      const range = b.range * (night ? 0.7 : 1) * (P.crouch && !pv ? 0.75 : 1);
      let sees = false;
      if (d < range && !g.playerHidden()) {
        const ang = Math.abs(wrapAngle(Math.atan2(px - c.x, pz - c.z) - c.yaw));
        const inFov = ang < b.fov || d < 2.5 || (b.hostile && ang < 2.2);
        if (inFov) sees = g.world.lineOfSight(c.x, c.eyeY, c.z, px, py, pz);
      }
      b.sees = sees;
      if (sees) { b.seenX = px; b.seenZ = pz; b.seenT = g.time; }

      // suspicion for stealth guards
      if (b.team === "security" && !b.hostile) {
        const inZone = !b.zone || (px > b.zone.x0 && px < b.zone.x1 && pz > b.zone.z0 && pz < b.zone.z1);
        if (sees && inZone && !g.missionAllowsPresence()) {
          const rate = (7 / Math.max(3, d)) * (P.crouch ? 0.45 : 1) * (P.sprint ? 1.5 : 1) * (night ? 0.7 : 1);
          b.suspicion = clamp(b.suspicion + rate * dt * 0.5, 0, 1);
          if (b.suspicion > 0.35 && b.state !== "Investigate") { b.state = "Investigate"; b.investigateX = px; b.investigateZ = pz; b.timer = 8; }
          if (b.suspicion >= 1) { this.alarm(c, b); }
        } else b.suspicion = Math.max(0, b.suspicion - dt * 0.12);
      }
      // police hostility is driven by the police system
      if (b.team === "police") {
        b.hostile = g.police.tier > 0 && g.police.identified;
        b.canShoot = g.police.lethalAuthorized;
      }

      const spec = WEAPONS[b.weapon];
      const env = g.footEnv;
      if (b.hostile && sees) {
        if (b.state !== "Engage" && b.state !== "Cover" && b.state !== "Flank" && b.state !== "Chase" && b.state !== "Arrest" && b.state !== "Retreat") this.bark(c, b, "spot");
        if (b.team === "police" && !b.canShoot) b.state = d < 2.6 && !pv ? "Arrest" : "Chase";
        else if (c.health < 35 && b.team !== "police") b.state = "Retreat";
        else if (b.state !== "Cover" && b.state !== "Flank") b.state = spec.slot === "melee" || b.weapon === "baton" ? "Chase" : "Engage";
      } else if (b.hostile && !sees && (b.state === "Engage" || b.state === "Cover" || b.state === "Chase" || b.state === "Flank" || b.state === "Arrest")) {
        if (g.time - b.seenT > 2) { b.state = "Search"; b.timer = 14; b.investigateX = b.seenX; b.investigateZ = b.seenZ; this.bark(c, b, "lost"); }
      }

      c.aiming = false;
      switch (b.state) {
        case "Patrol": {
          if (!b.waypoints.length) { b.state = "Guard"; break; }
          const wp = b.waypoints[b.wi];
          if (b.wait > 0) { b.wait -= dt; c.animSpeed = 0; break; }
          const left = moveToward(c, dt, wp.x, wp.z, 1.5, env);
          if (left < 0.5) { b.wi = (b.wi + 1) % b.waypoints.length; b.wait = 1.5 + this.rng.next() * 2; }
          break;
        }
        case "Guard": case "Idle": {
          c.animSpeed = 0;
          b.timer -= dt;
          if (b.timer <= 0) { b.timer = 3 + this.rng.next() * 4; b.tx = c.yaw + this.rng.range(-1.2, 1.2); }
          c.yaw += wrapAngle(b.tx - c.yaw) * Math.min(1, 1.5 * dt);
          break;
        }
        case "Investigate": {
          const left = moveToward(c, dt, b.investigateX, b.investigateZ, b.hostile ? 3.5 : 1.8, env);
          b.timer -= dt;
          if (left < 1.2) c.animSpeed = 0;
          if (b.timer <= 0) { b.state = b.waypoints.length ? "Patrol" : "Return"; b.suspicion *= 0.5; }
          break;
        }
        case "Search": {
          const left = moveToward(c, dt, b.investigateX, b.investigateZ, 3.2, env);
          b.timer -= dt;
          if (left < 1.5) { b.investigateX += this.rng.range(-12, 12); b.investigateZ += this.rng.range(-12, 12); }
          if (b.timer <= 0) b.state = "Return";
          break;
        }
        case "Return": {
          const left = moveToward(c, dt, b.homeX, b.homeZ, 1.8, env);
          if (left < 1) b.state = b.waypoints.length ? "Patrol" : "Guard";
          break;
        }
        case "Chase": {
          const target = pv ? { x: pv.x, z: pv.z } : { x: P.x, z: P.z };
          const left = moveToward(c, dt, target.x, target.z, 5.2, env);
          if ((b.weapon === "baton" || spec.slot === "melee") && left < 1.6 && b.meleeCd <= 0 && !pv) {
            b.meleeCd = 1.3;
            g.npcMelee(c, P, b.team === "security" ? 9 : 6);
          }
          if (b.team === "police" && left < 2.4 && !pv) b.state = "Arrest";
          if (b.team === "police" && b.canShoot) b.state = "Engage";
          break;
        }
        case "Arrest": {
          c.animSpeed = 0;
          c.aiming = true;
          c.yaw = Math.atan2(px - c.x, pz - c.z);
          if (d > 3.5 || pv) { b.state = "Chase"; break; }
          g.police.arrestAttempt(c);
          this.bark(c, b, "arrest");
          break;
        }
        case "Engage": case "Cover": case "Flank": {
          c.yaw = Math.atan2(px - c.x, pz - c.z);
          // choose cover periodically
          b.coverT -= dt;
          b.flankT -= dt;
          if (b.coverT <= 0) {
            b.coverT = 4 + this.rng.next() * 3;
            b.cover = this.findCover(c, px, py, pz);
            if (b.cover) b.state = "Cover";
          }
          if (b.flankT <= 0 && b.team !== "police" && this.rng.chance(0.25)) {
            b.flankT = 8;
            const side = this.rng.chance(0.5) ? 1 : -1;
            const ax = px - c.x, az = pz - c.z, L = Math.hypot(ax, az) || 1;
            b.tx = c.x + (az / L) * side * 7 + (ax / L) * 3; b.tz = c.z - (ax / L) * side * 7 + (az / L) * 3;
            b.state = "Flank"; b.timer = 3;
          }
          if (b.state === "Cover" && b.cover) {
            const left = moveToward(c, dt, b.cover.x, b.cover.z, 4.6, env);
            c.yaw = Math.atan2(px - c.x, pz - c.z);
            c.crouch = left < 0.5 && b.fireCd > 0.4;
          } else if (b.state === "Flank") {
            moveToward(c, dt, b.tx, b.tz, 4.2, env);
            c.yaw = Math.atan2(px - c.x, pz - c.z);
            b.timer -= dt;
            if (b.timer <= 0) b.state = "Engage";
          } else {
            // keep preferred distance
            if (d > spec.range * 0.6) moveToward(c, dt, px, pz, 3.4, env);
            else c.animSpeed = 0;
            c.yaw = Math.atan2(px - c.x, pz - c.z);
          }
          if (sees && b.canShoot) this.tryFire(c, b, px, py, pz, d);
          break;
        }
        case "Retreat": {
          const ax = c.x - px, az = c.z - pz, L = Math.hypot(ax, az) || 1;
          moveToward(c, dt, c.x + (ax / L) * 5, c.z + (az / L) * 5, 4.5, env);
          if (sees && b.canShoot && this.rng.chance(0.3)) this.tryFire(c, b, px, py, pz, d);
          if (d > 30 || c.health > 50) b.state = "Search";
          break;
        }
      }
    }
  }

  private tryFire(c: Character, b: CombatBrain, px: number, py: number, pz: number, d: number) {
    const spec = WEAPONS[b.weapon];
    if (spec.slot === "melee" || !spec.ammo) return;
    c.aiming = true;
    c.crouch = false;
    if (b.reload > 0 || b.fireCd > 0) return;
    if (b.mag <= 0) { b.reload = spec.reload * 1.3; return; }
    if (d > spec.range) return;
    // burst cadence
    if (b.burst <= 0) { b.burst = spec.auto ? this.rng.int(3, 6) : this.rng.int(1, 3); }
    b.burst--;
    b.fireCd = spec.interval * (spec.auto ? 1.6 : 2.2) + (b.burst === 0 ? this.rng.range(0.8, 1.6) : 0);
    b.mag--;
    const P = this.g.player;
    const moving = P.vehicle ? P.vehicle.speed : Math.hypot(P.vx, P.vz);
    const err = (1 - b.accuracy) * 0.07 + moving * 0.004 + d * 0.0008;
    const ex = px + this.rng.range(-1, 1) * err * d;
    const ey = py + this.rng.range(-0.6, 0.6) * err * d;
    const ez = pz + this.rng.range(-1, 1) * err * d;
    this.g.npcFire(c, spec, ex, ey, ez);
  }

  private findCover(c: Character, px: number, py: number, pz: number): { x: number; z: number } | null {
    const g = this.g;
    let best: { x: number; z: number } | null = null, bd = Infinity;
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2 + this.rng.next() * 0.3;
      const r = 3 + this.rng.next() * 6;
      const x = c.x + Math.sin(a) * r, z = c.z + Math.cos(a) * r;
      const y = g.groundAt(x, z);
      const res = g.world.resolveCircle(x, z, 0.4, y + 0.3, y + 1.7);
      if (res.hit) continue;
      if (g.waterAt(x, z) !== null) continue;
      const low = g.world.lineOfSight(x, y + 0.9, z, px, py, pz);
      const high = g.world.lineOfSight(x, y + 1.6, z, px, py, pz);
      if (!low && high) {
        const dd = dist2(c.x, c.z, x, z);
        if (dd < bd) { bd = dd; best = { x, z }; }
      }
    }
    return best;
  }

  alarm(c: Character, b: CombatBrain) {
    if (b.hostile) return;
    b.hostile = true;
    b.suspicion = 1;
    this.bark(c, b, "spot");
    // share with same team nearby
    for (const [id, o] of this.brains) {
      if (o.team !== b.team) continue;
      const oc = this.g.charById(id);
      if (!oc || dist2(oc.x, oc.z, c.x, c.z) > 45) continue;
      o.hostile = true;
      if (o.state === "Patrol" || o.state === "Guard") { o.state = "Investigate"; o.investigateX = b.seenX; o.investigateZ = b.seenZ; o.timer = 10; }
    }
    this.g.onAlarm(c, b.team);
  }

  onHurt(c: Character) {
    const b = this.brains.get(c.id);
    if (!b) return;
    if (b.team !== "police") { if (!b.hostile) this.alarm(c, b); }
    this.bark(c, b, "hit");
    if (b.state === "Guard" || b.state === "Patrol" || b.state === "Investigate") { b.state = "Search"; b.investigateX = this.g.player.x; b.investigateZ = this.g.player.z; b.timer = 12; }
  }

  teamCount(team: Team, tag?: string): number {
    let n = 0;
    for (const [id, b] of this.brains) {
      if (b.team !== team) continue;
      const c = this.g.charById(id);
      if (c && c.alive && c.status === "normal" && (!tag || c.tag === tag)) n++;
    }
    return n;
  }
}
