// Minimal external store bridging the game controller and the React menus.
import { useSyncExternalStore } from 'react';
import { Settings, DEFAULT_SETTINGS, Profile, DEFAULT_PROFILE, RunRecord } from '../persistence/db';
import type { SessionResult, ModeId } from '../game-session/session';

export type Screen = 'loading' | 'error' | 'menu' | 'setup' | 'playing' | 'paused' | 'results' | 'records' | 'settings' | 'howto' | 'credits';

export interface UIState {
  screen: Screen;
  back: Screen;
  loadingText: string;
  error: string;
  settings: Settings;
  profile: Profile;
  records: RunRecord[];
  result: SessionResult | null;
  newBest: boolean;
  setupMode: ModeId;
  trial: number;
  hub: number; // -1 = random
  gamepad: string;
  storageOk: boolean;
  notice: string;
}

let state: UIState = {
  screen: 'loading', back: 'menu', loadingText: 'Warming up the turbines...', error: '', settings: DEFAULT_SETTINGS, profile: DEFAULT_PROFILE,
  records: [], result: null, newBest: false, setupMode: 'arcade', trial: 0, hub: -1, gamepad: '', storageOk: true, notice: '',
};
const listeners = new Set<() => void>();

export const ui = {
  get: (): UIState => state,
  set(patch: Partial<UIState>): void {
    state = { ...state, ...patch };
    for (const l of listeners) l();
  },
  subscribe(l: () => void): () => void {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};
export function useUI(): UIState {
  return useSyncExternalStore(ui.subscribe, ui.get);
}
