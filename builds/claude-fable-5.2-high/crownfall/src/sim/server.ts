// The authoritative room. Owns the World, validates + rate-limits sequenced commands, steps the
// simulation and produces team-filtered snapshots. Transport-agnostic: the browser build runs it
// inside a Web Worker (src/sim/worker.ts); tests and tools run it in-process.

import { Command, HeroPublic, MatchConfig, Snapshot } from '../shared/protocol';
import { issue } from './hero';
import type { Emitted } from './types';
import { buildSnapshot, heroPublic } from './view';
import { World } from './world';

export class GameServer {
  readonly world: World;
  readonly humanId: number;
  readonly team: 0 | 1;
  paused = false;
  timeScale = 1;
  lastSeq = 0;
  private pending: Emitted[] = [];
  private cmdWindowStart = 0;
  private cmdCount = 0;

  constructor(readonly config: MatchConfig) {
    this.world = new World(config);
    const hero = config.humanSeat >= 0 ? this.world.heroes[config.humanSeat] : undefined;
    this.humanId = hero ? hero.id : 0;
    this.team = hero ? (hero.team as 0 | 1) : 0;
  }

  /** Apply one sequenced command from the human seat. Out-of-order / duplicate sequence numbers are dropped. */
  command(seq: number, cmd: Command): void {
    if (seq <= this.lastSeq) return;
    this.lastSeq = seq;
    const w = this.world;
    // command rate limit: 60 per second
    if (w.tick - this.cmdWindowStart >= 30) {
      this.cmdWindowStart = w.tick;
      this.cmdCount = 0;
    }
    if (++this.cmdCount > 60) return;
    const hero = w.byId.get(this.humanId);
    if (!hero) return;
    issue(w, hero, cmd);
  }

  step(): void {
    if (this.paused) return;
    this.world.step();
    if (this.world.events.length) {
      this.pending.push(...this.world.events);
      this.world.events = [];
    }
  }

  snapshot(): Snapshot {
    // commands issued while paused may still emit private events (rejections, purchases)
    if (this.world.events.length) {
      this.pending.push(...this.world.events);
      this.world.events = [];
    }
    const ev = this.pending;
    this.pending = [];
    return buildSnapshot(this.world, this.team, this.humanId, ev, this.paused, this.timeScale);
  }

  /** Unfiltered end-of-match summary (everything is public once the match is over). */
  results(): HeroPublic[] {
    return this.world.heroes.map((h) => heroPublic(this.world, h, -1));
  }
}
