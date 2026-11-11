import { describe, expect, it } from 'vitest';
import { botState, buildList } from '../src/ai/bots';
import { ITEMS } from '../src/shared/items';
import { MONSTERS, RULES } from '../src/shared/units';
import { dealDamage, kill } from '../src/sim/combat';
import { PURE, Unit } from '../src/sim/types';
import { World } from '../src/sim/world';
import { botMatch, cmd, fixture, place, seat, step, stepSecs } from './helpers';

const camp = (w: World, type: string, side = 0) => w.camps.find((c) => c.def.type === type && (c.def.side === side || c.def.side === 2))!;

describe('jungle and neutral objectives', () => {
  it('camps spawn, fight back when attacked, leash, reset and heal', () => {
    const { w, h } = fixture([
      ['kesh', 0],
      ['vey', 1],
    ]);
    const [k] = h;
    stepSecs(w, RULES.campFirst + 1);
    const c = camp(w, 'moss');
    expect(c.alive).toBe(true);
    const mon = w.byId.get(c.units[0])!;
    place(w, k, c.def.x - 2.5, c.def.y);
    step(w, 30);
    expect(mon.npc!.aggroId).toBe(0); // neutral until provoked
    dealDamage(w, k, mon, 200, PURE);
    expect(mon.npc!.aggroId).toBe(k.id);
    const hp = k.hp;
    stepSecs(w, 3);
    expect(k.hp).toBeLessThan(hp); // it fights back
    place(w, k, c.def.x - 14, c.def.y - 9); // run beyond the leash
    stepSecs(w, 6);
    expect(mon.npc!.aggroId).toBe(0);
    expect(mon.hp).toBeCloseTo(mon.stats.maxHp, 0); // reset and healed
    expect(Math.hypot(mon.x - c.def.x, mon.y - c.def.y)).toBeLessThan(1.5);
  });

  it('a cleared camp pays gold/XP to the killer, grants its buff and respawns on a timer', () => {
    const { w, h } = fixture([
      ['kesh', 0],
      ['vey', 1],
    ]);
    const [k] = h;
    stepSecs(w, RULES.campFirst + 1);
    const c = camp(w, 'brass');
    const mon = w.byId.get(c.units[0])!;
    place(w, k, c.def.x - 2, c.def.y);
    const gold = k.hero!.gold;
    const ad = k.stats.ad;
    kill(w, mon, k);
    expect(k.hero!.gold - gold).toBe(MONSTERS.brass.gold);
    expect(k.hero!.xp).toBeGreaterThan(0);
    expect(c.alive).toBe(false);
    step(w, 2);
    expect(k.stats.ad).toBeGreaterThan(ad); // Brass Vigor
    stepSecs(w, MONSTERS.brass.respawn + 1);
    expect(c.alive).toBe(true);
  }, 30000);

  it('Twin Catalysts spawn at 3:30 and grant their team a predictable 4-minute buff plus gold', () => {
    const { w, h } = fixture([
      ['kesh', 0],
      ['suri', 0],
      ['vey', 1],
    ]);
    const [k, s, e] = h;
    stepSecs(w, RULES.catalystFirst - 2);
    expect(camp(w, 'catalystN').alive).toBe(false);
    stepSecs(w, 3);
    const n = camp(w, 'catalystN');
    const so = camp(w, 'catalystS');
    expect(n.alive && so.alive).toBe(true);
    const gold = [k.hero!.gold, s.hero!.gold, e.hero!.gold];
    place(w, k, n.def.x - 3, n.def.y);
    kill(w, w.byId.get(n.units[0])!, k);
    expect(w.teamBuff(0, 'gale')).toBe(true);
    expect(w.teamBuff(1, 'gale')).toBe(false);
    expect(k.hero!.gold - gold[0]).toBe(MONSTERS.catalystN.gold * 2); // killer bounty + team share
    expect(s.hero!.gold - gold[1]).toBe(MONSTERS.catalystN.gold);
    expect(e.hero!.gold - gold[2]).toBe(0);
    kill(w, w.byId.get(so.units[0])!, e);
    expect(w.teamBuff(1, 'forge')).toBe(true);
    // Forge: +20% structure damage for the owning team
    const tower = w.structByKey.get('t0-up-outer')!;
    const wave = (w as unknown as { spawnWave(l: number): void }).spawnWave.bind(w);
    wave(0);
    const m = w.units.find((u) => u.kind === 'minion' && u.team === 1)!;
    place(w, m, tower.x + 3, tower.y + 2);
    expect(dealDamage(w, e, tower, 100, PURE, { basic: true })).toBeCloseTo(120);
    stepSecs(w, RULES.catalystBuff + 1);
    expect(w.teamBuff(0, 'gale')).toBe(false);
    expect(n.alive).toBe(true); // respawned after 4 minutes
  }, 60000);

  it('the Aether Colossus spawns at 9:00; its buff empowers minions near allied heroes and speeds recall', () => {
    const { w, h } = fixture([
      ['kesh', 0],
      ['vey', 1],
    ]);
    const [k] = h;
    stepSecs(w, RULES.colossusFirst + 1);
    const c = camp(w, 'colossus');
    expect(c.alive).toBe(true);
    const boss = w.byId.get(c.units[0])!;
    // objective HP is public: present in the enemy snapshot data even when unseen
    kill(w, boss, k);
    expect(w.teamBuff(0, 'colossus')).toBe(true);
    for (const m of w.units) if (m.kind === 'minion') m.alive = false;
    step(w, 1);
    (w as unknown as { spawnWave(l: number): void }).spawnWave(0);
    const mine = w.units.filter((u) => u.kind === 'minion' && u.team === 0);
    place(w, k, mine[0].x + 1, mine[0].y);
    step(w, 20);
    expect(mine.some((m) => m.effects.some((e) => e.type === 'empower'))).toBe(true);
    expect(w.units.filter((u) => u.kind === 'minion' && u.team === 1).some((m) => m.effects.some((e) => e.type === 'empower'))).toBe(false);
    place(w, k, 60, 97);
    cmd(w, k, { t: 'recall' });
    expect((k.hero!.recallUntil - w.tick) / 30).toBeCloseTo(RULES.recallTimeBuffed, 1);
  }, 60000);
});

describe('bots (server-ai)', () => {
  it('build graphs branch on the enemy damage profile and only contain real items', () => {
    const w = new World(botMatch(1, { seats: [seat('ilyra', 0), seat('oru', 0), seat('suri', 0), seat('brannoch', 1), seat('kesh', 1), seat('vey', 1)] }));
    const vsPhys = buildList(w, w.heroes[0], 0);
    expect(vsPhys).toContain('kilnheart_plate'); // enemy team is all physical
    const w2 = new World(botMatch(1, { seats: [seat('brannoch', 0), seat('kesh', 0), seat('suri', 0), seat('ilyra', 1), seat('oru', 1), seat('ilyra', 1)] }));
    expect(buildList(w2, w2.heroes[0], 1)).toContain('mistward_mantle');
    for (const id of [...vsPhys, ...buildList(w, w.heroes[0], 1)]) expect(ITEMS[id]).toBeTruthy();
  });

  it('use only the public command path: bots shop, rank up, lane, last-hit and never exceed human rules', () => {
    const w = new World(botMatch(11));
    stepSecs(w, 150);
    for (const h of w.heroes) {
      const hs = h.hero!;
      expect(hs.inv.some(Boolean), `${hs.heroId} bought`).toBe(true);
      expect(hs.ranks.reduce((a, b) => a + b, 0), `${hs.heroId} ranked`).toBe(hs.level - hs.skillPts);
      expect(hs.level).toBeGreaterThan(1);
      expect(botState(h).length).toBeGreaterThan(0);
      // economy sanity: gold earned can only come from the rules (start + passive + kills)
      expect(hs.goldEarned).toBeLessThan(RULES.startGold + 150 * RULES.passiveGold * w.pace.gold + hs.cs * 80 + (hs.k + hs.a) * 500 + 400);
    }
    expect(w.heroes.reduce((a, h) => a + h.hero!.cs, 0)).toBeGreaterThan(8);
  }, 60000);

  it('difficulty changes decisions, not stats', () => {
    const stats = (d: 'easy' | 'hard'): number[] => {
      const w = new World(botMatch(5, {}, d));
      step(w, 5);
      return w.heroes.map((h) => h.stats.maxHp + h.stats.ad * 10 + h.stats.speed * 100 + h.vision);
    };
    expect(stats('easy')).toEqual(stats('hard'));
  });
});

describe('whole matches', () => {
  it('is deterministic: the same seed and commands reproduce the same world', () => {
    const run = (seed: number): number => {
      const w = new World(botMatch(seed));
      step(w, 2400);
      return w.hash();
    };
    expect(run(42)).toBe(run(42));
    expect(run(42)).not.toBe(run(43));
  }, 60000);

  it('six bots play a full match to exactly one authoritative victory', () => {
    const w = new World(botMatch(2));
    const limit = 30 * 60 * 40;
    let maxUnits = 0;
    const t0 = performance.now();
    while (!w.over && w.tick < limit) {
      w.step();
      if (w.units.length > maxUnits) maxUnits = w.units.length;
    }
    const msPerTick = (performance.now() - t0) / w.tick;
    expect(w.over, `no winner after ${Math.round(w.time / 60)} minutes`).not.toBeNull();
    const loser = (1 - w.over!.winner) as 0 | 1;
    expect(w.structByKey.get(`t${loser}-engine`)!.alive).toBe(false);
    expect(w.structByKey.get(`t${w.over!.winner}-engine`)!.alive).toBe(true);
    // the victory path was honoured: a Seal fell and both Core Towers died before the Engine
    expect(w.structByKey.get(`t${loser}-core-a`)!.alive || w.structByKey.get(`t${loser}-core-b`)!.alive).toBe(false);
    expect(w.timeline.filter((t) => t.msg.includes('Seal')).length).toBeGreaterThan(0);
    expect(w.timeline.filter((t) => t.msg.includes('claims the Crown Engine'))).toHaveLength(1);
    for (const h of w.heroes) {
      expect(h.hero!.level).toBeGreaterThanOrEqual(6);
      expect(h.hero!.inv.filter(Boolean).length).toBeGreaterThanOrEqual(2);
    }
    expect(w.teams[0].kills + w.teams[1].kills).toBeGreaterThan(0);
    expect(maxUnits).toBeLessThan(200);
    expect(msPerTick).toBeLessThan(18); // server tick budget (p95 target) with six bots
    const tick = w.tick;
    w.step();
    expect(w.tick).toBe(tick);
  }, 240000);

  it('survives hostile / malformed commands without corrupting state', () => {
    const { w, h } = fixture([
      ['suri', 0],
      ['vey', 1],
    ]);
    const s = h[0] as Unit;
    const bad: unknown[] = [
      { t: 'move', x: Infinity, y: 0 },
      { t: 'move', x: -1e9, y: 1e9 },
      { t: 'attack', id: 999999 },
      { t: 'attack', id: s.id },
      { t: 'cast', slot: 0, x: 1, y: 1, id: -5 },
      { t: 'cast', slot: 5, x: Number.NaN, y: 1 },
      { t: 'buy', item: 'not_an_item' },
      { t: 'sell', slot: 77 },
      { t: 'rank', slot: 9 },
      { t: 'item', slot: 3, x: 0, y: 0 },
      { t: 'ward', x: 9999, y: -9999 },
    ];
    for (const c of bad) expect(() => cmd(w, s, c as never)).not.toThrow();
    step(w, 60);
    expect(Number.isFinite(s.x) && Number.isFinite(s.y)).toBe(true);
    expect(w.map.walkable(s.x, s.y, 0.2)).toBe(true);
    expect(s.hero!.gold).toBeLessThan(RULES.startGold + 10);
  });
});
