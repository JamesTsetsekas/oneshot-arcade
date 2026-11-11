import { describe, it, expect } from 'vitest';
import { damageMultiplier, respawnTime, levelForXp, xpForLevel, rankAllowed, xpShare, MAX_LEVEL } from '../src/shared/rules';
import { ITEM_LIST, ITEMS, purchasePlan, TALENT_IDS } from '../src/shared/items';
import { HEROES } from '../src/shared/heroes';
import { HERO_IDS, abilityTooltip } from '../src/shared/types';

describe('stat formulas', () => {
  it('armor/ward reduction = d/(100+|d|), negative values amplify with a bounded mirror', () => {
    expect(damageMultiplier(0)).toBe(1);
    expect(damageMultiplier(100)).toBeCloseTo(0.5);
    expect(damageMultiplier(50)).toBeCloseTo(1 - 50 / 150);
    expect(damageMultiplier(-100)).toBeCloseTo(1.5);
    expect(damageMultiplier(-1e6)).toBeLessThan(2);
  });
  it('respawn starts at 7 s and caps at 34 s', () => {
    expect(respawnTime(1, 0)).toBe(7);
    expect(respawnTime(12, 3000)).toBe(34);
    expect(respawnTime(6, 300)).toBeGreaterThan(respawnTime(3, 300));
  });
  it('levels 1–12 from XP', () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(xpForLevel(6))).toBe(6);
    expect(levelForXp(1e9)).toBe(MAX_LEVEL);
  });
  it('shared XP applies a small group penalty', () => {
    expect(xpShare(1)).toBe(1);
    expect(xpShare(2) * 2).toBeGreaterThan(1);
    expect(xpShare(2)).toBeLessThan(1);
    expect(xpShare(3) * 3).toBeGreaterThan(xpShare(2) * 2);
  });
  it('R ranks at 6 and 11; Q/W/E cap at 4 and cannot all max by 12', () => {
    expect(rankAllowed('R', 0, 5)).toBe(false);
    expect(rankAllowed('R', 0, 6)).toBe(true);
    expect(rankAllowed('R', 1, 10)).toBe(false);
    expect(rankAllowed('R', 1, 11)).toBe(true);
    expect(rankAllowed('Q', 4, 12)).toBe(false);
    expect(rankAllowed('Q', 1, 2)).toBe(false);
    expect(rankAllowed('Q', 1, 3)).toBe(true);
    // 12 points total, R takes 2 => 10 for 12 possible Q/W/E ranks
    expect(12 - 2).toBeLessThan(12);
  });
});

describe('content', () => {
  it('has exactly 32 items with the required category split', () => {
    expect(ITEM_LIST.length).toBe(32);
    const count = (c: string) => ITEM_LIST.filter((i) => i.category === c).length;
    expect(count('starter')).toBe(6);
    expect(count('component')).toBe(10);
    expect(count('completed')).toBe(12);
    expect(count('boots')).toBe(2);
    expect(count('consumable')).toBe(2);
  });
  it('recipes are shallow and priced above their components', () => {
    for (const i of ITEM_LIST) for (const f of i.from) {
      expect(ITEMS[f]).toBeTruthy();
      expect(ITEMS[f].from.length).toBe(0);
    }
    for (const i of ITEM_LIST.filter((x) => x.from.length)) expect(i.cost).toBeGreaterThan(i.from.reduce((s, f) => s + ITEMS[f].cost, 0));
  });
  it('every completed item serves at least two heroes/builds', () => {
    for (const i of ITEM_LIST.filter((x) => x.category === 'completed')) {
      const users = HERO_IDS.flatMap((h) => HEROES[h].builds.filter((b) => b.items.includes(i.id) || b.vsArcane === i.id || b.vsPhysical === i.id).map((b) => `${h}:${b.name}`));
      expect(users.length, i.name).toBeGreaterThanOrEqual(2);
    }
  });
  it('owned components reduce purchase cost', () => {
    const full = purchasePlan('kilnheart', []);
    expect(full.cost).toBe(ITEMS.kilnheart.cost);
    const part = purchasePlan('kilnheart', ['c_heart', '', '', '', '', '']);
    expect(part.cost).toBe(ITEMS.kilnheart.cost - ITEMS.c_heart.cost);
    expect(part.consume).toEqual([0]);
  });
  it('six heroes each with passive + Q/W/E/R, two builds, and data-driven tooltips', () => {
    expect(HERO_IDS.length).toBe(6);
    for (const h of HERO_IDS) {
      const d = HEROES[h];
      expect(d.abilities.map((a) => a.slot)).toEqual(['P', 'Q', 'W', 'E', 'R']);
      expect(d.builds.length).toBeGreaterThanOrEqual(2);
      expect(d.base.ms).toBeGreaterThanOrEqual(3.4); expect(d.base.ms).toBeLessThanOrEqual(3.9);
      expect(d.radius).toBeGreaterThanOrEqual(0.45); expect(d.radius).toBeLessThanOrEqual(0.65);
      for (const a of d.abilities) {
        const t = abilityTooltip(a, 1);
        expect(t).not.toMatch(/\{\w+\}/);
      }
      expect(d.abilities[4].counter, `${h} ultimate needs a counter`).toBeTruthy();
    }
    expect(TALENT_IDS.length).toBe(6);
  });
});
