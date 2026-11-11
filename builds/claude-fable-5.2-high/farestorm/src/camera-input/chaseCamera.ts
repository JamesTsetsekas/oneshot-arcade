// Spring-arm chase camera: velocity-following yaw with lag, speed FOV, look-ahead, free look,
// geometry avoidance, capped drift tilt and short impulse shake.
import { TargetCamera, Vector3, Camera } from '@babylonjs/core';
import { V3, clamp, clamp01, lerp, damp, angleDelta, wrapAngle } from '../core/math';
import { ViewControls } from './input';

export type CameraMode = 'near' | 'far' | 'bumper';
export const CAMERA_MODES: CameraMode[] = ['near', 'far', 'bumper'];

export interface ChaseTarget {
  pos: V3;
  fwd: V3;
  up: V3;
  vel: V3;
  speed: number;
  fwdSpeed: number;
  slipAngle: number;
  airTime: number;
  boost: boolean;
}
export type RayFn = (ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, max: number) => number | null;

const DEG = Math.PI / 180;

export class ChaseCamera {
  mode: CameraMode = 'near';
  fovScale = 1;
  shakeScale = 1;
  reducedMotion = false;
  private yaw = 0;
  private look = 0;
  private lookPitch = 0;
  private lookIdle = 0;
  private reverseTime = 0;
  private pos = new Vector3();
  private tgt = new Vector3();
  private shake = 0;
  private shakeT = 0;
  private fov = 78 * DEG;
  private initialized = false;
  private extraDist = 0;
  /** World yaw the camera is looking along (used to orient the route vane towards the viewer). */
  viewYaw = 0;

  constructor(public camera: TargetCamera) {
    camera.fovMode = Camera.FOVMODE_HORIZONTAL_FIXED;
    camera.minZ = 0.35;
    camera.maxZ = 3200;
  }
  cycle(): CameraMode {
    this.mode = CAMERA_MODES[(CAMERA_MODES.indexOf(this.mode) + 1) % CAMERA_MODES.length];
    return this.mode;
  }
  addShake(amount: number): void {
    this.shake = Math.min(1.2, this.shake + amount);
  }
  snap(): void {
    this.initialized = false;
  }

  update(dt: number, t: ChaseTarget, view: ViewControls, ray: RayFn | null, groundY: (x: number, z: number) => number): void {
    const cam = this.camera;
    const heading = Math.atan2(t.fwd.x, t.fwd.z);
    // Desired yaw: follow velocity with a little heading bias; ease to a rear view when reversing.
    if (t.fwdSpeed < -2.5) this.reverseTime += dt; else this.reverseTime = Math.max(0, this.reverseTime - dt * 3);
    let want = heading;
    const hs = Math.hypot(t.vel.x, t.vel.z);
    if (hs > 4 && t.fwdSpeed > 0) {
      const vx = t.vel.x / hs, vz = t.vel.z / hs;
      want = Math.atan2(vx * 0.62 + t.fwd.x * 0.38, vz * 0.62 + t.fwd.z * 0.38);
    }
    if (this.reverseTime > 0.5) want = heading + Math.PI;
    if (!this.initialized) this.yaw = want;
    this.yaw = wrapAngle(this.yaw + angleDelta(this.yaw, want) * (1 - Math.exp(-dt * lerp(3.6, 6.5, clamp01(t.speed / 35)))));
    // Free look / glances / look back.
    let lookTarget = 0;
    if (view.lookBack) lookTarget = Math.PI;
    else if (view.glance) lookTarget = view.glance * 1.25;
    if (view.dragging && (view.lookX || view.lookY)) {
      this.look = clamp(this.look + view.lookX, -150 * DEG, 150 * DEG);
      this.lookPitch = clamp(this.lookPitch + view.lookY, -0.25, 0.6);
      this.lookIdle = 0;
    } else if (lookTarget !== 0) {
      this.look = damp(this.look, lookTarget, 14, dt);
      this.lookIdle = 0;
    } else {
      this.lookIdle += dt;
      if (!view.dragging && this.lookIdle > (Math.abs(this.look) > 2 ? 0.05 : 0.8)) { this.look = damp(this.look, 0, 7, dt); this.lookPitch = damp(this.lookPitch, 0, 7, dt); }
    }
    const speedK = clamp01(t.speed / 50);
    const targetFov = (lerp(78, 96, speedK) + (t.boost ? 5 : 0)) * DEG * this.fovScale;
    this.fov = damp(this.fov, targetFov, 4, dt);
    cam.fov = this.fov;

    if (this.mode === 'bumper') {
      const p = { x: t.pos.x + t.up.x * 0.98 + t.fwd.x * 0.55, y: t.pos.y + t.up.y * 0.98 + t.fwd.y * 0.55, z: t.pos.z + t.up.z * 0.98 + t.fwd.z * 0.55 };
      const yawB = heading + this.look;
      this.viewYaw = yawB;
      cam.position.set(p.x, p.y, p.z);
      cam.setTarget(new Vector3(p.x + Math.sin(yawB) * 10, p.y + t.fwd.y * 10 - this.lookPitch * 4, p.z + Math.cos(yawB) * 10));
      cam.rotation.z = 0;
      this.initialized = true;
      return;
    }
    const baseDist = this.mode === 'near' ? 6.2 : 9.6, baseH = this.mode === 'near' ? 2.5 : 3.9;
    this.extraDist = damp(this.extraDist, Math.min(3.2, Math.max(0, t.airTime - 0.25) * 3) + speedK * 0.9, 4, dt);
    const dist = baseDist + this.extraDist;
    const height = baseH - (t.boost ? 0.35 : 0) + this.lookPitch * 5;
    const yaw = this.yaw + this.look;
    this.viewYaw = yaw;
    const dx = Math.sin(yaw), dz = Math.cos(yaw);
    const fx = t.pos.x, fy = t.pos.y + 1.1, fz = t.pos.z;
    let px = fx - dx * dist, py = fy + height - 1.1, pz = fz - dz * dist;
    // Pull in when geometry is between the focus point and the camera.
    if (ray) {
      const rx = px - fx, ry = py - fy, rz = pz - fz;
      const rl = Math.hypot(rx, ry, rz);
      const hit = ray(fx, fy + 0.4, fz, rx / rl, ry / rl, rz / rl, rl + 0.4);
      if (hit !== null && hit < rl + 0.4) {
        const k = Math.max(1.6, hit - 0.5) / rl;
        px = fx + rx * k; py = fy + 0.4 + ry * k; pz = fz + rz * k;
      }
    }
    py = Math.max(py, groundY(px, pz) + 0.7);
    const la = lerp(3, 9, speedK);
    const tx = fx + dx * la, ty = fy + 0.35, tz = fz + dz * la;
    if (!this.initialized) { this.pos.set(px, py, pz); this.tgt.set(tx, ty, tz); this.initialized = true; }
    const kxz = 1 - Math.exp(-dt * 16), ky = 1 - Math.exp(-dt * 7);
    this.pos.x += (px - this.pos.x) * kxz; this.pos.z += (pz - this.pos.z) * kxz; this.pos.y += (py - this.pos.y) * ky;
    this.tgt.x += (tx - this.tgt.x) * kxz; this.tgt.z += (tz - this.tgt.z) * kxz; this.tgt.y += (ty - this.tgt.y) * ky;
    // Short impulse shake.
    this.shake *= Math.exp(-dt * 7);
    this.shakeT += dt;
    const sh = this.reducedMotion ? 0 : this.shake * this.shakeScale;
    const sx = Math.sin(this.shakeT * 61) * sh * 0.22, sy = Math.sin(this.shakeT * 79 + 1.3) * sh * 0.18;
    cam.position.set(this.pos.x + dz * sx, this.pos.y + sy, this.pos.z - dx * sx);
    cam.setTarget(new Vector3(this.tgt.x, this.tgt.y + sy * 0.5, this.tgt.z));
    cam.rotation.z = this.reducedMotion ? 0 : clamp(-t.slipAngle * 0.1, -0.07, 0.07) * (t.speed > 8 ? 1 : 0);
  }

  /** Slow orbit used behind the menus. */
  orbit(time: number, centre: V3, radius: number, height: number): void {
    const a = time * 0.05;
    this.camera.fov = 70 * DEG;
    this.camera.position.set(centre.x + Math.cos(a) * radius, centre.y + height, centre.z + Math.sin(a) * radius);
    this.camera.setTarget(new Vector3(centre.x, centre.y, centre.z));
    this.camera.rotation.z = 0;
    this.initialized = false;
  }
}
