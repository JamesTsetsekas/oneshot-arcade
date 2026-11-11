// Procedural canvas textures. Everything is generated at runtime from code (no external art assets).

import * as THREE from 'three';
import { mulberry32 } from '../content/weapons';

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')!];
}

function tex(c: HTMLCanvasElement, repeat = true): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping; }
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

function speckle(ctx: CanvasRenderingContext2D, w: number, h: number, rng: () => number, count: number, light: string, dark: string, size = 1.6): void {
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = rng() < 0.5 ? light : dark;
    const s = rng() * size + 0.4;
    ctx.fillRect(rng() * w, rng() * h, s, s);
  }
}

function noiseBlotches(ctx: CanvasRenderingContext2D, w: number, h: number, rng: () => number, n: number, color: string, alpha: number, rad: number): void {
  for (let i = 0; i < n; i++) {
    const x = rng() * w, y = rng() * h, r = rad * (0.4 + rng());
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color.replace('A', String(alpha)));
    g.addColorStop(1, color.replace('A', '0'));
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
}

export interface TextureSet {
  wall: THREE.Texture;
  floorConcrete: THREE.Texture;
  floorYard: THREE.Texture;
  floorGrate: THREE.Texture;
  floorHydro: THREE.Texture;
  floorMid: THREE.Texture;
  ceiling: THREE.Texture;
  crate: THREE.Texture;
  metal: THREE.Texture;
  foliage: THREE.Texture;
  platform: THREE.Texture;
  thin: THREE.Texture;
  halfWall: THREE.Texture;
}

export function makeTextures(): TextureSet {
  const rng = mulberry32(1234);

  // ---- wall: kicker / panel field / dark band with warm light strip and magenta conduit. Covers 4 m wide x 6 m tall.
  const [wc, w] = canvas(512, 768);
  {
    w.fillStyle = '#c9cdd1'; w.fillRect(0, 0, 512, 768);
    // top dark acoustic band
    w.fillStyle = '#2a2f36'; w.fillRect(0, 0, 512, 150);
    for (let x = 0; x < 512; x += 32) { w.fillStyle = 'rgba(0,0,0,0.35)'; w.fillRect(x, 8, 2, 134); }
    w.fillStyle = 'rgba(255,255,255,0.05)'; for (let x = 0; x < 512; x += 32) w.fillRect(x + 2, 8, 1, 134);
    // warm emergency light strip
    w.fillStyle = '#ffb24a'; w.fillRect(0, 150, 512, 7);
    w.fillStyle = 'rgba(255,178,74,0.25)'; w.fillRect(0, 157, 512, 20);
    // mid panel field (mineral concrete panels, 1 m wide)
    for (let x = 0; x < 512; x += 128) {
      const g = w.createLinearGradient(0, 160, 0, 560);
      g.addColorStop(0, '#d3d6d9'); g.addColorStop(1, '#bfc4c9');
      w.fillStyle = g; w.fillRect(x + 2, 160, 124, 420);
      w.fillStyle = 'rgba(40,46,54,0.55)'; w.fillRect(x, 160, 2, 420);
    }
    noiseBlotches(w, 512, 768, rng, 40, 'rgba(120,125,130,A)', 0.07, 70);
    // magenta network conduit
    w.fillStyle = '#34263a'; w.fillRect(0, 548, 512, 22);
    w.fillStyle = '#ff3fa6'; w.fillRect(0, 553, 512, 6);
    w.fillStyle = 'rgba(255,63,166,0.28)'; w.fillRect(0, 559, 512, 10);
    // clamps
    for (let x = 16; x < 512; x += 128) { w.fillStyle = '#6b6f78'; w.fillRect(x, 545, 10, 28); }
    // kicker
    w.fillStyle = '#8f959c'; w.fillRect(0, 590, 512, 178);
    w.fillStyle = '#767c83'; w.fillRect(0, 590, 512, 6);
    for (let x = 0; x < 512; x += 256) { w.fillStyle = 'rgba(30,34,40,0.5)'; w.fillRect(x, 596, 2, 172); }
    w.fillStyle = '#e8c53a'; w.fillRect(0, 740, 512, 10); // hazard line
    for (let x = 0; x < 512; x += 40) { w.fillStyle = '#1c1c1c'; w.beginPath(); w.moveTo(x, 740); w.lineTo(x + 20, 740); w.lineTo(x + 10, 750); w.lineTo(x - 10, 750); w.fill(); }
    speckle(w, 512, 768, rng, 2600, 'rgba(255,255,255,0.12)', 'rgba(0,0,0,0.12)');
  }

  // ---- floors (each covers 2 m x 2 m unless noted)
  const [fc, f] = canvas(256, 256);
  {
    f.fillStyle = '#b9bdc0'; f.fillRect(0, 0, 256, 256);
    noiseBlotches(f, 256, 256, rng, 30, 'rgba(90,95,100,A)', 0.09, 60);
    speckle(f, 256, 256, rng, 1800, 'rgba(255,255,255,0.18)', 'rgba(0,0,0,0.15)');
    f.fillStyle = 'rgba(60,66,74,0.7)'; f.fillRect(0, 0, 256, 2); f.fillRect(0, 0, 2, 256);
    f.fillStyle = 'rgba(255,255,255,0.1)'; f.fillRect(0, 2, 256, 1); f.fillRect(2, 0, 1, 256);
  }
  const [yc, y] = canvas(256, 256);
  {
    y.fillStyle = '#5a5e63'; y.fillRect(0, 0, 256, 256);
    noiseBlotches(y, 256, 256, rng, 40, 'rgba(30,32,36,A)', 0.18, 50);
    speckle(y, 256, 256, rng, 3400, 'rgba(210,210,210,0.18)', 'rgba(0,0,0,0.25)', 2.2);
    y.fillStyle = 'rgba(232,197,58,0.85)'; y.fillRect(0, 0, 256, 7); // painted lane line at tile border
    y.fillStyle = 'rgba(20,22,26,0.7)'; y.fillRect(0, 7, 256, 2);
  }
  const [gc, g] = canvas(256, 256);
  {
    g.fillStyle = '#2f343b'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 256; i += 16) {
      g.fillStyle = '#3f464f'; g.fillRect(i + 1, 0, 14, 256);
      g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(i, 0, 2, 256); g.fillRect(0, i, 256, 2);
    }
    g.fillStyle = 'rgba(255,255,255,0.06)'; for (let i = 0; i < 256; i += 16) g.fillRect(i + 2, 0, 1, 256);
    speckle(g, 256, 256, rng, 800, 'rgba(255,255,255,0.1)', 'rgba(0,0,0,0.2)');
    g.fillStyle = '#d8b53a'; g.fillRect(0, 0, 256, 5);
  }
  const [hc, h] = canvas(256, 256);
  {
    h.fillStyle = '#9fb7a2'; h.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const v = 150 + Math.floor(rng() * 30);
      h.fillStyle = `rgb(${v - 12},${v + 6},${v - 8})`; h.fillRect(i * 64 + 2, j * 64 + 2, 60, 60);
    }
    h.fillStyle = 'rgba(30,50,40,0.5)'; for (let i = 0; i < 256; i += 64) { h.fillRect(i, 0, 2, 256); h.fillRect(0, i, 256, 2); }
    noiseBlotches(h, 256, 256, rng, 20, 'rgba(40,90,50,A)', 0.12, 40);
    speckle(h, 256, 256, rng, 1000, 'rgba(255,255,255,0.14)', 'rgba(0,0,0,0.14)');
  }
  const [mc, mm] = canvas(256, 256);
  {
    mm.fillStyle = '#c3c8cf'; mm.fillRect(0, 0, 256, 256);
    const gr = mm.createRadialGradient(128, 128, 20, 128, 128, 190);
    gr.addColorStop(0, 'rgba(255,255,255,0.25)'); gr.addColorStop(1, 'rgba(60,70,90,0.18)');
    mm.fillStyle = gr; mm.fillRect(0, 0, 256, 256);
    mm.strokeStyle = 'rgba(255,63,166,0.35)'; mm.lineWidth = 3;
    mm.beginPath(); mm.arc(128, 128, 90, 0, Math.PI * 2); mm.stroke();
    mm.fillStyle = 'rgba(40,46,54,0.6)'; mm.fillRect(0, 0, 256, 2); mm.fillRect(0, 0, 2, 256);
    speckle(mm, 256, 256, rng, 900, 'rgba(255,255,255,0.2)', 'rgba(0,0,0,0.1)');
  }

  // ---- ceiling
  const [cc, c] = canvas(256, 256);
  {
    c.fillStyle = '#20252b'; c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 256; i += 64) { c.fillStyle = '#2d343c'; c.fillRect(i + 2, 2, 60, 252); }
    c.fillStyle = 'rgba(0,0,0,0.5)'; for (let i = 0; i < 256; i += 64) { c.fillRect(i, 0, 2, 256); c.fillRect(0, i, 256, 2); }
    speckle(c, 256, 256, rng, 500, 'rgba(255,255,255,0.08)', 'rgba(0,0,0,0.2)');
  }

  // ---- crate (neutral ribs; colour comes from the material)
  const [kc, k] = canvas(256, 256);
  {
    k.fillStyle = '#d7d7d7'; k.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 256; i += 16) { k.fillStyle = i % 32 === 0 ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.18)'; k.fillRect(i, 0, 8, 256); }
    k.fillStyle = 'rgba(0,0,0,0.55)'; k.fillRect(0, 0, 256, 8); k.fillRect(0, 248, 256, 8); k.fillRect(0, 0, 8, 256); k.fillRect(248, 0, 8, 256);
    k.fillStyle = 'rgba(255,255,255,0.2)'; k.fillRect(8, 8, 240, 2);
    noiseBlotches(k, 256, 256, rng, 14, 'rgba(60,40,20,A)', 0.2, 40);
    speckle(k, 256, 256, rng, 800, 'rgba(255,255,255,0.12)', 'rgba(0,0,0,0.18)');
  }
  const [tc, tt] = canvas(256, 256);
  {
    tt.fillStyle = '#8a929c'; tt.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 256; i += 64) { tt.fillStyle = 'rgba(0,0,0,0.35)'; tt.fillRect(i, 0, 2, 256); tt.fillRect(0, i, 256, 2); }
    for (let i = 8; i < 256; i += 32) for (let j = 8; j < 256; j += 32) { tt.fillStyle = '#4b5159'; tt.beginPath(); tt.arc(i, j, 2.2, 0, 7); tt.fill(); }
    noiseBlotches(tt, 256, 256, rng, 20, 'rgba(255,255,255,A)', 0.08, 50);
    tt.fillStyle = '#ff3fa6'; tt.fillRect(0, 120, 256, 5);
  }
  const [lc, l] = canvas(256, 256);
  {
    l.fillStyle = '#2f7a43'; l.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 900; i++) {
      const x = rng() * 256, y2 = rng() * 256, a = rng() * 6.28, s = 6 + rng() * 14;
      const gr2 = 70 + Math.floor(rng() * 110);
      l.fillStyle = `rgb(${20 + Math.floor(rng() * 40)},${gr2},${30 + Math.floor(rng() * 40)})`;
      l.beginPath(); l.ellipse(x, y2, s, s * 0.4, a, 0, 7); l.fill();
    }
    l.fillStyle = 'rgba(0,0,0,0.12)'; for (let i = 0; i < 256; i += 64) l.fillRect(i, 0, 2, 256);
  }
  const [pc, pp] = canvas(256, 256);
  {
    pp.fillStyle = '#3a4048'; pp.fillRect(0, 0, 256, 256);
    pp.fillStyle = '#e1b83c'; pp.fillRect(0, 0, 256, 20); pp.fillRect(0, 236, 256, 20);
    for (let x = -20; x < 276; x += 40) { pp.fillStyle = '#1b1b1b'; pp.beginPath(); pp.moveTo(x, 0); pp.lineTo(x + 20, 0); pp.lineTo(x, 20); pp.lineTo(x - 20, 20); pp.fill(); pp.beginPath(); pp.moveTo(x, 236); pp.lineTo(x + 20, 236); pp.lineTo(x, 256); pp.lineTo(x - 20, 256); pp.fill(); }
    for (let i = 24; i < 232; i += 14) { pp.fillStyle = 'rgba(255,255,255,0.1)'; pp.fillRect(0, i, 256, 2); }
    speckle(pp, 256, 256, rng, 800, 'rgba(255,255,255,0.1)', 'rgba(0,0,0,0.2)');
  }
  const [dc, d] = canvas(256, 256);
  {
    d.fillStyle = '#e6e8e4'; d.fillRect(0, 0, 256, 256);
    d.fillStyle = 'rgba(0,0,0,0.12)'; for (let i = 0; i < 256; i += 128) d.fillRect(i, 0, 2, 256);
    d.fillStyle = 'rgba(60,70,80,0.5)'; d.fillRect(0, 0, 256, 4); d.fillRect(0, 252, 256, 4);
    d.fillStyle = '#ff3fa6'; d.fillRect(0, 150, 256, 4);
    speckle(d, 256, 256, rng, 800, 'rgba(255,255,255,0.15)', 'rgba(0,0,0,0.08)');
  }
  const [hw, hh] = canvas(256, 256);
  {
    hh.fillStyle = '#a7acb2'; hh.fillRect(0, 0, 256, 256);
    hh.fillStyle = '#383e46'; hh.fillRect(0, 0, 256, 38);
    hh.fillStyle = '#e1b83c'; hh.fillRect(0, 38, 256, 6);
    noiseBlotches(hh, 256, 256, rng, 14, 'rgba(70,75,80,A)', 0.1, 50);
    hh.fillStyle = 'rgba(0,0,0,0.25)'; hh.fillRect(0, 0, 2, 256);
    speckle(hh, 256, 256, rng, 900, 'rgba(255,255,255,0.15)', 'rgba(0,0,0,0.16)');
  }

  return {
    wall: tex(wc), floorConcrete: tex(fc), floorYard: tex(yc), floorGrate: tex(gc), floorHydro: tex(hc), floorMid: tex(mc),
    ceiling: tex(cc), crate: tex(kc), metal: tex(tc), foliage: tex(lc), platform: tex(pc), thin: tex(dc), halfWall: tex(hw),
  };
}

/** A rounded text sign texture. */
export function signTexture(text: string, accent = '#ff3fa6', w = 512, h = 160): THREE.CanvasTexture {
  const [c, ctx] = canvas(w, h);
  ctx.fillStyle = '#12161b'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = accent; ctx.lineWidth = 6; ctx.strokeRect(6, 6, w - 12, h - 12);
  ctx.fillStyle = accent; ctx.fillRect(6, h - 30, w - 12, 6);
  ctx.fillStyle = '#f3f6f8';
  ctx.font = '800 64px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2 - 10);
  return tex(c, false);
}

/** Soft round sprite texture. */
export function glowTexture(): THREE.CanvasTexture {
  const [c, ctx] = canvas(128, 128);
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  return tex(c, false);
}

export function smokeNoiseTexture(): THREE.CanvasTexture {
  const [c, ctx] = canvas(128, 128);
  const rng = mulberry32(77);
  ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, 128, 128);
  noiseBlotches(ctx, 128, 128, rng, 60, 'rgba(255,255,255,A)', 0.5, 26);
  noiseBlotches(ctx, 128, 128, rng, 60, 'rgba(0,0,0,A)', 0.5, 26);
  return tex(c, true);
}
