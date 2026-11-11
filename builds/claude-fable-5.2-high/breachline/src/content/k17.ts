// content-data: Relay Station K-17 - original map, authored as data. ~116 x 96 m.
// Axes: +X east, +Z north, +Y up. Team 0 (Tidewatch) home is west, team 1 (Ferrous) home is east.
import { Decor, InterestNode, Lamp, MapDef, MatId, RampDir, Solid, SpawnPoint, Zone } from './mapTypes';

interface Opening { a: number; b: number; top: number; sill?: number; glass?: boolean }

function build(): MapDef {
  const solids: Solid[] = [];
  const decor: Decor[] = [];
  const lamps: Lamp[] = [];
  let glassCount = 0;

  const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, mat: MatId, extra: Partial<Solid> = {}) => {
    solids.push({ kind: 'box', min: [Math.min(x0, x1), Math.min(y0, y1), Math.min(z0, z1)], max: [Math.max(x0, x1), Math.max(y0, y1), Math.max(z0, z1)], mat, ...extra });
  };
  const ramp = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, dir: RampDir, mat: MatId) => {
    solids.push({ kind: 'ramp', min: [x0, y0, z0], max: [x1, y1, z1], mat, dir });
  };
  const cyl = (cx: number, cz: number, r: number, y0: number, y1: number, mat: MatId) => {
    solids.push({ kind: 'cyl', min: [cx - r, y0, cz - r], max: [cx + r, y1, cz + r], mat });
  };
  const dbox = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, mat: Extract<Decor, { k: 'box' }>['mat']) => {
    decor.push({ k: 'box', min: [Math.min(x0, x1), Math.min(y0, y1), Math.min(z0, z1)], max: [Math.max(x0, x1), Math.max(y0, y1), Math.max(z0, z1)], mat });
  };
  const dcyl = (a: [number, number, number], b: [number, number, number], r: number, mat: Extract<Decor, { k: 'cyl' }>['mat']) => {
    decor.push({ k: 'cyl', a, b, r, mat });
  };
  const sign = (x: number, y: number, z: number, w: number, h: number, face: RampDir, text: string, tone: 'cyan' | 'orange' | 'white', sub?: string) => {
    decor.push({ k: 'sign', pos: [x, y, z], w, h, face, text, sub, tone });
  };
  const lamp = (x: number, y: number, z: number, r = 9, color: [number, number, number] = [1, 0.93, 0.8], power = 1) => {
    lamps.push({ x, y, z, r, color, power });
    dbox(x - 0.5, y - 0.06, z - 0.12, x + 0.5, y, z + 0.12, 'lamp');
  };

  /** Wall running along X at depth z, with door/window openings given as x-intervals. */
  const wallX = (z: number, x0: number, x1: number, y0: number, y1: number, mat: MatId, openings: Opening[] = [], t = 0.4) => {
    const ops = openings.slice().sort((p, q) => p.a - q.a);
    let cur = x0;
    for (const o of ops) {
      if (o.a > cur) box(cur, y0, z - t / 2, o.a, y1, z + t / 2, mat);
      if (o.top < y1) box(o.a, o.top, z - t / 2, o.b, y1, z + t / 2, mat);
      if (o.sill !== undefined && o.sill > y0) box(o.a, y0, z - t / 2, o.b, o.sill, z + t / 2, mat);
      if (o.glass) box(o.a, o.sill ?? y0, z - 0.04, o.b, o.top, z + 0.04, 'glass', { glass: glassCount++ });
      cur = o.b;
    }
    if (cur < x1) box(cur, y0, z - t / 2, x1, y1, z + t / 2, mat);
  };
  const wallZ = (x: number, z0: number, z1: number, y0: number, y1: number, mat: MatId, openings: Opening[] = [], t = 0.4) => {
    const ops = openings.slice().sort((p, q) => p.a - q.a);
    let cur = z0;
    for (const o of ops) {
      if (o.a > cur) box(x - t / 2, y0, cur, x + t / 2, y1, o.a, mat);
      if (o.top < y1) box(x - t / 2, o.top, o.a, x + t / 2, y1, o.b, mat);
      if (o.sill !== undefined && o.sill > y0) box(x - t / 2, y0, o.a, x + t / 2, o.sill, o.b, mat);
      if (o.glass) box(x - 0.04, o.sill ?? y0, o.a, x + 0.04, o.top, o.b, 'glass', { glass: glassCount++ });
      cur = o.b;
    }
    if (cur < z1) box(x - t / 2, y0, cur, x + t / 2, y1, z1, mat);
  };
  /** Shipping container, long axis along X or Z. */
  const container = (x: number, z: number, alongX: boolean, mat: MatId, h = 2.6) => {
    if (alongX) box(x, 0, z, x + 6, h, z + 2.4, mat);
    else box(x, 0, z, x + 2.4, h, z + 6, mat);
  };

  // ------------------------------------------------------------------ ground + tunnel trench
  const X0 = -58, X1 = 58, Z0 = -48, Z1 = 48;
  box(X0, -4, 2, X1, 0, Z1, 'ground');
  box(X0, -4, Z0, X1, 0, -2, 'ground');
  box(X0, -4, -2, -17, 0, 2, 'ground');
  box(17, -4, -2, X1, 0, 2, 'ground');
  box(-17, -4, -2, 17, -3, 2, 'floor'); // tunnel floor
  ramp(-17, -3, -2, -8, 0, 2, 'x-', 'floor');
  ramp(8, -3, -2, 17, 0, 2, 'x+', 'floor');
  box(-8, -0.4, -2, 8, 0, 2, 'deck'); // tunnel roof = courtyard deck
  // trench railings (see-through, penetrable)
  for (const sx of [-1, 1]) {
    const a = sx < 0 ? -17 : 8, b = sx < 0 ? -8 : 17;
    box(a, 0, 2.0, b, 1.05, 2.08, 'rail');
    box(a, 0, -2.08, b, 1.05, -2.0, 'rail');
  }
  // tunnel cover + lamps
  box(-1.4, -3, -2, -0.2, -1.9, -0.9, 'wood');
  box(3.2, -3, 0.8, 4.4, -1.8, 2, 'wood');
  box(-5.4, -3, 0.9, -4.3, -1.9, 2, 'metal');
  for (const lx of [-6, 0, 6]) lamp(lx, -0.42, 0, 7, [1, 0.72, 0.42], 1.1);
  dcyl([-8, -0.75, 1.75], [8, -0.75, 1.75], 0.11, 'pipe');
  dcyl([-8, -1.05, 1.78], [8, -1.05, 1.78], 0.07, 'orange');
  dcyl([-8, -0.7, -1.8], [8, -0.7, -1.8], 0.09, 'metal');

  // ------------------------------------------------------------------ perimeter seawall + invisible boundary
  box(X0, 0, Z0, X0 + 1, 1.2, Z1, 'concrete');
  box(X1 - 1, 0, Z0, X1, 1.2, Z1, 'concrete');
  box(X0, 0, Z0, X1, 1.2, Z0 + 1, 'concrete');
  box(X0, 0, Z1 - 1, X1, 1.2, Z1, 'concrete');
  box(X0, 0, Z0, X0 + 1, 14, Z1, 'boundary', { hidden: true });
  box(X1 - 1, 0, Z0, X1, 14, Z1, 'boundary', { hidden: true });
  box(X0, 0, Z0, X1, 14, Z0 + 1, 'boundary', { hidden: true });
  box(X0, 0, Z1 - 1, X1, 14, Z1, 'boundary', { hidden: true });

  // ------------------------------------------------------------------ WEST OPERATIONS WING  x[-46,-20] z[-18,18]
  const OH = 3.8;
  const door = (a: number, b: number): Opening => ({ a, b, top: 2.7 });
  wallZ(-46, -18, 18, 0, OH, 'composite', [door(-11.2, -9), door(9, 11.2)]);
  wallZ(-20, -18, 18, 0, OH, 'composite', [door(-1.3, 1.3), { a: 6, b: 9.8, top: 2.6, sill: 1.0, glass: true }, { a: 10.2, b: 14, top: 2.6, sill: 1.0, glass: true }]);
  wallX(18, -46, -20, 0, OH, 'composite', [door(-28.2, -26)]);
  wallX(-18, -46, -20, 0, OH, 'composite', [door(-27.2, -25)]);
  // interior partitions
  wallX(2, -45.8, -20.2, 0, OH, 'interior', [door(-41.2, -39), { a: -32.5, b: -29, top: 2.6, sill: 1.0, glass: true }, { a: -28.5, b: -25, top: 2.6, sill: 1.0, glass: true }, door(-23.4, -21.2)], 0.3);
  wallX(-2, -45.8, -20.2, 0, OH, 'interior', [door(-37.2, -35), door(-27.2, -25)], 0.3);
  wallZ(-34, 2.15, 17.8, 0, OH, 'interior', [door(12, 14.2)], 0.3);
  wallZ(-32, -17.8, -2.15, 0, OH, 'interior', [door(-12.2, -10)], 0.3);
  box(-46.2, OH, -18.2, -19.8, OH + 0.4, 18.2, 'roof');
  // interior floor finish (visual)
  dbox(-45.8, 0, -17.8, -20.2, 0.02, 17.8, 'floor');
  dbox(-45.8, OH - 0.035, -17.8, -20.2, OH, 17.8, 'paintWhite'); // suspended ceiling
  // server room racks
  for (const rx of [-44.8, -42.4, -40, -37.6]) {
    box(rx, 0, 13, rx + 0.8, 2.2, 17, 'cyan');
    dbox(rx - 0.02, 0.3, 13.2, rx + 0.82, 0.38, 16.8, 'cyanGlow');
    dbox(rx - 0.02, 1.6, 13.2, rx + 0.82, 1.66, 16.8, 'cyanGlow');
  }
  box(-44.8, 0, 3.2, -44, 2.2, 7, 'cyan');
  dbox(-44.82, 1.6, 3.4, -43.98, 1.66, 6.8, 'cyanGlow');
  box(-37.2, 0, 4.2, -36.4, 2.2, 8, 'cyan');
  dbox(-37.22, 1.6, 4.4, -36.38, 1.66, 7.8, 'cyanGlow');
  // control room
  box(-29, 0, 9, -25, 1.05, 11, 'metal');
  dbox(-28.6, 1.05, 9.9, -25.4, 1.6, 10.0, 'screen');
  box(-33.6, 0, 16.6, -30.4, 0.95, 17.6, 'metal');
  dbox(-33.4, 0.95, 17.3, -30.6, 1.6, 17.36, 'screen');
  box(-27.4, 0, 5.6, -26.6, OH, 6.4, 'concrete');
  box(-22.2, 0, 15.6, -20.4, 1.1, 17.4, 'wood');
  // locker room
  box(-45.6, 0, -17.5, -45, 2.0, -12, 'metal');
  box(-42, 0, -14.3, -36, 2.0, -13.7, 'metal');
  box(-41, 0, -8.3, -37, 0.5, -7.7, 'wood');
  box(-45.4, 0, -5, -44.4, 1.1, -3, 'wood');
  // storage
  box(-30, 0, -16, -29.2, 2.2, -9.4, 'metal');
  box(-23.5, 0, -9, -21.5, 1.2, -7, 'wood');
  box(-23.2, 0, -15.5, -21.8, 1.0, -14, 'wood');
  box(-24.6, 0, -17.4, -23.4, 1.2, -16.2, 'wood');
  // lamps
  for (const [lx, lz] of [[-40, 10], [-40, 5.5], [-27, 6], [-27, 13.5], [-42, 0], [-33, 0], [-24, 0], [-39, -6], [-39, -14.5], [-26, -6], [-26, -14]] as const) lamp(lx, OH - 0.02, lz, 9);
  // roof clutter + signage
  dbox(-42, OH + 0.4, -12, -38, OH + 1.5, -9, 'metal');
  dbox(-30, OH + 0.4, 6, -27, OH + 1.3, 9, 'metal');
  dbox(-36, OH + 0.4, -3, -35.2, OH + 0.9, 3, 'orange');
  decor.push({ k: 'mast', pos: [-33, OH + 0.4, 12], h: 9 });
  sign(-19.78, 3.15, -8.5, 6.4, 0.95, 'x+', 'OPERATIONS', 'cyan', 'WEST WING');
  sign(-46.22, 3.1, 0, 5.2, 0.95, 'x-', 'OPS WING', 'cyan', 'K-17');
  sign(-19.78, 3.15, 3.6, 2.6, 0.5, 'x+', 'CONTROL', 'white');
  sign(-33.8, 2.95, 7, 2.4, 0.45, 'x+', 'RELAY CONTROL', 'white');
  sign(-34.2, 2.95, 8, 2.4, 0.45, 'x-', 'SERVER HALL', 'white');
  sign(-27, 3.1, 1.83, 3, 0.45, 'z-', 'CORRIDOR A', 'white');

  // ------------------------------------------------------------------ CENTRAL DISH COURTYARD  x[-20,22] z[-22,22]
  dbox(-19.8, 0, -21.8, 21.8, 0.02, 21.8, 'deck');
  box(-3, 0, -3, 3, 3.2, 3, 'concrete'); // dish pedestal
  decor.push({ k: 'dish', pos: [0, 3.2, 0] });
  dbox(-3.05, 2.5, -3.05, 3.05, 2.62, 3.05, 'cyanGlow');
  dbox(-3.06, 0, -3.06, 3.06, 0.5, 3.06, 'paint');
  sign(0, 1.75, -3.02, 3.4, 0.9, 'z-', 'K-17', 'cyan', 'PRIMARY RELAY');
  sign(0, 1.75, 3.02, 3.4, 0.9, 'z+', 'K-17', 'cyan', 'PRIMARY RELAY');
  // waist-high barriers
  const barrier = (x0: number, z0: number, x1: number, z1: number) => {
    box(x0, 0, z0, x1, 1.1, z1, 'concrete');
    dbox(x0 - 0.01, 0.78, z0 - 0.01, x1 + 0.01, 0.96, z1 + 0.01, 'paint');
  };
  barrier(-12, 7, -9, 7.6);
  barrier(-12.6, 9, -12, 12);
  barrier(9, -7.6, 12, -7);
  barrier(12, -12, 12.6, -9);
  barrier(-7, -9.6, -4, -9);
  barrier(4, 9, 7, 9.6);
  barrier(-17.5, -8, -16.9, -5);
  barrier(17, 5, 17.6, 8);
  // generators (safety-orange machinery)
  box(-13, 0, -13.5, -10, 2.1, -11.5, 'orange');
  dbox(-12.8, 2.1, -13.3, -12, 2.5, -12.5, 'dark');
  dbox(-13.04, 0.5, -13.2, -13, 1.6, -11.8, 'dark');
  box(10, 0, 11.5, 13, 2.1, 13.5, 'orange');
  dbox(12, 2.1, 12.5, 12.8, 2.5, 13.3, 'dark');
  dbox(13, 0.5, 11.8, 13.04, 1.6, 13.2, 'dark');
  // crates and spools
  box(-6, 0, 12, -4.5, 1.2, 13.5, 'wood');
  box(4.5, 0, -13.5, 6, 1.2, -12, 'wood');
  box(4.7, 1.2, -13.3, 5.8, 2.2, -12.2, 'wood');
  box(-15.5, 0, 14, -14, 1.2, 15.5, 'wood');
  box(14, 0, -15.5, 15.5, 1.2, -14, 'wood');
  box(1.5, 0, 15, 3, 1.0, 16.5, 'wood');
  box(-3, 0, -16.5, -1.5, 1.0, -15, 'wood');
  box(15.2, 0, 13.6, 16.8, 1.25, 15.2, 'wood');
  box(-16.8, 0, -15.2, -15.2, 1.25, -13.6, 'wood');
  // containers on the north and south edges
  container(-4, 18, true, 'containerA');
  container(-2, -20.4, true, 'containerB');
  // courtyard boundary walls with connector gaps
  wallX(22, -20, -14, 0, 3, 'compositeDark');
  wallX(22, 14, 22, 0, 3, 'compositeDark');
  wallX(-22, -20, -11, 0, 3, 'compositeDark');
  wallX(-22, -6, 7, 0, 3, 'compositeDark');
  wallX(-22, 12, 22, 0, 3, 'compositeDark');
  // painted guide lines + hazard edging
  dbox(-19.5, 0.02, 3.2, -17.2, 0.035, 3.4, 'paintWhite');
  dbox(-19.5, 0.02, -3.4, -17.2, 0.035, -3.2, 'paintWhite');
  dbox(17.2, 0.02, 3.2, 21.5, 0.035, 3.4, 'paintWhite');
  dbox(17.2, 0.02, -3.4, 21.5, 0.035, -3.2, 'paintWhite');
  dbox(-8, 0.02, 4.2, 8, 0.035, 4.4, 'paint');
  dbox(-8, 0.02, -4.4, 8, 0.035, -4.2, 'paint');
  dbox(-8, 0.02, -4.4, -7.8, 0.035, 4.4, 'paint');
  dbox(7.8, 0.02, -4.4, 8, 0.035, 4.4, 'paint');
  // light poles
  for (const [px, pz] of [[-16, 18], [16, 18], [-16, -18], [16, -18]] as const) {
    dcyl([px, 0, pz], [px, 6.5, pz], 0.09, 'dark');
    dbox(px - 0.5, 6.4, pz - 0.12, px + 0.5, 6.5, pz + 0.12, 'lamp');
  }

  // ------------------------------------------------------------------ EAST MAINTENANCE BAY  x[22,48] z[-18,18]
  const BH = 7.6;
  wallZ(22, -18, 18, 0, BH, 'composite', [{ a: -4, b: 4, top: 4.6 }, { a: 13.4, b: 17.2, top: 6.2, sill: 4.55 }]);
  wallZ(48, -18, 18, 0, BH, 'composite', [{ a: -14, b: -9, top: 4.2 }, door(9, 11.2)]);
  wallX(18, 22, 48, 0, BH, 'composite', [door(30, 32.2)]);
  wallX(-18, 22, 48, 0, BH, 'composite', [door(37, 39.2)]);
  box(21.8, BH, -18.2, 48.2, BH + 0.4, 18.2, 'roof');
  dbox(22.2, 0, -17.8, 47.8, 0.02, 17.8, 'floor');
  // catwalks (grate floors + penetrable sheet railings)
  box(22.2, 3.4, 14.2, 47.8, 3.6, 17.8, 'grate');
  box(44.2, 3.4, -6, 47.8, 3.6, 14.2, 'grate');
  box(22.2, 3.4, 11.8, 26, 3.6, 14.2, 'grate'); // landing 1
  box(41.6, 3.4, -6, 44.2, 3.6, -3, 'grate'); // landing 2
  ramp(26, 0, 11.8, 33, 3.6, 14.2, 'x-', 'metal');
  ramp(41.6, 0, -13, 44.2, 3.6, -6, 'z+', 'metal');
  box(26, 3.6, 14.2, 44.2, 4.7, 14.28, 'thinMetal');
  box(22.2, 3.6, 11.72, 26, 4.7, 11.8, 'thinMetal');
  box(44.2, 3.6, -3, 44.28, 4.7, 14.2, 'thinMetal');
  box(44.2, 3.6, -6.08, 47.8, 4.7, -6, 'thinMetal');
  box(41.52, 3.6, -6, 41.6, 4.7, -3, 'thinMetal');
  box(41.6, 3.6, -3.08, 44.2, 4.7, -3, 'thinMetal');
  // catwalk support columns (visual)
  for (const cx of [28, 34, 40]) dcyl([cx, 0, 14.4], [cx, 3.4, 14.4], 0.1, 'dark');
  for (const cz of [-4, 2, 8]) dcyl([44.4, 0, cz], [44.4, 3.4, cz], 0.1, 'dark');
  // utility trucks
  const truck = (x: number, z: number, alongX: boolean, flip: boolean) => {
    const L = 5.6, Wd = 2.2;
    if (alongX) {
      const cab0 = flip ? x + L - 2 : x, bed0 = flip ? x : x + 2;
      box(cab0, 0.35, z, cab0 + 2, 2.3, z + Wd, 'vehicle');
      box(bed0, 0.35, z, bed0 + L - 2, 1.45, z + Wd, 'orange');
      box(x, 0, z + 0.25, x + L, 0.35, z + Wd - 0.25, 'metal', { hidden: true });
      for (const wx of [x + 0.9, x + L - 1.0]) for (const wz of [z - 0.02, z + Wd - 0.28]) dcyl([wx, 0.42, wz], [wx, 0.42, wz + 0.3], 0.42, 'dark');
      dbox(cab0 + (flip ? 1.96 : -0.01), 1.35, z + 0.2, cab0 + (flip ? 2.01 : 0.04), 2.05, z + Wd - 0.2, 'dark');
    } else {
      const cab0 = flip ? z + L - 2 : z, bed0 = flip ? z : z + 2;
      box(x, 0.35, cab0, x + Wd, 2.3, cab0 + 2, 'vehicle');
      box(x, 0.35, bed0, x + Wd, 1.45, bed0 + L - 2, 'orange');
      box(x + 0.25, 0, z, x + Wd - 0.25, 0.35, z + L, 'metal', { hidden: true });
      for (const wz of [z + 0.9, z + L - 1.0]) for (const wx of [x - 0.02, x + Wd - 0.28]) dcyl([wx, 0.42, wz], [wx + 0.3, 0.42, wz], 0.42, 'dark');
      dbox(x + 0.2, 1.35, cab0 + (flip ? 1.96 : -0.01), x + Wd - 0.2, 2.05, cab0 + (flip ? 2.01 : 0.04), 'dark');
    }
  };
  truck(27, -10, true, false);
  truck(34, 2.4, false, true);
  box(23, 0, -17, 24, 1.0, -12, 'metal');
  box(36, 0, 16.6, 40, 1.9, 17.6, 'orange');
  box(37, 0, -5, 39, 1.2, -3, 'wood');
  box(30, 0, 5.5, 31.5, 1.2, 7, 'wood');
  box(24, 0, 5, 25.4, 1.2, 6.4, 'wood');
  box(45.2, 0, 3, 46.8, 1.3, 6, 'metal');
  box(31, 0, -16.8, 34, 1.1, -15.6, 'metal');
  for (const [lx, lz] of [[28, -9], [28, 6], [38, -9], [38, 6], [35, 16], [46, 4]] as const) lamp(lx, lz === 16 || lx === 46 ? 7.55 : 7.55, lz, 16, [1, 0.95, 0.86], 1.5);
  sign(21.78, 5.6, -9, 7.5, 1.1, 'x-', 'MAINTENANCE', 'orange', 'BAY 2');
  sign(48.22, 5.4, 0, 6.4, 1.0, 'x+', 'BAY 2', 'orange', 'VEHICLE SERVICE');
  sign(35, 6.4, 17.78, 6, 0.9, 'z-', 'KEEP CATWALK CLEAR', 'orange');
  dbox(22.21, 0, -4, 22.3, 4.6, -3.8, 'paint');
  dbox(22.21, 0, 3.8, 22.3, 4.6, 4, 'paint');
  dbox(34, BH + 0.4, -6, 38, BH + 1.6, -2, 'metal');
  decor.push({ k: 'mast', pos: [42, BH + 0.4, 10], h: 7 });

  // ------------------------------------------------------------------ NORTH RIDGE  z[30,47], top y=2
  box(-40, 0, 30, 40, 2, 47, 'rock');
  ramp(-48, 0, 32, -40, 2, 45, 'x+', 'rock');
  ramp(40, 0, 32, 48, 2, 45, 'x-', 'rock');
  ramp(-12, 0, 24, -8, 2, 30, 'z+', 'concrete');
  ramp(8, 0, 24, 12, 2, 30, 'z+', 'concrete');
  // relay hut in the middle of the lane (doors offset so there is no straight shot through)
  wallZ(-4, 36, 43, 2, 5, 'composite', [{ a: 37, b: 39.2, top: 4.6 }], 0.3);
  wallZ(4, 36, 43, 2, 5, 'composite', [{ a: 40, b: 42.2, top: 4.6 }], 0.3);
  wallX(36, -4, 4, 2, 5, 'composite', [{ a: -1.6, b: 1.6, top: 4.2, sill: 3.1, glass: true }], 0.3);
  wallX(43, -4, 4, 2, 5, 'composite', [], 0.3);
  box(-4.3, 5, 35.7, 4.3, 5.3, 43.3, 'roof');
  box(-1, 2, 39, 1, 3.05, 40.2, 'cyan');
  dbox(-1.02, 2.7, 39.1, 1.02, 2.76, 40.1, 'cyanGlow');
  lamp(0, 4.98, 39.5, 7, [0.8, 0.95, 1], 1);
  decor.push({ k: 'mast', pos: [0, 5.3, 41.5], h: 11 });
  sign(0, 4.55, 35.83, 3.6, 0.5, 'z-', 'RIDGE RELAY', 'cyan');
  // rocks, mast bases and low walls interrupting the marksman lane
  box(-22, 2, 31, -19, 4.3, 34, 'rock');
  box(18, 2, 33, 21, 4.2, 36, 'rock');
  box(-36, 2, 41, -33, 4.6, 45, 'rock');
  box(33, 2, 31, 36, 4.5, 35, 'rock');
  box(-30, 2, 38, -28, 3.2, 40, 'concrete');
  decor.push({ k: 'mast', pos: [-29, 3.2, 39], h: 12 });
  box(28, 2, 40, 30, 3.2, 42, 'concrete');
  decor.push({ k: 'mast', pos: [29, 3.2, 41], h: 12 });
  box(-14, 2, 38, -10, 3.1, 38.5, 'concrete');
  box(10, 2, 35, 14, 3.1, 35.5, 'concrete');
  box(-26, 2, 43.5, -24.5, 3.2, 45, 'wood');
  box(23, 2, 44, 24.5, 3.2, 45.5, 'wood');
  box(-16, 2, 31, -14.6, 3.1, 32.4, 'wood');
  box(14.5, 2, 41, 16, 3.2, 42.5, 'wood');
  // climb crates at the ridge face (mantle route) and connector-strip containers
  box(19.5, 0, 28.5, 21, 1.0, 30, 'wood');
  box(-21, 0, 28.5, -19.5, 1.0, 30, 'wood');
  container(-34, 24, true, 'containerC');
  container(26, 25, true, 'containerA');
  box(-2, 0, 25, 0.4, 1.2, 27, 'wood');
  sign(-10, 1.3, 23.76, 2.6, 0.5, 'z-', 'RIDGE ACCESS', 'white');
  sign(10, 1.3, 23.76, 2.6, 0.5, 'z-', 'RIDGE ACCESS', 'white');

  // ------------------------------------------------------------------ SOUTH UTILITY ROUTE  z[-47,-22]
  cyl(-27, -37, 3.2, 0, 5.2, 'pipe');
  cyl(27, -33, 3.2, 0, 5.2, 'pipe');
  cyl(-44, -40, 2.2, 0, 4, 'orange');
  cyl(44, -30, 2.2, 0, 4, 'orange');
  // pipe gallery (covered, low visibility)
  box(-20, 3.0, -36.3, 20, 3.2, -29.7, 'thinMetal');
  wallX(-30, -20, 20, 0, 3, 'compositeDark', [{ a: -13, b: -8, top: 3 }, { a: 8, b: 13, top: 3 }], 0.3);
  wallX(-36, -20, 20, 0, 3, 'compositeDark', [{ a: -20, b: -16, top: 3 }, { a: -4, b: 4, top: 3 }, { a: 16, b: 20, top: 3 }], 0.3);
  box(-2, 0, -34, 2, 1.4, -32, 'orange');
  dbox(-1.6, 1.4, -33.6, -0.8, 2.0, -32.8, 'dark');
  box(-15, 0, -31.4, -13.6, 1.2, -30.2, 'wood');
  box(13.8, 0, -35.8, 15.2, 1.2, -34.4, 'wood');
  for (const lx of [-14, -5, 5, 14]) lamp(lx, 2.98, -33, 7, [1, 0.7, 0.4], 1);
  dcyl([-20, 2.55, -30.6], [20, 2.55, -30.6], 0.16, 'pipe');
  dcyl([-20, 2.2, -30.55], [20, 2.2, -30.55], 0.1, 'orange');
  dcyl([-20, 2.6, -35.4], [20, 2.6, -35.4], 0.18, 'metal');
  dcyl([-20, 0.35, -35.5], [-4.3, 0.35, -35.5], 0.12, 'pipe');
  // low pipe runs outside (crouch cover) + overhead racks
  box(-18, 0, -26.4, -6, 0.95, -25.6, 'pipe');
  box(6, 0, -27, 18, 0.95, -26.2, 'pipe');
  box(-36, 0, -44, -24, 0.95, -43.2, 'pipe');
  box(18, 0, -41.5, 24, 0.95, -40.7, 'pipe');
  for (const px of [-36, -24, -12, 12, 24, 36]) {
    dcyl([px, 0, -24], [px, 3.4, -24], 0.1, 'dark');
    dcyl([px, 0, -28.4], [px, 3.4, -28.4], 0.1, 'dark');
    dcyl([px, 3.4, -24], [px, 3.4, -28.4], 0.08, 'dark');
  }
  dcyl([-40, 3.55, -25], [40, 3.55, -25], 0.2, 'pipe');
  dcyl([-40, 3.55, -26], [40, 3.55, -26], 0.14, 'orange');
  dcyl([-40, 3.6, -27.3], [40, 3.6, -27.3], 0.24, 'metal');
  dcyl([-27, 5.0, -37], [-27, 5.0, -29], 0.16, 'pipe');
  dcyl([27, 5.0, -33], [27, 5.0, -27.3], 0.16, 'pipe');
  container(-40, -30, true, 'containerB');
  container(34, -44, true, 'containerC');
  container(-12, -45, true, 'containerA');
  container(6, -42.6, true, 'containerB');
  box(-8, 0, -41, -6.5, 1.2, -39.5, 'wood');
  box(30.5, 0, -40.5, 32, 1.2, -39, 'wood');
  box(-33, 0, -24.6, -31.5, 1.2, -23.1, 'wood');
  box(36, 0, -37, 39, 2.0, -35, 'orange');
  box(-20, 0, -46, -17, 2.0, -44, 'orange');
  sign(0, 2.45, -29.83, 4.4, 0.5, 'z+', 'PIPE GALLERY', 'orange', 'UTILITY ROUTE');
  sign(-8.5, 2.4, -21.78, 2.6, 0.5, 'z+', 'UTILITY', 'white');
  sign(9.5, 2.4, -21.78, 2.6, 0.5, 'z+', 'UTILITY', 'white');

  // ------------------------------------------------------------------ SPAWN YARDS
  container(-54, -4, false, 'containerA');
  container(-52, 14, false, 'containerC');
  container(-53, -22, false, 'containerB');
  container(-50, 26, true, 'containerB');
  box(-49.5, 0, -1.2, -48, 1.2, 0.3, 'wood');
  box(-50.5, 0, -30, -48, 2.0, -28, 'orange');
  container(51.6, -2, false, 'containerB');
  container(49.6, -22, false, 'containerA');
  container(50.6, 16, false, 'containerC');
  container(44, -26.4, true, 'containerC');
  box(49.5, 0, 6, 51, 1.2, 7.5, 'wood');
  box(49, 0, 26, 51.5, 2.0, 28, 'orange');
  sign(-56.97, 0.72, 0, 5, 0.6, 'x+', 'TIDEWATCH STAGING', 'cyan');
  sign(56.97, 0.72, 0, 5, 0.6, 'x-', 'FERROUS STAGING', 'orange');

  // ------------------------------------------------------------------ spawns
  const spawns: SpawnPoint[] = [];
  const E = Math.PI / 2, Wy = -Math.PI / 2;
  const addGroup = (group: number, home: 0 | 1, yaw: number, pts: [number, number][]) => {
    for (const [x, z] of pts) spawns.push({ x, y: 0, z, yaw, group, home });
  };
  addGroup(0, 0, E, [[-55.8, -7], [-55.8, -4.5], [-55.8, 0], [-55.8, 3], [-55.8, 6], [-50.6, 7.5]]);
  addGroup(1, 0, E, [[-54.5, 31], [-54.5, 34.5], [-54.5, 38], [-51.5, 42], [-55.5, 44.5], [-50.5, 36]]);
  addGroup(2, 0, E, [[-54.5, -33], [-54.5, -36], [-54.5, -39], [-51.5, -42.5], [-55.5, -45], [-50.5, -36]]);
  addGroup(3, 1, Wy, [[55.8, 7], [55.8, 5], [55.8, -4], [55.8, -7], [55.8, 10], [49.6, -5]]);
  addGroup(4, 1, Wy, [[54.5, 31], [54.5, 34.5], [54.5, 38], [51.5, 42], [55.5, 44.5], [50.5, 36]]);
  addGroup(5, 1, Wy, [[54.5, -32], [54.5, -35], [54.5, -38], [51.5, -42.5], [55.5, -45.5], [50.5, -36]]);

  // ------------------------------------------------------------------ bot interest / cover nodes
  const interest: InterestNode[] = [];
  const node = (name: string, x: number, y: number, z: number, hold = false, yawDeg = 0) => interest.push({ name, x, y, z, hold, yaw: (yawDeg * Math.PI) / 180 });
  node('Courtyard NW', -10, 0, 10);
  node('Courtyard SE', 10, 0, -10);
  node('Courtyard N', 2, 0, 14, true, 180);
  node('Courtyard S', -2, 0, -14, true, 0);
  node('Courtyard W', -15, 0, 5, true, 90);
  node('Courtyard E', 15, 0, -5, true, -90);
  node('Tunnel', 0, -3, 0.2);
  node('Ops Corridor', -30, 0, 0);
  node('Control Room', -30, 0, 7, true, 90);
  node('Server Hall', -41, 0, 10);
  node('Storage', -26, 0, -11);
  node('Bay Floor', 33, 0, -1);
  node('Bay Catwalk', 34, 3.6, 16, true, -90);
  node('Catwalk Window', 23.6, 3.6, 15.6, true, -90);
  node('Bay East', 45.5, 0, -11);
  node('Ridge Mid', 0, 2, 33);
  node('Ridge West', -25, 2, 37, true, 90);
  node('Ridge East', 25, 2, 38, true, -90);
  node('Ridge Hut', -2.5, 2, 40.5);
  node('North Strip W', -20, 0, 26);
  node('North Strip E', 18, 0, 26);
  node('Pipe Gallery', 0, 0, -31);
  node('Utility West', -20, 0, -40);
  node('Utility East', 20, 0, -44);
  node('Utility Mid', 0, 0, -25);

  // ------------------------------------------------------------------ zones
  const districts = ['Operations Wing', 'Dish Courtyard', 'Maintenance Bay', 'North Ridge', 'Utility Route'];
  const zones: Zone[] = [
    { name: 'Operations Wing', district: 0, minX: -46, maxX: -20, minZ: -18, maxZ: 18, minY: -1, maxY: 3.9, indoor: true },
    { name: 'Dish Courtyard', district: 1, minX: -20, maxX: 22, minZ: -22, maxZ: 22, minY: -0.5, maxY: 30, indoor: false },
    { name: 'Service Tunnel', district: 1, minX: -17, maxX: 17, minZ: -2, maxZ: 2, minY: -4, maxY: -0.45, indoor: true },
    { name: 'Maintenance Bay', district: 2, minX: 22, maxX: 48, minZ: -18, maxZ: 18, minY: -1, maxY: 7.7, indoor: true },
    { name: 'North Ridge', district: 3, minX: -58, maxX: 58, minZ: 22, maxZ: 48, minY: -1, maxY: 30, indoor: false },
    { name: 'Ridge Relay Hut', district: 3, minX: -4, maxX: 4, minZ: 36, maxZ: 43, minY: 1.9, maxY: 5.1, indoor: true },
    { name: 'Utility Route', district: 4, minX: -58, maxX: 58, minZ: -48, maxZ: -22, minY: -1, maxY: 30, indoor: false },
    { name: 'Pipe Gallery', district: 4, minX: -20, maxX: 20, minZ: -36, maxZ: -30, minY: -1, maxY: 3.1, indoor: true },
    { name: 'West Yard', district: -1, minX: -58, maxX: -46, minZ: -22, maxZ: 22, minY: -1, maxY: 30, indoor: false },
    { name: 'East Yard', district: -1, minX: 48, maxX: 58, minZ: -22, maxZ: 22, minY: -1, maxY: 30, indoor: false },
  ];

  return {
    id: 'k17',
    name: 'Relay Station K-17',
    bounds: { minX: X0, maxX: X1, minZ: Z0, maxZ: Z1 },
    waterY: -2.6,
    solids,
    decor,
    spawns,
    interest,
    zones,
    lamps,
    glassCount,
    districts,
  };
}

export const K17: MapDef = build();
