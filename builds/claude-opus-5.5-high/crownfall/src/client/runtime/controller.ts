// In-match client controller: RAF loop, input -> sequenced commands, camera, presentation hooks.
import { MatchSession } from './session';
import { HudStore } from './store';
import { GameRenderer, IndicatorSpec, CAM_FWD, CAM_RIGHT } from '../render/renderer';
import { Overlay } from '../render/overlay';
import { Minimap } from '../render/minimap';
import { audio } from '../../audio/audio';
import type { Settings, Action } from '../../services/profile';
import type { GameEvent, MatchResult, MatchSetup, PingKind, Snapshot } from '../../protocol/messages';
import { K, ST } from '../../protocol/messages';
import { HEROES } from '../../shared/heroes';
import { ITEMS, TALENTS } from '../../shared/items';
import { raycastWall } from '../../sim/nav';
import type { InterpEnt } from './session';
import { FOUNTAIN } from '../../shared/map';

const SLOTS = ['Q', 'W', 'E', 'R'] as const;
export const TUTORIAL_STEPS = [
  { key: 'move', title: 'Move', text: 'Right-click the ground to move. Walk to the glowing marker outside your fountain.' },
  { key: 'rank', title: 'Learn an ability', text: 'You have a skill point. Press Ctrl+Q (or click the + above Q) to learn Ricochet Bolt.' },
  { key: 'attack', title: 'Basic attack', text: 'Walk down a lane. Right-click an enemy minion (red bar) to attack it.' },
  { key: 'cast', title: 'Cast an ability', text: 'Press Q to aim Ricochet Bolt, then release toward enemies. It bounces once off mistwood.' },
  { key: 'lasthit', title: 'Last hits', text: 'Gold comes from the final blow. Attack minions when their bar is nearly empty — get 3 last hits.' },
  { key: 'recall', title: 'Recall', text: 'Press B and stand still for 7 s to return to the fountain. Damage from heroes or towers cancels it.' },
  { key: 'shop', title: 'Shop', text: 'In the fountain press P, pick an item (try Traveler\'s Wraps) and buy it. Undo works until you leave or fight.' },
  { key: 'ward', title: 'Vision', text: 'Press 4 to place a ward from your trinket. Brush hides units; wards reveal it for 90 s.' },
  { key: 'tower', title: 'Towers', text: 'Towers shoot minions first, but punish heroes who hit their allies. Let your wave tank, then destroy the enemy Outer Tower.' },
  { key: 'objective', title: 'Neutral objective', text: 'The Gale Catalyst sits in the north river pocket (pink diamond on the minimap). Defeat it for team gold and speed.' },
  { key: 'victory', title: 'Victory', text: 'Break a lane: Inner and Guard Towers, then the Seal. Destroy both Core Towers, then the Crown Engine.' },
];

export class MatchController {
  session: MatchSession;
  store = new HudStore();
  renderer: GameRenderer;
  overlay: Overlay;
  minimap: Minimap;
  mapBig: Minimap;
  private raf = 0;
  private last = performance.now();
  private mouse = { x: 0, y: 0, inside: false };
  private centeredOnce = false;
  private keys = new Set<string>();
  private targeting: { kind: 'ability' | 'attackMove' | 'talent' | 'item' | 'ward'; slot: number; quickRelease?: string } | null = null;
  private hoverId = 0;
  private dragging: { x: number; y: number } | null = null;
  private follow = false;
  private camLock = false;
  private ended = false;
  private fpsAcc = { n: 0, t: 0 };
  private tutorialMarker = { x: FOUNTAIN[0].x + 10, y: 2 };
  private tutorial: Record<string, boolean> = {};
  onResult: ((r: MatchResult) => void) | null = null;
  onError: ((m: string) => void) | null = null;
  private disposers: Array<() => void> = [];
  private lastIntensityAt = 0;
  frameTimes: number[] = [];

  constructor(public setup: MatchSetup, public settings: Settings, private gameCanvas: HTMLCanvasElement, private overlayCanvas: HTMLCanvasElement, private miniCanvas: HTMLCanvasElement, private bigCanvas: HTMLCanvasElement) {
    this.renderer = new GameRenderer(gameCanvas, settings.effects);
    this.renderer.shakeOn = settings.shake;
    this.renderer.colorblind = settings.colorblind;
    this.overlay = new Overlay(overlayCanvas);
    this.overlay.damageNumbers = settings.damageNumbers;
    this.overlay.colorblind = settings.colorblind;
    this.minimap = new Minimap(miniCanvas, this.renderer.map.minimapCanvas);
    this.mapBig = new Minimap(bigCanvas, this.renderer.map.minimapCanvas);
    this.minimap.colorblind = this.mapBig.colorblind = settings.colorblind;
    this.renderer.onContextLost = () => this.onError?.('The graphics context was lost (GPU reset or driver issue). Your match is paused visually; reload to recover.');
    const human = setup.players.find((p) => p.slot === setup.humanSlot)!;
    this.renderer.myTeam = human.team;
    this.overlay.myTeam = human.team;
    this.renderer.centerOn(FOUNTAIN[human.team].x + 6, FOUNTAIN[human.team].y);
    this.session = new MatchSession(setup);
    this.session.listeners.events.push((evs) => this.onEvents(evs));
    this.session.listeners.snapshot.push((s) => this.onSnapshot(s));
    this.session.listeners.result.push((r) => { this.ended = true; audio.play(r.winner === r.humanTeam ? 'victory' : 'defeat'); setTimeout(() => this.onResult?.(r), 3200); });
    this.session.listeners.error.push((m) => this.onError?.(m));
    audio.ensure();
    audio.setVolumes(settings.master, settings.music, settings.sfx);
    audio.startMusic();
    this.store.start();
    this.bindInput();
    this.resize();
  }

  start() {
    this.session.start();
    this.loop();
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.session.close();
    this.store.stop();
    audio.stopMusic();
    for (const d of this.disposers) d();
    this.renderer.dispose();
  }

  send = (b: Parameters<MatchSession['send']>[0]) => this.session.send(b);

  // ------------------------------------------------------------------ loop
  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    const now = performance.now();
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    this.frameTimes.push(dt * 1000);
    if (this.frameTimes.length > 600) this.frameTimes.shift();
    this.fpsAcc.n++; this.fpsAcc.t += dt;
    if (this.fpsAcc.t > 0.5) { this.store.patch({ fps: Math.round(this.fpsAcc.n / this.fpsAcc.t) }); this.fpsAcc = { n: 0, t: 0 }; }
    const snap = this.session.latest;
    const { time, ents } = this.session.sample(now);
    const meId = snap?.me.heroId ?? 0;
    this.renderer.meId = meId; this.overlay.meId = meId;
    const me = ents.find((e) => e.id === meId);
    if (me) (me as any).range = snap?.me.stats.range ? snap.me.stats.range + (me.r ?? 0.5) : 2;
    // camera
    this.cameraStep(dt, me ?? null);
    if (this.session.fogDirty) { this.renderer.setFog(this.session.fog); this.session.fogDirty = false; }
    const ind = this.indicator(me ?? null, snap);
    this.renderer.frame(dt, time, ents, snap, ind, this.keys.has('AltLeft') || this.keys.has('AltRight'));
    this.overlay.scale = this.settings.uiScale / 100;
    this.overlay.draw(this.renderer, snap, now / 1000, this.hoverId);
    if (this.setup.mode === 'tutorial' && !this.tutorial.move && me) this.drawTutorialMarker();
    if (Math.floor(now / 100) !== Math.floor((now - dt * 1000) / 100)) {
      this.minimap.draw(this.renderer, snap, this.session.fog, this.overlay.pings, now / 1000);
      if (this.store.state.mapOpen) this.mapBig.draw(this.renderer, snap, this.session.fog, this.overlay.pings, now / 1000);
    }
    audio.listener = { x: this.renderer.camTarget.x, y: this.renderer.camTarget.z };
    // hush field muting of non-critical audio when inside an enemy Hush Field
    audio.hushed = !!me && ents.some((z) => z.k === K.Zone && z.sub === 'hush' && z.tm !== this.renderer.myTeam && Math.hypot(z.x - me.x, z.y - me.y) < (z.r ?? 0));
  };

  private drawTutorialMarker() {
    const g = this.overlay.ctx;
    const p = this.renderer.worldToScreen(this.tutorialMarker.x, 0, this.tutorialMarker.y);
    const t = performance.now() / 1000;
    g.strokeStyle = '#7dff8a'; g.lineWidth = 3;
    for (let i = 0; i < 2; i++) { const k = (t * 0.8 + i * 0.5) % 1; g.globalAlpha = 1 - k; g.beginPath(); g.ellipse(p.x, p.y, 10 + k * 40, (10 + k * 40) * 0.55, 0, 0, Math.PI * 2); g.stroke(); }
    g.globalAlpha = 1;
  }

  private cameraStep(dt: number, me: InterpEnt | null) {
    const r = this.renderer;
    const sp = 34 * dt * (r.height / 34);
    let dx = 0, dz = 0;
    const k = this.settings.keys;
    if (this.keys.has(k.panUp)) { dx += CAM_FWD.x; dz += CAM_FWD.z; }
    if (this.keys.has(k.panDown)) { dx -= CAM_FWD.x; dz -= CAM_FWD.z; }
    if (this.keys.has(k.panRight)) { dx += CAM_RIGHT.x; dz += CAM_RIGHT.z; }
    if (this.keys.has(k.panLeft)) { dx -= CAM_RIGHT.x; dz -= CAM_RIGHT.z; }
    if (this.settings.edgeScroll && this.mouse.inside && !this.dragging && document.hasFocus()) {
      const w = window.innerWidth, h = window.innerHeight, m = 6;
      if (this.mouse.x <= m) { dx -= CAM_RIGHT.x; dz -= CAM_RIGHT.z; }
      if (this.mouse.x >= w - m) { dx += CAM_RIGHT.x; dz += CAM_RIGHT.z; }
      if (this.mouse.y <= m) { dx += CAM_FWD.x; dz += CAM_FWD.z; }
      if (this.mouse.y >= h - m) { dx -= CAM_FWD.x; dz -= CAM_FWD.z; }
    }
    if ((dx || dz) && !this.follow && !this.camLock) r.pan(dx * sp, dz * sp);
    if (me && (this.follow || this.camLock || this.keys.has(k.centerHero))) {
      let tx = me.x, tz = me.y;
      if (this.camLock) {
        const g = r.screenToGround(this.mouse.x, this.mouse.y);
        const lx = g.x - me.x, lz = g.y - me.y, l = Math.hypot(lx, lz);
        if (l > 0.01) { const s = Math.min(2, l * 0.1); tx += (lx / l) * s; tz += (lz / l) * s; }
      }
      r.camTarget.x += (tx - r.camTarget.x) * Math.min(1, dt * 10);
      r.camTarget.z += (tz - r.camTarget.z) * Math.min(1, dt * 10);
    }
  }

  // ------------------------------------------------------------------ indicators
  private abilityInfo(slot: number) {
    const snap = this.session.latest;
    if (!snap) return null;
    const def = HEROES[snap.me.hero].abilities[slot + 1];
    return def;
  }
  private indicator(me: InterpEnt | null, snap: Snapshot | null): IndicatorSpec | null {
    if (!me || !snap || !this.targeting) return null;
    const cur = this.renderer.screenToGround(this.mouse.x, this.mouse.y);
    const t = this.targeting;
    if (t.kind === 'attackMove') return { kind: 'point', range: 0, radius: 0.8, cursor: cur };
    if (t.kind === 'ward' || t.kind === 'item') return { kind: 'point', range: 6.5, radius: 9 * 0.15 + 0.4, cursor: cur };
    if (t.kind === 'talent') {
      const td = TALENTS[snap.me.talents[t.slot].id];
      return { kind: td.targeting === 'point' ? 'point' : 'unit', range: td.range, radius: 0.6, cursor: cur };
    }
    const def = this.abilityInfo(t.slot)!;
    if (def.id === 'ricochet-bolt') {
      // bounce preview from shared nav data
      const dx = cur.x - me.x, dy = cur.y - me.y, l = Math.hypot(dx, dy) || 1;
      let ux = dx / l, uy = dy / l, px = me.x, py = me.y, left = 15;
      const pts = [{ x: px, y: py }];
      for (let b = 0; b < 2 && left > 0; b++) {
        const hit = raycastWall(px, py, px + ux * left, py + uy * left);
        if (!hit || b === 1) { pts.push({ x: px + ux * left, y: py + uy * left }); break; }
        const used = Math.hypot(hit.x - px, hit.y - py);
        left -= used; px = hit.x; py = hit.y; pts.push({ x: px, y: py });
        const dot = ux * hit.nx + uy * hit.ny; ux -= 2 * dot * hit.nx; uy -= 2 * dot * hit.ny;
      }
      return { kind: 'ricochet', range: def.range, cursor: cur, bounce: pts };
    }
    switch (def.targeting) {
      case 'direction': return { kind: 'direction', range: def.range, length: def.length ?? def.range, width: def.width ?? (def.id === 'reed-cleaver' || def.id === 'cut-the-light' ? 3 : 1), cursor: cur };
      case 'point': return { kind: 'point', range: def.range, radius: def.radius ?? (def.id === 'rampart-fold' ? 1.5 : 1), cursor: cur };
      case 'self': return { kind: 'self', range: 0, radius: def.radius ?? 2, cursor: cur };
      case 'ally-or-point': case 'unit-ally': case 'unit-enemy': case 'unit-any': return { kind: 'point', range: def.range, radius: 0.6, cursor: cur };
    }
    return null;
  }

  // ------------------------------------------------------------------ input
  private bindInput() {
    const c = this.overlayCanvas;
    const on = <K extends keyof WindowEventMap>(t: K, f: (e: WindowEventMap[K]) => void, target: Window | HTMLElement = window) => {
      target.addEventListener(t, f as any);
      this.disposers.push(() => target.removeEventListener(t, f as any));
    };
    on('resize', () => this.resize());
    on('mousemove', (e) => {
      this.mouse.x = e.clientX; this.mouse.y = e.clientY; this.mouse.inside = true;
      if (this.dragging) {
        const a = this.renderer.screenToGround(this.dragging.x, this.dragging.y), b = this.renderer.screenToGround(e.clientX, e.clientY);
        this.renderer.pan(a.x - b.x, a.y - b.y);
        this.dragging = { x: e.clientX, y: e.clientY };
      }
      if (this.store.state.pingWheel) return;
      const h = this.renderer.pick(e.clientX, e.clientY, (x) => x.id !== this.renderer.meId && x.k !== K.Fountain);
      this.hoverId = h?.id ?? 0;
      c.style.cursor = h && h.tm !== this.renderer.myTeam ? 'crosshair' : this.targeting ? 'cell' : 'default';
    });
    on('mouseout', (e) => { if (!(e as MouseEvent).relatedTarget) this.mouse.inside = false; });
    c.addEventListener('contextmenu', (e) => e.preventDefault());
    c.addEventListener('wheel', (e) => { e.preventDefault(); this.renderer.zoom(Math.sign(e.deltaY) * 1.6); }, { passive: false });
    c.addEventListener('mousedown', (e) => this.onMouseDown(e));
    on('mouseup', (e) => { if (e.button === 1) this.dragging = null; });
    on('keydown', (e) => this.onKey(e, true));
    on('keyup', (e) => this.onKey(e, false));
    on('blur', () => { this.keys.clear(); this.store.set({ scoreOpen: false }); });
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    this.renderer.setSize(w, h);
    this.overlay.setSize(w, h, dpr);
  }

  private groundAt() { return this.renderer.screenToGround(this.mouse.x, this.mouse.y); }

  private onMouseDown(e: MouseEvent) {
    audio.ensure();
    if (this.store.state.pingWheel) return;
    if (e.button === 1) { this.dragging = { x: e.clientX, y: e.clientY }; e.preventDefault(); return; }
    const snap = this.session.latest;
    if (!snap) return;
    if (e.button === 0 && e.altKey) { const g = this.groundAt(); this.store.set({ pingWheel: { x: e.clientX, y: e.clientY, wx: g.x, wy: g.y } }); return; }
    if (e.button === 2) {
      if (this.targeting && this.targeting.kind !== 'attackMove') { this.cancelTargeting(); return; }
      this.cancelTargeting();
      const t = this.renderer.pick(e.clientX, e.clientY, (x) => x.tm !== this.renderer.myTeam && x.k !== K.Fountain && x.k !== K.Ward && !(x.st & ST.dead));
      if (t && !(t.st & ST.invuln && (t.k === K.Seal || t.k === K.Engine || t.k === K.Core || t.k === K.Tower))) { this.send({ t: 'attack', target: t.id }); this.renderer.transients.ring(t.x, t.y, 1.2, 0.4, 0.25, 0xff4a3a); }
      else if (t) { this.send({ t: 'attack', target: t.id }); }
      else {
        const g = this.groundAt();
        this.send({ t: 'move', x: g.x, y: g.y });
        this.renderer.transients.ring(g.x, g.y, 0.9, 0.2, 0.3, 0x7dff8a);
      }
      return;
    }
    if (e.button === 0 && this.targeting) { this.executeTargeting(); return; }
  }

  private cancelTargeting() { this.targeting = null; this.store.set({ targeting: null }); }

  private executeTargeting() {
    const t = this.targeting;
    if (!t) return;
    const g = this.groundAt();
    const snap = this.session.latest!;
    const hover = this.renderer.pick(this.mouse.x, this.mouse.y, (x) => x.k !== K.Fountain && x.k !== K.Proj && x.k !== K.Zone);
    switch (t.kind) {
      case 'attackMove': this.send({ t: 'move', x: g.x, y: g.y, attackMove: true }); this.renderer.transients.ring(g.x, g.y, 1.1, 0.2, 0.3, 0xff7a3d); break;
      case 'ward': this.send({ t: 'ward', x: g.x, y: g.y }); break;
      case 'item': this.send({ t: 'item', slot: t.slot, x: g.x, y: g.y }); break;
      case 'talent': {
        const td = TALENTS[snap.me.talents[t.slot].id];
        if (td.targeting === 'unit-enemy') { if (!hover || hover.tm === this.renderer.myTeam) { this.reject('Needs a target under the cursor'); return; } this.send({ t: 'talent', slot: t.slot, target: hover.id }); }
        else this.send({ t: 'talent', slot: t.slot, x: g.x, y: g.y });
        break;
      }
      case 'ability': this.castAbility(t.slot, g, hover); break;
    }
    this.cancelTargeting();
  }

  private castAbility(slot: number, g: { x: number; y: number }, hover: InterpEnt | null) {
    const def = this.abilityInfo(slot)!;
    const my = this.renderer.myTeam;
    if (def.targeting === 'unit-enemy') {
      if (!hover || hover.tm === my || hover.k === K.Ward) { this.reject('Needs an enemy under the cursor'); return; }
      this.send({ t: 'cast', slot, target: hover.id, x: hover.x, y: hover.y });
    } else if (def.targeting === 'unit-ally') {
      const tgt = hover && hover.tm === my && hover.k === K.Hero ? hover.id : this.session.latest!.me.heroId;
      this.send({ t: 'cast', slot, target: tgt });
    } else if (def.targeting === 'ally-or-point') {
      if (hover && hover.tm === my && hover.k === K.Hero && hover.id !== this.renderer.meId) this.send({ t: 'cast', slot, target: hover.id });
      else this.send({ t: 'cast', slot, x: g.x, y: g.y });
    } else this.send({ t: 'cast', slot, x: g.x, y: g.y });
  }

  private reject(text: string) {
    this.store.set({ reject: { text, until: performance.now() / 1000 + 1.6 } });
    audio.play('error');
  }

  private actionFor(code: string): Action[] {
    const out: Action[] = [];
    for (const [a, k] of Object.entries(this.settings.keys)) if (k === code) out.push(a as Action);
    return out;
  }

  private onKey(e: KeyboardEvent, down: boolean) {
    const st = this.store.state;
    if (st.chatOpen) return; // chat input owns the keyboard
    if (document.querySelector('.settings-overlay')) return;
    const target = e.target as HTMLElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
    const code = e.code;
    if (down) this.keys.add(code); else this.keys.delete(code);
    if (code === 'AltLeft' || code === 'AltRight' || code === 'Tab' || code === 'F1' || code === 'Space') e.preventDefault();
    const snap = this.session.latest;
    if (!snap) return;
    if (code === 'Escape' && down) {
      if (st.pingWheel) { this.store.set({ pingWheel: null }); return; }
      if (this.targeting) { this.cancelTargeting(); return; }
      if (st.shopOpen || st.statsOpen || st.mapOpen) { this.store.set({ shopOpen: false, statsOpen: false, mapOpen: false }); return; }
      this.store.set({ menuOpen: !st.menuOpen });
      return;
    }
    if (code === 'F1' && down) { const me = this.session.latest?.ents.find((x) => x.id === snap.me.heroId); if (me) this.renderer.centerOn(me.x, me.y); return; }
    const actions = this.actionFor(code);
    if (!actions.length) return;
    if (!down) {
      for (const a of actions) {
        if (a === 'scoreboard') this.store.set({ scoreOpen: false });
        if (a === 'centerHero') this.follow = false;
        if (this.targeting?.quickRelease === code) this.executeTargeting();
      }
      return;
    }
    if (e.repeat) return;
    if (!e.ctrlKey || actions.some((x) => x.startsWith('ability'))) e.preventDefault();
    for (const a of actions) {
      switch (a) {
        case 'abilityQ': case 'abilityW': case 'abilityE': case 'abilityR': {
          const slot = ['abilityQ', 'abilityW', 'abilityE', 'abilityR'].indexOf(a);
          e.preventDefault();
          if (e.ctrlKey) { this.send({ t: 'rank', slot }); return; }
          this.pressAbility(slot, code);
          return;
        }
        case 'talentD': case 'talentF': {
          const slot = a === 'talentD' ? 0 : 1;
          const td = TALENTS[snap.me.talents[slot].id];
          if (td.targeting === 'self') { this.send({ t: 'talent', slot }); return; }
          this.targeting = { kind: 'talent', slot };
          this.executeTargeting();
          return;
        }
        case 'item1': case 'item2': case 'item3': case 'item4': case 'item5': case 'item6': {
          const slot = Number(a.slice(4)) - 1;
          const it = snap.me.items[slot];
          if (a === 'item4' && (!it || !ITEMS[it.id].active) && actions.includes('ward')) { this.wardKey(code); return; }
          if (!it || !ITEMS[it.id].active) continue;
          if (it.id === 'lantern') { this.targeting = { kind: 'item', slot, quickRelease: code }; this.store.set({ targeting: { slot: `${slot + 1}`, name: 'Lantern Ward' } }); return; }
          this.send({ t: 'item', slot });
          return;
        }
        case 'ward': this.wardKey(code); return;
        case 'attackMove': this.targeting = { kind: 'attackMove', slot: 0 }; this.store.set({ targeting: { slot: 'A', name: 'Attack-move' } }); return;
        case 'stop': this.send({ t: 'stop' }); this.cancelTargeting(); return;
        case 'hold': this.send({ t: 'hold' }); return;
        case 'recall': this.send({ t: 'recall' }); return;
        case 'shop': this.store.set({ shopOpen: !st.shopOpen }); audio.play('click'); return;
        case 'scoreboard': this.store.set({ scoreOpen: true }); return;
        case 'stats': this.store.set({ statsOpen: !st.statsOpen }); return;
        case 'map': this.store.set({ mapOpen: !st.mapOpen }); return;
        case 'ping': { const g = this.groundAt(); this.store.set({ pingWheel: { x: this.mouse.x, y: this.mouse.y, wx: g.x, wy: g.y } }); return; }
        case 'centerHero': this.follow = true; return;
        case 'cameraLock': this.camLock = !this.camLock; this.store.patch({ banner: { text: this.camLock ? 'Camera locked' : 'Camera unlocked', tone: 'neutral', until: performance.now() / 1000 + 1.2 } }); return;
        case 'chat': if (this.settings.chat) { e.preventDefault(); this.store.set({ chatOpen: true }); } return;
        default: break;
      }
    }
  }

  private wardKey(code: string) {
    this.targeting = { kind: 'ward', slot: 0, quickRelease: code };
    this.store.set({ targeting: { slot: 'W', name: 'Ward' } });
  }

  private pressAbility(slot: number, code: string) {
    const snap = this.session.latest!;
    const ab = snap.me.abilities[slot];
    const def = this.abilityInfo(slot)!;
    if (ab.rank === 0) { this.reject('Not learned — Ctrl+' + SLOTS[slot] + ' to rank'); return; }
    if (!ab.ready) { this.reject(ab.cd > 0 && !ab.recast ? `${def.name} on cooldown` : 'Not enough mana'); return; }
    if (ab.recast) { this.send({ t: 'cast', slot, ...this.groundAt() }); return; }
    if (def.targeting === 'self') { this.send({ t: 'cast', slot, ...this.groundAt() }); return; }
    const mode = this.settings.castMode[SLOTS[slot]];
    if (mode === 'quick') {
      this.targeting = { kind: 'ability', slot };
      this.executeTargeting();
      return;
    }
    this.targeting = { kind: 'ability', slot, quickRelease: mode === 'quickIndicator' ? code : undefined };
    this.store.set({ targeting: { slot: SLOTS[slot], name: def.name } });
  }

  ping(kind: PingKind) {
    const pw = this.store.state.pingWheel;
    if (!pw) return;
    this.send({ t: 'ping', kind, x: pw.wx, y: pw.wy });
    this.store.set({ pingWheel: null });
  }

  /** Move hero or camera from the minimap. */
  minimapClick(px: number, py: number, button: number, big = false) {
    const mm = big ? this.mapBig : this.minimap;
    const p = mm.fromMap(px, py);
    if (button === 2) this.send({ t: 'move', x: p.x, y: p.y });
    else { this.renderer.centerOn(p.x, p.y); this.follow = false; }
  }

  // ------------------------------------------------------------------ server events -> presentation
  private onSnapshot(s: Snapshot) {
    this.store.patch({ snap: s });
    if (!this.centeredOnce) { const me = s.ents.find((e) => e.id === s.me.heroId); if (me) { this.renderer.centerOn(me.x + (this.renderer.myTeam === 0 ? 6 : -6), me.y); this.centeredOnce = true; } }
    const now = performance.now() / 1000;
    if (now - this.lastIntensityAt > 1) {
      this.lastIntensityAt = now;
      const me = s.ents.find((e) => e.id === s.me.heroId);
      let level = 0;
      if (me) {
        const enemiesNear = s.ents.filter((e) => e.k === K.Hero && e.tm !== this.renderer.myTeam && Math.hypot(e.x - me.x, e.y - me.y) < 14).length;
        const alliesNear = s.ents.filter((e) => e.k === K.Hero && e.tm === this.renderer.myTeam && Math.hypot(e.x - me.x, e.y - me.y) < 14).length;
        if (enemiesNear) level = 1;
        if (enemiesNear >= 1 && alliesNear >= 1 || me.hp < me.mhp * 0.5 && enemiesNear) level = 2;
        const siege = s.structures.some((st) => (st.tier === 'core' || st.tier === 'engine' || st.tier === 'seal') && !st.invuln && st.alive);
        if (siege) level = Math.max(level, 3);
      }
      audio.intensity = level;
    }
    if (this.setup.mode === 'tutorial') this.tutorialProgress(s, []);
  }

  private onEvents(evs: GameEvent[]) {
    const r = this.renderer;
    r.handleEvents(evs);
    const now = performance.now() / 1000;
    const snap = this.session.latest!;
    this.overlay.mutedNames = new Set([...this.store.state.muted].map((slot) => snap.score.find((x) => x.slot === slot)?.name ?? ''));
    this.overlay.onEvents(evs, r, now);
    const myTeam = r.myTeam;
    const name = (slot: number) => { const row = snap.score.find((s) => s.slot === slot); return row ? `${row.name} (${HEROES[row.hero].name})` : 'Unknown'; };
    const mutedNames = new Set([...this.store.state.muted].map((slot) => snap.score.find((r) => r.slot === slot)?.name));
    for (const ev of evs) {
      if ((ev.e === 'ping' && mutedNames.has(ev.name)) || (ev.e === 'chat' && mutedNames.has(ev.from))) continue;
      switch (ev.e) {
        case 'attack': if (ev.sub === 'tower') audio.play('tower', ev); else if (ev.id === snap.me.heroId) audio.play(ev.ranged ? 'ranged' : 'melee', ev, { mine: true }); else if (Math.random() < 0.35) audio.play(ev.ranged ? 'ranged' : 'melee', ev); break;
        case 'cast': {
          const def = HEROES[ev.hero].abilities.find((a) => a.id === ev.ability);
          if (ev.slot === 'R') audio.play('ult', ev); else audio.play('cast', ev);
          if (ev.slot === 'R' && def) {
            const ent = r.entsById.get(ev.id);
            if (ent && ent.tm !== myTeam && this.settings.captions) this.store.patch({ caption: { text: `[Enemy ultimate] ${HEROES[ev.hero].name}: ${def.name} — ${def.counter ?? ''}`, until: now + 3.5 } });
          }
          break;
        }
        case 'fx': if (ev.kind === 'ult-warning' && ev.team !== myTeam) audio.play('ultWarn'); if (ev.kind === 'slam' || ev.kind === 'citybreaker') audio.play('slam', ev); if (ev.kind === 'parcel-boom') audio.play('slam', ev); break;
        case 'death': if (ev.k === K.Minion) audio.play('minionDie', ev); break;
        case 'shield': if (ev.tgt === snap.me.heroId) audio.play('shield', ev); break;
        case 'gold': audio.play('gold'); break;
        case 'level': if (ev.id === snap.me.heroId) audio.play('level'); break;
        case 'recall': if (!ev.done && ev.x > -900 && ev.id === snap.me.heroId) audio.play('recall', ev); break;
        case 'ward': audio.play('ward', ev); break;
        case 'buy': if (ev.ok) audio.play('shop'); break;
        case 'ping': audio.play('ping', undefined, { enemy: ev.kind === 'danger' || ev.kind === 'missing' }); this.store.patch({ lastPing: { kind: ev.kind, t: now } }); if (this.settings.captions) this.store.patch({ caption: { text: `[Ping] ${ev.name}: ${ev.kind === 'omw' ? 'On my way' : ev.kind}`, until: now + 2 } }); break;
        case 'kill': {
          const good = snap.score.find((s) => s.slot === ev.killerSlot)?.team === myTeam;
          const killer = ev.killerSlot >= 0 ? name(ev.killerSlot) : 'Structures/minions';
          this.store.pushFeed(`${killer} ⚔ ${name(ev.victimSlot)}${ev.first ? ' · First blood' : ''}`, ev.killerSlot < 0 ? 'neutral' : good ? 'good' : 'bad', now);
          if (ev.victimSlot === this.setup.humanSlot) { audio.play('death'); }
          else if (ev.killerSlot === this.setup.humanSlot) audio.play('kill');
          if (ev.first) this.banner('First blood', good ? 'good' : 'bad', now);
          break;
        }
        case 'deathRecap': this.store.patch({ recap: ev.recap }); break;
        case 'struct': audio.play('structure'); this.store.pushFeed(`${ev.team === myTeam ? 'Lost' : 'Destroyed'}: ${ev.key.split('-').slice(1).join(' ')}`, ev.team === myTeam ? 'bad' : 'good', now, '▣'); break;
        case 'obj': if (ev.what === 'spawn') { audio.play('objective'); } if (ev.what === 'soon' && this.settings.captions) this.store.patch({ caption: { text: `[Objective] ${ev.kind === 'colossus' ? 'Aether Colossus' : 'Twin Catalysts'} spawning in 30 seconds`, until: now + 4 } }); break;
        case 'announce': this.banner(ev.text, ev.tone, now); if (ev.caption && this.settings.captions) this.store.patch({ caption: { text: `[${ev.caption}] ${ev.text}`, until: now + 3 } }); break;
        case 'vanguard': this.banner(ev.team === myTeam ? `Vanguards march in the ${ev.lane ? 'Lower' : 'Upper'} lane` : `Enemy Vanguards in the ${ev.lane ? 'Lower' : 'Upper'} lane`, ev.team === myTeam ? 'good' : 'bad', now); break;
        case 'chat': if (this.settings.chat) this.store.patch({ chat: [...this.store.state.chat, { id: Math.random(), from: ev.from, text: ev.text, t: now }].slice(-6) }); break;
        case 'reject': this.store.patch({ reject: { text: ev.reason, until: now + 1.6 } }); audio.play('error'); break;
        case 'victory': this.banner(ev.winner === myTeam ? 'VICTORY' : 'DEFEAT', ev.winner === myTeam ? 'good' : 'bad', now, 4); break;
        default: break;
      }
    }
    if (this.setup.mode === 'tutorial') this.tutorialProgress(snap, evs);
  }

  private banner(text: string, tone: 'good' | 'bad' | 'neutral', now: number, dur = 3) {
    this.store.patch({ banner: { text, tone, until: now + dur } });
  }

  private tutorialProgress(s: Snapshot, evs: GameEvent[]) {
    const tf = this.tutorial;
    const me = s.ents.find((e) => e.id === s.me.heroId);
    if (me && Math.hypot(me.x - this.tutorialMarker.x, me.y - this.tutorialMarker.y) < 3.5) tf.move = true;
    if (s.me.abilities.some((a) => a.rank > 0)) tf.rank = true;
    for (const e of evs) {
      if (e.e === 'attack' && e.id === s.me.heroId) tf.attack = true;
      if (e.e === 'cast' && e.id === s.me.heroId) tf.cast = true;
      if (e.e === 'recall' && e.done && e.id === s.me.heroId) tf.recall = true;
      if (e.e === 'buy' && e.ok) tf.shop = true;
      if (e.e === 'ward') tf.ward = true;
      if (e.e === 'struct' && e.team !== this.renderer.myTeam) tf.tower = true;
      if (e.e === 'obj' && e.what === 'kill' && e.team === this.renderer.myTeam) tf.objective = true;
      if (e.e === 'victory') tf.victory = true;
    }
    if ((s.score.find((r) => r.slot === this.setup.humanSlot)?.cs ?? 0) >= 3) tf.lasthit = true;
    let step = 0;
    while (step < TUTORIAL_STEPS.length && tf[TUTORIAL_STEPS[step].key]) step++;
    if (step !== this.store.state.tutorialStep) this.store.patch({ tutorialStep: step });
  }

  frameStats() {
    const a = [...this.frameTimes].sort((x, y) => x - y);
    if (!a.length) return { median: 0, p99: 0 };
    return { median: 1000 / a[Math.floor(a.length / 2)], p99: 1000 / a[Math.floor(a.length * 0.99)] };
  }
}
