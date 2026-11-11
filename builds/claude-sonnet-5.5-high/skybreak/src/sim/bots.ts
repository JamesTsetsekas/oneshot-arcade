/**
 * Server bots. They get no hidden information: perception is sight (range, FOV, line of sight,
 * mist clouds) plus audible gunshots/footsteps. Difficulty scales reaction time, aim noise and
 * decision rate - never health, damage or vision.
 */
import { COMBAT, ITEMS, WEAPONS, effectiveWeapon, type WeaponId } from '../shared/content';
import { Rng } from '../shared/rng';
import { angleDiff, clamp, dirFromYawPitch, wrapAngle, type Vec3 } from '../shared/math';
import { eyeHeight } from './camera';
import { playerHeight } from './movement';
import { findItemSlot } from './inventory';
import { emptyInput, type Player, type PlayerInput } from './types';
import type { Match } from './match';

type BotState = 'Skiff' | 'Drop' | 'Loot' | 'Rotate' | 'Engage' | 'Heal' | 'LootKill' | 'Final' | 'Investigate' | 'Flee';

interface Goal { x: number; z: number; kind: 'loot' | 'chest' | 'rotate' | 'wander' | 'investigate' | 'flee' | 'drop'; id?: number }

export class BotBrain {
  state: BotState = 'Skiff';
  private yaw = 0;
  private pitch = 0;
  private dropTarget: { x: number; z: number; name: string } | null = null;
  private jumpDist = 300;
  private goal: Goal | null = null;
  private goalAt = -99;
  private blacklist = new Map<number, number>();
  private target: Player | null = null;
  private lastSeen: { x: number; y: number; z: number; t: number } | null = null;
  private spottedAt = -99;
  private nextPerception = 0;
  private alert: { x: number; z: number; t: number } | null = null;
  private aimErrYaw = 0;
  private aimErrPitch = 0;
  private aimErrAt = 0;
  private strafeDir = 1;
  private strafeUntil = 0;
  private burstLeft = 0;
  private burstPause = 0;
  private stuckPos = { x: 0, z: 0, t: 0 };
  private detourUntil = 0;
  private detourDir = 1;
  private stuckCount = 0;
  private interactToggle = false;
  private healUntil = 0;
  private holdUntil = 0;
  private crouchUntil = 0;
  private lastEnemyT = -99;
  private utilityCd = 0;
  private wanderSeed = 0;
  private slotTimer = 0;
  private time = 0;

  constructor(private m: Match, private p: Player, private rng: Rng, private skill: number) {
    this.yaw = p.yaw;
    this.wanderSeed = rng.next() * 1000;
  }

  think(dt: number): PlayerInput {
    this.time += dt;
    const p = this.p, m = this.m;
    const inp = emptyInput();
    inp.yaw = this.yaw; inp.pitch = this.pitch;

    if (p.mode === 'skiff') { this.thinkSkiff(inp); return inp; }
    if (p.mode === 'freefall' || p.mode === 'glide') { this.thinkAir(inp, dt); return inp; }
    if (p.mode === 'zipline' || p.mode === 'grapple' || p.mode === 'mantle') { inp.yaw = this.yaw; return inp; }

    this.perceive();
    this.thinkGround(inp, dt);
    void m;
    return inp;
  }

  /* ----------------------------------------------------- drop planning */
  private chooseDrop(): void {
    const m = this.m, sk = m.skiff;
    const cands = m.world.locations.filter((l) => l.id !== 'wild');
    const weights = cands.map((l) => {
      // distance from skiff path
      const dx = l.x - sk.startX, dz = l.z - sk.startZ;
      const along = dx * sk.dirX + dz * sk.dirZ;
      const px = sk.startX + sk.dirX * along, pz = sk.startZ + sk.dirZ * along;
      const off = Math.hypot(l.x - px, l.z - pz);
      if (off > 420) return 0;
      const value = l.tier * l.tier + (l.named ? 3 : 0.5);
      const risk = this.skill > 0.65 ? 1.2 : 0.8;
      return Math.max(0.2, value * (1 - off / 520)) * (l.tier >= 3 ? risk : 1);
    });
    const total = weights.reduce((a, b) => a + b, 0);
    const idx = total > 0 ? this.rng.weighted(weights) : 0;
    const l = cands[idx];
    this.dropTarget = { x: l.x + this.rng.range(-l.r * 0.4, l.r * 0.4), z: l.z + this.rng.range(-l.r * 0.4, l.r * 0.4), name: l.name };
    // distance from the skiff path decides how early this bot must jump to reach its target
    const tdx = this.dropTarget.x - sk.startX, tdz = this.dropTarget.z - sk.startZ;
    const along = tdx * sk.dirX + tdz * sk.dirZ;
    const off = Math.hypot(this.dropTarget.x - (sk.startX + sk.dirX * along), this.dropTarget.z - (sk.startZ + sk.dirZ * along));
    this.jumpDist = Math.min(470, Math.max(this.rng.range(250, 400), off + 40));
  }

  private thinkSkiff(inp: PlayerInput): void {
    if (!this.dropTarget) this.chooseDrop();
    const t = this.dropTarget!, p = this.p;
    const d = Math.hypot(t.x - p.x, t.z - p.z);
    this.yaw = Math.atan2(t.x - p.x, t.z - p.z);
    inp.yaw = this.yaw;
    const passed = (t.x - p.x) * this.m.skiff.dirX + (t.z - p.z) * this.m.skiff.dirZ < 0;
    if ((d <= this.jumpDist || passed) && Math.hypot(p.x, p.z) < 570) inp.jump = true;
  }

  private thinkAir(inp: PlayerInput, dt: number): void {
    const t = this.dropTarget ?? { x: 0, z: 0, name: '' };
    const p = this.p;
    const dx = t.x - p.x, dz = t.z - p.z;
    const d = Math.hypot(dx, dz);
    this.yaw = this.turnToward(this.yaw, Math.atan2(dx, dz), 4 * dt);
    inp.yaw = this.yaw;
    if (p.mode === 'freefall') {
      inp.moveF = d > 90 ? 1 : 0;
    } else {
      const ground = this.m.world.heightAt(p.x, p.z);
      const agl = Math.max(1, p.y - ground);
      const speed = Math.hypot(p.vx, p.vz);
      const timeLeft = agl / 6.5;
      const reach = speed * timeLeft;
      inp.moveF = d > reach * 1.05 ? 1 : d < reach * 0.55 ? -1 : 0;
      if (d < 25) inp.moveF = -1;
    }
  }

  /* ------------------------------------------------------- perception */
  private eye(q: Player): Vec3 { return { x: q.x, y: q.y + eyeHeight(q), z: q.z }; }

  private perceive(): void {
    const p = this.p, m = this.m;
    if (m.time < this.nextPerception) return;
    this.nextPerception = m.time + 0.2 + (p.id % 3) * 0.02;
    const myEye = this.eye(p);
    let best: Player | null = null, bd = 1e9;
    for (const q of m.players) {
      if (q === p || !q.alive || q.mode === 'skiff' || q.dummy) continue;
      const dx = q.x - p.x, dz = q.z - p.z;
      const d = Math.hypot(dx, dz);
      const range = q.crouching ? 70 : q.sprinting ? 130 : 105;
      if (d > range) continue;
      const bearing = Math.atan2(dx, dz);
      if (Math.abs(angleDiff(this.yaw, bearing)) > 1.9 && d > 12) continue;
      const tgt = { x: q.x, y: q.y + playerHeight(q) * 0.7, z: q.z };
      if (!m.world.hasLineOfSight(myEye, tgt)) continue;
      if (m.lineThroughSmoke(myEye, tgt)) continue;
      if (d < bd) { bd = d; best = q; }
    }
    if (best) {
      if (this.target !== best || this.time - this.spottedAt > 4) this.spottedAt = this.time;
      this.target = best;
      this.lastSeen = { x: best.x, y: best.y, z: best.z, t: this.time };
      this.lastEnemyT = this.time;
    } else if (this.target && this.time - (this.lastSeen?.t ?? -99) > 6) {
      this.target = null;
    }
    // hearing: gunshots / footsteps within audible radius
    if (!best) {
      for (const s of m.sounds) {
        if (s.pid === p.id || m.time - s.t > 1.2) continue;
        const d = Math.hypot(s.x - p.x, s.z - p.z);
        if (d < s.loud && d > 3) {
          const noise = 8 + d * 0.12;
          this.alert = { x: s.x + this.rng.range(-noise, noise), z: s.z + this.rng.range(-noise, noise), t: this.time };
          break;
        }
      }
    }
  }

  private targetArmed(): boolean {
    const t = this.target;
    if (!t) return false;
    const s = t.slots[t.selected];
    return !!s && s.kind === 'weapon';
  }

  private enemyVisible(): boolean {
    return !!this.target && !!this.lastSeen && this.time - this.lastSeen.t < 0.5 && this.target.alive;
  }

  /* ------------------------------------------------------ ground logic */
  private thinkGround(inp: PlayerInput, dt: number): void {
    const p = this.p, m = this.m;
    const st = m.storm;
    const visible = this.enemyVisible();
    const hp = p.health + p.aegis * 0.7 + p.reserve * 0.7;
    const hasWeapon = p.slots.some((s) => s && s.kind === 'weapon');
    const bravery = 0.3 + this.skill * 0.6;

    // decide high-level state
    const outside = st.phase > 0 && Math.hypot(p.x - st.cx, p.z - st.cz) > st.r - 4;
    const nextOutside = st.phase > 0 && Math.hypot(p.x - st.nextX, p.z - st.nextZ) > st.nextR * 0.85;
    const timeToShrink = st.stage === 'wait' ? st.waitLen - st.t : 0;
    const stormPressure = outside || (st.stage === 'shrink' && nextOutside) || (st.stage === 'wait' && nextOutside && timeToShrink < 28 + Math.hypot(p.x - st.nextX, p.z - st.nextZ) / 6.5);

    if (visible && hasWeapon && hp > 35 * (1.3 - bravery) && !(stormPressure && outside && st.damage >= 4)) this.state = 'Engage';
    else if (visible && ((!hasWeapon && this.targetArmed()) || hp <= 35)) this.state = 'Flee';
    else if (this.state === 'Engage' || this.state === 'Flee') this.state = this.time - this.lastEnemyT < 1.5 ? this.state : 'Loot';

    let move = { x: 0, z: 0, active: false, sprint: false };

    // healing when safe
    if (!visible && this.time - this.lastEnemyT > 2.0 && !p.using) {
      this.tryHeal(inp);
    }
    if (p.using) { this.state = 'Heal'; }
    else if (this.state === 'Heal') this.state = 'Loot';

    switch (this.state) {
      case 'Engage': this.doEngage(inp, dt); break;
      case 'Flee': this.doFlee(inp, dt); break;
      case 'Heal': inp.crouch = true; break;
      default: {
        // pick goal
        if (m.time - this.goalAt > 0.9 + (p.id % 5) * 0.1 || !this.goal) this.chooseGoal(stormPressure);
        if (this.alert && this.time - this.alert.t < 5 && !this.goal) { /* handled in chooseGoal */ }
        if (this.goal) {
          move = this.moveToGoal(this.goal);
          inp.moveF = move.active ? 1 : 0;
          inp.sprint = move.sprint && !p.using;
          this.faceMove(move.x, move.z, dt);
          inp.yaw = this.yaw;
          this.pitch += (0 - this.pitch) * Math.min(1, 6 * dt);
          inp.pitch = this.pitch;
          this.handleStuck(inp, dt);
          const ahead = this.m.world.inHazard(p.x + Math.sin(this.yaw) * 2.2, p.z + Math.cos(this.yaw) * 2.2);
          if (ahead > 0) inp.jump = true;
          this.tryInteractGoal(inp);
        }
        break;
      }
    }

    // utility
    this.manageWeapons(inp, dt);
    this.tickReload(inp);
    this.utilityCd -= dt;
  }

  private tryHeal(inp: PlayerInput): void {
    const p = this.p;
    const choose = (item: 'medInjector' | 'traumaKit' | 'shieldFlask' | 'aegisCell'): boolean => {
      const s = findItemSlot(p, item);
      if (s < 0) return false;
      inp.slot = s; p.selected !== s && (this.slotTimer = 0.3);
      if (p.selected === s) inp.fire = true;
      return true;
    };
    if (p.health < 55) { if (choose('traumaKit') || choose('medInjector')) return; }
    if (p.health < 82) { if (choose('medInjector')) return; }
    if (p.reserve < 20 && p.health > 40) { if (choose('shieldFlask')) return; }
    if (p.health < 40 && choose('traumaKit')) return;
  }

  private chooseGoal(stormPressure: boolean): void {
    const p = this.p, m = this.m, st = m.storm;
    this.goalAt = m.time;
    // storm first
    if (stormPressure) {
      const cx = st.stage === 'wait' || st.stage === 'shrink' ? st.nextX : st.cx;
      const cz = st.stage === 'wait' || st.stage === 'shrink' ? st.nextZ : st.cz;
      const spread = Math.max(2, st.nextR * 0.35);
      const a = this.rng.range(0, Math.PI * 2);
      this.goal = { x: cx + Math.cos(a) * spread * this.rng.next(), z: cz + Math.sin(a) * spread * this.rng.next(), kind: 'rotate' };
      this.state = 'Rotate';
      return;
    }
    // alert -> investigate (brave bots only, and only with a weapon)
    const hasWeapon = p.slots.some((s) => s && s.kind === 'weapon');
    if (hasWeapon && this.lastSeen && this.time - this.lastSeen.t < 9 && this.skill > 0.4 && p.health > 55 && this.rng.chance(0.7)) {
      this.goal = { x: this.lastSeen.x, z: this.lastSeen.z, kind: 'investigate' };
      this.state = 'Investigate';
      return;
    }
    if (this.alert && this.time - this.alert.t < 4 && hasWeapon && this.skill > 0.3 && this.rng.chance(0.8)) {
      this.goal = { x: this.alert.x, z: this.alert.z, kind: 'investigate' };
      this.state = 'Investigate';
      this.alert = null;
      return;
    }
    // loot scoring
    const needsWeapon = !hasWeapon;
    let best: Goal | null = null, bs = 0;
    const vis = 85;
    const weaponScore = (rarity: number, w: WeaponId): number => {
      const cur = p.slots.filter((s) => s && s.kind === 'weapon') as { kind: 'weapon'; weapon: WeaponId; rarity: number }[];
      if (cur.length === 0) return 100;
      const worst = Math.min(...cur.map((c) => c.rarity));
      const dup = cur.some((c) => c.weapon === w);
      if (cur.length < 3) return 30 + rarity * 8 - (dup ? 15 : 0);
      return rarity > worst ? 12 + (rarity - worst) * 10 : 0;
    };
    for (const e of m.loot.values()) {
      const dx = e.x - p.x, dz = e.z - p.z;
      const d = Math.hypot(dx, dz);
      if (d > vis || Math.abs(e.y - p.y) > 12) continue;
      if ((this.blacklist.get(e.id) ?? 0) > this.time) continue;
      let v = 0;
      const d0 = e.data;
      if (d0.kind === 'weapon') v = weaponScore(d0.rarity, d0.weapon) * (needsWeapon ? 1.6 : 1);
      else if (d0.kind === 'ammo') { const cap = p.ammo[d0.ammo]; v = p.slots.some((s) => s && s.kind === 'weapon' && WEAPONS[s.weapon].ammo === d0.ammo) ? (cap < 60 ? 22 : cap < 120 ? 10 : 0) : 0; }
      else if (d0.kind === 'item') {
        const def = ITEMS[d0.item];
        const have = p.slots.reduce((a, s) => a + (s && s.kind === 'item' && s.item === d0.item ? s.count : 0), 0);
        v = (def.category === 'heal' ? 24 : def.category === 'shield' ? 20 : 8) - have * 5;
        if (p.slots.every((s) => s) && have === 0) v = 0;
      } else if (d0.kind === 'cache') v = 26;
      if (v <= 0) continue;
      const s = v - d * 0.22;
      if (s > bs) { bs = s; best = { x: e.x, z: e.z, kind: 'loot', id: e.id }; }
    }
    for (const c of m.chests.values()) {
      if (c.opened) continue;
      const d = Math.hypot(c.x - p.x, c.z - p.z);
      if (d > vis || Math.abs(c.y - p.y) > 12) continue;
      if ((this.blacklist.get(-c.id) ?? 0) > this.time) continue;
      const v = (c.kind === 'chest' ? 34 : 18) + (needsWeapon && c.kind === 'chest' ? 12 : 0) + c.tier * 3;
      const s = v - d * 0.2;
      if (s > bs) { bs = s; best = { x: c.x, z: c.z, kind: 'chest', id: c.id }; }
    }
    if (best && bs > 6) { this.goal = best; this.state = this.state === 'Loot' || this.state === 'Drop' ? this.state : 'Loot'; if (this.state !== 'Loot') this.state = 'Loot'; return; }
    // nothing nearby: head toward a location with loot potential, biased toward the zone
    const phase = st.phase;
    const hasGear = p.slots.some((s) => s && s.kind === 'weapon');
    if (!this.goal || this.goal.kind !== 'wander' || Math.hypot(this.goal.x - p.x, this.goal.z - p.z) < 6 || this.rng.chance(0.15)) {
      const cx = phase > 0 ? st.nextX : 0, cz = phase > 0 ? st.nextZ : 0;
      const rad = phase > 0 ? st.nextR : 420;
      const locs = m.world.locations.filter((l) => l.id !== 'wild' && Math.hypot(l.x - cx, l.z - cz) < rad);
      if (locs.length && !(hasGear && this.rng.chance(0.4))) {
        const l = locs[this.rng.int(0, locs.length - 1)];
        this.goal = { x: l.x + this.rng.range(-20, 20), z: l.z + this.rng.range(-20, 20), kind: 'wander' };
      } else {
        const a = this.rng.range(0, Math.PI * 2), r = rad * 0.6 * this.rng.next();
        this.goal = { x: cx + Math.cos(a) * r, z: cz + Math.sin(a) * r, kind: 'wander' };
      }
    }
    this.state = phase >= 6 ? 'Final' : 'Rotate';
  }

  /** Move towards a goal, using building doors as waypoints (no navmesh). */
  private moveToGoal(g: Goal): { x: number; z: number; active: boolean; sprint: boolean } {
    const p = this.p, w = this.m.world;
    let tx = g.x, tz = g.z;
    const inB0 = (b: typeof w.buildings[number], x: number, z: number, pad: number) => Math.abs(x - b.x) < b.w / 2 + pad && Math.abs(z - b.z) < b.d / 2 + pad;
    if (p.onGround && p.mode === 'ground') {
      const roof = w.buildings.find((bd) => inB0(bd, p.x, p.z, 0.3) && p.y > bd.floorY + bd.h - 0.6 && p.y < bd.floorY + bd.h + 1);
      if (roof) {
        // on a roof: walk off the nearest edge towards the goal
        const hx = roof.w / 2 + 2, hz = roof.d / 2 + 2;
        const dxE = roof.x + hx - p.x, dxW = p.x - (roof.x - hx), dzS = roof.z + hz - p.z, dzN = p.z - (roof.z - hz);
        const toGoalX = g.x - p.x, toGoalZ = g.z - p.z;
        let ex = p.x, ez = p.z;
        const m4 = Math.min(dxE, dxW, dzS, dzN);
        // prefer the edge facing the goal when it is nearly as close
        const pref = Math.abs(toGoalX) > Math.abs(toGoalZ) ? (toGoalX > 0 ? 'E' : 'W') : (toGoalZ > 0 ? 'S' : 'N');
        const dp = pref === 'E' ? dxE : pref === 'W' ? dxW : pref === 'S' ? dzS : dzN;
        const pick = dp < m4 + 5 ? pref : (m4 === dxE ? 'E' : m4 === dxW ? 'W' : m4 === dzS ? 'S' : 'N');
        if (pick === 'E') ex = roof.x + hx + 1; else if (pick === 'W') ex = roof.x - hx - 1; else if (pick === 'S') ez = roof.z + hz + 1; else ez = roof.z - hz - 1;
        return { x: ex, z: ez, active: true, sprint: false };
      }
    }
    const inB = (b: typeof w.buildings[number], x: number, z: number, pad: number) => Math.abs(x - b.x) < b.w / 2 + pad && Math.abs(z - b.z) < b.d / 2 + pad;
    const here = w.buildings.find((b) => inB(b, p.x, p.z, -0.3) && Math.abs(p.y - b.floorY) < 3);
    const there = w.buildings.find((b) => inB(b, g.x, g.z, -0.3) && Math.abs(g.z - b.z) < 99);
    if (there && there !== here) {
      const dOut = Math.hypot(p.x - there.doorOut.x, p.z - there.doorOut.z);
      const dIn = Math.hypot(p.x - there.doorIn.x, p.z - there.doorIn.z);
      if (dOut > 2.2 && !(dIn < dOut && dIn < 3)) { tx = there.doorOut.x; tz = there.doorOut.z; }
      else { tx = there.doorIn.x; tz = there.doorIn.z; }
      if (dIn < 1.2) { tx = g.x; tz = g.z; }
    } else if (here && here !== there) {
      const dIn = Math.hypot(p.x - here.doorIn.x, p.z - here.doorIn.z);
      if (dIn > 1.5) { tx = here.doorIn.x; tz = here.doorIn.z; }
      else { tx = here.doorOut.x; tz = here.doorOut.z; }
    }
    let ignore: import('./world').Building | undefined = here;
    if (there && (tx === there.doorIn.x && tz === there.doorIn.z || tx === g.x && tz === g.z)) ignore = there;
    const d = Math.hypot(tx - p.x, tz - p.z);
    const finalGoal = tx === g.x && tz === g.z;
    const routed = this.routePoint(tx, tz, ignore);
    tx = routed.x; tz = routed.z;
    const reach = g.kind === 'loot' || g.kind === 'chest' ? 1.2 : 4;
    const arrived = d < reach && finalGoal;
    // detour around obstacles when stuck
    if (this.time < this.detourUntil) {
      const a = Math.atan2(tx - p.x, tz - p.z) + this.detourDir * 1.2;
      tx = p.x + Math.sin(a) * 6; tz = p.z + Math.cos(a) * 6;
    }
    return { x: tx, z: tz, active: !arrived, sprint: d > 10 && g.kind !== 'loot' || d > 16 };
  }

  /** Steer around building footprints on the straight line to (tx,tz) using rect corner waypoints. */
  private routePoint(tx: number, tz: number, ignore: import('./world').Building | undefined): { x: number; z: number } {
    const p = this.p, w = this.m.world;
    let bestPt = { x: tx, z: tz };
    for (let pass = 0; pass < 2; pass++) {
      let hit: import('./world').Building | null = null;
      let hd = 1e9;
      for (const bd of w.buildings) {
        if (bd === ignore) continue;
        if (Math.abs(bd.x - p.x) > 70 && Math.abs(bd.z - p.z) > 70) continue;
        if (Math.abs(p.y - bd.floorY) > 8) continue;
        const pad = 1.2;
        if (segHitsRect(p.x, p.z, bestPt.x, bestPt.z, bd.x - bd.w / 2 - pad, bd.z - bd.d / 2 - pad, bd.x + bd.w / 2 + pad, bd.z + bd.d / 2 + pad)) {
          const d = Math.hypot(bd.x - p.x, bd.z - p.z);
          if (d < hd) { hd = d; hit = bd; }
        }
      }
      if (!hit) break;
      const pad = 1.9;
      const cs = [
        { x: hit.x - hit.w / 2 - pad, z: hit.z - hit.d / 2 - pad }, { x: hit.x + hit.w / 2 + pad, z: hit.z - hit.d / 2 - pad },
        { x: hit.x - hit.w / 2 - pad, z: hit.z + hit.d / 2 + pad }, { x: hit.x + hit.w / 2 + pad, z: hit.z + hit.d / 2 + pad },
      ];
      let bc = cs[0], bcost = 1e9;
      for (const c of cs) {
        const cost = Math.hypot(c.x - p.x, c.z - p.z) + Math.hypot(c.x - bestPt.x, c.z - bestPt.z);
        if (cost < bcost && !segHitsRect(p.x, p.z, c.x, c.z, hit.x - hit.w / 2 - 0.9, hit.z - hit.d / 2 - 0.9, hit.x + hit.w / 2 + 0.9, hit.z + hit.d / 2 + 0.9)) { bcost = cost; bc = c; }
      }
      bestPt = bc;
    }
    return bestPt;
  }

  private faceMove(tx: number, tz: number, dt: number): void {
    const p = this.p;
    const want = Math.atan2(tx - p.x, tz - p.z);
    this.yaw = this.turnToward(this.yaw, want, 7 * dt);
  }

  private turnToward(cur: number, want: number, maxStep: number): number {
    const d = angleDiff(cur, want);
    return wrapAngle(cur + clamp(d, -maxStep, maxStep));
  }

  private handleStuck(inp: PlayerInput, dt: number): void {
    const p = this.p;
    if (this.time - this.stuckPos.t > 0.7) {
      const moved = Math.hypot(p.x - this.stuckPos.x, p.z - this.stuckPos.z);
      if (moved < 0.3 && inp.moveF > 0) {
        this.stuckCount++;
        inp.jump = true;
        this.detourUntil = this.time + 1.1;
        this.detourDir = this.rng.chance(0.5) ? 1 : -1;
        if (this.stuckCount >= 3 && this.goal) {
          if (this.goal.id !== undefined) this.blacklist.set(this.goal.kind === 'chest' ? -this.goal.id : this.goal.id, this.time + 25);
          this.goal = null; this.stuckCount = 0;
        }
      } else if (moved > 1.5) this.stuckCount = 0;
      this.stuckPos = { x: p.x, z: p.z, t: this.time };
    }
    void dt;
  }

  private tryInteractGoal(inp: PlayerInput): void {
    const g = this.goal, p = this.p, m = this.m;
    if (!g) return;
    if (g.kind !== 'loot' && g.kind !== 'chest') return;
    const d = Math.hypot(g.x - p.x, g.z - p.z);
    if (d > 1.9) return;
    // verify the target still exists
    if (g.kind === 'loot' && !m.loot.has(g.id!)) { this.goal = null; return; }
    if (g.kind === 'chest') { const c = m.chests.get(g.id!); if (!c || c.opened) { this.goal = null; return; } }
    this.interactToggle = !this.interactToggle;
    inp.interact = this.interactToggle;
    inp.moveF = 0;
    // hold-to-swap when full
    if (g.kind === 'loot') {
      const e = m.loot.get(g.id!);
      if (e && e.data.kind === 'weapon' && p.slots.every((s) => s)) { inp.interact = true; }
    }
    // give up on an item we cannot take
    if (d < 1.4 && m.time - this.goalAt > 4) { if (g.id !== undefined) this.blacklist.set(g.kind === 'chest' ? -g.id : g.id, this.time + 20); this.goal = null; }
  }

  /* --------------------------------------------------------- combat */
  private bestWeaponSlot(dist: number): number {
    const p = this.p;
    let best = -1, bs = -1e9;
    p.slots.forEach((s, i) => {
      if (!s || s.kind !== 'weapon') return;
      const eff = effectiveWeapon(s.weapon, s.rarity);
      const def = eff.def;
      if (s.mag <= 0 && p.ammo[def.ammo] <= 0) return;
      const ideal = (def.falloffStart + def.falloffEnd) * 0.5;
      const rangeFit = -Math.abs(dist - Math.min(ideal, 120)) * 0.35 - (dist > def.falloffEnd ? 25 : 0);
      const dps = eff.damage * def.pellets * (eff.rpm / 60) * 0.12;
      const score = rangeFit + Math.min(dps, 40) + eff.rarity.id * 3 + (def.id === 'gale' ? -25 : 0) + (def.id === 'longwake' && dist < 40 ? -30 : 0);
      if (score > bs) { bs = score; best = i; }
    });
    return best;
  }

  private manageWeapons(inp: PlayerInput, dt: number): void {
    const p = this.p;
    this.slotTimer -= dt;
    if (p.using || this.state === 'Heal') return;
    if (this.state === 'Engage' || this.state === 'Flee') return; // handled in doEngage
    // when idle, wield the best general weapon
    const cur = p.slots[p.selected];
    if (!cur || cur.kind !== 'weapon') {
      const b = this.bestWeaponSlot(40);
      if (b >= 0) inp.slot = b;
    }
  }

  private tickReload(inp: PlayerInput): void {
    const p = this.p;
    const s = p.slots[p.selected];
    if (s && s.kind === 'weapon' && !p.reloading && !this.enemyVisible()) {
      const eff = effectiveWeapon(s.weapon, s.rarity);
      if (s.mag < eff.mag * 0.5 && p.ammo[eff.def.ammo] > 0) inp.reload = true;
    }
  }

  private doEngage(inp: PlayerInput, dt: number): void {
    const p = this.p, t = this.target;
    if (!t) return;
    const dx = t.x - p.x, dz = t.z - p.z;
    const dist = Math.hypot(dx, dz);
    // choose weapon
    const want = this.bestWeaponSlot(dist);
    if (want >= 0 && want !== p.selected && this.slotTimer <= 0) { inp.slot = want; this.slotTimer = 1.2; }
    const cur = p.slots[p.selected];
    const hasGun = !!cur && cur.kind === 'weapon';
    const def = hasGun ? WEAPONS[cur.weapon] : null;
    const eff = hasGun ? effectiveWeapon(cur.weapon, cur.rarity) : null;

    // reaction delay before the first shot after spotting
    const react = 0.65 - this.skill * 0.45;
    const reacted = this.time - this.spottedAt > react;

    // aim with limited turn rate and slowly varying error
    if (this.time > this.aimErrAt) {
      const sigma = (1.15 - this.skill) * 1.9 + dist * 0.012 + Math.hypot(t.vx, t.vz) * 0.28;
      this.aimErrYaw = this.rng.gauss() * sigma * 0.0175;
      this.aimErrPitch = this.rng.gauss() * sigma * 0.75 * 0.0175;
      this.aimErrAt = this.time + 0.25 + this.rng.next() * 0.25;
    }
    const lead = def && def.kind === 'projectile' ? dist / def.projSpeed : 0.0;
    const tx = t.x + t.vx * lead, tz = t.z + t.vz * lead;
    const ty = t.y + playerHeight(t) * (this.skill > 0.7 && this.rng.chance(0.25) ? 0.92 : 0.68);
    const eye = this.eye(p);
    const ddx = tx - eye.x, ddz = tz - eye.z;
    const flat = Math.hypot(ddx, ddz) || 1;
    const wantYaw = Math.atan2(ddx, ddz) + this.aimErrYaw;
    let wantPitch = Math.atan2(ty - eye.y, flat) + this.aimErrPitch;
    wantPitch -= p.recoilP * 0.0175 * (0.55 + this.skill * 0.35); // partial recoil compensation
    const turn = (4 + this.skill * 7) * dt;
    this.yaw = this.turnToward(this.yaw, wantYaw - p.recoilY * 0.0175 * 0.5, turn);
    this.pitch += clamp(wantPitch - this.pitch, -turn, turn);
    inp.yaw = this.yaw; inp.pitch = this.pitch;
    const errAngle = Math.abs(angleDiff(this.yaw, wantYaw));

    // movement: hold preferred range and strafe
    const ideal = def ? clamp((def.falloffStart + def.falloffEnd) * 0.4, 8, 70) : 15;
    let f = 0;
    if (dist > ideal * 1.4) f = 1; else if (dist < ideal * 0.6) f = -1;
    if (this.time > this.strafeUntil) { this.strafeDir = this.rng.chance(0.5) ? 1 : -1; this.strafeUntil = this.time + 0.7 + this.rng.next() * 1.4; }
    inp.moveF = f;
    inp.moveR = this.strafeDir * (dist < 70 ? 0.8 : 0.3);
    inp.sprint = dist > ideal * 2.2 && !this.p.reloading && this.time - this.spottedAt < 99 && errAngle < 0.5 && !(def && dist < def.range * 0.7);
    inp.crouch = dist > 55 && this.time < this.crouchUntil || (dist > 55 && this.rng.chance(0.01) && (this.crouchUntil = this.time + 1.5) > 0);
    if (dist > 20) inp.ads = true;
    this.handleStuck(inp, dt);

    // fire control
    if (hasGun && def && eff && reacted) {
      const slot = cur as { mag: number };
      const inRange = dist < def.range * 0.8 && (def.id !== 'gale');
      const angleOk = errAngle < 0.035 + 0.5 / Math.max(8, dist);
      if (slot.mag <= 0 && p.ammo[def.ammo] > 0 && !p.reloading) inp.reload = true;
      if (inRange && angleOk && slot.mag > 0 && !p.reloading) {
        if (this.burstPause > 0) this.burstPause -= dt;
        else {
          inp.fire = def.auto ? true : this.time % 0.2 < 0.1;
          if (this.burstLeft <= 0) this.burstLeft = Math.round(def.auto ? 4 + this.rng.next() * 8 : 1);
          if (def.auto) {
            this.burstLeft -= dt * eff.rpm / 60;
            if (this.burstLeft <= 0) this.burstPause = 0.15 + this.rng.next() * (0.55 - this.skill * 0.3);
          } else { this.burstPause = 0.05 + this.rng.next() * 0.2; this.burstLeft = 0; }
        }
      }
    } else if (!hasGun) {
      // no weapon: try punching if adjacent, otherwise keep away
      if (dist < 2.2) inp.melee = true;
    }
    // utility: mist when hurt, orb at mid range
    if (this.utilityCd <= 0 && !p.using) {
      if (p.health < 45 && dist < 40) { const s = findItemSlot(p, 'mistCapsule'); if (s >= 0) { inp.slot = s; this.utilityCd = 6; this.holdUntil = this.time + 0.4; } }
      else if (dist > 7 && dist < 28 && this.rng.chance(0.004)) { const s = findItemSlot(p, 'windOrb'); if (s >= 0) { inp.slot = s; this.utilityCd = 8; this.holdUntil = this.time + 0.4; } }
    }
    const curSel = p.slots[p.selected];
    if (curSel && curSel.kind === 'item' && (curSel.item === 'mistCapsule' || curSel.item === 'windOrb')) {
      inp.fire = this.time % 0.3 < 0.12; inp.moveF = 0;
    }
  }

  private doFlee(inp: PlayerInput, dt: number): void {
    const p = this.p, t = this.target;
    if (!t) return;
    const away = Math.atan2(p.x - t.x, p.z - t.z);
    // try to break line of sight by moving perpendicular-away
    const want = away + 0.5 * this.strafeDir;
    this.yaw = this.turnToward(this.yaw, want, 8 * dt);
    inp.yaw = this.yaw;
    inp.moveF = 1; inp.sprint = true;
    if (this.time > this.strafeUntil) { this.strafeDir = -this.strafeDir; this.strafeUntil = this.time + 1.2; }
    this.handleStuck(inp, dt);
    // pop a mist if available
    const s = findItemSlot(p, 'mistCapsule');
    if (s >= 0 && this.utilityCd <= 0) { inp.slot = s; this.utilityCd = 7; }
    const cur = p.slots[p.selected];
    if (cur && cur.kind === 'item' && cur.item === 'mistCapsule') inp.fire = this.time % 0.3 < 0.12;
    void COMBAT; void dirFromYawPitch;
  }
}

function segHitsRect(ax: number, az: number, bx: number, bz: number, x0: number, z0: number, x1: number, z1: number): boolean {
  // Liang-Barsky segment vs rect
  let t0 = 0, t1 = 1;
  const dx = bx - ax, dz = bz - az;
  const p = [-dx, dx, -dz, dz];
  const q = [ax - x0, x1 - ax, az - z0, z1 - az];
  for (let i = 0; i < 4; i++) {
    if (Math.abs(p[i]) < 1e-9) { if (q[i] < 0) return false; }
    else {
      const t = q[i] / p[i];
      if (p[i] < 0) { if (t > t1) return false; if (t > t0) t0 = t; }
      else { if (t < t0) return false; if (t < t1) t1 = t; }
    }
  }
  return true;
}
