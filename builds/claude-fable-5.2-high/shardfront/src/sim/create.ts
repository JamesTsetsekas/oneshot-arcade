// Composition root for a match: simulation + server-side AI controllers.
import { attachAI } from '../ai/ai';
import type { MatchConfig } from '../net/protocol';
import { Sim } from './sim';

export function createSim(cfg: MatchConfig): Sim {
  const sim = new Sim(cfg);
  attachAI(sim);
  return sim;
}

export function skirmishConfig(seed: number, f0: 'helix' | 'chorus', f1: 'helix' | 'chorus', c0: 'human' | 'ai', d0: 'easy' | 'normal' | 'hard', d1: 'easy' | 'normal' | 'hard'): MatchConfig {
  return {
    seed, mode: 'skirmish',
    players: [
      { faction: f0, controller: c0, difficulty: d0, name: c0 === 'human' ? 'Commander' : `AI (${d0})` },
      { faction: f1, controller: 'ai', difficulty: d1, name: `AI (${d1})` },
    ],
  };
}
