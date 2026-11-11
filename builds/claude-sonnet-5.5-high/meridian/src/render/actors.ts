import { Color3, InstancedMesh, Mesh, MeshBuilder, Scene, StandardMaterial, TransformNode } from '@babylonjs/core';
import { GeoBuilder, hex, mul } from './geo';
import type { RGBA } from './geo';
import type { Human } from '../sim/types';
import type { Vehicle, VehicleDef } from '../sim/vehicle';

// ============================================================================ vehicles
interface VehicleVisual {
  root: TransformNode;
  body: TransformNode;
  wheels: Array<{ node: TransformNode; front: boolean; spin: TransformNode }>;
  lights: InstancedMesh;
  bar?: { red: Mesh; blue: Mesh };
  spin: number;
  brakeLights: Mesh | null;
  defId: string;
}

const GLASS: RGBA = [0.1, 0.17, 0.21, 1];
const DARK: RGBA = [0.08, 0.08, 0.09, 1];

function frustum(g: GeoBuilder, cx: number, y0: number, z0: number, wb: number, lb: number, y1: number, z1: number, wt: number, lt: number, glass: RGBA, roof: RGBA): void {
  // sloped cabin: bottom rectangle (wb x lb centred at z0) to top rectangle (wt x lt centred at z1)
  const b = [[cx - wb / 2, y0, z0 - lb / 2], [cx + wb / 2, y0, z0 - lb / 2], [cx + wb / 2, y0, z0 + lb / 2], [cx - wb / 2, y0, z0 + lb / 2]];
  const t = [[cx - wt / 2, y1, z1 - lt / 2], [cx + wt / 2, y1, z1 - lt / 2], [cx + wt / 2, y1, z1 + lt / 2], [cx - wt / 2, y1, z1 + lt / 2]];
  const uv = [[0, 0], [1, 0], [1, 1], [0, 1]];
  // back (-z), right (+x), front (+z), left (-x)
  g.quad(b[0], t[0], t[1], b[1], [0, 0.4, -1], uv, glass);
  g.quad(b[1], t[1], t[2], b[2], [1, 0.3, 0], uv, glass);
  g.quad(b[2], t[2], t[3], b[3], [0, 0.5, 1], uv, glass);
  g.quad(b[3], t[3], t[0], b[0], [-1, 0.3, 0], uv, glass);
  g.quad(t[0], t[3], t[2], t[1], [0, 1, 0], uv, roof);
}

function buildVehicleGeo(def: VehicleDef, color: number): GeoBuilder {
  const g = new GeoBuilder();
  const w = def.width;
  const L = def.length;
  const body = hex(color);
  const paintDark = mul(body, 0.78);
  const hw = w / 2;
  const y0 = 0.3;
  switch (def.kind) {
    case 'bike': {
      g.box(-0.13, 0.35, -L * 0.28, 0.13, 0.7, L * 0.12, body, { plain: true });         // tank + frame
      g.box(-0.12, 0.62, -L * 0.45, 0.12, 0.75, -L * 0.1, [0.12, 0.12, 0.13, 1], { plain: true }); // seat
      g.box(-0.1, 0.35, -L * 0.5, 0.1, 0.6, -L * 0.36, body, { plain: true });           // tail
      g.box(-0.05, 0.4, L * 0.28, 0.05, 1.0, L * 0.32, [0.55, 0.55, 0.58, 1], { plain: true }); // fork
      g.box(-0.34, 0.98, L * 0.27, 0.34, 1.04, L * 0.3, DARK, { plain: true });           // handlebars
      g.box(-0.12, 0.7, L * 0.2, 0.12, 0.98, L * 0.3, mul(body, 0.9), { plain: true });  // fairing
      g.box(-0.1, 0.25, -L * 0.2, 0.1, 0.4, L * 0.15, [0.2, 0.2, 0.22, 1], { plain: true }); // engine
      break;
    }
    case 'van': {
      g.box(-hw, y0, -L / 2, hw, y0 + 0.35, L / 2, mul(body, 0.7), { plain: true });
      g.box(-hw, y0 + 0.3, -L / 2, hw, def.height, L * 0.18, body, { plain: true });                     // cargo box
      g.box(-hw * 0.96, y0 + 0.3, L * 0.18, hw * 0.96, def.height - 0.5, L / 2, body, { plain: true }); // cab body
      frustum(g, 0, def.height - 0.5, L * 0.28, w * 0.92, L * 0.28, def.height - 0.1, L * 0.3, w * 0.8, L * 0.2, GLASS, mul(body, 1.05));
      g.box(-hw * 0.98, y0 + 0.5, L / 2 - 0.05, hw * 0.98, y0 + 0.9, L / 2 + 0.05, DARK, { plain: true }); // grille
      g.box(-hw, y0 - 0.05, L / 2 - 0.1, hw, y0 + 0.2, L / 2 + 0.2, DARK, { plain: true });
      g.box(-hw, y0 - 0.05, -L / 2 - 0.1, hw, y0 + 0.2, -L / 2 + 0.1, DARK, { plain: true });
      break;
    }
    default: {
      const police = def.kind === 'police';
      g.box(-hw, y0, -L / 2, hw, y0 + def.height * 0.42, L / 2, body, { plain: true, topCol: mul(body, 1.05) });
      // hood and trunk slight bevel via darker panels
      g.box(-hw * 0.92, y0 + def.height * 0.42, L * 0.14, hw * 0.92, y0 + def.height * 0.47, L / 2 - 0.2, paintDark, { plain: true });
      g.box(-hw * 0.92, y0 + def.height * 0.42, -L / 2 + 0.2, hw * 0.92, y0 + def.height * 0.47, -L * 0.3, paintDark, { plain: true });
      frustum(g, 0, y0 + def.height * 0.42, -L * 0.04, w * 0.92, L * 0.56, def.height, -L * 0.08, w * 0.8, L * 0.34, GLASS, police ? [0.95, 0.95, 0.96, 1] : mul(body, 1.08));
      g.box(-hw - 0.02, y0, -L / 2, -hw + 0.04, y0 + 0.2, L / 2, DARK, { plain: true }); // sills
      g.box(hw - 0.04, y0, -L / 2, hw + 0.02, y0 + 0.2, L / 2, DARK, { plain: true });
      g.box(-hw * 0.95, y0 + 0.05, L / 2 - 0.1, hw * 0.95, y0 + 0.4, L / 2 + 0.08, DARK, { plain: true }); // front bumper
      g.box(-hw * 0.95, y0 + 0.05, -L / 2 - 0.08, hw * 0.95, y0 + 0.4, -L / 2 + 0.1, DARK, { plain: true });
      if (police) {
        g.box(-hw - 0.01, y0 + 0.25, -L * 0.3, hw + 0.01, y0 + 0.62, L * 0.2, [0.93, 0.93, 0.95, 1], { plain: true }); // white doors
        g.box(-hw * 0.8, def.height, -L * 0.14, hw * 0.8, def.height + 0.06, -L * 0.02, DARK, { plain: true });
      }
      if (def.id === 'cormorant') { g.box(-0.5, y0 + def.height * 0.47, L * 0.18, 0.5, y0 + def.height * 0.5 + 0.05, L * 0.46, [0.1, 0.1, 0.1, 1], { plain: true }); g.box(-hw * 0.9, y0 + def.height * 0.42, -L / 2 + 0.05, hw * 0.9, y0 + def.height * 0.42 + 0.14, -L / 2 + 0.3, DARK, { plain: true }); }
    }
  }
  return g;
}

function buildLightsGeo(def: VehicleDef): GeoBuilder {
  const g = new GeoBuilder();
  const w = def.width;
  const L = def.length;
  if (def.kind === 'bike') {
    g.box(-0.1, 0.8, L * 0.3, 0.1, 0.92, L * 0.36, [1, 0.95, 0.75, 1], { plain: true });
    g.box(-0.06, 0.55, -L * 0.52, 0.06, 0.62, -L * 0.5, [1, 0.1, 0.1, 1], { plain: true });
    return g;
  }
  const y = 0.3 + (def.kind === 'van' ? 0.45 : 0.28);
  for (const s of [-1, 1]) {
    g.box(s * w * 0.36 - 0.2, y, L / 2 - 0.02, s * w * 0.36 + 0.2, y + 0.14, L / 2 + 0.09, [1, 0.96, 0.8, 1], { plain: true });
    g.box(s * w * 0.36 - 0.22, y, -L / 2 - 0.09, s * w * 0.36 + 0.22, y + 0.12, -L / 2 + 0.02, [1, 0.12, 0.1, 1], { plain: true });
  }
  return g;
}

export class VehicleRenderer {
  private masters = new Map<string, Mesh>();
  private lightMasters = new Map<string, Mesh>();
  private wheelMasters = new Map<string, Mesh>();
  private visuals = new Map<number, VehicleVisual>();
  private bodyMat: StandardMaterial;
  private lightMat: StandardMaterial;
  private tireMat: StandardMaterial;
  private barRed: StandardMaterial;
  private barBlue: StandardMaterial;
  casters: Mesh[] = [];
  night = 0;
  reducedFlashes = false;

  constructor(private scene: Scene) {
    this.bodyMat = new StandardMaterial('vbody', scene);
    this.bodyMat.specularColor = new Color3(0.35, 0.35, 0.38);
    this.bodyMat.specularPower = 64;
    this.bodyMat.backFaceCulling = false;
    this.lightMat = new StandardMaterial('vlights', scene);
    this.lightMat.emissiveColor = new Color3(0.5, 0.5, 0.45);
    this.lightMat.disableLighting = true;
    this.tireMat = new StandardMaterial('vtire', scene);
    this.tireMat.diffuseColor = new Color3(0.07, 0.07, 0.08);
    this.tireMat.specularColor = Color3.Black();
    this.barRed = new StandardMaterial('barred', scene);
    this.barRed.emissiveColor = new Color3(1, 0.1, 0.1);
    this.barRed.disableLighting = true;
    this.barBlue = new StandardMaterial('barblue', scene);
    this.barBlue.emissiveColor = new Color3(0.15, 0.3, 1);
    this.barBlue.disableLighting = true;
  }

  private master(def: VehicleDef, color: number): Mesh {
    const key = def.id + ':' + color;
    let m = this.masters.get(key);
    if (!m) {
      m = buildVehicleGeo(def, color).build(this.scene, 'vm-' + key, this.bodyMat, { freeze: false });
      m.isVisible = false;
      this.masters.set(key, m);
      this.casters.push(m);
    }
    return m;
  }

  private lightMaster(def: VehicleDef): Mesh {
    let m = this.lightMasters.get(def.id);
    if (!m) {
      m = buildLightsGeo(def).build(this.scene, 'vl-' + def.id, this.lightMat, { freeze: false });
      m.isVisible = false;
      this.lightMasters.set(def.id, m);
    }
    return m;
  }

  private wheelMaster(r: number, w: number): Mesh {
    const key = r.toFixed(2) + ':' + w.toFixed(2);
    let m = this.wheelMasters.get(key);
    if (!m) {
      m = MeshBuilder.CreateCylinder('wheel-' + key, { diameter: r * 2, height: w, tessellation: 14 }, this.scene);
      m.rotation.z = Math.PI / 2;
      m.bakeCurrentTransformIntoVertices();
      m.material = this.tireMat;
      m.isVisible = false;
      this.wheelMasters.set(key, m);
      this.casters.push(m);
    }
    return m;
  }

  private create(v: Vehicle): VehicleVisual {
    const d = v.def;
    const root = new TransformNode('v' + v.id, this.scene);
    const body = new TransformNode('vb' + v.id, this.scene);
    body.parent = root;
    this.master(d, v.color).createInstance('vbi' + v.id).parent = body;
    const lights = this.lightMaster(d).createInstance('vli' + v.id);
    lights.parent = body;
    const wheels: VehicleVisual['wheels'] = [];
    const isBike = d.kind === 'bike';
    const wm = this.wheelMaster(d.wheelRadius, isBike ? 0.16 : 0.26);
    const ax = d.wheelbase / 2;
    const defs: Array<[number, number, boolean]> = isBike
      ? [[0, ax, true], [0, -ax, false]]
      : [[-d.width / 2 + 0.12, ax, true], [d.width / 2 - 0.12, ax, true], [-d.width / 2 + 0.12, -ax, false], [d.width / 2 - 0.12, -ax, false]];
    for (const [x, z, front] of defs) {
      const node = new TransformNode('wn' + v.id, this.scene);
      node.parent = root;
      node.position.set(x, d.wheelRadius, z);
      const spin = new TransformNode('ws' + v.id, this.scene);
      spin.parent = node;
      wm.createInstance('wi' + v.id).parent = spin;
      wheels.push({ node, front, spin });
    }
    const vis: VehicleVisual = { root, body, wheels, lights, spin: 0, brakeLights: null, defId: d.id };
    if (d.kind === 'police' || v.owner === 'police') {
      const mk = (mat: StandardMaterial, x: number): Mesh => {
        const b = MeshBuilder.CreateBox('bar', { width: 0.55, height: 0.14, depth: 0.25 }, this.scene);
        b.material = mat;
        b.parent = body;
        b.position.set(x, d.height + 0.1, d.kind === 'van' ? 0.4 : -0.08);
        return b;
      };
      vis.bar = { red: mk(this.barRed, -0.32), blue: mk(this.barBlue, 0.32) };
    }
    return vis;
  }

  sync(vehicles: Vehicle[], t: number, dt: number, playerVehicleId: number | null): void {
    const alive = new Set<number>();
    for (const v of vehicles) {
      if (!v.alive) continue;
      alive.add(v.id);
      let vis = this.visuals.get(v.id);
      if (!vis) { vis = this.create(v); this.visuals.set(v.id, vis); }
      vis.root.position.set(v.x, 0, v.z);
      vis.root.rotation.y = v.heading;
      const isBike = v.def.kind === 'bike';
      vis.body.rotation.z = isBike ? v.roll : v.roll * 0.6;
      vis.body.rotation.x = -v.pitch * 0.5;
      vis.body.position.y = isBike ? 0 : 0.02 + Math.min(0.04, Math.abs(v.pitch) * 0.3);
      vis.spin += v.speed * dt / v.def.wheelRadius;
      for (const w of vis.wheels) {
        w.spin.rotation.x = vis.spin;
        if (w.front) w.node.rotation.y = v.steer;
      }
      const lightsOn = v.lights || (v.driverId !== null && this.night > 0.4);
      vis.lights.setEnabled(lightsOn || v.speed < -0.5 || true);
      if (vis.bar) {
        const on = v.siren;
        const rate = this.reducedFlashes ? 1.2 : 2.8; // <= 3 Hz photosensitivity-safe
        const phase = Math.floor(t * rate * 2) % 2 === 0;
        vis.bar.red.setEnabled(on && phase);
        vis.bar.blue.setEnabled(on && !phase);
        if (!on) { vis.bar.red.setEnabled(false); vis.bar.blue.setEnabled(false); }
      }
      vis.root.setEnabled(true);
    }
    for (const [id, vis] of this.visuals) {
      if (!alive.has(id)) {
        vis.root.dispose(false, true);
        if (vis.bar) { vis.bar.red.dispose(); vis.bar.blue.dispose(); }
        this.visuals.delete(id);
      }
    }
    void playerVehicleId;
  }

  reset(): void {
    for (const vis of this.visuals.values()) { vis.root.dispose(false, true); if (vis.bar) { vis.bar.red.dispose(); vis.bar.blue.dispose(); } }
    this.visuals.clear();
  }

  seatPosition(v: Vehicle): { x: number; y: number; z: number } {
    return { x: v.x, y: v.def.kind === 'bike' ? 0.78 : 0.9, z: v.z };
  }
}

// ============================================================================ humans
interface Palette { skin: number; shirt: number; pants: number; shoes: number; hair: number; accent: number; hat?: number }

const SKINS = [0xf0c8a0, 0xd9a577, 0xb07a52, 0x8a5a3a, 0x5e3b27, 0xe8b58c];
const SHIRTS = [0xd9553b, 0x3b8fd9, 0xe3b53b, 0x4caf78, 0xb05ad6, 0xe9e4d6, 0x2f4858, 0xf08a4b, 0x6fb7a8, 0xc94f7c, 0x8c9a3b, 0x7a5c99];
const PANTS = [0x2d3a4a, 0x3b3b3b, 0x5a4a3a, 0x1f2f4d, 0x6b5b4b, 0x2a4a3a];
const HAIRS = [0x2a1d14, 0x5a3a22, 0x111111, 0xb89b5a, 0x8a8a8a, 0x6b2f1f];

export function paletteFor(variant: number, outfit: number): Palette {
  if (variant === 20) {
    // Rowan: outfit index selects jacket
    const jackets = [0xe8742b, 0x1f3a5f, 0x2a8a8a, 0x8a4a2a, 0x40464d];
    return { skin: 0xc98f66, shirt: jackets[outfit % jackets.length], pants: 0x2f3744, shoes: 0x1d1d1f, hair: 0x2a1d14, accent: 0xf2d16b };
  }
  if (variant === 30) return { skin: 0xd9aa80, shirt: 0x1b2a41, pants: 0x151f30, shoes: 0x0e0e10, hair: 0x2a1d14, accent: 0xd8c34a, hat: 0x121b2b };
  if (variant === 31) return { skin: 0xd9aa80, shirt: 0x3a3f45, pants: 0x25282c, shoes: 0x0e0e10, hair: 0x2a1d14, accent: 0xc7c7c7, hat: 0x25282c };
  if (variant === 32) return { skin: 0xc98f66, shirt: 0x7a1f2b, pants: 0x1a1a1c, shoes: 0x0e0e10, hair: 0x111111, accent: 0x2a2a2a };
  const v = Math.abs(variant);
  return { skin: SKINS[v % SKINS.length], shirt: SHIRTS[v % SHIRTS.length], pants: PANTS[(v * 3) % PANTS.length], shoes: 0x25252a, hair: HAIRS[(v * 5) % HAIRS.length], accent: SHIRTS[(v + 5) % SHIRTS.length], hat: v % 5 === 3 ? SHIRTS[(v + 2) % SHIRTS.length] : undefined };
}

interface HumanVisual {
  root: TransformNode; torso: TransformNode; legL: TransformNode; legR: TransformNode; armL: TransformNode; armR: TransformNode; gun: Mesh | null; key: string; head: TransformNode;
}

export class HumanRenderer {
  private masters = new Map<string, Mesh>();
  private visuals = new Map<number, HumanVisual>();
  private mat: StandardMaterial;
  private gunMaster: Mesh;
  casters: Mesh[] = [];

  constructor(private scene: Scene) {
    this.mat = new StandardMaterial('hmat', scene);
    this.mat.specularColor = new Color3(0.05, 0.05, 0.05);
    this.mat.backFaceCulling = false;
    this.gunMaster = new GeoBuilder().build(scene, 'gun', this.mat, { freeze: false });
    const gg = new GeoBuilder();
    gg.box(-0.04, -0.05, 0, 0.04, 0.05, 0.5, [0.1, 0.1, 0.11, 1], { plain: true });
    gg.box(-0.035, -0.16, 0.02, 0.035, -0.05, 0.1, [0.1, 0.1, 0.11, 1], { plain: true });
    this.gunMaster.dispose();
    this.gunMaster = gg.build(scene, 'gun', this.mat, { freeze: false });
    this.gunMaster.isVisible = false;
  }

  private part(kind: 'torso' | 'leg' | 'arm', p: Palette, key: string): Mesh {
    const k = kind + ':' + key;
    let m = this.masters.get(k);
    if (m) return m;
    const g = new GeoBuilder();
    if (kind === 'torso') {
      const shirt = hex(p.shirt);
      g.box(-0.26, 0.8, -0.15, 0.26, 1.44, 0.15, shirt, { plain: true });
      g.box(-0.27, 0.78, -0.16, 0.27, 0.86, 0.16, hex(p.pants), { plain: true });   // belt line
      g.box(-0.08, 1.42, -0.08, 0.08, 1.52, 0.08, hex(p.skin), { plain: true });      // neck
      g.sphere(0, 1.64, 0, 0.14, 0.16, 0.15, 8, hex(p.skin));
      g.sphere(0, 1.7, -0.02, 0.15, 0.13, 0.16, 8, hex(p.hair), true);
      g.box(-0.14, 1.38, 0.15, 0.14, 1.46, 0.17, hex(p.accent), { plain: true });      // collar/accent
      if (p.hat !== undefined) { g.cylinder(0, 1.74, 0, 0.17, 0.17, 0.1, 8, hex(p.hat)); g.box(-0.13, 1.74, 0.1, 0.13, 1.77, 0.26, hex(p.hat), { plain: true }); }
      if (p.accent === 0xd8c34a) g.box(0.1, 1.2, 0.15, 0.2, 1.3, 0.17, hex(0xd8c34a), { plain: true }); // badge
      g.box(-0.2, 0.9, 0.15, 0.2, 1.1, 0.19, mul(shirt, 0.85), { plain: true });       // pocket band
    } else if (kind === 'leg') {
      g.box(-0.1, -0.74, -0.11, 0.1, 0, 0.11, hex(p.pants), { plain: true });
      g.box(-0.105, -0.82, -0.12, 0.105, -0.7, 0.2, hex(p.shoes), { plain: true });
    } else {
      g.box(-0.06, -0.52, -0.06, 0.06, 0, 0.06, hex(p.shirt), { plain: true });
      g.box(-0.055, -0.62, -0.055, 0.055, -0.5, 0.055, hex(p.skin), { plain: true });
    }
    m = g.build(this.scene, 'h-' + k, this.mat, { freeze: false });
    m.isVisible = false;
    this.masters.set(k, m);
    this.casters.push(m);
    return m;
  }

  private create(h: Human, variant: number, outfit: number): HumanVisual {
    const p = paletteFor(variant, outfit);
    const key = variant + ':' + outfit;
    const root = new TransformNode('h' + h.id, this.scene);
    const mk = (kind: 'torso' | 'leg' | 'arm', x: number, y: number): TransformNode => {
      const n = new TransformNode('hn', this.scene);
      n.parent = root;
      n.position.set(x, y, 0);
      this.part(kind, p, key).createInstance('hi' + h.id).parent = n;
      return n;
    };
    const torso = mk('torso', 0, 0);
    const legL = mk('leg', -0.11, 0.82);
    const legR = mk('leg', 0.11, 0.82);
    const armL = mk('arm', -0.33, 1.38);
    const armR = mk('arm', 0.33, 1.38);
    const head = torso;
    let gun: Mesh | null = null;
    if (h.kind === 'police' || h.kind === 'player' || h.kind === 'rival' || h.kind === 'guard') {
      const gi = this.gunMaster.createInstance('gun' + h.id);
      gi.parent = armR;
      gi.position.set(0, -0.6, 0.05);
      gi.rotation.x = Math.PI / 2;
      gi.setEnabled(false);
      gun = gi as unknown as Mesh;
    }
    return { root, torso, legL, legR, armL, armR, gun, key, head };
  }

  reset(): void { for (const vis of this.visuals.values()) vis.root.dispose(false, true); this.visuals.clear(); }

  sync(humans: Human[], player: Human, playerOutfit: number, opts: { playerVehicleKind: string | null; playerAiming: boolean; playerArmed: boolean; meleeT: number; cam: { x: number; z: number }; t: number }): void {
    const seen = new Set<number>();
    const all = [player, ...humans];
    for (const h of all) {
      const inVehicle = h.vehicleId !== null;
      const riding = h === player && inVehicle && opts.playerVehicleKind === 'bike';
      if ((inVehicle && !riding) || h.state === 'Spawn') continue;
      const variant = h.kind === 'player' ? 20 : h.variant;
      const outfit = h.kind === 'player' ? playerOutfit : 0;
      seen.add(h.id);
      let vis = this.visuals.get(h.id);
      const key = variant + ':' + outfit;
      if (vis && vis.key !== key) { vis.root.dispose(false, true); this.visuals.delete(h.id); vis = undefined; }
      if (!vis) { vis = this.create(h, variant, outfit); this.visuals.set(h.id, vis); }
      const r = vis.root;
      const down = h.state === 'Down' || h.state === 'Dead' || (!h.alive);
      r.position.set(h.x, h.y + (h.swimming ? -0.7 : 0), h.z);
      r.rotation.y = h.heading;
      let walk = Math.min(1, h.speed / 4);
      const ph = h.anim;
      r.scaling.y = h.crouch ? 0.82 : 1;
      r.rotation.x = 0;
      r.rotation.z = 0;
      vis.armL.rotation.set(0, 0, 0);
      vis.armR.rotation.set(0, 0, 0);
      vis.legL.rotation.set(0, 0, 0);
      vis.legR.rotation.set(0, 0, 0);
      if (down) {
        r.rotation.x = -Math.PI / 2 * 0.98;
        r.position.y = 0.16;
        if (h.state === 'Down' && h.kind !== 'player') r.rotation.z = 0.2;
      } else if (riding) {
        const v = h;
        r.position.y = 0.38;
        vis.legL.rotation.x = -1.15; vis.legR.rotation.x = -1.15;
        vis.armL.rotation.x = -1.2; vis.armR.rotation.x = -1.2;
        r.rotation.x = 0.28;
        void v;
      } else if (h.swimming) {
        r.rotation.x = -1.2;
        vis.armL.rotation.x = Math.sin(opts.t * 5) * 1.2;
        vis.armR.rotation.x = -Math.sin(opts.t * 5) * 1.2;
        vis.legL.rotation.x = Math.sin(opts.t * 7) * 0.5;
        vis.legR.rotation.x = -Math.sin(opts.t * 7) * 0.5;
      } else {
        const amp = walk * (h.speed > 5 ? 1.1 : 0.7);
        vis.legL.rotation.x = Math.sin(ph) * amp;
        vis.legR.rotation.x = -Math.sin(ph) * amp;
        vis.armL.rotation.x = -Math.sin(ph) * amp * 0.9;
        vis.armR.rotation.x = Math.sin(ph) * amp * 0.9;
        if (h.state === 'Panic' || h.state === 'Flee') { vis.armL.rotation.x = -2.4 + Math.sin(ph) * 0.3; vis.armR.rotation.x = -2.4 - Math.sin(ph) * 0.3; }
        if (h.state === 'CallEmergency') { vis.armR.rotation.x = -2.0; vis.armR.rotation.z = -0.2; }
        if (h.state === 'Talk') { vis.armR.rotation.x = -0.6 + Math.sin(opts.t * 4 + h.id) * 0.4; }
        if (h.state === 'Work') { vis.armL.rotation.x = -0.8 + Math.sin(opts.t * 2 + h.id) * 0.25; vis.armR.rotation.x = -0.8 - Math.sin(opts.t * 2 + h.id) * 0.25; }
        if (h.state === 'Arrest') { vis.armR.rotation.x = -1.4; }
        // armed pose
        const armed = h === player ? opts.playerArmed : (h.state === 'Shoot' || h.state === 'Arrest');
        if (armed) { vis.armR.rotation.x = -1.45; vis.armL.rotation.x = -1.3; vis.armL.rotation.z = 0.3; if (vis.gun) vis.gun.setEnabled(true); }
        else if (vis.gun) vis.gun.setEnabled(false);
        if (h === player && opts.meleeT > 0) { vis.armR.rotation.x = -2.2 + (0.25 - opts.meleeT) * 10; }
      }
      if (h === player && !riding && vis.gun && !opts.playerArmed) vis.gun.setEnabled(false);
      r.setEnabled(true);
    }
    for (const [id, vis] of this.visuals) if (!seen.has(id)) { vis.root.dispose(false, true); this.visuals.delete(id); }
  }
}
