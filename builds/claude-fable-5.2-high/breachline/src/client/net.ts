// client-runtime: transport. Practice talks to the embedded room in a Web Worker; a hosted build would swap in a
// WebSocket connection with the same interface. LatencySim adds delay / jitter / loss-as-retransmit for the latency lab.
import type { ClientMsg, ServerMsg } from '../protocol/messages';

export interface Connection {
  send(msg: ClientMsg, transfer?: ArrayBuffer[]): void;
  onMessage: (msg: ServerMsg) => void;
  onError: (detail: string) => void;
  close(): void;
}

export class WorkerConnection implements Connection {
  onMessage: (msg: ServerMsg) => void = () => {};
  onError: (detail: string) => void = () => {};
  private worker: Worker;
  constructor() {
    this.worker = new Worker(new URL('../server/worker.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = (e: MessageEvent<ServerMsg>) => this.onMessage(e.data);
    this.worker.onerror = (e) => this.onError(e.message || 'The local match server stopped unexpectedly');
  }
  send(msg: ClientMsg, transfer?: ArrayBuffer[]): void { this.worker.postMessage(msg, transfer ?? []); }
  close(): void {
    try { this.worker.postMessage({ m: 'leave' } satisfies ClientMsg); } catch { /* already gone */ }
    setTimeout(() => this.worker.terminate(), 50);
  }
}

export interface LatencyProfile { rtt: number; jitter: number; loss: number }
export const LATENCY_PRESETS: Record<string, LatencyProfile> = {
  off: { rtt: 0, jitter: 0, loss: 0 },
  good: { rtt: 40, jitter: 5, loss: 0 },
  typical: { rtt: 80, jitter: 10, loss: 0 },
  rough: { rtt: 150, jitter: 30, loss: 0.02 },
};

/** Ordered, reliable link with simulated latency. Loss is modelled as a retransmission delay (as on TCP/WebSocket). */
export class LatencySim implements Connection {
  onMessage: (msg: ServerMsg) => void = () => {};
  onError: (detail: string) => void = () => {};
  private up: { at: number; msg: ClientMsg; transfer?: ArrayBuffer[] }[] = [];
  private down: { at: number; msg: ServerMsg }[] = [];
  private lastUp = 0;
  private lastDown = 0;
  private timer: ReturnType<typeof setInterval>;
  constructor(private inner: Connection, public profile: LatencyProfile, private rand: () => number = Math.random, private now: () => number = () => performance.now()) {
    inner.onMessage = (m) => {
      if (this.profile.rtt <= 0 && this.profile.jitter <= 0) { this.onMessage(m); return; }
      const at = Math.max(this.lastDown, this.now() + this.delay());
      this.lastDown = at;
      this.down.push({ at, msg: m });
    };
    inner.onError = (d) => this.onError(d);
    this.timer = setInterval(() => this.pump(), 2);
  }
  private delay(): number {
    const p = this.profile;
    let d = p.rtt / 2 + (this.rand() * 2 - 1) * p.jitter;
    if (p.loss > 0 && this.rand() < p.loss) d += p.rtt + 60; // lost packet -> retransmit
    return Math.max(0, d);
  }
  send(msg: ClientMsg, transfer?: ArrayBuffer[]): void {
    if (this.profile.rtt <= 0 && this.profile.jitter <= 0) { this.inner.send(msg, transfer); return; }
    const at = Math.max(this.lastUp, this.now() + this.delay());
    this.lastUp = at;
    this.up.push({ at, msg, transfer });
  }
  /** Deliver everything that is due (also called from the frame loop for tighter timing). */
  pump(): void {
    const now = this.now();
    while (this.up.length && this.up[0].at <= now) { const u = this.up.shift()!; this.inner.send(u.msg, u.transfer); }
    while (this.down.length && this.down[0].at <= now) this.onMessage(this.down.shift()!.msg);
  }
  close(): void { clearInterval(this.timer); this.inner.close(); }
}
