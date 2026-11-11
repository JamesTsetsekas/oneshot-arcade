import { describe, expect, it } from 'vitest';
import { AMMO_CAPS, ITEMS, PROTOTYPE_MATCH_CAP } from '../src/shared/content';
import { Rng } from '../src/shared/rng';
import { addAmmo, addItem, giveWeapon } from '../src/sim/inventory';
import { rollCapsule, rollChest, rollFloor, rollLocker, rollWeapon } from '../src/sim/loot';
import { practice, run } from './helpers';

describe('inventory rules', () => {
  it('stacks items up to their stack size and limits the inventory to five slots', () => {
    const m = practice();
    const h = m.players[0];
    expect(addItem(h, 'medInjector', 6)).toBe(6);
    expect((h.slots[0] as { count: number }).count).toBe(ITEMS.medInjector.stack);
    expect((h.slots[1] as { count: number }).count).toBe(2);
    expect(addItem(h, 'traumaKit', 3)).toBe(3); // stack of 2 + 1
    expect(h.slots.filter(Boolean)).toHaveLength(4);
    expect(giveWeapon(h, 'harbor', 0, 15)).toBe(4);
    expect(giveWeapon(h, 'harbor', 0, 15)).toBe(-1);
    expect(addItem(h, 'windOrb', 1)).toBe(0);
  });

  it('caps ammo per type (240 / 48 / 80 / 18)', () => {
    const m = practice();
    const h = m.players[0];
    expect(addAmmo(h, 'light', 500)).toBe(AMMO_CAPS.light);
    expect(addAmmo(h, 'light', 10)).toBe(0);
    expect(addAmmo(h, 'shell', 60)).toBe(48);
    expect(addAmmo(h, 'heavy', 90)).toBe(80);
    expect(addAmmo(h, 'charge', 99)).toBe(18);
  });

  it('picks up into free slots on tap and needs a hold to swap when full', () => {
    const m = practice();
    const h = m.players[0];
    h.x = 0; h.z = 20; h.y = m.world.heightAt(0, 20);
    for (let i = 0; i < 5; i++) giveWeapon(h, 'harbor', 0, 15);
    h.selected = 2;
    const e = m.addLoot({ kind: 'weapon', weapon: 'sundial', rarity: 3, mag: 12 }, h.x, h.y + 0.15, h.z + 1, 3, 'floor', true);
    run(m, { interact: true }, 0.2); // tap-length press, inventory full
    expect(m.loot.has(e.id)).toBe(true);
    run(m, {}, 0.1);
    run(m, { interact: true }, 0.7); // hold
    expect(m.loot.has(e.id)).toBe(false);
    expect(h.slots[2] && h.slots[2].kind === 'weapon' && h.slots[2].weapon).toBe('sundial');
    // the replaced pistol is dropped to the floor
    expect([...m.loot.values()].some((l) => l.data.kind === 'weapon' && l.data.weapon === 'harbor')).toBe(true);
  });

  it('takes a death cache greedily and leaves the remainder', () => {
    const m = practice();
    const h = m.players[0];
    h.x = 0; h.z = 20; h.y = m.world.heightAt(0, 20);
    const e = m.addLoot({ kind: 'cache', items: [{ item: 'medInjector', count: 4 }, { item: 'shieldFlask', count: 4 }], ammo: { light: 300, heavy: 10 }, owner: 'Tester' }, h.x, h.y + 0.15, h.z + 0.5, 1, 'death', true);
    for (let i = 0; i < 4; i++) giveWeapon(h, 'harbor', 0, 15); // only one free slot
    run(m, { interact: true }, 0.2);
    expect(h.ammo.light).toBe(240);
    expect(h.ammo.heavy).toBe(10);
    const left = m.loot.get(e.id);
    expect(left).toBeDefined();
    if (left && left.data.kind === 'cache') {
      expect(left.data.ammo.light).toBe(60);
      expect(left.data.items.length).toBe(1); // one stack fit in the free slot
    }
  });

  it('drops the selected slot to the floor', () => {
    const m = practice();
    const h = m.players[0];
    giveWeapon(h, 'needler', 2, 15);
    h.selected = 0;
    const before = m.loot.size;
    run(m, { drop: true }, 0.1);
    expect(h.slots[0]).toBeNull();
    expect(m.loot.size).toBe(before + 1);
  });
});

describe('server loot tables', () => {
  it('never rolls Prototype from floor, chest or locker sources and caps it overall', () => {
    const rng = new Rng(99);
    const budget = { prototypes: 0 };
    for (let tier = 1; tier <= 4; tier++) {
      for (let i = 0; i < 400; i++) {
        for (const k of [...rollFloor(rng, tier, true, budget), ...rollChest(rng, tier, budget)]) if (k.kind === 'weapon') expect(k.rarity).toBeLessThan(4);
      }
    }
    expect(budget.prototypes).toBe(0);
    rollLocker(rng).forEach((k) => expect(k.kind).not.toBe('weapon'));
    for (let i = 0; i < 40; i++) rollCapsule(rng, budget);
    expect(budget.prototypes).toBeLessThanOrEqual(PROTOTYPE_MATCH_CAP);
    expect(budget.prototypes).toBeGreaterThan(0);
  });

  it('suppresses duplicate weapons inside one chest and biases rarity by tier', () => {
    const rng = new Rng(7);
    const budget = { prototypes: 0 };
    for (let i = 0; i < 200; i++) {
      const weapons = rollChest(rng, 3, budget).filter((k) => k.kind === 'weapon').map((k) => (k as { weapon: string }).weapon);
      expect(new Set(weapons).size).toBe(weapons.length);
    }
    const avg = (tier: number) => { let s = 0; for (let i = 0; i < 600; i++) { const w = rollWeapon(rng, tier, budget); if (w.kind === 'weapon') s += w.rarity; } return s / 600; };
    expect(avg(4)).toBeGreaterThan(avg(1) + 0.8);
  });

  it('guarantees a weapon from weapon-biased floor sockets', () => {
    const rng = new Rng(3);
    for (let i = 0; i < 100; i++) expect(rollFloor(rng, 1, true, { prototypes: 0 }).some((k) => k.kind === 'weapon')).toBe(true);
  });
});
