/** Paints The Broken Diadem ground art (and minimap background) from the shared map data, in world coordinates. */
import { BRUSH, CAMPS, LANES, MAP_H, MAP_W, OBSTACLES, TEAM_BASE, inIsland } from '../shared/map';
import { Rng } from '../shared/math';

function islandPath(ctx: CanvasRenderingContext2D, margin = 0) {
  ctx.beginPath();
  const n = 120;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const c = Math.cos(a), s = Math.sin(a);
    const hx = MAP_W / 2 - 1.2 - margin, hz = MAP_H / 2 - 1.2 - margin;
    const k = 1 / Math.pow(Math.abs(c) ** 3 + Math.abs(s) ** 3, 1 / 3);
    const x = c * k * hx, z = s * k * hz;
    if (i === 0) ctx.moveTo(x, z); else ctx.lineTo(x, z);
  }
  ctx.closePath();
}
export function islandOutline(): { x: number; z: number }[] {
  const out: { x: number; z: number }[] = [];
  const n = 96;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const c = Math.cos(a), s = Math.sin(a);
    const hx = MAP_W / 2 - 1.2, hz = MAP_H / 2 - 1.2;
    const k = 1 / Math.pow(Math.abs(c) ** 3 + Math.abs(s) ** 3, 1 / 3);
    out.push({ x: c * k * hx, z: s * k * hz });
  }
  return out;
}

function stroke(ctx: CanvasRenderingContext2D, pts: { x: number; z: number }[], w: number, color: string, dash?: number[]) {
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.z) : ctx.moveTo(p.x, p.z)));
  ctx.lineWidth = w; ctx.strokeStyle = color; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.setLineDash(dash ?? []);
  ctx.stroke();
  ctx.setLineDash([]);
}
/** smooth a polyline with Chaikin subdivision for pleasant curved lanes */
export function smooth(pts: { x: number; z: number }[], iter = 3) {
  let p = pts;
  for (let k = 0; k < iter; k++) {
    const q: { x: number; z: number }[] = [p[0]];
    for (let i = 0; i < p.length - 1; i++) {
      q.push({ x: p[i].x * 0.75 + p[i + 1].x * 0.25, z: p[i].z * 0.75 + p[i + 1].z * 0.25 }, { x: p[i].x * 0.25 + p[i + 1].x * 0.75, z: p[i].z * 0.25 + p[i + 1].z * 0.75 });
    }
    q.push(p[p.length - 1]);
    p = q;
  }
  return p;
}

export function paintMapArt(ctx: CanvasRenderingContext2D, detail: boolean) {
  const rng = new Rng(7);
  // island body
  islandPath(ctx);
  const g = ctx.createRadialGradient(0, 0, 10, 0, 0, 80);
  g.addColorStop(0, '#3c8a5c'); g.addColorStop(0.6, '#2f7a52'); g.addColorStop(1, '#276a4c');
  ctx.fillStyle = g; ctx.fill();
  ctx.save();
  islandPath(ctx); ctx.clip();
  if (detail) {
    // jungle speckle
    for (let i = 0; i < 2600; i++) {
      const x = rng.range(-76, 76), z = rng.range(-58, 58);
      ctx.fillStyle = rng.next() < 0.5 ? 'rgba(20,70,50,0.22)' : 'rgba(110,190,120,0.18)';
      ctx.beginPath(); ctx.arc(x, z, rng.range(0.2, 0.9), 0, Math.PI * 2); ctx.fill();
    }
    // coral growths near the rim
    for (let i = 0; i < 160; i++) {
      const a = rng.range(0, Math.PI * 2), rad = rng.range(0.9, 1.0);
      const x = Math.cos(a) * 73 * rad, z = Math.sin(a) * 55 * rad;
      ctx.fillStyle = rng.next() < 0.5 ? 'rgba(232,113,95,0.55)' : 'rgba(255,160,130,0.5)';
      ctx.beginPath(); ctx.arc(x, z, rng.range(0.4, 1.4), 0, Math.PI * 2); ctx.fill();
    }
  }
  // river arms (north/south) with wavy banks
  for (const sgn of [-1, 1]) {
    const pts: { x: number; z: number }[] = [];
    for (let i = 0; i <= 24; i++) { const z = sgn * (13 + (i / 24) * 32); pts.push({ x: Math.sin(i * 0.5 + sgn) * 1.4, z }); }
    stroke(ctx, pts, 8.4, 'rgba(190,225,200,0.55)');
    stroke(ctx, pts, 6.6, '#4fb0d8');
    stroke(ctx, pts, 3.6, '#7fd0ee');
    if (detail) for (let i = 0; i < 40; i++) { const p = pts[Math.floor(rng.range(0, pts.length))]; ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(p.x + rng.range(-2.5, 2.5), p.z + rng.range(-1, 1), 0.9, 0.12); }
  }
  // lanes (ivory causeways)
  for (const lane of LANES) {
    const s = smooth(lane, 3);
    stroke(ctx, s, 10.6, '#8a6a30');
    stroke(ctx, s, 9.8, '#c9a85a');
    stroke(ctx, s, 9.0, '#e5d9ba');
    stroke(ctx, s, 7.2, '#efe6cd');
    if (detail) stroke(ctx, s, 0.22, 'rgba(120,95,50,0.5)', [1.2, 1.6]);
  }
  // base plazas
  for (const team of [0, 1] as const) {
    const b = TEAM_BASE[team];
    const c = team === 0 ? 'rgba(80,160,255,' : 'rgba(255,100,80,';
    ctx.beginPath(); ctx.ellipse(b.engine.x * 1.02, 0, 16, 22, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#d9ccaa'; ctx.fill(); ctx.lineWidth = 0.7; ctx.strokeStyle = '#a07a30'; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(b.engine.x * 1.02, 0, 12, 18, 0, 0, Math.PI * 2); ctx.fillStyle = '#e9dfc4'; ctx.fill();
    ctx.beginPath(); ctx.arc(b.fountain.x, b.fountain.z, 5.5, 0, Math.PI * 2); ctx.fillStyle = c + '0.35)'; ctx.fill(); ctx.lineWidth = 0.5; ctx.strokeStyle = c + '0.9)'; ctx.stroke();
    // exit paths toward the middle
    stroke(ctx, [{ x: b.engine.x, z: 0 }, { x: b.engine.x * 0.55, z: 0 }, { x: b.engine.x * 0.35, z: 0 }], 4.2, '#cdbf9a');
  }
  // colossus pit
  ctx.beginPath(); ctx.arc(0, 0, 9.5, 0, Math.PI * 2); ctx.fillStyle = '#7c7488'; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, 7.4, 0, Math.PI * 2); ctx.fillStyle = '#4a4258'; ctx.fill();
  ctx.lineWidth = 0.4; ctx.strokeStyle = 'rgba(255,90,210,0.8)';
  for (const r of [2.4, 4.4, 6.2]) { ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke(); }
  stroke(ctx, [{ x: -16, z: 0 }, { x: -8, z: 0 }], 4, '#a9a0b8'); stroke(ctx, [{ x: 8, z: 0 }, { x: 16, z: 0 }], 4, '#a9a0b8');
  // camps
  for (const c of CAMPS) {
    if (c.kind === 'small' || c.kind === 'buff') {
      ctx.beginPath(); ctx.arc(c.x, c.z, c.kind === 'buff' ? 3.8 : 3.0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(120,90,50,0.55)'; ctx.fill();
    } else if (c.kind === 'catalyst') {
      ctx.beginPath(); ctx.arc(c.x, c.z, 5, 0, Math.PI * 2); ctx.fillStyle = 'rgba(160,120,230,0.45)'; ctx.fill();
      ctx.lineWidth = 0.4; ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.stroke();
    }
  }
  // brush
  for (const b of BRUSH) {
    const rg = ctx.createRadialGradient(b.x, b.z, 0, b.x, b.z, b.r);
    rg.addColorStop(0, '#1d5a38'); rg.addColorStop(0.8, '#226a40'); rg.addColorStop(1, 'rgba(34,106,64,0)');
    ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(b.x, b.z, b.r, 0, Math.PI * 2); ctx.fill();
    if (detail) for (let i = 0; i < 40; i++) {
      const a = rng.range(0, Math.PI * 2), d = rng.range(0, b.r * 0.9);
      ctx.strokeStyle = rng.next() < 0.5 ? 'rgba(120,220,140,0.5)' : 'rgba(10,50,30,0.6)'; ctx.lineWidth = 0.18;
      ctx.beginPath(); ctx.moveTo(b.x + Math.cos(a) * d, b.z + Math.sin(a) * d); ctx.lineTo(b.x + Math.cos(a) * d + rng.range(-0.5, 0.5), b.z + Math.sin(a) * d - 0.9); ctx.stroke();
    }
  }
  // obstacle contact shadows
  for (const o of OBSTACLES) {
    if (o.kind === 'struct') continue;
    stroke(ctx, [{ x: o.ax, z: o.az }, { x: o.bx, z: o.bz }], o.r * 2 + 0.9, 'rgba(10,25,20,0.35)');
  }
  ctx.restore();
  void inIsland;
}

export function paintObstacles(ctx: CanvasRenderingContext2D) {
  for (const o of OBSTACLES) {
    if (o.kind === 'struct') continue;
    stroke(ctx, [{ x: o.ax, z: o.az }, { x: o.bx, z: o.bz }], o.r * 2, o.kind === 'rock' ? '#7a7a88' : '#d8cdb0');
  }
}
