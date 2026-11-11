// Procedural vehicle + character models: three original storm cabs, traffic variants, people.

import { DynamicTexture, Mesh, MeshBuilder, StandardMaterial, Color3, TransformNode, type Scene } from "@babylonjs/core";
import type { TaxiSpec } from "../sim/vehicle/taxis";
import { TRAFFIC_TYPES } from "../sim/traffic/traffic";
import type { Archetype } from "../sim/fares/archetypes";
import { Geo, hex, scale, type RGB } from "./geo";

export interface TaxiModel {
  root: TransformNode;
  body: TransformNode; // pitch/roll applied here
  wheels: Mesh[];
  wheelPivots: TransformNode[];
  fans: Mesh[];
  brake: Mesh;
  boostGlow: Mesh;
  signTex: DynamicTexture;
  lastSign: string;
  meshes: Mesh[];
}

const DARK: RGB = hex("#1b1f27");
const GLASS: RGB = hex("#3a8aa3");
const CHROME: RGB = hex("#c9d3da");

export function buildTaxi(scene: Scene, spec: TaxiSpec, lit: StandardMaterial, glow: StandardMaterial, livery?: { body: string; trim: string; accent: string }): TaxiModel {
  const L = spec.length, W = spec.width, H = spec.height;
  const col = livery ?? spec.colors;
  const body = hex(col.body), trim = hex(col.trim), accent = hex(col.accent);
  const g = new Geo();
  const e = new Geo();
  const clear = 0.32;
  const bodyH = 0.62;
  const yb = clear + bodyH / 2;
  // chassis
  g.box(0, yb, 0, W, bodyH, L, body, 0, { top: body });
  g.box(0, clear + 0.08, 0, W + 0.04, 0.16, L + 0.06, DARK);
  // bumpers
  g.box(0, clear + 0.12, L / 2 + 0.05, W * 0.96, 0.2, 0.14, DARK);
  g.box(0, clear + 0.12, -L / 2 - 0.05, W * 0.96, 0.2, 0.14, DARK);
  // rear + front body panels in livery trim so the tail reads clearly
  g.box(0, yb + 0.12, -L / 2 - 0.005, W * 0.7, 0.18, 0.02, trim);
  // side trim stripe + accent wave
  g.box(W / 2 + 0.01, yb + 0.06, 0, 0.04, 0.16, L * 0.92, trim);
  g.box(-W / 2 - 0.01, yb + 0.06, 0, 0.04, 0.16, L * 0.92, trim);
  for (let i = 0; i < 5; i++) {
    const z = -L * 0.3 + i * L * 0.15;
    g.box(W / 2 + 0.02, yb - 0.12 + (i % 2) * 0.06, z, 0.04, 0.1, L * 0.11, accent);
    g.box(-W / 2 - 0.02, yb - 0.12 + (i % 2) * 0.06, z, 0.04, 0.1, L * 0.11, accent);
  }
  // hood stripe
  g.box(0, clear + bodyH + 0.005, L * 0.33, 0.34, 0.02, L * 0.3, accent);
  // cabin by silhouette
  const top = H;
  const cabY = clear + bodyH;
  if (spec.id === "gull") {
    g.taper(0, cabY, -L * 0.04, W * 0.9, L * 0.56, W * 0.78, L * 0.34, top - cabY, GLASS, 0, -0.05, trim);
    g.box(0, top - 0.02, -L * 0.06, W * 0.8, 0.06, L * 0.34, trim);
  } else if (spec.id === "breaker") {
    g.taper(0, cabY, -L * 0.05, W * 0.9, L * 0.5, W * 0.8, L * 0.32, top - cabY, GLASS, 0, -0.08, trim);
    g.box(0, top - 0.02, -L * 0.08, W * 0.8, 0.06, L * 0.32, trim);
  } else {
    g.taper(0, cabY, -L * 0.1, W * 0.92, L * 0.66, W * 0.86, L * 0.6, top - cabY, GLASS, 0, -0.04, trim);
    g.box(0, top - 0.02, -L * 0.12, W * 0.86, 0.06, L * 0.6, trim);
    // roof rails
    g.box(W * 0.38, top + 0.06, -L * 0.12, 0.06, 0.08, L * 0.55, CHROME);
    g.box(-W * 0.38, top + 0.06, -L * 0.12, 0.06, 0.08, L * 0.55, CHROME);
  }
  // pillars
  g.box(W * 0.43, (cabY + top) / 2, L * 0.13, 0.08, top - cabY, 0.1, body);
  g.box(-W * 0.43, (cabY + top) / 2, L * 0.13, 0.08, top - cabY, 0.1, body);
  // roof turbine pods
  const podZ = -L * 0.12;
  for (const sx of [-1, 1]) {
    g.cyl(sx * W * 0.3, top + 0.14, podZ, 0.13, 0.13, 0.75, 12, accent, "z");
    g.cyl(sx * W * 0.3, top + 0.14, podZ - 0.42, 0.1, 0.13, 0.1, 12, DARK, "z");
  }
  // lights
  for (const sx of [-1, 1]) {
    e.box(sx * W * 0.34, yb + 0.1, L / 2 + 0.005, 0.38, 0.16, 0.04, hex("#fff6dc"));
    e.box(sx * W * 0.36, yb + 0.1, -L / 2 - 0.005, 0.34, 0.14, 0.04, hex("#ff3b3b"));
  }
  // driver head silhouette
  g.sphere(-W * 0.2, cabY + 0.42, L * 0.02, 0.17, hex("#3b2a22"), 8, 6);

  const root = new TransformNode(`taxi-${spec.id}`, scene);
  const bodyNode = new TransformNode(`taxi-body-${spec.id}`, scene);
  bodyNode.parent = root;
  const bm = g.toMesh(`taxi-mesh-${spec.id}`, scene, lit);
  bm.parent = bodyNode;
  const em = e.toMesh(`taxi-glow-${spec.id}`, scene, glow);
  em.parent = bodyNode;

  // brake lights (toggled)
  const bg = new Geo();
  for (const sx of [-1, 1]) bg.box(sx * W * 0.36, yb + 0.1, -L / 2 - 0.03, 0.4, 0.2, 0.04, hex("#ff1a1a"));
  bg.box(0, top + 0.03, -L * 0.12 - L * 0.16, 0.5, 0.06, 0.04, hex("#ff1a1a"));
  const brake = bg.toMesh(`taxi-brake-${spec.id}`, scene, glow);
  brake.parent = bodyNode;

  // boost glow at turbine exhausts
  const og = new Geo();
  for (const sx of [-1, 1]) og.cyl(sx * W * 0.3, top + 0.14, podZ - 0.52, 0.1, 0.03, 0.3, 10, hex("#7ff7ff"), "z");
  const boostGlow = og.toMesh(`taxi-boost-${spec.id}`, scene, glow);
  boostGlow.parent = bodyNode;

  // fans
  const fans: Mesh[] = [];
  for (const sx of [-1, 1]) {
    const fg = new Geo();
    for (let i = 0; i < 4; i++) fg.box(0, 0, 0, 0.32, 0.05, 0.03, CHROME, 0);
    const f = MeshBuilder.CreateBox("fan", { width: 0.22, height: 0.04, depth: 0.02 }, scene);
    const f2 = MeshBuilder.CreateBox("fan2", { width: 0.04, height: 0.22, depth: 0.02 }, scene);
    const fm = Mesh.MergeMeshes([f, f2], true)!;
    fm.material = lit;
    fm.position.set(sx * W * 0.3, top + 0.14, podZ + 0.39);
    fm.parent = bodyNode;
    fans.push(fm);
  }

  // fare display sign
  const signTex = new DynamicTexture(`fare-sign-${spec.id}`, { width: 256, height: 64 }, scene, false);
  const signMat = new StandardMaterial(`fare-sign-mat-${spec.id}`, scene);
  signMat.disableLighting = true;
  signMat.emissiveTexture = signTex;
  signMat.diffuseColor = Color3.Black();
  signMat.backFaceCulling = false;
  const sign = MeshBuilder.CreateBox(`fare-sign-${spec.id}`, { width: W * 0.5, height: 0.22, depth: 0.32 }, scene);
  sign.material = signMat;
  sign.position.set(0, top + 0.18, L * 0.02);
  sign.parent = bodyNode;

  // wheels
  const wheels: Mesh[] = [];
  const pivots: TransformNode[] = [];
  const wg = new Geo();
  wg.cyl(0, 0, 0, 0.34, 0.34, 0.26, 14, DARK, "x");
  wg.cyl(0.02, 0, 0, 0.2, 0.2, 0.27, 10, accent, "x");
  wg.box(0.14, 0, 0, 0.02, 0.36, 0.08, CHROME);
  const wb = spec.wheelbase / 2;
  const tw = W / 2 - 0.12;
  const wheelProto = wg.toMesh(`wheel-${spec.id}`, scene, lit);
  const pos: [number, number][] = [[-tw, wb], [tw, wb], [-tw, -wb], [tw, -wb]];
  pos.forEach(([x, z], i) => {
    const piv = new TransformNode(`wheel-pivot-${i}`, scene);
    piv.parent = root;
    piv.position.set(x, 0.34, z);
    const w = i === 0 ? wheelProto : (wheelProto.clone(`wheel-${spec.id}-${i}`) as Mesh);
    w.parent = piv;
    if (x < 0) w.rotation.z = Math.PI;
    wheels.push(w);
    pivots.push(piv);
  });

  const meshes = [bm, em, brake, boostGlow, sign, ...fans, ...wheels];
  return { root, body: bodyNode, wheels, wheelPivots: pivots, fans, brake, boostGlow, signTex, lastSign: "", meshes };
}

export function drawFareSign(m: TaxiModel, text: string, color: string) {
  const key = text + color;
  if (m.lastSign === key) return;
  m.lastSign = key;
  const g = m.signTex.getContext() as unknown as CanvasRenderingContext2D;
  g.fillStyle = "#0b0f17";
  g.fillRect(0, 0, 256, 64);
  g.fillStyle = color;
  g.font = 'italic 900 40px "Arial Black", Impact, sans-serif';
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, 128, 34);
  m.signTex.update();
}

// ------------------------------------------------------------------ traffic
export function buildTrafficGeo(typeIdx: number, color: string): { lit: Geo; glow: Geo } {
  const t = TRAFFIC_TYPES[typeIdx];
  const c = hex(color);
  const g = new Geo();
  const e = new Geo();
  const L = t.len, W = t.wid, H = t.height;
  const clear = 0.3;
  const wheel = (x: number, z: number, r = 0.34) => g.cyl(x, r, z, r, r, 0.24, 10, DARK, "x");
  const lights = (bodyY: number) => {
    for (const sx of [-1, 1]) {
      e.box(sx * W * 0.34, bodyY, L / 2 + 0.01, 0.32, 0.14, 0.04, hex("#fff2cf"));
      e.box(sx * W * 0.36, bodyY, -L / 2 - 0.01, 0.3, 0.14, 0.04, hex("#ff3030"));
    }
  };
  switch (t.id) {
    case "bus": {
      g.box(0, clear + (H - clear) / 2, 0, W, H - clear, L, c, 0, { top: hex("#f4f1e6") });
      g.box(W / 2 + 0.01, H * 0.62, 0, 0.03, H * 0.32, L * 0.92, GLASS);
      g.box(-W / 2 - 0.01, H * 0.62, 0, 0.03, H * 0.32, L * 0.92, GLASS);
      g.box(0, H * 0.6, L / 2 + 0.01, W * 0.9, H * 0.4, 0.03, GLASS);
      g.box(0, H * 0.3, 0, W + 0.04, 0.2, L * 0.98, hex("#f4f1e6"));
      e.box(0, H - 0.25, L / 2 + 0.03, W * 0.6, 0.25, 0.03, hex("#ffb13b"));
      wheel(-W / 2 + 0.2, L * 0.33, 0.48); wheel(W / 2 - 0.2, L * 0.33, 0.48);
      wheel(-W / 2 + 0.2, -L * 0.3, 0.48); wheel(W / 2 - 0.2, -L * 0.3, 0.48);
      lights(clear + 0.4);
      break;
    }
    case "truck": {
      g.box(0, clear + 1.2, L / 2 - 1.1, W, 2.0, 2.2, c);
      g.box(0, clear + 1.75, L / 2 - 0.01, W * 0.85, 0.7, 0.04, GLASS);
      g.box(0, clear + 1.4, -0.9, W + 0.1, 2.6, L - 2.4, hex("#f4f1e6"), 0, { top: hex("#e8e2d4") });
      g.box(W / 2 + 0.06, clear + 1.6, -0.9, 0.02, 0.8, L - 3.4, c);
      g.box(-W / 2 - 0.06, clear + 1.6, -0.9, 0.02, 0.8, L - 3.4, c);
      wheel(-W / 2 + 0.2, L / 2 - 1.2, 0.46); wheel(W / 2 - 0.2, L / 2 - 1.2, 0.46);
      wheel(-W / 2 + 0.2, -L / 2 + 1.2, 0.46); wheel(W / 2 - 0.2, -L / 2 + 1.2, 0.46);
      lights(clear + 0.5);
      break;
    }
    case "van": {
      g.box(0, clear + (H - clear) / 2, -0.1, W, H - clear, L - 0.6, c);
      g.taper(0, clear, L / 2 - 0.5, W, 0.8, W, 0.5, 1.1, c, 0);
      g.box(0, H * 0.7, L / 2 - 0.62, W * 0.86, 0.6, 0.04, GLASS);
      g.box(W / 2 + 0.01, H * 0.72, L * 0.25, 0.03, 0.5, 1.0, GLASS);
      g.box(-W / 2 - 0.01, H * 0.72, L * 0.25, 0.03, 0.5, 1.0, GLASS);
      wheel(-W / 2 + 0.16, L * 0.32); wheel(W / 2 - 0.16, L * 0.32); wheel(-W / 2 + 0.16, -L * 0.32); wheel(W / 2 - 0.16, -L * 0.32);
      lights(clear + 0.4);
      break;
    }
    case "pickup": {
      g.box(0, clear + 0.4, 0, W, 0.8, L, c);
      g.taper(0, clear + 0.8, L * 0.1, W * 0.92, L * 0.32, W * 0.86, L * 0.26, 0.75, GLASS, 0, 0, c);
      g.box(0, clear + 0.9, -L * 0.28, W * 0.9, 0.2, L * 0.38, DARK);
      wheel(-W / 2 + 0.16, L * 0.32, 0.38); wheel(W / 2 - 0.16, L * 0.32, 0.38); wheel(-W / 2 + 0.16, -L * 0.32, 0.38); wheel(W / 2 - 0.16, -L * 0.32, 0.38);
      lights(clear + 0.5);
      break;
    }
    default: {
      const bodyH = 0.6;
      g.box(0, clear + bodyH / 2, 0, W, bodyH, L, c);
      const cabL = t.id === "wagon" ? L * 0.62 : t.id === "compact" ? L * 0.55 : L * 0.46;
      const off = t.id === "wagon" ? -L * 0.1 : t.id === "hatch" ? -L * 0.08 : -L * 0.04;
      g.taper(0, clear + bodyH, off, W * 0.9, cabL, W * 0.8, cabL * (t.id === "wagon" ? 0.92 : 0.66), H - clear - bodyH, GLASS, 0, -0.05, c);
      g.box(0, clear + 0.12, 0, W + 0.03, 0.14, L + 0.04, DARK);
      wheel(-W / 2 + 0.14, L * 0.32); wheel(W / 2 - 0.14, L * 0.32); wheel(-W / 2 + 0.14, -L * 0.32); wheel(W / 2 - 0.14, -L * 0.32);
      lights(clear + 0.35);
    }
  }
  return { lit: g, glow: e };
}

// ------------------------------------------------------------------ people
export function buildPersonGeo(): Geo {
  const g = new Geo();
  const w: RGB = [1, 1, 1];
  g.box(-0.12, 0.42, 0, 0.18, 0.84, 0.2, scale(w, 0.45));
  g.box(0.12, 0.42, 0, 0.18, 0.84, 0.2, scale(w, 0.45));
  g.taper(0, 0.82, 0, 0.5, 0.3, 0.44, 0.26, 0.66, w);
  g.sphere(0, 1.68, 0, 0.17, scale(w, 0.85), 8, 6);
  return g;
}

export function buildPassengerMesh(scene: Scene, a: Archetype, lit: StandardMaterial): Mesh {
  const g = new Geo();
  const body = hex(a.body), accent = hex(a.accent), skin = hex(a.skin);
  const h = a.height;
  g.box(-0.12, 0.42 * h, 0, 0.18, 0.84 * h, 0.2, hex("#2b2d42"));
  g.box(0.12, 0.42 * h, 0, 0.18, 0.84 * h, 0.2, hex("#2b2d42"));
  g.taper(0, 0.82 * h, 0, 0.52, 0.32, 0.46, 0.28, 0.68 * h, body, 0, 0, accent);
  g.box(0, 1.1 * h, 0.15, 0.3, 0.1, 0.02, accent);
  // arms (one raised to hail)
  g.box(-0.32, 1.12 * h, 0, 0.12, 0.55, 0.12, body);
  g.box(0.34, 1.62 * h, 0.05, 0.12, 0.6, 0.12, body);
  g.sphere(0.34, 1.95 * h, 0.05, 0.08, skin, 6, 4);
  g.sphere(0, 1.72 * h, 0, 0.19, skin, 10, 8);
  const hy = 1.72 * h;
  switch (a.hat) {
    case "cap": g.box(0, hy + 0.15, 0, 0.36, 0.1, 0.36, accent); g.box(0, hy + 0.12, 0.2, 0.3, 0.04, 0.2, accent); break;
    case "beanie": g.sphere(0, hy + 0.08, 0, 0.2, accent, 10, 6, true); break;
    case "sunhat": g.cyl(0, hy + 0.14, 0, 0.36, 0.36, 0.04, 14, accent); g.cyl(0, hy + 0.22, 0, 0.18, 0.16, 0.14, 10, accent); break;
    case "tophat": g.cyl(0, hy + 0.14, 0, 0.27, 0.27, 0.04, 12, DARK); g.cyl(0, hy + 0.32, 0, 0.17, 0.17, 0.34, 10, DARK); break;
    case "headphones": g.box(0, hy + 0.2, 0, 0.42, 0.06, 0.08, accent); g.box(0.2, hy, 0, 0.08, 0.16, 0.14, accent); g.box(-0.2, hy, 0, 0.08, 0.16, 0.14, accent); break;
    case "helmet": g.sphere(0, hy + 0.04, 0, 0.23, accent, 10, 6, true); break;
    case "bun": g.sphere(0, hy + 0.2, -0.06, 0.1, hex("#5b3a24"), 8, 6); break;
    case "beret": g.cyl(0, hy + 0.16, 0, 0.22, 0.2, 0.06, 12, accent); break;
  }
  switch (a.prop) {
    case "case": g.box(-0.42, 0.55 * h, 0, 0.14, 0.42, 0.62, hex("#3b2a22")); break;
    case "box": g.box(0, 1.0 * h, 0.32, 0.5, 0.36, 0.36, hex("#ffffff")); g.box(0, 1.19 * h, 0.32, 0.52, 0.04, 0.38, accent); break;
    case "board": g.box(-0.4, 0.9 * h, -0.12, 0.08, 1.7, 0.45, accent); break;
    case "bag": g.box(-0.32, 0.8 * h, 0, 0.2, 0.3, 0.32, accent); break;
    case "camera": g.box(0, 1.25 * h, 0.18, 0.2, 0.14, 0.1, DARK); break;
    case "flowers": g.sphere(-0.36, 1.05 * h, 0.12, 0.16, hex("#ff70a6"), 8, 6); break;
  }
  return g.toMesh(`passenger-${a.id}`, scene, lit);
}
