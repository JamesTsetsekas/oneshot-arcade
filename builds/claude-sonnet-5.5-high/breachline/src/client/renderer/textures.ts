// Procedural texture set. All art in Breachline is generated at load time (no external image assets).
import { DynamicTexture, Scene, Texture } from "@babylonjs/core";
import { Rng } from "../../shared/math";

type Ctx = CanvasRenderingContext2D;

export function makeTex(scene: Scene, name: string, size: number, draw: (ctx: Ctx, s: number) => void, opts: { wrap?: boolean; aniso?: number; mips?: boolean } = {}): DynamicTexture {
  const tex = new DynamicTexture(name, { width: size, height: size }, scene, opts.mips ?? true, Texture.TRILINEAR_SAMPLINGMODE);
  const ctx = tex.getContext() as Ctx;
  draw(ctx, size);
  tex.update(true);
  if (opts.wrap !== false) { tex.wrapU = Texture.WRAP_ADDRESSMODE; tex.wrapV = Texture.WRAP_ADDRESSMODE; }
  tex.anisotropicFilteringLevel = opts.aniso ?? 8;
  return tex;
}

function speckle(ctx: Ctx, s: number, rng: Rng, n: number, light: string, dark: string, maxSize = 3): void {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = rng.chance(0.5) ? light : dark;
    const sz = 1 + rng.next() * maxSize;
    ctx.fillRect(rng.next() * s, rng.next() * s, sz, sz);
  }
}

export interface TextureSet {
  wall: DynamicTexture;
  floorOut: DynamicTexture;
  floorIn: DynamicTexture;
  metal: DynamicTexture;
  wood: DynamicTexture;
  rock: DynamicTexture;
  roof: DynamicTexture;
  hazard: DynamicTexture;
  sky: DynamicTexture;
  ocean: DynamicTexture;
  soft: DynamicTexture;
  smoke: DynamicTexture;
  star: DynamicTexture;
  hole: DynamicTexture;
  scorch: DynamicTexture;
  glass: DynamicTexture;
}

export function buildTextures(scene: Scene): TextureSet {
  const wall = makeTex(scene, "t_wall", 512, (c, s) => {
    const r = new Rng(11);
    c.fillStyle = "#d2d5d0"; c.fillRect(0, 0, s, s);
    speckle(c, s, r, 2600, "rgba(255,255,255,0.18)", "rgba(80,90,90,0.16)", 3);
    // stains (sea mist streaks)
    for (let i = 0; i < 16; i++) { const x = r.next() * s, w = 6 + r.next() * 22; const g = c.createLinearGradient(0, 0, 0, s); g.addColorStop(0, "rgba(90,100,105,0.0)"); g.addColorStop(0.5, "rgba(90,100,105,0.07)"); g.addColorStop(1, "rgba(90,100,105,0.0)"); c.fillStyle = g; c.fillRect(x, 0, w, s); }
    // panel seams (2x2 panels per tile)
    c.strokeStyle = "rgba(62,70,74,0.75)"; c.lineWidth = 4;
    c.strokeRect(2, 2, s - 4, s - 4);
    c.beginPath(); c.moveTo(s / 2, 0); c.lineTo(s / 2, s); c.moveTo(0, s / 2); c.lineTo(s, s / 2); c.stroke();
    c.strokeStyle = "rgba(255,255,255,0.35)"; c.lineWidth = 2;
    c.strokeRect(6, 6, s - 12, s - 12);
    c.fillStyle = "rgba(60,66,70,0.7)";
    for (const [bx, by] of [[18, 18], [s / 2 - 18, 18], [s / 2 + 18, 18], [s - 18, 18], [18, s - 18], [s - 18, s - 18], [18, s / 2 - 18], [s - 18, s / 2 - 18]]) { c.beginPath(); c.arc(bx, by, 3, 0, 7); c.fill(); }
  });
  const floorOut = makeTex(scene, "t_floor_out", 512, (c, s) => {
    const r = new Rng(21);
    c.fillStyle = "#b9bdbb"; c.fillRect(0, 0, s, s);
    speckle(c, s, r, 5000, "rgba(255,255,255,0.14)", "rgba(40,50,55,0.16)", 3);
    c.strokeStyle = "rgba(50,58,62,0.6)"; c.lineWidth = 3; c.strokeRect(1, 1, s - 2, s - 2);
    c.strokeStyle = "rgba(255,255,255,0.18)"; c.lineWidth = 1; c.beginPath(); c.moveTo(s / 2, 0); c.lineTo(s / 2, s); c.moveTo(0, s / 2); c.lineTo(s, s / 2); c.stroke();
    for (let i = 0; i < 10; i++) { c.fillStyle = "rgba(60,70,75,0.06)"; c.beginPath(); c.ellipse(r.next() * s, r.next() * s, 20 + r.next() * 50, 10 + r.next() * 24, r.next() * 3, 0, 7); c.fill(); }
  });
  const floorIn = makeTex(scene, "t_floor_in", 512, (c, s) => {
    const r = new Rng(31);
    c.fillStyle = "#8f9aa2"; c.fillRect(0, 0, s, s);
    speckle(c, s, r, 2500, "rgba(255,255,255,0.12)", "rgba(20,30,40,0.14)", 2);
    const n = 4, t = s / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { c.fillStyle = (i + j) % 2 ? "rgba(255,255,255,0.045)" : "rgba(0,0,0,0.045)"; c.fillRect(i * t, j * t, t, t); }
    c.strokeStyle = "rgba(30,40,48,0.5)"; c.lineWidth = 2;
    for (let i = 0; i <= n; i++) { c.beginPath(); c.moveTo(i * t, 0); c.lineTo(i * t, s); c.moveTo(0, i * t); c.lineTo(s, i * t); c.stroke(); }
    c.fillStyle = "rgba(53,198,232,0.25)"; c.fillRect(0, s / 2 - 3, s, 6);
  });
  const metal = makeTex(scene, "t_metal", 512, (c, s) => {
    const r = new Rng(41);
    c.fillStyle = "#e2e2e2"; c.fillRect(0, 0, s, s);
    const ribs = 16, w = s / ribs;
    for (let i = 0; i < ribs; i++) {
      const g = c.createLinearGradient(i * w, 0, (i + 1) * w, 0);
      g.addColorStop(0, "rgba(0,0,0,0.28)"); g.addColorStop(0.35, "rgba(255,255,255,0.25)"); g.addColorStop(0.7, "rgba(255,255,255,0.0)"); g.addColorStop(1, "rgba(0,0,0,0.30)");
      c.fillStyle = g; c.fillRect(i * w, 0, w, s);
    }
    speckle(c, s, r, 2000, "rgba(255,255,255,0.2)", "rgba(0,0,0,0.18)", 2);
    for (let i = 0; i < 8; i++) { c.fillStyle = "rgba(120,70,30,0.10)"; c.fillRect(r.next() * s, r.next() * s, 4 + r.next() * 10, 20 + r.next() * 80); }
    c.strokeStyle = "rgba(0,0,0,0.5)"; c.lineWidth = 6; c.strokeRect(0, 0, s, s);
  });
  const wood = makeTex(scene, "t_wood", 256, (c, s) => {
    const r = new Rng(51);
    c.fillStyle = "#c79a62"; c.fillRect(0, 0, s, s);
    const n = 6, h = s / n;
    for (let i = 0; i < n; i++) {
      c.fillStyle = `rgba(${60 + r.int(40)},${35 + r.int(25)},10,0.16)`; c.fillRect(0, i * h, s, h);
      c.strokeStyle = "rgba(50,28,10,0.7)"; c.lineWidth = 3; c.beginPath(); c.moveTo(0, i * h); c.lineTo(s, i * h); c.stroke();
      for (let k = 0; k < 10; k++) { c.strokeStyle = "rgba(60,30,10,0.18)"; c.lineWidth = 1; c.beginPath(); const y = i * h + r.next() * h; c.moveTo(0, y); c.lineTo(s, y + (r.next() - 0.5) * 4); c.stroke(); }
    }
    c.strokeStyle = "rgba(50,28,10,0.85)"; c.lineWidth = 8; c.strokeRect(0, 0, s, s);
    c.beginPath(); c.moveTo(0, 0); c.lineTo(s, s); c.moveTo(s, 0); c.lineTo(0, s); c.stroke();
  });
  const rock = makeTex(scene, "t_rock", 512, (c, s) => {
    const r = new Rng(61);
    c.fillStyle = "#7d7a74"; c.fillRect(0, 0, s, s);
    for (let i = 0; i < 160; i++) { c.fillStyle = `rgba(${r.int(2) ? 255 : 0},${r.int(2) ? 255 : 0},${r.int(2) ? 255 : 0},0.05)`; c.beginPath(); c.ellipse(r.next() * s, r.next() * s, 10 + r.next() * 50, 6 + r.next() * 30, r.next() * 3, 0, 7); c.fill(); }
    speckle(c, s, r, 4000, "rgba(255,255,255,0.12)", "rgba(0,0,0,0.2)", 3);
  });
  const roof = makeTex(scene, "t_roof", 256, (c, s) => {
    const r = new Rng(71);
    c.fillStyle = "#6f777b"; c.fillRect(0, 0, s, s);
    speckle(c, s, r, 1500, "rgba(255,255,255,0.1)", "rgba(0,0,0,0.14)", 2);
    c.strokeStyle = "rgba(20,26,30,0.6)"; c.lineWidth = 3; c.strokeRect(1, 1, s - 2, s - 2);
  });
  const hazard = makeTex(scene, "t_hazard", 128, (c, s) => {
    c.fillStyle = "#e9e9e0"; c.fillRect(0, 0, s, s);
    c.fillStyle = "#ff7a14";
    for (let i = -s; i < s * 2; i += 32) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + 16, 0); c.lineTo(i + 16 - s, s); c.lineTo(i - s, s); c.closePath(); c.fill(); }
  });
  const sky = makeTex(scene, "t_sky", 1024, (c, s) => {
    const g = c.createLinearGradient(0, 0, 0, s);
    g.addColorStop(0, "#1c5fc2"); g.addColorStop(0.3, "#2f82dc"); g.addColorStop(0.44, "#7fbcee"); g.addColorStop(0.495, "#cfe8f8"); g.addColorStop(0.5, "#e6f3ff"); g.addColorStop(0.52, "#9fc6dc"); g.addColorStop(1, "#4f7f9a");
    c.fillStyle = g; c.fillRect(0, 0, s, s);
    const r = new Rng(81);
    for (let i = 0; i < 40; i++) {
      const x = r.next() * s, y = s * (0.12 + r.next() * 0.33), w = 40 + r.next() * 140;
      for (let k = 0; k < 7; k++) { const cg = c.createRadialGradient(x + k * w * 0.18, y + (r.next() - 0.5) * 12, 2, x + k * w * 0.18, y, w * 0.32); cg.addColorStop(0, "rgba(255,255,255,0.55)"); cg.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = cg; c.fillRect(0, 0, s, s); }
    }
  }, { wrap: false, aniso: 1, mips: false });
  const ocean = makeTex(scene, "t_ocean", 512, (c, s) => {
    const r = new Rng(91);
    c.fillStyle = "#2e7ea6"; c.fillRect(0, 0, s, s);
    for (let i = 0; i < 400; i++) { c.strokeStyle = `rgba(255,255,255,${0.05 + r.next() * 0.12})`; c.lineWidth = 1 + r.next() * 2; c.beginPath(); const x = r.next() * s, y = r.next() * s, l = 10 + r.next() * 40; c.moveTo(x, y); c.quadraticCurveTo(x + l / 2, y - 4, x + l, y); c.stroke(); }
    for (let i = 0; i < 60; i++) { c.fillStyle = "rgba(10,60,90,0.10)"; c.beginPath(); c.ellipse(r.next() * s, r.next() * s, 30 + r.next() * 60, 10 + r.next() * 20, 0, 0, 7); c.fill(); }
  });
  const soft = makeTex(scene, "t_soft", 128, (c, s) => {
    const g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.4, "rgba(255,255,255,0.55)"); g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g; c.fillRect(0, 0, s, s);
  }, { wrap: false, aniso: 1 });
  const smoke = makeTex(scene, "t_smoke", 256, (c, s) => {
    const r = new Rng(101);
    c.clearRect(0, 0, s, s);
    for (let i = 0; i < 90; i++) {
      const x = r.next() * s, y = r.next() * s, rad = 20 + r.next() * 44;
      const g = c.createRadialGradient(x, y, 2, x, y, rad);
      const v = 150 + r.int(70);
      g.addColorStop(0, `rgba(${v},${v + 4},${v + 8},0.42)`); g.addColorStop(1, `rgba(${v},${v + 4},${v + 8},0)`);
      c.fillStyle = g; c.fillRect(0, 0, s, s);
    }
  }, { wrap: false, aniso: 1 });
  const star = makeTex(scene, "t_star", 128, (c, s) => {
    const g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, "rgba(255,250,220,1)"); g.addColorStop(0.2, "rgba(255,210,120,0.9)"); g.addColorStop(0.5, "rgba(255,140,40,0.35)"); g.addColorStop(1, "rgba(255,120,20,0)");
    c.fillStyle = g; c.fillRect(0, 0, s, s);
    c.strokeStyle = "rgba(255,240,200,0.9)"; c.lineWidth = 3;
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + 0.3; c.beginPath(); c.moveTo(s / 2, s / 2); c.lineTo(s / 2 + Math.cos(a) * s * 0.48, s / 2 + Math.sin(a) * s * 0.48); c.stroke(); }
  }, { wrap: false, aniso: 1 });
  const hole = makeTex(scene, "t_hole", 64, (c, s) => {
    c.clearRect(0, 0, s, s);
    const g = c.createRadialGradient(s / 2, s / 2, 1, s / 2, s / 2, s / 2);
    g.addColorStop(0, "rgba(10,10,10,0.95)"); g.addColorStop(0.28, "rgba(20,20,20,0.85)"); g.addColorStop(0.55, "rgba(30,30,30,0.35)"); g.addColorStop(1, "rgba(30,30,30,0)");
    c.fillStyle = g; c.fillRect(0, 0, s, s);
    c.strokeStyle = "rgba(15,15,15,0.55)"; c.lineWidth = 1;
    for (let i = 0; i < 7; i++) { const a = (i / 7) * 6.28; c.beginPath(); c.moveTo(s / 2, s / 2); c.lineTo(s / 2 + Math.cos(a) * s * 0.45, s / 2 + Math.sin(a) * s * 0.45); c.stroke(); }
  }, { wrap: false, aniso: 1 });
  const scorch = makeTex(scene, "t_scorch", 128, (c, s) => {
    c.clearRect(0, 0, s, s);
    const g = c.createRadialGradient(s / 2, s / 2, 4, s / 2, s / 2, s / 2);
    g.addColorStop(0, "rgba(8,8,8,0.85)"); g.addColorStop(0.5, "rgba(20,20,20,0.5)"); g.addColorStop(1, "rgba(20,20,20,0)");
    c.fillStyle = g; c.fillRect(0, 0, s, s);
  }, { wrap: false, aniso: 1 });
  const glass = makeTex(scene, "t_glass", 128, (c, s) => {
    c.fillStyle = "rgba(160,225,245,0.32)"; c.fillRect(0, 0, s, s);
    const g = c.createLinearGradient(0, 0, s, s); g.addColorStop(0.2, "rgba(255,255,255,0)"); g.addColorStop(0.4, "rgba(255,255,255,0.38)"); g.addColorStop(0.5, "rgba(255,255,255,0)"); g.addColorStop(0.7, "rgba(255,255,255,0.2)"); g.addColorStop(0.8, "rgba(255,255,255,0)");
    c.fillStyle = g; c.fillRect(0, 0, s, s);
    c.strokeStyle = "rgba(200,240,255,0.8)"; c.lineWidth = 3; c.strokeRect(1, 1, s - 2, s - 2);
  }, { wrap: false, aniso: 1 });
  return { wall, floorOut, floorIn, metal, wood, rock, roof, hazard, sky, ocean, soft, smoke, star, hole, scorch, glass };
}

export function makeSignTexture(scene: Scene, lines: string[], opts: { bg?: string; fg?: string; accent?: string; w?: number; h?: number; arrow?: "left" | "right" | "up" | null } = {}): DynamicTexture {
  const w = opts.w ?? 512, h = opts.h ?? 192;
  const tex = new DynamicTexture("sign_" + lines.join("_"), { width: w, height: h }, scene, true);
  const c = tex.getContext() as Ctx;
  c.fillStyle = opts.bg ?? "#17232d"; c.fillRect(0, 0, w, h);
  c.fillStyle = opts.accent ?? "#ff8a1f"; c.fillRect(0, 0, 14, h); c.fillRect(w - 14, 0, 14, h);
  c.fillStyle = opts.fg ?? "#f3f7f9";
  c.textAlign = "center"; c.textBaseline = "middle";
  const big = lines.length > 1 ? h * 0.36 : h * 0.46;
  let fs = big;
  c.font = `800 ${fs}px "Segoe UI", Arial, sans-serif`;
  while (c.measureText(lines[0]).width > w - 70 && fs > 12) { fs -= 2; c.font = `800 ${fs}px "Segoe UI", Arial, sans-serif`; }
  c.fillText(lines[0], w / 2, lines.length > 1 ? h * 0.36 : h / 2);
  if (lines[1]) { c.font = `600 ${h * 0.2}px "Segoe UI", Arial, sans-serif`; c.fillStyle = opts.accent ?? "#35c6e8"; c.fillText(lines[1], w / 2, h * 0.74); }
  if (opts.arrow) {
    c.fillStyle = opts.accent ?? "#ff8a1f";
    const ax = opts.arrow === "left" ? 46 : opts.arrow === "right" ? w - 46 : w / 2;
    c.beginPath();
    if (opts.arrow === "up") { c.moveTo(ax, 10); c.lineTo(ax - 22, 44); c.lineTo(ax + 22, 44); } else { const d = opts.arrow === "left" ? -1 : 1; c.moveTo(ax + d * 22, h / 2); c.lineTo(ax - d * 8, h / 2 - 28); c.lineTo(ax - d * 8, h / 2 + 28); }
    c.closePath(); c.fill();
  }
  tex.update(true);
  tex.anisotropicFilteringLevel = 8;
  return tex;
}
