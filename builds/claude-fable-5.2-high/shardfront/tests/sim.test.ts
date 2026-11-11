import { describe, expect, it } from 'vitest';
import { DEF_INDEX, FACTIONS } from '../src/data/defs';
import { ARMOR_UPGRADE_STEP, ATTACK_UPGRADE_STEP } from '../src/data/types';
import type { Command, MatchConfig } from '../src/net/protocol';
import { buildFilteredSnapshot } from '../src/net/snapshot';
import { FixedClock } from '../src/sim/clock';
import { dealDamage } from '../src/sim/combat';
import { createSim, skirmishConfig } from '../src/sim/create';
import { DECISION_TICK, ENDGAME_TICK, FL_CONSTRUCTING, OT_GATHER, PLACE_OK, PLACE_ZONE, Sim } from '../src/sim/sim';
import { queuePauseReason } from '../src/sim/systems';
import { GATHER_TICKS, ORE_LOAD } from '../src/sim/units';

function humanVsPassive(f0: 'helix' | 'chorus' = 'helix', f1: 'helix' | 'chorus' = 'chorus'): MatchConfig {
  return { seed: 5, mode: 'skirmish', players: [{ faction: f0, controller: 'human', difficulty: 'normal', name: 'A' }, { faction: f1, controller: 'passive', difficulty: 'normal', name: 'B' }] };
}
const run = (s: Sim, ticks: number) => { for (let i = 0; i < ticks; i++) s.step(); };
const own = (s: Sim, p: number, id: string) => s.ids.filter((e) => s.alive[e] && s.owner[e] === p && s.d(e).id === id);
const nearestOre = (s: Sim, x: number, z: number) => {
  let best = -1, bd = 1e9;
  for (const e of s.ids) if (s.alive[e] && s.d(e).id === 'ore') { const d = (s.x[e] - x) ** 2 + (s.z[e] - z) ** 2; if (d < bd) { bd = d; best = e; } }
  return best;
};

describe('match setup', () => {
  it('spawns a headquarters, six workers and a scout per player with starting supply', () => {
    const s = new Sim(humanVsPassive());
    for (let p = 0; p < 2; p++) {
      const f = FACTIONS[s.cfg.players[p].faction];
      expect(own(s, p, f.hq)).toHaveLength(1);
      expect(own(s, p, f.worker)).toHaveLength(6);
      expect(own(s, p, f.scout)).toHaveLength(1);
      expect(s.players[p].supplyUsed).toBe(7);
      expect(s.players[p].supplyCap).toBe(12);
    }
  });
});

describe('economy', () => {
  it('workers reserve a seam, gather for 1.6 s, carry a load home and repeat', () => {
    const s = new Sim(humanVsPassive());
    const workers = own(s, 0, 'fabricator');
    const hq = own(s, 0, 'core_relay')[0];
    const ore = nearestOre(s, s.x[hq], s.z[hq]);
    expect(s.applyCommand(0, { k: 'gather', ids: workers, target: ore })).toBe(true);
    expect(GATHER_TICKS).toBe(32);
    let sawMining = false, sawCarry = false, maxMiners = 0;
    for (let i = 0; i < 400; i++) {
      s.step();
      for (const w of workers) { if (s.wstate[w] === 1) sawMining = true; if (s.carry[w] === ORE_LOAD) sawCarry = true; }
      for (const e of s.ids) if (s.alive[e] && s.d(e).id === 'ore') maxMiners = Math.max(maxMiners, s.miners[e]);
    }
    expect(sawMining).toBe(true);
    expect(sawCarry).toBe(true);
    expect(maxMiners).toBe(1); // one worker per seam at a time
    expect(s.players[0].ore).toBeGreaterThan(100 + ORE_LOAD * 6);
    expect(s.players[0].stats.oreCollected).toBeGreaterThan(0);
    // workers spread over several seams instead of queueing on one
    const targets = new Set(workers.map((w) => s.orders[w][0]?.target));
    expect(targets.size).toBeGreaterThan(2);
  });

  it('flux requires a tap on a vent and seams are finite', () => {
    const s = new Sim(humanVsPassive());
    const workers = own(s, 0, 'fabricator');
    const vent = s.ids.find((e) => s.alive[e] && s.d(e).id === 'vent' && Math.abs(s.x[e] - 24) < 16 && Math.abs(s.z[e] - 134) < 16) as number;
    expect(s.applyCommand(0, { k: 'gather', ids: workers, target: vent })).toBe(false);
    s.players[0].ore = 500;
    expect(s.canPlace(0, DEF_INDEX.flux_tap, s.x[vent] + 4, s.z[vent])).not.toBe(PLACE_OK);
    expect(s.applyCommand(0, { k: 'build', ids: [workers[0]], def: 'flux_tap', x: s.x[vent], z: s.z[vent] })).toBe(true);
    run(s, 20 * 45);
    const tap = own(s, 0, 'flux_tap')[0];
    expect(tap).toBeDefined();
    expect(s.flags[tap] & FL_CONSTRUCTING).toBe(0);
    run(s, 20 * 20);
    expect(s.players[0].flux).toBeGreaterThan(0); // the builder starts drawing flux automatically
    const seam = nearestOre(s, 24, 134);
    s.amount[seam] = 3;
    s.applyCommand(0, { k: 'gather', ids: [workers[1]], target: seam });
    run(s, 300);
    expect(s.alive[seam]).toBe(0);
    expect(s.orders[workers[1]][0]?.t).toBe(OT_GATHER); // re-evaluated onto another seam
  });
});

describe('construction and production', () => {
  it('enforces construction fields, prerequisites and costs; cancel refunds 75%', () => {
    const s = new Sim(humanVsPassive());
    const w = own(s, 0, 'fabricator');
    s.players[0].ore = 1000;
    expect(s.canPlace(0, DEF_INDEX.grid_pylon, 88, 108)).toBe(PLACE_ZONE);
    expect(s.applyCommand(0, { k: 'build', ids: [w[0]], def: 'assembly_bay', x: 36, z: 128 })).toBe(false); // needs a pylon
    expect(s.applyCommand(0, { k: 'build', ids: [w[0]], def: 'root_node', x: 36, z: 128 })).toBe(false); // wrong faction
    expect(s.applyCommand(0, { k: 'build', ids: [w[0]], def: 'grid_pylon', x: 36, z: 128 })).toBe(true);
    expect(s.players[0].ore).toBe(900);
    run(s, 20 * 12);
    const pylon = own(s, 0, 'grid_pylon')[0];
    expect(s.flags[pylon] & FL_CONSTRUCTING).toBe(FL_CONSTRUCTING);
    expect(s.hp[pylon]).toBeLessThan(s.d(pylon).hp);
    expect(s.players[0].supplyCap).toBe(12); // unfinished structures give no supply
    expect(s.applyCommand(0, { k: 'cancelBuild', id: pylon })).toBe(true);
    expect(s.players[0].ore).toBe(975);
    expect(s.alive[pylon]).toBe(0);
  });

  it('Directorate structures need a builder on site; Chorus growths finish on their own', () => {
    const h = new Sim(humanVsPassive('helix', 'chorus'));
    const c = new Sim(humanVsPassive('chorus', 'helix'));
    h.players[0].ore = 500; c.players[0].ore = 500;
    const hw = own(h, 0, 'fabricator')[0], cw = own(c, 0, 'tender')[0];
    h.applyCommand(0, { k: 'build', ids: [hw], def: 'grid_pylon', x: 36, z: 128 });
    c.applyCommand(0, { k: 'build', ids: [cw], def: 'root_node', x: 36, z: 128 });
    run(h, 200); run(c, 200);
    const hp = own(h, 0, 'grid_pylon')[0], cp = own(c, 0, 'root_node')[0];
    expect(hp).toBeDefined(); expect(cp).toBeDefined();
    // pull both workers away
    h.applyCommand(0, { k: 'move', ids: [hw], x: 20, z: 120 });
    c.applyCommand(0, { k: 'move', ids: [cw], x: 20, z: 120 });
    const hProgress = h.progress[hp];
    run(h, 20 * 40); run(c, 20 * 40);
    expect(h.flags[hp] & FL_CONSTRUCTING).toBe(FL_CONSTRUCTING);
    expect(h.progress[hp]).toBeCloseTo(hProgress, 1);
    expect(c.flags[cp] & FL_CONSTRUCTING).toBe(0);
    expect(c.players[0].supplyCap).toBe(20);
  });

  it('a queue item that would exceed supply pauses visibly instead of disappearing', () => {
    const s = new Sim(humanVsPassive());
    const hq = own(s, 0, 'core_relay')[0];
    s.players[0].ore = 1000;
    for (let i = 0; i < 5; i++) expect(s.applyCommand(0, { k: 'train', id: hq, def: 'fabricator' })).toBe(true);
    expect(s.applyCommand(0, { k: 'train', id: hq, def: 'fabricator' })).toBe(false); // queue limit
    expect(s.applyCommand(0, { k: 'train', id: hq, def: 'thornling' })).toBe(false); // not trainable here
    run(s, 20 * 12 * 6);
    expect(s.players[0].supplyUsed).toBe(12);
    expect(s.queue[hq]).toHaveLength(0);
    expect(s.applyCommand(0, { k: 'train', id: hq, def: 'fabricator' })).toBe(true); // 13th supply does not fit
    run(s, 20 * 20);
    expect(s.players[0].supplyUsed).toBe(12);
    expect(s.queue[hq]).toHaveLength(1);
    expect(s.queue[hq][0].started).toBe(false);
    expect(queuePauseReason(s, hq)).toMatch(/Supply blocked/);
    const before = s.players[0].ore;
    expect(s.applyCommand(0, { k: 'cancel', id: hq, index: 0 })).toBe(true);
    expect(s.players[0].ore).toBe(before + 50); // full refund
  });

  it('researches upgrades with prerequisites and applies them', () => {
    const s = new Sim(humanVsPassive());
    s.players[0].ore = 5000; s.players[0].flux = 5000;
    const foundry = s.spawn(DEF_INDEX.signal_foundry, 0, 36, 128);
    expect(s.applyCommand(0, { k: 'research', id: foundry, tech: 'helix_atk2' })).toBe(false); // needs tier II + level I
    expect(s.applyCommand(0, { k: 'research', id: foundry, tech: 'helix_atk1' })).toBe(true);
    expect(s.applyCommand(0, { k: 'research', id: foundry, tech: 'helix_atk1' })).toBe(false); // already in progress
    run(s, 20 * 51);
    expect(s.players[0].atkLevel).toBe(1);
    expect(ATTACK_UPGRADE_STEP).toBeLessThanOrEqual(0.12);
    expect(ARMOR_UPGRADE_STEP).toBeLessThanOrEqual(0.12);
  });
});

describe('combat rules', () => {
  it('applies tag bonuses, armor and upgrades deterministically (no dice)', () => {
    const s = new Sim(humanVsPassive());
    const a = s.spawn(DEF_INDEX.lancer, 0, 76, 108);
    const armored = s.spawn(DEF_INDEX.carapace, 1, 82, 108);
    const light = s.spawn(DEF_INDEX.thornling, 1, 76, 102);
    const w = s.d(a).weapon!;
    const hp0 = s.hp[armored];
    // direct damage call mirrors what a projectile hit resolves to
    dealDamage(s, light, w.damage, w, a, 0, 76, 108);
    s.kill(light, -1, true);
    expect(s.d(light).hp - s.hp[light]).toBe(Math.max(1, w.damage - s.d(light).armor));
    run(s, 8); // let vision update so the target is a legal order
    s.applyCommand(1, { k: 'hold', ids: [armored] });
    expect(s.applyCommand(0, { k: 'attack', ids: [a], target: armored })).toBe(true);
    run(s, 80);
    const dealt = hp0 - s.hp[armored];
    // carapace: armored bonus +16, armor 2, ranged damage x0.65
    const perHit = (w.damage + 16 - 2) * 0.65;
    expect(dealt / perHit).toBeCloseTo(Math.round(dealt / perHit), 5);
    expect(dealt).toBeGreaterThan(0);
  });

  it('destroying the last headquarters ends the match', () => {
    const s = new Sim(humanVsPassive());
    const hq = own(s, 1, 'heartgrove')[0];
    s.kill(hq, own(s, 0, 'kestrel')[0]);
    run(s, 20);
    expect(s.winner).toBe(0);
    expect(s.players[1].stats.structuresLost).toBe(1);
    expect(s.applyCommand(0, { k: 'stop', ids: own(s, 0, 'fabricator') })).toBe(false); // no commands after the end
  });

  it('units do not friendly-fire and siege shells have a minimum range', () => {
    const s = new Sim(humanVsPassive());
    const m = s.spawn(DEF_INDEX.mortar, 0, 70, 108);
    const friend = s.spawn(DEF_INDEX.aegis, 0, 80, 108);
    const close = s.spawn(DEF_INDEX.thornling, 1, 72.5, 108); // inside the mortar's minimum range
    s.applyCommand(1, { k: 'hold', ids: [close] });
    const far = s.spawn(DEF_INDEX.carapace, 1, 82.3, 108);
    s.applyCommand(1, { k: 'hold', ids: [far] });
    s.applyCommand(0, { k: 'hold', ids: [m, friend] });
    const closeHp = s.hp[close];
    run(s, 70);
    expect(s.hp[friend]).toBeGreaterThan(0);
    expect(s.target[m]).toBe(far); // the too-close thornling is never the mortar's target
    expect(s.hp[close]).toBe(closeHp);
    expect(s.hp[far]).toBeLessThan(s.d(far).hp); // shelled at range
    // the bulwark standing right next to the impact took damage only from enemies, never from the shell
    expect(s.lastAttacker[friend] === -1 || s.owner[s.lastAttacker[friend]] === 1).toBe(true);
  });
});

describe('fog of war', () => {
  it('hides the enemy, remembers last-known structures and never leaks hidden units in snapshots', () => {
    const s = new Sim(humanVsPassive());
    const enemyHq = own(s, 1, 'heartgrove')[0];
    expect(s.isVisibleTo(0, enemyHq)).toBe(false);
    expect(s.players[0].ghosts.size).toBe(0);
    let snap = buildFilteredSnapshot(s, 0);
    expect(snap.entities.some((e) => e.owner === 1)).toBe(false);
    // attack orders on things you cannot see are rejected
    expect(s.applyCommand(0, { k: 'attack', ids: own(s, 0, 'kestrel'), target: enemyHq })).toBe(false);
    const scout = s.spawn(DEF_INDEX.glimmerwing, 0, s.x[enemyHq] - 6, s.z[enemyHq] + 6);
    run(s, 8);
    expect(s.isVisibleTo(0, enemyHq)).toBe(true);
    expect(s.players[0].ghosts.has(enemyHq)).toBe(true);
    snap = buildFilteredSnapshot(s, 0);
    expect(snap.entities.some((e) => e.owner === 1)).toBe(true);
    s.kill(scout);
    run(s, 8);
    expect(s.isVisibleTo(0, enemyHq)).toBe(false);
    expect(s.players[0].ghosts.has(enemyHq)).toBe(true); // last-known silhouette persists
    snap = buildFilteredSnapshot(s, 0);
    expect(snap.entities.some((e) => e.owner === 1)).toBe(false);
    expect(snap.ghosts.some((g) => g.id === enemyHq)).toBe(true);
    expect(s.applyCommand(0, { k: 'attack', ids: own(s, 0, 'kestrel'), target: enemyHq })).toBe(true); // remembered target
  });

  it('high ground hides units from below but sees down', () => {
    const s = new Sim(humanVsPassive());
    for (const e of [...s.ids]) if (s.owner[e] < 2) s.kill(e, -1, true);
    run(s, 1);
    const hi = s.spawn(DEF_INDEX.bulwark, 0, 48, 124); // on the main plateau edge
    const lo = s.spawn(DEF_INDEX.thornling, 1, 60, 124); // natural below
    run(s, 8);
    expect(s.map.elev[124 * 160 + 48]).toBe(2);
    expect(s.map.elev[124 * 160 + 60]).toBe(1);
    expect(s.isVisibleTo(0, lo)).toBe(true);
    expect(s.isVisibleTo(1, hi)).toBe(false);
  });

  it('AI never targets what it cannot see', () => {
    const s = createSim(skirmishConfig(3, 'helix', 'chorus', 'ai', 'hard', 'hard'));
    for (let i = 0; i < 20 * 60 * 3; i++) {
      s.step();
      if (i % 20 !== 0) continue;
      for (const e of s.ids) {
        if (!s.alive[e] || s.owner[e] > 1) continue;
        const t = s.target[e];
        if (t >= 0 && s.alive[t] && s.owner[t] !== s.owner[e] && s.owner[t] < 2) {
          // a held target must be visible to its attacker's side or be a remembered structure
          expect(s.isVisibleTo(s.owner[e], t) || s.players[s.owner[e]].ghosts.has(t)).toBe(true);
        }
      }
    }
  });
});

describe('determinism, clock and replay', () => {
  it('produces identical state hashes for identical seeds and inputs', () => {
    const a = createSim(skirmishConfig(42, 'helix', 'chorus', 'ai', 'normal', 'normal'));
    const b = createSim(skirmishConfig(42, 'helix', 'chorus', 'ai', 'normal', 'normal'));
    const c = createSim(skirmishConfig(43, 'helix', 'chorus', 'ai', 'normal', 'normal'));
    let diverged = false;
    for (let i = 0; i < 20 * 60 * 4; i++) {
      a.step(); b.step(); c.step();
      if (i % 100 === 0) { expect(a.hash()).toBe(b.hash()); if (a.hash() !== c.hash()) diverged = true; }
    }
    expect(diverged).toBe(true); // a different seed changes the AI's personality
  });

  it('the fixed clock yields the same tick count at 30, 60 and 144 fps', () => {
    const counts = [30, 60, 144].map((fps) => {
      const clock = new FixedClock();
      let ticks = 0;
      const frames = fps * 10;
      for (let i = 0; i < frames; i++) ticks += clock.advance(1000 / fps);
      return ticks;
    });
    expect(Math.abs(counts[0] - 200)).toBeLessThanOrEqual(1);
    expect(Math.abs(counts[1] - 200)).toBeLessThanOrEqual(1);
    expect(Math.abs(counts[2] - 200)).toBeLessThanOrEqual(1);
    const stall = new FixedClock();
    expect(stall.advance(5000)).toBe(4); // a long stall never spirals
  });

  it('replaying the recorded command stream reaches the same hashes and outcome', () => {
    const cfg = skirmishConfig(9, 'helix', 'chorus', 'human', 'easy', 'easy');
    const script = (s: Sim, tick: number): Command[] => {
      const out: Command[] = [];
      const workers = own(s, 0, 'fabricator');
      const hq = own(s, 0, 'core_relay')[0];
      if (tick === 5) out.push({ k: 'gather', ids: workers, target: nearestOre(s, 24, 134) });
      if (tick % 300 === 20 && hq !== undefined) out.push({ k: 'train', id: hq, def: 'fabricator' });
      if (tick === 400) out.push({ k: 'build', ids: [workers[0]], def: 'grid_pylon', x: 36, z: 128 });
      if (tick === 1300) out.push({ k: 'build', ids: [workers[1]], def: 'assembly_bay', x: 38, z: 140 });
      if (tick > 2400 && tick % 320 === 0) { const bay = own(s, 0, 'assembly_bay')[0]; if (bay !== undefined) out.push({ k: 'train', id: bay, def: 'bulwark' }); }
      if (tick === 5200) out.push({ k: 'amove', ids: own(s, 0, 'bulwark'), x: 80, z: 120 });
      if (tick === 5600) out.push({ k: 'surrender' });
      return out;
    };
    const rec = createSim(cfg);
    const log: { tick: number; seq: number; cmd: Command }[] = [];
    const hashes: [number, number][] = [];
    let seq = 0;
    while (rec.winner < 0 && rec.tick < 6000) {
      for (const cmd of script(rec, rec.tick)) { const env = { tick: rec.tick + 2, seq: seq++, cmd }; log.push(env); rec.schedule(0, env.seq, env.tick, env.cmd); }
      rec.step();
      if (rec.tick % 100 === 0) hashes.push([rec.tick, rec.hash()]);
    }
    expect(rec.winner).toBe(1);
    expect(log.length).toBeGreaterThan(20);
    // serialise + parse to prove the replay survives the wire format
    const wire = JSON.parse(JSON.stringify({ cfg, log, hashes })) as { cfg: MatchConfig; log: typeof log; hashes: [number, number][] };
    const rep = createSim(wire.cfg);
    for (const env of wire.log) rep.schedule(0, env.seq, env.tick, env.cmd);
    let hi = 0;
    while (rep.winner < 0 && rep.tick < 6000) {
      rep.step();
      if (rep.tick % 100 === 0) { expect(rep.hash()).toBe(wire.hashes[hi][1]); hi++; }
    }
    expect(hi).toBe(hashes.length);
    expect(rep.winner).toBe(rec.winner);
    expect(rep.tick).toBe(rec.tick);
  });
});

describe('command validation', () => {
  it('rejects commands for entities the player does not own and malformed input', () => {
    const s = new Sim(humanVsPassive());
    const enemyWorkers = own(s, 1, 'tender');
    expect(s.applyCommand(0, { k: 'move', ids: enemyWorkers, x: 80, z: 80 })).toBe(false);
    expect(s.applyCommand(0, { k: 'move', ids: [99999, -1], x: 80, z: 80 })).toBe(false);
    expect(s.applyCommand(0, { k: 'move', ids: own(s, 0, 'fabricator'), x: NaN, z: 80 })).toBe(false);
    expect(s.applyCommand(0, { k: 'train', id: own(s, 1, 'heartgrove')[0], def: 'tender' })).toBe(false);
    expect(s.applyCommand(5 as never, { k: 'stop', ids: [] })).toBe(false);
    run(s, 40);
    expect(s.orders[enemyWorkers[0]]).toHaveLength(0);
    expect(s.players[0].stats.rejected).toBeGreaterThanOrEqual(4);
  });
});

describe('map objectives and endgame', () => {
  it('a unit standing by a Watch Pylon for 3 seconds captures it and gains vision', () => {
    const s = new Sim(humanVsPassive());
    const pylon = s.ids.find((e) => s.d(e).id === 'watch_pylon') as number;
    const u = s.spawn(DEF_INDEX.bulwark, 0, s.x[pylon] + 2.5, s.z[pylon]);
    run(s, 50);
    expect(s.capOwner[pylon]).toBe(-1);
    run(s, 20);
    expect(s.capOwner[pylon]).toBe(0);
    s.kill(u);
    run(s, 8);
    expect(s.players[0].visible[s.visIndex(s.x[pylon] + 8, s.z[pylon])]).toBe(1);
  });

  it('salvage pods grant a fixed bundle once', () => {
    const s = new Sim(humanVsPassive());
    const pod = s.ids.find((e) => s.d(e).id === 'pod') as number;
    s.spawn(DEF_INDEX.bulwark, 0, s.x[pod] + 1, s.z[pod]);
    const ore = s.players[0].ore;
    run(s, 10);
    expect(s.alive[pod]).toBe(0);
    expect(s.players[0].ore).toBe(ore + 100);
    expect(s.players[0].flux).toBe(25);
  });

  it('after 18 minutes wells yield 15% more and the centre emits a reveal pulse', () => {
    const s = new Sim(humanVsPassive());
    s.tick = ENDGAME_TICK - 1;
    const enemyHq = own(s, 1, 'heartgrove')[0];
    run(s, 6);
    expect(s.revealUntil).toBeGreaterThan(s.tick);
    expect(s.isVisibleTo(0, enemyHq)).toBe(true);
    const w = own(s, 0, 'fabricator')[0];
    const before = s.players[0].ore;
    s.applyCommand(0, { k: 'gather', ids: [w], target: nearestOre(s, 24, 134) });
    run(s, 300);
    const gained = s.players[0].ore - before;
    expect(gained / (ORE_LOAD * 1.15)).toBeCloseTo(Math.round(gained / (ORE_LOAD * 1.15)), 4);
    run(s, 200);
    expect(s.isVisibleTo(0, enemyHq)).toBe(false); // the pulse fades
  });

  it('a stalled match is decided at 35:00 by surviving force value', () => {
    const s = new Sim(humanVsPassive());
    s.tick = DECISION_TICK - 1;
    s.spawn(DEF_INDEX.aegis, 1, 100, 60);
    run(s, 3);
    expect(s.winner).toBe(1);
  });

  it('destructible barriers open a new route when broken', () => {
    const s = new Sim(humanVsPassive());
    const barrier = s.ids.find((e) => s.d(e).id === 'barrier' && s.x[e] === 102) as number;
    const blockedLen = s.pathfinder.pathLength(90, 134, 112, 134);
    s.kill(barrier);
    const openLen = s.pathfinder.pathLength(90, 134, 112, 134);
    expect(blockedLen).toBeGreaterThan(openLen * 2);
    expect(openLen).toBeLessThan(26);
  });
});

describe('movement', () => {
  it('a 40-unit group passes the narrowest choke without overlapping or sticking', () => {
    const s = new Sim(humanVsPassive());
    const units: number[] = [];
    for (let i = 0; i < 40; i++) units.push(s.spawnUnitNear(i % 3 === 0 ? DEF_INDEX.lancer : DEF_INDEX.bulwark, 0, 66 + (i % 8) * 1.6, 124 + Math.floor(i / 8) * 1.6));
    run(s, 10);
    // through the natural choke (10 cells wide) to the open ground beyond
    expect(s.applyCommand(0, { k: 'move', ids: units, x: 75, z: 100 })).toBe(true);
    let worstStuck = 0;
    for (let i = 0; i < 20 * 30; i++) {
      s.step();
      for (const u of units) worstStuck = Math.max(worstStuck, s.stuck[u]);
    }
    for (const u of units) {
      expect(s.z[u]).toBeLessThan(114); // everyone is through the choke (the ridge spans z 114-118)
      expect(s.orders[u]).toHaveLength(0);
    }
    expect(worstStuck).toBeLessThan(60 + 20); // never stuck for more than ~3 s
    let worstOverlap = 0;
    for (let i = 0; i < units.length; i++) for (let j = i + 1; j < units.length; j++) {
      const a = units[i], b = units[j];
      const d = Math.hypot(s.x[a] - s.x[b], s.z[a] - s.z[b]);
      worstOverlap = Math.max(worstOverlap, (s.d(a).radius + s.d(b).radius - d) / (s.d(a).radius + s.d(b).radius));
    }
    expect(worstOverlap).toBeLessThan(0.35);
  });

  it('hovering scouts cross the ravine; ground units path around it', () => {
    const s = new Sim(humanVsPassive());
    const hover = s.spawn(DEF_INDEX.glimmerwing, 0, 46, 60);
    const ground = s.spawn(DEF_INDEX.kestrel, 0, 46, 62);
    s.applyCommand(0, { k: 'move', ids: [hover], x: 62, z: 46 });
    s.applyCommand(0, { k: 'move', ids: [ground], x: 62, z: 46 });
    run(s, 20 * 4);
    expect(Math.hypot(s.x[hover] - 62, s.z[hover] - 46)).toBeLessThan(1);
    expect(Math.hypot(s.x[ground] - 62, s.z[ground] - 46)).toBeGreaterThan(3); // still going the long way round
    run(s, 20 * 20);
    expect(Math.hypot(s.x[ground] - 62, s.z[ground] - 46)).toBeLessThan(1.5);
  });
});
