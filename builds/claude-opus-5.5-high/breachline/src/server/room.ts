// Authoritative Team Clash room. Runs a fixed 60 Hz simulation that owns movement,
// weapons, damage, Momentum, support actions, spawns, score and the match clock.
// It never imports renderer/UI code, so it runs headless in tests (and could run in Node).
import { CollisionWorld, Box, segmentSphere } from "../shared/collision";
import { MapDef, K17, zoneAt, MapBox } from "../content/map-k17";
import { Vec3, Rng, v3, vadd, vsub, vscale, vdist, vnorm, vlen, viewDir, clamp, DEG, hashSeed, vdot, flatForward, vdist2d } from "../shared/math";
import { newMoveState, stepMovement, MoveState, fits, eyeHeight, groundHeight } from "../shared/movement";
import { ArmsState, newArms, computeStats, stepArms, ArmsEvent, currentSpread, currentMode, refillAmmo } from "../shared/weapon-sim";
import { hitboxes, rayHitboxes, HitboxSet } from "../shared/hitbox";
import { WEAPONS, damageAtRange, zoneMultiplier, HitZone } from "../content/weapons";
import { EQUIPMENT, SUPPORT } from "../content/items";
import { Loadout, validateLoadout, DEFAULT_LOADOUTS, cloneLoadout } from "../content/loadout";
import { MOVE, COMBAT, MATCH, MOMENTUM, SCORE } from "../content/tuning";
import {
  BTN, InputCommand, GameEvent, Snapshot, PlayerSnap, Team, MatchPhase, DeathRecap, RecapHit, MatchResult, PlayerResult,
  ProjectileSnap, DeviceSnap, StrikeSnap, RadarBlip, LocalSnap,
} from "../shared/protocol";
import { chooseSpawn } from "./spawn";
import { buildNav, NavGraph } from "./nav";
import { BotBrain, BotDifficulty } from "./bots";

export const TICK_DT = 1 / MATCH.tickRate;

export interface Player {
  id: number; name: string; team: Team; bot: boolean; brain: BotBrain | null;
  loadout: Loadout; pendingLoadout: Loadout | null;
  move: MoveState; yaw: number; pitch: number; crouchT: number;
  arms: ArmsState;
  alive: boolean; health: number; lastDamageAt: number; respawnAt: number; diedAt: number;
  spawnPos: Vec3; protectUntil: number; protectedActive: boolean;
  momentum: number; streak: number; bestStreak: number; supportReady: string[]; supportSel: number;
  lethal: { count: number; charge: number }; tactical: { count: number; charge: number };
  cookStart: number | null;
  flashUntil: number; flashAmount: number;
  lastShotAt: number; lastShotSuppressed: boolean;
  damageLog: { from: number | null; fromName: string; fromTeam: Team; source: string; damage: number; zone: RecapHit["zone"]; t: number; dir: Vec3 }[];
  damagers: Map<number, { dmg: number; t: number }>;
  lastKiller: number | null;
  cmd: InputCommand; prevButtons: number;
  stepAcc: number;
  ping: number;
  stats: { kills: number; deaths: number; assists: number; score: number; supportDestroyed: number; headshots: number; adsKills: number; equipmentHits: number; zones: Set<string>; weapons: Record<string, { shots: number; hits: number; kills: number }> };
  recentKills: number[];
  footprints: { x: number; y: number; z: number; t: number; yaw: number }[];
  mine: number | null;
  meleeCooldown: number;
  pingCooldown: number;
}

interface Projectile { id: number; kind: string; owner: number; team: Team; pos: Vec3; vel: Vec3; fuse: number; stuck: boolean; age: number; armed: boolean; tripT: number; yaw: number; bounces: number; dartPulses: number; dartNext: number }
interface Smoke { id: number; pos: Vec3; radius: number; t: number; life: number }
interface Device { id: number; kind: "drone" | "ammoPod"; owner: number; team: Team; pos: Vec3; hp: number; maxHp: number; life: number; yaw: number; target: Vec3; nextMark: number; refillCd: Map<number, number> }
interface Strike { id: number; kind: "mortar" | "flight"; owner: number; team: Team; pos: Vec3; dir: Vec3; t: number; impactAt: number; done: boolean; hitSet: Set<number> }
interface Reveal { team: Team; victim: number; until: number; kind: RadarBlip["kind"] }
interface SweepRun { team: Team; pulses: number[] }

export interface RoomOptions {
  seed?: number;
  difficulty?: BotDifficulty;
  scoreLimit?: number;
  timeLimit?: number;
  warmup?: number;
  local?: { name: string; loadout: Loadout; autopilot?: boolean } | null;
  botsPerTeam?: [number, number];
  allUnlocked?: boolean;
  level?: number;
  map?: MapDef;
}

const BOT_NAMES = ["Kepler", "Ashby", "Marlow", "Quist", "Tamsin", "Okafor", "Ruiz", "Vance", "Halloran", "Imre", "Sato", "Brandt", "Lindqvist", "Odum", "Petrov", "Nakai"];
export interface Noise { pos: Vec3; radius: number; source: number; team: Team; kind: "shot" | "step" | "explosion"; t: number }

export class Room {
  map: MapDef;
  world: CollisionWorld;
  nav: NavGraph;
  rng: Rng;
  seed: number;
  players: Player[] = [];
  projectiles: Projectile[] = [];
  smokes: Smoke[] = [];
  devices: Device[] = [];
  strikes: Strike[] = [];
  reveals: Reveal[] = [];
  sweeps: SweepRun[] = [];
  pings: { team: Team; pos: Vec3; until: number }[] = [];
  noises: Noise[] = [];
  brokenGlass: number[] = [];
  recentDeaths: { pos: Vec3; t: number; team: Team }[] = [];
  heat: [Map<number, number>, Map<number, number>] = [new Map(), new Map()];
  events: GameEvent[] = [];
  tickN = 0;
  time = 0;
  phase: MatchPhase = "warmup";
  phaseEnd: number;
  scores: [number, number] = [0, 0];
  scoreLimit: number;
  timeLimit: number;
  suddenBase: [number, number] | null = null;
  winner: Team | -1 | null = null;
  result: MatchResult | null = null;
  localId = -1;
  uplinkUntil: [number, number] = [0, 0];
  tier8Active: [number, number] = [0, 0];
  firstBlood = false;
  history: { tick: number; pos: Map<number, { pos: Vec3; crouchT: number; alive: boolean }> }[] = [];
  difficulty: BotDifficulty;
  private nextEnt = 1;
  private leadTeam: Team | -1 = -1;
  private announcedThresholds = new Set<string>();
  allUnlocked: boolean;
  level: number;
  boxById: Map<number, MapBox>;

  constructor(opts: RoomOptions = {}) {
    this.map = opts.map ?? K17;
    this.seed = opts.seed ?? 1337;
    this.rng = new Rng(this.seed);
    // Clone collision so breakable state is per-room.
    const boxes: MapBox[] = this.map.boxes.map((b) => ({ ...b, min: { ...b.min }, max: { ...b.max } }));
    this.boxById = new Map(boxes.map((b) => [b.id, b]));
    this.world = new CollisionWorld(boxes);
    this.nav = buildNav(this.world, this.map.id, this.map.bounds);
    this.scoreLimit = opts.scoreLimit ?? MATCH.scoreLimit;
    this.timeLimit = opts.timeLimit ?? MATCH.timeLimit;
    this.difficulty = opts.difficulty ?? "normal";
    this.allUnlocked = opts.allUnlocked ?? false;
    this.level = opts.level ?? 1;
    this.phaseEnd = opts.warmup ?? MATCH.warmup;
    // filter spawn candidates that do not fit
    this.map = { ...this.map, spawnCandidates: this.map.spawnCandidates.filter((c) => fits(this.world, c.pos.x, c.pos.y, c.pos.z, MOVE.standHeight)) };

    const counts = opts.botsPerTeam ?? [MATCH.teamSize, MATCH.teamSize];
    let nameIdx = this.rng.int(0, BOT_NAMES.length);
    if (opts.local) {
      const v = validateLoadout(opts.local.loadout, { level: this.level, allUnlocked: this.allUnlocked });
      const lo = v.ok ? opts.local.loadout : DEFAULT_LOADOUTS[0];
      const p = this.addPlayer(opts.local.name, 0, false, lo);
      this.localId = p.id;
      if (opts.local.autopilot) p.brain = new BotBrain(p.id, "hard", new Rng(hashSeed(this.seed, p.id, 7)));
      counts[0] = Math.max(0, counts[0] - 1);
    }
    for (const team of [0, 1] as Team[]) {
      for (let i = 0; i < counts[team]; i++) {
        const lo = this.botLoadout();
        const p = this.addPlayer(BOT_NAMES[nameIdx++ % BOT_NAMES.length], team, true, lo);
        p.brain = new BotBrain(p.id, this.difficulty, new Rng(hashSeed(this.seed, p.id, 3)));
      }
    }
    for (const p of this.players) this.spawn(p, true);
    this.announce("Warmup — Team Clash on Relay Station K-17", "neutral");
  }

  private botLoadout(): Loadout {
    const prim = this.rng.pick(["jackal", "jackal", "kestrel", "kestrel", "mesa", "breacher", "anchor", "warden"]);
    const atts: Record<string, string[]> = {
      jackal: ["reflex", "stableGrip"], kestrel: ["reflex", "angledGrip"], mesa: ["optic2x"], breacher: ["angledGrip"], anchor: ["stableGrip"], warden: [],
    };
    return {
      name: "Bot", primary: prim, primaryAttachments: atts[prim], sidearm: this.rng.pick(["relay", "relay", "rook", "cinder"]),
      perks: { mobility: "fleetBoots", awareness: this.rng.pick(["traceReader", "signalFilter"]), sustain: this.rng.pick(["rapidReady", "fieldPatch", "scavengerRig"]) },
      lethal: this.rng.pick(["frag", "frag", "adhesive"]), tactical: this.rng.pick(["flash", "obscurant", "flash"]),
      support: [this.rng.pick(["reconSweep", "ammoPod"]), this.rng.pick(["hunterDrone", "mortarMark"]), this.rng.pick(["interdictionFlight", "teamUplink"])],
    };
  }

  addPlayer(name: string, team: Team, bot: boolean, loadout: Loadout): Player {
    const id = this.nextEnt++;
    const perks = Object.values(loadout.perks);
    const p: Player = {
      id, name, team, bot, brain: null, loadout: cloneLoadout(loadout), pendingLoadout: null,
      move: newMoveState(v3()), yaw: 0, pitch: 0, crouchT: 0,
      arms: newArms(computeStats(loadout.primary, loadout.primaryAttachments, perks), computeStats(loadout.sidearm, [], perks)),
      alive: false, health: COMBAT.maxHealth, lastDamageAt: -99, respawnAt: 0, diedAt: -99,
      spawnPos: v3(), protectUntil: 0, protectedActive: false,
      momentum: 0, streak: 0, bestStreak: 0, supportReady: [], supportSel: 0,
      lethal: { count: 1, charge: 0 }, tactical: { count: 1, charge: 0 }, cookStart: null,
      flashUntil: 0, flashAmount: 0, lastShotAt: -99, lastShotSuppressed: false,
      damageLog: [], damagers: new Map(), lastKiller: null,
      cmd: { seq: 0, tick: 0, mx: 0, mz: 0, yaw: 0, pitch: 0, buttons: 0, slot: 0, supportSel: 0 }, prevButtons: 0,
      stepAcc: 0, ping: 0,
      stats: { kills: 0, deaths: 0, assists: 0, score: 0, supportDestroyed: 0, headshots: 0, adsKills: 0, equipmentHits: 0, zones: new Set(), weapons: {} },
      recentKills: [], footprints: [], mine: null, meleeCooldown: 0, pingCooldown: 0,
    };
    this.players.push(p);
    return p;
  }

  get(id: number) { return this.players.find((p) => p.id === id); }
  perksOf(p: Player) { return Object.values(p.loadout.perks); }
  hasPerk(p: Player, id: string) { return Object.values(p.loadout.perks).includes(id); }
  eye(p: Player): Vec3 { return { x: p.move.pos.x, y: p.move.pos.y + eyeHeight(p.crouchT), z: p.move.pos.z }; }
  chest(p: Player): Vec3 { return { x: p.move.pos.x, y: p.move.pos.y + 1.25 * (1 - 0.3 * p.crouchT), z: p.move.pos.z }; }
  combatLive() { return this.phase === "live" || this.phase === "suddenDeath"; }

  submitInput(id: number, cmd: InputCommand) {
    const p = this.get(id);
    if (!p || p.brain) return;
    // server-side sanitising: clamp axes / pitch, ignore NaN
    if (!isFinite(cmd.mx) || !isFinite(cmd.mz) || !isFinite(cmd.yaw) || !isFinite(cmd.pitch)) return;
    p.cmd = { ...cmd, mx: clamp(cmd.mx, -1, 1), mz: clamp(cmd.mz, -1, 1), pitch: clamp(cmd.pitch, -89 * DEG, 89 * DEG) };
  }

  /** Validated loadout switch applied on next spawn. */
  requestLoadout(id: number, lo: Loadout): { ok: boolean; errors: string[] } {
    const p = this.get(id);
    if (!p) return { ok: false, errors: ["No player"] };
    const v = validateLoadout(lo, { level: this.level, allUnlocked: this.allUnlocked });
    if (!v.ok) { this.events.push({ type: "uiError", text: `Loadout rejected: ${v.errors[0]}` }); return v; }
    p.pendingLoadout = cloneLoadout(lo);
    return v;
  }

  private announce(text: string, tone: "neutral" | "good" | "bad" | "warn") { this.events.push({ type: "announce", text, tone }); }

  // ---------------------------------------------------------------- spawning
  private spawn(p: Player, initial = false) {
    if (p.pendingLoadout) {
      p.loadout = p.pendingLoadout; p.pendingLoadout = null;
    }
    const perks = this.perksOf(p);
    p.arms = newArms(computeStats(p.loadout.primary, p.loadout.primaryAttachments, perks), computeStats(p.loadout.sidearm, [], perks));
    const enemies = this.players.filter((o) => o.alive && o.team !== p.team).map((o) => o.move.pos);
    const mates = this.players.filter((o) => o.alive && o.team === p.team && o !== p).map((o) => o.move.pos);
    const dangers = [
      ...this.projectiles.filter((q) => q.team !== p.team && EQUIPMENT[q.kind]?.kind === "lethal").map((q) => ({ pos: q.pos, r: EQUIPMENT[q.kind].radius })),
      ...this.strikes.filter((s) => s.team !== p.team && s.kind === "mortar" && !s.done).map((s) => ({ pos: s.pos, r: 7 })),
      ...this.smokes.map((s) => ({ pos: s.pos, r: 1 })),
    ];
    let cands = this.map.spawnCandidates;
    if (initial) cands = cands.filter((c) => c.side === p.team);
    const choice = chooseSpawn({
      world: this.world, candidates: cands, team: p.team, enemies, teammates: mates,
      occupied: this.players.filter((o) => o.alive).map((o) => o.move.pos),
      recentDeaths: this.recentDeaths.map((d) => ({ pos: d.pos, age: this.time - d.t })), dangers,
    }, this.rng);
    p.move = newMoveState(choice.pos);
    p.yaw = choice.yaw; p.pitch = 0; p.crouchT = 0;
    p.cmd = { ...p.cmd, yaw: choice.yaw, pitch: 0, buttons: 0, mx: 0, mz: 0, slot: 0 };
    p.prevButtons = 0;
    p.alive = true; p.health = COMBAT.maxHealth; p.lastDamageAt = -99;
    p.spawnPos = { ...choice.pos }; p.protectUntil = this.time + COMBAT.spawnProtectTime; p.protectedActive = true;
    p.momentum = 0; p.streak = 0; p.damageLog = []; p.damagers.clear(); p.cookStart = null;
    p.flashUntil = 0; p.flashAmount = 0;
    p.lethal = { count: 1, charge: 0 }; p.tactical = { count: 1, charge: 0 };
    p.brain?.onSpawn(this, p);
    this.events.push({ type: "spawn", player: p.id, pos: { ...choice.pos }, reason: choice.reason });
  }

  // ---------------------------------------------------------------- main tick
  tick() {
    const dt = TICK_DT;
    this.tickN++;
    this.time += dt;
    this.noises = this.noises.filter((n) => this.time - n.t < 0.6);

    this.updatePhase();
    if (this.phase === "ended") { this.recordHistory(); return; }

    for (const p of this.players) {
      if (!p.alive) {
        if (this.time >= p.respawnAt && this.phase !== "warmup") this.spawn(p);
        continue;
      }
      if (p.brain) p.cmd = p.brain.think(this, p, dt);
      this.stepPlayer(p, dt);
    }
    this.stepProjectiles(dt);
    this.stepSmokes(dt);
    this.stepDevices(dt);
    this.stepStrikes(dt);
    this.stepReveals();
    this.recordHistory();
  }

  private updatePhase() {
    if (this.phase === "warmup") {
      if (this.time >= this.phaseEnd) {
        this.phase = "live";
        this.phaseEnd = this.time + this.timeLimit;
        this.announce("Engage. First team to " + this.scoreLimit + " wins.", "neutral");
      }
      return;
    }
    if (this.phase === "live") {
      if (this.scores[0] >= this.scoreLimit || this.scores[1] >= this.scoreLimit) return this.endMatch(this.scores[0] > this.scores[1] ? 0 : 1);
      if (this.time >= this.phaseEnd) {
        if (this.scores[0] !== this.scores[1]) return this.endMatch(this.scores[0] > this.scores[1] ? 0 : 1);
        this.phase = "suddenDeath";
        this.suddenBase = [this.scores[0], this.scores[1]];
        this.phaseEnd = this.time + MATCH.suddenDeathTime;
        this.announce(`Sudden death — first to +${MATCH.suddenDeathTarget}`, "warn");
      }
      return;
    }
    if (this.phase === "suddenDeath" && this.suddenBase) {
      for (const t of [0, 1] as Team[]) if (this.scores[t] - this.suddenBase[t] >= MATCH.suddenDeathTarget) return this.endMatch(t);
      if (this.time >= this.phaseEnd) {
        if (this.scores[0] === this.scores[1]) return this.endMatch(-1);
        return this.endMatch(this.scores[0] > this.scores[1] ? 0 : 1);
      }
    }
  }

  private endMatch(winner: Team | -1) {
    if (this.phase === "ended") return;
    this.phase = "ended";
    this.winner = winner;
    this.phaseEnd = this.time + MATCH.postMatch;
    const players: PlayerResult[] = this.players.map((p) => ({
      id: p.id, name: p.name, team: p.team, bot: p.bot, kills: p.stats.kills, deaths: p.stats.deaths, assists: p.stats.assists,
      score: p.stats.score, supportDestroyed: p.stats.supportDestroyed, bestStreak: p.bestStreak, headshots: p.stats.headshots,
      adsKills: p.stats.adsKills, equipmentHits: p.stats.equipmentHits, zonesVisited: [...p.stats.zones].filter((z) => ["ops", "courtyard", "bay", "ridge", "utility"].includes(z)).length,
      weapons: JSON.parse(JSON.stringify(p.stats.weapons)),
    }));
    const body = { matchId: `k17-${this.seed}-${this.tickN}`, map: this.map.id, winner, scores: [...this.scores] as [number, number], duration: Math.round(this.time), players, localId: this.localId };
    let h = 2166136261;
    const s = JSON.stringify(body);
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    this.result = { ...body, signature: (h >>> 0).toString(16) };
    const label = winner === -1 ? "Draw" : winner === 0 ? "Halyard Security wins" : "Vantor Response wins";
    this.announce(label, winner === -1 ? "neutral" : winner === this.get(this.localId)?.team ? "good" : "bad");
    this.events.push({ type: "matchEnd", result: this.result });
  }

  private recordHistory() {
    const m = new Map<number, { pos: Vec3; crouchT: number; alive: boolean }>();
    for (const p of this.players) m.set(p.id, { pos: { ...p.move.pos }, crouchT: p.crouchT, alive: p.alive });
    this.history.push({ tick: this.tickN, pos: m });
    if (this.history.length > 16) this.history.shift();
  }

  /** Hitboxes rewound by `ticksBack` (lag compensation, clamped to history). */
  rewoundHitboxes(target: Player, ticksBack: number): HitboxSet[] | null {
    if (ticksBack <= 0 || this.history.length === 0) return target.alive ? hitboxes(target.move.pos, target.crouchT) : null;
    const idx = Math.max(0, this.history.length - 1 - ticksBack);
    const h = this.history[idx].pos.get(target.id);
    if (!h || !h.alive || !target.alive) return null;
    return hitboxes(h.pos, h.crouchT);
  }

  // ---------------------------------------------------------------- player step
  private stepPlayer(p: Player, dt: number) {
    const cmd = p.cmd;
    const b = cmd.buttons;
    const pressed = (bit: number) => (b & bit) !== 0 && (p.prevButtons & bit) === 0;
    const released = (bit: number) => (b & bit) === 0 && (p.prevButtons & bit) !== 0;
    const warm = this.phase === "warmup";
    p.yaw = cmd.yaw;
    p.pitch = clamp(cmd.pitch, -89 * DEG, 89 * DEG);
    const w = p.arms.weapons[p.arms.active];
    const reloading = !!w.reload;
    const speedFrac = Math.hypot(p.move.vel.x, p.move.vel.z) / MOVE.standSpeed;
    const busyEquip = p.cookStart !== null;
    const mv = stepMovement(this.world, p.move, {
      mx: cmd.mx, mz: cmd.mz, yaw: p.yaw, jump: (b & BTN.jump) !== 0, crouch: (b & BTN.crouch) !== 0, sprint: (b & BTN.sprint) !== 0,
      ads: p.arms.ads, adsMove: w.stats.adsMove * (this.hasPerk(p, "lightKit") ? 1.12 : 1), canSprint: !p.arms.melee && !busyEquip,
      sprintDelay: this.hasPerk(p, "fleetBoots") ? 0 : MOVE.sprintDelay,
      mantleTime: MOVE.mantleTime * (this.hasPerk(p, "quickMantle") ? 0.6 : 1),
    }, dt);
    if (mv.jumped) this.events.push({ type: "jump", player: p.id });
    if (mv.landed && p.move.landSpeed > 4) this.events.push({ type: "land", player: p.id, speed: p.move.landSpeed });
    if (mv.mantled) this.events.push({ type: "mantle", player: p.id });
    p.crouchT = clamp(p.crouchT + (p.move.crouch ? dt / 0.16 : -dt / 0.16), 0, 1);

    // fell out of world safety
    if (p.move.pos.y < -12) { this.kill(p, null, "Fall", "world", false); return; }

    // footsteps
    if (p.move.onGround && p.move.moved > 0) {
      p.stepAcc += p.move.moved;
      const stride = p.move.sprinting ? 2.0 : p.move.crouch ? 1.2 : 1.6;
      if (p.stepAcc >= stride) {
        p.stepAcc = 0;
        const loud = p.move.sprinting ? 1 : p.move.crouch ? 0.25 : 0.55;
        this.events.push({ type: "footstep", player: p.id, pos: { ...p.move.pos }, loud });
        this.noises.push({ pos: { ...p.move.pos }, radius: loud * 18, source: p.id, team: p.team, kind: "step", t: this.time });
        if (p.move.sprinting) { p.footprints.push({ x: p.move.pos.x, y: p.move.pos.y, z: p.move.pos.z, t: this.time, yaw: p.yaw }); }
      }
    }
    if (p.footprints.length && this.time - p.footprints[0].t > 4.5) p.footprints.shift();

    // zones visited
    const z = zoneAt(p.move.pos);
    if (z && this.combatLive()) p.stats.zones.add(z.id);

    // spawn protection
    if (p.protectedActive && (this.time > p.protectUntil || vdist2d(p.move.pos, p.spawnPos) > COMBAT.spawnProtectMove)) p.protectedActive = false;

    // health regen
    const regenDelay = COMBAT.regenDelay - (this.hasPerk(p, "fieldPatch") ? 0.8 : 0);
    if (p.health < COMBAT.maxHealth && this.time - p.lastDamageAt >= regenDelay) p.health = Math.min(COMBAT.maxHealth, p.health + COMBAT.regenRate * dt);
    if (p.flashUntil < this.time) p.flashAmount = 0;

    // weapons
    const armsOut: ArmsEvent[] = [];
    const busy = !!p.move.mantle || busyEquip; // warmup blocks fire/melee below but allows aiming
    stepArms(p.arms, {
      fire: (b & BTN.fire) !== 0 && !warm, ads: (b & BTN.ads) !== 0, reload: (b & BTN.reload) !== 0, slot: cmd.slot,
      mode: (b & BTN.mode) !== 0, melee: (b & BTN.melee) !== 0 && !warm, inspect: (b & BTN.inspect) !== 0,
    }, { dt, sprinting: p.move.sprinting, speedFrac, crouch: p.move.crouch, onGround: p.move.onGround, busy, rng: this.rng }, armsOut);
    void reloading;
    for (const e of armsOut) {
      switch (e.type) {
        case "shot": this.fireShot(p, e.shot.weapon.def.id, e.shot.spreadDeg, e.shot.pellets, e.shot.kick); break;
        case "dry": this.events.push({ type: "dry", player: p.id }); break;
        case "reload": this.events.push({ type: "reload", player: p.id, stage: e.stage, kind: e.kind, weapon: p.arms.weapons[p.arms.active].stats.def.id }); break;
        case "swap": this.events.push({ type: "swap", player: p.id }); break;
        case "melee": this.events.push({ type: "melee", player: p.id }); this.meleeLunge(p); break;
        case "meleeHit": this.resolveMelee(p); break;
        default: break;
      }
    }

    // equipment
    if (!warm && !p.move.mantle) {
      const lethalDef = EQUIPMENT[p.loadout.lethal];
      if (pressed(BTN.lethal) && p.lethal.count > 0) {
        if (lethalDef.cookable) p.cookStart = this.time;
        else this.throwEquipment(p, lethalDef.id, 0);
      }
      if (p.cookStart !== null) {
        const cooked = this.time - p.cookStart;
        if (released(BTN.lethal) || (b & BTN.lethal) === 0) { this.throwEquipment(p, lethalDef.id, cooked); p.cookStart = null; }
        else if (cooked >= lethalDef.fuse) {
          // held too long: detonates in hand
          p.cookStart = null; p.lethal.count = 0;
          this.explode({ id: -1, kind: lethalDef.id, owner: p.id, team: p.team, pos: this.eye(p), vel: v3(), fuse: 0, stuck: true, age: 0, armed: true, tripT: 0, yaw: 0, bounces: 0, dartPulses: 0, dartNext: 0 });
        }
      }
      if (pressed(BTN.tactical) && p.tactical.count > 0) this.throwEquipment(p, p.loadout.tactical, 0);
    }
    const rechargeMult = this.time < this.uplinkUntil[p.team] ? 3 : 1;
    for (const [slot, def] of [[p.lethal, EQUIPMENT[p.loadout.lethal]], [p.tactical, EQUIPMENT[p.loadout.tactical]]] as const) {
      if (slot.count < 1) { slot.charge += (dt / def.recharge) * rechargeMult; if (slot.charge >= 1) { slot.count = 1; slot.charge = 0; } }
    }

    // support selection + deploy
    if (p.supportReady.length) p.supportSel = ((cmd.supportSel % p.supportReady.length) + p.supportReady.length) % p.supportReady.length;
    if (pressed(BTN.deploy) && !warm && p.supportReady.length) this.deploySupport(p, p.supportReady[p.supportSel]);

    // ping
    p.pingCooldown -= dt;
    if (pressed(BTN.ping) && p.pingCooldown <= 0) {
      p.pingCooldown = 1.0;
      const e = this.eye(p); const d = viewDir(p.yaw, p.pitch);
      const hit = this.world.raycast(e, d, 120);
      const pos = hit ? hit.point : vadd(e, vscale(d, 60));
      this.pings.push({ team: p.team, pos, until: this.time + 5 });
      this.events.push({ type: "ping", player: p.id, team: p.team, pos });
    }
    // Ammo pod interaction is proximity based (see stepDevices).
    p.prevButtons = b;
  }

  // ---------------------------------------------------------------- shooting
  private fireShot(p: Player, weaponId: string, spreadDeg: number, pellets: number, kick: { pitch: number; yaw: number }) {
    const def = WEAPONS[weaponId];
    const stats = p.arms.weapons[p.arms.active].stats;
    p.lastShotAt = this.time; p.lastShotSuppressed = stats.suppressed;
    p.protectedActive = false;
    const ws = (p.stats.weapons[weaponId] ??= { shots: 0, hits: 0, kills: 0 });
    ws.shots++;
    const origin = this.eye(p);
    const fwd = viewDir(p.yaw, p.pitch);
    const ends: Vec3[] = [];
    const rng = new Rng(hashSeed(p.id, this.tickN, p.arms.weapons[p.arms.active].shotsFired));
    let anyHit = false;
    // lag compensation: rewind by estimated latency + interpolation delay, clamped
    const rewindMs = p.bot ? 0 : Math.min(COMBAT.lagCompMaxMs, p.ping > 0 ? p.ping / 2 + 100 : 0);
    const ticksBack = Math.round((rewindMs / 1000) * MATCH.tickRate);
    for (let i = 0; i < pellets; i++) {
      const dir = this.spreadDir(fwd, spreadDeg, pellets > 1 ? def.pelletSpread ?? 0 : 0, rng, i, pellets);
      const res = this.traceBullet(p, origin, dir, def.id, stats.rangeMult, ticksBack);
      ends.push(res.end);
      if (res.hitPlayer) anyHit = true;
    }
    if (anyHit) ws.hits++;
    this.events.push({ type: "shot", shooter: p.id, weapon: weaponId, origin, ends, suppressed: stats.suppressed, tracer: def.cls === "lmg" || def.cls === "marksman" || (p.arms.weapons[p.arms.active].shotsFired % 3 === 0), flashScale: stats.flashScale });
    this.events.push({ type: "recoil", player: p.id, pitch: kick.pitch, yaw: kick.yaw });
    if (p.brain) p.brain.onRecoil(kick);
    this.noises.push({ pos: origin, radius: stats.suppressed ? 14 : 60, source: p.id, team: p.team, kind: "shot", t: this.time });
  }

  private spreadDir(fwd: Vec3, spreadDeg: number, patternDeg: number, rng: Rng, i: number, n: number): Vec3 {
    const up0 = Math.abs(fwd.y) > 0.95 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };
    const right = vnorm({ x: fwd.z * up0.y - fwd.y * up0.z, y: fwd.x * up0.z - fwd.z * up0.x, z: fwd.y * up0.x - fwd.x * up0.y });
    const up = { x: right.y * fwd.z - right.z * fwd.y, y: right.z * fwd.x - right.x * fwd.z, z: right.x * fwd.y - right.y * fwd.x };
    let ox = 0, oy = 0;
    if (patternDeg > 0 && n > 1) {
      // fixed ring pattern for pellets + seeded jitter
      const a = (i / n) * Math.PI * 2 + 0.3;
      const r = i === 0 ? 0 : patternDeg * (i % 2 === 0 ? 0.55 : 1);
      ox += Math.cos(a) * r * DEG; oy += Math.sin(a) * r * DEG;
    }
    const ang = spreadDeg * DEG * Math.sqrt(rng.next());
    const roll = rng.next() * Math.PI * 2;
    ox += Math.cos(roll) * ang; oy += Math.sin(roll) * ang;
    return vnorm({ x: fwd.x + right.x * ox + up.x * oy, y: fwd.y + right.y * ox + up.y * oy, z: fwd.z + right.z * ox + up.z * oy });
  }

  /** Hitscan with thin-material penetration, glass breaking, players and devices. */
  traceBullet(p: Player, origin: Vec3, dir: Vec3, weaponId: string, rangeMult: number, ticksBack = 0): { end: Vec3; hitPlayer: boolean } {
    const def = WEAPONS[weaponId];
    const maxT = 220;
    type Ev = { t: number; kind: "box"; box: Box; tExit: number; normal: Vec3 } | { t: number; kind: "player"; target: Player; zone: HitZone } | { t: number; kind: "device"; dev: Device };
    const evs: Ev[] = [];
    for (const h of this.world.raycastAll(origin, dir, maxT)) evs.push({ t: h.t, kind: "box", box: h.box, tExit: h.tExit, normal: h.normal });
    for (const o of this.players) {
      if (o === p || !o.alive || o.team === p.team) continue;
      const hb = this.rewoundHitboxes(o, ticksBack);
      if (!hb) continue;
      const h = rayHitboxes(origin, dir, maxT, hb);
      if (h) evs.push({ t: h.t, kind: "player", target: o, zone: h.zone });
    }
    for (const d of this.devices) {
      if (d.team === p.team) continue;
      const r = d.kind === "drone" ? 0.65 : 0.6;
      const oc = vsub(d.pos, origin);
      const tc = vdot(oc, dir);
      if (tc < 0) continue;
      const perp2 = vdot(oc, oc) - tc * tc;
      if (perp2 <= r * r) evs.push({ t: tc - Math.sqrt(r * r - perp2), kind: "device", dev: d });
    }
    evs.sort((a, b) => a.t - b.t);
    let energy = def.penetration;
    let dmgMult = 1;
    for (const e of evs) {
      if (e.kind === "box") {
        const b = e.box;
        if (!b.active) continue;
        const point = vadd(origin, vscale(dir, e.t));
        if (b.breakable) {
          this.breakGlass(b, point);
          dmgMult *= 0.92;
          continue;
        }
        this.events.push({ type: "impact", pos: point, normal: e.normal, mat: b.mat });
        if (b.pen !== undefined) {
          const thick = Math.max(0.05, e.tExit - e.t);
          const cost = b.pen * (thick / 0.3 + 0.5);
          if (thick < 1.2 && energy >= cost) { energy -= cost; dmgMult *= 0.62; continue; }
        }
        return { end: point, hitPlayer: false };
      } else if (e.kind === "player") {
        const dist = e.t;
        const dmg = damageAtRange(def, dist, rangeMult) * zoneMultiplier(def, e.zone, dist) * dmgMult;
        const point = vadd(origin, vscale(dir, e.t));
        this.damage(e.target, p, dmg, { source: weaponId, kind: "weapon", zone: e.zone, from: origin, flinch: def.flinch });
        return { end: point, hitPlayer: true };
      } else {
        const dmg = damageAtRange(def, e.t, rangeMult) * dmgMult;
        this.damageDevice(e.dev, p, dmg);
        return { end: vadd(origin, vscale(dir, e.t)), hitPlayer: false };
      }
    }
    return { end: vadd(origin, vscale(dir, 120)), hitPlayer: false };
  }

  private breakGlass(b: Box, point: Vec3) {
    if (!b.active) return;
    b.active = false;
    this.brokenGlass.push(b.id);
    this.events.push({ type: "glass", boxId: b.id, pos: point });
  }

  private meleeLunge(p: Player) {
    // short assisted lunge toward a target inside the cone (capped, no teleport)
    const t = this.meleeTarget(p, COMBAT.meleeRange + COMBAT.meleeLungeMax);
    if (!t) return;
    const d = vsub(t.move.pos, p.move.pos); d.y = 0;
    const len = vlen(d);
    if (len > COMBAT.meleeRange - 0.3) {
      const n = vscale(d, 1 / len);
      p.move.vel.x = n.x * 7; p.move.vel.z = n.z * 7;
    }
  }

  private meleeTarget(p: Player, range: number): Player | null {
    const e = this.eye(p); const f = viewDir(p.yaw, p.pitch);
    let best: Player | null = null, bd = Infinity;
    for (const o of this.players) {
      if (!o.alive || o.team === p.team) continue;
      const c = this.chest(o);
      const d = vsub(c, e);
      const dist = vlen(d);
      if (dist > range) continue;
      const cos = vdot(vscale(d, 1 / dist), f);
      if (cos < Math.cos(COMBAT.meleeConeDeg * DEG)) continue;
      if (!this.world.lineOfSight(e, c)) continue;
      if (dist < bd) { bd = dist; best = o; }
    }
    return best;
  }

  private resolveMelee(p: Player) {
    const t = this.meleeTarget(p, COMBAT.meleeRange + 0.3);
    if (t) this.damage(t, p, COMBAT.meleeDamage, { source: "melee", kind: "melee", zone: "melee", from: this.eye(p), flinch: 1 });
  }

  // ---------------------------------------------------------------- damage
  damage(victim: Player, attacker: Player | null, amount: number, info: { source: string; kind: DeathRecap["sourceKind"]; zone: RecapHit["zone"]; from: Vec3; flinch?: number }) {
    if (!victim.alive || !this.combatLive() || amount <= 0) return;
    if (attacker && attacker !== victim && attacker.team === victim.team) return; // friendly fire off
    if (victim.protectedActive && attacker !== victim) {
      if (attacker) this.events.push({ type: "hit", attacker: attacker.id, victim: victim.id, damage: 0, zone: String(info.zone), kill: false, protectedHit: true });
      return;
    }
    if (attacker && attacker.protectedActive && attacker !== victim) return; // protected players cannot deal damage
    victim.health -= amount;
    victim.lastDamageAt = this.time;
    const dir = vnorm(vsub(info.from, this.chest(victim)));
    victim.damageLog.push({ from: attacker?.id ?? null, fromName: attacker?.name ?? "World", fromTeam: attacker?.team ?? victim.team, source: info.source, damage: amount, zone: info.zone, t: this.time, dir });
    if (victim.damageLog.length > 24) victim.damageLog.shift();
    if (attacker && attacker !== victim) {
      const d = victim.damagers.get(attacker.id) ?? { dmg: 0, t: 0 };
      d.dmg += amount; d.t = this.time;
      victim.damagers.set(attacker.id, d);
      if (info.kind === "weapon") { const ws = attacker.stats.weapons[info.source]; if (ws) { /* hits counted per shot */ } }
      if (info.kind === "equipment") attacker.stats.equipmentHits++;
    }
    this.events.push({ type: "damaged", victim: victim.id, dir, damage: amount, flinch: info.flinch ?? 0.5 });
    victim.brain?.onDamaged(this, victim, attacker);
    const kill = victim.health <= 0;
    if (attacker) this.events.push({ type: "hit", attacker: attacker.id, victim: victim.id, damage: amount, zone: String(info.zone), kill });
    if (kill) this.kill(victim, attacker, info.source, info.kind, info.zone === "head");
  }

  private kill(victim: Player, attacker: Player | null, source: string, kind: DeathRecap["sourceKind"], headshot: boolean) {
    if (!victim.alive) return;
    victim.alive = false;
    victim.health = 0;
    victim.diedAt = this.time;
    victim.respawnAt = this.time + COMBAT.respawnDelay;
    victim.stats.deaths++;
    victim.streak = 0;
    victim.momentum = 0;
    victim.cookStart = null;
    this.recentDeaths.push({ pos: { ...victim.move.pos }, t: this.time, team: victim.team });
    if (this.recentDeaths.length > 40) this.recentDeaths.shift();
    const heatKey = Math.floor((victim.move.pos.x + 60) / 6) * 100 + Math.floor((victim.move.pos.z + 50) / 6);
    this.heat[victim.team].set(heatKey, (this.heat[victim.team].get(heatKey) ?? 0) + 1);

    const enemyKill = !!attacker && attacker !== victim && attacker.team !== victim.team;
    const assisters: number[] = [];
    if (enemyKill && attacker) {
      this.scores[attacker.team]++;
      const st = attacker.stats;
      st.kills++;
      if (kind === "weapon") { const ws = (st.weapons[source] ??= { shots: 0, hits: 0, kills: 0 }); ws.kills++; }
      if (headshot) st.headshots++;
      if (kind === "weapon" && attacker.arms.ads > 0.7) st.adsKills++;
      attacker.streak++;
      attacker.bestStreak = Math.max(attacker.bestStreak, attacker.streak);
      const dist = vdist(attacker.move.pos, victim.move.pos);
      this.addScore(attacker, kind === "support" ? SCORE.supportKill + SCORE.kill : SCORE.kill, kind === "support" ? "Support elimination" : "Elimination");
      if (headshot) { this.addScore(attacker, SCORE.headshot, "Headshot"); this.medal(attacker, "Headshot"); }
      if (!this.firstBlood) { this.firstBlood = true; this.addScore(attacker, SCORE.firstBlood, "First Strike"); this.medal(attacker, "First Strike"); }
      if (attacker.lastKiller === victim.id) { this.addScore(attacker, SCORE.revenge, "Payback"); this.medal(attacker, "Payback"); attacker.lastKiller = null; }
      if (dist > 40 && kind === "weapon") { this.addScore(attacker, SCORE.longshot, "Long Shot"); this.medal(attacker, "Long Shot"); }
      attacker.recentKills = attacker.recentKills.filter((t) => this.time - t < 4);
      attacker.recentKills.push(this.time);
      if (attacker.recentKills.length === 2) this.medal(attacker, "Double Down");
      if (attacker.recentKills.length >= 3) this.medal(attacker, "Triple Threat");
      if (attacker.streak === 5) this.medal(attacker, "Five Alive");
      if (kind !== "support") this.addMomentum(attacker, MOMENTUM.kill);
      if (this.hasPerk(attacker, "scavengerRig")) for (const w of attacker.arms.weapons) w.reserve = Math.min(w.stats.reserveMax, w.reserve + w.stats.mag);
      victim.lastKiller = attacker.id;
      // assists
      for (const [id, d] of victim.damagers) {
        if (id === attacker.id || this.time - d.t > COMBAT.assistWindow || d.dmg < COMBAT.assistMinDamage) continue;
        const a = this.get(id);
        if (!a || a.team === victim.team) continue;
        assisters.push(id);
      }
      if (this.time < this.uplinkUntil[attacker.team]) {
        for (const m of this.players) if (m.alive && m.team === attacker.team && m !== attacker && !assisters.includes(m.id) && vdist(m.move.pos, attacker.move.pos) < 25) assisters.push(m.id);
      }
      for (const id of assisters) {
        const a = this.get(id)!;
        a.stats.assists++;
        this.addScore(a, SCORE.assist, "Assist");
        this.addMomentum(a, MOMENTUM.assist);
      }
      this.checkLead();
    }
    const killerDist = attacker ? vdist(attacker.move.pos, victim.move.pos) : 0;
    const recent = victim.damageLog.filter((h) => this.time - h.t < 6);
    const recap: DeathRecap = {
      killer: attacker && attacker !== victim ? attacker.name : attacker === victim ? "Self" : null,
      killerTeam: attacker ? attacker.team : null,
      weapon: this.sourceName(source),
      sourceKind: kind,
      distance: Math.round(killerDist),
      headshot,
      hits: recent.map((h) => ({ attacker: h.fromName, attackerTeam: h.fromTeam, source: this.sourceName(h.source), damage: Math.round(h.damage), zone: h.zone, t: +(h.t - this.time).toFixed(2), dir: h.dir })),
      finalDir: recent.length ? recent[recent.length - 1].dir : v3(0, 0, 1),
      killerHealth: attacker && attacker !== victim ? Math.max(0, Math.round(attacker.health)) : null,
    };
    this.events.push({ type: "kill", killer: attacker?.id ?? null, victim: victim.id, weapon: this.sourceName(source), headshot, killerTeam: attacker?.team ?? null, victimTeam: victim.team, assisters });
    this.events.push({ type: "death", victim: victim.id, recap });
    victim.brain?.onDeath(this, victim);
    if (victim.mine !== null) { /* mines persist */ }
  }

  sourceName(source: string): string {
    if (WEAPONS[source]) return WEAPONS[source].name;
    if (EQUIPMENT[source]) return EQUIPMENT[source].name;
    if (SUPPORT[source]) return SUPPORT[source].name;
    if (source === "melee") return "Melee";
    return source;
  }

  private checkLead() {
    const lead: Team | -1 = this.scores[0] > this.scores[1] ? 0 : this.scores[1] > this.scores[0] ? 1 : -1;
    if (lead !== this.leadTeam && lead !== -1) {
      const local = this.get(this.localId);
      if (local) this.announce(lead === local.team ? "We've taken the lead" : "We've lost the lead", lead === local.team ? "good" : "bad");
    }
    this.leadTeam = lead;
    for (const t of [0, 1] as Team[]) {
      for (const frac of [0.5, 0.9]) {
        const key = `${t}-${frac}`;
        if (!this.announcedThresholds.has(key) && this.scores[t] >= Math.floor(this.scoreLimit * frac)) {
          this.announcedThresholds.add(key);
          const local = this.get(this.localId);
          const ours = local && local.team === t;
          if (frac === 0.9) this.announce(ours ? "Almost there — close it out" : "Enemy is near the score limit", ours ? "good" : "warn");
          else this.announce(ours ? "Halfway to the limit" : "Enemy at half score", ours ? "good" : "warn");
        }
      }
    }
  }

  private addScore(p: Player, amount: number, label: string) {
    p.stats.score += amount;
    this.events.push({ type: "score", player: p.id, amount, label });
  }
  private medal(p: Player, label: string) { this.events.push({ type: "medal", player: p.id, label }); }

  addMomentum(p: Player, amount: number) {
    if (!p.alive) return;
    const before = p.momentum;
    p.momentum += amount;
    let tier: number | null = null;
    MOMENTUM.tiers.forEach((thr, i) => {
      if (before < thr && p.momentum >= thr) {
        const id = p.loadout.support[i];
        if (!p.supportReady.includes(id)) p.supportReady.push(id);
        tier = thr;
        this.events.push({ type: "supportReady", player: p.id, id });
      }
    });
    this.events.push({ type: "momentum", player: p.id, value: p.momentum, tierReached: tier });
  }

  // ---------------------------------------------------------------- equipment
  private throwEquipment(p: Player, kind: string, cooked: number) {
    const def = EQUIPMENT[kind];
    const slot = def.kind === "lethal" ? p.lethal : p.tactical;
    if (slot.count <= 0) return;
    slot.count--; slot.charge = 0;
    p.protectedActive = false;
    const e = this.eye(p);
    const d = viewDir(p.yaw, p.pitch);
    if (def.placed) {
      // place mine on the floor in front
      const f = flatForward(p.yaw);
      const at = { x: p.move.pos.x + f.x * 0.9, y: p.move.pos.y + 0.5, z: p.move.pos.z + f.z * 0.9 };
      const g = groundHeight(this.world, at.x, at.y, at.z, 2.5, 0, 0.1);
      const pos = { x: at.x, y: isFinite(g) ? g + 0.05 : p.move.pos.y + 0.05, z: at.z };
      if (p.mine !== null) this.projectiles = this.projectiles.filter((q) => q.id !== p.mine);
      const pr: Projectile = { id: this.nextEnt++, kind, owner: p.id, team: p.team, pos, vel: v3(), fuse: 999, stuck: true, age: 0, armed: false, tripT: 0, yaw: p.yaw, bounces: 0, dartPulses: 0, dartNext: 0 };
      this.projectiles.push(pr);
      p.mine = pr.id;
      this.events.push({ type: "throw", player: p.id, kind });
      return;
    }
    const pos = vadd(e, vscale(d, 0.45));
    const vel = vadd(vscale(d, def.throwSpeed), { x: p.move.vel.x * 0.4, y: 2.5, z: p.move.vel.z * 0.4 });
    this.projectiles.push({ id: this.nextEnt++, kind, owner: p.id, team: p.team, pos, vel, fuse: def.sticky ? 6 : def.fuse - cooked, stuck: false, age: 0, armed: true, tripT: 0, yaw: p.yaw, bounces: 0, dartPulses: 0, dartNext: 0 });
    this.events.push({ type: "throw", player: p.id, kind });
  }

  private stepProjectiles(dt: number) {
    const G = 15;
    const keep: Projectile[] = [];
    for (const q of this.projectiles) {
      q.age += dt;
      const def = EQUIPMENT[q.kind];
      if (def.placed) {
        // breach mine logic
        if (!q.armed && q.age > 1.0) q.armed = true;
        const owner = this.get(q.owner);
        if (q.armed && q.tripT === 0) {
          const f = flatForward(q.yaw);
          for (const o of this.players) {
            if (!o.alive || o.team === q.team) continue;
            const d = vsub(o.move.pos, q.pos); d.y = 0;
            const dist = vlen(d);
            if (dist < 2.6 && dist > 0.1 && vdot(vscale(d, 1 / dist), f) > 0.25 && this.world.lineOfSight({ ...q.pos, y: q.pos.y + 0.3 }, this.chest(o))) {
              q.tripT = this.time + def.fuse;
              this.events.push({ type: "mineTrip", pos: { ...q.pos } });
              break;
            }
          }
        }
        if (q.tripT > 0 && this.time >= q.tripT) { this.explode(q); if (owner && owner.mine === q.id) owner.mine = null; continue; }
        if (q.age > 120) continue;
        keep.push(q);
        continue;
      }
      if (!q.stuck) {
        const sub = 3;
        for (let s = 0; s < sub; s++) {
          const h = dt / sub;
          q.vel.y -= G * h;
          const step = vscale(q.vel, h);
          const len = vlen(step);
          if (len < 1e-6) continue;
          const dir = vscale(step, 1 / len);
          const hit = this.world.raycast(q.pos, dir, len + 0.06);
          if (hit) {
            if (hit.box.breakable) { this.breakGlass(hit.box, hit.point); q.pos = vadd(q.pos, step); continue; }
            q.pos = vadd(hit.point, vscale(hit.normal, 0.06));
            if (def.sticky) {
              q.stuck = true; q.vel = v3();
              q.fuse = q.kind === "adhesive" ? def.fuse : 6;
              if (q.kind === "signalDart") { q.dartPulses = 3; q.dartNext = this.time + 0.3; }
              this.events.push({ type: "bounce", pos: { ...q.pos }, kind: q.kind });
              break;
            }
            const n = hit.normal;
            const vn = vdot(q.vel, n);
            q.vel = vsub(q.vel, vscale(n, 1.45 * vn));
            q.vel = vscale(q.vel, 0.55);
            if (n.y > 0.5 && Math.abs(q.vel.y) < 1.2) { q.vel.y = 0; q.vel.x *= 0.7; q.vel.z *= 0.7; }
            if (q.bounces++ < 4 && vlen(q.vel) > 1.5) this.events.push({ type: "bounce", pos: { ...q.pos }, kind: q.kind });
            if (vlen(q.vel) < 0.3) { q.vel = v3(); }
            break;
          } else q.pos = vadd(q.pos, step);
        }
        if (q.pos.y < -15) continue;
      }
      if (q.kind === "signalDart" && q.stuck) {
        if (q.dartPulses > 0 && this.time >= q.dartNext) {
          q.dartPulses--; q.dartNext = this.time + 2;
          for (const o of this.players) {
            if (!o.alive || o.team === q.team) continue;
            if (vdist(o.move.pos, q.pos) <= def.radius) {
              const dur = this.hasPerk(o, "signalFilter") ? 0.9 : 1.8;
              this.reveals.push({ team: q.team, victim: o.id, until: this.time + dur, kind: "dart" });
              const owner = this.get(q.owner); if (owner) owner.stats.equipmentHits++;
            }
          }
        }
        if (q.dartPulses <= 0 && this.time > q.dartNext) continue;
        keep.push(q);
        continue;
      }
      q.fuse -= dt;
      if (q.fuse <= 0) { this.explode(q); continue; }
      keep.push(q);
    }
    this.projectiles = keep;
  }

  private explode(q: Projectile) {
    const def = EQUIPMENT[q.kind];
    const owner = this.get(q.owner) ?? null;
    const center = { x: q.pos.x, y: q.pos.y + 0.25, z: q.pos.z };
    this.events.push({ type: "explosion", pos: { ...q.pos }, kind: q.kind, radius: def.radius });
    this.noises.push({ pos: center, radius: 45, source: q.owner, team: q.team, kind: "explosion", t: this.time });
    if (q.kind === "obscurant") {
      this.smokes.push({ id: this.nextEnt++, pos: { ...q.pos }, radius: def.radius, t: 0, life: 12 });
      return;
    }
    if (q.kind === "flash") {
      for (const o of this.players) {
        if (!o.alive) continue;
        const eye = this.eye(o);
        const dist = vdist(eye, center);
        if (dist > def.radius) continue;
        if (!this.world.lineOfSight(center, eye)) continue;
        if (this.smokes.some((s) => segmentSphere(center, eye, s.pos, s.radius * Math.min(1, s.t / 1.2) * 0.85))) continue;
        const toFlash = vnorm(vsub(center, eye));
        const facing = vdot(viewDir(o.yaw, o.pitch), toFlash);
        const angleK = facing > 0.5 ? 1 : facing > -0.2 ? 0.55 : 0.18;
        const amount = clamp(angleK * (1 - dist / def.radius) * 1.4, 0, 1);
        if (amount < 0.05) continue;
        o.flashAmount = Math.max(o.flashAmount, amount);
        o.flashUntil = Math.max(o.flashUntil, this.time + 0.6 + 3.4 * amount);
        this.events.push({ type: "flashed", player: o.id, amount });
        if (owner && o.team !== owner.team) owner.stats.equipmentHits++;
        o.brain?.onFlashed(amount);
      }
      return;
    }
    // lethal blast
    for (const o of this.players) {
      if (!o.alive) continue;
      const c = this.chest(o);
      const dist = vdist(c, center);
      if (dist > def.radius) continue;
      const vis = this.world.lineOfSight(center, c) || this.world.lineOfSight(center, this.eye(o)) || this.world.lineOfSight(center, { ...o.move.pos, y: o.move.pos.y + 0.3 });
      if (!vis) continue;
      let dmg = def.damage * Math.pow(1 - dist / def.radius, 1.15);
      if (def.placed) {
        const d = vsub(o.move.pos, q.pos); d.y = 0;
        const facing = vdot(vnorm(d), flatForward(q.yaw));
        dmg *= facing > 0 ? 1 : 0.35;
      }
      if (o === owner) dmg *= 0.6;
      this.damage(o, owner, dmg, { source: q.kind, kind: "equipment", zone: "blast", from: center, flinch: 1.2 });
    }
    for (const d of [...this.devices]) if (d.team !== q.team && vdist(d.pos, center) < def.radius) this.damageDevice(d, owner, def.damage * 0.8);
    for (const b of this.world.boxes) if (b.breakable && b.active) {
      const c = { x: (b.min.x + b.max.x) / 2, y: (b.min.y + b.max.y) / 2, z: (b.min.z + b.max.z) / 2 };
      if (vdist(c, center) < def.radius * 0.6) this.breakGlass(b, c);
    }
  }

  private stepSmokes(dt: number) {
    for (const s of this.smokes) s.t += dt;
    this.smokes = this.smokes.filter((s) => s.t < s.life);
  }

  /** Effective obscurant radius (grows in, then holds; thins in last 1.5 s). */
  smokeRadius(s: Smoke) { const grow = Math.min(1, s.t / 1.2); const fade = s.life - s.t < 1.5 ? (s.life - s.t) / 1.5 : 1; return s.radius * grow * (0.6 + 0.4 * fade); }

  /** Sight test used by bots: occlusion + obscurant volumes. */
  sightClear(a: Vec3, b: Vec3): boolean {
    if (!this.world.lineOfSight(a, b)) return false;
    for (const s of this.smokes) if (segmentSphere(a, b, s.pos, this.smokeRadius(s))) return false;
    return true;
  }

  // ---------------------------------------------------------------- support actions
  deploySupport(p: Player, id: string): boolean {
    const def = SUPPORT[id];
    if (!def || !p.supportReady.includes(id) || !p.alive) return false;
    const fail = (msg: string) => { if (p.id === this.localId) this.events.push({ type: "uiError", text: msg }); return false; };
    if (def.tier === 8 && this.time < this.tier8Active[p.team]) return fail("A Tier-8 action is already active for your team");
    const e = this.eye(p);
    const vd = viewDir(p.yaw, p.pitch);
    switch (id) {
      case "reconSweep":
        this.sweeps.push({ team: p.team, pulses: [this.time, this.time + 3, this.time + 6] });
        break;
      case "ammoPod": {
        const f = flatForward(p.yaw);
        const at = { x: p.move.pos.x + f.x * 1.2, y: p.move.pos.y + 0.5, z: p.move.pos.z + f.z * 1.2 };
        const g = groundHeight(this.world, at.x, at.y, at.z, 2, 0, 0.3);
        if (!isFinite(g) || !fits(this.world, at.x, g, at.z, 0.8, 0.35)) return fail("No room to place the Ammo Pod");
        this.devices.push({ id: this.nextEnt++, kind: "ammoPod", owner: p.id, team: p.team, pos: { x: at.x, y: g + 0.4, z: at.z }, hp: 150, maxHp: 150, life: 40, yaw: p.yaw, target: v3(), nextMark: 0, refillCd: new Map() });
        break;
      }
      case "hunterDrone": {
        const start = { x: p.move.pos.x, y: Math.max(p.move.pos.y + 7, 11), z: p.move.pos.z };
        this.devices.push({ id: this.nextEnt++, kind: "drone", owner: p.id, team: p.team, pos: start, hp: 120, maxHp: 120, life: 30, yaw: p.yaw, target: { x: 0, y: 12, z: 0 }, nextMark: 0, refillCd: new Map() });
        break;
      }
      case "mortarMark": {
        const hit = this.world.raycast(e, vd, 140);
        const pt = hit ? hit.point : null;
        if (!pt || hit!.normal.y < 0.5) return fail("Mortar Mark needs an outdoor ground target");
        if (this.world.hasRoof(pt)) return fail("Target is under cover — mortars need open sky");
        for (const [i, delay] of [[0, 2.6], [1, 4.2]] as const) {
          const off = i === 0 ? v3() : { x: this.rng.range(-2.5, 2.5), y: 0, z: this.rng.range(-2.5, 2.5) };
          const ip = { x: pt.x + off.x, y: pt.y, z: pt.z + off.z };
          const g = groundHeight(this.world, ip.x, ip.y + 3, ip.z, 8, 0, 0.1);
          if (isFinite(g)) ip.y = g;
          this.strikes.push({ id: this.nextEnt++, kind: "mortar", owner: p.id, team: p.team, pos: ip, dir: v3(), t: 0, impactAt: this.time + delay, done: false, hitSet: new Set() });
        }
        this.events.push({ type: "supportWarning", team: p.team === 0 ? 1 : 0, id, pos: pt });
        break;
      }
      case "interdictionFlight": {
        const f = flatForward(p.yaw);
        const hit = this.world.raycast(e, vd, 80);
        const through = hit ? hit.point : vadd(p.move.pos, vscale(f, 30));
        const start = { x: through.x - f.x * 90, y: 34, z: through.z - f.z * 90 };
        this.strikes.push({ id: this.nextEnt++, kind: "flight", owner: p.id, team: p.team, pos: start, dir: f, t: 0, impactAt: this.time + 3.2, done: false, hitSet: new Set() });
        this.tier8Active[p.team] = this.time + 6;
        this.events.push({ type: "supportWarning", team: p.team === 0 ? 1 : 0, id, pos: through });
        break;
      }
      case "teamUplink":
        this.uplinkUntil[p.team] = this.time + 20;
        this.tier8Active[p.team] = this.time + 20;
        break;
    }
    p.supportReady.splice(p.supportReady.indexOf(id), 1);
    p.supportSel = 0;
    this.events.push({ type: "supportDeployed", player: p.id, team: p.team, id });
    const local = this.get(this.localId);
    if (local) {
      const friendly = local.team === p.team;
      const msg = friendly ? `${p.name === local.name ? "Your" : "Friendly"} ${def.name} deployed` : `Enemy ${def.name} inbound`;
      this.announce(msg, friendly ? "good" : "warn");
    }
    return true;
  }

  private stepDevices(dt: number) {
    const keep: Device[] = [];
    for (const d of this.devices) {
      d.life -= dt;
      if (d.life <= 0 || d.hp <= 0) continue;
      if (d.kind === "drone") {
        // patrol over the enemy-facing half, marking enemies in sight (never fires)
        const enemies = this.players.filter((o) => o.alive && o.team !== d.team);
        if (this.time >= d.nextMark) {
          d.nextMark = this.time + 0.5;
          let anchor: Vec3 | null = null;
          for (const o of enemies) {
            const c = this.chest(o);
            if (vdist2d(c, d.pos) < 30 && this.sightClear(d.pos, c)) {
              const dur = this.hasPerk(o, "signalFilter") ? 0.75 : 1.5;
              this.reveals.push({ team: d.team, victim: o.id, until: this.time + dur, kind: "drone" });
              anchor = anchor ?? c;
            }
          }
          if (!anchor && enemies.length) {
            // drift toward the zone with most recent noise from enemies
            const n = this.noises.filter((nn) => nn.team !== d.team);
            if (n.length) anchor = n[n.length - 1].pos;
          }
          if (anchor) d.target = { x: clamp(anchor.x, -50, 50), y: 12, z: clamp(anchor.z, -42, 42) };
        }
        const to = vsub(d.target, d.pos); to.y = 0;
        const len = vlen(to);
        if (len > 2) { d.pos.x += (to.x / len) * 5 * dt; d.pos.z += (to.z / len) * 5 * dt; d.yaw = Math.atan2(to.x, to.z); }
        d.pos.y += (12 + Math.sin(this.time * 1.3 + d.id) * 0.6 - d.pos.y) * Math.min(1, dt * 2);
      } else if (d.kind === "ammoPod") {
        for (const o of this.players) {
          if (!o.alive || o.team !== d.team || vdist(o.move.pos, d.pos) > 2.6) continue;
          const cd = d.refillCd.get(o.id) ?? 0;
          if (this.time < cd) continue;
          const needs = o.arms.weapons.some((w) => w.reserve < w.stats.reserveMax);
          if (!needs) continue;
          refillAmmo(o.arms, 1);
          d.refillCd.set(o.id, this.time + 4);
          if (o.id === this.localId) this.events.push({ type: "score", player: o.id, amount: 0, label: "Ammo resupplied" });
        }
      }
      keep.push(d);
    }
    this.devices = keep;
  }

  private damageDevice(d: Device, by: Player | null, dmg: number) {
    if (d.hp <= 0) return;
    d.hp -= dmg;
    if (by) this.events.push({ type: "hit", attacker: by.id, victim: -d.id, damage: dmg, zone: "device", kill: d.hp <= 0, device: true });
    if (d.hp <= 0) {
      this.events.push({ type: "deviceDestroyed", id: d.id, kind: d.kind, pos: { ...d.pos }, team: d.team, by: by?.id ?? null });
      this.events.push({ type: "explosion", pos: { ...d.pos }, kind: "device", radius: 2 });
      if (by && by.team !== d.team) {
        by.stats.supportDestroyed++;
        this.addScore(by, SCORE.supportDestroyed, d.kind === "drone" ? "Drone destroyed" : "Pod destroyed");
        this.medal(by, "Counter-Support");
        this.addMomentum(by, MOMENTUM.supportDestroyed);
      }
    }
  }

  private stepStrikes(dt: number) {
    for (const s of this.strikes) {
      s.t += dt;
      const owner = this.get(s.owner) ?? null;
      if (s.kind === "mortar") {
        if (!s.done && this.time >= s.impactAt) {
          s.done = true;
          this.events.push({ type: "explosion", pos: { ...s.pos }, kind: "mortar", radius: 6 });
          this.noises.push({ pos: s.pos, radius: 60, source: s.owner, team: s.team, kind: "explosion", t: this.time });
          const center = { ...s.pos, y: s.pos.y + 0.4 };
          for (const o of this.players) {
            if (!o.alive || o.team === s.team) continue;
            const c = this.chest(o);
            const dist = vdist(c, center);
            if (dist > 6) continue;
            if (!this.world.lineOfSight(center, c) && !this.world.lineOfSight(center, this.eye(o))) continue;
            this.damage(o, owner, 150 * Math.pow(1 - dist / 6, 0.9), { source: "mortarMark", kind: "support", zone: "strike", from: center, flinch: 1.5 });
          }
        }
      } else if (s.kind === "flight") {
        if (this.time >= s.impactAt) {
          // aircraft position advances 60 m/s along dir across the map
          const k = (this.time - s.impactAt) * 60;
          s.pos = { x: s.pos.x, y: s.pos.y, z: s.pos.z };
          const cur = { x: s.pos.x + s.dir.x * k, y: 34, z: s.pos.z + s.dir.z * k };
          for (const o of this.players) {
            if (!o.alive || o.team === s.team || s.hitSet.has(o.id)) continue;
            const rel = vsub(o.move.pos, cur);
            const along = rel.x * s.dir.x + rel.z * s.dir.z;
            const across = Math.abs(rel.x * -s.dir.z + rel.z * s.dir.x);
            if (along > -2 && along < 6 && across < 4.5) {
              s.hitSet.add(o.id);
              const head = this.eye(o);
              const sky = { x: head.x - s.dir.x * 6, y: head.y + 30, z: head.z - s.dir.z * 6 };
              if (this.world.lineOfSight(sky, head) || this.world.lineOfSight(sky, this.chest(o)))
                this.damage(o, owner, 125, { source: "interdictionFlight", kind: "support", zone: "strike", from: sky, flinch: 1.5 });
            }
          }
          if (k > 200) s.done = true;
        }
      }
    }
    this.strikes = this.strikes.filter((s) => !(s.done && (s.kind === "flight" || this.time - s.impactAt > 1.2)));
    // sweeps
    for (const sw of this.sweeps) {
      while (sw.pulses.length && this.time >= sw.pulses[0]) {
        sw.pulses.shift();
        for (const o of this.players) {
          if (!o.alive || o.team === sw.team) continue;
          const dur = this.hasPerk(o, "signalFilter") ? 1.0 : 2.0;
          this.reveals.push({ team: sw.team, victim: o.id, until: this.time + dur, kind: "sweep" });
        }
        this.events.push({ type: "supportWarning", team: sw.team === 0 ? 1 : 0, id: "reconPulse" });
      }
    }
    this.sweeps = this.sweeps.filter((s) => s.pulses.length > 0);
  }

  private stepReveals() {
    this.reveals = this.reveals.filter((r) => r.until > this.time);
    this.pings = this.pings.filter((p) => p.until > this.time);
  }

  /** Radar information a team is allowed to see (never hidden server state). */
  radarFor(team: Team): RadarBlip[] {
    const out: RadarBlip[] = [];
    for (const o of this.players) {
      if (!o.alive || o.team === team) continue;
      const age = this.time - o.lastShotAt;
      if (age < 1.2 && !o.lastShotSuppressed) { out.push({ x: o.move.pos.x, z: o.move.pos.z, kind: "fire", age }); continue; }
      const r = this.reveals.find((rv) => rv.team === team && rv.victim === o.id);
      if (r) out.push({ x: o.move.pos.x, z: o.move.pos.z, kind: r.kind, age: 0 });
    }
    for (const p of this.pings) if (p.team === team) out.push({ x: p.pos.x, z: p.pos.z, kind: "ping", age: 5 - (p.until - this.time) });
    return out;
  }

  // ---------------------------------------------------------------- snapshot
  snapshot(forId: number): Snapshot {
    const me = this.get(forId)!;
    const players: PlayerSnap[] = this.players.map((p) => ({
      id: p.id, name: p.name, team: p.team, bot: p.bot && p.id !== this.localId, alive: p.alive, pos: { ...p.move.pos }, yaw: p.yaw, pitch: p.pitch,
      crouchT: p.crouchT, speed: Math.hypot(p.move.vel.x, p.move.vel.z), sprinting: p.move.sprinting, onGround: p.move.onGround,
      ads: p.arms.ads, weapon: p.arms.weapons[p.arms.active].stats.def.id, reloading: !!p.arms.weapons[p.arms.active].reload,
      health: p.team === me.team ? p.health : 0, protected: p.protectedActive, mantling: !!p.move.mantle, firing: this.time - p.lastShotAt,
      glint: !!WEAPONS[p.arms.weapons[p.arms.active].stats.def.id].glint && p.arms.ads > 0.6,
      kills: p.stats.kills, deaths: p.stats.deaths, assists: p.stats.assists, score: p.stats.score, supportDestroyed: p.stats.supportDestroyed, ping: p.ping,
    }));
    const w = me.arms.weapons[me.arms.active];
    const other = me.arms.weapons[me.arms.active === 0 ? 1 : 0];
    const lethalDef = EQUIPMENT[me.loadout.lethal], tacDef = EQUIPMENT[me.loadout.tactical];
    const local: LocalSnap = {
      id: me.id, ammo: w.ammo, reserve: w.reserve, mag: w.stats.mag, weaponName: w.stats.def.name, mode: currentMode(w), slot: me.arms.active,
      sidearmAmmo: other.ammo, health: me.health, momentum: me.momentum, supportReady: [...me.supportReady], supportSel: me.supportSel,
      lethal: { id: lethalDef.id, count: me.lethal.count, charge: me.lethal.charge }, tactical: { id: tacDef.id, count: me.tactical.count, charge: me.tactical.charge },
      respawnIn: me.alive ? 0 : Math.max(0, me.respawnAt - this.time), alive: me.alive,
      flash: me.flashUntil > this.time ? Math.min(1, me.flashAmount * Math.min(1, (me.flashUntil - this.time) / 1.2)) : 0,
      spread: currentSpread(me.arms, { speedFrac: Math.hypot(me.move.vel.x, me.move.vel.z) / MOVE.standSpeed, crouch: me.move.crouch, onGround: me.move.onGround }),
      ads: me.arms.ads, adsZoom: w.stats.adsZoom,
      reload: w.reload ? { stage: w.reload.magIn ? (w.reload.kind === "empty" && !w.reload.chamber ? "chamber" : "settle") : w.reload.magOut ? "magIn" : "magOut", t: w.reload.t, total: w.reload.stages.total, kind: w.reload.kind } : null,
      swapT: me.arms.swapDur > 0 ? me.arms.swapT / me.arms.swapDur : 0,
      melee: me.arms.melee ? me.arms.melee.t : -1,
      cooking: me.cookStart !== null ? this.time - me.cookStart : -1,
      sprinting: me.move.sprinting, protected: me.protectedActive,
      uplink: Math.max(0, this.uplinkUntil[me.team] - this.time), inspect: me.arms.inspect,
      lastDamage: this.time - me.lastDamageAt,
    };
    const footprints: Snapshot["footprints"] = [];
    if (this.hasPerk(me, "traceReader")) {
      for (const o of this.players) if (o.team !== me.team) for (const f of o.footprints) if (vdist(f, me.move.pos) < 30) footprints.push({ x: f.x, y: f.y, z: f.z, age: this.time - f.t, yaw: f.yaw });
    }
    const timeLeft = this.phase === "ended" ? 0 : Math.max(0, this.phaseEnd - this.time);
    return {
      tick: this.tickN, time: this.time,
      match: { phase: this.phase, clock: this.phase === "ended" ? Math.max(0, this.phaseEnd - this.time) : timeLeft, scores: [...this.scores] as [number, number], scoreLimit: this.scoreLimit, winner: this.winner, suddenDeathBase: this.suddenBase },
      players,
      projectiles: this.projectiles.map((q): ProjectileSnap => ({ id: q.id, kind: q.kind, pos: { ...q.pos }, team: q.team, owner: q.owner, stuck: q.stuck, armed: q.armed, yaw: q.yaw })),
      smokes: this.smokes.map((s) => ({ id: s.id, pos: { ...s.pos }, radius: this.smokeRadius(s), t: s.t, life: s.life })),
      devices: this.devices.map((d): DeviceSnap => ({ id: d.id, kind: d.kind, pos: { ...d.pos }, team: d.team, hp: d.hp, maxHp: d.maxHp, yaw: d.yaw })),
      strikes: this.strikes.map((s): StrikeSnap => ({ id: s.id, kind: s.kind, team: s.team, pos: { ...s.pos }, dir: { ...s.dir }, t: s.t, impactAt: s.impactAt - this.time })),
      brokenGlass: [...this.brokenGlass],
      local,
      radar: this.radarFor(me.team),
      footprints,
    };
  }

  drainEvents(): GameEvent[] { const e = this.events; this.events = []; return e; }
}
