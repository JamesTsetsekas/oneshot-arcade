// Procedurally painted canvas textures (no external image assets).

import { DynamicTexture, Texture, type Scene } from "@babylonjs/core";

function tex(scene: Scene, name: string, w: number, h: number, paint: (g: CanvasRenderingContext2D, w: number, h: number) => void, mip = true): DynamicTexture {
  const t = new DynamicTexture(name, { width: w, height: h }, scene, mip, Texture.TRILINEAR_SAMPLINGMODE);
  const g = t.getContext() as unknown as CanvasRenderingContext2D;
  paint(g, w, h);
  t.update(true);
  t.wrapU = Texture.WRAP_ADDRESSMODE;
  t.wrapV = Texture.WRAP_ADDRESSMODE;
  t.anisotropicFilteringLevel = 8;
  return t;
}

function noise(g: CanvasRenderingContext2D, w: number, h: number, n: number, alpha: number, light = false, seed = 1) {
  let s = seed;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < n; i++) {
    const v = light ? 255 : 0;
    g.fillStyle = `rgba(${v},${v},${v},${alpha * r()})`;
    g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
  }
}

/** Road textures: u across the road (0..1), v along (one tile = 16 m). */
export function roadTexture(scene: Scene, kind: "street" | "boulevard" | "highline" | "cobble"): DynamicTexture {
  return tex(scene, `road-${kind}`, 256, 512, (g, w, h) => {
    if (kind === "cobble") {
      g.fillStyle = "#9b8f80";
      g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 14)
        for (let x = (y / 14) % 2 ? -10 : 0; x < w; x += 20) {
          const c = 125 + ((x * 7 + y * 13) % 40);
          g.fillStyle = `rgb(${c + 18},${c + 8},${c - 6})`;
          g.beginPath();
          g.roundRect(x + 1, y + 1, 18, 12, 4);
          g.fill();
        }
      g.fillStyle = "#f2d14b";
      g.fillRect(w / 2 - 3, 0, 6, h * 0.45);
      return;
    }
    g.fillStyle = kind === "highline" ? "#3a3d44" : "#45484f";
    g.fillRect(0, 0, w, h);
    noise(g, w, h, 5000, 0.18, false, 3);
    noise(g, w, h, 2500, 0.08, true, 9);
    const line = (x: number, color: string, wd: number, dash = 0) => {
      g.fillStyle = color;
      if (!dash) g.fillRect(x - wd / 2, 0, wd, h);
      else for (let y = 0; y < h; y += dash * 2) g.fillRect(x - wd / 2, y, wd, dash);
    };
    // edge lines
    line(w * 0.03, "#f2efe6", 5);
    line(w * 0.97, "#f2efe6", 5);
    if (kind === "street") {
      line(w * 0.5, "#ffc93c", 6, 64);
    } else {
      line(w * 0.485, "#ffc93c", 5);
      line(w * 0.515, "#ffc93c", 5);
      line(w * 0.25, "#f2efe6", 4, 48);
      line(w * 0.75, "#f2efe6", 4, 48);
    }
  });
}

export function plainAsphalt(scene: Scene): DynamicTexture {
  return tex(scene, "asphalt", 256, 256, (g, w, h) => {
    g.fillStyle = "#45484f";
    g.fillRect(0, 0, w, h);
    noise(g, w, h, 5000, 0.18, false, 5);
    noise(g, w, h, 2500, 0.08, true, 11);
  });
}

/** Facade tile: one window bay (4 m x 3.5 m). White so vertex color tints the wall. */
export function windowTexture(scene: Scene): DynamicTexture {
  return tex(scene, "windows", 128, 128, (g, w, h) => {
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, w, h);
    noise(g, w, h, 600, 0.05, false, 7);
    // window
    const grd = g.createLinearGradient(0, h * 0.2, 0, h * 0.8);
    grd.addColorStop(0, "#2b5f6e");
    grd.addColorStop(0.5, "#4fa3b0");
    grd.addColorStop(1, "#1f3f52");
    g.fillStyle = "#d8d2c6";
    g.fillRect(w * 0.18, h * 0.18, w * 0.64, h * 0.6);
    g.fillStyle = grd;
    g.fillRect(w * 0.21, h * 0.21, w * 0.58, h * 0.54);
    g.fillStyle = "rgba(255,255,255,0.35)";
    g.fillRect(w * 0.23, h * 0.23, w * 0.12, h * 0.48);
    g.fillStyle = "#cfc6b6";
    g.fillRect(w * 0.16, h * 0.76, w * 0.68, h * 0.05);
  });
}

export function sidewalkTexture(scene: Scene): DynamicTexture {
  return tex(scene, "sidewalk", 128, 128, (g, w, h) => {
    g.fillStyle = "#d9d2c3";
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(90,80,70,0.25)";
    g.lineWidth = 2;
    for (let i = 0; i <= 4; i++) {
      g.beginPath(); g.moveTo(0, (i * h) / 4); g.lineTo(w, (i * h) / 4); g.stroke();
      g.beginPath(); g.moveTo((i * w) / 4, 0); g.lineTo((i * w) / 4, h); g.stroke();
    }
    noise(g, w, h, 800, 0.08, false, 13);
  });
}

export function groundTexture(scene: Scene): DynamicTexture {
  return tex(scene, "ground", 256, 256, (g, w, h) => {
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, w, h);
    noise(g, w, h, 9000, 0.12, false, 17);
    noise(g, w, h, 3000, 0.1, true, 19);
  });
}

export function chevronTexture(scene: Scene, color = "#ff3b4e"): DynamicTexture {
  const t = tex(scene, "chevron", 128, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = color;
    for (let y = -h; y < h * 2; y += 64) {
      g.beginPath();
      g.moveTo(0, y + 32);
      g.lineTo(w / 2, y);
      g.lineTo(w, y + 32);
      g.lineTo(w, y + 52);
      g.lineTo(w / 2, y + 20);
      g.lineTo(0, y + 52);
      g.closePath();
      g.fill();
    }
  });
  t.hasAlpha = true;
  return t;
}

export function softDot(scene: Scene, name = "dot"): DynamicTexture {
  const t = tex(scene, name, 64, 64, (g, w, h) => {
    const grd = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    grd.addColorStop(0, "rgba(255,255,255,1)");
    grd.addColorStop(0.4, "rgba(255,255,255,0.55)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
  }, false);
  t.hasAlpha = true;
  return t;
}

export function confettiTex(scene: Scene): DynamicTexture {
  const t = tex(scene, "confetti", 32, 32, (g) => {
    g.fillStyle = "#ffffff";
    g.fillRect(6, 10, 20, 12);
  }, false);
  t.hasAlpha = true;
  return t;
}

export function beamTexture(scene: Scene): DynamicTexture {
  const t = tex(scene, "beam", 64, 256, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, "rgba(255,255,255,0)");
    grd.addColorStop(0.5, "rgba(255,255,255,0.5)");
    grd.addColorStop(1, "rgba(255,255,255,0.95)");
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
    const side = g.createLinearGradient(0, 0, w, 0);
    side.addColorStop(0, "rgba(0,0,0,1)");
    side.addColorStop(0.5, "rgba(0,0,0,0)");
    side.addColorStop(1, "rgba(0,0,0,1)");
    g.globalCompositeOperation = "destination-out";
    g.fillStyle = side;
    g.globalAlpha = 0.6;
    g.fillRect(0, 0, w, h);
  }, false);
  t.hasAlpha = true;
  return t;
}

export function waterNormal(scene: Scene): DynamicTexture {
  return tex(scene, "waternrm", 256, 256, (g, w, h) => {
    const img = g.createImageData(w, h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const fx = (x / w) * Math.PI * 2, fy = (y / h) * Math.PI * 2;
        const dx = Math.cos(fx * 3 + Math.sin(fy * 2) * 1.5) * 0.5 + Math.cos(fx * 7 + fy * 3) * 0.25;
        const dy = Math.cos(fy * 4 + Math.sin(fx * 3)) * 0.5 + Math.sin(fy * 9 - fx * 2) * 0.2;
        const i = (y * w + x) * 4;
        img.data[i] = 128 + dx * 60;
        img.data[i + 1] = 128 + dy * 60;
        img.data[i + 2] = 230;
        img.data[i + 3] = 255;
      }
    g.putImageData(img, 0, 0);
  });
}

export function signTexture(scene: Scene, text: string, bg: string, fg = "#ffffff", w = 512, h = 128, sub?: string): DynamicTexture {
  return tex(scene, `sign-${text}`, w, h, (g) => {
    g.fillStyle = bg;
    g.beginPath();
    g.roundRect(4, 4, w - 8, h - 8, 18);
    g.fill();
    g.strokeStyle = "rgba(255,255,255,0.8)";
    g.lineWidth = 6;
    g.stroke();
    g.fillStyle = fg;
    let size = sub ? 46 : 58;
    g.font = `italic 900 ${size}px "Arial Black", "Segoe UI Black", Impact, sans-serif`;
    while (g.measureText(text).width > w - 40 && size > 18) {
      size -= 2;
      g.font = `italic 900 ${size}px "Arial Black", "Segoe UI Black", Impact, sans-serif`;
    }
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(text, w / 2, sub ? h * 0.4 : h / 2 + 2);
    if (sub) {
      g.font = `700 26px "Segoe UI", Arial, sans-serif`;
      g.fillText(sub, w / 2, h * 0.76);
    }
  }, true);
}
