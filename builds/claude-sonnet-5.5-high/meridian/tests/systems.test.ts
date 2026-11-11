import { describe, expect, it } from 'vitest';
import { World, LINES, ROAD_HALF } from '../src/sim/world';
import { PedGraph, RoadGraph, SIGNAL_CYCLE, canStartCrossing, signalPhaseAt, secondsToGreen, SignalController } from '../src/sim/nav';
import { collideVehicleWorld, collideVehicles, resolveHuman } from '../src/sim/collision';
import { VEHICLES, makeVehicle } from '../src/sim/vehicle';
import { Game } from '../src/sim/game';
import { emptyInput } from '../src/sim/types';
import { WEAPONS, falloff } from '../src/sim/weapons';
import { traceShot, damageHuman } from '../src/sim/combat';
import { makeHuman } from '../src/sim/peds';
import { SHOP, buy, newInventory, trustLevel, repairCost } from '../src/sim/economy';
import { atmosphereAt } from '../src/render/atmosphere';

const DT = 1 / 60;
const run = (g: Game, s: number, inp = emptyInput()) => { for (let i = 0; i < s * 60; i++) g.step(inp, DT); };

describe('world, road graph and signals', () => {
  const world = new World(1107);
  const roads = new RoadGraph();
  it('generates a deterministic district with all POIs and no building on a road', () => {
    const w2 = new World(1107);
    expect(w2.buildings.length).toBe(world.buildings.length);
    for (const b of world.buildings) {
      if (b.district === 'Outskirts') continue;
      const cx = (b.minX + b.maxX) / 2;
      const cz = (b.minZ + b.maxZ) / 2;
      expect(world.isRoad(cx, cz)).toBe(false);
      // building footprints never overlap the road surface
      for (const l of LINES) { expect(b.minX < l + ROAD_HALF && b.maxX > l - ROAD_HALF).toBe(false); expect(b.minZ < l + ROAD_HALF && b.maxZ > l - ROAD_HALF).toBe(false); }
    }
    for (const id of ['safehouse', 'store', 'kiosk', 'garage', 'precinct', 'printshop', 'tower', 'dockside']) expect(() => world.poi(id)).not.toThrow();
  });

  it('every POI door sits on a walkable sidewalk (not inside a collider)', () => {
    for (const p of world.pois) {
      if (p.landmark) continue;
      const pos = { x: p.x, z: p.z };
      resolveHuman(world, pos, 0.35, 0);
      expect(Math.hypot(pos.x - p.x, pos.z - p.z)).toBeLessThan(0.5);
    }
  });

  it('the lane graph is fully connected with right-hand lanes and no dead ends', () => {
    expect(roads.lanes.length).toBe(2 * 2 * 7 * 6);
    for (let i = 0; i < 49; i++) expect(roads.next(roads.incoming[i][0]).length).toBeGreaterThan(0);
    const route = roads.route(0, 48);
    expect(route[0]).toBe(0);
    expect(route[route.length - 1]).toBe(48);
    expect(route.length).toBe(13);
  });

  it('signals alternate axes with yellow and an all-red gap; mission API can hold a phase', () => {
    let overlap = 0;
    for (let t = 0; t < SIGNAL_CYCLE; t += 0.5) if (signalPhaseAt(t, 'x') === 'green' && signalPhaseAt(t, 'z') === 'green') overlap++;
    expect(overlap).toBe(0);
    expect(signalPhaseAt(16, 'z')).toBe('yellow');
    expect(secondsToGreen(16, 'z')).toBeGreaterThan(0);
    expect(canStartCrossing(25, 'z')).toBe(true); // z traffic red, x traffic green -> pedestrians cross z roads
    expect(canStartCrossing(5, 'z')).toBe(false);
    const sc = new SignalController();
    sc.requestGreen('x', 1, 10);
    expect(sc.phase(2, 'x')).toBe('green');
    expect(sc.phase(2, 'z')).toBe('red');
  });

  it('pedestrian graph routes across the whole district', () => {
    const pg = new PedGraph();
    const a = pg.nearest(-230, -230);
    const b = pg.nearest(230, 230);
    const r = pg.route(a, b);
    expect(r.length).toBeGreaterThan(10);
    expect(r[r.length - 1]).toBe(b);
  });
});

describe('collisions', () => {
  const world = new World(1107);
  it('a vehicle driven into a building is stopped, damaged and spun, never penetrating', () => {
    const sh = world.poi('safehouse');
    const v = makeVehicle(VEHICLES.hollis, sh.x, sh.z - 5, 0, 'player');
    v.engineOn = true; v.vz = 20; v.speed = 20;
    // north of the safehouse block there is a building wall at z=-150
    let impacts = 0;
    for (let i = 0; i < 90; i++) { v.z += v.vz * DT; const imp = collideVehicleWorld(world, v); if (imp.solid) impacts++; }
    expect(impacts).toBeGreaterThan(0);
    expect(v.health).toBeLessThan(v.def.health);
    const hit = world.query(v.x - 1, v.z - 1, v.x + 1, v.z + 1).some((c) => c.tag === 'building' && v.x > c.minX && v.x < c.maxX && v.z > c.minZ && v.z < c.maxZ);
    expect(hit).toBe(false);
  });

  it('vehicle-vehicle impacts exchange momentum and damage both', () => {
    const a = makeVehicle(VEHICLES.cormorant, 0, 0, 0, 'player');
    const b = makeVehicle(VEHICLES.tern, 0, 3.6, Math.PI, 'traffic');
    a.vz = 20; b.vz = -5;
    const sp = collideVehicles(a, b);
    expect(sp).toBeGreaterThan(5);
    expect(a.vz).toBeLessThan(20);
    expect(b.health).toBeLessThan(b.def.health);
    expect(b.health).toBeLessThan(a.health * (b.def.health / a.def.health)); // lighter car suffers more
  });

  it('pedestrians slide along walls instead of tunnelling', () => {
    const p = { x: -130, z: -153 };
    for (let i = 0; i < 20; i++) { p.z += 0.2; resolveHuman(world, p, 0.35, 0); }
    expect(p.z).toBeLessThan(-149.5);
  });
});

describe('weapons, hits and combat rules', () => {
  it('hitscan hits humans in zones and is blocked by buildings', () => {
    const g = new Game(1107);
    g.newGame();
    g.humans = [];
    const t = makeHuman('ped', -160, -224, 'resident', 1);
    g.humans.push(t);
    const head = traceShot(g, -160, 1.7, -236, 0, 0, 1, 50);
    expect(head.kind).toBe('human');
    expect(head.head).toBe(true);
    const body = traceShot(g, -160, 1.2, -236, 0, 0, 1, 50);
    expect(body.kind).toBe('human');
    expect(body.head).toBe(false);
    // shooting through a building
    const wall = traceShot(g, -138, 1.2, -153, 0, 0, 1, 40);
    expect(wall.kind).toBe('world');
  });

  it('range falloff reduces damage with distance', () => {
    const w = WEAPONS.pistol;
    expect(falloff(w, 5)).toBe(1);
    expect(falloff(w, 40)).toBeLessThan(0.8);
    expect(falloff(WEAPONS.shotgun, 30)).toBeLessThan(falloff(WEAPONS.carbine, 30));
  });

  it('non-lethal weapons knock out instead of killing; lethal ones kill', () => {
    const g = new Game(1107);
    const a = makeHuman('ped', 0, 0, 'resident', 1);
    a.hp = 10;
    damageHuman(g, a, 50, { lethal: false, source: 'player' });
    expect(a.alive).toBe(true);
    expect(a.state).toBe('Down');
    const b = makeHuman('ped', 0, 0, 'resident', 1);
    b.hp = 10;
    damageHuman(g, b, 50, { lethal: true, source: 'player' });
    expect(b.alive).toBe(false);
  });

  it('player fires, reloads, and ammo is consumed', () => {
    const g = new Game(1107);
    g.newGame();
    run(g, 1);
    g.player.holstered = false;
    g.player.slot = 1;
    const before = g.player.inv.mags.pistol;
    g.step({ ...emptyInput(), firePressed: true, fire: true, aim: true }, DT);
    expect(g.player.inv.mags.pistol).toBe(before - 1);
    run(g, 0.5);
    g.step({ ...emptyInput(), reload: true }, DT);
    run(g, 2);
    expect(g.player.inv.mags.pistol).toBeGreaterThan(before - 1);
  });

  it('firing a weapon is audible: nearby pedestrians react', () => {
    const g = new Game(1107);
    g.newGame();
    g.missions.abandon();
    g.peds.target = 0;
    g.humans = [];
    const p = g.player.human;
    p.x = -160; p.z = -240;
    const w = makeHuman('ped', p.x + 10, p.z, 'resident', 2);
    w.courage = 0.1;
    g.humans.push(w);
    g.noise(p.x, p.z, 80, 'gunfire', true);
    expect(['Panic', 'ReactCurious']).toContain(w.state);
  });
});

describe('economy', () => {
  it('buys gear with cash, respects trust gates and limits', () => {
    const g = new Game(1107);
    const P = g.player;
    P.cash = 1000;
    const carbine = SHOP.find((s) => s.id === 'buy-carbine')!;
    expect(buy(P, carbine).ok).toBe(false); // trust gate
    P.trust = 2;
    expect(buy(P, carbine).ok).toBe(true);
    expect(P.inv.longGun).toBe('carbine');
    expect(P.cash).toBe(1000 - carbine.price);
    const med = SHOP.find((s) => s.id === 'medkit')!;
    P.inv.medkits = 2;
    expect(buy(P, med).ok).toBe(false);
    P.cash = 5;
    expect(buy(P, SHOP.find((s) => s.id === 'armor')!).ok).toBe(false);
  });

  it('trust levels follow authored thresholds and repair cost scales with damage', () => {
    expect(trustLevel(0)).toBe(0);
    expect(trustLevel(1)).toBe(1);
    expect(trustLevel(3.5)).toBe(2);
    expect(trustLevel(100)).toBe(5);
    expect(repairCost(50, 100)).toBeGreaterThan(repairCost(90, 100));
    expect(newInventory().medkits).toBe(1);
  });
});

describe('living city behaviours', () => {
  it('pedestrians wait for the walk signal before crossing', () => {
    const g = new Game(1107);
    g.newGame();
    g.missions.abandon();
    g.humans = [];
    g.traffic.target = 0;
    g.peds.target = 0;
    // spawn a pedestrian on a corner whose next edge is a crossing
    const pg = g.pedGraph;
    let from = -1; let to = -1;
    for (const n of pg.nodes) { const e = pg.edges[n.id].find((q) => q.cross && q.trafficAxis === 'z'); if (e) { from = n.id; to = e.to; break; } }
    const h = g.peds.spawnWalker(g, from);
    h.nodeFrom = from; h.nodeTo = to; h.state = 'WalkRoute'; h.stateT = 0;
    // during z-axis green the pedestrian must not enter the road
    g.t = 3;
    let enteredDuringGreen = false;
    for (let i = 0; i < 60 * 6; i++) { g.step(emptyInput(), DT); if (g.signals.phase(g.t, 'z') === 'green' && g.world.isRoad(h.x, h.z) && Math.abs(h.x - pg.nodes[from].x) > 1.5 && (h.state as string) === 'CrossStreet') enteredDuringGreen = true; }
    expect(enteredDuringGreen).toBe(false);
  });

  it('police units and rivals never spawn inside the camera view', { timeout: 60000 }, () => {
    const g = new Game(5);
    g.newGame();
    g.missions.abandon();
    g.police.setTier(3);
    for (let i = 0; i < 60 * 30; i++) {
      const before = new Set(g.vehicles.filter((v) => v.owner === 'police').map((v) => v.id));
      g.step(emptyInput(), DT);
      for (const v of g.vehicles) if (v.owner === 'police' && !before.has(v.id) && v.driverId !== null) {
        const d = Math.hypot(v.x - g.player.human.x, v.z - g.player.human.z);
        expect(d).toBeGreaterThan(80);
      }
    }
  });

  it('long chaotic play does not produce NaNs and keeps vehicle counts bounded', { timeout: 120000 }, () => {
    const g = new Game(21);
    g.newGame();
    for (let i = 0; i < 60 * 60; i++) {
      const t = i / 60;
      g.step({ ...emptyInput(), moveY: 1, throttle: 1, steer: Math.sin(t * 0.3), moveX: Math.sin(t * 0.5), sprint: true, fire: t % 7 < 1, firePressed: t % 7 < 0.02, aim: t % 9 < 3, interact: Math.abs(t % 11) < 0.02, jump: t % 5 < 0.02 }, DT);
      if (i % 600 === 0) { expect(g.vehicles.length).toBeLessThan(90); expect(g.humans.length).toBeLessThan(120); }
    }
    expect(Number.isFinite(g.player.human.x)).toBe(true);
    for (const v of g.vehicles) expect(Number.isFinite(v.x + v.z)).toBe(true);
  });
});

describe('atmosphere', () => {
  it('day, sunset and night give distinct lighting and rain darkens the sky', () => {
    const noon = atmosphereAt(12, 0);
    const dusk = atmosphereAt(18.8, 0);
    const night = atmosphereAt(23, 0);
    expect(noon.night).toBeLessThan(0.1);
    expect(night.night).toBeGreaterThan(0.9);
    expect(dusk.sunColor.r).toBeGreaterThan(dusk.sunColor.b);
    expect(noon.sunIntensity).toBeGreaterThan(night.sunIntensity);
    expect(atmosphereAt(12, 1).skyTop.b).toBeLessThan(noon.skyTop.b);
  });
});
