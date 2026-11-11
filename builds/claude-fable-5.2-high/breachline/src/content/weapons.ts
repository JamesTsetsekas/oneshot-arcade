// content-data: weapon definitions (all fictional designations and original tuning).
export type FireMode = 'auto' | 'semi' | 'pump' | 'bolt';
export type WeaponClass = 'rifle' | 'smg' | 'battle' | 'shotgun' | 'lmg' | 'marksman' | 'pistol' | 'heavyPistol' | 'machinePistol';
export type AttachSlot = 'optic' | 'barrel' | 'underbarrel' | 'magazine' | 'stock';

export interface WeaponDef {
  id: string;
  idx: number;
  name: string;
  cls: WeaponClass;
  role: string;
  slot: 'primary' | 'sidearm';
  desc: string;
  fire: FireMode;
  rpm: number;
  pellets: number;
  dmgNear: number;
  dmgFar: number;
  rangeNear: number;
  rangeFar: number;
  mult: { head: number; upper: number; lower: number; limb: number };
  /** beyond this distance head/upper multipliers are clamped so a single hit is not lethal (marksman rule) */
  lethalRange?: number;
  mag: number;
  reserve: number;
  reload: { tactical: number; empty: number; outAt: number; inAt: number };
  shell?: { start: number; per: number; end: number };
  adsTime: number;
  adsZoom: number;
  adsMove: number;
  sprintOut: number;
  swapTime: number;
  moveMult: number;
  hip: { base: number; max: number; perShot: number; move: number; recover: number };
  adsSpread: number;
  /** degrees */
  recoil: { up: number; side: number[]; variance: number; adsMult: number; crouchMult: number; settle: number };
  penetration: number;
  flinch: number;
  glint?: boolean;
  slots: AttachSlot[];
  unlockLevel: number;
  /** audio synthesis parameters */
  snd: { pitch: number; body: number; crack: number; tail: number; gain: number };
  /** procedural model parameters (metres) */
  model: { len: number; barrel: number; stock: number; mag: number; bulk: number; scope: number };
}

const M = { head: 1.4, upper: 1.1, lower: 1.0, limb: 0.85 };

const defs: Omit<WeaponDef, 'idx'>[] = [
  {
    id: 'ar4', name: 'AR-4 Jackal', cls: 'rifle', role: 'Balanced rifle', slot: 'primary',
    desc: 'Balanced automatic rifle. Predictable vertical climb and a medium damage falloff make it reliable in every lane.',
    fire: 'auto', rpm: 720, pellets: 1, dmgNear: 30, dmgFar: 20, rangeNear: 24, rangeFar: 52, mult: M,
    mag: 30, reserve: 120, reload: { tactical: 2.0, empty: 2.45, outAt: 0.28, inAt: 0.72 },
    adsTime: 0.24, adsZoom: 1.3, adsMove: 0.72, sprintOut: 0.24, swapTime: 0.42, moveMult: 0.97,
    hip: { base: 1.7, max: 5.2, perShot: 0.55, move: 1.3, recover: 7 }, adsSpread: 0.07,
    recoil: { up: 0.62, side: [0.05, -0.08, 0.1, 0.06, -0.12, -0.08, 0.1, 0.14, -0.05, -0.12], variance: 0.07, adsMult: 0.8, crouchMult: 0.9, settle: 9 },
    penetration: 2, flinch: 0.55, slots: ['optic', 'barrel', 'underbarrel', 'magazine', 'stock'], unlockLevel: 1,
    snd: { pitch: 1.0, body: 0.9, crack: 0.8, tail: 0.5, gain: 0.9 },
    model: { len: 0.56, barrel: 0.26, stock: 0.24, mag: 0.19, bulk: 1.0, scope: 0 },
  },
  {
    id: 'm7', name: 'M7 Kestrel', cls: 'smg', role: 'Close-quarters', slot: 'primary',
    desc: 'High-rate compact weapon. Fastest handling in class, but lateral recoil and steep falloff punish long shots.',
    fire: 'auto', rpm: 900, pellets: 1, dmgNear: 26, dmgFar: 15, rangeNear: 11, rangeFar: 28, mult: M,
    mag: 32, reserve: 128, reload: { tactical: 1.7, empty: 2.1, outAt: 0.3, inAt: 0.72 },
    adsTime: 0.17, adsZoom: 1.2, adsMove: 0.82, sprintOut: 0.18, swapTime: 0.36, moveMult: 1.0,
    hip: { base: 1.3, max: 4.6, perShot: 0.4, move: 0.9, recover: 9 }, adsSpread: 0.12,
    recoil: { up: 0.48, side: [0.18, 0.24, -0.2, -0.3, 0.26, 0.3, -0.28, -0.22, 0.2, -0.26, 0.3, -0.18], variance: 0.14, adsMult: 0.85, crouchMult: 0.9, settle: 10 },
    penetration: 1, flinch: 0.4, slots: ['optic', 'barrel', 'underbarrel', 'magazine', 'stock'], unlockLevel: 1,
    snd: { pitch: 1.35, body: 0.6, crack: 0.9, tail: 0.35, gain: 0.8 },
    model: { len: 0.4, barrel: 0.13, stock: 0.18, mag: 0.22, bulk: 0.85, scope: 0 },
  },
  {
    id: 'br12', name: 'BR-12 Mesa', cls: 'battle', role: 'Semi-auto power', slot: 'primary',
    desc: 'Semi-automatic battle rifle. Two clean upper-body hits finish a fight, but each shot kicks hard and the rate is capped.',
    fire: 'semi', rpm: 360, pellets: 1, dmgNear: 52, dmgFar: 40, rangeNear: 36, rangeFar: 72, mult: { head: 1.5, upper: 1.1, lower: 1.0, limb: 0.85 },
    mag: 15, reserve: 75, reload: { tactical: 2.3, empty: 2.8, outAt: 0.28, inAt: 0.7 },
    adsTime: 0.28, adsZoom: 1.35, adsMove: 0.66, sprintOut: 0.28, swapTime: 0.46, moveMult: 0.95,
    hip: { base: 2.2, max: 6.5, perShot: 1.6, move: 1.6, recover: 6 }, adsSpread: 0.04,
    recoil: { up: 1.5, side: [0.12, -0.18, 0.2, -0.1, 0.16, -0.22], variance: 0.16, adsMult: 0.8, crouchMult: 0.85, settle: 7 },
    penetration: 3, flinch: 0.9, slots: ['optic', 'barrel', 'underbarrel', 'magazine', 'stock'], unlockLevel: 4,
    snd: { pitch: 0.78, body: 1.2, crack: 1.0, tail: 0.8, gain: 1.0 },
    model: { len: 0.6, barrel: 0.32, stock: 0.27, mag: 0.15, bulk: 1.1, scope: 0 },
  },
  {
    id: 'sg8', name: 'SG-8 Breacher', cls: 'shotgun', role: 'Room clearer', slot: 'primary',
    desc: 'Pump shotgun firing eight pellets. Decisive inside rooms and doorways; nearly harmless across the courtyard.',
    fire: 'pump', rpm: 72, pellets: 8, dmgNear: 17, dmgFar: 4, rangeNear: 6.5, rangeFar: 17, mult: { head: 1.1, upper: 1.0, lower: 1.0, limb: 0.9 },
    mag: 6, reserve: 30, reload: { tactical: 0, empty: 0, outAt: 0, inAt: 0 }, shell: { start: 0.4, per: 0.48, end: 0.38 },
    adsTime: 0.22, adsZoom: 1.15, adsMove: 0.78, sprintOut: 0.22, swapTime: 0.44, moveMult: 0.97,
    hip: { base: 3.9, max: 4.6, perShot: 0.7, move: 0.3, recover: 5 }, adsSpread: 3.0,
    recoil: { up: 3.2, side: [0.3, -0.4, 0.2], variance: 0.4, adsMult: 0.9, crouchMult: 0.9, settle: 6 },
    penetration: 0.4, flinch: 0.3, slots: ['optic', 'barrel', 'underbarrel', 'stock'], unlockLevel: 7,
    snd: { pitch: 0.6, body: 1.5, crack: 0.7, tail: 0.9, gain: 1.1 },
    model: { len: 0.58, barrel: 0.36, stock: 0.26, mag: 0, bulk: 1.05, scope: 0 },
  },
  {
    id: 'lmg60', name: 'LMG-60 Anchor', cls: 'lmg', role: 'Sustained support', slot: 'primary',
    desc: '60-round support weapon. Slow to aim and reload, but crouching settles it into the steadiest sustained fire on the island.',
    fire: 'auto', rpm: 600, pellets: 1, dmgNear: 32, dmgFar: 24, rangeNear: 30, rangeFar: 62, mult: M,
    mag: 60, reserve: 120, reload: { tactical: 4.4, empty: 5.0, outAt: 0.3, inAt: 0.76 },
    adsTime: 0.32, adsZoom: 1.3, adsMove: 0.58, sprintOut: 0.33, swapTime: 0.58, moveMult: 0.9,
    hip: { base: 2.6, max: 7, perShot: 0.5, move: 1.8, recover: 5 }, adsSpread: 0.1,
    recoil: { up: 0.66, side: [0.1, -0.14, 0.12, 0.16, -0.18, -0.1, 0.14, -0.12], variance: 0.12, adsMult: 0.85, crouchMult: 0.5, settle: 7 },
    penetration: 3, flinch: 0.6, slots: ['optic', 'barrel', 'underbarrel', 'magazine', 'stock'], unlockLevel: 10,
    snd: { pitch: 0.86, body: 1.1, crack: 0.85, tail: 0.7, gain: 1.0 },
    model: { len: 0.66, barrel: 0.34, stock: 0.26, mag: 0.16, bulk: 1.35, scope: 0 },
  },
  {
    id: 'mr1', name: 'MR-1 Warden', cls: 'marksman', role: 'Bolt-action marksman', slot: 'primary',
    desc: 'Bolt-action marksman rifle. One hit to the head or upper torso is lethal inside 60 m; the scope glints when aimed.',
    fire: 'bolt', rpm: 46, pellets: 1, dmgNear: 90, dmgFar: 78, rangeNear: 60, rangeFar: 90, mult: { head: 1.6, upper: 1.15, lower: 0.95, limb: 0.8 },
    lethalRange: 60,
    mag: 5, reserve: 30, reload: { tactical: 2.9, empty: 3.3, outAt: 0.3, inAt: 0.7 },
    adsTime: 0.3, adsZoom: 4, adsMove: 0.6, sprintOut: 0.3, swapTime: 0.5, moveMult: 0.95,
    hip: { base: 5.5, max: 8, perShot: 2, move: 2.5, recover: 5 }, adsSpread: 0.0,
    recoil: { up: 3.4, side: [0.3, -0.3], variance: 0.3, adsMult: 0.75, crouchMult: 0.8, settle: 5 },
    penetration: 4, flinch: 1.0, glint: true, slots: ['barrel', 'magazine', 'stock'], unlockLevel: 13,
    snd: { pitch: 0.62, body: 1.4, crack: 1.2, tail: 1.2, gain: 1.15 },
    model: { len: 0.7, barrel: 0.42, stock: 0.3, mag: 0.08, bulk: 0.95, scope: 1 },
  },
  {
    id: 'p9', name: 'P9 Relay', cls: 'pistol', role: 'Quick sidearm', slot: 'sidearm',
    desc: 'Quick semi-automatic pistol. Draws fast and keeps pace with your trigger finger.',
    fire: 'semi', rpm: 420, pellets: 1, dmgNear: 28, dmgFar: 17, rangeNear: 14, rangeFar: 30, mult: M,
    mag: 14, reserve: 42, reload: { tactical: 1.35, empty: 1.6, outAt: 0.3, inAt: 0.72 },
    adsTime: 0.14, adsZoom: 1.15, adsMove: 0.9, sprintOut: 0.14, swapTime: 0.26, moveMult: 1.0,
    hip: { base: 1.2, max: 4.2, perShot: 0.9, move: 0.6, recover: 10 }, adsSpread: 0.1,
    recoil: { up: 1.0, side: [0.1, -0.14, 0.12, -0.08], variance: 0.14, adsMult: 0.85, crouchMult: 0.9, settle: 11 },
    penetration: 1, flinch: 0.35, slots: [], unlockLevel: 1,
    snd: { pitch: 1.5, body: 0.5, crack: 0.9, tail: 0.3, gain: 0.7 },
    model: { len: 0.2, barrel: 0.02, stock: 0, mag: 0.1, bulk: 0.7, scope: 0 },
  },
  {
    id: 'h3', name: 'H3 Rook', cls: 'heavyPistol', role: 'Heavy sidearm', slot: 'sidearm',
    desc: 'Slow heavy pistol with real reach. Rewards measured shots; punishes panic fire.',
    fire: 'semi', rpm: 210, pellets: 1, dmgNear: 48, dmgFar: 33, rangeNear: 26, rangeFar: 52, mult: { head: 1.5, upper: 1.1, lower: 1.0, limb: 0.85 },
    mag: 7, reserve: 28, reload: { tactical: 1.6, empty: 1.85, outAt: 0.3, inAt: 0.72 },
    adsTime: 0.18, adsZoom: 1.2, adsMove: 0.86, sprintOut: 0.18, swapTime: 0.32, moveMult: 1.0,
    hip: { base: 1.6, max: 6, perShot: 2.2, move: 0.9, recover: 6 }, adsSpread: 0.06,
    recoil: { up: 2.6, side: [0.25, -0.3, 0.2], variance: 0.25, adsMult: 0.85, crouchMult: 0.9, settle: 7 },
    penetration: 2, flinch: 0.8, slots: [], unlockLevel: 6,
    snd: { pitch: 0.9, body: 1.0, crack: 1.0, tail: 0.6, gain: 0.95 },
    model: { len: 0.24, barrel: 0.05, stock: 0, mag: 0.1, bulk: 0.85, scope: 0 },
  },
  {
    id: 'cinder', name: 'Cinder Auto', cls: 'machinePistol', role: 'Machine pistol', slot: 'sidearm',
    desc: 'Machine pistol. Empties its small magazine in a blink and climbs like a startled gull.',
    fire: 'auto', rpm: 1000, pellets: 1, dmgNear: 21, dmgFar: 12, rangeNear: 8, rangeFar: 20, mult: M,
    mag: 18, reserve: 54, reload: { tactical: 1.5, empty: 1.75, outAt: 0.3, inAt: 0.72 },
    adsTime: 0.15, adsZoom: 1.15, adsMove: 0.9, sprintOut: 0.15, swapTime: 0.3, moveMult: 1.0,
    hip: { base: 1.8, max: 6, perShot: 0.6, move: 0.8, recover: 8 }, adsSpread: 0.3,
    recoil: { up: 0.95, side: [0.3, -0.36, 0.4, 0.3, -0.44, -0.3, 0.4], variance: 0.3, adsMult: 0.9, crouchMult: 0.9, settle: 9 },
    penetration: 0.8, flinch: 0.3, slots: [], unlockLevel: 11,
    snd: { pitch: 1.7, body: 0.45, crack: 0.9, tail: 0.25, gain: 0.7 },
    model: { len: 0.23, barrel: 0.03, stock: 0, mag: 0.16, bulk: 0.78, scope: 0 },
  },
];

export const WEAPONS: WeaponDef[] = defs.map((d, i) => ({ ...d, idx: i }));
export const WEAPON_BY_ID: Record<string, WeaponDef> = Object.fromEntries(WEAPONS.map((w) => [w.id, w]));
export const PRIMARIES = WEAPONS.filter((w) => w.slot === 'primary');
export const SIDEARMS = WEAPONS.filter((w) => w.slot === 'sidearm');

// ---------------------------------------------------------------- attachments
export interface AttachmentDef {
  id: string;
  slot: AttachSlot;
  name: string;
  pros: string[];
  cons: string[];
  unlockLevel: number;
  mods: Partial<{
    adsTime: number; // multipliers unless noted
    range: number;
    recoilUp: number;
    recoilSide: number;
    hip: number;
    mag: number;
    reload: number;
    adsMove: number;
    sprintOut: number;
    reserveMags: number; // additive magazines
    suppressed: boolean;
    zoom: number; // absolute
    flinch: number;
    bloom: number;
    variance: number;
    cleanSight: boolean;
  }>;
}

export const ATTACHMENTS: AttachmentDef[] = [
  { id: 'reflex', slot: 'optic', name: 'Reflex Sight', unlockLevel: 1, pros: ['Clear open sight picture'], cons: ['ADS time +8%'], mods: { adsTime: 1.08, cleanSight: true } },
  { id: 'optic2x', slot: 'optic', name: '2× Optic', unlockLevel: 5, pros: ['2× zoom for long lanes'], cons: ['ADS time +15%', 'ADS move speed −6%'], mods: { adsTime: 1.15, adsMove: 0.94, zoom: 2, cleanSight: true } },
  { id: 'suppressor', slot: 'barrel', name: 'Suppressor', unlockLevel: 3, pros: ['Firing does not reveal you on the minimap', 'Quieter report'], cons: ['Range −15%', 'ADS time +5%'], mods: { suppressed: true, range: 0.85, adsTime: 1.05 } },
  { id: 'compensator', slot: 'barrel', name: 'Compensator', unlockLevel: 8, pros: ['Vertical recoil −18%'], cons: ['Hip spread +10%', 'Recoil variance +15%'], mods: { recoilUp: 0.82, hip: 1.1, variance: 1.15 } },
  { id: 'lightbarrel', slot: 'barrel', name: 'Light Barrel', unlockLevel: 12, pros: ['ADS time −10%', 'Sprint-to-fire −10%'], cons: ['Range −10%', 'Recoil +8%'], mods: { adsTime: 0.9, sprintOut: 0.9, range: 0.9, recoilUp: 1.08, recoilSide: 1.08 } },
  { id: 'angledgrip', slot: 'underbarrel', name: 'Angled Grip', unlockLevel: 2, pros: ['Lateral recoil −22%'], cons: ['ADS move speed −5%'], mods: { recoilSide: 0.78, adsMove: 0.95 } },
  { id: 'stablegrip', slot: 'underbarrel', name: 'Stable Grip', unlockLevel: 9, pros: ['Vertical recoil −10%', 'Hip bloom −15%'], cons: ['ADS time +7%'], mods: { recoilUp: 0.9, bloom: 0.85, adsTime: 1.07 } },
  { id: 'extmag', slot: 'magazine', name: 'Extended Magazine', unlockLevel: 6, pros: ['Magazine +33%'], cons: ['Reload time +12%', 'ADS time +4%'], mods: { mag: 1.334, reload: 1.12, adsTime: 1.04 } },
  { id: 'quickmag', slot: 'magazine', name: 'Quick Magazine', unlockLevel: 14, pros: ['Reload time −22%'], cons: ['One fewer reserve magazine'], mods: { reload: 0.78, reserveMags: -1 } },
  { id: 'lightstock', slot: 'stock', name: 'Light Stock', unlockLevel: 4, pros: ['ADS move speed +12%', 'Sprint-to-fire −12%'], cons: ['Recoil +10%'], mods: { adsMove: 1.12, sprintOut: 0.88, recoilUp: 1.1, recoilSide: 1.1 } },
  { id: 'fixedstock', slot: 'stock', name: 'Fixed Stock', unlockLevel: 15, pros: ['Recoil −10%', 'Flinch −30%'], cons: ['ADS move speed −8%', 'ADS time +5%'], mods: { recoilUp: 0.9, recoilSide: 0.9, flinch: 0.7, adsMove: 0.92, adsTime: 1.05 } },
];
export const ATTACHMENT_BY_ID: Record<string, AttachmentDef> = Object.fromEntries(ATTACHMENTS.map((a) => [a.id, a]));
export const MAX_ATTACHMENTS = 3;

/** Fully resolved weapon numbers after attachments (perks are applied in the player step). */
export interface WeaponStats {
  def: WeaponDef;
  attachments: string[];
  interval: number;
  mag: number;
  reserve: number;
  rangeNear: number;
  rangeFar: number;
  adsTime: number;
  adsZoom: number;
  adsMove: number;
  sprintOut: number;
  swapTime: number;
  reloadMul: number;
  hipMul: number;
  bloomMul: number;
  recoilUp: number;
  recoilSideMul: number;
  variance: number;
  flinch: number;
  suppressed: boolean;
  cleanSight: boolean;
}

export function resolveWeapon(def: WeaponDef, attachmentIds: string[]): WeaponStats {
  const s: WeaponStats = {
    def,
    attachments: attachmentIds.slice(),
    interval: 60 / def.rpm,
    mag: def.mag,
    reserve: def.reserve,
    rangeNear: def.rangeNear,
    rangeFar: def.rangeFar,
    adsTime: def.adsTime,
    adsZoom: def.adsZoom,
    adsMove: def.adsMove,
    sprintOut: def.sprintOut,
    swapTime: def.swapTime,
    reloadMul: 1,
    hipMul: 1,
    bloomMul: 1,
    recoilUp: def.recoil.up,
    recoilSideMul: 1,
    variance: def.recoil.variance,
    flinch: def.flinch,
    suppressed: false,
    cleanSight: false,
  };
  let reserveMags = 0;
  for (const id of attachmentIds) {
    const a = ATTACHMENT_BY_ID[id];
    if (!a) continue;
    const m = a.mods;
    if (m.adsTime) s.adsTime *= m.adsTime;
    if (m.range) { s.rangeNear *= m.range; s.rangeFar *= m.range; }
    if (m.recoilUp) s.recoilUp *= m.recoilUp;
    if (m.recoilSide) s.recoilSideMul *= m.recoilSide;
    if (m.hip) s.hipMul *= m.hip;
    if (m.bloom) s.bloomMul *= m.bloom;
    if (m.mag) s.mag = Math.round(s.mag * m.mag);
    if (m.reload) s.reloadMul *= m.reload;
    if (m.adsMove) s.adsMove *= m.adsMove;
    if (m.sprintOut) s.sprintOut *= m.sprintOut;
    if (m.reserveMags) reserveMags += m.reserveMags;
    if (m.suppressed) s.suppressed = true;
    if (m.zoom) s.adsZoom = m.zoom;
    if (m.flinch) s.flinch *= m.flinch;
    if (m.variance) s.variance *= m.variance;
    if (m.cleanSight) s.cleanSight = true;
  }
  s.reserve = Math.max(s.mag, def.reserve + reserveMags * def.mag);
  s.adsMove = Math.min(0.95, s.adsMove);
  return s;
}

/** Damage for a single projectile at a distance and hit zone. 0 = head, 1 = upper, 2 = lower, 3 = limb. */
export function damageAt(st: WeaponStats, dist: number, zone: number): number {
  const d = st.def;
  let base: number;
  if (dist <= st.rangeNear) base = d.dmgNear;
  else if (dist >= st.rangeFar) base = d.dmgFar;
  else base = d.dmgNear + ((d.dmgFar - d.dmgNear) * (dist - st.rangeNear)) / (st.rangeFar - st.rangeNear);
  let mult = zone === 0 ? d.mult.head : zone === 1 ? d.mult.upper : zone === 2 ? d.mult.lower : d.mult.limb;
  if (d.lethalRange !== undefined && dist > d.lethalRange) mult = Math.min(mult, 1.0);
  return base * mult;
}

/** Plain-language 0..1 bars for the loadout editor (exact numbers are shown alongside). */
export function statBars(st: WeaponStats): { damage: number; range: number; fireRate: number; control: number; handling: number; mobility: number } {
  const d = st.def;
  const dps = (d.dmgNear * d.pellets * d.rpm) / 60;
  const recoilScore = st.recoilUp * (d.fire === 'auto' ? d.rpm / 600 : 0.6) + 2.2 * st.recoilSideMul * avgAbs(d.recoil.side);
  return {
    damage: clamp01(d.fire === 'auto' ? dps / 420 : (d.dmgNear * d.pellets) / 120),
    range: clamp01(st.rangeFar / 90),
    fireRate: clamp01(d.rpm / 1000),
    control: clamp01(1 - recoilScore / 2.6),
    handling: clamp01(1 - (st.adsTime - 0.12) / 0.26),
    mobility: clamp01((d.moveMult - 0.86) / 0.14 * 0.6 + (st.adsMove - 0.55) / 0.4 * 0.4),
  };
}
function avgAbs(a: number[]): number { let s = 0; for (const v of a) s += Math.abs(v); return s / Math.max(1, a.length); }
function clamp01(v: number): number { return Math.max(0.04, Math.min(1, v)); }
