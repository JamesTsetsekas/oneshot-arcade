// Original fictional weapon profiles. Values are starting tuning targets.
// Spreads/recoil are in degrees; times in seconds; ranges in metres.

export type FireMode = "auto" | "semi" | "burst" | "pump" | "bolt";
export type WeaponClass = "rifle" | "smg" | "battle" | "shotgun" | "lmg" | "marksman" | "pistol" | "heavyPistol" | "machinePistol";
export type HitZone = "head" | "upper" | "lower" | "limb";

export interface ReloadStages { magOut: number; magIn: number; chamber?: number; total: number }

export interface WeaponDef {
  id: string;
  name: string;
  role: string;
  slot: "primary" | "sidearm";
  cls: WeaponClass;
  rpm: number;
  modes: FireMode[];
  burst?: number;
  pellets: number;
  pelletSpread?: number;
  damage: { near: number; far: number; nearRange: number; farRange: number };
  zones: Record<HitZone, number>;
  /** Marksman: head/upper multipliers only lethal inside this range. */
  lethalRange?: number;
  mag: number;
  reserveMags: number;
  reload: { tactical: ReloadStages; empty: ReloadStages };
  adsTime: number;
  adsZoom: number;
  adsMove: number;
  sprintToFire: number;
  swapTime: number;
  hip: { base: number; move: number; perShot: number; max: number; recover: number };
  ads: { base: number; perShot: number; max: number };
  firstShot: string;
  recoil: { vertical: number; horizontal: number; variance: number; recover: number };
  crouchRecoilMult?: number;
  penetration: number;
  flinch: number;
  botRange: [number, number];
  glint?: boolean;
  unlockLevel: number;
  model: { body: number; barrel: number; stock: number; mag: "box" | "drum" | "tube" | "pistol" | "long"; accent: string; scope?: boolean };
}

const R = (magOut: number, magIn: number, total: number, chamber?: number): ReloadStages => ({ magOut, magIn, total, chamber });

export const WEAPONS: Record<string, WeaponDef> = {
  jackal: {
    id: "jackal", name: "AR-4 Jackal", role: "Balanced rifle", slot: "primary", cls: "rifle",
    rpm: 720, modes: ["auto", "burst"], burst: 3, pellets: 1,
    damage: { near: 28, far: 20, nearRange: 18, farRange: 42 },
    zones: { head: 1.45, upper: 1.1, lower: 1.0, limb: 0.85 },
    mag: 30, reserveMags: 4,
    reload: { tactical: R(0.45, 1.25, 1.85), empty: R(0.45, 1.25, 2.35, 2.05) },
    adsTime: 0.22, adsZoom: 1.35, adsMove: 0.7, sprintToFire: 0.24, swapTime: 0.45,
    hip: { base: 2.2, move: 2.0, perShot: 0.35, max: 6, recover: 9 },
    ads: { base: 0.12, perShot: 0.07, max: 0.9 },
    firstShot: "ADS first shot lands within 0.12°; bloom builds slowly.",
    recoil: { vertical: 0.55, horizontal: 0.16, variance: 0.1, recover: 0.55 },
    penetration: 0.5, flinch: 0.6, botRange: [6, 45], unlockLevel: 1,
    model: { body: 0.42, barrel: 0.3, stock: 0.24, mag: "box", accent: "#3a4148" },
  },
  kestrel: {
    id: "kestrel", name: "M7 Kestrel", role: "High-rate compact", slot: "primary", cls: "smg",
    rpm: 900, modes: ["auto"], pellets: 1,
    damage: { near: 24, far: 14, nearRange: 9, farRange: 26 },
    zones: { head: 1.4, upper: 1.1, lower: 1.0, limb: 0.85 },
    mag: 32, reserveMags: 4,
    reload: { tactical: R(0.35, 1.05, 1.55), empty: R(0.35, 1.05, 2.05, 1.75) },
    adsTime: 0.16, adsZoom: 1.25, adsMove: 0.8, sprintToFire: 0.18, swapTime: 0.35,
    hip: { base: 1.6, move: 1.1, perShot: 0.28, max: 5, recover: 12 },
    ads: { base: 0.3, perShot: 0.12, max: 1.5 },
    firstShot: "Strong hip-fire; first ADS shot drifts up to 0.3°.",
    recoil: { vertical: 0.36, horizontal: 0.36, variance: 0.18, recover: 0.6 },
    penetration: 0.3, flinch: 0.5, botRange: [0, 22], unlockLevel: 1,
    model: { body: 0.32, barrel: 0.16, stock: 0.16, mag: "box", accent: "#2f3a33" },
  },
  mesa: {
    id: "mesa", name: "BR-12 Mesa", role: "Semi-auto battle rifle", slot: "primary", cls: "battle",
    rpm: 360, modes: ["semi"], pellets: 1,
    damage: { near: 44, far: 34, nearRange: 25, farRange: 55 },
    zones: { head: 1.6, upper: 1.15, lower: 1.0, limb: 0.9 },
    mag: 20, reserveMags: 4,
    reload: { tactical: R(0.5, 1.4, 2.1), empty: R(0.5, 1.4, 2.7, 2.35) },
    adsTime: 0.26, adsZoom: 1.6, adsMove: 0.66, sprintToFire: 0.3, swapTime: 0.5,
    hip: { base: 2.8, move: 2.4, perShot: 1.4, max: 7, recover: 8 },
    ads: { base: 0.06, perShot: 0.25, max: 1.0 },
    firstShot: "Pin-point first shot; follow-ups need recoil control.",
    recoil: { vertical: 1.25, horizontal: 0.28, variance: 0.12, recover: 0.7 },
    penetration: 0.7, flinch: 1.0, botRange: [10, 60], unlockLevel: 3,
    model: { body: 0.48, barrel: 0.36, stock: 0.26, mag: "box", accent: "#4a4237" },
  },
  breacher: {
    id: "breacher", name: "SG-8 Breacher", role: "Pump shotgun", slot: "primary", cls: "shotgun",
    rpm: 72, modes: ["pump"], pellets: 8, pelletSpread: 3.6,
    damage: { near: 15, far: 4, nearRange: 6, farRange: 20 },
    zones: { head: 1.2, upper: 1.0, lower: 1.0, limb: 0.9 },
    mag: 6, reserveMags: 4,
    reload: { tactical: R(0.4, 2.0, 2.5), empty: R(0.4, 2.0, 2.95, 2.6) },
    adsTime: 0.2, adsZoom: 1.15, adsMove: 0.72, sprintToFire: 0.22, swapTime: 0.45,
    hip: { base: 1.2, move: 0.6, perShot: 0, max: 2, recover: 10 },
    ads: { base: 0.6, perShot: 0, max: 0.6 },
    firstShot: "Eight-pellet 3.6° pattern; lethal inside ~6 m.",
    recoil: { vertical: 3.2, horizontal: 0.5, variance: 0.2, recover: 0.8 },
    penetration: 0.1, flinch: 0.9, botRange: [0, 10], unlockLevel: 5,
    model: { body: 0.44, barrel: 0.42, stock: 0.26, mag: "tube", accent: "#3b2f2a" },
  },
  anchor: {
    id: "anchor", name: "LMG-60 Anchor", role: "Sustained support weapon", slot: "primary", cls: "lmg",
    rpm: 640, modes: ["auto"], pellets: 1,
    damage: { near: 30, far: 23, nearRange: 22, farRange: 50 },
    zones: { head: 1.4, upper: 1.1, lower: 1.0, limb: 0.85 },
    mag: 60, reserveMags: 2,
    reload: { tactical: R(0.9, 3.0, 4.1), empty: R(0.9, 3.0, 4.9, 4.4) },
    adsTime: 0.32, adsZoom: 1.45, adsMove: 0.58, sprintToFire: 0.33, swapTime: 0.65,
    hip: { base: 3.0, move: 2.6, perShot: 0.4, max: 7.5, recover: 7 },
    ads: { base: 0.18, perShot: 0.06, max: 1.1 },
    firstShot: "Slow to settle; very stable sustained fire, steadier when crouched.",
    recoil: { vertical: 0.5, horizontal: 0.22, variance: 0.12, recover: 0.5 },
    crouchRecoilMult: 0.6,
    penetration: 0.8, flinch: 0.7, botRange: [8, 50], unlockLevel: 9,
    model: { body: 0.52, barrel: 0.38, stock: 0.26, mag: "drum", accent: "#383d33" },
  },
  warden: {
    id: "warden", name: "MR-1 Warden", role: "Bolt-action marksman", slot: "primary", cls: "marksman",
    rpm: 48, modes: ["bolt"], pellets: 1,
    damage: { near: 98, far: 80, nearRange: 45, farRange: 90 },
    zones: { head: 2.0, upper: 1.3, lower: 1.0, limb: 0.8 },
    lethalRange: 45,
    mag: 5, reserveMags: 4,
    reload: { tactical: R(0.5, 1.7, 2.6), empty: R(0.5, 1.7, 3.3, 2.9) },
    adsTime: 0.32, adsZoom: 4.0, adsMove: 0.6, sprintToFire: 0.33, swapTime: 0.6,
    hip: { base: 6.0, move: 3.0, perShot: 2, max: 9, recover: 6 },
    ads: { base: 0.02, perShot: 0, max: 0.02 },
    firstShot: "Scoped shots are exact; head/upper torso lethal inside 45 m. Scope glints.",
    recoil: { vertical: 3.5, horizontal: 0.4, variance: 0.15, recover: 0.75 },
    penetration: 0.9, flinch: 1.2, botRange: [15, 90], glint: true, unlockLevel: 12,
    model: { body: 0.5, barrel: 0.5, stock: 0.3, mag: "long", accent: "#2d3238", scope: true },
  },
  relay: {
    id: "relay", name: "P9 Relay", role: "Quick semi-auto pistol", slot: "sidearm", cls: "pistol",
    rpm: 400, modes: ["semi"], pellets: 1,
    damage: { near: 26, far: 16, nearRange: 10, farRange: 28 },
    zones: { head: 1.4, upper: 1.05, lower: 1.0, limb: 0.85 },
    mag: 14, reserveMags: 4,
    reload: { tactical: R(0.3, 0.95, 1.3), empty: R(0.3, 0.95, 1.6, 1.4) },
    adsTime: 0.14, adsZoom: 1.2, adsMove: 0.86, sprintToFire: 0.14, swapTime: 0.25,
    hip: { base: 1.8, move: 0.8, perShot: 0.6, max: 4.5, recover: 14 },
    ads: { base: 0.25, perShot: 0.15, max: 1.2 },
    firstShot: "Accurate first shot from the hip at close range.",
    recoil: { vertical: 0.7, horizontal: 0.22, variance: 0.15, recover: 0.7 },
    penetration: 0.25, flinch: 0.5, botRange: [0, 20], unlockLevel: 1,
    model: { body: 0.2, barrel: 0.02, stock: 0, mag: "pistol", accent: "#2a2e33" },
  },
  rook: {
    id: "rook", name: "H3 Rook", role: "Heavy pistol with reach", slot: "sidearm", cls: "heavyPistol",
    rpm: 210, modes: ["semi"], pellets: 1,
    damage: { near: 46, far: 34, nearRange: 16, farRange: 40 },
    zones: { head: 1.5, upper: 1.05, lower: 1.0, limb: 0.85 },
    mag: 7, reserveMags: 5,
    reload: { tactical: R(0.35, 1.15, 1.6), empty: R(0.35, 1.15, 2.0, 1.75) },
    adsTime: 0.18, adsZoom: 1.3, adsMove: 0.84, sprintToFire: 0.17, swapTime: 0.3,
    hip: { base: 2.2, move: 1.0, perShot: 1.4, max: 5.5, recover: 10 },
    ads: { base: 0.12, perShot: 0.3, max: 1.3 },
    firstShot: "Precise first shot; heavy kick between shots.",
    recoil: { vertical: 1.6, horizontal: 0.35, variance: 0.15, recover: 0.7 },
    penetration: 0.45, flinch: 0.8, botRange: [0, 30], unlockLevel: 7,
    model: { body: 0.24, barrel: 0.06, stock: 0, mag: "pistol", accent: "#3b3530" },
  },
  cinder: {
    id: "cinder", name: "Cinder Auto", role: "Machine pistol", slot: "sidearm", cls: "machinePistol",
    rpm: 1100, modes: ["auto", "semi"], pellets: 1,
    damage: { near: 18, far: 9, nearRange: 7, farRange: 18 },
    zones: { head: 1.35, upper: 1.05, lower: 1.0, limb: 0.85 },
    mag: 18, reserveMags: 4,
    reload: { tactical: R(0.3, 1.05, 1.45), empty: R(0.3, 1.05, 1.85, 1.6) },
    adsTime: 0.15, adsZoom: 1.15, adsMove: 0.86, sprintToFire: 0.15, swapTime: 0.27,
    hip: { base: 2.2, move: 0.9, perShot: 0.45, max: 6.5, recover: 13 },
    ads: { base: 0.5, perShot: 0.22, max: 2.2 },
    firstShot: "Severe climb and side-sway; burst it.",
    recoil: { vertical: 0.55, horizontal: 0.55, variance: 0.3, recover: 0.45 },
    penetration: 0.2, flinch: 0.5, botRange: [0, 14], unlockLevel: 14,
    model: { body: 0.22, barrel: 0.03, stock: 0, mag: "pistol", accent: "#3e2a24" },
  },
};

export const PRIMARY_IDS = ["jackal", "kestrel", "mesa", "breacher", "anchor", "warden"];
export const SIDEARM_IDS = ["relay", "rook", "cinder"];

/** Deterministic recoil climb pattern (pitch up = negative pitch in view convention). */
export function recoilPatternKick(def: WeaponDef, shotIndex: number): { pitch: number; yaw: number } {
  const i = shotIndex;
  const ramp = 1 + 0.25 * Math.min(i, 10) / 10;
  const pitch = def.recoil.vertical * ramp;
  // Lateral sway: deterministic, weapon-specific phase, rises with sustained fire.
  const phase = def.id.length * 0.7;
  const sway = Math.sin(i * 0.85 + phase) * 0.7 + Math.sin(i * 0.37 + phase * 2) * 0.3;
  const yaw = def.recoil.horizontal * sway * Math.min(1, 0.35 + i * 0.12);
  return { pitch, yaw };
}

/** Linear damage falloff between near and far ranges. */
export function damageAtRange(def: WeaponDef, dist: number, rangeMult = 1): number {
  const near = def.damage.nearRange * rangeMult;
  const far = def.damage.farRange * rangeMult;
  if (dist <= near) return def.damage.near;
  if (dist >= far) return def.damage.far;
  const t = (dist - near) / (far - near);
  return def.damage.near + (def.damage.far - def.damage.near) * t;
}

export function zoneMultiplier(def: WeaponDef, zone: HitZone, dist: number): number {
  if (def.lethalRange !== undefined && dist > def.lethalRange) {
    if (zone === "head") return 1.0;
    if (zone === "upper") return 1.0;
  }
  return def.zones[zone];
}
