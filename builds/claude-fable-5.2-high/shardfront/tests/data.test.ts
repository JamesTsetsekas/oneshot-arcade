import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ABILITY_DEFS, ENTITY_DEFS, FACTIONS, TECH_DEFS, validateDefs } from '../src/data/defs';
import { defTip } from '../src/data/describe';

describe('balance data', () => {
  it('passes schema validation', () => {
    expect(validateDefs()).toEqual([]);
  });

  it('each faction has its full roster, six structures, a full tech line and a counter note per unit', () => {
    for (const f of ['helix', 'chorus'] as const) {
      const units = ENTITY_DEFS.filter((d) => d.faction === f && d.cls === 'unit');
      const structs = ENTITY_DEFS.filter((d) => d.faction === f && d.cls === 'structure');
      expect(units).toHaveLength(f === 'helix' ? 7 : 8);
      expect(structs).toHaveLength(6);
      expect(TECH_DEFS.filter((t) => t.faction === f)).toHaveLength(7);
      const trained = new Set(structs.flatMap((s) => s.trains));
      for (const u of units) {
        expect(trained.has(u.id), `${u.id} is trainable`).toBe(true);
        expect(u.counters.length).toBeGreaterThan(5);
        expect(defTip(u).length).toBeGreaterThan(2);
      }
      expect(FACTIONS[f].traits.length).toBeGreaterThan(1);
    }
  });

  it('every ability is referenced by a unit', () => {
    for (const a of ABILITY_DEFS) expect(ENTITY_DEFS.some((d) => d.ability === a.id), a.id).toBe(true);
  });
});

describe('architecture boundaries', () => {
  const walk = (dir: string): string[] => readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
  it('simulation, data, navigation, world, protocol and AI never import rendering, UI or audio, and use no wall-clock or DOM APIs', () => {
    for (const mod of ['sim', 'data', 'nav', 'world', 'net', 'ai']) {
      for (const file of walk(join('src', mod))) {
        const src = readFileSync(file, 'utf8');
        expect(/from '(three|react|\.\.\/render|\.\.\/ui|\.\.\/audio|\.\.\/input|\.\.\/app|\.\.\/game)/.test(src), file).toBe(false);
        expect(/\b(document\.|window\.|performance\.now|Date\.now|Math\.random)/.test(src), `${file} uses a non-deterministic or DOM API`).toBe(false);
      }
    }
  });
});
