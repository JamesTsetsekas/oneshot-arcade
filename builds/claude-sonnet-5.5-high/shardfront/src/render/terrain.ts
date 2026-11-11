// renderer: terrain mesh, fog-of-war shading, static scenery.
import * as THREE from 'three';
import type { GameMap } from '../sim/map';
import { FOG_EXPLORED, FOG_VISIBLE } from '../sim/vision';

export interface FogUniforms { uFogTex: { value: THREE.Texture }; uMapSize: { value: number }; uFogOn: { value: number } }

const DETAIL_GLSL = `
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h21(i), h21(i+vec2(1.0,0.0)), f.x), mix(h21(i+vec2(0.0,1.0)), h21(i+vec2(1.0,1.0)), f.x), f.y); }
`;
const DETAIL_BODY = `
        {
          vec2 wp = vFogUv * uMapSize;
          float n1 = vn(wp * 0.7), n2 = vn(wp * 2.9), n3 = vn(wp * 9.0);
          diffuseColor.rgb *= 0.78 + 0.36 * n1 + 0.14 * (n2 - 0.5) + 0.08 * (n3 - 0.5);
          vec2 g = abs(fract(wp * 0.25) - 0.5);
          float pl = smoothstep(0.455, 0.5, max(g.x, g.y));
          diffuseColor.rgb *= 1.0 - 0.16 * pl;
          float sn = vn(wp * 0.075 + vec2(n1 * 0.9, 0.0));
          float seam = smoothstep(0.022, 0.0, abs(sn - 0.5));
          float flatness = smoothstep(0.5, 0.9, normalize(vNormal).y);
          totalEmissiveRadiance += vec3(0.08, 0.85, 0.72) * seam * 0.55 * flatness;
        }`;

export function patchFog(mat: THREE.Material, u: FogUniforms, detail = false) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uFogTex = u.uFogTex;
    shader.uniforms.uMapSize = u.uMapSize;
    shader.uniforms.uFogOn = u.uFogOn;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vFogUv;\nuniform float uMapSize;')
      .replace('#include <project_vertex>', `#include <project_vertex>
        vec4 fwp = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          fwp = instanceMatrix * fwp;
        #endif
        fwp = modelMatrix * fwp;
        vFogUv = fwp.xz / uMapSize;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vFogUv;\nuniform sampler2D uFogTex;\nuniform float uFogOn;\nuniform float uMapSize;' + (detail ? DETAIL_GLSL : ''))
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>' + (detail ? DETAIL_BODY : ''))
      .replace('#include <dithering_fragment>', `
        if (uFogOn > 0.5) {
          float fv = texture2D(uFogTex, vFogUv).r;
          vec3 col = gl_FragColor.rgb;
          float lum = dot(col, vec3(0.299, 0.587, 0.114));
          vec3 explored = mix(vec3(lum), col, 0.3) * vec3(0.46, 0.5, 0.58);
          vec3 unseen = vec3(0.012, 0.016, 0.026);
          vec3 c = mix(unseen, explored, smoothstep(0.02, 0.45, fv));
          c = mix(c, col, smoothstep(0.55, 0.95, fv));
          gl_FragColor.rgb = c;
        }
        #include <dithering_fragment>`);
  };
  mat.customProgramCacheKey = () => (detail ? 'fogpatched-detail' : 'fogpatched');
}

function hash2(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  h ^= h >>> 16;
  return ((h >>> 0) % 100000) / 100000;
}
function vnoise(x: number, y: number): number {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy), b = hash2(ix + 1, iy), c = hash2(ix, iy + 1), d = hash2(ix + 1, iy + 1);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}
const fbm = (x: number, y: number) => vnoise(x, y) * 0.55 + vnoise(x * 2.1, y * 2.1) * 0.3 + vnoise(x * 4.3, y * 4.3) * 0.15;

export class Terrain {
  group = new THREE.Group();
  fogTex: THREE.DataTexture;
  fogData: Uint8Array;
  fogDisp: Float32Array;
  uniforms: FogUniforms;
  debugMesh: THREE.Mesh;
  mesh: THREE.Mesh;
  n: number;
  decorMats: THREE.Material[] = [];

  constructor(public map: GameMap) {
    const N = map.size;
    this.n = N;
    this.fogData = new Uint8Array(N * N);
    this.fogDisp = new Float32Array(N * N);
    this.fogTex = new THREE.DataTexture(this.fogData, N, N, THREE.RedFormat, THREE.UnsignedByteType);
    this.fogTex.minFilter = THREE.LinearFilter;
    this.fogTex.magFilter = THREE.LinearFilter;
    this.fogTex.wrapS = this.fogTex.wrapT = THREE.ClampToEdgeWrapping;
    this.fogTex.needsUpdate = true;
    this.uniforms = { uFogTex: { value: this.fogTex }, uMapSize: { value: N }, uFogOn: { value: 1 } };

    const geo = this.buildGeometry();
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0.02 });
    patchFog(mat, this.uniforms, true);
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.receiveShadow = true;
    this.group.add(this.mesh);

    // debug surface overlay
    const tex = this.buildSurfaceTexture();
    const dmat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    this.debugMesh = new THREE.Mesh(geo, dmat);
    this.debugMesh.visible = false;
    this.group.add(this.debugMesh);

    // underlay so no void is ever visible
    const under = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshBasicMaterial({ color: 0x05070a }));
    under.rotation.x = -Math.PI / 2;
    under.position.set(N / 2, -9, N / 2);
    this.group.add(under);
    this.addScenery();
  }

  private buildGeometry(): THREE.BufferGeometry {
    const m = this.map, N = m.size, W = N + 1;
    const pos = new Float32Array(W * W * 3);
    const col = new Float32Array(W * W * 3);
    const uv = new Float32Array(W * W * 2);
    const hv = m.heightV;
    const C = new THREE.Color();
    for (let vy = 0; vy < W; vy++) {
      for (let vx = 0; vx < W; vx++) {
        const i = vy * W + vx;
        const h = hv[i];
        pos[i * 3] = vx; pos[i * 3 + 1] = h; pos[i * 3 + 2] = vy;
        uv[i * 2] = vx / N; uv[i * 2 + 1] = vy / N;
        const hx0 = hv[vy * W + Math.max(0, vx - 1)], hx1 = hv[vy * W + Math.min(N, vx + 1)];
        const hz0 = hv[Math.max(0, vy - 1) * W + vx], hz1 = hv[Math.min(N, vy + 1) * W + vx];
        const slope = Math.hypot(hx1 - hx0, hz1 - hz0) / 2;
        const cx = Math.min(N - 1, vx), cy = Math.min(N - 1, vy);
        const surf = m.surface[cy * N + cx];
        const n1 = fbm(vx * 0.11, vy * 0.11), n2 = vnoise(vx * 0.9, vy * 0.9);
        const t = Math.min(1, Math.max(0, h / 3));
        let r: number, g: number, b: number;
        if (h < -3.2) {
          const d = Math.min(1, (-h - 3.2) / 3.4);
          r = 0.04 * (1 - d) + 0.01; g = 0.07 * (1 - d) + 0.02 + 0.03 * n1; b = 0.1 * (1 - d) + 0.04 + 0.05 * n1;
        } else if (h < -0.4) {
          const k = Math.min(1, (-h - 0.4) / 2.6);
          r = 0.13 - 0.08 * k; g = 0.24 - 0.12 * k; b = 0.26 - 0.1 * k;
          r *= 0.85 + n1 * 0.3; g *= 0.85 + n1 * 0.3; b *= 0.85 + n1 * 0.3;
        } else {
          // basalt ground -> pale mineral shelf
          const s = t * t * (3 - 2 * t);
          const gr = 0.26 + 0.1 * n1 + 0.03 * n2, gg = 0.3 + 0.1 * n1 + 0.03 * n2, gb = 0.36 + 0.11 * n1 + 0.03 * n2;
          const pr = 0.56 + 0.12 * n1 - 0.03 * n2, pg = 0.56 + 0.1 * n1 - 0.03 * n2, pb = 0.5 + 0.09 * n1;
          r = gr + (pr - gr) * s; g = gg + (pg - gg) * s; b = gb + (pb - gb) * s;
          if (h > 4) { r = 0.13 + 0.06 * n1 + 0.03 * n2; g = 0.14 + 0.06 * n1; b = 0.18 + 0.07 * n1; }
          if (slope > 0.4) {
            const k = Math.min(1, (slope - 0.4) * 1.6);
            r += (0.17 + 0.05 * n2 - r) * k; g += (0.16 + 0.04 * n2 - g) * k; b += (0.19 + 0.05 * n2 - b) * k;
          }
          // teal mineral seams
          const seam = Math.abs(vnoise(vx * 0.07 + n1 * 2.5, vy * 0.07) - 0.5);
          if (seam < 0.012 && h > -0.5 && h < 4) {
            const k = 0.55 * (1 - seam / 0.012);
            r += (0.1 - r) * k; g += (0.78 - g) * k; b += (0.68 - b) * k;
          }
          if (surf === 3) { r = r * 0.5 + 0.04; g = g * 0.5 + 0.12; b = b * 0.5 + 0.1; }
          if (surf === 5) { r *= 1.12; g *= 1.12; b *= 1.08; }
        }
        C.setRGB(Math.min(1, r), Math.min(1, g), Math.min(1, b), THREE.SRGBColorSpace);
        col[i * 3] = C.r; col[i * 3 + 1] = C.g; col[i * 3 + 2] = C.b;
      }
    }
    const idx: number[] = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const a = y * W + x, b = a + 1, c = a + W, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  private buildSurfaceTexture(): THREE.DataTexture {
    const N = this.n;
    const d = new Uint8Array(N * N * 4);
    for (let i = 0; i < N * N; i++) {
      const s = this.map.surface[i];
      const c = s === 1 ? [230, 70, 70, 200] : s === 2 ? [70, 110, 255, 200] : s === 3 ? [70, 220, 110, 170] : s === 4 ? [255, 220, 70, 180] : s === 5 ? [255, 150, 60, 150] : [60, 255, 255, 25];
      d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2]; d[i * 4 + 3] = c[3];
    }
    const t = new THREE.DataTexture(d, N, N, THREE.RGBAFormat);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  }

  private addScenery() {
    const m = this.map, N = m.size;
    const dummy = new THREE.Object3D();
    const mkMat = (color: number, emissive = 0, ei = 0) => {
      const mt = new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.05, emissive, emissiveIntensity: ei, flatShading: true });
      patchFog(mt, this.uniforms);
      this.decorMats.push(mt);
      return mt;
    };
    // --- boulders on rock cells and cliff tops
    const rocks: THREE.Matrix4[] = [];
    const crystals: Array<{ m: THREE.Matrix4; c: THREE.Color }> = [];
    for (let y = 2; y < N - 2; y += 2) {
      for (let x = 2; x < N - 2; x += 2) {
        const i = y * N + x;
        const r = hash2(x, y);
        const hh = m.heightC[i];
        if (m.blocked[i] && hh > 4 && r < 0.55) {
          dummy.position.set(x + r, hh + 0.2, y + hash2(y, x));
          const s = 0.8 + hash2(x + 7, y) * 1.4;
          dummy.scale.set(s, s * (0.7 + r), s);
          dummy.rotation.set(r * 6, r * 9, r * 3);
          dummy.updateMatrix(); rocks.push(dummy.matrix.clone());
        }
        // crystal clumps along chasm rims and on rock tops
        if (((m.chasm[i] && r < 0.05) || (m.blocked[i] && hh > 4 && r > 0.93)) && hash2(x, y + 99) < 0.9) {
          const ch = m.chasm[i];
          const count = 1 + Math.floor(hash2(x + 3, y) * 3);
          for (let k = 0; k < count; k++) {
            dummy.position.set(x + hash2(x, y + k) * 2, ch ? m.heightC[i] + 0.5 : hh + 0.6, y + hash2(x + k, y) * 2);
            const s = 0.5 + hash2(x + k, y + k) * 0.9;
            dummy.scale.set(s * 0.5, s * (1.2 + hash2(k, x)), s * 0.5);
            dummy.rotation.set((hash2(k, y) - 0.5) * 0.7, hash2(x, k) * 6, (hash2(y, k) - 0.5) * 0.7);
            dummy.updateMatrix();
            const col = new THREE.Color().setHSL(hash2(x, y) > 0.5 ? 0.47 : 0.74, 0.7, 0.6);
            crystals.push({ m: dummy.matrix.clone(), c: col });
          }
        }
      }
    }
    if (rocks.length) {
      const im = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), mkMat(0x2a2f38), rocks.length);
      rocks.forEach((mx, i) => im.setMatrixAt(i, mx));
      im.castShadow = true; im.receiveShadow = true;
      this.group.add(im);
    }
    if (crystals.length) {
      const cm = mkMat(0xffffff, 0x2a8a80, 0.5);
      const im = new THREE.InstancedMesh(new THREE.OctahedronGeometry(1, 0), cm, crystals.length);
      crystals.forEach((c, i) => { im.setMatrixAt(i, c.m); im.setColorAt(i, c.c); });
      this.group.add(im);
    }
    // --- brush (vision blocking, walkable)
    const brushI: THREE.Matrix4[] = [];
    for (let y = 2; y < N - 2; y++) for (let x = 2; x < N - 2; x++) {
      const i = y * N + x;
      if (!m.brush[i]) continue;
      for (let k = 0; k < 2; k++) {
        const r1 = hash2(x * 3 + k, y), r2 = hash2(x, y * 3 + k);
        dummy.position.set(x + r1, m.heightC[i], y + r2);
        const s = 0.55 + hash2(x + k, y + 5) * 0.55;
        dummy.scale.set(s, 0.9 + hash2(y, x + k) * 0.9, s);
        dummy.rotation.set(0, r1 * 6, 0);
        dummy.updateMatrix(); brushI.push(dummy.matrix.clone());
      }
    }
    if (brushI.length) {
      const bm = mkMat(0x2f5a4c, 0x1c2f56, 0.35);
      const im = new THREE.InstancedMesh(new THREE.ConeGeometry(0.55, 1.6, 5), bm, brushI.length);
      brushI.forEach((mx, i) => im.setMatrixAt(i, mx));
      im.receiveShadow = true;
      this.group.add(im);
    }
    // --- bridges: group bridge cells into rectangles
    const seen = new Uint8Array(N * N);
    const steel = mkMat(0x59626d), dark = mkMat(0x262b32), amber = new THREE.MeshBasicMaterial({ color: 0xffb347 });
    patchFog(amber, this.uniforms);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = y * N + x;
      if (!m.bridge[i] || seen[i]) continue;
      let x1 = x, y1 = y;
      while (x1 + 1 < N && m.bridge[y * N + x1 + 1]) x1++;
      while (y1 + 1 < N && m.bridge[(y1 + 1) * N + x]) y1++;
      for (let yy = y; yy <= y1; yy++) for (let xx = x; xx <= x1; xx++) seen[yy * N + xx] = 1;
      const w = x1 - x + 1, h = y1 - y + 1;
      const cx = x + w / 2, cz = y + h / 2;
      const deck = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, h), steel);
      deck.position.set(cx, 0.1, cz); deck.receiveShadow = true; deck.castShadow = true;
      this.group.add(deck);
      for (const s of [-1, 1]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(w, 0.22, 0.2), dark);
        rail.position.set(cx, 0.45, cz + s * (h / 2 - 0.1)); rail.castShadow = true;
        this.group.add(rail);
        const strip = new THREE.Mesh(new THREE.BoxGeometry(w - 0.4, 0.04, 0.08), amber);
        strip.position.set(cx, 0.27, cz + s * (h / 2 - 0.45));
        this.group.add(strip);
      }
      for (let k = 0; k <= w; k += 4) {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.5, 8, h * 0.5), dark);
        pillar.position.set(x + k, -4, cz);
        this.group.add(pillar);
      }
    }
  }

  /** copy the player's visibility grid into the fog texture, smoothing transitions */
  updateFog(vis: Uint8Array, seen: Uint8Array, all: boolean, dt: number) {
    const N = this.n;
    const k = Math.min(1, dt * 9);
    for (let i = 0; i < N * N; i++) {
      const tgt = all || vis[i] === FOG_VISIBLE ? 1 : seen[i] ? 0.5 : 0;
      const cur = this.fogDisp[i];
      const nv = cur + (tgt - cur) * k;
      this.fogDisp[i] = Math.abs(nv - tgt) < 0.01 ? tgt : nv;
      this.fogData[i] = (this.fogDisp[i] * 255) | 0;
    }
    this.fogTex.needsUpdate = true;
  }
  setFogEnabled(on: boolean) { this.uniforms.uFogOn.value = on ? 1 : 0; }
}

void FOG_EXPLORED;
