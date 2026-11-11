// Client-side netcode: input sequencing, local movement prediction with reconciliation,
// remote-entity interpolation, and event de-duplication. Free of rendering and DOM so it is unit-testable.
import { DT } from '../content/rules';
import type { CollisionWorld } from '../map/world';
import type { ClientCommand, GameEvent, InputCmd, MoveState, OwnState, PlayerSnap, ServerFrame, ViewState, WorldSnap } from '../protocol/types';
import { angleLerp, lerp } from '../shared/math';
import { copyMove, newMoveState, stepMove, type MoveCtx } from '../sim/movement';
import type { LoopbackTransport } from './transport';

export interface RemoteSample extends PlayerSnap {
  speed: number;
}

const INTERP_DELAY_TICKS = 3;

export class ClientSession {
  own: OwnState | null = null;
  view: ViewState | null = null;
  world: WorldSnap | null = null;
  /** predicted local movement state (only meaningful while alive and controlling ourselves) */
  predicted: MoveState = newMoveState();
  prevPredicted: MoveState = newMoveState();
  /** visual error left over from the last correction; decays quickly */
  errX = 0;
  errY = 0;
  errZ = 0;
  lastCorrection = 0;
  maxCorrection = 0;
  private pending: InputCmd[] = [];
  private seq = 0;
  private snaps: WorldSnap[] = [];
  /** estimated server tick (fractional), advanced locally between frames */
  serverTick = 0;
  private lastEventTick = -1;
  onEvent: (ev: GameEvent) => void = () => {};
  private hasPrediction = false;
  /** passive sessions only watch (attract mode / observers): no prediction, no control */
  passive = false;

  constructor(
    public transport: LoopbackTransport,
    public worldGeo: CollisionWorld,
    public playerId: number,
  ) {}

  get controlling(): boolean {
    return !this.passive && !!this.own && this.own.alive && !!this.view && this.view.id === this.playerId;
  }

  private ctx(): MoveCtx {
    const phase = this.world?.phase;
    return {
      maxSpeed: this.view ? this.view.maxSpeed : 5,
      frozen: this.view ? this.view.frozen : true,
      barriers: phase === 'buy' || phase === 'warmup',
    };
  }

  /** Remote players are rendered slightly in the past so there are always two snapshots to blend. */
  get renderTick(): number {
    return this.serverTick - INTERP_DELAY_TICKS;
  }

  /** Samples input for one fixed step: sends it and predicts its effect immediately. */
  sendInput(buttons: number, yaw: number, pitch: number): void {
    const cmd: InputCmd = { seq: ++this.seq, buttons, yaw, pitch, renderTick: this.renderTick };
    this.transport.sendUp({ t: 'input', cmd });
    copyMove(this.prevPredicted, this.predicted);
    if (this.controlling && this.hasPrediction) {
      this.pending.push(cmd);
      if (this.pending.length > 64) this.pending.shift();
      stepMove(this.worldGeo, this.predicted, cmd.buttons, cmd.yaw, this.ctx(), DT);
    }
    this.serverTick += 1;
    const k = 0.82;
    this.errX *= k;
    this.errY *= k;
    this.errZ *= k;
  }

  command(cmd: ClientCommand): void {
    this.transport.sendUp({ t: 'cmd', cmd });
  }

  onFrame(f: ServerFrame): void {
    this.own = f.own;
    this.view = f.view;
    if (f.tick > this.serverTick || this.serverTick - f.tick > 12) this.serverTick = f.tick;
    if (f.world) {
      this.world = f.world;
      this.snaps.push(f.world);
      if (this.snaps.length > 12) this.snaps.shift();
    }
    // events are delivered at most once even if a frame were to be replayed
    if (f.tick > this.lastEventTick) {
      this.lastEventTick = f.tick;
      for (const ev of f.events) this.onEvent(ev);
    }
    if (this.controlling && f.view) {
      // reconciliation: rewind to the authoritative state, replay unacknowledged inputs
      while (this.pending.length && this.pending[0].seq <= f.ack) this.pending.shift();
      const before = this.predicted;
      const bx = before.x;
      const by = before.y;
      const bz = before.z;
      const had = this.hasPrediction;
      copyMove(this.predicted, f.view.move);
      const ctx = this.ctx();
      for (const cmd of this.pending) stepMove(this.worldGeo, this.predicted, cmd.buttons, cmd.yaw, ctx, DT);
      if (had) {
        const dx = bx - this.predicted.x;
        const dy = by - this.predicted.y;
        const dz = bz - this.predicted.z;
        const d = Math.hypot(dx, dy, dz);
        // jumps beyond 1.5 m are authoritative teleports (respawn), not prediction error
        if (d < 1.5) {
          this.lastCorrection = d;
          if (d > this.maxCorrection) this.maxCorrection = d;
        }
        if (d > 0.0005 && d < 1.5) {
          // hide small corrections by blending them out visually; snap on large ones
          this.errX += dx;
          this.errY += dy;
          this.errZ += dz;
        }
      } else {
        copyMove(this.prevPredicted, this.predicted);
        this.errX = this.errY = this.errZ = 0;
      }
      this.hasPrediction = true;
    } else {
      this.hasPrediction = false;
      this.pending.length = 0;
      this.errX = this.errY = this.errZ = 0;
      if (f.view) {
        copyMove(this.prevPredicted, this.predicted);
        copyMove(this.predicted, f.view.move);
      }
    }
  }

  /** Smoothed local position for rendering: interpolates between fixed steps and bleeds off corrections. */
  localPosition(alpha: number, out: { x: number; y: number; z: number; crouch: number }): void {
    const a = this.prevPredicted;
    const b = this.predicted;
    out.x = lerp(a.x, b.x, alpha) + this.errX;
    out.y = lerp(a.y, b.y, alpha) + this.errY;
    out.z = lerp(a.z, b.z, alpha) + this.errZ;
    out.crouch = lerp(a.crouch, b.crouch, alpha);
  }

  private sampleOut: RemoteSample[] = [];

  /** Interpolated remote players at the render tick. */
  sampleRemotes(alpha: number): RemoteSample[] {
    const out = this.sampleOut;
    out.length = 0;
    const snaps = this.snaps;
    if (!snaps.length) return out;
    const rt = this.renderTick + alpha - 1;
    let a = snaps[0];
    let b = snaps[snaps.length - 1];
    for (let i = snaps.length - 1; i >= 0; i--) {
      if (snaps[i].tick <= rt) {
        a = snaps[i];
        b = snaps[Math.min(snaps.length - 1, i + 1)];
        break;
      }
    }
    const span = b.tick - a.tick;
    // never extrapolate more than two snapshots past the newest data
    const f = span > 0 ? Math.max(0, Math.min(1, (rt - a.tick) / span)) : 1;
    for (const pb of b.players) {
      let pa: PlayerSnap | undefined;
      for (const q of a.players)
        if (q.id === pb.id) {
          pa = q;
          break;
        }
      if (!pa) pa = pb;
      const dtk = Math.max(1, span) * DT;
      out.push({
        id: pb.id,
        x: lerp(pa.x, pb.x, f),
        y: lerp(pa.y, pb.y, f),
        z: lerp(pa.z, pb.z, f),
        yaw: angleLerp(pa.yaw, pb.yaw, f),
        pitch: lerp(pa.pitch, pb.pitch, f),
        crouch: lerp(pa.crouch, pb.crouch, f),
        item: pb.item,
        flags: pb.flags,
        speed: pa === pb ? 0 : Math.hypot(pb.x - pa.x, pb.z - pa.z) / dtk,
      });
    }
    return out;
  }
}
