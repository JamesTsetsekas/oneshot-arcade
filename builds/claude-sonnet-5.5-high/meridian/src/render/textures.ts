import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import type { Scene } from '@babylonjs/core/scene';
import { Rng } from '../core/rng';
import type { FacadeStyle } from '../sim/world';

export interface FacadeTex { diffuse: DynamicTexture; emissive: DynamicTexture }

function tex(scene: Scene, name: string, w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, repeat = true): DynamicTexture {
  const t = new DynamicTexture(name, { width: w, height: h }, scene, true);
  const ctx = t.getContext() as CanvasRenderingContext2D;
  draw(ctx);
  t.update(true);
  if (repeat) { t.wrapU = Texture.WRAP_ADDRESSMODE; t.wrapV = Texture.WRAP_ADDRESSMODE; }
  t.anisotropicFilteringLevel = 4;
  return t;
}

const noise = (ctx: CanvasRenderingContext2D, w: number, h: number, rng: Rng, amount: number, step = 2): void => {
  for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) {
    const v = (rng.next() - 0.5) * amount;
    ctx.fillStyle = v > 0 ? `rgba(255,255,255,${v})` : `rgba(0,0,0,${-v})`;
    ctx.fillRect(x, y, step, step);
  }
};

/** 8x8 window grid covering 32 m x 28 m. Cell = 128px (4 m x 3.5 m). */
export function facadeTextures(scene: Scene, style: FacadeStyle): FacadeTex {
  const N = 1024;
  const C = N / 8;
  const rng = new Rng(style.length * 97 + style.charCodeAt(0));
  const lit: boolean[][] = [];
  for (let r = 0; r < 8; r++) { lit.push([]); for (let c = 0; c < 8; c++) lit[r].push(rng.chance(style === 'glass' ? 0.5 : 0.34)); }
  const litColors = ['#ffd27a', '#ffe7a8', '#ffc35c', '#d8ecff', '#ffd9a0'];

  const diffuse = tex(scene, 'facade-' + style, N, N, (ctx) => {
    const wall: Record<FacadeStyle, string[]> = {
      stone: ['#dccaa4', '#d6c096'], tile: ['#e6a392', '#8fc4bd'], brick: ['#a4553f', '#94483a'], glass: ['#4f7a8f', '#46707f'], shed: ['#b9c0c4', '#aab2b8'], deco: ['#efe6d3', '#e4d9c0'],
    };
    const base = wall[style];
    ctx.fillStyle = base[0];
    ctx.fillRect(0, 0, N, N);
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const x = c * C;
      const y = r * C;
      if (style === 'glass') {
        // curtain wall panels with a faint sky reflection gradient
        const g = ctx.createLinearGradient(x, y, x + C, y + C);
        g.addColorStop(0, '#6ea4bd');
        g.addColorStop(0.55, '#3f6c80');
        g.addColorStop(1, '#2d5262');
        ctx.fillStyle = g;
        ctx.fillRect(x + 3, y + 3, C - 6, C - 6);
        ctx.strokeStyle = '#cfd8dc';
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 1.5, y + 1.5, C - 3, C - 3);
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.beginPath(); ctx.moveTo(x + 10, y + C - 10); ctx.lineTo(x + C * 0.55, y + 8); ctx.lineTo(x + C * 0.7, y + 8); ctx.lineTo(x + 24, y + C - 10); ctx.fill();
        continue;
      }
      if (style === 'shed') {
        // corrugated panels; a window strip on the top row
        for (let k = 0; k < 16; k++) { ctx.fillStyle = k % 2 ? '#c6ccd0' : '#a7aeb3'; ctx.fillRect(x + k * (C / 16), y, C / 16, C); }
        if (r % 8 === 1 && c % 2 === 0) { ctx.fillStyle = '#31414d'; ctx.fillRect(x + 12, y + 30, C - 24, 40); ctx.strokeStyle = '#e9edf0'; ctx.lineWidth = 3; ctx.strokeRect(x + 12, y + 30, C - 24, 40); }
        if (r === 7 && c % 4 === 1) { ctx.fillStyle = '#e0a93b'; ctx.fillRect(x + 10, y + 20, C - 20, C - 20); ctx.fillStyle = '#7a5d1f'; ctx.fillRect(x + 10, y + 70, C - 20, 4); }
        continue;
      }
      // wall variation per cell
      ctx.fillStyle = base[(r + c) % 2];
      ctx.fillRect(x, y, C, C);
      if (style === 'brick') {
        ctx.strokeStyle = 'rgba(40,20,15,0.35)';
        ctx.lineWidth = 1;
        for (let b = 0; b < C; b += 8) { ctx.beginPath(); ctx.moveTo(x, y + b); ctx.lineTo(x + C, y + b); ctx.stroke(); }
        for (let b = 0; b < C; b += 8) for (let a = (b / 8) % 2 ? 0 : 16; a < C; a += 32) { ctx.beginPath(); ctx.moveTo(x + a, y + b); ctx.lineTo(x + a, y + b + 8); ctx.stroke(); }
      }
      if (style === 'deco') {
        ctx.fillStyle = '#f6efe0'; ctx.fillRect(x, y, 14, C); ctx.fillRect(x + C - 14, y, 14, C); // piers
        ctx.fillStyle = '#6fa598'; ctx.fillRect(x + 14, y + C - 14, C - 28, 8); // copper-green spandrel
      }
      if (style === 'tile') {
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        for (let i = 0; i < C; i += 16) for (let j = 0; j < C; j += 16) if ((i + j) % 32 === 0) ctx.fillRect(x + i, y + j, 16, 16);
      }
      // window
      const wx = x + 26;
      const wy = y + 22;
      const ww = C - 52;
      const wh = C - 44;
      ctx.fillStyle = style === 'brick' ? '#2a3a46' : '#24424f';
      ctx.fillRect(wx, wy, ww, wh);
      const g = ctx.createLinearGradient(wx, wy, wx + ww, wy + wh);
      g.addColorStop(0, 'rgba(160,205,225,0.55)');
      g.addColorStop(0.5, 'rgba(70,110,130,0.2)');
      g.addColorStop(1, 'rgba(10,25,35,0.1)');
      ctx.fillStyle = g;
      ctx.fillRect(wx, wy, ww, wh);
      ctx.strokeStyle = style === 'brick' ? '#1d2326' : '#f4f1e8';
      ctx.lineWidth = 4;
      ctx.strokeRect(wx, wy, ww, wh);
      ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(wx - 4, wy + wh, ww + 8, 6); // sill shadow
      if (style === 'tile' && c % 2 === 0) { ctx.fillStyle = '#2f7f78'; ctx.fillRect(wx - 10, wy, 8, wh); ctx.fillRect(wx + ww + 2, wy, 8, wh); } // shutters
    }
    // floor cornices
    if (style !== 'glass' && style !== 'shed') {
      for (let r = 0; r < 8; r++) { ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(0, r * C, N, 3); ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(0, r * C + 3, N, 2); }
    }
    noise(ctx, N, N, rng, 0.07, 3);
  });

  const emissive = tex(scene, 'facade-lit-' + style, N, N, (ctx) => {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, N, N);
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      if (!lit[r][c]) continue;
      const x = c * C;
      const y = r * C;
      ctx.fillStyle = litColors[(r * 3 + c * 5) % litColors.length];
      if (style === 'glass') ctx.fillRect(x + 4, y + 4, C - 8, C - 8);
      else if (style === 'shed') { if (r % 8 === 1 && c % 2 === 0) ctx.fillRect(x + 14, y + 32, C - 28, 36); }
      else ctx.fillRect(x + 30, y + 26, C - 60, C - 52);
    }
  });
  return { diffuse, emissive };
}

export function asphaltTexture(scene: Scene): DynamicTexture {
  const rng = new Rng(11);
  return tex(scene, 'asphalt', 512, 512, (ctx) => {
    ctx.fillStyle = '#3a3d42';
    ctx.fillRect(0, 0, 512, 512);
    noise(ctx, 512, 512, rng, 0.22, 2);
    ctx.strokeStyle = 'rgba(20,20,22,0.5)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 14; i++) {
      ctx.beginPath();
      let x = rng.range(0, 512);
      let y = rng.range(0, 512);
      ctx.moveTo(x, y);
      for (let k = 0; k < 6; k++) { x += rng.range(-30, 30); y += rng.range(-30, 30); ctx.lineTo(x, y); }
      ctx.stroke();
    }
  });
}

export function sidewalkTexture(scene: Scene): DynamicTexture {
  const rng = new Rng(23);
  return tex(scene, 'sidewalk', 512, 512, (ctx) => {
    ctx.fillStyle = '#b7b2a6';
    ctx.fillRect(0, 0, 512, 512);
    noise(ctx, 512, 512, rng, 0.14, 2);
    ctx.strokeStyle = 'rgba(70,66,58,0.55)';
    ctx.lineWidth = 3;
    for (let i = 0; i <= 512; i += 128) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke(); }
  });
}

export function plazaTexture(scene: Scene): DynamicTexture {
  const rng = new Rng(31);
  return tex(scene, 'plaza', 512, 512, (ctx) => {
    ctx.fillStyle = '#c9b48f';
    ctx.fillRect(0, 0, 512, 512);
    for (let y = 0; y < 512; y += 64) for (let x = 0; x < 512; x += 64) {
      ctx.fillStyle = (x / 64 + y / 64) % 2 ? '#cfa77f' : '#b9c4b0';
      ctx.fillRect(x + 2, y + 2, 60, 60);
    }
    noise(ctx, 512, 512, rng, 0.12, 2);
  });
}

export function groundTexture(scene: Scene): DynamicTexture {
  const rng = new Rng(41);
  return tex(scene, 'ground', 256, 256, (ctx) => {
    ctx.fillStyle = '#4b4f52';
    ctx.fillRect(0, 0, 256, 256);
    noise(ctx, 256, 256, rng, 0.2, 2);
  });
}

export function deckTexture(scene: Scene): DynamicTexture {
  const rng = new Rng(53);
  return tex(scene, 'deck', 512, 512, (ctx) => {
    ctx.fillStyle = '#8d8b84';
    ctx.fillRect(0, 0, 512, 512);
    noise(ctx, 512, 512, rng, 0.14, 2);
    ctx.strokeStyle = 'rgba(40,40,40,0.5)'; ctx.lineWidth = 2;
    for (let i = 0; i <= 512; i += 256) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke(); }
  });
}

export function glowTexture(scene: Scene): DynamicTexture {
  const gt = tex(scene, 'glow', 128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  }, false);
  gt.hasAlpha = true;
  return gt;
}

/** Sign texture with text on a coloured plaque. */
export function signTexture(scene: Scene, text: string, bg: string, fg = '#ffffff'): DynamicTexture {
  const t = new DynamicTexture('sign-' + text, { width: 512, height: 128 }, scene, true);
  const ctx = t.getContext() as CanvasRenderingContext2D;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = fg;
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 500, 116);
  ctx.fillStyle = fg;
  ctx.font = 'bold 44px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const words = text.length > 20 ? [text.slice(0, text.lastIndexOf(' ', 20)), text.slice(text.lastIndexOf(' ', 20) + 1)] : [text];
  if (words.length === 1) ctx.fillText(text, 256, 66);
  else { ctx.font = 'bold 38px "Segoe UI", Arial, sans-serif'; ctx.fillText(words[0], 256, 44); ctx.fillText(words[1], 256, 88); }
  t.update(true);
  return t;
}
