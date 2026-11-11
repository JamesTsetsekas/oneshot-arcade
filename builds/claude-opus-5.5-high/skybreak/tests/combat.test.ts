import { describe, expect, it } from 'vitest';
import { practice, step, frame, liveSolo, place, addLoot } from './helpers';
import { BTN } from '../src/shared/protocol/messages';
import { fireHitscan, rayPlayers } from '../src/server/combat';
import { weaponStats, WEAPONS } from '../src/shared/content/weapons';
import { Rng } from '../src/shared/rng';

describe('shields and damage', () => {
  it('damage depletes Aegis, then Reserve, then Health', () => {
    const m = practice();
    const t = m.players[1];
    t.reserve = 30;
    m.applyDamage(t, 60, m.players[0], 'weapon');
    expect([t.aegis, t.reserve, t.health]).toEqual([0, 20, 100]);
    m.applyDamage(t, 30, m.players[0], 'weapon');
    expect([t.aegis, t.reserve, t.health]).toEqual([0, 0, 90]);
  });
  it('storm/fall/hazard damage bypasses shields', () => {
    const m = practice();
    const p = m.players[0];
    m.applyDamage(p, 10, null, 'storm');
    expect(p.health).toBe(90);
    expect(p.aegis).toBe(50);
  });
  it('Aegis recharges after 8s without damage at 10/s', () => {
    const m = practice();
    const p = m.players[0];
    m.applyDamage(p, 50, m.players[1], 'weapon');
    expect(p.aegis).toBe(0);
    step(m, 30 * 7.8);
    expect(p.aegis).toBe(0);
    step(m, 30 * 1.2);
    expect(p.aegis).toBeGreaterThan(5);
    expect(p.aegis).toBeLessThan(15);
  });
});

describe('weapons', () => {
  it('server owns fire cadence and ammo for automatic weapons', () => {
    const m = practice();
    const p = m.players[0];
    p.slots[0] = { kind: 'weapon', w: 'wayfarer', r: 0, mag: 30 };
    p.ammo.light = 60;
    step(m, 20); // equip
    step(m, 30, () => frame({ buttons: BTN.fire, yaw: Math.PI / 2 }));
    const fired = 30 - (p.slots[0] as { mag: number }).mag;
    expect(fired).toBeGreaterThanOrEqual(9);
    expect(fired).toBeLessThanOrEqual(10);
  });
  it('semi-auto weapons need a fresh trigger pull per shot', () => {
    const m = practice();
    const p = m.players[0];
    p.slots[0] = { kind: 'weapon', w: 'harbor', r: 0, mag: 15 };
    step(m, 20);
    step(m, 30, () => frame({ buttons: BTN.fire, yaw: Math.PI / 2 }));
    expect((p.slots[0] as { mag: number }).mag).toBe(14);
    step(m, 30, (i) => frame({ buttons: i % 6 < 3 ? BTN.fire : 0, yaw: Math.PI / 2 }));
    expect((p.slots[0] as { mag: number }).mag).toBeLessThanOrEqual(10);
  });
  it('reload consumes reserve ammo over server time', () => {
    const m = practice();
    const p = m.players[0];
    p.slots[0] = { kind: 'weapon', w: 'wayfarer', r: 0, mag: 5 };
    p.ammo.light = 10;
    step(m, 20);
    step(m, 1, () => frame({ buttons: BTN.reload }));
    step(m, 30);
    expect((p.slots[0] as { mag: number }).mag).toBe(5);
    step(m, 45);
    expect((p.slots[0] as { mag: number }).mag).toBe(15);
    expect(p.ammo.light).toBe(0);
  });
  it('hit zones: head, torso and limb hitboxes by stance', () => {
    const m = practice();
    const t = m.players[1];
    const o = { x: t.ms.x, y: t.ms.y + 1.62, z: t.ms.z - 10 };
    expect(rayPlayers(m.players, o, { x: 0, y: 0, z: 1 }, 50, 0)?.zone).toBe('head');
    expect(rayPlayers(m.players, { ...o, y: t.ms.y + 1.1 }, { x: 0, y: 0, z: 1 }, 50, 0)?.zone).toBe('torso');
    expect(rayPlayers(m.players, { ...o, y: t.ms.y + 0.4 }, { x: 0, y: 0, z: 1 }, 50, 0)?.zone).toBe('limb');
    t.ms.crouch = true;
    expect(rayPlayers(m.players, o, { x: 0, y: 0, z: 1 }, 50, 0)).toBeNull();
  });
  it('shotgun pellets use a seeded pattern with an aggregate damage cap', () => {
    const m = practice();
    const shooter = m.players[0], target = m.players[1];
    shooter.ms.x = target.ms.x; shooter.ms.z = target.ms.z - 3; shooter.ms.y = target.ms.y; shooter.ms.yaw = 0; shooter.ms.pitch = -0.02;
    const st = weaponStats('breakwater', 0);
    const rng = new Rng(4);
    for (let i = 0; i < 30; i++) {
      const r = fireHitscan(m.w, m.players, [], shooter, st, () => rng.next(), 3.1);
      const h = r.hits.find((x) => x.p === target);
      if (h) {
        expect(h.dmg).toBeLessThanOrEqual(WEAPONS.breakwater.pelletCapMax! * WEAPONS.breakwater.headMult + 1e-6);
        expect(h.dmg).toBeGreaterThanOrEqual(WEAPONS.breakwater.pelletCapMin! - 1e-6);
      }
    }
    // same seed => same pattern
    const a = fireHitscan(m.w, m.players, [], shooter, st, (() => { const q = new Rng(11); return () => q.next(); })(), 3.1);
    const b = fireHitscan(m.w, m.players, [], shooter, st, (() => { const q = new Rng(11); return () => q.next(); })(), 3.1);
    expect(a.end).toEqual(b.end);
  });
  it('Longwake Rail fires a travelling projectile after its charge', () => {
    const m = practice();
    const p = m.players[0];
    p.slots[0] = { kind: 'weapon', w: 'longwake', r: 0, mag: 5 };
    step(m, 30);
    step(m, 1, () => frame({ buttons: BTN.fire, yaw: Math.PI / 2 }));
    expect(m.projectiles.length).toBe(0); // charging
    step(m, 12);
    expect(m.projectiles.some((x) => x.kind === 'rail')).toBe(true);
  });
});

describe('eliminations', () => {
  it('attributes kills by 12s damage contribution, credits assists, drops an exact cache, declares a single winner', () => {
    const m = liveSolo(3);
    const [me, a, b] = m.players;
    place(m, me, 0, -60); place(m, a, 3, -60); place(m, b, 6, -60);
    a.slots[0] = { kind: 'weapon', w: 'sundial', r: 2, mag: 7 };
    a.ammo.heavy = 33;
    m.applyDamage(a, 60, b, 'weapon');
    m.applyDamage(a, 200, me, 'weapon');
    expect(a.alive).toBe(false);
    expect(me.stats.kills).toBe(1);
    expect(b.stats.assists).toBe(1);
    const cache = m.containers.find((c) => c.kind === 'cache');
    expect(cache?.contents).toEqual([{ kind: 'weapon', w: 'sundial', r: 2, mag: 7 }, { kind: 'ammo', ammo: 'heavy', amount: 33 }]);
    // environmental elimination credits the recent attacker
    m.applyDamage(b, 20, me, 'weapon');
    m.applyDamage(b, 500, null, 'storm');
    expect(me.stats.kills).toBe(2);
    step(m, 1);
    expect(m.phase).toBe('ended');
    expect(m.winner).toBe(me);
    expect(m.resultFor(0).placement).toBe(1);
  });
  it('the staging pier is non-damaging', () => {
    const m = new (m0().constructor as typeof import('../src/server/match').Match)({ seed: 3, mode: 'solo', seats: 4, humans: [{ name: 'T', body: 0, glider: 0 }] });
    expect(m.phase).toBe('staging');
    m.applyDamage(m.players[1], 50, m.players[0], 'weapon');
    expect(m.players[1].aegis).toBe(50);
  });
});

function m0() { return practice(); }
void addLoot;
