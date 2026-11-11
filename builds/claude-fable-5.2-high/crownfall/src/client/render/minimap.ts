// client-ui/renderer: the minimap. Rotated 45 degrees so it matches the camera orientation.

import { COLOSSUS_POS, GameMap, MAP_H, MAP_W, SURF } from '../../shared/map';
import type { HeroPublic, ObjectiveView, PingKind, UnitView } from '../../shared/protocol';

export const MINI = 236;
const S = MINI / 2 / 60;
const R2 = Math.SQRT1_2;

export function simToMini(x: number, y: number): { px: number; py: number } {
  const dx = x - MAP_W / 2;
  const dy = y - MAP_H / 2;
  return { px: MINI / 2 + (dx - dy) * R2 * S, py: MINI / 2 - (dx + dy) * R2 * S };
}
export function miniToSim(px: number, py: number): { x: number; y: number } {
  const u = (px - MINI / 2) / S;
  const v = -(py - MINI / 2) / S;
  return { x: MAP_W / 2 + (u + v) * R2, y: MAP_H / 2 + (v - u) * R2 };
}

export interface MiniPing {
  x: number;
  y: number;
  kind: PingKind;
  age: number;
}

export class Minimap {
  private bg: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  colors = { ally: '#4aa8ff', enemy: '#ff5f4a', neutral: '#e8b64c', self: '#7dff9a' };

  constructor(
    readonly canvas: HTMLCanvasElement,
    map: GameMap,
  ) {
    canvas.width = canvas.height = MINI;
    this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    this.bg = document.createElement('canvas');
    this.bg.width = this.bg.height = MINI;
    const b = this.bg.getContext('2d') as CanvasRenderingContext2D;
    const img = b.createImageData(MINI, MINI);
    for (let py = 0; py < MINI; py++) {
      for (let px = 0; px < MINI; px++) {
        const p = miniToSim(px + 0.5, py + 0.5);
        const i = (py * MINI + px) * 4;
        if (p.x < 0 || p.y < 0 || p.x > MAP_W || p.y > MAP_H) continue;
        const d = map.sdfT(p.x, p.y);
        let r = 0;
        let g = 0;
        let bl = 0;
        let a = 255;
        if (d < 0) {
          const s = map.surfAt(p.x, p.y);
          if (s === SURF.lane || s === SURF.base) [r, g, bl] = [196, 188, 160];
          else if (s === SURF.river) [r, g, bl] = [58, 140, 156];
          else if (s === SURF.pit) [r, g, bl] = [130, 84, 160];
          else [r, g, bl] = [96, 128, 84];
          if (map.brushAt(p.x, p.y) >= 0) [r, g, bl] = [60, 150, 110];
        } else if (d < 7.5) [r, g, bl] = [40, 66, 58];
        else a = 0;
        img.data[i] = r;
        img.data[i + 1] = g;
        img.data[i + 2] = bl;
        img.data[i + 3] = a;
      }
    }
    b.putImageData(img, 0, 0);
  }

  draw(units: UnitView[], heroes: HeroPublic[], objectives: ObjectiveView[], viewer: number, selfId: number, fog: HTMLCanvasElement, camQuad: { x: number; y: number }[], pings: MiniPing[], time: number): void {
    const c = this.ctx;
    c.clearRect(0, 0, MINI, MINI);
    c.drawImage(this.bg, 0, 0);
    // fog: draw the sight texture through the same rotation, as darkness where unseen
    c.save();
    c.globalCompositeOperation = 'multiply';
    c.translate(MINI / 2, MINI / 2);
    c.transform(R2 * S, -R2 * S, -R2 * S, -R2 * S, 0, 0);
    c.translate(-MAP_W / 2, -MAP_H / 2);
    c.globalAlpha = 0.62;
    c.drawImage(fog, 0, 0, MAP_W, MAP_H);
    c.restore();
    c.globalCompositeOperation = 'source-over';
    c.globalAlpha = 1;

    const rel = (t: number): string => (t === 2 ? this.colors.neutral : t === viewer ? this.colors.ally : this.colors.enemy);
    for (const u of units) {
      const p = simToMini(u.x, u.y);
      if (u.k === 'minion') {
        c.fillStyle = rel(u.t);
        c.fillRect(p.px - 1.5, p.py - 1.5, 3, 3);
      } else if (u.k === 'monster') {
        c.fillStyle = this.colors.neutral;
        c.beginPath();
        c.arc(p.px, p.py, u.r > 1.2 ? 4.5 : 2, 0, 6.3);
        c.fill();
      } else if (u.k === 'tower' || u.k === 'core' || u.k === 'seal' || u.k === 'engine') {
        const sz = u.k === 'engine' ? 7 : u.k === 'seal' ? 4 : 5;
        c.fillStyle = u.dead ? '#3a3f55' : rel(u.t);
        c.strokeStyle = '#0a0d1e';
        c.lineWidth = 1.5;
        if (u.k === 'seal') {
          c.beginPath();
          c.moveTo(p.px, p.py - sz);
          c.lineTo(p.px + sz, p.py);
          c.lineTo(p.px, p.py + sz);
          c.lineTo(p.px - sz, p.py);
          c.closePath();
          c.fill();
          c.stroke();
        } else {
          c.fillRect(p.px - sz / 2, p.py - sz / 2, sz, sz);
          c.strokeRect(p.px - sz / 2, p.py - sz / 2, sz, sz);
        }
      } else if (u.k === 'ward' && u.t === viewer) {
        c.fillStyle = '#ffe9a0';
        c.fillRect(p.px - 1.5, p.py - 3, 3, 6);
      }
    }
    for (const o of objectives) {
      if (o.alive) continue;
      const pos = o.id === 'colossus' ? COLOSSUS_POS : { x: 75, y: o.id === 'catalystN' ? 85.5 : 35.5 };
      const p = simToMini(pos.x, pos.y);
      c.font = '700 9px "Segoe UI", sans-serif';
      c.textAlign = 'center';
      c.fillStyle = 'rgba(255,230,160,0.85)';
      const m = Math.floor(o.next / 60);
      c.fillText(`${m}:${String(Math.floor(o.next % 60)).padStart(2, '0')}`, p.px, p.py + 3);
    }
    for (const h of heroes) {
      if (!h.alive) continue;
      const enemy = h.team !== viewer;
      if (enemy && !h.visible) continue;
      const p = simToMini(h.x, h.y);
      c.beginPath();
      c.arc(p.px, p.py, h.id === selfId ? 5.5 : 5, 0, 6.3);
      c.fillStyle = h.id === selfId ? this.colors.self : enemy ? this.colors.enemy : this.colors.ally;
      c.fill();
      c.lineWidth = 1.6;
      c.strokeStyle = '#fff';
      c.stroke();
      c.fillStyle = '#0a0d1e';
      c.font = '800 8px "Segoe UI", sans-serif';
      c.textAlign = 'center';
      c.fillText(h.name[0].toUpperCase(), p.px, p.py + 3);
    }
    if (camQuad.length === 4) {
      c.strokeStyle = 'rgba(255,255,255,0.85)';
      c.lineWidth = 1.2;
      c.beginPath();
      camQuad.forEach((q, i) => {
        const p = simToMini(q.x, q.y);
        if (i === 0) c.moveTo(p.px, p.py);
        else c.lineTo(p.px, p.py);
      });
      c.closePath();
      c.stroke();
    }
    for (const pg of pings) {
      const p = simToMini(pg.x, pg.y);
      const f = (pg.age * 1.6) % 1;
      c.strokeStyle = pg.kind === 'danger' ? '#ff5f4a' : pg.kind === 'omw' ? '#7dff9a' : '#ffe07a';
      c.lineWidth = 2;
      c.globalAlpha = 1 - f;
      c.beginPath();
      c.arc(p.px, p.py, 3 + f * 12, 0, 6.3);
      c.stroke();
      c.globalAlpha = 1;
      c.fillStyle = c.strokeStyle;
      c.fillRect(p.px - 2, p.py - 2, 4, 4);
    }
    void time;
  }
}
