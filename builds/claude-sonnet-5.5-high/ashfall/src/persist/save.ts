// Persistence: versioned, checksummed save envelopes with rolling backup and interrupted-write recovery.
// Storage is abstracted behind a tiny async KV interface (IndexedDB in the browser, in-memory in tests).
import { Inventory } from '../sim/inventory';
import { newCharacter, type Character } from '../sim/character';
import { resetUidCounterFor } from '../sim/loot';
import type { Item } from '../sim/types';

export const SAVE_VERSION = 2;

export interface KV {
  get(key: string): Promise<string | undefined>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  keys(prefix: string): Promise<string[]>;
}

export class MemoryKV implements KV {
  store = new Map<string, string>();
  async get(k: string) {
    return this.store.get(k);
  }
  async set(k: string, v: string) {
    this.store.set(k, v);
  }
  async delete(k: string) {
    this.store.delete(k);
  }
  async keys(prefix: string) {
    return [...this.store.keys()].filter((k) => k.startsWith(prefix));
  }
}

export class IdbKV implements KV {
  private dbp: Promise<IDBDatabase> | null = null;
  private db(): Promise<IDBDatabase> {
    if (!this.dbp) {
      this.dbp = new Promise((resolve, reject) => {
        const req = indexedDB.open('ashfall-covenant', 1);
        req.onupgradeneeded = () => {
          req.result.createObjectStore('kv');
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return this.dbp;
  }
  private async tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await this.db();
    return new Promise((resolve, reject) => {
      const t = db.transaction('kv', mode);
      const r = fn(t.objectStore('kv'));
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  }
  async get(k: string) {
    return (await this.tx('readonly', (s) => s.get(k))) as string | undefined;
  }
  async set(k: string, v: string) {
    await this.tx('readwrite', (s) => s.put(v, k));
  }
  async delete(k: string) {
    await this.tx('readwrite', (s) => s.delete(k));
  }
  async keys(prefix: string) {
    const all = (await this.tx('readonly', (s) => s.getAllKeys())) as string[];
    return all.filter((k) => typeof k === 'string' && k.startsWith(prefix));
  }
}

// ---------------------------------------------------------------- checksum
/** 53-bit string hash (cyrb53). Used as an integrity checksum, not for security. */
export function checksum(str: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

// ---------------------------------------------------------------- (de)serialisation
interface PlacedJson {
  item: Item;
  x: number;
  y: number;
}
export interface CharacterJson extends Omit<Character, 'inv' | 'stash'> {
  inv: { w: number; h: number; placed: PlacedJson[] };
  stash: { w: number; h: number; placed: PlacedJson[] };
}

export function toJson(ch: Character): CharacterJson {
  const inv = (i: Inventory) => ({ w: i.w, h: i.h, placed: i.placed.map((p) => ({ item: p.item, x: p.x, y: p.y })) });
  return { ...ch, inv: inv(ch.inv), stash: inv(ch.stash) };
}

export function fromJson(j: CharacterJson): Character {
  const base = newCharacter(j.name, j.cls, j.look, j.seed);
  const mk = (s: CharacterJson['inv']) => new Inventory(s.w, s.h, s.placed.map((p) => ({ item: p.item, x: p.x, y: p.y })));
  const ch: Character = { ...base, ...(j as unknown as Character), inv: mk(j.inv), stash: mk(j.stash) };
  // fill any fields added after the save was written
  ch.flags = j.flags ?? {};
  ch.tutorial = j.tutorial ?? {};
  ch.records = j.records ?? {};
  ch.loadouts = j.loadouts ?? base.loadouts;
  ch.belt = { ...base.belt, ...(j.belt ?? {}) };
  ch.beltCap = j.beltCap ?? base.beltCap;
  ch.stats = { ...base.stats, ...(j.stats ?? {}) };
  ch.echo = j.echo ?? null;
  resetUidCounterFor([...ch.inv.items(), ...ch.stash.items()]);
  return ch;
}

export interface Envelope {
  v: number;
  saved: number;
  checksum: string;
  body: string; // JSON of CharacterJson
}

export function seal(ch: Character, now = Date.now()): string {
  const body = JSON.stringify(toJson(ch));
  const env: Envelope = { v: SAVE_VERSION, saved: now, checksum: checksum(body), body };
  return JSON.stringify(env);
}

/** Migrations upgrade older save bodies one version at a time. */
const MIGRATIONS: Record<number, (j: Record<string, unknown>) => Record<string, unknown>> = {
  1: (j) => ({ ...j, records: (j.records as object) ?? {}, tutorial: (j.tutorial as object) ?? {} }),
};

export function migrate(body: Record<string, unknown>, from: number): Record<string, unknown> {
  let v = from;
  let cur = body;
  while (v < SAVE_VERSION) {
    const m = MIGRATIONS[v];
    if (!m) throw new Error(`No migration from save version ${v}`);
    cur = m(cur);
    v++;
  }
  return cur;
}

export type OpenResult = { ok: true; ch: Character; saved: number; source: 'primary' | 'pending' | 'backup'; recovered: boolean } | { ok: false; reason: string };

export function open(raw: string | undefined): { ch: Character; saved: number } | null {
  if (!raw) return null;
  try {
    const env = JSON.parse(raw) as Envelope;
    if (typeof env.body !== 'string' || env.checksum !== checksum(env.body)) return null;
    if (env.v > SAVE_VERSION) return null;
    let body = JSON.parse(env.body) as Record<string, unknown>;
    if (env.v < SAVE_VERSION) body = migrate(body, env.v);
    return { ch: fromJson(body as unknown as CharacterJson), saved: env.saved };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- repository
const key = (id: string, slot: 'main' | 'bak' | 'pending') => `char:${id}:${slot}`;

export class SaveRepo {
  constructor(private kv: KV) {}

  /** Two-phase write: pending -> (primary rotates to backup) -> primary. A crash between steps stays recoverable. */
  async save(ch: Character, now = Date.now()): Promise<void> {
    const payload = seal(ch, now);
    await this.kv.set(key(ch.id, 'pending'), payload);
    const prev = await this.kv.get(key(ch.id, 'main'));
    if (prev && open(prev)) await this.kv.set(key(ch.id, 'bak'), prev);
    await this.kv.set(key(ch.id, 'main'), payload);
    await this.kv.delete(key(ch.id, 'pending'));
  }

  async load(id: string): Promise<OpenResult> {
    const cands: { src: 'primary' | 'pending' | 'backup'; raw: string | undefined }[] = [
      { src: 'primary', raw: await this.kv.get(key(id, 'main')) },
      { src: 'pending', raw: await this.kv.get(key(id, 'pending')) },
      { src: 'backup', raw: await this.kv.get(key(id, 'bak')) },
    ];
    let best: { src: 'primary' | 'pending' | 'backup'; ch: Character; saved: number } | null = null;
    let primaryBad = false;
    for (const c of cands) {
      if (!c.raw) continue;
      const o = open(c.raw);
      if (!o) {
        if (c.src === 'primary') primaryBad = true;
        continue;
      }
      if (!best || o.saved > best.saved) best = { src: c.src, ch: o.ch, saved: o.saved };
    }
    if (!best) return { ok: false, reason: 'No readable save data was found for this character.' };
    return { ok: true, ch: best.ch, saved: best.saved, source: best.src, recovered: best.src !== 'primary' || primaryBad };
  }

  async list(): Promise<{ id: string; name: string; cls: string; level: number; saved: number; difficulty: string; damaged: boolean }[]> {
    const keys = await this.kv.keys('char:');
    const ids = new Set(keys.map((k) => k.split(':')[1]));
    const out = [];
    for (const id of ids) {
      const r = await this.load(id);
      if (r.ok) out.push({ id, name: r.ch.name, cls: r.ch.cls, level: r.ch.level, saved: r.saved, difficulty: r.ch.difficulty, damaged: r.recovered });
    }
    out.sort((a, b) => b.saved - a.saved);
    return out;
  }

  async remove(id: string): Promise<void> {
    for (const s of ['main', 'bak', 'pending'] as const) await this.kv.delete(key(id, s));
  }

  /** Restore the backup over a damaged primary. */
  async restoreBackup(id: string): Promise<boolean> {
    const raw = await this.kv.get(key(id, 'bak'));
    if (!raw || !open(raw)) return false;
    await this.kv.set(key(id, 'main'), raw);
    return true;
  }

  async setLast(id: string) {
    await this.kv.set('last', id);
  }
  async getLast(): Promise<string | undefined> {
    return this.kv.get('last');
  }
  async getSettings(): Promise<string | undefined> {
    return this.kv.get('settings');
  }
  async setSettings(s: string) {
    await this.kv.set('settings', s);
  }
}
