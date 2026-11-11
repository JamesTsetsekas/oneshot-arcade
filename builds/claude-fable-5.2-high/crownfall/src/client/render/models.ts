// client-renderer: procedural, original low-poly models for heroes, monsters, structures and
// wards. Models face +X locally (rotation.y = sim facing). Animation is purely presentational and
// driven from the anim code / timing the simulation publishes.

import * as THREE from 'three';
import type { HeroId } from '../../shared/heroes';
import { HEROES } from '../../shared/heroes';
import { ANIM, ST } from '../../shared/protocol';
import { withFog } from './terrain';

export const TEAM_COLORS = { ally: 0x4aa8ff, enemy: 0xff5f4a, neutral: 0xe2c66a, allyCb: 0x3d8bff, enemyCb: 0xffb000 };

export function relColor(team: number, viewer: number, colorblind: boolean): number {
  if (team === 2) return TEAM_COLORS.neutral;
  if (team === viewer) return colorblind ? TEAM_COLORS.allyCb : TEAM_COLORS.ally;
  return colorblind ? TEAM_COLORS.enemyCb : TEAM_COLORS.enemy;
}

const matCache = new Map<string, THREE.Material>();
function lam(color: number, flat = true): THREE.MeshLambertMaterial {
  const k = `l${color}${flat}`;
  let m = matCache.get(k);
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color, flatShading: flat });
    matCache.set(k, m);
  }
  return m as THREE.MeshLambertMaterial;
}
function glow(color: number, opacity = 1): THREE.MeshBasicMaterial {
  const k = `g${color}${opacity}`;
  let m = matCache.get(k);
  if (!m) {
    m = new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, depthWrite: opacity >= 1 });
    matCache.set(k, m);
  }
  return m as THREE.MeshBasicMaterial;
}

const G = {
  box: new THREE.BoxGeometry(1, 1, 1),
  sph: new THREE.IcosahedronGeometry(1, 1),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 10),
  cyl6: new THREE.CylinderGeometry(1, 1, 1, 6),
  cone: new THREE.ConeGeometry(1, 1, 8),
  cone4: new THREE.ConeGeometry(1, 1, 4),
  oct: new THREE.OctahedronGeometry(1, 0),
  tor: new THREE.TorusGeometry(1, 0.08, 6, 28),
  torThick: new THREE.TorusGeometry(1, 0.16, 8, 28),
  plane: new THREE.PlaneGeometry(1, 1),
  ring: new THREE.RingGeometry(0.86, 1, 40),
  disc: new THREE.CircleGeometry(1, 32),
};

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, sx: number, sy: number, sz: number, x = 0, y = 0, z = 0, shadow = true): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  m.scale.set(sx, sy, sz);
  m.position.set(x, y, z);
  m.castShadow = shadow;
  return m;
}
const box = (c: number, sx: number, sy: number, sz: number, x = 0, y = 0, z = 0): THREE.Mesh => mesh(G.box, lam(c), sx, sy, sz, x, y, z);
const sph = (c: number, r: number, x = 0, y = 0, z = 0): THREE.Mesh => mesh(G.sph, lam(c), r, r, r, x, y, z);
const cyl = (c: number, r: number, h: number, x = 0, y = 0, z = 0, geo = G.cyl): THREE.Mesh => mesh(geo, lam(c), r, h, r, x, y, z);
const cone = (c: number, r: number, h: number, x = 0, y = 0, z = 0, geo = G.cone): THREE.Mesh => mesh(geo, lam(c), r, h, r, x, y, z);
const lit = (c: number, geo: THREE.BufferGeometry, sx: number, sy: number, sz: number, x = 0, y = 0, z = 0, op = 1): THREE.Mesh => mesh(geo, glow(c, op), sx, sy, sz, x, y, z, false);

function pivot(x: number, y: number, z: number, ...kids: THREE.Object3D[]): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  for (const k of kids) g.add(k);
  return g;
}

export interface Rig {
  root: THREE.Group;
  body: THREE.Group;
  armR: THREE.Group | null;
  armL: THREE.Group | null;
  legL: THREE.Group | null;
  legR: THREE.Group | null;
  tail: THREE.Group | null;
  wings: THREE.Object3D[];
  spin: THREE.Object3D[];
  ring: THREE.Mesh | null;
  height: number;
  floats: boolean;
  phase: number;
}

function groundRing(color: number, r: number, self = false): THREE.Mesh {
  const m = new THREE.Mesh(G.ring, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: self ? 0.95 : 0.8, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.scale.setScalar(r);
  m.position.y = 0.05;
  m.renderOrder = 2;
  return m;
}

function baseRig(height: number, floats = false): Rig {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  return { root, body, armR: null, armL: null, legL: null, legR: null, tail: null, wings: [], spin: [], ring: null, height, floats, phase: Math.random() * 6.28 };
}

function legs(rig: Rig, color: number, hipY: number, spread: number, w = 0.24): void {
  rig.legL = pivot(0, hipY, -spread, box(color, w, hipY, w + 0.04, 0, -hipY / 2, 0));
  rig.legR = pivot(0, hipY, spread, box(color, w, hipY, w + 0.04, 0, -hipY / 2, 0));
  rig.root.add(rig.legL, rig.legR);
}

// ---- heroes -----------------------------------------------------------------------------------

function buildBrannoch(): Rig {
  const r = baseRig(3.0);
  const stone = 0x9c968a;
  const brass = 0xc9a25a;
  legs(r, 0x6f6a60, 0.85, 0.32, 0.36);
  r.body.add(box(stone, 0.85, 1.05, 1.25, 0, 1.45, 0), box(brass, 0.2, 0.7, 0.9, 0.42, 1.5, 0), box(0xe9e2cc, 0.75, 0.5, 0.62, 0, 2.05, -0.82), box(0xe9e2cc, 0.75, 0.5, 0.62, 0, 2.05, 0.82));
  r.body.add(box(brass, 0.46, 0.44, 0.46, 0.05, 2.28, 0), lit(0x8fd0ff, G.box, 0.08, 0.1, 0.3, 0.29, 2.3, 0));
  const hammer = new THREE.Group();
  hammer.add(cyl(0x5b4a3a, 0.07, 1.9, 0.45, -0.5, 0), box(0xb9b3a4, 0.62, 0.62, 0.95, 0.45, 0.55, 0), lit(0x8fd0ff, G.box, 0.66, 0.16, 0.5, 0.45, 0.55, 0), box(brass, 0.7, 0.12, 1.0, 0.45, 0.2, 0));
  hammer.rotation.z = -0.5;
  r.armR = pivot(0.05, 1.85, 0.8, box(stone, 0.3, 0.85, 0.3, 0, -0.4, 0), hammer);
  hammer.position.set(0, -0.75, 0);
  r.armL = pivot(0.05, 1.85, -0.8, box(stone, 0.3, 0.85, 0.3, 0, -0.4, 0), box(brass, 0.36, 0.3, 0.36, 0, -0.85, 0));
  r.body.add(r.armR, r.armL);
  return r;
}

function buildSuri(): Rig {
  const r = baseRig(2.5);
  const coat = 0xd9642a;
  legs(r, 0x3b3550, 0.8, 0.17, 0.2);
  r.body.add(box(coat, 0.42, 0.75, 0.62, 0, 1.25, 0), box(0xffd27a, 0.1, 0.5, 0.5, 0.22, 1.3, 0), box(0x6b4a2f, 0.3, 0.4, 0.26, -0.18, 0.95, 0.4));
  r.body.add(sph(0xe9b98f, 0.25, 0.02, 1.9, 0), box(0x3b3550, 0.3, 0.14, 0.52, 0.02, 2.03, 0), lit(0xffb347, G.cyl, 0.07, 0.06, 0.07, 0.24, 1.93, 0.11), lit(0xffb347, G.cyl, 0.07, 0.06, 0.07, 0.24, 1.93, -0.11));
  const scarf = pivot(-0.2, 1.7, 0, box(0xffe0a0, 0.95, 0.07, 0.22, -0.5, 0, 0), box(0xffb347, 0.5, 0.06, 0.18, -1.15, -0.06, 0.03));
  r.tail = scarf;
  r.body.add(scarf);
  const bow = new THREE.Group();
  bow.add(box(0x5b4a3a, 0.9, 0.12, 0.14, 0.35, 0, 0), box(0xcfc7b0, 0.1, 0.08, 1.0, 0.72, 0, 0), lit(0xff7a2a, G.sph, 0.11, 0.11, 0.11, 0.86, 0.02, 0));
  r.armR = pivot(0.05, 1.55, 0.38, box(coat, 0.17, 0.6, 0.17, 0, -0.28, 0), bow);
  bow.position.set(0.1, -0.55, 0);
  r.armL = pivot(0.05, 1.55, -0.38, box(coat, 0.17, 0.6, 0.17, 0, -0.28, 0));
  r.armR.rotation.z = 1.1;
  r.body.add(r.armR, r.armL);
  return r;
}

function buildOru(): Rig {
  const r = baseRig(2.7, true);
  const robe = 0x5f8f8a;
  r.body.add(cone(robe, 0.62, 1.7, 0, 1.15, 0), cone(0x3d6360, 0.7, 0.5, 0, 0.45, 0), sph(0xf3e6a8, 0.24, 0.05, 2.02, 0), cone(0x3d6360, 0.36, 0.6, -0.03, 2.2, 0));
  r.body.add(lit(0xfff3b8, G.sph, 0.1, 0.1, 0.1, 0.22, 2.02, 0.09), lit(0xfff3b8, G.sph, 0.1, 0.1, 0.1, 0.22, 2.02, -0.09));
  const wingMat = new THREE.MeshBasicMaterial({ color: 0x9be7d8, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false });
  for (const side of [-1, 1]) {
    for (const up of [0, 1]) {
      const w = new THREE.Mesh(G.plane, wingMat);
      w.scale.set(0.95 - up * 0.25, 1.2 - up * 0.4, 1);
      w.position.set(-0.45, 0.25, 0);
      w.rotation.y = Math.PI / 2;
      const p = pivot(-0.25, 1.75 - up * 0.45, side * 0.18, w);
      p.userData.side = side;
      p.userData.up = up;
      w.rotation.set(0, 0, 0);
      w.position.set(-0.3, 0.3 - up * 0.5, side * 0.55);
      w.rotation.x = Math.PI / 2 - 0.5 * side;
      r.wings.push(p);
      r.body.add(p);
    }
  }
  const lantern = new THREE.Group();
  lantern.add(lit(0xfff0a0, G.sph, 0.2, 0.24, 0.2, 0, 0, 0), lit(0xfff0a0, G.sph, 0.36, 0.4, 0.36, 0, 0, 0, 0.25), box(0x8a6d3a, 0.06, 0.5, 0.06, 0, 0.36, 0));
  r.armR = pivot(0.2, 1.55, 0.42, box(robe, 0.16, 0.5, 0.16, 0.15, -0.15, 0), lantern);
  lantern.position.set(0.45, -0.45, 0);
  r.armR.rotation.z = 0.5;
  r.armL = pivot(0.2, 1.55, -0.42, box(robe, 0.16, 0.5, 0.16, 0.1, -0.2, 0));
  r.body.add(r.armR, r.armL);
  for (let i = 0; i < 3; i++) {
    const moth = lit(0xf3e6a8, G.oct, 0.09, 0.05, 0.14, 0.8, 1.4 + i * 0.35, 0);
    const p = pivot(0, 0, 0, moth);
    p.rotation.y = i * 2.1;
    p.userData.speed = 1.6 + i * 0.5;
    r.spin.push(p);
    r.root.add(p);
  }
  return r;
}

function buildKesh(): Rig {
  const r = baseRig(2.5);
  const scale = 0x4f8a45;
  const belly = 0xc9e27a;
  legs(r, 0x3c6b38, 0.7, 0.3, 0.3);
  const torso = pivot(0, 0.75, 0, box(scale, 0.75, 0.95, 0.85, 0.12, 0.45, 0), box(belly, 0.2, 0.75, 0.6, 0.48, 0.42, 0));
  torso.rotation.z = -0.38;
  const head = pivot(0.5, 1.05, 0, box(scale, 0.75, 0.36, 0.5, 0.25, 0.1, 0), box(0x3c6b38, 0.6, 0.14, 0.44, 0.3, -0.14, 0), lit(0xffe14a, G.sph, 0.07, 0.07, 0.07, 0.38, 0.2, 0.2), lit(0xffe14a, G.sph, 0.07, 0.07, 0.07, 0.38, 0.2, -0.2));
  torso.add(head);
  for (let i = 0; i < 4; i++) torso.add(cone(0x2f5a2c, 0.11, 0.42, -0.3, 0.2 + i * 0.27, 0, G.cone4));
  r.body.add(torso);
  const tail = pivot(-0.3, 0.8, 0, box(scale, 0.7, 0.3, 0.34, -0.35, 0, 0));
  const t2 = pivot(-0.7, 0, 0, box(scale, 0.6, 0.22, 0.24, -0.3, 0, 0), box(0x2f5a2c, 0.4, 0.14, 0.14, -0.75, 0, 0));
  tail.add(t2);
  tail.rotation.z = 0.25;
  r.tail = tail;
  r.body.add(tail);
  const cleaver = new THREE.Group();
  cleaver.add(cyl(0x5b4a3a, 0.06, 0.6, 0, -0.2, 0), box(0xe8e1cf, 0.12, 0.95, 0.6, 0, 0.5, 0.12), box(0x9aa58a, 0.14, 0.95, 0.08, 0, 0.5, -0.16));
  cleaver.rotation.z = -1.3;
  r.armR = pivot(0.35, 1.45, 0.55, box(scale, 0.24, 0.7, 0.24, 0, -0.32, 0), cleaver);
  cleaver.position.set(0.05, -0.7, 0);
  r.armL = pivot(0.35, 1.45, -0.55, box(scale, 0.24, 0.7, 0.24, 0, -0.32, 0), cone(0xe8e1cf, 0.07, 0.3, 0.08, -0.78, 0, G.cone4));
  r.body.add(r.armR, r.armL);
  return r;
}

function buildIlyra(): Rig {
  const r = baseRig(2.9);
  const coat = 0x6a4fb0;
  r.body.add(cone(coat, 0.55, 1.5, 0, 0.78, 0), box(0xf2e8ff, 0.36, 0.75, 0.55, 0, 1.75, 0), box(0xd9b85a, 0.38, 0.12, 0.6, 0, 1.42, 0), sph(0xe8c9a8, 0.23, 0.02, 2.36, 0));
  r.body.add(cone(0x3a2a66, 0.34, 0.5, -0.02, 2.66, 0, G.cone4), box(0x3a2a66, 0.7, 0.05, 0.7, -0.02, 2.44, 0));
  const quill = new THREE.Group();
  quill.add(cyl(0xf2e8ff, 0.035, 2.5, 0, 0.5, 0), lit(0xb48cff, G.oct, 0.08, 0.75, 0.3, 0, 1.75, 0), lit(0xf2e8ff, G.oct, 0.05, 0.55, 0.2, 0, 1.75, 0), cone(0x2a1f4a, 0.05, 0.2, 0, -0.8, 0));
  r.armR = pivot(0.05, 2.0, 0.36, box(coat, 0.15, 0.6, 0.15, 0.12, -0.25, 0), quill);
  quill.position.set(0.3, -0.5, 0.05);
  r.armR.rotation.z = 0.35;
  r.armL = pivot(0.05, 2.0, -0.36, box(coat, 0.15, 0.6, 0.15, 0.1, -0.25, 0), box(0x8a6d3a, 0.3, 0.38, 0.1, 0.3, -0.5, 0));
  r.armL.rotation.z = 0.5;
  r.body.add(r.armR, r.armL);
  for (let i = 0; i < 3; i++) {
    const page = lit(0xf2e8ff, G.box, 0.26, 0.34, 0.02, 0.85, 1.5 + i * 0.3, 0, 0.9);
    const p = pivot(0, 0, 0, page);
    p.rotation.y = i * 2.09;
    p.userData.speed = 0.9;
    r.spin.push(p);
    r.root.add(p);
  }
  return r;
}

function buildVey(): Rig {
  const r = baseRig(2.5);
  const suit = 0x232c4a;
  const glass = new THREE.MeshBasicMaterial({ color: 0x9fecff, transparent: true, opacity: 0.78, depthWrite: false });
  legs(r, 0x1a2138, 0.85, 0.16, 0.19);
  r.body.add(box(suit, 0.36, 0.75, 0.55, 0, 1.3, 0), box(0x3a4a78, 0.1, 0.4, 0.42, 0.2, 1.4, 0), sph(suit, 0.23, 0.02, 1.95, 0), box(0xf4fbff, 0.08, 0.3, 0.3, 0.22, 1.95, 0));
  r.body.add(box(suit, 0.5, 0.6, 0.7, -0.26, 1.35, 0));
  const blade = (): THREE.Mesh => {
    const b = new THREE.Mesh(G.oct, glass);
    b.scale.set(0.75, 0.09, 0.16);
    return b;
  };
  const bR = blade();
  bR.position.set(0.45, -0.62, 0);
  const bL = blade();
  bL.position.set(0.45, -0.62, 0);
  r.armR = pivot(0.05, 1.6, 0.36, box(suit, 0.15, 0.62, 0.15, 0, -0.3, 0), bR);
  r.armL = pivot(0.05, 1.6, -0.36, box(suit, 0.15, 0.62, 0.15, 0, -0.3, 0), bL);
  r.armR.rotation.z = 0.5;
  r.armL.rotation.z = 0.3;
  r.body.add(r.armR, r.armL);
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Mesh(G.oct, glass);
    s.scale.set(0.1, 0.3, 0.1);
    s.position.set(-0.55, 1.8 + (i % 2) * 0.35, 0);
    const p = pivot(0, 0, 0, s);
    p.rotation.y = i * 2.09 + 1;
    p.userData.speed = 1.3;
    r.spin.push(p);
    r.root.add(p);
  }
  return r;
}

const HERO_BUILDERS: Record<HeroId, () => Rig> = { brannoch: buildBrannoch, suri: buildSuri, oru: buildOru, kesh: buildKesh, ilyra: buildIlyra, vey: buildVey };

export function buildHero(id: HeroId, ringColor: number, self: boolean): Rig {
  const r = HERO_BUILDERS[id]();
  r.root.scale.setScalar(1.12);
  r.ring = groundRing(ringColor, HEROES[id].base.radius * 1.55 + 0.25, self);
  r.ring.scale.divideScalar(1.12);
  r.root.add(r.ring);
  // facing notch so heading reads at a glance
  const notch = new THREE.Mesh(G.cone4, new THREE.MeshBasicMaterial({ color: ringColor }));
  notch.scale.set(0.16, 0.34, 0.16);
  notch.rotation.z = -Math.PI / 2;
  notch.position.set(HEROES[id].base.radius * 1.55 + 0.42, 0.06, 0);
  r.root.add(notch);
  return r;
}

// ---- monsters ---------------------------------------------------------------------------------

export function buildMonster(type: string): Rig {
  switch (type) {
    case 'thorn': {
      const r = baseRig(1.1);
      r.body.add(sph(0x7a9a3a, 0.42, 0, 0.5, 0), sph(0x5c7a2c, 0.26, 0.36, 0.62, 0), lit(0xffd84a, G.sph, 0.06, 0.06, 0.06, 0.55, 0.7, 0.12), lit(0xffd84a, G.sph, 0.06, 0.06, 0.06, 0.55, 0.7, -0.12));
      for (let i = 0; i < 6; i++) {
        const c = cone(0xd9c79a, 0.09, 0.45, 0, 0, 0, G.cone4);
        const a = (i / 6) * 6.28;
        c.position.set(Math.cos(a) * 0.32 - 0.1, 0.85, Math.sin(a) * 0.32);
        c.rotation.set(Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7 + 0.2);
        r.body.add(c);
      }
      return r;
    }
    case 'moss': {
      const r = baseRig(1.7);
      const shell = sph(0x5d7a48, 0.95, 0, 0.75, 0);
      shell.scale.set(1.05, 0.72, 0.95);
      r.body.add(shell, sph(0x8fb05a, 0.5, -0.15, 1.2, 0.2), sph(0x7da04f, 0.38, 0.1, 1.25, -0.3), box(0x6b5a44, 0.5, 0.42, 0.5, 0.95, 0.6, 0), lit(0xfff0a0, G.sph, 0.06, 0.06, 0.06, 1.2, 0.72, 0.15), lit(0xfff0a0, G.sph, 0.06, 0.06, 0.06, 1.2, 0.72, -0.15));
      for (const [x, z] of [
        [0.5, 0.6],
        [0.5, -0.6],
        [-0.5, 0.6],
        [-0.5, -0.6],
      ])
        r.body.add(box(0x6b5a44, 0.3, 0.4, 0.3, x, 0.2, z));
      return r;
    }
    case 'brass': {
      const r = baseRig(1.9);
      const b = sph(0xb8893a, 0.9, 0, 0.85, 0);
      b.scale.set(1.1, 0.85, 1);
      r.body.add(b, box(0x7a5a24, 0.9, 0.3, 1.1, 0.5, 0.55, 0), cyl(0x8a6d3a, 0.34, 0.8, 0.95, 1.1, 0));
      (r.body.children[2] as THREE.Mesh).rotation.z = -1.2;
      r.body.add(lit(0xff9a3a, G.sph, 0.22, 0.22, 0.22, 1.3, 1.25, 0), lit(0xffe14a, G.sph, 0.1, 0.1, 0.1, 0.55, 1.5, 0.4), lit(0xffe14a, G.sph, 0.1, 0.1, 0.1, 0.55, 1.5, -0.4));
      for (const z of [0.75, -0.75]) r.body.add(box(0x7a5a24, 0.5, 0.45, 0.4, 0.2, 0.22, z), box(0x7a5a24, 0.6, 0.4, 0.4, -0.5, 0.2, z));
      return r;
    }
    case 'mist': {
      const r = baseRig(2.4, true);
      r.body.add(cone(0x5a6fa8, 0.75, 1.9, 0, 1.2, 0), sph(0x2b3560, 0.34, 0.08, 2.15, 0), lit(0xbfe6ff, G.sph, 0.09, 0.09, 0.09, 0.36, 2.2, 0.12), lit(0xbfe6ff, G.sph, 0.09, 0.09, 0.09, 0.36, 2.2, -0.12));
      const halo = lit(0xbfe6ff, G.tor, 0.9, 0.9, 0.9, 0, 1.3, 0, 0.8);
      halo.rotation.x = Math.PI / 2;
      const p = pivot(0, 0, 0, halo);
      p.userData.speed = 0.8;
      r.spin.push(p);
      r.root.add(p);
      return r;
    }
    case 'catalystN':
    case 'catalystS': {
      const r = baseRig(3.2, true);
      const c = type === 'catalystN' ? 0x7fe0ff : 0xff9a4a;
      const core = lit(c, G.oct, 0.75, 1.15, 0.75, 0, 1.9, 0);
      r.body.add(core, lit(c, G.oct, 1.0, 1.5, 1.0, 0, 1.9, 0, 0.22), sph(0x4a4460, 0.5, 0, 0.75, 0), box(0xc9a25a, 0.9, 0.16, 0.9, 0, 0.95, 0));
      for (let i = 0; i < 2; i++) {
        const t = mesh(G.torThick, lam(0xc9a25a), 1.35 + i * 0.3, 1.35 + i * 0.3, 1.35 + i * 0.3, 0, 1.9, 0);
        t.rotation.x = Math.PI / 2 + (i ? 0.5 : -0.4);
        const p = pivot(0, 0, 0, t);
        p.userData.speed = i ? -0.7 : 1.0;
        r.spin.push(p);
        r.root.add(p);
      }
      return r;
    }
    default: {
      // Aether Colossus
      const r = baseRig(5.0);
      const st = 0x6b6480;
      const br = 0xc9a25a;
      legs(r, st, 1.5, 0.75, 0.7);
      r.body.add(box(st, 1.6, 1.9, 2.4, 0, 2.5, 0), box(br, 0.3, 1.3, 1.6, 0.8, 2.5, 0), lit(0xff5ad6, G.oct, 0.5, 0.7, 0.5, 0.95, 2.6, 0), box(st, 0.9, 0.8, 0.9, 0.1, 3.85, 0), lit(0xff5ad6, G.box, 0.1, 0.16, 0.6, 0.56, 3.9, 0));
      r.body.add(cone(br, 0.3, 0.9, -0.1, 4.6, 0.35, G.cone4), cone(br, 0.3, 0.9, -0.1, 4.6, -0.35, G.cone4), cone(br, 0.22, 0.6, 0.3, 4.5, 0, G.cone4));
      r.armR = pivot(0, 3.2, 1.6, box(st, 0.65, 2.1, 0.65, 0, -1.0, 0), box(br, 0.9, 0.7, 0.9, 0, -2.1, 0), lit(0xff5ad6, G.box, 0.94, 0.12, 0.94, 0, -2.1, 0));
      r.armL = pivot(0, 3.2, -1.6, box(st, 0.65, 2.1, 0.65, 0, -1.0, 0), box(br, 0.9, 0.7, 0.9, 0, -2.1, 0), lit(0xff5ad6, G.box, 0.94, 0.12, 0.94, 0, -2.1, 0));
      r.body.add(r.armR, r.armL);
      return r;
    }
  }
}

export function buildWard(color: number): Rig {
  const r = baseRig(1.4);
  r.body.add(cyl(0x6b5a44, 0.05, 1.1, 0, 0.55, 0), lit(0xffe9a0, G.oct, 0.2, 0.28, 0.2, 0, 1.25, 0), lit(0xffe9a0, G.sph, 0.42, 0.42, 0.42, 0, 1.25, 0, 0.22));
  r.ring = groundRing(color, 0.55);
  r.root.add(r.ring);
  return r;
}

// ---- structures -------------------------------------------------------------------------------

export interface StructModel {
  root: THREE.Group;
  alive: THREE.Group;
  rubble: THREE.Group;
  crystal: THREE.Object3D | null;
  shield: THREE.Mesh | null;
  spin: THREE.Object3D[];
  top: number;
}

const fogLam = (c: number): THREE.MeshLambertMaterial => {
  const k = `f${c}`;
  let m = matCache.get(k);
  if (!m) {
    m = withFog(new THREE.MeshLambertMaterial({ color: c, flatShading: true }));
    matCache.set(k, m);
  }
  return m as THREE.MeshLambertMaterial;
};
const fbox = (c: number, sx: number, sy: number, sz: number, x = 0, y = 0, z = 0): THREE.Mesh => mesh(G.box, fogLam(c), sx, sy, sz, x, y, z);
const fcyl = (c: number, rt: number, h: number, y: number, geo = G.cyl6): THREE.Mesh => mesh(geo, fogLam(c), rt, h, rt, 0, y, 0);

export function buildStructure(kind: string, tier: string, color: number): StructModel {
  const root = new THREE.Group();
  const alive = new THREE.Group();
  const rubble = new THREE.Group();
  root.add(alive, rubble);
  rubble.visible = false;
  const ivory = 0xe6dfc8;
  const brass = 0xc9a25a;
  const dark = 0x4a4660;
  const spin: THREE.Object3D[] = [];
  let crystal: THREE.Object3D | null = null;
  let shield: THREE.Mesh | null = null;
  let top = 5;
  const bubble = (r: number, y: number): THREE.Mesh => {
    const b = new THREE.Mesh(G.sph, new THREE.MeshBasicMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.16, depthWrite: false }));
    b.scale.setScalar(r);
    b.position.y = y;
    return b;
  };
  if (kind === 'tower' || kind === 'core') {
    const big = kind === 'core' ? 1.15 : tier === 'guard' ? 1.08 : 1;
    const h = (tier === 'outer' ? 3.6 : tier === 'inner' ? 4.0 : 4.4) * big;
    alive.add(fcyl(dark, 1.45 * big, 0.5, 0.25), fcyl(ivory, 1.15 * big, 0.5, 0.7), fcyl(ivory, 0.72 * big, h, 0.9 + h / 2), fcyl(brass, 0.86 * big, 0.28, 0.9 + h * 0.45), fcyl(brass, 1.0 * big, 0.3, 0.9 + h));
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * 6.28 + 0.78;
      const fin = fbox(ivory, 0.2, 0.9, 0.5, Math.cos(a) * 0.95 * big, 1.25 + h, Math.sin(a) * 0.95 * big);
      fin.rotation.y = -a;
      alive.add(fin);
    }
    const cg = new THREE.Group();
    cg.add(lit(color, G.oct, 0.42 * big, 0.72 * big, 0.42 * big), lit(color, G.oct, 0.7 * big, 1.1 * big, 0.7 * big, 0, 0, 0, 0.2));
    if (kind === 'core') cg.add(lit(0xffffff, G.oct, 0.2, 0.36, 0.2, 0, 0.9, 0));
    cg.position.y = 2.0 + h;
    alive.add(cg);
    crystal = cg;
    top = 3.2 + h;
    shield = bubble(2.2, 2.4);
    rubble.add(fcyl(dark, 1.45 * big, 0.4, 0.2), fbox(0x8a8576, 0.9, 0.7, 0.8, 0.3, 0.6, 0.2), fbox(0x8a8576, 0.6, 0.5, 0.7, -0.5, 0.5, -0.3), fbox(0x6f6a5c, 0.5, 1.1, 0.5, -0.1, 0.9, 0.5));
    rubble.children[3].rotation.z = 0.5;
  } else if (kind === 'seal') {
    alive.add(fcyl(dark, 1.6, 0.4, 0.2), fbox(ivory, 0.5, 3.2, 0.5, 0, 1.9, 1.25), fbox(ivory, 0.5, 3.2, 0.5, 0, 1.9, -1.25), fbox(brass, 0.6, 0.4, 3.2, 0, 3.6, 0));
    const sig = new THREE.Group();
    const ringM = lit(color, G.torThick, 0.95, 0.95, 0.95);
    ringM.rotation.y = Math.PI / 2;
    const disc = lit(color, G.disc, 0.86, 0.86, 0.86, 0, 0, 0, 0.35);
    disc.rotation.y = Math.PI / 2;
    (disc.material as THREE.MeshBasicMaterial).side = THREE.DoubleSide;
    sig.add(ringM, disc, lit(0xffffff, G.oct, 0.2, 0.34, 0.2));
    sig.position.y = 2.1;
    alive.add(sig);
    crystal = sig;
    top = 4.4;
    shield = bubble(2.4, 2.0);
    rubble.add(fcyl(dark, 1.6, 0.3, 0.15), fbox(0x8a8576, 0.5, 1.0, 0.5, 0, 0.6, 1.25), fbox(0x8a8576, 0.5, 0.6, 0.5, 0, 0.4, -1.25), fbox(0x7a6a3a, 0.5, 0.35, 1.6, 0.6, 0.3, 0));
    rubble.children[3].rotation.y = 0.6;
  } else {
    // Crown Engine: a brass reality engine with counter-rotating rings around an aether heart
    alive.add(fcyl(dark, 3.0, 0.5, 0.25, G.cyl), fcyl(brass, 2.4, 0.5, 0.75, G.cyl), fcyl(ivory, 1.5, 1.6, 1.8), fcyl(brass, 1.8, 0.3, 2.7));
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * 6.28;
      alive.add(fbox(ivory, 0.35, 2.6, 0.35, Math.cos(a) * 2.1, 1.8, Math.sin(a) * 2.1));
    }
    const heart = new THREE.Group();
    heart.add(lit(0xff5ad6, G.sph, 0.85, 0.85, 0.85), lit(0xff9ae8, G.sph, 1.25, 1.25, 1.25, 0, 0, 0, 0.22), lit(color, G.oct, 0.4, 0.6, 0.4, 0, 1.3, 0));
    heart.position.y = 4.4;
    alive.add(heart);
    crystal = heart;
    for (let i = 0; i < 3; i++) {
      const t = mesh(G.torThick, fogLam(brass), 1.7 + i * 0.35, 1.7 + i * 0.35, 1.7 + i * 0.35, 0, 4.4, 0);
      t.rotation.x = Math.PI / 2 + (i - 1) * 0.6;
      const p = pivot(0, 0, 0, t);
      p.userData.speed = (i % 2 ? -1 : 1) * (0.5 + i * 0.25);
      spin.push(p);
      alive.add(p);
    }
    top = 7.2;
    shield = bubble(3.6, 3.2);
    rubble.add(fcyl(dark, 3.0, 0.4, 0.2, G.cyl), fbox(0x7a6a3a, 1.6, 0.6, 1.2, 0.5, 0.6, 0.3), fbox(0x8a8576, 0.5, 1.4, 0.5, -1.4, 0.9, -1.0), fbox(0x8a8576, 0.5, 0.8, 0.5, 1.5, 0.6, 1.4));
  }
  if (shield) alive.add(shield);
  const ring = groundRing(color, kind === 'engine' ? 3.3 : 1.9);
  root.add(ring);
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh && (o as THREE.Mesh).material instanceof THREE.MeshLambertMaterial) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return { root, alive, rubble, crystal, shield, spin, top };
}

// ---- animation --------------------------------------------------------------------------------

export interface AnimState {
  anim: number;
  prog: number; // 0..1 progress through a timed animation (attack / cast)
  speed: number; // current ground speed
  time: number;
  st: number;
}

export function animateRig(r: Rig, s: AnimState): void {
  const t = s.time + r.phase;
  const moving = s.anim === ANIM.run || s.speed > 0.6;
  const stride = moving ? Math.sin(t * 9.5) : 0;
  let bob = moving ? Math.abs(Math.sin(t * 9.5)) * 0.07 : Math.sin(t * 2.2) * 0.025;
  let lift = r.floats ? 0.28 + Math.sin(t * 2.4) * 0.09 : 0;
  let lean = moving ? -0.1 : 0;
  let armR = moving ? -stride * 0.5 : Math.sin(t * 1.8) * 0.04;
  let armL = moving ? stride * 0.5 : -Math.sin(t * 1.8) * 0.04;
  let spinY = 0;
  if (s.anim === ANIM.attack) {
    // wind back, snap forward, recover
    const p = s.prog;
    const swing = p < 0.55 ? -0.9 * (p / 0.55) : p < 0.72 ? -0.9 + 3.0 * ((p - 0.55) / 0.17) : 2.1 * (1 - (p - 0.72) / 0.28);
    armR = swing;
    lean = p > 0.5 && p < 0.85 ? -0.22 : 0.06;
  } else if (s.anim >= ANIM.cast0 && s.anim <= ANIM.cast3) {
    const p = Math.sin(Math.min(1, s.prog) * Math.PI);
    armR = 1.9 * p;
    armL = (s.anim === ANIM.cast3 ? 1.9 : 0.9) * p;
    lean = 0.14 * p;
    bob += 0.12 * p;
    if (s.anim === ANIM.cast3) lift += 0.25 * p;
  } else if (s.anim === ANIM.recall) {
    armR = 1.4;
    armL = 1.4;
    spinY = t * 1.6;
    lift += 0.15 + Math.sin(t * 5) * 0.04;
  } else if (s.anim === ANIM.dash) {
    lean = -0.5;
    armR = -1.1;
    armL = -1.1;
  }
  if (s.st & ST.AIRBORNE) {
    lift += 1.2 * Math.sin(Math.min(1, s.prog * 0.999 + 0.001) * Math.PI) + 0.5;
    spinY = t * 5;
  } else if (s.st & ST.STUN) {
    lean = Math.sin(t * 7) * 0.08;
    armR = 0.2;
    armL = 0.2;
  }
  r.body.position.y = bob + lift;
  r.body.rotation.z = lean;
  r.body.rotation.y = spinY;
  if (r.armR) r.armR.rotation.z = (r.armR.userData.rest ?? (r.armR.userData.rest = r.armR.rotation.z)) + armR;
  if (r.armL) r.armL.rotation.z = (r.armL.userData.rest ?? (r.armL.userData.rest = r.armL.rotation.z)) + armL;
  if (r.legL) {
    r.legL.rotation.z = stride * 0.75;
    r.legL.position.y = (r.legL.userData.y ?? (r.legL.userData.y = r.legL.position.y)) + lift;
  }
  if (r.legR) {
    r.legR.rotation.z = -stride * 0.75;
    r.legR.position.y = (r.legR.userData.y ?? (r.legR.userData.y = r.legR.position.y)) + lift;
  }
  if (r.tail) r.tail.rotation.y = Math.sin(t * (moving ? 8 : 2.2)) * (moving ? 0.35 : 0.15);
  for (const w of r.wings) w.rotation.x = Math.sin(t * 13 + (w.userData.up as number)) * 0.5 * (w.userData.side as number);
  for (const sp of r.spin) sp.rotation.y += 0.016 * ((sp.userData.speed as number) ?? 1);
}
