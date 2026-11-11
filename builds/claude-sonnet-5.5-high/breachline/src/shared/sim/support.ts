// Momentum support actions: recon sweep, ammo pod, hunter drone, mortar mark, interdiction flight, team uplink.
// All targeting, line/sky validation, cooldowns and uptime limits are decided here (server-owned truth).
import type { World } from "./world";
import { aimDir, eyePos } from "./world";
import { SUPPORTS, SUPPORT_TIERS } from "../content/gear";
import type { InputCmd } from "../protocol";
import type { Deployable, PlayerState } from "./types";
import { cloneV, v3, type Vec3 } from "../math";

export interface StrikeZone { x: number; z: number; r: number; team: number }
export interface DeployResult { ok: boolean; reason?: string }

export class SupportSystem {
  constructor(private w: World) {}

  handleInput(p: PlayerState, cmd: InputCmd): void {
    if (cmd.supportCycle) {
      const ready = [0, 1, 2].filter((i) => p.supportReady[i] && !p.supportUsed[i]);
      if (ready.length) {
        const cur = ready.indexOf(p.supportSelected);
        p.supportSelected = ready[(cur + 1) % ready.length];
      }
    }
    if (cmd.supportDeploy) this.deploy(p, p.supportSelected);
  }

  skyClear(x: number, y: number, z: number): boolean {
    return this.w.col.raycast({ x, y: y + 0.3, z }, { x: 0, y: 1, z: 0 }, 40, true) === null;
  }

  activeStrikeZones(): StrikeZone[] {
    const out: StrikeZone[] = [];
    for (const e of this.w.supportEvents) {
      if (e.kind === "mortar") out.push({ x: e.pos.x, z: e.pos.z, r: 9, team: e.team });
      if (e.kind === "flight") out.push({ x: e.pos.x, z: e.pos.z, r: 14, team: e.team });
    }
    return out;
  }

  /** Validates and activates a support action for player p. Optional explicit target (bots). */
  deploy(p: PlayerState, idx: number, target?: Vec3, dir?: Vec3): DeployResult {
    const w = this.w;
    if (!p.alive || idx < 0 || idx > 2) return { ok: false, reason: "none" };
    if (!p.supportReady[idx] || p.supportUsed[idx]) return { ok: false, reason: "not ready" };
    const id = p.loadout.support[idx];
    const def = SUPPORTS[id];
    if (!def) return { ok: false, reason: "invalid" };
    const eye = eyePos(p);
    const aim = aimDir(p);
    let tgt = target;
    if (def.needsTarget && !tgt) {
      const hit = w.col.raycast(eye, aim, def.id === "ammopod" ? 6 : 90, true);
      if (hit) tgt = hit.point;
      else if (def.id === "ammopod") tgt = { x: p.pos.x + Math.sin(p.yaw) * 1.6, y: 0, z: p.pos.z + Math.cos(p.yaw) * 1.6 };
    }
    if (def.needsTarget && !tgt) { w.emit({ t: "announce", text: "No valid target" }); return { ok: false, reason: "no target" }; }
    const t8 = def.tier === 8;
    if (t8 && (w.flightUntil[p.team] > w.time)) { w.emit({ t: "announce", text: "Tier 8 support already active" }); return { ok: false, reason: "tier8 active" }; }
    if (def.outdoorOnly && tgt && !this.skyClear(tgt.x, Math.max(0, tgt.y), tgt.z)) {
      w.emit({ t: "announce", text: "Target must be outdoors" });
      return { ok: false, reason: "indoors" };
    }
    const enemy = (1 - p.team) as 0 | 1;
    const now = w.time;
    switch (def.id) {
      case "recon":
        w.supportEvents.push({ id: w.nextEntityId++, kind: "recon", team: p.team, owner: p.id, pos: cloneV(p.pos), dir: v3(), t0: now, shells: [], until: now + 14, pulses: [now + 0.4, now + 5.4, now + 10.4] });
        break;
      case "ammopod": {
        const pos = { x: tgt!.x, y: Math.max(0, tgt!.y), z: tgt!.z };
        if (tgt!.y > 0.1) pos.y = 0;
        this.addDeployable("pod", p, pos, 60, def.duration);
        break;
      }
      case "drone": {
        this.addDeployable("drone", p, { x: p.pos.x, y: 10, z: p.pos.z }, 40, def.duration);
        break;
      }
      case "mortar": {
        const shells = [
          { at: now + 3.2, pos: { x: tgt!.x, y: 0, z: tgt!.z }, done: false },
          { at: now + 4.9, pos: { x: tgt!.x + (w.rng.next() - 0.5) * 6, y: 0, z: tgt!.z + (w.rng.next() - 0.5) * 6 }, done: false },
        ];
        w.supportEvents.push({ id: w.nextEntityId++, kind: "mortar", team: p.team, owner: p.id, pos: { x: tgt!.x, y: 0, z: tgt!.z }, dir: v3(), t0: now, shells, until: now + 6 });
        w.emit({ t: "supportWarn", support: "mortar", team: enemy, pos: { x: tgt!.x, y: 0, z: tgt!.z }, seconds: 3.2 });
        break;
      }
      case "flight": {
        const d = dir ?? { x: Math.sin(p.yaw), y: 0, z: Math.cos(p.yaw) };
        const l = Math.hypot(d.x, d.z) || 1;
        const dd = { x: d.x / l, y: 0, z: d.z / l };
        w.supportEvents.push({ id: w.nextEntityId++, kind: "flight", team: p.team, owner: p.id, pos: { x: tgt!.x, y: 0, z: tgt!.z }, dir: dd, t0: now, shells: [], until: now + 4 + 3.4 });
        w.flightUntil[p.team] = now + 4 + 3.4 + 1;
        w.emit({ t: "supportWarn", support: "flight", team: enemy, pos: { x: tgt!.x, y: 0, z: tgt!.z }, seconds: 4 });
        break;
      }
      case "uplink":
        w.uplinkUntil[p.team] = now + def.duration;
        w.flightUntil[p.team] = now + def.duration;
        break;
    }
    p.supportUsed[idx] = true;
    p.supportReady[idx] = false;
    const next = [0, 1, 2].filter((i) => p.supportReady[i] && !p.supportUsed[i]);
    p.supportSelected = next.length ? next[next.length - 1] : -1;
    w.emit({ t: "supportUse", player: p.id, support: id, pos: cloneV(tgt ?? p.pos), team: p.team });
    return { ok: true };
  }

  private addDeployable(kind: "pod" | "drone", p: PlayerState, pos: Vec3, hp: number, dur: number): void {
    const w = this.w;
    const dep: Deployable = { id: w.nextEntityId++, kind, team: p.team, owner: p.id, pos, hp, until: w.time + dur, born: w.time, lastUse: {}, phase: w.rng.next() * 6 };
    (dep as Deployable & { anchor?: Vec3 }).anchor = { x: pos.x, y: pos.y, z: pos.z };
    w.deployables.push(dep);
  }

  update(dt: number): void {
    const w = this.w;
    const now = w.time;
    // support events
    for (let i = w.supportEvents.length - 1; i >= 0; i--) {
      const e = w.supportEvents[i];
      if (e.kind === "recon") {
        for (let k = 0; k < (e.pulses?.length ?? 0); k++) {
          if (e.pulses![k] <= now) {
            e.pulses![k] = Infinity;
            for (const q of w.players) {
              if (!q.alive || q.team === e.team) continue;
              const dur = q.perks.includes("signalfilter") ? 0.9 : 2.4;
              q.revealedUntil[e.team] = Math.max(q.revealedUntil[e.team], now + dur);
            }
            w.emit({ t: "announce", text: "Recon pulse" });
          }
        }
      } else if (e.kind === "mortar") {
        for (const s of e.shells) {
          if (!s.done && s.at <= now) {
            s.done = true;
            w.equipment.explode("mortar", s.pos.x, 0.2, s.pos.z, e.owner, e.team, 6.5, 135, null, true);
            this.markSupportKills(e.owner);
          }
        }
      } else if (e.kind === "flight") {
        const t = now - e.t0;
        if (t > 4 && t < 4 + 3.4) {
          const along = ((t - 4) / 3.4 - 0.5) * 140;
          const px = e.pos.x + e.dir.x * along, pz = e.pos.z + e.dir.z * along;
          // strafing burst
          if (Math.floor(t * 8) !== Math.floor((t - dt) * 8)) {
            const jx = px + (-e.dir.z) * (w.rng.next() - 0.5) * 3.4, jz = pz + e.dir.x * (w.rng.next() - 0.5) * 3.4;
            w.emit({ t: "explode", kind: "strafe", pos: { x: jx, y: 0.1, z: jz }, radius: 2.2, owner: e.owner });
            for (const q of w.players) {
              if (!q.alive || q.team === e.team) continue;
              if (Math.hypot(q.pos.x - jx, q.pos.z - jz) < 2.3 && this.skyClear(q.pos.x, q.pos.y, q.pos.z)) {
                w.damagePlayer(q, e.owner, 48, "upper", "flight", { x: q.pos.x, y: q.pos.y + 1.2, z: q.pos.z }, 40, true, { x: jx, y: 30, z: jz });
              }
            }
          }
        }
      }
      if (e.until < now && e.shells.every((s) => s.done) && (e.kind !== "recon" || (e.pulses ?? []).every((p2) => p2 === Infinity))) w.supportEvents.splice(i, 1);
      else if (e.until + 2 < now) w.supportEvents.splice(i, 1);
    }
    // deployables
    for (let i = w.deployables.length - 1; i >= 0; i--) {
      const d = w.deployables[i];
      if (d.until < now || d.hp <= 0) { w.deployables.splice(i, 1); continue; }
      if (d.kind === "drone") {
        const a = (d as Deployable & { anchor: Vec3 }).anchor;
        const owner = w.players[d.owner];
        const ang = (now - d.born) * 0.35 + d.phase;
        const cx = owner && owner.alive ? owner.pos.x : a.x, cz = owner && owner.alive ? owner.pos.z : a.z;
        d.pos.x += (cx + Math.cos(ang) * 7 - d.pos.x) * Math.min(1, dt * 1.2);
        d.pos.z += (cz + Math.sin(ang) * 7 - d.pos.z) * Math.min(1, dt * 1.2);
        d.pos.y = 10 + Math.sin(now * 1.3) * 0.6;
        // mark enemies in view of the drone (cone straight below, long range)
        if (Math.floor(now * 4) !== Math.floor((now - dt) * 4)) {
          for (const q of w.players) {
            if (!q.alive || q.team === d.team) continue;
            const chest = { x: q.pos.x, y: q.pos.y + 1.2, z: q.pos.z };
            if (Math.hypot(chest.x - d.pos.x, chest.z - d.pos.z) > 38) continue;
            if (w.col.lineClear(d.pos, chest, now)) q.revealedUntil[d.team] = Math.max(q.revealedUntil[d.team], now + 0.9);
          }
        }
      } else {
        // pod resupply
        for (const q of w.players) {
          if (!q.alive || q.team !== d.team) continue;
          if (Math.hypot(q.pos.x - d.pos.x, q.pos.z - d.pos.z) < 2.2 && now - (d.lastUse[q.id] ?? -99) > 8) {
            d.lastUse[q.id] = now;
            for (const wp of q.weapons) wp.reserve = wp.stats.reserve;
            q.equip.lethal = Math.max(q.equip.lethal, 1); q.equip.tactical = Math.max(q.equip.tactical, 1);
            w.emit({ t: "announce", text: `${q.name} resupplied` });
          }
        }
      }
    }
  }

  private markSupportKills(owner: number): void { void owner; }

  damageDeployable(d: Deployable, by: PlayerState, amount: number, weapon: string): void {
    d.hp -= amount;
    if (d.hp <= 0) this.destroyDeployable(d, by, weapon);
  }

  destroyDeployable(d: Deployable, by: PlayerState | undefined, weapon: string): void {
    const w = this.w;
    const i = w.deployables.indexOf(d);
    if (i < 0) return;
    w.deployables.splice(i, 1);
    w.emit({ t: "supportDestroyed", support: d.kind, by: by ? by.id : -1, pos: cloneV(d.pos) });
    w.emit({ t: "explode", kind: "device", pos: cloneV(d.pos), radius: 1.5, owner: by ? by.id : -1 });
    if (by && by.team !== d.team) {
      by.stats.supportDestroyed++;
      by.stats.score += 75;
      w.emit({ t: "score", player: by.id, points: 75, label: d.kind === "drone" ? "Drone destroyed" : "Pod destroyed" });
      w.addMomentum(by, 1);
    }
    void weapon;
  }

  explosionHitsDeployables(origin: Vec3, radius: number, by: PlayerState | undefined, kind: string): void {
    for (const d of [...this.w.deployables]) {
      if (by && d.team === by.team) continue;
      const dist = Math.hypot(d.pos.x - origin.x, d.pos.y - origin.y, d.pos.z - origin.z);
      if (dist < radius && d.kind === "pod") d.hp -= 100 * (1 - dist / radius) + 20;
      if (d.hp <= 0) this.destroyDeployable(d, by, kind);
    }
  }
}

void SUPPORT_TIERS;
