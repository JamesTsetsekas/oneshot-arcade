// In-process transport between a client session and a room, with an optional network-condition lab
// (latency, jitter, loss) so prediction and reconciliation can be exercised without a real socket.
// A WebSocket transport would implement the same two queues.
import type { ClientMessage, ServerFrame } from '../protocol/types';
import { Rng } from '../shared/math';

export interface NetConditions {
  /** one-way latency in ms */
  latency: number;
  jitter: number;
  /** probability 0..1 of dropping an unreliable message (inputs, frames without events) */
  loss: number;
}

interface Queued<T> {
  at: number;
  msg: T;
}

export class LoopbackTransport {
  private up: Queued<ClientMessage>[] = [];
  private down: Queued<ServerFrame>[] = [];
  private rng = new Rng(0xfeed);
  now = 0;
  stats = { sentUp: 0, sentDown: 0, lostUp: 0, lostDown: 0, bytesDown: 0 };

  constructor(
    public cond: NetConditions = { latency: 0, jitter: 0, loss: 0 },
    private measureBytes = false,
  ) {}

  private delay(): number {
    return this.cond.latency + (this.cond.jitter > 0 ? this.rng.range(0, this.cond.jitter) : 0);
  }

  /** client -> server */
  sendUp(msg: ClientMessage): void {
    this.stats.sentUp++;
    // reliable commands are never dropped (a real transport would retransmit them)
    if (msg.t === 'input' && this.cond.loss > 0 && this.rng.chance(this.cond.loss)) {
      this.stats.lostUp++;
      return;
    }
    this.up.push({ at: this.now + this.delay(), msg });
  }

  /** server -> client */
  sendDown(frame: ServerFrame): void {
    this.stats.sentDown++;
    if (this.measureBytes) this.stats.bytesDown += JSON.stringify(frame).length;
    if (this.cond.loss > 0 && frame.events.length === 0 && this.rng.chance(this.cond.loss)) {
      this.stats.lostDown++;
      return;
    }
    this.down.push({ at: this.now + this.delay(), msg: frame });
  }

  pumpUp(deliver: (msg: ClientMessage) => void): void {
    this.up.sort((a, b) => a.at - b.at);
    while (this.up.length && this.up[0].at <= this.now) deliver(this.up.shift()!.msg);
  }

  pumpDown(deliver: (frame: ServerFrame) => void): void {
    // frames keep send order even under jitter (TCP-like ordering on a WebSocket)
    while (this.down.length && this.down[0].at <= this.now) deliver(this.down.shift()!.msg);
  }
}
