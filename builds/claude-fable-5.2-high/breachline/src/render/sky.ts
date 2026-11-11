// renderer: procedural sky dome (storm-cleared blue with drifting cloud bands and sea mist) and the ocean plane.
import { Color3, CreateGround, CreateSphere, Effect, Mesh, Scene, ShaderMaterial, StandardMaterial, Texture, Vector3 } from './bjs';
import { canvasTexture } from './textures';

Effect.ShadersStore.blSkyVertexShader = `
precision highp float;
attribute vec3 position;
uniform mat4 worldViewProjection;
varying vec3 vDir;
void main(void) {
  vDir = position;
  gl_Position = worldViewProjection * vec4(position, 1.0);
}`;

Effect.ShadersStore.blSkyFragmentShader = `
precision highp float;
varying vec3 vDir;
uniform vec3 sunDir;
uniform float time;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}
void main(void) {
  vec3 d = normalize(vDir);
  float h = clamp(d.y, -0.2, 1.0);
  vec3 zenith = vec3(0.16, 0.42, 0.78);
  vec3 mid = vec3(0.42, 0.68, 0.93);
  vec3 horizon = vec3(0.86, 0.93, 0.97);
  vec3 col = mix(horizon, mid, smoothstep(0.0, 0.22, h));
  col = mix(col, zenith, smoothstep(0.18, 0.95, h));
  float sd = max(dot(d, sunDir), 0.0);
  col += vec3(1.0, 0.86, 0.62) * (pow(sd, 6.0) * 0.22 + pow(sd, 48.0) * 0.4 + pow(sd, 1400.0) * 6.0);
  if (d.y > 0.01) {
    vec2 uv = d.xz / (d.y + 0.12) * 0.9 + vec2(time * 0.006, time * 0.002);
    float c = fbm(uv * 1.3);
    float c2 = fbm(uv * 3.1 + 4.0);
    float cover = smoothstep(0.5, 0.82, c * 0.75 + c2 * 0.35);
    float fade = smoothstep(0.01, 0.2, d.y);
    vec3 cloud = mix(vec3(0.78, 0.83, 0.9), vec3(1.0, 0.99, 0.96), smoothstep(0.4, 0.9, c2 + sd * 0.4));
    col = mix(col, cloud, cover * fade * 0.85);
  }
  // sea mist band at the horizon
  col = mix(col, vec3(0.9, 0.95, 0.98), (1.0 - smoothstep(0.0, 0.09, abs(d.y))) * 0.75);
  if (d.y < 0.0) col = mix(col, vec3(0.62, 0.76, 0.84), smoothstep(0.0, -0.12, d.y));
  gl_FragColor = vec4(col, 1.0);
}`;

export class Sky {
  dome: Mesh;
  ocean: Mesh;
  private mat: ShaderMaterial;
  private oceanMat: StandardMaterial;
  private t = 0;

  constructor(scene: Scene, sunDir: Vector3, waterY: number) {
    this.dome = CreateSphere('sky', { diameter: 1800, segments: 24, sideOrientation: Mesh.BACKSIDE }, scene);
    this.mat = new ShaderMaterial('skyMat', scene, { vertex: 'blSky', fragment: 'blSky' }, { attributes: ['position'], uniforms: ['worldViewProjection', 'sunDir', 'time'] });
    this.mat.setVector3('sunDir', sunDir.scale(-1).normalize());
    this.mat.setFloat('time', 0);
    this.mat.backFaceCulling = false;
    this.mat.disableDepthWrite = true;
    this.dome.material = this.mat;
    this.dome.infiniteDistance = true;
    this.dome.isPickable = false;
    this.dome.applyFog = false;
    this.dome.renderingGroupId = 0;
    this.dome.alwaysSelectAsActiveMesh = true;

    this.ocean = CreateGround('ocean', { width: 2400, height: 2400, subdivisions: 2 }, scene);
    this.ocean.position.y = waterY;
    const m = (this.oceanMat = new StandardMaterial('oceanMat', scene));
    m.diffuseColor = new Color3(0.05, 0.22, 0.33);
    m.emissiveColor = new Color3(0.02, 0.09, 0.13);
    m.specularColor = new Color3(0.9, 0.85, 0.75);
    m.specularPower = 180;
    const bump = canvasTexture(scene, 'oceanBump', 256, 256, (g) => {
      // tiling ripple height field rendered as a normal map
      const s = 256;
      const h = new Float32Array(s * s);
      const waves: [number, number, number, number][] = [];
      let seed = 7;
      const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (let i = 0; i < 26; i++) waves.push([Math.round((r() - 0.5) * 12), Math.round((r() - 0.5) * 12), r() * 6.28, 0.3 + r()]);
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        let v = 0;
        for (const w of waves) v += Math.sin(((x * w[0] + y * w[1]) / s) * 6.2832 + w[2]) * w[3] / (1 + Math.abs(w[0]) + Math.abs(w[1]));
        h[y * s + x] = v;
      }
      const img = g.createImageData(s, s);
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const dx = (h[y * s + ((x + 1) % s)] - h[y * s + ((x + s - 1) % s)]) * 5, dy = (h[((y + 1) % s) * s + x] - h[((y + s - 1) % s) * s + x]) * 5;
        const l = 1 / Math.sqrt(dx * dx + dy * dy + 1);
        const o = (y * s + x) * 4;
        img.data[o] = (-dx * l * 0.5 + 0.5) * 255; img.data[o + 1] = (-dy * l * 0.5 + 0.5) * 255; img.data[o + 2] = (l * 0.5 + 0.5) * 255; img.data[o + 3] = 255;
      }
      g.putImageData(img, 0, 0);
    }, false);
    bump.wrapU = Texture.WRAP_ADDRESSMODE; bump.wrapV = Texture.WRAP_ADDRESSMODE;
    bump.uScale = 55; bump.vScale = 55;
    bump.anisotropicFilteringLevel = 8;
    m.bumpTexture = bump;
    this.ocean.material = m;
    this.ocean.isPickable = false;
    this.ocean.receiveShadows = false;
  }

  update(dt: number): void {
    this.t += dt;
    this.mat.setFloat('time', this.t);
    const b = this.oceanMat.bumpTexture as Texture;
    b.uOffset = (this.t * 0.012) % 1;
    b.vOffset = (this.t * 0.007) % 1;
  }
}
