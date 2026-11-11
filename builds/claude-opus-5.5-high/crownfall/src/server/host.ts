// Authoritative room host. Runs the 30 Hz simulation and streams team-filtered snapshots.
// Runs inside a Web Worker in the browser (so the client never touches truth) and directly in tests.
import { Match } from '../sim/match';
import { buildSnapshot } from '../sim/snapshot';
import { TICK_RATE, SNAPSHOT_EVERY } from '../shared/rules';
import { PROTOCOL_VERSION } from '../protocol/messages';
import type { ClientMsg, ServerMsg } from '../protocol/messages';

export type Post = (msg: ServerMsg, transfer?: Transferable[]) => void;

export class MatchHost {
  match: Match | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private acc = 0;
  private last = 0;
  private lastSnapTick = 0;
  private resultSent = false;
  constructor(private post: Post, private now: () => number = () => performance.now()) {}

  onMessage(msg: ClientMsg) {
    switch (msg.t) {
      case 'start': {
        if (msg.version !== PROTOCOL_VERSION) { this.post({ t: 'error', message: `Version mismatch: client ${msg.version}, server ${PROTOCOL_VERSION}` }); return; }
        try {
          this.match = new Match(msg.setup);
        } catch (e) {
          this.post({ t: 'error', message: `Failed to start match: ${(e as Error).message}` });
          return;
        }
        if (msg.setup.warmup) { const n = Math.floor(msg.setup.warmup * TICK_RATE); for (let i = 0; i < n && !this.match.over; i++) this.match.step(); this.lastSnapTick = this.match.tick; }
        this.post({ t: 'ready', version: PROTOCOL_VERSION });
        this.last = this.now();
        this.acc = 0;
        this.timer = setInterval(() => this.pump(), 1000 / TICK_RATE);
        this.sendSnapshot();
        break;
      }
      case 'cmd':
        if (this.match) this.match.command(this.match.setup.humanSlot, msg.cmd);
        break;
      case 'leave':
        this.stop();
        break;
    }
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  /** Advance real time; fixed-step simulation with catch-up clamp. */
  pump() {
    const m = this.match;
    if (!m) return;
    const t = this.now();
    let dt = Math.min(0.25, (t - this.last) / 1000);
    this.last = t;
    if (m.paused) dt = 0;
    this.acc += dt * m.timeScale;
    const step = 1 / TICK_RATE;
    let steps = 0;
    while (this.acc >= step && steps < 16) {
      m.step();
      this.acc -= step;
      steps++;
      if (m.over) break;
    }
    if (m.tick - this.lastSnapTick >= SNAPSHOT_EVERY || m.paused || m.over) this.sendSnapshot();
    if (m.over && !this.resultSent) {
      this.resultSent = true;
      this.post({ t: 'result', result: m.result() });
      this.stop();
    }
  }

  sendSnapshot() {
    const m = this.match!;
    const team = m.humanTeam;
    const snap = buildSnapshot(m, team, m.setup.humanSlot, this.lastSnapTick + 1);
    this.lastSnapTick = m.tick;
    this.post(snap, [snap.fog.buffer]);
  }
}
