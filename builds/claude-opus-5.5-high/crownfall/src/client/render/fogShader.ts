// Team fog-of-war applied to every world material via a shared texture (renderer-side only; the
// authoritative visibility already removed hidden enemies before the snapshot was serialized).
import * as THREE from 'three';
import { FOG_W, FOG_H } from '../../shared/map';

export const fogData = new Uint8Array(FOG_W * FOG_H * 4);
export const fogTexture = new THREE.DataTexture(fogData, FOG_W, FOG_H, THREE.RGBAFormat, THREE.UnsignedByteType);
fogTexture.magFilter = THREE.LinearFilter;
fogTexture.minFilter = THREE.LinearFilter;
fogTexture.needsUpdate = true;
export const fogUniforms = { uFogTex: { value: fogTexture as THREE.Texture }, uFogOn: { value: 1 } };

const VERT_HEAD = 'varying vec2 vFogUv;\n';
const VERT_BODY = `#include <project_vertex>
  vec4 cfW = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
  cfW = instanceMatrix * cfW;
  #endif
  cfW = modelMatrix * cfW;
  vFogUv = vec2((cfW.x + 75.0) / 150.0, (cfW.z + 57.5) / ${FOG_H.toFixed(1)});`;
const FRAG_HEAD = 'uniform sampler2D uFogTex;\nuniform float uFogOn;\nvarying vec2 vFogUv;\n';
const FRAG_BODY = `#include <dithering_fragment>
  float cfV = mix(1.0, texture2D(uFogTex, vFogUv).r, uFogOn);
  gl_FragColor.rgb = mix(gl_FragColor.rgb * vec3(0.30, 0.34, 0.50), gl_FragColor.rgb, cfV);`;

export function patchFog<T extends THREE.Material>(mat: T): T {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uFogTex = fogUniforms.uFogTex;
    shader.uniforms.uFogOn = fogUniforms.uFogOn;
    shader.vertexShader = VERT_HEAD + shader.vertexShader.replace('#include <project_vertex>', VERT_BODY);
    shader.fragmentShader = FRAG_HEAD + shader.fragmentShader.replace('#include <dithering_fragment>', FRAG_BODY);
  };
  mat.customProgramCacheKey = () => 'cf-fog';
  return mat;
}

export function lambert(color: number | THREE.Color, opts: THREE.MeshLambertMaterialParameters = {}) {
  return patchFog(new THREE.MeshLambertMaterial({ color, ...opts }));
}

/** Smoothly blend the received team fog bits into the texture (anti-flicker). */
const fogTarget = new Uint8Array(FOG_W * FOG_H);
export function setFogTarget(vis: Uint8Array) { fogTarget.set(vis); }
export function stepFog(dt: number) {
  const k = Math.min(1, dt * 8);
  for (let i = 0; i < fogTarget.length; i++) {
    const cur = fogData[i * 4];
    const tgt = fogTarget[i] ? 255 : 0;
    if (cur !== tgt) {
      const v = cur + (tgt - cur) * k;
      const n = Math.abs(tgt - v) < 3 ? tgt : v;
      fogData[i * 4] = n; fogData[i * 4 + 1] = n; fogData[i * 4 + 2] = n; fogData[i * 4 + 3] = 255;
    }
  }
  fogTexture.needsUpdate = true;
}
export function getFogTarget() { return fogTarget; }

/** Foreground fade: fragments between the camera and the focus hero dither out so props never hide units. */
export const fadeUniforms = { uFocus: { value: new THREE.Vector3(0, -100, 0) }, uCamPos: { value: new THREE.Vector3() } };
export function patchFogFade<T extends THREE.Material>(mat: T): T {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uFogTex = fogUniforms.uFogTex;
    shader.uniforms.uFogOn = fogUniforms.uFogOn;
    shader.uniforms.uFocus = fadeUniforms.uFocus;
    shader.uniforms.uCamPos = fadeUniforms.uCamPos;
    shader.vertexShader = 'varying vec3 vCfWorld;\n' + VERT_HEAD + shader.vertexShader.replace('#include <project_vertex>', VERT_BODY + '\n  vCfWorld = cfW.xyz;');
    shader.fragmentShader = 'uniform vec3 uFocus; uniform vec3 uCamPos; varying vec3 vCfWorld;\n' + FRAG_HEAD + shader.fragmentShader.replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
  {
    vec3 ab = uCamPos - uFocus; float t = clamp(dot(vCfWorld - uFocus, ab) / dot(ab, ab), 0.0, 1.0);
    float d = length(vCfWorld - (uFocus + ab * t));
    float fade = smoothstep(2.6, 4.2, d);
    float dither = fract(sin(dot(floor(gl_FragCoord.xy), vec2(12.9898, 78.233))) * 43758.5453);
    if (t > 0.02 && fade < dither * 0.85 + 0.1) discard;
  }`).replace('#include <dithering_fragment>', FRAG_BODY);
  };
  mat.customProgramCacheKey = () => 'cf-fog-fade';
  return mat;
}
