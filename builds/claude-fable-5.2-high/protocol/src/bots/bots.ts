// Server-side bots. They obey the same information rules as players: line-of-sight vision with a field
// of view, hearing with positional uncertainty, teammate radio via a team blackboard. They never read
// enemy positions they have not sensed, and they act only by producing ordinary InputCmds and commands.
import { DT, UTILITY, type UtilityId } from '../content/rules';
import { WEAPONS, recoilAt } from '../content/weapons';
import { calloutAt, type EntryDef, type MapData, type SiteDef, type Spot } from '../map/build';
import type { NavGrid } from '../map/nav';
import { BTN, type BuyItem, type InputCmd, type Side } from '../protocol/types';
import { Rng, clamp, dirFromAngles, v3, wrapAngle } from '../shared/math';
import { simulateThrow } from '../sim/grenades';
import { bodyDims } from '../sim/hit';
import type { Match } from '../sim/match';
import { eyeHeight } from '../sim/movement';
import { activeDef, activeWeapon, type Player } from '../sim/state';
import { canSeePlayer, lineOfSight } from '../sim/vision';

export type Difficulty = 'easy' | 'normal' | 'hard';

export interface BotConfig {
  reaction: number;
  aimError: number;
  turnRate: number;
  headBias: number;
  recoilControl: number;
  memory: number;
  burst: number;
}

export const DIFFICULTY: Record<Difficulty, BotConfig> = {
  easy: { reaction: 0.62, aimError: 0.03, turnRate: 4.2, headBias: 0.06, recoilControl: 0.45, memory: 3, burst: 0.6 },
  normal: { reaction: 0.42, aimError: 0.017, turnRate: 6.2, headBias: 0.18, recoilControl: 0.68, memory: 5, burst: 0.8 },
  hard: { reaction: 0.27, aimError: 0.009, turnRate: 8.5, headBias: 0.38, recoilControl: 0.86, memory: 8, burst: 1 },
};

interface P3 {
  x: number;
  y?: number;
  z: number;
}

interface Contact {
  id: number;
  x: number;
  y: number;
  z: number;
  time: number;
  seen: boolean;
}

type AtkState = 'stage' | 'execute' | 'post';

class TeamBrain {
  contacts = new Map<number, Contact>();
  side: Side = 'atk';
  // attack
  site: SiteDef | null = null;
  state: AtkState = 'stage';
  execAt = 0;
  entryOf = new Map<number, EntryDef>();
  spotOf = new Map<number, number>();
  retriever = -1;
  replans = 0;
  // defense
  holdOf = new Map<number, Spot>();
  homeSite = new Map<number, 'A' | 'B' | 'M'>();
  focus: '' | 'A' | 'B' = '';
  focusLevel = 0;
  defuser = -1;
  retakeGo = false;
  defuseHeard = -10;
  lastChat = -10;
  spikeSeenAt: { x: number; z: number; time: number } | null = null;
  buy: 'eco' | 'force' | 'full' | 'pistol' = 'pistol';
  constructor(public team: number) {}
}

const tmpDir = v3();
const zoneOf = (x: number): 'A' | 'B' | 'M' => (x >= 52 ? 'A' : x <= 28 ? 'B' : 'M');

class Bot {
  path: number[] = [];
  pathIdx = 0;
  route: P3[] = [];
  dest: P3 | null = null;
  arrived = false;
  repathAt = 0;
  look: { x: number; z: number } | null = null;
  // perception / combat
  target = -1;
  noticeAt = 0;
  visible = new Set<number>();
  lastSeen: Contact | null = null;
  aimHead = false;
  errY = 0;
  errP = 0;
  errTY = 0;
  errTP = 0;
  errAt = 0;
  burstLeft = 0;
  burstPause = 0;
  firePrev = false;
  altPrev = false;
  strafe = 0;
  strafeAt = 0;
  /** when the current continuous engagement began (reset by dealing damage or losing sight) */
  engageAt = 0;
  lastDamage = 0;
  // movement bookkeeping
  stuckAt = 0;
  stuckX = 0;
  stuckZ = 0;
  jumpAt = 0;
  senseOffset: number;
  glanceAt = 0;
  glanceYaw = 0;
  // buying
  buyList: BuyItem[] = [];
  buyAt = 0;
  // utility
  throwPlan: { type: UtilityId; yaw: number; pitch: number; lob: boolean; at: number } | null = null;
  utilTried = new Set<string>();
  utilAt = 0;
  mode = '';
  quiet = false;
  wantPlant = false;
  wantDefuse = false;
  holdSpot: Spot | null = null;
  slot = 0;
  constructor(
    public id: number,
    public cfg: BotConfig,
  ) {
    this.senseOffset = id % 6;
  }
}

export class BotManager {
  bots = new Map<number, Bot>();
  brains: [TeamBrain, TeamBrain] = [new TeamBrain(0), new TeamBrain(1)];
  private rng: Rng;
  private lastRound = -1;
  private lastPhase = '';
  private map: MapData;

  constructor(
    private match: Match,
    private nav: NavGrid,
    difficulty: Difficulty,
    enemyDifficulty?: Difficulty,
    humanTeam = 0,
  ) {
    this.map = match.map;
    this.rng = new Rng(match.seed ^ 0xb07);
    for (const p of match.players) {
      if (!p.bot) continue;
      const diff = p.team === humanTeam ? difficulty : (enemyDifficulty ?? difficulty);
      this.bots.set(p.id, new Bot(p.id, DIFFICULTY[diff]));
    }
  }

  // ---------------------------------------------------------------- main update
  update(inputs: (InputCmd | null)[]): void {
    const m = this.match;
    if (m.round !== this.lastRound && m.phase === 'buy') {
      this.lastRound = m.round;
      this.onRoundStart();
    }
    if (m.phase !== this.lastPhase) {
      if (m.phase === 'armed') this.onArmed();
      this.lastPhase = m.phase;
    }
    this.hear();
    if (m.tick % 16 === 0) for (const b of this.brains) this.think(b);
    for (const bot of this.bots.values()) {
      const p = m.players[bot.id];
      if (!p.alive) {
        inputs[bot.id] = null;
        continue;
      }
      inputs[bot.id] = this.act(bot, p);
    }
  }

  private brainOf(p: Player): TeamBrain {
    return this.brains[p.team];
  }

  private radio(b: TeamBrain, from: Player, text: string, force = false): void {
    const t = this.match.time;
    if (!force && t - b.lastChat < 3.5) return;
    b.lastChat = t;
    this.match.emit({ t: 'chat', from: from.id, text, kind: 'radio' }, -1, b.team);
  }

  // ---------------------------------------------------------------- round setup
  private onRoundStart(): void {
    const m = this.match;
    for (const b of this.brains) {
      b.contacts.clear();
      b.side = m.teams[b.team].side;
      b.focus = '';
      b.focusLevel = 0;
      b.defuser = -1;
      b.retriever = -1;
      b.spikeSeenAt = null;
      b.replans = 0;
      b.entryOf.clear();
      b.spotOf.clear();
      b.holdOf.clear();
      b.homeSite.clear();
      const mates = m.players.filter((p) => p.team === b.team);
      const botMates = mates.filter((p) => p.bot);
      // team economy call
      const avg = mates.reduce((s, p) => s + p.money, 0) / Math.max(1, mates.length);
      const firstOfHalf = m.round === 1 || m.round === m.rules.swapAfter + 1;
      b.buy = firstOfHalf ? 'pistol' : avg >= 3800 ? 'full' : avg >= 2300 ? 'force' : 'eco';
      if (b.side === 'atk') this.planAttack(b, botMates, m.time + m.rules.buyTime + this.rng.range(15, 27));
      else this.planDefense(b, botMates);
    }
    for (const bot of this.bots.values()) {
      const p = m.players[bot.id];
      bot.path = [];
      bot.route = [];
      bot.dest = null;
      bot.arrived = false;
      bot.target = -1;
      bot.visible.clear();
      bot.lastSeen = null;
      bot.throwPlan = null;
      bot.utilTried.clear();
      bot.wantPlant = false;
      bot.wantDefuse = false;
      bot.mode = '';
      bot.look = null;
      bot.buyList = this.shoppingList(p, this.brainOf(p));
      bot.buyAt = m.time + this.rng.range(0.4, 2.5);
      bot.utilAt = m.time + m.rules.buyTime + this.rng.range(5, 12);
    }
  }

  private planAttack(b: TeamBrain, bots: Player[], execAt: number): void {
    const sites = this.map.sites;
    const site = b.site && b.replans > 0 ? (b.site.id === 'A' ? sites.B : sites.A) : this.rng.chance(0.5) ? sites.A : sites.B;
    b.site = site;
    b.state = 'stage';
    b.execAt = execAt;
    const main = site.entries.filter((e) => !e.viaMid);
    const mid = site.entries.filter((e) => e.viaMid);
    const style = this.rng.next();
    const order = this.rng.shuffle(bots.slice());
    order.forEach((p, i) => {
      let e: EntryDef;
      if (style < 0.4) e = i < 3 ? main[0] : main[1 % main.length];
      else if (style < 0.75) e = i < 2 ? main[0] : i === 2 ? main[1 % main.length] : i === 3 && mid.length ? this.rng.pick(mid) : main[0];
      else e = i === 0 && mid.length ? this.rng.pick(mid) : i % 2 ? main[0] : main[1 % main.length];
      b.entryOf.set(p.id, e);
      b.spotOf.set(p.id, i % site.postPlant.length);
      const bot = this.bots.get(p.id);
      if (bot) {
        bot.slot = i;
        bot.mode = '';
      }
    });
    const speaker = order[0];
    if (speaker) this.radio(b, speaker, `Plan: ${site.name}. Stack ${b.entryOf.get(speaker.id)!.name}, go on my call.`, true);
  }

  private planDefense(b: TeamBrain, bots: Player[]): void {
    const sites = this.map.sites;
    const order = this.rng.shuffle(bots.slice());
    const stack = this.rng.next();
    // default 2 A / 2 B / 1 mid, with occasional three-stacks
    const layout: ('A' | 'B' | 'M')[] = stack < 0.15 ? ['A', 'A', 'A', 'B', 'M'] : stack < 0.3 ? ['B', 'B', 'B', 'A', 'M'] : ['A', 'B', 'M', 'A', 'B'];
    const used = { A: 0, B: 0, M: 0 };
    order.forEach((p, i) => {
      const where = layout[i % layout.length];
      const spots = where === 'M' ? this.map.midHolds : sites[where].holds;
      // the first defender on a vault always takes its listening post (holds[0]); the rest vary
      const n = used[where]++;
      const start = 1 + this.rng.int(Math.max(1, spots.length - 1));
      b.holdOf.set(p.id, n === 0 ? spots[0] : spots[1 + ((start + n - 2 + spots.length - 1) % Math.max(1, spots.length - 1))] ?? spots[0]);
      b.homeSite.set(p.id, where);
      const bot = this.bots.get(p.id);
      if (bot) bot.slot = i;
    });
  }

  private onArmed(): void {
    const m = this.match;
    for (const b of this.brains) {
      if (b.side === 'atk') {
        b.state = 'post';
        // attackers know where their own spike is
        const site = this.map.sites[m.spike.site || 'A'];
        b.site = site;
      } else {
        b.focus = m.spike.site || 'A';
        b.defuser = -1;
        b.retakeGo = false;
      }
      for (const bot of this.bots.values()) if (m.players[bot.id].team === b.team) bot.mode = '';
    }
  }

  // ---------------------------------------------------------------- economy
  private shoppingList(p: Player, b: TeamBrain): BuyItem[] {
    const list: BuyItem[] = [];
    let money = p.money;
    const add = (item: BuyItem, price: number): boolean => {
      if (money < price) return false;
      money -= price;
      list.push(item);
      return true;
    };
    const def = b.side === 'def';
    const r = this.rng;
    if (b.buy === 'pistol') {
      const roll = r.next();
      if (roll < 0.5) add('vest', 650);
      else if (roll < 0.75) add('rook', 700);
      else {
        add('flash', 200);
        add(def ? 'kit' : 'veil', def ? 400 : 300);
      }
      return list;
    }
    let mode = b.buy;
    if (mode === 'eco' && p.money >= 4200) mode = 'full';
    if (mode === 'eco') {
      if (p.money >= 2600 && r.chance(0.3)) add('vest', 650);
      return list;
    }
    if (!p.primary) {
      if (mode === 'full') {
        const roll = r.next();
        if (roll < 0.08 && money >= 5700) add('longglass', 4650);
        else if (roll < 0.14 && money >= 4800) add('atlas', 3800);
        else if (roll < 0.2 && money >= 4100) add('sable', 3100);
        else if (roll < 0.62) add('aster', 2650);
        else if (roll < 0.9) add('krait', 2900) || add('aster', 2650);
        else add('lumen', 2350);
      } else {
        const roll = r.next();
        if (roll < 0.4) add('kite', 1250);
        else if (roll < 0.7) add('vectora', 1700) || add('kite', 1250);
        else if (roll < 0.85) add('rampart', 1900) || add('kite', 1250);
        else add('lumen', 2350) || add('kite', 1250);
      }
    }
    if (p.armor < 100 || !p.helmet) {
      if (!(p.armor >= 100 ? add('vesthelm', 350) : add('vesthelm', 1000))) if (p.armor < 100) add('vest', 650);
    }
    if (def && !p.kit && r.chance(0.85)) add('kit', 400);
    if (mode === 'full') {
      if (!p.util.includes('veil')) add('veil', 300);
      if (!p.util.includes('flash')) add('flash', 200);
      if (p.util.length + list.filter((i) => i in UTILITY).length < 4) {
        const extra = r.pick<BuyItem>(def ? ['thermite', 'pulse', 'frag'] : ['frag', 'thermite', 'flash']);
        add(extra, UTILITY[extra as UtilityId].price);
      }
    } else if (r.chance(0.5)) add('flash', 200);
    return list;
  }

  // ---------------------------------------------------------------- hearing
  private hear(): void {
    const m = this.match;
    for (const n of m.noises) {
      if (n.id < 0 || n.team < 0) {
        if (n.kind === 'disarm_start') this.brains[m.teamOfSide('atk')].defuseHeard = m.time;
        continue;
      }
      const brain = this.brains[1 - n.team];
      if (n.kind === 'disarm_start') {
        // a disarm attempt is loud: attackers anywhere near know someone is on the spike
        brain.defuseHeard = m.time;
      }
      if (n.kind === 'gear' || n.kind === 'scope' || n.kind === 'dry') continue;
      let heardBy: Player | null = null;
      let best = Infinity;
      for (const bot of this.bots.values()) {
        const p = m.players[bot.id];
        if (!p.alive || p.team === n.team) continue;
        const d = Math.hypot(p.move.x - n.x, p.move.z - n.z, p.move.y - n.y);
        const reach = n.kind === 'shot' ? Math.min(n.radius, 45) : n.radius;
        if (d <= reach && d < best) {
          best = d;
          heardBy = p;
        }
      }
      if (!heardBy) continue;
      const cur = brain.contacts.get(n.id);
      if (cur && cur.seen && m.time - cur.time < 0.5) continue;
      // hearing gives an uncertain position, never an exact one
      const err = 1.2 + best * 0.12;
      brain.contacts.set(n.id, {
        id: n.id,
        x: n.x + this.rng.range(-err, err),
        y: n.y,
        z: n.z + this.rng.range(-err, err),
        time: m.time,
        seen: false,
      });
    }
    // pulse shards give the owning team a coarse wedge
    const lp = m.lastPulse;
    if (lp && m.time - lp.time < DT * 1.5) {
      const brain = this.brains[lp.team];
      lp.wedges.forEach((w, i) => {
        const a = w.a * (Math.PI / 4);
        const d = w.d === 0 ? 4 : 10;
        brain.contacts.set(1000 + i, { id: 1000 + i, x: lp.x + Math.sin(a) * d, y: 0, z: lp.z + Math.cos(a) * d, time: m.time, seen: false });
      });
    }
  }

  // ---------------------------------------------------------------- team thinking (4 Hz)
  private think(b: TeamBrain): void {
    const m = this.match;
    const t = m.time;
    for (const [id, c] of b.contacts) if (t - c.time > 12) b.contacts.delete(id);
    if (!m.isLive()) return;
    const mates = m.players.filter((p) => p.team === b.team && p.alive);
    const botMates = mates.filter((p) => p.bot);
    if (!botMates.length) return;
    if (b.side === 'atk') {
      if (m.phase === 'live') {
        const left = (m.phaseEnd - m.tick) * DT;
        if (b.state === 'stage' && (t >= b.execAt || left < 45)) {
          b.state = 'execute';
          this.radio(b, botMates[0], `Go go go - hitting ${b.site!.name}.`, true);
          for (const p of botMates) this.bots.get(p.id)!.mode = '';
        }
        // a stalled execute with time on the clock turns into a rotate to the other vault
        if (b.state === 'execute' && t > b.execAt + 30 && left > 40 && b.replans < 1) {
          const carrier = mates.find((p) => p.hasSpike);
          if (carrier && m.siteAt(carrier.move.x, carrier.move.z) === '') {
            b.replans++;
            this.planAttack(b, botMates, t + 9);
            this.radio(b, botMates[0], `Rotating - new target ${b.site!.name}.`, true);
          }
        }
        // spike on the floor: the closest bot goes to get it
        if (m.spike.state === 'dropped') {
          let best = Infinity;
          b.retriever = -1;
          for (const p of botMates) {
            const d = Math.hypot(p.move.x - m.spike.x, p.move.z - m.spike.z);
            if (d < best) {
              best = d;
              b.retriever = p.id;
            }
          }
        } else b.retriever = -1;
      }
    } else {
      if (m.phase === 'armed') {
        // closest defender (kit preferred) takes the disarm
        let best = Infinity;
        let pick = -1;
        for (const p of botMates) {
          const d = Math.hypot(p.move.x - m.spike.x, p.move.z - m.spike.z) - (p.kit ? 6 : 0);
          if (d < best) {
            best = d;
            pick = p.id;
          }
        }
        const human = mates.find((p) => !p.bot && p.defuseT > 0);
        b.defuser = human ? -1 : pick;
        // retake together: wait at the approach until a second defender is close, unless the clock forbids it
        const left = (m.phaseEnd - m.tick) * DT;
        const site = this.map.sites[m.spike.site || 'A'];
        let near = 0;
        for (const p of mates) {
          if (Math.hypot(p.move.x - m.spike.x, p.move.z - m.spike.z) < 15) near++;
          else if (site.retake.some((r) => Math.hypot(p.move.x - r.x, p.move.z - r.z) < 7)) near++;
        }
        if (!b.retakeGo && (near >= Math.min(2, mates.length) || left < 24 || mates.length === 1)) {
          b.retakeGo = true;
          for (const p of botMates) this.bots.get(p.id)!.mode = '';
          if (mates.length > 1) this.radio(b, botMates[0], `Retaking ${site.name} together - go.`, true);
        }
      } else {
        // rotate on information: two or more recent contacts near one vault, or the spike seen there
        const count = { A: 0, B: 0, M: 0 };
        // staging attackers go quiet once they arrive, so what was heard stays relevant for a while
        for (const c of b.contacts.values()) if (t - c.time < (c.seen ? 6 : 11)) count[zoneOf(c.x)]++;
        // a teammate dying on a vault is as loud as two sightings there
        for (const p of m.players) if (p.team === b.team && !p.alive && t - p.diedAt < 8) count[zoneOf(p.move.x)] += 2;
        let focus: '' | 'A' | 'B' = b.focus;
        if (b.spikeSeenAt && t - b.spikeSeenAt.time < 10) {
          const z = zoneOf(b.spikeSeenAt.x);
          if (z !== 'M') focus = z;
        } else if (count.A >= 2 && count.A > count.B) focus = 'A';
        else if (count.B >= 2 && count.B > count.A) focus = 'B';
        const level = focus ? (count[focus] >= 4 ? 2 : 1) : 0;
        if (focus !== b.focus || level > b.focusLevel) {
          b.focus = focus;
          b.focusLevel = level;
          if (focus) {
            const site = this.map.sites[focus];
            let moved = 0;
            for (const p of botMates) {
              const home = b.homeSite.get(p.id);
              if (home === focus) continue;
              // keep one anchor on the other vault unless the picture is overwhelming
              if (home !== 'M' && moved >= 1 && count[focus] < 4) continue;
              b.holdOf.set(p.id, site.holds[(p.id + moved) % site.holds.length]);
              b.homeSite.set(p.id, focus);
              this.bots.get(p.id)!.mode = '';
              moved++;
            }
            if (moved) this.radio(b, botMates[0], `Rotating ${site.name}.`);
          }
        }
      }
    }
  }

  // ---------------------------------------------------------------- per-bot behaviour
  private act(bot: Bot, p: Player): InputCmd {
    const m = this.match;
    const t = m.time;
    const brain = this.brainOf(p);
    let buttons = 0;
    const pm = p.move;
    const eyeY = pm.y + eyeHeight(pm.crouch);

    // --- buy phase: shop, stand by
    if (m.phase === 'buy' || m.phase === 'warmup') {
      if (m.phase === 'buy' && bot.buyList.length && t >= bot.buyAt) {
        const item = bot.buyList.shift()!;
        m.command(p, { t: 'buy', item, reqId: m.tick * 16 + bot.id });
        bot.buyAt = t + this.rng.range(0.2, 0.5);
      }
      return this.cmd(bot, p, 0, p.yaw, 0);
    }
    if (m.phase === 'roundEnd' || m.phase === 'matchEnd') return this.cmd(bot, p, 0, p.yaw, p.pitch * 0.9);

    // --- perception (staggered ~10 Hz)
    const blind = t < p.blindUntil;
    if ((m.tick + bot.senseOffset) % 6 === 0) this.sense(bot, p, brain, eyeY, blind);
    const target = bot.target >= 0 ? m.players[bot.target] : null;
    const seeing = !!target && target.alive && bot.visible.has(target.id) && !blind;

    // --- decide goals (4 Hz)
    if ((m.tick + bot.id * 3) % 16 === 0 || bot.mode === '') this.decide(bot, p, brain);

    // --- look direction
    let wantYaw = p.yaw;
    let wantPitch = 0;
    let fire = false;
    let moveDir: { x: number; z: number } | null = null;
    let holdStill = false;
    const def = activeDef(p);
    const w = activeWeapon(p);

    if (bot.throwPlan) {
      // executing a utility throw: select, aim, release
      const plan = bot.throwPlan;
      const idx = p.util.indexOf(plan.type);
      if (idx < 0 || t > plan.at + 3) bot.throwPlan = null;
      else {
        if (p.slot !== 'util' || p.utilSel !== idx) m.command(p, { t: 'select', slot: 'util', util: idx });
        wantYaw = plan.yaw;
        wantPitch = plan.pitch;
        holdStill = true;
        const aligned = Math.abs(wrapAngle(plan.yaw - p.yaw)) < 0.03 && Math.abs(plan.pitch - p.pitch) < 0.03;
        if (aligned && p.slot === 'util' && t >= p.drawEnd && Math.hypot(pm.vx, pm.vz) < 0.3) {
          if (!bot.firePrev && !bot.altPrev) {
            buttons |= plan.lob ? BTN.ALT : BTN.FIRE;
            bot.throwPlan = null;
          }
        }
      }
    } else if (seeing && target) {
      // --- engage
      if (p.roundDamage !== bot.lastDamage) {
        // landing hits keeps the bot committed to the duel
        bot.lastDamage = p.roundDamage;
        bot.engageAt = t;
      }
      const pose = target.move;
      const d = bodyDims(pose.crouch);
      const aimY = pose.y + (bot.aimHead ? d.headY : d.neck - 0.36);
      const dx = pose.x - pm.x;
      const dz = pose.z - pm.z;
      const dist = Math.hypot(dx, dz);
      // aim error drifts toward a re-rolled offset; it is larger when the target strafes or we just noticed it
      if (t >= bot.errAt) {
        bot.errAt = t + this.rng.range(0.22, 0.42);
        const lateral = Math.abs(target.move.vx * dz - target.move.vz * dx) / Math.max(1, dist);
        const fresh = t - bot.noticeAt < 0.5 ? 1.8 : 1;
        // a braced defender on a pre-aimed angle is steadier than someone arriving on the move
        const braced = brain.side === 'def' && m.phase === 'live' && bot.arrived && !!bot.holdSpot ? 0.7 : 1;
        const k = bot.cfg.aimError * (1 + Math.min(1.6, lateral * 0.3)) * fresh * braced * (blind ? 4 : 1);
        bot.errTY = this.rng.gauss() * k;
        bot.errTP = this.rng.gauss() * k * 0.7;
      }
      bot.errY += (bot.errTY - bot.errY) * 0.12;
      bot.errP += (bot.errTP - bot.errP) * 0.12;
      const rec = recoilAt(def, p.recoilIdx);
      const trueYaw = Math.atan2(dx, dz);
      const truePitch = Math.atan2(aimY - eyeY, dist);
      wantYaw = trueYaw + bot.errY - rec.y * bot.cfg.recoilControl;
      wantPitch = truePitch + bot.errP - rec.p * bot.cfg.recoilControl;
      const offYaw = Math.abs(wrapAngle(trueYaw + bot.errY - rec.y * bot.cfg.recoilControl - p.yaw));
      const offPitch = Math.abs(truePitch + bot.errP - rec.p * bot.cfg.recoilControl - p.pitch);
      const tol = Math.max(0.012, Math.atan2(0.3, Math.max(1, dist)) * 0.9);
      const speed = Math.hypot(pm.vx, pm.vz);
      const melee = p.slot === 'tool';
      if (melee) {
        moveDir = { x: dx, z: dz };
        fire = dist < 1.6;
      } else if (w) {
        const close = dist < 6.5;
        // stop to shoot at range; strafe in close quarters
        if (close) {
          if (t >= bot.strafeAt) {
            bot.strafeAt = t + this.rng.range(0.35, 0.8);
            bot.strafe = this.rng.chance(0.5) ? 1 : -1;
          }
          moveDir = { x: (dz / (dist || 1)) * bot.strafe, z: (-dx / (dist || 1)) * bot.strafe };
        } else {
          const reach = def.cls === 'shotgun' ? 11 : def.cls === 'sidearm' ? 24 : def.cls === 'smg' ? 26 : 70;
          const patient = t - bot.engageAt < (m.phase === 'armed' ? 1.6 : 3.2);
          // stop to shoot only while the shot is realistic; otherwise keep moving on the objective
          if (dist <= reach && patient) holdStill = true;
        }
        if (def.scope && p.scope === 0 && dist > 9 && t >= p.drawEnd && p.reloadEnd === 0 && !bot.altPrev) buttons |= BTN.ALT;
        const steady = close || speed < 1.1 || def.cls === 'smg' || def.cls === 'shotgun';
        const scopedOk = !def.scope || p.scope > 0 || dist < 9;
        if (t >= bot.noticeAt && offYaw < tol && offPitch < tol * 1.3 && steady && scopedOk && (def.cls !== 'shotgun' || dist < 14)) {
          if (def.mode === 'auto') {
            // burst discipline by range
            if (t >= bot.burstPause) {
              if (bot.burstLeft <= 0) bot.burstLeft = dist > 20 ? this.rng.range(2, 4) : dist > 9 ? this.rng.range(4, 8) : 30;
              fire = true;
              bot.burstLeft -= (def.rpm / 60) * DT;
              if (bot.burstLeft <= 0) bot.burstPause = t + this.rng.range(0.22, 0.45) / bot.cfg.burst;
            }
          } else if (!bot.firePrev && t >= bot.burstPause) {
            fire = true;
            bot.burstPause = t + this.rng.range(0.1, 0.24) / bot.cfg.burst;
          }
        }
        if (w.ammo === 0 && w.reserve === 0) m.command(p, { t: 'select', slot: p.slot === 'primary' && p.sidearm ? 'sidearm' : 'tool' });
        else if (w.ammo === 0 && p.slot === 'primary' && p.sidearm && p.sidearm.ammo > 0 && dist < 12) m.command(p, { t: 'select', slot: 'sidearm' });
      }
      if (pm.crouch < 0.1 && bot.cfg.burst >= 0.8 && fire && dist > 7 && dist < 22 && p.recoilIdx > 4) buttons |= BTN.CROUCH;
    } else {
      // --- no visible target
      bot.burstLeft = 0;
      if (p.scope > 0 && !bot.altPrev && !(bot.holdSpot && bot.arrived)) buttons |= BTN.ALT;
      const mem = bot.lastSeen;
      const recent = mem && t - mem.time < Math.min(bot.cfg.memory, 2.6);
      if (recent && mem) {
        wantYaw = Math.atan2(mem.x - pm.x, mem.z - pm.z);
        wantPitch = Math.atan2(mem.y + 1.3 - eyeY, Math.hypot(mem.x - pm.x, mem.z - pm.z));
        if (t - mem.time < 0.9) holdStill = true;
      } else {
        const c = this.nearestContact(brain, p, 22, 4);
        // a bot settled on an angle keeps watching it: a noise through a wall is not a reason to look away,
        // only something actually seen, or something almost on top of it
        const holdingAngle = bot.arrived && !!bot.holdSpot;
        const cd = c ? Math.hypot(c.x - pm.x, c.z - pm.z) : 0;
        if (c && (!holdingAngle || cd < 5 || (c.seen && cd < 14))) {
          wantYaw = Math.atan2(c.x - pm.x, c.z - pm.z);
        } else if (bot.arrived && bot.look) {
          wantYaw = Math.atan2(bot.look.x - pm.x, bot.look.z - pm.z);
          // shoulder checks while holding
          if (t >= bot.glanceAt) {
            bot.glanceAt = t + this.rng.range(3.5, 7);
            bot.glanceYaw = this.rng.range(-0.5, 0.5);
          }
          if (t > bot.glanceAt - 0.7) wantYaw += bot.glanceYaw;
        } else if (bot.path.length) {
          const ahead = this.nav.nodes[bot.path[Math.min(bot.path.length - 1, bot.pathIdx + 4)]];
          if (Math.hypot(ahead.x - pm.x, ahead.z - pm.z) > 0.8) {
            wantYaw = Math.atan2(ahead.x - pm.x, ahead.z - pm.z);
            wantPitch = clamp(Math.atan2(ahead.y - pm.y, Math.hypot(ahead.x - pm.x, ahead.z - pm.z)) * 0.7, -0.5, 0.5);
          }
        }
      }
      // reload when it is quiet
      if (w && p.reloadEnd === 0 && w.reserve > 0 && w.ammo < WEAPONS[w.id].mag * 0.45 && !recent) buttons |= BTN.RELOAD;
      if (p.slot !== 'primary' && p.primary && (p.primary.ammo > 0 || p.primary.reserve > 0) && p.slot !== 'util') m.command(p, { t: 'select', slot: 'primary' });
      else if (p.slot === 'tool' && p.sidearm && p.sidearm.ammo + p.sidearm.reserve > 0) m.command(p, { t: 'select', slot: 'sidearm' });
    }

    // --- objective actions
    if (bot.wantPlant && p.hasSpike && m.phase === 'live' && m.siteAt(pm.x, pm.z) !== '' && (!seeing || p.plantT > 1.6)) {
      buttons |= BTN.USE;
      holdStill = true;
      fire = false;
      if (p.plantT === 0) this.radio(brain, p, `Arming at ${calloutAt(this.map, pm.x, pm.z, pm.y)}.`);
    }
    if (bot.wantDefuse && m.phase === 'armed') {
      const sp = m.spike;
      const ds = Math.hypot(sp.x - pm.x, sp.z - pm.z);
      const left = (m.phaseEnd - m.tick) * DT;
      const need = p.kit ? m.rules.defuseKitTime : m.rules.defuseTime;
      const desperate = left < need + 2.5;
      if (ds < 1.5 && (!seeing || desperate || p.defuseT > need * 0.6)) {
        buttons |= BTN.USE | BTN.CROUCH;
        holdStill = true;
        fire = false;
        if (p.defuseT === 0) this.radio(brain, p, 'Disarming - cover me.');
      }
    }

    // --- movement along the path
    if (!holdStill && !moveDir) moveDir = this.followPath(bot, p);
    if (moveDir && !holdStill) {
      const l = Math.hypot(moveDir.x, moveDir.z);
      if (l > 0.01) {
        const sy = Math.sin(p.yaw);
        const cy = Math.cos(p.yaw);
        const f = (moveDir.x * sy + moveDir.z * cy) / l;
        const s = (moveDir.x * cy - moveDir.z * sy) / l;
        if (f > 0.35) buttons |= BTN.FWD;
        else if (f < -0.35) buttons |= BTN.BACK;
        if (s > 0.35) buttons |= BTN.RIGHT;
        else if (s < -0.35) buttons |= BTN.LEFT;
        if (bot.quiet && !seeing) buttons |= BTN.WALK;
      }
    }
    // crouch through low passages
    if (bot.path.length) {
      for (let k = 0; k <= 1; k++) {
        const n = this.nav.nodes[bot.path[Math.min(bot.path.length - 1, bot.pathIdx + k)]];
        if (n.crouch && Math.hypot(n.x - pm.x, n.z - pm.z) < 1.6) buttons |= BTN.CROUCH;
      }
    }
    if (t < bot.jumpAt) buttons |= BTN.JUMP;
    if (fire) buttons |= BTN.FIRE;

    // --- smooth, rate-limited view turn
    const maxStep = bot.cfg.turnRate * DT;
    const dyaw = wrapAngle(wantYaw - p.yaw);
    const dp = wantPitch - p.pitch;
    const yaw = p.yaw + clamp(dyaw * 0.24, -maxStep, maxStep);
    const pitch = p.pitch + clamp(dp * 0.24, -maxStep, maxStep);
    return this.cmd(bot, p, buttons, yaw, pitch);
  }

  private cmd(bot: Bot, p: Player, buttons: number, yaw: number, pitch: number): InputCmd {
    bot.firePrev = (buttons & BTN.FIRE) !== 0;
    bot.altPrev = (buttons & BTN.ALT) !== 0;
    return { seq: this.match.tick, buttons, yaw: wrapAngle(yaw), pitch, renderTick: this.match.tick };
  }

  private nearestContact(b: TeamBrain, p: Player, maxDist: number, maxAge: number): Contact | null {
    let best: Contact | null = null;
    let bd = maxDist;
    for (const c of b.contacts.values()) {
      if (this.match.time - c.time > maxAge) continue;
      const d = Math.hypot(c.x - p.move.x, c.z - p.move.z);
      if (d < bd) {
        bd = d;
        best = c;
      }
    }
    return best;
  }

  // ---------------------------------------------------------------- perception
  private sense(bot: Bot, p: Player, brain: TeamBrain, eyeY: number, blind: boolean): void {
    const m = this.match;
    const t = m.time;
    const pm = p.move;
    dirFromAngles(p.yaw, p.pitch, tmpDir);
    const prev = bot.visible;
    const now = new Set<number>();
    let best = -1;
    let bestScore = Infinity;
    if (!blind) {
      for (const q of m.players) {
        if (!q.alive || q.team === p.team) continue;
        const dx = q.move.x - pm.x;
        const dy = q.move.y + 1 - eyeY;
        const dz = q.move.z - pm.z;
        const dist = Math.hypot(dx, dy, dz);
        if (dist > 75) continue;
        const dot = (dx * tmpDir.x + dy * tmpDir.y + dz * tmpDir.z) / (dist || 1);
        // ~125 degree field of view, plus close-range awareness
        if (dot < 0.46 && dist > 2.2) continue;
        if (!canSeePlayer(m.world, m.veils, t, pm.x, eyeY, pm.z, q)) continue;
        now.add(q.id);
        const c: Contact = { id: q.id, x: q.move.x, y: q.move.y, z: q.move.z, time: t, seen: true };
        const first = !brain.contacts.get(q.id) || t - brain.contacts.get(q.id)!.time > 4;
        brain.contacts.set(q.id, c);
        if (first) this.radio(brain, p, `Contact ${calloutAt(this.map, q.move.x, q.move.z, q.move.y) || 'close'}.`);
        if (q.hasSpike && brain.side === 'def') {
          if (!brain.spikeSeenAt) this.radio(brain, p, `Spike spotted ${calloutAt(this.map, q.move.x, q.move.z, q.move.y)}.`, true);
          brain.spikeSeenAt = { x: q.move.x, z: q.move.z, time: t };
        }
        const score = dist * (1.3 - dot) - (q.id === bot.target ? 4 : 0);
        if (score < bestScore) {
          bestScore = score;
          best = q.id;
        }
      }
    }
    bot.visible = now;
    if (best >= 0) {
      if (best !== bot.target || !prev.has(best)) {
        // new sighting: reaction delay before the first shot, longer at the edge of vision
        const q = m.players[best];
        const dist = Math.hypot(q.move.x - pm.x, q.move.z - pm.z);
        const wasRecent = bot.lastSeen && bot.lastSeen.id === best && t - bot.lastSeen.time < 1.2;
        // a defender already settled on an angle reacts faster than someone walking into it
        const holding = brain.side === 'def' && m.phase === 'live' && bot.arrived && !!bot.holdSpot && Math.hypot(pm.vx, pm.vz) < 0.5;
        bot.noticeAt = t + bot.cfg.reaction * this.rng.range(0.8, 1.3) * (wasRecent ? 0.45 : 1) * (holding ? 0.45 : 1) + dist * 0.003;
        bot.aimHead = this.rng.chance(bot.cfg.headBias);
        bot.errAt = 0;
        bot.engageAt = t;
      }
      bot.target = best;
      const q = m.players[best];
      bot.lastSeen = { id: best, x: q.move.x, y: q.move.y, z: q.move.z, time: t, seen: true };
    } else if (bot.target >= 0) {
      if (!m.players[bot.target].alive || !bot.lastSeen || t - bot.lastSeen.time > bot.cfg.memory) {
        bot.target = -1;
        if (bot.lastSeen && !m.players[bot.lastSeen.id].alive) bot.lastSeen = null;
      }
    }
    // spot a dropped spike (defenders learn where it is only by seeing it)
    if (brain.side === 'def' && m.spike.state === 'dropped' && !blind) {
      const s = m.spike;
      if (Math.hypot(s.x - pm.x, s.z - pm.z) < 30 && lineOfSight(m.world, m.veils, t, pm.x, eyeY, pm.z, s.x, s.y + 0.2, s.z)) brain.spikeSeenAt = { x: s.x, z: s.z, time: t };
    }
  }

  // ---------------------------------------------------------------- goal selection
  private setRoute(bot: Bot, points: P3[], look: { x: number; z: number } | null, quiet = false): void {
    bot.route = points.slice();
    bot.dest = null;
    bot.path = [];
    bot.arrived = false;
    bot.look = look;
    bot.quiet = quiet;
  }

  private decide(bot: Bot, p: Player, brain: TeamBrain): void {
    const m = this.match;
    const t = m.time;
    const pm = p.move;
    bot.wantPlant = false;
    bot.wantDefuse = false;
    bot.holdSpot = null;
    const offset = (pt: P3, i: number): P3 => ({ x: pt.x + ((i % 3) - 1) * 1.1, y: pt.y, z: pt.z - Math.floor(i / 3) * 1.3 - (i % 2) * 0.4 });

    if (brain.side === 'atk') {
      const site = brain.site!;
      if (m.phase === 'armed') {
        const spot = site.postPlant[(brain.spotOf.get(p.id) ?? 0) % site.postPlant.length];
        const defusing = t - brain.defuseHeard < 2.5;
        if (defusing) {
          if (bot.mode !== 'stopdefuse') {
            bot.mode = 'stopdefuse';
            this.setRoute(bot, [{ x: m.spike.x, y: m.spike.y, z: m.spike.z }], { x: m.spike.x, z: m.spike.z });
            this.tryThrowAt(bot, p, ['thermite', 'frag'], m.spike.x, m.spike.y, m.spike.z, 2.5);
          }
        } else if (bot.mode !== 'post') {
          bot.mode = 'post';
          this.setRoute(bot, [spot], { x: spot.lookX, z: spot.lookZ }, true);
        }
        if (bot.mode === 'post') bot.holdSpot = spot;
        return;
      }
      if (brain.retriever === p.id && m.spike.state === 'dropped') {
        if (bot.mode !== 'retrieve') {
          bot.mode = 'retrieve';
          this.setRoute(bot, [{ x: m.spike.x, y: m.spike.y, z: m.spike.z }], null);
        }
        return;
      }
      const entry = brain.entryOf.get(p.id) ?? site.entries[0];
      if (brain.state === 'stage') {
        if (bot.mode !== 'stage') {
          bot.mode = 'stage';
          this.setRoute(bot, [offset(entry.stage, bot.slot)], entry.path[0]);
        }
        return;
      }
      // execute
      if (p.hasSpike) {
        if (bot.mode !== 'carry') {
          bot.mode = 'carry';
          const spot = site.plantSpots[(p.id + m.round) % site.plantSpots.length];
          this.setRoute(bot, [...entry.path, spot], { x: site.center.x, z: site.center.z });
        }
        bot.wantPlant = m.siteAt(pm.x, pm.z) !== '' && (bot.arrived || bot.route.length === 0);
        // under time pressure plant anywhere inside the vault
        if (m.siteAt(pm.x, pm.z) !== '' && (m.phaseEnd - m.tick) * DT < 12) bot.wantPlant = true;
      } else {
        if (bot.mode !== 'take') {
          bot.mode = 'take';
          const spot = site.postPlant[(brain.spotOf.get(p.id) ?? 0) % site.postPlant.length];
          this.setRoute(bot, [...entry.path, spot], { x: spot.lookX, z: spot.lookZ });
          // open the execute with utility where a throw actually lands
          if (t >= bot.utilAt) {
            const vt = site.veilTargets[bot.slot % site.veilTargets.length];
            if (!this.tryThrowAt(bot, p, ['veil'], vt.x, 0.2, vt.z, 3.2)) {
              const last = entry.path[entry.path.length - 1];
              this.tryThrowAt(bot, p, ['flash'], last.x + (site.center.x - last.x) * 0.5, (last.y ?? 0) + 2.2, last.z + (site.center.z - last.z) * 0.5, 5);
            }
          }
        }
      }
      return;
    }

    // ---------------- defenders
    if (m.phase === 'armed') {
      const sp = m.spike;
      const left = (m.phaseEnd - m.tick) * DT;
      const site = this.map.sites[sp.site || 'A'];
      // two approach groups from defender-side entrances
      const ap = site.retake[(bot.slot + m.round) % 2];
      if (!brain.retakeGo) {
        if (bot.mode !== 'gather') {
          bot.mode = 'gather';
          this.setRoute(bot, [ap], { x: sp.x, z: sp.z });
        }
      } else if (brain.defuser === p.id) {
        if (bot.mode !== 'defuse') {
          bot.mode = 'defuse';
          this.setRoute(bot, [{ x: sp.x, y: sp.y, z: sp.z }], { x: sp.x, z: sp.z });
        }
        bot.wantDefuse = true;
      } else if (bot.mode !== 'retake') {
        bot.mode = 'retake';
        // cover the spike from a few metres out
        const a = this.rng.range(0, Math.PI * 2);
        this.setRoute(bot, [{ x: sp.x + Math.sin(a) * 3.2, y: sp.y, z: sp.z + Math.cos(a) * 3.2 }], { x: sp.x, z: sp.z });
      }
      void left;
      return;
    }
    const hold = brain.holdOf.get(p.id);
    if (!hold) return;
    bot.holdSpot = hold;
    const key = 'hold:' + hold.x + ',' + hold.z;
    if (bot.mode !== key) {
      bot.mode = key;
      this.setRoute(bot, [hold], { x: hold.lookX, z: hold.lookZ });
    }
    // information / denial utility from the hold position
    if (bot.arrived && t >= bot.utilAt && !bot.throwPlan) {
      bot.utilAt = t + this.rng.range(6, 12);
      const c = this.nearestContact(brain, p, 24, 3);
      if (c && !bot.visible.size) this.tryThrowAt(bot, p, ['thermite', 'frag'], c.x, c.y + 0.2, c.z, 3.5);
      else if (!c) this.tryThrowAt(bot, p, ['pulse'], hold.lookX, 0.3, hold.lookZ, 5);
    }
  }

  // ---------------------------------------------------------------- utility throw solver
  /** Finds a throw from the bot's current position that lands near the target. Purely the shared projectile sim. */
  private tryThrowAt(bot: Bot, p: Player, types: UtilityId[], tx: number, ty: number, tz: number, tol: number): boolean {
    const type = types.find((u) => p.util.includes(u));
    if (!type) return false;
    const key = type + Math.round(tx) + ',' + Math.round(tz);
    if (bot.utilTried.has(key)) return false;
    bot.utilTried.add(key);
    const m = this.match;
    const pm = p.move;
    const oy = pm.y + eyeHeight(pm.crouch) - 0.05;
    const dist = Math.hypot(tx - pm.x, tz - pm.z);
    if (dist > 34 || dist < 2.5) return false;
    const yaw = Math.atan2(tx - pm.x, tz - pm.z);
    let best: { pitch: number; lob: boolean; err: number } | null = null;
    for (const lob of [false, true]) {
      for (let deg = -8; deg <= 56; deg += 4) {
        const pitch = (deg * Math.PI) / 180;
        const r = simulateThrow(m.world, type, pm.x + Math.sin(yaw) * 0.35, oy, pm.z + Math.cos(yaw) * 0.35, yaw, pitch, lob, DT * 2, 4, 1000);
        const err = Math.hypot(r.endX - tx, r.endZ - tz) + Math.abs(r.endY - ty) * 0.4;
        if (!best || err < best.err) best = { pitch, lob, err };
      }
    }
    if (!best || best.err > tol) return false;
    bot.throwPlan = { type, yaw, pitch: best.pitch, lob: best.lob, at: m.time };
    return true;
  }

  // ---------------------------------------------------------------- path following
  private followPath(bot: Bot, p: Player): { x: number; z: number } | null {
    const m = this.match;
    const nav = this.nav;
    const pm = p.move;
    const t = m.time;
    if (!bot.dest) {
      if (!bot.route.length) {
        bot.arrived = true;
        return null;
      }
      bot.dest = bot.route[0];
      bot.path = [];
    }
    if (!bot.path.length || t >= bot.repathAt) {
      bot.repathAt = t + 2.5 + (bot.id % 5) * 0.1;
      const a = nav.nearest(pm.x, pm.y, pm.z);
      const g = nav.nearest(bot.dest.x, bot.dest.y ?? 0, bot.dest.z);
      if (!a || !g) {
        bot.route.shift();
        bot.dest = null;
        return null;
      }
      const fires = m.fires;
      const path = nav.findPath(
        a.id,
        g.id,
        fires.length
          ? (n) => {
              for (const f of fires) for (let c = 0; c < f.cells.length; c += 3) if (Math.abs(f.cells[c] - n.x) < 1 && Math.abs(f.cells[c + 2] - n.z) < 1) return 40;
              return 0;
            }
          : undefined,
      );
      if (!path) {
        // unreachable waypoint: drop it and let the next decision pass pick a new goal
        bot.route.shift();
        bot.dest = null;
        if (!bot.route.length) bot.mode = '';
        return null;
      }
      bot.path = path;
      bot.pathIdx = path.length > 1 ? 1 : 0;
    }
    // advance along the path
    let node = nav.nodes[bot.path[bot.pathIdx]];
    while (Math.hypot(node.x - pm.x, node.z - pm.z) < 0.42 && Math.abs(node.y - pm.y) < 1.2) {
      if (bot.pathIdx >= bot.path.length - 1) {
        // reached this waypoint
        bot.route.shift();
        bot.dest = null;
        bot.path = [];
        if (!bot.route.length) bot.arrived = true;
        return null;
      }
      bot.pathIdx++;
      node = nav.nodes[bot.path[bot.pathIdx]];
    }
    // look-ahead smoothing: skip to the farthest directly walkable node
    if ((m.tick + bot.id) % 6 === 0) {
      for (let k = Math.min(bot.path.length - 1, bot.pathIdx + 4); k > bot.pathIdx; k--) {
        const n = nav.nodes[bot.path[k]];
        if (n.crouch || Math.abs(n.y - pm.y) > 0.3) continue;
        let flat = true;
        for (let j = bot.pathIdx; j < k; j++) {
          const a = nav.nodes[bot.path[j]];
          if (a.crouch || a.drops[a.edges.indexOf(bot.path[j + 1])]) flat = false;
        }
        if (flat && pm.onGround && nav.walkable(pm.x, pm.y, pm.z, n.x, n.z)) {
          bot.pathIdx = k;
          node = n;
          break;
        }
      }
    }
    // stuck recovery
    if (t >= bot.stuckAt) {
      if (Math.hypot(pm.x - bot.stuckX, pm.z - bot.stuckZ) < 0.25) {
        bot.jumpAt = t + 0.1;
        bot.path = [];
      }
      bot.stuckAt = t + 1.1;
      bot.stuckX = pm.x;
      bot.stuckZ = pm.z;
    }
    return { x: node.x - pm.x, z: node.z - pm.z };
  }
}
