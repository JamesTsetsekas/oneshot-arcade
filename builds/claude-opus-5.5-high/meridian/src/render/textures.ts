// Procedural canvas textures (all original, generated at runtime — no external assets).
import { DynamicTexture, Texture, type Scene } from "@babylonjs/core";
import { Rng } from "../core/math";

export type FacadeStyle = "deco" | "glass" | "industrial" | "brick" | "house" | "shed";

function canvasTex(scene: Scene, name: string, size: number, draw: (ctx: CanvasRenderingContext2D, s: number) => void, wrap = true) {
  const t = new DynamicTexture(name, { width: size, height: size }, scene, true);
  const ctx = t.getContext() as unknown as CanvasRenderingContext2D;
  draw(ctx, size);
  t.update(true);
  if (wrap) { t.wrapU = Texture.WRAP_ADDRESSMODE; t.wrapV = Texture.WRAP_ADDRESSMODE; }
  t.anisotropicFilteringLevel = 4;
  return t;
}

function noise(ctx: CanvasRenderingContext2D, s: number, base: number, amp: number, seed: number, alpha = 1) {
  const r = new Rng(seed);
  const img = ctx.getImageData(0, 0, s, s);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = base + (r.next() - 0.5) * amp;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = Math.max(0, Math.min(255, v));
    img.data[i + 3] = 255 * alpha;
  }
  ctx.putImageData(img, 0, 0);
}

/** Facade tile covering 4×4 window bays (each bay 4 m × 3.5 m). Returns [diffuse, emissive]. */
export function facadeTextures(scene: Scene, style: FacadeStyle, seed: number) {
  const N = 4;
  const r = new Rng(seed);
  const lit: boolean[] = [];
  for (let i = 0; i < N * N; i++) lit.push(r.chance(style === "glass" ? 0.55 : 0.4));
  const drawBay = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, emissive: boolean, on: boolean, i: number) => {
    const rr = new Rng(seed * 31 + i);
    switch (style) {
      case "glass": {
        ctx.fillStyle = emissive ? (on ? `rgb(${200 + rr.int(0, 40)},${185 + rr.int(0, 40)},${140 + rr.int(0, 50)})` : "#000") : `rgb(${70 + rr.int(0, 25)},${100 + rr.int(0, 25)},${120 + rr.int(0, 25)})`;
        ctx.fillRect(x + 2, y + 2, w - 4, h - 6);
        if (!emissive) { ctx.fillStyle = "rgba(255,255,255,0.18)"; ctx.fillRect(x + 2, y + 2, w * 0.35, h - 6); ctx.fillStyle = "#c8d2d8"; ctx.fillRect(x, y + h - 5, w, 5); ctx.fillRect(x, y, 2, h); }
        break;
      }
      case "industrial": case "shed": {
        if (!emissive) {
          for (let k = 0; k < w; k += 6) { ctx.fillStyle = k % 12 ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.08)"; ctx.fillRect(x + k, y, 3, h); }
        }
        if (i % 4 === 1 || i % 4 === 2) {
          const wy = y + h * 0.12, wh = h * 0.22;
          ctx.fillStyle = emissive ? (on ? "#e8c890" : "#000") : "#3a4650";
          ctx.fillRect(x + w * 0.15, wy, w * 0.7, wh);
        }
        break;
      }
      default: {
        const mx = w * (style === "house" ? 0.3 : 0.22), top = h * (style === "deco" ? 0.18 : 0.22), bot = h * 0.22;
        const wx = x + mx, wy = y + top, ww = w - mx * 2, wh = h - top - bot;
        if (!emissive) {
          if (style === "brick") {
            for (let yy = 0; yy < h; yy += 8) for (let xx = (yy / 8) % 2 ? 0 : 8; xx < w; xx += 16) { ctx.fillStyle = `rgba(0,0,0,${0.06 + rr.next() * 0.08})`; ctx.fillRect(x + xx, y + yy, 15, 7); }
          }
          ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.fillRect(wx - 3, wy - 3, ww + 6, wh + 6);
          ctx.fillStyle = "#f2ece0"; ctx.fillRect(wx - 2, wy + wh, ww + 4, 5);
        }
        ctx.fillStyle = emissive ? (on ? `rgb(${230 + rr.int(0, 25)},${180 + rr.int(0, 40)},${110 + rr.int(0, 40)})` : "#000") : `rgb(${45 + rr.int(0, 20)},${60 + rr.int(0, 20)},${75 + rr.int(0, 20)})`;
        if (style === "deco") {
          ctx.beginPath();
          ctx.moveTo(wx, wy + wh); ctx.lineTo(wx, wy + ww / 2); ctx.arc(wx + ww / 2, wy + ww / 2, ww / 2, Math.PI, 0); ctx.lineTo(wx + ww, wy + wh); ctx.closePath(); ctx.fill();
        } else ctx.fillRect(wx, wy, ww, wh);
        if (!emissive) {
          ctx.fillStyle = "rgba(255,255,255,0.15)"; ctx.fillRect(wx + 2, wy + 2, ww * 0.3, wh - 4);
          ctx.fillStyle = "rgba(240,235,225,0.9)"; ctx.fillRect(wx + ww / 2 - 1, wy, 2, wh);
          if (style === "house") { ctx.fillStyle = `rgba(${60 + rr.int(0, 80)},${90 + rr.int(0, 60)},${80 + rr.int(0, 60)},0.9)`; ctx.fillRect(wx - 10, wy, 8, wh); ctx.fillRect(wx + ww + 2, wy, 8, wh); }
          if (style === "deco") { ctx.fillStyle = "rgba(0,0,0,0.12)"; ctx.fillRect(x, y + h - 3, w, 3); }
        }
      }
    }
  };
  const size = 512;
  const make = (emissive: boolean) => canvasTex(scene, `facade_${style}_${emissive ? "e" : "d"}`, size, (ctx, s) => {
    if (emissive) { ctx.fillStyle = "#000"; ctx.fillRect(0, 0, s, s); }
    else if (style === "glass") { ctx.fillStyle = "#9fb4c0"; ctx.fillRect(0, 0, s, s); }
    else { noise(ctx, s, style === "industrial" || style === "shed" ? 200 : 236, 22, seed); }
    const bw = s / N, bh = s / N;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) drawBay(ctx, i * bw, j * bh, bw, bh, emissive, lit[j * N + i], j * N + i);
  });
  return [make(false), make(true)] as const;
}

export function asphaltTexture(scene: Scene) {
  return canvasTex(scene, "asphalt", 256, (ctx, s) => {
    noise(ctx, s, 150, 36, 7);
    const r = new Rng(9);
    for (let k = 0; k < 40; k++) { ctx.fillStyle = `rgba(0,0,0,${r.next() * 0.12})`; ctx.beginPath(); ctx.arc(r.next() * s, r.next() * s, 4 + r.next() * 20, 0, Math.PI * 2); ctx.fill(); }
  });
}

export function pavingTexture(scene: Scene) {
  return canvasTex(scene, "paving", 256, (ctx, s) => {
    noise(ctx, s, 215, 25, 11);
    ctx.strokeStyle = "rgba(0,0,0,0.22)"; ctx.lineWidth = 2;
    for (let k = 0; k <= s; k += s / 4) { ctx.beginPath(); ctx.moveTo(k, 0); ctx.lineTo(k, s); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, k); ctx.lineTo(s, k); ctx.stroke(); }
  });
}

export function groundTexture(scene: Scene) {
  return canvasTex(scene, "groundn", 256, (ctx, s) => {
    noise(ctx, s, 200, 70, 13);
    const r = new Rng(3);
    for (let k = 0; k < 300; k++) { ctx.fillStyle = `rgba(255,255,255,${r.next() * 0.15})`; ctx.fillRect(r.next() * s, r.next() * s, 2, 2); }
  });
}

export function corrugatedTexture(scene: Scene) {
  return canvasTex(scene, "corrugated", 128, (ctx, s) => {
    ctx.fillStyle = "#ddd"; ctx.fillRect(0, 0, s, s);
    for (let x = 0; x < s; x += 8) { ctx.fillStyle = "rgba(0,0,0,0.18)"; ctx.fillRect(x, 0, 3, s); ctx.fillStyle = "rgba(255,255,255,0.2)"; ctx.fillRect(x + 4, 0, 2, s); }
    ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.fillRect(0, 0, s, 4); ctx.fillRect(0, s - 4, s, 4);
  });
}

export function waterNormalTexture(scene: Scene) {
  return canvasTex(scene, "waterbump", 256, (ctx, s) => {
    const img = ctx.createImageData(s, s);
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const a = Math.sin((x / s) * Math.PI * 8 + Math.sin((y / s) * Math.PI * 4) * 1.5);
      const b = Math.cos((y / s) * Math.PI * 10 + Math.sin((x / s) * Math.PI * 6) * 1.2);
      const i = (y * s + x) * 4;
      img.data[i] = 128 + a * 50; img.data[i + 1] = 128 + b * 50; img.data[i + 2] = 255; img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  });
}

export function blobTexture(scene: Scene, name: string, rgb: string) {
  return canvasTex(scene, name, 64, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, `rgba(${rgb},1)`); g.addColorStop(0.4, `rgba(${rgb},0.5)`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.clearRect(0, 0, s, s); ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
  }, false);
}
