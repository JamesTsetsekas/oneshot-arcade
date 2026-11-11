// tools: headless balance simulator. Runs AI-vs-AI matches across factions and seeds and prints a summary.
//   npm run balance
import { it } from 'vitest';
import { createSim, skirmishConfig } from '../src/sim/create';

it('balance tournament', () => {
  const combos: ['helix' | 'chorus', 'helix' | 'chorus'][] = [['helix', 'chorus'], ['chorus', 'helix'], ['helix', 'helix'], ['chorus', 'chorus']];
  const seeds = (process.env.SEEDS ?? '1,2,3,4').split(',').map(Number);
  const diff = (process.env.DIFF ?? 'normal') as 'easy' | 'normal' | 'hard';
  const wins: Record<string, number> = { helix: 0, chorus: 0, none: 0 };
  const lines: string[] = [];
  let total = 0, n = 0;
  for (const [a, b] of combos) for (const seed of seeds) {
    const s = createSim(skirmishConfig(seed, a, b, 'ai', diff, diff));
    for (let i = 0; i < 20 * 60 * 40 && s.winner < 0; i++) s.step();
    const w = s.winner >= 0 ? s.cfg.players[s.winner].faction : 'none';
    if (a !== b) wins[w]++;
    total += s.tick; n++;
    lines.push(`${a} vs ${b} seed ${seed}: ${w} (P${s.winner}) at ${(s.tick / 1200).toFixed(1)} min | ` + s.players.map((q) => `made ${q.stats.unitsCreated} lost ${q.stats.unitsLost} ore ${Math.round(q.stats.oreCollected)}`).join(' | '));
  }
  console.log(lines.join('\n'));
  console.log(`cross-faction wins: helix ${wins.helix}, chorus ${wins.chorus}, unresolved ${wins.none}; mean length ${(total / n / 1200).toFixed(1)} min`);
});
