import { angleTo, dist, inCone, inLine, angleDiff } from "../core/math";
import { Rng, mixSeed } from "../core/rng";
import { ENEMY_BY_ID, ELITE_BY_ID, enemyDmg, enemyHp, enemyXp } from "../data/enemies";
import { BASE_BY_ID, BELT_STACK_MAX, GLYPH_BY_ID, GLYPHS, POTION_INFO, type PotionKind } from "../data/items";
import { SKILL_BY_ID, basicSkill } from "../data/skills";
import type { ClassId, DamageType, EquipSlot, StatBlock } from "../data/types";
import { EQUIP_SLOTS } from "../data/types";
import { canAddSocket, generateGlyph, generateItem, identifyCost, repairCost, rerollAffix, rerollCost, socketCost } from "../items/generate";
import { Grid } from "../items/inventory";
import { cloneItem, itemName, itemValue, salvageYield, type Item } from "../items/item";
import { addXp, type CharacterData, type ZoneState, type AttrId, newCharacter } from "../progression/character";
import { QUEST_BY_ID } from "../progression/quests";
import { assignHotbar, rankUp, respec } from "../progression/skilltree";
import { computeStats, type DerivedStats } from "../progression/stats";
import { WAYPOINTS, generateZone } from "../world";
import type { ZoneData, ZoneId } from "../world/types";
import { assignSlots, updateEnemy } from "./ai";
import { BOSS_DEFS, newBossState, updateBoss } from "./boss";
import { alertEnemy, applyStatus, damagePlayer, dealToEnemy, hasStatus, healPlayer, playerHit, removeStatus, updateStatuses } from "./combat";
import { circleFree, lineClear, nearestOpen, type NavGrid } from "./nav";
import { emptyIntents, updatePlayer, updatePlayerProjectileHits, type Intents } from "./player";
import { DT, type Enemy, type GameEvent, type GroundZone, type HazardRT, type InteractRT, type Pickup, type Player, type Projectile, type Telegraph } from "./types";

export interface GameSettings {
  autoPickup: boolean;
  attackWithoutMove: boolean;
}

export interface Telemetry { counters: Record<string, number>; log: { t: number; ev: string; data?: any }[] }

const ITEM_CAP_LEVEL = 30;

export class Game {
  ch: CharacterData;
  stats!: DerivedStats;
  statsDirty = true;
  settings: GameSettings;
  zone!: ZoneData;
  nav!: NavGrid;
  zoneState!: ZoneState;
  explored!: Uint8Array;
  player!: Player;
  enemies: Enemy[] = [];
  projectiles: Projectile[] = [];
  zones: GroundZone[] = [];
  telegraphs: Telegraph[] = [];
  pickups: Pickup[] = [];
  interactables: InteractRT[] = [];
  hazards: HazardRT[] = [];
  events: GameEvent[] = [];
  tick = 0;
  time = 0;
  lootRng: Rng;
  combatRng: Rng;
  nextId = 1;
  arena: { x: number; y: number; r: number } | null = null;
  activeBoss: number | null = null;
  pendingZone: { id: ZoneId; entry: string; pos?: { x: number; y: number } } | null = null;
  returnPortal: { zone: ZoneId; x: number; y: number } | null = null;
  vendorStock: Item[] = [];
  vendorVisit = -1;
  training = { start: 0, total: 0, last: 0, bySkill: {} as Record<string, number> };
  hunter = { state: "idle" as "idle" | "active" | "cleared", wave: 0 };
  hunt: { boss: string; t0: number } | null = null;
  telemetry: Telemetry = { counters: {}, log: [] };
  pendingSummary = false;
  deathInfo: { cause: string; type: DamageType } | null = null;
  private buffSig = "";
  private uidNext: () => number;

  constructor(ch: CharacterData, settings: GameSettings = { autoPickup: true, attackWithoutMove: false }) {
    this.ch = ch;
    this.settings = settings;
    this.uidNext = () => this.ch.uidCounter++;
    this.lootRng = Rng.from(this.runSeed(), "loot");
    const saved = (ch as any).lootState as [number, number, number, number] | undefined;
    if (saved) this.lootRng.setState(saved);
    this.combatRng = Rng.from(this.runSeed(), "combat", 0);
    this.recomputeStats();
  }

  static create(name: string, cls: ClassId, seed: number, now = Date.now()) {
    return new Game(newCharacter(name, cls, { body: 0, voice: 0, tint: 0 }, seed, now));
  }

  runSeed() {
    return mixSeed(this.ch.seed, this.ch.expedition, this.ch.difficulty);
  }

  emit(ev: GameEvent) {
    this.events.push(ev);
    if (this.events.length > 600) this.events.splice(0, 200);
  }
  drain(): GameEvent[] {
    const e = this.events;
    this.events = [];
    return e;
  }
  count(k: string, n = 1) {
    this.telemetry.counters[k] = (this.telemetry.counters[k] ?? 0) + n;
  }

  // ───────────────────────── stats ─────────────────────────
  recomputeStats() {
    const p = this.player;
    const extra: StatBlock = {};
    if (p) {
      if (hasStatus(p, "blessing")) extra.maxHealthPct = 8;
      if (hasStatus(p, "standard")) extra.armorPct = 40;
    }
    const ratioH = p ? p.hp / p.maxHp : 1;
    const ratioF = p ? p.focus / p.maxFocus : 1;
    this.stats = computeStats(this.ch, extra, this.ch.difficulty === "veteran");
    if (p) {
      p.maxHp = this.stats.maxHealth;
      p.maxFocus = this.stats.maxFocus;
      if (p.alive) { p.hp = Math.max(1, Math.min(p.maxHp, Math.round(ratioH * p.maxHp))); p.focus = Math.min(p.maxFocus, ratioF * p.maxFocus); }
      p.marksMax = 3 + (this.ch.ranks.keen_trail ?? 0);
      p.evadeCharges = Math.min(p.evadeCharges, this.stats.evadeCharges);
    }
    this.statsDirty = false;
  }

  // ───────────────────────── zones ─────────────────────────
  requestZone(id: ZoneId, entry: string, pos?: { x: number; y: number }) {
    this.pendingZone = { id, entry, pos };
  }

  /** Synchronous zone resolution (tests and fallback when workers are unavailable). */
  resolvePendingZoneSync() {
    if (!this.pendingZone) return;
    const pz = this.pendingZone;
    this.loadZone(generateZone(pz.id, this.zoneSeed(pz.id), this.ch.difficulty), pz.entry, pz.pos);
  }

  zoneSeed(id: ZoneId): number {
    if (id === "hunt_toll" || id === "hunt_engine") return mixSeed(this.runSeed(), "hunt", this.ch.stats.huntBest[`count_${id}`] ?? 0);
    return this.runSeed();
  }

  loadZone(z: ZoneData, entry: string, pos?: { x: number; y: number }) {
    this.saveZoneState();
    this.pendingZone = null;
    this.zone = z;
    this.nav = { w: z.w, h: z.h, cells: z.cells.slice() };
    const zs = (this.ch.zoneStates[z.id] ??= { killed: [], opened: [], explored: "" });
    if (z.id === "hunt_toll" || z.id === "hunt_engine" || z.id === "training") { zs.killed = []; zs.opened = []; }
    this.zoneState = zs;
    this.explored = decodeExplored(zs.explored, z.w * z.h);
    this.enemies = []; this.projectiles = []; this.zones = []; this.telegraphs = []; this.pickups = []; this.hazards = [];
    this.arena = null; this.activeBoss = null;
    this.combatRng = Rng.from(this.runSeed(), "combat", z.id, this.tick);
    // player
    const start = pos ?? z.entries[entry] ?? z.entries.start;
    const sp = nearestOpen(this.nav, start.x, start.y, 6) ?? start;
    if (!this.player) this.player = this.makePlayer(sp.x, sp.y);
    else { this.player.x = this.player.px = sp.x; this.player.y = this.player.py = sp.y; this.player.path = null; this.player.action = null; this.player.attackTarget = null; this.player.pendingInteract = null; }
    // interactables
    this.interactables = z.interactables.map((d) => ({ id: d.id, kind: d.kind, x: d.x, y: d.y, name: d.name, data: d.data ?? {}, open: zs.opened.includes(d.id), hidden: false, fuse: 0 }));
    for (const it of this.interactables) {
      if (it.kind === "gate" && it.open) this.setCells(it.data.cells, 2);
      if (it.kind === "npc" && it.data.requires === "artificer_rescued") it.hidden = !this.ch.flags.artificer_rescued;
      if (it.kind === "hunt_portal") it.hidden = !this.ch.actComplete.normal && !this.ch.actComplete.veteran;
      if (it.kind === "cage" && this.ch.flags.artificer_rescued) it.open = true;
      if (it.kind === "dummy_spawner" && it.data.dummy) { this.spawnEnemy("training_dummy", it.x, it.y, 1, [], -1); it.hidden = true; }
    }
    if (z.id === "refuge" && this.returnPortal) {
      this.interactables.push({ id: 9000, kind: "portal", x: 25.5, y: 25.5, name: "Return Portal", data: { ...this.returnPortal }, open: false, hidden: false, fuse: 0 });
    }
    // hazards
    this.hazards = z.hazards.map((h) => ({ ...h, state: "idle", t: 0 }));
    // enemies
    for (const pk of z.packs) {
      if (zs.killed.includes(pk.id)) continue;
      const n = pk.members.length;
      pk.members.forEach((m, i) => {
        const a = (i / Math.max(1, n)) * Math.PI * 2 + pk.id;
        const r = n === 1 ? 0 : 1.4 + (i % 3) * 0.6;
        let x = pk.x + Math.cos(a) * r, y = pk.y + Math.sin(a) * r;
        const o = nearestOpen(this.nav, x, y, 3) ?? { x: pk.x, y: pk.y };
        x = o.x; y = o.y;
        if (dist(x, y, sp.x, sp.y) < 4 && !m.boss) return; // never spawn within 4 m of the player
        const e = this.spawnEnemy(m.enemy, x, y, pk.level, m.elite ?? [], pk.id, pk.kind === "guardian");
        if (e && pk.kind === "boss") e.home = { x: pk.x, y: pk.y };
      });
    }
    // echo
    if (this.ch.echo && this.ch.echo.zone === z.id) this.pickups.push({ id: this.nextId++, kind: "echo", x: this.ch.echo.x, y: this.ch.echo.y, amount: this.ch.echo.gold, t: 0 });
    if (z.id === "training") this.training = { start: this.time, total: 0, last: this.time, bySkill: {} };
    if (z.id !== "hunt_toll" && z.id !== "hunt_engine") this.hunt = null;
    else this.hunt = { boss: z.meta.hunt, t0: this.time };
    this.onEnterZone(z.id);
    this.emit({ t: "zone", id: z.id, name: z.name });
    this.reveal();
  }

  private saveZoneState() {
    if (!this.zone || !this.zoneState) return;
    this.zoneState.explored = encodeExplored(this.explored);
  }

  private makePlayer(x: number, y: number): Player {
    const st = this.stats;
    return {
      id: 0, team: 0, kind: "player", x, y, px: x, py: y, facing: 0, radius: 0.45, hp: st.maxHealth, maxHp: st.maxHealth, alive: true, statuses: {},
      anim: "idle", animT: 0, flash: 0, hitstop: 0, deadT: 0, focus: st.maxFocus * 0.5, maxFocus: st.maxFocus, heat: 0, marksMax: 3 + (this.ch.ranks.keen_trail ?? 0),
      evadeCharges: st.evadeCharges, evadeT: 0, action: null, path: null, moveTarget: null, attackTarget: null, pendingInteract: null, combo: 0, comboT: 0,
      movedSinceShot: 0, stillT: 0, cds: {}, charges: {}, potionCd: 0, hot: null, furnace: false, lastHitT: -99, basicCount: 0, lastDamage: null, relicCd: 0, standing: false,
    };
  }

  setCells(cells: [number, number][], v: number) {
    for (const [x, y] of cells) this.nav.cells[y * this.nav.w + x] = v;
  }

  reveal() {
    const p = this.player;
    const R = 13;
    const w = this.zone.w, h = this.zone.h;
    for (let y = Math.max(0, Math.floor(p.y - R)); y <= Math.min(h - 1, Math.ceil(p.y + R)); y++)
      for (let x = Math.max(0, Math.floor(p.x - R)); x <= Math.min(w - 1, Math.ceil(p.x + R)); x++)
        if ((x - p.x) ** 2 + (y - p.y) ** 2 < R * R) this.explored[y * w + x] = 1;
  }

  // ───────────────────────── entities ─────────────────────────
  spawnEnemy(defId: string, x: number, y: number, level: number, elite: string[], packId: number, guardian = false): Enemy | null {
    const def = ENEMY_BY_ID[defId] ?? BOSS_DEFS[defId];
    if (!def) return null;
    const vet = this.ch.difficulty === "veteran";
    const isBoss = defId === "tollkeeper" || defId === "engine";
    const isElite = elite.length > 0;
    let hp = enemyHp(def.hp, level) * (isElite ? (vet ? 3.6 : 3) : 1) * (guardian ? 1.4 : 1);
    if (def.behavior === "dummy" && defId === "training_dummy") hp = 99999;
    const dmg = enemyDmg(def.dmg, level) * (isElite ? 1.3 : 1) * (vet ? 1.15 : 1);
    const resBonus = vet ? 15 : 0;
    const e: Enemy = {
      id: this.nextId++, team: 1, kind: "enemy", def, name: (guardian ? "Guardian " : "") + def.name, level, elite, isElite: isElite || guardian, isBoss, guardian, packId,
      x, y, px: x, py: y, facing: Math.PI / 2, radius: def.radius, hp: Math.round(hp), maxHp: Math.round(hp), alive: true, statuses: {},
      anim: "idle", animT: 0, flash: 0, hitstop: 0, deadT: 0,
      ai: "dormant", aiT: 0, aware: false, lastKnown: null, lostT: 0, path: null, pathT: 0, attack: null, atkAngle: 0, atkX: 0, atkY: 0, telegraphId: 0,
      cds: {}, speed: def.speed * (vet ? 1.08 : 1), armor: def.armor * (1 + level * 0.15), res: { physical: def.res.physical ?? 0, ember: (def.res.ember ?? 0) + resBonus, frost: (def.res.frost ?? 0) + resBonus, blight: (def.res.blight ?? 0) + resBonus },
      dmg, xp: enemyXp(def.xp, level) * (isElite ? 3 : 1) * (guardian ? 1.5 : 1), heavy: false, slotted: false, home: { x, y }, modT: {}, split: false,
      training: this.zone?.safe === true || this.zone?.id === "training", summoned: false, role: "normal", dmgTaken: 0, perceiveT: (this.nextId % 8) * 0.03, sees: false, fleeT: 0, strafe: this.nextId % 2 ? 1 : -1, dummyRegenT: 0,
    };
    if (isBoss) e.boss = newBossState(defId as any, e);
    if (defId === "conduit") e.ai = "approach";
    // stagger initial cooldowns so packs don't fire in unison
    for (const a of def.attacks) e.cds[a.id] = this.combatRng.range(0.3, 1.4);
    this.enemies.push(e);
    return e;
  }

  enemyById(id: number): Enemy | undefined {
    for (const e of this.enemies) if (e.id === id) return e;
    return undefined;
  }

  heavyCount() {
    let n = 0;
    for (const e of this.enemies) if (e.alive && e.heavy) n++;
    return n;
  }

  alertPack(e: Enemy) {
    alertEnemy(this, e);
  }

  splitSwarm(e: Enemy) {
    e.split = true;
    const hp = Math.round(e.hp / 2);
    e.hp = hp; e.maxHp = Math.max(hp, Math.round(e.maxHp / 2));
    e.radius *= 0.8;
    const o = this.spawnEnemy(e.def.id, e.x + 0.8, e.y + 0.3, e.level, [], e.packId);
    if (o) { o.split = true; o.hp = hp; o.maxHp = e.maxHp; o.radius = e.radius; o.aware = true; o.ai = "approach"; o.xp = Math.round(e.xp / 2); e.xp = Math.round(e.xp / 2); }
    this.emit({ t: "vfx", kind: "split", x: e.x, y: e.y, type: "physical" });
  }

  tryMove(a: { x: number; y: number; radius: number }, dx: number, dy: number) {
    const r = a.radius * 0.85;
    if (circleFree(this.nav, a.x + dx, a.y + dy, r)) { a.x += dx; a.y += dy; }
    else if (circleFree(this.nav, a.x + dx, a.y, r)) a.x += dx;
    else if (circleFree(this.nav, a.x, a.y + dy, r)) a.y += dy;
  }

  pushActor(a: { x: number; y: number; radius: number }, dx: number, dy: number) {
    const steps = 4;
    for (let i = 0; i < steps; i++) this.tryMove(a, dx / steps, dy / steps);
  }

  castClamp(x: number, y: number, ang: number, d: number) {
    const c = Math.cos(ang), s = Math.sin(ang);
    let best = { x, y };
    for (let t = 0.25; t <= d + 0.001; t += 0.25) {
      const nx = x + c * t, ny = y + s * t;
      if (!circleFree(this.nav, nx, ny, 0.35)) break;
      if (this.arena && dist(nx, ny, this.arena.x, this.arena.y) > this.arena.r - 0.6) break;
      best = { x: nx, y: ny };
    }
    return best;
  }

  addProjectile(p: Omit<Projectile, "id" | "px" | "py" | "hit">) {
    this.projectiles.push({ ...p, id: this.nextId++, px: p.x, py: p.y, hit: [] });
  }

  addZone(z: Omit<GroundZone, "id" | "t" | "tickT" | "triggered" | "angle" | "len" | "width" | "arm"> & Partial<Pick<GroundZone, "angle" | "len" | "width" | "arm">>): number {
    const id = this.nextId++;
    this.zones.push({ angle: 0, len: 0, width: 0, arm: 0, ...z, id, t: 0, tickT: 0, triggered: false });
    return id;
  }

  addTelegraph(t: Omit<Telegraph, "id" | "t">): number {
    const id = this.nextId++;
    this.telegraphs.push({ ...t, id, t: 0 });
    return id;
  }

  updateTelegraph(id: number, x: number, y: number, angle: number, tx?: number, ty?: number) {
    const t = this.telegraphs.find((q) => q.id === id);
    if (!t) return;
    if (tx !== undefined && ty !== undefined) { t.x = tx; t.y = ty; }
    else { t.x = x; t.y = y; }
    t.angle = angle;
  }

  upsertBeamTelegraph(e: Enemy, tag: string, angle: number, len: number, warm: boolean) {
    let t = this.telegraphs.find((q) => q.owner === e.id && q.tag === tag);
    if (!t) { this.addTelegraph({ shape: "line", x: e.x, y: e.y, angle, r: 0, r2: 0, arc: 0, len, width: 1.4, dur: 999, type: "ember", owner: e.id, tag, warm }); return; }
    t.angle = angle; t.warm = warm; t.t = warm ? Math.min(t.t, 0.5) : 0.99 * t.dur;
  }

  clearTelegraphs(owner: number, tag?: string) {
    this.telegraphs = this.telegraphs.filter((t) => !(t.owner === owner && (tag === undefined || t.tag === tag)));
  }

  emberBurst(x: number, y: number, r: number, coeff: number, src: string) {
    for (const e of this.enemies) if (e.alive && dist(e.x, e.y, x, y) < r + e.radius) playerHit(this, e, coeff, "cinder_ring", { dmgType: "ember", ailment: { type: "burn", chance: 0.5 } });
    this.emit({ t: "vfx", kind: "eruption", x, y, r, type: "ember" });
    this.emit({ t: "sfx", id: "sfx_eruption", x, y });
    this.igniteBraziersNear(x, y, r);
  }

  igniteBraziersInCone(x: number, y: number, ang: number, r: number) {
    for (const it of this.interactables) if (it.kind === "explosive" && !it.open && it.fuse <= 0 && inCone(x, y, ang, Math.PI / 2, r + 0.6, it.x, it.y, 0.5)) this.lightFuse(it);
  }
  igniteBraziersNear(x: number, y: number, r: number) {
    for (const it of this.interactables) if (it.kind === "explosive" && !it.open && it.fuse <= 0 && dist(x, y, it.x, it.y) < r + 0.5) this.lightFuse(it);
  }
  lightFuse(it: InteractRT) {
    it.fuse = 1.2;
    this.addTelegraph({ shape: "circle", x: it.x, y: it.y, angle: 0, r: 3.6, r2: 0, arc: 0, len: 0, width: 0, dur: 1.2, type: "ember", owner: -it.id - 10000 });
    this.emit({ t: "sfx", id: "sfx_fuse", x: it.x, y: it.y });
  }

  // ───────────────────────── tick ─────────────────────────
  step(inp: Intents = emptyIntents()) {
    if (this.pendingZone) return;
    this.tick++;
    this.time += DT;
    const p = this.player;
    if (this.statsDirty) this.recomputeStats();
    const sig = `${hasStatus(p, "blessing")}${hasStatus(p, "standard")}`;
    if (sig !== this.buffSig) { this.buffSig = sig; this.recomputeStats(); }

    if (p.alive) {
      updateStatuses(this, p, DT);
      updatePlayer(this, inp, DT);
      if (this.arena) {
        const a = this.arena;
        const d = dist(p.x, p.y, a.x, a.y);
        if (d > a.r - 0.5) { p.x = a.x + ((p.x - a.x) / d) * (a.r - 0.5); p.y = a.y + ((p.y - a.y) / d) * (a.r - 0.5); }
      }
    } else {
      p.deadT += DT;
      p.anim = "dead";
    }
    if (this.tick % 15 === 0) assignSlots(this);
    for (const e of this.enemies) {
      if (!e.alive) { e.deadT += DT; continue; }
      updateStatuses(this, e, DT);
      if (!e.alive) continue;
      // distant dormant AI updates at reduced frequency without changing combat results
      const far = !e.aware && dist(e.x, e.y, p.x, p.y) > 35;
      if (far && (this.tick + e.id) % 4 !== 0) { e.px = e.x; e.py = e.y; continue; }
      if (e.boss || e.role === "repair" || e.role === "conduit") { e.px = e.x; e.py = e.y; if (e.boss) updateBoss(this, e, DT); continue; }
      updateEnemy(this, e, DT);
      e.flash = Math.max(0, e.flash - DT);
    }
    for (const e of this.enemies) if (e.boss || e.role !== "normal") e.flash = Math.max(0, e.flash - DT);
    this.separate();
    this.updateProjectiles();
    this.updateZones();
    this.updateHazards();
    this.updateInteractables();
    this.updatePickups();
    for (const t of this.telegraphs) t.t += DT;
    this.telegraphs = this.telegraphs.filter((t) => t.t < t.dur);
    p.flash = Math.max(0, p.flash - DT);
    // corpses fade after loot resolution
    if (this.tick % 30 === 0) this.enemies = this.enemies.filter((e) => e.alive || e.deadT < 4);
    if (this.tick % 10 === 0) this.reveal();
    if (this.tick % 30 === 0) this.ch.stats.playTime += 1;
    if (this.ch.blessing > 0 && p.alive) { this.ch.blessing -= DT; if (this.ch.blessing <= 0) removeStatus(p, "blessing"); }
  }

  /** Crowd separation: actors push apart; evading players phase through small enemies. */
  private separate() {
    const list: { x: number; y: number; radius: number; team: number; alive: boolean; heavy?: boolean; id: number; isBoss?: boolean }[] = [];
    const p = this.player;
    if (p.alive) list.push(p);
    for (const e of this.enemies) if (e.alive && e.def.behavior !== "dummy" && e.role !== "conduit") list.push(e);
    const phasing = p.action?.kind === "evade";
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      for (let j = i + 1; j < list.length; j++) {
        const b = list[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const rr = a.radius + b.radius;
        const d2 = dx * dx + dy * dy;
        if (d2 >= rr * rr || d2 < 1e-6) continue;
        if (phasing && (a === p || b === p) && Math.min(a.radius, b.radius) <= 0.55 && (a === p ? b : a).radius <= 0.55) continue;
        const d = Math.sqrt(d2);
        const push = (rr - d) / 2;
        const nx = dx / d, ny = dy / d;
        const wa = (a as any).isBoss ? 0 : b === p ? 0.7 : a === p ? 0.3 : 0.5;
        const wb = (b as any).isBoss ? 0 : 1 - wa;
        this.tryMove(a, -nx * push * wa * 2, -ny * push * wa * 2);
        this.tryMove(b, nx * push * wb * 2, ny * push * wb * 2);
      }
    }
  }

  private updateProjectiles() {
    const p = this.player;
    for (const pr of this.projectiles) {
      pr.px = pr.x; pr.py = pr.y;
      pr.x += pr.vx * DT; pr.y += pr.vy * DT;
      pr.life -= DT;
      if (!lineClear(this.nav, pr.px, pr.py, pr.x, pr.y) && pr.kind !== "wave") {
        // allow flying over pits
        const cx = Math.floor(pr.x), cy = Math.floor(pr.y);
        const c = this.nav.cells[cy * this.nav.w + cx];
        if (c !== 3) { pr.life = 0; this.emit({ t: "vfx", kind: "spark", x: pr.x, y: pr.y, type: pr.dmgType }); }
      }
      if (pr.team === 0) {
        for (const it of this.interactables) if (it.kind === "explosive" && !it.open && it.fuse <= 0 && dist(pr.x, pr.y, it.x, it.y) < 0.8) { this.lightFuse(it); }
      }
    }
    updatePlayerProjectileHits(this);
    for (const pr of this.projectiles) {
      if (pr.team !== 1 || pr.life <= 0 || !p.alive) continue;
      const segD = distSeg(p.x, p.y, pr.px, pr.py, pr.x, pr.y);
      if (segD <= p.radius + pr.radius) {
        pr.life = 0;
        const src = this.enemyById(pr.source) ?? null;
        if (pr.kind === "hook") {
          const e = src;
          if (e && e.alive) {
            const an = angleTo(e.x, e.y, p.x, p.y);
            p.pulled = undefined;
            const tx = e.x + Math.cos(an) * (e.radius + 1.3), ty = e.y + Math.sin(an) * (e.radius + 1.3);
            p.action = { kind: "leap", t: 0, dur: 0.3, fx: p.x, fy: p.y, tx, ty };
            damagePlayer(this, pr.dmg, "physical", e, { label: `${e.name} — Hook`, ailment: { type: "slow", chance: 1 } });
            this.emit({ t: "vfx", kind: "chainhit", x: p.x, y: p.y, x2: e.x, y2: e.y, type: "physical" });
          }
        } else damagePlayer(this, pr.dmg, pr.dmgType, src, { label: src ? `${src.name} — ${pr.reflected ? "Reflected shot" : "Shot"}` : "Projectile" });
      }
    }
    this.projectiles = this.projectiles.filter((q) => q.life > 0);
  }

  private updateZones() {
    const p = this.player;
    for (const z of this.zones) {
      z.t += DT;
      const armed = z.t >= z.arm;
      switch (z.kind) {
        case "fire":
        case "blight_cloud":
        case "quadrant": {
          if (!armed) break;
          z.tickT += DT;
          if (z.tickT >= 0.5) {
            z.tickT -= 0.5;
            const inside = z.kind === "quadrant"
              ? dist(p.x, p.y, z.x, z.y) < z.r && Math.abs(angleDiff(z.angle, angleTo(z.x, z.y, p.x, p.y))) <= Math.PI / 4
              : dist(p.x, p.y, z.x, z.y) < z.r + p.radius * 0.5;
            if (inside) {
              const src = this.enemyById(z.source) ?? null;
              damagePlayer(this, z.dps * 0.5, z.dmgType, null, { label: z.data.label ?? (src ? `${src.name} — ${z.kind === "fire" ? "Ember Wake" : "Censer Smoke"}` : "Hazard"), unblockable: true });
            }
          }
          break;
        }
        case "pulse": {
          if (armed && !z.triggered) {
            z.triggered = true;
            const src = this.enemyById(z.source);
            if (src && src.alive && dist(p.x, p.y, src.x, src.y) < z.r + p.radius) damagePlayer(this, z.data.dmg, "frost", src, { label: z.data.label, ailment: { type: "chill", chance: 1 } });
            this.emit({ t: "vfx", kind: "nova", x: src?.x ?? z.x, y: src?.y ?? z.y, r: z.r, type: "frost" });
          }
          break;
        }
        case "ring":
        case "eruption": {
          if (armed && !z.triggered) {
            z.triggered = true;
            for (const e of this.enemies) if (e.alive && dist(e.x, e.y, z.x, z.y) < z.r + e.radius) playerHit(this, e, z.data.coeff, z.data.skill === "starfall" ? "iron_litany" : z.data.skill, { dmgType: z.dmgType, ailment: z.dmgType === "ember" ? { type: "burn", chance: 0.6 } : { type: "chill", chance: 0.5 }, heavy: true });
            this.igniteBraziersNear(z.x, z.y, z.r);
            this.emit({ t: "vfx", kind: z.kind === "ring" ? "eruption" : "starfall", x: z.x, y: z.y, r: z.r, type: z.dmgType });
            this.emit({ t: "sfx", id: "sfx_eruption", x: z.x, y: z.y });
            this.emit({ t: "shake", amp: 0.15, dur: 0.2, src: "player" });
          }
          break;
        }
        case "ember_trail":
        case "blight_pool": {
          z.tickT += DT;
          if (z.tickT >= 0.5) {
            z.tickT -= 0.5;
            for (const e of this.enemies) if (e.alive && dist(e.x, e.y, z.x, z.y) < z.r + e.radius * 0.5) playerHit(this, e, z.data.coeff, z.kind === "blight_pool" ? "backstep_flask" : "iron_litany", { dmgType: z.dmgType, noCrit: true, ailment: z.kind === "blight_pool" ? { type: "blight", chance: 0.3 } : { type: "burn", chance: 0.3 } });
          }
          break;
        }
        case "trap": {
          if (!armed || z.triggered) break;
          const victim = this.enemies.find((e) => e.alive && e.def.behavior !== "dummy" && dist(e.x, e.y, z.x, z.y) < z.r + e.radius) ?? this.enemies.find((e) => e.alive && e.def.behavior === "dummy" && dist(e.x, e.y, z.x, z.y) < z.r + e.radius);
          if (victim) {
            z.triggered = true; z.dur = z.t + 0.4;
            for (const e of this.enemies) {
              if (!e.alive || dist(e.x, e.y, z.x, z.y) > 2.2 + e.radius) continue;
              const rooted = hasStatus(e, "root");
              playerHit(this, e, z.data.coeff * (rooted && this.ch.ranks.patient_hunter ? 2 : 1), "snare_bloom", { ailment: { type: "root", chance: 1 }, heavy: true });
            }
            if (this.stats.relics.has("snarewood")) this.addZone({ team: 0, kind: "blight_pool", x: z.x, y: z.y, r: 2.2, dur: 3, dps: 0, dmgType: "blight", source: 0, data: { coeff: 0.3 } });
            this.emit({ t: "vfx", kind: "snare", x: z.x, y: z.y, r: 2.2, type: "blight" });
            this.emit({ t: "sfx", id: "sfx_trap_snap", x: z.x, y: z.y });
          }
          break;
        }
        case "standard": {
          if (dist(p.x, p.y, z.x, z.y) < z.r) { applyStatus(p, "standard", 0.3); if (this.ch.classId === "cinder") p.heat = Math.min(100, p.heat + 4 * DT); }
          z.tickT += DT;
          if (z.tickT >= 2) {
            z.tickT -= 2;
            for (const e of this.enemies) {
              if (!e.alive || dist(e.x, e.y, z.x, z.y) > z.r + e.radius) continue;
              playerHit(this, e, z.data.coeff, "ashen_standard", { dmgType: "ember", noCrit: true });
              if (!e.isBoss && !e.isElite && e.def.behavior !== "dummy") {
                const s = applyStatus(e, "taunted", 1.6);
                s.mag = z.x; s.tick = z.y;
                if (e.ai === "telegraph") { this.clearTelegraphs(e.id); e.ai = "approach"; e.heavy = false; }
              }
            }
            this.emit({ t: "vfx", kind: "pulse", x: z.x, y: z.y, r: z.r, type: "player" });
          }
          break;
        }
        case "rain": {
          z.tickT += DT;
          if (z.tickT >= 0.2) {
            z.tickT -= 0.2;
            const prog = Math.min(1, z.t / z.dur);
            const cx = z.x + Math.cos(z.angle) * z.len * prog, cy = z.y + Math.sin(z.angle) * z.len * prog;
            for (const e of this.enemies) if (e.alive && inLine(cx - Math.cos(z.angle) * 1.5, cy - Math.sin(z.angle) * 1.5, z.angle, 3, z.width / 2, e.x, e.y, e.radius)) playerHit(this, e, z.data.coeff, "horizon_call", {});
            this.emit({ t: "vfx", kind: "rain", x: cx, y: cy, r: z.width / 2, type: "physical" });
          }
          break;
        }
      }
    }
    this.zones = this.zones.filter((z) => z.t < z.dur);
  }

  private updateHazards() {
    const p = this.player;
    for (const h of this.hazards) {
      const cyc = (this.time + h.offset) % h.period;
      const warn = h.kind === "spikes" ? 0.7 : 0.8;
      const act = h.kind === "spikes" ? 0.45 : 1.3;
      const st = cyc < warn ? "warn" : cyc < warn + act ? "active" : "idle";
      if (st !== h.state) {
        h.state = st as any;
        if (st === "warn") {
          if (h.kind === "spikes") this.addTelegraph({ shape: "circle", x: h.x, y: h.y, angle: 0, r: 1.3, r2: 0, arc: 0, len: 0, width: 0, dur: warn, type: "physical", owner: -h.id });
          else this.addTelegraph({ shape: "line", x: h.x, y: h.y, angle: h.rot, r: 0, r2: 0, arc: 0, len: 6.5, width: 1.4, dur: warn, type: "ember", owner: -h.id });
          if (dist(p.x, p.y, h.x, h.y) < 12) this.emit({ t: "sfx", id: h.kind === "spikes" ? "sfx_tele_spike" : "sfx_tele_vent", x: h.x, y: h.y, vol: 0.4 });
        }
        if (st === "active") this.emit({ t: "vfx", kind: h.kind === "spikes" ? "spikes" : "vent", x: h.x, y: h.y, angle: h.rot, type: h.kind === "spikes" ? "physical" : "ember" });
      }
      if (h.state === "active" && this.tick % 5 === 0) {
        const hitP = h.kind === "spikes" ? dist(p.x, p.y, h.x, h.y) < 1.3 + p.radius * 0.5 : inLine(h.x, h.y, h.rot, 6.5, 0.7, p.x, p.y, p.radius * 0.5);
        const dmg = (6 + this.zone.level * 2.4) * (h.kind === "spikes" ? 1.4 : 0.6);
        if (hitP) damagePlayer(this, dmg, h.kind === "spikes" ? "physical" : "ember", null, { label: h.kind === "spikes" ? "Spike Trap" : "Flame Vent", unblockable: true });
        for (const e of this.enemies) {
          if (!e.alive || e.isBoss) continue;
          const hit = h.kind === "spikes" ? dist(e.x, e.y, h.x, h.y) < 1.3 : inLine(h.x, h.y, h.rot, 6.5, 0.7, e.x, e.y, e.radius * 0.5);
          if (hit) dealToEnemy(this, e, { [h.kind === "spikes" ? "physical" : "ember"]: dmg * 1.5 }, { source: "trap", fromX: h.x, fromY: h.y });
        }
      }
    }
  }

  private updateInteractables() {
    const p = this.player;
    for (const it of this.interactables) {
      if (it.kind === "explosive" && it.fuse > 0) {
        it.fuse -= DT;
        if (it.fuse <= 0) {
          it.open = true;
          this.zoneState.opened.push(it.id);
          const r = 3.6;
          for (const e of this.enemies) if (e.alive && dist(e.x, e.y, it.x, it.y) < r + e.radius) dealToEnemy(this, e, { ember: 18 + this.zone.level * 9 }, { source: "brazier", fromX: it.x, fromY: it.y, heavy: true });
          if (dist(p.x, p.y, it.x, it.y) < r + p.radius) damagePlayer(this, 10 + this.zone.level * 4, "ember", null, { label: "Volatile Brazier", unblockable: true });
          this.emit({ t: "vfx", kind: "explosion", x: it.x, y: it.y, r, type: "ember" });
          this.emit({ t: "sfx", id: "sfx_explode", x: it.x, y: it.y });
          this.emit({ t: "shake", amp: 0.25, dur: 0.3, src: "env" });
        }
      }
      if (it.kind === "waypoint" && !it.hidden && p.alive && dist(p.x, p.y, it.x, it.y) < 3.2) {
        const wp = it.data.wp as string;
        if (!this.ch.waypoints.includes(wp)) {
          this.ch.waypoints.push(wp);
          this.emit({ t: "toast", text: `Waypoint kindled: ${WAYPOINTS[wp].name}`, kind: "quest" });
          this.emit({ t: "sfx", id: "sfx_waypoint" });
          this.emit({ t: "vfx", kind: "waypoint", x: it.x, y: it.y, type: "player" });
          if (wp === "ashway") this.completeQuest("ashway");
          this.emit({ t: "save" });
        }
        if (this.ch.checkpoint !== wp) { this.ch.checkpoint = wp; }
      }
      if (it.kind === "npc" && it.data.npc === "sela" && this.ch.quests.hunter.status === "inactive" && dist(p.x, p.y, it.x, it.y) < 10) {
        this.ch.quests.hunter = { status: "active", step: 0 };
        this.emit({ t: "toast", text: "New quest: Smoke at the Hunter's Camp", kind: "quest" });
      }
    }
    // vista discovery
    if (this.zone.id === "march" && this.ch.quests.open_archive.status === "active" && this.ch.quests.open_archive.step === 0) {
      const v = this.zone.landmarks.find((l) => l.id === "vista");
      if (v && dist(p.x, p.y, v.x, v.y) < 15) this.questStep("open_archive", 1);
    }
    // hunter event waves
    if (this.hunter.state === "active" && this.zone.id === "march") {
      const waveAlive = this.enemies.some((e) => e.alive && e.packId === -77);
      if (!waveAlive) {
        if (this.hunter.wave >= 3) {
          this.hunter.state = "cleared";
          this.questStep("hunter", 2);
          this.emit({ t: "toast", text: "The camp is safe. Speak with Sela.", kind: "quest" });
        } else this.spawnHunterWave();
      }
    }
  }

  private spawnHunterWave() {
    const c = this.zone.meta.hunterCamp as { x: number; y: number; level: number };
    this.hunter.wave++;
    const types = this.hunter.wave === 3 ? ["mire_hound", "mire_hound", "bell_husk", "ash_crawler", "ash_crawler"] : ["mire_hound", "mire_hound", "ash_crawler", "ash_crawler", "ash_crawler"];
    types.forEach((t, i) => {
      const a = (i / types.length) * Math.PI * 2 + this.hunter.wave;
      const pt = nearestOpen(this.nav, c.x + Math.cos(a) * 8, c.y + Math.sin(a) * 8, 4);
      if (!pt || dist(pt.x, pt.y, this.player.x, this.player.y) < 4) return;
      const e = this.spawnEnemy(t, pt.x, pt.y, c.level, [], -77);
      if (e) { e.aware = true; e.ai = "approach"; e.lastKnown = { x: this.player.x, y: this.player.y }; }
    });
    this.emit({ t: "toast", text: `Wave ${this.hunter.wave} of 3`, kind: "warn" });
  }

  private updatePickups() {
    const p = this.player;
    if (!p.alive) return;
    for (const pk of this.pickups) {
      pk.t += DT;
      const d = dist(p.x, p.y, pk.x, pk.y);
      if (pk.kind === "echo" && d < 1.2) { this.reclaimEcho(pk); continue; }
      if (!this.settings.autoPickup && pk.kind !== "globe") continue;
      if (d > 1.3 || pk.t < 0.35) continue;
      if (pk.kind === "gold") { this.ch.gold += pk.amount; pk.amount = 0; this.emit({ t: "sfx", id: "sfx_gold", vol: 0.5 }); }
      else if (pk.kind === "dust") { this.ch.dust += pk.amount; pk.amount = 0; this.emit({ t: "sfx", id: "sfx_gold", vol: 0.4 }); }
      else if (pk.kind === "globe") { healPlayer(this, p.maxHp * 0.15); pk.amount = 0; this.emit({ t: "sfx", id: "sfx_globe", vol: 0.6 }); }
      else if (pk.kind === "potion" && pk.potion && this.ch.belt[pk.potion] < this.ch.beltCap) { this.ch.belt[pk.potion]++; pk.amount = 0; this.emit({ t: "sfx", id: "sfx_potion_pick", vol: 0.5 }); }
    }
    this.pickups = this.pickups.filter((q) => q.amount > 0 || (q.kind === "item" && q.item));
  }

  private reclaimEcho(pk: Pickup) {
    const gold = pk.amount;
    this.ch.gold += gold;
    this.ch.echo = null;
    this.ch.blessing = 180;
    applyStatus(this.player, "blessing", 180);
    pk.amount = 0;
    this.emit({ t: "toast", text: `Echo reclaimed: ${gold} gold restored, +8% maximum health for 3 minutes`, kind: "info" });
    this.emit({ t: "sfx", id: "sfx_echo" });
    this.emit({ t: "vfx", kind: "heal", x: pk.x, y: pk.y, type: "player" });
  }

  // ───────────────────────── combat outcomes ─────────────────────────
  killEnemy(e: Enemy, silentXp = false) {
    if (!e.alive) return;
    e.alive = false; e.hp = 0; e.ai = "dead"; e.anim = "dead"; e.deadT = 0;
    releaseHeavyAll(e);
    this.clearTelegraphs(e.id);
    this.emit({ t: "death", id: e.id, x: e.x, y: e.y, enemy: e.def.id, boss: e.isBoss, elite: e.isElite });
    this.emit({ t: "sfx", id: e.isBoss ? "sfx_boss_death" : "sfx_death", x: e.x, y: e.y });
    if (e.training || e.def.behavior === "dummy" && e.role !== "conduit") return;
    // XP (level-difference falloff)
    const p = this.player;
    if (!silentXp || e.def.id === "lantern_mite") {
      const diff = this.ch.level - e.level;
      const fall = diff > 5 ? Math.max(0.2, 1 - (diff - 5) * 0.15) : 1;
      const xp = e.xp * fall * (this.ch.difficulty === "veteran" ? 1.4 : 1);
      const lv = addXp(this.ch, xp);
      if (lv > 0) this.onLevelUp();
    }
    this.ch.stats.kills++; this.ch.run.kills++;
    if (e.isElite) this.ch.stats.eliteKills++;
    if (this.stats.raw.healthOnKill) healPlayer(this, this.stats.raw.healthOnKill * (1 + this.ch.level * 0.1), false);
    if (e.summoned && e.role !== "conduit") { this.dropBasic(e, 0.25); return; }
    if (e.role === "conduit") { this.emit({ t: "vfx", kind: "explosion", x: e.x, y: e.y, r: 2, type: "frost" }); return; }
    if (e.isBoss) this.onBossKilled(e);
    else this.dropLoot(e);
    // pack cleared?
    if (e.packId > 0 && !this.enemies.some((o) => o.alive && o.packId === e.packId && !o.summoned)) {
      if (!this.zoneState.killed.includes(e.packId)) this.zoneState.killed.push(e.packId);
      const pk = this.zone.packs.find((q) => q.id === e.packId);
      if (pk?.kind === "guardian") { this.ch.flags.guardian = true; this.emit({ t: "toast", text: "The guardian falls — the descent is unsealed.", kind: "quest" }); this.emit({ t: "save" }); }
    }
    void p;
  }

  private onLevelUp() {
    this.statsDirty = true;
    this.recomputeStats();
    const p = this.player;
    p.hp = p.maxHp;
    p.focus = p.maxFocus;
    this.emit({ t: "levelup", level: this.ch.level });
    this.emit({ t: "toast", text: `Level ${this.ch.level}! +1 skill point${this.ch.level % 2 === 0 ? ", +1 attribute point" : ""}`, kind: "level" });
    this.emit({ t: "sfx", id: "sfx_levelup" });
    this.emit({ t: "vfx", kind: "levelup", x: p.x, y: p.y, type: "gold" });
  }

  itemLevel(level: number) {
    return Math.min(ITEM_CAP_LEVEL, Math.max(1, level));
  }

  lootCtx(ilvl: number, extra: Partial<Parameters<typeof generateItem>[1]> = {}) {
    return { ilvl, classHint: this.ch.classId, rarityFind: this.stats.raw.rarityFind ?? 0, veteran: this.ch.difficulty === "veteran", nextUid: this.uidNext, ...extra };
  }

  dropItemAt(it: Item, x: number, y: number) {
    const a = this.lootRng.range(0, Math.PI * 2), r = this.lootRng.range(0.4, 1.6);
    const pt = nearestOpen(this.nav, x + Math.cos(a) * r, y + Math.sin(a) * r, 3) ?? { x, y };
    this.pickups.push({ id: this.nextId++, kind: "item", x: pt.x, y: pt.y, amount: 1, item: it, t: 0 });
    this.ch.run.itemsFound++;
    if (it.rarity === "inscribed" || it.rarity === "relic") {
      this.emit({ t: "sfx", id: it.rarity === "relic" ? "sfx_drop_relic" : "sfx_drop_inscribed", x, y });
      this.emit({ t: "vfx", kind: "lootbeam", x: pt.x, y: pt.y, type: it.rarity === "relic" ? "ember" : "gold" });
    } else this.emit({ t: "sfx", id: "sfx_drop", x, y, vol: 0.4 });
  }

  private dropMisc(kind: Pickup["kind"], x: number, y: number, amount: number, potion?: PotionKind) {
    const a = this.lootRng.range(0, Math.PI * 2), r = this.lootRng.range(0.3, 1.4);
    const pt = nearestOpen(this.nav, x + Math.cos(a) * r, y + Math.sin(a) * r, 3) ?? { x, y };
    this.pickups.push({ id: this.nextId++, kind, x: pt.x, y: pt.y, amount, potion, t: 0 });
  }

  private dropBasic(e: { x: number; y: number; level: number }, mult: number) {
    const rng = this.lootRng;
    const gf = 1 + (this.stats.raw.goldFind ?? 0) / 100;
    if (rng.chance(0.38 * mult)) this.dropMisc("gold", e.x, e.y, Math.max(1, Math.round(rng.range(1, 2.6) * (2 + e.level * 1.6) * gf)));
    if (rng.chance(0.07 * mult)) this.dropMisc("potion", e.x, e.y, 1, rng.weighted(["health", "focus", "cleanse", "tonic"] as PotionKind[], (k) => ({ health: 55, focus: 25, cleanse: 10, tonic: 10 })[k]));
    if (rng.chance(0.07 * mult)) this.dropMisc("globe", e.x, e.y, 1);
    if (rng.chance(0.05 * mult)) this.dropMisc("dust", e.x, e.y, rng.int(1, 3));
  }

  dropLoot(e: Enemy) {
    const rng = this.lootRng;
    const elite = e.isElite;
    this.dropBasic(e, elite ? 3 : 1);
    const ilvl = this.itemLevel(e.level + (elite ? 1 : 0));
    let n = 0;
    if (e.guardian) n = 3;
    else if (elite) n = 2;
    else if (rng.chance(0.11)) n = 1;
    for (let i = 0; i < n; i++) {
      const min = e.guardian && i === 0 ? "inscribed" : elite ? "tempered" : "worn";
      this.dropItemAt(generateItem(rng, this.lootCtx(ilvl, { minRarity: min as any })), e.x, e.y);
    }
    if (rng.chance(elite ? 0.25 : 0.02)) this.dropItemAt(generateGlyph(rng, e.level < 8 ? 1 : e.level < 16 ? 2 : 3, this.uidNext), e.x, e.y);
  }

  private onBossKilled(e: Enemy) {
    const b = e.boss!;
    const kind = b.kind;
    const key = `${kind}_${this.ch.difficulty}`;
    const first = !this.ch.loot.firstBoss[key];
    this.ch.loot.firstBoss[key] = true;
    this.ch.stats.bossKills[kind] = (this.ch.stats.bossKills[kind] ?? 0) + 1;
    this.endBossFight(false);
    const rng = this.lootRng;
    const ilvl = this.itemLevel(e.level + 2);
    const count = kind === "tollkeeper" ? 3 : 4;
    // relic bad-luck protection
    const pity = this.ch.loot.relicPity;
    const relic = pity >= 3 || rng.chance(0.12 + 0.22 * pity);
    if (relic) this.ch.loot.relicPity = 0; else this.ch.loot.relicPity++;
    for (let i = 0; i < count; i++) {
      const it = generateItem(rng, this.lootCtx(ilvl, { minRarity: i === 0 && first ? "inscribed" : i < 2 ? "tempered" : "worn", forceRelic: relic && i === 0 }));
      this.dropItemAt(it, e.x, e.y);
    }
    this.dropItemAt(generateGlyph(rng, ilvl < 10 ? 1 : 2, this.uidNext), e.x, e.y);
    for (let i = 0; i < 4; i++) this.dropMisc("gold", e.x, e.y, Math.round((20 + e.level * 6) * rng.range(0.8, 1.3)));
    this.dropMisc("potion", e.x, e.y, 1, "health");
    this.dropMisc("dust", e.x, e.y, 6 + e.level);
    this.emit({ t: "shake", amp: 0.5, dur: 0.6, src: "boss" });
    this.emit({ t: "vfx", kind: "bossdeath", x: e.x, y: e.y, r: 5, type: kind === "engine" ? "frost" : "ember" });
    // remove summons / conduits
    for (const o of this.enemies) if (o.alive && (o.summoned || o.role === "conduit")) { o.alive = false; o.deadT = 0; o.anim = "dead"; }
    if (this.hunt) {
      const t = this.time - this.hunt.t0;
      const hk = `hunt_${kind}`;
      const best = this.ch.stats.huntBest[hk];
      if (!best || t < best) this.ch.stats.huntBest[hk] = Math.round(t * 10) / 10;
      const ck = `count_${this.zone.id}`;
      this.ch.stats.huntBest[ck] = (this.ch.stats.huntBest[ck] ?? 0) + 1;
      this.emit({ t: "toast", text: `Target Hunt complete in ${t.toFixed(1)} s${!best || t < best ? " — new best!" : ""}`, kind: "quest" });
    }
    if (kind === "tollkeeper") {
      this.ch.flags.boss_tollkeeper = true;
      if (this.ch.quests.open_archive.status !== "done") this.questStep("open_archive", 2);
      this.emit({ t: "subtitle", who: "The Toll-Keeper", text: "The toll… is… paid." });
      this.emit({ t: "toast", text: "The crypt entrance is open.", kind: "quest" });
    } else {
      this.emit({ t: "subtitle", who: "Orison Engine", text: "the… choir… falls… quiet." });
      if (!this.hunt) {
        if (this.ch.quests.engine.status !== "done") this.completeQuest("engine");
        const firstAct = !this.ch.actComplete[this.ch.difficulty];
        this.ch.actComplete[this.ch.difficulty] = true;
        this.ch.veteranUnlocked = true;
        if (firstAct) { this.pendingSummary = true; this.emit({ t: "actComplete" }); }
      }
    }
    this.emit({ t: "save" });
  }

  startBossFight(e: Enemy) {
    const b = e.boss!;
    b.active = true;
    b.t = 0;
    e.aware = true;
    e.ai = "approach";
    this.activeBoss = e.id;
    this.arena = this.zone.meta.arena ?? null;
    this.emit({ t: "bossPhase", name: e.name, phase: 1 });
    this.emit({ t: "sfx", id: "sfx_boss_start" });
    this.emit({ t: "subtitle", who: e.name, text: b.kind === "tollkeeper" ? "None pass the gate unpaid." : "WARDEN. YOU WALK INTO THE HYMN." });
    if (b.kind === "engine" && this.ch.quests.engine.step < 1 && this.ch.quests.engine.status === "active") this.questStep("engine", 1);
    this.count(`boss_start_${b.kind}`);
  }

  endBossFight(reset: boolean) {
    const id = this.activeBoss;
    this.arena = null;
    this.activeBoss = null;
    if (!reset || id === null) return;
    const e = this.enemyById(id);
    if (!e) return;
    // full reset; retry starts immediately from the checkpoint with no cutscene
    const kind = e.boss!.kind;
    e.hp = e.maxHp;
    e.x = e.px = e.home.x; e.y = e.py = e.home.y;
    e.boss = newBossState(kind, e);
    e.ai = "dormant"; e.statuses = {};
    this.clearTelegraphs(e.id);
    for (const o of this.enemies) if (o.alive && (o.summoned || o.role === "conduit")) { o.alive = false; o.deadT = 99; }
    this.zones = this.zones.filter((z) => z.team === 0);
    this.telegraphs = [];
  }

  playerDied() {
    const p = this.player;
    if (!p.alive) return;
    p.alive = false; p.hp = 0; p.action = null; p.path = null; p.anim = "dead"; p.deadT = 0;
    const ld = p.lastDamage ?? { source: "Unknown", type: "physical" as DamageType, amount: 0 };
    this.deathInfo = { cause: ld.source, type: ld.type };
    this.ch.stats.deaths++; this.ch.run.deaths++;
    this.ch.stats.deathCauses[ld.source] = (this.ch.stats.deathCauses[ld.source] ?? 0) + 1;
    this.count(`death:${ld.source}`);
    this.telemetry.log.push({ t: this.time, ev: "death", data: { zone: this.zone.id, cause: ld.source, type: ld.type, boss: this.activeBoss !== null } });
    // Echo: 10% of carried gold; dying again moves the Echo without compounding loss
    if (this.ch.echo) { this.ch.echo.zone = this.zone.id; this.ch.echo.x = p.x; this.ch.echo.y = p.y; }
    else {
      const lost = Math.floor(this.ch.gold * 0.1);
      this.ch.gold -= lost;
      this.ch.echo = { zone: this.zone.id, x: p.x, y: p.y, gold: lost };
    }
    for (const it of Object.values(this.ch.equipment)) if (it) it.durability = Math.max(0, Math.round((it.durability - it.maxDurability * 0.05) * 10) / 10);
    this.statsDirty = true;
    this.endBossFight(true);
    this.emit({ t: "playerDeath", cause: ld.source, type: ld.type });
    this.emit({ t: "sfx", id: "sfx_player_death" });
  }

  respawn() {
    const p = this.player;
    p.alive = true;
    p.statuses = {};
    if (this.ch.blessing > 0) applyStatus(p, "blessing", this.ch.blessing);
    this.recomputeStats();
    p.hp = p.maxHp; p.focus = p.maxFocus; p.heat = 0; p.furnace = false; p.evadeCharges = this.stats.evadeCharges;
    this.deathInfo = null;
    const wp = WAYPOINTS[this.ch.checkpoint] ?? WAYPOINTS.refuge;
    this.requestZone(wp.zone, wp.entry);
  }

  townGate() {
    if (this.zone.safe) return;
    this.returnPortal = { zone: this.zone.id, x: this.player.x, y: this.player.y };
    this.emit({ t: "sfx", id: "sfx_waypoint" });
    this.requestZone("refuge", "waypoint");
  }

  recordTraining(skill: string, amt: number) {
    const tr = this.training;
    if (tr.total === 0) tr.start = this.time;
    tr.total += amt;
    tr.last = this.time;
    tr.bySkill[skill] = (tr.bySkill[skill] ?? 0) + amt;
  }

  // ───────────────────────── interaction ─────────────────────────
  /** Returns an interactable id (positive) or a pickup id (negative) near a point. */
  nearestInteractable(x: number, y: number, r: number): number | null {
    let best: number | null = null, bd = r;
    for (const it of this.interactables) {
      if (it.hidden || (it.open && (it.kind === "chest" || it.kind === "urn" || it.kind === "explosive" || it.kind === "lever" || it.kind === "gate" || it.kind === "shrine"))) continue;
      const d = dist(x, y, it.x, it.y);
      if (d < bd) { bd = d; best = it.id; }
    }
    for (const pk of this.pickups) {
      if (pk.kind !== "item" && pk.kind !== "potion") continue;
      const d = dist(x, y, pk.x, pk.y);
      if (d < bd) { bd = d; best = -pk.id; }
    }
    return best;
  }

  interactPos(id: number): { x: number; y: number } | null {
    if (id < 0) { const pk = this.pickups.find((q) => q.id === -id); return pk ? pk : null; }
    const it = this.interactables.find((q) => q.id === id);
    return it && !it.hidden ? it : null;
  }

  interact(id: number) {
    if (id < 0) { this.pickUp(-id); return; }
    const it = this.interactables.find((q) => q.id === id);
    if (!it || it.hidden) return;
    const markOpen = () => { it.open = true; if (!this.zoneState.opened.includes(it.id)) this.zoneState.opened.push(it.id); };
    switch (it.kind) {
      case "chest":
        if (it.open) return;
        markOpen();
        this.openChest(it);
        break;
      case "urn":
        if (it.open) return;
        markOpen();
        this.emit({ t: "vfx", kind: "debris", x: it.x, y: it.y, type: "physical" });
        this.emit({ t: "sfx", id: "sfx_urn", x: it.x, y: it.y });
        this.dropBasic({ x: it.x, y: it.y, level: this.zone.level }, 1.6);
        break;
      case "explosive":
        if (!it.open && it.fuse <= 0) this.lightFuse(it);
        break;
      case "lever": {
        if (it.open) return;
        markOpen();
        const gate = this.interactables.find((q) => q.id === it.data.gate);
        if (gate && !gate.open) { gate.open = true; this.zoneState.opened.push(gate.id); this.setCells(gate.data.cells, 2); }
        this.emit({ t: "toast", text: "A portcullis grinds open — a shortcut to the waypoint.", kind: "quest" });
        this.emit({ t: "sfx", id: "sfx_lever" });
        break;
      }
      case "gate":
        if (it.open) return;
        if (it.data.lever) { this.emit({ t: "toast", text: it.data.prompt, kind: "warn" }); this.emit({ t: "sfx", id: "sfx_invalid" }); return; }
        markOpen();
        this.setCells(it.data.cells, 2);
        this.emit({ t: "toast", text: "Shortcut opened", kind: "quest" });
        this.emit({ t: "sfx", id: "sfx_lever" });
        this.emit({ t: "vfx", kind: "debris", x: it.x, y: it.y, type: "physical" });
        break;
      case "exit": {
        const req = it.data.requires as string | undefined;
        if (req && !this.ch.flags[req]) { this.emit({ t: "toast", text: it.data.sealedText ?? "Sealed.", kind: "warn" }); this.emit({ t: "sfx", id: "sfx_invalid" }); return; }
        this.requestZone(it.data.to, it.data.entry);
        break;
      }
      case "portal":
        this.requestZone(it.data.zone, "start", { x: it.data.x, y: it.data.y });
        this.returnPortal = null;
        break;
      case "waypoint":
        this.emit({ t: "panel", panel: "waypoint" });
        break;
      case "stash":
        this.emit({ t: "panel", panel: "stash" });
        break;
      case "npc":
        this.talk(it.data.npc);
        break;
      case "cage":
        if (it.open) return;
        markOpen();
        this.ch.flags.artificer_rescued = true;
        this.questStep("artificer", 2);
        if (this.ch.quests.engine.status === "inactive") this.ch.quests.engine = { status: "active", step: 0 };
        this.emit({ t: "subtitle", who: "Calder", text: "Bless you, Warden. My tools wait at the Refuge — find me there." });
        this.emit({ t: "sfx", id: "sfx_lever" });
        this.emit({ t: "save" });
        break;
      case "shrine":
        if (it.open) return;
        markOpen();
        healPlayer(this, this.player.maxHp);
        this.player.focus = this.player.maxFocus;
        applyStatus(this.player, "shrine", 30);
        this.emit({ t: "toast", text: "Ember Shrine: restored, +20% damage for 30 s", kind: "info" });
        this.emit({ t: "sfx", id: "sfx_shrine" });
        this.emit({ t: "vfx", kind: "levelup", x: it.x, y: it.y, type: "gold" });
        break;
      case "dummy_spawner":
        if (it.data.drill) this.emit({ t: "panel", panel: "training" });
        break;
      case "hunt_portal":
        this.emit({ t: "panel", panel: "hunt" });
        break;
    }
  }

  private openChest(it: InteractRT) {
    const tier = it.data.tier ?? 1;
    const rng = this.lootRng;
    const ilvl = this.itemLevel(this.zone.level + tier - 1);
    const n = tier === 2 ? rng.int(2, 3) : rng.int(1, 2);
    for (let i = 0; i < n; i++) this.dropItemAt(generateItem(rng, this.lootCtx(ilvl, { minRarity: tier === 2 && i === 0 ? "tempered" : "worn" })), it.x, it.y);
    if (tier === 2) this.dropItemAt(generateGlyph(rng, ilvl < 10 ? 1 : 2, this.uidNext), it.x, it.y);
    this.dropMisc("gold", it.x, it.y, Math.round((8 + this.zone.level * 4) * tier * rng.range(0.8, 1.4)));
    if (rng.chance(0.5)) this.dropMisc("potion", it.x, it.y, 1, "health");
    this.emit({ t: "sfx", id: "sfx_chest", x: it.x, y: it.y });
    this.emit({ t: "vfx", kind: "chest", x: it.x, y: it.y, type: "gold" });
  }

  pickUp(pickupId: number): boolean {
    const pk = this.pickups.find((q) => q.id === pickupId);
    if (!pk) return false;
    if (pk.kind === "potion" && pk.potion) {
      if (this.ch.belt[pk.potion] >= this.ch.beltCap) { this.emit({ t: "toast", text: "Potion belt is full", kind: "warn" }); this.emit({ t: "sfx", id: "sfx_invalid" }); return false; }
      this.ch.belt[pk.potion]++; pk.amount = 0;
      this.emit({ t: "sfx", id: "sfx_potion_pick" });
      return true;
    }
    if (pk.kind !== "item" || !pk.item) return false;
    const inv = Grid.from(this.ch.inventory);
    if (!inv.add(pk.item)) { this.emit({ t: "toast", text: "Inventory full", kind: "warn" }); this.emit({ t: "sfx", id: "sfx_invalid" }); return false; }
    this.ch.inventory = inv.toData();
    this.emit({ t: "loot", rarity: pk.item.rarity, name: itemName(pk.item) });
    this.emit({ t: "sfx", id: "sfx_pickup" });
    if (pk.item.rarity === "inscribed" || pk.item.rarity === "relic") this.ch.run.best = itemName(pk.item);
    pk.item = undefined; pk.amount = 0;
    this.pickups = this.pickups.filter((q) => q !== pk);
    return true;
  }

  // ───────────────────────── NPCs & quests ─────────────────────────
  talk(npc: string) {
    if (npc === "ivra") {
      if (this.ch.quests.ashway.step === 0 && this.ch.quests.ashway.status === "active") {
        this.ch.quests.ashway.step = 1;
        if (this.ch.quests.open_archive.status === "inactive") this.ch.quests.open_archive = { status: "active", step: 0 };
        this.emit({ t: "toast", text: "Quest updated: The Ashway", kind: "quest" });
        this.emit({ t: "sfx", id: "sfx_quest" });
      }
      this.emit({ t: "panel", panel: "dialog", data: { npc } });
    } else if (npc === "odo") this.emit({ t: "panel", panel: "vendor" });
    else if (npc === "wren") {
      healPlayer(this, this.player.maxHp);
      this.player.focus = this.player.maxFocus;
      for (const s of ["burn", "blight", "chill", "slow", "root"]) removeStatus(this.player, s);
      this.emit({ t: "sfx", id: "sfx_shrine" });
      this.emit({ t: "panel", panel: "dialog", data: { npc } });
    } else if (npc === "calder") this.emit({ t: "panel", panel: "artificer" });
    else if (npc === "sela") {
      const q = this.ch.quests.hunter;
      if (q.status === "active" && q.step === 0) { q.step = 1; this.hunter = { state: "active", wave: 0 }; this.emit({ t: "subtitle", who: "Hunter Sela", text: "They're coming through the smoke — hold the camp with me!" }); }
      else if (q.status === "active" && q.step === 2) { this.completeQuest("hunter"); }
      else this.emit({ t: "panel", panel: "dialog", data: { npc } });
    }
  }

  questStep(id: string, step: number) {
    const q = this.ch.quests[id];
    if (!q || q.status === "done" || q.step >= step) return;
    q.status = "active";
    q.step = step;
    this.emit({ t: "toast", text: `${QUEST_BY_ID[id].name}: ${QUEST_BY_ID[id].steps[step]}`, kind: "quest" });
    this.emit({ t: "sfx", id: "sfx_quest" });
    this.emit({ t: "save" });
  }

  completeQuest(id: string) {
    const q = this.ch.quests[id];
    if (!q || q.status === "done") return;
    q.status = "done";
    const def = QUEST_BY_ID[id];
    this.ch.gold += def.reward.gold;
    if (def.reward.skillPoint) this.ch.skillPoints++;
    if (id === "hunter") { this.ch.beltCap = Math.max(this.ch.beltCap, BELT_STACK_MAX + 1); this.emit({ t: "subtitle", who: "Hunter Sela", text: "Take my spare bandolier. You'll carry one more of each draught." }); }
    const lv = addXp(this.ch, def.reward.xp);
    if (lv) this.onLevelUp();
    this.emit({ t: "toast", text: `Quest complete: ${def.name} — ${def.reward.text}`, kind: "quest" });
    this.emit({ t: "sfx", id: "sfx_quest_done" });
    this.emit({ t: "save" });
  }

  private onEnterZone(id: ZoneId) {
    const q = this.ch.quests;
    if (id === "refuge") {
      this.ch.townVisits++;
      if (this.ch.flags.artificer_rescued && q.artificer.status !== "done") this.completeQuest("artificer");
      if (q.ashway.status === "active" && q.ashway.step === 0 && this.ch.townVisits > 1) { /* still must speak to Ivra */ }
    }
    if (id === "march" && q.ashway.status === "active" && q.ashway.step === 0) { q.ashway.step = 1; if (q.open_archive.status === "inactive") q.open_archive = { status: "active", step: 0 }; }
    if (id === "archive1") {
      if (q.open_archive.status !== "done" && this.ch.flags.boss_tollkeeper) this.completeQuest("open_archive");
      if (q.artificer.status === "inactive") { q.artificer = { status: "active", step: 0 }; this.emit({ t: "toast", text: "New quest: The Caged Artificer", kind: "quest" }); }
    }
    if (id === "archive3" && q.engine.status === "active" && q.engine.step < 1) this.questStep("engine", 1);
    if (id === "refuge" && this.vendorVisit !== this.ch.townVisits) this.restockVendor();
  }

  restockVendor() {
    this.vendorVisit = this.ch.townVisits;
    const rng = Rng.from(this.runSeed(), "vendor", this.ch.townVisits);
    const ilvl = this.itemLevel(this.ch.level + 1);
    this.vendorStock = [];
    for (let i = 0; i < 8; i++) this.vendorStock.push(generateItem(rng, { ilvl, classHint: this.ch.classId, rarityFind: 40, minRarity: i < 2 ? "tempered" : "worn", veteran: this.ch.difficulty === "veteran", nextUid: this.uidNext }));
  }

  // ───────────────────────── inventory & economy (UI calls these) ─────────────────────────
  inv() { return Grid.from(this.ch.inventory); }
  private commitInv(g: Grid) { this.ch.inventory = g.toData(); }

  canEquip(it: Item): { ok: boolean; reason?: string } {
    if (it.kind !== "gear") return { ok: false, reason: "Not equipment" };
    const b = BASE_BY_ID[it.baseId];
    if (b.classReq && b.classReq !== this.ch.classId) return { ok: false, reason: `Requires ${b.classReq === "cinder" ? "Cinder Vow" : "Veil Ranger"}` };
    if (this.ch.level < b.reqLevel) return { ok: false, reason: `Requires level ${b.reqLevel}` };
    return { ok: true };
  }

  slotFor(it: Item): EquipSlot {
    const b = BASE_BY_ID[it.baseId];
    if (b.slot === "ring") return !this.ch.equipment.ring1 ? "ring1" : !this.ch.equipment.ring2 ? "ring2" : "ring1";
    return b.slot as EquipSlot;
  }

  equip(uid: number, slot?: EquipSlot): boolean {
    const inv = this.inv();
    const pl = inv.find(uid);
    if (!pl) return false;
    const it = pl.item;
    const c = this.canEquip(it);
    if (!c.ok) { this.emit({ t: "toast", text: c.reason!, kind: "warn" }); this.emit({ t: "sfx", id: "sfx_invalid" }); return false; }
    const target = slot ?? this.slotFor(it);
    const b = BASE_BY_ID[it.baseId];
    inv.remove(uid);
    const toInv: Item[] = [];
    const cur = this.ch.equipment[target];
    if (cur) toInv.push(cur);
    if (b.twoHanded && this.ch.equipment.offhand && !(b.kind === "bow" || b.kind === "longbow")) { toInv.push(this.ch.equipment.offhand); this.ch.equipment.offhand = null; }
    if (target === "offhand" && this.ch.equipment.mainhand && BASE_BY_ID[this.ch.equipment.mainhand.baseId].twoHanded && BASE_BY_ID[this.ch.equipment.mainhand.baseId].kind === "maul") { toInv.push(this.ch.equipment.mainhand); this.ch.equipment.mainhand = null; }
    // put displaced items back; if no space, revert
    const trial = Grid.from(inv.toData());
    for (const t of toInv) if (!trial.add(t)) { this.emit({ t: "toast", text: "Not enough inventory space to swap", kind: "warn" }); this.emit({ t: "sfx", id: "sfx_invalid" }); if (cur) this.ch.equipment[target] = cur; return false; }
    this.ch.equipment[target] = it;
    this.commitInv(trial);
    this.statsDirty = true;
    this.emit({ t: "sfx", id: "sfx_equip" });
    return true;
  }

  unequip(slot: EquipSlot): boolean {
    const it = this.ch.equipment[slot];
    if (!it) return false;
    const inv = this.inv();
    if (!inv.add(it)) { this.emit({ t: "toast", text: "Inventory full", kind: "warn" }); this.emit({ t: "sfx", id: "sfx_invalid" }); return false; }
    this.ch.equipment[slot] = null;
    this.commitInv(inv);
    this.statsDirty = true;
    this.emit({ t: "sfx", id: "sfx_equip" });
    return true;
  }

  findItem(uid: number): Item | undefined {
    return this.inv().find(uid)?.item ?? Object.values(this.ch.equipment).find((i) => i?.uid === uid) ?? Grid.from(this.ch.stash).find(uid)?.item ?? undefined;
  }

  /** Destruction guard: favorited, equipped, or Relic items need explicit confirmation. */
  destroyGuard(it: Item, confirmed: boolean): string | null {
    if (it.favorite) return "Favorited items are protected. Unfavorite first.";
    if (Object.values(this.ch.equipment).some((e) => e?.uid === it.uid)) return "Equipped items cannot be destroyed.";
    if (it.rarity === "relic" && !confirmed) return "confirm";
    return null;
  }

  toggleFavorite(uid: number) {
    const it = this.findItem(uid);
    if (it) { it.favorite = !it.favorite; this.ch.inventory = { ...this.ch.inventory }; }
  }

  dropFromInventory(uid: number, confirmed = false): string | null {
    const inv = this.inv();
    const pl = inv.find(uid);
    if (!pl) return "Not found";
    const g = this.destroyGuard(pl.item, confirmed);
    if (g) return g;
    inv.remove(uid);
    this.commitInv(inv);
    this.pickups.push({ id: this.nextId++, kind: "item", x: this.player.x + 0.8, y: this.player.y + 0.4, amount: 1, item: pl.item, t: 0 });
    return null;
  }

  salvage(uid: number, confirmed = false): string | null {
    if (!this.ch.flags.artificer_rescued) return "Only the Artificer can salvage.";
    const inv = this.inv();
    const pl = inv.find(uid);
    if (!pl) return "Not found";
    const g = this.destroyGuard(pl.item, confirmed);
    if (g) return g;
    inv.remove(uid);
    this.commitInv(inv);
    const d = salvageYield(pl.item);
    this.ch.dust += d;
    this.emit({ t: "sfx", id: "sfx_salvage" });
    this.emit({ t: "toast", text: `Salvaged for ${d} dust` });
    return null;
  }

  sell(uid: number, confirmed = false): string | null {
    const inv = this.inv();
    const pl = inv.find(uid);
    if (!pl) return "Not found";
    const g = this.destroyGuard(pl.item, confirmed);
    if (g) return g;
    inv.remove(uid);
    this.commitInv(inv);
    const v = Math.max(1, Math.round(itemValue(pl.item) / 4));
    this.ch.gold += v;
    this.emit({ t: "sfx", id: "sfx_gold" });
    return null;
  }

  buyPrice(it: Item) { return itemValue(it) * 2; }

  buy(index: number): string | null {
    const it = this.vendorStock[index];
    if (!it) return "Sold out";
    const price = this.buyPrice(it);
    if (this.ch.gold < price) return "Not enough gold";
    const inv = this.inv();
    if (!inv.add(it)) return "Inventory full";
    this.commitInv(inv);
    this.ch.gold -= price;
    this.vendorStock.splice(index, 1);
    this.emit({ t: "sfx", id: "sfx_gold" });
    return null;
  }

  buyPotion(kind: PotionKind): string | null {
    const price = POTION_INFO[kind].price;
    if (this.ch.belt[kind] >= this.ch.beltCap) return "Belt slot full";
    if (this.ch.gold < price) return "Not enough gold";
    this.ch.gold -= price;
    this.ch.belt[kind]++;
    this.emit({ t: "sfx", id: "sfx_potion_pick" });
    return null;
  }

  identify(uid: number): string | null {
    if (!this.ch.flags.artificer_rescued) return "The Artificer is missing.";
    const it = this.findItem(uid);
    if (!it || it.identified) return "Nothing to identify";
    const c = identifyCost(it);
    if (this.ch.gold < c) return "Not enough gold";
    this.ch.gold -= c;
    it.identified = true;
    this.statsDirty = true;
    this.ch.inventory = { ...this.ch.inventory };
    this.emit({ t: "sfx", id: it.rarity === "relic" ? "sfx_drop_relic" : "sfx_identify" });
    this.emit({ t: "toast", text: `Identified: ${itemName(it)}`, kind: "loot" });
    return null;
  }

  reroll(uid: number, index: number): string | null {
    if (!this.ch.flags.artificer_rescued) return "The Artificer is missing.";
    const it = this.findItem(uid);
    if (!it || it.kind !== "gear" || !it.identified || !it.affixes[index]) return "Choose an identified affix";
    const c = rerollCost(it);
    if (this.ch.gold < c.gold || this.ch.dust < c.dust) return "Not enough gold or dust";
    const rng = Rng.from(this.runSeed(), "reroll", it.uid, it.rerolls);
    const cls = BASE_BY_ID[it.baseId].classReq ?? this.ch.classId;
    const n = rerollAffix(rng, it, index, cls, this.ch.difficulty === "veteran");
    if (!n) return "No valid affix";
    this.ch.gold -= c.gold; this.ch.dust -= c.dust;
    it.affixes[index] = n;
    it.rerolls++;
    this.statsDirty = true;
    this.ch.inventory = { ...this.ch.inventory };
    this.emit({ t: "sfx", id: "sfx_craft" });
    return null;
  }

  repair(uid: number | "all"): string | null {
    const items = uid === "all" ? [...Object.values(this.ch.equipment), ...this.inv().items()].filter((x): x is Item => !!x) : [this.findItem(uid)].filter((x): x is Item => !!x);
    const total = items.reduce((s, i) => s + repairCost(i), 0);
    if (total <= 0) return "Nothing to repair";
    if (this.ch.gold < total) return "Not enough gold";
    this.ch.gold -= total;
    for (const i of items) i.durability = i.maxDurability;
    this.statsDirty = true;
    this.emit({ t: "sfx", id: "sfx_craft" });
    return null;
  }

  addSocket(uid: number): string | null {
    if (!this.ch.flags.artificer_rescued) return "The Artificer is missing.";
    const it = this.findItem(uid);
    if (!it || !canAddSocket(it)) return "This item cannot take another socket";
    const c = socketCost(it);
    if (this.ch.gold < c.gold || this.ch.dust < c.dust) return "Not enough gold or dust";
    this.ch.gold -= c.gold; this.ch.dust -= c.dust;
    it.sockets++; it.glyphs.push(null); it.socketAdded = true;
    this.emit({ t: "sfx", id: "sfx_craft" });
    return null;
  }

  socketGlyph(itemUid: number, glyphUid: number): string | null {
    const inv = this.inv();
    const g = inv.find(glyphUid);
    const it = this.findItem(itemUid);
    if (!g || g.item.kind !== "glyph" || !it) return "Invalid";
    const free = it.glyphs.indexOf(null);
    if (free < 0) return "No empty socket";
    it.glyphs[free] = g.item.baseId;
    inv.remove(glyphUid);
    this.commitInv(inv);
    this.statsDirty = true;
    this.emit({ t: "sfx", id: "sfx_socket" });
    return null;
  }

  /** Three glyphs of the same kind and tier combine into one of the next tier. */
  combineGlyphs(glyphBaseId: string): string | null {
    const gd = GLYPH_BY_ID[glyphBaseId];
    if (!gd || gd.tier >= 3) return "Cannot combine further";
    const inv = this.inv();
    const same = inv.items().filter((i) => i.kind === "glyph" && i.baseId === glyphBaseId && !i.favorite);
    if (same.length < 3) return "Need three matching glyphs";
    for (const s of same.slice(0, 3)) inv.remove(s.uid);
    const kind = glyphBaseId.replace(/_\d$/, "");
    const next = GLYPHS.find((g) => g.id === `${kind}_${gd.tier + 1}`)!;
    inv.add({ uid: this.uidNext(), baseId: next.id, kind: "glyph", ilvl: next.tier * 6, rarity: "worn", affixes: [], sockets: 0, glyphs: [], identified: true, favorite: false, durability: 1, maxDurability: 1, rerolls: 0 });
    this.commitInv(inv);
    this.emit({ t: "sfx", id: "sfx_craft" });
    return null;
  }

  toStash(uid: number): string | null {
    const inv = this.inv(), st = Grid.from(this.ch.stash);
    const pl = inv.find(uid);
    if (!pl) return "Not found";
    if (!st.add(pl.item)) return "Stash full";
    inv.remove(uid);
    this.commitInv(inv); this.ch.stash = st.toData();
    return null;
  }
  fromStash(uid: number): string | null {
    const inv = this.inv(), st = Grid.from(this.ch.stash);
    const pl = st.find(uid);
    if (!pl) return "Not found";
    if (!inv.add(pl.item)) return "Inventory full";
    st.remove(uid);
    this.commitInv(inv); this.ch.stash = st.toData();
    return null;
  }
  moveInInventory(uid: number, x: number, y: number): boolean {
    const inv = this.inv();
    if (!inv.move(uid, x, y)) return false;
    this.commitInv(inv);
    return true;
  }
  sortInventory() { const inv = this.inv(); if (inv.sort()) this.commitInv(inv); }

  allocAttr(a: AttrId): boolean {
    if (this.ch.attrPoints <= 0) return false;
    this.ch.attrs[a]++;
    this.ch.attrPoints--;
    this.statsDirty = true;
    return true;
  }
  rankSkill(id: string): boolean {
    const ok = rankUp(this.ch, id);
    if (ok) { this.statsDirty = true; this.emit({ t: "sfx", id: "sfx_skill" }); }
    return ok;
  }
  respecAll(): string | null {
    const free = this.zone.id === "training";
    const r = respec(this.ch, free);
    if (!r.ok) return r.reason ?? "Cannot respec";
    this.player.furnace = false;
    this.statsDirty = true;
    this.emit({ t: "sfx", id: "sfx_skill" });
    return null;
  }
  setHotbar(slot: number, id: string | null) { return assignHotbar(this.ch, slot, id); }

  saveLoadout(i: number, name: string) {
    this.ch.loadouts[i] = { name, ranks: { ...this.ch.ranks }, attrs: { ...this.ch.attrs }, hotbar: [...this.ch.hotbar], equipment: Object.fromEntries(EQUIP_SLOTS.map((s) => [s, this.ch.equipment[s]?.uid ?? null])) };
  }
  /** Applies a loadout snapshot: skill/attribute allocation plus re-equipping owned items. */
  applyLoadout(i: number): string | null {
    const l = this.ch.loadouts[i];
    if (!l) return "Empty loadout";
    const r = respec(this.ch, this.ch.level <= 8 || this.zone.id === "training");
    if (!r.ok) return r.reason ?? "Cannot respec";
    for (const [id, n] of Object.entries(l.ranks)) for (let k = this.ch.ranks[id] ?? 0; k < n; k++) rankUp(this.ch, id);
    for (const a of ["might", "finesse", "will", "vigor"] as AttrId[]) for (let k = 0; k < l.attrs[a] && this.ch.attrPoints > 0; k++) { this.ch.attrs[a]++; this.ch.attrPoints--; }
    l.hotbar.forEach((h, s) => assignHotbar(this.ch, s, h));
    for (const s of EQUIP_SLOTS) { const uid = l.equipment[s]; if (uid && this.ch.equipment[s]?.uid !== uid && this.inv().find(uid)) this.equip(uid, s); }
    this.statsDirty = true;
    return null;
  }

  // ───────────────────────── modes ─────────────────────────
  /** Starts the Veteran expedition: new seed, quests reset, better affix tiers and elite density. */
  startVeteran() {
    if (!this.ch.veteranUnlocked) return;
    this.resetExpedition("veteran");
    this.emit({ t: "toast", text: "Veteran expedition begins. The ash grows thicker.", kind: "quest" });
  }

  newExpedition() {
    this.resetExpedition(this.ch.difficulty, true);
    this.emit({ t: "toast", text: "A new expedition: the March and Archive have shifted.", kind: "quest" });
  }

  private resetExpedition(diff: "normal" | "veteran", keepQuests = false) {
    const q = this.ch.quests;
    const changing = diff !== this.ch.difficulty;
    this.ch.difficulty = diff;
    this.ch.expedition++;
    this.ch.zoneStates = {};
    this.ch.echo = null;
    this.returnPortal = null;
    if (changing || !keepQuests) {
      for (const id of Object.keys(q)) q[id] = { status: "inactive", step: 0 };
      q.ashway = { status: "active", step: 1 };
      q.open_archive = { status: "active", step: 0 };
      if (this.ch.flags.artificer_rescued) q.artificer = { status: "done", step: 2 };
      this.ch.waypoints = ["refuge"];
      this.ch.flags = { artificer_rescued: !!this.ch.flags.artificer_rescued };
    }
    this.ch.checkpoint = "refuge";
    this.ch.run = { startedAt: Date.now(), kills: 0, deaths: 0, itemsFound: 0, best: "", startPlay: this.ch.stats.playTime };
    this.lootRng = Rng.from(this.runSeed(), "loot");
    this.statsDirty = true;
    this.emit({ t: "save" });
  }

  startHunt(boss: "tollkeeper" | "engine") {
    if (!this.ch.actComplete.normal && !this.ch.actComplete.veteran) return;
    this.requestZone(boss === "tollkeeper" ? "hunt_toll" : "hunt_engine", "start");
  }

  spawnTraining(enemy: string) {
    if (this.zone.id !== "training") return;
    const pt = nearestOpen(this.nav, 20 + this.combatRng.range(-3, 3), 13 + this.combatRng.range(-4, 4), 3);
    if (!pt) return;
    const e = this.spawnEnemy(enemy, pt.x, pt.y, Math.max(1, this.ch.level), [], -5);
    if (e) { e.training = true; e.aware = true; e.ai = "approach"; }
  }
  clearTraining() {
    for (const e of this.enemies) if (e.alive && e.def.behavior !== "dummy") { e.alive = false; e.deadT = 99; }
    this.training = { start: this.time, total: 0, last: this.time, bySkill: {} };
  }

  /** Snapshot for persistence. */
  snapshot(): CharacterData {
    this.saveZoneState();
    const c: CharacterData = JSON.parse(JSON.stringify(this.ch));
    c.updatedAt = Date.now();
    (c as any).lootState = this.lootRng.state();
    if (this.zone && this.player) c.location = { zone: this.zone.id, x: this.player.x, y: this.player.y };
    return c;
  }
}

function releaseHeavyAll(e: Enemy) { e.heavy = false; }

function distSeg(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const abx = bx - ax, aby = by - ay;
  const l2 = abx * abx + aby * aby;
  let t = l2 > 0 ? ((px - ax) * abx + (py - ay) * aby) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - ax - abx * t, py - ay - aby * t);
}

export function encodeExplored(a: Uint8Array): string {
  // run-length encoding of alternating 0/1 runs
  const runs: number[] = [];
  let cur = 0, n = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] === cur) n++;
    else { runs.push(n); cur = a[i]; n = 1; }
  }
  runs.push(n);
  return runs.join(".");
}
export function decodeExplored(s: string, len: number): Uint8Array {
  const a = new Uint8Array(len);
  if (!s) return a;
  let i = 0, cur = 0;
  for (const r of s.split(".")) { const n = Number(r); a.fill(cur, i, Math.min(len, i + n)); i += n; cur ^= 1; }
  return a;
}

export { cloneItem, SKILL_BY_ID, basicSkill, ELITE_BY_ID };
