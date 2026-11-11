// Scenario hooks applied deterministically right after map population, so replays of tutorial
// and benchmark matches reproduce exactly.
import type { Sim } from '../simulation-core/sim';
import { Kind } from '../simulation-core/types';

export function applyScenario(sim: Sim) {
  const mode = sim.setup.mode;
  if (mode === 'skirmish') {
    // starting workers begin mining immediately (each takes the nearest free seam)
    for (const p of sim.players) {
      const ores: number[] = [];
      for (let id = 1; id < sim.nextId; id++) if (sim.kind[id] === Kind.Ore && Math.hypot(sim.x[id] - p.startX, sim.y[id] - p.startY) < 13) ores.push(id);
      sim.unitsOf(p.id).filter((u) => sim.udef(u).worker).forEach((w, i) => { if (ores.length) sim.ext[w].orders = [{ t: 'gather', target: ores[i % ores.length] }]; });
    }
  }
  if (mode === 'tutorial') {
    sim.players[0].ore = 400;
    sim.players[0].flux = 60;
    // the enemy is a passive training outpost: no workers, a few defenders, a weakened Heartgrove
    for (const u of sim.unitsOf(1)) { sim.alive[u] = 0; sim.events.push({ type: 'death', id: u, kind: 'silent' }); }
    const hq = sim.structuresOf(1)[0];
    sim.hp[hq] = sim.maxHp[hq] = 900;
    const p1 = sim.players[1];
    const dx = 72 - p1.startX, dy = 72 - p1.startY, l = Math.hypot(dx, dy);
    const ux = dx / l, uy = dy / l;
    for (let k = 0; k < 3; k++) {
      const t = sim.spawnUnit('thornling', 1, p1.startX + ux * 7 + (k - 1) * 1.5 * -uy, p1.startY + uy * 7 + (k - 1) * 1.5 * ux);
      sim.ext[t].orders = [{ t: 'hold' }];
    }
    sim.recomputeSupply();
  }
  if (mode === 'benchmark') {
    // 220 active mobile units clashing in the open ground west of the chasm
    for (const p of sim.players) { p.ore = 0; }
    for (let id = 1; id < sim.nextId; id++) if (sim.kind[id] === Kind.Unit) { sim.alive[id] = 0; sim.events.push({ type: 'death', id, kind: 'silent' }); }
    const helix = ['bulwark', 'bulwark', 'arc_lancer', 'mortar_crawler', 'kestrel', 'mender_rig', 'aegis_frame'];
    const verdant = ['thornling', 'thornling', 'sporecaster', 'carapace_guard', 'rift_stag', 'bloom_sage', 'crownbeast'];
    for (let i = 0; i < 110; i++) {
      const row = Math.floor(i / 11), col = i % 11;
      sim.spawnUnit(sim.players[0].faction === 'helix' ? helix[i % 7] : verdant[i % 7], 0, 5 + col * 1.6, 84 + row * 1.6);
      sim.spawnUnit(sim.players[1].faction === 'helix' ? helix[i % 7] : verdant[i % 7], 1, 5 + col * 1.6, 40 + row * 1.6);
    }
    sim.players.forEach((p) => { p.supplyCap = 400; });
  }
}

/** Benchmark kick-off: both armies attack-move into each other (deterministic). */
export function benchmarkOrders(sim: Sim) {
  const a = sim.unitsOf(0), b = sim.unitsOf(1);
  sim.issue({ player: 0, kind: 'attackMove', ids: a, x: 13, y: 46 });
  sim.issue({ player: 1, kind: 'attackMove', ids: b, x: 13, y: 92 });
}
