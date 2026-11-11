// Transport abstraction: Worker room (default) or in-thread room (fallback). Both speak the same messages.
import type { ClientMsg, ServerMsg } from './messages';
import { MatchHost } from '../server/host';

export interface Transport {
  send(msg: ClientMsg): void;
  onMessage: (msg: ServerMsg) => void;
  close(): void;
  kind: 'worker' | 'local';
}

export function createTransport(): Transport {
  try {
    const w = new Worker(new URL('../server/worker.ts', import.meta.url), { type: 'module' });
    const t: Transport = {
      kind: 'worker',
      onMessage: () => {},
      send: (msg) => w.postMessage(msg),
      close: () => { try { w.postMessage({ t: 'leave' }); } catch { /* ignore */ } w.terminate(); },
    };
    w.onmessage = (e: MessageEvent<ServerMsg>) => t.onMessage(e.data);
    w.onerror = (e) => t.onMessage({ t: 'error', message: `Simulation worker error: ${e.message}` });
    return t;
  } catch {
    return createLocalTransport();
  }
}

/** Same-thread room; used as a fallback and by tests. Messages are structured-cloned to mimic a wire. */
export function createLocalTransport(): Transport {
  const t: Transport = { kind: 'local', onMessage: () => {}, send: () => {}, close: () => {} };
  const host = new MatchHost((msg) => setTimeout(() => t.onMessage(msg), 0));
  t.send = (msg) => host.onMessage(structuredClone(msg));
  t.close = () => host.stop();
  return t;
}
