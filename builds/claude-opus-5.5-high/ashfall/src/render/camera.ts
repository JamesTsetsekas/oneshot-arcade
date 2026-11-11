import { FreeCamera, Scene, Vector3 } from "@babylonjs/core";

export const CAM = { pitch: (38 * Math.PI) / 180, yaw: (45 * Math.PI) / 180, fov: (42 * Math.PI) / 180, dist: 18, zoomMin: 13, zoomMax: 24, bossMin: 16, lag: 0.07, lookahead: 1.2, maxSnap: 0.4, orbit: (25 * Math.PI) / 180 };

interface Shake { amp: number; t: number; dur: number; src: string }

/**
 * Fixed-angle isometric rig: 38° pitch, 45° yaw, 42° vertical FOV, 18 m default distance.
 * Soft 70 ms follow with ≤1.2 m movement anticipation and ≤0.4 m per-frame snap.
 * Shake is layered by source, capped, disabled by reduced motion, and never affects picking (pickCam stays unshaken).
 */
export class CameraRig {
  cam: FreeCamera;
  pickCam: FreeCamera;
  target = new Vector3();
  zoom = CAM.dist;
  zoomTarget = CAM.dist;
  yawOffset = 0;
  shakes: Shake[] = [];
  reducedMotion = false;
  shakeEnabled = true;
  private look = new Vector3();
  private t = 0;

  constructor(scene: Scene) {
    this.cam = new FreeCamera("cam", new Vector3(0, 20, -20), scene);
    this.cam.fov = CAM.fov;
    this.cam.minZ = 0.5;
    this.cam.maxZ = 160;
    this.cam.inputs.clear();
    this.pickCam = new FreeCamera("pickcam", new Vector3(0, 20, -20), scene);
    this.pickCam.fov = CAM.fov;
    this.pickCam.minZ = 0.5;
    this.pickCam.maxZ = 160;
    this.pickCam.inputs.clear();
    scene.activeCamera = this.cam;
  }

  snap(x: number, z: number) {
    this.target.set(x, 0, z);
    this.look.set(0, 0, 0);
  }

  wheel(delta: number) {
    this.zoomTarget = Math.max(CAM.zoomMin, Math.min(CAM.zoomMax, this.zoomTarget + delta * 0.012));
  }

  addShake(amp: number, dur: number, src: string) {
    if (!this.shakeEnabled || this.reducedMotion) return;
    // layered by source: a new shake from the same source replaces the weaker one
    const ex = this.shakes.find((s) => s.src === src);
    if (ex) { if (amp >= ex.amp * (1 - ex.t / ex.dur)) { ex.amp = amp; ex.t = 0; ex.dur = dur; } return; }
    this.shakes.push({ amp, t: 0, dur, src });
  }

  update(dt: number, px: number, pz: number, vx: number, vz: number, boss: { x: number; z: number } | null) {
    this.t += dt;
    // zoom easing (~120 ms)
    const minZoom = boss ? CAM.bossMin : CAM.zoomMin;
    const zt = Math.max(minZoom, this.zoomTarget);
    this.zoom += (zt - this.zoom) * Math.min(1, dt / 0.12);
    // anticipation
    const sp = Math.hypot(vx, vz);
    const want = sp > 0.2 ? Math.min(CAM.lookahead, sp * 0.25) : 0;
    const lx = sp > 0.2 ? (vx / sp) * want : 0, lz = sp > 0.2 ? (vz / sp) * want : 0;
    this.look.x += (lx - this.look.x) * Math.min(1, dt / 0.35);
    this.look.z += (lz - this.look.z) * Math.min(1, dt / 0.35);
    let tx = px + this.look.x, tz = pz + this.look.z;
    if (boss) {
      // bias framing toward the boss while keeping the player controllable
      const bx = boss.x - px, bz = boss.z - pz;
      const d = Math.hypot(bx, bz);
      const bias = Math.min(d * 0.3, 4);
      if (d > 0.1) { tx += (bx / d) * bias; tz += (bz / d) * bias; }
    }
    const k = 1 - Math.exp(-dt / CAM.lag);
    let dx = (tx - this.target.x) * k, dz = (tz - this.target.z) * k;
    const m = Math.hypot(dx, dz);
    if (m > CAM.maxSnap) { dx *= CAM.maxSnap / m; dz *= CAM.maxSnap / m; }
    // a large discontinuity (zone change / teleport) snaps immediately
    if (Math.hypot(tx - this.target.x, tz - this.target.z) > 12) { this.target.set(tx, 0, tz); dx = dz = 0; }
    this.target.x += dx; this.target.z += dz;

    const yaw = CAM.yaw + this.yawOffset;
    const off = new Vector3(-Math.sin(yaw) * Math.cos(CAM.pitch), Math.sin(CAM.pitch), -Math.cos(yaw) * Math.cos(CAM.pitch)).scale(this.zoom);
    const aim = this.target.add(new Vector3(0, 0.8, 0));
    const base = aim.add(off);
    this.pickCam.position.copyFrom(base);
    this.pickCam.setTarget(aim);
    // shake
    let sx = 0, sy = 0;
    for (const s of this.shakes) {
      s.t += dt;
      const f = Math.max(0, 1 - s.t / s.dur);
      const a = Math.min(0.5, s.amp) * f * f;
      sx += Math.sin(this.t * 61 + s.dur * 10) * a;
      sy += Math.cos(this.t * 53 + s.amp * 7) * a;
    }
    this.shakes = this.shakes.filter((s) => s.t < s.dur);
    const cap = 0.6;
    sx = Math.max(-cap, Math.min(cap, sx)); sy = Math.max(-cap, Math.min(cap, sy));
    this.cam.position.copyFrom(base);
    this.cam.position.x += sx; this.cam.position.y += sy * 0.6;
    this.cam.setTarget(aim.add(new Vector3(sx * 0.5, sy * 0.3, 0)));
  }
}
