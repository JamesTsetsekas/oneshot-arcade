// client-ui: per-frame HUD layer (crosshair, hit feedback, compass, minimap, indicators). Imperative on purpose:
// these elements change every frame and must never trigger React renders.
import { angleDiff, clamp } from "../../shared/math";
import type { StormView } from "../../shared/protocol/protocol";
import { LOCATIONS } from "../../shared/world/island";
import { MAP_PX, MAP_WORLD, worldToMap } from "./mapRender";

export interface OverlayFrame {
  time: number;
  dt: number;
  show: boolean;
  camYaw: number;
  vfov: number;
  spreadDeg: number;
  crosshair: "none" | "dot" | "cross" | "scope";
  progress: number; // reload/use/charge 0..1 or -1
  progressColor: string;
  px: number;
  pz: number;
  playerYaw: number;
  storm: StormView | null;
  stormVisible: boolean;
  inStorm: boolean;
  healthFrac: number;
  marker: { x: number; z: number } | null;
  skiffPath: { ax: number; az: number; bx: number; bz: number } | null;
  skiff: { x: number; z: number } | null;
  pings: { kind: "capsule" | "caravan"; x: number; z: number; time: number }[];
  minimap: boolean;
  soundIndicators: boolean;
  reducedMotion: boolean;
  project: (x: number, y: number, z: number, out: { x: number; y: number }) => boolean;
}

interface Arc {
  angle: number;
  t: number;
  life: number;
  color: string;
  kind: "damage" | "gun" | "step";
}
interface DmgNum {
  x: number;
  y: number;
  z: number;
  text: string;
  color: string;
  t: number;
  big: boolean;
  ox: number;
}

const out = { x: 0, y: 0 };

export class HudCanvas {
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;
  private w = 0;
  private h = 0;
  private hit = { t: 1, color: "#fff", big: false };
  private arcs: Arc[] = [];
  private nums: DmgNum[] = [];
  private hurt = 0;
  mapImage: HTMLCanvasElement | null = null;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
    this.resize();
  }

  resize(): void {
    this.dpr = Math.min(1.5, window.devicePixelRatio || 1);
    this.w = this.canvas.clientWidth;
    this.h = this.canvas.clientHeight;
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
  }

  hitmarker(kind: "health" | "shield" | "head" | "break" | "kill"): void {
    const colors = { health: "#ffffff", shield: "#62c9ff", head: "#ffd24a", break: "#b9f2ff", kill: "#ff6b4a" };
    this.hit = { t: 0, color: colors[kind], big: kind === "kill" || kind === "head" || kind === "break" };
  }
  damageFrom(worldAngle: number): void {
    this.arcs.push({ angle: worldAngle, t: 0, life: 1.3, color: "#ff5a4a", kind: "damage" });
    this.hurt = 1;
  }
  soundFrom(worldAngle: number, kind: "gun" | "step"): void {
    // quantised to 16 sectors: a broad cone, never an exact bearing
    const q = Math.round(worldAngle / (Math.PI / 8)) * (Math.PI / 8);
    const existing = this.arcs.find((a) => a.kind === kind && Math.abs(angleDiff(a.angle, q)) < 0.01);
    if (existing) {
      existing.t = 0;
      return;
    }
    if (this.arcs.length > 14) return;
    this.arcs.push({ angle: q, t: 0, life: kind === "gun" ? 1.0 : 0.6, color: kind === "gun" ? "#ffe9a8" : "#d8f6ff", kind });
  }
  damageNumber(x: number, y: number, z: number, amount: number, kind: "health" | "shield" | "head"): void {
    if (this.nums.length > 24) this.nums.shift();
    this.nums.push({ x, y, z, text: String(Math.max(1, Math.round(amount))), color: kind === "head" ? "#ffd24a" : kind === "shield" ? "#7fd4ff" : "#ffffff", t: 0, big: kind === "head", ox: (Math.random() - 0.5) * 34 });
  }
  clear(): void {
    this.arcs.length = 0;
    this.nums.length = 0;
    this.hit.t = 1;
    this.hurt = 0;
  }

  draw(f: OverlayFrame): void {
    const c = this.ctx;
    if (this.canvas.clientWidth !== this.w || this.canvas.clientHeight !== this.h) this.resize();
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.clearRect(0, 0, this.w, this.h);
    if (!f.show) return;
    const cx = this.w / 2,
      cy = this.h / 2;
    const ui = clamp(this.h / 900, 0.8, 1.35);

    // ---- screen-edge states (soft, no strobing)
    this.hurt = Math.max(0, this.hurt - f.dt * 1.8);
    const low = f.healthFrac < 0.35 ? (0.35 - f.healthFrac) / 0.35 : 0;
    const red = Math.max(this.hurt * 0.45, low * (0.28 + (f.reducedMotion ? 0 : Math.sin(f.time * 3) * 0.06)));
    if (red > 0.01) {
      const g = c.createRadialGradient(cx, cy, this.h * 0.35, cx, cy, this.h * 0.85);
      g.addColorStop(0, "rgba(255,40,30,0)");
      g.addColorStop(1, `rgba(255,40,30,${red.toFixed(3)})`);
      c.fillStyle = g;
      c.fillRect(0, 0, this.w, this.h);
    }
    if (f.inStorm) {
      const a = 0.34 + (f.reducedMotion ? 0 : Math.sin(f.time * 1.3) * 0.05);
      const g = c.createRadialGradient(cx, cy, this.h * 0.3, cx, cy, this.h * 0.95);
      g.addColorStop(0, "rgba(140,80,255,0)");
      g.addColorStop(1, `rgba(120,60,240,${a.toFixed(3)})`);
      c.fillStyle = g;
      c.fillRect(0, 0, this.w, this.h);
    }

    // ---- damage numbers
    for (let i = this.nums.length - 1; i >= 0; i--) {
      const n = this.nums[i]!;
      n.t += f.dt;
      if (n.t > 0.9) {
        this.nums.splice(i, 1);
        continue;
      }
      if (!f.project(n.x, n.y + 1.9 + n.t * 0.9, n.z, out)) continue;
      const a = n.t < 0.6 ? 1 : 1 - (n.t - 0.6) / 0.3;
      const s = (n.big ? 24 : 18) * ui * (n.t < 0.08 ? 1.5 - n.t * 6 : 1);
      c.font = `800 ${s.toFixed(1)}px "Trebuchet MS", "Segoe UI", sans-serif`;
      c.textAlign = "center";
      c.globalAlpha = a;
      c.lineWidth = 3;
      c.strokeStyle = "rgba(10,20,30,0.75)";
      c.strokeText(n.text, out.x + n.ox, out.y);
      c.fillStyle = n.color;
      c.fillText(n.text, out.x + n.ox, out.y);
      c.globalAlpha = 1;
    }

    // ---- directional arcs
    for (let i = this.arcs.length - 1; i >= 0; i--) {
      const a = this.arcs[i]!;
      a.t += f.dt;
      if (a.t >= a.life) {
        this.arcs.splice(i, 1);
        continue;
      }
      if (a.kind !== "damage" && !f.soundIndicators) continue;
      const rel = angleDiff(f.camYaw, a.angle); // 0 = ahead, + = right
      const alpha = 1 - a.t / a.life;
      const r = (a.kind === "damage" ? 108 : 150) * ui;
      const ang = rel - Math.PI / 2;
      c.globalAlpha = alpha * (a.kind === "damage" ? 0.95 : a.kind === "gun" ? 0.7 : 0.4);
      c.strokeStyle = a.color;
      c.lineCap = "round";
      c.lineWidth = (a.kind === "damage" ? 7 : 4) * ui;
      c.beginPath();
      const half = a.kind === "damage" ? 0.3 : a.kind === "gun" ? 0.16 : 0.08;
      c.arc(cx, cy, r, ang - half, ang + half);
      c.stroke();
      if (a.kind !== "damage") {
        // small glyph: gun = double tick, step = single dot
        const gx = cx + Math.cos(ang) * (r + 12 * ui),
          gy = cy + Math.sin(ang) * (r + 12 * ui);
        c.fillStyle = a.color;
        c.beginPath();
        c.arc(gx, gy, (a.kind === "gun" ? 3.5 : 2.2) * ui, 0, Math.PI * 2);
        c.fill();
      }
      c.globalAlpha = 1;
    }

    // ---- crosshair
    if (f.crosshair !== "none") {
      const pxPerRad = this.h / 2 / Math.tan(f.vfov / 2);
      const gap = clamp(Math.tan((f.spreadDeg * Math.PI) / 180) * pxPerRad, 3, 120);
      c.lineCap = "butt";
      const drawCross = (color: string, width: number): void => {
        c.strokeStyle = color;
        c.lineWidth = width;
        const len = f.crosshair === "scope" ? 14 * ui : 9 * ui;
        c.beginPath();
        c.moveTo(cx - gap - len, cy);
        c.lineTo(cx - gap, cy);
        c.moveTo(cx + gap, cy);
        c.lineTo(cx + gap + len, cy);
        c.moveTo(cx, cy - gap - len);
        c.lineTo(cx, cy - gap);
        c.moveTo(cx, cy + gap);
        c.lineTo(cx, cy + gap + len);
        c.stroke();
      };
      if (f.crosshair !== "dot") {
        drawCross("rgba(10,20,30,0.7)", 4.2);
        drawCross("#ffffff", 2);
      }
      c.fillStyle = "rgba(10,20,30,0.7)";
      c.beginPath();
      c.arc(cx, cy, 2.6, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#ffffff";
      c.beginPath();
      c.arc(cx, cy, 1.5, 0, Math.PI * 2);
      c.fill();
    }
    if (f.progress >= 0) {
      c.strokeStyle = "rgba(10,20,30,0.55)";
      c.lineWidth = 6 * ui;
      c.beginPath();
      c.arc(cx, cy, 30 * ui, 0, Math.PI * 2);
      c.stroke();
      c.strokeStyle = f.progressColor;
      c.lineWidth = 4 * ui;
      c.lineCap = "round";
      c.beginPath();
      c.arc(cx, cy, 30 * ui, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(f.progress, 0, 1));
      c.stroke();
    }
    // hit marker
    this.hit.t += f.dt * 3.6;
    if (this.hit.t < 1) {
      const k = 1 - this.hit.t;
      const s = (this.hit.big ? 15 : 11) * ui * (1 + (1 - k) * 0.25);
      const g = (this.hit.big ? 8 : 6) * ui;
      c.globalAlpha = k;
      c.lineCap = "round";
      for (const [color, width] of [["rgba(10,20,30,0.8)", 5], [this.hit.color, 2.6]] as const) {
        c.strokeStyle = color;
        c.lineWidth = width;
        c.beginPath();
        for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]] as const) {
          c.moveTo(cx + sx * g, cy + sy * g);
          c.lineTo(cx + sx * (g + s), cy + sy * (g + s));
        }
        c.stroke();
      }
      c.globalAlpha = 1;
    }

    this.drawCompass(f, ui);
    if (f.minimap) this.drawMinimap(f, ui);
  }

  private drawCompass(f: OverlayFrame, ui: number): void {
    const c = this.ctx;
    const cx = this.w / 2;
    const y = 54 * ui;
    const half = 250 * ui;
    const span = 1.9; // radians shown across the strip
    c.save();
    c.beginPath();
    c.rect(cx - half, y - 22 * ui, half * 2, 46 * ui);
    c.clip();
    const grad = c.createLinearGradient(cx - half, 0, cx + half, 0);
    grad.addColorStop(0, "rgba(8,28,40,0)");
    grad.addColorStop(0.2, "rgba(8,28,40,0.42)");
    grad.addColorStop(0.8, "rgba(8,28,40,0.42)");
    grad.addColorStop(1, "rgba(8,28,40,0)");
    c.fillStyle = grad;
    c.fillRect(cx - half, y - 14 * ui, half * 2, 28 * ui);
    const names = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    c.textAlign = "center";
    c.textBaseline = "middle";
    for (let d = 0; d < 360; d += 15) {
      const a = (d * Math.PI) / 180;
      const rel = angleDiff(f.camYaw, a);
      if (Math.abs(rel) > span / 2 + 0.1) continue;
      const x = cx + (rel / (span / 2)) * half;
      const fade = 1 - Math.pow(Math.abs(rel) / (span / 2), 3);
      c.globalAlpha = clamp(fade, 0, 1);
      if (d % 45 === 0) {
        const major = d % 90 === 0;
        c.font = `${major ? 800 : 600} ${(major ? 16 : 12) * ui}px "Trebuchet MS", "Segoe UI", sans-serif`;
        c.fillStyle = d === 0 ? "#ffd24a" : "#ffffff";
        c.fillText(names[d / 45]!, x, y);
      } else {
        c.fillStyle = "rgba(255,255,255,0.75)";
        c.fillRect(x - 1, y - 4 * ui, 2, 8 * ui);
      }
    }
    const mark = (wx: number, wz: number, color: string, shape: "diamond" | "ring" | "tri"): void => {
      const a = Math.atan2(wx - f.px, wz - f.pz);
      const rel = clamp(angleDiff(f.camYaw, a), -span / 2, span / 2);
      const x = cx + (rel / (span / 2)) * half * 0.98;
      const yy = y + 17 * ui;
      c.globalAlpha = 1;
      c.fillStyle = color;
      c.strokeStyle = "rgba(10,20,30,0.8)";
      c.lineWidth = 1.5;
      c.beginPath();
      if (shape === "diamond") {
        c.moveTo(x, yy - 6 * ui);
        c.lineTo(x + 5 * ui, yy);
        c.lineTo(x, yy + 6 * ui);
        c.lineTo(x - 5 * ui, yy);
        c.closePath();
        c.fill();
        c.stroke();
      } else if (shape === "ring") {
        c.arc(x, yy, 5 * ui, 0, Math.PI * 2);
        c.lineWidth = 2.5;
        c.strokeStyle = color;
        c.stroke();
      } else {
        c.moveTo(x, yy - 6 * ui);
        c.lineTo(x + 6 * ui, yy + 5 * ui);
        c.lineTo(x - 6 * ui, yy + 5 * ui);
        c.closePath();
        c.fill();
        c.stroke();
      }
    };
    c.restore();
    if (f.storm && f.stormVisible && f.storm.state !== "done") mark(f.storm.nx, f.storm.nz, "#ffffff", "ring");
    if (f.marker) mark(f.marker.x, f.marker.z, "#ffd24a", "diamond");
    for (const p of f.pings) if (f.time - p.time < 25) mark(p.x, p.z, p.kind === "capsule" ? "#ffb347" : "#c79bff", "tri");
    // centre notch
    c.fillStyle = "#ffffff";
    c.beginPath();
    c.moveTo(cx, y - 19 * ui);
    c.lineTo(cx + 5 * ui, y - 26 * ui);
    c.lineTo(cx - 5 * ui, y - 26 * ui);
    c.closePath();
    c.fill();
  }

  private drawMinimap(f: OverlayFrame, ui: number): void {
    const c = this.ctx;
    const R = 96 * ui;
    const mx = this.w - R - 22 * ui,
      my = R + 22 * ui;
    const metres = 150; // radius shown
    const scale = R / metres;
    c.save();
    c.beginPath();
    c.arc(mx, my, R, 0, Math.PI * 2);
    c.clip();
    c.fillStyle = "#1e7696";
    c.fillRect(mx - R, my - R, R * 2, R * 2);
    if (this.mapImage) {
      const [ix, iy] = worldToMap(f.px, f.pz, MAP_PX);
      const srcR = (metres / MAP_WORLD) * MAP_PX;
      c.imageSmoothingEnabled = true;
      c.drawImage(this.mapImage, ix - srcR, iy - srcR, srcR * 2, srcR * 2, mx - R, my - R, R * 2, R * 2);
    }
    const toX = (wx: number): number => mx + (wx - f.px) * scale;
    const toY = (wz: number): number => my - (wz - f.pz) * scale;
    if (f.storm && f.stormVisible) {
      const s = f.storm;
      // storm outside the current field
      c.fillStyle = s.state === "calm" ? "rgba(128,70,235,0.16)" : "rgba(128,70,235,0.42)";
      c.beginPath();
      c.rect(mx - R, my - R, R * 2, R * 2);
      c.arc(toX(s.cx), toY(s.cz), Math.max(0.1, s.r * scale), 0, Math.PI * 2, true);
      c.fill("evenodd");
      c.strokeStyle = "#b98cff";
      c.lineWidth = 2.5;
      c.beginPath();
      c.arc(toX(s.cx), toY(s.cz), Math.max(0.1, s.r * scale), 0, Math.PI * 2);
      c.stroke();
      if (s.state !== "done" && s.nr > 0) {
        c.strokeStyle = "#ffffff";
        c.lineWidth = 1.8;
        c.beginPath();
        c.arc(toX(s.nx), toY(s.nz), s.nr * scale, 0, Math.PI * 2);
        c.stroke();
        // route line to the next field when outside it
        const dx = s.nx - f.px,
          dz = s.nz - f.pz;
        const d = Math.hypot(dx, dz);
        if (d > s.nr) {
          c.setLineDash([5, 4]);
          c.strokeStyle = "rgba(255,255,255,0.9)";
          c.beginPath();
          c.moveTo(mx, my);
          const k = (d - s.nr) / d;
          c.lineTo(toX(f.px + dx * k), toY(f.pz + dz * k));
          c.stroke();
          c.setLineDash([]);
        }
      }
    }
    if (f.skiffPath) {
      c.strokeStyle = "rgba(255,255,255,0.8)";
      c.setLineDash([7, 5]);
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(toX(f.skiffPath.ax), toY(f.skiffPath.az));
      c.lineTo(toX(f.skiffPath.bx), toY(f.skiffPath.bz));
      c.stroke();
      c.setLineDash([]);
    }
    for (const p of f.pings) {
      const age = f.time - p.time;
      if (age > 25) continue;
      const x = toX(p.x),
        y = toY(p.z);
      c.strokeStyle = p.kind === "capsule" ? "#ffb347" : "#c79bff";
      c.lineWidth = 2;
      c.globalAlpha = clamp(1 - age / 25, 0.2, 1);
      c.beginPath();
      c.arc(x, y, 5 + ((age * 14) % 14), 0, Math.PI * 2);
      c.stroke();
      c.globalAlpha = 1;
    }
    if (f.marker) {
      let x = toX(f.marker.x),
        y = toY(f.marker.z);
      const d = Math.hypot(x - mx, y - my);
      if (d > R - 8) {
        x = mx + ((x - mx) / d) * (R - 8);
        y = my + ((y - my) / d) * (R - 8);
      }
      c.fillStyle = "#ffd24a";
      c.strokeStyle = "#3a2a00";
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(x, y - 7);
      c.lineTo(x + 5, y);
      c.lineTo(x, y + 7);
      c.lineTo(x - 5, y);
      c.closePath();
      c.fill();
      c.stroke();
    }
    // player arrow
    c.translate(mx, my);
    c.rotate(f.playerYaw);
    c.fillStyle = "#ffffff";
    c.strokeStyle = "#0b2a3a";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(0, -9 * ui);
    c.lineTo(6.5 * ui, 7 * ui);
    c.lineTo(0, 3.5 * ui);
    c.lineTo(-6.5 * ui, 7 * ui);
    c.closePath();
    c.fill();
    c.stroke();
    c.restore();
    c.strokeStyle = "rgba(255,255,255,0.9)";
    c.lineWidth = 3;
    c.beginPath();
    c.arc(mx, my, R, 0, Math.PI * 2);
    c.stroke();
    c.strokeStyle = "rgba(8,28,40,0.55)";
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(mx, my, R + 2.5, 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = "#ffd24a";
    c.font = `800 ${11 * ui}px "Trebuchet MS", sans-serif`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("N", mx, my - R + 9 * ui);
  }
}

/** Shared painter for the full-screen map and the results route map. */
export function drawFullMap(
  ctx: CanvasRenderingContext2D, size: number, image: HTMLCanvasElement,
  o: {
    storm: StormView | null; stormVisible: boolean; px: number; pz: number; yaw: number; showPlayer: boolean;
    marker: { x: number; z: number } | null; skiffPath: { ax: number; az: number; bx: number; bz: number } | null;
    skiff: { x: number; z: number } | null; pings: { kind: "capsule" | "caravan"; x: number; z: number; time: number }[]; time: number;
    route?: number[]; labels: boolean;
  },
): void {
  ctx.clearRect(0, 0, size, size);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(image, 0, 0, size, size);
  const k = size / MAP_WORLD;
  const X = (x: number): number => worldToMap(x, 0, size)[0];
  const Y = (z: number): number => worldToMap(0, z, size)[1];
  if (o.storm && o.stormVisible) {
    const s = o.storm;
    ctx.fillStyle = s.state === "calm" ? "rgba(128,70,235,0.14)" : "rgba(128,70,235,0.4)";
    ctx.beginPath();
    ctx.rect(0, 0, size, size);
    ctx.arc(X(s.cx), Y(s.cz), Math.max(0.1, s.r * k), 0, Math.PI * 2, true);
    ctx.fill("evenodd");
    ctx.strokeStyle = "#b98cff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(X(s.cx), Y(s.cz), Math.max(0.1, s.r * k), 0, Math.PI * 2);
    ctx.stroke();
    if (s.state !== "done" && s.nr > 0) {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(X(s.nx), Y(s.nz), s.nr * k, 0, Math.PI * 2);
      ctx.stroke();
      if (o.showPlayer) {
        const dx = s.nx - o.px,
          dz = s.nz - o.pz,
          d = Math.hypot(dx, dz);
        if (d > s.nr) {
          const t = (d - s.nr) / d;
          ctx.setLineDash([6, 5]);
          ctx.strokeStyle = "rgba(255,255,255,0.95)";
          ctx.beginPath();
          ctx.moveTo(X(o.px), Y(o.pz));
          ctx.lineTo(X(o.px + dx * t), Y(o.pz + dz * t));
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }
  }
  if (o.skiffPath) {
    const p = o.skiffPath;
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 7]);
    ctx.beginPath();
    ctx.moveTo(X(p.ax), Y(p.az));
    ctx.lineTo(X(p.bx), Y(p.bz));
    ctx.stroke();
    ctx.setLineDash([]);
    // direction chevrons
    const ang = Math.atan2(p.bx - p.ax, p.bz - p.az);
    for (const t of [0.3, 0.5, 0.7]) {
      const x = X(p.ax + (p.bx - p.ax) * t),
        y = Y(p.az + (p.bz - p.az) * t);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(6, 5);
      ctx.lineTo(-6, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
  if (o.skiff) {
    ctx.fillStyle = "#ffd24a";
    ctx.strokeStyle = "#3a2a00";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(X(o.skiff.x), Y(o.skiff.z), 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  if (o.route && o.route.length >= 4) {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.beginPath();
    for (let i = 0; i < o.route.length; i += 2) {
      const x = X(o.route[i]!),
        y = Y(o.route[i + 1]!);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.fillStyle = "#ff6b4a";
    ctx.beginPath();
    ctx.arc(X(o.route[o.route.length - 2]!), Y(o.route[o.route.length - 1]!), 5, 0, Math.PI * 2);
    ctx.fill();
  }
  if (o.labels) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const l of LOCATIONS) {
      const fs = l.named ? Math.max(12, size * 0.021) : Math.max(10, size * 0.015);
      ctx.font = `${l.named ? 800 : 600} ${fs}px "Trebuchet MS", "Segoe UI", sans-serif`;
      const y = Y(l.z) - (l.named ? l.r * k * 0.55 : 12);
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(8,28,40,0.85)";
      ctx.strokeText(l.name, X(l.x), y);
      ctx.fillStyle = l.named ? "#ffffff" : "#e6f4f1";
      ctx.fillText(l.name, X(l.x), y);
    }
  }
  for (const p of o.pings) {
    const age = o.time - p.time;
    if (age > 25) continue;
    ctx.strokeStyle = p.kind === "capsule" ? "#ffb347" : "#c79bff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(X(p.x), Y(p.z), 8 + ((age * 16) % 16), 0, Math.PI * 2);
    ctx.stroke();
  }
  if (o.marker) {
    const x = X(o.marker.x),
      y = Y(o.marker.z);
    ctx.fillStyle = "#ffd24a";
    ctx.strokeStyle = "#3a2a00";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - 12);
    ctx.lineTo(x + 8, y);
    ctx.lineTo(x, y + 12);
    ctx.lineTo(x - 8, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  if (o.showPlayer) {
    ctx.save();
    ctx.translate(X(o.px), Y(o.pz));
    ctx.rotate(o.yaw);
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#0b2a3a";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(8.5, 9);
    ctx.lineTo(0, 4.5);
    ctx.lineTo(-8.5, 9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}
