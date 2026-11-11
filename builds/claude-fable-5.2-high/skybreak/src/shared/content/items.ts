// shared-content: consumables, utilities and inventory rules.
import type { AmmoType, WeaponId } from "./weapons";

export type ItemId =
  | "injector"
  | "trauma"
  | "flask"
  | "cell"
  | "mist"
  | "grapple"
  | "beacon"
  | "orb";

export const ITEM_IDS: readonly ItemId[] = ["injector", "trauma", "flask", "cell", "mist", "grapple", "beacon", "orb"];

export interface ItemDef {
  id: ItemId;
  name: string;
  kind: "heal" | "shield" | "utility" | "throw";
  stack: number;
  /** Seconds of channel before the effect lands (0 = instant on fire). */
  useTime: number;
  /** Movement multiplier while channelling. */
  moveMult: number;
  /** Cancelled when the user takes damage. */
  interruptible: boolean;
  desc: string;
  color: string;
}

export const ITEMS: Record<ItemId, ItemDef> = {
  injector: { id: "injector", name: "Med Injector", kind: "heal", stack: 4, useTime: 3, moveMult: 0.6, interruptible: false, desc: "Restores 35 Health over 3 s. Movement slowed.", color: "#ff6b7a" },
  trauma: { id: "trauma", name: "Trauma Kit", kind: "heal", stack: 2, useTime: 7, moveMult: 0.35, interruptible: true, desc: "Restores Health to 100 over 7 s. Cancelled by damage.", color: "#ff8f5a" },
  flask: { id: "flask", name: "Shield Flask", kind: "shield", stack: 4, useTime: 2.5, moveMult: 0.7, interruptible: false, desc: "Restores 25 Reserve Shield (max 50).", color: "#56c8ff" },
  cell: { id: "cell", name: "Aegis Cell", kind: "shield", stack: 2, useTime: 3, moveMult: 0.7, interruptible: false, desc: "Starts Aegis recharge immediately after a 3 s use.", color: "#7af0e0" },
  mist: { id: "mist", name: "Mist Capsule", kind: "throw", stack: 2, useTime: 0, moveMult: 1, interruptible: false, desc: "Thrown. Creates a cloud of visual cover for 12 s.", color: "#dfe6f5" },
  grapple: { id: "grapple", name: "Grapple Spool", kind: "utility", stack: 3, useTime: 0, moveMult: 1, interruptible: false, desc: "Pulls you to terrain within 45 m. Three charges.", color: "#e0a050" },
  beacon: { id: "beacon", name: "Echo Beacon", kind: "utility", stack: 2, useTime: 0.6, moveMult: 0.8, interruptible: false, desc: "Reveals recent movement trails nearby for 8 s.", color: "#c79bff" },
  orb: { id: "orb", name: "Wind Orb", kind: "throw", stack: 3, useTime: 0, moveMult: 1, interruptible: false, desc: "Thrown. Concussive burst shoves everyone nearby.", color: "#9fe8c8" },
};

export const INVENTORY_SLOTS = 5;

export type Slot =
  | null
  | { kind: "weapon"; weapon: WeaponId; rarity: number; mag: number }
  | { kind: "item"; item: ItemId; count: number };

export interface LootDesc {
  kind: "weapon" | "item" | "ammo";
  weapon?: WeaponId;
  rarity?: number;
  mag?: number;
  /** Reserve ammo bundled with a freshly spawned weapon. */
  bonus?: number;
  item?: ItemId;
  ammo?: AmmoType;
  count: number;
}

export const HEALTH_MAX = 100;
export const AEGIS_MAX = 50;
export const RESERVE_MAX = 50;
export const AEGIS_DELAY = 8;
export const AEGIS_RATE = 10;

export const MIST_RADIUS = 7.5;
export const MIST_DURATION = 12;
export const GRAPPLE_RANGE = 45;
export const GRAPPLE_SPEED = 26;
export const BEACON_RADIUS = 60;
export const BEACON_DURATION = 8;
export const ORB_RADIUS = 6;
export const ORB_IMPULSE = 15;
export const ORB_DAMAGE = 12;
