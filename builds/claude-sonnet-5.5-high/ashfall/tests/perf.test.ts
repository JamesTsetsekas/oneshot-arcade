import { writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { botFight, makeGame } from './helpers';

describe('simulation performance budget', () => {
  it('45 normal enemies + 3 elites + boss stay well inside the CPU frame budget (30 Hz sim)', () => {
    const g = makeGame('cinder', 4242, 10);
    g.enterZone('march');
    const px = g.zone.playerStart.x + 4;
    const pz = g.zone.playerStart.z - 22;
    g.player.x = px;
    g.player.z = pz;
    const types = ['crawler', 'husk', 'archer', 'scribe', 'mite', 'pilgrim', 'warden', 'swarm', 'hound', 'adept'];
    let n = 0;
    for (let i = 0; i < 45; i++) {
      const a = (i / 45) * Math.PI * 2;
      const r = 6 + (i % 5) * 1.6;
      const e = g.spawnEnemy(types[i % types.length], px + Math.cos(a) * r, pz + Math.sin(a) * r, 8, { pack: `bench${i % 6}`, aggro: true });
      if (e) n++;
    }
    for (let i = 0; i < 3; i++) g.spawnEnemy('husk', px + i * 2 - 2, pz - 9, 9, { pack: 'benchE', aggro: true, elite: ['ember_wake', 'frost_pulse'].slice(0, 1 + (i % 2)) });
    expect(n).toBeGreaterThanOrEqual(40);
    const times: number[] = [];
    const heap0 = process.memoryUsage().heapUsed;
    let maxAgents = 0;
    for (let i = 0; i < 30 * 30; i++) {
      g.player.hp = g.player.maxHp; // keep the scene busy
      botFight(g, i / 30);
      const t0 = performance.now();
      g.step(1 / 30);
      times.push(performance.now() - t0);
      g.events.length = 0;
      maxAgents = Math.max(maxAgents, g.enemies.filter((e) => e.alive).length);
    }
    times.sort((a, b) => a - b);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const p99 = times[Math.floor(times.length * 0.99)];
    const heapMB = (process.memoryUsage().heapUsed - heap0) / 1e6;
    writeFileSync('.tmp-perf.json', JSON.stringify({ avgMs: +avg.toFixed(3), p99Ms: +p99.toFixed(3), maxMs: +times[times.length - 1].toFixed(3), maxAgents, heapGrowthMB: +heapMB.toFixed(1) }));
    expect(maxAgents).toBeGreaterThanOrEqual(40);
    // the simulation tick must fit comfortably inside the 8 ms CPU frame budget
    expect(avg).toBeLessThan(5);
    expect(p99).toBeLessThan(40); // generous: CI machines share cores with parallel test files
  }, 60000);
});
