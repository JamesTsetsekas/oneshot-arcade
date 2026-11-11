// Attachments, perks, equipment and Momentum support actions.
// Rule enforced by tests: nothing here may raise max health, universal damage, or headshot multiplier.

export type AttachmentSlot = "optic" | "barrel" | "underbarrel" | "magazine" | "stock";

export interface StatMods {
  adsTime?: number;      // multiplier
  adsZoom?: number;      // replaces zoom when set (optics)
  adsMove?: number;      // multiplier
  recoil?: number;       // multiplier on vertical+horizontal
  recoilH?: number;      // multiplier on horizontal only
  hipSpread?: number;    // multiplier
  adsSpread?: number;    // multiplier
  mag?: number;          // multiplier (rounded)
  reload?: number;       // multiplier on reload times
  range?: number;        // multiplier on falloff ranges
  suppressed?: boolean;
  flashScale?: number;   // visual muzzle flash size
  sprintToFire?: number; // multiplier
}

export interface AttachmentDef {
  id: string; name: string; slot: AttachmentSlot; mods: StatMods;
  pro: string; con: string; unlockLevel: number;
  classes: string[]; // allowed weapon classes
}

const ALL_GUNS = ["rifle", "smg", "battle", "shotgun", "lmg", "marksman", "pistol", "heavyPistol", "machinePistol"];
const LONG = ["rifle", "smg", "battle", "shotgun", "lmg", "marksman"];
const AUTO_LONG = ["rifle", "smg", "battle", "lmg"];

export const ATTACHMENTS: Record<string, AttachmentDef> = {
  reflex: { id: "reflex", name: "Reflex Sight", slot: "optic", mods: { adsZoom: 1.25, adsTime: 0.97 }, pro: "Clear dot, slightly faster ADS", con: "Less magnification than iron sights on rifles", unlockLevel: 1, classes: ALL_GUNS.filter((c) => c !== "marksman") },
  optic2x: { id: "optic2x", name: "2× Tube Optic", slot: "optic", mods: { adsZoom: 2.0, adsTime: 1.15, adsMove: 0.94 }, pro: "2× magnification", con: "+15% ADS time, slower ADS movement", unlockLevel: 4, classes: ["rifle", "battle", "lmg", "smg"] },
  suppressor: { id: "suppressor", name: "Suppressor", slot: "barrel", mods: { suppressed: true, range: 0.82, flashScale: 0.2 }, pro: "Hidden from enemy minimap when firing", con: "-18% damage range", unlockLevel: 6, classes: ALL_GUNS.filter((c) => c !== "shotgun") },
  compensator: { id: "compensator", name: "Compensator", slot: "barrel", mods: { recoil: 0.8, flashScale: 1.6 }, pro: "-20% recoil", con: "Large, visible muzzle flash", unlockLevel: 2, classes: AUTO_LONG.concat(["machinePistol", "heavyPistol"]) },
  lightBarrel: { id: "lightBarrel", name: "Light Barrel", slot: "barrel", mods: { adsTime: 0.9, hipSpread: 1.15, range: 0.92 }, pro: "-10% ADS time", con: "+15% hip spread, -8% range", unlockLevel: 8, classes: LONG },
  angledGrip: { id: "angledGrip", name: "Angled Grip", slot: "underbarrel", mods: { adsTime: 0.88, recoil: 1.08 }, pro: "-12% ADS time", con: "+8% recoil", unlockLevel: 3, classes: AUTO_LONG.concat(["shotgun"]) },
  stableGrip: { id: "stableGrip", name: "Stable Grip", slot: "underbarrel", mods: { recoil: 0.82, adsMove: 0.92 }, pro: "-18% recoil", con: "-8% ADS movement speed", unlockLevel: 1, classes: AUTO_LONG.concat(["marksman"]) },
  extMag: { id: "extMag", name: "Extended Magazine", slot: "magazine", mods: { mag: 1.5, reload: 1.2 }, pro: "+50% magazine", con: "+20% reload time", unlockLevel: 5, classes: ALL_GUNS.filter((c) => c !== "marksman") },
  quickMag: { id: "quickMag", name: "Quick Magazine", slot: "magazine", mods: { reload: 0.75, adsTime: 1.05 }, pro: "-25% reload time", con: "+5% ADS time", unlockLevel: 10, classes: ALL_GUNS },
  lightStock: { id: "lightStock", name: "Light Stock", slot: "stock", mods: { adsMove: 1.12, recoil: 1.1, sprintToFire: 0.9 }, pro: "+12% ADS movement, faster sprint-to-fire", con: "+10% recoil", unlockLevel: 7, classes: LONG },
  fixedStock: { id: "fixedStock", name: "Fixed Stock", slot: "stock", mods: { recoil: 0.88, adsTime: 1.08 }, pro: "-12% recoil", con: "+8% ADS time", unlockLevel: 11, classes: LONG },
};

export const MAX_ATTACHMENTS = 3;

// ---------------- Perks ----------------
export type PerkGroup = "mobility" | "awareness" | "sustain";
export interface PerkDef { id: string; name: string; group: PerkGroup; desc: string; unlockLevel: number }

export const PERKS: Record<string, PerkDef> = {
  fleetBoots: { id: "fleetBoots", name: "Fleet Boots", group: "mobility", desc: "Sprint engages instantly and sprint-to-fire is 25% faster.", unlockLevel: 1 },
  quickMantle: { id: "quickMantle", name: "Quick Mantle", group: "mobility", desc: "Mantles complete 40% faster.", unlockLevel: 6 },
  lightKit: { id: "lightKit", name: "Light Kit", group: "mobility", desc: "+12% movement speed while aiming down sights.", unlockLevel: 13 },
  traceReader: { id: "traceReader", name: "Trace Reader", group: "awareness", desc: "Sprinting enemies leave footprints visible to you for 4 s.", unlockLevel: 1 },
  signalFilter: { id: "signalFilter", name: "Signal Filter", group: "awareness", desc: "Enemy Recon Sweeps, Hunter Drones and Signal Darts reveal you for 50% less time.", unlockLevel: 8 },
  munitionsEye: { id: "munitionsEye", name: "Munitions Eye", group: "awareness", desc: "See enemy charges and mines highlighted within 20 m.", unlockLevel: 15 },
  rapidReady: { id: "rapidReady", name: "Rapid Ready", group: "sustain", desc: "Weapon swaps are 35% faster.", unlockLevel: 1 },
  fieldPatch: { id: "fieldPatch", name: "Field Patch", group: "sustain", desc: "Health regeneration begins 0.8 s sooner.", unlockLevel: 5 },
  scavengerRig: { id: "scavengerRig", name: "Scavenger Rig", group: "sustain", desc: "Eliminations refill one magazine of reserve ammo (ammo only).", unlockLevel: 10 },
};

// ---------------- Equipment ----------------
export type EquipmentKind = "lethal" | "tactical";
export interface EquipmentDef {
  id: string; name: string; kind: EquipmentKind; desc: string; unlockLevel: number;
  fuse: number; radius: number; damage: number; recharge: number; cookable?: boolean; sticky?: boolean; placed?: boolean;
  throwSpeed: number;
}

export const EQUIPMENT: Record<string, EquipmentDef> = {
  frag: { id: "frag", name: "Frag Charge", kind: "lethal", desc: "Bouncing fragmentation charge. Hold to cook (3 s fuse).", unlockLevel: 1, fuse: 3.0, radius: 6.5, damage: 130, recharge: 28, cookable: true, throwSpeed: 17 },
  adhesive: { id: "adhesive", name: "Adhesive Charge", kind: "lethal", desc: "Sticks on impact, 1.6 s fuse, smaller radius.", unlockLevel: 6, fuse: 1.6, radius: 4.2, damage: 140, recharge: 28, sticky: true, throwSpeed: 16 },
  breachMine: { id: "breachMine", name: "Breach Mine", kind: "lethal", desc: "Placed directional mine with a visible laser trip line.", unlockLevel: 10, fuse: 0.45, radius: 4.5, damage: 150, recharge: 32, placed: true, throwSpeed: 4 },
  flash: { id: "flash", name: "Flash Pulse", kind: "tactical", desc: "Blinds anyone with line of sight, scaled by view angle.", unlockLevel: 1, fuse: 1.4, radius: 16, damage: 0, recharge: 22, throwSpeed: 17 },
  obscurant: { id: "obscurant", name: "Obscurant Canister", kind: "tactical", desc: "Opaque 5.5 m field for 12 s. Blocks sight for everyone.", unlockLevel: 4, fuse: 1.0, radius: 5.5, damage: 0, recharge: 26, throwSpeed: 15 },
  signalDart: { id: "signalDart", name: "Signal Dart", kind: "tactical", desc: "Sticks to surfaces; pulses enemy movement within 10 m to your team.", unlockLevel: 8, fuse: 0.3, radius: 10, damage: 0, recharge: 24, sticky: true, throwSpeed: 22 },
};

// ---------------- Momentum support ----------------
export interface SupportDef { id: string; name: string; tier: 3 | 5 | 8; desc: string; counter: string; unlockLevel: number }
export const SUPPORT: Record<string, SupportDef> = {
  reconSweep: { id: "reconSweep", name: "Recon Sweep", tier: 3, desc: "Three minimap pulses reveal enemies.", counter: "Signal Filter halves reveal time.", unlockLevel: 1 },
  ammoPod: { id: "ammoPod", name: "Ammo Pod", tier: 3, desc: "Deployable pod refills nearby teammates' ammo for 40 s.", counter: "Destructible (150 HP).", unlockLevel: 9 },
  hunterDrone: { id: "hunterDrone", name: "Hunter Drone", tier: 5, desc: "30 s hovering drone marks enemies it can see. Never fires.", counter: "Shoot it down (120 HP).", unlockLevel: 1 },
  mortarMark: { id: "mortarMark", name: "Mortar Mark", tier: 5, desc: "Two telegraphed shells on an outdoor target you aim at.", counter: "Red ground marker and whistle; get indoors.", unlockLevel: 11 },
  interdictionFlight: { id: "interdictionFlight", name: "Interdiction Flight", tier: 8, desc: "One strafing pass along your facing direction after a loud warning.", counter: "Get under a roof; warning siren 3 s ahead.", unlockLevel: 1 },
  teamUplink: { id: "teamUplink", name: "Team Uplink", tier: 8, desc: "20 s of 3× equipment recharge and shared assists for your team.", counter: "Short duration; one Tier-8 per team.", unlockLevel: 16 },
};
