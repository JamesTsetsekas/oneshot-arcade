// Round trace probe (not part of the default run): TRACE=1 npx vitest run tests/zz-trace.test.ts
import { describe, it } from 'vitest';
import { RULES_QUICK } from '../../src/content/rules';
import { getAnnex } from '../../src/map/annex';
import { calloutAt } from '../../src/map/build';
import { Room } from '../../src/server/room';

describe.runIf(!!(globalThis as unknown as { process: { env: Record<string, string | undefined> } }).process.env.TRACE)('trace', () => {
  it('prints a timeline of kills and objective events', () => {
    const map = getAnnex();
    const room = new Room({ map, rules: RULES_QUICK, seed: Number((globalThis as unknown as { process: { env: Record<string, string | undefined> } }).process.env.TRACE_SEED || 101), humans: [], team0Side: 'atk', difficulty: 'normal', autopilot: true });
    const m = room.match;
    const origTick = room.tick.bind(room);
    let lastPhase = '';
    const lines: string[] = [];
    while (m.phase !== 'matchEnd' && m.round <= Number((globalThis as unknown as { process: { env: Record<string, string | undefined> } }).process.env.TRACE_ROUNDS || 4)) {
      // capture events before the room clears them
      const send = (room as unknown as { buildFrame: unknown }).buildFrame;
      void send;
      const before = m.events.length;
      void before;
      (m as unknown as { _evs?: unknown[] })._evs = undefined;
      const stepOrig = m.step.bind(m);
      let evs: typeof m.events = [];
      m.step = (inputs) => {
        stepOrig(inputs);
        evs = m.events.slice();
      };
      origTick();
      m.step = stepOrig;
      const rt = (m.time - m.roundStart).toFixed(1);
      if (m.phase !== lastPhase) {
        lines.push(`[R${m.round} ${rt}] phase ${m.phase}`);
        lastPhase = m.phase;
      }
      for (const q of evs) {
        const e = q.ev;
        if (e.t === 'kill') {
          const k = m.players[e.killer];
          const v = m.players[e.victim];
          lines.push(`[R${m.round} ${rt}] ${m.sideOf(k)} ${k.name} killed ${m.sideOf(v)} ${v.name} @${calloutAt(map, v.move.x, v.move.z, v.move.y)} (${e.weapon}${e.head ? ' HS' : ''}) killer@${calloutAt(map, k.move.x, k.move.z, k.move.y)}`);
        } else if (e.t === 'armed') lines.push(`[R${m.round} ${rt}] ARMED ${e.site} alive atk ${m.aliveOn('atk')} def ${m.aliveOn('def')}`);
        else if (e.t === 'roundend' && q.to === 0) lines.push(`[R${m.round} ${rt}] END ${e.winnerSide} ${e.reason}`);
        else if (e.t === 'chat' && (globalThis as unknown as { process: { env: Record<string, string | undefined> } }).process.env.TRACE_CHAT) lines.push(`[R${m.round} ${rt}] radio(${q.team}) ${m.players[e.from]?.name}: ${e.text}`);
      }
      if (m.phase === 'armed' && m.tick % 128 === 0) {
        const pos = m.players.filter((p) => p.alive && m.sideOf(p) === 'def').map((p) => `${p.name}(${p.move.x.toFixed(1)},${p.move.y.toFixed(1)},${p.move.z.toFixed(1)} ${room.bots.bots.get(p.id)?.mode})`);
        lines.push(`[R${m.round} ${rt}] retake ${pos.join(' ')} go=${room.bots.brains[m.teamOfSide('def')].retakeGo} defuser=${room.bots.brains[m.teamOfSide('def')].defuser}`);
      }
      if (m.phase === 'live' && m.tick % 320 === 0) {
        const pos = m.players.filter((p) => p.alive).map((p) => `${m.sideOf(p)[0]}:${calloutAt(map, p.move.x, p.move.z, p.move.y)}`);
        lines.push(`[R${m.round} ${rt}] pos ${pos.join(' ')}`);
      }
    }
    console.log(lines.join('\n'));
  });
});
