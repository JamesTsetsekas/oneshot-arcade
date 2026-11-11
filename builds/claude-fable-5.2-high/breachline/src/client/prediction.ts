// client-runtime: local prediction + reconciliation. Pure logic (no DOM) so it is exercised headlessly in tests.
// The client steps the same shared player simulation the server runs, then on every snapshot rewinds to the
// authoritative state and replays inputs the server has not acknowledged yet.
import type { ResolvedLoadout } from '../content/loadout';
import type { SnapSelf } from '../protocol/codec';
import { PHASE_POST, PHASE_WARMUP } from '../protocol/messages';
import { cloneState, InputCmd, PlayerState, SimEvent, StepCtx, stepPlayer } from '../sim/player';
import type { World } from '../sim/world';

export interface PredictionStats { reconciles: number; snaps: number; maxError: number; lastError: number; pending: number; rttMs: number }

interface Pending { cmd: InputCmd; frozen: boolean }

export class Predictor {
  state: PlayerState | null = null;
  prev: PlayerState | null = null;
  pending: Pending[] = [];
  /** visual smoothing offset: rendered position = predicted + err (decays to zero) */
  errX = 0; errY = 0; errZ = 0;
  readonly stats: PredictionStats = { reconciles: 0, snaps: 0, maxError: 0, lastError: 0, pending: 0, rttMs: 0 };
  equipMult = 1;
  private ctx: StepCtx;
  private events: SimEvent[] = [];
  private replayCtx: StepCtx;
  private sent = new Float64Array(256);
  private rtt = -1;
  private phase: number = PHASE_WARMUP;
  private phaseLeft = 1e9;
  private phaseAt = 0;

  constructor(world: World, id: number, lo: ResolvedLoadout) {
    this.ctx = { world, lo, id, frozen: false, equipMult: 1, ev: this.events };
    this.replayCtx = { world, lo, id, frozen: false, equipMult: 1, ev: null };
  }

  setLoadout(lo: ResolvedLoadout): void { this.ctx.lo = lo; this.replayCtx.lo = lo; }
  get loadout(): ResolvedLoadout { return this.ctx.lo; }

  /** Latest authoritative phase clock (from a snapshot received at nowMs). */
  setPhase(phase: number, timeLeft: number, nowMs: number): void { this.phase = phase; this.phaseLeft = timeLeft; this.phaseAt = nowMs; }

  /**
   * Will the server still be in the pre-match freeze when it processes a command sent now? The server decides by
   * its own clock, so the client projects that clock forward by the measured round trip. This keeps the
   * warmup -> live hand-off free of rubber-banding even at high latency.
   */
  private frozenAt(nowMs: number): boolean {
    if (this.phase === PHASE_POST) return true;
    if (this.phase !== PHASE_WARMUP) return false;
    return this.phaseLeft - (nowMs - this.phaseAt + Math.max(0, this.rtt)) / 1000 > 0;
  }

  /** Apply one locally generated command immediately. Returns the simulation events for cosmetic feedback. */
  predict(cmd: InputCmd, nowMs: number): SimEvent[] {
    this.events.length = 0;
    if (!this.state) return this.events;
    const frozen = this.frozenAt(nowMs);
    this.sent[cmd.seq & 255] = nowMs;
    this.pending.push({ cmd, frozen });
    if (this.pending.length > 120) this.pending.shift();
    this.prev = cloneState(this.state);
    this.ctx.frozen = frozen; this.ctx.equipMult = this.equipMult;
    stepPlayer(this.state, cmd, this.ctx);
    this.stats.pending = this.pending.length;
    return this.events;
  }

  /** Rewind to the authoritative state and replay unacknowledged inputs. */
  reconcile(self: SnapSelf, ack: number, respawned: boolean, nowMs: number): void {
    let i = 0;
    while (i < this.pending.length && this.pending[i].cmd.seq <= ack) i++;
    if (i) {
      // round-trip sample from the newest acknowledged command (minimum-biased: snapshots add up to 50 ms)
      const sample = nowMs - this.sent[ack & 255];
      if (sample >= 0 && sample < 2000) this.rtt = this.rtt < 0 || sample < this.rtt ? sample : this.rtt + (sample - this.rtt) * 0.02;
      this.stats.rttMs = Math.max(0, this.rtt);
      this.pending.splice(0, i);
    }
    if (!self.alive) { this.state = null; this.prev = null; this.pending.length = 0; return; }
    const old = this.state;
    const s = cloneState(self.state);
    this.replayCtx.equipMult = this.equipMult;
    for (const p of this.pending) { this.replayCtx.frozen = p.frozen; stepPlayer(s, p.cmd, this.replayCtx); }
    this.state = s;
    if (!old || respawned) { this.errX = this.errY = this.errZ = 0; this.prev = cloneState(s); return; }
    const ex = old.px - s.px, ey = old.py - s.py, ez = old.pz - s.pz;
    const d = Math.hypot(ex, ey, ez);
    this.stats.lastError = d;
    if (d > 1e-4) {
      this.stats.reconciles++;
      if (d > this.stats.maxError) this.stats.maxError = d;
      if (d < 1.5) { this.errX += ex; this.errY += ey; this.errZ += ez; } // smooth small errors
      else { this.stats.snaps++; this.errX = this.errY = this.errZ = 0; } // snap large ones (debug metric)
      if (this.prev) { this.prev.px -= ex; this.prev.py -= ey; this.prev.pz -= ez; }
    }
  }

  /** Decay the visual correction offset (call once per rendered frame). */
  decay(dt: number): void {
    const k = Math.exp(-14 * dt);
    this.errX *= k; this.errY *= k; this.errZ *= k;
  }
}
