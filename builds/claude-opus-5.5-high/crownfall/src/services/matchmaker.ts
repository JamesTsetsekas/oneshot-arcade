// Local unranked matchmaker: seats six players, filling with named bots (no network backend in this build).
import type { MatchSetup, PlayerSetup, MatchMode } from '../protocol/messages';
import { HERO_IDS, HeroId, TalentId } from '../shared/types';
import { Rng } from '../shared/math';
import { HEROES } from '../shared/heroes';
import { BOT_NAMES } from '../ai/bot';

const DEFAULT_TALENTS: Record<HeroId, [TalentId, TalentId]> = {
  brannoch: ['phase', 'bulwark'],
  suri: ['phase', 'mend'],
  oru: ['mend', 'bulwark'],
  kesh: ['reap', 'rush'],
  ilyra: ['phase', 'scorch'],
  vey: ['reap', 'scorch'],
};
export function defaultTalents(h: HeroId): [TalentId, TalentId] { return [...DEFAULT_TALENTS[h]] as [TalentId, TalentId]; }

/** Bots draft to complement allies: ensure a front-liner and a jungle-capable hero where possible. */
export function botPick(rng: Rng, taken: HeroId[], allies: HeroId[]): HeroId {
  const free = HERO_IDS.filter((h) => !taken.includes(h));
  const roles = allies.map((a) => HEROES[a].preferredRole);
  const want = !roles.includes('jungle') ? 'jungle' : !allies.some((a) => HEROES[a].roles.includes('Tank') || HEROES[a].roles.includes('Fighter')) ? 'front' : 'any';
  const pool = free.filter((h) => want === 'jungle' ? HEROES[h].preferredRole === 'jungle' : want === 'front' ? HEROES[h].roles.includes('Tank') || HEROES[h].roles.includes('Fighter') : true);
  return rng.pick(pool.length ? pool : free);
}

export function makeBotSetup(seed: number, difficulty: PlayerSetup['difficulty'] = 'normal'): MatchSetup {
  const rng = new Rng(seed);
  const players: PlayerSetup[] = [];
  const teamPicks: HeroId[][] = [[], []];
  const names = [...BOT_NAMES];
  for (let i = 0; i < 6; i++) {
    const team = (i % 2) as 0 | 1;
    const hero = botPick(rng, teamPicks[team], teamPicks[team]);
    teamPicks[team].push(hero);
    const name = names.splice(rng.int(0, names.length - 1), 1)[0];
    players.push({ slot: i, team, hero, talents: defaultTalents(hero), name, bot: true, difficulty });
  }
  return { mode: 'unranked', seed, players, humanSlot: 0 };
}

export interface DraftResult { hero: HeroId; talents: [TalentId, TalentId] }

/** Build the full setup after the human locks in. Mirrored enemy picks are allowed; duplicates per team are not. */
export function makeSetup(mode: MatchMode, seed: number, human: DraftResult, name: string, opts: { allies?: HeroId[]; enemies?: HeroId[]; allyCount?: number; enemyCount?: number; difficulty?: PlayerSetup['difficulty']; botNames?: string[] } = {}): MatchSetup {
  const rng = new Rng(seed ^ 0x5bd1e995);
  const diff = opts.difficulty ?? 'normal';
  const allyCount = opts.allyCount ?? 2, enemyCount = opts.enemyCount ?? 3;
  const names = opts.botNames ? [...opts.botNames] : [...BOT_NAMES].sort(() => rng.next() - 0.5);
  const players: PlayerSetup[] = [{ slot: 0, team: 0, hero: human.hero, talents: human.talents, name, bot: false, difficulty: diff }];
  const ally: HeroId[] = [human.hero];
  let slot = 1;
  for (let i = 0; i < allyCount; i++) {
    const h = opts.allies?.[i] ?? botPick(rng, ally, ally);
    ally.push(h);
    players.push({ slot: slot++, team: 0, hero: h, talents: defaultTalents(h), name: names.shift() ?? `Bot ${slot}`, bot: true, difficulty: diff });
  }
  const enemy: HeroId[] = [];
  for (let i = 0; i < enemyCount; i++) {
    const h = opts.enemies?.[i] ?? botPick(rng, enemy, enemy);
    enemy.push(h);
    players.push({ slot: slot++, team: 1, hero: h, talents: defaultTalents(h), name: names.shift() ?? `Bot ${slot}`, bot: true, difficulty: diff });
  }
  return { mode, seed, players, humanSlot: 0 };
}
