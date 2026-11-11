// Procedural canvas textures. Nothing is downloaded: every surface is drawn at load time.
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { Scene } from '@babylonjs/core/scene';
import { Rng } from '../shared/math';

type Draw = (ctx: CanvasRenderingContext2D, size: number, rng: Rng) => void;

export function makeTexture(scene: Scene, name: string, size: number, draw: Draw, alpha = false): DynamicTexture {
  const tex = new DynamicTexture(name, { width: size, height: size }, scene, true);
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
  draw(ctx, size, new Rng(name.length * 7919 + size));
  tex.update(false);
  tex.hasAlpha = alpha;
  tex.wrapU = Texture.WRAP_ADDRESSMODE;
  tex.wrapV = Texture.WRAP_ADDRESSMODE;
  tex.anisotropicFilteringLevel = 8;
  return tex;
}

function speckle(ctx: CanvasRenderingContext2D, s: number, rng: Rng, n: number, lo: number, hi: number, alpha: number, maxR = 1.6): void {
  for (let i = 0; i < n; i++) {
    const v = Math.floor(rng.range(lo, hi));
    ctx.fillStyle = `rgba(${v},${v},${v},${alpha})`;
    const r = rng.range(0.4, maxR);
    ctx.fillRect(rng.next() * s, rng.next() * s, r, r);
  }
}

function blotches(ctx: CanvasRenderingContext2D, s: number, rng: Rng, n: number, shade: number, alpha: number): void {
  for (let i = 0; i < n; i++) {
    const x = rng.next() * s;
    const y = rng.next() * s;
    const r = rng.range(s * 0.04, s * 0.2);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${shade},${shade},${shade},${alpha})`);
    g.addColorStop(1, `rgba(${shade},${shade},${shade},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
}

export const drawConcrete: Draw = (ctx, s, rng) => {
  ctx.fillStyle = '#d9d7d0';
  ctx.fillRect(0, 0, s, s);
  blotches(ctx, s, rng, 26, 120, 0.1);
  blotches(ctx, s, rng, 18, 255, 0.1);
  speckle(ctx, s, rng, 9000, 90, 250, 0.16);
  // formwork panel seams (texture spans 4 m: seams every 2 m horizontally, 1 m vertically)
  ctx.strokeStyle = 'rgba(60,58,54,0.5)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * (s / 2) + 1, 0);
    ctx.lineTo(i * (s / 2) + 1, s);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(60,58,54,0.3)';
  for (let j = 0; j < 4; j++) {
    ctx.beginPath();
    ctx.moveTo(0, j * (s / 4) + 1);
    ctx.lineTo(s, j * (s / 4) + 1);
    ctx.stroke();
  }
  // tie holes
  ctx.fillStyle = 'rgba(50,48,45,0.55)';
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 4; j++) {
      for (const [ox, oy] of [
        [0.12, 0.2],
        [0.88, 0.2],
        [0.12, 0.8],
        [0.88, 0.8],
      ]) {
        ctx.beginPath();
        ctx.arc((i + ox) * (s / 2), (j + oy) * (s / 4), s / 220, 0, 7);
        ctx.fill();
      }
    }
  // drip stains
  for (let i = 0; i < 14; i++) {
    const x = rng.next() * s;
    const g = ctx.createLinearGradient(0, 0, 0, s * 0.3);
    g.addColorStop(0, 'rgba(70,66,60,0.16)');
    g.addColorStop(1, 'rgba(70,66,60,0)');
    ctx.fillStyle = g;
    ctx.save();
    ctx.translate(x, Math.floor(rng.next() * 4) * (s / 4));
    ctx.fillRect(0, 0, rng.range(3, 12), s * 0.3);
    ctx.restore();
  }
};

export const drawAcoustic: Draw = (ctx, s, rng) => {
  ctx.fillStyle = '#b9b9bd';
  ctx.fillRect(0, 0, s, s);
  speckle(ctx, s, rng, 4000, 120, 230, 0.12);
  // vertical acoustic slats
  const n = 32;
  for (let i = 0; i < n; i++) {
    const x = (i / n) * s;
    ctx.fillStyle = 'rgba(20,20,26,0.55)';
    ctx.fillRect(x, 0, s / n / 3, s);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(x + s / n / 3, 0, 1.5, s);
  }
  ctx.fillStyle = 'rgba(15,15,20,0.6)';
  for (let j = 0; j < 2; j++) ctx.fillRect(0, j * (s / 2), s, 5);
};

export const drawAsphalt: Draw = (ctx, s, rng) => {
  ctx.fillStyle = '#b4b2ae';
  ctx.fillRect(0, 0, s, s);
  blotches(ctx, s, rng, 30, 70, 0.14);
  blotches(ctx, s, rng, 14, 240, 0.08);
  speckle(ctx, s, rng, 22000, 40, 255, 0.22, 2.2);
  ctx.strokeStyle = 'rgba(30,30,30,0.35)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 9; i++) {
    let x = rng.next() * s;
    let y = rng.next() * s;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let k = 0; k < 7; k++) {
      x += rng.range(-s * 0.06, s * 0.06);
      y += rng.range(-s * 0.06, s * 0.06);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // expansion joints every 4 m
  ctx.strokeStyle = 'rgba(25,25,25,0.4)';
  ctx.lineWidth = 3;
  ctx.strokeRect(1, 1, s - 2, s - 2);
};

export const drawTile: Draw = (ctx, s, rng) => {
  const n = 4; // 0.5 m tiles on a 2 m texture
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const v = Math.floor(rng.range(222, 246));
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect((i * s) / n, (j * s) / n, s / n, s / n);
    }
  speckle(ctx, s, rng, 3000, 150, 255, 0.1);
  ctx.strokeStyle = 'rgba(70,74,78,0.75)';
  ctx.lineWidth = 3;
  for (let i = 0; i <= n; i++) {
    ctx.beginPath();
    ctx.moveTo((i * s) / n, 0);
    ctx.lineTo((i * s) / n, s);
    ctx.moveTo(0, (i * s) / n);
    ctx.lineTo(s, (i * s) / n);
    ctx.stroke();
  }
};

export const drawPolished: Draw = (ctx, s, rng) => {
  ctx.fillStyle = '#c9c9cc';
  ctx.fillRect(0, 0, s, s);
  blotches(ctx, s, rng, 22, 255, 0.12);
  blotches(ctx, s, rng, 22, 90, 0.1);
  speckle(ctx, s, rng, 5000, 120, 255, 0.1);
  ctx.strokeStyle = 'rgba(40,42,48,0.55)';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(1, 1, s - 2, s - 2);
  ctx.beginPath();
  ctx.moveTo(s / 2, 0);
  ctx.lineTo(s / 2, s);
  ctx.moveTo(0, s / 2);
  ctx.lineTo(s, s / 2);
  ctx.stroke();
};

export const drawMetal: Draw = (ctx, s, rng) => {
  ctx.fillStyle = '#c4c4c4';
  ctx.fillRect(0, 0, s, s);
  // corrugation
  const n = 16;
  for (let i = 0; i < n; i++) {
    const x = (i / n) * s;
    const g = ctx.createLinearGradient(x, 0, x + s / n, 0);
    g.addColorStop(0, 'rgba(0,0,0,0.3)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.22)');
    g.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, s / n, s);
  }
  blotches(ctx, s, rng, 12, 80, 0.12);
  speckle(ctx, s, rng, 2500, 60, 200, 0.2, 2.5);
  ctx.fillStyle = 'rgba(20,20,20,0.45)';
  ctx.fillRect(0, 0, s, 6);
  ctx.fillRect(0, s - 6, s, 6);
};

export const drawPlate: Draw = (ctx, s, rng) => {
  ctx.fillStyle = '#b8babd';
  ctx.fillRect(0, 0, s, s);
  speckle(ctx, s, rng, 3000, 80, 240, 0.15);
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  const n = 12;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const x = ((i + 0.5) / n) * s;
      const y = ((j + 0.5) / n) * s;
      const d = (i + j) % 2 ? 1 : -1;
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.moveTo(x - 7, y - 7 * d);
      ctx.lineTo(x + 7, y + 7 * d);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.moveTo(x - 7, y - 7 * d + 2);
      ctx.lineTo(x + 7, y + 7 * d + 2);
      ctx.stroke();
    }
  ctx.strokeStyle = 'rgba(20,20,20,0.5)';
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, s, s);
};

export const drawWood: Draw = (ctx, s, rng) => {
  ctx.fillStyle = '#c8a877';
  ctx.fillRect(0, 0, s, s);
  const planks = 5;
  for (let i = 0; i < planks; i++) {
    const v = rng.range(-14, 14);
    ctx.fillStyle = `rgb(${196 + v},${164 + v},${116 + v})`;
    ctx.fillRect(0, (i * s) / planks, s, s / planks - 2);
    ctx.strokeStyle = 'rgba(90,60,30,0.22)';
    ctx.lineWidth = 1;
    for (let k = 0; k < 9; k++) {
      const y = (i * s) / planks + rng.next() * (s / planks);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(s * 0.3, y + rng.range(-4, 4), s * 0.6, y + rng.range(-4, 4), s, y + rng.range(-3, 3));
      ctx.stroke();
    }
  }
  // crate frame and diagonal brace
  ctx.strokeStyle = '#8c6c42';
  ctx.lineWidth = s * 0.085;
  ctx.strokeRect(s * 0.042, s * 0.042, s * 0.916, s * 0.916);
  ctx.lineWidth = s * 0.07;
  ctx.beginPath();
  ctx.moveTo(s * 0.08, s * 0.92);
  ctx.lineTo(s * 0.92, s * 0.08);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(40,25,10,0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(s * 0.085, s * 0.085, s * 0.83, s * 0.83);
  ctx.strokeRect(1, 1, s - 2, s - 2);
  ctx.fillStyle = 'rgba(40,30,20,0.6)';
  for (const [x, y] of [
    [0.05, 0.05],
    [0.95, 0.05],
    [0.05, 0.95],
    [0.95, 0.95],
  ]) {
    ctx.beginPath();
    ctx.arc(x * s, y * s, s * 0.012, 0, 7);
    ctx.fill();
  }
};

/** Penetrable service panel: perforated sheet with hazard chevrons so "shootable" reads at a glance. */
export const drawPenPanel: Draw = (ctx, s, rng) => {
  ctx.fillStyle = '#9a8f80';
  ctx.fillRect(0, 0, s, s);
  speckle(ctx, s, rng, 2500, 60, 220, 0.14);
  ctx.fillStyle = 'rgba(20,18,16,0.7)';
  const n = 20;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      ctx.beginPath();
      ctx.arc(((i + 0.5 + (j % 2) * 0.5) / n) * s, ((j + 0.5) / n) * s, s / n / 4.5, 0, 7);
      ctx.fill();
    }
  // hazard band
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, s * 0.42, s, s * 0.12);
  ctx.clip();
  ctx.fillStyle = '#e9b232';
  ctx.fillRect(0, 0, s, s);
  ctx.fillStyle = '#1b1a18';
  for (let x = -s; x < s * 2; x += s / 8) {
    ctx.beginPath();
    ctx.moveTo(x, s * 0.42);
    ctx.lineTo(x + s / 16, s * 0.42);
    ctx.lineTo(x + s / 16 - s * 0.12, s * 0.54);
    ctx.lineTo(x - s * 0.12, s * 0.54);
    ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(15,15,15,0.7)';
  ctx.lineWidth = 5;
  ctx.strokeRect(2, 2, s - 4, s - 4);
};

export const drawFoliage: Draw = (ctx, s, rng) => {
  ctx.fillStyle = '#2f5a2c';
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 900; i++) {
    const x = rng.next() * s;
    const y = rng.next() * s;
    const g = Math.floor(rng.range(90, 200));
    ctx.fillStyle = `rgba(${Math.floor(g * 0.45)},${g},${Math.floor(g * 0.35)},0.85)`;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rng.next() * 6.28);
    ctx.beginPath();
    ctx.ellipse(0, 0, rng.range(4, 11), rng.range(2, 4.5), 0, 0, 7);
    ctx.fill();
    ctx.restore();
  }
  for (let i = 0; i < 120; i++) {
    ctx.fillStyle = 'rgba(8,22,10,0.5)';
    ctx.beginPath();
    ctx.arc(rng.next() * s, rng.next() * s, rng.range(2, 7), 0, 7);
    ctx.fill();
  }
};

export const drawSoil: Draw = (ctx, s, rng) => {
  ctx.fillStyle = '#6e5a48';
  ctx.fillRect(0, 0, s, s);
  speckle(ctx, s, rng, 14000, 30, 190, 0.3, 3);
  blotches(ctx, s, rng, 20, 30, 0.2);
};

export const drawSoft: Draw = (ctx, s) => {
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.7)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.clearRect(0, 0, s, s);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
};

export const drawSmoke: Draw = (ctx, s, rng) => {
  ctx.fillStyle = '#b9bcc0';
  ctx.fillRect(0, 0, s, s);
  blotches(ctx, s, rng, 40, 255, 0.18);
  blotches(ctx, s, rng, 40, 120, 0.16);
};

export const drawHole: Draw = (ctx, s) => {
  ctx.clearRect(0, 0, s, s);
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(8,8,8,0.95)');
  g.addColorStop(0.28, 'rgba(14,14,14,0.9)');
  g.addColorStop(0.5, 'rgba(40,38,36,0.45)');
  g.addColorStop(1, 'rgba(40,38,36,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
};

export const drawMuzzle: Draw = (ctx, s, rng) => {
  ctx.clearRect(0, 0, s, s);
  ctx.translate(s / 2, s / 2);
  for (let i = 0; i < 7; i++) {
    ctx.rotate((Math.PI * 2) / 7 + rng.range(-0.2, 0.2));
    const len = rng.range(s * 0.25, s * 0.48);
    const g = ctx.createLinearGradient(0, 0, len, 0);
    g.addColorStop(0, 'rgba(255,250,220,1)');
    g.addColorStop(0.4, 'rgba(255,200,90,0.8)');
    g.addColorStop(1, 'rgba(255,120,30,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.05);
    ctx.lineTo(len, 0);
    ctx.lineTo(0, s * 0.05);
    ctx.fill();
  }
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.2);
  g.addColorStop(0, 'rgba(255,255,240,1)');
  g.addColorStop(1, 'rgba(255,220,120,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-s / 2, -s / 2, s, s);
};

export const drawRing: Draw = (ctx, s) => {
  ctx.clearRect(0, 0, s, s);
  const g = ctx.createRadialGradient(s / 2, s / 2, s * 0.36, s / 2, s / 2, s * 0.5);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.7, 'rgba(255,255,255,0.9)');
  g.addColorStop(0.85, 'rgba(255,255,255,1)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
};

export const drawFlame: Draw = (ctx, s, rng) => {
  ctx.clearRect(0, 0, s, s);
  for (let i = 0; i < 9; i++) {
    const x = s * rng.range(0.25, 0.75);
    const w = s * rng.range(0.1, 0.22);
    const h = s * rng.range(0.45, 0.95);
    const g = ctx.createLinearGradient(0, s, 0, s - h);
    g.addColorStop(0, 'rgba(255,240,170,0.95)');
    g.addColorStop(0.35, 'rgba(255,150,40,0.8)');
    g.addColorStop(1, 'rgba(230,50,10,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - w, s);
    ctx.quadraticCurveTo(x - w * 0.6, s - h * 0.5, x + rng.range(-w, w) * 0.4, s - h);
    ctx.quadraticCurveTo(x + w * 0.6, s - h * 0.5, x + w, s);
    ctx.fill();
  }
};

export function unlit(scene: Scene, name: string, color: [number, number, number], alpha = 1): StandardMaterial {
  const m = new StandardMaterial(name, scene);
  m.disableLighting = true;
  m.emissiveColor = new Color3(color[0], color[1], color[2]);
  m.diffuseColor = new Color3(0, 0, 0);
  m.specularColor = new Color3(0, 0, 0);
  m.alpha = alpha;
  return m;
}
