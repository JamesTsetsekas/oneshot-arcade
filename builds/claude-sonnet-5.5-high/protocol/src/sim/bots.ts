// Server-side bots. They are ordinary players that submit the same InputCmd a human would, and they only use
// information a human could have: line of sight inside their view cone, smoke and flash occlusion, hearing with
// uncertainty, and teammate radio. A per-side planner assigns temporary roles (entry, support, anchor, rotator...).

import { ARMOR, ECON, UTILITY, UtilityId } from '../content/economy';
import { WEAPONS, WeaponId } from '../content/weapons';
import { lineOfSight } from './collision';
import { predictThrow } from './grenades';
import { DEFAULT_ENTRY, HINTS, HoldSpot, MID_HOLD, P2, SAVE_SPOTS, yawTo } from './hints';
import { SITES, Zone, inZone } from './map';
import { DEG, Vec3, angleDiff, clamp, dirFromAngles, normAngle } from './math';
import type { Match } from './match';
import { eyeHeight, horizontalSpeed } from './movement';
import { findPath, isWalkableAt, nearestWalkable } from './nav';
import type { InputCmd, Player } from './types';
import { kickNow } from './weapons';

export type DifficultyId = 'easy' | 'normal' | 'hard';

export interface Difficulty {
  id: DifficultyId;
  /** Seconds between first sighting and first shot. */
  reaction: number;
  /** Max aim turn speed (rad/s). */
  aimSpeed: number;
  /** Aim error half-angle at 20 m (rad). */
  aimErr: number;
  /** 0..1 share of recoil the bot compensates. */
  recoilSkill: number;
  /** Seconds a lost contact stays in memory. */
  memory: number;
  headBias: number;
  /** Probability multiplier for utility use. */
  utility: number;
}

export const DIFFICULTY: Record<DifficultyId, Difficulty> = {
  easy: { id: 'easy', reaction: 0.55, aimSpeed: 5.5, aimErr: 0.045, recoilSkill: 0.35, memory: 4, headBias: 0.05, utility: 0.5 },
  normal: { id: 'normal', reaction: 0.34, aimSpeed: 9, aimErr: 0.028, recoilSkill: 0.65, memory: 7, headBias: 0.15, utility: 0.8 },
  hard: { id: 'hard', reaction: 0.22, aimSpeed: 13, aimErr: 0.016, recoilSkill: 0.88, memory: 10, headBias: 0.3, utility: 1 },
};

interface Contact { id: number; pos: Vec3; t: number; visible: boolean; firstSeen: number }
interface Heard { pos: Vec3; t: number; kind: string }

type Role = 'entry' | 'support' | 'lurk' | 'anchor' | 'rotator' | 'carrier' | 'trade';

interface Assignment {
  role: Role;
  lane: number;
  stage: P2;
  hold?: HoldSpot;
  clear: P2;
  smoked: boolean;
}

type IntMode = 'default' | 'execute' | 'postplant' | 'save';
type CusMode = 'default' | 'retake' | 'save';

export class TeamAI {
  round = -1;
  site: 'A' | 'B' = 'A';
  intMode: IntMode = 'default';
  cusMode: CusMode = 'default';
  executeAt = 0;
  assign = new Map<number, Assignment>();
  contacts: Array<{ pos: Vec3; t: number; site: 'A' | 'B' | null; certain: boolean }> = [];
  rotatedTo: 'A' | 'B' | null = null;
  retakeSite: 'A' | 'B' = 'A';
  retakeGoAt = 0;
  lastSyncTick = -1;
  smokeAt = 0;

  constructor(readonly side: 'cus' | 'int') {}

  siteOf(pos: Vec3, margin = 8): 'A' | 'B' | null {
    for (const s of ['A', 'B'] as const) {
      const z = SITES[s];
      if (pos.x >= z.x0 - margin && pos.x <= z.x1 + margin && pos.z >= z.z0 - margin && pos.z <= z.z1 + margin) return s;
    }
    // Hall level fallback.
    if (pos.x < 30 && pos.z < 36) return 'A';
    if (pos.x > 66 && pos.z < 36) return 'B';
    return null;
  }

  report(pos: Vec3, t: number, certain: boolean): void {
    this.contacts.push({ pos: { ...pos }, t, site: this.siteOf(pos), certain });
    if (this.contacts.length > 24) this.contacts.shift();
  }

  recentSiteContacts(site: 'A' | 'B', now: number, window = 8): number {
    return this.contacts.filter((c) => c.site === site && now - c.t < window).length;
  }

  sync(m: Match): void {
    if (this.lastSyncTick === m.tick) return;
    this.lastSyncTick = m.tick;
    const mates = m.alive(this.side);
    if (this.round !== m.round) {
      this.round = m.round;
      this.contacts = [];
      this.rotatedTo = null;
      this.intMode = 'default';
      this.cusMode = 'default';
      this.assign.clear();
      this.planRound(m);
    }
    if (m.phase === 'buy') return;

    // Hearing: enemy events within range become team contacts (with uncertainty).
    for (const e of m.events) {
      let src: Player | null = null;
      let radius = 0;
      let pos: Vec3 | null = null;
      if (e.t === 'step') { src = m.players[e.id]; radius = 5 + 26 * e.loud; pos = e.p; }
      else if (e.t === 'shot') { src = m.players[e.id]; radius = 70; pos = e.o; }
      else if (e.t === 'sfx' && (e.kind === 'reload' || e.kind === 'pickup' || e.kind === 'drop' || e.kind === 'throw')) { src = m.players[e.id]; radius = 16; pos = e.p; }
      else if (e.t === 'spike' && (e.kind === 'armStart' || e.kind === 'planted')) { src = m.players[e.id]; radius = 40; pos = e.p; }
      if (!src || !pos || src.side === this.side) continue;
      for (const b of mates) {
        const d = Math.hypot(pos.x - b.pos.x, pos.z - b.pos.z);
        if (d <= radius) {
          const err = Math.min(6, d * 0.18);
          const noisy = { x: pos.x + (m.rng() * 2 - 1) * err, y: pos.y, z: pos.z + (m.rng() * 2 - 1) * err };
          this.report(noisy, m.time, false);
          break;
        }
      }
    }

    if (this.side === 'int') this.updateAttack(m, mates);
    else this.updateDefense(m, mates);
  }

  private planRound(m: Match): void {
    const mates = m.playersOf(this.side);
    if (this.side === 'int') {
      this.site = m.rng() < 0.5 ? 'A' : 'B';
      this.executeAt = 14 + m.rng() * 12; // seconds after live start
      const h = HINTS[this.site];
      const carrier = mates.find((p) => p.spike);
      mates.forEach((p, i) => {
        const lane = i % 2;
        const L = h.lanes[lane];
        const role: Role = p.spike ? 'carrier' : i === 0 ? 'entry' : i === 1 ? 'support' : i === 2 ? 'trade' : 'lurk';
        this.assign.set(p.id, {
          role, lane, stage: L.stage[(i >> 1) % L.stage.length], clear: h.clear[i % h.clear.length], smoked: false,
        });
      });
      void carrier;
    } else {
      const holdA = HINTS.A.hold, holdB = HINTS.B.hold;
      // Default setup: 2 on A, 2 on B, 1 in mid. Roles are temporary behaviours.
      const slots: Array<{ role: Role; hold: HoldSpot; site: 'A' | 'B' | null }> = [
        { role: 'anchor', hold: holdA[0], site: 'A' }, { role: 'anchor', hold: holdA[1], site: 'A' },
        { role: 'anchor', hold: holdB[0], site: 'B' }, { role: 'anchor', hold: holdB[1], site: 'B' },
        { role: 'rotator', hold: MID_HOLD, site: null },
      ];
      mates.forEach((p, i) => {
        const s = slots[i % slots.length];
        this.assign.set(p.id, { role: s.role, lane: 0, stage: s.hold, hold: s.hold, clear: s.hold, smoked: false });
      });
    }
  }

  private updateAttack(m: Match, mates: Player[]): void {
    const sp = m.spike;
    const sinceLive = m.time - m.liveStart;
    if (sp.state === 'planted') { this.intMode = 'postplant'; return; }
    if (m.phase === 'live' && this.intMode === 'default' && sinceLive >= this.executeAt) {
      this.intMode = 'execute';
      this.smokeAt = m.time;
    }
    // Save when the round is effectively lost and unarmed.
    if (m.phase === 'live' && m.phaseRemaining() < 9) this.intMode = 'save';
    // Plan B: heavy contacts at the chosen site and a sparse team -> switch to the other site.
    if (this.intMode === 'default' && sinceLive > 8 && mates.length >= 3 && this.recentSiteContacts(this.site, m.time, 12) === 0) {
      // keep plan; a switch would only be sensible with positive info about the other site
    }
  }

  private updateDefense(m: Match, mates: Player[]): void {
    const sp = m.spike;
    if (sp.state === 'planted' && m.phase === 'armed') {
      if (this.cusMode !== 'retake' && this.cusMode !== 'save') {
        this.cusMode = 'retake';
        this.retakeSite = sp.site ?? 'A';
        this.retakeGoAt = m.time + 3.2 + m.rng() * 1.5;
      }
      return;
    }
    // Rotation: confirmed contact count at a site pulls help from the other side / mid.
    if (m.phase === 'live') {
      for (const s of ['A', 'B'] as const) {
        const n = this.recentSiteContacts(s, m.time, 7);
        if (n >= 2 && this.rotatedTo !== s) {
          this.rotatedTo = s;
          const helpers = mates.filter((p) => { const a = this.assign.get(p.id); return a && (a.role === 'rotator' || (a.role === 'anchor' && this.siteOfHold(a) !== s)); });
          helpers.slice(0, 2).forEach((p) => {
            const a = this.assign.get(p.id)!;
            const h = HINTS[s].hold[0];
            this.assign.set(p.id, { ...a, role: 'rotator', hold: { ...h }, stage: h });
          });
        }
      }
    }
  }

  siteOfHold(a: Assignment): 'A' | 'B' | null {
    if (!a.hold) return null;
    return this.siteOf({ x: a.hold.x, y: 0, z: a.hold.z }, 6);
  }
}

// ------------------------------------------------------------------------------------------------------------

const BUY_STAGGER = 0.4;

export class BotBrain {
  yaw = 0;
  pitch = 0;
  private path: Vec3[] = [];
  private pathIdx = 0;
  private goal: P2 | null = null;
  private repathAt = 0;
  private stuckT = 0;
  private lastPos: Vec3 = { x: 0, y: 0, z: 0 };
  private lastPosT = 0;
  private contacts = new Map<number, Contact>();
  private heard: Heard | null = null;
  private target = -1;
  private aimErrYaw = 0;
  private aimErrPitch = 0;
  private aimErrT = 0;
  private fireUntil = 0;
  private holdFireUntil = 0;
  private fireToggle = false;
  private bought = -1;
  private buyReq = 1;
  private lookAround = 0;
  private lookYaw = 0;
  private jumpT = 0;
  private visCheck = 0;
  private strafeDir = 1;
  private strafeUntil = 0;
  private lastRound = -1;
  private throwPlan: { type: UtilityId; target: P2; yaw: number; pitch: number; speed: number; from: P2 } | null = null;
  private thrown = new Set<string>();
  private defuseStartedAt = 0;
  private crouching = false;
  private savedSpot: P2 | null = null;

  constructor(readonly diff: Difficulty, readonly ai: Record<'cus' | 'int', TeamAI>) {}

  think(m: Match, p: Player): InputCmd {
    const cmd: InputCmd = { seq: 0, viewTick: m.tick, moveX: 0, moveZ: 0, yaw: p.yaw, pitch: p.pitch, fire: false, alt: false, jump: false, crouch: false, walk: false, use: false };
    const ai = this.ai[p.side];
    ai.sync(m);
    if (this.lastRound !== m.round) {
      this.lastRound = m.round;
      this.contacts.clear();
      this.path = []; this.goal = null; this.target = -1; this.bought = -1; this.thrown.clear(); this.throwPlan = null;
      this.yaw = p.yaw; this.pitch = 0; this.heard = null; this.savedSpot = null; this.defuseStartedAt = 0;
    }
    if (!p.alive) { cmd.yaw = this.yaw; cmd.pitch = this.pitch; return cmd; }

    if (m.phase === 'buy') {
      this.doBuy(m, p, cmd);
      cmd.yaw = this.yaw; cmd.pitch = this.pitch;
      return cmd;
    }
    if (m.phase === 'halftime' || m.phase === 'matchEnd') { cmd.yaw = this.yaw; cmd.pitch = this.pitch; return cmd; }

    this.perceive(m, p, ai);
    const eye = m.eyePos(p);
    const w = m.heldWeapon(p);
    const def = w ? WEAPONS[w.id] : null;

    // Ensure a real weapon is held.
    if (!this.throwPlan && (p.cur === 'tool' || p.cur.startsWith('util')) && (p.slots.primary || p.slots.secondary)) cmd.select = p.slots.primary && (p.slots.primary.mag > 0 || p.slots.primary.reserve > 0) ? 'primary' : 'secondary';

    let moveGoal: P2 | null = null;
    let lookAt: P2 | null = null;
    let walk = false;
    let holdPosition = false;
    let wantUse = false;
    const a = ai.assign.get(p.id);

    // ---- objective & plan (what to do when nothing is shooting at us)
    if (p.side === 'int') ({ moveGoal, lookAt, walk, holdPosition, wantUse } = this.planAttack(m, p, ai, a));
    else ({ moveGoal, lookAt, walk, holdPosition, wantUse } = this.planDefense(m, p, ai, a));

    // ---- combat
    const tgt = this.pickTarget(m, p, eye);
    let engaging = false;
    if (tgt && def && w) {
      engaging = this.combat(m, p, eye, tgt, def, w, cmd);
    }

    // ---- utility
    if (!engaging) this.useUtility(m, p, ai, a, cmd);

    // ---- reload when safe
    if (w && def && def.mode !== 'melee' && w.mag < def.mag * 0.4 && w.reserve > 0 && !engaging && !w.reloading) cmd.reload = true;
    if (w && def && def.mode !== 'melee' && w.mag === 0 && w.reserve > 0 && !w.reloading) cmd.reload = true;

    // ---- movement
    const canMove = !(engaging && this.stopToShoot(p, def));
    if (wantUse && !engaging) {
      cmd.use = true;
    } else if (wantUse && engaging && p.interact.progress > 1.2) {
      cmd.use = true; // commit to a nearly finished plant/defuse
    }
    if (moveGoal && !holdPosition && canMove && !cmd.use) this.follow(m, p, moveGoal, cmd, walk);
    else if (!moveGoal || holdPosition) { this.path = []; this.goal = null; }

    // ---- view
    this.updateView(m, p, eye, tgt && engaging ? tgt : null, lookAt, cmd, def, w);
    cmd.yaw = this.yaw;
    cmd.pitch = this.pitch;
    // moves are expressed in the view frame
    this.toLocalMove(p, cmd);
    this.stuckCheck(m, p, cmd);
    void def;
    return cmd;
  }

  // ------------------------------------------------------------ buying
  private doBuy(m: Match, p: Player, cmd: InputCmd): void {
    const elapsed = m.time - (m.phaseEnds - 20);
    const myIdx = m.playersOf(p.side).indexOf(p);
    if (this.bought < 0 && elapsed > 0.6 + myIdx * BUY_STAGGER) {
      this.bought = 0;
      this.buyList(m, p);
    }
    if (this.bought >= 0 && this.queue.length) {
      const item = this.queue.shift()!;
      cmd.buy = { req: this.buyReq++, item };
      this.bought++;
    }
    // Look towards the exit while waiting.
    const exit = p.side === 'int' ? { x: p.pos.x, z: 30 } : { x: p.pos.x, z: 30 };
    this.yaw = this.smoothAngle(this.yaw, yawTo(p.pos, exit), 0.05);
  }

  private queue: string[] = [];

  private buyList(m: Match, p: Player): void {
    const q: string[] = [];
    let money = p.money;
    const side = p.side;
    const teamMoney = m.playersOf(side).reduce((s, x) => s + x.money, 0) / 5;
    const has = (id: WeaponId) => p.slots.primary?.id === id;
    const mates = m.playersOf(side);
    const buy = (item: string, price: number): boolean => { if (money >= price) { q.push(item); money -= price; return true; } return false; };

    const full = money >= 3300 && teamMoney > 2600;
    const haveRifle = !!p.slots.primary && WEAPONS[p.slots.primary.id].price >= 2300;
    if (!haveRifle) {
      const sniperAlready = mates.some((x) => x.slots.primary?.id === 'longglass');
      const myIdx = mates.indexOf(p);
      if (full && !sniperAlready && money >= 5800 && myIdx === 3) buy('longglass', 4650);
      else if (full) {
        const pick = m.rng();
        const choices: Array<[WeaponId, number]> = side === 'int'
          ? [['aster', 2650], ['krait', 2900], ['lumen', 2350], ['aster', 2650]]
          : [['aster', 2650], ['krait', 2900], ['lumen', 2350], ['sable', 3100]];
        const c = choices[Math.floor(pick * choices.length)];
        if (!buy(c[0], c[1])) buy('aster', 2650);
      } else if (money >= 1900 && teamMoney > 1500) {
        const pick = m.rng();
        if (pick < 0.5) buy('kite', 1250); else if (pick < 0.8 && money >= 1700) buy('vectora', 1700); else if (money >= 1900) buy('rampart', 1900);
      } else if (money >= 900 && p.slots.secondary?.id === 'vela') {
        buy(m.rng() < 0.5 ? 'rook' : 'needle', m.rng() < 0.5 ? 700 : 900);
      }
    }
    if (p.armor < 100 || !p.helmet) {
      if (money >= ARMOR.vestHelmet.price + 200 && (p.slots.primary || money >= 1500)) buy('vesthelmet', ARMOR.vestHelmet.price - (p.armor >= 100 ? ARMOR.vest.price : 0) - (p.helmet ? ARMOR.helmetUpgrade : 0));
      else if (p.armor < 100 && money >= ARMOR.vest.price + 100) buy('vest', ARMOR.vest.price);
    }
    if (side === 'cus' && !p.kit && money >= ARMOR.kit.price && (p.slots.primary || money >= 800)) buy('kit', ARMOR.kit.price);
    // Utility with what is left.
    const wantUtil: UtilityId[] = side === 'int' ? ['flash', 'veil', 'frag', 'thermite', 'flash', 'pulse'] : ['veil', 'flash', 'frag', 'pulse', 'thermite', 'flash'];
    const cap = (haveRifle || money > 1200 || !!p.slots.primary) ? 3 : 1;
    let n = p.util.length;
    for (const u of wantUtil) {
      if (n >= cap) break;
      if (p.util.filter((x) => x === u).length >= UTILITY[u].max) continue;
      if (q.filter((x) => x === u).length >= UTILITY[u].max) continue;
      if (money >= UTILITY[u].price + 100 && m.rng() < 0.7 * this.diff.utility + 0.2) { if (buy(u, UTILITY[u].price)) n++; }
    }
    void has;
    this.queue = q;
  }

  // ------------------------------------------------------------ perception
  private perceive(m: Match, p: Player, ai: TeamAI): void {
    const eye = m.eyePos(p);
    const flashed = m.time < p.flashUntil;
    const fwd = dirFromAngles(this.yaw, this.pitch);
    this.visCheck++;
    for (const e of m.players) {
      if (!e.alive || e.side === p.side) continue;
      const k = (this.visCheck + e.id) % 3; // stagger work
      if (k !== 0) continue;
      let c = this.contacts.get(e.id);
      let seen = false;
      if (!flashed) {
        const head = { x: e.pos.x, y: e.pos.y + eyeHeight(e.crouch) - 0.05, z: e.pos.z };
        const chest = { x: e.pos.x, y: e.pos.y + 1.1 - e.crouch * 0.35, z: e.pos.z };
        const dx = chest.x - eye.x, dz = chest.z - eye.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 80) {
          const dyaw = Math.abs(angleDiff(Math.atan2(-dx, -dz), this.yaw));
          const near = dist < 3.5;
          if (dyaw < 62 * DEG || near) {
            if ((lineOfSight(eye, head) || lineOfSight(eye, chest)) && !m.isSmoked(eye, chest)) seen = true;
          }
        }
      }
      if (seen) {
        if (!c) { c = { id: e.id, pos: { ...e.pos }, t: m.time, visible: true, firstSeen: m.time }; this.contacts.set(e.id, c); } else {
          if (!c.visible && m.time - c.t > 0.6) c.firstSeen = m.time;
          c.pos = { ...e.pos }; c.t = m.time; c.visible = true;
        }
        ai.report(e.pos, m.time, true);
      } else if (c) {
        c.visible = false;
        if (m.time - c.t > this.diff.memory) this.contacts.delete(e.id);
      }
    }
    void fwd;
    // Hearing for individual orientation.
    for (const e of m.events) {
      if (e.t === 'step') {
        const src = m.players[e.id];
        if (src.side === p.side) continue;
        const d = Math.hypot(e.p.x - p.pos.x, e.p.z - p.pos.z);
        if (d < 5 + 26 * e.loud) this.heard = { pos: { x: e.p.x, y: e.p.y, z: e.p.z }, t: m.time, kind: 'step' };
      } else if (e.t === 'shot' && e.side !== p.side) {
        this.heard = { pos: { ...e.o }, t: m.time, kind: 'shot' };
      }
    }
  }

  private pickTarget(m: Match, p: Player, eye: Vec3): Contact | null {
    let best: Contact | null = null;
    let bd = Infinity;
    for (const c of this.contacts.values()) {
      if (!c.visible) continue;
      const e = m.players[c.id];
      if (!e.alive) { this.contacts.delete(c.id); continue; }
      const d = Math.hypot(c.pos.x - eye.x, c.pos.z - eye.z);
      if (d < bd) { bd = d; best = c; }
    }
    if (best && best.id !== this.target) { this.target = best.id; }
    return best;
  }

  // ------------------------------------------------------------ combat
  private stopToShoot(p: Player, def: any): boolean {
    if (!def) return false;
    return def.cls !== 'smg';
  }

  private combat(m: Match, p: Player, eye: Vec3, c: Contact, def: typeof WEAPONS[WeaponId], w: NonNullable<ReturnType<Match['heldWeapon']>>, cmd: InputCmd): boolean {
    const e = m.players[c.id];
    const reactReady = m.time - c.firstSeen >= this.diff.reaction;
    // Aim point: chest, sometimes head.
    const headBias = this.diff.headBias;
    const useHead = (c.id * 7 + Math.floor(m.time * 2)) % 100 < headBias * 100;
    const ay = useHead ? eyeHeight(e.crouch) - 0.08 : 1.15 - e.crouch * 0.35;
    const aim = { x: e.pos.x, y: e.pos.y + ay, z: e.pos.z };
    // Never trade ammo for a target the bullet cannot reach (cover, or glass edges): need a clear line to the aim point.
    if (!lineOfSight(eye, aim)) {
      const alt = { x: e.pos.x, y: e.pos.y + (useHead ? 1.1 - e.crouch * 0.35 : eyeHeight(e.crouch) - 0.08), z: e.pos.z };
      if (!lineOfSight(eye, alt)) return false;
      aim.y = alt.y;
    }
    if (w.mag === 0 && w.reserve === 0 && !(p.slots.secondary && p.slots.secondary !== w && (p.slots.secondary.mag > 0 || p.slots.secondary.reserve > 0))) return false;
    const dx = aim.x - eye.x, dy = aim.y - eye.y, dz = aim.z - eye.z;
    const horiz = Math.hypot(dx, dz);
    const dist = Math.hypot(horiz, dy);
    this.aimTargetYaw = Math.atan2(-dx, -dz);
    this.aimTargetPitch = Math.atan2(dy, horiz);
    // lead: ignore (moderate difficulty) but add slight velocity prediction on hard
    if (this.diff.id === 'hard') {
      this.aimTargetYaw += clamp((e.vel.x * Math.cos(this.aimTargetYaw) - e.vel.z * Math.sin(this.aimTargetYaw)) * -0.0, -0.02, 0.02);
    }
    this.aimActive = true;

    // Fire control
    const yawErr = Math.abs(angleDiff(this.aimTargetYaw, this.effectiveYaw(m, p, w, def)));
    const pitchErr = Math.abs(this.aimTargetPitch - this.effectivePitch(m, p, w, def));
    const tol = Math.atan2(0.3, Math.max(dist, 2)) + 0.012;
    const aligned = yawErr < tol && pitchErr < tol * 1.2;
    const spd = horizontalSpeed(p);
    const steady = spd < (def.cls === 'smg' || def.cls === 'pistol' ? 2.2 : 1.1) || def.cls === 'shotgun';
    const inRange = dist < def.range * 0.9;

    if (def.scoped && w.scopeLevel === 0 && dist > 18) cmd.alt = m.tick % 2 === 0; // toggles scope up
    if (def.scoped && w.scopeLevel > 0 && dist < 10) cmd.alt = m.tick % 2 === 0;

    if (reactReady && aligned && steady && inRange && m.time >= this.holdFireUntil) {
      const mode = def.mode;
      if (mode === 'auto') {
        cmd.fire = true;
        const closeSpray = dist < 12 ? 14 : dist < 28 ? 5 : 3;
        this.sprayCount++;
        if (this.sprayCount >= closeSpray + Math.floor((m.rng() * 3))) {
          this.sprayCount = 0;
          this.holdFireUntil = m.time + (dist < 12 ? 0.12 : 0.22 + m.rng() * 0.2);
        }
      } else {
        // press / release cadence for semi, burst, bolt, pump
        this.fireToggle = !this.fireToggle;
        cmd.fire = this.fireToggle;
      }
    } else {
      this.sprayCount = 0;
    }
    if (!steady && !(def.cls === 'smg')) {
      // brake quickly: handled by zero move (stopToShoot) in think()
    }
    // crouch at range for accuracy
    cmd.crouch = dist > 28 && (def.cls === 'rifle' || def.cls === 'lmg' || def.cls === 'dmr');
    // reload if empty mid-fight and covered: do nothing, switch to pistol if empty
    if (w.mag === 0 && w.reserve === 0 && p.cur === 'primary' && p.slots.secondary) cmd.select = 'secondary';
    return true;
  }

  private aimTargetYaw = 0;
  private aimTargetPitch = 0;
  private aimActive = false;
  private sprayCount = 0;

  private effectiveYaw(m: Match, p: Player, w: any, def: any): number {
    const k = kickNow(w, def, m.time);
    return this.yaw + k.yaw;
  }
  private effectivePitch(m: Match, p: Player, w: any, def: any): number {
    const k = kickNow(w, def, m.time);
    return this.pitch + k.pitch;
  }

  // ------------------------------------------------------------ view
  private smoothAngle(cur: number, target: number, f: number): number {
    return normAngle(cur + angleDiff(target, cur) * f);
  }

  private updateView(m: Match, p: Player, eye: Vec3, engaged: Contact | null, lookAt: P2 | null, cmd: InputCmd, def: any, w: any): void {
    const dt = 1 / 64;
    if (engaged && this.aimActive && def && w) {
      this.aimErrT -= dt;
      if (this.aimErrT <= 0) {
        this.aimErrT = 0.25 + m.rng() * 0.25;
        const dist = Math.max(2, Math.hypot(engaged.pos.x - eye.x, engaged.pos.z - eye.z));
        const e = this.diff.aimErr * Math.min(2.2, 8 / Math.max(2, Math.sqrt(dist)));
        this.aimErrYaw = (m.rng() * 2 - 1) * e;
        this.aimErrPitch = (m.rng() * 2 - 1) * e;
      }
      // Compensate recoil according to skill: want (view + kick) == target.
      const k = kickNow(w, def, m.time);
      const wantYaw = this.aimTargetYaw - k.yaw * this.diff.recoilSkill + this.aimErrYaw;
      const wantPitch = this.aimTargetPitch - k.pitch * this.diff.recoilSkill + this.aimErrPitch;
      const maxStep = this.diff.aimSpeed * dt * (this.diff.id === 'easy' ? 1 : 1.4);
      const dy = angleDiff(wantYaw, this.yaw);
      const dp = wantPitch - this.pitch;
      // faster when far off, eases near target
      const gain = 0.35;
      this.yaw = normAngle(this.yaw + clamp(dy * gain, -maxStep * 3, maxStep * 3));
      this.pitch = clamp(this.pitch + clamp(dp * gain, -maxStep * 3, maxStep * 3), -1.2, 1.2);
      this.aimActive = false;
      return;
    }
    this.aimActive = false;
    // Idle look: path direction, explicit look target, or a heard sound.
    let desiredYaw = this.yaw;
    let desiredPitch = 0;
    const heardRecent = this.heard && m.time - this.heard.t < 2.0;
    if (heardRecent && !lookAt) {
      desiredYaw = yawTo(p.pos, this.heard!.pos);
    } else if (lookAt) {
      desiredYaw = yawTo(p.pos, lookAt);
      const dd = Math.hypot(lookAt.x - p.pos.x, lookAt.z - p.pos.z);
      desiredPitch = clamp(Math.atan2(-0.1, Math.max(dd, 1)), -0.2, 0.1);
    } else if (this.path.length && this.pathIdx < this.path.length) {
      const wp = this.path[this.pathIdx];
      desiredYaw = yawTo(p.pos, wp);
    } else if (this.lookAround > 0) {
      desiredYaw = this.lookYaw;
    }
    // faster turn when moving; slight wander
    const dy = angleDiff(desiredYaw, this.yaw);
    const sp = Math.min(Math.abs(dy), 6 * dt * (heardRecent ? 1.8 : 1));
    this.yaw = normAngle(this.yaw + Math.sign(dy) * sp);
    this.pitch += (desiredPitch - this.pitch) * 0.1;
    void cmd;
  }

  // ------------------------------------------------------------ plans
  private planAttack(m: Match, p: Player, ai: TeamAI, a: Assignment | undefined): { moveGoal: P2 | null; lookAt: P2 | null; walk: boolean; holdPosition: boolean; wantUse: boolean } {
    const none = { moveGoal: null as P2 | null, lookAt: null as P2 | null, walk: false, holdPosition: false, wantUse: false };
    if (!a) return none;
    const h = HINTS[ai.site];
    const sp = m.spike;

    // Retrieve a dropped Spike (nearest attacker).
    if (sp.state === 'dropped') {
      const mates = m.alive('int');
      let best: Player | null = null; let bd = Infinity;
      for (const q of mates) { const d = Math.hypot(q.pos.x - sp.pos.x, q.pos.z - sp.pos.z); if (d < bd) { bd = d; best = q; } }
      if (best && best.id === p.id) return { ...none, moveGoal: { x: sp.pos.x, z: sp.pos.z } };
    }

    if (ai.intMode === 'save') {
      this.savedSpot = this.savedSpot ?? SAVE_SPOTS.int[(p.id * 3) % SAVE_SPOTS.int.length];
      return { ...none, moveGoal: this.savedSpot, walk: false };
    }

    if (ai.intMode === 'postplant' || sp.state === 'planted') {
      // Hold angles around the spike; with a frag for the defuser.
      const spots = HINTS[sp.site ?? ai.site].postPlant;
      const i = ai.assign.get(p.id) ? Array.from(ai.assign.keys()).indexOf(p.id) : p.id;
      const spot = spots[i % spots.length];
      return { moveGoal: { x: spot.x, z: spot.z }, lookAt: { x: spot.x + Math.sin(-spot.yaw) * 10, z: spot.z - Math.cos(spot.yaw) * 10 }, walk: false, holdPosition: Math.hypot(spot.x - p.pos.x, spot.z - p.pos.z) < 1.2, wantUse: false };
    }

    const lane = h.lanes[a.lane];
    if (ai.intMode === 'default') {
      // Move to the staging area for the chosen site, then wait and listen.
      const d = Math.hypot(a.stage.x - p.pos.x, a.stage.z - p.pos.z);
      if (d < 1.5) return { ...none, holdPosition: true, lookAt: lane.entry };
      return { ...none, moveGoal: a.stage };
    }

    // execute
    const inSite = inZone(SITES[ai.site], p.pos.x, p.pos.z);
    if (p.spike) {
      // Go into the site once teammates have entered or after a delay.
      const mates = m.alive('int').filter((q) => q.id !== p.id);
      const inside = mates.filter((q) => inZone(SITES[ai.site], q.pos.x, q.pos.z)).length;
      const waited = m.time - (m.liveStart + ai.executeAt);
      const clearEnough = inside >= Math.min(2, mates.length) || waited > 14 || mates.length === 0;
      if (!clearEnough) {
        const hold = lane.push[0];
        return { ...none, moveGoal: hold, walk: false };
      }
      const spot = h.plant[Math.floor(p.id) % h.plant.length];
      if (inSite && Math.hypot(spot.x - p.pos.x, spot.z - p.pos.z) < 1.5 && p.onGround) {
        // Plant when no known threat is close.
        const threat = Array.from(this.contacts.values()).some((c) => c.visible);
        return { ...none, holdPosition: true, wantUse: !threat, lookAt: spot };
      }
      return { ...none, moveGoal: spot };
    }
    // non-carriers: push the lane then clear their spot
    const intoSite = lane.push[lane.push.length - 1];
    if (!a.smoked && m.time < ai.smokeAt + 2.0) {
      // wait at stage for utility to land
      return { ...none, holdPosition: Math.hypot(a.stage.x - p.pos.x, a.stage.z - p.pos.z) < 2 };
    }
    const pastEntry = p.pos.z < lane.entry.z + 3 || inSite;
    if (!pastEntry) return { ...none, moveGoal: lane.entry };
    const cleared = Math.hypot(a.clear.x - p.pos.x, a.clear.z - p.pos.z) < 1.5;
    if (!cleared) return { ...none, moveGoal: a.clear };
    void intoSite;
    return { ...none, holdPosition: true, lookAt: HINTS[ai.site].smoke[1] };
  }

  private planDefense(m: Match, p: Player, ai: TeamAI, a: Assignment | undefined): { moveGoal: P2 | null; lookAt: P2 | null; walk: boolean; holdPosition: boolean; wantUse: boolean } {
    const none = { moveGoal: null as P2 | null, lookAt: null as P2 | null, walk: false, holdPosition: false, wantUse: false };
    const sp = m.spike;
    const kitNeeded = p.kit ? 5 : 8;

    if (ai.cusMode === 'retake' && sp.state === 'planted') {
      const remain = sp.explodeAt - m.time;
      const dSpike = Math.hypot(sp.pos.x - p.pos.x, sp.pos.z - p.pos.z);
      const travel = dSpike / 4.2;
      // Save when a defuse can no longer finish.
      if (remain < travel + kitNeeded * 0.6 && sp.defuser !== p.id) {
        this.savedSpot = this.savedSpot ?? SAVE_SPOTS.cus[(p.id * 3) % SAVE_SPOTS.cus.length];
        return { ...none, moveGoal: this.savedSpot };
      }
      const site = ai.retakeSite;
      const R = HINTS[site].retake;
      const group = (Array.from(ai.assign.keys()).indexOf(p.id)) % R.length;
      const r = R[group];
      const dStage = Math.hypot(r.stage.x - p.pos.x, r.stage.z - p.pos.z);
      if (m.time < ai.retakeGoAt && dStage > 2) return { ...none, moveGoal: r.stage };
      if (m.time < ai.retakeGoAt) return { ...none, holdPosition: true, lookAt: r.entry };
      // Go: nearest defuser walks to the Spike when it is not being contested.
      const mates = m.alive('cus');
      let best: Player | null = null; let bd = Infinity;
      for (const q of mates) { const d = Math.hypot(q.pos.x - sp.pos.x, q.pos.z - sp.pos.z) - (q.kit ? 4 : 0); if (d < bd) { bd = d; best = q; } }
      const isDefuser = best && best.id === p.id;
      const visibleThreat = Array.from(this.contacts.values()).some((c) => c.visible);
      if (isDefuser) {
        if (dSpike <= 1.3) return { ...none, holdPosition: true, wantUse: !visibleThreat || p.interact.progress > 0.5, lookAt: { x: sp.pos.x, z: sp.pos.z } };
        return { ...none, moveGoal: { x: sp.pos.x, z: sp.pos.z } };
      }
      // others: clear towards the Spike by sections
      const clearPts = HINTS[site].clear;
      const spot = clearPts[(p.id) % clearPts.length];
      return { ...none, moveGoal: spot };
    }

    if (ai.cusMode === 'save') return none;
    if (!a || !a.hold) return none;
    const hold = a.hold;
    if (m.phase === 'live' && m.phaseRemaining() < 1) return none;
    const d = Math.hypot(hold.x - p.pos.x, hold.z - p.pos.z);
    const rotating = a.role === 'rotator' && this.heardRotation(ai, m);
    if (d > 1.2) return { ...none, moveGoal: hold, walk: m.time - m.liveStart > 3 && !rotating && d < 6 };
    // Hold the angle; occasionally shoulder-check.
    this.lookAround -= 1 / 64;
    if (this.lookAround < -3) { this.lookAround = 0.8; this.lookYaw = hold.yaw + (m.rng() - 0.5) * 1.8; }
    return { ...none, holdPosition: true, lookAt: this.lookAround > 0 ? { x: hold.x - Math.sin(this.lookYaw) * 10, z: hold.z - Math.cos(this.lookYaw) * 10 } : { x: hold.x - Math.sin(hold.yaw) * 10, z: hold.z - Math.cos(hold.yaw) * 10 } };
  }

  private heardRotation(ai: TeamAI, m: Match): boolean { return ai.rotatedTo !== null; }

  // ------------------------------------------------------------ utility use
  private useUtility(m: Match, p: Player, ai: TeamAI, a: Assignment | undefined, cmd: InputCmd): void {
    if (p.util.length === 0 && !this.throwPlan) return;
    // Continue an in-progress throw: aim then release.
    if (this.throwPlan) {
      const plan = this.throwPlan;
      const type = plan.type;
      const idx = p.util.indexOf(type);
      if (idx < 0) { this.throwPlan = null; return; }
      if (p.cur !== `util${idx}`) { cmd.select = `util${idx}` as InputCmd['select']; this.aimTo(plan.yaw, plan.pitch); return; }
      this.aimTo(plan.yaw, plan.pitch);
      const w = m.heldWeapon(p);
      void w;
      if (Math.abs(angleDiff(plan.yaw, this.yaw)) < 0.03 && Math.abs(plan.pitch - this.pitch) < 0.04 && m.time >= p.dropLock) {
        // Wait for draw time via nextFire gating handled in sim: throwing is immediate once selected.
        cmd.fire = plan.speed > 15;
        cmd.alt = plan.speed <= 15;
        this.thrown.add(type + plan.target.x);
        this.throwPlan = null;
      }
      return;
    }
    if (p.side === 'int') {
      if (ai.intMode !== 'execute' || p.spike) return;
      const h = HINTS[ai.site];
      // smoke + flash into the site before entry
      if (m.time > ai.smokeAt + 0.2 && m.time < ai.smokeAt + 9) {
        const ui = p.util.indexOf('veil');
        const key = 'veil' + p.id;
        if (ui >= 0 && !this.thrown.has(key) && m.rng() < 0.06 * this.diff.utility + 0.04) {
          const tgt = h.smoke[(p.id) % h.smoke.length];
          const plan = this.solveThrow(m, p, tgt, 'veil');
          this.thrown.add(key);
          if (plan) { this.throwPlan = plan; if (a) a.smoked = true; }
          else if (a) a.smoked = true;
        }
        const fi = p.util.indexOf('flash');
        const fkey = 'flash' + p.id;
        if (fi >= 0 && !this.thrown.has(fkey) && m.time > ai.smokeAt + 1.2 && m.rng() < 0.05 * this.diff.utility + 0.03) {
          const tgt = h.flash[(p.id) % h.flash.length];
          const plan = this.solveThrow(m, p, tgt, 'flash');
          this.thrown.add(fkey);
          if (plan) this.throwPlan = plan;
        }
        if (a && !a.smoked && m.time > ai.smokeAt + 1.5) a.smoked = true;
      }
    } else {
      // Defenders: frag/flash/thermite at a known attacker position; utility on retake.
      const known = Array.from(this.contacts.values()).filter((c) => m.time - c.t < 3 && !c.visible).sort((x, y) => y.t - x.t)[0];
      if (known && m.rng() < 0.01 * this.diff.utility) {
        const type = p.util.includes('frag') ? 'frag' : p.util.includes('flash') ? 'flash' : null;
        if (type && !this.thrown.has(type + Math.floor(m.time / 5))) {
          const plan = this.solveThrow(m, p, { x: known.pos.x, z: known.pos.z }, type as UtilityId);
          this.thrown.add(type + Math.floor(m.time / 5));
          if (plan) this.throwPlan = plan;
        }
      }
      if (ai.cusMode === 'retake' && m.time > ai.retakeGoAt - 1.2 && m.time < ai.retakeGoAt + 3 && p.util.length) {
        const key = 'retake' + p.id;
        if (!this.thrown.has(key)) {
          this.thrown.add(key);
          const type = p.util.includes('veil') ? 'veil' : p.util.includes('flash') ? 'flash' : p.util.includes('thermite') ? 'thermite' : p.util.includes('frag') ? 'frag' : null;
          if (type) {
            const sp = m.spike;
            const tgt = type === 'veil' ? { x: sp.pos.x + 2, z: sp.pos.z - 2 } : { x: sp.pos.x, z: sp.pos.z };
            const plan = this.solveThrow(m, p, tgt, type as UtilityId);
            if (plan) this.throwPlan = plan;
          }
        }
      }
    }
    // Post-plant: frag the Spike when it is being defused.
    if (p.side === 'int' && m.spike.state === 'planted' && m.spike.defuser >= 0 && p.util.includes('frag')) {
      const key = 'defuseFrag' + p.id;
      if (!this.thrown.has(key)) {
        this.thrown.add(key);
        const plan = this.solveThrow(m, p, { x: m.spike.pos.x, z: m.spike.pos.z }, 'frag');
        if (plan) this.throwPlan = plan;
      }
    }
  }

  private aimTo(yaw: number, pitch: number): void {
    const dy = angleDiff(yaw, this.yaw);
    this.yaw = normAngle(this.yaw + clamp(dy, -0.12, 0.12));
    this.pitch += clamp(pitch - this.pitch, -0.08, 0.08);
  }

  /** Search launch angles with the real grenade physics for one that lands near the target. */
  solveThrow(m: Match, p: Player, target: P2, type: UtilityId): BotBrain['throwPlan'] {
    const eye = m.eyePos(p);
    const tyaw = yawTo(p.pos, target);
    let best: { err: number; pitch: number; speed: number } | null = null;
    for (const speed of [20, 9]) {
      for (let pd = -5; pd <= 60; pd += 5) {
        const pitch = pd * DEG;
        const dir = dirFromAngles(tyaw, pitch + 0.1);
        const start = { x: eye.x + dir.x * 0.45, y: eye.y + dir.y * 0.45 - 0.1, z: eye.z + dir.z * 0.45 };
        const vel = { x: dir.x * speed, y: dir.y * speed, z: dir.z * speed };
        const r = predictThrow(start, vel, 64 * 4);
        const err = Math.hypot(r.end.x - target.x, r.end.z - target.z);
        if (!best || err < best.err) best = { err, pitch, speed };
      }
    }
    if (!best || best.err > 3.5) return null;
    return { type, target, yaw: tyaw, pitch: best.pitch, speed: best.speed, from: { x: p.pos.x, z: p.pos.z } };
  }

  // ------------------------------------------------------------ locomotion
  private follow(m: Match, p: Player, goal: P2, cmd: InputCmd, walk: boolean): void {
    const goalChanged = !this.goal || Math.hypot(this.goal.x - goal.x, this.goal.z - goal.z) > 1.0;
    if (goalChanged || m.time >= this.repathAt || (!this.path.length)) {
      this.goal = { ...goal };
      this.repathAt = m.time + 2.5;
      const avoid = m.fires.length
        ? (x: number, z: number) => { for (const f of m.fires) for (const c of f.cells) if (Math.abs(c.x - x) < 1 && Math.abs(c.z - z) < 1) return 12; return 0; }
        : undefined;
      const path = findPath(p.pos, { x: goal.x, y: 0, z: goal.z }, { extraCost: avoid });
      this.path = path ?? [];
      this.pathIdx = 0;
    }
    if (!this.path.length) return;
    while (this.pathIdx < this.path.length - 1 && Math.hypot(this.path[this.pathIdx].x - p.pos.x, this.path[this.pathIdx].z - p.pos.z) < 0.7) this.pathIdx++;
    const wp = this.path[this.pathIdx];
    const dx = wp.x - p.pos.x, dz = wp.z - p.pos.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.35 && this.pathIdx >= this.path.length - 1) { this.path = []; return; }
    // world direction -> stored; converted to the view frame in toLocalMove
    this.worldMove = { x: dx / Math.max(d, 0.001), z: dz / Math.max(d, 0.001) };
    cmd.walk = walk;
    // Jump over a low obstacle if blocked while trying to move (rare).
    void m;
  }

  private worldMove: { x: number; z: number } | null = null;

  private toLocalMove(p: Player, cmd: InputCmd): void {
    if (!this.worldMove) { cmd.moveX = 0; cmd.moveZ = 0; return; }
    const w = this.worldMove;
    this.worldMove = null;
    const sinY = Math.sin(this.yaw), cosY = Math.cos(this.yaw);
    // forward = (-sin, -cos), right = (cos, -sin)
    cmd.moveZ = clamp(w.x * -sinY + w.z * -cosY, -1, 1);
    cmd.moveX = clamp(w.x * cosY + w.z * -sinY, -1, 1);
  }

  private stuckCheck(m: Match, p: Player, cmd: InputCmd): void {
    if (m.time - this.lastPosT > 1.0) {
      const moved = Math.hypot(p.pos.x - this.lastPos.x, p.pos.z - this.lastPos.z);
      if ((cmd.moveX !== 0 || cmd.moveZ !== 0) && moved < 0.3 && !cmd.use) {
        this.stuckT += 1;
        this.repathAt = 0;
        cmd.jump = true;
        if (this.stuckT >= 3) { this.path = []; this.goal = null; this.stuckT = 0; this.strafeDir = -this.strafeDir; }
      } else this.stuckT = 0;
      this.lastPos = { ...p.pos };
      this.lastPosT = m.time;
    }
    if (this.stuckT > 0 && m.time - this.lastPosT < 0.3) { cmd.moveX += 0.0; }
    void this.crouching;
  }
}

export function installBots(m: Match, difficulty: DifficultyId = 'normal', opts: { squad?: 0 | 1 } = {}): TeamAI[] {
  const diff = DIFFICULTY[difficulty];
  const ai = { cus: new TeamAI('cus'), int: new TeamAI('int') };
  for (const p of m.players) {
    if (p.controller !== 'bot') continue;
    if (opts.squad !== undefined && p.squad !== opts.squad) continue;
    const brain = new BotBrain(diff, ai);
    m.brains.set(p.id, brain);
  }
  return [ai.cus, ai.int];
}

export { DEFAULT_ENTRY, nearestWalkable, isWalkableAt, ECON };
export type { Zone };
