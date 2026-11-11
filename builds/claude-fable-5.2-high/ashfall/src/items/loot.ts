import type { Actor, Item, Pickup } from '../entity-combat/types';
import type { Session } from '../game-session/session';
import { ENEMY } from '../navigation-ai/enemies';
import { nearestFree } from '../navigation-ai/grid';
import { BASES } from './content';
import { generateGlyph, generateItem } from './generate';

export const RELIC_PITY_CAP = 6;
function place(s: Session, x: number, y: number, p: Omit<Pickup, 'id' | 'x' | 'y' | 't'>): void {
  const ang = s.lootRng.range(0, 6.28), d = s.lootRng.range(0.5, 1.7);
  const pos = nearestFree(s.zone, x + Math.cos(ang) * d, y + Math.sin(ang) * d, 0.3) ?? { x, y };
  s.zone.pickups.push({ id: s.id(), x: pos.x, y: pos.y, t: 0, ...p });
}
export function dropItem(s: Session, x: number, y: number, item: Item): void {
  place(s, x, y, { kind: 'item', amount: 1, item });
  s.emit({ type: 'drop', x, y, a: item.rarity, s: item.kind });
}
/** Rolls an item drop using the seeded loot stream, relic pity and magic find. */
export function rollItem(s: Session, ilvl: number, minRarity: number, pityRoll: boolean): Item {
  const hero = s.hero;
  const force = pityRoll && hero.relicPity >= RELIC_PITY_CAP;
  const it = generateItem(s.lootRng, { ilvl: Math.max(1, ilvl), cls: hero.cls, minRarity, mf: s.stats.magicFind ?? 0, rarity: force ? 3 : undefined, relicBonus: pityRoll ? hero.relicPity * 0.9 : 0 });
  if (pityRoll) hero.relicPity = it.rarity === 3 ? 0 : hero.relicPity;
  return it;
}
const DROP: Record<string, number> = { fodder: 0.1, skirmisher: 0.15, controller: 0.18, bruiser: 0.22, boss: 1, object: 0 };
export function rollDrops(s: Session, a: Actor): void {
  const r = s.lootRng, def = ENEMY[a.def], hero = s.hero, st = s.stats;
  const big = a.boss ? 14 : a.elite ? 4 : 1;
  if (a.def === 'urn') {
    if (r.chance(0.5)) place(s, a.x, a.y, { kind: 'gold', amount: Math.round((2 + s.zone.level * 1.5) * r.range(0.6, 1.4)) });
    if (r.chance(0.06)) place(s, a.x, a.y, { kind: 'potion', amount: 1, potion: 0 });
    return;
  }
  if (def.role === 'object') return;
  if (a.elite || a.boss || r.chance(0.45)) place(s, a.x, a.y, { kind: 'gold', amount: Math.round((3 + a.lvl * 2) * r.range(0.6, 1.4) * big * (1 + (st.goldFind ?? 0) / 100)) });
  const potions = a.boss ? 2 : (a.elite ? r.chance(0.5) : r.chance(0.07)) ? 1 : 0;
  for (let i = 0; i < potions; i++) { const k = r.next(); place(s, a.x, a.y, { kind: 'potion', amount: 1, potion: a.boss ? i : k < 0.6 ? 0 : k < 0.85 ? 1 : k < 0.93 ? 2 : 3 }); }
  if (a.elite || r.chance(0.05)) place(s, a.x, a.y, { kind: 'globe', amount: 0.2 });
  if (a.boss || r.chance(a.elite ? 0.4 : 0.03)) place(s, a.x, a.y, { kind: 'dust', amount: a.boss ? 8 : r.int(1, 2) * (a.elite ? 2 : 1) });
  if (r.chance(a.boss ? 0.7 : a.elite ? 0.14 : 0.015)) dropItem(s, a.x, a.y, generateGlyph(r, a.lvl >= 12 && r.chance(0.3) ? 2 : 1));
  const ilvl = a.lvl + (a.boss ? 2 : a.elite ? 1 : 0);
  if (a.boss) {
    const key = `first_${a.def}_${hero.difficulty}`;
    const first = !hero.flags[key];
    hero.flags[key] = true;
    let relic = false;
    for (let i = 0; i < 3; i++) { const it = rollItem(s, ilvl, i === 0 && first ? 2 : 1, i === 0); relic ||= it.rarity === 3; dropItem(s, a.x, a.y, it); }
    // Guaranteed boss reward: a class weapon of the best base tier available at this level.
    const weapons = BASES.filter((b) => b.slot === 'main' && b.cls === hero.cls && b.ilvl <= ilvl + 1);
    const top = Math.max(...weapons.map((b) => b.tier));
    const wb = r.pick(weapons.filter((b) => b.tier === top));
    const w = generateItem(r, { ilvl, cls: hero.cls, rarity: 1, base: wb.id });
    dropItem(s, a.x, a.y, w);
    if (!relic) hero.relicPity++;
  } else if (a.elite) {
    let relic = false;
    for (let i = 0; i < 2; i++) { const it = rollItem(s, ilvl, 1, i === 0); relic ||= it.rarity === 3; dropItem(s, a.x, a.y, it); }
    if (!relic) hero.relicPity += 0.5;
  } else if (r.chance(DROP[def.role] ?? 0.1)) dropItem(s, a.x, a.y, rollItem(s, ilvl, 0, false));
}
export function chestLoot(s: Session, x: number, y: number): void {
  const r = s.lootRng, lvl = s.zone.level + 1;
  for (let i = 0; i < r.int(2, 3); i++) place(s, x, y, { kind: 'gold', amount: Math.round((6 + lvl * 3) * r.range(0.7, 1.5)) });
  if (r.chance(0.5)) place(s, x, y, { kind: 'potion', amount: 1, potion: r.chance(0.7) ? 0 : 1 });
  dropItem(s, x, y, rollItem(s, lvl + 1, r.chance(0.4) ? 1 : 0, false));
  if (r.chance(0.2)) dropItem(s, x, y, generateGlyph(r));
}
