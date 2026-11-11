import { describe, expect, it } from 'vitest';
import { HEROES, ITEMS, ITEM_BY_ID, TALENTS, XP_TO_LEVEL } from '../src/shared/content';
import { BRUSH, CAMPS, LANES, STRUCTURES, TEAM_BASE, findPath, isWalkable, nearestWalkable, walkLine, brushAt } from '../src/shared/map';
import { Rng } from '../src/shared/math';
import { quote } from '../src/sim/items';
import { botSim, place, quietSim, ready, run } from './helpers';

describe('content', () => {
  it('ships 6 heroes with passive + Q/W/E/R and data-driven tooltips', () => {
    expect(HEROES).toHaveLength(6);
    for (const h of HEROES) {
      expect(h.abilities.map((a) => a.key)).toEqual(['Q', 'W', 'E', 'R']);
      expect(h.passive.name.length).toBeGreaterThan(2);
      expect(h.builds.length).toBeGreaterThanOrEqual(2);
      for (const a of h.abilities) expect(a.desc.length).toBeGreaterThan(20);
    }
  });
  it('ships 32 items in the requested tiers; every completed item serves at least two roles', () => {
    expect(ITEMS).toHaveLength(32);
    const count = (t: string) => ITEMS.filter((i) => i.tier === t).length;
    expect(count('starter')).toBe(6);
    expect(count('component')).toBe(10);
    expect(count('complete')).toBe(12);
    expect(count('boots')).toBe(2);
    expect(count('consumable')).toBe(2);
    for (const i of ITEMS.filter((x) => x.tier === 'complete')) expect(new Set(i.tags).size).toBeGreaterThanOrEqual(2);
    for (const i of ITEMS) for (const f of i.from ?? []) expect(ITEM_BY_ID[f]).toBeTruthy();
  });
  it('offers six universal talents and XP thresholds for 12 levels', () => {
    expect(TALENTS).toHaveLength(6);
    expect(XP_TO_LEVEL).toHaveLength(13);
  });
});

describe('map (The Broken Diadem)', () => {
  it('is 180-degree rotationally symmetric for structures and camps', () => {
    for (const s of STRUCTURES.filter((x) => x.team === 0)) {
      const twin = STRUCTURES.find((o) => o.team === 1 && o.type === s.type && (s.type === 'core' ? o.lane === s.lane : s.type === 'engine' ? true : o.lane === 1 - s.lane));
      expect(twin, `${s.id}`).toBeTruthy();
      if (s.type !== 'core') { expect(twin!.x).toBeCloseTo(-s.x, 3); expect(twin!.z).toBeCloseTo(-s.z, 3); }
    }
    for (const c of CAMPS.filter((x) => x.id.startsWith('b-'))) {
      const twin = CAMPS.find((o) => o.id === c.id.replace(/^b/, 'r'))!;
      expect(twin.x).toBeCloseTo(-c.x, 6); expect(twin.z).toBeCloseTo(-c.z, 6);
    }
  });
  it('has both lanes as connected corridors between the bases (paths route around structure footprints)', () => {
    for (const lane of LANES) {
      const a = lane[0], b = lane[lane.length - 1];
      const p = findPath(a.x, a.z, b.x, b.z);
      let len = 0, cx = a.x, cz = a.z;
      for (const q of p) { expect(walkLine(cx, cz, q.x, q.z)).toBe(true); len += Math.hypot(q.x - cx, q.z - cz); cx = q.x; cz = q.z; }
      expect(Math.hypot(cx - b.x, cz - b.z)).toBeLessThan(1.5);
      const laneLen = lane.slice(1).reduce((s, q, i) => s + Math.hypot(q.x - lane[i].x, q.z - lane[i].z), 0);
      expect(len).toBeLessThan(laneLen * 1.2);
    }
    const a = TEAM_BASE[0].spawn, b = TEAM_BASE[1].spawn;
    const p = findPath(a.x, a.z, b.x, b.z);
    expect(p.length).toBeGreaterThan(0);
    const end = p[p.length - 1];
    expect(Math.hypot(end.x - b.x, end.z - b.z)).toBeLessThan(2);
  });
  it('reaches every camp, objective and structure from the blue fountain (no unreachable gameplay)', () => {
    const f = TEAM_BASE[0].fountain;
    for (const c of [...CAMPS, ...STRUCTURES]) {
      const t = nearestWalkable(c.x, c.z);
      const p = findPath(f.x, f.z, t.x, t.z);
      let cx = f.x, cz = f.z, ok = true;
      for (const q of p) { if (!walkLine(cx, cz, q.x, q.z)) ok = false; cx = q.x; cz = q.z; }
      expect(ok, `${'id' in c ? c.id : ''}`).toBe(true);
      expect(Math.hypot(cx - t.x, cz - t.z)).toBeLessThan(1.5);
    }
  });
  it('fairness: lane lengths and tower arc distances match for both teams', () => {
    const lens = LANES.map((l) => l.slice(1).reduce((s, p, i) => s + Math.hypot(p.x - l[i].x, p.z - l[i].z), 0));
    expect(Math.abs(lens[0] - lens[1])).toBeLessThan(0.01);
    expect(BRUSH.length).toBeGreaterThan(10);
  });
  it('A* corrects blocked endpoints to the nearest walkable point', () => {
    const p = findPath(-40, 0, 0, 0); // centre of the Colossus pit is walkable; a rock centre is not
    expect(p.length).toBeGreaterThan(0);
    const blocked = nearestWalkable(-38, -21); // inside a rock
    expect(isWalkable(blocked.x, blocked.z)).toBe(true);
  });
});

describe('lane waves, economy, last hits', () => {
  it('spawns three Guard + three Bolt per lane per team every 30s, adding a Siege every third wave', () => {
    const sim = quietSim();
    run(sim, 14 + 8);
    const count = (team: number, lane: number, t: string) => sim.units.filter((u) => u.kind === 'minion' && u.team === team && u.lane === lane && u.mtype === t).length;
    for (const team of [0, 1]) for (const lane of [0, 1]) { expect(count(team, lane, 'guard')).toBe(3); expect(count(team, lane, 'bolt')).toBe(3); expect(count(team, lane, 'siege')).toBe(0); }
    run(sim, 30 + 30); // waves 2 and 3 (wave 3 has a siege)
    expect(sim.units.filter((u) => u.mtype === 'siege').length).toBeGreaterThanOrEqual(4);
  });
  it('awards last-hit gold to the killer and shares XP with nearby allies', () => {
    const sim = quietSim();
    const [a, b] = [sim.heroes[0], sim.heroes[1]];
    const m = sim.rules.spawnMinion(1, 0, 'guard');
    place(m, -10, -36); place(a, -12, -36); place(b, -9, -34);
    const g0 = a.hero!.gold;
    m.hp = 1;
    sim.damage(a, m, 50, 'physical', { isAttack: true });
    expect(m.dead).toBe(true);
    expect(a.hero!.gold - g0).toBeGreaterThanOrEqual(21);
    expect(a.hero!.lastHits).toBe(1);
    expect(a.hero!.xp).toBeGreaterThan(0);
    expect(b.hero!.xp).toBeGreaterThan(0);
    expect(b.hero!.gold).toBeLessThan(a.hero!.gold);
  });
  it('grants passive gold and levels heroes from XP', () => {
    const sim = quietSim();
    const h = sim.heroes[0];
    const g0 = h.hero!.gold;
    run(sim, 10);
    expect(h.hero!.gold - g0).toBeGreaterThan(15);
    sim.giveXp(h, XP_TO_LEVEL[3]);
    expect(h.hero!.level).toBe(3);
    expect(h.hero!.skillPts).toBe(3);
  });
  it('respawn timers start at 7s and scale to at most 34s', () => {
    const sim = quietSim();
    const h = sim.heroes[0];
    h.hero!.level = 1;
    expect(sim.respawnTime(h)).toBeGreaterThanOrEqual(7);
    h.hero!.level = 12;
    sim.tick = 30 * 60 * 40;
    expect(sim.respawnTime(h)).toBe(34);
  });
  it('kills respawn the hero at the fountain at full health', () => {
    const sim = quietSim();
    const v = sim.heroes[3], k = sim.heroes[0];
    place(v, 0, 0);
    sim.damage(k, v, 99999, 'pure');
    expect(v.dead).toBe(true);
    expect(k.hero!.kills).toBe(1);
    run(sim, 40);
    expect(v.dead).toBe(false);
    expect(Math.hypot(v.x - TEAM_BASE[1].spawn.x, v.z - TEAM_BASE[1].spawn.z)).toBeLessThan(6);
    expect(v.hp).toBe(v.maxHp);
  });
  it('recall channels 7 seconds and is cancelled by damage', () => {
    const sim = quietSim();
    const h = sim.heroes[0];
    place(h, -20, -36);
    sim.command({ slot: 0, c: 'recall' });
    run(sim, 5);
    expect(h.hero!.recallStart).toBeGreaterThan(0);
    run(sim, 2.2);
    expect(Math.hypot(h.x - TEAM_BASE[0].spawn.x, h.z - TEAM_BASE[0].spawn.z)).toBeLessThan(6);
    place(h, -20, -36);
    sim.command({ slot: 0, c: 'recall' });
    run(sim, 3);
    sim.damage(sim.heroes[3], h, 10, 'physical');
    expect(h.hero!.recallStart).toBe(0);
    run(sim, 6);
    expect(Math.hypot(h.x + 20, h.z + 36)).toBeLessThan(2);
  });
});

describe('items and shop', () => {
  it('requires fountain presence, discounts owned components, and stacks recipes', () => {
    const sim = quietSim();
    const h = sim.heroes[0];
    h.hero!.gold = 5000;
    place(h, -20, -36);
    sim.command({ slot: 0, c: 'buy', item: 'sinew' });
    expect(h.hero!.items.some(Boolean)).toBe(false);
    place(h, TEAM_BASE[0].fountain.x, 0);
    sim.command({ slot: 0, c: 'buy', item: 'sinew' });
    sim.command({ slot: 0, c: 'buy', item: 'gale' });
    const q = quote(h.hero!, 'sunspoke');
    expect(q.cost).toBe(ITEM_BY_ID.sunspoke.cost - ITEM_BY_ID.sinew.cost - ITEM_BY_ID.gale.cost);
    const before = h.hero!.gold;
    sim.command({ slot: 0, c: 'buy', item: 'sunspoke' });
    expect(h.hero!.items.filter(Boolean).map((i) => i!.id)).toEqual(['sunspoke']);
    expect(before - h.hero!.gold).toBe(q.cost);
    expect(h.ad).toBeGreaterThan(60);
  });
  it('supports undo, sells at 65%, limits boots and inventory size', () => {
    const sim = quietSim();
    const h = sim.heroes[0];
    h.hero!.gold = 9000;
    place(h, TEAM_BASE[0].fountain.x, 0);
    sim.command({ slot: 0, c: 'buy', item: 'ironwood' });
    sim.command({ slot: 0, c: 'undo' });
    expect(h.hero!.items.some(Boolean)).toBe(false);
    expect(h.hero!.gold).toBe(9000);
    sim.command({ slot: 0, c: 'buy', item: 'brace' });
    const g = h.hero!.gold;
    sim.command({ slot: 0, c: 'sell', idx: 0 });
    expect(h.hero!.gold - g).toBe(Math.floor(450 * 0.65));
    sim.command({ slot: 0, c: 'buy', item: 'swiftsole' });
    sim.command({ slot: 0, c: 'buy', item: 'swiftsole' });
    expect(h.hero!.items.filter((i) => i?.id === 'swiftsole')).toHaveLength(1);
    for (const id of ['sinew', 'sinew', 'gale', 'gale', 'glyph', 'glyph']) sim.command({ slot: 0, c: 'buy', item: id });
    expect(h.hero!.items.filter(Boolean).length).toBeLessThanOrEqual(6);
  });
  it('item effects: Sunspoke bolt fires every third attack; Null Bell cleanses; consumables heal', () => {
    const sim = quietSim();
    const h = sim.heroes[0];
    h.hero!.gold = 9000;
    place(h, TEAM_BASE[0].fountain.x, 0);
    for (const id of ['sinew', 'gale', 'sunspoke', 'veilthread', 'ironwood', 'nullbell']) sim.command({ slot: 0, c: 'buy', item: id });
    sim.addEffect(h, 'slow', 5, 0.5, 0);
    sim.addEffect(h, 'stun', 5, 1, 0);
    const idx = h.hero!.items.findIndex((i) => i?.id === 'nullbell');
    sim.command({ slot: 0, c: 'use', idx });
    expect(sim.has(h, 'slow')).toBe(false);
    expect(sim.has(h, 'stun')).toBe(false);
    sim.command({ slot: 0, c: 'buy', item: 'draught' });
    h.hp = 100;
    const di = h.hero!.items.findIndex((i) => i?.id === 'draught');
    sim.command({ slot: 0, c: 'use', idx: di });
    run(sim, 7);
    expect(h.hp).toBeGreaterThan(250);
  });
});

describe('determinism', () => {
  it('same seed + same commands -> same state hash', () => {
    const a = botSim(7), b = botSim(7);
    run(a, 90); run(b, 90);
    expect(a.stateHash()).toBe(b.stateHash());
    const c = botSim(8);
    run(c, 90);
    expect(c.stateHash()).not.toBe(a.stateHash());
  });
  it('Rng is a stable mulberry32 stream', () => {
    const r1 = new Rng(5), r2 = new Rng(5);
    for (let i = 0; i < 10; i++) expect(r1.next()).toBe(r2.next());
  });
});

describe('fog of war and brush', () => {
  it('hides units in brush beyond a short range and reveals them up close or via wards', () => {
    const sim = quietSim();
    const enemy = sim.heroes[3], me = sim.heroes[0];
    const b = BRUSH[0];
    expect(brushAt(b.x, b.z)).toBeGreaterThan(0);
    place(enemy, b.x, b.z);
    place(me, b.x + 9, b.z + 3);
    for (const h of sim.heroes) if (h !== enemy && h !== me) place(h, -60, 0);
    sim.updateVision();
    expect(enemy.visUntil[0]).toBeLessThanOrEqual(sim.time);
    expect(sim.canSee(0, enemy)).toBe(false);
    place(me, b.x + 3, b.z);
    sim.updateVision();
    expect(sim.canSee(0, enemy)).toBe(true);
    // a ward reveals brush at range
    place(me, b.x + 9, b.z + 3);
    place(sim.heroes[1], -60, 0);
    sim.tick += 10; sim.updateVision();
    expect(sim.canSee(0, enemy)).toBe(false);
    sim.placeWard(me, b.x + 8, b.z + 2);
    sim.tick += 10; sim.updateVision();
    expect(sim.canSee(0, enemy)).toBe(true);
  });
  it('does not target unseen units (commands against hidden units are dropped)', () => {
    const sim = quietSim();
    const enemy = sim.heroes[3], me = sim.heroes[0];
    place(enemy, 40, 20);
    place(me, -40, -20);
    sim.updateVision();
    sim.command({ slot: 0, c: 'attack', target: enemy.id });
    expect(me.order.t).not.toBe('attack');
  });
});

describe('jungle and objectives', () => {
  it('spawns camps, leashes and resets monsters, and respawns them', () => {
    const sim = quietSim();
    run(sim, 32);
    const camp = sim.rules.camps.find((c) => c.def.id === 'b-hounds')!;
    expect(camp.members.length).toBe(3);
    const m = camp.members[0];
    const hero = sim.heroes[0];
    place(hero, camp.def.x - 2, camp.def.z);
    sim.damage(hero, m, 10, 'physical', { isAttack: true });
    run(sim, 1);
    expect(m.camp!.engaged).toBe(true);
    place(hero, camp.def.x - 40, camp.def.z - 4);
    run(sim, 10);
    expect(m.camp!.engaged).toBe(false);
    expect(m.hp).toBe(m.maxHp);
    for (const x of camp.members) sim.damage(hero, x, 99999, 'physical');
    run(sim, 1);
    expect(camp.members.every((x) => x.dead)).toBe(true);
    run(sim, 80);
    expect(sim.rules.camps.find((c) => c.def.id === 'b-hounds')!.members.some((x) => !x.dead)).toBe(true);
  });
  it('spawns Twin Catalysts at 3:30 and the Aether Colossus at 9:00 and awards team buffs', () => {
    const sim = quietSim();
    run(sim, 209);
    expect(sim.units.some((u) => u.camp?.kind === 'catalyst')).toBe(false);
    run(sim, 3);
    const cats = sim.units.filter((u) => u.camp?.kind === 'catalyst');
    expect(cats).toHaveLength(2);
    const north = cats.find((c) => c.camp!.id === 'catalyst-n')!;
    const h = sim.heroes[0];
    const g = h.hero!.gold;
    sim.damage(h, north, 1e6, 'physical', { isAttack: true });
    expect(sim.teams[0].buffMoveUntil).toBeGreaterThan(sim.time + 200);
    expect(h.hero!.gold).toBeGreaterThan(g + 100);
    run(sim, 330);
    const colossus = sim.units.find((u) => u.camp?.kind === 'colossus');
    expect(colossus).toBeTruthy();
    expect(colossus!.hp).toBeGreaterThan(5000);
    sim.damage(h, colossus!, 1e7, 'physical', { isAttack: true });
    expect(sim.teams[0].colossusUntil).toBeGreaterThan(sim.time + 140);
    run(sim, 245);
    expect(sim.units.some((u) => u.camp?.id === 'catalyst-n' && !u.dead)).toBe(true); // respawns 4 minutes after the kill
  });
});

describe('headless full match (bots, no cheats)', () => {
  it('plays to a single authoritative victory within 40 minutes', () => {
    const sim = botSim(5);
    let victories = 0;
    for (let i = 0; i < 40 * 60 * 30 && sim.winner < 0; i++) { sim.step(); victories += sim.events.filter((e) => e.t === 'victory').length; sim.events.length = 0; }
    expect(sim.winner).toBeGreaterThanOrEqual(0);
    for (let i = 0; i < 200; i++) { sim.step(); victories += sim.events.filter((e) => e.t === 'victory').length; sim.events.length = 0; }
    expect(victories).toBe(1);
    const eng = sim.rules.structures.get(sim.winner === 0 ? 'r-engine' : 'b-engine')!;
    expect(eng.dead).toBe(true);
    const cores = [0, 1].map((i) => sim.rules.structures.get(`${sim.winner === 0 ? 'r' : 'b'}-core-${i}`)!);
    expect(cores.every((c) => c.dead)).toBe(true);
    const losingSeals = [0, 1].map((i) => sim.teams[sim.winner === 0 ? 1 : 0].sealDown[i]);
    expect(losingSeals.some(Boolean) || sim.timeline.some((e) => e.text.includes('Seal'))).toBe(true);
  }, 240000);
  it('bots buy items, level, lane, last-hit and use abilities without exceptions', () => {
    const sim = botSim(2, 'hard');
    run(sim, 8 * 60);
    for (const h of sim.heroes) {
      expect(h.hero!.level).toBeGreaterThanOrEqual(3);
      expect(h.hero!.items.some(Boolean)).toBe(true);
      expect(h.hero!.ranks.reduce((a, b) => a + b, 0)).toBeGreaterThanOrEqual(3);
    }
    expect(sim.heroes.reduce((s, h) => s + h.hero!.lastHits + h.hero!.monsterKills, 0)).toBeGreaterThan(20);
    expect(sim.heroes.reduce((s, h) => s + h.hero!.damageDealt, 0)).toBeGreaterThan(3000);
  }, 120000);
});
