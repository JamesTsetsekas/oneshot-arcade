// client-runtime: input. Turns keyboard/mouse into *intent* commands (move here, cast slot at
// point) and local-only feedback (aim indicators, click markers, camera). It never computes
// outcomes — the simulation validates everything.

import { HEROES } from '../shared/heroes';
import { ITEMS, TALENTS } from '../shared/items';
import { getMap } from '../shared/map';
import { clamp } from '../shared/math';
import { audio } from './audio/audio';
import type { GameClient } from './game';
import type { Ent } from './render/renderer';
import { KeyAction, getSettings, keyName, setSettings } from './runtime/persist';
import { hud } from './runtime/store';

const DEG = Math.PI / 180;

export class Input {
  mouseX = 0;
  mouseY = 0;
  ground = { x: 0, y: 0 };
  hover: Ent | null = null;
  private keys = new Set<string>();
  private aim: { slot: number; code: string } | null = null;
  private amove = false;
  private dragPan: { x: number; y: number } | null = null;
  private rightHeld = false;
  private lastMoveCmd = 0;
  private inside = true;
  private off: (() => void)[] = [];

  constructor(
    private g: GameClient,
    private el: HTMLElement,
  ) {
    const on = <K extends keyof WindowEventMap>(t: EventTarget, type: K, fn: (e: WindowEventMap[K]) => void, opts?: AddEventListenerOptions): void => {
      t.addEventListener(type, fn as EventListener, opts);
      this.off.push(() => t.removeEventListener(type, fn as EventListener, opts));
    };
    on(window, 'keydown', (e) => this.keydown(e));
    on(window, 'keyup', (e) => this.keyup(e));
    on(window, 'mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
      this.inside = true;
      if (this.dragPan) {
        const k = this.g.renderer.camHeight / 620;
        this.g.unlockCamera();
        this.g.renderer.pan(-(e.clientX - this.dragPan.x) * k, (e.clientY - this.dragPan.y) * k);
        this.dragPan = { x: e.clientX, y: e.clientY };
      }
    });
    on(window, 'mouseup', (e) => {
      if (e.button === 1) this.dragPan = null;
      if (e.button === 2) this.rightHeld = false;
    });
    on(window, 'blur', () => {
      this.keys.clear();
      this.rightHeld = false;
      this.dragPan = null;
      this.inside = false;
      hud.set({ scoreOpen: false });
    });
    on(document, 'mouseleave' as keyof WindowEventMap, () => {
      this.inside = false;
    });
    on(el, 'mousedown' as keyof WindowEventMap, (e) => this.mousedown(e as MouseEvent));
    on(el, 'contextmenu' as keyof WindowEventMap, (e) => e.preventDefault());
    on(el, 'wheel' as keyof WindowEventMap, (e) => {
      const w = e as WheelEvent;
      if (!this.onWorld(w.target)) return; // let HUD panels (shop lists) scroll normally
      this.g.renderer.camHeight = clamp(this.g.renderer.camHeight + Math.sign(w.deltaY) * 2, 28, 42);
      w.preventDefault();
    }, { passive: false });
  }

  dispose(): void {
    for (const f of this.off) f();
  }

  private bound(code: string): KeyAction | null {
    const keys = getSettings().keys;
    for (const k of Object.keys(keys) as KeyAction[]) if (keys[k] === code) return k;
    return null;
  }

  private blocked(): boolean {
    const s = hud.get();
    return s.menuOpen || !!s.over;
  }

  private keydown(e: KeyboardEvent): void {
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    audio.unlock();
    audio.startMusic();
    const code = e.code;
    if (code === 'Tab' || code === 'F1' || code === 'Space' || code.startsWith('Arrow') || ((e.ctrlKey || e.altKey) && ['KeyQ', 'KeyE', 'KeyR', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyP', 'KeyB', 'KeyH'].includes(code))) e.preventDefault();
    this.keys.add(code);
    if (e.repeat) return;
    const s = hud.get();
    if (code === 'Escape') {
      if (this.aim || this.amove) {
        this.cancelAim();
        return;
      }
      if (s.shopOpen) {
        hud.set({ shopOpen: false });
        return;
      }
      this.g.toggleMenu();
      return;
    }
    if (this.blocked()) return;
    const act = this.bound(code);
    if (code === 'F1') {
      this.g.centerOnHero();
      return;
    }
    if (act === 'score') {
      hud.set({ scoreOpen: true });
      return;
    }
    if (act === 'shop') {
      hud.set({ shopOpen: !s.shopOpen });
      audio.play('ui');
      return;
    }
    if (act === 'lock') {
      const locked = !s.camLocked;
      hud.set({ camLocked: locked });
      setSettings({ cameraLock: locked });
      this.g.toast(locked ? 'Camera locked to hero' : 'Camera unlocked — edge scroll, arrows or middle-drag to pan');
      return;
    }
    if (!s.you) return;
    const slotOf: Partial<Record<KeyAction, number>> = { q: 0, w: 1, e: 2, r: 3, d: 4, f: 5 };
    if (act && slotOf[act] !== undefined) {
      const slot = slotOf[act] as number;
      if ((e.ctrlKey || e.shiftKey) && slot < 4) {
        this.g.send({ t: 'rank', slot });
        return;
      }
      this.beginCast(slot, code);
      return;
    }
    if (code.startsWith('Digit')) {
      const n = Number(code.slice(5));
      if (n >= 1 && n <= 6) {
        const it = s.you.inv[n - 1];
        if (it && ITEMS[it.id].active) this.g.send({ t: 'item', slot: n - 1, x: this.ground.x, y: this.ground.y });
        else if (n === 4) this.g.send({ t: 'ward', x: this.ground.x, y: this.ground.y });
      }
      return;
    }
    switch (act) {
      case 'ward':
        this.g.send({ t: 'ward', x: this.ground.x, y: this.ground.y });
        break;
      case 'recall':
        this.g.send({ t: 'recall' });
        break;
      case 'stop':
        this.g.send({ t: 'stop' });
        break;
      case 'hold':
        this.g.send({ t: 'hold' });
        break;
      case 'amove':
        this.amove = true;
        this.aim = null;
        hud.set({ amove: true, aiming: -1 });
        break;
      case 'ping':
        this.g.send({ t: 'ping', kind: e.altKey ? 'omw' : 'danger', x: this.ground.x, y: this.ground.y });
        break;
    }
  }

  private keyup(e: KeyboardEvent): void {
    this.keys.delete(e.code);
    if (this.bound(e.code) === 'score') hud.set({ scoreOpen: false });
    if (this.aim && this.aim.code === e.code && getSettings().castMode === 'indicator') this.fire();
  }

  private cancelAim(): void {
    this.aim = null;
    this.amove = false;
    hud.set({ aiming: -1, amove: false });
  }

  /** Called by HUD buttons as well as keys. */
  beginCast(slot: number, code = ''): void {
    const s = hud.get();
    const you = s.you;
    if (!you || !you.alive) return;
    this.amove = false;
    let selfCast = false;
    if (slot < 4) {
      const def = HEROES[s.heroId].abilities[slot];
      if (you.ranks[slot] === 0) {
        this.g.toast(`${def.name} is not learned yet - click + or press Shift+${def.key}`);
        audio.play('error');
        return;
      }
      selfCast = def.target === 'self' || you.recast[slot];
    } else {
      const def = TALENTS[you.talents[slot - 4]];
      if (!def) return;
      selfCast = def.target === 'self';
    }
    this.aim = { slot, code: code || 'click' };
    if (selfCast || (code && getSettings().castMode === 'quick')) {
      this.fire();
      return;
    }
    hud.set({ aiming: slot, amove: false });
  }

  private fire(): void {
    if (!this.aim) return;
    const slot = this.aim.slot;
    this.aim = null;
    hud.set({ aiming: -1 });
    this.g.send({ t: 'cast', slot, x: this.ground.x, y: this.ground.y, id: this.hover && !this.hover.v.dead ? this.hover.id : undefined });
  }

  /** True when the event landed on the 3D view rather than on a HUD panel. */
  private onWorld(target: EventTarget | null): boolean {
    return target === this.g.renderer.renderer.domElement || target === this.el;
  }

  private mousedown(e: MouseEvent): void {
    audio.unlock();
    audio.startMusic();
    if (this.blocked() || !this.onWorld(e.target)) return;
    if (e.button === 1) {
      this.dragPan = { x: e.clientX, y: e.clientY };
      e.preventDefault();
      return;
    }
    this.updateGround();
    if (e.button === 0) {
      if (this.aim) {
        this.fire();
        return;
      }
      if (this.amove) {
        this.amove = false;
        hud.set({ amove: false });
        if (this.hover && this.hover.v.t !== this.g.viewer && !this.hover.v.dead) this.g.send({ t: 'attack', id: this.hover.id });
        else this.g.send({ t: 'amove', x: this.ground.x, y: this.ground.y });
        this.g.renderer.indicators.click(this.ground.x, this.ground.y, true);
        return;
      }
      if (e.altKey) this.g.send({ t: 'ping', kind: 'omw', x: this.ground.x, y: this.ground.y });
      return;
    }
    if (e.button === 2) {
      if (this.aim || this.amove) {
        this.cancelAim();
        return;
      }
      if (e.altKey) {
        this.g.send({ t: 'ping', kind: 'danger', x: this.ground.x, y: this.ground.y });
        return;
      }
      this.rightHeld = true;
      this.rightClick();
    }
  }

  private rightClick(): void {
    const h = this.hover;
    this.lastMoveCmd = performance.now();
    if (h && h.v.t !== this.g.viewer && !h.v.dead) {
      this.g.send({ t: 'attack', id: h.id });
      this.g.renderer.indicators.click(h.x, h.y, true);
    } else {
      this.g.send({ t: 'move', x: this.ground.x, y: this.ground.y });
      this.g.renderer.indicators.click(this.ground.x, this.ground.y, false);
    }
  }

  private updateGround(): void {
    const p = this.g.renderer.screenToGround(this.mouseX, this.mouseY);
    if (p) this.ground = p;
    const overCanvas = document.elementFromPoint(this.mouseX, this.mouseY) === this.g.renderer.renderer.domElement || document.elementFromPoint(this.mouseX, this.mouseY)?.classList.contains('world-overlay');
    this.hover = overCanvas ? this.g.renderer.pick(this.mouseX, this.mouseY, (en) => en.id !== this.g.selfId && (en.v.k !== 'ward' || en.v.t !== this.g.viewer)) : null;
    this.g.renderer.hoverId = this.hover ? this.hover.id : 0;
    this.el.style.cursor = this.aim ? 'crosshair' : this.hover && this.hover.v.t !== this.g.viewer ? 'crosshair' : 'default';
  }

  /** Per-frame: camera, held-move, hover and aim indicators. */
  update(dt: number): void {
    const r = this.g.renderer;
    const s = hud.get();
    const set = getSettings();
    this.updateGround();
    const me = this.g.selfEnt();

    // camera
    const pan = 34 * dt * (r.camHeight / 34);
    let px = 0;
    let py = 0;
    if (!this.blocked()) {
      if (this.keys.has('ArrowLeft')) px -= 1;
      if (this.keys.has('ArrowRight')) px += 1;
      if (this.keys.has('ArrowUp')) py += 1;
      if (this.keys.has('ArrowDown')) py -= 1;
      if (set.edgeScroll && !s.camLocked && this.inside && !s.shopOpen && document.hasFocus()) {
        const m = 10;
        if (this.mouseX < m) px -= 1;
        else if (this.mouseX > window.innerWidth - m) px += 1;
        if (this.mouseY < m) py += 1;
        else if (this.mouseY > window.innerHeight - m) py -= 1;
      }
    }
    if (px || py) {
      this.g.unlockCamera();
      r.pan(px * pan, py * pan);
    }
    const follow = this.keys.has(set.keys.follow) && !this.blocked();
    if ((hud.get().camLocked || follow) && me) {
      // soft look-ahead toward the cursor, capped at 2 m
      let lx = this.ground.x - me.x;
      let ly = this.ground.y - me.y;
      const l = Math.hypot(lx, ly);
      const cap = follow ? 0 : Math.min(2, l * 0.12);
      if (l > 0.01) {
        lx = (lx / l) * cap;
        ly = (ly / l) * cap;
      }
      const k = 1 - Math.exp(-dt * 9);
      r.camX += (me.x + lx - r.camX) * k;
      r.camY += (me.y + ly - r.camY) * k;
    }

    // holding right mouse keeps the hero following the cursor
    if (this.rightHeld && !this.blocked() && performance.now() - this.lastMoveCmd > 180 && !(this.hover && this.hover.v.t !== this.g.viewer)) {
      this.lastMoveCmd = performance.now();
      this.g.send({ t: 'move', x: this.ground.x, y: this.ground.y });
    }

    // aim indicators
    const ind = r.indicators;
    ind.hideAim();
    const showRange = this.keys.has('AltLeft') || this.keys.has('AltRight') || this.amove;
    if (me && s.you) ind.showAttackRange(me.x, me.y, s.you.stats.range + 0.6, showRange);
    else ind.showAttackRange(0, 0, 1, false);
    if (!this.aim || !me || !s.you) return;
    const slot = this.aim.slot;
    const ang = Math.atan2(this.ground.y - me.y, this.ground.x - me.x);
    const d = Math.hypot(this.ground.x - me.x, this.ground.y - me.y);
    if (slot >= 4) {
      const def = TALENTS[s.you.talents[slot - 4]];
      ind.showRange(me.x, me.y, def.range);
      if (def.target === 'point') {
        const dd = Math.min(def.range, d);
        ind.showCircle(me.x + Math.cos(ang) * dd, me.y + Math.sin(ang) * dd, 0.7);
      }
      return;
    }
    const def = HEROES[s.heroId].abilities[slot];
    if (def.range > 0 && def.range < 30) ind.showRange(me.x, me.y, def.range);
    switch (def.shape) {
      case 'line': {
        if (def.id === 'ricochet_bolt') {
          // preview the single terrain bounce
          const map = getMap();
          const dx = Math.cos(ang);
          const dy = Math.sin(ang);
          const total = def.range + 4;
          const hit = map.rayDist(me.x, me.y, dx, dy, total, 0.5);
          if (hit < total - 0.2) {
            const hx = me.x + dx * hit;
            const hy = me.y + dy * hit;
            const g = map.gradient(hx, hy, true);
            const dot = dx * g.x + dy * g.y;
            const rx = dx - 2 * dot * g.x;
            const ry = dy - 2 * dot * g.y;
            ind.showLine(me.x, me.y, ang, hit, def.width ?? 1, { x: hx, y: hy, ang: Math.atan2(ry, rx), len: total - hit });
          } else ind.showLine(me.x, me.y, ang, total, def.width ?? 1);
        } else ind.showLine(me.x, me.y, ang, def.range, def.width ?? 1);
        break;
      }
      case 'rect':
        ind.showLine(me.x, me.y, ang, def.range, def.width ?? 2);
        break;
      case 'cone':
        ind.showCone(me.x, me.y, ang, def.range, ((def.arc ?? 60) / 2) * DEG);
        break;
      case 'circle': {
        const dd = def.target === 'self' ? 0 : Math.min(def.range, d);
        ind.showCircle(me.x + Math.cos(ang) * dd, me.y + Math.sin(ang) * dd, def.radius ?? 2);
        break;
      }
      case 'none':
        if (def.target === 'point') {
          const dd = Math.min(def.range, d);
          ind.showCircle(me.x + Math.cos(ang) * dd, me.y + Math.sin(ang) * dd, 0.8);
        }
        break;
    }
  }

  keyLabel(action: KeyAction): string {
    return keyName(getSettings().keys[action]);
  }
}
