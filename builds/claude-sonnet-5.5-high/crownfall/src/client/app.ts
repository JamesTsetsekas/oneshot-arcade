/** Application shell + match controller: screen state machine, fixed-step loop, command pipeline, tutorial. */
import { DT, HEROES, HERO_BY_ID, TALENTS } from '../shared/content';
import { Rng } from '../shared/math';
import { Sim } from '../sim/sim';
import type { Command, CommandBody, PickConfig, SimEvent } from '../sim/types';
import { h, clear } from './dom';
import { GameRenderer } from './renderer';
import { Hud } from './hud';
import { Input } from './input';
import { audio } from './audio';
import {
  addHistory, loadProfile, loadSettings, saveProfile, saveSettings, settingsWereReset, masteryLevel, type Profile, type Settings,
} from './storage';
import {
  draftScreen, errorScreen, loadingScreen, menuScreen, resultsScreen, settingsPanel, type AppApi, type DraftSelection,
} from './screens';

const TIPS = [
  'Last-hit minions for gold. Allied minions near a tower soak its shots; walk in with them, not ahead of them.',
  'Brush hides you from enemies outside a short range. Wards reveal brush and the fog around them.',
  'A Seal cannot be attacked until its Seal Guard Tower falls. Break one Seal, then take both Core Towers, then the Crown Engine.',
  'The Aether Colossus empowers nearby allied minions for 150 seconds. Contest it with your whole team.',
  'Towers target minions first, but switch to any hero who attacks an ally inside their range.',
  'Hold the ability key to see its indicator, release to cast. Esc or right-click cancels.',
];

interface TutorialStep { id: string; title: string; hint: string; done: boolean }

class Tutorial {
  steps: TutorialStep[] = [
    { id: 'move', title: 'Move', hint: 'Right-click the ground to move your hero.', done: false },
    { id: 'shop', title: 'Shop', hint: 'Press P at the fountain and buy an item (double-click an item).', done: false },
    { id: 'learn', title: 'Learn a skill', hint: 'Press Ctrl+Q (or click the glowing +) to spend your skill point.', done: false },
    { id: 'attack', title: 'Attack', hint: 'Wait for the first minion wave, then right-click an enemy minion to attack it.', done: false },
    { id: 'lasthit', title: 'Last-hit', hint: 'Deal the killing blow to an enemy minion to earn its gold.', done: false },
    { id: 'cast', title: 'Cast', hint: 'Hold Q, aim at an enemy, release to fire. Hold to see the indicator.', done: false },
    { id: 'ward', title: 'Place a ward', hint: 'Press T to place a ward at the cursor. Wards reveal brush and fog.', done: false },
    { id: 'recall', title: 'Recall', hint: 'Press B and stand still for 7 seconds to return to the fountain.', done: false },
    { id: 'tower', title: 'Tower rules', hint: 'Towers shoot minions first. Attack an enemy tower while your minions are near it. Never dive without them.', done: false },
    { id: 'objective', title: 'Objectives', hint: 'Catalysts (3:30) and the Aether Colossus (9:00) give team buffs. Break a Seal, then both Cores, then the Crown Engine to win.', done: false },
  ];
  moved = 0; recalled = false; announceSeen = false;
  coreDone = false;
  update(sim: Sim, flags: Record<string, boolean>) {
    const hs = sim.player.hero!;
    const set = (id: string, v: boolean) => { const s = this.steps.find((x) => x.id === id)!; if (v && !s.done) s.done = true; };
    set('move', !!flags.move);
    set('shop', hs.items.some(Boolean));
    set('learn', hs.ranks.some((r) => r > 0));
    set('attack', !!flags.attack && hs.damageDealt > 0);
    set('lasthit', hs.lastHits > 0);
    set('cast', !!flags.cast0 || !!flags.cast1 || !!flags.cast2 || !!flags.cast3);
    set('ward', hs.wardsPlaced > 0);
    set('recall', this.recalled);
    set('tower', hs.damageToStructures > 0);
    set('objective', sim.time > 215 || this.announceSeen);
    this.coreDone = this.steps.slice(0, 8).every((s) => s.done);
  }
  get current() { return this.steps.find((s) => !s.done); }
}

class Match {
  sim: Sim; hud!: Hud; input!: Input;
  paused = false; speed = 1; acc = 0; seq = 0;
  ended = false; endTimer = 0; resultsShown = false;
  tutorial: Tutorial | null = null;
  flags: Record<string, boolean> = {};
  pauseEl: HTMLElement | null = null;
  constructor(sim: Sim, public mode: 'match' | 'tutorial', public sel: DraftSelection | null) {
    this.sim = sim;
    if (mode === 'tutorial') this.tutorial = new Tutorial();
  }
}

export class App implements AppApi {
  root: HTMLElement; canvas: HTMLCanvasElement; ui: HTMLElement;
  settings: Settings; profile: Profile;
  renderer!: GameRenderer;
  demo: Sim | null = null;
  match: Match | null = null;
  private last = 0;
  private demoFollow = 0; private demoTimer = 0; private demoAcc = 0;
  private currentScreen: HTMLElement | null = null;
  private tutorialTick = 0;
  private lost = false;

  constructor(root: HTMLElement) {
    this.root = root;
    this.settings = loadSettings();
    this.profile = loadProfile();
    this.canvas = h('canvas', { id: 'gl' });
    this.ui = h('div', { id: 'ui' });
    root.append(this.canvas, this.ui);
    document.documentElement.style.setProperty('--ui', String(this.settings.uiScale / 100));
    document.documentElement.dataset.ui = String(this.settings.uiScale);
    audio.vol = this.settings.volume; audio.musicVol = this.settings.music;
  }

  start() {
    // capability checks
    const test = document.createElement('canvas');
    const gl2 = test.getContext('webgl2');
    if (!gl2) {
      this.ui.append(errorScreen('WebGL 2 required', 'Crownfall needs a desktop browser with WebGL 2 enabled (current Chrome, Edge or Firefox). Enable hardware acceleration in your browser settings and reload.'));
      return;
    }
    try { this.renderer = new GameRenderer(this.canvas, this.settings); }
    catch (e) {
      this.ui.append(errorScreen('Could not start the renderer', `Graphics initialisation failed: ${(e as Error).message}`));
      return;
    }
    this.canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault(); this.lost = true;
      this.ui.append(errorScreen('Graphics context lost', 'The GPU driver reset the graphics context. Reload to continue.'));
    });
    window.addEventListener('resize', () => this.renderer.resize());
    document.addEventListener('visibilitychange', () => { const m = this.match; if (document.hidden && m && !m.paused && !m.resultsShown) this.togglePause(m); });
    if (settingsWereReset) setTimeout(() => this.toast('Saved settings were unreadable and have been reset.'), 600);
    this.home();
    this.last = performance.now();
    requestAnimationFrame((t) => this.frame(t));
  }

  // ------------------------------------------------------------ AppApi
  saveSettings() {
    saveSettings(this.settings);
    audio.setVolumes(this.settings.volume, this.settings.music);
    this.renderer?.applyQuality();
  }
  toast(msg: string) {
    const t = h('div', { class: 'toast big' }, msg);
    this.ui.append(t);
    setTimeout(() => t.remove(), 2600);
  }
  private show(el: HTMLElement | null) {
    if (this.currentScreen) {
      (this.currentScreen as HTMLElement & { stop?: () => void }).stop?.();
      this.currentScreen.remove();
    }
    this.currentScreen = el;
    if (el) this.ui.append(el);
  }
  private ensureDemo() {
    if (this.demo) return;
    const rng = new Rng(Date.now() & 0x7fffffff);
    const ids = HEROES.map((x) => x.id);
    const mk = (team: 0 | 1): PickConfig => ({ heroId: rng.pick(ids), team, controller: 'bot', talents: ['mend', 'aegis'] });
    const picks = [mk(0), mk(0), mk(0), mk(1), mk(1), mk(1)];
    this.demo = new Sim({ seed: rng.int(1, 1e9), picks, difficulty: 'hard', mode: 'match', startGold: 700 });
    for (let i = 0; i < 30 * 70; i++) this.demo.step(); // fast-forward so lanes are alive
    this.demo.events.length = 0;
    this.renderer.setSim(this.demo);
    this.renderer.setFog(false);
    this.renderer.cam.height = 38;
    this.renderer.cam.lock = false;
  }
  home() {
    this.disposeMatch();
    this.ensureDemo();
    this.renderer.setSim(this.demo);
    this.renderer.setFog(false);
    this.show(menuScreen(this));
    audio.stopMusic();
  }
  openSettings(back: () => void) {
    const wrap = h('div', { class: 'screen modal-screen' }, settingsPanel(this, () => { wrap.remove(); this.renderer?.applyQuality(); back(); }));
    this.ui.append(wrap);
  }
  startDraft() {
    this.ensureDemo();
    this.show(draftScreen(this));
  }

  private randomTalents(rng: Rng): [string, string] {
    const pool = TALENTS.map((t) => t.id);
    const a = rng.pick(pool);
    let b = rng.pick(pool);
    while (b === a) b = rng.pick(pool);
    return [a, b];
  }

  beginMatch(sel: DraftSelection) {
    const rng = new Rng((Date.now() ^ 0x5bd1e995) & 0x7fffffff);
    const player = HERO_BY_ID[sel.heroId];
    const ids = HEROES.map((x) => x.id);
    // allies prefer roles different from the player's pick
    const allies = ids.filter((i) => i !== sel.heroId);
    allies.sort((a, b) => (HERO_BY_ID[a].role === player.role ? 1 : 0) - (HERO_BY_ID[b].role === player.role ? 1 : 0) || rng.next() - 0.5);
    const allyPicks = allies.slice(0, 2);
    const enemyPool = [...ids];
    const enemyPicks: string[] = [];
    while (enemyPicks.length < 3) { const p = rng.pick(enemyPool); enemyPicks.push(p); enemyPool.splice(enemyPool.indexOf(p), 1); }
    const picks: PickConfig[] = [
      { heroId: sel.heroId, team: 0, controller: 'player', talents: sel.talents, name: player.name },
      ...allyPicks.map((id) => ({ heroId: id, team: 0 as const, controller: 'bot' as const, talents: this.randomTalents(rng) })),
      ...enemyPicks.map((id) => ({ heroId: id, team: 1 as const, controller: 'bot' as const, talents: this.randomTalents(rng) })),
    ];
    const sim = new Sim({ seed: rng.int(1, 1e9), picks, difficulty: sel.difficulty, mode: 'match' });
    this.launch(sim, 'match', sel);
  }

  startTutorial() {
    const talents: [string, string] = ['mend', 'sprint'];
    const picks: PickConfig[] = [
      { heroId: 'suri', team: 0, controller: 'player', talents, name: 'Suri Vale' },
      { heroId: 'brannoch', team: 0, controller: 'bot', talents: ['aegis', 'purify'] },
      { heroId: 'oru', team: 0, controller: 'bot', talents: ['mend', 'aegis'] },
      { heroId: 'kesh', team: 1, controller: 'bot', talents: ['mend', 'aegis'] },
      { heroId: 'ilyra', team: 1, controller: 'bot', talents: ['mend', 'aegis'] },
      { heroId: 'vey', team: 1, controller: 'bot', talents: ['mend', 'aegis'] },
    ];
    const sim = new Sim({ seed: 4242, picks, difficulty: 'easy', mode: 'tutorial', enemyPassive: true, startGold: 650 });
    this.launch(sim, 'tutorial', { heroId: 'suri', talents, difficulty: 'easy' });
  }

  playAgain() {
    if (this.match?.mode === 'tutorial') { this.disposeMatch(); this.startDraft(); return; }
    this.disposeMatch();
    this.startDraft();
  }

  private launch(sim: Sim, mode: 'match' | 'tutorial', sel: DraftSelection) {
    audio.init();
    const lanes = [...sim.bots.brains.entries()].filter(([id]) => sim.byId.get(id)!.team === 0);
    const lines = lanes.map(([id, b]) => `${sim.byId.get(id)!.hero!.name}: ${b.role === 'jungle' ? 'jungle' : (b.lane === 0 ? 'upper' : 'lower') + ' lane' + (b.role === 'support' ? ' (support)' : '')}`);
    const jungler = lanes.some(([, b]) => b.role === 'jungle');
    const hint = `Suggested for you: ${lanes.some(([, b]) => b.lane === 1 && b.role !== 'jungle') ? 'upper' : 'either'} lane${jungler ? '' : ' (no jungler on your team)'}.`;
    const ld = loadingScreen([...lines, hint, `Enemy team: ${sim.heroes.filter((x) => x.team === 1).map((x) => x.hero!.name).join(', ')}`], TIPS[Math.floor(Math.random() * TIPS.length)]);
    this.show(ld);
    setTimeout(() => {
      this.disposeMatch();
      const m = new Match(sim, mode, sel);
      this.match = m;
      this.renderer.setSim(sim);
      this.renderer.setFog(true);
      this.renderer.cam.height = 34;
      this.renderer.cam.lock = true;
      m.hud = new Hud(this.hostFor(m));
      this.ui.append(m.hud.el);
      m.input = new Input(this.inputHost(m), this.canvas);
      this.show(null);
      if (mode === 'tutorial') this.refreshTutorial(m);
      audio.startMusic();
      this.renderer.cam.x = sim.player.x + 6; this.renderer.cam.z = sim.player.z;
      setTimeout(() => m.hud.toggleShop(true), 400);
      if (mode === 'match') m.hud.showHint('<b>Controls</b> · Right-click move / attack · <b>Q W E R</b> hold to aim, release to cast · <b>Ctrl+key</b> learn skill · <b>P</b> shop · <b>B</b> recall · <b>T</b> ward · <b>Tab</b> scoreboard · <b>M</b> map · <b>Alt+click</b> ping · <b>Y</b> camera lock · <b>Esc</b> pause', 16);
    }, 1900);
  }

  private disposeMatch() {
    const m = this.match;
    if (!m) return;
    m.hud.destroy(); m.input.destroy(); m.pauseEl?.remove();
    this.match = null;
    audio.stopMusic();
    audio.setIntensity(0);
  }

  // ------------------------------------------------------------ host wiring
  private send(m: Match, cmd: CommandBody) {
    if (m.paused || m.ended) return;
    m.sim.command({ ...cmd, slot: m.sim.playerSlot, seq: ++m.seq } as Command);
  }
  private hostFor(m: Match) {
    return {
      sim: m.sim, renderer: this.renderer, settings: this.settings, mode: m.mode,
      send: (c: Record<string, unknown>) => this.send(m, c as CommandBody),
      castSlot: (slot: number) => m.input.beginAbility(slot),
      rankUp: (slot: number) => this.send(m, { c: 'rank', ab: slot }),
    };
  }
  private inputHost(m: Match) {
    return {
      sim: m.sim, renderer: this.renderer, settings: this.settings,
      send: (c: CommandBody) => this.send(m, c),
      toast: (msg: string) => m.hud.toast(msg),
      toggleShop: () => m.hud.toggleShop(),
      toggleScoreboard: (show: boolean) => m.hud.showBoard(show),
      toggleMap: () => m.hud.toggleMap(),
      togglePause: () => this.togglePause(m),
      toggleDebug: () => m.hud.toggleDebug(),
      cancelUi: () => m.hud.closeOverlays(),
      uiBlocking: () => m.hud.blocking || !!m.pauseEl || m.resultsShown,
      ping: (x: number, z: number) => { if (m.hud.addPing(x, z)) { this.renderer.decals.spawn('ring', x, z, 2.4, 0xffd060, 2.5, 1, 0, { pulse: true }); audio.play('alert', 0.6); } },
      onPlayerCommand: (kind: string) => { m.flags[kind] = true; if (kind === 'recall') this.noteRecall(m); },
    };
  }
  private noteRecall(_m: Match) { /* recall completion is detected from events */ }

  private togglePause(m: Match) {
    if (m.resultsShown) return;
    if (m.pauseEl) { m.pauseEl.remove(); m.pauseEl = null; m.paused = false; return; }
    m.paused = true;
    const speedRow = m.mode === 'tutorial' ? h('div', { class: 'speed' }, h('span', {}, 'Practice speed: '), ...[1, 2, 3].map((s) => h('button', { class: `btn small${m.speed === s ? ' on' : ''}`, onclick: () => { m.speed = s; this.togglePause(m); this.togglePause(m); } }, `×${s}`))) : null;
    m.pauseEl = h('div', { class: 'screen modal-screen pause' }, h('div', { class: 'panel modal' },
      h('h2', {}, 'Paused'),
      h('p', {}, 'The match is paused. Bots are waiting.'),
      speedRow,
      h('button', { class: 'btn primary big', onclick: () => this.togglePause(m) }, 'Resume'),
      h('button', { class: 'btn big', onclick: () => this.openSettings(() => undefined) }, 'Settings'),
      h('button', { class: 'btn big', onclick: () => { this.home(); } }, 'Quit to menu')));
    this.ui.append(m.pauseEl);
  }

  // ------------------------------------------------------------ tutorial UI
  private refreshTutorial(m: Match) {
    const t = m.tutorial;
    if (!t) return;
    const cur = t.current;
    const el = h('div', { class: 'tut panel' },
      h('div', { class: 'tut-head' }, h('b', {}, 'Tutorial'), h('button', { class: 'btn small', onclick: () => { this.profile.tutorialDone = true; saveProfile(this.profile); this.home(); } }, 'Skip')),
      h('ol', {}, ...t.steps.map((s) => h('li', { class: `${s.done ? 'done' : ''}${s === cur ? ' cur' : ''}` }, h('span', {}, s.done ? '✔' : s === cur ? '▶' : '○'), s.title))),
      cur && this.settings.tutorialHints ? h('div', { class: 'tut-hint' }, cur.hint) : null,
      !cur ? h('div', { class: 'tut-hint' }, 'You know the loop. Destroy the Crown Engine to finish, or return to the menu and start a real match.') : null,
      t.coreDone ? h('button', { class: 'btn primary small', onclick: () => { this.profile.tutorialDone = true; saveProfile(this.profile); this.home(); this.startDraft(); } }, 'Start a real match') : null);
    m.hud.setTutorial(el);
  }

  // ------------------------------------------------------------ frame loop
  private frame(now: number) {
    requestAnimationFrame((t) => this.frame(t));
    if (this.lost) return;
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    const m = this.match;
    const r = this.renderer;
    if (m) {
      const sim = m.sim;
      if (!m.paused) {
        m.acc += dt * m.speed;
        let steps = 0;
        while (m.acc >= DT && steps < 8) { sim.step(); m.acc -= DT; steps++; }
        if (m.acc > DT * 8) m.acc = 0;
      }
      const events = sim.events.splice(0);
      this.dispatch(m, events);
      m.input.update(dt);
      r.render(now / 1000, m.paused ? 1 : m.acc / DT);
      m.hud.frame(dt);
      audio.listener.x = r.cam.x; audio.listener.z = r.cam.z;
      if (m.tutorial) { this.tutorialTick += dt; if (this.tutorialTick > 0.25) { this.tutorialTick = 0; const before = m.tutorial.steps.map((s) => s.done).join(); m.tutorial.update(sim, m.flags); if (before !== m.tutorial.steps.map((s) => s.done).join()) { this.refreshTutorial(m); audio.play('ring', 0.7); } } }
      if (sim.winner >= 0) {
        m.endTimer += dt;
        m.ended = true;
        if (m.endTimer > 3.4 && !m.resultsShown) this.showResults(m);
      }
    } else if (this.demo) {
      const d = this.demo;
      this.demoAcc += dt;
      let steps = 0;
      while (this.demoAcc >= DT && steps < 4) { d.step(); this.demoAcc -= DT; steps++; }
      if (this.demoAcc > DT * 4) this.demoAcc = 0;
      d.events.length = 0;
      this.demoTimer -= dt;
      if (this.demoTimer <= 0) { this.demoTimer = 14; this.demoFollow = (this.demoFollow + 1) % 6; }
      const hero = d.heroes[this.demoFollow];
      if (hero) { r.cam.x += (hero.x - r.cam.x) * Math.min(1, dt * 1.2); r.cam.z += (hero.z - r.cam.z) * Math.min(1, dt * 1.2); }
      r.render(now / 1000, Math.min(1, this.demoAcc / DT));
    }
  }

  private dispatch(m: Match, events: SimEvent[]) {
    if (!events.length) return;
    this.renderer.handleEvents(events);
    m.hud.handleEvents(events);
    for (const e of events) {
      if (e.t === 'recall' && e.done && e.unit === m.sim.player.id && m.tutorial) m.tutorial.recalled = true;
      if (e.t === 'announce' && m.tutorial && /Catalyst|Colossus/.test(e.text)) m.tutorial.announceSeen = true;
      if (e.t === 'victory') audio.play(e.team === m.sim.player.team ? 'victory' : 'defeat');
      if (e.t === 'sfx') { /* handled in hud */ }
      if (e.t === 'levelup' && e.unit === m.sim.player.id) this.renderer.addShake(0.1);
    }
  }

  private showResults(m: Match) {
    m.resultsShown = true;
    const sim = m.sim, me = sim.player, hs = me.hero!;
    const win = sim.winner === me.team;
    if (m.mode === 'match' || m.mode === 'tutorial') {
      addHistory({
        id: Date.now(), date: new Date().toISOString(), win, durationSec: Math.round(sim.time), heroId: hs.heroId, kills: hs.kills, deaths: hs.deaths, assists: hs.assists, lastHits: hs.lastHits + hs.monsterKills,
        level: hs.level, gold: Math.round(hs.totalGold), difficulty: m.sel?.difficulty ?? 'normal', mode: m.mode, items: hs.items.filter(Boolean).map((i) => i!.id), teamKills: [sim.teams[0].kills, sim.teams[1].kills],
      });
      const p = this.profile;
      p.matches++; if (win) p.wins++;
      p.mastery[hs.heroId] = (p.mastery[hs.heroId] ?? 0) + Math.round(60 + sim.time / 6 + hs.kills * 10 + hs.assists * 5 + (win ? 120 : 0));
      if (m.mode === 'tutorial') p.tutorialDone = true;
      saveProfile(p);
      void masteryLevel;
    }
    m.hud.setTutorial(null);
    const scr = resultsScreen(this, sim, m.mode === 'tutorial');
    this.ui.append(scr);
    this.currentScreen = scr;
  }
}
void clear;
