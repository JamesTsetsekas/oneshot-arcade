// Authoritative game simulation: movement, weapons, damage, Momentum, match rules.
// Runs at a fixed 60 Hz step. In Practice the "server" is this world running in-process; the client only reads it.
import { DEG, Rng, clamp, cloneV, dist2D, distV, dirFromAngles, hashSeed, lerp, v3, wrapAngle, type Vec3 } from "../math";
import { SIM_DT, emptyInput, type InputCmd, type SimEvent, type HitZone, type SurfaceTag } from "../protocol";
import { falloffMul, recoilPattern, WEAPONS } from "../content/weapons";
import { resolveWeaponStats, sanitizeLoadout, type Loadout } from "../content/loadout";
import { EQUIPMENT, SUPPORT_TIERS, SUPPORTS } from "../content/gear";
import { CollisionWorld, BODY_HALF } from "./collision";
import { getK17, type MapBox, type MapData } from "../map/k17";
import {
  DEFAULT_CONFIG, type MatchConfig, type MatchState, type PlayerState, type WeaponState, type Projectile, type Deployable, type SupportEvent,
  type RecapInfo,
} from "./types";
import { chooseSpawn } from "./spawn";
import { EquipmentSystem } from "./equipment";
import { SupportSystem } from "./support";
import { BotBrain } from "../bots/brain";
import { getNav, type NavGraph } from "../bots/nav";

export const STAND_H = 1.8;
export const CROUCH_H = 1.3;
export const EYE_STAND = 1.68;
export const EYE_CROUCH = 1.15;
const GRAVITY = 22;
const JUMP_V = Math.sqrt(2 * GRAVITY * 0.85);
export const SPEED_STAND = 5.2;
export const SPEED_CROUCH = 2.8;
export const SPEED_SPRINT = 7.1;
const ACCEL = 32;
const DECEL = 38;
const AIR_CONTROL = 0.2;
export const REGEN_DELAY = 5;
const REGEN_RATE = 22;
export const SPAWN_PROTECT = 2;

export const bodyHeight = (p: PlayerState): number => lerp(STAND_H, CROUCH_H, p.crouchT);
export const eyeHeight = (p: PlayerState): number => lerp(EYE_STAND, EYE_CROUCH, p.crouchT);
export function eyePos(p: PlayerState, out: Vec3 = v3()): Vec3 {
  out.x = p.pos.x; out.y = p.pos.y + eyeHeight(p); out.z = p.pos.z;
  return out;
}
/** Aim direction including recoil offsets. */
export function aimDir(p: PlayerState, out: Vec3 = v3()): Vec3 {
  return dirFromAngles(p.yaw + p.recoilY, clamp(p.pitch + p.recoilP, -1.55, 1.55), out);
}

export interface AddPlayerOpts { name: string; team: 0 | 1; isBot: boolean; loadout: Loadout }

export class World {
  cfg: MatchConfig;
  map: MapData;
  col: CollisionWorld;
  nav: NavGraph;
  time = 0;
  tickN = 0;
  players: PlayerState[] = [];
  events: SimEvent[] = [];
  match: MatchState;
  rng: Rng;
  projectiles: Projectile[] = [];
  deployables: Deployable[] = [];
  supportEvents: SupportEvent[] = [];
  uplinkUntil: [number, number] = [0, 0];
  flightUntil: [number, number] = [0, 0];
  deathHeat: Array<{ x: number; z: number; t: number; team: number }> = [];
  brains = new Map<number, BotBrain>();
  equipment: EquipmentSystem;
  support: SupportSystem;
  nextEntityId = 1;
  lastSpawnReason = "";
  /** pending glass-break events etc. are pushed to events. */
  teamKillsLast: number[] = [0, 0];
  /** Simulation CPU time of the most recent ticks (ms), for the perf readout. */
  tickMs = 0;

  constructor(cfg: Partial<MatchConfig> = {}, map: MapData = getK17()) {
    this.cfg = { ...DEFAULT_CONFIG, ...cfg };
    this.map = map;
    this.col = new CollisionWorld(map);
    this.col.reset();
    this.nav = getNav(this.col);
    this.rng = new Rng(this.cfg.seed);
    this.equipment = new EquipmentSystem(this);
    this.support = new SupportSystem(this);
    this.match = { phase: "warmup", clock: 0, phaseT: 0, teamScore: [0, 0], winner: -1, suddenTarget: 0, endReason: "", endedAt: 0 };
  }

  emit(e: SimEvent): void { this.events.push(e); }
  drainEvents(): SimEvent[] { const e = this.events; this.events = []; return e; }

  // ---------------------------------------------------------------- players
  addPlayer(o: AddPlayerOpts): PlayerState {
    const id = this.players.length;
    const loadout = sanitizeLoadout(o.loadout);
    const p: PlayerState = {
      id, name: o.name, team: o.team, isBot: o.isBot, loadout, perks: [...loadout.perks], alive: false,
      pos: v3(), prevPos: v3(), vel: v3(), yaw: 0, pitch: 0, prevYaw: 0, prevPitch: 0, recoilP: 0, recoilY: 0, onGround: true,
      crouching: false, crouchT: 0, sprinting: false, sprintHold: 0, sprintOutT: 0, adsT: 0, health: 100, lastDamageAt: -99, regenCarry: 0,
      weapons: [this.makeWeapon(loadout.primary, loadout), this.makeWeapon(loadout.secondary, loadout)], slot: 0, swapT: 0, swapTotal: 0.4,
      mantle: null, meleeT: 0, meleeCd: 0, meleePending: false,
      equip: { lethal: 1, tactical: 1, lethalCharge: 0, tacticalCharge: 0 }, cooking: null,
      momentum: 0, supportReady: [false, false, false], supportSelected: -1, supportUsed: [false, false, false],
      stats: { kills: 0, deaths: 0, assists: 0, score: 0, headshots: 0, supportKills: 0, shots: 0, hits: 0, bestMomentum: 0, damage: 0, supportDestroyed: 0, streak: 0, bestStreak: 0, medals: 0 },
      weaponStats: {}, damageLog: [], spawnProtectedUntil: 0, spawnPos: v3(), respawnAt: 0, deadAt: -99, recap: null,
      flashedUntil: 0, flashPower: 0, revealedUntil: [0, 0], cmd: emptyInput(), prevFire: false, prevLethalHeld: false, stepDist: 0,
      lastMoveSpeed: 0, lastFootstepLoud: 0, lastShotNoiseAt: -99, lastShotSuppressed: false, spawnedAt: 0, hitConfirmUntil: 0, lastSeenBy: -1,
      footprints: [], killedBy: -1, kdSeed: id * 977 + 13,
    };
    this.players.push(p);
    if (o.isBot) this.brains.set(id, new BotBrain(this, p, this.cfg.difficulty, hashSeed(this.cfg.seed, id)));
    return p;
  }

  private makeWeapon(id: string, l: Loadout): WeaponState {
    const stats = resolveWeaponStats(id, l.attachments, l.perks);
    return {
      id, stats, ammo: stats.magSize, reserve: stats.reserve, nextFireAt: 0, reloadT: -1, reloadTotal: 0, reloadEmpty: false, reloadStage: 0,
      shellT: 0, shotIndex: 0, lastShotAt: -99, bloom: 0, cycling: 0, shotsFired: 0, shotsHit: 0, kills: 0, headshots: 0,
    };
  }

  /** Loadout changes apply at next spawn. */
  queueLoadout(p: PlayerState, l: Loadout): void { p.loadout = sanitizeLoadout(l, p.loadout); }

  spawnPlayer(p: PlayerState): void {
    const sp = chooseSpawn(this, p);
    p.perks = [...p.loadout.perks];
    p.weapons = [this.makeWeapon(p.loadout.primary, p.loadout), this.makeWeapon(p.loadout.secondary, p.loadout)];
    p.slot = 0; p.swapT = p.weapons[0].stats.swapTime * 0.8; p.swapTotal = p.swapT;
    p.pos = cloneV(sp.spawn.pos); p.prevPos = cloneV(p.pos); p.vel = v3(); p.yaw = sp.spawn.yaw; p.pitch = 0;
    p.prevYaw = p.yaw; p.prevPitch = 0; p.recoilP = 0; p.recoilY = 0; p.onGround = true; p.crouching = false; p.crouchT = 0;
    p.sprinting = false; p.sprintHold = 0; p.sprintOutT = 0; p.adsT = 0; p.health = 100; p.lastDamageAt = -99; p.mantle = null;
    p.meleeT = 0; p.meleeCd = 0; p.meleePending = false; p.cooking = null;
    p.equip.lethal = EQUIPMENT[p.loadout.lethal].charges; p.equip.tactical = EQUIPMENT[p.loadout.tactical].charges;
    p.equip.lethalCharge = 0; p.equip.tacticalCharge = 0;
    p.momentum = 0; p.supportReady = [false, false, false]; p.supportUsed = [false, false, false]; p.supportSelected = -1;
    p.damageLog = []; p.alive = true; p.spawnProtectedUntil = this.time + SPAWN_PROTECT; p.spawnPos = cloneV(p.pos);
    p.flashedUntil = 0; p.spawnedAt = this.time; p.recap = null; p.footprints = [];
    p.stats.streak = 0;
    this.emit({ t: "spawn", id: p.id, pos: cloneV(p.pos), reason: sp.reason });
    this.lastSpawnReason = sp.reason;
    this.brains.get(p.id)?.onSpawn();
  }

  // ---------------------------------------------------------------- tick
  tick(dt = SIM_DT): void {
    const t0 = typeof performance !== "undefined" ? performance.now() : 0;
    this.time += dt;
    this.tickN++;
    const m = this.match;
    m.phaseT += dt;
    if (m.phase === "warmup") {
      if (m.phaseT >= this.cfg.warmup) {
        m.phase = "live"; m.phaseT = 0; m.clock = 0;
        this.emit({ t: "phase", phase: "live" });
        this.emit({ t: "announce", text: "Team Clash is live" });
        for (const p of this.players) p.spawnProtectedUntil = this.time + SPAWN_PROTECT;
      }
    } else if (m.phase === "live" || m.phase === "sudden") {
      m.clock += dt;
    }
    const frozen = m.phase === "warmup" || m.phase === "ended";
    for (const p of this.players) {
      const brain = this.brains.get(p.id);
      if (brain && p.alive && !frozen) brain.think(dt);
      if (p.alive) {
        p.prevPos.x = p.pos.x; p.prevPos.y = p.pos.y; p.prevPos.z = p.pos.z; p.prevYaw = p.yaw; p.prevPitch = p.pitch;
        this.stepPlayer(p, frozen ? emptyInput() : p.cmd, dt, frozen);
      } else if (p.deadAt < -50) {
        this.spawnPlayer(p);
      } else if (!frozen && this.time >= p.respawnAt) {
        this.spawnPlayer(p);
      }
    }
    this.equipment.update(dt);
    this.support.update(dt);
    // smoke growth/cleanup
    for (let i = this.col.smokes.length - 1; i >= 0; i--) if (this.col.smokes[i].until < this.time) this.col.smokes.splice(i, 1);
    // heat decay
    if (this.deathHeat.length && this.deathHeat[0].t < this.time - 25) this.deathHeat.shift();
    this.checkMatchEnd();
    for (const p of this.players) { p.cmd = { ...p.cmd, jump: false, reload: false, melee: false, lethal: false, tactical: false, selectSlot: -1, supportCycle: false, supportDeploy: false, interact: false, fireModeToggle: false }; }
    if (t0) this.tickMs = this.tickMs * 0.95 + (performance.now() - t0) * 0.05;
  }

  // ---------------------------------------------------------------- movement + weapon state
  private stepPlayer(p: PlayerState, cmd: InputCmd, dt: number, frozen: boolean): void {
    const w = p.weapons[p.slot];
    const st = w.stats;
    const def = st.def;
    const prevCmdFire = p.prevFire;
    if (!frozen) { p.yaw = cmd.yaw; p.pitch = clamp(cmd.pitch, -1.5, 1.5); }

    // -------- stance
    const wantCrouch = cmd.crouch && !p.mantle;
    if (wantCrouch) p.crouching = true;
    else if (p.crouching && !this.col.blocked(p.pos.x, p.pos.y + 0.05, p.pos.z, BODY_HALF, STAND_H)) p.crouching = false;
    p.crouchT = clamp(p.crouchT + (p.crouching ? 1 : -1) * dt / 0.18, 0, 1);

    // -------- mantle state overrides movement
    if (p.mantle) {
      const mt = p.mantle;
      mt.t += dt;
      const k = clamp(mt.t / mt.dur, 0, 1);
      const e = k * k * (3 - 2 * k);
      p.pos.x = lerp(mt.start.x, mt.end.x, e);
      p.pos.z = lerp(mt.start.z, mt.end.z, e);
      p.pos.y = lerp(mt.start.y, mt.end.y, Math.min(1, k * 1.6)) + Math.sin(k * Math.PI) * 0.12;
      p.vel.x = p.vel.y = p.vel.z = 0;
      if (k >= 1) { p.mantle = null; p.pos.y = mt.end.y; p.onGround = true; }
      this.updateWeaponTimers(p, w, dt, cmd);
      return;
    }

    // -------- sprint
    const fwd = cmd.forward, str = cmd.strafe;
    const moving = Math.hypot(fwd, str) > 0.1;
    const wantSprint = cmd.sprint && fwd > 0.3 && !p.crouching && p.onGround && !cmd.ads && !cmd.fire && p.meleeT <= 0 && !p.cooking;
    if (wantSprint) p.sprintHold += dt; else p.sprintHold = 0;
    p.sprinting = p.sprintHold >= 0.12;
    if (p.sprinting) p.sprintOutT = st.sprintOut;
    else p.sprintOutT = Math.max(0, p.sprintOutT - dt);

    // -------- ADS
    const adsOk = cmd.ads && !p.sprinting && p.swapT <= 0 && !(w.reloadT >= 0 && def.fireMode !== "pump" && w.reloadStage < 2) && !p.mantle && w.cycling <= 0;
    p.adsT = clamp(p.adsT + (adsOk ? 1 : -1.25) * dt / Math.max(0.08, st.adsTime), 0, 1);

    // -------- horizontal movement
    let base = p.crouching ? SPEED_CROUCH : p.sprinting ? SPEED_SPRINT : SPEED_STAND;
    base *= st.moveMul;
    base *= lerp(1, st.adsMove, p.adsT);
    if (p.perks.includes("fleet")) base *= 1.04;
    if (p.meleeT > 0) base *= 0.5;
    if (p.cooking) base *= 0.9;
    const sy = Math.sin(p.yaw), cy = Math.cos(p.yaw);
    let wx = sy * fwd + cy * str;
    let wz = cy * fwd - sy * str;
    const wl = Math.hypot(wx, wz);
    if (wl > 1) { wx /= wl; wz /= wl; }
    const tx = wx * base, tz = wz * base;
    const rate = (p.onGround ? 1 : AIR_CONTROL);
    const dvx = tx - p.vel.x, dvz = tz - p.vel.z;
    const dvl = Math.hypot(dvx, dvz);
    if (dvl > 1e-6) {
      const a = (moving ? (Math.hypot(tx, tz) >= Math.hypot(p.vel.x, p.vel.z) ? ACCEL : DECEL) : DECEL) * rate * dt;
      const k = Math.min(1, a / dvl);
      p.vel.x += dvx * k; p.vel.z += dvz * k;
    }

    // -------- jump / mantle
    if (cmd.jump && p.onGround && !p.crouching && !frozen) {
      const tryDir = moving ? { x: wx, z: wz } : { x: sy, z: cy };
      const ledge = this.col.findMantle(p.pos, tryDir.x, tryDir.z, BODY_HALF, STAND_H);
      if (ledge && (fwd > 0.1 || !moving)) {
        const dur = p.perks.includes("quickmantle") ? 0.3 : 0.46;
        p.mantle = { t: 0, dur, start: cloneV(p.pos), end: { x: ledge.end.x, y: ledge.top, z: ledge.end.z } };
        p.sprinting = false; p.sprintHold = 0;
        this.emit({ t: "mantle", id: p.id });
      } else {
        p.vel.y = JUMP_V; p.onGround = false;
        this.emit({ t: "jump", id: p.id });
      }
    }
    if (p.mantle) { this.updateWeaponTimers(p, w, dt, cmd); return; }

    p.vel.y -= GRAVITY * dt;
    const wasGround = p.onGround;
    const res = this.col.moveBody(p.pos, p.vel, dt, BODY_HALF, bodyHeight(p), wasGround);
    p.onGround = res.onGround;
    if (res.onGround && !wasGround && res.landedSpeed > 2.5) this.emit({ t: "land", id: p.id, hard: res.landedSpeed > 7 });
    const hs = Math.hypot(p.vel.x, p.vel.z);
    p.lastMoveSpeed = hs;
    // footsteps
    if (p.onGround && hs > 0.8) {
      p.stepDist += hs * dt;
      const stride = p.sprinting ? 2.5 : p.crouching ? 1.5 : 1.95;
      if (p.stepDist >= stride) {
        p.stepDist = 0;
        let loud = p.sprinting ? 20 : p.crouching ? 5 : 12;
        if (p.perks.includes("fleet")) loud *= 1.15;
        const surface: SurfaceTag = p.pos.y > 1 ? "metal" : this.map.indoorAt(p.pos.x, p.pos.z) ? "metal" : "concrete";
        p.lastFootstepLoud = this.time;
        this.emit({ t: "step", id: p.id, pos: cloneV(p.pos), loud, surface });
        if (p.sprinting) { p.footprints.push({ x: p.pos.x, z: p.pos.z, t: this.time }); if (p.footprints.length > 12) p.footprints.shift(); }
      }
    }

    // -------- weapon handling
    if (cmd.selectSlot >= 0 && cmd.selectSlot !== p.slot) this.swapTo(p, cmd.selectSlot as 0 | 1);
    this.updateWeaponTimers(p, w, dt, cmd);
    const cw = p.weapons[p.slot];
    if (!frozen) {
      if (cmd.reload) this.startReload(p, cw, false);
      if (cmd.melee && p.meleeCd <= 0 && p.meleeT <= 0 && p.swapT <= 0) { p.meleeT = 0.16; p.meleePending = true; p.meleeCd = 0.85; this.cancelReload(p, cw); p.sprinting = false; p.sprintHold = 0; }
      if (p.meleeT > 0) {
        p.meleeT -= dt;
        // lunge (capped)
        if (p.meleePending) { p.vel.x += sy * 6 * dt * 10; p.vel.z += cy * 6 * dt * 10; }
        if (p.meleeT <= 0 && p.meleePending) { p.meleePending = false; this.doMelee(p); }
      }
      p.meleeCd = Math.max(0, p.meleeCd - dt);
      this.equipment.handleInput(p, cmd);
      this.support.handleInput(p, cmd);
      this.tryFire(p, cw, cmd, prevCmdFire);
    }
    p.prevFire = cmd.fire;

    // -------- regen
    if (p.alive && p.health < 100 && this.time - p.lastDamageAt >= REGEN_DELAY - (p.perks.includes("fieldpatch") ? 0.8 : 0)) {
      p.health = Math.min(100, p.health + REGEN_RATE * dt);
    }
    // -------- spawn protection end
    if (p.spawnProtectedUntil > this.time && dist2D(p.pos, p.spawnPos) > 5) p.spawnProtectedUntil = 0;
    // -------- recoil recovery
    const r = cw.stats.def.recoil;
    if (this.time - cw.lastShotAt > r.recoverDelay) {
      const rec = Math.min(Math.hypot(p.recoilP, p.recoilY), cw.stats.recoverRate * DEG * dt);
      const mag = Math.hypot(p.recoilP, p.recoilY);
      if (mag > 1e-6) { const k = (mag - rec) / mag; p.recoilP *= k; p.recoilY *= k; }
    }
    // bloom decay
    cw.bloom = Math.max(0, cw.bloom - cw.stats.def.bloomRecover * dt);
    if (this.time - cw.lastShotAt > 0.28) cw.shotIndex = 0;
  }

  private updateWeaponTimers(p: PlayerState, w: WeaponState, dt: number, cmd: InputCmd): void {
    if (p.swapT > 0) p.swapT = Math.max(0, p.swapT - dt);
    if (w.cycling > 0) w.cycling = Math.max(0, w.cycling - dt);
    // reload progression
    if (w.reloadT >= 0) {
      const def = w.stats.def;
      if (def.fireMode === "pump" && def.shellReload) {
        w.reloadT += dt;
        if (w.reloadStage === 0 && w.reloadT >= 0.35) { w.reloadStage = 1; this.emit({ t: "reload", id: p.id, stage: "magOut", empty: false }); w.shellT = 0; }
        if (w.reloadStage >= 1) {
          w.shellT += dt;
          if (w.shellT >= def.shellReload) {
            w.shellT = 0;
            if (w.ammo < w.stats.magSize && w.reserve > 0) { w.ammo++; w.reserve--; this.emit({ t: "reload", id: p.id, stage: "magIn", empty: false }); }
            if (w.ammo >= w.stats.magSize || w.reserve <= 0) { w.reloadT = -1; w.reloadStage = 0; this.emit({ t: "reload", id: p.id, stage: "end", empty: false }); }
          }
        }
      } else {
        w.reloadT += dt;
        const T = w.reloadTotal;
        if (w.reloadStage === 0 && w.reloadT >= T * 0.34) { w.reloadStage = 1; this.emit({ t: "reload", id: p.id, stage: "magOut", empty: w.reloadEmpty }); }
        if (w.reloadStage === 1 && w.reloadT >= T * 0.72) {
          w.reloadStage = 2;
          const need = w.stats.magSize - w.ammo;
          const take = Math.min(need, w.reserve);
          w.ammo += take; w.reserve -= take;
          this.emit({ t: "reload", id: p.id, stage: "magIn", empty: w.reloadEmpty });
        }
        if (w.reloadT >= T) { w.reloadT = -1; w.reloadStage = 0; this.emit({ t: "reload", id: p.id, stage: "end", empty: w.reloadEmpty }); }
      }
    }
    void cmd;
  }

  private swapTo(p: PlayerState, slot: 0 | 1): void {
    if (p.swapT > 0 && false) return;
    this.cancelReload(p, p.weapons[p.slot]);
    p.slot = slot;
    p.swapT = p.weapons[slot].stats.swapTime;
    p.swapTotal = p.swapT;
    p.adsT = 0;
    this.emit({ t: "swap", id: p.id, slot });
  }

  cancelReload(p: PlayerState, w: WeaponState): void {
    if (w.reloadT >= 0) {
      if (w.stats.def.fireMode === "pump") { /* shells already inserted stay */ }
      w.reloadT = -1; w.reloadStage = 0; w.shellT = 0;
      this.emit({ t: "reload", id: p.id, stage: "cancel", empty: false });
    }
  }

  startReload(p: PlayerState, w: WeaponState, auto: boolean): boolean {
    if (w.reloadT >= 0 || p.swapT > 0 || p.mantle) return false;
    if (w.ammo >= w.stats.magSize || w.reserve <= 0) return false;
    const empty = w.ammo === 0;
    w.reloadT = 0; w.reloadStage = 0; w.reloadEmpty = empty; w.shellT = 0;
    w.reloadTotal = empty ? w.stats.reloadEmpty : w.stats.reloadTactical;
    p.adsT = Math.min(p.adsT, 0.5);
    this.emit({ t: "reload", id: p.id, stage: "start", empty });
    void auto;
    return true;
  }

  private tryFire(p: PlayerState, w: WeaponState, cmd: InputCmd, prevFire: boolean): void {
    const def = w.stats.def;
    const press = cmd.fire && !prevFire;
    const wants = def.fireMode === "auto" ? cmd.fire : press;
    if (!wants) return;
    if (p.swapT > 0 || p.mantle || p.meleeT > 0 || p.cooking) return;
    if (p.sprinting) { p.sprinting = false; p.sprintHold = 0; return; }
    if (p.sprintOutT > 0 && !p.sprinting) { return; }
    // pump shotguns may interrupt shell reload
    if (w.reloadT >= 0) {
      if (def.fireMode === "pump" && w.reloadStage >= 1 && w.ammo > 0) { w.reloadT = -1; w.reloadStage = 0; this.emit({ t: "reload", id: p.id, stage: "cancel", empty: false }); }
      else return;
    }
    if (this.time + 1e-6 < w.nextFireAt || w.cycling > 0) return;
    if (w.ammo <= 0) {
      if (press || def.fireMode === "auto") {
        this.emit({ t: "empty", id: p.id });
        w.nextFireAt = this.time + 0.25;
        if (w.reserve > 0) this.startReload(p, w, true);
      }
      return;
    }
    this.fireWeapon(p, w);
  }

  // ---------------------------------------------------------------- shooting
  private currentSpread(p: PlayerState, w: WeaponState): number {
    const st = w.stats;
    const hip = st.hipSpread + st.hipSpreadMove * clamp(p.lastMoveSpeed / SPEED_STAND, 0, 1.3) * (1 - p.adsT);
    let s = lerp(hip, st.adsSpread, p.adsT);
    if (p.crouching) s *= st.def.crouchSpreadMul;
    if (!p.onGround) s += 2.5;
    s += w.bloom * (1 - p.adsT * 0.5);
    if (w.shotIndex === 0 && st.def.firstShotAccurate && st.def.pellets === 1) s *= 0.35;
    if (this.time < p.flashedUntil) s += 3;
    return s;
  }

  private fireWeapon(p: PlayerState, w: WeaponState): void {
    const st = w.stats;
    const def = st.def;
    const t = this.time;
    w.ammo--;
    w.shotsFired++;
    p.stats.shots++;
    (p.weaponStats[def.id] ??= { shots: 0, hits: 0, kills: 0, headshots: 0 }).shots++;
    w.nextFireAt = (t - w.nextFireAt < SIM_DT * 1.01 && w.nextFireAt > 0 ? w.nextFireAt : t) + st.interval;
    if (def.fireMode === "pump" || def.fireMode === "bolt") w.cycling = st.interval * 0.92;
    w.lastShotAt = t;
    p.lastShotNoiseAt = t;
    p.lastShotSuppressed = st.suppressed;
    if (p.spawnProtectedUntil > t) p.spawnProtectedUntil = 0;
    const eye = eyePos(p);
    const base = aimDir(p);
    const spread = this.currentSpread(p, w);
    const seed = hashSeed(this.tickN, p.id, w.shotsFired);
    const r = new Rng(seed);
    let anyHit = false;
    let firstHitPos: Vec3 | undefined;
    let firstSurface: SurfaceTag | undefined;
    let firstNormal: Vec3 | undefined;
    const tracer = def.tracerEvery > 0 && !st.suppressed && w.shotsFired % def.tracerEvery === 0;
    for (let i = 0; i < def.pellets; i++) {
      const dir = perturb(base, spread * DEG * (def.pellets > 1 ? 1 : 1), r, def.pellets > 1);
      const res = this.traceBullet(p, w, eye, dir);
      if (res.hitPlayer) anyHit = true;
      if (i === 0) { firstHitPos = res.point; firstSurface = res.surface; firstNormal = res.normal; }
      if (def.pellets > 1 && i > 0 && res.point) this.emit({ t: "shot", id: p.id, weapon: def.id, origin: cloneV(eye), dir, suppressed: st.suppressed, hit: res.point, surface: res.surface, normal: res.normal, tracer: false });
    }
    this.emit({ t: "shot", id: p.id, weapon: def.id, origin: cloneV(eye), dir: base, suppressed: st.suppressed, hit: firstHitPos, surface: firstSurface, normal: firstNormal, tracer });
    if (anyHit) { w.shotsHit++; p.stats.hits++; (p.weaponStats[def.id] ??= { shots: 0, hits: 0, kills: 0, headshots: 0 }).hits++; }
    // recoil
    const pat = recoilPattern(def)[Math.min(w.shotIndex, 63)];
    const rr = new Rng(hashSeed(seed, 77));
    const pitch = (pat[0] * st.recoilPitch + (rr.next() - 0.5) * def.recoil.variance) * DEG;
    const yaw = (pat[1] * st.recoilYaw + (rr.next() - 0.5) * def.recoil.variance * 0.6) * DEG;
    const adsK = lerp(1, 0.8, p.adsT);
    const crouchK = p.crouching ? (def.cls === "lmg" ? 0.55 : 0.88) : 1;
    p.recoilP = Math.min(p.recoilP + pitch * adsK * crouchK, 14 * DEG);
    p.recoilY += yaw * adsK;
    w.shotIndex++;
    w.bloom = Math.min(def.bloomMax, w.bloom + def.bloomPerShot);
    p.adsT = Math.max(0, p.adsT - (def.fireMode === "bolt" ? 0.5 : 0));
  }

  /** Zone-classified ray against enemy player hitboxes. */
  private rayPlayers(shooter: PlayerState, o: Vec3, d: Vec3, maxT: number): { p: PlayerState; t: number; zone: HitZone; point: Vec3 } | null {
    let best: { p: PlayerState; t: number; zone: HitZone; point: Vec3 } | null = null;
    for (const q of this.players) {
      if (!q.alive || q === shooter || q.team === shooter.team) continue;
      const h = bodyHeight(q);
      const px = q.pos.x, py = q.pos.y, pz = q.pos.z;
      // quick reject using bounding cylinder
      const toX = px - o.x, toZ = pz - o.z;
      const proj = toX * d.x + toZ * d.z;
      if (proj < -1 || proj > maxT + 1) { /* behind or beyond - still maybe vertical; fine */ }
      const parts: Array<{ zone: HitZone; min: Vec3; max: Vec3 }> = [
        { zone: "head", min: { x: px - 0.16, y: py + h - 0.27, z: pz - 0.16 }, max: { x: px + 0.16, y: py + h + 0.01, z: pz + 0.16 } },
        { zone: "upper", min: { x: px - 0.27, y: py + h * 0.6, z: pz - 0.27 }, max: { x: px + 0.27, y: py + h - 0.27, z: pz + 0.27 } },
        { zone: "lower", min: { x: px - 0.25, y: py + h * 0.46, z: pz - 0.25 }, max: { x: px + 0.25, y: py + h * 0.6, z: pz + 0.25 } },
        { zone: "limb", min: { x: px - 0.22, y: py, z: pz - 0.22 }, max: { x: px + 0.22, y: py + h * 0.46, z: pz + 0.22 } },
      ];
      for (const part of parts) {
        const r = CollisionWorld.rayBox(o, d, part.min, part.max);
        if (!r || r.t0 > maxT) continue;
        if (!best || r.t0 < best.t) best = { p: q, t: r.t0, zone: part.zone, point: { x: o.x + d.x * r.t0, y: o.y + d.y * r.t0, z: o.z + d.z * r.t0 } };
      }
    }
    return best;
  }

  private traceBullet(p: PlayerState, w: WeaponState, eye: Vec3, dir: Vec3): { hitPlayer: boolean; point?: Vec3; surface?: SurfaceTag; normal?: Vec3 } {
    const def = w.stats.def;
    let origin = eye;
    let energy = def.penetration;
    let dmgMul = 1;
    let travelled = 0;
    let firstPoint: Vec3 | undefined;
    let firstSurface: SurfaceTag | undefined;
    let firstNormal: Vec3 | undefined;
    for (let iter = 0; iter < 5; iter++) {
      const wh = this.col.raycast(origin, dir, 220 - travelled, true);
      const tw = wh ? wh.t : 220 - travelled;
      const ph = this.rayPlayers(p, origin, dir, tw);
      const dep = this.rayDeployables(p, origin, dir, tw);
      if (ph && (!dep || ph.t <= dep.t)) {
        const dist = travelled + ph.t;
        let amount = w.stats.damage * falloffMul(def, dist, w.stats.falloffRange) * def.zoneMul[ph.zone] * dmgMul;
        if (def.lethalRange && (ph.zone === "head" || ph.zone === "upper")) amount = dist <= def.lethalRange ? Math.max(amount, 100) : Math.min(amount, 88);
        this.damagePlayer(ph.p, p.id, amount, ph.zone, def.id, ph.point, dist, false, origin);
        if (!firstPoint) { firstPoint = ph.point; firstSurface = "flesh"; firstNormal = { x: -dir.x, y: -dir.y, z: -dir.z }; }
        return { hitPlayer: true, point: firstPoint, surface: firstSurface, normal: firstNormal };
      }
      if (dep) {
        this.support.damageDeployable(dep.d, p, w.stats.damage * falloffMul(def, travelled + dep.t, w.stats.falloffRange), def.id);
        if (!firstPoint) { firstPoint = dep.point; firstSurface = "metal"; firstNormal = { x: -dir.x, y: -dir.y, z: -dir.z }; }
        return { hitPlayer: true, point: firstPoint, surface: firstSurface, normal: firstNormal };
      }
      if (!wh) return { hitPlayer: false, point: firstPoint ?? { x: origin.x + dir.x * tw, y: origin.y + dir.y * tw, z: origin.z + dir.z * tw }, surface: firstSurface, normal: firstNormal };
      const surface = surfaceOf(wh.box);
      const hitPoint = wh.point;
      if (!firstPoint) { firstPoint = hitPoint; firstSurface = surface; firstNormal = wh.normal; }
      this.emit({ t: "impact", pos: cloneV(hitPoint), normal: wh.normal, surface });
      travelled += wh.t;
      const box = wh.box;
      if (box && box.breakable) {
        this.col.breakBox(box);
        this.emit({ t: "glass", id: box.id, pos: cloneV(hitPoint) });
        origin = { x: hitPoint.x + dir.x * 0.05, y: hitPoint.y + dir.y * 0.05, z: hitPoint.z + dir.z * 0.05 };
        continue;
      }
      if (box && Number.isFinite(box.cost) && box.cost > 0) {
        const r = CollisionWorld.rayBox(origin, dir, box.min, box.max);
        const thick = r ? Math.max(0.02, Math.min(r.t1, 50) - r.t0) : 0.3;
        const need = thick * box.cost;
        if (energy >= need && thick < 2.5) {
          energy -= need;
          dmgMul *= 0.65;
          const exitT = r ? r.t1 : wh.t + thick;
          origin = { x: origin.x + dir.x * (exitT + 0.03), y: origin.y + dir.y * (exitT + 0.03), z: origin.z + dir.z * (exitT + 0.03) };
          travelled += exitT - wh.t;
          continue;
        }
      }
      return { hitPlayer: false, point: firstPoint, surface: firstSurface, normal: firstNormal };
    }
    return { hitPlayer: false, point: firstPoint, surface: firstSurface, normal: firstNormal };
  }

  private rayDeployables(p: PlayerState, o: Vec3, d: Vec3, maxT: number): { d: Deployable; t: number; point: Vec3 } | null {
    let best: { d: Deployable; t: number; point: Vec3 } | null = null;
    for (const dep of this.deployables) {
      if (dep.team === p.team) continue;
      const rad = dep.kind === "drone" ? 0.55 : 0.5;
      const cx = dep.pos.x - o.x, cy = dep.pos.y + (dep.kind === "pod" ? 0.4 : 0) - o.y, cz = dep.pos.z - o.z;
      const tc = cx * d.x + cy * d.y + cz * d.z;
      if (tc < 0 || tc > maxT) continue;
      const px = o.x + d.x * tc - dep.pos.x, py = o.y + d.y * tc - (dep.pos.y + (dep.kind === "pod" ? 0.4 : 0)), pz = o.z + d.z * tc - dep.pos.z;
      if (px * px + py * py + pz * pz <= rad * rad && (!best || tc < best.t)) best = { d: dep, t: tc, point: { x: o.x + d.x * tc, y: o.y + d.y * tc, z: o.z + d.z * tc } };
    }
    return best;
  }

  private doMelee(p: PlayerState): void {
    const eye = eyePos(p);
    const f = dirFromAngles(p.yaw, 0);
    let hitAny = false;
    for (const q of this.players) {
      if (!q.alive || q.team === p.team) continue;
      const dx = q.pos.x - p.pos.x, dz = q.pos.z - p.pos.z, dy = q.pos.y - p.pos.y;
      const dist = Math.hypot(dx, dz);
      if (dist > 1.9 || Math.abs(dy) > 1.2) continue;
      const dot = (dx * f.x + dz * f.z) / Math.max(dist, 0.001);
      if (dot < 0.55) continue;
      const target = { x: q.pos.x, y: q.pos.y + 1.2, z: q.pos.z };
      if (!this.col.lineClear(eye, target, this.time)) continue;
      const back = Math.cos(q.yaw) * f.z + Math.sin(q.yaw) * f.x > 0.5;
      this.damagePlayer(q, p.id, back ? 100 : 55, "upper", "melee", target, dist, false, eye);
      hitAny = true;
      break;
    }
    this.emit({ t: "melee", id: p.id, hit: hitAny });
  }

  // ---------------------------------------------------------------- damage & kills
  /** Returns true if the damage killed the victim. */
  damagePlayer(v: PlayerState, attackerId: number, amount: number, zone: HitZone, weapon: string, point: Vec3, dist: number, support: boolean, from: Vec3): boolean {
    if (!v.alive || amount <= 0) return false;
    if (this.match.phase === "warmup" || this.match.phase === "ended") return false;
    if (v.spawnProtectedUntil > this.time) return false;
    const attacker = attackerId >= 0 ? this.players[attackerId] : null;
    if (attacker && attacker.team === v.team && attacker.id !== v.id) return false;
    const dealt = Math.min(v.health, amount);
    v.health -= amount;
    v.lastDamageAt = this.time;
    v.damageLog.push({ t: this.time, attacker: attackerId, amount: dealt, zone, weapon, from: cloneV(from), support });
    if (v.damageLog.length > 24) v.damageLog.shift();
    if (attacker && attacker.id !== v.id) { attacker.stats.damage += dealt; attacker.hitConfirmUntil = this.time + 0.2; }
    const kill = v.health <= 0;
    this.emit({ t: "damaged", victim: v.id, attacker: attackerId, from: cloneV(from), damage: dealt, source: weapon });
    this.emit({ t: "hit", attacker: attackerId, victim: v.id, zone, damage: dealt, kill, weapon, pos: cloneV(point) });
    if (v.health > 0 && v.cooking === null && false) return false;
    if (kill) this.killPlayer(v, attackerId, weapon, zone === "head", dist, support);
    return kill;
  }

  private killPlayer(v: PlayerState, attackerId: number, weapon: string, headshot: boolean, dist: number, support: boolean): void {
    v.alive = false; v.health = 0; v.deadAt = this.time; v.respawnAt = this.time + this.cfg.respawnDelay;
    v.stats.deaths++; v.stats.streak = 0;
    v.momentum = 0; v.supportReady = [false, false, false]; v.supportUsed = [false, false, false]; v.supportSelected = -1;
    v.cooking = null; v.mantle = null;
    this.deathHeat.push({ x: v.pos.x, z: v.pos.z, t: this.time, team: v.team });
    const attacker = attackerId >= 0 && attackerId !== v.id ? this.players[attackerId] : null;
    const assists: number[] = [];
    if (attacker && attacker.team !== v.team) {
      attacker.stats.kills++;
      attacker.stats.streak++;
      attacker.stats.bestStreak = Math.max(attacker.stats.bestStreak, attacker.stats.streak);
      attacker.stats.score += 100 + (headshot ? 25 : 0);
      if (support) attacker.stats.supportKills++;
      if (headshot) attacker.stats.headshots++;
      const ws = (attacker.weaponStats[weapon] ??= { shots: 0, hits: 0, kills: 0, headshots: 0 });
      ws.kills++; if (headshot) ws.headshots++;
      const aw = attacker.weapons.find((x) => x.id === weapon);
      if (aw) { aw.kills++; if (headshot) aw.headshots++; }
      this.match.teamScore[attacker.team]++;
      this.emit({ t: "teamScore", team: attacker.team, score: this.match.teamScore[attacker.team] });
      this.emit({ t: "score", player: attacker.id, points: 100 + (headshot ? 25 : 0), label: headshot ? "Headshot" : "Elimination" });
      if (!support) this.addMomentum(attacker, 1);
      // assists
      const seen = new Set<number>();
      let totalBy: Record<number, number> = {};
      for (const e of v.damageLog) {
        if (this.time - e.t > 8 || e.attacker < 0 || e.attacker === attacker.id) continue;
        const q = this.players[e.attacker];
        if (!q || q.team === v.team) continue;
        totalBy[e.attacker] = (totalBy[e.attacker] ?? 0) + e.amount;
      }
      for (const [k, amt] of Object.entries(totalBy)) {
        if (amt >= 20 && !seen.has(+k)) { seen.add(+k); assists.push(+k); }
      }
      if (this.uplinkUntil[attacker.team] > this.time) {
        for (const q of this.players) if (q.alive && q.team === attacker.team && q.id !== attacker.id && !seen.has(q.id) && dist2D(q.pos, attacker.pos) < 30) { seen.add(q.id); assists.push(q.id); }
      }
      for (const a of assists) {
        const q = this.players[a];
        q.stats.assists++; q.stats.score += 50;
        this.addMomentum(q, 1);
        this.emit({ t: "assist", player: a, victim: v.id });
        this.emit({ t: "score", player: a, points: 50, label: "Assist" });
      }
    }
    this.emit({ t: "kill", attacker: attackerId, victim: v.id, weapon, headshot, assists, distance: dist, support });
    // recap
    const aw = attacker ? attacker.weapons[attacker.slot] : null;
    const recap: RecapInfo = {
      attacker: attacker ? attacker.id : -1,
      attackerName: attacker ? attacker.name : "Environment",
      attackerTeam: attacker ? attacker.team : -1,
      weapon, weaponClass: WEAPONS[weapon]?.cls ?? weapon, distance: dist, headshot,
      timeline: v.damageLog.filter((e) => this.time - e.t <= 3).map((e) => ({ ago: this.time - e.t, amount: Math.round(e.amount), zone: e.zone })),
      fromYaw: attacker ? Math.atan2(attacker.pos.x - v.pos.x, attacker.pos.z - v.pos.z) : v.yaw,
      support: support ? weapon : "",
      killerPos: attacker ? cloneV(attacker.pos) : cloneV(v.pos),
      killerAimYaw: attacker ? attacker.yaw : 0, killerAimPitch: attacker ? attacker.pitch : 0,
    };
    void aw;
    v.recap = recap;
    v.killedBy = attacker ? attacker.id : -1;
    this.brains.get(v.id)?.onDeath(attacker ? attacker.id : -1);
  }

  addMomentum(p: PlayerState, n: number): void {
    const before = p.momentum;
    p.momentum += n;
    p.stats.bestMomentum = Math.max(p.stats.bestMomentum, p.momentum);
    this.emit({ t: "momentum", player: p.id, value: p.momentum, tier: -1 });
    SUPPORT_TIERS.forEach((tier, i) => {
      if (before < tier && p.momentum >= tier && !p.supportUsed[i]) {
        p.supportReady[i] = true;
        this.emit({ t: "supportReady", player: p.id, support: p.loadout.support[i] });
        if (p.supportSelected < 0 || i > p.supportSelected) p.supportSelected = i;
      }
    });
  }

  // ---------------------------------------------------------------- match flow
  private checkMatchEnd(): void {
    const m = this.match;
    if (m.phase === "ended" || m.phase === "warmup") return;
    const [a, b] = m.teamScore;
    if (m.phase === "live") {
      if (a >= this.cfg.scoreLimit || b >= this.cfg.scoreLimit) { this.endMatch(a > b ? 0 : 1, "Score limit reached"); return; }
      if (m.clock >= this.cfg.timeLimit) {
        if (a !== b) this.endMatch(a > b ? 0 : 1, "Time expired");
        else {
          m.phase = "sudden"; m.phaseT = 0; m.suddenTarget = a + this.cfg.suddenDeathBonus;
          this.emit({ t: "phase", phase: "sudden" });
          this.emit({ t: "announce", text: `Sudden death: first to ${m.suddenTarget}` });
        }
      }
    } else if (m.phase === "sudden") {
      if (a >= m.suddenTarget || b >= m.suddenTarget) this.endMatch(a > b ? 0 : 1, "Sudden death");
      else if (m.phaseT >= this.cfg.suddenDeathSeconds) this.endMatch(a === b ? 2 : a > b ? 0 : 1, a === b ? "Draw" : "Sudden death time");
    }
  }

  private endMatch(winner: 0 | 1 | 2, reason: string): void {
    const m = this.match;
    m.phase = "ended"; m.winner = winner; m.endReason = reason; m.endedAt = this.time; m.phaseT = 0;
    this.emit({ t: "phase", phase: "ended" });
  }

  get timeRemaining(): number {
    if (this.match.phase === "sudden") return Math.max(0, this.cfg.suddenDeathSeconds - this.match.phaseT);
    return Math.max(0, this.cfg.timeLimit - this.match.clock);
  }
  forceEnd(): void { if (this.match.phase !== "ended") this.endMatch(this.match.teamScore[0] === this.match.teamScore[1] ? 2 : this.match.teamScore[0] > this.match.teamScore[1] ? 0 : 1, "Match ended"); }
}

export function surfaceOf(b: MapBox | null): SurfaceTag {
  if (!b) return "concrete";
  switch (b.mat) {
    case "glass": return "glass";
    case "metal": case "rail": return "metal";
    case "wood": case "thin": return "wood";
    case "rock": return "dirt";
    default: return "concrete";
  }
}

function perturb(dir: Vec3, spreadRad: number, rng: Rng, uniformDisc: boolean): Vec3 {
  if (spreadRad <= 1e-6) return { x: dir.x, y: dir.y, z: dir.z };
  // build orthonormal basis
  const up = Math.abs(dir.y) > 0.98 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };
  let rx = up.y * dir.z - up.z * dir.y, ry = up.z * dir.x - up.x * dir.z, rz = up.x * dir.y - up.y * dir.x;
  const rl = Math.hypot(rx, ry, rz); rx /= rl; ry /= rl; rz /= rl;
  const ux = dir.y * rz - dir.z * ry, uy = dir.z * rx - dir.x * rz, uz = dir.x * ry - dir.y * rx;
  const ang = rng.next() * Math.PI * 2;
  const rad = (uniformDisc ? Math.sqrt(rng.next()) : Math.min(1, Math.abs(rng.gauss()) * 0.55)) * Math.tan(spreadRad);
  const ox = Math.cos(ang) * rad, oy = Math.sin(ang) * rad;
  const x = dir.x + rx * ox + ux * oy, y = dir.y + ry * ox + uy * oy, z = dir.z + rz * ox + uz * oy;
  const l = Math.hypot(x, y, z);
  return { x: x / l, y: y / l, z: z / l };
}

export { SUPPORTS, wrapAngle, distV };
