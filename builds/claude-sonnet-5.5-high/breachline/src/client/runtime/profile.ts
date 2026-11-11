// Persistent guest profile: XP, level, stats, five loadouts. Practice uses an embedded local store (localStorage).
import { defaultLoadouts, sanitizeLoadout, type Loadout } from "../../shared/content/loadout";
import { levelFromXp, XP_VALUES } from "../../shared/content/progression";
import type { PlayerState } from "../../shared/sim/types";

export interface Profile {
  version: 1;
  guestId: string;
  xp: number;
  matches: number;
  wins: number;
  kills: number;
  deaths: number;
  assists: number;
  shots: number;
  hits: number;
  bestStreak: number;
  weaponUsage: Record<string, { shots: number; hits: number; kills: number }>;
  loadouts: Loadout[];
  selected: number;
  challenges: Record<string, boolean>;
  lastMatchIds: string[];
}

const KEY = "breachline.profile.v1";

export function newProfile(): Profile {
  return {
    version: 1, guestId: "guest-" + Math.random().toString(36).slice(2, 8), xp: 0, matches: 0, wins: 0, kills: 0, deaths: 0, assists: 0, shots: 0, hits: 0, bestStreak: 0,
    weaponUsage: {}, loadouts: defaultLoadouts(), selected: 0, challenges: {}, lastMatchIds: [],
  };
}

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return newProfile();
    const p = JSON.parse(raw) as Profile;
    const base = newProfile();
    const merged: Profile = { ...base, ...p };
    merged.loadouts = Array.from({ length: 5 }, (_, i) => sanitizeLoadout(p.loadouts?.[i], base.loadouts[i]));
    merged.selected = Math.min(4, Math.max(0, p.selected ?? 0));
    return merged;
  } catch { return newProfile(); }
}
export function saveProfile(p: Profile): void {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* ignore */ }
}
export function resetProfile(): Profile {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  return newProfile();
}
export function exportProfile(p: Profile): string { return JSON.stringify(p, null, 2); }

export interface MatchResult {
  matchId: string;
  won: boolean;
  draw: boolean;
  xpGained: number;
  breakdown: Array<{ label: string; xp: number }>;
  levelBefore: number;
  levelAfter: number;
  xpBefore: number;
  xpAfter: number;
  newUnlocks: string[];
}

/** Idempotent result submission: the same matchId never pays out twice. */
export function applyMatchResult(profile: Profile, me: PlayerState, won: boolean, draw: boolean, completed: boolean, matchId: string): MatchResult {
  const before = levelFromXp(profile.xp);
  const breakdown: Array<{ label: string; xp: number }> = [];
  if (profile.lastMatchIds.includes(matchId)) {
    return { matchId, won, draw, xpGained: 0, breakdown: [{ label: "Already submitted", xp: 0 }], levelBefore: before.level, levelAfter: before.level, xpBefore: profile.xp, xpAfter: profile.xp, newUnlocks: [] };
  }
  const s = me.stats;
  breakdown.push({ label: "Participation", xp: XP_VALUES.participation });
  if (s.kills) breakdown.push({ label: `Eliminations x${s.kills}`, xp: s.kills * XP_VALUES.kill });
  if (s.headshots) breakdown.push({ label: `Headshot bonus x${s.headshots}`, xp: s.headshots * XP_VALUES.headshotBonus });
  if (s.assists) breakdown.push({ label: `Assists x${s.assists}`, xp: s.assists * XP_VALUES.assist });
  if (s.supportDestroyed) breakdown.push({ label: `Support destroyed x${s.supportDestroyed}`, xp: s.supportDestroyed * XP_VALUES.supportDestroy });
  if (won) breakdown.push({ label: "Victory", xp: XP_VALUES.win });
  if (completed) breakdown.push({ label: "Completion bonus", xp: XP_VALUES.completion });
  const gained = breakdown.reduce((a, b) => a + b.xp, 0);
  profile.xp += gained;
  profile.matches++; if (won) profile.wins++;
  profile.kills += s.kills; profile.deaths += s.deaths; profile.assists += s.assists; profile.shots += s.shots; profile.hits += s.hits;
  profile.bestStreak = Math.max(profile.bestStreak, s.bestStreak);
  for (const [id, u] of Object.entries(me.weaponStats)) {
    const t = (profile.weaponUsage[id] ??= { shots: 0, hits: 0, kills: 0 });
    t.shots += u.shots; t.hits += u.hits; t.kills += u.kills;
  }
  profile.lastMatchIds = [matchId, ...profile.lastMatchIds].slice(0, 20);
  const after = levelFromXp(profile.xp);
  saveProfile(profile);
  return { matchId, won, draw, xpGained: gained, breakdown, levelBefore: before.level, levelAfter: after.level, xpBefore: profile.xp - gained, xpAfter: profile.xp, newUnlocks: [] };
}
