import { BOT_TALENTS } from '../src/ai/bots';
import { HeroId, XP_TABLE } from '../src/shared/heroes';
import type { TalentId } from '../src/shared/items';
import { secs } from '../src/shared/math';
import type { Command, Difficulty, MatchConfig, SeatConfig } from '../src/shared/protocol';
import { grantXp, recalcStats } from '../src/sim/combat';
import { issue } from '../src/sim/hero';
import type { Unit } from '../src/sim/types';
import { updateVision } from '../src/sim/vision';
import { World } from '../src/sim/world';

export function seat(hero: HeroId, team: 0 | 1, bot = true, name: string = hero): SeatConfig {
  return { hero, team, bot, name, talents: BOT_TALENTS[hero] as [TalentId, TalentId] };
}

/** Six bots, no human seat: the headless balance / soak configuration. */
export function botMatch(seed: number, opts: Partial<MatchConfig> = {}, difficulty: Difficulty = 'normal'): MatchConfig {
  return {
    seed,
    mode: 'unranked',
    difficulty,
    pace: 'quick',
    humanSeat: -1,
    seats: [seat('brannoch', 0), seat('suri', 0), seat('kesh', 0), seat('ilyra', 1), seat('oru', 1), seat('vey', 1)],
    ...opts,
  };
}

/** A quiet world where no hero has a bot brain, for deterministic rule fixtures. */
export function fixture(heroes: [HeroId, 0 | 1][], opts: Partial<MatchConfig> = {}): { w: World; h: Unit[] } {
  const w = new World({
    seed: 7,
    mode: 'unranked',
    difficulty: 'normal',
    pace: 'standard',
    humanSeat: -1,
    seats: heroes.map(([hero, team], i) => seat(hero, team, false, `${hero}${i}`)),
    ...opts,
  });
  return { w, h: w.heroes };
}

export function step(w: World, ticks: number): void {
  for (let i = 0; i < ticks; i++) w.step();
}
export const stepSecs = (w: World, s: number): void => step(w, secs(s));

export function place(w: World, u: Unit, x: number, y: number): void {
  u.x = x;
  u.y = y;
  u.path = null;
  if (u.hero) u.hero.order = { t: 'idle' };
  u.brush = w.map.brushAt(x, y);
  u.visUntil = [-1, -1];
  updateVision(w);
}

export function setLevel(w: World, u: Unit, level: number): void {
  const target = XP_TABLE[Math.min(XP_TABLE.length, level) - 1];
  if (u.hero!.xp < target) grantXp(w, u, target - u.hero!.xp);
  recalcStats(w, u);
  u.hp = u.stats.maxHp;
  u.mana = u.stats.maxMana;
}

/** Learn abilities directly (bypasses skill points) and refill resources. */
export function learn(w: World, u: Unit, ranks: number[]): void {
  u.hero!.ranks = ranks.slice();
  recalcStats(w, u);
  u.mana = u.stats.maxMana;
}

export const cmd = (w: World, u: Unit, c: Command): string | null => issue(w, u, c);

export function cast(w: World, u: Unit, slot: number, x: number, y: number, id?: number): string | null {
  return issue(w, u, { t: 'cast', slot, x, y, id });
}

/** Post-mitigation damage a hero has taken from a named source (robust against regen / other attackers). */
export function dmgFrom(u: Unit, label: string): number {
  let sum = 0;
  for (const l of u.hero!.dmgLog) if (l.label === label) sum += l.amount;
  return sum;
}

export const UPPER_MID = { x: 75, y: 98 };
export const LOWER_MID = { x: 75, y: 23 };

export function rejections(w: World): string[] {
  return w.events.filter((e) => e.ev.e === 'reject').map((e) => (e.ev as { reason: string }).reason);
}
