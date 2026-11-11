// server-bots: bot brains. Bots produce the same InputFrame a human client sends and go through the same
// authoritative validation. They perceive through sight cones, line of sight, audible events and damage —
// never through hidden transforms — and differ by reaction, aim noise and risk, not by health or damage.
import { AEGIS_MAX, HEALTH_MAX, ITEMS, RESERVE_MAX } from "../../shared/content/items";
import { MOVE } from "../../shared/content/rules";
import { AMMO_CAPS, WEAPONS, weaponStats, type WeaponClass } from "../../shared/content/weapons";
import { DEG, Rng, angleDiff, clamp } from "../../shared/math";
import { Btn, Mode } from "../../shared/protocol/protocol";
import type { Actor } from "../match/actor";
import type { LootEntity, Match } from "../match/match";

export type BotState =
  | "Staging" | "ChooseDrop" | "Freefall" | "Glide" | "InitialLoot" | "AssessLoadout" | "Rotate" | "SeekAdvantage"
  | "AvoidThreat" | "Engage" | "DisengageHeal" | "LootKill" | "FinalField";

const GUN_VALUE: Record<WeaponClass, number> = { rifle: 6, carbine: 5.5, smg: 5, shotgun: 5, dmr: 5.5, rail: 4.5, pistol: 3, launcher: 1.5 };
const PREF_RANGE: Record<WeaponClass, number> = { shotgun: 6, smg: 10, carbine: 18, rifle: 28, pistol: 15, dmr: 55, rail: 80, launcher: 18 };

function classScore(cls: WeaponClass, d: number): number {
  switch (cls) {
    case "shotgun": return d < 12 ? 10 : d < 20 ? 5 : 0.4;
    case "smg": return d < 18 ? 8 : d < 35 ? 5 : 1.5;
    case "carbine": return d < 40 ? 7 : 4;
    case "rifle": return d > 15 && d < 80 ? 7 : 6;
    case "dmr": return d > 35 ? 9 : 3;
    case "rail": return d > 50 ? 9 : 1.2;
    case "pistol": return 3.5;
    default: return d > 8 && d < 30 ? 2.5 : 0.4;
  }
}

export class BotBrain {
  state: BotState = "Staging";
  readonly skill: number;
  readonly risk: number;
  private path: number[] = [];
  private pathIdx = 0;
  private coarse: number[] | null = null;
  private coarseIdx = 0;
  private hasGoal = false;
  private goalX = 0;
  private goalZ = 0;
  private nextRepath = 0;
  private pathFails = 0;
  private stuck = 0;
  private lastX = 0;
  private lastZ = 0;
  private nextStuckCheck = 0;
  private unstickUntil = 0;
  private unstickDir = 1;

  enemyId = -1;
  enemyVisible = false;
  private ex = 0;
  private ey = 0;
  private ez = 0;
  private enemySeenAt = -99;
  private reactAt = 0;
  private heardAt = -99;
  private hx = 0;
  private hz = 0;

  private aimYaw = 0;
  private aimPitch = 0;
  private errYaw = 0;
  private errPitch = 0;
  private errTargetYaw = 0;
  private errTargetPitch = 0;
  private nextErr = 0;
  private burstUntil = 0;
  private pauseUntil = 0;
  private strafeDir = 1;
  private strafeUntil = 0;
  private tapAt = 0;
  private prevButtons = 0;
  private slot = 0;

  private lootId = -1;
  private lootChest = false;
  private lootX = 0;
  private lootY = 0;
  private lootZ = 0;
  private lootGiveUp = 0;
  private ignored = new Set<number>();
  private visited = new Set<number>();
  private exploreSpot = -1;
  private cacheX = 0;
  private cacheZ = 0;
  private cacheUntil = -1;

  private dropX = 0;
  private dropZ = 0;
  private dropChosen = false;
  private jumpT = 0.5;
  private nextDecision = 0;
  private rotateGoalPhase = -1;
  private coverUntil = 0;
  private wanderUntil = 0;
  private throwAt = 0;

  constructor(readonly a: Actor, private rng: Rng) {
    this.skill = rng.range(0.15, 0.95);
    this.risk = rng.range(0, 1);
    this.aimYaw = a.yaw;
  }

  // ---------------------------------------------------------------- events from the match

  onDamaged(m: Match, attacker: Actor): void {
    if (this.enemyVisible && this.enemyId !== attacker.id && m.time - this.enemySeenAt < 0.5) return;
    // damage direction is known; the exact position is not
    const d = Math.hypot(attacker.x - this.a.x, attacker.z - this.a.z);
    const fuzz = Math.min(8, d * 0.12);
    this.enemyId = attacker.id;
    this.ex = attacker.x + this.rng.range(-fuzz, fuzz);
    this.ey = attacker.y;
    this.ez = attacker.z + this.rng.range(-fuzz, fuzz);
    this.enemySeenAt = m.time - 0.4;
    this.reactAt = Math.max(this.reactAt, m.time + this.reaction() * 0.6);
    this.nextDecision = 0;
  }

  onKill(m: Match, victim: Actor): void {
    this.cacheX = victim.x;
    this.cacheZ = victim.z;
    this.cacheUntil = m.time + 30;
    if (this.enemyId === victim.id) {
      this.enemyId = -1;
      this.enemyVisible = false;
    }
  }

  private reaction(): number {
    return 0.3 + (1 - this.skill) * 0.6;
  }

  // ---------------------------------------------------------------- helpers

  private setGoal(x: number, z: number): void {
    if (this.hasGoal && Math.hypot(x - this.goalX, z - this.goalZ) < 2) return;
    this.hasGoal = true;
    this.goalX = x;
    this.goalZ = z;
    this.path = [];
    this.pathIdx = 0;
    this.coarse = null;
    this.nextRepath = 0;
    this.pathFails = 0;
  }
  private clearGoal(): void {
    this.hasGoal = false;
    this.path = [];
  }

  private moveWorld(dx: number, dz: number): void {
    const l = Math.hypot(dx, dz);
    if (l < 1e-4) return;
    dx /= l;
    dz /= l;
    const sy = Math.sin(this.aimYaw),
      cy = Math.cos(this.aimYaw);
    this.a.input.moveZ = dx * sy + dz * cy;
    this.a.input.moveX = dx * cy - dz * sy;
  }

  private turn(targetYaw: number, targetPitch: number, rate: number, dt: number): void {
    const dy = angleDiff(this.aimYaw, targetYaw);
    this.aimYaw += clamp(dy, -rate * dt, rate * dt);
    this.aimPitch += clamp(targetPitch - this.aimPitch, -rate * dt, rate * dt);
  }

  /** Follows the nav route to the goal. Returns true while still travelling. */
  private travel(m: Match, sprint: boolean, face: boolean, dt: number): boolean {
    if (!this.hasGoal) return false;
    const a = this.a;
    const nav = m.island.nav;
    const dGoal = Math.hypot(this.goalX - a.x, this.goalZ - a.z);
    if (dGoal < 1.3) {
      this.clearGoal();
      return false;
    }
    const now = m.time;
    if ((now >= this.nextRepath || this.pathIdx >= this.path.length) && m.navBudget > 0 && nav.inBounds(a.x, a.z)) {
      m.navBudget--;
      let tx = this.goalX,
        tz = this.goalZ;
      if (dGoal > 70) {
        if (!this.coarse) {
          this.coarse = nav.coarsePath(a.x, a.z, this.goalX, this.goalZ);
          this.coarseIdx = 0;
        }
        const c = this.coarse;
        if (c && c.length >= 2) {
          while (this.coarseIdx < c.length - 2 && Math.hypot(c[this.coarseIdx]! - a.x, c[this.coarseIdx + 1]! - a.z) < 26) this.coarseIdx += 2;
          const pick = Math.min(c.length - 2, this.coarseIdx + 4);
          tx = c[pick]!;
          tz = c[pick + 1]!;
        }
      }
      const p = nav.finePath(a.x, a.z, tx, tz, 7000);
      if (p) {
        this.path = p;
        this.pathIdx = 0;
        this.pathFails = 0;
      } else {
        this.pathFails++;
        this.path = [];
        this.coarse = null;
        if (this.pathFails > 3) {
          this.clearGoal();
          return false;
        }
      }
      this.nextRepath = now + 2.2 + this.rng.next() * 1.2;
    }
    let wx = this.goalX,
      wz = this.goalZ;
    while (this.pathIdx < this.path.length && Math.hypot(this.path[this.pathIdx]! - a.x, this.path[this.pathIdx + 1]! - a.z) < 0.9) this.pathIdx += 2;
    if (this.pathIdx < this.path.length) {
      wx = this.path[this.pathIdx]!;
      wz = this.path[this.pathIdx + 1]!;
    }
    let dx = wx - a.x,
      dz = wz - a.z;
    if (now < this.unstickUntil) {
      // sidestep around whatever is blocking us
      const px = -dz * this.unstickDir,
        pz = dx * this.unstickDir;
      dx = dx * 0.3 + px;
      dz = dz * 0.3 + pz;
    }
    if (face) this.turn(Math.atan2(dx, dz), 0, 7, dt);
    this.moveWorld(dx, dz);
    if (sprint && a.energy > 0.15 && a.input.moveZ > 0.5) a.input.buttons |= Btn.Sprint;
    // stuck detection
    if (now >= this.nextStuckCheck) {
      this.nextStuckCheck = now + 0.8;
      const moved = Math.hypot(a.x - this.lastX, a.z - this.lastZ);
      this.lastX = a.x;
      this.lastZ = a.z;
      if (moved < 0.5 && !a.useItem) {
        this.stuck++;
        a.input.buttons |= Btn.Jump;
        this.unstickUntil = now + 0.6;
        this.unstickDir = this.rng.chance(0.5) ? 1 : -1;
        this.nextRepath = 0;
        if (this.stuck >= 5) {
          this.stuck = 0;
          if (this.lootId >= 0) this.ignored.add(this.lootId);
          this.lootId = -1;
          this.clearGoal();
          return false;
        }
      } else this.stuck = 0;
    }
    return true;
  }

  private guns(): { idx: number; value: number; cls: WeaponClass; usable: boolean }[] {
    const out: { idx: number; value: number; cls: WeaponClass; usable: boolean }[] = [];
    this.a.slots.forEach((s, idx) => {
      if (s && s.kind === "weapon") {
        const def = WEAPONS[s.weapon];
        out.push({ idx, value: GUN_VALUE[def.cls] + s.rarity * 0.8, cls: def.cls, usable: s.mag > 0 || this.a.ammo[def.ammo] > 0 });
      }
    });
    return out;
  }

  private itemSlot(id: string): number {
    return this.a.slots.findIndex((s) => s && s.kind === "item" && s.item === id);
  }

  // ---------------------------------------------------------------- perception

  private perceive(m: Match): void {
    const a = this.a;
    const now = m.time;
    const eyeY = a.y + (a.crouch ? 1.0 : 1.55);
    let best: Actor | null = null;
    let bestScore = 1e9;
    for (const o of m.actors) {
      if (o === a || !o.alive || o.dummy || o.mode === Mode.Skiff) continue;
      const dx = o.x - a.x,
        dz = o.z - a.z;
      const d = Math.hypot(dx, dz);
      // sight range is a skill, not a cheat: 55-120 m, further only for targets that just fired
      const sight = 55 + 65 * this.skill + (now - o.lastShot < 1.5 ? 40 : 0);
      if (d > sight && o.id !== this.enemyId) continue;
      if (d > 150) continue;
      const inFov = Math.abs(angleDiff(this.aimYaw, Math.atan2(dx, dz))) < 1.15;
      const noisy = d < 10 && Math.hypot(o.vx, o.vz) > 3.2 && !o.crouch; // footsteps
      if (!inFov && !noisy) continue;
      if (d > 95 && (o.crouch || Math.hypot(o.vx, o.vz) < 0.5) && o.id !== this.enemyId) continue; // hard to spot
      const ty = o.y + (o.crouch ? 0.7 : 1.2);
      // mist clouds block sight
      let hidden = false;
      for (const mi of m.mists) {
        const vx = o.x - a.x,
          vy = ty - eyeY,
          vz = o.z - a.z;
        const l2 = vx * vx + vy * vy + vz * vz;
        const t = clamp(((mi.x - a.x) * vx + (mi.y - eyeY) * vy + (mi.z - a.z) * vz) / l2, 0, 1);
        if (Math.hypot(a.x + vx * t - mi.x, eyeY + vy * t - mi.y, a.z + vz * t - mi.z) < mi.r) {
          hidden = true;
          break;
        }
      }
      if (hidden) continue;
      if (!m.world.lineClear(a.x, eyeY, a.z, o.x, ty, o.z)) continue;
      const score = d - (o.id === this.enemyId ? 18 : 0);
      if (score < bestScore) {
        bestScore = score;
        best = o;
      }
    }
    if (best) {
      if (this.enemyId !== best.id || !this.enemyVisible) {
        const d = Math.hypot(best.x - a.x, best.z - a.z);
        this.reactAt = Math.max(this.reactAt, now + this.reaction() + d * 0.002);
      }
      this.enemyId = best.id;
      this.enemyVisible = true;
      this.ex = best.x;
      this.ey = best.y;
      this.ez = best.z;
      this.enemySeenAt = now;
    } else {
      this.enemyVisible = false;
      if (now - this.enemySeenAt > 7) this.enemyId = -1;
    }
    // audible gunfire gives a rough bearing
    if (!this.enemyVisible) {
      for (const n of m.noises) {
        if (n.actor === a.id) continue;
        const d = Math.hypot(n.x - a.x, n.z - a.z);
        if (d > n.r * 0.55) continue;
        this.heardAt = now;
        this.hx = n.x + this.rng.range(-0.15, 0.15) * d;
        this.hz = n.z + this.rng.range(-0.15, 0.15) * d;
      }
    }
  }

  // ---------------------------------------------------------------- loot

  private lootValue(l: LootEntity): number {
    const a = this.a;
    if (this.ignored.has(l.id)) return 0;
    if (l.kind === "ammo") {
      const uses = this.a.slots.some((s) => s && s.kind === "weapon" && WEAPONS[s.weapon].ammo === l.ammo);
      const have = a.ammo[l.ammo!];
      if (have >= AMMO_CAPS[l.ammo!]) return 0;
      return uses ? (have < AMMO_CAPS[l.ammo!] * 0.4 ? 30 : 10) : 3;
    }
    const free = a.slots.some((s) => s === null);
    if (l.kind === "weapon") {
      const g = this.guns();
      const def = WEAPONS[l.weapon!];
      const v = GUN_VALUE[def.cls] + (l.rarity ?? 0) * 0.8;
      if (!g.length) return 100;
      const same = g.find((q) => q.cls === def.cls);
      if (same) return v > same.value + 0.5 ? 26 : 0;
      if (g.length < 2 && free) return 45;
      if (g.length < 3 && free) return 14;
      const worst = g.reduce((p, q) => (q.value < p.value ? q : p));
      return v > worst.value + 1 ? 18 : 0;
    }
    const def = ITEMS[l.item!];
    const have = a.slots.find((s) => s && s.kind === "item" && s.item === l.item);
    if (have && have.kind === "item" && have.count >= def.stack) return 0;
    if (!have && !free) return 0;
    if (def.kind === "heal") return 28;
    if (def.kind === "shield") return 28;
    return 7;
  }

  private chooseLoot(m: Match): boolean {
    const a = this.a;
    const nav = m.island.nav;
    let bestV = 0;
    let bx = 0,
      by = 0,
      bz = 0,
      bid = -1,
      bChest = false;
    const reachable = (x: number, y: number, z: number): boolean => {
      const p = nav.nearestWalkable(x, z, 2);
      return !!p && Math.abs(nav.heightAt(p[0], p[1]) - y) < 1.4;
    };
    for (const l of m.loot.values()) {
      const dx = l.x - a.x,
        dz = l.z - a.z;
      if (Math.abs(dx) > 42 || Math.abs(dz) > 42) continue;
      const v = this.lootValue(l);
      if (v <= 0) continue;
      const d = Math.hypot(dx, dz) + Math.abs(l.y - a.y) * 3;
      const score = v / (d + 6);
      if (score > bestV && reachable(l.x, l.y, l.z)) {
        bestV = score;
        bx = l.x;
        by = l.y;
        bz = l.z;
        bid = l.id;
        bChest = false;
      }
    }
    const noGun = !this.guns().length;
    for (const c of m.chests) {
      if (c.open || this.ignored.has(c.id)) continue;
      const dx = c.x - a.x,
        dz = c.z - a.z;
      if (Math.abs(dx) > 60 || Math.abs(dz) > 60) continue;
      const d = Math.hypot(dx, dz) + Math.abs(c.y - a.y) * 3;
      const score = (noGun ? 70 : c.kind === "capsule" || c.kind === "vault" ? 60 : 40) / (d + 6);
      if (score > bestV && reachable(c.x, c.y, c.z)) {
        bestV = score;
        bx = c.x;
        by = c.y;
        bz = c.z;
        bid = c.id;
        bChest = true;
      }
    }
    if (bid < 0) return false;
    this.lootId = bid;
    this.lootChest = bChest;
    this.lootX = bx;
    this.lootY = by;
    this.lootZ = bz;
    this.lootGiveUp = m.time + 14;
    return true;
  }

  private takeLoot(m: Match): void {
    const a = this.a;
    if (this.lootChest) {
      m.openChest(a, this.lootId);
      this.ignored.add(this.lootId);
      return;
    }
    const l = m.loot.get(this.lootId);
    if (!l) return;
    if (l.kind === "weapon" && !a.slots.some((s) => s === null)) {
      const g = this.guns();
      if (g.length) {
        const worst = g.reduce((p, q) => (q.value < p.value ? q : p));
        m.selectSlot(a, worst.idx);
        this.slot = worst.idx;
      }
      if (!m.pickup(a, l.id, true)) this.ignored.add(l.id);
      return;
    }
    if (l.kind === "weapon") {
      const def = WEAPONS[l.weapon!];
      const same = this.guns().find((q) => q.cls === def.cls);
      if (same) {
        m.selectSlot(a, same.idx);
        m.dropSlot(a, same.idx);
      }
    }
    if (!m.pickup(a, l.id, false)) this.ignored.add(l.id);
  }

  private exploreNext(m: Match): boolean {
    const a = this.a;
    let best = -1,
      bd = 150;
    const spots = m.island.buildingSpots;
    for (let i = 0; i < spots.length; i++) {
      if (this.visited.has(i)) continue;
      const s = spots[i]!;
      const d = Math.hypot(s.x - a.x, s.z - a.z);
      if (d < bd && !m.storm.outside(s.x, s.z)) {
        bd = d;
        best = i;
      }
    }
    if (best < 0) return false;
    this.exploreSpot = best;
    const s = spots[best]!;
    const p = m.island.nav.nearestWalkable(s.x, s.z, 9);
    if (!p) {
      this.visited.add(best);
      return false;
    }
    this.setGoal(p[0], p[1]);
    return true;
  }

  // ---------------------------------------------------------------- drop

  private chooseDrop(m: Match): void {
    const s = m.skiff;
    const dx = s.bx - s.ax,
      dz = s.bz - s.az;
    const len = Math.hypot(dx, dz);
    const locs = m.island.locations;
    const pick = this.rng.weighted(locs, (l) => {
      const t = clamp(((l.x - s.ax) * dx + (l.z - s.az) * dz) / (len * len), 0, 1);
      const perp = Math.hypot(l.x - (s.ax + dx * t), l.z - (s.az + dz * t));
      const reach = perp < 380 ? 1 : perp < 520 ? 0.3 : 0.05;
      const density = (l.named ? 2.2 : 1) * (0.6 + l.tier * 0.4);
      return Math.pow(density, 0.5 + this.risk) * reach;
    });
    const spots = m.island.buildingSpots.filter((b) => b.loc === pick.idx);
    const spot = spots.length ? this.rng.pick(spots) : { x: pick.x, z: pick.z };
    const p = m.island.nav.nearestWalkable(spot.x + this.rng.range(-7, 7), spot.z + this.rng.range(-7, 7), 12) ?? [pick.x, pick.z];
    this.dropX = p[0];
    this.dropZ = p[1];
    const t = clamp(((this.dropX - s.ax) * dx + (this.dropZ - s.az) * dz) / (len * len), 0, 1);
    this.jumpT = t - this.rng.range(0.0, 0.06);
    this.dropChosen = true;
    this.state = "ChooseDrop";
  }

  private thinkAir(m: Match, dt: number): void {
    const a = this.a;
    const dx = this.dropX - a.x,
      dz = this.dropZ - a.z;
    const d = Math.hypot(dx, dz);
    const ground = Math.max(0, m.world.terrain(a.x, a.z));
    const h = a.y - ground;
    const yaw = Math.atan2(dx, dz);
    if (a.mode === Mode.Freefall) {
      this.state = "Freefall";
      const reachFromHere = 110 + Math.max(0, h - MOVE.autoDeployHeight) * 0.45 + 200;
      this.turn(yaw, d < 70 ? -1.2 : -0.35, 5, dt);
      a.input.moveZ = d > 6 ? 1 : 0;
      if (d > reachFromHere) a.input.buttons |= Btn.Sail; // deploy early to cover distance
    } else {
      this.state = "Glide";
      const tooHigh = h > d * 0.55 + 8;
      this.turn(yaw, tooHigh ? -1.15 : 0, 4, dt);
      a.input.moveZ = d < 9 ? -1 : 1;
      if (d < 4) a.input.moveZ = -1;
    }
  }

  // ---------------------------------------------------------------- ground decisions

  private decide(m: Match): void {
    const a = this.a;
    const now = m.time;
    const st = m.storm;
    const guns = this.guns();
    const hasGun = guns.some((g) => g.usable);
    const hp = a.health + a.aegis + a.reserve;
    const next = st.nextField();
    const dNext = Math.hypot(a.x - next.x, a.z - next.z) - next.r * 0.8;
    const inStorm = st.started && st.dps > 0 && st.outside(a.x, a.z);
    const margin = 14 + (1 - this.risk) * 26;
    const mustRotate = inStorm || (st.started && dNext > 0 && (st.state === "shrink" || st.timer < dNext / 5 + margin));
    const enemyKnown = this.enemyId >= 0 && now - this.enemySeenAt < 5;
    const dEnemy = enemyKnown ? Math.hypot(this.ex - a.x, this.ez - a.z) : 999;
    const recentlyHit = now - a.lastDamage < 2.5;
    let gunRange = 0;
    for (const s of a.slots) if (s && s.kind === "weapon" && (s.mag > 0 || a.ammo[WEAPONS[s.weapon].ammo] > 0)) gunRange = Math.max(gunRange, weaponStats(s.weapon, s.rarity).falloffEnd);
    const engageRange = clamp(gunRange * 1.1, 22, 115);
    // early on, cautious bots avoid optional long fights; late game everyone commits
    // Pacing: while the lobby is thinner than this storm phase expects, bots stop picking optional fights with
    // each other (they still defend themselves, fight at close range, and always contest human players).
    const enemyActor = enemyKnown ? m.actors[this.enemyId] : undefined;
    const vsHuman = !!enemyActor && !enemyActor.bot;
    const calm = !vsHuman && !m.pressure;
    const cautious = st.phase <= 1 && this.risk < 0.55 && m.aliveCount > 6;
    const wantsFight = recentlyHit || dEnemy <= (calm ? 9 : cautious ? Math.min(32, engageRange) : engageRange);
    const canHeal = (a.health < 62 && (this.itemSlot("injector") >= 0 || this.itemSlot("trauma") >= 0)) || (a.reserve < 26 && this.itemSlot("flask") >= 0) || (a.aegis < 15 && this.itemSlot("cell") >= 0 && a.health < 80);

    if (inStorm && st.dps >= 4 && !(this.enemyVisible && dEnemy < 25)) {
      this.state = "Rotate";
    } else if (enemyKnown && hasGun && wantsFight && (this.enemyVisible || now - this.enemySeenAt < 2.5 || recentlyHit)) {
      if (hp < 60 && canHeal && (dEnemy > 22 || !this.enemyVisible)) this.state = "DisengageHeal";
      else this.state = st.phase >= 5 ? "FinalField" : "Engage";
    } else if (enemyKnown && this.enemyVisible && ((!hasGun && dEnemy < 60) || (calm && dEnemy < 45))) {
      // unarmed, or not looking for a fight right now: give the other player space
      this.state = "AvoidThreat";
    } else if (canHeal && !recentlyHit) {
      this.state = "DisengageHeal";
    } else if (mustRotate) {
      this.state = "Rotate";
    } else if (this.cacheUntil > now && Math.hypot(this.cacheX - a.x, this.cacheZ - a.z) < 70) {
      this.state = "LootKill";
    } else if (!hasGun) {
      this.state = "InitialLoot";
    } else if (st.phase >= 5) {
      this.state = "FinalField";
    } else {
      const needs = guns.length < 2 || (this.itemSlot("injector") < 0 && this.itemSlot("trauma") < 0) || this.itemSlot("flask") < 0;
      const endgame = st.phase >= 3 || m.aliveCount <= 4;
      if (needs && (this.lootId >= 0 || this.chooseLoot(m))) this.state = "AssessLoadout";
      else if (dNext > 0) this.state = "Rotate";
      else this.state = needs && !endgame ? "AssessLoadout" : "SeekAdvantage";
    }
  }

  private pickWeapon(dist: number): void {
    let best = -1,
      bs = 0;
    for (const g of this.guns()) {
      if (!g.usable) continue;
      const s = classScore(g.cls, dist) + g.value * 0.15;
      if (s > bs) {
        bs = s;
        best = g.idx;
      }
    }
    if (best >= 0) this.slot = best;
  }

  private actLoot(m: Match, dt: number): void {
    const a = this.a;
    const now = m.time;
    if (this.lootId >= 0) {
      const exists = this.lootChest ? m.chests.some((c) => c.id === this.lootId && !c.open) : m.loot.has(this.lootId);
      if (!exists || now > this.lootGiveUp) {
        if (exists) this.ignored.add(this.lootId);
        this.lootId = -1;
        this.clearGoal();
      }
    }
    if (this.lootId < 0 && !this.chooseLoot(m)) {
      // nothing in sight: sweep the next unexplored building
      if (!this.hasGoal) {
        if (this.exploreSpot >= 0) {
          this.visited.add(this.exploreSpot);
          this.exploreSpot = -1;
        }
        if (!this.exploreNext(m)) {
          const f = m.storm.nextField();
          this.wander(m, f.x, f.z, Math.max(20, f.r * 0.5));
        }
      }
      this.travel(m, true, true, dt);
      return;
    }
    const d = Math.hypot(this.lootX - a.x, this.lootZ - a.z);
    if (d < 1.9 && Math.abs(this.lootY - a.y) < 1.8) {
      this.takeLoot(m);
      this.lootId = -1;
      this.clearGoal();
      return;
    }
    this.setGoal(this.lootX, this.lootZ);
    if (!this.travel(m, d > 12, true, dt) && d >= 1.9) {
      // nav says we're there but we are not in reach: walk straight at it
      this.turn(Math.atan2(this.lootX - a.x, this.lootZ - a.z), 0, 7, dt);
      this.moveWorld(this.lootX - a.x, this.lootZ - a.z);
    }
  }

  private wander(m: Match, cx: number, cz: number, r: number): void {
    for (let i = 0; i < 6; i++) {
      const ang = this.rng.range(0, Math.PI * 2),
        rr = Math.sqrt(this.rng.next()) * r;
      const p = m.island.nav.nearestWalkable(cx + Math.sin(ang) * rr, cz + Math.cos(ang) * rr, 10);
      if (p) {
        this.setGoal(p[0], p[1]);
        this.wanderUntil = m.time + 12;
        return;
      }
    }
  }

  private actRotate(m: Match, dt: number): void {
    const st = m.storm;
    const f = st.nextField();
    const key = st.phase * 10 + (st.state === "calm" ? 0 : 1);
    const dGoalField = Math.hypot(this.goalX - f.x, this.goalZ - f.z);
    if (this.rotateGoalPhase !== key || !this.hasGoal || dGoalField > f.r * 0.8) {
      this.rotateGoalPhase = key;
      this.wander(m, f.x, f.z, Math.max(8, f.r * 0.55));
    }
    if (!this.travel(m, true, true, dt)) this.state = "SeekAdvantage";
  }

  private actHeal(m: Match, dt: number): void {
    const a = this.a;
    const now = m.time;
    // break line of sight first if a threat was seen recently
    const threat = this.enemyId >= 0 && now - this.enemySeenAt < 4;
    if (threat && now > this.coverUntil && !a.useItem) {
      this.coverUntil = now + 3;
      let best: [number, number] | null = null;
      let bd = 1e9;
      for (let i = 0; i < 10; i++) {
        const ang = this.rng.range(0, Math.PI * 2),
          r = this.rng.range(5, 15);
        const p = m.island.nav.nearestWalkable(a.x + Math.sin(ang) * r, a.z + Math.cos(ang) * r, 3);
        if (!p) continue;
        const py = m.island.nav.heightAt(p[0], p[1]);
        if (m.world.lineClear(p[0], py + 1.3, p[1], this.ex, this.ey + 1.3, this.ez)) continue;
        const d = Math.hypot(p[0] - a.x, p[1] - a.z);
        if (d < bd) {
          bd = d;
          best = p;
        }
      }
      if (best) this.setGoal(best[0], best[1]);
      else {
        // no cover: back away from the threat
        const dx = a.x - this.ex,
          dz = a.z - this.ez,
          l = Math.hypot(dx, dz) || 1;
        const p = m.island.nav.nearestWalkable(a.x + (dx / l) * 18, a.z + (dz / l) * 18, 6);
        if (p) this.setGoal(p[0], p[1]);
      }
    }
    if (threat && this.hasGoal && this.travel(m, true, true, dt)) return;
    // choose what to use
    let want = -1;
    if (a.health < 45 && this.itemSlot("trauma") >= 0 && !threat) want = this.itemSlot("trauma");
    else if (a.health < 66 && this.itemSlot("injector") >= 0) want = this.itemSlot("injector");
    else if (a.health < 66 && this.itemSlot("trauma") >= 0) want = this.itemSlot("trauma");
    else if (a.reserve < RESERVE_MAX - 24 && this.itemSlot("flask") >= 0) want = this.itemSlot("flask");
    else if (a.aegis < AEGIS_MAX * 0.4 && this.itemSlot("cell") >= 0) want = this.itemSlot("cell");
    if (want < 0) {
      this.nextDecision = 0;
      return;
    }
    this.slot = want;
    a.input.buttons |= Btn.Crouch;
    if (a.selected === want && !a.useItem && now >= a.equipUntil && now >= this.tapAt) {
      a.input.buttons |= Btn.Fire;
      this.tapAt = now + 0.4;
    }
  }

  private actEngage(m: Match, dt: number): void {
    const a = this.a;
    const now = m.time;
    const enemy = m.actors[this.enemyId];
    if (!enemy || !enemy.alive) {
      this.enemyId = -1;
      this.enemyVisible = false;
      this.nextDecision = 0;
      return;
    }
    if (this.enemyVisible) {
      // visible targets are tracked continuously between perception ticks
      this.ex = enemy.x;
      this.ey = enemy.y;
      this.ez = enemy.z;
    }
    const dx = this.ex - a.x,
      dz = this.ez - a.z;
    const dist = Math.hypot(dx, dz);
    this.pickWeapon(dist);
    const slot = a.slots[this.slot];
    const cls: WeaponClass = slot && slot.kind === "weapon" ? WEAPONS[slot.weapon].cls : "pistol";
    const st = slot && slot.kind === "weapon" ? weaponStats(slot.weapon, slot.rarity) : null;

    // aim: perceived target + slowly varying human-like error, partially compensating recoil
    if (now >= this.nextErr) {
      this.nextErr = now + 0.3 + this.rng.next() * 0.3;
      const speed = Math.hypot(enemy.vx, enemy.vz);
      const sigma = (0.018 + (1 - this.skill) * 0.05) * (1 + speed / 5) * (this.enemyVisible ? 1 : 2);
      this.errTargetYaw = this.rng.gauss() * sigma;
      this.errTargetPitch = this.rng.gauss() * sigma * 0.6;
    }
    this.errYaw += (this.errTargetYaw - this.errYaw) * Math.min(1, dt * 4);
    this.errPitch += (this.errTargetPitch - this.errPitch) * Math.min(1, dt * 4);
    const eyeY = a.y + (a.crouch ? MOVE.eyeCrouch : MOVE.eye) + 0.35;
    const aimH = enemy.crouch ? 0.75 : 1.15 + this.skill * 0.25;
    const ty = this.ey + aimH - eyeY;
    const comp = 0.45 + this.skill * 0.45;
    const wantYaw = Math.atan2(dx, dz) + this.errYaw - a.recoilY * DEG * comp;
    const wantPitch = Math.atan2(ty, dist) + this.errPitch - a.recoilP * DEG * comp;
    this.turn(wantYaw, wantPitch, (3.5 + this.skill * 5) * (this.enemyVisible ? 1 : 0.6), dt);

    // fire control
    const yawErr = Math.abs(angleDiff(this.aimYaw, wantYaw));
    const tol = Math.max(0.035, Math.atan2(0.75, dist));
    const ready = this.enemyVisible && now >= this.reactAt && yawErr < tol && a.selected === this.slot && st !== null;
    if (ready && st) {
      if (dist > st.def.falloffEnd * 1.4 && cls !== "dmr" && cls !== "rail") {
        // out of effective range: hold fire, close in
      } else if (st.def.auto) {
        if (now > this.pauseUntil) {
          if (now > this.burstUntil) {
            this.burstUntil = now + 0.35 + this.rng.next() * 0.6;
            this.pauseUntil = this.burstUntil + 0.12 + this.rng.next() * (0.5 - this.skill * 0.3);
          }
        }
        if (now <= this.burstUntil) a.input.buttons |= Btn.Fire;
      } else if (now >= this.tapAt) {
        a.input.buttons |= Btn.Fire;
        this.tapAt = now + Math.max(st.interval + 0.03, 0.16 + this.rng.next() * (0.35 - this.skill * 0.15));
      }
      if (dist > 22 && cls !== "shotgun" && cls !== "smg") a.input.buttons |= Btn.Ads;
    }
    if (slot && slot.kind === "weapon" && !this.enemyVisible && slot.mag < weaponStats(slot.weapon, slot.rarity).mag * 0.4 && a.reloadEnd < 0) a.input.buttons |= Btn.Reload;

    // occasional utility: flush a hidden enemy with a wind orb
    const orb = this.itemSlot("orb");
    if (orb >= 0 && !this.enemyVisible && now - this.enemySeenAt > 1.2 && now - this.enemySeenAt < 4 && dist > 7 && dist < 28 && now > this.throwAt) {
      this.slot = orb;
      if (a.selected === orb && now >= a.equipUntil) {
        this.aimPitch = Math.atan2(ty, dist) + 0.12 + dist * 0.008;
        a.input.buttons |= Btn.Fire;
        this.throwAt = now + 9;
      }
    }

    // movement: hold preferred range, strafe, push last known position when sight is lost
    const pref = PREF_RANGE[cls];
    if (!this.enemyVisible && now - this.enemySeenAt > 1.0) {
      this.setGoal(this.ex, this.ez);
      this.travel(m, false, false, dt);
      return;
    }
    if (now > this.strafeUntil) {
      this.strafeUntil = now + 0.5 + this.rng.next() * 1.1;
      this.strafeDir = this.rng.chance(0.5) ? 1 : -1;
    }
    let fwd = 0;
    if (dist > pref + 8) fwd = 1;
    else if (dist < pref * 0.55) fwd = -0.8;
    if (dist > 60 && pref < 40) {
      // long approach: use the nav route rather than running into walls
      this.setGoal(this.ex, this.ez);
      this.travel(m, true, false, dt);
      return;
    }
    a.input.moveZ = fwd;
    a.input.moveX = this.strafeDir * (0.55 + this.skill * 0.45);
    if (this.skill > 0.6 && dist < 14 && this.rng.chance(0.012)) a.input.buttons |= Btn.Jump;
    if (dist > 45 && this.enemyVisible && this.rng.chance(0.3)) a.input.buttons |= Btn.Crouch;
  }

  private actFlee(m: Match, dt: number): void {
    const a = this.a;
    if (!this.hasGoal) {
      const dx = a.x - this.ex,
        dz = a.z - this.ez,
        l = Math.hypot(dx, dz) || 1;
      const ang = Math.atan2(dx, dz) + this.rng.range(-0.7, 0.7);
      let p = m.island.nav.nearestWalkable(a.x + Math.sin(ang) * 32, a.z + Math.cos(ang) * 32, 8);
      if (p && m.storm.started && m.storm.outside(p[0], p[1])) {
        // never flee into the Riftstorm: sidestep toward the field instead
        const f = m.storm.nextField();
        const tx = f.x - a.x,
          tz = f.z - a.z,
          tl = Math.hypot(tx, tz) || 1;
        p = m.island.nav.nearestWalkable(a.x + (tx / tl) * 30, a.z + (tz / tl) * 30, 8);
      }
      if (p) this.setGoal(p[0], p[1]);
      else this.moveWorld(dx / l, dz / l);
    }
    this.travel(m, true, true, dt);
    if (!this.guns().length && this.chooseLoot(m) && this.lootValue(m.loot.get(this.lootId) ?? ({ id: -9, kind: "ammo", ammo: "light", count: 0, x: 0, y: 0, z: 0 } as LootEntity)) >= 100) this.state = "InitialLoot";
  }

  private thinkGround(m: Match, dt: number): void {
    const a = this.a;
    const now = m.time;
    if ((m.tick + a.id * 3) % 5 === 0) this.perceive(m);
    if (now >= this.nextDecision) {
      this.nextDecision = now + 0.3;
      const prev = this.state;
      this.decide(m);
      if (prev !== this.state && this.state !== "Engage" && this.state !== "FinalField") this.clearGoal();
    }
    switch (this.state) {
      case "Engage":
        this.actEngage(m, dt);
        break;
      case "FinalField":
        if (this.enemyId >= 0 && now - this.enemySeenAt < 5 && this.guns().some((g) => g.usable)) this.actEngage(m, dt);
        else {
          const st = m.storm;
          if (!this.hasGoal || st.outside(this.goalX, this.goalZ)) this.wander(m, st.cx, st.cz, Math.max(4, st.r * 0.6));
          if (!this.travel(m, st.outside(a.x, a.z), true, dt)) {
            a.input.buttons |= Btn.Crouch;
            this.turn(this.aimYaw + 0.9 * dt * (a.id % 2 ? 1 : -1), 0, 3, dt);
          }
        }
        break;
      case "DisengageHeal":
        this.actHeal(m, dt);
        break;
      case "AvoidThreat":
        this.actFlee(m, dt);
        break;
      case "Rotate":
        this.actRotate(m, dt);
        break;
      case "LootKill": {
        const d = Math.hypot(this.cacheX - a.x, this.cacheZ - a.z);
        if (d < 2.2) {
          const c = m.chests.find((q) => q.kind === "cache" && !q.open && Math.hypot(q.x - a.x, q.z - a.z) < 3.2);
          if (c) m.openChest(a, c.id);
          this.cacheUntil = -1;
          this.nextDecision = 0;
        } else {
          this.setGoal(this.cacheX, this.cacheZ);
          if (!this.travel(m, true, true, dt)) this.cacheUntil = -1;
        }
        break;
      }
      case "InitialLoot":
      case "AssessLoadout":
        this.actLoot(m, dt);
        break;
      default: {
        // SeekAdvantage: drift toward recent gunfire if bold, otherwise patrol inside the next field
        if (!this.hasGoal) {
          if (now - this.heardAt < 6 && this.risk > 0.45 && m.pressure) {
            const p = m.island.nav.nearestWalkable(this.hx, this.hz, 10);
            if (p) this.setGoal(p[0], p[1]);
          } else {
            // with few players left, sweep the heart of the field so the endgame resolves by combat
            const f = m.storm.nextField();
            const hunt = m.aliveCount <= 4 || m.storm.phase >= 3;
            this.wander(m, f.x, f.z, Math.max(10, f.r * (hunt ? 0.4 : 0.6)));
          }
        }
        if (!this.travel(m, false, true, dt)) this.turn(this.aimYaw + 1.2 * dt, 0, 3, dt);
        // opportunistic looting on the way
        if ((m.tick + a.id) % 45 === 0 && this.chooseLoot(m)) this.state = "AssessLoadout";
      }
    }
    // keep a gun in hand when not healing
    if (this.state !== "DisengageHeal" && this.state !== "Engage" && this.state !== "FinalField") {
      const cur = a.slots[this.slot];
      if (!cur || cur.kind !== "weapon") this.pickWeapon(30);
      if (a.slots[this.slot]?.kind === "weapon") {
        const s = a.slots[this.slot]!;
        if (s.kind === "weapon" && s.mag < weaponStats(s.weapon, s.rarity).mag && a.reloadEnd < 0 && a.ammo[WEAPONS[s.weapon].ammo] > 0 && (m.tick + a.id) % 30 === 0) a.input.buttons |= Btn.Reload;
      }
    }
    void HEALTH_MAX;
  }

  private thinkStaging(m: Match, dt: number): void {
    const a = this.a;
    const pier = m.island.pier;
    if (!this.hasGoal || m.time > this.wanderUntil) {
      this.hasGoal = true;
      this.goalX = pier.x + this.rng.range(-30, 30);
      this.goalZ = pier.z + this.rng.range(-14, 20);
      this.wanderUntil = m.time + this.rng.range(2, 6);
    }
    const dx = this.goalX - a.x,
      dz = this.goalZ - a.z;
    if (Math.hypot(dx, dz) > 1.2) {
      this.turn(Math.atan2(dx, dz), 0, 5, dt);
      this.moveWorld(dx, dz);
      if (this.rng.chance(0.01)) a.input.buttons |= Btn.Jump;
    } else this.turn(this.aimYaw + dt * 0.8, 0, 3, dt);
  }

  // ---------------------------------------------------------------- entry point

  think(m: Match): void {
    const a = this.a;
    const inp = a.input;
    const dt = 1 / 30;
    inp.moveX = 0;
    inp.moveZ = 0;
    inp.buttons = 0;
    inp.shoulder = 1;
    inp.viewTime = m.time;
    if (m.phase === "staging") {
      this.state = "Staging";
      this.thinkStaging(m, dt);
    } else if (a.mode === Mode.Skiff) {
      if (!this.dropChosen) {
        this.hasGoal = false;
        this.chooseDrop(m);
      }
      if (m.canJump && m.skiff.t >= this.jumpT) inp.buttons |= Btn.Jump;
    } else if (a.mode === Mode.Freefall || a.mode === Mode.Glide) {
      if (!this.dropChosen) this.chooseDrop(m);
      this.thinkAir(m, dt);
    } else {
      if (this.state === "Freefall" || this.state === "Glide" || this.state === "ChooseDrop" || this.state === "Staging") {
        this.state = "InitialLoot";
        this.clearGoal();
        this.lastX = a.x;
        this.lastZ = a.z;
      }
      this.thinkGround(m, dt);
    }
    inp.yaw = this.aimYaw;
    inp.pitch = clamp(this.aimPitch, -1.4, 1.4);
    inp.slot = this.slot;
    inp.pressed = inp.buttons & ~this.prevButtons;
    this.prevButtons = inp.buttons;
    inp.seq++;
  }
}
