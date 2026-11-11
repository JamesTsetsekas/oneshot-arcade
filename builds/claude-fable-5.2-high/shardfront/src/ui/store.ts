// ui: a tiny external store. React observes read models through this adapter and never owns per-frame entity state.
import { useSyncExternalStore } from 'react';
import { DEFAULT_SETTINGS, type Settings } from '../app/settings';
import type { Difficulty, MatchConfig, ReplayData } from '../net/protocol';
import type { PlayerStats } from '../sim/sim';
import type { Faction } from '../data/types';

export interface CardButton {
  id: string;
  slot: number;
  key: string;
  label: string;
  icon: string;
  glyph?: string;
  ore?: number; flux?: number; supply?: number; time?: number;
  disabled?: boolean;
  reason?: string;
  active?: boolean;
  count?: number;
  cooldown?: number;
  tip: string[];
}

export interface SelGroup { def: string; name: string; count: number; icon: string; active: boolean }
export interface QueueView { name: string; icon: string; progress: number; paused: string }
export interface SelSingle {
  id: number; name: string; icon: string; owner: string; ownerKind: 'self' | 'enemy' | 'neutral';
  hp: number; maxHp: number; shield: number; maxShield: number; energy: number; maxEnergy: number;
  role: string; status: string; stats: string[]; tags: string[];
  queue: QueueView[]; constructing: number; resource: number;
}

export interface AlertView { id: number; text: string; kind: string; t: number; x: number; z: number }

export interface TutorialView { step: number; total: number; title: string; text: string; hint: string; done: boolean }

export interface HudState {
  time: string;
  ore: number; flux: number; supplyUsed: number; supplyCap: number; workers: number; idleWorkers: number;
  saturation: { workers: number; ideal: number }[];
  objective: string;
  selCount: number; groups: SelGroup[]; single: SelSingle | null;
  card: CardButton[];
  alerts: AlertView[];
  mode: string; modeHint: string;
  controlGroups: number[];
  replay: { speed: number; tick: number; endTick: number; syncOk: boolean; paused: boolean } | null;
  tutorial: TutorialView | null;
  endgame: boolean;
  faction: Faction;
  toast: string;
}

export interface PerfState { fps: number; frameMs: number; simMs: number; drawCalls: number; triangles: number; entities: number; tick: number; ai: string; paths: number; hash: string }

export interface MatchResult {
  mode: 'skirmish' | 'tutorial' | 'replay';
  winner: number;
  localPlayer: number;
  durationTicks: number;
  config: MatchConfig;
  stats: PlayerStats[];
  replay: ReplayData | null;
  replayVerified: boolean | null;
}

export interface MatchRecord { id: string; date: string; mode: string; faction: Faction; enemy: Faction; difficulty: Difficulty; won: boolean; durationTicks: number }

export interface Profile {
  name: string;
  tutorialDone: boolean;
  xp: Record<Faction, number>;
  wins: number; losses: number;
  banner: number;
}

export const DEFAULT_PROFILE: Profile = { name: 'Commander', tutorialDone: false, xp: { helix: 0, chorus: 0 }, wins: 0, losses: 0, banner: 0 };

export type Screen = 'boot' | 'menu' | 'setup' | 'loading' | 'game' | 'postgame' | 'archive' | 'settings' | 'credits' | 'replays' | 'error';

export interface AppState {
  screen: Screen;
  error: string;
  loadingText: string;
  loadingProgress: number;
  settings: Settings;
  profile: Profile;
  history: MatchRecord[];
  replays: { id: string; date: string; label: string }[];
  hud: HudState | null;
  perf: PerfState | null;
  pauseMenu: boolean;
  pauseTab: 'main' | 'settings' | 'controls';
  result: MatchResult | null;
  icons: Record<string, string>;
  contextLost: boolean;
  notice: string;
  minimapTick: number;
}

let state: AppState = {
  screen: 'boot', error: '', loadingText: 'Starting up', loadingProgress: 0,
  settings: DEFAULT_SETTINGS, profile: DEFAULT_PROFILE, history: [], replays: [],
  hud: null, perf: null, pauseMenu: false, pauseTab: 'main', result: null, icons: {}, contextLost: false, notice: '', minimapTick: 0,
};
const listeners = new Set<() => void>();

export function getState(): AppState { return state; }

export function setState(patch: Partial<AppState>): void {
  state = { ...state, ...patch };
  for (const l of listeners) l();
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

export function useStore<T>(sel: (s: AppState) => T): T {
  return useSyncExternalStore(subscribe, () => sel(state));
}
