import * as THREE from 'three';
import { clamp, damp, wrapAngle } from '../sim/math';
import type { VehicleState } from '../sim/vehicle';
import type { World } from '../sim/world';

export type CamMode = 'near' | 'far' | 'bumper';

/**
 * Chase camera: spring arm that follows velocity with yaw lag, looks ahead by speed, widens FOV,
 * tilts into drifts, shakes briefly on impacts and pushes itself out of buildings.
 */
export class ChaseCamera {
  readonly cam = new THREE.PerspectiveCamera(78, 16 / 9, 0.3, 2600);
  mode: CamMode = 'near';
  yaw = 0;
  pos = new THREE.Vector3();
  private look = new THREE.Vector3();
  private shake = 0;
  private shakeT = 0;
  private roll = 0;
  private lookBack = false;
  reducedMotion = false;
  shakeScale = 1;
  fovBase = 78;
  private init = false;

  reset(): void {
    this.init = false;
  }
  cycle(): CamMode {
    this.mode = this.mode === 'near' ? 'far' : this.mode === 'far' ? 'bumper' : 'near';
    return this.mode;
  }
  impulse(amount: number): void {
    this.shake = Math.min(1, this.shake + amount);
  }
  setLookBack(b: boolean): void {
    this.lookBack = b;
  }

  update(v: VehicleState, alpha: number, dt: number, world: World, boosting: boolean, countdown = false): void {
    const x = v.px + (v.x - v.px) * alpha;
    const z = v.pz + (v.z - v.pz) * alpha;
    const y = v.py + (v.y - v.py) * alpha;
    let dh = v.h - v.ph;
    dh = wrapAngle(dh);
    const h = v.ph + dh * alpha;
    const speed = v.speed;
    const sf = clamp(speed / 45, 0, 1);

    // target yaw: blend heading with velocity direction so slides stay readable
    let targetYaw = h;
    if (speed > 6 && v.fwd > 0) {
      const velYaw = Math.atan2(v.vx, v.vz);
      targetYaw = h + wrapAngle(velYaw - h) * (v.drifting ? 0.55 : 0.3);
    } else if (v.fwd < -2) {
      targetYaw = h + Math.PI; // reverse: ease toward the rear view
      targetYaw = this.yaw + wrapAngle(targetYaw - this.yaw) * 0.25;
    }
    if (this.lookBack) targetYaw = h + Math.PI;
    if (!this.init) { this.yaw = h; }
    this.yaw = wrapAngle(this.yaw + wrapAngle(targetYaw - this.yaw) * (1 - Math.exp(-(this.lookBack ? 16 : countdown ? 3 : 5.5) * dt)));

    const dist = this.mode === 'near' ? 6.2 : this.mode === 'far' ? 9.6 : 0.4;
    const up = this.mode === 'near' ? 2.5 : this.mode === 'far' ? 3.8 : 1.15;
    const pull = clamp(v.airborne ? v.airTime * 1.2 : 0, 0, 1.6);
    const back = dist + sf * (this.mode === 'bumper' ? 0 : 1.2) + pull;
    const dirX = Math.sin(this.yaw), dirZ = Math.cos(this.yaw);
    const lowerBoost = boosting && !this.reducedMotion ? 0.35 : 0;
    let tx = x - dirX * back;
    let tz = z - dirZ * back;
    const ty = y + up - lowerBoost + (this.mode === 'bumper' ? 0 : sf * 0.3);

    // sphere-cast approximation: pull the arm in until it clears geometry
    if (this.mode !== 'bumper') {
      for (let k = 0; k < 8; k++) {
        const hit = world.hitTest(tx, tz, 1.4);
        if (!hit || ty > 40) break;
        tx += hit.nx * (hit.pen + 0.1);
        tz += hit.nz * (hit.pen + 0.1);
        // never end up behind the car's own position relative to the arm direction
      }
      // if still inside after nudging, slide the camera toward the car
      const hit2 = world.hitTest(tx, tz, 0.9);
      if (hit2) { tx = x - dirX * 2.2; tz = z - dirZ * 2.2; }
    }

    const k = this.init ? 1 - Math.exp(-(this.lookBack ? 20 : 11) * dt) : 1;
    this.pos.x += (tx - this.pos.x) * k;
    this.pos.y += (ty - this.pos.y) * (this.init ? 1 - Math.exp(-9 * dt) : 1);
    this.pos.z += (tz - this.pos.z) * k;
    this.init = true;

    const ahead = this.mode === 'bumper' ? 12 : 3 + 6 * sf;
    this.look.set(x + dirX * ahead, y + (this.mode === 'bumper' ? 1.0 : 1.2), z + dirZ * ahead);

    // shake: short decaying impulse only
    this.shakeT += dt * 60;
    const sh = this.reducedMotion ? 0 : this.shake * this.shakeScale;
    const ox = Math.sin(this.shakeT * 1.9) * sh * 0.35, oy = Math.cos(this.shakeT * 2.3) * sh * 0.25;
    this.shake = damp(this.shake, 0, 7, dt);

    this.cam.position.set(this.pos.x + ox, this.pos.y + oy, this.pos.z);
    this.cam.up.set(0, 1, 0);
    this.cam.lookAt(this.look);
    // drift tilt (reduced-motion compatible)
    const targetRoll = this.reducedMotion ? 0 : clamp(-v.slip * 0.12, -0.08, 0.08) * (v.drifting ? 1.2 : 0.6);
    this.roll = damp(this.roll, targetRoll, 6, dt);
    this.cam.rotateZ(this.roll);

    const fovT = this.fovBase + (this.reducedMotion ? 4 : 18) * sf + (boosting && !this.reducedMotion ? 5 : 0);
    this.cam.fov = damp(this.cam.fov, fovT, 5, dt);
    this.cam.updateProjectionMatrix();
  }
}
