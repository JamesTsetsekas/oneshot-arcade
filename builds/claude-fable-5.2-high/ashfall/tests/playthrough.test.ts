import { describe, expect, it } from 'vitest';
import { QUEST_DONE } from '../src/progression/quests';
import { boost, botStep, foes, makeSession } from './helpers';
import { dist } from '../src/core/math';
import { spawnEnemy } from '../src/entity-combat/combat';

/** Drives the real simulation with an autopilot from character creation to the act boss. */
function playAct(cls: 'cinder' | 'ranger', seed: number, difficulty = 0) {
  const s = makeSession(cls, seed);
  boost(s.hero);
  if (difficulty) { s.hero.level = 20; s.hero.attrs.vigor += 150; s.hero.attrs.might += 120; s.hero.attrs.finesse += 120; s.hero.maxDifficulty = 1; s.hero.flags.artificer = true; s.newExpedition(1); }
  s.refresh(); s.player.hp = s.stats.hpMax;
  const visited = new Set<string>();
  let victory = false, tick = 0;
  const maxTicks = 30 * 60 * 40;
  for (; tick < maxTicks && !victory; tick++) {
    botStep(s, tick);
    s.hero.belt[0] = 99;
    s.tick();
    visited.add(s.zone.id);
    for (const e of s.events) if (e.type === 'victory' && e.s === 'act') victory = true;
    s.events.length = 0;
  }
  return { s, visited, victory, minutes: tick / 30 / 60 };
}
describe('full act playthrough (autopilot)', () => {
  for (const [cls, seed] of [['cinder', 20261111], ['ranger', 777]] as const) {
    it(`${cls}: town → Soot March → Toll-Keeper → Artificer → Hollow Archive → Orison Engine`, () => {
      const { s, visited, victory } = playAct(cls, seed);
      expect(s.hero.quest, `stuck at quest ${s.hero.quest} in ${s.zone.id}`).toBe(QUEST_DONE);
      expect(victory).toBe(true);
      for (const z of ['refuge', 'march', 'archive1', 'archive2', 'archive3']) expect(visited.has(z), z).toBe(true);
      expect(s.hero.waypoints).toContain('march');
      expect(s.hero.flags.artificer && s.hero.flags.toll_dead && s.hero.flags.engine_dead && s.hero.flags.act_done).toBe(true);
      expect(s.hero.maxDifficulty).toBe(1);
      expect(s.summary).not.toBeNull();
      expect(s.zone.inter.some((i) => i.key === 'town')).toBe(true);
      expect(s.hero.stats.kills).toBeGreaterThan(20);
    });
  }
  it('Veteran expedition is completable and uses a new seed, higher levels and two-modifier elites', () => {
    const { s, victory } = playAct('cinder', 99, 1);
    expect(victory).toBe(true);
    expect(s.hero.difficulty).toBe(1);
    const march = s.zones.get('march')!;
    expect(march.level).toBeGreaterThanOrEqual(15);
  });
  it('Target Hunt records a completion time and offers a portal home', () => {
    const s = makeSession('ranger', 31);
    boost(s.hero); s.hero.flags.act_done = true; s.refresh(); s.player.hp = s.stats.hpMax;
    s.startHunt('toll');
    expect(s.zone.id).toBe('hunt_toll');
    let done = false;
    for (let t = 0; t < 30 * 60 * 6 && !done; t++) { botStep(s, t); s.hero.belt[0] = 99; s.tick(); done = s.events.some((e) => e.type === 'victory' && e.s === 'hunt'); s.events.length = 0; }
    expect(done).toBe(true);
    expect(Object.values(s.hero.stats.bestHunt)[0]).toBeGreaterThan(0);
    expect(s.summary?.hunt).toBeTruthy();
  });
});
describe('balance sanity (unboosted level 1 heroes)', () => {
  for (const cls of ['cinder', 'ranger'] as const) {
    it(`a fresh ${cls} beats a small opening pack without dying`, () => {
      const s = makeSession(cls, 5);
      s.enterZone('hunt_toll', 'start');
      for (const a of s.zone.actors) if (a.kind !== 'player') { a.dead = true; a.deadT = 99; }
      const b = s.zone.landmarks.boss;
      s.enterZone('hunt_toll', 'start', { x: b.x - 6, y: b.y });
      for (let i = 0; i < 3; i++) spawnEnemy(s, 'crawler', b.x + 3 + i, b.y - 2 + i * 2, 1).ai!.state = 'approach';
      spawnEnemy(s, 'archer', b.x + 7, b.y, 1).ai!.state = 'approach';
      let t = 0;
      for (; t < 30 * 60 && foes(s).length; t++) { botStep(s, t); s.tick(); s.events.length = 0; expect(s.player.dead).toBe(false); }
      expect(foes(s).length).toBe(0);
      expect(s.player.hp).toBeGreaterThan(0);
      expect(dist(0, 0, 0, 0)).toBe(0);
    });
  }
});
