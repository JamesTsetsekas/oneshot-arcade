// Tactical map / radar renderer. Only draws what the snapshot legally contains: teammates, spotted enemies,
// the Spike when known, smoke volumes and coarse Pulse Shard wedges.

import { BOXES, CALLOUTS, GRID_H, GRID_W, CELL, MAP_HEIGHT, MAP_WIDTH, SITES, cellGlyph } from '../sim/map';

export interface MapPlayer { id: number; x: number; z: number; yaw: number; alive: boolean; spotted: boolean; side: 'cus' | 'int'; self: boolean }
export interface MapPulse { x: number; z: number; sector: number; band: number; age: number }
export interface MapDraw {
  players: MapPlayer[];
  spike: { x: number; z: number; state: string } | null;
  smokes: Array<{ x: number; z: number; r: number }>;
  fires: Array<{ x: number; z: number }>;
  pulses: MapPulse[];
  colors: { cus: string; int: string };
  grenades: Array<{ x: number; z: number; type: string }>;
}

const SCALE = 8;
let baseCanvas: HTMLCanvasElement | null = null;

function base(): HTMLCanvasElement {
  if (baseCanvas) return baseCanvas;
  const c = document.createElement('canvas');
  c.width = MAP_WIDTH * SCALE; c.height = MAP_HEIGHT * SCALE;
  const ctx = c.getContext('2d')!;
  const s = SCALE;
  ctx.fillStyle = '#0b0f14'; ctx.fillRect(0, 0, c.width, c.height);
  for (let r = 0; r < GRID_H; r++) {
    for (let col = 0; col < GRID_W; col++) {
      const g = cellGlyph(col, r);
      let color = '#3a4552';
      if (g === '#') color = '#10151b';
      else if (g === 'C' || g === 'c') color = '#6a5a46';
      else if (g === 'H') color = '#566070';
      else if (g === 'P') color = '#2f6a3d';
      else if (g === 'T') color = '#4f6584';
      else if ('1234'.includes(g)) color = ['#445063', '#4a586c', '#516076', '#58687f'][Number(g) - 1];
      else if (g === 'k') color = '#2a323c';
      ctx.fillStyle = color;
      ctx.fillRect(col * CELL * s, r * CELL * s, CELL * s + 0.5, CELL * s + 0.5);
    }
  }
  // thin walls and glass
  for (const b of BOXES) {
    if (b.mat === 'thin' || b.mat === 'glass') {
      ctx.fillStyle = b.mat === 'glass' ? '#7fd8f0' : '#b9c3cf';
      ctx.fillRect(b.x0 * s, b.z0 * s, Math.max(1.2, (b.x1 - b.x0) * s), Math.max(1.2, (b.z1 - b.z0) * s));
    }
  }
  for (const key of ['A', 'B'] as const) {
    const z = SITES[key];
    ctx.strokeStyle = '#ff3fa6'; ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(255,63,166,0.14)';
    ctx.fillRect(z.x0 * s, z.z0 * s, (z.x1 - z.x0) * s, (z.z1 - z.z0) * s);
    ctx.strokeRect(z.x0 * s, z.z0 * s, (z.x1 - z.x0) * s, (z.z1 - z.z0) * s);
    ctx.fillStyle = '#ff7ac2'; ctx.font = "700 " + 6 * SCALE + "px sans-serif";
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(key, ((z.x0 + z.x1) / 2) * s, ((z.z0 + z.z1) / 2) * s);
  }
  baseCanvas = c;
  return c;
}

export function drawMap(ctx: CanvasRenderingContext2D, w: number, h: number, d: MapDraw, large: boolean): void {
  const b = base();
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(b, 0, 0, w, h);
  const kx = w / MAP_WIDTH, kz = h / MAP_HEIGHT;

  for (const s of d.smokes) {
    ctx.fillStyle = 'rgba(190,205,222,0.7)';
    ctx.beginPath(); ctx.arc(s.x * kx, s.z * kz, s.r * kx, 0, Math.PI * 2); ctx.fill();
  }
  for (const f of d.fires) { ctx.fillStyle = 'rgba(255,120,40,0.8)'; ctx.fillRect((f.x - 0.5) * kx, (f.z - 0.5) * kz, kx, kz); }
  // Pulse wedges: coarse direction only.
  for (const p of d.pulses) {
    const fade = Math.max(0, 1 - p.age / 3);
    const ang = -Math.PI / 2 + p.sector * (Math.PI / 4);
    const rad = [8, 15, 22][p.band] * kx;
    ctx.fillStyle = `rgba(77,224,255,${0.28 * fade})`;
    ctx.strokeStyle = `rgba(77,224,255,${0.8 * fade})`;
    ctx.beginPath(); ctx.moveTo(p.x * kx, p.z * kz);
    ctx.arc(p.x * kx, p.z * kz, rad, ang - Math.PI / 8, ang + Math.PI / 8); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  if (large) {
    ctx.fillStyle = 'rgba(220,230,240,0.78)';
    ctx.font = '600 ' + Math.max(10, w / 70) + 'px "Segoe UI", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const c of CALLOUTS) {
      if (['West Link', 'East Link', 'Mid Gate', 'Cal Ramp', 'Turbine Hall', 'Hydroponics', 'Calibration', 'A Site', 'B Site', 'Gantry', 'Mid Deck', 'West Dock', 'East Gate', 'Lab Link', 'Turbine Ramp', 'Fallback Lane'].includes(c.name)) continue;
      ctx.fillText(c.name.toUpperCase(), ((c.x0 + c.x1) / 2) * kx, ((c.z0 + c.z1) / 2) * kz);
    }
    for (const c of CALLOUTS) {
      if (!['Gantry', 'Mid Deck', 'Fallback Lane', 'Turbine Ramp', 'Lab Link', 'Atrium', 'Freight Yard', 'Calibration'].includes(c.name)) continue;
      ctx.fillStyle = 'rgba(220,230,240,0.55)';
      ctx.fillText(c.name.toUpperCase(), ((c.x0 + c.x1) / 2) * kx, ((c.z0 + c.z1) / 2) * kz + (c.name === 'Calibration' ? 28 : 0));
    }
  }
  for (const g of d.grenades) {
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(g.x * kx, g.z * kz, 2.4, 0, 7); ctx.fill();
  }
  if (d.spike) {
    ctx.fillStyle = '#ff3fa6'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.rect(d.spike.x * kx - 5, d.spike.z * kz - 5, 10, 10); ctx.fill(); ctx.stroke();
    if (d.spike.state === 'planted') {
      ctx.strokeStyle = 'rgba(255,63,166,0.6)';
      ctx.beginPath(); ctx.arc(d.spike.x * kx, d.spike.z * kz, 12 + (performance.now() % 700) / 40, 0, 7); ctx.stroke();
    }
  }
  for (const p of d.players) {
    const color = p.side === 'cus' ? d.colors.cus : d.colors.int;
    const x = p.x * kx, z = p.z * kz;
    if (!p.alive) {
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x - 4, z - 4); ctx.lineTo(x + 4, z + 4); ctx.moveTo(x + 4, z - 4); ctx.lineTo(x - 4, z + 4); ctx.stroke();
      continue;
    }
    ctx.save();
    ctx.translate(x, z);
    ctx.rotate(-p.yaw);
    ctx.fillStyle = color;
    ctx.strokeStyle = p.spotted ? '#ff3b4d' : '#0b0f14';
    ctx.lineWidth = p.spotted ? 2.4 : 1.4;
    const sz = p.self ? 8.5 : 7;
    ctx.beginPath(); ctx.moveTo(0, -sz); ctx.lineTo(sz * 0.72, sz * 0.7); ctx.lineTo(0, sz * 0.3); ctx.lineTo(-sz * 0.72, sz * 0.7); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (p.self) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6; ctx.stroke(); }
    ctx.restore();
  }
}
