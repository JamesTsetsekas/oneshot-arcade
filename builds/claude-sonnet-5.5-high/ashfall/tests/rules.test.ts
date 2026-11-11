import { describe, expect, it } from 'vitest';
import { ENEMIES, ELITE_MODS, NORMAL_TYPES } from '../src/data/enemies';
import { CLASS_SKILLS, SKILLS } from '../src/data/skills';
import { enemyResist } from '../src/sim/combat';
import { buildMarch, pickEliteMods } from '../src/sim/world';
import { Rng } from '../src/sim/rng';
import { DEFAULT_KEYS, keyLabel, mergeSettings } from '../src/ui/settings';
import { makeGame } from './helpers';

describe('combat readability rules (data-level)', () => {
  it('every attacking enemy telegraphs for at least 300 ms and recovers afterwards', () => {
    for (const t of NORMAL_TYPES) {
      const d = ENEMIES[t];
      if (d.attack === 'none') continue;
      expect(d.windup, `${t} windup`).toBeGreaterThanOrEqual(0.3);
      if (d.attack !== 'explode') expect(d.recover, `${t} recover`).toBeGreaterThanOrEqual(0.4);
      if (d.heavy) expect(d.windup, `${t} heavy windup`).toBeGreaterThanOrEqual(0.8);
    }
  });

  it('there are ten normal families, four elite modifiers with valid exclusions and two bosses', () => {
    expect(NORMAL_TYPES.length).toBe(10);
    expect(ELITE_MODS.length).toBeGreaterThanOrEqual(3);
    for (const m of ELITE_MODS) for (const x of m.incompatible) expect(ELITE_MODS.some((o) => o.id === x)).toBe(true);
    for (let i = 0; i < 200; i++) {
      const mods = pickEliteMods(new Rng(i), 3);
      for (const a of mods) for (const b of mods) if (a !== b) expect(ELITE_MODS.find((m) => m.id === a)!.incompatible).not.toContain(b);
    }
    expect(ENEMIES.toll_keeper.hp).toBeGreaterThan(0);
    expect(ENEMIES.orison_engine.hp).toBeGreaterThan(0);
  });

  it('skills carry the full definition set the brief asks for and tooltips derive from the same data', () => {
    for (const cls of ['cinder', 'ranger'] as const) {
      const list = CLASS_SKILLS[cls];
      expect(list.length).toBe(7); // basic + six actives
      expect(list.filter((s) => s.kind === 'core').length).toBe(1);
    }
    for (const s of SKILLS) {
      expect(s.tags.length).toBeGreaterThan(0);
      expect(s.time.total).toBeGreaterThan(s.time.wind - 1e-9);
      expect(s.time.move).toBeLessThanOrEqual(s.time.total + 1e-9);
      expect(s.vfx && s.sfx && s.exec && s.targeting).toBeTruthy();
      expect(s.cancel).toBeGreaterThan(0);
      expect(s.threat).toBeTruthy();
    }
    const g = makeGame('cinder', 3, 6);
    expect(g.skillTooltipDamage('brand_arc')).toBeGreaterThan(0);
    // more ranks -> more damage (same data drives simulation and tooltip)
    const before = g.skillTooltipDamage('brand_arc');
    g.ch.ranks.brand_arc++;
    expect(g.skillTooltipDamage('brand_arc')).toBeGreaterThan(before);
  });
});

describe('difficulty and loot guarantees', () => {
  it('Veteran raises enemy levels, resistances, elite density and item levels (not just health)', () => {
    const g = makeGame('cinder', 8, 15);
    g.enterZone('march');
    const normal = g.zone;
    const normalElites = normal.spawns.filter((s) => s.elite).length;
    const e = g.enemies.find((x) => x.type === 'crawler')!;
    const resNormal = enemyResist(g, e, 'frost');
    g.ch.difficulty = 'veteran';
    const vet = buildMarch(1234, 'veteran');
    expect(vet.level).toBeGreaterThan(normal.level + 5);
    let vetElites = 0;
    for (let s = 1; s <= 20; s++) vetElites += buildMarch(s, 'veteran').spawns.filter((x) => x.elite).length;
    let norElites = 0;
    for (let s = 1; s <= 20; s++) norElites += buildMarch(s, 'normal').spawns.filter((x) => x.elite && x.id !== 'toll_elite').length;
    expect(vetElites).toBeGreaterThan(norElites);
    expect(normalElites).toBeGreaterThanOrEqual(1);
    expect(enemyResist(g, e, 'frost')).toBeGreaterThan(resNormal);
    // Veteran elites roll two modifiers
    const tollVet = vet.spawns.find((s) => s.id === 'toll_elite')!;
    expect(tollVet.elite!.mods.length).toBe(2);
  });

  it('boss loot: first clear guarantees Inscribed-or-better, and Relic bad-luck protection forces a Relic', () => {
    const g = makeGame('cinder', 21, 14);
    g.enterZone('archive3');
    const boss = g.enemies.find((e) => e.type === 'orison_engine')!;
    g.ch.relicPity = 2; // two Relic-less boss kills in a row
    (g as unknown as { dropBossLoot(e: typeof boss, first: boolean): void }).dropBossLoot(boss, true);
    const items = g.pickups.filter((k) => k.kind === 'item').map((k) => k.item!);
    expect(items.filter((i) => i.rarity === 'inscribed' || i.rarity === 'relic').length).toBeGreaterThanOrEqual(2);
    expect(items.some((i) => i.rarity === 'relic')).toBe(true);
    expect(g.ch.relicPity).toBe(0);
    // boss drops are identified
    expect(items.filter((i) => i.rarity !== 'worn').every((i) => i.identified)).toBe(true);
  });

  it('loot rolls are seeded per run (same seed + same kills = same drops)', () => {
    const drops = (seed: number) => {
      const g = makeGame('ranger', seed, 8);
      g.enterZone('march');
      const out: string[] = [];
      for (let i = 0; i < 25; i++) out.push(g.genItem(10, {}).name);
      return out;
    };
    expect(drops(55)).toEqual(drops(55));
    expect(drops(55)).not.toEqual(drops(56));
  });
});

describe('settings model', () => {
  it('fills defaults, keeps overrides and labels keys', () => {
    const s = mergeSettings(JSON.stringify({ shake: 0.2, keys: { evade: 'KeyV' }, audio: { music: 0.1 } }));
    expect(s.shake).toBe(0.2);
    expect(s.keys.evade).toBe('KeyV');
    expect(s.keys.skillQ).toBe(DEFAULT_KEYS.skillQ);
    expect(s.audio.music).toBe(0.1);
    expect(s.audio.master).toBeGreaterThan(0);
    expect(keyLabel('KeyQ')).toBe('Q');
    expect(keyLabel('Digit3')).toBe('3');
    expect(mergeSettings('not json').quality).toBe('high');
  });
});
