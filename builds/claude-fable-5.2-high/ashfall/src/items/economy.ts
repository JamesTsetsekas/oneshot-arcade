import { Rng } from '../core/rng';
import type { EquipSlot, Hero, Item } from '../entity-combat/types';
import { AFFIX, AFFIXES, BASE, POTIONS, glyphInfo } from './content';
import { affixAllowed, generateItem, itemValue, rollAffix } from './generate';
import { addItem, removeItem } from './inventory';

/** Vendor, salvage and Artificer crafting rules. Pure hero mutations returning an error string or null on success. */
const find = (hero: Hero, id: string): Item | undefined => hero.inv.find((i) => i.id === id) ?? Object.values(hero.equip).find((i) => i?.id === id);
export const isProtected = (hero: Hero, it: Item) => !!it.fav || it.rarity === 3 || Object.values(hero.equip).includes(it);

export const sellValue = (it: Item) => Math.max(1, Math.round(itemValue(it) * 0.3));
export function sellItem(hero: Hero, id: string, confirm = false): string | null {
  const it = hero.inv.find((i) => i.id === id);
  if (!it) return 'Item not in inventory.';
  if (it.fav) return 'Favorited items cannot be sold.';
  if (it.rarity === 3 && !confirm) return 'confirm';
  removeItem(hero.inv, id);
  hero.gold += sellValue(it);
  return null;
}
export const potionPrice = (hero: Hero, i: number) => Math.round(POTIONS[i].price * (1 + hero.level * 0.12));
export function buyPotion(hero: Hero, i: number): string | null {
  if (hero.belt[i] >= hero.beltCap) return 'That belt slot is full.';
  const p = potionPrice(hero, i);
  if (hero.gold < p) return 'Not enough gold.';
  hero.gold -= p; hero.belt[i]++;
  return null;
}
export function vendorStock(hero: Hero): Item[] {
  const rng = new Rng(hero.vendorSeed).fork('stock' + hero.level);
  const out: Item[] = [];
  for (let i = 0; i < 6; i++) {
    const it = generateItem(rng, { ilvl: hero.level + 1, cls: hero.cls, minRarity: 1, noRelic: true });
    it.identified = true;
    if (!hero.flags['bought_' + it.id]) out.push(it);
  }
  return out;
}
export const buyPrice = (it: Item) => Math.round(itemValue(it) * 2.2);
export function buyItem(hero: Hero, id: string): string | null {
  const it = vendorStock(hero).find((i) => i.id === id);
  if (!it) return 'No longer in stock.';
  if (hero.gold < buyPrice(it)) return 'Not enough gold.';
  if (!addItem(hero.inv, it)) return 'Inventory is full.';
  hero.gold -= buyPrice(it);
  hero.flags['bought_' + it.id] = true;
  return null;
}
export const salvageYield = (it: Item) => (it.kind === 'glyph' ? glyphInfo(it.base).tier * 2 : [1, 3, 8, 20][it.rarity] + Math.floor(it.ilvl / 4));
export function salvage(hero: Hero, id: string, confirm = false): string | null {
  const it = hero.inv.find((i) => i.id === id);
  if (!it) return 'Item not in inventory.';
  if (it.fav) return 'Favorited items cannot be salvaged.';
  if (it.rarity === 3 && !confirm) return 'confirm';
  removeItem(hero.inv, id);
  hero.dust += salvageYield(it);
  return null;
}
export const identifyCost = (it: Item) => 15 + it.ilvl * 3;
export function identify(hero: Hero, id: string): string | null {
  const it = find(hero, id);
  if (!it || it.identified) return 'Nothing to identify.';
  if (hero.gold < identifyCost(it)) return 'Not enough gold.';
  hero.gold -= identifyCost(it); it.identified = true;
  return null;
}
export const rerollCost = (it: Item) => ({ gold: Math.round(30 * (1 + it.rerolls) * (1 + it.ilvl / 10)), dust: 3 * (1 + it.rerolls) });
/** Rerolls one chosen affix into a different legal affix; cost escalates per item. */
export function rerollAffix(hero: Hero, id: string, idx: number, rng: Rng): string | null {
  const it = find(hero, id);
  if (!it || it.kind !== 'gear' || !it.identified || !it.affixes[idx]) return 'Choose an identified affix to reroll.';
  const c = rerollCost(it);
  if (hero.gold < c.gold || hero.dust < c.dust) return `Needs ${c.gold} gold and ${c.dust} dust.`;
  const base = BASE[it.base];
  const groups = new Set(it.affixes.filter((_, i) => i !== idx).map((a) => AFFIX[a.id].group));
  const old = AFFIX[it.affixes[idx].id];
  const pool = AFFIXES.filter((a) => a.pos === old.pos && a.id !== old.id && affixAllowed(a, base, hero.cls) && !groups.has(a.group));
  if (!pool.length) return 'No other affix can roll here.';
  hero.gold -= c.gold; hero.dust -= c.dust;
  it.affixes[idx] = rollAffix(rng, rng.weighted(pool, (a) => a.w), it.ilvl, it.rarity);
  it.rerolls++;
  return null;
}
export const repairCost = (hero: Hero) => Math.round(Object.values(hero.equip).reduce((n, it) => n + (it ? (100 - it.dur) * (0.4 + it.ilvl * 0.08) : 0), 0));
export function repairAll(hero: Hero): string | null {
  const c = repairCost(hero);
  if (c <= 0) return 'Nothing needs repair.';
  if (hero.gold < c) return 'Not enough gold.';
  hero.gold -= c;
  for (const it of Object.values(hero.equip)) if (it) it.dur = 100;
  return null;
}
export const SOCKET_COST = { gold: 80, dust: 12 };
export const canSocket = (it: Item) => it.kind === 'gear' && ['main', 'off', 'head', 'chest'].includes(BASE[it.base].slot);
export function addSocket(hero: Hero, id: string): string | null {
  const it = find(hero, id);
  if (!it || !canSocket(it)) return 'Only weapons, off-hands, helms and chest armor can hold a socket.';
  if (it.sockets >= 1) return 'This item already has a socket.';
  if (hero.gold < SOCKET_COST.gold || hero.dust < SOCKET_COST.dust) return `Needs ${SOCKET_COST.gold} gold and ${SOCKET_COST.dust} dust.`;
  hero.gold -= SOCKET_COST.gold; hero.dust -= SOCKET_COST.dust; it.sockets = 1;
  return null;
}
export function socketGlyph(hero: Hero, glyphId: string, slot: EquipSlot): string | null {
  const g = hero.inv.find((i) => i.id === glyphId);
  const target = hero.equip[slot];
  if (!g || g.kind !== 'glyph' || !target) return 'Select a glyph and an equipped item.';
  if (target.glyphs.length >= target.sockets) return 'No empty socket on that item.';
  removeItem(hero.inv, glyphId);
  target.glyphs.push(g.base);
  return null;
}
/** Three glyphs of one type and tier combine into one of the next tier. */
export function combineGlyphs(hero: Hero, base: string): string | null {
  const g = glyphInfo(base);
  if (g.tier >= 3) return 'Already the highest tier.';
  const same = hero.inv.filter((i) => i.kind === 'glyph' && i.base === base);
  if (same.length < 3) return 'Requires three identical glyphs.';
  const keep = same[0];
  removeItem(hero.inv, same[1].id); removeItem(hero.inv, same[2].id);
  keep.base = `glyph_${g.type}_${g.tier + 1}`; keep.ilvl = (g.tier + 1) * 5;
  return null;
}
export function moveToStash(hero: Hero, id: string): string | null {
  const it = hero.inv.find((i) => i.id === id);
  if (!it) return 'Item not in inventory.';
  const pos = { x: it.x, y: it.y };
  removeItem(hero.inv, id);
  if (!addItem(hero.stash, it)) { it.x = pos.x; it.y = pos.y; hero.inv.push(it); return 'Stash is full.'; }
  return null;
}
export function moveFromStash(hero: Hero, id: string): string | null {
  const it = hero.stash.find((i) => i.id === id);
  if (!it) return 'Item not in stash.';
  const pos = { x: it.x, y: it.y };
  removeItem(hero.stash, id);
  if (!addItem(hero.inv, it)) { it.x = pos.x; it.y = pos.y; hero.stash.push(it); return 'Inventory is full.'; }
  return null;
}
