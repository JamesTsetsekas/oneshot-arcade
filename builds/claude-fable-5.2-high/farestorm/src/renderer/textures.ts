// Procedural textures drawn to canvases at load. No external image assets are used anywhere.
import { DynamicTexture, Scene, Texture } from '@babylonjs/core';
import { WorldModel } from '../world/model';
import { WORLD_W, WORLD_D, RoadClass, ROAD_CLASSES, districtAt, District, CANAL_Z, CANAL_X0, PLAZA_RECT } from '../world/galeport';
import { hash2 } from '../core/math';

type Ctx = CanvasRenderingContext2D;

export function canvasTex(name: string, w: number, h: number, scene: Scene, draw: (ctx: Ctx, w: number, h: number) => void, alpha = false): DynamicTexture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  draw(ctx, w, h);
  const tex = new DynamicTexture(name, canvas, scene, true);
  tex.hasAlpha = alpha;
  tex.update(true);
  tex.anisotropicFilteringLevel = 8;
  tex.wrapU = Texture.WRAP_ADDRESSMODE;
  tex.wrapV = Texture.WRAP_ADDRESSMODE;
  return tex;
}

function speckle(ctx: Ctx, w: number, h: number, n: number, colors: string[], maxR = 1.6): void {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = colors[i % colors.length];
    const r = 0.4 + hash2(i, 91) * maxR;
    ctx.fillRect(hash2(i, 17) * w, hash2(i, 53) * h, r, r);
  }
}

/** Road surface tile: full road width across U, 16 m along V. */
export function roadTexture(scene: Scene, cls: RoadClass): DynamicTexture {
  const info = ROAD_CLASSES[cls];
  const W = 256, H = 256;
  return canvasTex(`road-${cls}`, W, H, scene, (ctx) => {
    const ppm = W / (info.hw * 2);
    const xm = (m: number) => W / 2 + m * ppm;
    if (cls === 'narrow') {
      ctx.fillStyle = '#9a8778';
      ctx.fillRect(0, 0, W, H);
      const bw = 16, bh = 10.667;
      for (let r = 0; r < H / bh; r++) for (let c = -1; c < W / bw + 1; c++) {
        const k = hash2(r, c);
        ctx.fillStyle = `rgb(${150 + k * 34},${128 + k * 30},${112 + k * 28})`;
        ctx.fillRect(c * bw + (r % 2) * (bw / 2) + 1, r * bh + 1, bw - 2, bh - 2);
      }
      return;
    }
    ctx.fillStyle = cls === 'highline' ? '#5a5d68' : '#484a54';
    ctx.fillRect(0, 0, W, H);
    speckle(ctx, W, H, 2600, ['rgba(255,255,255,0.05)', 'rgba(0,0,0,0.09)', 'rgba(255,255,255,0.03)']);
    // Worn wheel tracks.
    for (const off of info.laneOffsets) for (const s of [-1, 1]) {
      const g = ctx.createLinearGradient(xm(s * off) - ppm * 1.6, 0, xm(s * off) + ppm * 1.6, 0);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, 'rgba(20,20,26,0.16)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(xm(s * off) - ppm * 1.6, 0, ppm * 3.2, H);
    }
    const line = (m: number, widthM: number, color: string, dash?: [number, number]) => {
      ctx.fillStyle = color;
      const x = xm(m) - (widthM * ppm) / 2, w = Math.max(2, widthM * ppm);
      if (!dash) ctx.fillRect(x, 0, w, H);
      else for (let y = 0; y < H; y += (dash[0] + dash[1]) * (H / 16)) ctx.fillRect(x, y, w, dash[0] * (H / 16));
    };
    const yellow = '#ffc93c', white = '#f4f1e6';
    line(-info.hw + 0.55, 0.2, white);
    line(info.hw - 0.55, 0.2, white);
    line(-0.22, 0.17, yellow);
    line(0.22, 0.17, yellow);
    if (info.laneOffsets.length > 1) {
      const mid = (info.laneOffsets[0] + info.laneOffsets[1]) / 2;
      line(-mid, 0.18, white, [3, 5]);
      line(mid, 0.18, white, [3, 5]);
    }
  });
}

export function zebraTexture(scene: Scene): DynamicTexture {
  return canvasTex('zebra', 64, 64, scene, (ctx, w, h) => {
    ctx.fillStyle = '#484a54';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f1eee2';
    ctx.fillRect(0, 6, w / 2, h - 12);
  });
}

/** One window bay x one floor. White walls so per-building vertex colours tint the stucco. */
export function facadeTexture(scene: Scene, style: 'stucco' | 'glass'): DynamicTexture {
  return canvasTex(`facade-${style}`, 256, 256, scene, (ctx, w, h) => {
    if (style === 'stucco') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      speckle(ctx, w, h, 500, ['rgba(120,100,80,0.05)', 'rgba(255,255,255,0.3)'], 3);
      ctx.fillStyle = 'rgba(90,70,60,0.10)';
      ctx.fillRect(0, h - 10, w, 10); // floor band
      // shutters
      ctx.fillStyle = '#9fa6a8';
      ctx.fillRect(52, 52, 22, 132);
      ctx.fillRect(182, 52, 22, 132);
      ctx.fillStyle = '#e9e6dc';
      ctx.fillRect(74, 46, 108, 144);
      const g = ctx.createLinearGradient(0, 52, 0, 184);
      g.addColorStop(0, '#2c5f73'); g.addColorStop(0.55, '#1d3f52'); g.addColorStop(1, '#16303f');
      ctx.fillStyle = g;
      ctx.fillRect(80, 52, 96, 132);
      ctx.fillStyle = 'rgba(190,235,245,0.35)';
      ctx.beginPath(); ctx.moveTo(80, 52); ctx.lineTo(130, 52); ctx.lineTo(96, 184); ctx.lineTo(80, 184); ctx.fill();
      ctx.fillStyle = '#e9e6dc';
      ctx.fillRect(126, 52, 4, 132);
      ctx.fillRect(80, 112, 96, 4);
      ctx.fillStyle = '#c9c4b6';
      ctx.fillRect(66, 190, 124, 9); // sill
    } else {
      ctx.fillStyle = '#f2f4f5';
      ctx.fillRect(0, 0, w, h);
      for (const x of [8, 132]) {
        const g = ctx.createLinearGradient(0, 10, 0, 220);
        g.addColorStop(0, '#5fb6c9'); g.addColorStop(0.6, '#2f7f9a'); g.addColorStop(1, '#25607c');
        ctx.fillStyle = g;
        ctx.fillRect(x, 10, 116, 212);
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.beginPath(); ctx.moveTo(x, 10); ctx.lineTo(x + 60, 10); ctx.lineTo(x + 18, 222); ctx.lineTo(x, 222); ctx.fill();
      }
      ctx.fillStyle = '#b9c2c7';
      ctx.fillRect(0, 226, w, 30);
    }
  });
}

/** Ground-floor shopfront bay with a striped awning band. */
export function shopTexture(scene: Scene): DynamicTexture {
  return canvasTex('shop', 256, 256, scene, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    // awning stripes (top third)
    for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#ffffff' : '#8f9498'; ctx.fillRect(i * 32, 0, 32, 58); }
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0, 58, w, 8);
    const g = ctx.createLinearGradient(0, 70, 0, 232);
    g.addColorStop(0, '#20485a'); g.addColorStop(1, '#122a37');
    ctx.fillStyle = g;
    ctx.fillRect(18, 74, 136, 150);
    ctx.fillRect(174, 74, 64, 172);
    ctx.fillStyle = 'rgba(255,236,170,0.55)';
    ctx.fillRect(26, 150, 120, 66);
    ctx.fillStyle = 'rgba(200,240,250,0.3)';
    ctx.beginPath(); ctx.moveTo(18, 74); ctx.lineTo(80, 74); ctx.lineTo(44, 224); ctx.lineTo(18, 224); ctx.fill();
    ctx.fillStyle = '#d8d3c6';
    ctx.fillRect(0, 246, w, 10);
  });
}

const PAVING: Record<District, [number, number, number]> = {
  harbor: [190, 186, 176], beach: [233, 216, 184], oldsteps: [215, 172, 134], civic: [228, 221, 205], lantern: [160, 168, 190], highline: [192, 197, 204],
};

/** Whole-city ground texture painted from the surface map plus crisp vector overlays. */
export function terrainTexture(scene: Scene, model: WorldModel): DynamicTexture {
  const TW = 2048, TH = Math.round((2048 * WORLD_D) / WORLD_W);
  const tex = canvasTex('terrain', TW, TH, scene, (ctx) => {
    const img = ctx.createImageData(TW, TH);
    const d = img.data;
    const mx = WORLD_W / TW, mz = WORLD_D / TH;
    for (let py = 0; py < TH; py++) {
      const z = (TH - 1 - py + 0.5) * mz;
      for (let px = 0; px < TW; px++) {
        const x = (px + 0.5) * mx;
        const h = model.heightAt(x, z);
        const n = hash2(px >> 1, py >> 1), n2 = hash2(px >> 3, py >> 3);
        let r: number, g: number, b: number;
        const rim = x < 30 || x > WORLD_W - 30 || z > WORLD_D - 30;
        if (h < -0.05) {
          const k = Math.min(1, -h / 4.5);
          r = 150 - 110 * k; g = 214 - 110 * k; b = 205 - 60 * k;
        } else if (rim && h > model.heightAt(Math.min(Math.max(x, 34), WORLD_W - 34), Math.min(z, WORLD_D - 34)) + 1.5) {
          r = 150 + n * 22; g = 128 + n * 20; b = 112 + n * 18;
        } else {
          const s = model.surfaceAt(x, z);
          if (s === 'grass') { r = 96 + n * 18 + n2 * 14; g = 164 + n * 16 + n2 * 12; b = 84 + n * 10; if (h > 30) { r += 10; g += 4; } }
          else if (s === 'sand') { const wet = h < 0.7 ? 1 : 0; r = 240 - wet * 34 + n * 8; g = 218 - wet * 34 + n * 8; b = 164 - wet * 30 + n * 8; }
          else if (s === 'asphalt') { r = 72 + n * 6; g = 74 + n * 6; b = 84 + n * 6; }
          else if (s === 'cobble') { r = 152 + n * 20; g = 134 + n * 18; b = 120 + n * 16; }
          else if (s === 'deck') { const plank = (px + py) % 6 < 1 ? -26 : 0; r = 184 + plank + n * 10; g = 136 + plank + n * 8; b = 90 + plank + n * 6; }
          else if (s === 'dirt') { r = 176 + n * 16; g = 146 + n * 14; b = 104 + n * 12; }
          else { const p = PAVING[districtAt(x, z)]; const tile = ((px >> 2) + (py >> 2)) % 2 ? 5 : 0; r = p[0] - tile + n * 6; g = p[1] - tile + n * 6; b = p[2] - tile + n * 6; }
        }
        const i = (py * TW + px) * 4;
        d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    const X = (x: number) => (x / WORLD_W) * TW, Y = (z: number) => (1 - z / WORLD_D) * TH;
    const S = TW / WORLD_W;
    const seg = (ax: number, az: number, bx: number, bz: number) => { ctx.beginPath(); ctx.moveTo(X(ax), Y(az)); ctx.lineTo(X(bx), Y(bz)); ctx.stroke(); };
    // Kerb lines along every ground road.
    ctx.lineCap = 'butt';
    for (const e of model.edges) {
      if (e.structure) continue;
      const a = model.nodes[e.a], b = model.nodes[e.b];
      ctx.strokeStyle = 'rgba(255,250,235,0.55)';
      ctx.lineWidth = 1.2;
      for (const s of [-1, 1]) {
        const o = e.hw + 0.4;
        seg(a.x + e.dx * a.clear + e.dz * s * o, a.z + e.dz * a.clear - e.dx * s * o, b.x - e.dx * b.clear + e.dz * s * o, b.z - e.dz * b.clear - e.dx * s * o);
      }
    }
    // Plaza paving pattern.
    ctx.strokeStyle = 'rgba(160,120,90,0.35)';
    ctx.lineWidth = 1;
    for (let x = PLAZA_RECT.x0; x <= PLAZA_RECT.x1; x += 6) seg(x, PLAZA_RECT.z0, x, PLAZA_RECT.z1);
    for (let z = PLAZA_RECT.z0; z <= PLAZA_RECT.z1; z += 6) seg(PLAZA_RECT.x0, z, PLAZA_RECT.x1, z);
    // Canal quay edges.
    ctx.strokeStyle = 'rgba(245,238,220,0.9)';
    ctx.lineWidth = 2;
    seg(CANAL_X0 - 2, CANAL_Z - 8, WORLD_W - 30, CANAL_Z - 8);
    seg(CANAL_X0 - 2, CANAL_Z + 8, WORLD_W - 30, CANAL_Z + 8);
    // Quay hazard edge.
    ctx.strokeStyle = 'rgba(255,196,40,0.9)';
    ctx.setLineDash([6, 5]);
    ctx.lineWidth = 2.2;
    seg(34, 103, 380, 103); seg(536, 103, 560, 103); seg(690, 103, 790, 103);
    ctx.setLineDash([]);
    // Shortcut corridors: edge lines, chevrons and stair treads.
    for (const s of model.shortcuts) {
      if (!s.corridor) continue;
      const dx = (s.bx - s.ax) / s.len, dz = (s.bz - s.az) / s.len;
      if (s.kind === 'stairs') {
        ctx.strokeStyle = 'rgba(90,60,45,0.45)';
        ctx.lineWidth = 1;
        for (let t = 8; t < s.len - 8; t += 2.2) seg(s.ax + dx * t + dz * 4, s.az + dz * t - dx * 4, s.ax + dx * t - dz * 4, s.az + dz * t + dx * 4);
      }
      ctx.strokeStyle = s.kind === 'park' || s.kind === 'yard' ? 'rgba(255,255,255,0.5)' : 'rgba(40,220,200,0.75)';
      ctx.lineWidth = 1.6;
      for (const side of [-1, 1]) { const o = (s.width / 2 - 0.5) * side; seg(s.ax + dz * o, s.az - dx * o, s.bx + dz * o, s.bz - dx * o); }
      // Chevrons at both mouths pointing inwards.
      ctx.strokeStyle = 'rgba(255,214,60,0.95)';
      ctx.lineWidth = 2.4;
      for (const [ox, oz, sx, sz] of [[s.ax, s.az, dx, dz], [s.bx, s.bz, -dx, -dz]] as number[][]) {
        for (let k = 0; k < 3; k++) {
          const cx = ox + sx * (9 + k * 4), cz = oz + sz * (9 + k * 4);
          ctx.beginPath();
          ctx.moveTo(X(cx + sz * 2.4 - sx * 1.6), Y(cz - sx * 2.4 - sz * 1.6));
          ctx.lineTo(X(cx + sx * 1.2), Y(cz + sz * 1.2));
          ctx.lineTo(X(cx - sz * 2.4 - sx * 1.6), Y(cz + sx * 2.4 - sz * 1.6));
          ctx.stroke();
        }
      }
    }
    // Pickup bays at every destination.
    for (const s of model.sites) {
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(X(s.x), Y(s.z), 5.2 * S, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
  tex.wrapU = Texture.CLAMP_ADDRESSMODE;
  tex.wrapV = Texture.CLAMP_ADDRESSMODE;
  return tex;
}

export function softDotTexture(scene: Scene): DynamicTexture {
  const t = canvasTex('softdot', 64, 64, scene, (ctx) => {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.45, 'rgba(255,255,255,0.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  }, true);
  return t;
}
export function squareTexture(scene: Scene): DynamicTexture {
  return canvasTex('square', 16, 16, scene, (ctx) => { ctx.fillStyle = '#fff'; ctx.fillRect(1, 1, 14, 14); }, true);
}

export function seaTexture(scene: Scene): DynamicTexture {
  return canvasTex('sea', 256, 256, scene, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) {
      const x = hash2(i, 3) * w, y = hash2(i, 7) * h, l = 20 + hash2(i, 11) * 50;
      ctx.strokeStyle = i % 3 ? 'rgba(120,170,215,0.5)' : 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 1 + hash2(i, 13) * 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + l / 2, y - 4, x + l, y);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(200,225,245,0.25)';
    ctx.fillRect(0, 0, w, h);
  });
}
