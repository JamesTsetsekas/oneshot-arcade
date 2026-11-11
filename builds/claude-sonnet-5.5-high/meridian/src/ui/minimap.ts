import type { Game } from '../sim/game';
import type { World, PoiKind } from '../sim/world';
import { LINES, ROAD_HALF, SEA_Z } from '../sim/world';
import { isecPos } from '../sim/nav';
import { fwd } from '../core/math';

const S = 1.5; // base pixels per metre
const X0 = -310;
const Z1 = 300;
const W = 620;
const H = 640;

export interface MapFilters { missions: boolean; shops: boolean; landmarks: boolean; police: boolean }

const POI_STYLE: Partial<Record<PoiKind, { c: string; t: string; group: 'missions' | 'shops' | 'landmarks' | 'always' }>> = {
  safehouse: { c: '#2a8a80', t: 'S', group: 'always' }, store: { c: '#3b6fd9', t: '$', group: 'shops' }, kiosk: { c: '#c94f3b', t: 'K', group: 'shops' },
  garage: { c: '#b8862f', t: 'G', group: 'shops' }, precinct: { c: '#24365a', t: 'P', group: 'always' }, courier: { c: '#e09a2b', t: 'C', group: 'missions' },
  viewpoint: { c: '#8e5fc8', t: '*', group: 'landmarks' },
};

const DISTRICT_FILL: Record<string, string> = {
  'Tide Market': '#e2c9a0', 'Foundry Row': '#bfb7aa', Glassline: '#b5c6cf', 'Lantern Hill': '#d6b9a4', Breakwater: '#c9c4b0', 'Canal Loop': '#bcd2a8', Outskirts: '#a9a291',
};

export class MapRenderer {
  base: HTMLCanvasElement;

  constructor(world: World) {
    this.base = document.createElement('canvas');
    this.base.width = Math.ceil(W * S);
    this.base.height = Math.ceil(H * S);
    this.paintBase(world);
  }

  px(x: number): number { return (x - X0) * S; }
  py(z: number): number { return (Z1 - z) * S; }

  private paintBase(world: World): void {
    const c = this.base.getContext('2d')!;
    c.fillStyle = '#4a8ea8';
    c.fillRect(0, 0, this.base.width, this.base.height);
    // land
    c.fillStyle = '#d9cfae';
    c.fillRect(this.px(-300), this.py(300), 600 * S, (300 - SEA_Z) * S);
    // outer ring
    c.fillStyle = DISTRICT_FILL.Outskirts;
    for (const b of world.buildings) if (b.district === 'Outskirts') c.fillRect(this.px(b.minX), this.py(b.maxZ), (b.maxX - b.minX) * S, (b.maxZ - b.minZ) * S);
    // blocks
    for (const b of world.blocks) {
      c.fillStyle = b.kind === 'park' ? '#a9c98f' : b.kind === 'plaza' ? '#e8d3a8' : '#e9e1c8';
      c.fillRect(this.px(b.cx - 34), this.py(b.cz + 34), 68 * S, 68 * S);
    }
    // buildings
    for (const b of world.buildings) {
      if (b.district === 'Outskirts') continue;
      c.fillStyle = DISTRICT_FILL[b.district];
      c.fillRect(this.px(b.minX), this.py(b.maxZ), (b.maxX - b.minX) * S, (b.maxZ - b.minZ) * S);
      c.strokeStyle = 'rgba(70,60,45,0.45)';
      c.lineWidth = 1;
      c.strokeRect(this.px(b.minX), this.py(b.maxZ), (b.maxX - b.minX) * S, (b.maxZ - b.minZ) * S);
    }
    // containers
    c.fillStyle = '#b5946a';
    for (const p of world.props) if (p.kind === 'container' || p.kind === 'stall') c.fillRect(this.px(p.x - p.w / 2), this.py(p.z + p.d / 2), p.w * S, p.d * S);
    // roads
    c.strokeStyle = '#7d7a70';
    c.lineCap = 'butt';
    c.lineWidth = ROAD_HALF * 2 * S;
    for (const l of LINES) {
      c.beginPath(); c.moveTo(this.px(l), this.py(-246)); c.lineTo(this.px(l), this.py(246)); c.stroke();
      c.beginPath(); c.moveTo(this.px(-246), this.py(l)); c.lineTo(this.px(246), this.py(l)); c.stroke();
    }
    c.strokeStyle = '#f2ecd8';
    c.lineWidth = 1;
    c.setLineDash([6, 8]);
    for (const l of LINES) {
      c.beginPath(); c.moveTo(this.px(l), this.py(-246)); c.lineTo(this.px(l), this.py(246)); c.stroke();
      c.beginPath(); c.moveTo(this.px(-246), this.py(l)); c.lineTo(this.px(246), this.py(l)); c.stroke();
    }
    c.setLineDash([]);
    // canal
    c.fillStyle = '#4a8ea8';
    c.fillRect(this.px(world.canal.minX), this.py(world.canal.maxZ), (world.canal.maxX - world.canal.minX) * S, (world.canal.maxZ - world.canal.minZ) * S);
    // district labels
    c.fillStyle = 'rgba(40,50,50,0.55)';
    c.font = 'bold 13px sans-serif';
    c.textAlign = 'center';
    const labels: Array<[string, number, number]> = [['TIDE MARKET', -120, -70], ['FOUNDRY ROW', 120, -70], ['GLASSLINE', 120, 120], ['LANTERN HILL', -160, 160], ['BREAKWATER', 0, -200], ['CANAL LOOP', -40, 80]];
    for (const [t, x, z] of labels) c.fillText(t, this.px(x), this.py(z));
    c.fillStyle = 'rgba(255,255,255,0.7)';
    c.fillText('HARBOR', this.px(0), this.py(-290));
  }

  /** Draw dynamic overlays given a world->canvas transform already applied (units: base pixels). */
  private drawDynamic(c: CanvasRenderingContext2D, g: Game, inv: number, f: MapFilters, route: Array<{ x: number; z: number }> | null, big: boolean): void {
    // landmarks / pois
    for (const p of g.world.pois) {
      const st = POI_STYLE[p.kind];
      if (!st) continue;
      if (st.group === 'missions' && !f.missions) continue;
      if (st.group === 'shops' && !f.shops) continue;
      if (st.group === 'landmarks' && (!f.landmarks || !g.player.discovered.includes(p.id) && !big)) continue;
      this.badge(c, this.px(p.x), this.py(p.z), st.c, st.t, inv * (big ? 1.05 : 1));
    }
    // police search area
    if (f.police && g.police.tier > 0 && g.police.lastKnown && (g.police.ident === 'Search' || g.police.ident === 'Cooling' || g.police.ident === 'Identified')) {
      const lk = g.police.lastKnown;
      c.fillStyle = 'rgba(255,70,50,0.14)';
      c.strokeStyle = 'rgba(255,70,50,0.8)';
      c.lineWidth = 2 * inv;
      c.setLineDash([8 * inv, 6 * inv]);
      c.beginPath(); c.arc(this.px(lk.x), this.py(lk.z), g.police.searchRadius * S, 0, Math.PI * 2); c.fill(); c.stroke();
      c.setLineDash([]);
    }
    // route
    if (route && route.length > 1) {
      c.strokeStyle = '#ff7a2f';
      c.lineWidth = 4 * inv;
      c.lineJoin = 'round';
      c.beginPath();
      route.forEach((p, i) => (i ? c.lineTo(this.px(p.x), this.py(p.z)) : c.moveTo(this.px(p.x), this.py(p.z))));
      c.stroke();
    }
    // mission marker
    const m = g.currentMarker();
    if (m) {
      if (m.r > 0) { c.fillStyle = 'rgba(255,200,60,0.18)'; c.strokeStyle = '#ffc83c'; c.lineWidth = 2 * inv; c.beginPath(); c.arc(this.px(m.x), this.py(m.z), m.r * S, 0, Math.PI * 2); c.fill(); c.stroke(); }
      this.badge(c, this.px(m.x), this.py(m.z), '#ffb400', '!', inv * 1.2);
    }
    // police units seen nearby (never the full roster)
    if (f.police) {
      const P = g.player.human;
      for (const v of g.vehicles) {
        if (!v.alive || v.owner !== 'police') continue;
        if (Math.hypot(v.x - P.x, v.z - P.z) > (big ? 90 : 120)) continue;
        c.fillStyle = Math.floor(g.t * 3) % 2 ? '#4a7bff' : '#ff4a4a';
        c.fillRect(this.px(v.x) - 4 * inv, this.py(v.z) - 4 * inv, 8 * inv, 8 * inv);
      }
      for (const h of g.humans) {
        if (h.kind !== 'police' || !h.alive || h.vehicleId !== null) continue;
        if (Math.hypot(h.x - P.x, h.z - P.z) > 90) continue;
        c.fillStyle = '#4a7bff';
        c.beginPath(); c.arc(this.px(h.x), this.py(h.z), 3 * inv, 0, Math.PI * 2); c.fill();
      }
    }
    // player arrow
    const p = g.player.human;
    c.save();
    c.translate(this.px(p.x), this.py(p.z));
    const pv = g.playerVehicle();
    c.rotate(pv ? pv.heading : p.heading);
    c.fillStyle = '#fff';
    c.strokeStyle = '#0f3b3f';
    c.lineWidth = 2 * inv;
    c.beginPath(); c.moveTo(0, -9 * inv); c.lineTo(6 * inv, 7 * inv); c.lineTo(0, 3 * inv); c.lineTo(-6 * inv, 7 * inv); c.closePath(); c.fill(); c.stroke();
    c.restore();
  }

  private badge(c: CanvasRenderingContext2D, x: number, y: number, col: string, t: string, inv: number): void {
    c.fillStyle = col;
    c.strokeStyle = '#fff';
    c.lineWidth = 1.5 * inv;
    c.beginPath(); c.arc(x, y, 8 * inv, 0, Math.PI * 2); c.fill(); c.stroke();
    c.fillStyle = '#fff';
    c.font = `bold ${11 * inv}px sans-serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(t, x, y + 0.5 * inv);
  }

  /** Circular minimap. metres = visible world width. */
  drawMini(canvas: HTMLCanvasElement, g: Game, metres: number, rotate: boolean, route: Array<{ x: number; z: number }> | null, filters: MapFilters): void {
    const c = canvas.getContext('2d')!;
    const size = canvas.width;
    const scale = size / (metres * S);
    c.save();
    c.fillStyle = '#4a8ea8';
    c.fillRect(0, 0, size, size);
    const pv = g.playerVehicle();
    const p = g.player.human;
    c.translate(size / 2, size / 2);
    if (rotate) c.rotate(-(pv ? pv.heading : g.player.camYaw));
    c.scale(scale, scale);
    c.translate(-this.px(p.x), -this.py(p.z));
    c.drawImage(this.base, 0, 0);
    this.drawDynamic(c, g, 1 / scale * 1.0, filters, route, false);
    c.restore();
    // camera frustum hint
    c.save();
    c.translate(size / 2, size / 2);
    const yaw = g.player.camYaw - (rotate ? (pv ? pv.heading : g.player.camYaw) : 0);
    c.rotate(yaw);
    const grad = c.createLinearGradient(0, 0, 0, -size * 0.35);
    grad.addColorStop(0, 'rgba(255,255,255,0.28)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = grad;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(-size * 0.17, -size * 0.35); c.lineTo(size * 0.17, -size * 0.35); c.closePath(); c.fill();
    c.restore();
  }

  drawFull(canvas: HTMLCanvasElement, g: Game, route: Array<{ x: number; z: number }> | null, filters: MapFilters, waypoint: { x: number; z: number } | null): void {
    const c = canvas.getContext('2d')!;
    const k = canvas.width / this.base.width;
    c.save();
    c.scale(k, k);
    c.drawImage(this.base, 0, 0);
    this.drawDynamic(c, g, 1 / k, filters, route, true);
    if (waypoint) { c.fillStyle = '#17b8ff'; c.strokeStyle = '#fff'; c.lineWidth = 2 / k; c.beginPath(); c.arc(this.px(waypoint.x), this.py(waypoint.z), 9 / k, 0, Math.PI * 2); c.fill(); c.stroke(); }
    c.restore();
  }

  toWorld(canvas: HTMLCanvasElement, ex: number, ey: number): { x: number; z: number } {
    const k = canvas.width / this.base.width;
    return { x: ex / k / S + X0, z: Z1 - ey / k / S };
  }
}

/** GPS: route on the road graph from the player to a target, as a polyline. */
export function gpsRoute(g: Game, target: { x: number; z: number }): Array<{ x: number; z: number }> {
  const p = g.player.human;
  const a = g.roads.nearestIntersection(p.x, p.z);
  const b = g.roads.nearestIntersection(target.x, target.z);
  const nodes = g.roads.route(a, b);
  const pts = nodes.map((n) => isecPos(n));
  const out: Array<{ x: number; z: number }> = [{ x: p.x, z: p.z }];
  const snap = g.roads.roadSnap(p.x, p.z);
  out.push(snap);
  // avoid doubling back to the first intersection if already past it
  for (const q of pts) out.push(q);
  const tsnap = g.roads.roadSnap(target.x, target.z);
  out.push(tsnap, { x: target.x, z: target.z });
  void fwd;
  return out;
}
