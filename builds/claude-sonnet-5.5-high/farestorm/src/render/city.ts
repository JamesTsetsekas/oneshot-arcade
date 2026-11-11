import * as THREE from 'three';
import { Rng } from '../sim/rng';
import type { Block, Shortcut, World } from '../sim/world';
import { Geo, windowTexture } from './geo';
import { buildLandmark } from './landmarks';

export interface CityBuild {
  group: THREE.Group;
  signalHeads: THREE.InstancedMesh;
  signalMap: { node: number; axis: 'x' | 'z' }[];
  waterMat: THREE.ShaderMaterial;
}

const ROAD = 0x3b4150;
const ROAD_COBBLE = 0x8e8070;
const SIDEWALK = 0xd9cdb6;
const YELLOW = 0xffc93c;

const mat = (o: THREE.MeshLambertMaterialParameters = {}) => new THREE.MeshLambertMaterial({ vertexColors: true, ...o });

export function buildCity(world: World): CityBuild {
  const group = new THREE.Group();
  const rng = new Rng(4242);
  const ground = new Geo();
  const marks = new Geo();
  const glow = new Geo();
  const sceneryGlow = new Geo();
  const winTex = windowTexture();
  const wallMat = mat({ map: winTex });
  const solidMat = mat({ side: THREE.DoubleSide });
  const glowMat = new THREE.MeshBasicMaterial({ vertexColors: true, fog: true });
  const groundMat = mat({ side: THREE.DoubleSide });
  const markMat = new THREE.MeshBasicMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, side: THREE.DoubleSide });

  const { xs, zs, wx, wz, cols, rows } = world;
  const b = world.bounds;

  // --- base ground (sand-coloured earth under everything) & quay
  ground.flat(b.minX - 120, b.minZ - 120, b.maxX + 10, world.quayZ, -0.05, 0xe3d6bd);
  ground.flat(xs[0] - 8, zs[rows - 1] + wz[rows - 1] / 2, world.shallowX, world.quayZ, 0.0, 0xb9c4c9); // quay deck
  ground.flat(world.beachX, zs[0] - wz[0] / 2, world.shallowX, zs[rows - 1] + wz[rows - 1] / 2, 0.0, 0xf1dca4); // beach strip
  ground.flat(world.shallowX, zs[0] - wz[0] / 2, world.wallX, zs[rows - 1] + wz[rows - 1] / 2, -0.15, 0x7fd6d6); // shallows

  // --- roads per edge + intersection squares
  for (const e of world.edges) {
    const A = world.nodes[e.a], B = world.nodes[e.b];
    const steps = A.x < xs[2] + 20 && A.z > zs[2] - 20 && B.x < xs[2] + 20;
    const col = steps ? ROAD_COBBLE : ROAD;
    if (e.axis === 'x') ground.flat(A.x, A.z - e.width / 2, B.x, A.z + e.width / 2, 0.03, col);
    else ground.flat(A.x - e.width / 2, A.z, A.x + e.width / 2, B.z, 0.03, col);
  }
  for (const n of world.nodes) {
    const steps = n.x < xs[2] + 20 && n.z > zs[2] - 20;
    ground.flat(n.x - wx[n.i] / 2, n.z - wz[n.j] / 2, n.x + wx[n.i] / 2, n.z + wz[n.j] / 2, 0.035, steps ? ROAD_COBBLE : ROAD, 1.02);
  }

  // --- lane markings
  const dash = (ax: number, az: number, bx: number, bz: number, col: number, len = 3, gap = 3.2, wid = 0.28) => {
    const L = Math.hypot(bx - ax, bz - az);
    const dx = (bx - ax) / L, dz = (bz - az) / L;
    for (let t = 0; t + len <= L; t += len + gap) marks.strip(ax + dx * (t + len / 2), az + dz * (t + len / 2), dx, dz, len, wid, 0.07, col);
  };
  const solid = (ax: number, az: number, bx: number, bz: number, col: number, wid = 0.28) => {
    const L = Math.hypot(bx - ax, bz - az);
    marks.strip((ax + bx) / 2, (az + bz) / 2, (bx - ax) / L, (bz - az) / L, L, wid, 0.07, col);
  };
  for (const e of world.edges) {
    const A = world.nodes[e.a], B = world.nodes[e.b];
    const chA = (e.axis === 'x' ? wx[A.i] : wz[A.j]) / 2 + 1, chB = (e.axis === 'x' ? wx[B.i] : wz[B.j]) / 2 + 1;
    const dx = e.axis === 'x' ? 1 : 0, dz = e.axis === 'x' ? 0 : 1;
    const sx = A.x + dx * (chA + 4), sz = A.z + dz * (chA + 4), ex = B.x - dx * (chB + 4), ez = B.z - dz * (chB + 4);
    const w = e.width;
    const px = -dz, pz = dx;
    if (w >= 17) {
      // boulevard: double yellow centre + dashed lane lines
      solid(sx + px * 0.25, sz + pz * 0.25, ex + px * 0.25, ez + pz * 0.25, YELLOW, 0.2);
      solid(sx - px * 0.25, sz - pz * 0.25, ex - px * 0.25, ez - pz * 0.25, YELLOW, 0.2);
      for (const k of [-1, 1]) dash(sx + px * w * 0.25 * k, sz + pz * w * 0.25 * k, ex + px * w * 0.25 * k, ez + pz * w * 0.25 * k, 0xf4f4f4, 3, 4);
    } else {
      dash(sx, sz, ex, ez, YELLOW, 3.4, 3.4, 0.24);
    }
    // edge lines
    for (const k of [-1, 1]) solid(sx + px * (w / 2 - 0.5) * k, sz + pz * (w / 2 - 0.5) * k, ex + px * (w / 2 - 0.5) * k, ez + pz * (w / 2 - 0.5) * k, 0xe9e4d8, 0.16);
    // crosswalks + stop lines at both ends
    for (const [nx, nz, sgn, ch] of [[A.x, A.z, 1, chA], [B.x, B.z, -1, chB]] as [number, number, number, number][]) {
      const cxp = nx + dx * sgn * (ch + 1.4), czp = nz + dz * sgn * (ch + 1.4);
      const n = Math.floor((w - 1) / 1.5);
      for (let k = 0; k < n; k++) {
        const off = (k - (n - 1) / 2) * 1.5;
        marks.strip(cxp + px * off, czp + pz * off, dx, dz, 2.6, 0.7, 0.07, 0xf2eee4);
      }
      const spx = nx + dx * sgn * (ch + 3.5), spz = nz + dz * sgn * (ch + 3.5);
      // stop line on the right-hand (incoming) lane only
      const laneC = (sgn === 1 ? -1 : 1) * 0; void laneC;
      marks.strip(spx + px * w * 0.25 * (sgn === 1 ? 1 : -1), spz + pz * w * 0.25 * (sgn === 1 ? 1 : -1), px, pz, w * 0.5 - 0.8, 0.4, 0.07, 0xf2eee4);
    }
  }

  // --- blocks: sidewalks, open surfaces, buildings, props
  const roofGeo = new Geo();
  const wallGeo: Geo[] = [];
  const props = new Geo();
  const lamps = new Geo();
  const neon = glow;

  const covered: { sc: Shortcut; block: Block }[] = [];

  for (const blk of world.blocks) {
    const r = blk.rect, inn = blk.inner;
    // sidewalk ring (whole block gets pale paving, interiors are overpainted)
    ground.flat(r.minX, r.minZ, r.maxX, r.maxZ, 0.06, SIDEWALK, 1);
    // curb line
    for (const [x0, z0, x1, z1] of [[r.minX, r.minZ, r.maxX, r.minZ + 0.35], [r.minX, r.maxZ - 0.35, r.maxX, r.maxZ], [r.minX, r.minZ, r.minX + 0.35, r.maxZ], [r.maxX - 0.35, r.minZ, r.maxX, r.maxZ]]) ground.flat(x0, z0, x1, z1, 0.075, 0x9aa0a8);

    if (blk.open) {
      const base = blk.kind === 'P' ? 0x62c47e : blk.kind === 'S' ? 0xf2dca6 : blk.kind === 'Z' ? 0xe9dcc2 : 0x8a949c;
      ground.flat(inn.minX, inn.minZ, inn.maxX, inn.maxZ, 0.08, base);
      if (blk.kind === 'P') {
        for (let k = 0; k < 14; k++) {
          const x = rng.range(inn.minX, inn.maxX - 12), z = rng.range(inn.minZ, inn.maxZ - 12);
          ground.flat(x, z, x + rng.range(6, 12), z + rng.range(6, 12), 0.085, rng.pick([0x58b975, 0x6ccf86, 0x4faa6c]));
        }
      } else if (blk.kind === 'Z') {
        const tile = 8;
        for (let x = inn.minX; x < inn.maxX - tile; x += tile * 2) for (let z = inn.minZ; z < inn.maxZ - tile; z += tile * 2) {
          ground.flat(x, z, x + tile, z + tile, 0.085, 0xcdbf9f);
          ground.flat(x + tile, z + tile, x + tile * 2, z + tile * 2, 0.085, 0xcdbf9f);
        }
      } else if (blk.kind === 'S') {
        for (let k = 0; k < 16; k++) {
          const x = rng.range(inn.minX, inn.maxX - 14), z = rng.range(inn.minZ, inn.maxZ - 6);
          ground.flat(x, z, x + rng.range(8, 20), z + rng.range(1.5, 5), 0.085, rng.pick([0xe9cf90, 0xf8e8bd]));
        }
        // boardwalk planks along the road-facing edge
        ground.flat(inn.minX, inn.maxZ - 4, inn.maxX, inn.maxZ - 1, 0.1, 0xb98b5e);
      } else {
        for (let z = inn.minZ + 6; z < inn.maxZ - 3; z += 14) marks.strip((inn.minX + inn.maxX) / 2, z, 1, 0, inn.maxX - inn.minX - 8, 0.3, 0.12, 0xe8c64a);
      }
    }

    // alley floor
    if (blk.alleyAxis) {
      const sc = world.shortcuts.find((s) => s.blockIdx === blk.idx)!;
      const col = sc.surface === 'metal' ? 0x6f7b88 : sc.kind === 'garage' ? 0x59606c : 0x9c8a74;
      if (blk.alleyAxis === 'x') ground.flat(r.minX, blk.alleyCenter! - blk.alleyHalf, r.maxX, blk.alleyCenter! + blk.alleyHalf, 0.09, col);
      else ground.flat(blk.alleyCenter! - blk.alleyHalf, r.minZ, blk.alleyCenter! + blk.alleyHalf, r.maxZ, 0.09, col);
      if (sc.kind === 'tram') {
        // rails
        const horizontal = blk.alleyAxis === 'x';
        for (const o of [-1.1, 1.1]) {
          if (horizontal) marks.strip((r.minX + r.maxX) / 2, blk.alleyCenter! + o, 1, 0, r.maxX - r.minX, 0.18, 0.11, 0xc9ced6);
          else marks.strip(blk.alleyCenter! + o, (r.minZ + r.maxZ) / 2, 0, 1, r.maxZ - r.minZ, 0.18, 0.11, 0xc9ced6);
        }
      }
      if (sc.covered) covered.push({ sc, block: blk });
    }

    // buildings
    const wg = new Geo();
    for (const bd of blk.buildings) {
      const rc = bd.rect;
      const cx = (rc.minX + rc.maxX) / 2, cz = (rc.minZ + rc.maxZ) / 2;
      const sx = rc.maxX - rc.minX, sz = rc.maxZ - rc.minZ;
      if (bd.landmark !== undefined) {
        const lm = world.destinations[bd.landmark].landmark;
        wg.box(cx, 0, cz, sx, 2.2, sz, 0xd0c4aa, { noBottom: true });
        buildLandmark(props, sceneryGlow, lm);
        continue;
      }
      const h = bd.h;
      const wallCol = bd.color;
      wg.box(cx, 0, cz, sx, h, sz, wallCol, { windows: true, topColor: bd.roof, cell: bd.style === 'warehouse' ? 8 : 5 });
      // cornice / roof lip
      roofGeo.box(cx, h, cz, sx + 0.6, 0.7, sz + 0.6, bd.roof);
      if (bd.style === 'tower') {
        wg.box(cx, h, cz, sx * 0.6, h * 0.22, sz * 0.6, wallCol, { windows: true, topColor: bd.roof });
        roofGeo.cyl(cx, h + h * 0.22, cz, 0.15, 0.3, 6, 0xdadada, 5);
      } else if (bd.style === 'hotel') {
        roofGeo.box(cx, h * 0.45, cz + sz / 2 + 1.4, sx * 0.8, 0.5, 3, rng.pick([0xff5e57, 0x19b3a6, 0xffd34d]));
      } else if (bd.style === 'neon') {
        // neon trim bands + a vertical sign
        const col = rng.pick([0xff3df2, 0x2ee6ff, 0xff8a2b, 0x7cff6b]);
        neon.box(cx, h * 0.55, cz + sz / 2 + 0.08, sx * 0.96, 0.5, 0.2, col);
        neon.box(cx, h * 0.3, cz + sz / 2 + 0.08, sx * 0.96, 0.4, 0.2, rng.pick([0xff3df2, 0x2ee6ff]));
        neon.box(cx + sx / 2 + 0.08, h * 0.5, cz, 0.2, h * 0.5, 0.8, col);
      } else if (bd.style === 'warehouse') {
        roofGeo.box(cx, h + 0.7, cz, sx * 0.9, 1.4, sz * 0.14, 0x5a6b75);
        wg.box(cx, 0, cz + sz / 2 + 0.05, sx * 0.9, 1.2, 0.3, rng.pick([0xe2574c, 0x2f6bff, 0xf2a93b]), { noBottom: true });
      } else if (rng.chance(0.5)) {
        // rooftop water tank / vent
        roofGeo.cyl(cx + rng.range(-sx / 4, sx / 4), h + 0.7, cz + rng.range(-sz / 4, sz / 4), 1.3, 1.3, 2.6, 0xb08a6b, 8);
      }
    }
    wallGeo.push(wg);

    // props
    for (const p of blk.props) {
      switch (p.kind) {
        case 'tree': {
          props.cyl(p.x, 0, p.z, 0.25, 0.4, p.h * 0.45, 0x7a5a3a, 6);
          props.sphere(p.x, p.h * 0.7, p.z, p.h * 0.38, p.color, 1, 1.1, 1, 8);
          break;
        }
        case 'palm': {
          const g = new THREE.CylinderGeometry(0.25, 0.4, p.h, 6);
          const m = new THREE.Matrix4().compose(new THREE.Vector3(p.x, p.h / 2, p.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0.12, p.rot, 0.06)), new THREE.Vector3(1, 1, 1));
          props.add(g, m, 0xa07850);
          g.dispose();
          for (let k = 0; k < 6; k++) {
            const a = (k / 6) * Math.PI * 2 + p.rot;
            props.rbox(p.x + Math.cos(a) * 1.6, p.h - 0.3, p.z + Math.sin(a) * 1.6, 3.4, 0.14, 0.9, p.color, -a, 0.22);
          }
          break;
        }
        case 'umbrella':
          props.cyl(p.x, 0, p.z, 0.06, 0.06, 2.4, 0xf0f0f0, 4);
          props.cyl(p.x, 2.3, p.z, 0.1, 1.9, 0.6, p.color, 8);
          break;
        case 'hut':
          props.box(p.x, 0, p.z, p.w ?? 5, p.h, p.d ?? 4, p.color);
          props.box(p.x, p.h, p.z, (p.w ?? 5) + 1, 0.4, (p.d ?? 4) + 1, 0xd1495b);
          break;
        case 'container':
          props.box(p.x, 0, p.z, p.w ?? 6, p.h, p.d ?? 2.5, p.color, { topColor: p.color });
          break;
        case 'bench':
          props.box(p.x, 0, p.z, p.w ?? 2, 0.5, p.d ?? 0.7, p.color);
          break;
        case 'fountain':
          props.cyl(p.x, 0, p.z, 4, 4.2, 0.9, 0xe9dcc2, 18);
          sceneryGlow.cyl(p.x, 0.85, p.z, 3.5, 3.5, 0.1, 0x7fd8e8, 18);
          props.cyl(p.x, 0.9, p.z, 0.5, 0.7, 3.4, 0xe9dcc2, 8);
          sceneryGlow.sphere(p.x, 4.4, p.z, 0.9, 0xbfefff);
          break;
        case 'statue':
          props.cyl(p.x, 0, p.z, 1.3, 1.6, 2, 0xcfc3a8, 8);
          props.cyl(p.x, 2, p.z, 0.5, 0.8, 3.6, 0xe6d6b8, 8);
          props.sphere(p.x, 6, p.z, 0.8, 0xe6d6b8);
          break;
        case 'boulder':
          props.sphere(p.x, 0.9, p.z, p.r, p.color, 1, 0.7, 1, 6);
          break;
        default: break;
      }
    }

    // sidewalk trees and lamps in dense blocks
    if (!blk.open) {
      const spacing = 26;
      const edges: [number, number, number, number][] = [
        [r.minX + 14, r.minZ + 1.6, 1, 0], [r.minX + 14, r.maxZ - 1.6, 1, 0],
      ];
      for (const [sx0, sz0] of edges) {
        for (let x = sx0; x < r.maxX - 10; x += spacing) {
          lamps.cyl(x, 0, sz0, 0.1, 0.14, 5.4, 0x55606e, 5);
          lamps.box(x, 5.2, sz0, 0.9, 0.2, 0.3, 0x55606e);
          sceneryGlow.box(x + (sz0 < (r.minZ + r.maxZ) / 2 ? 0.25 : -0.25), 5.05, sz0 + (sz0 < (r.minZ + r.maxZ) / 2 ? 0.45 : -0.45), 0.5, 0.15, 0.3, 0xfff2c8);
          if (rng.chance(0.4)) {
            props.cyl(x + 9, 0, sz0, 0.18, 0.25, 2.2, 0x7a5a3a, 5);
            props.sphere(x + 9, 3.2, sz0, 1.7, rng.pick([0x3dbb6a, 0x2f9e5b, 0x59c97a]), 1, 1.1, 1, 7);
          }
        }
      }
    }
  }

  // --- covered alleys: roof slab + arch posts
  for (const { sc, block } of covered) {
    const horizontal = block.alleyAxis === 'x';
    const len = horizontal ? block.rect.maxX - block.rect.minX : block.rect.maxZ - block.rect.minZ;
    const roofLen = len - 6;
    if (horizontal) roofGeo.box((block.rect.minX + block.rect.maxX) / 2, 5.4, block.alleyCenter!, roofLen, 0.7, block.alleyHalf * 2 + 1, sc.kind === 'garage' ? 0x59606c : 0x4a4f5c, { noBottom: false });
    else roofGeo.box(block.alleyCenter!, 5.4, (block.rect.minZ + block.rect.maxZ) / 2, block.alleyHalf * 2 + 1, 0.7, roofLen, sc.kind === 'garage' ? 0x59606c : 0x4a4f5c);
  }

  // --- shortcut gates (readable entrances) + chevrons
  const kindColor: Record<string, number> = { alley: 0xff8a2b, tunnel: 0x2ee6ff, deck: 0xffc93c, tram: 0xff5e57, garage: 0xa855f7, ferry: 0x19b3a6, terrace: 0x7cff6b, dune: 0xffd34d, plaza: 0xff3df2, yard: 0xff8a2b };
  for (const sc of world.shortcuts) {
    const col = kindColor[sc.kind] ?? 0xffffff;
    const L = Math.hypot(sc.bx - sc.ax, sc.bz - sc.az);
    const dx = (sc.bx - sc.ax) / L, dz = (sc.bz - sc.az) / L;
    for (const end of [0, 1]) {
      const ex = end ? sc.bx : sc.ax, ez = end ? sc.bz : sc.az;
      const sgn = end ? -1 : 1;
      const rx = -dz, rz = dx;
      const half = sc.width / 2 + 0.7;
      const open = sc.kind === 'terrace' || sc.kind === 'dune' || sc.kind === 'plaza' || sc.kind === 'yard';
      if (!open) {
        // posts + lintel
        for (const k of [-1, 1]) props.box(ex + rx * half * k, 0, ez + rz * half * k, 0.7, 4.6, 0.7, 0x4a4f5c);
        const lin = new THREE.BoxGeometry(sc.width + 2.2, 0.9, 0.8);
        const mm = new THREE.Matrix4().compose(new THREE.Vector3(ex, 4.9, ez), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.atan2(rx, rz), 0)), new THREE.Vector3(1, 1, 1));
        props.add(lin, mm, 0x4a4f5c);
        const gl = new THREE.BoxGeometry(sc.width + 1.6, 0.42, 0.9);
        sceneryGlow.add(gl, new THREE.Matrix4().compose(new THREE.Vector3(ex, 4.9, ez), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.atan2(rx, rz), 0)), new THREE.Vector3(1, 1, 1)), col, false);
        lin.dispose(); gl.dispose();
      } else {
        // cairns / flag poles marking an open-field line
        for (const k of [-1, 1]) {
          props.cyl(ex + rx * half * k, 0, ez + rz * half * k, 0.12, 0.16, 5.2, 0xdadada, 5);
          sceneryGlow.box(ex + rx * half * k, 5.2, ez + rz * half * k, 1.3, 0.7, 0.14, col);
        }
      }
      // ground chevrons pointing into the shortcut
      for (let c = 0; c < 4; c++) {
        const px = ex + dx * sgn * (3.2 + c * 2.4), pz = ez + dz * sgn * (3.2 + c * 2.4);
        const wch = Math.min(sc.width * 0.6, 3.6);
        // simple chevron as two thin strips
        marks.strip(px - rx * wch * 0.5 + dx * sgn * 0.4, pz - rz * wch * 0.5 + dz * sgn * 0.4, rx * 0.8 + dx * sgn * 0.6, rz * 0.8 + dz * sgn * 0.6, wch, 0.35, 0.14, col);
        marks.strip(px + rx * wch * 0.5 + dx * sgn * 0.4, pz + rz * wch * 0.5 + dz * sgn * 0.4, -rx * 0.8 + dx * sgn * 0.6, -rz * 0.8 + dz * sgn * 0.6, wch, 0.35, 0.14, col);
      }
    }
  }

  // --- ramps (wedge) with hazard stripes
  for (const rp of world.ramps) {
    const hw = rp.width / 2;
    const rxn = -rp.dz, rzn = rp.dx;
    const p = (a: number, s: number, y: number) => [rp.x + rp.dx * a + rxn * s, y, rp.z + rp.dz * a + rzn * s];
    props.quad([p(0, -hw, 0.1), p(0, hw, 0.1), p(rp.len, hw, rp.height), p(rp.len, -hw, rp.height)].reverse(), 0x8d96a3);
    props.quad([p(0, -hw, 0.1), p(rp.len, -hw, rp.height), p(rp.len, -hw, 0), p(0, -hw, 0)], 0x5a626e);
    props.quad([p(0, hw, 0), p(rp.len, hw, 0), p(rp.len, hw, rp.height), p(0, hw, 0.1)], 0x5a626e);
    props.quad([p(rp.len, -hw, 0), p(rp.len, -hw, rp.height), p(rp.len, hw, rp.height), p(rp.len, hw, 0)], 0x4a4f5c);
    for (let k = 0; k < 6; k++) {
      const a0 = (k / 6) * rp.len, a1 = ((k + 0.5) / 6) * rp.len;
      const h0 = (a0 / rp.len) * rp.height + 0.14, h1 = (a1 / rp.len) * rp.height + 0.14;
      marks.quad([p(a0, -hw, h0), p(a0, -hw + 0.7, h0), p(a1, -hw + 0.7, h1), p(a1, -hw, h1)].reverse(), YELLOW);
      marks.quad([p(a0, hw - 0.7, h0), p(a0, hw, h0), p(a1, hw, h1), p(a1, hw - 0.7, h1)].reverse(), YELLOW);
    }
    sceneryGlow.box(rp.x + rp.dx * (rp.len - 0.4), rp.height + 0.1, rp.z + rp.dz * (rp.len - 0.4), rp.width, 0.15, 0.3, 0xff8a2b);
  }

  // --- perimeter: sea wall, hills, buoys
  const hills = new Geo();
  for (let x = b.minX - 40; x < b.maxX + 100; x += 70) {
    const hh = rng.range(45, 85);
    const g = new THREE.ConeGeometry(rng.range(60, 95), hh, 7);
    hills.add(g, new THREE.Matrix4().makeTranslation(x, hh / 2 - 6, b.minZ - rng.range(70, 130)), rng.pick([0x5aa96a, 0x4f9a63, 0x6bb878, 0x8aa88a]));
    g.dispose();
  }
  for (let z = b.minZ; z < world.quayZ; z += 80) {
    const hh = rng.range(40, 75);
    const g = new THREE.ConeGeometry(rng.range(55, 85), hh, 7);
    hills.add(g, new THREE.Matrix4().makeTranslation(b.minX - rng.range(60, 120), hh / 2 - 6, z), rng.pick([0x5aa96a, 0x4f9a63, 0x6bb878, 0x8aa88a]));
    g.dispose();
  }
  // terraced villas up the western hill (Old Steps backdrop)
  for (let k = 0; k < 14; k++) {
    const z = b.minZ + 30 + k * 40, x = b.minX - 14 - (k % 3) * 9;
    hills.box(x, 4 + (k % 3) * 5, z, 14, 6 + (k % 3) * 3, 18, rng.pick([0xf2e3c4, 0xe9cfa0, 0xe8b9a0]));
    hills.box(x, 10 + (k % 3) * 8, z, 15, 0.8, 19, 0xc8553d);
  }
  const wallCol = 0xcfc7b8;
  props.box((b.minX + b.maxX) / 2 - 6, 0, b.minZ - 1.2, b.maxX - b.minX + 20, 2.8, 2.4, wallCol);
  props.box(b.minX - 1.2, 0, (b.minZ + world.quayZ) / 2, 2.4, 2.8, world.quayZ - b.minZ, wallCol);
  // quay edge: bollards + kerb
  for (let x = xs[0]; x < world.shallowX; x += 18) {
    props.cyl(x, 0, world.quayZ - 0.6, 0.35, 0.35, 0.9, 0x2b3340, 6);
    sceneryGlow.cyl(x, 0.9, world.quayZ - 0.6, 0.2, 0.2, 0.15, 0xff8a2b, 6);
  }
  props.box((xs[0] + world.shallowX) / 2, -0.2, world.quayZ - 0.2, world.shallowX - xs[0], 0.7, 0.6, 0x8a949c);
  // buoy line east
  for (let z = b.minZ + 4; z < world.quayZ; z += 12) {
    sceneryGlow.sphere(world.wallX - 3, 0.2, z, 0.9, z % 24 < 12 ? 0xff5e57 : 0xffffff);
    props.sphere(world.wallX - 3, 0.2, z, 0.2, 0x333, 1, 1, 1, 4);
  }
  // beach palms along the east boardwalk + beach umbrellas past the last road
  for (let z = zs[0] + 30; z < zs[rows - 1] - 30; z += 36) {
    const x = world.beachX + 12 + rng.range(-3, 18);
    props.cyl(x, 0, z, 0.25, 0.4, 7, 0xa07850, 6);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      props.rbox(x + Math.cos(a) * 1.6, 6.9, z + Math.sin(a) * 1.6, 3.4, 0.14, 0.9, 0x2fa85a, -a, 0.22);
    }
  }
  // harbor ship silhouettes beyond the quay
  for (const [sx, sz, col] of [[300, world.quayZ + 70, 0xe2574c], [680, world.quayZ + 120, 0x2f6bff]] as [number, number, number][]) {
    hills.box(sx, 0, sz, 90, 9, 22, col);
    hills.box(sx + 20, 9, sz, 22, 12, 16, 0xf6efe0);
    hills.cyl(sx + 24, 21, sz, 2.4, 2.8, 8, 0x333c4a, 8);
  }

  // --- assemble meshes
  const addMesh = (g: Geo, m: THREE.Material, cast: boolean, receive: boolean) => {
    if (g.empty) return;
    const mesh = new THREE.Mesh(g.build(), m);
    mesh.castShadow = cast;
    mesh.receiveShadow = receive;
    group.add(mesh);
  };
  addMesh(ground, groundMat, false, true);
  addMesh(marks, markMat, false, false);
  for (const wg of wallGeo) addMesh(wg, wallMat, true, true);
  addMesh(roofGeo, solidMat, true, true);
  addMesh(props, solidMat, true, true);
  addMesh(lamps, solidMat, false, false);
  addMesh(hills, solidMat, false, false);
  addMesh(glow, glowMat, false, false);
  addMesh(sceneryGlow, glowMat, false, false);

  // --- water: animated shader plane
  const waterMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uFog: { value: new THREE.Color(0xf5c9a0) }, uDeep: { value: new THREE.Color(0x1d6fb8) }, uShallow: { value: new THREE.Color(0x3ec6d6) } },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `
      uniform float uTime; uniform vec3 uFog; uniform vec3 uDeep; uniform vec3 uShallow; varying vec3 vW;
      float h(vec2 p){ return sin(p.x*0.21+uTime*0.9)*0.5+sin(p.y*0.17-uTime*0.7)*0.5+sin((p.x+p.y)*0.11+uTime*0.5)*0.5; }
      void main(){
        vec2 p = vW.xz;
        float w = h(p)*0.5+0.5;
        float coast = smoothstep(0.0, 120.0, length(vec2(max(vW.x-940.0,0.0), max(vW.z-662.0,0.0))));
        vec3 col = mix(uShallow, uDeep, coast*0.9);
        float spark = pow(max(0.0, sin(p.x*0.9+uTime*2.0)*sin(p.y*0.8-uTime*1.7)), 14.0);
        col += vec3(0.85,0.95,1.0)*spark*0.45 + w*0.06;
        float d = length(vW.xz - cameraPosition.xz);
        col = mix(col, uFog, smoothstep(250.0, 900.0, d));
        gl_FragColor = vec4(col,1.0);
      }`,
  });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000).rotateX(-Math.PI / 2), waterMat);
  water.position.set(500, -0.45, 400);
  group.add(water);

  // --- traffic signal heads (instanced, recoloured as phases change)
  const signalMap: { node: number; axis: 'x' | 'z' }[] = [];
  const headGeo = new THREE.BoxGeometry(0.42, 0.95, 0.42);
  headGeo.translate(0, 4.5, 0);
  const poles = new Geo();
  const heads = new THREE.InstancedMesh(headGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }), world.nodes.length * 4);
  heads.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(world.nodes.length * 4 * 3), 3);
  let hi = 0;
  const tm = new THREE.Matrix4();
  for (const n of world.nodes) {
    const hx = wx[n.i] / 2 + 0.9, hz = wz[n.j] / 2 + 0.9;
    for (const [sx, sz, axis] of [[-hx, -hz, 'x'], [hx, hz, 'x'], [hx, -hz, 'z'], [-hx, hz, 'z']] as [number, number, 'x' | 'z'][]) {
      tm.makeTranslation(n.x + sx, 0, n.z + sz);
      heads.setMatrixAt(hi, tm);
      signalMap.push({ node: n.id, axis });
      heads.setColorAt(hi, new THREE.Color(0x30ff7a));
      poles.cyl(n.x + sx, 0, n.z + sz, 0.09, 0.12, 4.6, 0x3a414d, 5);
      hi++;
    }
  }
  addMesh(poles, solidMat, false, false);
  heads.count = hi;
  heads.frustumCulled = false;
  group.add(heads);

  return { group, signalHeads: heads, signalMap, waterMat };
}
