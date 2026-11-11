// Pedestrian population: lightweight agents on the sidewalk graph with schedules, activities,
// signal-aware crossing, perception-driven reactions and witness phone calls.
import type { Sim } from '../game-session/sim';
import { HumanView, Look, Pose } from '../character/character';
import { walkNodes, walkPath, WalkNode, nearestWalkNode } from '../world/roads';
import { surfaceY, zoneAt, Zone, areaAt } from '../world/district';
import { vendorSpots, browseSpots } from '../world/lots';
import { clamp, approachAngle, angleDiff, Rng } from '../core/math';
import { Vehicle } from '../vehicles/vehicle';
import { BARK_PAIRS, REACT_LINES } from './barks';

export type PedState = 'Spawn' | 'WalkRoute' | 'CrossStreet' | 'WaitSignal' | 'Browse' | 'Sit' | 'Talk' | 'WorkLoop' | 'ReactCurious'
  | 'AvoidObstacle' | 'Panic' | 'Flee' | 'Hide' | 'CallEmergency' | 'AssistInjured' | 'Down' | 'Despawn';
export type Role = 'commuter' | 'vendor' | 'dockworker' | 'tourist' | 'courier' | 'musician' | 'resident';

const SKIN = [0xf1c9a5, 0xe0ac86, 0xc68d6a, 0xa5714f, 0x8a5a3c, 0x6a4530];
const HAIR = [0x2a1f1a, 0x4a3524, 0x7a5a3a, 0xb8a078, 0x8a8a8a, 0x1a1a1f, 0x9a4a2a];
const TOPS: Record<Role, number[]> = {
  commuter: [0x4a5a6a, 0x8a9aa3, 0x2f3a4a, 0xd6d4cc, 0x6a7a5a], vendor: [0xd9482b, 0x2a9d6f, 0xf2b134, 0xe8e2d0],
  dockworker: [0xf28a2a, 0xe0d030, 0x3a5a8a], tourist: [0xff7aa0, 0x35c0d0, 0xffd27a, 0x9a7aff, 0xf0f0f0],
  courier: [0x35e0d0, 0xf2b134, 0xd9482b], musician: [0x6a3d9a, 0x2c3036, 0xc2456e], resident: [0xb5644a, 0x7fb7c9, 0xa9c79a, 0xf0b9a0, 0x5d6a72],
};
const BOTTOMS = [0x2c3036, 0x3a4a5a, 0x5a4a3a, 0x4a4a52, 0x6a6a5a, 0x2a3a2a, 0x8a7a66];
const ZONE_W: Record<Zone, number> = { tide: 3.2, glassline: 1.6, canal: 1.3, lantern: 1.0, foundry: 0.7, breakwater: 0.6 };
const ZONE_ROLES: Record<Zone, Role[]> = {
  tide: ['tourist', 'resident', 'commuter', 'tourist', 'courier'], glassline: ['commuter', 'commuter', 'courier', 'tourist'],
  canal: ['resident', 'commuter', 'tourist', 'courier'], lantern: ['resident', 'resident', 'tourist'],
  foundry: ['dockworker', 'dockworker', 'commuter'], breakwater: ['dockworker', 'dockworker', 'courier'],
};
let nextPed = 1;

export class Ped {
  id = nextPed++;
  x = 0; y = 0; z = 0; yaw = 0; speed = 0; baseSpeed = 1.4;
  state: PedState = 'Spawn'; stateT = 0;
  path: number[] = []; pi = 0; off = 0; errands = 2;
  fear = 0.5; curiosity = 0.5; hasPhone = true;
  down = false; gone = false; crossing = false; injured = false; thinker = false;
  tx = 0; tz = 0; threatX = 0; threatZ = 0;
  callT = 0; callCrime = -1; talkTo: Ped | null = null; barkCd = 0;
  phase = 0; gait = 0; scale = 1; fade = 1; waitT = 0; dodgeCd = 0;
  look: Look;
  constructor(public role: Role, rng: Rng) {
    this.look = {
      skin: rng.pick(SKIN), top: rng.pick(TOPS[role]), bottom: rng.pick(BOTTOMS), hair: rng.pick(HAIR),
      hat: role === 'dockworker' ? 4 : role === 'tourist' && rng.chance(0.4) ? 1 : role === 'courier' ? 1 : 0,
      pack: role === 'tourist' || role === 'courier' ? 1 : 0, scale: rng.range(0.92, 1.08),
    };
    this.fear = clamp(rng.range(0.15, 0.95) + (role === 'dockworker' ? -0.15 : role === 'tourist' ? 0.1 : 0), 0, 1);
    this.curiosity = rng.next(); this.hasPhone = rng.chance(0.85);
    this.baseSpeed = rng.range(1.15, 1.65) * (role === 'courier' ? 1.25 : role === 'tourist' ? 0.85 : 1);
    this.off = rng.range(-1.1, 1.1); this.phase = rng.range(0, 6); this.errands = rng.int(1, 3);
  }
  setState(s: PedState, t = 0) { this.state = s; this.stateT = t; }
  view(): HumanView {
    let pose: Pose = 'stand';
    switch (this.state) {
      case 'Down': pose = 'down'; break; case 'Sit': pose = 'sit'; break; case 'Hide': pose = 'cower'; break;
      case 'CallEmergency': pose = 'phone'; break; case 'Talk': case 'WorkLoop': case 'Browse': pose = 'talk'; break;
      case 'AssistInjured': pose = this.speed < 0.1 ? 'crouch' : 'stand'; break;
      case 'Panic': pose = this.speed < 0.2 ? 'handsup' : 'stand'; break;
    }
    return { x: this.x, y: this.y, z: this.z, yaw: this.yaw, phase: this.phase, gait: this.gait, pose, look: this.look, armed: 0, lean: 0 };
  }
  /** Shot, struck or stunned. Lethal force leaves the pedestrian incapacitated (non-graphic). */
  hit(sim: Sim, dmg: number, lethal: boolean, byPlayer: boolean) {
    if (this.gone) return;
    const wasDown = this.down;
    this.down = true; this.injured = this.injured || (lethal && dmg > 0);
    this.setState('Down', this.injured ? 9999 : 6 + sim.rng.next() * 3); this.speed = 0; this.callT = 0; this.callCrime = -1;
    if (byPlayer && !wasDown) {
      sim.player.stats.civiliansHurt++;
      sim.police.crime(lethal && dmg > 0 ? 'assaultLethal' : 'assault', this.x, this.z);
    }
    sim.bus.emit('sfx', { name: 'cry', x: this.x, y: this.y + 1.4, z: this.z });
    sim.bus.emit('noise', { kind: 'scream', x: this.x, z: this.z, radius: 22, byPlayer });
  }
}

export class Pedestrians {
  list: Ped[] = [];
  density = 44;
  enabled = true;
  private spawnT = 0; private thinkT = 0; private doorNodes: WalkNode[] = []; private nodeW: number[] = []; private totalW = 0;
  private vendorsPlaced = false; private force = false;
  /** Ped currently phoning in a crime nearest to the player (for the "talk them down" prompt). */
  caller: Ped | null = null;
  constructor(public sim: Sim) {
    for (const n of walkNodes) { const w = ZONE_W[zoneAt(n.x, n.z)] * (n.door ? 1.6 : n.poi ? 1.3 : 0.6); this.nodeW.push(w); this.totalW += w; if (n.door) this.doorNodes.push(n); }
    sim.bus.on('noise', (n) => this.onNoise(n.kind, n.x, n.z, n.radius, n.byPlayer));
    sim.interactables.push({
      id: 'ped-caller', x: 0, z: 0, r: 2.8, hold: 0.8,
      label: () => (this.caller && this.caller.state === 'CallEmergency' ? 'Hold E — Talk them out of the call' : null),
      use: () => this.talkDown(),
    });
  }
  private talkDown() {
    const p = this.caller, sim = this.sim;
    if (!p || p.state !== 'CallEmergency') return;
    // intimidation only works unarmed and calm; a drawn weapon makes them run and finish the call
    if (!sim.player.lethalArmed && sim.rng.chance(0.7 - p.fear * 0.3)) {
      sim.police.cancelCall(p.callCrime, p.id); p.callCrime = -1; p.callT = 0;
      p.setState('Flee', 6); p.threatX = sim.player.x; p.threatZ = sim.player.z;
      sim.bus.emit('subtitle', { speaker: 'Bystander', text: sim.rng.pick(REACT_LINES.talkedDown) });
    } else { p.callT = Math.min(p.callT, 0.6); sim.bus.emit('subtitle', { speaker: 'Bystander', text: sim.rng.pick(REACT_LINES.refuse) }); }
  }

  private pickNode(near?: { x: number; z: number; r: number }): WalkNode {
    const rng = this.sim.rng;
    if (near) {
      for (let k = 0; k < 12; k++) { const n = rng.pick(walkNodes); if (Math.hypot(n.x - near.x, n.z - near.z) < near.r) return n; }
    }
    let r = rng.next() * this.totalW;
    for (let i = 0; i < walkNodes.length; i++) { r -= this.nodeW[i]; if (r <= 0) return walkNodes[i]; }
    return walkNodes[0];
  }
  private route(p: Ped, from: WalkNode, to: WalkNode) {
    p.path = walkPath(from.id, to.id); p.pi = 0;
    if (p.path.length < 2) { p.path = [from.id]; }
    p.setState('WalkRoute');
  }
  private newErrand(p: Ped) {
    const here = nearestWalkNode(p.x, p.z)!;
    p.errands--;
    let dest: WalkNode;
    if (p.errands < 0) dest = this.doorNodes.length ? this.sim.rng.pick(this.doorNodes.filter((n) => Math.hypot(n.x - p.x, n.z - p.z) < 220)) ?? this.pickNode() : this.pickNode();
    else dest = this.pickNode({ x: p.x, z: p.z, r: p.role === 'tourist' ? 260 : 180 });
    this.route(p, here, dest);
  }
  spawnAt(n: WalkNode, role?: Role): Ped {
    const sim = this.sim, zone = zoneAt(n.x, n.z);
    const p = new Ped(role ?? sim.rng.pick(ZONE_ROLES[zone]), sim.rng);
    p.x = n.x + sim.rng.range(-1, 1); p.z = n.z + sim.rng.range(-1, 1); p.y = surfaceY(p.x, p.z);
    this.list.push(p);
    this.route(p, n, this.pickNode({ x: n.x, z: n.z, r: 200 }));
    return p;
  }
  /** A driver pushed out of their vehicle becomes a frightened (and possibly reporting) pedestrian. */
  spawnEjected(x: number, z: number, byPlayer: boolean, hostile: boolean) {
    const sim = this.sim;
    const p = new Ped('commuter', sim.rng);
    p.x = x; p.z = z; p.y = surfaceY(x, z); p.threatX = sim.player.x; p.threatZ = sim.player.z; p.errands = -1;
    this.list.push(p);
    if (byPlayer && !hostile) sim.bus.emit('subtitle', { speaker: 'Driver', text: sim.rng.pick(REACT_LINES.carjacked) });
    p.setState('Flee', 10 + sim.rng.next() * 5);
    return p;
  }
  private trySpawn() {
    const sim = this.sim, px = sim.player.x, pz = sim.player.z;
    for (let k = 0; k < 8; k++) {
      const n = this.pickNode({ x: px, z: pz, r: 115 });
      const d = Math.hypot(n.x - px, n.z - pz);
      if (d > 118 || d < (this.force ? 8 : 26)) continue;
      if (!this.force && d < 85 && sim.isVisible(n.x, surfaceY(n.x, n.z) + 1, n.z)) continue;
      this.spawnAt(n);
      return;
    }
  }
  private placeVendors() {
    this.vendorsPlaced = true;
    vendorSpots.forEach((s, i) => {
      const p = new Ped(i % 7 === 3 ? 'musician' : 'vendor', this.sim.rng);
      p.x = s.x; p.z = s.z; p.y = surfaceY(s.x, s.z); p.yaw = s.yaw; p.setState('WorkLoop', 1e9); p.tx = s.x; p.tz = s.z;
      this.list.push(p);
    });
  }
  prewarm() {
    if (!this.vendorsPlaced) this.placeVendors();
    this.force = true;
    for (let k = 0; k < 300 && this.count() < this.density; k++) this.trySpawn();
    this.force = false;
  }
  private count() { let n = 0; for (const p of this.list) if (p.state !== 'WorkLoop') n++; return n; }

  // ------------------------------------------------------------------ perception
  private onNoise(kind: string, x: number, z: number, radius: number, byPlayer: boolean) {
    const sim = this.sim;
    for (const p of this.list) {
      if (p.down || p.gone) continue;
      const d = Math.hypot(p.x - x, p.z - z);
      if (d > radius) continue;
      const r = sim.rng.next();
      if (kind === 'gunshot') {
        p.threatX = x; p.threatZ = z;
        if (p.state === 'CallEmergency' && d > 12) continue; // keeps reporting from a distance
        if (d < 28 || r < 0.5) { if (r < 0.2 + p.fear * 0.15 && d < 20) p.setState('Hide', 6 + r * 8); else p.setState('Panic', 0.3 + r * 0.6); }
        else if (r < 0.75 && p.state !== 'Flee') { p.setState('ReactCurious', 3 + r * 3); p.tx = p.x; p.tz = p.z; }
      } else if (kind === 'scream' || kind === 'melee') {
        if (p.state === 'Flee' || p.state === 'Panic' || p.state === 'CallEmergency' || p.state === 'WorkLoop' && d > 8) continue;
        p.threatX = x; p.threatZ = z;
        if (r < 0.35 + p.fear * 0.3) p.setState('Flee', 7 + r * 5);
        else if (r < 0.8) { p.setState('ReactCurious', 3 + r * 3); p.tx = p.x; p.tz = p.z; }
        else if (d < 14) { p.setState('AssistInjured', 12); p.tx = x; p.tz = z; }
      } else if (kind === 'crash') {
        if (p.state !== 'WalkRoute' && p.state !== 'Browse' && p.state !== 'Sit') continue;
        p.threatX = x; p.threatZ = z;
        if (r < 0.2 * p.fear + 0.08 && byPlayer) p.setState('Flee', 5);
        else if (r < 0.6) { p.setState('ReactCurious', 2.5 + r * 3); p.tx = p.x; p.tz = p.z; }
      } else if (kind === 'chirper') {
        if (p.state === 'CallEmergency' && r < 0.5) { sim.police.cancelCall(p.callCrime, p.id); p.callCrime = -1; }
        if ((p.state === 'WalkRoute' || p.state === 'Browse' || p.state === 'CallEmergency') && p.curiosity > 0.25) { p.setState('ReactCurious', 6); p.tx = x + sim.rng.range(-2, 2); p.tz = z + sim.rng.range(-2, 2); p.threatX = x; p.threatZ = z; }
      } else if (kind === 'horn') {
        if (p.state === 'WalkRoute' && d < 10 && r < 0.3) { p.threatX = x; p.threatZ = z; p.setState('ReactCurious', 1.2); p.tx = p.x; p.tz = p.z; }
      }
    }
  }
  /**
   * Called by the police system when a crime happens. Witnesses need plausible sight (or hearing for
   * gunfire) and a phone; each caller takes 2-5 s before the report lands. Returns the caller ids.
   */
  witnessCrime(crimeId: number, x: number, z: number, sightRange: number, hearRange: number, callChance: number, maxCallers: number): number[] {
    const sim = this.sim, out: number[] = [];
    const cands = this.list.filter((p) => !p.down && !p.gone && p.state !== 'CallEmergency' && Math.hypot(p.x - x, p.z - z) < Math.max(sightRange, hearRange))
      .sort((a, b) => Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z));
    for (const p of cands) {
      if (out.length >= maxCallers) break;
      const d = Math.hypot(p.x - x, p.z - z);
      const sees = d < sightRange && sim.losClear(p.x, p.y + 1.6, p.z, x, surfaceY(x, z) + 1.2, z);
      if (!sees && d > hearRange) continue;
      if (!p.hasPhone || !sim.rng.chance(callChance * (sees ? 1 : 0.5) * (0.6 + p.fear * 0.6))) continue;
      p.callCrime = crimeId; p.callT = sim.rng.range(2, 5); p.threatX = x; p.threatZ = z;
      p.setState('CallEmergency', 99);
      (p as any).sawIt = sees;
      out.push(p.id);
    }
    return out;
  }

  // ------------------------------------------------------------------ update
  private moveToward(p: Ped, tx: number, tz: number, speed: number, dt: number): number {
    const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
    if (d > 0.05) {
      const step = Math.min(d, speed * dt);
      p.x += (dx / d) * step; p.z += (dz / d) * step;
      p.yaw = approachAngle(p.yaw, Math.atan2(dx, dz), 8 * dt);
    }
    p.speed = speed;
    return d;
  }
  private fleeStep(p: Ped, speed: number, dt: number) {
    // run along the sidewalk graph, always picking the neighbour that gains the most distance from the threat
    if (p.path.length < 2 || p.pi >= p.path.length - 1) {
      const here = nearestWalkNode(p.x, p.z)!;
      let best = here, bs = -Infinity;
      for (const e of here.edges) {
        const n = walkNodes[e.to];
        const s = Math.hypot(n.x - p.threatX, n.z - p.threatZ) - Math.hypot(here.x - p.threatX, here.z - p.threatZ) + this.sim.rng.next() * 4;
        if (s > bs) { bs = s; best = n; }
      }
      p.path = [here.id, best.id]; p.pi = 0;
    }
    const n = walkNodes[p.path[p.pi + 1]];
    if (this.moveToward(p, n.x + p.off * 0.5, n.z + p.off * 0.5, speed, dt) < 1.2) p.pi++;
  }
  private stepPed(p: Ped, dt: number) {
    const sim = this.sim, rng = sim.rng;
    p.stateT -= dt; p.barkCd -= dt; p.dodgeCd -= dt; p.crossing = false;
    switch (p.state) {
      case 'Spawn': p.setState('WalkRoute'); break;
      case 'WalkRoute': case 'WaitSignal': case 'CrossStreet': {
        if (p.pi >= p.path.length - 1) {
          const n = walkNodes[p.path[p.path.length - 1]];
          if (p.errands < 0 && n.door) { p.setState('Despawn', 0.35); break; }
          if (n.poi === 'sit') p.setState('Sit', rng.range(8, 20));
          else if (n.poi) {
            p.setState('Browse', rng.range(5, 12));
            const bs = browseSpots.length ? rng.pick(browseSpots) : null;
            if (bs && Math.hypot(bs.x - p.x, bs.z - p.z) < 45) { p.tx = bs.x; p.tz = bs.z; (p as any).faceYaw = bs.yaw; } else { p.tx = p.x; p.tz = p.z; (p as any).faceYaw = rng.range(-3, 3); }
          } else this.newErrand(p);
          p.speed = 0; break;
        }
        const a = walkNodes[p.path[p.pi]], b = walkNodes[p.path[p.pi + 1]];
        const edge = a.edges.find((e) => e.to === b.id);
        const cross = edge?.cross ?? null;
        if (cross && p.state !== 'CrossStreet') {
          // wait at the kerb for a walk phase (or a gap on unsignalled streets)
          const atKerb = Math.hypot(p.x - a.x, p.z - a.z) < 2.2;
          if (!atKerb) { this.moveToward(p, a.x + p.off * 0.4, a.z + p.off * 0.4, p.baseSpeed, dt); break; }
          let ok = sim.signals.walkAllowed(cross.inter, cross.axis);
          if (ok || p.waitT > 9) {
            const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2;
            for (const v of sim.vehicles.list) if (v.speedAbs > 2.5 && Math.hypot(v.x - mx, v.z - mz) < 16 && (v.vx * (mx - v.x) + v.vz * (mz - v.z)) > 0) { ok = false; break; }
            if (p.waitT > 16) ok = true;
          }
          if (!ok) { p.speed = 0; p.waitT += dt; p.state = 'WaitSignal'; p.yaw = approachAngle(p.yaw, Math.atan2(b.x - a.x, b.z - a.z), 4 * dt); break; }
          p.waitT = 0; p.setState('CrossStreet');
        }
        if (p.state === 'WaitSignal') p.state = 'WalkRoute';
        const crossing = p.state === 'CrossStreet';
        p.crossing = crossing;
        const sideX = -(b.z - a.z), sideZ = b.x - a.x, sl = Math.hypot(sideX, sideZ) || 1;
        const o = crossing ? p.off * 0.8 : p.off;
        const d = this.moveToward(p, b.x + (sideX / sl) * o, b.z + (sideZ / sl) * o, crossing ? p.baseSpeed * 1.25 : p.baseSpeed, dt);
        if (d < 1.3) { p.pi++; if (crossing) p.setState('WalkRoute'); }
        break;
      }
      case 'Browse': {
        if (Math.hypot(p.tx - p.x, p.tz - p.z) > 0.6) this.moveToward(p, p.tx, p.tz, p.baseSpeed * 0.8, dt);
        else { p.speed = 0; p.yaw = approachAngle(p.yaw, (p as any).faceYaw ?? p.yaw, 3 * dt); }
        if (p.stateT <= 0) this.newErrand(p);
        break;
      }
      case 'Sit': p.speed = 0; if (p.stateT <= 0) this.newErrand(p); break;
      case 'Talk': {
        p.speed = 0;
        if (p.talkTo) p.yaw = approachAngle(p.yaw, Math.atan2(p.talkTo.x - p.x, p.talkTo.z - p.z), 4 * dt);
        if (p.stateT <= 0) { p.talkTo = null; p.barkCd = 30; this.newErrand(p); }
        break;
      }
      case 'WorkLoop': {
        p.speed = 0;
        if (Math.hypot(p.x - p.tx, p.z - p.tz) > 0.5) this.moveToward(p, p.tx, p.tz, 1.3, dt);
        break;
      }
      case 'ReactCurious': {
        if (Math.hypot(p.tx - p.x, p.tz - p.z) > 1.5) this.moveToward(p, p.tx, p.tz, p.baseSpeed, dt); else { p.speed = 0; p.yaw = approachAngle(p.yaw, Math.atan2(p.threatX - p.x, p.threatZ - p.z), 5 * dt); }
        if (p.stateT <= 0) { if (p.role === 'vendor' || p.role === 'musician') { p.setState('WorkLoop', 1e9); const s = vendorSpots.find((v) => Math.hypot(v.x - p.x, v.z - p.z) < 30); if (s) { p.tx = s.x; p.tz = s.z; } } else this.newErrand(p); }
        break;
      }
      case 'AvoidObstacle': {
        this.moveToward(p, p.tx, p.tz, 4.5, dt);
        if (p.stateT <= 0) { p.path = []; if (p.fear > 0.5) p.setState('Flee', 4); else this.newErrand(p); }
        break;
      }
      case 'Panic': {
        p.speed = 0; p.yaw = approachAngle(p.yaw, Math.atan2(p.threatX - p.x, p.threatZ - p.z), 6 * dt);
        if (p.stateT <= 0) { p.path = []; p.setState('Flee', 9 + rng.next() * 6); }
        break;
      }
      case 'Flee': {
        this.fleeStep(p, 3.6 + p.fear * 1.4 - (p.injured ? 2 : 0), dt);
        if (p.stateT <= 0 && Math.hypot(p.x - p.threatX, p.z - p.threatZ) > 45) { if (p.role === 'vendor' || p.role === 'musician') { p.setState('ReactCurious', 1); } else { p.errands = Math.max(p.errands, 0); this.newErrand(p); } }
        break;
      }
      case 'Hide': p.speed = 0; if (p.stateT <= 0) { p.path = []; p.setState('Flee', 6); } break;
      case 'CallEmergency': {
        p.speed = 0; p.yaw = approachAngle(p.yaw, Math.atan2(p.threatX - p.x, p.threatZ - p.z), 3 * dt);
        if (p.callCrime < 0) { p.path = []; p.setState('Flee', 6); break; }
        p.callT -= dt;
        if (p.callT <= 0) { sim.police.completeCall(p.callCrime, p.id, !!(p as any).sawIt); p.callCrime = -1; p.path = []; p.setState('Flee', 8); }
        break;
      }
      case 'AssistInjured': {
        if (Math.hypot(p.tx - p.x, p.tz - p.z) > 1.6) this.moveToward(p, p.tx, p.tz, 2.6, dt); else p.speed = 0;
        if (p.stateT <= 0) this.newErrand(p);
        break;
      }
      case 'Down': {
        p.speed = 0;
        if (p.stateT <= 0 && !p.injured) { p.down = false; p.threatX = sim.player.x; p.threatZ = sim.player.z; p.path = []; p.injured = false; p.setState('Flee', 10); }
        break;
      }
      case 'Despawn': p.fade = Math.max(0, p.stateT / 0.35); if (p.stateT <= 0) p.gone = true; break;
    }
    p.y = surfaceY(p.x, p.z);
    p.gait += ((p.speed / 4.4) - p.gait) * Math.min(1, dt * 8);
    p.phase += dt * (2.2 + p.speed * 1.6);
  }
  /** Reactions that need sight of the player: drawn weapons and vehicles about to hit them. */
  private think(p: Ped) {
    const sim = this.sim, pl = sim.player;
    if (p.down || p.state === 'Flee' || p.state === 'Panic' || p.state === 'CallEmergency' || p.state === 'Hide') return;
    const d = Math.hypot(pl.x - p.x, pl.z - p.z);
    if (pl.lethalArmed && d < 11 && sim.losClear(p.x, p.y + 1.6, p.z, pl.x, pl.y + 1.3, pl.z)) {
      p.threatX = pl.x; p.threatZ = pl.z;
      if (pl.aiming && d < 7) p.setState('Panic', 0.6 + sim.rng.next()); else if (sim.rng.chance(0.5)) { p.path = []; p.setState('Flee', 6); }
      if (p.barkCd <= 0 && d < 8) { p.barkCd = 12; sim.bus.emit('subtitle', { speaker: 'Bystander', text: sim.rng.pick(REACT_LINES.weapon) }); }
      return;
    }
    // idle chatter between neighbours
    if (p.barkCd <= 0 && (p.state === 'Browse' || p.state === 'Sit') && sim.rng.chance(0.15)) {
      for (const q of this.list) {
        if (q === p || q.down || (q.state !== 'Browse' && q.state !== 'Sit' && q.state !== 'WorkLoop') || q.barkCd > 0) continue;
        if (Math.hypot(q.x - p.x, q.z - p.z) < 3.5) {
          p.talkTo = q; p.setState('Talk', 6); if (q.state !== 'WorkLoop') { q.talkTo = p; q.setState('Talk', 6); } q.barkCd = 25;
          if (d < 11) {
            const tags = [zoneAt(p.x, p.z) as string, sim.weather.raining ? 'rain' : 'dry', sim.clock.night > 0.5 ? 'night' : 'day'];
            const pool = BARK_PAIRS.filter((b) => !b.tag || tags.includes(b.tag));
            const pair = sim.rng.pick(pool);
            sim.bus.emit('subtitle', { speaker: 'Passer-by', text: pair.a, dur: 3 });
            sim.schedule(3.1, () => sim.bus.emit('subtitle', { speaker: 'Passer-by', text: pair.b, dur: 3 }));
          }
          break;
        }
      }
    }
  }
  private vehicleContact(p: Ped) {
    const sim = this.sim;
    for (const v of sim.vehicles.list) {
      const dx = p.x - v.x, dz = p.z - v.z;
      if (dx * dx + dz * dz > 64 || Math.abs(v.y - p.y) > 2.5 || v.asleep) continue;
      const c = Math.cos(v.yaw), s = Math.sin(v.yaw);
      const lx = dx * c - dz * s, lz = dx * s + dz * c;
      const hw = v.spec.width / 2 + 0.28, hl = v.spec.length / 2 + 0.28;
      const inside = Math.abs(lx) < hw && Math.abs(lz) < hl;
      if (inside) {
        if (p.down) continue;
        const byPlayer = v.driver === 'player';
        if (v.speedAbs > 3.2) this.knock(p, v, byPlayer);
        else { const side = lx >= 0 ? 1 : -1, push = hw - Math.abs(lx) + 0.02; p.x += c * side * push; p.z -= s * side * push; }
        return;
      }
      // dodge vehicles bearing down on them
      if (!p.down && p.thinker && p.dodgeCd <= 0 && v.speedAbs > 5 && p.state !== 'AvoidObstacle' && p.state !== 'WorkLoop') {
        const along = lz * Math.sign(v.speed || 1);
        if (along > 0 && along < v.speedAbs * 0.9 + 3 && Math.abs(lx) < hw + 0.8 && areaAt(p.x, p.z).kind !== 'road' || (along > 0 && along < v.speedAbs * 0.6 + 2 && Math.abs(lx) < hw + 0.5)) {
          const side = lx >= 0 ? 1 : -1;
          p.tx = p.x + c * side * 2.6; p.tz = p.z - s * side * 2.6; p.threatX = v.x; p.threatZ = v.z;
          p.setState('AvoidObstacle', 0.6); p.dodgeCd = 2.5;
          if (v.driver === 'player' && p.barkCd <= 0) { p.barkCd = 10; sim.bus.emit('subtitle', { speaker: 'Pedestrian', text: sim.rng.pick(REACT_LINES.dodge), dur: 2.2 }); }
          return;
        }
      }
    }
  }
  private knock(p: Ped, v: Vehicle, byPlayer: boolean) {
    const sim = this.sim, hard = v.speedAbs > 10;
    p.down = true; p.injured = hard; p.setState('Down', hard ? 9999 : 4 + sim.rng.next() * 3);
    p.x += (v.vx / v.speedAbs) * 1.2; p.z += (v.vz / v.speedAbs) * 1.2;
    sim.bus.emit('sfx', { name: 'thud', x: p.x, y: p.y + 1, z: p.z });
    sim.bus.emit('noise', { kind: 'scream', x: p.x, z: p.z, radius: 24, byPlayer });
    if (byPlayer) {
      sim.player.stats.civiliansHurt++;
      sim.police.crime(hard ? 'collisionInjury' : 'collisionMinor', p.x, p.z, { vehicle: v });
      sim.bus.emit('shake', { amount: 0.4 });
    }
  }

  update(dt: number) {
    const sim = this.sim, pl = sim.player;
    if (!this.vendorsPlaced) this.placeVendors();
    this.thinkT -= dt;
    const doThink = this.thinkT <= 0;
    if (doThink) {
      this.thinkT = 0.25;
      // only the nearest agents get full perception (line-of-sight queries)
      const sorted = this.list.filter((p) => !p.gone).sort((a, b) => Math.hypot(a.x - pl.x, a.z - pl.z) - Math.hypot(b.x - pl.x, b.z - pl.z));
      sorted.forEach((p, i) => { p.thinker = i < 18; });
      this.caller = null;
      for (const p of sorted) if (p.state === 'CallEmergency' && Math.hypot(p.x - pl.x, p.z - pl.z) < 12) { this.caller = p; break; }
      const it = sim.interactables.find((i) => i.id === 'ped-caller')!;
      if (this.caller) { it.x = this.caller.x; it.z = this.caller.z; }
    }
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      if (p.gone) { this.list.splice(i, 1); continue; }
      this.stepPed(p, dt);
      if (doThink && p.thinker) this.think(p);
      this.vehicleContact(p);
      // keep clear of the player on foot
      if (!pl.vehicle && !p.down) {
        const dx = p.x - pl.body.x, dz = p.z - pl.body.z, d = Math.hypot(dx, dz);
        if (d < 0.65 && d > 0.01 && Math.abs(p.y - pl.body.y) < 1.5) { p.x += (dx / d) * (0.65 - d); p.z += (dz / d) * (0.65 - d); }
      }
      const dist = Math.hypot(p.x - pl.x, p.z - pl.z);
      if (dist > 140 && p.state !== 'WorkLoop' && !sim.isVisible(p.x, p.y + 1, p.z)) p.gone = true;
      else if (dist > 150 && p.down) p.gone = true;
    }
    // soft separation between neighbours
    if (sim.tick % 2 === 0) {
      const L = this.list;
      for (let i = 0; i < L.length; i++) {
        const a = L[i]; if (a.down || a.state === 'WorkLoop') continue;
        for (let j = i + 1; j < L.length; j++) {
          const b = L[j]; if (b.down) continue;
          const dx = b.x - a.x, dz = b.z - a.z;
          if (Math.abs(dx) > 0.7 || Math.abs(dz) > 0.7) continue;
          const d = Math.hypot(dx, dz);
          if (d < 0.6 && d > 0.01) { const k = (0.6 - d) / d / 2; a.x -= dx * k; a.z -= dz * k; if (b.state !== 'WorkLoop') { b.x += dx * k; b.z += dz * k; } }
        }
      }
    }
    if (!this.enabled) return;
    this.spawnT -= dt;
    const target = Math.round(this.density * (1 - 0.35 * sim.clock.night) * (sim.weather.raining ? 0.7 : 1));
    if (this.spawnT <= 0 && this.count() < target) { this.spawnT = 0.15; this.trySpawn(); }
  }
}
void angleDiff;
