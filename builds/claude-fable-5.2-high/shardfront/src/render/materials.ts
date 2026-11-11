// renderer: shared uniforms and shader patches (fog of war, team colour mask, emissive mask, gait animation,
// construction clipping, dissolve). Patches extend three.js standard materials via onBeforeCompile.
import * as THREE from 'three';
import { MAP_SIZE } from '../world/map';

export const shared = {
  uTime: { value: 0 },
  uFog: { value: null as THREE.Texture | null },
  uMapSize: { value: MAP_SIZE },
  uFogOn: { value: 1 },
};

const WORLD_VARYING = /* glsl */ `
  varying vec3 vSfWorld;
`;
const WORLD_VERTEX = /* glsl */ `
  #include <project_vertex>
  vec4 sfWorld = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
    sfWorld = instanceMatrix * sfWorld;
  #endif
  sfWorld = modelMatrix * sfWorld;
  vSfWorld = sfWorld.xyz;
`;
const FOG_FRAGMENT = /* glsl */ `
  #include <opaque_fragment>
  {
    float sfFow = texture2D(uFog, vSfWorld.xz / uMapSize).r;
    gl_FragColor.rgb *= mix(1.0, sfFow, uFogOn);
  }
`;

/** Entity material: instanced, team mask, glow mask, legs, construction clip, dissolve, hit flash, fog. */
export function makeEntityMaterial(modelHeight: number): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.72, metalness: 0.12 });
  const uModelH = { value: modelHeight };
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = shared.uTime;
    sh.uniforms.uFog = shared.uFog;
    sh.uniforms.uMapSize = shared.uMapSize;
    sh.uniforms.uFogOn = shared.uFogOn;
    sh.uniforms.uModelH = uModelH;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', /* glsl */ `#include <common>
        attribute float aTeam; attribute float aGlow; attribute vec2 aAnim;
        attribute vec3 iTeam; attribute vec4 iFx; attribute vec4 iFx2;
        uniform float uTime;
        varying float vTeam; varying float vGlow; varying vec3 vTeamCol; varying vec4 vFx; varying vec4 vFx2; varying float vLocalY;
        ${WORLD_VARYING}`)
      .replace('#include <begin_vertex>', /* glsl */ `
        vec3 transformed = vec3(position);
        float sfSw = aAnim.x * iFx.z;
        float sfPh = uTime * iFx2.y + aAnim.y + iFx.w;
        transformed.z += sin(sfPh) * sfSw;
        transformed.y += max(0.0, cos(sfPh)) * sfSw * 0.45;
        vTeam = aTeam; vGlow = aGlow; vTeamCol = iTeam; vFx = iFx; vFx2 = iFx2; vLocalY = position.y;`)
      .replace('#include <project_vertex>', WORLD_VERTEX);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', /* glsl */ `#include <common>
        uniform sampler2D uFog; uniform float uMapSize; uniform float uFogOn; uniform float uModelH;
        varying float vTeam; varying float vGlow; varying vec3 vTeamCol; varying vec4 vFx; varying vec4 vFx2; varying float vLocalY;
        ${WORLD_VARYING}`)
      .replace('#include <color_fragment>', /* glsl */ `#include <color_fragment>
        diffuseColor.rgb = mix(diffuseColor.rgb, vTeamCol, vTeam);
        float sfGlow = vGlow;
        if (vFx.y < 0.999) {
          float lim = vFx.y * uModelH;
          if (vLocalY > lim + 0.03) discard;
          float edge = smoothstep(lim - 0.3, lim, vLocalY);
          diffuseColor.rgb = mix(diffuseColor.rgb * 0.7, vec3(0.55, 0.9, 1.0), edge * 0.85);
          sfGlow = max(sfGlow * 0.3, edge * 0.45);
        }
        if (vFx2.z < 0.999) {
          float n = fract(sin(dot(floor(gl_FragCoord.xy), vec2(12.9898, 78.233))) * 43758.5453);
          if (n > vFx2.z) discard;
        }
        if (vFx2.x > 0.5) {
          float l = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11));
          diffuseColor.rgb = mix(vec3(l), vec3(0.32, 0.4, 0.5), 0.55);
          sfGlow *= 0.15;
        }`)
      .replace('#include <emissivemap_fragment>', /* glsl */ `#include <emissivemap_fragment>
        totalEmissiveRadiance += diffuseColor.rgb * sfGlow * (0.95 + vFx2.w);`)
      .replace('#include <opaque_fragment>', /* glsl */ `${FOG_FRAGMENT}
        gl_FragColor.rgb += vec3(1.0, 0.93, 0.8) * vFx.x * 0.75;`);
  };
  mat.customProgramCacheKey = () => 'sf-entity';
  return mat;
}

/** Terrain / prop material: vertex colours, optional emissive mask (aGlow), fog of war. */
export function makeWorldMaterial(opts: { glow?: boolean; rough?: number; flat?: boolean; grid?: boolean } = {}): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: opts.flat ?? true, roughness: opts.rough ?? 0.92, metalness: 0.02 });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uFog = shared.uFog;
    sh.uniforms.uMapSize = shared.uMapSize;
    sh.uniforms.uFogOn = shared.uFogOn;
    sh.uniforms.uTime = shared.uTime;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>\n${opts.glow ? 'attribute float aGlow; varying float vGlow;' : ''}\n${WORLD_VARYING}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n${opts.glow ? 'vGlow = aGlow;' : ''}`)
      .replace('#include <project_vertex>', WORLD_VERTEX);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform sampler2D uFog; uniform float uMapSize; uniform float uFogOn; uniform float uTime;\n${opts.glow ? 'varying float vGlow;' : ''}\n${WORLD_VARYING}`)
      .replace('#include <color_fragment>', /* glsl */ `#include <color_fragment>
        ${opts.grid ? /* glsl */ `{
          // procedural surface detail: soft cell seams + fine mineral grain
          vec2 g = abs(fract(vSfWorld.xz) - 0.5);
          float seam = smoothstep(0.47, 0.5, max(g.x, g.y));
          float grain = fract(sin(dot(floor(vSfWorld.xz * 3.0), vec2(127.1, 311.7))) * 43758.5453);
          diffuseColor.rgb *= 1.0 - seam * 0.07;
          diffuseColor.rgb *= 0.94 + grain * 0.12;
        }` : ''}`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\n${opts.glow ? 'totalEmissiveRadiance += diffuseColor.rgb * vGlow * (1.25 + 0.2 * sin(uTime * 1.3 + vSfWorld.x * 0.4 + vSfWorld.z * 0.3));' : ''}`)
      .replace('#include <opaque_fragment>', FOG_FRAGMENT);
  };
  mat.customProgramCacheKey = () => `sf-world-${opts.glow ? 1 : 0}-${opts.grid ? 1 : 0}`;
  return mat;
}
