import { describe, expect, it } from 'vitest';
import { HEROES, PASSIVE, val } from '../src/shared/heroes';
import { dealDamage, hasEffect, mitigate, totalShield } from '../src/sim/combat';
import { ARCANE, PHYS, PURE } from '../src/sim/types';
import { cast, cmd, dmgFrom, fixture, learn, place, rejections, setLevel, step, stepSecs } from './helpers';

// All fixtures use the wide upper lane around x = 60..90, y = 98 (open ground, no structures).
const Y = 98;

describe('Brannoch, Bastion Mason', () => {
  function setup() {
    const f = fixture([
      ['brannoch', 0],
      ['suri', 1],
      ['oru', 1],
    ]);
    const [b, near, far] = f.h;
    setLevel(f.w, b, 6);
    learn(f.w, b, [1, 1, 1, 1]);
    return { ...f, b, near, far };
  }

  it('Fault Hammer staggers the inner half and slows the outer edge', () => {
    const { w, b, near, far } = setup();
    place(w, b, 70, Y);
    place(w, near, 71.8, Y);
    place(w, far, 74.2, Y);
    const hp = near.hp;
    expect(cast(w, b, 0, 80, Y)).toBeNull();
    stepSecs(w, 0.35);
    expect(hasEffect(near, 'stun')).toBe(true);
    expect(hasEffect(far, 'stun')).toBe(false);
    expect(hasEffect(far, 'slow')).toBe(true);
    const expected = (val(HEROES.brannoch.abilities[0], 'dmg', 1) + 0.6 * b.stats.ad) * mitigate(near.stats.armor, 0);
    expect(hp - near.hp).toBeCloseTo(expected, 0);
  });

  it('Rampart Fold blocks enemy movement and projectiles, has health, and expires', () => {
    const { w, b, near } = setup();
    place(w, b, 70, Y);
    place(w, near, 80, Y);
    learn(w, near, [1, 0, 0, 0]);
    expect(cast(w, b, 1, 75, Y)).toBeNull();
    stepSecs(w, 0.2);
    expect(w.walls).toHaveLength(2);
    expect(w.wallBlocks(1, 75, Y, 0.3)).toBe(true);
    expect(w.wallBlocks(0, 75, Y, 0.3)).toBe(false); // allies pass
    const hp = b.hp;
    const wallHp = w.walls[0].hp + w.walls[1].hp;
    expect(cast(w, near, 0, 70, Y)).toBeNull(); // Ricochet Bolt straight at Brannoch
    stepSecs(w, 0.8);
    expect(b.hp).toBeGreaterThanOrEqual(hp - 0.01); // projectile was stopped by the wall
    expect(w.walls[0].hp + w.walls[1].hp).toBeLessThan(wallHp);
    cmd(w, near, { t: 'move', x: 70, y: Y });
    stepSecs(w, 1.5);
    expect(near.x).toBeGreaterThan(75.3); // cannot walk through
    stepSecs(w, 2);
    expect(w.walls).toHaveLength(0);
  });

  it('Anchor Line tethers, then the recast hauls Brannoch in and shields him', () => {
    const { w, b } = setup();
    place(w, b, 70, Y);
    expect(cast(w, b, 2, 78, Y)).toBeNull();
    expect(b.hero!.recast[2]).not.toBeNull();
    step(w, 4);
    expect(cast(w, b, 2, 0, 0)).toBeNull();
    stepSecs(w, 0.6);
    expect(b.x).toBeGreaterThan(75.5);
    expect(totalShield(b)).toBeGreaterThan(50);
    expect(b.hero!.recast[2]).toBeNull();
  });

  it('Citybreaker telegraphs to everyone, then knocks enemies airborne at the landing zone', () => {
    const { w, b, near, far } = setup();
    place(w, b, 66, Y);
    place(w, near, 76, Y);
    place(w, far, 88, Y);
    expect(cast(w, b, 3, 76, Y)).toBeNull();
    step(w, 3);
    const zone = w.zones.find((z) => z.kind === 'citybreaker');
    expect(zone && zone.hostile && zone.ult).toBeTruthy();
    expect(near.hp).toBe(near.stats.maxHp); // nothing happens during the wind-up
    stepSecs(w, 1.3);
    expect(Math.hypot(b.x - 76, b.y - Y)).toBeLessThan(1);
    expect(hasEffect(near, 'airborne')).toBe(true);
    expect(near.hp).toBeLessThan(near.stats.maxHp);
    expect(far.hp).toBe(far.stats.maxHp);
  });

  it('Set in Stone builds armor near enemy heroes and crumbles when alone', () => {
    const { w, b, near } = setup();
    place(w, b, 70, Y);
    place(w, near, 73, Y);
    const armor = b.stats.armor;
    stepSecs(w, 3.2);
    expect(b.stats.armor).toBeCloseTo(armor + PASSIVE.brannochStack(6), 0);
    stepSecs(w, 6);
    expect(b.hero!.p.stacks).toBe(4);
    place(w, near, 120, Y);
    stepSecs(w, 3.5);
    expect(b.stats.armor).toBeCloseTo(armor, 0);
  });
});

describe('Suri Vale, Ember Courier', () => {
  function setup() {
    const f = fixture([
      ['suri', 0],
      ['brannoch', 1],
      ['oru', 0],
    ]);
    const [s, e, ally] = f.h;
    setLevel(f.w, s, 6);
    learn(f.w, s, [1, 1, 1, 1]);
    place(f.w, ally, 20, 57);
    return { ...f, s, e, ally };
  }

  it('Hot Route: moving charges the next attack; standing still does not', () => {
    const { w, s, e } = setup();
    place(w, s, 60, Y);
    place(w, e, 90, Y);
    cmd(w, s, { t: 'move', x: 70, y: Y });
    stepSecs(w, 3.5);
    expect(s.hero!.p.charge).toBeGreaterThan(0.95);
    place(w, e, 74, Y);
    e.stats.hpRegen = 0;
    const hp = e.hp;
    cmd(w, s, { t: 'attack', id: e.id });
    stepSecs(w, 1.0);
    const first = hp - e.hp;
    const plain = s.stats.ad * mitigate(e.stats.armor, 0);
    expect(first).toBeGreaterThan(plain + 20); // charged shot adds arcane damage
    expect(s.hero!.p.charge).toBe(0);
    const hp2 = e.hp;
    stepSecs(w, 1.25);
    expect(hp2 - e.hp).toBeLessThan(first - 20); // follow-up without moving is a plain attack
  });

  it('Ricochet Bolt bounces once off terrain and still hits', () => {
    const { w, s, e } = setup();
    // fire north into the lane's outer wall from the middle of the lane; the target stands back down-lane
    place(w, s, 75, 99);
    place(w, e, 75, 94.2);
    e.stats.hpRegen = 0;
    const hp = e.hp;
    expect(cast(w, s, 0, 75, 110)).toBeNull();
    stepSecs(w, 1.2);
    expect(e.hp).toBeLessThan(hp); // came back off the wall
  });

  it('Slipstream dashes and leaves a lane that speeds an ally once', () => {
    const { w, s, ally } = setup();
    place(w, s, 70, Y);
    place(w, ally, 68, Y);
    expect(cast(w, s, 1, 80, Y)).toBeNull();
    stepSecs(w, 0.4);
    expect(s.x).toBeGreaterThan(74.5);
    const zone = w.zones.find((z) => z.kind === 'slipstream')!;
    expect(zone.hostile).toBe(false);
    const base = ally.stats.speed;
    cmd(w, ally, { t: 'move', x: 76, y: Y });
    stepSecs(w, 0.8);
    expect(ally.stats.speed).toBeGreaterThan(base * 1.25);
    expect(zone.touched).toContain(ally.id);
  });

  it('Parcel Charge detonates after its fuse, and basic attacks shorten it', () => {
    const { w, s, e } = setup();
    place(w, s, 70, Y);
    place(w, e, 75, Y);
    e.stats.hpRegen = 0;
    expect(cast(w, s, 2, e.x, e.y, e.id)).toBeNull();
    stepSecs(w, 0.2);
    expect(hasEffect(e, 'parcel')).toBe(true);
    const hp = e.hp;
    stepSecs(w, 3.0);
    expect(hasEffect(e, 'parcel')).toBe(true);
    stepSecs(w, 1.2);
    expect(hasEffect(e, 'parcel')).toBe(false);
    expect(hp - e.hp).toBeGreaterThan(40);
    // with attacks the same fuse is much shorter
    s.hero!.cdUntil[2] = 0;
    s.mana = 300;
    expect(cast(w, s, 2, e.x, e.y, e.id)).toBeNull();
    cmd(w, s, { t: 'attack', id: e.id });
    stepSecs(w, 2.9);
    expect(hasEffect(e, 'parcel')).toBe(false);
  });

  it('Redline Delivery reveals Suri while channelling and hits harder at range', () => {
    const hit = (dist: number): number => {
      const { w, s, e } = setup();
      place(w, s, 62, 97.4);
      place(w, e, 62 + dist, dist > 20 ? 95.6 : 97.8);
      const hp = e.hp;
      expect(cast(w, s, 3, e.x, e.y)).toBeNull();
      step(w, 5);
      expect(hasEffect(s, 'reveal')).toBe(true);
      expect(w.zones.some((z) => z.kind === 'redline' && z.hostile)).toBe(true);
      expect(e.hp).toBe(hp);
      stepSecs(w, 2);
      return dmgFrom(e, 'Redline Delivery');
    };
    const close = hit(6);
    const long = hit(30);
    expect(close).toBeGreaterThan(0);
    expect(long).toBeGreaterThan(close * 1.4);
  });
});

describe('Oru, Choir of Moths', () => {
  function setup() {
    const f = fixture([
      ['oru', 0],
      ['suri', 0],
      ['kesh', 1],
    ]);
    const [o, ally, e] = f.h;
    setLevel(f.w, o, 6);
    learn(f.w, o, [1, 1, 1, 1]);
    return { ...f, o, ally, e };
  }

  it('Luminous Swarm shields the first ally, and Shared Wing returns health if the shield holds', () => {
    const { w, o, ally, e } = setup();
    place(w, o, 70, Y);
    place(w, ally, 75, Y);
    place(w, e, 120, 60);
    ally.hp = 200;
    ally.stats.hpRegen = 0;
    expect(cast(w, o, 0, 80, Y)).toBeNull();
    stepSecs(w, 1);
    const shield = totalShield(ally);
    expect(shield).toBeCloseTo(val(HEROES.oru.abilities[0], 'shield', 1), 0);
    const hp = ally.hp;
    stepSecs(w, 3.1);
    expect(totalShield(ally)).toBe(0);
    expect(ally.hp - hp).toBeGreaterThanOrEqual(shield * 0.3 - 1);
  });

  it('Luminous Swarm damages the first enemy instead', () => {
    const { w, o, ally, e } = setup();
    place(w, o, 70, Y);
    place(w, ally, 20, 57);
    place(w, e, 76, Y);
    const hp = e.hp;
    expect(cast(w, o, 0, 80, Y)).toBeNull();
    stepSecs(w, 1);
    expect(hp).toBeGreaterThan(e.hp);
    expect(dmgFrom(e, 'Luminous Swarm')).toBeCloseTo(val(HEROES.oru.abilities[0], 'dmg', 1) * mitigate(e.stats.ward, 0), 0);
    expect(totalShield(e)).toBe(0);
  });

  it('Hush Field cuts enemy vision without hiding the zone itself', () => {
    const { w, o, ally, e } = setup();
    place(w, o, 62, Y);
    place(w, ally, 85, Y); // 9 m from the enemy: normally visible
    place(w, e, 76, Y);
    step(w, 6);
    expect(ally.visUntil[1]).toBeGreaterThanOrEqual(w.tick);
    expect(cast(w, o, 1, 70.9, Y)).toBeNull();
    stepSecs(w, 0.6);
    expect(hasEffect(e, 'blind')).toBe(true);
    stepSecs(w, 0.5);
    expect(ally.visUntil[1]).toBeLessThan(w.tick); // 9 m away is beyond the 4 m hushed sight
    expect(w.zones.some((z) => z.kind === 'hush' && z.hostile)).toBe(true);
  });

  it('Guiding Draft speeds an ally and their next ability hit marks the target for the team', () => {
    const { w, o, ally, e } = setup();
    learn(w, ally, [1, 0, 0, 0]);
    place(w, o, 68, Y);
    place(w, ally, 70, Y);
    place(w, e, 78, Y);
    const speed = ally.stats.speed;
    expect(cast(w, o, 2, ally.x, ally.y, ally.id)).toBeNull();
    step(w, 2);
    expect(ally.stats.speed).toBeGreaterThan(speed * 1.25);
    expect(cast(w, ally, 0, e.x, e.y)).toBeNull();
    stepSecs(w, 0.8);
    expect(hasEffect(e, 'reveal')).toBe(true);
    expect(hasEffect(ally, 'draft')).toBe(false);
  });

  it('Night Migration shields allies it passes and roots enemies at its leading edge', () => {
    const { w, o, ally, e } = setup();
    place(w, o, 62, Y);
    place(w, ally, 66, Y + 2);
    place(w, e, 72, Y - 1);
    expect(cast(w, o, 3, 80, Y)).toBeNull();
    stepSecs(w, 1.0);
    expect(totalShield(ally)).toBeGreaterThan(100);
    stepSecs(w, 0.6);
    expect(hasEffect(e, 'root')).toBe(true);
    const x = e.x;
    cmd(w, e, { t: 'move', x: 90, y: Y });
    stepSecs(w, 0.6);
    expect(e.x).toBeCloseTo(x, 1); // rooted
  });
});

describe('Kesh, Mirebound', () => {
  function setup() {
    const f = fixture([
      ['kesh', 0],
      ['suri', 1],
    ]);
    const [k, e] = f.h;
    setLevel(f.w, k, 6);
    learn(f.w, k, [1, 1, 1, 1]);
    e.stats.hpRegen = 0;
    return { ...f, k, e };
  }

  it('Reed Cleaver swings twice and the second swing scales with missing health', () => {
    const { w, k, e } = setup();
    place(w, k, 70, Y);
    place(w, e, 72.5, Y);
    e.hp = e.stats.maxHp * 0.5;
    const hp = e.hp;
    expect(cast(w, k, 0, 80, Y)).toBeNull();
    stepSecs(w, 0.25);
    const first = hp - e.hp;
    expect(first).toBeGreaterThan(0);
    stepSecs(w, 0.6);
    const second = hp - e.hp - first;
    expect(second).toBeGreaterThan(first + 5);
  });

  it('Bogskin reduces damage, then slows nearby enemies when it ends', () => {
    const { w, k, e } = setup();
    place(w, k, 70, Y);
    place(w, e, 72.5, Y);
    expect(cast(w, k, 1, 0, 0)).toBeNull();
    const hp = k.hp;
    dealDamage(w, e, k, 100, PURE);
    expect(hp - k.hp).toBeCloseTo(100 * (1 - val(HEROES.kesh.abilities[1], 'dr', 1) / 100), 1);
    expect(hasEffect(e, 'slow')).toBe(false);
    stepSecs(w, 2.6);
    expect(hasEffect(e, 'slow')).toBe(true);
  });

  it('Sinkstep burrows through a thin wall and surfaces with attack speed', () => {
    const { w, k } = setup();
    // the wall between the pit-side ledge trail and the Colossus pit is thin: burrow through it
    place(w, k, 64.2, 60.5);
    expect(w.map.segmentClear(64.2, 60.5, 68.6, 60.5)).toBe(false);
    const as = k.stats.as;
    expect(cast(w, k, 2, 75, 60.5)).toBeNull();
    stepSecs(w, 0.6);
    expect(k.x).toBeGreaterThan(67.5);
    expect(w.map.walkable(k.x, k.y, 0.3)).toBe(true);
    expect(k.stats.as).toBeGreaterThan(as * 1.3);
  });

  it('Fen Claim slows and reveals enemies inside it — even in brush', () => {
    const { w, k, e } = setup();
    place(w, k, 57, 98);
    place(w, e, 65.5, 100.9); // inside the upper-lane brush, outside the tower's true sight
    step(w, 6);
    expect(e.brush).toBeGreaterThanOrEqual(0);
    expect(e.visUntil[0]).toBeLessThan(w.tick);
    expect(cast(w, k, 3, 62, 100)).toBeNull();
    stepSecs(w, 1);
    expect(hasEffect(e, 'slow')).toBe(true);
    expect(e.visUntil[0]).toBeGreaterThanOrEqual(w.tick);
    expect(e.hp).toBeLessThan(e.stats.maxHp);
  });

  it("Predator's Patience heals on attacks against a marked target, on a cooldown", () => {
    const { w, k, e } = setup();
    place(w, k, 70, Y);
    place(w, e, 71.5, Y);
    k.hp = 300;
    k.stats.hpRegen = 0;
    cmd(w, k, { t: 'attack', id: e.id });
    stepSecs(w, 0.6); // first hit only marks
    expect(hasEffect(e, 'keshmark')).toBe(true);
    const healed = k.hero!.healing;
    stepSecs(w, 1.5);
    expect(k.hero!.healing - healed).toBeGreaterThan(PASSIVE.keshHeal(6) - 1);
    const once = k.hero!.healing;
    stepSecs(w, 1.5);
    expect(k.hero!.healing).toBe(once); // 4 s cooldown between heals
  });
});

describe('Ilyra Quill, Archive Exile', () => {
  function setup() {
    const f = fixture([
      ['ilyra', 0],
      ['brannoch', 1],
      ['suri', 1],
    ]);
    const [il, e, e2] = f.h;
    setLevel(f.w, il, 6);
    learn(f.w, il, [1, 1, 1, 1]);
    e.stats.hpRegen = 0;
    e2.stats.hpRegen = 0;
    return { ...f, il, e, e2 };
  }

  it('Linebreak pierces, dealing 60% after the first hero', () => {
    const { w, il, e, e2 } = setup();
    place(w, il, 66, Y);
    place(w, e, 71, Y);
    place(w, e2, 75, Y);
    const hp = [e.hp, e2.hp];
    expect(cast(w, il, 0, 90, Y)).toBeNull();
    stepSecs(w, 1);
    const base = val(HEROES.ilyra.abilities[0], 'dmg', 1) + 0.7 * il.stats.ap;
    expect(hp[0]).toBeGreaterThan(e.hp);
    expect(dmgFrom(e, 'Linebreak')).toBeCloseTo(base * mitigate(e.stats.ward, 0), 0);
    expect(dmgFrom(e2, 'Linebreak')).toBeCloseTo(base * 0.6 * mitigate(e2.stats.ward, 0), 0);
  });

  it('Footnote repeats a Linebreak that passes through it at 40% toward the nearest enemy hero', () => {
    const { w, il, e, e2 } = setup();
    place(w, il, 66, Y);
    place(w, e, 72, 101.5); // off the firing line
    place(w, e2, 130, 57);
    expect(cast(w, il, 1, 70, Y)).toBeNull();
    stepSecs(w, 0.8);
    const hp = e.hp;
    expect(cast(w, il, 0, 90, Y)).toBeNull(); // straight down the lane, misses the hero directly
    stepSecs(w, 1);
    const base = val(HEROES.ilyra.abilities[0], 'dmg', 1) + 0.7 * il.stats.ap;
    expect(hp).toBeGreaterThan(e.hp);
    expect(dmgFrom(e, 'Linebreak')).toBeCloseTo(base * 0.4 * mitigate(e.stats.ward, 0), 0);
  });

  it('Redaction silences, and erases enemy projectiles and zones — but not ultimates', () => {
    const { w, il, e, e2 } = setup();
    learn(w, e2, [1, 1, 1, 1]);
    learn(w, e, [1, 1, 1, 1]);
    setLevel(w, e, 6);
    place(w, il, 66, Y);
    place(w, e, 70, Y);
    place(w, e2, 77, Y);
    expect(cast(w, e, 1, 68, Y)).toBeNull(); // enemy Rampart Fold in front of Ilyra
    stepSecs(w, 0.3);
    expect(w.walls.length).toBe(2);
    expect(cast(w, e2, 0, 66, Y)).toBeNull(); // enemy Ricochet Bolt incoming
    stepSecs(w, 0.25);
    expect(w.projs.some((p) => p.kind === 'ricochet')).toBe(true);
    expect(cast(w, il, 2, 80, Y)).toBeNull();
    stepSecs(w, 0.35);
    expect(w.projs.some((p) => p.kind === 'ricochet')).toBe(false);
    expect(w.walls.length).toBe(0);
    expect(hasEffect(e, 'silence')).toBe(true);
    expect(cast(w, e, 0, 66, Y)).toBe('Silenced');
  });

  it('Margin Notes detonates at three different annotations', () => {
    const { w, il, e } = setup();
    place(w, il, 66, Y);
    place(w, e, 70, Y);
    dealDamage(w, il, e, 10, ARCANE, { ability: 0 });
    dealDamage(w, il, e, 10, ARCANE, { ability: 0 }); // same annotation twice: no burst
    dealDamage(w, il, e, 10, ARCANE, { ability: 1 });
    const hp = e.hp;
    dealDamage(w, il, e, 10, ARCANE, { ability: 2 });
    const burst = (PASSIVE.ilyraBurst(6) + 0.3 * il.stats.ap) * mitigate(e.stats.ward, 0);
    expect(hp - e.hp).toBeCloseTo(10 * mitigate(e.stats.ward, 0) + burst, 0);
    expect(e.effects.some((x) => x.type.startsWith('note'))).toBe(false);
  });

  it('Final Draft lands three rings; only targets hit by all of them are stunned', () => {
    const { w, il, e, e2 } = setup();
    place(w, il, 62, Y);
    place(w, e, 72, Y); // centre: hit by all three
    place(w, e2, 76.6, Y); // 4.6 m out: only the last ring
    expect(cast(w, il, 3, 72, Y)).toBeNull();
    stepSecs(w, 2.6);
    const per = (val(HEROES.ilyra.abilities[3], 'dmg', 1) + 0.35 * il.stats.ap) * mitigate(e.stats.ward, 0);
    expect(e.stats.maxHp - e.hp).toBeGreaterThan(per * 2.9);
    expect(hasEffect(e, 'stun')).toBe(true);
    expect(e2.hp).toBeLessThan(e2.stats.maxHp);
    expect(hasEffect(e2, 'stun')).toBe(false);
  });
});

describe('Vey, Glassknife', () => {
  function setup() {
    const f = fixture([
      ['vey', 0],
      ['suri', 1],
    ]);
    const [v, e] = f.h;
    setLevel(f.w, v, 6);
    learn(f.w, v, [1, 1, 1, 1]);
    e.stats.hpRegen = 0;
    return { ...f, v, e };
  }

  it('Shardstep dashes through the target and cannot repeat on it for 6 s', () => {
    const { w, v, e } = setup();
    place(w, v, 70, Y);
    place(w, e, 74, Y);
    const hp = e.hp;
    expect(cast(w, v, 0, e.x, e.y, e.id)).toBeNull();
    stepSecs(w, 0.5);
    expect(v.x).toBeGreaterThan(e.x); // ended up behind the target
    expect(e.hp).toBeLessThan(hp);
    v.hero!.cdUntil[0] = 0;
    v.mana = 200;
    expect(cast(w, v, 0, e.x, e.y, e.id)).not.toBeNull();
    expect(rejections(w).some((r) => r.includes('too recently'))).toBe(true);
  });

  it('Mirror Decoy sends a harmless copy and the recast swaps places within range', () => {
    const { w, v, e } = setup();
    place(w, v, 70, Y);
    place(w, e, 100, Y);
    expect(cast(w, v, 1, 80, Y)).toBeNull();
    stepSecs(w, 1);
    const decoy = w.units.find((u) => u.kind === 'decoy')!;
    expect(decoy.x).toBeGreaterThan(72.5);
    expect(decoy.stats.ad).toBe(0);
    const dx = decoy.x;
    expect(cast(w, v, 1, 0, 0)).toBeNull();
    expect(v.x).toBeCloseTo(dx, 1);
    expect(decoy.x).toBeCloseTo(70, 0);
    stepSecs(w, 3.5);
    expect(w.units.some((u) => u.kind === 'decoy')).toBe(false);
  });

  it('Cut the Light damages heroes and disables enemy wards for 5 s', () => {
    const { w, v, e } = setup();
    place(w, e, 73, Y);
    expect(cmd(w, e, { t: 'ward', x: 73, y: Y + 1 })).toBeNull();
    const ward = w.units.find((u) => u.kind === 'ward')!;
    place(w, v, 70, Y);
    const hp = e.hp;
    expect(cast(w, v, 2, 80, Y + 0.5)).toBeNull();
    stepSecs(w, 0.3);
    expect(e.hp).toBeLessThan(hp);
    expect(ward.disabledUntil).toBeGreaterThan(w.tick + 100);
    expect(w.visionSrc[1].some((s) => s.x === ward.x && s.y === ward.y)).toBe(false);
    stepSecs(w, 5.2);
    expect(w.visionSrc[1].some((s) => s.x === ward.x && s.y === ward.y)).toBe(true);
  });

  it('Prism Sentence blinks and strikes after 1.2 s; breaking line of sight cancels the blink and cuts damage', () => {
    const strike = (breakLos: boolean): { dmg: number; blinked: boolean } => {
      const { w, v, e } = setup();
      place(w, v, 63.3, 61.5); // the vision ledge beside the Colossus pit
      place(w, e, 62.6, 57.6);
      step(w, 6);
      expect(cast(w, v, 3, e.x, e.y, e.id)).toBeNull();
      expect(hasEffect(e, 'prism')).toBe(true);
      if (breakLos) place(w, e, 57, 67); // behind 2.7 m of mistwood, still within reach
      expect(w.map.losClear(v.x, v.y, e.x, e.y)).toBe(!breakLos);
      const vx = v.x;
      const vy = v.y;
      stepSecs(w, 1.3);
      return { dmg: dmgFrom(e, 'Prism Sentence'), blinked: Math.hypot(v.x - vx, v.y - vy) > 1.5 };
    };
    const clean = strike(false);
    const broken = strike(true);
    expect(clean.blinked).toBe(true);
    expect(clean.dmg).toBeGreaterThan(150);
    expect(broken.blinked).toBe(false);
    expect(broken.dmg).toBeGreaterThan(0);
    expect(broken.dmg).toBeLessThan(clean.dmg * 0.5);
  });

  it('Refraction empowers the next attack after leaving brush', () => {
    const { w, v, e } = setup();
    place(w, v, 61, 100.4); // in brush
    place(w, e, 120, 57);
    step(w, 4);
    expect(v.hero!.p.refractUntil).toBeGreaterThan(w.tick);
    place(w, v, 70, Y);
    place(w, e, 71.5, Y);
    step(w, 2);
    const hp = e.hp;
    cmd(w, v, { t: 'attack', id: e.id });
    stepSecs(w, 0.5);
    const plain = v.stats.ad * mitigate(e.stats.armor, 0);
    expect(hp - e.hp).toBeGreaterThan(plain + 10);
    void PHYS;
  });
});

describe('talents and items', () => {
  it('Skyhop blinks, Bulwark shields, Sunder only strikes non-heroes', () => {
    const { w, h } = fixture([
      ['kesh', 0],
      ['suri', 1],
    ]);
    const [k, e] = h;
    k.hero!.talents = ['sunder', 'skyhop'];
    place(w, k, 70, Y);
    place(w, e, 73, Y);
    expect(cast(w, k, 5, 80, Y)).toBeNull();
    expect(k.x).toBeCloseTo(74.5, 0);
    expect(cast(w, k, 5, 80, Y)).toBe('On cooldown');
    expect(cast(w, k, 4, e.x, e.y, e.id)).not.toBeNull();
    k.hero!.talents = ['bulwark', 'mend'];
    k.hero!.cdUntil[4] = 0;
    expect(cast(w, k, 4, 0, 0)).toBeNull();
    expect(totalShield(k)).toBeCloseTo(130, 0);
  });

  it('Null Bell cleanses roots and slows but not airborne; Kilnheart stacks armor on physical hits', () => {
    const { w, h } = fixture([
      ['brannoch', 0],
      ['suri', 1],
    ]);
    const [b, e] = h;
    b.hero!.gold = 9999;
    cmd(w, b, { t: 'buy', item: 'null_bell' });
    cmd(w, b, { t: 'buy', item: 'kilnheart_plate' });
    place(w, b, 70, Y);
    place(w, e, 74, Y);
    b.effects.push({ type: 'root', until: w.tick + 90, value: 0, src: 0, total: 90 }, { type: 'slow', until: w.tick + 90, value: 0.4, src: 0, total: 90 }, { type: 'airborne', until: w.tick + 90, value: 0, src: 0, total: 90 });
    expect(cmd(w, b, { t: 'item', slot: 0, x: 0, y: 0 })).toBeNull();
    expect(hasEffect(b, 'root')).toBe(false);
    expect(hasEffect(b, 'slow')).toBe(false);
    expect(hasEffect(b, 'airborne')).toBe(true);
    expect(cmd(w, b, { t: 'item', slot: 0, x: 0, y: 0 })).not.toBeNull(); // 90 s cooldown
    step(w, 2);
    const armor = b.stats.armor;
    for (let i = 0; i < 8; i++) dealDamage(w, e, b, 10, PHYS, { basic: true });
    step(w, 1);
    expect(b.stats.armor).toBeCloseTo(armor + 24, 0); // capped at 6 stacks
  });
});
