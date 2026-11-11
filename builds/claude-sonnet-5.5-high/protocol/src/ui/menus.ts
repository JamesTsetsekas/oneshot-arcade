// Menu screens: title, play setup, practice, learn, settings (with crosshair editor), credits, pause, loading, errors.

import { RULESETS } from '../content/economy';
import { DEFAULT_SETTINGS, Settings, exportSensitivity, saveSettings } from '../client/settings';
import { el, esc } from './hud';

export interface StartOptions {
  mode: 'match' | 'practice';
  rules: 'quick' | 'full';
  side: 'int' | 'cus' | 'random';
  difficulty: 'easy' | 'normal' | 'hard';
}

export class Menus {
  readonly root: HTMLElement;
  onStart: (o: StartOptions) => void = () => undefined;
  onResume: () => void = () => undefined;
  onQuit: () => void = () => undefined;
  onSettingsChanged: () => void = () => undefined;
  onUiClick: () => void = () => undefined;

  constructor(parent: HTMLElement, private settings: () => Settings) {
    this.root = el('div');
    parent.append(this.root);
  }

  private set(node: HTMLElement): void { this.root.innerHTML = ''; this.root.append(node); }
  clear(): void { this.root.innerHTML = ''; }
  get visible(): boolean { return this.root.childElementCount > 0; }

  private click(fn: () => void): () => void { return () => { this.onUiClick(); fn(); }; }

  // ------------------------------------------------------------------ title
  showTitle(): void {
    const s = el('div', 'screen dim');
    const wrap = el('div', 'title-wrap');
    const left = el('div');
    left.innerHTML = `<div class="logo">Last<span>Protocol</span></div><div class="tagline">Tactical 5v5 · Cipher Breach · Aperture Annex</div>
      <div class="badge-row"><span class="badge">No respawns</span><span class="badge">Buy · Save · Retake</span><span class="badge">Utility is a language</span></div>
      <p style="max-width:470px;color:var(--dim);line-height:1.6;margin-top:22px">Intrusion arms the Cipher at a vault; Custodians stop them. One life per round, money carries over, every sound is a clue. You play on a squad of bots against a bot squad, with the full economy and round rules.</p>`;
    const menu = el('div', 'menu');
    const mkBtn = (label: string, sub: string, fn: () => void, cls = ''): void => {
      const b = el('button', 'btn ' + cls, `${esc(label)}<span class="sub">${esc(sub)}</span>`);
      b.addEventListener('click', this.click(fn));
      menu.append(b);
    };
    mkBtn('Play', 'Cipher Breach vs bots · quick or full match', () => this.showPlay(), 'primary');
    mkBtn('Practice', 'Infinite money, buy anywhere, grenade trajectory preview', () => this.showPlay(true));
    mkBtn('Learn', 'Controls, rules, economy', () => this.showLearn());
    mkBtn('Settings', 'Mouse, video, audio, crosshair, accessibility', () => this.showSettings(() => this.showTitle()));
    mkBtn('Credits', 'Assets and licences', () => this.showCredits());
    wrap.append(left, menu);
    s.append(wrap);
    this.set(s);
  }

  // ------------------------------------------------------------------ play
  showPlay(practice = false): void {
    const st = this.settings();
    const s = el('div', 'screen dim');
    const card = el('div', 'panel-wide');
    card.style.width = 'min(760px,94vw)';
    card.innerHTML = `<h2>${practice ? 'Practice' : 'Play'}</h2><div style="color:var(--dim);font-size:14px;line-height:1.5">${practice ? 'Practice server: unlimited money, buy at any time and place, grenade trajectory preview (hold a grenade). Bots fight on both sides.' : 'Your squad of four bots joins you against five bots. Full economy, objective, side swap and overtime rules.'}</div>`;
    let rules: 'quick' | 'full' = st.rules, side = st.side, diff = st.difficulty;
    const group = <T extends string>(label: string, opts: Array<[T, string]>, get: () => T, setv: (v: T) => void): HTMLElement => {
      const w = el('div'); w.append(el('div', 'label', label));
      const row = el('div', 'row');
      for (const [v, name] of opts) {
        const c = el('button', 'chip' + (get() === v ? ' on' : ''), esc(name));
        c.addEventListener('click', () => { this.onUiClick(); setv(v); row.querySelectorAll('.chip').forEach((n) => n.classList.remove('on')); c.classList.add('on'); });
        row.append(c);
      }
      w.append(row);
      return w;
    };
    if (!practice) card.append(group('Match length', [['quick', `${RULESETS.quick.name} · ${RULESETS.quick.blurb}`], ['full', `${RULESETS.full.name} · ${RULESETS.full.blurb}`]], () => rules, (v) => { rules = v; }));
    card.append(group('Starting side', [['int', 'Intrusion (attack)'], ['cus', 'Custodian (defend)'], ['random', 'Random']], () => side, (v) => { side = v; }));
    card.append(group('Bot skill', [['easy', 'Easy'], ['normal', 'Normal'], ['hard', 'Hard']], () => diff, (v) => { diff = v; }));
    const row = el('div', 'row'); row.style.marginTop = '24px';
    const go = el('button', 'btn primary', practice ? 'Start practice' : 'Deploy');
    go.addEventListener('click', this.click(() => {
      const cur = this.settings(); cur.rules = rules; cur.side = side; cur.difficulty = diff; saveSettings(cur);
      this.onStart({ mode: practice ? 'practice' : 'match', rules, side, difficulty: diff });
    }));
    const back = el('button', 'btn', 'Back');
    back.addEventListener('click', this.click(() => this.showTitle()));
    row.append(go, back);
    card.append(row);
    s.append(card);
    this.set(s);
  }

  // ------------------------------------------------------------------ learn
  showLearn(): void {
    const s = el('div', 'screen dim');
    const card = el('div', 'panel-wide');
    const k = (keys: string, what: string) => `<b>${esc(what)}</b><span>${keys}</span>`;
    card.innerHTML = `<h2>Learn</h2><div class="grid2">
      <div><div class="label">Controls</div><div class="kv">
        ${k('<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>', 'Move')}${k('<kbd>Shift</kbd> hold', 'Silent walk (52%)')}${k('<kbd>Ctrl</kbd> / <kbd>C</kbd>', 'Crouch (40%)')}${k('<kbd>Space</kbd>', 'Jump')}
        ${k('<kbd>LMB</kbd> / <kbd>RMB</kbd>', 'Fire / scope or lob')}${k('<kbd>R</kbd>', 'Reload')}${k('<kbd>E</kbd> hold', 'Arm · disarm · pick up')}${k('<kbd>G</kbd>', 'Drop weapon')}
        ${k('<kbd>1</kbd><kbd>2</kbd><kbd>3</kbd>', 'Primary · sidearm · tool')}${k('<kbd>4</kbd>–<kbd>7</kbd>', 'Utility slots')}${k('<kbd>Q</kbd> · wheel', 'Quick switch · cycle')}${k('<kbd>B</kbd>', 'Buy menu (buy phase)')}
        ${k('<kbd>Tab</kbd> hold', 'Scoreboard · economy')}${k('<kbd>M</kbd>', 'Tactical map')}${k('<kbd>F</kbd>', 'Inspect')}${k('<kbd>Esc</kbd>', 'Menu')}
      </div></div>
      <div><div class="label">Round rules</div>
        <div style="line-height:1.6;font-size:14px;color:#cdd6df">
        • 20 s buy phase, 105 s action clock, one life per round.<br>
        • Intrusion carries the Cipher Spike and must <b>hold E for 3.2 s inside vault A or B</b>. Then a <b>35 s</b> timer runs.<br>
        • Custodians <b>disarm in 8 s (5 s with a Defuse Tool)</b>; letting go resets progress.<br>
        • Win a round: detonation, elimination, successful disarm, or time expiring before arming.<br>
        • Economy: $800 start · win $3,000 · loss $1,900 rising by $400 to $3,100 · arming pays $300 plus $600 team · survivors keep gear.<br>
        • First to 9 (quick: 5), sides swap at the half, win by 2, max 20 rounds.</div>
        <div class="label">Tips</div>
        <div style="line-height:1.6;font-size:14px;color:#cdd6df">Stop moving before you shoot. Spray patterns are learnable: pull down and against the sway. Footsteps travel; silent walk is nearly silent. Smoke is opaque the same on every setting.</div>
      </div></div>
      <div class="row" style="margin-top:20px"><button class="btn primary">Back</button></div>`;
    card.querySelector('button')!.addEventListener('click', this.click(() => this.showTitle()));
    s.append(card);
    this.set(s);
  }

  showCredits(): void {
    const s = el('div', 'screen dim');
    const card = el('div', 'panel-wide');
    card.innerHTML = `<h2>Credits</h2><div style="line-height:1.7;color:#cdd6df;font-size:15px">
      <b>Last Protocol</b> is an original game: fictional security teams, an original objective (the Cipher Spike), original weapons, map and rules.<br><br>
      All geometry, textures, models, particles, sounds and music are generated procedurally at runtime from code. No external art, audio or font files are used.<br>
      Rendering by <b>three.js</b> (MIT). Built with Vite and TypeScript. See ASSETS.md in the repository for the full list.</div>
      <div class="row" style="margin-top:20px"><button class="btn primary">Back</button></div>`;
    card.querySelector('button')!.addEventListener('click', this.click(() => this.showTitle()));
    s.append(card);
    this.set(s);
  }

  // ------------------------------------------------------------------ settings
  showSettings(back: () => void): void {
    const st = this.settings();
    const s = el('div', 'screen dim');
    const card = el('div', 'panel-wide');
    card.innerHTML = '<h2>Settings</h2>';
    const changed = () => { saveSettings(st); this.onSettingsChanged(); };
    const slider = (parent: HTMLElement, label: string, min: number, max: number, step: number, get: () => number, setv: (v: number) => void, fmt: (v: number) => string = (v) => String(v)): void => {
      const row = el('div', 'slider-row');
      const l = el('label', '', esc(label));
      const input = el('input'); input.type = 'range'; input.min = String(min); input.max = String(max); input.step = String(step); input.value = String(get());
      const val = el('span', '', fmt(get()));
      input.addEventListener('input', () => { setv(Number(input.value)); val.textContent = fmt(Number(input.value)); changed(); });
      row.append(l, input, val); parent.append(row);
    };
    const toggle = (parent: HTMLElement, label: string, get: () => boolean, setv: (v: boolean) => void): void => {
      const t = el('label', 'toggle'); const i = el('input'); i.type = 'checkbox'; i.checked = get();
      i.addEventListener('change', () => { setv(i.checked); changed(); });
      t.append(i, document.createTextNode(label)); parent.append(t);
    };
    const select = (parent: HTMLElement, label: string, opts: Array<[string, string]>, get: () => string, setv: (v: string) => void): void => {
      const row = el('div', 'slider-row'); row.append(el('label', '', esc(label)));
      const sel = el('select'); for (const [v, n] of opts) { const o = el('option'); o.value = v; o.textContent = n; if (v === get()) o.selected = true; sel.append(o); }
      sel.addEventListener('change', () => { setv(sel.value); changed(); });
      row.append(sel); parent.append(row);
    };
    const grid = el('div', 'grid2');
    const a = el('div'); const b = el('div');
    a.append(el('div', 'label', 'Mouse & view'));
    slider(a, 'Sensitivity', 0.2, 6, 0.05, () => st.sensitivity, (v) => { st.sensitivity = v; }, (v) => v.toFixed(2));
    slider(a, 'Scoped multiplier', 0.2, 1.5, 0.05, () => st.adsSensitivity, (v) => { st.adsSensitivity = v; }, (v) => v.toFixed(2));
    slider(a, 'Field of view', 80, 105, 1, () => st.fov, (v) => { st.fov = v; }, (v) => v + '°');
    toggle(a, 'Hold to crouch (off = toggle)', () => st.holdCrouch, (v) => { st.holdCrouch = v; });
    toggle(a, 'Hold to walk (off = toggle)', () => st.holdWalk, (v) => { st.holdWalk = v; });
    toggle(a, 'Left-hand viewmodel', () => st.leftHand, (v) => { st.leftHand = v; });
    const exp = el('button', 'btn small', 'Copy sensitivity (JSON)');
    exp.addEventListener('click', () => { try { void navigator.clipboard.writeText(exportSensitivity(st)); } catch { /* ignore */ } });
    a.append(exp);
    a.append(el('div', 'label', 'Audio'));
    slider(a, 'Master volume', 0, 1, 0.05, () => st.volume, (v) => { st.volume = v; }, (v) => Math.round(v * 100) + '%');
    slider(a, 'Effects', 0, 1, 0.05, () => st.sfxVolume, (v) => { st.sfxVolume = v; }, (v) => Math.round(v * 100) + '%');
    slider(a, 'Menu music', 0, 1, 0.05, () => st.musicVolume, (v) => { st.musicVolume = v; }, (v) => Math.round(v * 100) + '%');
    toggle(a, 'Captions for critical sounds', () => st.captions, (v) => { st.captions = v; });

    b.append(el('div', 'label', 'Video'));
    select(b, 'Quality', [['low', 'Low'], ['medium', 'Medium'], ['high', 'High']], () => st.quality, (v) => { st.quality = v as Settings['quality']; });
    slider(b, 'Resolution scale', 0.5, 1, 0.05, () => st.resolutionScale, (v) => { st.resolutionScale = v; }, (v) => Math.round(v * 100) + '%');
    toggle(b, 'Show FPS', () => st.showFps, (v) => { st.showFps = v; });
    b.append(el('div', 'label', 'Accessibility'));
    select(b, 'Team colours', [['default', 'Cyan / amber'], ['deuteranopia', 'Blue / yellow (deuteranopia)'], ['protanopia', 'Blue / yellow (protanopia)'], ['mono', 'White / yellow (high contrast)']], () => st.colorblind, (v) => { st.colorblind = v as Settings['colorblind']; document.documentElement.dataset.cb = v; });
    toggle(b, 'Reduce flash intensity', () => st.reduceFlash, (v) => { st.reduceFlash = v; });
    toggle(b, 'Reduce motion (bob, sway)', () => st.reduceMotion, (v) => { st.reduceMotion = v; });
    b.append(el('div', 'label', 'Crosshair'));
    const c = st.crosshair;
    const prev = el('div'); prev.style.cssText = 'height:70px;border:1px solid var(--line);border-radius:4px;background:#2a3038;position:relative;margin-bottom:6px';
    const pc = el('div'); pc.style.cssText = 'position:absolute;left:50%;top:50%';
    prev.append(pc);
    const drawPreview = () => {
      pc.innerHTML = '';
      const mk = (x: number, y: number, w: number, h: number) => { const d = el('div'); d.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;background:${c.color};opacity:${c.opacity};${c.outline ? 'box-shadow:0 0 0 1px rgba(0,0,0,.85);' : ''}`; pc.append(d); };
      mk(-c.thickness / 2, -c.gap - c.size, c.thickness, c.size); mk(-c.thickness / 2, c.gap, c.thickness, c.size);
      mk(-c.gap - c.size, -c.thickness / 2, c.size, c.thickness); mk(c.gap, -c.thickness / 2, c.size, c.thickness);
      if (c.dot) mk(-1, -1, 2, 2);
    };
    b.append(prev);
    const cs = (label: string, min: number, max: number, step: number, key: 'size' | 'thickness' | 'gap' | 'opacity') => slider(b, label, min, max, step, () => c[key], (v) => { c[key] = v; drawPreview(); }, (v) => String(v));
    cs('Length', 1, 20, 1, 'size'); cs('Thickness', 1, 6, 1, 'thickness'); cs('Gap', 0, 14, 1, 'gap'); cs('Opacity', 0.3, 1, 0.05, 'opacity');
    const colRow = el('div', 'slider-row'); colRow.append(el('label', '', 'Colour'));
    const colRow2 = el('div', 'row');
    for (const col of ['#6dffd9', '#ffffff', '#ffe14a', '#ff5d73', '#7cb7ff', '#ff3fa6']) {
      const sw = el('button', 'chip', ''); sw.style.cssText = `background:${col};width:28px;height:28px;padding:0;border-color:${c.color === col ? '#fff' : 'transparent'}`;
      sw.addEventListener('click', () => { c.color = col; changed(); drawPreview(); colRow2.querySelectorAll('button').forEach((x) => ((x as HTMLElement).style.borderColor = 'transparent')); sw.style.borderColor = '#fff'; });
      colRow2.append(sw);
    }
    colRow.append(colRow2); b.append(colRow);
    toggle(b, 'Center dot', () => c.dot, (v) => { c.dot = v; drawPreview(); });
    toggle(b, 'Outline', () => c.outline, (v) => { c.outline = v; drawPreview(); });
    toggle(b, 'Dynamic gap (shows movement inaccuracy only)', () => c.dynamic, (v) => { c.dynamic = v; });
    drawPreview();
    grid.append(a, b);
    card.append(grid);
    const row = el('div', 'row'); row.style.marginTop = '18px';
    const done = el('button', 'btn primary', 'Done');
    done.addEventListener('click', this.click(() => { saveSettings(st); back(); }));
    const reset = el('button', 'btn', 'Reset to defaults');
    reset.addEventListener('click', this.click(() => { Object.assign(st, structuredClone(DEFAULT_SETTINGS)); saveSettings(st); this.onSettingsChanged(); this.showSettings(back); }));
    row.append(done, reset);
    card.append(row);
    s.append(card);
    this.set(s);
  }

  // ------------------------------------------------------------------ pause / flow
  showPause(): void {
    const s = el('div', 'screen dim');
    const card = el('div', 'menu-card pause');
    card.innerHTML = '<h2>Paused</h2><div style="color:var(--dim);font-size:13px;margin-bottom:12px">Local match: the simulation is paused while this menu is open.</div>';
    const menu = el('div', 'menu');
    const mk = (label: string, fn: () => void, cls = '') => { const b = el('button', 'btn ' + cls, esc(label)); b.addEventListener('click', this.click(fn)); menu.append(b); };
    mk('Resume', () => this.onResume(), 'primary');
    mk('Settings', () => this.showSettings(() => this.showPause()));
    mk('Learn', () => this.showLearnFromPause());
    mk('Leave match', () => this.onQuit());
    card.append(menu);
    s.append(card);
    this.set(s);
  }

  private showLearnFromPause(): void {
    this.showLearn();
    const btn = this.root.querySelector('.panel-wide button');
    if (btn) { const nb = btn.cloneNode(true) as HTMLElement; btn.replaceWith(nb); nb.addEventListener('click', this.click(() => this.showPause())); }
  }

  showLoading(text: string, frac: number): void {
    const s = el('div', 'screen dim');
    const card = el('div', 'menu-card deploy');
    card.style.width = 'min(460px,90vw)';
    card.innerHTML = `<h2>${esc(text)}</h2><div class="loading-bar"><i style="width:${Math.round(frac * 100)}%"></i></div>`;
    s.append(card);
    this.set(s);
  }

  showDeploy(onGo: () => void, subtitle: string): void {
    const s = el('div', 'screen dim');
    s.style.cursor = 'pointer';
    const card = el('div', 'menu-card deploy');
    card.innerHTML = `<h2>Click to deploy</h2><div style="color:var(--dim);margin-top:6px">${esc(subtitle)}</div><div style="margin-top:16px;color:var(--dim);font-size:13px">Mouse is captured while playing · <kbd>Esc</kbd> releases it and pauses</div>`;
    s.append(card);
    s.addEventListener('click', () => onGo());
    this.set(s);
  }

  showError(title: string, detail: string, extra = ''): void {
    const s = el('div', 'screen dim');
    const card = el('div', 'menu-card error-card');
    card.innerHTML = `<h2>${esc(title)}</h2><div style="color:#cdd6df;line-height:1.6">${esc(detail)}</div>${extra}`;
    s.append(card);
    this.set(s);
  }
}
