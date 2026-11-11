// Headless match runner: owns the authoritative Sim and the AI seats. The browser client and the
// tests both drive matches through this, so a future Node match process can reuse it verbatim.
import { AIController, type Difficulty } from '../ai/ai';
import { Sim } from '../simulation-core/sim';
import { decodeCommand, encodeCommand, PROTOCOL_VERSION, SIM_VERSION, type MatchSetup, type ReplayFile } from '../network-protocol/protocol';
import { applyScenario } from './scenario';

export class MatchRunner {
  readonly sim: Sim;
  readonly ais: AIController[] = [];
  readonly replay: ReplayFile | null;
  hashMismatch = -1;
  private replayIdx = 0;
  private replayCmds: ReturnType<typeof decodeCommand>[] = [];

  constructor(setup: MatchSetup, replay: ReplayFile | null = null) {
    this.sim = new Sim(setup);
    applyScenario(this.sim);
    this.replay = replay;
    if (replay) {
      this.replayCmds = replay.commands.map(decodeCommand).filter(Boolean);
    } else {
      setup.players.forEach((p, i) => {
        if (p.ai === 'easy' || p.ai === 'normal' || p.ai === 'hard') this.ais.push(new AIController(this.sim, i, p.ai as Difficulty));
      });
    }
  }

  step() {
    const sim = this.sim;
    if (sim.over) return;
    if (this.replay) {
      while (this.replayIdx < this.replayCmds.length && this.replayCmds[this.replayIdx]!.tick <= sim.tick + 1) {
        sim.inject(this.replayCmds[this.replayIdx]!);
        this.replayIdx++;
      }
    } else for (const ai of this.ais) ai.update();
    sim.step();
    if (this.replay && sim.tick % 100 === 0 && this.hashMismatch < 0) {
      const ref = this.replay.hashes.find((h) => h[0] === sim.tick);
      if (ref && ref[1] !== sim.hashes[sim.hashes.length - 1]?.[1]) this.hashMismatch = sim.tick;
    }
  }

  toReplay(): ReplayFile {
    const sim = this.sim;
    return {
      version: PROTOCOL_VERSION, simVersion: SIM_VERSION, setup: sim.setup,
      commands: sim.commandLog.map(encodeCommand), hashes: sim.hashes.slice(), endTick: sim.tick, winner: sim.winner,
    };
  }
}
