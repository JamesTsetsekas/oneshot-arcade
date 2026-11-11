// Static world rendering. Built straight from the same collision boxes the simulation uses, so what you see is exactly
// what blocks movement, sight and bullets (glass is see-through, foliage is opaque, and so on).

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { BOXES, Box, CELL, CEILING_Y, GRID_H, GRID_W, MAP_HEIGHT, MAP_WIDTH, SITES, cellGlyph, themeAt } from '../sim/map';
import { TextureSet, makeTextures, signTexture } from './textures';

export interface WorldVisuals {
  group: THREE.Group;
  textures: TextureSet;
  sun: THREE.DirectionalLight;
  hemi: THREE.HemisphereLight;
  siteMarkers: THREE.Group;
  setShadowQuality(level: 'off' | 'low' | 'high'): void;
}

/** Box geometry with world-scaled UVs. uvU/uvV: metres per texture repeat on side faces; uvT on top. */
function boxGeo(b: Box, uvU: number, uvV: number, uvT: number): THREE.BufferGeometry {
  const sx = b.x1 - b.x0, sy = b.y1 - b.y0, sz = b.z1 - b.z0;
  const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2, cz = (b.z0 + b.z1) / 2;
  const g = new THREE.BoxGeometry(sx, sy, sz);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  // BoxGeometry face order: +x, -x, +y, -y, +z, -z; 4 vertices each
  const faceDims: Array<[number, number, number, number]> = [
    [sz, sy, 0, 0], [sz, sy, 0, 0], [sx, sz, 1, 0], [sx, sz, 1, 0], [sx, sy, 0, 0], [sx, sy, 0, 0],
  ];
  for (let f = 0; f < 6; f++) {
    const [a, bb, top] = faceDims[f];
    for (let i = 0; i < 4; i++) {
      const u0 = uv.getX(f * 4 + i), v0 = uv.getY(f * 4 + i);
      if (top) uv.setXY(f * 4 + i, (u0 * a) / uvT + (b.x0 + b.z0) * 0.013, (v0 * bb) / uvT);
      else uv.setXY(f * 4 + i, (u0 * a) / uvU + (b.x0 + b.z0) * 0.017, b.y0 / uvV + (v0 * bb) / uvV);
    }
  }
  uv.needsUpdate = true;
  g.translate(cx, cy, cz);
  return g;
}

const CRATE_COLORS = [0xd0703a, 0x2f8f93, 0xc9a33b, 0x7a5fb0, 0x5f8a4a];

export function buildWorld(scene: THREE.Scene): WorldVisuals {
  const textures = makeTextures();
  const group = new THREE.Group();
  group.name = 'world';

  const matWall = new THREE.MeshStandardMaterial({ map: textures.wall, roughness: 0.92, metalness: 0.02 });
  const matMetal = new THREE.MeshStandardMaterial({ map: textures.metal, roughness: 0.55, metalness: 0.5, color: 0xcad6e8 });
  const matFoliage = new THREE.MeshStandardMaterial({ map: textures.foliage, roughness: 1, metalness: 0 });
  const matPlatform = new THREE.MeshStandardMaterial({ map: textures.platform, roughness: 0.8, metalness: 0.15 });
  const matThin = new THREE.MeshStandardMaterial({ map: textures.thin, roughness: 0.95, metalness: 0 });
  const matHalf = new THREE.MeshStandardMaterial({ map: textures.halfWall, roughness: 0.95, metalness: 0 });
  const matGlass = new THREE.MeshStandardMaterial({ color: 0x9fe6ff, transparent: true, opacity: 0.2, roughness: 0.05, metalness: 0.1, side: THREE.DoubleSide, depthWrite: false });
  const matCrates = CRATE_COLORS.map((c) => new THREE.MeshStandardMaterial({ map: textures.crate, color: c, roughness: 0.7, metalness: 0.25 }));

  const groups = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const add = (m: THREE.Material, g: THREE.BufferGeometry) => { const a = groups.get(m) ?? []; a.push(g); groups.set(m, a); };

  for (const b of BOXES) {
    switch (b.glyph) {
      case '#': case 'k': add(matWall, boxGeo(b, 4, 6, 4)); break;
      case 'T': add(matMetal, boxGeo(b, 2, 2, 2)); break;
      case 'C': case 'c': add(matCrates[(Math.floor(b.x0 / 2) * 7 + Math.floor(b.z0 / 2) * 3) % matCrates.length], boxGeo(b, 2, 2, 2)); break;
      case 'H': add(matHalf, boxGeo(b, 2, 1.2, 2)); break;
      case 'P': add(matFoliage, boxGeo(b, 2, 2, 2)); break;
      case '1': case '2': case '3': case '4': add(matPlatform, boxGeo(b, 2, 2, 2)); break;
      case 'v': case 'w': add(matThin, boxGeo(b, 2, 4.2, 2)); break;
      case 'g': case 'l': add(matGlass, boxGeo(b, 2, 2, 2)); break;
      default: add(matWall, boxGeo(b, 4, 6, 4));
    }
  }
  for (const [m, geos] of groups) {
    const merged = mergeGeometries(geos, false)!;
    const mesh = new THREE.Mesh(merged, m);
    mesh.castShadow = m !== matGlass;
    mesh.receiveShadow = true;
    if (m === matGlass) mesh.renderOrder = 2;
    group.add(mesh);
    for (const g of geos) g.dispose();
  }

  // ---- floors, merged per theme
  const floorMats: Record<string, THREE.Material> = {
    yard: new THREE.MeshStandardMaterial({ map: textures.floorYard, roughness: 0.95 }),
    atrium: new THREE.MeshStandardMaterial({ map: textures.floorConcrete, roughness: 0.6, metalness: 0.05 }),
    turbine: new THREE.MeshStandardMaterial({ map: textures.floorGrate, roughness: 0.7, metalness: 0.3 }),
    hydro: new THREE.MeshStandardMaterial({ map: textures.floorHydro, roughness: 0.55, metalness: 0.05 }),
    mid: new THREE.MeshStandardMaterial({ map: textures.floorMid, roughness: 0.35, metalness: 0.1 }),
    corridor: new THREE.MeshStandardMaterial({ map: textures.floorConcrete, roughness: 0.85 }),
  };
  const floorGeos: Record<string, THREE.BufferGeometry[]> = {};
  for (let r = 0; r < GRID_H; r++) {
    for (let c = 0; c < GRID_W; c++) {
      const ch = cellGlyph(c, r);
      if (ch === '#') continue;
      const th = themeAt(c, r);
      const g = new THREE.PlaneGeometry(CELL, CELL);
      g.rotateX(-Math.PI / 2);
      g.translate(c * CELL + CELL / 2, 0, r * CELL + CELL / 2);
      const uv = g.attributes.uv as THREE.BufferAttribute;
      for (let i = 0; i < 4; i++) uv.setXY(i, uv.getX(i), uv.getY(i));
      (floorGeos[th] ??= []).push(g);
    }
  }
  for (const th of Object.keys(floorGeos)) {
    const merged = mergeGeometries(floorGeos[th], false)!;
    const mesh = new THREE.Mesh(merged, floorMats[th]);
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  // ---- ceiling with warm light panels
  const ceilMat = new THREE.MeshStandardMaterial({ map: textures.ceiling, roughness: 0.9, side: THREE.BackSide });
  textures.ceiling.repeat.set(MAP_WIDTH / 4, MAP_HEIGHT / 4);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(MAP_WIDTH, MAP_HEIGHT).rotateX(Math.PI / 2).translate(MAP_WIDTH / 2, CEILING_Y, MAP_HEIGHT / 2), ceilMat);
  ceil.receiveShadow = false;
  group.add(ceil);
  const panelGeos: THREE.BufferGeometry[] = [];
  const magentaGeos: THREE.BufferGeometry[] = [];
  for (let r = 1; r < GRID_H - 1; r += 3) {
    for (let c = 1; c < GRID_W - 1; c += 3) {
      if (cellGlyph(c, r) === '#') continue;
      const g = new THREE.BoxGeometry(2.4, 0.08, 0.7);
      g.translate(c * CELL + 1, CEILING_Y - 0.05, r * CELL + 1);
      panelGeos.push(g);
      const g2 = new THREE.BoxGeometry(0.08, 0.06, 2.6);
      g2.translate(c * CELL + 3.1, CEILING_Y - 0.05, r * CELL + 1);
      if (cellGlyph(c + 1, r) !== '#') magentaGeos.push(g2);
    }
  }
  const panels = new THREE.Mesh(mergeGeometries(panelGeos, false)!, new THREE.MeshBasicMaterial({ color: 0xffd9a0 }));
  group.add(panels);
  if (magentaGeos.length) group.add(new THREE.Mesh(mergeGeometries(magentaGeos, false)!, new THREE.MeshBasicMaterial({ color: 0xff3fa6 })));

  // ---- signs (visual only)
  const signs: Array<{ text: string; x: number; z: number; y: number; ry: number; accent?: string }> = [
    { text: 'A  TURBINE HALL', x: 20, z: 4.03, y: 3.4, ry: 0, accent: '#ff3fa6' },
    { text: 'B  HYDROPONICS', x: 78, z: 4.03, y: 3.4, ry: 0, accent: '#42e8a0' },
    { text: 'CALIBRATION', x: 40, z: 18.03, y: 3.6, ry: 0, accent: '#4de0ff' },
    { text: 'ATRIUM', x: 48, z: 15.97, y: 3.6, ry: Math.PI, accent: '#4de0ff' },
    { text: 'FREIGHT YARD', x: 33, z: 54.03, y: 3.6, ry: 0, accent: '#ffb24a' },
    { text: 'DOCK LANE', x: 8, z: 59.97, y: 3.2, ry: Math.PI, accent: '#ffb24a' },
    { text: 'GLASS CORRIDOR', x: 87, z: 63.97, y: 3.4, ry: Math.PI, accent: '#9fe6ff' },
    { text: 'CARGO LANE', x: 20, z: 53.97, y: 3.2, ry: Math.PI, accent: '#ffb24a' },
  ];
  for (const s of signs) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.56), new THREE.MeshBasicMaterial({ map: signTexture(s.text, s.accent), transparent: false }));
    m.position.set(s.x, s.y, s.z);
    m.rotation.y = s.ry;
    group.add(m);
  }

  // ---- bombsite floor markings (visible ring and letters); purely visual, matching the authoritative zones
  const siteMarkers = new THREE.Group();
  for (const key of ['A', 'B'] as const) {
    const z = SITES[key];
    const w = z.x1 - z.x0, d = z.z1 - z.z0;
    const edge = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xff3fa6, transparent: true, opacity: 0.1, depthWrite: false }));
    edge.position.set((z.x0 + z.x1) / 2, 0.03, (z.z0 + z.z1) / 2);
    siteMarkers.add(edge);
    const frameGeos: THREE.BufferGeometry[] = [];
    const t = 0.12;
    for (const [px, pz, sw, sd] of [[z.x0 + w / 2, z.z0, w, t], [z.x0 + w / 2, z.z1, w, t], [z.x0, z.z0 + d / 2, t, d], [z.x1, z.z0 + d / 2, t, d]] as Array<[number, number, number, number]>) {
      const g = new THREE.PlaneGeometry(sw, sd).rotateX(-Math.PI / 2);
      g.translate(px, 0.04, pz);
      frameGeos.push(g);
    }
    siteMarkers.add(new THREE.Mesh(mergeGeometries(frameGeos, false)!, new THREE.MeshBasicMaterial({ color: 0xff3fa6 })));
    const letter = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 4.5).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: letterTexture(key), transparent: true, depthWrite: false, opacity: 0.9 }));
    letter.position.set((z.x0 + z.x1) / 2, 0.05, (z.z0 + z.z1) / 2);
    siteMarkers.add(letter);
  }
  group.add(siteMarkers);

  // ---- lights
  const hemi = new THREE.HemisphereLight(0xeaf1ff, 0x8a8e98, 1.35);
  const amb = new THREE.AmbientLight(0xfff0e0, 0.32);
  const sun = new THREE.DirectionalLight(0xfff4e6, 1.65);
  sun.position.set(MAP_WIDTH / 2 + 38, 46, MAP_HEIGHT / 2 - 30);
  sun.target.position.set(MAP_WIDTH / 2, 0, MAP_HEIGHT / 2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera;
  sc.left = -64; sc.right = 64; sc.top = 56; sc.bottom = -56; sc.near = 4; sc.far = 130;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.04;
  scene.add(hemi, amb, sun, sun.target, group);

  return {
    group, textures, sun, hemi, siteMarkers,
    setShadowQuality(level) {
      sun.castShadow = level !== 'off';
      const size = level === 'high' ? 4096 : 2048;
      if (sun.shadow.mapSize.x !== size) { sun.shadow.mapSize.set(size, size); sun.shadow.map?.dispose(); sun.shadow.map = null; }
    },
  };
}

function letterTexture(letter: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.font = '900 190px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 12; ctx.strokeStyle = 'rgba(20,10,30,0.9)';
  ctx.strokeText(letter, 128, 140);
  ctx.fillStyle = '#ff3fa6';
  ctx.fillText(letter, 128, 140);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
