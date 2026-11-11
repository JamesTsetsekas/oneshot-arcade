// game-server: bot brains. Bots produce the same InputCmd a human client would and are simulated through the
// identical player step. They only know what they have perceived: vision cone + occlusion + smoke, heard
// noises, damage direction, and (skill permitting) sightings shared by teammates. No wall vision.
import { SUPPORT_BY_ID, SUPPORT_TUNING as ST } from '../content/kit';
import type { InterestNode } from '../content/mapTypes';
import { BotSkill, DT, TICK_RATE } from '../content/tuning';
import type { WeaponClass } from '../content/weapons';
import { ENT } from '../protocol/messages';
import { chestHeight, eyeHeight, headHeight } from '../sim/hitboxes';
import { angleDiff, clamp, DEG, Rng } from '../sim/math';
import type { NavPoint } from '../sim/nav';
import { BTN, InputCmd } from '../sim/player';
import type { Room, SPlayer } from './room';

interface Percept { vis: boolean; visT: number; lastTick: number; x: number; y: number; z: number; known: boolean }

const RANGE: Record<WeaponClass, [number, number]> = {
  smg: [3, 13], shotgun: [2, 8], rifle: [7, 30], battle: [14, 46], lmg: [10, 40], marksman: [22, 75], pistol: [3, 16], heavyPistol: [4, 22], machinePistol: [2, 10],
};

export type BotMode = 'route' | 'hold' | 'engage' | 'investigate' | 'cover' | 'regroup';

export class BotBrain {
  mode: BotMode = 'route';
  aimYaw = 0;
  aimPitch = 0;
  targetId = -1;
  private room: Room;
  private me: SPlayer;
  private skill: BotSkill;
  private rng: Rng;
  private seq = 0;
  private percepts = new Map<number, Percept>();
  private path: NavPoint[] = [];
  private pathI = 0;
  private goal: NavPoint | null = null;
  private goalNode: InterestNode | null = null;
  private repathAt = 0;
  private holdUntil = 0;
  private holdYaw = 0;
  private threat: { x: number; y: number; z: number; tick: number } | null = null;
  private strafeDir = 1;
  private strafeUntil = 0;
  private crouchUntil = 0;
  private burstLeft = 0;
  private pauseUntil = 0;
  private nYaw = 0;
  private nPitch = 0;
  private acquiredAt = 0;
  private lastX = 0;
  private lastZ = 0;
  private stuck = 0;
  private jumpTick = 0;
  private coverUntil = 0;
  private lane = 0;
  private equipAt = 0;
  private throwPlan: { kind: 'lethal' | 'tactical'; yaw: number; pitch: number; until: number } | null = null;
  private supportPlan: { tier: number; yaw: number; pitch: number; until: number } | null = null;
  private wantSlot = 0;
  private reloadTap = 0;
  private lookYaw = 0;
  private headshot = false;

  constructor(room: Room, me: SPlayer, skill: BotSkill, rng: Rng) {
    this.room = room; this.me = me; this.skill = skill; this.rng = rng;
  }

  onSpawn(): void {
    const s = this.me.st;
    this.aimYaw = s.yaw; this.aimPitch = 0; this.lookYaw = s.yaw;
    this.mode = 'route';
    this.path = []; this.pathI = 0; this.goal = null; this.goalNode = null;
    this.threat = null; this.targetId = -1;
    this.percepts.clear();
    this.burstLeft = 0; this.stuck = 0; this.wantSlot = 0;
    this.throwPlan = null; this.supportPlan = null;
    this.lane = this.rng.int(3);
    this.equipAt = this.room.tickN + Math.round(this.rng.range(4, 9) * TICK_RATE);
    this.lastX = s.px; this.lastZ = s.pz;
  }

  applyRecoil(yawDeg: number, pitchDeg: number): void {
    const k = 1 - this.skill.recoilComp;
    this.aimYaw += yawDeg * DEG * k;
    this.aimPitch = clamp(this.aimPitch + pitchDeg * DEG * k, -1.4, 1.4);
  }

  onDamaged(attacker: SPlayer, ax: number, ay: number, az: number): void {
    // damage tells the bot roughly where the shooter is, not exactly
    const err = 2.5;
    this.threat = { x: ax + this.rng.range(-err, err), y: ay - 1.5, z: az + this.rng.range(-err, err), tick: this.room.tickN };
    const p = this.percept(attacker.id);
    p.known = true; p.x = this.threat.x; p.y = this.threat.y; p.z = this.threat.z; p.lastTick = this.room.tickN;
  }

  private percept(id: number): Percept {
    let p = this.percepts.get(id);
    if (!p) { p = { vis: false, visT: 0, lastTick: -9999, x: 0, y: 0, z: 0, known: false }; this.percepts.set(id, p); }
    return p;
  }

  // ---------------------------------------------------------------- perception (10 Hz)
  private perceive(): void {
    const room = this.room, me = this.me, s = me.st, tick = room.tickN;
    const ex = s.px, ey = s.py + eyeHeight(s.crouchT), ez = s.pz;
    const blind = me.flashT > 0.5;
    const cp = Math.cos(this.aimPitch);
    const fx = Math.sin(this.aimYaw) * cp, fy = Math.sin(this.aimPitch), fz = Math.cos(this.aimYaw) * cp;
    for (const q of room.players) {
      if (q.team === me.team) continue;
      const p = this.percept(q.id);
      if (!q.alive) { p.vis = false; p.visT = 0; p.known = false; continue; }
      const cy = q.st.py + chestHeight(q.st.crouchT);
      const dx = q.st.px - ex, dy = cy - ey, dz = q.st.pz - ez;
      const d = Math.hypot(dx, dy, dz);
      let vis = false;
      if (!blind && d < 85) {
        const dot = d > 0.01 ? (dx * fx + dy * fy + dz * fz) / d : 1;
        if (dot > 0.47 || d < 2.5) {
          vis = room.world.visible(ex, ey, ez, q.st.px, cy, q.st.pz) || room.world.visible(ex, ey, ez, q.st.px, q.st.py + headHeight(q.st.crouchT), q.st.pz);
          if (vis && room.smokeBlocks(ex, ey, ez, q.st.px, cy, q.st.pz)) vis = false;
        }
      }
      if (vis) {
        p.visT = p.vis ? p.visT + 0.1 : 0;
        p.vis = true; p.known = true;
        p.x = q.st.px; p.y = q.st.py; p.z = q.st.pz; p.lastTick = tick;
        if (this.skill.share && tick % 12 === 0) room.intel[me.team].push({ x: p.x, y: p.y, z: p.z, tick });
      } else {
        p.vis = false; p.visT = 0;
      }
    }
    // hearing
    for (const n of room.noises) {
      if (n.team === me.team || tick - n.tick > 8) continue;
      const d = Math.hypot(n.x - ex, n.z - ez, n.y - s.py);
      if (d > n.r) continue;
      const err = 1 + d * 0.12;
      if (!this.threat || tick - this.threat.tick > 40 || d < Math.hypot(this.threat.x - ex, this.threat.z - ez)) {
        this.threat = { x: n.x + this.rng.range(-err, err), y: n.y, z: n.z + this.rng.range(-err, err), tick };
      }
    }
    // shared team sightings (teamwork scales with skill)
    if (this.skill.share && (!this.threat || tick - this.threat.tick > 90)) {
      let best: { x: number; y: number; z: number; tick: number } | null = null, bd = 55;
      for (const i of room.intel[me.team]) {
        if (tick - i.tick > 4 * TICK_RATE) continue;
        const d = Math.hypot(i.x - ex, i.z - ez);
        if (d < bd) { bd = d; best = i; }
      }
      if (best) this.threat = { x: best.x, y: best.y, z: best.z, tick: best.tick };
    }
    // target selection among enemies in sight
    let tgt = -1, bestScore = Infinity;
    for (const [id, p] of this.percepts) {
      if (!p.vis) continue;
      const d = Math.hypot(p.x - ex, p.z - ez);
      const sc = d - (id === this.targetId ? 6 : 0);
      if (sc < bestScore) { bestScore = sc; tgt = id; }
    }
    if (tgt !== this.targetId) {
      this.targetId = tgt;
      this.acquiredAt = tick;
      this.headshot = this.rng.chance(this.skill.headPref);
      this.burstLeft = 0;
    }
    if (tgt >= 0) { const p = this.percepts.get(tgt)!; this.threat = { x: p.x, y: p.y, z: p.z, tick }; }
  }

  // ---------------------------------------------------------------- navigation helpers
  private setGoal(g: NavPoint, extra = true): void {
    const room = this.room, s = this.me.st;
    this.goal = g;
    const a = room.nav.nearest(s.px, s.py, s.pz), b = room.nav.nearest(g.x, g.y, g.z, 8);
    const lane = this.lane, team = this.me.team, v = this.skill.routeVariety;
    const cost = extra ? (x: number, z: number): number => {
      let c = room.heatAt(team, x, z) * 1.6;
      if (v > 0) {
        if (lane === 0 && z < 16) c += 0.5 * v; // north-lane preference
        else if (lane === 2 && z > -16) c += 0.5 * v; // south-lane preference
        else if (lane === 1 && Math.abs(z) > 22) c += 0.5 * v;
      }
      return c;
    } : undefined;
    const nodes = room.nav.findPath(a, b, cost);
    this.path = nodes ? room.nav.smooth(nodes) : [];
    this.pathI = 0;
    this.repathAt = room.tickN + Math.round(this.rng.range(1.2, 2.2) * TICK_RATE);
  }

  private pickRouteGoal(): void {
    const room = this.room, me = this.me, s = me.st, rng = this.rng;
    this.goalNode = null;
    const roll = rng.next();
    if (roll < 0.14) {
      // regroup on the nearest living teammate
      let best: SPlayer | null = null, bd = Infinity;
      for (const q of room.players) {
        if (q.team !== me.team || q === me || !q.alive) continue;
        const d = Math.hypot(q.st.px - s.px, q.st.pz - s.pz);
        if (d > 6 && d < bd) { bd = d; best = q; }
      }
      if (best) { this.mode = 'regroup'; this.setGoal({ x: best.st.px, y: best.st.py, z: best.st.pz }); return; }
    }
    // weighted pick from the map's interest nodes
    const nodes = room.map.interest;
    let total = 0;
    const weights: number[] = [];
    const enemyHomeX = me.team === 0 ? 30 : -30;
    for (const n of nodes) {
      const d = Math.hypot(n.x - s.px, n.z - s.pz);
      let w = 1;
      if (d < 8) w *= 0.1;
      else if (d > 70) w *= 0.6;
      w *= 1 + 0.35 * (1 - Math.min(1, Math.abs(n.x - enemyHomeX * 0.4) / 60));
      w *= 1 / (1 + room.heatAt(me.team, n.x, n.z) * 0.7);
      if (this.lane === 0 && n.z > 20) w *= 1.8;
      if (this.lane === 2 && n.z < -20) w *= 1.8;
      if (this.lane === 1 && Math.abs(n.z) < 20) w *= 1.5;
      weights.push(w); total += w;
    }
    let r = rng.next() * total, pick = nodes[0];
    for (let i = 0; i < nodes.length; i++) { r -= weights[i]; if (r <= 0) { pick = nodes[i]; break; } }
    this.goalNode = pick;
    this.mode = 'route';
    this.setGoal({ x: pick.x + rng.range(-1.5, 1.5), y: pick.y, z: pick.z + rng.range(-1.5, 1.5) });
  }

  private findCover(tx: number, ty: number, tz: number): NavPoint | null {
    const room = this.room, s = this.me.st;
    let best: NavPoint | null = null, bd = Infinity;
    for (let i = 0; i < 14; i++) {
      const n = room.nav.randomNear(s.px, s.py, s.pz, 4, 15, this.rng.next(), this.rng.next());
      if (n < 0) continue;
      const p = room.nav.point(n);
      if (room.world.visible(p.x, p.y + 1.3, p.z, tx, ty + 1.5, tz)) continue;
      const d = Math.hypot(p.x - s.px, p.z - s.pz) + Math.abs(p.y - s.py) * 3;
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }

  // ---------------------------------------------------------------- per-tick decision + input synthesis
  think(): InputCmd {
    const room = this.room, me = this.me, s = me.st, tick = room.tickN, rng = this.rng, skill = this.skill;
    if ((tick + me.id * 2) % 6 === 0) this.perceive();
    let buttons = 0, mx = 0, mz = 0;
    const ex = s.px, ey = s.py + eyeHeight(s.crouchT), ez = s.pz;
    const w = me.lo.weapons[s.slot], cls = w.def.cls;
    const mag = s.slot ? s.mag1 : s.mag0, res = s.slot ? s.res1 : s.res0;
    const blind = me.flashT > 0.5;
    const target = this.targetId >= 0 ? room.players[this.targetId] : null;
    const tp = target ? this.percepts.get(target.id) : undefined;
    const seeing = !!(target && tp && tp.vis && target.alive);
    const threatAge = this.threat ? (tick - this.threat.tick) / TICK_RATE : 99;
    let aimX = 0, aimY = 0, aimZ = 0, haveAim = false;
    let moveTo: NavPoint | null = null;
    let sprint = false;
    let wantFire = false;
    let wantAds = false;

    // aim noise (Ornstein-Uhlenbeck) - larger just after acquiring and when blind
    const settle = seeing ? 1 + 2.2 * Math.exp(-((tick - this.acquiredAt) / TICK_RATE) / 0.45) : 1.5;
    const sigma = skill.noise * DEG * settle * (blind ? 6 : 1) * (Math.hypot(s.vx, s.vz) > 3 ? 1.3 : 1);
    this.nYaw += (-this.nYaw * 3.2) * DT + rng.gauss() * sigma * Math.sqrt(2 * 3.2 * DT);
    this.nPitch += (-this.nPitch * 3.2) * DT + rng.gauss() * sigma * 0.6 * Math.sqrt(2 * 3.2 * DT);

    // ---- mode transitions
    if (seeing) {
      const hurt = me.health < 38;
      if (this.mode !== 'cover' && hurt && tick > this.coverUntil && rng.chance(0.04 + 0.03 * skill.equip)) {
        const c = this.findCover(tp!.x, tp!.y, tp!.z);
        this.coverUntil = tick + 5 * TICK_RATE;
        if (c) { this.mode = 'cover'; this.setGoal(c, false); this.holdUntil = tick + Math.round(4.5 * TICK_RATE); }
      }
      if (this.mode !== 'cover') this.mode = 'engage';
    } else if (this.mode === 'engage') {
      this.mode = 'investigate';
      if (this.threat) this.setGoal({ x: this.threat.x, y: this.threat.y, z: this.threat.z }, false);
    } else if (this.mode === 'cover') {
      if (tick > this.holdUntil || me.health > 75) { this.mode = this.threat && threatAge < 5 ? 'investigate' : 'route'; this.goal = null; }
    } else if (this.threat && threatAge < 3.5 && this.mode !== 'investigate') {
      this.mode = 'investigate';
      this.setGoal({ x: this.threat.x, y: this.threat.y, z: this.threat.z }, false);
    } else if (this.mode === 'investigate' && (threatAge > 6 || (this.goal && Math.hypot(this.goal.x - s.px, this.goal.z - s.pz) < 2.5 && threatAge > 1.5))) {
      this.mode = 'route'; this.goal = null; this.threat = null;
    }

    // ---- behaviour per mode
    if (this.mode === 'engage' && seeing && target && tp) {
      const th = target.st.py + (this.headshot ? headHeight(target.st.crouchT) - 0.04 : chestHeight(target.st.crouchT));
      aimX = target.st.px; aimY = th; aimZ = target.st.pz; haveAim = true;
      const d = Math.hypot(aimX - ex, aimZ - ez);
      const [rMin, rMax] = RANGE[cls];
      const acquired = tp.visT >= skill.reaction * (d > 35 ? 1.25 : 1);
      wantAds = cls === 'marksman' ? true : cls === 'shotgun' ? false : d > 9;
      // movement: close, back off, or strafe
      if (d > rMax) {
        if (tick >= this.repathAt || !this.goal) this.setGoal({ x: tp.x, y: tp.y, z: tp.z }, false);
        moveTo = this.path[this.pathI] ?? null;
      } else {
        if (tick > this.strafeUntil) {
          this.strafeDir = rng.chance(0.5) ? 1 : -1;
          if (rng.chance(0.2)) this.strafeDir = 0;
          this.strafeUntil = tick + Math.round(rng.range(0.5, 1.4) * TICK_RATE);
          if ((cls === 'lmg' || cls === 'marksman') && d > 14) this.crouchUntil = tick + Math.round(rng.range(1.5, 3) * TICK_RATE);
          else if (rng.chance(0.12) && d > 10) this.crouchUntil = tick + Math.round(rng.range(0.6, 1.4) * TICK_RATE);
        }
        const sy = Math.sin(this.aimYaw), cy = Math.cos(this.aimYaw);
        // keep strafes on walkable ground
        const sxp = s.px + cy * this.strafeDir * 1.2, szp = s.pz - sy * this.strafeDir * 1.2;
        if (this.strafeDir !== 0 && !room.nav.isWalkable(sxp, s.py, szp)) this.strafeDir = -this.strafeDir;
        mx = this.strafeDir * (wantAds ? 0.8 : 1);
        if (d < rMin && room.nav.isWalkable(s.px - sy * 1.2, s.py, s.pz - cy * 1.2)) mz = -1;
        else if (d > (rMin + rMax) * 0.55 && cls !== 'marksman' && cls !== 'lmg') mz = 0.6;
      }
      // trigger discipline
      if (acquired && !blind) {
        const dy = Math.atan2(aimX - ex, aimZ - ez), dp = Math.atan2(aimY - ey, d);
        const errY = Math.abs(angleDiff(dy, this.aimYaw)), errP = Math.abs(dp - this.aimPitch);
        const tolY = Math.atan(0.42 / Math.max(1, d)) + 0.35 * DEG, tolP = Math.atan(0.6 / Math.max(1, d)) + 0.35 * DEG;
        const onTarget = errY < tolY * 1.6 && errP < tolP * 1.6;
        const adsReady = !wantAds || s.adsT > (cls === 'marksman' ? 0.97 : 0.5);
        if (onTarget && adsReady && tick >= this.pauseUntil) {
          if (w.def.fire === 'auto') {
            if (this.burstLeft <= 0) this.burstLeft = Math.round(rng.range(skill.burstMin, skill.burstMax) * (d < 10 ? 2.2 : d > 30 ? 0.6 : 1));
            wantFire = true;
          } else {
            // semi / pump / bolt: tap with a human-like cadence
            wantFire = true;
            this.pauseUntil = tick + Math.round((w.interval + rng.range(0.05, 0.16) * (2 - skill.equip)) * TICK_RATE);
          }
        }
      }
      if (mag === 0) {
        const other = s.slot ? s.mag0 : s.mag1;
        if (d < 12 && other > 0 && s.slot === 0) this.wantSlot = 1;
      }
      // a shotgun is pointless across a lane: use the sidearm at range and keep closing the distance
      if (me.lo.weapons[0].def.cls === 'shotgun') {
        if (d > 13 && (s.mag1 > 0 || s.res1 > 0)) this.wantSlot = 1;
        else if (d < 10 && (s.mag0 > 0 || s.res0 > 0)) this.wantSlot = 0;
        if (d > 9) { mz = 1; }
      }
    } else if (this.mode === 'cover') {
      sprint = true;
      moveTo = this.path[this.pathI] ?? null;
      if (this.threat) { aimX = this.threat.x; aimY = this.threat.y + 1.3; aimZ = this.threat.z; haveAim = !moveTo; }
      if (!moveTo && mag < w.mag && res > 0 && s.reloadT < 0) this.reloadTap = 2;
      if (!moveTo) buttons |= BTN.CROUCH;
    } else if (this.mode === 'investigate' && this.threat) {
      if (tick >= this.repathAt && threatAge < 2) this.setGoal({ x: this.threat.x, y: this.threat.y, z: this.threat.z }, false);
      moveTo = this.path[this.pathI] ?? null;
      const dT = Math.hypot(this.threat.x - ex, this.threat.z - ez);
      // pre-aim where the threat was last sensed once it is close or in the open
      if (dT < 22 || !moveTo) { aimX = this.threat.x; aimY = this.threat.y + 1.3; aimZ = this.threat.z; haveAim = true; }
      sprint = dT > 26 && threatAge > 1;
      this.considerEquipment(dT);
    } else {
      // route / hold / regroup
      if (this.mode === 'hold') {
        if (tick > this.holdUntil) { this.mode = 'route'; this.goal = null; }
        else { this.lookYaw = this.holdYaw + Math.sin(tick * 0.02 + me.id) * 0.5; }
      }
      if (this.mode !== 'hold') {
        if (!this.goal || this.pathI >= this.path.length) {
          if (this.goalNode && this.goalNode.hold && this.goal && rng.chance(0.8)) {
            this.mode = 'hold';
            this.holdUntil = tick + Math.round(rng.range(3.5, 8) * TICK_RATE);
            this.holdYaw = this.goalNode.yaw;
            this.goalNode = null;
          } else this.pickRouteGoal();
        } else if (this.mode === 'regroup' && tick >= this.repathAt) {
          this.mode = 'route'; this.goal = null;
        }
        moveTo = this.path[this.pathI] ?? null;
        sprint = threatAge > 3 && this.path.length - this.pathI > 1;
      }
      if (s.slot === 1 && (s.mag0 > 0 || s.res0 > 0)) this.wantSlot = 0;
      if (mag < w.mag * 0.5 && res > 0 && s.reloadT < 0 && threatAge > 2.5) this.reloadTap = 2;
      this.considerSupport();
    }
    if (this.mode !== 'engage' && s.slot === 1 && threatAge > 2 && (s.mag0 > 0 || s.res0 > 0)) this.wantSlot = 0;

    // ---- path following
    if (moveTo) {
      let dx = moveTo.x - s.px, dz = moveTo.z - s.pz;
      let dist = Math.hypot(dx, dz);
      while (dist < 0.55 && Math.abs(moveTo.y - s.py) < 1.5 && this.pathI < this.path.length - 1) {
        this.pathI++;
        moveTo = this.path[this.pathI];
        dx = moveTo.x - s.px; dz = moveTo.z - s.pz; dist = Math.hypot(dx, dz);
      }
      if (dist < 0.55 && this.pathI >= this.path.length - 1) { this.pathI = this.path.length; moveTo = null; }
      else {
        const wyaw = Math.atan2(dx, dz);
        if (!haveAim) this.lookYaw = wyaw;
        // separation from teammates so squads do not stack on one point
        let ax = dx / dist, az = dz / dist;
        for (const q of room.players) {
          if (q === me || q.team !== me.team || !q.alive) continue;
          const qx = s.px - q.st.px, qz = s.pz - q.st.pz, qd = Math.hypot(qx, qz);
          if (qd < 1.1 && qd > 0.01) { ax += (qx / qd) * 0.5; az += (qz / qd) * 0.5; }
        }
        const yawUse = haveAim ? this.aimYaw : this.aimYaw;
        const sy = Math.sin(yawUse), cy = Math.cos(yawUse);
        mz = ax * sy + az * cy;
        mx = ax * cy - az * sy;
        const l = Math.hypot(mx, mz);
        if (l > 1) { mx /= l; mz /= l; }
        if (sprint && mz < 0.75) sprint = false; // must face travel direction to sprint
      }
    }

    // ---- stuck recovery
    if (tick % 30 === me.id % 30) {
      const moved = Math.hypot(s.px - this.lastX, s.pz - this.lastZ);
      if ((moveTo || this.mode === 'engage') && (Math.abs(mx) + Math.abs(mz) > 0.3) && moved < 0.25) this.stuck++; else this.stuck = 0;
      this.lastX = s.px; this.lastZ = s.pz;
      if (this.stuck >= 2) { this.jumpTick = tick + 2; this.repathAt = 0; this.strafeDir = -this.strafeDir; }
      if (this.stuck >= 4) { this.goal = null; this.path = []; this.mode = 'route'; this.threat = null; this.stuck = 0; }
    }
    if (tick === this.jumpTick) buttons |= BTN.JUMP;

    // ---- planned equipment / support use overrides aim briefly
    if (this.throwPlan) {
      const pl = this.throwPlan;
      aimX = ex + Math.sin(pl.yaw) * 10; aimZ = ez + Math.cos(pl.yaw) * 10; aimY = ey + Math.tan(pl.pitch) * 10; haveAim = true;
      wantFire = false; sprint = false;
      const ok = Math.abs(angleDiff(pl.yaw, this.aimYaw)) < 0.06 && Math.abs(pl.pitch - this.aimPitch) < 0.06;
      if (ok && s.actT <= 0 && s.swapT <= 0) { buttons |= pl.kind === 'lethal' ? BTN.LETHAL : BTN.TACTICAL; this.throwPlan = null; }
      else if (tick > pl.until || seeing) this.throwPlan = null;
    } else if (this.supportPlan) {
      const pl = this.supportPlan;
      aimX = ex + Math.sin(pl.yaw) * 10; aimZ = ez + Math.cos(pl.yaw) * 10; aimY = ey + Math.tan(pl.pitch) * 10; haveAim = true;
      const ok = Math.abs(angleDiff(pl.yaw, this.aimYaw)) < 0.05 && Math.abs(pl.pitch - this.aimPitch) < 0.05;
      if (ok) { buttons |= BTN.SUPPORT; this.supportPlan = null; }
      else if (tick > pl.until) this.supportPlan = null;
    }

    // ---- aim integration (rate-limited convergence + noise)
    let desYaw = this.lookYaw, desPitch = 0;
    if (haveAim) {
      const dx = aimX - ex, dy = aimY - ey, dz = aimZ - ez;
      desYaw = Math.atan2(dx, dz);
      desPitch = Math.atan2(dy, Math.hypot(dx, dz));
    }
    const k = 1 - Math.exp(-skill.aimK * (seeing ? 1 : 0.75) * DT);
    const maxStep = skill.turnRate * DEG * DT;
    const stepY = clamp(angleDiff(desYaw + (seeing ? this.nYaw : this.nYaw * 0.3), this.aimYaw) * k, -maxStep, maxStep);
    const stepP = clamp((desPitch + (seeing ? this.nPitch : 0) - this.aimPitch) * k, -maxStep, maxStep);
    this.aimYaw += stepY;
    this.aimPitch = clamp(this.aimPitch + stepP, -1.4, 1.4);

    // ---- buttons
    if (wantFire) {
      buttons |= BTN.FIRE;
      if (w.def.fire === 'auto' && s.fireCd <= DT && mag > 0) {
        this.burstLeft--;
        if (this.burstLeft <= 0) this.pauseUntil = tick + Math.round(rng.range(0.12, 0.34) * (2.2 - skill.equip) * TICK_RATE);
      }
    }
    if (wantAds) buttons |= BTN.ADS;
    if (sprint && !wantFire && !wantAds) buttons |= BTN.SPRINT;
    if (tick < this.crouchUntil && this.mode === 'engage') buttons |= BTN.CROUCH;
    if (this.reloadTap > 0) { if (this.reloadTap === 2) buttons |= BTN.RELOAD; this.reloadTap--; }

    return { seq: ++this.seq, rt: tick, mx, mz, yaw: this.aimYaw, pitch: this.aimPitch, buttons, slot: this.wantSlot, sel: this.pendingSel };
  }

  // ---------------------------------------------------------------- equipment + support heuristics
  private considerEquipment(dist: number): void {
    const room = this.room, me = this.me, s = me.st, tick = room.tickN;
    if (tick < this.equipAt || !this.threat || this.throwPlan || s.actT > 0) return;
    const age = (tick - this.threat.tick) / TICK_RATE;
    if (age < 0.4 || age > 3.5 || dist < 7.5 || dist > 26) return;
    this.equipAt = tick + Math.round(this.rng.range(5, 11) / Math.max(0.3, this.skill.equip) * TICK_RATE);
    if (!this.rng.chance(0.75 * this.skill.equip)) return;
    const t = this.threat;
    // grenade safety: never throw onto teammates
    for (const q of room.players) {
      if (q.team === me.team && q !== me && q.alive && Math.hypot(q.st.px - t.x, q.st.pz - t.z) < 7.5) return;
    }
    let kind: 'lethal' | 'tactical' | null = null;
    const le = me.lo.lethal.id, ta = me.lo.tactical.id;
    if (s.lethal >= 1 && le !== 'mine' && this.rng.chance(0.6)) kind = 'lethal';
    else if (s.tactical >= 1 && (ta === 'flash' || ta === 'dart' || (ta === 'smoke' && me.health < 60))) kind = 'tactical';
    else if (s.lethal >= 1 && le === 'mine' && dist < 12) kind = 'lethal';
    if (!kind) return;
    const def = kind === 'lethal' ? me.lo.lethal : me.lo.tactical;
    const v = def.speed, g = def.id === 'dart' ? 5 : 14;
    const ey = s.py + eyeHeight(s.crouchT);
    const dy = t.y + 0.3 - ey;
    // ballistic low arc: tan(theta) solves the standard projectile equation
    const a = (g * dist * dist) / (2 * v * v);
    const disc = dist * dist - 4 * a * (a + dy);
    let pitch = disc >= 0 ? Math.atan((dist - Math.sqrt(disc)) / (2 * a)) : 0.6;
    pitch -= def.id === 'dart' ? 0.01 : 0.11; // the throw adds a fixed loft
    if (def.id === 'mine') pitch = -0.2;
    this.throwPlan = { kind, yaw: Math.atan2(t.x - s.px, t.z - s.pz), pitch: clamp(pitch, -0.6, 1.0), until: tick + 90 };
  }

  private considerSupport(): void {
    const room = this.room, me = this.me, s = me.st, tick = room.tickN;
    if (!me.supports || this.supportPlan || tick % 30 !== me.id % 30) return;
    for (let tier = 2; tier >= 0; tier--) {
      if (!(me.supports & (1 << tier))) continue;
      const def = SUPPORT_BY_ID[me.lo.supports[tier]];
      if (def.tier === 2 && room.tier8Active(me.team)) continue;
      if (!def.targeted) {
        if (def.id === 'drone' && !room.world.skyOpen(s.px, s.py + 1.8, s.pz)) continue; // launch it outdoors
        if (def.id === 'pod' && room.entities.some((e) => e.type === ENT.POD && e.team === me.team && !e.dead)) continue;
        this.supportPlan = { tier, yaw: this.aimYaw, pitch: this.aimPitch, until: tick + 30 };
        this.pendingSel = tier;
        return;
      }
      // targeted actions need a recent sensed threat that is outdoors
      const t = this.threat ?? this.bestIntel();
      if (!t || (tick - t.tick) / TICK_RATE > 4) continue;
      if (!room.world.skyOpen(t.x, t.y + 0.2, t.z)) continue;
      const ey = s.py + eyeHeight(s.crouchT);
      const d = Math.hypot(t.x - s.px, t.z - s.pz);
      if (d < 12 || d > 80) continue;
      if (def.id === 'mortar' && !room.world.clearLine(s.px, ey, s.pz, t.x, t.y + 0.3, t.z)) continue;
      for (const q of room.players) if (q.team === me.team && q.alive && Math.hypot(q.st.px - t.x, q.st.pz - t.z) < ST.mortarRadius && def.id === 'mortar') return;
      this.supportPlan = { tier, yaw: Math.atan2(t.x - s.px, t.z - s.pz), pitch: Math.atan2(t.y + 0.1 - ey, d), until: tick + 60 };
      this.pendingSel = tier;
      return;
    }
  }
  pendingSel = 0;

  private bestIntel(): { x: number; y: number; z: number; tick: number } | null {
    const list = this.room.intel[this.me.team];
    return list.length ? list[list.length - 1] : null;
  }
}
