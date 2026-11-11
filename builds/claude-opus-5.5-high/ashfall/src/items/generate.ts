import { Rng } from "../core/rng";
import { AFFIXES, AFFIX_BY_ID, BASE_ITEMS, BASE_BY_ID, GLYPHS, RELICS, RELIC_BY_ID } from "../data/items";
import type { AffixDef, BaseItemDef, ClassId, Rarity } from "../data/types";
import type { Item, RolledAffix } from "./item";

export interface LootContext {
  ilvl: number;
  classHint: ClassId;
  rarityFind?: number; // percent
  minRarity?: Rarity;
  forceRelic?: boolean;
  baseId?: string;
  veteran?: boolean;
  nextUid: () => number;
}

export const RARITY_WEIGHTS: Record<Rarity, number> = { worn: 60, tempered: 30, inscribed: 9, relic: 1.2 };
const RANK: Record<Rarity, number> = { worn: 0, tempered: 1, inscribed: 2, relic: 3 };

export function rollRarity(rng: Rng, rarityFind = 0, minRarity: Rarity = "worn"): Rarity {
  const f = 1 + rarityFind / 100;
  const list: Rarity[] = ["worn", "tempered", "inscribed", "relic"];
  const allowed = list.filter((r) => RANK[r] >= RANK[minRarity]);
  return rng.weighted(allowed, (r) => (r === "worn" ? RARITY_WEIGHTS[r] : RARITY_WEIGHTS[r] * f)) ?? "worn";
}

/** Bases eligible for an item level; weight favors bases close to the item level so rarity never dominates item level. */
export function eligibleBases(ilvl: number, cls: ClassId | null): BaseItemDef[] {
  return BASE_ITEMS.filter((b) => b.ilvl <= ilvl && (cls === null || !b.classReq || b.classReq === cls));
}

export function chooseBase(rng: Rng, ilvl: number, cls: ClassId): BaseItemDef {
  // 85% of drops target the active class's usable items; the rest can be any class (salvage/stash fodder).
  const pool = eligibleBases(ilvl, rng.chance(0.85) ? cls : null);
  // pick slot first (evenly) so jewellery isn't swamped by the many armor bases
  const slots = [...new Set(pool.map((b) => b.slot))];
  const slot = rng.pick(slots);
  const inSlot = pool.filter((b) => b.slot === slot);
  return rng.weighted(inSlot, (b) => 1 / (1 + Math.max(0, ilvl - b.ilvl) * 0.6)) ?? inSlot[0];
}

export function affixAllowed(a: AffixDef, base: BaseItemDef, cls: ClassId, existing: RolledAffix[]): boolean {
  if (!a.slots.includes(base.slot)) return false;
  // class-tagged affixes only roll where that class could use them
  const itemClass = base.classReq ?? cls;
  if (a.classTag && a.classTag !== itemClass) return false;
  for (const e of existing) {
    const d = AFFIX_BY_ID[e.id];
    if (d.group === a.group) return false;
    if (d.excludes?.includes(a.group) || a.excludes?.includes(d.group)) return false;
  }
  return true;
}

export function rollAffixValue(rng: Rng, a: AffixDef, ilvl: number, elevated: boolean, veteran: boolean): RolledAffix {
  const avail = a.tiers.map((t, i) => ({ t, i })).filter((x) => x.t.ilvl <= ilvl);
  const top = avail.length - 1;
  // weight toward the highest tier available; veteran/elevated push further
  const pick = rng.weighted(avail, (x) => {
    const steps = top - x.i;
    const bias = veteran ? 0.35 : 0.5;
    return Math.pow(bias, steps);
  })!;
  let lo = pick.t.min, hi = pick.t.max;
  if (elevated) lo = Math.round(lo + (hi - lo) * 0.4);
  return { id: a.id, tier: pick.i + 1, value: rng.int(lo, Math.max(lo, hi)) };
}

export function rollAffixes(rng: Rng, base: BaseItemDef, cls: ClassId, count: number, ilvl: number, elevated: boolean, veteran: boolean, existing: RolledAffix[] = []): RolledAffix[] {
  const out: RolledAffix[] = [...existing];
  let guard = 0;
  while (out.length < existing.length + count && guard++ < 50) {
    const pre = out.filter((x) => AFFIX_BY_ID[x.id].kind === "prefix").length;
    const suf = out.length - pre;
    const wantKind = pre >= 2 ? "suffix" : suf >= 2 ? "prefix" : rng.chance(0.5) ? "prefix" : "suffix";
    const pool = AFFIXES.filter((a) => a.kind === wantKind && affixAllowed(a, base, cls, out) && a.tiers[0].ilvl <= ilvl);
    const a = rng.weighted(pool, (x) => x.weight);
    if (!a) continue;
    out.push(rollAffixValue(rng, a, ilvl, elevated, veteran));
  }
  return out.slice(existing.length);
}

export function generateItem(rng: Rng, ctx: LootContext): Item {
  let rarity: Rarity = ctx.forceRelic ? "relic" : rollRarity(rng, ctx.rarityFind ?? 0, ctx.minRarity ?? "worn");
  let base: BaseItemDef;
  let relicId: string | undefined;
  if (rarity === "relic") {
    const relics = RELICS.filter((r) => BASE_BY_ID[r.baseId].ilvl <= Math.max(ctx.ilvl, 8) && (!r.classReq || r.classReq === ctx.classHint || rng.chance(0.15)));
    const relic = relics.length ? rng.pick(relics) : undefined;
    if (relic) {
      relicId = relic.id;
      base = BASE_BY_ID[relic.baseId];
    } else {
      rarity = "inscribed";
      base = ctx.baseId ? BASE_BY_ID[ctx.baseId] : chooseBase(rng, ctx.ilvl, ctx.classHint);
    }
  } else {
    base = ctx.baseId ? BASE_BY_ID[ctx.baseId] : chooseBase(rng, ctx.ilvl, ctx.classHint);
  }
  const cls = base.classReq ?? ctx.classHint;
  const vet = !!ctx.veteran;
  let affixes: RolledAffix[] = [];
  if (rarity === "tempered") affixes = rollAffixes(rng, base, cls, rng.int(1, 2), ctx.ilvl, false, vet);
  else if (rarity === "inscribed") affixes = rollAffixes(rng, base, cls, rng.int(3, 4), ctx.ilvl, true, vet);
  else if (rarity === "relic") affixes = rollAffixes(rng, base, cls, RELIC_BY_ID[relicId!].rolls, Math.max(ctx.ilvl, base.ilvl), true, vet);

  const socketChance = { worn: 0.25, tempered: 0.2, inscribed: 0.3, relic: 0.5 }[rarity];
  let sockets = 0;
  for (let i = 0; i < base.maxSockets; i++) if (rng.chance(socketChance)) sockets++;
  if (sockets > base.maxSockets - 0) sockets = base.maxSockets;
  // keep one socket slot free for the Artificer to add when allowed
  if (sockets >= base.maxSockets && base.maxSockets > 0) sockets = base.maxSockets - 1;

  const maxDur = base.durability;
  return {
    uid: ctx.nextUid(),
    baseId: base.id,
    kind: "gear",
    ilvl: ctx.ilvl,
    rarity,
    affixes,
    relicId,
    sockets,
    glyphs: new Array(sockets).fill(null),
    identified: rarity === "worn" || rarity === "tempered",
    favorite: false,
    durability: maxDur,
    maxDurability: maxDur,
    rerolls: 0,
  };
}

export function generateGlyph(rng: Rng, tier: number, nextUid: () => number): Item {
  const pool = GLYPHS.filter((g) => g.tier === tier);
  const g = rng.pick(pool);
  return { uid: nextUid(), baseId: g.id, kind: "glyph", ilvl: tier * 6, rarity: "worn", affixes: [], sockets: 0, glyphs: [], identified: true, favorite: false, durability: 1, maxDurability: 1, rerolls: 0 };
}

/** Starting kit: worn weapon (+offhand for Cinder) and chest for the chosen class. */
export function starterKit(cls: ClassId, nextUid: () => number): Item[] {
  const ids = cls === "cinder" ? ["ash_cudgel", "plank_buckler", "padded_coat"] : ["ashwood_bow", "soot_quiver", "padded_coat"];
  return ids.map((id) => {
    const b = BASE_BY_ID[id];
    return { uid: nextUid(), baseId: id, kind: "gear", ilvl: 1, rarity: "worn", affixes: [], sockets: 0, glyphs: [], identified: true, favorite: false, durability: b.durability, maxDurability: b.durability, rerolls: 0 } as Item;
  });
}

/** Reroll exactly one chosen affix, keeping its group exclusive of the others. */
export function rerollAffix(rng: Rng, it: Item, index: number, cls: ClassId, veteran: boolean): RolledAffix | null {
  const base = BASE_BY_ID[it.baseId];
  const others = it.affixes.filter((_, i) => i !== index);
  const old = AFFIX_BY_ID[it.affixes[index].id];
  const pool = AFFIXES.filter((a) => a.kind === old.kind && affixAllowed(a, base, cls, others) && a.tiers[0].ilvl <= it.ilvl);
  const a = rng.weighted(pool, (x) => x.weight);
  if (!a) return null;
  return rollAffixValue(rng, a, it.ilvl, it.rarity !== "tempered", veteran);
}

export function rerollCost(it: Item): { gold: number; dust: number } {
  const n = it.rerolls;
  return { gold: Math.round(40 * (1 + it.ilvl / 6) * Math.pow(1.6, n)), dust: 6 + n * 4 };
}
export function identifyCost(it: Item): number {
  return Math.round(15 + it.ilvl * 4);
}
export function repairCost(it: Item): number {
  const missing = it.maxDurability - it.durability;
  return Math.ceil(missing * (0.6 + it.ilvl * 0.08));
}
export function socketCost(it: Item): { gold: number; dust: number } {
  return { gold: Math.round(60 + it.ilvl * 10), dust: 12 };
}
export function canAddSocket(it: Item): boolean {
  if (it.kind !== "gear" || it.socketAdded) return false;
  return it.sockets < BASE_BY_ID[it.baseId].maxSockets;
}
