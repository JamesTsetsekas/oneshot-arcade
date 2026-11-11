// Application shell: boot, capability checks, fixed-step loop, input, saving and screen flow.
import { AudioEngine } from './audio/audio';
import { IdbKV, MemoryKV, SaveRepo } from './persist/save';
import { GameView } from './render/view';
import { Character, newCharacter } from './sim/character';
import { Game } from './sim/game';
import type { GameEvent } from './sim/types';
import { Hud } from './ui/hud';
import { Menus } from './ui/menus';
import { Panels } from './ui/panels';
import { ACTION_LABELS, PRESETS, mergeSettings, type Action, type Settings } from './ui/settings';

const STEP = 1 / 30;

export class App {
  canvas: HTMLCanvasElement;
  view!: GameView;
  audio = new AudioEngine();
  repo: SaveRepo;
  settings: Settings;
  game: Game | null = null;
  hud: Hud | null = null;
  panels!: Panels;
  menus!: Menus;
  altHeld = false;
  ctrlHeld = false;
  fps = { median: 60, low: 60, cur: 60 };
  private frameTimes: number[] = [];
  private acc = 0;
  private last = 0;
  private tooltipEl: HTMLElement;
  private autosaveT = 0;
  private mouse = { x: 0, y: 0, left: false, right: false, holdT: 0, rightT: 0, holdKind: '' as '' | 'move' | 'attack' | 'basic', holdTarget: 0 };
  private keysDown = new Set<string>();
  private reverseKeys = new Map<string, Action>();
  private running = false;
  private persistent = true;
  private hover: { enemy?: number; interact?: string } = {};
  private ui: HTMLElement;

  constructor(private root: HTMLElement) {
    this.canvas = root.querySelector('#game') as HTMLCanvasElement;
    this.ui = root.querySelector('#ui') as HTMLElement;
    this.tooltipEl = document.createElement('div');
    this.tooltipEl.id = 'tooltip';
    this.tooltipEl.className = 'hidden';
    document.body.appendChild(this.tooltipEl);
    let kv: IdbKV | MemoryKV;
    try {
      if (typeof indexedDB === 'undefined') throw new Error('no idb');
      kv = new IdbKV();
    } catch {
      kv = new MemoryKV();
      this.persistent = false;
    }
    this.repo = new SaveRepo(kv);
    this.settings = mergeSettings(undefined);
  }

  static hasWebGL2(): boolean {
    try {
      const c = document.createElement('canvas');
      return !!c.getContext('webgl2');
    } catch {
      return false;
    }
  }

  async boot() {
    try {
      this.settings = mergeSettings(await this.repo.getSettings());
    } catch {
      this.persistent = false;
    }
    this.view = new GameView(this.canvas);
    this.hud = new Hud(this as never, this.ui);
    this.hud.show(false);
    this.panels = new Panels(this as never, this.ui);
    this.menus = new Menus(
      {
        repo: this.repo,
        onContinue: (id) => void this.loadCharacter(id),
        onLoad: (id) => void this.loadCharacter(id),
        onCreate: (n, c, b, v) => this.createCharacter(n, c, b, v),
        onSettings: () => this.openMenuSettings(),
        previewClass: (c, look) => this.view.showMenu('create', c, look),
        previewVoice: (v) => {
          this.audio.init();
          this.audio.setVoice(v);
          this.audio.bark('attack');
        },
        showTitleStage: () => this.view.showMenu('title'),
        playUi: () => {
          this.audio.init();
          this.audio.play('ui');
        },
      },
      this.ui,
    );
    this.applySettings();
    this.bindInput();
    window.addEventListener('resize', () => {
      this.view.resize();
      this.hud?.resize();
    });
    this.hud.resize();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) void this.saveNow();
    });
    window.addEventListener('beforeunload', () => void this.saveNow());
    this.view.showMenu('title');
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame((t) => this.loop(t));
    const qs = new URLSearchParams(location.search);
    const auto = qs.get('autostart');
    if (auto === 'cinder' || auto === 'ranger') {
      this.createCharacter('Tester', auto, 0, 0);
      if (qs.get('bench')) this.startBench();
    } else await this.menus.title(this.persistent ? '' : 'Saving is unavailable in this browser session (IndexedDB is blocked).');
  }

  /** Benchmark scene (?autostart=...&bench=1): 45 normal enemies, 3 elites and a boss around an auto-fighting, immortal player. */
  startBench() {
    const g = this.game!;
    g.gainXp(3000);
    for (const id of ['brand_arc', 'bastion_step', 'cinder_ring', 'splinter_volley', 'ghostline', 'snare_bloom']) g.learnSkill(id);
    g.enterZone('march');
    const free = (x: number, z: number) => g.zone.grid.cells[Math.floor(z) * g.zone.w + Math.floor(x)] === 0;
    const c = g.zone.playerStart;
    let spot = { x: c.x, z: c.z - 16 };
    for (let r = 10; r < 30; r += 2) {
      let ok = false;
      for (let a = 0; a < 36 && !ok; a++) {
        const x = c.x + Math.cos((a / 36) * 6.28) * r;
        const z = c.z + Math.sin((a / 36) * 6.28) * r;
        if (free(x, z) && free(x + 8, z) && free(x - 8, z) && free(x, z + 8) && free(x, z - 8)) {
          spot = { x, z };
          ok = true;
        }
      }
      if (ok) break;
    }
    g.player.x = g.player.px = spot.x;
    g.player.z = g.player.pz = spot.z;
    const types = ['crawler', 'husk', 'archer', 'scribe', 'mite', 'pilgrim', 'warden', 'swarm', 'hound', 'adept'];
    for (let i = 0; i < 45; i++) {
      const a = (i / 45) * Math.PI * 2;
      const r = 5 + (i % 5) * 1.5;
      g.spawnEnemy(types[i % types.length], spot.x + Math.cos(a) * r, spot.z + Math.sin(a) * r, 8, { pack: `bench${i % 6}`, aggro: true });
    }
    for (let i = 0; i < 3; i++) g.spawnEnemy('husk', spot.x + i * 2 - 2, spot.z - 8, 9, { pack: 'benchE', aggro: true, elite: ['ember_wake', 'frost_pulse', 'rallying'].slice(i, i + 1) });
    this.settings.showFps = true;
    window.setInterval(() => {
      g.player.hp = g.player.maxHp;
      g.player.focus = g.player.maxFocus;
      const foes = g.enemies.filter((e) => e.alive && !e.neutral);
      let best = null as (typeof foes)[number] | null;
      let bd = 1e9;
      for (const e of foes) {
        const d = Math.hypot(e.x - g.player.x, e.z - g.player.z);
        if (d < bd) {
          bd = d;
          best = e;
        }
      }
      if (!best) return;
      if (bd < 3.6) g.cmdSkill('rmb', best.x, best.z, best.id);
      else g.cmdAttack(best.id);
    }, 160);
  }

  // ------------------------------------------------------------ settings
  applySettings() {
    const s = this.settings;
    this.view?.apply({ shadows: s.shadows, particles: s.particles, shake: s.shake, reducedMotion: s.reducedMotion, colorblind: s.colorblind, dynamicRes: s.dynamicRes });
    this.audio.applySettings(s.audio);
    document.documentElement.style.setProperty('--ui', String(s.uiScale));
    this.reverseKeys.clear();
    for (const a of Object.keys(s.keys) as Action[]) this.reverseKeys.set(s.keys[a], a);
    void PRESETS;
  }
  saveSettings() {
    void this.repo.setSettings(JSON.stringify(this.settings)).catch(() => undefined);
  }
  private openMenuSettings() {
    this.menus.hide();
    this.panels.openSettings('menu');
  }
  menuReturn() {
    void this.menus.title();
  }

  // ------------------------------------------------------------ tooltip
  tooltip(html: string | null, x = 0, y = 0, flipLeft = false) {
    const el = this.tooltipEl;
    if (!html) {
      el.classList.add('hidden');
      return;
    }
    el.innerHTML = html;
    el.classList.remove('hidden');
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    let left = flipLeft ? x - w : x + 14;
    let top = y + 10;
    if (left + w > window.innerWidth - 6) left = window.innerWidth - w - 6;
    if (left < 6) left = 6;
    if (top + h > window.innerHeight - 6) top = Math.max(6, window.innerHeight - h - 6);
    el.style.left = left + 'px';
    el.style.top = top + 'px';
  }

  // ------------------------------------------------------------ game lifecycle
  createCharacter(name: string, cls: 'cinder' | 'ranger', body: number, voice: number) {
    const ch = newCharacter(name, cls, { body, voice }, Math.floor(Math.random() * 2 ** 31));
    this.startGame(ch);
    void this.saveNow();
  }

  async loadCharacter(id: string) {
    const r = await this.repo.load(id);
    if (!r.ok) {
      this.menus.error('Could not load character', `${r.reason}<br>The save may be damaged beyond recovery.`, [{ label: 'Back', fn: () => void this.menus.title() }]);
      return;
    }
    this.startGame(r.ch);
    if (r.recovered) this.hud?.toast('Your latest save was damaged; the last good backup was restored.', 'warn', 7);
  }

  startGame(ch: Character) {
    this.audio.init();
    this.audio.setVoice(ch.look.voice);
    this.game = new Game(ch);
    this.view.setGame(this.game);
    this.view.apply({});
    this.menus.hide();
    this.hud!.show(true);
    this.hud!.hideDeath();
    this.hud!.resize();
    this.game.events.length = 0;
    this.events(this.game.events);
    void this.repo.setLast(ch.id);
    this.acc = 0;
    this.autosaveT = 0;
    this.hud!.banner(this.game.zone.name, 'Safe haven');
    this.audio.setMusic('town');
    if (!ch.quests.ashway && !ch.tutorial.moved) this.hud!.toast('Welcome, Warden. Follow the Training list, then speak to Marshal Orsa Vell.', 'quest', 8);
  }

  async saveNow() {
    if (!this.game) return;
    try {
      await this.repo.save(this.game.ch);
    } catch {
      this.hud?.toast('Saving failed - storage may be full or blocked.', 'warn', 6);
    }
  }

  goMenu() {
    void this.saveNow().then(() => {
      this.game = null;
      this.view.showMenu('title');
      this.hud!.show(false);
      this.audio.setMusic('town');
      void this.menus.title();
    });
  }

  respawn() {
    this.game?.respawn();
    this.hud?.hideDeath();
    this.audio.setMusic(this.game!.zone.id === 'refuge' ? 'town' : this.game!.zone.theme === 'crypt' ? 'crypt' : 'wild');
  }

  onPickupClick(id: number) {
    this.game?.cmdPickup(id);
  }

  // ------------------------------------------------------------ loop
  private events(evs: GameEvent[]) {
    if (!this.game || !evs.length) return;
    const list = evs.splice(0, evs.length);
    this.view.handleEvents(list);
    this.hud?.handleEvents(list);
    const p = this.game.player;
    for (const ev of list) {
      this.audio.handle(ev, p);
      if (ev.t === 'panel') this.panels.openPanel(ev.id);
      else if (ev.t === 'dialog') this.panels.openDialog(ev.npc);
      else if (ev.t === 'zone') {
        this.panels.closeAll();
        void this.saveNow();
      } else if (ev.t === 'levelup') this.panels.refresh();
    }
  }

  private errCount = new Map<string, number>();
  /** Presentation errors must never freeze the simulation loop: log (rate-limited) and carry on. */
  private guard(name: string, fn: () => void) {
    try {
      fn();
    } catch (err) {
      const n = (this.errCount.get(name) ?? 0) + 1;
      this.errCount.set(name, n);
      if (n <= 3) console.error(`[${name}]`, err);
    }
  }

  private loop(ts: number) {
    if (!this.running) return;
    requestAnimationFrame((t) => this.loop(t));
    let dt = (ts - this.last) / 1000;
    this.last = ts;
    if (dt > 0.25) dt = 0.25;
    if (dt <= 0) return;
    // perf stats
    this.frameTimes.push(dt * 1000);
    if (this.frameTimes.length > 300) this.frameTimes.shift();
    if (this.frameTimes.length % 20 === 0) {
      const sorted = [...this.frameTimes].sort((a, b) => a - b);
      this.fps.median = 1000 / sorted[Math.floor(sorted.length / 2)];
      this.fps.low = 1000 / sorted[Math.max(0, Math.floor(sorted.length * 0.99) - 1)];
      this.fps.cur = 1000 / (this.frameTimes.slice(-20).reduce((a, b) => a + b, 0) / 20);
    }
    const g = this.game;
    let ticks = 0;
    if (g) {
      this.acc += dt;
      while (this.acc >= STEP) {
        this.handleHold(STEP);
        g.step(STEP);
        this.acc -= STEP;
        ticks++;
        if (ticks > 5) {
          this.acc = 0;
          break;
        }
      }
      if (g.paused) this.acc = 0;
      this.guard('events', () => this.events(g.events));
      this.guard('view', () => this.view.update(dt, g.paused ? 1 : this.acc / STEP, ticks));
      this.guard('hud', () => {
        this.hud!.update(dt);
        this.panels.tick(dt);
      });
      this.guard('audio', () => {
        this.audio.setListener(g.player.x, g.player.z);
        this.audio.update(dt, { hpFrac: g.player.hp / g.player.maxHp, bossPhase: g.boss?.boss_state?.phase ?? 0, inBoss: !!g.boss?.boss_state?.engaged, dead: g.player.dead });
      });
      this.guard('hover', () => this.updateHover());
      this.autosaveT += dt;
      if (this.autosaveT > 30 || (g.autosaveNeeded && this.autosaveT > 4)) {
        this.autosaveT = 0;
        g.autosaveNeeded = false;
        void this.saveNow();
      }
    } else {
      this.view.update(dt, 1, 0);
    }
  }

  // ------------------------------------------------------------ input
  private updateHover() {
    const g = this.game;
    if (!g || g.player.dead) return;
    if (this.panels.modalOpen()) return;
    const pk = this.view.pick(this.mouse.x, this.mouse.y);
    this.hover = { enemy: pk.enemy, interact: pk.enemy ? undefined : pk.interact };
    this.view.setHover(pk.enemy ? { kind: 'enemy', id: pk.enemy } : pk.interact ? { kind: 'interact', id: pk.interact } : { kind: null });
    this.hud?.setHoverEnemy(pk.enemy ?? 0);
    this.canvas.style.cursor = pk.enemy ? 'crosshair' : pk.interact ? 'pointer' : 'default';
  }

  private handleHold(dt: number) {
    const g = this.game;
    if (!g || g.player.dead || g.paused) return;
    const m = this.mouse;
    if (m.left && m.holdKind) {
      m.holdT -= dt;
      if (m.holdT <= 0) {
        m.holdT = 0.12;
        const pk = this.view.pick(m.x, m.y);
        if (m.holdKind === 'move') {
          if (pk.enemy && !this.settings.attackInPlace) {
            m.holdKind = 'attack';
            m.holdTarget = pk.enemy;
            g.cmdAttack(pk.enemy);
          } else g.cmdMove(pk.gx, pk.gz);
        } else if (m.holdKind === 'attack') {
          const t = g.enemies.find((e) => e.id === m.holdTarget && e.alive);
          if (!t) {
            m.holdKind = 'move';
          } else g.cmdAttack(t.id);
        } else if (m.holdKind === 'basic') g.cmdBasic(pk.gx, pk.gz, pk.enemy ?? 0);
      }
    }
    if (m.right) {
      m.rightT -= dt;
      if (m.rightT <= 0) {
        m.rightT = 0.1;
        const pk = this.view.pick(m.x, m.y);
        g.cmdSkill('rmb', pk.gx, pk.gz, pk.enemy ?? 0);
      }
    }
    g.setStandStill(this.keysDown.has(this.settings.keys.standStill));
  }

  private bindInput() {
    const c = this.canvas;
    c.addEventListener('contextmenu', (e) => e.preventDefault());
    this.root.addEventListener('contextmenu', (e) => e.preventDefault());
    c.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.ui.addEventListener('mousedown', (e) => {
      // clicks on the HUD layer that are not on an interactive element fall through to the world
      const t = e.target as HTMLElement;
      if (t.closest('.pcol, .pmodal, .confirm-wrap, #menus, .slot, #minimap, .gl, .toast, #death, #tooltip')) return;
      if (t.closest('#hud') || t === this.ui) this.onMouseDown(e);
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.mouse.left = false;
        this.mouse.holdKind = '';
      }
      if (e.button === 2) this.mouse.right = false;
    });
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    window.addEventListener(
      'wheel',
      (e) => {
        if (!this.game || (e.target as HTMLElement).closest('.pcol, .pmodal')) return;
        this.view.setZoom(Math.sign(e.deltaY) * 1.6);
      },
      { passive: true },
    );
    window.addEventListener('keydown', (e) => this.onKey(e, true));
    window.addEventListener('keyup', (e) => this.onKey(e, false));
    window.addEventListener('blur', () => {
      this.keysDown.clear();
      this.mouse.left = this.mouse.right = false;
      this.altHeld = this.ctrlHeld = false;
    });
  }

  private onMouseDown(e: MouseEvent) {
    const g = this.game;
    if (!g) return;
    this.audio.init();
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
    if (this.panels.modalOpen() || g.paused) return;
    if (g.player.dead) return;
    const pk = this.view.pick(e.clientX, e.clientY);
    if (e.button === 0) {
      this.tooltip(null);
      this.mouse.left = true;
      this.mouse.holdT = 0.12;
      const shift = this.keysDown.has(this.settings.keys.standStill);
      if (shift || (this.settings.attackInPlace && !pk.interact)) {
        this.mouse.holdKind = 'basic';
        g.cmdBasic(pk.gx, pk.gz, pk.enemy ?? 0);
      } else if (pk.enemy) {
        this.mouse.holdKind = 'attack';
        this.mouse.holdTarget = pk.enemy;
        g.cmdAttack(pk.enemy);
      } else if (pk.interact) {
        this.mouse.holdKind = '';
        g.cmdInteract(pk.interact);
      } else {
        this.mouse.holdKind = 'move';
        const ok = g.cmdMove(pk.gx, pk.gz);
        void ok;
        if (g.player.invalidT > 0) this.view.showInvalidMarker(pk.gx, pk.gz);
        else if (g.player.moveTarget) this.view.showMoveMarker(g.player.moveTarget.x, g.player.moveTarget.z);
      }
    } else if (e.button === 2) {
      this.mouse.right = true;
      this.mouse.rightT = 0.1;
      g.cmdSkill('rmb', pk.gx, pk.gz, pk.enemy ?? 0);
    }
  }

  private onKey(e: KeyboardEvent, down: boolean) {
    const code = e.code;
    if (down) {
      if (this.panels?.isRebinding) {
        e.preventDefault();
        this.panels.handleKeyRebind(code);
        return;
      }
      this.keysDown.add(code);
    } else this.keysDown.delete(code);
    const k = this.settings.keys;
    this.altHeld = this.keysDown.has(k.labels) || this.keysDown.has('AltRight');
    this.ctrlHeld = this.keysDown.has(k.compare) || this.keysDown.has('ControlRight');
    const g = this.game;
    if (!g) return;
    const act = this.reverseKeys.get(code);
    if (!act) return;
    if (['labels', 'compare', 'standStill'].includes(act)) {
      e.preventDefault();
      return;
    }
    if (!down) return;
    const t = e.target as HTMLElement;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA') && act !== 'pause') return;
    if (e.repeat && act !== 'evade') return;
    if (['Tab', 'Space'].includes(code) || e.altKey || e.ctrlKey) e.preventDefault();
    if (act === 'pause') {
      if (g.player.dead) return;
      if (!this.panels.closeTop()) this.panels.openPanel('pause');
      return;
    }
    if (this.panels.modalOpen() && g.paused) return;
    if (g.player.dead) return;
    const gp = this.view.groundAt(this.mouse.x, this.mouse.y);
    const pk = this.view.pick(this.mouse.x, this.mouse.y);
    switch (act) {
      case 'skillQ':
      case 'skillW':
      case 'skillE':
      case 'skillR':
        g.cmdSkill(act.slice(5).toLowerCase() as 'q', gp.x, gp.z, pk.enemy ?? 0);
        break;
      case 'potion1':
        g.cmdPotion('health');
        break;
      case 'potion2':
        g.cmdPotion('focus');
        break;
      case 'potion3':
        g.cmdPotion('cleanse');
        break;
      case 'potion4':
        g.cmdPotion('tonic');
        break;
      case 'evade':
        g.cmdEvade(gp.x, gp.z);
        break;
      case 'inventory':
        this.panels.toggle('inventory');
        break;
      case 'skills':
        this.panels.toggle('skills');
        break;
      case 'character':
        this.panels.toggle('character');
        break;
      case 'quests':
        this.panels.toggle('quests');
        break;
      case 'map':
        this.panels.toggle('map');
        break;
      case 'automap':
        this.hud!.root.classList.toggle('bigmap');
        this.hud!.automapOverlay = !this.hud!.automapOverlay;
        break;
      case 'townGate':
        g.cmdTownGate();
        break;
      case 'interact': {
        const u = g.nearestUsable();
        if (u) {
          if (u.kind === 'pickup') g.cmdPickup(u.id as number);
          else g.cmdInteract(u.id as string);
        }
        break;
      }
    }
  }
}

export { ACTION_LABELS };
