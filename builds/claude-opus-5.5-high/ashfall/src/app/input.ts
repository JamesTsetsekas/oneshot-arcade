import type { Game } from "../sim/game";
import { emptyIntents, type Intents } from "../sim/player";
import type { Renderer } from "../render/renderer";
import type { Action, Settings } from "./settings";

/** Collects keyboard/mouse state between fixed ticks and turns it into simulation intents. */
export class Input {
  mx = 0; my = 0;
  left = false; right = false; middle = false;
  leftPressed = false; rightPressed = false;
  keysDown = new Set<string>();
  pressed = new Set<Action>();
  uiActions: Action[] = [];
  enabled = true;
  onEscape: () => void = () => {};
  onUiAction: (a: Action) => void = () => {};
  onAnyInput: () => void = () => {};
  rebindCapture: ((code: string) => void) | null = null;
  private orbitStartX = 0;
  private cursorGround: { x: number; y: number } | null = null;

  constructor(private canvas: HTMLCanvasElement, private overlay: HTMLElement, private settings: () => Settings, private renderer: () => Renderer | null) {
    const isGameTarget = (t: EventTarget | null) => t === canvas || t === overlay || (t instanceof HTMLElement && t.classList.contains("overlay3d"));
    window.addEventListener("pointermove", (e) => { const r = canvas.getBoundingClientRect(); this.mx = e.clientX - r.left; this.my = e.clientY - r.top; if (this.middle && this.settings().orbit) { const rr = this.renderer(); if (rr) { const d = (e.clientX - this.orbitStartX) * 0.004; rr.rig.yawOffset = Math.max(-0.436, Math.min(0.436, d)); } } });
    window.addEventListener("pointerdown", (e) => {
      this.onAnyInput();
      if (this.rebindCapture && (e.button === 3 || e.button === 4)) { this.rebindCapture(`Mouse${e.button}`); e.preventDefault(); return; }
      if (e.button === 3 || e.button === 4) { this.keyAction(`Mouse${e.button}`); e.preventDefault(); return; }
      if (!this.enabled || !isGameTarget(e.target)) return;
      if (e.button === 0) { this.left = true; this.leftPressed = true; }
      if (e.button === 2) { this.right = true; this.rightPressed = true; }
      if (e.button === 1) { this.middle = true; this.orbitStartX = e.clientX; e.preventDefault(); }
    });
    window.addEventListener("pointerup", (e) => {
      if (e.button === 0) this.left = false;
      if (e.button === 2) this.right = false;
      if (e.button === 1) { this.middle = false; const rr = this.renderer(); if (rr) rr.rig.yawOffset = 0; }
    });
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    overlay.addEventListener("contextmenu", (e) => e.preventDefault());
    canvas.addEventListener("wheel", (e) => { this.renderer()?.rig.wheel(e.deltaY); e.preventDefault(); }, { passive: false });
    window.addEventListener("keydown", (e) => {
      this.onAnyInput();
      if (this.rebindCapture) { e.preventDefault(); if (e.code !== "Escape") this.rebindCapture(e.code); else this.rebindCapture(""); return; }
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code === "Escape") { this.onEscape(); e.preventDefault(); return; }
      if (e.code === "Tab" || e.code.startsWith("Alt") || e.code === "Space" || e.code.startsWith("Control")) e.preventDefault();
      if (e.repeat) { this.keysDown.add(e.code); return; }
      this.keysDown.add(e.code);
      this.keyAction(e.code);
    });
    window.addEventListener("keyup", (e) => { this.keysDown.delete(e.code); });
    window.addEventListener("blur", () => { this.keysDown.clear(); this.left = this.right = this.middle = false; });
  }

  private keyAction(code: string) {
    const keys = this.settings().keys;
    for (const [a, c] of Object.entries(keys) as [Action, string][]) {
      if (c !== code) continue;
      if (["inventory", "skills", "character", "quests", "map", "automap"].includes(a)) this.onUiAction(a);
      else if (this.enabled) this.pressed.add(a);
    }
  }

  held(a: Action) { return this.keysDown.has(this.settings().keys[a]); }

  /** Build the intents for one simulation tick. */
  consume(game: Game, r: Renderer): Intents {
    const i = emptyIntents();
    const ground = r.pickGround(this.mx, this.my);
    this.cursorGround = ground;
    if (ground) { i.cursorX = ground.x; i.cursorY = ground.y; } else { i.cursorX = game.player.x; i.cursorY = game.player.y; }
    i.hoverEnemy = r.pickEnemy(this.mx, this.my, game);
    i.hoverInteract = i.hoverEnemy === null ? r.pickInteract(ground, game) : null;
    r.hoverEnemy = i.hoverEnemy;
    r.hoverInteract = i.hoverInteract;
    if (this.enabled) {
      i.primaryDown = this.left; i.primaryPressed = this.leftPressed;
      i.secondaryDown = this.right; i.secondaryPressed = this.rightPressed;
      i.standStill = this.held("standStill");
      const p = this.pressed;
      for (let k = 1; k <= 4; k++) if (p.has(`skill${k}` as Action)) i.skillPressed = k;
      for (let k = 1; k <= 4; k++) if (p.has(`potion${k}` as Action)) i.potion = k - 1;
      i.evade = p.has("evade");
      i.interact = p.has("interact");
      i.townGate = p.has("townGate");
    }
    this.leftPressed = false; this.rightPressed = false;
    this.pressed.clear();
    r.overlay.altHeld = this.held("showLabels");
    return i;
  }

  hoverIdle(game: Game, r: Renderer) {
    // keep hover feedback alive while the sim is paused
    const ground = r.pickGround(this.mx, this.my);
    r.hoverEnemy = r.pickEnemy(this.mx, this.my, game);
    r.hoverInteract = r.hoverEnemy === null ? r.pickInteract(ground, game) : null;
  }
}
