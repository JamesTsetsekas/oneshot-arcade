// Procedurally generated surface textures (canvas). Original, generated at load.

import { DynamicTexture, Scene, Texture } from '@babylonjs/core';

function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Tileable value noise into an alpha-ish grayscale field. */
function noiseField(size: number, cells: number, seed: number): Float32Array {
  const r = rng(seed);
  const g = new Float32Array(cells * cells);
  for (let i = 0; i < g.length; i++) g[i] = r();
  const out = new Float32Array(size * size);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const fx = (x / size) * cells;
      const fy = (y / size) * cells;
      const x0 = Math.floor(fx);
      const y0 = Math.floor(fy);
      const tx = fx - x0;
      const ty = fy - y0;
      const sx = tx * tx * (3 - 2 * tx);
      const sy = ty * ty * (3 - 2 * ty);
      const a = g[(y0 % cells) * cells + (x0 % cells)];
      const b = g[(y0 % cells) * cells + ((x0 + 1) % cells)];
      const c = g[((y0 + 1) % cells) * cells + (x0 % cells)];
      const d = g[((y0 + 1) % cells) * cells + ((x0 + 1) % cells)];
      out[y * size + x] = a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
    }
  return out;
}

function hexToRgb(hex: string): [number, number, number] {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

type Painter = (ctx: CanvasRenderingContext2D, size: number) => void;

function makeTex(scene: Scene, name: string, size: number, paint: Painter): DynamicTexture {
  const t = new DynamicTexture(name, { width: size, height: size }, scene, true);
  const ctx = t.getContext() as CanvasRenderingContext2D;
  paint(ctx, size);
  t.update(true);
  t.wrapU = Texture.WRAP_ADDRESSMODE;
  t.wrapV = Texture.WRAP_ADDRESSMODE;
  t.anisotropicFilteringLevel = 8;
  return t;
}

function grain(ctx: CanvasRenderingContext2D, size: number, base: string, amp: number, seed: number, cells = 16, fine = 0.5): void {
  const [r0, g0, b0] = hexToRgb(base);
  const n1 = noiseField(size, cells, seed);
  const n2 = noiseField(size, cells * 4, seed + 7);
  const img = ctx.createImageData(size, size);
  const rr = rng(seed + 99);
  for (let i = 0; i < size * size; i++) {
    const v = (n1[i] - 0.5) * amp + (n2[i] - 0.5) * amp * fine + (rr() - 0.5) * amp * 0.35;
    img.data[i * 4] = Math.max(0, Math.min(255, r0 + v * 255));
    img.data[i * 4 + 1] = Math.max(0, Math.min(255, g0 + v * 255));
    img.data[i * 4 + 2] = Math.max(0, Math.min(255, b0 + v * 255));
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

export interface TextureSet {
  [k: string]: DynamicTexture;
}

export function buildTextures(scene: Scene, q: 'low' | 'medium' | 'high'): TextureSet {
  const S = q === 'low' ? 256 : 512;
  const set: TextureSet = {};
  set.concrete = makeTex(scene, 'tx-concrete', S, (c, s) => {
    grain(c, s, '#b9b6ae', 0.14, 11);
    // formwork seams and tie holes
    c.strokeStyle = 'rgba(70,68,64,0.35)';
    c.lineWidth = 2;
    c.strokeRect(1, 1, s - 2, s - 2);
    c.beginPath();
    c.moveTo(0, s / 2);
    c.lineTo(s, s / 2);
    c.stroke();
    c.fillStyle = 'rgba(60,58,55,0.5)';
    for (const [x, y] of [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) {
      c.beginPath();
      c.arc(x * s, y * s, s * 0.012, 0, Math.PI * 2);
      c.fill();
    }
  });
  set.concreteDark = makeTex(scene, 'tx-concrete-d', S, (c, s) => grain(c, s, '#77736d', 0.16, 23));
  set.asphalt = makeTex(scene, 'tx-asphalt', S, (c, s) => {
    grain(c, s, '#55565a', 0.12, 31, 8, 1.4);
    c.fillStyle = 'rgba(230,200,80,0.55)';
    c.fillRect(0, s * 0.47, s * 0.4, s * 0.06);
  });
  set.panel = makeTex(scene, 'tx-panel', S, (c, s) => {
    grain(c, s, '#3a3e46', 0.06, 41);
    const n = 4;
    c.strokeStyle = 'rgba(15,17,20,0.9)';
    c.lineWidth = 3;
    for (let i = 0; i <= n; i++) {
      c.beginPath();
      c.moveTo((i * s) / n, 0);
      c.lineTo((i * s) / n, s);
      c.stroke();
    }
    c.beginPath();
    c.moveTo(0, s / 2);
    c.lineTo(s, s / 2);
    c.stroke();
    // perforation pattern
    c.fillStyle = 'rgba(20,22,26,0.55)';
    for (let y = 8; y < s; y += 12) for (let x = 8; x < s; x += 12) c.fillRect(x, y, 2, 2);
  });
  set.panelLight = makeTex(scene, 'tx-panel-l', S, (c, s) => {
    grain(c, s, '#c9cdd2', 0.05, 43);
    c.strokeStyle = 'rgba(90,96,104,0.6)';
    c.lineWidth = 2;
    for (let i = 0; i <= 2; i++) {
      c.beginPath();
      c.moveTo((i * s) / 2, 0);
      c.lineTo((i * s) / 2, s);
      c.stroke();
    }
    c.beginPath();
    c.moveTo(0, s * 0.5);
    c.lineTo(s, s * 0.5);
    c.stroke();
  });
  set.tile = makeTex(scene, 'tx-tile', S, (c, s) => {
    grain(c, s, '#e4e8e6', 0.04, 51);
    c.strokeStyle = 'rgba(150,160,158,0.9)';
    c.lineWidth = 2;
    const n = 4;
    for (let i = 0; i <= n; i++) {
      c.beginPath();
      c.moveTo((i * s) / n, 0);
      c.lineTo((i * s) / n, s);
      c.moveTo(0, (i * s) / n);
      c.lineTo(s, (i * s) / n);
      c.stroke();
    }
  });
  set.tileWarm = makeTex(scene, 'tx-tile-w', S, (c, s) => {
    grain(c, s, '#a89c8c', 0.06, 53);
    c.strokeStyle = 'rgba(70,62,52,0.7)';
    c.lineWidth = 2;
    for (let i = 0; i <= 2; i++) {
      c.beginPath();
      c.moveTo((i * s) / 2, 0);
      c.lineTo((i * s) / 2, s);
      c.moveTo(0, (i * s) / 2);
      c.lineTo(s, (i * s) / 2);
      c.stroke();
    }
  });
  set.metal = makeTex(scene, 'tx-metal', S, (c, s) => {
    grain(c, s, '#8b9196', 0.08, 61, 4, 0.3);
    c.strokeStyle = 'rgba(255,255,255,0.05)';
    for (let y = 0; y < s; y += 3) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(s, y + (y % 7));
      c.stroke();
    }
  });
  set.grate = makeTex(scene, 'tx-grate', S, (c, s) => {
    grain(c, s, '#5d6166', 0.08, 63);
    c.strokeStyle = 'rgba(25,27,30,0.9)';
    c.lineWidth = 3;
    for (let i = 0; i < s; i += s / 16) {
      c.beginPath();
      c.moveTo(i, 0);
      c.lineTo(i, s);
      c.stroke();
    }
  });
  set.crate = makeTex(scene, 'tx-crate', S, (c, s) => {
    grain(c, s, '#7c8a5a', 0.08, 71);
    c.strokeStyle = 'rgba(40,46,28,0.9)';
    c.lineWidth = s * 0.04;
    c.strokeRect(s * 0.02, s * 0.02, s * 0.96, s * 0.96);
    c.lineWidth = s * 0.03;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(s, s);
    c.stroke();
    c.fillStyle = 'rgba(240,240,230,0.7)';
    c.font = `bold ${s * 0.09}px monospace`;
    c.fillText('LP-CARGO 07', s * 0.1, s * 0.92);
  });
  set.container = makeTex(scene, 'tx-container', S, (c, s) => {
    grain(c, s, '#2f6f86', 0.07, 81);
    for (let x = 0; x < s; x += s / 12) {
      c.fillStyle = 'rgba(0,0,0,0.22)';
      c.fillRect(x, 0, s / 40, s);
      c.fillStyle = 'rgba(255,255,255,0.08)';
      c.fillRect(x + s / 40, 0, s / 60, s);
    }
    c.fillStyle = 'rgba(255,255,255,0.65)';
    c.font = `bold ${s * 0.08}px monospace`;
    c.fillText('ANNEX FREIGHT', s * 0.08, s * 0.15);
  });
  set.planter = makeTex(scene, 'tx-planter', S, (c, s) => {
    grain(c, s, '#3f7d3a', 0.22, 91, 24, 1.2);
    const r = rng(93);
    for (let i = 0; i < 260; i++) {
      c.fillStyle = `rgba(${90 + r() * 60},${150 + r() * 80},${60 + r() * 40},0.8)`;
      c.beginPath();
      c.ellipse(r() * s, r() * s, 2 + r() * 6, 1 + r() * 3, r() * Math.PI, 0, Math.PI * 2);
      c.fill();
    }
  });
  set.rack = makeTex(scene, 'tx-rack', S, (c, s) => {
    grain(c, s, '#d6dad8', 0.05, 101);
    for (let y = 0; y < s; y += s / 4) {
      c.fillStyle = 'rgba(70,140,70,0.9)';
      c.fillRect(0, y + s * 0.05, s, s * 0.12);
      c.fillStyle = 'rgba(120,200,110,0.6)';
      for (let x = 0; x < s; x += 9) c.fillRect(x, y + s * 0.03, 5, s * 0.06);
    }
  });
  set.turbine = makeTex(scene, 'tx-turbine', S, (c, s) => {
    grain(c, s, '#4a4f58', 0.06, 111);
    for (let y = 0; y < s; y += s / 8) {
      c.fillStyle = 'rgba(0,0,0,0.35)';
      c.fillRect(0, y, s, 3);
    }
    c.fillStyle = 'rgba(200,40,150,0.55)';
    c.fillRect(s * 0.49, 0, s * 0.02, s);
  });
  set.drywall = makeTex(scene, 'tx-drywall', S, (c, s) => {
    grain(c, s, '#d8d3c8', 0.05, 121);
    // penetrable surface marker: hatched band at knee height (consistent visual language)
    c.fillStyle = 'rgba(200,150,40,0.85)';
    c.fillRect(0, s * 0.86, s, s * 0.07);
    c.strokeStyle = 'rgba(40,30,10,0.8)';
    c.lineWidth = 3;
    for (let x = -s; x < s * 2; x += 16) {
      c.beginPath();
      c.moveTo(x, s * 0.93);
      c.lineTo(x + 16, s * 0.86);
      c.stroke();
    }
  });
  set.grass = makeTex(scene, 'tx-grass', S, (c, s) => grain(c, s, '#4c7a3c', 0.25, 131, 32, 1.5));
  set.glass = makeTex(scene, 'tx-glass', 128, (c, s) => {
    c.fillStyle = 'rgba(170,220,230,0.25)';
    c.fillRect(0, 0, s, s);
    c.strokeStyle = 'rgba(255,255,255,0.35)';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(s * 0.1, s * 0.9);
    c.lineTo(s * 0.4, s * 0.1);
    c.stroke();
  });
  set.smoke = makeTex(scene, 'tx-smoke', 256, (c, s) => {
    const n = noiseField(s, 8, 141);
    const n2 = noiseField(s, 24, 143);
    const img = c.createImageData(s, s);
    for (let i = 0; i < s * s; i++) {
      const v = 200 + (n[i] * 0.7 + n2[i] * 0.3) * 55;
      img.data[i * 4] = v;
      img.data[i * 4 + 1] = v + 3;
      img.data[i * 4 + 2] = v + 8;
      img.data[i * 4 + 3] = 255;
    }
    c.putImageData(img, 0, 0);
  });
  set.soft = makeTex(scene, 'tx-soft', 64, (c, s) => {
    const g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.6)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, s, s);
  });
  set.soft.hasAlpha = true;
  set.flame = makeTex(scene, 'tx-flame', 128, (c, s) => {
    const n = noiseField(s, 6, 151);
    const img = c.createImageData(s, s);
    for (let i = 0; i < s * s; i++) {
      const v = n[i];
      img.data[i * 4] = 255;
      img.data[i * 4 + 1] = 90 + v * 140;
      img.data[i * 4 + 2] = 20 + v * 40;
      img.data[i * 4 + 3] = 255;
    }
    c.putImageData(img, 0, 0);
    c.strokeStyle = '#fff2a0';
    c.lineWidth = 4;
    c.strokeRect(2, 2, s - 4, s - 4);
  });
  set.decal = makeTex(scene, 'tx-decal', 64, (c, s) => {
    const g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(10,10,10,1)');
    g.addColorStop(0.25, 'rgba(25,25,25,0.95)');
    g.addColorStop(0.5, 'rgba(40,40,40,0.4)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, s, s);
  });
  set.decal.hasAlpha = true;
  set.sky = makeTex(scene, 'tx-sky', 256, (c, s) => {
    const g = c.createLinearGradient(0, 0, 0, s);
    g.addColorStop(0, '#5f8fc4');
    g.addColorStop(0.45, '#a9c6df');
    g.addColorStop(0.5, '#e7d9c6');
    g.addColorStop(1, '#8c8c8c');
    c.fillStyle = g;
    c.fillRect(0, 0, s, s);
  });
  return set;
}

/** Sign texture with callout text. */
export function signTexture(scene: Scene, text: string): DynamicTexture {
  const t = new DynamicTexture('sign-' + text, { width: 512, height: 128 }, scene, true);
  const c = t.getContext() as CanvasRenderingContext2D;
  c.fillStyle = '#101317';
  c.fillRect(0, 0, 512, 128);
  c.fillStyle = '#ff3fb4';
  c.fillRect(0, 0, 16, 128);
  c.fillStyle = '#f2f4f5';
  c.font = 'bold 64px "Segoe UI", Arial, sans-serif';
  c.textBaseline = 'middle';
  c.fillText(text, 40, 68);
  t.update(true);
  return t;
}
