import { describe, it, expect } from 'vitest';
import { testMatch, place, steps } from './helpers';
import { buildSnapshot } from '../src/sim/snapshot';
import { BRUSHES } from '../src/shared/map';
import { K } from '../src/protocol/messages';
import { dealDamage } from '../src/sim/combat';

const inSnap = (m: any, team: 0 | 1, id: number) => buildSnapshot(m, team, team === 0 ? 0 : 1, 0).ents.some((e) => e.id === id);

describe('fog of war, brush and wards', () => {
  it('enemy heroes in fog are not serialized for the opposing team', () => {
    const { m, hero } = testMatch([{ hero: 'suri', team: 0 }, { hero: 'kesh', team: 1 }]);
    place(hero(0), -60, 0); place(hero(1), 40, 30);
    steps(m, 4);
    const snap = buildSnapshot(m, 0, 0, 0);
    expect(snap.ents.some((e) => e.id === hero(1).id)).toBe(false);
    // no hidden transforms anywhere in the payload
    expect(JSON.stringify(snap)).not.toContain(`"id":${hero(1).id},`);
    // own team always sees itself
    expect(snap.ents.some((e) => e.id === hero(0).id)).toBe(true);
  });
  it('enemies inside visible range are serialized; leaving vision hides them after the 100 ms grace', () => {
    const { m, hero } = testMatch([{ hero: 'suri', team: 0 }, { hero: 'kesh', team: 1 }]);
    place(hero(0), 0, -47); place(hero(1), 6, -47);
    steps(m, 4);
    expect(inSnap(m, 0, hero(1).id)).toBe(true);
    place(hero(1), 40, 30);
    steps(m, 1);
    expect(inSnap(m, 0, hero(1).id)).toBe(true); // grace
    steps(m, 5);
    expect(inSnap(m, 0, hero(1).id)).toBe(false);
  });
  it('mistwood blocks line of sight', () => {
    const { m, hero } = testMatch([{ hero: 'suri', team: 0 }, { hero: 'kesh', team: 1 }]);
    // jungle path near north buff vs lane on the other side of forest
    place(hero(0), -36, -22); place(hero(1), -28, -42);
    steps(m, 4);
    const d = Math.hypot(-36 + 28, -22 + 42);
    expect(d).toBeLessThan(22);
    expect(m.fogVisible(0, -28, -42) && d < 11).toBe(false);
  });
  it('brush hides units unless the observer has a unit in the same brush or a ward', () => {
    const b = BRUSHES[0];
    const { m, cmd, hero } = testMatch([{ hero: 'suri', team: 0 }, { hero: 'kesh', team: 1 }]);
    place(hero(1), b.x, b.y);
    place(hero(0), b.x - 6, b.y - 1);
    steps(m, 4);
    expect(m.fogVisible(0, b.x, b.y)).toBe(true);
    expect(inSnap(m, 0, hero(1).id)).toBe(false);
    // ward into the brush reveals it
    cmd(0, { t: 'ward', x: b.x - 0.8, y: b.y });
    steps(m, 4);
    expect(inSnap(m, 0, hero(1).id)).toBe(true);
  });
  it('attacking from brush briefly reveals the attacker', () => {
    const b = BRUSHES[0];
    const { m, hero } = testMatch([{ hero: 'suri', team: 0 }, { hero: 'kesh', team: 1 }]);
    place(hero(1), b.x, b.y); place(hero(0), b.x - 5, b.y);
    steps(m, 4);
    expect(inSnap(m, 0, hero(1).id)).toBe(false);
    dealDamage(m, hero(1), hero(0), 5, 'physical', { kind: 'attack', source: 't' });
    steps(m, 2);
    expect(inSnap(m, 0, hero(1).id)).toBe(true);
  });
  it('enemy wards are stealthed unless an enemy hero is close (true sight); Cut the Light disables wards', () => {
    const { m, cmd, hero } = testMatch([{ hero: 'suri', team: 0 }, { hero: 'vey', team: 1 }]);
    place(hero(0), 0, -46);
    cmd(0, { t: 'ward', x: 3, y: -46 });
    const w = m.units.find((u) => u.kind === 'ward')!;
    place(hero(1), 11, -46);
    steps(m, 4);
    expect(inSnap(m, 1, w.id)).toBe(false);
    place(hero(1), 6, -46);
    steps(m, 4);
    expect(inSnap(m, 1, w.id)).toBe(true);
    // Vey E disables it
    const v = hero(1);
    v.hero!.ranks[2] = 1; v.mana = 200;
    cmd(1, { t: 'cast', slot: 2, x: 3, y: -46 });
    steps(m, 8);
    expect(w.ward!.disabledUntil).toBeGreaterThan(m.time);
  });
  it('events about hidden units are filtered by team', () => {
    const { m, hero } = testMatch([{ hero: 'suri', team: 0 }, { hero: 'kesh', team: 1 }, { hero: 'oru', team: 1 }]);
    place(hero(0), -60, 0); place(hero(1), 40, 30); place(hero(2), 41, 30);
    steps(m, 4);
    const since = m.tick;
    dealDamage(m, hero(1), hero(2), 1, 'pure', { kind: 'attack', source: 't' });
    expect(m.eventsFor(0, 0, since).some((e) => e.e === 'dmg')).toBe(false);
    expect(m.eventsFor(1, 1, since).some((e) => e.e === 'dmg')).toBe(true);
  });
  it('decoys look like heroes to enemies but not to allies', () => {
    const { m, cmd, hero } = testMatch([{ hero: 'suri', team: 0 }, { hero: 'vey', team: 1 }]);
    const v = hero(1);
    place(v, 2, -47); place(hero(0), -4, -47);
    v.hero!.ranks[1] = 1; v.mana = 200;
    cmd(1, { t: 'cast', slot: 1, x: 10, y: -47 });
    steps(m, 6);
    const d = m.units.find((u) => u.kind === 'decoy')!;
    expect(buildSnapshot(m, 0, 0, 0).ents.find((e) => e.id === d.id)?.k).toBe(K.Hero);
    expect(buildSnapshot(m, 1, 1, 0).ents.find((e) => e.id === d.id)?.k).toBe(K.Decoy);
  });
});
