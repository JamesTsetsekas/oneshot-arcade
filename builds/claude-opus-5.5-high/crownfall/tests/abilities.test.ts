import { describe, it, expect } from 'vitest';
import { testMatch, place, seconds, steps, learnAll, rejects } from './helpers';
import { hasEffect, addEffect, dealDamage } from '../src/sim/combat';
import type { HeroId } from '../src/shared/types';
import { isWalkable, clearanceAt, cellAt, Cell } from '../src/shared/map';

const Y = -48;
function duel(a: HeroId, b: HeroId, extra?: HeroId) {
  const heroes: Array<{ hero: HeroId; team: 0 | 1 }> = [{ hero: a, team: 0 }, { hero: b, team: 1 }];
  if (extra) heroes.push({ hero: extra, team: 0 });
  const t = testMatch(heroes);
  learnAll(t.m, t.hero(0), 11); learnAll(t.m, t.hero(1), 11);
  if (extra) learnAll(t.m, t.hero(2), 6);
  place(t.hero(0), -4, Y); place(t.hero(1), 0, Y);
  t.hero(1).base.ms = 0;
  steps(t.m, 3);
  return t;
}
const hpLost = (u: any, f: () => void) => { const h = u.hp + u.shields.reduce((s: number, x: any) => s + x.amt, 0); f(); return h - u.hp; };

describe('cast validation (server authoritative)', () => {
  it('rejects unlearned, cooling down, unaffordable and silenced casts with precise reasons', () => {
    const { m, cmd, hero } = testMatch([{ hero: 'suri', team: 0 }, { hero: 'kesh', team: 1 }]);
    place(hero(0), -4, Y); place(hero(1), 0, Y);
    cmd(0, { t: 'cast', slot: 0, x: 0, y: Y });
    expect(rejects(m, 0)).toContain('Ability not learned');
    hero(0).hero!.ranks[0] = 1; hero(0).mana = 1000;
    cmd(0, { t: 'cast', slot: 0, x: 0, y: Y });
    steps(m, 10);
    cmd(0, { t: 'cast', slot: 0, x: 0, y: Y });
    expect(rejects(m, 0)).toContain('On cooldown');
    hero(0).hero!.cds[0] = 0; hero(0).mana = 0;
    cmd(0, { t: 'cast', slot: 0, x: 0, y: Y });
    expect(rejects(m, 0)).toContain('Not enough mana');
    hero(0).mana = 1000;
    addEffect(m, hero(0), { kind: 'silence', until: m.time + 2, value: 1, src: hero(1).id });
    cmd(0, { t: 'cast', slot: 0, x: 0, y: Y });
    expect(rejects(m, 0)).toContain('Silenced');
    cmd(0, { t: 'rank', slot: 3 });
    expect(rejects(m, 0).some((r) => r.includes('Ultimate'))).toBe(true);
  });
  it('stun interrupts a cast in progress (channel cancelled, no cost spent)', () => {
    const { m, cmd, hero } = duel('suri', 'kesh');
    const mana = hero(0).mana;
    cmd(0, { t: 'cast', slot: 3, x: 0, y: Y });
    steps(m, 6);
    expect(hero(0).cast).not.toBeNull();
    addEffect(m, hero(0), { kind: 'stun', until: m.time + 1, value: 1, src: hero(1).id });
    steps(m, 30);
    expect(hero(0).cast).toBeNull();
    expect(hero(0).hero!.cds[3]).toBe(0);
    expect(hero(0).mana).toBeGreaterThanOrEqual(mana - 1);
  });
});

describe('Brannoch', () => {
  it('Fault Hammer inner edge staggers, outer edge slows', () => {
    const { m, cmd, hero } = duel('brannoch', 'kesh');
    place(hero(1), -2.5, Y);
    const lost = hpLost(hero(1), () => { cmd(0, { t: 'cast', slot: 0, x: 4, y: Y }); steps(m, 12); });
    expect(lost).toBeGreaterThan(50);
    expect(hero(1).ccLog.some((c) => c.kind === 'stun')).toBe(true);
    hero(0).hero!.cds[0] = 0; hero(0).mana = 999; place(hero(1), -0.8, Y);
    cmd(0, { t: 'cast', slot: 0, x: 4, y: Y }); steps(m, 12);
    expect(hero(1).ccLog.some((c) => c.kind === 'slow')).toBe(true);
  });
  it('Rampart Fold creates destructible blockers; Anchor Line recast pulls and shields; Citybreaker telegraphs then knocks up', () => {
    const { m, cmd, hero } = duel('brannoch', 'kesh', 'oru');
    cmd(0, { t: 'cast', slot: 1, x: 0, y: Y }); steps(m, 10);
    const walls = m.units.filter((u) => u.kind === 'wall' && u.alive);
    expect(walls.length).toBeGreaterThanOrEqual(3);
    m.killUnit(walls[0], hero(1));
    expect(walls[0].alive).toBe(false);
    seconds(m, 3.2);
    expect(m.units.filter((u) => u.kind === 'wall' && u.alive).length).toBe(0);
    place(hero(2), -11, Y);
    cmd(0, { t: 'cast', slot: 2, target: hero(2).id }); steps(m, 6);
    cmd(0, { t: 'cast', slot: 2, x: 0, y: 0 }); seconds(m, 1);
    expect(Math.hypot(hero(0).x - hero(2).x, hero(0).y - hero(2).y)).toBeLessThan(2.5);
    expect(hero(0).shields.length).toBeGreaterThan(0);
    place(hero(0), -6, Y); place(hero(1), 2, Y);
    cmd(0, { t: 'cast', slot: 3, x: 2, y: Y }); steps(m, 3);
    expect(m.zones.some((z) => z.visual === 'citybreaker-tele' && z.publicTelegraph)).toBe(true);
    seconds(m, 1.2);
    expect(hero(1).ccLog.some((c) => c.kind === 'airborne')).toBe(true);
  });
  it('Set in Stone builds armor stacks near enemy heroes', () => {
    const { m, hero } = duel('brannoch', 'kesh');
    const a0 = hero(0).stats.armor;
    seconds(m, 3.3);
    expect(hero(0).stats.armor).toBeGreaterThan(a0);
  });
});

describe('Suri Vale', () => {
  it('Ricochet Bolt hits; Hot Route charges from movement', () => {
    const { m, cmd, hero } = duel('suri', 'kesh');
    place(hero(1), 4, Y);
    const lost = hpLost(hero(1), () => { cmd(0, { t: 'cast', slot: 0, x: 4, y: Y }); seconds(m, 0.8); });
    expect(lost).toBeGreaterThan(60);
    cmd(0, { t: 'move', x: -14, y: Y }); seconds(m, 2.5);
    expect(hero(0).hero!.passive.charge).toBeGreaterThan(80);
  });
  it('Slipstream dashes and grants speed; Parcel Charge detonates; Redline reveals Suri during windup', () => {
    const { m, cmd, hero } = duel('suri', 'kesh');
    const x0 = hero(0).x;
    cmd(0, { t: 'cast', slot: 1, x: -20, y: Y }); seconds(m, 0.6);
    expect(x0 - hero(0).x).toBeGreaterThan(3.5);
    place(hero(0), -4, Y);
    const lost = hpLost(hero(1), () => { cmd(0, { t: 'cast', slot: 2, target: hero(1).id }); seconds(m, 4.3); });
    expect(lost).toBeGreaterThan(70);
    place(hero(1), 20, Y);
    cmd(0, { t: 'cast', slot: 3, x: 20, y: Y }); steps(m, 4);
    expect(hero(0).revealUntil).toBeGreaterThan(m.time);
    const l2 = hpLost(hero(1), () => seconds(m, 1.6));
    expect(l2).toBeGreaterThan(150);
  });
});

describe('Oru', () => {
  it('Luminous Swarm damages enemies or shields allies; Shared Wing returns unbroken shields as health', () => {
    const { m, cmd, hero } = duel('oru', 'kesh', 'suri');
    const lost = hpLost(hero(1), () => { cmd(0, { t: 'cast', slot: 0, x: 0, y: Y }); seconds(m, 1); });
    expect(lost).toBeGreaterThan(40);
    hero(0).hero!.cds[0] = 0; hero(0).mana = 999;
    place(hero(2), -8, Y); hero(2).hp = 200;
    cmd(0, { t: 'cast', slot: 0, x: -8, y: Y }); seconds(m, 0.8);
    expect(hero(2).shields.length).toBe(1);
    const hp = hero(2).hp;
    seconds(m, 3);
    expect(hero(2).hp).toBeGreaterThan(hp + 10);
  });
  it('Hush Field shrinks enemy vision and slows; Guiding Draft hastes and marks; Night Migration roots at the leading edge', () => {
    const { m, cmd, hero } = duel('oru', 'kesh', 'suri');
    cmd(0, { t: 'cast', slot: 1, x: 0, y: Y }); steps(m, 12);
    expect(m.inEnemyHush(hero(1))).toBe(true);
    expect(hasEffect(hero(1), 'slow')).toBe(true);
    place(hero(2), -6, Y);
    cmd(0, { t: 'cast', slot: 2, target: hero(2).id }); steps(m, 2);
    expect(hasEffect(hero(2), 'haste')).toBe(true);
    expect(hasEffect(hero(2), 'draftMark')).toBe(true);
    place(hero(1), 4, Y);
    cmd(0, { t: 'cast', slot: 3, x: 10, y: Y }); seconds(m, 1.2);
    expect(hero(1).ccLog.some((c) => c.kind === 'root')).toBe(true);
  });
});

describe('Kesh', () => {
  it('Reed Cleaver swings twice; Bogskin reduces damage then bursts; Sinkstep passes under mistwood; Fen Claim slows and reveals', () => {
    const { m, cmd, hero } = duel('kesh', 'suri');
    place(hero(1), -2, Y);
    let hits = 0;
    const orig = m.emit.bind(m);
    (m as any).emit = (ev: any, r: any) => { if (ev.e === 'dmg' && ev.tgt === hero(1).id) hits++; orig(ev, r); };
    cmd(0, { t: 'cast', slot: 0, x: 0, y: Y }); seconds(m, 0.8);
    expect(hits).toBeGreaterThanOrEqual(2);
    cmd(0, { t: 'cast', slot: 1 }); steps(m, 2);
    const dealt = dealDamage(m, hero(1), hero(0), 100, 'physical', { kind: 'attack', source: 't' });
    expect(dealt).toBeLessThan(100 * 0.75);
    seconds(m, 2.6);
    expect(hasEffect(hero(1), 'slow')).toBe(true);
    // Sinkstep from the jungle path into the lane through forest
    let spot: { x: number; y: number; dx: number; dy: number } | null = null;
    for (let x = -50; x < 0 && !spot; x += 0.5) for (let y = -45; y < 45 && !spot; y += 0.5) for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
      if (isWalkable(x, y) && clearanceAt(x, y) > 0.9 && isWalkable(x + dx * 5, y + dy * 5) && clearanceAt(x + dx * 5, y + dy * 5) > 0.9 && cellAt(x + dx * 2.5, y + dy * 2.5) === Cell.Forest && cellAt(x + dx * 2, y + dy * 2) === Cell.Forest) { spot = { x, y, dx, dy }; break; }
    }
    expect(spot).not.toBeNull();
    place(hero(0), spot!.x, spot!.y); hero(0).hero!.cds[2] = 0; hero(0).mana = 999; steps(m, 1);
    cmd(0, { t: 'cast', slot: 2, x: spot!.x + spot!.dx * 5.5, y: spot!.y + spot!.dy * 5.5 }); seconds(m, 0.8);
    expect(Math.hypot(hero(0).x - spot!.x, hero(0).y - spot!.y)).toBeGreaterThan(4);
    place(hero(0), -4, Y); place(hero(1), -1, Y);
    cmd(0, { t: 'cast', slot: 3 }); seconds(m, 0.6);
    expect(hasEffect(hero(1), 'slow')).toBe(true);
    expect(hero(1).revealUntil).toBeGreaterThan(m.time);
  });
});

describe('Ilyra Quill', () => {
  it('Linebreak pierces; Footnote echoes; Redaction silences and erases; Final Draft stuns targets hit by two prior rings; Margin Notes bursts at 3 annotations', () => {
    const { m, cmd, hero } = duel('ilyra', 'kesh');
    place(hero(1), 3, Y);
    cmd(0, { t: 'cast', slot: 1, x: 0, y: Y }); steps(m, 6);
    cmd(0, { t: 'cast', slot: 0, x: 8, y: Y }); seconds(m, 0.8);
    expect(m.annotations.get(hero(1).id)?.size ?? 0).toBeGreaterThanOrEqual(1);
    cmd(0, { t: 'cast', slot: 2, x: 3, y: Y }); seconds(m, 0.6);
    expect(hero(1).ccLog.some((c) => c.kind === 'silence')).toBe(true);
    hero(0).mana = 999;
    cmd(0, { t: 'cast', slot: 3, x: 3, y: Y }); seconds(m, 2.4);
    expect(hero(1).ccLog.some((c) => c.kind === 'stun')).toBe(true);
  });
  it('Redaction erases enemy non-ultimate zones', () => {
    const { m, cmd, hero } = duel('ilyra', 'oru');
    const z = m.spawnZone({ team: 1, owner: hero(1).id, x: 0, y: Y, shape: { type: 'circle', r: 4 }, dur: 5, visual: 'hush', hostile: true });
    cmd(0, { t: 'cast', slot: 2, x: 4, y: Y }); seconds(m, 0.6);
    expect(z.alive).toBe(false);
  });
});

describe('Vey', () => {
  it('Shardstep dashes through and cannot repeat the target; Prism Sentence is halved when line of sight breaks', () => {
    const { m, cmd, hero } = duel('vey', 'kesh');
    cmd(0, { t: 'cast', slot: 0, target: hero(1).id }); seconds(m, 0.5);
    expect(hero(0).x).toBeGreaterThan(0.5);
    hero(0).hero!.cds[0] = 0;
    cmd(0, { t: 'cast', slot: 0, target: hero(1).id });
    expect(rejects(m, 0).some((r) => r.includes('same target'))).toBe(true);
    // full strike with LOS
    place(hero(0), -4, Y); place(hero(1), 0, Y); hero(1).hp = hero(1).stats.maxHp;
    const full = hpLost(hero(1), () => { cmd(0, { t: 'cast', slot: 3, target: hero(1).id }); seconds(m, 1.4); });
    // blocked strike: target steps behind mistwood
    const t2 = duel('vey', 'kesh');
    place(t2.hero(0), -4, Y); place(t2.hero(1), 0, Y);
    t2.cmd(0, { t: 'cast', slot: 3, target: t2.hero(1).id }); t2.m.step();
    place(t2.hero(1), -36, -22); // jungle clearing far behind mistwood
    const half = hpLost(t2.hero(1), () => seconds(t2.m, 1.4));
    expect(full).toBeGreaterThan(half * 1.5);
  });
  it('Refraction primes after time unseen', () => {
    const { m, hero } = duel('vey', 'kesh');
    place(hero(0), 40, 30); place(hero(1), -40, -30);
    seconds(m, 1.5);
    expect(hero(0).hero!.passive.primed).toBe(1);
  });
});

describe('talents', () => {
  it('Phase Step blinks, Bulwark shields, Reaping Spark refuses heroes', () => {
    const { m, cmd, hero } = duel('kesh', 'suri');
    const x0 = hero(0).x;
    hero(0).hero!.talents = ['phase', 'bulwark'];
    cmd(0, { t: 'talent', slot: 0, x: -20, y: Y }); m.step();
    expect(x0 - hero(0).x).toBeGreaterThan(4);
    cmd(0, { t: 'talent', slot: 1 }); m.step();
    expect(hero(0).shields.length).toBe(1);
    hero(0).hero!.talents = ['reap', 'bulwark']; hero(0).hero!.talentCds = [0, 0];
    place(hero(0), -4, Y);
    cmd(0, { t: 'talent', slot: 0, target: hero(1).id }); m.step();
    expect(rejects(m, 0).some((r) => r.includes('monsters and minions'))).toBe(true);
  });
});
