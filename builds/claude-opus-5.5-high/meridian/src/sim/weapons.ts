// Weapons, gadgets, inventory and economy rules (pure data + functions).

export type WeaponId = "fists" | "baton" | "pistol" | "mpistol" | "stun" | "carbine" | "shotgun" | "marksman";
export type GadgetId = "smoke" | "chirper";
export type AmmoType = "pistol" | "rifle" | "shell" | "stun";
export type Slot = "melee" | "sidearm" | "long";

export interface WeaponSpec {
  id: WeaponId;
  name: string;
  slot: Slot | "none";
  lethal: boolean;
  damage: number;
  interval: number; // seconds between shots
  mag: number;
  ammo: AmmoType | null;
  reload: number;
  spread: number; // radians (hip)
  aimSpread: number;
  recoil: number;
  range: number;
  falloff: number; // distance damage starts to drop
  pellets: number;
  auto: boolean;
  price: number;
  trust: number; // Trust level required to stock it in the locker
  loudness: number; // hearing radius (m)
  desc: string;
}

export const WEAPONS: Record<WeaponId, WeaponSpec> = {
  fists: { id: "fists", name: "Unarmed", slot: "none", lethal: false, damage: 12, interval: 0.55, mag: 0, ammo: null, reload: 0, spread: 0, aimSpread: 0, recoil: 0, range: 1.6, falloff: 2, pellets: 1, auto: false, price: 0, trust: 0, loudness: 6, desc: "Shove and punch. Nonlethal." },
  baton: { id: "baton", name: "Telescoping Baton", slot: "melee", lethal: false, damage: 34, interval: 0.6, mag: 0, ammo: null, reload: 0, spread: 0, aimSpread: 0, recoil: 0, range: 2.0, falloff: 3, pellets: 1, auto: false, price: 0, trust: 0, loudness: 6, desc: "Melee. Takedown from behind subdues instantly. Nonlethal." },
  stun: { id: "stun", name: "Arc Stun Projector", slot: "sidearm", lethal: false, damage: 0, interval: 0.9, mag: 2, ammo: "stun", reload: 1.6, spread: 0.012, aimSpread: 0.004, recoil: 0.01, range: 16, falloff: 16, pellets: 1, auto: false, price: 0, trust: 0, loudness: 12, desc: "Short-range nonlethal. Stuns people for 8 s, disables cameras for 20 s." },
  pistol: { id: "pistol", name: "Harbor Compact 9", slot: "sidearm", lethal: true, damage: 26, interval: 0.22, mag: 12, ammo: "pistol", reload: 1.3, spread: 0.035, aimSpread: 0.008, recoil: 0.025, range: 70, falloff: 25, pellets: 1, auto: false, price: 400, trust: 1, loudness: 60, desc: "Reliable sidearm. Lethal." },
  mpistol: { id: "mpistol", name: "Skiff MP-7 Machine Pistol", slot: "sidearm", lethal: true, damage: 17, interval: 0.075, mag: 24, ammo: "pistol", reload: 1.7, spread: 0.06, aimSpread: 0.025, recoil: 0.018, range: 45, falloff: 15, pellets: 1, auto: true, price: 900, trust: 3, loudness: 60, desc: "High rate of fire, poor at range. Lethal." },
  carbine: { id: "carbine", name: "Quayguard Carbine", slot: "long", lethal: true, damage: 30, interval: 0.11, mag: 30, ammo: "rifle", reload: 2.1, spread: 0.05, aimSpread: 0.01, recoil: 0.02, range: 120, falloff: 50, pellets: 1, auto: true, price: 1400, trust: 2, loudness: 80, desc: "Automatic long gun. Lethal." },
  shotgun: { id: "shotgun", name: "Gull Pump Shotgun", slot: "long", lethal: true, damage: 14, interval: 0.85, mag: 6, ammo: "shell", reload: 2.6, spread: 0.11, aimSpread: 0.075, recoil: 0.07, range: 30, falloff: 8, pellets: 8, auto: false, price: 1100, trust: 2, loudness: 80, desc: "Devastating up close. Lethal." },
  marksman: { id: "marksman", name: "Longwatch Marksman", slot: "long", lethal: true, damage: 85, interval: 1.0, mag: 5, ammo: "rifle", reload: 2.6, spread: 0.08, aimSpread: 0.0015, recoil: 0.06, range: 220, falloff: 150, pellets: 1, auto: false, price: 2200, trust: 3, loudness: 90, desc: "Precise at long range. Lethal." },
};

export const GADGETS: Record<GadgetId, { name: string; price: number; max: number; desc: string }> = {
  smoke: { name: "Smoke Canister", price: 60, max: 2, desc: "Blocks sight lines for 14 s. Breaks police visual." },
  chirper: { name: "Distraction Chirper", price: 30, max: 3, desc: "Chirps for 8 s. Draws guards, interrupts witness calls." },
};

export const AMMO_MAX: Record<AmmoType, number> = { pistol: 180, rifle: 180, shell: 48, stun: 12 };
export const AMMO_PACK: Record<AmmoType, { qty: number; price: number; name: string }> = {
  pistol: { qty: 36, price: 45, name: "9 mm box" },
  rifle: { qty: 30, price: 70, name: "Rifle magazine pack" },
  shell: { qty: 12, price: 55, name: "Shell box" },
  stun: { qty: 4, price: 40, name: "Stun cells" },
};
export const MEDKIT_PRICE = 80;
export const MEDKIT_MAX = 2;
export const ARMOR_PRICE = 150;
export const ARMOR_MAX = 50;
export const GARAGE_SLOT_PRICE = 500;

export interface OutfitDef { id: number; name: string; top: [number, number, number]; bottom: [number, number, number]; accent: [number, number, number]; hat: boolean; price: number; trust: number }
export const OUTFITS: OutfitDef[] = [
  { id: 0, name: "Courier Teal", top: [0.12, 0.55, 0.58], bottom: [0.18, 0.2, 0.25], accent: [0.98, 0.55, 0.15], hat: false, price: 0, trust: 0 },
  { id: 1, name: "Dockside Canvas", top: [0.62, 0.5, 0.32], bottom: [0.25, 0.28, 0.3], accent: [0.9, 0.9, 0.85], hat: true, price: 120, trust: 0 },
  { id: 2, name: "Market Stripe", top: [0.85, 0.82, 0.75], bottom: [0.32, 0.22, 0.2], accent: [0.2, 0.35, 0.65], hat: false, price: 120, trust: 0 },
  { id: 3, name: "Glassline Grey", top: [0.35, 0.37, 0.4], bottom: [0.15, 0.15, 0.17], accent: [0.8, 0.8, 0.82], hat: false, price: 180, trust: 1 },
  { id: 4, name: "Lantern Night", top: [0.18, 0.15, 0.3], bottom: [0.1, 0.1, 0.12], accent: [0.95, 0.75, 0.3], hat: true, price: 220, trust: 2 },
];

export interface Inventory {
  cash: number;
  trust: number;
  trustXp: number;
  sidearm: WeaponId | null;
  long: WeaponId | null;
  melee: WeaponId | null;
  gadgets: Record<GadgetId, number>;
  selectedGadget: GadgetId;
  ammo: Record<AmmoType, number>;
  mags: Partial<Record<WeaponId, number>>;
  medkits: number;
  armor: number;
  unlocked: WeaponId[];
  outfits: number[];
  outfit: number;
  missionItems: string[];
  garageSlot: boolean;
  ownedVehicle: { model: string; color: [number, number, number] } | null;
}

export function newInventory(): Inventory {
  return {
    cash: 150, trust: 0, trustXp: 0,
    sidearm: "stun", long: null, melee: "baton",
    gadgets: { smoke: 0, chirper: 1 }, selectedGadget: "chirper",
    ammo: { pistol: 0, rifle: 0, shell: 0, stun: 6 },
    mags: { stun: 2 },
    medkits: 1, armor: 0,
    unlocked: ["stun", "baton"],
    outfits: [0], outfit: 0,
    missionItems: [], garageSlot: false, ownedVehicle: null,
  };
}

export type ShopItem =
  | { kind: "ammo"; ammo: AmmoType }
  | { kind: "medkit" }
  | { kind: "armor" }
  | { kind: "gadget"; gadget: GadgetId }
  | { kind: "weapon"; weapon: WeaponId }
  | { kind: "outfit"; outfit: number }
  | { kind: "garageSlot" };

export function itemPrice(it: ShopItem): number {
  switch (it.kind) {
    case "ammo": return AMMO_PACK[it.ammo].price;
    case "medkit": return MEDKIT_PRICE;
    case "armor": return ARMOR_PRICE;
    case "gadget": return GADGETS[it.gadget].price;
    case "weapon": return WEAPONS[it.weapon].price;
    case "outfit": return OUTFITS[it.outfit].price;
    case "garageSlot": return GARAGE_SLOT_PRICE;
  }
}

/** Why a purchase is unavailable, or null if allowed. */
export function canBuy(inv: Inventory, it: ShopItem): string | null {
  const price = itemPrice(it);
  switch (it.kind) {
    case "ammo": if (inv.ammo[it.ammo] >= AMMO_MAX[it.ammo]) return "Ammo full"; break;
    case "medkit": if (inv.medkits >= MEDKIT_MAX) return "Carrying max (2)"; break;
    case "armor": if (inv.armor >= ARMOR_MAX) return "Armor full"; break;
    case "gadget": if (inv.gadgets[it.gadget] >= GADGETS[it.gadget].max) return "Carrying max"; break;
    case "weapon":
      if (inv.unlocked.includes(it.weapon)) return "Owned";
      if (inv.trust < WEAPONS[it.weapon].trust) return `Requires Trust ${WEAPONS[it.weapon].trust}`;
      break;
    case "outfit":
      if (inv.outfits.includes(it.outfit)) return "Owned";
      if (inv.trust < OUTFITS[it.outfit].trust) return `Requires Trust ${OUTFITS[it.outfit].trust}`;
      break;
    case "garageSlot": if (inv.garageSlot) return "Owned"; break;
  }
  if (inv.cash < price) return "Not enough cash";
  return null;
}

export function buy(inv: Inventory, it: ShopItem): boolean {
  if (canBuy(inv, it)) return false;
  inv.cash -= itemPrice(it);
  switch (it.kind) {
    case "ammo": inv.ammo[it.ammo] = Math.min(AMMO_MAX[it.ammo], inv.ammo[it.ammo] + AMMO_PACK[it.ammo].qty); break;
    case "medkit": inv.medkits++; break;
    case "armor": inv.armor = ARMOR_MAX; break;
    case "gadget": inv.gadgets[it.gadget]++; break;
    case "weapon": inv.unlocked.push(it.weapon); equip(inv, it.weapon); break;
    case "outfit": inv.outfits.push(it.outfit); break;
    case "garageSlot": inv.garageSlot = true; break;
  }
  return true;
}

/** Put an unlocked weapon in its carry slot (one sidearm, one long gun, one melee). */
export function equip(inv: Inventory, w: WeaponId) {
  const s = WEAPONS[w];
  if (!inv.unlocked.includes(w)) return false;
  if (s.slot === "sidearm") inv.sidearm = w;
  else if (s.slot === "long") inv.long = w;
  else if (s.slot === "melee") inv.melee = w;
  if (inv.mags[w] === undefined) inv.mags[w] = 0;
  return true;
}

export function carried(inv: Inventory): WeaponId[] {
  const out: WeaponId[] = ["fists"];
  if (inv.melee) out.push(inv.melee);
  if (inv.sidearm) out.push(inv.sidearm);
  if (inv.long) out.push(inv.long);
  return out;
}

export function reloadInto(inv: Inventory, w: WeaponId): number {
  const s = WEAPONS[w];
  if (!s.ammo) return 0;
  const cur = inv.mags[w] ?? 0;
  const need = s.mag - cur;
  const take = Math.min(need, inv.ammo[s.ammo]);
  inv.ammo[s.ammo] -= take;
  inv.mags[w] = cur + take;
  return take;
}

export const TRUST_THRESHOLDS = [0, 100, 250, 450, 700, 1000];

export function addTrust(inv: Inventory, xp: number): number {
  const before = inv.trust;
  inv.trustXp += xp;
  while (inv.trust < 5 && inv.trustXp >= TRUST_THRESHOLDS[inv.trust + 1]) inv.trust++;
  return inv.trust - before;
}

/** Damage falloff with distance. */
export function damageAt(spec: WeaponSpec, dist: number): number {
  if (dist <= spec.falloff) return spec.damage;
  if (dist >= spec.range) return 0;
  const t = (dist - spec.falloff) / (spec.range - spec.falloff);
  return spec.damage * (1 - 0.6 * t);
}

export type HitZone = "head" | "torso" | "limb";
export const ZONE_MULT: Record<HitZone, number> = { head: 2.4, torso: 1, limb: 0.6 };
export function zoneFor(relY: number, height = 1.8): HitZone {
  if (relY > height * 0.84) return "head";
  if (relY > height * 0.45) return "torso";
  return "limb";
}

/** Player damage application: armor absorbs 70% until depleted. Returns health damage. */
export function applyArmor(health: number, armor: number, dmg: number): { health: number; armor: number } {
  const toArmor = Math.min(armor, dmg * 0.7);
  return { armor: armor - toArmor, health: Math.max(0, health - (dmg - toArmor)) };
}
