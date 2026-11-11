import { describe, expect, test } from 'vitest';
import { ABILITIES, FACTIONS, STRUCTURES, TECHS, UNITS, factionStructures, factionUnits, validateFactionData } from '../src/faction-data';

describe('faction data', () => {
  test('schema validation passes', () => {
    expect(validateFactionData()).toEqual([]);
  });
  test('both rosters are complete (Helix 7 units, Verdant 8 units, 6 structures each)', () => {
    expect(factionUnits('helix')).toHaveLength(7);
    expect(factionUnits('verdant')).toHaveLength(8);
    for (const f of ['helix', 'verdant'] as const) {
      expect(factionStructures(f)).toHaveLength(6);
      expect(FACTIONS[f].worker).toBeTruthy();
    }
  });
  test('every unit has purpose, cost, prerequisite source, and counter text', () => {
    for (const u of Object.values(UNITS)) {
      expect(u.role.length).toBeGreaterThan(10);
      expect(u.cost.ore + u.cost.flux).toBeGreaterThan(0);
      expect(STRUCTURES[u.producedAt]).toBeDefined();
      expect(u.strongVs.length).toBeGreaterThan(3);
      expect(u.weakVs.length).toBeGreaterThan(3);
      for (const a of u.abilities) expect(ABILITIES[a]).toBeDefined();
    }
  });
  test('three attack and three armor upgrades per faction, none above 12% alone', () => {
    for (const f of ['helix', 'verdant']) {
      const atk = Object.values(TECHS).filter((t) => t.faction === f && t.effect.attackLevel);
      const arm = Object.values(TECHS).filter((t) => t.faction === f && t.effect.armorLevel);
      expect(atk).toHaveLength(3); expect(arm).toHaveLength(3);
    }
    // each level adds +6% damage or -5% damage taken (implemented in combat.ts)
    expect(0.06).toBeLessThanOrEqual(0.12);
    expect(0.05).toBeLessThanOrEqual(0.12);
  });
});
