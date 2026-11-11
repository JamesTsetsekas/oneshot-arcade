// persistence: local profile, settings, match history and replays behind a repository interface so an
// authenticated cloud implementation can replace it later. IndexedDB with an in-memory fallback.
import { mergeSettings, type Settings } from '../app/settings';
import { decodeReplay, encodeReplay, sanitizeLabel, type ReplayData } from '../net/protocol';
import { DEFAULT_PROFILE, type MatchRecord, type Profile } from '../ui/store';

export interface Repository {
  /** true when stored data was unreadable and has been reset */
  recovered: boolean;
  loadSettings(): Promise<Settings>;
  saveSettings(s: Settings): Promise<void>;
  loadProfile(): Promise<Profile>;
  saveProfile(p: Profile): Promise<void>;
  loadHistory(): Promise<MatchRecord[]>;
  addHistory(r: MatchRecord): Promise<void>;
  listReplays(): Promise<{ id: string; date: string; label: string }[]>;
  saveReplay(id: string, label: string, r: ReplayData): Promise<void>;
  loadReplay(id: string): Promise<ReplayData | null>;
  reset(): Promise<void>;
}

const DB_NAME = 'shardfront';
const DB_VERSION = 1;
const STORE = 'kv';
const MAX_REPLAYS = 6;
const MAX_HISTORY = 30;

interface KV { get(key: string): Promise<unknown>; set(key: string, value: unknown): Promise<void>; del(key: string): Promise<void>; clear(): Promise<void> }

class MemoryKV implements KV {
  private m = new Map<string, unknown>();
  async get(k: string) { return this.m.get(k); }
  async set(k: string, v: unknown) { this.m.set(k, v); }
  async del(k: string) { this.m.delete(k); }
  async clear() { this.m.clear(); }
}

class IdbKV implements KV {
  constructor(private db: IDBDatabase) {}
  private tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const t = this.db.transaction(STORE, mode);
      const req = fn(t.objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  get(k: string) { return this.tx('readonly', (s) => s.get(k)); }
  async set(k: string, v: unknown) { await this.tx('readwrite', (s) => s.put(v, k)); }
  async del(k: string) { await this.tx('readwrite', (s) => s.delete(k)); }
  async clear() { await this.tx('readwrite', (s) => s.clear()); }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('IndexedDB unavailable')); return; }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      // migrations: v1 creates the key-value store
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('IndexedDB blocked'));
  });
}

class KvRepository implements Repository {
  recovered = false;
  constructor(private kv: KV) {}

  private async read<T>(key: string, parse: (raw: unknown) => T, fallback: T): Promise<T> {
    try {
      const raw = await this.kv.get(key);
      if (raw === undefined) return fallback;
      return parse(raw);
    } catch {
      // corrupted entry: drop it and continue with defaults
      this.recovered = true;
      try { await this.kv.del(key); } catch { /* ignore */ }
      return fallback;
    }
  }

  loadSettings() { return this.read('settings', (r) => mergeSettings(r), mergeSettings(null)); }
  async saveSettings(s: Settings) { try { await this.kv.set('settings', s); } catch { /* storage full or blocked */ } }

  loadProfile() {
    return this.read('profile', (r) => {
      if (!r || typeof r !== 'object') throw new Error('bad profile');
      const p = r as Partial<Profile>;
      return {
        name: sanitizeLabel(p.name), tutorialDone: !!p.tutorialDone,
        xp: { helix: Number(p.xp?.helix) || 0, chorus: Number(p.xp?.chorus) || 0 },
        wins: Number(p.wins) || 0, losses: Number(p.losses) || 0, banner: Number(p.banner) || 0,
      };
    }, { ...DEFAULT_PROFILE });
  }
  async saveProfile(p: Profile) { try { await this.kv.set('profile', p); } catch { /* ignore */ } }

  loadHistory() {
    return this.read('history', (r) => {
      if (!Array.isArray(r)) throw new Error('bad history');
      return (r as MatchRecord[]).filter((m) => m && typeof m.id === 'string').slice(0, MAX_HISTORY);
    }, [] as MatchRecord[]);
  }
  async addHistory(rec: MatchRecord) {
    const h = await this.loadHistory();
    h.unshift(rec);
    try { await this.kv.set('history', h.slice(0, MAX_HISTORY)); } catch { /* ignore */ }
  }

  listReplays() {
    return this.read('replayIndex', (r) => {
      if (!Array.isArray(r)) throw new Error('bad replay index');
      return r as { id: string; date: string; label: string }[];
    }, [] as { id: string; date: string; label: string }[]);
  }
  async saveReplay(id: string, label: string, r: ReplayData) {
    try {
      const idx = await this.listReplays();
      idx.unshift({ id, date: r.recordedAt, label });
      while (idx.length > MAX_REPLAYS) { const old = idx.pop(); if (old) await this.kv.del('replay:' + old.id); }
      await this.kv.set('replay:' + id, encodeReplay(r));
      await this.kv.set('replayIndex', idx);
    } catch { /* ignore */ }
  }
  async loadReplay(id: string) {
    try {
      const raw = await this.kv.get('replay:' + id);
      return typeof raw === 'string' ? decodeReplay(raw) : null;
    } catch { return null; }
  }
  async reset() { try { await this.kv.clear(); } catch { /* ignore */ } }
}

export async function openRepository(): Promise<Repository> {
  try {
    const db = await openDb();
    return new KvRepository(new IdbKV(db));
  } catch {
    return new KvRepository(new MemoryKV());
  }
}

export function memoryRepository(): Repository { return new KvRepository(new MemoryKV()); }
