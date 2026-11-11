import { clamp, damp, dampAngle, fwd, lerp, wrapAngle } from '../core/math';
import type { Game } from './game';

export interface CamPose { x: number; y: number; z: number; tx: number; ty: number; tz: number; hfov: number }

/** Pure camera rig living in the sim so aim rays and rendering share one source of truth. */
export class CameraRig {
  pose: CamPose = { x: 0, y: 3, z: -6, tx: 0, ty: 1.5, tz: 0, hfov: 85 };
  vehicleMode = 0; // 0 near, 1 far, 2 hood
  baseFov = 85;
  private lastLookT = -99;
  private distSm = 3.2;
  private fovSm = 85;
  private yawSm = 0;
  private lookBack = false;
  shake = 0;
  reducedMotion = false;

  cycleVehicleMode(): void { this.vehicleMode = (this.vehicleMode + 1) % 3; }

  /** Direction the camera is looking (unit). */
  dir(): { x: number; y: number; z: number } {
    const dx = this.pose.tx - this.pose.x;
    const dy = this.pose.ty - this.pose.y;
    const dz = this.pose.tz - this.pose.z;
    const l = Math.hypot(dx, dy, dz) || 1;
    return { x: dx / l, y: dy / l, z: dz / l };
  }

  update(g: Game, dt: number, lookDX: number, lookBack: boolean): void {
    const P = g.player;
    const veh = g.playerVehicle();
    this.lookBack = lookBack;
    if (Math.abs(lookDX) > 0.0005) this.lastLookT = g.t;
    if (!veh || P.enterT > 0) this.updateFoot(g, dt);
    else this.updateVehicle(g, dt, veh);
    if (this.shake > 0) {
      const s = this.reducedMotion ? 0 : this.shake;
      this.pose.x += (Math.random() - 0.5) * 0.08 * s;
      this.pose.y += (Math.random() - 0.5) * 0.08 * s;
      this.shake = Math.max(0, this.shake - dt * 3);
    }
  }

  private updateFoot(g: Game, dt: number): void {
    const P = g.player;
    const h = P.human;
    const aiming = P.aiming;
    const targetDist = aiming ? 2.2 : P.stamina < 8 && g.sprintingNow ? 3.4 : 3.2;
    this.distSm = damp(this.distSm, targetDist, 8, dt);
    const fovTarget = aiming ? this.baseFov - 17 : this.baseFov + (g.sprintingNow ? 4 : 0);
    this.fovSm = damp(this.fovSm, fovTarget, 7, dt);
    const yaw = P.camYaw;
    const pitch = P.camPitch;
    const f = { x: Math.sin(yaw) * Math.cos(pitch), y: -Math.sin(pitch), z: Math.cos(yaw) * Math.cos(pitch) };
    const rx = Math.cos(yaw);
    const rz = -Math.sin(yaw);
    const pivotH = (h.swimming ? 0.2 : 0) + (P.human.crouch ? 1.1 : 1.55) + h.y;
    const shoulder = (aiming ? 0.55 : 0.45) * P.shoulder;
    const px = h.x + rx * shoulder;
    const pz = h.z + rz * shoulder;
    const py = pivotH + 0.0;
    // desired camera position behind the pivot along the view direction
    let dist = this.distSm;
    const dxz = Math.hypot(f.x, f.z) || 1;
    // sphere-cast approximation: ray from pivot backwards, shortened on hit
    const hit = g.world.raycast(px, pz, -f.x / dxz, -f.z / dxz, dist + 0.3, py, -f.y / dxz, 0);
    if (hit) dist = Math.max(1.1, hit.t - 0.3);
    this.pose.x = px - f.x * dist;
    this.pose.z = pz - f.z * dist;
    this.pose.y = Math.max(0.35, py - f.y * dist + 0.0);
    // look target far ahead along the camera ray
    this.pose.tx = this.pose.x + f.x * 30;
    this.pose.ty = this.pose.y + f.y * 30;
    this.pose.tz = this.pose.z + f.z * 30;
    this.pose.hfov = this.fovSm;
    void lerp; void wrapAngle; void fwd; void clamp;
  }

  private updateVehicle(g: Game, dt: number, v: import('./vehicle').Vehicle): void {
    const P = g.player;
    const d = v.def;
    const speed = Math.hypot(v.vx, v.vz);
    const velHeading = speed > 3 ? Math.atan2(v.vx, v.vz) : v.heading;
    const bikeMul = d.kind === 'bike' ? 0.82 : d.kind === 'van' ? 1.2 : 1;
    const dist = (this.vehicleMode === 1 ? 8 : 5.6) * bikeMul + speed * 0.025;
    const idleLook = g.t - this.lastLookT > 1.6;
    // free-look returns behind the vehicle after a delay
    let target = v.speed < -2 ? velHeading + Math.PI : lerpAngle(v.heading, velHeading, 0.5);
    if (this.lookBack) target += Math.PI;
    if (idleLook || this.lookBack) P.camYaw = dampAngle(P.camYaw, target, this.lookBack ? 14 : 2.6, dt);
    this.fovSm = damp(this.fovSm, this.baseFov - 7 + clamp(speed / d.topSpeed, 0, 1) * 18, 3, dt);
    const yaw = P.camYaw;
    const pitch = clamp(P.camPitch * 0.4 + 0.22, 0.05, 0.6);
    const f = { x: Math.sin(yaw), z: Math.cos(yaw) };
    if (this.vehicleMode === 2) {
      // hood camera: cosmetic only
      const hf = fwd(v.heading);
      this.pose.x = v.x + hf.x * (d.length * 0.18);
      this.pose.z = v.z + hf.z * (d.length * 0.18);
      this.pose.y = d.height * 0.78 + (d.kind === 'bike' ? 0.45 : 0);
      this.pose.tx = this.pose.x + hf.x * 20;
      this.pose.tz = this.pose.z + hf.z * 20;
      this.pose.ty = this.pose.y - 0.4 + P.camPitch * -5;
      this.pose.hfov = this.fovSm + 6;
      return;
    }
    let dd = dist;
    const hit = g.world.raycast(v.x, v.z, -f.x, -f.z, dd + 0.4, 1.6, 0, 0);
    if (hit) dd = Math.max(2.2, hit.t - 0.5);
    this.distSm = damp(this.distSm, dd, 6, dt);
    const lookAhead = clamp(speed * 0.12, 0, 4);
    const vf = fwd(velHeading);
    const cx = v.x - f.x * this.distSm * Math.cos(pitch) + vf.x * lookAhead * 0.0;
    const cz = v.z - f.z * this.distSm * Math.cos(pitch);
    this.pose.x = cx;
    this.pose.z = cz;
    this.pose.y = Math.max(0.8, 1.2 + this.distSm * Math.sin(pitch) + d.height * 0.5);
    this.pose.tx = v.x + vf.x * lookAhead;
    this.pose.tz = v.z + vf.z * lookAhead;
    this.pose.ty = d.height * 0.7;
    this.pose.hfov = this.fovSm;
    this.yawSm = yaw;
  }
}

function lerpAngle(a: number, b: number, t: number): number {
  return a + wrapAngle(b - a) * t;
}
