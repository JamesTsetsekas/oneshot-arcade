import { describe, expect, test } from 'vitest';
import { decodeCommand, encodeCommand, parseCommand, sanitizeLabel } from '../src/network-protocol/protocol';
import { Hasher, Rng } from '../src/simulation-core/rng';

describe('protocol & determinism primitives', () => {
  test('rng is deterministic per seed', () => {
    const a = new Rng(99), b = new Rng(99), c = new Rng(100);
    const sa = Array.from({ length: 50 }, () => a.nextU32());
    const sb = Array.from({ length: 50 }, () => b.nextU32());
    expect(sa).toEqual(sb);
    expect(sa).not.toEqual(Array.from({ length: 50 }, () => c.nextU32()));
  });
  test('hasher is stable', () => {
    const h = new Hasher(); h.word(1); h.word(-5); h.word(123456);
    const g = new Hasher(); g.word(1); g.word(-5); g.word(123456);
    expect(h.value).toBe(g.value);
  });
  test('command encode/decode round trip', () => {
    const c = { seq: 3, tick: 40, player: 1, kind: 'move' as const, ids: [5, 6], x: 10.5, y: 20, queued: true };
    expect(decodeCommand(encodeCommand(c))).toEqual(c);
  });
  test('malformed commands are rejected', () => {
    expect(parseCommand(null)).toBeNull();
    expect(parseCommand({ seq: 1, tick: 1, player: 0, kind: 'nuke', ids: [] })).toBeNull();
    expect(parseCommand({ seq: 1, tick: 1, player: 0, kind: 'move', ids: ['a'] })).toBeNull();
    expect(parseCommand({ seq: 1, tick: 1, player: 0, kind: 'move', ids: [1], x: Infinity })).toBeNull();
    expect(parseCommand({ seq: 1, tick: 1, player: 0, kind: 'move', ids: new Array(300).fill(1) })).toBeNull();
  });
  test('labels are sanitized and length-limited', () => {
    expect(sanitizeLabel('<script>alert(1)</script>')).not.toContain('<');
    expect(sanitizeLabel('x'.repeat(100)).length).toBeLessThanOrEqual(24);
    expect(sanitizeLabel('\u0000\u0001')).toBe('Commander');
  });
});
