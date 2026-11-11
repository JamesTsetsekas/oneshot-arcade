// Shared helpers for driving the authoritative simulation directly in tests.
import { RULES_FULL, TICK_RATE, type Ruleset } from '../src/content/rules';
import { getAnnex } from '../src/map/annex';
import { BTN, type InputCmd, type Side } from '../src/protocol/types';
import { Match } from '../src/sim/match';
import type { Player } from '../src/sim/state';

export const SEC = TICK_RATE;

export interface Rig {
  match: Match;
  inputs: (InputCmd | null)[];
  /** buttons/view each player holds until changed */
  hold: { buttons: number; yaw: number; pitch: number }[];
  step(n?: number): void;
  seconds(s: number): void;
  until(pred: () => boolean, maxSeconds?: number): boolean;
  side(side: Side): Player[];
  place(p: Player, x: number, z: number, yaw?: number, y?: number): void;
  toLive(): void;
}

/** A 5v5 match with no bots: every seat is driven explicitly by the test. Team 0 attacks first. */
export function makeRig(rules: Partial<Ruleset> = {}, seed = 7, perTeam = 5): Rig {
  const players = [];
  for (let t = 0; t < 2; t++) for (let i = 0; i < perTeam; i++) players.push({ name: `P${t}${i}`, team: t, bot: false });
  const match = new Match({ map: getAnnex(), rules: { ...RULES_FULL, ...rules }, seed, players, firstAtkTeam: 0 });
  const hold = players.map(() => ({ buttons: 0, yaw: 0, pitch: 0 }));
  const inputs: (InputCmd | null)[] = [];
  let seq = 0;
  const rig: Rig = {
    match,
    inputs,
    hold,
    step(n = 1) {
      for (let k = 0; k < n; k++) {
        seq++;
        for (let i = 0; i < players.length; i++) inputs[i] = { seq, buttons: hold[i].buttons, yaw: hold[i].yaw, pitch: hold[i].pitch, renderTick: match.tick };
        match.step(inputs);
        match.events.length = 0;
      }
    },
    seconds(s) {
      rig.step(Math.round(s * SEC));
    },
    until(pred, maxSeconds = 200) {
      for (let i = 0; i < maxSeconds * SEC; i++) {
        if (pred()) return true;
        rig.step();
      }
      return pred();
    },
    side(side) {
      return match.players.filter((p) => match.sideOf(p) === side);
    },
    place(p, x, z, yaw = 0, y = 0) {
      p.move.x = x;
      p.move.z = z;
      p.move.y = y;
      p.move.vx = p.move.vy = p.move.vz = 0;
      p.move.onGround = true;
      hold[p.id].yaw = yaw;
      hold[p.id].pitch = 0;
      p.yaw = yaw;
      p.pitch = 0;
    },
    toLive() {
      rig.until(() => match.phase === 'buy', 30);
      rig.until(() => match.phase === 'live', 60);
    },
  };
  return rig;
}

/** Collects events of one kind emitted while `fn` runs (the rig normally discards them every tick). */
export function captureEvents<T extends { t: string }>(rig: Rig, ticks: number, kind: string): T[] {
  const out: T[] = [];
  let seq = 100000;
  for (let k = 0; k < ticks; k++) {
    seq++;
    for (let i = 0; i < rig.hold.length; i++) rig.inputs[i] = { seq, buttons: rig.hold[i].buttons, yaw: rig.hold[i].yaw, pitch: rig.hold[i].pitch, renderTick: rig.match.tick };
    rig.match.step(rig.inputs);
    for (const q of rig.match.events) if (q.ev.t === kind) out.push(q.ev as unknown as T);
    rig.match.events.length = 0;
  }
  return out;
}

export { BTN };
