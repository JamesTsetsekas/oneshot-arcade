import { describe, expect, test } from 'vitest';
import { clearUnits, makeSetup, newSim, run } from './helpers';
import { stampVision } from '../src/simulation-core/vision';
import { MatchRunner } from '../src/game/runner';
import { F_BRUSH } from '../src/world/map';

describe('fog of war', () => {
  test('enemy base is hidden at start; scouting reveals it and leaves a last-known ghost', () => {
    const sim = newSim(11);
    const hq1 = sim.structuresOf(1)[0];
    expect(sim.isVisibleTo(0, hq1)).toBe(false);
    expect(sim.players[0].ghosts.size).toBe(0);
    const scout = sim.unitsOf(0, 'kestrel')[0];
    sim.issue({ player: 0, kind: 'move', ids: [scout], x: sim.x[hq1] - 5, y: sim.y[hq1] + 6 });
    let seen = false;
    for (let i = 0; i < 20 * 60 && !seen; i++) { sim.step(); seen = sim.isVisibleTo(0, hq1); }
    expect(seen).toBe(true);
    run(sim, 4);
    expect(sim.players[0].ghosts.has(hq1)).toBe(true);
    sim.issue({ player: 0, kind: 'move', ids: [scout], x: sim.players[0].startX, y: sim.players[0].startY - 8 });
    run(sim, 20 * 40);
    expect(sim.isVisibleTo(0, hq1)).toBe(false);
    const g = sim.players[0].ghosts.get(hq1)!;
    expect(g).toBeDefined();
    expect(g.seenTick).toBeLessThan(sim.tick);
  });

  test('commands may not target unseen enemies', () => {
    const sim = newSim(12);
    const hq1 = sim.structuresOf(1)[0];
    const army = sim.unitsOf(0, 'kestrel');
    sim.issue({ player: 0, kind: 'attack', ids: army, target: hq1 });
    run(sim, 4);
    expect(sim.commandLog.filter((c) => c.kind === 'attack')).toHaveLength(0);
  });

  test('low ground cannot see onto high ground; high ground sees down; hover sees both', () => {
    const sim = newSim(13);
    const n = sim.map.size;
    let lowX = -1, lowY = -1, hiX = -1, hiY = -1;
    outer: for (let y = 90; y < 140; y++) for (let x = 3; x < 50; x++) {
      if (sim.map.level[y * n + x] !== 1 || !sim.nav.passable(x, y)) continue;
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
        const j = (y + dy) * n + x + dx;
        if (sim.map.level[j] === 2 && sim.nav.passable(x + dx, y + dy)) { lowX = x; lowY = y; hiX = x + dx; hiY = y + dy; break outer; }
      }
    }
    expect(lowX).toBeGreaterThan(0);
    const vis = new Uint8Array(n * n), exp = new Uint8Array(n * n);
    stampVision(sim, vis, exp, lowX + 0.5, lowY + 0.5, 8, false);
    expect(vis[hiY * n + hiX]).toBe(0);
    vis.fill(0);
    stampVision(sim, vis, exp, hiX + 0.5, hiY + 0.5, 8, false);
    expect(vis[lowY * n + lowX]).toBe(1);
    vis.fill(0);
    stampVision(sim, vis, exp, lowX + 0.5, lowY + 0.5, 8, true);
    expect(vis[hiY * n + hiX]).toBe(1);
  });

  test('brush hides units inside it from outside observers', () => {
    const sim = newSim(14);
    clearUnits(sim);
    const n = sim.map.size;
    const b = sim.map.brushPatches.find((p) => sim.map.flags[Math.floor(p.y) * n + Math.floor(p.x)] & F_BRUSH)!;
    const cx = Math.floor(b.x), cy = Math.floor(b.y);
    expect(sim.map.flags[cy * n + cx] & F_BRUSH).toBeTruthy();
    const hidden = sim.spawnUnit('thornling', 1, cx + 0.5, cy + 0.5);
    sim.ext[hidden].orders = [{ t: 'hold' }];
    // observer outside the patch but within sight range
    let ox = -1;
    for (let d = 5; d < 9 && ox < 0; d++) if (!(sim.map.flags[cy * n + cx + d] & F_BRUSH) && sim.nav.passable(cx + d, cy)) ox = cx + d;
    expect(ox).toBeGreaterThan(0);
    const watcher = sim.spawnUnit('bulwark', 0, ox + 0.5, cy + 0.5);
    sim.ext[watcher].orders = [{ t: 'hold' }];
    run(sim, 4);
    expect(sim.isVisibleTo(0, hidden)).toBe(false);
    sim.x[watcher] = cx + 1.5; sim.y[watcher] = cy + 0.5;
    run(sim, 4);
    expect(sim.isVisibleTo(0, hidden)).toBe(true);
  });

  test('AI memory only ever records entities that were visible to the AI at that tick', () => {
    const r = new MatchRunner(makeSetup(21, 'helix', 'verdant', ['normal', 'hard']));
    const sim = r.sim;
    let violations = 0, records = 0;
    for (let i = 0; i < 20 * 60 * 5; i++) {
      for (const ai of r.ais) ai.update();
      for (const ai of r.ais) for (const m of ai.memory.values()) if (m.seenTick === sim.tick) { records++; if (!sim.isVisibleTo(ai.player, m.id)) violations++; }
      sim.step();
    }
    expect(records).toBeGreaterThan(0);
    expect(violations).toBe(0);
  });
});
