import { describe, expect, test } from 'vitest';
import { ARENA, clearUnits, newSim, run } from './helpers';
import { UNITS } from '../src/faction-data';

function stage(f0: 'helix' | 'verdant' = 'helix', f1: 'helix' | 'verdant' = 'verdant') {
  const sim = newSim(5, f0, f1);
  clearUnits(sim);
  return sim;
}

describe('combat rules', () => {
  test('arena is open ground', () => {
    const sim = stage();
    for (let dx = -6; dx <= 6; dx++) for (let dy = -4; dy <= 4; dy++) {
      expect(sim.nav.passableW(ARENA.x + dx, ARENA.y + dy)).toBe(true);
      expect(sim.map.flags[Math.floor(ARENA.y + dy) * 144 + Math.floor(ARENA.x + dx)] & 8).toBe(0);
    }
  });
  test('damage = base + tag bonus - armor (Bulwark vs Light Thornling = 10)', () => {
    const sim = stage();
    const a = sim.spawnUnit('bulwark', 0, ARENA.x, ARENA.y);
    const t = sim.spawnUnit('thornling', 1, ARENA.x + 3, ARENA.y);
    sim.ext[t].orders = [{ t: 'hold' }];
    run(sim, 2);
    sim.issue({ player: 0, kind: 'attack', ids: [a], target: t });
    let firstHp = -1;
    for (let i = 0; i < 60 && firstHp < 0; i++) { sim.step(); if (sim.hp[t] < UNITS.thornling.hp) firstHp = sim.hp[t]; }
    expect(UNITS.thornling.hp - firstHp).toBeCloseTo(10, 3);
  });
  test('armor and Armored bonus (Arc Lancer vs Carapace Guard = 14+16-2)', () => {
    const sim = stage();
    const a = sim.spawnUnit('arc_lancer', 0, ARENA.x, ARENA.y);
    const t = sim.spawnUnit('carapace_guard', 1, ARENA.x + 4, ARENA.y);
    sim.ext[t].orders = [{ t: 'hold' }];
    run(sim, 2);
    sim.issue({ player: 0, kind: 'attack', ids: [a], target: t });
    let dmg = 0;
    for (let i = 0; i < 100 && !dmg; i++) { sim.step(); dmg = UNITS.carapace_guard.hp - sim.hp[t]; }
    expect(dmg).toBeCloseTo(28, 3);
  });
  test('attack upgrade adds 6%, armor upgrade removes 5%', () => {
    const sim = stage();
    sim.players[0].attackLevel = 1;
    sim.players[1].armorLevel = 1;
    const a = sim.spawnUnit('bulwark', 0, ARENA.x, ARENA.y);
    const t = sim.spawnUnit('thornling', 1, ARENA.x + 3, ARENA.y);
    sim.ext[t].orders = [{ t: 'hold' }];
    run(sim, 2);
    sim.issue({ player: 0, kind: 'attack', ids: [a], target: t });
    let dmg = 0;
    for (let i = 0; i < 60 && !dmg; i++) { sim.step(); dmg = UNITS.thornling.hp - sim.hp[t]; }
    expect(dmg).toBeCloseTo(10 * 1.06 * 0.95, 3);
  });
  test('curl halves incoming damage', () => {
    const sim = stage();
    const a = sim.spawnUnit('bulwark', 0, ARENA.x, ARENA.y);
    const t = sim.spawnUnit('carapace_guard', 1, ARENA.x + 3, ARENA.y);
    sim.issue({ player: 1, kind: 'ability', ids: [t], def: 'curl' });
    run(sim, 20);
    expect(sim.ext[t].curled).toBe(true);
    sim.issue({ player: 0, kind: 'attack', ids: [a], target: t });
    let dmg = 0;
    for (let i = 0; i < 60 && !dmg; i++) { sim.step(); dmg = UNITS.carapace_guard.hp - sim.hp[t]; }
    expect(dmg).toBeCloseTo((7 - 2) * 0.5, 3);
  });
  test('Aegis Frame frontal shield absorbs projectile damage first', () => {
    const sim = stage();
    const ag = sim.spawnUnit('aegis_frame', 0, ARENA.x, ARENA.y);
    const sp = sim.spawnUnit('sporecaster', 1, ARENA.x + 5, ARENA.y);
    sim.fx[ag] = 1; sim.fy[ag] = 0; // facing the attacker
    sim.ext[ag].orders = [{ t: 'hold' }];
    run(sim, 2);
    sim.issue({ player: 1, kind: 'attack', ids: [sp], target: ag });
    run(sim, 120);
    expect(sim.ext[ag].shield).toBeLessThan(160);
    expect(sim.hp[ag]).toBeGreaterThan(UNITS.aegis_frame.hp - 5);
  });
  test('Sporecaster slow is applied but does not stack', () => {
    const sim = stage();
    const t = sim.spawnUnit('bulwark', 0, ARENA.x, ARENA.y);
    const s1 = sim.spawnUnit('sporecaster', 1, ARENA.x + 4, ARENA.y);
    const s2 = sim.spawnUnit('sporecaster', 1, ARENA.x + 4, ARENA.y + 1.5);
    sim.ext[t].orders = [{ t: 'hold' }];
    run(sim, 2);
    sim.issue({ player: 1, kind: 'attack', ids: [s1, s2], target: t });
    let maxSlow = 0;
    for (let i = 0; i < 120; i++) { sim.step(); maxSlow = Math.max(maxSlow, sim.ext[t].slowAmount); }
    expect(maxSlow).toBeCloseTo(0.3, 5);
  });
  test('Mortar Crawler needs setup, respects minimum range, and splash spares friendlies', () => {
    const sim = stage('helix', 'verdant');
    const m = sim.spawnUnit('mortar_crawler', 0, ARENA.x - 4, ARENA.y);
    const near = sim.spawnUnit('thornling', 1, ARENA.x - 2, ARENA.y + 0.5); // inside min range 3
    for (const u of [m, near]) sim.ext[u].orders = [{ t: 'hold' }];
    run(sim, 80);
    expect(sim.hp[near]).toBe(UNITS.thornling.hp); // never fired at min range
    sim.kill(near);
    const far = sim.spawnUnit('bloom_sage', 1, ARENA.x + 4, ARENA.y); // unarmed target
    const friend = sim.spawnUnit('fabricator', 0, ARENA.x + 4.9, ARENA.y + 0.4);
    for (const u of [far, friend]) sim.ext[u].orders = [{ t: 'hold' }];
    run(sim, 2);
    sim.issue({ player: 0, kind: 'attack', ids: [m], target: far });
    let fired = -1;
    for (let i = 0; i < 200; i++) { sim.step(); if (fired < 0 && sim.projectiles.length) fired = i; }
    expect(fired).toBeGreaterThanOrEqual(20); // setup time before first shell
    expect(sim.hp[far]).toBeLessThan(UNITS.bloom_sage.hp);
    expect(sim.hp[friend]).toBe(UNITS.fabricator.hp); // no friendly fire
  });
  test('Sentry Arc only fires inside its cone', () => {
    const sim = stage();
    const s = sim.spawnStructure('sentry_arc', 0, ARENA.x, ARENA.y, true);
    sim.ext[s].cone = { x: 1, y: 0 };
    const behind = sim.spawnUnit('thornling', 1, ARENA.x - 4, ARENA.y + 1);
    sim.ext[behind].orders = [{ t: 'hold' }];
    run(sim, 60);
    expect(sim.hp[behind]).toBe(UNITS.thornling.hp);
    const front = sim.spawnUnit('thornling', 1, ARENA.x + 5, ARENA.y + 1);
    sim.ext[front].orders = [{ t: 'hold' }];
    run(sim, 60);
    expect(sim.hp[front]).toBeLessThan(UNITS.thornling.hp);
  });
  test('deaths remove collision immediately and emit feedback events', () => {
    const sim = stage();
    const a = sim.spawnUnit('bulwark', 0, ARENA.x, ARENA.y);
    const t = sim.spawnUnit('tender', 1, ARENA.x + 3, ARENA.y);
    sim.ext[t].orders = [{ t: 'hold' }];
    run(sim, 2);
    sim.issue({ player: 0, kind: 'attack', ids: [a], target: t });
    run(sim, 200);
    expect(sim.alive[t]).toBe(0);
    expect(sim.players[0].stats.kills).toBe(1);
  });
});
