// persistence: IndexedDB behind a repository interface (so cloud persistence can replace it later), with an in-memory fallback.
import type { Settings } from '../render/renderer';
import type { Command, SimConfig } from '../sim/types';

export interface MatchRecord {
  id: string;
  date: number;
  duration: number; // ticks
  faction: string;
  enemy: string;
  difficulty: string;
  result: 'victory' | 'defeat';
  mode: string;
}
export interface ReplayRecord {
  id: string;
  date: number;
  version: number;
  cfg: SimConfig;
  commands: Command[];
  hashes: Array<[number, number]>;
  ticks: number;
  winner: number;
  label: string;
}
export interface Profile { xp: Record<string, number>; tutorialDone: boolean; badges: string[]; banner: string }

export interface Repository {
  get<T>(store: string, key: string): Promise<T | undefined>;
  put(store: string, key: string, value: unknown): Promise<void>;
  list<T>(store: string): Promise<T[]>;
  del(store: string, key: string): Promise<void>;
  corrupt: boolean;
}

const STORES = ['settings', 'history', 'replays', 'profile'];

class MemoryRepo implements Repository {
  private data = new Map<string, Map<string, unknown>>();
  corrupt = false;
  private s(store: string) { if (!this.data.has(store)) this.data.set(store, new Map()); return this.data.get(store)!; }
  async get<T>(store: string, key: string) { return this.s(store).get(key) as T | undefined; }
  async put(store: string, key: string, value: unknown) { this.s(store).set(key, value); }
  async list<T>(store: string) { return [...this.s(store).values()] as T[]; }
  async del(store: string, key: string) { this.s(store).delete(key); }
}

class IdbRepo implements Repository {
  corrupt = false;
  constructor(private db: IDBDatabase) {}
  private tx(store: string, mode: IDBTransactionMode) { return this.db.transaction(store, mode).objectStore(store); }
  private req<T>(r: IDBRequest<T>): Promise<T> { return new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
  async get<T>(store: string, key: string): Promise<T | undefined> {
    try { return (await this.req(this.tx(store, 'readonly').get(key))) as T | undefined; } catch { this.corrupt = true; return undefined; }
  }
  async put(store: string, key: string, value: unknown) {
    try { await this.req(this.tx(store, 'readwrite').put(value, key)); } catch { this.corrupt = true; }
  }
  async list<T>(store: string): Promise<T[]> {
    try { return (await this.req(this.tx(store, 'readonly').getAll())) as T[]; } catch { this.corrupt = true; return []; }
  }
  async del(store: string, key: string) {
    try { await this.req(this.tx(store, 'readwrite').delete(key)); } catch { this.corrupt = true; }
  }
}

export async function openRepository(): Promise<Repository> {
  try {
    if (typeof indexedDB === 'undefined') return new MemoryRepo();
    const db = await new Promise<IDBDatabase>((res, rej) => {
      const r = indexedDB.open('shardfront', 1);
      r.onupgradeneeded = () => { for (const s of STORES) if (!r.result.objectStoreNames.contains(s)) r.result.createObjectStore(s); };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
      r.onblocked = () => rej(new Error('blocked'));
    });
    return new IdbRepo(db);
  } catch {
    return new MemoryRepo();
  }
}

export const DEFAULT_KEYS: Record<string, string> = {
  move: 'm', stop: 's', hold: 'h', attackMove: 'a', patrol: 'p', build: 'b', rally: 'r', focus: 'f', cycle: 'Tab', alert: ' ', home: 'Home', menu: 'F10',
  panUp: 'ArrowUp', panDown: 'ArrowDown', panLeft: 'ArrowLeft', panRight: 'ArrowRight', rotateLeft: ',', rotateRight: '.',
};
export const KEY_LABELS: Record<string, string> = {
  move: 'Move', stop: 'Stop', hold: 'Hold position', attackMove: 'Attack-move', patrol: 'Patrol', build: 'Build menu', rally: 'Rally point', focus: 'Focus selection', cycle: 'Cycle subtype',
  alert: 'Jump to last alert', home: 'Centre on base', menu: 'Pause menu', panUp: 'Pan up', panDown: 'Pan down', panLeft: 'Pan left', panRight: 'Pan right', rotateLeft: 'Rotate camera left', rotateRight: 'Rotate camera right',
};

export function defaultSettings(): Settings {
  return {
    quality: 'high', renderScale: 1, shadows: true, effects: 1, antialias: true, palette: 'default', reducedMotion: false,
    edgeScroll: false, wasdPan: false, rotateCamera: false, scrollSpeed: 1, master: 0.8, sfx: 0.9, music: 0.5, ui: 0.9, subtitles: true,
    keys: { ...DEFAULT_KEYS }, debugSurfaces: false, showStats: false, masterMuted: false,
  };
}

export function sanitizeSettings(raw: unknown): Settings {
  const d = defaultSettings();
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Record<string, unknown>;
  const out: Record<string, unknown> = { ...d };
  for (const k of Object.keys(d)) {
    const v = r[k];
    const dv = (d as unknown as Record<string, unknown>)[k];
    if (v === undefined || typeof v !== typeof dv) continue;
    if (k === 'keys') { out.keys = { ...DEFAULT_KEYS, ...Object.fromEntries(Object.entries(v as Record<string, unknown>).filter(([kk, vv]) => kk in DEFAULT_KEYS && typeof vv === 'string' && (vv as string).length <= 12)) }; continue; }
    out[k] = v;
  }
  out.renderScale = Math.min(1.5, Math.max(0.5, Number(out.renderScale) || 1));
  return out as unknown as Settings;
}

export function applyPreset(s: Settings, q: Settings['quality']) {
  s.quality = q;
  if (q === 'low') { s.renderScale = 0.75; s.shadows = false; s.effects = 0.5; s.antialias = false; }
  if (q === 'medium') { s.renderScale = 1; s.shadows = true; s.effects = 0.8; s.antialias = true; }
  if (q === 'high') { s.renderScale = 1; s.shadows = true; s.effects = 1; s.antialias = true; }
}

export const clampLabel = (s: string, n = 24) => s.replace(/[\u0000-\u001f<>]/g, '').slice(0, n);
