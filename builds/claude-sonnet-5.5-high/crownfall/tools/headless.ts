/** Headless match runner: `npx vite-node tools/headless.ts [seed] [minutes]` */
import { Sim } from '../src/sim/sim';
import { HEROES } from '../src/shared/content';

export function makeSim(seed: number, diff: 'easy' | 'normal' | 'hard' = 'normal', playerBot = true) {
  const ids = HEROES.map((h) => h.id);
  const mk = (i: number) => ids[(i + seed) % ids.length];
  const picks: import("../src/sim/types").PickConfig[] = [0, 1, 2].map((i) => ({ heroId: mk(i), team: 0 as const, controller: 'bot' as const, talents: ['mend', 'aegis'] as [string, string] }))
    .concat([3, 4, 5].map((i) => ({ heroId: mk(i), team: 1 as const, controller: 'bot' as const, talents: ['mend', 'sprint'] as [string, string] })));
  void playerBot;
  return new Sim({ seed, picks, difficulty: diff, mode: 'match' });
}

