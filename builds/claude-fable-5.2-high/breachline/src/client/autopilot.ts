// client-runtime: demo autopilot (only with ?demo=1). Drives the local player through the normal input path so
// automated browser checks and screenshots exercise the real prediction / server loop without Pointer Lock.
import { K17 } from '../content/k17';
import type { RosterEntry } from '../protocol/messages';
import { PF, SnapSelf } from '../protocol/codec';
import { eyeHeight } from '../sim/hitboxes';
import { NavGrid, NavPoint } from '../sim/nav';
import { BTN, PlayerState } from '../sim/player';
import type { World } from '../sim/world';
import type { Input, InputSample } from './input';
import type { Interp } from './interp';

export class Autopilot {
  private t = 0;
  private strafe = 1;
  private nav: NavGrid = NavGrid.bake(K17);
  private path: NavPoint[] = [];
  private pi = 0;
  private repath = 0;
  private lastX = 0;
  private lastZ = 0;
  private stuck = 0;
  /** 'fight' (default) plays the match; 'idle' / 'ads' / 'fire' hold a pose for viewmodel checks */
  pose: string = new URLSearchParams(location.search).get('ap') ?? 'fight';
  slot = Number(new URLSearchParams(location.search).get('slot') ?? 0);

  drive(input: Input, interp: Interp, st: PlayerState | null, team: number, roster: Map<number, RosterEntry>, world: World, self: SnapSelf | null): InputSample {
    this.t++;
    const out: InputSample = { mx: 0, mz: 0, buttons: 0, slot: 0 };
    if (!st || !self || !self.alive) { this.path = []; return out; }
    if (this.pose !== 'fight') {
      out.slot = this.slot;
      if (this.pose === 'ads' || this.pose === 'adsfire') out.buttons |= BTN.ADS;
      if ((this.pose === 'fire' || this.pose === 'adsfire') && this.t % 30 < 20) out.buttons |= BTN.FIRE;
      if (this.pose === 'reload' && this.t % 240 === 120) out.buttons |= BTN.RELOAD;
      if (this.pose === 'reload' && this.t % 240 < 30) out.buttons |= BTN.FIRE;
      if (this.pose === 'run') { out.mz = 1; out.buttons |= BTN.SPRINT; }
      if (this.pose === 'nade') { if (this.t % 400 === 60) out.buttons |= BTN.TACTICAL; if (this.t % 400 === 150) out.buttons |= BTN.LETHAL; if (this.t > 200 && this.t < 330) out.mz = -1; }
      return out;
    }
    const ex = st.px, ey = st.py + eyeHeight(st.crouchT), ez = st.pz;
    let vis: { x: number; y: number; z: number; d: number } | null = null;
    let near: { x: number; y: number; z: number; d: number } | null = null;
    for (const p of interp.players.values()) {
      const info = roster.get(p.id);
      if (!info || info.team === team || !p.present || !(p.flags & PF.ALIVE)) continue;
      const d = Math.hypot(p.x - ex, p.z - ez);
      if (!near || d < near.d) near = { x: p.x, y: p.y, z: p.z, d };
      if (d < 60 && world.visible(ex, ey, ez, p.x, p.y + 1.25, p.z) && (!vis || d < vis.d)) vis = { x: p.x, y: p.y + 1.2, z: p.z, d };
    }
    let wantYaw = input.yaw, wantPitch = 0;
    if (vis) {
      wantYaw = Math.atan2(vis.x - ex, vis.z - ez);
      wantPitch = Math.atan2(vis.y - ey, Math.max(0.5, vis.d));
      let dy = wantYaw - input.yaw;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      const onTarget = Math.abs(dy) < 0.03 + 0.45 / Math.max(2, vis.d);
      if (vis.d > 9) out.buttons |= BTN.ADS;
      if (onTarget && this.t % 36 < 26) out.buttons |= BTN.FIRE;
      if (this.t % 60 === 0) this.strafe = -this.strafe;
      out.mx = this.strafe * 0.6;
      out.mz = vis.d > 18 ? 0.7 : vis.d < 5 ? -0.5 : 0;
    } else {
      // walk the nav grid toward the closest known hostile (or the courtyard)
      if (this.t >= this.repath || this.pi >= this.path.length) {
        this.repath = this.t + 90;
        const goal = near ?? { x: 2, y: 0, z: 9, d: 0 };
        const a = this.nav.nearest(st.px, st.py, st.pz), b = this.nav.nearest(goal.x, goal.y, goal.z, 8);
        const nodes = this.nav.findPath(a, b);
        this.path = nodes ? this.nav.smooth(nodes) : [];
        this.pi = 0;
      }
      let wp = this.path[this.pi];
      while (wp && Math.hypot(wp.x - st.px, wp.z - st.pz) < 0.6 && this.pi < this.path.length - 1) wp = this.path[++this.pi];
      if (wp) {
        wantYaw = Math.atan2(wp.x - st.px, wp.z - st.pz);
        out.mz = 1;
        let dy = wantYaw - input.yaw;
        while (dy > Math.PI) dy -= Math.PI * 2;
        while (dy < -Math.PI) dy += Math.PI * 2;
        if (Math.abs(dy) < 0.5) out.buttons |= BTN.SPRINT; else out.mz = 0.4;
      }
      if (this.t % 30 === 0) {
        const moved = Math.hypot(st.px - this.lastX, st.pz - this.lastZ);
        this.lastX = st.px; this.lastZ = st.pz;
        this.stuck = moved < 0.5 ? this.stuck + 1 : 0;
        if (this.stuck > 1) { out.buttons |= BTN.JUMP; this.repath = 0; }
      }
    }
    let dy = wantYaw - input.yaw;
    while (dy > Math.PI) dy -= Math.PI * 2;
    while (dy < -Math.PI) dy += Math.PI * 2;
    input.yaw += dy * (vis ? 0.2 : 0.12);
    input.pitch += (wantPitch - input.kickPitch - input.pitch) * 0.22;
    const mag = st.slot ? st.mag1 : st.mag0;
    if (mag === 0) out.buttons &= ~BTN.FIRE;
    if (self.supports && this.t % 120 === 0) out.buttons |= BTN.SUPPORT;
    return out;
  }
}
