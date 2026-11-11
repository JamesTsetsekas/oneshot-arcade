import { describe, expect, it } from 'vitest';
import { classSkills } from '../src/abilities/skills';
import { dist } from '../src/core/math';
import { getStatus, hasStatus, spawnEnemy } from '../src/entity-combat/combat';
import type { Actor } from '../src/entity-combat/types';
import type { Session } from '../src/game-session/session';
import { ENEMY } from '../src/navigation-ai/enemies';
import { makeSession, run } from './helpers';

function arena(cls: 'cinder' | 'ranger', seed = 5): Session {
  const s = makeSession(cls, seed);
  s.enterZone('hunt_toll', 'start');
  for (const a of s.zone.actors) if (a.kind !== 'player') { a.dead = true; a.deadT = 99; }
  const b = s.zone.landmarks.boss;
  s.enterZone('hunt_toll', 'start', { x: b.x, y: b.y + 4 });
  run(s, 0.1);
  s.stats.blockT = 0;
  return s;
}
const foe = (s: Session, def: string, dx: number, dy: number, lvl = 1): Actor => { const a = spawnEnemy(s, def, s.player.x + dx, s.player.y + dy, lvl); if (a.ai) a.ai.cds = a.ai.cds.map(() => 0); return a; };

describe('player skills', () => {
  for (const cls of ['cinder', 'ranger'] as const) {
    it(`every ${cls} active skill can be cast and has a real effect`, () => {
      for (const def of classSkills(cls).filter((k) => k.kind === 'active')) {
        const s = arena(cls);
        s.hero.level = 20; s.hero.ranks[def.id] = 1; s.hero.hotbar[1] = def.id;
        s.pc.heat = 100; s.pc.focus = s.stats.focusMax;
        const d = foe(s, 'dummy', 0, -2.4);
        const husk = foe(s, 'crawler', 0.6, -2.2); husk.ai!.state = 'recover'; husk.ai!.t = 99; husk.maxHp = husk.hp = 5000;
        const before = { hp: d.hp + husk.hp, x: s.player.x, y: s.player.y, n: s.zone.actors.length, areas: s.zone.areas.length, st: s.player.statuses.length };
        s.intent({ type: 'skill', slot: 1, x: d.x, y: d.y });
        run(s, 0.25);
        expect(s.pc.action !== null || s.pc.dash !== null || (s.pc.cds[def.id] ?? 0) > 0 || s.pc.focus < s.stats.focusMax, `${def.id} started`).toBe(true);
        run(s, 3);
        const dealt = before.hp - (d.hp + husk.hp);
        const moved = dist(before.x, before.y, s.player.x, s.player.y) > 2;
        const changed = dealt > 0 || moved || s.zone.actors.length !== before.n || s.player.statuses.length !== before.st || hasStatus(husk, 'taunt') || (def.coef === 0 && (s.pc.cds[def.id] ?? 0) > 0);
        expect(changed, `${def.id} had an effect`).toBe(true);
        if (def.coef > 0 && def.effect !== 'backstep') expect(dealt, `${def.id} dealt damage`).toBeGreaterThan(0);
        if (def.cooldown) expect(s.pc.cds[def.id] ?? 0, `${def.id} on cooldown`).toBeGreaterThan(0);
      }
    });
  }
  it('Iron Litany generates Focus and emits a wave on the third hit; Brand Arc spends Focus', () => {
    const s = arena('cinder');
    const d = foe(s, 'dummy', 0, -1.8);
    s.pc.focus = 0;
    let waves = 0;
    for (let i = 0; i < 150; i++) { if (i % 3 === 0) s.intent({ type: 'attack', target: d.id, x: d.x, y: d.y }); s.tick(); waves += s.events.filter((e) => e.type === 'fx' && e.s === 'wave').length; s.events.length = 0; }
    expect(waves).toBeGreaterThanOrEqual(2);
    expect(s.pc.focus).toBeGreaterThan(25);
    const f = s.pc.focus;
    s.intent({ type: 'skill', slot: 0, x: d.x, y: d.y });
    run(s, 0.6);
    expect(s.pc.focus).toBeLessThan(f - 10);
  });
  it('Quickshot applies Trace after moving 2 m and Ghostline detonates it for bonus damage', () => {
    const s = arena('ranger');
    s.hero.ranks.ghostline = 1; s.hero.hotbar[1] = 'ghostline';
    const d = foe(s, 'dummy', 0, -6);
    s.pc.moved = 0;
    s.intent({ type: 'attack', target: d.id, x: d.x, y: d.y }); run(s, 0.8);
    expect(getStatus(d, 'trace')).toBeUndefined();
    s.pc.moved = 3;
    s.intent({ type: 'attack', target: d.id, x: d.x, y: d.y }); run(s, 0.8);
    expect(getStatus(d, 'trace')?.stacks).toBe(1);
    const fire = () => { const hp = d.hp; s.pc.cds.ghostline = 0; s.pc.focus = 100; s.intent({ type: 'skill', slot: 1, x: d.x, y: d.y }); run(s, 1); return hp - d.hp; };
    s.rng.state = 1; s.stats.crit = 0;
    const marked = fire();
    expect(getStatus(d, 'trace')).toBeUndefined();
    const plain = fire();
    expect(marked).toBeGreaterThan(plain * 1.2);
  });
  it('evasive step uses charges that recharge, and Mothcloak evades one hit and drops enemy attention', () => {
    const s = arena('ranger');
    for (let i = 0; i < 4; i++) { s.intent({ type: 'evade', x: s.player.x, y: s.player.y - 5 }); run(s, 0.4); }
    expect(s.pc.evade).toBe(0);
    run(s, 3);
    expect(s.pc.evade).toBeGreaterThan(0);
    s.hero.ranks.mothcloak = 1; s.hero.hotbar[2] = 'mothcloak';
    const c = foe(s, 'husk', 5, 0); c.ai!.state = 'approach';
    s.intent({ type: 'skill', slot: 2, x: 0, y: 0 }); run(s, 0.3);
    expect(hasStatus(s.player, 'cloak')).toBe(true);
    expect(c.ai!.state).toBe('investigate');
  });
});
describe('enemy AI', () => {
  it('dormant packs wake on sight and alert packmates', () => {
    const s = arena('cinder');
    const a = foe(s, 'crawler', 6, 0), b = foe(s, 'crawler', 9, 0);
    a.pack = b.pack = 7;
    expect(a.ai!.state).toBe('dormant');
    run(s, 0.6);
    expect(a.ai!.state).not.toBe('dormant');
    expect(b.ai!.state).not.toBe('dormant');
  });
  it('every dangerous attack is telegraphed: standing still gets hit, stepping away during the wind-up avoids it', () => {
    for (const still of [true, false]) {
      const s = arena('cinder');
      const h = foe(s, 'husk', 2.6, 0, 4);
      h.ai!.state = 'approach';
      let sawTelegraph = false, hit = 0;
      for (let i = 0; i < 150; i++) {
        const tele = s.zone.areas.find((ar) => ar.src.id === h.id && ar.heavy);
        if (tele) {
          sawTelegraph = true;
          expect(tele.delay).toBeGreaterThanOrEqual(0.9);
          if (!still && !s.pc.intent) s.intent({ type: 'move', x: s.player.x - 7, y: s.player.y });
        }
        s.tick();
        hit += s.events.filter((e) => e.type === 'hit' && e.id === s.player.id && (e.a ?? 0) > 15).length;
        s.events.length = 0;
        if (hit || (sawTelegraph && !tele && !still)) break;
      }
      expect(sawTelegraph).toBe(true);
      expect(hit > 0).toBe(still);
    }
  });
  it('limits simultaneous heavy attackers', () => {
    const s = arena('cinder');
    s.hero.attrs.vigor += 500; s.refresh(); s.player.hp = s.stats.hpMax;
    for (let i = 0; i < 6; i++) { const m = foe(s, 'mite', 1.2 + (i % 3) * 0.4, (i - 3) * 0.5); m.ai!.state = 'approach'; }
    let max = 0;
    run(s, 2, () => { max = Math.max(max, s.zone.actors.filter((a) => !a.dead && a.ai?.state === 'telegraph' && ENEMY[a.def].attacks[a.ai.atk]?.heavy).length); });
    expect(max).toBeGreaterThan(0);
    expect(max).toBeLessThanOrEqual(2);
  });
  it('ranged enemies keep their distance and melee enemies close in', () => {
    const s = arena('cinder');
    s.hero.attrs.vigor += 500; s.refresh(); s.player.hp = s.stats.hpMax;
    const ar = foe(s, 'archer', 3, 0), cr = foe(s, 'crawler', 0, -8);
    ar.ai!.state = cr.ai!.state = 'approach';
    run(s, 3);
    expect(dist(ar.x, ar.y, s.player.x, s.player.y)).toBeGreaterThan(4);
    expect(dist(cr.x, cr.y, s.player.x, s.player.y)).toBeLessThan(2.5);
  });
  it('a killed Lantern Mite does not explode, an undisturbed one does and hurts its allies', () => {
    const s = arena('cinder');
    s.hero.attrs.vigor += 500; s.refresh(); s.player.hp = s.stats.hpMax;
    const m = foe(s, 'mite', 1.2, 0), c = foe(s, 'husk', 2.4, 0.4, 3);
    m.ai!.state = 'approach'; c.ai!.state = 'recover'; c.ai!.t = 99;
    run(s, 2.2);
    expect(m.dead).toBe(true);
    expect(c.hp).toBeLessThan(c.maxHp);
    expect(s.player.hp).toBeLessThan(s.stats.hpMax);
  });
  it('the Orison Engine runs three phases: beams, conduits with immunity, then a stagger race', () => {
    const s = makeSession('cinder', 3);
    s.hero.attrs.vigor += 3000; s.refresh();
    s.enterZone('hunt_engine', 'start', { x: 17, y: 25 });
    s.player.hp = s.stats.hpMax;
    const e = s.zone.actors.find((a) => a.def === 'engine')!;
    run(s, 0.5);
    expect(e.bs!.started).toBe(true);
    expect(s.zone.areas.filter((a) => a.tag === 'beam').length).toBe(3);
    e.hp = e.maxHp * 0.6; run(s, 0.2);
    expect(e.bs!.phase).toBe(2);
    expect(e.invuln).toBe(true);
    const conduits = s.zone.actors.filter((a) => a.kind === 'conduit');
    expect(conduits.length).toBe(3);
    run(s, 4);
    expect(s.zone.areas.some((a) => a.tag === 'pool' && a.shape === 'cone')).toBe(true);
    for (const c of conduits) { c.hp = 0; c.dead = true; }
    run(s, 0.2);
    expect(e.bs!.phase).toBe(3);
    expect(e.invuln).toBe(false);
    expect(e.hp).toBeLessThanOrEqual(e.maxHp * 0.34);
    run(s, 14, () => { s.player.hp = s.stats.hpMax; });
    expect(e.bs!.cast).toBeGreaterThan(0);
    e.bs!.castDmg = e.bs!.castNeed; run(s, 0.1);
    expect(e.bs!.staggered).toBeGreaterThan(0);
  });
});
