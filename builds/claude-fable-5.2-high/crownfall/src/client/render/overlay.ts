// client-renderer: screen-space overlay — health bars, shields, crowd-control labels, floating
// combat text. One 2D canvas, redrawn per frame; no DOM nodes per unit.

import { ST } from '../../shared/protocol';

export interface BarInfo {
  id: number;
  sx: number;
  sy: number;
  kind: string;
  rel: 'self' | 'ally' | 'enemy' | 'neutral';
  hp: number;
  mhp: number;
  sh: number;
  mp: number;
  mmp: number;
  lvl: number;
  st: number;
  name: string;
  big: boolean;
  energy: boolean;
  dead: boolean;
}

interface FloatText {
  key: string;
  x: number;
  y: number;
  h: number;
  text: string;
  amount: number;
  color: string;
  size: number;
  age: number;
  life: number;
  drift: number;
}

export class Overlay {
  private ctx: CanvasRenderingContext2D;
  private w = 1;
  private h = 1;
  private dpr = 1;
  private texts: FloatText[] = [];
  colors = { self: '#58e07c', ally: '#4aa8ff', enemy: '#ff5f4a', neutral: '#e8b64c' };

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  }

  resize(w: number, h: number, dpr: number): void {
    this.w = w;
    this.h = h;
    this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
  }

  begin(): void {
    const c = this.ctx;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.clearRect(0, 0, this.w, this.h);
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
  }

  bar(b: BarInfo): void {
    if (b.sx < -80 || b.sx > this.w + 80 || b.sy < -40 || b.sy > this.h + 60) return;
    const c = this.ctx;
    const struct = b.kind === 'tower' || b.kind === 'seal' || b.kind === 'core' || b.kind === 'engine';
    if (b.dead) return;
    if (b.kind === 'ward') {
      for (let i = 0; i < b.mhp; i++) {
        c.fillStyle = i < b.hp ? '#ffe9a0' : 'rgba(0,0,0,0.5)';
        c.fillRect(b.sx - 11 + i * 8, b.sy, 6, 4);
      }
      return;
    }
    const hero = b.kind === 'hero' || b.kind === 'decoy';
    const wBar = hero ? 86 : struct ? (b.kind === 'engine' ? 130 : 100) : b.big ? 120 : b.kind === 'monster' ? 48 : 34;
    const hBar = hero ? 9 : struct ? 9 : b.big ? 9 : b.kind === 'monster' ? 5 : 4;
    const x = Math.round(b.sx - wBar / 2);
    const y = Math.round(b.sy - hBar);
    const invuln = (b.st & ST.INVULN) !== 0;
    c.fillStyle = struct ? 'rgba(12,14,30,0.92)' : 'rgba(8,10,22,0.82)';
    c.fillRect(x - 1.5, y - 1.5, wBar + 3, hBar + 3 + (hero && b.mmp > 0 ? 4 : 0));
    const total = Math.max(b.mhp, b.hp + b.sh);
    const hpW = (wBar * b.hp) / total;
    c.fillStyle = invuln ? '#8a90a8' : this.colors[b.rel];
    c.fillRect(x, y, hpW, hBar);
    // subtle top highlight for depth
    c.fillStyle = 'rgba(255,255,255,0.22)';
    c.fillRect(x, y, hpW, Math.max(1, hBar * 0.3));
    if (b.sh > 0) {
      // shields are a distinct layered cyan segment
      const shW = (wBar * b.sh) / total;
      c.fillStyle = '#d6f6ff';
      c.fillRect(x + hpW, y, shW, hBar);
      c.fillStyle = 'rgba(80,200,255,0.55)';
      for (let sxp = x + hpW; sxp < x + hpW + shW; sxp += 4) c.fillRect(sxp, y, 2, hBar);
    }
    if (hero || struct || b.big) {
      // segment ticks at readable thresholds
      const seg = struct || b.big ? 500 : 100;
      c.fillStyle = 'rgba(0,0,0,0.5)';
      for (let v = seg; v < total; v += seg) {
        const tx = x + (wBar * v) / total;
        const major = v % (seg * 5) === 0;
        c.fillRect(Math.round(tx), y, major ? 2 : 1, major ? hBar : hBar * 0.55);
      }
    }
    if (struct) {
      c.strokeStyle = invuln ? 'rgba(200,210,235,0.9)' : 'rgba(255,255,255,0.85)';
      c.lineWidth = 1;
      c.strokeRect(x - 1, y - 1, wBar + 2, hBar + 2);
      if (invuln) {
        c.font = '600 10px "Segoe UI", sans-serif';
        c.fillStyle = '#cfd6ee';
        c.fillText('PROTECTED', b.sx, y - 5);
      }
    }
    if (hero) {
      if (b.mmp > 0) {
        c.fillStyle = b.energy ? '#f4d35e' : '#5aa2ff';
        c.fillRect(x, y + hBar + 1, (wBar * b.mp) / b.mmp, 3);
      }
      // level badge
      c.fillStyle = 'rgba(8,10,22,0.92)';
      c.beginPath();
      c.arc(x - 9, y + hBar / 2 + 1, 9, 0, 6.3);
      c.fill();
      c.strokeStyle = this.colors[b.rel];
      c.lineWidth = 1.5;
      c.stroke();
      c.font = '700 11px "Segoe UI", sans-serif';
      c.fillStyle = '#fff';
      c.fillText(String(b.lvl), x - 9, y + hBar / 2 + 5);
      c.font = '600 11px "Segoe UI", sans-serif';
      c.lineWidth = 3;
      c.strokeStyle = 'rgba(0,0,0,0.75)';
      c.strokeText(b.name, b.sx, y - 5);
      c.fillStyle = b.rel === 'enemy' ? '#ffd0c8' : b.rel === 'self' ? '#d9ffe2' : '#d6ebff';
      c.fillText(b.name, b.sx, y - 5);
    } else if (b.big) {
      c.font = '700 12px "Segoe UI", sans-serif';
      c.lineWidth = 3;
      c.strokeStyle = 'rgba(0,0,0,0.75)';
      c.strokeText(b.name, b.sx, y - 5);
      c.fillStyle = '#ffe6a8';
      c.fillText(b.name, b.sx, y - 5);
    }
    // key crowd control, always spelled out
    let cc = '';
    if (b.st & ST.STUN) cc = 'STUNNED';
    else if (b.st & ST.AIRBORNE) cc = 'AIRBORNE';
    else if (b.st & ST.ROOT) cc = 'ROOTED';
    else if (b.st & ST.SILENCE) cc = 'SILENCED';
    else if (b.st & ST.MARKED) cc = 'MARKED';
    else if (b.st & ST.SLOW && hero) cc = 'SLOWED';
    if (cc) {
      const yy = y - (hero || b.big ? 19 : 6);
      c.font = '800 11px "Segoe UI", sans-serif';
      const tw = c.measureText(cc).width + 10;
      c.fillStyle = cc === 'SLOWED' ? 'rgba(40,70,120,0.9)' : 'rgba(120,30,20,0.92)';
      c.fillRect(b.sx - tw / 2, yy - 11, tw, 14);
      c.fillStyle = '#fff3c4';
      c.fillText(cc, b.sx, yy);
    }
    if (b.st & ST.PARCEL) {
      c.font = '700 13px "Segoe UI", sans-serif';
      c.fillStyle = '#ffb347';
      c.fillText('◆', b.sx + wBar / 2 + 9, y + hBar);
    }
    if (b.st & ST.GLINT) {
      c.font = '700 14px "Segoe UI", sans-serif';
      c.fillStyle = '#e8fbff';
      c.fillText('✦', b.sx - wBar / 2 - 24, y + hBar);
    }
  }

  /** World-anchored floating text; amounts with the same key merge instead of spamming. */
  float(key: string, x: number, y: number, h: number, amount: number, text: string, color: string, size: number): void {
    if (key) {
      const ex = this.texts.find((t) => t.key === key && t.age < 0.35);
      if (ex) {
        ex.amount += amount;
        ex.text = text.replace('%', String(Math.round(ex.amount)));
        ex.age = Math.min(ex.age, 0.08);
        ex.size = Math.min(26, Math.max(ex.size, size) + 1);
        ex.x = x;
        ex.y = y;
        return;
      }
    }
    if (this.texts.length > 70) this.texts.shift();
    this.texts.push({ key, x, y, h, amount, text: text.replace('%', String(Math.round(amount))), color, size, age: 0, life: 0.95, drift: (Math.random() - 0.5) * 22 });
  }

  drawTexts(dt: number, project: (x: number, y: number, h: number) => { sx: number; sy: number } | null): void {
    const c = this.ctx;
    for (const t of this.texts) {
      t.age += dt;
      const p = project(t.x, t.y, t.h);
      if (!p) continue;
      const f = t.age / t.life;
      const pop = t.age < 0.1 ? 1 + (0.1 - t.age) * 4 : 1;
      c.globalAlpha = f < 0.7 ? 1 : Math.max(0, 1 - (f - 0.7) / 0.3);
      c.font = `800 ${Math.round(t.size * pop)}px "Segoe UI", sans-serif`;
      const sx = p.sx + t.drift * f;
      const sy = p.sy - 34 * f - 6;
      c.lineWidth = 3.5;
      c.strokeStyle = 'rgba(0,0,0,0.8)';
      c.strokeText(t.text, sx, sy);
      c.fillStyle = t.color;
      c.fillText(t.text, sx, sy);
    }
    c.globalAlpha = 1;
    if (this.texts.length && this.texts[0].age >= this.texts[0].life) this.texts = this.texts.filter((t) => t.age < t.life);
  }

  /** Warning line from a tower to the hero it is locked onto. */
  line(x1: number, y1: number, x2: number, y2: number, color: string, width: number): void {
    const c = this.ctx;
    c.strokeStyle = color;
    c.lineWidth = width;
    c.setLineDash([10, 6]);
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.stroke();
    c.setLineDash([]);
  }
}
