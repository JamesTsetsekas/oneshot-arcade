import { describe, expect, it } from 'vitest';
import { Match } from '../src/sim/match';
interface BrainView { target: Player | null; state: string }
import type { Player } from '../src/sim/types';

/** A quick match where everybody except two bots is removed so perception can be tested in isolation. */
function duel(): { m: Match; a: Player; b: Player; brainA: BrainView } {
  const m = new Match({ seed: 77, mode: 'quick', noHuman: true, skipStaging: true });
  for (let i = 0; i < 30 * 70; i++) m.step();
  const alive = m.players.filter((p) => p.alive);
  const [a, b] = alive;
  for (const p of alive.slice(2)) { p.alive = false; p.mode = 'dead'; }
  for (const p of [a, b]) {
    p.mode = 'ground'; p.onGround = true; p.health = 100; p.aegis = 50;
    p.slots[0] = { kind: 'weapon', weapon: 'wayfarer', rarity: 1, mag: 30 }; p.selected = 0; p.ammo.light = 120;
  }
  const brainA = m.brains.get(a.id) as unknown as BrainView;
  return { m, a, b, brainA };
}

function place(m: Match, p: Player, x: number, z: number): void {
  p.x = x; p.z = z; p.y = m.world.heightAt(x, z); p.vx = p.vz = 0; p.mode = 'ground'; p.onGround = true;
}

describe('server bots: legal perception only', () => {
  it('cannot see an opponent behind a building wall, and sees them once there is a clear line', () => {
    const { m, a, b, brainA } = duel();
    // choose a building on flat ground and put the bots on opposite sides of it
    const bd = m.world.buildings.find((x) => x.loc === 'orchard' || x.loc === 'huts') ?? m.world.buildings[0];
    place(m, a, bd.x - bd.w / 2 - 14, bd.z);
    place(m, b, bd.x + bd.w / 2 + 14, bd.z);
    a.yaw = Math.PI / 2; brainA.target = null;
    // face east so the building would be inside the view cone
    for (let i = 0; i < 30 * 3; i++) {
      place(m, a, bd.x - bd.w / 2 - 14, bd.z); place(m, b, bd.x + bd.w / 2 + 14, bd.z);
      m.step();
      expect(brainA.target).toBeNull();
    }
    // now an open sightline 40 m to the side of the building
    place(m, b, bd.x - bd.w / 2 - 14 - 1, bd.z - bd.d / 2 - 30);
    let saw = false;
    for (let i = 0; i < 30 * 6 && !saw; i++) {
      place(m, a, bd.x - bd.w / 2 - 14, bd.z);
      m.step();
      if (brainA.target === b) saw = true;
    }
    expect(saw).toBe(true);
  });

  it('is blinded by a mist cloud between the combatants', () => {
    const { m, a, b, brainA } = duel();
    const x = 0, z = 0;
    brainA.target = null; (brainA as unknown as { lastSeen: unknown }).lastSeen = null;
    place(m, a, x - 20, z); place(m, b, x + 20, z);
    m.smokes.push({ id: 9999, x, y: m.world.heightAt(x, z), z, r: 5.5, t: 0, life: 60 });
    for (let i = 0; i < 30 * 3; i++) {
      place(m, a, x - 20, z); place(m, b, x + 20, z); a.yaw = Math.PI / 2;
      m.step();
      expect(brainA.target).toBeNull();
    }
    m.smokes.length = 0;
    let saw = false;
    for (let i = 0; i < 30 * 4 && !saw; i++) {
      place(m, a, x - 20, z); place(m, b, x + 20, z); a.yaw = Math.PI / 2;
      m.step();
      if (brainA.target === b) saw = true;
    }
    expect(saw).toBe(true);
  });

  it('engages a visible opponent with limited accuracy (they miss and hit)', () => {
    const { m, a, b } = duel();
    place(m, a, -30, 0); place(m, b, 0, 0);
    b.health = 10000; b.aegis = 0; // keep alive to count shots
    for (let i = 0; i < 30 * 12; i++) {
      place(m, b, 0, 0);
      m.step();
    }
    expect(a.stats.shots).toBeGreaterThan(8);
    expect(a.stats.hits).toBeGreaterThan(0);
    expect(a.stats.hits).toBeLessThan(a.stats.shots); // not a perfect aimbot
  });

  it('chooses a legal drop target and jumps from the skiff only over the island', () => {
    const m = new Match({ seed: 123, mode: 'quick', noHuman: true, skipStaging: true });
    const jumpPositions: number[] = [];
    let prev = new Set<number>();
    for (let i = 0; i < 30 * 45; i++) {
      m.step();
      const jumped = new Set(m.players.filter((p) => p.mode !== 'skiff' && p.jumpAt > 0).map((p) => p.id));
      for (const id of jumped) if (!prev.has(id)) jumpPositions.push(Math.hypot(m.players[id].x, m.players[id].z));
      prev = jumped;
    }
    expect(jumpPositions.length).toBe(24);
    for (const d of jumpPositions) expect(d).toBeLessThan(720);
  });
});
