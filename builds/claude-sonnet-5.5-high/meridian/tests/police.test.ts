import { describe, expect, it } from 'vitest';
import { Game } from '../src/sim/game';
import { emptyInput } from '../src/sim/types';
import { makeHuman } from '../src/sim/peds';
import { tierForHeat } from '../src/sim/police';

const DT = 1 / 60;
function run(g: Game, secs: number, inp = emptyInput()) { for (let i = 0; i < secs * 60; i++) g.step(inp, DT); }

/** Game with the player standing in an open road, with no random pedestrians so witnesses are controlled. */
function arena(seed = 9) {
  const g = new Game(seed);
  g.newGame();
  g.missions.abandon();
  g.peds.target = 0;
  g.traffic.target = 0;
  g.traffic.parkedTarget = 0;
  run(g, 1);
  g.humans = g.humans.filter((h) => h.kind !== 'ped');
  g.vehicles = g.vehicles.filter((v) => v.owner === 'player');
  const h = g.player.human;
  h.x = -160; h.z = -240; h.heading = 0;
  return g;
}

function witnessAt(g: Game, x: number, z: number, phone = true) {
  const w = makeHuman('ped', x, z, 'commuter', 2);
  w.hasPhone = phone;
  w.courage = 0.9;
  w.heading = Math.atan2(g.player.human.x - x, g.player.human.z - z);
  g.humans.push(w);
  return w;
}

describe('crime evidence and alert tiers', () => {
  it('maps heat to the five alert tiers', () => {
    expect(tierForHeat(0)).toBe(0);
    expect(tierForHeat(1)).toBe(1);
    expect(tierForHeat(3.5)).toBe(2);
    expect(tierForHeat(6)).toBe(3);
    expect(tierForHeat(11)).toBe(4);
  });

  it('a crime with no witness, camera or officer creates no evidence consequences', () => {
    const g = arena();
    const h = g.player.human;
    h.x = -160; h.z = -240; // away from cameras
    g.police.crime('assault', h.x, h.z, 1.2, { byPlayer: true });
    run(g, 6);
    expect(g.police.tier).toBe(0);
    expect(g.police.ident).toBe('Unnoticed');
  });

  it('a witness with a phone reports after a 2-5 second delay and raises the alert', () => {
    const g = arena();
    const h = g.player.human;
    h.x = -160; h.z = -240;
    const w = witnessAt(g, h.x + 12, h.z);
    g.police.crime('assault', h.x, h.z, 1.2, { byPlayer: true });
    expect(w.state).toBe('CallEmergency');
    expect(w.reportT).toBeGreaterThanOrEqual(2);
    expect(w.reportT).toBeLessThanOrEqual(5);
    expect(g.police.ident).toBe('Witness Reporting');
    expect(g.police.tier).toBe(0); // not yet reported
    run(g, 5.5);
    expect(g.police.tier).toBeGreaterThanOrEqual(1);
    expect(g.police.stats.reports).toBeGreaterThan(0);
  });

  it('waving off the witness cancels the report (non-violent interruption)', () => {
    const g = arena();
    const h = g.player.human;
    h.x = -160; h.z = -240;
    const w = witnessAt(g, h.x + 2, h.z);
    g.police.crime('assault', h.x, h.z, 1.2, { byPlayer: true });
    g.step(emptyInput(), DT);
    expect(g.prompt?.text).toContain('Wave off');
    g.step({ ...emptyInput(), interact: true }, DT);
    run(g, 6);
    expect(w.state).not.toBe('CallEmergency');
    expect(g.police.tier).toBe(0);
  });

  it('harming a witness never helps: the report fires immediately with extra heat', () => {
    const g = arena();
    const h = g.player.human;
    h.x = -160; h.z = -240;
    const w = witnessAt(g, h.x + 3, h.z);
    g.police.crime('gunfire', h.x, h.z, 1.4, { byPlayer: true, noise: true });
    g.peds.onHarmed(g, w, 'player');
    expect(g.police.tier).toBeGreaterThanOrEqual(1);
    expect(g.police.heat).toBeGreaterThan(2);
  });

  it('direct police observation identifies the player immediately and units arrive from outside the view', () => {
    const g = arena();
    const h = g.player.human;
    h.x = -160; h.z = -240;
    const cop = makeHuman("police", h.x + 20, h.z, "officer", 30);
    cop.state = 'Search';
    g.humans.push(cop);
    g.player.holstered = false;
    g.police.crime('weapon-display', h.x, h.z, 0.6, { byPlayer: true });
    expect(g.police.tier).toBeGreaterThanOrEqual(1);
    g.police.setTier(2);
    g.humans = g.humans.filter((q) => q.kind !== 'police');
    let maxCars = 0;
    for (let i = 0; i < 40 * 60; i++) { g.step(emptyInput(), DT); maxCars = Math.max(maxCars, g.vehicles.filter((v) => v.owner === "police").length); }
    expect(maxCars).toBeGreaterThan(0);
    expect(maxCars).toBeLessThanOrEqual(6);
  });

  it('police pursuit becomes search when sight is lost, and the alert decays to zero', () => {
    const g = arena();
    g.police.setTier(1);
    const h = g.player.human;
    h.x = 150; h.z = -240;
    g.police['lastSeenT'] = g.t - 20;
    g.police.lastKnown = { x: h.x, z: h.z };
    run(g, 5);
    expect(['Search', 'Cooling']).toContain(g.police.ident);
    run(g, 60);
    expect(g.police.tier).toBe(0);
    expect(g.police.ident).toBe('Unnoticed');
  });

  it('changing vehicle after breaking sight shortens identification', () => {
    const g = arena();
    g.police.setTier(2);
    g.police['lastSeenT'] = g.t - 30;
    run(g, 2);
    const before = g.police['searchT'] as number;
    g.police.onAppearanceChange('outfit');
    expect(g.police['searchT'] as number).toBeGreaterThan(before + 5);
  });

  it('unit count stays capped even at tier 5', () => {
    const g = arena();
    g.police.setTier(5);
    run(g, 120);
    const cars = g.vehicles.filter((v) => v.owner === 'police');
    expect(cars.length).toBeLessThanOrEqual(8);
    expect(g.police.budget).toBeGreaterThanOrEqual(0);
  });

  it('arrest: a compliant, still player is cuffed, fined, loses long guns and respawns at the precinct', () => {
    const g = arena();
    const P = g.player;
    P.inv.longGun = 'carbine'; P.inv.owned.push('carbine');
    P.cash = 500;
    P.holstered = true;
    g.police.setTier(1);
    const cop = makeHuman('police', P.human.x + 1.5, P.human.z, 'officer', 30);
    cop.state = 'Chase';
    g.humans.push(cop);
    run(g, 6);
    expect(g.police.stats.arrests).toBe(1);
    expect(P.cash).toBeLessThan(500);
    expect(P.inv.longGun).toBeNull();
    const prec = g.world.poi('precinct');
    expect(Math.hypot(P.human.x - prec.x, P.human.z - prec.z)).toBeLessThan(8);
    expect(g.police.tier).toBe(0);
  });
});
