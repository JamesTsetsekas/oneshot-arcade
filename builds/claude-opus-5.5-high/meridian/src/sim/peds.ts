// Pedestrian crowd: role-based schedules on the sidewalk graph, signal-aware crossings,
// activities at points of interest, short bark conversations, varied danger reactions,
// witness phone calls (via police system), knockdowns and assistance. Full "thinkers"
// are capped to the nearest N; the rest tick at a reduced rate.

import { clamp, dist2, Rng } from "../core/math";
import { Character, moveToward, type PedRole } from "./character";
import type { Game } from "./game";
import type { Vehicle } from "./vehicle";
import { districtAt, type DistrictId } from "../world/district";

export type PedState =
  | "WalkRoute" | "WaitSignal" | "CrossStreet" | "Browse" | "Sit" | "Talk" | "WorkLoop" | "ReactCurious"
  | "AvoidObstacle" | "Panic" | "Flee" | "Hide" | "CallEmergency" | "AssistInjured" | "Down" | "Despawn";

export interface PedBrain {
  state: PedState;
  path: number[];
  pi: number;
  timer: number;
  legs: number;
  speed: number;
  offset: number;
  bravery: number;
  fear: number;
  threatX: number; threatZ: number;
  reactDelay: number;
  pendingReact: PedState | null;
  partner: Character | null;
  barkIdx: number;
  home: number;
  assist: Character | null;
  tick: number;
  callId: number;
  lastDodge: number;
}

const ROLE_BY_DISTRICT: Record<DistrictId, [PedRole, number][]> = {
  tide: [["tourist", 3], ["commuter", 2], ["resident", 2], ["courier", 1], ["vendor", 0]],
  foundry: [["dock", 4], ["commuter", 1], ["courier", 1]],
  glassline: [["commuter", 5], ["security", 1], ["courier", 1], ["tourist", 1]],
  lantern: [["resident", 5], ["tourist", 2], ["commuter", 1]],
  breakwater: [["dock", 4], ["tourist", 1], ["resident", 1]],
  canal: [["resident", 3], ["commuter", 2], ["tourist", 2], ["courier", 1]],
};

/** Original bark pairs: [opener, reply]. Context tags pick appropriate lines. */
export const BARKS: { tag: string; a: string; b: string }[] = [
  { tag: "any", a: "Tram's late again.", b: "Tram's always late. That's how you know it's Tuesday." },
  { tag: "any", a: "You hear the floodwall siren this morning?", b: "Just a drill. Or that's what they told us." },
  { tag: "any", a: "My cousin got a job at the new port office.", b: "Automated port, and they still need people? Lucky cousin." },
  { tag: "tide", a: "Those peaches are criminally good today.", b: "Don't say 'criminally' this close to the substation." },
  { tag: "tide", a: "Stall rent went up again.", b: "Everything near the clock goes up. Even the pigeons." },
  { tag: "lantern", a: "Three hundred stairs and I forgot my keys.", b: "Lantern Hill builds character. And calves." },
  { tag: "lantern", a: "Sunset from the Lantern tonight?", b: "Only if the fog stays on the water." },
  { tag: "glassline", a: "Meeting got moved to the twentieth floor.", b: "The elevators in that tower have opinions." },
  { tag: "glassline", a: "Did you sign the new contract terms?", b: "I skimmed them. They skimmed me back." },
  { tag: "foundry", a: "Shed four had its lights on all night.", b: "Calloway's people don't sleep. Or pay overtime." },
  { tag: "breakwater", a: "Container cranes stopped again.", b: "Software update. The gulls are running the port now." },
  { tag: "canal", a: "Someone's painting the bridge railings teal.", b: "Better than the old rust colour." },
  { tag: "night", a: "Rain's coming in off the breakwater.", b: "Good. Washes the salt off the cars." },
];

export const REACT_BARKS = {
  panic: ["Get down!", "Run!", "Not again—", "Someone call the wardens!", "Move, move!"],
  curious: ["Whoa, what was that?", "Did you see that?", "Somebody's having a day.", "Was that a crash?"],
  call: ["Wardens? There's someone—", "Yes, I'm watching them right now.", "Emergency line, please hurry."],
  hit: ["Hey! Watch it!", "Ow! Are you serious?", "Get off the sidewalk!"],
  dodge: ["Whoa!", "Slow down!", "Hey!"],
};

export class PedSystem {
  brains = new Map<string, PedBrain>();
  private rng = new Rng(9001);
  spawnCd = 0;
  pathFailures = 0;
  tickNo = 0;
  thinkersCap = 18;

  constructor(private g: Game) {}

  get list() { return this.g.chars.filter((c) => c.kind === "civilian" && this.brains.has(c.id)); }

  private roleFor(x: number, z: number): PedRole {
    const opts = ROLE_BY_DISTRICT[districtAt(x, z)];
    let t = this.rng.next() * opts.reduce((a, b) => a + b[1], 0);
    for (const [r, w] of opts) { t -= w; if (t <= 0) return r; }
    return "commuter";
  }

  private newBrain(home: number): PedBrain {
    return {
      state: "WalkRoute", path: [], pi: 0, timer: 0, legs: this.rng.int(2, 5), speed: this.rng.range(1.15, 1.65),
      offset: this.rng.range(-0.9, 0.9), bravery: this.rng.next(), fear: 0, threatX: 0, threatZ: 0,
      reactDelay: 0, pendingReact: null, partner: null, barkIdx: -1, home, assist: null, tick: this.rng.int(0, 3), callId: 0, lastDodge: -10,
    };
  }

  spawnAt(nodeId: number, role?: PedRole): Character {
    const n = this.g.roads.ped[nodeId];
    const r = role ?? this.roleFor(n.x, n.z);
    const c = new Character("civilian", r, this.g.makeLook(r, this.rng), n.x, n.z, this.g.groundAt(n.x, n.z));
    c.yaw = this.rng.range(-Math.PI, Math.PI);
    c.savePrev();
    const b = this.newBrain(nodeId);
    this.brains.set(c.id, b);
    this.g.chars.push(c);
    this.planNext(c, b);
    return c;
  }

  /** Static ambient actors at stalls/plaza (vendors, musicians). */
  spawnFixed(x: number, z: number, role: PedRole, yaw: number) {
    const id = this.g.roads.nearestPed(x, z);
    const c = this.spawnAt(id, role);
    c.x = x; c.z = z; c.y = this.g.groundAt(x, z); c.yaw = yaw; c.savePrev();
    const b = this.brains.get(c.id)!;
    b.state = "WorkLoop"; b.timer = 1e9; b.path = [];
    return c;
  }

  adoptFromVehicle(c: Character, v: Vehicle, flee: boolean) {
    c.vehicle = null;
    const fx = Math.sin(v.yaw), fz = Math.cos(v.yaw);
    c.x = v.x - Math.cos(v.yaw) * (v.hw + 0.7); c.z = v.z + Math.sin(v.yaw) * (v.hw + 0.7);
    c.y = this.g.groundAt(c.x, c.z);
    c.yaw = Math.atan2(-fx, -fz);
    c.savePrev();
    if (!this.g.chars.includes(c)) this.g.chars.push(c);
    const b = this.newBrain(this.g.roads.nearestPed(c.x, c.z));
    this.brains.set(c.id, b);
    if (flee) { b.state = "Flee"; b.timer = 8; b.threatX = v.x; b.threatZ = v.z; b.fear = 1; }
    else this.planNext(c, b);
  }

  populate(cx: number, cz: number) {
    const target = Math.round(42 * this.g.settings.pedDensity);
    const ped = this.g.roads.ped;
    let n = 0, tries = 0;
    while (n < target && tries++ < 600) {
      const id = this.rng.int(0, ped.length - 1);
      const p = ped[id];
      const d = dist2(p.x, p.z, cx, cz);
      if (d < 8 || d > 110) continue;
      if (this.g.waterAt(p.x, p.z) !== null) continue;
      this.spawnAt(id);
      n++;
    }
  }

  private planNext(c: Character, b: PedBrain) {
    const ped = this.g.roads.ped;
    const from = this.g.roads.nearestPed(c.x, c.z);
    // destination: a POI sometimes, otherwise a random node 40–140 m away
    let to = -1;
    for (let k = 0; k < 12; k++) {
      const id = this.rng.int(0, ped.length - 1);
      const p = ped[id];
      const d = dist2(p.x, p.z, c.x, c.z);
      if (d < 30 || d > 150) continue;
      if (p.poi && this.rng.chance(0.6)) { to = id; break; }
      if (!p.poi) { to = id; if (this.rng.chance(0.5)) break; }
    }
    if (to < 0) { b.state = "Browse"; b.timer = this.rng.range(3, 6); return; }
    const path = this.g.roads.pedRoute(from, to);
    if (!path.length) { this.pathFailures++; b.state = "Browse"; b.timer = 3; return; }
    b.path = path; b.pi = 0; b.state = "WalkRoute";
  }

  private canSee(c: Character, x: number, y: number, z: number, range: number) {
    const d = dist2(c.x, c.z, x, z);
    if (d > range) return false;
    return this.g.world.lineOfSight(c.x, c.eyeY, c.z, x, y, z);
  }

  /** World stimulus: gunfire, crash, assault, explosion-like events. */
  stimulus(kind: "gunfire" | "crash" | "assault" | "aim" | "siren" | "chirper" | "hitByCar", x: number, z: number, radius: number, src?: Character) {
    for (const c of this.list) {
      const b = this.brains.get(c.id)!;
      if (c.status !== "normal") continue;
      const d = dist2(c.x, c.z, x, z);
      if (d > radius) continue;
      const seen = this.canSee(c, x, 1.2, z, radius);
      if (kind === "chirper") {
        if (b.state === "CallEmergency") { b.state = "ReactCurious"; b.timer = 6; b.threatX = x; b.threatZ = z; c.phoneUp = false; this.g.police.interruptCall(c); }
        else if (b.state !== "Flee" && b.state !== "Panic") { b.state = "ReactCurious"; b.timer = 4; b.threatX = x; b.threatZ = z; }
        continue;
      }
      const severity = kind === "gunfire" ? 1 : kind === "assault" ? 0.7 : kind === "aim" ? 0.8 : kind === "hitByCar" ? 0.75 : kind === "crash" ? 0.35 : 0.15;
      const fear = severity * (seen ? 1 : 0.6) * (1 - d / (radius * 1.2)) * (1.25 - b.bravery * 0.5);
      b.fear = Math.max(b.fear, fear);
      b.threatX = x; b.threatZ = z;
      // varied reactions: delay & choice differ per person
      b.reactDelay = this.rng.range(0.15, 1.1) * (1.4 - b.fear);
      if (b.fear > 0.55) b.pendingReact = this.rng.chance(0.25 + b.bravery * 0.2) ? "Hide" : "Flee";
      else if (b.fear > 0.3) b.pendingReact = this.rng.chance(0.5) ? "Panic" : "ReactCurious";
      else b.pendingReact = "ReactCurious";
      void src;
    }
  }

  setCalling(c: Character, on: boolean) {
    const b = this.brains.get(c.id);
    if (!b) return;
    if (on) { b.state = "CallEmergency"; b.timer = 99; c.phoneUp = true; this.g.say(c, this.rng.pick(REACT_BARKS.call), 2.5, true); }
    else { c.phoneUp = false; if (b.state === "CallEmergency") { b.state = "Flee"; b.timer = 4; } }
  }

  hitByVehicle(c: Character, v: Vehicle, speed: number) {
    const b = this.brains.get(c.id);
    c.knock(speed > 12 ? 30 : this.rng.range(3.5, 6));
    if (speed > 12) c.hurt(60, this.g.time); else c.hurt(speed * 2.5, this.g.time);
    if (b) { b.state = "Down"; b.fear = 1; b.threatX = v.x; b.threatZ = v.z; c.phoneUp = false; }
    this.stimulus("hitByCar", c.x, c.z, 25);
    // someone nearby comes to help
    let helper: Character | null = null, hd = 18;
    for (const o of this.list) {
      if (o === c || o.status !== "normal") continue;
      const ob = this.brains.get(o.id)!;
      if (ob.state === "Flee" || ob.state === "CallEmergency" || ob.bravery < 0.45) continue;
      const d = dist2(o.x, o.z, c.x, c.z);
      if (d < hd) { hd = d; helper = o; }
    }
    if (helper) { const hb = this.brains.get(helper.id)!; hb.state = "AssistInjured"; hb.assist = c; hb.timer = 12; }
  }

  update(dt: number) {
    const g = this.g;
    const P = g.focus;
    this.tickNo++;
    // despawn far / dead out of view; spawn near portals (graph nodes) out of view
    for (const c of g.chars) {
      if (c.kind !== "civilian" || c.tag) continue;
      const d = dist2(c.x, c.z, P.x, P.z);
      const b = this.brains.get(c.id);
      if (!b) continue;
      const vis = g.isVisible(c.x, c.y + 1, c.z, 1);
      if (d > 150 || (d > 90 && !vis) || ((b.state === "Despawn" || !c.alive) && d > 35 && !vis)) {
        if (b.state === "CallEmergency") g.police.interruptCall(c);
        c.removeMe = true;
        this.brains.delete(c.id);
      }
    }
    const target = Math.round(42 * g.settings.pedDensity);
    let count = 0;
    for (const c of g.chars) if (c.kind === "civilian" && !c.removeMe) count++;
    this.spawnCd -= dt;
    if (count < target && this.spawnCd <= 0) {
      this.spawnCd = 0.15;
      const ped = g.roads.ped;
      for (let k = 0; k < 8; k++) {
        const id = this.rng.int(0, ped.length - 1);
        const p = ped[id];
        const d = dist2(p.x, p.z, P.x, P.z);
        if (d < 45 || d > 115) continue;
        if (g.isVisible(p.x, g.groundAt(p.x, p.z) + 1, p.z, 1) && d < 100) continue;
        if (g.waterAt(p.x, p.z) !== null) continue;
        this.spawnAt(id);
        break;
      }
    }

    // thinkers: nearest N full rate, rest every 3rd tick
    const civ = this.list;
    civ.sort((a, b) => dist2(a.x, a.z, P.x, P.z) - dist2(b.x, b.z, P.x, P.z));
    for (let i = 0; i < civ.length; i++) {
      const c = civ[i];
      const b = this.brains.get(c.id)!;
      const full = i < this.thinkersCap;
      b.tick++;
      // movement always runs smoothly; decisions throttled for far agents
      this.think(c, b, dt, full || b.tick % 3 === 0);
    }
  }

  private think(c: Character, b: PedBrain, dt: number, decide: boolean) {
    const g = this.g;
    c.updateStatus(dt);
    if (!c.alive) { c.animSpeed = 0; return; }
    if (c.status !== "normal") { c.animSpeed = 0; return; }
    if (b.state === "Down") { b.state = "Flee"; b.timer = 6; }

    // delayed reaction to stimulus
    if (b.pendingReact) {
      b.reactDelay -= dt;
      if (b.reactDelay <= 0) {
        const st = b.pendingReact;
        b.pendingReact = null;
        if (b.state !== "CallEmergency") {
          b.state = st;
          b.timer = st === "Flee" ? this.rng.range(6, 11) : st === "Hide" ? this.rng.range(8, 14) : st === "Panic" ? this.rng.range(2, 4) : this.rng.range(2.5, 5);
          if ((st === "Flee" || st === "Panic") && this.rng.chance(0.35)) g.say(c, this.rng.pick(REACT_BARKS.panic), 1.8, true);
          if (st === "ReactCurious" && this.rng.chance(0.3)) g.say(c, this.rng.pick(REACT_BARKS.curious), 2, true);
        }
      }
    }

    // vehicle avoidance (dodge cars heading at us)
    if (decide && g.time - b.lastDodge > 1.2) {
      for (const v of g.vehicles) {
        const sp = v.speed;
        if (sp < 4) continue;
        const dx = c.x - v.x, dz = c.z - v.z;
        const d = Math.hypot(dx, dz);
        if (d > 3 + sp * 0.9) continue;
        const vx = v.vx / sp, vz = v.vz / sp;
        const along = dx * vx + dz * vz;
        const lat = dx * vz - dz * vx;
        if (along > 0 && Math.abs(lat) < v.hw + 1.4) {
          b.lastDodge = g.time;
          const side = lat >= 0 ? 1 : -1;
          b.state = "AvoidObstacle"; b.timer = 0.6;
          b.threatX = c.x + vz * side * 3; b.threatZ = c.z - vx * side * 3;
          if (this.rng.chance(0.4)) g.say(c, this.rng.pick(REACT_BARKS.dodge), 1.2, true);
          break;
        }
      }
    }

    const env = g.footEnv;
    switch (b.state) {
      case "WalkRoute":
      case "CrossStreet": {
        if (b.pi >= b.path.length) { this.arrive(c, b); break; }
        const node = g.roads.ped[b.path[b.pi]];
        const prev = b.pi > 0 ? g.roads.ped[b.path[b.pi - 1]] : null;
        // crossing check: edge prev->node
        if (prev && b.state !== "CrossStreet") {
          const e = prev.edges.find((q) => q.to === node.id);
          if (e?.cross) {
            if (!g.roads.pedWalk(e.cross.node, e.cross.axis, g.time)) { b.state = "WaitSignal"; c.animSpeed = 0; break; }
            b.state = "CrossStreet";
          }
        }
        // offset across sidewalk width
        let tx = node.x, tz = node.z;
        if (prev) {
          const dx = node.x - prev.x, dz = node.z - prev.z;
          const L = Math.hypot(dx, dz) || 1;
          tx += (dz / L) * b.offset * (b.state === "CrossStreet" ? 0.5 : 1);
          tz += (-dx / L) * b.offset * (b.state === "CrossStreet" ? 0.5 : 1);
        }
        const sp = b.speed * (b.state === "CrossStreet" ? 1.2 : 1);
        const left = moveToward(c, dt, tx, tz, sp, env, false);
        if (left < 0.4) { b.pi++; if (b.state === "CrossStreet") b.state = "WalkRoute"; }
        // occasional conversation
        if (decide && b.state === "WalkRoute" && this.rng.chance(0.002)) this.tryTalk(c, b);
        break;
      }
      case "WaitSignal": {
        c.animSpeed = 0;
        const node = g.roads.ped[b.path[b.pi]];
        const prev = g.roads.ped[b.path[b.pi - 1]];
        const e = prev?.edges.find((q) => q.to === node.id);
        if (!e?.cross || g.roads.pedWalk(e.cross.node, e.cross.axis, g.time)) b.state = "CrossStreet";
        break;
      }
      case "Browse": case "Sit": case "WorkLoop": {
        c.animSpeed = 0;
        b.timer -= dt;
        if (b.timer <= 0) { b.legs--; if (b.legs <= 0) b.state = "Despawn"; else this.planNext(c, b); }
        if (decide && b.state === "Browse" && this.rng.chance(0.004)) this.tryTalk(c, b);
        break;
      }
      case "Talk": {
        c.animSpeed = 0;
        c.talkTimer += dt;
        b.timer -= dt;
        if (b.partner) { const a = Math.atan2(b.partner.x - c.x, b.partner.z - c.z); c.yaw += Math.atan2(Math.sin(a - c.yaw), Math.cos(a - c.yaw)) * Math.min(1, 6 * dt); }
        if (b.timer <= 0 || !b.partner || b.partner.removeMe) { b.partner = null; this.planNext(c, b); }
        break;
      }
      case "ReactCurious": {
        c.animSpeed = 0;
        const a = Math.atan2(b.threatX - c.x, b.threatZ - c.z);
        c.yaw += Math.atan2(Math.sin(a - c.yaw), Math.cos(a - c.yaw)) * Math.min(1, 5 * dt);
        b.timer -= dt;
        if (b.timer <= 0) this.planNext(c, b);
        break;
      }
      case "AvoidObstacle": {
        moveToward(c, dt, b.threatX, b.threatZ, 4.5, env, true);
        b.timer -= dt;
        if (b.timer <= 0) { b.state = "WalkRoute"; b.path = this.repath(c, b); }
        break;
      }
      case "Panic": {
        // brief frozen/crouched cower, then flee
        c.crouch = true; c.animSpeed = 0;
        b.timer -= dt;
        if (b.timer <= 0) { c.crouch = false; b.state = "Flee"; b.timer = this.rng.range(5, 9); }
        break;
      }
      case "Flee": {
        const dx = c.x - b.threatX, dz = c.z - b.threatZ;
        const d = Math.hypot(dx, dz) || 1;
        const tx = c.x + (dx / d) * 6, tz = c.z + (dz / d) * 6;
        moveToward(c, dt, tx, tz, 4.6 + b.bravery * 0.8, env, true);
        // don't run into the harbor/canal
        if (g.waterAt(c.x, c.z) !== null) { b.threatX = c.x - dx; b.threatZ = c.z - dz; }
        b.timer -= dt;
        if (b.timer <= 0) { b.fear *= 0.4; b.state = this.rng.chance(0.4) ? "Hide" : "WalkRoute"; b.timer = 6; b.path = this.repath(c, b); }
        break;
      }
      case "Hide": {
        c.crouch = true; c.animSpeed = 0;
        b.timer -= dt;
        if (b.timer <= 0) { c.crouch = false; b.fear *= 0.3; this.planNext(c, b); }
        break;
      }
      case "CallEmergency": {
        c.animSpeed = 0;
        c.phoneUp = true;
        const a = Math.atan2(b.threatX - c.x, b.threatZ - c.z);
        c.yaw += Math.atan2(Math.sin(a - c.yaw), Math.cos(a - c.yaw)) * Math.min(1, 4 * dt);
        break;
      }
      case "AssistInjured": {
        const v = b.assist;
        if (!v || v.removeMe) { this.planNext(c, b); break; }
        const d = dist2(c.x, c.z, v.x, v.z);
        if (d > 1.4) moveToward(c, dt, v.x, v.z, 2.6, env, true);
        else { c.crouch = true; c.animSpeed = 0; }
        b.timer -= dt;
        if (b.timer <= 0 || (v.status === "normal" && v.alive)) { c.crouch = false; this.planNext(c, b); }
        break;
      }
      case "Despawn": {
        // walk toward a nearby node and wait to be culled out of view
        c.animSpeed = 0;
        b.timer -= dt;
        if (b.timer < -20) { b.legs = 2; this.planNext(c, b); }
        break;
      }
    }
    // keep standing on the ground
    if (b.state !== "WalkRoute" && b.state !== "CrossStreet" && b.state !== "Flee" && b.state !== "AvoidObstacle" && b.state !== "AssistInjured") {
      const gr = g.groundAt(c.x, c.z);
      c.y += (gr - c.y) * Math.min(1, 10 * dt);
    }
    // fear decays
    b.fear = Math.max(0, b.fear - dt * 0.05);
  }

  private repath(c: Character, b: PedBrain): number[] {
    const from = this.g.roads.nearestPed(c.x, c.z);
    const dest = b.path.length ? b.path[b.path.length - 1] : from;
    const p = this.g.roads.pedRoute(from, dest);
    b.pi = 0;
    if (!p.length) { this.pathFailures++; return [from]; }
    return p;
  }

  private arrive(c: Character, b: PedBrain) {
    const node = this.g.roads.ped[b.path[b.path.length - 1]];
    if (node?.poi) {
      const kind = node.poi;
      if (kind === "stall") { b.state = "Browse"; b.timer = this.rng.range(5, 14); }
      else if (kind === "bench") { b.state = "Sit"; b.timer = this.rng.range(8, 22); }
      else { b.state = "Browse"; b.timer = this.rng.range(4, 10); }
      return;
    }
    b.legs--;
    if (b.legs <= 0) { b.state = "Despawn"; b.timer = 0; return; }
    this.planNext(c, b);
  }

  private tryTalk(c: Character, b: PedBrain) {
    for (const o of this.list) {
      if (o === c) continue;
      const ob = this.brains.get(o.id)!;
      if (ob.state !== "WalkRoute" && ob.state !== "Browse") continue;
      if (dist2(o.x, o.z, c.x, c.z) > 3.2) continue;
      const tag = districtAt(c.x, c.z);
      const night = this.g.clock.hour > 20 || this.g.clock.hour < 5;
      const pool = BARKS.filter((q) => q.tag === "any" || q.tag === tag || (night && q.tag === "night"));
      const bark = this.rng.pick(pool);
      b.state = "Talk"; ob.state = "Talk";
      b.partner = o; ob.partner = c;
      b.timer = ob.timer = 7;
      this.g.say(c, bark.a, 3, false);
      this.g.sayLater(o, bark.b, 3.2, 3);
      return;
    }
  }

  /** Characters near a point that could witness an event. */
  witnessesFor(x: number, y: number, z: number, hearR: number, seeR: number): Character[] {
    const out: Character[] = [];
    for (const c of this.list) {
      if (!c.alive || c.status !== "normal") continue;
      const d = dist2(c.x, c.z, x, z);
      if (d > Math.max(hearR, seeR)) continue;
      const sees = d < seeR && this.g.world.lineOfSight(c.x, c.eyeY, c.z, x, y, z);
      const hears = d < hearR;
      if (sees || (hears && d < hearR * 0.6)) out.push(c);
    }
    return out;
  }

  brainOf(c: Character) { return this.brains.get(c.id); }

  /** Pedestrians nudged by the player on foot. */
  shove(c: Character, fromX: number, fromZ: number) {
    const b = this.brains.get(c.id);
    if (!b) return;
    if (b.state === "WalkRoute" || b.state === "Browse") {
      b.state = "ReactCurious"; b.timer = 1.5; b.threatX = fromX; b.threatZ = fromZ;
      if (this.rng.chance(0.3)) this.g.say(c, this.rng.pick(REACT_BARKS.hit), 1.5, true);
    }
  }

  clampFear(c: Character) { const b = this.brains.get(c.id); if (b) b.fear = clamp(b.fear, 0, 1); }
}
