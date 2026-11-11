// A simple pure-pursuit driver that follows the session's route guidance. Used by the automated
// tests (full fare loop), the traffic soak test, and the `?autopilot` capture/attract mode.
import { Session } from '../game-session/session';
import { InputFrame, NEUTRAL_INPUT } from '../vehicle/vehicle';
import { clamp, wrapAngle, lerp, clamp01 } from '../core/math';
import { DT } from '../physics/physicsWorld';

export class Autopilot {
  cruise = 21;
  private stuck = 0;
  private reverse = 0;
  private reverseSteer = 0;

  drive(s: Session): InputFrame {
    const v = s.vehicle;
    const tgt = s.guidePoint, final = s.guideTarget;
    if (!tgt || !final || s.phase === 'ended') return { ...NEUTRAL_INPUT, brake: 1 };
    const want = Math.atan2(tgt.x - v.pos.x, tgt.z - v.pos.z);
    const err = wrapAngle(want - v.yaw);
    const distFinal = Math.hypot(final.x - v.pos.x, final.z - v.pos.z);
    if (this.reverse > 0) {
      this.reverse -= DT;
      return { ...NEUTRAL_INPUT, brake: 1, steer: this.reverseSteer };
    }
    if (v.speed < 0.7 && distFinal > 9 && s.phase === 'running' && !s.fares.frozen) this.stuck += DT; else this.stuck = 0;
    if (this.stuck > 1.2) { this.stuck = 0; this.reverse = 1.4; this.reverseSteer = err > 0 ? -1 : 1; }
    let vmax = lerp(this.cruise, 8, clamp01((Math.abs(err) - 0.12) / 0.5));
    vmax = Math.min(vmax, Math.sqrt(2 * 5.5 * Math.max(0, distFinal - 2.2)) + 0.4);
    const steer = clamp(err * 2.2, -1, 1);
    const f = v.fwdSpeed;
    let throttle = f < vmax ? 1 : 0;
    let brake = f > vmax + 1.2 ? 1 : 0;
    if (distFinal < 2.6) { throttle = 0; brake = 1; }
    if (brake && f < 0.6) { brake = 0; if (distFinal < 6) throttle = 0; }
    return { throttle, brake, steer, handbrake: false, boost: false, reset: false };
  }
}
