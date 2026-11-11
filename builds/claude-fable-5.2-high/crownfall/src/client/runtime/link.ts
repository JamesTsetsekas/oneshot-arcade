// client-runtime: transport to the authoritative simulation. The default link hosts the server in
// a Web Worker (so the 30 Hz tick never shares a thread with rendering); the in-process link is a
// fallback for environments without module workers and is what tools/tests use.

import type { Command, MatchConfig, Snapshot, ToClient, ToServer } from '../../shared/protocol';
import { GameServer } from '../../sim/server';

export interface ServerLink {
  send(cmd: Command): void;
  pause(paused: boolean): void;
  timescale(scale: number): void;
  stop(): void;
  readonly kind: 'worker' | 'inproc';
}

export interface LinkHandlers {
  onSnapshot(s: Snapshot): void;
  onError(message: string): void;
}

class WorkerLink implements ServerLink {
  readonly kind = 'worker' as const;
  private seq = 0;
  constructor(
    private worker: Worker,
    config: MatchConfig,
    h: LinkHandlers,
  ) {
    worker.onmessage = (e: MessageEvent<ToClient>): void => {
      const m = e.data;
      if (m.m === 'snap') h.onSnapshot(m.snap);
      else if (m.m === 'error') h.onError(m.message);
    };
    worker.onerror = (e): void => h.onError(e.message || 'Simulation worker failed');
    this.post({ m: 'init', config });
  }
  private post(m: ToServer): void {
    this.worker.postMessage(m);
  }
  send(cmd: Command): void {
    this.post({ m: 'cmd', seq: ++this.seq, cmd });
  }
  pause(paused: boolean): void {
    this.post({ m: 'pause', paused });
  }
  timescale(scale: number): void {
    this.post({ m: 'timescale', scale });
  }
  stop(): void {
    this.post({ m: 'stop' });
    this.worker.terminate();
  }
}

class InProcLink implements ServerLink {
  readonly kind = 'inproc' as const;
  private server: GameServer;
  private timer: ReturnType<typeof setInterval>;
  private seq = 0;
  private last = performance.now();
  private acc = 0;
  constructor(config: MatchConfig, h: LinkHandlers) {
    this.server = new GameServer(config);
    const tickMs = 1000 / 30;
    h.onSnapshot(this.server.snapshot());
    this.timer = setInterval(() => {
      const now = performance.now();
      this.acc += (now - this.last) * this.server.timeScale;
      this.last = now;
      if (this.server.paused) {
        this.acc = 0;
        return;
      }
      let steps = 0;
      while (this.acc >= tickMs && steps < 8) {
        this.server.step();
        this.acc -= tickMs;
        steps++;
      }
      if (this.acc > tickMs * 8) this.acc = 0;
      if (steps) h.onSnapshot(this.server.snapshot());
    }, 1000 / 60);
  }
  send(cmd: Command): void {
    this.server.command(++this.seq, cmd);
  }
  pause(paused: boolean): void {
    this.server.paused = paused;
  }
  timescale(scale: number): void {
    this.server.timeScale = scale;
  }
  stop(): void {
    clearInterval(this.timer);
  }
}

export function createLink(config: MatchConfig, h: LinkHandlers, forceInProc = false): ServerLink {
  if (!forceInProc && typeof Worker !== 'undefined') {
    try {
      const worker = new Worker(new URL('../../sim/worker.ts', import.meta.url), { type: 'module' });
      return new WorkerLink(worker, config, h);
    } catch (err) {
      console.warn('Worker unavailable, running the simulation in-process', err);
    }
  }
  return new InProcLink(config, h);
}
