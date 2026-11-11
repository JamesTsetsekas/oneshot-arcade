// Server-side bot brain. Bots produce the same InputCmd a human would; perception is limited to vision cones with
// occlusion, heard events, recent damage and last-known positions. No wall vision, no hidden-state awareness.
import type { World } from "../sim/world";
import { aimDir, eyePos } from "../sim/world";
import type { PlayerState } from "../sim/types";
import type { Difficulty } from "../sim/types";
import { DEG, Rng, angleDiff, clamp, dist2D, hashSeed, wrapAngle } from "../math";
import { findPath, walkClear, type NavNode } from "./nav";
import { emptyInput, type InputCmd } from "../protocol";
import { EQUIPMENT, SUPPORTS } from "../content/gear";

export type BotState = "spawn" | "route" | "engage" | "seek" | "hold" | "retreat" | "flank" | "support";

interface Skill {
  react: number; aimNoise: number; turn: number; burstMin: number; burstMax: number; pauseMin: number; pauseMax: number;
  fov: number; head: number; comp: number; routeNoise: number; teamwork: number;
}
const SKILLS: Record<Difficulty, Skill> = {
  easy: { react: 0.6, aimNoise: 3.2, turn: 150, burstMin: 2, burstMax: 4, pauseMin: 0.5, pauseMax: 0.95, fov: 100, head: 0.06, comp: 0, routeNoise: 7, teamwork: 0.2 },
  normal: { react: 0.36, aimNoise: 1.7, turn: 260, burstMin: 4, burstMax: 8, pauseMin: 0.3, pauseMax: 0.65, fov: 112, head: 0.16, comp: 0.4, routeNoise: 4, teamwork: 0.5 },
  hard: { react: 0.2, aimNoise: 0.85, turn: 420, burstMin: 6, burstMax: 12, pauseMin: 0.18, pauseMax: 0.4, fov: 122, head: 0.3, comp: 0.75, routeNoise: 2.5, teamwork: 0.85 },
};

const IDEAL_RANGE: Record<string, number> = { rifle: 20, smg: 10, battle: 26, shotgun: 6, lmg: 26, marksman: 45, pistol: 12, machinepistol: 9 };

export class BotBrain {
  state: BotState = "spawn";
  skill: Skill;
  rng: Rng;
  path: number[] = [];
  pathIdx = 0;
  goalNode = -1;
  holdUntil = 0;
  holdYaw = 0;
  target = -1;
  acquire = new Map<number, number>();
  lastKnown: { x: number; z: number; t: number; y: number } | null = null;
  lastSeenT = -99;
  aimYaw = 0;
  aimPitch = 0;
  noiseYaw = 0;
  noiseYawT = 0;
  noisePitch = 0;
  noisePitchT = 0;
  noiseNextAt = 0;
  burstLeft = 0;
  burstStartShots = 0;
  nextBurstAt = 0;
  strafeDir = 1;
  strafeUntil = 0;
  lanePref: [number, number, number];
  perceiveAcc = 0;
  stuckT = 0;
  stuckPos = { x: 0, z: 0 };
  repathAt = 0;
  retreatUntil = 0;
  equipCd = 0;
  supportCd = 0;
  lethalPhase = 0;
  crouchHold = false;
  headshotAim = false;
  headRollAt = 0;
  lastDamageSeen = 0;
  cmd: InputCmd = emptyInput();
  lookAwayUntil = 0;
  lookAwayYaw = 0;
  deathCount = 0;
  spawnAt = 0;
  reactDelayUntil = 0;
  sprintOk = false;
  lastHealth = 100;

  constructor(private w: World, private p: PlayerState, diff: Difficulty, seed: number) {
    this.skill = SKILLS[diff];
    this.rng = new Rng(seed);
    const a = this.rng.range(0.15, 0.45), b = this.rng.range(0.15, 0.4);
    this.lanePref = [a, 1 - a - b > 0.1 ? 1 - a - b : 0.2, b];
  }

  onSpawn(): void {
    this.state = "spawn";
    this.path = []; this.pathIdx = 0; this.target = -1; this.acquire.clear(); this.lastKnown = null; this.burstLeft = 0;
    this.aimYaw = this.p.yaw; this.aimPitch = 0; this.spawnAt = this.w.time; this.repathAt = this.w.time + this.rng.range(0.1, 0.9);
    this.lastHealth = 100;
  }
  onDeath(by: number): void {
    this.deathCount++;
    this.state = "spawn";
    void by;
  }

  // ------------------------------------------------------------------ perception
  private perceive(dt: number): void {
    const w = this.w, p = this.p;
    const eye = eyePos(p);
    const blind = w.time < p.flashedUntil;
    const fwd = this.aimYaw;
    let bestVisible = -1, bestDist = 1e9;
    for (const q of w.players) {
      if (!q.alive || q.team === p.team) continue;
      const dx = q.pos.x - p.pos.x, dz = q.pos.z - p.pos.z;
      const dist = Math.hypot(dx, dz);
      let seen = false;
      if (!blind && dist < 85) {
        const ang = Math.abs(angleDiff(Math.atan2(dx, dz), fwd)) / DEG;
        if (ang <= this.skill.fov / 2 || dist < 3.5) {
          const chest = { x: q.pos.x, y: q.pos.y + 1.15, z: q.pos.z };
          if (w.col.lineClear(eye, chest, w.time)) seen = true;
          else {
            const head = { x: q.pos.x, y: q.pos.y + (q.crouching ? 1.15 : 1.6), z: q.pos.z };
            if (w.col.lineClear(eye, head, w.time)) seen = true;
          }
        }
      }
      let a = this.acquire.get(q.id) ?? 0;
      if (seen) {
        const thr = this.skill.react * (0.7 + dist / 70) + (q.crouching ? 0.1 : 0);
        a += dt;
        this.acquire.set(q.id, a);
        if (a >= thr) {
          if (dist < bestDist) { bestDist = dist; bestVisible = q.id; }
        }
      } else {
        a = Math.max(0, a - dt * 2);
        this.acquire.set(q.id, a);
        // hearing
        if (!blind) {
          const shot = w.time - q.lastShotNoiseAt < 0.3;
          const stepLoud = q.sprinting ? 20 : q.crouching ? 5 : 12;
          const step = w.time - q.lastFootstepLoud < 0.15;
          let heardR = 0;
          if (shot) heardR = Math.max(heardR, (q.weapons[q.slot].stats.loudness) * (q.lastShotSuppressed ? 0.35 : 1) * 0.9);
          if (step) heardR = Math.max(heardR, stepLoud);
          if (heardR > 0 && dist < heardR && (!this.lastKnown || w.time - this.lastKnown.t > 1.5 || dist < dist2D(p.pos, { x: this.lastKnown.x, y: 0, z: this.lastKnown.z }))) {
            const n = this.skill.aimNoise * 1.5;
            this.lastKnown = { x: q.pos.x + (this.rng.next() - 0.5) * n * 2, z: q.pos.z + (this.rng.next() - 0.5) * n * 2, t: w.time, y: q.pos.y };
          }
          // team scans (recon / dart / drone) give a rough contact
          if (q.revealedUntil[p.team] > w.time && dist < 60 && this.rng.chance(0.4 * dt * this.skill.teamwork * 4)) {
            this.lastKnown = { x: q.pos.x + (this.rng.next() - 0.5) * 6, z: q.pos.z + (this.rng.next() - 0.5) * 6, t: w.time, y: q.pos.y };
          }
        }
      }
    }
    // recent damage from an unseen attacker: turn toward it
    if (p.health < this.lastHealth - 0.01) {
      const last = p.damageLog[p.damageLog.length - 1];
      if (last && w.time - last.t < 0.2 && last.attacker >= 0 && bestVisible < 0) {
        this.lastKnown = { x: last.from.x, z: last.from.z, t: w.time, y: 0 };
        if (this.state !== "engage") { this.lookAwayUntil = w.time + 0.8; this.lookAwayYaw = Math.atan2(last.from.x - p.pos.x, last.from.z - p.pos.z); this.reactDelayUntil = w.time + this.skill.react * 0.6; }
      }
    }
    this.lastHealth = p.health;
    if (bestVisible >= 0) {
      this.target = bestVisible;
      const q = w.players[bestVisible];
      this.lastKnown = { x: q.pos.x, z: q.pos.z, t: w.time, y: q.pos.y };
      this.lastSeenT = w.time;
    } else if (w.time - this.lastSeenT > 1.4) this.target = -1;
  }

  // ------------------------------------------------------------------ main update
  think(dt: number): void {
    const w = this.w, p = this.p;
    const c = this.cmd;
    // reset per-tick edges
    c.jump = false; c.reload = false; c.melee = false; c.lethal = false; c.tactical = false; c.selectSlot = -1;
    c.supportCycle = false; c.supportDeploy = false; c.interact = false; c.fireModeToggle = false; c.fire = false;
    c.ads = false; c.sprint = false; c.crouch = false; c.forward = 0; c.strafe = 0;
    c.seq++;
    if (this.lethalPhase === 1) { c.lethalHeld = false; this.lethalPhase = 0; }

    this.perceiveAcc += dt;
    if (this.perceiveAcc >= 0.1) { const pd = this.perceiveAcc; this.perceiveAcc = 0; this.perceive(pd); }

    const tgt = this.target >= 0 ? w.players[this.target] : null;
    const visible = !!tgt && tgt.alive && w.time - this.lastSeenT < 0.25;
    const wp = p.weapons[p.slot];
    const def = wp.stats.def;
    const stats = wp.stats;

    // ---- state selection
    if (visible && w.time >= this.reactDelayUntil) this.state = "engage";
    else if (this.state === "engage") this.state = this.lastKnown && w.time - this.lastKnown.t < 7 ? "seek" : "route";
    if (this.state === "spawn" && w.time - this.spawnAt > 0.35) this.state = "route";
    if (this.state !== "retreat" && p.health < 38 && this.lastKnown && w.time - this.lastKnown.t < 5 && this.rng.chance(0.02)) { this.state = "retreat"; this.retreatUntil = w.time + 5; this.path = []; }
    if (this.state === "retreat" && (w.time > this.retreatUntil || p.health > 75)) this.state = "route";
    if ((this.state === "route" || this.state === "hold") && this.lastKnown && w.time - this.lastKnown.t < 3 && dist2D(p.pos, { x: this.lastKnown.x, y: 0, z: this.lastKnown.z }) < 30 && this.rng.chance(dt * (0.5 + this.skill.teamwork))) {
      this.state = "seek"; this.path = [];
    }
    if (this.state === "seek" && (!this.lastKnown || w.time - this.lastKnown.t > 8)) { this.state = "route"; this.path = []; }

    // weapon housekeeping
    this.weaponLogic(wp, visible, tgt);

    // ---- desired view and movement
    let moveX = 0, moveZ = 0; // desired world movement direction
    let wantYaw = this.aimYaw, wantPitch = 0;
    let faceMove = true;

    if (this.state === "engage" && tgt) {
      faceMove = false;
      const dist = dist2D(p.pos, tgt.pos);
      if (w.time >= this.headRollAt) { this.headshotAim = this.rng.chance(this.skill.head); this.headRollAt = w.time + 0.8; }
      const aimY = tgt.pos.y + (this.headshotAim ? (tgt.crouching ? 1.15 : 1.58) : tgt.crouching ? 0.85 : 1.2);
      const eye = eyePos(p);
      const dx = tgt.pos.x - eye.x, dz = tgt.pos.z - eye.z, dy = aimY - eye.y;
      // lead target slightly (hard bots anticipate strafing)
      const lead = this.skill.comp * 0.06;
      const ldx = dx + tgt.vel.x * lead, ldz = dz + tgt.vel.z * lead;
      wantYaw = Math.atan2(ldx, ldz);
      wantPitch = Math.atan2(dy, Math.hypot(ldx, ldz));
      // noise
      if (w.time >= this.noiseNextAt) {
        this.noiseNextAt = w.time + 0.28;
        const n = this.skill.aimNoise * (0.6 + dist / 50);
        this.noiseYaw = this.rng.gauss() * n * DEG; this.noisePitch = this.rng.gauss() * n * 0.6 * DEG;
      }
      wantYaw += this.noiseYaw; wantPitch += this.noisePitch - p.recoilP * this.skill.comp;
      // movement: strafe + range keeping
      if (w.time >= this.strafeUntil) { this.strafeDir = this.rng.chance(0.5) ? 1 : -1; this.strafeUntil = w.time + this.rng.range(0.5, 1.4); }
      const ideal = IDEAL_RANGE[def.cls] ?? 18;
      const toT = { x: dx / Math.max(dist, 0.01), z: dz / Math.max(dist, 0.01) };
      let fwd = 0;
      if (dist > ideal * 1.4) fwd = 1;
      else if (dist < ideal * 0.45) fwd = -1;
      const perp = { x: toT.z, z: -toT.x };
      moveX = toT.x * fwd + perp.x * this.strafeDir * 0.8;
      moveZ = toT.z * fwd + perp.z * this.strafeDir * 0.8;
      // ADS at range
      c.ads = dist > 16 && def.cls !== "shotgun";
      if (def.cls === "shotgun") c.ads = dist > 9;
      // crouch when far and steady
      c.crouch = dist > 24 && this.skill.comp > 0.5 && fwd === 0;
      // fire control
      const adsReady = !c.ads || p.adsT > 0.65;
      const errYaw = angleDiff(this.aimYaw + p.recoilY, Math.atan2(dx, dz));
      const errPitch = (this.aimPitch + p.recoilP) - Math.atan2(dy, Math.hypot(dx, dz));
      const err = Math.hypot(errYaw, errPitch) / DEG;
      const thr = Math.atan(0.42 / Math.max(dist, 1)) / DEG + 0.9 + (this.skill.aimNoise > 2 ? 1.0 : 0);
      const wasShots = wp.shotsFired;
      if (this.burstLeft > 0) {
        if (wp.shotsFired - this.burstStartShots >= this.burstLeft || wp.ammo <= 0) {
          this.burstLeft = 0;
          this.nextBurstAt = w.time + this.rng.range(this.skill.pauseMin, this.skill.pauseMax);
        } else c.fire = true;
      } else if (w.time >= this.nextBurstAt && err < thr && adsReady && w.time >= this.reactDelayUntil) {
        const full = def.fireMode === "auto";
        this.burstLeft = full ? this.rng.int(this.skill.burstMax - this.skill.burstMin + 1) + this.skill.burstMin : 1;
        if (def.fireMode === "semi" && def.cls !== "pistol") this.burstLeft = this.rng.int(2) + 1;
        this.burstStartShots = wasShots;
        c.fire = true;
      }
      // semi/pump/bolt need a release between presses
      if (def.fireMode !== "auto" && c.fire && w.tickN % 2 === 0) c.fire = false;
      this.stuckT = 0;
      this.maybeThrowEquipment(tgt, true);
    } else {
      // non-combat navigation
      this.navigate(dt);
      const goalDir = this.pathDir();
      if (goalDir) { moveX = goalDir.x; moveZ = goalDir.z; }
      if (this.state === "hold") {
        moveX = 0; moveZ = 0; faceMove = false;
        wantYaw = this.holdYaw;
        c.crouch = this.crouchHold;
        if (w.time >= this.holdUntil) { this.state = "route"; this.path = []; }
      } else if (this.state === "seek" || this.state === "route" || this.state === "retreat") {
        // look toward movement; periodically glance at last known contact
        if (this.lookAwayUntil > w.time) { faceMove = false; wantYaw = this.lookAwayYaw; }
        else if (this.lastKnown && this.state === "seek" && w.time - this.lastKnown.t < 3) {
          faceMove = false;
          wantYaw = Math.atan2(this.lastKnown.x - p.pos.x, this.lastKnown.z - p.pos.z);
        }
      }
      if (this.state !== "hold") {
        const moving = Math.hypot(moveX, moveZ) > 0.1;
        c.sprint = moving && this.state !== "seek" && !visible && p.health > 0;
      }
      if (this.lastKnown && (this.state === "seek" || this.state === "hold")) this.maybeThrowEquipment(null, false);
    }
    if (faceMove) {
      const mlen = Math.hypot(moveX, moveZ);
      if (mlen > 0.1) wantYaw = Math.atan2(moveX, moveZ);
      wantPitch = 0;
    }

    // ---- turning
    const turn = this.skill.turn * DEG * dt * (this.state === "engage" ? 1 : 0.7);
    const dy = angleDiff(wantYaw, this.aimYaw);
    const stepYaw = Math.abs(dy) < turn ? dy : Math.sign(dy) * turn;
    this.aimYaw = wrapAngle(this.aimYaw + stepYaw * (Math.abs(dy) < 0.05 ? 1 : 1));
    const dp = wantPitch - this.aimPitch;
    const stepP = Math.abs(dp) < turn ? dp : Math.sign(dp) * turn;
    this.aimPitch = clamp(this.aimPitch + stepP, -1.2, 1.2);
    if (w.time < p.flashedUntil) { this.aimYaw += (this.rng.next() - 0.5) * 0.05; c.fire = c.fire && this.rng.chance(0.5); }

    // ---- movement command relative to view
    const sy = Math.sin(this.aimYaw), cy = Math.cos(this.aimYaw);
    const ml = Math.hypot(moveX, moveZ);
    if (ml > 0.01) {
      const nx = moveX / ml, nz = moveZ / ml;
      c.forward = clamp(nx * sy + nz * cy, -1, 1);
      c.strafe = clamp(nx * cy - nz * sy, -1, 1);
      if (c.sprint && c.forward < 0.5) c.sprint = false;
    }
    c.yaw = this.aimYaw; c.pitch = this.aimPitch;

    // stuck handling
    if (ml > 0.1 && this.state !== "engage") {
      this.stuckT += dt;
      if (this.stuckT > 1.2) {
        const moved = Math.hypot(p.pos.x - this.stuckPos.x, p.pos.z - this.stuckPos.z);
        if (moved < 0.7) { c.jump = true; this.path = []; this.repathAt = 0; if (this.rng.chance(0.4)) this.state = "route"; }
        this.stuckT = 0; this.stuckPos = { x: p.pos.x, z: p.pos.z };
      }
    } else if (this.stuckT === 0) this.stuckPos = { x: p.pos.x, z: p.pos.z };

    this.supportLogic(dt);
    p.cmd = this.cmd;
  }

  // ------------------------------------------------------------------ helpers
  private weaponLogic(wp: PlayerState["weapons"][number], visible: boolean, tgt: PlayerState | null): void {
    const p = this.p, w = this.w, c = this.cmd;
    const other = p.weapons[1 - p.slot];
    if (wp.ammo === 0 && wp.reserve > 0 && wp.reloadT < 0) {
      if (visible && other.ammo > 0 && tgt && dist2D(p.pos, tgt.pos) < 18 && p.swapT <= 0) { c.selectSlot = (1 - p.slot) as 0 | 1; return; }
      c.reload = true;
    } else if (!visible && wp.ammo < wp.stats.magSize * 0.4 && wp.reloadT < 0 && wp.reserve > 0) c.reload = true;
    else if (!visible && p.slot === 1 && w.time - this.lastSeenT > 2 && p.swapT <= 0 && p.weapons[0].ammo + p.weapons[0].reserve > 0) c.selectSlot = 0;
  }

  private maybeThrowEquipment(tgt: PlayerState | null, engaging: boolean): void {
    const w = this.w, p = this.p, c = this.cmd;
    if (w.time < this.equipCd || !this.lastKnown) return;
    const lk = this.lastKnown;
    const dist = dist2D(p.pos, { x: lk.x, y: 0, z: lk.z });
    const age = w.time - lk.t;
    const eye = eyePos(p);
    const lethal = p.loadout.lethal;
    const tactical = p.loadout.tactical;
    const aimTo = () => {
      this.aimYaw = Math.atan2(lk.x - p.pos.x, lk.z - p.pos.z);
      const ratio = clamp(9.81 * 1.8 * Math.max(dist, 3) / (17 * 17), 0, 0.98);
      this.aimPitch = 0.5 * Math.asin(ratio) + 0.12;
      c.yaw = this.aimYaw; c.pitch = this.aimPitch;
    };
    const losBlocked = !w.col.lineClear(eye, { x: lk.x, y: 1.2, z: lk.z }, w.time);
    if (!engaging && age < 4 && losBlocked && dist > 7 && dist < 15 && p.equip.lethal > 0 && (lethal === "frag" || lethal === "adhesive") && this.rng.chance(0.35)) {
      aimTo(); c.lethal = true; c.lethalHeld = true; this.lethalPhase = 1; this.equipCd = w.time + 12 + this.rng.range(0, 8); return;
    }
    if (!engaging && age < 3 && dist < 14 && dist > 4 && p.equip.tactical > 0 && tactical === "flash" && losBlocked && this.rng.chance(0.4)) {
      aimTo(); c.tactical = true; this.equipCd = w.time + 8; return;
    }
    if (!engaging && age < 6 && p.equip.tactical > 0 && tactical === "dart" && this.rng.chance(0.2)) {
      aimTo(); c.tactical = true; this.equipCd = w.time + 14; return;
    }
    if (engaging && tgt && p.health < 50 && p.equip.tactical > 0 && tactical === "obscurant" && dist > 6) {
      this.aimYaw = Math.atan2(tgt.pos.x - p.pos.x, tgt.pos.z - p.pos.z); this.aimPitch = 0.3; c.yaw = this.aimYaw; c.pitch = this.aimPitch;
      c.tactical = true; this.equipCd = w.time + 14; return;
    }
    if (engaging && tgt && dist < 12 && dist > 5 && p.equip.lethal > 0 && lethal === "frag" && this.rng.chance(0.004)) {
      c.lethal = true; c.lethalHeld = true; this.lethalPhase = 1; this.equipCd = w.time + 14; return;
    }
  }

  private supportLogic(dt: number): void {
    const w = this.w, p = this.p;
    this.supportCd -= dt;
    if (this.supportCd > 0) return;
    this.supportCd = 1.0;
    const idx = p.supportSelected;
    if (idx < 0 || !p.supportReady[idx] || p.supportUsed[idx]) return;
    const id = p.loadout.support[idx];
    const enemies = w.players.filter((q) => q.alive && q.team !== p.team);
    const mates = w.players.filter((q) => q.alive && q.team === p.team);
    const lk = this.lastKnown;
    switch (id) {
      case "recon": case "drone":
        if (enemies.length) w.support.deploy(p, idx);
        break;
      case "uplink":
        if (mates.length >= 3) w.support.deploy(p, idx);
        break;
      case "ammopod":
        if (p.weapons[0].reserve < p.weapons[0].stats.reserve * 0.5 || this.rng.chance(0.1)) w.support.deploy(p, idx, { x: p.pos.x + Math.sin(p.yaw) * 1.5, y: 0, z: p.pos.z + Math.cos(p.yaw) * 1.5 });
        break;
      case "mortar": case "flight":
        if (lk && w.time - lk.t < 6) {
          const r = w.support.deploy(p, idx, { x: lk.x, y: 0, z: lk.z }, { x: lk.x - p.pos.x, y: 0, z: lk.z - p.pos.z });
          if (!r.ok && r.reason === "indoors") { this.supportCd = 3; }
        }
        break;
    }
    void SUPPORTS; void EQUIPMENT;
  }

  private heatCost(n: NavNode): number {
    const w = this.w;
    let c = 0;
    for (const h of w.deathHeat) {
      if (h.team !== this.p.team) continue;
      const d = Math.hypot(h.x - n.x, h.z - n.z);
      if (d < 9) c += (9 - d) * 0.9 * (1 - (w.time - h.t) / 25);
    }
    // route diversity: stable per-bot pseudo noise
    const hsh = hashSeed(n.id, this.p.id, this.deathCount >> 1);
    c += ((hsh & 1023) / 1023) * this.skill.routeNoise * 0.5;
    return c;
  }

  private pickGoal(): number {
    const w = this.w, p = this.p;
    const nav = w.nav;
    const side = p.team === 0 ? 1 : -1;
    const goals = w.map.routeGoals;
    let total = 0;
    const weights: number[] = [];
    for (const g of goals) {
      let wt = g.weight;
      const lane = g.lane === "N" ? 0 : g.lane === "C" ? 1 : 2;
      wt *= this.lanePref[lane];
      // push toward the enemy half progressively; own half only for regroup
      const fwdX = g.x * side;
      wt *= fwdX > -12 ? 1.4 : 0.25;
      let heat = 0;
      for (const h of w.deathHeat) if (h.team === p.team && Math.hypot(h.x - g.x, h.z - g.z) < 10) heat += 1;
      wt /= 1 + heat * 0.8;
      // do not pick the goal we are standing at
      if (dist2D(p.pos, { x: g.x, y: 0, z: g.z }) < 6) wt *= 0.05;
      // teamwork: prefer goals where teammates are (clustered pushes)
      weights.push(wt); total += wt;
    }
    let r = this.rng.next() * total;
    let gi = 0;
    for (let i = 0; i < goals.length; i++) { r -= weights[i]; if (r <= 0) { gi = i; break; } }
    const g = goals[gi];
    const ox = (this.rng.next() - 0.5) * 5, oz = (this.rng.next() - 0.5) * 5;
    return nav.nearest(g.x + ox, g.z + oz);
  }

  private navigate(dt: number): void {
    const w = this.w, p = this.p;
    void dt;
    const nav = w.nav;
    if (this.state === "seek" && this.lastKnown) {
      if (!this.path.length || w.time >= this.repathAt) {
        const from = nav.nearest(p.pos.x, p.pos.z), to = nav.nearest(this.lastKnown.x, this.lastKnown.z);
        const pth = findPath(nav, from, to, (n) => this.heatCost(n));
        this.path = pth ?? []; this.pathIdx = 0; this.repathAt = w.time + 1.5;
        if (this.path.length <= 1 && dist2D(p.pos, { x: this.lastKnown.x, y: 0, z: this.lastKnown.z }) < 3) { this.state = "hold"; this.holdUntil = w.time + 2 + this.rng.range(0, 2); this.holdYaw = nav.nodes[from]?.bestYaw ?? p.yaw; this.crouchHold = false; }
      }
      return;
    }
    if (this.state === "retreat") {
      if (!this.path.length) {
        // retreat toward own spawn side to a cover node
        const side = p.team === 0 ? -1 : 1;
        let best = -1, bs = -1e9;
        for (let k = 0; k < 24; k++) {
          const n = nav.nodes[this.rng.int(nav.nodes.length)];
          const d = dist2D(p.pos, { x: n.x, y: 0, z: n.z });
          if (d < 8 || d > 24) continue;
          const away = this.lastKnown ? dist2D(n as unknown as { x: number; y: number; z: number } & { z: number }, { x: this.lastKnown.x, y: 0, z: this.lastKnown.z }) : 20;
          const s = n.coverScore * 2 + away * 0.3 + n.x * side * 0.05;
          if (s > bs) { bs = s; best = n.id; }
        }
        if (best >= 0) { const pth = findPath(nav, nav.nearest(p.pos.x, p.pos.z), best); this.path = pth ?? []; this.pathIdx = 0; }
        else this.state = "route";
      }
      return;
    }
    if (this.state === "route" || this.state === "spawn") {
      if (!this.path.length || this.pathIdx >= this.path.length) {
        if (this.path.length && this.pathIdx >= this.path.length && this.goalNode >= 0 && w.time > this.spawnAt + 1) {
          // arrived: hold the angle for a bit
          const n = nav.nodes[this.goalNode];
          this.state = "hold"; this.holdUntil = w.time + this.rng.range(1.5, 5.5);
          this.holdYaw = n ? n.bestYaw : p.yaw;
          if (n && p.team === 0 && Math.sin(this.holdYaw) < -0.3) this.holdYaw = Math.atan2(1, this.rng.range(-0.5, 0.5));
          if (n && p.team === 1 && Math.sin(this.holdYaw) > 0.3) this.holdYaw = Math.atan2(-1, this.rng.range(-0.5, 0.5));
          this.crouchHold = this.rng.chance(0.35);
          this.path = []; this.goalNode = -1;
          return;
        }
        this.goalNode = this.pickGoal();
        const from = nav.nearest(p.pos.x, p.pos.z);
        const pth = findPath(nav, from, this.goalNode, (n) => this.heatCost(n));
        this.path = pth ?? []; this.pathIdx = 0;
        if (!this.path.length) { this.goalNode = -1; }
      }
    }
  }

  /** Direction (unit) toward the next waypoint along the current path. */
  private pathDir(): { x: number; z: number } | null {
    const w = this.w, p = this.p;
    if (!this.path.length) {
      if (this.state === "seek" && this.lastKnown) {
        const dx = this.lastKnown.x - p.pos.x, dz = this.lastKnown.z - p.pos.z, l = Math.hypot(dx, dz);
        if (l > 1.5) return { x: dx / l, z: dz / l };
      }
      return null;
    }
    const nav = w.nav;
    // skip ahead if a later waypoint is directly reachable
    for (let k = Math.min(this.path.length - 1, this.pathIdx + 3); k > this.pathIdx; k--) {
      const n = nav.nodes[this.path[k]];
      if (Math.abs(n.x - p.pos.x) + Math.abs(n.z - p.pos.z) < 14 && walkClear(w.col, p.pos.x, p.pos.z, n.x, n.z, 0.4)) { this.pathIdx = k; break; }
    }
    let n = nav.nodes[this.path[this.pathIdx]];
    while (n && Math.hypot(n.x - p.pos.x, n.z - p.pos.z) < 0.9) {
      this.pathIdx++;
      if (this.pathIdx >= this.path.length) return null;
      n = nav.nodes[this.path[this.pathIdx]];
    }
    if (!n) return null;
    const dx = n.x - p.pos.x, dz = n.z - p.pos.z, l = Math.hypot(dx, dz);
    return l > 0.01 ? { x: dx / l, z: dz / l } : null;
  }
}

void aimDir;
