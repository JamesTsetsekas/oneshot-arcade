// Fixed simulation clock: converts variable render frame time into whole 50 ms ticks.
export const TICK_MS = 50;

export class FixedClock {
  private acc = 0;
  /** Returns how many ticks to run for this frame; never more than maxSteps (prevents a spiral after a stall). */
  advance(dtMs: number, speed = 1, maxSteps = 4): number {
    this.acc += dtMs * speed;
    let steps = Math.floor(this.acc / TICK_MS + 1e-9);
    if (steps > maxSteps) { steps = maxSteps; this.acc = 0; }
    else this.acc -= steps * TICK_MS;
    return steps;
  }
  /** interpolation factor between the previous and the current tick */
  get alpha(): number { return Math.min(1, Math.max(0, this.acc / TICK_MS)); }
  reset(): void { this.acc = 0; }
}
