import { describe, expect, it } from 'vitest';
import { STORM_PHASES } from '../src/shared/content';
import { StormSchedule, newStormState } from '../src/sim/storm';
import { World } from '../src/sim/world';
import { Match } from '../src/sim/match';

describe('Calmfield / Riftstorm schedule', () => {
  const world = new World(2024);
  const sched = new StormSchedule(world, 2024);

  it('is deterministic per seed and differs across seeds', () => {
    const again = new StormSchedule(world, 2024);
    expect(again.stages.map((s) => [s.to.x, s.to.z, s.to.r])).toEqual(sched.stages.map((s) => [s.to.x, s.to.z, s.to.r]));
    const other = new StormSchedule(new World(5), 5);
    expect(other.stages.map((s) => s.to.x)).not.toEqual(sched.stages.map((s) => s.to.x));
  });

  it('follows the brief radii, waits and damage per phase', () => {
    const named = sched.stages.filter((s) => s.phase >= 2 && s.phase <= 6);
    expect(named.map((s) => s.to.r)).toEqual([320, 210, 125, 70, 35]);
    expect(named.map((s) => s.waitLen)).toEqual([0, 70, 55, 40, 30]);
    expect(named.map((s) => s.shrinkLen)).toEqual([120, 90, 75, 60, 45]);
    expect(named.map((s) => s.damageShrink)).toEqual([1, 2, 4, 7, 10]);
    expect(sched.stages[0].waitLen).toBe(STORM_PHASES[0].wait);
  });

  it('keeps every contraction inside the previous circle until the moving endgame', () => {
    const pre = sched.stages.filter((s) => s.phase >= 1 && s.phase <= 6);
    for (const s of pre) {
      const d = Math.hypot(s.to.x - s.from.x, s.to.z - s.from.z);
      expect(d + s.to.r, `phase ${s.phase}`).toBeLessThanOrEqual(s.from.r + 0.5);
    }
  });

  it('chooses only authored valid centers for the closing fields and ends on land', () => {
    const valid = new Set(world.zoneCenters.map((c) => `${c.x},${c.z}`));
    const pre = sched.stages.filter((s) => s.phase >= 2 && s.phase <= 6);
    let fromList = 0;
    for (const s of pre) if (valid.has(`${s.to.x},${s.to.z}`)) fromList++;
    expect(fromList).toBeGreaterThanOrEqual(pre.length - 1);
    const last = sched.stages[sched.stages.length - 1];
    expect(world.isLand(last.to.x, last.to.z)).toBe(true);
    expect(world.inHazard(last.to.x, last.to.z)).toBe(0);
  });

  it('shrinks monotonically and exposes the next field before the wait ends', () => {
    const st = newStormState();
    let prevR = Infinity;
    for (let t = 0; t < sched.total; t += 1) {
      sched.at(t, st);
      expect(st.r).toBeLessThanOrEqual(prevR + 0.5 + (st.phase >= 7 ? 30 : 0));
      prevR = st.r;
    }
    sched.at(95, st); // during the opening sweep
    expect(st.phase).toBe(1);
    const stage2 = sched.stages.find((s) => s.phase === 3)!;
    sched.at(stage2.start + 10, st); // waiting before the 320 -> 210 contraction
    expect(st.stage).toBe('wait');
    expect(st.nextR).toBe(210);
    expect(st.damage).toBe(1); // previous phase damage applies during the wait
    sched.at(stage2.start + stage2.waitLen + 10, st);
    expect(st.stage).toBe('shrink');
    expect(st.damage).toBe(2);
  });

  it('applies server-side storm damage outside the field and none inside', () => {
    const m = new Match({ seed: 31, mode: 'quick', noHuman: true, skipStaging: true });
    // jump to the first contraction
    for (let i = 0; i < 30 * 130; i++) m.step();
    const alive = m.players.filter((p) => p.alive);
    expect(m.storm.phase).toBeGreaterThanOrEqual(1);
    const inside = alive.find((p) => Math.hypot(p.x - m.storm.cx, p.z - m.storm.cz) < m.storm.r - 20 && p.mode === 'ground');
    expect(inside).toBeDefined();
    const outsider = alive.find((p) => p.mode === 'ground')!;
    outsider.x = m.storm.cx + m.storm.r + 40; outsider.z = m.storm.cz; outsider.y = m.world.heightAt(outsider.x, outsider.z) + 1;
    const before = outsider.stats.stormDamage;
    for (let i = 0; i < 30 * 3; i++) m.step();
    expect(outsider.stats.stormDamage - before).toBeGreaterThan(m.storm.damage * 2.5 - 0.1);
  });
});
