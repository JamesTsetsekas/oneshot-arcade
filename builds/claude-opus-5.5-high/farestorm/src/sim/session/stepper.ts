// Fixed 60 Hz stepper with capped catch-up and render interpolation alpha.

import { DT } from "../vehicle/vehicle";

export class FixedStepper {
  acc = 0;
  maxSteps = 5;
  alpha = 0;
  /** Advance by a real frame delta; calls `step` 0..maxSteps times. Returns steps taken. */
  advance(frameDt: number, step: () => void): number {
    this.acc += Math.min(frameDt, 0.25);
    let n = 0;
    while (this.acc >= DT && n < this.maxSteps) {
      step();
      this.acc -= DT;
      n++;
    }
    if (n === this.maxSteps && this.acc > DT) this.acc = 0; // drop backlog to keep input stable
    this.alpha = this.acc / DT;
    return n;
  }
}
