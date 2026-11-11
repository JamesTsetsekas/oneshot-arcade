// Character model: attributes, skill ranks, derived stats, progression. Pure logic.
import { BASE_BY_ID, POTION_BASE_CAP } from '../data/items';
import { CLASSES, CLASS_SKILLS, MAX_LEVEL, PASSIVE_BY_ID, PASSIVES, SKILL_BY_ID, SKILL_MAX_RANK, respecCost, xpForLevel } from '../data/skills';
import { Inventory, type Equipment } from './inventory';
import { addStat, itemStats, makeItem } from './loot';
import type { ClassId, Difficulty, Item, PotionKind, SlotId, Stats } from './types';
import { SLOT_IDS } from './types';

export type HotbarSlot = 'rmb' | 'q' | 'w' | 'e' | 'r';
export const HOTBAR_SLOTS: HotbarSlot[] = ['rmb', 'q', 'w', 'e', 'r'];

export type QuestStatus = 'locked' | 'active' | 'done';

export interface Loadout {
  name: string;
  ranks: Record<string, number>;
  hotbar: Record<HotbarSlot, string | null>;
}

export interface Character {
  id: string;
  name: string;
  cls: ClassId;
  look: { body: number; voice: number };
  level: number;
  xp: number;
  attrs: { might: number; finesse: number; will: number; vigor: number };
  attrPoints: number;
  skillPoints: number;
  ranks: Record<string, number>;
  hotbar: Record<HotbarSlot, string | null>;
  inv: Inventory;
  stash: Inventory;
  equip: Equipment;
  belt: Record<PotionKind, number>;
  beltCap: number;
  gold: number;
  dust: number;
  quests: Record<string, QuestStatus>;
  flags: Record<string, boolean>;
  waypoints: string[];
  difficulty: Difficulty;
  actComplete: boolean;
  veteranUnlocked: boolean;
  seed: number;
  expedition: number;
  relicPity: number;
  loadouts: Loadout[];
  stats: { kills: number; deaths: number; items: number; bestRarity: string; time: number; bossKills: number };
  echo: { zone: string; x: number; z: number; gold: number } | null;
  tutorial: Record<string, boolean>;
  createdAt: number;
  lootState?: number;
  records?: Record<string, number>;
  lastWaypoint?: string;
}

export function newCharacter(name: string, cls: ClassId, look: { body: number; voice: number }, seed: number): Character {
  const cd = CLASSES[cls];
  const ch: Character = {
    id: `ch_${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`,
    name,
    cls,
    look,
    level: 1,
    xp: 0,
    attrs: { ...cd.attrs },
    attrPoints: 0,
    skillPoints: 1,
    ranks: {},
    hotbar: { rmb: null, q: null, w: null, e: null, r: null },
    inv: new Inventory(10, 6),
    stash: new Inventory(10, 8),
    equip: {},
    belt: { health: 3, focus: 1, cleanse: 0, tonic: 0 },
    beltCap: POTION_BASE_CAP,
    gold: 60,
    dust: 0,
    quests: {},
    flags: {},
    waypoints: ['refuge'],
    difficulty: 'normal',
    actComplete: false,
    veteranUnlocked: false,
    seed,
    expedition: 1,
    relicPity: 0,
    loadouts: [
      { name: 'Loadout A', ranks: {}, hotbar: { rmb: null, q: null, w: null, e: null, r: null } },
      { name: 'Loadout B', ranks: {}, hotbar: { rmb: null, q: null, w: null, e: null, r: null } },
    ],
    stats: { kills: 0, deaths: 0, items: 0, bestRarity: 'worn', time: 0, bossKills: 0 },
    echo: null,
    tutorial: {},
    createdAt: Date.now(),
  };
  const core = cls === 'cinder' ? 'brand_arc' : 'splinter_volley';
  ch.ranks[core] = 1;
  ch.hotbar.rmb = core;
  ch.equip.weapon = makeItem(cd.startWeapon, 1, 'worn', [], true);
  if (cd.startOff) ch.equip.offhand = makeItem(cd.startOff, 1, 'worn', [], true);
  ch.equip.chest = makeItem(cls === 'cinder' ? 'chest_h1' : 'chest_l1', 1, 'worn', [], true);
  return ch;
}

// ------------------------------------------------------------- progression
export function addXp(ch: Character, amount: number): number {
  if (ch.level >= MAX_LEVEL) return 0;
  ch.xp += amount;
  let ups = 0;
  while (ch.level < MAX_LEVEL && ch.xp >= xpForLevel(ch.level)) {
    ch.xp -= xpForLevel(ch.level);
    ch.level++;
    ch.skillPoints++;
    if (ch.level % 2 === 0) ch.attrPoints++;
    ups++;
  }
  if (ch.level >= MAX_LEVEL) ch.xp = 0;
  return ups;
}

export function spendAttr(ch: Character, a: keyof Character['attrs']): boolean {
  if (ch.attrPoints <= 0) return false;
  ch.attrs[a]++;
  ch.attrPoints--;
  return true;
}

export function skillRank(ch: Character, id: string): number {
  return ch.ranks[id] ?? 0;
}

export function canRankUp(ch: Character, id: string): { ok: boolean; reason?: string } {
  if (ch.skillPoints <= 0) return { ok: false, reason: 'No skill points' };
  const sk = SKILL_BY_ID[id];
  if (sk) {
    if (sk.cls !== ch.cls) return { ok: false, reason: 'Wrong class' };
    if (sk.kind === 'basic') return { ok: false, reason: 'Always known' };
    if (ch.level < sk.unlock) return { ok: false, reason: `Requires level ${sk.unlock}` };
    if (skillRank(ch, id) >= SKILL_MAX_RANK) return { ok: false, reason: 'Max rank' };
    return { ok: true };
  }
  const p = PASSIVE_BY_ID[id];
  if (p) {
    if (p.cls !== ch.cls) return { ok: false, reason: 'Wrong class' };
    if (ch.level < p.req) return { ok: false, reason: `Requires level ${p.req}` };
    if (skillRank(ch, id) >= p.maxRank) return { ok: false, reason: 'Max rank' };
    if (p.exclusiveWith && skillRank(ch, p.exclusiveWith) > 0) return { ok: false, reason: 'Excluded by your other capstone' };
    if (p.capstone) {
      const spent = Object.keys(ch.ranks).reduce((n, k) => n + (ch.ranks[k] ?? 0), 0);
      if (spent < 10) return { ok: false, reason: 'Spend 10 points first' };
    }
    return { ok: true };
  }
  return { ok: false, reason: 'Unknown' };
}

export function rankUp(ch: Character, id: string): boolean {
  if (!canRankUp(ch, id).ok) return false;
  ch.ranks[id] = skillRank(ch, id) + 1;
  ch.skillPoints--;
  const sk = SKILL_BY_ID[id];
  if (sk && sk.kind !== 'basic' && !Object.values(ch.hotbar).includes(id)) autoAssign(ch, id);
  return true;
}

function autoAssign(ch: Character, id: string) {
  const sk = SKILL_BY_ID[id];
  const order: HotbarSlot[] = sk.kind === 'core' ? ['rmb', 'q', 'w', 'e', 'r'] : ['q', 'w', 'e', 'r', 'rmb'];
  for (const s of order) {
    if (!ch.hotbar[s]) {
      ch.hotbar[s] = id;
      return;
    }
  }
}

export function canRankDown(ch: Character, id: string): boolean {
  if (skillRank(ch, id) <= 0) return false;
  return true;
}

export function refundCost(ch: Character): number {
  return respecCost(ch.level);
}

export function respecAll(ch: Character): boolean {
  const cost = respecCost(ch.level);
  if (ch.gold < cost) return false;
  ch.gold -= cost;
  const spent = Object.values(ch.ranks).reduce((a, b) => a + b, 0);
  ch.skillPoints += spent;
  ch.ranks = {};
  ch.hotbar = { rmb: null, q: null, w: null, e: null, r: null };
  // refund attribute points as well
  const cd = CLASSES[ch.cls];
  let refunded = 0;
  for (const k of Object.keys(cd.attrs) as (keyof Character['attrs'])[]) {
    refunded += ch.attrs[k] - cd.attrs[k];
    ch.attrs[k] = cd.attrs[k];
  }
  ch.attrPoints += refunded;
  return true;
}

export function saveLoadout(ch: Character, idx: number) {
  const l = ch.loadouts[idx];
  l.ranks = { ...ch.ranks };
  l.hotbar = { ...ch.hotbar };
}
export function applyLoadout(ch: Character, idx: number): boolean {
  const l = ch.loadouts[idx];
  if (Object.keys(l.ranks).length === 0) return false;
  const total = Object.values(ch.ranks).reduce((a, b) => a + b, 0) + ch.skillPoints;
  const need = Object.values(l.ranks).reduce((a, b) => a + b, 0);
  if (need > total) return false;
  ch.ranks = { ...l.ranks };
  ch.hotbar = { ...l.hotbar };
  ch.skillPoints = total - need;
  return true;
}

export function assignHotbar(ch: Character, slot: HotbarSlot, id: string | null) {
  if (id) {
    if (skillRank(ch, id) <= 0 && SKILL_BY_ID[id]?.kind !== 'basic') return;
    for (const s of HOTBAR_SLOTS) if (ch.hotbar[s] === id) ch.hotbar[s] = null;
  }
  ch.hotbar[slot] = id;
}

// ------------------------------------------------------------- derived stats
export interface Derived {
  raw: Stats;
  maxHp: number;
  maxFocus: number;
  armor: number;
  res: { ember: number; frost: number; blight: number };
  critChance: number;
  critMult: number;
  speedMul: number; // attack/cast speed multiplier
  moveSpeed: number;
  weaponMin: number;
  weaponMax: number;
  weaponPool: number; // average weapon damage incl. flat additions
  twoHanded: boolean;
  hasShield: boolean;
  block: number;
  attrs: { might: number; finesse: number; will: number; vigor: number };
  potionPotency: number;
  ailmentChance: number;
  ailmentResist: number;
  cdr: number;
  evadeRec: number;
  hpRegen: number;
  focusRegen: number;
  goldFind: number;
  thorns: number;
  rankAll: number;
  relics: Set<string>;
  flags: Record<string, number>;
}

export function equippedItems(eq: Equipment): Item[] {
  const out: Item[] = [];
  for (const s of SLOT_IDS) if (eq[s]) out.push(eq[s]!);
  return out;
}

export function computeDerived(ch: Character, buffs?: { resAll?: number; dmgPct?: number; hpPct?: number }): Derived {
  const raw: Stats = {};
  const relics = new Set<string>();
  for (const it of equippedItems(ch.equip)) {
    const s = itemStats(it);
    for (const k of Object.keys(s)) addStat(raw, k, s[k]);
    if (it.relic) relics.add(it.relic);
  }
  const wpn = ch.equip.weapon;
  const wb = wpn ? BASE_BY_ID[wpn.base] : null;
  const twoHanded = !!wb?.twoHanded;
  const hasShield = ch.equip.offhand ? BASE_BY_ID[ch.equip.offhand.base].shape === 'shield' : false;
  // passives
  const flags: Record<string, number> = {};
  for (const p of PASSIVES) {
    const r = ch.ranks[p.id] ?? 0;
    if (r <= 0 || p.cls !== ch.cls) continue;
    for (const k of Object.keys(p.perRank)) {
      const v = p.perRank[k] * r;
      if (k === 'twoHandDmg') {
        if (twoHanded) addStat(raw, 'dmgPct', v);
      } else if (k === 'shieldArmorPct') {
        if (hasShield) addStat(raw, 'armorPct', v);
      } else if (['farCrit', 'crucible', 'oath', 'trails', 'patient', 'markDur', 'potionFocus'].includes(k)) {
        flags[k] = (flags[k] ?? 0) + v;
      } else addStat(raw, k, v);
    }
  }
  if (buffs?.hpPct) addStat(raw, 'maxHpPct', buffs.hpPct);
  const a = {
    might: ch.attrs.might + (raw.might ?? 0),
    finesse: ch.attrs.finesse + (raw.finesse ?? 0),
    will: ch.attrs.will + (raw.will ?? 0),
    vigor: ch.attrs.vigor + (raw.vigor ?? 0),
  };
  const g = (k: string) => raw[k] ?? 0;
  const maxHp = Math.round((60 + 10 * a.vigor + 8 * ch.level + g('maxHp')) * (1 + g('maxHpPct') / 100));
  const maxFocus = Math.round(80 + 4 * a.will + g('maxFocus'));
  const armor = Math.round((3 * a.might + 2 * ch.level + g('armor')) * (1 + g('armorPct') / 100));
  const resAll = g('resAll') + (buffs?.resAll ?? 0);
  const cap = (v: number) => Math.max(-100, Math.min(75, v));
  const res = { ember: cap(g('resEmber') + resAll), frost: cap(g('resFrost') + resAll), blight: cap(g('resBlight') + resAll) };
  const critChance = Math.min(60, 5 + 0.2 * a.finesse + g('critChance'));
  const critMult = 1.5 + g('critDamage') / 100;
  const speedMul = 1 + g('speedPct') / 100;
  const moveSpeed = 4.6 * (1 + g('moveSpeedPct') / 100);
  let wmin = 2;
  let wmax = 4;
  if (wb?.dmg) {
    wmin = wb.dmg[0];
    wmax = wb.dmg[1];
  }
  const flat = g('flatPhys') + g('flatEmber') + g('flatFrost') + g('flatBlight');
  const weaponPool = (wmin + wmax) / 2 + flat;
  // derived % damage from attributes folded into raw for easy lookup
  addStat(raw, 'dmgPhysPct', 0.7 * a.might);
  addStat(raw, 'dmgMeleePct', 0.4 * a.might);
  addStat(raw, 'dmgProjPct', 0.6 * a.finesse);
  addStat(raw, 'dmgEmberPct', 0.7 * a.will);
  addStat(raw, 'dmgBlightPct', 0.5 * a.will);
  addStat(raw, 'dmgFrostPct', 0.5 * a.will);
  addStat(raw, 'dmgPct', buffs?.dmgPct ?? 0);
  return {
    raw,
    maxHp,
    maxFocus,
    armor,
    res,
    critChance,
    critMult,
    speedMul,
    moveSpeed,
    weaponMin: wmin,
    weaponMax: wmax,
    weaponPool,
    twoHanded,
    hasShield,
    block: Math.min(60, g('blockChance')),
    attrs: a,
    potionPotency: g('potionPotency') + 0.4 * a.vigor,
    ailmentChance: g('ailmentChance'),
    ailmentResist: Math.min(75, g('ailmentResist') + 0.5 * a.vigor),
    cdr: Math.min(40, g('cdrPct')),
    evadeRec: g('evadeRec'),
    hpRegen: g('hpRegen'),
    focusRegen: 3 + g('focusRegen') + 0.05 * a.will,
    goldFind: g('goldFind'),
    thorns: g('thorns'),
    rankAll: g('rankAll'),
    relics,
    flags,
  };
}

export function effectiveRank(ch: Character, d: Derived, skillId: string): number {
  const base = ch.ranks[skillId] ?? 0;
  const sk = SKILL_BY_ID[skillId];
  if (!sk) return base;
  if (sk.kind === 'basic') return 1 + d.rankAll;
  if (base <= 0) return 0;
  return base + d.rankAll + (d.relics.has('stareye') ? 1 : 0);
}

export function unlockedSkills(ch: Character): string[] {
  return CLASS_SKILLS[ch.cls].filter((s) => s.kind === 'basic' || (ch.ranks[s.id] ?? 0) > 0).map((s) => s.id);
}

export function damageMultiplier(d: Derived, types: string[], tags: string[]): number {
  let inc = d.raw.dmgPct ?? 0;
  for (const t of types) inc += d.raw[`dmg${t[0].toUpperCase()}${t.slice(1)}Pct`] ?? 0;
  if (tags.includes('melee')) inc += d.raw.dmgMeleePct ?? 0;
  if (tags.includes('projectile')) inc += d.raw.dmgProjPct ?? 0;
  if (tags.includes('area')) inc += d.raw.dmgAreaPct ?? 0;
  return 1 + inc / 100;
}

export function slotsFor(group: string): SlotId[] {
  switch (group) {
    case 'wpn':
      return ['weapon'];
    case 'off':
      return ['offhand'];
    case 'ring':
      return ['ring1', 'ring2'];
    default:
      return [group as SlotId];
  }
}
