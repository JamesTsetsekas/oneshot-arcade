import { ANNEX } from '../src/map/annex';
import { GameMap } from '../src/map/runtime';
import { NavGrid } from '../src/map/nav';
import { MatchRoom, type RoomOptions } from '../src/sim/room';
import { RULES_QUICK, TICK_RATE, type MatchRules } from '../src/content/rules';
import type { InputCmd } from '../src/protocol/messages';
import type { Player } from '../src/sim/state';

export const map = new GameMap(ANNEX);
export const nav = new NavGrid(map);

/** Two human seats (team 0 = Intrusion at start), optional bot fill. */
export function makeRoom(opts: Partial<RoomOptions> & { rules?: MatchRules } = {}): MatchRoom {
  return new MatchRoom({
    rules: opts.rules ?? RULES_QUICK,
    seed: opts.seed ?? 42,
    map,
    nav,
    humans: opts.humans ?? [
      { name: 'A', team: 0 },
      { name: 'B', team: 1 },
    ],
    teamSize: opts.teamSize ?? 1,
    botDifficulty: 0.5,
    ...opts,
  });
}

const seqs = new WeakMap<MatchRoom, Map<number, number>>();
export function cmd(room: MatchRoom, id: number, buttons = 0, extra: Partial<InputCmd> = {}): InputCmd {
  let m = seqs.get(room);
  if (!m) {
    m = new Map();
    seqs.set(room, m);
  }
  const s = (m.get(id) ?? 0) + 1;
  m.set(id, s);
  const p = room.players[id];
  return { seq: s, tick: room.tick + 1, time: 0, buttons, yaw: p.yaw, pitch: p.pitch, select: null, viewTick: room.tick, ...extra };
}

/** Step the room n ticks, feeding every human the given buttons. */
export function run(room: MatchRoom, ticks: number, inputs: Record<number, { buttons?: number; yaw?: number; pitch?: number; select?: InputCmd['select'] }> = {}): void {
  for (let i = 0; i < ticks; i++) {
    for (const p of room.players) {
      if (p.bot) continue;
      const inp = inputs[p.id] ?? {};
      room.submitInput(p.id, cmd(room, p.id, inp.buttons ?? 0, { yaw: inp.yaw ?? p.yaw, pitch: inp.pitch ?? p.pitch, select: i === 0 ? inp.select ?? null : null }));
    }
    room.step();
  }
}

export function toLive(room: MatchRoom): void {
  let guard = 0;
  while (room.phase === 'buy' && guard++ < TICK_RATE * 60) run(room, 1);
}

export function teleport(p: Player, x: number, z: number, y?: number): void {
  p.pos = { x, y: y ?? Math.max(0, map.floorHeight(x, z, 6)), z };
  p.vel = { x: 0, y: 0, z: 0 };
  p.onGround = true;
}

export function aimAt(room: MatchRoom, from: Player, to: { x: number; y: number; z: number }): { yaw: number; pitch: number } {
  const e = room.eyePos(from);
  const dx = to.x - e.x;
  const dy = to.y - e.y;
  const dz = to.z - e.z;
  return { yaw: Math.atan2(dx, dz), pitch: -Math.atan2(dy, Math.hypot(dx, dz)) };
}

let rid = 1000;
export const nextRid = (): number => rid++;
