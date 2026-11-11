// The Broken Diadem: island mesh, painted ground, mistwood, brush, props and the void sky.
// Everything is derived from the same shared map data the simulation uses, so visuals match nav/vision.
import * as THREE from 'three';
import {
  getMapGrid, NAV_W, NAV_H, NAV_CELL, MAP_MIN_X, MAP_MIN_Y, MAP_W, MAP_H, Cell, LANES, RIVER, BASE_CENTER, FOUNTAIN,
  FLAG_RIVER, FLAG_JUNGLE, FLAG_BASE0, FLAG_BASE1, FLAG_PIT, PIT_CENTER, LANE_HALF, CAMPS, BRUSHES,
} from '../../shared/map';
import { hash2, smoothNoise, resample } from '../../shared/math';
import { lambert, patchFog } from './fogShader';
import type { V2 } from '../../shared/math';

const TEX_SCALE = 13.6; // px per meter

function marchingSegments(field: Float32Array, w: number, h: number, thr: number): Array<[V2, V2]> {
  // segments on the vertex grid (w x h vertices)
  const segs: Array<[V2, V2]> = [];
  const P = (gx: number, gy: number): V2 => ({ x: MAP_MIN_X + gx * NAV_CELL, y: MAP_MIN_Y + gy * NAV_CELL });
  const lerpP = (ax: number, ay: number, bx: number, by: number) => {
    const va = field[ay * w + ax], vb = field[by * w + bx];
    const t = (thr - va) / (vb - va || 1e-6);
    const a = P(ax, ay), b = P(bx, by);
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  };
  for (let y = 0; y < h - 1; y++) for (let x = 0; x < w - 1; x++) {
    const a = field[y * w + x] >= thr ? 1 : 0, b = field[y * w + x + 1] >= thr ? 1 : 0;
    const c = field[(y + 1) * w + x + 1] >= thr ? 1 : 0, d = field[(y + 1) * w + x] >= thr ? 1 : 0;
    const idx = a | (b << 1) | (c << 2) | (d << 3);
    if (idx === 0 || idx === 15) continue;
    const top = () => lerpP(x, y, x + 1, y), right = () => lerpP(x + 1, y, x + 1, y + 1), bottom = () => lerpP(x, y + 1, x + 1, y + 1), left = () => lerpP(x, y, x, y + 1);
    const table: Record<number, Array<[() => V2, () => V2]>> = {
      1: [[left, top]], 2: [[top, right]], 3: [[left, right]], 4: [[right, bottom]], 5: [[left, top], [right, bottom]], 6: [[top, bottom]], 7: [[left, bottom]],
      8: [[bottom, left]], 9: [[bottom, top]], 10: [[top, right], [bottom, left]], 11: [[bottom, right]], 12: [[right, left]], 13: [[right, top]], 14: [[top, left]],
    };
    for (const [p, q] of table[idx]) segs.push([p(), q()]);
  }
  return segs;
}

export function paintGround(minimap = false): HTMLCanvasElement {
  const grid = getMapGrid();
  const sc = minimap ? 2 : TEX_SCALE;
  const W = Math.round(MAP_W * sc), H = Math.round(MAP_H * sc);
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d')!;
  const img = g.createImageData(W, H);
  const d = img.data;
  for (let py = 0; py < H; py++) {
    const wy = MAP_MIN_Y + (py + 0.5) / sc;
    const cy = Math.floor((wy - MAP_MIN_Y) / NAV_CELL);
    for (let px = 0; px < W; px++) {
      const wx = MAP_MIN_X + (px + 0.5) / sc;
      const cx = Math.floor((wx - MAP_MIN_X) / NAV_CELL);
      const i = cy * NAV_W + cx;
      const o = (py * W + px) * 4;
      const c = grid.cells[i], fl = grid.flags[i];
      const n = minimap ? 0.5 : smoothNoise(wx * 0.35, wy * 0.35, 3) * 0.6 + hash2(px, py, 9) * 0.4;
      let r = 0, gg = 0, b = 0, a = 255;
      if (c === Cell.Void) { r = 14; gg = 20; b = 46; a = minimap ? 255 : 0; }
      else if (c === Cell.Forest) { r = 26 + n * 18; gg = 58 + n * 22; b = 44 + n * 12; }
      else {
        const clr = grid.clearance[i];
        const ao = Math.min(1, 0.55 + clr * 0.25);
        if (fl & FLAG_RIVER) { r = 40 + n * 20; gg = 98 + n * 30; b = 160 + n * 30; if (hash2(px, py, 4) > 0.996) { r = 255; gg = 120; b = 230; } }
        else if (fl & (FLAG_BASE0 | FLAG_BASE1)) { const t = (Math.floor(wx / 2) + Math.floor(wy / 2)) & 1; r = 196 + t * 18; gg = 180 + t * 14; b = 140 + t * 10; }
        else if (fl & FLAG_PIT) { r = 92 + n * 20; gg = 70 + n * 14; b = 112 + n * 20; }
        else if (fl & FLAG_JUNGLE) { r = 78 + n * 26; gg = 116 + n * 30; b = 62 + n * 16; }
        else { r = 104 + n * 26; gg = 132 + n * 24; b = 82 + n * 16; }
        if (c === Cell.Brush) { r = r * 0.55 + 20; gg = gg * 0.7 + 30; b = b * 0.7 + 34; }
        r *= ao; gg *= ao; b *= ao;
      }
      d[o] = r; d[o + 1] = gg; d[o + 2] = b; d[o + 3] = a;
    }
  }
  g.putImageData(img, 0, 0);
  if (!minimap) {
    // soften the nav-cell grid so terrain edges read as organic shapes
    const copy = document.createElement('canvas'); copy.width = W; copy.height = H;
    const cg = copy.getContext('2d')!; cg.drawImage(cv, 0, 0);
    g.clearRect(0, 0, W, H);
    g.filter = 'blur(3px)'; g.drawImage(copy, 0, 0); g.filter = 'none';
  }
  const toPx = (p: V2) => [(p.x - MAP_MIN_X) * sc, (p.y - MAP_MIN_Y) * sc] as const;
  const stroke = (pts: V2[], width: number, color: string, dash?: number[]) => {
    g.beginPath();
    pts.forEach((p, i) => { const [x, y] = toPx(p); if (i) g.lineTo(x, y); else g.moveTo(x, y); });
    g.strokeStyle = color; g.lineWidth = width * sc; g.lineCap = 'round'; g.lineJoin = 'round';
    g.setLineDash(dash ? dash.map((v) => v * sc) : []);
    g.stroke();
    g.setLineDash([]);
  };
  // causeways
  for (const lane of LANES) {
    stroke(lane, LANE_HALF * 2 + 0.6, 'rgba(120,104,78,0.9)');
    stroke(lane, LANE_HALF * 2 - 0.6, '#e2d7bd');
    stroke(lane, LANE_HALF * 2 - 3.2, '#ece3cc');
    if (!minimap) {
      stroke(lane, LANE_HALF * 2 - 0.8, 'rgba(150,130,96,0.35)', [0.18, 2.2]);
      stroke(lane, 0.25, 'rgba(176,138,60,0.55)', [1.2, 1.6]);
    }
  }
  // river with aether shimmer
  stroke(RIVER, 6.2, 'rgba(60,120,190,0.55)');
  stroke(RIVER, 3.2, 'rgba(120,180,240,0.35)');
  if (!minimap) stroke(RIVER, 0.4, 'rgba(255,110,220,0.5)', [0.6, 2.4]);
  // base plazas
  for (const [i, b] of BASE_CENTER.entries()) {
    const [x, y] = toPx(b);
    g.strokeStyle = 'rgba(176,138,60,0.9)'; g.lineWidth = 0.5 * sc;
    for (const r of [4, 8, 11.8]) { g.beginPath(); g.arc(x, y, r * sc, 0, Math.PI * 2); g.stroke(); }
    const [fx, fy] = toPx(FOUNTAIN[i]);
    g.fillStyle = i === 0 ? 'rgba(63,182,255,0.45)' : 'rgba(255,122,61,0.45)';
    g.beginPath(); g.arc(fx, fy, 3.2 * sc, 0, Math.PI * 2); g.fill();
  }
  // colossus pit glyph
  {
    const [x, y] = toPx(PIT_CENTER);
    const gr = g.createRadialGradient(x, y, 0, x, y, 7 * sc);
    gr.addColorStop(0, 'rgba(255,90,220,0.55)'); gr.addColorStop(1, 'rgba(120,40,140,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, 7 * sc, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(255,140,230,0.6)'; g.lineWidth = 0.3 * sc;
    g.beginPath(); g.arc(x, y, 5 * sc, 0, Math.PI * 2); g.stroke();
  }
  if (!minimap) {
    // camp marks
    for (const c of CAMPS) {
      const [x, y] = toPx(c);
      g.strokeStyle = 'rgba(40,30,20,0.35)'; g.lineWidth = 0.25 * sc;
      g.beginPath(); g.arc(x, y, 2.4 * sc, 0, Math.PI * 2); g.stroke();
    }
  }
  return cv;
}

export interface MapView { group: THREE.Group; animated: Array<(t: number) => void>; brushMat: THREE.Material; minimapCanvas: HTMLCanvasElement; treeFade: (fx: number, fz: number, cx: number, cz: number, dt: number) => void }

export function buildMap(quality: 'low' | 'high'): MapView {
  const grid = getMapGrid();
  const group = new THREE.Group();
  const animated: Array<(t: number) => void> = [];
  // top surface: painted plane, void cut out by texture alpha (matches nav exactly)
  const tex = new THREE.CanvasTexture(paintGround(false));
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const top = new THREE.PlaneGeometry(MAP_W, MAP_H, 1, 1);
  top.rotateX(-Math.PI / 2);
  top.translate(MAP_MIN_X + MAP_W / 2, 0, MAP_MIN_Y + MAP_H / 2);
  const ground = new THREE.Mesh(top, lambert(0xffffff, { map: tex, alphaTest: 0.5 }));
  ground.name = 'ground';
  group.add(ground);
  // cliff skirt from marching-squares boundary segments
  const segs = marchingSegments(grid.islandF, NAV_W + 1, NAV_H + 1, 0.6);
  const skP: number[] = [], skC: number[] = [];
  const cTop = new THREE.Color(0xd9ceb4), cMid = new THREE.Color(0x8a7a8e), cBot = new THREE.Color(0x231d40);
  for (const [a2, b2] of segs) {
    const da = 7 + hash2(Math.round(a2.x * 3), Math.round(a2.y * 3), 5) * 5, db = 7 + hash2(Math.round(b2.x * 3), Math.round(b2.y * 3), 5) * 5;
    const quad = [[a2.x, 0, a2.y], [b2.x, 0, b2.y], [b2.x, -db, b2.y], [a2.x, 0, a2.y], [b2.x, -db, b2.y], [a2.x, -da, a2.y]];
    for (const q of quad) {
      skP.push(q[0], q[1], q[2]);
      const t = -q[1] / 12;
      const c = cTop.clone().lerp(cMid, Math.min(1, t * 2.2)).lerp(cBot, Math.max(0, t * 1.6 - 0.4));
      const n = hash2(Math.round(q[0] * 2), Math.round(q[2] * 2), 5) * 0.12;
      skC.push(c.r - n, c.g - n, c.b - n);
    }
  }
  const skirt = new THREE.BufferGeometry();
  skirt.setAttribute('position', new THREE.Float32BufferAttribute(skP, 3));
  skirt.setAttribute('color', new THREE.Float32BufferAttribute(skC, 3));
  skirt.computeVertexNormals();
  group.add(new THREE.Mesh(skirt, lambert(0xffffff, { vertexColors: true, side: THREE.DoubleSide })));

  // ---- mistwood
  const trunkPos: THREE.Matrix4[] = [], canopy: Array<{ m: THREE.Matrix4; c: THREE.Color }> = [];
  const step = quality === 'high' ? 4 : 5;
  for (let cy = 0; cy < NAV_H; cy += step) for (let cx = 0; cx < NAV_W; cx += step) {
    const jx = Math.min(NAV_W - 1, cx + Math.floor(hash2(cx, cy, 1) * step)), jy = Math.min(NAV_H - 1, cy + Math.floor(hash2(cx, cy, 2) * step));
    const i = jy * NAV_W + jx;
    if (grid.cells[i] !== Cell.Forest) continue;
    const x = MAP_MIN_X + (jx + 0.5) * NAV_CELL, z = MAP_MIN_Y + (jy + 0.5) * NAV_CELL;
    const h = 2.4 + hash2(jx, jy, 3) * 2.2;
    const s = 0.8 + hash2(jx, jy, 4) * 0.6;
    trunkPos.push(new THREE.Matrix4().compose(new THREE.Vector3(x, h * 0.35, z), new THREE.Quaternion(), new THREE.Vector3(s, h * 0.7, s)));
    const coral = hash2(jx, jy, 8) > 0.93;
    const col = coral ? new THREE.Color().setHSL(0.97 + hash2(jx, jy, 6) * 0.04, 0.65, 0.62) : new THREE.Color().setHSL(0.36 + hash2(jx, jy, 6) * 0.12, 0.45, 0.28 + hash2(jx, jy, 7) * 0.12);
    canopy.push({ m: new THREE.Matrix4().compose(new THREE.Vector3(x, h * 0.75 + 0.6, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, hash2(jx, jy, 9) * 6, 0)), new THREE.Vector3(s * 1.3, s * 1.1 * (coral ? 0.8 : 1.1), s * 1.3)), c: col });
    if (!coral && hash2(jx, jy, 10) > 0.5) canopy.push({ m: new THREE.Matrix4().compose(new THREE.Vector3(x + 0.2, h * 0.75 + 1.6 * s, z - 0.2), new THREE.Quaternion(), new THREE.Vector3(s, s, s)), c: col.clone().offsetHSL(0.02, 0, 0.06) });
  }
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.2, 1, 5), lambert(0x4a3a40), trunkPos.length);
  trunkPos.forEach((m, i) => trunks.setMatrixAt(i, m));
  const can = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), lambert(0xffffff), canopy.length);
  canopy.forEach((c, i) => { can.setMatrixAt(i, c.m); can.setColorAt(i, c.c); });
  group.add(trunks, can);
  // foreground fade (CPU, no discard): props between the camera and the focus hero sink and shrink
  const canBase = canopy.map((c) => { const p = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3(); c.m.decompose(p, q, sc); return { p, q, sc, f: 1 }; });
  const tmpM = new THREE.Matrix4(), tmpS = new THREE.Vector3(), tmpP = new THREE.Vector3();
  const treeFade = (fx: number, fz: number, cx: number, cz: number, dt: number) => {
    const abx = cx - fx, abz = cz - fz, l2 = abx * abx + abz * abz || 1;
    let dirty = false;
    for (let i = 0; i < canBase.length; i++) {
      const b = canBase[i];
      const dx = b.p.x - fx, dz = b.p.z - fz;
      let target = 1;
      if (dx * dx + dz * dz < 400) {
        const t = Math.max(0, Math.min(1, (dx * abx + dz * abz) / l2));
        const ex = b.p.x - (fx + abx * t), ez = b.p.z - (fz + abz * t);
        const d = Math.hypot(ex, ez);
        if (t > 0.01 && d < 4.2) target = 0.25 + Math.max(0, (d - 2.2) / 2) * 0.75;
      }
      if (Math.abs(b.f - target) > 0.01) {
        b.f += (target - b.f) * Math.min(1, dt * 8);
        tmpS.copy(b.sc).multiplyScalar(b.f); tmpP.copy(b.p); tmpP.y = b.p.y * (0.4 + 0.6 * b.f);
        tmpM.compose(tmpP, b.q, tmpS); can.setMatrixAt(i, tmpM); dirty = true;
      }
    }
    if (dirty) can.instanceMatrix.needsUpdate = true;
  };

  // ---- brush tufts
  const tufts: Array<{ m: THREE.Matrix4; c: THREE.Color }> = [];
  for (let cy = 0; cy < NAV_H; cy += 2) for (let cx = 0; cx < NAV_W; cx += 2) {
    const i = cy * NAV_W + cx;
    if (grid.cells[i] !== Cell.Brush) continue;
    const x = MAP_MIN_X + (cx + 0.5 + hash2(cx, cy, 11)) * NAV_CELL, z = MAP_MIN_Y + (cy + 0.5 + hash2(cx, cy, 12)) * NAV_CELL;
    const s = 0.6 + hash2(cx, cy, 13) * 0.5;
    tufts.push({ m: new THREE.Matrix4().compose(new THREE.Vector3(x, 0.45 * s, z), new THREE.Quaternion().setFromEuler(new THREE.Euler((hash2(cx, cy, 14) - 0.5) * 0.4, hash2(cx, cy, 15) * 6, 0)), new THREE.Vector3(s, s * 1.2, s)), c: new THREE.Color().setHSL(0.45 + hash2(cx, cy, 16) * 0.08, 0.55, 0.32 + hash2(cx, cy, 17) * 0.1) });
  }
  const brushMat = patchFog(new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 }));
  const tuftGeo = new THREE.ConeGeometry(0.35, 1.0, 5);
  const tuftMesh = new THREE.InstancedMesh(tuftGeo, brushMat, tufts.length);
  tufts.forEach((t, i) => { tuftMesh.setMatrixAt(i, t.m); tuftMesh.setColorAt(i, t.c); });
  group.add(tuftMesh);

  // ---- causeway props: ivory pillars and brass lamps along lane shoulders
  const pillars: THREE.Matrix4[] = [], lamps: THREE.Matrix4[] = [];
  LANES.forEach((lane, li) => {
    const pts = resample(lane, 9);
    pts.forEach((p, i) => {
      if (i < 2 || i > pts.length - 3) return;
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
      const nx = dy / l, ny = -dx / l;
      for (const side of [-1, 1]) {
        const x = p.x + nx * side * (LANE_HALF + 0.9), z = p.y + ny * side * (LANE_HALF + 0.9);
        const ci = Math.floor((z - MAP_MIN_Y) / NAV_CELL) * NAV_W + Math.floor((x - MAP_MIN_X) / NAV_CELL);
        if (grid.cells[ci] === Cell.Void) continue;
        if ((i + li + (side > 0 ? 1 : 0)) % 3 === 0) {
          const h = 1.2 + hash2(i, li * 7 + side, 3) * 2.2;
          pillars.push(new THREE.Matrix4().compose(new THREE.Vector3(x, h / 2, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, hash2(i, side, 2) * 3, (hash2(i, li, 5) - 0.5) * 0.25)), new THREE.Vector3(0.55, h, 0.55)));
        } else if ((i + li) % 3 === 1 && side > 0) {
          lamps.push(new THREE.Matrix4().makeTranslation(x, 0, z));
        }
      }
    });
  });
  const pil = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.5, 0.6, 1, 7), lambert(0xe9dfc6), pillars.length);
  pillars.forEach((m, i) => pil.setMatrixAt(i, m));
  group.add(pil);
  const lampPost = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.06, 0.09, 2.2, 5).translate(0, 1.1, 0), lambert(0x8a6a2c), lamps.length);
  const lampOrb = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.18, 0).translate(0, 2.3, 0), patchFog(new THREE.MeshBasicMaterial({ color: 0xffd98a })), lamps.length);
  lamps.forEach((m, i) => { lampPost.setMatrixAt(i, m); lampOrb.setMatrixAt(i, m); });
  group.add(lampPost, lampOrb);

  // pit rim stones
  const rim = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.9, 0), lambert(0x9c8aa8), 22);
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2;
    const x = Math.cos(a) * 9.2, z = Math.sin(a) * 9.2;
    const ci = Math.floor((z - MAP_MIN_Y) / NAV_CELL) * NAV_W + Math.floor((x - MAP_MIN_X) / NAV_CELL);
    const open = grid.cells[ci] !== Cell.Forest;
    rim.setMatrixAt(i, new THREE.Matrix4().compose(new THREE.Vector3(x, open ? -5 : 0.6, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(i, i * 2, 0)), new THREE.Vector3(1, 1.4, 1)));
  }
  group.add(rim);

  // ---- aether motes over river and pit
  const moteCount = quality === 'high' ? 260 : 90;
  const mg = new THREE.BufferGeometry();
  const mp = new Float32Array(moteCount * 3);
  const riverPts = resample(RIVER, 1);
  for (let i = 0; i < moteCount; i++) {
    const p = riverPts[Math.floor(hash2(i, 1, 3) * riverPts.length)];
    mp[i * 3] = p.x + (hash2(i, 2, 3) - 0.5) * 6; mp[i * 3 + 1] = 0.3 + hash2(i, 3, 3) * 2; mp[i * 3 + 2] = p.y + (hash2(i, 4, 3) - 0.5) * 6;
  }
  mg.setAttribute('position', new THREE.BufferAttribute(mp, 3));
  const motes = new THREE.Points(mg, new THREE.PointsMaterial({ color: 0xff8ae6, size: 0.25, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
  group.add(motes);
  animated.push((t) => { motes.position.y = Math.sin(t * 0.8) * 0.2; });

  // ---- void sky: stars, floating shards, distant clouds
  const starG = new THREE.BufferGeometry();
  const sp = new Float32Array(1500 * 3);
  for (let i = 0; i < 1500; i++) {
    const a = hash2(i, 1, 21) * Math.PI * 2, r = 90 + hash2(i, 2, 21) * 160;
    sp[i * 3] = Math.cos(a) * r; sp[i * 3 + 1] = -20 - hash2(i, 3, 21) * 120; sp[i * 3 + 2] = Math.sin(a) * r;
  }
  starG.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  group.add(new THREE.Points(starG, new THREE.PointsMaterial({ color: 0xbfd4ff, size: 0.9, sizeAttenuation: true, transparent: true, opacity: 0.8, depthWrite: false })));
  const shardN = 70;
  const shards = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshLambertMaterial({ color: 0x8a7fa6 }), shardN);
  const shardBase: Array<{ x: number; y: number; z: number; s: number; ph: number }> = [];
  for (let i = 0; i < shardN; i++) {
    const a = hash2(i, 5, 22) * Math.PI * 2, r = 85 + hash2(i, 6, 22) * 50;
    shardBase.push({ x: Math.cos(a) * r, y: -8 - hash2(i, 7, 22) * 30, z: Math.sin(a) * r * 0.8, s: 1 + hash2(i, 8, 22) * 4, ph: hash2(i, 9, 22) * 6 });
  }
  const sm = new THREE.Matrix4();
  animated.push((t) => {
    shardBase.forEach((b, i) => {
      sm.compose(new THREE.Vector3(b.x, b.y + Math.sin(t * 0.3 + b.ph) * 1.5, b.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(t * 0.05 + b.ph, t * 0.07, 0)), new THREE.Vector3(b.s, b.s * 0.7, b.s));
      shards.setMatrixAt(i, sm);
    });
    shards.instanceMatrix.needsUpdate = true;
  });
  group.add(shards);
  const cloudTex = makeCloudTexture();
  for (let i = 0; i < 2; i++) {
    const cl = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshBasicMaterial({ map: cloudTex, transparent: true, opacity: 0.18 - i * 0.03, depthWrite: false, color: i % 2 ? 0x9a6bd6 : 0x4a78d0 }));
    cl.rotation.x = -Math.PI / 2; cl.position.y = -25 - i * 18;
    group.add(cl);
    animated.push((t) => { cl.rotation.z = t * 0.004 * (i % 2 ? 1 : -1); });
  }
  void BRUSHES;
  return { group, animated, brushMat, minimapCanvas: paintGround(true), treeFade };
}

function makeCloudTexture(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  const img = g.createImageData(256, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const n = smoothNoise(x / 32, y / 32, 1) * 0.6 + smoothNoise(x / 12, y / 12, 2) * 0.4;
    const dx = x - 128, dy = y - 128;
    const fall = Math.max(0, 1 - Math.hypot(dx, dy) / 128);
    const v = Math.max(0, n - 0.35) * 2 * fall;
    const o = (y * 256 + x) * 4;
    img.data[o] = 255; img.data[o + 1] = 255; img.data[o + 2] = 255; img.data[o + 3] = v * 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  return t;
}
