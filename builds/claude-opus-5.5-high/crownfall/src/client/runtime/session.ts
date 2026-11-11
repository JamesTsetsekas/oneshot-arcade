// Client match session: sequenced command stream out, snapshots in, render interpolation.
import { createTransport, Transport } from '../../protocol/transport';
import { PROTOCOL_VERSION } from '../../protocol/messages';
import type { CommandBody, EntView, GameEvent, MatchResult, MatchSetup, Snapshot, ServerMsg } from '../../protocol/messages';
import { FOG_W, FOG_H } from '../../shared/map';
import { wrapAngle } from '../../shared/math';

export interface InterpEnt extends EntView { born: number }

export class MatchSession {
  transport: Transport;
  setup: MatchSetup;
  seq = 1;
  snaps: Array<{ s: Snapshot; at: number }> = [];
  latest: Snapshot | null = null;
  fog = new Uint8Array(FOG_W * FOG_H);
  fogDirty = false;
  ready = false;
  result: MatchResult | null = null;
  error: string | null = null;
  firstSeen = new Map<number, number>();
  listeners = { snapshot: [] as Array<(s: Snapshot) => void>, events: [] as Array<(e: GameEvent[]) => void>, result: [] as Array<(r: MatchResult) => void>, error: [] as Array<(m: string) => void>, ready: [] as Array<() => void> };
  sentCount = 0;
  bytesIn = 0;

  constructor(setup: MatchSetup) {
    this.setup = setup;
    this.transport = createTransport();
    this.transport.onMessage = (m) => this.receive(m);
  }

  start() { this.transport.send({ t: 'start', setup: this.setup, version: PROTOCOL_VERSION }); }
  close() { this.transport.close(); }

  send(body: CommandBody) {
    this.sentCount++;
    this.transport.send({ t: 'cmd', cmd: { ...body, seq: this.seq++ } as any });
  }

  private receive(m: ServerMsg) {
    switch (m.t) {
      case 'ready': this.ready = true; this.listeners.ready.forEach((f) => f()); break;
      case 'error': this.error = m.message; this.listeners.error.forEach((f) => f(m.message)); break;
      case 'result': this.result = m.result; this.listeners.result.forEach((f) => f(m.result)); break;
      case 'snap': {
        const now = performance.now();
        this.latest = m;
        this.snaps.push({ s: m, at: now });
        if (this.snaps.length > 8) this.snaps.shift();
        const bits = m.fog;
        for (let i = 0; i < this.fog.length; i++) this.fog[i] = (bits[i >> 3] >> (i & 7)) & 1;
        this.fogDirty = true;
        for (const e of m.ents) if (!this.firstSeen.has(e.id)) this.firstSeen.set(e.id, m.time);
        if (this.firstSeen.size > 4000) {
          const live = new Set(m.ents.map((e) => e.id));
          for (const id of this.firstSeen.keys()) if (!live.has(id)) this.firstSeen.delete(id);
        }
        this.listeners.snapshot.forEach((f) => f(m));
        if (m.events.length) this.listeners.events.forEach((f) => f(m.events));
        break;
      }
    }
  }

  /** Estimated current server time. */
  serverTime(now = performance.now()): number {
    const l = this.snaps[this.snaps.length - 1];
    if (!l) return 0;
    if (l.s.paused) return l.s.time;
    return l.s.time + Math.min(0.25, ((now - l.at) / 1000) * l.s.timeScale);
  }

  /** Interpolated entity states at render time (remote entities ~100 ms behind; own hero uses newest). */
  sample(now = performance.now()): { time: number; ents: InterpEnt[] } {
    const n = this.snaps.length;
    if (!n) return { time: 0, ents: [] };
    const st = this.serverTime(now);
    const rt = st - 0.1;
    let a = this.snaps[0], b = this.snaps[n - 1];
    for (let i = n - 1; i > 0; i--) {
      if (this.snaps[i - 1].s.time <= rt) { a = this.snaps[i - 1]; b = this.snaps[i]; break; }
    }
    const span = Math.max(0.001, b.s.time - a.s.time);
    const alpha = Math.max(0, Math.min(1.25, (rt - a.s.time) / span));
    const prev = new Map<number, EntView>();
    for (const e of a.s.ents) prev.set(e.id, e);
    const meId = this.latest?.me.heroId;
    const newest = this.snaps[n - 1].s;
    const out: InterpEnt[] = [];
    for (const e of b.s.ents) {
      const p = prev.get(e.id);
      const born = this.firstSeen.get(e.id) ?? 0;
      if (e.id === meId) {
        const ne = newest.ents.find((x) => x.id === meId) ?? e;
        out.push({ ...ne, born });
        continue;
      }
      if (!p || Math.hypot(p.x - e.x, p.y - e.y) > 8) { out.push({ ...e, born }); continue; }
      out.push({ ...e, born, x: p.x + (e.x - p.x) * alpha, y: p.y + (e.y - p.y) * alpha, f: p.f + wrapAngle(e.f - p.f) * Math.min(1, alpha) });
    }
    // entities present in newest but not in b (spawned recently)
    if (b.s !== newest) {
      const have = new Set(out.map((o) => o.id));
      for (const e of newest.ents) if (!have.has(e.id) && (e.k === 11 || e.k === 12)) out.push({ ...e, born: this.firstSeen.get(e.id) ?? 0 });
    }
    return { time: st, ents: out };
  }
}
