// Camera rig (pure math): third-person shoulder camera on foot and spring chase camera in
// vehicles, with world collision, speed FOV, free-look return, look-back and capped shake.

import { clamp, wrapAngle } from "../core/math";
import type { StaticWorld } from "../world/collision";
import type { Character } from "./character";
import type { Vehicle } from "./vehicle";

export type VehicleCamMode = "near" | "far" | "hood";

export class CameraRig {
  yaw = 0;
  pitch = -0.12;
  shoulder = 1;
  vehMode: VehicleCamMode = "near";
  freeLookYaw = 0;
  freeLookPitch = 0;
  freeLookT = 0;
  vehYaw = 0;
  aimBlend = 0;
  idleLook = 0;
  shake = 0;
  pos = { x: 0, y: 10, z: 0 };
  fwd = { x: 0, y: 0, z: 1 };
  target = { x: 0, y: 0, z: 0 };
  fov = 85;
  private dist = 3.2;
  baseFov = 85;
  reducedMotion = false;
  recenter = true;

  look(dx: number, dy: number, sens: number, invert: boolean, inVehicle: boolean) {
    const k = 0.0022 * sens;
    if (inVehicle) {
      if (Math.abs(dx) + Math.abs(dy) > 0.5) this.freeLookT = 1.6;
      this.freeLookYaw = clamp(this.freeLookYaw + dx * k, -2.6, 2.6);
      this.freeLookPitch = clamp(this.freeLookPitch + (invert ? -dy : dy) * -k, -0.5, 0.4);
    } else {
      this.yaw = wrapAngle(this.yaw + dx * k);
      this.pitch = clamp(this.pitch + (invert ? -dy : dy) * -k, -1.2, 1.0);
      if (Math.abs(dx) + Math.abs(dy) > 0.5) this.idleLook = 0;
    }
  }

  addShake(a: number) { if (!this.reducedMotion) this.shake = Math.min(0.18, this.shake + a); }

  update(dt: number, world: StaticWorld, p: Character, v: Vehicle | null, aiming: boolean, lookBack: boolean, t: number) {
    this.aimBlend += ((aiming && !v ? 1 : 0) - this.aimBlend) * Math.min(1, 12 * dt);
    let px: number, py: number, pz: number, fx: number, fy: number, fz: number, dist: number, side: number;
    if (!v) {
      // gentle recenter behind movement direction when idle-looking
      this.idleLook += dt;
      const mv = Math.hypot(p.vx, p.vz);
      if (this.recenter && mv > 2 && this.idleLook > 1.5 && !aiming) {
        const my = Math.atan2(p.vx, p.vz);
        this.yaw += wrapAngle(my - this.yaw) * Math.min(1, 0.8 * dt);
      }
      px = p.x; pz = p.z;
      py = p.y + (p.crouch ? 1.2 : 1.6) + 0.45 * (1 - this.aimBlend * 0.5);
      if (p.swimming) py = p.y + 1.5;
      const cp = Math.cos(this.pitch);
      fx = Math.sin(this.yaw) * cp; fy = Math.sin(this.pitch); fz = Math.cos(this.yaw) * cp;
      dist = 3.2 - this.aimBlend * 1.45;
      side = this.shoulder * (0.5 + this.aimBlend * 0.15);
      this.fov = this.baseFov * (1 - 0.26 * this.aimBlend);
      this.vehYaw = this.yaw;
      this.freeLookYaw = 0;
    } else {
      const s = v.spec;
      const sp = v.speed;
      // follow heading, bias toward velocity when sliding, preserve horizon in air
      let targetYaw = v.yaw;
      const fwdSp = v.fwdSpeed;
      if (sp > 4 && fwdSp > 0) {
        const vy = Math.atan2(v.vx, v.vz);
        targetYaw = v.yaw + wrapAngle(vy - v.yaw) * 0.45;
      } else if (fwdSp < -3) {
        targetYaw = v.yaw + wrapAngle(Math.atan2(-v.vx, -v.vz) - v.yaw) * 0.15;
      }
      this.vehYaw += wrapAngle(targetYaw - this.vehYaw) * Math.min(1, (v.airborne ? 1.2 : 4) * dt);
      if (this.freeLookT > 0) this.freeLookT -= dt;
      else { this.freeLookYaw *= 1 - Math.min(1, 3 * dt); this.freeLookPitch *= 1 - Math.min(1, 3 * dt); }
      const yaw = this.vehYaw + this.freeLookYaw + (lookBack ? Math.PI : 0);
      const pitch = -0.17 + this.freeLookPitch;
      const cp = Math.cos(pitch);
      fx = Math.sin(yaw) * cp; fy = Math.sin(pitch); fz = Math.cos(yaw) * cp;
      if (this.vehMode === "hood") {
        const hf = Math.sin(v.yaw), hz = Math.cos(v.yaw);
        const hy = this.vehYaw + this.freeLookYaw + (lookBack ? Math.PI : 0);
        this.pos = { x: v.x + hf * (s.moto ? 0.1 : 0.6), y: v.y + s.height * (s.moto ? 1.05 : 0.86) + 0.15, z: v.z + hz * (s.moto ? 0.1 : 0.6) };
        this.fwd = { x: Math.sin(hy) * Math.cos(-0.04), y: Math.sin(-0.04), z: Math.cos(hy) * Math.cos(-0.04) };
        this.fov = clamp(this.baseFov - 7 + sp * 0.35, 78, 98);
        this.target = { x: this.pos.x + this.fwd.x * 20, y: this.pos.y + this.fwd.y * 20, z: this.pos.z + this.fwd.z * 20 };
        this.yaw = hy;
        return;
      }
      px = v.x; pz = v.z; py = v.y + s.camHeight * 0.75;
      dist = s.camDist * (this.vehMode === "far" ? 1.45 : 1) + clamp(sp * 0.035, 0, 1.4);
      side = 0;
      this.fov = clamp(78 + (sp - 6) * 0.55, 78, 96) + (this.baseFov - 85) * 0.5;
      this.yaw = yaw;
      this.pitch = pitch;
    }
    // desired position behind the pivot
    const rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
    const ox = px + rx * side, oz = pz + rz * side;
    let dx = -fx * dist, dy = -fy * dist + (v ? 0.9 : 0), dz = -fz * dist;
    // collision: cast from pivot (shoulder) to the camera
    const hit = world.raycast(ox, py, oz, dx, dy, dz, 1, true);
    let tHit = 1;
    if (hit) tHit = Math.max(0.12, hit.t - 0.22 / Math.max(0.5, dist));
    if (tHit < this.curT) this.curT = tHit; else this.curT += (tHit - this.curT) * Math.min(1, 5 * dt);
    const tt = this.curT;
    dx *= tt; dy *= tt; dz *= tt;
    let sx = 0, sy = 0;
    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt * 0.6);
      sx = Math.sin(t * 61) * this.shake; sy = Math.cos(t * 47) * this.shake * 0.6;
    }
    this.pos = { x: ox + dx + sx, y: Math.max(py - 1.2, py + dy) + sy, z: oz + dz };
    this.fwd = { x: fx, y: fy, z: fz };
    this.target = { x: this.pos.x + fx * 30, y: this.pos.y + fy * 30, z: this.pos.z + fz * 30 };
  }

  private curT = 1;

  cycleVehicleCam() { this.vehMode = this.vehMode === "near" ? "far" : this.vehMode === "far" ? "hood" : "near"; }
}
