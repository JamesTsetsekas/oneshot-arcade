// profile-service (embedded equivalent for Practice): guest profile, loadouts, settings, stats and progression,
// persisted locally. Match results are applied at most once per matchId and only if the room's integrity tag checks out.
import { DEFAULT_LOADOUTS, Loadout, PRACTICE_RULESET, sanitizeLoadout } from '../content/loadout';
import { CHALLENGES, levelForXp, UNLOCK_TRACK, UnlockEntry } from '../content/progression';
import type { Difficulty } from '../content/tuning';
import { MatchResult, resultChecksum } from '../protocol/messages';

export type Action = 'forward' | 'back' | 'left' | 'right' | 'jump' | 'crouch' | 'sprint' | 'reload' | 'melee' | 'lethal' | 'tactical'
  | 'primary' | 'sidearm' | 'supportSelect' | 'supportDeploy' | 'ping' | 'scoreboard' | 'inspect';

export const ACTION_LABELS: Record<Action, string> = {
  forward: 'Move forward', back: 'Move back', left: 'Strafe left', right: 'Strafe right', jump: 'Jump / mantle', crouch: 'Crouch', sprint: 'Sprint',
  reload: 'Reload', melee: 'Quick melee', lethal: 'Lethal equipment', tactical: 'Tactical equipment', primary: 'Primary weapon', sidearm: 'Sidearm',
  supportSelect: 'Cycle support action', supportDeploy: 'Deploy support action', ping: 'Ping', scoreboard: 'Scoreboard', inspect: 'Inspect weapon',
};

export const DEFAULT_BINDS: Record<Action, string> = {
  forward: 'KeyW', back: 'KeyS', left: 'KeyA', right: 'KeyD', jump: 'Space', crouch: 'ControlLeft', sprint: 'ShiftLeft', reload: 'KeyR', melee: 'KeyF',
  lethal: 'KeyG', tactical: 'KeyQ', primary: 'Digit1', sidearm: 'Digit2', supportSelect: 'Digit3', supportDeploy: 'Digit4', ping: 'KeyX', scoreboard: 'Tab', inspect: 'KeyB',
};

export interface Settings {
  fov: number;
  vmFov: number;
  sens: number;
  adsSens: number;
  invertY: boolean;
  master: number;
  sfx: number;
  music: number;
  quality: 'low' | 'medium' | 'high';
  renderScale: number;
  crouchToggle: boolean;
  adsToggle: boolean;
  sprintToggle: boolean;
  colorblind: 'off' | 'deuteranopia' | 'protanopia' | 'tritanopia';
  bob: number;
  shake: number;
  reducedMotion: boolean;
  flashDark: boolean;
  hitSound: boolean;
  subtitles: boolean;
  showFps: boolean;
  binds: Record<Action, string>;
}

export const DEFAULT_SETTINGS: Settings = {
  fov: 90, vmFov: 62, sens: 2.2, adsSens: 0.85, invertY: false, master: 0.8, sfx: 0.9, music: 0.45, quality: 'medium', renderScale: 1,
  crouchToggle: true, adsToggle: false, sprintToggle: false, colorblind: 'off', bob: 1, shake: 1, reducedMotion: false, flashDark: false,
  hitSound: true, subtitles: true, showFps: false, binds: { ...DEFAULT_BINDS },
};

export interface WeaponStat { shots: number; hits: number; kills: number; headshots: number }
export interface PracticeOptions { difficulty: Difficulty; teamSize: number; scoreLimit: number; timeLimit: number; latency: string; team: 0 | 1 }

export interface Profile {
  version: 1;
  id: string;
  name: string;
  xp: number;
  loadouts: Loadout[];
  selected: number;
  stats: { matches: number; wins: number; losses: number; draws: number; kills: number; deaths: number; assists: number; bestStreak: number; timePlayed: number; weapons: Record<string, WeaponStat> };
  challenges: Record<string, number>;
  challengesDone: string[];
  applied: string[];
  practice: PracticeOptions;
  settings: Settings;
}

const KEY = 'breachline.profile.v1';

export function newProfile(): Profile {
  const id = 'guest-' + Math.random().toString(36).slice(2, 10);
  return {
    version: 1, id, name: 'Operator', xp: 0,
    loadouts: JSON.parse(JSON.stringify(DEFAULT_LOADOUTS)) as Loadout[], selected: 0,
    stats: { matches: 0, wins: 0, losses: 0, draws: 0, kills: 0, deaths: 0, assists: 0, bestStreak: 0, timePlayed: 0, weapons: {} },
    challenges: {}, challengesDone: [], applied: [],
    practice: { difficulty: 'normal', teamSize: 6, scoreLimit: 75, timeLimit: 480, latency: 'off', team: 0 },
    settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) as Settings,
  };
}

/** Repairs anything missing or stale in stored data (schema migration + tamper tolerance). */
export function migrateProfile(raw: unknown): Profile {
  const base = newProfile();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<Profile>;
  const p: Profile = { ...base, ...r, version: 1 };
  p.name = typeof r.name === 'string' && r.name.trim() ? r.name.replace(/[^\w \-.]/g, '').slice(0, 16) || 'Operator' : 'Operator';
  p.xp = Number.isFinite(r.xp) && (r.xp as number) >= 0 ? Math.floor(r.xp as number) : 0;
  const stored = Array.isArray(r.loadouts) ? r.loadouts : [];
  p.loadouts = DEFAULT_LOADOUTS.map((d, i) => sanitizeLoadout(stored[i], d, PRACTICE_RULESET));
  p.selected = Number.isInteger(r.selected) && (r.selected as number) >= 0 && (r.selected as number) < 5 ? (r.selected as number) : 0;
  p.stats = { ...base.stats, ...(r.stats ?? {}) };
  p.stats.weapons = { ...(r.stats?.weapons ?? {}) };
  p.challenges = { ...(r.challenges ?? {}) };
  p.challengesDone = Array.isArray(r.challengesDone) ? r.challengesDone.filter((x) => typeof x === 'string') : [];
  p.applied = Array.isArray(r.applied) ? r.applied.filter((x) => typeof x === 'string').slice(-50) : [];
  p.practice = { ...base.practice, ...(r.practice ?? {}) };
  p.practice.teamSize = Math.max(1, Math.min(6, Math.round(p.practice.teamSize) || 6));
  p.practice.scoreLimit = Math.max(10, Math.min(150, Math.round(p.practice.scoreLimit) || 75));
  p.practice.timeLimit = Math.max(120, Math.min(900, Math.round(p.practice.timeLimit) || 480));
  if (!['easy', 'normal', 'hard'].includes(p.practice.difficulty)) p.practice.difficulty = 'normal';
  p.practice.team = p.practice.team === 1 ? 1 : 0;
  p.settings = { ...base.settings, ...(r.settings ?? {}) };
  p.settings.binds = { ...DEFAULT_BINDS, ...(r.settings?.binds ?? {}) };
  p.settings.fov = clampN(p.settings.fov, 75, 110, 90);
  p.settings.vmFov = clampN(p.settings.vmFov, 55, 75, 65);
  p.settings.sens = clampN(p.settings.sens, 0.1, 10, 2.2);
  p.settings.adsSens = clampN(p.settings.adsSens, 0.2, 2, 0.85);
  p.settings.renderScale = clampN(p.settings.renderScale, 0.5, 1, 1);
  return p;
}
function clampN(v: unknown, a: number, b: number, d: number): number { return typeof v === 'number' && Number.isFinite(v) ? Math.max(a, Math.min(b, v)) : d; }

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return migrateProfile(JSON.parse(raw));
  } catch { /* storage unavailable or corrupt: fall through to a fresh guest */ }
  return newProfile();
}

export function saveProfile(p: Profile): void {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private mode / quota: play continues unsaved */ }
}

export function resetProfile(keepSettings: Profile | null): Profile {
  const p = newProfile();
  if (keepSettings) p.settings = keepSettings.settings;
  saveProfile(p);
  return p;
}

export interface ApplyOutcome {
  applied: boolean;
  reason?: string;
  levelBefore: number;
  levelAfter: number;
  xpGained: number;
  unlocked: UnlockEntry[];
  challengesCompleted: string[];
}

/** Idempotent: a given matchId changes the profile once. Returns what changed for the results screen. */
export function applyMatchResult(p: Profile, r: MatchResult): ApplyOutcome {
  const levelBefore = levelForXp(p.xp);
  const none: ApplyOutcome = { applied: false, levelBefore, levelAfter: levelBefore, xpGained: 0, unlocked: [], challengesCompleted: [] };
  const { sig, ...body } = r;
  if (resultChecksum(body) !== sig) return { ...none, reason: 'Result failed its integrity check' };
  if (p.applied.includes(r.matchId)) return { ...none, reason: 'Result already recorded' };
  p.applied.push(r.matchId);
  if (p.applied.length > 50) p.applied.shift();
  const me = r.players.find((x) => x.id === r.you.id);
  const s = p.stats;
  s.matches++;
  if (r.winner < 0) s.draws++; else if (r.winner === r.you.team) s.wins++; else s.losses++;
  if (me) { s.kills += me.kills; s.deaths += me.deaths; s.assists += me.assists; }
  s.bestStreak = Math.max(s.bestStreak, r.you.bestStreak);
  s.timePlayed += r.duration;
  for (const w of r.you.weapons) {
    const t = (s.weapons[w.weapon] ??= { shots: 0, hits: 0, kills: 0, headshots: 0 });
    t.shots += w.shots; t.hits += w.hits; t.kills += w.kills; t.headshots += w.headshots;
  }
  let xpGained = r.you.xpTotal;
  // onboarding challenges
  const done: string[] = [];
  const bump = (id: string, by: number) => {
    if (by <= 0 || p.challengesDone.includes(id)) return;
    const def = CHALLENGES.find((c) => c.id === id)!;
    p.challenges[id] = Math.min(def.goal, (p.challenges[id] ?? 0) + by);
    if (p.challenges[id] >= def.goal) { p.challengesDone.push(id); done.push(id); xpGained += def.xp; }
  };
  bump('ads', r.you.adsKills);
  bump('equipment', r.you.equipmentHits);
  bump('assists', r.you.assists);
  bump('counter', r.you.devicesDestroyed);
  bump('routes', r.you.districtsVisited >= 5 ? 1 : 0);
  p.xp += xpGained;
  const levelAfter = levelForXp(p.xp);
  const unlocked = UNLOCK_TRACK.filter((u) => u.level > levelBefore && u.level <= levelAfter);
  return { applied: true, levelBefore, levelAfter, xpGained, unlocked, challengesCompleted: done };
}

export function exportProfile(p: Profile): string {
  return JSON.stringify(p, null, 2);
}
