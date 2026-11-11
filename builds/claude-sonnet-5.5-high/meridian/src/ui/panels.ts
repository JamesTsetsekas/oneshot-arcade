import type { Game } from '../sim/game';
import type { Settings } from '../core/settings';
import { DEFAULT_SETTINGS } from '../core/settings';
import { ACTION_LABELS, DEFAULT_BINDINGS, saveBindings } from '../input/input';
import type { Action, Input } from '../input/input';
import { OUTFITS, OUTFIT_PRICE, repairCost } from '../sim/economy';
import type { MissionDef } from '../sim/missions';
import type { Hud } from './hud';
import { WEAPONS } from '../sim/weapons';

type Child = Node | string | null | undefined | false;
function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, ...kids: Child[]): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) { if (k === 'class') e.className = v; else e.setAttribute(k, v); }
  for (const k of kids) { if (k === null || k === undefined || k === false) continue; e.appendChild(typeof k === 'string' ? document.createTextNode(k) : k); }
  return e;
}
const btn = (label: string, fn: () => void, cls = '', disabled = false): HTMLButtonElement => {
  const b = h('button', { class: 'btn ' + cls, type: 'button' }, label);
  b.disabled = disabled;
  b.addEventListener('click', (ev) => { ev.stopPropagation(); fn(); });
  return b;
};

export interface PanelHooks {
  newGame(): void;
  continueGame(): void;
  hasSave(): Promise<boolean>;
  saveGame(): Promise<void>;
  importSave(text: string): Promise<boolean>;
  exportSave(): Promise<string | null>;
  quitToMenu(): void;
  resume(): void;
  applySettings(): void;
  setWaypoint(p: { x: number; z: number } | null): void;
  clickSfx(): void;
}

export type ScreenKind = 'none' | 'menu' | 'pause' | 'settings' | 'credits' | 'phone' | 'map' | 'store' | 'kiosk' | 'garage' | 'safehouse' | 'fail' | 'result' | 'choice' | 'dead';

export class Panels {
  root: HTMLElement;
  current: ScreenKind = 'none';
  private from: ScreenKind = 'none';
  private tab = 'missions';
  private mapCanvas: HTMLCanvasElement | null = null;
  private resultShown: unknown = null;
  private hooks!: PanelHooks;
  inGame = false;

  constructor(root: HTMLElement, public game: Game, private settings: Settings, private input: Input, private hud: Hud) { this.root = root; }

  setHooks(hk: PanelHooks): void { this.hooks = hk; }
  get open(): boolean { return this.current !== 'none'; }

  close(): void { this.current = 'none'; this.root.innerHTML = ''; }

  private show(kind: ScreenKind, node: HTMLElement, dim = false): void {
    this.current = kind;
    this.root.innerHTML = '';
    const s = h('div', { class: 'screen' + (dim ? ' dim' : '') }, node);
    this.root.appendChild(s);
    (this.root.querySelector('button') as HTMLElement | null)?.focus?.({ preventScroll: true });
  }

  // ------------------------------------------------------------------ main menu
  async menu(): Promise<void> {
    const has = await this.hooks.hasSave();
    this.inGame = false;
    const wrap = h('div', {});
    wrap.style.cssText = 'position:absolute;inset:0';
    wrap.appendChild(h('div', { class: 'menu-bg' }));
    const m = h('div', { class: 'menu-main' },
      h('div', { class: 'title' }, 'MERIDIAN', h('span', {}, 'RUN')),
      h('div', { class: 'tag' }, 'Port Meridian - South Quay'),
      btn('Continue', () => { this.hooks.clickSfx(); this.hooks.continueGame(); }, has ? 'primary' : '', !has),
      btn('New Game', () => { this.hooks.clickSfx(); this.hooks.newGame(); }, !has ? 'primary' : ''),
      btn('Load Save File', () => this.pickFile()),
      btn('Settings', () => { this.hooks.clickSfx(); this.settingsScreen('menu'); }),
      btn('Credits', () => { this.hooks.clickSfx(); this.credits(); }),
      h('div', { class: 'tag' }, 'WASD / mouse - best in Chrome or Edge'),
    );
    wrap.appendChild(m);
    this.current = 'menu';
    this.root.innerHTML = '';
    this.root.appendChild(wrap);
    (m.querySelector('button:not(:disabled)') as HTMLElement | null)?.focus();
  }

  private pickFile(): void {
    const i = document.createElement('input');
    i.type = 'file';
    i.accept = '.json,application/json';
    i.onchange = async () => {
      const f = i.files?.[0];
      if (!f) return;
      const ok = await this.hooks.importSave(await f.text());
      this.game.toast(ok ? 'Save imported - press Continue' : 'That file is not a valid Meridian save', ok ? 'good' : 'bad');
      if (ok) void this.menu();
    };
    i.click();
  }

  credits(): void {
    const s = h('div', { class: 'sheet' },
      h('h2', {}, 'Credits'),
      h('div', { class: 'sub' }, 'Meridian Run is an original vertical slice. Everything you see and hear is procedurally generated.'),
      h('p', {}, 'Game design, code, procedural art and audio: written in a single autonomous session by an AI model for the Oneshot Arcade evaluation.'),
      h('p', {}, 'Engine: Babylon.js (Apache-2.0). Tooling: Vite, TypeScript, Vitest. All city, vehicle, character, mission, UI and audio content is original; nothing is copied from existing games. See ASSETS.md.'),
      h('div', { class: 'footer' }, btn('Back', () => (this.inGame ? this.pause() : void this.menu()), 'primary')),
    );
    this.show('credits', s, true);
  }

  // ------------------------------------------------------------------ pause
  pause(): void {
    this.inGame = true;
    const s = h('div', { class: 'sheet', style: 'width:min(520px,92vw)' },
      h('h2', {}, 'Paused'),
      h('div', { class: 'sub' }, `${this.game.outfitName()} - $${this.game.player.cash} - Trust ${this.game.player.trust}`),
      h('div', { class: 'choice-list' },
        btn('Resume', () => this.hooks.resume(), 'primary'),
        btn('Save Game', async () => { if (this.game.safeToSave() || !this.game.missions.running) { await this.hooks.saveGame(); this.game.toast('Game saved', 'good'); } else this.game.toast('Not safe to save right now (alert active or in danger)', 'warn'); }, '', false),
        btn('Phone / Missions', () => this.phone()),
        btn('Map', () => this.mapScreen()),
        btn('Settings', () => this.settingsScreen('pause')),
        btn('Export Save', async () => { const t = await this.hooks.exportSave(); if (t) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([t], { type: 'application/json' })); a.download = 'meridian-save.json'; a.click(); } else this.game.toast('Nothing saved yet', 'warn'); }),
        this.game.missions.running ? btn('Abandon Mission', () => { this.game.abandonMission(); this.hooks.resume(); }) : null,
        btn('Quit to Main Menu', () => this.hooks.quitToMenu()),
      ),
      h('h3', {}, 'Controls'),
      h('div', { class: 'grid2', style: 'font-size:13px' },
        h('div', {}, 'WASD move - Shift sprint - Ctrl crouch - Space jump / vault / mantle'),
        h('div', {}, 'RMB aim - LMB fire - R reload - F melee - G gadget - Z medkit - 1-5 weapons'),
        h('div', {}, 'E interact / enter vehicle - F exit vehicle - H horn (car) / holster (foot)'),
        h('div', {}, 'M map - P phone - C camera - X look back / shoulder swap - T radio'),
      ),
    );
    this.show('pause', s, true);
  }

  // ------------------------------------------------------------------ settings
  settingsScreen(from: ScreenKind): void {
    this.from = from;
    const S = this.settings;
    const back = () => { this.hooks.applySettings(); if (from === 'menu') void this.menu(); else if (from === 'pause') this.pause(); else this.close(); };
    const range = (label: string, key: keyof Settings, min: number, max: number, step: number): HTMLElement => {
      const i = h('input', { type: 'range', min: String(min), max: String(max), step: String(step) });
      i.value = String(S[key]);
      const v = h('span', {}, String(S[key]));
      i.addEventListener('input', () => { (S as unknown as Record<string, number>)[key] = Number(i.value); v.textContent = i.value; this.hooks.applySettings(); });
      return h('div', { class: 'set' }, h('label', {}, label), h('span', {}, i, ' ', v));
    };
    const check = (label: string, key: keyof Settings): HTMLElement => {
      const i = h('input', { type: 'checkbox' });
      i.checked = !!S[key];
      i.addEventListener('change', () => { (S as unknown as Record<string, boolean>)[key] = i.checked; this.hooks.applySettings(); });
      return h('div', { class: 'set' }, h('label', {}, label), i);
    };
    const select = (label: string, key: keyof Settings, opts: string[]): HTMLElement => {
      const s = h('select', {}, ...opts.map((o) => { const e = h('option', { value: o }, o); if (S[key] === o) e.selected = true; return e; }));
      s.addEventListener('change', () => { (S as unknown as Record<string, string>)[key] = s.value; this.hooks.applySettings(); });
      return h('div', { class: 'set' }, h('label', {}, label), s);
    };
    const binds = h('div', { class: 'grid2' });
    (Object.keys(ACTION_LABELS) as Action[]).forEach((a) => {
      const b = h('button', { class: 'bindbtn', type: 'button' }, this.input.bindings[a].replace('Key', '').replace('Digit', ''));
      b.addEventListener('click', () => {
        b.textContent = 'press a key...'; b.classList.add('wait');
        this.input.rebinding = (code) => { this.input.bindings[a] = code === 'Escape' ? this.input.bindings[a] : code; saveBindings(this.input.bindings); b.classList.remove('wait'); b.textContent = this.input.bindings[a].replace('Key', '').replace('Digit', ''); };
      });
      binds.appendChild(h('div', { class: 'set' }, h('label', {}, ACTION_LABELS[a]), b));
    });
    const s = h('div', { class: 'sheet' },
      h('h2', {}, 'Settings'),
      h('div', { class: 'sub' }, 'Changes apply immediately and are stored in this browser.'),
      h('h3', {}, 'Graphics'),
      h('div', { class: 'grid2' },
        select('Quality preset', 'quality', ['low', 'medium', 'high']),
        range('Field of view', 'fov', 75, 100, 1),
        range('Traffic & pedestrian density', 'density', 0.4, 1.4, 0.1),
        check('Reduced motion (camera shake, banners)', 'reducedMotion'),
        check('Reduce flashing (police lights, beacon)', 'reducedFlashes'),
        select('Colour-blind mode', 'colorblind', ['off', 'deuteranopia', 'protanopia', 'tritanopia']),
      ),
      h('h3', {}, 'Controls & camera'),
      h('div', { class: 'grid2' },
        range('Mouse sensitivity', 'sensitivity', 0.3, 2.5, 0.05),
        check('Invert vertical look', 'invertY'),
        check('Toggle aim (instead of hold)', 'toggleAim'),
        check('Driving assists (stability + steering limit)', 'driveAssist'),
        check('Rotating minimap', 'minimapRotate'),
      ),
      h('h3', {}, 'Audio'),
      h('div', { class: 'grid2' },
        range('Master volume', 'masterVolume', 0, 1, 0.05),
        range('Effects volume', 'sfxVolume', 0, 1, 0.05),
        range('Music / radio volume', 'musicVolume', 0, 1, 0.05),
        check('Radio enabled in vehicles', 'radio'),
        check('Streamer mode (no music)', 'streamer'),
        check('Subtitles', 'subtitles'),
      ),
      h('h3', {}, 'Key bindings (click, then press a key)'),
      binds,
      h('div', { class: 'footer' },
        btn('Reset to defaults', () => { Object.assign(S, DEFAULT_SETTINGS); this.input.bindings = { ...DEFAULT_BINDINGS }; saveBindings(this.input.bindings); this.settingsScreen(from); this.hooks.applySettings(); }),
        btn('Done', back, 'primary')),
    );
    this.show('settings', s, true);
  }

  // ------------------------------------------------------------------ phone
  phone(): void {
    const g = this.game;
    const body = h('div', {});
    const mkTab = (id: string, label: string) => { const b = h('button', {}, label); if (this.tab === id) b.className = 'on'; b.addEventListener('click', () => { this.tab = id; this.phone(); }); return b; };
    const tabs = h('div', { class: 'tabs' }, mkTab('missions', 'Missions'), mkTab('activities', 'Activities'), mkTab('places', 'Places'), mkTab('status', 'Status'));
    const startRow = (def: MissionDef, locked: string | null) => {
      const done = g.completed[def.id];
      return h('div', { class: 'row' + (locked ? ' locked' : '') },
        h('div', { class: 'grow' }, h('div', { class: 'nm' }, def.title, done ? h('span', { class: 'badge' }, 'Best ' + done.grade) : null), h('div', { class: 'ds' }, locked ?? def.summary), h('div', { class: 'ds' }, `Reward: $${def.reward.cash} - Trust +${def.reward.trust}`)),
        btn(done ? 'Replay' : 'Start', () => { if (g.startMission(done ? cloneForReplay(def) : def)) { g.replayMode = !!done && def.kind === 'story'; this.hooks.resume(); } }, 'small', !!locked || g.missions.running),
      );
    };
    if (this.tab === 'missions') {
      body.appendChild(h('h3', {}, 'Story'));
      for (const { def, locked } of g.availableMissions()) if (def.kind === 'story') body.appendChild(startRow(def, locked));
      if (g.missions.running) body.appendChild(h('div', { class: 'row' }, h('div', { class: 'grow' }, `Current: ${g.missions.def?.title}`), btn('Abandon', () => { g.abandonMission(); this.phone(); }, 'small')));
    } else if (this.tab === 'activities') {
      body.appendChild(h('div', { class: 'sub' }, g.activitiesUnlocked() ? 'Repeatable jobs. Rewards are paid once per completed run.' : 'Complete First Shift to unlock repeatable activities.'));
      const acts: Array<[string, string, Parameters<Game['makeActivity']>[0]]> = [
        ['Courier Run - Fragile', 'Carry a delicate parcel across town. Avoid collisions.', 'courier-fragile'],
        ['Courier Run - Urgent', 'A tight clock. Cut the corners, not the pedestrians.', 'courier-urgent'],
        ['Courier Run - Quiet', 'Deliver without drawing police attention.', 'courier-quiet'],
        ['Street Circuit', 'Three-lap time trial through live traffic.', 'circuit'],
        ['Recovery Call', 'Find a reported-stolen car and return it to the garage.', 'recovery'],
      ];
      for (const [name, desc, kind] of acts) body.appendChild(h('div', { class: 'row' + (g.activitiesUnlocked() ? '' : ' locked') }, h('div', { class: 'grow' }, h('div', { class: 'nm' }, name), h('div', { class: 'ds' }, desc)), btn('Start', () => { if (g.startMission(g.makeActivity(kind))) { g.replayMode = false; this.hooks.resume(); } }, 'small', !g.activitiesUnlocked() || g.missions.running)));
      if (g.best.circuit !== null) body.appendChild(h('div', { class: 'sub' }, `Best circuit time: ${Math.floor(g.best.circuit / 60)}:${String(Math.floor(g.best.circuit % 60)).padStart(2, '0')}`));
    } else if (this.tab === 'places') {
      for (const p of g.world.pois) {
        if (p.kind === 'viewpoint' && !g.player.discovered.includes(p.id)) continue;
        body.appendChild(h('div', { class: 'row' }, h('div', { class: 'grow' }, h('div', { class: 'nm' }, p.name), h('div', { class: 'ds' }, p.district)), btn('Waypoint', () => { this.hooks.setWaypoint({ x: p.x, z: p.z }); g.toast('Waypoint set: ' + p.name, 'info'); }, 'small')));
      }
      body.appendChild(btn('Clear waypoint', () => this.hooks.setWaypoint(null), 'small'));
    } else {
      const P = g.player;
      body.appendChild(h('div', { class: 'grid2' },
        h('div', {}, `Cash: $${P.cash}`), h('div', {}, `Trust level: ${P.trust}/5 (${Math.floor(P.trustXp * 10) / 10} xp)`),
        h('div', {}, `Landmarks found: ${P.discovered.length}/5`), h('div', {}, `Distance travelled: ${(P.stats.distance / 1000).toFixed(1)} km`),
        h('div', {}, `Crimes witnessed or recorded: ${P.stats.crimes}`), h('div', {}, `Civilians harmed: ${P.stats.civilianHarm}`),
        h('div', {}, `Arrests: ${g.police.stats.arrests}`), h('div', {}, `Escapes: ${g.police.stats.escapes}`),
      ));
      body.appendChild(h('h3', {}, 'Trust unlocks'));
      body.appendChild(h('div', { class: 'ds' }, 'Level 1: stun projector, machine pistol. Level 2: carbine, shotgun. Level 3: marksman rifle. Trust never changes your health or damage.'));
    }
    const s = h('div', { class: 'sheet' }, h('h2', {}, 'Phone'), h('div', { class: 'sub' }, 'Ines Calder - Dispatch - signal strong'), tabs, body, h('div', { class: 'footer' }, btn('Close', () => this.hooks.resume(), 'primary')));
    this.show('phone', s, true);
  }

  // ------------------------------------------------------------------ map
  mapScreen(): void {
    const g = this.game;
    const canvas = h('canvas', { width: '780', height: String(Math.round(780 * (640 / 620))) });
    canvas.style.cssText = 'width:min(60vh,560px);height:auto;max-width:60vw';
    this.mapCanvas = canvas;
    const draw = () => this.hud.map.drawFull(canvas, g, this.hud.waypoint ? null : null, this.hud.filters, this.hud.waypoint);
    canvas.addEventListener('click', (ev) => {
      const r = canvas.getBoundingClientRect();
      const p = this.hud.map.toWorld(canvas, ((ev.clientX - r.left) / r.width) * canvas.width, ((ev.clientY - r.top) / r.height) * canvas.height);
      this.hooks.setWaypoint(p);
      g.toast('Waypoint set', 'info');
      draw();
    });
    const filt = (label: string, key: keyof typeof this.hud.filters, colour: string) => {
      const i = h('input', { type: 'checkbox' });
      i.checked = this.hud.filters[key];
      i.addEventListener('change', () => { this.hud.filters[key] = i.checked; draw(); });
      return h('div', {}, i, h('i', { style: `background:${colour}` }), label);
    };
    const legend = h('div', { class: 'legend' },
      h('h3', {}, 'Legend & filters'),
      filt('Jobs & boards', 'missions', '#e09a2b'), filt('Shops & services', 'shops', '#3b6fd9'), filt('Landmarks', 'landmarks', '#8e5fc8'), filt('Police search area', 'police', '#ff4632'),
      h('div', {}, h('i', { style: 'background:#2a8a80' }), 'Safehouse'), h('div', {}, h('i', { style: 'background:#ffb400' }), 'Objective'), h('div', {}, h('i', { style: 'background:#17b8ff' }), 'Your waypoint'),
      h('div', { class: 'ds' }, 'Click the map to place a waypoint; the GPS route follows the road network and updates after missed turns.'),
      btn('Clear waypoint', () => { this.hooks.setWaypoint(null); draw(); }, 'small'));
    const s = h('div', { class: 'sheet' }, h('h2', {}, 'South Quay'), h('div', { class: 'mapwrap' }, canvas, legend), h('div', { class: 'footer' }, btn('Close', () => this.hooks.resume(), 'primary')));
    this.show('map', s, true);
    draw();
  }

  refreshMap(): void {
    if (this.current === 'map' && this.mapCanvas) this.hud.map.drawFull(this.mapCanvas, this.game, null, this.hud.filters, this.hud.waypoint);
  }

  // ------------------------------------------------------------------ shops
  store(): void {
    const g = this.game;
    const list = h('div', {});
    for (const item of g.shopItems()) {
      const why = item.blocked(g.player);
      list.appendChild(h('div', { class: 'row' + (why === 'Owned' ? ' locked' : '') }, h('div', { class: 'grow' }, h('div', { class: 'nm' }, item.label, why ? h('span', { class: 'badge' }, why) : null), h('div', { class: 'ds' }, item.desc)), h('div', { class: 'pr' }, '$' + item.price), btn('Buy', () => { g.buyItem(item); this.store(); }, 'small', !!why || g.player.cash < item.price)));
    }
    const s = h('div', { class: 'sheet' }, h('h2', {}, 'Brightline Convenience'), h('div', { class: 'sub' }, `Cash: $${g.player.cash} - Trust ${g.player.trust}. Armed response is real: carry only what you will use.`), list, h('div', { class: 'footer' }, btn('Leave', () => this.hooks.resume(), 'primary')));
    this.show('store', s, true);
  }

  kiosk(): void {
    const g = this.game;
    const list = h('div', {});
    OUTFITS.forEach((name, i) => list.appendChild(h('div', { class: 'row' }, h('div', { class: 'grow' }, h('div', { class: 'nm' }, name, g.player.outfit === i ? h('span', { class: 'badge' }, 'Wearing') : null), h('div', { class: 'ds' }, i === 0 ? 'Your usual courier jacket.' : 'A new look. If the police only have your old description, they lose track of you after you break line of sight.')), h('div', { class: 'pr' }, i === g.player.outfit ? '' : '$' + OUTFIT_PRICE), btn('Wear', () => { g.buyOutfit(i); this.kiosk(); }, 'small', i === g.player.outfit || g.player.cash < OUTFIT_PRICE))));
    this.show('kiosk', h('div', { class: 'sheet' }, h('h2', {}, 'Threadwork Kiosk'), h('div', { class: 'sub' }, `Cash: $${g.player.cash}`), list, h('div', { class: 'footer' }, btn('Leave', () => this.hooks.resume(), 'primary'))), true);
  }

  garage(): void {
    const g = this.game;
    const v = g.playerVehicle();
    const cost = v ? repairCost(v.health, v.def.health) : 0;
    this.show('garage', h('div', { class: 'sheet', style: 'width:min(560px,92vw)' },
      h('h2', {}, 'Tidewater Garage'),
      h('div', { class: 'sub' }, v ? `${v.def.name} - condition ${Math.round((v.health / v.def.health) * 100)}%` : 'Bring a vehicle into the bay.'),
      h('div', { class: 'row' }, h('div', { class: 'grow' }, h('div', { class: 'nm' }, 'Full repair'), h('div', { class: 'ds' }, 'Body, engine and tyres.')), h('div', { class: 'pr' }, '$' + cost), btn('Repair', () => { g.repairPlayerVehicle(); this.garage(); }, 'small', !v || cost <= 0 || g.player.cash < cost)),
      h('div', { class: 'footer' }, btn('Leave', () => this.hooks.resume(), 'primary'))), true);
  }

  safehouse(): void {
    const g = this.game;
    const rows = h('div', {});
    for (const { def, locked } of g.availableMissions()) {
      if (def.kind !== 'story' || !g.completed[def.id]) continue;
      void locked;
      rows.appendChild(h('div', { class: 'row' }, h('div', { class: 'grow' }, h('div', { class: 'nm' }, def.title, h('span', { class: 'badge' }, 'Best ' + g.completed[def.id].grade)), h('div', { class: 'ds' }, 'Mission replay: clean loadout, grade recorded, no duplicate rewards.')), btn('Replay', () => { if (g.startMission(cloneForReplay(def))) { g.replayMode = true; this.hooks.resume(); } }, 'small', g.missions.running)));
    }
    this.show('safehouse', h('div', { class: 'sheet', style: 'width:min(640px,92vw)' },
      h('h2', {}, "Rowan's Loft"),
      h('div', { class: 'sub' }, 'Your safehouse. Resting heals you and saves your progress.'),
      h('div', { class: 'choice-list' }, btn('Rest and Save', async () => { g.restAtSafehouse(); await this.hooks.saveGame(); this.hooks.resume(); }, 'primary'), btn('Open Phone', () => this.phone()), btn('Open Map', () => this.mapScreen())),
      g.completed['first-shift'] ? h('h3', {}, 'Mission board') : null, rows,
      h('div', { class: 'footer' }, btn('Leave', () => this.hooks.resume(), 'primary'))), true);
  }

  // ------------------------------------------------------------------ mission fail / result / choice
  fail(reason: string, canRetry: boolean): void {
    this.show('fail', h('div', { class: 'sheet card', style: 'width:min(520px,92vw)' },
      h('h2', {}, 'Mission Failed'), h('div', { class: 'sub', style: 'font-size:18px' }, reason),
      h('div', { class: 'choice-list' }, btn('Retry from checkpoint', () => { this.hooks.resume(); this.game.retryMission(); }, 'primary', !canRetry), btn('Abandon mission', () => { this.hooks.resume(); this.game.abandonMission(); }), btn('Free roam', () => { this.hooks.resume(); this.game.abandonMission(); }))), true);
  }

  result(): void {
    const r = this.game.lastResult;
    if (!r || this.resultShown === r) return;
    this.resultShown = r;
    const def = this.game.defs.get(r.id);
    const done = def ? def.optional.filter((o) => r.optionalDone.includes(o.id)) : [];
    this.show('result', h('div', { class: 'sheet card', style: 'width:min(560px,92vw)' },
      h('h2', {}, 'Mission Complete'), h('div', { class: 'sub' }, def?.title ?? r.id), h('div', { class: 'grade' }, r.grade),
      h('div', { class: 'grid2', style: 'text-align:left;margin:10px 0' }, h('div', {}, `Time: ${Math.floor(r.time / 60)}:${String(Math.floor(r.time % 60)).padStart(2, '0')}`), h('div', {}, this.game.replayMode ? 'Replay: no reward' : `Reward: $${r.cash}  Trust +${r.trust}`)),
      h('div', { class: 'ds' }, done.length ? 'Optional goals: ' + done.map((o) => o.text).join(' - ') : 'No optional goals met'), r.notes.length ? h('div', { class: 'ds' }, r.notes.join(' - ')) : null,
      h('div', { class: 'footer' }, btn('Continue', () => this.hooks.resume(), 'primary'))), true);
  }

  choice(prompt: string, options: string[], cb: (i: number) => void): void {
    const s = h('div', { class: 'sheet', style: 'width:min(560px,92vw)' }, h('h2', {}, prompt), h('div', { class: 'choice-list' }, ...options.map((o, i) => btn(o, () => { this.hooks.resume(); cb(i); }, i === 0 ? 'primary' : ''))));
    this.show('choice', s, true);
  }

  dead(reason: string): void {
    this.show('dead', h('div', { class: 'sheet card', style: 'width:min(420px,92vw)' }, h('h2', {}, 'Down'), h('div', { class: 'sub' }, reason)), false);
  }
}

function cloneForReplay(def: MissionDef): MissionDef { return def; }
void WEAPONS;
