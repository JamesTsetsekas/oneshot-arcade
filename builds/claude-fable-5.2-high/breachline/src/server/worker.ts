/// <reference lib="webworker" />
// game-server entry for Practice: the authoritative room runs in a Web Worker ("embedded server").
// The identical Room class can be hosted behind WebSockets in Node; only this transport shim differs.
import { DT } from '../content/tuning';
import { PRACTICE_RULESET } from '../content/loadout';
import { CONTENT_VERSION } from '../content/tuning';
import { ClientMsg, PROTOCOL_VERSION, ServerMsg } from '../protocol/messages';
import { loadRapier } from '../sim/physics';
import { Room } from './room';

const scope = self as unknown as DedicatedWorkerGlobalScope;
let room: Room | null = null;
let timer = 0;
let last = 0;
let acc = 0;

const post = (msg: ServerMsg, transfer?: ArrayBuffer[]) => scope.postMessage(msg, transfer ?? []);

function loop(): void {
  if (!room) return;
  const now = performance.now();
  acc += Math.min(0.25, (now - last) / 1000);
  last = now;
  let n = 0;
  while (acc >= DT && n < 8) { room.tick(); acc -= DT; n++; }
  if (n === 8) acc = 0; // fell behind (tab throttled): drop the backlog rather than spiral
}

scope.onmessage = async (e: MessageEvent<ClientMsg>) => {
  const msg = e.data;
  if (msg.m === 'hello') {
    if (msg.version !== PROTOCOL_VERSION || PRACTICE_RULESET.version !== CONTENT_VERSION) {
      post({ m: 'reject', code: 'version', detail: `Server protocol ${PROTOCOL_VERSION}, client ${msg.version}` });
      return;
    }
    const R = await loadRapier();
    room = new Room(R, msg.config, (_client, m, transfer) => post(m, transfer));
    const res = room.addHuman(1, msg.name, msg.loadouts, msg.loadout);
    if (!res.ok) { post({ m: 'reject', code: res.code, detail: res.detail }); room = null; return; }
    room.start();
    last = performance.now();
    timer = scope.setInterval(loop, 4);
  } else if (msg.m === 'leave') {
    scope.clearInterval(timer);
    room = null;
    scope.close();
  } else if (room) {
    room.onMessage(1, msg);
  }
};
