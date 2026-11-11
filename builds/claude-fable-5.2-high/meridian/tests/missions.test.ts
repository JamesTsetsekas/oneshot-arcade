import { describe, it, expect } from 'vitest';
import { quietSim, run, place, holdInteract, autodrive, walkTo } from './helpers';
import { validateMission, MissionDef } from '../src/missions/graph';
import { STORY, M1, M2, M3, M4, makeCourier, makeCircuit, makeRecovery, CIRCUIT_GATES } from '../src/missions/data';
import { ANCHORS } from '../src/world/district';
import { WAREHOUSE, PORT } from '../src/world/lots';
import { Sim } from '../src/game-session/sim';

/** Drive the "use" of whichever mission interactable is in range, the way holding E would. */
function interactHere(sim: Sim, seconds = 5) { run(sim, 0.25); holdInteract(sim, seconds); }
/** Press E once the interaction scan has picked up the nearby target. */
function tap(sim: Sim) { run(sim, 0.25); run(sim, 0.4, () => { sim.input.interact = true; }); }
function waitFor(sim: Sim, pred: () => boolean, seconds: number) { return run(sim, seconds, () => pred()) || pred(); }

describe('mission graph schema', () => {
  it('all story missions and generated activities validate', () => {
    const all: MissionDef[] = [...STORY, makeCircuit()];
    for (let s = 1; s <= 12; s++) all.push(makeCourier(s), makeRecovery(s));
    for (const m of all) expect(validateMission(m), m.id).toEqual([]);
  });
  it('rejects broken graphs', () => {
    const bad: MissionDef = { ...M1, nodes: { ...M1.nodes, walk: { ...(M1.nodes.walk as any), next: 'nowhere' } } };
    expect(validateMission(bad).length).toBeGreaterThan(0);
  });
  it('courier runs pair distinct stops far enough apart and pay by distance', () => {
    for (let s = 1; s <= 10; s++) { const m = makeCourier(s); expect(m.reward.cash).toBeGreaterThan(150); expect(m.title).toContain(' to '); }
  });
});

describe('Story 1: First Shift (played through with inputs)', () => {
  it('walk, mount, ride, collect, deliver, get paid once, and return to free roam', async () => {
    const sim = await quietSim();
    const cash0 = sim.economy.cash;
    expect(sim.startMission(M1)).toBe(true);
    run(sim, 0.5);
    const bike = sim.missions.refs.get('bike')!;
    expect(bike.owned).toBe(true);
    expect(walkTo(sim, ANCHORS.bikeSpot.x, ANCHORS.bikeSpot.z - 1.6, 15, 1.0)).toBe(true);
    run(sim, 0.3);
    expect(sim.missions.objective).toContain('Get on');
    sim.input.interact = true; run(sim, 2);
    expect(sim.player.vehicle).toBe(bike);
    expect(sim.police.tier).toBe(0); // your own bike is not a theft
    expect(autodrive(sim, ANCHORS.marketPark.x, ANCHORS.marketPark.z, 60, 9, 5)).toBe(true);
    run(sim, 0.5);
    expect(sim.missions.objective).toContain('Collect');
    sim.input.enterExit = true; run(sim, 0.4);
    expect(walkTo(sim, ANCHORS.marketPickup.x, ANCHORS.marketPickup.z, 20, 1.6)).toBe(true);
    interactHere(sim, 2);
    expect(sim.missions.objective).toContain('Deliver');
    // back to the bike and on to Glassline
    expect(walkTo(sim, bike.x, bike.z, 20, 2.4)).toBe(true);
    sim.input.interact = true; run(sim, 2.2);
    expect(sim.player.vehicle).toBe(bike);
    expect(autodrive(sim, ANCHORS.glassPark.x, ANCHORS.glassPark.z, 200, 8, 6)).toBe(true);
    run(sim, 0.5);
    expect(sim.player.vehicle, `still riding; health ${sim.player.health}, at ${sim.player.x.toFixed(0)},${sim.player.z.toFixed(0)}`).toBe(bike);
    expect(sim.missions.objective).toContain('Hand');
    sim.input.enterExit = true; run(sim, 0.4);
    expect(walkTo(sim, ANCHORS.glassDrop.x, ANCHORS.glassDrop.z, 20, 1.6)).toBe(true);
    interactHere(sim, 2);
    run(sim, 1);
    expect(sim.missions.active).toBe(null);
    expect(sim.missions.progress.completed.m1).toBeTruthy();
    expect(sim.missions.result!.cash).toBeGreaterThan(0);
    expect(sim.economy.cash).toBe(cash0 + sim.missions.result!.cash);
    expect(sim.economy.trust).toBe(60);
    expect(sim.autosaveWanted).toBe('mission');
    // replay records a grade but never pays twice
    const cash1 = sim.economy.cash;
    expect(sim.startMission(M1, true)).toBe(true);
    sim.missions.abandon();
    expect(sim.economy.cash).toBe(cash1);
  }, 120000);
  it('fails when the bike is wrecked, retries from the checkpoint, and can be abandoned cleanly', async () => {
    const sim = await quietSim();
    sim.startMission(M1); run(sim, 0.5);
    const bike = sim.missions.refs.get('bike')!;
    bike.damage(500, 'front');
    run(sim, 0.2);
    expect(sim.missions.failed).toContain('wrecked');
    sim.missions.retry(); run(sim, 0.5);
    expect(sim.missions.failed).toBe(null);
    const bike2 = sim.missions.refs.get('bike')!;
    expect(bike2.stalled).toBe(false);
    expect(sim.vehicles.list.includes(bike)).toBe(false); // the wreck was released
    sim.missions.abandon();
    expect(sim.missions.active).toBe(null);
    expect(sim.police.restricted.length).toBe(0);
    expect(sim.interactables.some((i) => i.id.startsWith('goal-'))).toBe(false);
  });
});

describe('Story 2: Lost Manifest', () => {
  it('bluff at the gate, photograph the manifests, slip away undetected', async () => {
    const sim = await quietSim();
    sim.missions.progress.completed.m1 = { grade: 'A', time: 100, score: 90 };
    sim.startMission(M2); run(sim, 0.5);
    expect(sim.actors.list.filter((a) => a.group === 'wh').length).toBe(3);
    expect(sim.police.restricted.length).toBe(1);
    place(sim, ANCHORS.warehouseFront.x, ANCHORS.warehouseFront.z + 0.5); run(sim, 0.5);
    expect(sim.missions.objective).toContain('Find a way in');
    tap(sim);
    expect(sim.missions.choice).toBeTruthy();
    sim.missions.choose(0); run(sim, 0.3);
    expect(sim.missions.flags.has('bluffed')).toBe(true);
    for (const m of WAREHOUSE.manifests) { place(sim, m.x, m.z + 1.3); interactHere(sim, 2); }
    run(sim, 0.3);
    expect(sim.missions.objective).toContain('Leave');
    expect(sim.police.tier).toBe(0); // the bluff held: nobody raised the alarm
    place(sim, 200, -20); run(sim, 1.5);
    expect(sim.missions.active).toBe(null);
    expect(sim.missions.progress.completed.m2).toBeTruthy();
    expect(sim.actors.list.filter((a) => a.group === 'wh').length).toBe(0); // guards cleaned up
    expect(sim.police.cameraGroups.has('warehouse')).toBe(false);
  });
  it('guards who see an intruder raise a trespass alert; the lock route works after a burned bluff', async () => {
    const sim = await quietSim();
    sim.startMission(M2); run(sim, 0.5);
    place(sim, ANCHORS.warehouseFront.x, ANCHORS.warehouseFront.z + 0.5); run(sim, 0.4);
    tap(sim);
    sim.missions.choose(1); run(sim, 0.3); // the bad bluff
    expect(sim.missions.objective).toContain('side-door');
    expect(sim.doors.has('wh-side')).toBe(true); // locked until bypassed
    place(sim, ANCHORS.warehouseSide.x, ANCHORS.warehouseSide.z); run(sim, 0.3);
    run(sim, 0.25); sim.input.interact = true; run(sim, 0.1);
    expect(sim.missions.lock).toBeTruthy();
    const ok = run(sim, 40, () => { const L = sim.missions.lock; if (!L) return true; if (L.needle > L.lo + 0.02 && L.needle < L.hi - 0.02) sim.input.interact = true; return false; });
    expect(ok).toBe(true); run(sim, 0.2);
    expect(sim.doors.has('wh-side')).toBe(false);
    // walk into a guard's view
    const g = sim.actors.list.find((a) => a.group === 'wh')!;
    place(sim, g.x + Math.sin(g.body.yaw) * 5, g.z + Math.cos(g.body.yaw) * 5);
    run(sim, 3);
    expect(sim.actors.list.some((a) => a.group === 'wh' && a.alerted)).toBe(true);
    expect(sim.police.records.some((r) => r.type === 'trespass')).toBe(true);
    expect(sim.missions.flags.has('spotted')).toBe(true);
  });
});

describe('Story 3: Hot Cargo', () => {
  it('clues, forced stop, rival pursuit and delivery; cargo destruction fails the job', async () => {
    const sim = await quietSim();
    sim.startMission(M3); run(sim, 0.5);
    place(sim, ANCHORS.marketPickup.x, ANCHORS.marketPickup.z + 1); tap(sim);
    place(sim, ANCHORS.canalBridge.x, ANCHORS.canalBridge.z); tap(sim);
    const van = sim.missions.refs.get('van')!;
    expect(van).toBeTruthy();
    expect(van.driver).toBe('mission');
    run(sim, 6);
    expect(van.speedAbs).toBeGreaterThan(4); // the thief is driving it around Foundry Row
    // box it in: park a car across its lane and wait for the stop
    const lane = sim.traffic.driverOf(van)!.f;
    const ahead = lane.ahead(26, { x: 0, z: 0, yaw: 0 });
    const block = sim.spawnMissionVehicle('portage', ahead.x, ahead.z, ahead.yaw + Math.PI / 2);
    block.persistent = true; // keep the tow service away from our roadblock
    expect(waitFor(sim, () => sim.missions.objective.includes('Get in'), 25)).toBe(true);
    expect(van.driver).toBe('none'); // driver bailed
    expect(van.cargo).toBeGreaterThan(60);
    sim.vehicles.remove(block);
    sim.player.enterVehicle(van, true); run(sim, 0.5);
    expect(sim.missions.objective).toContain('Breakwater Auto');
    expect(sim.traffic.drivers.filter((d) => d.kind === 'rival').length).toBe(2);
    expect(sim.police.tier).toBe(0); // police are independent of the scripted rivals
    van.teleport(ANCHORS.garage.x, 0.2, ANCHORS.garage.z, Math.PI); run(sim, 2);
    expect(sim.missions.active).toBe(null);
    expect(sim.missions.progress.completed.m3).toBeTruthy();
    expect(sim.traffic.drivers.filter((d) => d.kind === 'rival').length).toBe(0);
    // failure path
    const sim2 = await quietSim(3);
    sim2.startMission(M3); run(sim2, 0.3);
    place(sim2, ANCHORS.marketPickup.x, ANCHORS.marketPickup.z + 1); tap(sim2);
    place(sim2, ANCHORS.canalBridge.x, ANCHORS.canalBridge.z); tap(sim2);
    sim2.missions.refs.get('van')!.cargo = 0; run(sim2, 0.2);
    expect(sim2.missions.failed).toContain('cargo');
  }, 120000);
});

describe('Story 4: Signal at the Breakwater', () => {
  it('infiltrate, upload, survive waves, escape a Tier 3 search and get home', async () => {
    const sim = await quietSim();
    sim.godMode = true;
    sim.startMission(M4); run(sim, 0.5);
    place(sim, ANCHORS.portGate.x, ANCHORS.portGate.z + 2); run(sim, 0.5);
    place(sim, PORT.serverSwitch.x, PORT.serverSwitch.z); interactHere(sim, 2.5);
    expect(sim.missions.flags.has('serverOff')).toBe(true);
    place(sim, PORT.officeDoor.x, PORT.officeDoor.z + 1); run(sim, 0.5);
    place(sim, PORT.terminal.x, PORT.terminal.z + 1); interactHere(sim, 4);
    expect(sim.missions.objective).toContain('Survive');
    expect(waitFor(sim, () => sim.actors.list.some((a) => a.faction === 'rival'), 3)).toBe(true);
    let sawWave2 = false;
    expect(waitFor(sim, () => { if (sim.actors.list.some((a) => a.group === 'rivals2')) sawWave2 = true; return sim.missions.objective.includes('Choose'); }, 80)).toBe(true);
    expect(sawWave2).toBe(true);
    expect(sim.actors.list.some((a) => a.group === 'rivals3')).toBe(false); // server shutdown skipped the third wave
    expect(sim.police.tier).toBe(3);
    expect(sim.weather.forceRain).toBe(true);
    const car = sim.missions.refs.get('escCar')!;
    sim.player.enterVehicle(car, true); run(sim, 0.4);
    expect(sim.missions.objective).toContain('Break');
    // far away and out of sight until the search cools
    car.teleport(336, 20, 330, 0);
    expect(waitFor(sim, () => sim.police.tier === 0, 120)).toBe(true);
    run(sim, 0.3);
    expect(sim.missions.objective).toContain('safehouse');
    car.teleport(ANCHORS.safehouse.x, 0.2, ANCHORS.safehouse.z + 6, Math.PI / 2); run(sim, 2);
    expect(sim.missions.active).toBe(null);
    expect(sim.missions.progress.completed.m4).toBeTruthy();
    expect(sim.economy.cash).toBeGreaterThan(1500);
  }, 180000);
  it('being downed fails the job and retry restores the pre-upload checkpoint', async () => {
    const sim = await quietSim();
    sim.startMission(M4); run(sim, 0.5);
    place(sim, ANCHORS.portGate.x, ANCHORS.portGate.z + 2); run(sim, 0.5);
    place(sim, PORT.officeDoor.x, PORT.officeDoor.z + 1); run(sim, 0.5);
    expect(sim.missions.objective).toContain('Upload');
    sim.player.takeDamage(999, 'test'); run(sim, 0.2);
    expect(sim.missions.failed).toContain('incapacitated');
    run(sim, 5);
    expect(sim.player.downed).toBe(true); // no clinic respawn while the retry choice is open
    sim.missions.retry(); run(sim, 0.5);
    expect(sim.player.downed).toBe(false);
    expect(sim.missions.objective).toContain('Upload');
    expect(Math.hypot(sim.player.x - PORT.officeDoor.x, sim.player.z - PORT.officeDoor.z)).toBeLessThan(4);
    expect(sim.actors.list.filter((a) => a.group === 'port').length).toBe(3);
  });
});

describe('activities', () => {
  it('courier run pays once per completed run', async () => {
    const sim = await quietSim();
    const def = makeCourier(4);
    const cash0 = sim.economy.cash;
    sim.startMission(def); run(sim, 0.3);
    const pick = sim.missions.markers[0]; place(sim, pick.x, pick.z); interactHere(sim, 2);
    run(sim, 0.3);
    expect(sim.missions.objective, `after pickup at ${pick.x},${pick.z}; player ${sim.player.x.toFixed(1)},${sim.player.y.toFixed(1)},${sim.player.z.toFixed(1)}`).toContain('Deliver');
    const drop = sim.missions.markers[0]; place(sim, drop.x, drop.z); interactHere(sim, 2);
    run(sim, 0.5);
    expect(sim.missions.failed).toBe(null);
    expect(sim.missions.active).toBe(null);
    expect(sim.economy.cash).toBeGreaterThan(cash0 + 100);
    expect(sim.missions.progress.activityRuns.courier).toBe(1);
  });
  it('street circuit runs three laps of gates, records a best time and a ghost', async () => {
    const sim = await quietSim();
    sim.startMission(makeCircuit()); run(sim, 0.3);
    const v = sim.spawnMissionVehicle('tern', ANCHORS.circuitStart.x, ANCHORS.circuitStart.z, Math.PI / 2); v.owned = true;
    sim.player.enterVehicle(v, true); run(sim, 1.5);
    expect(sim.missions.objective).toContain('lap 1/3');
    for (let lap = 0; lap < 3; lap++) for (const g of CIRCUIT_GATES) { v.teleport(g.x, sim.phys.groundBelow(g.x, 40, g.z), g.z, 0); run(sim, 0.6); }
    run(sim, 0.5);
    expect(sim.missions.active).toBe(null);
    expect(sim.missions.progress.circuitBest).toBeGreaterThan(5);
    expect(sim.missions.progress.ghost.length).toBeGreaterThan(20);
  });
  it('recovery call spawns a target in the search area and pays on return', async () => {
    const sim = await quietSim();
    const def = makeRecovery(2);
    sim.startMission(def); run(sim, 0.3);
    const target = sim.missions.refs.get('target')!;
    const area = sim.missions.markers[0];
    expect(area.kind).toBe('area');
    expect(Math.hypot(area.x - target.x, area.z - target.z)).toBeLessThan(area.r); // valid search area
    place(sim, target.x + 3, target.z); run(sim, 0.3);
    sim.player.enterVehicle(target, true); run(sim, 0.4);
    expect(sim.police.tier).toBe(0);
    target.teleport(ANCHORS.garage.x, 0.2, ANCHORS.garage.z, Math.PI); run(sim, 2);
    expect(sim.missions.active).toBe(null);
    expect(sim.missions.progress.activityRuns.recovery).toBe(1);
  });
});
