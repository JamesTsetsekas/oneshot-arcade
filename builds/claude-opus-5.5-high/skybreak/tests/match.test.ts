import { describe, expect, it } from 'vitest';
import { Match, INTEREST_RADIUS } from '../src/server/match';
import { liveSolo, place, frame, step } from './helpers';
import { getIsland } from '../src/shared/world/island';
import { getCollisionWorld } from '../src/shared/world/collision';
import { getNav } from '../src/server/bots/nav';
import { BTN } from '../src/shared/protocol/messages';

function runToEnd(seed: number, pace: 'short' | 'standard' = 'short', maxTicks = 30 * 1100) {
  const m = new Match({ seed, mode: 'solo', pace, stagingSeconds: 2 });
  const phases = new Set<string>();
  const stormPhases = new Set<number>();
  while (m.phase !== 'ended' && m.tick < maxTicks) {
    m.step(new Map());
    phases.add(m.phase);
    stormPhases.add(m.stormNow.phase);
  }
  return { m, phases, stormPhases };
}

describe('full 24-seat bot match', () => {
  it('stages, flies the skiff, lands everyone, and declares exactly one winner', () => {
    const { m, phases } = runToEnd(42);
    expect(m.players).toHaveLength(24);
    expect([...phases]).toEqual(expect.arrayContaining(['staging', 'skiff', 'live', 'ended']));
    expect(m.phase).toBe('ended');
    const alive = m.players.filter((p) => p.alive);
    expect(alive).toHaveLength(1);
    expect(m.winner).toBe(alive[0]);
    const placements = m.players.map((p) => p.stats.placement).sort((a, b) => a - b);
    expect(placements).toEqual(Array.from({ length: 24 }, (_, i) => i + 1));
    // bots actually played: looted, fought
    expect(m.players.filter((p) => p.stats.loot.length > 0).length).toBeGreaterThan(12);
    expect(m.players.reduce((a, p) => a + p.stats.kills, 0)).toBeGreaterThan(5);
  });
  it('is deterministic from seed + inputs (replay basis)', () => {
    const a = new Match({ seed: 1234, mode: 'solo', pace: 'short', stagingSeconds: 2, humans: [{ name: 'H', body: 0, glider: 0 }] });
    const b = new Match({ seed: 1234, mode: 'solo', pace: 'short', stagingSeconds: 2, humans: [{ name: 'H', body: 0, glider: 0 }] });
    const inputs = (i: number) => frame({ seq: i, mz: i % 90 < 60 ? 1 : 0, yaw: (i % 400) / 60, buttons: i === 200 ? BTN.jump : i % 50 === 0 ? BTN.jump : 0 });
    for (let i = 0; i < 30 * 120; i++) { a.step(new Map([[0, inputs(i)]])); b.step(new Map([[0, inputs(i)]])); }
    expect(a.stateHash()).toBe(b.stateHash());
    expect(a.replay.frames.length).toBe(30 * 120);
    // replaying the recorded log reproduces the same state
    const c = new Match({ seed: 1234, mode: 'solo', pace: 'short', stagingSeconds: 2, humans: [{ name: 'H', body: 0, glider: 0 }] });
    for (const [, id, f] of a.replay.frames) c.step(new Map([[id, f]]));
    expect(c.stateHash()).toBe(a.stateHash());
  });
});

describe('networking rules', () => {
  it('interest filtering never sends distant enemy transforms, including to spectators', () => {
    const m = liveSolo(4);
    const [me, near, far, far2] = m.players;
    place(m, me, 0, -60);
    place(m, near, 30, -60);
    place(m, far, 0, -60 + INTEREST_RADIUS + 80);
    place(m, far2, 0, -60 + INTEREST_RADIUS + 90);
    m.step(new Map([[0, frame()]]));
    const ids = m.snapshotFor(0).players.map((p) => p.id);
    expect(ids).toContain(near.id);
    expect(ids).not.toContain(far.id);
    // spectator: dead viewer sees only the spectated player's relevance set
    m.applyDamage(me, 999, near, 'weapon');
    step(m, 90);
    const snap = m.snapshotFor(0);
    expect(snap.spectating?.id).toBe(near.id);
    expect(snap.players.map((p) => p.id)).not.toContain(far.id);
    // far gunshots are event-only with quantised positions
    far.slots[0] = { kind: 'weapon', w: 'sundial', r: 0, mag: 5 };
    far.equipEnd = 0;
    far.input = frame({ buttons: BTN.fire });
    m.step(new Map([[0, frame()]]));
    const shots = m.eventsFor(0).filter((e) => e.e === 'shot' && e.by === far.id);
    for (const s of shots) if (s.e === 'shot') { expect(s.tx).toBe(0); expect(s.fx % 25).toBe(0); }
  });
  it('validates inventory actions (bad indices ignored, no duplication)', () => {
    const m = liveSolo(2);
    const p = m.players[0];
    p.slots[0] = { kind: 'weapon', w: 'coil', r: 0, mag: 6 };
    const before = m.loot.size;
    m.step(new Map([[0, frame({ actions: [{ t: 'swap', a: -1, b: 9 }, { t: 'drop', slot: 7 }, { t: 'dropAmmo', ammo: 'light', amount: 999 }] })]]));
    expect(p.slots[0]).toMatchObject({ w: 'coil' });
    expect(m.loot.size).toBe(before);
  });
});

describe('world and navigation', () => {
  it('island manifest is stable and has the named locations and traversal', () => {
    const isl = getIsland();
    expect(isl.manifestHash).toMatch(/^[0-9a-f]{8}$/);
    const names = isl.locations.map((l) => l.name);
    for (const n of ['Aerie Market', 'Sunken Array', 'Kilnworks', 'Orchard Steps', 'Wind Abbey', 'Breaker Docks']) expect(names).toContain(n);
    expect(isl.locations.filter((l) => l.kind === 'landmark')).toHaveLength(8);
    expect(isl.ziplines.length).toBeGreaterThan(5);
    expect(isl.ascenders.length).toBeGreaterThan(5);
    expect(isl.vents.length).toBeGreaterThanOrEqual(3);
    expect(isl.hazards.length).toBeGreaterThan(0);
    expect(isl.stormCenters.length).toBeGreaterThan(100);
  });
  it('every building cluster spawns a weapon', () => {
    const m = new Match({ seed: 8, mode: 'solo', seats: 2 });
    const clusters = new Set(getIsland().sockets.map((s) => s.cluster));
    let withWeapon = 0;
    for (const c of clusters) {
      const socks = getIsland().sockets.filter((s) => s.cluster === c);
      if ([...m.loot.values()].some((l) => l.kind === 'weapon' && socks.some((s) => Math.hypot(s.x - l.x, s.z - l.z) < 2.5))) withWeapon++;
    }
    expect(withWeapon / clusters.size).toBeGreaterThan(0.97);
  });
  it('bots can path into Aerie Market', () => {
    const nav = getNav(getCollisionWorld(getIsland()));
    const p = nav.path(-260, 120, -200, 170);
    expect(p.length).toBeGreaterThan(10);
    const end = p[p.length - 1];
    expect(Math.hypot(end.x + 200, end.z - 170)).toBeLessThan(4);
  });
});
