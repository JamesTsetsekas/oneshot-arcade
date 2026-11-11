// server-match: the authoritative match. Lifecycle, players, loot, storm, combat resolution, winner, snapshots.
// Runs identically in the browser (local bot mode), in Node tests and in the soak tool.
import { AEGIS_DELAY, AEGIS_MAX, AEGIS_RATE, HEALTH_MAX, ITEMS, ITEM_IDS, MIST_DURATION, type LootDesc, type Slot } from "../../shared/content/items";
import {
  AUTO_AMMO_RANGE, CHEST_OPEN_RANGE, HEAT_CHANNEL_DPS, INTEREST_RADIUS, KILL_CREDIT_WINDOW, LOOT_INTEREST_RADIUS, MOVE, PACE_SCALE,
  PICKUP_RANGE, SEATS, SKIFF, STAGING_SECONDS, SWAP_HOLD_SECONDS,
} from "../../shared/content/rules";
import { AMMO_CAPS, AMMO_TYPES, CONTENT_VERSION, RARITIES, WEAPONS, WEAPON_IDS, weaponStats } from "../../shared/content/weapons";
import { Rng, clamp } from "../../shared/math";
import {
  ActorFlag, Btn, DT, Mode, PROTOCOL_VERSION,
  type ActionRequest, type ActorView, type ChestView, type FocusView, type InputFrame, type MatchConfig, type MatchEvent,
  type MatchPhase, type MatchResults, type RosterEntry, type SelfView, type Snapshot, type Welcome,
} from "../../shared/protocol/protocol";
import type { World } from "../../shared/world/collision";
import { buildIsland, locationAt, type IslandData } from "../../shared/world/island";
import { BotBrain } from "../bots/bot";
import { filterEvents, inInterest } from "../spatial/interest";
import { HIST, createActor, resetLoadout, type Actor } from "./actor";
import { aimDir, aimPivot, currentSpread, stepCombat, stepProjectiles, type Projectile, type Zone } from "./combat";
import { LootRoller, lootName } from "./loot";
import { ascenderInRange, stepMovement, tryAttachAscender, tryAttachZip, zipInRange } from "./movement";
import { Storm } from "./storm";

export interface LootEntity extends LootDesc {
  id: number;
  x: number;
  y: number;
  z: number;
}

export interface ChestEntity {
  id: number;
  x: number;
  y: number;
  z: number;
  yaw: number;
  kind: "chest" | "locker" | "cache" | "capsule" | "vault";
  tier: number;
  loc: number;
  open: boolean;
  openedAt: number;
  contents: LootDesc[] | null;
  pier: boolean;
}

export interface QueuedEvent {
  ev: MatchEvent;
  /** -1 = routed by interest; otherwise only this actor (or whoever views them). */
  to: number;
}

interface PierSpot {
  x: number;
  y: number;
  z: number;
  lootId: number;
  emptyAt: number;
  make: (cycle: number) => LootDesc;
  cycle: number;
}

const BOT_NAMES = [
  "Brindle", "Kestrel Vane", "Oda Vale", "Marrow", "Tamsin Reed", "Quill", "Harrow", "Sable Finch", "Ilex", "Pike Arden",
  "Wren Calder", "Juno Brack", "Thistle", "Cobalt Rae", "Fennick", "Marlo Dune", "Yarrow", "Bexley", "Orrin Hale", "Saffi",
  "Hesper", "Ketch", "Lark Ansel", "Rook Ainsley", "Mossgate", "Vesper Lin", "Calloway", "Dru Tarn",
];
const CLOTH = ["#1fb0a6", "#ea6a50", "#f4b63a", "#cc4c9f", "#4f63d6", "#7ac74f", "#e8e2cf", "#8a5cd6", "#d9773a", "#3fa7d6"];

const tmpA = { x: 0, y: 0, z: 0 };
const tmpB = { x: 0, y: 0, z: 0 };

export class Match {
  readonly island: IslandData;
  readonly world: World;
  readonly rng: Rng;
  readonly roller: LootRoller;
  readonly storm: Storm;
  tick = 0;
  time = 0;
  phase: MatchPhase = "staging";
  phaseTimer = STAGING_SECONDS;
  activeStart = 0;
  actors: Actor[] = [];
  brains: (BotBrain | null)[] = [];
  humanId = -1;
  aliveCount = 0;
  winnerId = -1;
  endedAt = 0;
  loot = new Map<number, LootEntity>();
  chests: ChestEntity[] = [];
  projectiles: Projectile[] = [];
  mists: { x: number; y: number; z: number; r: number; born: number }[] = [];
  capsules: { id: number; x: number; y: number; z: number; groundY: number }[] = [];
  caravan: null | { x: number; y: number; z: number; alive: boolean; shield: number; wp: number; nextPing: number; gone: boolean } = null;
  private caravanRoute: [number, number][] = [];
  private capsulesSpawned = 0;
  private nextCapsule = 0;
  skiff = { x: 0, y: SKIFF.altitude, z: 0, yaw: 0, t: 0, ax: 0, az: 0, bx: 0, bz: 0, active: false };
  canJump = false;
  private jumpWindowSeen = false;
  events: QueuedEvent[] = [];
  noises: { x: number; y: number; z: number; r: number; time: number; actor: number }[] = [];
  private pendingDeaths: { victim: Actor; attacker: number; cause: string }[] = [];
  histHead = 0;
  nextId = 1;
  navBudget = 0;
  private pierSpots: PierSpot[] = [];
  private focusCache: FocusView = null;
  /** Wall-clock ms spent in the last step (for the soak / perf readout). */
  lastStepMs = 0;

  constructor(readonly cfg: MatchConfig) {
    this.island = buildIsland();
    this.world = this.island.world;
    this.rng = new Rng(cfg.seed);
    this.roller = new LootRoller(this.rng.fork(3));
    this.storm = new Storm(this.rng.fork(11), this.island.finalCenters, cfg.pace);
    this.setupActors();
    this.setupWorldLoot();
    this.setupSkiffPath();
    if (cfg.mode === "practice") {
      this.phase = "active";
      this.phaseTimer = 0;
    }
  }

  /** True while more players are alive than the current storm phase expects (drives bot aggression only). */
  get pressure(): boolean {
    const expected = [17, 14, 11, 8, 5, 3, 2, 2, 2, 1];
    return this.aliveCount > (expected[Math.min(this.storm.phase, expected.length - 1)] ?? 1);
  }

  // ------------------------------------------------------------------ setup

  private setupActors(): void {
    const pier = this.island.pier;
    const rng = this.rng.fork(5);
    const names = [...BOT_NAMES];
    for (let i = names.length - 1; i > 0; i--) {
      const j = rng.int(0, i);
      [names[i], names[j]] = [names[j]!, names[i]!];
    }
    const practice = this.cfg.mode === "practice";
    const seats = practice ? (this.cfg.human ? 1 : 0) : Math.min(SEATS, Math.max(2, this.cfg.seats));
    const order = pier.spawns.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = rng.int(0, i);
      [order[i], order[j]] = [order[j]!, order[i]!];
    }
    for (let i = 0; i < seats; i++) {
      const isHuman = i === 0 && this.cfg.human !== null;
      const a = createActor(i, isHuman ? this.cfg.human!.name : names[i % names.length]!, !isHuman);
      if (isHuman) {
        a.body = this.cfg.human!.body;
        a.primary = this.cfg.human!.primary;
        a.secondary = this.cfg.human!.secondary;
        a.sail = this.cfg.human!.sail;
        this.humanId = i;
      } else {
        a.body = rng.int(0, 3);
        a.primary = rng.pick(CLOTH);
        a.secondary = rng.pick(CLOTH);
        a.sail = rng.pick(CLOTH);
      }
      const sp = pier.spawns[order[i % order.length]!]!;
      a.x = sp[0];
      a.z = sp[1];
      a.y = pier.y;
      a.yaw = rng.range(-Math.PI, Math.PI);
      a.homeX = a.x;
      a.homeZ = a.z;
      a.input.yaw = a.yaw;
      this.actors.push(a);
      this.brains.push(isHuman ? null : new BotBrain(a, this.rng.fork(100 + i)));
    }
    this.aliveCount = seats;
    if (practice) {
      for (const d of pier.dummies) {
        const a = createActor(this.actors.length, d.mover ? "Strafing Target" : "Target Dummy", true);
        a.dummy = true;
        a.mover = d.mover;
        a.body = this.actors.length % 4;
        a.primary = "#d9773a";
        a.secondary = "#e8e2cf";
        a.x = d.x;
        a.y = d.y;
        a.z = d.z;
        a.yaw = d.yaw;
        a.input.yaw = d.yaw;
        a.homeX = d.x;
        a.homeZ = d.z;
        this.actors.push(a);
        this.brains.push(null);
      }
    }
  }

  private addLoot(d: LootDesc, x: number, y: number, z: number): LootEntity {
    const e: LootEntity = { ...d, id: this.nextId++, x, y, z };
    this.loot.set(e.id, e);
    return e;
  }

  private setupWorldLoot(): void {
    const isl = this.island;
    const practice = this.cfg.mode === "practice";
    const rng = this.rng.fork(7);
    if (!practice) {
      for (const s of isl.sockets) {
        if (!s.guaranteed && !rng.chance(0.84)) continue;
        this.addLoot(this.roller.floor(s.tier, s.guaranteed), s.x, s.y, s.z);
      }
    }
    for (const c of isl.chests) {
      const pier = c.loc < 0;
      if (practice !== pier && !pier) continue;
      if (!practice && !pier && c.kind === "chest" && !rng.chance(0.86)) continue;
      this.chests.push({ id: this.nextId++, x: c.x, y: c.y, z: c.z, yaw: c.yaw, kind: c.kind, tier: c.tier, loc: c.loc, open: false, openedAt: 0, contents: null, pier });
    }
    // Staging pier / practice range racks
    const pier = isl.pier;
    WEAPON_IDS.forEach((id, i) => {
      const p = pier.weaponSpots[i]!;
      this.pierSpots.push({
        x: p[0], y: p[1], z: p[2], lootId: -1, emptyAt: -10, cycle: 0,
        make: (cycle) => {
          const rarity = practice ? cycle % RARITIES.length : 0;
          return { kind: "weapon", weapon: id, rarity, mag: weaponStats(id, rarity).mag, bonus: AMMO_CAPS[WEAPONS[id].ammo], count: 1 };
        },
      });
    });
    ITEM_IDS.forEach((id, i) => {
      const p = pier.itemSpots[i]!;
      this.pierSpots.push({ x: p[0], y: p[1], z: p[2], lootId: -1, emptyAt: -10, cycle: 0, make: () => ({ kind: "item", item: id, count: ITEMS[id].stack }) });
    });
    for (const s of this.pierSpots) s.lootId = this.addLoot(s.make(0), s.x, s.y, s.z).id;
  }

  private setupSkiffPath(): void {
    const rng = this.rng.fork(13);
    const th = rng.range(0, Math.PI * 2);
    const off = rng.range(-140, 140);
    const dx = Math.sin(th),
      dz = Math.cos(th);
    const cx = dz * off,
      cz = -dx * off;
    const s = this.skiff;
    s.ax = cx - dx * 760;
    s.az = cz - dz * 760;
    s.bx = cx + dx * 760;
    s.bz = cz + dz * 760;
    s.x = s.ax;
    s.z = s.az;
    s.yaw = th;
  }

  welcome(): Welcome {
    const roster: RosterEntry[] = this.actors.map((a) => ({ id: a.id, name: a.name, bot: a.bot, body: a.body, primary: a.primary, secondary: a.secondary, sail: a.sail }));
    const s = this.skiff;
    return { protocol: PROTOCOL_VERSION, content: CONTENT_VERSION, config: this.cfg, youId: this.humanId, roster, skiffPath: { ax: s.ax, az: s.az, bx: s.bx, bz: s.bz } };
  }

  // ------------------------------------------------------------------ messaging

  emit(ev: MatchEvent): void {
    this.events.push({ ev, to: -1 });
  }
  emitTo(a: Actor, ev: MatchEvent): void {
    if (!a.bot) this.events.push({ ev, to: a.id });
  }
  toast(a: Actor, msg: string, tone: "info" | "warn" | "good"): void {
    if (!a.bot) this.events.push({ ev: { t: "toast", msg, tone }, to: a.id });
  }
  noise(a: Actor, r: number): void {
    this.noises.push({ x: a.x, y: a.y + 1.3, z: a.z, r, time: this.time, actor: a.id });
  }

  setInput(id: number, frame: InputFrame): void {
    const a = this.actors[id];
    if (!a || a.bot) return;
    const prevPressed = a.input.pressed;
    a.input = { ...frame, pressed: frame.pressed | prevPressed };
    // sanitise
    a.input.moveX = clamp(Number.isFinite(frame.moveX) ? frame.moveX : 0, -1, 1);
    a.input.moveZ = clamp(Number.isFinite(frame.moveZ) ? frame.moveZ : 0, -1, 1);
    a.input.pitch = clamp(Number.isFinite(frame.pitch) ? frame.pitch : 0, -1.5, 1.5);
    if (!Number.isFinite(frame.yaw)) a.input.yaw = a.yaw;
  }

  action(id: number, req: ActionRequest): void {
    const a = this.actors[id];
    if (!a) return;
    switch (req.type) {
      case "dropSlot":
        if (a.alive && this.phase !== "ended") this.dropSlot(a, req.slot | 0);
        break;
      case "swapSlots": {
        const i = req.a | 0,
          j = req.b | 0;
        if (!a.alive || i === j || i < 0 || j < 0 || i >= a.slots.length || j >= a.slots.length) break;
        [a.slots[i], a.slots[j]] = [a.slots[j]!, a.slots[i]!];
        if (a.selected === i || a.selected === j) this.selectSlot(a, a.selected, true);
        break;
      }
      case "marker":
        if (Number.isFinite(req.x) && Number.isFinite(req.z)) a.marker = { x: clamp(req.x, -780, 780), z: clamp(req.z, -780, 780) };
        break;
      case "clearMarker":
        a.marker = null;
        break;
      case "ready":
        if (this.phase === "staging") this.phaseTimer = Math.min(this.phaseTimer, 3);
        break;
      case "spectate":
        this.cycleSpectate(a, req.dir);
        break;
      case "practiceRefill":
        if (this.cfg.mode === "practice" && a.alive) {
          for (const t of AMMO_TYPES) a.ammo[t] = AMMO_CAPS[t];
          a.health = HEALTH_MAX;
          a.aegis = AEGIS_MAX;
          this.toast(a, "Ammo and health refilled", "good");
        }
        break;
    }
  }

  private cycleSpectate(a: Actor, dir: number): void {
    if (a.alive) return;
    const alive = this.actors.filter((o) => o.alive && !o.dummy);
    if (!alive.length) return;
    let idx = alive.findIndex((o) => o.id === a.spectate);
    idx = (idx + dir + alive.length) % alive.length;
    a.spectate = alive[idx]!.id;
  }

  // ------------------------------------------------------------------ inventory

  selectSlot(a: Actor, s: number, force = false): void {
    if (s === a.selected && !force) return;
    a.selected = s;
    a.reloadEnd = -1;
    a.chargeEnd = -1;
    if (a.useItem === "flask" || a.useItem === "cell" || a.useItem === "beacon") {
      a.useItem = null;
      a.useEnd = -1;
    }
    const slot = a.slots[s];
    a.equipUntil = this.time + (slot && slot.kind === "weapon" ? weaponStats(slot.weapon, slot.rarity).equip : 0.2);
    a.burst = 0;
  }

  private dropPoint(a: Actor): [number, number, number] {
    const w = this.world;
    let x = a.x + Math.sin(a.yaw) * 1.1,
      z = a.z + Math.cos(a.yaw) * 1.1;
    if (w.blocked(x, z, 0.25, a.y + 0.3, a.y + 1.2)) {
      x = a.x;
      z = a.z;
    }
    const y = Math.max(w.support(x, z, 0.2, a.y + 0.6), a.mode === Mode.Swim ? -0.1 : -50);
    return [x, y, z];
  }

  dropSlot(a: Actor, i: number): boolean {
    const s = a.slots[i];
    if (!s) return false;
    const [x, y, z] = this.dropPoint(a);
    if (s.kind === "weapon") this.addLoot({ kind: "weapon", weapon: s.weapon, rarity: s.rarity, mag: s.mag, bonus: 0, count: 1 }, x, y, z);
    else this.addLoot({ kind: "item", item: s.item, count: s.count }, x, y, z);
    a.slots[i] = null;
    if (i === a.selected) {
      a.reloadEnd = -1;
      a.chargeEnd = -1;
      if (a.useItem && a.useItem !== "injector" && a.useItem !== "trauma") a.useItem = null;
    }
    this.emit({ t: "sound", kind: "drop", x, y, z, actor: a.id });
    return true;
  }

  needsSwap(a: Actor, l: LootEntity): boolean {
    if (l.kind === "ammo") return false;
    if (l.kind === "item") {
      const def = ITEMS[l.item!];
      if (a.slots.some((s) => s && s.kind === "item" && s.item === l.item && s.count < def.stack)) return false;
    }
    return !a.slots.some((s) => s === null);
  }

  /** Server-validated pickup. Returns true if anything was taken. */
  pickup(a: Actor, lootId: number, allowSwap: boolean): boolean {
    const l = this.loot.get(lootId);
    if (!l || !a.alive) return false;
    if (Math.hypot(l.x - a.x, l.y - a.y, l.z - a.z) > PICKUP_RANGE + 0.6) return false;
    if (a.mode === Mode.Skiff || a.mode === Mode.Freefall || a.mode === Mode.Glide || a.mode === Mode.Dead) return false;
    if (l.kind === "ammo") {
      const t = l.ammo!;
      const room = AMMO_CAPS[t] - a.ammo[t];
      if (room <= 0) {
        this.toast(a, `${t[0]!.toUpperCase()}${t.slice(1)} ammo is at its cap`, "info");
        return false;
      }
      const take = Math.min(room, l.count);
      a.ammo[t] += take;
      l.count -= take;
      if (l.count <= 0) this.loot.delete(l.id);
      this.emitTo(a, { t: "pickup", actor: a.id, kind: "ammo", name: `+${take} ${t}`, rarity: 0 });
      return true;
    }
    if (l.kind === "item") {
      const def = ITEMS[l.item!];
      let left = l.count;
      for (const s of a.slots) {
        if (left > 0 && s && s.kind === "item" && s.item === l.item && s.count < def.stack) {
          const take = Math.min(def.stack - s.count, left);
          s.count += take;
          left -= take;
        }
      }
      if (left > 0) {
        let free = a.slots[a.selected] === null ? a.selected : a.slots.findIndex((s) => s === null);
        if (free < 0 && allowSwap && left === l.count) {
          this.dropSlot(a, a.selected);
          free = a.selected;
        }
        if (free >= 0) {
          a.slots[free] = { kind: "item", item: l.item!, count: left };
          left = 0;
          if (free === a.selected) this.selectSlot(a, free, true);
        }
      }
      if (left === l.count) {
        this.toast(a, "Inventory full - hold E to swap", "warn");
        return false;
      }
      l.count = left;
      if (left <= 0) this.loot.delete(l.id);
      a.stats.loot.push({ name: def.name, rarity: 0, time: this.time });
      this.emitTo(a, { t: "pickup", actor: a.id, kind: "item", name: def.name, rarity: 0 });
      return true;
    }
    // weapon
    let free = a.slots[a.selected] === null ? a.selected : a.slots.findIndex((s) => s === null);
    if (free < 0) {
      if (!allowSwap) {
        this.toast(a, "Inventory full - hold E to swap", "warn");
        return false;
      }
      this.dropSlot(a, a.selected);
      free = a.selected;
    }
    const def = WEAPONS[l.weapon!];
    a.slots[free] = { kind: "weapon", weapon: l.weapon!, rarity: l.rarity ?? 0, mag: l.mag ?? 0 };
    if (l.bonus) a.ammo[def.ammo] = Math.min(AMMO_CAPS[def.ammo], a.ammo[def.ammo] + l.bonus);
    this.loot.delete(l.id);
    const cur = a.slots[a.selected];
    if (free === a.selected || !cur || cur.kind !== "weapon") this.selectSlot(a, free, true);
    a.stats.loot.push({ name: def.name, rarity: l.rarity ?? 0, time: this.time });
    this.emitTo(a, { t: "pickup", actor: a.id, kind: "weapon", name: def.name, rarity: l.rarity ?? 0 });
    return true;
  }

  private spill(c: ChestEntity, items: LootDesc[]): void {
    const w = this.world;
    const n = items.length;
    items.forEach((d, i) => {
      const ang = c.yaw + (n > 1 ? (i / (n - 1) - 0.5) * 2.2 : 0);
      let x = c.x + Math.sin(ang) * 1.35,
        z = c.z + Math.cos(ang) * 1.35;
      if (w.blocked(x, z, 0.2, c.y + 0.25, c.y + 1.0)) {
        // try the opposite side, then fall back to the container itself
        x = c.x - Math.sin(ang) * 1.2;
        z = c.z - Math.cos(ang) * 1.2;
        if (w.blocked(x, z, 0.2, c.y + 0.25, c.y + 1.0)) {
          x = c.x + Math.sin(ang) * 0.3;
          z = c.z + Math.cos(ang) * 0.3;
        }
      }
      const y = Math.max(w.support(x, z, 0.15, c.y + 0.5), c.y - 1.2);
      this.addLoot(d, x, y, z);
    });
  }

  openChest(a: Actor, chestId: number): boolean {
    const c = this.chests.find((q) => q.id === chestId);
    if (!c || c.open || !a.alive) return false;
    if (Math.hypot(c.x - a.x, c.y - a.y, c.z - a.z) > CHEST_OPEN_RANGE + 0.8) return false;
    c.open = true;
    c.openedAt = this.time;
    let items: LootDesc[];
    switch (c.kind) {
      case "chest": items = this.roller.chest(c.tier); break;
      case "locker": items = this.roller.locker(); break;
      case "vault": items = this.roller.highTier(3); break;
      case "capsule": items = this.roller.highTier(4); break;
      default: items = c.contents ?? [];
    }
    this.spill(c, items);
    this.emit({ t: "sound", kind: c.kind === "locker" ? "locker" : "chestOpen", x: c.x, y: c.y + 0.5, z: c.z, actor: a.id });
    return true;
  }

  // ------------------------------------------------------------------ damage & death

  damage(victim: Actor, amount: number, attackerId: number, cause: string, zone: Zone | "splash" | "melee", bypass: boolean, dist = 0): void {
    if (!victim.alive || amount <= 0) return;
    const practice = this.cfg.mode === "practice";
    if (this.phase === "staging" || this.phase === "ended") return;
    if (victim.mode === Mode.Skiff) return;
    const attacker = attackerId >= 0 ? this.actors[attackerId] : undefined;
    let dmg = amount;
    let shieldDmg = 0;
    let broke = false;
    if (!bypass) {
      const had = victim.aegis + victim.reserve;
      let take = Math.min(victim.aegis, dmg);
      victim.aegis -= take;
      dmg -= take;
      shieldDmg += take;
      take = Math.min(victim.reserve, dmg);
      victim.reserve -= take;
      dmg -= take;
      shieldDmg += take;
      broke = had > 0 && victim.aegis + victim.reserve <= 0.001;
    }
    victim.health -= dmg;
    victim.lastDamage = this.time;
    victim.stats.damageTaken += amount;
    if (cause === "storm") victim.stats.stormDamage += amount;
    if (victim.useItem && ITEMS[victim.useItem].interruptible) {
      victim.useItem = null;
      victim.useEnd = -1;
      this.toast(victim, "Trauma Kit interrupted", "warn");
    }
    const killed = victim.health <= 0;
    if (attacker && attacker !== victim) {
      attacker.stats.damage += amount;
      attacker.stats.hits++;
      if (zone === "head") attacker.stats.headshots++;
      victim.damageLog.push({ from: attacker.id, amount, time: this.time });
      if (victim.damageLog.length > 24) victim.damageLog.shift();
      const ev: MatchEvent = {
        t: "hit", attacker: attacker.id, victim: victim.id, dmg: amount, zone: zone === "splash" || zone === "melee" ? zone : zone,
        shield: shieldDmg > dmg, broke, killed, dist, fromX: attacker.x, fromZ: attacker.z,
      };
      this.emitTo(attacker, ev);
      this.emitTo(victim, ev);
      const brain = this.brains[victim.id];
      if (brain) brain.onDamaged(this, attacker);
    }
    if (killed) {
      victim.health = 0;
      if (practice && !victim.dummy) {
        // practice range never eliminates the player
        const sp = this.island.pier.spawns[0]!;
        victim.x = sp[0];
        victim.z = sp[1];
        victim.y = this.island.pier.y;
        victim.vx = victim.vy = victim.vz = 0;
        victim.mode = Mode.Ground;
        victim.health = HEALTH_MAX;
        victim.aegis = AEGIS_MAX;
        this.toast(victim, "Reset to the range deck", "info");
        return;
      }
      this.pendingDeaths.push({ victim, attacker: attackerId, cause });
      victim.alive = false; // no further damage this tick
    }
  }

  damageCaravan(attacker: Actor, amount: number): void {
    const cv = this.caravan;
    if (!cv || !cv.alive) return;
    cv.shield -= amount;
    this.emitTo(attacker, { t: "hit", attacker: attacker.id, victim: -2, dmg: amount, zone: "torso", shield: true, broke: cv.shield <= 0, killed: cv.shield <= 0, dist: 0, fromX: attacker.x, fromZ: attacker.z });
    if (cv.shield <= 0) {
      cv.alive = false;
      cv.gone = true;
      const gy = Math.max(0, this.world.terrain(cv.x, cv.z));
      const items = this.roller.highTier(4);
      const c: ChestEntity = { id: this.nextId++, x: cv.x, y: gy, z: cv.z, yaw: 0, kind: "cache", tier: 4, loc: -1, open: true, openedAt: this.time, contents: null, pier: false };
      this.spillRing(c, items);
      this.emit({ t: "explode", kind: "caravan", x: cv.x, y: cv.y, z: cv.z, r: 6 });
      this.events.push({ ev: { t: "toast", msg: `${attacker.name} cracked the Caravan`, tone: "good" }, to: -1 });
      if (!attacker.bot) attacker.stats.timeline.push({ time: this.time, text: "Cracked the Caravan drone" });
    }
  }

  private spillRing(c: { x: number; y: number; z: number }, items: LootDesc[]): void {
    const w = this.world;
    items.forEach((d, i) => {
      const ang = (i / items.length) * Math.PI * 2;
      const r = items.length > 1 ? 1.3 + (i % 2) * 0.5 : 0;
      let x = c.x + Math.sin(ang) * r,
        z = c.z + Math.cos(ang) * r;
      if (w.blocked(x, z, 0.2, c.y + 0.25, c.y + 1.0)) {
        x = c.x;
        z = c.z;
      }
      const y = Math.max(w.support(x, z, 0.15, c.y + 0.6), c.y - 1.5, -0.1);
      this.addLoot(d, x, y, z);
    });
  }

  private kill(victim: Actor, attackerId: number, cause: string): void {
    const now = this.time;
    if (victim.dummy) {
      victim.mode = Mode.Dead;
      victim.reviveAt = now + 2.5;
      victim.vx = victim.vy = victim.vz = 0;
      return;
    }
    victim.mode = Mode.Dead;
    victim.vx = victim.vy = victim.vz = 0;
    victim.deathTime = now;
    victim.placement = this.aliveCount;
    this.aliveCount--;
    victim.stats.survival = now - this.activeStart;
    // attribution: damage contribution inside the credit window
    const recent = victim.damageLog.filter((d) => now - d.time <= KILL_CREDIT_WINDOW && d.from !== victim.id);
    let killerId = attackerId >= 0 && attackerId !== victim.id ? attackerId : -1;
    if (killerId < 0 && recent.length) killerId = recent[recent.length - 1]!.from;
    const assists = [...new Set(recent.map((d) => d.from))].filter((id) => id !== killerId);
    const killer = killerId >= 0 ? this.actors[killerId] : undefined;
    if (killer) {
      killer.stats.kills++;
      if (!killer.bot) killer.stats.timeline.push({ time: now, text: `Eliminated ${victim.name}` });
      const kb = this.brains[killer.id];
      if (kb) kb.onKill(this, victim);
    }
    for (const id of assists) this.actors[id]!.stats.assists++;
    if (!victim.bot) victim.stats.timeline.push({ time: now, text: killer ? `Eliminated by ${killer.name}` : `Lost to the ${cause === "storm" ? "Riftstorm" : cause}` });
    // consolidated loot cache preserving exact items and ammo
    const contents: LootDesc[] = [];
    for (const s of victim.slots) {
      if (!s) continue;
      if (s.kind === "weapon") contents.push({ kind: "weapon", weapon: s.weapon, rarity: s.rarity, mag: s.mag, bonus: 0, count: 1 });
      else contents.push({ kind: "item", item: s.item, count: s.count });
    }
    for (const t of AMMO_TYPES) if (victim.ammo[t] > 0) contents.push({ kind: "ammo", ammo: t, count: victim.ammo[t] });
    if (contents.length) {
      const gy = Math.max(this.world.support(victim.x, victim.z, 0.2, victim.y + 0.6), victim.mode === Mode.Dead && victim.y < -0.5 ? -0.1 : -50);
      this.chests.push({ id: this.nextId++, x: victim.x, y: gy, z: victim.z, yaw: victim.yaw, kind: "cache", tier: 0, loc: -1, open: false, openedAt: 0, contents, pier: false });
    }
    victim.slots = victim.slots.map(() => null);
    this.emit({ t: "kill", killer: killerId, victim: victim.id, cause, assists, x: victim.x, y: victim.y, z: victim.z, alive: this.aliveCount });
    victim.spectate = killer && killer.alive ? killer.id : (this.actors.find((o) => o.alive && !o.dummy)?.id ?? -1);
  }

  private resolveDeaths(): void {
    if (!this.pendingDeaths.length) return;
    // Deterministic tie-break: if the last players fall in the same tick, the one with the most damage dealt
    // (then the lowest id) is processed last and takes the win.
    this.pendingDeaths.sort((p, q) => p.victim.stats.damage - q.victim.stats.damage || q.victim.id - p.victim.id);
    const list = this.pendingDeaths;
    this.pendingDeaths = [];
    for (const d of list) this.kill(d.victim, d.attacker, d.cause);
    if (this.cfg.mode === "solo" && this.aliveCount <= 1 && this.phase !== "ended") this.endMatch(list[list.length - 1]!.victim);
  }

  private endMatch(lastVictim: Actor): void {
    const winner = this.actors.find((a) => a.alive && !a.dummy) ?? lastVictim;
    winner.placement = 1;
    winner.stats.survival = this.time - this.activeStart;
    this.winnerId = winner.id;
    this.phase = "ended";
    this.endedAt = this.time;
    if (!winner.bot) winner.stats.timeline.push({ time: this.time, text: "Last survivor - Skybreak!" });
    this.emit({ t: "phase", phase: "ended" });
  }

  // ------------------------------------------------------------------ lifecycle

  private beginSkiff(): void {
    this.phase = "skiff";
    const s = this.skiff;
    s.active = true;
    s.t = 0;
    for (const sp of this.pierSpots) {
      this.loot.delete(sp.lootId);
      sp.lootId = -1;
    }
    // remove anything dropped on the pier during staging
    const pier = this.island.pier;
    for (const [id, l] of this.loot) if (Math.hypot(l.x - pier.x, l.z - pier.z) < 160) this.loot.delete(id);
    this.chests = this.chests.filter((c) => !c.pier);
    for (const a of this.actors) {
      resetLoadout(a);
      a.mode = Mode.Skiff;
      a.crouch = false;
      a.x = s.x;
      a.y = s.y;
      a.z = s.z;
      a.vx = a.vy = a.vz = 0;
    }
    this.emit({ t: "phase", phase: "skiff" });
  }

  jumpFromSkiff(a: Actor): void {
    const s = this.skiff;
    a.mode = Mode.Freefall;
    a.insertion = true;
    const side = (a.id % 5) - 2;
    a.x = s.x + Math.cos(s.yaw) * side * 1.6;
    a.z = s.z - Math.sin(s.yaw) * side * 1.6;
    a.y = s.y - 5;
    a.vx = Math.sin(s.yaw) * 12;
    a.vz = Math.cos(s.yaw) * 12;
    a.vy = -6;
    this.emit({ t: "launch", actor: a.id, kind: "jump" });
    if (!a.bot) a.stats.timeline.push({ time: this.time, text: "Jumped from the skiff" });
  }

  onLanded(a: Actor): void {
    if (a.bot) return;
    const loc = locationAt(a.x, a.z);
    a.stats.timeline.push({ time: this.time, text: loc ? `Landed at ${loc.name}` : "Landed in the wilds" });
  }

  private stepSkiff(): void {
    const s = this.skiff;
    if (!s.active) return;
    const len = Math.hypot(s.bx - s.ax, s.bz - s.az);
    s.t += (SKIFF.speed * DT) / len;
    s.x = s.ax + (s.bx - s.ax) * s.t;
    s.z = s.az + (s.bz - s.az) * s.t;
    const over = Math.hypot(s.x, s.z) < 565;
    if (this.phase === "skiff") {
      if (over) this.jumpWindowSeen = true;
      this.canJump = over;
      this.phaseTimer = Math.max(0, ((1 - s.t) * len) / SKIFF.speed);
      if (this.jumpWindowSeen && !over) {
        for (const a of this.actors) if (a.mode === Mode.Skiff) this.jumpFromSkiff(a);
        this.phase = "active";
        this.canJump = false;
        this.activeStart = this.time;
        this.storm.start();
        this.nextCapsule = 1e9;
        this.emit({ t: "phase", phase: "active" });
      }
    }
    if (s.t >= 1) s.active = false;
  }

  private stepWorldEvents(): void {
    const st = this.storm;
    const scale = PACE_SCALE[this.cfg.pace];
    if (!st.started) return;
    if (st.changed) {
      this.emit({ t: "storm", phase: st.phase, state: st.changed });
      if (st.phase === 2 && st.changed === "wait") {
        this.nextCapsule = this.time + 8;
        this.spawnCaravan();
      }
      if (st.phase >= 5 && this.caravan && this.caravan.alive) {
        // the caravan may not enter the final field: it climbs away
        this.caravan.alive = false;
        this.events.push({ ev: { t: "toast", msg: "The Caravan drone has left the island", tone: "info" }, to: -1 });
      }
    }
    // supply capsules after zone 2
    if (st.phase >= 2 && st.phase <= 5 && this.time >= this.nextCapsule && this.capsulesSpawned < 4) {
      const f = st.nextField();
      for (let tries = 0; tries < 30; tries++) {
        const a = this.rng.range(0, Math.PI * 2),
          r = Math.sqrt(this.rng.next()) * Math.max(20, f.r * 0.75);
        const p = this.island.nav.nearestWalkable(f.x + Math.sin(a) * r, f.z + Math.cos(a) * r, 12);
        if (!p) continue;
        const gy = this.island.nav.heightAt(p[0], p[1]);
        if (gy < 1 || this.world.blocked(p[0], p[1], 1.0, gy + 2.5, gy + 60)) continue;
        this.capsules.push({ id: this.nextId++, x: p[0], y: gy + 230, z: p[1], groundY: gy });
        this.capsulesSpawned++;
        this.emit({ t: "ping", kind: "capsule", x: p[0], z: p[1] });
        break;
      }
      this.nextCapsule = this.time + 62 * scale;
    }
    for (let i = this.capsules.length - 1; i >= 0; i--) {
      const c = this.capsules[i]!;
      c.y -= 17 * DT;
      if (c.y <= c.groundY) {
        this.capsules.splice(i, 1);
        this.chests.push({ id: c.id, x: c.x, y: c.groundY, z: c.z, yaw: 0, kind: "capsule", tier: 4, loc: -1, open: false, openedAt: 0, contents: null, pier: false });
        this.emit({ t: "explode", kind: "capsule", x: c.x, y: c.groundY, z: c.z, r: 4 });
      }
    }
    // caravan drone
    const cv = this.caravan;
    if (cv) {
      if (!cv.alive) {
        if (!cv.gone) {
          cv.y += 14 * DT;
          if (cv.y > 400) cv.gone = true;
        }
      } else {
        let wp = this.caravanRoute[cv.wp % this.caravanRoute.length]!;
        const f = st.nextField();
        for (let k = 0; k < this.caravanRoute.length && Math.hypot(wp[0] - f.x, wp[1] - f.z) > f.r * 0.9; k++) {
          cv.wp++;
          wp = this.caravanRoute[cv.wp % this.caravanRoute.length]!;
        }
        let tx = wp[0],
          tz = wp[1];
        if (Math.hypot(tx - f.x, tz - f.z) > f.r * 0.9) {
          tx = f.x;
          tz = f.z;
        }
        const dx = tx - cv.x,
          dz = tz - cv.z;
        const d = Math.hypot(dx, dz);
        if (d < 6) cv.wp++;
        else {
          cv.x += (dx / d) * 6.5 * DT;
          cv.z += (dz / d) * 6.5 * DT;
        }
        const ty = Math.max(2, this.world.terrain(cv.x, cv.z)) + 15;
        cv.y += clamp(ty - cv.y, -6 * DT, 6 * DT);
        if (this.time >= cv.nextPing) {
          cv.nextPing = this.time + 20;
          // approximate location only
          this.emit({ t: "ping", kind: "caravan", x: cv.x + this.rng.range(-28, 28), z: cv.z + this.rng.range(-28, 28) });
        }
      }
    }
  }

  private spawnCaravan(): void {
    if (this.caravan) return;
    const f = this.storm.nextField();
    const route = this.island.locations
      .filter((l) => l.idx !== 1)
      .map((l) => [l.x, l.z] as [number, number])
      .sort((a, b) => Math.atan2(a[1] - f.z, a[0] - f.x) - Math.atan2(b[1] - f.z, b[0] - f.x));
    this.caravanRoute = route;
    const start = route[this.rng.int(0, route.length - 1)]!;
    this.caravan = { x: start[0], y: Math.max(2, this.world.terrain(start[0], start[1])) + 60, z: start[1], alive: true, shield: 320, wp: 0, nextPing: this.time + 2, gone: false };
  }

  private stepPier(): void {
    if (this.tick % 15 !== 0) return;
    const practice = this.cfg.mode === "practice";
    if (!practice && this.phase !== "staging") return;
    for (const s of this.pierSpots) {
      if (s.lootId >= 0 && !this.loot.has(s.lootId)) {
        s.lootId = -1;
        s.emptyAt = this.time;
        s.cycle++;
      }
      if (s.lootId < 0 && this.time - s.emptyAt > 2.5) s.lootId = this.addLoot(s.make(s.cycle), s.x, s.y, s.z).id;
    }
    for (const c of this.chests) if (c.pier && c.open && this.time - c.openedAt > 10) c.open = false;
    // tidy stray drops on the range so it never fills up
    if (practice && this.loot.size > 90) {
      const keep = new Set(this.pierSpots.map((s) => s.lootId));
      for (const id of this.loot.keys()) {
        if (!keep.has(id)) {
          this.loot.delete(id);
          if (this.loot.size <= 70) break;
        }
      }
    }
  }

  // ------------------------------------------------------------------ interaction

  private findFocus(a: Actor): FocusView {
    if (!a.alive || a.mode === Mode.Skiff || a.mode === Mode.Freefall || a.mode === Mode.Glide || a.mode === Mode.Mantle || a.mode === Mode.Zip || a.mode === Mode.Ascend || a.mode === Mode.Grapple) return null;
    aimPivot(a, a.input.shoulder >= 0 ? 1 : -1, tmpA);
    aimDir(a.yaw, a.pitch, tmpB);
    let best: FocusView = null;
    let bestScore = 1e9;
    const consider = (x: number, y: number, z: number, range: number, bias: number, make: () => FocusView): void => {
      const d = Math.hypot(x - a.x, y - (a.y + 0.6), z - a.z);
      if (d > range) return;
      const vx = x - tmpA.x,
        vy = y - tmpA.y,
        vz = z - tmpA.z;
      const vl = Math.hypot(vx, vy, vz) || 1;
      const cos = (vx * tmpB.x + vy * tmpB.y + vz * tmpB.z) / vl;
      const score = (1 - cos) * 3 + d * 0.12 + bias;
      if (score < bestScore) {
        bestScore = score;
        best = make();
      }
    };
    for (const l of this.loot.values()) {
      if (Math.abs(l.x - a.x) > 3.5 || Math.abs(l.z - a.z) > 3.5) continue;
      if (l.kind === "ammo" && a.ammo[l.ammo!] < AMMO_CAPS[l.ammo!]) continue;
      consider(l.x, l.y + 0.35, l.z, PICKUP_RANGE, 0, () => {
        const needsSwap = this.needsSwap(a, l);
        const hold = a.holdLoot === l.id ? clamp((this.time - a.holdStart) / SWAP_HOLD_SECONDS, 0, 1) : 0;
        return { kind: "loot", id: l.id, label: lootName(l), hold, needsSwap };
      });
    }
    for (const c of this.chests) {
      if (c.open || Math.abs(c.x - a.x) > 4 || Math.abs(c.z - a.z) > 4) continue;
      const label = c.kind === "chest" ? "Open Resonance Chest" : c.kind === "locker" ? "Open Supply Locker" : c.kind === "cache" ? "Search Loot Cache" : c.kind === "capsule" ? "Open Supply Capsule" : "Open Vault Cache";
      consider(c.x, c.y + 0.5, c.z, CHEST_OPEN_RANGE, -0.05, () => ({ kind: "chest", id: c.id, label, hold: 0, needsSwap: false }));
    }
    if (!best && (a.mode === Mode.Ground || a.mode === Mode.Air || a.mode === Mode.Swim)) {
      const ai = ascenderInRange(this, a);
      if (ai >= 0) best = { kind: "ascender", id: ai, label: "Ride Ascender", hold: 0, needsSwap: false };
      else {
        const zi = zipInRange(this, a);
        if (zi >= 0) best = { kind: "zip", id: zi, label: "Grab Zipline", hold: 0, needsSwap: false };
      }
    }
    return best;
  }

  private stepInteraction(a: Actor): void {
    // automatic ammo pickup
    if ((this.tick + a.id) % 4 === 0 && a.mode !== Mode.Skiff && a.mode !== Mode.Freefall && a.mode !== Mode.Glide) {
      for (const l of this.loot.values()) {
        if (l.kind !== "ammo") continue;
        if (Math.abs(l.x - a.x) > AUTO_AMMO_RANGE || Math.abs(l.z - a.z) > AUTO_AMMO_RANGE || Math.abs(l.y - a.y) > 1.6) continue;
        if (a.ammo[l.ammo!] >= AMMO_CAPS[l.ammo!]) continue;
        this.pickup(a, l.id, false);
      }
    }
    if (a.bot) return;
    const focus = this.findFocus(a);
    if (a.id === this.humanId) this.focusCache = focus;
    const pressed = a.input.pressed & Btn.Interact;
    const held = a.input.buttons & Btn.Interact;
    if (!held) a.holdLoot = -1;
    if (!focus) return;
    if (pressed) {
      if (focus.kind === "loot") {
        if (focus.needsSwap) {
          a.holdLoot = focus.id;
          a.holdStart = this.time;
        } else this.pickup(a, focus.id, false);
      } else if (focus.kind === "chest") this.openChest(a, focus.id);
      else if (focus.kind === "zip") tryAttachZip(this, a);
      else if (focus.kind === "ascender") tryAttachAscender(this, a);
    } else if (held && a.holdLoot >= 0 && focus.kind === "loot" && focus.id === a.holdLoot && this.time - a.holdStart >= SWAP_HOLD_SECONDS) {
      this.pickup(a, a.holdLoot, true);
      a.holdLoot = -1;
    }
  }

  // ------------------------------------------------------------------ main step

  step(): void {
    const t0 = typeof performance !== "undefined" ? performance.now() : 0;
    this.tick++;
    this.time = this.tick * DT;
    this.navBudget = 2;
    const practice = this.cfg.mode === "practice";

    if (this.phase === "staging") {
      this.phaseTimer -= DT;
      if (this.phaseTimer <= 0) this.beginSkiff();
    }
    this.stepSkiff();
    if (this.phase === "active" && !practice) {
      this.storm.step(DT);
      this.stepWorldEvents();
    }
    this.stepPier();

    // bots decide (same input path as humans)
    for (let i = 0; i < this.actors.length; i++) {
      const a = this.actors[i]!;
      const b = this.brains[i];
      if (b && a.alive) b.think(this);
      else if (a.dummy) {
        if (!a.alive && this.time >= a.reviveAt && a.mode === Mode.Dead) {
          a.alive = true;
          a.health = HEALTH_MAX;
          a.aegis = AEGIS_MAX;
          a.reserve = 0;
          a.mode = Mode.Ground;
          a.x = a.homeX;
          a.z = a.homeZ;
          a.y = this.island.pier.y;
        }
        if (a.mover && a.alive) {
          a.input.moveX = Math.sin(this.time * 0.9 + a.id) > 0 ? 1 : -1;
          a.input.yaw = a.yaw;
        }
      }
    }

    const st = this.storm;
    for (const a of this.actors) {
      if (!a.alive) continue;
      a.yaw = a.input.yaw;
      a.pitch = clamp(a.input.pitch, -1.5, 1.5);
      stepMovement(this, a, DT);
      if (!a.alive) continue;
      stepCombat(this, a, DT);
      this.stepInteraction(a);

      // staging pier: falling off is harmless
      if (this.phase === "staging" && a.y < 1.5) {
        a.x = a.homeX;
        a.z = a.homeZ;
        a.y = this.island.pier.y;
        a.mode = Mode.Ground;
        a.vx = a.vy = a.vz = 0;
      }
      // environment
      a.inStorm = false;
      a.inHazard = false;
      if (this.phase === "active" && !practice && a.mode !== Mode.Skiff) {
        if (st.outside(a.x, a.z)) {
          a.inStorm = st.dps > 0;
          if (st.dps > 0) this.damage(a, st.dps * DT, -1, "storm", "torso", true);
        }
      }
      if (a.mode === Mode.Ground || a.mode === Mode.Slide) {
        for (const h of this.island.hazards) {
          const dx = a.x - h.x,
            dz = a.z - h.z;
          if (Math.abs(dx) > 30 || Math.abs(dz) > 30 || Math.abs(a.y - h.y) > 1.0) continue;
          const c = Math.cos(h.yaw),
            s = Math.sin(h.yaw);
          const lx = dx * c - dz * s,
            lz = dx * s + dz * c;
          if (Math.abs(lx) < h.hx && Math.abs(lz) < h.hz) {
            a.inHazard = true;
            this.damage(a, HEAT_CHANNEL_DPS * DT, -1, "heat", "torso", false);
          }
        }
      }
      if (a.alive && this.time - a.lastDamage >= AEGIS_DELAY && a.aegis < AEGIS_MAX) a.aegis = Math.min(AEGIS_MAX, a.aegis + AEGIS_RATE * DT);
    }

    stepProjectiles(this, DT);
    for (let i = this.mists.length - 1; i >= 0; i--) if (this.time - this.mists[i]!.born > MIST_DURATION) this.mists.splice(i, 1);
    while (this.noises.length && this.time - this.noises[0]!.time > 1.6) this.noises.shift();

    this.resolveDeaths();

    // lag-compensation history + echo trails + route
    this.histHead = (this.histHead + 1) % HIST;
    const hi = this.histHead * 4;
    const trailTick = this.tick % 30 === 0;
    for (const a of this.actors) {
      a.hist[hi] = a.x;
      a.hist[hi + 1] = a.y;
      a.hist[hi + 2] = a.z;
      a.hist[hi + 3] = a.crouch || a.mode === Mode.Slide ? 1 : 0;
      if (trailTick && a.alive && a.mode !== Mode.Skiff) {
        a.trail.push({ x: a.x, y: a.y, z: a.z, t: this.time, yaw: Math.atan2(a.vx, a.vz) });
        if (a.trail.length > 14) a.trail.shift();
        if (!a.bot && this.tick % 90 === 0 && this.phase === "active" && !a.insertion) a.stats.route.push(Math.round(a.x), Math.round(a.z));
      }
      a.input.pressed = 0;
    }
    if (t0) this.lastStepMs = performance.now() - t0;
  }

  // ------------------------------------------------------------------ snapshots

  private viewOf(a: Actor): ActorView {
    let flags = 0;
    if (a.crouch) flags |= ActorFlag.Crouch;
    if (a.input.buttons & Btn.Ads && !a.sprinting) flags |= ActorFlag.Ads;
    if (this.time - a.lastShot < 0.12) flags |= ActorFlag.Firing;
    if (a.reloadEnd >= 0) flags |= ActorFlag.Reloading;
    if (a.useItem) flags |= ActorFlag.Using;
    if (a.sprinting) flags |= ActorFlag.Sprinting;
    if (a.chargeEnd >= 0) flags |= ActorFlag.Charging;
    if (a.dummy) flags |= ActorFlag.Dummy;
    const slot = a.slots[a.selected];
    const weapon = slot && slot.kind === "weapon" ? slot.weapon : null;
    if (weapon === "longwake" && a.input.buttons & Btn.Ads) flags |= ActorFlag.Glint;
    return {
      id: a.id, x: a.x, y: a.y, z: a.z, vx: a.vx, vy: a.vy, vz: a.vz, yaw: a.yaw, pitch: a.pitch, mode: a.mode, flags,
      weapon, item: slot && slot.kind === "item" ? slot.item : null, rarity: slot && slot.kind === "weapon" ? slot.rarity : 0,
    };
  }

  private selfOf(a: Actor): SelfView {
    const slot = a.slots[a.selected];
    let spread = 0;
    let reloadT = -1;
    let chargeT = -1;
    if (slot && slot.kind === "weapon") {
      const stt = weaponStats(slot.weapon, slot.rarity);
      spread = currentSpread(a, stt);
      if (a.reloadEnd >= 0) reloadT = clamp((this.time - a.reloadStart) / Math.max(0.01, a.reloadEnd - a.reloadStart), 0, 1);
      if (a.chargeEnd >= 0) chargeT = clamp((this.time - a.chargeStart) / Math.max(0.01, a.chargeEnd - a.chargeStart), 0, 1);
    }
    const sup = this.world.support(a.x, a.z, 0.4, a.y + 0.5);
    const alt = a.y - Math.max(sup, 0);
    return {
      id: a.id, alive: a.alive, health: a.health, aegis: a.aegis, reserve: a.reserve, energy: a.energy,
      slots: a.slots.map((s): Slot => (s ? { ...s } : null)), selected: a.selected, ammo: { ...a.ammo },
      reloadT, useT: a.useItem ? clamp((this.time - a.useStart) / Math.max(0.01, a.useEnd - a.useStart), 0, 1) : -1, chargeT,
      recoilPitch: a.recoilP, recoilYaw: a.recoilY, spread,
      kills: a.stats.kills, assists: a.stats.assists, damage: a.stats.damage, inStorm: a.inStorm,
      canDeploy: a.mode === Mode.Freefall || (a.mode === Mode.Air && alt >= MOVE.redeployClearance),
      canJump: a.mode === Mode.Skiff && this.canJump, altitude: alt, marker: a.marker,
      grappleTarget: a.mode === Mode.Grapple ? { x: a.grx, y: a.gry, z: a.grz } : null, hazard: a.inHazard,
    };
  }

  /** Builds the interest-filtered snapshot for one connected client. */
  snapshotFor(viewerId: number): Snapshot {
    const viewer = this.actors[viewerId] ?? this.actors[0]!;
    let target = viewer;
    let spectating = false;
    if (!viewer.alive) {
      spectating = true;
      let t: Actor | undefined = this.actors[viewer.spectate];
      if (!t || !t.alive) {
        t = this.phase === "ended" ? this.actors[this.winnerId] : this.actors.find((o) => o.alive && !o.dummy);
        if (t) viewer.spectate = t.id;
      }
      if (t) target = t;
    }
    const actors: ActorView[] = [];
    for (const a of this.actors) {
      if (a.mode === Mode.Skiff) continue;
      if (!a.alive && this.time - a.deathTime > 6 && !a.dummy) continue;
      if (a !== target && !inInterest(target.x, target.z, a.x, a.z, INTEREST_RADIUS)) continue;
      const v = this.viewOf(a);
      if (!a.alive) v.mode = Mode.Dead;
      actors.push(v);
    }
    const loot = [];
    for (const l of this.loot.values()) {
      if (!inInterest(target.x, target.z, l.x, l.z, LOOT_INTEREST_RADIUS)) continue;
      loot.push({ id: l.id, x: l.x, y: l.y, z: l.z, kind: l.kind, weapon: l.weapon, rarity: l.rarity, item: l.item, ammo: l.ammo, count: l.count, mag: l.mag });
    }
    const chests: ChestView[] = [];
    for (const c of this.chests) {
      if (!inInterest(target.x, target.z, c.x, c.z, 140)) continue;
      if (c.kind === "cache" && c.open) continue;
      chests.push({ id: c.id, x: c.x, y: c.y, z: c.z, yaw: c.yaw, kind: c.kind, open: c.open });
    }
    // falling supply capsules are globally visible by design
    for (const c of this.capsules) chests.push({ id: c.id, x: c.x, y: c.y, z: c.z, yaw: 0, kind: "capsule", open: false });
    const s = this.skiff;
    const cv = this.caravan;
    const snap: Snapshot = {
      tick: this.tick, time: this.time, phase: this.phase, phaseTimer: this.phaseTimer, viewId: target.id, spectating,
      you: this.selfOf(target), actors, loot, chests,
      projectiles: this.projectiles.filter((p) => inInterest(target.x, target.z, p.x, p.z, INTEREST_RADIUS)).map((p) => ({ id: p.id, kind: p.kind, x: p.x, y: p.y, z: p.z })),
      mists: this.mists.filter((mi) => inInterest(target.x, target.z, mi.x, mi.z, INTEREST_RADIUS)).map((mi) => ({ x: mi.x, y: mi.y, z: mi.z, r: mi.r, age: this.time - mi.born })),
      storm: this.storm.view(), alive: this.aliveCount,
      skiff: { x: s.x, y: s.y, z: s.z, yaw: s.yaw, active: s.active },
      caravan: cv && !cv.gone && inInterest(target.x, target.z, cv.x, cv.z, INTEREST_RADIUS) ? { x: cv.x, y: cv.y, z: cv.z, alive: cv.alive, shield: cv.shield } : null,
      focus: viewer.alive ? this.focusCache : null,
      events: filterEvents(this.events, viewerId, target, this.actors),
    };
    return snap;
  }

  /** Call once per tick after all snapshots are built. */
  flushEvents(): void {
    this.events.length = 0;
  }

  results(): MatchResults {
    const rows = this.actors
      .filter((a) => !a.dummy)
      .map((a) => ({ id: a.id, name: a.name, bot: a.bot, placement: a.placement || 1, kills: a.stats.kills, assists: a.stats.assists, damage: Math.round(a.stats.damage), survival: a.stats.survival }))
      .sort((p, q) => p.placement - q.placement);
    const w = this.actors[this.winnerId];
    const h = this.humanId >= 0 ? this.actors[this.humanId]! : null;
    return {
      winnerId: this.winnerId, winnerName: w ? w.name : "", duration: this.endedAt - this.activeStart, rows,
      you: h && {
        placement: h.placement || (h.alive ? 1 : this.aliveCount + 1), kills: h.stats.kills, assists: h.stats.assists, damage: Math.round(h.stats.damage),
        damageTaken: Math.round(h.stats.damageTaken), shots: h.stats.shots, hits: h.stats.hits, headshots: h.stats.headshots,
        survival: h.alive ? this.time - this.activeStart : h.stats.survival, distance: Math.round(h.stats.distance), stormDamage: Math.round(h.stats.stormDamage),
        loot: h.stats.loot.slice(-40), timeline: h.stats.timeline, route: h.stats.route,
      },
    };
  }
}
