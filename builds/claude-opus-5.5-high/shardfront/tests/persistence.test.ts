import { describe, expect, test } from 'vitest';
import { DEFAULT_SETTINGS, MemoryRepository, migrateProfile, migrateSettings } from '../src/persistence/store';

describe('persistence', () => {
  test('corrupted settings recover field by field', () => {
    const r = migrateSettings({ graphics: { quality: 'ultra', renderScale: 99, shadows: 'yes' }, audio: { master: 0.3, music: -4 }, bindings: { stop: 'KeyX', hold: 42 } });
    expect(r.value.graphics.quality).toBe(DEFAULT_SETTINGS.graphics.quality);
    expect(r.value.graphics.renderScale).toBe(1);
    expect(r.value.audio.master).toBe(0.3);
    expect(r.value.audio.music).toBe(DEFAULT_SETTINGS.audio.music);
    expect(r.value.bindings.stop).toBe('KeyX');
    expect(r.value.bindings.hold).toBe('KeyH');
  });
  test('garbage profile is reset and flagged', () => {
    expect(migrateProfile('garbage').recovered).toBe(true);
    const p = migrateProfile({ mastery: { helix: 120, verdant: -3 }, badges: ['A', 5], banner: 'nope' });
    expect(p.value.mastery.helix).toBe(120);
    expect(p.value.mastery.verdant).toBe(0);
    expect(p.value.badges).toEqual(['A']);
    expect(p.value.banner).toBe('Basalt');
  });
  test('memory repository stores history and replays', async () => {
    const r = new MemoryRepository();
    await r.addMatch({ id: 'a', date: 1, faction: 'helix', enemyFaction: 'verdant', difficulty: 'easy', result: 'victory', durationTicks: 100, mode: 'skirmish', replayId: 'a', stats: { oreCollected: 1, fluxCollected: 1, unitsCreated: 1, unitsLost: 0, kills: 0 } });
    expect(await r.listMatches()).toHaveLength(1);
    expect(await r.loadReplay('missing')).toBeNull();
  });
});
