import { AFFIX_BY_ID, BASE_BY_ID, GLYPH_BY_ID, RELIC_BY_ID } from "../data/items";
import type { BaseItemDef, ClassId, Rarity, StatBlock, StatId } from "../data/types";

export interface RolledAffix { id: string; tier: number; value: number }

export interface Item {
  uid: number;
  baseId: string; // base item id, or glyph id for glyph items
  kind: "gear" | "glyph";
  ilvl: number;
  rarity: Rarity;
  affixes: RolledAffix[];
  relicId?: string;
  sockets: number;
  glyphs: (string | null)[];
  identified: boolean;
  favorite: boolean;
  durability: number;
  maxDurability: number;
  rerolls: number;
  socketAdded?: boolean;
}

export function itemBase(it: Item): BaseItemDef | undefined {
  return it.kind === "gear" ? BASE_BY_ID[it.baseId] : undefined;
}

export function itemSize(it: Item): [number, number] {
  if (it.kind === "glyph") return [1, 1];
  return BASE_BY_ID[it.baseId]?.size ?? [1, 1];
}

export function itemName(it: Item): string {
  if (it.kind === "glyph") return GLYPH_BY_ID[it.baseId]?.name ?? "Glyph";
  const base = BASE_BY_ID[it.baseId];
  if (it.relicId) return RELIC_BY_ID[it.relicId].name;
  if (!it.identified) return `Unidentified ${base.name}`;
  if (it.rarity === "worn") return `Worn ${base.name}`;
  const pre = it.affixes.map((a) => AFFIX_BY_ID[a.id]).find((a) => a?.kind === "prefix");
  const suf = it.affixes.map((a) => AFFIX_BY_ID[a.id]).find((a) => a?.kind === "suffix");
  return `${pre ? pre.name + " " : ""}${base.name}${suf ? " " + suf.name : ""}`;
}

export function itemClassReq(it: Item): ClassId | undefined {
  return it.kind === "gear" ? BASE_BY_ID[it.baseId]?.classReq : undefined;
}

export const RARITY_COLOR: Record<Rarity, string> = {
  worn: "#c8c4bc",
  tempered: "#6fa8ff",
  inscribed: "#f2d04a",
  relic: "#ff8a3a",
};
/** Shape glyph accompanies color so rarity never relies on color alone. */
export const RARITY_MARK: Record<Rarity, string> = { worn: "○", tempered: "◇", inscribed: "◆", relic: "✦" };
export const RARITY_LABEL: Record<Rarity, string> = { worn: "Worn", tempered: "Tempered", inscribed: "Inscribed", relic: "Relic" };

/** Stats an item contributes when equipped. Broken (0 durability) items contribute nothing; unidentified items contribute only implicits. */
export function itemStats(it: Item): StatBlock {
  const out: StatBlock = {};
  const add = (k: StatId, v: number) => (out[k] = (out[k] ?? 0) + v);
  if (it.kind !== "gear") return out;
  if (it.durability <= 0) return out;
  const base = BASE_BY_ID[it.baseId];
  for (const [k, v] of Object.entries(base.implicit)) add(k as StatId, v as number);
  if (it.identified) {
    for (const a of it.affixes) {
      const def = AFFIX_BY_ID[a.id];
      if (def) add(def.stat, a.value);
    }
    if (it.relicId) for (const [k, v] of Object.entries(RELIC_BY_ID[it.relicId].fixed)) add(k as StatId, v as number);
  }
  for (const g of it.glyphs) {
    if (!g) continue;
    const gd = GLYPH_BY_ID[g];
    if (gd) add(gd.stat, gd.value);
  }
  return out;
}

export function itemValue(it: Item): number {
  if (it.kind === "glyph") return 15 * (GLYPH_BY_ID[it.baseId]?.tier ?? 1) ** 2;
  const base = BASE_BY_ID[it.baseId];
  const mult = { worn: 1, tempered: 2, inscribed: 4, relic: 8 }[it.rarity];
  return Math.round((base.value + it.ilvl * 2) * mult);
}

export function salvageYield(it: Item): number {
  if (it.kind === "glyph") return 2 * (GLYPH_BY_ID[it.baseId]?.tier ?? 1);
  const mult = { worn: 1, tempered: 3, inscribed: 7, relic: 15 }[it.rarity];
  return Math.max(1, Math.round(mult * (1 + it.ilvl / 8)));
}

export function cloneItem(it: Item): Item {
  return { ...it, affixes: it.affixes.map((a) => ({ ...a })), glyphs: [...it.glyphs] };
}
