/**
 * Authoritative match simulation (server-match). Runs at a fixed 30 Hz. The browser build hosts
 * this locally ("local bot mode"); the client talks to it only through inputs in / events + state out.
 */
import {
  AMMO_CAPS, AMMO_TYPES, BOT_NAMES, COMBAT, CONTENT_VERSION, DT, INVENTORY_SLOTS, ITEMS, MATCH, MOVE, WEAPONS, WEAPON_IDS,
  effectiveWeapon, falloffMult, type AmmoType, type ItemId, type WeaponId,
} from '../shared/content';
import { Rng } from '../shared/rng';
import { clamp, dirFromYawPitch, normalize, rightFromYaw, type Vec3 } from '../shared/math';
import { World, rayVerticalCylinder } from './world';
import { StormSchedule, newStormState } from './storm';
import { cameraPose, eyeHeight, muzzlePos } from './camera';
import { newMoveResult, playerHeight, stepMovement } from './movement';
import {
  addAmmo, addItem, findItemSlot, firstEmptySlot, giveWeapon, lootName, selectedWeapon, slotToLoot,
} from './inventory';
import { rollCapsule, rollChest, rollFloor, rollLocker, rollAmmoFor, type LootBudget } from './loot';
import { BotBrain } from './bots';
import {
  emptyInput, type Capsule, type Chest, type GameEvent, type LootEntity, type LootKind, type Phase, type Player,
  type PlayerInput, type Projectile, type Skiff, type Smoke, type StormState,
} from './types';

export interface MatchOptions {
  seed: number;
  mode: 'quick' | 'practice';
  botCount?: number; // total non-human seats filled by bots (default 23)
  stagingSeconds?: number;
  humanName?: string;
  skipStaging?: boolean;
  noHuman?: boolean; // all-bot soak runs
}

export type Focus =
  | { kind: 'loot'; id: number; label: string; rarity: number; weapon?: WeaponId; dist: number }
  | { kind: 'chest'; id: number; label: string; dist: number }
  | { kind: 'zipline'; id: number; dir: number; label: string; dist: number }
  | null;

function makeStats() {
  return {
    kills: 0, assists: 0, damageDealt: 0, damageTaken: 0, stormDamage: 0, shots: 0, hits: 0, headshots: 0, distance: 0,
    lootPicked: [] as { name: string; rarity: number; t: number }[], placement: 0, surviveTime: 0, killedBy: '',
  };
}

/** Deck positions (row along the skiff, column across), nearest the middle first so the human sits centrally. */
const SKIFF_SLOTS: [number, number][] = (() => {
  const s: [number, number][] = [];
  for (let r = -3; r <= 3; r++) for (let c = -2; c <= 2; c++) s.push([r * 1.6, c * 1.5]);
  return s.sort((a, b) => Math.hypot(a[0] * 0.6, a[1]) - Math.hypot(b[0] * 0.6, b[1]));
})();

export function createPlayer(id: number, name: string, isBot: boolean, cosmetic: number): Player {
  return {
    id, name, isBot, cosmetic, alive: true, mode: 'ground', x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, yaw: 0, pitch: 0,
    onGround: true, crouching: false, sliding: false, slideT: 0, slideCd: 0, slideDirX: 0, slideDirZ: 0, slideSpeed: 0,
    stamina: 1, sprintDelay: 0, sprinting: false, mantle: null, zip: null, grapple: null, knockX: 0, knockZ: 0, ventLaunch: false,
    wingOut: false, fallSpeed: 0,
    health: COMBAT.maxHealth, aegis: COMBAT.maxAegis, reserve: 0, lastDamage: -100,
    slots: new Array(INVENTORY_SLOTS).fill(null), selected: 0,
    ammo: { light: 0, shell: 0, heavy: 0, charge: 0 },
    fireCd: 0, reloadT: 0, reloading: false, swapT: 0, windupT: 0, bloom: 0, recoilP: 0, recoilY: 0, recoilIdx: 0, sinceShot: 9, shotCount: 0,
    using: null, meleeCd: 0, interactHold: 0, prevInput: emptyInput(), input: emptyInput(), damageLog: [],
    stats: makeStats(), inSmoke: 0, hazardAcc: 0, lastStormTick: 0, spawnSocket: -1, trail: [], jumpAt: 0,
    shoulder: 1, adsT: 0, swapPending: false, dropCd: 0, beaconUntil: 0,
    hitFlash: 0, lastFootstep: 0, dummy: false, homeX: 0, homeZ: 0,
  };
}

export class Match {
  readonly world: World;
  readonly seed: number;
  readonly mode: 'quick' | 'practice';
  readonly contentVersion = CONTENT_VERSION;
  readonly rng: Rng;
  readonly players: Player[] = [];
  readonly loot = new Map<number, LootEntity>();
  readonly chests = new Map<number, Chest>();
  readonly projectiles: Projectile[] = [];
  readonly smokes: Smoke[] = [];
  readonly capsules: Capsule[] = [];
  readonly schedule: StormSchedule;
  readonly storm: StormState = newStormState();
  readonly sounds: { t: number; x: number; y: number; z: number; pid: number; loud: number; kind: string }[] = [];
  readonly timeline: { t: number; text: string }[] = [];
  readonly brains = new Map<number, BotBrain>();
  events: GameEvent[] = [];
  phase: Phase = 'staging';
  time = 0;
  tickN = 0;
  stagingLeft: number;
  skiff: Skiff;
  clock = 0; // seconds since skiff departure
  stormClock = -1;
  winner = -1;
  endedAt = 0;
  humanId = 0;
  budget: LootBudget = { prototypes: 0 };
  private nextId = 1;
  private nextCapsule = 0;
  private capsuleTimes: number[] = [];
  private lastPhaseAnnounced = -1;
  private tickDeaths: Player[] = [];
  private respawnQueue: { t: number; p: Player }[] = [];
  private tmpB: import('./world').Box[] = [];
  private tmpC: import('./world').Cyl[] = [];
  private rangeStats = { lastDamage: 0, lastZone: '', lastDist: 0 };

  constructor(public readonly opts: MatchOptions) {
    this.seed = opts.seed;
    this.mode = opts.mode;
    this.world = new World(opts.seed, { practice: opts.mode === 'practice' });
    this.rng = new Rng(opts.seed * 977 + 3);
    this.schedule = new StormSchedule(this.world, opts.seed, opts.mode === 'quick');
    this.stagingLeft = opts.skipStaging ? 0.2 : (opts.stagingSeconds ?? MATCH.stagingSeconds);
    const pr = new Rng(opts.seed + 99);
    const zEnd = pr.range(-330, 330);
    const sx = this.world.spawnPad.x, sz = this.world.spawnPad.z;
    const ex = 800, ez = zEnd;
    const len = Math.hypot(ex - sx, ez - sz);
    this.skiff = { x: sx, z: sz, y: this.world.spawnPad.y, dirX: (ex - sx) / len, dirZ: (ez - sz) / len, t: 0, startX: sx, startZ: sz, endX: ex, endZ: ez, speed: MATCH.skiffSpeed, length: len };
    if (this.mode === 'practice') this.initPractice();
    else this.initQuick();
  }

  /* ------------------------------------------------------------ setup */
  private id(): number { return this.nextId++; }

  private initQuick(): void {
    const total = MATCH.players;
    const nBots = this.opts.botCount ?? (this.opts.noHuman ? total : total - 1);
    const rng = new Rng(this.seed + 5);
    let pid = 0;
    if (!this.opts.noHuman) {
      this.players.push(createPlayer(pid++, this.opts.humanName ?? 'You', false, 0));
    } else this.humanId = -1;
    for (let i = 0; i < nBots; i++) {
      const p = createPlayer(pid++, BOT_NAMES[i % BOT_NAMES.length], true, i % 4);
      this.players.push(p);
      this.brains.set(p.id, new BotBrain(this, p, new Rng(this.seed * 13 + p.id * 7919), 0.35 + rng.next() * 0.55));
    }
    const sp = this.world.spawnPad;
    this.players.forEach((p, i) => {
      const a = i / this.players.length;
      p.x = sp.x - 18 + (i % 6) * 7 + rng.range(-1, 1);
      p.z = sp.z - 17 + Math.floor(i / 6) * 11 + rng.range(-1, 1) + a * 0;
      p.y = sp.y;
      p.yaw = Math.atan2(this.skiff.dirX, this.skiff.dirZ);
      p.onGround = true;
    });
    this.spawnLoot();
    this.schedule.stages; // schedule is precomputed
  }

  private initPractice(): void {
    const w = this.world;
    const human = createPlayer(0, this.opts.humanName ?? 'You', false, 0);
    human.x = 0; human.z = 58; human.y = 4; human.yaw = Math.PI;
    this.players.push(human);
    this.phase = 'live';
    this.stagingLeft = 0;
    // target dummies
    const dummies: [number, number, number][] = [[-30, -12, 0], [-14, -30, 1], [0, -48, 0], [16, -30, 1], [34, -14, 0], [-48, -50, 0], [50, -60, 1], [0, -72, 0]];
    dummies.forEach(([x, z, moving], i) => {
      const d = createPlayer(i + 1, `Target ${i + 1}`, true, i % 4);
      d.dummy = true; d.x = x; d.z = z; d.y = w.heightAt(x, z); d.homeX = x; d.homeZ = z; d.yaw = 0; d.onGround = true;
      d.shoulder = moving ? 1 : 0;
      this.players.push(d);
    });
    // weapon rack: 9 weapons x 5 rarities
    WEAPON_IDS.forEach((wid, c) => {
      for (let r = 0; r < 5; r++) {
        const x = -16 + c * 4, z = 66 + r * 3.2;
        this.addLoot({ kind: 'weapon', weapon: wid, rarity: r, mag: effectiveWeapon(wid, r).mag }, x, w.heightAt(x, z) + 0.15, z, 3, 'floor', false);
      }
    });
    AMMO_TYPES.forEach((a, i) => {
      for (let k = 0; k < 2; k++) this.addLoot({ kind: 'ammo', ammo: a, count: 60 }, -10 + i * 5 + k * 1.5, w.heightAt(-10, 52) + 0.15, 52, 3, 'floor', false);
    });
    (Object.keys(ITEMS) as ItemId[]).forEach((it, i) => {
      this.addLoot({ kind: 'item', item: it, count: ITEMS[it].stack }, 22 + (i % 4) * 2.4, w.heightAt(22, 52) + 0.15, 50 + Math.floor(i / 4) * 3, 3, 'floor', false);
    });
    this.addChestAt(34, w.heightAt(34, 46) + 0, 54, 3, 'chest', 'range');
    this.addChestAt(38, w.heightAt(38, 46) + 0, 54, 3, 'locker', 'range');
    this.timeline.push({ t: 0, text: 'Entered the Practice Range' });
  }

  private spawnLoot(): void {
    const rng = new Rng(this.seed * 5 + 1);
    for (const s of this.world.sockets) {
      if (s.kind === 'floor') {
        const rolls = rollFloor(rng, s.tier, s.weaponBias, this.budget);
        rolls.forEach((k, i) => this.addLoot(k, s.x + (i ? 0.7 : 0), s.y, s.z + (i ? 0.4 : 0), s.tier, 'floor', k.kind === 'weapon'));
      } else {
        this.addChestAt(s.x, s.y, s.z, s.tier, s.kind, s.loc);
      }
    }
  }

  private addChestAt(x: number, y: number, z: number, tier: number, kind: 'chest' | 'locker', loc: string): void {
    const id = this.id();
    this.chests.set(id, { id, x, y, z, tier, kind, opened: false, loc });
  }

  addLoot(data: LootKind, x: number, y: number, z: number, tier: number, source: LootEntity['source'], priority: boolean): LootEntity {
    const e: LootEntity = { id: this.id(), x, y, z, data, tier, source, priority, age: 0 };
    this.loot.set(e.id, e);
    return e;
  }

  getPlayer(id: number): Player | undefined { return this.players[id]; }
  get human(): Player | undefined { return this.humanId >= 0 ? this.players[this.humanId] : undefined; }
  aliveCount(): number { let n = 0; for (const p of this.players) if (p.alive && !p.dummy) n++; return n; }
  totalCount(): number { let n = 0; for (const p of this.players) if (!p.dummy) n++; return n; }

  /* ------------------------------------------------------------ main step */
  step(humanInputs?: Map<number, PlayerInput>): void {
    if (this.phase === 'ended') return;
    this.time += DT;
    this.tickN++;

    if (this.phase === 'staging') {
      this.stagingLeft -= DT;
      if (this.stagingLeft <= 0) this.beginSkiff();
    } else if (this.phase === 'skiff') {
      this.updateSkiff();
    }
    if (this.mode === 'quick' && this.phase !== 'staging') {
      this.clock += DT;
      this.updateStorm();
    }

    // gather inputs
    for (const p of this.players) {
      if (!p.alive) continue;
      p.prevInput = p.input;
      if (p.dummy) p.input = this.dummyInput(p);
      else if (p.isBot) {
        const brain = this.brains.get(p.id);
        p.input = brain && this.phase !== 'staging' ? brain.think(DT) : this.idleInput(p);
      } else {
        const hi = humanInputs?.get(p.id);
        p.input = hi ?? { ...emptyInput(), yaw: p.yaw, pitch: p.pitch };
      }
    }

    for (const p of this.players) if (p.alive) this.updatePlayer(p);
    this.updateProjectiles();
    this.updateSmokes();
    this.updateCapsules();
    this.updateLoot();
    this.updateRespawns();
    this.pruneSounds();

    if (this.mode === 'quick' && this.phase === 'live') this.checkEnd();
    this.tickDeaths.length = 0;
  }

  private idleInput(p: Player): PlayerInput {
    return { ...emptyInput(), yaw: p.yaw, pitch: p.pitch };
  }

  private dummyInput(p: Player): PlayerInput {
    const i = emptyInput();
    i.yaw = p.yaw;
    if (p.shoulder === 1 && p.id % 2 === 1) i.moveR = Math.sin(this.time * 0.7 + p.id) > 0 ? 0.7 : -0.7;
    // return towards home if drifted far
    if (Math.abs(p.x - p.homeX) > 8) i.moveR = (p.homeX - p.x) > 0 ? -0.8 : 0.8;
    return i;
  }

  /* ----------------------------------------------------------- skiff */
  private beginSkiff(): void {
    this.phase = 'skiff';
    this.clock = 0;
    for (const p of this.players) {
      if (!p.alive) continue;
      p.mode = 'skiff';
    }
    this.timeline.push({ t: 0, text: 'Skiff departed the staging pier' });
    this.positionRiders();
  }

  private positionRiders(): void {
    const s = this.skiff;
    const px = -s.dirZ, pz = s.dirX;
    let i = 0;
    for (const p of this.players) {
      if (!p.alive || p.mode !== 'skiff') continue;
      const slot = SKIFF_SLOTS[p.id % SKIFF_SLOTS.length];
      const row = slot[0], col = slot[1];
      p.x = s.x + s.dirX * row + px * col;
      p.z = s.z + s.dirZ * row + pz * col;
      p.y = s.y + 1.1;
      p.vx = s.dirX * s.speed; p.vz = s.dirZ * s.speed; p.vy = 0;
      i++; void i;
    }
  }

  private updateSkiff(): void {
    const s = this.skiff;
    s.t += DT;
    s.x = s.startX + s.dirX * s.speed * s.t;
    s.z = s.startZ + s.dirZ * s.speed * s.t;
    const done = s.speed * s.t >= s.length;
    this.positionRiders();
    for (const p of this.players) {
      if (!p.alive || p.mode !== 'skiff') continue;
      const wantsJump = p.input.jump && !p.prevInput.jump;
      const inIsland = Math.hypot(p.x, p.z) < 600;
      if ((wantsJump && inIsland) || done) this.jumpFromSkiff(p);
    }
    if (done) {
      this.phase = 'live';
      this.timeline.push({ t: this.clock, text: 'All players deployed' });
    }
  }

  jumpFromSkiff(p: Player): void {
    if (p.mode !== 'skiff') return;
    p.mode = 'freefall';
    p.vx = this.skiff.dirX * 14; p.vz = this.skiff.dirZ * 14; p.vy = -2;
    p.onGround = false;
    p.jumpAt = this.clock;
    this.events.push({ type: 'jump', pid: p.id });
    if (!p.isBot) this.timeline.push({ t: this.clock, text: 'Jumped from the skiff' });
  }

  /* ----------------------------------------------------------- storm */
  private updateStorm(): void {
    if (this.mode !== 'quick') return;
    const delay = 25;
    if (this.clock < delay) { this.stormClock = -1; this.schedule.at(0, this.storm); this.storm.damage = 0; return; }
    this.stormClock = this.clock - delay;
    this.schedule.at(this.stormClock, this.storm);
    if (this.storm.phase !== this.lastPhaseAnnounced) {
      this.lastPhaseAnnounced = this.storm.phase;
      if (this.storm.phase > 0) {
        this.events.push({ type: 'storm', phase: this.storm.phase, msg: this.storm.label });
        this.timeline.push({ t: this.clock, text: this.storm.label });
      }
    }
  }

  /* ---------------------------------------------------------- players */
  private updatePlayer(p: Player): void {
    const inp = p.input;
    const dt = DT;
    p.stats.surviveTime = this.clock;
    p.hitFlash = Math.max(0, p.hitFlash - dt);
    p.sinceShot += dt;

    if (p.mode === 'skiff') return;

    // slot selection / cycling
    this.handleSelection(p, inp);

    // shoulder swap
    if (inp.swapShoulder && !p.prevInput.swapShoulder) p.shoulder = -p.shoulder;
    p.adsT += ((inp.ads && !p.using && p.mode === 'ground' && !!selectedWeapon(p) ? 1 : 0) - p.adsT) * (1 - Math.exp(-14 * dt));

    // movement
    const res = newMoveResult();
    let healSlow = 1;
    if (p.using) healSlow = ITEMS[p.using.item].slow;
    if (p.mode === 'ground' || p.mode === 'swim') {
      if (inp.deploy && !p.prevInput.deploy) this.tryZipOrDeploy(p);
      if (inp.interact && !p.prevInput.interact && p.mode === 'ground') { /* handled in interact */ }
    }
    stepMovement(this.world, p, inp, p.prevInput, dt, res, healSlow);
    if (res.fallDamage > 0) this.damage(p, res.fallDamage, -1, 'Fall', 'torso', true);
    if (res.landSpeed > 3) this.events.push({ type: 'land', pid: p.id, speed: res.landSpeed });
    if (res.mantled) this.events.push({ type: 'mantle', pid: p.id });
    if (res.slid) this.events.push({ type: 'slide', pid: p.id });
    if (res.jumped) this.events.push({ type: 'jump', pid: p.id });
    if (res.deployed) this.events.push({ type: 'deploy', pid: p.id });
    if (!p.alive) return;

    // trail for echo beacons
    if (this.tickN % 15 === 0) {
      p.trail.push({ x: p.x, y: p.y, z: p.z, t: this.time });
      if (p.trail.length > 24) p.trail.shift();
    }
    // footsteps
    const sp = Math.hypot(p.vx, p.vz);
    if (p.mode === 'ground' && p.onGround && sp > 3 && this.time - p.lastFootstep > (p.sprinting ? 0.32 : 0.45)) {
      p.lastFootstep = this.time;
      const loud = p.crouching ? 6 : p.sprinting ? 34 : 22;
      this.sounds.push({ t: this.time, x: p.x, y: p.y, z: p.z, pid: p.id, loud, kind: 'footstep' });
      if (!p.isBot || this.humanNear(p, 60)) this.events.push({ type: 'sound', kind: 'footstep', x: p.x, y: p.y, z: p.z, pid: p.id, loud });
    }

    // vents
    if (p.mode === 'ground' && p.onGround) {
      for (const v of this.world.vents) {
        if (Math.hypot(p.x - v.x, p.z - v.z) < v.r) {
          p.mode = 'freefall'; p.vy = v.boost; p.onGround = false; p.ventLaunch = true; p.wingOut = false;
          this.events.push({ type: 'jump', pid: p.id });
        }
      }
    }

    // environmental damage
    if (this.mode === 'quick') this.applyEnvironment(p, dt);
    if (!p.alive) return;

    // aegis recharge
    if (this.time - p.lastDamage >= COMBAT.aegisDelay && p.aegis < COMBAT.maxAegis) {
      p.aegis = Math.min(COMBAT.maxAegis, p.aegis + 10 * dt);
    }

    // timers
    p.fireCd = Math.max(0, p.fireCd - dt);
    p.meleeCd = Math.max(0, p.meleeCd - dt);
    p.swapT = Math.max(0, p.swapT - dt);
    p.dropCd = Math.max(0, p.dropCd - dt);
    if (p.sinceShot > 0.14) {
      p.recoilP *= Math.exp(-6 * dt); p.recoilY *= Math.exp(-6 * dt);
      p.bloom = Math.max(0, p.bloom - 3 * dt);
      if (p.sinceShot > 0.35) p.recoilIdx = 0;
    }

    // combat/interaction only while on foot
    if (p.mode === 'ground' || p.mode === 'swim') {
      this.updateReload(p, dt);
      this.updateUsing(p, dt);
      this.updateWindup(p);
      this.handleActions(p, inp);
      this.handleInteract(p, inp, dt);
      this.autoPickupAmmo(p);
    }
  }

  private humanNear(p: Player, r: number): boolean {
    const h = this.human;
    return !!h && h.alive && Math.hypot(h.x - p.x, h.z - p.z) < r;
  }

  private handleSelection(p: Player, inp: PlayerInput): void {
    let target = -1;
    if (inp.slot >= 0 && inp.slot < INVENTORY_SLOTS) target = inp.slot;
    else if (inp.cycle !== 0) {
      for (let k = 1; k <= INVENTORY_SLOTS; k++) {
        const idx = (p.selected + k * inp.cycle + INVENTORY_SLOTS * 8) % INVENTORY_SLOTS;
        if (p.slots[idx]) { target = idx; break; }
      }
    }
    if (target >= 0 && target !== p.selected) {
      p.selected = target;
      p.reloading = false; p.reloadT = 0; p.windupT = 0;
      if (p.using) this.cancelUse(p);
      const s = p.slots[target];
      if (s && s.kind === 'weapon') p.swapT = WEAPONS[s.weapon].swap;
      p.recoilIdx = 0;
    }
  }

  private tryZipOrDeploy(p: Player): void {
    void p;
  }

  private applyEnvironment(p: Player, dt: number): void {
    const st = this.storm;
    if (this.phase === 'live' || this.phase === 'skiff') {
      if (st.damage > 0 && p.mode !== 'skiff') {
        const d = Math.hypot(p.x - st.cx, p.z - st.cz);
        if (d > st.r) {
          const dmg = st.damage * dt;
          p.stats.stormDamage += dmg;
          this.damage(p, dmg, -1, 'Riftstorm', 'torso', true, true);
        }
      }
    }
    if (p.alive && p.onGround && this.world.hazards.length) {
      const dps = this.world.inHazard(p.x, p.z);
      if (dps > 0 && p.y - this.world.heightAt(p.x, p.z) < 1.0) this.damage(p, dps * dt, -1, 'Heat channel', 'torso', true, true);
    }
  }

  /* ------------------------------------------------------- reload/use */
  private updateReload(p: Player, dt: number): void {
    const sw = selectedWeapon(p);
    if (!sw) { p.reloading = false; return; }
    const eff = effectiveWeapon(sw.weapon, sw.rarity);
    const slot = p.slots[sw.slot] as { kind: 'weapon'; mag: number; weapon: WeaponId; rarity: number };
    if (!p.reloading) {
      const wantsReload = (p.input.reload && !p.prevInput.reload) || (slot.mag <= 0 && p.input.fire && p.fireCd <= 0);
      if (wantsReload && slot.mag < eff.mag && p.ammo[eff.def.ammo] > 0 && !p.using && p.swapT <= 0) {
        p.reloading = true; p.reloadT = eff.reload;
        this.events.push({ type: 'reload', pid: p.id, weapon: sw.weapon });
      }
      return;
    }
    p.reloadT -= dt;
    if (p.reloadT <= 0) {
      const need = eff.mag - slot.mag;
      const take = Math.min(need, p.ammo[eff.def.ammo]);
      slot.mag += take;
      p.ammo[eff.def.ammo] -= take;
      p.reloading = false;
    }
  }

  startUse(p: Player, slotIdx: number): boolean {
    const s = p.slots[slotIdx];
    if (!s || s.kind !== 'item' || p.using) return false;
    const def = ITEMS[s.item];
    if (def.useTime <= 0) return false;
    if (s.item === 'medInjector' && p.health >= COMBAT.maxHealth) return false;
    if (s.item === 'traumaKit' && p.health >= COMBAT.maxHealth) return false;
    if (s.item === 'shieldFlask' && p.reserve >= COMBAT.maxReserve) return false;
    if (s.item === 'aegisCell' && p.aegis >= COMBAT.maxAegis) return false;
    p.using = { item: s.item, t: 0, total: def.useTime, slot: slotIdx, h0: p.health };
    p.reloading = false;
    this.events.push({ type: 'use', pid: p.id, item: s.item, done: false });
    return true;
  }
  cancelUse(p: Player): void { p.using = null; }

  private updateUsing(p: Player, dt: number): void {
    const u = p.using;
    if (!u) return;
    const s = p.slots[u.slot];
    if (!s || s.kind !== 'item' || s.item !== u.item) { p.using = null; return; }
    if ((p.input.fire && !p.prevInput.fire && u.t > 0.2) || p.sprinting) { p.using = null; return; }
    const step = dt / u.total;
    u.t += dt;
    switch (u.item) {
      case 'medInjector': p.health = Math.min(COMBAT.maxHealth, p.health + 35 * step); break;
      case 'traumaKit': p.health = Math.min(COMBAT.maxHealth, p.health + Math.max(0, COMBAT.maxHealth - u.h0) * step); break;
      case 'shieldFlask': p.reserve = Math.min(COMBAT.maxReserve, p.reserve + 25 * step); break;
      default: break;
    }
    if (u.t >= u.total) {
      if (u.item === 'aegisCell') p.lastDamage = -100;
      if (u.item === 'traumaKit') p.health = COMBAT.maxHealth;
      s.count -= 1;
      if (s.count <= 0) p.slots[u.slot] = null;
      p.using = null;
      this.events.push({ type: 'use', pid: p.id, item: u.item, done: true });
    }
  }

  /* ----------------------------------------------------------- combat */
  private handleActions(p: Player, inp: PlayerInput): void {
    // melee
    if (inp.melee && !p.prevInput.melee && p.meleeCd <= 0 && !p.using) this.doMelee(p);
    // drop selected
    if (inp.drop && !p.prevInput.drop && p.dropCd <= 0) this.dropSelected(p);
    const fireEdge = inp.fire && !p.prevInput.fire;
    const sel = p.slots[p.selected];
    if (sel && sel.kind === 'item') {
      if (fireEdge || (inp.throwItem && !p.prevInput.throwItem)) this.useSelectedItem(p);
      return;
    }
    if (inp.throwItem && !p.prevInput.throwItem) {
      // throw the first available throwable
      for (const it of ['windOrb', 'mistCapsule'] as ItemId[]) {
        const idx = findItemSlot(p, it);
        if (idx >= 0) { p.selected = idx; this.useSelectedItem(p); return; }
      }
    }
    this.tryFire(p, inp);
  }

  private useSelectedItem(p: Player): void {
    const s = p.slots[p.selected];
    if (!s || s.kind !== 'item') return;
    const def = ITEMS[s.item];
    if (def.useTime > 0) { this.startUse(p, p.selected); return; }
    let consumed = false;
    const origin = muzzlePos(p);
    const pose = cameraPose(this.world, p, 2.4);
    const aim = this.aimPoint(p, pose, 60);
    const dir = normalize({ x: aim.x - origin.x, y: aim.y - origin.y + 1.2, z: aim.z - origin.z });
    switch (s.item) {
      case 'windOrb':
        this.projectiles.push({ id: this.id(), owner: p.id, weapon: 'windOrb', x: origin.x, y: origin.y, z: origin.z, vx: dir.x * 20 + p.vx * 0.3, vy: dir.y * 20, vz: dir.z * 20 + p.vz * 0.3, gravity: 14, damage: 5, splash: 5.5, push: 14, ttl: 3, rarity: 0, kind: 'orb', fuse: 1.6, traveled: 0 });
        this.events.push({ type: 'projectile', pid: p.id, kind: 'orb' });
        consumed = true; break;
      case 'mistCapsule':
        this.projectiles.push({ id: this.id(), owner: p.id, weapon: 'mist', x: origin.x, y: origin.y, z: origin.z, vx: dir.x * 16, vy: dir.y * 16, vz: dir.z * 16, gravity: 14, damage: 0, splash: 0, push: 0, ttl: 3, rarity: 0, kind: 'mist', fuse: 1.2, traveled: 0 });
        this.events.push({ type: 'projectile', pid: p.id, kind: 'mist' });
        consumed = true; break;
      case 'echoBeacon':
        p.beaconUntil = this.time + 8;
        this.events.push({ type: 'beacon', pid: p.id });
        consumed = true; break;
      case 'grappleSpool': {
        const t = this.world.raycast(pose.pos.x, pose.pos.y, pose.pos.z, pose.dir.x, pose.dir.y, pose.dir.z, MOVE.grappleRange + 4, true);
        if (t > 3 && t < MOVE.grappleRange + 4) {
          const hx = pose.pos.x + pose.dir.x * t, hy = pose.pos.y + pose.dir.y * t, hz = pose.pos.z + pose.dir.z * t;
          p.grapple = { x: hx - pose.dir.x * 0.9, y: hy - pose.dir.y * 0.9 + 0.9, z: hz - pose.dir.z * 0.9, t: 3 };
          p.mode = 'grapple'; p.onGround = false; p.mantle = null; p.sliding = false;
          this.events.push({ type: 'grapple', pid: p.id, x: hx, y: hy, z: hz });
          consumed = true;
        }
        break;
      }
      default: break;
    }
    if (consumed) {
      s.count -= 1;
      if (s.count <= 0) p.slots[p.selected] = null;
    }
  }

  private doMelee(p: Player): void {
    p.meleeCd = COMBAT.meleeCooldown;
    this.events.push({ type: 'melee', pid: p.id });
    const fwd = dirFromYawPitch(p.yaw, 0);
    let best: Player | null = null, bd = COMBAT.meleeRange;
    for (const q of this.players) {
      if (q === p || !q.alive || q.mode === 'skiff') continue;
      const dx = q.x - p.x, dz = q.z - p.z, d = Math.hypot(dx, dz);
      if (d > bd || Math.abs(q.y - p.y) > 1.6) continue;
      if ((dx * fwd.x + dz * fwd.z) / (d || 1) < 0.35) continue;
      best = q; bd = d;
    }
    if (best) this.damage(best, COMBAT.meleeDamage, p.id, 'Melee', 'torso', false);
  }

  private dropSelected(p: Player): void {
    const s = p.slots[p.selected];
    if (!s) return;
    const fwd = dirFromYawPitch(p.yaw, 0);
    const x = p.x + fwd.x * 1.2, z = p.z + fwd.z * 1.2;
    const y = Math.max(this.world.heightAt(x, z), p.y) + 0.15;
    this.addLoot(slotToLoot(s), x, Math.min(y, p.y + 0.2), z, 1, 'drop', false);
    p.slots[p.selected] = null;
    p.dropCd = 0.4;
    p.reloading = false;
  }

  private spreadFor(p: Player, def: typeof WEAPONS[WeaponId], eff: ReturnType<typeof effectiveWeapon>): number {
    let s = def.spread * eff.spread;
    s += (def.adsSpread * eff.spread - s) * p.adsT;
    if (p.crouching) s *= 0.75;
    const sp = Math.hypot(p.vx, p.vz);
    if (sp > 1) s *= 1 + sp * 0.05;
    if (!p.onGround) s *= 1.8;
    return s + p.bloom;
  }

  private tryFire(p: Player, inp: PlayerInput): void {
    const sw = selectedWeapon(p);
    if (!sw) return;
    const eff = effectiveWeapon(sw.weapon, sw.rarity);
    const def = eff.def;
    if (p.mode === 'swim' && def.id !== 'harbor') return;
    if (p.fireCd > 0 || p.reloading || p.swapT > 0 || p.using || p.windupT > 0 || p.mode === 'mantle') return;
    const edge = inp.fire && !p.prevInput.fire;
    const want = def.auto ? inp.fire : edge;
    if (!want) return;
    const slot = p.slots[sw.slot] as { kind: 'weapon'; mag: number };
    if (slot.mag <= 0) return; // empty click handled by auto reload
    if (p.sprinting) { p.sprinting = false; }
    if (def.windup > 0) { p.windupT = def.windup; return; }
    this.fireShot(p);
  }

  private updateWindup(p: Player): void {
    if (p.windupT <= 0) return;
    p.windupT -= DT;
    if (p.windupT <= 0) {
      const sw = selectedWeapon(p);
      if (sw && !p.reloading) this.fireShot(p);
    }
  }

  /** Where the camera ray meets the world within `range` (or a far point). */
  private aimPoint(p: Player, pose: ReturnType<typeof cameraPose>, range: number): Vec3 {
    const d = pose.dir;
    let t = this.world.raycast(pose.pos.x, pose.pos.y, pose.pos.z, d.x, d.y, d.z, range, true);
    if (t < 0) t = range;
    // aim at players along the camera ray too (so the crosshair target is honoured)
    for (const q of this.players) {
      if (q === p || !q.alive || q.mode === 'skiff') continue;
      const hit = rayVerticalCylinder(pose.pos.x, pose.pos.y, pose.pos.z, d.x, d.y, d.z, q.x, q.z, 0.4, q.y, q.y + playerHeight(q));
      if (hit && hit.t < t && hit.t > 0.5) t = hit.t;
    }
    t = Math.max(t, 3);
    return { x: pose.pos.x + d.x * t, y: pose.pos.y + d.y * t, z: pose.pos.z + d.z * t };
  }

  private fireShot(p: Player): void {
    const sw = selectedWeapon(p);
    if (!sw) return;
    const eff = effectiveWeapon(sw.weapon, sw.rarity);
    const def = eff.def;
    const slot = p.slots[sw.slot] as { kind: 'weapon'; mag: number };
    slot.mag -= 1;
    p.fireCd = 60 / eff.rpm;
    p.stats.shots += 1;
    p.shotCount += 1;
    p.sinceShot = 0;
    const rng = new Rng((this.seed ^ Math.imul(p.id + 1, 2654435761) ^ Math.imul(p.shotCount, 374761393)) >>> 0);

    // recoil kick (deterministic pattern, scaled by rarity and ADS)
    const pat = def.recoil[p.recoilIdx % def.recoil.length];
    const rscale = eff.recoil * (1 - 0.3 * p.adsT) * (p.crouching ? 0.85 : 1);
    // the aim for THIS shot uses the pre-kick direction; the kick then moves the next one
    const spread = this.spreadFor(p, def, eff);
    const pose = cameraPose(this.world, p, def.adsBoom);
    const aim = this.aimPoint(p, pose, Math.min(def.range, 450));
    const M = muzzlePos(p);
    let base = normalize({ x: aim.x - M.x, y: aim.y - M.y, z: aim.z - M.z });
    // never fire backwards through the camera (muzzle may sit beyond a very close target)
    if (base.x * pose.dir.x + base.y * pose.dir.y + base.z * pose.dir.z < 0.2) base = pose.dir;

    p.recoilP = Math.min(14, p.recoilP + pat[0] * rscale);
    p.recoilY = clamp(p.recoilY + pat[1] * rscale * (p.recoilIdx % 2 ? -1 : 1), -6, 6);
    p.recoilIdx += 1;
    p.bloom = Math.min(def.bloomMax, p.bloom + def.bloomPerShot);

    const loud = def.kind === 'hitscan' ? 140 : 110;
    this.sounds.push({ t: this.time, x: p.x, y: p.y, z: p.z, pid: p.id, loud, kind: 'gunshot' });
    this.events.push({ type: 'sound', kind: 'gunshot', x: p.x, y: p.y, z: p.z, pid: p.id, loud });

    if (def.kind !== 'hitscan') {
      const dirv = this.applySpread(base, spread, rng);
      const proj: Projectile = {
        id: this.id(), owner: p.id, weapon: def.id, x: M.x, y: M.y, z: M.z,
        vx: dirv.x * def.projSpeed, vy: dirv.y * def.projSpeed, vz: dirv.z * def.projSpeed,
        gravity: def.projGravity, damage: eff.damage, splash: def.splash, push: def.push, ttl: def.range / def.projSpeed + 1.5,
        rarity: sw.rarity, kind: def.kind === 'projectile' ? 'rail' : 'gale', fuse: 0, traveled: 0,
      };
      this.projectiles.push(proj);
      this.events.push({ type: 'projectile', pid: p.id, kind: proj.kind });
      this.events.push({ type: 'shot', pid: p.id, weapon: def.id, ox: M.x, oy: M.y, oz: M.z, tx: M.x + dirv.x * 3, ty: M.y + dirv.y * 3, tz: M.z + dirv.z * 3, hit: 'none' });
      return;
    }

    // hitscan: one or many pellets
    const perVictim = new Map<number, { dmg: number; head: boolean; zone: 'head' | 'torso' | 'limb'; dist: number; killedCheck: boolean; top: number }>();
    let anyHit = false;
    for (let k = 0; k < def.pellets; k++) {
      const dirv = this.applySpread(base, spread, rng);
      let worldT = this.world.raycast(M.x, M.y, M.z, dirv.x, dirv.y, dirv.z, def.range);
      if (worldT < 0) worldT = def.range;
      let best: Player | null = null, bt = worldT, bh = 0;
      for (const q of this.players) {
        if (q === p || !q.alive || q.mode === 'skiff') continue;
        if (Math.abs(q.x - M.x) > def.range || Math.abs(q.z - M.z) > def.range) continue;
        const h = playerHeight(q);
        const hit = rayVerticalCylinder(M.x, M.y, M.z, dirv.x, dirv.y, dirv.z, q.x, q.z, 0.38, q.y, q.y + h);
        if (hit && hit.t < bt) { bt = hit.t; best = q; bh = hit.y - q.y; }
      }
      const endT = bt;
      if (k < 3 || def.pellets === 1) {
        this.events.push({ type: 'shot', pid: p.id, weapon: def.id, ox: M.x, oy: M.y, oz: M.z, tx: M.x + dirv.x * endT, ty: M.y + dirv.y * endT, tz: M.z + dirv.z * endT, hit: best ? 'player' : worldT < def.range ? 'world' : 'none' });
      }
      if (best) {
        anyHit = true;
        const h = playerHeight(best);
        const zone: 'head' | 'torso' | 'limb' = bh > h - 0.3 ? 'head' : bh < h * 0.42 ? 'limb' : 'torso';
        const mult = zone === 'head' ? def.headMult : zone === 'limb' ? COMBAT.limbMult : COMBAT.torsoMult;
        const dmg = eff.damage * falloffMult(def, bt) * mult;
        const rec = perVictim.get(best.id) ?? { dmg: 0, head: false, zone: 'torso' as 'head' | 'torso' | 'limb', dist: bt, killedCheck: false, top: 0 };
        rec.dmg += dmg;
        if (zone === 'head') rec.head = true;
        if (dmg > rec.top) { rec.top = dmg; rec.zone = zone; }
        rec.dist = bt;
        perVictim.set(best.id, rec);
      }
    }
    if (anyHit) p.stats.hits += 1;
    for (const [vid, rec] of perVictim) {
      let dmg = rec.dmg;
      if (def.pelletCap > 0) dmg = Math.min(dmg, def.pelletCap * eff.rarity.damage);
      const v = this.players[vid];
      if (rec.head) p.stats.headshots += 1;
      this.damage(v, dmg, p.id, def.name, rec.zone, false, false, p);
      this.rangeStats = { lastDamage: dmg, lastZone: rec.zone, lastDist: rec.dist };
    }
  }

  getRangeStats() { return this.rangeStats; }

  private applySpread(dir: Vec3, spreadDeg: number, rng: Rng): Vec3 {
    if (spreadDeg <= 0) return dir;
    const r = Math.tan((spreadDeg * Math.PI) / 180) * Math.sqrt(rng.next());
    const a = rng.next() * Math.PI * 2;
    const up = Math.abs(dir.y) > 0.98 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };
    const rx = dir.y * up.z - dir.z * up.y, ry = dir.z * up.x - dir.x * up.z, rz = dir.x * up.y - dir.y * up.x;
    const rl = Math.hypot(rx, ry, rz) || 1;
    const R = { x: rx / rl, y: ry / rl, z: rz / rl };
    const U = { x: R.y * dir.z - R.z * dir.y, y: R.z * dir.x - R.x * dir.z, z: R.x * dir.y - R.y * dir.x };
    const ca = Math.cos(a) * r, sa = Math.sin(a) * r;
    return normalize({ x: dir.x + R.x * ca + U.x * sa, y: dir.y + R.y * ca + U.y * sa, z: dir.z + R.z * ca + U.z * sa });
  }

  /* ---------------------------------------------------------- damage */
  damage(v: Player, amount: number, attacker: number, source: string, zone: 'head' | 'torso' | 'limb', bypass: boolean, silent = false, atk?: Player): void {
    if (!v.alive || amount <= 0) return;
    if (v.mode === 'skiff') return;
    let rem = amount;
    let shieldBreak = false;
    const before = v.health + v.aegis + v.reserve;
    if (!bypass) {
      if (v.aegis > 0) {
        const t = Math.min(v.aegis, rem); v.aegis -= t; rem -= t;
        if (v.aegis <= 0.001 && t > 0) { v.aegis = 0; shieldBreak = true; }
      }
      if (rem > 0 && v.reserve > 0) {
        const t = Math.min(v.reserve, rem); v.reserve -= t; rem -= t;
      }
    }
    if (rem > 0) v.health -= rem;
    if (silent) v.lastDamage = this.time; // storms also interrupt Aegis recharge
    else v.lastDamage = this.time;
    const applied = Math.min(amount, before);
    v.stats.damageTaken += applied;
    v.hitFlash = 0.25;
    if (v.using && ITEMS[v.using.item].cancelOnDamage && !silent) v.using = null;
    if (v.using && ITEMS[v.using.item].cancelOnDamage && silent) v.using = null;
    const a = attacker >= 0 ? this.players[attacker] : undefined;
    if (a && a.id !== v.id) {
      v.damageLog.push({ by: attacker, amount: applied, t: this.time });
      a.stats.damageDealt += applied;
    }
    const killed = v.health <= 0;
    if (!silent) {
      let dx = 0, dz = 0;
      if (a) { dx = a.x - v.x; dz = a.z - v.z; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l; }
      this.events.push({ type: 'damage', victim: v.id, amount: applied, source, dirX: dx, dirZ: dz });
      if (a) this.events.push({ type: 'hit', attacker, victim: v.id, amount: applied, zone, shieldBreak, killed, weapon: source });
    }
    void atk;
    if (killed) this.kill(v, attacker, source);
  }

  private kill(v: Player, attacker: number, source: string): void {
    v.health = 0;
    v.alive = false;
    v.mode = 'dead';
    v.using = null; v.reloading = false;
    const alive = this.aliveCount() + (v.dummy ? 0 : 1);
    // credit: last attacker within 12 s (environment credits recent attackers within 8 s)
    let killer = attacker;
    const recent = v.damageLog.filter((d) => this.time - d.t <= COMBAT.assistWindow);
    if (killer < 0) {
      const last = [...recent].reverse().find((d) => this.time - d.t <= 8);
      if (last) killer = last.by;
    }
    const assisters = new Set<number>();
    for (const d of recent) if (d.by !== killer && d.by !== v.id) assisters.add(d.by);
    const k = killer >= 0 ? this.players[killer] : undefined;
    if (k && k.id !== v.id && !v.dummy) k.stats.kills += 1;
    if (k && v.dummy) k.stats.kills += 0;
    for (const id of assisters) { const a = this.players[id]; if (a && !v.dummy) a.stats.assists += 1; }
    if (!v.dummy) {
      v.stats.placement = alive;
      v.stats.killedBy = k ? k.name : source;
    }
    v.stats.surviveTime = this.clock;
    this.events.push({ type: 'kill', killer, victim: v.id, weapon: source, assists: [...assisters], placement: alive });
    if (!v.dummy) this.timeline.push({ t: this.clock, text: k ? `${k.name} eliminated ${v.name}` : `${v.name} was eliminated (${source})` });
    this.dropDeathLoot(v);
    this.tickDeaths.push(v);
    if (v.dummy) this.respawnQueue.push({ t: this.time + 3.5, p: v });
    else if (this.mode === 'practice') this.respawnQueue.push({ t: this.time + 1.5, p: v });
  }

  private dropDeathLoot(v: Player): void {
    const ground = (x: number, z: number) => Math.max(this.world.groundHeight(x, z, v.y + 0.6, 0.7, 0.3, this.tmpB, this.tmpC), this.world.waterLevel - 0.6) + 0.15;
    let n = 0;
    const weapons = v.slots.filter((s) => s && s.kind === 'weapon');
    for (const s of weapons) {
      if (!s) continue;
      const a = (n / Math.max(1, weapons.length)) * Math.PI * 2 + 0.7;
      const x = v.x + Math.cos(a) * 0.9, z = v.z + Math.sin(a) * 0.9;
      this.addLoot(slotToLoot(s), x, ground(x, z), z, 1, 'death', true);
      n++;
    }
    const items: { item: ItemId; count: number }[] = [];
    for (const s of v.slots) if (s && s.kind === 'item') items.push({ item: s.item, count: s.count });
    const ammo: Partial<Record<AmmoType, number>> = {};
    let any = items.length > 0;
    for (const t of AMMO_TYPES) if (v.ammo[t] > 0) { ammo[t] = v.ammo[t]; any = true; }
    if (any) this.addLoot({ kind: 'cache', items, ammo, owner: v.name }, v.x, ground(v.x, v.z), v.z, 1, 'death', true);
    v.slots.fill(null);
    for (const t of AMMO_TYPES) v.ammo[t] = 0;
  }

  private updateRespawns(): void {
    for (let i = this.respawnQueue.length - 1; i >= 0; i--) {
      const r = this.respawnQueue[i];
      if (this.time < r.t) continue;
      this.respawnQueue.splice(i, 1);
      const p = r.p;
      p.alive = true; p.health = COMBAT.maxHealth; p.aegis = COMBAT.maxAegis; p.reserve = 0; p.mode = 'ground';
      p.damageLog.length = 0;
      if (p.dummy) { p.x = p.homeX; p.z = p.homeZ; p.y = this.world.heightAt(p.x, p.z); }
      else { p.x = 0; p.z = 58; p.y = 4; p.yaw = Math.PI; p.vx = p.vz = p.vy = 0; p.onGround = true; }
      p.onGround = true;
    }
  }

  /* ----------------------------------------------------------- loot */
  private updateLoot(): void {
    for (const e of this.loot.values()) e.age += DT;
  }

  private autoPickupAmmo(p: Player): void {
    if (p.isBot && this.tickN % 4 !== 0) return;
    for (const e of this.loot.values()) {
      if (e.data.kind !== 'ammo') continue;
      const dx = e.x - p.x, dz = e.z - p.z;
      if (dx * dx + dz * dz > 1.7 * 1.7 || Math.abs(e.y - p.y) > 2) continue;
      const added = addAmmo(p, e.data.ammo, e.data.count);
      if (added > 0) {
        e.data.count -= added;
        p.stats.lootPicked.push({ name: `${e.data.ammo} ammo`, rarity: 0, t: this.clock });
        this.events.push({ type: 'pickup', pid: p.id, name: `${e.data.ammo[0].toUpperCase()}${e.data.ammo.slice(1)} Ammo +${added}`, rarity: 0 });
        if (e.data.count <= 0) this.loot.delete(e.id);
      }
    }
  }

  focusFor(p: Player): Focus {
    let best: Focus = null;
    let bs = Infinity;
    const fwd = dirFromYawPitch(p.yaw, 0);
    const consider = (f: NonNullable<Focus>, x: number, z: number, y: number) => {
      const dx = x - p.x, dz = z - p.z;
      const d = Math.hypot(dx, dz);
      if (d > 2.9 || Math.abs(y - p.y) > 2.4) return;
      const facing = d > 0.01 ? (dx * fwd.x + dz * fwd.z) / d : 1;
      const score = d - facing * 0.9;
      if (score < bs) { bs = score; best = { ...f, dist: d } as Focus; }
    };
    for (const e of this.loot.values()) {
      if (e.data.kind === 'ammo') continue; // auto pickup
      const rarity = e.data.kind === 'weapon' ? e.data.rarity : 0;
      consider({ kind: 'loot', id: e.id, label: lootName(e.data), rarity, weapon: e.data.kind === 'weapon' ? e.data.weapon : undefined, dist: 0 }, e.x, e.z, e.y);
    }
    for (const c of this.chests.values()) {
      if (c.opened) continue;
      consider({ kind: 'chest', id: c.id, label: c.kind === 'chest' ? 'Resonance Chest' : 'Supply Locker', dist: 0 }, c.x, c.z, c.y);
    }
    for (const z of this.world.ziplines) {
      for (const dir of [1, -1]) {
        const e = dir > 0 ? z.a : z.b;
        if (dir < 0 && z.b.y - 1.9 < this.world.heightAt(z.b.x, z.b.z) + 1.5) continue; // low end: no boarding
        consider({ kind: 'zipline', id: z.id, dir, label: `Ride ${z.name}`, dist: 0 }, e.x, e.z, e.y - 1.9);
      }
    }
    return best;
  }

  private handleInteract(p: Player, inp: PlayerInput, dt: number): void {
    if (!inp.interact) { p.interactHold = 0; p.swapPending = false; return; }
    const edge = !p.prevInput.interact;
    p.interactHold += dt;
    if (edge) {
      const f = this.focusFor(p);
      if (!f) return;
      const ok = this.interactWith(p, f, false);
      if (!ok) p.swapPending = true;
    } else if (p.swapPending && p.interactHold >= 0.45) {
      const f = this.focusFor(p);
      p.swapPending = false;
      if (f) this.interactWith(p, f, true);
    }
  }

  /** Returns true if the interaction completed. */
  interactWith(p: Player, f: NonNullable<Focus>, swap: boolean): boolean {
    if (f.kind === 'zipline') {
      const z = this.world.ziplines[f.id];
      const e = f.dir > 0 ? z.a : z.b;
      p.mode = 'zipline';
      p.zip = { id: f.id, dist: 0, dir: f.dir, len: Math.hypot(z.b.x - z.a.x, z.b.y - z.a.y, z.b.z - z.a.z) };
      p.x = e.x; p.y = e.y - 1.9; p.z = e.z; p.onGround = false; p.vx = p.vy = p.vz = 0;
      p.using = null; p.reloading = false;
      return true;
    }
    if (f.kind === 'chest') {
      const c = this.chests.get(f.id);
      if (!c || c.opened) return true;
      c.opened = true;
      const rng = new Rng((this.seed * 31 + f.id * 7) >>> 0);
      const rolls = c.kind === 'chest' ? rollChest(rng, c.tier, this.budget) : rollLocker(rng);
      rolls.forEach((k, i) => {
        const a = (i / rolls.length) * Math.PI * 2 + 0.4;
        this.addLoot(k, c.x + Math.cos(a) * 1.25, c.y + 0.15, c.z + Math.sin(a) * 1.25, c.tier, c.kind === 'chest' ? 'chest' : 'locker', k.kind === 'weapon');
      });
      this.events.push({ type: 'chest', pid: p.id, id: c.id, x: c.x, y: c.y, z: c.z });
      return true;
    }
    const e = this.loot.get(f.id);
    if (!e) return true;
    const d = e.data;
    if (d.kind === 'weapon') {
      let idx = giveWeapon(p, d.weapon, d.rarity, d.mag);
      if (idx < 0) {
        if (!swap) return false;
        // swap with the selected slot
        const cur = p.slots[p.selected];
        if (cur) this.addLoot(slotToLoot(cur), p.x + 0.9, p.y + 0.15, p.z + 0.2, 1, 'drop', false);
        p.slots[p.selected] = { kind: 'weapon', weapon: d.weapon, rarity: d.rarity, mag: d.mag };
        idx = p.selected;
      }
      this.loot.delete(e.id);
      p.reloading = false;
      p.stats.lootPicked.push({ name: WEAPONS[d.weapon].name, rarity: d.rarity, t: this.clock });
      this.events.push({ type: 'pickup', pid: p.id, name: WEAPONS[d.weapon].name, rarity: d.rarity });
      if (p.slots[p.selected] === null) p.selected = idx;
      return true;
    }
    if (d.kind === 'item') {
      const added = addItem(p, d.item, d.count);
      if (added <= 0) {
        if (!swap) { this.events.push({ type: 'full', pid: p.id }); return false; }
        const cur = p.slots[p.selected];
        if (cur) this.addLoot(slotToLoot(cur), p.x + 0.9, p.y + 0.15, p.z + 0.2, 1, 'drop', false);
        p.slots[p.selected] = { kind: 'item', item: d.item, count: d.count };
        this.loot.delete(e.id);
        return true;
      }
      d.count -= added;
      if (d.count <= 0) this.loot.delete(e.id);
      p.stats.lootPicked.push({ name: ITEMS[d.item].name, rarity: 0, t: this.clock });
      this.events.push({ type: 'pickup', pid: p.id, name: `${ITEMS[d.item].name}${added > 1 ? ` x${added}` : ''}`, rarity: 0 });
      return true;
    }
    if (d.kind === 'cache') {
      let tookAny = false;
      d.items = d.items.filter((it) => {
        const a = addItem(p, it.item, it.count);
        if (a > 0) { tookAny = true; this.events.push({ type: 'pickup', pid: p.id, name: `${ITEMS[it.item].name}${a > 1 ? ` x${a}` : ''}`, rarity: 0 }); }
        it.count -= a;
        return it.count > 0;
      });
      for (const t of AMMO_TYPES) {
        const have = d.ammo[t] ?? 0;
        if (have > 0) {
          const a = addAmmo(p, t, have);
          if (a > 0) { tookAny = true; this.events.push({ type: 'pickup', pid: p.id, name: `${t[0].toUpperCase()}${t.slice(1)} Ammo +${a}`, rarity: 0 }); }
          d.ammo[t] = have - a;
        }
      }
      const empty = d.items.length === 0 && AMMO_TYPES.every((t) => (d.ammo[t] ?? 0) <= 0);
      if (empty) this.loot.delete(e.id);
      if (!tookAny) { this.events.push({ type: 'full', pid: p.id }); return true; }
      return true;
    }
    return true;
  }

  /* ------------------------------------------------------ projectiles */
  private updateProjectiles(): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      const px = pr.x, py = pr.y, pz = pr.z;
      pr.vy -= pr.gravity * DT;
      pr.x += pr.vx * DT; pr.y += pr.vy * DT; pr.z += pr.vz * DT;
      pr.ttl -= DT;
      if (pr.fuse > 0) pr.fuse -= DT;
      const dx = pr.x - px, dy = pr.y - py, dz = pr.z - pz;
      const seg = Math.hypot(dx, dy, dz) || 0.001;
      const dir = { x: dx / seg, y: dy / seg, z: dz / seg };
      pr.traveled += seg;
      let wt = this.world.raycast(px, py, pz, dir.x, dir.y, dir.z, seg);
      let hitPlayer: Player | null = null, ht = seg + 1, hy = 0;
      for (const q of this.players) {
        if (!q.alive || q.mode === 'skiff') continue;
        if (q.id === pr.owner && (pr.kind === 'rail' || pr.traveled < 3)) continue;
        const hit = rayVerticalCylinder(px, py, pz, dir.x, dir.y, dir.z, q.x, q.z, 0.4, q.y, q.y + playerHeight(q));
        if (hit && hit.t <= seg && hit.t < ht) { ht = hit.t; hitPlayer = q; hy = hit.y - q.y; }
      }
      let detonate = false;
      if (pr.kind === 'rail') {
        if (hitPlayer && (wt < 0 || ht < wt)) {
          const owner = this.players[pr.owner];
          const def = WEAPONS['longwake'];
          const h = playerHeight(hitPlayer);
          const zone: 'head' | 'torso' | 'limb' = hy > h - 0.3 ? 'head' : hy < h * 0.42 ? 'limb' : 'torso';
          const mult = zone === 'head' ? def.headMult : zone === 'limb' ? COMBAT.limbMult : 1;
          const dmg = pr.damage * falloffMult(def, pr.traveled) * mult;
          if (owner) { owner.stats.hits += 1; if (zone === 'head') owner.stats.headshots += 1; }
          this.damage(hitPlayer, dmg, pr.owner, def.name, zone, false, false, owner);
          this.rangeStats = { lastDamage: dmg, lastZone: zone, lastDist: pr.traveled };
          this.projectiles.splice(i, 1);
          continue;
        }
        if (wt >= 0 || pr.ttl <= 0) this.projectiles.splice(i, 1);
        continue;
      }
      if (hitPlayer && (wt < 0 || ht < wt)) { wt = ht; detonate = true; }
      else if (wt >= 0) detonate = true;
      if (pr.ttl <= 0) detonate = true;
      if (pr.kind !== 'gale' && pr.fuse <= 0) detonate = true;
      if (detonate) {
        const t = wt >= 0 ? Math.max(0, wt - 0.05) : seg;
        const ex = px + dir.x * t, ey = py + dir.y * t, ez = pz + dir.z * t;
        this.projectiles.splice(i, 1);
        if (pr.kind === 'mist') {
          const sm: Smoke = { id: this.id(), x: ex, y: ey, z: ez, r: 5.5, t: 0, life: 9 };
          this.smokes.push(sm);
          this.events.push({ type: 'smoke', x: ex, y: ey, z: ez, r: sm.r });
        } else this.explode(ex, ey, ez, pr);
      }
    }
  }

  private explode(x: number, y: number, z: number, pr: Projectile): void {
    this.events.push({ type: 'explosion', x, y, z, r: pr.splash, kind: pr.kind === 'gale' ? 'gale' : 'orb' });
    this.sounds.push({ t: this.time, x, y, z, pid: pr.owner, loud: 90, kind: 'gunshot' });
    for (const q of this.players) {
      if (!q.alive || q.mode === 'skiff') continue;
      const cy = q.y + 0.9;
      const d = Math.hypot(q.x - x, cy - y, q.z - z);
      if (d > pr.splash) continue;
      const fall = 1 - d / pr.splash;
      let dmg = pr.damage * fall;
      if (q.id === pr.owner) dmg = pr.kind === 'gale' ? 1 : 0;
      const hx = q.x - x, hz = q.z - z;
      const hl = Math.hypot(hx, hz) || 1;
      const mag = pr.push * (0.45 + 0.55 * fall);
      q.knockX += (hx / hl) * mag; q.knockZ += (hz / hl) * mag;
      if (q.mode === 'ground' || q.mode === 'swim') {
        q.vy = Math.max(q.vy, mag * 0.45); q.onGround = false; q.mode = 'ground'; q.sliding = false;
      }
      if (dmg > 0) this.damage(q, dmg, pr.owner, pr.kind === 'gale' ? 'Gale Launcher' : 'Wind Orb', 'torso', false);
    }
  }

  private updateSmokes(): void {
    for (let i = this.smokes.length - 1; i >= 0; i--) {
      this.smokes[i].t += DT;
      if (this.smokes[i].t > this.smokes[i].life) this.smokes.splice(i, 1);
    }
  }
  /** True if a sight line a->b passes through a mist cloud. */
  lineThroughSmoke(a: Vec3, b: Vec3): boolean {
    for (const s of this.smokes) {
      const dx = b.x - a.x, dz = b.z - a.z;
      const l2 = dx * dx + dz * dz || 1;
      const t = clamp(((s.x - a.x) * dx + (s.z - a.z) * dz) / l2, 0, 1);
      const cx = a.x + dx * t, cz = a.z + dz * t;
      if (Math.hypot(cx - s.x, cz - s.z) < s.r * 0.85) return true;
    }
    return false;
  }

  /* --------------------------------------------------------- capsules */
  private updateCapsules(): void {
    if (this.mode !== 'quick') return;
    if (this.capsuleTimes.length === 0) {
      for (const ph of [4, 6, 7]) {
        const st = this.schedule.stages.find((s) => s.phase === ph);
        if (st) this.capsuleTimes.push(st.start + 5);
      }
    }
    if (this.nextCapsule < this.capsuleTimes.length && this.stormClock >= this.capsuleTimes[this.nextCapsule]) {
      this.nextCapsule++;
      // land somewhere within the current field
      const rng = new Rng(this.seed * 17 + this.nextCapsule * 131);
      for (let tries = 0; tries < 40; tries++) {
        const a = rng.range(0, Math.PI * 2), d = rng.range(0, this.storm.r * 0.6);
        const x = this.storm.cx + Math.cos(a) * d, z = this.storm.cz + Math.sin(a) * d;
        if (this.world.heightAt(x, z) > 2 && this.world.slopeAt(x, z) < 0.35) {
          const g = this.world.groundHeight(x, z, this.world.heightAt(x, z) + 0.1, 0.1, 1.2, this.tmpB, this.tmpC);
          if (g > this.world.heightAt(x, z) + 0.5) continue;
          this.capsules.push({ id: this.id(), x, z, y: g + 260, landed: false, opened: false, t: 0 });
          this.events.push({ type: 'capsule', x, z, stage: 'incoming' });
          this.timeline.push({ t: this.clock, text: 'Supply capsule inbound' });
          break;
        }
      }
    }
    for (const c of this.capsules) {
      if (c.landed) continue;
      const g = this.world.heightAt(c.x, c.z);
      c.y -= 16 * DT;
      if (c.y <= g) {
        c.y = g; c.landed = true;
        this.events.push({ type: 'capsule', x: c.x, z: c.z, stage: 'landed' });
        const rng = new Rng(this.seed * 23 + c.id);
        const rolls = rollCapsule(rng, this.budget);
        rolls.forEach((k, i) => {
          const a = (i / rolls.length) * Math.PI * 2;
          this.addLoot(k, c.x + Math.cos(a) * 1.8, g + 0.15, c.z + Math.sin(a) * 1.8, 5, 'capsule', true);
        });
        c.opened = true;
      }
    }
  }

  /* ------------------------------------------------------------- end */
  private checkEnd(): void {
    const alive = this.players.filter((p) => p.alive && !p.dummy);
    if (alive.length > 1) {
      if (this.clock > 40 * 60) this.finish(alive.sort((a, b) => b.health - a.health || a.id - b.id)[0]);
      return;
    }
    let winner: Player | undefined = alive[0];
    if (!winner) {
      // simultaneous final eliminations: deterministic tie-break
      const cand = [...this.tickDeaths].filter((p) => !p.dummy).sort((a, b) => b.stats.kills - a.stats.kills || b.stats.damageDealt - a.stats.damageDealt || a.id - b.id);
      winner = cand[0];
      if (winner) {
        winner.stats.placement = 1;
        cand.slice(1).forEach((p, i) => { p.stats.placement = 2 + i; });
      }
    }
    if (winner) this.finish(winner);
  }

  private finish(w: Player): void {
    this.winner = w.id;
    w.stats.placement = 1;
    w.stats.surviveTime = this.clock;
    this.phase = 'ended';
    this.endedAt = this.time;
    this.events.push({ type: 'end', winner: w.id });
    this.timeline.push({ t: this.clock, text: `${w.name} won the match` });
  }

  /* ------------------------------------------------------------ misc */
  private pruneSounds(): void {
    while (this.sounds.length && this.time - this.sounds[0].t > 3) this.sounds.shift();
  }

  drainEvents(): GameEvent[] {
    const e = this.events;
    this.events = [];
    return e;
  }

  /** Recent trails of other players near `p` while an Echo Beacon is active (direction/age only). */
  beaconTrails(p: Player): { x: number; z: number; age: number }[] {
    if (this.time > p.beaconUntil) return [];
    const out: { x: number; z: number; age: number }[] = [];
    for (const q of this.players) {
      if (q === p || !q.alive || q.mode === 'skiff') continue;
      if (Math.hypot(q.x - p.x, q.z - p.z) > 80) continue;
      for (const t of q.trail) out.push({ x: t.x, z: t.z, age: this.time - t.t });
    }
    return out;
  }

  /** A deterministic compact digest used by tests and replay checks. */
  digest(): string {
    let h = 2166136261 >>> 0;
    const mix = (v: number) => { h ^= Math.round(v * 100) | 0; h = Math.imul(h, 16777619) >>> 0; };
    for (const p of this.players) { mix(p.x); mix(p.y); mix(p.z); mix(p.health); mix(p.alive ? 1 : 0); }
    mix(this.tickN);
    return h.toString(16);
  }
}

export { eyeHeight, firstEmptySlot, rollAmmoFor };
