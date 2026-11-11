import { clamp, headingTo } from '../core/math';
import type { V2 } from '../core/math';
import type { Game } from './game';
import type { Vehicle } from './vehicle';
import { stepVehicle } from './vehicle';
import { isecPos } from './nav';
import { obstacleAhead, pointOnPath, pursueSteer, speedCommand } from './driver';

export interface ChaseState {
  vehicleId: number;
  tag: string;
  path: V2[];
  pathI: number;
  repathT: number;
  stuckT: number;
  recoverT: number;
  ram: boolean;
}

/** Road-graph pursuit used by scripted rivals (police have their own tier-aware variant). */
export class ChaseSystem {
  cars: ChaseState[] = [];

  add(v: Vehicle, tag: string): void {
    this.cars.push({ vehicleId: v.id, tag, path: [], pathI: 0, repathT: 0, stuckT: 0, recoverT: 0, ram: true });
  }

  removeTag(tag: string): void { this.cars = this.cars.filter((c) => c.tag !== tag); }

  update(g: Game, dt: number): void {
    const P = g.player.human;
    const pv = g.playerVehicle();
    for (const c of [...this.cars]) {
      const v = g.vehicleById(c.vehicleId);
      if (!v || !v.alive) { this.cars.splice(this.cars.indexOf(c), 1); continue; }
      c.repathT -= dt;
      const goal: V2 = { x: P.x, z: P.z };
      if (c.repathT <= 0) {
        c.repathT = 1.5;
        const a = g.roads.nearestIntersection(v.x, v.z);
        const snap = g.roads.roadSnap(goal.x, goal.z);
        const b = g.roads.nearestIntersection(snap.x, snap.z);
        c.path = g.roads.route(a, b).map((n) => isecPos(n));
        c.path.push(snap);
        c.pathI = 0;
      }
      while (c.pathI < c.path.length - 1 && Math.hypot(c.path[c.pathI].x - v.x, c.path[c.pathI].z - v.z) < 6) c.pathI++;
      const d = Math.hypot(goal.x - v.x, goal.z - v.z);
      const direct = d < 36 && g.world.lineOfSight(v.x, v.z, goal.x, goal.z, 0.5);
      const sp = Math.abs(v.speed);
      let tx: number; let tz: number;
      if (direct) { tx = goal.x; tz = goal.z; } else {
        const tp = pointOnPath(c.path, c.pathI, v.x, v.z, clamp(7 + sp * 0.55, 8, 22));
        tx = tp.x; tz = tp.z;
      }
      let vt = d < 18 && pv ? Math.max(Math.abs(pv.speed) + 3, 12) : 16;
      const ahead = c.path[Math.min(c.pathI + 1, c.path.length - 1)];
      if (ahead && !direct) {
        const hdg = headingTo(ahead.x - v.x, ahead.z - v.z);
        const turn = Math.abs(Math.atan2(Math.sin(hdg - v.heading), Math.cos(hdg - v.heading)));
        if (turn > 0.6) vt = Math.min(vt, 8 - Math.min(turn, 1.4) * 2.4);
      }
      const ob = obstacleAhead(g, v, v.heading, 8 + sp, v.def.width * 0.5 + 0.3);
      if (ob && ob.gap < 10 && !(pv && ob.kind === 'vehicle' && Math.hypot(pv.x - v.x, pv.z - v.z) < ob.gap + 6)) vt = Math.min(vt, Math.max(0, ob.speed + (ob.gap - 3) * 0.8));
      let throttle = speedCommand(v, vt);
      let steer = pursueSteer(v, tx, tz);
      if (c.recoverT > 0) { c.recoverT -= dt; throttle = -0.8; steer = -steer; }
      else if (sp < 0.6 && vt > 3) { c.stuckT += dt; if (c.stuckT > 2.2) { c.recoverT = 1.2; c.stuckT = 0; } } else c.stuckT = Math.max(0, c.stuckT - dt);
      if (v.health <= 0) throttle = 0;
      stepVehicle(v, { throttle, steer, handbrake: false }, dt, g.world.surfaceAt(v.x, v.z));
      v.lights = true;
    }
  }
}
