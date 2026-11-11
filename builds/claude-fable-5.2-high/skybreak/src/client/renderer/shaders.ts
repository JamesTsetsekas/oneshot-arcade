// Procedural GLSL for sky, void-sea and the Riftstorm wall. No textures are shipped.

const NOISE = `
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x), mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),f.x), f.y); }
float fbm(vec2 p){ float a=0.5; float s=0.0; for(int i=0;i<4;i++){ s+=a*noise(p); p*=2.03; a*=0.5; } return s; }
`;

export const SKY_VS = `
precision highp float;
attribute vec3 position;
uniform mat4 worldViewProjection;
varying vec3 vDir;
void main(){ vDir = position; gl_Position = worldViewProjection * vec4(position, 1.0); }
`;

export const SKY_FS = `
precision highp float;
varying vec3 vDir;
uniform float time;
uniform vec3 sunDir;
uniform float storm;
${NOISE}
vec2 hash2(vec2 p){ return fract(sin(vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3))))*43758.5453); }
float voronoiEdge(vec2 x){
  vec2 n=floor(x); vec2 f=fract(x); vec2 mg=vec2(0.0); vec2 mr=vec2(0.0); float md=8.0;
  for(int j=-1;j<=1;j++){ for(int i=-1;i<=1;i++){ vec2 g=vec2(float(i),float(j)); vec2 o=hash2(n+g); vec2 r=g+o-f; float d=dot(r,r); if(d<md){ md=d; mr=r; mg=g; } } }
  md=8.0;
  for(int j=-2;j<=2;j++){ for(int i=-2;i<=2;i++){ vec2 g=mg+vec2(float(i),float(j)); vec2 o=hash2(n+g); vec2 r=g+o-f;
    if(dot(mr-r,mr-r)>0.00001){ md=min(md, dot(0.5*(mr+r), normalize(r-mr))); } } }
  return md;
}
void main(){
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 zen = vec3(0.10,0.42,0.80); vec3 mid = vec3(0.30,0.72,0.90); vec3 hor = vec3(0.70,0.89,0.90);
  vec3 col = mix(hor, mid, smoothstep(0.0, 0.22, h));
  col = mix(col, zen, smoothstep(0.18, 0.85, h));
  col = mix(col, vec3(0.72,0.90,0.92), smoothstep(0.03, -0.08, h));
  float sd = max(dot(d, normalize(sunDir)), 0.0);
  col += vec3(1.0,0.94,0.78) * (pow(sd, 420.0)*1.6 + pow(sd, 14.0)*0.20);
  if (h > 0.015) {
    vec2 uv = d.xz / (h + 0.2) * 1.3 + vec2(time*0.004, time*0.002);
    float c = fbm(uv*1.25 + fbm(uv*0.6 + 7.0)*0.7);
    float cl = smoothstep(0.50, 0.74, c) * smoothstep(0.015, 0.2, h);
    float shade = smoothstep(0.55, 0.9, fbm(uv*1.25 + 0.35));
    col = mix(col, mix(vec3(1.0,0.99,0.96), vec3(0.80,0.88,0.95), shade*0.6), cl*0.9);
    // the fracture: luminous seams across the upper sky
    vec2 fv = d.xz / (h + 0.4) * 2.0;
    float e = voronoiEdge(fv + 4.0);
    float mask = smoothstep(0.08, 0.5, h) * (1.0 - cl);
    float pulse = 0.6 + 0.4*sin(time*0.5 + fv.x*2.0 + fv.y*1.3);
    col += vec3(0.78,1.0,0.97) * smoothstep(0.018, 0.0, e) * (0.15 + 0.12*pulse) * mask;
    col += vec3(0.55,0.45,1.0) * smoothstep(0.12, 0.0, e) * 0.045 * mask;
  }
  col = mix(col, col*vec3(0.74,0.66,0.96) + vec3(0.05,0.02,0.10), storm*0.6);
  gl_FragColor = vec4(col, 1.0);
}
`;

export const SEA_VS = `
precision highp float;
attribute vec3 position;
uniform mat4 world;
uniform mat4 worldViewProjection;
varying vec3 vPos;
void main(){ vec4 w = world * vec4(position, 1.0); vPos = w.xyz; gl_Position = worldViewProjection * vec4(position, 1.0); }
`;

export const SEA_FS = `
precision highp float;
varying vec3 vPos;
uniform float time;
uniform vec3 camPos;
uniform float storm;
${NOISE}
void main(){
  vec2 p = vPos.xz;
  // long, soft swells with thin crest lines: calm void-sea, not noise
  float w1 = noise(p*0.035 + vec2(time*0.06, time*0.035));
  float w2 = noise(p*0.11 - vec2(time*0.09, time*0.07));
  float w = w1*0.6 + w2*0.4;
  vec3 deep = vec3(0.06,0.36,0.54); vec3 shallow = vec3(0.14,0.58,0.68);
  vec3 col = mix(deep, shallow, smoothstep(0.25,0.85,w)*0.5);
  float crest = smoothstep(0.50, 0.525, w2) * (1.0 - smoothstep(0.525, 0.58, w2));
  col += vec3(0.75,0.95,1.0) * crest * 0.10;
  float sp = smoothstep(0.80, 0.90, noise(p*0.9 + vec2(time*0.3, -time*0.2)));
  col += vec3(0.9,1.0,1.0) * sp * 0.10;
  vec3 v = normalize(camPos - vPos);
  float fres = pow(1.0 - max(v.y, 0.0), 3.0);
  col = mix(col, vec3(0.62,0.88,0.93), fres*0.55);
  float dist = length(camPos - vPos);
  float fog = clamp(1.0 - exp(-pow(dist*0.00105, 2.0)), 0.0, 1.0);
  col = mix(col, vec3(0.72,0.90,0.92), fog);
  col = mix(col, col*vec3(0.74,0.66,0.96) + vec3(0.05,0.02,0.10), storm*0.6);
  gl_FragColor = vec4(col, mix(0.80, 1.0, clamp(fres + fog, 0.0, 1.0)));
}
`;

export const STORM_VS = `
precision highp float;
attribute vec3 position;
attribute vec2 uv;
uniform mat4 world;
uniform mat4 worldViewProjection;
varying vec3 vPos;
varying vec2 vUV;
void main(){ vec4 w = world * vec4(position, 1.0); vPos = w.xyz; vUV = uv; gl_Position = worldViewProjection * vec4(position, 1.0); }
`;

export const STORM_FS = `
precision highp float;
varying vec3 vPos;
varying vec2 vUV;
uniform float time;
uniform float radius;
uniform float intensity;
uniform vec3 camPos;
${NOISE}
void main(){
  float arc = vUV.x * 6.28318 * radius;
  // broad, slow curtains: readable as a wall, never as rain
  vec2 q = vec2(arc*0.011, vPos.y*0.012 - time*0.05);
  float n = noise(q)*0.6 + noise(q*2.3 + 3.0)*0.4;
  float veil = smoothstep(0.35, 0.8, noise(vec2(arc*0.028 + time*0.02, vPos.y*0.006 - time*0.07)));
  // sparse crystal motes rising through the wall
  float glint = smoothstep(0.90, 0.96, noise(vec2(arc*0.22, vPos.y*0.22 - time*0.8)));
  float base = smoothstep(150.0, 0.0, vPos.y);
  vec3 col = mix(vec3(0.36,0.15,0.80), vec3(0.64,0.42,0.98), n);
  col += vec3(0.80,0.72,1.0) * (veil*0.16 + glint*0.45);
  float a = (0.20 + 0.22*n + 0.12*veil + 0.22*glint) * (0.35 + 0.65*base) * intensity;
  float dist = length(camPos - vPos);
  glint *= smoothstep(260.0, 50.0, dist);
  a = (0.20 + 0.22*n + 0.12*veil + 0.22*glint) * (0.30 + 0.70*base) * intensity;
  a *= smoothstep(1.5, 12.0, dist);
  a *= mix(1.0, 0.42, clamp(dist/420.0, 0.0, 1.0));
  a *= smoothstep(150.0, 90.0, vPos.y);
  a *= smoothstep(0.0, 0.03, vUV.y);
  gl_FragColor = vec4(col, clamp(a, 0.0, 0.72));
}
`;
