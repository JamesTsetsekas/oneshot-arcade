// shared-content: weapons and rarity. Everything here is data; the sim and the UI both read it.

export const CONTENT_VERSION = "highwake-0.1.0";

export type AmmoType = "light" | "shell" | "heavy" | "charge";
export const AMMO_TYPES: readonly AmmoType[] = ["light", "shell", "heavy", "charge"];
export const AMMO_CAPS: Record<AmmoType, number> = { light: 240, shell: 48, heavy: 80, charge: 18 };
export const AMMO_NAMES: Record<AmmoType, string> = { light: "Light", shell: "Shell", heavy: "Heavy", charge: "Charge" };
/** Size of one world ammo pickup. */
export const AMMO_PICKUP: Record<AmmoType, number> = { light: 30, shell: 6, heavy: 10, charge: 3 };

export type WeaponId =
  | "wayfarer"
  | "tempest"
  | "breakwater"
  | "coil"
  | "needler"
  | "sundial"
  | "longwake"
  | "harbor"
  | "gale";

export const WEAPON_IDS: readonly WeaponId[] = [
  "wayfarer",
  "tempest",
  "breakwater",
  "coil",
  "needler",
  "sundial",
  "longwake",
  "harbor",
  "gale",
];

export type WeaponClass = "rifle" | "carbine" | "shotgun" | "smg" | "dmr" | "rail" | "pistol" | "launcher";

/** Stat modifiers. Multiplicative unless the name ends in "Add". */
export interface WeaponMods {
  damage?: number;
  rpm?: number;
  reload?: number;
  spread?: number;
  recoil?: number;
  charge?: number;
  audible?: number;
  equip?: number;
  falloff?: number;
  magAdd?: number;
  pelletsAdd?: number;
  radiusAdd?: number;
}

export interface WeaponDef {
  id: WeaponId;
  name: string;
  cls: WeaponClass;
  blurb: string;
  ammo: AmmoType;
  mag: number;
  damage: number;
  pellets: number;
  rpm: number;
  auto: boolean;
  /** Full reload time, or per-shell time when shellReload is set. */
  reload: number;
  shellReload: boolean;
  head: number;
  limb: number;
  falloffStart: number;
  falloffEnd: number;
  falloffMin: number;
  range: number;
  /** Cone half-angles in degrees. */
  spreadHip: number;
  spreadAds: number;
  bloomPerShot: number;
  bloomMax: number;
  /** Degrees of vertical / horizontal kick per shot. */
  recoilV: number;
  recoilH: number;
  adsFov: number;
  adsBoom: number;
  equip: number;
  audible: number;
  /** Shotgun aggregate caps (body damage before zone multiplier). */
  minAggregate: number;
  maxAggregate: number;
  projectile: null | { speed: number; gravity: number; radius: number; charge: number; impulse: number };
  masterwork: { label: string; mods: WeaponMods };
  prototype: { label: string; drawback: string; mods: WeaponMods };
}

function w(def: WeaponDef): WeaponDef {
  return def;
}

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  wayfarer: w({
    id: "wayfarer", name: "Wayfarer Rifle", cls: "rifle", blurb: "Balanced medium-range automatic.",
    ammo: "light", mag: 30, damage: 20, pellets: 1, rpm: 480, auto: true, reload: 2.3, shellReload: false,
    head: 1.75, limb: 0.85, falloffStart: 45, falloffEnd: 110, falloffMin: 0.65, range: 260,
    spreadHip: 1.9, spreadAds: 0.35, bloomPerShot: 0.22, bloomMax: 1.6, recoilV: 0.55, recoilH: 0.28,
    adsFov: 0.72, adsBoom: 2.1, equip: 0.45, audible: 190, minAggregate: 0, maxAggregate: 0, projectile: null,
    masterwork: { label: "Drum reed: +6 magazine", mods: { magAdd: 6 } },
    prototype: { label: "Overdrive bellows: +18% fire rate", drawback: "-6 magazine", mods: { rpm: 1.18, magAdd: -6 } },
  }),
  tempest: w({
    id: "tempest", name: "Tempest Carbine", cls: "carbine", blurb: "High rate of fire; hard to hold on target.",
    ammo: "light", mag: 28, damage: 16, pellets: 1, rpm: 720, auto: true, reload: 2.1, shellReload: false,
    head: 1.6, limb: 0.85, falloffStart: 28, falloffEnd: 70, falloffMin: 0.55, range: 200,
    spreadHip: 2.3, spreadAds: 0.6, bloomPerShot: 0.26, bloomMax: 2.2, recoilV: 0.78, recoilH: 0.55,
    adsFov: 0.78, adsBoom: 2.2, equip: 0.42, audible: 180, minAggregate: 0, maxAggregate: 0, projectile: null,
    masterwork: { label: "Counterweight: -15% recoil", mods: { recoil: 0.85 } },
    prototype: { label: "Storm feed: +10 magazine", drawback: "+25% reload time", mods: { magAdd: 10, reload: 1.25 } },
  }),
  breakwater: w({
    id: "breakwater", name: "Breakwater Scattergun", cls: "shotgun", blurb: "Pump scattergun. Huge close burst.",
    ammo: "shell", mag: 5, damage: 11, pellets: 9, rpm: 58, auto: false, reload: 0.62, shellReload: true,
    head: 1.5, limb: 0.9, falloffStart: 8, falloffEnd: 24, falloffMin: 0.3, range: 60,
    spreadHip: 3.6, spreadAds: 2.9, bloomPerShot: 0, bloomMax: 0, recoilV: 3.4, recoilH: 0.6,
    adsFov: 0.86, adsBoom: 2.4, equip: 0.55, audible: 170, minAggregate: 24, maxAggregate: 99, projectile: null,
    masterwork: { label: "Choke bell: -20% spread", mods: { spread: 0.8 } },
    prototype: { label: "Twin chamber: +2 pellets", drawback: "-20% fire rate", mods: { pelletsAdd: 2, rpm: 0.8 } },
  }),
  coil: w({
    id: "coil", name: "Coil Shotgun", cls: "shotgun", blurb: "Semi-auto scattergun. Lower damage, faster follow-ups.",
    ammo: "shell", mag: 6, damage: 8, pellets: 7, rpm: 150, auto: false, reload: 0.5, shellReload: true,
    head: 1.5, limb: 0.9, falloffStart: 7, falloffEnd: 20, falloffMin: 0.3, range: 50,
    spreadHip: 4.2, spreadAds: 3.5, bloomPerShot: 0.3, bloomMax: 1.2, recoilV: 2.1, recoilH: 0.7,
    adsFov: 0.86, adsBoom: 2.4, equip: 0.5, audible: 160, minAggregate: 16, maxAggregate: 56, projectile: null,
    masterwork: { label: "Quick-feed: -20% reload time", mods: { reload: 0.8 } },
    prototype: { label: "Hot coil: +15% fire rate", drawback: "+20% spread", mods: { rpm: 1.15, spread: 1.2 } },
  }),
  needler: w({
    id: "needler", name: "Needler SMG", cls: "smg", blurb: "Close-range spray. Fast swap, sharp falloff.",
    ammo: "light", mag: 36, damage: 14, pellets: 1, rpm: 800, auto: true, reload: 1.9, shellReload: false,
    head: 1.5, limb: 0.9, falloffStart: 14, falloffEnd: 38, falloffMin: 0.4, range: 120,
    spreadHip: 2.1, spreadAds: 1.0, bloomPerShot: 0.16, bloomMax: 1.8, recoilV: 0.5, recoilH: 0.42,
    adsFov: 0.84, adsBoom: 2.3, equip: 0.28, audible: 150, minAggregate: 0, maxAggregate: 0, projectile: null,
    masterwork: { label: "Long quill: +8 magazine", mods: { magAdd: 8 } },
    prototype: { label: "Hummingbird: +14% fire rate", drawback: "falloff starts 25% sooner", mods: { rpm: 1.14, falloff: 0.75 } },
  }),
  sundial: w({
    id: "sundial", name: "Sundial DMR", cls: "dmr", blurb: "Semi-auto precision. Strong head pressure.",
    ammo: "heavy", mag: 12, damage: 46, pellets: 1, rpm: 170, auto: false, reload: 2.6, shellReload: false,
    head: 2.0, limb: 0.8, falloffStart: 90, falloffEnd: 220, falloffMin: 0.8, range: 340,
    spreadHip: 2.8, spreadAds: 0.08, bloomPerShot: 0.5, bloomMax: 1.5, recoilV: 1.7, recoilH: 0.35,
    adsFov: 0.42, adsBoom: 1.8, equip: 0.6, audible: 230, minAggregate: 0, maxAggregate: 0, projectile: null,
    masterwork: { label: "Gnomon brace: -50% spread", mods: { spread: 0.5 } },
    prototype: { label: "Noon charge: +14% damage", drawback: "-15% fire rate", mods: { damage: 1.14 / 1.12, rpm: 0.85 } },
  }),
  longwake: w({
    id: "longwake", name: "Longwake Rail", cls: "rail", blurb: "Charged projectile marksman rifle. Loud tone, visible glint.",
    ammo: "heavy", mag: 5, damage: 104, pellets: 1, rpm: 46, auto: false, reload: 3.2, shellReload: false,
    head: 2.0, limb: 0.8, falloffStart: 400, falloffEnd: 500, falloffMin: 1, range: 600,
    spreadHip: 3.5, spreadAds: 0.02, bloomPerShot: 0, bloomMax: 0, recoilV: 3.2, recoilH: 0.3,
    adsFov: 0.3, adsBoom: 1.8, equip: 0.7, audible: 260, minAggregate: 0, maxAggregate: 0,
    projectile: { speed: 240, gravity: 3.5, radius: 0, charge: 0.6, impulse: 0 },
    masterwork: { label: "Fast capacitor: -25% charge time", mods: { charge: 0.75 } },
    prototype: { label: "Wake splitter: +30% bolt velocity", drawback: "+20% reload time", mods: { reload: 1.2 } },
  }),
  harbor: w({
    id: "harbor", name: "Harbor Pistol", cls: "pistol", blurb: "Reliable sidearm. Usable while swimming.",
    ammo: "light", mag: 15, damage: 24, pellets: 1, rpm: 330, auto: false, reload: 1.5, shellReload: false,
    head: 1.75, limb: 0.9, falloffStart: 25, falloffEnd: 60, falloffMin: 0.6, range: 160,
    spreadHip: 1.6, spreadAds: 0.45, bloomPerShot: 0.4, bloomMax: 1.6, recoilV: 1.1, recoilH: 0.3,
    adsFov: 0.82, adsBoom: 2.2, equip: 0.25, audible: 150, minAggregate: 0, maxAggregate: 0, projectile: null,
    masterwork: { label: "Hush reed: -50% audible range", mods: { audible: 0.5 } },
    prototype: { label: "Tide trigger: +20% fire rate", drawback: "-3 magazine", mods: { rpm: 1.2, magAdd: -3 } },
  }),
  gale: w({
    id: "gale", name: "Gale Launcher", cls: "launcher", blurb: "Lobs concussive wind orbs. Low damage, big shove.",
    ammo: "charge", mag: 3, damage: 14, pellets: 1, rpm: 60, auto: false, reload: 2.8, shellReload: false,
    head: 1, limb: 1, falloffStart: 400, falloffEnd: 500, falloffMin: 1, range: 200,
    spreadHip: 0.6, spreadAds: 0.2, bloomPerShot: 0, bloomMax: 0, recoilV: 2.4, recoilH: 0.2,
    adsFov: 0.86, adsBoom: 2.4, equip: 0.6, audible: 140, minAggregate: 0, maxAggregate: 0,
    projectile: { speed: 46, gravity: 16, radius: 6, charge: 0, impulse: 15 },
    masterwork: { label: "Wide bell: +1.5 m blast radius", mods: { radiusAdd: 1.5 } },
    prototype: { label: "Squall chamber: +1 magazine", drawback: "+15% reload time", mods: { magAdd: 1, reload: 1.15 } },
  }),
};

export type RarityShape = "circle" | "chevron" | "diamond" | "crown" | "star";

export interface RarityDef {
  id: number;
  name: string;
  color: string;
  shape: RarityShape;
  mods: WeaponMods;
  note: string;
}

/** Rarity curve. Each tier modestly improves two or three stats; damage never exceeds +12%. */
export const RARITIES: readonly RarityDef[] = [
  { id: 0, name: "Field", color: "#b4bcc6", shape: "circle", mods: {}, note: "Fully usable baseline." },
  { id: 1, name: "Tuned", color: "#59d47a", shape: "chevron", mods: { damage: 1.03, reload: 0.93, equip: 0.92 }, note: "Faster reload and handling." },
  { id: 2, name: "Advanced", color: "#45a6ff", shape: "diamond", mods: { damage: 1.06, reload: 0.9, equip: 0.9, spread: 0.88, recoil: 0.88 }, note: "Tighter recoil and spread." },
  { id: 3, name: "Masterwork", color: "#b678ff", shape: "crown", mods: { damage: 1.09, reload: 0.87, equip: 0.88, spread: 0.84, recoil: 0.84 }, note: "Adds a fixed attachment." },
  { id: 4, name: "Prototype", color: "#ffc840", shape: "star", mods: { damage: 1.12, reload: 0.87, equip: 0.88, spread: 0.84, recoil: 0.84 }, note: "One strong identity, one drawback." },
];
export const RARITY_PROTOTYPE = 4;
export const RARITY_MASTERWORK = 3;
/** Match-wide cap on Prototype weapons. */
export const PROTOTYPE_CAP = 4;

export interface WeaponStats {
  id: WeaponId;
  rarity: number;
  def: WeaponDef;
  mag: number;
  damage: number;
  pellets: number;
  rpm: number;
  interval: number;
  reload: number;
  spreadHip: number;
  spreadAds: number;
  recoilV: number;
  recoilH: number;
  equip: number;
  audible: number;
  falloffStart: number;
  falloffEnd: number;
  charge: number;
  projSpeed: number;
  radius: number;
  dps: number;
  perk: string;
  drawback: string;
}

function applyMods(s: WeaponStats, m: WeaponMods): void {
  if (m.damage) s.damage *= m.damage;
  if (m.rpm) s.rpm *= m.rpm;
  if (m.reload) s.reload *= m.reload;
  if (m.spread) {
    s.spreadHip *= m.spread;
    s.spreadAds *= m.spread;
  }
  if (m.recoil) {
    s.recoilV *= m.recoil;
    s.recoilH *= m.recoil;
  }
  if (m.charge) s.charge *= m.charge;
  if (m.audible) s.audible *= m.audible;
  if (m.equip) s.equip *= m.equip;
  if (m.falloff) {
    s.falloffStart *= m.falloff;
    s.falloffEnd *= m.falloff;
  }
  if (m.magAdd) s.mag += m.magAdd;
  if (m.pelletsAdd) s.pellets += m.pelletsAdd;
  if (m.radiusAdd) s.radius += m.radiusAdd;
}

const statCache = new Map<string, WeaponStats>();

export function weaponStats(id: WeaponId, rarity: number): WeaponStats {
  const key = id + rarity;
  const hit = statCache.get(key);
  if (hit) return hit;
  const def = WEAPONS[id];
  const r = RARITIES[rarity] ?? RARITIES[0]!;
  const s: WeaponStats = {
    id, rarity: r.id, def,
    mag: def.mag, damage: def.damage, pellets: def.pellets, rpm: def.rpm, interval: 0,
    reload: def.reload, spreadHip: def.spreadHip, spreadAds: def.spreadAds,
    recoilV: def.recoilV, recoilH: def.recoilH, equip: def.equip, audible: def.audible,
    falloffStart: def.falloffStart, falloffEnd: def.falloffEnd,
    charge: def.projectile ? def.projectile.charge : 0,
    projSpeed: def.projectile ? def.projectile.speed : 0,
    radius: def.projectile ? def.projectile.radius : 0,
    dps: 0, perk: "", drawback: "",
  };
  applyMods(s, r.mods);
  if (r.id >= RARITY_MASTERWORK) {
    if (r.id === RARITY_PROTOTYPE) {
      applyMods(s, def.prototype.mods);
      s.perk = def.prototype.label;
      s.drawback = def.prototype.drawback;
      if (id === "longwake") s.projSpeed *= 1.3;
    } else {
      applyMods(s, def.masterwork.mods);
      s.perk = def.masterwork.label;
    }
  }
  s.damage = Math.round(s.damage * 10) / 10;
  s.interval = 60 / s.rpm;
  s.dps = Math.round((s.damage * s.pellets * s.rpm) / 60);
  statCache.set(key, s);
  return s;
}

export function falloffMult(def: WeaponDef, st: WeaponStats, dist: number): number {
  if (dist <= st.falloffStart) return 1;
  if (dist >= st.falloffEnd) return def.falloffMin;
  const t = (dist - st.falloffStart) / (st.falloffEnd - st.falloffStart);
  return 1 + (def.falloffMin - 1) * t;
}

/** Deterministic recoil pattern: degrees of (vertical, horizontal) kick for the nth shot of a burst. */
export function recoilKick(st: WeaponStats, shotInBurst: number): [number, number] {
  const n = shotInBurst;
  const v = st.recoilV * (n < 3 ? 1.25 : n < 10 ? 0.9 : 0.6);
  // Horizontal weave: drift right, then left, then a wider weave. Same every burst so it can be learned.
  const h = st.recoilH * Math.sin(n * 0.85 + 0.6) * (n < 4 ? 0.5 : 1);
  return [v, h];
}
