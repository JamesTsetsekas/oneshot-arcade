// Repeatable activities generated as mission graphs: Courier Runs, Street Circuit, Recovery Calls.
import { Rng, dist2 } from "../../core/math";
import { MISSION_SCHEMA_VERSION, type MissionDef, type MNode, type Pt } from "./runtime";

export type CourierMod = "fragile" | "urgent" | "quiet";
export interface Anchor { x: number; z: number }

export const CIRCUIT_POINTS: Pt[] = [
  { x: 300, z: -100 }, { x: 400, z: -100 }, { x: 400, z: 50 }, { x: 400, z: 200 },
  { x: 300, z: 200 }, { x: 200, z: 200 }, { x: 200, z: 50 }, { x: 200, z: -100 },
];
export const CIRCUIT_START = { x: 205, z: -94, yaw: Math.PI / 2 };
export const GARAGE_DROP = { x: -150, z: -353 };

function graph(nodes: MNode[]) { const o: Record<string, MNode> = {}; for (const n of nodes) o[n.id] = n; return o; }

export function courierPayout(dist: number, mods: CourierMod[]): number {
  let p = 90 + dist * 0.32;
  if (mods.includes("fragile")) p *= 1.25;
  if (mods.includes("urgent")) p *= 1.3;
  if (mods.includes("quiet")) p *= 1.15;
  return Math.round(p / 5) * 5;
}

/** Pair pickup/drop anchors 220–650 m apart with random modifiers. */
export function generateCourier(seed: number, anchors: Anchor[], from: Pt, trust: number): MissionDef {
  const r = new Rng(seed);
  let pick = anchors[0], drop = anchors[1];
  for (let k = 0; k < 400; k++) {
    const a = anchors[r.int(0, anchors.length - 1)];
    if (dist2(a.x, a.z, from.x, from.z) > 260) continue;
    const b = anchors[r.int(0, anchors.length - 1)];
    const d = dist2(a.x, a.z, b.x, b.z);
    if (d < 220 || d > 650) continue;
    pick = a; drop = b; break;
  }
  const dist = dist2(pick.x, pick.z, drop.x, drop.z);
  const mods: CourierMod[] = [];
  if (r.chance(0.45)) mods.push("fragile");
  if (r.chance(0.45)) mods.push("urgent");
  if (trust >= 1 && r.chance(0.3)) mods.push("quiet");
  const pay = courierPayout(dist, mods);
  const timeLimit = mods.includes("urgent") ? Math.round(dist / 11 + 25) : undefined;
  const id = `courier_${seed}`;
  const desc = mods.length ? mods.join(", ") : "standard";
  return {
    schema: MISSION_SCHEMA_VERSION, id, title: `Courier Run (${desc})`, giver: "Quayside Couriers", kind: "courier",
    blurb: `Pickup to drop: ${Math.round(dist)} m.${mods.includes("fragile") ? " Fragile: avoid crashes." : ""}${mods.includes("urgent") ? " Urgent: timed." : ""}${mods.includes("quiet") ? " Quiet: no Alert." : ""}`,
    reward: { cash: pay, trust: 25 }, parTime: dist / 9 + 40, start: "s", rewardKey: id,
    fail: [
      { kind: "playerDead", reason: "You were taken to the clinic." },
      ...(mods.includes("fragile") ? [{ kind: "packageBroken" as const, reason: "The fragile package broke." }] : []),
      ...(mods.includes("quiet") ? [{ kind: "alertAbove" as const, tier: 0, reason: "Quiet job blown — the Wardens noticed you." }] : []),
    ],
    nodes: graph([
      { id: "s", type: "start", next: "w" },
      { id: "w", type: "world", next: "p", set: { packageMods: mods.join(","), packageReset: true } },
      { id: "p", type: "objective", next: "d", obj: { kind: "interact", text: "Collect the package", id: `${id}_p`, x: pick.x, z: pick.z, r: 3, label: "Collect package" } },
      { id: "d", type: "objective", next: "pay", timeLimit, obj: { kind: "interact", text: `Deliver the package (${desc})`, id: `${id}_d`, x: drop.x, z: drop.z, r: 3, label: "Deliver package" } },
      { id: "pay", type: "reward", next: "end", cash: pay, trust: 25 },
      { id: "end", type: "end" },
    ]),
  };
}

export function circuitDef(): MissionDef {
  return {
    schema: MISSION_SCHEMA_VERSION, id: "circuit", title: "Street Circuit: Glassline Loop", giver: "Street Circuit", kind: "circuit",
    blurb: "Three laps around Glassline through live traffic. Hold R to reset at the last checkpoint (+5 s).",
    reward: { cash: 300, trust: 40 }, parTime: 200, start: "s", rewardKey: "circuit:first_finish",
    fail: [{ kind: "playerDead", reason: "You were taken to the clinic." }],
    nodes: graph([
      { id: "s", type: "start", next: "go" },
      { id: "go", type: "objective", next: "cd", obj: { kind: "reach", text: "Drive to the circuit start line (Glassline)", x: CIRCUIT_START.x, z: CIRCUIT_START.z, r: 9, inVehicle: true, stopped: true } },
      { id: "cd", type: "dialogue", next: "race", lines: [{ speaker: "Starter", text: "Three laps. Traffic's live. Three… two… one… GO!", dur: 2.5 }] },
      { id: "race", type: "objective", next: "pay", obj: { kind: "circuit", text: "Street Circuit", points: CIRCUIT_POINTS, laps: 3, r: 13 } },
      { id: "pay", type: "reward", next: "end", cash: 300, trust: 40 },
      { id: "end", type: "end" },
    ]),
  };
}

export function generateRecovery(seed: number, spots: { x: number; z: number; yaw: number }[], from: Pt): { def: MissionDef; spot: { x: number; z: number; yaw: number }; model: string } {
  const r = new Rng(seed);
  let spot = spots[0];
  for (let k = 0; k < 300; k++) {
    const s = spots[r.int(0, spots.length - 1)];
    const d = dist2(s.x, s.z, from.x, from.z);
    if (d > 180 && d < 520 && dist2(s.x, s.z, GARAGE_DROP.x, GARAGE_DROP.z) > 150) { spot = s; break; }
  }
  const model = r.pick(["varro", "osprey", "brava", "pella"]);
  const cx = spot.x + r.range(-45, 45), cz = spot.z + r.range(-45, 45);
  const id = `recovery_${seed}`;
  const def: MissionDef = {
    schema: MISSION_SCHEMA_VERSION, id, title: "Recovery Call", giver: "Breakwater Repair", kind: "recovery",
    blurb: "A reported stolen car is parked somewhere in the search area. Find it (hazard lights) and return it to Breakwater Repair. Condition bonus.",
    reward: { cash: 220, trust: 30 }, parTime: 240, start: "s", rewardKey: id,
    fail: [
      { kind: "playerDead", reason: "You were taken to the clinic." },
      { kind: "vehicleDestroyed", tag: "recovery", reason: "The car was wrecked." },
    ],
    nodes: graph([
      { id: "s", type: "start", next: "sp" },
      { id: "sp", type: "spawn", next: "find", requests: [{ kind: "vehicle", tag: "recovery", model, x: spot.x, z: spot.z, yaw: spot.yaw, ai: "none" }] },
      { id: "find", type: "objective", next: "ret", obj: { kind: "stopVehicle", text: "Search the area for the stolen car (hazards flashing) and get in", tag: "recovery", searchX: cx, searchZ: cz, searchR: 70, revealAt: 28 } },
      { id: "ret", type: "objective", next: "pay", obj: { kind: "deliverVehicle", text: "Return the car to Breakwater Repair", tag: "recovery", x: GARAGE_DROP.x, z: GARAGE_DROP.z, r: 7 } },
      { id: "pay", type: "reward", next: "clean", cash: 220, trust: 30 },
      { id: "clean", type: "cleanup", next: "end" },
      { id: "end", type: "end" },
    ]),
  };
  // "find" completes when the parked (driverless) car is reached — then entering is part of delivering
  return { def, spot, model };
}

/** Recovery payout bonus from returned vehicle condition. */
export function recoveryBonus(health: number) { return Math.round(Math.max(0, health - 40) * 3); }
