import { test } from 'vitest';
import { Match } from '../../src/server/match';
import { BotBrain } from '../../src/server/bots/brain';
test('autopilot', () => {
  const m = new Match({ seed: 21, mode: 'solo', pace: 'short', humans: [{ name: 'H', body: 0, glider: 0 }], stagingSeconds: 2 });
  const me = m.players[0];
  me.bot = new BotBrain(me, 0.77);
  let last = '';
  while (m.tick < 30 * 150) {
    m.step(new Map([[0, { seq: 0, mx: 0, mz: 0, yaw: 0, pitch: 0, buttons: 0, slot: 0 }]]));
    const b = me.bot!;
    const s = `${b.state} goal=${b.goal?.kind}:${b.goal?.id} sel=${me.sel} slots=${me.slots.filter(Boolean).length} mode=${me.ms.mode} focus=${JSON.stringify(m.focusFor(me))}`;
    if (m.tick % 60 === 0 && s !== last) { console.log(m.matchClock().toFixed(0), s, me.ms.x.toFixed(0), me.ms.z.toFixed(0)); last = s; }
  }
});
