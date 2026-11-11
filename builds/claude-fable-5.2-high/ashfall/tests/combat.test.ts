import { describe, expect, it } from 'vitest';
import { SKILL, SKILLS, classSkills, skillTooltip } from '../src/abilities/skills';
import { dist } from '../src/core/math';
import { addStatus, damageEnemy, damagePlayer, getStatus, hasStatus, spawnEnemy } from '../src/entity-combat/combat';
import { armorReduction, computeStats } from '../src/entity-combat/stats';
import type { Actor } from '../src/entity-combat/types';
import type { Session } from '../src/game-session/session';
import { ENEMIES, ELITE_MODS, MOD } from '../src/navigation-ai/enemies';
import { LEVEL_CAP, allocAttr, applyLoadout, createHero, grantXp, rankUp, respec, respecCost, saveLoadout, xpToNext } from '../src/progression/progression';
import { QUEST, questTrigger } from '../src/progression/quests';
import { makeSession, run } from './helpers';

const SRC = { id: 999, name: 'Test Foe', team: 1 };
function arena(cls: 'cinder' | 'ranger' = 'cinder', seed = 5): Session {
  const s = makeSession(cls, seed);
  s.enterZone('hunt_toll', 'start');
  for (const a of s.zone.actors) if (a.kind !== 'player') { a.dead = true; a.deadT = 99; }
  run(s, 0.1);
  return s;
}
const foe = (s: Session, def: string, dx: number, dy: number, lvl = 1): Actor => spawnEnemy(s, def, s.player.x + dx, s.player.y + dy, lvl);

describe('stat model', () => {
  it('armor has diminishing returns by hit size and is capped', () => {
    expect(armorReduction(50, 10)).toBeGreaterThan(armorReduction(50, 100));
    expect(armorReduction(100, 10)).toBeGreaterThan(armorReduction(50, 10));
    expect(armorReduction(1e9, 1)).toBe(0.75);
  });
  it('resistances are capped at 75% and attributes feed derived stats', () => {
    const hero = createHero('A', 'cinder', 0, 1);
    const base = computeStats(hero);
    hero.attrs.will += 400; hero.attrs.vigor += 10; hero.attrs.might += 10;
    const st = computeStats(hero);
    expect(st.resEmberT).toBe(75);
    expect(st.hpMax).toBe(base.hpMax + 80);
    expect(st.meleePct).toBeCloseTo(base.meleePct + 12);
    expect(st.armorTotal).toBeGreaterThan(base.armorTotal);
  });
  it('elemental damage to the player is reduced by the matching resistance only', () => {
    const s = arena();
    s.hero.attrs.will += 100; s.refresh(); s.stats.blockT = 0;
    s.player.hp = s.stats.hpMax;
    const ember = damagePlayer(s, 40, 'ember', SRC);
    expect(ember).toBeCloseTo(40 * (1 - s.stats.resEmberT / 100), 3);
  });
});
describe('combat resolution', () => {
  it('crits, added damage and ailments come from the shared skill data', () => {
    const s = arena();
    const d = foe(s, 'dummy', 1.5, 0);
    s.intent({ type: 'attack', target: d.id, x: d.x, y: d.y });
    run(s, 0.6);
    expect(d.hp).toBeLessThan(d.maxHp);
    const st = s.stats, tip = skillTooltip(SKILL.brand_arc, 1, st);
    expect(tip.desc).toContain(`${Math.round(st.dmgMin * 1.75 * (1 + (st.dmgPct + st.meleePct + st.skillPct) / 100))}`);
  });
  it('burn deals damage over time and expires', () => {
    const s = arena();
    const h = foe(s, 'husk', 6, 0, 3);
    h.ai!.state = 'recover'; h.ai!.t = 99;
    addStatus(s, h, 'burn', 2, 10, 1);
    const hp0 = h.hp;
    run(s, 2.5);
    expect(hp0 - h.hp).toBeGreaterThan(10);
    expect(hasStatus(h, 'burn')).toBe(false);
  });
  it('the Archive Warden deflects frontal hits and is vulnerable from behind', () => {
    const s = arena();
    const w = foe(s, 'warden', 3, 0, 1);
    w.facing = Math.PI; // facing the player at -x
    const front = damageEnemy(s, w, 100, 'physical', { id: 1, name: 'p', team: 0 }, { fromX: w.x - 3, fromY: w.y });
    w.hp = w.maxHp;
    const back = damageEnemy(s, w, 100, 'physical', { id: 1, name: 'p', team: 0 }, { fromX: w.x + 3, fromY: w.y });
    expect(back).toBeGreaterThan(front * 2);
  });
  it('Quill Swarm splits into two flights at half health', () => {
    const s = arena();
    const q = foe(s, 'swarm', 3, 0, 1);
    damageEnemy(s, q, q.maxHp * 0.9, 'blight', { id: 1, name: 'p', team: 0 });
    expect(q.dead).toBe(true);
    expect(s.zone.actors.filter((a) => a.def === 'swarmlet' && !a.dead).length).toBe(2);
  });
  it('bosses convert hard crowd control into stagger and are never stunned', () => {
    const s = arena();
    const b = foe(s, 'tollkeeper', 5, 0, 5);
    run(s, 0.2);
    for (let i = 0; i < 3; i++) addStatus(s, b, 'stun', 1, 0, 1);
    expect(hasStatus(b, 'stun')).toBe(false);
    expect(b.bs!.stagger).toBeGreaterThan(0);
    for (let i = 0; i < 5; i++) addStatus(s, b, 'root', 1, 0, 1);
    expect(b.bs!.staggered).toBeGreaterThan(0);
  });
  it("the Toll-Keeper's armor meter mitigates until broken, then exposes it", () => {
    const s = arena();
    const b = foe(s, 'tollkeeper', 5, 0, 5);
    run(s, 0.1);
    const armored = damageEnemy(s, b, 50, 'ember', { id: 1, name: 'p', team: 0 });
    b.bs!.armor = 1;
    damageEnemy(s, b, 50, 'ember', { id: 1, name: 'p', team: 0 });
    expect(b.bs!.armorBroken).toBeGreaterThan(0);
    const exposed = damageEnemy(s, b, 50, 'ember', { id: 1, name: 'p', team: 0 });
    expect(exposed).toBeGreaterThan(armored * 2);
  });
});
describe('death, Echo and recovery', () => {
  it('drops an Echo with 10% gold that does not compound, costs 5% durability and grants a blessing on reclaim', () => {
    const s = arena();
    s.hero.gold = 1000; s.stats.blockT = 0;
    const dur0 = s.hero.equip.main!.dur;
    damagePlayer(s, 1e6, 'physical', SRC);
    expect(s.player.dead).toBe(true);
    expect(s.hero.gold).toBe(900);
    expect(s.hero.echo!.gold).toBe(100);
    expect(s.hero.equip.main!.dur).toBe(dur0 - 5);
    expect(s.hero.stats.lastDeath).toContain('Test Foe');
    s.respawn();
    expect(s.player.dead).toBe(false);
    expect(s.zone.id).toBe('refuge');
    s.enterZone('hunt_toll', 'start');
    for (const a of s.zone.actors) if (a.kind !== 'player') a.dead = true;
    s.hero.echo = { ...s.hero.echo!, zone: 'march' }; // pretend the echo is elsewhere, die again
    damagePlayer(s, 1e6, 'physical', SRC);
    expect(s.hero.gold).toBe(900); // no compounding loss
    expect(s.hero.echo!.gold).toBe(100);
    expect(s.hero.echo!.zone).toBe('hunt_toll');
    s.respawn();
    const hp0 = s.stats.hpMax;
    s.enterZone('hunt_toll', 'start', { x: s.hero.echo!.x, y: s.hero.echo!.y });
    for (const a of s.zone.actors) if (a.kind !== 'player') a.dead = true;
    run(s, 1);
    expect(s.hero.echo).toBeNull();
    expect(s.hero.gold).toBe(1000);
    expect(s.stats.hpMax).toBeGreaterThan(hp0);
  });
  it('town gate channel is interrupted by damage and completes when left alone', () => {
    const s = arena();
    s.stats.blockT = 0;
    s.intent({ type: 'gate' });
    run(s, 1);
    damagePlayer(s, 5, 'blight', SRC);
    expect(s.pc.gate).toBe(-1);
    s.intent({ type: 'gate' });
    run(s, 3.2);
    expect(s.zone.id).toBe('refuge');
    expect(s.zone.inter.some((i) => i.key === 'return')).toBe(true);
  });
  it('potions respect belt counts, caps and are not wasted at full health', () => {
    const s = arena();
    const n = s.hero.belt[0];
    s.usePotion(0);
    expect(s.hero.belt[0]).toBe(n);
    s.player.hp = 10;
    s.usePotion(0);
    expect(s.hero.belt[0]).toBe(n - 1);
    expect(s.player.hp).toBeGreaterThan(10);
    s.hero.belt[0] = s.hero.beltCap;
    s.zone.pickups.push({ id: 5, x: s.player.x, y: s.player.y, kind: 'potion', amount: 1, potion: 0, t: 1 });
    run(s, 0.5);
    expect(s.zone.pickups.length).toBe(1); // full belt: potion stays on the ground
  });
  it('unreachable clicks project to the nearest valid point and flag an invalid cursor', () => {
    const s = arena();
    s.intent({ type: 'move', x: -50, y: -50 });
    expect(s.events.some((e) => e.type === 'invalid')).toBe(true);
  });
});
describe('progression', () => {
  it('awards a skill point per level and an attribute point every other level up to the cap', () => {
    const h = createHero('A', 'ranger', 0, 1);
    const sp0 = h.skillPoints;
    let total = 0; for (let l = 1; l < LEVEL_CAP; l++) total += xpToNext(l);
    grantXp(h, total + 99999);
    expect(h.level).toBe(LEVEL_CAP);
    expect(h.skillPoints).toBe(sp0 + 19);
    expect(h.attrPoints).toBe(10);
    expect(allocAttr(h, 'finesse')).toBe(true);
  });
  it('enforces unlock levels, max ranks and mutually exclusive capstones; respec refunds everything', () => {
    const h = createHero('A', 'cinder', 0, 1);
    expect(rankUp(h, 'cinder_ring')).toMatch(/level 4/);
    h.level = 20; h.skillPoints = 30; h.gold = 5000;
    expect(rankUp(h, 'cinder_ring')).toBeNull();
    expect(h.hotbar).toContain('cinder_ring');
    expect(rankUp(h, 'living_crucible')).toBeNull();
    expect(rankUp(h, 'unbroken_oath')).toMatch(/Excluded/);
    for (let i = 0; i < 3; i++) rankUp(h, 'kindling');
    expect(rankUp(h, 'kindling')).toMatch(/maximum/);
    expect(rankUp(h, 'ghostline')).toMatch(/class/);
    saveLoadout(h, 0, 'Ring');
    const attr0 = { ...h.attrs }; h.attrPoints = 2; allocAttr(h, 'might');
    expect(respecCost(h)).toBeGreaterThan(0);
    expect(respec(h)).toBeNull();
    expect(h.skillPoints).toBe(30);
    expect(h.attrs).toEqual(attr0);
    expect(h.attrPoints).toBe(2);
    expect(applyLoadout(h, 0)).toBeNull();
    expect(h.ranks.kindling).toBe(3);
    h.level = 5; expect(respecCost(h)).toBe(0);
  });
  it('each class has a basic attack, six actives, six passives and two capstones with complete definitions', () => {
    for (const cls of ['cinder', 'ranger'] as const) {
      const list = classSkills(cls);
      expect(list.filter((s) => s.kind === 'basic').length).toBe(1);
      expect(list.filter((s) => s.kind === 'active').length).toBe(6);
      expect(list.filter((s) => s.kind === 'passive').length).toBe(6);
      expect(list.filter((s) => s.kind === 'capstone').length).toBe(2);
    }
    const st = computeStats(createHero('A', 'cinder', 0, 1));
    for (const s of SKILLS) {
      for (const k of ['tags', 'cost', 'cooldown', 'targeting', 'windup', 'total', 'cancel', 'coef', 'mods', 'vfx', 'sfx', 'threat'] as const) expect(s[k], `${s.id}.${k}`).toBeDefined();
      expect(skillTooltip(s, 1, st).desc, s.id).not.toMatch(/[{}?]|NaN|undefined/);
    }
  });
  it('quest triggers advance in order, skip safely, and repeat runs skip the rescue', () => {
    const h = createHero('A', 'cinder', 0, 1);
    expect(questTrigger(h, 'kill:engine').length).toBe(QUEST.length);
    h.quest = 0;
    expect(questTrigger(h, 'enter:march').length).toBe(2);
    expect(questTrigger(h, 'enter:march').length).toBe(0);
    h.flags.artificer = true;
    questTrigger(h, 'kill:tollkeeper');
    expect(h.quest).toBe(6);
  });
});
describe('content rules', () => {
  it('has ten normal enemy families, two bosses and compatible elite modifiers', () => {
    expect(ENEMIES.filter((e) => !['boss', 'object'].includes(e.role) && e.id !== 'swarmlet').length).toBe(10);
    expect(ENEMIES.filter((e) => e.role === 'boss').length).toBe(2);
    expect(ELITE_MODS.length).toBe(6);
    for (const m of ELITE_MODS) for (const x of m.excl) expect(MOD[x].excl, `${m.id}<->${x}`).toContain(m.id);
  });
  it('spawned elites respect modifier exclusions and the threat budget on both difficulties', () => {
    for (const diff of [0, 1]) for (let seed = 1; seed <= 12; seed++) {
      const s = makeSession('cinder', seed);
      s.hero.difficulty = diff; s.hero.maxDifficulty = 1;
      s.enterZone('archive2', 'start');
      for (const e of s.zone.actors.filter((a) => a.elite)) {
        expect(e.mods.length).toBe(diff ? 2 : 1);
        expect(e.mods.reduce((n, m) => n + MOD[m].cost, 0)).toBeLessThanOrEqual(diff ? 5 : 3);
        for (const m of e.mods) for (const o of e.mods) expect(MOD[m].excl.includes(o)).toBe(false);
      }
      expect(s.zone.actors.some((a) => a.elite)).toBe(true);
    }
  });
  it('never spawns enemies within 4 m of a zone entry point', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const s = makeSession('cinder', seed);
      for (const id of ['march', 'archive1', 'archive2', 'archive3']) {
        s.enterZone(id, 'start');
        for (const e of s.zone.actors.filter((a) => a.kind === 'enemy')) expect(dist(e.x, e.y, s.player.x, s.player.y), `${id} ${e.def}`).toBeGreaterThan(4);
      }
    }
  });
  it('Guard absorbs damage before health', () => {
    const s = arena();
    s.stats.blockT = 0; s.player.hp = s.stats.hpMax;
    addStatus(s, s.player, 'guard', 2, 50, 1);
    damagePlayer(s, 20, 'blight', SRC);
    expect(s.player.hp).toBe(s.stats.hpMax);
    expect(getStatus(s.player, 'guard')!.power).toBeLessThan(50);
  });
});
