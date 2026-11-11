import { describe, expect, it } from 'vitest';
import { Rng } from '../src/core/rng';
import { computeStats } from '../src/entity-combat/stats';
import { AFFIX, AFFIXES, BASE, BASES, RELICS } from '../src/items/content';
import { addSocket, buyPotion, combineGlyphs, identify, isProtected, rerollAffix, salvage, sellItem, socketGlyph, vendorStock } from '../src/items/economy';
import { affixAllowed, generateGlyph, generateItem, itemName } from '../src/items/generate';
import { INV_H, INV_W, addItem, equipItem, fitsAt, sortItems, unequip } from '../src/items/inventory';
import { rollItem, RELIC_PITY_CAP } from '../src/items/loot';
import { createHero } from '../src/progression/progression';
import { makeSession } from './helpers';

describe('content tables', () => {
  it('meets the MVP breadth targets', () => {
    expect(BASES.length).toBeGreaterThanOrEqual(70);
    expect(AFFIXES.length).toBeGreaterThanOrEqual(45);
    expect(RELICS.length).toBe(8);
    for (const r of RELICS) expect(BASE[r.base], r.id).toBeTruthy();
    expect(new Set(BASES.map((b) => b.id)).size).toBe(BASES.length);
  });
});
describe('item generation', () => {
  it('is deterministic for a seed', () => {
    const gen = (seed: number) => { const r = new Rng(seed); return Array.from({ length: 30 }, () => generateItem(r, { ilvl: 10, cls: 'cinder' })); };
    expect(gen(7)).toEqual(gen(7));
    expect(gen(7)).not.toEqual(gen(8));
  });
  it('respects rarity affix budgets, slot rules, class usability and group exclusions', () => {
    const r = new Rng(2025);
    const counts = [0, 0, 0, 0];
    for (let i = 0; i < 3000; i++) {
      const cls = i % 2 ? 'cinder' : 'ranger';
      const it = generateItem(r, { ilvl: 1 + (i % 20), cls });
      counts[it.rarity]++;
      const base = BASE[it.base], n = it.affixes.length;
      if (it.rarity === 0) expect(n).toBe(0);
      if (it.rarity === 1) expect(n >= 1 && n <= 2).toBe(true);
      if (it.rarity === 2) expect(n >= 3 && n <= 4).toBe(true);
      if (it.rarity === 3) { expect(n >= 2 && n <= 3).toBe(true); expect(it.relic).toBeTruthy(); }
      expect(it.identified).toBe(it.rarity < 2);
      expect(base.ilvl).toBeLessThanOrEqual(Math.max(it.ilvl, base.ilvl) + 1);
      const groups = it.affixes.map((a) => AFFIX[a.id].group);
      expect(new Set(groups).size, itemName(it)).toBe(groups.length);
      for (const a of it.affixes) {
        expect(affixAllowed(AFFIX[a.id], base, cls), `${a.id} on ${base.id}`).toBe(true);
        expect(a.value).toBeGreaterThan(0);
        expect(a.tier).toBeLessThanOrEqual(Math.min(5, 1 + Math.floor(it.ilvl / 5)));
      }
    }
    expect(counts[0]).toBeGreaterThan(counts[2]);
    expect(counts[1]).toBeGreaterThan(counts[2]);
    expect(counts[2]).toBeGreaterThan(counts[3]);
    expect(counts[3]).toBeGreaterThan(0);
  });
  it('never rolls a class-locked affix for the other class', () => {
    const r = new Rng(5);
    for (let i = 0; i < 1500; i++) {
      const it = generateItem(r, { ilvl: 15, cls: 'ranger', minRarity: 2 });
      const owner = BASE[it.base].cls ?? 'ranger';
      for (const a of it.affixes) if (AFFIX[a.id].cls) expect(AFFIX[a.id].cls).toBe(owner);
    }
  });
  it('higher item level gives stronger rolls on average', () => {
    const avg = (ilvl: number) => { const r = new Rng(11); let s = 0, n = 0; for (let i = 0; i < 800; i++) for (const a of generateItem(r, { ilvl, cls: 'cinder', rarity: 2, base: 'heavy_chest1' }).affixes) if (a.id === 'hale') { s += a.value; n++; } return s / n; };
    expect(avg(18)).toBeGreaterThan(avg(2) * 1.5);
  });
});
describe('loot rules', () => {
  it('relic bad-luck protection forces a relic at the pity cap', () => {
    const s = makeSession('cinder', 77);
    s.hero.relicPity = RELIC_PITY_CAP;
    const it = rollItem(s, 10, 1, true);
    expect(it.rarity).toBe(3);
    expect(s.hero.relicPity).toBe(0);
  });
  it('first boss kill guarantees an Inscribed-or-better drop', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const s = makeSession('ranger', seed);
      s.enterZone('hunt_toll', 'start');
      const boss = s.zone.actors.find((a) => a.boss)!;
      boss.hp = 1; boss.bs!.armor = 0;
      s.onKill(Object.assign(boss, { dead: true }), { id: 1, name: 'x', team: 0 });
      const drops = s.zone.pickups.filter((p) => p.kind === 'item' && p.item!.kind === 'gear').map((p) => p.item!);
      expect(drops.length).toBe(4); // three rolls plus the guaranteed class weapon
      expect(drops.some((d) => BASE[d.base].slot === 'main' && BASE[d.base].cls === 'ranger')).toBe(true);
      expect(drops.some((d) => d.rarity >= 2)).toBe(true);
    }
  });
});
describe('inventory grid', () => {
  it('places items without overlap and reports full inventory', () => {
    const hero = createHero('A', 'cinder', 0, 3);
    const r = new Rng(9);
    let added = 0;
    for (let i = 0; i < 200; i++) if (addItem(hero.inv, generateItem(r, { ilvl: 5, cls: 'cinder', base: 'heavy_chest1' }))) added++;
    expect(added).toBe(Math.floor(INV_W / 2) * Math.floor(INV_H / 3));
    const grid = new Set<string>();
    for (const it of hero.inv) for (let y = it.y; y < it.y + 3; y++) for (let x = it.x; x < it.x + 2; x++) { expect(grid.has(`${x},${y}`)).toBe(false); grid.add(`${x},${y}`); }
    expect(addItem(hero.inv, generateItem(r, { ilvl: 1, cls: 'cinder', base: 'ring1' }))).toBe(false);
    expect(fitsAt(hero.inv, hero.inv[0], 9, 5)).toBe(false);
  });
  it('equips with swap, enforces two-handed rules and class restrictions', () => {
    const hero = createHero('A', 'cinder', 0, 3);
    const r = new Rng(4);
    const maul = generateItem(r, { ilvl: 1, cls: 'cinder', rarity: 0, base: 'maul1' });
    addItem(hero.inv, maul);
    expect(equipItem(hero, maul.id)).toBeNull();
    expect(hero.equip.main!.id).toBe(maul.id);
    expect(hero.equip.off).toBeUndefined();
    expect(hero.inv.length).toBe(2); // mace + shield returned to the grid
    const shield = hero.inv.find((i) => i.base === 'shield1')!;
    expect(equipItem(hero, shield.id)).toBeNull();
    expect(hero.equip.main).toBeUndefined();
    const bow = generateItem(r, { ilvl: 1, cls: 'ranger', rarity: 0, base: 'longbow1' });
    addItem(hero.inv, bow);
    expect(equipItem(hero, bow.id)).toMatch(/Veil Ranger/);
    const ring1 = generateItem(r, { ilvl: 1, cls: 'cinder', rarity: 0, base: 'ring1' }), ring2 = generateItem(r, { ilvl: 1, cls: 'cinder', rarity: 0, base: 'ring1' });
    addItem(hero.inv, ring1); addItem(hero.inv, ring2);
    equipItem(hero, ring1.id); equipItem(hero, ring2.id);
    expect(hero.equip.ring1 && hero.equip.ring2).toBeTruthy();
    expect(unequip(hero, 'ring1')).toBeNull();
    sortItems(hero.inv);
    expect(hero.inv.every((i) => fitsAt(hero.inv, i, i.x, i.y))).toBe(true);
  });
  it('unidentified items cannot be equipped until identified', () => {
    const hero = createHero('A', 'cinder', 0, 3);
    const it = generateItem(new Rng(1), { ilvl: 1, cls: 'cinder', rarity: 2, base: 'mace1' });
    addItem(hero.inv, it);
    expect(equipItem(hero, it.id)).toMatch(/identified/);
    hero.gold = 500;
    expect(identify(hero, it.id)).toBeNull();
    expect(equipItem(hero, it.id)).toBeNull();
  });
});
describe('economy and crafting', () => {
  it('protects favorited and Relic items from destruction', () => {
    const hero = createHero('A', 'cinder', 0, 3);
    const r = new Rng(8);
    const fav = generateItem(r, { ilvl: 5, cls: 'cinder', rarity: 1 }); fav.fav = true;
    const relic = generateItem(r, { ilvl: 12, cls: 'cinder', rarity: 3 });
    const junk = generateItem(r, { ilvl: 5, cls: 'cinder', rarity: 0 });
    for (const i of [fav, relic, junk]) addItem(hero.inv, i);
    expect(salvage(hero, fav.id)).toMatch(/Favorited/);
    expect(sellItem(hero, fav.id)).toMatch(/Favorited/);
    expect(salvage(hero, relic.id)).toBe('confirm');
    expect(isProtected(hero, relic)).toBe(true);
    expect(salvage(hero, junk.id)).toBeNull();
    expect(hero.dust).toBeGreaterThan(0);
    expect(salvage(hero, relic.id, true)).toBeNull();
  });
  it('rerolls one chosen affix with escalating cost and keeps exclusions', () => {
    const hero = createHero('A', 'cinder', 0, 3);
    const it = generateItem(new Rng(3), { ilvl: 10, cls: 'cinder', rarity: 2, base: 'heavy_chest2' });
    it.identified = true; addItem(hero.inv, it);
    expect(rerollAffix(hero, it.id, 0, new Rng(1))).toMatch(/Needs/);
    hero.gold = 5000; hero.dust = 500;
    const before = it.affixes.map((a) => a.id);
    const g0 = hero.gold;
    expect(rerollAffix(hero, it.id, 0, new Rng(1))).toBeNull();
    const c1 = g0 - hero.gold, g1 = hero.gold;
    expect(it.affixes[0].id).not.toBe(before[0]);
    expect(it.affixes.slice(1).map((a) => a.id)).toEqual(before.slice(1));
    expect(rerollAffix(hero, it.id, 0, new Rng(2))).toBeNull();
    expect(g1 - hero.gold).toBeGreaterThan(c1);
    const groups = it.affixes.map((a) => AFFIX[a.id].group);
    expect(new Set(groups).size).toBe(groups.length);
  });
  it('sockets glyphs, combines three into a higher tier, and sells potions up to the belt cap', () => {
    const hero = createHero('A', 'cinder', 0, 3);
    hero.gold = 1000; hero.dust = 100;
    expect(addSocket(hero, hero.equip.main!.id)).toBeNull();
    expect(addSocket(hero, hero.equip.main!.id)).toMatch(/already/);
    const r = new Rng(6);
    const glyphs = [0, 1, 2].map(() => { const g = generateGlyph(r); g.base = 'glyph_ember_1'; addItem(hero.inv, g); return g; });
    expect(combineGlyphs(hero, 'glyph_ember_1')).toBeNull();
    expect(hero.inv.filter((i) => i.kind === 'glyph').map((i) => i.base)).toEqual(['glyph_ember_2']);
    const before = computeStats(hero).addEmber ?? 0;
    expect(socketGlyph(hero, glyphs[0].id, 'main')).toBeNull();
    expect(computeStats(hero).addEmber).toBeGreaterThan(before);
    hero.belt[0] = hero.beltCap;
    expect(buyPotion(hero, 0)).toMatch(/full/);
    expect(buyPotion(hero, 2)).toBeNull();
    expect(vendorStock(hero).length).toBeGreaterThan(0);
    expect(vendorStock(hero)).toEqual(vendorStock(hero));
  });
});
