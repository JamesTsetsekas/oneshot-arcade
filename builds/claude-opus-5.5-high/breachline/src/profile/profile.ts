// Guest profile, loadouts, settings and progression persisted locally (Practice
// uses this embedded profile service). Results are applied idempotently by matchId.
import { Loadout, DEFAULT_LOADOUTS, validateLoadout, cloneLoadout } from "../content/loadout";
import { levelForXp, XP, CHALLENGES, unlocksBetween, UnlockEntry, MAX_LEVEL } from "../content/progression";
import { MatchResult } from "../shared/protocol";

export const PROFILE_VERSION = 2;
const KEY = "breachline.profile";

export type Bind = string; // KeyboardEvent.code or Mouse0/1/2

export interface Settings {
  fov: number; vmFov: number; sens: number; adsSens: number; scopedSens: number; invertY: boolean;
  quality: "low" | "medium" | "high"; renderScale: number; shadows: boolean;
  master: number; sfx: number; music: number; hitmarkerAudio: boolean;
  adsMode: "hold" | "toggle"; crouchMode: "toggle" | "hold"; sprintMode: "hold" | "toggle";
  colorblind: boolean; reducedMotion: boolean; photosensitive: boolean; shake: number; bob: number;
  subtitles: boolean; crosshairColor: string; reticle: string; showFps: boolean;
  binds: Record<string, Bind>;
}

export const DEFAULT_BINDS: Record<string, Bind> = {
  forward: "KeyW", back: "KeyS", left: "KeyA", right: "KeyD", jump: "Space", crouch: "ControlLeft", crouchAlt: "KeyC", sprint: "ShiftLeft",
  fire: "Mouse0", ads: "Mouse2", reload: "KeyR", melee: "KeyF", lethal: "KeyG", tactical: "KeyQ", primary: "Digit1", sidearm: "Digit2",
  supportSelect: "Digit3", supportDeploy: "Digit4", mode: "KeyV", ping: "KeyX", scoreboard: "Tab", loadout: "KeyM", inspect: "KeyB",
};
export const BIND_LABELS: Record<string, string> = {
  forward: "Move forward", back: "Move back", left: "Strafe left", right: "Strafe right", jump: "Jump / mantle", crouch: "Crouch", crouchAlt: "Crouch (alt)",
  sprint: "Sprint", fire: "Fire", ads: "Aim down sights", reload: "Reload", melee: "Quick melee", lethal: "Lethal equipment (hold to cook)", tactical: "Tactical equipment",
  primary: "Primary weapon", sidearm: "Sidearm", supportSelect: "Cycle support action", supportDeploy: "Deploy support action", mode: "Fire mode", ping: "Ping",
  scoreboard: "Scoreboard (hold)", loadout: "Change loadout (while dead)", inspect: "Inspect weapon",
};

export const DEFAULT_SETTINGS: Settings = {
  fov: 90, vmFov: 65, sens: 2.0, adsSens: 1.0, scopedSens: 1.0, invertY: false,
  quality: "medium", renderScale: 1, shadows: true,
  master: 0.8, sfx: 0.9, music: 0.45, hitmarkerAudio: true,
  adsMode: "hold", crouchMode: "toggle", sprintMode: "hold",
  colorblind: false, reducedMotion: false, photosensitive: false, shake: 1, bob: 1,
  subtitles: true, crosshairColor: "#ffffff", reticle: "cross", showFps: false,
  binds: { ...DEFAULT_BINDS },
};

export interface Profile {
  version: number;
  guestId: string;
  name: string;
  xp: number;
  loadouts: Loadout[];
  selected: number;
  settings: Settings;
  practiceAllUnlocked: boolean;
  stats: { matches: number; wins: number; kills: number; deaths: number; assists: number; shots: number; hits: number; bestStreak: number; weaponUse: Record<string, { shots: number; hits: number; kills: number }> };
  challenges: Record<string, { progress: number; done: boolean }>;
  processed: string[];
  lastPractice: { difficulty: "easy" | "normal" | "hard"; scoreLimit: number; timeLimit: number; teamSize: number };
}

function randomId() {
  const a = new Uint8Array(8);
  (globalThis.crypto ?? { getRandomValues: (x: Uint8Array) => { for (let i = 0; i < x.length; i++) x[i] = Math.floor(Math.random() * 256); return x; } }).getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function newProfile(): Profile {
  return {
    version: PROFILE_VERSION, guestId: randomId(), name: `Guest-${Math.floor(1000 + Math.random() * 9000)}`, xp: 0,
    loadouts: DEFAULT_LOADOUTS.map(cloneLoadout), selected: 0, settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)), practiceAllUnlocked: false,
    stats: { matches: 0, wins: 0, kills: 0, deaths: 0, assists: 0, shots: 0, hits: 0, bestStreak: 0, weaponUse: {} },
    challenges: Object.fromEntries(CHALLENGES.map((c) => [c.id, { progress: 0, done: false }])),
    processed: [],
    lastPractice: { difficulty: "normal", scoreLimit: 75, timeLimit: 480, teamSize: 6 },
  };
}

/** Schema migration: fills missing fields, repairs invalid loadouts. */
export function migrate(raw: unknown): Profile {
  const base = newProfile();
  if (!raw || typeof raw !== "object") return base;
  const p = raw as Partial<Profile> & { version?: number };
  const out: Profile = {
    ...base, ...p,
    version: PROFILE_VERSION,
    settings: { ...base.settings, ...(p.settings ?? {}), binds: { ...DEFAULT_BINDS, ...(p.settings?.binds ?? {}) } },
    stats: { ...base.stats, ...(p.stats ?? {}) },
    challenges: { ...base.challenges, ...(p.challenges ?? {}) },
    lastPractice: { ...base.lastPractice, ...(p.lastPractice ?? {}) },
    processed: Array.isArray(p.processed) ? p.processed.slice(-50) : [],
  };
  if (typeof out.xp !== "number" || !isFinite(out.xp) || out.xp < 0) out.xp = 0;
  const lvl = levelForXp(out.xp);
  out.loadouts = (Array.isArray(p.loadouts) ? p.loadouts : base.loadouts).slice(0, 5);
  while (out.loadouts.length < 5) out.loadouts.push(cloneLoadout(DEFAULT_LOADOUTS[out.loadouts.length]));
  out.loadouts = out.loadouts.map((l, i) => (validateLoadout(l, { level: lvl, allUnlocked: out.practiceAllUnlocked }).ok ? l : cloneLoadout(DEFAULT_LOADOUTS[i])));
  if (!(out.selected >= 0 && out.selected < 5)) out.selected = 0;
  return out;
}

export function loadProfile(): Profile {
  try {
    const s = localStorage.getItem(KEY);
    return migrate(s ? JSON.parse(s) : null);
  } catch { return newProfile(); }
}
export function saveProfile(p: Profile) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* storage unavailable: keep in memory */ }
}
export function resetProfile(): Profile { const p = newProfile(); saveProfile(p); return p; }
export function exportProfile(p: Profile): string { return JSON.stringify({ ...p, exportedAt: new Date().toISOString() }, null, 2); }

export interface ProgressReport {
  applied: boolean;
  xpLines: { label: string; xp: number }[];
  totalXp: number;
  levelBefore: number; levelAfter: number;
  unlocks: UnlockEntry[];
  challengesCompleted: string[];
}

/** Idempotent result application (by matchId). Pure apart from mutating `p`. */
export function applyResult(p: Profile, r: MatchResult): ProgressReport {
  const levelBefore = levelForXp(p.xp);
  const empty: ProgressReport = { applied: false, xpLines: [], totalXp: 0, levelBefore, levelAfter: levelBefore, unlocks: [], challengesCompleted: [] };
  if (p.processed.includes(r.matchId)) return empty;
  const me = r.players.find((x) => x.id === r.localId);
  if (!me) return empty;
  const won = r.winner === me.team;
  const lines: { label: string; xp: number }[] = [];
  lines.push({ label: "Participation", xp: XP.participation + Math.round((r.duration / 60) * XP.perMinute) });
  if (me.kills) lines.push({ label: `Eliminations ×${me.kills}`, xp: me.kills * XP.kill });
  if (me.assists) lines.push({ label: `Assists ×${me.assists}`, xp: me.assists * XP.assist });
  if (me.headshots) lines.push({ label: `Headshots ×${me.headshots}`, xp: me.headshots * XP.headshot });
  if (me.supportDestroyed) lines.push({ label: `Support destroyed ×${me.supportDestroyed}`, xp: me.supportDestroyed * XP.supportDestroyed });
  if (won) lines.push({ label: "Victory", xp: XP.win });
  lines.push({ label: "Match completed", xp: XP.completion });
  // challenges
  const completed: string[] = [];
  const statOf: Record<string, number> = { adsKills: me.adsKills, equipmentHits: me.equipmentHits, assists: me.assists, supportDestroyed: me.supportDestroyed, zonesVisited: me.zonesVisited };
  for (const c of CHALLENGES) {
    const st = p.challenges[c.id] ?? { progress: 0, done: false };
    if (st.done) continue;
    st.progress = c.id === "routes" ? Math.max(st.progress, statOf[c.stat] ?? 0) : st.progress + (statOf[c.stat] ?? 0);
    if (st.progress >= c.goal) { st.done = true; st.progress = c.goal; completed.push(c.name); lines.push({ label: `Challenge: ${c.name}`, xp: XP.challengeComplete }); }
    p.challenges[c.id] = st;
  }
  const total = lines.reduce((a, l) => a + l.xp, 0);
  p.xp += total;
  const levelAfter = Math.min(MAX_LEVEL, levelForXp(p.xp));
  // stats
  p.stats.matches++; if (won) p.stats.wins++;
  p.stats.kills += me.kills; p.stats.deaths += me.deaths; p.stats.assists += me.assists;
  p.stats.bestStreak = Math.max(p.stats.bestStreak, me.bestStreak);
  for (const [w, s] of Object.entries(me.weapons)) {
    const u = (p.stats.weaponUse[w] ??= { shots: 0, hits: 0, kills: 0 });
    u.shots += s.shots; u.hits += s.hits; u.kills += s.kills;
    p.stats.shots += s.shots; p.stats.hits += s.hits;
  }
  p.processed.push(r.matchId);
  if (p.processed.length > 50) p.processed.shift();
  return { applied: true, xpLines: lines, totalXp: total, levelBefore, levelAfter, unlocks: unlocksBetween(levelBefore, levelAfter), challengesCompleted: completed };
}
