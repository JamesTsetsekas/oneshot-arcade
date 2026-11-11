// Procedurally generated textures (canvas 2D) — no external image assets.
import { Scene, DynamicTexture, Texture } from "@babylonjs/core";

type Painter = (ctx: CanvasRenderingContext2D, s: number, rnd: () => number) => void;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function noise(ctx: CanvasRenderingContext2D, s: number, rnd: () => number, base: [number, number, number], amp: number, count = 6000, size = 2) {
  ctx.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`;
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < count; i++) {
    const v = (rnd() - 0.5) * amp;
    ctx.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${Math.abs(v) / 255})`;
    const w = size * (0.5 + rnd());
    ctx.fillRect(rnd() * s, rnd() * s, w, w);
  }
}
function blotches(ctx: CanvasRenderingContext2D, s: number, rnd: () => number, color: string, n: number, rmax: number) {
  for (let i = 0; i < n; i++) {
    const x = rnd() * s, y = rnd() * s, r = rmax * (0.3 + rnd());
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
}

const PAINTERS: Record<string, Painter> = {
  concrete: (c, s, r) => {
    noise(c, s, r, [150, 150, 146], 40, 9000, 2);
    blotches(c, s, r, "rgba(60,60,55,0.10)", 14, s / 4);
    blotches(c, s, r, "rgba(255,255,250,0.06)", 10, s / 5);
    c.strokeStyle = "rgba(40,40,40,0.35)"; c.lineWidth = 2;
    c.strokeRect(1, 1, s - 2, s - 2);
    c.strokeStyle = "rgba(40,40,40,0.15)"; c.lineWidth = 1;
    for (let i = 0; i < 3; i++) { c.beginPath(); let x = r() * s, y = r() * s; c.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 40; y += (r() - 0.5) * 40; c.lineTo(x, y); } c.stroke(); }
  },
  composite: (c, s, r) => {
    noise(c, s, r, [214, 211, 200], 18, 5000, 2);
    const g = c.createLinearGradient(0, s, 0, 0); g.addColorStop(0, "rgba(90,85,70,0.22)"); g.addColorStop(0.35, "rgba(90,85,70,0)");
    c.fillStyle = g; c.fillRect(0, 0, s, s);
    c.strokeStyle = "rgba(70,70,65,0.55)"; c.lineWidth = 2;
    c.beginPath(); c.moveTo(0, s / 2); c.lineTo(s, s / 2); c.moveTo(s / 2, 0); c.lineTo(s / 2, s); c.stroke();
    c.fillStyle = "rgba(60,60,60,0.5)";
    for (const [x, y] of [[8, 8], [s / 2 - 8, 8], [s / 2 + 8, 8], [s - 8, 8], [8, s / 2 + 8], [s - 8, s / 2 + 8]]) { c.beginPath(); c.arc(x, y, 2, 0, 7); c.fill(); }
    blotches(c, s, r, "rgba(120,100,70,0.08)", 6, s / 4);
  },
  metal: (c, s, r) => {
    noise(c, s, r, [118, 124, 128], 22, 3000, 1);
    for (let y = 0; y < s; y += 2) { c.fillStyle = `rgba(255,255,255,${r() * 0.05})`; c.fillRect(0, y, s, 1); }
    c.strokeStyle = "rgba(30,30,30,0.5)"; c.lineWidth = 2; c.strokeRect(2, 2, s - 4, s - 4);
    blotches(c, s, r, "rgba(110,70,40,0.12)", 5, s / 6);
  },
  orange: (c, s, r) => {
    noise(c, s, r, [222, 110, 36], 26, 4000, 2);
    blotches(c, s, r, "rgba(60,40,30,0.18)", 8, s / 6);
    c.fillStyle = "rgba(255,255,255,0.08)"; c.fillRect(0, 0, s, s * 0.1);
    c.strokeStyle = "rgba(40,30,20,0.45)"; c.lineWidth = 3; c.strokeRect(3, 3, s - 6, s - 6);
  },
  hazard: (c, s) => {
    c.fillStyle = "#e3a21a"; c.fillRect(0, 0, s, s);
    c.fillStyle = "#1d1d1d";
    for (let i = -s; i < s * 2; i += s / 4) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + s / 8, 0); c.lineTo(i + s / 8 - s, s); c.lineTo(i - s, s); c.fill(); }
  },
  grate: (c, s, r) => {
    noise(c, s, r, [70, 74, 78], 20, 2000, 1);
    c.strokeStyle = "rgba(20,22,24,0.9)"; c.lineWidth = 3;
    for (let i = 0; i <= s; i += s / 8) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, s); c.moveTo(0, i); c.lineTo(s, i); c.stroke(); }
    c.strokeStyle = "rgba(160,165,170,0.35)"; c.lineWidth = 1;
    for (let i = 2; i <= s; i += s / 8) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, s); c.stroke(); }
  },
  crate: (c, s, r) => {
    noise(c, s, r, [104, 112, 84], 24, 4000, 2);
    c.strokeStyle = "rgba(30,34,24,0.7)"; c.lineWidth = 6; c.strokeRect(4, 4, s - 8, s - 8);
    c.lineWidth = 3; for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(0, (s * i) / 4); c.lineTo(s, (s * i) / 4); c.stroke(); }
    c.fillStyle = "rgba(230,230,210,0.7)"; c.font = `bold ${s / 9}px monospace`; c.fillText("K17-SUP", s * 0.22, s * 0.58);
  },
  container: (c, s, r) => {
    noise(c, s, r, [200, 200, 200], 20, 3000, 2);
    for (let x = 0; x < s; x += s / 12) {
      const g = c.createLinearGradient(x, 0, x + s / 12, 0);
      g.addColorStop(0, "rgba(0,0,0,0.22)"); g.addColorStop(0.5, "rgba(255,255,255,0.12)"); g.addColorStop(1, "rgba(0,0,0,0.22)");
      c.fillStyle = g; c.fillRect(x, 0, s / 12, s);
    }
    blotches(c, s, r, "rgba(90,50,30,0.18)", 8, s / 7);
  },
  rock: (c, s, r) => {
    noise(c, s, r, [118, 112, 100], 60, 12000, 3);
    blotches(c, s, r, "rgba(40,38,30,0.25)", 20, s / 5);
    blotches(c, s, r, "rgba(170,165,150,0.15)", 16, s / 6);
    blotches(c, s, r, "rgba(90,110,60,0.12)", 6, s / 5);
  },
  roof: (c, s, r) => { noise(c, s, r, [92, 96, 100], 20, 3000, 2); c.strokeStyle = "rgba(30,30,30,0.5)"; c.strokeRect(1, 1, s - 2, s - 2); },
  pipe: (c, s, r) => {
    noise(c, s, r, [160, 150, 110], 20, 3000, 2);
    c.fillStyle = "rgba(40,40,40,0.25)"; for (let x = 0; x < s; x += s / 2) c.fillRect(x, 0, 6, s);
    blotches(c, s, r, "rgba(110,60,30,0.2)", 8, s / 6);
  },
  graphite: (c, s, r) => { noise(c, s, r, [52, 56, 60], 16, 3000, 2); c.strokeStyle = "rgba(120,130,140,0.25)"; c.strokeRect(3, 3, s - 6, s - 6); },
  tile: (c, s, r) => {
    noise(c, s, r, [168, 172, 170], 18, 3000, 2);
    c.strokeStyle = "rgba(60,64,62,0.6)"; c.lineWidth = 2;
    for (let i = 0; i <= s; i += s / 4) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, s); c.moveTo(0, i); c.lineTo(s, i); c.stroke(); }
  },
  sand: (c, s, r) => noise(c, s, r, [190, 176, 140], 40, 9000, 2),
  cyan: (c, s, r) => { noise(c, s, r, [40, 160, 180], 20, 2000, 2); },
  decal: (c, s) => {
    c.clearRect(0, 0, s, s);
    const g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, "rgba(10,10,10,0.95)"); g.addColorStop(0.25, "rgba(20,20,20,0.85)"); g.addColorStop(0.5, "rgba(40,40,40,0.35)"); g.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = g; c.fillRect(0, 0, s, s);
  },
  soft: (c, s) => {
    c.clearRect(0, 0, s, s);
    const g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.4, "rgba(255,255,255,0.6)"); g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g; c.fillRect(0, 0, s, s);
  },
  smoke: (c, s, r) => {
    c.clearRect(0, 0, s, s);
    for (let i = 0; i < 14; i++) {
      const x = s / 2 + (r() - 0.5) * s * 0.4, y = s / 2 + (r() - 0.5) * s * 0.4, rad = s * (0.18 + r() * 0.2);
      const g = c.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, "rgba(255,255,255,0.55)"); g.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = g; c.fillRect(0, 0, s, s);
    }
  },
  ring: (c, s) => {
    c.clearRect(0, 0, s, s);
    c.strokeStyle = "rgba(255,255,255,1)"; c.lineWidth = s / 18;
    c.beginPath(); c.arc(s / 2, s / 2, s / 2 - s / 18, 0, Math.PI * 2); c.stroke();
    c.lineWidth = s / 40; c.beginPath(); c.arc(s / 2, s / 2, s / 4, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.moveTo(s / 2, s * 0.15); c.lineTo(s / 2, s * 0.85); c.moveTo(s * 0.15, s / 2); c.lineTo(s * 0.85, s / 2); c.stroke();
  },
  flare: (c, s) => {
    c.clearRect(0, 0, s, s);
    const g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.15, "rgba(255,240,200,0.9)"); g.addColorStop(0.4, "rgba(255,200,120,0.25)"); g.addColorStop(1, "rgba(255,160,60,0)");
    c.fillStyle = g; c.fillRect(0, 0, s, s);
    c.fillStyle = "rgba(255,255,255,0.8)"; c.fillRect(0, s / 2 - 1, s, 2); c.fillRect(s / 2 - 1, 0, 2, s);
  },
  footprint: (c, s) => {
    c.clearRect(0, 0, s, s);
    c.fillStyle = "rgba(255,140,40,0.9)";
    c.beginPath(); c.ellipse(s * 0.5, s * 0.6, s * 0.16, s * 0.3, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(s * 0.5, s * 0.2, s * 0.13, s * 0.12, 0, 0, Math.PI * 2); c.fill();
  },
};

/** Convert a height-ish canvas into a tangent-space normal map. */
function toNormal(src: CanvasRenderingContext2D, s: number, strength: number): HTMLCanvasElement {
  const img = src.getImageData(0, 0, s, s).data;
  const out = document.createElement("canvas"); out.width = out.height = s;
  const octx = out.getContext("2d")!;
  const od = octx.createImageData(s, s);
  const h = (x: number, y: number) => img[(((y + s) % s) * s + ((x + s) % s)) * 4] / 255;
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
    const dx = (h(x + 1, y) - h(x - 1, y)) * strength, dy = (h(x, y + 1) - h(x, y - 1)) * strength;
    const l = Math.hypot(dx, dy, 1);
    const i = (y * s + x) * 4;
    od.data[i] = ((-dx / l) * 0.5 + 0.5) * 255; od.data[i + 1] = ((-dy / l) * 0.5 + 0.5) * 255; od.data[i + 2] = (1 / l) * 255; od.data[i + 3] = 255;
  }
  octx.putImageData(od, 0, 0);
  return out;
}

const cache = new Map<string, Texture>();

export function procTexture(scene: Scene, name: string, size = 256, opts: { normal?: number; alpha?: boolean; seed?: number } = {}): Texture {
  const key = `${name}:${size}:${opts.normal ?? 0}:${scene.uid}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const dt = new DynamicTexture(`tex_${key}`, { width: size, height: size }, scene, true);
  const ctx = dt.getContext() as unknown as CanvasRenderingContext2D;
  const painter = PAINTERS[name] ?? PAINTERS.concrete;
  const seed = opts.seed ?? name.split("").reduce((a, c) => a * 31 + c.charCodeAt(0), 7);
  if (opts.normal) {
    // paint grey height version first then convert
    const tmp = document.createElement("canvas"); tmp.width = tmp.height = size;
    const tctx = tmp.getContext("2d")!;
    painter(tctx, size, rng(seed));
    const n = toNormal(tctx, size, opts.normal);
    ctx.drawImage(n, 0, 0);
  } else {
    painter(ctx, size, rng(seed));
  }
  dt.update(true);
  dt.wrapU = Texture.WRAP_ADDRESSMODE; dt.wrapV = Texture.WRAP_ADDRESSMODE;
  dt.anisotropicFilteringLevel = 8;
  if (opts.alpha) dt.hasAlpha = true;
  cache.set(key, dt);
  return dt;
}

export function textTexture(scene: Scene, text: string, color: string, w = 512, h = 96): DynamicTexture {
  const dt = new DynamicTexture(`sign_${text}`, { width: w, height: h }, scene, true);
  const ctx = dt.getContext() as unknown as CanvasRenderingContext2D;
  ctx.fillStyle = "#1b2228"; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = color; ctx.fillRect(0, 0, 12, h);
  ctx.fillStyle = "#eef3f5"; ctx.font = `600 ${Math.floor(h * 0.5)}px "Segoe UI", Arial, sans-serif`;
  ctx.textBaseline = "middle"; ctx.fillText(text, 30, h / 2 + 2);
  dt.update(true);
  return dt;
}

export function clearTextureCache() { cache.clear(); }
