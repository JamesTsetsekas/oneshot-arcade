// 2D map rendering shared by minimap, full map and results route.

import { getIsland, WORLD_HALF, sampleGrid } from '../../shared/world/island';
import type { Snapshot } from '../../shared/protocol/messages';

let mapCanvas: HTMLCanvasElement | null = null;
export const MAP_PX = 600;

export function islandImage(): HTMLCanvasElement {
  if (mapCanvas) return mapCanvas;
  const isl = getIsland();
  const c = document.createElement('canvas');
  c.width = c.height = MAP_PX;
  const g = c.getContext('2d')!;
  const img = g.createImageData(MAP_PX, MAP_PX);
  for (let py = 0; py < MAP_PX; py++) for (let px = 0; px < MAP_PX; px++) {
    const x = (px / MAP_PX) * WORLD_HALF * 2 - WORLD_HALF;
    const z = WORLD_HALF - (py / MAP_PX) * WORLD_HALF * 2;
    const h = sampleGrid(isl.heights, x, z);
    let r: number, gg: number, b: number;
    if (h < -1.1) { const k = Math.max(0, Math.min(1, -h / 14)); r = 40 - k * 20; gg = 120 - k * 60; b = 140 - k * 30; }
    else if (h < 0) { r = 70; gg = 160; b = 170; }
    else if (h < 2.2) { r = 222; gg = 208; b = 160; }
    else {
      const k = Math.min(1, h / 55);
      r = 90 + k * 110; gg = 150 + k * 50; b = 70 + k * 100;
    }
    // hillshade
    const sh = (sampleGrid(isl.heights, x - 3, z + 3) - sampleGrid(isl.heights, x + 3, z - 3)) * 4;
    const i = (py * MAP_PX + px) * 4;
    img.data[i] = Math.max(0, Math.min(255, r + sh));
    img.data[i + 1] = Math.max(0, Math.min(255, gg + sh));
    img.data[i + 2] = Math.max(0, Math.min(255, b + sh));
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const s = MAP_PX / (WORLD_HALF * 2);
  g.fillStyle = 'rgba(70,55,45,0.75)';
  for (const bx of isl.boxes) {
    if (bx.kind !== 'roof' && bx.kind !== 'foundation') continue;
    g.fillRect((bx.minX + WORLD_HALF) * s, (WORLD_HALF - bx.maxZ) * s, Math.max(1, (bx.maxX - bx.minX) * s), Math.max(1, (bx.maxZ - bx.minZ) * s));
  }
  g.fillStyle = 'rgba(30,80,40,0.35)';
  for (const t of isl.trees) g.fillRect((t.x + WORLD_HALF) * s - 1, (WORLD_HALF - t.z) * s - 1, 2, 2);
  mapCanvas = c;
  return c;
}

export const toMap = (x: number, z: number, size: number) => ({ x: ((x + WORLD_HALF) / (WORLD_HALF * 2)) * size, y: ((WORLD_HALF - z) / (WORLD_HALF * 2)) * size });

export interface MapOpts {
  size: number; // canvas px
  center?: { x: number; z: number }; // minimap: window centre
  span?: number; // metres shown across (minimap)
  labels: boolean;
  pings: { kind: string; x: number; z: number }[];
}

/** Draw map layers. Only legal information: no live enemy positions. */
export function drawMap(g: CanvasRenderingContext2D, snap: Snapshot, yaw: number, o: MapOpts) {
  const isl = getIsland();
  const S = o.size;
  g.save();
  g.clearRect(0, 0, S, S);
  let scale = S / (WORLD_HALF * 2);
  let ox = 0, oy = 0;
  if (o.center && o.span) {
    scale = S / o.span;
    ox = S / 2 - (o.center.x + WORLD_HALF) * scale;
    oy = S / 2 - (WORLD_HALF - o.center.z) * scale;
  }
  const P = (x: number, z: number) => ({ x: ox + (x + WORLD_HALF) * scale, y: oy + (WORLD_HALF - z) * scale });
  g.fillStyle = '#1b3f52';
  g.fillRect(0, 0, S, S);
  const img = islandImage();
  g.imageSmoothingEnabled = true;
  g.drawImage(img, ox, oy, WORLD_HALF * 2 * scale, WORLD_HALF * 2 * scale);
  // storm: shade outside current field
  if (snap.mode === 'solo') {
    const c = P(snap.storm.cur.x, snap.storm.cur.z);
    g.save();
    g.beginPath();
    g.rect(0, 0, S, S);
    g.arc(c.x, c.y, snap.storm.cur.r * scale, 0, Math.PI * 2, true);
    g.fillStyle = 'rgba(120,60,210,0.42)';
    g.fill('evenodd');
    g.restore();
    g.strokeStyle = '#c59bff'; g.lineWidth = 2;
    g.beginPath(); g.arc(c.x, c.y, snap.storm.cur.r * scale, 0, Math.PI * 2); g.stroke();
    if (snap.storm.next) {
      const n = P(snap.storm.next.x, snap.storm.next.z);
      g.strokeStyle = '#ffffff'; g.setLineDash([6, 4]); g.lineWidth = 1.5;
      g.beginPath(); g.arc(n.x, n.y, snap.storm.next.r * scale, 0, Math.PI * 2); g.stroke();
      g.setLineDash([]);
      // route line to the next field if outside it
      const me = P(snap.you.x, snap.you.z);
      const dx = snap.you.x - snap.storm.next.x, dz = snap.you.z - snap.storm.next.z;
      const d = Math.hypot(dx, dz);
      if (d > snap.storm.next.r && snap.you.alive) {
        const ex = snap.storm.next.x + (dx / d) * snap.storm.next.r * 0.9, ez = snap.storm.next.z + (dz / d) * snap.storm.next.r * 0.9;
        const e = P(ex, ez);
        g.strokeStyle = 'rgba(255,255,255,0.8)'; g.setLineDash([3, 3]);
        g.beginPath(); g.moveTo(me.x, me.y); g.lineTo(e.x, e.y); g.stroke(); g.setLineDash([]);
      }
    }
  }
  // skiff path
  if (snap.skiff && (snap.phase === 'skiff' || snap.phase === 'staging' || snap.you.mode === 'skiff')) {
    const a = P(snap.skiff.ax, snap.skiff.az), b = P(snap.skiff.bx, snap.skiff.bz);
    g.strokeStyle = '#ffd23d'; g.lineWidth = 2; g.setLineDash([8, 5]);
    g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); g.setLineDash([]);
    const s = P(snap.skiff.x, snap.skiff.z);
    g.fillStyle = '#ffd23d'; g.beginPath(); g.arc(s.x, s.y, 5, 0, Math.PI * 2); g.fill();
  }
  if (o.labels) {
    g.font = '600 12px system-ui, sans-serif';
    g.textAlign = 'center';
    for (const l of isl.locations) {
      if (l.kind === 'pier') continue;
      const p = P(l.x, l.z);
      g.fillStyle = l.kind === 'named' ? '#fff8e6' : 'rgba(255,248,230,0.75)';
      g.font = l.kind === 'named' ? '700 13px system-ui, sans-serif' : '500 10px system-ui, sans-serif';
      g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 3;
      const t = l.kind === 'named' ? l.name.toUpperCase() : l.name;
      g.strokeText(t, p.x, p.y); g.fillText(t, p.x, p.y);
    }
  }
  // legal pings: supply capsules, caravan (approximate)
  for (const p of o.pings) {
    const q = P(p.x, p.z);
    g.fillStyle = p.kind === 'capsule' ? '#ffc23d' : p.kind === 'caravanDown' ? '#ff9a3c' : '#ffd23d';
    g.strokeStyle = '#3a2a00'; g.lineWidth = 2;
    g.beginPath();
    if (p.kind === 'capsule') { g.rect(q.x - 5, q.y - 5, 10, 10); }
    else { g.arc(q.x, q.y, p.kind === 'caravan' ? 9 : 6, 0, Math.PI * 2); }
    g.fill(); g.stroke();
  }
  if (snap.marker) {
    const m = P(snap.marker.x, snap.marker.z);
    g.fillStyle = '#ffd23d'; g.strokeStyle = '#000'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(m.x, m.y); g.lineTo(m.x - 6, m.y - 14); g.lineTo(m.x + 6, m.y - 14); g.closePath(); g.fill(); g.stroke();
  }
  // player arrow
  const me = P(snap.you.x, snap.you.z);
  g.translate(me.x, me.y);
  g.rotate(yaw);
  g.fillStyle = snap.you.alive ? '#7cffd4' : '#888';
  g.strokeStyle = '#06322a'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(0, -9); g.lineTo(6, 7); g.lineTo(0, 3); g.lineTo(-6, 7); g.closePath(); g.fill(); g.stroke();
  g.restore();
}

export function screenToWorld(px: number, py: number, size: number) {
  return { x: (px / size) * WORLD_HALF * 2 - WORLD_HALF, z: WORLD_HALF - (py / size) * WORLD_HALF * 2 };
}
