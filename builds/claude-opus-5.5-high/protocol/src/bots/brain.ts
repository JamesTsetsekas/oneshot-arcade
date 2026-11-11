// bots: server-side team planner (blackboard) + per-bot brain. Bots act only
// through the same input/request interface as humans and perceive only via the
// room's legal sight/sound queries — no hidden information.

import { DT, TICK_RATE, UTILITY, type UtilityId } from '../content/rules';
import { WEAPONS, type WeaponId } from '../content/weapons';
import { BTN, type InputCmd, type ItemId, type TeamIndex } from '../protocol/messages';
import type { MatchRoom } from '../sim/room';
import type { Player } from '../sim/state';
import { recoilOffset } from '../sim/combat';
import { simulateTrajectory, throwState } from '../sim/grenades';
import { DEG, anglesFromDir, clamp, vdistH, wrapAngle, type Vec3 } from '../sim/math';
import { eyeHeight } from '../sim/movement';
import { Rng, hash32 } from '../sim/rng';
import { TACTICS, type Hold, type Lineup, type P2, type SiteId } from './tactics';
import type { GameMap } from '../map/runtime';

type Style = 'rush' | 'execute' | 'split' | 'default';

interface Assignment {
  route: 'main' | 'mid';
  site: SiteId | 'mid';
  hold: Hold | null;
  lineup: Lineup | null;
  lurk: boolean;
}

let lineupCache: { hash: string; lineups: Lineup[] } | null = null;

/** Validate authored lineups by brute-force searching throw angles in the shared grenade sim. */
export function validateLineups(map: GameMap): Lineup[] {
  if (lineupCache && lineupCache.hash === map.hash) return lineupCache.lineups;
  const out: Lineup[] = [];
  for (const base of TACTICS.lineups) {
    const l: Lineup = { ...base };
    const fy = Math.max(0, map.floorHeight(l.from[0], l.from[1], 5));
    const pos = { x: l.from[0], y: fy, z: l.from[1] };
    const yaw = Math.atan2(l.target[0] - l.from[0], l.target[1] - l.from[1]);
    let best = Infinity;
    for (const lob of [false, true]) {
      for (let pd = -60; pd <= 20; pd += 1.5) {
        const pitch = pd * DEG;
        const body = throwState(pos, { x: 0, y: 0, z: 0 }, 0, yaw, pitch, lob, map);
        const traj = simulateTrajectory(map, body, DT, UTILITY[l.type].onRest ? 5 : UTILITY[l.type].fuse);
        const end = l.type === 'flash' ? traj[Math.min(traj.length - 1, Math.round(UTILITY.flash.fuse * TICK_RATE))] : traj[traj.length - 1];
        const d = Math.hypot(end.x - l.target[0], end.z - l.target[1]);
        if (d < best) {
          best = d;
          l.yaw = yaw;
          l.pitch = pitch;
          l.lob = lob;
          l.landing = [end.x, end.y, end.z];
        }
      }
    }
    l.valid = best < (l.type === 'flash' ? 5 : 2.8);
    out.push(l);
  }
  lineupCache = { hash: map.hash, lineups: out };
  return out;
}

const siteOf = (x: number, z: number): SiteId | null => {
  for (const s of ['A', 'B'] as SiteId[]) {
    const c = TACTICS.sites[s].center;
    if (Math.hypot(x - c[0], z - c[1]) < 20) return s;
  }
  return null;
};

export class TeamPlanner {
  readonly room: MatchRoom;
  readonly team: TeamIndex;
  rng: Rng;
  site: SiteId = 'A';
  style: Style = 'execute';
  executeTick = 0;
  eco = false;
  force = false;
  assignments = new Map<number, Assignment>();
  rotateTo: SiteId | null = null;
  rotateTick = 0;
  planted: SiteId | null = null;
  saving = false;
  lastRadio = -999;
  intel: { site: SiteId | 'mid'; count: number; tick: number }[] = [];
  lineups: Lineup[] = [];

  constructor(room: MatchRoom, team: TeamIndex) {
    this.room = room;
    this.team = team;
    this.rng = new Rng(hash32(room.seed, team, 991));
    this.lineups = validateLineups(room.map);
  }

  get attacking(): boolean {
    return this.room.sideOf(this.team) === 'intrusion';
  }

  members(): Player[] {
    return this.room.players.filter((p) => p.team === this.team);
  }

  onRoundStart(): void {
    const r = this.room;
    this.rng = new Rng(hash32(r.seed, this.team, r.round, 313));
    this.rotateTo = null;
    this.planted = null;
    this.saving = false;
    this.intel = [];
    this.assignments.clear();
    const mates = this.members();
    const avg = mates.reduce((s, p) => s + p.money, 0) / Math.max(1, mates.length);
    const pistol = r.round === 1 || r.round === r.rules.halfRounds + 1;
    this.eco = !pistol && avg < 2100 && !r.rules.practice;
    this.force = !pistol && !this.eco && avg < 3600 && r.lossTier[this.team] >= 2;
    const bots = mates.filter((p) => p.bot);
    if (this.attacking) {
      this.site = this.rng.chance(0.5) ? 'A' : 'B';
      const roll = this.rng.next();
      this.style = this.eco ? 'rush' : roll < 0.2 ? 'rush' : roll < 0.55 ? 'execute' : roll < 0.8 ? 'split' : 'default';
      const buyEnd = r.phaseEnd;
      const delay = this.style === 'rush' ? 0 : this.style === 'execute' ? this.rng.range(13, 22) : this.style === 'split' ? this.rng.range(16, 24) : this.rng.range(32, 46);
      this.executeTick = buyEnd + Math.round(delay * TICK_RATE);
      const siteLineups = this.lineups.filter((l) => l.site === this.site && l.valid);
      bots.forEach((p, i) => {
        const route: 'main' | 'mid' = this.style === 'split' && i >= 3 ? 'mid' : this.style === 'default' && i === 4 ? 'mid' : 'main';
        const lineup = this.style === 'rush' || route === 'mid' ? null : siteLineups[i] ?? null;
        this.assignments.set(p.id, { route, site: this.site, hold: null, lineup, lurk: this.style === 'default' && i === 4 });
      });
    } else {
      const slots: (SiteId | 'mid')[] = ['A', 'A', 'B', 'B', 'mid'];
      // seeded shuffle so stacks vary round to round
      for (let i = slots.length - 1; i > 0; i--) {
        const j = this.rng.int(i + 1);
        [slots[i], slots[j]] = [slots[j], slots[i]];
      }
      const used: Record<string, number> = { A: 0, B: 0, mid: 0 };
      bots.forEach((p, i) => {
        const site = slots[i % slots.length];
        const holds = TACTICS.holds[site];
        const offset = this.rng.int(holds.length);
        const hold = holds[(used[site]++ + offset) % holds.length];
        this.assignments.set(p.id, { route: 'main', site, hold, lineup: null, lurk: false });
      });
    }
  }

  update(): void {
    const r = this.room;
    if (r.phase !== 'live' && r.phase !== 'planted') return;
    if (!this.attacking || this.planted) return;
    // save decision: hopeless late-round attack
    const alive = this.members().filter((p) => p.alive).length;
    const enemies = r.players.filter((p) => p.team !== this.team && p.alive).length;
    const left = (r.phaseEnd - r.tick) * DT;
    if (!this.saving && alive <= 1 && enemies >= 3 && left < 25) {
      this.saving = true;
      this.say(this.members().find((p) => p.alive && p.bot), 'Saving this one.');
    }
    if (this.style !== 'rush' && r.tick < this.executeTick) {
      // early contact or intel accelerates the execute
      const recent = this.intel.filter((i) => r.tick - i.tick < TICK_RATE * 3);
      if (recent.length >= 2 && this.executeTick - r.tick > TICK_RATE * 4) this.executeTick = r.tick + TICK_RATE * 3;
    }
    if (left < 40 && r.tick < this.executeTick) this.executeTick = r.tick;
  }

  report(src: Player, pos: Vec3, count: number, heard: boolean): void {
    const s = siteOf(pos.x, pos.z) ?? 'mid';
    this.intel.push({ site: s, count, tick: this.room.tick });
    if (this.intel.length > 24) this.intel.shift();
    if (!this.attacking && !this.planted && s !== 'mid' && !heard && count >= 2 && this.rotateTo !== s) {
      this.rotateTo = s;
      this.rotateTick = this.room.tick;
      this.say(src, `Rotate ${s}! ${count === 2 ? 'Two' : 'Several'} pushing ${this.room.map.callout(pos.x, pos.z)}.`);
      return;
    }
    const where = this.room.map.callout(pos.x, pos.z);
    if (!where) return;
    if (heard) this.say(src, `Steps heard near ${where}.`);
    else this.say(src, count >= 2 ? `${count === 2 ? 'Two' : count === 3 ? 'Three' : 'Many'} seen at ${where}.` : `One spotted ${where}.`);
  }

  private steps: { site: SiteId; tick: number }[] = [];
  /** Many footsteps near one site is a (noisy) push signal for defenders. */
  heardStep(src: Player, pos: Vec3): void {
    if (this.attacking || this.planted) return;
    const s = siteOf(pos.x, pos.z);
    if (!s) return;
    const t = this.room.tick;
    this.steps = this.steps.filter((x) => t - x.tick < TICK_RATE * 4);
    this.steps.push({ site: s, tick: t });
    const n = this.steps.filter((x) => x.site === s).length;
    if (n >= 6 && this.rotateTo !== s) {
      this.rotateTo = s;
      this.rotateTick = t;
      this.say(src, `Heavy footsteps at ${s} — rotate!`, true);
    }
  }

  onSpikeSeen(pos: Vec3): void {
    if (this.attacking) return;
    const s = siteOf(pos.x, pos.z);
    const src = this.members().find((p) => p.alive && p.bot);
    this.say(src, `Cipher dropped near ${this.room.map.callout(pos.x, pos.z)}.`, true);
    if (s && !this.rotateTo) {
      this.rotateTo = s;
      this.rotateTick = this.room.tick;
    }
  }

  onPulse(pos: Vec3, wedges: number[]): void {
    const n = wedges.reduce((a, b) => a + b, 0);
    if (!n) return;
    const src = this.members().find((p) => p.alive && p.bot);
    this.say(src, `Pulse: movement near ${this.room.map.callout(pos.x, pos.z)}.`);
  }

  onPlanted(site: string): void {
    this.planted = site as SiteId;
    if (!this.attacking) {
      const src = this.members().find((p) => p.alive && p.bot);
      this.say(src, `Cipher armed at ${site}. Retake!`, true);
    }
  }

  say(p: Player | undefined, text: string, force = false): void {
    if (!p) return;
    if (!force && this.room.tick - this.lastRadio < TICK_RATE * 2.5) return;
    this.lastRadio = this.room.tick;
    this.room.radio(p, text);
  }
}

interface Memory {
  pos: Vec3;
  tick: number;
}

export class BotBrain {
  readonly room: MatchRoom;
  readonly p: Player;
  rng: Rng;
  path: { x: number; z: number; y: number; crouch: boolean }[] = [];
  pathIdx = 0;
  goal: P2 | null = null;
  goalKey = '';
  target = -1;
  reactUntil = 0;
  errYaw = 0;
  errPitch = 0;
  aimYaw = 0;
  aimPitch = 0;
  seen = new Map<number, Memory>();
  heard: Memory | null = null;
  lastSoundTick = 0;
  burst = 0;
  pauseUntil = 0;
  firePrev = false;
  stuckTick = 0;
  lastProgress: Vec3 = { x: 0, y: 0, z: 0 };
  lastProgressTick = 0;
  seq = 0;
  bought = false;
  buyAt = 0;
  flashedUntil = 0;
  lookAwayUntil = 0;
  routeStage = 0;
  utilityDone = false;
  throwStage = 0;
  pendingThrow: { yaw: number; pitch: number; lob: boolean; type: UtilityId; since: number } | null = null;
  holdTimer = 0;
  wanderYaw = 0;
  lastHurtBy = -1;
  lastHurtTick = -999;
  strafeDir = 1;
  strafeUntil = 0;
  headPref: number;
  nextRepath = 0;
  utilCooldown = 0;
  retakeGo = false;

  constructor(room: MatchRoom, p: Player) {
    this.room = room;
    this.p = p;
    this.rng = new Rng(hash32(room.seed, p.id, 4242));
    this.headPref = 0.25 + p.difficulty * 0.45;
  }

  get planner(): TeamPlanner {
    return this.room.planners[this.p.team];
  }

  onRoundStart(): void {
    this.rng = new Rng(hash32(this.room.seed, this.p.id, this.room.round));
    this.path = [];
    this.goal = null;
    this.goalKey = '';
    this.target = -1;
    this.seen.clear();
    this.heard = null;
    this.bought = false;
    this.buyAt = this.room.tick + Math.round(this.rng.range(0.6, 3.5) * TICK_RATE);
    this.routeStage = 0;
    this.utilityDone = false;
    this.throwStage = 0;
    this.pendingThrow = null;
    this.aimYaw = this.p.yaw;
    this.aimPitch = 0;
    this.lastSoundTick = this.room.tick;
    this.utilCooldown = 0;
    this.retakeGo = false;
  }

  onHurt(src: Player | null): void {
    if (!src) return;
    this.lastHurtBy = src.id;
    this.lastHurtTick = this.room.tick;
    // being shot gives a rough direction, not an exact position
    if (this.target < 0) this.heard = { pos: { x: src.pos.x + this.rng.range(-2, 2), y: src.pos.y, z: src.pos.z + this.rng.range(-2, 2) }, tick: this.room.tick };
  }
  onKill(_v: Player): void {
    this.target = -1;
  }
  onFlashed(dur: number): void {
    this.flashedUntil = this.room.tick + Math.round(dur * 0.85 * TICK_RATE);
  }

  // ---------------------------------------------------------------- think
  think(): InputCmd {
    const r = this.room;
    const p = this.p;
    const t = r.tick;
    let buttons = 0;
    let select: InputCmd['select'] = null;

    if (r.phase === 'buy' || r.practice) {
      if (!this.bought && t >= this.buyAt && !r.practice) {
        this.doBuy();
        this.bought = true;
      }
    }
    if (r.practice) {
      // practice dummies: slow strafe, never shoot
      const phase = Math.sin((t + p.id * 97) / 90);
      buttons |= phase > 0.3 ? BTN.LEFT : phase < -0.3 ? BTN.RIGHT : 0;
      if (Math.floor(t / 400 + p.id) % 3 === 0) buttons |= BTN.WALK;
      return this.cmd(buttons, p.yaw, 0, null);
    }

    // perception every 3 ticks (staggered)
    if ((t + p.id) % 3 === 0) this.perceive();

    // weapon housekeeping
    const want = this.desiredSlot();
    if (want && p.active !== want && !this.pendingThrow && p.armStart < 0 && p.defuseStart < 0) select = want;

    let moveTo: P2 | null = null;
    let lookAt: Vec3 | null = null;
    let crouch = false;
    let walk = false;
    let use = false;

    const enemy = this.target >= 0 ? r.players[this.target] : null;
    const visible = enemy && enemy.alive && this.seen.get(enemy.id)?.tick === this.lastPerceiveTick;
    const flashed = t < this.flashedUntil;

    if (r.phase === 'roundEnd' || r.phase === 'buy') {
      if (r.phase === 'buy') {
        lookAt = this.lookToward(this.planner.attacking ? (TACTICS.attack[this.planner.site].staging) : [0, 0]);
      }
    } else if (visible && enemy && !flashed) {
      // ---------------- combat ----------------
      const aimPt = this.aimPoint(enemy);
      lookAt = aimPt;
      const def = r.activeDef(p);
      const dist = vdistH(p.pos, enemy.pos);
      const run = def && (def.cls === 'smg' || def.cls === 'shotgun') && dist < 10;
      if (run && t < this.strafeUntil) moveTo = this.strafePoint(enemy);
      if (t >= this.strafeUntil && this.rng.chance(0.02)) {
        this.strafeUntil = t + Math.round(this.rng.range(0.2, 0.5) * TICK_RATE);
        this.strafeDir = -this.strafeDir;
      }
      if (dist > 14 && p.difficulty > 0.5 && this.rng.chance(0.01)) crouch = true;
      // firing decision happens after aiming update
    } else {
      // ---------------- tasks ----------------
      const task = this.task();
      moveTo = task.moveTo;
      lookAt = task.lookAt;
      walk = task.walk;
      use = task.use;
      crouch = task.crouch;
      if (task.throwNow) this.beginThrow(task.throwNow);
      if (this.heard && t - this.heard.tick < TICK_RATE * 2.5 && !use && !this.pendingThrow) {
        lookAt = { x: this.heard.pos.x, y: this.heard.pos.y + 1.4, z: this.heard.pos.z };
      }
      if (flashed) {
        moveTo = null;
        lookAt = null;
      }
    }

    // pending grenade throw sequence: select slot -> aim -> press -> release
    if (this.pendingThrow) {
      const pt = this.pendingThrow;
      moveTo = null;
      const slot = p.utils.indexOf(pt.type);
      if (slot < 0 || t - pt.since > TICK_RATE * 4) {
        // item gone (thrown, dropped) or sequence stalled: abandon cleanly
        this.pendingThrow = null;
        this.throwStage = 0;
        return this.cmd(0, this.aimYaw, this.aimPitch, null);
      }
      if (p.active !== 'util' || p.utilIndex !== slot) select = (`util${slot}` as InputCmd['select']);
      else if (t >= p.drawUntil) {
        this.aimYaw = this.turnToward(this.aimYaw, pt.yaw, 0.35);
        this.aimPitch = this.aimPitch + (pt.pitch - this.aimPitch) * 0.35;
        const aligned = Math.abs(wrapAngle(this.aimYaw - pt.yaw)) < 0.02 && Math.abs(this.aimPitch - pt.pitch) < 0.02;
        if (this.throwStage === 0 && aligned) {
          buttons |= pt.lob ? BTN.ALT : BTN.FIRE;
          this.throwStage = 1;
        } else if (this.throwStage === 1) {
          // release -> throw
          this.throwStage = 2;
        } else if (this.throwStage === 2) {
          this.pendingThrow = null;
          this.throwStage = 0;
          this.utilCooldown = t + TICK_RATE * 2;
        }
      }
      return this.cmd(buttons | (crouch ? BTN.CROUCH : 0), this.aimYaw, this.aimPitch, select);
    }

    // ---------------- aim ----------------
    if (lookAt) {
      const eye = r.eyePos(p);
      const a = anglesFromDir({ x: lookAt.x - eye.x, y: lookAt.y - eye.y, z: lookAt.z - eye.z });
      const combat = !!visible;
      const speed = combat ? 0.12 + p.difficulty * 0.16 : 0.12;
      this.errYaw *= combat ? 0.9 - p.difficulty * 0.06 : 0.9;
      this.errPitch *= combat ? 0.9 - p.difficulty * 0.06 : 0.9;
      const ty = a.yaw + this.errYaw;
      const tp = a.pitch + this.errPitch;
      this.aimYaw = this.turnToward(this.aimYaw, ty, speed, combat ? 12 * DEG : 7 * DEG);
      this.aimPitch += clamp(tp - this.aimPitch, -0.1, 0.1) * (combat ? 0.5 : 0.25);
    }
    if (t < this.lookAwayUntil) this.aimYaw = this.turnToward(this.aimYaw, this.aimYaw + Math.PI, 0.2, 10 * DEG);

    // ---------------- fire ----------------
    let sendYaw = this.aimYaw;
    let sendPitch = this.aimPitch;
    const def = r.activeDef(p);
    if (def && def.mode !== 'melee') {
      const rec = recoilOffset(def, p.recoilIndex);
      const comp = 0.45 + p.difficulty * 0.45;
      sendYaw -= rec.yaw * comp;
      sendPitch -= rec.pitch * comp;
    }
    if (visible && enemy && !flashed && t >= this.reactUntil && def && def.mode !== 'melee') {
      const eye = r.eyePos(p);
      const aimPt = this.aimPoint(enemy);
      const a = anglesFromDir({ x: aimPt.x - eye.x, y: aimPt.y - eye.y, z: aimPt.z - eye.z });
      const dist = Math.max(1, vdistH(p.pos, enemy.pos));
      const tol = Math.atan(0.32 / dist) + 0.6 * DEG;
      const onTarget = Math.abs(wrapAngle(this.aimYaw - a.yaw)) < tol * 1.6 && Math.abs(this.aimPitch - a.pitch) < tol * 1.8;
      const slowEnough = Math.hypot(p.vel.x, p.vel.z) < def.accurateSpeed * 2.2 || def.cls === 'smg' || def.cls === 'shotgun' || def.cls === 'sidearm';
      const item = r.activeItem(p);
      if (onTarget && slowEnough && t >= this.pauseUntil && item && item.mag > 0) {
        const semi = def.mode !== 'auto';
        if (semi) {
          if (!this.firePrev) buttons |= BTN.FIRE;
        } else buttons |= BTN.FIRE;
        this.burst++;
        const maxBurst = dist > 22 ? 2 : dist > 12 ? 5 : 9;
        if (!semi && this.burst > maxBurst * 3) {
          this.burst = 0;
          this.pauseUntil = t + Math.round(this.rng.range(0.18, 0.36) * TICK_RATE);
        }
        if (semi && this.firePrev) {
          // release so the next press registers
          buttons &= ~BTN.FIRE;
        }
      }
      if (item && item.mag === 0) buttons |= BTN.RELOAD;
      // stop to shoot accurately (counter-strafe by releasing keys)
      if (!(def.cls === 'smg' || def.cls === 'shotgun')) moveTo = null;
    }
    this.firePrev = (buttons & BTN.FIRE) !== 0;

    // reload in quiet moments
    const item = r.activeItem(p);
    if (item && def && !visible && item.mag < def.mag * 0.35 && item.reserve > 0 && t - this.lastSeenAny() > TICK_RATE * 2) buttons |= BTN.RELOAD;

    // ---------------- movement ----------------
    if (moveTo && p.armStart < 0 && p.defuseStart < 0) {
      const mv = this.follow(moveTo);
      buttons |= mv.buttons;
      if (mv.crouch) crouch = true;
    }
    if (use) buttons |= BTN.USE;
    if (crouch) buttons |= BTN.CROUCH;
    if (walk) buttons |= BTN.WALK;
    return this.cmd(buttons, sendYaw, sendPitch, select);
  }

  private lastPerceiveTick = 0;

  private lastSeenAny(): number {
    let m = -999;
    for (const v of this.seen.values()) m = Math.max(m, v.tick);
    return m;
  }

  private cmd(buttons: number, yaw: number, pitch: number, select: InputCmd['select']): InputCmd {
    return { seq: ++this.seq, tick: this.room.tick, time: this.room.tick * DT * 1000, buttons, yaw, pitch: clamp(pitch, -1.5, 1.5), select, viewTick: this.room.tick };
  }

  private turnToward(cur: number, target: number, frac: number, maxStep = 9 * DEG): number {
    const d = wrapAngle(target - cur);
    return wrapAngle(cur + clamp(d * frac + Math.sign(d) * Math.min(Math.abs(d), 0.004), -maxStep, maxStep));
  }

  private lookToward(pt: P2, y = 1.5): Vec3 {
    return { x: pt[0], y: (this.p.pos.y || 0) + y, z: pt[1] };
  }

  private aimPoint(e: Player): Vec3 {
    const s = 1 + (1.25 / 1.8 - 1) * e.crouchAmt;
    const head = (e.id + this.room.round) % 10 < this.headPref * 10;
    return { x: e.pos.x, y: e.pos.y + (head ? 1.62 * s : 1.3 * s), z: e.pos.z };
  }

  private strafePoint(e: Player): P2 {
    const dx = e.pos.x - this.p.pos.x;
    const dz = e.pos.z - this.p.pos.z;
    const l = Math.hypot(dx, dz) || 1;
    return [this.p.pos.x + (-dz / l) * 3 * this.strafeDir, this.p.pos.z + (dx / l) * 3 * this.strafeDir];
  }

  // ---------------------------------------------------------------- perception
  private perceive(): void {
    const r = this.room;
    const p = this.p;
    const t = r.tick;
    this.lastPerceiveTick = t;
    const flashed = t < this.flashedUntil;
    const look = { x: Math.sin(p.yaw), z: Math.cos(p.yaw) };
    let nearest: Player | null = null;
    let nd = Infinity;
    let count = 0;
    let firstPos: Vec3 | null = null;
    for (const q of r.players) {
      if (q.team === p.team || !q.alive) continue;
      const dx = q.pos.x - p.pos.x;
      const dz = q.pos.z - p.pos.z;
      const d = Math.hypot(dx, dz);
      const inFov = d < 3 || (dx * look.x + dz * look.z) / (d || 1) > Math.cos(62 * DEG);
      if (!inFov || flashed) continue;
      if (!r.canSee(p, q, true)) continue;
      const prev = this.seen.get(q.id);
      if (!prev || t - prev.tick > TICK_RATE * 4) count++;
      if (!firstPos) firstPos = { ...q.pos };
      this.seen.set(q.id, { pos: { ...q.pos }, tick: t });
      if (d < nd) {
        nd = d;
        nearest = q;
      }
    }
    if (count > 0 && firstPos) this.planner.report(p, firstPos, count, false);
    if (nearest) {
      if (this.target !== nearest.id) {
        const fresh = !this.seen.has(nearest.id) || t - (this.seen.get(nearest.id)?.tick ?? 0) > 6;
        this.target = nearest.id;
        if (fresh || this.reactUntil < t - TICK_RATE) {
          // holding an angle (stationary, enemy appears near the crosshair) is a real
          // advantage over the peeker: faster reaction and a smaller initial error
          const toE = Math.atan2(nearest.pos.x - p.pos.x, nearest.pos.z - p.pos.z);
          const prepared = Math.hypot(p.vel.x, p.vel.z) < 0.6 && Math.abs(wrapAngle(toE - p.yaw)) < 16 * DEG;
          const enemyMoving = Math.hypot(nearest.vel.x, nearest.vel.z) > 2;
          const react = (0.42 - p.difficulty * 0.24) * (0.85 + this.rng.next() * 0.35) * (prepared ? 0.6 : 1) * (enemyMoving && !prepared ? 1.1 : 1);
          this.reactUntil = t + Math.round(react * TICK_RATE);
          const errScale = (1.2 - p.difficulty) * (nd < 8 ? 2.2 : 1) * (prepared ? 0.45 : 1);
          this.errYaw = (this.rng.next() - 0.5) * 9 * DEG * errScale;
          this.errPitch = (this.rng.next() - 0.5) * 5 * DEG * errScale;
        }
      }
    } else if (this.target >= 0) {
      const m = this.seen.get(this.target);
      if (!m || t - m.tick > TICK_RATE * 1.6 || !r.players[this.target].alive) this.target = -1;
    }
    // hearing: enemy sounds within audible radius, with positional uncertainty
    for (const s of r.sounds) {
      if (s.tick <= this.lastSoundTick) continue;
      if (s.src < 0 || r.players[s.src]?.team === p.team) continue;
      const d = Math.hypot(s.x - p.pos.x, s.z - p.pos.z);
      if (d > s.radius) continue;
      const unc = s.kind === 'shot' ? 2.5 : 4;
      this.heard = { pos: { x: s.x + this.rng.range(-unc, unc), y: s.y, z: s.z + this.rng.range(-unc, unc) }, tick: s.tick };
      if (s.kind === 'step') {
        this.planner.heardStep(p, this.heard.pos);
        if (this.rng.chance(0.15)) this.planner.report(p, this.heard.pos, 1, true);
      }
    }
    this.lastSoundTick = t;
  }

  // ---------------------------------------------------------------- tasks
  private task(): { moveTo: P2 | null; lookAt: Vec3 | null; walk: boolean; use: boolean; crouch: boolean; throwNow: Lineup | null } {
    const r = this.room;
    const p = this.p;
    const pl = this.planner;
    const t = r.tick;
    const res = { moveTo: null as P2 | null, lookAt: null as Vec3 | null, walk: false, use: false, crouch: false, throwNow: null as Lineup | null };
    const asg = pl.assignments.get(p.id);
    const spike = r.spike;

    if (pl.attacking) {
      if (spike.state === 'planted') {
        const spots = TACTICS.postPlant[spike.site as SiteId] ?? TACTICS.postPlant.A;
        const spot = spots[p.id % spots.length];
        res.moveTo = spot;
        res.lookAt = { x: spike.pos.x, y: spike.pos.y + 0.8, z: spike.pos.z };
        if (vdistH(p.pos, { x: spot[0], y: 0, z: spot[1] }) < 1.5) res.moveTo = null;
        return res;
      }
      if (pl.saving) {
        res.moveTo = [0, -34];
        return res;
      }
      // pick up a dropped spike if we know where it is
      if (spike.state === 'dropped') {
        const nearestAtt = r.players
          .filter((q) => q.team === p.team && q.alive)
          .sort((a, b) => vdistH(a.pos, spike.pos) - vdistH(b.pos, spike.pos))[0];
        if (nearestAtt === p) {
          res.moveTo = [spike.pos.x, spike.pos.z];
          return res;
        }
      }
      const site = asg?.site === 'mid' || !asg ? pl.site : (asg.site as SiteId);
      const plan = TACTICS.attack[site];
      const executing = t >= pl.executeTick;
      // carrier: arm when in zone
      if (p.hasSpike && r.map.vaultAt(p.pos) && spike.state === 'carried') {
        const spots = r.map.def.plantSpots[site];
        const spot = spots[r.round % spots.length];
        if (vdistH(p.pos, { x: spot[0], y: 0, z: spot[1] }) < 1.2 || this.rng.chance(0.002)) {
          res.use = true;
          res.crouch = p.difficulty > 0.4;
          return res;
        }
        res.moveTo = spot;
        return res;
      }
      const route = asg?.route === 'mid' ? plan.mid : plan.main;
      if (!executing) {
        // go to the stage point and wait; lineup throwers move to their spot
        const stage = asg?.route === 'mid' ? plan.midStage : plan.staging;
        const lu = asg?.lineup;
        if (lu && !this.utilityDone && p.utils.includes(lu.type)) {
          res.moveTo = lu.from;
          if (vdistH(p.pos, { x: lu.from[0], y: 0, z: lu.from[1] }) < 0.7) {
            res.moveTo = null;
            if (pl.executeTick - t < TICK_RATE * 2.5) {
              res.throwNow = lu;
              this.utilityDone = true;
            }
            res.lookAt = this.lookToward(lu.target);
          }
          return res;
        }
        res.moveTo = stage;
        res.walk = vdistH(p.pos, { x: stage[0], y: 0, z: stage[1] }) < 12;
        res.lookAt = this.lookToward(TACTICS.sites[site].center);
        if (vdistH(p.pos, { x: stage[0], y: 0, z: stage[1] }) < 2.5) res.moveTo = null;
        return res;
      }
      // executing: push through the route to a site spot
      const lu = asg?.lineup;
      if (lu && !this.utilityDone && p.utils.includes(lu.type) && vdistH(p.pos, { x: lu.from[0], y: 0, z: lu.from[1] }) < 8) {
        res.moveTo = lu.from;
        if (vdistH(p.pos, { x: lu.from[0], y: 0, z: lu.from[1] }) < 0.8) {
          res.throwNow = lu;
          this.utilityDone = true;
          if (lu.type === 'flash') this.lookAwayUntil = t + Math.round(1.5 * TICK_RATE);
        }
        return res;
      }
      while (this.routeStage < route.length && vdistH(p.pos, { x: route[this.routeStage][0], y: 0, z: route[this.routeStage][1] }) < 3) this.routeStage++;
      const goal = this.routeStage < route.length ? route[this.routeStage] : (r.map.def.plantSpots[site][p.id % r.map.def.plantSpots[site].length] as P2);
      res.moveTo = goal;
      res.lookAt = this.lookToward(TACTICS.sites[site].center);
      if (this.routeStage >= route.length && vdistH(p.pos, { x: goal[0], y: 0, z: goal[1] }) < 1.5) {
        res.moveTo = null;
        res.lookAt = this.lookToward(TACTICS.sites[site].entries[(p.id + (t >> 8)) % TACTICS.sites[site].entries.length]);
      }
      // occasional pulse shard toward the site on approach
      if (!this.utilityDone && p.utils.includes('pulse') && vdistH(p.pos, { x: TACTICS.sites[site].center[0], y: 0, z: TACTICS.sites[site].center[1] }) < 26) {
        const throwL = this.aimThrow('pulse', TACTICS.sites[site].center);
        if (throwL) res.throwNow = throwL;
        this.utilityDone = true;
      }
      return res;
    }

    // ---------------- defense ----------------
    if (spike.state === 'planted') {
      const left = (spike.explodeTick - t) * DT;
      const need = (p.kit ? r.rules.defuseKitTime : r.rules.defuseTime) + vdistH(p.pos, spike.pos) / 4.6 + 0.5;
      if (left < need) {
        // cannot make it: save
        if (!pl.saving) {
          pl.saving = true;
          pl.say(p, 'No time, saving.');
        }
        res.moveTo = [0, 28];
        return res;
      }
      const d = vdistH(p.pos, spike.pos);
      // group up at the nearest entry before retaking, unless time forces a solo push
      const siteId = (spike.site || 'A') as SiteId;
      const entries = TACTICS.sites[siteId].entries;
      const stage = entries.reduce((b, e) => (vdistH(p.pos, { x: e[0], y: 0, z: e[1] }) < vdistH(p.pos, { x: b[0], y: 0, z: b[1] }) ? e : b), entries[0]);
      const aliveMates = r.players.filter((q) => q.team === p.team && q.alive);
      const nearStage = aliveMates.filter((q) => vdistH(q.pos, { x: stage[0], y: 0, z: stage[1] }) < 9).length;
      const enough = nearStage >= Math.min(2, aliveMates.length);
      const urgent = left < need + 9;
      if (!this.retakeGo && (enough || urgent || d < 12)) {
        this.retakeGo = true;
        // retake utility: flash or frag the armed Cipher area before pushing in
        const ut: UtilityId | null = p.utils.includes('flash') ? 'flash' : p.utils.includes('frag') ? 'frag' : p.utils.includes('thermite') ? 'thermite' : null;
        if (ut && d > 6 && d < 24) {
          const l = this.aimThrow(ut, [spike.pos.x, spike.pos.z]);
          if (l) {
            res.throwNow = l;
            if (ut === 'flash') this.lookAwayUntil = t + Math.round(1.4 * TICK_RATE);
            return res;
          }
        }
      }
      if (!this.retakeGo) {
        res.moveTo = stage;
        res.lookAt = this.lookToward([spike.pos.x, spike.pos.z]);
        if (vdistH(p.pos, { x: stage[0], y: 0, z: stage[1] }) < 2) res.moveTo = null;
        return res;
      }
      if (d < 1.0) {
        const recentThreat = t - this.lastSeenAny() < TICK_RATE * 1.2;
        if (!recentThreat || left < need + 1.5) {
          res.use = true;
          res.crouch = true;
          res.lookAt = { x: spike.pos.x, y: spike.pos.y, z: spike.pos.z };
          return res;
        }
      }
      res.moveTo = [spike.pos.x, spike.pos.z];
      res.lookAt = this.lookToward([spike.pos.x, spike.pos.z]);
      return res;
    }
    let hold = asg?.hold ?? TACTICS.holds.mid[0];
    if (pl.rotateTo && asg && asg.site !== pl.rotateTo && t - pl.rotateTick > TICK_RATE * (0.5 + (p.id % 3))) {
      // keep one anchor on the other site
      const anchors = [...pl.assignments.entries()].filter(([, a]) => a.site === asg.site);
      if (!(anchors.length > 0 && anchors[0][0] === p.id && asg.site !== 'mid')) {
        const holds = TACTICS.holds[pl.rotateTo];
        hold = holds[p.id % holds.length];
      }
    }
    if (spike.state === 'dropped' && spike.seenBy[p.team]) {
      // guard a known dropped cipher from a distance
      const s = siteOf(spike.pos.x, spike.pos.z);
      if (s) hold = TACTICS.holds[s][p.id % TACTICS.holds[s].length];
    }
    res.moveTo = hold.pos;
    const dh = vdistH(p.pos, { x: hold.pos[0], y: 0, z: hold.pos[1] });
    res.lookAt = dh < 6 ? this.lookToward(hold.watch) : null;
    if (dh < 0.8) {
      res.moveTo = null;
      res.walk = true;
      // shoulder-check occasionally
      if (((t + p.id * 131) >> 7) % 4 === 0) {
        const ent = TACTICS.sites[(siteOf(p.pos.x, p.pos.z) ?? 'A') as SiteId].entries;
        res.lookAt = this.lookToward(ent[((t >> 9) + p.id) % ent.length]);
      }
    }
    // defensive utility on heard pushes
    if (this.heard && t - this.heard.tick < TICK_RATE && t > this.utilCooldown && dh < 4) {
      const d = vdistH(p.pos, this.heard.pos);
      const type: UtilityId | null = p.utils.includes('thermite') ? 'thermite' : p.utils.includes('frag') ? 'frag' : null;
      if (type && d > 7 && d < 22 && this.rng.chance(0.3)) {
        const l = this.aimThrow(type, [this.heard.pos.x, this.heard.pos.z]);
        if (l) res.throwNow = l;
        this.utilCooldown = t + TICK_RATE * 6;
      }
    }
    return res;
  }

  /** Search a throw angle for an ad-hoc target using the shared trajectory sim. */
  private aimThrow(type: UtilityId, target: P2): Lineup | null {
    const r = this.room;
    const p = this.p;
    const yaw = Math.atan2(target[0] - p.pos.x, target[1] - p.pos.z);
    let best: Lineup | null = null;
    let bestD = 4;
    for (let pd = -50; pd <= 10; pd += 5) {
      const body = throwState(p.pos, { x: 0, y: 0, z: 0 }, p.crouchAmt, yaw, pd * DEG, false, r.map);
      const traj = simulateTrajectory(r.map, body, DT, UTILITY[type].onRest ? 4 : UTILITY[type].fuse);
      const end = traj[traj.length - 1];
      const d = Math.hypot(end.x - target[0], end.z - target[1]);
      if (d < bestD) {
        bestD = d;
        best = { site: 'A', type, from: [p.pos.x, p.pos.z], target, yaw, pitch: pd * DEG, lob: false, valid: true };
      }
    }
    return best;
  }

  private beginThrow(l: Lineup): void {
    const slot = this.p.utils.indexOf(l.type);
    if (slot < 0 || l.yaw === undefined || l.pitch === undefined) return;
    this.pendingThrow = { yaw: l.yaw, pitch: l.pitch, lob: !!l.lob, type: l.type, since: this.room.tick };
    this.throwStage = 0;
  }

  private desiredSlot(): InputCmd['select'] {
    const p = this.p;
    if (p.armStart >= 0 || p.defuseStart >= 0) return null;
    if (p.primary && (p.primary.mag > 0 || p.primary.reserve > 0)) return p.active === 'primary' ? null : 'primary';
    if (p.secondary && (p.secondary.mag > 0 || p.secondary.reserve > 0)) return p.active === 'secondary' ? null : 'secondary';
    return p.active === 'tool' ? null : 'tool';
  }

  // ---------------------------------------------------------------- navigation
  private follow(goal: P2): { buttons: number; crouch: boolean } {
    const r = this.room;
    const p = this.p;
    const t = r.tick;
    const key = `${goal[0].toFixed(1)},${goal[1].toFixed(1)}`;
    if (key !== this.goalKey || (this.path.length === 0 && t >= this.nextRepath)) {
      this.goalKey = key;
      this.computePath(goal);
    }
    // progress / stuck detection
    if (t - this.lastProgressTick > TICK_RATE * 1.5) {
      if (vdistH(p.pos, this.lastProgress) < 0.4 && this.path.length) {
        this.computePath(goal, true);
        this.stuckTick++;
      }
      this.lastProgress = { ...p.pos };
      this.lastProgressTick = t;
    }
    while (this.pathIdx < this.path.length && Math.hypot(this.path[this.pathIdx].x - p.pos.x, this.path[this.pathIdx].z - p.pos.z) < 0.55) this.pathIdx++;
    if (this.pathIdx >= this.path.length) return { buttons: 0, crouch: false };
    const wp = this.path[this.pathIdx];
    const dx = wp.x - p.pos.x;
    const dz = wp.z - p.pos.z;
    const l = Math.hypot(dx, dz) || 1;
    // crouch through crawlspaces
    const ahead = r.map.cellIndex(p.pos.x + (dx / l) * 0.7, p.pos.z + (dz / l) * 0.7);
    const here = r.map.cellIndex(p.pos.x, p.pos.z);
    const crouch = wp.crouch || (ahead >= 0 && r.nav.crouch[ahead] === 1) || (here >= 0 && r.nav.crouch[here] === 1);
    // world dir -> local buttons relative to send yaw
    const yaw = this.aimYaw;
    const f = (dx * Math.sin(yaw) + dz * Math.cos(yaw)) / l;
    const s = (dx * Math.cos(yaw) - dz * Math.sin(yaw)) / l;
    let b = 0;
    if (f > 0.38) b |= BTN.FWD;
    else if (f < -0.38) b |= BTN.BACK;
    if (s > 0.38) b |= BTN.RIGHT;
    else if (s < -0.38) b |= BTN.LEFT;
    if (this.stuckTick > 0 && (t >> 5) % 4 === 0) b |= BTN.JUMP;
    return { buttons: b, crouch };
  }

  private computePath(goal: P2, jitter = false): void {
    const r = this.room;
    const p = this.p;
    const nav = r.nav;
    const s = nav.nearestWalkable(p.pos.x, p.pos.z, 6);
    let gx = goal[0];
    let gz = goal[1];
    if (jitter) {
      gx += this.rng.range(-0.8, 0.8);
      gz += this.rng.range(-0.8, 0.8);
    }
    const g = nav.nearestWalkable(gx, gz, 8);
    this.pathIdx = 0;
    this.path = [];
    this.nextRepath = r.tick + TICK_RATE;
    if (s < 0 || g < 0) return;
    const cells = nav.findPath(s, g);
    if (!cells) return;
    this.path = nav.smooth(cells);
    if (this.path.length > 1) this.pathIdx = 1;
  }

  // ---------------------------------------------------------------- economy
  private doBuy(): void {
    const r = this.room;
    const p = this.p;
    const pl = this.planner;
    const side = r.sideOf(p);
    const buys: ItemId[] = [];
    let money = p.money;
    const can = (item: ItemId): boolean => r.priceOf(p, item) <= money && !r.buyBlockReason(p, item);
    const take = (item: ItemId): void => {
      if (!can(item)) return;
      money -= r.priceOf(p, item);
      buys.push(item);
      // apply locally so subsequent checks see the new state (server validates again)
      r.submitRequest(p.id, { rid: hash32(r.round, p.id, buys.length, 7), kind: 'buy', item });
    };
    const pistolRound = r.round === 1 || r.round === r.rules.halfRounds + 1;
    if (pistolRound) {
      if (this.rng.chance(0.55)) take('vest');
      else {
        if (side === 'custodian' && this.rng.chance(0.4)) take('kit');
        take('flash');
        if (this.rng.chance(0.5)) take('rook');
      }
      return;
    }
    const hasRifle = p.primary && ['aster', 'krait', 'lumen', 'atlas', 'sable'].includes(p.primary.id);
    if (pl.eco && !hasRifle && money < 4200) {
      if (money > 1300 && this.rng.chance(0.4)) take('needle');
      return;
    }
    if (!hasRifle) {
      const rifle: WeaponId = side === 'intrusion' ? (this.rng.chance(0.7) ? 'krait' : 'lumen') : this.rng.chance(0.65) ? 'aster' : 'lumen';
      const fullBuyCost = WEAPONS[rifle].price + 1000;
      if (money >= fullBuyCost) take(rifle);
      else if (pl.force || money >= 2600) {
        const smg: WeaponId = money >= 1700 + 650 ? 'vectora' : 'kite';
        if (this.rng.chance(0.15) && money >= 1900 + 650) take('rampart');
        else take(smg);
      }
    }
    if (p.armor < 100 || !p.helmet) {
      if (can('vesthelm') && money - r.priceOf(p, 'vesthelm') >= 0) take('vesthelm');
      else take('vest');
    }
    if (side === 'custodian' && !p.kit && money >= 400 && p.id % 2 === 0) take('kit');
    const utilOrder: UtilityId[] = side === 'intrusion' ? ['veil', 'flash', 'pulse', 'frag', 'flash'] : ['flash', 'thermite', 'frag', 'veil'];
    for (const u of utilOrder) if (money >= 250) take(u);
  }
}
