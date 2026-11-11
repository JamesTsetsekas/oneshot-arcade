// Perks, equipment and Momentum support actions (content-data).

export type PerkGroup = "mobility" | "awareness" | "sustain";
export interface PerkDef { id: string; name: string; group: PerkGroup; desc: string; tradeoff: string }

export const PERKS: Record<string, PerkDef> = Object.fromEntries(([
  { id: "fleet", name: "Fleet Boots", group: "mobility", desc: "+4% movement and sprint speed.", tradeoff: "Footsteps are 15% louder." },
  { id: "quickmantle", name: "Quick Mantle", group: "mobility", desc: "Mantle 35% faster.", tradeoff: "No movement bonus on flat ground." },
  { id: "lightkit", name: "Light Kit", group: "mobility", desc: "Aimed walking is 8% faster; sprint-to-fire is 15% quicker.", tradeoff: "Equipment recharge is 10% slower." },
  { id: "tracereader", name: "Trace Reader", group: "awareness", desc: "Footprints of sprinting enemies stay on your radar for 6 s.", tradeoff: "No effect on stationary enemies." },
  { id: "signalfilter", name: "Signal Filter", group: "awareness", desc: "Scan pulses (Recon Sweep, signal dart) reveal you for 60% less time.", tradeoff: "Does nothing against raw line of sight." },
  { id: "munitions", name: "Munitions Eye", group: "awareness", desc: "Hostile equipment, mines and support devices show on your radar.", tradeoff: "Radar icons are approximate." },
  { id: "rapid", name: "Rapid Ready", group: "sustain", desc: "Weapon swaps are 25% faster.", tradeoff: "No reload bonus." },
  { id: "fieldpatch", name: "Field Patch", group: "sustain", desc: "Health regeneration starts 0.8 s sooner.", tradeoff: "Regeneration rate is unchanged." },
  { id: "scavenger", name: "Scavenger Rig", group: "sustain", desc: "One extra spare magazine for every weapon.", tradeoff: "Ammo only. No damage or health bonus." },
] as PerkDef[]).map((p) => [p.id, p]));
export const PERK_GROUPS: PerkGroup[] = ["mobility", "awareness", "sustain"];

export type EquipKind = "frag" | "adhesive" | "mine" | "flash" | "obscurant" | "dart";
export interface EquipDef {
  id: EquipKind;
  name: string;
  slot: "lethal" | "tactical";
  desc: string;
  charges: number;
  recharge: number; // seconds per charge
  fuse: number;
  radius: number;
  damage: number;
}
export const EQUIPMENT: Record<string, EquipDef> = Object.fromEntries(([
  { id: "frag", name: "Fragmentation Charge", slot: "lethal", desc: "3.5 s fuse, hold to cook. Large radius.", charges: 1, recharge: 40, fuse: 3.5, radius: 5.5, damage: 150 },
  { id: "adhesive", name: "Adhesive Charge", slot: "lethal", desc: "Sticks to surfaces and players. Smaller radius.", charges: 1, recharge: 38, fuse: 2.2, radius: 3.6, damage: 135 },
  { id: "mine", name: "Breach Mine", slot: "lethal", desc: "Directional mine with a visible laser. Arms in 1 s.", charges: 1, recharge: 55, fuse: 1.0, radius: 4.2, damage: 125 },
  { id: "flash", name: "Flash Pulse", slot: "tactical", desc: "Blinds enemies that face it with line of sight. 2 charges.", charges: 2, recharge: 20, fuse: 1.1, radius: 17, damage: 0 },
  { id: "obscurant", name: "Obscurant Canister", slot: "tactical", desc: "Opaque cloud blocks sight for 14 s. Bots and players cannot see through it.", charges: 1, recharge: 30, fuse: 0.9, radius: 5.4, damage: 0 },
  { id: "dart", name: "Signal Dart", slot: "tactical", desc: "Sticks to a surface and pulses movement of enemies within 14 m.", charges: 1, recharge: 26, fuse: 0.6, radius: 14, damage: 0 },
] as EquipDef[]).map((e) => [e.id, e]));
export const LETHAL_IDS = ["frag", "adhesive", "mine"];
export const TACTICAL_IDS = ["flash", "obscurant", "dart"];

export type SupportKind = "recon" | "ammopod" | "drone" | "mortar" | "flight" | "uplink";
export interface SupportDef {
  id: SupportKind;
  name: string;
  tier: 3 | 5 | 8;
  desc: string;
  counter: string;
  duration: number;
  needsTarget: boolean;
  outdoorOnly: boolean;
}
export const SUPPORTS: Record<string, SupportDef> = Object.fromEntries(([
  { id: "recon", name: "Recon Sweep", tier: 3, desc: "Three radar pulses reveal enemy movement.", counter: "Signal Filter shortens how long you show.", duration: 18, needsTarget: false, outdoorOnly: false },
  { id: "ammopod", name: "Ammo Pod", tier: 3, desc: "Drop a pod that refills ammo and equipment for your team. Enemies can destroy it.", counter: "Pod can be shot and destroyed.", duration: 25, needsTarget: true, outdoorOnly: false },
  { id: "drone", name: "Hunter Drone", tier: 5, desc: "30 s marking drone. Spotted enemies show to your whole team. Never fires.", counter: "Drone can be shot down.", duration: 30, needsTarget: false, outdoorOnly: false },
  { id: "mortar", name: "Mortar Mark", tier: 5, desc: "Mark an outdoor spot. Two telegraphed shells land after 3 s.", counter: "Loud whistle + ground marker. Indoors is safe.", duration: 8, needsTarget: true, outdoorOnly: true },
  { id: "flight", name: "Interdiction Flight", tier: 8, desc: "One strafing pass along a marked line, loud warning. Indoor positions are safe.", counter: "Take cover indoors. One active per team.", duration: 10, needsTarget: true, outdoorOnly: true },
  { id: "uplink", name: "Team Uplink", tier: 8, desc: "20 s: faster equipment recharge, and assists are shared. One active per team.", counter: "None needed. It is a team buff.", duration: 20, needsTarget: false, outdoorOnly: false },
] as SupportDef[]).map((s) => [s.id, s]));
export const SUPPORT_TIERS = [3, 5, 8] as const;
export const SUPPORT_BY_TIER: Record<number, string[]> = {
  3: ["recon", "ammopod"],
  5: ["drone", "mortar"],
  8: ["flight", "uplink"],
};
