// app-shell: boot, capability detection, screen routing, the frame loop and match lifecycle.
import { AudioEngine } from '../audio/audio';
import { validateDefs } from '../data/defs';
import type { Faction } from '../data/types';
import { GameSession, type SessionMode } from '../game/session';
import type { Difficulty, MatchConfig, ReplayData } from '../net/protocol';
import { openRepository, type Repository } from '../persistence/repo';
import { GameRenderer } from '../render/renderer';
import { getState, setState, type MatchRecord, type MatchResult, type Screen } from '../ui/store';
import { QUALITY_PRESETS, type Quality, type Settings } from './settings';
import { heightAt } from '../world/map';

let renderer: GameRenderer | null = null;
let session: GameSession | null = null;
let repo: Repository;
let canvasEl: HTMLCanvasElement;
let overlayEl: HTMLCanvasElement;
let lastPlay: { config: MatchConfig; mode: SessionMode } | null = null;
let lastTime = 0;
let backdrop = false;
export const audio = new AudioEngine();

function newSeed(): number { return ((Date.now() & 0x7fffffff) ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0 || 1; }

export function detectCapabilities(): string {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2');
    if (!gl) return 'This game needs WebGL 2, which this browser or graphics driver does not provide. Try a current version of Chrome, Edge or Firefox with hardware acceleration enabled.';
  } catch {
    return 'WebGL 2 could not be initialised. Enable hardware acceleration in your browser settings and reload.';
  }
  return '';
}

export async function boot(canvas: HTMLCanvasElement, overlay: HTMLCanvasElement): Promise<void> {
  canvasEl = canvas; overlayEl = overlay;
  try {
    setState({ loadingText: 'Checking graphics capability', loadingProgress: 0.1 });
    const cap = detectCapabilities();
    if (cap) { setState({ screen: 'error', error: cap }); return; }
    const problems = validateDefs();
    if (problems.length > 0) throw new Error('Balance data failed validation: ' + problems[0]);
    setState({ loadingText: 'Opening local profile', loadingProgress: 0.25 });
    repo = await openRepository();
    const [settings, profile, history, replays] = await Promise.all([repo.loadSettings(), repo.loadProfile(), repo.loadHistory(), repo.listReplays()]);
    setState({ settings, profile, history, replays, loadingText: 'Starting renderer', loadingProgress: 0.45, notice: repo.recovered ? 'Some saved data was unreadable and has been reset to defaults.' : '' });
    audio.setVolumes(settings);
    await nextFrame();
    renderer = new GameRenderer(canvas, settings);
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      if (renderer) renderer.lost = true;
      session?.setPaused(true);
      setState({ contextLost: true });
    });
    canvas.addEventListener('webglcontextrestored', () => {
      if (renderer) { renderer.lost = false; renderer.applySettings(getState().settings); }
      setState({ contextLost: false });
      if (session && !getState().pauseMenu) session.setPaused(false);
    });
    setState({ loadingText: 'Growing models', loadingProgress: 0.7 });
    await nextFrame();
    setState({ icons: renderer.renderIcons(96), loadingText: 'Ready', loadingProgress: 1 });
    window.addEventListener('resize', () => { if (session) session.resize(); else renderer?.resize(); });
    document.addEventListener('visibilitychange', () => {
      if (!session) return;
      if (document.hidden) session.setPaused(true);
      else if (!getState().pauseMenu && !getState().contextLost && !session.userPaused) session.setPaused(false);
    });
    window.addEventListener('pointerdown', () => audio.init(), { capture: true });
    window.addEventListener('keydown', () => audio.init(), { capture: true });
    lastTime = performance.now();
    requestAnimationFrame(loop);
    const params = new URLSearchParams(location.search);
    const auto = params.get('autostart');
    if (auto === 'skirmish' || auto === 'spectate') {
      const f = (params.get('faction') === 'chorus' ? 'chorus' : 'helix') as Faction;
      const ef = (params.get('enemy') === 'helix' ? 'helix' : params.get('enemy') === 'chorus' ? 'chorus' : f === 'helix' ? 'chorus' : 'helix') as Faction;
      const d = (['easy', 'normal', 'hard'].includes(params.get('difficulty') ?? '') ? params.get('difficulty') : 'normal') as Difficulty;
      start(makeConfig(f, ef, d, auto === 'spectate', Number(params.get('seed')) || newSeed()), auto === 'spectate' ? 'spectate' : 'play');
    } else if (auto === 'tutorial') startTutorial();
    else toMenu();
  } catch (err) {
    setState({ screen: 'error', error: 'Shardfront failed to start: ' + (err instanceof Error ? err.message : String(err)) });
  }
}

function nextFrame(): Promise<void> { return new Promise((r) => requestAnimationFrame(() => r())); }

function loop(now: number): void {
  const dt = Math.min(0.1, Math.max(0.001, (now - lastTime) / 1000));
  lastTime = now;
  if (session && !document.hidden) {
    try { session.frame(dt); } catch (err) {
      console.error(err);
      session.dispose(); session = null;
      setState({ screen: 'error', error: 'The match stopped unexpectedly: ' + (err instanceof Error ? err.message : String(err)) });
    }
  }
  requestAnimationFrame(loop);
}

export function makeConfig(faction: Faction, enemy: Faction, difficulty: Difficulty, spectate: boolean, seed = newSeed()): MatchConfig {
  const name = getState().profile.name;
  return {
    seed, mode: 'skirmish',
    players: [
      spectate ? { faction, controller: 'ai', difficulty, name: `${difficulty[0].toUpperCase()}${difficulty.slice(1)} AI (West)` } : { faction, controller: 'human', difficulty, name },
      { faction: enemy, controller: 'ai', difficulty, name: spectate ? `${difficulty[0].toUpperCase()}${difficulty.slice(1)} AI (East)` : `${difficulty[0].toUpperCase()}${difficulty.slice(1)} AI` },
    ],
  };
}

function disposeSession(): void {
  session?.dispose();
  session = null;
  backdrop = false;
}

function start(config: MatchConfig, mode: SessionMode, replay?: ReplayData): void {
  if (!renderer) return;
  disposeSession();
  setState({ screen: 'loading', loadingText: 'Charting Glass Ravine', loadingProgress: 0.3, pauseMenu: false, result: null, hud: null });
  if (mode === 'play') lastPlay = { config, mode };
  window.setTimeout(() => {
    try {
      const r = renderer as GameRenderer;
      session = new GameSession(r, audio, overlayEl, { config, mode, replay, onEnd: onMatchEnd });
      setState({ loadingProgress: 0.8, loadingText: 'Deploying forces' });
      window.setTimeout(() => setState({ screen: 'game' }), 60);
    } catch (err) {
      console.error(err);
      setState({ screen: 'error', error: 'Could not start the match: ' + (err instanceof Error ? err.message : String(err)) });
    }
  }, 40);
}

export function startSkirmish(faction: Faction, enemy: Faction | 'random', difficulty: Difficulty): void {
  const ef = enemy === 'random' ? (Math.random() < 0.5 ? 'helix' : 'chorus') : enemy;
  start(makeConfig(faction, ef, difficulty, false), 'play');
}

export function startSpectate(faction: Faction, enemy: Faction | 'random', difficulty: Difficulty): void {
  const ef = enemy === 'random' ? (Math.random() < 0.5 ? 'helix' : 'chorus') : enemy;
  start(makeConfig(faction, ef, difficulty, true), 'spectate');
}

export function startTutorial(): void {
  const cfg: MatchConfig = {
    seed: 4242, mode: 'tutorial',
    players: [
      { faction: 'helix', controller: 'human', difficulty: 'easy', name: getState().profile.name },
      { faction: 'chorus', controller: 'passive', difficulty: 'easy', name: 'Chorus outpost' },
    ],
  };
  start(cfg, 'play');
}

export function startReplay(replay: ReplayData): void { start(replay.config, 'replay', replay); }

export async function watchSavedReplay(id: string): Promise<void> {
  const r = await repo.loadReplay(id);
  if (r) startReplay(r);
  else setState({ notice: 'That replay could not be read (it may be from an older build).' });
}

export function rematch(): void {
  if (!lastPlay) { toMenu(); return; }
  const cfg = lastPlay.config.mode === 'tutorial' ? lastPlay.config : { ...lastPlay.config, seed: newSeed() };
  start(cfg, 'play');
}

/** Menu backdrop: a quiet AI-versus-AI match rendered behind the menus. */
function startBackdrop(): void {
  if (!renderer || session) return;
  try {
    const cfg = makeConfig('helix', 'chorus', 'hard', true, newSeed());
    session = new GameSession(renderer, audio, overlayEl, { config: cfg, mode: 'spectate', backdrop: true, onEnd: () => { disposeSession(); startBackdrop(); } });
    backdrop = true;
  } catch (err) { console.warn('backdrop unavailable', err); }
}

export function toMenu(): void {
  if (session && !backdrop) disposeSession();
  setState({ screen: 'menu', pauseMenu: false, result: null });
  startBackdrop();
}

export function openScreen(s: Screen): void { setState({ screen: s }); }

async function onMatchEnd(result: MatchResult): Promise<void> {
  const st = getState();
  const won = result.winner === result.localPlayer;
  if (result.mode !== 'replay' && session?.mode === 'play') {
    const cfg = result.config;
    const profile = { ...st.profile, xp: { ...st.profile.xp } };
    const f = cfg.players[0].faction;
    profile.xp[f] += Math.round((won ? 100 : 40) + result.durationTicks / 1200 * 5);
    if (cfg.mode === 'tutorial') { if (won) profile.tutorialDone = true; }
    else if (won) profile.wins++; else profile.losses++;
    const rec: MatchRecord = { id: String(Date.now()), date: new Date().toISOString(), mode: cfg.mode, faction: f, enemy: cfg.players[1].faction, difficulty: cfg.players[1].difficulty, won, durationTicks: result.durationTicks };
    const history = [rec, ...st.history].slice(0, 30);
    setState({ profile, history });
    await repo.saveProfile(profile);
    await repo.addHistory(rec);
    if (result.replay && cfg.mode === 'skirmish') {
      await repo.saveReplay(rec.id, `${won ? 'Victory' : 'Defeat'} - ${f} vs ${cfg.players[1].faction} (${cfg.players[1].difficulty})`, result.replay);
      setState({ replays: await repo.listReplays() });
    }
  }
  setState({ result, screen: 'postgame', pauseMenu: false });
}

export function resumeGame(): void { setState({ pauseMenu: false }); session?.setPaused(false); }
export function surrender(): void { setState({ pauseMenu: false }); session?.setPaused(false); session?.surrender(); }
export function getSession(): GameSession | null { return backdrop ? null : session; }
export function isBackdrop(): boolean { return backdrop; }

export function updateSettings(patch: Partial<Settings>): void {
  const settings = { ...getState().settings, ...patch };
  setState({ settings });
  audio.setVolumes(settings);
  renderer?.applySettings(settings);
  session?.resize();
  void repo?.saveSettings(settings);
}

export function applyQuality(q: Quality): void { updateSettings({ quality: q, ...QUALITY_PRESETS[q] }); }

export function setProfileName(name: string): void {
  const profile = { ...getState().profile, name };
  setState({ profile });
  void repo?.saveProfile(profile);
}

export async function resetLocalData(): Promise<void> {
  await repo.reset();
  const [settings, profile] = await Promise.all([repo.loadSettings(), repo.loadProfile()]);
  setState({ settings, profile, history: [], replays: [], notice: 'Local data cleared.' });
  audio.setVolumes(settings);
  renderer?.applySettings(settings);
}

export function setDebugNav(on: boolean): void { renderer?.setDebugNav(on); }

// Automation hooks used by tools/screenshot.mjs and manual debugging. Local single-player only.
(window as unknown as { __sf: unknown }).__sf = {
  session: () => session,
  state: () => getState(),
  /** advance the simulation synchronously without rendering */
  advance: (ticks: number) => session?.debugAdvance(ticks),
  /** let the AI play the local side (used only for unattended captures) */
  autopilot: (on: boolean) => session?.debugAutopilot(on),
  screen: (x: number, z: number) => { const o = { x: 0, y: 0 }; if (!renderer || !session) return null; renderer.worldToScreen(x, heightAt(session.simulation.map, x, z), z, o); return o; },
  camera: (x: number, z: number, h?: number) => { if (!renderer) return; renderer.rig.jump(x, z, true); if (h) { renderer.rig.hGoal = h; renderer.rig.h = h; } },
};
export function debugNavOn(): boolean { return !!renderer?.debugNav; }
