// Calmfield / Riftstorm. All circles are derived from the match seed at
// creation and revealed progressively (current + next only).

import { Rng } from '../shared/rng';
import { STORM_PHASES, StormPhase } from '../shared/content/rules';
import { IslandData } from '../shared/world/island';
import { CircleView, StormView } from '../shared/protocol/messages';

export interface Circle { x: number; z: number; r: number }

export interface StormPlan {
  circles: Circle[]; // circles[k] = target of phase k; start circle separate
  start: Circle;
  phases: StormPhase[];
  /** Absolute times (seconds from storm start) of each phase's wait end and shrink end. */
  waitEnd: number[];
  shrinkEnd: number[];
  total: number;
}

export function planStorm(seed: number, island: IslandData, timeScale = 1): StormPlan {
  const rng = new Rng(seed ^ 0x5707);
  const start: Circle = { x: 0, z: 0, r: 850 };
  const phases = STORM_PHASES.map((p) => ({ ...p, wait: p.wait * timeScale, shrink: p.shrink * timeScale }));
  const circles: Circle[] = [];
  const centers = island.stormCenters;
  let prev = start;
  for (let k = 0; k < phases.length; k++) {
    const p = phases[k];
    let c: Circle;
    if (k === 0) {
      const cands = centers.filter((s) => Math.hypot(s.x, s.z) < 140);
      const pick = cands.length ? rng.pick(cands) : { x: 0, z: 0 };
      c = { x: pick.x, z: pick.z, r: p.radius };
    } else if (p.moving) {
      // moving endgame: shift ~30-45m to a nearby valid centre
      const cands = centers.filter((s) => {
        const d = Math.hypot(s.x - prev.x, s.z - prev.z);
        return d >= 15 && d <= 50;
      });
      if (cands.length) {
        const pick = rng.pick(cands);
        c = { x: pick.x, z: pick.z, r: p.radius };
      } else {
        const a = rng.next() * Math.PI * 2;
        c = { x: prev.x + Math.cos(a) * 20, z: prev.z + Math.sin(a) * 20, r: p.radius };
      }
    } else if (p.radius <= 0) {
      c = { x: prev.x, z: prev.z, r: 0 };
    } else {
      const maxOff = Math.max(0, prev.r - p.radius) * 0.92;
      const cands = centers.filter((s) => Math.hypot(s.x - prev.x, s.z - prev.z) <= maxOff);
      // prefer higher-cover candidates for late circles
      let pick: { x: number; z: number };
      if (cands.length) {
        if (k >= 3) {
          const sorted = [...cands].sort((a, b) => b.cover - a.cover);
          const top = sorted.slice(0, Math.max(3, Math.floor(sorted.length / 2)));
          pick = rng.pick(top);
        } else pick = rng.pick(cands);
      } else pick = { x: prev.x, z: prev.z };
      c = { x: pick.x, z: pick.z, r: p.radius };
    }
    circles.push(c);
    prev = c;
  }
  const waitEnd: number[] = [], shrinkEnd: number[] = [];
  let t = 0;
  for (const p of phases) {
    t += p.wait;
    waitEnd.push(t);
    t += p.shrink;
    shrinkEnd.push(t);
  }
  return { circles, start, phases, waitEnd, shrinkEnd, total: t };
}

export interface StormNow { phase: number; stage: 'wait' | 'shrink' | 'done'; endsIn: number; cur: Circle; next: Circle | null; damage: number }

export function stormAt(plan: StormPlan, t: number): StormNow {
  const n = plan.phases.length;
  for (let k = 0; k < n; k++) {
    const from = k === 0 ? plan.start : plan.circles[k - 1];
    const to = plan.circles[k];
    const p = plan.phases[k];
    if (t < plan.waitEnd[k]) {
      return { phase: k, stage: 'wait', endsIn: plan.waitEnd[k] - t, cur: from, next: to, damage: k === 0 ? 0 : plan.phases[k - 1].damage };
    }
    if (t < plan.shrinkEnd[k]) {
      const u = p.shrink > 0 ? (t - plan.waitEnd[k]) / p.shrink : 1;
      return {
        phase: k, stage: 'shrink', endsIn: plan.shrinkEnd[k] - t,
        cur: { x: from.x + (to.x - from.x) * u, z: from.z + (to.z - from.z) * u, r: from.r + (to.r - from.r) * u },
        next: to, damage: p.damage,
      };
    }
  }
  const last = plan.circles[n - 1];
  return { phase: n - 1, stage: 'done', endsIn: 0, cur: last, next: null, damage: plan.phases[n - 1].damage + 4 };
}

export function stormView(s: StormNow, phases: number): StormView {
  const c = (x: Circle): CircleView => ({ x: x.x, z: x.z, r: x.r });
  return { phase: s.phase, phases, stage: s.stage, endsIn: s.endsIn, cur: c(s.cur), next: s.next ? c(s.next) : null, damage: s.damage };
}
