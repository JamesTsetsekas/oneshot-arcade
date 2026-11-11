// content-data: perks, equipment and Momentum support actions.

export type PerkGroup = 'mobility' | 'awareness' | 'sustain';
export interface PerkDef {
  id: string;
  group: PerkGroup;
  name: string;
  desc: string;
  unlockLevel: number;
}

export const PERKS: PerkDef[] = [
  { id: 'fleet', group: 'mobility', name: 'Fleet Boots', desc: 'Sprint speed +6% and sprint starts instantly.', unlockLevel: 1 },
  { id: 'quickmantle', group: 'mobility', name: 'Quick Mantle', desc: 'Mantle ledges 30% faster.', unlockLevel: 5 },
  { id: 'lightkit', group: 'mobility', name: 'Light Kit', desc: 'ADS movement +8% and sprint-to-fire 15% faster.', unlockLevel: 12 },
  { id: 'trace', group: 'awareness', name: 'Trace Reader', desc: 'See fading footprints left by sprinting enemies.', unlockLevel: 1 },
  { id: 'filter', group: 'awareness', name: 'Signal Filter', desc: 'Recon, dart and drone reveals on you last 65% shorter.', unlockLevel: 7 },
  { id: 'munitions', group: 'awareness', name: 'Munitions Eye', desc: 'Hostile equipment and devices within 18 m are outlined on your HUD.', unlockLevel: 14 },
  { id: 'rapid', group: 'sustain', name: 'Rapid Ready', desc: 'Weapon swaps are 30% faster.', unlockLevel: 1 },
  { id: 'patch', group: 'sustain', name: 'Field Patch', desc: 'Health regeneration begins 0.8 s sooner.', unlockLevel: 8 },
  { id: 'scavenger', group: 'sustain', name: 'Scavenger Rig', desc: 'Eliminated enemies drop ammo satchels only you can collect.', unlockLevel: 16 },
];
export const PERK_BY_ID: Record<string, PerkDef> = Object.fromEntries(PERKS.map((p) => [p.id, p]));
export const PERK_GROUPS: PerkGroup[] = ['mobility', 'awareness', 'sustain'];

export interface PerkMods {
  sprintMul: number;
  sprintDelayMul: number;
  mantleMul: number;
  adsMoveMul: number;
  sprintOutMul: number;
  swapMul: number;
  regenDelayAdd: number;
  revealMul: number;
  trace: boolean;
  munitions: boolean;
  scavenger: boolean;
}

export function resolvePerks(ids: string[]): PerkMods {
  const has = (id: string) => ids.includes(id);
  return {
    sprintMul: has('fleet') ? 1.06 : 1,
    sprintDelayMul: has('fleet') ? 0 : 1,
    mantleMul: has('quickmantle') ? 0.7 : 1,
    adsMoveMul: has('lightkit') ? 1.08 : 1,
    sprintOutMul: has('lightkit') ? 0.85 : 1,
    swapMul: has('rapid') ? 0.7 : 1,
    regenDelayAdd: has('patch') ? -0.8 : 0,
    revealMul: has('filter') ? 0.35 : 1,
    trace: has('trace'),
    munitions: has('munitions'),
    scavenger: has('scavenger'),
  };
}

// ---------------------------------------------------------------- equipment
export interface EquipDef {
  id: string;
  idx: number;
  kind: 'lethal' | 'tactical';
  name: string;
  desc: string;
  recharge: number;
  fuse: number;
  cook: boolean;
  speed: number;
  radius: number;
  damage: number;
  unlockLevel: number;
}

export const EQUIPMENT: EquipDef[] = [
  { id: 'frag', idx: 0, kind: 'lethal', name: 'Fragmentation Charge', desc: 'Hold to cook, release to throw. 3 s fuse, 6.5 m blast.', recharge: 24, fuse: 3.0, cook: true, speed: 17, radius: 6.5, damage: 150, unlockLevel: 1 },
  { id: 'sticky', idx: 1, kind: 'lethal', name: 'Adhesive Charge', desc: 'Sticks where it lands and detonates 1.3 s later. Smaller 4.5 m blast.', recharge: 24, fuse: 1.3, cook: false, speed: 15, radius: 4.5, damage: 140, unlockLevel: 6 },
  { id: 'mine', idx: 2, kind: 'lethal', name: 'Breach Mine', desc: 'Directional mine with a visible laser. Triggers on enemies crossing the beam; can be shot.', recharge: 28, fuse: 1.0, cook: false, speed: 5, radius: 4.2, damage: 150, unlockLevel: 11 },
  { id: 'flash', idx: 3, kind: 'tactical', name: 'Flash Pulse', desc: 'Blinds anyone looking toward the burst within line of sight.', recharge: 20, fuse: 1.3, cook: false, speed: 16, radius: 14, damage: 0, unlockLevel: 1 },
  { id: 'smoke', idx: 4, kind: 'tactical', name: 'Obscurant Canister', desc: 'Releases an opaque cloud for 12 s. Blocks sight for players and bots alike.', recharge: 24, fuse: 1.0, cook: false, speed: 14, radius: 5.2, damage: 0, unlockLevel: 4 },
  { id: 'dart', idx: 5, kind: 'tactical', name: 'Signal Dart', desc: 'Sticks to a surface and pulses, revealing moving enemies within 12 m.', recharge: 22, fuse: 0, cook: false, speed: 30, radius: 12, damage: 0, unlockLevel: 9 },
];
export const EQUIP_BY_ID: Record<string, EquipDef> = Object.fromEntries(EQUIPMENT.map((e) => [e.id, e]));
export const LETHALS = EQUIPMENT.filter((e) => e.kind === 'lethal');
export const TACTICALS = EQUIPMENT.filter((e) => e.kind === 'tactical');

// ---------------------------------------------------------------- support actions
export interface SupportDef {
  id: string;
  idx: number;
  tier: 0 | 1 | 2;
  cost: number; // momentum
  name: string;
  desc: string;
  counter: string;
  targeted: boolean;
  unlockLevel: number;
}

export const SUPPORTS: SupportDef[] = [
  { id: 'recon', idx: 0, tier: 0, cost: 3, name: 'Recon Sweep', desc: 'Three minimap pulses reveal every hostile.', counter: 'Signal Filter shortens each reveal.', targeted: false, unlockLevel: 1 },
  { id: 'pod', idx: 1, tier: 0, cost: 3, name: 'Ammo Pod', desc: 'Drops a pod that restocks ammo and equipment for nearby teammates.', counter: 'The pod can be shot and destroyed.', targeted: false, unlockLevel: 3 },
  { id: 'drone', idx: 2, tier: 1, cost: 5, name: 'Hunter Drone', desc: '30-second drone that marks hostiles it can see. It never fires.', counter: 'Shoot it down, or stay under cover.', targeted: false, unlockLevel: 1 },
  { id: 'mortar', idx: 3, tier: 1, cost: 5, name: 'Mortar Mark', desc: 'Two telegraphed shells on an outdoor point you aim at.', counter: 'Leave the marked ring or get under a roof.', targeted: true, unlockLevel: 8 },
  { id: 'flight', idx: 4, tier: 2, cost: 8, name: 'Interdiction Flight', desc: 'One strafing pass along the lane you aim down, after a loud warning.', counter: 'Get indoors or out of the marked lane.', targeted: true, unlockLevel: 1 },
  { id: 'uplink', idx: 5, tier: 2, cost: 8, name: 'Team Uplink', desc: '20 s of faster equipment recharge and shared assists for your team.', counter: 'Ends on its own; deny kills while it runs.', targeted: false, unlockLevel: 10 },
];
export const SUPPORT_BY_ID: Record<string, SupportDef> = Object.fromEntries(SUPPORTS.map((s) => [s.id, s]));
export const SUPPORT_TIERS: SupportDef[][] = [0, 1, 2].map((t) => SUPPORTS.filter((s) => s.tier === t));

export const SUPPORT_TUNING = {
  reconPulses: 3,
  reconInterval: 2.6,
  reconReveal: 2.2,
  podLife: 45,
  podHp: 60,
  podRadius: 2.6,
  podCooldown: 8,
  droneLife: 30,
  droneHp: 70,
  droneRange: 38,
  droneHeight: 9,
  mortarDelay: 2.4,
  mortarGap: 0.8,
  mortarRadius: 7,
  mortarDamage: 170,
  flightDelay: 3.2,
  flightLength: 64,
  flightWidth: 7,
  flightDuration: 1.7,
  flightDamage: 85,
  uplinkTime: 20,
  uplinkRecharge: 2.5,
  uplinkShareRadius: 16,
  smokeLife: 12,
  dartLife: 10,
  dartPulse: 1.5,
  dartReveal: 1.6,
  mineHp: 20,
  mineRange: 4.2,
  satchelLife: 25,
};
