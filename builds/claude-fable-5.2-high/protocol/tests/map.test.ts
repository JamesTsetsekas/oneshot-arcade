// Automated map analysis for Aperture Annex: spawn sightlines, route timings, entry vectors,
// authored-point validity, stuck points, vault bounds and grenade containment.
import { describe, expect, it } from 'vitest';
import { DT, PLAYER } from '../src/content/rules';
import { buildAnnex, getAnnex } from '../src/map/annex';
import { calloutAt, inRect } from '../src/map/build';
import { getNav } from '../src/map/nav';
import { F_OPAQUE, F_SOLID } from '../src/map/world';
import { simulateThrow } from '../src/sim/grenades';

const map = getAnnex();
const nav = getNav(map);
const RUN = 4.9; // typical rifle/SMG carry speed in m/s
const centre = (pts: { x: number; z: number }[]): { x: number; z: number } => ({ x: pts.reduce((s, p) => s + p.x, 0) / pts.length, z: pts.reduce((s, p) => s + p.z, 0) / pts.length });
const atkSpawn = centre(map.spawns.atk);
const defSpawn = centre(map.spawns.def);
const walk = (a: { x: number; z: number; y?: number }, b: { x: number; z: number; y?: number }): number => nav.distance(a.x, a.y ?? 0, a.z, b.x, b.y ?? 0, b.z);

describe('Aperture Annex collision', () => {
  it('has a stable, reproducible collision fingerprint', () => {
    expect(map.collisionHash).toMatch(/^[0-9a-f]{8}$/);
    expect(buildAnnex().collisionHash).toBe(map.collisionHash);
    expect(map.world.boxes.length).toBeGreaterThan(150);
  });

  it('raycasts agree with box overlap tests (no leaks through the bucket grid)', () => {
    const hit = { t: 0, tExit: 0, box: null, nx: 0, ny: 0, nz: 0 };
    let checked = 0;
    for (let i = 0; i < 400; i++) {
      const n = nav.nodes[(i * 37) % nav.nodes.length];
      if (!n.reachable) continue;
      const a = (i * 0.61803) % (Math.PI * 2);
      const dx = Math.sin(a);
      const dz = Math.cos(a);
      if (!map.world.raycast(n.x, n.y + 1, n.z, dx, 0, dz, 120, F_SOLID, false, hit)) throw new Error('ray escaped the map');
      // just short of the hit point is free space, just past it is solid
      const before = hit.t - 0.02;
      const after = hit.t + 0.02;
      expect(map.world.overlaps(n.x + dx * before - 0.001, n.y + 0.999, n.z + dz * before - 0.001, n.x + dx * before + 0.001, n.y + 1.001, n.z + dz * before + 0.001, F_SOLID, false)).toBe(false);
      // (a ray that only clips a corner leaves the box again almost immediately)
      if (hit.tExit - hit.t > 0.05) expect(map.world.overlaps(n.x + dx * after - 0.001, n.y + 0.999, n.z + dz * after - 0.001, n.x + dx * after + 0.001, n.y + 1.001, n.z + dz * after + 0.001, F_SOLID, false)).toBe(true);
      checked++;
    }
    expect(checked).toBeGreaterThan(300);
  });
});

describe('spawns', () => {
  it('provides five clear spawn points per side inside the buy zones', () => {
    for (const side of ['atk', 'def'] as const) {
      expect(map.spawns[side].length).toBe(5);
      for (const s of map.spawns[side]) {
        expect(inRect(map.buyZones[side], s.x, s.z)).toBe(true);
        expect(map.world.overlaps(s.x - PLAYER.halfWidth, 0.02, s.z - PLAYER.halfWidth, s.x + PLAYER.halfWidth, PLAYER.standHeight, s.z + PLAYER.halfWidth, F_SOLID, true)).toBe(false);
      }
    }
  });

  it('has no line of sight between the two spawn areas', () => {
    const a = map.buyZones.atk;
    const d = map.buyZones.def;
    let pairs = 0;
    for (let ax = a.x0 + 1; ax < a.x1; ax += 3)
      for (let az = a.z0 + 1; az < a.z1; az += 3)
        for (let dx = d.x0 + 1; dx < d.x1; dx += 3)
          for (let dz = d.z0 + 1; dz < d.z1; dz += 3) {
            pairs++;
            expect(map.world.segmentClear(ax, 1.6, az, dx, 1.6, dz, F_OPAQUE)).toBe(false);
          }
    expect(pairs).toBeGreaterThan(500);
  });

  it('keeps attacker staging areas out of sight of the defender spawn', () => {
    const d = map.buyZones.def;
    for (const site of [map.sites.A, map.sites.B])
      for (const e of site.entries)
        for (let dx = d.x0 + 1; dx < d.x1; dx += 2)
          for (let dz = d.z0 + 1; dz < d.z1; dz += 2) expect(map.world.segmentClear(e.stage.x, 1.6, e.stage.z, dx, 1.6, dz, F_OPAQUE)).toBe(false);
  });

  it('seals both spawns with barriers during the buy phase', () => {
    for (const side of ['atk', 'def'] as const) {
      const s = map.spawns[side][0];
      const start = nav.nearest(s.x, 0, s.z)!;
      // flood fill across walk edges, refusing any step that crosses an active barrier
      const seen = new Set<number>([start.id]);
      const stack = [start.id];
      while (stack.length) {
        const n = nav.nodes[stack.pop()!];
        for (const e of n.edges) {
          if (seen.has(e)) continue;
          const m = nav.nodes[e];
          const mx = (n.x + m.x) / 2;
          const mz = (n.z + m.z) / 2;
          const blocked = (x: number, z: number): boolean => map.world.overlaps(x - 0.3, m.y + 0.1, z - 0.3, x + 0.3, m.y + 1.7, z + 0.3, F_SOLID, true);
          if (blocked(mx, mz) || blocked(m.x, m.z)) continue;
          seen.add(e);
          stack.push(e);
        }
      }
      for (const id of seen) expect(inRect(map.buyZones[side], nav.nodes[id].x, nav.nodes[id].z)).toBe(true);
    }
  });
});

describe('routes and timings', () => {
  it('reaches every authored position on the nav grid', () => {
    const pts: { x: number; z: number; y?: number }[] = [...map.midHolds, ...map.spawns.atk, ...map.spawns.def];
    for (const site of [map.sites.A, map.sites.B]) {
      pts.push(...site.plantSpots, ...site.holds, ...site.postPlant, ...site.retake, ...site.veilTargets);
      for (const e of site.entries) pts.push(e.stage, ...e.path);
    }
    for (const p of pts) {
      const n = nav.nearest(p.x, p.y ?? 0, p.z)!;
      expect(n, `no nav node near ${p.x},${p.z}`).toBeTruthy();
      expect(Math.hypot(n.x - p.x, n.z - p.z), `authored point ${p.x},${p.z} is not standable`).toBeLessThan(1.0);
      expect(Math.abs(n.y - (p.y ?? 0))).toBeLessThan(0.3);
      expect(isFinite(walk(atkSpawn, p))).toBe(true);
    }
  });

  it('gives attackers an 8-14 s run to first contact, deliberately different at A and B', () => {
    const tA = walk(atkSpawn, map.sites.A.entries[0].path[0]) / RUN;
    const tB = walk(atkSpawn, map.sites.B.entries[0].path[0]) / RUN;
    console.log(`attacker contact: A ${tA.toFixed(1)} s, B ${tB.toFixed(1)} s`);
    for (const t of [tA, tB]) {
      expect(t).toBeGreaterThan(8);
      expect(t).toBeLessThan(14);
    }
    expect(Math.abs(tA - tB)).toBeGreaterThan(0.8);
  });

  it('lets defenders set up on both vaults before attackers arrive', () => {
    for (const site of [map.sites.A, map.sites.B]) {
      const def = walk(defSpawn, site.center) / RUN;
      const atk = walk(atkSpawn, site.center) / RUN;
      console.log(`${site.name}: defenders ${def.toFixed(1)} s, attackers ${atk.toFixed(1)} s`);
      expect(def).toBeLessThan(atk - 1.5);
    }
  });

  it('offers a risky mid rotation that is clearly faster than the safe long one', () => {
    // measured vault centre to vault centre, in both directions
    const a = map.sites.A.center;
    const b = map.sites.B.center;
    const mid = Math.max(walk(a, b), walk(b, a));
    const atrium = { x: 41, z: 70 };
    const long = walk(a, atrium) + walk(atrium, b);
    console.log(`rotation A<->B: mid ${(mid / RUN).toFixed(1)} s (${mid.toFixed(0)} m), long ${(long / RUN).toFixed(1)} s (${long.toFixed(0)} m)`);
    expect(mid).toBeLessThan(long * 0.7);
    expect(long / RUN).toBeGreaterThan(13);
    expect(long / RUN).toBeLessThan(21);
    expect(mid / RUN).toBeLessThan(13);
    // the short route really does cross the middle of the map
    const path = nav.findPath(nav.nearest(a.x, 0, a.z)!.id, nav.nearest(b.x, 0, b.z)!.id)!;
    expect(path.some((id) => nav.nodes[id].x > 32 && nav.nodes[id].x < 48 && nav.nodes[id].z < 52)).toBe(true);
  });

  it('gives each vault at least three entry vectors, two of them usable without mid control', () => {
    for (const site of [map.sites.A, map.sites.B]) {
      expect(site.entries.length).toBeGreaterThanOrEqual(3);
      expect(site.entries.filter((e) => !e.viaMid).length).toBeGreaterThanOrEqual(2);
      expect(site.entries.filter((e) => e.viaMid).length).toBeGreaterThanOrEqual(1);
      for (const e of site.entries) {
        // every entry genuinely leads into the vault
        const last = e.path[e.path.length - 1];
        expect(walk(last, site.center)).toBeLessThan(16);
        // non-mid entries do not pass through the Calibration chamber
        if (!e.viaMid) {
          const p = nav.findPath(nav.nearest(atkSpawn.x, 0, atkSpawn.z)!.id, nav.nearest(e.path[0].x, e.path[0].y ?? 0, e.path[0].z)!.id)!;
          expect(p.some((id) => calloutAt(map, nav.nodes[id].x, nav.nodes[id].z) === 'Calibration')).toBe(false);
        }
      }
    }
  });
});

describe('vaults and stuck points', () => {
  it('keeps plant spots inside their vault zone and the zones inside open floor', () => {
    for (const site of [map.sites.A, map.sites.B]) {
      for (const p of site.plantSpots) expect(inRect(site.zone, p.x, p.z)).toBe(true);
      let open = 0;
      let total = 0;
      for (let z = Math.ceil(site.zone.z0); z < site.zone.z1; z++)
        for (let x = Math.ceil(site.zone.x0); x < site.zone.x1; x++) {
          total++;
          if (map.open[z * map.sizeX + x]) open++;
        }
      expect(open).toBe(total);
    }
  });

  it('has no pits: every reachable node can walk back to both spawns', () => {
    // reverse reachability from the attacker spawn
    const incoming: number[][] = nav.nodes.map(() => []);
    for (const n of nav.nodes) for (const e of n.edges) incoming[e].push(n.id);
    const start = nav.nearest(atkSpawn.x, 0, atkSpawn.z)!.id;
    const back = new Set<number>([start]);
    const stack = [start];
    while (stack.length) for (const p of incoming[stack.pop()!]) if (!back.has(p)) (back.add(p), stack.push(p));
    const reachable = nav.nodes.filter((n) => n.reachable);
    expect(reachable.length).toBeGreaterThan(3000);
    const stuck = reachable.filter((n) => !back.has(n.id));
    expect(stuck.map((n) => `${n.x},${n.y},${n.z}`)).toEqual([]);
  });

  it('never places a nav node inside geometry', () => {
    for (const n of nav.nodes) {
      if (!n.reachable) continue;
      const h = n.crouch ? PLAYER.crouchHeight : PLAYER.standHeight;
      expect(map.world.overlaps(n.x - PLAYER.halfWidth, n.y + 0.02, n.z - PLAYER.halfWidth, n.x + PLAYER.halfWidth, n.y + h, n.z + PLAYER.halfWidth, F_SOLID, false)).toBe(false);
    }
  });

  it('names every walkable area with a short callout', () => {
    const names = new Set<string>();
    for (const n of nav.nodes) {
      if (!n.reachable) continue;
      const c = calloutAt(map, n.x, n.z, n.y);
      expect(c.length).toBeGreaterThan(0);
      expect(c.length).toBeLessThanOrEqual(12);
      names.add(c);
    }
    for (const want of ['Freight', 'Atrium', 'Turbine', 'Hydro', 'Calibration', 'Ledge', 'Gantry', 'Glass', 'Crawl', 'Service', 'A Site', 'B Site']) expect(names.has(want)).toBe(true);
  });
});

describe('grenade containment', () => {
  it('keeps every thrown projectile inside the playfield and out of solid geometry', () => {
    let throws = 0;
    for (let i = 0; i < nav.nodes.length; i += 23) {
      const n = nav.nodes[i];
      if (!n.reachable) continue;
      for (let k = 0; k < 6; k++) {
        const yaw = (k / 6) * Math.PI * 2 + i;
        for (const pitch of [-0.2, 0.35, 1.0]) {
          // thrown from eye height for the stance that fits at this node
          const r = simulateThrow(map.world, 'frag', n.x, n.y + (n.crouch ? 1.05 : 1.55), n.z, yaw, pitch, false, DT, 5, 1000);
          throws++;
          expect(r.endX).toBeGreaterThan(0);
          expect(r.endX).toBeLessThan(map.sizeX);
          expect(r.endZ).toBeGreaterThan(0);
          expect(r.endZ).toBeLessThan(map.sizeZ);
          expect(r.endY).toBeGreaterThan(-0.1);
          expect(r.endY).toBeLessThan(16.1);
          // "inside" means more than a centimetre deep in a solid box (touching a surface is fine)
          const deep = map.world
            .query(r.endX - 0.001, r.endY - 0.001, r.endZ - 0.001, r.endX + 0.001, r.endY + 0.001, r.endZ + 0.001, F_SOLID, false, [])
            .some((b) => r.endX > b.x0 + 0.01 && r.endX < b.x1 - 0.01 && r.endY > b.y0 + 0.01 && r.endY < b.y1 - 0.01 && r.endZ > b.z0 + 0.01 && r.endZ < b.z1 - 0.01);
          expect(deep, `throw from ${n.x},${n.y},${n.z} ended inside geometry at ${r.endX.toFixed(2)},${r.endY.toFixed(2)},${r.endZ.toFixed(2)}`).toBe(false);
        }
      }
    }
    expect(throws).toBeGreaterThan(2000);
  });
});
