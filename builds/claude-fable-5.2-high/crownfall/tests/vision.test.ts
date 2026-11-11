import { describe, expect, it } from 'vitest';
import { RULES } from '../src/shared/units';
import { GameServer } from '../src/sim/server';
import { buildSnapshot } from '../src/sim/view';
import { cmd, fixture, place, seat, step, stepSecs } from './helpers';

// Brush on the upper lane's outer edge, outside either team's tower true sight.
const BRUSH = { x: 65.5, y: 100.9 };

describe('fog of war (server-side)', () => {
  it('hides units beyond sight range and behind walls', () => {
    const { w, h } = fixture([
      ['suri', 0],
      ['vey', 1],
    ]);
    const [a, e] = h;
    place(w, a, 70, 98);
    place(w, e, 76, 98);
    step(w, 3);
    expect(e.visUntil[0]).toBeGreaterThanOrEqual(w.tick);
    place(w, e, 70 + RULES.heroVision + 2, 97.5);
    step(w, 9);
    expect(e.visUntil[0]).toBeLessThan(w.tick);
    // close, but with the mistwood between them
    place(w, a, 63.3, 61.5);
    place(w, e, 57, 67);
    step(w, 9);
    expect(Math.hypot(a.x - e.x, a.y - e.y)).toBeLessThan(RULES.heroVision);
    expect(e.visUntil[0]).toBeLessThan(w.tick);
    expect(a.visUntil[1]).toBeLessThan(w.tick);
  });

  it('brush hides from outside, reveals when shared, and wards see into their own brush', () => {
    const { w, h } = fixture([
      ['suri', 0],
      ['vey', 1],
    ]);
    const [a, e] = h;
    place(w, a, 60, 97);
    place(w, e, BRUSH.x, BRUSH.y);
    step(w, 9);
    expect(e.brush).toBeGreaterThanOrEqual(0);
    expect(e.visUntil[0]).toBeLessThan(w.tick); // hidden in brush
    expect(a.visUntil[1]).toBeGreaterThanOrEqual(w.tick); // but it sees out
    place(w, a, BRUSH.x - 2.5, BRUSH.y);
    step(w, 4);
    expect(a.brush).toBe(e.brush);
    expect(e.visUntil[0]).toBeGreaterThanOrEqual(w.tick); // same brush: revealed
    place(w, a, 60, 97);
    step(w, 9);
    expect(e.visUntil[0]).toBeLessThan(w.tick);
    expect(cmd(w, a, { t: 'ward', x: BRUSH.x - 1.5, y: BRUSH.y })).toBeNull();
    step(w, 4);
    expect(e.visUntil[0]).toBeGreaterThanOrEqual(w.tick); // ward in the brush reveals it
  });

  it('has a short enter/exit grace so brush edges do not flicker', () => {
    const { w, h } = fixture([
      ['suri', 0],
      ['vey', 1],
    ]);
    const [a, e] = h;
    place(w, a, 70, 98);
    place(w, e, 76, 98);
    step(w, 3);
    e.x = 120; // vanishes without a vision refresh
    e.y = 57;
    step(w, 2);
    expect(e.visUntil[0]).toBeGreaterThanOrEqual(w.tick); // still within the 100 ms grace
    step(w, 8);
    expect(e.visUntil[0]).toBeLessThan(w.tick);
  });

  it('wards last 90 s, hold two charges, are invisible without true sight, and respect the team cap', () => {
    const { w, h } = fixture([
      ['suri', 0],
      ['oru', 0],
      ['kesh', 0],
      ['vey', 1],
    ]);
    const [a, b, c, e] = h;
    place(w, a, 70, 98);
    place(w, e, 73, 98);
    expect(cmd(w, a, { t: 'ward', x: 72, y: 99 })).toBeNull();
    expect(cmd(w, a, { t: 'ward', x: 72, y: 96 })).toBeNull();
    expect(cmd(w, a, { t: 'ward', x: 71, y: 98 })).not.toBeNull(); // out of charges
    const wards = w.units.filter((u) => u.kind === 'ward');
    expect(wards).toHaveLength(2);
    step(w, 6);
    expect(wards[0].visUntil[1]).toBeLessThan(w.tick); // enemy hero standing next to it cannot see it
    place(w, b, 70, 97);
    place(w, c, 70, 99);
    for (const u of [b, c]) {
      cmd(w, u, { t: 'ward', x: u.x + 1, y: u.y });
      cmd(w, u, { t: 'ward', x: u.x - 1, y: u.y });
    }
    step(w, 2);
    expect(w.units.filter((u) => u.kind === 'ward' && u.alive)).toHaveLength(RULES.wardCapPerTeam);
    stepSecs(w, RULES.wardDuration + 1);
    expect(w.units.filter((u) => u.kind === 'ward' && u.alive)).toHaveLength(0);
    expect(a.hero!.wardCharges).toBe(1); // one charge back after 55 s...
    stepSecs(w, RULES.wardRecharge);
    expect(a.hero!.wardCharges).toBe(RULES.wardCharges); // ...and the second after 110 s
  }, 30000);

  it('never serialises hidden enemy transforms into a team snapshot', () => {
    const { w, h } = fixture([
      ['suri', 0],
      ['vey', 1],
      ['kesh', 1],
    ]);
    const [a, hidden, seen] = h;
    place(w, a, 60, 97);
    place(w, hidden, BRUSH.x, BRUSH.y);
    place(w, seen, 64, 97);
    step(w, 9);
    const snap = buildSnapshot(w, 0, a.id, [], false, 1);
    const ids = snap.units.map((u) => u.id);
    expect(ids).toContain(a.id);
    expect(ids).toContain(seen.id);
    expect(ids).not.toContain(hidden.id);
    const pub = snap.heroes.find((x) => x.id === hidden.id)!;
    expect(pub.visible).toBe(false);
    expect(pub.hpPct).toBe(-1);
    // the public summary only carries the last *seen* position, never the live one
    expect(Math.hypot(pub.x - hidden.x, pub.y - hidden.y)).toBeGreaterThan(5);
    const json = JSON.stringify(snap);
    expect(json.includes(`"x":${Math.round(hidden.x * 100) / 100},"y":${Math.round(hidden.y * 100) / 100}`)).toBe(false);
    // structures are public knowledge for both teams
    expect(snap.units.filter((u) => u.k === 'tower')).toHaveLength(12);
    // the enemy team's own snapshot does contain it
    expect(buildSnapshot(w, 1, hidden.id, [], false, 1).units.map((u) => u.id)).toContain(hidden.id);
  });

  it('filters positional events by sight and keeps private events private', () => {
    const { w, h } = fixture([
      ['suri', 0],
      ['vey', 1],
    ]);
    const [a, e] = h;
    place(w, a, 30, 60);
    place(w, e, 110, 98);
    step(w, 4);
    w.events = [];
    w.fxAt('burst', 110, 98, {});
    w.emitHero({ e: 'reject', reason: 'secret' }, e.id);
    w.announce('global', 'x', 2);
    const ev = w.events.slice();
    const s0 = buildSnapshot(w, 0, a.id, ev, false, 1);
    const s1 = buildSnapshot(w, 1, e.id, ev, false, 1);
    expect(s0.events.map((x) => x.e)).toEqual(['announce']);
    expect(s1.events.map((x) => x.e).sort()).toEqual(['announce', 'fx', 'reject']);
  });
});

describe('authoritative server / protocol', () => {
  const config = () => ({ seed: 3, mode: 'unranked' as const, difficulty: 'normal' as const, pace: 'quick' as const, humanSeat: 0, seats: [seat('suri', 0, false, 'You'), seat('brannoch', 0), seat('kesh', 0), seat('ilyra', 1), seat('oru', 1), seat('vey', 1)] });

  it('applies sequenced commands in order and drops duplicates / stale sequence numbers', () => {
    const s = new GameServer(config());
    const hero = s.world.byId.get(s.humanId)!;
    s.command(1, { t: 'buy', item: 'couriers_satchel' });
    s.command(1, { t: 'buy', item: 'amber_draught' }); // duplicate seq: ignored
    s.command(0, { t: 'buy', item: 'amber_draught' }); // stale: ignored
    expect(hero.hero!.inv.filter(Boolean)).toHaveLength(1);
    s.command(2, { t: 'buy', item: 'amber_draught' });
    expect(hero.hero!.inv.filter(Boolean)).toHaveLength(2);
    expect(hero.hero!.gold).toBe(50);
  });

  it('rate-limits command floods and never lets a client set gold, damage or position', () => {
    const s = new GameServer(config());
    const hero = s.world.byId.get(s.humanId)!;
    const x0 = hero.x;
    for (let i = 1; i <= 500; i++) s.command(i, { t: 'move', x: 140, y: 57 });
    s.step();
    expect(Math.abs(hero.x - x0)).toBeLessThan(0.5); // one tick of walking, not a teleport
    // cheats are only honoured in practice mode
    s.command(1000, { t: 'cheat', kind: 'gold' });
    expect(hero.hero!.gold).toBeLessThanOrEqual(RULES.startGold);
    for (let i = 0; i < 40; i++) s.step();
    expect(hero.hero!.gold).toBeLessThan(RULES.startGold + 10);
  });

  it('produces team-filtered snapshots with the local hero view and public objective timers', () => {
    const s = new GameServer(config());
    for (let i = 0; i < 30; i++) s.step();
    const snap = s.snapshot();
    expect(snap.you?.id).toBe(s.humanId);
    expect(snap.you?.gold).toBeGreaterThanOrEqual(RULES.startGold);
    expect(snap.objectives.map((o) => o.id).sort()).toEqual(['catalystN', 'catalystS', 'colossus']);
    expect(snap.objectives.every((o) => !o.alive && o.next > 0)).toBe(true);
    expect(snap.units.filter((u) => u.k === 'hero' && u.t === 1)).toHaveLength(0); // enemies are far away in fog
    expect(snap.heroes).toHaveLength(6);
    expect(snap.vision.length % 3).toBe(0);
  });

  it('pausing freezes the simulation', () => {
    const s = new GameServer(config());
    s.step();
    s.paused = true;
    const t = s.world.tick;
    for (let i = 0; i < 10; i++) s.step();
    expect(s.world.tick).toBe(t);
    expect(s.snapshot().paused).toBe(true);
  });
});
