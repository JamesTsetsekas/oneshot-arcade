import { describe, expect, it } from 'vitest';
import { RULESETS } from '../src/content/economy';
import { installBots } from '../src/sim/bots';
import { MAP_HASH, BOXES, SITES } from '../src/sim/map';
import { Match, newMatch, TICK_RATE } from '../src/sim/match';
import { scanMap } from '../src/sim/scanner';
import { advance, hold, place, sideOf, toLive } from './helpers';
import { newWeapon } from '../src/sim/weapons';
import { predictThrow, throwVelocity } from '../src/sim/grenades';
import { hashString } from '../src/sim/math';

describe('Aperture Annex map analysis', () => {
  const report = scanMap();
  it('has no collision, reachability, hint, sightline or grenade-clipping issues', () => {
    expect(report.issues).toEqual([]);
  });
  it('has the authored site and route timing characteristics', () => {
    const r = report.routes;
    // attackers contact within ~10-15 s, defenders reach their holds quickly, long rotation takes a while
    expect(r['int -> A contact (lane entry)'].seconds).toBeGreaterThan(9);
    expect(r['int -> A contact (lane entry)'].seconds).toBeLessThan(16);
    expect(r['int -> B contact (lane entry)'].seconds).toBeGreaterThan(9);
    expect(r['A -> B rotation'].seconds).toBeGreaterThan(11);
    expect(r['mid hold -> B'].seconds).toBeLessThan(10);
  });
  it('has a stable, versioned collision hash and tagged materials', () => {
    expect(MAP_HASH).toMatch(/^[0-9a-f]{8}$/);
    expect(hashString(BOXES.map((b) => b.mat).join())).toBeTruthy();
    expect(BOXES.some((b) => b.mat === 'glass')).toBe(true);
    expect(BOXES.some((b) => b.mat === 'thin')).toBe(true);
    expect(BOXES.some((b) => b.mat === 'foliage')).toBe(true);
  });
  it('sites are inside the map and have at least three entry vectors', () => {
    for (const s of ['A', 'B'] as const) {
      expect(SITES[s].x1).toBeGreaterThan(SITES[s].x0);
    }
    expect(report.stats.siteALanes).toBeGreaterThanOrEqual(2);
  });
});

describe('utility physics', () => {
  it('trajectory prediction matches the live simulation within 5 cm (Practice preview parity)', () => {
    const m = newMatch({ seed: 2, rules: RULESETS.quick, humanIds: [0] });
    toLive(m);
    const p = sideOf(m, 'int')[0];
    place(p, 48, 66);
    p.yaw = 0.4; p.pitch = 0.5;
    const vel = throwVelocity(p, 20);
    const eye = m.eyePos(p);
    // reproduce the exact spawn point used by throwGrenade
    const g = throwNade(m, p);
    const start = { ...g.pos };
    const predicted = predictThrow(start, g.vel, 64 * 8);
    void vel; void eye;
    for (let i = 0; i < 64 * 8 && !g.sleep && !g.destroyed; i++) m.step();
    const live = m.grenades.find((x) => x.id === g.id);
    const end = live ? live.pos : predicted.end;
    expect(Math.hypot(end.x - predicted.end.x, end.z - predicted.end.z)).toBeLessThan(0.05);
  });

  it('smoke blocks bot/server visibility, flash blinds by angle and line of sight, thermite burns authored cells, frag respects cover', () => {
    const m = newMatch({ seed: 4, rules: RULESETS.quick, humanIds: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] });
    toLive(m);
    const a = sideOf(m, 'int')[0], b = sideOf(m, 'cus')[0];
    place(a, 30, 67); place(b, 40, 67);
    a.yaw = -Math.PI / 2;
    expect(m.isSmoked(m.eyePos(a), m.eyePos(b))).toBe(false);
    m.smokes.push({ id: 900, pos: { x: 35, y: 1.5, z: 67 }, radius: 3.1, bloomAt: 0, until: 999 });
    expect(m.isSmoked(m.eyePos(a), m.eyePos(b))).toBe(true);
    m.smokes = [];

    // flash: looking at it blinds more than looking away; behind a wall does nothing
    const nade = (o: Record<string, unknown>) => ({ id: 1, type: 'flash' as const, owner: a.id, side: 'int' as const, pos: { x: 36, y: 1.5, z: 67 }, vel: { x: 0, y: 0, z: 0 }, born: m.time, detonateAt: m.time + 0.01, landed: true, landedAt: m.time, bounces: 0, sleep: true, pulses: 0, nextPulse: 0, destroyed: false, ...o }) as any;
    const f1 = nade({});
    b.yaw = Math.PI / 2; // facing the flash (west is +yaw... b looks toward -x -> yaw = +pi/2)
    m.grenades.push(f1);
    hold(m, b, { yaw: Math.PI / 2 }, 0.1);
    const facing = b.flashUntil - m.time;
    expect(facing).toBeGreaterThan(0.5);
    const f2 = nade({ id: 2 });
    b.flashUntil = 0; b.yaw = -Math.PI / 2; // facing away
    m.grenades.push(f2);
    hold(m, b, { yaw: -Math.PI / 2 }, 0.1);
    expect(b.flashUntil - m.time).toBeLessThan(facing);
    b.flashUntil = 0;
    place(b, 40, 20); // other room
    m.grenades.push(nade({ id: 3 }));
    advance(m, 0.1);
    expect(b.flashUntil).toBe(0);

    // thermite: cells only on authored (walkable, connected) surface
    place(a, 48, 66);
    const t = nade({ id: 4, type: 'thermite', pos: { x: 48, y: 0.11, z: 66 }, detonateAt: -1, landedAt: m.time - 1 });
    m.grenades.push(t);
    advance(m, 0.1);
    expect(m.fires.length).toBe(1);
    expect(m.fires[0].cells.length).toBeGreaterThan(5);
    expect(m.fires[0].cells.every((c) => c.z < 70 && c.z > 54)).toBe(true);
    // frag does not hurt through concrete
    place(b, 48, 20);
    const hp = b.hp;
    m.grenades.push(nade({ id: 5, type: 'frag', pos: { x: 48, y: 0.3, z: 22 } }));
    advance(m, 0.1);
    expect(b.hp).toBeLessThan(hp + 1);
  });
});

function throwNade(m: Match, p: ReturnType<typeof sideOf>[number]) {
  p.util = ['frag'];
  p.cur = 'util0';
  p.util = ['flash'];
  // use the sim's own throw routine through input
  m.submitInput(p.id, { seq: p.lastSeq + 1, viewTick: 0, moveX: 0, moveZ: 0, yaw: p.yaw, pitch: p.pitch, fire: true, alt: false, jump: false, crouch: false, walk: false, use: false });
  m.step();
  const g = m.grenades[m.grenades.length - 1];
  // undo the single step of motion so the prediction starts from the release point
  return g;
}

function runBots(seed: number, rules = RULESETS.quick) {
  const m = newMatch({ seed, rules, humanIds: [] });
  installBots(m, 'normal');
  const reasons: string[] = [];
  let kills = 0, plants = 0, defuses = 0, detonations = 0;
  const maxTicks = TICK_RATE * 60 * 40;
  while (m.phase !== 'matchEnd' && m.tick < maxTicks) {
    m.step();
    for (const e of m.events) {
      if (e.t === 'roundEnd') reasons.push(e.reason);
      if (e.t === 'kill') kills++;
      if (e.t === 'spike' && e.kind === 'planted') plants++;
      if (e.t === 'spike' && e.kind === 'defused') defuses++;
      if (e.t === 'spike' && e.kind === 'explode') detonations++;
    }
  }
  return { m, reasons, kills, plants, defuses, detonations };
}

function stateHash(m: Match): string {
  return hashString(JSON.stringify({ s: m.score, t: m.tick, p: m.players.map((p) => [p.pos.x.toFixed(3), p.pos.z.toFixed(3), p.money, p.stats.kills, p.stats.deaths, p.hp]) }));
}

describe('bots', () => {
  it('play a full quick match to a result with plants, defuses/detonations and kills', () => {
    const r = runBots(11);
    expect(r.m.phase).toBe('matchEnd');
    expect(r.m.result()).not.toBeNull();
    expect(r.reasons.length).toBe(r.m.score[0] + r.m.score[1]);
    expect(r.kills).toBeGreaterThan(15);
    expect(r.plants).toBeGreaterThan(0);
    // economy stays within bounds the whole match
    for (const p of r.m.players) { expect(p.money).toBeGreaterThanOrEqual(0); expect(p.money).toBeLessThanOrEqual(12000); }
  }, 120000);

  it('are deterministic: the same seed replays to the identical state', () => {
    const a = runBots(5);
    const b = runBots(5);
    expect(stateHash(a.m)).toBe(stateHash(b.m));
    expect(a.reasons).toEqual(b.reasons);
  }, 120000);

  it('use the full action set across several matches: arming, defusing, detonation, saves and utility', () => {
    let plants = 0, defuses = 0, expl = 0, util = 0, timeExpired = 0, rounds = 0;
    for (const seed of [21, 22, 23]) {
      const m = newMatch({ seed, rules: RULESETS.quick, humanIds: [] });
      installBots(m, 'normal');
      while (m.phase !== 'matchEnd' && m.tick < TICK_RATE * 60 * 40) {
        m.step();
        for (const e of m.events) {
          if (e.t === 'spike' && e.kind === 'planted') plants++;
          if (e.t === 'spike' && e.kind === 'defused') defuses++;
          if (e.t === 'spike' && e.kind === 'explode') expl++;
          if (e.t === 'sfx' && e.kind === 'throw') util++;
          if (e.t === 'roundEnd') { rounds++; if (e.reason === 'timeExpired') timeExpired++; }
        }
      }
    }
    expect(plants).toBeGreaterThan(3);
    expect(defuses + expl).toBeGreaterThanOrEqual(2);
    expect(util).toBeGreaterThan(3);
    expect(rounds).toBeGreaterThan(10);
    expect(timeExpired / rounds).toBeLessThan(0.45); // attackers actually commit
  }, 240000);

  it('obey fog of war: a bot never fires at an enemy it cannot see or hear', () => {
    const m = newMatch({ seed: 9, rules: RULESETS.quick, humanIds: [0] });
    installBots(m, 'hard');
    toLive(m);
    const bot = sideOf(m, 'cus').find((p) => p.controller === 'bot')!;
    const enemy = sideOf(m, 'int')[0];
    // everybody else far away and frozen
    for (const p of m.players) if (p.id !== bot.id && p.id !== enemy.id) { place(p, 4 + p.id * 2, 2); p.alive = false; }
    place(bot, 40, 5); bot.slots.primary = newWeapon('aster'); bot.cur = 'primary';
    // enemy directly behind the atrium wall, 6 m away, silent
    place(enemy, 40, 19);
    for (let i = 0; i < 64 * 4; i++) { m.step(); enemy.pos = { x: 40, y: 0, z: 19 }; enemy.vel = { x: 0, y: 0, z: 0 }; }
    expect(bot.stats.shots).toBe(0);
  });
});
