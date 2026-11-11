import { describe, expect, it } from 'vitest';
import { MemoryKV, SaveRepository, crc32, migrate, SAVE_VERSION } from '../src/persistence/save';
import { Game } from '../src/sim/game';
import { emptyInput } from '../src/sim/types';

const DT = 1 / 60;

function playedGame(): Game {
  const g = new Game(1107);
  g.newGame();
  for (let i = 0; i < 90; i++) g.step(emptyInput(), DT);
  g.player.cash = 777;
  g.player.trustXp = 3.5;
  g.player.inv.medkits = 2;
  g.player.discovered.push('lm-dome');
  g.completed['first-shift'] = { grade: 'A', time: 140, plays: 1 };
  return g;
}

describe('persistence: versioned journaled saves', () => {
  it('round-trips cash, trust, inventory, world time, discovered landmarks and the owned vehicle', async () => {
    const g = playedGame();
    const repo = new SaveRepository(new MemoryKV());
    await repo.save(g.snapshot());
    const res = await repo.load();
    expect(res).not.toBeNull();
    const s = res!.snapshot;
    expect(s.version).toBe(SAVE_VERSION);
    expect(s.player.cash).toBe(777);
    expect(s.player.inv.medkits).toBe(2);
    expect(s.player.discovered).toContain('lm-dome');
    expect(s.hour).toBeCloseTo(g.hour, 5);
    expect(s.vehicle?.def).toBe('kestrel');
    // load it into a fresh game
    const g2 = new Game(1107);
    g2.loadSnapshot(s);
    expect(g2.player.cash).toBe(777);
    expect(g2.player.trust).toBe(2); // 3.5 xp -> level 2
    expect(g2.vehicles.some((v) => v.def.id === 'kestrel')).toBe(true);
    expect(g2.completed['first-shift'].grade).toBe('A');
    expect(g2.missions.running).toBe(true); // the tutorial mission resumes from its start/checkpoint
    for (let i = 0; i < 120; i++) g2.step(emptyInput(), DT);
    expect(Number.isFinite(g2.player.human.x)).toBe(true);
  });

  it('restores a mission checkpoint after reload', { timeout: 60000 }, async () => {
    const g = playedGame();
    // advance First Shift past pickup by teleporting and forcing the objectives
    g.player.human.heading = 0;
    for (let i = 0; i < 60 * 14; i++) g.step(emptyInput(), DT);
    const print = g.world.poi('printshop');
    g.player.human.x = print.x; g.player.human.z = print.z;
    // mount the bike first so the first objective is satisfied
    const bike = g.vehicles.find((v) => v.tag === 'kestrel')!;
    g.player.human.vehicleId = bike.id; bike.driverId = 0;
    for (let i = 0; i < 60 * 14; i++) g.step(emptyInput(), DT);
    g.player.human.vehicleId = null; bike.driverId = null;
    g.player.human.x = print.x; g.player.human.z = print.z;
    g.step(emptyInput(), DT);
    g.step({ ...emptyInput(), interact: true }, DT);
    for (let i = 0; i < 30; i++) g.step(emptyInput(), DT);
    const snap = g.snapshot();
    expect(snap.mission?.snap.checkpoint).toBe('cp-pickup');
    const g2 = new Game(1107);
    g2.loadSnapshot(JSON.parse(JSON.stringify(snap)));
    expect(g2.missions.running).toBe(true);
    expect(g2.missions.checkpoint?.id).toBe('cp-pickup');
  });

  it('falls back to the rolling backup when the main slot is corrupted', async () => {
    const kv = new MemoryKV();
    const repo = new SaveRepository(kv);
    const g = playedGame();
    await repo.save(g.snapshot());
    g.player.cash = 999;
    await repo.save(g.snapshot());
    kv.data.set('slot', kv.data.get('slot')!.replace('"cash\\":999', '"cash\\":111')); // checksum mismatch
    const res = await new SaveRepository(kv).load();
    expect(res).not.toBeNull();
    expect(res!.source).toBe('backup');
    expect(res!.snapshot.player.cash).toBe(777);
    expect(res!.warnings.join(' ')).toMatch(/backup|checksum/i);
  });

  it('recovers an interrupted write from the journal', async () => {
    const kv = new MemoryKV();
    const repo = new SaveRepository(kv);
    const g = playedGame();
    await repo.save(g.snapshot()); // good slot
    g.player.cash = 4242;
    kv.failAfterWrites = 1; // journal write succeeds, then the slot write throws
    await expect(repo.save(g.snapshot())).rejects.toThrow();
    kv.failAfterWrites = null;
    const res = await new SaveRepository(kv).load();
    expect(res!.source).toBe('journal');
    expect(res!.snapshot.player.cash).toBe(4242);
    expect(res!.warnings.join(' ')).toMatch(/journal/i);
  });

  it('ignores a truncated journal and keeps the last good slot', async () => {
    const kv = new MemoryKV();
    const repo = new SaveRepository(kv);
    const g = playedGame();
    await repo.save(g.snapshot());
    kv.data.set('journal', '{"schema":"meridian-save","version":2,"seq":99,"cr');
    const res = await new SaveRepository(kv).load();
    expect(res!.source).toBe('slot');
    expect(res!.snapshot.player.cash).toBe(777);
  });

  it('migrates a v1 save fixture to the current schema', () => {
    const v1 = { version: 1, savedAt: 1, t: 100, hour: 18.5, player: { x: -50, z: 30, hp: 80, cash: 640, trust: 2, ammo: 18, medkits: 2 }, completed: ['first-shift'] };
    const s = migrate(v1);
    expect(s.version).toBe(2);
    expect(s.player.cash).toBe(640);
    expect(s.player.inv.ammo.pistol).toBe(18);
    expect(s.player.inv.medkits).toBe(2);
    expect(s.completed['first-shift']).toBeDefined();
    expect(s.tutorialDone).toBe(true);
    const g = new Game(1107);
    g.loadSnapshot(s);
    expect(g.player.cash).toBe(640);
    expect(g.hour).toBeCloseTo(18.5, 3);
  });

  it('rejects saves from the future and garbage input', () => {
    expect(() => migrate({ version: 99 })).toThrow();
    expect(() => migrate(null)).toThrow();
    expect(() => migrate({ version: 2, player: { x: NaN, z: 0, inv: {} } })).toThrow();
  });

  it('exports and imports a save as JSON, validating the checksum', async () => {
    const repo = new SaveRepository(new MemoryKV());
    await repo.save(playedGame().snapshot());
    const text = (await repo.exportJson())!;
    const other = new SaveRepository(new MemoryKV());
    expect(await other.importJson(text)).toBe(true);
    expect((await other.load())!.snapshot.player.cash).toBe(777);
    expect(await other.importJson(text.replace('"crc":"', '"crc":"0'))).toBe(false);
    expect(await other.importJson('not json')).toBe(false);
  });

  it('crc32 is stable and sensitive', () => {
    expect(crc32('abc')).toBe(crc32('abc'));
    expect(crc32('abc')).not.toBe(crc32('abd'));
  });
});
