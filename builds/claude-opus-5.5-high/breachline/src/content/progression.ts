import { WEAPONS } from "./weapons";
import { ATTACHMENTS, PERKS, EQUIPMENT, SUPPORT } from "./items";

export const MAX_LEVEL = 30;

/** Cumulative XP required to reach a level (level 1 = 0). Brisk curve. */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let l = 2; l <= level; l++) total += 900 + (l - 2) * 180;
  return total;
}

export function levelForXp(xp: number): number {
  let lvl = 1;
  while (lvl < MAX_LEVEL && xp >= xpForLevel(lvl + 1)) lvl++;
  return lvl;
}

export const XP = {
  participation: 300,
  perMinute: 60,
  win: 500,
  completion: 200,
  kill: 100,
  assist: 50,
  supportDestroyed: 75,
  headshot: 25,
  challengeComplete: 400,
};

export interface Reticle { id: string; name: string; unlockLevel: number }
export const RETICLES: Reticle[] = [
  { id: "dot", name: "Dot", unlockLevel: 1 },
  { id: "cross", name: "Crosshair", unlockLevel: 1 },
  { id: "chevron", name: "Chevron", unlockLevel: 4 },
  { id: "ring", name: "Ring", unlockLevel: 9 },
  { id: "tri", name: "Tri-Point", unlockLevel: 18 },
];

export interface UnlockEntry { level: number; kind: string; id: string; name: string }

export function unlockTable(): UnlockEntry[] {
  const out: UnlockEntry[] = [];
  for (const w of Object.values(WEAPONS)) if (w.unlockLevel > 1) out.push({ level: w.unlockLevel, kind: "Weapon", id: w.id, name: w.name });
  for (const a of Object.values(ATTACHMENTS)) if (a.unlockLevel > 1) out.push({ level: a.unlockLevel, kind: "Attachment", id: a.id, name: a.name });
  for (const p of Object.values(PERKS)) if (p.unlockLevel > 1) out.push({ level: p.unlockLevel, kind: "Perk", id: p.id, name: p.name });
  for (const e of Object.values(EQUIPMENT)) if (e.unlockLevel > 1) out.push({ level: e.unlockLevel, kind: "Equipment", id: e.id, name: e.name });
  for (const s of Object.values(SUPPORT)) if (s.unlockLevel > 1) out.push({ level: s.unlockLevel, kind: "Support", id: s.id, name: s.name });
  for (const r of RETICLES) if (r.unlockLevel > 1) out.push({ level: r.unlockLevel, kind: "Reticle", id: r.id, name: r.name });
  return out.sort((a, b) => a.level - b.level);
}

export function unlocksBetween(fromLevel: number, toLevel: number): UnlockEntry[] {
  return unlockTable().filter((u) => u.level > fromLevel && u.level <= toLevel);
}

export interface ChallengeDef { id: string; name: string; desc: string; goal: number; stat: string }
/** Five onboarding challenges: ADS, equipment, assists, support counterplay, map routes. */
export const CHALLENGES: ChallengeDef[] = [
  { id: "adsKills", name: "Sight Picture", desc: "Get 5 eliminations while aiming down sights.", goal: 5, stat: "adsKills" },
  { id: "equipment", name: "Utility Belt", desc: "Damage or affect 3 enemies with equipment.", goal: 3, stat: "equipmentHits" },
  { id: "assists", name: "Crossfire", desc: "Earn 5 assists.", goal: 5, stat: "assists" },
  { id: "counter", name: "Counter-Support", desc: "Destroy 1 enemy support device (drone or pod).", goal: 1, stat: "supportDestroyed" },
  { id: "routes", name: "Know the Station", desc: "Visit all five zones of Relay Station K-17 in one match.", goal: 5, stat: "zonesVisited" },
];
