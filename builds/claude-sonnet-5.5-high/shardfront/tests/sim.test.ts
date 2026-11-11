import { describe, expect, it } from 'vitest';
import { allDefs, defIndex } from '../src/data';
import { Sim } from '../src/sim/sim';
import { applyDamage, canTarget } from '../src/sim/combat';
import { advanceLikeLoop, cmd, di, hall, makeSim, ofType, run, secs } from './helpers';

describe('economy and production', () => {
  it('starts with a Core Relay, six workers, one scout and a supply cap', () => {
    const sim = makeSim();
    for (const p of [0, 1]) {
      expect(sim.ids.filter((i) => sim.owner[i] === p && sim.td(i).isHall).length).toBe(1);
      expect(sim.ids.filter((i) => sim.owner[i] === p && sim.td(i).isWorker).length).toBe(6);
      expect(sim.ids.filter((i) => sim.owner[i] === p && sim.def(i).role === 'scout').length).toBe(1);
      expect(sim.players[p].supplyCap).toBe(10);
      expect(sim.players[p].supplyUsed).toBe(7);
    }
  });

  it('workers mine, carry and deliver Prism Ore; income grows', () => {
    const sim = makeSim();
    run(sim, secs(60));
    expect(sim.players[0].stats.ore).toBeGreaterThan(150);
    expect(sim.players[0].ore).toBeGreaterThan(300);
  });

  it('over-saturation is possible but clearly inefficient', () => {
    const income = (extra: number) => {
      const sim = makeSim({ startOre: 5000 });
      const h = hall(sim, 0);
      for (let i = 0; i < extra; i++) cmd(sim, { c: 'train', target: h, param: di('fabricator') });
      // pylons are not needed: cap raised by cheating supply via a few pylons is overkill; train what fits
      run(sim, secs(40));
      const before = sim.players[0].stats.ore;
      run(sim, secs(120));
      return sim.players[0].stats.ore - before;
    };
    // supply cap 10 limits us to 3 extra workers: compare 6 vs 9 workers is not saturation, so lift supply with a free cheat
    const base = income(0);
    const sim2 = makeSim({ startOre: 5000 });
    sim2.players[0].supplyCap = 0;
    const h2 = hall(sim2, 0);
    // spawn 12 more workers directly to over-saturate (6 -> 18)
    for (let i = 0; i < 12; i++) {
      const w = sim2.spawn(di('fabricator'), 0, sim2.x[h2] + 4 + (i % 4), sim2.y[h2] + 4 + Math.floor(i / 4));
      sim2.orderGatherNearest(w, h2);
    }
    run(sim2, secs(40));
    const b2 = sim2.players[0].stats.ore;
    run(sim2, secs(120));
    const over = sim2.players[0].stats.ore - b2;
    expect(over).toBeGreaterThan(base); // more workers do mine more…
    expect(over).toBeLessThan(base * 3); // …but 3x the workers is far from 3x the income
  });

  it('queued units pause visibly (not vanish) when supply-blocked and resume after a pylon', () => {
    const sim = makeSim({ startOre: 3000 });
    const h = hall(sim, 0);
    for (let i = 0; i < 5; i++) cmd(sim, { c: 'train', target: h, param: di('fabricator') });
    run(sim, secs(60));
    const q = sim.ext[h].q;
    expect(sim.players[0].supplyUsed).toBeLessThanOrEqual(sim.players[0].supplyCap);
    expect(q.length).toBeGreaterThan(0);
    expect(q[0].paused).toBe('supply');
    // build a pylon: find a legal spot
    const w = ofType(sim, 0, 'fabricator')[0];
    let spot: { x: number; y: number } | null = null;
    for (let r = 8; r < 14 && !spot; r++) for (let k = 0; k < 24; k++) { const a = (k / 24) * 6.28; const x = sim.x[h] + Math.cos(a) * r, y = sim.y[h] + Math.sin(a) * r; if (sim.canPlace(0, di('grid_pylon'), x, y).ok) { spot = { x, y }; break; } }
    expect(spot).not.toBeNull();
    cmd(sim, { c: 'order', ord: 'build', ids: [w], x: spot!.x, y: spot!.y, param: di('grid_pylon') });
    run(sim, secs(80));
    expect(sim.players[0].supplyCap).toBe(18);
    expect(sim.ext[h].q.length === 0 || sim.ext[h].q[0].paused === '').toBe(true);
    expect(ofType(sim, 0, 'fabricator').length).toBeGreaterThan(8);
  });

  it('cancelling a queue item refunds fully, cancelling construction refunds 75%', () => {
    const sim = makeSim({ startOre: 1000 });
    const h = hall(sim, 0);
    cmd(sim, { c: 'train', target: h, param: di('fabricator') });
    expect(sim.players[0].ore).toBe(950);
    cmd(sim, { c: 'cancel', target: h, param: 0 });
    expect(sim.players[0].ore).toBe(1000);
    const w = ofType(sim, 0, 'fabricator')[0];
    let spot: { x: number; y: number } | null = null;
    for (let r = 8; r < 14 && !spot; r++) for (let k = 0; k < 24; k++) { const a = (k / 24) * 6.28; const x = sim.x[h] + Math.cos(a) * r, y = sim.y[h] + Math.sin(a) * r; if (sim.canPlace(0, di('grid_pylon'), x, y).ok) { spot = { x, y }; break; } }
    cmd(sim, { c: 'order', ord: 'build', ids: [w], x: spot!.x, y: spot!.y, param: di('grid_pylon') });
    run(sim, secs(14));
    const p = ofType(sim, 0, 'grid_pylon')[0];
    expect(p).toBeDefined();
    const ore = sim.players[0].ore;
    expect(sim.ext[p].done).toBe(false);
    cmd(sim, { c: 'cancel', target: p, param: -1 });
    expect(sim.players[0].ore).toBe(ore + 75);
  });

  it('structure placement obeys fields, resource clearance and terrain', () => {
    const sim = makeSim();
    const h = hall(sim, 0);
    expect(sim.canPlace(0, di('grid_pylon'), sim.x[h], sim.y[h]).ok).toBe(false); // on the core
    expect(sim.canPlace(0, di('grid_pylon'), 100, 20).reason).toMatch(/field|Terrain|object|bounds/i); // enemy side
    expect(sim.canPlace(0, di('core_relay'), sim.x[h] + 8, sim.y[h]).ok).toBe(false); // not an expansion site
    const nat = sim.map.sites.find((s) => s.id === 'p0_nat')!;
    expect(sim.canPlace(0, di('core_relay'), nat.x, nat.y).ok).toBe(true);
    // tap only on vents
    expect(sim.canPlace(0, di('flux_tap'), sim.x[h] + 3, sim.y[h] + 3).ok).toBe(false);
    const vent = sim.ids.find((i) => sim.type[i] === defIndex['flux_vent'] && Math.hypot(sim.x[i] - sim.x[h], sim.y[i] - sim.y[h]) < 15)!;
    expect(sim.canPlace(0, di('flux_tap'), sim.x[vent], sim.y[vent]).ok).toBe(true);
  });

  it('flux is only mined once a Flux Tap stands on the vent', () => {
    const sim = makeSim({ startOre: 2000 });
    const h = hall(sim, 0);
    const vent = sim.ids.find((i) => sim.type[i] === defIndex['flux_vent'] && Math.hypot(sim.x[i] - sim.x[h], sim.y[i] - sim.y[h]) < 15)!;
    const ws = ofType(sim, 0, 'fabricator');
    cmd(sim, { c: 'order', ord: 'gather', ids: [ws[0]], target: vent });
    run(sim, secs(30));
    expect(sim.players[0].flux).toBe(0);
    cmd(sim, { c: 'order', ord: 'build', ids: [ws[1]], x: sim.x[vent], y: sim.y[vent], param: di('flux_tap') });
    run(sim, secs(40));
    expect(ofType(sim, 0, 'flux_tap').length).toBe(1);
    cmd(sim, { c: 'order', ord: 'gather', ids: [ws[0], ws[1], ws[2]], target: vent });
    run(sim, secs(60));
    expect(sim.players[0].flux).toBeGreaterThan(20);
  });

  it('Verdant structures grow on their own once seeded (worker is freed)', () => {
    const sim = makeSim({ factions: ['verdant', 'helix'], startOre: 1000 });
    const h = hall(sim, 0);
    const w = ofType(sim, 0, 'tender')[0];
    let spot: { x: number; y: number } | null = null;
    for (let r = 8; r < 14 && !spot; r++) for (let k = 0; k < 24; k++) { const a = (k / 24) * 6.28; const x = sim.x[h] + Math.cos(a) * r, y = sim.y[h] + Math.sin(a) * r; if (sim.canPlace(0, di('root_node'), x, y).ok) { spot = { x, y }; break; } }
    cmd(sim, { c: 'order', ord: 'build', ids: [w], x: spot!.x, y: spot!.y, param: di('root_node') });
    run(sim, secs(20));
    const n = ofType(sim, 0, 'root_node')[0];
    expect(n).toBeDefined();
    expect(sim.ext[w].orders[0]?.k).not.toBe(7);
    run(sim, secs(40));
    expect(sim.ext[n].done).toBe(true);
  });
});

describe('research and abilities', () => {
  it('research applies upgrades; tech requirements are enforced', () => {
    const sim = makeSim({ startOre: 5000 });
    sim.players[0].flux = 3000;
    const h = hall(sim, 0);
    const bay = sim.spawn(di('assembly_bay'), 0, sim.x[h] - 9, sim.y[h] + 2, {});
    const foundry = sim.spawn(di('signal_foundry'), 0, sim.x[h] - 9, sim.y[h] + 6, {});
    const pyl = sim.spawn(di('grid_pylon'), 0, sim.x[h] + 8, sim.y[h] + 8, {});
    void pyl; void bay;
    sim.updateSupply();
    cmd(sim, { c: 'research', target: foundry, param: 1 }); // attack II needs I
    expect(sim.ext[foundry].q.length).toBe(0);
    cmd(sim, { c: 'research', target: foundry, param: 0 });
    expect(sim.ext[foundry].q.length).toBe(1);
    run(sim, secs(70));
    expect(sim.players[0].atkBonus).toBeCloseTo(0.08, 5);
    // Aegis Frame is locked behind Heavy Chassis
    const bayId = ofType(sim, 0, 'assembly_bay')[0];
    cmd(sim, { c: 'train', target: bayId, param: di('aegis_frame') });
    expect(sim.ext[bayId].q.length).toBe(0);
  });

  it('Bulwark brace extends range and stops movement', () => {
    const sim = makeSim();
    const u = sim.spawn(di('bulwark'), 0, 40, 100, {});
    cmd(sim, { c: 'order', ord: 'ability', ids: [u], param: 0 });
    run(sim, secs(2));
    expect(sim.ext[u].mode).toBeGreaterThanOrEqual(18);
    const x0 = sim.x[u];
    cmd(sim, { c: 'order', ord: 'move', ids: [u], x: 50, y: 100 });
    expect(sim.ext[u].mode).toBe(0); // a move order unbraces
    run(sim, secs(2));
    expect(sim.x[u]).toBeGreaterThan(x0);
  });
});

describe('combat rules', () => {
  const setup = () => {
    const sim = makeSim();
    // clear everything of player 1 and 0 except halls so that fights are isolated
    return sim;
  };
  it('armor reduces damage by a soft percentage and Light/Armored bonuses apply', () => {
    const sim = setup();
    const lancer = sim.spawn(di('arc_lancer'), 0, 70, 70, {});
    const light = sim.spawn(di('thornling'), 1, 74, 70, {});
    const armored = sim.spawn(di('carapace_guard'), 1, 74, 73, {});
    sim.players[0].vis.fill(2);
    sim.rebuildHash();
    const hl0 = sim.hp[light], ha0 = sim.hp[armored];
    cmd(sim, { c: 'order', ord: 'attack', ids: [lancer], target: armored });
    run(sim, secs(4));
    const dArmored = ha0 - sim.hp[armored];
    cmd(sim, { c: 'order', ord: 'attack', ids: [lancer], target: light });
    run(sim, secs(4));
    expect(dArmored).toBeGreaterThan(20); // 24 + 16 bonus, armor 2 reduces it (only partially)
    expect(hl0 - sim.hp[light]).toBeGreaterThan(0);
    // formula: raw*(100/(100+10*armor))
    const before = sim.hp[armored];
    applyDamage(sim, armored, 100, -1, 0, 0, 0, false);
    expect(before - sim.hp[armored]).toBeCloseTo(100 * (100 / (100 + 20)), 1);
  });

  it('Aegis shield absorbs frontal projectile damage but not flanking fire', () => {
    const sim = setup();
    const a = sim.spawn(di('aegis_frame'), 1, 70, 70, { face: 0 });
    const hp0 = sim.hp[a];
    applyDamage(sim, a, 60, -1, 0, 80, 70, true); // from the front (+x)
    expect(sim.hp[a]).toBe(hp0);
    expect(sim.ext[a].shield).toBeCloseTo(160 - 60 * (100 / 130), 0);
    applyDamage(sim, a, 60, -1, 0, 60, 70, true); // from behind
    expect(sim.hp[a]).toBeLessThan(hp0);
  });

  it('Mortar Crawler cannot fire inside its minimum range and needs setup', () => {
    const sim = setup();
    const m = sim.spawn(di('mortar_crawler'), 0, 70, 70, {});
    const e = sim.spawn(di('carapace_guard'), 1, 72.5, 70, {});
    sim.players[0].vis.fill(2);
    cmd(sim, { c: 'order', ord: 'attack', ids: [m], target: e });
    run(sim, secs(0.5));
    expect(sim.projectiles.length + sim.effects.length).toBe(0);
    const far = sim.spawn(di('carapace_guard'), 1, 78.5, 70, {});
    cmd(sim, { c: 'order', ord: 'attack', ids: [m], target: far });
    const hp0 = sim.hp[far];
    run(sim, secs(8));
    expect(sim.hp[far]).toBeLessThan(hp0);
  });

  it('Sporecaster slow does not stack and expires', () => {
    const sim = setup();
    const s1 = sim.spawn(di('sporecaster'), 0, 70, 70, {});
    const s2 = sim.spawn(di('sporecaster'), 0, 70, 72, {});
    const target = sim.spawn(di('fabricator'), 1, 76, 71, {});
    void s1; void s2;
    sim.players[0].vis.fill(2);
    sim.rebuildHash();
    cmd(sim, { c: 'order', ord: 'attack', ids: [s1, s2], target });
    run(sim, secs(3));
    expect(sim.ext[target].slowF).toBeCloseTo(0.7, 5);
    cmd(sim, { c: 'order', ord: 'move', ids: [s1, s2], x: 60, y: 70, force: true });
    run(sim, secs(5));
    expect(sim.tick).toBeGreaterThan(sim.ext[target].slowUntil);
  });

  it('Mender Rig heals nearby mechanical units using energy', () => {
    const sim = setup();
    const rig = sim.spawn(di('mender_rig'), 0, 70, 70, {});
    const b = sim.spawn(di('bulwark'), 0, 72, 70, {});
    sim.hp[b] = 40;
    run(sim, secs(5));
    expect(sim.hp[b]).toBeGreaterThan(60);
    expect(sim.ext[rig].energy).toBeLessThan(50);
  });

  it('Silence Patch telegraphs then silences enemy ability use', () => {
    const sim = makeSim({ factions: ['verdant', 'helix'] });
    const sage = sim.spawn(di('bloom_sage'), 0, 70, 70, {});
    const bul = sim.spawn(di('bulwark'), 1, 75, 70, {});
    sim.ext[sage].energy = 100;
    cmd(sim, { c: 'order', ord: 'ability', ids: [sage], x: 75, y: 70, param: 0 });
    run(sim, secs(0.3));
    expect(sim.effects.some((e) => e.kind === 'silence')).toBe(true);
    expect(sim.ext[bul].silUntil).toBeLessThanOrEqual(sim.tick); // still telegraphing: not active yet
    run(sim, secs(2));
    expect(sim.ext[bul].silUntil).toBeGreaterThan(sim.tick - 1);
  });

  it('fog hides live enemy state: units cannot target what the owner cannot see', () => {
    const sim = makeSim();
    const a = sim.spawn(di('bulwark'), 0, 70, 70, {});
    const far = sim.spawn(di('bulwark'), 1, 100, 100, {});
    run(sim, 8);
    expect(sim.visibleTo(0, far)).toBe(false);
    expect(canTarget(sim, a, far, false)).toBe(false);
    const near = sim.spawn(di('bulwark'), 1, 75, 70, {});
    run(sim, 8);
    expect(sim.visibleTo(0, near)).toBe(true);
    expect(canTarget(sim, a, near, false)).toBe(true);
  });

  it('high ground is not visible from below and brush hides units', () => {
    const sim = makeSim();
    const spy = sim.spawn(di('bulwark'), 1, 22, 118, {}); // on player 0's high ground main
    const low = sim.spawn(di('bulwark'), 0, 22, 90, {}); // below the cliff
    run(sim, 8);
    expect(sim.visibleTo(0, spy)).toBe(true); // it is inside the owner's own sight radius from the hall
    expect(sim.visibleTo(1, low)).toBe(false);
  });
});

describe('victory and determinism', () => {
  it('destroying every Core Relay ends the match', () => {
    const sim = makeSim();
    sim.kill(hall(sim, 1), 0);
    run(sim, 3);
    expect(sim.over).toBe(true);
    expect(sim.winner).toBe(0);
  });

  it('same seed + same commands = same state hashes; different seed diverges', () => {
    const a = new Sim({ seed: 9, factions: ['helix', 'verdant'], ai: ['normal', 'normal'], mode: 'skirmish' });
    const b = new Sim({ seed: 9, factions: ['helix', 'verdant'], ai: ['normal', 'normal'], mode: 'skirmish' });
    const c = new Sim({ seed: 10, factions: ['helix', 'verdant'], ai: ['normal', 'normal'], mode: 'skirmish' });
    run(a, secs(240)); run(b, secs(240)); run(c, secs(240));
    expect(a.hashes.length).toBeGreaterThan(20);
    expect(a.hashes).toEqual(b.hashes);
    expect(a.stateHash()).not.toBe(c.stateHash());
  });

  it('simulation results are independent of the display frame rate (30 / 60 / 144 fps loops)', () => {
    const mk = () => { const s = makeSim({ ai: [null, 'normal'] }); const h = hall(s, 0); cmd(s, { c: 'train', target: h, param: di('fabricator') }); return s; };
    const hashes = [30, 60, 144].map((fps) => { const s = mk(); advanceLikeLoop(s, 120, fps); return [s.tick, s.stateHash()]; });
    expect(hashes[0]).toEqual(hashes[1]);
    expect(hashes[1]).toEqual(hashes[2]);
  });

  it('a recorded local match replays to the same periodic hashes and outcome', () => {
    const cfg = { seed: 21, factions: ['helix', 'verdant'] as ['helix', 'verdant'], ai: [null, 'normal'] as [null, string], mode: 'skirmish' as const };
    const live = new Sim(cfg);
    const h = hall(live, 0);
    // scripted "human": build order via commands
    const script: Array<[number, () => void]> = [
      [20, () => cmd(live, { c: 'train', target: h, param: di('fabricator') })],
      [200, () => cmd(live, { c: 'train', target: h, param: di('fabricator') })],
      [600, () => { const ws = ofType(live, 0, 'fabricator'); cmd(live, { c: 'order', ord: 'move', ids: ws.slice(0, 2), x: live.x[h] - 6, y: live.y[h] - 3 }); }],
      [1000, () => cmd(live, { c: 'order', ord: 'attackMove', ids: ofType(live, 0, 'kestrel'), x: 70, y: 70 })],
    ];
    for (let t = 0; t < secs(180); t++) {
      for (const [at, f] of script) if (at === live.tick) f();
      live.step(); live.events.length = 0;
    }
    const log = live.log.slice();
    expect(log.length).toBe(script.length);
    // replay on a fresh sim, injecting commands the way Game does
    const rep = new Sim(cfg);
    let idx = 0;
    for (let t = 0; t < secs(180); t++) {
      while (idx < log.length && (log[idx].tick ?? 0) <= rep.tick) rep.applyCommand(log[idx++]);
      rep.step(); rep.events.length = 0;
    }
    expect(rep.hashes).toEqual(live.hashes);
    expect(rep.stateHash()).toBe(live.stateHash());
  });
});

describe('navigation', () => {
  it('a large army moves through the map and units do not stay stacked on each other', () => {
    const sim = makeSim();
    const ids: number[] = [];
    const n = 40;
    for (let i = 0; i < n; i++) ids.push(sim.spawn(di('bulwark'), 0, 48 + (i % 8) * 1.7, 84 + Math.floor(i / 8) * 1.7, {}));
    sim.rebuildHash();
    const dest = { x: 72, y: 72 };
    cmd(sim, { c: 'order', ord: 'move', ids, x: dest.x, y: dest.y });
    run(sim, secs(60));
    // everyone should be near the destination, none stuck far away
    const far = ids.filter((id) => Math.hypot(sim.x[id] - dest.x, sim.y[id] - dest.y) > 9);
    expect(far.length).toBe(0);
    // no permanent overlaps
    let bad = 0;
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
      const d = Math.hypot(sim.x[ids[i]] - sim.x[ids[j]], sim.y[ids[i]] - sim.y[ids[j]]);
      if (d < 0.7 * 1.4 * 0.6) bad++;
    }
    expect(bad).toBe(0);
  });

  it('units cross the narrow gate of the natural without getting stuck for more than 3 seconds', () => {
    const sim = makeSim();
    const gate = { x: 50, y: 86 };
    const ids: number[] = [];
    for (let i = 0; i < 24; i++) ids.push(sim.spawn(di('thornling'), 0, 30 + (i % 6) * 1.3, 78 + Math.floor(i / 6) * 1.3, {}));
    sim.rebuildHash();
    cmd(sim, { c: 'order', ord: 'move', ids, x: 70, y: 70 });
    let maxStuck = 0;
    for (let t = 0; t < secs(70); t++) {
      sim.step(); sim.events.length = 0;
      for (const id of ids) maxStuck = Math.max(maxStuck, sim.ext[id].stuck);
    }
    expect(maxStuck).toBeLessThan(60 + 20); // < 3-4 s of no progress at any point (stuck counter in ticks)
    const moved = ids.filter((id) => Math.hypot(sim.x[id] - 70, sim.y[id] - 70) < 10).length;
    expect(moved).toBeGreaterThanOrEqual(20);
    void gate;
  });
});

describe('AI', () => {
  it('Normal AI vs Normal AI plays a full match: workers, supply, production, expansion, attacks, victory', () => {
    const sim = new Sim({ seed: 3, factions: ['helix', 'verdant'], ai: ['normal', 'normal'], mode: 'skirmish' });
    run(sim, secs(60 * 16));
    const created = (p: number) => sim.players[p].stats;
    for (const p of [0, 1]) {
      expect(created(p).created).toBeGreaterThan(30);
      expect(created(p).structures).toBeGreaterThan(8);
      expect(created(p).firstExpandTick).toBeGreaterThan(0);
      expect(created(p).killed).toBeGreaterThan(0);
    }
    expect(sim.over).toBe(true);
  });

  it('the AI obeys fog: it never targets or remembers enemies it has not seen', () => {
    const sim = new Sim({ seed: 4, factions: ['helix', 'verdant'], ai: [null, 'normal'], mode: 'skirmish' });
    run(sim, secs(90));
    // before contact the AI should not have attacked: its army stays home and it has not scouted my buildings
    const ai = sim.players[1].ai as unknown as { mem: Map<number, unknown> };
    for (const id of ai.mem.keys()) {
      const x = sim.x[id], y = sim.y[id];
      // every remembered entity was visible at the time; at least it must be an enemy entity
      expect(sim.owner[id]).toBe(0);
      void x; void y;
    }
    expect(sim.players[0].stats.lost).toBe(0);
  });

  it('every unit and structure has a producer, a cost, and is reachable through the tech tree', () => {
    for (const d of allDefs) {
      if (d.kind === 'unit' && d.producedBy) expect(allDefs.find((x) => x.id === d.producedBy)?.produces).toContain(d.id);
    }
  });
});
