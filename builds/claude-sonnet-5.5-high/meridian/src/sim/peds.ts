import { clamp, dampAngle, headingTo, wrapAngle } from '../core/math';
import type { Game } from './game';
import type { Human } from './types';
import type { Vehicle } from './vehicle';
import { canStartCrossing } from './nav';
import { resolveHuman } from './collision';

let humanIds = 1;
export function resetHumanIds(): void { humanIds = 1; }

export function makeHuman(kind: Human['kind'], x: number, z: number, role = 'resident', variant = 0): Human {
  return {
    id: kind === 'player' ? 0 : humanIds++, kind, role, x, z, y: 0, vy: 0, vx: 0, vz: 0, heading: 0, hp: 100, maxHp: 100, armor: 0, alive: true,
    koUntil: 0, state: 'WalkRoute', stateT: 0, variant, outfit: variant, anim: Math.random() * 6, speed: 0, crouch: false, swimming: false,
    vehicleId: null, fear: 0, courage: Math.random(), hasPhone: Math.random() < 0.8, reportT: 0, reportEvidence: 0, path: [], pathI: 0,
    nodeFrom: -1, nodeTo: -1, waitUntil: 0, target: null, threat: null, talkWith: 0, bark: '', barkT: 0, weapon: '', fireCd: 0, nextThink: 0,
    seenPlayerT: -99, harmed: false, cuffT: 0,
  };
}

const CHAT = [
  'Tram is late again.', 'Did you see the new stalls by the dome?', 'Third coffee and it is not even five.', 'The floodwall lights come on at dusk now.',
  'I told her the van would be there by noon.', 'Mind the crane, they swing early on Fridays.', 'Best mussels on the quay, no contest.', 'My knees hate Lantern Hill.',
  'They resurfaced Foundry Row twice this year.', 'Is that tide table right? Looks high.', 'Heard the port contract got renewed. Quietly.',
];
const REPLY = ['Always is.', 'Only the copper tiles, honestly.', 'Make it a double.', 'Every night at seven.', 'Ha, noon. Sure.', 'Only on Fridays.', 'Not a chance.', 'Stairs are the real villain.', 'Quietly is how they do it.', 'Tide tables lie.'];
const PANIC = ['Get down!', 'Somebody call someone!', 'Not here, not here!', 'Oh no, oh no!', 'Run!'];
const CALLS = ['Hello? There is someone dangerous near the quay.', 'Yes, I saw the whole thing. Send someone.', 'Police? A car was just taken. Please hurry.', 'I can describe them. Courier jacket, hurry!'];

const SPEEDS = { walk: 1.45, hurry: 2.1, run: 5.2 };

export class PedSystem {
  target = 40;
  private maintainT = 0;
  private perceiveT = 0;
  stats = { spawned: 0, panics: 0, calls: 0, interrupted: 0 };
  private barkCool = 0;

  peds(g: Game): Human[] { return g.humans.filter((h) => h.kind === 'ped'); }

  update(g: Game, dt: number): void {
    this.maintainT -= dt;
    this.barkCool = Math.max(0, this.barkCool - dt);
    if (this.maintainT <= 0) { this.maintainT = 0.4; this.maintain(g); }
    const P = g.player.human;
    for (const h of g.humans) {
      if (h.kind !== 'ped') continue;
      h.stateT += dt;
      h.fear = Math.max(0, h.fear - dt * 0.08);
      h.barkT = Math.max(0, h.barkT - dt);
      const far = Math.hypot(h.x - P.x, h.z - P.z) > 85;
      this.step(g, h, dt, far);
    }
    // soft separation between neighbours (near ones only)
    const near = g.humans.filter((h) => h.kind === 'ped' && h.alive && h.state !== 'Down' && Math.hypot(h.x - P.x, h.z - P.z) < 60);
    for (let i = 0; i < near.length; i++) for (let j = i + 1; j < near.length; j++) {
      const a = near[i];
      const b = near[j];
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const d2 = dx * dx + dz * dz;
      if (d2 > 0.64 || d2 < 1e-6) continue;
      const d = Math.sqrt(d2);
      const push = (0.8 - d) * 0.5;
      a.x -= (dx / d) * push * 0.5; a.z -= (dz / d) * push * 0.5;
      b.x += (dx / d) * push * 0.5; b.z += (dz / d) * push * 0.5;
    }
  }

  // ---------------------------------------------------------------- population
  private maintain(g: Game): void {
    const P = g.player.human;
    const cam = g.cam.pose;
    const list = g.humans;
    let count = 0;
    for (let i = list.length - 1; i >= 0; i--) {
      const h = list[i];
      if (h.kind !== 'ped') continue;
      count++;
      const d = Math.hypot(h.x - P.x, h.z - P.z);
      const seen = g.traffic.inView(cam, h.x, h.z);
      if (h.tag) continue;
      if (d > 150 || (d > 118 && !seen) || (!h.alive && d > 45 && !seen && h.stateT > 60)) {
        list.splice(i, 1);
        count--;
      }
    }
    let tries = 0;
    while (count < this.target && tries++ < 30) {
      const node = g.pedGraph.nodes[g.rng.int(0, g.pedGraph.nodes.length - 1)];
      const d = Math.hypot(node.x - P.x, node.z - P.z);
      if (d < 45 || d > 108) continue;
      if (d < 90 && g.traffic.inView(cam, node.x, node.z)) continue;
      if (Math.abs(node.x) > 244 || Math.abs(node.z) > 244) continue;
      this.spawnWalker(g, node.id);
      count++;
    }
    // stall vendors + plaza musician when the player is close
    for (const s of g.world.props) {
      if (s.kind !== 'stall') continue;
      const d = Math.hypot(s.x - P.x, s.z - P.z);
      const key = 'vendor' + s.id;
      const existing = list.find((h) => h.tag === key);
      if (d < 100 && !existing && s.id % 2 === 0) {
        const h = makeHuman('ped', s.x, s.z + 1.7, 'vendor', 8 + (s.id % 4));
        h.tag = key; h.state = 'Work'; h.heading = Math.PI;
        list.push(h);
      } else if (d > 140 && existing) list.splice(list.indexOf(existing), 1);
    }
  }

  spawnWalker(g: Game, nodeId: number): Human {
    const n = g.pedGraph.nodes[nodeId];
    const rolls = g.rng.next();
    const role = g.world.districtAt(n.x, n.z) === 'Breakwater' && rolls < 0.5 ? 'dock worker' : rolls < 0.5 ? 'commuter' : rolls < 0.62 ? 'tourist' : rolls < 0.7 ? 'courier' : 'resident';
    const h = makeHuman('ped', n.x, n.z, role, g.rng.int(0, 11));
    h.courage = g.rng.next();
    h.hasPhone = g.rng.chance(0.78);
    this.pickNext(g, h, -1, nodeId);
    h.heading = headingTo(g.pedGraph.nodes[h.nodeTo].x - n.x, g.pedGraph.nodes[h.nodeTo].z - n.z);
    g.humans.push(h);
    this.stats.spawned++;
    return h;
  }

  /** Ped stands at node  having come from ; choose the next edge. */
  private pickNext(g: Game, h: Human, prev: number, cur: number, avoidBack = true): void {
    const edges = g.pedGraph.edges[cur];
    let opts = edges.filter((e) => !(avoidBack && e.to === prev));
    if (!opts.length) opts = edges;
    const walk = opts.filter((e) => !e.cross);
    const e = walk.length && g.rng.chance(0.68) ? g.rng.pick(walk) : g.rng.pick(opts);
    h.nodeFrom = cur;
    h.nodeTo = e.to;
    h.stateT = 0;
  }

  // ---------------------------------------------------------------- per-ped logic
  private step(g: Game, h: Human, dt: number, far: boolean): void {
    if (h.state === 'Dead') return;
    if (h.state === 'Down') {
      if (g.t >= h.koUntil && h.alive) { h.state = 'Flee'; h.fear = 0.9; h.hp = Math.max(h.hp, 25); h.stateT = 0; h.threat = { x: g.player.human.x, z: g.player.human.z }; }
      return;
    }
    switch (h.state) {
      case 'Work': {
        h.speed = 0;
        const P = g.player.human;
        if (Math.hypot(P.x - h.x, P.z - h.z) < 10) h.heading = dampAngle(h.heading, headingTo(P.x - h.x, P.z - h.z), 3, dt);
        break;
      }
      case 'WalkRoute': this.walk(g, h, dt, far); break;
      case 'WaitSignal': {
        h.speed = 0;
        const to = g.pedGraph.nodes[h.nodeTo];
        const e = g.pedGraph.edges[h.nodeFrom].find((q) => q.to === h.nodeTo);
        const free = !e || !e.cross || (g.signals.walkOk(g.t, e.trafficAxis!) && !this.carNear(g, h.x, h.z, to.x, to.z));
        if (free) { h.state = 'CrossStreet'; h.stateT = 0; }
        else if (h.stateT > 60) { this.pickNext(g, h, h.nodeTo, h.nodeFrom); h.state = 'WalkRoute'; }
        break;
      }
      case 'CrossStreet': this.cross(g, h, dt); break;
      case 'Browse':
      case 'Talk': {
        h.speed = 0;
        if (h.state === 'Talk') {
          const other = g.humans.find((q) => q.id === h.talkWith);
          if (other && other.alive) h.heading = dampAngle(h.heading, headingTo(other.x - h.x, other.z - h.z), 4, dt);
        }
        if (h.stateT > h.waitUntil) { h.state = 'WalkRoute'; h.stateT = 0; }
        break;
      }
      case 'ReactCurious': {
        h.speed = 0;
        if (h.threat) h.heading = dampAngle(h.heading, headingTo(h.threat.x - h.x, h.threat.z - h.z), 6, dt);
        if (h.stateT > 3.2) { h.state = 'WalkRoute'; h.stateT = 0; }
        break;
      }
      case 'CallEmergency': {
        h.speed = 0;
        h.reportT -= dt;
        if (h.threat) h.heading = dampAngle(h.heading, headingTo(h.threat.x - h.x, h.threat.z - h.z), 4, dt);
        if (h.reportT <= 0) {
          g.police.completeReport(h.reportEvidence, h);
          this.stats.calls++;
          h.state = 'WalkRoute';
          h.stateT = 0;
          h.reportEvidence = 0;
        }
        break;
      }
      case 'Panic':
      case 'Flee': this.flee(g, h, dt); break;
      default: h.state = 'WalkRoute';
    }
    // keep out of walls (near player only)
    if (!far && h.state !== 'Work') {
      const p = { x: h.x, z: h.z };
      resolveHuman(g.world, p, 0.3, 0);
      h.x = p.x; h.z = p.z;
    }
    h.anim += h.speed * dt * 1.9;
  }

  private carNear(g: Game, x: number, z: number, tx: number, tz: number): boolean {
    const mx = (x + tx) / 2;
    const mz = (z + tz) / 2;
    for (const v of g.vehicles) {
      if (!v.alive || Math.abs(v.speed) < 2.5) continue;
      if (Math.hypot(v.x - mx, v.z - mz) < 11) {
        // moving toward the crossing?
        const toX = mx - v.x;
        const toZ = mz - v.z;
        if (toX * v.vx + toZ * v.vz > 0) return true;
      }
    }
    return false;
  }

  private move(g: Game, h: Human, tx: number, tz: number, speed: number, dt: number): number {
    const dx = tx - h.x;
    const dz = tz - h.z;
    const d = Math.hypot(dx, dz);
    if (d < 1e-4) return 0;
    const step = Math.min(d, speed * dt);
    h.x += (dx / d) * step;
    h.z += (dz / d) * step;
    h.vx = (dx / d) * speed;
    h.vz = (dz / d) * speed;
    h.heading = dampAngle(h.heading, Math.atan2(dx, dz), 9, dt);
    h.speed = speed;
    void g;
    return d - step;
  }

  private walk(g: Game, h: Human, dt: number, far: boolean): void {
    if (h.nodeTo < 0) { const n0 = g.pedGraph.nearest(h.x, h.z); this.pickNext(g, h, -1, n0); return; }
    const to = g.pedGraph.nodes[h.nodeTo];
    const e = g.pedGraph.edges[h.nodeFrom]?.find((q) => q.to === h.nodeTo);
    // about to start a crossing: wait for the signal at the kerb
    if (e && e.cross && h.stateT < 0.05) {
      const from = g.pedGraph.nodes[h.nodeFrom];
      if (Math.hypot(h.x - from.x, h.z - from.z) < 1.2 && !(g.signals.walkOk(g.t, e.trafficAxis!) && !this.carNear(g, h.x, h.z, to.x, to.z))) {
        h.state = 'WaitSignal'; h.stateT = 0; return;
      }
    }
    const spd = (h.role === 'courier' ? SPEEDS.hurry : SPEEDS.walk) * (0.9 + (h.variant % 3) * 0.1);
    const rem = this.move(g, h, to.x, to.z, spd, dt);
    if (rem < 0.7) {
      // arrived at node
      this.pickNext(g, h, h.nodeFrom, h.nodeTo);
      // wandering behaviours at corners
      if (!far && h.stateT >= 0) {
        const r = g.rng.next();
        if (r < 0.1) { h.state = 'Browse'; h.waitUntil = g.rng.range(3, 9); h.stateT = 0; }
        else if (r < 0.2) this.tryTalk(g, h);
      }
      const ne = g.pedGraph.edges[h.nodeFrom].find((q) => q.to === h.nodeTo);
      if (ne && ne.cross && h.state === 'WalkRoute') { h.stateT = 0; }
    }
  }

  private tryTalk(g: Game, h: Human): void {
    for (const o of g.humans) {
      if (o === h || o.kind !== 'ped' || o.state !== 'WalkRoute' || !o.alive) continue;
      if (Math.hypot(o.x - h.x, o.z - h.z) < 4) {
        h.state = o.state = 'Talk';
        h.waitUntil = o.waitUntil = g.rng.range(6, 12);
        h.stateT = o.stateT = 0;
        h.talkWith = o.id;
        o.talkWith = h.id;
        if (this.barkCool <= 0 && Math.hypot(h.x - g.player.human.x, h.z - g.player.human.z) < 14) {
          this.barkCool = 9;
          g.emit({ type: 'subtitle', speaker: 'Passer-by', text: g.rng.pick(CHAT), ms: 3200 });
          h.bark = 'chat';
        }
        return;
      }
    }
  }

  private cross(g: Game, h: Human, dt: number): void {
    const to = g.pedGraph.nodes[h.nodeTo];
    const rem = this.move(g, h, to.x, to.z, SPEEDS.hurry * 0.85, dt);
    // a car bearing down: hurry
    if (rem < 0.7) {
      this.pickNext(g, h, h.nodeFrom, h.nodeTo, false);
      h.state = 'WalkRoute';
      h.stateT = 0;
    }
  }

  private flee(g: Game, h: Human, dt: number): void {
    const th = h.threat ?? { x: g.player.human.x, z: g.player.human.z };
    const run = h.state === 'Panic' ? 5.4 : 4.2;
    // choose a graph node away from the threat when we arrive at one
    if (h.nodeTo < 0 || Math.hypot(g.pedGraph.nodes[h.nodeTo].x - h.x, g.pedGraph.nodes[h.nodeTo].z - h.z) < 1.0) {
      const here = h.nodeTo >= 0 ? h.nodeTo : g.pedGraph.nearest(h.x, h.z);
      let best = here;
      let bd = -1;
      for (const e of g.pedGraph.edges[here]) {
        const n = g.pedGraph.nodes[e.to];
        const d = Math.hypot(n.x - th.x, n.z - th.z) + g.rng.range(0, 6) - (e.cross ? 4 : 0);
        if (d > bd) { bd = d; best = e.to; }
      }
      h.nodeFrom = here;
      h.nodeTo = best;
    }
    const to = g.pedGraph.nodes[h.nodeTo];
    this.move(g, h, to.x, to.z, run, dt);
    if (h.state === 'Panic' && h.stateT > 2.5) { h.state = 'Flee'; h.stateT = 0; }
    if (h.state === 'Flee' && (h.stateT > 7 || Math.hypot(h.x - th.x, h.z - th.z) > 60) && h.fear < 0.45) {
      h.state = 'WalkRoute'; h.stateT = 0;
      this.pickNext(g, h, -1, g.pedGraph.nearest(h.x, h.z), false);
    }
  }

  // ---------------------------------------------------------------- reactions
  /** Sound event. kind: gunfire | melee | crash | chirp | horn */
  hear(g: Game, x: number, z: number, radius: number, kind: string, byPlayer: boolean): void {
    for (const h of g.humans) {
      if (h.kind !== 'ped' || !h.alive || h.state === 'Down' || h.state === 'Dead') continue;
      const d = Math.hypot(h.x - x, h.z - z);
      if (d > radius) continue;
      const los = d < radius * 0.35 || g.world.lineOfSight(x, z, h.x, h.z);
      if (!los && d > radius * 0.6) continue;
      if (kind === 'chirp') {
        if (h.state === 'CallEmergency') { h.state = 'ReactCurious'; h.reportT = 0; g.police.cancelReport(h.reportEvidence, h); this.stats.interrupted++; }
        else if (h.state === 'WalkRoute' || h.state === 'Browse') { h.state = 'ReactCurious'; h.threat = { x, z }; h.stateT = 0; }
        continue;
      }
      const intensity = (1 - d / radius) * (los ? 1 : 0.5);
      h.fear = clamp(h.fear + intensity * (0.7 + (1 - h.courage) * 0.9) * (kind === 'gunfire' ? 1.2 : kind === 'crash' ? 0.7 : 0.4), 0, 1.5);
      h.threat = { x, z };
      if (h.fear > 0.55 && (h.state as string) !== 'Panic') {
        if (h.state === 'CallEmergency' && h.courage > 0.5) continue; // braver callers keep talking
        h.state = 'Panic'; h.stateT = 0; h.nodeTo = -1;
        this.stats.panics++;
        if (this.barkCool <= 0 && Math.hypot(h.x - g.player.human.x, h.z - g.player.human.z) < 25) { this.barkCool = 4; g.emit({ type: 'subtitle', speaker: 'Bystander', text: g.rng.pick(PANIC), ms: 1800 }); }
      } else if (h.state === 'WalkRoute' || h.state === 'Browse' || h.state === 'Work') {
        h.state = 'ReactCurious'; h.stateT = 0;
      }
    }
    void byPlayer;
  }

  /** A pedestrian was struck or shot. */
  onHarmed(g: Game, h: Human, source: string): void {
    g.police.witnessHarmed(h);
    h.fear = 1.2;
    if (h.state !== 'Down' && h.state !== 'Dead') { h.state = 'Panic'; h.stateT = 0; h.nodeTo = -1; }
    void source;
  }

  /** Give a pedestrian a phone call to the police for a given evidence record. */
  startCall(g: Game, h: Human, evidenceId: number, delay: number): void {
    h.state = 'CallEmergency';
    h.reportT = delay;
    h.reportEvidence = evidenceId;
    h.stateT = 0;
    if (this.barkCool <= 0 && Math.hypot(h.x - g.player.human.x, h.z - g.player.human.z) < 30) {
      this.barkCool = 5;
      g.emit({ type: 'subtitle', speaker: 'Witness', text: g.rng.pick(CALLS), ms: Math.max(2200, delay * 900) });
    }
  }

  /** Remove a civilian driver from a vehicle; they bail out and run. */
  ejectDriver(g: Game, v: Vehicle): Human | null {
    if (v.driverId === null || v.driverId === 0) return null;
    const side = { x: Math.cos(v.heading), z: -Math.sin(v.heading) };
    const h = makeHuman('ped', v.x - side.x * (v.def.width / 2 + 0.8), v.z - side.z * (v.def.width / 2 + 0.8), 'driver', g.rng.int(0, 11));
    h.state = 'Flee';
    h.fear = 1.2;
    h.threat = { x: g.player.human.x, z: g.player.human.z };
    h.heading = wrapAngle(v.heading + Math.PI / 2);
    h.nodeFrom = g.pedGraph.nearest(h.x, h.z);
    h.nodeTo = -1;
    v.driverId = null;
    g.traffic.release(v.id);
    g.humans.push(h);
    return h;
  }
}

export { canStartCrossing };
