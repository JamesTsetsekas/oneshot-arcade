// client-runtime: snapshot buffer + interpolation for remote players and entities. Pure logic (testable headless).
// Remote state is rendered ~100 ms in the past (adaptive to jitter); brief extrapolation, then freeze - never teleport.
import { TICK_RATE } from '../content/tuning';
import { PF, SnapEntity, SnapPlayer, Snapshot } from '../protocol/codec';

export interface RemotePlayer {
  id: number; flags: number;
  x: number; y: number; z: number;
  yaw: number; pitch: number;
  weapon: number; health: number;
  vx: number; vz: number;
  present: boolean;
  stale: boolean;
}

const lerpAngle = (a: number, b: number, t: number): number => {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2; else if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
};

export class Interp {
  snaps: Snapshot[] = [];
  /** continuous estimate of the server tick at local time `baseTime` */
  private baseTick = 0;
  private baseTime = 0;
  private synced = false;
  private jitter = 0;
  delayTicks = 6;
  players = new Map<number, RemotePlayer>();
  entities: SnapEntity[] = [];
  snapshotAgeMs = 0;
  lastRecv = 0;

  push(s: Snapshot, nowMs: number): void {
    if (this.snaps.length && s.tick <= this.snaps[this.snaps.length - 1].tick) return; // out of order / duplicate
    this.snaps.push(s);
    if (this.snaps.length > 24) this.snaps.shift();
    this.lastRecv = nowMs;
    if (!this.synced) { this.baseTick = s.tick; this.baseTime = nowMs; this.synced = true; return; }
    const est = this.serverTick(nowMs);
    const err = s.tick - est;
    if (Math.abs(err) > 20) { this.baseTick = s.tick; this.baseTime = nowMs; this.jitter = 0; return; } // resync after a stall
    this.jitter += (Math.abs(err) - this.jitter) * 0.1;
    this.baseTick += err * 0.06;
    // adapt the interpolation delay to measured jitter (100 ms floor, 200 ms ceiling)
    const want = Math.min(12, Math.max(6, 6 + this.jitter * 2.5));
    this.delayTicks += (want - this.delayTicks) * 0.05;
  }

  serverTick(nowMs: number): number { return this.baseTick + ((nowMs - this.baseTime) / 1000) * TICK_RATE; }
  renderTick(nowMs: number): number { return this.serverTick(nowMs) - this.delayTicks; }
  latest(): Snapshot | null { return this.snaps.length ? this.snaps[this.snaps.length - 1] : null; }

  reset(): void { this.snaps.length = 0; this.synced = false; this.players.clear(); this.entities = []; this.delayTicks = 6; this.jitter = 0; }

  /** Compute interpolated remote state for the frame. */
  sample(nowMs: number): void {
    const n = this.snaps.length;
    this.snapshotAgeMs = nowMs - this.lastRecv;
    if (!n) return;
    const rt = this.renderTick(nowMs);
    let a = this.snaps[0], b = this.snaps[0];
    for (let i = n - 1; i >= 0; i--) {
      if (this.snaps[i].tick <= rt) { a = this.snaps[i]; b = this.snaps[Math.min(n - 1, i + 1)]; break; }
    }
    let t = b.tick > a.tick ? (rt - a.tick) / (b.tick - a.tick) : 0;
    let extra = 0;
    if (rt > b.tick) { extra = Math.min(6, rt - b.tick); t = 1; } // extrapolate at most 100 ms, then hold
    else t = Math.max(0, Math.min(1, t));
    const stale = rt - b.tick > 30;
    for (const p of this.players.values()) p.present = false;
    const prevOf = (id: number): SnapPlayer | undefined => { for (const q of a.players) if (q.id === id) return q; return undefined; };
    for (const q of b.players) {
      let r = this.players.get(q.id);
      if (!r) { r = { id: q.id, flags: 0, x: q.x, y: q.y, z: q.z, yaw: q.yaw, pitch: q.pitch, weapon: q.weapon, health: q.health, vx: 0, vz: 0, present: true, stale: false }; this.players.set(q.id, r); }
      const p0 = prevOf(q.id) ?? q;
      const dt = Math.max(1, b.tick - a.tick) / TICK_RATE;
      const teleport = Math.abs(q.x - p0.x) + Math.abs(q.z - p0.z) > 6 || ((q.flags ^ p0.flags) & PF.ALIVE) !== 0;
      const vx = teleport ? 0 : (q.x - p0.x) / dt, vz = teleport ? 0 : (q.z - p0.z) / dt, vy = teleport ? 0 : (q.y - p0.y) / dt;
      if (teleport) { r.x = q.x; r.y = q.y; r.z = q.z; r.yaw = q.yaw; r.pitch = q.pitch; }
      else {
        const ex = (extra / TICK_RATE);
        r.x = p0.x + (q.x - p0.x) * t + vx * ex;
        r.y = p0.y + (q.y - p0.y) * t + vy * ex;
        r.z = p0.z + (q.z - p0.z) * t + vz * ex;
        r.yaw = lerpAngle(p0.yaw, q.yaw, t);
        r.pitch = p0.pitch + (q.pitch - p0.pitch) * t;
      }
      r.vx = vx; r.vz = vz;
      r.flags = t > 0.5 ? q.flags : p0.flags;
      r.weapon = q.weapon; r.health = q.health;
      r.present = true; r.stale = stale;
    }
    // entities: interpolate matching ids, otherwise take the newest
    const out: SnapEntity[] = [];
    for (const e of b.entities) {
      let p0: SnapEntity | undefined;
      for (const q of a.entities) if (q.id === e.id && q.type === e.type) { p0 = q; break; }
      if (p0 && Math.abs(e.x - p0.x) + Math.abs(e.z - p0.z) + Math.abs(e.y - p0.y) < 12) {
        out.push({ ...e, x: p0.x + (e.x - p0.x) * t, y: p0.y + (e.y - p0.y) * t, z: p0.z + (e.z - p0.z) * t });
      } else out.push(e);
    }
    this.entities = out;
  }
}
