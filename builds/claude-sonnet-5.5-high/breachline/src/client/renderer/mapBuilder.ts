// Builds the K-17 environment visuals from the same collision boxes the simulation uses.
import {
  Color3, Mesh, MeshBuilder, Scene, StandardMaterial, TransformNode, VertexData, Vector3, Texture, ShadowGenerator,
} from "@babylonjs/core";
import type { MapBox, MapData } from "../../shared/map/k17";
import { Rng } from "../../shared/math";
import { makeSignTexture, type TextureSet } from "./textures";

type RGB = [number, number, number];

class Geo {
  pos: number[] = []; nor: number[] = []; uv: number[] = []; col: number[] = []; idx: number[] = [];
  /** Appends one axis-aligned box with world-space planar UVs. */
  box(min: Vector3Like, max: Vector3Like, tile: number, color: RGB, opts: { ao?: boolean; skip?: Array<"+x" | "-x" | "+y" | "-y" | "+z" | "-z">; uvScale?: [number, number]; bottomShade?: number } = {}): void {
    const sk = opts.skip ?? [];
    const ao = opts.ao ?? false;
    const [su, sv] = opts.uvScale ?? [1, 1];
    const faces: Array<{ n: [number, number, number]; v: [number, number, number][]; key: string; uv: (p: [number, number, number]) => [number, number] }> = [
      { key: "+x", n: [1, 0, 0], v: [[max.x, min.y, min.z], [max.x, max.y, min.z], [max.x, max.y, max.z], [max.x, min.y, max.z]], uv: (p) => [p[2], p[1]] },
      { key: "-x", n: [-1, 0, 0], v: [[min.x, min.y, max.z], [min.x, max.y, max.z], [min.x, max.y, min.z], [min.x, min.y, min.z]], uv: (p) => [p[2], p[1]] },
      { key: "+y", n: [0, 1, 0], v: [[min.x, max.y, min.z], [min.x, max.y, max.z], [max.x, max.y, max.z], [max.x, max.y, min.z]], uv: (p) => [p[0], p[2]] },
      { key: "-y", n: [0, -1, 0], v: [[min.x, min.y, max.z], [min.x, min.y, min.z], [max.x, min.y, min.z], [max.x, min.y, max.z]], uv: (p) => [p[0], p[2]] },
      { key: "+z", n: [0, 0, 1], v: [[max.x, min.y, max.z], [max.x, max.y, max.z], [min.x, max.y, max.z], [min.x, min.y, max.z]], uv: (p) => [p[0], p[1]] },
      { key: "-z", n: [0, 0, -1], v: [[min.x, min.y, min.z], [min.x, max.y, min.z], [max.x, max.y, min.z], [max.x, min.y, min.z]], uv: (p) => [p[0], p[1]] },
    ];
    for (const f of faces) {
      if (sk.includes(f.key as never)) continue;
      const base = this.pos.length / 3;
      for (const p of f.v) {
        this.pos.push(p[0], p[1], p[2]);
        this.nor.push(f.n[0], f.n[1], f.n[2]);
        const [u, v] = f.uv(p);
        this.uv.push((u / tile) * su, (v / tile) * sv);
        let shade = 1;
        if (f.key === "-y") shade = opts.bottomShade ?? 0.5;
        else if (f.key === "+y") shade = 1.08;
        else if (ao && p[1] <= min.y + 0.01) shade = 0.74;
        else if (f.key === "+x" || f.key === "-x") shade = 0.94;
        this.col.push(Math.min(1.2, color[0] * shade), Math.min(1.2, color[1] * shade), Math.min(1.2, color[2] * shade), 1);
      }
      // winding: make geometric normal agree with outward normal (LH engine, clockwise front)
      const a = f.v[0], b = f.v[1], c = f.v[2];
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
      const dot = cx * f.n[0] + cy * f.n[1] + cz * f.n[2];
      if (dot < 0) this.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
      else this.idx.push(base, base + 2, base + 1, base, base + 3, base + 2);
    }
  }
  toMesh(scene: Scene, name: string, mat: StandardMaterial): Mesh | null {
    if (!this.idx.length) return null;
    const m = new Mesh(name, scene);
    const vd = new VertexData();
    vd.positions = this.pos; vd.normals = this.nor; vd.uvs = this.uv; vd.colors = this.col; vd.indices = this.idx;
    vd.applyToMesh(m);
    m.material = mat;
    m.receiveShadows = true;
    m.freezeWorldMatrix();
    return m;
  }
}
interface Vector3Like { x: number; y: number; z: number }

export interface MapView {
  root: TransformNode;
  glass: Map<number, Mesh>;
  casters: Mesh[];
  seaMat: StandardMaterial;
  dish: TransformNode;
  update(t: number): void;
}

function std(scene: Scene, name: string, tex: Texture | null, opts: { spec?: number; emissive?: Color3; diffuse?: Color3; cull?: boolean } = {}): StandardMaterial {
  const m = new StandardMaterial(name, scene);
  if (tex) m.diffuseTexture = tex;
  m.diffuseColor = opts.diffuse ?? new Color3(1, 1, 1);
  m.specularColor = new Color3(opts.spec ?? 0.05, opts.spec ?? 0.05, opts.spec ?? 0.05);
  m.specularPower = 48;
  if (opts.emissive) m.emissiveColor = opts.emissive;
  m.backFaceCulling = opts.cull ?? true;
  return m;
}

export function buildMapView(scene: Scene, map: MapData, T: TextureSet, shadow: ShadowGenerator | null): MapView {
  const root = new TransformNode("map", scene);
  const rng = new Rng(7);
  const mats = {
    wall: std(scene, "m_wall", T.wall), roof: std(scene, "m_roof", T.roof, { emissive: new Color3(0.38, 0.4, 0.42) }), rock: std(scene, "m_rock", T.rock),
    metal: std(scene, "m_metal", T.metal, { spec: 0.25 }), wood: std(scene, "m_wood", T.wood),
    floorOut: std(scene, "m_floor_out", T.floorOut, { spec: 0.08 }), floorIn: std(scene, "m_floor_in", T.floorIn, { spec: 0.18 }),
    hazard: std(scene, "m_hazard", T.hazard),
  };
  const geo: Record<keyof typeof mats, Geo> = { wall: new Geo(), roof: new Geo(), rock: new Geo(), metal: new Geo(), wood: new Geo(), floorOut: new Geo(), floorIn: new Geo(), hazard: new Geo() };
  const tint = (base: RGB, amt: number): RGB => { const k = 1 + (rng.next() - 0.5) * amt; return [base[0] * k, base[1] * k, base[2] * k]; };
  const glass = new Map<number, Mesh>();
  const glassMat = std(scene, "m_glass", T.glass, { spec: 0.9, emissive: new Color3(0.1, 0.25, 0.3), cull: false });
  glassMat.alpha = 0.5;
  glassMat.useAlphaFromDiffuseTexture = true;
  glassMat.diffuseTexture!.hasAlpha = true;

  const metalColors: Record<number, RGB[]> = {
    [-1]: [[0.72, 0.9, 0.95], [0.85, 0.88, 0.9], [0.55, 0.78, 0.82]], // ops wing: white / teal
    [1]: [[1.0, 0.55, 0.2], [0.95, 0.62, 0.25], [0.5, 0.52, 0.55]], // maintenance bay: safety orange / graphite
    [0]: [[0.95, 0.6, 0.25], [0.7, 0.85, 0.9]],
  };

  for (const b of map.boxes) {
    if (b.invisible || b.kind === "sea") continue;
    const min = { x: b.min.x, y: b.min.y, z: b.min.z }, max = { x: b.max.x, y: b.max.y, z: b.max.z };
    switch (b.kind) {
      case "wall": {
        const indoorish = map.indoorAt((b.min.x + b.max.x) / 2, (b.min.z + b.max.z) / 2);
        void indoorish;
        geo.wall.box(min, max, 4, tint([0.98, 0.98, 0.95], 0.12), { ao: true, skip: ["-y"] });
        break;
      }
      case "ridge": geo.rock.box(min, max, 8, tint([0.85, 0.82, 0.78], 0.25), { ao: true, skip: ["-y"] }); break;
      case "pedestal": geo.wall.box(min, max, 4, [0.9, 0.93, 0.95], { ao: true, skip: ["-y"] }); break;
      case "roof": geo.roof.box(min, max, 4, [1.05, 1.08, 1.12], { skip: ["+y", "+x", "-x", "+z", "-z"], bottomShade: 1.0 }); break;
      case "sill": case "lintel": geo.wall.box(min, max, 4, [0.95, 0.97, 0.98], { ao: b.kind === "sill", skip: ["-y"] }); break;
      case "rail": {
        if (b.mat === "rail" && b.max.y >= 7) {
          // sea wall: low parapet with an orange rail on top (collision is taller than the visual)
          geo.wall.box(min, { x: max.x, y: 1.0, z: max.z }, 4, [0.85, 0.88, 0.9], { ao: true, skip: ["-y"] });
          geo.metal.box({ x: min.x, y: 1.0, z: min.z + (max.z - min.z) * 0.4 }, { x: max.x, y: 1.12, z: min.z + (max.z - min.z) * 0.6 }, 3, [1.0, 0.55, 0.2]);
        } else geo.metal.box(min, max, 3, [0.3, 0.33, 0.36]);
        break;
      }
      case "cover": {
        const style = b.style ?? "barrier";
        const w = b.max.x - b.min.x, d = b.max.z - b.min.z, h = b.max.y - b.min.y;
        if (style === "barrier") {
          geo.wall.box(min, max, 2, tint([0.82, 0.84, 0.82], 0.08), { ao: true, skip: ["-y"] });
          const hz = 0.01;
          geo.hazard.box({ x: min.x - hz, y: max.y - 0.28, z: min.z - hz }, { x: max.x + hz, y: max.y - 0.06, z: max.z + hz }, 1.1, [1, 1, 1], { skip: ["-y", "+y"] });
        } else if (style === "crate") {
          geo.wood.box(min, max, 1.0, tint(b.side > 0 ? [0.95, 0.82, 0.68] : [0.75, 0.9, 0.95], 0.15), { ao: true, skip: ["-y"], uvScale: [1 / Math.max(1, Math.round(w)), 1 / Math.max(1, Math.round(h))] });
        } else if (style === "container" || style === "pipes") {
          const pal = metalColors[b.side] ?? metalColors[0];
          const c = pal[Math.floor(((min.x * 7.3 + min.z * 3.1) % pal.length + pal.length) % pal.length)];
          geo.metal.box(min, max, 2.5, style === "pipes" ? [0.55, 0.62, 0.66] : c, { ao: true, skip: ["-y"] });
        } else if (style === "console" || style === "bench") {
          geo.metal.box(min, max, 2, [0.35, 0.38, 0.42], { ao: true, skip: ["-y"] });
          geo.wall.box({ x: min.x - 0.02, y: max.y - 0.05, z: min.z - 0.02 }, { x: max.x + 0.02, y: max.y + 0.03, z: max.z + 0.02 }, 2, [0.9, 0.95, 1], {});
        } else if (style === "sheet") {
          geo.metal.box(min, max, 2, [0.62, 0.68, 0.72], { ao: true, skip: ["-y"] });
        } else geo.wall.box(min, max, 2, [0.9, 0.9, 0.9], { ao: true });
        void d;
        break;
      }
      case "step": case "platform": case "post": geo.metal.box(min, max, 2.5, b.kind === "platform" ? [0.5, 0.55, 0.6] : [0.6, 0.64, 0.68], { ao: false }); break;
      case "glass": {
        const sx = max.x - min.x, sz = max.z - min.z;
        const m = MeshBuilder.CreateBox("glass" + b.id, { width: sx, height: max.y - min.y, depth: sz }, scene);
        m.position.set((min.x + max.x) / 2, (min.y + max.y) / 2, (min.z + max.z) / 2);
        m.material = glassMat; m.parent = root; m.isPickable = false;
        glass.set(b.id, m);
        break;
      }
      default: break;
    }
  }

  // ---- floors (greedy merge over non-solid cells)
  const W = 115, H = 95;
  const cellOpen = (i: number, j: number) => { const x = i - 57, z = j - 47; return !map.solidAt(x, z) && z >= -36 && z <= 38; };
  for (const indoor of [false, true]) {
    const seen = new Uint8Array(W * H);
    const match = (i: number, j: number) => i >= 0 && j >= 0 && i < W && j < H && !seen[j * W + i] && cellOpen(i, j) && map.indoorAt(i - 57, j - 47) === indoor;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      if (!match(i, j)) continue;
      let i1 = i;
      while (match(i1 + 1, j)) i1++;
      let j1 = j;
      grow: while (j1 + 1 < H) { for (let x = i; x <= i1; x++) if (!match(x, j1 + 1)) break grow; j1++; }
      for (let y = j; y <= j1; y++) for (let x = i; x <= i1; x++) seen[y * W + x] = 1;
      const a = { x: i - 57.5, y: -0.4, z: j - 47.5 }, c = { x: i1 - 56.5, y: 0, z: j1 - 46.5 };
      (indoor ? geo.floorIn : geo.floorOut).box(a, c, indoor ? 2 : 2, indoor ? [1, 1, 1] : tint([1, 1, 1], 0.06), { skip: ["-y", "+x", "-x", "+z", "-z"] });
    }
  }

  const casters: Mesh[] = [];
  for (const k of Object.keys(mats) as Array<keyof typeof mats>) {
    const m = geo[k].toMesh(scene, "map_" + k, mats[k]);
    if (m) {
      m.parent = root;
      if (k !== "floorOut" && k !== "floorIn" && k !== "hazard") { shadow?.addShadowCaster(m); casters.push(m); }
    }
  }

  // ---- decor: emissive ceiling lights, signs, pipes, dish, masts
  const lightMat = new StandardMaterial("m_light", scene);
  lightMat.emissiveColor = new Color3(0.95, 0.98, 1); lightMat.disableLighting = true;
  const warmMat = new StandardMaterial("m_light_warm", scene);
  warmMat.emissiveColor = new Color3(1, 0.85, 0.6); warmMat.disableLighting = true;
  const lights: Mesh[] = [];
  for (const l of map.decorLights) {
    const m = MeshBuilder.CreateBox("light", { width: l.w, height: 0.06, depth: l.d }, scene);
    m.position.set(l.x, l.y, l.z);
    m.material = l.color === "#ffe2b8" ? warmMat : lightMat;
    m.parent = root; lights.push(m); m.isPickable = false;
  }
  const merged = Mesh.MergeMeshes(lights, true, true, undefined, false, true);
  if (merged) merged.parent = root;

  const sign = (x: number, y: number, z: number, facing: "+x" | "-x" | "+z" | "-z", lines: string[], w = 3.2, h = 1.2, o: Parameters<typeof makeSignTexture>[2] = {}) => {
    const tex = makeSignTexture(scene, lines, o);
    const m = MeshBuilder.CreatePlane("sign", { width: w, height: h }, scene);
    const mat = new StandardMaterial("sign_m", scene);
    mat.diffuseTexture = tex; mat.emissiveTexture = tex; mat.emissiveColor = new Color3(0.55, 0.55, 0.55); mat.specularColor = Color3.Black(); mat.backFaceCulling = true;
    m.material = mat;
    m.position.set(x, y, z);
    m.rotation.y = facing === "+x" ? -Math.PI / 2 : facing === "-x" ? Math.PI / 2 : facing === "+z" ? Math.PI : 0;
    m.parent = root; m.isPickable = false;
  };
  const cyan = { accent: "#35c6e8" }, orange = { accent: "#ff8a1f" };
  sign(-28.42, 3.3, 10, "+x", ["OPERATIONS", "WING  /  K-17"], 3.4, 1.2, cyan);
  sign(28.42, 3.3, 10, "-x", ["MAINTENANCE", "BAY  /  K-17"], 3.4, 1.2, orange);
  sign(-28.42, 3.3, -10, "+x", ["CONTROL ROOM", "ACCESS"], 3.4, 1.2, { ...cyan, arrow: "right" });
  sign(28.42, 3.3, -10, "-x", ["BAY ACCESS", "SERVICE"], 3.4, 1.2, { ...orange, arrow: "left" });
  sign(-30, 3.2, 26.42, "+z", ["NORTH RIDGE", "LONG LANE"], 3.6, 1.2, { ...cyan, arrow: "right" });
  sign(30, 3.2, 26.42, "+z", ["NORTH RIDGE", "LONG LANE"], 3.6, 1.2, { ...orange, arrow: "left" });
  sign(-30, 3.2, -26.42, "-z", ["UTILITY ROUTE", "PIPEWAY S"], 3.6, 1.2, { ...cyan, arrow: "right" });
  sign(30, 3.2, -26.42, "-z", ["UTILITY ROUTE", "PIPEWAY S"], 3.6, 1.2, { ...orange, arrow: "left" });
  sign(-9, 3.4, 18.42, "-z", ["DISH COURTYARD", "RELAY K-17"], 3.8, 1.2, cyan);
  sign(9, 3.4, 18.42, "-z", ["DISH COURTYARD", "RELAY K-17"], 3.8, 1.2, orange);
  sign(-9, 3.4, -18.42, "+z", ["SERVICE TUNNELS", "WEST / EAST"], 3.8, 1.2, cyan);
  sign(9, 3.4, -18.42, "+z", ["SERVICE TUNNELS", "WEST / EAST"], 3.8, 1.2, orange);
  sign(-56.42, 2.8, 0, "+x", ["STAGING A", "MERIDIAN GUARD"], 3.8, 1.3, cyan);
  sign(56.42, 2.8, 0, "-x", ["STAGING B", "ASHFALL SECURITY"], 3.8, 1.3, orange);
  sign(-44.42, 2.8, -14, "+x", ["OPS HALL", "NORTH / SOUTH"], 3.4, 1.2, cyan);
  sign(44.42, 2.8, 14, "-x", ["BAY HALL", "NORTH / SOUTH"], 3.4, 1.2, orange);
  sign(-14, 3.3, 26.42, "+z", ["COURTYARD", "CONNECTOR"], 2.6, 1.0, cyan);

  // pipes along the utility lane wall (overhead, no collision)
  const pipeMats = [std(scene, "m_pipe_o", null, { diffuse: new Color3(1, 0.5, 0.15), spec: 0.4 }), std(scene, "m_pipe_t", null, { diffuse: new Color3(0.2, 0.7, 0.75), spec: 0.4 })];
  const pipe = (x0: number, x1: number, y: number, z: number, r: number, mi: number) => {
    const c = MeshBuilder.CreateCylinder("pipe", { height: x1 - x0, diameter: r * 2, tessellation: 10 }, scene);
    c.rotation.z = Math.PI / 2; c.position.set((x0 + x1) / 2, y, z); c.material = pipeMats[mi]; c.parent = root; c.isPickable = false;
    shadow?.addShadowCaster(c);
  };
  pipe(-43.5, 43.5, 3.5, -26.8, 0.26, 0); pipe(-43.5, 43.5, 4.05, -26.75, 0.17, 1); pipe(-43.5, 43.5, 3.0, -26.78, 0.12, 1);
  pipe(-43.5, 43.5, 3.6, 38.2, 0.2, 1);
  // flange rings on the big pipe
  for (let x = -42; x <= 42; x += 6) {
    const f = MeshBuilder.CreateCylinder("flange", { height: 0.12, diameter: 0.62, tessellation: 10 }, scene);
    f.rotation.z = Math.PI / 2; f.position.set(x, 3.5, -26.8); f.material = pipeMats[1]; f.parent = root; f.isPickable = false;
  }

  // wall-mounted comms racks with cyan emissive strips (control room, hall)
  const rackMat = std(scene, "m_rack", null, { diffuse: new Color3(0.14, 0.17, 0.2), spec: 0.5 });
  const cyanMat = new StandardMaterial("m_cyan", scene); cyanMat.emissiveColor = new Color3(0.2, 0.85, 1); cyanMat.disableLighting = true;
  const orangeMat = new StandardMaterial("m_orange_em", scene); orangeMat.emissiveColor = new Color3(1, 0.55, 0.12); orangeMat.disableLighting = true;
  const rack = (x: number, z: number, face: "+x" | "-x", strip: StandardMaterial) => {
    const m = MeshBuilder.CreateBox("rack", { width: 0.16, height: 2.3, depth: 1.5 }, scene);
    m.position.set(x, 1.2, z); m.material = rackMat; m.parent = root; m.isPickable = false;
    for (let k = 0; k < 6; k++) {
      const s = MeshBuilder.CreateBox("rs", { width: 0.03, height: 0.05, depth: 1.1 }, scene);
      s.position.set(x + (face === "+x" ? 0.09 : -0.09), 0.4 + k * 0.35, z); s.material = strip; s.parent = root; s.isPickable = false;
    }
    shadow?.addShadowCaster(m);
  };
  rack(-36.42, -6.5, "+x", cyanMat); rack(-36.42, 6.5, "+x", cyanMat);
  rack(-29.58, -6.5, "-x", cyanMat); rack(-29.58, 6.5, "-x", cyanMat);
  rack(36.42, -6.5, "-x", orangeMat); rack(36.42, 6.5, "-x", orangeMat);

  // central relay dish on the pedestal
  const dish = new TransformNode("dish", scene);
  dish.parent = root;
  dish.position.set(0, 3.2, 0);
  const whiteMat = std(scene, "m_dish", null, { diffuse: new Color3(0.93, 0.95, 0.96), spec: 0.4, cull: false });
  const prof: Vector3[] = [];
  for (let i = 0; i <= 14; i++) { const r = (i / 14) * 5.6; prof.push(new Vector3(r, r * r * 0.05, 0)); }
  const bowl = MeshBuilder.CreateLathe("bowl", { shape: prof, radius: 1, tessellation: 44, sideOrientation: Mesh.DOUBLESIDE }, scene);
  bowl.material = whiteMat; bowl.parent = dish; bowl.position.set(0, 5.8, 0); bowl.rotation.x = -0.85; bowl.rotation.y = 0.5; bowl.isPickable = false;
  const mast = MeshBuilder.CreateCylinder("mast", { height: 5.4, diameter: 0.9, tessellation: 14 }, scene);
  mast.material = whiteMat; mast.parent = dish; mast.position.set(0, 2.5, 0);
  const feed = MeshBuilder.CreateCylinder("feed", { height: 3.4, diameterTop: 0.08, diameterBottom: 0.22, tessellation: 8 }, scene);
  feed.material = rackMat; feed.parent = bowl; feed.position.set(0, 1.9, 0);
  const horn = MeshBuilder.CreateBox("horn", { width: 0.34, height: 0.3, depth: 0.34 }, scene);
  horn.material = rackMat; horn.parent = bowl; horn.position.set(0, 3.5, 0);
  const beacon = MeshBuilder.CreateSphere("beacon", { diameter: 0.4 }, scene);
  beacon.material = orangeMat; beacon.parent = dish; beacon.position.set(0, 5.6, 0);
  shadow?.addShadowCaster(bowl); shadow?.addShadowCaster(mast);
  void horn; void feed;
  // masts on the wing roofs
  for (const sx of [-1, 1]) for (const [x, z] of [[-50, 12], [-50, -12], [-38, 22], [-38, -22]] as const) {
    const m = MeshBuilder.CreateCylinder("antenna", { height: 7, diameter: 0.16, tessellation: 6 }, scene);
    m.position.set(sx * Math.abs(x), 8.5, z); m.material = rackMat; m.parent = root; m.isPickable = false;
    const l = MeshBuilder.CreateSphere("al", { diameter: 0.3, segments: 6 }, scene);
    l.position.set(sx * Math.abs(x), 12, z); l.material = sx < 0 ? cyanMat : orangeMat; l.parent = root; l.isPickable = false;
  }
  // small roof dishes
  for (const [x, z, s] of [[-48, 0, 1], [48, 0, -1], [-36, -20, 1], [36, 20, -1]] as const) {
    const d = MeshBuilder.CreateSphere("rd", { diameter: 3.4, slice: 0.22, segments: 16, sideOrientation: Mesh.DOUBLESIDE }, scene);
    d.position.set(x, 6.2, z); d.rotation.x = 0.7; d.rotation.y = s * 1.2; d.material = whiteMat; d.parent = root; d.isPickable = false;
    const st = MeshBuilder.CreateBox("rds", { width: 0.4, height: 1.2, depth: 0.4 }, scene);
    st.position.set(x, 5.6, z); st.material = rackMat; st.parent = root; st.isPickable = false;
  }

  // ---- ocean + sea mist backdrop
  const seaMat = std(scene, "m_sea", T.ocean, { spec: 0.6 });
  seaMat.specularPower = 90;
  const sea = MeshBuilder.CreateGround("sea", { width: 1600, height: 1600, subdivisions: 1 }, scene);
  sea.position.y = -2.4; sea.material = seaMat; sea.isPickable = false; sea.receiveShadows = false;
  (seaMat.diffuseTexture as Texture).uScale = 90; (seaMat.diffuseTexture as Texture).vScale = 90;
  sea.parent = root;
  // distant islands
  const islandMat = std(scene, "m_island", null, { diffuse: new Color3(0.38, 0.46, 0.5), spec: 0 });
  islandMat.fogEnabled = true;
  for (const [x, z, s] of [[-260, -300, 60], [180, -340, 80], [330, -160, 50], [-380, 80, 70], [60, 420, 90], [-120, 380, 55]] as const) {
    const i = MeshBuilder.CreateSphere("island", { diameter: s, segments: 8 }, scene);
    i.position.set(x, -s * 0.2, z); i.scaling.set(2.2, 0.55, 1.4); i.material = islandMat; i.parent = root; i.isPickable = false;
  }

  const view: MapView = {
    root, glass, casters, seaMat, dish,
    update(t: number) {
      const tex = seaMat.diffuseTexture as Texture;
      tex.uOffset = t * 0.004; tex.vOffset = t * 0.0025;
      beacon.scaling.setAll(0.7 + 0.3 * Math.sin(t * 3));
    },
  };
  return view;
}

export type { MapBox };
void Vector3;
