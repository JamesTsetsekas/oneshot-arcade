import { describe, expect, it } from 'vitest';
import { MissionRuntime, validateMission } from '../src/sim/missions';
import type { MissionHost, MissionDef, Line, Marker, SpawnSpec } from '../src/sim/missions';
import { World } from '../src/sim/world';
import { courierRun, recoveryCall, storyMissions, streetCircuit } from '../src/sim/missionDefs';
import { Game } from '../src/sim/game';
import { emptyInput } from '../src/sim/types';

interface VInfo { x: number; z: number; speed: number; healthPct: number; cargo: number | null; alive: boolean; driverIsPlayer: boolean; disabled: boolean }

class FakeHost implements MissionHost {
  t = 0;
  pos = { x: 0, z: 0, onFoot: true, vehicleTag: null as string | null, speed: 0, tier: 0 };
  vehicles = new Map<string, VInfo>();
  interact = false;
  said: Line[] = [];
  spawned: SpawnSpec[] = [];
  cleaned: string[][] = [];
  rewards: Array<{ cash: number; trust: number; grade: string }> = [];
  failedWith: string[] = [];
  completedN = 0;
  restored: string[] = [];
  prompt: string | null = null;
  objective = '';
  marker: Marker | null = null;
  cash = 1000;
  choice: ((i: number) => void) | null = null;
  s = { damageTaken: 0, civilianHarm: 0, crimes: 0, vehicleImpacts: 0, cargo: null as number | null };
  time(): number { return this.t; }
  player() { return this.pos; }
  vehicle(tag: string): VInfo | null { return this.vehicles.get(tag) ?? null; }
  canSee(tag: string, range: number): boolean { const v = this.vehicles.get(tag); return !!v && Math.hypot(v.x - this.pos.x, v.z - this.pos.z) < range; }
  consumeInteract(): boolean { const r = this.interact; this.interact = false; return r; }
  setPrompt(t: string | null): void { this.prompt = t; }
  say(l: Line): void { this.said.push(l); }
  banner(): void { /* */ }
  setObjective(t: string): void { this.objective = t; }
  setMarker(m: Marker | null): void { this.marker = m; }
  spawn(s: SpawnSpec): void { this.spawned.push(s); if (s.kind === 'vehicle') this.vehicles.set(s.tag, { x: s.x, z: s.z, speed: 0, healthPct: 100, cargo: s.cargo ? 100 : null, alive: true, driverIsPlayer: false, disabled: false }); }
  cleanup(tags: string[]): void { this.cleaned.push(tags); }
  reward(cash: number, trust: number, grade: string): void { this.rewards.push({ cash, trust, grade }); }
  spend(c: number): boolean { if (this.cash < c) return false; this.cash -= c; return true; }
  restore(cp: { id: string }): void { this.restored.push(cp.id); }
  checkpoint(): void { /* */ }
  requestGreen(): void { /* */ }
  stats() { return this.s; }
  failed(r: string): void { this.failedWith.push(r); }
  completed(): void { this.completedN++; }
  choose(_p: string, _o: string[], cb: (i: number) => void): void { this.choice = cb; }
}

function tick(rt: MissionRuntime, host: FakeHost, secs: number): void { for (let i = 0; i < secs * 60; i++) { host.t += 1 / 60; rt.update(1 / 60); } }

describe('mission graph runtime', () => {
  const world = new World(1107);
  const defs = storyMissions(world);

  it('all authored and generated missions validate', () => {
    for (const d of [...defs, streetCircuit(), courierRun(world, 5, 'urgent'), courierRun(world, 6, 'fragile'), courierRun(world, 7, 'quiet'), recoveryCall(world, 8)]) expect(validateMission(d)).toEqual([]);
  });

  it('rejects a broken graph', () => {
    const bad = { ...defs[0], nodes: { ...defs[0].nodes, intro: { t: 'dialogue', lines: [], next: 'nowhere' } } } as MissionDef;
    expect(validateMission(bad).length).toBeGreaterThan(0);
  });

  it('First Shift runs start to finish: bike, pickup, deliver, reward exactly once', () => {
    const host = new FakeHost();
    const rt = new MissionRuntime(host);
    rt.start(defs[0]);
    expect(host.spawned.some((s) => s.kind === 'vehicle' && s.tag === 'kestrel')).toBe(true);
    tick(rt, host, 12);
    expect(host.objective).toMatch(/Kestrel/);
    host.pos.vehicleTag = 'kestrel'; host.pos.onFoot = false;
    tick(rt, host, 14);
    expect(host.objective).toMatch(/Collect the parcel/);
    const print = world.poi('printshop');
    host.pos = { ...host.pos, x: print.x, z: print.z, onFoot: true, vehicleTag: null };
    tick(rt, host, 0.5);
    expect(host.prompt).toContain('Collect');
    host.interact = true;
    tick(rt, host, 0.2);
    tick(rt, host, 10);
    expect(host.objective).toMatch(/Deliver/);
    const tower = world.poi('tower');
    const k = host.vehicles.get('kestrel')!;
    k.x = tower.x; k.z = tower.z - 6;
    host.pos = { ...host.pos, x: tower.x, z: tower.z - 6, onFoot: false, vehicleTag: 'kestrel', speed: 0 };
    tick(rt, host, 1);
    expect(host.rewards.length).toBe(1);
    expect(host.completedN).toBe(1);
    tick(rt, host, 20);
    expect(host.rewards.length).toBe(1); // paid once
    expect(rt.status).toBe('complete');
  });

  it('fails when the tagged vehicle is wrecked, retries from the checkpoint, and can be abandoned', () => {
    const host = new FakeHost();
    const rt = new MissionRuntime(host);
    rt.start(defs[0]);
    tick(rt, host, 12);
    host.pos.vehicleTag = 'kestrel'; host.pos.onFoot = false;
    tick(rt, host, 14);
    const print = world.poi('printshop');
    host.pos = { ...host.pos, x: print.x, z: print.z, onFoot: true, vehicleTag: null };
    tick(rt, host, 0.3);
    host.interact = true;
    tick(rt, host, 0.3); // checkpoint passed
    host.vehicles.get('kestrel')!.alive = false;
    tick(rt, host, 1);
    expect(rt.status).toBe('failed');
    expect(host.failedWith[0]).toMatch(/wrecked/);
    rt.retry();
    expect(rt.status).toBe('running');
    expect(host.restored).toContain('cp-pickup');
    rt.abandon();
    expect(rt.status).toBe('idle');
    expect(host.cleaned.length).toBeGreaterThan(0);
  });

  it('Hot Cargo branches on the dialogue choice and fails when the cargo is destroyed', () => {
    const host = new FakeHost();
    const rt = new MissionRuntime(host);
    rt.start(defs[1]);
    tick(rt, host, 10);
    const d = world.poi('dockside');
    host.pos = { ...host.pos, x: d.x, z: d.z + 1.5 };
    tick(rt, host, 0.3);
    host.interact = true;
    tick(rt, host, 0.3);
    expect(host.choice).not.toBeNull();
    host.choice!(1); // bribe
    expect(host.cash).toBe(960);
    tick(rt, host, 8);
    expect(host.spawned.some((s) => s.kind === 'vehicle' && s.tag === 'van')).toBe(true);
    expect(host.objective).toMatch(/narrow/);
    host.vehicles.get('van')!.cargo = 0;
    tick(rt, host, 0.5);
    expect(rt.status).toBe('failed');
  });

  it('timed objectives fail when the clock runs out', () => {
    const host = new FakeHost();
    const rt = new MissionRuntime(host);
    rt.start(courierRun(world, 11, 'urgent'));
    const a = rt.def!.nodes['o1'];
    if (a.t === 'objective' && a.cond.c === 'interact') host.pos = { ...host.pos, x: a.cond.x, z: a.cond.z };
    tick(rt, host, 0.3);
    host.interact = true;
    tick(rt, host, 0.3);
    expect(host.objective).toMatch(/Deliver/);
    tick(rt, host, 400);
    expect(rt.status).toBe('failed');
  });

  it('civilian harm reduces the grade and the reward', () => {
    const run = (harm: number) => {
      const host = new FakeHost();
      host.s.civilianHarm = harm;
      const rt = new MissionRuntime(host);
      rt.start(courierRun(world, 21, 'quiet'));
      const a = rt.def!.nodes['o1'];
      const b = rt.def!.nodes['o2'];
      if (a.t === 'objective' && a.cond.c === 'interact') host.pos = { ...host.pos, x: a.cond.x, z: a.cond.z };
      tick(rt, host, 0.3); host.interact = true; tick(rt, host, 0.3);
      if (b.t === 'objective' && b.cond.c === 'zone') host.pos = { ...host.pos, x: b.cond.x, z: b.cond.z };
      tick(rt, host, 0.5);
      return host.rewards[0];
    };
    const clean = run(0);
    const dirty = run(3);
    expect(dirty.cash).toBeLessThan(clean.cash);
  });
});

describe('missions inside the live game', () => {
  it('starting, abandoning and restarting a mission leaves free roam intact', () => {
    const g = new Game(1107);
    g.newGame();
    for (let i = 0; i < 120; i++) g.step(emptyInput(), 1 / 60);
    expect(g.missions.running).toBe(true);
    expect(g.vehicles.some((v) => v.tag === 'kestrel')).toBe(true);
    g.abandonMission();
    expect(g.missions.running).toBe(false);
    expect(g.vehicles.some((v) => v.tag === 'kestrel')).toBe(false);
    expect(g.startMission('first-shift')).toBe(true);
  });
});
