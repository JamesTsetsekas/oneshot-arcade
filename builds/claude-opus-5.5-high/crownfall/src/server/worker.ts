/// <reference lib="webworker" />
// Web Worker entry: the authoritative room lives off the main thread.
import { MatchHost } from './host';
import type { ClientMsg } from '../protocol/messages';

const ctx = self as unknown as DedicatedWorkerGlobalScope;
const host = new MatchHost((msg, transfer) => ctx.postMessage(msg, transfer ?? []));
ctx.onmessage = (e: MessageEvent<ClientMsg>) => {
  try {
    host.onMessage(e.data);
  } catch (err) {
    ctx.postMessage({ t: 'error', message: String((err as Error)?.message ?? err) });
  }
};
