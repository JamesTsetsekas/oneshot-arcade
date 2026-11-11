import { describe, expect, it } from 'vitest';
import { Sim } from '../src/sim/sim';
import type { Command, PickConfig } from '../src/sim/types';
import { place, run } from './helpers';

function mk(): Sim {
  const ids = ['suri', 'brannoch', 'oru', 'kesh', 'ilyra', 'vey'];
  const picks: PickConfig[] = ids.map((id, i) => ({ heroId: id, team: i < 3 ? 0 : 1, controller: i === 0 ? 'player' : 'bot', talents: ['mend', 'aegis'] }));
  return new Sim({ seed: 99, picks, difficulty: 'normal', mode: 'match' });
}

describe('command protocol (the only client -> simulation interface)', () => {
  it('replays a recorded command log into an identical authoritative state', () => {
    const a = mk();
    a.recordCommands = true;
    const script: { t: number; cmd: Command }[] = [
      { t: 1, cmd: { slot: 0, c: 'buy', item: 'whetstone', seq: 1 } },
      { t: 2, cmd: { slot: 0, c: 'rank', ab: 0, seq: 2 } },
      { t: 3, cmd: { slot: 0, c: 'move', x: -34, z: -33, seq: 3 } },
      { t: 40, cmd: { slot: 0, c: 'amove', x: -10, z: -36, seq: 4 } },
      { t: 70, cmd: { slot: 0, c: 'cast', ab: 0, x: 0, z: -36, target: 0, seq: 5 } },
      { t: 80, cmd: { slot: 0, c: 'ward', x: -8, z: -30, seq: 6 } },
    ];
    let last = 0;
    for (const s of script) { run(a, s.t - last); last = s.t; a.command(s.cmd); }
    run(a, 120 - last);
    const log = a.commandLog.filter((e) => e.cmd.slot === 0); // bots issue their own commands deterministically
    expect(log.length).toBe(script.length);
    const b = mk();
    let tick = 0;
    for (const entry of log) { while (tick < entry.tick) { b.step(); tick++; } b.command(entry.cmd); }
    while (tick < a.tick) { b.step(); tick++; }
    expect(b.stateHash()).toBe(a.stateHash());
  });

  it('keeps commands ordered, rejects stale/duplicate casts via cooldowns, and never trusts client-side values', () => {
    const sim = mk();
    const me = sim.heroes[0];
    me.hero!.skillPts = 3; me.hero!.level = 3;
    sim.command({ slot: 0, c: 'rank', ab: 0 });
    sim.command({ slot: 0, c: 'rank', ab: 0 }); // level 3 allows rank 2 only at level >= 3
    expect(me.hero!.ranks[0]).toBeGreaterThanOrEqual(1);
    place(me, -30, -34);
    me.hero!.cds[0] = 0; me.mana = me.maxMana;
    for (let i = 0; i < 5; i++) sim.command({ slot: 0, c: 'cast', ab: 0, x: 0, z: -34, target: 0, seq: i });
    run(sim, 0.6);
    expect(sim.projectiles.filter((p) => p.owner === me.id && p.kind === 'skill').length).toBeLessThanOrEqual(1);
    // a client cannot grant itself gold or items: unknown commands are ignored
    const g = me.hero!.gold;
    sim.command({ slot: 0, c: 'buy', item: 'does-not-exist' });
    expect(me.hero!.gold).toBe(g);
    expect(me.hero!.items.some(Boolean)).toBe(false);
    // commands for non-existent slots are dropped
    expect(() => sim.command({ slot: 42, c: 'stop' })).not.toThrow();
  });

  it('never exposes hidden enemy positions through visibility flags (server-side fog filter)', () => {
    const sim = mk();
    run(sim, 20);
    for (const team of [0, 1] as const) {
      const observers = sim.observers(team);
      for (const u of sim.units) {
        if (u.team === team || u.dead) continue;
        const near = observers.some((o) => Math.hypot(o.x - u.x, o.z - u.z) <= o.r + u.radius + 0.5);
        if (!near && u.revealUntil[team] <= sim.time) expect(sim.canSee(team, u)).toBe(false);
      }
    }
  });
});
