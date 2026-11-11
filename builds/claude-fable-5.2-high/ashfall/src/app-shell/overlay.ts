import { DTYPE_COLOR, type Actor, type Ev } from '../entity-combat/types';
import type { Session } from '../game-session/session';
import { RARITY } from '../items/content';
import { itemName } from '../items/generate';
import type { Renderer } from '../renderer-vfx/renderer';
import { MODELS } from '../renderer-vfx/models';
import { keyName, ui } from '../ui/store';

/** World-anchored DOM layer: damage numbers, health bars, ground labels and interaction prompts. Imperative for speed. */
export class Overlay {
  root: HTMLDivElement; bars = new Map<number, HTMLDivElement>(); labels = new Map<number, HTMLDivElement>(); prompts = new Map<number, HTMLDivElement>();
  onPickup: (id: number) => void = () => {}; onInteract: (id: number) => void = () => {};
  constructor(parent: HTMLElement) {
    this.root = document.createElement('div'); this.root.className = 'overlay';
    parent.appendChild(this.root);
  }
  clear(): void { this.root.innerHTML = ''; this.bars.clear(); this.labels.clear(); this.prompts.clear(); }
  number(r: Renderer, e: Ev, isPlayer: boolean): void {
    const p = r.project(e.x + (Math.random() - 0.5) * 0.6, e.y, isPlayer ? 2.2 : 1.8 + Math.random() * 0.5);
    if (!p.ok) return;
    const d = document.createElement('div');
    d.className = `dmg${e.crit ? ' crit' : ''}${isPlayer ? ' taken' : ''}${e.dot ? ' dot' : ''}`;
    d.textContent = (e.crit ? '✦' : '') + Math.max(1, Math.round(e.a ?? 0));
    d.style.left = p.x + 'px'; d.style.top = p.y + 'px';
    if (!isPlayer) d.style.color = DTYPE_COLOR[e.dtype ?? 'physical'];
    this.root.appendChild(d);
    setTimeout(() => d.remove(), 900);
  }
  text(r: Renderer, x: number, y: number, text: string, cls: string): void {
    const p = r.project(x, y, 2.6);
    if (!p.ok) return;
    const d = document.createElement('div');
    d.className = 'dmg float ' + cls; d.textContent = text; d.style.left = p.x + 'px'; d.style.top = p.y + 'px';
    this.root.appendChild(d);
    setTimeout(() => d.remove(), 1300);
  }
  update(r: Renderer, s: Session, hover: number, showLabels: boolean, hoverInter: number): void {
    const z = s.zone, p = s.player;
    // Health bars: damaged, hovered, elite or boss-adjacent enemies only.
    const seen = new Set<number>();
    for (const a of z.actors) {
      if (a.dead || a.untargetable || (a.kind !== 'enemy' && a.kind !== 'conduit' && a.kind !== 'ward' && a.kind !== 'dummy') || a.boss) continue;
      if (!(a.hp < a.maxHp || a.id === hover || a.elite) || a.kind === 'dummy') continue;
      const pos = r.project(a.x, a.y, (MODELS[a.def]?.height ?? 1.6) * (a.elite ? 1.2 : 1) + 0.35);
      if (!pos.ok) continue;
      seen.add(a.id);
      let b = this.bars.get(a.id);
      if (!b) { b = document.createElement('div'); b.className = 'ebar' + (a.elite ? ' elite' : ''); b.innerHTML = `<div class="ename"></div><div class="etrack"><div class="efill"></div></div>`; this.root.appendChild(b); this.bars.set(a.id, b); }
      b.style.transform = `translate(${pos.x}px,${pos.y}px) translate(-50%,-100%)`;
      (b.lastElementChild!.firstElementChild as HTMLElement).style.width = Math.max(0, (a.hp / a.maxHp) * 100) + '%';
      const nm = b.firstElementChild as HTMLElement;
      const show = a.elite || a.id === hover;
      const label = show ? this.statusText(a) : '';
      if (nm.textContent !== label) nm.textContent = label;
    }
    for (const [id, b] of this.bars) if (!seen.has(id)) { b.remove(); this.bars.delete(id); }
    // Ground item labels with simple vertical collision avoidance and rarity priority.
    const ls = new Set<number>();
    const rects: { x: number; y: number; w: number }[] = [];
    const items = z.pickups.filter((k) => k.kind === 'item' && k.t > 0.3).sort((a, b) => (b.item!.rarity - a.item!.rarity) || a.id - b.id);
    for (const k of items) {
      const d2 = (k.x - p.x) ** 2 + (k.y - p.y) ** 2;
      if (!showLabels && d2 > 9) continue;
      if (d2 > 26 * 26) continue;
      const pos = r.project(k.x, k.y, 0.5);
      if (!pos.ok) continue;
      ls.add(k.id);
      let el = this.labels.get(k.id);
      const it = k.item!;
      if (!el) {
        el = document.createElement('div'); el.className = `glabel r${it.rarity}`;
        el.textContent = `${it.kind === 'glyph' ? '⬥' : RARITY[it.rarity].shape} ${itemName(it)}`;
        el.onpointerdown = (ev) => { ev.stopPropagation(); ev.preventDefault(); this.onPickup(k.id); };
        this.root.appendChild(el); this.labels.set(k.id, el);
      }
      const w = el.offsetWidth || 120;
      let y = pos.y - 26;
      for (let guard = 0; guard < 12; guard++) { const hit = rects.find((q) => Math.abs(q.y - y) < 22 && Math.abs(q.x - pos.x) < (q.w + w) / 2 + 4); if (!hit) break; y = hit.y - 23; }
      rects.push({ x: pos.x, y, w });
      el.style.transform = `translate(${pos.x}px,${y}px) translate(-50%,-50%)`;
      el.style.opacity = String(Math.max(0.45, 1 - Math.sqrt(d2) / 34));
    }
    for (const [id, el] of this.labels) if (!ls.has(id)) { el.remove(); this.labels.delete(id); }
    // Interaction prompts and NPC name plates.
    const ps = new Set<number>();
    const key = keyName(ui.get().settings.keys.interact);
    for (const it of z.inter) {
      if (it.state < 0 || it.type === 'trap' || it.type === 'landmark' || (it.type === 'door' && it.state)) continue;
      const d = Math.hypot(it.x - p.x, it.y - p.y);
      const always = it.type === 'npc' || it.type === 'exit' || it.type === 'portal' || it.type === 'waypoint' || it.type === 'stash';
      const used = (it.type === 'chest' || it.type === 'shrine' || it.type === 'lever' || it.type === 'cage') && it.state >= 1;
      if (used || d > (always ? 22 : 7)) continue;
      const pos = r.project(it.x, it.y, it.type === 'npc' ? 2.5 : it.type === 'exit' || it.type === 'portal' ? 3.9 : 2.2);
      if (!pos.ok) continue;
      ps.add(it.id);
      let el = this.prompts.get(it.id);
      if (!el) { el = document.createElement('div'); el.className = 'prompt ' + it.type; el.onpointerdown = (ev) => { ev.stopPropagation(); ev.preventDefault(); this.onInteract(it.id); }; this.root.appendChild(el); this.prompts.set(it.id, el); }
      const near = d < 3.2 || it.id === hoverInter;
      const txt = (near ? `[${key}] ` : '') + it.label;
      if (el.textContent !== txt) el.textContent = txt;
      el.classList.toggle('near', near);
      el.style.transform = `translate(${pos.x}px,${pos.y}px) translate(-50%,-100%)`;
    }
    for (const [id, el] of this.prompts) if (!ps.has(id)) { el.remove(); this.prompts.delete(id); }
  }
  private statusText(a: Actor): string {
    const tr = a.statuses.find((s) => s.id === 'trace');
    return a.name + (tr ? ` ◈${tr.stacks}` : '');
  }
}
