import { describe, expect, it } from 'vitest';
import { mergeSettings } from '../src/app/settings';
import { PROTOCOL_VERSION, decodeEnvelope, decodeReplay, encodeEnvelope, encodeReplay, sanitizeLabel, validateEnvelope, type CommandEnvelope, type ReplayData } from '../src/net/protocol';
import { memoryRepository } from '../src/persistence/repo';

describe('command protocol', () => {
  const env: CommandEnvelope = { v: PROTOCOL_VERSION, seq: 3, player: 0, tick: 120, cmd: { k: 'move', ids: [1, 2, 3], x: 10.5, z: 20, q: true } };
  it('round-trips valid envelopes', () => {
    expect(decodeEnvelope(encodeEnvelope(env))).toEqual(env);
  });
  it('rejects malformed, oversized or wrong-version envelopes', () => {
    expect(validateEnvelope({ ...env, v: 99 })).toBe(false);
    expect(validateEnvelope({ ...env, player: 7 })).toBe(false);
    expect(validateEnvelope({ ...env, cmd: { k: 'teleport', ids: [1] } })).toBe(false);
    expect(validateEnvelope({ ...env, cmd: { k: 'move', ids: [1.5], x: 1, z: 1 } })).toBe(false);
    expect(validateEnvelope({ ...env, cmd: { k: 'move', ids: [1], x: Infinity, z: 1 } })).toBe(false);
    expect(validateEnvelope({ ...env, cmd: { k: 'move', ids: Array.from({ length: 5000 }, (_, i) => i), x: 1, z: 1 } })).toBe(false);
    expect(validateEnvelope({ ...env, cmd: { k: 'train', id: 4, def: 'x'.repeat(200) } })).toBe(false);
    expect(decodeEnvelope('{not json')).toBeNull();
  });
  it('round-trips replays and refuses corrupted ones', () => {
    const r: ReplayData = { v: PROTOCOL_VERSION, build: 't', config: { seed: 1, mode: 'skirmish', players: [{ faction: 'helix', controller: 'human', difficulty: 'normal', name: 'A' }, { faction: 'chorus', controller: 'ai', difficulty: 'normal', name: 'B' }] }, commands: [env], hashes: [[100, 12345]], endTick: 200, winner: 0, recordedAt: '2026-01-01T00:00:00.000Z' };
    expect(decodeReplay(encodeReplay(r))).toEqual(r);
    expect(decodeReplay('{"v":1}')).toBeNull();
    expect(decodeReplay(encodeReplay({ ...r, commands: [{ ...env, player: 9 }] }))).toBeNull();
  });
  it('sanitises untrusted labels', () => {
    const cleaned = sanitizeLabel('<b onclick="x()">Ada</b>');
    expect(cleaned).not.toMatch(/[<>"()=]/);
    expect(cleaned.length).toBeLessThanOrEqual(20);
    expect(sanitizeLabel('')).toBe('Commander');
    expect(sanitizeLabel('Ada Lovelace')).toBe('Ada Lovelace');
  });
});

describe('persistence', () => {
  it('stores and reloads profile, settings, history and replays', async () => {
    const repo = memoryRepository();
    const s = await repo.loadSettings();
    await repo.saveSettings({ ...s, music: 0.1, keys: { ...s.keys, stop: 'KeyV' } });
    const s2 = await repo.loadSettings();
    expect(s2.music).toBe(0.1);
    expect(s2.keys.stop).toBe('KeyV');
    const p = await repo.loadProfile();
    await repo.saveProfile({ ...p, tutorialDone: true, wins: 2 });
    expect((await repo.loadProfile()).tutorialDone).toBe(true);
    await repo.addHistory({ id: '1', date: 'd', mode: 'skirmish', faction: 'helix', enemy: 'chorus', difficulty: 'normal', won: true, durationTicks: 100 });
    expect(await repo.loadHistory()).toHaveLength(1);
    expect(await repo.loadReplay('nope')).toBeNull();
  });
  it('recovers from corrupted saved data with defaults', async () => {
    const repo = memoryRepository();
    const kv = (repo as unknown as { kv: { set(k: string, v: unknown): Promise<void> } }).kv;
    await kv.set('profile', 'garbage');
    await kv.set('history', { not: 'an array' });
    const p = await repo.loadProfile();
    expect(p.name).toBe('Commander');
    expect(await repo.loadHistory()).toEqual([]);
    expect(repo.recovered).toBe(true);
  });
  it('merges partial or hostile settings safely', () => {
    const s = mergeSettings({ renderScale: 40, palette: 'nope', master: 'loud', keys: { stop: 'KeyV', evil: 'x' } });
    expect(s.renderScale).toBe(1);
    expect(s.palette).toBe('default');
    expect(s.master).toBe(0.8);
    expect(s.keys.stop).toBe('KeyV');
    expect('evil' in s.keys).toBe(false);
  });
});
