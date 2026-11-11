// In-process transport with an optional network-condition simulator (latency, jitter, loss, duplication).
// All messages cross the link as JSON so that nothing but serialisable data can pass between client and server.

import { mulberry32 } from '../content/weapons';

export interface Endpoint {
  send(msg: unknown): void;
  recv(): unknown[];
  close?(): void;
}

export interface LinkConditions {
  /** One-way latency in ms. */
  latency: number;
  jitter: number;
  /** 0..1 */
  loss: number;
  duplicate: number;
}

export const PERFECT_LINK: LinkConditions = { latency: 0, jitter: 0, loss: 0, duplicate: 0 };

/** Millimetre quantisation keeps JSON snapshots compact. */
function round3(_k: string, v: unknown): unknown { return typeof v === 'number' ? Math.round(v * 1000) / 1000 : v; }

interface Queued { at: number; data: string; seq: number }

export class NetLink {
  /** Virtual clock in ms, advanced by the host (real time in the browser, simulated in tests). */
  now = 0;
  bytesUp = 0;
  bytesDown = 0;
  private toServer: Queued[] = [];
  private toClient: Queued[] = [];
  private seq = 0;
  private rng: () => number;
  closed = false;

  constructor(public cond: LinkConditions = PERFECT_LINK, seed = 99) { this.rng = mulberry32(seed); }

  private push(q: Queued[], data: string): void {
    if (this.closed) return;
    if (this.rng() < this.cond.loss) return;
    const times = this.rng() < this.cond.duplicate ? 2 : 1;
    for (let i = 0; i < times; i++) {
      const j = (this.rng() * 2 - 1) * this.cond.jitter;
      q.push({ at: this.now + Math.max(0, this.cond.latency + j), data, seq: this.seq++ });
    }
  }

  private drain(q: Queued[]): unknown[] {
    const out: Queued[] = [];
    const keep: Queued[] = [];
    for (const m of q) (m.at <= this.now ? out : keep).push(m);
    q.length = 0;
    q.push(...keep);
    // Jitter may reorder: deliver by arrival time.
    out.sort((a, b) => a.at - b.at || a.seq - b.seq);
    return out.map((m) => JSON.parse(m.data));
  }

  readonly client: Endpoint = {
    send: (msg) => { const s = JSON.stringify(msg, round3); this.bytesUp += s.length; this.push(this.toServer, s); },
    recv: () => this.drain(this.toClient),
    close: () => { this.closed = true; },
  };

  readonly server: Endpoint = {
    send: (msg) => { const s = JSON.stringify(msg, round3); this.bytesDown += s.length; this.push(this.toClient, s); },
    recv: () => this.drain(this.toServer),
    close: () => { this.closed = true; },
  };
}
