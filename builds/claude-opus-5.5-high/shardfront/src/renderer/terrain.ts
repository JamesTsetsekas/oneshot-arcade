// Terrain mesh (merged, single draw call) with vertex-colored materials and a fog-of-war /
// debug-overlay shader patch. Gameplay elevation is discrete; rendering is smoothly sculpted.
import * as THREE from 'three';
import { F_BRUSH, F_BUILD, F_CHASM, F_CLIFF, F_RAMP, F_ROCK, F_WALK, type GameMap } from '../world/map';

export interface TerrainView {
  mesh: THREE.Mesh;
  fogTex: THREE.DataTexture;
  debugTex: THREE.DataTexture;
  uniforms: { uDebug: { value: number }; uFogEnabled: { value: number } };
}

function noise(x: number, y: number) {
  return Math.sin(x * 0.71 + Math.sin(y * 0.33) * 2.1) * 0.5 + Math.sin(y * 0.57 - x * 0.21) * 0.5;
}

export function buildTerrain(map: GameMap): TerrainView {
  const N = map.size, V = N + 1;
  const pos = new Float32Array(V * V * 3);
  const col = new Float32Array(V * V * 3);
  const c = new THREE.Color();
  const basaltLow = new THREE.Color('#363b44'), basaltMid = new THREE.Color('#596069'), shelf = new THREE.Color('#857f74');
  const cliffC = new THREE.Color('#1d1f24'), rampC = new THREE.Color('#5f5a51'), brushC = new THREE.Color('#1f3b3a');
  const seam = new THREE.Color('#2ad4c4'), chasmC = new THREE.Color('#0a1a20'), rockC = new THREE.Color('#35383f');
  const cellAt = (x: number, y: number) => map.flags[Math.min(N - 1, Math.max(0, y)) * N + Math.min(N - 1, Math.max(0, x))];
  const lvlAt = (x: number, y: number) => map.level[Math.min(N - 1, Math.max(0, y)) * N + Math.min(N - 1, Math.max(0, x))];
  for (let y = 0; y < V; y++) for (let x = 0; x < V; x++) {
    const i = y * V + x;
    pos[i * 3] = x; pos[i * 3 + 1] = map.vheight[i]; pos[i * 3 + 2] = y;
    // average the four surrounding cells' classification
    let r = 0, g = 0, b = 0;
    for (const [ox, oy] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) {
      const f = cellAt(x + ox, y + oy), lv = lvlAt(x + ox, y + oy);
      if (f & F_CHASM) c.copy(chasmC);
      else if (f & F_ROCK) c.copy(rockC);
      else if (f & F_CLIFF) c.copy(cliffC);
      else if (f & F_RAMP) c.copy(rampC);
      else c.copy(lv === 2 ? shelf : lv === 1 ? basaltMid : basaltLow);
      if (f & F_BRUSH) c.lerp(brushC, 0.75);
      r += c.r; g += c.g; b += c.b;
    }
    c.setRGB(r / 4, g / 4, b / 4);
    const n = noise(x, y);
    c.multiplyScalar(0.9 + 0.12 * n);
    // teal crystalline seams on the lower ground and along cliff bases
    const s = Math.abs(Math.sin(x * 0.19 + y * 0.07 + Math.sin(y * 0.11) * 3));
    const lv = lvlAt(x, y);
    if (lv === 0 && s < 0.05 && !(cellAt(x, y) & F_CHASM)) c.lerp(seam, 0.55);
    if (lv === 2 && s < 0.03) c.lerp(new THREE.Color('#b7b0a2'), 0.6);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  const idx: number[] = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const a = y * V + x, b = a + 1, d = a + V, e = d + 1;
    idx.push(a, d, b, b, d, e);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();

  const fogData = new Uint8Array(N * N * 4);
  const fogTex = new THREE.DataTexture(fogData, N, N, THREE.RGBAFormat);
  fogTex.magFilter = THREE.LinearFilter; fogTex.minFilter = THREE.LinearFilter;
  fogTex.needsUpdate = true;
  const dbg = new Uint8Array(N * N * 4);
  for (let i = 0; i < N * N; i++) {
    const f = map.flags[i];
    let rgb = [0, 0, 0, 0];
    if (f & F_CHASM) rgb = [80, 120, 255, 200];          // hover-only
    else if (!(f & F_WALK)) rgb = [255, 60, 60, 200];     // blocked
    else if (f & F_BRUSH) rgb = [60, 230, 90, 200];       // vision blocking
    else if (f & F_BUILD) rgb = [255, 255, 255, 60];      // buildable
    else rgb = [255, 200, 60, 140];                       // walkable, not buildable
    dbg.set(rgb, i * 4);
  }
  const debugTex = new THREE.DataTexture(dbg, N, N, THREE.RGBAFormat);
  debugTex.magFilter = THREE.NearestFilter; debugTex.needsUpdate = true;

  const uniforms = { uFog: { value: fogTex }, uDbg: { value: debugTex }, uDebug: { value: 0 }, uFogEnabled: { value: 1 }, uSize: { value: N } };
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0.04 });
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWorldP;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWorldP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWorldP;\nuniform sampler2D uFog;\nuniform sampler2D uDbg;\nuniform float uDebug;\nuniform float uFogEnabled;\nuniform float uSize;')
      .replace('#include <dithering_fragment>', `#include <dithering_fragment>
      vec2 fuv = vWorldP.xz / uSize;
      vec2 tx = vec2(1.0 / uSize);
      vec4 fg = texture2D(uFog, fuv) * 0.4 + (texture2D(uFog, fuv + vec2(tx.x, 0.0)) + texture2D(uFog, fuv - vec2(tx.x, 0.0)) + texture2D(uFog, fuv + vec2(0.0, tx.y)) + texture2D(uFog, fuv - vec2(0.0, tx.y))) * 0.15;
      float vis = fg.r; float exp = fg.g;
      float lum = dot(gl_FragColor.rgb, vec3(0.3, 0.59, 0.11));
      vec3 explored = mix(vec3(lum), gl_FragColor.rgb, 0.35) * 0.5;
      vec3 unexplored = gl_FragColor.rgb * 0.07 + vec3(0.01, 0.015, 0.02);
      vec3 fogged = mix(unexplored, explored, exp);
      if (uFogEnabled > 0.5) gl_FragColor.rgb = mix(fogged, gl_FragColor.rgb, vis);
      if (vWorldP.y < -1.5) gl_FragColor.rgb += vec3(0.01, 0.07, 0.08) * clamp((-1.5 - vWorldP.y) * 0.3, 0.0, 1.0) * (0.4 + 0.6 * vis);
      if (uDebug > 0.5) { vec4 d = texture2D(uDbg, fuv); gl_FragColor.rgb = mix(gl_FragColor.rgb, d.rgb, d.a / 255.0 * 0.0 + d.a * 0.6); }
      `);
  };
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  return { mesh, fogTex, debugTex, uniforms };
}

/** Write the viewer's visibility into the fog texture with temporal smoothing. */
export function updateFog(view: TerrainView, visible: Uint8Array, explored: Uint8Array, smooth: Float32Array, dt: number, revealAll: boolean) {
  const data = view.fogTex.image.data as Uint8Array;
  const n = visible.length;
  const k = Math.min(1, dt * 8);
  for (let i = 0; i < n; i++) {
    const target = revealAll || visible[i] ? 1 : 0;
    smooth[i] += (target - smooth[i]) * k;
    data[i * 4] = (smooth[i] * 255) | 0;
    data[i * 4 + 1] = revealAll || explored[i] ? 255 : 0;
  }
  view.fogTex.needsUpdate = true;
}
