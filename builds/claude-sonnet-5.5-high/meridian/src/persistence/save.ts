import type { SaveSnapshot } from '../sim/game';
import { newInventory } from '../sim/economy';

/** Async key/value store abstraction (IndexedDB in the browser, memory in tests). */
export interface KV {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  del(key: string): Promise<void>;
}

export class MemoryKV implements KV {
  data = new Map<string, string>();
  /** Test hook: throw on the n-th write to simulate an interrupted write. */
  failAfterWrites: number | null = null;
  async get(key: string): Promise<string | null> { return this.data.get(key) ?? null; }
  async set(key: string, value: string): Promise<void> {
    if (this.failAfterWrites !== null) {
      if (this.failAfterWrites <= 0) throw new Error('simulated write interruption');
      this.failAfterWrites--;
    }
    this.data.set(key, value);
  }
  async del(key: string): Promise<void> { this.data.delete(key); }
}

export class IdbKV implements KV {
  private db: Promise<IDBDatabase>;
  constructor(name = 'meridian-run') {
    this.db = new Promise((resolve, reject) => {
      const req = indexedDB.open(name, 1);
      req.onupgradeneeded = () => { req.result.createObjectStore('kv'); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  private async tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await this.db;
    return new Promise((resolve, reject) => {
      const req = fn(db.transaction('kv', mode).objectStore('kv'));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async get(key: string): Promise<string | null> { return ((await this.tx('readonly', (s) => s.get(key))) as string | undefined) ?? null; }
  async set(key: string, value: string): Promise<void> { await this.tx('readwrite', (s) => s.put(value, key)); }
  async del(key: string): Promise<void> { await this.tx('readwrite', (s) => s.delete(key)); }
}

/** localStorage fallback when IndexedDB is unavailable. */
export class LocalKV implements KV {
  async get(key: string): Promise<string | null> { return localStorage.getItem('meridian.' + key); }
  async set(key: string, value: string): Promise<void> { localStorage.setItem('meridian.' + key, value); }
  async del(key: string): Promise<void> { localStorage.removeItem('meridian.' + key); }
}

export const SAVE_VERSION = 2;

interface Envelope { schema: 'meridian-save'; version: number; seq: number; savedAt: number; crc: string; body: string }

export function crc32(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
}

function seal(snapshot: SaveSnapshot, seq: number): Envelope {
  const body = JSON.stringify(snapshot);
  return { schema: 'meridian-save', version: snapshot.version, seq, savedAt: Date.now(), crc: crc32(body), body };
}

function open(raw: string | null): { env: Envelope; snap: unknown } | null {
  if (!raw) return null;
  try {
    const env = JSON.parse(raw) as Envelope;
    if (env.schema !== 'meridian-save' || typeof env.body !== 'string') return null;
    if (crc32(env.body) !== env.crc) return null;
    return { env, snap: JSON.parse(env.body) };
  } catch { return null; }
}

/** Migrate any older snapshot to the current schema. Throws on unknown future versions. */
export function migrate(raw: any): SaveSnapshot {
  if (!raw || typeof raw !== 'object') throw new Error('invalid save');
  let s = raw;
  if (s.version === undefined || s.version < 1) throw new Error('unsupported save version');
  if (s.version > SAVE_VERSION) throw new Error('save is from a newer game version');
  if (s.version === 1) {
    // v1: flat player record, ammo as a single number, completed as string[]
    const inv = newInventory();
    inv.ammo.pistol = Number(s.player?.ammo ?? 36);
    inv.medkits = Number(s.player?.medkits ?? 1);
    const completed: SaveSnapshot['completed'] = {};
    for (const id of (s.completed as string[] | undefined) ?? []) completed[id] = { grade: 'B', time: 0, plays: 1 };
    s = {
      version: 2, savedAt: s.savedAt ?? Date.now(), t: s.t ?? 0, hour: s.hour ?? 16,
      player: { x: s.player.x, z: s.player.z, heading: s.player.heading ?? 0, hp: s.player.hp ?? 100, armor: 0, cash: s.player.cash ?? 0, trustXp: s.player.trust ?? 0, inv, outfit: 0, discovered: [], slot: 1, camYaw: 0 },
      vehicle: null, mission: null, completed, stats: { civilianHarm: 0, crimes: 0, distance: 0, kills: 0 }, best: { circuit: null }, tutorialDone: Object.keys(completed).includes('first-shift'),
    };
  }
  // defensive defaults for forward compatibility
  const snap = s as SaveSnapshot;
  snap.player.inv = { ...newInventory(), ...snap.player.inv };
  snap.completed = snap.completed ?? {};
  snap.best = snap.best ?? { circuit: null };
  if (!Number.isFinite(snap.player.x) || !Number.isFinite(snap.player.z)) throw new Error('save has invalid position');
  return snap;
}

export interface LoadResult { snapshot: SaveSnapshot; source: 'slot' | 'backup' | 'journal'; warnings: string[] }

/** Versioned, journaled, checksummed save repository with a rolling backup. */
export class SaveRepository {
  private seq = 0;
  constructor(private kv: KV) {}

  /** Journal first, then the slot (previous slot rolls to backup), then clear the journal. */
  async save(snapshot: SaveSnapshot): Promise<void> {
    const prev = open(await this.kv.get('slot'));
    this.seq = Math.max(this.seq, prev?.env.seq ?? 0) + 1;
    const env = JSON.stringify(seal(snapshot, this.seq));
    await this.kv.set('journal', env);
    const old = await this.kv.get('slot');
    if (old && open(old)) await this.kv.set('backup', old);
    await this.kv.set('slot', env);
    await this.kv.del('journal');
  }

  async load(): Promise<LoadResult | null> {
    const warnings: string[] = [];
    const slot = open(await this.kv.get('slot'));
    const journal = open(await this.kv.get('journal'));
    const backup = open(await this.kv.get('backup'));
    const candidates: Array<{ src: LoadResult['source']; v: { env: Envelope; snap: unknown } }> = [];
    if (journal && (!slot || journal.env.seq > slot.env.seq)) { candidates.push({ src: 'journal', v: journal }); warnings.push('Recovered an interrupted save from the journal'); }
    if (slot) candidates.push({ src: 'slot', v: slot });
    else if (await this.kv.get('slot')) warnings.push('Main save failed its checksum');
    if (backup) candidates.push({ src: 'backup', v: backup });
    for (const c of candidates) {
      try {
        const snapshot = migrate(c.v.snap);
        if (c.src === 'backup') warnings.push('Loaded the rolling backup');
        this.seq = Math.max(this.seq, c.v.env.seq);
        return { snapshot, source: c.src, warnings };
      } catch (e) { warnings.push('Skipped an unreadable save: ' + (e as Error).message); }
    }
    return null;
  }

  async exists(): Promise<boolean> { return (await this.load()) !== null; }

  async clear(): Promise<void> { for (const k of ['slot', 'backup', 'journal']) await this.kv.del(k); }

  /** Export the current save as a JSON string for the player to keep. */
  async exportJson(): Promise<string | null> { return (await this.kv.get('slot')) ?? (await this.kv.get('backup')); }

  async importJson(text: string): Promise<boolean> {
    const o = open(text);
    if (!o) return false;
    try { migrate(o.snap); } catch { return false; }
    await this.kv.set('slot', text);
    return true;
  }
}
