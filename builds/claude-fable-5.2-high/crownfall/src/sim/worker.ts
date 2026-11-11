/// <reference lib="webworker" />
// Web Worker host for the authoritative simulation: fixed 30 Hz, decoupled from rendering.

import type { ToClient, ToServer } from '../shared/protocol';
import { GameServer } from './server';

let server: GameServer | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let last = 0;
let acc = 0;
let idle = 0;
const TICK_MS = 1000 / 30;
const post = (m: ToClient): void => (self as unknown as Worker).postMessage(m);

function loop(): void {
  try {
    tick();
  } catch (err) {
    // surface simulation faults to the client instead of silently freezing the match
    if (timer) clearInterval(timer);
    timer = null;
    post({ m: 'error', message: `Simulation error: ${err instanceof Error ? (err.stack ?? err.message) : String(err)}` });
  }
}

function tick(): void {
  if (!server) return;
  const now = performance.now();
  acc += (now - last) * server.timeScale;
  last = now;
  if (server.paused) {
    acc = 0;
    if (++idle % 6 === 0) post({ m: 'snap', snap: server.snapshot(), ack: server.lastSeq });
    return;
  }
  let steps = 0;
  while (acc >= TICK_MS && steps < 8) {
    server.step();
    acc -= TICK_MS;
    steps++;
  }
  if (acc > TICK_MS * 8) acc = 0; // tab was suspended: drop the backlog instead of fast-forwarding
  if (steps > 0) post({ m: 'snap', snap: server.snapshot(), ack: server.lastSeq });
}

self.onmessage = (e: MessageEvent<ToServer>): void => {
  const msg = e.data;
  try {
    switch (msg.m) {
      case 'init':
        server = new GameServer(msg.config);
        last = performance.now();
        acc = 0;
        if (timer) clearInterval(timer);
        timer = setInterval(loop, 1000 / 60);
        post({ m: 'ready' });
        post({ m: 'snap', snap: server.snapshot(), ack: 0 });
        break;
      case 'cmd':
        server?.command(msg.seq, msg.cmd);
        break;
      case 'pause':
        if (server) server.paused = msg.paused;
        break;
      case 'timescale':
        if (server) server.timeScale = Math.max(0.25, Math.min(8, msg.scale)); // UI offers up to 4x; tools may use 8x
        break;
      case 'stop':
        if (timer) clearInterval(timer);
        timer = null;
        server = null;
        break;
    }
  } catch (err) {
    post({ m: 'error', message: String(err) });
  }
};
