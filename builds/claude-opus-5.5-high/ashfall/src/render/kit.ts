import {
  Color3, Color4, DynamicTexture, Mesh, MeshBuilder, Scene, StandardMaterial, Texture, Vector3, VertexData, type AbstractMesh,
} from "@babylonjs/core";
import type { DamageType } from "../data/types";

/** Semantic VFX palette: player-safe teal-gold, Ember orange-red, Frost pale blue, Blight acid violet, Physical white/gray. */
export const SEMANTIC: Record<DamageType | "player" | "gold" | "heal", string> = {
  physical: "#e8e4dc",
  ember: "#ff5a1f",
  frost: "#9fdcff",
  blight: "#b44dff",
  player: "#3ff0d0",
  gold: "#ffd060",
  heal: "#ff4a5a",
};
/** Colorblind-safe alternates (shape patterns are added on top). */
export const SEMANTIC_CB: Record<DamageType | "player" | "gold" | "heal", string> = {
  physical: "#f0f0f0",
  ember: "#ffb000",
  frost: "#56b4e9",
  blight: "#cc79a7",
  player: "#009e73",
  gold: "#f0e442",
  heal: "#d55e00",
};

export function hex(c: string): Color3 {
  return Color3.FromHexString(c);
}

export class Kit {
  mats = new Map<string, StandardMaterial>();
  tex = new Map<string, Texture>();
  constructor(public scene: Scene) {}

  mat(key: string, diffuse: string, opts: { emissive?: string; emissiveK?: number; spec?: number; alpha?: number; tex?: string; uv?: number; unlit?: boolean; additive?: boolean; backFace?: boolean; vertexColor?: boolean } = {}): StandardMaterial {
    let m = this.mats.get(key);
    if (m) return m;
    m = new StandardMaterial(key, this.scene);
    m.diffuseColor = hex(diffuse);
    m.specularColor = new Color3(opts.spec ?? 0.05, opts.spec ?? 0.05, opts.spec ?? 0.05);
    if (opts.emissive) m.emissiveColor = hex(opts.emissive).scale(opts.emissiveK ?? 1);
    if (opts.alpha !== undefined) { m.alpha = opts.alpha; }
    if (opts.unlit) m.disableLighting = true;
    if (opts.additive) { m.alphaMode = 1; m.disableDepthWrite = true; }
    if (opts.backFace === false) m.backFaceCulling = false;
    if (opts.tex) {
      const t = this.texture(opts.tex);
      m.diffuseTexture = t;
      if (opts.uv) { (t as Texture).uScale = opts.uv; (t as Texture).vScale = opts.uv; }
      if (opts.alpha !== undefined || opts.additive) { m.opacityTexture = t; }
    }
    m.maxSimultaneousLights = 8;
    this.mats.set(key, m);
    return m;
  }

  texture(name: string): Texture {
    let t = this.tex.get(name);
    if (t) return t;
    t = makeTexture(this.scene, name);
    this.tex.set(name, t);
    return t;
  }
}

/** Procedural textures painted once on a canvas (no external image assets). */
function makeTexture(scene: Scene, name: string): Texture {
  const size = name === "soft" || name === "spark" || name === "ring" ? 64 : 512;
  const dt = new DynamicTexture(`tex_${name}`, { width: size, height: size }, scene, true);
  const ctx = dt.getContext() as unknown as CanvasRenderingContext2D;
  let seed = 1234567;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  switch (name) {
    case "ash": case "refuge": case "stone": {
      const base = name === "ash" ? [52, 46, 44] : name === "refuge" ? [70, 58, 46] : [74, 72, 76];
      ctx.fillStyle = `rgb(${base.join(",")})`;
      ctx.fillRect(0, 0, size, size);
      // painterly blotches
      for (let i = 0; i < 900; i++) {
        const x = rnd() * size, y = rnd() * size, r = 4 + rnd() * 26;
        const v = (rnd() - 0.5) * 34;
        ctx.fillStyle = `rgba(${base[0] + v},${base[1] + v * 0.9},${base[2] + v * 0.8},${0.18 + rnd() * 0.2})`;
        ctx.beginPath(); ctx.ellipse(x, y, r, r * (0.4 + rnd() * 0.6), rnd() * 3, 0, Math.PI * 2); ctx.fill();
      }
      if (name === "stone") {
        ctx.strokeStyle = "rgba(20,18,22,0.55)"; ctx.lineWidth = 3;
        for (let y = 0; y < size; y += 64) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y); ctx.stroke();
          for (let x = (y / 64) % 2 ? 32 : 0; x < size; x += 64) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 64); ctx.stroke(); }
        }
        ctx.strokeStyle = "rgba(160,150,140,0.12)"; ctx.lineWidth = 2;
        for (let y = 2; y < size; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y); ctx.stroke(); }
      } else {
        // ember flecks and ash streaks
        for (let i = 0; i < (name === "ash" ? 160 : 60); i++) {
          const x = rnd() * size, y = rnd() * size;
          ctx.fillStyle = rnd() < 0.15 ? `rgba(255,${90 + rnd() * 60},40,${0.25 + rnd() * 0.3})` : `rgba(200,195,190,${0.08 + rnd() * 0.1})`;
          ctx.fillRect(x, y, 1 + rnd() * 2, 1 + rnd() * 2);
        }
        ctx.strokeStyle = "rgba(25,20,20,0.25)"; ctx.lineWidth = 1.5;
        for (let i = 0; i < 40; i++) { const x = rnd() * size, y = rnd() * size; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (rnd() - 0.5) * 60, y + (rnd() - 0.5) * 60); ctx.stroke(); }
      }
      break;
    }
    case "wall": {
      ctx.fillStyle = "#4a464c"; ctx.fillRect(0, 0, size, size);
      for (let i = 0; i < 500; i++) { const v = (rnd() - 0.5) * 30; ctx.fillStyle = `rgba(${74 + v},${70 + v},${78 + v},0.35)`; ctx.fillRect(rnd() * size, rnd() * size, 8 + rnd() * 40, 4 + rnd() * 16); }
      ctx.strokeStyle = "rgba(15,12,16,0.7)"; ctx.lineWidth = 4;
      for (let y = 0; y < size; y += 85) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y); ctx.stroke(); for (let x = (y / 85) % 2 ? 60 : 0; x < size; x += 120) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 85); ctx.stroke(); } }
      // brass trim band
      ctx.fillStyle = "rgba(150,110,50,0.6)"; ctx.fillRect(0, size - 26, size, 10);
      break;
    }
    case "soft": {
      const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.35, "rgba(255,255,255,0.6)"); g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
      break;
    }
    case "spark": {
      ctx.clearRect(0, 0, size, size);
      const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.15, "rgba(255,255,255,0.9)"); g.addColorStop(0.4, "rgba(255,255,255,0.15)"); g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
      break;
    }
    case "ring": {
      ctx.clearRect(0, 0, size, size);
      ctx.strokeStyle = "white"; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2); ctx.stroke();
      break;
    }
    case "stripes": {
      ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.fillRect(0, 0, size, size);
      ctx.strokeStyle = "rgba(255,255,255,1)"; ctx.lineWidth = 22;
      for (let i = -size; i < size * 2; i += 64) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + size, size); ctx.stroke(); }
      break;
    }
  }
  dt.update(true);
  dt.wrapU = Texture.WRAP_ADDRESSMODE; dt.wrapV = Texture.WRAP_ADDRESSMODE;
  dt.hasAlpha = name === "soft" || name === "spark" || name === "ring" || name === "stripes";
  dt.anisotropicFilteringLevel = 4;
  return dt;
}

/** Ring (annulus / sector) mesh lying on the ground plane. */
export function ringMesh(name: string, scene: Scene, inner: number, outer: number, arc = Math.PI * 2, seg = 64): Mesh {
  const pos: number[] = [], idx: number[] = [], uv: number[] = [], nrm: number[] = [];
  const n = Math.max(6, Math.round((seg * arc) / (Math.PI * 2)));
  for (let i = 0; i <= n; i++) {
    const a = -arc / 2 + (arc * i) / n;
    const c = Math.cos(a), s = Math.sin(a);
    pos.push(c * inner, 0, s * inner, c * outer, 0, s * outer);
    nrm.push(0, 1, 0, 0, 1, 0);
    uv.push(i / n, 0, i / n, 1);
    if (i < n) { const b = i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
  }
  const m = new Mesh(name, scene);
  const vd = new VertexData();
  vd.positions = pos; vd.indices = idx; vd.uvs = uv; vd.normals = nrm;
  vd.applyToMesh(m);
  return m;
}

/** Filled sector (pie) lying on the ground, apex at origin facing +X. */
export function sectorMesh(name: string, scene: Scene, r: number, arc: number, seg = 48): Mesh {
  const pos: number[] = [0, 0, 0], idx: number[] = [], nrm: number[] = [0, 1, 0], uv: number[] = [0.5, 0.5];
  const n = Math.max(4, Math.round((seg * arc) / (Math.PI * 2)));
  for (let i = 0; i <= n; i++) {
    const a = -arc / 2 + (arc * i) / n;
    pos.push(Math.cos(a) * r, 0, Math.sin(a) * r);
    nrm.push(0, 1, 0);
    uv.push(0.5 + Math.cos(a) * 0.5, 0.5 + Math.sin(a) * 0.5);
    if (i < n) idx.push(0, i + 2, i + 1);
  }
  const m = new Mesh(name, scene);
  const vd = new VertexData();
  vd.positions = pos; vd.indices = idx; vd.normals = nrm; vd.uvs = uv;
  vd.applyToMesh(m);
  return m;
}

export function merge(name: string, meshes: Mesh[]): Mesh {
  const m = Mesh.MergeMeshes(meshes, true, true, undefined, false, true)!;
  m.name = name;
  return m;
}

export function box(scene: Scene, w: number, h: number, d: number, mat: StandardMaterial, x = 0, y = 0, z = 0, ry = 0): Mesh {
  const m = MeshBuilder.CreateBox("b", { width: w, height: h, depth: d }, scene);
  m.position.set(x, y, z); m.rotation.y = ry; m.material = mat;
  return m;
}
export function cyl(scene: Scene, dt: number, db: number, h: number, mat: StandardMaterial, x = 0, y = 0, z = 0, tess = 10): Mesh {
  const m = MeshBuilder.CreateCylinder("c", { diameterTop: dt, diameterBottom: db, height: h, tessellation: tess }, scene);
  m.position.set(x, y, z); m.material = mat;
  return m;
}
export function sph(scene: Scene, d: number, mat: StandardMaterial, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, seg = 8): Mesh {
  const m = MeshBuilder.CreateSphere("s", { diameter: d, segments: seg }, scene);
  m.position.set(x, y, z); m.scaling.set(sx, sy, sz); m.material = mat;
  return m;
}

export function hide(m: AbstractMesh) {
  m.isVisible = false;
  m.setEnabled(false);
  return m;
}

export const V3 = (x: number, y: number, z: number) => new Vector3(x, y, z);
export const C4 = (c: string, a = 1) => { const k = hex(c); return new Color4(k.r, k.g, k.b, a); };
