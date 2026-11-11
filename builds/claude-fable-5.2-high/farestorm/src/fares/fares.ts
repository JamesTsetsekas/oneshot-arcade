// Passenger candidates, pickup, patience, delivery grading and payout.
import { WorldModel, Site } from '../world/model';
import { Rng, clamp } from '../core/math';
import { ARCHETYPES, Archetype, BARKS, BarkKind } from './passengers';
import { StyleCat } from '../score/pulse';

export const FARE_RULES_VERSION = 2;
export type Tier = 'short' | 'medium' | 'long' | 'special';
export interface TierInfo {
  label: string;
  shape: string;
  color: string;
  minDist: number;
  maxDist: number;
  timeBonus: number;
  weight: number;
}
export const TIERS: Record<Tier, TierInfo> = {
  short: { label: 'Short hop', shape: 'circle', color: '#3ddc84', minDist: 280, maxDist: 580, timeBonus: 1, weight: 0.45 },
  medium: { label: 'Cross-town', shape: 'diamond', color: '#ffb300', minDist: 580, maxDist: 980, timeBonus: 2, weight: 0.35 },
  long: { label: 'Long haul', shape: 'star', color: '#ff3dbb', minDist: 980, maxDist: 1500, timeBonus: 3, weight: 0.2 },
  special: { label: 'Storm Express', shape: 'hexagon', color: '#22d3ee', minDist: 800, maxDist: 1500, timeBonus: 3, weight: 0 },
};
export const PICKUP_RADIUS = 7.5;
export const PICKUP_CLEAN_RADIUS = 3.5;
export const PICKUP_STOP_SPEED = 5 / 3.6;
export const PICKUP_ENTRY_SPEED = 35 / 3.6;
export const DROP_RADIUS = 9.5;
export const DROP_STOP_SPEED = 8 / 3.6;
export const PERSONAL_GRACE = 2;
export const BOARD_TIME = 1.0;
export const UNLOAD_TIME = 0.8;

export type Grade = 'Blazing' | 'Fast' | 'Close' | 'Late';
export function gradeFor(fracLeft: number): Grade {
  if (fracLeft >= 0.25) return 'Blazing';
  if (fracLeft >= 0.1) return 'Fast';
  if (fracLeft > 0) return 'Close';
  return 'Late';
}
const GRADE_TIME: Record<Grade, number> = { Blazing: 3, Fast: 2, Close: 1, Late: 0 };
const GRADE_BONUS: Record<Grade, number> = { Blazing: 0.5, Fast: 0.25, Close: 0.1, Late: 0 };
/** Shift-clock seconds awarded on delivery: grade base + distance tier bonus, capped. */
export function shiftTimeAward(grade: Grade, tier: Tier, dist: number): number {
  const tierBonus = dist < 150 ? 0 : TIERS[tier].timeBonus;
  return Math.min(6, GRADE_TIME[grade] + tierBonus);
}
export function parTime(dist: number, trafficFactor = 1): number {
  return (6 + dist / 20) * trafficFactor;
}
export function baseFare(dist: number, tier: Tier): number {
  return Math.round((120 + dist * 1.15) * (tier === 'special' ? 2 : 1));
}
export function tierForDist(dist: number): Tier {
  return dist < TIERS.short.maxDist ? 'short' : dist < TIERS.medium.maxDist ? 'medium' : 'long';
}
/** Fraction of par time advanced onto the Shift Clock at pickup (documented deviation, see report). */
export function pickupAdvanceFactor(deliveries: number): number {
  return Math.max(0.46, 0.74 - 0.012 * deliveries);
}

export interface Candidate {
  id: number;
  site: number;
  dest: number;
  tier: Tier;
  dist: number;
  par: number;
  fare: number;
  who: number;
  age: number;
  ttl: number;
}
export interface DeliveryBreakdown {
  grade: Grade;
  base: number;
  timeBonus: number;
  tips: number;
  accuracy: number;
  discovery: number;
  prefBonus: number;
  total: number;
  timeAward: number;
  fracLeft: number;
  tier: Tier;
  dest: string;
  who: string;
  dist: number;
  precision: boolean;
}
export type FareEvent =
  | { type: 'pickup'; cand: Candidate; clean: boolean }
  | { type: 'boarded'; cand: Candidate }
  | { type: 'delivered'; cand: Candidate; result: DeliveryBreakdown }
  | { type: 'unloaded' }
  | { type: 'failed'; cand: Candidate }
  | { type: 'bark'; who: string; text: string; voice: number };

export type FareState = 'seeking' | 'boarding' | 'carrying' | 'unloading';

export interface FareOptions {
  trafficFactor: number;
  chain?: [number, number][];
  targetCandidates?: number;
}

export class FareSystem {
  candidates: Candidate[] = [];
  state: FareState = 'seeking';
  current: Candidate | null = null;
  patience = 0;
  timer = 0;
  tripTips = 0;
  tripCollisions = 0;
  tripDiscoveries = 0;
  tripDriven = 0;
  tripSights = new Set<number>();
  deliveries = 0;
  failures = 0;
  chainIndex = 0;
  chainDone = false;
  inDropZone = false;
  events: FareEvent[] = [];
  totalParDist = 0;
  totalDriven = 0;
  private nextId = 1;
  private recentSites: number[] = [];
  private recentDests: number[] = [];
  private barkCooldown = 0;
  private urgentSaid = false;
  private specialQueued = false;
  private entrySpeed = new Map<number, number>();
  private lastDeliverySite = -1;

  constructor(private model: WorldModel, private rng: Rng, private opts: FareOptions) {}

  get frozen(): boolean {
    return this.state === 'boarding' || this.state === 'unloading';
  }
  get passenger(): Archetype | null {
    return this.current ? ARCHETYPES[this.current.who] : null;
  }
  get patienceFrac(): number {
    return this.current ? clamp(this.patience / this.current.par, 0, 1) : 0;
  }
  siteLoc(id: number): { edge: number; t: number } {
    const s = this.model.sites[id];
    return { edge: s.edge, t: s.t };
  }
  queueSpecial(): void {
    this.specialQueued = true;
  }

  private bark(kind: BarkKind, force = false): void {
    const p = this.passenger;
    if (!p || (this.barkCooldown > 0 && !force)) return;
    const lines = BARKS[p.pref][kind];
    this.events.push({ type: 'bark', who: p.name, text: lines[this.rng.int(lines.length)], voice: p.voice });
    this.barkCooldown = 3.5;
  }

  /** Create one candidate using the distribution rules. */
  private spawn(playerLoc: { edge: number; t: number }, px: number, pz: number): boolean {
    const m = this.model;
    if (this.opts.chain) {
      if (this.candidates.length > 0 || this.state !== 'seeking' || this.chainIndex >= this.opts.chain.length) return false;
      const [site, dest] = this.opts.chain[this.chainIndex];
      const dist = m.route(this.siteLoc(site), this.siteLoc(dest)).dist;
      const tier = tierForDist(dist);
      this.candidates.push({ id: this.nextId++, site, dest, tier, dist, par: parTime(dist, this.opts.trafficFactor), fare: baseFare(dist, tier), who: (site * 7 + dest * 3) % ARCHETYPES.length, age: 0, ttl: Infinity });
      return true;
    }
    const used = new Set(this.candidates.map((c) => c.site));
    const nearCount = this.candidates.filter((c) => m.route(playerLoc, this.siteLoc(c.site)).dist < 450).length;
    const options: { site: Site; d: number; w: number }[] = [];
    for (const s of m.sites) {
      if (used.has(s.id) || this.recentSites.includes(s.id) || s.id === this.current?.dest || s.id === this.lastDeliverySite) continue;
      if (Math.hypot(s.x - px, s.z - pz) < 60) continue;
      const d = m.route(playerLoc, { edge: s.edge, t: s.t }).dist;
      if (nearCount < 3 && d > 450) continue;
      options.push({ site: s, d, w: 1 / (1 + Math.abs(d - 260) / 220) });
    }
    if (options.length === 0) return false;
    let r = this.rng.next() * options.reduce((a, o) => a + o.w, 0);
    let pick = options[0];
    for (const o of options) { r -= o.w; if (r <= 0) { pick = o; break; } }
    const site = pick.site;
    // Tier, then a destination whose legal route length fits the band.
    let tier: Tier;
    if (this.specialQueued) { tier = 'special'; this.specialQueued = false; } else {
      const x = this.rng.next();
      tier = x < TIERS.short.weight ? 'short' : x < TIERS.short.weight + TIERS.medium.weight ? 'medium' : 'long';
    }
    const order: Tier[] = tier === 'special' ? ['special', 'long', 'medium', 'short'] : tier === 'short' ? ['short', 'medium', 'long'] : tier === 'medium' ? ['medium', 'short', 'long'] : ['long', 'medium', 'short'];
    for (const t of order) {
      const info = TIERS[t];
      const dests: { id: number; dist: number }[] = [];
      for (const d of m.sites) {
        if (d.id === site.id || this.recentDests.includes(d.id)) continue;
        const dist = m.route({ edge: site.edge, t: site.t }, { edge: d.edge, t: d.t }).dist;
        if (dist >= info.minDist && dist < info.maxDist) dests.push({ id: d.id, dist });
      }
      if (dests.length === 0) continue;
      const dest = this.rng.pick(dests);
      const busy = new Set(this.candidates.map((c) => c.who));
      if (this.current) busy.add(this.current.who);
      let who = this.rng.int(ARCHETYPES.length);
      for (let k = 0; k < ARCHETYPES.length && busy.has(who); k++) who = (who + 1) % ARCHETYPES.length;
      const par = parTime(dest.dist, this.opts.trafficFactor) * (t === 'special' ? 0.88 : 1);
      this.candidates.push({ id: this.nextId++, site: site.id, dest: dest.id, tier: t, dist: dest.dist, par, fare: baseFare(dest.dist, t), who, age: 0, ttl: this.rng.range(50, 80) });
      return true;
    }
    return false;
  }

  /** Apply passenger preferences to a style award; returns the tip actually banked for this trip. */
  addStyle(cat: StyleCat, total: number, mult: number): number {
    if (this.state !== 'carrying' || !this.current) return 0;
    const p = ARCHETYPES[this.current.who];
    let tip = total;
    if (p.pref === 'thrill' && (cat === 'drift' || cat === 'air' || cat === 'nearMiss' || cat === 'thread')) tip *= 1.5;
    if (p.pref === 'musician' && mult >= 3) tip *= 1.3;
    if (p.pref === 'tourist' && cat === 'sightsee') tip *= 2;
    tip = Math.round(tip);
    this.tripTips += tip;
    if (cat === 'drift' || cat === 'air' || cat === 'thread' || cat === 'shortcut') this.bark('stunt');
    else if (cat === 'sightsee') this.bark('sight');
    return tip;
  }
  onCollision(hard: boolean): void {
    if (this.state !== 'carrying' || !this.current) return;
    this.tripCollisions++;
    if (ARCHETYPES[this.current.who].pref === 'fragile') this.tripTips = Math.max(0, this.tripTips - (hard ? 250 : 120));
    this.bark('collision');
  }
  onDiscovery(): void {
    if (this.state === 'carrying') this.tripDiscoveries++;
  }

  update(dt: number, taxi: { x: number; y: number; z: number; speed: number }, playerLoc: { edge: number; t: number }, canSpawn: boolean): void {
    const m = this.model;
    this.barkCooldown = Math.max(0, this.barkCooldown - dt);
    // Candidate upkeep.
    for (let i = this.candidates.length - 1; i >= 0; i--) {
      const c = this.candidates[i];
      c.age += dt;
      const s = m.sites[c.site];
      if (c.age > c.ttl && Math.hypot(s.x - taxi.x, s.z - taxi.z) > 70) {
        this.candidates.splice(i, 1);
        this.recentSites.push(c.site);
        if (this.recentSites.length > 4) this.recentSites.shift();
      }
    }
    if (canSpawn) {
      const target = this.opts.targetCandidates ?? 7;
      let guard = 0;
      while (this.candidates.length < target && guard++ < 3) if (!this.spawn(playerLoc, taxi.x, taxi.z)) break;
    }
    if (this.opts.chain && this.chainIndex >= this.opts.chain.length && this.state === 'seeking') this.chainDone = true;

    if (this.state === 'seeking') {
      for (const c of this.candidates) {
        const s = m.sites[c.site];
        const d = Math.hypot(s.x - taxi.x, s.z - taxi.z);
        if (d < PICKUP_RADIUS + 1.5 && Math.abs(s.y - taxi.y) < 5) {
          if (!this.entrySpeed.has(c.id)) this.entrySpeed.set(c.id, taxi.speed);
          if (d < PICKUP_RADIUS && taxi.speed < PICKUP_STOP_SPEED) {
            const clean = d <= PICKUP_CLEAN_RADIUS && (this.entrySpeed.get(c.id) ?? 99) <= PICKUP_ENTRY_SPEED;
            this.candidates.splice(this.candidates.indexOf(c), 1);
            this.current = c;
            this.state = 'boarding';
            this.timer = BOARD_TIME;
            this.patience = c.par * (clean ? 1 : 0.96);
            this.tripTips = 0; this.tripCollisions = 0; this.tripDiscoveries = 0; this.tripDriven = 0; this.tripSights.clear();
            this.urgentSaid = false;
            this.entrySpeed.clear();
            this.recentSites.push(c.site);
            if (this.recentSites.length > 4) this.recentSites.shift();
            const p = ARCHETYPES[c.who];
            this.events.push({ type: 'pickup', cand: c, clean });
            this.events.push({ type: 'bark', who: p.name, text: p.greet, voice: p.voice });
            this.barkCooldown = 3.5;
            break;
          }
        } else this.entrySpeed.delete(c.id);
      }
      return;
    }
    const c = this.current!;
    if (this.state === 'boarding') {
      this.timer -= dt;
      if (this.timer <= 0) { this.state = 'carrying'; this.events.push({ type: 'boarded', cand: c }); }
      return;
    }
    if (this.state === 'unloading') {
      this.timer -= dt;
      if (this.timer <= 0) { this.state = 'seeking'; this.current = null; this.events.push({ type: 'unloaded' }); }
      return;
    }
    // Carrying.
    this.patience -= dt;
    this.tripDriven += taxi.speed * dt;
    const dest = m.sites[c.dest];
    const d = Math.hypot(dest.x - taxi.x, dest.z - taxi.z);
    this.inDropZone = d < DROP_RADIUS && Math.abs(dest.y - taxi.y) < 5;
    if (!this.urgentSaid && this.patience < c.par * 0.2 && this.patience > 0) { this.urgentSaid = true; this.bark('urgent', true); }
    if (this.inDropZone && taxi.speed < DROP_STOP_SPEED) {
      this.deliver(c, d);
      return;
    }
    if (this.patience < -PERSONAL_GRACE) {
      this.bark('fail', true);
      this.events.push({ type: 'failed', cand: c });
      this.failures++;
      this.state = 'seeking';
      this.current = null;
      this.inDropZone = false;
      if (this.opts.chain) this.chainIndex++;
    }
  }

  private deliver(c: Candidate, d: number): void {
    const p = ARCHETYPES[c.who];
    const frac = clamp(this.patience / c.par, 0, 1);
    const grade = gradeFor(this.patience > 0 ? Math.max(frac, 1e-6) : 0);
    let timeBonus = Math.round(c.fare * GRADE_BONUS[grade]);
    let prefBonus = 0;
    if (p.pref === 'rusher') { prefBonus += Math.round(timeBonus * 0.5); }
    if (p.pref === 'fragile' && this.tripCollisions === 0) prefBonus += 300;
    const precision = d <= 2.5;
    const accuracy = precision ? 150 : d <= 5 ? 60 : 0;
    const discovery = this.tripDiscoveries * 300;
    const total = c.fare + timeBonus + this.tripTips + accuracy + discovery + prefBonus;
    const timeAward = shiftTimeAward(grade, c.tier, c.dist);
    this.deliveries++;
    this.totalParDist += c.dist;
    this.totalDriven += Math.max(this.tripDriven, 1);
    this.lastDeliverySite = c.dest;
    this.recentDests.push(c.dest);
    if (this.recentDests.length > 3) this.recentDests.shift();
    this.state = 'unloading';
    this.timer = UNLOAD_TIME;
    this.inDropZone = false;
    if (this.opts.chain) this.chainIndex++;
    this.bark(grade === 'Late' ? 'late' : 'arrive', true);
    this.events.push({
      type: 'delivered', cand: c,
      result: { grade, base: c.fare, timeBonus, tips: this.tripTips, accuracy, discovery, prefBonus, total, timeAward, fracLeft: frac, tier: c.tier, dest: this.model.sites[c.dest].name, who: p.name, dist: c.dist, precision },
    });
  }

  /** Route efficiency: legal par distance divided by distance actually driven with passengers. */
  get efficiency(): number {
    return this.totalDriven > 0 ? clamp(this.totalParDist / this.totalDriven, 0, 1.5) : 0;
  }
  drainEvents(): FareEvent[] {
    const e = this.events;
    this.events = [];
    return e;
  }
}
