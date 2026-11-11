// Minimap + full city map, drawn with Canvas 2D from the world model.
import { WorldModel } from '../world/model';
import { WORLD_W, WORLD_D, DISTRICT_NAMES, District } from '../world/galeport';
import { Session } from '../game-session/session';
import { TIERS, Tier } from '../fares/fares';

const DISTRICT_LABELS: [District, number, number][] = [
  ['harbor', 330, 215], ['beach', 1080, 215], ['oldsteps', 280, 520], ['civic', 660, 800], ['lantern', 1040, 420], ['highline', 1150, 760],
];

export function drawTierShape(ctx: CanvasRenderingContext2D, tier: Tier, x: number, y: number, r: number): void {
  ctx.beginPath();
  if (tier === 'short') ctx.arc(x, y, r, 0, Math.PI * 2);
  else if (tier === 'medium') { ctx.moveTo(x, y - r * 1.25); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r * 1.25); ctx.lineTo(x - r, y); ctx.closePath(); }
  else if (tier === 'long') {
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * 0.55 : r * 1.35; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath();
  } else { for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; ctx.lineTo(x + Math.cos(a) * r * 1.15, y + Math.sin(a) * r * 1.15); } ctx.closePath(); }
  ctx.fillStyle = TIERS[tier].color;
  ctx.fill();
  ctx.lineWidth = Math.max(1.5, r * 0.28);
  ctx.strokeStyle = '#10222c';
  ctx.stroke();
}

export class Minimap {
  private base: HTMLCanvasElement;

  constructor(private model: WorldModel) {
    const c = document.createElement('canvas');
    c.width = WORLD_W;
    c.height = WORLD_D;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#2f8f8a';
    ctx.fillRect(0, 0, c.width, c.height);
    // Land / water / beach from the heightfield.
    for (let z = 0; z < WORLD_D; z += 5) for (let x = 0; x < WORLD_W; x += 5) {
      const h = model.heightAt(x + 2.5, z + 2.5);
      if (h < -0.05) { ctx.fillStyle = '#1c6fb0'; ctx.fillRect(x, WORLD_D - z - 5, 5, 5); continue; }
      const s = model.surfaceAt(x + 2.5, z + 2.5);
      ctx.fillStyle = s === 'sand' ? '#e6cf96' : s === 'grass' ? '#3f9b7b' : '#3b8c96';
      ctx.fillRect(x, WORLD_D - z - 5, 5, 5);
    }
    ctx.lineCap = 'round';
    const stroke = (pass: number) => {
      for (const e of model.edges) {
        const a = model.nodes[e.a], b = model.nodes[e.b];
        const hl = e.cls === 'highline' || e.cls === 'ramp';
        if (pass === 0) { ctx.strokeStyle = '#143744'; ctx.lineWidth = e.hw * 2 + 6; }
        else { ctx.strokeStyle = hl ? '#7ef0e0' : e.cls === 'narrow' ? '#e2c7a8' : '#fbf4e2'; ctx.lineWidth = e.hw * 2 - 2; }
        if (pass === 0 && hl) continue;
        ctx.beginPath(); ctx.moveTo(a.x, WORLD_D - a.z); ctx.lineTo(b.x, WORLD_D - b.z); ctx.stroke();
      }
    };
    stroke(0);
    stroke(1);
    this.base = c;
  }

  private shortcuts(ctx: CanvasRenderingContext2D, s: Session): void {
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#ffd43b';
    for (const sc of this.model.shortcuts) {
      if (!s.discovered.has(sc.id)) continue;
      ctx.beginPath(); ctx.moveTo(sc.ax, WORLD_D - sc.az); ctx.lineTo(sc.bx, WORLD_D - sc.bz); ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  /** Heading-up circular minimap. */
  draw(ctx: CanvasRenderingContext2D, s: Session, size: number, px: number, pz: number, yaw: number): void {
    const R = size / 2, scale = R / 235;
    ctx.save();
    ctx.clearRect(0, 0, size, size);
    ctx.beginPath(); ctx.arc(R, R, R - 2, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#1c6fb0';
    ctx.fillRect(0, 0, size, size);
    ctx.translate(R, R);
    ctx.rotate(-yaw);
    ctx.scale(scale, scale);
    ctx.translate(-px, -(WORLD_D - pz));
    ctx.drawImage(this.base, 0, 0);
    this.shortcuts(ctx, s);
    // Route guidance line.
    const path = s.guidePath;
    if (path && path.length > 1) {
      ctx.strokeStyle = s.fares.current ? TIERS[s.fares.current.tier].color : 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 7;
      ctx.lineJoin = 'round';
      ctx.setLineDash([14, 10]);
      ctx.beginPath();
      ctx.moveTo(px, WORLD_D - pz);
      for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, WORLD_D - path[i].z);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
    // Markers (screen-aligned, clamped to the rim).
    const cos = Math.cos(yaw), sin = Math.sin(yaw);
    const place = (wx: number, wz: number): [number, number, boolean] => {
      const rx = wx - px, rz = wz - pz;
      let sx = (rx * cos - rz * sin) * scale, sy = -(rx * sin + rz * cos) * scale;
      const d = Math.hypot(sx, sy);
      const lim = R - 11;
      const out = d > lim;
      if (out) { sx *= lim / d; sy *= lim / d; }
      return [R + sx, R + sy, out];
    };
    if (s.fares.state === 'seeking') for (const c of s.fares.candidates) {
      const site = this.model.sites[c.site];
      const [x, y, out] = place(site.x, site.z);
      drawTierShape(ctx, c.tier, x, y, out ? 4.5 : 6.5);
    } else if (s.fares.current) {
      const d = this.model.sites[s.fares.current.dest];
      const [x, y] = place(d.x, d.z);
      ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2);
      ctx.fillStyle = TIERS[s.fares.current.tier].color; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fillStyle = '#10222c'; ctx.fill();
    }
    // Player.
    ctx.beginPath();
    ctx.moveTo(R, R - 10); ctx.lineTo(R + 7, R + 8); ctx.lineTo(R, R + 4); ctx.lineTo(R - 7, R + 8); ctx.closePath();
    ctx.fillStyle = '#fff'; ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = '#ff4d5e'; ctx.stroke();
    ctx.beginPath(); ctx.arc(R, R, R - 2, 0, Math.PI * 2);
    ctx.lineWidth = 4; ctx.strokeStyle = '#fff3d6'; ctx.stroke();
  }

  /** North-up full city map. */
  drawFull(ctx: CanvasRenderingContext2D, s: Session, w: number, h: number, px: number, pz: number, yaw: number): void {
    const scale = Math.min(w / WORLD_W, h / WORLD_D);
    ctx.save();
    ctx.clearRect(0, 0, w, h);
    ctx.scale(scale, scale);
    ctx.drawImage(this.base, 0, 0);
    this.shortcuts(ctx, s);
    ctx.font = '700 26px Rubik, sans-serif';
    ctx.textAlign = 'center';
    for (const [d, x, z] of DISTRICT_LABELS) {
      ctx.fillStyle = 'rgba(16,34,44,0.55)';
      ctx.fillText(DISTRICT_NAMES[d].toUpperCase(), x + 1.5, WORLD_D - z + 1.5);
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.fillText(DISTRICT_NAMES[d].toUpperCase(), x, WORLD_D - z);
    }
    for (const site of this.model.sites) {
      ctx.beginPath(); ctx.arc(site.x, WORLD_D - site.z, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(16,34,44,0.75)'; ctx.fill();
    }
    if (s.fares.state === 'seeking') for (const c of s.fares.candidates) { const site = this.model.sites[c.site]; drawTierShape(ctx, c.tier, site.x, WORLD_D - site.z, 13); }
    if (s.fares.current) {
      const d = this.model.sites[s.fares.current.dest];
      ctx.beginPath(); ctx.arc(d.x, WORLD_D - d.z, 18, 0, Math.PI * 2);
      ctx.fillStyle = TIERS[s.fares.current.tier].color; ctx.fill();
      ctx.lineWidth = 5; ctx.strokeStyle = '#fff'; ctx.stroke();
      ctx.font = '700 22px Rubik, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText(d.name, d.x, WORLD_D - d.z - 26);
    }
    ctx.translate(px, WORLD_D - pz);
    ctx.rotate(yaw);
    ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(14, 16); ctx.lineTo(0, 8); ctx.lineTo(-14, 16); ctx.closePath();
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#ff4d5e'; ctx.stroke();
    ctx.restore();
  }
}
