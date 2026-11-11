/** Static world rendering: terrain chunks, instanced buildings/foliage, water, sky, storm wall. */
import * as THREE from 'three';
import { BOX_STYLES, type World } from '../sim/world';
import { fbm } from '../shared/rng';
import { clamp, lerp, smoothstep } from '../shared/math';
import type { Quality } from './settings';

const STYLE_COLORS: string[] = [
  '#e9dcbe', // limestone
  '#c8773a', // copper
  '#a9794d', // wood
  '#e8613f', // fabric A (saturated canopy)
  '#2f9aa8', // fabric B
  '#b5ac9a', // stone
  '#6c747c', // metal
  '#d98a4a', // roof
  '#b98a58', // crate
  '#c9b58b', // pier
  '#9ad7e6', // glass
  '#4a4650', // dark
];

const C = {
  g0: new THREE.Color('#5fae4f'), g1: new THREE.Color('#86c95e'), hi: new THREE.Color('#bfb69f'), sand: new THREE.Color('#e7d7a6'),
  sea: new THREE.Color('#58b7b0'), cliff: new THREE.Color('#9b9184'),
  aerie: new THREE.Color('#d9ca9f'), kiln: new THREE.Color('#76706b'), array: new THREE.Color('#8ac2b9'), orchard: new THREE.Color('#4a9348'),
  abbey: new THREE.Color('#cfc7ad'), docks: new THREE.Color('#b9ab8a'), quarry: new THREE.Color('#a69b88'), other: new THREE.Color('#cdbf98'),
};
const PAD_COLORS: Record<string, THREE.Color> = { aerie: C.aerie, kiln: C.kiln, array: C.array, orchard: C.orchard, abbey: C.abbey, docks: C.docks, quarry: C.quarry };

export function terrainColor(world: World, x: number, z: number, h: number, out: THREE.Color): THREE.Color {
  const slope = world.slopeAt(x, z);
  const n = fbm(x / 22, z / 22, world.seed + 3, 3);
  const n2 = fbm(x / 7, z / 7, world.seed + 9, 2);
  out.copy(C.g0).lerp(C.g1, n);
  out.multiplyScalar(0.88 + n2 * 0.24);
  const hi = smoothstep(26, 46, h);
  if (hi > 0) out.lerp(C.hi, hi * 0.7);
  const beach = 1 - smoothstep(1.2, 3.2, h);
  if (beach > 0) out.lerp(C.sand, beach);
  if (h < 0.2) out.lerp(C.sea, smoothstep(0.2, -3, h) * 0.9);
  const cliff = smoothstep(0.42, 0.85, slope);
  if (cliff > 0) out.lerp(C.cliff, cliff * 0.9);
  for (const l of world.locations) {
    const d = Math.hypot(x - l.x, z - l.z);
    if (d > l.r) continue;
    const w = 1 - smoothstep(l.r * 0.55, l.r, d);
    out.lerp(PAD_COLORS[l.id] ?? C.other, w * (l.id === 'orchard' ? 0.45 : 0.8));
  }
  return out;
}

export interface WorldView {
  group: THREE.Group;
  update(t: number, camPos: THREE.Vector3): void;
  setQuality(q: Quality): void;
  treeMeshes: THREE.InstancedMesh[];
  water: THREE.Mesh;
}

export function buildWorldView(world: World): WorldView {
  const group = new THREE.Group();
  const col = new THREE.Color();

  /* ---- terrain chunks ---- */
  const chunkCells = 50;
  const res = world.res;
  const terrainMat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const chunks = Math.ceil((world.n - 1) / chunkCells);
  for (let cz = 0; cz < chunks; cz++) {
    for (let cx = 0; cx < chunks; cx++) {
      const x0 = cx * chunkCells, z0 = cz * chunkCells;
      const nx = Math.min(chunkCells, world.n - 1 - x0), nz = Math.min(chunkCells, world.n - 1 - z0);
      const verts = (nx + 1) * (nz + 1);
      const pos = new Float32Array(verts * 3), nor = new Float32Array(verts * 3), colA = new Float32Array(verts * 3);
      let k = 0;
      for (let iz = 0; iz <= nz; iz++) {
        for (let ix = 0; ix <= nx; ix++) {
          const wx = (x0 + ix) * res - world.half, wz = (z0 + iz) * res - world.half;
          const h = world.heights[(z0 + iz) * world.n + (x0 + ix)];
          pos[k * 3] = wx; pos[k * 3 + 1] = h; pos[k * 3 + 2] = wz;
          const e = res;
          const hx = world.heightAt(wx + e, wz) - world.heightAt(wx - e, wz);
          const hz = world.heightAt(wx, wz + e) - world.heightAt(wx, wz - e);
          const nrm = new THREE.Vector3(-hx / (2 * e), 1, -hz / (2 * e)).normalize();
          nor[k * 3] = nrm.x; nor[k * 3 + 1] = nrm.y; nor[k * 3 + 2] = nrm.z;
          terrainColor(world, wx, wz, h, col);
          colA[k * 3] = col.r; colA[k * 3 + 1] = col.g; colA[k * 3 + 2] = col.b;
          k++;
        }
      }
      const idx: number[] = [];
      for (let iz = 0; iz < nz; iz++) for (let ix = 0; ix < nx; ix++) {
        const a = iz * (nx + 1) + ix, b = a + 1, c = a + (nx + 1), d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      g.setAttribute('color', new THREE.BufferAttribute(colA, 3));
      g.setIndex(idx);
      g.computeBoundingSphere();
      const m = new THREE.Mesh(g, terrainMat);
      m.receiveShadow = true;
      group.add(m);
    }
  }

  /* ---- colliders as instanced boxes ---- */
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const boxMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const boxMesh = new THREE.InstancedMesh(boxGeo, boxMat, Math.max(1, world.boxes.length));
  boxMesh.castShadow = true; boxMesh.receiveShadow = true;
  const mtx = new THREE.Matrix4();
  const c2 = new THREE.Color();
  world.boxes.forEach((b, i) => {
    mtx.makeScale(b.maxX - b.minX, b.maxY - b.minY, b.maxZ - b.minZ);
    mtx.setPosition((b.minX + b.maxX) / 2, (b.minY + b.maxY) / 2, (b.minZ + b.maxZ) / 2);
    boxMesh.setMatrixAt(i, mtx);
    c2.set(STYLE_COLORS[b.style % STYLE_COLORS.length]);
    const j = 0.92 + ((i * 2654435761) % 1000) / 1000 * 0.14;
    c2.multiplyScalar(j);
    boxMesh.setColorAt(i, c2);
  });
  boxMesh.instanceMatrix.needsUpdate = true;
  if (boxMesh.instanceColor) boxMesh.instanceColor.needsUpdate = true;
  group.add(boxMesh);

  /* ---- foliage and props ---- */
  const trunkGeo = new THREE.CylinderGeometry(0.28, 0.42, 1, 6); trunkGeo.translate(0, 0.5, 0);
  const crownGeo = new THREE.IcosahedronGeometry(1, 1);
  const coneGeo = new THREE.ConeGeometry(1, 1.8, 7); coneGeo.translate(0, 0.9, 0);
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);
  const cylGeo = new THREE.CylinderGeometry(1, 1, 1, 14); cylGeo.translate(0, 0.5, 0);
  const dishGeo = new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.42);

  const trees = world.cyls.filter((c) => c.kind === 'tree');
  const rocks = world.cyls.filter((c) => c.kind === 'rock');
  const posts = world.cyls.filter((c) => c.kind === 'pillar' || c.kind === 'stack' || c.kind === 'tank');
  const dishes = world.cyls.filter((c) => c.kind === 'dish');

  const trunk = new THREE.InstancedMesh(trunkGeo, new THREE.MeshLambertMaterial({ color: 0x7a5a3a }), Math.max(1, trees.length));
  const crown = new THREE.InstancedMesh(crownGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }), Math.max(1, trees.length));
  const crown2 = new THREE.InstancedMesh(coneGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }), Math.max(1, trees.length));
  trunk.castShadow = crown.castShadow = crown2.castShadow = true;
  const q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), e = new THREE.Euler();
  trees.forEach((t, i) => {
    const h = t.y1 - t.y0;
    const v = (((i * 7919) % 97) / 97);
    // trunk
    p.set(t.x, t.y0 + 0.5, t.z); s.set(1, h * 0.55, 1); q.identity();
    mtx.compose(p, q, s); trunk.setMatrixAt(i, mtx);
    if (t.style === 1) { // orchard / round-crown tree
      p.set(t.x, t.y0 + h * 0.8, t.z); s.set(1.9 + v * 0.4, 1.6 + v * 0.3, 1.9 + v * 0.4);
      mtx.compose(p, q, s); crown.setMatrixAt(i, mtx);
      crown.setColorAt(i, c2.set('#4f9a3f').lerp(new THREE.Color('#d9803a'), v > 0.8 ? 0.7 : 0)); // some fruiting trees
      mtx.compose(new THREE.Vector3(0, -100, 0), q, new THREE.Vector3(0.01, 0.01, 0.01)); crown2.setMatrixAt(i, mtx);
    } else {
      p.set(t.x, t.y0 + h * 0.35, t.z); s.set(1.6 + v * 0.6, 1.3 + v * 0.5, 1.6 + v * 0.6);
      mtx.compose(p, q, s); crown2.setMatrixAt(i, mtx);
      crown2.setColorAt(i, c2.set('#2f7f45').lerp(new THREE.Color('#4fae52'), v));
      p.set(t.x, t.y0 + h * 0.8, t.z); s.set(1.1 + v * 0.3, 1, 1.1 + v * 0.3);
      mtx.compose(p, q, s); crown.setMatrixAt(i, mtx);
      crown.setColorAt(i, c2.set('#3d9a4a').lerp(new THREE.Color('#6cc25a'), v));
    }
  });
  [trunk, crown, crown2].forEach((m) => { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; group.add(m); });

  const rockMesh = new THREE.InstancedMesh(rockGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }), Math.max(1, rocks.length));
  rockMesh.castShadow = true; rockMesh.receiveShadow = true;
  rocks.forEach((r, i) => {
    const hh = Math.max(0.8, (r.y1 - r.y0) * 0.7);
    p.set(r.x, r.y1 - hh * 0.55, r.z);
    e.set(i * 0.7, i * 1.3, i * 0.3); q.setFromEuler(e);
    s.set(r.r * 1.1, hh, r.r * 1.05);
    mtx.compose(p, q, s); rockMesh.setMatrixAt(i, mtx);
    rockMesh.setColorAt(i, c2.set('#a39a8c').lerp(new THREE.Color('#c8bfae'), ((i * 31) % 10) / 10));
  });
  rockMesh.instanceMatrix.needsUpdate = true; if (rockMesh.instanceColor) rockMesh.instanceColor.needsUpdate = true;
  group.add(rockMesh);

  const postMesh = new THREE.InstancedMesh(cylGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }), Math.max(1, posts.length));
  postMesh.castShadow = true;
  posts.forEach((c, i) => {
    p.set(c.x, c.y0, c.z); q.identity(); s.set(c.r, c.y1 - c.y0, c.r);
    mtx.compose(p, q, s); postMesh.setMatrixAt(i, mtx);
    postMesh.setColorAt(i, c2.set(STYLE_COLORS[c.style % STYLE_COLORS.length]));
  });
  postMesh.instanceMatrix.needsUpdate = true; if (postMesh.instanceColor) postMesh.instanceColor.needsUpdate = true;
  group.add(postMesh);

  const dishMat = new THREE.MeshLambertMaterial({ color: 0xe9dcbe, side: THREE.DoubleSide });
  for (const d of dishes) {
    const dm = new THREE.Mesh(dishGeo, dishMat);
    dm.scale.set(d.r * 1.15, d.r * 0.9, d.r * 1.15);
    dm.position.set(d.x, d.y1 - d.r * 0.4, d.z);
    dm.rotation.x = Math.PI; dm.rotation.z = 0.5;
    dm.castShadow = true;
    group.add(dm);
    const mast = new THREE.Mesh(cylGeo, lamb('#c8773a'));
    mast.scale.set(0.35, d.y1 - d.y0, 0.35); mast.position.set(d.x, d.y0, d.z); mast.castShadow = true;
    group.add(mast);
  }

  /* ---- hazards (heat channels) ---- */
  const hazMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff7a2a'), transparent: true, opacity: 0.85 });
  for (const h of world.hazards) {
    const g = new THREE.PlaneGeometry(h.x1 - h.x0, h.z1 - h.z0);
    const m = new THREE.Mesh(g, hazMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set((h.x0 + h.x1) / 2, world.heightAt((h.x0 + h.x1) / 2, (h.z0 + h.z1) / 2) + 0.08, (h.z0 + h.z1) / 2);
    group.add(m);
  }

  /* ---- ziplines and vents ---- */
  const lineMat = new THREE.LineBasicMaterial({ color: 0xf4ecd0 });
  for (const z of world.ziplines) {
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(z.a.x, z.a.y, z.a.z), new THREE.Vector3(z.b.x, z.b.y, z.b.z)]);
    group.add(new THREE.Line(geo, lineMat));
    for (const end of [z.a, z.b]) {
      const post = new THREE.Mesh(cylGeo, lamb('#c8773a'));
      const gy = world.groundHeight(end.x, end.z, end.y, 20, 0.5, [], []);
      post.scale.set(0.12, Math.max(0.5, end.y - gy), 0.12); post.position.set(end.x, gy, end.z);
      group.add(post);
      const hook = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.06, 6, 10), lamb('#ffd166'));
      hook.position.set(end.x, end.y, end.z); hook.rotation.x = Math.PI / 2; group.add(hook);
    }
  }
  const ventMat = new THREE.MeshBasicMaterial({ color: 0x8fe9ff, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
  const vents: THREE.Mesh[] = [];
  for (const v of world.vents) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(v.r * 0.7, v.r, 14, 16, 1, true), ventMat);
    m.position.set(v.x, v.y + 7, v.z); group.add(m); vents.push(m);
    const ring = new THREE.Mesh(new THREE.RingGeometry(v.r * 0.6, v.r, 20), new THREE.MeshBasicMaterial({ color: 0xbff6ff, side: THREE.DoubleSide, transparent: true, opacity: 0.8 }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(v.x, v.y + 0.1, v.z); group.add(ring);
  }

  /* ---- water ---- */
  const nmap = makeWaterNormal();
  const waterMat = new THREE.MeshPhongMaterial({
    color: 0x2db4c9, transparent: true, opacity: 0.74, shininess: 110, specular: 0xaaf4ff, normalMap: nmap, normalScale: new THREE.Vector2(0.55, 0.55),
  });
  nmap.repeat.set(220, 220);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), waterMat);
  water.rotation.x = -Math.PI / 2; water.position.y = world.waterLevel;
  water.receiveShadow = false;
  group.add(water);
  // deep void-sea far below, tinted violet
  const deep = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), new THREE.MeshBasicMaterial({ color: 0x3b2f78 }));
  deep.rotation.x = -Math.PI / 2; deep.position.y = -14;
  group.add(deep);

  const update = (t: number, camPos: THREE.Vector3) => {
    nmap.offset.set(t * 0.012, t * 0.007);
    water.position.x = camPos.x; water.position.z = camPos.z;
    deep.position.x = camPos.x; deep.position.z = camPos.z;
    hazMat.opacity = 0.7 + Math.sin(t * 1.6) * 0.12;
    vents.forEach((v, i) => { v.rotation.y = t * 0.8 + i; (v.material as THREE.MeshBasicMaterial).opacity = 0.24 + Math.sin(t * 2 + i) * 0.05; });
  };
  const setQuality = (qy: Quality) => {
    const on = qy !== 'low';
    boxMesh.castShadow = on; trunk.castShadow = on; crown.castShadow = on; crown2.castShadow = on; rockMesh.castShadow = on;
  };
  return { group, update, setQuality, treeMeshes: [trunk, crown, crown2], water };
}

function lamb(c: string): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color: new THREE.Color(c) });
}

function makeWaterNormal(): THREE.DataTexture {
  const n = 128;
  const data = new Uint8Array(n * n * 4);
  const hgt = (x: number, y: number) => {
    const xx = ((x % n) + n) % n, yy = ((y % n) + n) % n;
    return Math.sin((xx / n) * Math.PI * 8) * 0.5 + Math.sin((yy / n) * Math.PI * 6 + xx * 0.02) * 0.5 + Math.sin(((xx + yy) / n) * Math.PI * 12) * 0.3;
  };
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const dx = hgt(x + 1, y) - hgt(x - 1, y), dy = hgt(x, y + 1) - hgt(x, y - 1);
      const nx = -dx * 0.6, ny = -dy * 0.6, nz = 1;
      const l = Math.hypot(nx, ny, nz);
      const i = (y * n + x) * 4;
      data[i] = Math.round(((nx / l) * 0.5 + 0.5) * 255);
      data[i + 1] = Math.round(((ny / l) * 0.5 + 0.5) * 255);
      data[i + 2] = Math.round(((nz / l) * 0.5 + 0.5) * 255);
      data[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, n, n, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

/* ------------------------------------------------------------------ sky */
export function buildSky(): { mesh: THREE.Mesh; clouds: THREE.Group; update: (t: number, cam: THREE.Vector3) => void } {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { sunDir: { value: new THREE.Vector3(-0.45, 0.72, 0.5).normalize() } },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position.z = gl_Position.w; }',
    fragmentShader: `
      varying vec3 vDir; uniform vec3 sunDir;
      void main(){
        float h = vDir.y;
        vec3 top = vec3(0.16,0.60,0.86);
        vec3 mid = vec3(0.50,0.86,0.94);
        vec3 hor = vec3(1.0,0.93,0.80);
        vec3 low = vec3(0.60,0.46,0.86);
        vec3 c = mix(hor, mid, smoothstep(0.0, 0.25, h));
        c = mix(c, top, smoothstep(0.2, 0.9, h));
        c = mix(c, low, smoothstep(0.0, -0.35, h));
        float s = max(dot(normalize(vDir), sunDir), 0.0);
        c += vec3(1.0,0.85,0.55) * (pow(s, 600.0) * 1.5 + pow(s, 12.0) * 0.18);
        // soft fracture band: a faint violet-turquoise arc across the sky
        float band = exp(-pow((vDir.x*0.6 + vDir.z*0.8 - 0.1 + h*0.9) * 5.0, 2.0)) * smoothstep(0.1,0.5,h);
        c = mix(c, vec3(0.62,0.9,1.0), band * 0.35);
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(3800, 32, 16), mat);
  mesh.renderOrder = -10; mesh.frustumCulled = false;
  const clouds = new THREE.Group();
  const cnv = document.createElement('canvas'); cnv.width = cnv.height = 128;
  const ctx = cnv.getContext('2d')!;
  const grd = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
  grd.addColorStop(0, 'rgba(255,255,255,0.95)'); grd.addColorStop(0.5, 'rgba(255,255,255,0.5)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grd; ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(cnv);
  const cmat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.85, fog: false });
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + (i % 3) * 0.4, r = 700 + ((i * 137) % 900);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), cmat);
    m.scale.set(380 + (i % 5) * 90, 130 + (i % 4) * 30, 1);
    m.position.set(Math.cos(a) * r, 190 + (i % 7) * 40, Math.sin(a) * r);
    m.rotation.x = -Math.PI / 2 + 0.15;
    m.userData.a = a; m.userData.r = r;
    clouds.add(m);
  }
  const update = (t: number, cam: THREE.Vector3) => {
    mesh.position.copy(cam);
    clouds.children.forEach((c, i) => {
      const a = c.userData.a + t * 0.004;
      c.position.x = cam.x * 0.4 + Math.cos(a) * c.userData.r;
      c.position.z = cam.z * 0.4 + Math.sin(a) * c.userData.r;
      c.lookAt(c.position.x, 2000, c.position.z);
      void i;
    });
  };
  return { mesh, clouds, update };
}

/* ---------------------------------------------------------------- storm */
export class StormView {
  readonly group = new THREE.Group();
  private wall: THREE.Mesh;
  private next: THREE.Mesh;
  private motes: THREE.Points;
  private moteData: Float32Array;
  private mat: THREE.ShaderMaterial;
  constructor() {
    this.mat = new THREE.ShaderMaterial({
      transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.NormalBlending, fog: false,
      uniforms: { time: { value: 0 }, color: { value: new THREE.Color('#8a4dff') }, cam: { value: new THREE.Vector3() }, density: { value: 1 } },
      vertexShader: 'varying vec3 vP; void main(){ vP = (modelMatrix*vec4(position,1.0)).xyz; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} ',
      fragmentShader: `
        varying vec3 vP; uniform float time; uniform vec3 color; uniform vec3 cam; uniform float density;
        float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
        float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
        void main(){
          float ang = atan(vP.z, vP.x);
          float flow = n(vec2(ang*14.0, vP.y*0.06 - time*0.25)) * 0.6 + n(vec2(ang*40.0 + time*0.1, vP.y*0.15 - time*0.5)) * 0.4;
          float d = distance(cam.xz, vP.xz);
          float fadeNear = smoothstep(2.0, 40.0, d); // never hide close enemies: thins to nothing near the player
          float a = (0.28 + flow * 0.5) * fadeNear * density;
          float rim = smoothstep(0.0, 1.0, 1.0 - abs(fract(vP.y*0.02 - time*0.03) - 0.5) * 2.0);
          vec3 c = mix(color, vec3(0.7,0.95,1.0), rim * 0.25 + flow * 0.15);
          gl_FragColor = vec4(c, clamp(a, 0.0, 0.8));
        }`,
    });
    const g = new THREE.CylinderGeometry(1, 1, 420, 96, 1, true);
    g.translate(0, 190, 0);
    this.wall = new THREE.Mesh(g, this.mat);
    this.wall.frustumCulled = false;
    this.group.add(this.wall);
    const ring = new THREE.CylinderGeometry(1, 1, 60, 128, 1, true);
    ring.translate(0, 20, 0);
    this.next = new THREE.Mesh(ring, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }));
    this.next.frustumCulled = false;
    this.group.add(this.next);
    const n = 900;
    this.moteData = new Float32Array(n * 3);
    const mg = new THREE.BufferGeometry();
    mg.setAttribute('position', new THREE.BufferAttribute(this.moteData, 3));
    const dot = document.createElement('canvas'); dot.width = dot.height = 32;
    const dc = dot.getContext('2d')!; const dg = dc.createRadialGradient(16, 16, 1, 16, 16, 15); dg.addColorStop(0, 'rgba(255,255,255,1)'); dg.addColorStop(1, 'rgba(255,255,255,0)'); dc.fillStyle = dg; dc.fillRect(0, 0, 32, 32);
    this.motes = new THREE.Points(mg, new THREE.PointsMaterial({ map: new THREE.CanvasTexture(dot), color: 0xcfa8ff, size: 2.2, transparent: true, opacity: 0.7, depthWrite: false, sizeAttenuation: true, fog: false }));
    this.motes.frustumCulled = false;
    this.group.add(this.motes);
  }
  update(t: number, cx: number, cz: number, r: number, nx: number, nz: number, nr: number, showNext: boolean, cam: THREE.Vector3, visible: boolean): void {
    this.group.visible = visible;
    if (!visible) return;
    this.mat.uniforms.time.value = t;
    this.mat.uniforms.cam.value.copy(cam);
    this.wall.position.set(cx, 0, cz); this.wall.scale.set(r, 1, r);
    this.next.visible = showNext;
    this.next.position.set(nx, 0, nz); this.next.scale.set(nr, 1, nr);
    // inward-moving crystal motes near the wall
    const n = this.moteData.length / 3;
    for (let i = 0; i < n; i++) {
      const phase = (t * 0.05 + i / n * 7.3) % 1;
      const a = (i * 2.399963) % (Math.PI * 2);
      const rr = r + 14 - phase * 28;
      this.moteData[i * 3] = cx + Math.cos(a) * rr;
      this.moteData[i * 3 + 1] = 4 + ((i * 53) % 140) * (0.8 + 0.2 * Math.sin(t * 0.5 + i));
      this.moteData[i * 3 + 2] = cz + Math.sin(a) * rr;
    }
    (this.motes.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    void clamp; void lerp; void BOX_STYLES;
  }
}
