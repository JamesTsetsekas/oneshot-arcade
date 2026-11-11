import { hashString } from "../core/rng";
import { SAVE_VERSION, type CharacterData } from "../progression/character";
import { initialQuests } from "../progression/quests";

/**
 * Save format: one primary record per character in the `saves` store plus the previous good record in `backups`.
 * Each record = { id, version, checksum (FNV-1a of json), json, updatedAt, meta }.
 * A write moves the current valid primary into backups and writes the new primary in ONE transaction,
 * so an interrupted write leaves either the old primary or the new one; a corrupt primary falls back to the backup.
 */
export interface SaveRecord {
  id: string;
  version: number;
  checksum: string;
  json: string;
  updatedAt: number;
  meta: { name: string; classId: string; level: number; difficulty: string; playTime: number };
}

export interface SaveListing { id: string; meta: SaveRecord["meta"]; updatedAt: number; status: "ok" | "recoverable" | "corrupt" }
export interface LoadResult { data: CharacterData | null; recovered: boolean; error?: string }

export interface Profile {
  settings: Record<string, any>;
  tutorial: Record<string, boolean>;
  lastCharacter?: string;
  cosmetics: Record<string, any>;
}

export function checksum(json: string): string {
  return hashString(json).toString(16).padStart(8, "0") + ":" + json.length.toString(16);
}

// ───────────────────────── migrations ─────────────────────────
type Migration = (d: any) => any;
export const MIGRATIONS: Record<number, Migration> = {
  // v1 → v2: potion belt capacity and loadouts were added
  1: (d) => ({ ...d, version: 2, beltCap: d.beltCap ?? 5, loadouts: d.loadouts ?? [null, null] }),
  // v2 → v3: quest table and run stats were added
  2: (d) => ({ ...d, version: 3, quests: d.quests ?? initialQuests(), run: d.run ?? { startedAt: d.createdAt ?? 0, kills: 0, deaths: 0, itemsFound: 0, best: "", startPlay: 0 }, flags: d.flags ?? {} }),
};

export function migrate(d: any): CharacterData {
  let v = d.version ?? 1;
  if (v > SAVE_VERSION) throw new Error(`Save version ${v} is newer than this build (${SAVE_VERSION})`);
  while (v < SAVE_VERSION) {
    const m = MIGRATIONS[v];
    if (!m) throw new Error(`No migration from version ${v}`);
    d = m(d);
    v = d.version;
  }
  validateCharacter(d);
  return d as CharacterData;
}

export function validateCharacter(d: any) {
  const req = ["id", "name", "classId", "level", "inventory", "equipment", "stash", "quests", "waypoints", "difficulty", "seed", "ranks", "hotbar", "belt"];
  for (const k of req) if (d[k] === undefined) throw new Error(`Save missing field: ${k}`);
  if (d.classId !== "cinder" && d.classId !== "ranger") throw new Error("Invalid class");
  if (typeof d.level !== "number" || d.level < 1 || d.level > 20) throw new Error("Invalid level");
}

export function encodeRecord(ch: CharacterData): SaveRecord {
  const json = JSON.stringify(ch);
  return {
    id: ch.id, version: ch.version, checksum: checksum(json), json, updatedAt: ch.updatedAt,
    meta: { name: ch.name, classId: ch.classId, level: ch.level, difficulty: ch.difficulty, playTime: ch.stats.playTime },
  };
}

export function decodeRecord(r: SaveRecord | undefined): CharacterData | null {
  if (!r || typeof r.json !== "string") return null;
  if (checksum(r.json) !== r.checksum) return null;
  try { return migrate(JSON.parse(r.json)); } catch { return null; }
}

// ───────────────────────── storage backends ─────────────────────────
export interface SaveBackend {
  getSave(id: string): Promise<SaveRecord | undefined>;
  getBackup(id: string): Promise<SaveRecord | undefined>;
  /** Atomically: backup ← current primary (if valid), primary ← rec. */
  commit(rec: SaveRecord): Promise<void>;
  listSaves(): Promise<SaveRecord[]>;
  remove(id: string): Promise<void>;
  restoreBackup(id: string): Promise<boolean>;
  getProfile(): Promise<Profile | undefined>;
  putProfile(p: Profile): Promise<void>;
  /** Test hook: write a raw primary record without the backup step (simulates an interrupted/corrupt write). */
  rawPut(rec: SaveRecord): Promise<void>;
}

const DB_NAME = "ashfall-covenant";
const DB_VERSION = 1;

function req<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
}
function txDone(t: IDBTransaction): Promise<void> {
  return new Promise((res, rej) => { t.oncomplete = () => res(); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error ?? new Error("aborted")); });
}

export class IdbBackend implements SaveBackend {
  private dbp: Promise<IDBDatabase>;
  constructor(private factory: IDBFactory = indexedDB, name = DB_NAME) {
    this.dbp = new Promise((res, rej) => {
      const r = factory.open(name, DB_VERSION);
      r.onupgradeneeded = () => {
        const db = r.result;
        if (!db.objectStoreNames.contains("saves")) db.createObjectStore("saves", { keyPath: "id" });
        if (!db.objectStoreNames.contains("backups")) db.createObjectStore("backups", { keyPath: "id" });
        if (!db.objectStoreNames.contains("profile")) db.createObjectStore("profile");
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
      r.onblocked = () => rej(new Error("IndexedDB blocked"));
    });
  }
  private async store(name: string, mode: IDBTransactionMode) {
    const db = await this.dbp;
    return db.transaction(name, mode).objectStore(name);
  }
  async getSave(id: string) { return req((await this.store("saves", "readonly")).get(id)) as Promise<SaveRecord | undefined>; }
  async getBackup(id: string) { return req((await this.store("backups", "readonly")).get(id)) as Promise<SaveRecord | undefined>; }
  async commit(rec: SaveRecord) {
    const db = await this.dbp;
    const t = db.transaction(["saves", "backups"], "readwrite");
    const saves = t.objectStore("saves"), backups = t.objectStore("backups");
    const cur = saves.get(rec.id);
    cur.onsuccess = () => {
      const c = cur.result as SaveRecord | undefined;
      if (c && decodeRecord(c)) backups.put(c);
      saves.put(rec);
    };
    await txDone(t);
  }
  async listSaves() { return req((await this.store("saves", "readonly")).getAll()) as Promise<SaveRecord[]>; }
  async remove(id: string) {
    const db = await this.dbp;
    const t = db.transaction(["saves", "backups"], "readwrite");
    t.objectStore("saves").delete(id);
    t.objectStore("backups").delete(id);
    await txDone(t);
  }
  async restoreBackup(id: string) {
    const b = await this.getBackup(id);
    if (!b || !decodeRecord(b)) return false;
    await this.rawPut(b);
    return true;
  }
  async getProfile() { return req((await this.store("profile", "readonly")).get("profile")) as Promise<Profile | undefined>; }
  async putProfile(p: Profile) { const s = await this.store("profile", "readwrite"); await req(s.put(p, "profile")); }
  async rawPut(rec: SaveRecord) { const s = await this.store("saves", "readwrite"); await req(s.put(rec)); }
}

/** In-memory backend: used when IndexedDB is unavailable (private mode) — the UI warns that progress will not persist. */
export class MemoryBackend implements SaveBackend {
  saves = new Map<string, SaveRecord>();
  backups = new Map<string, SaveRecord>();
  profile: Profile | undefined;
  async getSave(id: string) { return this.saves.get(id); }
  async getBackup(id: string) { return this.backups.get(id); }
  async commit(rec: SaveRecord) { const c = this.saves.get(rec.id); if (c && decodeRecord(c)) this.backups.set(rec.id, c); this.saves.set(rec.id, rec); }
  async listSaves() { return [...this.saves.values()]; }
  async remove(id: string) { this.saves.delete(id); this.backups.delete(id); }
  async restoreBackup(id: string) { const b = this.backups.get(id); if (!b || !decodeRecord(b)) return false; this.saves.set(id, b); return true; }
  async getProfile() { return this.profile; }
  async putProfile(p: Profile) { this.profile = p; }
  async rawPut(rec: SaveRecord) { this.saves.set(rec.id, rec); }
}

export class SaveRepository {
  constructor(public backend: SaveBackend) {}

  async save(ch: CharacterData) {
    ch.version = SAVE_VERSION;
    await this.backend.commit(encodeRecord(ch));
  }

  async load(id: string): Promise<LoadResult> {
    const primary = await this.backend.getSave(id);
    const d = decodeRecord(primary);
    if (d) return { data: d, recovered: false };
    const b = decodeRecord(await this.backend.getBackup(id));
    if (b) return { data: b, recovered: true, error: "The latest save was damaged; restored the previous good backup." };
    return { data: null, recovered: false, error: "Save data is corrupt and no backup could be recovered." };
  }

  async list(): Promise<SaveListing[]> {
    const recs = await this.backend.listSaves();
    const out: SaveListing[] = [];
    for (const r of recs) {
      const ok = !!decodeRecord(r);
      let status: SaveListing["status"] = ok ? "ok" : "corrupt";
      if (!ok && decodeRecord(await this.backend.getBackup(r.id))) status = "recoverable";
      out.push({ id: r.id, meta: r.meta ?? { name: "Unknown", classId: "?", level: 0, difficulty: "?", playTime: 0 }, updatedAt: r.updatedAt ?? 0, status });
    }
    return out.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async remove(id: string) { await this.backend.remove(id); }
  async restore(id: string) { return this.backend.restoreBackup(id); }
  async profile(): Promise<Profile> { return (await this.backend.getProfile()) ?? { settings: {}, tutorial: {}, cosmetics: {} }; }
  async saveProfile(p: Profile) { await this.backend.putProfile(p); }
}

export async function openRepository(): Promise<{ repo: SaveRepository; persistent: boolean }> {
  try {
    if (typeof indexedDB === "undefined") throw new Error("no idb");
    const be = new IdbBackend(indexedDB);
    await be.listSaves();
    return { repo: new SaveRepository(be), persistent: true };
  } catch {
    return { repo: new SaveRepository(new MemoryBackend()), persistent: false };
  }
}
