// input-camera: RTS camera rig. Fixed 55° pitch, eased zoom across a 24-68 unit height range,
// pan speed scaled by zoom, clamped to the playable bounds. Driven by unscaled render time.
import * as THREE from 'three';
import { MAP_SIZE } from '../world/map';

export const CAM_MIN_H = 24;
export const CAM_MAX_H = 68;
const PITCH = (55 * Math.PI) / 180;
const BACK = 1 / Math.tan(PITCH);

export class CameraRig {
  readonly camera = new THREE.PerspectiveCamera(45, 16 / 9, 1, 600);
  tx = MAP_SIZE / 2;
  tz = MAP_SIZE / 2;
  /** eased follow target */
  goalX = MAP_SIZE / 2;
  goalZ = MAP_SIZE / 2;
  h = 40;
  hGoal = 40;
  groundY = 0;

  jump(x: number, z: number, instant = false): void {
    this.goalX = this.clamp(x); this.goalZ = this.clamp(z);
    if (instant) { this.tx = this.goalX; this.tz = this.goalZ; }
  }

  private clamp(v: number): number { return Math.min(MAP_SIZE - 5, Math.max(5, v)); }

  pan(dx: number, dz: number, dt: number, fast: boolean): void {
    const speed = 34 * (this.h / 44) * (fast ? 1.6 : 1);
    this.goalX = this.clamp(this.goalX + dx * speed * dt);
    this.goalZ = this.clamp(this.goalZ + dz * speed * dt);
  }

  /** drag-pan in world units */
  drag(dx: number, dz: number): void {
    this.goalX = this.clamp(this.goalX + dx); this.goalZ = this.clamp(this.goalZ + dz);
    this.tx = this.goalX; this.tz = this.goalZ;
  }

  zoom(delta: number): void {
    this.hGoal = Math.min(CAM_MAX_H, Math.max(CAM_MIN_H, this.hGoal * (1 + delta)));
  }

  update(dt: number, groundY: number, shake: number): void {
    const k = 1 - Math.exp(-dt * 14);
    this.tx += (this.goalX - this.tx) * k;
    this.tz += (this.goalZ - this.tz) * k;
    this.h += (this.hGoal - this.h) * (1 - Math.exp(-dt * 9));
    this.groundY += (groundY - this.groundY) * (1 - Math.exp(-dt * 5));
    const c = this.camera;
    const sx = shake > 0 ? (Math.random() - 0.5) * shake : 0, sy = shake > 0 ? (Math.random() - 0.5) * shake : 0;
    c.position.set(this.tx + sx, this.groundY + this.h + sy, this.tz + this.h * BACK);
    c.lookAt(this.tx + sx, this.groundY + sy, this.tz);
    c.updateMatrixWorld();
  }

  setAspect(a: number): void {
    this.camera.aspect = a;
    this.camera.updateProjectionMatrix();
  }
}
