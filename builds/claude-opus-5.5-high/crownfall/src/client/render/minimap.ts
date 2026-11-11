// Minimap (bottom-right) and expanded map (M). North-up, team fog applied, click to move camera.
import type { GameRenderer } from './renderer';
import type { Snapshot } from '../../protocol/messages';
import { K, ST } from '../../protocol/messages';
import { MAP_W, MAP_H, MAP_MIN_X, MAP_MIN_Y, FOG_W, FOG_H } from '../../shared/map';
import { teamColor } from './models';
import { PING_STYLE } from './overlay';
import { CAM_FWD } from './renderer';

const hex = (c: number) => `#${c.toString(16).padStart(6, '0')}`;

export class Minimap {
  ctx: CanvasRenderingContext2D;
  private fogCanvas = document.createElement('canvas');
  private fogCtx: CanvasRenderingContext2D;
  private fogImg: ImageData;
  colorblind = false;
  constructor(public canvas: HTMLCanvasElement, private bg: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.fogCanvas.width = FOG_W; this.fogCanvas.height = FOG_H;
    this.fogCtx = this.fogCanvas.getContext('2d')!;
    this.fogImg = this.fogCtx.createImageData(FOG_W, FOG_H);
  }
  toMap(x: number, y: number) { return { x: ((x - MAP_MIN_X) / MAP_W) * this.canvas.width, y: ((y - MAP_MIN_Y) / MAP_H) * this.canvas.height }; }
  fromMap(px: number, py: number) { return { x: MAP_MIN_X + (px / this.canvas.width) * MAP_W, y: MAP_MIN_Y + (py / this.canvas.height) * MAP_H }; }

  draw(r: GameRenderer, snap: Snapshot | null, fog: Uint8Array, pings: Array<{ x: number; y: number; kind: keyof typeof PING_STYLE; t: number }>, now: number) {
    const g = this.ctx, W = this.canvas.width, H = this.canvas.height;
    g.clearRect(0, 0, W, H);
    g.drawImage(this.bg, 0, 0, W, H);
    // fog
    const d = this.fogImg.data;
    for (let i = 0; i < fog.length; i++) { d[i * 4] = 6; d[i * 4 + 1] = 10; d[i * 4 + 2] = 26; d[i * 4 + 3] = fog[i] ? 0 : 140; }
    this.fogCtx.putImageData(this.fogImg, 0, 0);
    g.imageSmoothingEnabled = true;
    g.drawImage(this.fogCanvas, 0, 0, W, H);
    if (!snap) return;
    const sc = W / 180;
    // structures
    for (const s of snap.structures) {
      const p = this.toMap(s.x, s.y);
      const c = hex(teamColor(s.team, this.colorblind));
      g.fillStyle = s.alive ? c : 'rgba(60,60,70,0.8)';
      g.strokeStyle = '#0a0c14'; g.lineWidth = 1.5;
      const sz = (s.tier === 'engine' ? 7 : s.tier === 'seal' ? 5 : 4.5) * sc;
      if (s.tier === 'seal') { g.beginPath(); g.arc(p.x, p.y, sz * 0.6, 0, Math.PI * 2); g.fill(); g.stroke(); }
      else { g.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz); g.strokeRect(p.x - sz / 2, p.y - sz / 2, sz, sz); }
    }
    // objectives
    for (const o of snap.objectives) {
      if (!(o.kind === 'colossus' || o.kind.startsWith('catalyst'))) continue;
      const p = this.toMap(o.x, o.y);
      g.fillStyle = o.alive ? (o.kind === 'colossus' ? '#ff6ad5' : '#ffd36b') : 'rgba(120,120,140,0.6)';
      g.beginPath(); g.moveTo(p.x, p.y - 5 * sc); g.lineTo(p.x + 5 * sc, p.y); g.lineTo(p.x, p.y + 5 * sc); g.lineTo(p.x - 5 * sc, p.y); g.closePath(); g.fill();
    }
    for (const e of r.ents) {
      if (e.k === K.Minion) {
        const p = this.toMap(e.x, e.y);
        g.fillStyle = hex(teamColor(e.tm, this.colorblind));
        g.fillRect(p.x - 1.6 * sc, p.y - 1.6 * sc, 3.2 * sc, 3.2 * sc);
      } else if (e.k === K.Monster) {
        const p = this.toMap(e.x, e.y);
        g.fillStyle = '#f2d15c'; g.beginPath(); g.arc(p.x, p.y, 2.2 * sc, 0, Math.PI * 2); g.fill();
      } else if (e.k === K.Ward) {
        const p = this.toMap(e.x, e.y);
        g.fillStyle = '#ffe680'; g.beginPath(); g.arc(p.x, p.y, 2 * sc, 0, Math.PI * 2); g.fill();
        g.strokeStyle = 'rgba(255,230,128,0.25)'; g.beginPath(); g.arc(p.x, p.y, (9 / MAP_W) * W, 0, Math.PI * 2); g.stroke();
      }
    }
    for (const e of r.ents) {
      if ((e.k !== K.Hero && e.k !== K.Decoy) || (e.st & ST.dead)) continue;
      const p = this.toMap(e.x, e.y);
      const me = e.id === r.meId;
      g.fillStyle = hex(teamColor(e.tm, this.colorblind));
      g.strokeStyle = me ? '#7dff8a' : '#0a0c14'; g.lineWidth = me ? 2.5 : 1.5;
      g.beginPath(); g.arc(p.x, p.y, (me ? 5.5 : 4.5) * sc, 0, Math.PI * 2); g.fill(); g.stroke();
      g.fillStyle = '#0a0c14'; g.font = `800 ${7 * sc}px system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText((e.sub ?? '?')[0].toUpperCase(), p.x, p.y + 0.5);
      g.textBaseline = 'alphabetic';
    }
    for (const pg of pings) {
      const age = now - pg.t;
      if (age > 4) continue;
      const p = this.toMap(pg.x, pg.y);
      g.strokeStyle = PING_STYLE[pg.kind].color; g.lineWidth = 2;
      g.beginPath(); g.arc(p.x, p.y, 4 + ((age * 12) % 10) * sc, 0, Math.PI * 2); g.stroke();
    }
    // camera footprint
    const c = r.camTarget;
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => r.screenToGround(r.renderer.domElement.getBoundingClientRect().left + ((sx + 1) / 2) * r.renderer.domElement.clientWidth, r.renderer.domElement.getBoundingClientRect().top + ((sy + 1) / 2) * r.renderer.domElement.clientHeight));
    g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 1.2;
    g.beginPath();
    corners.forEach((q, i) => { const p = this.toMap(q.x, q.y); if (i) g.lineTo(p.x, p.y); else g.moveTo(p.x, p.y); });
    g.closePath(); g.stroke();
    void c; void CAM_FWD;
  }
}
