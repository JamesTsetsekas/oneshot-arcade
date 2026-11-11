import { describe, it, expect } from 'vitest';
import { Sim } from '../src/game-session/sim';
import { Physics } from '../src/physics/physics';
import { quietSim, run, place, walkTo } from './helpers';
import { ANCHORS, terrainH, WATER_Y } from '../src/world/district';
import { laneProject } from '../src/world/roads';

describe('player on foot', () => {
  it('walks, sprints with stamina, jumps and crouches', async () => {
    const sim = await quietSim();
    const b = sim.player.body;
    place(sim, -150, -80, 0);
    sim.input.camYaw = Math.PI / 2; // run east along Tide Street
    const z0 = b.x;
    sim.input.moveZ = 1; run(sim, 2);
    const jog = (b.x - z0) / 2;
    expect(jog).toBeGreaterThan(3.6); expect(jog).toBeLessThan(4.6);
    sim.input.sprint = true; const z1 = b.x; run(sim, 2);
    expect((b.x - z1) / 2).toBeGreaterThan(5.5);
    expect(sim.player.stamina).toBeLessThan(0.8);
    run(sim, 8); // stamina runs out after ~8 s
    expect(sim.player.stamina).toBeLessThan(0.05);
    sim.input.sprint = false; sim.input.moveZ = 0; run(sim, 0.5);
    sim.input.jump = true; let top = b.y; run(sim, 0.8, () => { top = Math.max(top, b.y); });
    expect(top - terrainH(b.x, b.z)).toBeGreaterThan(0.6); expect(top - terrainH(b.x, b.z)).toBeLessThan(1.1);
    sim.input.crouch = true; sim.input.moveZ = 1; const z2 = b.x; run(sim, 2);
    expect(Math.abs(b.x - z2) / 2).toBeLessThan(2.0);
    expect(Math.abs(b.x - z2) / 2).toBeGreaterThan(1.2);
  });
  it('vaults a low wall and climbs out of the harbor', async () => {
    const sim = await quietSim();
    const b = sim.player.body;
    sim.phys.addStaticBox(-100, 0.6, -300, 3, 0.6, 0.3); sim.phys.step();
    place(sim, -100, -303, 0);
    sim.input.camYaw = 0; sim.input.moveZ = 1; run(sim, 0.6);
    sim.input.jump = true; run(sim, 1.6);
    expect(b.z).toBeGreaterThan(-300.2); // over or on top of the wall
    sim.input.moveZ = 0;
    // into the sea south of the quay, then swim back and climb out
    b.teleport(0, WATER_Y - 1.4, -440, 0); run(sim, 1);
    expect(b.state).toBe('swim');
    sim.input.camYaw = 0; sim.input.moveZ = 1;
    run(sim, 8, () => { if (b.state === 'swim' && b.blocked > 0.5) sim.input.jump = true; });
    sim.input.moveZ = 0; run(sim, 1);
    expect(b.z).toBeGreaterThan(-436); expect(b.y).toBeGreaterThan(-0.2);
  });
  it('fires, reloads, heals, and recovers from being downed', async () => {
    const sim = await quietSim();
    const p = sim.player;
    place(sim, -100, -80, 0);
    p.selectSlot('sidearm'); run(sim, 0.4);
    sim.input.camX = p.x; sim.input.camY = p.y + 1.6; sim.input.camZ = p.z;
    const mag0 = p.inv.mags.wren;
    sim.input.fire = true; sim.input.firePressed = true; run(sim, 0.1); sim.input.fire = false;
    expect(p.inv.mags.wren).toBe(mag0 - 1);
    sim.input.reload = true; run(sim, 2);
    expect(p.inv.mags.wren).toBe(12);
    p.takeDamage(60, 'test'); expect(p.health).toBe(40);
    sim.input.medkit = true; run(sim, 1.5);
    expect(p.health).toBe(100); expect(p.inv.medkits).toBe(0);
    const cash0 = sim.economy.cash;
    p.takeDamage(500, 'test'); expect(p.downed).toBe(true);
    run(sim, 4);
    expect(p.downed).toBe(false); expect(p.health).toBe(100);
    expect(Math.hypot(p.x - ANCHORS.safehouse.x, p.z - ANCHORS.safehouse.z)).toBeLessThan(6); // respawns beside the safehouse door
    expect(sim.economy.cash).toBeLessThan(cash0); // modest medical fee
    expect(p.inv.sidearm).toBe('wren'); // no loss of gear
  });
});

describe('vehicles in the session', () => {
  it('enters, drives and exits every vehicle type', async () => {
    const sim = await quietSim();
    for (const type of ['dart', 'tern', 'coaster', 'cutlass', 'portage', 'warden', 'swift', 'sirocco']) {
      const v = sim.spawnMissionVehicle(type, -100, -304, Math.PI / 2); v.owned = true;
      place(sim, -100, -306.6, 0); run(sim, 0.3);
      sim.input.interact = true; run(sim, 2.2);
      expect(sim.player.vehicle, type).toBe(v);
      sim.input.moveZ = 1; run(sim, 2.5);
      expect(v.speed).toBeGreaterThan(6);
      run(sim, 4, () => { sim.input.moveZ = v.speed > 0.8 ? -1 : 0; }); sim.input.moveZ = 0;
      run(sim, 0.5);
      expect(v.speedAbs).toBeLessThan(1);
      sim.input.enterExit = true; run(sim, 0.3);
      expect(sim.player.vehicle).toBe(null);
      expect(sim.player.body.state).toBe('normal');
      sim.vehicles.remove(v);
    }
  });
});

describe('living city', () => {
  it('runs traffic and pedestrians for two minutes without failures', async () => {
    const sim = new Sim(await Physics.create(), 11);
    sim.dispatch.enabled = false;
    place(sim, -11, -79, 0);
    sim.prewarm();
    expect(sim.traffic.drivers.length).toBeGreaterThan(12);
    expect(sim.peds.list.length).toBeGreaterThan(30);
    let impacts = 0, redRunners = 0, redChecks = 0, flipped = 0, maxLat = 0, latSum = 0, latN = 0;
    sim.bus.on('vehicleImpact', () => impacts++);
    const states = new Set<string>(), pedStates = new Set<string>();
    const pr = { s: 0, lat: 0 };
    run(sim, 120, (t) => {
      if (Math.round(t * 60) % 30 !== 0) return;
      for (const d of sim.traffic.drivers) {
        states.add(d.state);
        if (d.v.upY < 0.5) flipped++;
        laneProject(d.f.lane, d.v.x, d.v.z, pr); latSum += Math.abs(pr.lat); latN++; maxLat = Math.max(maxLat, Math.abs(pr.lat));
        const l = d.f.lane;
        if (l.kind === 'lane' && l.toInter && l.toInter.signal && sim.signals.laneLight(l) === 'red' && d.f.distToEnd < 5 && d.f.distToEnd > 1) { redChecks++; if (d.v.speed > 3) redRunners++; }
      }
      for (const p of sim.peds.list) { pedStates.add(p.state); expect(Number.isFinite(p.x + p.z)).toBe(true); }
    });
    console.log('traffic states', [...states].join(','), '| ped states', [...pedStates].join(','), '| impacts', impacts, 'redChecks', redChecks, 'redRunners', redRunners, 'meanLat', (latSum / latN).toFixed(2), 'maxLat', maxLat.toFixed(1), 'drivers', sim.traffic.drivers.length, 'peds', sim.peds.list.length);
    expect(flipped).toBe(0);
    expect(latSum / latN).toBeLessThan(0.8);
    expect(impacts).toBeLessThan(12);
    expect(redChecks).toBeGreaterThan(3);
    expect(redRunners / Math.max(1, redChecks)).toBeLessThan(0.15);
    expect(states.has('StopSignal')).toBe(true); expect(states.has('Turn')).toBe(true);
    expect(pedStates.has('WalkRoute')).toBe(true); expect(pedStates.has('CrossStreet')).toBe(true);
    expect(sim.traffic.drivers.length).toBeGreaterThan(10);
    expect(sim.peds.list.length).toBeGreaterThan(25);
  });
  it('pedestrians react differently to gunfire, and traffic panics', async () => {
    const sim = new Sim(await Physics.create(), 5);
    sim.dispatch.enabled = false;
    place(sim, -11, -60, 0);
    sim.prewarm();
    sim.bus.emit('noise', { kind: 'gunshot', x: -11, z: -60, radius: 70, byPlayer: true });
    const seen = new Set<string>();
    run(sim, 3, () => { for (const p of sim.peds.list) if (Math.hypot(p.x + 11, p.z + 60) < 70) seen.add(p.state); });
    expect(seen.has('Flee') || seen.has('Panic')).toBe(true);
    expect(seen.size).toBeGreaterThanOrEqual(3); // not everyone mirrors the same reaction
  });
});
