// Game session: owns simulation truth. Fixed-step update, zone management, loot, quests, death, progression.
// The renderer, HUD and audio only consume `events` and read state; they never mutate it directly.
import { ENEMIES, ELITE_PREFIX, NEUTRAL_TYPES, enemyLevelDmgMul, enemyLevelHpMul, type EnemyDef } from '../data/enemies';
import { BASE_BY_ID, POTIONS } from '../data/items';
import { CLASS_SKILLS, MAX_LEVEL, SKILL_BY_ID } from '../data/skills';
import { QUESTS } from '../data/quests';
import { updateEnemies, packAggro } from './ai';
import { bossControl as bossCtl, bossDamageFilter as bossFilter, bossHealFromScribes, newBossState, updateBoss as bossUpdate } from './bosses';
import { addEffect, applyControl, dmgToEnemy, getEffect, hasEffect, removeEffect, rollPlayerDamage, spawnHazard, tickEffects, updateHazards, updateProjectiles, type HitOpts } from './combat';
import { Character, addXp, computeDerived, effectiveRank, type Derived, equippedItems } from './character';
import type { Enemy, Hazard, Pickup, Player, Projectile, Standard } from './entities';
import { planEquip, targetSlot, canUse } from './inventory';
import { generateItem, makeGlyph, randomGlyph, nextUid, rarityRank, sellValue, itemValue, identifyCost, salvageDust, rerollCost, repairCost, socketCost, rollAffix, rollAffixValue, makeItem } from './loot';
import { circleBlocked, depenetrate, lineClear, FLOOR } from './nav';
import { beginCast, beginDash, beginEvade, commandMove, gainHeat, makePlayer, rollForPlayerAilments, skillReady, slotSkill, updateCast, updatePlayerMovement, usePotion } from './play';
import { Rng, seedFrom } from './rng';
import type { DamageType, DmgAmounts, GameEvent, Item, PotionKind, Rarity, SlotId } from './types';
import { buildArchive, buildEngineFloor, buildMarch, buildRefuge, buildTollHunt, addHuntExit, addVictoryExit, openCells, type Interactable, type Zone } from './world';
import { AFFIX_BY_ID, AFFIXES, GLYPH_TYPES, POTION_BASE_CAP } from '../data/items';
import { respecAll, rankUp, assignHotbar, saveLoadout, applyLoadout, spendAttr, type HotbarSlot } from './character';

export interface ZoneRun {
  zone: Zone;
  enemies: Enemy[];
  pickups: Pickup[];
  spawned: boolean;
  bossDead: boolean;
  ambush: { t: number; x: number; z: number; pending: string[]; level: number; ids: number[]; done: boolean; active: boolean } | null;
}

export const WAYPOINT_INFO: Record<string, { name: string; zone: string }> = {
  refuge: { name: 'Ember Refuge', zone: 'refuge' },
  ashway: { name: 'Ashway Shrine (Soot March)', zone: 'march' },
  archive: { name: 'Archive Gate (Hollow Archive)', zone: 'archive1' },
  approach: { name: 'Engine Approach (Hollow Archive)', zone: 'archive3' },
};

export interface RunSummary {
  time: number;
  kills: number;
  deaths: number;
  level: number;
  items: number;
  bestRarity: string;
  difficulty: string;
  bossKills: number;
  build: string;
}

export class Game {
  crng: Rng;
  lootRng: Rng;
  ch: Character;
  d!: Derived;
  player: Player;
  zr!: ZoneRun;
  zones = new Map<string, ZoneRun>();
  events: GameEvent[] = [];
  standards: Standard[] = [];
  hazards: Hazard[] = [];
  projectiles: Projectile[] = [];
  boss: Enemy | null = null;
  pathBudget = 6;
  dummyDamage = 0;
  dummyLog: [number, number][] = [];
  time = 0;
  tickN = 0;
  nextId = 1;
  blessingT = 0;
  returnPoint: { zone: string; x: number; z: number } | null = null;
  summary: RunSummary | null = null;
  runStart = 0;
  huntT0 = 0;
  huntBoss: string | null = null;
  lastCause = { text: 'Unknown', dtype: 'phys' as DamageType };
  deathInfo: { cause: string; dtype: DamageType; echo: number } | null = null;
  vendorStock: Item[] = [];
  vendorSeed = 0;
  paused = false;
  buffKey = '';
  killsThisZone = 0;

  constructor(ch: Character) {
    this.ch = ch;
    this.crng = new Rng(seedFrom('combat', ch.seed, ch.expedition, ch.stats.kills));
    this.lootRng = new Rng(ch.lootState ?? seedFrom('loot', ch.seed, ch.expedition));
    this.player = makePlayer(this.nextId++);
    this.recompute(true);
    this.player.hp = this.player.maxHp;
    this.player.focus = this.player.maxFocus * 0.5;
    this.restockVendor();
    for (const k of CLASS_SKILLS[ch.cls]) void k;
    this.enterZone('refuge');
  }

  // ------------------------------------------------------------ accessors
  get zone(): Zone {
    return this.zr.zone;
  }
  get enemies(): Enemy[] {
    return this.zr.enemies;
  }
  get pickups(): Pickup[] {
    return this.zr.pickups;
  }

  text(x: number, z: number, text: string, color: string, big = false) {
    this.events.push({ t: 'text', x, z, text, color, big });
  }
  toast(text: string, kind: 'info' | 'quest' | 'warn' | 'loot' = 'info') {
    this.events.push({ t: 'toast', text, kind });
  }
  tutorial(step: string, cond: boolean) {
    if (!cond || this.ch.tutorial[step]) return;
    this.ch.tutorial[step] = true;
    this.events.push({ t: 'sfx', id: 'quest' });
  }

  // ------------------------------------------------------------ derived stats
  recompute(initial = false) {
    const ch = this.ch;
    const p = this.player;
    const tonic = getEffect(p, 'tonic');
    const buffs = { resAll: tonic ? tonic.mag : 0, hpPct: this.blessingT > 0 ? 8 : 0 };
    const d = computeDerived(ch, buffs);
    const ratio = initial ? 1 : p.maxHp > 0 ? p.hp / p.maxHp : 1;
    this.d = d;
    p.maxHp = d.maxHp;
    p.hp = initial ? d.maxHp : Math.min(d.maxHp, Math.max(1, d.maxHp * ratio));
    p.maxFocus = d.maxFocus;
    p.focus = Math.min(p.focus, p.maxFocus);
    p.speed = d.moveSpeed;
    this.buffKey = `${tonic ? 1 : 0}${this.blessingT > 0 ? 1 : 0}`;
  }

  currentSkillIds(): string[] {
    return [CLASS_SKILLS[this.ch.cls][0].id, ...(['rmb', 'q', 'w', 'e', 'r'] as HotbarSlot[]).map((s) => this.ch.hotbar[s]).filter(Boolean) as string[]];
  }

  // ------------------------------------------------------------ zones
  private buildZone(id: string): Zone {
    const ch = this.ch;
    const seed = seedFrom('zone', ch.seed, ch.expedition);
    switch (id) {
      case 'refuge':
        return buildRefuge();
      case 'march':
        return buildMarch(seed, ch.difficulty);
      case 'archive1':
        return buildArchive(seed, 1, ch.difficulty);
      case 'archive2':
        return buildArchive(seed, 2, ch.difficulty);
      case 'archive3':
        return buildEngineFloor(seed, ch.difficulty);
      case 'hunt_toll':
        return buildTollHunt(seedFrom('hunt', ch.seed, ch.stats.kills), ch.difficulty);
      case 'hunt_engine':
        return buildEngineFloor(seedFrom('hunt', ch.seed, ch.stats.kills), ch.difficulty, true);
      default:
        throw new Error(`unknown zone ${id}`);
    }
  }

  enterZone(id: string, at?: { x: number; z: number }) {
    let zr = this.zones.get(id);
    if (!zr) {
      const zone = this.buildZone(id);
      zr = { zone, enemies: [], pickups: [], spawned: false, bossDead: false, ambush: null };
      this.zones.set(id, zr);
      if (this.ch.flags.artificerRescued) for (const it of zone.interactables) if (it.kind === 'cage') it.used = it.state.open = true; // already rescued on an earlier expedition
    }
    this.zr = zr;
    this.hazards = [];
    this.projectiles = [];
    this.standards = [];
    this.boss = null;
    const z = zr.zone;
    if (!zr.spawned) {
      this.spawnZoneEntities(zr);
      zr.spawned = true;
    }
    const start = at ?? z.playerStart;
    const p = this.player;
    const pos = depenetrate(z.grid, start.x, start.z, p.r);
    p.x = p.px = pos.x;
    p.z = p.pz = pos.z;
    p.path = null;
    p.moveTarget = null;
    p.attackTarget = 0;
    p.interactTarget = null;
    p.cast = null;
    p.dash = null;
    p.channel = null;
    p.vx = p.vz = 0;
    this.revealAround();
    // echo pickup if died here
    const echo = this.ch.echo;
    if (echo && echo.zone === id && !zr.pickups.some((k) => k.kind === 'echo')) this.addPickup({ kind: 'echo', x: echo.x, z: echo.z, amount: echo.gold, label: 'Echo' });
    // visibility of refuge portals
    if (id === 'refuge') {
      for (const it of z.interactables) {
        if (it.kind === 'portal_ashen') it.hidden = !this.ch.actComplete;
        if (it.kind === 'portal_return') it.hidden = !this.returnPoint;
        if (it.kind === 'artificer') it.state.rescued = !!this.ch.flags.artificerRescued;
      }
    }
    this.events.push({ t: 'zone', id });
    this.events.push({ t: 'music', mode: id === 'refuge' ? 'town' : z.theme === 'crypt' ? 'crypt' : 'wild' });
    this.autosaveNeeded = true;
  }
  autosaveNeeded = false;

  spawnEnemy(type: string, x: number, z: number, level: number, o: { pack?: string; aggro?: boolean; elite?: string[]; boss?: boolean; noLoot?: boolean } = {}): Enemy | null {
    const def: EnemyDef = ENEMIES[type];
    if (!def) return null;
    const diff = this.ch.difficulty;
    const elite = !!o.elite && o.elite.length > 0;
    const boss = !!o.boss;
    const hpMul = enemyLevelHpMul(level) * (elite ? 4.2 : 1) * (diff === 'veteran' && !boss ? 1.12 : 1) * (boss && diff === 'veteran' ? 1.25 : 1);
    const hp = Math.max(1, def.hp * hpMul);
    const neutral = NEUTRAL_TYPES.includes(type);
    const r = def.r * (elite ? 1.12 : 1);
    const e: Enemy = {
      id: this.nextId++, x, z, px: x, pz: z, vx: 0, vz: 0, facing: this.crng.next() * Math.PI * 2, r, hp, maxHp: hp, alive: true, effects: [], hitFlash: 0, freeze: 0,
      type, def, name: elite ? `${ELITE_PREFIX[Math.floor(this.crng.next() * ELITE_PREFIX.length)]} ${def.name}` : def.name, level, state: o.aggro ? 'approach' : 'dormant', stateT: 0,
      home: { x, z }, lastSeen: null, searchT: 0, pack: o.pack ?? `solo${this.nextId}`, aggro: !!o.aggro, elite, mods: o.elite ?? [], boss, atk: null, atkCd: 0.6 + this.crng.next() * 1.2,
      slotAngle: 0, hasSlot: false, heavyToken: false, path: null, pathT: 0, strafe: this.crng.next() < 0.5 ? 1 : -1, spawnT: 0, tauntT: 0, retreatT: 1.8, modT: 3 + this.crng.next() * 3,
      modT2: 4 + this.crng.next() * 4, hpMax0: hp, dmgMul: enemyLevelDmgMul(level) * (elite ? 1.2 : 1) * (diff === 'veteran' ? 1.1 : 1), fadeT: 2.4, lastDmgType: 'phys', neutral,
      split: false, seed: this.nextId, wardId: 0, leader: 0, noLoot: !!o.noLoot, lungeDir: 0, lungeT: 0, speedMul: diff === 'veteran' ? 1.06 : 1, wake: 0, killedBy: '',
    };
    if (type === 'dummy') {
      e.hp = e.maxHp = 1e6;
    }
    if (boss) e.boss_state = newBossState(type, hp, diff === 'veteran');
    this.zr.enemies.push(e);
    return e;
  }

  private spawnZoneEntities(zr: ZoneRun) {
    const z = zr.zone;
    for (const sg of z.spawns) {
      if (sg.tag === 'dummy' || sg.tag === 'breakable') {
        this.spawnEnemy(sg.members[0], sg.x, sg.z, sg.level, { pack: sg.id });
        continue;
      }
      const placeAround = (type: string, i: number, n: number, level: number, elite?: string[]) => {
        const ang = (i / Math.max(1, n)) * Math.PI * 2 + this.crng.next() * 0.6;
        const rr = n === 1 ? 0 : 1.3 + this.crng.next() * 1.6;
        const pos = depenetrate(z.grid, sg.x + Math.cos(ang) * rr, sg.z + Math.sin(ang) * rr, ENEMIES[type].r);
        return this.spawnEnemy(type, pos.x, pos.z, level, { pack: sg.id, elite });
      };
      let i = 0;
      const n = sg.members.length + (sg.elite ? 1 : 0);
      if (sg.elite) {
        placeAround(sg.elite.type, i++, n, sg.level + 1, sg.elite.mods);
      }
      for (const m of sg.members) placeAround(m, i++, n, sg.level);
    }
    if (z.bossArena) {
      const a = z.bossArena;
      const lv = a.boss === 'toll_keeper' ? z.level + (z.kind === 'march' ? 6 : 0) : z.level + 2;
      const b = this.spawnEnemy(a.boss, a.x, a.z, lv, { pack: 'boss', boss: true });
      if (b) {
        b.state = 'dormant';
        b.aggro = false;
        b.noLoot = true;
        b.facing = Math.PI / 2;
      }
      if (a.boss === 'orison_engine') {
        // door visible; engine door seals when the fight starts
      }
    }
  }

  // ------------------------------------------------------------ pickups & loot
  addPickup(p: Partial<Pickup> & Pick<Pickup, 'kind' | 'x' | 'z'>): Pickup {
    const k: Pickup = { id: this.nextId++, amount: 0, age: 0, vx: 0, vz: 0, magnet: false, label: '', dead: false, ...p } as Pickup;
    const pos = depenetrate(this.zone.grid, k.x, k.z, 0.3);
    k.x = pos.x;
    k.z = pos.z;
    this.zr.pickups.push(k);
    return k;
  }

  private scatter(x: number, z: number, i: number): { x: number; z: number } {
    const a = this.crng.next() * Math.PI * 2 + i * 1.3;
    const r = 0.6 + this.crng.next() * 1.0 + i * 0.15;
    return { x: x + Math.cos(a) * r, z: z + Math.sin(a) * r };
  }

  dropItem(x: number, z: number, it: Item, i = 0) {
    const s = this.scatter(x, z, i);
    this.addPickup({ kind: 'item', x: s.x, z: s.z, item: it, label: it.name });
    this.events.push({ t: 'sfx', id: it.rarity === 'relic' ? 'dropRelic' : it.rarity === 'inscribed' ? 'dropRare' : 'drop', x, z });
    if (rarityRank(it.rarity) > rarityRank(this.ch.stats.bestRarity as Rarity)) this.ch.stats.bestRarity = it.rarity;
    this.ch.stats.items++;
  }

  private dropGold(x: number, z: number, amount: number) {
    const s = this.scatter(x, z, 0);
    amount = Math.max(1, Math.round(amount * (1 + this.d.goldFind / 100)));
    this.addPickup({ kind: 'gold', x: s.x, z: s.z, amount, label: `${amount} gold` });
  }

  private rollPotion(): PotionKind {
    const r = this.lootRng.next();
    return r < 0.5 ? 'health' : r < 0.75 ? 'focus' : r < 0.88 ? 'cleanse' : 'tonic';
  }

  itemLevelFor(level: number): number {
    return Math.max(1, Math.min(40, level + this.lootRng.int(-1, 1)));
  }

  genItem(ilvl: number, o: { rarity?: Rarity; minRarity?: Rarity; identified?: boolean; relicBoost?: number } = {}): Item {
    const it = generateItem(this.lootRng, ilvl, { cls: this.ch.cls, ...o });
    this.ch.lootState = this.lootRng.state;
    return it;
  }

  dropLoot(e: Enemy) {
    const r = this.lootRng;
    const lvl = e.level;
    const role = e.def.role;
    const itemChance = ({ fodder: 0.05, skirmisher: 0.075, controller: 0.11, bruiser: 0.17 } as const)[role];
    let i = 0;
    if (r.chance(e.elite ? 1 : 0.55)) this.dropGold(e.x, e.z, (3 + lvl * 2.4) * r.range(0.6, 1.5) * (e.elite ? 4 : 1));
    if (r.chance(e.elite ? 0.8 : 0.1)) {
      const k = this.rollPotion();
      this.addPickup({ kind: 'potion', potion: k, x: e.x + r.range(-1, 1), z: e.z + r.range(-1, 1), label: POTIONS[k].name, amount: 1 });
    }
    if (r.chance(e.elite ? 0.6 : 0.03)) {
      const gl = randomGlyph(r, lvl >= 12 ? 2 : 1);
      this.dropItem(e.x, e.z, gl, i++);
    }
    if (e.elite) {
      const n = r.int(2, 3);
      for (let k = 0; k < n; k++) this.dropItem(e.x, e.z, this.genItem(this.itemLevelFor(lvl), { minRarity: k === 0 ? 'tempered' : undefined }), i++);
      this.addPickup({ kind: 'dust', x: e.x, z: e.z, amount: r.int(2, 5), label: 'Glyph dust' });
    } else if (r.chance(itemChance)) {
      this.dropItem(e.x, e.z, this.genItem(this.itemLevelFor(lvl)), i++);
    }
    if (r.chance(0.04)) this.addPickup({ kind: 'dust', x: e.x, z: e.z, amount: r.int(1, 2), label: 'Glyph dust' });
    this.ch.lootState = r.state;
  }

  private dropBossLoot(e: Enemy, first: boolean) {
    const r = this.lootRng;
    const lvl = e.level + 2;
    const ch = this.ch;
    let i = 0;
    const engine = e.type === 'orison_engine';
    this.dropGold(e.x, e.z, 60 + lvl * 12);
    this.dropGold(e.x + 1, e.z + 1, 40 + lvl * 8);
    for (let k = 0; k < 2; k++) this.addPickup({ kind: 'potion', potion: this.rollPotion(), x: e.x + r.range(-1.5, 1.5), z: e.z + r.range(-1.5, 1.5), label: 'Potion', amount: 1 });
    this.addPickup({ kind: 'dust', x: e.x, z: e.z, amount: r.int(8, 14), label: 'Glyph dust' });
    const guaranteed = engine ? 2 : 1;
    const forceRelic = engine ? ch.relicPity >= 2 : ch.relicPity >= 4;
    let gotRelic = false;
    for (let k = 0; k < guaranteed + (first ? 1 : 0) + (engine ? 1 : 0); k++) {
      const it = this.genItem(this.itemLevelFor(lvl), {
        minRarity: k < guaranteed ? 'inscribed' : 'tempered',
        identified: true,
        rarity: forceRelic && k === 0 ? 'relic' : undefined,
        relicBoost: Math.min(0.9, ch.relicPity * 0.16 + (engine ? 0.06 : 0)),
      });
      if (it.rarity === 'relic') gotRelic = true;
      this.dropItem(e.x, e.z, it, i++);
    }
    for (let k = 0; k < 2; k++) this.dropItem(e.x, e.z, randomGlyph(r, 2), i++);
    ch.relicPity = gotRelic ? 0 : ch.relicPity + 1;
    ch.lootState = r.state;
  }

  // ------------------------------------------------------------ damage hooks
  hurtPlayer(amounts: DmgAmounts, src: { name: string; melee?: boolean; dot?: boolean; srcId?: number; fromX?: number; fromZ?: number; dtype?: DamageType; heavy?: boolean }): number {
    const p = this.player;
    if (p.dead) return 0;
    if (!src.dot && hasEffect(p, 'dodge')) {
      removeEffect(p, 'dodge');
      this.text(p.x, p.z, 'Evaded!', '#5ee0d0');
      this.events.push({ t: 'sfx', id: 'evadeHit', x: p.x, z: p.z });
      return 0;
    }
    const d = this.d;
    let total = 0;
    let mainT: DamageType = 'phys';
    let mainA = -1;
    for (const t of ['phys', 'ember', 'frost', 'blight'] as DamageType[]) {
      let a = amounts[t];
      if (!a) continue;
      if (t === 'phys') {
        const armor = d.armor;
        const red = Math.min(0.85, armor / (armor + 5 * a + 45));
        a *= 1 - red;
      } else a *= 1 - d.res[t] / 100;
      total += a;
      if (a > mainA) {
        mainA = a;
        mainT = t;
      }
    }
    const guard = getEffect(p, 'guard');
    if (guard) total *= 1 - guard.mag;
    let dr = 0;
    for (const s of this.standards) if (Math.hypot(s.x - p.x, s.z - p.z) < s.r) dr = Math.max(dr, 0.25);
    const ls = getEffect(p, 'laststand');
    if (ls) dr = Math.max(dr, 0.3);
    total *= 1 - dr;
    let blocked = false;
    if (!src.dot && d.block > 0 && this.ch.cls === 'cinder' && d.hasShield) {
      let faces = true;
      if (src.fromX !== undefined && src.fromZ !== undefined) {
        const ang = Math.atan2(src.fromZ - p.z, src.fromX - p.x);
        let diff = Math.abs(ang - p.facing);
        while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
        faces = diff < 1.4;
      }
      if (faces && this.crng.next() * 100 < d.block) {
        blocked = true;
        total *= 0.35;
        gainHeat(this, 8);
        this.events.push({ t: 'sfx', id: 'block', x: p.x, z: p.z });
        if (d.flags.oath) addEffect(p, 'guard', 1.5, 0.3);
        if (d.relics.has('bellwall')) this.relicBlockWave();
      }
    }
    total = Math.max(0, total);
    p.hp -= total;
    p.hitFlash = 0.15;
    p.inCombat = 6;
    p.lastHitBy = src.name;
    p.lastHitType = mainT;
    this.lastCause = { text: src.name, dtype: mainT };
    gainHeat(this, (total / Math.max(1, d.maxHp)) * 90);
    if (p.channel) {
      p.channel = null;
      this.toast('Town gate interrupted by damage', 'warn');
    }
    this.events.push({ t: 'hit', x: p.x, z: p.z, amount: total, crit: false, dtype: mainT, onPlayer: true, target: p.id, blocked });
    if (total > d.maxHp * 0.08) this.events.push({ t: 'shake', amount: Math.min(0.5, total / d.maxHp) });
    if (src.melee && src.srcId) {
      const th = d.thorns * (d.flags.oath ? 2 : 1) * (1 + (d.relics.size ? 0 : 0));
      const se = this.zr.enemies.find((e) => e.id === src.srcId);
      if (th > 0 && se && se.alive) dmgToEnemy(this, se, { ember: th * (1 + this.ch.level * 0.1) }, { dot: true, quiet: true });
    }
    if (p.hp / d.maxHp < 0.35 && d.relics.has('heartfurnace') && p.lastStandCd <= 0 && p.hp > 0) {
      p.lastStandCd = 30;
      addEffect(p, 'laststand', 5, 0.3);
      this.text(p.x, p.z, 'Last Stand', '#ffd56a');
    }
    if (p.hp <= 0) this.killPlayer(src.name, mainT);
    return total;
  }

  healPlayer(amt: number) {
    const p = this.player;
    const before = p.hp;
    p.hp = Math.min(p.maxHp, p.hp + amt);
    const got = p.hp - before;
    if (got > 0.5) this.text(p.x, p.z, `+${Math.round(got)}`, '#7ee08a');
  }

  pushPlayer(fx: number, fz: number, dist: number) {
    const p = this.player;
    const a = Math.atan2(p.z - fz, p.x - fx);
    beginDash(this, Math.cos(a), Math.sin(a), dist, 0.2, 'knock');
  }

  pullPlayer(tx: number, tz: number, maxDist: number) {
    const p = this.player;
    const d = Math.hypot(tx - p.x, tz - p.z);
    const dist = Math.max(0, Math.min(maxDist, d - 1.8));
    if (dist <= 0.1) return;
    beginDash(this, tx - p.x, tz - p.z, dist, 0.25, 'pull');
  }

  private relicBlockWave() {
    const p = this.player;
    for (const e of this.enemies) {
      if (!e.alive || e.neutral || Math.hypot(e.x - p.x, e.z - p.z) > 4.5) continue;
      applyControl(this, e, 'stun', 0.6);
      dmgToEnemy(this, e, { phys: this.d.weaponPool * 0.5 }, { skill: 'cinder_ring', fromX: p.x, fromZ: p.z, knock: 1.5 });
    }
    this.events.push({ t: 'fx', id: 'frostPulse', x: p.x, z: p.z, r: 4.5, color: 0xffd56a });
  }

  playerHitEnemy(e: Enemy, skillId: string, coefs: DmgAmounts, o: { tags?: string[]; fromX?: number; fromZ?: number; knock?: number; ailment?: { kind: string; chance: number; dur: number; mag: number }; hazard?: Hazard; crowd?: number; crowdBonus?: number; mul?: number; noCrit?: boolean }) {
    if (!e.alive) return;
    let mul = o.mul ?? 1;
    if (o.crowd && o.crowd > 1) mul *= 1 + Math.min(0.4, (o.crowd - 1) * (o.crowdBonus ?? 0.08));
    const { amounts, crit } = rollPlayerDamage(this, skillId, coefs, o.tags ?? [], { mul, target: e, noCrit: o.noCrit });
    const hadEmber = (amounts.ember ?? 0) > 0;
    const hopts: HitOpts = { crit, skill: skillId, fromX: o.fromX ?? this.player.x, fromZ: o.fromZ ?? this.player.z, knock: o.knock };
    const total = dmgToEnemy(this, e, amounts, hopts);
    if (total <= 0) return;
    const p = this.player;
    if (!e.neutral) {
      rollForPlayerAilments(this, e, total, SKILL_BY_ID[skillId], o.ailment ?? SKILL_BY_ID[skillId]?.ailment, hadEmber);
      if (this.d.raw.focusOnHit && skillId !== 'iron_litany' && skillId !== 'quickshot') p.focus = Math.min(p.maxFocus, p.focus + this.d.raw.focusOnHit * 0.5);
      if (this.d.raw.hpOnKill && !e.alive) this.healPlayer(this.d.raw.hpOnKill);
    }
    if (crit && this.d.relics.has('cinderbrand')) {
      for (const o2 of this.enemies) {
        if (o2 === e || !o2.alive || Math.hypot(o2.x - e.x, o2.z - e.z) > 2.6) continue;
        dmgToEnemy(this, o2, { ember: this.d.weaponPool * 0.6 }, { skill: skillId, fromX: e.x, fromZ: e.z });
      }
      this.events.push({ t: 'fx', id: 'hazardPop', x: e.x, z: e.z, r: 2.6, color: 0xff7a30 });
    }
    if (crit && this.d.relics.has('stareye')) p.focus = Math.min(p.maxFocus, p.focus + 3);
    if (this.d.flags.crucible && p.heat >= 100) this.crucibleNova();
  }

  private crucibleNova() {
    const p = this.player;
    p.heat = 0;
    p.focus = p.maxFocus;
    spawnHazard(this, { owner: 'player', shape: 'circle', kind: 'blast', x: p.x, z: p.z, radius: 5.2, delay: 0.001, dmg: {}, skill: 'cinder_ring', coefs: { ember: 2.4 }, tags: ['area', 'ember'], color: 0xff7a30, affectsEnemies: true, affectsPlayer: false, src: p.id, telegraph: false, once: true, knock: 1.5 });
    this.events.push({ t: 'fx', id: 'ringBurst', x: p.x, z: p.z, r: 5.2, color: 0xff7a30 });
    this.events.push({ t: 'shake', amount: 0.4 });
    this.text(p.x, p.z, 'Living Crucible!', '#ff9a50', true);
  }

  projectileHitEnemy(pr: Projectile, e: Enemy) {
    if (pr.special === 'visual') return;
    const p = this.player;
    const fromX = pr.x - pr.vx * 0.05;
    const fromZ = pr.z - pr.vz * 0.05;
    this.events.push({ t: 'fx', id: 'arrowHit', x: pr.x, z: pr.z, color: pr.color });
    if (pr.special === 'chain') {
      this.playerHitEnemy(e, pr.skill!, pr.coefs!, { tags: pr.tags, fromX, fromZ });
      if (!e.alive) return;
      const heavy = e.boss || e.elite || e.def.role === 'bruiser';
      if (!heavy) {
        const a = Math.atan2(p.z - e.z, p.x - e.x);
        const m = { x: p.x - Math.cos(a) * 1.5, z: p.z - Math.sin(a) * 1.5 };
        const pos = depenetrate(this.zone.grid, m.x, m.z, e.r);
        e.x = pos.x;
        e.z = pos.z;
        applyControl(this, e, 'stun', 0.8);
      } else {
        const d = Math.hypot(e.x - p.x, e.z - p.z);
        if (d > 2.6) {
          beginDash(this, e.x - p.x, e.z - p.z, Math.min(d - e.r - 1.3, 9), 0.22, 'vow_pull');
          p.dash!.pullTarget = e.id;
        }
        applyControl(this, e, 'slow', 1.5, 0.4);
        addEffect(p, 'guard', 1, 0.2);
      }
      return;
    }
    if (pr.special === 'arrow') {
      this.playerHitEnemy(e, pr.skill!, pr.coefs!, { tags: pr.tags, fromX, fromZ });
      p.focus = Math.min(p.maxFocus, p.focus + SKILL_BY_ID.quickshot.params.focusGain + (this.d.raw.focusOnHit ?? 0));
      if (pr.mark && e.alive && !e.neutral) {
        const cur = getEffect(e, 'mark');
        addEffect(e, 'mark', 6 + (this.d.flags.markDur ?? 0), Math.min(3, (cur?.mag ?? 0) + 1));
        this.text(e.x, e.z, 'Trace', '#9fd4ff');
      }
      return;
    }
    if (pr.kind === 'ghost') {
      const mk = getEffect(e, 'mark');
      this.playerHitEnemy(e, pr.skill!, pr.coefs!, { tags: pr.tags, fromX, fromZ });
      if (mk && e.alive !== undefined) {
        const n = mk.mag;
        const markMul = 1 + (this.d.raw.markDmgPct ?? 0) / 100;
        const rank = Math.max(1, effectiveRank(this.ch, this.d, 'ghostline'));
        const amt = this.d.weaponPool * (pr.detonate ?? 0.85) * n * markMul * (1 + 0.12 * (rank - 1)) * (this.d.flags.patient ? 1.6 : 1);
        removeEffect(e, 'mark');
        this.events.push({ t: 'fx', id: 'markBurst', x: e.x, z: e.z, r: 1.5, color: 0x9fd4ff });
        this.text(e.x, e.z, `Detonate x${n}`, '#bfe6ff');
        dmgToEnemy(this, e, { frost: amt }, { skill: 'ghostline', fromX, fromZ });
        if (this.d.flags.trails) {
          let c = 0;
          for (const o of this.enemies) {
            if (o === e || !o.alive || o.neutral || Math.hypot(o.x - e.x, o.z - e.z) > 6 || c >= 2) continue;
            addEffect(o, 'mark', 6 + (this.d.flags.markDur ?? 0), Math.min(3, (getEffect(o, 'mark')?.mag ?? 0) + 1));
            c++;
          }
        }
      }
      return;
    }
    if (pr.coefs && pr.skill) this.playerHitEnemy(e, pr.skill, pr.coefs, { tags: pr.tags, fromX, fromZ });
  }

  projectileHitPlayer(pr: Projectile) {
    const p = this.player;
    this.hurtPlayer(pr.dmg, { name: pr.label || 'Projectile', srcId: pr.src, fromX: pr.x - pr.vx * 0.1, fromZ: pr.z - pr.vz * 0.1, dtype: pr.dtype });
    if (pr.special === 'hook') {
      const src = this.enemies.find((e) => e.id === pr.src);
      if (src) {
        this.pullPlayer(src.x, src.z, 5.5);
        if (!hasEffect(p, 'resolve')) addEffect(p, 'root', 0.45, 1);
      }
      this.events.push({ t: 'sfx', id: 'hookHit', x: p.x, z: p.z });
    }
  }

  chainMiss(pr: Projectile) {
    const sk = SKILL_BY_ID.vow_chain;
    const cur = this.player.cds[sk.id] ?? 0;
    this.player.cds[sk.id] = cur * 0.5;
  }

  wakeEnemy(e: Enemy) {
    if (e.aggro && e.state !== 'dormant') return;
    e.aggro = true;
    e.state = 'approach';
    e.stateT = 0;
    e.searchT = 0;
    this.events.push({ t: 'sfx', id: 'aggro', x: e.x, z: e.z, vol: e.elite ? 1 : 0.5 });
    packAggro(this, e);
  }

  splitSwarm(e: Enemy) {
    for (let i = 0; i < 2; i++) {
      const s = this.spawnEnemy('swarmlet', e.x + (i ? 0.8 : -0.8), e.z, Math.max(1, e.level), { pack: e.pack, aggro: true, noLoot: true });
      if (s) s.maxHp = s.hp = e.maxHp * 0.25;
    }
    this.text(e.x, e.z, 'Splits!', '#c58aff');
  }

  cancelEnemyHazards(e: Enemy) {
    for (const h of this.hazards) if (h.src === e.id && !h.active && h.owner !== 'player') h.dead = true;
  }

  bossDamageFilter(e: Enemy, total: number, _o: HitOpts): number {
    return bossFilter(this, e, total);
  }
  bossControl(e: Enemy, kind: string, dur: number) {
    bossCtl(this, e, kind, dur);
  }
  updateBoss(e: Enemy, dt: number) {
    bossUpdate(this, e, dt);
    if (e.boss_state?.id === 'orison_engine') bossHealFromScribes(this, e, dt);
  }
  bossEngaged(e: Enemy) {
    this.toast(`${e.name} awakens`, 'warn');
    if (e.type === 'orison_engine') {
      const door = this.zone.interactables.find((i) => i.kind === 'engine_door');
      if (door) door.state.open = false;
    }
  }

  killEnemy(e: Enemy, source: string) {
    if (!e.alive) return;
    e.alive = false;
    e.hp = 0;
    e.state = 'dead';
    e.heavyToken = false;
    e.killedBy = source;
    e.fadeT = e.type === 'urn' || e.type === 'powder' ? 0.6 : 2.6;
    this.cancelEnemyHazards(e);
    for (const h of this.hazards) if (h.follow === e.id) h.dead = true;
    this.events.push({ t: 'die', x: e.x, z: e.z, enemy: e.id, type: e.type, elite: e.elite, boss: e.boss });
    this.events.push({ t: 'sfx', id: e.boss ? 'bossDie' : 'die', x: e.x, z: e.z });
    const ch = this.ch;
    const p = this.player;
    if (e.type === 'powder') {
      spawnHazard(this, { owner: 'env', shape: 'circle', kind: 'blast', x: e.x, z: e.z, radius: 3.2, delay: 0.35, dmg: { ember: 22 * enemyLevelDmgMul(this.zone.level) }, dtype: 'ember', src: e.id, color: 0xff7030, ownerLabel: 'Powder Brazier', affectsEnemies: true });
      this.events.push({ t: 'sfx', id: 'tele_pulse', x: e.x, z: e.z });
      return;
    }
    if (e.type === 'urn') {
      this.events.push({ t: 'fx', id: 'urnBreak', x: e.x, z: e.z, color: 0x8a7a60 });
      if (this.lootRng.chance(0.55)) this.dropGold(e.x, e.z, (2 + this.zone.level * 1.6) * this.lootRng.range(0.5, 1.4));
      if (this.lootRng.chance(0.08)) this.addPickup({ kind: 'potion', potion: this.rollPotion(), x: e.x, z: e.z, label: 'Potion', amount: 1 });
      if (this.lootRng.chance(0.05)) this.dropItem(e.x, e.z, this.genItem(this.itemLevelFor(this.zone.level)));
      return;
    }
    if (e.boss) {
      ch.stats.kills++;
      this.onBossKilled(e);
      return;
    }
    if (e.neutral || e.noLoot) {
      if (e.type === 'ward' || e.type === 'conduit' || e.type === 'scribe_repair') this.events.push({ t: 'fx', id: 'hazardPop', x: e.x, z: e.z, r: 1.5, color: e.def.accent });
      return;
    }
    ch.stats.kills++;
    this.killsThisZone++;
    // xp
    const lvlDiff = ch.level - e.level;
    const factor = Math.max(0.15, Math.min(1.3, 1 - 0.07 * (lvlDiff - 3)));
    const xp = Math.round(e.def.xp * (1 + 0.1 * (e.level - 1)) * (e.elite ? 3 : 1) * factor);
    if (xp > 0) this.gainXp(xp);
    if (this.d.raw.hpOnKill) this.healPlayer(this.d.raw.hpOnKill);
    if (this.d.relics.has('gravetoll') && this.crng.next() < 0.25) {
      spawnHazard(this, { owner: 'player', shape: 'circle', kind: 'nova', x: e.x, z: e.z, radius: 3.6, delay: 0.05, dmg: {}, skill: 'cinder_ring', coefs: { blight: 1.2 }, tags: ['area'], color: 0xa855f7, affectsEnemies: true, affectsPlayer: false, src: p.id, telegraph: false, once: true });
      this.events.push({ t: 'fx', id: 'poolBurst', x: e.x, z: e.z, r: 3.6, color: 0xa855f7 });
    }
    const mk = getEffect(e, 'mark');
    if (mk && this.d.relics.has('veilstring')) {
      let c = 0;
      for (const o of this.enemies) {
        if (o === e || !o.alive || o.neutral || Math.hypot(o.x - e.x, o.z - e.z) > 6 || c >= 2) continue;
        addEffect(o, 'mark', 6, mk.mag);
        c++;
      }
    }
    if (p.heat !== undefined && this.d.flags.crucible && p.heat >= 100) this.crucibleNova();
    this.dropLoot(e);
    if (e.boss) this.onBossKilled(e);
    // ambush
    const am = this.zr.ambush;
    if (am && am.active && am.ids.includes(e.id)) {
      if (this.enemies.filter((o) => am.ids.includes(o.id) && o.alive).length === 0 && am.pending.length === 0) {
        am.active = false;
        am.done = true;
        this.completeQuest('hunter');
      }
    }
  }

  gainXp(amount: number) {
    const ups = addXp(this.ch, amount);
    this.events.push({ t: 'text', x: this.player.x, z: this.player.z - 0.5, text: `+${amount} XP`, color: '#c8b6ff' });
    if (ups > 0) {
      this.recompute();
      this.player.hp = this.player.maxHp;
      this.events.push({ t: 'levelup', level: this.ch.level });
      this.events.push({ t: 'sfx', id: 'levelup' });
      this.toast(`Level ${this.ch.level}! Skill point gained${this.ch.level % 2 === 0 ? ' and an attribute point' : ''}.`, 'quest');
    }
  }

  // ------------------------------------------------------------ bosses & quests
  private onBossKilled(e: Enemy) {
    const ch = this.ch;
    const hunt = this.zone.kind === 'hunt';
    this.zr.bossDead = true;
    this.boss = null;
    ch.stats.bossKills++;
    const firstKey = `first_${e.type}`;
    const first = !ch.flags[firstKey];
    ch.flags[firstKey] = true;
    this.dropBossLoot(e, first && !hunt);
    this.gainXp(Math.round(e.def.xp * (1 + 0.1 * (e.level - 1))));
    this.events.push({ t: 'music', mode: this.zone.theme === 'crypt' ? 'crypt' : 'wild' });
    for (const o of this.enemies) if (o.alive && !o.boss && o.pack === 'boss') {
      this.killEnemy(o, 'boss');
    }
    this.hazards = this.hazards.filter((h) => h.owner === 'player');
    if (hunt) {
      const key = `hunt_${e.type}`;
      const t = this.time - this.huntT0;
      if (!ch.records) ch.records = {};
      const best = ch.records[key];
      if (!best || t < best) ch.records[key] = t;
      const ex = this.zone.interactables.find((i) => i.kind === 'hunt_exit') ?? addHuntExit(this.zone);
      ex.hidden = false;
      this.toast(`Target Hunt complete in ${formatTime(t)}${best && t >= best ? ` (best ${formatTime(best)})` : ' - new best!'}. Step through the portal to leave.`, 'quest');
      return;
    }
    if (e.type === 'toll_keeper') {
      ch.flags.tollDead = true;
      this.completeQuest('toll');
      const gate = this.zone.interactables.find((i) => i.kind === 'archive_gate');
      if (gate) {
        gate.state.open = true;
        gate.label = 'Archive Gate';
        if (gate.cells) openCells(this.zone, gate.cells);
      }
      this.toast('The Archive Gate grinds open.', 'quest');
      this.events.push({ t: 'shake', amount: 0.6 });
    } else if (e.type === 'orison_engine') {
      ch.actComplete = true;
      ch.veteranUnlocked = true;
      this.completeQuest('engine');
      const ex = this.zone.interactables.find((i) => i.kind === 'exit_summary') ?? addVictoryExit(this.zone);
      ex.hidden = false;
      this.summary = this.makeSummary();
      this.events.push({ t: 'victory' });
      this.toast('The Orison Engine falls. Collect your spoils, then step through the gateway.', 'quest');
    }
  }

  makeSummary(): RunSummary {
    const ch = this.ch;
    return {
      time: ch.stats.time, kills: ch.stats.kills, deaths: ch.stats.deaths, level: ch.level, items: ch.stats.items, bestRarity: ch.stats.bestRarity, difficulty: ch.difficulty, bossKills: ch.stats.bossKills,
      build: CLASS_SKILLS[ch.cls].filter((s) => (ch.ranks[s.id] ?? 0) > 0).map((s) => `${s.name} ${ch.ranks[s.id]}`).join(', ') || 'Basic attacks',
    };
  }

  questStatus(id: string) {
    return this.ch.quests[id] ?? 'locked';
  }
  activateQuest(id: string) {
    if (this.ch.quests[id] === 'active' || this.ch.quests[id] === 'done') return;
    this.ch.quests[id] = 'active';
    const q = QUESTS.find((x) => x.id === id);
    if (q && !q.hidden) this.toast(`New quest: ${q.name}`, 'quest');
  }
  completeQuest(id: string) {
    const ch = this.ch;
    if (ch.quests[id] === 'done') return;
    ch.quests[id] = 'done';
    const q = QUESTS.find((x) => x.id === id);
    if (q) {
      this.toast(`Quest complete: ${q.name}`, 'quest');
      this.events.push({ t: 'sfx', id: 'quest' });
      if (q.xp) this.gainXp(q.xp * (1 + Math.floor(ch.level / 4)));
      if (q.gold) {
        ch.gold += q.gold;
        this.text(this.player.x, this.player.z, `+${q.gold} gold`, '#ffd56a');
      }
    }
    if (id === 'ashway') this.activateQuest('toll');
    if (id === 'toll') {
      this.activateQuest('artificer');
      this.activateQuest('engine');
    }
    if (id === 'hunter') {
      ch.beltCap = POTION_BASE_CAP + 1;
      this.toast('Potion capacity increased permanently (+1 per stack).', 'quest');
    }
    this.autosaveNeeded = true;
  }

  // ------------------------------------------------------------ interactions
  interactableById(id: string): Interactable | undefined {
    return this.zone.interactables.find((i) => i.id === id);
  }

  private playerNear(it: { x: number; z: number; r: number }): boolean {
    return Math.hypot(it.x - this.player.x, it.z - this.player.z) <= it.r + 0.8;
  }

  cmdInteract(id: string) {
    const p = this.player;
    if (p.dead) return;
    p.interactTarget = id;
    p.attackTarget = 0;
    p.cast = p.cast && p.cast.t < p.cast.move ? p.cast : null;
  }
  cmdPickup(id: number) {
    this.cmdInteract(`pk:${id}`);
  }

  private performInteract(it: Interactable) {
    const ch = this.ch;
    const z = this.zone;
    this.events.push({ t: 'sfx', id: 'interact' });
    switch (it.kind) {
      case 'gate_march': {
        this.enterZone('march');
        break;
      }
      case 'gate_refuge': {
        const refuge = this.zones.get('refuge')?.zone;
        const a = refuge ? refuge.anchors.gate : { x: 47, z: 18 };
        this.enterZone('refuge', { x: a.x - 3.5, z: a.z });
        break;
      }
      case 'waypoint': {
        const wid = String(it.state.id);
        if (!ch.waypoints.includes(wid)) {
          ch.waypoints.push(wid);
          this.toast(`Waypoint activated: ${WAYPOINT_INFO[wid].name}`, 'quest');
          this.events.push({ t: 'sfx', id: 'waypoint' });
          this.events.push({ t: 'fx', id: 'waypoint', x: it.x, z: it.z, r: 4, color: 0x5ee8ff });
          if (wid === 'ashway') this.completeQuest('ashway');
          this.autosaveNeeded = true;
        }
        ch.lastWaypoint = wid;
        this.events.push({ t: 'panel', id: 'waypoint' });
        break;
      }
      case 'captain':
        if (!ch.quests.ashway) {
          this.activateQuest('ashway');
          this.activateQuest('hunter');
        }
        this.events.push({ t: 'dialog', npc: 'captain' });
        break;
      case 'vendor':
        this.events.push({ t: 'panel', id: 'vendor' });
        break;
      case 'healer': {
        const p = this.player;
        p.hp = p.maxHp;
        p.focus = p.maxFocus;
        this.text(p.x, p.z, 'Restored', '#7ee08a');
        this.toast('The Embertender restores you.', 'info');
        this.events.push({ t: 'sfx', id: 'potion' });
        break;
      }
      case 'artificer':
        if (ch.flags.artificerRescued) this.events.push({ t: 'panel', id: 'artificer' });
        else this.events.push({ t: 'dialog', npc: 'artificer_locked' });
        break;
      case 'stash':
        this.events.push({ t: 'panel', id: 'stash' });
        break;
      case 'chest': {
        if (it.used) return;
        it.used = true;
        this.openChest(it);
        break;
      }
      case 'shrine': {
        if (it.used) {
          this.toast('The shrine is spent.', 'info');
          return;
        }
        it.used = true;
        const p = this.player;
        p.hp = p.maxHp;
        p.focus = p.maxFocus;
        addEffect(p, 'haste', 20, 0.12);
        this.toast('The shrine mends you and quickens your hands.', 'info');
        this.events.push({ t: 'fx', id: 'waypoint', x: it.x, z: it.z, r: 3, color: 0x5ee0a0 });
        break;
      }
      case 'lever': {
        if (it.used) return;
        it.used = true;
        const door = z.interactables.find((i) => i.id === z.meta.shortcutDoor);
        if (door && door.cells) {
          openCells(z, door.cells);
          door.used = true;
          door.state.open = true;
        }
        this.toast('A gate grinds open somewhere in the Archive.', 'info');
        this.events.push({ t: 'shake', amount: 0.3 });
        break;
      }
      case 'door': {
        if (it.used) return;
        it.used = true;
        if (it.cells) openCells(z, it.cells);
        it.state.open = true;
        this.toast('The gate swings open - a shortcut.', 'info');
        this.events.push({ t: 'shake', amount: 0.2 });
        break;
      }
      case 'cage': {
        if (it.used) return;
        it.used = true;
        it.state.open = true;
        ch.flags.artificerRescued = true;
        this.completeQuest('artificer');
        const refuge = this.zones.get('refuge');
        if (refuge) for (const i of refuge.zone.interactables) if (i.kind === 'artificer') i.state.rescued = true;
        this.events.push({ t: 'dialog', npc: 'artificer_freed' });
        break;
      }
      case 'stairs_down': {
        const next = z.kind === 'archive1' ? 'archive2' : 'archive3';
        this.enterZone(next);
        break;
      }
      case 'stairs_up': {
        if (z.kind === 'archive1') {
          const m = this.zones.get('march')?.zone;
          this.enterZone('march', m ? { x: m.anchors.crypt.x, z: m.anchors.crypt.z + 3 } : undefined);
        } else if (z.kind === 'archive2') {
          const a = this.zones.get('archive1')!.zone;
          this.enterZone('archive1', { x: a.anchors.stairsDown.x, z: a.anchors.stairsDown.z - 2.5 });
        } else if (z.kind === 'archive3') {
          const a = this.zones.get('archive2')!.zone;
          this.enterZone('archive2', { x: a.anchors.stairsDown.x, z: a.anchors.stairsDown.z - 2.5 });
        }
        break;
      }
      case 'archive_gate':
        if (it.state.open) this.enterZone('archive1');
        else this.toast('The Archive Gate is sealed. The Toll-Keeper holds the key.', 'warn');
        break;
      case 'portal_ashen':
        this.events.push({ t: 'panel', id: 'portal' });
        break;
      case 'portal_return':
        if (this.returnPoint) {
          const rp = this.returnPoint;
          this.returnPoint = null;
          this.enterZone(rp.zone, { x: rp.x, z: rp.z });
        }
        break;
      case 'cache': {
        if (it.state.triggered) return;
        it.state.triggered = true;
        this.startAmbush(it);
        break;
      }
      case 'hunt_exit':
        this.huntBoss = null;
        this.zones.delete('hunt_toll');
        this.zones.delete('hunt_engine');
        this.enterZone('refuge', { x: 24, z: 24 });
        break;
      case 'exit_summary':
        this.events.push({ t: 'panel', id: 'summary' });
        break;
    }
  }

  private startAmbush(it: Interactable) {
    const z = this.zone;
    const level = z.level + 2;
    const pending = ['husk', 'hound', 'archer', 'crawler', 'crawler', 'swarm'];
    this.zr.ambush = { t: 2.6, x: it.x, z: it.z, pending, level, ids: [], done: false, active: true };
    this.toast("Ambush! Hunters spring the trap - brace yourself.", 'warn');
    this.events.push({ t: 'sfx', id: 'tele_summon', x: it.x, z: it.z });
    // explicit warning markers placed away from the player
    for (let i = 0; i < pending.length; i++) {
      const a = (i / pending.length) * Math.PI * 2;
      const pos = depenetrate(z.grid, it.x + Math.cos(a) * 8, it.z + Math.sin(a) * 8, 0.5);
      spawnHazard(this, { owner: 'env', shape: 'circle', kind: 'summon', x: pos.x, z: pos.z, radius: 1.0, delay: 2.6, dmg: {}, dtype: 'ember', color: 0xff6a30, affectsPlayer: false });
      (this.zr.ambush as { marks?: { x: number; z: number }[] }).marks = [...((this.zr.ambush as { marks?: { x: number; z: number }[] }).marks ?? []), pos];
    }
  }

  private updateAmbush(dt: number) {
    const am = this.zr.ambush as (ZoneRun['ambush'] & { marks?: { x: number; z: number }[] }) | null;
    if (!am || !am.active || am.pending.length === 0) return;
    am.t -= dt;
    if (am.t > 0) return;
    const marks = am.marks ?? [];
    const lvlE = am.level;
    const elite = am.ids.length === 0;
    let i = 0;
    for (const type of am.pending) {
      const m = marks[i++] ?? { x: am.x + 4, z: am.z };
      const e = this.spawnEnemy(type, m.x, m.z, lvlE, { pack: 'ambush', aggro: true, elite: elite && type === 'husk' ? ['rallying', 'ember_wake'] : undefined });
      if (e) am.ids.push(e.id);
    }
    am.pending = [];
  }

  private openChest(it: Interactable) {
    const tier = Number(it.state.tier ?? 0);
    const lvl = this.zone.level + (this.zone.kind === 'march' ? 1 : 0);
    const r = this.lootRng;
    this.events.push({ t: 'sfx', id: 'chest', x: it.x, z: it.z });
    this.events.push({ t: 'fx', id: 'urnBreak', x: it.x, z: it.z, color: 0xc9a468 });
    this.dropGold(it.x, it.z, (10 + lvl * 4) * (1 + tier));
    const n = tier === 0 ? r.int(1, 2) : tier === 1 ? r.int(2, 3) : 3;
    for (let i = 0; i < n; i++) {
      this.dropItem(it.x, it.z, this.genItem(this.itemLevelFor(lvl + tier), { minRarity: i === 0 && tier >= 1 ? 'tempered' : tier === 2 && i === 0 ? 'inscribed' : undefined }), i);
    }
    if (r.chance(0.5)) this.addPickup({ kind: 'potion', potion: this.rollPotion(), x: it.x, z: it.z + 1, label: 'Potion', amount: 1 });
    if (tier >= 1) this.addPickup({ kind: 'dust', x: it.x + 1, z: it.z, amount: r.int(3, 6), label: 'Glyph dust' });
    this.ch.lootState = r.state;
  }

  // ------------------------------------------------------------ commands
  cmdMove(x: number, z: number) {
    if (this.player.dead || this.paused) return;
    this.player.attackTarget = 0;
    commandMove(this, x, z);
  }
  cmdAttack(id: number) {
    const p = this.player;
    if (p.dead) return;
    p.attackTarget = id;
    p.interactTarget = null;
    p.moveTarget = null;
  }
  cmdSkill(slot: HotbarSlot, x: number, z: number, targetId = 0) {
    const p = this.player;
    if (p.dead) return;
    const id = slotSkill(this, slot);
    if (!id) {
      this.toast('No skill assigned to that slot. Press K to learn and assign skills.', 'info');
      return;
    }
    if (p.cast && p.cast.t < p.cast.total * 0.55) {
      p.queued = { slot, x, z, targetId };
      return;
    }
    if (p.dash) return;
    beginCast(this, id, x, z, targetId);
  }
  cmdBasic(x: number, z: number, targetId = 0) {
    const p = this.player;
    if (p.dead || p.cast || p.dash) return;
    const id = slotSkill(this, 'basic');
    if (id) beginCast(this, id, x, z, targetId, true);
  }
  /** Closest thing the F key would act on: interactable first, then item pickups. */
  nearestUsable(): { kind: 'interact' | 'pickup'; id: string | number; label: string } | null {
    const p = this.player;
    let best: { kind: 'interact' | 'pickup'; id: string | number; label: string } | null = null;
    let bd = 1e9;
    for (const it of this.zone.interactables) {
      if (it.hidden) continue;
      const d = Math.hypot(it.x - p.x, it.z - p.z);
      if (d < it.r + 2.4 && d < bd) {
        bd = d;
        best = { kind: 'interact', id: it.id, label: it.label };
      }
    }
    for (const k of this.pickups) {
      if (k.dead || k.kind === 'gold' || k.kind === 'dust' || k.kind === 'echo') continue;
      const d = Math.hypot(k.x - p.x, k.z - p.z);
      if (d < 3 && d < bd) {
        bd = d;
        best = { kind: 'pickup', id: k.id, label: k.label };
      }
    }
    return best;
  }
  cmdStopMove() {
    const p = this.player;
    if (!p.channel) p.path = null;
  }

  cmdEvade(x: number, z: number) {
    beginEvade(this, x, z);
  }
  cmdPotion(kind: PotionKind) {
    usePotion(this, kind);
  }
  cmdStop() {
    const p = this.player;
    p.path = null;
    p.moveTarget = null;
    p.attackTarget = 0;
  }
  cmdTownGate() {
    const p = this.player;
    if (p.dead) return;
    if (this.zone.kind === 'refuge') {
      this.toast('You are already in the Refuge.', 'info');
      return;
    }
    if (this.zone.kind === 'hunt') {
      this.toast('The town gate will not open during a Target Hunt.', 'warn');
      return;
    }
    if (p.channel) {
      p.channel = null;
      this.toast('Town gate cancelled', 'info');
      return;
    }
    p.channel = { t: 0, dur: 3.0 };
    p.path = null;
    p.moveTarget = null;
    this.toast('Channeling the town gate... (damage or movement interrupts)', 'info');
    this.events.push({ t: 'sfx', id: 'channel' });
  }
  cmdTravel(wid: string) {
    if (!this.ch.waypoints.includes(wid)) return;
    if (this.zone.kind === 'hunt') {
      this.toast('Waypoints are unavailable during a Target Hunt.', 'warn');
      return;
    }
    if (this.boss && this.boss.boss_state?.engaged) {
      this.toast('You cannot travel during a boss fight.', 'warn');
      return;
    }
    const info = WAYPOINT_INFO[wid];
    this.zones.get(this.zone.id);
    const target = this.zones.get(info.zone)?.zone;
    let at: { x: number; z: number } | undefined;
    if (target) {
      const a = target.anchors.waypoint;
      if (a) at = { x: a.x, z: a.z + 2.6 };
    }
    this.ch.lastWaypoint = wid;
    this.enterZone(info.zone, at);
    if (!at) {
      const t2 = this.zone;
      const a = t2.anchors.waypoint;
      if (a) {
        const pos = depenetrate(t2.grid, a.x, a.z + 2.6, this.player.r);
        this.player.x = this.player.px = pos.x;
        this.player.z = this.player.pz = pos.z;
      }
    }
  }
  setStandStill(v: boolean) {
    this.player.standStill = v;
  }

  startHunt(boss: 'toll_keeper' | 'orison_engine') {
    if (!this.ch.actComplete) return;
    this.zones.delete('hunt_toll');
    this.zones.delete('hunt_engine');
    this.huntBoss = boss;
    this.huntT0 = this.time;
    this.enterZone(boss === 'toll_keeper' ? 'hunt_toll' : 'hunt_engine');
    this.huntT0 = this.time;
    this.toast(`Target Hunt: ${boss === 'toll_keeper' ? 'The Toll-Keeper' : 'The Orison Engine'}. The clock is running.`, 'quest');
  }

  newExpedition(diff: 'normal' | 'veteran') {
    const ch = this.ch;
    if (diff === 'veteran' && !ch.veteranUnlocked) return;
    ch.expedition++;
    ch.difficulty = diff;
    ch.seed = ch.seed;
    this.zones.clear();
    this.returnPoint = null;
    ch.waypoints = ['refuge'];
    ch.quests = { artificer: ch.flags.artificerRescued ? 'done' : undefined } as Character['quests'];
    if (!ch.flags.artificerRescued) delete ch.quests.artificer;
    ch.actComplete = false;
    ch.flags.tollDead = false;
    this.lootRng = new Rng(seedFrom('loot', ch.seed, ch.expedition));
    this.runStart = this.time;
    this.summary = null;
    this.enterZone('refuge', { x: 24, z: 22 });
    this.toast(`New expedition begins (${diff === 'veteran' ? 'Veteran' : 'Normal'}). The March has shifted.`, 'quest');
    this.restockVendor();
    this.autosaveNeeded = true;
  }

  // ------------------------------------------------------------ death & respawn
  private killPlayer(cause: string, dtype: DamageType) {
    const p = this.player;
    if (p.dead) return;
    const ch = this.ch;
    p.dead = true;
    p.hp = 0;
    p.cast = null;
    p.dash = null;
    p.path = null;
    p.channel = null;
    ch.stats.deaths++;
    let lost = 0;
    if (ch.echo) {
      // dying again moves the Echo without compounding the loss
      ch.echo = { zone: this.zone.id, x: p.x, z: p.z, gold: ch.echo.gold };
      this.zr.pickups = this.zr.pickups.filter((k) => k.kind !== 'echo');
      for (const zr of this.zones.values()) if (zr !== this.zr) zr.pickups = zr.pickups.filter((k) => k.kind !== 'echo');
      lost = ch.echo.gold;
    } else {
      lost = Math.floor(ch.gold * 0.1);
      ch.gold -= lost;
      ch.echo = { zone: this.zone.id, x: p.x, z: p.z, gold: lost };
    }
    this.addPickup({ kind: 'echo', x: p.x, z: p.z, amount: ch.echo.gold, label: 'Echo' });
    for (const it of equippedItems(ch.equip)) it.dur = Math.max(0, Math.round((it.dur - it.durMax * 0.05) * 10) / 10);
    this.recompute();
    this.deathInfo = { cause, dtype, echo: lost };
    this.events.push({ t: 'death', cause, dtype });
    this.events.push({ t: 'sfx', id: 'playerDie' });
    this.events.push({ t: 'music', mode: 'death' });
    this.resetBosses();
  }

  private resetBosses() {
    this.boss = null;
    this.hazards = this.hazards.filter((h) => false);
    this.projectiles = [];
    for (const e of this.enemies) {
      if (e.boss && e.alive) {
        const s = e.boss_state!;
        e.hp = e.maxHp;
        e.boss_state = newBossState(e.type, e.maxHp, this.ch.difficulty === 'veteran');
        e.state = 'dormant';
        e.aggro = false;
        e.atk = null;
        e.effects = [];
        const a = this.zone.bossArena!;
        e.x = a.x;
        e.z = a.z;
        void s;
      }
      if (e.alive && (e.type === 'lantern' || e.type === 'scribe_repair' || e.type === 'conduit' || e.pack === 'boss')) {
        if (!e.boss) e.alive = false;
        e.fadeT = 0.01;
      }
    }
  }

  respawn() {
    const p = this.player;
    if (!p.dead) return;
    const ch = this.ch;
    const wid = ch.lastWaypoint && ch.waypoints.includes(ch.lastWaypoint) ? ch.lastWaypoint : 'refuge';
    p.dead = false;
    p.effects = [];
    p.cds = {};
    this.recompute();
    p.hp = p.maxHp;
    p.focus = p.maxFocus * 0.5;
    p.heat = 0;
    p.evadeCharges = 3;
    if (this.zone.kind === 'hunt') {
      this.huntBoss = null;
      this.zones.delete('hunt_toll');
      this.zones.delete('hunt_engine');
      this.enterZone('refuge', { x: 24, z: 24 });
    } else {
      this.cmdTravel(wid);
    }
    this.deathInfo = null;
    this.toast('You awaken at your last waypoint. Your Echo lingers where you fell.', 'info');
  }

  // ------------------------------------------------------------ economy actions
  invAdd(it: Item): boolean {
    return this.ch.inv.add(it);
  }

  equip(uid: string, prefer?: SlotId): { ok: boolean; reason?: string } {
    const ch = this.ch;
    const placed = ch.inv.get(uid);
    if (!placed) return { ok: false, reason: 'Item not found' };
    const it = placed.item;
    const slot = targetSlot(it, ch.equip, prefer);
    if (!slot) return { ok: false, reason: 'Cannot be equipped' };
    const plan = planEquip(it, slot, ch.equip, ch.cls);
    if (!plan.ok) return { ok: false, reason: plan.reason };
    // check room: remove the item first so its own cells are free
    ch.inv.remove(uid);
    const added: Item[] = [];
    for (const d of plan.displaced) {
      if (!ch.inv.add(d)) {
        // roll back
        for (const a of added) ch.inv.remove(a.uid);
        ch.inv.place(it, placed.x, placed.y) || ch.inv.add(it);
        return { ok: false, reason: 'Not enough inventory space for swapped items' };
      }
      added.push(d);
    }
    for (const d of plan.displaced) for (const s of Object.keys(ch.equip) as SlotId[]) if (ch.equip[s]?.uid === d.uid) delete ch.equip[s];
    ch.equip[slot] = it;
    this.recompute();
    this.events.push({ t: 'sfx', id: 'equip' });
    return { ok: true };
  }

  unequip(slot: SlotId): { ok: boolean; reason?: string } {
    const it = this.ch.equip[slot];
    if (!it) return { ok: false };
    if (!this.ch.inv.add(it)) return { ok: false, reason: 'Inventory full' };
    delete this.ch.equip[slot];
    this.recompute();
    return { ok: true };
  }

  canDestroy(it: Item): { ok: boolean; reason?: string; confirm?: boolean } {
    if (it.favorite) return { ok: false, reason: 'Favorited items are protected. Unfavorite first.' };
    if (Object.values(this.ch.equip).some((e) => e?.uid === it.uid)) return { ok: false, reason: 'Unequip the item first.' };
    if (it.rarity === 'relic' || it.rarity === 'inscribed') return { ok: true, confirm: true };
    return { ok: true };
  }

  dropFromInventory(uid: string): boolean {
    const p = this.ch.inv.get(uid);
    if (!p || !this.canDestroy(p.item).ok) return false;
    this.ch.inv.remove(uid);
    const s = this.scatter(this.player.x, this.player.z, 0);
    this.addPickup({ kind: 'item', x: s.x, z: s.z, item: p.item, label: p.item.name });
    return true;
  }

  sellItem(uid: string): boolean {
    const p = this.ch.inv.get(uid);
    if (!p || !this.canDestroy(p.item).ok) return false;
    this.ch.inv.remove(uid);
    this.ch.gold += sellValue(p.item);
    this.events.push({ t: 'sfx', id: 'coin' });
    return true;
  }

  buyItem(idx: number): { ok: boolean; reason?: string } {
    const it = this.vendorStock[idx];
    if (!it) return { ok: false };
    const price = Math.round(itemValue(it) * 1.4);
    if (this.ch.gold < price) return { ok: false, reason: 'Not enough gold' };
    if (!this.ch.inv.add(it)) return { ok: false, reason: 'Inventory full' };
    this.ch.gold -= price;
    this.vendorStock.splice(idx, 1);
    this.events.push({ t: 'sfx', id: 'coin' });
    return { ok: true };
  }

  buyPotion(kind: PotionKind): { ok: boolean; reason?: string } {
    const ch = this.ch;
    const price = POTIONS[kind].price;
    if (ch.belt[kind] >= ch.beltCap) return { ok: false, reason: 'Belt stack is full' };
    if (ch.gold < price) return { ok: false, reason: 'Not enough gold' };
    ch.gold -= price;
    ch.belt[kind]++;
    this.events.push({ t: 'sfx', id: 'coin' });
    return { ok: true };
  }

  restockVendor() {
    const rng = new Rng(seedFrom('vendor', this.ch.seed, this.ch.expedition, this.ch.level, this.ch.stats.kills >> 4));
    this.vendorSeed++;
    this.vendorStock = [];
    const ilvl = Math.max(1, this.ch.level + 1);
    for (let i = 0; i < 8; i++) {
      this.vendorStock.push(generateItem(rng, ilvl, { cls: this.ch.cls, rarity: i < 4 ? 'worn' : 'tempered', identified: true }));
    }
  }

  salvage(uid: string): { ok: boolean; reason?: string } {
    const ch = this.ch;
    if (!ch.flags.artificerRescued) return { ok: false, reason: 'Rescue the Artificer first' };
    const p = ch.inv.get(uid);
    if (!p) return { ok: false };
    const c = this.canDestroy(p.item);
    if (!c.ok) return { ok: false, reason: c.reason };
    ch.inv.remove(uid);
    ch.dust += salvageDust(p.item);
    this.events.push({ t: 'sfx', id: 'salvage' });
    return { ok: true };
  }

  identify(uid: string): { ok: boolean; reason?: string } {
    const ch = this.ch;
    const it = ch.inv.get(uid)?.item ?? Object.values(ch.equip).find((e) => e?.uid === uid);
    if (!it) return { ok: false };
    if (it.identified) return { ok: false, reason: 'Already identified' };
    const cost = identifyCost(it);
    if (ch.gold < cost) return { ok: false, reason: 'Not enough gold' };
    ch.gold -= cost;
    it.identified = true;
    this.recompute();
    this.events.push({ t: 'sfx', id: 'identify' });
    return { ok: true };
  }

  reroll(uid: string, affixIdx: number): { ok: boolean; reason?: string } {
    const ch = this.ch;
    const it = ch.inv.get(uid)?.item ?? Object.values(ch.equip).find((e) => e?.uid === uid);
    if (!it || !it.identified) return { ok: false, reason: 'Identify the item first' };
    if (it.rarity === 'worn') return { ok: false, reason: 'Worn items have no modifiers' };
    const a = it.affixes[affixIdx];
    if (!a) return { ok: false };
    const cost = rerollCost(it);
    if (ch.gold < cost.gold || ch.dust < cost.dust) return { ok: false, reason: 'Not enough gold or dust' };
    const base = BASE_BY_ID[it.base];
    const taken = it.affixes.filter((_, i) => i !== affixIdx);
    const type = AFFIX_BY_ID[a.id].type;
    const rng = new Rng(seedFrom('reroll', ch.seed, it.uid, it.rerolls));
    const nr = rollAffix(rng, base.group, ch.cls, it.ilvl, taken, it.rarity === 'inscribed' || it.rarity === 'relic', type) ?? rollAffix(rng, base.group, ch.cls, it.ilvl, taken, true);
    if (!nr) return { ok: false, reason: 'No valid modifier available' };
    ch.gold -= cost.gold;
    ch.dust -= cost.dust;
    it.affixes[affixIdx] = nr;
    it.rerolls++;
    this.recompute();
    this.events.push({ t: 'sfx', id: 'craft' });
    return { ok: true };
  }

  addSocket(uid: string): { ok: boolean; reason?: string } {
    const ch = this.ch;
    const it = ch.inv.get(uid)?.item ?? Object.values(ch.equip).find((e) => e?.uid === uid);
    if (!it) return { ok: false };
    if (it.sockets.length >= it.socketCap) return { ok: false, reason: 'No more sockets allowed on this item' };
    const cost = socketCost(it);
    if (ch.gold < cost.gold || ch.dust < cost.dust) return { ok: false, reason: 'Not enough gold or dust' };
    ch.gold -= cost.gold;
    ch.dust -= cost.dust;
    it.sockets.push(null);
    this.events.push({ t: 'sfx', id: 'craft' });
    return { ok: true };
  }

  socketGlyph(glyphUid: string, itemUid: string): { ok: boolean; reason?: string } {
    const ch = this.ch;
    const g = ch.inv.get(glyphUid)?.item;
    const it = ch.inv.get(itemUid)?.item ?? Object.values(ch.equip).find((e) => e?.uid === itemUid);
    if (!g || !it || BASE_BY_ID[g.base].group !== 'glyph') return { ok: false };
    const idx = it.sockets.findIndex((s) => !s);
    if (idx < 0) return { ok: false, reason: 'No empty socket' };
    it.sockets[idx] = g.base;
    ch.inv.remove(glyphUid);
    this.recompute();
    this.events.push({ t: 'sfx', id: 'craft' });
    return { ok: true };
  }

  combineGlyphs(baseId: string): { ok: boolean; reason?: string } {
    const ch = this.ch;
    const b = BASE_BY_ID[baseId];
    if (!b || b.group !== 'glyph' || b.tier >= 3) return { ok: false, reason: 'Cannot combine' };
    const matches = ch.inv.items().filter((i) => i.base === baseId);
    if (matches.length < 3) return { ok: false, reason: 'Need three matching glyphs' };
    for (let i = 0; i < 3; i++) ch.inv.remove(matches[i].uid);
    const type = baseId.split('_')[1];
    const out = makeGlyph(type, b.tier + 1);
    if (!ch.inv.add(out)) {
      ch.inv.add(matches[0]);
      return { ok: false, reason: 'Inventory full' };
    }
    this.events.push({ t: 'sfx', id: 'craft' });
    return { ok: true };
  }

  repairAll(): { ok: boolean; reason?: string; cost: number } {
    const ch = this.ch;
    const items = equippedItems(ch.equip);
    const cost = items.reduce((s, i) => s + repairCost(i), 0);
    if (cost <= 0) return { ok: false, reason: 'Nothing to repair', cost: 0 };
    if (ch.gold < cost) return { ok: false, reason: 'Not enough gold', cost };
    ch.gold -= cost;
    for (const i of items) i.dur = i.durMax;
    this.recompute();
    this.events.push({ t: 'sfx', id: 'craft' });
    return { ok: true, cost };
  }

  toggleFavorite(uid: string) {
    const it = this.ch.inv.get(uid)?.item ?? Object.values(this.ch.equip).find((e) => e?.uid === uid);
    if (it) it.favorite = !it.favorite;
  }

  moveToStash(uid: string): boolean {
    const p = this.ch.inv.get(uid);
    if (!p) return false;
    if (!this.ch.stash.add(p.item)) return false;
    this.ch.inv.remove(uid);
    return true;
  }
  moveFromStash(uid: string): boolean {
    const p = this.ch.stash.get(uid);
    if (!p) return false;
    if (!this.ch.inv.add(p.item)) return false;
    this.ch.stash.remove(uid);
    return true;
  }

  spendAttribute(a: 'might' | 'finesse' | 'will' | 'vigor') {
    if (spendAttr(this.ch, a)) this.recompute();
  }
  learnSkill(id: string): boolean {
    const ok = rankUp(this.ch, id);
    if (ok) {
      this.recompute();
      this.tutorial('skillpoint', true);
      this.events.push({ t: 'sfx', id: 'ui' });
    }
    return ok;
  }
  respec(): boolean {
    const ok = respecAll(this.ch);
    if (ok) {
      this.recompute();
      this.player.cds = {};
    }
    return ok;
  }
  assign(slot: HotbarSlot, id: string | null) {
    assignHotbar(this.ch, slot, id);
  }
  saveLoadoutSlot(i: number) {
    saveLoadout(this.ch, i);
  }
  applyLoadoutSlot(i: number): boolean {
    const ok = applyLoadout(this.ch, i);
    if (ok) this.recompute();
    return ok;
  }

  // ------------------------------------------------------------ main step
  revealAround() {
    const z = this.zone;
    const p = this.player;
    const cx = Math.floor(p.x);
    const cz = Math.floor(p.z);
    const R = 11;
    for (let dz = -R; dz <= R; dz++)
      for (let dx = -R; dx <= R; dx++) {
        if (dx * dx + dz * dz > R * R) continue;
        const x = cx + dx;
        const zz = cz + dz;
        if (x < 0 || zz < 0 || x >= z.w || zz >= z.h) continue;
        z.explored[zz * z.w + x] = 1;
      }
  }

  step(dt: number) {
    if (this.paused) return;
    this.time += dt;
    this.tickN++;
    this.ch.stats.time += dt;
    const p = this.player;
    p.px = p.x;
    p.pz = p.z;
    p.hitFlash = Math.max(0, p.hitFlash - dt);
    // buff-derived recompute
    const tonic = getEffect(p, 'tonic');
    if (this.blessingT > 0) this.blessingT -= dt;
    const key = `${tonic ? 1 : 0}${this.blessingT > 0 ? 1 : 0}`;
    if (key !== this.buffKey) this.recompute();
    if (p.dead) {
      p.reviveT += dt;
      updateHazards(this, dt);
      for (const e of this.enemies) e.px = e.x, e.pz = e.z;
      updateEnemies(this, dt);
      return;
    }
    this.updatePlayer(dt);
    updateEnemies(this, dt);
    this.updateStandards(dt);
    this.updateTraps(dt);
    this.updateAmbush(dt);
    updateHazards(this, dt);
    updateProjectiles(this, dt);
    this.updatePickups(dt);
    if (this.tickN % 6 === 0) this.revealAround();
    if (this.tickN % 8 === 0) {
      this.dummyLog.push([this.time, this.dummyDamage]);
      while (this.dummyLog.length && this.time - this.dummyLog[0][0] > 6) this.dummyLog.shift();
    }
    // boss bookkeeping: boss fight reset if the player leaves the arena far behind? (not needed)
  }

  dummyDps(): number {
    if (this.dummyLog.length < 2) return 0;
    const a = this.dummyLog[0];
    const b = this.dummyLog[this.dummyLog.length - 1];
    const dt = b[0] - a[0];
    return dt > 0.3 ? (b[1] - a[1]) / dt : 0;
  }

  private updateStandards(dt: number) {
    for (const s of this.standards) {
      s.t += dt;
      s.tauntT -= dt;
      if (s.tauntT <= 0) {
        s.tauntT = s.taunt > 0 ? 3 : 99;
        for (const e of this.enemies) {
          if (!e.alive || e.neutral || e.boss || e.elite || e.def.role === 'bruiser') continue;
          if (Math.hypot(e.x - s.x, e.z - s.z) < s.taunt) e.tauntT = 2.2;
        }
        this.events.push({ t: 'fx', id: 'taunt', x: s.x, z: s.z, r: s.taunt, color: 0xffd56a });
      }
    }
    this.standards = this.standards.filter((s) => s.t < s.dur);
  }

  private trapState = new Map<string, number>();
  private updateTraps(dt: number) {
    const z = this.zone;
    if (!z.traps.length) return;
    const p = this.player;
    for (let i = 0; i < z.traps.length; i++) {
      const t = z.traps[i];
      const phase = ((this.time + t.phase) % t.period) / t.period; // 0..1
      const key = `${z.id}:${i}`;
      const prev = this.trapState.get(key) ?? 0;
      const state = phase > 0.72 && phase < 0.9 ? 1 : phase >= 0.9 ? 2 : 0; // 1 = warning, 2 = spikes up
      if (state === 2 && prev !== 2) {
        if (Math.hypot(p.x - t.x, p.z - t.z) < t.r + p.r * 0.5 && !p.dead) {
          this.hurtPlayer({ phys: 12 * (1 + 0.15 * (z.level - 1)) }, { name: 'Spike Trap' });
        }
        for (const e of this.enemies) if (e.alive && !e.neutral && Math.hypot(e.x - t.x, e.z - t.z) < t.r + e.r * 0.5) dmgToEnemy(this, e, { phys: 20 * (1 + 0.15 * (z.level - 1)) }, { fromX: t.x, fromZ: t.z, env: true });
        this.events.push({ t: 'sfx', id: 'spike', x: t.x, z: t.z, vol: 0.5 });
      }
      this.trapState.set(key, state);
    }
    void dt;
  }

  private updatePickups(dt: number) {
    const p = this.player;
    const list = this.zr.pickups;
    for (const k of list) {
      if (k.dead) continue;
      k.age += dt;
      const d = Math.hypot(k.x - p.x, k.z - p.z);
      let auto = false;
      if (k.kind === 'gold' || k.kind === 'dust' || k.kind === 'echo') auto = true;
      if (k.kind === 'potion' && k.potion && this.ch.belt[k.potion] < this.ch.beltCap) auto = true;
      if (auto && d < 2.2 && k.age > 0.4) k.magnet = true;
      if (k.magnet) {
        const a = Math.atan2(p.z - k.z, p.x - k.x);
        const sp = 12;
        k.x += Math.cos(a) * sp * dt;
        k.z += Math.sin(a) * sp * dt;
        if (d < 0.6) this.collect(k);
      }
    }
    for (let i = list.length - 1; i >= 0; i--) if (list[i].dead) list.splice(i, 1);
  }

  collect(k: Pickup): boolean {
    const ch = this.ch;
    switch (k.kind) {
      case 'gold':
        ch.gold += k.amount;
        this.events.push({ t: 'pickup', kind: 'gold', text: `+${k.amount} gold` });
        this.events.push({ t: 'sfx', id: 'coin' });
        break;
      case 'dust':
        ch.dust += k.amount;
        this.events.push({ t: 'pickup', kind: 'dust', text: `+${k.amount} glyph dust` });
        this.events.push({ t: 'sfx', id: 'coin' });
        break;
      case 'potion': {
        const kind = k.potion!;
        if (ch.belt[kind] >= ch.beltCap) {
          this.toast('Potion belt is full for that potion.', 'warn');
          return false;
        }
        ch.belt[kind]++;
        this.events.push({ t: 'pickup', kind: 'potion', text: POTIONS[kind].name });
        this.events.push({ t: 'sfx', id: 'potionPick' });
        break;
      }
      case 'echo': {
        ch.gold += k.amount;
        ch.echo = null;
        this.blessingT = 240;
        this.recompute();
        this.toast(`Echo reclaimed: +${k.amount} gold and an 8% maximum health blessing for 4 minutes.`, 'quest');
        this.events.push({ t: 'sfx', id: 'echo' });
        break;
      }
      case 'item': {
        const it = k.item!;
        if (!ch.inv.add(it)) {
          this.toast('Inventory full - make room first.', 'warn');
          this.events.push({ t: 'sfx', id: 'invalid' });
          return false;
        }
        this.events.push({ t: 'pickup', kind: 'item', text: it.name, rarity: it.rarity });
        this.events.push({ t: 'sfx', id: 'pickup' });
        break;
      }
    }
    k.dead = true;
    return true;
  }

  private updatePlayer(dt: number) {
    const p = this.player;
    const ch = this.ch;
    const d = this.d;
    p.lastStandCd = Math.max(0, p.lastStandCd - dt);
    // timers
    for (const k of Object.keys(p.cds)) p.cds[k] = Math.max(0, p.cds[k] - dt);
    for (const k of Object.keys(p.potionCd)) p.potionCd[k] = Math.max(0, p.potionCd[k] - dt);
    for (const k of Object.keys(p.chargeT)) {
      if (p.chargeT[k] > 0) {
        p.chargeT[k] -= dt;
        if (p.chargeT[k] <= 0) {
          const sk = SKILL_BY_ID[k];
          p.charges[k] = Math.min(sk.charges ?? 1, (p.charges[k] ?? 0) + 1);
          if ((p.charges[k] ?? 0) < (sk.charges ?? 1)) p.chargeT[k] = sk.cooldown * (1 - d.cdr / 100);
        }
      }
    }
    if (p.evadeCharges < 3) {
      p.evadeRecharge -= dt;
      if (p.evadeRecharge <= 0) {
        p.evadeCharges++;
        p.evadeRecharge = p.evadeCharges < 3 ? 2.8 / (1 + d.evadeRec / 100) : 0;
        this.events.push({ t: 'sfx', id: 'evadeReady', vol: 0.3 });
      }
    }
    p.evadeT = Math.max(0, p.evadeT - dt);
    p.inCombat = Math.max(0, p.inCombat - dt);
    tickEffects(this, p, dt, true);
    if (p.hp <= 0 || p.dead) return;
    // regen
    if (d.hpRegen > 0) p.hp = Math.min(p.maxHp, p.hp + d.hpRegen * dt);
    p.focus = Math.min(p.maxFocus, p.focus + d.focusRegen * dt * (p.inCombat > 0 ? 0.6 : 1.4));
    // heat
    if (ch.cls === 'cinder') {
      p.heatIdle += dt;
      if (hasEffect(p, 'furnace')) {
        p.heat = Math.max(0, p.heat - 6 * dt * (d.flags.crucible ? 1.3 : 1));
        if (p.heat <= 0) {
          removeEffect(p, 'furnace');
          this.toast('Furnace Heart burns out.', 'info');
        }
        p.heatIdle = 0;
      } else if (p.heatIdle > 4 && p.heat > 0) p.heat = Math.max(0, p.heat - 3 * dt);
      if (d.flags.crucible && p.heat >= 100) this.crucibleNova();
    }
    // channel
    if (p.channel) {
      p.channel.t += dt;
      if (p.path && p.path.length) {
        p.channel = null;
        this.toast('Town gate interrupted by movement', 'warn');
      } else if (p.channel.t >= p.channel.dur) {
        p.channel = null;
        this.returnPoint = { zone: this.zone.id, x: p.x, z: p.z };
        this.events.push({ t: 'sfx', id: 'townGate' });
        this.enterZone('refuge', { x: 21, z: 22 });
        this.toast('You step through the town gate. A return portal waits in the Refuge.', 'quest');
        return;
      }
    }
    // interaction approach
    if (p.interactTarget && !p.cast) this.processInteractTarget(dt);
    // attack target approach
    if (!p.interactTarget && p.attackTarget && !p.cast) this.processAttackTarget(dt);
    updateCast(this, dt);
    updatePlayerMovement(this, dt);
    if (p.invalidT > 0) p.invalidT -= dt;
    if (p.cast && p.cast.t >= p.cast.move && p.path && p.path.length) {
      p.cast = null;
      p.castSkill = null;
    }
    if (this.tickN % 3 === 0) this.checkTutorialTriggers();
  }

  private checkTutorialTriggers() {
    // nothing polled here; tutorial steps fire from commands
  }

  private repathT = 0;
  private processInteractTarget(dt: number) {
    const p = this.player;
    const id = p.interactTarget!;
    if (id.startsWith('pk:')) {
      const pid = Number(id.slice(3));
      const k = this.pickups.find((x) => x.id === pid && !x.dead);
      if (!k) {
        p.interactTarget = null;
        return;
      }
      const d = Math.hypot(k.x - p.x, k.z - p.z);
      if (d < 1.5) {
        this.collect(k);
        p.interactTarget = null;
        p.path = null;
      } else this.walkToward(k.x, k.z, dt);
      return;
    }
    const it = this.interactableById(id);
    if (!it || it.hidden) {
      p.interactTarget = null;
      return;
    }
    if (this.playerNear(it)) {
      p.interactTarget = null;
      p.path = null;
      p.facing = Math.atan2(it.z - p.z, it.x - p.x);
      this.performInteract(it);
    } else this.walkToward(it.x, it.z, dt);
  }

  private walkToward(x: number, z: number, dt: number) {
    const p = this.player;
    this.repathT -= dt;
    if (!p.path || p.path.length === 0 || this.repathT <= 0) {
      this.repathT = 0.4;
      commandMoveKeep(this, x, z);
    }
  }

  private processAttackTarget(dt: number) {
    const p = this.player;
    const t = this.enemies.find((e) => e.id === p.attackTarget);
    if (!t || !t.alive) {
      p.attackTarget = 0;
      return;
    }
    const basic = CLASS_SKILLS[this.ch.cls][0];
    const d = Math.hypot(t.x - p.x, t.z - p.z);
    const melee = basic.id === 'iron_litany';
    const range = basic.range + (melee ? t.r * 0.7 : t.r) + (melee && this.d.twoHanded ? 0.3 : 0);
    const sight = lineClear(this.zone.grid, p.x, p.z, t.x, t.z, 0, true);
    if (d <= range && sight) {
      p.path = null;
      if (skillReady(this, basic.id).ok) beginCast(this, basic.id, t.x, t.z, t.id, true);
      else p.facing = Math.atan2(t.z - p.z, t.x - p.x);
    } else if (!p.standStill) this.walkToward(t.x, t.z, dt);
    else p.facing = Math.atan2(t.z - p.z, t.x - p.x);
  }

  // ------------------------------------------------------------ utility for UI
  nearestEnemyTo(x: number, z: number, maxD: number): Enemy | null {
    let best: Enemy | null = null;
    let bd = maxD;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const d = Math.hypot(e.x - x, e.z - z) - e.r * 0.5;
      if (d < bd) {
        bd = d;
        best = e;
      }
    }
    return best;
  }

  potionCap() {
    return this.ch.beltCap;
  }

  skillTooltipDamage(id: string): number {
    const sk = SKILL_BY_ID[id];
    if (!sk) return 0;
    const rank = Math.max(1, effectiveRank(this.ch, this.d, id));
    let sum = 0;
    for (const t of ['phys', 'ember', 'frost', 'blight'] as DamageType[]) {
      const c = sk.dmg[t];
      if (!c) continue;
      const inc = 1 + ((this.d.raw.dmgPct ?? 0) + (this.d.raw[`dmg${t[0].toUpperCase()}${t.slice(1)}Pct`] ?? 0)) / 100;
      sum += this.d.weaponPool * c * inc * (1 + 0.12 * (rank - 1));
    }
    return sum;
  }
}

function commandMoveKeep(g: Game, x: number, z: number) {
  const p = g.player;
  const prevTarget = p.interactTarget;
  const prevAtk = p.attackTarget;
  commandMove(g, x, z);
  p.interactTarget = prevTarget;
  p.attackTarget = prevAtk;
}

export function formatTime(t: number): string {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export { circleBlocked, FLOOR, AFFIXES, GLYPH_TYPES, makeItem, rollAffixValue, nextUid, canUse, sellValue };
