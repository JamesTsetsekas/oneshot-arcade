// server-match: Calmfield / Riftstorm. Deterministic from the match seed; centres are planned back-to-front so
// every field nests inside the previous one and the final fields sit on authored valid ground.
import { Rng } from "../../shared/math";
import { PACE_SCALE, STORM_PHASES, type Pace, type StormPhase } from "../../shared/content/rules";
import type { StormView } from "../../shared/protocol/protocol";

export class Storm {
  readonly phases: StormPhase[];
  /** Target centre for the end of each phase (index-aligned with phases). */
  readonly centers: [number, number][] = [];
  phase = 0;
  state: "calm" | "wait" | "shrink" | "done" = "calm";
  timer = 0;
  cx = 0;
  cz = 0;
  r = 430;
  private fromX = 0;
  private fromZ = 0;
  private fromR = 430;
  started = false;
  changed: null | "wait" | "shrink" | "final" = null;

  constructor(rng: Rng, finalCenters: readonly [number, number][], pace: Pace) {
    const k = PACE_SCALE[pace];
    this.phases = STORM_PHASES.map((p) => ({ ...p, wait: p.wait * k, shrink: p.shrink * k }));
    const n = this.phases.length;
    const fallback: [number, number] = [0, 0];
    const c5 = finalCenters.length ? rng.pick(finalCenters) : fallback;
    const centers: [number, number][] = new Array(n);
    centers[5] = [c5[0], c5[1]];
    // Endgame legs hop between nearby valid centres.
    let prev = centers[5]!;
    for (let i = 6; i <= 8; i++) {
      const near = finalCenters.filter((c) => {
        const d = Math.hypot(c[0] - prev[0], c[1] - prev[1]);
        return d > 12 && d < 62;
      });
      const pick = near.length ? rng.pick(near) : prev;
      centers[i] = [pick[0], pick[1]];
      prev = centers[i]!;
    }
    centers[9] = [prev[0], prev[1]];
    // Earlier fields: each must fully contain the next.
    for (let i = 4; i >= 1; i--) {
      const next = centers[i + 1]!;
      const slack = (this.phases[i]!.toR - this.phases[i + 1]!.toR) * 0.92;
      // several seeded candidates; keep the one that keeps the most island inside the field
      let best: [number, number] = [next[0], next[1]];
      let bestScore = 1e9;
      for (let c = 0; c < 4; c++) {
        const a = rng.range(0, Math.PI * 2);
        const d = Math.sqrt(rng.next()) * slack;
        const cand: [number, number] = [next[0] + Math.sin(a) * d, next[1] + Math.cos(a) * d];
        const score = Math.hypot(cand[0], cand[1]) + rng.next() * 60;
        if (score < bestScore) {
          bestScore = score;
          best = cand;
        }
      }
      centers[i] = best;
    }
    // Phase 0 field: pulled toward the island centre so it covers as much land as possible.
    {
      const c1 = centers[1]!;
      const slack = (this.phases[0]!.toR - this.phases[1]!.toR) * 0.95;
      const dist = Math.hypot(c1[0], c1[1]);
      const pull = Math.min(slack, dist);
      const s = dist > 0.001 ? pull / dist : 0;
      centers[0] = [c1[0] - c1[0] * s, c1[1] - c1[1] * s];
    }
    for (let i = 0; i < n; i++) this.centers.push(centers[i]!);
    this.cx = this.centers[0]![0];
    this.cz = this.centers[0]![1];
    this.r = this.phases[0]!.toR;
  }

  start(): void {
    this.started = true;
    this.phase = 0;
    this.state = "calm";
    this.timer = this.phases[0]!.wait;
  }

  get dps(): number {
    if (!this.started || this.state === "calm") return 0;
    return this.phases[Math.min(this.phase, this.phases.length - 1)]!.dps;
  }

  private beginPhase(i: number): void {
    this.phase = i;
    const p = this.phases[i]!;
    this.fromX = this.cx;
    this.fromZ = this.cz;
    this.fromR = this.r;
    if (p.wait > 0) {
      this.state = "wait";
      this.timer = p.wait;
      this.changed = "wait";
    } else {
      this.state = "shrink";
      this.timer = p.shrink;
      this.changed = i >= this.phases.length - 1 ? "final" : "shrink";
    }
  }

  step(dt: number): void {
    this.changed = null;
    if (!this.started || this.state === "done") return;
    this.timer -= dt;
    const p = this.phases[this.phase]!;
    if (this.state === "shrink") {
      const t = p.shrink > 0 ? Math.min(1, 1 - this.timer / p.shrink) : 1;
      const c = this.centers[this.phase]!;
      this.cx = this.fromX + (c[0] - this.fromX) * t;
      this.cz = this.fromZ + (c[1] - this.fromZ) * t;
      this.r = this.fromR + (p.toR - this.fromR) * t;
    }
    if (this.timer > 0) return;
    if (this.state === "calm" || this.state === "shrink") {
      if (this.phase >= this.phases.length - 1) {
        this.state = "done";
        this.r = 0;
        this.timer = 0;
        return;
      }
      this.beginPhase(this.phase + 1);
    } else if (this.state === "wait") {
      this.state = "shrink";
      this.timer = p.shrink;
      this.changed = "shrink";
    }
  }

  outside(x: number, z: number): boolean {
    const dx = x - this.cx,
      dz = z - this.cz;
    return dx * dx + dz * dz > this.r * this.r;
  }

  /** The field players should be rotating toward. */
  nextField(): { x: number; z: number; r: number } {
    if (this.state === "done") return { x: this.cx, z: this.cz, r: 0 };
    const i = this.state === "calm" ? 1 : this.phase;
    const c = this.centers[i]!;
    return { x: c[0], z: c[1], r: this.phases[i]!.toR };
  }

  view(): StormView {
    const n = this.nextField();
    return {
      phase: this.phase, state: this.state, timer: Math.max(0, this.timer),
      cx: this.cx, cz: this.cz, r: this.r, nx: n.x, nz: n.z, nr: n.r, dps: this.dps, totalPhases: this.phases.length,
    };
  }
}
