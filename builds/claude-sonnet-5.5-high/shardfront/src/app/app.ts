// app-shell: screens (menu, pre-match, settings, tech archive, replays, post-game) and match lifecycle.
import { allDefs, allUpgrades, defById, factions, validateData, type FactionId } from '../data';
import { TD } from '../sim/ext';
import { buildMap } from '../sim/map';
import { Game, type GameOptions } from './game';
import { applyPreset, DEFAULT_KEYS, KEY_LABELS, type MatchRecord, type Profile, type ReplayRecord, type Repository } from './persist';
import type { Settings } from '../render/renderer';
import { audio } from '../audio/audio';
import { defIcon } from '../ui/icons';
import { defTipHtml, upgradeTipHtml } from '../ui/hud';
import { CSS } from '../ui/styles';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const fmtTime = (ticks: number) => { const s = Math.floor(ticks / 20); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

export class App {
  game: Game | null = null;
  profile: Profile = { xp: { helix: 0, verdant: 0 }, tutorialDone: false, badges: [], banner: 'default' };
  private screen: HTMLElement | null = null;
  private lastOpts: GameOptions | null = null;

  constructor(public root: HTMLElement, public repo: Repository, public settings: Settings) {
    const st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  async init() {
    const p = await this.repo.get<Profile>('profile', 'main');
    if (p && typeof p === 'object') this.profile = { ...this.profile, ...p, xp: { helix: 0, verdant: 0, ...(p.xp ?? {}) } };
    document.getElementById('boot')?.remove();
    const errs = validateData();
    if (errs.length) { this.showError('Balance data failed validation', errs.join('<br>')); return; }
    this.showMenu();
  }

  private setScreen(el: HTMLElement) {
    this.screen?.remove();
    this.screen = el;
    this.root.appendChild(el);
  }
  private mk(cls: string, html: string): HTMLDivElement {
    const d = document.createElement('div');
    d.className = cls;
    d.innerHTML = html;
    return d;
  }

  showError(title: string, html: string) {
    const s = this.mk('screen', `<div class="panelbox errscreen"><h2>${esc(title)}</h2><div class="help" style="font-size:14px">${html}</div></div>`);
    this.setScreen(s);
  }

  // ------------------------------------------------------------ main menu
  showMenu() {
    this.game?.dispose(); this.game = null;
    audio.stopMusic();
    const corrupt = this.repo.corrupt ? '<div class="help" style="color:#ffb347;max-width:420px;text-align:center">Local save data could not be read and was reset to defaults. Your match history may be missing.</div>' : '';
    const xp = this.profile.xp;
    const s = this.mk('screen', `
      <h1 class="title">SHARDFRONT</h1><div class="subtitle">Glass Ravine · Competitive RTS</div>
      <div class="menu">
        <button class="btn primary" data-a="play">Play · Skirmish</button>
        <button class="btn" data-a="tutorial">Tutorial${this.profile.tutorialDone ? ' · ✓ complete' : ''}</button>
        <button class="btn" data-a="archive">Tech Archive</button>
        <button class="btn" data-a="replays">Replays</button>
        <button class="btn" data-a="settings">Settings</button>
        <button class="btn" data-a="credits">Credits</button>
      </div>
      ${corrupt}
      <div class="help" style="margin-top:26px;text-align:center">Helix mastery <b>${xp.helix ?? 0} XP</b> · Verdant mastery <b>${xp.verdant ?? 0} XP</b>${this.profile.badges.length ? ' · Badges: ' + this.profile.badges.map(esc).join(', ') : ''}<br>Desktop Chrome / Edge · keyboard &amp; mouse · single-player vs AI</div>`);
    s.querySelector('.menu')!.addEventListener('click', (e) => {
      const a = (e.target as HTMLElement).closest('button')?.dataset.a;
      audio.init(); audio.ui_('click');
      if (a === 'play') this.showPrematch('skirmish');
      else if (a === 'tutorial') this.showPrematch('tutorial');
      else if (a === 'archive') this.showArchive();
      else if (a === 'replays') void this.showReplays();
      else if (a === 'settings') this.showSettings(() => this.showMenu());
      else if (a === 'credits') this.showCredits();
    });
    this.setScreen(s);
  }

  // ------------------------------------------------------------ pre-match
  private pre = { faction: 'helix' as FactionId, enemy: 'verdant' as FactionId | 'random', diff: 'normal' };
  showPrematch(mode: 'skirmish' | 'tutorial') {
    const draw = () => {
      const fc = (f: FactionId) => {
        const F = factions[f];
        return `<div class="faction-card${this.pre.faction === f ? ' sel' : ''}" data-f="${f}" style="--acc:${F.accent}">
          <h3>${F.name}</h3><div class="tag">${F.tagline}</div><p>${F.blurb}</p>
          <ul>${F.traits.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
          <div class="chips">${F.units.map((u) => `<span class="chip">${defById(u).name}</span>`).join('')}</div></div>`;
      };
      const diffs: Array<[string, string, string]> = [
        ['easy', 'Easy', 'Slow decisions, small late waves. Good for learning the economy.'],
        ['normal', 'Normal', 'Scouts you, expands, reads your composition and counters it. No cheats.'],
        ['hard', 'Hard', 'Faster decision cadence, earlier expansion, bigger multi-unit pushes. Still no resource or vision cheats.'],
      ];
      s.innerHTML = `
        <div class="panelbox" style="width:min(1100px,94vw)">
          <h2>${mode === 'tutorial' ? 'Tutorial · Helix Directorate' : 'Skirmish · Glass Ravine'}</h2>
          ${mode === 'tutorial' ? '<p class="help">A guided 8-10 minute scenario: select, mine, build, produce, control groups, abilities, attack-move and destroy an enemy outpost. Instructions never pause the game.</p>' : ''}
          <div class="row">
            <div style="flex:2;min-width:600px"><div class="help" style="letter-spacing:.2em;text-transform:uppercase">Your faction</div><div class="row">${mode === 'tutorial' ? fc('helix') : fc('helix') + fc('verdant')}</div></div>
            <div style="flex:1;min-width:300px">
              <div class="help" style="letter-spacing:.2em;text-transform:uppercase">Map</div>
              <canvas id="pm-map" class="mapprev" width="260" height="260" style="width:260px;height:260px"></canvas>
              <div class="help">Two high-ground mains, defensible naturals, risky side expansions, a central canyon with two bridges, a lower route through the basin, crystal barriers, brush that hides units, and two capturable Watch Pylons.</div>
            </div>
          </div>
          ${mode === 'skirmish' ? `
          <div class="help" style="letter-spacing:.2em;text-transform:uppercase;margin-top:12px">AI opponent</div>
          <div class="diff">${diffs.map((d) => `<button class="btn${this.pre.diff === d[0] ? ' sel' : ''}" data-d="${d[0]}">${d[1]}</button>`).join('')}</div>
          <div class="help">${diffs.find((d) => d[0] === this.pre.diff)![2]}</div>
          <div class="diff" style="max-width:520px">${(['verdant', 'helix', 'random'] as const).map((e) => `<button class="btn${this.pre.enemy === e ? ' sel' : ''}" data-e="${e}">Enemy: ${e === 'random' ? 'Random' : factions[e].name}</button>`).join('')}</div>` : ''}
          <div class="row" style="margin-top:14px;justify-content:space-between"><button class="btn" data-a="back">← Back</button><button class="btn primary" data-a="start" style="min-width:240px;text-align:center">Start match</button></div>
        </div>`;
      const cv = s.querySelector('#pm-map') as HTMLCanvasElement;
      this.drawMapPreview(cv);
      s.querySelectorAll('[data-f]').forEach((n) => ((n as HTMLElement).onclick = () => { this.pre.faction = (n as HTMLElement).dataset.f as FactionId; audio.ui_('click'); draw(); }));
      s.querySelectorAll('[data-d]').forEach((n) => ((n as HTMLElement).onclick = () => { this.pre.diff = (n as HTMLElement).dataset.d!; audio.ui_('click'); draw(); }));
      s.querySelectorAll('[data-e]').forEach((n) => ((n as HTMLElement).onclick = () => { this.pre.enemy = (n as HTMLElement).dataset.e as FactionId | 'random'; audio.ui_('click'); draw(); }));
      (s.querySelector('[data-a=back]') as HTMLElement).onclick = () => this.showMenu();
      (s.querySelector('[data-a=start]') as HTMLElement).onclick = () => {
        audio.init();
        const enemy: FactionId = mode === 'tutorial' ? 'verdant' : this.pre.enemy === 'random' ? (Math.random() < 0.5 ? 'helix' : 'verdant') : this.pre.enemy;
        const faction: FactionId = mode === 'tutorial' ? 'helix' : this.pre.faction;
        void this.startGame({ mode, faction, enemy, difficulty: this.pre.diff, seed: (Date.now() & 0xffffff) | 1 });
      };
    };
    const s = this.mk('screen', '');
    this.setScreen(s);
    draw();
  }

  private drawMapPreview(cv: HTMLCanvasElement) {
    const m = buildMap();
    const N = m.size;
    const ctx = cv.getContext('2d')!;
    const img = ctx.createImageData(N, N);
    for (let i = 0; i < N * N; i++) {
      const h = m.heightC[i];
      let r = 40 + h * 7, g = 48 + h * 8, b = 58 + h * 7;
      if (m.chasm[i]) { r = 8; g = 14; b = 24; } else if (m.blocked[i]) { r = 24; g = 27; b = 33; if (h > 2) { r = 72; g = 76; b = 82; } } else if (m.brush[i]) { r = 30; g = 74; b = 62; } else if (m.bridge[i]) { r = 170; g = 140; b = 74; }
      img.data[i * 4] = r; img.data[i * 4 + 1] = g; img.data[i * 4 + 2] = b; img.data[i * 4 + 3] = 255;
    }
    const off = document.createElement('canvas'); off.width = N; off.height = N;
    off.getContext('2d')!.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, 0, 0, cv.width, cv.height);
    const k = cv.width / N;
    for (const r of m.resources) { ctx.fillStyle = r.kind === 'ore' ? '#44e9d0' : '#ff8be0'; ctx.fillRect(r.x * k - 1.5, r.y * k - 1.5, 3, 3); }
    m.starts.forEach((s, i) => { ctx.fillStyle = i === 0 ? '#3aa8ff' : '#ff6a3d'; ctx.beginPath(); ctx.arc(s.x * k, s.y * k, 6, 0, Math.PI * 2); ctx.fill(); });
    for (const p of m.pylons) { ctx.fillStyle = '#e8f4ff'; ctx.fillRect(p.x * k - 3, p.y * k - 3, 6, 6); }
  }

  // ------------------------------------------------------------ match lifecycle
  async startGame(opts: GameOptions) {
    this.lastOpts = opts;
    const load = this.mk('screen', `<h1 class="title" style="font-size:40px">SHARDFRONT</h1><div class="subtitle" id="ld-t">Preparing the moon…</div><div class="loadbar"><i id="ld-b"></i></div>`);
    this.setScreen(load);
    const step = async (t: string, p: number) => { (load.querySelector('#ld-t') as HTMLElement).textContent = t; (load.querySelector('#ld-b') as HTMLElement).style.width = p + '%'; await nextFrame(); await nextFrame(); };
    try {
      await step('Fracturing the terrain…', 25);
      await step('Growing models and effects…', 55);
      this.game?.dispose();
      this.game = new Game(this, this.root, opts, this.settings);
      await step('Starting simulation…', 100);
      this.screen?.remove(); this.screen = null;
      this.game.renderer.renderer.domElement.focus();
    } catch (e) {
      console.error(e);
      this.game?.dispose(); this.game = null;
      this.showError('Could not start the match', `${esc(String((e as Error)?.message ?? e))}<br><br>Try lowering the graphics preset in Settings, or reload the page.<br><br><button class="btn" id="err-back">Back to menu</button>`);
      this.screen?.querySelector('#err-back')?.addEventListener('click', () => this.showMenu());
    }
  }

  exitToMenu() { this.showMenu(); }

  /** ?bench=1 : automated benchmark scene (220 active units) */
  async startBenchmark() {
    await this.startGame({ mode: 'skirmish', faction: 'helix', enemy: 'verdant', difficulty: 'normal', seed: 7 });
    this.game?.startBenchmark();
  }

  async markTutorialDone() {
    this.profile.tutorialDone = true;
    if (!this.profile.badges.includes('Tutorial graduate')) this.profile.badges.push('Tutorial graduate');
    await this.repo.put('profile', 'main', this.profile);
  }

  async onMatchEnd(game: Game) {
    const sim = game.sim;
    const won = sim.winner === 0;
    const rec: MatchRecord = {
      id: 'm' + Date.now().toString(36), date: Date.now(), duration: sim.tick, faction: sim.players[0].faction.name, enemy: sim.players[1].faction.name,
      difficulty: game.opts.difficulty, result: won ? 'victory' : 'defeat', mode: game.opts.mode,
    };
    let replayId = '';
    if (game.opts.mode === 'skirmish') {
      await this.repo.put('history', rec.id, rec);
      const hist = (await this.repo.list<MatchRecord>('history')).sort((a, b) => b.date - a.date);
      for (const old of hist.slice(40)) await this.repo.del('history', old.id);
      const rr = game.replayRecord();
      replayId = rr.id;
      await this.repo.put('replays', rr.id, rr);
      const reps = (await this.repo.list<ReplayRecord>('replays')).sort((a, b) => b.date - a.date);
      for (const old of reps.slice(8)) await this.repo.del('replays', old.id);
      const f = sim.players[0].faction.id;
      this.profile.xp[f] = (this.profile.xp[f] ?? 0) + (won ? 100 : 30);
      if (won && !this.profile.badges.includes('First victory')) this.profile.badges.push('First victory');
      if (won && game.opts.difficulty === 'hard' && !this.profile.badges.includes('Hard AI defeated')) this.profile.badges.push('Hard AI defeated');
      await this.repo.put('profile', 'main', this.profile);
    }
    this.showPostGame(game, won, replayId);
  }

  private showPostGame(game: Game, won: boolean, replayId: string) {
    const sim = game.sim;
    const [me, foe] = sim.players;
    const s = this.mk('screen', '');
    const st = me.stats, ft = foe.stats;
    const army = (a: number[]) => a.length ? Math.max(...a) : 0;
    const tl = [...st.timeline.map((e) => ({ ...e, who: 0 })), ...ft.timeline.map((e) => ({ ...e, who: 1 }))].sort((a, b) => a.tick - b.tick);
    s.innerHTML = `<div class="panelbox" style="width:min(1100px,95vw)">
      <h1 class="big" style="color:${won ? '#5dffb0' : '#ff7a6a'}">${game.opts.mode === 'tutorial' ? (won ? 'TUTORIAL COMPLETE' : 'DEFEAT') : won ? 'VICTORY' : 'DEFEAT'}</h1>
      <div class="help">${esc(me.faction.name)} vs ${esc(foe.faction.name)} · ${esc(game.opts.difficulty)} · duration <b>${fmtTime(sim.tick)}</b></div>
      <div class="row">
        <div style="flex:1;min-width:360px">
          <table class="t"><tr><th></th><th style="color:#3aa8ff">You</th><th style="color:#ff6a3d">Enemy</th></tr>
            <tr><td>Prism Ore collected</td><td>${Math.round(st.ore)}</td><td>${Math.round(ft.ore)}</td></tr>
            <tr><td>Flux collected</td><td>${Math.round(st.flux)}</td><td>${Math.round(ft.flux)}</td></tr>
            <tr><td>Units created</td><td>${st.created}</td><td>${ft.created}</td></tr>
            <tr><td>Units lost</td><td>${st.lost}</td><td>${ft.lost}</td></tr>
            <tr><td>Enemy units destroyed</td><td>${st.killed}</td><td>${ft.killed}</td></tr>
            <tr><td>Structures built / lost</td><td>${st.structures} / ${st.structuresLost}</td><td>${ft.structures} / ${ft.structuresLost}</td></tr>
            <tr><td>Peak workers</td><td>${st.workersMax}</td><td>${ft.workersMax}</td></tr>
            <tr><td>Peak army value</td><td>${army(st.armySamples)}</td><td>${army(ft.armySamples)}</td></tr>
            <tr><td>First expansion</td><td>${st.firstExpandTick >= 0 ? fmtTime(st.firstExpandTick) : '—'}</td><td>${ft.firstExpandTick >= 0 ? fmtTime(ft.firstExpandTick) : '—'}</td></tr>
          </table>
        </div>
        <div style="flex:1;min-width:380px">
          <div class="help" style="margin:0">Army value over time</div><canvas id="g-army" class="graph" width="440" height="110" style="width:440px;height:110px"></canvas>
          <div class="help" style="margin:8px 0 0">Resources collected (cumulative)</div><canvas id="g-eco" class="graph" width="440" height="110" style="width:440px;height:110px"></canvas>
        </div>
      </div>
      <div class="help" style="letter-spacing:.2em;text-transform:uppercase;margin-top:10px">Timeline</div>
      <div style="max-height:150px;overflow:auto;border:1px solid var(--line);padding:6px 10px;font-size:12px;line-height:1.55">${tl.filter((e) => e.kind !== 'loss' || e.text.includes('Core') || e.text.includes('Heartgrove')).slice(0, 60).map((e) => `<div><span style="color:#7d92a4">${fmtTime(e.tick)}</span> <span style="color:${e.who === 0 ? '#3aa8ff' : '#ff6a3d'}">●</span> ${esc(e.text)}</div>`).join('')}</div>
      <div class="row" style="margin-top:14px">
        ${game.opts.mode === 'replay' ? '' : '<button class="btn primary" data-a="rematch">Rematch</button>'}
        ${replayId ? '<button class="btn" data-a="replay">Watch replay</button>' : ''}
        <button class="btn" data-a="menu">Main menu</button>
      </div></div>`;
    const draw = (id: string, a: number[], b: number[]) => {
      const cv = s.querySelector(id) as HTMLCanvasElement;
      const ctx = cv.getContext('2d')!;
      const n = Math.max(a.length, b.length, 2);
      const mx = Math.max(1, ...a, ...b);
      ctx.fillStyle = '#070a0f'; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.strokeStyle = '#16202b'; ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(0, (cv.height / 4) * i); ctx.lineTo(cv.width, (cv.height / 4) * i); ctx.stroke(); }
      for (const [arr, col] of [[a, '#3aa8ff'], [b, '#ff6a3d']] as const) {
        ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath();
        arr.forEach((v, i) => { const x = (i / (n - 1)) * (cv.width - 8) + 4, y = cv.height - 6 - (v / mx) * (cv.height - 14); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
        ctx.stroke();
      }
    };
    this.setScreen(s);
    draw('#g-army', st.armySamples, ft.armySamples);
    draw('#g-eco', st.econSamples, ft.econSamples);
    const opts = game.opts;
    s.querySelector('[data-a=rematch]')?.addEventListener('click', () => void this.startGame({ ...opts, seed: (Date.now() & 0xffffff) | 1 }));
    s.querySelector('[data-a=menu]')?.addEventListener('click', () => this.showMenu());
    s.querySelector('[data-a=replay]')?.addEventListener('click', async () => { const r = await this.repo.get<ReplayRecord>('replays', replayId); if (r) void this.startGame({ mode: 'replay', faction: opts.faction, enemy: opts.enemy, difficulty: opts.difficulty, seed: 1, replay: r }); });
    // game stays alive behind the overlay until disposed
    this.game?.dispose();
    this.game = null;
    this.lastOpts = opts;
  }

  // ------------------------------------------------------------ pause menu
  showPauseMenu(game: Game, resume: () => void): HTMLElement {
    const el = this.mk('pause', `<div class="panelbox" style="min-width:340px"><h2>Paused</h2><div class="menu" style="min-width:0">
      <button class="btn primary" data-a="resume">Resume</button>
      <button class="btn" data-a="settings">Settings</button>
      ${game.opts.mode === 'skirmish' ? '<button class="btn" data-a="surrender">Surrender</button>' : ''}
      ${game.opts.mode !== 'replay' ? '<button class="btn" data-a="restart">Restart match</button>' : ''}
      <button class="btn" data-a="quit">Quit to main menu</button></div>
      <div class="help" style="margin-top:12px">Esc / F10 resumes. Match state is saved locally only when a skirmish ends.</div></div>`);
    game['root'].appendChild(el);
    el.addEventListener('click', (e) => {
      const a = (e.target as HTMLElement).closest('button')?.dataset.a;
      if (!a) return;
      audio.ui_('click');
      if (a === 'resume') resume();
      else if (a === 'settings') { el.style.display = 'none'; this.showSettings(() => { el.style.display = 'flex'; }, true); }
      else if (a === 'surrender') { resume(); game.cmd({ c: 'surrender' }); }
      else if (a === 'restart') { const o = game.opts; resume(); void this.startGame({ ...o, seed: (Date.now() & 0xffffff) | 1 }); }
      else if (a === 'quit') this.showMenu();
    });
    return el;
  }

  // ------------------------------------------------------------ settings
  async saveSettings() {
    await this.repo.put('settings', 'main', this.settings);
    audio.setVolumes(this.settings, this.settings.masterMuted);
    this.game?.renderer.applySettings(this.settings);
  }
  showSettings(back: () => void, overlay = false) {
    let tab = 'graphics';
    const s = this.mk(overlay ? 'pause' : 'screen', '');
    s.style.zIndex = '60';
    const S = this.settings;
    const draw = () => {
      const range = (k: keyof Settings, label: string, min: number, max: number, step: number) => `<div class="setrow"><span>${label}</span><span><input type="range" data-r="${k}" min="${min}" max="${max}" step="${step}" value="${S[k] as number}"> <b>${(S[k] as number).toFixed(2)}</b></span></div>`;
      const check = (k: keyof Settings, label: string, hint = '') => `<div class="setrow"><span>${label}<div class="help" style="margin:0">${hint}</div></span><input type="checkbox" data-c="${k}" ${S[k] ? 'checked' : ''}></div>`;
      let body = '';
      if (tab === 'graphics') body = `
        <div class="setrow"><span>Graphics preset</span><select data-s="quality"><option value="low">Low (30 FPS fallback)</option><option value="medium">Medium</option><option value="high">High</option></select></div>
        ${range('renderScale', 'Render scale', 0.5, 1.5, 0.05)}${check('shadows', 'Shadows', 'Cascade-style sun shadows follow the camera (disabled on Low).')}${range('effects', 'Effects density', 0.2, 1, 0.1)}${check('antialias', 'Anti-aliasing', 'Applies when the next match starts.')}${check('showStats', 'Performance panel', 'FPS, frame time, draw calls.')}${check('debugSurfaces', 'Surface debug overlay (F3)', 'Walkable / blocked / hover-only / brush / bridge / ramp.')}`;
      if (tab === 'audio') body = `${range('master', 'Master', 0, 1, 0.05)}${range('sfx', 'Effects bus', 0, 1, 0.05)}${range('music', 'Music bus', 0, 1, 0.05)}${range('ui', 'Alerts / UI bus', 0, 1, 0.05)}${check('masterMuted', 'Mute all')}`;
      if (tab === 'camera') body = `${check('edgeScroll', 'Edge scrolling', 'Off by default. Arrow keys and middle-mouse drag always work.')}${check('wasdPan', 'WASD panning', 'Conflicts with the A / S unit hotkeys - leave off unless you rebind them.')}${check('rotateCamera', 'Camera rotation in 90° steps', 'Use the rotate keys (default , and .).')}${range('scrollSpeed', 'Scroll speed', 0.4, 2, 0.1)}`;
      if (tab === 'controls') body = `<div class="help">Click a binding, then press the new key. Esc cancels.</div><table class="t">${Object.keys(DEFAULT_KEYS).map((k) => `<tr><td>${KEY_LABELS[k] ?? k}</td><td><button class="btn small keybtn" data-k="${k}">${esc(S.keys[k] === ' ' ? 'Space' : S.keys[k])}</button></td></tr>`).join('')}</table><div class="help">Command-card slots (production, build palette, abilities) use fixed positional keys: Q W E R / A S D F / Z X C V.<br>Fixed: Ctrl+1-9 assign group, 1-9 select, double-tap centres, Shift adds, Esc cancels.</div><button class="btn small" data-a="resetkeys">Reset bindings</button>`;
      if (tab === 'access') body = `<div class="setrow"><span>Team colour palette<div class="help" style="margin:0">Team colours appear on every base ring, stripe, health bar and the minimap.</div></span><select data-s="palette"><option value="default">Default (blue / orange)</option><option value="deuter">Deuteranopia-safe (blue / yellow)</option><option value="tritan">Tritanopia-safe (magenta / green)</option></select></div>
        ${check('reducedMotion', 'Reduced motion', 'No camera impulse on siege impacts; fewer ambient particles.')}${check('subtitles', 'Show text alerts', 'Alert feed in the top-left of the screen.')}`;
      s.innerHTML = `<div class="panelbox" style="width:min(720px,94vw)"><h2>Settings</h2>
        <div class="tabs">${['graphics', 'audio', 'camera', 'controls', 'access'].map((t) => `<button class="btn small${tab === t ? ' sel' : ''}" data-t="${t}">${t === 'access' ? 'Accessibility' : t === 'camera' ? 'Camera & input' : t}</button>`).join('')}</div>
        ${body}<div style="margin-top:16px"><button class="btn primary" data-a="done">Done</button></div></div>`;
      s.querySelectorAll('[data-t]').forEach((n) => ((n as HTMLElement).onclick = () => { tab = (n as HTMLElement).dataset.t!; draw(); }));
      s.querySelectorAll('[data-r]').forEach((n) => ((n as HTMLInputElement).oninput = () => { (S as unknown as Record<string, unknown>)[(n as HTMLElement).dataset.r!] = parseFloat((n as HTMLInputElement).value); ((n.nextElementSibling) as HTMLElement).textContent = parseFloat((n as HTMLInputElement).value).toFixed(2); void this.saveSettings(); }));
      s.querySelectorAll('[data-c]').forEach((n) => ((n as HTMLInputElement).onchange = () => { (S as unknown as Record<string, unknown>)[(n as HTMLElement).dataset.c!] = (n as HTMLInputElement).checked; void this.saveSettings(); }));
      s.querySelectorAll('[data-s]').forEach((n) => {
        const k = (n as HTMLElement).dataset.s!;
        (n as HTMLSelectElement).value = (S as unknown as Record<string, string>)[k];
        (n as HTMLSelectElement).onchange = () => { if (k === 'quality') applyPreset(S, (n as HTMLSelectElement).value as Settings['quality']); else (S as unknown as Record<string, unknown>)[k] = (n as HTMLSelectElement).value; void this.saveSettings(); if (k === 'quality') draw(); };
      });
      s.querySelectorAll('[data-k]').forEach((n) => {
        (n as HTMLElement).onclick = () => {
          const k = (n as HTMLElement).dataset.k!;
          (n as HTMLElement).textContent = 'press a key…';
          const h = (e: KeyboardEvent) => {
            e.preventDefault(); e.stopPropagation();
            window.removeEventListener('keydown', h, true);
            if (e.key !== 'Escape') {
              const nk = e.key.length === 1 ? e.key.toLowerCase() : e.key;
              for (const o of Object.keys(S.keys)) if (o !== k && S.keys[o] === nk) S.keys[o] = S.keys[k];
              S.keys[k] = nk;
              void this.saveSettings();
            }
            draw();
          };
          window.addEventListener('keydown', h, true);
        };
      });
      s.querySelector('[data-a=resetkeys]')?.addEventListener('click', () => { S.keys = { ...DEFAULT_KEYS }; void this.saveSettings(); draw(); });
      (s.querySelector('[data-a=done]') as HTMLElement).onclick = () => { s.remove(); this.screen = overlay ? this.screen : this.screen; back(); };
    };
    draw();
    if (overlay) this.game?.['root'].appendChild(s); else this.setScreen(s);
  }

  // ------------------------------------------------------------ tech archive
  showArchive() {
    let tab: FactionId = 'helix';
    const s = this.mk('screen', '');
    const draw = () => {
      const F = factions[tab];
      const cards = [...F.units, ...F.structures].map((id) => { const d = defById(id); return `<div class="tip" style="position:static;display:block;max-width:none;pointer-events:auto"><div style="display:flex;gap:10px"><img src="${defIcon(id)}" width="56" height="56" alt="">${'<div>' + defTipHtml(d, true) + '</div>'}</div></div>`; }).join('');
      const ups = F.upgrades.map((id) => upgradeTipHtml(allUpgrades.find((u) => u.id === id)!, false)).map((h) => `<div class="tip" style="position:static;display:block;max-width:none">${h}</div>`).join('');
      s.innerHTML = `<div class="panelbox" style="width:min(1180px,96vw)"><h2>Tech Archive</h2>
        <div class="tabs"><button class="btn small${tab === 'helix' ? ' sel' : ''}" data-t="helix">Helix Directorate</button><button class="btn small${tab === 'verdant' ? ' sel' : ''}" data-t="verdant">Verdant Chorus</button></div>
        <div class="help">${esc(F.blurb)}</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:8px">${cards}</div>
        <h2 style="margin-top:16px">Upgrades</h2><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:8px">${ups}</div>
        <div style="margin-top:14px"><button class="btn" data-a="back">← Back</button></div></div>`;
      s.querySelectorAll('[data-t]').forEach((n) => ((n as HTMLElement).onclick = () => { tab = (n as HTMLElement).dataset.t as FactionId; draw(); }));
      (s.querySelector('[data-a=back]') as HTMLElement).onclick = () => this.showMenu();
    };
    draw();
    this.setScreen(s);
  }

  // ------------------------------------------------------------ replays
  async showReplays() {
    const s = this.mk('screen', '');
    this.setScreen(s);
    const [reps, hist] = await Promise.all([this.repo.list<ReplayRecord>('replays'), this.repo.list<MatchRecord>('history')]);
    reps.sort((a, b) => b.date - a.date);
    hist.sort((a, b) => b.date - a.date);
    s.innerHTML = `<div class="panelbox" style="width:min(900px,94vw)"><h2>Replays</h2>
      <div class="help">Replays store the seed and every validated command. Playback re-simulates the match and checks periodic state hashes against the recording.</div>
      ${reps.length ? `<table class="t"><tr><th>Date</th><th>Match</th><th>Length</th><th>Result</th><th></th></tr>${reps.map((r) => `<tr><td>${new Date(r.date).toLocaleString()}</td><td>${esc(r.label)}</td><td>${fmtTime(r.ticks)}</td><td>${r.winner === 0 ? 'Victory' : 'Defeat'}</td><td><button class="btn small" data-w="${r.id}">Watch</button> <button class="btn small" data-x="${r.id}">Delete</button></td></tr>`).join('')}</table>` : '<p class="help">No replays yet. Finish a skirmish and it will appear here.</p>'}
      <h2 style="margin-top:18px">Match history</h2>
      ${hist.length ? `<table class="t"><tr><th>Date</th><th>Faction</th><th>Opponent</th><th>Level</th><th>Length</th><th>Result</th></tr>${hist.slice(0, 12).map((h) => `<tr><td>${new Date(h.date).toLocaleDateString()}</td><td>${esc(h.faction)}</td><td>${esc(h.enemy)}</td><td>${esc(h.difficulty)}</td><td>${fmtTime(h.duration)}</td><td style="color:${h.result === 'victory' ? '#5dff8a' : '#ff7a6a'}">${h.result}</td></tr>`).join('')}</table>` : '<p class="help">No matches yet.</p>'}
      <div style="margin-top:14px"><button class="btn" data-a="back">← Back</button></div></div>`;
    (s.querySelector('[data-a=back]') as HTMLElement).onclick = () => this.showMenu();
    s.querySelectorAll('[data-w]').forEach((n) => ((n as HTMLElement).onclick = () => { const r = reps.find((x) => x.id === (n as HTMLElement).dataset.w)!; void this.startGame({ mode: 'replay', faction: r.cfg.factions[0], enemy: r.cfg.factions[1], difficulty: r.cfg.ai[1] ?? 'normal', seed: 1, replay: r }); }));
    s.querySelectorAll('[data-x]').forEach((n) => ((n as HTMLElement).onclick = async () => { await this.repo.del('replays', (n as HTMLElement).dataset.x!); void this.showReplays(); }));
  }

  showCredits() {
    const s = this.mk('screen', `<div class="panelbox" style="width:min(720px,94vw)"><h2>Credits</h2>
      <p class="help" style="font-size:13px">Shardfront is an original design. All factions, units, structures, maps, interface art, sounds and music are procedurally generated at runtime; no third-party game assets are used and nothing is derived from any existing franchise.</p>
      <p class="help" style="font-size:13px">Built with TypeScript, <b>Three.js</b> (MIT) for rendering and <b>Vite</b> (MIT) for tooling. Tests run on <b>Vitest</b>.<br>Audio is synthesised with the Web Audio API.</p>
      <p class="help">Single-player prototype - vertical slice. See ASSETS.md for the asset manifest.</p>
      <div><button class="btn" data-a="back">← Back</button></div></div>`);
    (s.querySelector('[data-a=back]') as HTMLElement).onclick = () => this.showMenu();
    this.setScreen(s);
  }
}

void allDefs; void TD;
