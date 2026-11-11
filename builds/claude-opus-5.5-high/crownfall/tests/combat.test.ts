import { describe, it, expect } from 'vitest';
import { testMatch, place, seconds, steps, learnAll } from './helpers';
import { dealDamage, addShield } from '../src/sim/combat';
import { FOUNTAIN, STRUCTURES } from '../src/shared/map';
import { KILL_GOLD, MINIONS, RECALL_TIME, PASSIVE_GOLD_PER_SEC } from '../src/shared/rules';
import { ITEMS, SELL_RATIO } from '../src/shared/items';

const tower = (m: any, key: string) => m.structures.get(key);

describe('towers', () => {
  it('prefer minions, then switch to a hero who damages an allied hero in range, with visible ramp', () => {
    const { m, hero } = testMatch([{ hero: 'kesh', team: 0 }, { hero: 'suri', team: 1 }]);
    const t = tower(m, '1-0-outer');
    const att = hero(0), vic = hero(1);
    const minion = m.spawnMinion(0, 0, 'guard', 0);
    place(minion, t.x - 3, t.y); minion.minion!.wp = 9999; // park it
    place(att, t.x - 4, t.y + 1); place(vic, t.x - 2.5, t.y + 1.5);
    minion.stats.ms = 0; minion.base.ms = 0;
    steps(m, 10);
    expect(t.structure.target).toBe(minion.id);
    // attacker hits an enemy hero under the tower
    dealDamage(m, att, vic, 10, 'physical', { kind: 'attack', source: 'test' });
    steps(m, 2);
    expect(t.structure.target).toBe(att.id);
    const hp0 = att.hp;
    seconds(m, 3.2);
    expect(att.hp).toBeLessThan(hp0);
    expect(t.structure.rampN).toBeGreaterThanOrEqual(1);
  });
  it('do not target heroes while minions are available and nobody is aggressive', () => {
    const { m, hero } = testMatch([{ hero: 'brannoch', team: 0 }, { hero: 'oru', team: 1 }]);
    const t = tower(m, '1-0-outer');
    place(hero(0), t.x - 4, t.y);
    const mn = m.spawnMinion(0, 0, 'bolt', 0); place(mn, t.x - 5, t.y); mn.base.ms = 0;
    steps(m, 20);
    expect(t.structure.target).toBe(mn.id);
  });
});

describe('structures and victory', () => {
  it('Seal is invulnerable until its Guard Tower falls; destroying it enables Vanguards', () => {
    const { m, hero } = testMatch([{ hero: 'kesh', team: 0 }, { hero: 'suri', team: 1 }]);
    const seal = tower(m, '1-0-seal');
    dealDamage(m, hero(0), seal, 5000, 'pure', { kind: 'attack', source: 'test' });
    expect(seal.alive).toBe(true);
    for (const k of ['1-0-outer', '1-0-inner', '1-0-guard']) m.killUnit(tower(m, k), hero(0));
    expect(m.structureInvulnerable(seal)).toBe(false);
    m.killUnit(seal, hero(0));
    expect(seal.alive).toBe(false);
    m.nextWaveAt = m.time;
    steps(m, 2);
    expect(m.units.some((u) => u.minion?.kind === 'vanguard' && u.team === 0 && u.minion.lane === 0)).toBe(true);
    expect(m.units.some((u) => u.minion?.kind === 'vanguard' && u.team === 1)).toBe(false);
  });
  it('Seal respawns once after 4 minutes', () => {
    const { m, hero } = testMatch([{ hero: 'kesh', team: 0 }, { hero: 'suri', team: 1 }]);
    for (const k of ['1-0-outer', '1-0-inner', '1-0-guard', '1-0-seal']) m.killUnit(tower(m, k), hero(0));
    const seal = tower(m, '1-0-seal');
    seconds(m, 241);
    expect(seal.alive).toBe(true);
    m.killUnit(seal, hero(0));
    seconds(m, 250);
    expect(seal.alive).toBe(false);
  });
  it('Core Towers and Crown Engine follow vulnerability rules and victory fires exactly once', () => {
    const { m, hero } = testMatch([{ hero: 'kesh', team: 0 }, { hero: 'suri', team: 1 }]);
    const engine = tower(m, '1-engine'), core0 = tower(m, '1-0-core'), core1 = tower(m, '1-1-core');
    expect(m.structureInvulnerable(core0)).toBe(true);
    expect(m.structureInvulnerable(engine)).toBe(true);
    for (const k of ['1-1-outer', '1-1-inner', '1-1-guard', '1-1-seal']) m.killUnit(tower(m, k), hero(0));
    expect(m.structureInvulnerable(core0)).toBe(false);
    expect(m.structureInvulnerable(engine)).toBe(true);
    m.killUnit(core0, hero(0));
    expect(m.structureInvulnerable(engine)).toBe(true);
    m.killUnit(core1, hero(0));
    expect(m.structureInvulnerable(engine)).toBe(false);
    dealDamage(m, hero(0), engine, 1e6, 'pure', { kind: 'attack', source: 'test' });
    dealDamage(m, hero(0), engine, 1e6, 'pure', { kind: 'attack', source: 'test' });
    expect(m.over).toBe(true);
    expect(m.winner).toBe(0);
    expect(m.events.filter((e) => e.ev.e === 'victory').length).toBe(1);
    const r = m.result();
    expect(r.winner).toBe(0);
    expect(r.timeline.some((t) => t.text.includes('Crown Engine'))).toBe(true);
  });
  it('backdoor mitigation reduces hero damage when no attacking minions are near', () => {
    const { m, hero } = testMatch([{ hero: 'kesh', team: 0 }, { hero: 'suri', team: 1 }]);
    const t = tower(m, '1-0-outer');
    const hp = t.hp;
    const d1 = dealDamage(m, hero(0), t, 100, 'pure', { kind: 'attack', source: 'test' });
    const mn = m.spawnMinion(0, 0, 'guard', 0); place(mn, t.x - 3, t.y);
    m.step();
    const d2 = dealDamage(m, hero(0), t, 100, 'pure', { kind: 'attack', source: 'test' });
    expect(d1).toBeCloseTo(40);
    expect(d2).toBeCloseTo(100);
    expect(t.hp).toBeCloseTo(hp - 140);
  });
});

describe('economy', () => {
  it('last hit grants gold to the hero; nearby allies share XP with a group penalty', () => {
    const { m, hero } = testMatch([{ hero: 'suri', team: 0 }, { hero: 'oru', team: 0 }, { hero: 'kesh', team: 1 }]);
    const a = hero(0), b = hero(1);
    place(a, 0, -46); place(b, 2, -46);
    const mn = m.spawnMinion(1, 0, 'guard', 0); place(mn, 1, -44);
    m.step();
    const g0 = a.hero!.gold, xa = a.hero!.xp, xb = b.hero!.xp;
    dealDamage(m, a, mn, 1e5, 'pure', { kind: 'attack', source: 'test' });
    expect(a.hero!.gold - g0).toBeGreaterThanOrEqual(MINIONS.guard.gold);
    expect(a.hero!.cs).toBe(1);
    expect(b.hero!.gold).toBeLessThan(g0 + 1);
    expect(a.hero!.xp - xa).toBeCloseTo(MINIONS.guard.xp * 0.62, 0);
    expect(b.hero!.xp - xb).toBeCloseTo(MINIONS.guard.xp * 0.62, 0);
  });
  it('minions killed by non-heroes give no gold but still give nearby XP', () => {
    const { m, hero } = testMatch([{ hero: 'suri', team: 0 }, { hero: 'kesh', team: 1 }]);
    place(hero(0), 0, -46);
    const mn = m.spawnMinion(1, 0, 'bolt', 0); place(mn, 1, -45);
    const ally = m.spawnMinion(0, 0, 'guard', 0); place(ally, -1, -45);
    m.step();
    const g0 = hero(0).hero!.gold;
    dealDamage(m, ally, mn, 1e5, 'pure', { kind: 'attack', source: 'test' });
    expect(hero(0).hero!.gold).toBeCloseTo(g0, 0);
    expect(hero(0).hero!.xp).toBeGreaterThan(0);
  });
  it('hero kills pay killer/assists, streak bounties accumulate and are capped, respawn timer applies', () => {
    const { m, hero } = testMatch([{ hero: 'suri', team: 0 }, { hero: 'oru', team: 0 }, { hero: 'kesh', team: 1 }]);
    const k = hero(0), as = hero(1), v = hero(2);
    place(k, 0, 0); place(as, 1, 0); place(v, 2, 0);
    m.step();
    const gk = k.hero!.gold, ga = as.hero!.gold;
    dealDamage(m, as, v, 10, 'arcane', { kind: 'ability', source: 'test' });
    dealDamage(m, k, v, 1e5, 'pure', { kind: 'attack', source: 'test' });
    expect(v.alive).toBe(false);
    expect(k.hero!.k).toBe(1);
    expect(as.hero!.a).toBe(1);
    expect(k.hero!.gold - gk).toBeGreaterThanOrEqual(KILL_GOLD); // + first blood
    expect(as.hero!.gold - ga).toBeGreaterThan(0);
    expect(v.hero!.respawnAt - m.time).toBeCloseTo(7, 0);
    // global kill gold is not paid to the team
    k.hero!.streak = 10;
    expect(m.heroBounty(k)).toBeLessThanOrEqual(300);
    seconds(m, 7.2);
    expect(v.alive).toBe(true);
    expect(Math.hypot(v.x - FOUNTAIN[1].x, v.y - FOUNTAIN[1].y)).toBeLessThan(5);
  });
  it('ambient passive gold prevents starvation', () => {
    const { m, hero } = testMatch([{ hero: 'suri', team: 0 }]);
    const g0 = hero(0).hero!.gold;
    seconds(m, 70);
    expect(hero(0).hero!.gold - g0).toBeCloseTo(PASSIVE_GOLD_PER_SEC * 10, -1);
  });
});

describe('recall, fountain and shop', () => {
  it('recall channels 7 s, is cancelled by hero damage, then returns to fountain', () => {
    const { m, cmd, hero } = testMatch([{ hero: 'suri', team: 0 }, { hero: 'kesh', team: 1 }]);
    const u = hero(0);
    place(u, -20, -48);
    cmd(0, { t: 'recall' });
    seconds(m, 3);
    dealDamage(m, hero(1), u, 10, 'physical', { kind: 'attack', source: 'test' });
    expect(u.hero!.recall).toBeNull();
    cmd(0, { t: 'recall' });
    seconds(m, RECALL_TIME + 0.2);
    expect(Math.hypot(u.x - FOUNTAIN[0].x, u.y - FOUNTAIN[0].y)).toBeLessThan(4);
  });
  it('buy requires the fountain; undo restores gold and components; leaving locks undo; sell returns 65%', () => {
    const { m, cmd, hero } = testMatch([{ hero: 'brannoch', team: 0 }]);
    const u = hero(0), h = u.hero!;
    h.gold = 5000;
    cmd(0, { t: 'buy', item: 'c_heart' });
    expect(h.items[0]?.id).toBe('c_heart');
    const before = h.gold;
    cmd(0, { t: 'buy', item: 'kilnheart' });
    expect(h.items.some((s) => s?.id === 'kilnheart')).toBe(true);
    expect(h.items.some((s) => s?.id === 'c_heart')).toBe(false);
    expect(before - h.gold).toBe(ITEMS.kilnheart.cost - ITEMS.c_heart.cost);
    cmd(0, { t: 'undo' });
    expect(h.gold).toBe(before);
    expect(h.items.some((s) => s?.id === 'c_heart')).toBe(true);
    // sell
    const slot = h.items.findIndex((s) => s?.id === 'c_heart');
    const g = h.gold;
    cmd(0, { t: 'sell', slot });
    expect(h.gold - g).toBe(Math.floor(ITEMS.c_heart.cost * SELL_RATIO));
    // leaving the fountain clears undo
    cmd(0, { t: 'buy', item: 'c_rivet' });
    expect(h.undo.length).toBeGreaterThanOrEqual(1);
    place(u, -40, 0); m.step();
    expect(h.undo.length).toBe(0);
    // outside fountain: cannot buy
    const g2 = h.gold;
    cmd(0, { t: 'buy', item: 'c_gear' });
    expect(h.gold).toBe(g2);
  });
  it('undo is invalidated by dealing or taking damage', () => {
    const { m, cmd, hero } = testMatch([{ hero: 'brannoch', team: 0 }, { hero: 'kesh', team: 1 }]);
    const u = hero(0);
    u.hero!.gold = 3000;
    cmd(0, { t: 'buy', item: 'c_gear' });
    expect(u.hero!.undo.length).toBe(1);
    dealDamage(m, hero(1), u, 5, 'physical', { kind: 'attack', source: 'test' });
    expect(u.hero!.undo.length).toBe(0);
  });
});

describe('minions', () => {
  it('spawn waves of 3 Guard + 3 Bolt per lane, with a Siege every third wave', () => {
    const { m } = testMatch([{ hero: 'suri', team: 0 }]);
    m.nextWaveAt = m.time;
    m.step();
    const count = (k: string) => m.units.filter((u) => u.minion?.kind === k && u.alive).length;
    expect(count('guard')).toBe(12); expect(count('bolt')).toBe(12); expect(count('siege')).toBe(0);
    m.waveCount = 2; m.nextWaveAt = m.time; m.step();
    expect(count('siege')).toBe(4);
  });
  it('draw aggro onto a hero who attacks an allied hero nearby', () => {
    const { m, hero } = testMatch([{ hero: 'kesh', team: 0 }, { hero: 'suri', team: 1 }]);
    const enemyMinion = m.spawnMinion(1, 0, 'bolt', 0);
    place(enemyMinion, 0, -47); enemyMinion.base.ms = 0;
    const bait = m.spawnMinion(0, 0, 'guard', 0); place(bait, 3, -47); bait.base.ms = 0;
    place(hero(0), -3, -47); place(hero(1), -2, -45);
    steps(m, 10);
    expect(enemyMinion.atkTarget).toBe(bait.id);
    dealDamage(m, hero(0), hero(1), 5, 'physical', { kind: 'attack', source: 'test' });
    steps(m, 8);
    expect(enemyMinion.atkTarget).toBe(hero(0).id);
  });
});

describe('neutral objectives', () => {
  it('Catalysts spawn at 3:30, leash/reset, and award a predictable team buff and team gold', () => {
    const { m, hero } = testMatch([{ hero: 'kesh', team: 0 }, { hero: 'suri', team: 0 }, { hero: 'oru', team: 1 }]);
    const camp = m.camps.find((c) => c.def.key === 'catalyst-north')!;
    camp.respawnAt = 210;
    m.time = 209; m.step(); seconds(m, 1.5);
    expect(camp.alive.length).toBe(1);
    const cat = m.byId.get(camp.alive[0])!;
    // leash: pull it away and it resets to full
    place(hero(0), cat.x + 3, cat.y);
    dealDamage(m, hero(0), cat, 300, 'physical', { kind: 'attack', source: 'test' });
    place(hero(0), cat.x + 30, cat.y - 15);
    seconds(m, 6);
    expect(cat.hp).toBeCloseTo(cat.stats.maxHp, -1);
    // kill: team buff + gold for both allies
    place(hero(0), cat.x + 2, cat.y);
    const g1 = hero(1).hero!.gold;
    dealDamage(m, hero(0), cat, 1e6, 'pure', { kind: 'attack', source: 'test' });
    expect(m.teamBuff(0, 'gale')).toBe(true);
    expect(m.teamBuff(1, 'gale')).toBe(false);
    expect(hero(1).hero!.gold - g1).toBeGreaterThanOrEqual(100);
    m.step();
    expect(camp.respawnAt - m.time).toBeCloseTo(240, -1);
  });
  it('Aether Colossus spawns at 9:00; killer team gets minion empowerment and 4 s recall', () => {
    const { m, cmd, hero } = testMatch([{ hero: 'kesh', team: 0 }, { hero: 'suri', team: 1 }]);
    const camp = m.camps.find((c) => c.def.key === 'colossus')!;
    camp.respawnAt = 540;
    m.time = 539.5; seconds(m, 1);
    expect(camp.alive.length).toBe(1);
    const col = m.byId.get(camp.alive[0])!;
    dealDamage(m, hero(0), col, 1e7, 'pure', { kind: 'attack', source: 'test' });
    expect(m.teamBuff(0, 'colossus')).toBe(true);
    const mn = m.spawnMinion(0, 0, 'guard', 0);
    place(hero(0), mn.x + 2, mn.y);
    seconds(m, 1);
    expect(mn.minion!.empoweredUntil).toBeGreaterThan(m.time);
    place(hero(0), 0, -46);
    cmd(0, { t: 'recall' });
    expect(hero(0).hero!.recall!.until - hero(0).hero!.recall!.start).toBe(4);
  });
});

describe('damage pipeline', () => {
  it('shields absorb before health and Oru unbroken shields return 30% as health', () => {
    const { m, hero } = testMatch([{ hero: 'oru', team: 0 }, { hero: 'kesh', team: 0 }, { hero: 'suri', team: 1 }]);
    const oru = hero(0), ally = hero(1);
    learnAll(m, oru, 3);
    ally.hp = 300;
    addShield(m, oru, ally, 100, 1, true);
    dealDamage(m, hero(2), ally, 40, 'pure', { kind: 'attack', source: 'test' });
    expect(ally.hp).toBeCloseTo(300, 0);
    const before = ally.hp;
    seconds(m, 1.2);
    expect(ally.hp - before).toBeGreaterThan(15);
  });
  it('dead units cannot be damaged twice (lethal triggers once)', () => {
    const { m, hero } = testMatch([{ hero: 'suri', team: 0 }, { hero: 'kesh', team: 1 }]);
    dealDamage(m, hero(0), hero(1), 1e6, 'pure', { kind: 'attack', source: 'x' });
    dealDamage(m, hero(0), hero(1), 1e6, 'pure', { kind: 'attack', source: 'x' });
    expect(hero(0).hero!.k).toBe(1);
    expect(hero(1).hero!.d).toBe(1);
  });
});
void STRUCTURES;
