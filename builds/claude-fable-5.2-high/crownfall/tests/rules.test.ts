import { describe, expect, it } from 'vitest';
import { FOUNTAIN } from '../src/shared/map';
import { secs } from '../src/shared/math';
import { MINIONS, RULES } from '../src/shared/units';
import { bountyOf, dealDamage, kill, mitigate, respawnSeconds, structVulnerable } from '../src/sim/combat';
import { PHYS, PURE, Unit } from '../src/sim/types';
import type { World } from '../src/sim/world';
import { UPPER_MID, cmd, fixture, learn, place, rejections, setLevel, step, stepSecs } from './helpers';

const spawnWave = (w: World, lane: number): void => (w as unknown as { spawnWave(l: number): void }).spawnWave(lane);
const minions = (w: World, team: number): Unit[] => w.units.filter((u) => u.kind === 'minion' && u.team === team && u.alive);
const struct = (w: World, key: string): Unit => w.structByKey.get(key)!;

describe('damage model', () => {
  it('uses reduction = d / (100 + |d|), mirrored for negative defence', () => {
    expect(mitigate(0, 0)).toBeCloseTo(1);
    expect(mitigate(100, 0)).toBeCloseTo(0.5);
    expect(mitigate(300, 0)).toBeCloseTo(0.25);
    expect(mitigate(-50, 0)).toBeCloseTo(1 + 50 / 150);
    expect(mitigate(-100000, 0)).toBeLessThan(2); // bounded amplification
    expect(mitigate(100, 25)).toBeCloseTo(1 - 75 / 175); // penetration applies to positive defence only
  });

  it('pure damage ignores armor; shields soak before health', () => {
    const { w, h } = fixture([
      ['brannoch', 0],
      ['suri', 1],
    ]);
    const [a, b] = h;
    place(w, a, 70, 98);
    place(w, b, 73, 98);
    const hp = a.hp;
    dealDamage(w, b, a, 100, PURE);
    expect(hp - a.hp).toBeCloseTo(100, 5);
    a.shields.push({ amount: 80, until: w.tick + 300, src: 0, oru: false });
    const hp2 = a.hp;
    dealDamage(w, b, a, 100, PURE);
    expect(hp2 - a.hp).toBeCloseTo(20, 5);
    const hp3 = a.hp;
    dealDamage(w, b, a, 100, PHYS);
    expect(hp3 - a.hp).toBeCloseTo(100 * mitigate(a.stats.armor, 0), 4);
  });
});

describe('lane economy', () => {
  it('waves are 3 Guards + 3 Bolts, with a Siege minion every third wave', () => {
    const { w } = fixture([
      ['brannoch', 0],
      ['suri', 1],
    ]);
    spawnWave(w, 0);
    let m = minions(w, 0);
    expect(m.filter((u) => u.sub === 'guard')).toHaveLength(3);
    expect(m.filter((u) => u.sub === 'bolt')).toHaveLength(3);
    expect(m.filter((u) => u.sub === 'siege')).toHaveLength(0);
    spawnWave(w, 0);
    spawnWave(w, 0);
    m = minions(w, 0);
    expect(m.filter((u) => u.sub === 'siege')).toHaveLength(1);
    expect(minions(w, 1)).toHaveLength(m.length);
  });

  it('spawns waves on the 30 s cadence, alternating between the lanes', () => {
    const { w } = fixture([
      ['brannoch', 0],
      ['suri', 1],
    ]);
    stepSecs(w, RULES.firstWave + 0.1);
    expect(minions(w, 0).every((m) => m.npc!.lane === 0)).toBe(true);
    expect(minions(w, 0)).toHaveLength(6);
    stepSecs(w, 15);
    expect(minions(w, 0).filter((m) => m.npc!.lane === 1)).toHaveLength(6);
  });

  it('only the last hit pays gold, while nearby allies share experience with a group penalty', () => {
    const { w, h } = fixture([
      ['suri', 0],
      ['oru', 0],
      ['kesh', 0],
      ['vey', 1],
    ]);
    const [killer, near, far, enemy] = h;
    place(w, killer, 70, 98);
    place(w, near, 72, 99);
    place(w, far, 20, 57);
    place(w, enemy, 130, 57);
    spawnWave(w, 0);
    const victim = minions(w, 1)[0];
    place(w, victim, 73, 98);
    const g0 = [killer.hero!.gold, near.hero!.gold, far.hero!.gold];
    kill(w, victim, killer);
    expect(killer.hero!.gold - g0[0]).toBe(MINIONS[victim.sub].gold);
    expect(near.hero!.gold - g0[1]).toBe(0);
    expect(killer.hero!.cs).toBe(1);
    const share = MINIONS[victim.sub].xp * RULES.xpShare[1];
    expect(killer.hero!.xp).toBeCloseTo(share);
    expect(near.hero!.xp).toBeCloseTo(share);
    expect(far.hero!.xp).toBe(0);
    expect(RULES.xpShare[1] * 2).toBeGreaterThan(1); // sharing is a small penalty, not a split
  });

  it('pays ambient passive gold so nobody is starved', () => {
    const { w, h } = fixture([
      ['suri', 0],
      ['vey', 1],
    ]);
    const g = h[0].hero!.gold;
    stepSecs(w, 10);
    expect(h[0].hero!.gold - g).toBeCloseTo(RULES.passiveGold * 10, 1);
  });

  it('minions swap to an enemy hero who attacks an allied hero nearby', () => {
    const { w, h } = fixture([
      ['suri', 0],
      ['vey', 1],
    ]);
    const [suri, vey] = h;
    spawnWave(w, 0);
    const mine = minions(w, 0);
    const theirs = minions(w, 1);
    mine.forEach((m, i) => place(w, m, 70 + i * 0.6, 100));
    theirs.forEach((m, i) => place(w, m, 74 + i * 0.6, 100));
    place(w, suri, 71, 97);
    place(w, vey, 75, 97);
    step(w, 12);
    expect(theirs.some((m) => m.attackTarget === suri.id)).toBe(false); // minions prefer minions
    dealDamage(w, suri, vey, 10, PHYS, { basic: true });
    step(w, 10);
    expect(theirs.some((m) => m.attackTarget === suri.id)).toBe(true);
    stepSecs(w, 4);
    expect(theirs.filter((m) => m.alive).every((m) => m.attackTarget !== suri.id || w.byId.get(m.attackTarget) === suri)).toBe(true);
  });
});

describe('towers', () => {
  function setup() {
    const { w, h } = fixture([
      ['brannoch', 0],
      ['suri', 0],
      ['vey', 1],
    ]);
    const tower = struct(w, 't1-up-outer');
    return { w, h, tower };
  }

  it('prioritises minions over heroes, then heroes when no minion is in range', () => {
    const { w, h, tower } = setup();
    const [bran] = h;
    place(w, bran, tower.x - 5, tower.y + 2);
    step(w, 8);
    expect(tower.attackTarget).toBe(bran.id);
    spawnWave(w, 0);
    const m = minions(w, 0)[0];
    place(w, m, tower.x - 6, tower.y + 3);
    tower.attackTarget = 0;
    step(w, 8);
    expect(tower.attackTarget).toBe(m.id);
  });

  it('switches to a hero who damages a protected allied hero inside tower range, and ramps', () => {
    const { w, h, tower } = setup();
    const [bran, , vey] = h;
    spawnWave(w, 0);
    const m = minions(w, 0)[0];
    for (const o of minions(w, 0)) if (o !== m) kill(w, o, null);
    m.stats.maxHp = 1e6;
    m.hp = 1e6;
    place(w, m, tower.x - 6, tower.y + 3);
    place(w, bran, tower.x - 5, tower.y + 2);
    place(w, vey, tower.x - 3, tower.y + 2);
    step(w, 8);
    expect(tower.attackTarget).toBe(m.id);
    dealDamage(w, bran, vey, 20, PHYS, { basic: true });
    step(w, 2);
    expect(tower.attackTarget).toBe(bran.id);
    expect(tower.struct!.ramp).toBe(0);
    const hp0 = bran.hp;
    bran.stats.hpRegen = 0;
    stepSecs(w, 4.2);
    expect(tower.struct!.ramp).toBeGreaterThanOrEqual(2); // consecutive shots on the same hero hit harder
    expect(hp0 - bran.hp).toBeGreaterThan(tower.stats.ad * 2 * mitigate(bran.stats.armor, 0));
  });

  it('backdoor mitigation: structures shrug off most hero damage without attacking minions nearby', () => {
    const { w, h, tower } = setup();
    const [bran] = h;
    place(w, bran, tower.x - 2, tower.y + 2);
    const full = dealDamage(w, bran, tower, 1000, PURE, { basic: true });
    expect(full).toBeCloseTo(1000 * RULES.backdoorMult);
    spawnWave(w, 0);
    place(w, minions(w, 0)[0], tower.x - 4, tower.y + 2);
    expect(dealDamage(w, bran, tower, 1000, PURE, { basic: true })).toBeCloseTo(1000);
    expect(dealDamage(w, bran, tower, 1000, PURE, { ability: 0 })).toBe(0); // abilities never damage structures
  });
});

describe('structure gating and victory', () => {
  it('lane structures fall in order; a Seal is invulnerable until its Guard Tower dies', () => {
    const { w, h } = fixture([
      ['brannoch', 0],
      ['vey', 1],
    ]);
    const [bran] = h;
    const outer = struct(w, 't1-up-outer');
    const inner = struct(w, 't1-up-inner');
    const guard = struct(w, 't1-up-guard');
    const seal = struct(w, 't1-up-seal');
    expect(structVulnerable(w, outer)).toBe(true);
    for (const s of [inner, guard, seal]) {
      expect(structVulnerable(w, s)).toBe(false);
      expect(dealDamage(w, bran, s, 500, PURE, { basic: true })).toBe(0);
    }
    expect(cmd(w, bran, { t: 'attack', id: seal.id })).not.toBeNull();
    expect(rejections(w)).toContain('That structure is protected');
    kill(w, outer, bran);
    expect(structVulnerable(w, inner)).toBe(true);
    kill(w, inner, bran);
    kill(w, guard, bran);
    expect(structVulnerable(w, seal)).toBe(true);
    expect(dealDamage(w, bran, seal, 100, PURE, { basic: true })).toBeGreaterThan(0);
  });

  it('a broken Seal adds a Vanguard to that lane and reforms once after four minutes', () => {
    const { w, h } = fixture([
      ['brannoch', 0],
      ['vey', 1],
    ]);
    const seal = struct(w, 't1-up-seal');
    for (const k of ['outer', 'inner', 'guard']) kill(w, struct(w, `t1-up-${k}`), h[0]);
    kill(w, seal, h[0]);
    spawnWave(w, 0);
    expect(minions(w, 0).filter((m) => m.sub === 'vanguard')).toHaveLength(1);
    expect(minions(w, 1).filter((m) => m.sub === 'vanguard')).toHaveLength(0);
    spawnWave(w, 1);
    expect(minions(w, 0).filter((m) => m.sub === 'vanguard')).toHaveLength(1); // only the broken lane
    for (const m of w.units) if (m.kind === 'minion') m.alive = false;
    stepSecs(w, RULES.sealRespawn + 1);
    expect(seal.alive).toBe(true);
    kill(w, seal, h[0]);
    stepSecs(w, RULES.sealRespawn + 1);
    expect(seal.alive).toBe(false); // respawns only once
  }, 60000);

  it('Core Towers need a broken Seal, the Crown Engine needs both Core Towers; victory fires exactly once', () => {
    const { w, h } = fixture([
      ['brannoch', 0],
      ['vey', 1],
    ]);
    const [bran] = h;
    const coreA = struct(w, 't1-core-a');
    const coreB = struct(w, 't1-core-b');
    const engine = struct(w, 't1-engine');
    expect(structVulnerable(w, coreA)).toBe(false);
    expect(structVulnerable(w, engine)).toBe(false);
    for (const k of ['outer', 'inner', 'guard', 'seal']) kill(w, struct(w, `t1-low-${k}`), bran);
    expect(structVulnerable(w, coreA)).toBe(true);
    expect(structVulnerable(w, engine)).toBe(false);
    kill(w, coreA, bran);
    expect(structVulnerable(w, engine)).toBe(false);
    kill(w, coreB, bran);
    expect(structVulnerable(w, engine)).toBe(true);
    expect(w.over).toBeNull();
    kill(w, engine, bran);
    expect(w.over?.winner).toBe(0);
    const tick = w.tick;
    w.finish(1); // a second finish must not overwrite the result
    kill(w, struct(w, 't0-engine'), null);
    step(w, 30);
    expect(w.over?.winner).toBe(0);
    expect(w.tick).toBe(tick); // simulation is frozen once decided
    expect(w.timeline.filter((t) => t.msg.includes('claims the Crown Engine'))).toHaveLength(1);
  });
});

describe('death, bounties, recall', () => {
  it('awards the killer a visible bounty, assists a share, and schedules a level-scaled respawn', () => {
    const { w, h } = fixture([
      ['suri', 0],
      ['oru', 0],
      ['vey', 1],
    ]);
    const [suri, oru, vey] = h;
    place(w, suri, 70, 98);
    place(w, oru, 71, 99);
    place(w, vey, 73, 98);
    dealDamage(w, oru, vey, 30, PURE);
    const bounty = bountyOf(w, vey);
    const g = [suri.hero!.gold, oru.hero!.gold];
    dealDamage(w, suri, vey, 99999, PURE);
    expect(vey.alive).toBe(false);
    expect(suri.hero!.k).toBe(1);
    expect(oru.hero!.a).toBe(1);
    expect(suri.hero!.gold - g[0]).toBe(bounty + 80); // + first blood
    expect(oru.hero!.gold - g[1]).toBe(RULES.assistGold);
    expect(w.teams[0].kills).toBe(1);
    const t = (vey.hero!.respawnAt - w.tick) / 30;
    expect(t).toBeCloseTo(respawnSeconds(w, 1), 0);
    expect(t).toBeGreaterThanOrEqual(7);
    stepSecs(w, t + 0.2);
    expect(vey.alive).toBe(true);
    expect(Math.hypot(vey.x - FOUNTAIN[1].x, vey.y - FOUNTAIN[1].y)).toBeLessThan(5);
    expect(vey.hp).toBeCloseTo(vey.stats.maxHp, 0);
  });

  it('respawn time grows with level and match time but is capped at 34 s; bounties grow with streaks', () => {
    const { w, h } = fixture([
      ['suri', 0],
      ['vey', 1],
    ]);
    expect(respawnSeconds(w, 1)).toBeCloseTo(7, 0);
    expect(respawnSeconds(w, 12)).toBeGreaterThan(respawnSeconds(w, 1));
    w.tick = secs(60 * 60);
    expect(respawnSeconds(w, 12)).toBe(34);
    const base = bountyOf(w, h[1]);
    h[1].hero!.streak = 3;
    expect(bountyOf(w, h[1])).toBeGreaterThan(base);
    h[1].hero!.streak = 0;
    h[1].hero!.deathStreak = 4;
    expect(bountyOf(w, h[1])).toBeLessThan(base);
    expect(bountyOf(w, h[1])).toBeGreaterThanOrEqual(100);
  });

  it('recall channels 7 s, is cancelled by hero damage, and returns the hero to the fountain', () => {
    const { w, h } = fixture([
      ['suri', 0],
      ['vey', 1],
    ]);
    const [suri, vey] = h;
    place(w, suri, 70, 98);
    place(w, vey, 73, 98);
    cmd(w, suri, { t: 'recall' });
    expect(suri.hero!.recallUntil - w.tick).toBe(secs(RULES.recallTime));
    stepSecs(w, 3);
    dealDamage(w, vey, suri, 5, PURE);
    expect(suri.hero!.recallUntil).toBe(0);
    place(w, vey, 130, 57);
    cmd(w, suri, { t: 'recall' });
    stepSecs(w, RULES.recallTime - 0.2);
    expect(suri.x).toBeCloseTo(70, 0);
    stepSecs(w, 0.4);
    expect(Math.hypot(suri.x - FOUNTAIN[0].x, suri.y - FOUNTAIN[0].y)).toBeLessThan(5);
  });

  it('heals quickly in the fountain and burns enemies who walk into it', () => {
    const { w, h } = fixture([
      ['suri', 0],
      ['vey', 1],
    ]);
    const [suri, vey] = h;
    suri.hp = 100;
    stepSecs(w, 3);
    expect(suri.hp).toBeGreaterThan(100 + suri.stats.maxHp * 0.3);
    place(w, vey, FOUNTAIN[0].x + 3, FOUNTAIN[0].y);
    stepSecs(w, 2.5);
    expect(vey.alive).toBe(false);
  });
});

describe('progression and shop', () => {
  it('levels 1-12, ultimate at 6 and 11, and basic ranks capped by level', () => {
    const { w, h } = fixture([
      ['suri', 0],
      ['vey', 1],
    ]);
    const s = h[0];
    expect(cmd(w, s, { t: 'rank', slot: 3 })).not.toBeNull();
    expect(cmd(w, s, { t: 'rank', slot: 0 })).toBeNull();
    setLevel(w, s, 2);
    expect(cmd(w, s, { t: 'rank', slot: 0 })).not.toBeNull(); // rank 2 needs level 3
    expect(cmd(w, s, { t: 'rank', slot: 1 })).toBeNull();
    setLevel(w, s, 6);
    expect(cmd(w, s, { t: 'rank', slot: 3 })).toBeNull();
    expect(cmd(w, s, { t: 'rank', slot: 3 })).not.toBeNull(); // second ult rank at 11
    setLevel(w, s, 12);
    expect(s.hero!.level).toBe(12);
    setLevel(w, s, 13);
    expect(s.hero!.level).toBe(12);
    // 11 skill points remaining across Q/W/E (4 each) + R: cannot max everything
    let spent = 0;
    for (let i = 0; i < 20; i++) for (const slot of [3, 0, 1, 2]) if (cmd(w, s, { t: 'rank', slot }) === null) spent++;
    expect(s.hero!.skillPts).toBe(0);
    expect(s.hero!.ranks[3]).toBe(2);
    expect(s.hero!.ranks[0] + s.hero!.ranks[1] + s.hero!.ranks[2]).toBe(10);
    expect(spent).toBeGreaterThan(0);
  });

  it('buying needs the fountain, consumes owned components, and can be undone until you leave', () => {
    const { w, h } = fixture([
      ['suri', 0],
      ['vey', 1],
    ]);
    const s = h[0];
    const hs = s.hero!;
    hs.gold = 3000;
    expect(cmd(w, s, { t: 'buy', item: 'brass_edge' })).toBeNull();
    expect(hs.gold).toBe(2650);
    const adWith = s.stats.ad;
    expect(cmd(w, s, { t: 'buy', item: 'sunspoke_bow' })).toBeNull(); // 1300 - 350 owned component
    expect(hs.gold).toBe(2650 - 950);
    expect(hs.inv.filter(Boolean).map((i) => i!.id)).toEqual(['sunspoke_bow']);
    expect(s.stats.ad).toBeGreaterThan(adWith);
    expect(cmd(w, s, { t: 'undo' })).toBeNull();
    expect(hs.gold).toBe(2650);
    expect(hs.inv.filter(Boolean).map((i) => i!.id)).toEqual(['brass_edge']);
    expect(cmd(w, s, { t: 'sell', slot: 0 })).toBeNull();
    expect(hs.gold).toBe(2650 + Math.round(350 * 0.65));
    expect(cmd(w, s, { t: 'buy', item: 'brass_edge' })).toBeNull();
    place(w, s, 60, 98);
    step(w, 2);
    expect(cmd(w, s, { t: 'undo' })).not.toBeNull(); // left the fountain: undo is gone
    expect(cmd(w, s, { t: 'buy', item: 'trail_boots' })).not.toBeNull();
    expect(rejections(w)).toContain('Return to the fountain to shop');
  });

  it('rejects unaffordable purchases, second starters and overfull inventories', () => {
    const { w, h } = fixture([
      ['suri', 0],
      ['vey', 1],
    ]);
    const s = h[0];
    s.hero!.gold = 100;
    expect(cmd(w, s, { t: 'buy', item: 'trail_boots' })).not.toBeNull();
    s.hero!.gold = 99999;
    expect(cmd(w, s, { t: 'buy', item: 'couriers_satchel' })).toBeNull();
    expect(cmd(w, s, { t: 'buy', item: 'glass_shiv' })).not.toBeNull();
    for (const it of ['stone_token', 'plate_scrap', 'mist_thread', 'glow_shard', 'scribes_lens']) expect(cmd(w, s, { t: 'buy', item: it })).toBeNull();
    expect(cmd(w, s, { t: 'buy', item: 'keen_splinter' })).not.toBeNull(); // full
    expect(cmd(w, s, { t: 'buy', item: 'kilnheart_plate' })).toBeNull(); // combines two owned components
    expect(s.hero!.inv.filter(Boolean)).toHaveLength(5);
    expect(cmd(w, s, { t: 'buy', item: 'amber_draught' })).toBeNull();
    expect(cmd(w, s, { t: 'buy', item: 'amber_draught' })).toBeNull();
    expect(s.hero!.inv.find((i) => i?.id === 'amber_draught')!.n).toBe(2);
  });

  it('casting validates rank, cooldown, resource and crowd control with precise reasons', () => {
    const { w, h } = fixture([
      ['ilyra', 0],
      ['vey', 1],
    ]);
    const [il] = h;
    place(w, il, UPPER_MID.x, UPPER_MID.y);
    expect(cmd(w, il, { t: 'cast', slot: 0, x: 80, y: 98 })).toBe('Ability not learned yet');
    learn(w, il, [1, 1, 1, 0]);
    expect(cmd(w, il, { t: 'cast', slot: 0, x: 80, y: 98 })).toBeNull();
    stepSecs(w, 0.5);
    expect(cmd(w, il, { t: 'cast', slot: 0, x: 80, y: 98 })).toBe('On cooldown');
    il.mana = 5;
    expect(cmd(w, il, { t: 'cast', slot: 1, x: 80, y: 98 })).toBe('Not enough mana');
    il.mana = 400;
    il.effects.push({ type: 'silence', until: w.tick + 60, value: 0, src: 0, total: 60 });
    expect(cmd(w, il, { t: 'cast', slot: 1, x: 80, y: 98 })).toBe('Silenced');
    expect(cmd(w, il, { t: 'cast', slot: 0, x: Number.NaN, y: 3 })).toBe('bad');
  });
});
