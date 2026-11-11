import { describe, expect, it } from 'vitest';
import { Bot } from '../src/bot';
import { Sim } from '../src/sim/sim';
import type { TaxiSpec } from '../src/sim/data';

/** drive with the autopilot until the first delivery (or 200 s), then run the shift out */
function drive(seed: number, taxi: TaxiSpec['id']) {
  const sim = new Sim({ seed, mode: 'quick', taxi, traffic: 'calm' });
  const bot = new Bot();
  let frames = 0;
  while (sim.phase !== 'ended' && frames < 60 * 260) {
    sim.step(bot.next(sim));
    sim.drain();
    frames++;
    if (sim.deliveries >= 1 && sim.clock > 1) sim.clock = 0.5; // end the shift soon after the first fare
  }
  return sim;
}

describe('end-to-end autopilot runs (headless simulation)', () => {
  it('the autopilot completes a fare with every taxi and the shift ends with a ranked result', () => {
    for (const taxi of ['gull', 'breaker', 'tempest'] as const) {
      const sim = drive(7, taxi);
      expect(sim.deliveries, taxi).toBeGreaterThanOrEqual(1);
      expect(sim.phase, taxi).toBe('ended');
      expect(sim.result?.score, taxi).toBeGreaterThan(0);
      expect(['S', 'A', 'B', 'C', 'D']).toContain(sim.result?.rank);
    }
  }, 120000);
});
