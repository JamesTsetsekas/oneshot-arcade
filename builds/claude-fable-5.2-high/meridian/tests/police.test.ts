import { describe, it, expect } from 'vitest';
import { Sim } from '../src/game-session/sim';
import { Physics } from '../src/physics/physics';
import { quietSim, run, place } from './helpers';
import { ANCHORS } from '../src/world/district';
import { UNIT_CAP, UNIT_BUDGET } from '../src/police/units';
import { TIER_HEAT } from '../src/police/police';
import { walkNodes } from '../src/world/roads';

function addWitness(sim: Sim, x: number, z: number) {
  const n = walkNodes.reduce((a, b) => (Math.hypot(a.x - x, a.z - z) < Math.hypot(b.x - x, b.z - z) ? a : b));
  const p = sim.peds.spawnAt(n, 'commuter');
  p.x = x; p.z = z; p.hasPhone = true; p.fear = 1; p.setState('Browse', 999); p.tx = x; p.tz = z;
  return p;
}

describe('crime evidence', () => {
  it('an unwitnessed crime creates no alert', async () => {
    const sim = await quietSim();
    place(sim, 330, 330, 0); // quiet hilltop park
    const rec = sim.police.crime('vehicleTheft', 330, 330)!;
    run(sim, 8);
    expect(rec.reported).toBe(false);
    expect(sim.police.tier).toBe(0);
    expect(sim.police.status).toBe('Unnoticed');
  });
  it('a witness with a phone reports after a 2-5 s call, unless interrupted', async () => {
    const sim = await quietSim();
    place(sim, -11, -40, 0);
    for (let k = 0; k < 6; k++) addWitness(sim, -11 + k * 2 - 5, -34);
    const rec = sim.police.crime('assault', -11, -40)!;
    expect(rec.pending).toBeGreaterThan(0);
    expect(sim.police.tier).toBe(0);
    run(sim, 0.2);
    expect(sim.police.status).toBe('Witness Reporting');
    let reportedAt = -1;
    run(sim, 6, (t) => { if (rec.reported && reportedAt < 0) reportedAt = t; });
    expect(reportedAt).toBeGreaterThan(1.7); expect(reportedAt).toBeLessThan(5.3);
    expect(sim.police.tier).toBeGreaterThanOrEqual(1);
    expect(rec.source).toBe('witness');
    // interrupted call: nothing reaches dispatch
    const sim2 = await quietSim(9);
    place(sim2, -11, -40, 0);
    for (let k = 0; k < 6; k++) addWitness(sim2, -11 + k * 2 - 5, -34);
    const rec2 = sim2.police.crime('assault', -11, -40)!;
    expect(rec2.pending).toBeGreaterThan(0);
    for (const p of sim2.peds.list) if (p.state === 'CallEmergency') { sim2.police.cancelCall(p.callCrime, p.id); p.callCrime = -1; }
    run(sim2, 7);
    expect(rec2.reported).toBe(false); expect(sim2.police.tier).toBe(0);
  });
  it('witnesses behind a building cannot report what they could not see', async () => {
    const sim = await quietSim();
    place(sim, -118, -100, 0);
    // crime in the street; the only bystander stands on the far side of the safehouse row
    addWitness(sim, -118, -130);
    const rec = sim.police.crime('assault', -118, -84)!;
    expect(rec.pending).toBe(0);
  });
  it('police observation identifies immediately and escalates by severity', async () => {
    const sim = await quietSim();
    place(sim, 0, -304, 0);
    const rec = sim.police.crime('gunfire', 0, -304, { source: 'police' })!;
    expect(rec.reported).toBe(true); expect(sim.police.identified).toBe(true);
    expect(sim.police.tier).toBe(2);
    sim.police.crime('attackPolice', 0, -304, { source: 'police' });
    expect(sim.police.tier).toBe(3);
    expect(sim.police.heat).toBeGreaterThanOrEqual(TIER_HEAT[3]);
  });
  it('cameras flag trespass only inside restricted zones they can see', async () => {
    const sim = await quietSim();
    sim.police.cameraGroups.add('warehouse');
    place(sim, 310, -108, 0); // warehouse yard, in front of the west camera
    run(sim, 3);
    expect(sim.police.tier).toBe(0); // not restricted yet
    sim.police.restricted = [{ x0: 292, z0: -172, x1: 382, z1: -90 }];
    run(sim, 16);
    expect(sim.police.tier).toBeGreaterThanOrEqual(1);
    expect(sim.police.records.some((r) => r.type === 'trespass' && r.source === 'camera')).toBe(true);
  });
});

describe('alert life cycle', () => {
  it('pursuit turns into search, cools down and returns to tier 0 when the player stays unseen', async () => {
    const sim = await quietSim();
    place(sim, 330, 330, 0);
    sim.police.crime('vehicleTheft', -200, -300, { source: 'police' }); // reported far away
    expect(sim.police.tier).toBe(1);
    const seen: string[] = [];
    run(sim, 40, () => { if (seen[seen.length - 1] !== sim.police.status) seen.push(sim.police.status); return sim.police.tier === 0; });
    expect(seen).toContain('Search'); expect(seen).toContain('Cooling');
    expect(sim.police.tier).toBe(0); expect(sim.police.status).toBe('Unnoticed');
    expect(sim.police.stats.escapes).toBe(1);
  });
  it('higher tiers take longer to shake', async () => {
    const t = async (tier: number) => {
      const sim = await quietSim(); place(sim, 330, 330, 0);
      sim.police.forceTier(tier, -200, -300); sim.police.forcedTier = 0;
      let n = 0; run(sim, 200, () => { n++; return sim.police.tier === 0; });
      return n / 60;
    };
    const t1 = await t(1), t3 = await t(3);
    expect(t3).toBeGreaterThan(t1 + 10);
  });
  it('changing vehicle or clothes out of sight defeats the description', async () => {
    const sim = await quietSim();
    const a = sim.spawnMissionVehicle('tern', 0, -304, Math.PI / 2), b = sim.spawnMissionVehicle('dart', 12, -304, Math.PI / 2);
    a.owned = b.owned = true;
    sim.player.enterVehicle(a, true);
    sim.police.crime('propertyDamage', 0, -304, { source: 'police' }); sim.police.crime('evading', 0, -304, { source: 'police' });
    expect(sim.police.knownVehicleId).toBe(a.id);
    sim.police.lastCrimeT = -99;
    expect(sim.police.recognises(50)).toBe(true);
    sim.player.exitVehicle(true); sim.player.enterVehicle(b, true);
    expect(sim.police.recognises(50)).toBe(false); // different car at range
    expect(sim.police.recognises(10)).toBe(true);  // but a close look still matches the driver
    sim.player.exitVehicle(true);
    expect(sim.police.recognises(40)).toBe(true);  // on foot in the described jacket
    sim.economy.cash = 500; sim.buy('clothing', 'o:2');
    expect(sim.player.outfit).toBe(2);
    expect(sim.police.recognises(40)).toBe(false);
  });
  it('dispatches budgeted units from portals, which travel physically and find the player', async () => {
    const sim = new Sim(await Physics.create(), 21);
    sim.peds.enabled = false; sim.traffic.enabled = false;
    place(sim, 60, -304, 0);
    sim.police.forceTier(2, 60, -304);
    let maxUnits = 0, sawPursuit = false, minDist = 1e9;
    run(sim, 75, () => {
      maxUnits = Math.max(maxUnits, sim.police.units.length);
      for (const u of sim.police.units) if (u.vehicle) minDist = Math.min(minDist, Math.hypot(u.vehicle.x - sim.player.x, u.vehicle.z - sim.player.z));
      if (sim.police.status === 'Pursuit') sawPursuit = true;
      return sim.police.detain > 0;
    });
    expect(maxUnits).toBeGreaterThan(0); expect(maxUnits).toBeLessThanOrEqual(UNIT_CAP[2] + 1);
    expect(sim.police.budgetUsed).toBeLessThanOrEqual(UNIT_BUDGET[2]);
    expect(minDist).toBeLessThan(25);
    expect(sawPursuit).toBe(true);
  }, 120000);
  it('arrest at low tier: detain window, fine, contraband lost, respawn at the substation', async () => {
    const sim = new Sim(await Physics.create(), 22);
    sim.peds.enabled = false; sim.traffic.enabled = false;
    place(sim, 60, -304, 0);
    sim.economy.cash = 1000; sim.player.inv.long = 'heron';
    sim.police.forceTier(1, 60, -304);
    let detained = false;
    const done = run(sim, 110, () => { if (sim.police.detain > 0) detained = true; return sim.police.stats.arrests > 0; });
    expect(detained).toBe(true); expect(done).toBe(true);
    expect(sim.police.tier).toBe(0);
    expect(sim.economy.cash).toBe(1000 - (80 + 120));
    expect(sim.player.inv.long).toBe(null);
    expect(Math.hypot(sim.player.x - ANCHORS.precinct.x, sim.player.z - ANCHORS.precinct.z)).toBeLessThan(6);
    expect(sim.police.units.length).toBe(0);
  }, 120000);
  it('escalation is capped: tier 5 never exceeds the unit cap or budget', async () => {
    const sim = new Sim(await Physics.create(), 23);
    sim.peds.enabled = false; sim.traffic.enabled = false; sim.godMode = true;
    place(sim, 60, -304, 0);
    sim.police.forceTier(5, 60, -304);
    let maxVeh = 0;
    run(sim, 60, () => { maxVeh = Math.max(maxVeh, sim.police.units.filter((u) => u.vehicle).length); });
    expect(maxVeh).toBeLessThanOrEqual(UNIT_CAP[5] + 2);
    expect(sim.police.budgetUsed).toBeLessThanOrEqual(UNIT_BUDGET[5]);
  }, 120000);
});
