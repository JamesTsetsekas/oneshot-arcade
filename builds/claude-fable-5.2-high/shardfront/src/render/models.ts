// renderer: original procedural models. Every unit and structure is assembled from primitives at load time
// (no external art). Vertex attributes carry base colour, a team-colour mask, an emissive mask and gait data.
import * as THREE from 'three';

interface Opt { rx?: number; ry?: number; rz?: number; sx?: number; sy?: number; sz?: number; team?: number; glow?: number; swing?: number; phase?: number; seg?: number; detail?: number }

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _v = new THREE.Vector3();
const _c = new THREE.Color();
const _n = new THREE.Matrix3();

export class GB {
  pos: number[] = []; nor: number[] = []; col: number[] = []; team: number[] = []; glow: number[] = []; anim: number[] = [];

  add(src: THREE.BufferGeometry, x: number, y: number, z: number, color: number, o: Opt = {}): this {
    const g = src.index ? src.toNonIndexed() : src;
    _e.set(o.rx ?? 0, o.ry ?? 0, o.rz ?? 0, 'YXZ');
    _q.setFromEuler(_e);
    _p.set(x, y, z);
    _s.set(o.sx ?? 1, o.sy ?? 1, o.sz ?? 1);
    _m.compose(_p, _q, _s);
    _n.getNormalMatrix(_m);
    const pa = g.getAttribute('position'), na = g.getAttribute('normal');
    _c.setHex(color, THREE.SRGBColorSpace);
    for (let i = 0; i < pa.count; i++) {
      _v.fromBufferAttribute(pa, i).applyMatrix4(_m);
      this.pos.push(_v.x, _v.y, _v.z);
      _v.fromBufferAttribute(na, i).applyMatrix3(_n).normalize();
      this.nor.push(_v.x, _v.y, _v.z);
      this.col.push(_c.r, _c.g, _c.b);
      this.team.push(o.team ?? 0);
      this.glow.push(o.glow ?? 0);
      this.anim.push(o.swing ?? 0, o.phase ?? 0);
    }
    if (g !== src) g.dispose();
    src.dispose();
    return this;
  }

  box(w: number, h: number, d: number, x: number, y: number, z: number, c: number, o?: Opt): this { return this.add(new THREE.BoxGeometry(w, h, d), x, y, z, c, o); }
  cyl(rt: number, rb: number, h: number, x: number, y: number, z: number, c: number, o?: Opt): this { return this.add(new THREE.CylinderGeometry(rt, rb, h, o?.seg ?? 8), x, y, z, c, o); }
  cone(r: number, h: number, x: number, y: number, z: number, c: number, o?: Opt): this { return this.add(new THREE.ConeGeometry(r, h, o?.seg ?? 6), x, y, z, c, o); }
  ball(r: number, x: number, y: number, z: number, c: number, o?: Opt): this { return this.add(new THREE.IcosahedronGeometry(r, o?.detail ?? 1), x, y, z, c, o); }
  octa(r: number, x: number, y: number, z: number, c: number, o?: Opt): this { return this.add(new THREE.OctahedronGeometry(r), x, y, z, c, o); }
  torus(R: number, r: number, x: number, y: number, z: number, c: number, o?: Opt): this { return this.add(new THREE.TorusGeometry(R, r, 5, o?.seg ?? 12), x, y, z, c, { ...o, rx: (o?.rx ?? 0) + Math.PI / 2 }); }

  build(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute('aTeam', new THREE.Float32BufferAttribute(this.team, 1));
    g.setAttribute('aGlow', new THREE.Float32BufferAttribute(this.glow, 1));
    g.setAttribute('aAnim', new THREE.Float32BufferAttribute(this.anim, 2));
    g.computeBoundingBox();
    g.computeBoundingSphere();
    g.userData.height = g.boundingBox ? g.boundingBox.max.y : 1;
    return g;
  }
}

// palette
const HULL = 0x59606d, DARK = 0x2b3038, PLATE = 0xc4c9d1, AMBER = 0xffb24a, STEEL = 0x7d8794, MEND = 0x7dffb0;
const BARK = 0x2c5448, BARK2 = 0x3f7362, ROOT = 0x1c2b29, MEMB = 0xb48cff, FLESH = 0xe3d2ee, SPINE = 0x8fe3c4, VIOLET = 0x8a5cff;
export const ORE_COLOR = 0x35e0d0;
export const FLUX_COLOR = 0xd8ff5a;
const TEAM = 0xffffff;
const PI = Math.PI;
const T = { team: 1 };
const TG = { team: 1, glow: 0.8 };

type Builder = (b: GB) => void;

const MODELS: Record<string, Builder> = {
  // ------------------------------------------------------------ Helix Directorate
  fabricator: (b) => {
    b.box(0.72, 0.36, 0.95, 0, 0.42, 0, HULL).box(0.5, 0.3, 0.42, 0, 0.75, -0.12, PLATE)
      .box(0.74, 0.07, 0.3, 0, 0.62, -0.3, TEAM, T).box(0.34, 0.2, 0.3, 0, 0.62, -0.5, DARK);
    for (const [x, z, ph] of [[-0.36, 0.3, 0], [0.36, 0.3, PI], [-0.36, -0.3, PI], [0.36, -0.3, 0]]) b.box(0.16, 0.34, 0.3, x, 0.17, z, DARK, { swing: 0.12, phase: ph });
    b.box(0.09, 0.09, 0.75, 0.26, 0.78, 0.38, STEEL, { rx: -0.45 }).ball(0.1, 0.26, 0.94, 0.72, AMBER, { glow: 2.2, detail: 0 });
    b.box(0.14, 0.06, 0.05, -0.12, 0.8, 0.1, AMBER, { glow: 1.6 });
  },
  kestrel: (b) => {
    b.box(0.72, 0.24, 1.25, 0, 0.36, 0, HULL).box(0.5, 0.16, 0.55, 0, 0.34, 0.78, PLATE, { rx: 0.25 }).box(0.42, 0.2, 0.5, 0, 0.56, -0.1, DARK);
    for (const [x, z] of [[-0.42, -0.35], [0.42, -0.35], [-0.38, 0.5], [0.38, 0.5]]) b.cyl(0.22, 0.22, 0.14, x, 0.22, z, DARK, { rz: PI / 2, seg: 8 });
    b.cyl(0.26, 0.06, 0.08, 0, 0.86, -0.25, PLATE, { rx: -0.5, seg: 10 }).cyl(0.03, 0.03, 0.3, 0, 0.72, -0.25, STEEL, { seg: 5 });
    b.box(0.06, 0.3, 0.55, -0.34, 0.6, -0.42, TEAM, TG).box(0.06, 0.3, 0.55, 0.34, 0.6, -0.42, TEAM, TG);
    b.box(0.3, 0.05, 0.05, 0, 0.42, 1.02, AMBER, { glow: 2 });
  },
  bulwark: (b) => {
    b.box(0.2, 0.72, 0.26, -0.23, 0.36, 0, DARK, { swing: 0.3, phase: 0 }).box(0.2, 0.72, 0.26, 0.23, 0.36, 0, DARK, { swing: 0.3, phase: PI });
    b.box(0.62, 0.2, 0.38, 0, 0.8, 0, HULL).box(0.74, 0.5, 0.52, 0, 1.14, 0, PLATE).box(0.4, 0.34, 0.2, 0, 1.12, -0.34, DARK);
    b.box(0.26, 0.2, 0.26, 0, 1.5, 0.08, DARK).box(0.2, 0.06, 0.05, 0, 1.52, 0.22, AMBER, { glow: 2.2 });
    b.box(0.13, 0.13, 0.85, -0.45, 1.1, 0.3, STEEL).box(0.13, 0.13, 0.85, 0.45, 1.1, 0.3, STEEL);
    b.box(0.08, 0.08, 0.08, -0.45, 1.1, 0.75, AMBER, { glow: 1.5 }).box(0.08, 0.08, 0.08, 0.45, 1.1, 0.75, AMBER, { glow: 1.5 });
    b.box(0.22, 0.12, 0.44, -0.45, 1.4, 0, TEAM, TG).box(0.22, 0.12, 0.44, 0.45, 1.4, 0, TEAM, TG);
  },
  lancer: (b) => {
    for (const [x, z, ph] of [[-0.55, 0.45, 0], [0.55, 0.45, PI], [-0.55, -0.45, PI], [0.55, -0.45, 0]]) b.box(0.15, 0.55, 0.15, x, 0.28, z, DARK, { swing: 0.2, phase: ph, rz: x > 0 ? 0.25 : -0.25 });
    b.box(0.85, 0.3, 1.15, 0, 0.62, 0, HULL).box(0.55, 0.3, 0.6, 0, 0.92, -0.15, PLATE).box(0.57, 0.06, 0.3, 0, 1.1, -0.25, TEAM, TG);
    b.cyl(0.07, 0.11, 2.0, 0, 1.0, 0.75, STEEL, { rx: PI / 2, seg: 6 });
    for (const z of [0.5, 0.95, 1.4]) b.cyl(0.17, 0.17, 0.09, 0, 1.0, z, AMBER, { rx: PI / 2, glow: 1.8, seg: 8 });
    b.box(0.3, 0.25, 0.3, 0, 0.9, -0.6, DARK);
  },
  mender: (b) => {
    b.cyl(0.55, 0.68, 0.34, 0, 0.36, 0, HULL, { seg: 8 }).cyl(0.7, 0.7, 0.08, 0, 0.24, 0, TEAM, { ...TG, seg: 8 });
    b.ball(0.42, 0, 0.62, 0, PLATE, { sy: 0.6 }).torus(0.78, 0.06, 0, 0.62, 0, MEND, { glow: 2, seg: 14 });
    b.box(0.1, 0.5, 0.1, 0.3, 0.95, 0.2, STEEL, { rx: 0.5 }).ball(0.1, 0.3, 1.15, 0.36, MEND, { glow: 2.5, detail: 0 });
    b.box(0.1, 0.5, 0.1, -0.3, 0.95, 0.2, STEEL, { rx: 0.5 }).ball(0.1, -0.3, 1.15, 0.36, MEND, { glow: 2.5, detail: 0 });
    for (const [x, z, ph] of [[-0.5, 0.4, 0], [0.5, 0.4, PI], [-0.5, -0.4, PI], [0.5, -0.4, 0]]) b.box(0.18, 0.2, 0.3, x, 0.1, z, DARK, { swing: 0.1, phase: ph });
  },
  mortar: (b) => {
    b.box(0.32, 0.42, 1.7, -0.58, 0.21, 0, DARK, { swing: 0.05, phase: 0 }).box(0.32, 0.42, 1.7, 0.58, 0.21, 0, DARK, { swing: 0.05, phase: PI });
    b.box(0.95, 0.36, 1.35, 0, 0.52, 0, HULL).box(0.7, 0.3, 0.5, 0, 0.8, -0.42, PLATE).box(0.97, 0.08, 0.3, 0, 0.72, 0.4, TEAM, TG);
    b.cyl(0.22, 0.27, 1.4, 0, 1.15, 0.22, STEEL, { rx: 0.75, seg: 8 }).cyl(0.26, 0.26, 0.1, 0, 1.62, 0.66, AMBER, { rx: 0.75, glow: 1.6, seg: 8 });
    b.box(0.2, 0.2, 0.2, 0.3, 1.0, -0.42, AMBER, { glow: 0.9 });
  },
  aegis: (b) => {
    b.box(0.38, 1.05, 0.5, -0.58, 0.52, 0, DARK, { swing: 0.34, phase: 0 }).box(0.38, 1.05, 0.5, 0.58, 0.52, 0, DARK, { swing: 0.34, phase: PI });
    b.box(1.35, 0.36, 0.75, 0, 1.15, 0, HULL).box(1.55, 0.85, 0.95, 0, 1.75, 0, PLATE).box(0.9, 0.6, 0.4, 0, 1.7, -0.6, DARK);
    b.box(0.42, 0.3, 0.42, 0, 2.33, 0.1, DARK).box(0.3, 0.07, 0.05, 0, 2.36, 0.32, AMBER, { glow: 2.4 });
    b.cyl(0.14, 0.14, 1.1, -1.0, 1.75, 0.45, STEEL, { rx: PI / 2, seg: 6 }).cyl(0.14, 0.14, 1.1, 1.0, 1.75, 0.45, STEEL, { rx: PI / 2, seg: 6 });
    b.box(0.1, 0.1, 0.06, -1.0, 1.75, 1.02, AMBER, { glow: 2 }).box(0.1, 0.1, 0.06, 1.0, 1.75, 1.02, AMBER, { glow: 2 });
    // directional shield plates
    b.box(1.05, 1.35, 0.07, 0, 1.45, 1.12, TEAM, { team: 1, glow: 0.9 });
    b.box(0.6, 1.2, 0.07, -0.78, 1.45, 0.94, TEAM, { team: 1, glow: 0.7, ry: 0.6 }).box(0.6, 1.2, 0.07, 0.78, 1.45, 0.94, TEAM, { team: 1, glow: 0.7, ry: -0.6 });
    b.box(0.5, 0.16, 0.6, -0.9, 2.25, 0, HULL).box(0.5, 0.16, 0.6, 0.9, 2.25, 0, HULL);
  },
  core_relay: (b) => {
    b.cyl(2.85, 3.0, 0.7, 0, 0.35, 0, DARK, { seg: 8 }).cyl(2.15, 2.5, 1.3, 0, 1.3, 0, HULL, { seg: 8 }).cyl(2.2, 2.2, 0.26, 0, 2.05, 0, TEAM, { ...TG, seg: 8 });
    b.cyl(1.0, 1.4, 2.4, 0, 3.3, 0, PLATE, { seg: 6 }).cyl(0.6, 0.9, 0.8, 0, 4.8, 0, HULL, { seg: 6 }).cyl(0.1, 0.24, 1.5, 0, 5.9, 0, STEEL, { seg: 5 });
    b.ball(0.26, 0, 6.75, 0, AMBER, { glow: 3, detail: 0 });
    for (let i = 0; i < 4; i++) {
      const a = (i * PI) / 2 + PI / 4;
      b.box(0.9, 1.7, 1.3, Math.sin(a) * 2.25, 1.1, Math.cos(a) * 2.25, DARK, { ry: a }).box(0.5, 0.14, 0.1, Math.sin(a) * 2.25, 1.5, Math.cos(a) * 2.25, AMBER, { ry: a, glow: 1.8, sz: 14 });
    }
    b.cyl(0.95, 0.2, 0.2, 1.25, 4.3, 0.4, PLATE, { rz: -0.6, seg: 10 }).box(1.3, 1.1, 0.12, 0, 0.9, 2.52, AMBER, { glow: 0.8 });
  },
  grid_pylon: (b) => {
    b.cyl(0.78, 0.92, 0.3, 0, 0.15, 0, DARK, { seg: 6 });
    for (let i = 0; i < 3; i++) { const a = (i * 2 * PI) / 3; b.box(0.12, 1.3, 0.12, Math.sin(a) * 0.45, 0.8, Math.cos(a) * 0.45, HULL, { rx: -0.45 * Math.cos(a), rz: 0.45 * Math.sin(a) }); }
    b.cyl(0.13, 0.22, 3.1, 0, 1.8, 0, STEEL, { seg: 6 });
    b.cyl(0.44, 0.44, 0.14, 0, 1.7, 0, TEAM, { ...TG, seg: 8 }).cyl(0.4, 0.4, 0.14, 0, 2.3, 0, AMBER, { glow: 1.8, seg: 8 }).cyl(0.34, 0.34, 0.14, 0, 2.9, 0, TEAM, { ...TG, seg: 8 });
    b.ball(0.2, 0, 3.5, 0, AMBER, { glow: 3, detail: 0 });
  },
  assembly_bay: (b) => {
    b.box(3.8, 0.3, 3.8, 0, 0.15, 0, DARK).box(3.4, 1.8, 2.6, 0, 1.2, -0.4, HULL).box(3.55, 0.3, 2.85, 0, 2.3, -0.4, PLATE, { rx: 0.1 });
    b.box(1.9, 1.35, 0.1, 0, 0.98, 0.92, AMBER, { glow: 0.9 }).box(3.45, 0.24, 0.12, 0, 1.92, 0.92, TEAM, TG);
    b.box(0.2, 2.7, 0.2, 1.55, 1.65, 1.5, STEEL).box(1.7, 0.18, 0.18, 0.8, 2.9, 1.5, STEEL).box(0.12, 0.6, 0.12, 0.2, 2.55, 1.5, DARK);
    b.cyl(0.26, 0.3, 1.2, -1.1, 2.9, -1.2, DARK, { seg: 6 }).cyl(0.26, 0.3, 0.9, -0.4, 2.75, -1.2, DARK, { seg: 6 });
    b.box(0.5, 0.5, 0.5, -1.5, 0.55, 1.4, PLATE).box(0.16, 0.16, 0.16, -1.5, 0.9, 1.4, AMBER, { glow: 2 });
  },
  signal_foundry: (b) => {
    b.box(3.6, 0.6, 3.6, 0, 0.3, 0, DARK).cyl(1.25, 1.55, 2.0, 0, 1.6, 0, HULL, { seg: 8 }).cyl(1.3, 1.3, 0.22, 0, 2.2, 0, TEAM, { ...TG, seg: 8 });
    b.torus(1.75, 0.11, 0, 2.75, 0, AMBER, { glow: 2, seg: 18, rz: 0.18 });
    b.cyl(0.1, 0.18, 2.3, 0, 3.7, 0, STEEL, { seg: 5 }).cyl(1.05, 0.2, 0.22, 0, 3.4, 0.2, PLATE, { rx: 0.6, seg: 12 }).ball(0.16, 0, 4.9, 0, AMBER, { glow: 3, detail: 0 });
    for (const [x, z] of [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3]]) b.cyl(0.28, 0.34, 1.5, x, 1.3, z, PLATE, { seg: 6 }).cyl(0.2, 0.2, 0.1, x, 2.1, z, AMBER, { glow: 1.4, seg: 6 });
  },
  sentry_arc: (b) => {
    b.cyl(0.82, 0.98, 0.5, 0, 0.25, 0, DARK, { seg: 8 }).cyl(0.45, 0.62, 0.95, 0, 0.95, 0, HULL, { seg: 6 }).cyl(0.5, 0.5, 0.12, 0, 0.75, 0, TEAM, { ...TG, seg: 6 });
    b.box(0.95, 0.42, 0.62, 0, 1.62, 0, PLATE).box(0.1, 0.95, 0.1, -0.32, 2.2, 0.2, STEEL, { rx: 0.3 }).box(0.1, 0.95, 0.1, 0.32, 2.2, 0.2, STEEL, { rx: 0.3 });
    b.ball(0.17, 0, 2.45, 0.36, AMBER, { glow: 3.2, detail: 0 });
  },
  flux_tap: (b) => {
    b.cyl(0.95, 1.0, 0.3, 0, 0.15, 0, DARK, { seg: 8 }).cyl(0.72, 0.72, 0.12, 0, 0.42, 0, TEAM, { ...TG, seg: 10 }).cyl(0.6, 0.6, 1.3, 0, 1.1, 0, FLUX_COLOR, { glow: 0.7, seg: 10 });
    b.cyl(0.7, 0.7, 0.2, 0, 1.85, 0, HULL, { seg: 10 }).box(0.16, 1.5, 0.16, 0.78, 0.9, 0, STEEL).box(0.16, 1.5, 0.16, -0.78, 0.9, 0, STEEL).box(1.7, 0.14, 0.14, 0, 1.7, 0, STEEL);
    b.cyl(0.12, 0.12, 0.5, 0, 2.2, 0, DARK, { seg: 5 });
  },
  // ------------------------------------------------------------ Verdant Chorus
  tender: (b) => {
    b.ball(0.42, 0, 0.5, 0, BARK, { sy: 0.72, sz: 1.2 }).ball(0.22, 0, 0.6, 0.48, FLESH).ball(0.15, 0.18, 0.74, -0.3, MEMB, { glow: 1.8, detail: 0 }).ball(0.15, -0.18, 0.74, -0.3, MEMB, { glow: 1.8, detail: 0 });
    for (const [x, z, ph] of [[-0.3, 0.3, 0], [0.3, 0.3, PI], [-0.3, -0.3, PI], [0.3, -0.3, 0]]) b.cone(0.09, 0.46, x, 0.23, z, ROOT, { rx: PI, swing: 0.16, phase: ph });
    b.cone(0.32, 0.14, 0, 0.84, -0.05, TEAM, { ...TG, seg: 5 }).cone(0.05, 0.35, 0.1, 0.72, 0.68, SPINE, { rx: 1.2 }).cone(0.05, 0.35, -0.1, 0.72, 0.68, SPINE, { rx: 1.2 });
  },
  glimmerwing: (b) => {
    b.ball(0.28, 0, 0.3, 0, FLESH, { sz: 1.4 }).cyl(0.31, 0.31, 0.07, 0, 0.3, 0, TEAM, { team: 1, glow: 1.2, seg: 8 }).cone(0.1, 0.6, 0, 0.3, -0.6, BARK, { rx: -PI / 2 });
    b.box(0.95, 0.03, 0.4, -0.62, 0.44, 0.15, MEMB, { rz: -0.35, glow: 1.3, swing: 0.1, phase: 0 }).box(0.95, 0.03, 0.4, 0.62, 0.44, 0.15, MEMB, { rz: 0.35, glow: 1.3, swing: 0.1, phase: 0 });
    b.box(0.7, 0.03, 0.3, -0.5, 0.36, -0.3, MEMB, { rz: -0.2, glow: 1.0, swing: 0.1, phase: PI }).box(0.7, 0.03, 0.3, 0.5, 0.36, -0.3, MEMB, { rz: 0.2, glow: 1.0, swing: 0.1, phase: PI });
    b.ball(0.09, 0, 0.36, 0.42, VIOLET, { glow: 3, detail: 0 });
  },
  thornling: (b) => {
    b.ball(0.36, 0, 0.4, 0, BARK, { sy: 0.62, sz: 1.5 }).cone(0.2, 0.5, 0, 0.4, 0.62, FLESH, { rx: PI / 2, seg: 5 });
    for (let i = 0; i < 5; i++) b.cone(0.08, 0.42, (i % 2 ? 0.1 : -0.1), 0.72, 0.35 - i * 0.2, SPINE, { rx: -0.55 });
    b.cone(0.11, 0.5, 0, 0.82, -0.05, TEAM, { ...TG, rx: -0.4 });
    for (const [x, z, ph] of [[-0.3, 0.3, 0], [0.3, 0.3, PI], [-0.3, -0.35, PI], [0.3, -0.35, 0]]) b.cone(0.08, 0.42, x, 0.21, z, ROOT, { rx: PI, swing: 0.24, phase: ph });
    b.cone(0.05, 0.3, 0.16, 0.36, 0.86, SPINE, { rx: 1.3 }).cone(0.05, 0.3, -0.16, 0.36, 0.86, SPINE, { rx: 1.3 });
  },
  sporecaster: (b) => {
    for (let i = 0; i < 3; i++) { const a = (i * 2 * PI) / 3 + PI; b.cone(0.09, 0.8, Math.sin(a) * 0.36, 0.38, Math.cos(a) * 0.36, ROOT, { rx: PI + 0.35 * Math.cos(a), rz: -0.35 * Math.sin(a), swing: 0.18, phase: i * 2.1 }); }
    b.ball(0.42, 0, 0.98, 0, BARK, { sy: 1.2 }).cyl(0.44, 0.44, 0.08, 0, 0.74, 0, TEAM, { ...TG, seg: 8 });
    b.cyl(0.17, 0.25, 0.75, 0, 1.38, 0.36, FLESH, { rx: 1.0, seg: 6 }).ball(0.15, 0, 1.58, 0.68, MEMB, { glow: 2.4, detail: 0 });
    b.ball(0.13, 0.34, 1.2, -0.1, MEMB, { glow: 1.6, detail: 0 }).ball(0.13, -0.34, 1.2, -0.1, MEMB, { glow: 1.6, detail: 0 }).ball(0.12, 0, 1.45, -0.3, MEMB, { glow: 1.6, detail: 0 });
  },
  carapace: (b) => {
    b.ball(0.85, 0, 0.6, 0, BARK, { sy: 0.78, sz: 1.15 }).ball(0.7, 0, 0.82, 0.3, BARK2, { sy: 0.6, sz: 0.8 }).ball(0.72, 0, 0.84, -0.32, BARK2, { sy: 0.62, sz: 0.85 });
    b.ball(0.3, 0, 0.45, 0.98, FLESH).cone(0.1, 0.45, 0, 0.62, 1.2, SPINE, { rx: 1.1 }).box(0.14, 0.14, 1.3, 0, 1.3, 0, TEAM, TG);
    for (let i = 0; i < 3; i++) for (const sx of [-1, 1]) b.cone(0.1, 0.45, sx * 0.72, 0.22, 0.55 - i * 0.55, ROOT, { rx: PI, swing: 0.16, phase: (i + (sx > 0 ? 1 : 0)) * PI });
    b.ball(0.1, 0.12, 0.52, 1.22, MEMB, { glow: 2.2, detail: 0 }).ball(0.1, -0.12, 0.52, 1.22, MEMB, { glow: 2.2, detail: 0 });
  },
  sage: (b) => {
    for (let i = 0; i < 3; i++) { const a = (i * 2 * PI) / 3; b.cone(0.09, 0.6, Math.sin(a) * 0.3, 0.28, Math.cos(a) * 0.3, ROOT, { rx: PI + 0.4 * Math.cos(a), rz: -0.4 * Math.sin(a), swing: 0.14, phase: i * 2.1 }); }
    b.cyl(0.1, 0.2, 1.2, 0, 0.9, 0, BARK, { seg: 6 }).cyl(0.26, 0.26, 0.08, 0, 1.05, 0, TEAM, { ...TG, seg: 8 });
    for (let i = 0; i < 6; i++) { const a = (i * PI) / 3; b.cone(0.15, 0.65, Math.sin(a) * 0.32, 1.72, Math.cos(a) * 0.32, MEMB, { rx: 0.75 * Math.cos(a), rz: -0.75 * Math.sin(a), glow: 1.2, seg: 4 }); }
    b.ball(0.23, 0, 1.6, 0, FLESH, { glow: 0.9 }).ball(0.09, 0.5, 2.0, 0.1, VIOLET, { glow: 3, detail: 0 }).ball(0.09, -0.45, 1.9, -0.2, VIOLET, { glow: 3, detail: 0 });
  },
  stag: (b) => {
    for (const [x, z, ph] of [[-0.36, 0.52, 0], [0.36, 0.52, PI], [-0.36, -0.52, PI], [0.36, -0.52, 0]]) b.cyl(0.07, 0.1, 1.15, x, 0.57, z, ROOT, { seg: 5, swing: 0.32, phase: ph });
    b.ball(0.5, 0, 1.25, 0, BARK, { sx: 0.82, sy: 0.72, sz: 1.6 }).box(0.52, 0.1, 0.75, 0, 1.6, -0.05, TEAM, TG);
    b.cyl(0.14, 0.2, 0.8, 0, 1.65, 0.78, BARK2, { rx: 0.7, seg: 6 }).ball(0.23, 0, 1.98, 1.05, FLESH, { sz: 1.3 });
    for (const sx of [-1, 1]) {
      b.cyl(0.04, 0.07, 1.0, sx * 0.34, 2.4, 0.95, SPINE, { rz: -sx * 0.55, rx: -0.2, glow: 0.5, seg: 5 }).cyl(0.03, 0.05, 0.6, sx * 0.62, 2.55, 0.75, SPINE, { rz: -sx * 1.0, glow: 0.5, seg: 5 });
      b.ball(0.1, sx * 0.6, 2.84, 0.86, MEMB, { glow: 3, detail: 0 }).ball(0.08, sx * 0.9, 2.7, 0.75, MEMB, { glow: 3, detail: 0 });
    }
  },
  crownbeast: (b) => {
    b.ball(1.1, 0, 1.25, 0, BARK, { sy: 0.8, sz: 1.3 }).ball(0.82, 0, 1.85, -0.35, 0x24473d, { sy: 0.8 }).ball(0.5, 0, 1.25, 1.35, FLESH, { sz: 1.15 });
    b.torus(0.6, 0.11, 0, 1.3, 1.02, TEAM, { ...TG, rx: PI / 2, seg: 12 });
    for (let i = 0; i < 5; i++) { const a = (i - 2) * 0.45; b.cone(0.13, 0.95, Math.sin(a) * 0.5, 2.0, 1.25 + Math.cos(a) * 0.12, SPINE, { rz: -a * 0.9, rx: 0.25, glow: 0.5, seg: 5 }); }
    for (const [x, z, ph] of [[-0.82, 0.62, 0], [0.82, 0.62, PI], [-0.72, -0.72, PI], [0.72, -0.72, 0]]) b.cyl(0.3, 0.2, 1.2, x, 0.6, z, ROOT, { seg: 6, swing: 0.3, phase: ph });
    for (let i = 0; i < 3; i++) b.ball(0.2, 0, 2.3 - i * 0.12, -0.2 - i * 0.5, MEMB, { glow: 2, detail: 0 });
    b.ball(0.1, 0.2, 1.42, 1.78, VIOLET, { glow: 3, detail: 0 }).ball(0.1, -0.2, 1.42, 1.78, VIOLET, { glow: 3, detail: 0 });
  },
  heartgrove: (b) => {
    b.cyl(1.6, 2.6, 3.2, 0, 1.6, 0, BARK, { seg: 8 }).cyl(1.95, 1.95, 0.26, 0, 3.1, 0, TEAM, { ...TG, seg: 10 });
    for (let i = 0; i < 6; i++) { const a = (i * PI) / 3 + 0.3; b.cone(0.7, 3.0, Math.sin(a) * 2.2, 0.45, Math.cos(a) * 2.2, ROOT, { rx: 1.25 * Math.cos(a), rz: -1.25 * Math.sin(a), seg: 5 }); }
    b.ball(2.7, 0, 4.2, 0, 0x2f6a58, { sy: 0.42 }).ball(1.9, 0, 5.0, 0, BARK2, { sy: 0.5 }).ball(0.9, 0, 5.7, 0, 0x4d8a75, { sy: 0.6 });
    b.ball(0.85, 0, 2.0, 1.75, MEMB, { glow: 1.1 });
    for (let i = 0; i < 5; i++) { const a = (i * 2 * PI) / 5; b.ball(0.3, Math.sin(a) * 2.3, 3.55, Math.cos(a) * 2.3, MEMB, { glow: 1.0, detail: 0, sy: 1.4 }); }
  },
  root_node: (b) => {
    b.ball(0.72, 0, 0.45, 0, BARK, { sy: 0.8 });
    for (let i = 0; i < 3; i++) { const a = (i * 2 * PI) / 3; b.cone(0.22, 1.2, Math.sin(a) * 0.7, 0.2, Math.cos(a) * 0.7, ROOT, { rx: 1.3 * Math.cos(a), rz: -1.3 * Math.sin(a), seg: 5 }); b.cone(0.3, 0.7, Math.sin(a + 1) * 0.3, 2.15, Math.cos(a + 1) * 0.3, TEAM, { ...TG, rx: 1.0 * Math.cos(a + 1), rz: -1.0 * Math.sin(a + 1), seg: 4 }); }
    b.cyl(0.12, 0.22, 1.7, 0, 1.6, 0, ROOT, { seg: 6 }).ball(0.38, 0, 2.65, 0, MEMB, { glow: 1.1 });
  },
  brood_hollow: (b) => {
    b.ball(2.0, 0, 0.5, 0, BARK, { sy: 0.75 }).ball(1.3, 0.2, 1.6, -0.3, BARK2, { sy: 0.7 });
    for (const [x, z] of [[0, 1.75], [-1.3, 1.2], [1.3, 1.2]]) b.ball(0.62, x, 0.7, z, 0x0e1716, { sy: 1.1 });
    for (let i = 0; i < 5; i++) { const a = (i * 2 * PI) / 5 + 0.5; b.ball(0.4, Math.sin(a) * 1.25, 1.75, Math.cos(a) * 1.25 - 0.2, MEMB, { glow: 0.75, sy: 1.25 }); }
    for (let i = 0; i < 3; i++) b.cone(0.22, 1.1, (i - 1) * 0.5, 2.75, -0.3, TEAM, { ...TG, rz: -(i - 1) * 0.4, seg: 5 });
    for (let i = 0; i < 6; i++) { const a = (i * PI) / 3; b.cone(0.3, 1.6, Math.sin(a) * 1.75, 0.3, Math.cos(a) * 1.75, ROOT, { rx: 1.3 * Math.cos(a), rz: -1.3 * Math.sin(a), seg: 5 }); }
  },
  memory_bloom: (b) => {
    b.ball(1.4, 0, 0.35, 0, BARK, { sy: 0.55 }).cyl(0.3, 0.55, 2.7, 0, 1.8, 0, ROOT, { seg: 6 });
    for (let i = 0; i < 5; i++) { const a = (i * 2 * PI) / 5; b.cone(0.3, 1.0, Math.sin(a) * 0.55, 2.5, Math.cos(a) * 0.55, TEAM, { ...TG, rx: 1.1 * Math.cos(a), rz: -1.1 * Math.sin(a), seg: 4 }); }
    b.cyl(1.9, 0.6, 0.3, 0, 3.3, 0, MEMB, { glow: 0.5, seg: 10 }).cyl(1.15, 0.4, 0.3, 0, 3.62, 0, FLESH, { glow: 0.3, seg: 10 }).ball(0.46, 0, 3.95, 0, VIOLET, { glow: 1.6 });
    for (let i = 0; i < 4; i++) { const a = (i * PI) / 2 + 0.4; b.ball(0.16, Math.sin(a) * 1.6, 4.3, Math.cos(a) * 1.6, MEMB, { glow: 3, detail: 0 }); }
  },
  needle_pod: (b) => {
    b.ball(0.8, 0, 0.8, 0, BARK, { sy: 1.1 }).cyl(0.4, 0.52, 0.16, 0, 1.6, 0, FLESH, { seg: 8 }).ball(0.2, 0, 1.72, 0, MEMB, { glow: 2.6, detail: 0 });
    for (let i = 0; i < 7; i++) { const a = (i * 2 * PI) / 7; b.cone(0.07, 0.95, Math.sin(a) * 0.5, 1.95, Math.cos(a) * 0.5, SPINE, { rx: 0.5 * Math.cos(a), rz: -0.5 * Math.sin(a), glow: 0.4, seg: 4 }); }
    for (let i = 0; i < 3; i++) { const a = (i * 2 * PI) / 3; b.box(0.08, 0.7, 0.5, Math.sin(a) * 0.78, 0.7, Math.cos(a) * 0.78, TEAM, { ...TG, ry: a }); }
  },
  flux_bulb: (b) => {
    b.torus(0.82, 0.2, 0, 0.22, 0, ROOT, { seg: 10 }).torus(0.6, 0.16, 0, 0.55, 0, BARK, { seg: 10 }).cyl(0.52, 0.52, 0.1, 0, 0.75, 0, TEAM, { ...TG, seg: 8 });
    b.ball(0.66, 0, 1.3, 0, FLUX_COLOR, { sy: 1.2, glow: 0.7 });
    for (let i = 0; i < 4; i++) { const a = (i * PI) / 2 + 0.6; b.cone(0.1, 1.4, Math.sin(a) * 0.6, 1.2, Math.cos(a) * 0.6, BARK2, { rx: -0.25 * Math.cos(a), rz: 0.25 * Math.sin(a), seg: 4 }); }
  },
  // ------------------------------------------------------------ neutral
  ore: (b) => {
    b.ball(0.9, 0, 0.05, 0, 0x1a2228, { sy: 0.35, detail: 0 });
    const cr: [number, number, number, number, number, number][] = [[0, 0, 1.0, 0, 0, 1.9], [0.45, 0.2, 0.7, 0.35, 0.3, 1.5], [-0.42, 0.25, 0.65, -0.3, -0.35, 1.4], [0.1, -0.5, 0.6, 0.2, -0.4, 1.3], [-0.2, 0.55, 0.5, -0.45, 0.2, 1.1]];
    for (const [x, z, r, rx, rz, sy] of cr) b.octa(r * 0.5, x, sy * r * 0.42, z, ORE_COLOR, { rx, rz, sy: sy * 1.1, glow: 0.85 });
  },
  vent: (b) => {
    b.cyl(1.0, 1.25, 0.26, 0, 0.13, 0, 0x23262c, { seg: 10 }).cyl(0.72, 0.72, 0.08, 0, 0.26, 0, FLUX_COLOR, { glow: 1.1, seg: 10 });
    for (let i = 0; i < 3; i++) { const a = (i * 2 * PI) / 3; b.cone(0.14, 0.6, Math.sin(a) * 0.95, 0.4, Math.cos(a) * 0.95, 0x343943, { rx: 0.3 * Math.cos(a), rz: -0.3 * Math.sin(a), seg: 4 }); }
  },
  watch_pylon: (b) => {
    b.box(1.7, 0.4, 1.7, 0, 0.2, 0, 0x3a3f4a).cyl(0.26, 0.58, 4.0, 0, 2.4, 0, 0x8f97a3, { seg: 4 }).torus(0.9, 0.1, 0, 3.2, 0, TEAM, { team: 1, glow: 1.6, seg: 14 });
    b.octa(0.36, 0, 4.85, 0, TEAM, { team: 1, glow: 2.4, sy: 1.5 });
    for (const [x, z] of [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]]) b.box(0.2, 0.7, 0.2, x, 0.55, z, 0x565d6b);
  },
  barrier: (b) => {
    for (let i = 0; i < 9; i++) {
      const x = (i - 4) * 0.82, r = 0.62 + ((i * 37) % 5) * 0.09;
      b.octa(r, x, r * 1.35, ((i * 13) % 3) * 0.3 - 0.3, 0x8ff0e6, { sy: 2.3 + ((i * 7) % 4) * 0.25, rz: (((i * 29) % 7) - 3) * 0.09, rx: (((i * 17) % 5) - 2) * 0.1, glow: 0.55 });
    }
    b.box(7.6, 0.4, 1.6, 0, 0.1, 0, 0x1f262c);
  },
  pod: (b) => {
    b.cyl(0.42, 0.42, 0.9, 0, 0.48, 0, 0x9aa3b0, { rz: PI / 2, seg: 8 }).cyl(0.45, 0.45, 0.16, 0, 0.48, 0, 0xffd27a, { rz: PI / 2, glow: 1.6, seg: 8 });
    b.cyl(0.03, 0.03, 0.7, 0.2, 1.1, 0, 0x565d6b, { seg: 4 }).ball(0.1, 0.2, 1.5, 0, 0xffd27a, { glow: 3.5, detail: 0 }).box(1.1, 0.12, 0.7, 0, 0.06, 0, 0x2b3038);
  },
  // ------------------------------------------------------------ helpers (not entities)
  spike: (b) => {
    b.cone(0.16, 1.5, 0, 0.75, 0, STEEL, { seg: 4 }).ball(0.16, 0, 1.65, 0, TEAM, { team: 1, glow: 3, detail: 0 }).torus(0.4, 0.04, 0, 1.2, 0, TEAM, { team: 1, glow: 2, seg: 10 });
  },
  cargo: (b) => { b.octa(0.22, 0, 0, 0, TEAM, { team: 1, glow: 1.4, sy: 1.4 }); },
};

const cache = new Map<string, THREE.BufferGeometry>();

export function modelGeometry(id: string): THREE.BufferGeometry {
  let g = cache.get(id);
  if (!g) {
    const b = new GB();
    (MODELS[id] ?? MODELS.pod)(b);
    g = b.build();
    cache.set(id, g);
  }
  return g;
}

export function hasModel(id: string): boolean { return !!MODELS[id]; }
