// Chase camera rig: spring-arm follow with yaw lag, speed look-ahead and FOV, glances, free look,
// reverse view, collision pull-in, drift tilt, jump pull-back and short crash impulses.

import { Camera, FreeCamera, Vector3, type Scene } from "@babylonjs/core";
import { clamp, wrapAngle } from "../sim/math";
import type { World } from "../sim/world/city";

export interface CamView {
  x: number; y: number; z: number; yaw: number;
  vx: number; vz: number; speed: number; forward: number;
  drifting: boolean; driftAngle: number; airborne: boolean; boosting: boolean;
}

export interface CamControls {
  glance: number; // -1 left, 1 right, 0 none
  lookBack: boolean;
  freeYaw: number; // radians offset from mouse/right stick
  freeActive: boolean;
}

export interface CamSettings {
  shake: number; // 0..1
  reducedMotion: boolean;
  fovScale: number; // 0.85..1.15
}

export const CAM_MODES = ["Near chase", "Far chase", "Bumper"] as const;

export class CameraRig {
  cam: FreeCamera;
  mode = 0;
  private yaw = 0;
  private dist = 6.2;
  private glanceYaw = 0;
  private freeYaw = 0;
  private freeIdle = 0;
  private shakeAmp = 0;
  private shakeT = 0;
  private roll = 0;
  private fov = 78;
  private pullBack = 0;
  private reverseT = 0;
  private pos = new Vector3();
  private first = true;

  constructor(scene: Scene, private world: World) {
    this.cam = new FreeCamera("chase", new Vector3(0, 30, -30), scene);
    this.cam.fovMode = Camera.FOVMODE_HORIZONTAL_FIXED;
    this.cam.minZ = 0.25;
    this.cam.maxZ = 3200;
    this.cam.inputs.clear();
  }

  cycle() {
    this.mode = (this.mode + 1) % CAM_MODES.length;
  }
  impulse(strength: number) {
    this.shakeAmp = Math.min(1, this.shakeAmp + strength);
    this.shakeT = 0;
  }
  snap() {
    this.first = true;
  }

  update(dt: number, v: CamView, c: CamControls, s: CamSettings) {
    const sp = v.speed;
    const sf = clamp(sp / 45, 0, 1);
    // desired yaw: heading blended with velocity direction
    const velYaw = sp > 3 ? Math.atan2(v.vx, v.vz) : v.yaw;
    let desired = v.yaw + wrapAngle(velYaw - v.yaw) * (v.drifting ? 0.55 : 0.3);
    if (v.forward < -3) this.reverseT = Math.min(1, this.reverseT + dt * 0.8);
    else this.reverseT = Math.max(0, this.reverseT - dt * 2);
    if (v.forward < -0.5) desired = v.yaw;
    desired += Math.PI * this.reverseT * 0.85;
    if (this.first) this.yaw = desired;
    const lag = v.drifting ? 4.2 : 6;
    this.yaw += wrapAngle(desired - this.yaw) * Math.min(1, lag * dt);

    // glances and free look
    const glanceTarget = c.lookBack ? Math.PI : c.glance * 1.3;
    this.glanceYaw += (glanceTarget - this.glanceYaw) * Math.min(1, 12 * dt);
    if (c.freeActive) {
      this.freeYaw = clamp(c.freeYaw, -2.6, 2.6);
      this.freeIdle = 0;
    } else {
      this.freeIdle += dt;
      if (this.freeIdle > 0.8) this.freeYaw *= Math.exp(-5 * dt);
    }
    const yaw = this.yaw + this.glanceYaw + this.freeYaw;
    const fx = Math.sin(yaw), fz = Math.cos(yaw);

    const near = this.mode === 0, far = this.mode === 1, bumper = this.mode === 2;
    const baseDist = near ? 6.2 : far ? 9.0 : 0;
    const baseH = near ? 2.5 : far ? 3.5 : 1.15;
    this.pullBack += ((v.airborne ? 2.2 : 0) - this.pullBack) * Math.min(1, 3 * dt);
    const boostLow = v.boosting && !s.reducedMotion ? -0.35 : 0;
    const wantDist = bumper ? 0 : baseDist + sf * 1.2 + this.pullBack;
    this.dist += (wantDist - this.dist) * Math.min(1, 4 * dt);
    const tx = v.x, ty = v.y + 1.25, tz = v.z;
    const look = 3 + 6 * sf;
    let px: number, py: number, pz: number;
    if (bumper) {
      const hx = Math.sin(v.yaw + this.glanceYaw + this.freeYaw), hz = Math.cos(v.yaw + this.glanceYaw + this.freeYaw);
      px = v.x + Math.sin(v.yaw) * 0.6;
      pz = v.z + Math.cos(v.yaw) * 0.6;
      py = v.y + baseH;
      this.cam.position.set(px, py, pz);
      this.cam.setTarget(new Vector3(px + hx * 20, py - 0.4, pz + hz * 20));
    } else {
      let d = this.dist;
      const cx = tx - fx * d, cz = tz - fz * d;
      // pull in against geometry (sphere-cast approximation along the arm)
      const frac = this.world.segmentBlocked(tx, tz, cx, cz, ty + baseH * 0.6);
      if (frac < 1) d = Math.max(2.2, d * frac);
      px = tx - fx * d;
      pz = tz - fz * d;
      py = ty + baseH + this.pullBack * 0.4 + boostLow - 1.25 + 1.25 * 0;
      const ground = this.world.heightAt(px, pz) + 0.8;
      if (py < ground) py = ground;
      if (this.first) this.pos.set(px, py, pz);
      // spring the position a little for weight
      const k = Math.min(1, 14 * dt);
      this.pos.x += (px - this.pos.x) * k;
      this.pos.y += (py - this.pos.y) * Math.min(1, 8 * dt);
      this.pos.z += (pz - this.pos.z) * k;
      this.cam.position.copyFrom(this.pos);
      const lx = tx + Math.sin(this.yaw) * look * (c.lookBack || c.glance ? 0 : 1), lz = tz + Math.cos(this.yaw) * look * (c.lookBack || c.glance ? 0 : 1);
      this.cam.setTarget(new Vector3(lx, ty + 0.95, lz));
    }
    // shake (short decaying impulse)
    if (this.shakeAmp > 0.001 && s.shake > 0 && !s.reducedMotion) {
      this.shakeT += dt;
      const a = this.shakeAmp * s.shake * 0.35;
      this.cam.position.x += Math.sin(this.shakeT * 61) * a;
      this.cam.position.y += Math.sin(this.shakeT * 47 + 1) * a;
      this.shakeAmp *= Math.exp(-9 * dt);
    } else this.shakeAmp *= Math.exp(-9 * dt);

    // drift tilt (capped)
    const rollT = s.reducedMotion ? 0 : clamp(-v.driftAngle * 0.06, -0.045, 0.045);
    this.roll += (rollT - this.roll) * Math.min(1, 5 * dt);
    this.cam.upVector.set(Math.cos(yaw) * Math.sin(this.roll), Math.cos(this.roll), -Math.sin(yaw) * Math.sin(this.roll));

    const fovT = (s.reducedMotion ? 78 + 8 * sf : 78 + 18 * sf + (v.boosting ? 4 : 0)) * s.fovScale;
    this.fov += (fovT - this.fov) * Math.min(1, 3 * dt);
    this.cam.fov = (this.fov * Math.PI) / 180;
    this.first = false;
  }

  orbit(t: number, cx: number, cz: number, r: number, h: number) {
    const a = t * 0.05;
    this.cam.position.set(cx + Math.sin(a) * r, h, cz + Math.cos(a) * r);
    this.cam.upVector.set(0, 1, 0);
    this.cam.setTarget(new Vector3(cx, 18, cz));
    this.cam.fov = (70 * Math.PI) / 180;
    this.first = true;
  }
}
