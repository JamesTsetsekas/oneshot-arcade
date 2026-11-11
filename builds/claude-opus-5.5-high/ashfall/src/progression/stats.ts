import { FIST_DAMAGE, BASE_BY_ID } from "../data/items";
import { SKILL_BY_ID } from "../data/skills";
import type { DamageType, StatBlock, StatId } from "../data/types";
import { itemStats } from "../items/item";
import { CLASS_INFO, type Attributes, type CharacterData } from "./character";

export const RES_CAP = 75;
export const VETERAN_RES_PENALTY = 20;
export const BASE_MOVE = 4.6;

export interface DerivedStats {
  raw: StatBlock;
  attrs: Attributes;
  maxHealth: number;
  maxFocus: number;
  focusRegen: number;
  armor: number;
  res: Record<Exclude<DamageType, "physical">, number>;
  resUncapped: Record<Exclude<DamageType, "physical">, number>;
  critChance: number; // 0..1
  critMult: number;
  attackSpeed: number; // multiplier on action speed
  cdr: number; // percent
  moveSpeed: number; // m/s
  weapon: [number, number];
  twoHanded: boolean;
  hasShield: boolean;
  blockChance: number; // 0..1
  evadeCharges: number;
  evadeRecharge: number; // seconds per charge
  potionPower: number; // multiplier
  primaryBonus: number; // percent all-damage from primary attribute
  elementalBonus: number; // percent from Will
  rank: (skillId: string) => number;
  relics: Set<string>;
}

export function sumStats(into: StatBlock, add: StatBlock, mult = 1) {
  for (const [k, v] of Object.entries(add)) into[k as StatId] = (into[k as StatId] ?? 0) + (v as number) * mult;
}

export function computeStats(ch: CharacterData, extra: StatBlock = {}, veteran = false): DerivedStats {
  const raw: StatBlock = {};
  const relics = new Set<string>();
  for (const it of Object.values(ch.equipment)) {
    if (!it) continue;
    sumStats(raw, itemStats(it));
    if (it.relicId && it.identified && it.durability > 0) relics.add(it.relicId);
  }
  const main = ch.equipment.mainhand;
  const mainBase = main ? BASE_BY_ID[main.baseId] : undefined;
  const off = ch.equipment.offhand;
  const hasShield = !!off && BASE_BY_ID[off.baseId]?.kind === "shield" && off.durability > 0;
  const twoHanded = !!mainBase?.twoHanded && mainBase.kind === "maul";

  // passives
  for (const [id, rank] of Object.entries(ch.ranks)) {
    const s = SKILL_BY_ID[id];
    if (!s || !s.passive || rank <= 0) continue;
    sumStats(raw, s.passive, rank);
    if (id === "crushing_weight" && twoHanded) raw.pctMelee = (raw.pctMelee ?? 0) + 12 * rank;
    if (id === "bulwark_doctrine" && hasShield) raw.blockChance = (raw.blockChance ?? 0) + 5 * rank;
  }
  sumStats(raw, extra);

  const base = CLASS_INFO[ch.classId].base;
  const attrs: Attributes = {
    might: base.might + ch.attrs.might + (raw.might ?? 0),
    finesse: base.finesse + ch.attrs.finesse + (raw.finesse ?? 0),
    will: base.will + ch.attrs.will + (raw.will ?? 0),
    vigor: base.vigor + ch.attrs.vigor + (raw.vigor ?? 0),
  };
  const g = (k: StatId) => raw[k] ?? 0;

  const maxHealth = Math.round((50 + 7 * (ch.level - 1) + 4 * attrs.vigor + g("maxHealth")) * (1 + g("maxHealthPct") / 100));
  const maxFocus = Math.round(40 + attrs.will + g("maxFocus"));
  const armor = Math.round((g("armor") + 1.5 * attrs.might + 0.5 * attrs.vigor) * (1 + g("armorPct") / 100));
  const pen = veteran ? VETERAN_RES_PENALTY : 0;
  const resU = {
    ember: g("resEmber") + g("resAll") - pen,
    frost: g("resFrost") + g("resAll") - pen,
    blight: g("resBlight") + g("resAll") - pen,
  };
  const res = { ember: Math.min(RES_CAP, resU.ember), frost: Math.min(RES_CAP, resU.frost), blight: Math.min(RES_CAP, resU.blight) };
  const critChance = Math.min(0.75, (5 + attrs.finesse * 0.06 + g("critChance")) / 100);
  const critMult = 1.5 + g("critDamage") / 100;
  const weaponSpeed = mainBase?.attackSpeed ?? 1;
  const attackSpeed = weaponSpeed * (1 + (g("attackSpeed") + attrs.finesse * 0.4) / 100);
  const moveSpeed = BASE_MOVE * (1 + Math.min(40, g("moveSpeed")) / 100);
  const weapon: [number, number] = main && main.durability > 0 && mainBase?.damage ? [mainBase.damage[0], mainBase.damage[1]] : [...FIST_DAMAGE];
  const blockChance = hasShield || g("blockChance") > 0 ? Math.min(0.5, g("blockChance") / 100) : 0;
  const evadeCharges = 3 + (relics.has("ashwalker") ? 1 : 0);
  const evadeRecharge = 2.8 / (1 + g("evadeRecovery") / 100);
  const primaryBonus = attrs[CLASS_INFO[ch.classId].primary] * 1.0;
  const elementalBonus = attrs.will * 0.8;
  const rankAll = g("rankAll");
  const rank = (id: string) => {
    const r = ch.ranks[id] ?? 0;
    if (r <= 0) return 0;
    const s = SKILL_BY_ID[id];
    if (s && (s.kind === "passive" || s.kind === "capstone" || s.kind === "basic")) return r;
    return r + rankAll + (raw[`rank:${id}` as StatId] ?? 0);
  };
  return {
    raw, attrs, maxHealth, maxFocus, focusRegen: 1.5 + attrs.will * 0.03 + g("focusRegen"), armor, res, resUncapped: resU,
    critChance, critMult, attackSpeed, cdr: Math.min(40, g("cdr") + attrs.will * 0.1), moveSpeed, weapon, twoHanded, hasShield,
    blockChance, evadeCharges, evadeRecharge, potionPower: 1 + g("potionPower") / 100, primaryBonus, elementalBonus, rank, relics,
  };
}

/** Armor mitigation with diminishing returns based on hit magnitude. */
export function armorReduction(armor: number, hit: number): number {
  if (armor <= 0 || hit <= 0) return 0;
  return Math.min(0.8, armor / (armor + 6 * hit + 30));
}

export function resistReduction(resPct: number): number {
  return Math.max(-0.5, Math.min(RES_CAP, resPct)) / 100;
}

/** Explanatory formula strings used by the character panel tooltips (same constants as above). */
export const FORMULAS: Record<string, string> = {
  maxHealth: "(50 + 7 × (level − 1) + 4 × Vigor + flat) × (1 + %health)",
  maxFocus: "40 + Will + flat",
  armor: "(gear + 1.5 × Might + 0.5 × Vigor) × (1 + %armor). Physical hits reduced by armor ÷ (armor + 6 × hit + 30), max 80%",
  res: `Gear resistances, capped at ${RES_CAP}%. Veteran applies −${VETERAN_RES_PENALTY}%.`,
  crit: "5% + 0.06% × Finesse + gear, max 75%",
  critMult: "150% + critical damage",
  attackSpeed: "weapon speed × (1 + (%attack speed + 0.4 × Finesse) / 100)",
  cdr: "gear + 0.1 × Will, max 40%",
  primary: "+1% damage per point of your class's primary attribute (Might for Cinder Vow, Finesse for Veil Ranger)",
  elemental: "+0.8% Ember/Frost/Blight damage per point of Will",
  block: "shield + gear + passives, max 50%. Blocked hits deal 35% damage",
};
