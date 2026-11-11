// Wire protocol between client and authoritative simulation host.
// Clients send intents only — never transforms, damage, or gold.
import type { HeroId, TalentId } from '../shared/types';

export const PROTOCOL_VERSION = 3;

export type PingKind = 'danger' | 'omw' | 'assist' | 'missing' | 'defend' | 'objective';

export type CommandBody =
  | { t: 'move'; x: number; y: number; attackMove?: boolean }
  | { t: 'attack'; target: number }
  | { t: 'cast'; slot: number; x?: number; y?: number; target?: number }
  | { t: 'talent'; slot: number; x?: number; y?: number; target?: number }
  | { t: 'rank'; slot: number }
  | { t: 'stop' }
  | { t: 'hold' }
  | { t: 'item'; slot: number; x?: number; y?: number; target?: number }
  | { t: 'ward'; x: number; y: number }
  | { t: 'recall' }
  | { t: 'buy'; item: string }
  | { t: 'sell'; slot: number }
  | { t: 'undo' }
  | { t: 'ping'; kind: PingKind; x: number; y: number }
  | { t: 'chat'; text: string }
  | { t: 'practice'; op: 'gold' | 'level' | 'timescale' | 'pause' | 'resetcd' | 'spawnwave'; value?: number };

export type Command = CommandBody & { seq: number };

export interface PlayerSetup {
  slot: number; // 0..5
  team: 0 | 1;
  hero: HeroId;
  talents: [TalentId, TalentId];
  name: string;
  bot: boolean;
  difficulty: 'easy' | 'normal' | 'hard';
}

export type MatchMode = 'unranked' | 'practice' | 'tutorial';
export interface MatchSetup {
  mode: MatchMode;
  seed: number;
  players: PlayerSetup[];
  humanSlot: number;
  practice?: { allies: number; enemies: number };
  /** Seconds to fast-forward before streaming (screenshot/demo tooling only). */
  warmup?: number;
}

// ---------------- Snapshot ----------------
export enum K { Hero = 1, Minion = 2, Tower = 3, Seal = 4, Core = 5, Engine = 6, Monster = 7, Ward = 8, Wall = 9, Decoy = 10, Proj = 11, Zone = 12, Fountain = 13 }

/** Status flags bitmask. */
export const ST = {
  stun: 1, root: 2, slow: 4, silence: 8, airborne: 16, shielded: 32, recall: 64, dead: 128, invuln: 256, revealed: 512,
  inBrush: 1024, channel: 2048, glint: 4096, empowered: 8192, hasted: 16384, backdoor: 32768,
} as const;

export interface EntView {
  id: number;
  k: number; // K
  tm: number; // team 0/1/2
  x: number; y: number; f: number; // facing radians
  hp: number; mhp: number; sh: number;
  st: number;
  sub?: string; // hero id / minion kind / monster kind / tower tier / visual key
  lv?: number;
  an?: number; // animation code: 0 idle 1 move 2 attack 3 cast 4 channel 5 dead 6 dash 7 airborne
  at?: number; // anim start time (s)
  r?: number; // radius / zone radius
  w?: number; h?: number; ang?: number; // zone rect / projectile direction
  t1?: number; // zone/proj end time
  own?: number; // owner id
  mana?: number; mmana?: number;
  tgt?: number; // current attack target (towers expose target for readability)
  ramp?: number;
  name?: string;
}

export interface CooldownView { cd: number; max: number; rank: number; cost: number; ready: boolean; recast?: boolean }

export interface PrivateState {
  heroId: number;
  hero: HeroId;
  gold: number;
  level: number; xp: number; xpNext: number; xpCur: number;
  skillPoints: number;
  abilities: CooldownView[]; // Q W E R
  talents: Array<{ id: TalentId; cd: number; max: number }>;
  items: Array<{ id: string; count: number; cd: number } | null>;
  wardCharges: number; wardRecharge: number;
  inShop: boolean;
  canUndo: boolean;
  respawnAt: number;
  stats: Record<string, number>;
  recallUntil: number; recallStart: number;
  passive: { label: string; value: number; max: number };
  buffs: Array<{ key: string; until: number; label: string }>;
  bountyTeam: number;
}

export interface ScoreRow {
  slot: number; name: string; hero: HeroId; team: 0 | 1; bot: boolean; level: number;
  k: number; d: number; a: number; cs: number; gold: number; items: string[]; wardScore: number; objectives: number;
  dmgHeroes: number; dmgTaken: number; dmgStructures: number; healing: number; structures: number; bounty: number; dead: boolean; respawnAt: number;
  skillOrder: string[]; latency: number; talents: TalentId[];
}

export interface ObjectiveView {
  key: string; kind: string; alive: boolean; hp: number; mhp: number; respawnAt: number; x: number; y: number;
}
export interface StructureView { key: string; tier: string; team: 0 | 1; lane: number; alive: boolean; hp: number; mhp: number; invuln: boolean; x: number; y: number; respawnAt?: number }
export interface TeamBuffView { team: 0 | 1; kind: 'gale' | 'forge' | 'colossus'; until: number }

export interface Snapshot {
  t: 'snap';
  tick: number;
  time: number;
  ents: EntView[];
  fog: Uint8Array; // bit-packed team visibility (FOG_W*FOG_H bits)
  me: PrivateState;
  score: ScoreRow[];
  kills: [number, number];
  structures: StructureView[];
  objectives: ObjectiveView[];
  teamBuffs: TeamBuffView[];
  events: GameEvent[];
  paused: boolean;
  timeScale: number;
}

export type GameEvent =
  | { e: 'dmg'; src: number; tgt: number; amt: number; dt: 'physical' | 'arcane' | 'pure'; crit?: boolean; x: number; y: number }
  | { e: 'heal'; tgt: number; amt: number; x: number; y: number }
  | { e: 'shield'; tgt: number; amt: number; x: number; y: number }
  | { e: 'kill'; killer: number; victim: number; killerSlot: number; victimSlot: number; assists: number[]; gold: number; first?: boolean; streak?: number }
  | { e: 'death'; id: number; x: number; y: number; k: number }
  | { e: 'cast'; id: number; ability: string; slot: string; x: number; y: number; tx: number; ty: number; hero: HeroId }
  | { e: 'attack'; id: number; tgt: number; x: number; y: number; ranged: boolean; sub: string }
  | { e: 'struct'; key: string; tier: string; team: 0 | 1; killerTeam: 0 | 1 }
  | { e: 'obj'; key: string; kind: string; what: 'spawn' | 'kill' | 'soon'; team?: 0 | 1 }
  | { e: 'gold'; amt: number; x: number; y: number }
  | { e: 'xp'; amt: number }
  | { e: 'level'; id: number; level: number; x: number; y: number }
  | { e: 'recall'; id: number; done: boolean; x: number; y: number }
  | { e: 'ping'; kind: PingKind; x: number; y: number; from: number; name: string }
  | { e: 'chat'; from: string; text: string; team: boolean }
  | { e: 'reject'; seq: number; reason: string }
  | { e: 'buy'; item: string; ok: boolean }
  | { e: 'ward'; x: number; y: number; team: 0 | 1 }
  | { e: 'vanguard'; lane: number; team: 0 | 1 }
  | { e: 'fx'; kind: string; x: number; y: number; x2?: number; y2?: number; r?: number; team?: number; id?: number }
  | { e: 'announce'; text: string; tone: 'good' | 'bad' | 'neutral'; caption?: string }
  | { e: 'deathRecap'; recap: DeathRecap }
  | { e: 'tutorial'; step: string }
  | { e: 'victory'; winner: 0 | 1 };

export interface DeathRecap {
  killer: string; killerHero?: string; assists: string[]; respawnIn: number;
  sources: Array<{ name: string; source: string; amount: number; type: string }>;
  cc: Array<{ name: string; kind: string; dur: number }>;
  total: number;
}

export interface MatchResult {
  winner: 0 | 1;
  duration: number;
  humanTeam: 0 | 1;
  score: ScoreRow[];
  timeline: Array<{ t: number; text: string; team: 0 | 1 | 2 }>;
  goldGraph: Array<[number, number, number]>; // time, team0 gold, team1 gold
  mode: MatchMode;
}

export type ServerMsg =
  | Snapshot
  | { t: 'ready'; version: number }
  | { t: 'result'; result: MatchResult }
  | { t: 'error'; message: string };

export type ClientMsg =
  | { t: 'start'; setup: MatchSetup; version: number }
  | { t: 'cmd'; cmd: Command }
  | { t: 'leave' };
