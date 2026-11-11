// Bot behaviour and whole-match simulation: ten bot seats play complete matches headlessly.
import { describe, expect, it } from 'vitest';
import { RULES_FULL, RULES_QUICK } from '../src/content/rules';
import { getAnnex } from '../src/map/annex';
import { Room, runHeadlessMatch } from '../src/server/room';
import { eyeHeight } from '../src/sim/movement';
import { canSeePlayer } from '../src/sim/vision';

const map = getAnnex();

describe('full bot matches', () => {
  it('plays a quick match to a single result, deterministically for a seed', () => {
    const a = runHeadlessMatch({ map, rules: RULES_QUICK, seed: 1234, team0Side: 'atk', difficulty: 'normal' });
    const b = runHeadlessMatch({ map, rules: RULES_QUICK, seed: 1234, team0Side: 'atk', difficulty: 'normal' });
    const c = runHeadlessMatch({ map, rules: RULES_QUICK, seed: 1235, team0Side: 'atk', difficulty: 'normal' });
    expect(a.match.phase).toBe('matchEnd');
    const sa = a.match.summary!;
    const sb = b.match.summary!;
    expect(sa.winnerTeam).toBeGreaterThanOrEqual(-1);
    expect(Math.max(...sa.score)).toBeGreaterThanOrEqual(5);
    // replay determinism: identical seed and bot inputs reproduce the match bit for bit
    expect(sb.logHash).toBe(sa.logHash);
    expect(sb.score).toEqual(sa.score);
    expect(sb.ticks).toBe(sa.ticks);
    expect(sb.players.map((p) => [p.kills, p.deaths, p.damage])).toEqual(sa.players.map((p) => [p.kills, p.deaths, p.damage]));
    expect(c.match.summary!.logHash).not.toBe(sa.logHash);
    expect(sa.collisionHash).toBe(map.collisionHash);
    expect(sa.ruleset).toBe(RULES_QUICK.version);
  });

  it('completes a full-length match including the side swap', () => {
    const r = runHeadlessMatch({ map, rules: RULES_FULL, seed: 77, team0Side: 'def', difficulty: 'normal' });
    const s = r.match.summary!;
    expect(r.match.phase).toBe('matchEnd');
    expect(s.rounds.length).toBeGreaterThanOrEqual(9);
    expect(s.rounds.length).toBeLessThanOrEqual(20);
    const hi = Math.max(...s.score);
    const lo = Math.min(...s.score);
    expect(hi >= 9 || s.rounds.length === 20).toBe(true);
    if (s.rounds.length < 20) expect(hi - lo >= 2 || lo < 8).toBe(true);
    // both halves were played from both sides
    expect(new Set(s.rounds.slice(0, 8).map((x) => (x.winnerTeam === 0 ? x.winnerSide : x.winnerSide === 'atk' ? 'def' : 'atk'))).size).toBe(1);
    if (s.rounds.length > 8) {
      const first = s.rounds[0].winnerTeam === 0 ? s.rounds[0].winnerSide : s.rounds[0].winnerSide === 'atk' ? 'def' : 'atk';
      const later = s.rounds[8].winnerTeam === 0 ? s.rounds[8].winnerSide : s.rounds[8].winnerSide === 'atk' ? 'def' : 'atk';
      expect(later).not.toBe(first);
    }
  });

  it('shows the whole tactical loop across seeds: takes, arms, post-arm holds, retakes, disarms, saves', () => {
    const reasons: Record<string, number> = {};
    let rounds = 0;
    let planted = 0;
    let atkWins = 0;
    let sites = { A: 0, B: 0 };
    let utilDamage = 0;
    let flashed = 0;
    let richRounds = 0;
    for (const seed of [11, 22, 33, 44, 55, 66]) {
      const r = runHeadlessMatch({ map, rules: RULES_QUICK, seed, team0Side: seed % 2 ? 'atk' : 'def', difficulty: 'normal' });
      const s = r.match.summary!;
      for (const rd of s.rounds) {
        rounds++;
        reasons[rd.reason] = (reasons[rd.reason] ?? 0) + 1;
        if (rd.planted) {
          planted++;
          if (rd.site) sites[rd.site]++;
        }
        if (rd.winnerSide === 'atk') atkWins++;
        if (Math.max(...rd.equip) > 12000) richRounds++;
      }
      for (const p of s.players) {
        utilDamage += p.utilDamage;
        flashed += p.flashed;
        expect(p.shots).toBeGreaterThan(0); // every bot took part
      }
    }
    console.log(`rounds ${rounds}, attacker win rate ${((atkWins / rounds) * 100).toFixed(0)}%, armed ${planted}, sites ${JSON.stringify(sites)}, reasons ${JSON.stringify(reasons)}, utility damage ${utilDamage}, enemies flashed ${flashed}`);
    expect(planted / rounds).toBeGreaterThan(0.1);
    expect(sites.A).toBeGreaterThan(0);
    expect(sites.B).toBeGreaterThan(0);
    expect(reasons.eliminated).toBeGreaterThan(0);
    expect((reasons.detonated ?? 0) + (reasons.disarmed ?? 0)).toBeGreaterThan(0);
    // neither side dominates
    expect(atkWins / rounds).toBeGreaterThan(0.22);
    expect(atkWins / rounds).toBeLessThan(0.78);
    // economy cycles through real buys
    expect(richRounds).toBeGreaterThan(rounds * 0.3);
    expect(utilDamage + flashed).toBeGreaterThan(0);
  });
});

describe('bots obey fog of war', () => {
  it('only ever "sees" an enemy it has line of sight to', () => {
    const room = new Room({ map, rules: RULES_QUICK, seed: 314, humans: [], team0Side: 'atk', difficulty: 'hard', autopilot: true });
    const m = room.match;
    let checks = 0;
    let sightings = 0;
    const prev = new Map<number, Set<number>>();
    for (let t = 0; t < 64 * 110 && m.phase !== 'matchEnd'; t++) {
      // line-of-sight truth from the positions the bots will sense this tick
      const los = new Map<number, Set<number>>();
      for (const bot of room.bots.bots.values()) {
        const p = m.players[bot.id];
        const set = new Set<number>();
        if (p.alive)
          for (const q of m.players) {
            if (!q.alive || q.team === p.team) continue;
            if (canSeePlayer(m.world, m.veils, m.time, p.move.x, p.move.y + eyeHeight(p.move.crouch), p.move.z, q)) set.add(q.id);
          }
        los.set(bot.id, set);
        prev.set(bot.id, new Set(bot.visible));
      }
      room.tick();
      for (const bot of room.bots.bots.values()) {
        for (const id of bot.visible) {
          checks++;
          if (prev.get(bot.id)!.has(id)) continue; // unchanged since an earlier, already-verified sense
          sightings++;
          expect(los.get(bot.id)!.has(id), `bot ${bot.id} sees ${id} without line of sight at tick ${m.tick}`).toBe(true);
        }
      }
    }
    expect(sightings).toBeGreaterThan(10);
    expect(checks).toBeGreaterThan(sightings);
  });

  it('hears with positional uncertainty rather than exact positions', () => {
    const room = new Room({ map, rules: RULES_QUICK, seed: 2718, humans: [], team0Side: 'atk', difficulty: 'normal', autopilot: true });
    const m = room.match;
    let heard = 0;
    let exact = 0;
    for (let t = 0; t < 64 * 90 && m.phase !== 'matchEnd'; t++) {
      room.tick();
      if (t % 8) continue;
      for (const brain of room.bots.brains) {
        for (const c of brain.contacts.values()) {
          if (c.seen || c.id >= 1000 || m.time - c.time > 0.2) continue;
          const q = m.players[c.id];
          heard++;
          if (Math.hypot(q.move.x - c.x, q.move.z - c.z) < 0.05) exact++;
        }
      }
    }
    expect(heard).toBeGreaterThan(20);
    expect(exact / heard).toBeLessThan(0.05);
  });

  it('acts only through ordinary inputs and purchases, and buys within its budget', () => {
    const room = new Room({ map, rules: RULES_QUICK, seed: 99, humans: [], team0Side: 'atk', difficulty: 'normal', autopilot: true });
    const m = room.match;
    while (m.phase !== 'live') {
      room.tick();
      for (const p of m.players) expect(p.money).toBeGreaterThanOrEqual(0);
    }
    // pistol round: nobody can own a rifle, and no one spent more than they had
    for (const p of m.players) {
      expect(p.primary).toBeNull();
      expect(p.stats.spent).toBeLessThanOrEqual(800);
    }
  });
});

describe('server performance', () => {
  it('keeps the 64 Hz tick well inside its budget with ten bots', () => {
    const room = new Room({ map, rules: RULES_QUICK, seed: 4, humans: [], team0Side: 'atk', difficulty: 'normal', autopilot: true });
    const times: number[] = [];
    for (let i = 0; i < 64 * 5; i++) room.tick(); // warm up the JIT
    for (let i = 0; i < 64 * 60 && room.match.phase !== 'matchEnd'; i++) {
      const t0 = performance.now();
      room.tick();
      times.push(performance.now() - t0);
    }
    times.sort((a, b) => a - b);
    const p95 = times[Math.floor(times.length * 0.95)];
    const mean = times.reduce((s, v) => s + v, 0) / times.length;
    console.log(`server tick: mean ${mean.toFixed(3)} ms, p95 ${p95.toFixed(3)} ms, max ${times[times.length - 1].toFixed(2)} ms over ${times.length} ticks`);
    expect(p95).toBeLessThan(10);
  });
});
