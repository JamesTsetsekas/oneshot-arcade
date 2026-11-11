import { Match } from '../src/server/match';
import type { InputFrame } from '../src/shared/protocol/messages';
import type { LootRoll } from '../src/server/loot';
import type { Player } from '../src/server/types';

export const frame = (p: Partial<InputFrame> = {}): InputFrame => ({ seq: 0, mx: 0, mz: 0, yaw: 0, pitch: 0, buttons: 0, slot: 0, ...p });

export function step(m: Match, n: number, f: (i: number) => InputFrame = () => frame()) {
  for (let i = 0; i < n; i++) m.step(new Map([[0, f(i)]]));
}

export function practice() {
  return new Match({ seed: 99, mode: 'practice', humans: [{ name: 'Tester', body: 0, glider: 0 }] });
}

export function addLoot(m: Match, roll: LootRoll, x: number, y: number, z: number) {
  return (m as unknown as { addLoot: (r: LootRoll, x: number, y: number, z: number) => { id: number } }).addLoot(roll, x, y, z);
}

/** A live solo match with idle bots (brains removed) for deterministic rule tests. */
export function liveSolo(seats = 3, seed = 5) {
  const m = new Match({ seed, mode: 'solo', pace: 'short', seats, humans: [{ name: 'Tester', body: 0, glider: 0 }], stagingSeconds: 0.1 });
  for (const p of m.players) p.bot = null;
  let guard = 0;
  while (m.phase !== 'live' && guard++ < 30 * 120) m.step(new Map([[0, frame()]]));
  // let everyone land
  guard = 0;
  while (m.players.some((p) => p.ms.mode === 'freefall' || p.ms.mode === 'glide') && guard++ < 30 * 90) m.step(new Map([[0, frame()]]));
  return m;
}

export function place(m: Match, p: Player, x: number, z: number) {
  p.ms.x = x; p.ms.z = z;
  p.ms.y = m.w.support(x, z, 0.35, 500);
  p.ms.mode = 'ground'; p.ms.vx = p.ms.vy = p.ms.vz = 0;
}
