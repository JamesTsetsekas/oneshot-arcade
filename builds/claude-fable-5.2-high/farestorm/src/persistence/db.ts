// IndexedDB persistence with versioned migrations and an in-memory fallback.
import { Bindings, DEFAULT_BINDINGS } from '../camera-input/input';
import { TaxiId } from '../vehicle/taxiSpecs';
import { TrafficDensity } from '../traffic/traffic';
import type { SessionResult } from '../game-session/session';

export const DB_NAME = 'farestorm';
export const DB_VERSION = 2;

export interface Settings {
  v: number;
  master: number;
  music: number;
  sfx: number;
  quality: 'low' | 'medium' | 'high';
  dynamicRes: boolean;
  traffic: Exclude<TrafficDensity, 'off'>;
  cameraShake: number;
  fov: number;
  reducedMotion: boolean;
  subtitles: boolean;
  hudScale: number;
  minimap: boolean;
  steerSensitivity: number;
  deadZone: number;
  vibration: boolean;
  wideWindows: boolean;
  steerAssist: boolean;
  bindings: Bindings;
  taxi: TaxiId;
}
export const DEFAULT_SETTINGS: Settings = {
  v: 2, master: 0.8, music: 0.6, sfx: 0.85, quality: 'medium', dynamicRes: true, traffic: 'medium', cameraShake: 1, fov: 1,
  reducedMotion: false, subtitles: true, hudScale: 1, minimap: true, steerSensitivity: 1, deadZone: 0.14, vibration: true,
  wideWindows: false, steerAssist: false, bindings: DEFAULT_BINDINGS, taxi: 'breaker',
};
export interface Profile {
  discovered: string[];
  lessonsDone: number;
  medals: Record<string, string>;
  shifts: number;
}
export const DEFAULT_PROFILE: Profile = { discovered: [], lessonsDone: 0, medals: {}, shifts: 0 };

export interface RunRecord {
  id?: number;
  date: number;
  mode: string;
  taxi: string;
  trial: number;
  score: number;
  rank: string | null;
  medal: string | null;
  time: number;
  deliveries: number;
  bestMult: number;
  traffic: string;
  assisted: boolean;
  rules: number;
}

/** Bring a stored settings blob of any older version up to the current shape. */
export function migrateSettings(raw: unknown): Settings {
  const s = { ...DEFAULT_SETTINGS, ...(raw && typeof raw === 'object' ? (raw as Partial<Settings>) : {}) };
  s.bindings = { ...DEFAULT_BINDINGS, ...(s.bindings ?? {}) };
  if (!['low', 'medium', 'high'].includes(s.quality)) s.quality = 'medium';
  if (!['low', 'medium', 'high'].includes(s.traffic)) s.traffic = 'medium';
  if (!['gull', 'breaker', 'tempest'].includes(s.taxi)) s.taxi = 'breaker';
  s.v = DEFAULT_SETTINGS.v;
  return s;
}

export class Store {
  private db: IDBDatabase | null = null;
  private mem = new Map<string, unknown>();
  private memRecords: RunRecord[] = [];
  ok = false;

  async open(): Promise<void> {
    if (typeof indexedDB === 'undefined') return;
    try {
      this.db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (ev) => {
          const db = req.result;
          // v1: kv store. v2: run records with a mode index.
          if (ev.oldVersion < 1) db.createObjectStore('kv');
          if (ev.oldVersion < 2) db.createObjectStore('records', { keyPath: 'id', autoIncrement: true }).createIndex('mode', 'mode');
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        req.onblocked = () => reject(new Error('blocked'));
      });
      this.ok = true;
    } catch {
      this.db = null; // private mode or corrupted store: keep playing with in-memory data
    }
  }
  private tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
    return new Promise((resolve) => {
      if (!this.db) return resolve(undefined);
      try {
        const req = fn(this.db.transaction(store, mode).objectStore(store));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(undefined);
      } catch { resolve(undefined); }
    });
  }
  async get<T>(key: string, fallback: T): Promise<T> {
    if (!this.db) return (this.mem.get(key) as T) ?? fallback;
    const v = await this.tx<T>('kv', 'readonly', (s) => s.get(key) as IDBRequest<T>);
    return v ?? fallback;
  }
  async set(key: string, value: unknown): Promise<void> {
    this.mem.set(key, value);
    await this.tx('kv', 'readwrite', (s) => s.put(value, key));
  }
  async loadSettings(): Promise<Settings> {
    return migrateSettings(await this.get<unknown>('settings', null));
  }
  async loadProfile(): Promise<Profile> {
    return { ...DEFAULT_PROFILE, ...(await this.get<Partial<Profile>>('profile', {})) };
  }
  async addRecord(r: RunRecord): Promise<void> {
    this.memRecords.push(r);
    await this.tx('records', 'readwrite', (s) => s.add(r));
  }
  async records(): Promise<RunRecord[]> {
    if (!this.db) return [...this.memRecords];
    return (await this.tx<RunRecord[]>('records', 'readonly', (s) => s.getAll() as IDBRequest<RunRecord[]>)) ?? [];
  }
  async clearRecords(): Promise<void> {
    this.memRecords = [];
    await this.tx('records', 'readwrite', (s) => s.clear() as unknown as IDBRequest<undefined>);
  }
}

export function recordFromResult(r: SessionResult, rules: number): RunRecord {
  return {
    date: Date.now(), mode: r.mode, taxi: r.taxi, trial: r.trial, score: r.score, rank: r.rank, medal: r.medal, time: r.trialTime,
    deliveries: r.deliveries, bestMult: r.bestMult, traffic: r.traffic, assisted: r.assisted, rules,
  };
}
/** Best runs per mode: score descending, or time ascending for completed time trials. */
export function bestRecords(all: RunRecord[], mode: string, trial = 0, n = 8): RunRecord[] {
  const list = all.filter((r) => r.mode === mode && (mode !== 'trial' || r.trial === trial));
  if (mode === 'trial') return list.filter((r) => r.medal !== null && r.deliveries >= 3).sort((a, b) => a.time - b.time).slice(0, n);
  return list.sort((a, b) => b.score - a.score).slice(0, n);
}
