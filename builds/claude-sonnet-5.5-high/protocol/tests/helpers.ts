import { RULESETS } from '../src/content/economy';
import { Match, newMatch, TICK_RATE } from '../src/sim/match';
import type { InputCmd, Player } from '../src/sim/types';

export function mk(opts: Parameters<typeof newMatch>[0] = {}): Match {
  return newMatch({ seed: 7, rules: RULESETS.quick, humanIds: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], squad0Side: 'int', ...opts });
}

export function advance(m: Match, seconds: number): void {
  const n = Math.round(seconds * TICK_RATE);
  for (let i = 0; i < n; i++) m.step();
}

export function toLive(m: Match): void {
  let guard = 0;
  while (m.phase !== 'live' && guard++ < TICK_RATE * 60) m.step();
}

export function place(p: Player, x: number, z: number, y = 0): void {
  p.pos = { x, y, z };
  p.vel = { x: 0, y: 0, z: 0 };
}

export function cmd(p: Player, extra: Partial<InputCmd> = {}): InputCmd {
  return { seq: p.lastSeq + 1 + p.cmdQueue.length, viewTick: 0, moveX: 0, moveZ: 0, yaw: p.yaw, pitch: p.pitch, fire: false, alt: false, jump: false, crouch: false, walk: false, use: false, ...extra };
}

/** Submit the same command for `seconds` of ticks and step the match. */
export function hold(m: Match, p: Player, extra: Partial<InputCmd>, seconds: number): void {
  const n = Math.round(seconds * TICK_RATE);
  for (let i = 0; i < n; i++) {
    m.submitInput(p.id, cmd(p, extra));
    m.step();
  }
}

export function sideOf(m: Match, side: 'int' | 'cus'): Player[] { return m.players.filter((p) => p.side === side); }
