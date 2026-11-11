// Steering controller for AI drivers of full-physics vehicles (police, rivals, mission
// targets, civilians recovering after a collision). Produces the same controls a player
// would, so AI cars obey the same vehicle physics.

import { clamp, dist2, wrapAngle } from "../core/math";
import type { Vehicle, VehicleControls } from "./vehicle";

export interface DriveTarget {
  /** polyline (x,z pairs) to follow */
  route?: number[];
  /** direct pursuit target (overrides route when close) */
  chase?: { x: number; z: number; vx: number; vz: number } | null;
  maxSpeed: number;
  /** stop at the end of the route */
  arrive?: boolean;
  aggressive?: boolean;
  /** lateral offset to the right of the route (lane keeping) */
  laneOffset?: number;
}

export class DriveAI {
  idx = 0;
  stuck = 0;
  reverse = 0;
  reverseSteer = 0;
  lastRoute: number[] | undefined;
  done = false;

  setRoute(r: number[]) { this.lastRoute = r; this.idx = 0; this.done = false; }

  update(v: Vehicle, dt: number, t: DriveTarget, avoid: (x: number, z: number, dx: number, dz: number) => number): VehicleControls {
    const c: VehicleControls = { throttle: 0, brake: 0, steer: 0, handbrake: false };
    const fx = Math.sin(v.yaw), fz = Math.cos(v.yaw);
    const sp = v.fwdSpeed;

    // stuck recovery: reverse with opposite lock
    if (this.reverse > 0) {
      this.reverse -= dt;
      c.brake = 1; c.steer = this.reverseSteer;
      return c;
    }

    let tx: number, tz: number;
    let desired = t.maxSpeed;
    if (t.chase && (!t.route || dist2(v.x, v.z, t.chase.x, t.chase.z) < 40)) {
      const lead = clamp(dist2(v.x, v.z, t.chase.x, t.chase.z) / Math.max(5, Math.abs(sp)), 0, 1.5);
      tx = t.chase.x + t.chase.vx * lead * 0.6;
      tz = t.chase.z + t.chase.vz * lead * 0.6;
      const d = dist2(v.x, v.z, tx, tz);
      if (!t.aggressive && d < 12) desired = Math.min(desired, Math.hypot(t.chase.vx, t.chase.vz) + d * 0.3);
    } else if (t.route && t.route.length >= 4) {
      const r = t.route;
      if (r !== this.lastRoute) { this.lastRoute = r; this.idx = 0; this.done = false; }
      // advance index to the closest upcoming segment
      const n = r.length / 2;
      while (this.idx < n - 2) {
        const bx = r[(this.idx + 1) * 2], bz = r[(this.idx + 1) * 2 + 1];
        const ax = r[this.idx * 2], az = r[this.idx * 2 + 1];
        const sx = bx - ax, sz = bz - az;
        const proj = ((v.x - ax) * sx + (v.z - az) * sz) / Math.max(1e-6, sx * sx + sz * sz);
        if (proj > 1 || dist2(v.x, v.z, bx, bz) < 4) this.idx++;
        else break;
      }
      // lookahead point
      const look = clamp(Math.abs(sp) * 0.75, 7, 22);
      let rem = look;
      let px = v.x, pz = v.z;
      let k = this.idx;
      // start from projection on current segment
      {
        const ax = r[k * 2], az = r[k * 2 + 1], bx = r[k * 2 + 2], bz = r[k * 2 + 3];
        const sx = bx - ax, sz = bz - az;
        const L2 = Math.max(1e-6, sx * sx + sz * sz);
        const pr = clamp(((v.x - ax) * sx + (v.z - az) * sz) / L2, 0, 1);
        px = ax + sx * pr; pz = az + sz * pr;
      }
      while (k < n - 1) {
        const bx = r[k * 2 + 2], bz = r[k * 2 + 3];
        const d = dist2(px, pz, bx, bz);
        if (d >= rem) { px += ((bx - px) / d) * rem; pz += ((bz - pz) / d) * rem; rem = 0; break; }
        rem -= d; px = bx; pz = bz; k++;
      }
      tx = px; tz = pz;
      if (t.laneOffset) {
        const ax = r[Math.min(k, n - 2) * 2], az = r[Math.min(k, n - 2) * 2 + 1];
        const bx = r[Math.min(k, n - 2) * 2 + 2], bz = r[Math.min(k, n - 2) * 2 + 3];
        const L = Math.hypot(bx - ax, bz - az) || 1;
        tx += ((bz - az) / L) * t.laneOffset; tz += (-(bx - ax) / L) * t.laneOffset;
      }
      // corner speed: look at upcoming turn angle
      if (this.idx < n - 2) {
        const ax = r[this.idx * 2], az = r[this.idx * 2 + 1];
        const bx = r[this.idx * 2 + 2], bz = r[this.idx * 2 + 3];
        const cx = r[this.idx * 2 + 4], cz = r[this.idx * 2 + 5];
        const a1 = Math.atan2(bx - ax, bz - az), a2 = Math.atan2(cx - bx, cz - bz);
        const turn = Math.abs(wrapAngle(a2 - a1));
        const dCorner = dist2(v.x, v.z, bx, bz);
        if (turn > 0.5) {
          const vc = turn > 1.2 ? 9 : 14;
          const allowed = Math.sqrt(vc * vc + 2 * 6.5 * Math.max(0, dCorner - 6));
          desired = Math.min(desired, allowed);
        }
      }
      const ex = r[r.length - 2], ez = r[r.length - 1];
      const dEnd = dist2(v.x, v.z, ex, ez);
      if (t.arrive) {
        desired = Math.min(desired, Math.sqrt(2 * 5 * Math.max(0, dEnd - 3)));
        if (dEnd < 5) this.done = true;
      }
    } else {
      c.brake = 1;
      return c;
    }

    // steering: pure pursuit
    const dx = tx - v.x, dz = tz - v.z;
    const ang = wrapAngle(Math.atan2(dx, dz) - v.yaw);
    const ld = Math.max(3, Math.hypot(dx, dz));
    const steerAngle = Math.atan2(2 * v.spec.wheelbase * Math.sin(ang), ld);
    c.steer = clamp(steerAngle / (v.spec.maxSteer * 0.8), -1, 1);
    // target behind: tighter turn and slow down
    if (Math.abs(ang) > 1.6) { c.steer = Math.sign(ang); desired = Math.min(desired, 8); }

    // obstacle ahead
    const block = avoid(v.x + fx * 3, v.z + fz * 3, fx, fz);
    if (block < 14 && !t.aggressive) desired = Math.min(desired, Math.max(0, (block - 4) * 1.2));
    if (block < 9) c.steer = clamp(c.steer + 0.45 * (v.id % 2 ? 1 : -1), -1, 1);

    // longitudinal
    const err = desired - sp;
    if (err > 0.5) c.throttle = clamp(err / 6, 0.25, 1);
    else if (err < -1.5) c.brake = clamp(-err / 8, 0.2, 1);
    if (t.aggressive && Math.abs(ang) < 0.4) c.throttle = Math.max(c.throttle, 0.8);

    // stuck detection
    if ((c.throttle > 0.3) && Math.abs(sp) < 0.8) {
      this.stuck += dt;
      if (this.stuck > 1.6) {
        this.reverse = 1.4;
        this.reverseSteer = -Math.sign(c.steer || 1);
        this.stuck = 0;
      }
    } else this.stuck = Math.max(0, this.stuck - dt * 0.5);
    return c;
  }
}
