// Sidewalk pedestrians. They stroll along sidewalks near the player and leap clear of the taxi.
// No contact is ever simulated: a dodge + safety assist + penalty replaces impacts.

import { clamp, dist } from "../math";
import { Rng } from "../rng";
import type { World } from "../world/city";

export interface Ped {
  active: boolean;
  edge: number;
  side: number;
  s: number;
  dir: number;
  speed: number;
  x: number; z: number; y: number; yaw: number;
  hopT: number; // >0 while leaping
  hx: number; hz: number; // hop displacement direction
  ox: number; oz: number; // accumulated displacement from sidewalk line
  color: number;
  scared: number;
  phase: number;
}

export class Pedestrians {
  peds: Ped[] = [];
  private rng: Rng;
  target = 50;

  constructor(private world: World, seed: number, max = 80) {
    this.rng = new Rng(seed ^ 0x51a7);
    for (let i = 0; i < max; i++)
      this.peds.push({ active: false, edge: 0, side: 1, s: 0, dir: 1, speed: 1.3, x: 0, z: 0, y: 0, yaw: 0, hopT: 0, hx: 0, hz: 0, ox: 0, oz: 0, color: 0, scared: 0, phase: 0 });
  }

  private spawn(p: Ped, px: number, pz: number, initial: boolean) {
    for (let k = 0; k < 6; k++) {
      const e = this.world.edges[this.rng.int(0, this.world.edges.length)];
      if (e.kind === "highline") continue;
      const s = this.rng.range(0.12, 0.88) * e.length;
      const side = this.rng.chance(0.5) ? 1 : -1;
      const A = this.world.nodes[e.a];
      const off = (e.halfWidth + e.sidewalk * 0.5) * side;
      const x = A.x + e.dx * s + e.dz * off, z = A.z + e.dz * s - e.dx * off;
      const d = dist(x, z, px, pz);
      if (d > 170 || d < (initial ? 25 : 90)) continue;
      if (this.world.collidersHitCircle(x, z, 0.5, this.world.heightAt(x, z) + 1)) continue;
      if (this.world.pointNearCorridor(x, z, 1)) continue;
      Object.assign(p, {
        active: true, edge: e.id, side, s, dir: this.rng.chance(0.5) ? 1 : -1, speed: this.rng.range(1.0, 1.7),
        hopT: 0, ox: 0, oz: 0, color: this.rng.int(0, 12), scared: 0, phase: this.rng.range(0, 6.28),
      });
      this.place(p);
      return;
    }
  }

  private place(p: Ped) {
    const e = this.world.edges[p.edge];
    const A = this.world.nodes[e.a];
    const off = (e.halfWidth + e.sidewalk * 0.5) * p.side;
    p.x = A.x + e.dx * p.s + e.dz * off + p.ox;
    p.z = A.z + e.dz * p.s - e.dx * off + p.oz;
    p.y = this.world.heightAt(p.x, p.z);
  }

  fill(px: number, pz: number) {
    for (const p of this.peds) {
      if (this.activeCount() >= this.target) break;
      if (!p.active) this.spawn(p, px, pz, true);
    }
  }
  activeCount() {
    let n = 0;
    for (const p of this.peds) if (p.active) n++;
    return n;
  }

  /**
   * Step pedestrians. Returns the closest "danger" distance for the taxi's safety assist
   * (pedestrian within the taxi's swept path), or Infinity.
   */
  step(dt: number, taxi: { x: number; z: number; vx: number; vz: number; speed: number }, onDodge: (p: Ped) => void): number {
    let danger = Infinity;
    let spawned = 0;
    for (const p of this.peds) {
      if (!p.active) {
        if (spawned < 2 && this.activeCount() < this.target) {
          this.spawn(p, taxi.x, taxi.z, false);
          spawned++;
        }
        continue;
      }
      const d = dist(p.x, p.z, taxi.x, taxi.z);
      if (d > 200) {
        p.active = false;
        continue;
      }
      const e = this.world.edges[p.edge];
      p.phase += dt * p.speed * 5;
      if (p.hopT > 0) {
        p.hopT -= dt;
        p.ox += p.hx * dt * 6;
        p.oz += p.hz * dt * 6;
      } else {
        // drift back toward the sidewalk line slowly
        p.ox *= 1 - dt * 0.5;
        p.oz *= 1 - dt * 0.5;
        p.s += p.dir * p.speed * dt;
        if (p.s < 8 || p.s > e.length - 8) p.dir *= -1;
      }
      if (p.scared > 0) p.scared -= dt;
      this.place(p);
      p.yaw = p.hopT > 0 ? Math.atan2(p.hx, p.hz) : Math.atan2(e.dx * p.dir, e.dz * p.dir);
      // threat check: taxi approaching
      if (taxi.speed > 3 && d < 9) {
        const rx = p.x - taxi.x, rz = p.z - taxi.z;
        const fx = taxi.vx / taxi.speed, fz = taxi.vz / taxi.speed;
        const along = rx * fx + rz * fz;
        const lat = rx * fz - rz * fx;
        if (along > -1 && Math.abs(lat) < 2.6) {
          if (p.hopT <= 0 && p.scared <= 0) {
            const sgn = lat >= 0 ? 1 : -1;
            p.hx = fz * sgn;
            p.hz = -fx * sgn;
            p.hopT = 0.45;
            p.scared = 2.5;
            onDodge(p);
          }
          if (along > 0 && along < 6) danger = Math.min(danger, clamp(along, 0, 6));
        }
      }
    }
    return danger;
  }
}
