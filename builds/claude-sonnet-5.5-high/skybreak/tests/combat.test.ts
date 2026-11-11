import { describe, expect, it } from 'vitest';
import { COMBAT, ITEMS, WEAPONS, effectiveWeapon, type WeaponId } from '../src/shared/content';
import { Match } from '../src/sim/match';
import type { GameEvent, Player } from '../src/sim/types';
import { giveGun, practice, run } from './helpers';

function target(m: Match, id: number, x: number, z: number): Player {
  const d = m.players[id];
  d.alive = true; d.mode = 'ground'; d.health = 100; d.aegis = 0; d.reserve = 0;
  d.x = x; d.z = z; d.y = m.world.heightAt(x, z); d.onGround = true; d.dummy = false; d.isBot = true;
  return d;
}

describe('damage model', () => {
  it('depletes Aegis, then Reserve Shield, then Health', () => {
    const m = practice();
    const h = m.players[0];
    h.aegis = 50; h.reserve = 25; h.health = 100;
    m.damage(h, 60, 1, 'test', 'torso', false);
    expect(h.aegis).toBe(0);
    expect(h.reserve).toBe(15);
    expect(h.health).toBe(100);
    m.damage(h, 50, 1, 'test', 'torso', false);
    expect(h.reserve).toBe(0);
    expect(h.health).toBe(65);
  });

  it('recharges Aegis at 10/s after 8 s without damage', () => {
    const m = practice();
    const h = m.players[0];
    h.aegis = 50;
    m.damage(h, 30, 1, 'test', 'torso', false);
    expect(h.aegis).toBe(20);
    run(m, {}, 7.5);
    expect(h.aegis).toBe(20);
    run(m, {}, 3.5); // 8.0 -> 11.0 s since damage: ~3 s of recharge
    expect(h.aegis).toBeGreaterThan(40);
    expect(h.aegis).toBeLessThanOrEqual(50);
    run(m, {}, 2);
    expect(h.aegis).toBe(50);
  });

  it('attributes kills by 12 s damage contribution and credits assists', () => {
    const m = practice();
    const v = target(m, 3, 10, 10);
    m.players[1].alive = true; m.players[2].alive = true;
    const before = m.aliveCount();
    m.damage(v, 30, 1, 'test', 'torso', true);
    m.damage(v, 100, 2, 'test', 'torso', true);
    expect(v.alive).toBe(false);
    expect(m.players[2].stats.kills).toBe(1);
    expect(m.players[1].stats.assists).toBe(1);
    expect(before).toBeGreaterThan(0);
  });

  it('credits recent attackers for storm eliminations', () => {
    const m = practice();
    const v = target(m, 3, 10, 10);
    m.players[1].alive = true;
    m.damage(v, 20, 1, 'test', 'torso', true);
    m.damage(v, 100, -1, 'Riftstorm', 'torso', true, true);
    expect(v.alive).toBe(false);
    expect(m.players[1].stats.kills).toBe(1);
  });

  it('drops weapons and a consolidated cache on death', () => {
    const m = practice();
    const v = target(m, 3, 10, 10);
    v.slots[0] = { kind: 'weapon', weapon: 'sundial', rarity: 2, mag: 7 };
    v.slots[1] = { kind: 'item', item: 'medInjector', count: 3 };
    v.ammo.heavy = 33; v.ammo.light = 70;
    const lootBefore = m.loot.size;
    m.damage(v, 500, 0, 'test', 'torso', true);
    expect(m.loot.size).toBe(lootBefore + 2);
    const drops = [...m.loot.values()].filter((e) => e.source === 'death');
    const gun = drops.find((e) => e.data.kind === 'weapon');
    expect(gun && gun.data.kind === 'weapon' && gun.data.weapon).toBe('sundial');
    expect(gun && gun.data.kind === 'weapon' && gun.data.mag).toBe(7); // exact preserved
    const cache = drops.find((e) => e.data.kind === 'cache');
    expect(cache && cache.data.kind === 'cache' && cache.data.ammo.heavy).toBe(33);
    expect(cache && cache.data.kind === 'cache' && cache.data.items[0].count).toBe(3);
  });
});

describe('weapons', () => {
  it('honours rate of fire, magazine and ammo reserve', () => {
    const m = practice();
    const h = m.players[0];
    giveGun(h, 'wayfarer', 0, 200);
    run(m, { fire: true, yaw: 0, pitch: 0.6 }, 3);
    const eff = effectiveWeapon('wayfarer', 0);
    const expected = (eff.rpm / 60) * 3;
    expect(h.stats.shots).toBeGreaterThanOrEqual(Math.floor(expected) - 2);
    expect(h.stats.shots).toBeLessThanOrEqual(Math.ceil(expected) + 2);
    expect((h.slots[0] as { mag: number }).mag).toBe(eff.mag - h.stats.shots);
  });

  it('reloads from reserve and clamps to the magazine size', () => {
    const m = practice();
    const h = m.players[0];
    giveGun(h, 'harbor', 0, 20);
    (h.slots[0] as { mag: number }).mag = 3;
    run(m, { reload: true }, 0.05);
    expect(h.reloading).toBe(true);
    run(m, {}, effectiveWeapon('harbor', 0).reload + 0.2);
    expect(h.reloading).toBe(false);
    expect((h.slots[0] as { mag: number }).mag).toBe(15);
    expect(h.ammo.light).toBe(8);
  });

  it('semi-auto weapons fire once per click and cannot hold-fire', () => {
    const m = practice();
    const h = m.players[0];
    giveGun(h, 'sundial', 0, 40);
    run(m, { fire: true, pitch: 0.6 }, 1.5);
    expect(h.stats.shots).toBe(1);
  });

  it('applies headshot multipliers and distance falloff (Wayfarer)', () => {
    const m = practice();
    const h = m.players[0];
    const t = target(m, 3, 0, 20 + 12);
    giveGun(h, 'wayfarer', 0, 999);
    const dmg: Record<string, number[]> = { head: [], torso: [], limb: [] };
    for (let pitch = -0.25; pitch <= 0.25; pitch += 0.004) {
      t.health = 100; t.alive = true; t.mode = 'ground';
      h.yaw = 0; h.slots[0] = { kind: 'weapon', weapon: 'wayfarer', rarity: 0, mag: 30 }; h.fireCd = 0; h.recoilP = 0; h.recoilY = 0; h.bloom = 0; h.recoilIdx = 0;
      m.drainEvents();
      m.step(new Map([[0, { ...emptyIn(), yaw: 0, pitch, fire: true, ads: true, crouch: true }]]));
      for (const e of m.drainEvents() as GameEvent[]) if (e.type === 'hit') dmg[e.zone].push(e.amount);
    }
    expect(dmg.head.length).toBeGreaterThan(0);
    expect(dmg.torso.length).toBeGreaterThan(0);
    const head = dmg.head[0], torso = dmg.torso[0];
    expect(head / torso).toBeCloseTo(WEAPONS.wayfarer.headMult, 1);
    expect(torso).toBeCloseTo(WEAPONS.wayfarer.damage, 0);
  });

  it('caps aggregate shotgun damage per shot', () => {
    const m = practice();
    const h = m.players[0];
    giveGun(h, 'breakwater', 4, 20);
    const t = target(m, 3, 0, 20 + 3);
    let max = 0;
    for (let pitch = -0.2; pitch <= 0.2; pitch += 0.01) {
      t.health = 100; t.alive = true; t.mode = 'ground'; t.aegis = 0; t.reserve = 0;
      h.fireCd = 0; h.slots[0] = { kind: 'weapon', weapon: 'breakwater', rarity: 4, mag: 5 }; h.recoilIdx = 0;
      m.drainEvents();
      m.step(new Map([[0, { ...emptyIn(), yaw: 0, pitch, fire: true, ads: true }]]));
      for (const e of m.drainEvents() as GameEvent[]) if (e.type === 'hit') max = Math.max(max, e.amount);
    }
    expect(max).toBeGreaterThan(40);
    expect(max).toBeLessThanOrEqual(WEAPONS.breakwater.pelletCap * effectiveWeapon('breakwater', 4).rarity.damage + 0.001);
  });

  it('fires the Longwake Rail as a travelling projectile', () => {
    let hitAt = -1, fired = false, best = 100;
    for (let pitch = -0.04; pitch <= 0.04 && hitAt < 0; pitch += 0.002) {
      const mm = practice();
      const hh = mm.players[0];
      hh.x = 12; hh.z = -70; hh.y = mm.world.heightAt(12, -70);
      giveGun(hh, 'longwake', 0, 20);
      const tt = target(mm, 3, 12 - 0.41, 10); // 80 m away, centred on the ADS camera ray
      mm.step(new Map([[0, { ...emptyIn(), yaw: 0, pitch, fire: true, ads: true }]]));
      let ticks = 0;
      for (; ticks < 60 && tt.health === 100; ticks++) {
        mm.step(new Map([[0, { ...emptyIn(), yaw: 0, pitch }]]));
        fired = fired || mm.projectiles.length > 0;
      }
      if (tt.health < 100) { hitAt = ticks; best = tt.health; }
    }
    expect(fired).toBe(true);
    expect(hitAt).toBeGreaterThan(4); // 80 m at 230 m/s takes ~10 ticks: not instant
    expect(hitAt).toBeLessThan(25);
    expect(best).toBeLessThan(40);
  });

  it('uses data-driven stats for all nine weapons', () => {
    for (const id of Object.keys(WEAPONS) as WeaponId[]) {
      const m = practice();
      const h = m.players[0];
      giveGun(h, id, 1, 100);
      run(m, { fire: true, pitch: 0.7 }, 2.2);
      expect(h.stats.shots, id).toBeGreaterThan(0);
      expect((h.slots[0] as { mag: number }).mag, id).toBeLessThan(effectiveWeapon(id, 1).mag);
    }
  });
});

describe('healing and utility', () => {
  it('Med Injector restores 35 Health over 3 s and consumes one charge', () => {
    const m = practice();
    const h = m.players[0];
    h.health = 40;
    h.slots[1] = { kind: 'item', item: 'medInjector', count: 2 };
    h.selected = 1;
    run(m, { fire: true }, 0.05);
    expect(h.using).not.toBeNull();
    run(m, {}, ITEMS.medInjector.useTime + 0.2);
    expect(h.health).toBeCloseTo(75, 0);
    expect((h.slots[1] as { count: number }).count).toBe(1);
  });

  it('Trauma Kit is cancelled by damage', () => {
    const m = practice();
    const h = m.players[0];
    h.health = 30;
    h.slots[1] = { kind: 'item', item: 'traumaKit', count: 1 };
    h.selected = 1;
    run(m, { fire: true }, 0.05);
    run(m, {}, 2);
    expect(h.using).not.toBeNull();
    m.damage(h, 5, 1, 'test', 'torso', true);
    expect(h.using).toBeNull();
    expect((h.slots[1] as { count: number }).count).toBe(1);
  });

  it('Shield Flask restores 25 Reserve Shield (max 50) and Aegis Cell restarts recharge', () => {
    const m = practice();
    const h = m.players[0];
    h.slots[1] = { kind: 'item', item: 'shieldFlask', count: 4 };
    h.selected = 1;
    for (let i = 0; i < 3; i++) { run(m, { fire: true }, 0.05); run(m, {}, ITEMS.shieldFlask.useTime + 0.1); }
    expect(h.reserve).toBe(50);
    expect((h.slots[1] as { count: number }).count).toBe(2); // the third use is refused at the 50 cap
    h.aegis = 10;
    m.damage(h, 1, 1, 'test', 'torso', true);
    h.slots[2] = { kind: 'item', item: 'aegisCell', count: 1 };
    h.selected = 2;
    run(m, { fire: true }, 0.05);
    run(m, {}, ITEMS.aegisCell.useTime + 1);
    expect(h.aegis).toBeGreaterThan(15);
  });

  it('Wind Orb displaces players with low damage', () => {
    const m = practice();
    const h = m.players[0];
    const t = target(m, 3, 0, 20 + 6);
    t.aegis = 0;
    h.slots[0] = { kind: 'item', item: 'windOrb', count: 2 };
    h.selected = 0;
    run(m, { throwItem: true, yaw: 0, pitch: -0.1 }, 0.05);
    run(m, {}, 1.8);
    const moved = Math.hypot(t.x - 0, t.z - 26);
    expect(moved + (100 - t.health)).toBeGreaterThan(0.5);
    expect(100 - t.health).toBeLessThan(20);
  });

  it('Mist Capsule creates a smoke cloud that blocks bot line of sight', () => {
    const m = practice();
    const h = m.players[0];
    h.slots[0] = { kind: 'item', item: 'mistCapsule', count: 1 };
    h.selected = 0;
    run(m, { throwItem: true, yaw: 0, pitch: -0.15 }, 0.05);
    run(m, {}, 2.2);
    expect(m.smokes.length).toBe(1);
    const s = m.smokes[0];
    expect(m.lineThroughSmoke({ x: s.x - 20, y: 5, z: s.z }, { x: s.x + 20, y: 5, z: s.z })).toBe(true);
    expect(m.lineThroughSmoke({ x: s.x - 20, y: 5, z: s.z + 40 }, { x: s.x + 20, y: 5, z: s.z + 40 })).toBe(false);
  });

  it('Grapple Spool pulls the player toward terrain within range', () => {
    const m = practice();
    const h = m.players[0];
    h.x = 0; h.z = 10; h.y = m.world.heightAt(0, 10);
    h.slots[0] = { kind: 'item', item: 'grappleSpool', count: 3 };
    h.selected = 0;
    // aim at the ground ~20 m ahead
    run(m, { fire: true, yaw: 0, pitch: -0.1 }, 0.05);
    expect(h.mode).toBe('grapple');
    run(m, {}, 3);
    expect(h.z).toBeGreaterThan(22);
    expect((h.slots[0] as { count: number }).count).toBe(2);
  });
});

function emptyIn() {
  return {
    moveF: 0, moveR: 0, yaw: 0, pitch: 0, jump: false, sprint: false, crouch: false, fire: false, ads: false, reload: false, interact: false,
    drop: false, melee: false, throwItem: false, deploy: false, slot: -1, cycle: 0, jumpSkiff: false, swapShoulder: false,
  };
}
void COMBAT;
