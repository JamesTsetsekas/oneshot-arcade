// Aim geometry shared by the authoritative sim and the client camera, so the crosshair and the server's
// hit test are computed from the same ray.
import { CAMERA, MOVE } from "./content/rules";

/** Aim pivot: the camera sits on the line through this point along -aim. */
export function aimPivot(a: { x: number; y: number; z: number; yaw: number; crouch: boolean }, shoulder: number, out: { x: number; y: number; z: number }): void {
  const eye = a.crouch ? MOVE.eyeCrouch : MOVE.eye;
  out.x = a.x + Math.cos(a.yaw) * CAMERA.shoulder * shoulder;
  out.y = a.y + eye + CAMERA.height;
  out.z = a.z - Math.sin(a.yaw) * CAMERA.shoulder * shoulder;
}

export function aimDir(yaw: number, pitch: number, out: { x: number; y: number; z: number }): void {
  const cp = Math.cos(pitch);
  out.x = Math.sin(yaw) * cp;
  out.y = Math.sin(pitch);
  out.z = Math.cos(yaw) * cp;
}
