// Procedural texture atlases drawn on canvases at boot. Everything here is original, generated art.
import { DynamicTexture, Scene, Texture } from '@babylonjs/core';

export const GROUND_TILES = 4;     // 4x4 atlas
export const FACADE_COLS = 8, FACADE_ROWS = 8;
export const G = { asphalt: 0, street: 1, collector: 2, arterial: 3, crosswalk: 4, sidewalk: 5, plaza: 6, concrete: 7, grass: 8, parking: 9, canal: 10, cobble: 11, deck: 12, dirt: 13 } as const;
export const F = { wall: 0, door: 1, shop: 2, win: 3, winLit: 4, blank: 5, top: 6, special: 7 } as const;

/** UV rect [u0,v0,u1,v1] for an atlas tile, inset slightly against mip bleeding. */
export function tileUV(col: number, row: number, cols: number, rows: number, inset = 0.004): [number, number, number, number] {
  return [col / cols + inset, 1 - (row + 1) / rows + inset, (col + 1) / cols - inset, 1 - row / rows - inset];
}
export const groundUV = (t: number) => tileUV(t % GROUND_TILES, Math.floor(t / GROUND_TILES), GROUND_TILES, GROUND_TILES, 0.006);
export const facadeUV = (col: number, row: number) => tileUV(col, row, FACADE_COLS, FACADE_ROWS, 0.003);

function rnd(seed: number) { let s = seed; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function speckle(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, n: number, dark: string, light: string, seed: number, size = 2) {
  const r = rnd(seed);
  for (let i = 0; i < n; i++) { ctx.fillStyle = r() < 0.5 ? dark : light; ctx.fillRect(x + r() * w, y + r() * h, 1 + r() * size, 1 + r() * size); }
}

export function makeGroundAtlas(scene: Scene): DynamicTexture {
  const S = 256, tex = new DynamicTexture('groundAtlas', { width: S * GROUND_TILES, height: S * GROUND_TILES }, scene, true);
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
  const at = (t: number): [number, number] => [(t % GROUND_TILES) * S, Math.floor(t / GROUND_TILES) * S];
  const fill = (t: number, color: string, n = 900, dark = 'rgba(0,0,0,0.10)', light = 'rgba(255,255,255,0.07)') => { const [x, y] = at(t); ctx.fillStyle = color; ctx.fillRect(x, y, S, S); speckle(ctx, x, y, S, S, n, dark, light, t * 97 + 3); return [x, y] as [number, number]; };
  const ASPH = '#4d5157';
  // u runs across the road (x in the tile), v along it (y in the tile).
  fill(G.asphalt, ASPH);
  const road = (t: number, width: number, draw: (x: number, y: number, m: number) => void) => { const [x, y] = fill(t, ASPH); draw(x, y, S / width); ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.fillRect(x, y, 6, S); ctx.fillRect(x + S - 6, y, 6, S); };
  const dash = (x: number, y: number, px: number, w: number, color: string, on = 0.42) => { ctx.fillStyle = color; ctx.fillRect(x + px - w / 2, y + S * 0.08, w, S * on); };
  const solid = (x: number, y: number, px: number, w: number, color: string) => { ctx.fillStyle = color; ctx.fillRect(x + px - w / 2, y, w, S); };
  const YEL = '#e2b93b', WHT = '#e9e6dc';
  road(G.street, 8, (x, y, m) => { dash(x, y, S / 2, 0.14 * m, YEL); });
  road(G.collector, 12, (x, y, m) => { solid(x, y, S / 2 - 0.14 * m, 0.11 * m, YEL); solid(x, y, S / 2 + 0.14 * m, 0.11 * m, YEL); dash(x, y, S / 2 - 3.5 * m, 0.1 * m, WHT, 0.2); dash(x, y, S / 2 + 3.5 * m, 0.1 * m, WHT, 0.2); });
  road(G.arterial, 16, (x, y, m) => { solid(x, y, S / 2 - 0.16 * m, 0.12 * m, YEL); solid(x, y, S / 2 + 0.16 * m, 0.12 * m, YEL); dash(x, y, S / 2 - 3.7 * m, 0.12 * m, WHT); dash(x, y, S / 2 + 3.7 * m, 0.12 * m, WHT); solid(x, y, S / 2 - 7.2 * m, 0.1 * m, WHT); solid(x, y, S / 2 + 7.2 * m, 0.1 * m, WHT); });
  { // crosswalk: zebra bars across the full width with a stop line on the far side
    const [x, y] = fill(G.crosswalk, ASPH);
    ctx.fillStyle = WHT;
    for (let i = 0; i < 10; i++) ctx.fillRect(x + 8 + i * 24.5, y + S * 0.18, 13, S * 0.52);
    ctx.fillRect(x + 6, y + S * 0.84, S - 12, 9);
  }
  { // sidewalk pavers
    const [x, y] = fill(G.sidewalk, '#b9b3a6', 500);
    ctx.strokeStyle = 'rgba(70,64,54,0.35)'; ctx.lineWidth = 1.5;
    for (let i = 0; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(x + i * 64, y); ctx.lineTo(x + i * 64, y + S); ctx.moveTo(x, y + i * 64); ctx.lineTo(x + S, y + i * 64); ctx.stroke(); }
    ctx.fillStyle = 'rgba(80,74,64,0.5)'; ctx.fillRect(x, y, S, 5); // kerb line
  }
  { // plaza: coloured tile mosaic
    const [x, y] = fill(G.plaza, '#d9ccb0', 300);
    const cols = ['#c9694a', '#e6d9bd', '#3f9c93', '#e6d9bd', '#e0b25a', '#e6d9bd'];
    const r = rnd(11);
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
      const k = (i + j) % 2 === 0 ? 1 : (i * 3 + j) % cols.length;
      ctx.fillStyle = cols[k]; ctx.globalAlpha = k === 1 ? 0.5 : 0.8 + r() * 0.2; ctx.fillRect(x + i * 32 + 1.5, y + j * 32 + 1.5, 29, 29);
    }
    ctx.globalAlpha = 1;
  }
  { // concrete slabs
    const [x, y] = fill(G.concrete, '#9c9e9a', 800);
    ctx.strokeStyle = 'rgba(50,52,50,0.4)'; ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, S - 2, S - 2); ctx.beginPath(); ctx.moveTo(x + S / 2, y); ctx.lineTo(x + S / 2, y + S); ctx.stroke();
  }
  { const [x, y] = fill(G.grass, '#5f9a52', 2600, 'rgba(20,60,20,0.22)', 'rgba(200,240,150,0.14)'); void x; void y; }
  { // parking lot
    const [x, y] = fill(G.parking, '#55585d');
    ctx.fillStyle = WHT; for (let i = 0; i <= 2; i++) ctx.fillRect(x + i * (S / 2.5) + 2, y + 20, 4, S - 40);
  }
  { const [x, y] = fill(G.canal, '#6f736f', 900, 'rgba(0,0,0,0.2)', 'rgba(140,170,150,0.1)'); ctx.fillStyle = 'rgba(40,60,50,0.25)'; ctx.fillRect(x, y + S * 0.6, S, S * 0.4); }
  { // cobble
    const [x, y] = fill(G.cobble, '#8d8579', 300);
    const r = rnd(5);
    for (let j = 0; j < 12; j++) for (let i = 0; i < 12; i++) { ctx.fillStyle = `rgba(${150 + r() * 50},${140 + r() * 45},${125 + r() * 40},0.6)`; ctx.fillRect(x + i * 21.4 + (j % 2) * 10 + 1, y + j * 21.4 + 1, 19, 19); }
  }
  road(G.deck, 8, (x, y, m) => { dash(x, y, S / 2, 0.14 * m, YEL); });
  fill(G.dirt, '#8a7a5e', 1800, 'rgba(60,40,10,0.2)', 'rgba(230,210,160,0.12)');
  tex.update(true);
  tex.wrapU = tex.wrapV = Texture.CLAMP_ADDRESSMODE;
  tex.anisotropicFilteringLevel = 8;
  return tex;
}

/** Facade atlas: rows are building styles, columns are module kinds. Returns diffuse + emissive textures. */
export function makeFacadeAtlas(scene: Scene): { diffuse: DynamicTexture; emissive: DynamicTexture } {
  const T = 128, W = T * FACADE_COLS, H = T * FACADE_ROWS;
  const diffuse = new DynamicTexture('facade', { width: W, height: H }, scene, true);
  const emissive = new DynamicTexture('facadeGlow', { width: W, height: H }, scene, true);
  const c = diffuse.getContext() as unknown as CanvasRenderingContext2D, e = emissive.getContext() as unknown as CanvasRenderingContext2D;
  e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
  const GLASS = '#3a4a5c', GLASS2 = '#4f6478', FRAME = 'rgba(40,40,44,0.55)';
  const warm = ['#ffd58a', '#ffe7b8', '#ffc56e', '#cfe6ff', '#ffdca0'];
  const pane = (x: number, y: number, w: number, h: number, lit: boolean, seed: number) => {
    const g = c.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, GLASS2); g.addColorStop(1, GLASS);
    c.fillStyle = g; c.fillRect(x, y, w, h);
    c.fillStyle = 'rgba(255,255,255,0.14)'; c.beginPath(); c.moveTo(x, y + h); c.lineTo(x + w * 0.45, y); c.lineTo(x + w * 0.7, y); c.lineTo(x + w * 0.2, y + h); c.fill();
    c.strokeStyle = FRAME; c.lineWidth = 2; c.strokeRect(x, y, w, h);
    if (lit) { e.fillStyle = warm[seed % warm.length]; e.fillRect(x + 1, y + 1, w - 2, h - 2); e.fillStyle = 'rgba(0,0,0,0.35)'; e.fillRect(x + 1, y + h * 0.62, w - 2, h * 0.38); }
  };
  for (let row = 0; row < FACADE_ROWS; row++) for (let col = 0; col < FACADE_COLS; col++) {
    const x = col * T, y = row * T, r = rnd(row * 31 + col * 7 + 1);
    // base wall (near white so the per-building vertex tint decides the colour)
    c.fillStyle = row === 1 ? '#d6e2ea' : '#ecebe6'; c.fillRect(x, y, T, T);
    speckle(c, x, y, T, T, 140, 'rgba(0,0,0,0.06)', 'rgba(255,255,255,0.08)', row * 13 + col, 2);
    const lit = col === F.winLit || col === F.shop || (col === F.top && row !== 6);
    const litSeed = row + col * 3;
    switch (row) {
      case 0: // deco stone: tall paired windows between pilasters
        c.fillStyle = 'rgba(0,0,0,0.08)'; c.fillRect(x, y, 10, T); c.fillRect(x + T - 10, y, 10, T);
        if (col === F.win || col === F.winLit) { pane(x + 26, y + 20, 32, 84, lit, litSeed); pane(x + 70, y + 20, 32, 84, lit, litSeed + 1); c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(x + 20, y + 106, 88, 6); }
        break;
      case 1: // glass curtain wall
        c.fillStyle = GLASS; c.fillRect(x, y, T, T);
        for (let i = 0; i < 2; i++) pane(x + 3 + i * 62, y + 4, 59, T - 30, (col === F.winLit && i === 0) || (col === F.top && i === 1), litSeed + i);
        c.fillStyle = '#9fb4c2'; c.fillRect(x, y + T - 24, T, 22); c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(x, y + T - 24, T, 2);
        break;
      case 2: // brick
        c.fillStyle = 'rgba(60,30,20,0.16)';
        for (let j = 0; j < 12; j++) { c.fillRect(x, y + j * 10.7, T, 1.5); for (let i = 0; i < 5; i++) c.fillRect(x + i * 26 + (j % 2) * 13, y + j * 10.7, 1.5, 10.7); }
        if (col === F.win || col === F.winLit) { pane(x + 34, y + 26, 60, 70, lit, litSeed); c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(x + 30, y + 20, 68, 6); c.strokeStyle = FRAME; c.beginPath(); c.moveTo(x + 64, y + 26); c.lineTo(x + 64, y + 96); c.moveTo(x + 34, y + 60); c.lineTo(x + 94, y + 60); c.stroke(); }
        break;
      case 3: // stucco residential with shutters
        if (col === F.win || col === F.winLit) { pane(x + 44, y + 28, 40, 64, lit, litSeed); c.fillStyle = 'rgba(40,90,90,0.75)'; c.fillRect(x + 30, y + 28, 12, 64); c.fillRect(x + 86, y + 28, 12, 64); c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(x + 38, y + 94, 52, 5); }
        break;
      case 4: // market arcade
        c.fillStyle = 'rgba(0,0,0,0.07)'; c.fillRect(x, y, 8, T); c.fillRect(x + T - 8, y, 8, T);
        if (col === F.win || col === F.winLit) { pane(x + 22, y + 34, 84, 62, lit, litSeed); c.fillStyle = 'rgba(190,70,50,0.8)'; c.fillRect(x + 16, y + 20, 96, 14); }
        break;
      case 5: // concrete office: ribbon windows
        if (col === F.win || col === F.winLit) pane(x + 4, y + 36, T - 8, 52, lit, litSeed);
        c.fillStyle = 'rgba(0,0,0,0.1)'; c.fillRect(x, y + T - 6, T, 6);
        break;
      case 6: // corrugated shed
        c.fillStyle = 'rgba(0,0,0,0.09)'; for (let i = 0; i < 16; i++) c.fillRect(x + i * 8, y, 3, T);
        if (col === F.winLit || col === F.win) { pane(x + 30, y + 14, 68, 26, lit, litSeed); }
        break;
      case 7: // civic
        c.fillStyle = 'rgba(0,0,0,0.07)'; c.fillRect(x, y, T, 8);
        if (col === F.win || col === F.winLit) { pane(x + 20, y + 26, 36, 76, lit, litSeed); pane(x + 72, y + 26, 36, 76, lit, litSeed + 2); }
        break;
    }
    if (col === F.door) {
      c.fillStyle = row === 1 ? '#2c3a46' : '#5a4636'; c.fillRect(x + 44, y + 40, 40, 88);
      c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(x + 48, y + 46, 14, 34); c.fillRect(x + 66, y + 46, 14, 34);
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x + 38, y + 34, 52, 6);
    } else if (col === F.shop) {
      pane(x + 8, y + 30, T - 16, 84, true, litSeed);
      c.fillStyle = 'rgba(30,30,34,0.8)'; c.fillRect(x + 4, y + 114, T - 8, 14);
      e.fillStyle = 'rgba(255,255,255,0.25)'; e.fillRect(x + 8, y + 30, T - 16, 30);
    } else if (col === F.top) {
      if (row !== 1 && row !== 6) { pane(x + 40, y + 44, 48, 60, lit && r() < 0.6, litSeed); }
      c.fillStyle = 'rgba(0,0,0,0.16)'; c.fillRect(x, y, T, 12); c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(x, y + 12, T, 4);
    } else if (col === F.special) {
      // loading / garage door
      c.fillStyle = '#7d858c'; c.fillRect(x + 14, y + 28, T - 28, 100);
      c.fillStyle = 'rgba(0,0,0,0.2)'; for (let j = 0; j < 9; j++) c.fillRect(x + 14, y + 28 + j * 11, T - 28, 2);
    }
    if (col <= F.shop || col === F.special) { c.fillStyle = 'rgba(0,0,0,0.14)'; c.fillRect(x, y + T - 8, T, 8); } // plinth
  }
  diffuse.update(true); emissive.update(true);
  for (const t of [diffuse, emissive]) { t.wrapU = t.wrapV = Texture.CLAMP_ADDRESSMODE; t.anisotropicFilteringLevel = 4; }
  return { diffuse, emissive };
}

export function makeSoftDot(scene: Scene): DynamicTexture {
  const tex = new DynamicTexture('dot', { width: 64, height: 64 }, scene, true);
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
  tex.update(true); tex.hasAlpha = true;
  return tex;
}
export function makeStreak(scene: Scene): DynamicTexture {
  const tex = new DynamicTexture('streak', { width: 8, height: 64 }, scene, true);
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
  const g = ctx.createLinearGradient(0, 0, 0, 64);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(210,225,255,0.75)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(2, 0, 4, 64);
  tex.update(true); tex.hasAlpha = true;
  return tex;
}
export function makeWaterBump(scene: Scene): DynamicTexture {
  const S = 256, tex = new DynamicTexture('waterBump', { width: S, height: S }, scene, true);
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
  ctx.fillStyle = 'rgb(128,128,255)'; ctx.fillRect(0, 0, S, S);
  const r = rnd(77);
  for (let i = 0; i < 260; i++) {
    const x = r() * S, y = r() * S, w = 14 + r() * 40, a = r() * 0.5 + 0.15;
    ctx.fillStyle = `rgba(${90 + r() * 80},${100 + r() * 60},255,${a})`;
    ctx.beginPath(); ctx.ellipse(x, y, w, 2 + r() * 3, r() * 0.5 - 0.25, 0, Math.PI * 2); ctx.fill();
  }
  tex.update(true);
  return tex;
}
