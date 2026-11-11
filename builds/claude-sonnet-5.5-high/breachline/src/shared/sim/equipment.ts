// Lethal and tactical equipment: fixed-step projectile physics, fuse/cook, mines, flash, obscurant, signal dart.
import type { World } from "./world";
import { aimDir, eyePos, bodyHeight } from "./world";
import { EQUIPMENT, type EquipKind } from "../content/gear";
import type { InputCmd } from "../protocol";
import type { PlayerState, Projectile } from "./types";
import { clamp, clamp01, cloneV, dist2D, v3, type Vec3 } from "../math";
import { CollisionWorld } from "./collision";

const GRAVITY = 18;
const PROJ_HALF = 0.08;
const PROJ_H = 0.16;

export class EquipmentSystem {
  constructor(private w: World) {}

  handleInput(p: PlayerState, cmd: InputCmd): void {
    const w = this.w;
    // lethal: press to start cook, release to throw
    if (cmd.lethal && !p.cooking && p.equip.lethal > 0 && p.swapT <= 0 && !p.mantle) {
      const def = EQUIPMENT[p.loadout.lethal];
      p.cooking = { since: w.time, kind: def.id };
      p.sprinting = false; p.sprintHold = 0;
    }
    if (p.cooking) {
      const def = EQUIPMENT[p.cooking.kind];
      const held = cmd.lethalHeld;
      const cooked = w.time - p.cooking.since;
      if (def.id === "frag" && cooked >= def.fuse - 0.05) {
        // cooked too long: detonates in hand
        p.cooking = null; p.equip.lethal--;
        this.explode("frag", p.pos.x, p.pos.y + 1, p.pos.z, p.id, p.team, def.radius, def.damage, null);
        return;
      }
      if (!held) {
        const since = p.cooking.since;
        p.cooking = null;
        if (def.id === "mine") this.plantMine(p);
        else this.throwProjectile(p, def.id, since);
      }
    }
    if (cmd.tactical && p.equip.tactical > 0 && p.swapT <= 0 && !p.mantle && !p.cooking) {
      this.throwProjectile(p, p.loadout.tactical as EquipKind, w.time);
      p.equip.tactical--;
    }
  }

  private spawnProjectile(kind: EquipKind, owner: PlayerState, pos: Vec3, vel: Vec3, fuse: number): Projectile {
    const pr: Projectile = {
      id: this.w.nextEntityId++, kind, owner: owner.id, team: owner.team, pos, vel, born: this.w.time, fuseAt: this.w.time + fuse,
      stuck: false, stuckTo: -1, stuckOffset: v3(), normal: v3(0, 1, 0), armAt: 0, alive: true, pulses: 0, nextPulse: 0, rolling: false,
    };
    this.w.projectiles.push(pr);
    return pr;
  }

  private throwProjectile(p: PlayerState, kind: EquipKind, cookStart: number): void {
    const w = this.w;
    const def = EQUIPMENT[kind];
    const eye = eyePos(p);
    const d = aimDir({ ...p, recoilP: 0, recoilY: 0 } as PlayerState);
    const pos = { x: eye.x + d.x * 0.45, y: eye.y - 0.12 + d.y * 0.45, z: eye.z + d.z * 0.45 };
    const speed = kind === "dart" ? 18 : 17;
    const vel = { x: d.x * speed + p.vel.x * 0.4, y: d.y * speed + 2.6, z: d.z * speed + p.vel.z * 0.4 };
    // avoid spawning inside geometry: pull back to eye if blocked
    if (w.col.blocked(pos.x, pos.y - PROJ_H / 2, pos.z, PROJ_HALF, PROJ_H)) { pos.x = eye.x; pos.y = eye.y - 0.2; pos.z = eye.z; }
    let fuse = def.fuse;
    if (kind === "frag") fuse = Math.max(0.15, def.fuse - (w.time - cookStart));
    const pr = this.spawnProjectile(kind, p, pos, vel, fuse);
    if (kind === "adhesive" || kind === "dart") pr.fuseAt = w.time + (kind === "adhesive" ? 2.6 : 9);
    if (kind === "frag" || kind === "adhesive") p.equip.lethal--;
    w.emit({ t: "throw", id: p.id, kind, pos: cloneV(pos) });
  }

  private plantMine(p: PlayerState): void {
    const w = this.w;
    const eye = eyePos(p);
    const d = aimDir({ ...p, recoilP: 0, recoilY: 0 } as PlayerState);
    const hit = w.col.raycast(eye, d, 2.8, true);
    if (!hit) return; // nothing close enough: keep the charge
    const n = hit.normal;
    const pr = this.spawnProjectile("mine", p, { x: hit.point.x + n.x * 0.06, y: hit.point.y + n.y * 0.06, z: hit.point.z + n.z * 0.06 }, v3(), 9999);
    pr.stuck = true;
    pr.normal = n.y > 0.5 || (Math.abs(n.x) + Math.abs(n.z) < 0.01) ? v3(Math.sin(p.yaw), 0, Math.cos(p.yaw)) : n;
    pr.armAt = w.time + EQUIPMENT.mine.fuse;
    p.equip.lethal--;
    w.emit({ t: "throw", id: p.id, kind: "mine", pos: cloneV(pr.pos) });
  }

  update(dt: number): void {
    const w = this.w;
    // recharge
    for (const p of w.players) {
      if (!p.alive) continue;
      const mult = (w.uplinkUntil[p.team] > w.time ? 2 : 1) * (p.perks.includes("lightkit") ? 0.9 : 1);
      const le = EQUIPMENT[p.loadout.lethal], te = EQUIPMENT[p.loadout.tactical];
      if (p.equip.lethal < le.charges) { p.equip.lethalCharge += dt * mult / le.recharge; if (p.equip.lethalCharge >= 1) { p.equip.lethalCharge = 0; p.equip.lethal++; } }
      if (p.equip.tactical < te.charges) { p.equip.tacticalCharge += dt * mult / te.recharge; if (p.equip.tacticalCharge >= 1) { p.equip.tacticalCharge = 0; p.equip.tactical++; } }
    }
    // smoke growth
    for (const s of w.col.smokes) if (s.rMax && s.r < s.rMax) s.r = Math.min(s.rMax, s.r + (s.rMax / 1.0) * dt);
    for (let i = w.projectiles.length - 1; i >= 0; i--) {
      const pr = w.projectiles[i];
      if (!pr.alive) { w.projectiles.splice(i, 1); continue; }
      this.stepProjectile(pr, dt);
    }
  }

  private stepProjectile(pr: Projectile, dt: number): void {
    const w = this.w;
    if (pr.stuck) {
      if (pr.stuckTo >= 0) {
        const q = w.players[pr.stuckTo];
        if (q && q.alive) { pr.pos.x = q.pos.x + pr.stuckOffset.x; pr.pos.y = q.pos.y + pr.stuckOffset.y; pr.pos.z = q.pos.z + pr.stuckOffset.z; }
        else pr.stuckTo = -1;
      }
      if (pr.kind === "mine") { this.updateMine(pr); return; }
    } else {
      // two substeps for continuous-ish collision
      const sub = 2;
      for (let s = 0; s < sub && !pr.stuck; s++) {
        const h = dt / sub;
        pr.vel.y -= GRAVITY * h;
        for (const axis of ["x", "y", "z"] as const) {
          const d = pr.vel[axis] * h;
          if (d === 0) continue;
          const before = pr.pos[axis];
          pr.pos[axis] += d;
          const hitBox = w.col.overlaps(pr.pos.x, pr.pos.y - PROJ_H / 2, pr.pos.z, PROJ_HALF, PROJ_H);
          const hitGround = pr.pos.y - PROJ_H / 2 < 0;
          if (hitBox || hitGround) {
            pr.pos[axis] = before;
            const n = { x: 0, y: 0, z: 0 };
            n[axis] = d > 0 ? -1 : 1;
            if (hitGround && axis === "y") { pr.pos.y = PROJ_H / 2; n.y = 1; }
            if (pr.kind === "adhesive" || pr.kind === "dart") {
              pr.stuck = true; pr.vel = v3(); pr.normal = n;
              if (pr.kind === "dart") { pr.nextPulse = w.time + 0.5; pr.fuseAt = w.time + 9; }
              break;
            }
            const speedAlong = Math.abs(pr.vel[axis]);
            pr.vel[axis] = -pr.vel[axis] * 0.42;
            const fr = axis === "y" ? 0.82 : 0.9;
            for (const o of ["x", "y", "z"] as const) if (o !== axis) pr.vel[o] *= fr;
            if (speedAlong > 3) w.emit({ t: "impact", pos: cloneV(pr.pos), normal: { x: n.x, y: n.y, z: n.z }, surface: "metal" });
            if (axis === "y" && Math.abs(pr.vel.y) < 0.8) pr.vel.y = 0;
          }
        }
        // sticky vs players
        if (pr.kind === "adhesive" && !pr.stuck) {
          for (const q of w.players) {
            if (!q.alive || q.team === pr.team) continue;
            const h2 = bodyHeight(q);
            if (Math.abs(q.pos.x - pr.pos.x) < 0.4 && Math.abs(q.pos.z - pr.pos.z) < 0.4 && pr.pos.y > q.pos.y && pr.pos.y < q.pos.y + h2) {
              pr.stuck = true; pr.stuckTo = q.id; pr.vel = v3();
              pr.stuckOffset = { x: pr.pos.x - q.pos.x, y: pr.pos.y - q.pos.y, z: pr.pos.z - q.pos.z };
              break;
            }
          }
        }
      }
    }
    if (pr.kind === "dart" && pr.stuck) {
      if (w.time >= pr.nextPulse && pr.pulses < 4) {
        pr.pulses++; pr.nextPulse = w.time + 2;
        w.emit({ t: "dart", pos: cloneV(pr.pos) });
        for (const q of w.players) {
          if (!q.alive || q.team === pr.team) continue;
          if (Math.hypot(q.pos.x - pr.pos.x, q.pos.z - pr.pos.z) <= EQUIPMENT.dart.radius && Math.abs(q.pos.y - pr.pos.y) < 6) {
            const dur = q.perks.includes("signalfilter") ? 0.7 : 1.8;
            q.revealedUntil[pr.team] = Math.max(q.revealedUntil[pr.team], w.time + dur);
          }
        }
      }
      if (w.time >= pr.fuseAt) pr.alive = false;
      return;
    }
    if (pr.kind !== "mine" && w.time >= pr.fuseAt) this.detonate(pr);
  }

  private updateMine(pr: Projectile): void {
    const w = this.w;
    if (w.time < pr.armAt) return;
    // laser: 6 m along the surface normal (slightly above the ground), triggers on enemy bodies
    const len = 6;
    const lx = pr.pos.x + pr.normal.x * len, lz = pr.pos.z + pr.normal.z * len;
    const hit = w.col.raycast({ x: pr.pos.x, y: pr.pos.y, z: pr.pos.z }, { x: pr.normal.x, y: 0, z: pr.normal.z }, len, true);
    const maxLen = hit ? hit.t : len;
    for (const q of w.players) {
      if (!q.alive || q.team === pr.team) continue;
      if (q.pos.y > pr.pos.y + 0.6 || q.pos.y + bodyHeight(q) < pr.pos.y - 0.3) continue;
      // distance from player centre to laser segment
      const ax = q.pos.x - pr.pos.x, az = q.pos.z - pr.pos.z;
      const proj = ax * pr.normal.x + az * pr.normal.z;
      if (proj < 0 || proj > maxLen) continue;
      const perp = Math.abs(ax * pr.normal.z - az * pr.normal.x);
      if (perp < 0.4) { this.detonate(pr); return; }
    }
    void lx; void lz;
  }

  private detonate(pr: Projectile): void {
    const w = this.w;
    pr.alive = false;
    const def = EQUIPMENT[pr.kind];
    const o = w.players[pr.owner];
    const team = pr.team;
    switch (pr.kind) {
      case "frag": case "adhesive":
        this.explode(pr.kind, pr.pos.x, pr.pos.y, pr.pos.z, pr.owner, team, def.radius, def.damage, null);
        break;
      case "mine":
        this.explode("mine", pr.pos.x, pr.pos.y, pr.pos.z, pr.owner, team, def.radius, def.damage, pr.normal);
        break;
      case "flash": {
        w.emit({ t: "explode", kind: "flash", pos: cloneV(pr.pos), radius: def.radius, owner: pr.owner });
        for (const q of w.players) {
          if (!q.alive) continue;
          if (q.team === team && q.id !== pr.owner) continue;
          const eye = eyePos(q);
          const dx = pr.pos.x - eye.x, dy = pr.pos.y - eye.y, dz = pr.pos.z - eye.z;
          const dist = Math.hypot(dx, dy, dz);
          if (dist > def.radius) continue;
          if (!w.col.lineClear(pr.pos, eye, w.time, true)) continue;
          const f = aimDir(q);
          const facing = (f.x * dx + f.y * dy + f.z * dz) / Math.max(dist, 0.01);
          const intensity = (0.25 + 0.75 * clamp01((facing + 0.15) / 1.0)) * (1 - 0.55 * (dist / def.radius));
          const dur = 3.4 * intensity;
          q.flashedUntil = Math.max(q.flashedUntil, w.time + dur);
          q.flashPower = Math.max(q.flashPower, intensity);
          w.emit({ t: "flash", victim: q.id, intensity, owner: pr.owner });
        }
        break;
      }
      case "obscurant": {
        w.col.smokes.push({ x: pr.pos.x, y: Math.max(1.4, pr.pos.y + 1.2), z: pr.pos.z, r: 0.6, rMax: def.radius, until: w.time + 14 });
        w.emit({ t: "smoke", pos: cloneV(pr.pos), radius: def.radius, duration: 14 });
        break;
      }
      case "dart": break;
    }
    void o;
  }

  /** Radial explosion with line-of-sight. `dir` limits a directional blast (mine). */
  explode(kind: string, x: number, y: number, z: number, owner: number, team: number, radius: number, damage: number, dir: Vec3 | null, support = false): void {
    const w = this.w;
    const origin = { x, y: y + 0.2, z };
    w.emit({ t: "explode", kind, pos: { x, y, z }, radius, owner });
    for (const q of w.players) {
      if (!q.alive) continue;
      if (q.team === team && q.id !== owner) continue;
      const chest = { x: q.pos.x, y: q.pos.y + 1.0, z: q.pos.z };
      const dx = chest.x - x, dy = chest.y - origin.y, dz = chest.z - z;
      const dist = Math.hypot(dx, dy, dz);
      if (dist > radius) continue;
      if (dir) {
        const dot = (dx * dir.x + dz * dir.z) / Math.max(Math.hypot(dx, dz), 0.01);
        if (dot < -0.1 && dist > 0.8) continue;
      }
      if (!w.col.lineClear(origin, chest, w.time, true)) {
        // check head too
        const head = { x: q.pos.x, y: q.pos.y + 1.6, z: q.pos.z };
        if (!w.col.lineClear(origin, head, w.time, true)) continue;
      }
      const full = radius * 0.35;
      let mul = dist <= full ? 1 : 1 - 0.8 * ((dist - full) / (radius - full));
      if (q.id === owner) mul *= 0.55;
      if (dir) mul *= 1.0;
      w.damagePlayer(q, owner, damage * mul, "upper", kind, chest, dist, support, origin);
    }
    // deployables and glass
    w.support.explosionHitsDeployables(origin, radius, w.players[owner], kind);
    for (const b of w.col.boxes) {
      if (b.breakable && b.alive) {
        const cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2;
        if (Math.hypot(cx - x, cz - z) < radius * 0.9) { w.col.breakBox(b); w.emit({ t: "glass", id: b.id, pos: { x: cx, y: 1.7, z: cz } }); }
      }
    }
  }
}

void clamp; void dist2D; void CollisionWorld;
