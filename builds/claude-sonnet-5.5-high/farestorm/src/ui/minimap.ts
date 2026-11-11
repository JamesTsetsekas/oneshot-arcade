import { DISTRICT_NAMES, TIER_INFO } from '../sim/data';
import type { Sim } from '../sim/sim';
import type { World } from '../sim/world';

const PX = 1.4; // offscreen pixels per metre
const OX = 30, OZ = 30; // world offset so the sea margin fits

/** Pre-rendered city map + heading-up minimap and full-screen map drawing. */
export class MiniMap {
  private base: HTMLCanvasElement;
  constructor(private world: World) {
    const w = world;
    const W = Math.ceil((w.wallX - w.bounds.minX + OX * 2) * PX), H = Math.ceil((w.quayZ - w.bounds.minZ + OZ * 2) * PX);
    this.base = document.createElement('canvas');
    this.base.width = W; this.base.height = H;
    const g = this.base.getContext('2d')!;
    const X = (x: number) => (x - w.bounds.minX + OX) * PX;
    const Z = (z: number) => (z - w.bounds.minZ + OZ) * PX;
    g.fillStyle = '#2d7fc0';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#ecdfc4';
    g.fillRect(X(w.bounds.minX - 6), Z(w.bounds.minZ - 6), (w.shallowX - w.bounds.minX + 6) * PX, (w.quayZ - w.bounds.minZ + 6) * PX);
    g.fillStyle = '#58b8d0';
    g.fillRect(X(w.shallowX), Z(w.bounds.minZ - 6), (w.wallX - w.shallowX) * PX, (w.quayZ - w.bounds.minZ + 6) * PX);
    const tint: Record<string, string> = { lantern: '#8a6fb5', steps: '#d6a47a', civic: '#a9b9c8', beach: '#e8b99c', harbor: '#9aa8ae' };
    for (const b of w.blocks) {
      const r = b.rect;
      g.fillStyle = b.kind === 'P' ? '#6fcf8c' : b.kind === 'Z' ? '#f1e6cc' : b.kind === 'S' ? '#f6e3ad' : b.kind === 'Y' ? '#9aa4ac' : tint[b.district];
      g.fillRect(X(r.minX), Z(r.minZ), (r.maxX - r.minX) * PX, (r.maxZ - r.minZ) * PX);
      for (const bd of b.buildings) {
        g.fillStyle = bd.landmark !== undefined ? '#ffffff' : 'rgba(40,40,70,0.28)';
        g.fillRect(X(bd.rect.minX), Z(bd.rect.minZ), (bd.rect.maxX - bd.rect.minX) * PX, (bd.rect.maxZ - bd.rect.minZ) * PX);
      }
    }
    g.fillStyle = '#4a5166';
    for (const e of w.edges) {
      const A = w.nodes[e.a], B = w.nodes[e.b];
      if (e.axis === 'x') g.fillRect(X(A.x - 4), Z(A.z - e.width / 2), (B.x - A.x + 8) * PX, e.width * PX);
      else g.fillRect(X(A.x - e.width / 2), Z(A.z - 4), e.width * PX, (B.z - A.z + 8) * PX);
    }
    g.fillStyle = '#ffd34d';
    for (const e of w.edges) {
      if (e.width < 17) continue;
      const A = w.nodes[e.a], B = w.nodes[e.b];
      if (e.axis === 'x') g.fillRect(X(A.x), Z(A.z) - 1, (B.x - A.x) * PX, 2);
      else g.fillRect(X(A.x) - 1, Z(A.z), 2, (B.z - A.z) * PX);
    }
  }

  private mx(x: number) { return (x - this.world.bounds.minX + OX) * PX; }
  private mz(z: number) { return (z - this.world.bounds.minZ + OZ) * PX; }

  private markers(g: CanvasRenderingContext2D, sim: Sim, scale: number, big: boolean): void {
    // discovered shortcuts
    for (const k of sim.discovered) {
      const s = this.world.shortcuts[Number(k)];
      if (!s) continue;
      g.strokeStyle = '#ff8a2b'; g.lineWidth = (big ? 3 : 2.4) / scale; g.setLineDash([4 / scale, 3 / scale]);
      g.beginPath(); g.moveTo(this.mx(s.ax), this.mz(s.az)); g.lineTo(this.mx(s.bx), this.mz(s.bz)); g.stroke();
      g.setLineDash([]);
    }
    if (big) {
      g.font = `${11 / scale}px "Trebuchet MS", sans-serif`;
      g.textAlign = 'center';
      for (const d of this.world.destinations) {
        g.fillStyle = '#15192a';
        g.beginPath(); g.arc(this.mx(d.x), this.mz(d.z), 4.5 / scale, 0, 7); g.fill();
        g.fillStyle = '#ffffff';
        g.beginPath(); g.arc(this.mx(d.x), this.mz(d.z), 3 / scale, 0, 7); g.fill();
        g.fillStyle = 'rgba(15,20,35,0.92)';
        g.fillText(d.name, this.mx(d.x), this.mz(d.z) - 7 / scale);
      }
      g.font = `800 ${15 / scale}px "Trebuchet MS", sans-serif`;
      for (const b of this.world.blocks) {
        void b;
      }
    }
    // fare candidates
    for (const f of sim.trip ? [] : sim.fares.candidates) this.glyph(g, this.mx(f.pickup.x), this.mz(f.pickup.z), TIER_INFO[f.tier].css, TIER_INFO[f.tier].shape, (big ? 9 : 7) / scale);
    if (sim.trip) {
      const d = sim.trip.fare.dest;
      this.glyph(g, this.mx(d.x), this.mz(d.z), TIER_INFO[sim.trip.fare.tier].css, 'pin', (big ? 13 : 10) / scale);
    }
  }

  private glyph(g: CanvasRenderingContext2D, x: number, y: number, col: string, shape: string, r: number): void {
    g.save();
    g.translate(x, y);
    g.fillStyle = col;
    g.strokeStyle = '#10141c';
    g.lineWidth = r * 0.28;
    g.beginPath();
    if (shape === 'circle') g.arc(0, 0, r * 0.8, 0, 7);
    else if (shape === 'diamond') { g.moveTo(0, -r); g.lineTo(r * 0.85, 0); g.lineTo(0, r); g.lineTo(-r * 0.85, 0); g.closePath(); }
    else if (shape === 'star') { for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * 0.42 : r; const a = -Math.PI / 2 + (i * Math.PI) / 5; if (i === 0) g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); else g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); }
    else { g.moveTo(0, r); g.bezierCurveTo(-r, -r * 0.1, -r * 0.8, -r, 0, -r); g.bezierCurveTo(r * 0.8, -r, r, -r * 0.1, 0, r); }
    g.stroke(); g.fill();
    g.restore();
  }

  /** heading-up circular minimap */
  draw(ctx: CanvasRenderingContext2D, size: number, sim: Sim, range = 150): void {
    const v = sim.vehicle;
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#2d7fc0';
    ctx.fillRect(0, 0, size, size);
    ctx.translate(size / 2, size / 2);
    ctx.rotate(v.h - Math.PI);
    const k = (size / 2) / range; // px per metre
    ctx.scale(k / PX, k / PX);
    ctx.translate(-this.mx(v.x), -this.mz(v.z));
    ctx.drawImage(this.base, 0, 0);
    // markers are drawn in base-pixel space: scale compensates for k/PX
    this.markers(ctx, sim, k / PX, false);
    ctx.restore();
    // player arrow
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#10141c';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(7, 8); ctx.lineTo(0, 4); ctx.lineTo(-7, 8); ctx.closePath(); ctx.stroke(); ctx.fill();
    ctx.restore();
    // guidance target ticks on the rim
    const gd = sim.guidance(false);
    if (gd) {
      const dx = gd.x - v.x, dz = gd.z - v.z;
      const a = Math.atan2(dx, dz) - v.h; // angle relative to heading (0 = ahead)
      const rr = size / 2 - 6;
      const dist = Math.hypot(dx, dz) * k;
      if (dist > rr) {
        ctx.save();
        ctx.translate(size / 2 + Math.sin(a) * rr * -1, size / 2 - Math.cos(a) * rr);
        ctx.fillStyle = gd.kind === 'dest' && sim.trip ? TIER_INFO[sim.trip.fare.tier].css : '#ffffff';
        ctx.beginPath(); ctx.arc(0, 0, 5, 0, 7); ctx.fill();
        ctx.restore();
      }
    }
  }

  /** full-screen map: whole city, north-up */
  drawBig(ctx: CanvasRenderingContext2D, w: number, h: number, sim: Sim): void {
    ctx.clearRect(0, 0, w, h);
    const bw = this.base.width, bh = this.base.height;
    const s = Math.min((w * 0.92) / bw, (h * 0.86) / bh);
    ctx.save();
    ctx.translate((w - bw * s) / 2, (h - bh * s) / 2 + h * 0.03);
    ctx.scale(s, s);
    ctx.drawImage(this.base, 0, 0);
    this.markers(ctx, sim, s, true);
    const v = sim.vehicle;
    ctx.translate(this.mx(v.x), this.mz(v.z));
    ctx.rotate(-v.h + Math.PI);
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#10141c';
    ctx.lineWidth = 3 / s;
    ctx.beginPath(); ctx.moveTo(0, -12 / s); ctx.lineTo(9 / s, 10 / s); ctx.lineTo(0, 5 / s); ctx.lineTo(-9 / s, 10 / s); ctx.closePath(); ctx.stroke(); ctx.fill();
    ctx.restore();
    // district legend
    ctx.font = '700 14px "Trebuchet MS", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.textAlign = 'left';
    ctx.fillText(Object.values(DISTRICT_NAMES).join('  ·  '), 24, h - 20);
  }
}
