import { DEFAULT_LOADOUTS, Loadout } from '../src/content/loadout';
import type { GameEvent, MatchConfig, MatchResult, ServerMsg } from '../src/protocol/messages';
import { decodeSnapshot, Snapshot } from '../src/protocol/codec';
import { loadRapier } from '../src/sim/physics';
import { Room } from '../src/server/room';

export const baseConfig = (over: Partial<MatchConfig> = {}): MatchConfig => ({
  seed: 1234, teamSize: 6, scoreLimit: 75, timeLimit: 480, difficulty: 'normal', warmup: 1, mapId: 'k17', humanTeam: 0, ...over,
});

export interface Harness {
  room: Room;
  events: GameEvent[];
  snaps: Snapshot[];
  results: MatchResult[];
  raw: ServerMsg[];
  you: number;
  snapBytes: number;
}

export async function makeRoom(over: Partial<MatchConfig> = {}, human: Loadout[] | null = null, keepSnaps = false): Promise<Harness> {
  const R = await loadRapier();
  const h: Harness = { room: null as unknown as Room, events: [], snaps: [], results: [], raw: [], you: -1, snapBytes: 0 };
  h.room = new Room(R, baseConfig(over), (_client, msg) => {
    if (msg.m === 'events') h.events.push(...msg.list);
    else if (msg.m === 'snap') { h.snapBytes += msg.data.byteLength; if (keepSnaps) h.snaps.push(decodeSnapshot(msg.data)!); }
    else if (msg.m === 'result') h.results.push(msg.result);
    else if (msg.m === 'welcome') h.you = msg.you;
    h.raw.push(msg);
    if (h.raw.length > 50) h.raw.shift();
  });
  if (human) {
    const r = h.room.addHuman(1, 'Tester', human, 0);
    if (!r.ok) throw new Error(r.detail);
  }
  h.room.start();
  return h;
}

export const LOADOUTS = DEFAULT_LOADOUTS;
