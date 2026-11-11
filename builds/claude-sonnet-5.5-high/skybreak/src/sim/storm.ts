/**
 * Calmfield / Riftstorm schedule. The full schedule is derived from the match seed and the
 * world's authored valid-zone centers; clients only ever see the current and next circle.
 */
import { STORM_PHASE1_START_RADIUS, STORM_PHASES, STORM_START_RADIUS, STORM_SWEEP_SECONDS } from '../shared/content';
import { Rng } from '../shared/rng';
import type { World } from './world';
import type { StormState } from './types';

export interface StormStage {
  label: string;
  phase: number;
  start: number; // seconds since live start
  waitLen: number;
  shrinkLen: number;
  damageWait: number;
  damageShrink: number;
  from: { x: number; z: number; r: number };
  to: { x: number; z: number; r: number };
}

export class StormSchedule {
  readonly stages: StormStage[] = [];
  readonly total: number;

  constructor(world: World, seed: number, enabled = true) {
    if (!enabled) { this.total = Infinity; return; }
    const rng = new Rng(seed * 31 + 7);
    let cur = { x: 0, z: 0, r: STORM_START_RADIUS };
    let t = 0;
    const centers = world.zoneCenters;

    const pickCenter = (prev: { x: number; z: number; r: number }, newR: number, margin: number): { x: number; z: number } => {
      const maxShift = Math.max(0, (prev.r - newR) * margin);
      const cands = centers.filter((c) => Math.hypot(c.x - prev.x, c.z - prev.z) <= maxShift);
      if (cands.length === 0) {
        // fall back: nearest valid center, clamped inside the allowed shift
        let best = { x: prev.x, z: prev.z };
        let bd = Infinity;
        for (const c of centers) {
          const d = Math.hypot(c.x - prev.x, c.z - prev.z);
          if (d < bd) { bd = d; best = { x: c.x, z: c.z }; }
        }
        if (bd > maxShift && bd > 0) {
          const k = maxShift / bd;
          return { x: prev.x + (best.x - prev.x) * k, z: prev.z + (best.z - prev.z) * k };
        }
        return best;
      }
      // weight by cover so final circles retain cover
      const w = cands.map((c) => 1 + c.cover * 0.6);
      const c = cands[rng.weighted(w)];
      return { x: c.x, z: c.z };
    };

    // Phase 0: whole island, 90 s (no damage)
    const p0 = STORM_PHASES[0];
    const c1 = pickCenter(cur, STORM_PHASE1_START_RADIUS, 0.9);
    this.stages.push({ label: 'Calmfield holds', phase: 0, start: t, waitLen: p0.wait, shrinkLen: 0, damageWait: 0, damageShrink: 0, from: cur, to: cur });
    t += p0.wait;
    // Opening sweep of the Riftstorm onto the first field
    const sweepTo = { x: c1.x, z: c1.z, r: STORM_PHASE1_START_RADIUS };
    this.stages.push({ label: 'Riftstorm sweeping in', phase: 1, start: t, waitLen: 0, shrinkLen: STORM_SWEEP_SECONDS, damageWait: 0, damageShrink: STORM_PHASES[1].damage, from: cur, to: sweepTo });
    t += STORM_SWEEP_SECONDS;
    cur = sweepTo;
    let prevDamage = STORM_PHASES[1].damage;
    for (let i = 1; i < STORM_PHASES.length; i++) {
      const ph = STORM_PHASES[i];
      const endgame = i >= 6;
      const to = endgame ? pickEndgameCenter(world, rng, cur, i === STORM_PHASES.length - 1 ? 8 : 20) : pickCenter(cur, ph.toRadius, 0.92);
      const target = { x: to.x, z: to.z, r: ph.toRadius };
      this.stages.push({
        label: i >= 6 ? (i === STORM_PHASES.length - 1 ? 'Final collapse' : 'Calmfield drifting') : `Calmfield contracting ${i}`,
        phase: i + 1, start: t, waitLen: ph.wait, shrinkLen: ph.shrink, damageWait: prevDamage, damageShrink: ph.damage, from: cur, to: target,
      });
      t += ph.wait + ph.shrink;
      cur = target;
      prevDamage = ph.damage;
    }
    this.total = t;
  }

  /** Evaluate the storm at time t (seconds since live start). */
  at(t: number, out: StormState): StormState {
    if (this.stages.length === 0) {
      out.phase = -1; out.r = 99999; out.damage = 0; out.stage = 'done'; out.label = 'No storm'; out.cx = 0; out.cz = 0; out.t = 0; out.waitLen = 0; out.shrinkLen = 0;
      out.toR = 99999; out.nextR = 99999;
      return out;
    }
    let idx = this.stages.length - 1;
    for (let i = 0; i < this.stages.length; i++) {
      const s = this.stages[i];
      if (t < s.start + s.waitLen + s.shrinkLen) { idx = i; break; }
    }
    const s = this.stages[idx];
    const local = t - s.start;
    out.phase = s.phase;
    out.label = s.label;
    out.fromX = s.from.x; out.fromZ = s.from.z; out.fromR = s.from.r;
    out.toX = s.to.x; out.toZ = s.to.z; out.toR = s.to.r;
    out.waitLen = s.waitLen; out.shrinkLen = s.shrinkLen;
    const nextStage = this.stages[Math.min(idx + 1, this.stages.length - 1)];
    if (local < s.waitLen) {
      out.stage = 'wait'; out.t = local;
      out.cx = s.from.x; out.cz = s.from.z; out.r = s.from.r;
      out.damage = s.damageWait;
      // preview the field that will be closing next
      if (s.shrinkLen > 0) { out.nextX = s.to.x; out.nextZ = s.to.z; out.nextR = s.to.r; }
      else { out.nextX = nextStage.to.x; out.nextZ = nextStage.to.z; out.nextR = nextStage.to.r; }
    } else if (local < s.waitLen + s.shrinkLen) {
      const k = (local - s.waitLen) / s.shrinkLen;
      out.stage = 'shrink'; out.t = local - s.waitLen;
      out.cx = s.from.x + (s.to.x - s.from.x) * k;
      out.cz = s.from.z + (s.to.z - s.from.z) * k;
      out.r = s.from.r + (s.to.r - s.from.r) * k;
      out.damage = s.damageShrink;
      out.nextX = s.to.x; out.nextZ = s.to.z; out.nextR = s.to.r;
    } else {
      out.stage = 'done'; out.t = local;
      out.cx = s.to.x; out.cz = s.to.z; out.r = s.to.r;
      out.damage = s.damageShrink;
      out.nextX = s.to.x; out.nextZ = s.to.z; out.nextR = s.to.r;
    }
    return out;
  }
}

function pickEndgameCenter(world: World, rng: Rng, prev: { x: number; z: number }, maxShift: number): { x: number; z: number } {
  for (let i = 0; i < 40; i++) {
    const a = rng.range(0, Math.PI * 2), d = rng.range(maxShift * 0.3, maxShift);
    const x = prev.x + Math.cos(a) * d, z = prev.z + Math.sin(a) * d;
    if (world.isLand(x, z) && world.slopeAt(x, z) < 0.6) return { x, z };
  }
  return { x: prev.x, z: prev.z };
}

export function newStormState(): StormState {
  return {
    phase: 0, cx: 0, cz: 0, r: STORM_START_RADIUS, fromX: 0, fromZ: 0, fromR: STORM_START_RADIUS, toX: 0, toZ: 0, toR: STORM_START_RADIUS,
    nextX: 0, nextZ: 0, nextR: STORM_START_RADIUS, t: 0, stage: 'wait', waitLen: 90, shrinkLen: 0, damage: 0, label: 'Calmfield holds',
  };
}
