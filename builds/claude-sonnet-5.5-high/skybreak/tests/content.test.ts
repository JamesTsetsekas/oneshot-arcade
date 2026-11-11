import { describe, expect, it } from 'vitest';
import {
  AMMO_CAPS, COMBAT, INVENTORY_SLOTS, ITEMS, ITEM_IDS, MOVE, PROTOTYPE_MATCH_CAP, RARITIES, STORM_PHASES, WEAPONS, WEAPON_IDS,
  effectiveWeapon, falloffMult,
} from '../src/shared/content';

describe('shared content (data-driven rules)', () => {
  it('defines the nine brief weapons, five rarities, four ammo types and eight items', () => {
    expect(WEAPON_IDS).toHaveLength(9);
    expect(RARITIES.map((r) => r.name)).toEqual(['Field', 'Tuned', 'Advanced', 'Masterwork', 'Prototype']);
    expect(RARITIES.map((r) => r.shape)).toEqual(['circle', 'chevron', 'diamond', 'crown', 'star']);
    expect(AMMO_CAPS).toEqual({ light: 240, shell: 48, heavy: 80, charge: 18 });
    expect(ITEM_IDS).toHaveLength(8);
    expect(INVENTORY_SLOTS).toBe(5);
  });

  it('matches the brief item stack sizes and movement/combat constants', () => {
    expect(ITEMS.medInjector.stack).toBe(4);
    expect(ITEMS.traumaKit.stack).toBe(2);
    expect(ITEMS.shieldFlask.stack).toBe(4);
    expect(ITEMS.aegisCell.stack).toBe(2);
    expect(ITEMS.grappleSpool.stack).toBe(3);
    expect(MOVE.walk).toBe(4.8); expect(MOVE.run).toBe(5.8); expect(MOVE.sprint).toBe(7.3); expect(MOVE.crouch).toBe(2.8);
    expect(MOVE.slideMinSpeed).toBe(5.5); expect(MOVE.slideDuration).toBe(1); expect(MOVE.slideCooldown).toBe(1.2);
    expect(COMBAT.maxAegis).toBe(50); expect(COMBAT.maxReserve).toBe(50); expect(COMBAT.aegisDelay).toBe(8); expect(COMBAT.aegisRate).toBe(10);
    expect(PROTOTYPE_MATCH_CAP).toBeGreaterThan(0);
  });

  it('keeps rarity modest: never doubles damage, Field is the baseline', () => {
    for (const id of WEAPON_IDS) {
      const base = effectiveWeapon(id, 0);
      for (let r = 1; r < 5; r++) {
        const e = effectiveWeapon(id, r);
        expect(e.damage / base.damage).toBeLessThan(1.12);
        expect(e.damage / base.damage).toBeGreaterThanOrEqual(1);
      }
    }
    expect(effectiveWeapon('wayfarer', 1).damage / effectiveWeapon('wayfarer', 0).damage).toBeCloseTo(1.03, 5);
    expect(effectiveWeapon('wayfarer', 3).mag).toBeGreaterThan(effectiveWeapon('wayfarer', 0).mag);
  });

  it('uses the brief storm phases', () => {
    const radii = STORM_PHASES.slice(1, 6).map((p) => p.toRadius);
    expect(radii).toEqual([320, 210, 125, 70, 35]);
    expect(STORM_PHASES.slice(1, 6).map((p) => p.damage)).toEqual([1, 2, 4, 7, 10]);
    expect(STORM_PHASES[2].wait).toBe(70); expect(STORM_PHASES[3].wait).toBe(55); expect(STORM_PHASES[4].wait).toBe(40); expect(STORM_PHASES[5].wait).toBe(30);
    expect(STORM_PHASES[0].wait).toBe(90);
  });

  it('applies linear damage falloff between start and end', () => {
    const d = WEAPONS.needler;
    expect(falloffMult(d, 1)).toBe(1);
    expect(falloffMult(d, d.falloffEnd + 50)).toBe(d.falloffMin);
    const mid = falloffMult(d, (d.falloffStart + d.falloffEnd) / 2);
    expect(mid).toBeGreaterThan(d.falloffMin); expect(mid).toBeLessThan(1);
  });
});
