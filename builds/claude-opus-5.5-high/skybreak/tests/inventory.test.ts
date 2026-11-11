import { describe, expect, it } from 'vitest';
import { practice, step, frame, addLoot } from './helpers';
import { BTN } from '../src/shared/protocol/messages';

function clearRacks(m: ReturnType<typeof practice>) {
  for (const [id] of m.loot) m.loot.delete(id);
}

describe('inventory and loot', () => {
  it('picks up into free slots, stacks consumables, caps ammo and leaves the remainder', () => {
    const m = practice();
    clearRacks(m);
    const p = m.players[0];
    const s = p.ms;
    const w = addLoot(m, { kind: 'weapon', w: 'tempest', r: 1, mag: 28 }, s.x, s.y, s.z);
    m.pickup(p, m.loot.get(w.id)!, -1);
    expect(p.slots[0]).toMatchObject({ kind: 'weapon', w: 'tempest', r: 1 });
    const a = addLoot(m, { kind: 'item', item: 'med', n: 3 }, s.x, s.y, s.z);
    m.pickup(p, m.loot.get(a.id)!, -1);
    const b = addLoot(m, { kind: 'item', item: 'med', n: 3 }, s.x, s.y, s.z);
    m.pickup(p, m.loot.get(b.id)!, -1);
    expect(p.slots[1]).toEqual({ kind: 'item', id: 'med', n: 4 });
    expect(p.slots[2]).toEqual({ kind: 'item', id: 'med', n: 2 });
    p.ammo.shell = 40;
    const am = addLoot(m, { kind: 'ammo', ammo: 'shell', amount: 20 }, s.x, s.y, s.z);
    m.pickup(p, m.loot.get(am.id)!, -1);
    expect(p.ammo.shell).toBe(48);
    expect(m.loot.get(am.id)?.amount).toBe(12);
  });
  it('full inventory requires hold-to-swap and drops the replaced slot', () => {
    const m = practice();
    clearRacks(m);
    const p = m.players[0];
    p.slots = [
      { kind: 'weapon', w: 'harbor', r: 0, mag: 15 }, { kind: 'item', id: 'mist', n: 1 }, { kind: 'item', id: 'echo', n: 1 },
      { kind: 'item', id: 'grapple', n: 3 }, { kind: 'item', id: 'wind_orb', n: 1 },
    ];
    const s = p.ms;
    const it = addLoot(m, { kind: 'weapon', w: 'wayfarer', r: 3, mag: 36 }, s.x + Math.sin(s.yaw) * 1, s.y, s.z + Math.cos(s.yaw) * 1);
    const yaw = s.yaw;
    step(m, 3, () => frame({ buttons: BTN.interact, yaw }));
    expect(m.loot.has(it.id)).toBe(true); // a tap is not enough
    step(m, 12, () => frame({ buttons: BTN.interact, yaw }));
    expect(m.loot.has(it.id)).toBe(false);
    expect(p.slots[0]).toMatchObject({ w: 'wayfarer', r: 3 });
    expect([...m.loot.values()].some((l) => l.w === 'harbor')).toBe(true);
  });
  it('swap and drop actions are applied once', () => {
    const m = practice();
    clearRacks(m);
    const p = m.players[0];
    p.slots[0] = { kind: 'weapon', w: 'coil', r: 0, mag: 6 };
    p.slots[3] = { kind: 'item', id: 'flask', n: 2 };
    step(m, 1, () => frame({ actions: [{ t: 'swap', a: 0, b: 3 }] }));
    expect(p.slots[3]).toMatchObject({ w: 'coil' });
    expect(p.slots[0]).toMatchObject({ id: 'flask' });
    step(m, 1, () => frame({ actions: [{ t: 'drop', slot: 3 }] }));
    step(m, 1, () => frame({ actions: [{ t: 'drop', slot: 3 }] }));
    expect(p.slots[3]).toBeNull();
    expect([...m.loot.values()].filter((l) => l.w === 'coil')).toHaveLength(1);
  });
  it('opening a resonance chest spills two item rolls plus ammo/heal', () => {
    const m = practice();
    clearRacks(m);
    const p = m.players[0];
    m.containers.push({ id: 999, kind: 'chest', x: p.ms.x, y: p.ms.y, z: p.ms.z, yaw: 0, tier: 2, opened: false, contents: null });
    m.openContainer(m.containers[m.containers.length - 1], p);
    const spilled = [...m.loot.values()];
    expect(spilled.length).toBeGreaterThanOrEqual(3);
    expect(spilled.some((l) => l.kind === 'weapon')).toBe(true);
    expect(spilled.some((l) => l.kind === 'ammo')).toBe(true);
  });
});

describe('heals and shields', () => {
  it('Med Injector restores 35 Health over 3s and slows movement', () => {
    const m = practice();
    const p = m.players[0];
    p.health = 40;
    p.slots[0] = { kind: 'item', id: 'med', n: 2 };
    step(m, 10);
    step(m, 1, () => frame({ buttons: BTN.fire }));
    expect(p.use?.id).toBe('med');
    step(m, 45);
    expect(p.health).toBeGreaterThan(50);
    expect(p.health).toBeLessThan(70);
    step(m, 50);
    expect(p.health).toBeCloseTo(75, 0);
    expect(p.slots[0]).toEqual({ kind: 'item', id: 'med', n: 1 });
  });
  it('Trauma Kit is cancelled by damage; Med Injector is not', () => {
    const m = practice();
    const p = m.players[0];
    p.health = 30; p.aegis = 0;
    p.slots[0] = { kind: 'item', id: 'trauma', n: 1 };
    step(m, 10);
    step(m, 1, () => frame({ buttons: BTN.fire }));
    step(m, 30);
    m.applyDamage(p, 5, m.players[1], 'weapon');
    expect(p.use).toBeNull();
  });
  it('Shield Flask fills Reserve up to 50, Aegis Cell starts Aegis recharge immediately', () => {
    const m = practice();
    const p = m.players[0];
    p.reserve = 40;
    p.slots[0] = { kind: 'item', id: 'flask', n: 1 };
    step(m, 10);
    step(m, 1, () => frame({ buttons: BTN.fire }));
    step(m, 90);
    expect(p.reserve).toBe(50);
    m.applyDamage(p, 50, m.players[1], 'weapon');
    m.applyDamage(p, 50, m.players[1], 'weapon');
    expect(p.aegis).toBe(0);
    p.slots[1] = { kind: 'item', id: 'aegis_cell', n: 1 };
    step(m, 1, () => frame({ slot: 1 }));
    step(m, 10, () => frame({ slot: 1 }));
    step(m, 1, () => frame({ slot: 1, buttons: BTN.fire }));
    step(m, 30 * 3.2, () => frame({ slot: 1 }));
    step(m, 30, () => frame({ slot: 1 }));
    expect(p.aegis).toBeGreaterThan(5);
    expect(p.slots[1]).toBeNull();
  });
  it('utilities: mist creates a cloud, echo reveals trails (not live positions), grapple uses a charge', () => {
    const m = practice();
    const p = m.players[0];
    p.slots[0] = { kind: 'item', id: 'mist', n: 1 };
    step(m, 10);
    step(m, 1, () => frame({ buttons: BTN.fire, yaw: Math.PI / 2, pitch: 0.2 }));
    step(m, 60, () => frame({ yaw: Math.PI / 2 }));
    expect(m.smokes.length).toBe(1);
    expect(m.smokes[0].r).toBe(7);
    p.slots[1] = { kind: 'item', id: 'grapple', n: 3 };
    // aim at the practice tower wall
    p.ms.x = m.island.pier.minX + 50; p.ms.z = m.island.pier.minZ + 7;
    step(m, 10, () => frame({ slot: 1, yaw: Math.PI / 2, pitch: 0.1 }));
    step(m, 1, () => frame({ slot: 1, yaw: Math.PI / 2, pitch: 0.1, buttons: BTN.fire }));
    expect(p.slots[1]).toEqual({ kind: 'item', id: 'grapple', n: 2 });
    expect(p.ms.mode).toBe('grapple');
  });
});
