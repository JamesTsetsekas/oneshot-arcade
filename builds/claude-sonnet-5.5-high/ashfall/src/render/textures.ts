// Procedural textures: zone floor (baked colour + ambient occlusion) and wall stone.
import * as THREE from 'three';
import type { Zone } from '../sim/world';
import { FLOOR, WALL } from '../sim/nav';
import { hash2 } from './geo';

const PAL = {
  wild: { base: [84, 76, 72], alt: [96, 86, 80], spot: [50, 46, 46], tint: [90, 40, 30] },
  town: { base: [96, 88, 78], alt: [104, 95, 84], spot: [60, 54, 48], tint: [110, 70, 40] },
  crypt: { base: [82, 92, 96], alt: [94, 104, 108], spot: [52, 60, 64], tint: [40, 80, 90] },
};

function rgb(c: number[], f = 1): string {
  return `rgb(${Math.round(c[0] * f)},${Math.round(c[1] * f)},${Math.round(c[2] * f)})`;
}

export function makeFloorTexture(zone: Zone, renderer: THREE.WebGLRenderer): THREE.CanvasTexture {
  const PX = zone.w * zone.h > 6000 ? 12 : 16;
  const W = zone.w * PX;
  const H = zone.h * PX;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d')!;
  const pal = PAL[zone.theme];
  ctx.fillStyle = rgb(pal.spot, 0.6);
  ctx.fillRect(0, 0, W, H);
  const cells = zone.grid.cells;
  for (let z = 0; z < zone.h; z++) {
    for (let x = 0; x < zone.w; x++) {
      const c = cells[z * zone.w + x];
      if (c === WALL) continue;
      const h = hash2(x, z);
      const big = hash2(Math.floor(x / 4), Math.floor(z / 4));
      let col = pal.base;
      if (big > 0.55) col = pal.alt;
      const f = 0.94 + h * 0.08 + (big - 0.5) * 0.12;
      ctx.fillStyle = rgb(col, f);
      ctx.fillRect(x * PX, z * PX, PX, PZ(PX));
      if (zone.theme !== 'wild') {
        // flagstone seams
        ctx.strokeStyle = 'rgba(0,0,0,0.16)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x * PX + 0.5, z * PX + 0.5, PX - 1, PX - 1);
        if (h > 0.7) {
          ctx.fillStyle = 'rgba(255,255,255,0.04)';
          ctx.fillRect(x * PX + 2, z * PX + 2, PX - 4, PX - 4);
        }
      }
    }
  }
  // grit + cracks + ash drifts
  const rnd = (n: number) => hash2(n * 12.9898, n * 78.233);
  for (let i = 0; i < zone.w * zone.h * 3; i++) {
    const x = rnd(i) * W;
    const y = rnd(i + 99999) * H;
    const cx = Math.floor(x / PX);
    const cz = Math.floor(y / PX);
    if (cells[Math.min(zone.h - 1, cz) * zone.w + Math.min(zone.w - 1, cx)] === WALL) continue;
    ctx.fillStyle = `rgba(${rnd(i + 5) > 0.5 ? '255,255,255' : '0,0,0'},${0.04 + rnd(i + 3) * 0.08})`;
    ctx.fillRect(x, y, 1 + rnd(i + 8) * 3, 1 + rnd(i + 7) * 3);
  }
  ctx.lineCap = 'round';
  for (let i = 0; i < zone.w * zone.h * 0.03; i++) {
    let x = rnd(i * 3) * W;
    let y = rnd(i * 3 + 1) * H;
    const cx = Math.floor(x / PX);
    const cz = Math.floor(y / PX);
    if (cells[Math.min(zone.h - 1, cz) * zone.w + Math.min(zone.w - 1, cx)] === WALL) continue;
    ctx.strokeStyle = 'rgba(10,8,8,0.35)';
    ctx.lineWidth = 1 + rnd(i) * 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    let a = rnd(i * 7) * 6.28;
    for (let s = 0; s < 5; s++) {
      a += (rnd(i * 11 + s) - 0.5) * 1.4;
      x += Math.cos(a) * (6 + rnd(s + i) * 10);
      y += Math.sin(a) * (6 + rnd(s + i + 1) * 10);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  for (let i = 0; i < zone.w * zone.h * 0.04; i++) {
    const x = rnd(i * 5 + 2) * W;
    const y = rnd(i * 5 + 3) * H;
    const r = (3 + rnd(i * 5 + 4) * 9) * PX * 0.3;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const warm = rnd(i) > 0.7;
    g.addColorStop(0, warm ? 'rgba(120,50,30,0.16)' : 'rgba(20,18,18,0.22)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // baked ambient occlusion: low-res map upscaled with smoothing
  const AOS = 4;
  const ao = document.createElement('canvas');
  ao.width = zone.w * AOS;
  ao.height = zone.h * AOS;
  const actx = ao.getContext('2d')!;
  const img = actx.createImageData(ao.width, ao.height);
  const wallAt = (x: number, z: number) => (x < 0 || z < 0 || x >= zone.w || z >= zone.h ? 1 : cells[z * zone.w + x] === WALL ? 1 : cells[z * zone.w + x] !== FLOOR ? 0.5 : 0);
  for (let py = 0; py < ao.height; py++) {
    for (let px = 0; px < ao.width; px++) {
      const fx = (px + 0.5) / AOS;
      const fz = (py + 0.5) / AOS;
      let occ = 0;
      let wsum = 0;
      for (let dz = -3; dz <= 3; dz++)
        for (let dx = -3; dx <= 3; dx++) {
          const cx = Math.floor(fx) + dx;
          const cz = Math.floor(fz) + dz;
          const d = Math.hypot(cx + 0.5 - fx, cz + 0.5 - fz);
          if (d > 3.2) continue;
          const w = 1 / (0.6 + d * d);
          occ += wallAt(cx, cz) * w;
          wsum += w;
        }
      const k = Math.min(1, (occ / wsum) * 2.4);
      const i = (py * ao.width + px) * 4;
      img.data[i] = 0;
      img.data[i + 1] = 0;
      img.data[i + 2] = 4;
      img.data[i + 3] = Math.round(k * 210);
    }
  }
  actx.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(ao, 0, 0, W, H);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}
function PZ(n: number) {
  return n;
}

export function makeStoneTexture(renderer: THREE.WebGLRenderer, tint: number[] = [96, 94, 90]): THREE.CanvasTexture {
  const S = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const ctx = cv.getContext('2d')!;
  ctx.fillStyle = rgb(tint, 0.9);
  ctx.fillRect(0, 0, S, S);
  const rows = 4;
  for (let r = 0; r < rows; r++) {
    const off = r % 2 ? S / 4 : 0;
    for (let c = -1; c < 3; c++) {
      const x = c * (S / 2) + off;
      const y = r * (S / rows);
      const h = hash2(c + 5, r + 9);
      ctx.fillStyle = rgb(tint, 0.78 + h * 0.4);
      ctx.fillRect(x + 1, y + 1, S / 2 - 2, S / rows - 2);
      ctx.strokeStyle = 'rgba(0,0,0,0.45)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, S / 2 - 2, S / rows - 2);
    }
  }
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = `rgba(${i % 2 ? '0,0,0' : '255,255,255'},${Math.random() * 0.08})`;
    ctx.fillRect(Math.random() * S, Math.random() * S, 1 + Math.random() * 3, 1 + Math.random() * 3);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
