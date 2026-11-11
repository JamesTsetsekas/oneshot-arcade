// renderer: every surface texture is generated procedurally on a canvas at load (no external image assets).
import { Color3, DynamicTexture, Scene, StandardMaterial, Texture } from './bjs';

export interface MatDef { mat: StandardMaterial; tile: number; doubleSided?: boolean; vtile?: number }

type Draw = (g: CanvasRenderingContext2D, s: number, rnd: () => number) => void;

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function speckle(g: CanvasRenderingContext2D, s: number, rnd: () => number, n: number, light: string, dark: string, maxR = 2.2): void {
  for (let i = 0; i < n; i++) {
    g.fillStyle = rnd() < 0.5 ? light : dark;
    g.globalAlpha = 0.04 + rnd() * 0.1;
    const r = 0.5 + rnd() * maxR;
    g.fillRect(rnd() * s, rnd() * s, r, r);
  }
  g.globalAlpha = 1;
}

function blotches(g: CanvasRenderingContext2D, s: number, rnd: () => number, n: number, color: string, alpha: number, rMin: number, rMax: number): void {
  for (let i = 0; i < n; i++) {
    const x = rnd() * s, y = rnd() * s, r = rMin + rnd() * (rMax - rMin);
    // draw wrapped so the tile is seamless
    for (const ox of [-s, 0, s]) for (const oy of [-s, 0, s]) {
      if (x + ox + r < 0 || x + ox - r > s || y + oy + r < 0 || y + oy - r > s) continue;
      const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
      gr.addColorStop(0, color); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.globalAlpha = alpha * (0.4 + rnd() * 0.6);
      g.fillStyle = gr;
      g.fillRect(x + ox - r, y + oy - r, r * 2, r * 2);
    }
  }
  g.globalAlpha = 1;
}

function streaks(g: CanvasRenderingContext2D, s: number, rnd: () => number, n: number, color: string, alpha: number): void {
  for (let i = 0; i < n; i++) {
    const x = rnd() * s, y = rnd() * s * 0.6, h = 30 + rnd() * s * 0.5, w = 2 + rnd() * 7;
    const gr = g.createLinearGradient(0, y, 0, y + h);
    gr.addColorStop(0, color); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = alpha * (0.3 + rnd() * 0.7);
    g.fillStyle = gr;
    g.fillRect(x, y, w, h);
  }
  g.globalAlpha = 1;
}

function canvasOf(size: number, seed: number, draw: Draw): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  draw(g, size, rng(seed));
  return c;
}

function toTexture(scene: Scene, name: string, c: HTMLCanvasElement, alpha = false): DynamicTexture {
  const t = new DynamicTexture(name, { width: c.width, height: c.height }, scene, true);
  const ctx = t.getContext() as unknown as CanvasRenderingContext2D;
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.drawImage(c, 0, 0);
  t.update(true); // canvas top = v 1, so printed text stays upright on walls
  t.hasAlpha = alpha;
  t.wrapU = Texture.WRAP_ADDRESSMODE; t.wrapV = Texture.WRAP_ADDRESSMODE;
  t.anisotropicFilteringLevel = 8;
  return t;
}

/** Sobel height->normal conversion from the luminance of a canvas. */
function normalFrom(scene: Scene, name: string, src: HTMLCanvasElement, strength: number): DynamicTexture {
  const s = src.width;
  const img = src.getContext('2d')!.getImageData(0, 0, s, s).data;
  const h = new Float32Array(s * s);
  for (let i = 0; i < s * s; i++) h[i] = (img[i * 4] * 0.3 + img[i * 4 + 1] * 0.59 + img[i * 4 + 2] * 0.11) / 255;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d')!;
  const out = g.createImageData(s, s);
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const xl = (x + s - 1) % s, xr = (x + 1) % s, yu = (y + s - 1) % s, yd = (y + 1) % s;
      const dx = (h[y * s + xr] - h[y * s + xl]) * strength, dy = (h[yd * s + x] - h[yu * s + x]) * strength;
      const l = 1 / Math.sqrt(dx * dx + dy * dy + 1);
      const o = (y * s + x) * 4;
      out.data[o] = (-dx * l * 0.5 + 0.5) * 255; out.data[o + 1] = (-dy * l * 0.5 + 0.5) * 255; out.data[o + 2] = (l * 0.5 + 0.5) * 255; out.data[o + 3] = 255;
    }
  }
  g.putImageData(out, 0, 0);
  return toTexture(scene, name, c);
}

function panelGrid(g: CanvasRenderingContext2D, s: number, cols: number, rows: number, line: string, hi: string, rivets: boolean, rnd: () => number): void {
  const cw = s / cols, ch = s / rows;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      g.globalAlpha = rnd() * 0.07;
      g.fillStyle = rnd() < 0.5 ? '#000' : '#fff';
      g.fillRect(i * cw, j * ch, cw, ch);
    }
  }
  g.globalAlpha = 1;
  g.lineWidth = 3; g.strokeStyle = line;
  for (let i = 0; i <= cols; i++) { g.beginPath(); g.moveTo(i * cw, 0); g.lineTo(i * cw, s); g.stroke(); }
  for (let j = 0; j <= rows; j++) { g.beginPath(); g.moveTo(0, j * ch); g.lineTo(s, j * ch); g.stroke(); }
  g.lineWidth = 1; g.strokeStyle = hi;
  for (let i = 0; i <= cols; i++) { g.beginPath(); g.moveTo(i * cw + 2.5, 0); g.lineTo(i * cw + 2.5, s); g.stroke(); }
  for (let j = 0; j <= rows; j++) { g.beginPath(); g.moveTo(0, j * ch + 2.5); g.lineTo(s, j * ch + 2.5); g.stroke(); }
  if (rivets) {
    g.fillStyle = line;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      for (const [ax, ay] of [[0.06, 0.1], [0.94, 0.1], [0.06, 0.9], [0.94, 0.9]]) { g.beginPath(); g.arc((i + ax) * cw, (j + ay) * ch, 2.2, 0, 7); g.fill(); }
    }
  }
}

export function buildMaterials(scene: Scene): Record<string, MatDef> {
  const out: Record<string, MatDef> = {};
  const S = 512;
  const mk = (name: string, tile: number, seed: number, draw: Draw, opts: { bump?: number; spec?: number; power?: number; alpha?: boolean; doubleSided?: boolean; emissive?: Color3; vtile?: number; alphaValue?: number } = {}): StandardMaterial => {
    const c = canvasOf(S, seed, draw);
    const m = new StandardMaterial('m_' + name, scene);
    m.diffuseTexture = toTexture(scene, 't_' + name, c, !!opts.alpha);
    if (opts.bump) { m.bumpTexture = normalFrom(scene, 'n_' + name, c, opts.bump); }
    const sp = opts.spec ?? 0.06;
    m.specularColor = new Color3(sp, sp, sp);
    m.specularPower = opts.power ?? 24;
    if (opts.alpha) { m.useAlphaFromDiffuseTexture = true; m.transparencyMode = 1; m.alphaCutOff = 0.5; m.backFaceCulling = false; }
    if (opts.doubleSided) m.backFaceCulling = false;
    if (opts.emissive) m.emissiveColor = opts.emissive;
    if (opts.alphaValue !== undefined) { m.alpha = opts.alphaValue; m.backFaceCulling = false; }
    out[name] = { mat: m, tile, doubleSided: opts.doubleSided || opts.alpha, vtile: opts.vtile };
    return m;
  };

  mk('ground', 6, 11, (g, s, r) => {
    g.fillStyle = '#a3a59f'; g.fillRect(0, 0, s, s);
    blotches(g, s, r, 26, 'rgba(70,72,70,1)', 0.16, 30, 110);
    blotches(g, s, r, 20, 'rgba(225,225,215,1)', 0.14, 30, 90);
    speckle(g, s, r, 5200, '#d5d5cd', '#55574f');
    g.strokeStyle = 'rgba(60,62,58,0.55)'; g.lineWidth = 3;
    g.strokeRect(1.5, 1.5, s - 3, s - 3);
    g.beginPath(); g.moveTo(s / 2, 0); g.lineTo(s / 2, s); g.moveTo(0, s / 2); g.lineTo(s, s / 2); g.stroke();
    g.strokeStyle = 'rgba(40,40,38,0.35)'; g.lineWidth = 1;
    for (let i = 0; i < 6; i++) { let x = r() * s, y = r() * s; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 7; k++) { x += (r() - 0.5) * 50; y += (r() - 0.5) * 50; g.lineTo(x, y); } g.stroke(); }
  }, { bump: 2.2 });

  mk('deck', 4, 12, (g, s, r) => {
    g.fillStyle = '#6f757b'; g.fillRect(0, 0, s, s);
    blotches(g, s, r, 22, 'rgba(40,44,48,1)', 0.2, 30, 120);
    blotches(g, s, r, 12, 'rgba(160,165,170,1)', 0.12, 30, 100);
    speckle(g, s, r, 7000, '#9aa0a6', '#3b4045', 1.8);
    g.strokeStyle = 'rgba(30,32,36,0.5)'; g.lineWidth = 2; g.strokeRect(1, 1, s - 2, s - 2);
  }, { bump: 2.6, spec: 0.1 });

  mk('floor', 2, 13, (g, s, r) => {
    g.fillStyle = '#868d93'; g.fillRect(0, 0, s, s);
    panelGrid(g, s, 2, 2, 'rgba(40,46,52,0.75)', 'rgba(255,255,255,0.18)', false, r);
    speckle(g, s, r, 2500, '#b9c0c5', '#51585e', 1.5);
    blotches(g, s, r, 8, 'rgba(40,44,48,1)', 0.12, 40, 120);
  }, { bump: 1.2, spec: 0.22, power: 40 });

  mk('concrete', 3, 14, (g, s, r) => {
    g.fillStyle = '#b9b6ad'; g.fillRect(0, 0, s, s);
    blotches(g, s, r, 22, 'rgba(90,88,80,1)', 0.14, 30, 110);
    speckle(g, s, r, 4500, '#dedbd2', '#6e6b62');
    streaks(g, s, r, 16, 'rgba(60,58,52,1)', 0.16);
    g.strokeStyle = 'rgba(70,68,62,0.5)'; g.lineWidth = 2;
    for (let j = 0; j <= 3; j++) { g.beginPath(); g.moveTo(0, (j * s) / 3); g.lineTo(s, (j * s) / 3); g.stroke(); }
    g.fillStyle = 'rgba(60,58,52,0.55)';
    for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) { g.beginPath(); g.arc((i + 0.5) * (s / 4), (j + 0.5) * (s / 3), 4, 0, 7); g.fill(); }
  }, { bump: 2.4 });

  mk('composite', 4, 15, (g, s, r) => {
    g.fillStyle = '#dedad0'; g.fillRect(0, 0, s, s);
    panelGrid(g, s, 2, 4, 'rgba(120,116,104,0.9)', 'rgba(255,255,255,0.5)', true, r);
    streaks(g, s, r, 22, 'rgba(120,104,84,1)', 0.14);
    blotches(g, s, r, 12, 'rgba(255,255,250,1)', 0.2, 40, 120);
    speckle(g, s, r, 2200, '#f4f1ea', '#a39e90', 1.6);
  }, { bump: 1.6, spec: 0.1 });

  mk('compositeDark', 4, 16, (g, s, r) => {
    g.fillStyle = '#75818b'; g.fillRect(0, 0, s, s);
    panelGrid(g, s, 2, 4, 'rgba(40,48,56,0.9)', 'rgba(200,215,225,0.3)', true, r);
    streaks(g, s, r, 22, 'rgba(40,40,40,1)', 0.16);
    speckle(g, s, r, 2200, '#a4b0ba', '#48525b', 1.6);
  }, { bump: 1.6, spec: 0.12 });

  mk('interior', 4, 17, (g, s, r) => {
    g.fillStyle = '#c6ccce'; g.fillRect(0, 0, s, s);
    panelGrid(g, s, 4, 2, 'rgba(110,120,126,0.7)', 'rgba(255,255,255,0.4)', false, r);
    speckle(g, s, r, 1500, '#e5e9ea', '#93999c', 1.4);
    g.fillStyle = 'rgba(52,96,106,0.85)'; g.fillRect(0, s * 0.56, s, s * 0.035);
  }, { bump: 0.8, spec: 0.08 });

  mk('roof', 3, 18, (g, s, r) => {
    g.fillStyle = '#59616a'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 16; i++) { const x = (i * s) / 16; const gr = g.createLinearGradient(x, 0, x + s / 16, 0); gr.addColorStop(0, 'rgba(0,0,0,0.3)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.14)'); gr.addColorStop(1, 'rgba(0,0,0,0.3)'); g.fillStyle = gr; g.fillRect(x, 0, s / 16, s); }
    speckle(g, s, r, 2000, '#8b949d', '#30363c');
    streaks(g, s, r, 10, 'rgba(120,80,50,1)', 0.14);
  }, { bump: 2, spec: 0.2 });

  mk('metal', 2, 19, (g, s, r) => {
    g.fillStyle = '#3d4249'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 900; i++) { g.globalAlpha = 0.05 + r() * 0.07; g.fillStyle = r() < 0.5 ? '#7c858f' : '#15181c'; g.fillRect(r() * s, r() * s, 20 + r() * 80, 1); }
    g.globalAlpha = 1;
    panelGrid(g, s, 2, 2, 'rgba(15,17,20,0.85)', 'rgba(150,160,172,0.3)', true, r);
  }, { bump: 1.2, spec: 0.35, power: 48 });

  mk('thinMetal', 2, 20, (g, s, r) => {
    g.fillStyle = '#8b939b'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 12; i++) { const x = (i * s) / 12; const gr = g.createLinearGradient(x, 0, x + s / 12, 0); gr.addColorStop(0, 'rgba(0,0,0,0.25)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.18)'); gr.addColorStop(1, 'rgba(0,0,0,0.25)'); g.fillStyle = gr; g.fillRect(x, 0, s / 12, s); }
    speckle(g, s, r, 1800, '#c3cad0', '#4f565c');
    streaks(g, s, r, 8, 'rgba(110,70,40,1)', 0.14);
    g.fillStyle = 'rgba(232,115,28,0.9)'; g.fillRect(0, s * 0.04, s, s * 0.05);
  }, { bump: 1.8, spec: 0.3, power: 40, doubleSided: true });

  mk('orange', 2, 21, (g, s, r) => {
    g.fillStyle = '#e2701c'; g.fillRect(0, 0, s, s);
    panelGrid(g, s, 2, 2, 'rgba(96,40,6,0.85)', 'rgba(255,214,170,0.4)', true, r);
    blotches(g, s, r, 16, 'rgba(120,50,10,1)', 0.2, 20, 90);
    speckle(g, s, r, 1600, '#ffb26b', '#7a3406', 2.6);
    for (let i = 0; i < 26; i++) { g.globalAlpha = 0.5; g.fillStyle = '#9a9a96'; g.fillRect(r() * s, r() * s, 2 + r() * 12, 1 + r() * 2); }
    g.globalAlpha = 1;
  }, { bump: 1.4, spec: 0.22, power: 32 });

  mk('cyan', 2, 22, (g, s, r) => {
    g.fillStyle = '#20434c'; g.fillRect(0, 0, s, s);
    panelGrid(g, s, 2, 4, 'rgba(6,18,22,0.9)', 'rgba(90,200,215,0.3)', false, r);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 2; i++) {
      for (let k = 0; k < 9; k++) { g.fillStyle = r() < 0.3 ? '#35e0f0' : r() < 0.5 ? '#f08a2a' : '#0b1b20'; g.fillRect(i * (s / 2) + 20 + k * 22, j * (s / 4) + 26, 12, 5); }
      g.fillStyle = 'rgba(8,20,24,0.9)';
      for (let k = 0; k < 6; k++) g.fillRect(i * (s / 2) + 20, j * (s / 4) + 50 + k * 11, s / 2 - 40, 5);
    }
    speckle(g, s, r, 800, '#4f8792', '#081418');
  }, { bump: 1.2, spec: 0.3, power: 48 });

  mk('wood', 1.5, 23, (g, s, r) => {
    g.fillStyle = '#b08d5c'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 6; i++) {
      const y = (i * s) / 6;
      g.fillStyle = `rgba(${60 + r() * 60},${40 + r() * 40},${15 + r() * 20},${0.1 + r() * 0.14})`; g.fillRect(0, y, s, s / 6);
      g.fillStyle = 'rgba(50,32,14,0.7)'; g.fillRect(0, y, s, 3);
    }
    for (let i = 0; i < 500; i++) { g.globalAlpha = 0.06 + r() * 0.1; g.fillStyle = r() < 0.5 ? '#e0c592' : '#5b401f'; g.fillRect(r() * s, r() * s, 30 + r() * 120, 1); }
    g.globalAlpha = 1;
    g.fillStyle = '#7d6039'; const b = s * 0.085;
    g.fillRect(0, 0, s, b); g.fillRect(0, s - b, s, b); g.fillRect(0, 0, b, s); g.fillRect(s - b, 0, b, s);
    g.strokeStyle = 'rgba(40,26,10,0.8)'; g.lineWidth = 3; g.strokeRect(b, b, s - 2 * b, s - 2 * b); g.strokeRect(1.5, 1.5, s - 3, s - 3);
    g.fillStyle = 'rgba(30,30,30,0.75)'; g.font = `bold ${s * 0.11}px Bahnschrift, Arial Narrow, sans-serif`; g.textAlign = 'center';
    g.fillText('K-17 STORES', s / 2, s * 0.56);
    g.fillStyle = 'rgba(40,28,14,0.9)';
    for (const [x, y] of [[b / 2, b / 2], [s - b / 2, b / 2], [b / 2, s - b / 2], [s - b / 2, s - b / 2]]) { g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); }
  }, { bump: 2, spec: 0.05 });

  mk('rock', 5, 24, (g, s, r) => {
    g.fillStyle = '#8d8a7d'; g.fillRect(0, 0, s, s);
    blotches(g, s, r, 60, 'rgba(50,50,44,1)', 0.22, 14, 80);
    blotches(g, s, r, 50, 'rgba(190,186,170,1)', 0.2, 12, 70);
    blotches(g, s, r, 18, 'rgba(110,120,84,1)', 0.14, 20, 90);
    speckle(g, s, r, 9000, '#c2bfb0', '#48463d', 3);
  }, { bump: 4.5, spec: 0.03 });

  const container = (name: string, seed: number, base: string, dark: string, mark: string) => mk(name, 2.6, seed, (g, s, r) => {
    g.fillStyle = base; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 20; i++) { const x = (i * s) / 20; const gr = g.createLinearGradient(x, 0, x + s / 20, 0); gr.addColorStop(0, 'rgba(0,0,0,0.34)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.16)'); gr.addColorStop(1, 'rgba(0,0,0,0.34)'); g.fillStyle = gr; g.fillRect(x, 0, s / 20, s); }
    streaks(g, s, r, 18, 'rgba(96,52,24,1)', 0.22);
    blotches(g, s, r, 10, 'rgba(110,60,30,1)', 0.16, 14, 60);
    g.fillStyle = dark; g.fillRect(0, 0, s, s * 0.05); g.fillRect(0, s * 0.95, s, s * 0.05);
    g.fillStyle = mark; g.globalAlpha = 0.85; g.font = `bold ${s * 0.085}px Bahnschrift, Arial Narrow, sans-serif`; g.fillText('MERIDIAN FREIGHT', s * 0.08, s * 0.22);
    g.font = `${s * 0.05}px Bahnschrift, Arial Narrow, sans-serif`; g.fillText('MFU 17' + Math.floor(1000 + r() * 8999) + '  22G1', s * 0.08, s * 0.3);
    g.globalAlpha = 1;
    speckle(g, s, r, 1200, '#ffffff', '#000000');
  }, { bump: 2.4, spec: 0.16, power: 28 });
  container('containerA', 31, '#3d6d8c', '#274960', '#e7edf0');
  container('containerB', 32, '#b55a2f', '#7c3a1c', '#f1e4d6');
  container('containerC', 33, '#c3c6c2', '#8b8f8b', '#3c4a55');

  mk('pipe', 2, 25, (g, s, r) => {
    g.fillStyle = '#2f8a8e'; g.fillRect(0, 0, s, s);
    blotches(g, s, r, 14, 'rgba(14,50,54,1)', 0.22, 20, 100);
    speckle(g, s, r, 1500, '#7fd0d2', '#134244');
    g.fillStyle = 'rgba(12,40,44,0.8)'; for (let i = 0; i < 2; i++) g.fillRect(0, i * (s / 2) + 6, s, 10);
    streaks(g, s, r, 10, 'rgba(110,70,40,1)', 0.18);
  }, { bump: 1, spec: 0.3, power: 40 });

  mk('vehicle', 2.5, 26, (g, s, r) => {
    g.fillStyle = '#d0d3d1'; g.fillRect(0, 0, s, s);
    panelGrid(g, s, 1, 2, 'rgba(70,74,76,0.8)', 'rgba(255,255,255,0.6)', false, r);
    g.fillStyle = '#e2701c'; g.fillRect(0, s * 0.3, s, s * 0.08);
    g.fillStyle = '#20434c'; g.fillRect(0, s * 0.39, s, s * 0.025);
    streaks(g, s, r, 10, 'rgba(70,60,50,1)', 0.14);
    speckle(g, s, r, 1000, '#ffffff', '#7d8182');
  }, { bump: 0.8, spec: 0.3, power: 48 });

  // alpha-tested railing: posts + rails (1.5 m wide tile, 1.05 m tall)
  mk('rail', 1.5, 27, (g, s) => {
    g.clearRect(0, 0, s, s);
    g.fillStyle = '#d9dde0';
    g.fillRect(0, 0, s, s * 0.07); // top rail (v=1 is the top after flip)
    g.fillRect(0, s * 0.46, s, s * 0.045);
    g.fillRect(0, s * 0.93, s, s * 0.07);
    g.fillRect(0, 0, s * 0.035, s); g.fillRect(s * 0.965, 0, s * 0.035, s);
    g.fillStyle = '#e2701c'; g.fillRect(0, 0, s, s * 0.03);
  }, { alpha: true, vtile: 1.05, spec: 0.3 });

  mk('grate', 1, 28, (g, s) => {
    g.fillStyle = '#4a5057'; g.fillRect(0, 0, s, s);
    g.fillStyle = '#16191d';
    const n = 8, c = s / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) g.fillRect(i * c + c * 0.16, j * c + c * 0.16, c * 0.68, c * 0.68);
    g.strokeStyle = 'rgba(190,200,208,0.4)'; g.lineWidth = 2;
    for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * c, 0); g.lineTo(i * c, s); g.moveTo(0, i * c); g.lineTo(s, i * c); g.stroke(); }
  }, { bump: 3, spec: 0.3, power: 32, doubleSided: true });

  // flat helper materials
  const flat = (name: string, color: string, emissive = 0, spec = 0.05, alpha = 1): void => {
    const m = new StandardMaterial('m_' + name, scene);
    const c = Color3.FromHexString(color);
    m.diffuseColor = c;
    m.specularColor = new Color3(spec, spec, spec);
    if (emissive > 0) { m.emissiveColor = c.scale(emissive); m.disableLighting = emissive >= 1; }
    if (alpha < 1) { m.alpha = alpha; m.backFaceCulling = false; }
    out[name] = { mat: m, tile: 1, doubleSided: alpha < 1 };
  };
  flat('paint', '#f0a81e', 0, 0.08);
  flat('paintWhite', '#e9ece8', 0, 0.08);
  flat('lamp', '#fff1d6', 1);
  flat('cyanGlow', '#3ce6f5', 1);
  flat('orangeGlow', '#ff8a2a', 1);
  flat('dark', '#24282d', 0, 0.2);
  flat('screen', '#3fb8d0', 0.85);
  // window glass
  {
    const m = new StandardMaterial('m_glass', scene);
    m.diffuseColor = new Color3(0.5, 0.75, 0.8);
    m.emissiveColor = new Color3(0.08, 0.14, 0.16);
    m.specularColor = new Color3(0.9, 0.9, 0.9);
    m.specularPower = 96;
    m.alpha = 0.3;
    m.backFaceCulling = false;
    out.glass = { mat: m, tile: 1, doubleSided: true };
  }
  return out;
}

/** Soft radial sprite used by particles, glows and decals. */
export function radialTexture(scene: Scene, name: string, stops: [number, string][], size = 128): DynamicTexture {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [o, col] of stops) gr.addColorStop(o, col);
  g.fillStyle = gr;
  g.fillRect(0, 0, size, size);
  const t = toTexture(scene, name, c, true);
  t.wrapU = Texture.CLAMP_ADDRESSMODE; t.wrapV = Texture.CLAMP_ADDRESSMODE;
  return t;
}

export function canvasTexture(scene: Scene, name: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, alpha = true): DynamicTexture {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d')!);
  const t = new DynamicTexture(name, { width: w, height: h }, scene, true);
  const ctx = t.getContext() as unknown as CanvasRenderingContext2D;
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(c, 0, 0);
  t.update(false);
  t.hasAlpha = alpha;
  t.wrapU = Texture.CLAMP_ADDRESSMODE; t.wrapV = Texture.CLAMP_ADDRESSMODE;
  return t;
}
