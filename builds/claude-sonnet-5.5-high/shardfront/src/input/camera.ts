// input-camera: RTS camera. Fixed 55 degree pitch, eased wheel zoom across 24-68 world units of height, pan, edge scroll, optional 90 degree yaw.
import * as THREE from 'three';
import { heightAt, type GameMap } from '../sim/map';

export const CAM_PITCH = (55 * Math.PI) / 180;
export const CAM_FOV = 45;
export const ZOOM_MIN = 24;
export const ZOOM_MAX = 68;

export class RTSCamera {
  camera = new THREE.PerspectiveCamera(CAM_FOV, 16 / 9, 1, 400);
  tx = 64;
  tz = 64;
  height = 42;
  targetHeight = 42;
  yaw = 0;
  targetYaw = 0;
  vx = 0;
  vz = 0;
  allowRotate = false;
  private tmp = new THREE.Vector3();
  private ray = new THREE.Raycaster();
  /** returns true while any pan input is active (used to cancel focus tweens) */
  panning = false;
  jump: { x: number; z: number; t: number } | null = null;

  constructor(private map: GameMap) {
    this.apply();
  }

  setTarget(x: number, z: number, snap = true) {
    if (snap) { this.tx = x; this.tz = z; this.jump = null; } else this.jump = { x, z, t: 0 };
    this.clamp();
    this.apply();
  }

  zoomBy(wheelDelta: number) {
    const f = Math.exp(wheelDelta * 0.0012);
    this.targetHeight = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, this.targetHeight * f));
  }

  rotate(dir: number) {
    if (!this.allowRotate) return;
    this.targetYaw += (dir * Math.PI) / 2;
  }

  /** advance using UNSCALED render time so the camera stays responsive during simulation slowdown */
  update(dt: number, panX: number, panZ: number, fast: boolean) {
    const k = 1 - Math.exp(-dt * 10);
    this.height += (this.targetHeight - this.height) * k;
    this.yaw += (this.targetYaw - this.yaw) * (1 - Math.exp(-dt * 8));
    const speed = (this.height * 0.95) * (fast ? 1.6 : 1);
    const wantX = panX * speed, wantZ = panZ * speed;
    this.vx += (wantX - this.vx) * (1 - Math.exp(-dt * 14));
    this.vz += (wantZ - this.vz) * (1 - Math.exp(-dt * 14));
    // pan in camera-yaw space
    const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw);
    this.panning = panX !== 0 || panZ !== 0;
    if (this.panning) this.jump = null;
    this.tx += (this.vx * cy - this.vz * sy) * dt;
    this.tz += (this.vx * sy + this.vz * cy) * dt;
    if (this.jump) {
      const j = this.jump;
      const kk = 1 - Math.exp(-dt * 9);
      this.tx += (j.x - this.tx) * kk; this.tz += (j.z - this.tz) * kk;
      if (Math.hypot(j.x - this.tx, j.z - this.tz) < 0.2) this.jump = null;
    }
    this.clamp();
    this.apply();
  }

  clamp() {
    const N = this.map.size;
    const margin = 6 + (this.height - ZOOM_MIN) * 0.12;
    this.tx = Math.min(N - margin, Math.max(margin, this.tx));
    this.tz = Math.min(N - margin + 2, Math.max(margin - 2, this.tz));
  }

  apply() {
    const back = this.height / Math.tan(CAM_PITCH);
    const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw);
    const gy = heightAt(this.map, this.tx, this.tz) * 0.5;
    // camera sits "south" of the target (towards +z) rotated by yaw
    const ox = -sy * back, oz = cy * back;
    this.camera.position.set(this.tx + ox, gy + this.height, this.tz + oz);
    this.camera.lookAt(this.tx, gy, this.tz);
    this.camera.updateMatrixWorld();
  }

  resize(w: number, h: number) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  /** ground point under normalised device coords (-1..1), iterating against the height field */
  groundPoint(ndcX: number, ndcY: number, out: { x: number; z: number }): boolean {
    this.ray.setFromCamera({ x: ndcX, y: ndcY } as THREE.Vector2, this.camera);
    const o = this.ray.ray.origin, d = this.ray.ray.direction;
    if (d.y >= -0.01) return false;
    let h = 0;
    let px = 0, pz = 0;
    for (let i = 0; i < 4; i++) {
      const t = (h - o.y) / d.y;
      px = o.x + d.x * t; pz = o.z + d.z * t;
      h = heightAt(this.map, Math.min(this.map.size - 0.01, Math.max(0, px)), Math.min(this.map.size - 0.01, Math.max(0, pz)));
      if (Math.abs(h) < 0.001) break;
    }
    out.x = px; out.z = pz;
    return true;
  }

  project(x: number, y: number, z: number, w: number, h: number, out: { x: number; y: number; z: number }) {
    this.tmp.set(x, y, z).project(this.camera);
    out.x = (this.tmp.x * 0.5 + 0.5) * w;
    out.y = (-this.tmp.y * 0.5 + 0.5) * h;
    out.z = this.tmp.z;
  }
}
