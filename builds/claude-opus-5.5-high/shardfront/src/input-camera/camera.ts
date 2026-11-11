// RTS camera: 55° pitch, 45° vertical FOV, eased zoom across a 24–68 height range. Easing uses
// unscaled render time so the camera stays responsive during simulation slowdown.
import type * as THREE from 'three';

export const PITCH = (55 * Math.PI) / 180;
export const MIN_H = 24, MAX_H = 68;

export class RTSCamera {
  x = 72; z = 72;           // ground focus point
  height = 42; targetHeight = 42;
  private goX: number | null = null; private goZ: number | null = null;
  bounds = { minX: 10, maxX: 134, minZ: 18, maxZ: 136 };

  zoom(delta: number) {
    this.targetHeight = Math.max(MIN_H, Math.min(MAX_H, this.targetHeight * (1 + delta)));
  }
  pan(dx: number, dz: number, dt: number, fast: boolean) {
    const speed = this.height * 1.15 * (fast ? 1.6 : 1);
    this.x += dx * speed * dt; this.z += dz * speed * dt;
    this.goX = this.goZ = null;
    this.clamp();
  }
  /** pan by a world-space offset (middle mouse drag) */
  panWorld(dx: number, dz: number) { this.x += dx; this.z += dz; this.goX = this.goZ = null; this.clamp(); }
  jumpTo(x: number, z: number, smooth = true) {
    if (smooth) { this.goX = x; this.goZ = z; } else { this.x = x; this.z = z; this.goX = this.goZ = null; }
    this.clamp();
  }
  clamp() {
    this.x = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, this.x));
    this.z = Math.max(this.bounds.minZ, Math.min(this.bounds.maxZ, this.z));
  }
  update(dt: number) {
    const k = 1 - Math.pow(0.0005, dt);
    this.height += (this.targetHeight - this.height) * k;
    if (this.goX !== null && this.goZ !== null) {
      this.x += (this.goX - this.x) * k; this.z += (this.goZ - this.z) * k;
      if (Math.abs(this.goX - this.x) < 0.05 && Math.abs(this.goZ - this.z) < 0.05) this.goX = this.goZ = null;
      this.clamp();
    }
  }
  apply(cam: THREE.PerspectiveCamera) {
    const back = this.height / Math.tan(PITCH);
    cam.position.set(this.x, this.height, this.z + back);
    cam.lookAt(this.x, 0, this.z);
    cam.fov = 45;
    cam.updateProjectionMatrix();
  }
}
