// "content-data": original weapon profiles (fictional designations). All numbers are data-driven tuning targets.

export type WeaponClass = "rifle" | "smg" | "battle" | "shotgun" | "lmg" | "marksman" | "pistol" | "machinepistol";
export type FireMode = "auto" | "semi" | "pump" | "bolt";

export interface RecoilSpec {
  pitchPerShot: number; // degrees of climb per shot
  yawAmp: number; // degrees of lateral drift amplitude
  yawFreq: number;
  variance: number; // seeded random extra, degrees
  recoverDelay: number; // seconds after last shot before recovery begins
  recoverRate: number; // degrees / second
  viewKick: number; // decorative camera kick, degrees
  seed: number;
}

export interface WeaponDef {
  id: string;
  name: string;
  designation: string;
  blurb: string;
  slot: "primary" | "secondary";
  cls: WeaponClass;
  fireMode: FireMode;
  rpm: number;
  damage: number; // per pellet
  pellets: number;
  falloffStart: number;
  falloffEnd: number;
  minDamageMul: number;
  zoneMul: { head: number; upper: number; lower: number; limb: number };
  lethalRange?: number; // marksman: head/upper lethal inside this range
  magSize: number;
  reserveMags: number;
  reloadTactical: number;
  reloadEmpty: number;
  shellReload?: number; // pump reload per shell
  swapTime: number;
  adsTime: number;
  adsFovMul: number; // fov multiplier when aimed
  adsMoveMul: number;
  moveMul: number;
  sprintOut: number;
  hipSpread: number; // degrees
  hipSpreadMove: number;
  adsSpread: number;
  crouchSpreadMul: number;
  bloomPerShot: number;
  bloomMax: number;
  bloomRecover: number;
  firstShotAccurate: boolean;
  pelletSpread?: number;
  recoil: RecoilSpec;
  penetration: number; // metres of thin material energy
  loudness: number; // audio radius metres
  tracerEvery: number;
  look: { len: number; barrel: number; stock: number; mag: "box" | "drum" | "tube" | "pistol"; accent: string; scope: boolean; height: number; hand: "rifle" | "pistol" };
  audio: { pitch: number; punch: number; crack: number; decay: number };
  mastery: string[];
}

const W: WeaponDef[] = [
  {
    id: "ar4", name: "Jackal", designation: "AR-4", slot: "primary", cls: "rifle", fireMode: "auto",
    blurb: "Balanced rifle with a controllable vertical climb and medium falloff.",
    rpm: 720, damage: 26, pellets: 1, falloffStart: 18, falloffEnd: 46, minDamageMul: 0.72,
    zoneMul: { head: 1.6, upper: 1, lower: 0.9, limb: 0.8 }, magSize: 30, reserveMags: 4,
    reloadTactical: 2.1, reloadEmpty: 2.7, swapTime: 0.4, adsTime: 0.2, adsFovMul: 0.78, adsMoveMul: 0.7, moveMul: 1.0,
    sprintOut: 0.22, hipSpread: 2.4, hipSpreadMove: 1.6, adsSpread: 0.18, crouchSpreadMul: 0.75, bloomPerShot: 0.22,
    bloomMax: 2.2, bloomRecover: 5, firstShotAccurate: true,
    recoil: { pitchPerShot: 0.62, yawAmp: 0.2, yawFreq: 0.55, variance: 0.06, recoverDelay: 0.14, recoverRate: 11, viewKick: 0.5, seed: 4 },
    penetration: 0.35, loudness: 55, tracerEvery: 3,
    look: { len: 0.82, barrel: 0.28, stock: 0.22, mag: "box", accent: "#e8761c", scope: false, height: 0.11, hand: "rifle" },
    audio: { pitch: 1, punch: 0.9, crack: 0.8, decay: 0.28 }, mastery: ["Ember reticle", "Weathered finish"],
  },
  {
    id: "m7", name: "Kestrel", designation: "M7", slot: "primary", cls: "smg", fireMode: "auto",
    blurb: "High-rate compact weapon: fast handling, steep falloff, lateral kick.",
    rpm: 900, damage: 20, pellets: 1, falloffStart: 11, falloffEnd: 30, minDamageMul: 0.58,
    zoneMul: { head: 1.5, upper: 1, lower: 0.9, limb: 0.8 }, magSize: 32, reserveMags: 4,
    reloadTactical: 1.75, reloadEmpty: 2.25, swapTime: 0.3, adsTime: 0.15, adsFovMul: 0.82, adsMoveMul: 0.78, moveMul: 1.05,
    sprintOut: 0.18, hipSpread: 2.0, hipSpreadMove: 1.1, adsSpread: 0.22, crouchSpreadMul: 0.8, bloomPerShot: 0.2,
    bloomMax: 2.4, bloomRecover: 6.5, firstShotAccurate: true,
    recoil: { pitchPerShot: 0.44, yawAmp: 0.46, yawFreq: 0.9, variance: 0.1, recoverDelay: 0.1, recoverRate: 14, viewKick: 0.4, seed: 9 },
    penetration: 0.2, loudness: 46, tracerEvery: 4,
    look: { len: 0.6, barrel: 0.16, stock: 0.1, mag: "box", accent: "#35c6e8", scope: false, height: 0.1, hand: "rifle" },
    audio: { pitch: 1.25, punch: 0.6, crack: 0.95, decay: 0.2 }, mastery: ["Signal reticle", "Cyan trim"],
  },
  {
    id: "br12", name: "Mesa", designation: "BR-12", slot: "primary", cls: "battle", fireMode: "semi",
    blurb: "Semi-auto battle rifle. Heavy hits, heavy recoil, capped at 360 RPM.",
    rpm: 360, damage: 48, pellets: 1, falloffStart: 30, falloffEnd: 72, minDamageMul: 0.8,
    zoneMul: { head: 1.75, upper: 1, lower: 0.92, limb: 0.78 }, magSize: 12, reserveMags: 5,
    reloadTactical: 2.3, reloadEmpty: 2.9, swapTime: 0.45, adsTime: 0.24, adsFovMul: 0.72, adsMoveMul: 0.66, moveMul: 0.98,
    sprintOut: 0.26, hipSpread: 2.8, hipSpreadMove: 1.8, adsSpread: 0.12, crouchSpreadMul: 0.8, bloomPerShot: 0.9,
    bloomMax: 2.4, bloomRecover: 4, firstShotAccurate: true,
    recoil: { pitchPerShot: 1.55, yawAmp: 0.3, yawFreq: 1.1, variance: 0.15, recoverDelay: 0.22, recoverRate: 9, viewKick: 1.2, seed: 15 },
    penetration: 0.6, loudness: 62, tracerEvery: 2,
    look: { len: 0.95, barrel: 0.34, stock: 0.26, mag: "box", accent: "#8fd14f", scope: false, height: 0.12, hand: "rifle" },
    audio: { pitch: 0.8, punch: 1.2, crack: 1, decay: 0.4 }, mastery: ["Moss reticle", "Field-worn finish"],
  },
  {
    id: "sg8", name: "Breacher", designation: "SG-8", slot: "primary", cls: "shotgun", fireMode: "pump",
    blurb: "Pump shotgun, eight pellets. Brutal up close, low penetration.",
    rpm: 74, damage: 13.5, pellets: 8, falloffStart: 5, falloffEnd: 17, minDamageMul: 0.22,
    zoneMul: { head: 1.3, upper: 1, lower: 0.9, limb: 0.75 }, magSize: 6, reserveMags: 5,
    reloadTactical: 0.5, reloadEmpty: 0.5, shellReload: 0.46, swapTime: 0.5, adsTime: 0.22, adsFovMul: 0.85, adsMoveMul: 0.72, moveMul: 1.0,
    sprintOut: 0.24, hipSpread: 4.6, hipSpreadMove: 1.2, adsSpread: 3.0, crouchSpreadMul: 0.85, bloomPerShot: 0,
    bloomMax: 0, bloomRecover: 6, firstShotAccurate: false, pelletSpread: 1,
    recoil: { pitchPerShot: 3.4, yawAmp: 0.4, yawFreq: 1, variance: 0.4, recoverDelay: 0.3, recoverRate: 12, viewKick: 2.2, seed: 21 },
    penetration: 0.05, loudness: 66, tracerEvery: 0,
    look: { len: 0.95, barrel: 0.5, stock: 0.3, mag: "tube", accent: "#e8761c", scope: false, height: 0.12, hand: "rifle" },
    audio: { pitch: 0.55, punch: 1.6, crack: 0.6, decay: 0.45 }, mastery: ["Breach reticle", "Scorched finish"],
  },
  {
    id: "lmg60", name: "Anchor", designation: "LMG-60", slot: "primary", cls: "lmg", fireMode: "auto",
    blurb: "60-round support weapon. Slow to aim and reload, rock steady when crouched.",
    rpm: 600, damage: 24, pellets: 1, falloffStart: 22, falloffEnd: 55, minDamageMul: 0.75,
    zoneMul: { head: 1.5, upper: 1, lower: 0.9, limb: 0.8 }, magSize: 60, reserveMags: 2,
    reloadTactical: 4.6, reloadEmpty: 5.4, swapTime: 0.6, adsTime: 0.32, adsFovMul: 0.8, adsMoveMul: 0.58, moveMul: 0.93,
    sprintOut: 0.33, hipSpread: 3.2, hipSpreadMove: 2.2, adsSpread: 0.28, crouchSpreadMul: 0.45, bloomPerShot: 0.14,
    bloomMax: 2.8, bloomRecover: 3.6, firstShotAccurate: true,
    recoil: { pitchPerShot: 0.5, yawAmp: 0.22, yawFreq: 0.35, variance: 0.07, recoverDelay: 0.2, recoverRate: 7, viewKick: 0.6, seed: 31 },
    penetration: 0.5, loudness: 64, tracerEvery: 2,
    look: { len: 1.0, barrel: 0.4, stock: 0.28, mag: "drum", accent: "#e8761c", scope: false, height: 0.14, hand: "rifle" },
    audio: { pitch: 0.7, punch: 1.1, crack: 0.8, decay: 0.38 }, mastery: ["Anchor reticle", "Bipod badge"],
  },
  {
    id: "mr1", name: "Warden", designation: "MR-1", slot: "primary", cls: "marksman", fireMode: "bolt",
    blurb: "Bolt-action marksman rifle. One-shot head or upper torso inside 55 m.",
    rpm: 48, damage: 100, pellets: 1, falloffStart: 55, falloffEnd: 100, minDamageMul: 0.8, lethalRange: 55,
    zoneMul: { head: 2.0, upper: 1.15, lower: 0.75, limb: 0.55 }, magSize: 5, reserveMags: 4,
    reloadTactical: 3.0, reloadEmpty: 3.4, swapTime: 0.55, adsTime: 0.28, adsFovMul: 0.42, adsMoveMul: 0.62, moveMul: 0.97,
    sprintOut: 0.3, hipSpread: 4.5, hipSpreadMove: 3.5, adsSpread: 0.02, crouchSpreadMul: 0.85, bloomPerShot: 0,
    bloomMax: 0, bloomRecover: 6, firstShotAccurate: true,
    recoil: { pitchPerShot: 3.8, yawAmp: 0.3, yawFreq: 1, variance: 0.2, recoverDelay: 0.4, recoverRate: 10, viewKick: 2.5, seed: 41 },
    penetration: 0.9, loudness: 78, tracerEvery: 1,
    look: { len: 1.15, barrel: 0.5, stock: 0.3, mag: "box", accent: "#35c6e8", scope: true, height: 0.12, hand: "rifle" },
    audio: { pitch: 0.6, punch: 1.4, crack: 1.2, decay: 0.7 }, mastery: ["Glint reticle", "Longwatch badge"],
  },
  {
    id: "p9", name: "Relay", designation: "P9", slot: "secondary", cls: "pistol", fireMode: "semi",
    blurb: "Quick semi-auto pistol with forgiving handling.",
    rpm: 450, damage: 22, pellets: 1, falloffStart: 10, falloffEnd: 28, minDamageMul: 0.6,
    zoneMul: { head: 1.5, upper: 1, lower: 0.9, limb: 0.8 }, magSize: 15, reserveMags: 3,
    reloadTactical: 1.35, reloadEmpty: 1.8, swapTime: 0.25, adsTime: 0.13, adsFovMul: 0.88, adsMoveMul: 0.85, moveMul: 1.05,
    sprintOut: 0.18, hipSpread: 1.9, hipSpreadMove: 1.0, adsSpread: 0.2, crouchSpreadMul: 0.8, bloomPerShot: 0.35,
    bloomMax: 1.8, bloomRecover: 6, firstShotAccurate: true,
    recoil: { pitchPerShot: 0.9, yawAmp: 0.25, yawFreq: 1, variance: 0.1, recoverDelay: 0.12, recoverRate: 14, viewKick: 0.5, seed: 51 },
    penetration: 0.15, loudness: 40, tracerEvery: 3,
    look: { len: 0.28, barrel: 0.06, stock: 0, mag: "pistol", accent: "#35c6e8", scope: false, height: 0.1, hand: "pistol" },
    audio: { pitch: 1.4, punch: 0.5, crack: 0.9, decay: 0.18 }, mastery: ["Pulse reticle"],
  },
  {
    id: "h3", name: "Rook", designation: "H3", slot: "secondary", cls: "pistol", fireMode: "semi",
    blurb: "Slower heavy pistol with real range. Three body shots.",
    rpm: 200, damage: 42, pellets: 1, falloffStart: 20, falloffEnd: 52, minDamageMul: 0.8,
    zoneMul: { head: 1.7, upper: 1, lower: 0.9, limb: 0.8 }, magSize: 7, reserveMags: 3,
    reloadTactical: 1.7, reloadEmpty: 2.2, swapTime: 0.28, adsTime: 0.16, adsFovMul: 0.86, adsMoveMul: 0.83, moveMul: 1.04,
    sprintOut: 0.2, hipSpread: 2.2, hipSpreadMove: 1.2, adsSpread: 0.1, crouchSpreadMul: 0.8, bloomPerShot: 0.8,
    bloomMax: 2, bloomRecover: 4.5, firstShotAccurate: true,
    recoil: { pitchPerShot: 2.1, yawAmp: 0.3, yawFreq: 1, variance: 0.15, recoverDelay: 0.2, recoverRate: 12, viewKick: 1.1, seed: 61 },
    penetration: 0.45, loudness: 52, tracerEvery: 1,
    look: { len: 0.3, barrel: 0.1, stock: 0, mag: "pistol", accent: "#e8761c", scope: false, height: 0.11, hand: "pistol" },
    audio: { pitch: 0.9, punch: 1.1, crack: 1, decay: 0.3 }, mastery: ["Rook reticle"],
  },
  {
    id: "cinder", name: "Cinder", designation: "Cinder Auto", slot: "secondary", cls: "machinepistol", fireMode: "auto",
    blurb: "Machine pistol with severe recoil and a small magazine.",
    rpm: 1000, damage: 15, pellets: 1, falloffStart: 6, falloffEnd: 18, minDamageMul: 0.55,
    zoneMul: { head: 1.4, upper: 1, lower: 0.9, limb: 0.8 }, magSize: 20, reserveMags: 3,
    reloadTactical: 1.5, reloadEmpty: 1.95, swapTime: 0.25, adsTime: 0.13, adsFovMul: 0.9, adsMoveMul: 0.85, moveMul: 1.06,
    sprintOut: 0.18, hipSpread: 2.6, hipSpreadMove: 1.4, adsSpread: 0.5, crouchSpreadMul: 0.8, bloomPerShot: 0.3,
    bloomMax: 3, bloomRecover: 6, firstShotAccurate: true,
    recoil: { pitchPerShot: 0.95, yawAmp: 0.7, yawFreq: 1.4, variance: 0.25, recoverDelay: 0.1, recoverRate: 16, viewKick: 0.7, seed: 71 },
    penetration: 0.1, loudness: 42, tracerEvery: 4,
    look: { len: 0.3, barrel: 0.08, stock: 0, mag: "pistol", accent: "#ff5d73", scope: false, height: 0.1, hand: "pistol" },
    audio: { pitch: 1.5, punch: 0.45, crack: 1, decay: 0.15 }, mastery: ["Cinder reticle"],
  },
];

export const WEAPONS: Record<string, WeaponDef> = Object.fromEntries(W.map((w) => [w.id, w]));
export const PRIMARY_IDS = W.filter((w) => w.slot === "primary").map((w) => w.id);
export const SECONDARY_IDS = W.filter((w) => w.slot === "secondary").map((w) => w.id);

/** Deterministic recoil climb pattern: [pitch, yaw] in degrees per shot index. */
const patternCache = new Map<string, Array<[number, number]>>();
export function recoilPattern(def: WeaponDef, length = 64): Array<[number, number]> {
  const key = def.id + ":" + length;
  const hit = patternCache.get(key);
  if (hit) return hit;
  const r = def.recoil;
  const out: Array<[number, number]> = [];
  let prevYaw = 0;
  for (let i = 0; i < length; i++) {
    const climb = r.pitchPerShot * (i < 6 ? 1 + i * 0.04 : 1.2 - Math.min(0.55, (i - 6) * 0.02));
    const yawTarget = r.yawAmp * Math.sin(i * r.yawFreq + r.seed) * (i < 2 ? 0.3 : 1);
    out.push([climb, yawTarget - prevYaw]);
    prevYaw = yawTarget;
  }
  patternCache.set(key, out);
  return out;
}

/** Damage multiplier after distance falloff (linear between start and end). */
export function falloffMul(def: { falloffStart: number; falloffEnd: number; minDamageMul: number }, dist: number, rangeMul = 1): number {
  const s = def.falloffStart * rangeMul;
  const e = def.falloffEnd * rangeMul;
  if (dist <= s) return 1;
  if (dist >= e) return def.minDamageMul;
  return 1 + (def.minDamageMul - 1) * ((dist - s) / (e - s));
}

/** "AR-4 Jackal"; collapses duplicates such as "Cinder Auto" + "Cinder". */
export function weaponLabel(d: { designation: string; name: string }): string {
  return d.designation.toLowerCase().includes(d.name.toLowerCase()) ? d.designation : `${d.designation} ${d.name}`;
}
