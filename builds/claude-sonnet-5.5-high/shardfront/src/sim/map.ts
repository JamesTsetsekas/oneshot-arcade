// world: terrain metadata, occupancy-independent static map data for "Glass Ravine".
// The layout is authored on a coarse 48x48 glyph grid (3 cells per glyph) with exact 180-degree rotational symmetry
// for gameplay features; decoration seeds differ per half ("symmetrical but not identical").

export const MAP_SIZE = 144;
const CH = 3;
const GN = MAP_SIZE / CH; // 48

export interface MapSite { id: string; x: number; y: number; kind: 'main' | 'natural' | 'side'; start: -1 | 0 | 1 }
export interface ResSpawn { kind: 'ore' | 'vent'; x: number; y: number; w: number; h: number; amount: number; site: string }
export interface Rect { x: number; y: number; w: number; h: number }
export interface GameMap {
  size: number;
  /** ground-blocked cells (rock, cliff, border) */
  blocked: Uint8Array;
  /** chasm cells: ground-blocked, hover-passable */
  chasm: Uint8Array;
  brush: Uint8Array;
  bridge: Uint8Array;
  ramp: Uint8Array;
  /** smoothed terrain height per cell centre (used for rendering and vision) */
  heightC: Float32Array;
  /** height per corner, (size+1)^2 */
  heightV: Float32Array;
  starts: [{ x: number; y: number }, { x: number; y: number }];
  sites: MapSite[];
  resources: ResSpawn[];
  pylons: Array<{ x: number; y: number }>;
  pods: Array<{ x: number; y: number }>;
  barriers: Rect[];
  /** debug visualisation class per cell: 0 walkable,1 blocked,2 hover-only,3 brush,4 bridge,5 ramp */
  surface: Uint8Array;
}

function noiseHash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  h ^= h >>> 16;
  return ((h >>> 0) % 10000) / 10000;
}
/** rotationally symmetric noise */
const symNoise = (x: number, y: number) => {
  const a = noiseHash(x, y);
  const b = noiseHash(MAP_SIZE - 1 - x, MAP_SIZE - 1 - y);
  return x + y * MAP_SIZE <= (MAP_SIZE - 1 - x) + (MAP_SIZE - 1 - y) * MAP_SIZE ? a : b;
};

export function glyphGrid(): string[][] {
  const g: string[][] = Array.from({ length: GN }, () => Array<string>(GN).fill('.'));
  const put = (r: number, c: number, ch: string) => {
    if (r < 0 || c < 0 || r >= GN || c >= GN) return;
    g[r][c] = ch;
    g[GN - 1 - r][GN - 1 - c] = ch;
  };
  const rect = (r0: number, r1: number, c0: number, c1: number, ch: string) => {
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) put(r, c, ch);
  };
  const disc = (r: number, c: number, rad: number, ch: string) => {
    for (let rr = Math.floor(r - rad); rr <= Math.ceil(r + rad); rr++)
      for (let cc = Math.floor(c - rad); cc <= Math.ceil(c + rad); cc++) if ((rr - r) ** 2 + (cc - c) ** 2 <= rad * rad) put(rr, cc, ch);
  };
  // border
  for (let i = 0; i < GN; i++) { put(0, i, '#'); put(i, 0, '#'); put(i, GN - 1, '#'); put(GN - 1, i, '#'); }
  // chasm along the main diagonal
  for (let r = 1; r < GN - 1; r++) for (let c = Math.max(1, r - 2); c <= Math.min(GN - 2, r + 2); c++) put(r, c, ':');
  rect(1, 3, 1, 3, '#');
  // central basin (lower route) with ramps on both sides
  disc(23.5, 23.5, 4.3, 'o');
  // main plateaus (high ground) in opposite corners
  rect(1, 12, 33, 46, '^');
  rect(13, 14, 37, 40, 'r');
  // natural pocket: rock walls with a west gate, a south gate and a barrier-plugged back door
  rect(14, 25, 33, 34, '#');
  rect(18, 19, 33, 34, '.');
  rect(25, 26, 35, 46, '#');
  rect(25, 26, 40, 41, '.');
  rect(25, 26, 45, 45, 'c');
  // basin ramps (NE side + mirrored SW side)
  rect(20, 22, 27, 28, 'r');
  // NW / SE bridges across the chasm
  rect(13, 14, 9, 18, 'b');
  // rock formations for cover in the open ground
  disc(10, 26, 1.3, '#');
  disc(18, 15, 1.2, '#');
  disc(27, 36, 1.4, '#');
  disc(5, 12, 1.2, '#');
  // vision-blocking brush
  disc(16, 23, 1.8, ',');
  disc(9, 17, 1.8, ',');
  disc(22, 33, 1.6, ',');
  disc(7, 29, 1.5, ',');
  // watch pylon plazas are open ground (nothing needed)
  return g;
}

const lvlOf = (ch: string): number | null => {
  switch (ch) {
    case '.': case ',': case 'b': case 'c': return 1;
    case '^': return 2;
    case 'o': return 0;
    default: return null; // '#', ':', 'r'
  }
};

function box3(src: Float32Array, n: number): Float32Array {
  const out = new Float32Array(n * n);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      let s = 0, c = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= n || yy >= n) continue;
        s += src[yy * n + xx]; c++;
      }
      out[y * n + x] = s / c;
    }
  }
  return out;
}

const ROT = (v: number) => MAP_SIZE - v;
const rotRect = (r: Rect): Rect => ({ x: ROT(r.x + r.w), y: ROT(r.y + r.h), w: r.w, h: r.h });

function arcPositions(cx: number, cy: number, radius: number, a0: number, a1: number, count: number): Array<{ x: number; y: number }> {
  const out: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const a = ((a0 + (a1 - a0) * t) * Math.PI) / 180;
    out.push({ x: cx + Math.cos(a) * radius, y: cy + Math.sin(a) * radius });
  }
  return out;
}

export function buildMap(): GameMap {
  const g = glyphGrid();
  const N = MAP_SIZE;
  // --- cliff bands where levels differ (on the higher side), except next to ramps
  const glyph = (r: number, c: number) => (r < 0 || c < 0 || r >= GN || c >= GN ? '#' : g[r][c]);
  const gl: string[][] = g.map((row) => row.slice());
  for (let r = 0; r < GN; r++) {
    for (let c = 0; c < GN; c++) {
      const L = lvlOf(g[r][c]);
      if (L === null) continue;
      let cliff = false;
      for (let dr = -1; dr <= 1 && !cliff; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const Ln = lvlOf(glyph(r + dr, c + dc));
        if (Ln !== null && Ln < L) { cliff = true; break; }
      }
      if (cliff) {
        // suppress next to ramps (4-neighbour)
        let nearRamp = false;
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (glyph(r + dr, c + dc) === 'r') nearRamp = true;
        if (!nearRamp) gl[r][c] = 'x';
      }
    }
  }
  // --- char-level indicators at cell resolution
  const gAt = (x: number, y: number) => gl[Math.floor(y / CH)][Math.floor(x / CH)];
  const rockI = new Float32Array(N * N);
  const chasmI = new Float32Array(N * N);
  const brushI = new Float32Array(N * N);
  const hRaw = new Float32Array(N * N);
  const heightOfGlyph = (r: number, c: number): number => {
    const ch = g[r][c];
    switch (ch) {
      case '^': return 3;
      case 'o': return -1.6;
      case ':': return -6.5;
      case '#': return 5.5;
      case 'r': {
        let s = 0, n = 0;
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
          const rr = r + dr, cc = c + dc;
          if (rr < 0 || cc < 0 || rr >= GN || cc >= GN) continue;
          const l = lvlOf(g[rr][cc]);
          if (l !== null) { s += l === 2 ? 3 : l === 0 ? -1.6 : 0; n++; }
        }
        return n ? s / n : 0;
      }
      default: return 0;
    }
  };
  const bridgeMask = new Uint8Array(N * N);
  const rampMask = new Uint8Array(N * N);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const ch = gAt(x, y);
      const i = y * N + x;
      rockI[i] = ch === '#' || ch === 'x' ? 1 : 0;
      chasmI[i] = ch === ':' ? 1 : 0;
      brushI[i] = ch === ',' ? 1 : 0;
      hRaw[i] = heightOfGlyph(Math.floor(y / CH), Math.floor(x / CH));
      if (ch === 'b') bridgeMask[i] = 1;
      if (ch === 'r') rampMask[i] = 1;
    }
  }
  const rockB = box3(box3(rockI, N), N);
  const chasmB = box3(box3(chasmI, N), N);
  const brushB = box3(box3(brushI, N), N);
  const hB = box3(box3(hRaw, N), N);

  const blocked = new Uint8Array(N * N);
  const chasm = new Uint8Array(N * N);
  const brush = new Uint8Array(N * N);
  const bridge = new Uint8Array(N * N);
  const ramp = new Uint8Array(N * N);
  const surface = new Uint8Array(N * N);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const i = y * N + x;
      const nz = (symNoise(x, y) - 0.5) * 0.16;
      let b = rockB[i] + nz > 0.5 ? 1 : 0;
      let c = chasmB[i] + nz > 0.5 ? 1 : 0;
      if (bridgeMask[i]) { b = 0; c = 0; bridge[i] = 1; }
      if (rampMask[i]) { b = 0; c = 0; ramp[i] = 1; }
      // hard border: first 2 cells always blocked
      if (x < 2 || y < 2 || x >= N - 2 || y >= N - 2) b = 1;
      blocked[i] = b || 0;
      chasm[i] = !b && c ? 1 : 0;
      if (!b && !c && brushB[i] > 0.5) brush[i] = 1;
      surface[i] = blocked[i] ? 1 : chasm[i] ? 2 : bridge[i] ? 4 : ramp[i] ? 5 : brush[i] ? 3 : 0;
    }
  }
  // chasm cells are never "blocked" for the purpose of ground; treat as blocked for ground nav
  // height at corners
  const heightV = new Float32Array((N + 1) * (N + 1));
  for (let vy = 0; vy <= N; vy++) {
    for (let vx = 0; vx <= N; vx++) {
      let s = 0, n = 0;
      for (let dy = -1; dy <= 0; dy++) for (let dx = -1; dx <= 0; dx++) {
        const x = vx + dx, y = vy + dy;
        if (x < 0 || y < 0 || x >= N || y >= N) continue;
        s += hB[y * N + x]; n++;
      }
      heightV[vy * (N + 1) + vx] = n ? s / n : 0;
    }
  }

  // --- resource layout, authored for player 1 (top-right) and mirrored for player 0
  const sites: MapSite[] = [];
  const resources: ResSpawn[] = [];
  const addBase = (id: string, kind: MapSite['kind'], cx: number, cy: number, oreArc: [number, number, number], vents: Array<[number, number]>, start: -1 | 0 | 1, oreAmount: number, ventAmount: number) => {
    sites.push({ id, kind, x: cx, y: cy, start });
    for (const p of arcPositions(cx, cy, 7.6, oreArc[0], oreArc[1], oreArc[2])) {
      resources.push({ kind: 'ore', x: Math.round(p.x - 1) + 1, y: Math.round(p.y - 1) + 1, w: 2, h: 2, amount: oreAmount, site: id });
    }
    for (const [ang, rad] of vents) {
      const a = (ang * Math.PI) / 180;
      const vx = Math.round(cx + Math.cos(a) * rad - 1.5);
      const vy = Math.round(cy + Math.sin(a) * rad - 1.5);
      resources.push({ kind: 'vent', x: vx + 1.5, y: vy + 1.5, w: 3, h: 3, amount: ventAmount, site: id });
    }
  };
  const mirror = (s: MapSite, id: string, start: -1 | 0 | 1) => ({ ...s, id, x: ROT(s.x), y: ROT(s.y), start });
  // P1 (index 1) sites
  const p1: Array<[string, MapSite['kind'], number, number, [number, number, number], Array<[number, number]>, 0 | 1, number, number]> = [
    ['p1_main', 'main', 122, 18, [-190, 10, 7], [[-140, 12.5], [-40, 12.5]], 1, 1500, 2200],
    ['p1_nat', 'natural', 123, 60, [-110, 50, 6], [[-155, 11.5], [80, 11.5]], 1, 1500, 2200],
    ['p1_side', 'side', 73, 19, [-200, 10, 6], [[160, 12], [30, 12]], 1, 1200, 1800],
  ];
  const baseResStart = resources.length;
  for (const a of p1) addBase(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8]);
  const p1Res = resources.slice(baseResStart);
  const p1Sites = sites.slice();
  // mirror to player 0
  for (const s of p1Sites) sites.push(mirror(s, s.id.replace('p1', 'p0'), s.start === 1 ? 0 : -1));
  for (const r of p1Res) {
    resources.push({ ...r, x: ROT(r.x), y: ROT(r.y), site: r.site.replace('p1', 'p0') });
  }
  // depleted central field inside the basin
  const centre = MAP_SIZE / 2;
  const cen: ResSpawn[] = arcPositions(centre, centre, 6.2, -100, 80, 4).map((p) => ({ kind: 'ore' as const, x: Math.round(p.x - 1) + 1, y: Math.round(p.y - 1) + 1, w: 2, h: 2, amount: 260, site: 'centre' }));
  for (const r of cen) { resources.push(r); resources.push({ ...r, x: ROT(r.x), y: ROT(r.y) }); }

  const pylonsRaw = [{ x: 49.5, y: 49.5 }];
  const pylons: Array<{ x: number; y: number }> = [];
  for (const p of [{ x: 17.5, y: 52.5 }]) { pylons.push(p); pylons.push({ x: ROT(p.x), y: ROT(p.y) }); }
  void pylonsRaw;
  const pods: Array<{ x: number; y: number }> = [];
  for (const p of [{ x: 68.5, y: 34.5 }, { x: 48.5, y: 84.5 }]) { pods.push(p); pods.push({ x: ROT(p.x), y: ROT(p.y) }); }
  const barriers: Rect[] = [];
  for (const r of [{ x: 135, y: 75, w: 3, h: 3 }, { x: 135, y: 78, w: 3, h: 3 }]) { barriers.push(r); barriers.push(rotRect(r)); }

  const starts: GameMap['starts'] = [
    { x: 21.5, y: 125.5 },
    { x: 122.5, y: 18.5 },
  ];
  // make sure the start sites are actually authored as p0_main/p1_main
  return { size: N, blocked, chasm, brush, bridge, ramp, heightC: hB, heightV, starts, sites, resources, pylons, pods, barriers, surface };
}

export function heightAt(m: GameMap, x: number, y: number): number {
  const N = m.size;
  const fx = Math.min(Math.max(x, 0), N - 0.0001);
  const fy = Math.min(Math.max(y, 0), N - 0.0001);
  const ix = Math.floor(fx), iy = Math.floor(fy);
  const tx = fx - ix, ty = fy - iy;
  const W = N + 1;
  const h00 = m.heightV[iy * W + ix], h10 = m.heightV[iy * W + ix + 1];
  const h01 = m.heightV[(iy + 1) * W + ix], h11 = m.heightV[(iy + 1) * W + ix + 1];
  let h = h00 * (1 - tx) * (1 - ty) + h10 * tx * (1 - ty) + h01 * (1 - tx) * ty + h11 * tx * ty;
  if (m.bridge[iy * N + ix]) h = 0.25;
  return h;
}

export const cellOf = (m: GameMap, x: number, y: number) => Math.min(m.size - 1, Math.max(0, Math.floor(y))) * m.size + Math.min(m.size - 1, Math.max(0, Math.floor(x)));

export function walkableGround(m: GameMap, i: number): boolean {
  return !m.blocked[i] && !m.chasm[i];
}

/** Debug rendering of the map to text (used by tooling / tests). */
export function mapToAscii(m: GameMap, step = 2): string {
  const rows: string[] = [];
  for (let y = 0; y < m.size; y += step) {
    let s = '';
    for (let x = 0; x < m.size; x += step) {
      const v = m.surface[y * m.size + x];
      s += ' #:,=/'[v] === ' ' ? '.' : ' #:,=/'[v];
    }
    rows.push(s);
  }
  return rows.join('\n');
}
