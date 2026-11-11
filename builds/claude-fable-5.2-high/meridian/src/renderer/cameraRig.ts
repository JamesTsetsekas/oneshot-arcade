// Third-person camera: shoulder camera on foot, spring chase camera in vehicles.
import { FreeCamera, Vector3 } from '@babylonjs/core';
import type { Sim } from '../game-session/sim';
import { RayHit } from '../physics/physics';
import { clamp, lerp, damp, angleDiff, DEG } from '../core/math';

export interface CamSettings { fov: number; sensitivity: number; invertY: boolean; reducedMotion: boolean; recenter: boolean; recenterDelay: number }
const _hit: RayHit = { dist: 0, nx: 0, ny: 0, nz: 0, body: null };

export class CameraRig {
  yaw = 0; pitch = -0.12; shoulder = 1; vehMode = 0; // 0 near, 1 far, 2 hood
  private boom = 3.2; private fov = 85; private sinceMouse = 99; private shake = 0; private shakeT = 0;
  private px = 0; private py = 0; private pz = 0; private init = false; lookBack = false;
  x = 0; y = 2; z = 0; dist = 3;
  constructor(public camera: FreeCamera) {}
  onMouse(dx: number, dy: number, s: CamSettings) {
    const k = 0.0022 * s.sensitivity;
    this.yaw += dx * k; this.pitch = clamp(this.pitch - dy * k * (s.invertY ? -1 : 1), -1.25, 1.1);
    this.sinceMouse = 0;
  }
  addShake(a: number) { this.shake = Math.min(1, this.shake + a); }
  snapBehind(yaw: number) { this.yaw = yaw; this.pitch = -0.12; this.init = false; }

  update(sim: Sim, alpha: number, dt: number, s: CamSettings) {
    const p = sim.player, v = p.vehicle, b = p.body;
    this.sinceMouse += dt; this.shake = Math.max(0, this.shake - dt * 2.2); this.shakeT += dt;
    let tx: number, ty: number, tz: number, boom: number, fov = s.fov, side = 0;
    if (v) {
      tx = lerp(v.px, v.x, alpha); ty = lerp(v.py, v.y, alpha); tz = lerp(v.pz, v.z, alpha);
      const base = v.spec.moto ? 4.9 : v.spec.cls === 'van' ? 7.6 : 6.2;
      boom = this.vehMode === 2 ? 0.01 : base * (this.vehMode === 1 ? 1.35 : 1);
      ty += this.vehMode === 2 ? v.spec.height * 0.86 : v.spec.height * 0.72 + 0.55;
      // return behind the vehicle after a delay without mouse input, looking along the velocity
      let heading = v.yaw;
      if (v.speedAbs > 4) heading += clamp(angleDiff(Math.atan2(v.vx, v.vz), v.yaw), -0.5, 0.5) * 0.5 * (v.speed < 0 ? 0 : 1);
      if (v.speed < -2.5 || this.lookBack) heading += Math.PI;
      if (s.recenter && (this.sinceMouse > s.recenterDelay || this.vehMode === 2) && !this.lookBack) {
        const rate = this.vehMode === 2 ? 14 : 2.2 + v.speedAbs * 0.12;
        this.yaw += angleDiff(heading, this.yaw) * damp(rate, dt);
        this.pitch += ((this.vehMode === 2 ? -0.04 : -0.17) - this.pitch) * damp(2, dt);
      } else if (this.lookBack) this.yaw += angleDiff(heading, this.yaw) * damp(14, dt);
      const f = clamp(v.speedAbs / (v.spec.topSpeed * 0.8), 0, 1);
      fov = s.reducedMotion ? 84 : lerp(78, 96, f * f * 0.6 + f * 0.4);
      if (this.vehMode === 2) { tx += Math.sin(v.yaw) * v.spec.length * 0.12; tz += Math.cos(v.yaw) * v.spec.length * 0.12; }
    } else {
      tx = lerp(b.px, b.x, alpha); ty = lerp(b.py, b.y, alpha) + (b.crouch ? 1.15 : b.state === 'swim' ? 1.5 : 1.58); tz = lerp(b.pz, b.z, alpha);
      boom = p.aiming ? 1.9 : 3.2; side = 0.45 * this.shoulder;
      if (p.aiming) fov *= 0.74;
      if (s.recenter && this.sinceMouse > Math.max(3, s.recenterDelay * 2) && b.speed2d > 3 && !p.aiming) this.yaw += angleDiff(b.yaw, this.yaw) * damp(0.9, dt);
    }
    if (!this.init) { this.px = tx; this.py = ty; this.pz = tz; this.init = true; }
    // light positional smoothing (stiffer on foot) keeps the image steady over kerbs and bumps
    const k = damp(v ? 18 : 30, dt);
    this.px += (tx - this.px) * k; this.pz += (tz - this.pz) * k; this.py += (ty - this.py) * damp(v ? 9 : 16, dt);
    if (Math.hypot(tx - this.px, tz - this.pz) > 6) { this.px = tx; this.py = ty; this.pz = tz; }
    this.boom += (boom - this.boom) * damp(10, dt);
    this.fov += (fov - this.fov) * damp(5, dt);
    const cp = Math.cos(this.pitch), dx = Math.sin(this.yaw) * cp, dy = Math.sin(this.pitch), dz = Math.cos(this.yaw) * cp;
    const rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
    let pvx = this.px + rx * side, pvy = this.py, pvz = this.pz + rz * side;
    // keep the shoulder offset out of walls
    if (side !== 0 && sim.phys.castWorld(this.px, this.py, this.pz, rx * Math.sign(side), 0, rz * Math.sign(side), Math.abs(side) + 0.25, _hit)) { const d = Math.max(0, _hit.dist - 0.25) * Math.sign(side); pvx = this.px + rx * d; pvz = this.pz + rz * d; }
    let dist = this.boom;
    if (dist > 0.05 && sim.phys.castWorld(pvx, pvy, pvz, -dx, -dy, -dz, dist + 0.3, _hit)) dist = Math.max(0.35, _hit.dist - 0.3);
    this.dist = v ? 9 : dist;
    let cx = pvx - dx * dist, cy = pvy - dy * dist, cz = pvz - dz * dist;
    if (!s.reducedMotion && this.shake > 0.01) {
      const a = Math.min(0.22, this.shake * 0.22); // capped
      cx += Math.sin(this.shakeT * 47) * a; cy += Math.sin(this.shakeT * 61 + 1) * a * 0.7; cz += Math.cos(this.shakeT * 53) * a;
    }
    this.x = cx; this.y = cy; this.z = cz;
    this.camera.position.set(cx, cy, cz);
    this.camera.setTarget(new Vector3(cx + dx, cy + dy + p.recoil * 0.6, cz + dz));
    this.camera.fov = this.fov * DEG;
    // feed the simulation: aim ray + visibility tests
    const i = sim.input;
    i.camYaw = this.yaw; i.camPitch = this.pitch + p.recoil * 0.6; i.camX = cx; i.camY = cy; i.camZ = cz;
    sim.view.external = true; sim.view.x = cx; sim.view.y = cy; sim.view.z = cz; sim.view.fx = Math.sin(this.yaw); sim.view.fz = Math.cos(this.yaw);
  }
}
