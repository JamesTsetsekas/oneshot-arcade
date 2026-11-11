// client-renderer: The Broken Diadem's static world — island heightfield, mistwood, brush, water
// and the void below. Built procedurally from the same signed-distance map the simulation uses, so
// walls, brush and river always match navigation and vision.

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CELL, FOUNTAIN, GH, GW, GameMap, MAP_H, MAP_W, SURF } from '../../shared/map';

/** Shared uniforms for fog-of-war darkening, injected into every world material. */
export const fogUniforms = {
  uFog: { value: null as THREE.Texture | null },
  uMapSize: { value: new THREE.Vector2(MAP_W, MAP_H) },
  uTime: { value: 0 },
};

/** Patch a built-in material so it samples the fog-of-war texture by world position. */
export function withFog<T extends THREE.Material>(mat: T, opts: { lanes?: boolean } = {}): T {
  mat.onBeforeCompile = (shader): void => {
    shader.uniforms.uFog = fogUniforms.uFog;
    shader.uniforms.uMapSize = fogUniforms.uMapSize;
    shader.uniforms.uTime = fogUniforms.uTime;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vWPos;\n${opts.lanes ? 'attribute vec3 aSurf;\nvarying vec3 vSurf;' : ''}`)
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
        vec4 wpFog = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          wpFog = instanceMatrix * wpFog;
        #endif
        vWPos = (modelMatrix * wpFog).xyz;
        ${opts.lanes ? 'vSurf = aSurf;' : ''}`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform sampler2D uFog;\nuniform vec2 uMapSize;\nuniform float uTime;\nvarying vec3 vWPos;\n${opts.lanes ? 'varying vec3 vSurf;' : ''}`)
      .replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
        ${
          opts.lanes
            ? `// paving: tile seams on lanes and base plazas, ripples on the river
        if (vWPos.y > -0.6 && vWPos.y < 0.12) {
          float lane = smoothstep(0.35, 0.9, vSurf.x);
          vec2 tp = vec2(vWPos.x + vWPos.z, vWPos.x - vWPos.z) * 0.38;
          vec2 tf = abs(fract(tp) - 0.5);
          float seam = smoothstep(0.455, 0.5, max(tf.x, tf.y));
          vec2 cell = floor(tp);
          float tint = fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453);
          gl_FragColor.rgb *= 1.0 - lane * (seam * 0.24 + (tint - 0.5) * 0.09);
          float river = smoothstep(0.3, 0.9, vSurf.y);
          float rip = sin(vWPos.x * 2.1 + uTime * 1.3) * sin(vWPos.z * 1.7 - uTime * 0.9);
          gl_FragColor.rgb += river * vec3(0.05, 0.11, 0.12) * smoothstep(0.55, 1.0, rip);
          float pit = smoothstep(0.3, 0.9, vSurf.z);
          float pr = length(vWPos.xz - vec2(75.0, -60.5));
          gl_FragColor.rgb += pit * vec3(0.22, 0.04, 0.2) * (0.5 + 0.5 * sin(pr * 2.2 - uTime * 1.6)) * smoothstep(9.0, 2.0, pr);
        }`
            : ''
        }
        vec2 fogUv = vec2(vWPos.x / uMapSize.x, -vWPos.z / uMapSize.y);
        float vis = texture2D(uFog, fogUv).r;
        if (fogUv.x < 0.0 || fogUv.x > 1.0 || fogUv.y < 0.0 || fogUv.y > 1.0) vis = 0.0;
        vec3 fogged = mix(vec3(dot(gl_FragColor.rgb, vec3(0.3, 0.5, 0.2))), gl_FragColor.rgb, 0.72) * vec3(0.46, 0.5, 0.66);
        gl_FragColor.rgb = mix(fogged, gl_FragColor.rgb, vis);`,
      );
  };
  return mat;
}

function hash2(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function vnoise(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi);
  const b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1);
  const d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const smooth = (a: number, b: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const RIM = 7.5;
export const WALL_H = 1.5;

/** Terrain height at a sim position (walls, river bed). Units always stand at y = 0. */
export function terrainHeight(map: GameMap, x: number, y: number): number {
  const d = map.sdfT(x, y);
  const n = vnoise(x * 0.23, y * 0.23);
  if (d <= 0) {
    const surf = map.surfAt(x, y);
    if (surf === SURF.river) return -0.28 * smooth(0, -1.6, d);
    return 0;
  }
  const rim = RIM + n * 2.2;
  let h = (WALL_H + n * 0.7) * smooth(0, 1.5, d);
  if (d > rim - 1.6) h -= smooth(rim - 1.6, rim + 0.6, d) * 14 + Math.max(0, d - rim) * 7;
  return h;
}

const COL = {
  lane: new THREE.Color(0xd6cfb8),
  base: new THREE.Color(0xcbbf9c),
  jungle: new THREE.Color(0x587a4a),
  camp: new THREE.Color(0x75844f),
  river: new THREE.Color(0x2c8794),
  pit: new THREE.Color(0x5b4474),
  rock: new THREE.Color(0x8f8c7e),
  canopy: new THREE.Color(0x2f6440),
  cliff: new THREE.Color(0x3b4160),
  cliffDeep: new THREE.Color(0x0b1030),
};

export function buildTerrain(map: GameMap, quality: 'low' | 'medium' | 'high'): THREE.Group {
  const group = new THREE.Group();
  const step = quality === 'low' ? 1.0 : 0.75;
  const nx = Math.floor(MAP_W / step) + 1;
  const ny = Math.floor(MAP_H / step) + 1;
  const pos = new Float32Array(nx * ny * 3);
  const col = new Float32Array(nx * ny * 3);
  const surfA = new Float32Array(nx * ny * 3);
  const dArr = new Float32Array(nx * ny);
  const c = new THREE.Color();
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const x = i * step;
      const y = j * step;
      const d = map.sdfT(x, y);
      const idx = j * nx + i;
      dArr[idx] = d;
      const h = terrainHeight(map, x, y);
      pos[idx * 3] = x;
      pos[idx * 3 + 1] = h;
      pos[idx * 3 + 2] = -y;
      const n = vnoise(x * 0.55, y * 0.55);
      const n2 = vnoise(x * 0.12 + 40, y * 0.12 + 9);
      const surf = map.surfAt(x, y);
      if (d <= 0.15) {
        const base = surf === SURF.lane ? COL.lane : surf === SURF.base ? COL.base : surf === SURF.river ? COL.river : surf === SURF.pit ? COL.pit : surf === SURF.camp ? COL.camp : COL.jungle;
        c.copy(base);
        // worn edges where paving meets the mistwood
        if (surf === SURF.lane || surf === SURF.base) c.lerp(COL.jungle, smooth(-1.6, 0.1, d) * 0.55);
        else if (surf !== SURF.river) c.lerp(COL.rock, smooth(-0.9, 0.1, d) * 0.35);
        c.multiplyScalar(0.9 + n * 0.16 + n2 * 0.08);
        surfA[idx * 3] = surf === SURF.lane || surf === SURF.base ? 1 : 0;
        surfA[idx * 3 + 1] = surf === SURF.river ? 1 : 0;
        surfA[idx * 3 + 2] = surf === SURF.pit ? 1 : 0;
      } else {
        const rim = RIM + vnoise(x * 0.23, y * 0.23) * 2.2;
        c.copy(COL.rock).lerp(COL.canopy, smooth(0.5, 1.9, d));
        c.multiplyScalar(0.82 + n * 0.3);
        if (d > rim - 1.6) c.lerp(COL.cliff, smooth(rim - 1.8, rim - 0.6, d)).lerp(COL.cliffDeep, smooth(rim - 0.6, rim + 1.6, d));
      }
      col[idx * 3] = c.r;
      col[idx * 3 + 1] = c.g;
      col[idx * 3 + 2] = c.b;
    }
  }
  const index: number[] = [];
  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i;
      const b = a + 1;
      const d2 = a + nx;
      const e = d2 + 1;
      const rimHere = RIM + 5.2;
      if (Math.min(dArr[a], dArr[b], dArr[d2], dArr[e]) > rimHere) continue;
      index.push(a, b, d2, b, e, d2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSurf', new THREE.BufferAttribute(surfA, 3));
  geo.setIndex(index);
  geo.computeVertexNormals();
  const ground = new THREE.Mesh(geo, withFog(new THREE.MeshLambertMaterial({ vertexColors: true }), { lanes: true }));
  ground.receiveShadow = true;
  ground.name = 'ground';
  group.add(ground);

  // --- water sheet over the river bed -------------------------------------------------------
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 84),
    withFog(new THREE.MeshLambertMaterial({ color: 0x4fc3d0, transparent: true, opacity: 0.34, depthWrite: false })),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(75, -0.07, -60.5);
  group.add(water);

  // --- mistwood: instanced low-poly trees and coral growths on the raised ground -------------
  const trunkGeo = new THREE.CylinderGeometry(0.12, 0.2, 1, 5);
  trunkGeo.translate(0, 0.5, 0);
  const crown = new THREE.IcosahedronGeometry(1, 0);
  crown.scale(1, 0.8, 1);
  crown.translate(0, 1.5, 0);
  const crown2 = new THREE.IcosahedronGeometry(0.62, 0);
  crown2.translate(0.25, 2.25, 0.1);
  const crownGeo = mergeGeometries([crown, crown2]) as THREE.BufferGeometry;
  const spots: { x: number; y: number; h: number; s: number; kind: number }[] = [];
  const spacing = quality === 'low' ? 3.0 : quality === 'medium' ? 2.25 : 1.9;
  for (let y = 2; y < MAP_H - 2; y += spacing) {
    for (let x = 2; x < MAP_W - 2; x += spacing) {
      const jx = x + (hash2(x, y) - 0.5) * spacing * 0.9;
      const jy = y + (hash2(y + 3.3, x) - 0.5) * spacing * 0.9;
      const d = map.sdfT(jx, jy);
      const rim = RIM + vnoise(jx * 0.23, jy * 0.23) * 2.2;
      if (d < 2.3 || d > rim - 2.4) continue;
      const r = hash2(jx * 1.7, jy * 2.3);
      if (r < 0.18) continue;
      spots.push({ x: jx, y: jy, h: terrainHeight(map, jx, jy), s: 0.62 + hash2(jx, jy * 1.3) * 0.5, kind: r > 0.93 ? 1 : r > 0.88 ? 2 : 0 });
    }
  }
  const trunks = new THREE.InstancedMesh(trunkGeo, withFog(new THREE.MeshLambertMaterial({ color: 0x4a3b33 })), spots.length);
  const crowns = new THREE.InstancedMesh(crownGeo, withFog(new THREE.MeshLambertMaterial({ flatShading: true })), spots.length);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const sc = new THREE.Vector3();
  const p3 = new THREE.Vector3();
  const tc = new THREE.Color();
  spots.forEach((s, i) => {
    q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, hash2(s.x, s.y) * Math.PI * 2);
    p3.set(s.x, s.h - 0.1, -s.y);
    sc.set(s.s, s.s * 1.1, s.s);
    m4.compose(p3, q, sc);
    trunks.setMatrixAt(i, m4);
    sc.set(s.s * 0.95, s.s * (0.8 + hash2(s.y, s.x) * 0.3), s.s * 0.95);
    m4.compose(p3, q, sc);
    crowns.setMatrixAt(i, m4);
    const g = hash2(s.x * 3.1, s.y * 0.7);
    if (s.kind === 1) tc.setHex(0xe86a8a).multiplyScalar(0.85 + g * 0.25); // coral sky growth
    else if (s.kind === 2) tc.setHex(0x9a5fd0).multiplyScalar(0.8 + g * 0.3); // aether-touched
    else tc.setRGB(0.13 + g * 0.08, 0.36 + g * 0.16, 0.24 + g * 0.06);
    crowns.setColorAt(i, tc);
  });
  trunks.castShadow = crowns.castShadow = quality !== 'low';
  crowns.receiveShadow = true;
  if (crowns.instanceColor) crowns.instanceColor.needsUpdate = true;
  group.add(trunks, crowns);

  // --- brush: instanced reed tufts exactly where the brush grid says units are hidden ---------
  const blade = new THREE.ConeGeometry(0.16, 1.15, 4);
  blade.translate(0, 0.55, 0);
  const b2 = blade.clone();
  b2.rotateZ(0.32);
  b2.translate(0.16, -0.04, 0.05);
  const b3 = blade.clone();
  b3.rotateZ(-0.3);
  b3.rotateY(1.3);
  b3.translate(-0.13, -0.06, -0.1);
  const tuftGeo = mergeGeometries([blade, b2, b3]) as THREE.BufferGeometry;
  const tufts: { x: number; y: number }[] = [];
  const bs = quality === 'low' ? 0.85 : 0.6;
  for (let y = 0; y < MAP_H; y += bs) {
    for (let x = 0; x < MAP_W; x += bs) {
      const jx = x + (hash2(x * 2.1, y) - 0.5) * bs;
      const jy = y + (hash2(y * 1.9, x) - 0.5) * bs;
      if (map.brushAt(jx, jy) >= 0 && map.sdfT(jx, jy) < -0.2) tufts.push({ x: jx, y: jy });
    }
  }
  const brush = new THREE.InstancedMesh(tuftGeo, withFog(new THREE.MeshLambertMaterial({ flatShading: true })), tufts.length);
  tufts.forEach((t, i) => {
    q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, hash2(t.x, t.y) * 6.28);
    const s = 0.75 + hash2(t.y, t.x) * 0.6;
    p3.set(t.x, 0, -t.y);
    sc.set(s, s * (0.85 + hash2(t.x * 5, t.y) * 0.5), s);
    m4.compose(p3, q, sc);
    brush.setMatrixAt(i, m4);
    const g = hash2(t.x * 7, t.y * 3);
    tc.setRGB(0.2 + g * 0.1, 0.55 + g * 0.2, 0.42 + g * 0.1);
    brush.setColorAt(i, tc);
  });
  if (brush.instanceColor) brush.instanceColor.needsUpdate = true;
  brush.name = 'brush';
  group.add(brush);

  // --- decorative: fountains, broken causeway pylons, aether motes ----------------------------
  for (const team of [0, 1] as const) {
    const f = FOUNTAIN[team];
    const tcol = team === 0 ? 0x4aa8ff : 0xff6a55;
    const dais = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 5, 0.25, 32), withFog(new THREE.MeshLambertMaterial({ color: 0xd9cfae })));
    dais.position.set(f.x, 0.1, -f.y);
    dais.receiveShadow = true;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.14, 8, 40), new THREE.MeshBasicMaterial({ color: tcol }));
    ring.rotation.x = Math.PI / 2;
    ring.position.set(f.x, 0.3, -f.y);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(3.5, 32), new THREE.MeshBasicMaterial({ color: tcol, transparent: true, opacity: 0.22 }));
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(f.x, 0.25, -f.y);
    group.add(dais, ring, pool);
  }
  const pylonGeo = new THREE.BoxGeometry(0.7, 2.6, 0.7);
  pylonGeo.translate(0, 1.0, 0);
  const pylons: { x: number; y: number }[] = [];
  for (const lane of map.lanes) {
    for (let i = 0; i < lane.length - 1; i++) {
      const a = lane[i];
      const b = lane[i + 1];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      for (let s = 3; s < len; s += 9) {
        const t = s / len;
        const px = a.x + (b.x - a.x) * t;
        const py = a.y + (b.y - a.y) * t;
        const nxv = -(b.y - a.y) / len;
        const nyv = (b.x - a.x) / len;
        for (const side of [-1, 1]) {
          const qx = px + nxv * side * 6.3;
          const qy = py + nyv * side * 6.3;
          const d = map.sdfT(qx, qy);
          if (d > 0.4 && d < 2.2) pylons.push({ x: qx, y: qy });
        }
      }
    }
  }
  const pyl = new THREE.InstancedMesh(pylonGeo, withFog(new THREE.MeshLambertMaterial({ color: 0xe6dfc8, flatShading: true })), pylons.length);
  pylons.forEach((p, i) => {
    q.setFromEuler(new THREE.Euler((hash2(p.x, p.y) - 0.5) * 0.25, hash2(p.y, p.x) * 3, (hash2(p.x * 2, p.y) - 0.5) * 0.25));
    p3.set(p.x, terrainHeight(map, p.x, p.y) - 0.3, -p.y);
    const s = 0.7 + hash2(p.x * 3, p.y * 3) * 0.7;
    sc.set(1, s, 1);
    m4.compose(p3, q, sc);
    pyl.setMatrixAt(i, m4);
  });
  pyl.castShadow = quality !== 'low';
  group.add(pyl);

  // --- the void: a soft aether glow far beneath the island ------------------------------------
  const cv = document.createElement('canvas');
  cv.width = cv.height = 256;
  const g2 = cv.getContext('2d') as CanvasRenderingContext2D;
  const grad = g2.createRadialGradient(128, 128, 10, 128, 128, 128);
  grad.addColorStop(0, 'rgba(120,50,170,0.2)');
  grad.addColorStop(0.45, 'rgba(40,44,120,0.1)');
  grad.addColorStop(1, 'rgba(10,14,40,0)');
  g2.fillStyle = grad;
  g2.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 220; i++) {
    g2.fillStyle = `rgba(255,${200 + Math.floor(hash2(i, 3) * 55)},255,${0.1 + hash2(i, 7) * 0.35})`;
    g2.fillRect(hash2(i, 1) * 256, hash2(i, 2) * 256, 1.2, 1.2);
  }
  const voidTex = new THREE.CanvasTexture(cv);
  voidTex.colorSpace = THREE.SRGBColorSpace;
  const voidPlane = new THREE.Mesh(new THREE.PlaneGeometry(420, 420), new THREE.MeshBasicMaterial({ map: voidTex, transparent: true, depthWrite: false }));
  voidPlane.rotation.x = -Math.PI / 2;
  voidPlane.position.set(75, -46, -57.5);
  group.add(voidPlane);

  void CELL;
  void GW;
  void GH;
  return group;
}
