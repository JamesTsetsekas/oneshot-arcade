// IndexedDB save repository: versioned snapshots, journaled writes, rolling backups, migration,
// recovery after an interrupted write, and JSON import/export. No backend involved.
import type { SaveData } from '../game-session/sim';
import { SAVE_VERSION } from '../game-session/sim';

export interface SaveRecord { slot: string; seq: number; checksum: string; json: string; savedAt: number }
export interface LoadResult { data: SaveData | null; recovered: 'none' | 'journal' | 'backup'; note: string }
const STORES = ['snapshots', 'journal', 'backups'] as const;
type Store = (typeof STORES)[number];
export const BACKUPS_KEPT = 3;

export function checksum(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16).padStart(8, '0');
}
/** Bring any older save shape up to the current schema. Throws on unusable data. */
export function migrate(raw: any): SaveData {
  if (!raw || typeof raw !== 'object' || typeof raw.version !== 'number') throw new Error('Not a Meridian Run save');
  if (raw.version > SAVE_VERSION) throw new Error(`Save is from a newer build (v${raw.version})`);
  const d = JSON.parse(JSON.stringify(raw));
  if (d.version === 1) {
    // v1 -> v2: weather state, owned outfits, activity counters and the circuit ghost were added
    d.forceRain = null; d.wetness = 0;
    d.player.ownedOutfits = [0, ...(d.player.outfit ? [d.player.outfit] : [])];
    d.progress = { completed: d.progress?.completed ?? d.completed ?? {}, activityRuns: {}, circuitBest: 0, ghost: [] };
    delete d.completed;
    d.stats = d.stats ?? {}; d.seed = d.seed ?? 1337; d.playTime = d.playTime ?? 0;
    d.version = 2;
  }
  if (!d.player || typeof d.cash !== 'number' || !d.inv || !d.progress) throw new Error('Save is missing required fields');
  return d as SaveData;
}
function validRecord(r: SaveRecord | undefined | null): r is SaveRecord {
  return !!r && typeof r.json === 'string' && checksum(r.json) === r.checksum;
}

export class SaveRepo {
  private db: IDBDatabase | null = null;
  /** Test hook: simulate the tab dying right after the journal entry is written. */
  failAfterJournal = false;
  constructor(private name = 'meridian-run') {}
  open(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') { reject(new Error('IndexedDB unavailable')); return; }
      const req = indexedDB.open(this.name, 1);
      req.onupgradeneeded = () => { for (const s of STORES) if (!req.result.objectStoreNames.contains(s)) req.result.createObjectStore(s); };
      req.onsuccess = () => { this.db = req.result; resolve(); };
      req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
    });
  }
  close() { this.db?.close(); this.db = null; }
  private tx<T>(store: Store, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.db) { reject(new Error('Save database not open')); return; }
      const t = this.db.transaction(store, mode), req = fn(t.objectStore(store));
      req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error);
    });
  }
  private get = <T>(s: Store, k: string) => this.tx<T | undefined>(s, 'readonly', (o) => o.get(k));
  private put = (s: Store, k: string, v: unknown) => this.tx(s, 'readwrite', (o) => o.put(v, k));
  private del = (s: Store, k: string) => this.tx(s, 'readwrite', (o) => o.delete(k));

  async save(slot: string, data: SaveData): Promise<void> {
    const json = JSON.stringify(data);
    const prev = await this.get<SaveRecord>('snapshots', slot);
    const rec: SaveRecord = { slot, seq: (prev?.seq ?? 0) + 1, checksum: checksum(json), json, savedAt: data.savedAt };
    await this.put('journal', slot, rec);            // 1) intent
    if (this.failAfterJournal) throw new Error('simulated interruption');
    if (validRecord(prev)) {                           // 2) rotate rolling backups
      const list = ((await this.get<SaveRecord[]>('backups', slot)) ?? []).filter(validRecord);
      list.unshift(prev); await this.put('backups', slot, list.slice(0, BACKUPS_KEPT));
    }
    await this.put('snapshots', slot, rec);           // 3) commit
    await this.del('journal', slot);                  // 4) clear intent
  }
  async load(slot: string): Promise<LoadResult> {
    const journal = await this.get<SaveRecord>('journal', slot);
    let snap = await this.get<SaveRecord>('snapshots', slot);
    let recovered: LoadResult['recovered'] = 'none', note = '';
    if (validRecord(journal) && (!validRecord(snap) || journal.seq > snap.seq)) {
      // a write was interrupted after the intent landed: finish it
      await this.put('snapshots', slot, journal); await this.del('journal', slot);
      snap = journal; recovered = 'journal'; note = 'Finished a save that was interrupted.';
    } else if (journal) await this.del('journal', slot);
    if (!validRecord(snap)) {
      const list = ((await this.get<SaveRecord[]>('backups', slot)) ?? []).filter(validRecord);
      if (!list.length) return { data: null, recovered: 'none', note: snap ? 'Save was corrupted and no backup exists.' : '' };
      snap = list[0]; recovered = 'backup'; note = 'Main save was corrupted; restored the latest backup.';
      await this.put('snapshots', slot, snap);
    }
    try { return { data: migrate(JSON.parse(snap.json)), recovered, note }; }
    catch (e) { return { data: null, recovered, note: (e as Error).message }; }
  }
  async peek(slot: string): Promise<{ savedAt: number; playTime: number; cash: number; missions: number } | null> {
    try { const r = await this.load(slot); if (!r.data) return null; return { savedAt: r.data.savedAt, playTime: r.data.playTime, cash: r.data.cash, missions: Object.keys(r.data.progress.completed).filter((k) => /^m\d$/.test(k)).length }; }
    catch { return null; }
  }
  async backups(slot: string): Promise<SaveRecord[]> { return ((await this.get<SaveRecord[]>('backups', slot)) ?? []).filter(validRecord); }
  async exportSlot(slot: string): Promise<string | null> {
    const r = await this.load(slot);
    return r.data ? JSON.stringify({ game: 'meridian-run', checksum: checksum(JSON.stringify(r.data)), save: r.data }) : null;
  }
  async importSlot(slot: string, text: string): Promise<SaveData> {
    const parsed = JSON.parse(text);
    if (parsed.game !== 'meridian-run' || !parsed.save) throw new Error('Not a Meridian Run export');
    if (parsed.checksum !== checksum(JSON.stringify(parsed.save))) throw new Error('Export file is damaged (checksum mismatch)');
    const data = migrate(parsed.save);
    await this.save(slot, data);
    return data;
  }
  async erase(slot: string) { await this.del('snapshots', slot); await this.del('journal', slot); await this.del('backups', slot); }
  /** Test hook: overwrite the main snapshot with garbage. */
  async corrupt(slot: string) { const s = await this.get<SaveRecord>('snapshots', slot); if (s) await this.put('snapshots', slot, { ...s, json: s.json.slice(0, s.json.length / 2) }); }
}
