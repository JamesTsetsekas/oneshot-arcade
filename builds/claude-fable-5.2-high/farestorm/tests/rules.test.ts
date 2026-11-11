import { describe, it, expect } from 'vitest';
import { Pulse, PULSE_DECAY_TIME, rankFor } from '../src/score/pulse';
import { gradeFor, shiftTimeAward, parTime, tierForDist, baseFare, pickupAdvanceFactor, TIERS, FareSystem } from '../src/fares/fares';
import { migrateSettings, bestRecords, DEFAULT_SETTINGS, RunRecord } from '../src/persistence/db';
import { signalState } from '../src/traffic/traffic';
import { getModel } from './helpers';
import { Rng } from '../src/core/math';

describe('Pulse chain', () => {
  it('climbs 1x -> 2x -> 3x -> 5x with varied skill', () => {
    const p = new Pulse();
    const cats = ['nearMiss', 'drift', 'air', 'shortcut', 'cleanSector', 'surge'] as const;
    const mults: number[] = [];
    for (let i = 0; i < 14; i++) { p.add(cats[i % cats.length], 100); mults.push(p.mult); }
    expect(mults[0]).toBe(1);
    expect(mults).toContain(2);
    expect(mults).toContain(3);
    expect(p.mult).toBe(5);
    expect(p.bestTier).toBe(3);
  });

  it('repeating one action gives diminishing charge and points until another category occurs', () => {
    const p = new Pulse();
    const a = p.add('nearMiss', 100), b = p.add('nearMiss', 100), c = p.add('nearMiss', 100);
    expect(b.charge).toBeLessThan(a.charge);
    expect(c.charge).toBeLessThan(b.charge);
    expect(c.points).toBeLessThan(a.points);
    expect(p.add('drift', 100).repeat).toBe(0);
    const spam = new Pulse();
    for (let i = 0; i < 12; i++) spam.add('nearMiss', 100);
    const varied = new Pulse();
    const cats = ['nearMiss', 'drift', 'air'] as const;
    for (let i = 0; i < 12; i++) varied.add(cats[i % 3], 100);
    expect(spam.mult).toBeLessThan(varied.mult);
    expect(spam.mult).toBeLessThanOrEqual(2);
  });

  it('decays one tier every 3.5 s without an event and ends the chain at 1x', () => {
    const p = new Pulse();
    p.add('shortcut', 300); p.add('air', 100); p.add('drift', 100, 2);
    expect(p.mult).toBe(2);
    expect(p.update(PULSE_DECAY_TIME - 0.1)).toBeNull();
    expect(p.update(0.2)).toBe('down');
    expect(p.mult).toBe(1);
    expect(p.update(PULSE_DECAY_TIME + 0.01)).toBe('end');
    expect(p.active).toBe(false);
    expect(p.update(10)).toBeNull();
  });

  it('soft collisions drop a tier and hard crashes reset', () => {
    const p = new Pulse();
    const cats = ['nearMiss', 'drift', 'air', 'shortcut'] as const;
    for (let i = 0; i < 8; i++) p.add(cats[i % 4], 100);
    const before = p.tier;
    expect(before).toBeGreaterThanOrEqual(2);
    p.collision(false);
    expect(p.tier).toBe(before - 1);
    p.collision(true);
    expect(p.tier).toBe(0);
    expect(p.chain).toBe(0);
  });

  it('ranks by mode thresholds', () => {
    expect(rankFor('arcade', 0)).toBe('D');
    expect(rankFor('arcade', 4000)).toBe('C');
    expect(rankFor('arcade', 9500)).toBe('B');
    expect(rankFor('arcade', 20000)).toBe('A');
    expect(rankFor('arcade', 50000)).toBe('S');
    expect(rankFor('quick', 20000)).toBe('B');
  });
});

describe('Fare rules', () => {
  it('grades by fraction of patience left', () => {
    expect(gradeFor(0.25)).toBe('Blazing');
    expect(gradeFor(0.249)).toBe('Fast');
    expect(gradeFor(0.1)).toBe('Fast');
    expect(gradeFor(0.05)).toBe('Close');
    expect(gradeFor(0)).toBe('Late');
  });

  it('awards shift time as grade base plus tier bonus, capped', () => {
    expect(shiftTimeAward('Blazing', 'short', 400)).toBe(4);
    expect(shiftTimeAward('Fast', 'medium', 700)).toBe(4);
    expect(shiftTimeAward('Close', 'long', 1200)).toBe(4);
    expect(shiftTimeAward('Late', 'short', 400)).toBe(1);
    expect(shiftTimeAward('Blazing', 'long', 1200)).toBe(6);
    expect(shiftTimeAward('Blazing', 'short', 100)).toBe(3); // trivial hops get no distance bonus
    for (const g of ['Blazing', 'Fast', 'Close', 'Late'] as const) for (const t of ['short', 'medium', 'long', 'special'] as const) expect(shiftTimeAward(g, t, 2000)).toBeLessThanOrEqual(6);
  });

  it('par times match the tier bands from the brief', () => {
    expect(parTime(TIERS.short.minDist)).toBeCloseTo(20, 0);
    expect(parTime(TIERS.short.maxDist)).toBeCloseTo(35, 0);
    expect(parTime(TIERS.medium.maxDist)).toBeCloseTo(55, 0);
    expect(parTime(TIERS.long.maxDist)).toBeLessThanOrEqual(81.5);
    expect(tierForDist(300)).toBe('short');
    expect(tierForDist(700)).toBe('medium');
    expect(tierForDist(1200)).toBe('long');
    expect(baseFare(1200, 'long')).toBeGreaterThan(baseFare(700, 'medium'));
    expect(baseFare(1000, 'special')).toBe(baseFare(1000, 'long') * 2);
  });

  it('pickup time advance shrinks as the shift goes on (no infinite trivial loops)', () => {
    expect(pickupAdvanceFactor(0)).toBeGreaterThan(pickupAdvanceFactor(10));
    expect(pickupAdvanceFactor(100)).toBeGreaterThanOrEqual(0.46);
    expect(pickupAdvanceFactor(0)).toBeLessThan(0.8);
  });

  it('keeps at least five distributed, reachable candidates with sane tiers', () => {
    const model = getModel();
    const fares = new FareSystem(model, new Rng(77), { trafficFactor: 1 });
    const hub = model.hubs[0].pose;
    const loc = model.nearestEdge(hub.x, hub.z);
    const taxi = { x: hub.x, y: hub.y, z: hub.z, speed: 20 };
    for (let i = 0; i < 6; i++) fares.update(0.5, taxi, loc, true);
    expect(fares.candidates.length).toBeGreaterThanOrEqual(5);
    expect(new Set(fares.candidates.map((c) => c.site)).size).toBe(fares.candidates.length);
    expect(new Set(fares.candidates.map((c) => c.who)).size).toBe(fares.candidates.length);
    let near = 0;
    for (const c of fares.candidates) {
      expect(c.site).not.toBe(c.dest);
      const info = TIERS[c.tier];
      expect(c.dist).toBeGreaterThanOrEqual(info.minDist);
      expect(c.dist).toBeLessThan(info.maxDist);
      expect(c.par).toBeGreaterThan(15);
      const s = model.sites[c.site];
      if (model.route(loc, { edge: s.edge, t: s.t }).dist < 450) near++;
    }
    expect(near).toBeGreaterThanOrEqual(3);
  });
});

describe('Traffic signals', () => {
  it('never show green to both axes at once and include all-red clearance', () => {
    let nsGreen = 0, ewGreen = 0;
    for (let t = 0; t < 44; t += 0.1) {
      const ns = signalState(12, true, t), ew = signalState(12, false, t);
      expect(ns < 2 && ew < 2).toBe(false);
      if (ns === 0) nsGreen++;
      if (ew === 0) ewGreen++;
    }
    expect(nsGreen).toBeGreaterThan(100);
    expect(ewGreen).toBeGreaterThan(100);
  });
});

describe('Persistence', () => {
  it('migrates old or corrupt settings blobs to the current shape', () => {
    const s = migrateSettings({ v: 1, master: 0.3, quality: 'ultra', taxi: 'hovercar', bindings: { throttle: ['KeyI'] } });
    expect(s.master).toBe(0.3);
    expect(s.quality).toBe('medium');
    expect(s.taxi).toBe('breaker');
    expect(s.bindings.throttle).toEqual(['KeyI']);
    expect(s.bindings.brake).toEqual(DEFAULT_SETTINGS.bindings.brake);
    expect(s.v).toBe(DEFAULT_SETTINGS.v);
    expect(migrateSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(migrateSettings('garbage').traffic).toBe('medium');
  });

  it('orders best records by score, and time trials by time', () => {
    const mk = (mode: string, score: number, time: number, trial = 0, medal: string | null = null): RunRecord => ({ date: 0, mode, taxi: 'gull', trial, score, rank: 'B', medal, time, deliveries: 3, bestMult: 2, traffic: 'medium', assisted: false, rules: 1 });
    const all = [mk('arcade', 500, 60), mk('arcade', 9000, 200), mk('quick', 99999, 300), mk('trial', 0, 120, 0, 'silver'), mk('trial', 0, 95, 0, 'gold'), mk('trial', 0, 80, 1, 'gold')];
    expect(bestRecords(all, 'arcade')[0].score).toBe(9000);
    expect(bestRecords(all, 'arcade').length).toBe(2);
    expect(bestRecords(all, 'trial', 0)[0].time).toBe(95);
    expect(bestRecords(all, 'trial', 1).length).toBe(1);
  });
});
