// Map rendering: a pre-drawn "map paper" base of South Quay plus live overlays for the minimap
// and the full map (GPS route, markers, search region, visible police).
import { segments, intersections, blocks, CANAL, COAST_E, COAST_S, ZONE_NAMES, ANCHORS, decks } from '../world/district';
import { buildings } from '../world/lots';

export type MarkKind = 'goal' | 'side' | 'area' | 'shop' | 'safe' | 'contact' | 'activity' | 'waypoint' | 'police' | 'garage' | 'landmark' | 'vehicle';
export interface MapMark { x: number; z: number; kind: MarkKind; r?: number; label?: string }
export interface MapOverlay { route: number[] | null; marks: MapMark[]; search: { x: number; z: number; r: number } | null; px: number; pz: number; yaw: number }
export const MARK_STYLE: Record<MarkKind, { color: string; label: string }> = {
  goal: { color: '#ffd23f', label: 'Objective' }, side: { color: '#ffffff', label: 'Optional' }, area: { color: '#ffd23f', label: 'Area' },
  shop: { color: '#2ec4b6', label: 'Shop' }, safe: { color: '#7bd389', label: 'Safehouse' }, contact: { color: '#ff9f1c', label: 'Contact / job' },
  activity: { color: '#c77dff', label: 'Activity' }, waypoint: { color: '#ff4f9a', label: 'Waypoint' }, police: { color: '#5aa2ff', label: 'Police (in sight)' },
  garage: { color: '#2ec4b6', label: 'Garage' }, landmark: { color: '#8d7b5a', label: 'Landmark' }, vehicle: { color: '#f2b134', label: 'Your vehicle' },
};
const SIZE = 1024, WORLD = 960, K = SIZE / WORLD;
const bx = (x: number) => (x + WORLD / 2) * K, bz = (z: number) => (WORLD / 2 - z) * K;
const ZONE_FILL: Record<string, string> = { tide: '#e6d6b4', glassline: '#d5dde0', lantern: '#e9d2bd', canal: '#dcd8c2', foundry: '#d8cbb9', breakwater: '#cfcfc6' };

export class MapPainter {
  base: HTMLCanvasElement;
  constructor() {
    this.base = document.createElement('canvas'); this.base.width = this.base.height = SIZE;
    const c = this.base.getContext('2d')!;
    c.fillStyle = '#2b6f80'; c.fillRect(0, 0, SIZE, SIZE);
    // faint wave hatching for the harbor
    c.strokeStyle = 'rgba(255,255,255,0.07)'; c.lineWidth = 1;
    for (let y = 0; y < SIZE; y += 9) { c.beginPath(); c.moveTo(0, y); c.lineTo(SIZE, y + 4); c.stroke(); }
    const rect = (x0: number, z0: number, x1: number, z1: number, fill: string) => { c.fillStyle = fill; c.fillRect(bx(x0), bz(z1), (x1 - x0) * K, (z1 - z0) * K); };
    rect(-452, COAST_S, COAST_E, 452, '#cfc5ab');
    for (const b of blocks) {
      const r = b.rect;
      const fill = b.lot === 'park' ? '#b9d3a0' : b.lot === 'plaza' ? '#efd9a8' : ZONE_FILL[b.zone];
      rect(Math.max(r.x0, -450), Math.max(r.z0, COAST_S), Math.min(r.x1, COAST_E), Math.min(r.z1, 450), fill);
    }
    rect(CANAL.x0, COAST_S, CANAL.x1, 452, '#3f8fa3');
    for (const b of buildings) if (!b.stacked) rect(b.x0, b.z0, b.x1, b.z1, b.tag === 'safehouse' ? '#7bbf8a' : b.tag === 'police' ? '#8fa6d6' : 'rgba(120,104,82,0.55)');
    for (const s of segments) {
      if (s.kind === 'none') continue;
      rect(s.rect.x0, s.rect.z0, s.rect.x1, s.rect.z1, s.kind === 'ped' ? '#f3e3bd' : s.cls === 'arterial' ? '#fff8e8' : '#f7f1e3');
    }
    for (const it of intersections) rect(it.rect.x0, it.rect.z0, it.rect.x1, it.rect.z1, '#f7f1e3');
    for (const d of decks) { c.strokeStyle = '#8d7b5a'; c.lineWidth = 1.5; c.strokeRect(bx(d.rect.x0), bz(d.seg.rect.z1), (d.rect.x1 - d.rect.x0) * K, (d.seg.rect.z1 - d.seg.rect.z0) * K); }
    // viaduct
    c.fillStyle = '#6f6250'; c.fillRect(bx(-452), bz(452), 12 * K, 888 * K); c.fillRect(bx(-452), bz(452), 904 * K, 12 * K);
    c.strokeStyle = 'rgba(70,58,40,0.5)'; c.lineWidth = 1; c.strokeRect(bx(-452), bz(452), (COAST_E + 452) * K, (452 - COAST_S) * K);
  }
  private marks(c: CanvasRenderingContext2D, o: MapOverlay, w2s: (x: number, z: number) => [number, number], scale: number, clampR: number, cx: number, cy: number) {
    if (o.search) {
      const [sx, sy] = w2s(o.search.x, o.search.z);
      c.fillStyle = 'rgba(224,60,60,0.2)'; c.strokeStyle = 'rgba(224,60,60,0.85)'; c.lineWidth = 2; c.setLineDash([6, 5]);
      c.beginPath(); c.arc(sx, sy, o.search.r * scale, 0, 7); c.fill(); c.stroke(); c.setLineDash([]);
    }
    if (o.route && o.route.length >= 4) {
      c.strokeStyle = '#ff4f9a'; c.lineWidth = 4; c.lineJoin = 'round'; c.lineCap = 'round'; c.globalAlpha = 0.9;
      c.beginPath();
      for (let i = 0; i < o.route.length; i += 2) { const [x, y] = w2s(o.route[i], o.route[i + 1]); if (i === 0) c.moveTo(x, y); else c.lineTo(x, y); }
      c.stroke(); c.globalAlpha = 1;
    }
    for (const m of o.marks) {
      let [x, y] = w2s(m.x, m.z);
      const st = MARK_STYLE[m.kind];
      if (m.kind === 'area') { c.fillStyle = 'rgba(255,210,63,0.22)'; c.strokeStyle = st.color; c.lineWidth = 2; c.beginPath(); c.arc(x, y, (m.r ?? 30) * scale, 0, 7); c.fill(); c.stroke(); continue; }
      if (clampR > 0) {
        const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy);
        if (d > clampR) { if (m.kind !== 'goal' && m.kind !== 'waypoint' && m.kind !== 'safe' && m.kind !== 'vehicle') continue; x = cx + (dx / d) * clampR; y = cy + (dy / d) * clampR; }
      }
      c.fillStyle = st.color; c.strokeStyle = 'rgba(20,24,30,0.9)'; c.lineWidth = 2;
      c.beginPath();
      if (m.kind === 'goal' || m.kind === 'side' || m.kind === 'waypoint') { c.moveTo(x, y - 8); c.lineTo(x + 7, y); c.lineTo(x, y + 8); c.lineTo(x - 7, y); c.closePath(); }
      else if (m.kind === 'safe') { c.moveTo(x, y - 8); c.lineTo(x + 8, y - 1); c.lineTo(x + 6, y + 7); c.lineTo(x - 6, y + 7); c.lineTo(x - 8, y - 1); c.closePath(); }
      else if (m.kind === 'police') { c.arc(x, y, 5, 0, 7); }
      else if (m.kind === 'contact' || m.kind === 'activity') { c.arc(x, y, 7, 0, 7); }
      else if (m.kind === 'landmark') { c.rect(x - 3, y - 3, 6, 6); }
      else c.rect(x - 6, y - 6, 12, 12);
      c.fill(); c.stroke();
      const glyph = m.kind === 'contact' ? '!' : m.kind === 'shop' ? '$' : m.kind === 'garage' ? 'G' : m.kind === 'activity' ? 'A' : m.kind === 'vehicle' ? 'V' : '';
      if (glyph) { c.fillStyle = '#14181e'; c.font = 'bold 10px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(glyph, x, y + 0.5); }
    }
  }
  drawMini(c: CanvasRenderingContext2D, size: number, o: MapOverlay, rotate: boolean, mPerPx: number) {
    const h = size / 2, rot = rotate ? -o.yaw : 0, s = 1 / mPerPx;
    c.save(); c.clearRect(0, 0, size, size);
    c.beginPath(); c.arc(h, h, h - 2, 0, 7); c.clip();
    c.fillStyle = '#2b6f80'; c.fillRect(0, 0, size, size);
    c.translate(h, h); c.rotate(rot); c.scale(s / K, s / K); c.translate(-bx(o.px), -bz(o.pz));
    c.imageSmoothingEnabled = true; c.drawImage(this.base, 0, 0);
    c.restore(); c.save(); c.beginPath(); c.arc(h, h, h - 2, 0, 7); c.clip();
    const cs = Math.cos(rot), sn = Math.sin(rot);
    const w2s = (x: number, z: number): [number, number] => { const dx = (x - o.px) * s, dy = -(z - o.pz) * s; return [h + dx * cs - dy * sn, h + dx * sn + dy * cs]; };
    this.marks(c, o, w2s, s, h - 12, h, h);
    // player arrow
    c.translate(h, h); c.rotate(rotate ? 0 : o.yaw);
    c.fillStyle = '#ffffff'; c.strokeStyle = '#14181e'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -9); c.lineTo(6.5, 7); c.lineTo(0, 3.5); c.lineTo(-6.5, 7); c.closePath(); c.fill(); c.stroke();
    c.restore();
    // north tick
    const nx = h + Math.sin(rot) * (h - 9), ny = h - Math.cos(rot) * (h - 9);
    c.fillStyle = '#14181e'; c.beginPath(); c.arc(nx, ny, 8, 0, 7); c.fill(); c.fillStyle = '#ffd23f'; c.font = 'bold 10px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('N', nx, ny + 0.5);
  }
  drawFull(c: CanvasRenderingContext2D, size: number, o: MapOverlay) {
    const s = size / WORLD;
    c.clearRect(0, 0, size, size); c.drawImage(this.base, 0, 0, size, size);
    const w2s = (x: number, z: number): [number, number] => [(x + WORLD / 2) * s, (WORLD / 2 - z) * s];
    c.fillStyle = 'rgba(40,34,24,0.62)'; c.font = '600 13px Georgia, serif'; c.textAlign = 'center';
    const labels: [string, number, number][] = [['canal', -330, 120], ['glassline', 40, 330], ['lantern', 335, 215], ['tide', 40, 100], ['foundry', 300, -240], ['breakwater', -60, -420]];
    for (const [z, x, y] of labels) { const [px, py] = w2s(x, y); c.fillText(ZONE_NAMES[z as keyof typeof ZONE_NAMES].toUpperCase(), px, py); }
    this.marks(c, o, w2s, s, 0, 0, 0);
    const [px, py] = w2s(o.px, o.pz);
    c.save(); c.translate(px, py); c.rotate(o.yaw);
    c.fillStyle = '#ffffff'; c.strokeStyle = '#14181e'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -10); c.lineTo(7, 8); c.lineTo(0, 4); c.lineTo(-7, 8); c.closePath(); c.fill(); c.stroke(); c.restore();
  }
  /** Convert a click on the full map (pixels) to world coordinates. */
  fullToWorld(px: number, py: number, size: number): [number, number] { return [(px / size) * WORLD - WORLD / 2, WORLD / 2 - (py / size) * WORLD]; }
}
export const STATIC_MARKS: MapMark[] = [
  { ...ANCHORS.safehouse, kind: 'safe', label: 'Safehouse' }, { ...ANCHORS.quayMart, kind: 'shop', label: 'Quay Mart' }, { ...ANCHORS.supply, kind: 'shop', label: 'Harbor Supply' },
  { ...ANCHORS.clothing, kind: 'shop', label: 'Thread & Tide' }, { ...ANCHORS.garage, kind: 'garage', label: 'Breakwater Auto & Marine' },
  { ...ANCHORS.clockTower, kind: 'landmark', label: 'Clock tower' }, { x: 312, z: 300, kind: 'landmark', label: 'The Lantern' }, { ...ANCHORS.precinct, kind: 'landmark', label: 'Glassline Substation' },
];
