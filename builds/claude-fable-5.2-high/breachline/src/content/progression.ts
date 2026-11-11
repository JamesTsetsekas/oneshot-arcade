// content-data: account progression. Unlocks are sidegrades only - nothing here touches health or damage.
import { ATTACHMENTS, WEAPONS } from './weapons';
import { EQUIPMENT, PERKS, SUPPORTS } from './kit';

export const MAX_LEVEL = 30;

/** Total XP required to reach a level (level 1 = 0). */
export function xpForLevel(level: number): number {
  const n = Math.max(0, Math.min(MAX_LEVEL, level) - 1);
  return 400 * n + 60 * n * n;
}

export function levelForXp(xp: number): number {
  let lvl = 1;
  while (lvl < MAX_LEVEL && xp >= xpForLevel(lvl + 1)) lvl++;
  return lvl;
}

export interface UnlockEntry {
  level: number;
  kind: 'weapon' | 'attachment' | 'perk' | 'equipment' | 'support' | 'cosmetic';
  id: string;
  name: string;
}

const COSMETICS: UnlockEntry[] = [
  { level: 17, kind: 'cosmetic', id: 'finish-salt', name: 'Salt Spray weapon finish' },
  { level: 18, kind: 'cosmetic', id: 'reticle-chevron', name: 'Chevron reticle' },
  { level: 19, kind: 'cosmetic', id: 'badge-relay', name: 'Relay Keeper badge' },
  { level: 20, kind: 'cosmetic', id: 'finish-hazard', name: 'Hazard Stripe weapon finish' },
  { level: 21, kind: 'cosmetic', id: 'reticle-ring', name: 'Open Ring reticle' },
  { level: 22, kind: 'cosmetic', id: 'badge-tunnel', name: 'Tunnel Rat badge' },
  { level: 23, kind: 'cosmetic', id: 'finish-cyan', name: 'Signal Cyan weapon finish' },
  { level: 24, kind: 'cosmetic', id: 'reticle-tee', name: 'Tee reticle' },
  { level: 25, kind: 'cosmetic', id: 'badge-ridge', name: 'Ridge Runner badge' },
  { level: 26, kind: 'cosmetic', id: 'finish-graphite', name: 'Brushed Graphite weapon finish' },
  { level: 27, kind: 'cosmetic', id: 'badge-anchor', name: 'Dead Weight badge' },
  { level: 28, kind: 'cosmetic', id: 'reticle-dot', name: 'Fine Dot reticle' },
  { level: 29, kind: 'cosmetic', id: 'finish-sunbleach', name: 'Sun-Bleached weapon finish' },
  { level: 30, kind: 'cosmetic', id: 'badge-k17', name: 'K-17 Veteran badge' },
];

export const UNLOCK_TRACK: UnlockEntry[] = [
  ...WEAPONS.map((w): UnlockEntry => ({ level: w.unlockLevel, kind: 'weapon', id: w.id, name: w.name })),
  ...ATTACHMENTS.map((a): UnlockEntry => ({ level: a.unlockLevel, kind: 'attachment', id: a.id, name: a.name })),
  ...PERKS.map((p): UnlockEntry => ({ level: p.unlockLevel, kind: 'perk', id: p.id, name: p.name })),
  ...EQUIPMENT.map((e): UnlockEntry => ({ level: e.unlockLevel, kind: 'equipment', id: e.id, name: e.name })),
  ...SUPPORTS.map((s): UnlockEntry => ({ level: s.unlockLevel, kind: 'support', id: s.id, name: s.name })),
  ...COSMETICS,
].sort((a, b) => a.level - b.level);

export interface ChallengeDef {
  id: string;
  name: string;
  desc: string;
  goal: number;
  xp: number;
}

/** Five onboarding challenges: ADS, equipment, assists, support counterplay, map routes. */
export const CHALLENGES: ChallengeDef[] = [
  { id: 'ads', name: 'Sight Picture', desc: 'Get 10 eliminations while aiming down sights.', goal: 10, xp: 400 },
  { id: 'equipment', name: 'Tools of the Trade', desc: 'Affect 5 enemies with lethal or tactical equipment.', goal: 5, xp: 400 },
  { id: 'assists', name: 'Team Effort', desc: 'Earn 8 assists.', goal: 8, xp: 400 },
  { id: 'counter', name: 'Lights Out', desc: 'Destroy 3 hostile devices (drones, pods or mines).', goal: 3, xp: 500 },
  { id: 'routes', name: 'Know the Station', desc: 'Visit all five districts of K-17 in one match, 2 times.', goal: 2, xp: 400 },
];
