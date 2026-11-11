// Authoritative match room. Owns lifecycle (staging -> skiff -> live ->
// ended), players, storm, loot, combat, bots and winner. Deterministic from
// (seed, human input frames), which is what the replay log records.

import { Rng, hash2 } from '../shared/rng';
import { DT, HEALTH_MAX, AEGIS_MAX, RESERVE_MAX, AEGIS_DELAY, AEGIS_RATE, ATTRIBUTION_WINDOW, MATCH_SEATS, STAGING_SECONDS, SKIFF_ALTITUDE, SKIFF_SPEED, PACE_SCALE, MatchPace, RULESET_VERSION, MOVE } from '../shared/content/rules';
import { WEAPONS, weaponStats, AMMO_CAPS, AmmoType, AMMO_TYPES, WEAPON_IDS, AMMO_PICKUP, WeaponId } from '../shared/content/weapons';
import { ITEMS, ItemId, ITEM_IDS } from '../shared/content/items';
import { RARITIES, Rarity } from '../shared/content/rarity';
import { getIsland, IslandData, WATER_LEVEL } from '../shared/world/island';
import { CollisionWorld, getCollisionWorld, raySphere } from '../shared/world/collision';
import { newMoveState, stepMovement, findTraversal, attachTraversal, startGrapple, MoveInput } from '../shared/sim/movement';
import { cameraRig, aimRayStart, muzzle, coneDir } from '../shared/sim/aim';
import { BTN, InputFrame, GameEvent, Snapshot, Slot, InvAction, FocusView, MatchResult, ActorView, LootView, ContainerView } from '../shared/protocol/messages';
import { planStorm, stormAt, StormPlan, StormNow, stormView } from './storm';
import { LootTables, LootRoll } from './loot';
import { fireHitscan, rayPlayers, resolveAimPoint, currentSpread, smokeBlocks } from './combat';
import type { Player, LootItem, Container, Projectile, Smoke, PlayerStats } from './types';
import { BotBrain } from './bots/brain';
import { getNav, NavGrid } from './bots/nav';

export interface MatchOptions {
  seed: number;
  mode: 'solo' | 'practice';
  pace?: MatchPace;
  humans?: { name: string; body: number; glider: number }[];
  seats?: number;
  stagingSeconds?: number;
}

const BOT_NAMES = [
  'Wren', 'Tallow', 'Quill', 'Marrow', 'Brisk', 'Juniper', 'Cobble', 'Saffron', 'Gully', 'Rook', 'Fennel', 'Larkspur',
  'Pike', 'Ember', 'Thistle', 'Cairn', 'Dune', 'Moth', 'Sorrel', 'Vesper', 'Kestrel', 'Ochre', 'Bramble', 'Tamsin',
  'Harrow', 'Nimbus', 'Flint', 'Cress', 'Loam', 'Skerry',
];

export const INTEREST_RADIUS = 260;
const LOOT_RADIUS = 90;

export class Match {
  readonly island: IslandData;
  readonly w: CollisionWorld;
  readonly opts: Required<Omit<MatchOptions, 'humans'>> & { humans: NonNullable<MatchOptions['humans']> };
  nav: NavGrid | null = null;
  tick = 0;
  time = 0;
  phase: Snapshot['phase'] = 'staging';
  phaseEnd = 0;
  players: Player[] = [];
  loot = new Map<number, LootItem>();
  containers: Container[] = [];
  projectiles: Projectile[] = [];
  smokes: Smoke[] = [];
  events: GameEvent[] = [];
  rng: Rng;
  shotRng: Rng;
  lootTables: LootTables;
  storm: StormPlan;
  stormStart = -1;
  stormNow: StormNow;
  skiff: { ax: number; az: number; bx: number; bz: number; t: number; dur: number; x: number; y: number; z: number; active: boolean } | null = null;
  capsules: { id: number; x: number; y: number; z: number; landed: boolean; spawned: number }[] = [];
  capsulePhasesDone = new Set<number>();
  caravan: { x: number; y: number; z: number; path: { x: number; z: number }[]; wp: number; shield: number; alive: boolean; lastPulse: number } | null = null;
  timeline: { t: number; text: string }[] = [];
  winner: Player | null = null;
  nextId = 1;
  /** Audible events for bot perception (gunshots), kept ~2s. */
  noise: { x: number; z: number; t: number; by: number; r: number }[] = [];
  diedThisTick: Player[] = [];
  replay: { seed: number; ruleset: string; manifest: string; frames: [number, number, InputFrame][] };
  readonly seats: number;
  private practiceRespawns: { at: number; roll: LootRoll; x: number; y: number; z: number; key: string }[] = [];

  constructor(options: MatchOptions) {
    this.opts = {
      seed: options.seed >>> 0,
      mode: options.mode,
      pace: options.pace ?? 'standard',
      humans: options.humans ?? [],
      seats: options.seats ?? MATCH_SEATS,
      stagingSeconds: options.stagingSeconds ?? STAGING_SECONDS,
    };
    this.seats = this.opts.mode === 'practice' ? this.opts.humans.length : this.opts.seats;
    this.island = getIsland();
    this.w = getCollisionWorld(this.island);
    this.rng = new Rng(this.opts.seed);
    this.shotRng = new Rng(hash2(this.opts.seed, 77));
    this.lootTables = new LootTables(new Rng(hash2(this.opts.seed, 1234)));
    this.storm = planStorm(this.opts.seed, this.island, PACE_SCALE[this.opts.pace]);
    this.stormNow = stormAt(this.storm, 0);
    this.replay = { seed: this.opts.seed, ruleset: RULESET_VERSION, manifest: this.island.manifestHash, frames: [] };

    const pier = this.island.pier;
    let i = 0;
    for (const h of this.opts.humans) this.addPlayer(h.name, false, h.body, h.glider, i++);
    const names = [...BOT_NAMES];
    for (let k = names.length - 1; k > 0; k--) {
      const j = Math.floor(this.rng.next() * (k + 1));
      [names[k], names[j]] = [names[j], names[k]];
    }
    if (this.opts.mode === 'solo') {
      while (this.players.length < this.seats) {
        const p = this.addPlayer(names[(this.players.length) % names.length], true, this.rng.int(0, 3), this.rng.int(0, 3), i++);
        p.bot = new BotBrain(p, this.rng.fork(p.id).next());
      }
      if (this.players.some((p) => p.bot)) this.nav = getNav(this.w);
      this.spawnWorldLoot();
      this.phase = 'staging';
      this.phaseEnd = this.opts.stagingSeconds;
      this.spawnPracticeRacks();
    } else {
      this.phase = 'live';
      this.phaseEnd = Infinity;
      this.spawnPracticeRacks();
      this.spawnDummies();
    }
    void pier;
  }

  private addPlayer(name: string, isBot: boolean, body: number, glider: number, idx: number): Player {
    const pier = this.island.pier;
    const col = idx % 8, row = Math.floor(idx / 8);
    const x = pier.spawn.x + row * 3, z = pier.spawn.z - 10.5 + col * 3;
    const p: Player = {
      id: this.players.length, name, isBot, isDummy: false, body, glider,
      ms: newMoveState(x, pier.y, z, Math.PI / 2),
      alive: true, health: HEALTH_MAX, aegis: AEGIS_MAX, reserve: 0, lastDamage: -100, aegisBoost: false,
      slots: [null, null, null, null, null], sel: 0, ammo: { light: 0, shell: 0, heavy: 0, charge: 0 },
      nextFire: 0, reloadEnd: 0, reloadTotal: 0, equipEnd: 0, chargeEnd: 0, burst: 0, bloom: 0, lastShot: -10, ads: false, shoulder: 1,
      fireHeldPrev: false, use: null, interactHeld: 0, interactPrev: false, interactConsumed: false, focusKey: '', meleeReady: 0,
      damageLog: [], history: [], stats: emptyStats(), input: { seq: 0, mx: 0, mz: 0, yaw: Math.PI / 2, pitch: 0, buttons: 0, slot: 0 },
      prevButtons: 0, bot: null, deathTime: -1, spectate: -1, marker: null, hazardAcc: 0, stormAcc: 0,
    };
    (p as PlayerX).stepAcc = 0;
    (p as PlayerX).lastDist = 0;
    this.players.push(p);
    return p;
  }

  // ------------------------------------------------------------ loot spawn
  private addLoot(roll: LootRoll, x: number, y: number, z: number): LootItem {
    const it: LootItem = { ...roll, id: this.nextId++, x, y, z };
    this.loot.set(it.id, it);
    return it;
  }

  private spawnWorldLoot() {
    const weaponClusters = new Set<number>();
    for (const s of this.island.sockets) {
      const force = !weaponClusters.has(s.cluster);
      if (this.lootTables.rng.chance(force ? 1 : 0.78)) {
        const rolls = this.lootTables.floor(s.tier, force);
        rolls.forEach((r, k) => {
          if (r.kind === 'weapon') weaponClusters.add(s.cluster);
          this.addLoot(r, s.x + k * 0.7, s.y, s.z + k * 0.3);
        });
      }
    }
    for (const c of this.island.containers) {
      this.containers.push({ id: this.nextId++, kind: c.kind, x: c.x, y: c.y, z: c.z, yaw: c.yaw, tier: c.tier, opened: false, contents: null });
    }
  }

  private spawnPracticeRacks() {
    const P = this.island.pier;
    const cx = (P.minX + P.maxX) / 2, cz = (P.minZ + P.maxZ) / 2;
    WEAPON_IDS.forEach((w, i) => {
      const r: Rarity = (i % 4) as Rarity;
      const x = cx - 16 + i * 3.2, z = cz - 6;
      const roll: LootRoll = { kind: 'weapon', w, r, mag: WEAPONS[w].mag };
      this.addLoot(roll, x, P.y, z).respawnKey = `w${i}`;
      const ar: LootRoll = { kind: 'ammo', ammo: WEAPONS[w].ammo, amount: AMMO_PICKUP[WEAPONS[w].ammo] * 2 };
      this.addLoot(ar, x, P.y, z - 1.4).respawnKey = `a${i}`;
    });
    ITEM_IDS.forEach((id, i) => {
      const roll: LootRoll = { kind: 'item', item: id, n: ITEMS[id].stack };
      this.addLoot(roll, cx - 14 + i * 3.2, P.y, cz + 12).respawnKey = `i${i}`;
    });
    // a Masterwork and Prototype example to compare rarities
    this.addLoot({ kind: 'weapon', w: 'wayfarer', r: 3, mag: 36 }, cx + 14, P.y, cz - 6).respawnKey = 'm1';
    this.addLoot({ kind: 'weapon', w: 'sundial', r: 4, mag: 12 }, cx + 17, P.y, cz - 6).respawnKey = 'm2';
  }

  private spawnDummies() {
    const P = this.island.pier;
    const cx = (P.minX + P.maxX) / 2, cz = (P.minZ + P.maxZ) / 2;
    const spots = [[cx - 6, cz + 20], [cx + 2, cz + 22], [cx + 10, cz + 18], [cx + 18, cz + 24], [cx - 14, cz + 24]];
    spots.forEach(([x, z], i) => {
      const p = this.addPlayer(`Target ${i + 1}`, false, i % 4, 0, 0);
      p.isDummy = true;
      p.ms.x = x; p.ms.z = z; p.ms.y = P.y; p.ms.yaw = Math.PI;
      p.reserve = i % 2 ? 50 : 0;
      (p as PlayerX).dummyOrigin = { x, z, phase: i };
    });
  }

  // ------------------------------------------------------------ lifecycle
  aliveCount() {
    let n = 0;
    for (const p of this.players) if (p.alive && !p.isDummy) n++;
    return n;
  }

  private startSkiff() {
    const a = this.rng.next() * Math.PI * 2;
    const off = (this.rng.next() - 0.5) * 300;
    const dx = Math.cos(a), dz = Math.sin(a);
    const px = -dz, pz = dx;
    const L = 720;
    this.skiff = {
      ax: -dx * L + px * off, az: -dz * L + pz * off, bx: dx * L + px * off, bz: dz * L + pz * off,
      t: 0, dur: (2 * L) / SKIFF_SPEED, x: 0, y: SKIFF_ALTITUDE, z: 0, active: true,
    };
    this.phase = 'skiff';
    this.phaseEnd = this.time + this.skiff.dur;
    this.stormStart = this.time;
    for (const p of this.players) {
      if (p.isDummy) continue;
      // staging equipment does not carry into the match
      p.slots = [null, null, null, null, null];
      p.ammo = { light: 0, shell: 0, heavy: 0, charge: 0 };
      p.health = HEALTH_MAX; p.aegis = AEGIS_MAX; p.reserve = 0; p.use = null; p.reloadEnd = 0;
      p.ms = newMoveState(this.skiff.ax, SKIFF_ALTITUDE, this.skiff.az, Math.atan2(dx, dz));
      p.ms.mode = 'skiff';
      p.bot?.onSkiff(this);
    }
    // clear practice racks from the pier
    for (const [id, it] of this.loot) if (it.respawnKey) this.loot.delete(id);
    this.practiceRespawns = [];
    this.events.push({ e: 'phase', phase: 'skiff' });
    this.timeline.push({ t: this.matchClock(), text: 'Transit skiff launched' });
  }

  matchClock() { return this.stormStart < 0 ? 0 : this.time - this.stormStart; }

  skiffJumpOpen() {
    if (!this.skiff) return false;
    return Math.hypot(this.skiff.x, this.skiff.z) < 560;
  }

  ejectFromSkiff(p: Player) {
    if (!this.skiff || p.ms.mode !== 'skiff') return;
    const s = this.skiff;
    const dx = (s.bx - s.ax), dz = (s.bz - s.az);
    const L = Math.hypot(dx, dz);
    const lat = (this.rng.next() - 0.5) * 6;
    p.ms.mode = 'freefall';
    p.ms.insertion = true;
    p.ms.x = s.x + (-dz / L) * lat; p.ms.z = s.z + (dx / L) * lat; p.ms.y = s.y - 4;
    p.ms.vx = (dx / L) * 10; p.ms.vz = (dz / L) * 10; p.ms.vy = -5;
    this.events.push({ e: 'move', by: p.id, kind: 'jump', x: p.ms.x, y: p.ms.y, z: p.ms.z });
    p.stats.timeline.push({ t: this.matchClock(), text: 'Jumped from skiff' });
  }

  // ------------------------------------------------------------ tick
  step(inputs: Map<number, InputFrame>) {
    this.events = [];
    this.diedThisTick = [];
    if (this.noise.length && this.time - this.noise[0].t > 2) this.noise = this.noise.filter((n) => this.time - n.t <= 2);
    for (const [id, f] of inputs) {
      const p = this.players[id];
      if (!p || p.isBot) continue;
      p.input = f;
      this.replay.frames.push([this.tick, id, f]);
    }
    for (const p of this.players) {
      if (p.bot && (p.alive || this.phase === 'staging')) p.input = p.bot.think(this, p, DT);
    }
    // phase logic
    if (this.phase === 'staging') {
      const humansReady = this.opts.humans.length > 0 && this.players.filter((p) => !p.isBot && !p.isDummy).every((p) => (p as PlayerX).ready === true);
      if (humansReady && this.phaseEnd - this.time > 3) this.phaseEnd = this.time + 3;
      if (this.time >= this.phaseEnd) this.startSkiff();
    } else if (this.phase === 'skiff' && this.skiff) {
      const s = this.skiff;
      s.t = Math.min(1, s.t + DT / s.dur);
      s.x = s.ax + (s.bx - s.ax) * s.t; s.z = s.az + (s.bz - s.az) * s.t; s.y = SKIFF_ALTITUDE;
      const pastCenter = s.t > 0.5 && Math.hypot(s.x, s.z) > 520;
      for (const p of this.players) {
        if (p.ms.mode !== 'skiff') continue;
        p.ms.x = s.x; p.ms.y = s.y; p.ms.z = s.z;
        if (s.t >= 1 || pastCenter) this.ejectFromSkiff(p);
        else if (this.skiffJumpOpen() && (p.input.buttons & BTN.jump) && !(p.prevButtons & BTN.jump)) this.ejectFromSkiff(p);
      }
      if (this.players.every((p) => p.ms.mode !== 'skiff')) {
        this.phase = 'live';
        this.phaseEnd = Infinity;
        s.active = s.t < 1;
        this.events.push({ e: 'phase', phase: 'live' });
      }
    }
    if (this.skiff && this.phase === 'live' && this.skiff.t < 1) {
      const s = this.skiff;
      s.t = Math.min(1, s.t + DT / s.dur);
      s.x = s.ax + (s.bx - s.ax) * s.t; s.z = s.az + (s.bz - s.az) * s.t;
      if (s.t >= 1) s.active = false;
    }
    // storm
    if (this.stormStart >= 0 && this.opts.mode === 'solo') {
      const prev = this.stormNow;
      this.stormNow = stormAt(this.storm, this.matchClock());
      if (prev.phase !== this.stormNow.phase || prev.stage !== this.stormNow.stage) this.onStormChange(this.stormNow);
    }

    for (const p of this.players) this.stepPlayer(p);
    this.stepProjectiles();
    this.smokes = this.smokes.filter((s) => s.until > this.time);
    this.stepDrops();
    if (this.opts.mode === 'practice') this.stepPractice();
    this.checkWinner();
    for (const p of this.players) p.prevButtons = p.input.buttons;
    this.tick++;
    this.time += DT;
  }

  private onStormChange(s: StormNow) {
    const n = this.storm.phases.length;
    if (s.stage === 'wait') {
      this.events.push({ e: 'storm', kind: 'reveal', phase: s.phase });
      this.timeline.push({ t: this.matchClock(), text: `Calmfield ${s.phase + 1}/${n} revealed` });
    } else if (s.stage === 'shrink') {
      this.events.push({ e: 'storm', kind: s.phase >= n - 1 ? 'final' : 'shrink', phase: s.phase });
      this.timeline.push({ t: this.matchClock(), text: s.phase >= n - 4 ? `Endgame field moving (${s.phase + 1}/${n})` : `Riftstorm closing (${s.phase + 1}/${n})` });
      // supply capsules from zone 2 onward, caravan at zone 2
      if (s.phase >= 2 && s.phase <= 4 && !this.capsulePhasesDone.has(s.phase)) {
        this.capsulePhasesDone.add(s.phase);
        this.spawnCapsule(s);
      }
      if (s.phase === 2 && !this.caravan) this.spawnCaravan();
    }
  }

  private spawnCapsule(s: StormNow) {
    const next = s.next ?? s.cur;
    const cands = this.island.stormCenters.filter((c) => Math.hypot(c.x - next.x, c.z - next.z) < next.r * 0.7);
    const pick = cands.length ? this.rng.pick(cands) : { x: next.x, z: next.z };
    const cap = { id: this.nextId++, x: pick.x + this.rng.range(-6, 6), y: 200, z: pick.z + this.rng.range(-6, 6), landed: false, spawned: this.time };
    this.capsules.push(cap);
    this.events.push({ e: 'capsule', id: cap.id, x: cap.x, z: cap.z });
    this.timeline.push({ t: this.matchClock(), text: 'Supply capsule inbound' });
  }

  private spawnCaravan() {
    const final = this.storm.circles[this.storm.circles.length - 1];
    const cur = this.stormNow.cur;
    const cands = this.island.stormCenters.filter((c) => Math.hypot(c.x - final.x, c.z - final.z) > 110 && Math.hypot(c.x - cur.x, c.z - cur.z) < cur.r * 0.8);
    const path: { x: number; z: number }[] = [];
    for (let i = 0; i < 5 && cands.length; i++) path.push(this.rng.pick(cands));
    if (path.length < 2) return;
    const y = this.w.terrain(path[0].x, path[0].z) + 16;
    this.caravan = { x: path[0].x, y, z: path[0].z, path, wp: 1, shield: 600, alive: true, lastPulse: -100 };
    this.events.push({ e: 'caravan', kind: 'spawn', x: path[0].x, z: path[0].z });
    this.timeline.push({ t: this.matchClock(), text: 'Caravan drone sighted' });
  }

  private stepDrops() {
    for (const c of this.capsules) {
      if (c.landed) continue;
      c.y -= 8 * DT;
      const g = this.w.support(c.x, c.z, 0.5, c.y + 1);
      if (c.y <= Math.max(g, WATER_LEVEL)) {
        c.y = Math.max(g, WATER_LEVEL);
        c.landed = true;
        this.containers.push({ id: c.id, kind: 'capsule', x: c.x, y: c.y, z: c.z, yaw: 0, tier: 4, opened: false, contents: this.lootTables.premium() });
      }
    }
    const cv = this.caravan;
    if (cv && cv.alive) {
      const target = cv.path[cv.wp % cv.path.length];
      const dx = target.x - cv.x, dz = target.z - cv.z;
      const d = Math.hypot(dx, dz);
      if (d < 2) cv.wp++;
      else {
        cv.x += (dx / d) * 5 * DT; cv.z += (dz / d) * 5 * DT;
      }
      // never enters the final field
      const final = this.storm.circles[this.storm.circles.length - 1];
      const fd = Math.hypot(cv.x - final.x, cv.z - final.z);
      if (fd < 90) { cv.x = final.x + ((cv.x - final.x) / (fd || 1)) * 90; cv.z = final.z + ((cv.z - final.z) / (fd || 1)) * 90; cv.wp++; }
      cv.y += (this.w.terrain(cv.x, cv.z) + 16 - cv.y) * Math.min(1, DT * 0.8);
      if (this.time - cv.lastPulse > 12) {
        cv.lastPulse = this.time;
        this.events.push({ e: 'caravan', kind: 'pulse', x: Math.round(cv.x / 40) * 40, z: Math.round(cv.z / 40) * 40 });
      }
    }
  }

  damageCaravan(amount: number, by: Player) {
    const cv = this.caravan;
    if (!cv || !cv.alive) return;
    cv.shield -= amount;
    this.events.push({ e: 'hit', to: by.id, target: -2, amt: Math.round(amount), zone: 'torso', shield: true, broke: cv.shield <= 0, kill: false, x: cv.x, y: cv.y, z: cv.z });
    if (cv.shield <= 0) {
      cv.alive = false;
      const g = this.w.support(cv.x, cv.z, 1, cv.y);
      const y = Math.max(g, WATER_LEVEL);
      this.containers.push({ id: this.nextId++, kind: 'caravan', x: cv.x, y, z: cv.z, yaw: 0, tier: 4, opened: false, contents: [...this.lootTables.premium(), ...this.lootTables.chest(3)] });
      this.events.push({ e: 'caravan', kind: 'down', x: cv.x, z: cv.z });
      this.timeline.push({ t: this.matchClock(), text: `${by.name} downed the caravan drone` });
    }
  }

  private stepPractice() {
    for (const r of this.practiceRespawns) {
      if (r.at <= this.time) this.addLoot(r.roll, r.x, r.y, r.z).respawnKey = r.key;
    }
    this.practiceRespawns = this.practiceRespawns.filter((r) => r.at > this.time);
    for (const p of this.players) {
      if (!p.isDummy) continue;
      const o = (p as PlayerX).dummyOrigin!;
      if (!p.alive && this.time - p.deathTime > 3) {
        p.alive = true; p.health = HEALTH_MAX; p.aegis = AEGIS_MAX; p.reserve = o.phase % 2 ? 50 : 0;
        p.ms = newMoveState(o.x, this.island.pier.y, o.z, Math.PI);
        p.damageLog = [];
      }
      if (p.alive && o.phase >= 3) {
        // strafing targets
        p.ms.x = o.x + Math.sin(this.time * 0.9 + o.phase) * 4;
        p.ms.vx = Math.cos(this.time * 0.9 + o.phase) * 3.6;
      }
      if (p.alive && this.time - p.lastDamage > 4) { p.health = HEALTH_MAX; }
    }
  }

  private checkWinner() {
    if (this.phase === 'ended' || this.opts.mode !== 'solo' || this.phase === 'staging') return;
    const alive = this.players.filter((p) => p.alive && !p.isDummy);
    if (alive.length === 1) {
      this.endMatch(alive[0]);
    } else if (alive.length === 0) {
      // deterministic tie-break among those eliminated this tick
      const pool = this.diedThisTick.length ? this.diedThisTick : this.players;
      const sorted = [...pool].sort((a, b) => b.stats.kills - a.stats.kills || b.stats.damage - a.stats.damage || a.id - b.id);
      this.endMatch(sorted[0]);
    }
  }

  private endMatch(w: Player) {
    this.winner = w;
    w.stats.placement = 1;
    w.stats.survival = this.matchClock();
    this.phase = 'ended';
    this.events.push({ e: 'win', id: w.id, name: w.name });
    this.timeline.push({ t: this.matchClock(), text: `${w.name} is the last one standing` });
  }

  // ------------------------------------------------------------ players
  private stepPlayer(p: Player) {
    const inp = p.input;
    const btn = inp.buttons, prev = p.prevButtons;
    const edge = (b: number) => (btn & b) !== 0 && (prev & b) === 0;
    if (!p.alive) {
      if (!p.isDummy) this.updateSpectate(p);
      return;
    }
    if (p.isDummy) { this.regenShields(p); return; }
    for (const a of inp.actions ?? []) this.applyAction(p, a);
    inp.actions = undefined;
    const s = p.ms;
    if (s.mode === 'skiff') { s.yaw = inp.yaw; s.pitch = inp.pitch; return; }

    // slot selection
    if (inp.slot !== p.sel && inp.slot >= 0 && inp.slot < 5) this.selectSlot(p, inp.slot);
    const slot = p.slots[p.sel];
    const weaponOut = slot?.kind === 'weapon';
    const canAim = weaponOut && (s.mode === 'ground' || s.mode === 'air' || s.mode === 'zip' || (s.mode === 'swim' && slot.w === 'harbor'));
    p.ads = !!canAim && (btn & BTN.ads) !== 0 && p.reloadEnd === 0 && !p.use && !s.sprinting;
    let speedMult = 1;
    if (p.use) speedMult = ITEMS[p.use.id].moveMult;

    const mi: MoveInput = {
      mx: inp.mx, mz: inp.mz, yaw: inp.yaw, pitch: inp.pitch,
      jump: edge(BTN.jump), sprint: (btn & BTN.sprint) !== 0 && !p.ads && !p.use, crouch: (btn & BTN.crouch) !== 0,
      deploy: edge(BTN.deploy), walk: p.ads || (btn & BTN.walk) !== 0, speedMult,
    };
    // traversal via interact is handled in interact(); jump attaches inside stepMovement
    const ev = stepMovement(s, mi, this.w, DT);
    if (ev.fallDamage) this.applyDamage(p, ev.fallDamage, null, 'fall');
    if (!p.alive) return;
    const moveKinds: [keyof typeof ev, string][] = [['jumped', 'jump'], ['slid', 'slide'], ['mantled', 'mantle'], ['splash', 'splash'], ['vent', 'vent'], ['deployed', 'deploy'], ['zipOn', 'zip'], ['ascendOn', 'ascend'], ['zipOff', 'zipoff']];
    for (const [k, kind] of moveKinds) if (ev[k]) this.events.push({ e: 'move', by: p.id, kind, x: s.x, y: s.y, z: s.z });
    if (ev.landed && ev.landed > 6) this.events.push({ e: 'move', by: p.id, kind: 'land', x: s.x, y: s.y, z: s.z });
    if (ev.landed !== undefined && p.stats.timeline.length < 3 && p.stats.timeline.some((t) => t.text === 'Jumped from skiff') && !p.stats.timeline.some((t) => t.text.startsWith('Landed'))) {
      p.stats.timeline.push({ t: this.matchClock(), text: `Landed near ${this.nearestLocation(s.x, s.z)}` });
    }
    // footsteps
    const px = p as PlayerX;
    const dd = s.distance - px.lastDist;
    px.lastDist = s.distance;
    if (s.mode === 'ground' || s.mode === 'swim') {
      px.stepAcc += dd;
      const stride = s.sprinting ? 2.4 : 1.9;
      if (px.stepAcc > stride) {
        px.stepAcc = 0;
        if (!(s.crouch && s.slide <= 0)) this.events.push({ e: 'footstep', by: p.id, x: s.x, y: s.y, z: s.z, loud: s.sprinting });
      }
    }
    // uses that require ground-ish modes
    if (p.use && s.mode !== 'ground' && s.mode !== 'swim' && s.mode !== 'air') this.cancelUse(p);
    this.interact(p, (btn & BTN.interact) !== 0);
    this.stepWeapon(p, (btn & BTN.fire) !== 0, edge(BTN.fire), edge(BTN.reload));
    if (edge(BTN.melee)) this.melee(p);
    this.stepUse(p);
    this.regenShields(p);
    this.environment(p);
    // histories
    if (this.tick % 15 === 0) {
      p.history.push({ t: this.time, x: s.x, z: s.z });
      if (p.history.length > 24) p.history.shift();
    }
    if (this.tick % 60 === 0 && this.phase !== 'staging') {
      p.stats.route.push([Math.round(s.x), Math.round(s.z)]);
    }
  }

  private nearestLocation(x: number, z: number) {
    let best = 'the wilds', bd = Infinity;
    for (const l of this.island.locations) {
      const d = Math.hypot(l.x - x, l.z - z) - l.r;
      if (d < bd) { bd = d; best = l.name; }
    }
    return bd < 120 ? best : 'the wilds';
  }

  private updateSpectate(p: Player) {
    if (this.time - p.deathTime < 2.5) return; // brief delay before following
    const cur = this.players[p.spectate];
    const btn = p.input.buttons, prev = p.prevButtons;
    const cycle = (btn & BTN.fire) && !(prev & BTN.fire);
    if (!cur || !cur.alive || cycle) {
      const alive = this.players.filter((q) => q.alive && !q.isDummy);
      if (!alive.length) return;
      if (cur && cur.alive && cycle) {
        const i = alive.indexOf(cur);
        p.spectate = alive[(i + 1) % alive.length].id;
      } else {
        // prefer the killer
        const killer = alive.find((q) => q.id === (p as PlayerX).killerId);
        p.spectate = (killer ?? alive[0]).id;
      }
    }
  }

  private selectSlot(p: Player, i: number) {
    if (p.use) this.cancelUse(p);
    p.sel = i;
    p.reloadEnd = 0;
    p.chargeEnd = 0;
    p.burst = 0;
    const s = p.slots[i];
    if (s?.kind === 'weapon') p.equipEnd = this.time + weaponStats(s.w, s.r).equip;
    else p.equipEnd = this.time + 0.2;
  }

  private applyAction(p: Player, a: InvAction) {
    switch (a.t) {
      case 'swap': {
        if (a.a < 0 || a.a > 4 || a.b < 0 || a.b > 4 || a.a === a.b) return;
        if (p.use) this.cancelUse(p);
        const t = p.slots[a.a]; p.slots[a.a] = p.slots[a.b]; p.slots[a.b] = t;
        p.reloadEnd = 0;
        return;
      }
      case 'drop': {
        if (a.slot < 0 || a.slot > 4) return;
        const sl = p.slots[a.slot];
        if (!sl) return;
        if (p.use && p.use.slot === a.slot) this.cancelUse(p);
        p.slots[a.slot] = null;
        this.dropSlot(p, sl);
        if (a.slot === p.sel) p.reloadEnd = 0;
        return;
      }
      case 'dropAmmo': {
        if (!AMMO_TYPES.includes(a.ammo)) return;
        const n = Math.max(0, Math.min(Math.floor(a.amount), p.ammo[a.ammo]));
        if (n <= 0) return;
        p.ammo[a.ammo] -= n;
        this.spill(p.ms.x, p.ms.y, p.ms.z, [{ kind: 'ammo', ammo: a.ammo, amount: n }], 1.2, p.ms.yaw);
        return;
      }
      case 'marker': p.marker = { x: a.x, z: a.z }; return;
      case 'clearMarker': p.marker = null; return;
      case 'shoulder': p.shoulder = -p.shoulder; return;
      case 'ready': (p as PlayerX).ready = true; return;
    }
  }

  private dropSlot(p: Player, sl: NonNullable<Slot>) {
    const roll: LootRoll = sl.kind === 'weapon' ? { kind: 'weapon', w: sl.w, r: sl.r, mag: sl.mag } : { kind: 'item', item: sl.id, n: sl.n };
    const before = this.nextId;
    this.spill(p.ms.x, p.ms.y, p.ms.z, [roll], 1.4, p.ms.yaw);
    for (let id = before; id < this.nextId; id++) { const it = this.loot.get(id); if (it) it.droppedBy = p.id; }
  }

  /** Place loot rolls around a point, settled onto walkable surfaces (then nonphysical). */
  spill(x: number, y: number, z: number, rolls: LootRoll[], radius: number, yaw = 0) {
    rolls.forEach((r, i) => {
      const a = yaw + (i / Math.max(1, rolls.length)) * Math.PI * 2;
      const rr = radius * (0.6 + (i % 3) * 0.25);
      const lx = x + Math.sin(a) * rr, lz = z + Math.cos(a) * rr;
      const ly = this.w.support(lx, lz, 0.15, y + 1.2);
      this.addLoot(r, lx, Math.max(ly, Math.min(y, WATER_LEVEL)), lz);
    });
  }

  // ------------------------------------------------------------ interaction
  focusFor(p: Player): FocusView {
    const s = p.ms;
    if (s.mode !== 'ground' && s.mode !== 'swim' && s.mode !== 'air') return null;
    const fx = Math.sin(s.yaw), fz = Math.cos(s.yaw);
    let best: FocusView = null;
    let bestScore = Infinity;
    for (const it of this.loot.values()) {
      const dx = it.x - s.x, dz = it.z - s.z, dy = it.y - s.y;
      if (Math.abs(dx) > 2.6 || Math.abs(dz) > 2.6 || Math.abs(dy) > 1.8) continue;
      const d = Math.hypot(dx, dz);
      if (d > 2.5) continue;
      const facing = d < 0.01 ? 1 : (dx * fx + dz * fz) / d;
      if (facing < 0.2 && d > 1.1) continue;
      const score = d - facing * 0.8;
      if (score < bestScore) {
        bestScore = score;
        const need = this.pickupNeedsSwap(p, it);
        best = { t: 'loot', id: it.id, needsHold: need >= 0, swapSlot: need };
      }
    }
    for (const c of this.containers) {
      if (c.opened) continue;
      const dx = c.x - s.x, dz = c.z - s.z, dy = c.y - s.y;
      if (Math.abs(dy) > 2 || Math.abs(dx) > 3 || Math.abs(dz) > 3) continue;
      const d = Math.hypot(dx, dz);
      if (d > 2.6) continue;
      const score = d - 0.5;
      if (score < bestScore) { bestScore = score; best = { t: 'container', id: c.id, kind: c.kind }; }
    }
    if (!best) {
      const tr = findTraversal(s, this.w);
      if (tr) best = { t: tr.kind === 'zip' ? 'zip' : 'ascend' };
    }
    return best;
  }

  /** Returns -1 if the item fits freely, otherwise the slot it would replace. */
  pickupNeedsSwap(p: Player, it: LootItem): number {
    if (it.kind === 'ammo') return -1;
    if (it.kind === 'item') {
      const def = ITEMS[it.item!];
      if (p.slots.some((s) => s?.kind === 'item' && s.id === it.item && s.n < def.stack)) return -1;
    }
    if (p.slots.some((s) => s === null)) return -1;
    return p.sel;
  }

  private interact(p: Player, held: boolean) {
    const focus = this.focusFor(p);
    const key = focus ? `${focus.t}:${'id' in focus ? focus.id : ''}` : '';
    if (key !== p.focusKey) { p.focusKey = key; p.interactHeld = 0; p.interactConsumed = false; }
    if (!held) { p.interactHeld = 0; p.interactConsumed = false; p.interactPrev = false; return; }
    const pressed = !p.interactPrev;
    p.interactPrev = true;
    if (!focus || p.interactConsumed) return;
    p.interactHeld += DT;
    if (focus.t === 'zip' || focus.t === 'ascend') {
      if (pressed) {
        const tr = findTraversal(p.ms, this.w);
        if (tr) { attachTraversal(p.ms, this.w, tr); this.events.push({ e: 'move', by: p.id, kind: tr.kind, x: p.ms.x, y: p.ms.y, z: p.ms.z }); }
        p.interactConsumed = true;
      }
      return;
    }
    if (focus.t === 'container') {
      const c = this.containers.find((k) => k.id === focus.id);
      if (c && !c.opened) { this.openContainer(c, p); p.interactConsumed = true; }
      return;
    }
    const it = this.loot.get(focus.id);
    if (!it) return;
    if (focus.needsHold) {
      if (p.interactHeld >= 0.4) { this.pickup(p, it, focus.swapSlot); p.interactConsumed = true; }
    } else if (pressed || p.interactHeld > 0) {
      this.pickup(p, it, -1);
      p.interactConsumed = true;
    }
  }

  openContainer(c: Container, by: Player) {
    c.opened = true;
    let rolls: LootRoll[];
    if (c.contents) rolls = c.contents;
    else if (c.kind === 'chest') rolls = this.lootTables.chest(c.tier);
    else rolls = this.lootTables.locker();
    c.contents = [];
    this.spill(c.x, c.y + 0.5, c.z, rolls, c.kind === 'cache' ? 1.4 : 1.6, by.ms.yaw + Math.PI);
    this.events.push({ e: 'open', id: c.id, kind: c.kind, x: c.x, y: c.y, z: c.z });
  }

  pickup(p: Player, it: LootItem, swapSlot: number) {
    const label = lootLabel(it);
    if (it.kind === 'ammo') {
      const t = it.ammo!;
      const room = AMMO_CAPS[t] - p.ammo[t];
      if (room <= 0) { this.events.push({ e: 'denied', to: p.id, reason: `${t[0].toUpperCase() + t.slice(1)} ammo full` }); return; }
      const take = Math.min(room, it.amount!);
      p.ammo[t] += take;
      it.amount! -= take;
      if (it.amount! <= 0) this.removeLoot(it);
      this.events.push({ e: 'pickup', to: p.id, label: `+${take} ${label}`, rarity: 0 });
      return;
    }
    if (it.kind === 'item') {
      const def = ITEMS[it.item!];
      for (const s of p.slots) {
        if (s?.kind === 'item' && s.id === it.item && s.n < def.stack) {
          const take = Math.min(def.stack - s.n, it.n!);
          s.n += take; it.n! -= take;
        }
      }
      if (it.n! > 0) {
        const empty = p.slots.indexOf(null);
        if (empty >= 0) { p.slots[empty] = { kind: 'item', id: it.item!, n: Math.min(def.stack, it.n!) }; it.n! -= Math.min(def.stack, it.n!); }
        else if (swapSlot >= 0) {
          const old = p.slots[swapSlot]!;
          p.slots[swapSlot] = { kind: 'item', id: it.item!, n: Math.min(def.stack, it.n!) };
          it.n! -= Math.min(def.stack, it.n!);
          this.dropSlot(p, old);
          if (swapSlot === p.sel) { p.reloadEnd = 0; p.equipEnd = this.time + 0.2; }
        }
      }
      if (it.n! <= 0) this.removeLoot(it);
      this.events.push({ e: 'pickup', to: p.id, label, rarity: 0 });
      p.stats.loot.push({ t: this.matchClock(), label, rarity: 0 });
      return;
    }
    // weapon
    const slot: Slot = { kind: 'weapon', w: it.w!, r: it.r!, mag: it.mag ?? WEAPONS[it.w!].mag };
    const empty = p.sel >= 0 && p.slots[p.sel] === null ? p.sel : p.slots.indexOf(null);
    if (empty >= 0) {
      p.slots[empty] = slot;
      if (empty === p.sel) p.equipEnd = this.time + weaponStats(slot.w, slot.r).equip;
    } else if (swapSlot >= 0) {
      const old = p.slots[swapSlot]!;
      p.slots[swapSlot] = slot;
      this.dropSlot(p, old);
      if (swapSlot === p.sel) { p.reloadEnd = 0; p.equipEnd = this.time + weaponStats(slot.w, slot.r).equip; }
    } else {
      this.events.push({ e: 'denied', to: p.id, reason: 'Inventory full — hold to swap' });
      return;
    }
    this.removeLoot(it);
    this.events.push({ e: 'pickup', to: p.id, label, rarity: slot.r });
    p.stats.loot.push({ t: this.matchClock(), label, rarity: slot.r });
  }

  private removeLoot(it: LootItem) {
    this.loot.delete(it.id);
    if (it.respawnKey && (this.opts.mode === 'practice' || this.phase === 'staging')) {
      const { id: _id, x, y, z, respawnKey, ...roll } = it;
      const base: LootRoll = roll.kind === 'weapon' ? { ...roll, mag: WEAPONS[roll.w!].mag } : roll.kind === 'item' ? { ...roll, n: ITEMS[roll.item!].stack } : { ...roll, amount: AMMO_PICKUP[roll.ammo!] * 2 };
      this.practiceRespawns.push({ at: this.time + 2.5, roll: base, x, y, z, key: respawnKey });
    }
  }

  // ------------------------------------------------------------ weapons
  private stepWeapon(p: Player, fireHeld: boolean, fireEdge: boolean, reloadEdge: boolean) {
    const s = p.ms;
    const slot = p.slots[p.sel];
    if (slot?.kind !== 'weapon') {
      if (slot?.kind === 'item' && fireEdge) this.useItem(p, p.sel);
      p.bloom = Math.max(0, p.bloom - 6 * DT);
      return;
    }
    const st = weaponStats(slot.w, slot.r);
    // finish reload
    if (p.reloadEnd > 0 && this.time >= p.reloadEnd) {
      const need = st.mag - slot.mag;
      const take = Math.min(need, p.ammo[st.def.ammo]);
      slot.mag += take; p.ammo[st.def.ammo] -= take;
      p.reloadEnd = 0;
    }
    const modeOk = s.mode === 'ground' || s.mode === 'air' || s.mode === 'zip' || (s.mode === 'swim' && slot.w === 'harbor');
    const ready = modeOk && p.reloadEnd === 0 && this.time >= p.equipEnd && !p.use && !s.sprinting;
    if (reloadEdge && p.reloadEnd === 0 && slot.mag < st.mag && p.ammo[st.def.ammo] > 0 && modeOk) this.startReload(p, slot, st);
    if (p.use) return;
    // charged rail
    if (p.chargeEnd > 0) {
      if (!modeOk || p.reloadEnd > 0) p.chargeEnd = 0;
      else if (this.time >= p.chargeEnd) {
        p.chargeEnd = 0;
        this.shoot(p, slot, st);
      }
    } else if (ready && slot.mag > 0) {
      const auto = st.def.mode === 'auto';
      if ((auto && fireHeld) || (!auto && fireEdge)) {
        if (this.time >= p.nextFire) {
          if (st.charge > 0) {
            p.chargeEnd = this.time + st.charge;
            p.nextFire = this.time + st.interval;
            this.events.push({ e: 'charge', by: p.id, x: s.x, y: s.y + 1.4, z: s.z });
          } else {
            let shots = 0;
            if (p.nextFire < this.time - DT) p.nextFire = this.time;
            while (this.time + DT > p.nextFire && slot.mag > 0 && shots < 3) {
              this.shoot(p, slot, st);
              p.nextFire += st.interval;
              shots++;
              if (!auto) break;
            }
          }
        }
      }
    } else if (ready && slot.mag === 0 && (fireEdge || (fireHeld && st.def.mode === 'auto'))) {
      if (p.ammo[st.def.ammo] > 0) this.startReload(p, slot, st);
      else if (fireEdge) this.events.push({ e: 'denied', to: p.id, reason: `No ${st.def.ammo} ammo` });
    }
    if (this.time - p.lastShot > 0.32) p.burst = 0;
    if (this.time - p.lastShot > 0.06) p.bloom = Math.max(0, p.bloom - st.def.bloomRecover * DT);
  }

  private startReload(p: Player, slot: Extract<Slot, { kind: 'weapon' }>, st: ReturnType<typeof weaponStats>) {
    const missing = st.mag - slot.mag;
    p.reloadTotal = st.reload + st.perShell * Math.min(missing, p.ammo[st.def.ammo]);
    p.reloadEnd = this.time + p.reloadTotal;
    p.chargeEnd = 0;
    this.events.push({ e: 'reload', by: p.id, w: slot.w, x: p.ms.x, y: p.ms.y, z: p.ms.z });
  }

  private shoot(p: Player, slot: Extract<Slot, { kind: 'weapon' }>, st: ReturnType<typeof weaponStats>) {
    const s = p.ms;
    const boom = p.ads ? st.def.adsBoom : 3.1;
    slot.mag--;
    p.lastShot = this.time;
    p.stats.shots++;
    const rnd = () => this.shotRng.next();
    const pat = st.def.recoil[p.burst % st.def.recoil.length];
    const recoilP = pat[0] * st.recoilMult * (p.ads ? 0.8 : 1), recoilY = pat[1] * st.recoilMult;
    p.burst++;
    const silent = this.phase === 'staging';
    let bonus = 1;
    if (st.lastRoundsBonus > 0 && slot.mag < 6) bonus += st.lastRoundsBonus;
    if (st.projectile) {
      const target = resolveAimPoint(this.w, this.players, p, boom, st.def.range);
      const m = muzzle(s.x, s.y, s.z, s.yaw, s.pitch, s.crouch || s.slide > 0);
      const dx = target.x - m.x, dy = target.y - m.y, dz = target.z - m.z;
      const L = Math.hypot(dx, dy, dz) || 1;
      const dir = coneDir({ x: dx / L, y: dy / L, z: dz / L }, currentSpread(p, st), rnd(), rnd());
      const pr = st.projectile;
      const kind = slot.w === 'longwake' ? 'rail' : 'gale';
      this.projectiles.push({
        id: this.nextId++, owner: p.id, kind, x: m.x, y: m.y, z: m.z, vx: dir.x * pr.speed, vy: dir.y * pr.speed + (kind === 'gale' ? 2 : 0), vz: dir.z * pr.speed,
        gravity: pr.gravity, damage: st.damage * bonus, headMult: st.headMult, splash: pr.splash ?? 0, knockback: pr.knockback ?? 0, life: 3, weapon: slot.w, rarity: slot.r,
      });
      this.events.push({ e: 'shot', by: p.id, w: slot.w, fx: m.x, fy: m.y, fz: m.z, tx: m.x + dir.x * 3, ty: m.y + dir.y * 3, tz: m.z + dir.z * 3, hit: false, silent });
    } else {
      const res = fireHitscan(this.w, this.players, this.smokes, p, st, rnd, boom);
      let anyHit = false;
      for (const h of res.hits) {
        if (h.p.isDummy || this.phase !== 'staging') {
          this.applyDamage(h.p, h.dmg * bonus, p, 'weapon', h.zone, slot.w);
          anyHit = true;
        }
      }
      if (anyHit) p.stats.hits++;
      // caravan drone shield
      const cv = this.caravan;
      if (cv && cv.alive) {
        const dx = res.end.x - res.muzzle.x, dy = res.end.y - res.muzzle.y, dz = res.end.z - res.muzzle.z;
        const L = Math.hypot(dx, dy, dz) || 1;
        const t = raySphere(res.muzzle, { x: dx / L, y: dy / L, z: dz / L }, cv, 2.6, L + 0.5);
        if (t !== null) this.damageCaravan(st.damage * st.def.pellets * 0.6, p);
      }
      if (res.worldHit && !anyHit) this.events.push({ e: 'impact', ...res.worldHit, player: false });
      this.events.push({ e: 'shot', by: p.id, w: slot.w, fx: res.muzzle.x, fy: res.muzzle.y, fz: res.muzzle.z, tx: res.end.x, ty: res.end.y, tz: res.end.z, hit: anyHit, silent });
    }
    p.bloom = Math.min(st.def.bloomMax, p.bloom + st.bloomPerShot);
    if (!silent) this.noise.push({ x: s.x, z: s.z, t: this.time, by: p.id, r: st.def.audibleRadius });
    // recoil: deterministic view kick. Humans apply it client-side from the event;
    // bots get it applied to their aim directly.
    if (p.bot) p.bot.applyRecoil(recoilP, recoilY);
    else this.events.push({ e: 'recoil', to: p.id, p: recoilP, y: recoilY });
  }

  private melee(p: Player) {
    if (this.time < p.meleeReady || p.ms.mode !== 'ground') return;
    p.meleeReady = this.time + 0.65;
    const s = p.ms;
    const fx = Math.sin(s.yaw), fz = Math.cos(s.yaw);
    let best: Player | null = null, bd = 2.3;
    for (const q of this.players) {
      if (q === p || !q.alive) continue;
      const dx = q.ms.x - s.x, dz = q.ms.z - s.z;
      const d = Math.hypot(dx, dz);
      if (d < bd && Math.abs(q.ms.y - s.y) < 1.6 && (dx * fx + dz * fz) / (d || 1) > 0.5) { bd = d; best = q; }
    }
    this.events.push({ e: 'move', by: p.id, kind: 'melee', x: s.x, y: s.y, z: s.z });
    if (best && (this.phase !== 'staging' || best.isDummy)) this.applyDamage(best, 20, p, 'melee', 'torso', null);
  }

  // ------------------------------------------------------------ items
  private useItem(p: Player, slotIdx: number) {
    const sl = p.slots[slotIdx];
    if (sl?.kind !== 'item' || p.use) return;
    const def = ITEMS[sl.id];
    const s = p.ms;
    if (s.mode !== 'ground' && s.mode !== 'swim' && s.mode !== 'air' && def.kind !== 'utility') return;
    if (this.time < p.equipEnd) return;
    const deny = (reason: string) => this.events.push({ e: 'denied', to: p.id, reason });
    const consume = () => { sl.n--; if (sl.n <= 0) p.slots[slotIdx] = null; };
    switch (sl.id) {
      case 'med': case 'trauma':
        if (p.health >= HEALTH_MAX) return deny('Health is full');
        break;
      case 'flask':
        if (p.reserve >= RESERVE_MAX) return deny('Reserve Shield is full');
        break;
      case 'aegis_cell':
        if (p.aegis >= AEGIS_MAX) return deny('Aegis is full');
        break;
      case 'mist': case 'wind_orb': {
        const target = resolveAimPoint(this.w, this.players, p, 3.1, 60);
        const m = muzzle(s.x, s.y, s.z, s.yaw, s.pitch, s.crouch);
        const dx = target.x - m.x, dz = target.z - m.z;
        const hd = Math.hypot(dx, dz) || 1;
        const speed = 21;
        const up = Math.max(0.15, Math.sin(s.pitch) + 0.25);
        this.projectiles.push({
          id: this.nextId++, owner: p.id, kind: sl.id, x: m.x, y: m.y, z: m.z,
          vx: (dx / hd) * speed * Math.cos(Math.min(1.2, up)), vy: speed * Math.sin(Math.min(1.2, up)), vz: (dz / hd) * speed * Math.cos(Math.min(1.2, up)),
          gravity: 18, damage: sl.id === 'wind_orb' ? 12 : 0, headMult: 1, splash: sl.id === 'wind_orb' ? 6 : 0, knockback: sl.id === 'wind_orb' ? 16 : 0, life: 4, weapon: null, rarity: 0,
        });
        consume();
        this.events.push({ e: 'move', by: p.id, kind: 'throw', x: s.x, y: s.y, z: s.z });
        p.equipEnd = this.time + 0.45;
        return;
      }
      case 'grapple': {
        const rig = cameraRig(s.x, s.y, s.z, s.yaw, s.pitch, s.crouch, 3.1, p.shoulder);
        const o = aimRayStart(rig);
        const hit = this.w.raycast(o, rig.dir, MOVE.grappleRange + 3, true);
        const ok = !!hit && startGrapple(s, { x: hit.x - rig.dir.x * 0.6, y: hit.y, z: hit.z - rig.dir.z * 0.6 });
        this.events.push({ e: 'grapple', by: p.id, x: hit?.x ?? 0, y: hit?.y ?? 0, z: hit?.z ?? 0, ok });
        if (ok) consume(); else deny('No grapple point in range');
        p.equipEnd = this.time + 0.3;
        return;
      }
      case 'echo': {
        const trails: { id: number; pts: [number, number, number][] }[] = [];
        for (const q of this.players) {
          if (q === p || !q.alive || q.isDummy) continue;
          const pts: [number, number, number][] = [];
          for (const h of q.history) {
            if (this.time - h.t > 10) continue;
            if (Math.hypot(h.x - s.x, h.z - s.z) > 70) continue;
            pts.push([h.x, h.z, this.time - h.t]);
          }
          if (pts.length >= 2) trails.push({ id: q.id, pts });
        }
        this.events.push({ e: 'echo', to: p.id, trails });
        consume();
        p.equipEnd = this.time + 0.5;
        return;
      }
    }
    p.use = { slot: slotIdx, id: sl.id, start: this.time, end: this.time + def.useTime, applied: 0 };
    p.reloadEnd = 0;
    // gradual consumables are consumed at start: cancelling keeps partial value but loses the item
    if (sl.id !== 'aegis_cell') consume();
    this.events.push({ e: 'heal', to: p.id, kind: 'start', item: sl.id });
  }

  private stepUse(p: Player) {
    const u = p.use;
    if (!u) return;
    const def = ITEMS[u.id];
    const k = Math.min(1, (this.time - u.start) / def.useTime);
    if (u.id === 'med' || u.id === 'trauma') {
      const total = u.id === 'med' ? def.heal! : HEALTH_MAX; // trauma restores towards full
      const want = total * k - u.applied;
      if (want > 0) {
        const before = p.health;
        p.health = Math.min(HEALTH_MAX, p.health + want);
        p.stats.healed += p.health - before;
        u.applied += want;
      }
    } else if (u.id === 'flask') {
      const want = def.reserve! * k - u.applied;
      if (want > 0) { p.reserve = Math.min(RESERVE_MAX, p.reserve + want); u.applied += want; }
    }
    if (this.time >= u.end) {
      if (u.id === 'aegis_cell') {
        const sl = p.slots[u.slot];
        if (sl?.kind === 'item' && sl.id === 'aegis_cell') { sl.n--; if (sl.n <= 0) p.slots[u.slot] = null; }
        p.aegisBoost = true;
        this.events.push({ e: 'aegis', to: p.id, kind: 'recharge' });
      }
      p.use = null;
      this.events.push({ e: 'heal', to: p.id, kind: 'done', item: u.id });
    }
  }

  cancelUse(p: Player) {
    if (!p.use) return;
    this.events.push({ e: 'heal', to: p.id, kind: 'cancel', item: p.use.id });
    p.use = null;
  }

  private regenShields(p: Player) {
    const px = p as PlayerX;
    const can = p.aegis < AEGIS_MAX && (p.aegisBoost || this.time - p.lastDamage >= AEGIS_DELAY);
    if (can) {
      if (!px.recharging) { px.recharging = true; if (!p.isDummy) this.events.push({ e: 'aegis', to: p.id, kind: 'recharge' }); }
      p.aegis = Math.min(AEGIS_MAX, p.aegis + AEGIS_RATE * DT);
      if (p.aegis >= AEGIS_MAX) {
        p.aegisBoost = false; px.recharging = false;
        if (!p.isDummy) this.events.push({ e: 'aegis', to: p.id, kind: 'full' });
      }
    } else px.recharging = false;
  }

  private environment(p: Player) {
    const s = p.ms;
    // hazards
    for (const h of this.island.hazards) {
      if (s.x > h.minX && s.x < h.maxX && s.z > h.minZ && s.z < h.maxZ && s.y > h.y0 && s.y < h.y1 && s.mode === 'ground') {
        p.hazardAcc += h.dps * DT;
      }
    }
    if (p.hazardAcc >= 5) { const d = Math.floor(p.hazardAcc); p.hazardAcc -= d; this.applyDamage(p, d, null, 'hazard'); }
    // storm
    if (this.stormStart >= 0 && this.opts.mode === 'solo' && s.mode !== 'skiff') {
      const c = this.stormNow.cur;
      if (Math.hypot(s.x - c.x, s.z - c.z) > c.r) {
        p.stormAcc += this.stormNow.damage * DT;
        if (p.stormAcc >= 1) {
          const d = Math.floor(p.stormAcc);
          p.stormAcc -= d;
          p.stats.stormDamage += d;
          this.applyDamage(p, d, null, 'storm');
        }
      }
    }
  }

  inStorm(p: Player) {
    if (this.stormStart < 0 || this.opts.mode !== 'solo') return false;
    const c = this.stormNow.cur;
    return Math.hypot(p.ms.x - c.x, p.ms.z - c.z) > c.r;
  }

  // ------------------------------------------------------------ damage
  applyDamage(t: Player, amount: number, src: Player | null, kind: 'weapon' | 'melee' | 'orb' | 'fall' | 'hazard' | 'storm', zone: 'head' | 'torso' | 'limb' = 'torso', weapon: WeaponId | null = null) {
    if (!t.alive || amount <= 0) return;
    if (this.phase === 'staging' && !t.isDummy) return;
    if (this.phase === 'ended') return;
    let rem = amount;
    const shieldBefore = t.aegis + t.reserve;
    let absorbed = 0;
    if (kind === 'weapon' || kind === 'melee' || kind === 'orb') {
      const a = Math.min(t.aegis, rem); t.aegis -= a; rem -= a;
      const r = Math.min(t.reserve, rem); t.reserve -= r; rem -= r;
      absorbed = a + r;
    }
    const before = t.health;
    t.health = Math.max(0, t.health - rem);
    const dealt = absorbed + (before - t.health);
    const broke = shieldBefore > 0 && t.aegis + t.reserve <= 0.001 && absorbed > 0;
    t.lastDamage = this.time;
    t.aegisBoost = false;
    if (src && src !== t) {
      t.damageLog.push({ from: src.id, amt: dealt, t: this.time });
      src.stats.damage += dealt;
    }
    const kill = t.health <= 0;
    if (src && src !== t) {
      this.events.push({ e: 'hit', to: src.id, target: t.id, amt: Math.round(dealt), zone, shield: absorbed > 0, broke, kill, x: t.ms.x, y: t.ms.y + (zone === 'head' ? 1.7 : 1.2), z: t.ms.z });
    }
    this.events.push({ e: 'hurt', to: t.id, amt: Math.round(dealt), fromX: src ? src.ms.x : t.ms.x, fromZ: src ? src.ms.z : t.ms.z, shield: absorbed > 0, broke, kind });
    if (t.use && ITEMS[t.use.id].interruptible) this.cancelUse(t);
    if (t.bot && src) t.bot.onDamaged(this, src);
    if (kill) this.kill(t, src, kind, weapon);
  }

  private kill(t: Player, src: Player | null, kind: string, weapon: WeaponId | null) {
    t.alive = false;
    t.deathTime = this.time;
    t.ms.mode = 'dead';
    t.use = null;
    if (t.isDummy) {
      if (src) this.events.push({ e: 'kill', victim: t.id, vName: t.name, killer: src.id, kName: src.name, cause: weapon ? WEAPONS[weapon].name : kind, assists: [] });
      return;
    }
    this.diedThisTick.push(t);
    // attribution: damage contribution over the last 12 seconds
    const contrib = new Map<number, number>();
    for (const d of t.damageLog) if (this.time - d.t <= ATTRIBUTION_WINDOW) contrib.set(d.from, (contrib.get(d.from) ?? 0) + d.amt);
    let killer: Player | null = src && src !== t ? src : null;
    if (!killer && contrib.size) {
      let best = -1, bv = -1;
      for (const [id, v] of contrib) if (v > bv) { bv = v; best = id; }
      killer = this.players[best] ?? null;
    }
    const assists = [...contrib.keys()].filter((id) => !killer || id !== killer.id);
    for (const a of assists) this.players[a].stats.assists++;
    if (killer) {
      killer.stats.kills++;
      killer.stats.timeline.push({ t: this.matchClock(), text: `Eliminated ${t.name}` });
      (t as PlayerX).killerId = killer.id;
      killer.bot?.onKill(this, t);
    }
    const cause = weapon ? WEAPONS[weapon].name : kind === 'storm' ? 'Riftstorm' : kind === 'fall' ? 'a long fall' : kind === 'hazard' ? 'heat channel' : kind === 'orb' ? 'Wind Orb' : kind;
    t.stats.deathCause = killer ? `${killer.name} (${cause})` : cause;
    t.stats.timeline.push({ t: this.matchClock(), text: `Eliminated by ${t.stats.deathCause}` });
    t.stats.survival = this.matchClock();
    t.stats.placement = this.aliveCount() + 1;
    this.events.push({ e: 'kill', victim: t.id, vName: t.name, killer: killer?.id ?? -1, kName: killer?.name ?? '', cause, assists });
    // consolidated death cache preserving exact items/ammo
    const contents: LootRoll[] = [];
    for (const sl of t.slots) {
      if (!sl) continue;
      contents.push(sl.kind === 'weapon' ? { kind: 'weapon', w: sl.w, r: sl.r, mag: sl.mag } : { kind: 'item', item: sl.id, n: sl.n });
    }
    for (const a of AMMO_TYPES) if (t.ammo[a] > 0) contents.push({ kind: 'ammo', ammo: a, amount: t.ammo[a] });
    t.slots = [null, null, null, null, null];
    t.ammo = { light: 0, shell: 0, heavy: 0, charge: 0 };
    if (contents.length) {
      const y = Math.max(this.w.support(t.ms.x, t.ms.z, 0.3, t.ms.y + 1), WATER_LEVEL - 0.2);
      this.containers.push({ id: this.nextId++, kind: 'cache', x: t.ms.x, y, z: t.ms.z, yaw: t.ms.yaw, tier: 0, opened: false, contents });
    }
    t.spectate = killer?.id ?? -1;
  }

  // ------------------------------------------------------------ projectiles
  private stepProjectiles() {
    const keep: Projectile[] = [];
    for (const pr of this.projectiles) {
      pr.life -= DT;
      pr.vy -= pr.gravity * DT;
      const o = { x: pr.x, y: pr.y, z: pr.z };
      const step = { x: pr.vx * DT, y: pr.vy * DT, z: pr.vz * DT };
      const L = Math.hypot(step.x, step.y, step.z) || 1e-6;
      const d = { x: step.x / L, y: step.y / L, z: step.z / L };
      const wh = this.w.raycast(o, d, L);
      const maxT = wh ? wh.t : L;
      const owner = this.players[pr.owner];
      const ph = rayPlayers(this.players, o, d, maxT + (pr.kind === 'rail' ? 0 : 0.4), pr.owner);
      let exploded = false;
      if (ph) {
        if (pr.kind === 'rail') {
          const mult = ph.zone === 'head' ? pr.headMult : ph.zone === 'limb' ? 0.85 : 1;
          if (this.phase !== 'staging' || ph.p.isDummy) {
            this.applyDamage(ph.p, pr.damage * mult, owner, 'weapon', ph.zone, 'longwake');
            owner.stats.hits++;
          }
          continue;
        }
        this.detonate(pr, o.x + d.x * ph.t, o.y + d.y * ph.t, o.z + d.z * ph.t);
        exploded = true;
      } else if (wh) {
        if (pr.kind === 'rail') { this.events.push({ e: 'impact', x: wh.x, y: wh.y, z: wh.z, nx: wh.nx, ny: wh.ny, nz: wh.nz, player: false }); continue; }
        this.detonate(pr, wh.x - d.x * 0.2, wh.y - d.y * 0.2 + 0.2, wh.z - d.z * 0.2);
        exploded = true;
      } else if (pr.y < WATER_LEVEL && pr.kind !== 'rail') {
        this.detonate(pr, pr.x, WATER_LEVEL + 0.2, pr.z);
        exploded = true;
      } else if (pr.life <= 0) {
        if (pr.kind === 'mist') this.detonate(pr, pr.x, pr.y, pr.z);
        continue;
      }
      // caravan
      const cv = this.caravan;
      if (!exploded && cv && cv.alive && Math.hypot(pr.x - cv.x, pr.y - cv.y, pr.z - cv.z) < 3) {
        this.damageCaravan(pr.damage * 1.5, owner);
        if (pr.kind !== 'rail') this.detonate(pr, pr.x, pr.y, pr.z);
        continue;
      }
      if (exploded) continue;
      pr.x += step.x; pr.y += step.y; pr.z += step.z;
      keep.push(pr);
    }
    this.projectiles = keep;
  }

  private detonate(pr: Projectile, x: number, y: number, z: number) {
    if (pr.kind === 'mist') {
      this.smokes.push({ id: this.nextId++, x, y: y + 1.5, z, r: 7, until: this.time + 14 });
      this.events.push({ e: 'explode', x, y, z, r: 7, kind: 'mist' });
      return;
    }
    const owner = this.players[pr.owner];
    this.events.push({ e: 'explode', x, y, z, r: pr.splash, kind: 'wind' });
    for (const q of this.players) {
      if (!q.alive || q.ms.mode === 'skiff') continue;
      const dx = q.ms.x - x, dy = q.ms.y + 1 - y, dz = q.ms.z - z;
      const dist = Math.hypot(dx, dy, dz);
      if (dist > pr.splash) continue;
      const k = 1 - dist / pr.splash;
      const L = dist || 1;
      const kb = pr.knockback * (0.5 + 0.5 * k);
      const s = q.ms;
      if (s.mode === 'ground' || s.mode === 'air' || s.mode === 'swim' || s.mode === 'zip' || s.mode === 'ascend') {
        s.vx += (dx / L) * kb; s.vz += (dz / L) * kb; s.vy = Math.max(s.vy, 6 + kb * 0.45);
        s.mode = 'air'; s.zipId = -1; s.ascId = -1; s.onGround = false; s.fallProtect = 1.8; s.crouch = false; s.slide = 0;
        if (s.y < WATER_LEVEL - 1) s.y = WATER_LEVEL - 0.9;
      }
      if (q !== owner && (this.phase !== 'staging' || q.isDummy)) this.applyDamage(q, pr.damage * (0.5 + 0.5 * k), owner, 'orb', 'torso', pr.weapon);
    }
  }

  // ------------------------------------------------------------ views
  snapshotFor(viewerId: number): Snapshot {
    const me = this.players[viewerId];
    const focusP = !me.alive && me.spectate >= 0 && this.players[me.spectate]?.alive ? this.players[me.spectate] : me;
    const fx = focusP.ms.x, fz = focusP.ms.z;
    const slot = me.slots[me.sel];
    const st = slot?.kind === 'weapon' ? weaponStats(slot.w, slot.r) : null;
    const s = me.ms;
    const players: ActorView[] = [];
    for (const p of this.players) {
      if (p === me) continue;
      if (p.ms.mode === 'skiff') continue;
      if (!p.alive && this.time - p.deathTime > 6) continue;
      // interest management: never send transforms outside relevance
      if (Math.hypot(p.ms.x - fx, p.ms.z - fz) > INTEREST_RADIUS) continue;
      const ps = p.slots[p.sel];
      players.push({
        id: p.id, name: p.name, x: p.ms.x, y: p.ms.y, z: p.ms.z, yaw: p.ms.yaw, pitch: p.ms.pitch, vx: p.ms.vx, vz: p.ms.vz,
        mode: p.ms.mode, crouch: p.ms.crouch, slide: p.ms.slide > 0, weapon: ps?.kind === 'weapon' ? ps.w : null, rarity: ps?.kind === 'weapon' ? ps.r : 0,
        body: p.body, glider: p.glider, alive: p.alive, ads: p.ads, healing: !!p.use, shielded: p.aegis + p.reserve > 0,
      });
    }
    const loot: LootView[] = [];
    for (const it of this.loot.values()) {
      if (Math.abs(it.x - fx) > LOOT_RADIUS || Math.abs(it.z - fz) > LOOT_RADIUS) continue;
      const { respawnKey: _r, droppedBy: _d, ...v } = it;
      loot.push(v);
    }
    const containers: ContainerView[] = [];
    for (const c of this.containers) {
      const far = Math.hypot(c.x - fx, c.z - fz) > 160;
      if (far && c.kind !== 'capsule' && c.kind !== 'caravan') continue;
      containers.push({ id: c.id, kind: c.kind, x: c.x, y: c.y, z: c.z, yaw: c.yaw, opened: c.opened, tier: c.tier });
    }
    const focus = me.alive ? this.focusFor(me) : null;
    const spect = focusP !== me ? { id: focusP.id, name: focusP.name, health: Math.round(focusP.health), shield: Math.round(focusP.aegis + focusP.reserve) } : null;
    const grapple = me.slots.find((x) => x?.kind === 'item' && x.id === 'grapple');
    const agl = s.y - Math.max(this.w.support(s.x, s.z, 0.3, s.y + 0.1), WATER_LEVEL);
    const cv = this.caravan;
    return {
      tick: this.tick, time: this.time, mode: this.opts.mode, phase: this.phase,
      phaseLeft: Number.isFinite(this.phaseEnd) ? Math.max(0, this.phaseEnd - this.time) : 0,
      matchClock: this.matchClock(),
      alive: this.aliveCount(), total: this.opts.mode === 'solo' ? this.seats : 1,
      you: {
        id: me.id, name: me.name, alive: me.alive, x: s.x, y: s.y, z: s.z, vx: s.vx, vy: s.vy, vz: s.vz, yaw: s.yaw, mode: s.mode,
        crouch: s.crouch || s.slide > 0, slide: s.slide > 0, sprinting: s.sprinting, stamina: s.stamina,
        health: me.health, aegis: me.aegis, reserve: me.reserve,
        aegisRecharging: me.aegis < AEGIS_MAX && (me.aegisBoost || this.time - me.lastDamage >= AEGIS_DELAY),
        slots: me.slots.map((x) => (x ? { ...x } : null)), sel: me.sel, ammo: { ...me.ammo },
        reloadLeft: me.reloadEnd > 0 ? me.reloadEnd - this.time : 0, reloadTotal: me.reloadTotal,
        equipLeft: Math.max(0, me.equipEnd - this.time), chargeLeft: me.chargeEnd > 0 ? me.chargeEnd - this.time : 0,
        bloom: me.bloom, spread: st ? currentSpread(me, st) : 0, ads: me.ads, shoulder: me.shoulder,
        use: me.use ? { id: me.use.id, left: me.use.end - this.time, total: ITEMS[me.use.id].useTime } : null,
        focus, holdProgress: focus && focus.t === 'loot' && focus.needsHold ? Math.min(1, me.interactHeld / 0.4) : 0,
        kills: me.stats.kills, placement: me.stats.placement, canGlide: s.canGlide, agl, distance: s.distance,
        grappleCharges: grapple?.kind === 'item' ? grapple.n : 0, inStorm: this.inStorm(me),
      },
      spectating: spect,
      players, loot, containers,
      projectiles: this.projectiles.filter((p) => Math.hypot(p.x - fx, p.z - fz) < 300).map((p) => ({ id: p.id, kind: p.kind, x: p.x, y: p.y, z: p.z, vx: p.vx, vy: p.vy, vz: p.vz })),
      smokes: this.smokes.map((m) => ({ id: m.id, x: m.x, y: m.y, z: m.z, r: m.r, left: m.until - this.time })),
      storm: stormView(this.stormStart >= 0 ? this.stormNow : stormAt(this.storm, 0), this.storm.phases.length),
      skiff: this.skiff ? { x: this.skiff.x, y: this.skiff.y, z: this.skiff.z, dx: this.skiff.bx - this.skiff.ax, dz: this.skiff.bz - this.skiff.az, ax: this.skiff.ax, az: this.skiff.az, bx: this.skiff.bx, bz: this.skiff.bz, t: this.skiff.t, active: this.skiff.active, jumpOpen: this.skiffJumpOpen() } : null,
      capsules: this.capsules.map((c) => ({ id: c.id, x: c.x, y: c.y, z: c.z, landed: c.landed })),
      caravan: cv ? (() => {
        const near = Math.hypot(cv.x - fx, cv.z - fz) < 220;
        return { x: near ? cv.x : Math.round(cv.x / 40) * 40, y: cv.y, z: near ? cv.z : Math.round(cv.z / 40) * 40, exact: near, shield: Math.max(0, cv.shield), shieldMax: 600, alive: cv.alive };
      })() : null,
      marker: me.marker,
      winner: this.winner ? { id: this.winner.id, name: this.winner.name } : null,
    };
  }

  /** Events relevant to a viewer (interest filtered). */
  eventsFor(viewerId: number): GameEvent[] {
    const me = this.players[viewerId];
    const focusP = !me.alive && me.spectate >= 0 && this.players[me.spectate] ? this.players[me.spectate] : me;
    const fx = focusP.ms.x, fz = focusP.ms.z;
    const near = (x: number, z: number, r: number) => Math.hypot(x - fx, z - fz) <= r;
    const out: GameEvent[] = [];
    for (const e of this.events) {
      switch (e.e) {
        case 'hit': case 'hurt': case 'recoil': case 'pickup': case 'denied': case 'heal': case 'aegis': case 'echo':
          if (e.to === viewerId || e.to === focusP.id) out.push(e);
          break;
        case 'shot': {
          const sh = this.players[e.by];
          if (e.by === viewerId || near(e.fx, e.fz, Math.max(WEAPONS[e.w].audibleRadius, 60))) {
            // positions of far shooters are quantised: event-only, no transform leak
            if (sh && !near(e.fx, e.fz, INTEREST_RADIUS)) out.push({ ...e, fx: Math.round(e.fx / 25) * 25, fz: Math.round(e.fz / 25) * 25, tx: 0, ty: 0, tz: 0 });
            else out.push(e);
          }
          break;
        }
        case 'footstep': if (near(e.x, e.z, 45)) out.push(e); break;
        case 'impact': if (near(e.x, e.z, 150)) out.push(e); break;
        case 'explode': if (near(e.x, e.z, 220)) out.push(e); break;
        case 'open': case 'move': case 'reload': if (near(e.x, e.z, 70)) out.push(e); break;
        case 'charge': case 'glint': if (near(e.x, e.z, 320)) out.push(e); break;
        case 'grapple': if (e.by === viewerId || near(e.x, e.z, 100)) out.push(e); break;
        default: out.push(e);
      }
    }
    return out;
  }

  resultFor(id: number): MatchResult {
    const p = this.players[id];
    const st = p.stats;
    return {
      placement: p.alive && this.winner === p ? 1 : st.placement || this.aliveCount(),
      total: this.seats,
      winner: this.winner?.name ?? '—',
      youWon: this.winner === p,
      kills: st.kills, assists: st.assists, damage: Math.round(st.damage), shots: st.shots, hits: st.hits,
      survival: p.alive ? this.matchClock() : st.survival,
      distance: Math.round(p.ms.distance), stormDamage: Math.round(st.stormDamage), healed: Math.round(st.healed),
      loot: st.loot, timeline: [...this.timeline, ...st.timeline].sort((a, b) => a.t - b.t), route: st.route,
      deathCause: st.deathCause, seed: this.opts.seed, ruleset: RULESET_VERSION, manifest: this.island.manifestHash,
    };
  }

  /** Stable digest of the authoritative state, for determinism/replay checks. */
  stateHash(): string {
    let h = 0x811c9dc5;
    const mix = (v: number) => { h ^= Math.round(v * 100) | 0; h = Math.imul(h, 0x01000193) >>> 0; };
    for (const p of this.players) { mix(p.ms.x); mix(p.ms.y); mix(p.ms.z); mix(p.health); mix(p.aegis); mix(p.alive ? 1 : 0); mix(p.stats.kills); }
    mix(this.loot.size); mix(this.tick);
    return h.toString(16);
  }
}

interface PlayerX extends Player {
  stepAcc: number;
  lastDist: number;
  killerId?: number;
  recharging?: boolean;
  ready?: boolean;
  dummyOrigin?: { x: number; z: number; phase: number };
}

function emptyStats(): PlayerStats {
  return { kills: 0, assists: 0, damage: 0, shots: 0, hits: 0, stormDamage: 0, healed: 0, survival: 0, placement: 0, loot: [], timeline: [], route: [], deathCause: null };
}

export function lootLabel(it: { kind: string; w?: WeaponId; r?: Rarity; item?: ItemId; n?: number; ammo?: AmmoType; amount?: number }): string {
  if (it.kind === 'weapon') return `${RARITIES[it.r ?? 0].name} ${WEAPONS[it.w!].name}`;
  if (it.kind === 'item') return `${ITEMS[it.item!].name}${(it.n ?? 1) > 1 ? ` ×${it.n}` : ''}`;
  return `${it.ammo![0].toUpperCase()}${it.ammo!.slice(1)} Ammo`;
}

export { smokeBlocks, rayPlayers };
