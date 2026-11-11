import { Matrix, Vector3, type Scene, type Camera } from "@babylonjs/core";
import type { Game } from "../sim/game";
import type { GameEvent } from "../sim/types";
import { RARITY_COLOR, RARITY_MARK, itemName } from "../items/item";
import { SEMANTIC, SEMANTIC_CB } from "./kit";
import { ELITE_BY_ID } from "../data/enemies";

interface Num { el: HTMLDivElement; x: number; y: number; z: number; t: number; dur: number; vx: number; active: boolean }

export interface OverlaySettings { damageNumbers: boolean; labels: "always" | "alt" | "rare"; colorblind: boolean }

/** DOM overlay for damage numbers, ground labels, health bars and prompts (keeps text crisp at any browser zoom). */
export class Overlay {
  root: HTMLDivElement;
  nums: Num[] = [];
  labels: HTMLDivElement[] = [];
  bars: HTMLDivElement[] = [];
  names: HTMLDivElement[] = [];
  prompt: HTMLDivElement;
  altHeld = false;
  settings: OverlaySettings = { damageNumbers: true, labels: "rare", colorblind: false };
  onLabelClick: (pickupId: number) => void = () => {};
  private v = new Vector3();
  private w = 1; private h = 1;

  constructor(parent: HTMLElement) {
    this.root = document.createElement("div");
    this.root.className = "overlay3d";
    parent.appendChild(this.root);
    for (let i = 0; i < 70; i++) {
      const el = document.createElement("div");
      el.className = "dmgnum";
      el.style.display = "none";
      this.root.appendChild(el);
      this.nums.push({ el, x: 0, y: 0, z: 0, t: 0, dur: 0.8, vx: 0, active: false });
    }
    this.prompt = document.createElement("div");
    this.prompt.className = "prompt3d";
    this.root.appendChild(this.prompt);
  }

  private pool(arr: HTMLDivElement[], i: number, cls: string): HTMLDivElement {
    while (arr.length <= i) { const el = document.createElement("div"); el.className = cls; this.root.appendChild(el); arr.push(el); }
    return arr[i];
  }

  private project(x: number, y: number, z: number, scene: Scene, cam: Camera): [number, number, boolean] {
    this.v.set(x, y, z);
    const p = Vector3.Project(this.v, Matrix.IdentityReadOnly, scene.getTransformMatrix(), cam.viewport.toGlobal(this.w, this.h));
    return [p.x, p.y, p.z > 0 && p.z < 1];
  }

  onEvent(ev: GameEvent) {
    if (ev.t !== "hit" || !this.settings.damageNumbers) return;
    const n = this.nums.find((q) => !q.active);
    if (!n) return;
    const pal = this.settings.colorblind ? SEMANTIC_CB : SEMANTIC;
    n.active = true; n.t = 0; n.x = ev.x + (Math.random() - 0.5) * 0.6; n.z = ev.y + (Math.random() - 0.5) * 0.6; n.y = ev.toPlayer ? 2.2 : 2.0; n.vx = (Math.random() - 0.5) * 30;
    n.dur = ev.crit ? 1.1 : 0.85;
    let text = String(ev.amount);
    let color = ev.toPlayer ? "#ff5050" : (pal as any)[ev.type] ?? "#fff";
    let size = ev.crit ? 30 : ev.toPlayer ? 18 : 17;
    if (ev.evaded) { text = "Evaded"; color = pal.player; size = 16; }
    else if (ev.blocked && ev.amount === 0) { text = "Immune"; color = "#a0a0a0"; size = 15; }
    else if (ev.blocked) text = `${ev.amount} ⛨`;
    if (ev.crit) text = `${text}!`;
    n.el.textContent = text;
    n.el.style.color = color;
    n.el.style.fontSize = `${size}px`;
    n.el.style.display = "block";
    n.el.classList.toggle("crit", !!ev.crit);
  }

  update(game: Game, scene: Scene, cam: Camera, dt: number, alpha: number, hoverInteract: number | null) {
    const eng = scene.getEngine();
    this.w = eng.getRenderWidth(); this.h = eng.getRenderHeight();
    const cw = this.root.clientWidth || this.w, ch = this.root.clientHeight || this.h;
    const sx = cw / this.w, sy = ch / this.h;
    // damage numbers
    for (const n of this.nums) {
      if (!n.active) continue;
      n.t += dt;
      if (n.t >= n.dur) { n.active = false; n.el.style.display = "none"; continue; }
      const [x, y, vis] = this.project(n.x, n.y + n.t * 1.2, n.z, scene, cam);
      if (!vis) { n.el.style.display = "none"; continue; }
      n.el.style.display = "block";
      n.el.style.transform = `translate(${x * sx + n.vx * n.t - 20}px, ${y * sy - 10}px) scale(${n.t < 0.08 ? 1.4 : 1})`;
      n.el.style.opacity = String(Math.min(1, (n.dur - n.t) * 3));
    }
    // ground labels with rarity priority, distance fade and collision avoidance
    const p = game.player;
    const rects: [number, number, number, number][] = [];
    let li = 0;
    const items = game.pickups.filter((q) => q.kind === "item" && q.item || q.kind === "potion" || q.kind === "echo")
      .map((q) => ({ q, d: Math.hypot(q.x - p.x, q.y - p.y), pr: q.kind === "echo" ? 9 : q.item ? ["worn", "tempered", "inscribed", "relic"].indexOf(q.item.rarity) + (q.item.kind === "glyph" ? 1.5 : 0) : 0 }))
      .filter((o) => o.d < 22)
      .sort((a, b) => b.pr - a.pr || a.d - b.d);
    for (const { q, d, pr } of items) {
      const show = this.altHeld || this.settings.labels === "always" || q.kind === "echo" || pr >= 2 || (this.settings.labels === "rare" && pr >= 1 && d < 6) || -q.id === hoverInteract;
      if (!show) continue;
      const [x, y, vis] = this.project(q.x, 0.4, q.y, scene, cam);
      if (!vis) continue;
      const el = this.pool(this.labels, li++, "glabel");
      let text = "", color = "#ddd";
      if (q.kind === "echo") { text = `☽ Your Echo — ${q.amount} gold`; color = "#40ffe0"; }
      else if (q.kind === "potion") { text = `${q.potion} draught${game.ch.belt[q.potion!] >= game.ch.beltCap ? " (belt full)" : ""}`; color = "#e0a0a0"; }
      else { const it = q.item!; text = `${RARITY_MARK[it.rarity]} ${itemName(it)}`; color = it.kind === "glyph" ? "#c8a0ff" : RARITY_COLOR[it.rarity]; }
      if (el.textContent !== text) el.textContent = text;
      el.style.color = color;
      el.dataset.pid = String(q.id);
      el.onclick = (e) => { e.stopPropagation(); this.onLabelClick(q.id); };
      el.onpointerdown = (e) => e.stopPropagation();
      const wpx = Math.max(60, text.length * 7.2 + 14), hpx = 20;
      let lx = x * sx - wpx / 2, ly = y * sy - 30;
      for (let k = 0; k < 8; k++) {
        const hit = rects.find((r) => lx < r[0] + r[2] && lx + wpx > r[0] && ly < r[1] + r[3] && ly + hpx > r[1]);
        if (!hit) break;
        ly = hit[1] - hpx - 2;
      }
      rects.push([lx, ly, wpx, hpx]);
      el.style.display = "block";
      el.style.transform = `translate(${lx}px, ${ly}px)`;
      el.style.opacity = String(Math.max(0.35, Math.min(1, (22 - d) / 8)));
      el.classList.toggle("hot", -q.id === hoverInteract);
    }
    for (let i = li; i < this.labels.length; i++) this.labels[i].style.display = "none";
    // enemy health bars (damaged or elite) and elite names
    let bi = 0, ni = 0;
    for (const e of game.enemies) {
      if (!e.alive || e.isBoss || e.def.behavior === "dummy" && e.role !== "conduit") continue;
      if (Math.hypot(e.x - p.x, e.y - p.y) > 24) continue;
      const showBar = e.hp < e.maxHp || e.isElite;
      if (!showBar) continue;
      const ex = e.px + (e.x - e.px) * alpha, ez = e.py + (e.y - e.py) * alpha;
      const hgt = (e.def.id === "bell_husk" ? 3.1 : e.def.id === "archive_warden" ? 2.7 : e.radius > 0.6 ? 2.4 : 2.1) * (e.isElite ? 1.15 : 1);
      const [x, y, vis] = this.project(ex, hgt, ez, scene, cam);
      if (!vis) continue;
      const el = this.pool(this.bars, bi++, "hpbar");
      if (!el.firstChild) el.appendChild(document.createElement("i"));
      const frac = Math.max(0, e.hp / e.maxHp);
      (el.firstChild as HTMLElement).style.width = `${frac * 100}%`;
      el.classList.toggle("elite", e.isElite);
      el.classList.toggle("ward", !!e.statuses.ward);
      el.style.display = "block";
      el.style.transform = `translate(${x * sx - 22}px, ${y * sy}px)`;
      if (e.isElite) {
        const nm = this.pool(this.names, ni++, "elitename");
        const mods = e.elite.map((m) => ELITE_BY_ID[m]?.name).filter(Boolean).join(" · ");
        const t = `${e.name}${mods ? " — " + mods : ""}`;
        if (nm.textContent !== t) nm.textContent = t;
        nm.classList.remove("npc");
        nm.style.display = "block";
        nm.style.transform = `translate(${x * sx}px, ${y * sy - 16}px) translateX(-50%)`;
      }
    }
    // NPC names
    for (const it of game.interactables) {
      if (it.hidden || (it.kind !== "npc" && it.kind !== "cage") || (it.kind === "cage" && it.open)) continue;
      if (Math.hypot(it.x - p.x, it.y - p.y) > 18) continue;
      const [x, y, vis] = this.project(it.x, 2.4, it.y, scene, cam);
      if (!vis) continue;
      const nm = this.pool(this.names, ni++, "elitename");
      nm.textContent = it.kind === "cage" ? "Calder (caged)" : it.name;
      nm.classList.add("npc");
      nm.style.display = "block";
      nm.style.transform = `translate(${x * sx}px, ${y * sy}px) translateX(-50%)`;
    }
    for (let i = bi; i < this.bars.length; i++) this.bars[i].style.display = "none";
    for (let i = ni; i < this.names.length; i++) this.names[i].style.display = "none";
    // interaction prompt
    const focus = hoverInteract !== null && hoverInteract > 0 ? game.interactables.find((i) => i.id === hoverInteract) : null;
    if (focus && !focus.hidden) {
      const [x, y, vis] = this.project(focus.x, 1.8, focus.y, scene, cam);
      if (vis) {
        const sealed = focus.kind === "exit" && focus.data.requires && !game.ch.flags[focus.data.requires];
        this.prompt.textContent = `${focus.name}${sealed ? " (sealed)" : ""}  [F]`;
        this.prompt.style.display = "block";
        this.prompt.style.transform = `translate(${x * sx}px, ${y * sy - 20}px) translateX(-50%)`;
      } else this.prompt.style.display = "none";
    } else this.prompt.style.display = "none";
  }

  clear() {
    for (const n of this.nums) { n.active = false; n.el.style.display = "none"; }
  }
}
