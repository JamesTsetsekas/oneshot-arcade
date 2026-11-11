import { Color3, Effect, MeshBuilder, Scene, ShaderMaterial, Vector3 } from '@babylonjs/core';
import type { Mesh } from '@babylonjs/core';
import { clamp, lerp, smoothstep } from '../core/math';

export interface Atmos {
  sunDir: Vector3;          // direction TO the light source (sun or moon)
  sunColor: Color3;
  sunIntensity: number;
  ambient: Color3;
  ambientGround: Color3;
  skyTop: Color3;
  skyHorizon: Color3;
  fogColor: Color3;
  fogDensity: number;
  night: number;            // 0 day .. 1 night
  daylight: number;
  isSun: boolean;
  exposure: number;
}

const mix = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const c3 = (a: [number, number, number]): Color3 => new Color3(a[0], a[1], a[2]);

/** Time of day -> lighting. Hour 6 = sunrise (east), 12 zenith, 18 sunset (west). */
export function atmosphereAt(hour: number, rain: number): Atmos {
  const ang = ((hour - 6) / 13.5) * Math.PI;
  const sun = new Vector3(Math.cos(ang), Math.sin(ang) * 0.9, -0.38).normalize();
  const elev = sun.y;
  const day = smoothstep(-0.08, 0.22, elev);
  const golden = day * (1 - smoothstep(0.1, 0.55, elev));
  const night = 1 - day;
  const isSun = elev > -0.06;
  const dir = isSun ? sun : new Vector3(-sun.x, Math.abs(sun.y) * 0.9 + 0.35, 0.3).normalize();

  let sunCol = mix([1.0, 0.95, 0.85], [1.0, 0.58, 0.28], golden);
  sunCol = mix([0.38, 0.5, 0.9], sunCol, day);
  let sunI = lerp(0.3, 1.75, day) * (1 - 0.25 * golden);
  let amb = mix([0.58, 0.66, 0.8], [0.62, 0.52, 0.5], golden);
  amb = mix([0.07, 0.09, 0.19], amb, day);
  let ambG = mix([0.4, 0.38, 0.34], [0.38, 0.28, 0.22], golden);
  ambG = mix([0.035, 0.04, 0.07], ambG, day);
  let top = mix([0.26, 0.5, 0.88], [0.22, 0.36, 0.64], golden);
  top = mix([0.015, 0.03, 0.09], top, day);
  let hor = mix([0.76, 0.87, 0.96], [1.0, 0.56, 0.3], golden);
  hor = mix([0.06, 0.09, 0.19], hor, day);
  const grey: [number, number, number] = [0.32 * (0.25 + day), 0.35 * (0.25 + day), 0.4 * (0.25 + day)];
  const r = rain * 0.65;
  top = mix(top, grey, r);
  hor = mix(hor, [grey[0] * 1.15, grey[1] * 1.15, grey[2] * 1.2], r);
  sunI *= 1 - 0.45 * rain;
  amb = mix(amb, [amb[0] * 0.85, amb[1] * 0.9, amb[2]], rain);
  const fog = mix(hor, top, 0.12);
  return {
    sunDir: dir, sunColor: c3(sunCol), sunIntensity: sunI, ambient: c3(amb), ambientGround: c3(ambG), skyTop: c3(top), skyHorizon: c3(hor),
    fogColor: c3(fog), fogDensity: 0.0011 + 0.0007 * golden + 0.0022 * rain + 0.0004 * night, night, daylight: day, isSun, exposure: lerp(1.05, 0.95, night) + 0.0,
  };
}

const SKY_VS = `
precision highp float;
attribute vec3 position;
uniform mat4 worldViewProjection;
varying vec3 vDir;
void main(){ vDir = position; vec4 p = worldViewProjection * vec4(position,1.0); gl_Position = p.xyww; }`;
const SKY_FS = `
precision highp float;
varying vec3 vDir;
uniform vec3 topColor; uniform vec3 horizonColor; uniform vec3 sunDir; uniform vec3 sunColor; uniform float night; uniform float time; uniform float rain;
float hash(vec3 p){ p = fract(p*0.3183099+vec3(0.1,0.2,0.3)); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float noise(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); f=f*f*(3.0-2.0*f);
  float a=fract(sin(dot(i,vec2(12.9898,78.233)))*43758.5453); float b=fract(sin(dot(i+vec2(1,0),vec2(12.9898,78.233)))*43758.5453);
  float c=fract(sin(dot(i+vec2(0,1),vec2(12.9898,78.233)))*43758.5453); float d=fract(sin(dot(i+vec2(1,1),vec2(12.9898,78.233)))*43758.5453);
  return mix(mix(a,b,f.x),mix(c,d,f.x),f.y); }
void main(){
  vec3 d = normalize(vDir);
  float h = clamp(d.y, -0.2, 1.0);
  vec3 col = mix(horizonColor, topColor, pow(max(h,0.0), 0.55));
  col = mix(col, horizonColor*0.8, smoothstep(0.0,-0.2,d.y));
  float sd = max(dot(d, normalize(sunDir)), 0.0);
  col += sunColor * (pow(sd, 900.0)*5.0 + pow(sd, 18.0)*0.35 + pow(sd, 4.0)*0.12) * (1.0 - night*0.55);
  // clouds
  if (d.y > 0.02) {
    vec2 uv = d.xz / (d.y + 0.25) * 1.3 + vec2(time*0.004, 0.0);
    float n = noise(uv*2.0)*0.55 + noise(uv*4.3)*0.3 + noise(uv*9.1)*0.15;
    float cl = smoothstep(0.5 - rain*0.25, 0.85, n) * smoothstep(0.02, 0.3, d.y);
    vec3 cc = mix(horizonColor*1.1 + vec3(0.1), vec3(0.25)*(1.0-night*0.7), rain);
    col = mix(col, cc, cl*(0.55+rain*0.4));
  }
  // stars
  if (night > 0.3 && d.y > 0.0) {
    float s = step(0.9975, hash(floor(d*220.0)));
    col += vec3(s) * night * (1.0 - rain) * smoothstep(0.0,0.2,d.y);
  }
  gl_FragColor = vec4(col, 1.0);
}`;

export function createSky(scene: Scene): { mesh: Mesh; material: ShaderMaterial } {
  Effect.ShadersStore['skyVertexShader'] = SKY_VS;
  Effect.ShadersStore['skyFragmentShader'] = SKY_FS;
  const mat = new ShaderMaterial('sky', scene, 'sky', {
    attributes: ['position'], uniforms: ['worldViewProjection', 'topColor', 'horizonColor', 'sunDir', 'sunColor', 'night', 'time', 'rain'],
  });
  mat.backFaceCulling = false;
  mat.disableDepthWrite = true;
  const mesh = MeshBuilder.CreateSphere('sky', { diameter: 2000, segments: 16, sideOrientation: 1 }, scene);
  mesh.material = mat;
  mesh.infiniteDistance = true;
  mesh.isPickable = false;
  mesh.renderingGroupId = 0;
  mesh.alwaysSelectAsActiveMesh = true;
  return { mesh, material: mat };
}

export function applySky(mat: ShaderMaterial, a: Atmos, time: number, rain: number): void {
  mat.setColor3('topColor', a.skyTop);
  mat.setColor3('horizonColor', a.skyHorizon);
  mat.setVector3('sunDir', a.sunDir);
  mat.setColor3('sunColor', a.sunColor);
  mat.setFloat('night', a.night);
  mat.setFloat('time', time);
  mat.setFloat('rain', rain);
}

void clamp;
