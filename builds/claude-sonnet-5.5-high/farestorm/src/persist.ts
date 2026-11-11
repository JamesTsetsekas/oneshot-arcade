/** Versioned local persistence (localStorage, guarded: private windows / blocked storage degrade to memory). */
import type { Mode, TrafficLevel } from './sim/sim';

export interface Settings {
  master: number;
  music: number;
  sfx: number;
  shadows: boolean;
  resolution: number;
  dynamicRes: boolean;
  reducedMotion: boolean;
  shake: number;
  fov: number;
  hudScale: number;
  subtitles: boolean;
  guidance: 'route' | 'direct';
  crowd: boolean;
  colorblind: boolean;
  deadzone: number;
  photosensitive: boolean;
}

export interface ModeRecord {
  best: number;
  bestChain: number;
  deliveries: number;
  rank: string;
  runs: number;
}
export interface SaveData {
  version: number;
  settings: Settings;
  taxi: 'gull' | 'breaker' | 'tempest';
  color: number;
  traffic: TrafficLevel;
  records: Partial<Record<Mode, ModeRecord>>;
  trialBest: number | null;
  trialMedal: string | null;
  discovered: string[];
  tutorialSeen: boolean;
  totalFares: number;
}

export const DEFAULT_SETTINGS: Settings = {
  master: 0.8, music: 0.55, sfx: 0.9, shadows: true, resolution: 1, dynamicRes: true, reducedMotion: false, shake: 1, fov: 78, hudScale: 1,
  subtitles: true, guidance: 'route', crowd: true, colorblind: false, deadzone: 0.15, photosensitive: false,
};

const KEY = 'farestorm.save';
const VERSION = 2;

export function defaults(): SaveData {
  return { version: VERSION, settings: { ...DEFAULT_SETTINGS }, taxi: 'breaker', color: 0, traffic: 'normal', records: {}, trialBest: null, trialMedal: null, discovered: [], tutorialSeen: false, totalFares: 0 };
}

function migrate(raw: Partial<SaveData> & { version?: number }): SaveData {
  const d = defaults();
  const out: SaveData = { ...d, ...raw, settings: { ...d.settings, ...(raw.settings ?? {}) }, version: VERSION };
  // v1 -> v2: introduced photosensitive + deadzone settings and the records map
  if (!out.records) out.records = {};
  return out;
}

let memory: SaveData | null = null;

export function load(): SaveData {
  if (memory) return memory;
  try {
    const txt = localStorage.getItem(KEY);
    if (txt) {
      memory = migrate(JSON.parse(txt));
      return memory;
    }
  } catch {
    // corrupted or unavailable: fall through to defaults (error state: save corruption)
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  }
  memory = defaults();
  return memory;
}

export function save(): void {
  if (!memory) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(memory));
  } catch {
    /* storage unavailable: keep in memory only */
  }
}

export function recordRun(mode: Mode, score: number, chain: number, deliveries: number, rank: string): { newBest: boolean } {
  const s = load();
  const cur = s.records[mode] ?? { best: 0, bestChain: 0, deliveries: 0, rank: 'D', runs: 0 };
  const newBest = score > cur.best;
  s.records[mode] = { best: Math.max(cur.best, score), bestChain: Math.max(cur.bestChain, chain), deliveries: Math.max(cur.deliveries, deliveries), rank: newBest ? rank : cur.rank, runs: cur.runs + 1 };
  save();
  return { newBest };
}
