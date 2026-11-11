// client-runtime: loopback transport. The authoritative Match runs in-process at 30 Hz ("local bot mode");
// the client still only talks to it through inputs, action requests and interest-filtered snapshots.
import { Match } from "../../server/match/match";
import { clamp } from "../../shared/math";
import { DT, type ActionRequest, type InputFrame, type MatchConfig, type MatchEvent, type MatchLink, type MatchResults, type Snapshot, type Welcome } from "../../shared/protocol/protocol";

export class LocalLink implements MatchLink {
  private match: Match;
  readonly welcome: Welcome;
  prev: Snapshot | null = null;
  curr: Snapshot;
  private acc = 0;
  /** Events accumulated across ticks since the client last drained them. */
  events: MatchEvent[] = [];
  tickMs = 0;
  /** Simulation speed multiplier. Always 1 in play; the capture tool raises it to fast-forward a match. */
  timeScale = 1;

  constructor(cfg: MatchConfig) {
    this.match = new Match(cfg);
    this.welcome = this.match.welcome();
    this.curr = this.match.snapshotFor(this.welcome.youId);
    this.match.flushEvents();
  }

  sendInput(frame: InputFrame): void {
    this.match.setInput(this.welcome.youId, frame);
  }
  sendAction(req: ActionRequest): void {
    this.match.action(this.welcome.youId, req);
  }

  /** Advances the fixed-step simulation; returns how many ticks ran. */
  update(dt: number, makeInput: () => InputFrame): number {
    this.acc += Math.min(dt, 0.25) * this.timeScale;
    const maxTicks = this.timeScale > 1 ? 24 : 4;
    let n = 0;
    while (this.acc >= DT && n < maxTicks) {
      this.sendInput(makeInput());
      this.match.step();
      this.tickMs = this.tickMs * 0.95 + this.match.lastStepMs * 0.05;
      this.prev = this.curr;
      this.curr = this.match.snapshotFor(this.welcome.youId);
      for (const e of this.curr.events) this.events.push(e);
      this.match.flushEvents();
      this.acc -= DT;
      n++;
    }
    if (n === maxTicks) this.acc = 0;
    return n;
  }

  get alpha(): number {
    return clamp(this.acc / DT, 0, 1);
  }
  /** Match time of the world currently on screen (used for lag compensation). */
  get viewTime(): number {
    return (this.prev ? this.prev.time : this.curr.time) + this.alpha * DT;
  }
  results(): MatchResults {
    return this.match.results();
  }
}
