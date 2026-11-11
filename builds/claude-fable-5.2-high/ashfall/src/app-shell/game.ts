import { CLASSES, SKILL, basicOf } from '../abilities/skills';
import { AudioSys } from '../audio/audio';
import { dist, lerp, type Vec } from '../core/math';
import { DT, type ClassId, type Ev, type Hero } from '../entity-combat/types';
import { EVADE_MAX, GATE_TIME, Session } from '../game-session/session';
import { ENEMY, MOD } from '../navigation-ai/enemies';
import { SaveRepo } from '../persistence/repo';
import { createHero } from '../progression/progression';
import { questText } from '../progression/quests';
import { Dynamic } from '../renderer-vfx/dynamic';
import { Renderer } from '../renderer-vfx/renderer';
import { DEFAULT_SETTINGS, keyName, pushToast, ui, type HudState, type PanelId, type Settings } from '../ui/store';
import { ZONE_INFO } from '../world-generation/generate';
import { Overlay } from './overlay';

const STATUS_LABEL: Record<string, [string, boolean]> = {
  burn: ['Burning', false], blight: ['Blight', false], chill: ['Chilled', false], root: ['Rooted', false], stun: ['Stunned', false], guard: ['Guard', true], cloak: ['Mothcloak', true],
  furnace: ['Furnace Heart', true], standard: ['Ashen Standard', true], tonic: ['Resist Tonic', true], haste: ['Haste', true], cleansed: ['Cleansed', true],
};
const TUTORIAL = [
  'Left-click the ground to move. Hold the button to keep walking.',
  'Left-click an enemy or training dummy to attack. Basic attacks build Focus.',
  'Right-click to unleash your core skill at the cursor. It spends Focus.',
  'Press Space to evade toward the cursor. You hold three charges.',
  'Press 1 to drink a Red Draught. I opens inventory, K skills, C character.',
];

/** Application glue: owns the session, renderer, audio and input, and exposes commands for the React UI. */
export class Game {
  repo = new SaveRepo(); session: Session | null = null; renderer: Renderer | null = null; dynamic: Dynamic | null = null; overlay: Overlay | null = null;
  audio = new AudioSys(DEFAULT_SETTINGS); canvas: HTMLCanvasElement | null = null;
  private raf = 0; private last = 0; private acc = 0; private hudT = 0; private frameEvents: Ev[] = [];
  private mouse = { x: 0, y: 0, left: false, right: false, inside: false }; private keysDown = new Set<string>();
  private repeat = 0; private lockTarget = 0; hover = 0; hoverInter = 0; private labelsHeld = false; private tut = 0; private tutBase = { x: 0, y: 0, dmg: 0, t: 0 };
  private saving = false; private fpsN = 0; private fpsT = 0; private bannerId = 1;

  async boot(): Promise<void> {
    const c = document.createElement('canvas');
    if (!c.getContext('webgl2')) { ui.set({ screen: 'error', error: 'Ashfall Covenant requires WebGL 2, which this browser or device does not provide. Try a current version of Chrome, Edge or Firefox with hardware acceleration enabled.' }); return; }
    if (!('indexedDB' in window)) { ui.set({ screen: 'error', error: 'IndexedDB is unavailable (private browsing mode?). The game needs it to save your Warden.' }); return; }
    try {
      const st = await this.repo.getProfile<Settings>('settings');
      if (st) ui.set({ settings: { ...DEFAULT_SETTINGS, ...st, keys: { ...DEFAULT_SETTINGS.keys, ...st.keys } } });
      await this.refreshSaves();
    } catch (e) { ui.set({ notice: 'Save storage could not be opened: ' + String(e) }); }
    this.audio.settings = ui.get().settings;
    ui.set({ screen: 'menu' });
  }
  async refreshSaves(): Promise<void> { ui.set({ saves: await this.repo.list() }); }
  setSettings(patch: Partial<Settings>): void {
    const settings = { ...ui.get().settings, ...patch };
    ui.set({ settings });
    this.audio.settings = settings; this.audio.applyVolumes();
    if (this.renderer) {
      const q = this.renderer.settings.quality !== settings.quality;
      Object.assign(this.renderer.settings, { quality: settings.quality, shake: settings.shake, reducedMotion: settings.reducedMotion, particles: settings.reducedMotion ? Math.min(0.4, settings.particles) : settings.particles });
      if (q) { this.renderer.applyQuality(); if (this.session) { this.renderer.setZone(this.session.zone); this.dynamic!.setZone(this.session.zone); } }
    }
    document.documentElement.classList.toggle('colorblind', settings.colorblind);
    void this.repo.setProfile('settings', settings).catch(() => {});
  }
  // ─────────────── lifecycle ───────────────
  async newGame(name: string, cls: ClassId, look: number): Promise<void> {
    const hero = createHero(name, cls, look, (Math.random() * 0x7fffffff) | 0);
    await this.repo.save(hero).catch(() => {});
    this.start(hero);
  }
  async continueGame(id: string): Promise<void> {
    ui.set({ loading: true });
    try {
      const { hero, recovered } = await this.repo.load(id);
      this.start(hero);
      if (recovered) pushToast('The latest save was damaged — restored from the last good backup.', 'quest');
    } catch (e) { ui.set({ notice: `Could not load that Warden: ${(e as Error).message}` }); await this.refreshSaves(); }
    ui.set({ loading: false });
  }
  async deleteSave(id: string): Promise<void> { await this.repo.remove(id); await this.refreshSaves(); }
  attach(canvas: HTMLCanvasElement, overlayRoot: HTMLElement): void {
    if (this.canvas === canvas) return;
    this.canvas = canvas;
    const st = ui.get().settings;
    try {
      this.renderer = new Renderer(canvas, { quality: st.quality, shake: st.shake, reducedMotion: st.reducedMotion, particles: st.reducedMotion ? Math.min(0.4, st.particles) : st.particles });
    } catch (e) { ui.set({ screen: 'error', error: 'Graphics initialization failed: ' + (e as Error).message }); return; }
    this.dynamic = new Dynamic(this.renderer);
    this.overlay = new Overlay(overlayRoot);
    this.overlay.onPickup = (id) => this.session?.intent({ type: 'pickup', id });
    this.overlay.onInteract = (id) => this.session?.intent({ type: 'interact', id });
    this.bindInput(canvas);
    if (this.session) this.enterZoneView();
    this.last = performance.now();
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(this.frame);
  }
  private start(hero: Hero): void {
    this.session = new Session(hero);
    this.session.events.length = 0;
    this.tut = ui.get().settings.tutorialDone ? 99 : 0;
    this.tutBase = { x: this.session.player.x, y: this.session.player.y, dmg: hero.stats.damageDealt, t: 0 };
    ui.set({ screen: 'game', panel: null, dialog: null, paused: false, death: null, summary: false, heroVersion: ui.get().heroVersion + 1, hint: null });
    document.documentElement.classList.toggle('colorblind', ui.get().settings.colorblind);
    this.audio.resume();
    if (this.renderer) this.enterZoneView();
    this.updateHud();
  }
  private enterZoneView(): void {
    const s = this.session!, r = this.renderer!;
    r.setZone(s.zone); this.dynamic!.setZone(s.zone); this.overlay!.clear();
    r.target.set(s.player.x, 0.9, s.player.y);
    this.audio.setMood(s.zone.kind === 'town' ? 'town' : s.zone.kind === 'crypt' ? 'crypt' : 'wild');
    ui.set({ banner: { text: s.zone.name, sub: s.zone.safe ? 'Safe haven' : `${s.hero.difficulty ? 'Veteran' : 'Normal'} · Level ${s.zone.level}`, id: this.bannerId++ } });
  }
  async save(): Promise<void> {
    if (!this.session || this.saving) return;
    this.saving = true;
    try { await this.repo.save(this.session.hero); } catch (e) { pushToast('Save failed: ' + (e as Error).message); }
    this.saving = false;
  }
  async exitToMenu(): Promise<void> {
    await this.save();
    cancelAnimationFrame(this.raf);
    this.audio.stop(); this.audio.setMood('menu');
    this.renderer?.dispose(); this.renderer = null; this.dynamic = null; this.canvas = null; this.session = null;
    await this.refreshSaves();
    ui.set({ screen: 'menu', hud: null, panel: null, dialog: null, paused: false, death: null, summary: false });
  }
  /** Runs a hero mutation from the UI (equip, craft, allocate…), then refreshes stats and persists. */
  act(fn: (hero: Hero, s: Session) => string | null | void, sfx = 'ui'): boolean {
    const s = this.session;
    if (!s) return false;
    const err = fn(s.hero, s);
    if (err && err !== 'confirm') { pushToast(err); this.audio.play('invalid'); return false; }
    s.refresh();
    this.audio.play(sfx);
    ui.set({ heroVersion: ui.get().heroVersion + 1 });
    s.saveRequested = true;
    return true;
  }
  togglePanel(p: PanelId): void { const cur = ui.get(); this.audio.play('ui'); ui.set({ panel: cur.panel === p ? null : p, dialog: null }); }
  closeAll(): void { ui.set({ panel: null, dialog: null, settingsOpen: false }); }
  respawn(): void { this.session?.respawn(); ui.set({ death: null }); }
  // ─────────────── input ───────────────
  private bindInput(canvas: HTMLCanvasElement): void {
    const m = this.mouse;
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('pointerdown', (e) => {
      this.audio.resume();
      m.x = e.clientX; m.y = e.clientY;
      if (ui.get().paused || !this.session) return;
      if (e.button === 0) { m.left = true; this.lockTarget = 0; this.click(true); this.repeat = 0.16; }
      else if (e.button === 2) { m.right = true; this.cast(0); this.repeat = 0.16; }
      else if (e.button === 3) this.key(ui.get().settings.keys.evade);
    });
    window.addEventListener('pointerup', (e) => { if (e.button === 0) { m.left = false; this.lockTarget = 0; } else if (e.button === 2) m.right = false; });
    window.addEventListener('pointermove', (e) => { m.x = e.clientX; m.y = e.clientY; m.inside = e.target === canvas; });
    canvas.addEventListener('wheel', (e) => { e.preventDefault(); this.renderer?.setZoom(Math.sign(e.deltaY) * 1.6); }, { passive: false });
    window.addEventListener('keydown', (e) => {
      if (ui.get().screen !== 'game' || (e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (['Tab', 'Space', 'AltLeft', 'AltRight'].includes(e.code)) e.preventDefault();
      if (e.repeat) return;
      this.keysDown.add(e.code);
      this.key(e.code);
    });
    window.addEventListener('keyup', (e) => { this.keysDown.delete(e.code); });
    window.addEventListener('blur', () => { this.keysDown.clear(); m.left = m.right = false; });
    window.addEventListener('resize', () => this.renderer?.resize());
    document.addEventListener('visibilitychange', () => { if (document.hidden && this.session && !ui.get().paused && ui.get().screen === 'game') void this.save(); });
  }
  private ground(): Vec { return this.renderer!.pickGround(this.mouse.x, this.mouse.y); }
  private click(fresh: boolean): void {
    const s = this.session!, k = ui.get().settings.keys;
    const g = this.ground();
    if (this.keysDown.has(k.stand)) { s.intent({ type: 'basic', x: g.x, y: g.y }); return; }
    const tid = fresh ? this.hover : this.lockTarget || this.hover;
    const t = tid ? s.actor(tid) : undefined;
    if (t && !t.dead) { this.lockTarget = t.id; s.intent({ type: 'attack', target: t.id, x: t.x, y: t.y }); return; }
    this.lockTarget = 0;
    if (fresh && this.hoverInter) { s.intent({ type: 'interact', id: this.hoverInter }); return; }
    if (fresh) { const pk = s.zone.pickups.find((p) => p.kind === 'item' && dist(p.x, p.y, g.x, g.y) < 0.7); if (pk) { s.intent({ type: 'pickup', id: pk.id }); return; } }
    if (s.pc.intent && (s.pc.intent.type === 'interact' || s.pc.intent.type === 'pickup') && !fresh) return;
    if (dist(g.x, g.y, s.player.x, s.player.y) > 0.4) s.intent({ type: 'move', x: g.x, y: g.y });
  }
  private cast(slot: number): void {
    const s = this.session!;
    const t = this.hover ? s.actor(this.hover) : undefined;
    const g = t ? { x: t.x, y: t.y } : this.ground();
    s.intent({ type: 'skill', slot, x: g.x, y: g.y });
  }
  private key(code: string): void {
    const s = this.session, u = ui.get(), k = u.settings.keys;
    if (!s) return;
    if (code === 'Escape') {
      if (u.settingsOpen) ui.set({ settingsOpen: false });
      else if (u.panel || u.dialog) ui.set({ panel: null, dialog: null });
      else if (!u.death) ui.set({ paused: !u.paused });
      return;
    }
    if (u.paused || u.death) return;
    const panels: Record<string, PanelId> = { [k.inventory]: 'inventory', [k.skills]: 'skills', [k.character]: 'character', [k.quests]: 'quests', [k.map]: 'map' };
    if (panels[code]) { this.togglePanel(panels[code]); return; }
    if (code === k.automap) { this.setSettings({ minimap: !u.settings.minimap }); return; }
    if (code === k.labels) { this.setSettings({ labels: !u.settings.labels }); return; }
    const g = this.ground();
    for (let i = 0; i < 4; i++) {
      if (code === k['skill' + (i + 1)]) { this.cast(i + 1); return; }
      if (code === k['potion' + (i + 1)]) { s.intent({ type: 'potion', slot: i }); return; }
    }
    if (code === k.evade) s.intent({ type: 'evade', x: g.x, y: g.y });
    else if (code === k.gate) s.intent({ type: 'gate' });
    else if (code === k.interact) {
      const p = s.player;
      const pk = s.zone.pickups.filter((x) => x.kind === 'item').sort((a, b) => dist(a.x, a.y, p.x, p.y) - dist(b.x, b.y, p.x, p.y))[0];
      const it = s.zone.inter.filter((x) => x.state >= 0 && x.type !== 'trap' && !((x.type === 'chest' || x.type === 'shrine' || x.type === 'lever' || x.type === 'cage' || x.type === 'door') && x.state >= 1)).sort((a, b) => dist(a.x, a.y, p.x, p.y) - dist(b.x, b.y, p.x, p.y))[0];
      const dp = pk ? dist(pk.x, pk.y, p.x, p.y) : 99, di = it ? dist(it.x, it.y, p.x, p.y) : 99;
      if (pk && dp <= di && dp < 6) s.intent({ type: 'pickup', id: pk.id });
      else if (it && di < 7) s.intent({ type: 'interact', id: it.id });
    }
  }
  private updateHover(): void {
    const s = this.session!, r = this.renderer!, m = this.mouse;
    this.hover = 0; this.hoverInter = 0;
    if (!m.inside) return;
    const rect = r.canvas.getBoundingClientRect();
    const mx = m.x - rect.left, my = m.y - rect.top;
    let best = 1e9;
    // Closest valid combat target near the cursor ray, favouring threats (awake enemies) over props.
    for (const a of s.zone.actors) {
      if (a.dead || a.untargetable || a.team === 0 || a.kind === 'npc' || a.kind === 'standard') continue;
      const h = (ENEMY[a.def] ? Math.min(2.2, a.r * 1.6 + 0.5) : 1);
      const p0 = r.project(a.x, a.y, h * 0.5);
      if (!p0.ok) continue;
      const rad = 22 + a.r * 34;
      const d = Math.hypot(p0.x - mx, (p0.y - my) * 0.75);
      const score = d + (a.kind === 'prop' ? 18 : 0) - (a.kind === 'enemy' && a.ai?.state !== 'dormant' ? 6 : 0);
      if (d < rad && score < best) { best = score; this.hover = a.id; }
    }
    if (this.hover) return;
    best = 46;
    for (const it of s.zone.inter) {
      if (it.state < 0 || it.type === 'trap' || ((it.type === 'chest' || it.type === 'shrine' || it.type === 'lever' || it.type === 'cage') && it.state >= 1)) continue;
      const p0 = r.project(it.x, it.y, 0.9);
      const d = Math.hypot(p0.x - mx, p0.y - my);
      if (p0.ok && d < best) { best = d; this.hoverInter = it.id; }
    }
  }
  // ─────────────── frame ───────────────
  private frame = (now: number): void => {
    this.raf = requestAnimationFrame(this.frame);
    const s = this.session, r = this.renderer, dyn = this.dynamic;
    if (!s || !r || !dyn) return;
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    const u = ui.get();
    if (!u.paused) {
      this.acc += dt;
      let n = 0;
      while (this.acc >= DT && n++ < 4) { s.tick(); this.consume(s); this.acc -= DT; }
      if (n >= 4) this.acc = 0;
      // Held buttons keep pathing / attacking the current target.
      this.repeat -= dt;
      if (this.repeat <= 0 && !s.player.dead) { this.repeat = 0.11; if (this.mouse.left && this.mouse.inside) this.click(false); else if (this.mouse.right && this.mouse.inside) this.cast(0); }
    }
    const alpha = u.paused ? 1 : this.acc / DT, p = s.player;
    const px = lerp(p.px, p.x, alpha), py = lerp(p.py, p.y, alpha);
    const boss = s.zone.actors.find((a) => a.boss && !a.dead && a.bs?.started);
    r.updateCamera(px, py, (p.x - p.px) / DT, (p.y - p.py) / DT, dt, boss ? { x: boss.x, y: boss.y } : undefined, boss ? 16 : 13);
    dyn.update(s, alpha, u.paused ? 0 : dt, this.frameEvents);
    this.frameEvents.length = 0;
    r.updateLights(dt, dyn.lights(s));
    r.render();
    this.updateHover();
    this.overlay!.update(r, s, this.hover, u.settings.labels || this.labelsHeld, this.hoverInter);
    r.canvas.style.cursor = this.hover ? 'crosshair' : this.hoverInter ? 'pointer' : 'default';
    this.audio.setMood(boss ? 'boss' : s.zone.kind === 'town' ? 'town' : s.zone.kind === 'crypt' ? 'crypt' : 'wild');
    this.audio.update(dt, !p.dead && p.hp < s.stats.hpMax * 0.3);
    this.hudT -= dt;
    if (this.hudT <= 0) { this.hudT = 0.1; this.updateHud(); this.tutorial(); }
    this.fpsN++; this.fpsT += dt;
    if (this.fpsT >= 1) { ui.set({ fps: Math.round(this.fpsN / this.fpsT) }); this.fpsN = 0; this.fpsT = 0; }
    if (s.saveRequested) { s.saveRequested = false; void this.save(); }
    if (s.dirty) { s.dirty = false; ui.set({ heroVersion: ui.get().heroVersion + 1 }); }
  };
  /** Routes typed simulation events to audio, overlay, toasts and UI state. */
  private consume(s: Session): void {
    const r = this.renderer!, ov = this.overlay!, au = this.audio, st = ui.get().settings, p = s.player;
    for (const e of s.events) {
      this.frameEvents.push(e);
      const dx = (e.x - p.x) - (e.y - p.y), d = dist(e.x, e.y, p.x, p.y);
      switch (e.type) {
        case 'hit':
          if (st.damageNumbers && (e.a ?? 0) >= 1) ov.number(r, e, e.id === p.id);
          if (!e.dot) au.play(e.id === p.id ? 'hit_player' : e.crit ? 'crit' : 'hit', dx, d);
          break;
        case 'death': au.play(e.s === 'brazier' ? 'door' : 'death', dx, d); break;
        case 'sfx': au.play(e.s!, dx, d, e.a); break;
        case 'block': au.play('block', dx, d); if (e.text) ov.text(r, e.x, e.y, e.text, 'info'); else ov.text(r, e.x, e.y, 'Blocked', 'good'); break;
        case 'evade': if (e.b === undefined) ov.text(r, e.x, e.y, 'Evaded', 'good'); break;
        case 'heal': if ((e.a ?? 0) > 2) ov.text(r, e.x, e.y, '+' + Math.round(e.a!), 'heal'); break;
        case 'toast': if (e.id) ov.text(r, e.x, e.y, e.text!, 'info'); else pushToast(e.text!, e.s ?? 'info'); break;
        case 'pickup': au.play(e.s === 'gold' ? 'gold' : e.s === 'item' ? 'equip' : 'pickup'); if (e.s === 'gold') ov.text(r, e.x, e.y, `+${e.a} gold`, 'gold'); else if (e.s === 'dust') ov.text(r, e.x, e.y, `+${e.a} dust`, 'info'); else if (e.text) ov.text(r, e.x, e.y, e.text, 'info'); break;
        case 'drop': if ((e.a ?? 0) >= 1 && e.s === 'gear') au.play('loot' + e.a, dx, d); break;
        case 'levelup': au.play('levelup'); ui.set({ banner: { text: `Level ${e.a}`, sub: 'Skill point gained' + ((e.a ?? 0) % 2 === 0 ? ' · Attribute point gained' : ''), id: this.bannerId++ } }); break;
        case 'quest': au.play('quest'); pushToast(`Quest updated: ${questText(s.hero).title} — ${questText(s.hero).text}`, 'quest'); break;
        case 'zone': this.enterZoneView(); ui.set({ dialog: null }); break;
        case 'ui': ui.set({ dialog: e.s!, panel: e.s === 'vendor' || e.s === 'stash' || e.s === 'artificer' ? 'inventory' : null }); au.play('ui'); break;
        case 'bossPhase': au.play('bossPhase'); ui.set({ banner: { text: e.text!, sub: e.s === 'start' ? 'Boss encounter' : '', id: this.bannerId++ } }); r.addShake(0.3); break;
        case 'playerDeath': au.play('playerDeath'); ui.set({ death: { cause: e.text!, respawn: ZONE_INFO[s.respawnZone()].name, echo: s.hero.echo?.gold ?? 0 }, panel: null, dialog: null }); break;
        case 'victory': au.play('victory'); ui.set({ banner: { text: e.s === 'act' ? 'The Orison Engine falls silent' : `${e.text} defeated`, sub: e.s === 'act' ? 'Act complete — Veteran difficulty unlocked' : e.s === 'hunt' ? 'Target Hunt complete' : 'The way to the Archive lies open', id: this.bannerId++ } }); if (e.s !== 'boss') setTimeout(() => { if (this.session === s) ui.set({ summary: true }); }, 4500); break;
        default: break;
      }
    }
    s.events.length = 0;
  }
  private tutorial(): void {
    const s = this.session!;
    if (this.tut >= TUTORIAL.length) { if (ui.get().hint) ui.set({ hint: null }); return; }
    const b = this.tutBase, p = s.player;
    b.t += 0.1;
    const done = [dist(p.x, p.y, b.x, b.y) > 4, s.hero.stats.damageDealt > b.dmg || (s.pc.action?.def.kind === 'basic'), s.pc.focus < s.stats.focusMax - 15 && !!s.pc.action && s.pc.action.def.kind !== 'basic', s.pc.evade < EVADE_MAX, b.t > 9][this.tut];
    if (done) { this.tut++; this.tutBase = { x: p.x, y: p.y, dmg: s.hero.stats.damageDealt, t: 0 }; if (this.tut >= TUTORIAL.length) this.setSettings({ tutorialDone: true }); }
    const hint = this.tut < TUTORIAL.length ? `${this.tut + 1}/${TUTORIAL.length} · ${TUTORIAL[this.tut]}` : null;
    if (ui.get().hint !== hint) ui.set({ hint });
  }
  skipTutorial(): void { this.tut = 99; this.setSettings({ tutorialDone: true }); ui.set({ hint: null }); }
  private updateHud(): void {
    const s = this.session!, h = s.hero, p = s.player, pc = s.pc, st = s.stats, k = ui.get().settings.keys;
    const keys = ['RMB', keyName(k.skill1), keyName(k.skill2), keyName(k.skill3), keyName(k.skill4)];
    const slots = keys.map((key, i) => {
      const ss = s.skillState(i);
      return { id: ss.def?.id ?? null, icon: ss.def?.icon ?? '', name: ss.def?.name ?? '', cd: ss.def && ss.cdMax ? Math.min(1, ss.cd / ss.cdMax) : 0, cdText: ss.cd > 0.05 ? ss.cd.toFixed(ss.cd < 3 ? 1 : 0) : '', charges: ss.def?.charges ? ss.charges : -1, ok: ss.ok, key, dtype: ss.def?.dtype ?? 'physical' };
    });
    const basic = basicOf(h.cls);
    slots.unshift({ id: basic.id, icon: basic.icon, name: basic.name, cd: 0, cdText: '', charges: -1, ok: true, key: 'LMB', dtype: 'physical' });
    const boss = s.zone.actors.find((a) => a.boss && !a.dead && a.bs?.started);
    const t = this.hover ? s.actor(this.hover) : undefined;
    const guard = p.statuses.find((x) => x.id === 'guard');
    const hud: HudState = {
      hp: p.hp, hpMax: st.hpMax, focus: pc.focus, focusMax: st.focusMax, res: h.cls === 'cinder' ? pc.heat / 100 : Math.min(1, pc.moved / SKILL.quickshot.p.moveReq), resLabel: CLASSES[h.cls].resource,
      xp: h.level >= 20 ? 1 : h.xp / Math.max(1, (60 + 42 * h.level + 13 * h.level * h.level)), level: h.level, gold: h.gold, belt: [...h.belt], beltCap: h.beltCap, potionCd: pc.potionCd.map((c) => Math.max(0, c)),
      slots, evade: pc.evade, buffs: p.statuses.filter((x) => STATUS_LABEL[x.id]).map((x) => ({ id: x.id as string, label: STATUS_LABEL[x.id][0], t: x.t, good: STATUS_LABEL[x.id][1] })).concat(h.blessing > 0 ? [{ id: 'blessing', label: "Echo's Blessing", t: h.blessing, good: true }] : []),
      quest: questText(h), zone: s.zone.name, safe: s.zone.safe, points: h.skillPoints + h.attrPoints, gate: pc.gate >= 0 ? pc.gate / GATE_TIME : -1, dps: s.dpsNow, guard: guard ? guard.power / st.hpMax : 0,
      boss: boss ? { name: boss.name, hp: boss.hp / boss.maxHp, armor: boss.bs!.maxArmor ? boss.bs!.armor / boss.bs!.maxArmor : -1, stagger: boss.bs!.stagger / 100, cast: boss.bs!.cast > 0 ? 1 - boss.bs!.cast / boss.bs!.castMax : -1, castNeed: boss.bs!.cast > 0 ? Math.min(1, boss.bs!.castDmg / boss.bs!.castNeed) : 0, phase: boss.bs!.phase, enrage: boss.bs!.enrage, staggered: boss.bs!.staggered > 0 || boss.bs!.armorBroken > 0 } : null,
      target: t && !t.dead && t.kind !== 'prop' ? { name: t.name, hp: t.hp / t.maxHp, lvl: t.lvl, mods: t.mods.map((m) => `${MOD[m].name}: ${MOD[m].desc}`), desc: ENEMY[t.def]?.desc ?? '' } : null,
    };
    ui.set({ hud });
  }
  /** Debug/automation handle used by the screenshot script; not exposed in any UI. */
  debug() { return { session: this.session, renderer: this.renderer, ui }; }
}
export const game = new Game();
