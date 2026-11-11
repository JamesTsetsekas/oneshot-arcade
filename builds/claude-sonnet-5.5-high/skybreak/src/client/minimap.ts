import type { Match } from '../sim/match';
import { smoothstep } from '../shared/math';

export interface MapMarker { x: number; z: number }

/** Pre-rendered island chart + overlay drawing for the minimap and full map. */
export class MapRenderer {
  readonly base: HTMLCanvasElement;
  private size = 600;
  readonly fullSpan: number;
  constructor(private match: Match) {
    this.fullSpan = match.mode === 'practice' ? 260 : match.world.half * 2;
    this.base = document.createElement('canvas');
    this.base.width = this.base.height = this.size;
    this.bake();
  }

  private bake(): void {
    const w = this.match.world;
    const ctx = this.base.getContext('2d')!;
    const img = ctx.createImageData(this.size, this.size);
    const span = this.fullSpan;
    const half = span / 2;
    for (let py = 0; py < this.size; py++) {
      for (let px = 0; px < this.size; px++) {
        const x = (px / this.size) * span - half, z = (py / this.size) * span - half;
        const h = w.heightAt(x, z);
        let r: number, g: number, b: number;
        if (h < 0.1) {
          const d = smoothstep(0, -8, h);
          r = 40 - d * 14; g = 150 - d * 70; b = 175 - d * 60;
        } else {
          const t = smoothstep(0, 46, h);
          r = 118 + t * 80; g = 178 - t * 22; b = 98 + t * 70;
          if (h < 2.4) { r = 226; g = 214; b = 168; }
          // hillshade from heightfield
          const sh = (w.heightAt(x + 4, z + 4) - w.heightAt(x - 4, z - 4)) * -0.9;
          r += sh * 6; g += sh * 6; b += sh * 6;
        }
        const i = (py * this.size + px) * 4;
        img.data[i] = Math.max(0, Math.min(255, r)); img.data[i + 1] = Math.max(0, Math.min(255, g)); img.data[i + 2] = Math.max(0, Math.min(255, b)); img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    // buildings
    ctx.fillStyle = 'rgba(70,60,50,0.9)';
    const k = this.size / span;
    for (const b of w.buildings) ctx.fillRect((b.x - b.w / 2 + half) * k, (b.z - b.d / 2 + half) * k, Math.max(2, b.w * k), Math.max(2, b.d * k));
    ctx.fillStyle = 'rgba(255,120,40,0.85)';
    for (const hz of w.hazards) ctx.fillRect((hz.x0 + half) * k, (hz.z0 + half) * k, (hz.x1 - hz.x0) * k, (hz.z1 - hz.z0) * k);
  }

  private tx(x: number, z: number, view: { cx: number; cz: number; span: number; px: number }): { x: number; y: number } {
    return { x: ((x - view.cx) / view.span + 0.5) * view.px, y: ((z - view.cz) / view.span + 0.5) * view.px };
  }

  /** Draw a map into ctx (square). span = visible world metres. */
  draw(ctx: CanvasRenderingContext2D, px: number, view: { cx: number; cz: number; span: number }, opts: { labels: boolean; marker: MapMarker | null; humanId: number; yaw: number; showSkiff: boolean; trails: { x: number; z: number; age: number }[]; colorblind: boolean }): void {
    const m = this.match;
    const w = m.world;
    const full = this.fullSpan;
    const v = { cx: view.cx, cz: view.cz, span: view.span, px };
    ctx.save();
    ctx.clearRect(0, 0, px, px);
    ctx.fillStyle = '#12304a';
    ctx.fillRect(0, 0, px, px);
    // base image portion
    const sx = (view.cx - view.span / 2 + full / 2) / full * this.size;
    const sy = (view.cz - view.span / 2 + full / 2) / full * this.size;
    const sw = view.span / full * this.size;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.base, sx, sy, sw, sw, 0, 0, px, px);
    // storm shading outside the current zone
    const s = m.storm;
    if (m.mode === 'quick' && s.phase >= 1) {
      const c = this.tx(s.cx, s.cz, v);
      const r = (s.r / view.span) * px;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, px, px);
      ctx.arc(c.x, c.y, Math.max(1, r), 0, Math.PI * 2, true);
      ctx.fillStyle = 'rgba(130,70,230,0.38)';
      ctx.fill('evenodd');
      ctx.restore();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#d8b8ff';
      ctx.beginPath(); ctx.arc(c.x, c.y, Math.max(1, r), 0, Math.PI * 2); ctx.stroke();
      // next field
      const n = this.tx(s.nextX, s.nextZ, v);
      ctx.strokeStyle = '#ffffff'; ctx.setLineDash([6, 4]); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(n.x, n.y, Math.max(1, (s.nextR / view.span) * px), 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    } else if (m.mode === 'quick') {
      const n = this.tx(s.nextX, s.nextZ, v);
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.setLineDash([6, 4]); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(n.x, n.y, (s.nextR / view.span) * px, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    }
    // skiff path
    if (m.mode === 'quick' && opts.showSkiff) {
      const a = this.tx(m.skiff.startX, m.skiff.startZ, v), b = this.tx(m.skiff.endX, m.skiff.endZ, v);
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.setLineDash([10, 8]); ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.setLineDash([]);
      const k = this.tx(m.skiff.x, m.skiff.z, v);
      ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(k.x, k.y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.stroke();
    }
    // location labels
    if (opts.labels) {
      ctx.font = `${Math.round(px / 48)}px "Segoe UI", sans-serif`;
      ctx.textAlign = 'center';
      for (const l of w.locations) {
        if (l.id === 'wild') continue;
        const p = this.tx(l.x, l.z, v);
        ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(10,25,40,0.85)'; ctx.fillStyle = l.named ? '#ffffff' : '#d6ecf5';
        if (!l.named) ctx.font = `${Math.round(px / 62)}px "Segoe UI", sans-serif`; else ctx.font = `600 ${Math.round(px / 46)}px "Segoe UI", sans-serif`;
        ctx.strokeText(l.name, p.x, p.y - 4); ctx.fillText(l.name, p.x, p.y - 4);
        ctx.fillStyle = l.named ? '#ffd166' : '#bfe6f2';
        ctx.beginPath(); ctx.arc(p.x, p.y + 4, l.named ? 3.2 : 2.2, 0, Math.PI * 2); ctx.fill();
      }
    }
    // capsules
    for (const c of m.capsules) {
      const p = this.tx(c.x, c.z, v);
      ctx.fillStyle = c.landed ? '#ffc83d' : '#ff8a4a';
      ctx.beginPath(); ctx.moveTo(p.x, p.y - 8); ctx.lineTo(p.x + 7, p.y + 5); ctx.lineTo(p.x - 7, p.y + 5); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.stroke();
      if (!c.landed) { ctx.strokeStyle = 'rgba(255,200,80,0.7)'; ctx.beginPath(); ctx.arc(p.x, p.y, 14 + Math.sin(m.time * 4) * 2, 0, Math.PI * 2); ctx.stroke(); }
    }
    // echo trails
    for (const t of opts.trails) {
      const p = this.tx(t.x, t.z, v);
      ctx.fillStyle = `rgba(255,227,107,${Math.max(0.15, 1 - t.age / 14)})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
    }
    // marker
    if (opts.marker) {
      const p = this.tx(opts.marker.x, opts.marker.z, v);
      ctx.fillStyle = '#ff4d8d'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 7, p.y - 16); ctx.lineTo(p.x + 7, p.y - 16); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    // player
    const h = m.players[opts.humanId];
    if (h && h.alive) {
      const p = this.tx(h.x, h.z, v);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(Math.PI - opts.yaw);
      ctx.fillStyle = opts.colorblind ? '#ffffff' : '#fff27a'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(6, 7); ctx.lineTo(0, 3); ctx.lineTo(-6, 7); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }
}
