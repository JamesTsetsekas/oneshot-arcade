// Minimap + full city map, pre-rendered from the road graph.

import type { World } from "../sim/world/city";
import type { Session } from "../sim/session/session";
import { TIER_INFO } from "../sim/score/score";

const PX = 1.0; // pixels per metre in the base map
const OX = 720, OZ = 540; // map canvas origin offset (world x=-720 -> 0)

export class MapRenderer {
  base: HTMLCanvasElement;
  constructor(private world: World) {
    const c = (this.base = document.createElement("canvas"));
    c.width = 1440 * PX;
    c.height = 1080 * PX;
    const g = c.getContext("2d")!;
    const tx = (x: number) => (x + OX) * PX, tz = (z: number) => (OZ - z) * PX;
    g.fillStyle = "#2a3954";
    g.fillRect(0, 0, c.width, c.height);
    // sea
    g.fillStyle = "#1f6fa8";
    g.fillRect(0, tz(-356), c.width, c.height);
    g.fillStyle = "#e7cf8f";
    g.fillRect(tx(-688), tz(-356), tx(-4) - tx(-688), tz(-432) - tz(-356));
    g.fillStyle = "#5c6a80";
    g.fillRect(tx(4), tz(-352), tx(688) - tx(4), tz(-472) - tz(-352));
    g.fillStyle = "#1f6fa8";
    g.fillRect(tx(392), tz(-362), tx(428) - tx(392), c.height);
    for (const cut of world.cuts) g.fillRect(tx(cut.minX), tz(cut.maxZ), (cut.maxX - cut.minX) * PX, (cut.maxZ - cut.minZ) * PX);
    for (const zn of world.zones) {
      if (zn.kind === "beach" || zn.kind === "quay") continue;
      g.fillStyle = zn.surface === "grass" ? "#3f7d4a" : "#6b7790";
      g.fillRect(tx(zn.minX), tz(zn.maxZ), (zn.maxX - zn.minX) * PX, (zn.maxZ - zn.minZ) * PX);
    }
    g.fillStyle = "#3b4a66";
    for (const b of world.buildings) g.fillRect(tx(b.minX), tz(b.maxZ), (b.maxX - b.minX) * PX, (b.maxZ - b.minZ) * PX);
    // shortcuts
    g.lineCap = "round";
    for (const sc of world.shortcuts) {
      g.strokeStyle = sc.color + "aa";
      g.lineWidth = 5 * PX;
      g.setLineDash([6, 5]);
      g.beginPath();
      sc.points.forEach(([x, z], i) => (i ? g.lineTo(tx(x), tz(z)) : g.moveTo(tx(x), tz(z))));
      g.stroke();
    }
    g.setLineDash([]);
    // roads
    for (const e of world.edges) {
      const A = world.nodes[e.a], B = world.nodes[e.b];
      g.strokeStyle = e.kind === "highline" ? "#ffe9b0" : e.kind === "boulevard" ? "#f4f1e6" : e.kind === "cobble" ? "#d9c3a0" : "#dfe6ef";
      g.lineWidth = e.halfWidth * 2 * PX;
      g.beginPath();
      g.moveTo(tx(A.x), tz(A.z));
      g.lineTo(tx(B.x), tz(B.z));
      g.stroke();
      if (e.rushLane) {
        g.strokeStyle = "#ff3b4e";
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(tx(A.x), tz(A.z));
        g.lineTo(tx(B.x), tz(B.z));
        g.stroke();
      }
    }
    for (const d of world.destinations) {
      g.fillStyle = d.color;
      g.beginPath();
      g.arc(tx(d.lx), tz(d.lz), Math.max(5, d.lr * 0.6) * PX, 0, Math.PI * 2);
      g.fill();
    }
  }

  private shape(g: CanvasRenderingContext2D, shape: string, x: number, y: number, r: number, color: string) {
    g.fillStyle = color;
    g.strokeStyle = "#0b0f17";
    g.lineWidth = 2;
    g.beginPath();
    if (shape === "circle") g.arc(x, y, r, 0, Math.PI * 2);
    else if (shape === "diamond") { g.moveTo(x, y - r * 1.2); g.lineTo(x + r, y); g.lineTo(x, y + r * 1.2); g.lineTo(x - r, y); g.closePath(); }
    else if (shape === "star") {
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
        const rr = i % 2 ? r * 0.5 : r * 1.25;
        i ? g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      }
      g.closePath();
    } else {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        i ? g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) : g.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      }
      g.closePath();
    }
    g.fill();
    g.stroke();
  }

  /** Heading-up minimap around the taxi. */
  drawMini(c: HTMLCanvasElement, s: Session, colorblind: boolean) {
    const g = c.getContext("2d")!;
    const W = c.width, H = c.height;
    const zoom = 0.9 * (W / 210);
    const v = s.v;
    g.save();
    g.fillStyle = "#22304a";
    g.fillRect(0, 0, W, H);
    g.translate(W / 2, H / 2 + H * 0.12);
    g.rotate(-v.yaw);
    g.scale(zoom, zoom);
    g.translate(-(v.x + OX) * PX, -(OZ - v.z) * PX);
    g.drawImage(this.base, 0, 0);
    const tx = (x: number) => (x + OX) * PX, tz = (z: number) => (OZ - z) * PX;
    // route
    if (s.route.length > 1) {
      g.strokeStyle = s.active ? TIER_INFO[s.active.fare.tier].color : "#ffe37a";
      g.lineWidth = 5 / zoom * 2;
      g.lineJoin = "round";
      g.beginPath();
      s.route.forEach(([x, z], i) => (i ? g.lineTo(tx(x), tz(z)) : g.moveTo(tx(x), tz(z))));
      g.stroke();
    }
    g.restore();
    // markers drawn unrotated (icons stay upright)
    const toScreen = (x: number, z: number) => {
      const dx = x - v.x, dz = z - v.z;
      const c0 = Math.cos(v.yaw), s0 = Math.sin(v.yaw);
      // rotate world so heading is up
      const rx = dx * c0 - dz * s0;
      const rz = dx * s0 + dz * c0;
      return [W / 2 + rx * zoom * PX, H / 2 + H * 0.12 - rz * zoom * PX];
    };
    const clampR = (p: number[]) => {
      const cx = W / 2, cy = H / 2;
      const dx = p[0] - cx, dy = p[1] - cy;
      const d = Math.hypot(dx, dy);
      const R = W / 2 - 12;
      return d > R ? [cx + (dx / d) * R, cy + (dy / d) * R] : p;
    };
    if (!s.active) {
      for (const f of s.fares.candidates) {
        const info = TIER_INFO[f.tier];
        const col = colorblind ? ({ short: "#56b4e9", medium: "#e69f00", long: "#cc79a7", special: "#f0e442" } as Record<string, string>)[f.tier] : info.color;
        const p = clampR(toScreen(f.pickup.x, f.pickup.z));
        this.shape(g, info.shape, p[0], p[1], 7, col);
      }
    } else {
      const d = s.active.fare.dest;
      const p = clampR(toScreen(d.x, d.z));
      g.fillStyle = "#ffffff";
      g.strokeStyle = TIER_INFO[s.active.fare.tier].color;
      g.lineWidth = 4;
      g.beginPath();
      g.arc(p[0], p[1], 9, 0, Math.PI * 2);
      g.fill();
      g.stroke();
    }
    // player arrow
    g.fillStyle = "#fff";
    g.strokeStyle = "#ff3fb4";
    g.lineWidth = 2.5;
    g.beginPath();
    const px = W / 2, py = H / 2 + H * 0.12;
    g.moveTo(px, py - 11);
    g.lineTo(px + 8, py + 8);
    g.lineTo(px, py + 4);
    g.lineTo(px - 8, py + 8);
    g.closePath();
    g.fill();
    g.stroke();
  }

  /** North-up full map with labels. */
  drawFull(c: HTMLCanvasElement, s: Session | null, discovered: Set<string>) {
    const g = c.getContext("2d")!;
    const W = c.width, H = c.height;
    g.clearRect(0, 0, W, H);
    const k = Math.min(W / this.base.width, H / this.base.height) * 0.98;
    const ox = (W - this.base.width * k) / 2, oy = (H - this.base.height * k) / 2;
    g.drawImage(this.base, ox, oy, this.base.width * k, this.base.height * k);
    const tx = (x: number) => ox + (x + OX) * PX * k, tz = (z: number) => oy + (OZ - z) * PX * k;
    g.font = `700 ${Math.max(10, 12 * k * 1.4)}px Segoe UI, Arial, sans-serif`;
    g.textAlign = "center";
    for (const d of this.world.destinations) {
      g.fillStyle = "#fff";
      g.strokeStyle = "rgba(0,0,0,0.7)";
      g.lineWidth = 3;
      g.strokeText(d.name, tx(d.lx), tz(d.lz) - 8);
      g.fillText(d.name, tx(d.lx), tz(d.lz) - 8);
    }
    for (const sc of this.world.shortcuts) {
      const [x, z] = this.world.pointAlong(sc.points, 0.5);
      const known = discovered.has(sc.id);
      g.fillStyle = known ? sc.color : "rgba(255,255,255,0.55)";
      g.strokeText(known ? sc.name : "???", tx(x), tz(z) + 4);
      g.fillText(known ? sc.name : "???", tx(x), tz(z) + 4);
    }
    if (s) {
      if (s.route.length > 1) {
        g.strokeStyle = s.active ? TIER_INFO[s.active.fare.tier].color : "#ffe37a";
        g.lineWidth = 4;
        g.beginPath();
        s.route.forEach(([x, z], i) => (i ? g.lineTo(tx(x), tz(z)) : g.moveTo(tx(x), tz(z))));
        g.stroke();
      }
      if (!s.active) for (const f of s.fares.candidates) this.shape(g, TIER_INFO[f.tier].shape, tx(f.pickup.x), tz(f.pickup.z), 7, TIER_INFO[f.tier].color);
      g.fillStyle = "#fff";
      g.beginPath();
      g.arc(tx(s.v.x), tz(s.v.z), 7, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "#ff3fb4";
      g.lineWidth = 3;
      g.stroke();
    }
  }
}
