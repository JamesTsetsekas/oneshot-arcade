// Server-side bots. They produce the same InputCommands as humans and only use
// perceivable information: vision cones with occlusion + obscurant, heard noises,
// recent damage, team radar/pings and their own memory. Difficulty changes reaction,
// aim noise, turn rate, bursts, prediction and route diversity — never health or damage.
import type { Room, Player } from "./room";
import { InputCommand, BTN } from "../shared/protocol";
import { Vec3, Rng, vsub, vdist, vdist2d, wrapAngle, DEG, clamp, yawPitchTo, flatForward, flatRight, vlen } from "../shared/math";
import { findPath, nearestNode, mainNodes, NavNode } from "./nav";
import { WEAPONS } from "../content/weapons";
import { EQUIPMENT } from "../content/items";
import { zoneAt } from "../content/map-k17";

export type BotDifficulty = "easy" | "normal" | "hard";
interface Skill { reaction: number; aimNoise: number; turnRate: number; burst: [number, number]; predict: number; diversity: number; headChance: number; viewRange: number; strafe: number; teamwork: number; equipUse: number }
export const SKILLS: Record<BotDifficulty, Skill> = {
  easy: { reaction: 0.62, aimNoise: 3.6, turnRate: 200, burst: [3, 6], predict: 0, diversity: 0.2, headChance: 0.05, viewRange: 55, strafe: 0.3, teamwork: 0.2, equipUse: 0.25 },
  normal: { reaction: 0.36, aimNoise: 2.0, turnRate: 340, burst: [5, 9], predict: 0.5, diversity: 0.45, headChance: 0.15, viewRange: 75, strafe: 0.6, teamwork: 0.5, equipUse: 0.5 },
  hard: { reaction: 0.22, aimNoise: 1.15, turnRate: 520, burst: [7, 13], predict: 0.9, diversity: 0.7, headChance: 0.3, viewRange: 90, strafe: 0.85, teamwork: 0.8, equipUse: 0.8 },
};

type Strategic = "spawn" | "route" | "seek" | "hold" | "push" | "flank" | "regroup" | "support" | "retreat";
interface Memory { pos: Vec3; t: number; seen: boolean }

const LANES = [
  { name: "north", z: [24, 44], y: 2.4 },
  { name: "center", z: [-8, 12], y: 0 },
  { name: "south", z: [-44, -24], y: 0 },
  { name: "tunnel", z: [-12.5, -10.5], y: -3.2 },
];

export class BotBrain {
  id: number;
  skill: Skill;
  rng: Rng;
  difficulty: BotDifficulty;
  state: Strategic = "spawn";
  yaw = 0; pitch = 0;
  path: number[] = []; pathIdx = 0; goal: Vec3 | null = null; repathAt = 0;
  target: number | null = null; acquiredAt = 0; trackStart = 0;
  memory = new Map<number, Memory>();
  nextPerceive = 0;
  burstLeft = 0; burstPauseUntil = 0;
  strafeDir = 1; strafeUntil = 0;
  crouchUntil = 0;
  lastPos: Vec3 = { x: 0, y: 0, z: 0 }; stuckT = 0; jumpT = 0;
  holdUntil = 0; holdYaw = 0;
  slot: 0 | 1 = 0;
  noise = { x: 0, y: 0 }; noiseT = 0;
  lane = 1;
  flashed = 0;
  lethalHold = 0; lethalWant = 0; tacticalPress = 0; deployPress = 0; supportCooldown = 0; equipCooldown = 0;
  aimOverride: { yaw: number; pitch: number; until: number } | null = null;
  reloadPress = 0;
  stateUntil = 0;
  pendingRecoil = { pitch: 0, yaw: 0 };
  seq = 0;
  droneTarget: number | null = null;
  heardDir: Vec3 | null = null;
  debugReason = "";

  constructor(id: number, difficulty: BotDifficulty, rng: Rng) {
    this.id = id; this.difficulty = difficulty; this.skill = SKILLS[difficulty]; this.rng = rng;
    this.lane = rng.int(0, LANES.length);
  }

  onSpawn(room: Room, p: Player) {
    this.state = "spawn"; this.yaw = p.yaw; this.pitch = 0; this.path = []; this.goal = null; this.target = null;
    this.memory.clear(); this.burstLeft = 0; this.slot = 0; this.flashed = 0; this.stuckT = 0; this.lastPos = { ...p.move.pos };
    this.lethalHold = 0; this.lethalWant = 0; this.aimOverride = null; this.droneTarget = null;
    this.stateUntil = room.time + this.rng.range(0.2, 0.8);
    // route diversity: re-roll lane, avoiding the lane where we died most
    if (this.rng.chance(this.skill.diversity)) this.lane = this.rng.int(0, LANES.length);
  }
  onDeath(_room: Room, _p: Player) { this.target = null; }
  onFlashed(amount: number) { this.flashed = Math.max(this.flashed, amount * 3.2); }
  onRecoil(kick: { pitch: number; yaw: number }) { this.pendingRecoil.pitch += kick.pitch; this.pendingRecoil.yaw += kick.yaw; }
  onDamaged(room: Room, p: Player, attacker: Player | null) {
    if (!attacker || attacker === p) return;
    // Damage reveals the direction of the attacker (as the hit indicator does for humans).
    const m = this.memory.get(attacker.id);
    this.memory.set(attacker.id, { pos: { ...attacker.move.pos }, t: room.time, seen: m?.seen ?? false });
    if (this.target === null) { this.heardDir = { ...attacker.move.pos }; }
  }

  private eye(p: Player) { return { x: p.move.pos.x, y: p.move.pos.y + (p.move.crouch ? 1.15 : 1.68), z: p.move.pos.z }; }

  /** Vision cone + occlusion + obscurant + flash. No wall vision. */
  canSee(room: Room, p: Player, o: Player): boolean {
    if (this.flashed > 0.4) return false;
    const e = this.eye(p);
    const c = room.chest(o);
    const d = vdist(e, c);
    if (d > this.skill.viewRange) return false;
    const to = yawPitchTo(e, c);
    const dyaw = Math.abs(wrapAngle(to.yaw - this.yaw));
    const fov = (this.target === o.id ? 140 : 115) * DEG / 2;
    if (dyaw > fov && d > 2.5) return false;
    return room.sightClear(e, c) || room.sightClear(e, room.eye(o));
  }

  private perceive(room: Room, p: Player) {
    const now = room.time;
    let best: Player | null = null, bestScore = Infinity;
    for (const o of room.players) {
      if (o.team === p.team || !o.alive) continue;
      if (this.canSee(room, p, o)) {
        this.memory.set(o.id, { pos: { ...o.move.pos }, t: now, seen: true });
        const d = vdist(p.move.pos, o.move.pos);
        const score = d - (o.id === this.target ? 8 : 0) - (o.lastShotAt > now - 1 ? 4 : 0);
        if (score < bestScore) { bestScore = score; best = o; }
      }
    }
    // heard events: gunfire / sprint footsteps / explosions (position known approximately)
    for (const n of room.noises) {
      if (n.team === p.team || now - n.t > 0.15) continue;
      const d = vdist(n.pos, p.move.pos);
      if (d > n.radius) continue;
      const src = room.get(n.source);
      if (!src || !src.alive) continue;
      const m = this.memory.get(src.id);
      if (!m || now - m.t > 0.5) this.memory.set(src.id, { pos: { x: n.pos.x + this.rng.range(-2, 2), y: n.pos.y, z: n.pos.z + this.rng.range(-2, 2) }, t: now, seen: false });
    }
    // team radar (sweeps/drones/pings/fire blips) is legal team information
    if (this.rng.chance(this.skill.teamwork * 0.5)) {
      for (const b of room.radarFor(p.team)) {
        if (b.kind === "ping") continue;
        let nearest: Player | null = null, nd = 3;
        for (const o of room.players) if (o.team !== p.team && o.alive) { const d = Math.hypot(o.move.pos.x - b.x, o.move.pos.z - b.z); if (d < nd) { nd = d; nearest = o; } }
        if (nearest && !this.memory.get(nearest.id)?.seen) this.memory.set(nearest.id, { pos: { ...nearest.move.pos }, t: now, seen: false });
      }
    }
    for (const [id, m] of this.memory) if (now - m.t > 12) this.memory.delete(id);
    if (best) {
      if (this.target !== best.id) {
        this.target = best.id;
        const react = this.skill.reaction * this.rng.range(0.8, 1.25) * (vdist(p.move.pos, best.move.pos) < 8 ? 0.85 : 1);
        this.acquiredAt = now + react;
        this.trackStart = now;
        this.noise = { x: this.rng.gauss() * this.skill.aimNoise * 1.6, y: this.rng.gauss() * this.skill.aimNoise * 1.2 };
      }
    } else if (this.target !== null) {
      const m = this.memory.get(this.target);
      if (!m || now - m.t > 0.6) this.target = null;
    }
    // enemy drone as secondary target
    this.droneTarget = null;
    if (!best) {
      const e = this.eye(p);
      for (const d of room.devices) {
        if (d.team === p.team || d.kind !== "drone") continue;
        if (vdist(e, d.pos) < 45 && room.sightClear(e, d.pos)) { this.droneTarget = d.id; break; }
      }
    }
  }

  private pickGoal(room: Room, p: Player, laneOverride?: number): Vec3 {
    const enemyBase = room.map.teamBase[p.team === 0 ? 1 : 0];
    const ownBase = room.map.teamBase[p.team];
    const lane = LANES[laneOverride ?? this.lane];
    const nodes = mainNodes(room.nav);
    // pick a node in the chosen lane, biased past mid-map toward the enemy side
    const dirX = Math.sign(enemyBase.x - ownBase.x);
    const heat = room.heat[p.team];
    for (let tries = 0; tries < 40; tries++) {
      const n = room.nav.nodes[nodes[this.rng.int(0, nodes.length)]];
      if (n.pos.z < lane.z[0] || n.pos.z > lane.z[1]) continue;
      if (Math.abs(n.pos.y - lane.y) > 1.2) continue;
      const progress = (n.pos.x * dirX + 57) / 114;
      if (progress < 0.35 || progress > 0.95) continue;
      const hk = Math.floor((n.pos.x + 60) / 6) * 100 + Math.floor((n.pos.z + 50) / 6);
      if ((heat.get(hk) ?? 0) > 3 && this.rng.chance(0.7)) continue;
      return { ...n.pos };
    }
    return { ...enemyBase };
  }

  private setPath(room: Room, p: Player, goal: Vec3) {
    const a = nearestNode(room.nav, p.move.pos), b = nearestNode(room.nav, goal);
    const heat = room.heat[p.team];
    const path = findPath(room.nav, a, b, (n: NavNode) => {
      const hk = Math.floor((n.pos.x + 60) / 6) * 100 + Math.floor((n.pos.z + 50) / 6);
      return (heat.get(hk) ?? 0) * 0.6;
    });
    this.goal = goal;
    this.path = path ?? [];
    this.pathIdx = 0;
    this.repathAt = room.time + 6;
  }

  think(room: Room, p: Player, dt: number): InputCommand {
    const now = room.time;
    this.flashed = Math.max(0, this.flashed - dt);
    this.supportCooldown -= dt; this.equipCooldown -= dt;
    // recoil disturbs aim, bots then recover like a player would
    this.pitch += this.pendingRecoil.pitch * DEG; this.yaw += this.pendingRecoil.yaw * DEG;
    this.pendingRecoil.pitch = 0; this.pendingRecoil.yaw = 0;
    if (now >= this.nextPerceive) { this.nextPerceive = now + 0.1; this.perceive(room, p); }

    let buttons = 0;
    let mx = 0, mz = 0;
    let desiredYaw = this.yaw, desiredPitch = 0;
    let wantMoveDir: Vec3 | null = null;
    let sprint = false, crouch = false, ads = false;
    const w = p.arms.weapons[p.arms.active];
    const def = w.stats.def;
    const warm = room.phase === "warmup";
    const tgt = this.target !== null ? room.get(this.target) : undefined;
    const visible = !!tgt && tgt.alive && this.memory.get(tgt.id)?.seen && now - (this.memory.get(tgt.id)?.t ?? 0) < 0.25;

    // weapon choice
    const prim = p.arms.weapons[0];
    if (this.slot === 0 && prim.ammo === 0 && prim.reload && visible && tgt && vdist(tgt.move.pos, p.move.pos) < 18 && this.difficulty !== "easy") this.slot = 1;
    if (this.slot === 1 && (!visible || p.arms.weapons[1].ammo === 0) && prim.ammo > 0) this.slot = 0;
    if (this.slot === 1 && !visible && prim.ammo === 0 && !prim.reload) this.slot = 0;

    if (visible && tgt && !warm) {
      // ---------------- engage
      this.state = vdist(tgt.move.pos, p.move.pos) > def.botRange[1] ? "push" : "seek";
      const e = this.eye(p);
      const dist = vdist(e, room.chest(tgt));
      const aimHead = this.rng.chance(this.skill.headChance * dt * 10) || this.difficulty === "hard" && dist < 15;
      const aimPt = aimHead ? room.eye(tgt) : room.chest(tgt);
      const lead = this.skill.predict * Math.min(0.15, dist / 400);
      aimPt.x += tgt.move.vel.x * lead; aimPt.z += tgt.move.vel.z * lead;
      const yp = yawPitchTo(e, aimPt);
      // aim noise settles the longer we track
      const settle = clamp(1 - (now - this.trackStart) / 1.4, 0.25, 1);
      if (now > this.noiseT) { this.noiseT = now + this.rng.range(0.25, 0.6); this.noise = { x: this.rng.gauss() * this.skill.aimNoise, y: this.rng.gauss() * this.skill.aimNoise * 0.7 }; }
      desiredYaw = yp.yaw + this.noise.x * settle * DEG;
      desiredPitch = yp.pitch + this.noise.y * settle * DEG;
      ads = def.cls !== "shotgun" && dist > 9 && this.difficulty !== "easy" || def.cls === "marksman";
      // fire control
      const err = Math.hypot(wrapAngle(desiredYaw - this.yaw), desiredPitch - this.pitch);
      const tol = Math.atan(0.45 / Math.max(dist, 1)) + 1.2 * DEG;
      const inRange = dist <= def.botRange[1] * 1.3;
      if (now >= this.acquiredAt && err < tol && inRange) {
        const semi = def.modes[0] !== "auto" && def.modes[0] !== "burst";
        if (semi) {
          if (this.semiPrev) this.semiPrev = false;
          else if (now >= this.burstPauseUntil && w.cooldown <= 0) {
            buttons |= BTN.fire; this.semiPrev = true;
            this.burstPauseUntil = now + this.rng.range(0.06, 0.2) * (this.difficulty === "easy" ? 2 : this.difficulty === "normal" ? 1.3 : 1);
          }
        }
        else {
          if (this.burstLeft <= 0 && now >= this.burstPauseUntil) this.burstLeft = this.rng.int(this.skill.burst[0], this.skill.burst[1] + 1) * (dist < 12 ? 2 : 1);
          if (this.burstLeft > 0) { buttons |= BTN.fire; if (w.cooldown <= 0.001) this.burstLeft--; if (this.burstLeft <= 0) this.burstPauseUntil = now + this.rng.range(0.12, 0.35) * (dist / 20 + 0.5); }
        }
      }
      // tactical movement: strafe, crouch at range, push or keep distance
      if (now > this.strafeUntil) { this.strafeDir = this.rng.chance(0.5) ? 1 : -1; this.strafeUntil = now + this.rng.range(0.4, 1.3); if (this.rng.chance(0.25 * this.skill.strafe) && dist > 14) this.crouchUntil = now + this.rng.range(0.8, 2); }
      mx = this.strafeDir * this.skill.strafe;
      const want = def.botRange;
      if (dist > want[1]) mz = 1; else if (dist < want[0]) mz = -0.6; else mz = this.rng.chance(0.5) ? 0.3 : 0;
      if (def.cls === "shotgun" || def.cls === "smg") mz = dist > 6 ? 1 : 0.2;
      if (now < this.crouchUntil || (def.cls === "lmg" && dist > 15)) crouch = true;
      if (p.health < 35 && this.rng.chance(0.02)) { this.state = "retreat"; }
      // flash the target sometimes
      if (this.equipCooldown <= 0 && p.tactical.count > 0 && EQUIPMENT[p.loadout.tactical].id === "flash" && dist > 7 && dist < 18 && this.rng.chance(this.skill.equipUse * 0.02)) {
        this.tacticalPress = 2; this.equipCooldown = 6;
      }
    } else if (this.droneTarget !== null && !warm) {
      const d = room.devices.find((x) => x.id === this.droneTarget);
      if (d) {
        const yp = yawPitchTo(this.eye(p), d.pos);
        desiredYaw = yp.yaw; desiredPitch = yp.pitch; ads = true;
        const err = Math.hypot(wrapAngle(desiredYaw - this.yaw), desiredPitch - this.pitch);
        if (err < 2.5 * DEG && (def.modes[0] === "auto" || this.rng.chance(0.3))) buttons |= BTN.fire;
      }
    } else {
      // ---------------- strategic movement
      this.burstLeft = 0;
      const recent = [...this.memory.entries()].filter(([, m]) => now - m.t < 8).sort((a, b) => b[1].t - a[1].t)[0];
      if (this.state === "spawn" && now > this.stateUntil) this.state = "route";
      if (recent && this.state !== "retreat") {
        const [, m] = recent;
        if (this.state !== "seek" || !this.goal || vdist(this.goal, m.pos) > 4) { this.state = "seek"; this.setPath(room, p, m.pos); }
        // grenade a remembered (not visible) enemy position
        const d = vdist(p.move.pos, m.pos);
        if (!warm && this.equipCooldown <= 0 && p.lethal.count > 0 && d > 8 && d < 18 && now - m.t < 2.5 && this.rng.chance(this.skill.equipUse * 0.03)) {
          const mates = room.players.filter((o) => o.alive && o.team === p.team && o !== p && vdist(o.move.pos, m.pos) < 7);
          const sol = lobSolve(this.eye(p), m.pos, EQUIPMENT[p.loadout.lethal].throwSpeed);
          if (!mates.length && sol) {
            this.aimOverride = { yaw: sol.yaw, pitch: sol.pitch, until: now + 0.9 };
            this.lethalWant = EQUIPMENT[p.loadout.lethal].cookable ? this.rng.range(0.35, 0.9) : 0.1;
            this.lethalHold = 0;
            this.equipCooldown = 8;
          }
        }
      } else if (this.state === "seek" && (!recent)) { this.state = "route"; this.goal = null; }
      if (this.state === "retreat") {
        if (!this.goal) {
          const base = room.map.teamBase[p.team];
          const g = { x: p.move.pos.x + (base.x - p.move.pos.x) * 0.3, y: p.move.pos.y, z: p.move.pos.z };
          this.setPath(room, p, g);
          if (p.tactical.count > 0 && p.loadout.tactical === "obscurant") { this.tacticalPress = 2; this.aimOverride = { yaw: this.yaw + Math.PI, pitch: 20 * DEG, until: now + 0.3 }; }
        }
        if (p.health > 85 || now > this.repathAt) { this.state = "route"; this.goal = null; }
      }
      if (this.state === "route" || this.state === "flank" || this.state === "hold") {
        if (this.state === "hold") {
          if (now > this.holdUntil) { this.state = "route"; this.goal = null; }
        } else if (!this.goal || this.pathIdx >= this.path.length || now > this.repathAt + 20) {
          // occasionally flank through a different lane
          const flank = this.rng.chance(this.skill.diversity * 0.4);
          if (flank) { this.lane = (this.lane + 1 + this.rng.int(0, 2)) % LANES.length; this.state = "flank"; }
          this.setPath(room, p, this.pickGoal(room, p));
        }
      }
      // reload when safe
      if (w.ammo < w.stats.mag * 0.5 && !w.reload && w.reserve > 0) this.reloadPress = 2;
      // support usage
      if (p.supportReady.length && this.supportCooldown <= 0 && !warm) this.useSupport(room, p);
    }

    // path following
    if (!visible || this.state === "push" || this.state === "retreat") {
      if (this.path.length && this.pathIdx < this.path.length) {
        const node = room.nav.nodes[this.path[this.pathIdx]];
        const d = vdist2d(node.pos, p.move.pos);
        if (d < 0.9 && Math.abs(node.pos.y - p.move.pos.y) < 1.3) this.pathIdx++;
        else wantMoveDir = vsub(node.pos, p.move.pos);
        const next = room.nav.nodes[this.path[Math.min(this.pathIdx, this.path.length - 1)]];
        if (next.crouch) crouch = true;
        if (this.pathIdx >= this.path.length) {
          if (this.state === "route" || this.state === "flank") {
            this.state = "hold"; this.holdUntil = now + this.rng.range(1.5, 4.5);
            const enemyBase = room.map.teamBase[p.team === 0 ? 1 : 0];
            this.holdYaw = yawPitchTo(p.move.pos, enemyBase).yaw + this.rng.range(-0.7, 0.7);
          } else if (this.state === "seek") { this.memory.clear(); this.state = "route"; this.goal = null; }
          else if (this.state === "retreat") { this.state = "route"; this.goal = null; }
        }
      }
      if (wantMoveDir && !visible) {
        const yp = yawPitchTo(p.move.pos, { x: p.move.pos.x + wantMoveDir.x, y: p.move.pos.y, z: p.move.pos.z + wantMoveDir.z });
        desiredYaw = yp.yaw;
        // look toward a heard threat instead when one exists
        if (this.heardDir) { desiredYaw = yawPitchTo(p.move.pos, this.heardDir).yaw; if (this.rng.chance(0.01)) this.heardDir = null; }
        desiredPitch = 0;
        sprint = this.state !== "seek" || vdist(p.move.pos, this.goal ?? p.move.pos) > 15;
        if (crouch) sprint = false;
      }
      if (this.state === "hold") { desiredYaw = this.holdYaw + Math.sin(now * 0.7 + this.id) * 0.35; desiredPitch = 0.03; }
    }
    if (wantMoveDir) {
      const l = Math.hypot(wantMoveDir.x, wantMoveDir.z) || 1;
      const wx = wantMoveDir.x / l, wz = wantMoveDir.z / l;
      const f = flatForward(this.yaw), r = flatRight(this.yaw);
      const fz = wx * f.x + wz * f.z, fx = wx * r.x + wz * r.z;
      if (visible) { mz = fz; mx = fx; } else { mz = fz; mx = fx; }
    }

    // stuck detection: jump/mantle, then repath
    if ((Math.abs(mx) + Math.abs(mz)) > 0.3 && !visible) {
      const moved = vdist2d(p.move.pos, this.lastPos);
      if (moved < 1.2 * dt) this.stuckT += dt; else this.stuckT = Math.max(0, this.stuckT - dt * 2);
      if (this.stuckT > 0.5 && now > this.jumpT) { buttons |= BTN.jump; this.jumpT = now + 0.6; }
      if (this.stuckT > 1.6) { this.stuckT = 0; this.goal = null; this.path = []; mx = this.rng.chance(0.5) ? 1 : -1; if (this.state === "seek") this.memory.clear(); this.state = "route"; }
    }
    this.lastPos = { ...p.move.pos };

    // aim override for throws / support
    if (this.aimOverride && now < this.aimOverride.until) { desiredYaw = this.aimOverride.yaw; desiredPitch = this.aimOverride.pitch; }
    else this.aimOverride = null;

    // turn toward desired at limited rate (no instant snaps)
    const rate = this.skill.turnRate * DEG * dt * (visible ? 1 : 0.7);
    const dy = wrapAngle(desiredYaw - this.yaw);
    this.yaw = wrapAngle(this.yaw + clamp(dy, -rate, rate));
    const dp = desiredPitch - this.pitch;
    this.pitch = clamp(this.pitch + clamp(dp, -rate * 0.8, rate * 0.8), -80 * DEG, 80 * DEG);

    // equipment presses
    if (this.lethalWant > 0) {
      this.lethalHold += dt;
      if (this.lethalHold < this.lethalWant + 0.25) buttons |= BTN.lethal;
      else { this.lethalWant = 0; this.lethalHold = 0; }
    }
    if (this.tacticalPress > 0) { if (this.tacticalPress === 2) buttons |= BTN.tactical; this.tacticalPress--; }
    if (this.deployPress > 0) { if (this.deployPress === 2) buttons |= BTN.deploy; this.deployPress--; }
    if (this.reloadPress > 0) { if (this.reloadPress === 2) buttons |= BTN.reload; this.reloadPress--; }

    if (sprint && !visible && !ads) buttons |= BTN.sprint;
    if (crouch) buttons |= BTN.crouch;
    if (ads) buttons |= BTN.ads;
    if (warm) { buttons &= ~(BTN.fire | BTN.lethal | BTN.tactical); }

    return { seq: ++this.seq, tick: room.tickN, mx: clamp(mx, -1, 1), mz: clamp(mz, -1, 1), yaw: this.yaw, pitch: this.pitch, buttons, slot: this.slot, supportSel: this.supportSel };
  }

  supportSel = 0;
  semiPrev = false;
  private useSupport(room: Room, p: Player) {
    const id = p.supportReady[0];
    this.supportSel = 0;
    this.supportCooldown = 2.5;
    const now = room.time;
    const m = [...this.memory.values()].sort((a, b) => b.t - a.t)[0];
    if (id === "mortarMark") {
      if (!m || now - m.t > 6 || room.world.hasRoof(m.pos) || vdist(m.pos, p.move.pos) < 12) return;
      const yp = yawPitchTo(this.eye(p), m.pos);
      this.aimOverride = { yaw: yp.yaw, pitch: yp.pitch, until: now + 0.5 };
      // deploy once aim has settled
      if (Math.abs(wrapAngle(yp.yaw - this.yaw)) < 3 * DEG && Math.abs(yp.pitch - this.pitch) < 3 * DEG) this.deployPress = 2;
      else this.supportCooldown = 0.2;
      return;
    }
    if (id === "interdictionFlight") {
      const enemyBase = room.map.teamBase[p.team === 0 ? 1 : 0];
      const aimAt = m && now - m.t < 8 ? m.pos : enemyBase;
      const yp = yawPitchTo(this.eye(p), aimAt);
      this.aimOverride = { yaw: yp.yaw, pitch: Math.max(yp.pitch, 0.05), until: now + 0.5 };
      if (Math.abs(wrapAngle(yp.yaw - this.yaw)) < 4 * DEG) this.deployPress = 2; else this.supportCooldown = 0.2;
      return;
    }
    this.deployPress = 2;
  }
}

/** Solve a lob (low arc) for thrown equipment; returns null when out of range. */
export function lobSolve(from: Vec3, to: Vec3, speed: number, g = 15): { yaw: number; pitch: number } | null {
  const dx = to.x - from.x, dz = to.z - from.z;
  const d = Math.hypot(dx, dz);
  const h = to.y + 0.3 - from.y - 0.6;
  const v2 = speed * speed;
  const disc = v2 * v2 - g * (g * d * d + 2 * h * v2);
  if (disc < 0) return null;
  const theta = Math.atan((v2 - Math.sqrt(disc)) / (g * d));
  return { yaw: Math.atan2(dx, dz), pitch: -theta };
}

export function botZone(p: Player) { return zoneAt(p.move.pos)?.id ?? null; }
void WEAPONS; void vlen;
