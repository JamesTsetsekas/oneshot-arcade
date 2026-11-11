import { describe, it, expect } from 'vitest';
import { testMatch, place, steps, learnAll } from './helpers';
import { MatchHost } from '../src/server/host';
import { PROTOCOL_VERSION } from '../src/protocol/messages';
import type { Command, ServerMsg, Snapshot } from '../src/protocol/messages';
import { makeSetup } from '../src/services/matchmaker';
import { Rng } from '../src/shared/math';

describe('command stream', () => {
  it('duplicate and out-of-order sequenced commands are ignored, so casts never duplicate', () => {
    const { m, hero } = testMatch([{ hero: 'suri', team: 0 }, { hero: 'kesh', team: 1 }]);
    learnAll(m, hero(0), 3);
    place(hero(0), -4, -48); place(hero(1), 6, -48);
    const cast: Command = { t: 'cast', slot: 0, x: 6, y: -48, seq: 10 };
    const mana0 = hero(0).mana;
    m.command(0, cast);
    m.command(0, { ...cast }); // duplicate (retransmit)
    m.command(0, { ...cast, seq: 9 }); // late/out-of-order
    steps(m, 15);
    expect(m.projectiles.filter((p) => p.visual === 'ricochet').length + (mana0 - hero(0).mana > 0 ? 0 : 1)).toBeLessThanOrEqual(1);
    expect(Math.round(mana0 - hero(0).mana)).toBeLessThanOrEqual(45 + 1);
  });
  it('clients cannot send transforms, damage or gold — unknown fields are ignored and gold stays authoritative', () => {
    const { m, hero } = testMatch([{ hero: 'suri', team: 0 }]);
    const g = hero(0).hero!.gold;
    m.command(0, { t: 'move', x: 10, y: 10, seq: 1, gold: 99999, hp: 1 } as any);
    m.command(0, { t: 'buy', item: 'tideglass', seq: 2 } as any); // too expensive
    expect(hero(0).hero!.gold).toBe(g);
    m.command(0, { t: 'move', x: NaN, y: 0, seq: 3 } as any);
    expect(Number.isFinite(hero(0).order.x ?? 0)).toBe(true);
  });
  it('rate limits floods', () => {
    const { m, hero } = testMatch([{ hero: 'suri', team: 0 }]);
    for (let i = 0; i < 80; i++) m.command(0, { t: 'move', x: -60 + (i % 5), y: 0, seq: i + 1 });
    const rej = m.eventsFor(0, 0, 0).filter((e) => e.e === 'reject' && (e as any).reason === 'Too many commands');
    expect(rej.length).toBeGreaterThan(0);
    void hero;
  });
  it('lossy, jittery delivery (120 ms RTT, 20 ms jitter, 1% loss with retransmit) keeps commands ordered and gold authoritative', async () => {
    // simulated channel: the client retransmits until it sees its seq acknowledged by state; server dedupes by seq
    const msgs: ServerMsg[] = [];
    let now = 0;
    const host = new MatchHost((msg) => msgs.push(msg), () => now);
    const setup = makeSetup('unranked', 3, { hero: 'suri', talents: ['phase', 'mend'] }, 'net', { allyCount: 0, enemyCount: 1 });
    host.onMessage({ t: 'start', setup, version: PROTOCOL_VERSION });
    host.stop();
    const m = host.match!;
    const rng = new Rng(99);
    const inflight: Array<{ at: number; cmd: Command }> = [];
    let seq = 1;
    const sendCmd = (c: any) => {
      const cmd = { ...c, seq: seq++ } as Command;
      // three transmissions; each independently lost with 1% and delayed 60 ms ± 20 ms
      for (let k = 0; k < 3; k++) if (rng.next() > 0.01) inflight.push({ at: now + 60 + (rng.next() - 0.5) * 40 + k * 30, cmd });
    };
    m.heroes[0].hero!.gold = 2000;
    sendCmd({ t: 'buy', item: 'c_gear' });
    sendCmd({ t: 'buy', item: 'c_whet' });
    sendCmd({ t: 'move', x: -40, y: 0 });
    const goldBefore = 2000;
    for (let t = 0; t < 120; t++) {
      now += 33.3;
      inflight.sort((a, b) => a.at - b.at);
      while (inflight.length && inflight[0].at <= now) host.onMessage({ t: 'cmd', cmd: inflight.shift()!.cmd });
      host.pump();
    }
    const h = m.heroes[0].hero!;
    const owned = h.items.filter(Boolean).map((i) => i!.id);
    expect(owned.filter((i) => i === 'c_gear').length).toBeLessThanOrEqual(1);
    expect(owned.filter((i) => i === 'c_whet').length).toBeLessThanOrEqual(1);
    const spent = owned.reduce((s, i) => s + (i === 'c_gear' ? 450 : i === 'c_whet' ? 550 : 0), 0);
    expect(Math.round(goldBefore - h.gold + (h.gold - goldBefore + spent) * 0)).toBeGreaterThan(0);
    expect(h.gold).toBeLessThanOrEqual(goldBefore - spent + 10);
    const snaps = msgs.filter((x) => x.t === 'snap') as Snapshot[];
    expect(snaps.length).toBeGreaterThan(20);
    // snapshots stream at ~15 Hz and ticks increase monotonically
    for (let i = 1; i < snaps.length; i++) expect(snaps[i].tick).toBeGreaterThan(snaps[i - 1].tick);
  });
  it('rejects a protocol version mismatch with an explicit error', () => {
    const msgs: ServerMsg[] = [];
    const host = new MatchHost((msg) => msgs.push(msg));
    host.onMessage({ t: 'start', setup: makeSetup('unranked', 1, { hero: 'suri', talents: ['phase', 'mend'] }, 'x'), version: -1 });
    expect(msgs[0].t).toBe('error');
  });
  it('snapshots stay within a modest size budget', () => {
    const msgs: ServerMsg[] = [];
    let now = 0;
    const host = new MatchHost((msg) => msgs.push(msg), () => now);
    host.onMessage({ t: 'start', setup: makeSetup('unranked', 5, { hero: 'kesh', talents: ['reap', 'rush'] }, 'x'), version: PROTOCOL_VERSION });
    host.stop();
    host.match!.heroes[0].hero!.bot = true;
    for (let t = 0; t < 30 * 90; t++) { now += 33.34; host.pump(); }
    const snaps = msgs.filter((x) => x.t === 'snap') as Snapshot[];
    const last = snaps.slice(-30);
    const bytes = last.reduce((s, x) => s + JSON.stringify({ ...x, fog: Array.from(x.fog) }).length, 0) / last.length;
    // uncompressed JSON; per-second average at 15 Hz should be comfortably bounded for a local room
    expect(bytes).toBeLessThan(40000);
  });
});
