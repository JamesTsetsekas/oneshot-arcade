// Automated map analysis: reachability, spawn sightlines, route timings, hint validity, bomb-zone bounds,
// stuck points and grenade clipping. Used by `npm run scan` and by the test-suite.

import { MOVEMENT as M } from '../content/economy';
import { bodyBlocked, lineOfSight } from './collision';
import { predictThrow, throwVelocity } from './grenades';
import { DEFAULT_ENTRY, HINTS, MID_HOLD, P2, SAVE_SPOTS } from './hints';
import { BOXES, MAP_HEIGHT, MAP_WIDTH, MATERIALS, SITES, SPAWNS, Zone } from './map';
import { Vec3 } from './math';
import { NAV_H, NAV_W, cellOf, findPath, floorAt, isWalkableAt, pathLength, walkable, walkableCount } from './nav';

export interface ScanReport {
  issues: string[];
  routes: Record<string, { meters: number; seconds: number }>;
  stats: Record<string, number | string>;
}

const RIFLE = 4.7;

function p3(p: P2): Vec3 { return { x: p.x, y: floorAt(p.x, p.z), z: p.z }; }

function allHintPoints(): Array<{ name: string; p: P2 }> {
  const out: Array<{ name: string; p: P2 }> = [];
  for (const s of ['A', 'B'] as const) {
    const h = HINTS[s];
    h.lanes.forEach((l, i) => {
      l.stage.forEach((p, j) => out.push({ name: `${s}.lane${i}.stage${j}`, p }));
      out.push({ name: `${s}.lane${i}.entry`, p: l.entry });
      l.push.forEach((p, j) => out.push({ name: `${s}.lane${i}.push${j}`, p }));
    });
    h.plant.forEach((p, i) => out.push({ name: `${s}.plant${i}`, p }));
    h.postPlant.forEach((p, i) => out.push({ name: `${s}.post${i}`, p }));
    h.clear.forEach((p, i) => out.push({ name: `${s}.clear${i}`, p }));
    h.smoke.forEach((p, i) => out.push({ name: `${s}.smoke${i}`, p }));
    h.flash.forEach((p, i) => out.push({ name: `${s}.flash${i}`, p }));
    h.hold.forEach((p, i) => out.push({ name: `${s}.hold${i}`, p }));
    h.retake.forEach((r, i) => { out.push({ name: `${s}.retake${i}.stage`, p: r.stage }); out.push({ name: `${s}.retake${i}.entry`, p: r.entry }); });
  }
  out.push({ name: 'mid.hold', p: MID_HOLD });
  out.push({ name: 'A.defaultEntry', p: DEFAULT_ENTRY.A });
  out.push({ name: 'B.defaultEntry', p: DEFAULT_ENTRY.B });
  for (const side of ['cus', 'int'] as const) SAVE_SPOTS[side].forEach((p, i) => out.push({ name: `save.${side}${i}`, p }));
  return out;
}

export function scanMap(): ScanReport {
  const issues: string[] = [];
  const routes: ScanReport['routes'] = {};
  const stats: ScanReport['stats'] = {};

  // --- geometry sanity (collision == render source of truth)
  for (const b of BOXES) {
    if (!(b.x1 > b.x0 && b.y1 > b.y0 && b.z1 > b.z0)) issues.push(`degenerate box ${b.id}`);
    if (!MATERIALS[b.mat]) issues.push(`box ${b.id} has unknown material ${b.mat}`);
    if (b.x0 < -0.01 || b.z0 < -0.01 || b.x1 > MAP_WIDTH + 0.01 || b.z1 > MAP_HEIGHT + 0.01) issues.push(`box ${b.id} outside the map`);
  }
  stats.boxes = BOXES.length;
  stats.walkableCells = walkableCount();

  // --- spawns
  for (const side of ['cus', 'int'] as const) {
    SPAWNS[side].forEach((s, i) => {
      if (bodyBlocked(s.x, 0, s.z, M.halfWidth, M.standHeight)) issues.push(`${side} spawn ${i} is inside geometry`);
      if (!isWalkableAt(s.x, s.z)) issues.push(`${side} spawn ${i} is not on the nav grid`);
    });
  }
  // spawn sightlines: no enemy spawn may see another spawn
  for (const a of SPAWNS.int) {
    for (const b of SPAWNS.cus) {
      if (lineOfSight({ x: a.x, y: M.standEye, z: a.z }, { x: b.x, y: M.standEye, z: b.z })) issues.push(`spawn sightline between int (${a.x},${a.z}) and cus (${b.x},${b.z})`);
    }
  }

  // --- reachability of every hint point from both spawns
  const spawnI = SPAWNS.int[2], spawnC = SPAWNS.cus[2];
  for (const { name, p } of allHintPoints()) {
    if (!isWalkableAt(p.x, p.z)) { issues.push(`hint ${name} (${p.x},${p.z}) is not walkable`); continue; }
    const fromI = findPath(p3(spawnI), p3(p));
    const fromC = findPath(p3(spawnC), p3(p));
    if (!fromI) issues.push(`hint ${name} unreachable from intrusion spawn`);
    if (!fromC) issues.push(`hint ${name} unreachable from custodian spawn`);
  }

  // --- bomb zones
  for (const s of ['A', 'B'] as const) {
    const z: Zone = SITES[s];
    let walk = 0, total = 0;
    for (let x = z.x0 + 0.5; x < z.x1; x += 1) for (let zz = z.z0 + 0.5; zz < z.z1; zz += 1) { total++; if (isWalkableAt(x, zz)) walk++; }
    stats[`site${s}Walkable`] = `${walk}/${total}`;
    if (walk / total < 0.55) issues.push(`site ${s} has too little walkable area (${walk}/${total})`);
    for (const p of HINTS[s].plant) {
      if (!(p.x >= z.x0 && p.x <= z.x1 && p.z >= z.z0 && p.z <= z.z1)) issues.push(`plant spot (${p.x},${p.z}) outside site ${s}`);
    }
    // entry vectors: count distinct approach lanes in hints
    stats[`site${s}Lanes`] = HINTS[s].lanes.length;
  }

  // --- route timings
  const timing = (name: string, a: P2, b: P2) => {
    const path = findPath(p3(a), p3(b));
    if (!path) { issues.push(`no route for ${name}`); return; }
    const m = pathLength(path, p3(a));
    routes[name] = { meters: +m.toFixed(1), seconds: +(m / RIFLE).toFixed(1) };
  };
  timing('int -> A plant', spawnI, HINTS.A.plant[0]);
  timing('int -> B plant', spawnI, HINTS.B.plant[0]);
  timing('int -> A contact (lane entry)', spawnI, HINTS.A.lanes[0].entry);
  timing('int -> B contact (lane entry)', spawnI, HINTS.B.lanes[0].entry);
  timing('cus -> A hold', spawnC, HINTS.A.hold[0]);
  timing('cus -> B hold', spawnC, HINTS.B.hold[0]);
  timing('A -> B rotation', HINTS.A.hold[0], HINTS.B.hold[0]);
  timing('mid hold -> A', MID_HOLD, HINTS.A.hold[0]);
  timing('mid hold -> B', MID_HOLD, HINTS.B.hold[0]);


  // --- stuck points: walkable cells not reachable from the intrusion spawn
  const reach = new Uint8Array(NAV_W * NAV_H);
  const [sc, sr] = cellOf(spawnI.x, spawnI.z);
  const stack: Array<[number, number]> = [[sc, sr]];
  reach[sr * NAV_W + sc] = 1;
  while (stack.length) {
    const [c, r] = stack.pop()!;
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = c + dc, nr = r + dr;
      if (nc < 0 || nr < 0 || nc >= NAV_W || nr >= NAV_H) continue;
      const i = nr * NAV_W + nc;
      if (reach[i] || !walkable[i]) continue;
      // use the real edge test via straight path check between centres
      const a = { x: (c + 0.5), y: floorAt(c + 0.5, r + 0.5), z: r + 0.5 };
      const b = { x: nc + 0.5, y: floorAt(nc + 0.5, nr + 0.5), z: nr + 0.5 };
      if (Math.abs(b.y - a.y) > M.stepHeight + 0.03) continue;
      reach[i] = 1;
      stack.push([nc, nr]);
    }
  }
  let unreachable = 0;
  const unreachableList: string[] = [];
  for (let i = 0; i < walkable.length; i++) if (walkable[i] && !reach[i]) { unreachable++; unreachableList.push('(' + (i % NAV_W) + ',' + Math.floor(i / NAV_W) + ')'); }
  stats.unreachableWalkableCells = unreachable;
  if (unreachableList.length) stats.unreachableSample = unreachableList.slice(0, 10).join(' ');
  if (unreachable > 40) issues.push(`${unreachable} walkable cells are unreachable (stuck pockets)`);

  // --- grenade clipping: throw from every spawn in many directions; ends must lie inside the map and outside geometry
  let clipped = 0, thrown = 0;
  for (const side of ['cus', 'int'] as const) {
    for (const s of SPAWNS[side]) {
      for (let yawDeg = 0; yawDeg < 360; yawDeg += 15) {
        for (const pitchDeg of [-10, 15, 40, 70]) {
          for (const speed of [9, 20]) {
            const yaw = (yawDeg * Math.PI) / 180, pitch = (pitchDeg * Math.PI) / 180;
            const start = { x: s.x, y: 1.5, z: s.z };
            const vel = throwVelocity({ yaw, pitch, vel: { x: 0, y: 0, z: 0 } }, speed);
            const r = predictThrow(start, vel, 64 * 6);
            thrown++;
            const e = r.end;
            if (e.x < 0 || e.z < 0 || e.x > MAP_WIDTH || e.z > MAP_HEIGHT || e.y < 0 || e.y > 7.01) clipped++;
            else if (bodyBlockedSphere(e)) clipped++;
          }
        }
      }
    }
  }
  stats.grenadeThrows = thrown;
  stats.grenadeClips = clipped;
  if (clipped > 0) issues.push(`${clipped}/${thrown} simulated grenade throws ended outside the map or inside geometry`);

  return { issues, routes, stats };
}

function bodyBlockedSphere(p: Vec3): boolean {
  // A resting grenade must not be inside a box (sphere radius 0.11).
  return bodyBlocked(p.x, p.y - 0.09, p.z, 0.02, 0.18);
}
