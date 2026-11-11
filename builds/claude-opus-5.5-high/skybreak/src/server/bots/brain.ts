// Server bots. They produce ordinary InputFrames that go through the same
// authoritative movement/combat code as humans. Perception is limited to
// sight (FOV + range + line of sight, blocked by mist), heard gunshots and
// footsteps, and damage direction. Difficulty only changes reaction, aim
// noise, loot efficiency and risk — never health, damage or vision.

import { Rng } from '../../shared/rng';
import { BTN, InputFrame, Slot } from '../../shared/protocol/messages';
import { WEAPONS, weaponStats, WeaponId, AMMO_CAPS, WeaponClass } from '../../shared/content/weapons';
import { ITEMS } from '../../shared/content/items';
import { HEALTH_MAX } from '../../shared/content/rules';
import { cameraRig } from '../../shared/sim/aim';
import { wrapAngle } from '../../shared/math';
import type { Match } from '../match';
import type { Player, LootItem, Container } from '../types';
import { smokeBlocks } from '../combat';

export type BotState =
  | 'ChooseDrop' | 'Freefall' | 'InitialLoot' | 'AssessLoadout' | 'Rotate' | 'SeekAdvantage'
  | 'AvoidThreat' | 'Engage' | 'DisengageHeal' | 'LootKill' | 'FinalField' | 'Staging';

const CLASS_RANGE: Record<WeaponClass, [number, number]> = {
  shotgun: [0, 14], smg: [0, 28], carbine: [4, 55], rifle: [8, 110], pistol: [0, 40], dmr: [25, 260], rail: [40, 400], launcher: [6, 35],
};
const CLASS_VALUE: Record<WeaponClass, number> = { rifle: 7, carbine: 6.5, shotgun: 6.5, smg: 6, dmr: 6, rail: 5, pistol: 3, launcher: 3 };

export class BotBrain {
  rng: Rng;
  skill: number;
  aggression: number;
  state: BotState = 'Staging';
  dropTarget: { x: number; z: number } | null = null;
  dropLoc = -1;
  jumpAt = 0.5;
  // navigation
  path: { x: number; z: number }[] = [];
  pathIdx = 0;
  pathGoal: { x: number; z: number } | null = null;
  repathAt = 0;
  stuck = { x: 0, z: 0, t: 0, n: 0 };
  sideStepUntil = 0;
  sideDir = 1;
  detour: { x: number; z: number; until: number } | null = null;
  // goals
  goal: { x: number; z: number; kind: 'loot' | 'container' | 'move'; id: number } | null = null;
  goalSince = 0;
  blacklist = new Set<number>();
  rotatePoint: { x: number; z: number; phase: number } | null = null;
  // combat
  target = -1;
  lastSeen = -100;
  lastKnown: { x: number; y: number; z: number } | null = null;
  reactionUntil = 0;
  aimYaw = 0;
  aimPitch = 0;
  errYaw = 0;
  errPitch = 0;
  errAt = 0;
  strafe = 1;
  strafeUntil = 0;
  burstUntil = 0;
  pauseUntil = 0;
  fireToggle = false;
  recoilP = 0;
  recoilY = 0;
  thinkAt = 0;
  perceiveAt = 0;
  heard: { x: number; z: number; t: number } | null = null;
  damagedBy: { id: number; t: number } | null = null;
  killCache: { x: number; z: number; t: number } | null = null;
  interactUntil = 0;
  useCooldown = 0;
  lastUtility = 0;
  seq = 0;
  wantSlot = 0;

  constructor(public p: Player, seed: number) {
    this.rng = new Rng(Math.floor(seed * 0xffffffff) ^ p.id);
    this.skill = 0.25 + this.rng.next() * 0.65;
    this.aggression = this.rng.next();
    this.aimYaw = p.ms.yaw;
  }

  applyRecoil(p: number, y: number) {
    // bots compensate imperfectly: recoil lands on their aim, then they pull back
    this.recoilP += (p * Math.PI) / 180;
    this.recoilY += (y * Math.PI) / 180;
  }

  onSkiff(m: Match) {
    this.state = 'ChooseDrop';
    const s = m.skiff!;
    const dx = s.bx - s.ax, dz = s.bz - s.az;
    const L = Math.hypot(dx, dz);
    const ux = dx / L, uz = dz / L;
    // candidate drops: named locations + landmarks + random sockets (unpopular drops)
    const cands: { x: number; z: number; tier: number; loc: number }[] = [];
    for (const l of m.island.locations) if (l.kind !== 'pier') cands.push({ x: l.x, z: l.z, tier: l.tier, loc: l.id });
    for (let i = 0; i < 6; i++) {
      const so = m.island.sockets[this.rng.int(0, m.island.sockets.length - 1)];
      cands.push({ x: so.x, z: so.z, tier: 0.5, loc: -1 - i });
    }
    const crowd = new Map<number, number>();
    for (const q of m.players) if (q.bot && q.bot.dropLoc >= 0) crowd.set(q.bot.dropLoc, (crowd.get(q.bot.dropLoc) ?? 0) + 1);
    let best = cands[0], bestScore = -Infinity, bestT = 0.5;
    const risk = this.aggression;
    for (const c of cands) {
      const t = ((c.x - s.ax) * ux + (c.z - s.az) * uz) / L;
      const px = s.ax + dx * t, pz = s.az + dz * t;
      const perp = Math.hypot(c.x - px, c.z - pz);
      if (perp > 300 || t < 0.08 || t > 0.92) continue;
      if (Math.hypot(px, pz) > 560 && perp > 120) continue;
      const pop = crowd.get(c.loc) ?? 0;
      const score = c.tier * (1 + risk) * 1.5 - pop * (2.6 - risk * 2) - perp / 120 + this.rng.next() * 3;
      if (score > bestScore) { bestScore = score; best = c; bestT = t; }
    }
    this.dropTarget = { x: best.x + this.rng.range(-12, 12), z: best.z + this.rng.range(-12, 12) };
    this.dropLoc = best.loc;
    // jump a little before closest approach so freefall + glide can cover the lateral distance
    this.jumpAt = Math.max(0.05, bestT - 0.03 - this.rng.next() * 0.05);
  }

  onDamaged(m: Match, src: Player) {
    this.damagedBy = { id: src.id, t: m.time };
    // damage gives direction knowledge (approximate position)
    if (this.target < 0 || m.time - this.lastSeen > 1) {
      this.lastKnown = { x: src.ms.x + this.rng.range(-4, 4), y: src.ms.y, z: src.ms.z + this.rng.range(-4, 4) };
      this.heard = { x: this.lastKnown.x, z: this.lastKnown.z, t: m.time };
    }
  }

  onKill(m: Match, victim: Player) {
    this.killCache = { x: victim.ms.x, z: victim.ms.z, t: m.time };
    this.target = -1;
  }

  // ------------------------------------------------------------ main
  think(m: Match, p: Player, dt: number): InputFrame {
    const s = p.ms;
    const out: InputFrame = { seq: ++this.seq, mx: 0, mz: 0, yaw: this.aimYaw, pitch: this.aimPitch, buttons: 0, slot: p.sel };
    // recoil recovery
    this.aimPitch += this.recoilP * 0.6;
    this.aimYaw += this.recoilY * 0.6;
    this.recoilP *= 0.25; this.recoilY *= 0.25;

    if (m.phase === 'staging') return this.staging(m, p, out);
    if (s.mode === 'skiff') {
      this.state = 'ChooseDrop';
      if (m.skiff && m.skiff.t >= this.jumpAt && m.skiffJumpOpen() && !(p.prevButtons & BTN.jump)) out.buttons |= BTN.jump;
      return out;
    }
    if (s.mode === 'freefall' || s.mode === 'glide') {
      this.state = 'Freefall';
      const t = this.dropTarget ?? { x: 0, z: 0 };
      const dx = t.x - s.x, dz = t.z - s.z;
      const d = Math.hypot(dx, dz);
      const yaw = Math.atan2(dx, dz);
      this.aimYaw = yaw;
      out.yaw = yaw;
      const alt = s.y - m.w.terrain(s.x, s.z);
      if (s.mode === 'freefall') {
        // dive when nearly above target, otherwise travel
        out.pitch = d < alt * 0.4 ? -1.2 : -0.3;
        out.mz = 1;
        if (d > alt * 1.1 && alt < 230 && alt > 80) out.buttons |= BTN.deploy; // deploy early for range
      } else {
        out.pitch = -0.3;
        out.mz = d > 8 ? 1 : 0;
      }
      this.aimPitch = out.pitch;
      return out;
    }

    // perception at ~5Hz, staggered by id
    if (m.time >= this.perceiveAt) {
      this.perceiveAt = m.time + 0.2 + (p.id % 5) * 0.004;
      this.perceive(m, p);
    }
    if (m.time >= this.thinkAt) {
      this.thinkAt = m.time + 0.25;
      this.decide(m, p);
    }
    switch (this.state) {
      case 'Engage': this.engage(m, p, out, dt); break;
      case 'DisengageHeal': this.heal(m, p, out); break;
      case 'InitialLoot': case 'LootKill': case 'AssessLoadout': this.loot(m, p, out); break;
      case 'Rotate': case 'FinalField': case 'SeekAdvantage': case 'AvoidThreat': this.rotate(m, p, out); break;
      default: this.rotate(m, p, out);
    }
    if (this.state !== 'Engage') {
      // ease aim toward travel direction
      out.pitch = this.aimPitch = this.aimPitch * 0.9;
      out.yaw = this.aimYaw;
    }
    // reload when idle
    const sl = p.slots[p.sel];
    if (sl?.kind === 'weapon' && this.state !== 'Engage' && sl.mag < weaponStats(sl.w, sl.r).mag * 0.6 && p.ammo[WEAPONS[sl.w].ammo] > 0 && p.reloadEnd === 0) {
      if (!(p.prevButtons & BTN.reload)) out.buttons |= BTN.reload;
    }
    out.slot = this.wantSlot;
    return out;
  }

  private staging(m: Match, p: Player, out: InputFrame): InputFrame {
    // light wandering on the pier
    if (m.time >= this.thinkAt) {
      this.thinkAt = m.time + 1 + this.rng.next() * 2;
      this.strafe = this.rng.chance(0.5) ? 0 : 1;
      this.aimYaw = this.rng.next() * Math.PI * 2;
    }
    const pier = m.island.pier;
    const s = p.ms;
    if (s.x < pier.minX + 4 || s.x > pier.maxX - 4 || s.z < pier.minZ + 4 || s.z > pier.maxZ - 4) {
      this.aimYaw = Math.atan2((pier.minX + pier.maxX) / 2 - s.x, (pier.minZ + pier.maxZ) / 2 - s.z);
      this.strafe = 1;
    }
    out.yaw = this.aimYaw;
    out.mz = this.strafe * 0.6;
    out.slot = 0;
    return out;
  }

  // ------------------------------------------------------------ perception
  private perceive(m: Match, p: Player) {
    const s = p.ms;
    const eye = { x: s.x, y: s.y + 1.55, z: s.z };
    const range = 120 + this.skill * 70;
    let best: Player | null = null, bd = Infinity;
    for (const q of m.players) {
      if (q === p || !q.alive || q.isDummy || q.ms.mode === 'skiff') continue;
      const dx = q.ms.x - s.x, dz = q.ms.z - s.z;
      const d = Math.hypot(dx, dz);
      if (d > range) continue;
      const ang = Math.abs(wrapAngle(Math.atan2(dx, dz) - s.yaw));
      const isCurrent = q.id === this.target && m.time - this.lastSeen < 1.5;
      if (ang > 1.3 && d > 10 && !isCurrent) continue;
      const tgt = { x: q.ms.x, y: q.ms.y + (q.ms.crouch ? 0.9 : 1.3), z: q.ms.z };
      if (smokeBlocks(m.smokes, eye, tgt)) continue;
      if (!m.w.lineOfSight(eye, tgt)) continue;
      // crouched players at long range in cover are harder to spot
      const eff = d * (q.ms.crouch ? 1.35 : 1) * (q.ms.sprinting ? 0.85 : 1);
      if (eff > range) continue;
      const score = eff - (isCurrent ? 25 : 0);
      if (score < bd) { bd = score; best = q; }
    }
    if (best) {
      if (best.id !== this.target || m.time - this.lastSeen > 2) {
        this.reactionUntil = m.time + (0.8 - this.skill * 0.5) + this.rng.next() * 0.25;
        this.errYaw = this.rng.range(-1, 1) * 0.08;
        this.errPitch = this.rng.range(-1, 1) * 0.05;
      }
      this.target = best.id;
      this.lastSeen = m.time;
      this.lastKnown = { x: best.ms.x, y: best.ms.y, z: best.ms.z };
    }
    // hearing: recent gunshots / damage
    for (const n of m.noise) {
      if (n.by === p.id || m.time - n.t > 1) continue;
      const d = Math.hypot(n.x - s.x, n.z - s.z);
      if (d < n.r * 0.8 && (!this.heard || m.time - this.heard.t > 3)) {
        this.heard = { x: n.x + this.rng.range(-8, 8), z: n.z + this.rng.range(-8, 8), t: m.time };
      }
    }
  }

  // ------------------------------------------------------------ strategy
  private decide(m: Match, p: Player) {
    const s = p.ms;
    const hp = p.health + p.aegis + p.reserve;
    const tgtVisible = this.target >= 0 && m.time - this.lastSeen < 0.6 && m.players[this.target]?.alive;
    const storm = m.stormNow;
    const outside = Math.hypot(s.x - storm.cur.x, s.z - storm.cur.z) > storm.cur.r - 6;
    const weapons = this.usableWeapons(p);
    const urgentStorm = outside && m.stormStart >= 0 && (storm.damage >= 4 || p.health < 60 || storm.stage === 'shrink');
    if (urgentStorm && !(tgtVisible && this.distTo(m, p, this.target) < 15)) { this.state = 'Rotate'; return; }
    if (tgtVisible && weapons.length) {
      // retreat when badly hurt and the enemy is not almost dead
      if (hp < 45 && this.hasHeals(p) && this.rng.next() < 0.5 - this.aggression * 0.3) { this.state = 'DisengageHeal'; return; }
      this.state = 'Engage';
      return;
    }
    if (tgtVisible && !weapons.length) {
      const q = m.players[this.target];
      const armed = q.slots.some((x) => x?.kind === 'weapon');
      const d = this.distTo(m, p, this.target);
      const late = (storm.next?.r ?? storm.cur.r) <= 70 && m.stormStart >= 0;
      if (d < 7 || late) { this.state = 'Engage'; return; } // brawl with quick melee
      if (armed && d < 25) { this.state = 'AvoidThreat'; return; }
    }
    if (this.needsHeal(p) && m.time - p.lastDamage > 1.2) { this.state = 'DisengageHeal'; return; }
    if (this.killCache && m.time - this.killCache.t < 25 && !outside) { this.state = 'LootKill'; return; }
    const nextR = storm.next?.r ?? storm.cur.r;
    if (nextR <= 70 && m.stormStart >= 0) { this.state = 'FinalField'; return; }
    const loadoutGood = weapons.length >= 2 && this.healCount(p) >= 2;
    const nearbyLoot = this.findLootGoal(m, p, loadoutGood ? 18 : weapons.length ? 50 : 90);
    if (nearbyLoot && !this.stormPressing(m, p)) {
      this.state = weapons.length ? 'AssessLoadout' : 'InitialLoot';
      this.setGoal(m, nearbyLoot);
      return;
    }
    // investigate a fight if aggressive and equipped
    if (this.heard && m.time - this.heard.t < 6 && weapons.length && this.aggression > 0.55 && !this.stormPressing(m, p)) {
      this.state = 'SeekAdvantage';
      return;
    }
    this.state = 'Rotate';
  }

  private stormPressing(m: Match, p: Player) {
    if (m.stormStart < 0) return false;
    const st = m.stormNow;
    const n = st.next ?? st.cur;
    const myDist = Math.hypot(p.ms.x - n.x, p.ms.z - n.z);
    const need = myDist - n.r; // metres to walk to be safe
    if (need <= 0) return false;
    // when will the wall reach my position? (linear shrink toward the next field)
    const rNow = st.cur.r;
    let tReach: number;
    if (st.stage === 'shrink') {
      const v = Math.max(0.01, (rNow - n.r) / Math.max(1, st.endsIn));
      tReach = Math.max(0, (rNow - myDist) / v);
    } else {
      tReach = st.endsIn + Math.max(0, rNow - myDist) / 3;
    }
    return need / 5.2 > tReach * 0.75 || tReach < 12;
  }

  private distTo(m: Match, p: Player, id: number) {
    const q = m.players[id];
    return q ? Math.hypot(q.ms.x - p.ms.x, q.ms.z - p.ms.z) : Infinity;
  }

  private usableWeapons(p: Player) {
    const out: number[] = [];
    p.slots.forEach((sl, i) => {
      if (sl?.kind === 'weapon' && (sl.mag > 0 || p.ammo[WEAPONS[sl.w].ammo] > 0)) out.push(i);
    });
    return out;
  }
  private healCount(p: Player) {
    let n = 0;
    for (const sl of p.slots) if (sl?.kind === 'item' && (ITEMS[sl.id].kind === 'heal' || ITEMS[sl.id].kind === 'shield')) n += sl.n;
    return n;
  }
  private hasHeals(p: Player) { return this.healCount(p) > 0; }
  private needsHeal(p: Player) {
    for (const sl of p.slots) {
      if (sl?.kind !== 'item') continue;
      if ((sl.id === 'med' || sl.id === 'trauma') && p.health < 70) return true;
      if (sl.id === 'flask' && p.reserve < 30) return true;
      if (sl.id === 'aegis_cell' && p.aegis < 20) return true;
    }
    return false;
  }

  // ------------------------------------------------------------ loot planner
  private weaponValue(w: WeaponId, r: number) { return CLASS_VALUE[WEAPONS[w].cls] + r * 1.2; }

  private lootValue(p: Player, it: LootItem): number {
    if (it.kind === 'ammo') {
      const uses = p.slots.some((sl) => sl?.kind === 'weapon' && WEAPONS[sl.w].ammo === it.ammo);
      if (!uses || p.ammo[it.ammo!] >= AMMO_CAPS[it.ammo!] * 0.6) return 0;
      return p.ammo[it.ammo!] < 20 ? 9 : 5;
    }
    if (it.kind === 'item') {
      const def = ITEMS[it.item!];
      const stackable = p.slots.some((sl) => sl?.kind === 'item' && sl.id === it.item && sl.n < def.stack);
      const free = p.slots.includes(null);
      if (!stackable && !free) return 0;
      if (def.kind === 'heal' || def.kind === 'shield') return stackable ? 4.5 : 3.5;
      return free && p.slots.filter((x) => x === null).length > 1 ? 1.5 : 0;
    }
    const weapons = p.slots.filter((sl) => sl?.kind === 'weapon') as Extract<Slot, { kind: 'weapon' }>[];
    const v = this.weaponValue(it.w!, it.r!);
    if (weapons.some((wp) => wp.w === it.w && wp.r >= it.r!)) return 0;
    if (weapons.length < 2) return 10 + v;
    if (weapons.length < 3 && p.slots.includes(null)) return 3 + v * 0.5;
    const worst = Math.min(...weapons.map((wp) => this.weaponValue(wp.w, wp.r)));
    return v > worst + 1.5 ? 4 + (v - worst) : 0;
  }

  private findLootGoal(m: Match, p: Player, radius: number): BotBrain['goal'] {
    const s = p.ms;
    let best: BotBrain['goal'] = null, bs = 0.5;
    const eff = 0.06 + (1 - this.skill) * 0.08; // less efficient bots overweight distance
    for (const it of m.loot.values()) {
      if (this.blacklist.has(it.id) || it.droppedBy === p.id) continue;
      const dx = it.x - s.x, dz = it.z - s.z;
      if (Math.abs(dx) > radius || Math.abs(dz) > radius) continue;
      const d = Math.hypot(dx, dz);
      if (d > radius || Math.abs(it.y - s.y) > 8) continue;
      const v = this.lootValue(p, it);
      if (v <= 0) continue;
      const sc = v - d * eff;
      if (sc > bs) { bs = sc; best = { x: it.x, z: it.z, kind: 'loot', id: it.id }; }
    }
    for (const c of m.containers) {
      if (c.opened || this.blacklist.has(c.id)) continue;
      const d = Math.hypot(c.x - s.x, c.z - s.z);
      if (d > radius * 1.2 || Math.abs(c.y - s.y) > 8) continue;
      const v = c.kind === 'capsule' || c.kind === 'caravan' ? 14 : c.kind === 'cache' ? 9 : c.kind === 'chest' ? 8 : 5;
      const sc = v - d * eff;
      if (sc > bs) { bs = sc; best = { x: c.x, z: c.z, kind: 'container', id: c.id }; }
    }
    return best;
  }

  private setGoal(m: Match, g: NonNullable<BotBrain['goal']>) {
    if (!this.goal || this.goal.id !== g.id || this.goal.kind !== g.kind) { this.goal = g; this.goalSince = m.time; }
  }

  private loot(m: Match, p: Player, out: InputFrame) {
    const s = p.ms;
    if (this.state === 'LootKill' && this.killCache) {
      const cache = m.containers.find((c) => c.kind === 'cache' && !c.opened && Math.hypot(c.x - this.killCache!.x, c.z - this.killCache!.z) < 3);
      if (cache) this.setGoal(m, { x: cache.x, z: cache.z, kind: 'container', id: cache.id });
      else {
        const g = this.findLootGoal(m, p, 15);
        if (g) this.setGoal(m, g); else { this.killCache = null; this.state = 'Rotate'; return; }
      }
    }
    const g = this.goal;
    if (!g) return;
    const exists = g.kind === 'loot' ? m.loot.has(g.id) : !!m.containers.find((c) => c.id === g.id && !c.opened);
    if (!exists || m.time - this.goalSince > 14) {
      if (exists) this.blacklist.add(g.id);
      this.goal = null; this.thinkAt = 0;
      return;
    }
    const d = Math.hypot(g.x - s.x, g.z - s.z);
    if (d > 1.3) {
      this.moveTo(m, p, out, g.x, g.z, d > 20);
    } else {
      // face it and interact
      this.aimYaw = Math.atan2(g.x - s.x, g.z - s.z);
      out.yaw = this.aimYaw;
      if (g.kind === 'loot') {
        const it = m.loot.get(g.id)!;
        const swap = m.pickupNeedsSwap(p, it);
        if (swap >= 0 && it.kind === 'weapon') {
          // select the weakest weapon slot to replace
          let worst = -1, wv = Infinity;
          p.slots.forEach((sl, i) => {
            if (sl?.kind === 'weapon') { const v = this.weaponValue(sl.w, sl.r); if (v < wv) { wv = v; worst = i; } }
          });
          if (worst < 0) worst = p.slots.findIndex((sl) => sl?.kind === 'item' && ITEMS[sl.id].kind === 'utility');
          if (worst < 0) worst = 4;
          this.wantSlot = worst;
          if (p.sel !== worst) return;
        } else if (swap >= 0) { this.blacklist.add(g.id); this.goal = null; return; }
      }
      out.buttons |= BTN.interact;
      if (m.time - this.goalSince > 6) { this.blacklist.add(g.id); this.goal = null; }
    }
    this.chooseWeaponSlot(p, 30);
  }

  // ------------------------------------------------------------ rotation
  private rotate(m: Match, p: Player, out: InputFrame) {
    const s = p.ms;
    const st = m.stormNow;
    const n = st.next ?? st.cur;
    if (!this.rotatePoint || this.rotatePoint.phase !== st.phase) {
      // choose a point inside the next field, biased toward cover (valid storm centres)
      const cands = m.island.stormCenters.filter((c) => Math.hypot(c.x - n.x, c.z - n.z) < n.r * 0.6);
      const pick = cands.length ? this.rng.pick(cands) : { x: n.x + this.rng.range(-0.3, 0.3) * n.r, z: n.z + this.rng.range(-0.3, 0.3) * n.r };
      this.rotatePoint = { x: pick.x + this.rng.range(-8, 8), z: pick.z + this.rng.range(-8, 8), phase: st.phase };
    }
    let gx = this.rotatePoint.x, gz = this.rotatePoint.z;
    if (this.state === 'FinalField') {
      const c = st.cur;
      const d = Math.hypot(s.x - c.x, s.z - c.z);
      if (d < c.r * 0.55 && st.stage !== 'shrink') { gx = s.x; gz = s.z; }
      else { gx = c.x + (this.rotatePoint.x - n.x) * 0.3; gz = c.z + (this.rotatePoint.z - n.z) * 0.3; }
    }
    if (this.state === 'SeekAdvantage' && this.heard) { gx = this.heard.x; gz = this.heard.z; }
    if (this.state === 'AvoidThreat' && this.lastKnown) {
      const dx = s.x - this.lastKnown.x, dz = s.z - this.lastKnown.z;
      const L = Math.hypot(dx, dz) || 1;
      gx = s.x + (dx / L) * 30; gz = s.z + (dz / L) * 30;
    }
    const inside = Math.hypot(s.x - n.x, s.z - n.z) < n.r * 0.75;
    const d = Math.hypot(gx - s.x, gz - s.z);
    if (this.state === 'Rotate' && inside && m.stormStart >= 0 && st.stage === 'wait' && d < 40) {
      // already safe: hold near cover and look around
      if (m.time > this.strafeUntil) { this.strafeUntil = m.time + 2 + this.rng.next() * 3; this.aimYaw += this.rng.range(-1.5, 1.5); }
      out.yaw = this.aimYaw;
      out.buttons |= this.rng.next() < 0.002 ? BTN.crouch : 0;
      return;
    }
    if (d > 2) this.moveTo(m, p, out, gx, gz, d > 25 || this.stormPressing(m, p));
    this.chooseWeaponSlot(p, 40);
  }

  // ------------------------------------------------------------ movement
  private moveTo(m: Match, p: Player, out: InputFrame, gx: number, gz: number, sprint: boolean, faceMove = true) {
    const s = p.ms;
    const nav = m.nav!;
    // long legs: aim at an intermediate goal ≤70m away
    if (this.detour && m.time < this.detour.until) { gx = this.detour.x; gz = this.detour.z; }
    else this.detour = null;
    let lx = gx, lz = gz;
    const D = Math.hypot(gx - s.x, gz - s.z);
    if (D > 70) { lx = s.x + ((gx - s.x) / D) * 70; lz = s.z + ((gz - s.z) / D) * 70; }
    const goalMoved = !this.pathGoal || Math.hypot(this.pathGoal.x - lx, this.pathGoal.z - lz) > 6;
    if (goalMoved || m.time > this.repathAt || this.pathIdx >= this.path.length) {
      this.path = nav.path(s.x, s.z, lx, lz, 5000);
      this.pathIdx = 0;
      this.pathGoal = { x: lx, z: lz };
      this.repathAt = m.time + 2.5 + this.rng.next();
    }
    while (this.pathIdx < this.path.length && Math.hypot(this.path[this.pathIdx].x - s.x, this.path[this.pathIdx].z - s.z) < 1.1) this.pathIdx++;
    const wp = this.path[this.pathIdx] ?? { x: lx, z: lz };
    let dx = wp.x - s.x, dz = wp.z - s.z;
    const L = Math.hypot(dx, dz) || 1;
    dx /= L; dz /= L;
    if (m.time < this.sideStepUntil) { const tx = dx; dx = dx * 0.3 - dz * this.sideDir; dz = dz * 0.3 + tx * this.sideDir; }
    if (faceMove) {
      const want = Math.atan2(dx, dz);
      this.aimYaw += wrapAngle(want - this.aimYaw) * 0.35;
    }
    const yaw = faceMove ? this.aimYaw : out.yaw;
    const fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
    out.mz = dx * fx + dz * fz;
    out.mx = dx * rx + dz * rz;
    out.yaw = yaw;
    if (sprint && out.mz > 0.6 && p.ms.stamina > 1.2) out.buttons |= BTN.sprint;
    // stuck detection
    if (m.time - this.stuck.t > 1) {
      const moved = Math.hypot(s.x - this.stuck.x, s.z - this.stuck.z);
      if (moved < 0.5 && s.mode === 'ground') {
        this.stuck.n++;
        if (this.stuck.n >= 1) out.buttons |= BTN.jump;
        if (this.stuck.n >= 2) { this.sideStepUntil = m.time + 0.9; this.sideDir = this.rng.chance(0.5) ? 1 : -1; this.repathAt = 0; }
        if (this.stuck.n >= 3 && !this.detour) {
          // escape: walk to a random nearby passable point, then re-plan
          for (let k = 0; k < 8; k++) {
            const a = this.rng.next() * Math.PI * 2, r = 6 + this.rng.next() * 10;
            const dx2 = s.x + Math.cos(a) * r, dz2 = s.z + Math.sin(a) * r;
            if (nav.passable(dx2, dz2)) { this.detour = { x: dx2, z: dz2, until: m.time + 2.5 }; break; }
          }
          this.repathAt = 0;
        }
        if (this.stuck.n >= 5 && this.goal) { this.blacklist.add(this.goal.id); this.goal = null; this.stuck.n = 0; }
      } else this.stuck.n = 0;
      this.stuck.x = s.x; this.stuck.z = s.z; this.stuck.t = m.time;
    }
    // swimming / ledges: jump to climb out
    if (s.mode === 'swim' && this.rng.next() < 0.05) out.buttons |= BTN.jump;
  }

  // ------------------------------------------------------------ combat
  private chooseWeaponSlot(p: Player, range: number) {
    let best = -1, bs = -Infinity;
    p.slots.forEach((sl, i) => {
      if (sl?.kind !== 'weapon') return;
      if (sl.mag <= 0 && p.ammo[WEAPONS[sl.w].ammo] <= 0) return;
      const def = WEAPONS[sl.w];
      const [lo, hi] = CLASS_RANGE[def.cls];
      let sc = this.weaponValue(sl.w, sl.r);
      if (range < lo) sc -= (lo - range) * 0.3;
      if (range > hi) sc -= (range - hi) * 0.08;
      if (sl.mag <= 0) sc -= 3;
      if (p.ms.mode === 'swim' && sl.w !== 'harbor') sc -= 20;
      if (sc > bs) { bs = sc; best = i; }
    });
    if (best >= 0) this.wantSlot = best;
  }

  private engage(m: Match, p: Player, out: InputFrame, dt: number) {
    const s = p.ms;
    const q = m.players[this.target];
    if (!q || !q.alive) { this.target = -1; this.state = 'Rotate'; return; }
    const dx = q.ms.x - s.x, dz = q.ms.z - s.z;
    const dist = Math.hypot(dx, dz);
    if (!this.usableWeapons(p).length) {
      // no ammo: close in and use quick melee
      this.aimYaw = Math.atan2(dx, dz);
      out.yaw = this.aimYaw;
      out.mz = 1;
      if (dist > 4 && p.ms.stamina > 1) out.buttons |= BTN.sprint;
      if (dist < 2.1 && !(p.prevButtons & BTN.melee)) out.buttons |= BTN.melee;
      return;
    }
    this.chooseWeaponSlot(p, dist);
    const sl = p.slots[p.sel];
    // aim at predicted torso from the camera origin
    const lead = sl?.kind === 'weapon' && WEAPONS[sl.w].projectile ? dist / WEAPONS[sl.w].projectile!.speed : 0.05;
    const tx = q.ms.x + q.ms.vx * lead, tz = q.ms.z + q.ms.vz * lead;
    const ty = q.ms.y + (q.ms.crouch ? 0.85 : 1.2) + (lead > 0.1 ? (WEAPONS[(sl as Extract<Slot, { kind: 'weapon' }>).w].projectile!.gravity * lead * lead) / 2 : 0);
    let yawW = this.aimYaw, pitW = this.aimPitch;
    for (let i = 0; i < 2; i++) {
      const rig = cameraRig(s.x, s.y, s.z, yawW, pitW, s.crouch, p.ads && sl?.kind === 'weapon' ? WEAPONS[sl.w].adsBoom : 3.1, p.shoulder);
      const ox = tx - rig.origin.x, oy = ty - rig.origin.y, oz = tz - rig.origin.z;
      yawW = Math.atan2(ox, oz);
      pitW = Math.atan2(oy, Math.hypot(ox, oz));
    }
    // aim noise: random walk scaled by skill, target speed and distance; shrinks while tracking
    if (m.time > this.errAt) {
      this.errAt = m.time + 0.3;
      const tSpeed = Math.hypot(q.ms.vx, q.ms.vz);
      const sigma = ((3.4 - this.skill * 2.2) * (1 + tSpeed / 9) * Math.PI) / 180;
      const track = Math.min(1, (m.time - (this.reactionUntil - 0.5)) / 3);
      const k = 1 - track * 0.55;
      this.errYaw = this.errYaw * 0.5 + this.rng.range(-1, 1) * sigma * k;
      this.errPitch = this.errPitch * 0.5 + this.rng.range(-1, 1) * sigma * 0.6 * k;
    }
    const wantYaw = yawW + this.errYaw, wantPitch = pitW + this.errPitch;
    const turn = Math.min(1, dt * (5 + this.skill * 7));
    this.aimYaw += wrapAngle(wantYaw - this.aimYaw) * turn;
    this.aimPitch += (wantPitch - this.aimPitch) * turn;
    out.yaw = this.aimYaw;
    out.pitch = this.aimPitch;
    const visible = m.time - this.lastSeen < 0.5;
    // movement: strafe, keep preferred range, use cover implicitly by breaking LOS when hurt
    if (m.time > this.strafeUntil) {
      this.strafeUntil = m.time + 0.5 + this.rng.next() * 1.1;
      this.strafe = this.rng.chance(0.5) ? 1 : -1;
    }
    let pref = 25;
    if (sl?.kind === 'weapon') { const [lo, hi] = CLASS_RANGE[WEAPONS[sl.w].cls]; pref = Math.min(hi * 0.6, Math.max(lo + 4, 20)); }
    const fwd = dist > pref * 1.3 ? 1 : dist < pref * 0.5 ? -0.6 : 0;
    out.mz = fwd;
    out.mx = this.strafe * (0.6 + this.aggression * 0.4);
    if (!visible && this.lastKnown) {
      // push or hold toward last known position
      if (this.aggression > 0.4) this.moveTo(m, p, out, this.lastKnown.x, this.lastKnown.z, false, false);
      if (m.time - this.lastSeen > 3) { this.state = 'Rotate'; this.target = -1; }
      return;
    }
    if (this.rng.next() < 0.004) out.buttons |= BTN.jump;
    if (sl?.kind !== 'weapon') return;
    const st = weaponStats(sl.w, sl.r);
    if (dist > 45 && st.def.cls !== 'shotgun' && st.def.cls !== 'smg') out.buttons |= BTN.ads;
    if (sl.mag === 0) { if (!(p.prevButtons & BTN.reload)) out.buttons |= BTN.reload; return; }
    // utility: wind orb at mid range
    if (m.time - this.lastUtility > 8 && dist > 7 && dist < 22 && this.rng.next() < 0.02) {
      const idx = p.slots.findIndex((x) => x?.kind === 'item' && x.id === 'wind_orb');
      if (idx >= 0) { this.wantSlot = idx; this.lastUtility = m.time; this.pauseUntil = m.time + 0.6; }
    }
    if (m.time < this.reactionUntil) return;
    const err = Math.abs(wrapAngle(wantYaw - this.aimYaw)) + Math.abs(wantPitch - this.aimPitch);
    const tol = ((st.hipSpread + 2.5) * Math.PI) / 180;
    if (err > tol) return;
    if (dist > st.def.range * 0.9) return;
    if (m.time < this.pauseUntil) {
      const cur = p.slots[p.sel];
      if (cur?.kind === 'item' && cur.id === 'wind_orb') { if (!(p.prevButtons & BTN.fire)) out.buttons |= BTN.fire; }
      return;
    }
    if (st.def.mode === 'auto') {
      if (m.time > this.burstUntil + 0.3) this.burstUntil = m.time + (dist > 40 ? 0.25 : 0.55) + this.rng.next() * 0.4;
      if (m.time < this.burstUntil) out.buttons |= BTN.fire;
      else this.pauseUntil = m.time + (dist > 40 ? 0.35 : 0.15);
    } else {
      this.fireToggle = !this.fireToggle;
      if (this.fireToggle) out.buttons |= BTN.fire;
    }
  }

  private heal(m: Match, p: Player, out: InputFrame) {
    // break line of sight first if a threat is fresh
    if (this.lastKnown && m.time - this.lastSeen < 1.5) {
      const s = p.ms;
      const dx = s.x - this.lastKnown.x, dz = s.z - this.lastKnown.z;
      const L = Math.hypot(dx, dz) || 1;
      this.moveTo(m, p, out, s.x + (dx / L) * 20 + this.strafe * 6, s.z + (dz / L) * 20, true);
      const idx = p.slots.findIndex((x) => x?.kind === 'item' && x.id === 'mist');
      if (idx >= 0 && m.time - this.lastUtility > 10) { this.wantSlot = idx; this.lastUtility = m.time; this.pauseUntil = m.time + 0.5; }
      if (m.time < this.pauseUntil && p.slots[p.sel]?.kind === 'item' && !(p.prevButtons & BTN.fire)) out.buttons |= BTN.fire;
      return;
    }
    if (p.use) { out.mz = 0; return; }
    let pick = -1;
    p.slots.forEach((sl, i) => {
      if (pick >= 0 || sl?.kind !== 'item') return;
      if ((sl.id === 'med' || sl.id === 'trauma') && p.health < HEALTH_MAX - 15) pick = i;
      else if (sl.id === 'flask' && p.reserve < 40) pick = i;
      else if (sl.id === 'aegis_cell' && p.aegis < 25) pick = i;
    });
    if (pick < 0) { this.state = 'Rotate'; return; }
    this.wantSlot = pick;
    if (p.sel === pick && m.time > p.equipEnd && !(p.prevButtons & BTN.fire)) out.buttons |= BTN.fire;
  }
}
