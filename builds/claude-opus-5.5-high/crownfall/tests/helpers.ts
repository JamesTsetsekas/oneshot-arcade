import { Match } from '../src/sim/match';
import type { MatchSetup, PlayerSetup, CommandBody } from '../src/protocol/messages';
import type { HeroId } from '../src/shared/types';
import type { Unit } from '../src/sim/types';
import { defaultTalents } from '../src/services/matchmaker';
import { xpForLevel } from '../src/shared/rules';

/** A controllable match: every hero is command-driven (no bots) unless `bots` is set. Waves and camps are off by default. */
export function testMatch(heroes: Array<{ hero: HeroId; team: 0 | 1 }>, opts: { mode?: MatchSetup['mode']; bots?: boolean; seed?: number; waves?: boolean } = {}) {
  const players: PlayerSetup[] = heroes.map((h, i) => ({ slot: i, team: h.team, hero: h.hero, talents: defaultTalents(h.hero), name: `P${i}`, bot: !!opts.bots, difficulty: 'normal' }));
  const m = new Match({ mode: opts.mode ?? 'practice', seed: opts.seed ?? 1, players, humanSlot: 0 });
  if (!opts.waves) { m.nextWaveAt = 1e9; for (const c of m.camps) c.respawnAt = 1e9; }
  let seq = 1;
  const cmd = (slot: number, c: CommandBody) => m.command(slot, { ...c, seq: seq++ } as any);
  return { m, cmd, hero: (i: number) => m.heroes[i] };
}

export function place(u: Unit, x: number, y: number) { u.x = x; u.y = y; u.path = null; u.order = { type: 'idle' }; }
export function steps(m: Match, n: number) { for (let i = 0; i < n; i++) m.step(); }
export function seconds(m: Match, s: number) { steps(m, Math.round(s * 30)); }
/** Level the hero and give rank 1 in every ability (rank R if level >= 6). */
export function learnAll(m: Match, u: Unit, level = 6) {
  if (level > 1) m.grantXp(u, xpForLevel(level) - u.hero!.xp);
  const h = u.hero!;
  h.ranks = [1, 1, 1, level >= 6 ? 1 : 0];
  h.skillPoints = 0;
  u.mana = u.stats.maxMana;
}
export function rejects(m: Match, slot: number): string[] {
  return m.eventsFor(0, slot, 0).filter((e) => e.e === 'reject').map((e) => (e as any).reason);
}
