// Fare candidates and distribution. Keeps >= 5 reachable candidates around the player with a mix of
// short/medium/long trips, avoiding recent destinations and pickup clustering.

import { dist } from "../math";
import { Rng } from "../rng";
import { parTime, tierForLength, type FareTier } from "../score/score";
import type { World } from "../world/city";
import type { Destination, PickupSpot } from "../world/types";
import { ARCHETYPES } from "./archetypes";

export type SpecialCond = "noCollision" | "shortcut" | "air";
export const SPECIAL_LABEL: Record<SpecialCond, string> = {
  noCollision: "VIP: zero bumps",
  shortcut: "VIP: take a shortcut",
  air: "VIP: catch big air",
};

export interface Fare {
  id: number;
  archetype: number;
  pickup: PickupSpot;
  dest: Destination;
  tier: FareTier;
  routeLen: number;
  par: number;
  special: SpecialCond | null;
}

export const TIER_LEN: Record<Exclude<FareTier, "special">, [number, number]> = {
  short: [180, 430],
  medium: [430, 880],
  long: [880, 1900],
};

export class FareManager {
  candidates: Fare[] = [];
  recentDest: number[] = [];
  private nextId = 1;
  private rng: Rng;
  private archBag: number[] = [];

  constructor(private world: World, seed: number) {
    this.rng = new Rng(seed ^ 0xfa4e);
  }

  private nextArchetype(): number {
    if (this.archBag.length === 0) {
      this.archBag = ARCHETYPES.map((a) => a.id);
      for (let i = this.archBag.length - 1; i > 0; i--) {
        const j = this.rng.int(0, i + 1);
        [this.archBag[i], this.archBag[j]] = [this.archBag[j], this.archBag[i]];
      }
    }
    return this.archBag.pop()!;
  }

  makeFare(pickup: PickupSpot, dest: Destination, special: SpecialCond | null = null, archetype?: number): Fare {
    const r = this.world.route(pickup.x, pickup.z, dest.x, dest.z);
    const tier: FareTier = special ? "special" : tierForLength(r.length);
    return {
      id: this.nextId++, archetype: archetype ?? this.nextArchetype(), pickup, dest, tier, routeLen: r.length,
      par: parTime(r.length, tier), special,
    };
  }

  /** Try to create a candidate of the wanted tier near the player. */
  spawn(px: number, pz: number, want: Exclude<FareTier, "special">, special: SpecialCond | null = null, avoid: number[] = []): Fare | null {
    const spots = this.world.pickups;
    for (let attempt = 0; attempt < 40; attempt++) {
      const p = spots[this.rng.int(0, spots.length)];
      const d = dist(p.x, p.z, px, pz);
      if (d < 35 || d > 480) continue;
      if (this.candidates.some((c) => dist(c.pickup.x, c.pickup.z, p.x, p.z) < 60)) continue;
      // destination with route length in the tier band
      const [lo, hi] = TIER_LEN[want];
      for (let k = 0; k < 10; k++) {
        const dest = this.world.destinations[this.rng.int(0, this.world.destinations.length)];
        if (this.recentDest.includes(dest.id) || avoid.includes(dest.id)) continue;
        if (this.candidates.some((c) => c.dest.id === dest.id)) continue;
        const crow = dist(p.x, p.z, dest.x, dest.z);
        if (crow > hi || crow < lo * 0.45) continue;
        if ((want === "medium" || want === "long") && dest.district === p.district && this.rng.chance(0.6)) continue;
        const fare = this.makeFare(p, dest, special);
        if (fare.routeLen < lo || fare.routeLen > hi) {
          this.nextId--;
          continue;
        }
        return fare;
      }
    }
    return null;
  }

  /** Keep the candidate pool topped up and distributed. */
  maintain(px: number, pz: number, specialWanted: SpecialCond | null) {
    this.candidates = this.candidates.filter((c) => dist(c.pickup.x, c.pickup.z, px, pz) < 620);
    const count = (t: FareTier) => this.candidates.filter((c) => c.tier === t).length;
    const wants: Exclude<FareTier, "special">[] = [];
    if (count("short") < 2) wants.push("short", "short");
    if (count("medium") < 2) wants.push("medium", "medium");
    if (count("long") < 1) wants.push("long");
    for (const w of wants) {
      if (this.candidates.length >= 6) break;
      const f = this.spawn(px, pz, w);
      if (f) this.candidates.push(f);
    }
    while (this.candidates.length < 5) {
      const f = this.spawn(px, pz, this.rng.pick(["short", "medium", "medium", "long"] as const));
      if (!f) break;
      this.candidates.push(f);
    }
    if (specialWanted && !this.candidates.some((c) => c.special)) {
      const f = this.spawn(px, pz, "medium", specialWanted) ?? this.spawn(px, pz, "long", specialWanted);
      if (f) this.candidates.push(f);
    }
  }

  take(id: number): Fare | null {
    const i = this.candidates.findIndex((c) => c.id === id);
    if (i < 0) return null;
    const [f] = this.candidates.splice(i, 1);
    this.recentDest.push(f.dest.id);
    if (this.recentDest.length > 5) this.recentDest.shift();
    return f;
  }
}

/** Deterministic Time Trial chains: 3 fares each from a fixed seed. */
export interface TrialDef {
  id: number;
  name: string;
  hub: number;
  seed: number;
}

export const TRIALS: TrialDef[] = [
  { id: 0, name: "Harbor Hustle", hub: 0, seed: 101 },
  { id: 1, name: "Crown Circuit", hub: 1, seed: 202 },
  { id: 2, name: "Old Steps Scramble", hub: 2, seed: 303 },
  { id: 3, name: "Lantern Lights", hub: 1, seed: 404 },
  { id: 4, name: "Sunward Sprint", hub: 0, seed: 505 },
  { id: 5, name: "Grand Tour", hub: 2, seed: 606 },
];

export function buildTrialChain(world: World, t: TrialDef): Fare[] {
  const fm = new FareManager(world, t.seed);
  const chain: Fare[] = [];
  let px = world.hubs[t.hub].x, pz = world.hubs[t.hub].z;
  const tiers: Exclude<FareTier, "special">[] = t.id === 5 ? ["long", "medium", "long"] : ["short", "medium", "medium"];
  for (const tier of tiers) {
    let f: Fare | null = null;
    for (let i = 0; i < 6 && !f; i++) f = fm.spawn(px, pz, tier, null, chain.map((c) => c.dest.id));
    if (!f) f = fm.spawn(px, pz, "medium")!;
    chain.push(f);
    fm.recentDest.push(f.dest.id);
    px = f.dest.x;
    pz = f.dest.z;
  }
  return chain;
}

/** Medal thresholds (seconds) from total legal route length incl. drives to each pickup. */
export function trialMedals(world: World, t: TrialDef, chain: Fare[]): { gold: number; silver: number; bronze: number } {
  let len = 0;
  let px = world.hubs[t.hub].x, pz = world.hubs[t.hub].z;
  for (const f of chain) {
    len += world.route(px, pz, f.pickup.x, f.pickup.z).length + f.routeLen;
    px = f.dest.x;
    pz = f.dest.z;
  }
  return { gold: Math.round(len / 21.5 + 6), silver: Math.round(len / 17.5 + 8), bronze: Math.round(len / 14 + 10) };
}
