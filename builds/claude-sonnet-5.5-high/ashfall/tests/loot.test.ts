import { describe, expect, it } from 'vitest';
import { AFFIXES, AFFIX_BY_ID, BASES, BASE_BY_ID, RELICS } from '../src/data/items';
import { Inventory, canUse, planEquip } from '../src/sim/inventory';
import { describeItem, generateItem, itemStats, makeGlyph, rarityRank } from '../src/sim/loot';
import { Rng } from '../src/sim/rng';
import { newCharacter, computeDerived, addXp, rankUp, canRankUp, respecAll, xpForLevelCheck } from './charHelpers';

describe('content volume', () => {
  it('meets the MVP content targets', () => {
    expect(BASES.length).toBeGreaterThanOrEqual(75);
    expect(AFFIXES.length).toBeGreaterThanOrEqual(45);
    expect(RELICS.length).toBe(8);
  });
});

describe('RNG determinism', () => {
  it('same seed gives same sequence', () => {
    const a = new Rng(99);
    const b = new Rng(99);
    for (let i = 0; i < 50; i++) expect(a.next()).toBe(b.next());
  });
});

describe('loot generation', () => {
  it('is deterministic for a seed', () => {
    const gen = (seed: number) => {
      const r = new Rng(seed);
      return Array.from({ length: 30 }, () => {
        const it = generateItem(r, 12, { cls: 'cinder' });
        return `${it.base}|${it.rarity}|${it.affixes.map((a) => a.id + a.value).join(',')}`;
      });
    };
    expect(gen(7)).toEqual(gen(7));
    expect(gen(7)).not.toEqual(gen(8));
  });

  it('respects rarity affix budgets and affix exclusions', () => {
    const r = new Rng(2024);
    for (let i = 0; i < 400; i++) {
      const it = generateItem(r, 14, { cls: i % 2 ? 'cinder' : 'ranger', rarity: (['worn', 'tempered', 'inscribed', 'relic'] as const)[i % 4] });
      const n = it.affixes.length;
      if (it.rarity === 'worn') expect(n).toBe(0);
      if (it.rarity === 'tempered') expect(n).toBeGreaterThanOrEqual(1), expect(n).toBeLessThanOrEqual(2);
      if (it.rarity === 'inscribed') expect(n).toBeGreaterThanOrEqual(3), expect(n).toBeLessThanOrEqual(4);
      if (it.rarity === 'relic') expect(n).toBeGreaterThanOrEqual(2), expect(n).toBeLessThanOrEqual(3), expect(it.relic).toBeTruthy();
      const groups = it.affixes.map((a) => AFFIX_BY_ID[a.id].group);
      expect(new Set(groups).size).toBe(groups.length); // exclusion groups
      // every affix is valid for the base slot group and for the class
      const base = BASE_BY_ID[it.base];
      for (const a of it.affixes) {
        const def = AFFIX_BY_ID[a.id];
        expect(def.slots).toContain(base.group);
        if (def.cls) expect(def.cls).toBe(i % 2 ? 'cinder' : 'ranger');
      }
    }
  });

  it('respects item level: no tier-4 bases or high-tier affixes at low ilvl', () => {
    const r = new Rng(5);
    for (let i = 0; i < 300; i++) {
      const it = generateItem(r, 3, { cls: 'ranger', rarity: 'inscribed' });
      expect(BASE_BY_ID[it.base].ilvl).toBeLessThanOrEqual(3);
      for (const a of it.affixes) expect(a.tier).toBe(0);
    }
    let sawHigh = false;
    for (let i = 0; i < 300; i++) {
      const it = generateItem(r, 22, { cls: 'ranger', rarity: 'inscribed' });
      if (it.affixes.some((a) => a.tier >= 3)) sawHigh = true;
    }
    expect(sawHigh).toBe(true);
  });

  it('only drops class-usable weapons and offhands', () => {
    const r = new Rng(77);
    for (let i = 0; i < 400; i++) {
      const it = generateItem(r, 16, { cls: 'ranger' });
      const b = BASE_BY_ID[it.base];
      if (b.group === 'wpn' || b.group === 'off') expect(canUse(it, 'ranger')).toBe(true);
    }
  });

  it('rarity distribution is sane and relics are rare', () => {
    const r = new Rng(31337);
    const counts: Record<string, number> = { worn: 0, tempered: 0, inscribed: 0, relic: 0 };
    for (let i = 0; i < 4000; i++) counts[generateItem(r, 10, { cls: 'cinder' }).rarity]++;
    expect(counts.worn).toBeGreaterThan(counts.tempered);
    expect(counts.tempered).toBeGreaterThan(counts.inscribed);
    expect(counts.relic).toBeLessThan(counts.inscribed / 3);
    expect(counts.relic).toBeGreaterThan(0);
  });

  it('unidentified inscribed items contribute no affix stats until identified', () => {
    const r = new Rng(11);
    const it = generateItem(r, 12, { cls: 'cinder', rarity: 'inscribed', group: 'ring', identified: false });
    const hidden = itemStats(it);
    it.identified = true;
    const shown = itemStats(it);
    const sum = (s: Record<string, number>) => Object.values(s).reduce((a, b) => a + b, 0);
    expect(sum(shown)).toBeGreaterThan(sum(hidden));
    expect(describeItem({ ...it, identified: false }).some((l) => l.kind === 'hidden')).toBe(true);
  });

  it('relic items carry a fixed power', () => {
    const r = new Rng(9);
    for (let i = 0; i < 30; i++) {
      const it = generateItem(r, 20, { cls: 'cinder', rarity: 'relic', identified: true });
      expect(it.relic).toBeTruthy();
      expect(describeItem(it).some((l) => l.kind === 'power')).toBe(true);
      expect(rarityRank(it.rarity)).toBe(3);
    }
  });
});

describe('inventory grid', () => {
  it('places 1x1, 1x2 and 2x3 items without overlap and rejects overflow', () => {
    const inv = new Inventory(10, 6);
    const r = new Rng(1);
    const big = generateItem(r, 10, { cls: 'cinder', rarity: 'worn', group: 'wpn' });
    expect(inv.add(big)).toBe(true);
    const b = BASE_BY_ID[big.base];
    expect(inv.canPlace(big, 0, 0, big.uid)).toBe(true);
    // fill with glyphs
    let n = 0;
    while (inv.add(makeGlyph('ember', 1))) n++;
    expect(n).toBe(60 - b.w * b.h);
    expect(inv.add(makeGlyph('ember', 1))).toBe(false);
    inv.sort();
    expect(inv.items().length).toBe(n + 1);
  });

  it('two-handed weapons displace the offhand', () => {
    const r = new Rng(3);
    const maul = generateItem(r, 10, { cls: 'cinder', rarity: 'worn', group: 'wpn' });
    // force a two-hander
    const m = { ...maul, base: 'maul_2' };
    const shield = { ...maul, base: 'shield_1', uid: 'x' };
    const plan = planEquip(m, 'weapon', { weapon: maul, offhand: shield }, 'cinder');
    expect(plan.ok).toBe(true);
    expect(plan.displaced.length).toBe(2);
    expect(planEquip({ ...maul, base: 'bow_1' }, 'weapon', {}, 'cinder').ok).toBe(false);
  });
});

describe('character progression', () => {
  it('levels, grants points, and caps at 20', () => {
    const ch = newCharacter('A', 'cinder', { body: 0, voice: 0 }, 1);
    expect(ch.skillPoints).toBe(1);
    addXp(ch, 1e9);
    expect(ch.level).toBe(20);
    expect(ch.skillPoints).toBe(20);
    expect(ch.attrPoints).toBe(10);
    expect(xpForLevelCheck()).toBe(true);
  });

  it('enforces skill requirements, mutually exclusive capstones and respec cost', () => {
    const ch = newCharacter('A', 'cinder', { body: 0, voice: 0 }, 1);
    addXp(ch, 1e9);
    expect(canRankUp(ch, 'cinder_ring').ok).toBe(true);
    const lowLevel = newCharacter('B', 'cinder', { body: 0, voice: 0 }, 1);
    expect(canRankUp(lowLevel, 'cinder_ring').ok).toBe(false);
    expect(canRankUp(ch, 'living_crucible').ok).toBe(false); // needs 10 points spent first
    for (const id of ['brand_arc', 'brand_arc', 'brand_arc', 'cinder_ring', 'cinder_ring', 'bastion_step', 'bastion_step', 'bulwark_temper', 'bulwark_temper', 'kindling']) rankUp(ch, id);
    expect(rankUp(ch, 'living_crucible')).toBe(true);
    expect(canRankUp(ch, 'unbroken_oath').ok).toBe(false);
    expect(respecAll(ch)).toBe(false); // level 20 respec costs gold
    ch.gold = 1000;
    const gold = ch.gold;
    expect(respecAll(ch)).toBe(true); // free through level 8, paid after
    expect(ch.gold).toBeLessThan(gold);
    expect(ch.skillPoints).toBe(21); // 20 level points + the free starting rank refunded
  });

  it('derived stats reflect attributes and gear', () => {
    const ch = newCharacter('A', 'ranger', { body: 0, voice: 0 }, 1);
    const base = computeDerived(ch);
    ch.attrs.vigor += 10;
    expect(computeDerived(ch).maxHp).toBe(base.maxHp + 100);
    expect(base.res.ember).toBe(0);
  });
});
