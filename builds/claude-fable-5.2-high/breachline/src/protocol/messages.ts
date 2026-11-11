// shared-protocol: versioned messages between a client and the authoritative room.
// Hot-path traffic (inputs, snapshots) is binary - see codec.ts. Low-rate reliable events are structured objects.
import type { Loadout } from '../content/loadout';
import type { Difficulty } from '../content/tuning';

export const PROTOCOL_VERSION = 3;

export interface MatchConfig {
  seed: number;
  teamSize: number;
  scoreLimit: number;
  timeLimit: number;
  difficulty: Difficulty;
  warmup: number;
  mapId: string;
  /** which team the human joins */
  humanTeam: 0 | 1;
}

export type Phase = 0 | 1 | 2 | 3; // warmup, live, sudden death, post
export const PHASE_WARMUP = 0, PHASE_LIVE = 1, PHASE_SUDDEN = 2, PHASE_POST = 3;

export interface RosterEntry { id: number; name: string; team: 0 | 1; bot: boolean; primary: string }

// entity types carried in snapshots
export const ENT = { FRAG: 1, STICKY: 2, MINE: 3, FLASH: 4, SMOKE_CAN: 5, SMOKE: 6, DART: 7, POD: 8, DRONE: 9, SATCHEL: 10, MORTAR: 11, FLIGHT: 12, SHELL: 13 } as const;

export interface HitRecord { t: number; dmg: number; zone: number; src: string }

export type GameEvent =
  | { e: 'shot'; p: number; w: number; sup: boolean; o: [number, number, number]; ends: number[]; surf: number[] }
  | { e: 'hit'; victim: number; zone: number; dmg: number; kill: boolean; x: number; y: number; z: number; device?: boolean }
  | { e: 'dmg'; amount: number; fx: number; fy: number; fz: number; health: number; zone: number }
  | { e: 'kill'; killer: number; victim: number; src: string; head: boolean; assists: number[] }
  | { e: 'score'; label: string; amount: number }
  | { e: 'recap'; killer: number; src: string; dist: number; hits: HitRecord[]; kx: number; ky: number; kz: number; killerHealth: number }
  | { e: 'spawn'; id: number; yaw: number; reason?: string }
  | { e: 'explode'; kind: string; x: number; y: number; z: number; r: number }
  | { e: 'announce'; key: string; team?: number; text?: string }
  | { e: 'support'; kind: string; team: number; owner: number; phase: 'start' | 'warn' | 'impact' | 'end'; x?: number; y?: number; z?: number; yaw?: number }
  | { e: 'supportReady'; tier: number }
  | { e: 'melee'; p: number }
  | { e: 'throw'; p: number; kind: string }
  | { e: 'glass'; id: number; x: number; y: number; z: number }
  | { e: 'stats'; rows: number[] } // id,kills,deaths,assists,score per player
  | { e: 'ping'; p: number; x: number; y: number; z: number }
  | { e: 'pickup'; kind: string }
  | { e: 'phase'; phase: Phase; winner?: number }
  | { e: 'footsteps'; p: number };

export interface WeaponTally { weapon: string; shots: number; hits: number; kills: number; headshots: number }

export interface MatchResult {
  /** unique id; the profile service applies a result at most once (idempotent submission) */
  matchId: string;
  winner: -1 | 0 | 1;
  scores: [number, number];
  duration: number;
  suddenDeath: boolean;
  mapId: string;
  players: { id: number; name: string; team: 0 | 1; bot: boolean; kills: number; deaths: number; assists: number; score: number; bestStreak: number; devices: number; supportsUsed: number }[];
  you: {
    id: number;
    team: 0 | 1;
    weapons: WeaponTally[];
    bestStreak: number;
    adsKills: number;
    equipmentHits: number;
    devicesDestroyed: number;
    districtsVisited: number;
    assists: number;
    xp: { label: string; amount: number }[];
    xpTotal: number;
  };
  /** integrity tag from the room (HMAC in a hosted deployment; plain checksum in the embedded Practice room) */
  sig: string;
}

export type ClientMsg =
  | { m: 'hello'; version: number; name: string; loadouts: Loadout[]; loadout: number; config: MatchConfig }
  | { m: 'cmd'; data: ArrayBuffer }
  | { m: 'loadout'; index: number }
  | { m: 'leave' };

export type ServerMsg =
  | { m: 'welcome'; version: number; you: number; roster: RosterEntry[]; config: MatchConfig; tick: number }
  | { m: 'reject'; code: 'version' | 'loadout' | 'full'; detail: string }
  | { m: 'snap'; data: ArrayBuffer }
  | { m: 'events'; list: GameEvent[] }
  | { m: 'result'; result: MatchResult };

export function resultChecksum(r: Omit<MatchResult, 'sig'>): string {
  const s = JSON.stringify([r.matchId, r.winner, r.scores, Math.round(r.duration), r.players.map((p) => [p.id, p.kills, p.deaths, p.score]), r.you.xpTotal]);
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16).padStart(8, '0');
}
