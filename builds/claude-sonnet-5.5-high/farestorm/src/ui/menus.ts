import { TAXIS, TAXI_COLORS, TAXI_ORDER, type TaxiSpec } from '../sim/data';
import { RULES } from '../sim/rules';
import type { Mode, Results, TrafficLevel } from '../sim/sim';
import { load, save, DEFAULT_SETTINGS, type Settings } from '../persist';

export interface MenuApi {
  click(): void;
  start(mode: Mode): void;
  previewTaxi(id: TaxiSpec['id'], color: number): void;
  settingsChanged(): void;
  resume(): void;
  restart(): void;
  quit(): void;
  back(): void;
}

const MODES: Record<Mode, { name: string; blurb: string }> = {
  arcade: { name: 'Arcade Shift', blurb: `Start with ${RULES.shiftStart} seconds. Deliveries add time based on grade and distance - skilled driving extends the shift. Chase a higher rank.` },
  quick: { name: 'Quick Shift', blurb: 'A fixed 5-minute shift with no time extensions. Predictable, accessible and easy to compare.' },
  trial: { name: 'Time Trial', blurb: 'A fixed chain of four fares with identical traffic every attempt. Beat the clock for gold, silver or bronze.' },
};

function stat(v: number, max: number): string {
  return `<i><b style="width:${Math.round((v / max) * 100)}%"></b></i>`;
}
function zeroTo100(spec: TaxiSpec): number {
  // closed form for a = a0 (1 - (v/vmax)^2): t = vmax/(2 a0) * ln((1+x)/(1-x)) at x = 27.8/vmax (rolling losses add ~8%)
  const x = 27.78 / spec.topSpeed;
  return (spec.topSpeed / (2 * spec.accel0)) * Math.log((1 + x) / (1 - x)) * 1.08;
}

export class Menus {
  private root: HTMLElement;
  private mode: Mode = 'arcade';
  constructor(host: HTMLElement, private api: MenuApi) {
    this.root = host;
  }

  clear(): void {
    this.root.innerHTML = '';
  }

  private screen(cls: string, html: string): HTMLElement {
    this.root.innerHTML = `<div class="screen ${cls}">${html}</div>`;
    const el = this.root.firstElementChild as HTMLElement;
    el.querySelectorAll<HTMLButtonElement>('button').forEach((b) => b.addEventListener('mouseenter', () => b.focus({ preventScroll: true })));
    return el;
  }

  private on(el: HTMLElement, sel: string, fn: (t: HTMLElement) => void): void {
    el.querySelectorAll<HTMLElement>(sel).forEach((n) => n.addEventListener('click', () => { this.api.click(); fn(n); }));
  }

  // ------------------------------------------------------------------ main
  main(): void {
    const s = load();
    const rec = s.records.arcade;
    const el = this.screen('dim', `
      <div class="menu-col">
        <div class="title">FARESTORM</div>
        <div class="tagline">GALEPORT SHIFT  ·  RACE THE CLOCK  ·  RIDE THE STORM</div>
        <button class="btn primary" data-mode="arcade">ARCADE SHIFT <small>${rec ? `best ${rec.best.toLocaleString()}` : '60s + earn more'}</small></button>
        <button class="btn alt" data-mode="quick">QUICK SHIFT <small>5:00 fixed</small></button>
        <button class="btn alt" data-mode="trial">TIME TRIAL <small>${s.trialBest ? `best ${s.trialBest.toFixed(1)}s` : '4-fare chain'}</small></button>
        <button class="btn ghost" data-go="garage">GARAGE <small>taxi + colours</small></button>
        <button class="btn ghost" data-go="records">RECORDS</button>
        <button class="btn ghost" data-go="settings">SETTINGS</button>
        <button class="btn ghost" data-go="credits">CREDITS</button>
      </div>
      <div class="foot"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> drive · <kbd>SPACE</kbd> drift · <kbd>SHIFT</kbd> tailwind · gamepad supported</div>`);
    this.on(el, '[data-mode]', (n) => this.setup(n.dataset.mode as Mode));
    this.on(el, '[data-go]', (n) => {
      const g = n.dataset.go;
      if (g === 'garage') this.garage();
      else if (g === 'records') this.records();
      else if (g === 'settings') this.settings(() => this.main());
      else this.credits();
    });
    (el.querySelector('.primary') as HTMLElement).focus();
  }

  // ------------------------------------------------------------------ setup / garage
  private taxiPanel(el: HTMLElement): void {
    const s = load();
    const render = () => {
      const cards = el.querySelector('.cards')!;
      cards.innerHTML = TAXI_ORDER.map((id) => {
        const t = TAXIS[id];
        return `<button class="card ${s.taxi === id ? 'sel' : ''}" data-taxi="${id}"><h4>${t.name}</h4><p>${t.blurb}</p>
          <div class="bars"><div class="bar"><span>Accel</span>${stat(t.accel0, 7.2)}<span>${zeroTo100(t).toFixed(1)}s</span></div>
          <div class="bar"><span>Top speed</span>${stat(t.topSpeed, 50)}<span>${Math.round(t.topSpeed * 3.6)}</span></div>
          <div class="bar"><span>Steering</span>${stat(t.steerMax, 0.62)}<span>${(t.steerMax * 100).toFixed(0)}</span></div>
          <div class="bar"><span>Drift</span>${stat(t.driftYaw, 1.55)}<span>${t.driftYaw.toFixed(2)}</span></div>
          <div class="bar"><span>Mass</span>${stat(t.mass, 1900)}<span>${t.mass}kg</span></div>
          <div class="bar"><span>Shove</span>${stat(t.shove, 1.6)}<span>×${t.shove}</span></div></div></button>`;
      }).join('');
      el.querySelector('.swatches')!.innerHTML = TAXI_COLORS.map((c, i) => `<div class="sw ${s.color === i ? 'sel' : ''}" data-color="${i}" title="${c.name}" style="background:#${c.body.toString(16).padStart(6, '0')}"></div>`).join('');
      this.on(el, '[data-taxi]', (n) => { s.taxi = n.dataset.taxi as TaxiSpec['id']; save(); this.api.previewTaxi(s.taxi, s.color); render(); });
      this.on(el, '[data-color]', (n) => { s.color = Number(n.dataset.color); save(); this.api.previewTaxi(s.taxi, s.color); render(); });
    };
    render();
  }

  setup(mode: Mode): void {
    this.mode = mode;
    const s = load();
    const m = MODES[mode];
    const el = this.screen('dim', `
      <div class="pad" style="width:100%;justify-content:flex-start;padding-left:4vw">
      <div class="panel side">
        <h2>${m.name}</h2>
        <div class="desc">${m.blurb}</div>
        <h3>CHOOSE YOUR STORM CAB</h3>
        <div class="cards"></div>
        <h3>CAB COLOUR</h3>
        <div class="swatches"></div>
        ${mode === 'trial' ? `<h3>MEDALS</h3><div class="desc">Gold under ${RULES.trialMedals.gold}s · Silver under ${RULES.trialMedals.silver}s · Bronze under ${RULES.trialMedals.bronze}s. Time penalties from resets and splashes are added.</div>` : `<h3>TRAFFIC</h3>
        <div class="seg">${(['calm', 'normal', 'dense'] as TrafficLevel[]).map((t) => `<button data-traffic="${t}" class="${s.traffic === t ? 'sel' : ''}">${t.toUpperCase()}</button>`).join('')}</div>`}
        <div class="actions"><button class="btn primary" data-start>START SHIFT</button><button class="btn ghost" data-back>BACK</button></div>
      </div></div>`);
    this.taxiPanel(el);
    this.on(el, '[data-traffic]', (n) => { s.traffic = n.dataset.traffic as TrafficLevel; save(); el.querySelectorAll('[data-traffic]').forEach((b) => b.classList.toggle('sel', b === n)); });
    this.on(el, '[data-start]', () => this.api.start(mode));
    this.on(el, '[data-back]', () => this.api.back());
    this.api.previewTaxi(s.taxi, s.color);
    (el.querySelector('[data-start]') as HTMLElement).focus();
  }

  garage(): void {
    const s = load();
    const el = this.screen('dim', `
      <div class="pad" style="width:100%;justify-content:flex-start;padding-left:4vw">
      <div class="panel side"><h2>GARAGE</h2><div class="desc">Pick your storm cab and paint. Handling differences are real: lighter cabs slide easier, the Tempest shoves traffic aside.</div>
        <h3>STORM CABS</h3><div class="cards"></div><h3>CAB COLOUR</h3><div class="swatches"></div>
        <div class="actions"><button class="btn primary" data-back>DONE</button></div></div></div>`);
    this.taxiPanel(el);
    this.on(el, '[data-back]', () => this.api.back());
    this.api.previewTaxi(s.taxi, s.color);
  }

  // ------------------------------------------------------------------ records / settings / credits
  records(): void {
    const s = load();
    const rows = (Object.keys(MODES) as Mode[]).filter((m) => m !== 'trial').map((m) => {
      const r = s.records[m];
      return `<tr><td>${MODES[m].name}</td><td>${r ? r.best.toLocaleString() : '-'}</td><td>${r ? r.rank : '-'}</td><td>${r ? r.deliveries : '-'}</td><td>${r ? r.bestChain.toLocaleString() : '-'}</td><td>${r ? r.runs : 0}</td></tr>`;
    }).join('');
    const el = this.screen('dark', `<div class="panel wide"><h2>RECORDS</h2>
      <table><tr><th>MODE</th><th>BEST SCORE</th><th>RANK</th><th>MOST FARES</th><th>BEST CHAIN</th><th>RUNS</th></tr>${rows}
      <tr><td>Time Trial</td><td>${s.trialBest ? s.trialBest.toFixed(1) + 's' : '-'}</td><td>${s.trialMedal ?? '-'}</td><td>-</td><td>-</td><td>-</td></tr></table>
      <h3>SHORTCUTS DISCOVERED</h3><div class="desc"><b style="font-size:28px">${s.discovered.length}</b> / 32 found. Discovered shortcuts are drawn on your map.</div>
      <div class="actions"><button class="btn primary" data-back>BACK</button></div></div>`);
    this.on(el, '[data-back]', () => this.api.back());
  }

  credits(): void {
    const el = this.screen('dark', `<div class="panel wide"><h2>CREDITS</h2>
      <div class="desc">Farestorm is an original arcade driving game set in the invented coastal city of Galeport. All code, audio and visuals are procedural and original to this project: no licensed music, no external assets, no logos, no existing game's characters, taxis, city or phrases.<br><br>
      Built with TypeScript, Vite and three.js (MIT). Music and sound effects are generated live with the Web Audio API.<br><br>
      Inspired by the genre principles of fare-chasing arcade taxi games: race the clock, choose risk and reward, take shortcuts, drive with style.</div>
      <div class="actions"><button class="btn primary" data-back>BACK</button></div></div>`);
    this.on(el, '[data-back]', () => this.api.back());
  }

  settings(back: () => void): void {
    const st = load().settings;
    const range = (k: keyof Settings, label: string, min: number, max: number, step: number) => `<label>${label}<input type="range" data-k="${k}" min="${min}" max="${max}" step="${step}" value="${st[k] as number}"></label>`;
    const check = (k: keyof Settings, label: string) => `<label>${label}<input type="checkbox" data-k="${k}" ${st[k] ? 'checked' : ''}></label>`;
    const el = this.screen('dark', `<div class="panel wide"><h2>SETTINGS</h2><div class="set">
      <div>${range('master', 'Master volume', 0, 1, 0.05)}${range('music', 'Music', 0, 1, 0.05)}${range('sfx', 'Effects', 0, 1, 0.05)}
      ${check('subtitles', 'Passenger subtitles')}${check('crowd', 'Pedestrians')}${check('shadows', 'Shadows')}
      <label>Render scale<select data-k="resolution"><option value="1">100%</option><option value="0.85">85%</option><option value="0.7">70%</option><option value="0.55">55%</option></select></label>
      ${check('dynamicRes', 'Dynamic resolution')}</div>
      <div>${range('fov', 'Field of view', 70, 95, 1)}${range('shake', 'Camera shake', 0, 1, 0.1)}
      <label>HUD scale<select data-k="hudScale"><option value="1">100%</option><option value="1.25">125%</option><option value="1.5">150%</option></select></label>
      ${check('reducedMotion', 'Reduced motion')}${check('photosensitive', 'Photosensitivity (no flashes)')}${check('colorblind', 'Colourblind-safe markers')}
      <label>Route guidance<select data-k="guidance"><option value="route">Follow roads</option><option value="direct">Direct bearing</option></select></label>
      ${range('deadzone', 'Gamepad dead zone', 0, 0.4, 0.01)}</div></div>
      <div class="actions"><button class="btn primary" data-back>BACK</button><button class="btn ghost" data-reset>RESET DEFAULTS</button></div></div>`);
    el.querySelectorAll<HTMLSelectElement>('select[data-k]').forEach((sel) => { sel.value = String(st[sel.dataset.k as keyof Settings]); });
    el.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-k]').forEach((inp) => {
      inp.addEventListener('input', () => {
        const k = inp.dataset.k as keyof Settings;
        const cur = st[k];
        if (typeof cur === 'boolean') (st as unknown as Record<string, unknown>)[k] = (inp as HTMLInputElement).checked;
        else if (k === 'guidance') (st as unknown as Record<string, unknown>)[k] = inp.value;
        else (st as unknown as Record<string, unknown>)[k] = Number(inp.value);
        save();
        this.api.settingsChanged();
      });
    });
    this.on(el, '[data-back]', () => { back(); });
    this.on(el, '[data-reset]', () => { Object.assign(st, DEFAULT_SETTINGS); save(); this.api.settingsChanged(); this.settings(back); });
  }

  // ------------------------------------------------------------------ in-run
  pause(): void {
    const el = this.screen('dark', `<div class="panel" style="min-width:420px"><h2>PAUSED</h2>
      <button class="btn primary" data-a="resume">RESUME</button><button class="btn alt" data-a="restart">RESTART SHIFT</button><button class="btn ghost" data-a="settings">SETTINGS</button><button class="btn ghost" data-a="quit">ABANDON TO MENU</button></div>`);
    this.on(el, '[data-a]', (n) => {
      const a = n.dataset.a;
      if (a === 'resume') this.api.resume();
      else if (a === 'restart') this.api.restart();
      else if (a === 'quit') this.api.quit();
      else this.settings(() => this.pause());
    });
    (el.querySelector('.primary') as HTMLElement).focus();
  }

  results(r: Results, extra: { newBest: boolean; medal?: string; trialBest?: boolean }): void {
    const f = (n: number) => n.toLocaleString();
    const title = r.mode === 'trial' ? `${r.medal && r.medal !== 'none' ? r.medal.toUpperCase() + ' MEDAL' : 'FINISHED'}` : 'SHIFT OVER';
    const el = this.screen('dark', `<div class="panel wide" style="width:min(940px,94vw)"><div class="row" style="align-items:center;gap:36px">
      ${r.mode === 'trial' ? `<div style="text-align:center;min-width:190px"><div class="lab" style="letter-spacing:4px">MEDAL</div><div class="rank ${r.medal === 'gold' ? 'S' : r.medal === 'silver' ? 'B' : r.medal === 'bronze' ? 'C' : 'D'}" style="font-size:54px;padding:36px 0">${(r.medal ?? 'none') === 'none' ? 'NONE' : r.medal!.toUpperCase()}</div></div>` : `<div style="text-align:center"><div class="lab" style="letter-spacing:4px">RANK</div><div class="rank ${r.rank}">${r.rank}</div></div>`}
      <div style="flex:1"><h2 style="margin:0">${title}${extra.newBest ? '<span class="newbest">NEW BEST!</span>' : ''}</h2>
        <div style="font:italic 900 64px var(--font);transform:skewX(-6deg);color:#ffd34d">${r.mode === 'trial' ? r.time.toFixed(1) + 's' : f(r.score)}</div>
        <div class="desc">${r.mode === 'trial' ? `${r.deliveries} fares in a ${r.taxi}. Score ${f(r.score)}.` : `${r.taxi} · ${r.mode === 'quick' ? 'Quick Shift' : 'Arcade Shift'}`}</div></div></div>
      <div class="stat-grid">
        <div class="stat"><b>${r.deliveries}</b><span>DELIVERIES</span></div><div class="stat"><b>${f(r.fares)}</b><span>FARES EARNED</span></div><div class="stat"><b>${f(r.tips)}</b><span>TIPS & BONUSES</span></div>
        <div class="stat"><b>${r.timeBonuses}s</b><span>TIME EARNED</span></div><div class="stat"><b>×${r.bestPulse}</b><span>BEST PULSE</span></div><div class="stat"><b>${f(r.bestChain)}</b><span>BEST CHAIN</span></div>
        <div class="stat"><b>${r.collisions}</b><span>COLLISIONS</span></div><div class="stat"><b>${r.shortcuts}${r.newShortcuts ? ` (+${r.newShortcuts} new)` : ''}</b><span>SHORTCUTS TAKEN</span></div><div class="stat"><b>${r.efficiency ? r.efficiency + '%' : '-'}</b><span>ROUTE EFFICIENCY</span></div>
      </div>
      <div class="actions"><button class="btn primary" data-a="retry">RETRY <small>R</small></button><button class="btn alt" data-a="setup">CHANGE CAB</button><button class="btn ghost" data-a="menu">MAIN MENU</button></div></div>`);
    this.on(el, '[data-a]', (n) => {
      const a = n.dataset.a;
      if (a === 'retry') this.api.restart();
      else if (a === 'setup') this.setup(r.mode);
      else this.api.quit();
    });
    (el.querySelector('.primary') as HTMLElement).focus();
  }

  error(title: string, body: string, retry = true): void {
    const el = this.screen('dark', `<div class="panel err"><h2>${title}</h2><div class="desc" style="margin:0 auto">${body}</div>${retry ? '<div class="actions" style="justify-content:center"><button class="btn primary" data-a="reload">RELOAD</button></div>' : ''}</div>`);
    this.on(el, '[data-a]', () => location.reload());
  }
}
