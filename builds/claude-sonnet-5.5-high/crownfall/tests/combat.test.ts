import { describe, expect, it } from 'vitest';
import { HERO_BY_ID, HEROES } from '../src/shared/content';
import { TEAM_BASE } from '../src/shared/map';
import { place, quietSim, ready, run } from './helpers';

describe('damage model', () => {
  it('uses reduction = defense / (100 + |defense|); negative defense amplifies (bounded)', () => {
    const sim = quietSim();
    const a = sim.heroes[0], t = sim.heroes[3];
    place(t, 0, 0);
    t.armor = 100; t.ward = 50;
    const before = t.hp;
    // freeze stat recompute by reading the first damage only
    const dealt = sim.damage(a, t, 100, 'physical');
    expect(dealt).toBeLessThanOrEqual(100);
    t.hp = before;
    const base = HERO_BY_ID[t.hero!.heroId].armor;
    t.armor = base;
    const d2 = sim.damage(null, t, 100, 'physical');
    expect(d2).toBeCloseTo(100 * (100 / (100 + t.armor)), 1);
    t.hp = t.maxHp;
    const d3 = sim.damage(null, t, 100, 'pure');
    expect(d3).toBeCloseTo(100, 5);
    t.hp = t.maxHp; t.armor = -50;
    const d4 = sim.damage(null, t, 100, 'physical');
    expect(d4).toBeGreaterThan(100);
    expect(d4).toBeLessThan(200);
  });
  it('shields absorb damage before health and expire', () => {
    const sim = quietSim();
    const t = sim.heroes[0];
    sim.grantShield(null, t, 100, 2);
    const hp = t.hp;
    sim.damage(null, t, 60, 'pure');
    expect(t.hp).toBe(hp);
    expect(t.shield).toBeCloseTo(40, 3);
    run(sim, 2.5);
    expect(t.shield).toBe(0);
  });
  it('slows combine strongest-only and hard CC disables movement', () => {
    const sim = quietSim();
    const t = sim.heroes[0];
    const base = t.baseMs;
    sim.addEffect(t, 'slow', 3, 0.3, 1, { tag: 'a' });
    sim.addEffect(t, 'slow', 3, 0.5, 2, { tag: 'b' });
    sim.recomputeStats(t);
    expect(t.ms).toBeCloseTo(base * 0.5, 2);
    place(t, -40, -20);
    sim.addEffect(t, 'root', 2, 1, 1);
    sim.command({ slot: 0, c: 'move', x: -20, z: -20 });
    run(sim, 1);
    expect(t.x).toBeCloseTo(-40, 1);
  });
});

describe('structures: towers, Seals, Cores, Crown Engine', () => {
  it('towers shoot minions first but switch to a hero who attacks an allied hero in range', () => {
    const sim = quietSim();
    const tower = sim.rules.structures.get('b-outer-0')!;
    const ally = sim.heroes[0], foe = sim.heroes[3];
    for (const h of sim.heroes) place(h, -60, 0);
    place(ally, tower.x - 2, tower.z + 2);
    place(foe, tower.x + 6, tower.z);
    const minion = sim.rules.spawnMinion(1, 0, 'guard');
    place(minion, tower.x + 5, tower.z + 3);
    for (const u of [foe, minion, ally]) u.visUntil[0] = 1e9;
    run(sim, 1);
    expect(tower.ttarget).toBe(minion.id);
    sim.damage(foe, ally, 10, 'physical');
    run(sim, 0.4);
    expect(tower.ttarget).toBe(foe.id);
    // the shot ramps against the same target while the aggro window is kept open
    let maxRamp = 0;
    for (let i = 0; i < 8; i++) { sim.damage(foe, ally, 1, 'physical'); run(sim, 0.5); maxRamp = Math.max(maxRamp, tower.tramp); }
    expect(maxRamp).toBeGreaterThan(0);
    expect(foe.damagers.size).toBeGreaterThanOrEqual(0);
  });
  it('a Seal is invulnerable until its Seal Guard Tower falls; destroying it spawns Vanguards', () => {
    const sim = quietSim();
    const seal = sim.rules.structures.get('r-seal-0')!;
    const guard = sim.rules.structures.get('r-guard-0')!;
    const atk = sim.heroes[0];
    run(sim, 1);
    expect(seal.invuln).toBe(true);
    expect(sim.damage(atk, seal, 5000, 'physical')).toBe(0);
    sim.damage(atk, guard, 1e6, 'pure');
    expect(guard.dead).toBe(true);
    run(sim, 0.2);
    expect(seal.invuln).toBe(false);
    sim.damage(atk, seal, 1e6, 'pure');
    expect(seal.dead).toBe(true);
    expect(sim.teams[0].vanguardLane[0]).toBe(true);
    // next wave contains a Vanguard in that lane for the attacker
    run(sim, 40);
    expect(sim.units.some((u) => u.mtype === 'vanguard' && u.team === 0 && u.lane === 0)).toBe(true);
    // the Seal re-forms once after 4 minutes
    run(sim, 245);
    expect(sim.rules.structures.get('r-seal-0')!.dead).toBe(false);
    expect(sim.teams[0].vanguardLane[0]).toBe(false);
  });
  it('Core Towers need a broken Seal; the Crown Engine needs both Cores; victory fires exactly once', () => {
    const sim = quietSim();
    const atk = sim.heroes[0];
    const core0 = sim.rules.structures.get('r-core-0')!, core1 = sim.rules.structures.get('r-core-1')!, engine = sim.rules.structures.get('r-engine')!;
    run(sim, 1);
    expect(core0.invuln).toBe(true);
    expect(engine.invuln).toBe(true);
    sim.damage(atk, sim.rules.structures.get('r-guard-1')!, 1e6, 'pure');
    run(sim, 0.2);
    sim.damage(atk, sim.rules.structures.get('r-seal-1')!, 1e6, 'pure');
    run(sim, 0.2);
    expect(core0.invuln).toBe(false);
    expect(engine.invuln).toBe(true);
    sim.damage(atk, core0, 1e6, 'pure');
    run(sim, 0.2);
    expect(engine.invuln).toBe(true);
    sim.damage(atk, core1, 1e6, 'pure');
    run(sim, 0.2);
    expect(engine.invuln).toBe(false);
    sim.events.length = 0;
    sim.damage(atk, engine, 1e6, 'pure');
    sim.damage(atk, engine, 1e6, 'pure');
    run(sim, 3);
    expect(sim.winner).toBe(0);
    expect(sim.events.filter((e) => e.t === 'victory')).toHaveLength(1);
  });
  it('applies backdoor mitigation when no allied minion is nearby', () => {
    const sim = quietSim();
    const tower = sim.rules.structures.get('r-outer-0')!;
    const atk = sim.heroes[0];
    const hp0 = tower.hp;
    sim.damage(atk, tower, 100, 'pure');
    const backdoor = hp0 - tower.hp;
    tower.hp = hp0;
    const m = sim.rules.spawnMinion(1, 0, 'guard');
    place(m, tower.x + 2, tower.z + 2);
    sim.damage(atk, tower, 100, 'pure');
    const normal = hp0 - tower.hp;
    expect(backdoor).toBeLessThan(normal * 0.5);
  });
  it('fountains punish enemy heroes who camp them', () => {
    const sim = quietSim();
    const foe = sim.heroes[3];
    place(foe, TEAM_BASE[0].fountain.x + 2, 0);
    run(sim, 2);
    expect(foe.dead).toBe(true);
  });
});

describe('minions', () => {
  it('walk lanes and fight: waves clash, towers kill minions, and the field does not clog', () => {
    const sim = quietSim();
    run(sim, 14 + 30 * 4);
    const alive = sim.units.filter((u) => u.kind === 'minion').length;
    const spawned = sim.rules.waveNo * 26;
    expect(sim.rules.waveNo).toBeGreaterThanOrEqual(4);
    expect(alive).toBeLessThan(spawned * 0.7);
    expect(alive).toBeGreaterThan(6);
    const dmg = sim.units.some((u) => u.kind === 'minion' && u.hp < u.maxHp);
    expect(dmg || alive < spawned).toBe(true);
  });
});

describe('hero kits: every ability casts, validates and has an effect', () => {
  // arena on the blue lane between the inner and outer tower (no obstacles): x in [-26, -12], z = -37.5
  const Z = -37.5;
  const setup = (blue: string) => {
    const sim = quietSim([blue, 'oru', 'kesh'], ['vey', 'ilyra', 'brannoch']);
    const me = sim.heroes[0];
    for (const h of sim.heroes) place(h, -60, 0);
    for (const st of sim.rules.structures.values()) st.ad = 0;
    place(me, -25, Z);
    ready(sim, me);
    const foe = sim.heroes[3];
    ready(sim, foe);
    place(foe, -19, Z);
    me.visUntil[0] = 1e9;
    foe.visUntil[0] = 1e9; foe.visUntil[1] = 1e9;
    me.facing = 0;
    sim.addEffect(me, 'disarm', 999, 1, 0); sim.addEffect(foe, 'disarm', 999, 1, 0);
    return { sim, me, foe };
  };
  type S = ReturnType<typeof setup>;
  const cast = (sim: S['sim'], slot: number, x: number, z: number, target = 0) => {
    sim.command({ slot: 0, c: 'cast', ab: slot, x, z, target });
  };
  const refresh = (u: S['me'], slot?: number) => {
    u.mana = u.maxMana; u.hp = u.maxHp; u.effects = []; u.visUntil[0] = 1e9; u.visUntil[1] = 1e9;
    u.effects.push({ type: 'disarm', until: 1e9, amount: 1, src: 0 });
    if (slot !== undefined) u.hero!.cds[slot] = 0; else u.hero!.cds = [0, 0, 0, 0];
  };

  it('Brannoch: Fault Hammer damages + slows; Rampart Fold raises blocking walls; Citybreaker leaps and knocks up; Anchor Line recast hauls him', () => {
    const { sim, me, foe } = setup('brannoch');
    place(foe, -22, Z);
    cast(sim, 0, -22, Z);
    run(sim, 1);
    expect(foe.hp).toBeLessThan(foe.maxHp);
    cast(sim, 1, -22, Z);
    run(sim, 0.5);
    expect(sim.walls.length).toBeGreaterThanOrEqual(5);
    sim.walls.length = 0;
    refresh(foe); place(foe, -17, Z); refresh(me, 3);
    cast(sim, 3, -17, Z);
    run(sim, 2);
    expect(Math.hypot(me.x + 17, me.z - Z)).toBeLessThan(3.5);
    expect(foe.hp).toBeLessThan(foe.maxHp - 100);
    place(me, -25, Z); refresh(me, 2);
    cast(sim, 2, -17, Z);
    run(sim, 0.3);
    cast(sim, 2, -17, Z);
    run(sim, 1);
    expect(me.x).toBeGreaterThan(-23);
  });
  it('Suri: Ricochet Bolt hits, Parcel Charge detonates, Redline Delivery scales with distance, Slipstream grants a speed lane', () => {
    const { sim, me, foe } = setup('suri');
    cast(sim, 0, -19, Z);
    run(sim, 1.5);
    expect(foe.hp).toBeLessThan(foe.maxHp);
    refresh(foe); refresh(me);
    cast(sim, 2, foe.x, foe.z, foe.id);
    run(sim, 4);
    expect(foe.hp).toBeLessThan(foe.maxHp);
    refresh(foe); refresh(me); place(foe, -22, Z);
    cast(sim, 3, -22, Z);
    run(sim, 1.5);
    const near = foe.maxHp - foe.hp;
    refresh(foe); refresh(me); place(foe, -13, Z);
    cast(sim, 3, -13, Z);
    run(sim, 1.5);
    const far = foe.maxHp - foe.hp;
    expect(far).toBeGreaterThan(near);
    refresh(me, 1);
    const x0 = me.x;
    cast(sim, 1, -13, Z);
    run(sim, 0.5);
    expect(me.x).toBeGreaterThan(x0 + 3);
    expect(sim.zones.some((z) => z.tag === 'lane')).toBe(true);
  });
  it('Oru: Swarm damages enemies and shields allies; Hush halves vision; Draft hastes + marks; Night Migration roots', () => {
    const { sim, me, foe } = setup('oru');
    const ally = sim.heroes[1];
    place(ally, -22, Z + 2.2); ready(sim, ally); ally.visUntil[0] = 1e9;
    cast(sim, 0, -19, Z);
    run(sim, 3);
    expect(foe.hp).toBeLessThan(foe.maxHp);
    refresh(foe); refresh(me); place(foe, -17, Z);
    cast(sim, 1, -17, Z);
    run(sim, 1);
    expect(sim.has(foe, 'hush')).toBe(true);
    expect(foe.vision).toBeLessThan(11);
    cast(sim, 2, ally.x, ally.z, ally.id);
    run(sim, 0.5);
    expect(sim.has(ally, 'haste')).toBe(true);
    expect(sim.has(ally, 'guided')).toBe(true);
    refresh(foe); refresh(me); place(foe, -17, Z);
    cast(sim, 3, -17, Z);
    run(sim, 1.7);
    expect(foe.hp).toBeLessThan(foe.maxHp);
    expect(sim.has(foe, 'root')).toBe(true);
  });
  it('Kesh: Reed Cleaver recast deals bonus; Bogskin reduces damage; Sinkstep dashes; Fen Claim creates a marsh', () => {
    const { sim, me, foe } = setup('kesh');
    place(foe, -22.5, Z);
    cast(sim, 0, -22, Z);
    run(sim, 0.6);
    const first = foe.maxHp - foe.hp;
    expect(first).toBeGreaterThan(0);
    foe.hp = foe.maxHp * 0.4;
    const before = foe.hp;
    cast(sim, 0, -22, Z);
    run(sim, 0.8);
    expect(before - foe.hp).toBeGreaterThan(first * 0.95);
    refresh(me);
    cast(sim, 1, 0, 0);
    run(sim, 0.2);
    expect(sim.effAmount(me, 'dr')).toBeGreaterThan(0.3);
    refresh(me, 2);
    place(foe, -10, Z + 3);
    const x0 = me.x;
    cast(sim, 2, -17, Z);
    run(sim, 1);
    expect(me.x).toBeGreaterThan(x0 + 3);
    refresh(me, 3);
    cast(sim, 3, 0, 0);
    run(sim, 1);
    expect(sim.zones.some((z) => z.tag === 'fen')).toBe(true);
  });
  it('Ilyra: Linebreak hits, Redaction silences + erases enemy zones (not ultimates), Final Draft rings damage and stun', () => {
    const { sim, me, foe } = setup('ilyra');
    cast(sim, 0, -19, Z);
    run(sim, 1.2);
    expect(foe.hp).toBeLessThan(foe.maxHp);
    refresh(foe); refresh(me);
    const z = sim.spawnZone({ team: 1, owner: foe.id, x: -20, z: Z, r: 2, until: sim.time + 10, power: 1, tag: 'danger' });
    cast(sim, 2, -20, Z);
    run(sim, 1);
    expect(sim.zones.includes(z)).toBe(false);
    expect(sim.has(foe, 'silence')).toBe(true);
    const ult = sim.spawnZone({ team: 1, owner: foe.id, x: -20, z: Z, r: 2, until: sim.time + 10, power: 3, ult: true, tag: 'ult' });
    refresh(me, 2);
    cast(sim, 2, -20, Z);
    run(sim, 1);
    expect(sim.zones.includes(ult)).toBe(true);
    refresh(foe); refresh(me); place(foe, -19, Z);
    cast(sim, 3, -19, Z);
    run(sim, 2.5);
    expect(foe.hp).toBeLessThan(foe.maxHp - 200);
    expect(foe.effects.some((e) => e.type === 'stun')).toBe(true);
  });
  it('Vey: Shardstep dashes through (no repeat for 4s); Decoy; Cut the Light disables wards; Prism Sentence hits with line of sight', () => {
    const { sim, me, foe } = setup('vey');
    const x0 = me.x;
    cast(sim, 0, foe.x, foe.z, foe.id);
    run(sim, 0.6);
    expect(me.x).toBeGreaterThan(x0 + 4);
    expect(foe.hp).toBeLessThan(foe.maxHp);
    refresh(me, 0);
    const hp = foe.hp;
    place(me, -25, Z);
    cast(sim, 0, foe.x, foe.z, foe.id);
    run(sim, 0.6);
    expect(foe.hp).toBeGreaterThanOrEqual(hp);
    expect(hp - foe.hp).toBeLessThan(5);
    cast(sim, 1, -17, Z - 1);
    run(sim, 0.3);
    expect(sim.units.some((u) => u.kind === 'decoy')).toBe(true);
    sim.placeWard(sim.heroes[3], -22, Z);
    const ward = sim.units.find((u) => u.kind === 'ward')!;
    place(me, -25, Z); me.facing = 0; refresh(me, 2); ward.visUntil[0] = 1e9;
    cast(sim, 2, -22, Z);
    run(sim, 0.8);
    expect(ward.disabledUntil).toBeGreaterThan(sim.time + 3);
    refresh(foe); refresh(me, 3); place(foe, -19, Z); place(me, -25, Z);
    cast(sim, 3, foe.x, foe.z, foe.id);
    run(sim, 2);
    expect(foe.hp).toBeLessThan(foe.maxHp - 150);
  });
  it('rejects casts for unlearned skills, silence and low mana', () => {
    const { sim, me } = setup('suri');
    const skillshots = () => sim.projectiles.filter((p) => p.kind === 'skill').length;
    me.hero!.ranks[0] = 0;
    cast(sim, 0, -19, Z);
    run(sim, 0.5);
    expect(skillshots()).toBe(0);
    me.hero!.ranks[0] = 1;
    sim.addEffect(me, 'silence', 3, 1, 0);
    cast(sim, 0, -19, Z);
    run(sim, 0.5);
    expect(skillshots()).toBe(0);
    me.effects = [];
    me.mana = 1;
    cast(sim, 0, -19, Z);
    run(sim, 0.5);
    expect(skillshots()).toBe(0);
  });
  it('talents work: Skyhop blinks, Purify cleanses', () => {
    const { sim, me } = setup('suri');
    me.hero!.talents = ['skyhop', 'purify'];
    const x0 = me.x;
    sim.command({ slot: 0, c: 'talent', idx: 0, x: me.x + 20, z: me.z });
    run(sim, 0.5);
    expect(me.x).toBeGreaterThan(x0 + 3);
    sim.addEffect(me, 'stun', 5, 1, 0);
    sim.command({ slot: 0, c: 'talent', idx: 1, x: 0, z: 0 });
    expect(sim.has(me, 'stun')).toBe(false);
  });
  it('every hero defines legal, data-driven abilities (ranks, costs, cooldowns)', () => {
    for (const h of HEROES) for (const a of h.abilities) {
      expect(a.cd).toHaveLength(4); expect(a.cost).toHaveLength(4);
      for (const k of Object.keys(a.v)) expect(a.v[k]).toHaveLength(4);
      expect(a.castTime).toBeLessThan(1.2);
    }
  });
});

describe('skills and leveling rules', () => {
  it('R unlocks at levels 6 and 11 only (max rank 2); Q/W/E cap at 4', () => {
    const sim = quietSim();
    const h = sim.heroes[0];
    h.hero!.skillPts = 12; h.hero!.level = 5;
    sim.command({ slot: 0, c: 'rank', ab: 3 });
    expect(h.hero!.ranks[3]).toBe(0);
    h.hero!.level = 6;
    sim.command({ slot: 0, c: 'rank', ab: 3 });
    expect(h.hero!.ranks[3]).toBe(1);
    sim.command({ slot: 0, c: 'rank', ab: 3 });
    expect(h.hero!.ranks[3]).toBe(1);
    h.hero!.level = 11;
    sim.command({ slot: 0, c: 'rank', ab: 3 });
    expect(h.hero!.ranks[3]).toBe(2);
    h.hero!.level = 12;
    for (let i = 0; i < 6; i++) sim.command({ slot: 0, c: 'rank', ab: 0 });
    expect(h.hero!.ranks[0]).toBe(4);
  });
});
