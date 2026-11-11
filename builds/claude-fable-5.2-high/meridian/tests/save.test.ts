import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { SaveRepo, migrate, checksum, BACKUPS_KEPT } from '../src/persistence/saveRepo';
import { SAVE_VERSION, SaveData } from '../src/game-session/sim';
import { quietSim, run, place } from './helpers';
import { ANCHORS } from '../src/world/district';
import { M1 } from '../src/missions/data';

let dbN = 0;
const freshRepo = async () => { const r = new SaveRepo('test-db-' + dbN++); await r.open(); return r; };

describe('save data', () => {
  it('round-trips player, inventory, cash, Trust, owned vehicle, clock, weather and progress', async () => {
    const sim = await quietSim();
    sim.economy.cash = 777; sim.economy.trust = 260; sim.clock.t = 1234; sim.weather.forceRain = true; sim.weather.wetness = 0.6;
    sim.player.inv.medkits = 2; sim.player.inv.long = 'heron'; sim.player.outfit = 2; sim.ownedOutfits.add(2);
    sim.missions.progress.completed.m1 = { grade: 'A', time: 150, score: 88 };
    sim.recallBike();
    place(sim, -60, -86, 1); run(sim, 0.5);
    const data = sim.serialize();
    expect(data.version).toBe(SAVE_VERSION);
    const sim2 = await quietSim(99);
    sim2.applySave(JSON.parse(JSON.stringify(data)));
    run(sim2, 0.5);
    expect(sim2.economy.cash).toBe(777); expect(sim2.trustLevel).toBe(2);
    expect(sim2.player.inv.long).toBe('heron'); expect(sim2.player.inv.medkits).toBe(2); expect(sim2.player.outfit).toBe(2);
    expect(sim2.clock.t).toBeGreaterThan(1233); expect(sim2.clock.t).toBeLessThan(1238); expect(sim2.weather.forceRain).toBe(true);
    expect(sim2.missions.progress.completed.m1.grade).toBe('A');
    expect(Math.hypot(sim2.player.x + 60, sim2.player.z + 86)).toBeLessThan(1.5);
    expect(sim2.player.ownedVehicle?.spec.id).toBe('swift');
    expect(sim2.player.body.grounded).toBe(true);
  });
  it('never stores an unsafe position: mid-pursuit, in a vehicle or mid-mission saves fall back to the safehouse', async () => {
    const sim = await quietSim();
    const v = sim.spawnMissionVehicle('tern', 100, -304, 1.57); v.owned = true;
    sim.player.enterVehicle(v, true); sim.input.moveZ = 1; run(sim, 3);
    let d = sim.serialize();
    expect(Math.hypot(d.player.x - ANCHORS.safehouse.x, d.player.z - ANCHORS.safehouse.z)).toBeLessThan(2);
    sim.input.moveZ = 0; sim.player.exitVehicle(true); run(sim, 1);
    sim.police.forceTier(2, 0, 0);
    d = sim.serialize();
    expect(Math.hypot(d.player.x - ANCHORS.safehouse.x, d.player.z - ANCHORS.safehouse.z)).toBeLessThan(2);
    sim.police.clear('reset'); sim.startMission(M1); run(sim, 0.2);
    d = sim.serialize();
    expect(Math.hypot(d.player.x - ANCHORS.safehouse.x, d.player.z - ANCHORS.safehouse.z)).toBeLessThan(2);
  });
  it('resting at the safehouse heals, resets the day and asks for a save; not during an alert', async () => {
    const sim = await quietSim();
    sim.player.health = 40; sim.clock.t = 2000;
    sim.police.forceTier(1, 0, 0);
    expect(sim.rest()).toBe(false);
    sim.police.clear('reset');
    expect(sim.rest()).toBe(true);
    expect(sim.player.health).toBe(100); expect(sim.clock.t).toBe(0); expect(sim.autosaveWanted).toBe('rest');
  });
});

describe('save repository (IndexedDB)', () => {
  const sample = (cash: number): SaveData => ({
    version: SAVE_VERSION, savedAt: 1000 + cash, playTime: 60, seed: 1,
    player: { x: -118, z: -88, yaw: 0, health: 100, outfit: 0, ownedOutfits: [0] },
    inv: { sidearm: 'wren', long: null, stun: true, ammo: { pistol: 36, smg: 0, rifle: 0, shell: 0, cell: 6 }, mags: { wren: 12, halcyon: 3 }, medkits: 1, armor: 0, smoke: 1, chirper: 2 },
    cash, trust: 0, clock: 0, forceRain: null, wetness: 0, progress: { completed: {}, activityRuns: {}, circuitBest: 0, ghost: [] }, owned: null, stats: {},
  });
  it('saves, loads and keeps rolling backups', async () => {
    const repo = await freshRepo();
    expect((await repo.load('main')).data).toBe(null);
    for (let i = 1; i <= 6; i++) await repo.save('main', sample(i * 100));
    const r = await repo.load('main');
    expect(r.data!.cash).toBe(600); expect(r.recovered).toBe('none');
    const b = await repo.backups('main');
    expect(b.length).toBe(BACKUPS_KEPT);
    expect(JSON.parse(b[0].json).cash).toBe(500);
    expect((await repo.peek('main'))!.cash).toBe(600);
  });
  it('finishes an interrupted write from the journal', async () => {
    const repo = await freshRepo();
    await repo.save('main', sample(100));
    repo.failAfterJournal = true;
    await expect(repo.save('main', sample(250))).rejects.toThrow('simulated');
    repo.failAfterJournal = false;
    const r = await repo.load('main');
    expect(r.recovered).toBe('journal');
    expect(r.data!.cash).toBe(250);
    expect((await repo.load('main')).recovered).toBe('none'); // journal cleared after recovery
  });
  it('restores the latest backup when the main snapshot is corrupted', async () => {
    const repo = await freshRepo();
    await repo.save('main', sample(100)); await repo.save('main', sample(200));
    await repo.corrupt('main');
    const r = await repo.load('main');
    expect(r.recovered).toBe('backup'); expect(r.data!.cash).toBe(100);
    expect(r.note).toContain('backup');
  });
  it('reports unrecoverable corruption instead of crashing', async () => {
    const repo = await freshRepo();
    await repo.save('main', sample(100)); await repo.corrupt('main');
    const r = await repo.load('main');
    expect(r.data).toBe(null); expect(r.note).toContain('corrupted');
  });
  it('exports and imports with a checksum, rejecting damaged files', async () => {
    const repo = await freshRepo();
    await repo.save('main', sample(4242));
    const text = (await repo.exportSlot('main'))!;
    const other = await freshRepo();
    const d = await other.importSlot('main', text);
    expect(d.cash).toBe(4242);
    expect((await other.load('main')).data!.cash).toBe(4242);
    await expect(other.importSlot('main', text.replace('4242', '9999'))).rejects.toThrow('checksum');
    await expect(other.importSlot('main', '{"game":"something-else"}')).rejects.toThrow();
  });
  it('migrates a version 1 fixture and refuses saves from the future', () => {
    const v1 = { version: 1, savedAt: 5, player: { x: 1, z: 2, yaw: 0, health: 80, outfit: 1 }, inv: sample(0).inv, cash: 300, trust: 120, clock: 50, completed: { m1: { grade: 'B', time: 200, score: 70 } } };
    const d = migrate(v1);
    expect(d.version).toBe(SAVE_VERSION);
    expect(d.progress.completed.m1.grade).toBe('B');
    expect(d.player.ownedOutfits).toEqual([0, 1]);
    expect(d.forceRain).toBe(null); expect(d.progress.ghost).toEqual([]);
    expect(() => migrate({ version: 99 })).toThrow('newer');
    expect(() => migrate({ nope: true })).toThrow();
    expect(checksum('abc')).toBe(checksum('abc')); expect(checksum('abc')).not.toBe(checksum('abd'));
  });
});
