export type WeaponSlot = 'melee' | 'sidearm' | 'long' | 'gadget';
export type AmmoType = 'none' | 'pistol' | 'smg' | 'rifle' | 'shell' | 'dmr' | 'stun';

export interface WeaponDef {
  id: string;
  name: string;
  slot: WeaponSlot;
  lethal: boolean;
  ammo: AmmoType;
  mag: number;
  rpm: number;
  auto: boolean;
  damage: number;        // per pellet at close range
  pellets: number;
  range: number;         // metres of effective range
  spread: number;        // base cone (radians)
  moveSpread: number;
  recoil: number;        // camera kick (radians)
  reload: number;        // seconds
  noise: number;         // hearing radius (m)
  price: number;         // cost of one reserve pack
  pack: number;          // rounds per pack
  desc: string;
  unlockTrust: number;
}

export const WEAPONS: Record<string, WeaponDef> = {
  baton: { id: 'baton', name: 'Tide Baton', slot: 'melee', lethal: false, ammo: 'none', mag: 0, rpm: 100, auto: false, damage: 28, pellets: 1, range: 2.2, spread: 0, moveSpread: 0, recoil: 0, reload: 0, noise: 8, price: 0, pack: 0, desc: 'Collapsible baton. Non-lethal; drops targets without killing.', unlockTrust: 0 },
  pistol: { id: 'pistol', name: 'Ferro P9 Pistol', slot: 'sidearm', lethal: true, ammo: 'pistol', mag: 12, rpm: 260, auto: false, damage: 24, pellets: 1, range: 45, spread: 0.012, moveSpread: 0.03, recoil: 0.022, reload: 1.5, noise: 70, price: 30, pack: 24, desc: 'Reliable semi-auto sidearm.', unlockTrust: 0 },
  stun: { id: 'stun', name: 'Halo Stun Projector', slot: 'long', lethal: false, ammo: 'stun', mag: 4, rpm: 90, auto: false, damage: 100, pellets: 1, range: 14, spread: 0.01, moveSpread: 0.02, recoil: 0.015, reload: 2.4, noise: 18, price: 40, pack: 4, desc: 'Short-range non-lethal stun. Drops a target for several seconds.', unlockTrust: 1 },
  mp: { id: 'mp', name: 'Vesper MP-18 Machine Pistol', slot: 'long', lethal: true, ammo: 'smg', mag: 25, rpm: 780, auto: true, damage: 12, pellets: 1, range: 32, spread: 0.028, moveSpread: 0.05, recoil: 0.016, reload: 1.9, noise: 75, price: 45, pack: 50, desc: 'Fast, loud, inaccurate past close range.', unlockTrust: 1 },
  carbine: { id: 'carbine', name: 'Harrow C4 Carbine', slot: 'long', lethal: true, ammo: 'rifle', mag: 30, rpm: 620, auto: true, damage: 21, pellets: 1, range: 90, spread: 0.014, moveSpread: 0.04, recoil: 0.02, reload: 2.2, noise: 95, price: 60, pack: 60, desc: 'Balanced automatic rifle.', unlockTrust: 2 },
  shotgun: { id: 'shotgun', name: 'Brine-12 Pump Shotgun', slot: 'long', lethal: true, ammo: 'shell', mag: 6, rpm: 70, auto: false, damage: 9, pellets: 9, range: 18, spread: 0.075, moveSpread: 0.03, recoil: 0.06, reload: 2.8, noise: 100, price: 40, pack: 12, desc: 'Devastating up close, useless at range.', unlockTrust: 2 },
  dmr: { id: 'dmr', name: 'Kite M7 Marksman Rifle', slot: 'long', lethal: true, ammo: 'dmr', mag: 8, rpm: 140, auto: false, damage: 62, pellets: 1, range: 160, spread: 0.004, moveSpread: 0.06, recoil: 0.045, reload: 2.8, noise: 105, price: 70, pack: 16, desc: 'Accurate semi-auto for long sightlines.', unlockTrust: 3 },
  smoke: { id: 'smoke', name: 'Smoke Canister', slot: 'gadget', lethal: false, ammo: 'none', mag: 0, rpm: 0, auto: false, damage: 0, pellets: 0, range: 18, spread: 0, moveSpread: 0, recoil: 0, reload: 0, noise: 10, price: 25, pack: 1, desc: 'Thrown. Blocks sight lines for ~10 s - witnesses and police lose you.', unlockTrust: 0 },
  chirper: { id: 'chirper', name: 'Distraction Chirper', slot: 'gadget', lethal: false, ammo: 'none', mag: 0, rpm: 0, auto: false, damage: 0, pellets: 0, range: 24, spread: 0, moveSpread: 0, recoil: 0, reload: 0, noise: 55, price: 20, pack: 1, desc: 'Thrown. Draws attention and cancels nearby witness calls.', unlockTrust: 0 },
};

export const AMMO_LABEL: Record<AmmoType, string> = { none: '-', pistol: '9mm', smg: 'SMG', rifle: 'Rifle', shell: 'Shells', dmr: 'DMR', stun: 'Cells' };

/** Range falloff: full damage to 40% of range, linearly to 45% damage at max range. */
export function falloff(def: WeaponDef, dist: number): number {
  const a = def.range * 0.4;
  if (dist <= a) return 1;
  if (dist >= def.range * 1.4) return 0.2;
  return 1 - 0.55 * ((dist - a) / (def.range - a));
}
