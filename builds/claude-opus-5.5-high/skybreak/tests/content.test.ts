import { describe, expect, it } from 'vitest';
import { WEAPONS, WEAPON_IDS, weaponStats, effectiveDps, AMMO_CAPS, falloffMult } from '../src/shared/content/weapons';
import { RARITIES, Rarity } from '../src/shared/content/rarity';
import { ITEMS, ITEM_IDS } from '../src/shared/content/items';
import { LootTables } from '../src/server/loot';
import { Rng } from '../src/shared/rng';

describe('content tables', () => {
  it('has nine weapons, five rarities, four ammo types, eight items', () => {
    expect(WEAPON_IDS).toHaveLength(9);
    expect(RARITIES).toHaveLength(5);
    expect(Object.keys(AMMO_CAPS)).toEqual(['light', 'shell', 'heavy', 'charge']);
    expect(ITEM_IDS).toHaveLength(8);
  });
  it('ammo caps match the brief', () => {
    expect(AMMO_CAPS).toEqual({ light: 240, shell: 48, heavy: 80, charge: 18 });
  });
  it('rarity tiers use colour + distinct shape + name', () => {
    expect(new Set(RARITIES.map((r) => r.shape)).size).toBe(5);
    expect(RARITIES.map((r) => r.name)).toEqual(['Field', 'Tuned', 'Advanced', 'Masterwork', 'Prototype']);
  });
  it('higher rarity never doubles damage and improves DPS modestly and monotonically', () => {
    for (const id of WEAPON_IDS) {
      const base = weaponStats(id, 0);
      let prev = effectiveDps(base);
      for (let r = 1; r <= 3; r++) {
        const s = weaponStats(id, r as Rarity);
        expect(s.damage / base.damage).toBeLessThan(1.2);
        const dps = effectiveDps(s);
        expect(dps).toBeGreaterThanOrEqual(prev * 0.999);
        prev = dps;
      }
      const tuned = effectiveDps(weaponStats(id, 1)) / effectiveDps(base);
      expect(tuned).toBeGreaterThan(1.02);
      expect(tuned).toBeLessThan(1.08);
      expect(weaponStats(id, 4).damage / base.damage).toBeLessThan(2);
    }
  });
  it('magazines and ammo match the brief', () => {
    expect([WEAPONS.wayfarer.mag, WEAPONS.tempest.mag, WEAPONS.breakwater.mag, WEAPONS.coil.mag, WEAPONS.needler.mag, WEAPONS.sundial.mag, WEAPONS.longwake.mag, WEAPONS.harbor.mag])
      .toEqual([30, 28, 5, 6, 36, 12, 5, 15]);
    expect(WEAPONS.longwake.projectile).toBeDefined();
    expect(WEAPONS.gale.projectile?.knockback).toBeGreaterThan(10);
    expect(WEAPONS.sundial.ammo).toBe('heavy');
    for (const id of WEAPON_IDS) expect(WEAPONS[id].headMult).toBeLessThanOrEqual(2.0);
  });
  it('falloff is monotonic and bounded', () => {
    const s = weaponStats('needler', 0);
    expect(falloffMult(s, 5)).toBe(1);
    expect(falloffMult(s, 30)).toBeLessThan(1);
    expect(falloffMult(s, 500)).toBeCloseTo(WEAPONS.needler.falloffMin);
  });
  it('item stacks and timings match the brief', () => {
    expect(ITEMS.med).toMatchObject({ stack: 4, heal: 35, useTime: 3 });
    expect(ITEMS.trauma).toMatchObject({ stack: 2, healTo: 100, useTime: 7, interruptible: true });
    expect(ITEMS.flask).toMatchObject({ stack: 4, reserve: 25, useTime: 2.5 });
    expect(ITEMS.aegis_cell).toMatchObject({ stack: 2, useTime: 3 });
    expect(ITEMS.grapple.stack).toBe(3);
  });
  it('loot tables: chests suppress duplicates, Prototype only from premium and capped', () => {
    const t = new LootTables(new Rng(3));
    for (let i = 0; i < 300; i++) {
      const c = t.chest(3);
      const keys = c.filter((x) => x.kind !== 'ammo').map((x) => x.w ?? x.item);
      expect(new Set(keys).size).toBe(keys.length);
      expect(c.every((x) => x.r !== 4)).toBe(true);
      for (const f of t.floor(3, false)) expect(f.r).not.toBe(4);
    }
    let protos = 0;
    for (let i = 0; i < 50; i++) protos += t.premium().filter((x) => x.r === 4).length;
    expect(protos).toBeLessThanOrEqual(3);
  });
});
