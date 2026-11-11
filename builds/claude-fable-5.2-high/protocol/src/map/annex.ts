// Aperture Annex - original two-vault research campus for Cipher Breach.
// South: Freight yard (Intrusion spawn). North: Security Atrium (Custodian spawn).
// East: Vault A "Turbine" (tall hall). West: Vault B "Hydro" (low lab). Centre: split-level Calibration chamber.
import { MapBuilder, type MapData, type SiteDef, type Spot } from './build';

const UP = 2.6; // upper level height

let cached: MapData | null = null;

export function buildAnnex(): MapData {
  const b = new MapBuilder('Aperture Annex', 'annex-1.0', 80, 80, 8);

  // ---------------------------------------------------------------- Intrusion side
  b.room('Freight', 20, 3, 62, 15, 'yard');
  b.room('Dock', 56, 15, 78, 32, 'dock');
  b.room('Nursery', 6, 15, 24, 30, 'dock');
  b.room('Spine', 37, 15, 43, 27, 'corridor', { ceil: 4.2 });
  b.room('Spine', 38, 27, 42, 28, 'corridor', { ceil: 2.8 });

  // ---------------------------------------------------------------- Mid
  b.room('Calibration', 32, 28, 48, 41, 'mid', { ceil: 7.4 });
  b.room('Ledge', 32, 41, 48, 50, 'mid', { floor: UP, ceil: 7.4 });
  b.room('Steps', 38, 50, 42, 51, 'corridor', { floor: UP, ceil: 5.2 });
  b.room('Steps', 37, 51, 43, 64, 'corridor', { ceil: 5.6 });
  b.room('Catwalk', 48, 45, 53, 48, 'corridor', { floor: UP, ceil: 5.4 });
  b.room('Catwalk', 53, 45, 54, 48, 'corridor', { floor: UP, ceil: 5.0 });
  b.room('B Stairs', 26, 45, 32, 48, 'corridor', { ceil: 5.6 });
  b.room('B Stairs', 25, 45, 26, 48, 'corridor', { ceil: 2.6 });
  b.room('Crawl', 25, 36, 32, 37, 'service', { ceil: 1.3 });

  // ---------------------------------------------------------------- Vault A
  b.room('Turbine', 54, 34, 74, 56, 'hall', { ceil: 7.4 });
  b.room('A Gate', 62, 32, 65, 34, 'hall', { ceil: 2.8 });
  b.room('Service', 75, 32, 78, 50, 'service', { ceil: 3.4 });
  b.room('Service', 74, 46, 75, 48, 'service', { ceil: 2.4 });
  b.room('Service', 74, 37, 75, 43, 'service', { ceil: 3.2 });
  b.room('A Back', 61, 58, 72, 70, 'corridor', { ceil: 4.4 });
  b.room('A Back', 66, 56, 69, 58, 'corridor', { ceil: 2.6 });
  b.room('A Back', 60, 65, 61, 69, 'corridor', { ceil: 3.0 });

  // ---------------------------------------------------------------- Vault B
  b.room('Hydro', 6, 32, 25, 52, 'lab', { ceil: 3.4 });
  b.room('B Gate', 14, 30, 17, 32, 'lab', { ceil: 2.6 });
  b.room('Glass', 2, 20, 5, 48, 'glasshall', { ceil: 3.2 });
  b.room('Glass', 5, 22, 6, 25, 'glasshall', { ceil: 2.6 });
  b.room('Glass', 5, 45, 6, 47, 'glasshall', { ceil: 2.4 });
  b.room('Glass', 5, 34, 6, 43, 'glasshall', { ceil: 2.8 });
  b.room('B Back', 8, 54, 21, 70, 'corridor', { ceil: 4.4 });
  b.room('B Back', 10, 52, 13, 54, 'corridor', { ceil: 2.6 });
  b.room('B Back', 21, 65, 22, 69, 'corridor', { ceil: 3.0 });

  // ---------------------------------------------------------------- Custodian side
  b.room('Atrium', 22, 64, 60, 77, 'atrium', { ceil: 7.4 });

  // ---------------------------------------------------------------- Stairs and platforms
  // stair runs are whole metres so their ends line up with the 1 m nav grid
  b.stairs(45, 36, 48, 41, '+z', 0, UP); // Calibration floor -> Ledge
  b.prop(37, 51, 43, 52, 0, UP, 'concrete', 'platform');
  b.stairs(37, 52, 43, 57, '-z', 0, UP); // Atrium steps -> Ledge
  b.prop(31, 45, 32, 48, 0, UP, 'concrete', 'platform');
  b.stairs(26, 45, 31, 48, '+x', 0, UP); // Hydro -> Ledge
  // Gantry in the turbine hall
  b.prop(54, 38, 57, 50, UP - 0.25, UP, 'grate', 'gantry');
  b.stairs(54, 50, 56, 55, '-z', 0, UP, 'grate');
  b.prop(56.7, 38, 57, 38.3, 0, UP - 0.25, 'metal', 'post');
  b.prop(56.7, 43.85, 57, 44.15, 0, UP - 0.25, 'metal', 'post');
  b.prop(56.7, 49.7, 57, 50, 0, UP - 0.25, 'metal', 'post');
  b.prop(56.85, 38, 57, 41, UP, UP + 0.55, 'metal', 'parapet');
  b.prop(56.85, 43, 57, 50, UP, UP + 0.55, 'metal', 'parapet');
  b.prop(54, 38, 57, 38.15, UP, UP + 0.55, 'metal', 'parapet');
  // second gantry stair, up from the vault floor to the parapet gap: keeps the mid rotation short
  b.stairs(57, 41, 62, 43, '-x', 0, UP, 'grate');
  // approach baffles: attackers stage behind them, out of sight of the yard, and the run to each gate is longer
  b.prop(56, 24.5, 68, 25.1, 0, 3.2, 'concrete', 'lowwall');
  b.prop(12, 24.3, 24, 24.9, 0, 3.2, 'concrete', 'lowwall');
  // Ledge parapet (gap at the west end allows a drop into Calibration)
  b.prop(35, 41, 45, 41.2, UP, UP + 0.9, 'concrete', 'parapet');

  // ---------------------------------------------------------------- Penetrable / see-through surfaces
  b.prop(74.35, 37, 74.65, 43, 0, 3.2, 'panel', 'panel'); // Vault A service wall
  b.prop(5.44, 34, 5.56, 43, 0, 2.8, 'glass', 'glass'); // Vault B glass wall

  // ---------------------------------------------------------------- Props
  const crate = (x: number, z: number, h = 1.3, s = 1.5) => b.prop(x, z, x + s, z + s, 0, h, 'wood', 'crate');
  const container = (x0: number, z0: number, x1: number, z1: number) => b.prop(x0, z0, x1, z1, 0, 2.6, 'metal', 'container');
  const planter = (x0: number, z0: number, x1: number, z1: number) => {
    b.prop(x0, z0, x1, z1, 0, 1.0, 'soil', 'planter');
    b.prop(x0 + 0.06, z0 + 0.06, x1 - 0.06, z1 - 0.06, 1.0, 2.1, 'foliage', 'foliage');
  };
  // Freight yard
  container(26, 9, 32, 11.5);
  container(52, 4.5, 58, 7);
  crate(35.5, 10.5);
  crate(47, 11.8);
  crate(22, 5, 2.2);
  // Dock
  container(60, 19, 66, 21.5);
  crate(70, 25);
  crate(58, 27);
  b.prop(73, 17, 75, 19, 0, 1.3, 'wood', 'crate');
  crate(67, 29.5, 2.2);
  // Turbine hall
  b.prop(59, 44, 62, 47, 0, 4.5, 'metal', 'turbine');
  b.prop(66.5, 41, 69.5, 44, 0, 4.5, 'metal', 'turbine');
  b.prop(63, 37.5, 66, 38.5, 0, 1.1, 'metal', 'console');
  b.prop(63.5, 50, 66.5, 51, 0, 1.1, 'metal', 'console');
  b.prop(60, 53, 64, 53.4, 0, 1.2, 'concrete', 'lowwall');
  b.prop(70.5, 35, 72.5, 37, 0, 1.3, 'wood', 'crate');
  crate(71, 49.5);
  crate(58, 36, 2.2);
  // Service corridor, A Back
  b.prop(76.8, 40, 78, 41.2, 0, 1.3, 'wood', 'crate');
  crate(62, 59);
  b.prop(66, 63, 67, 64, 0, 4.4, 'concrete', 'pillar');
  // Atrium
  b.prop(30, 67, 31, 68, 0, 7.4, 'concrete', 'pillar');
  b.prop(51, 67, 52, 68, 0, 7.4, 'concrete', 'pillar');
  b.prop(30, 73, 31, 74, 0, 7.4, 'concrete', 'pillar');
  b.prop(51, 73, 52, 74, 0, 7.4, 'concrete', 'pillar');
  b.prop(38, 68, 42, 69, 0, 1.1, 'metal', 'console');
  // Calibration
  b.prop(39, 32, 41, 35, 0, 3.4, 'metal', 'rig');
  crate(34, 30);
  crate(42.5, 37);
  b.prop(38.5, 44.5, 40, 46, UP, UP + 1.3, 'wood', 'crate');
  // calibration cabinet: with the crate it closes the Hydro <-> Gantry sightline across the Ledge
  b.prop(40, 46, 41.5, 48.2, UP, UP + 2.4, 'metal', 'rig');
  // Spine
  crate(37, 20);
  crate(41.5, 23.5);
  // Hydro
  planter(9, 37, 10, 45);
  planter(12.5, 39, 13.5, 47);
  planter(16, 37, 17, 45);
  planter(19.5, 39, 20.5, 47);
  b.prop(22.5, 33, 24, 34.5, 0, 1.9, 'metal', 'tank');
  crate(7, 33);
  b.prop(14, 49.5, 17, 50.5, 0, 1.1, 'metal', 'console');
  // Glass corridor, Nursery, B Back
  b.prop(4, 29, 5, 30.2, 0, 1.3, 'wood', 'crate');
  container(15, 20, 21, 22.5);
  crate(8, 26);
  crate(19, 27);
  b.prop(10, 16, 13, 17, 0, 1.0, 'soil', 'planter');
  b.prop(10.06, 16.06, 12.94, 16.94, 1.0, 1.9, 'foliage', 'foliage');
  crate(17, 56);
  b.prop(13, 62, 14, 63, 0, 4.4, 'concrete', 'pillar');

  // ---------------------------------------------------------------- Buy-phase barriers
  b.barrier(20, 15, 24, 15.2);
  b.barrier(37, 15, 43, 15.2);
  b.barrier(56, 15, 62, 15.2);
  b.barrier(60, 65, 60.2, 69);
  b.barrier(21.8, 65, 22, 69);
  b.barrier(37, 63.8, 43, 64);

  // ---------------------------------------------------------------- Lighting (baked on the client)
  const cool: [number, number, number] = [0.82, 0.9, 1.05];
  const warm: [number, number, number] = [1.1, 0.98, 0.8];
  const amber: [number, number, number] = [1.12, 0.82, 0.54];
  const grow: [number, number, number] = [0.7, 0.24, 0.55];
  const lab: [number, number, number] = [0.66, 0.73, 0.65];
  const magenta: [number, number, number] = [0.8, 0.2, 0.56];
  b.lightGrid({ x0: 54, z0: 34, x1: 74, z1: 56 }, 7.0, 7, cool, 13);
  b.light(63.2, 2.4, 45.5, magenta, 6, false);
  b.light(65.6, 2.4, 42.5, magenta, 6, false);
  b.light(68, 2.4, 45.2, magenta, 5, false);
  b.light(55.5, 2.0, 44, amber, 5, false);
  b.lightGrid({ x0: 6, z0: 32, x1: 25, z1: 52 }, 3.15, 5, lab, 7.5);
  for (const px of [9.5, 13, 16.5, 20]) {
    b.light(px, 2.6, 40, grow, 4.2, false);
    b.light(px, 2.6, 45, grow, 4.2, false);
  }
  b.lightGrid({ x0: 22, z0: 64, x1: 60, z1: 77 }, 7.0, 8, warm, 14);
  b.lightGrid({ x0: 32, z0: 28, x1: 48, z1: 50 }, 7.0, 7, cool, 13);
  b.light(40, 2.2, 36.2, magenta, 5, false);
  b.lightGrid({ x0: 37, z0: 15, x1: 43, z1: 27 }, 3.9, 6, warm, 8);
  b.lightGrid({ x0: 37, z0: 52, x1: 43, z1: 64 }, 5.3, 6, warm, 9);
  b.lightGrid({ x0: 48, z0: 45, x1: 54, z1: 48 }, 5.0, 4, amber, 6);
  b.lightGrid({ x0: 26, z0: 45, x1: 32, z1: 48 }, 5.2, 4, amber, 7);
  b.lightGrid({ x0: 75, z0: 32, x1: 78, z1: 50 }, 3.15, 6, [0.95, 0.9, 0.82], 6.5);
  b.lightGrid({ x0: 61, z0: 58, x1: 72, z1: 70 }, 4.1, 6, warm, 9);
  b.lightGrid({ x0: 8, z0: 54, x1: 21, z1: 70 }, 4.1, 6, warm, 9);
  b.lightGrid({ x0: 2, z0: 20, x1: 5, z1: 48 }, 2.95, 5.5, cool, 6.5);
  b.light(28.5, 1.1, 36.5, amber, 3.5, false);

  // ---------------------------------------------------------------- Signage
  b.sign('VAULT A  TURBINE', 63.5, 3.5, 31.97, 0, -1, '#ff5fb8');
  b.sign('VAULT B  HYDRO', 15.5, 3.3, 29.97, 0, -1, '#ff5fb8');
  b.sign('CALIBRATION', 40, 3.45, 26.97, 0, -1);
  b.sign('SERVICE', 76.5, 4.1, 31.97, 0, -1, '#ffb056');
  b.sign('GLASS', 6.03, 3.2, 23.5, 1, 0);
  b.sign('A BACK', 59.97, 3.8, 67, -1, 0);
  b.sign('B BACK', 22.03, 3.8, 67, 1, 0);
  b.sign('STEPS  MID', 40, 6.5, 64.03, 0, 1);
  b.sign('FREIGHT', 40, 5.2, 14.97, 0, -1);
  b.sign('A', 73.97, 5.2, 52, -1, 0, '#ff5fb8');
  b.sign('B', 24.97, 2.9, 41, -1, 0, '#ff5fb8');

  // ---------------------------------------------------------------- Callout overrides
  b.callout('Gantry', 54, 38, 57, 50, 2);
  b.callout('A Site', 58, 39, 71, 52);
  b.callout('B Site', 7, 36, 21.5, 48);

  // ---------------------------------------------------------------- Bot/level design data
  const A: SiteDef = {
    id: 'A',
    name: 'Vault A',
    zone: { x0: 58, z0: 39, x1: 71, z1: 52 },
    center: { x: 64.5, z: 46 },
    plantSpots: [
      { x: 64, z: 46.2 },
      { x: 63, z: 48.6 },
      { x: 70.3, z: 45.6 },
    ],
    holds: [
      { name: 'gantry', x: 55.5, z: 39.2, y: UP, lookX: 63.5, lookZ: 35 },
      { name: 'behind east turbine', x: 70.3, z: 44.8, lookX: 66, lookZ: 38.5 },
      { name: 'behind west turbine', x: 58.2, z: 47.6, lookX: 63, lookZ: 40 },
      { name: 'service watch', x: 72.6, z: 52.4, lookX: 74.5, lookZ: 47 },
      { name: 'catwalk watch', x: 62.8, z: 49.2, lookX: 54, lookZ: 46.5 },
    ],
    postPlant: [
      { x: 70.4, z: 45.2, lookX: 67.5, lookZ: 56 },
      { x: 58.3, z: 47.8, lookX: 56, lookZ: 53 },
      { x: 64.5, z: 36.6, lookX: 66, lookZ: 55 },
      { x: 72.6, z: 39, lookX: 67.5, lookZ: 57 },
      { x: 76.5, z: 47, lookX: 70, lookZ: 47 },
    ],
    entries: [
      { name: 'A Gate', stage: { x: 58.2, z: 30.4 }, path: [{ x: 63.5, z: 33 }, { x: 63.5, z: 36.4 }], viaMid: false },
      { name: 'Service', stage: { x: 76.5, z: 29 }, path: [{ x: 76.5, z: 47 }, { x: 73, z: 47 }], viaMid: false },
      {
        name: 'Gantry',
        stage: { x: 38.2, z: 18.6 },
        path: [
          { x: 46.5, z: 34.5 },
          { x: 46.5, z: 43.5, y: UP },
          { x: 51, z: 46.5, y: UP },
          { x: 55.5, z: 46.5, y: UP },
          { x: 55.5, z: 42, y: UP },
        ],
        viaMid: true,
      },
    ],
    veilTargets: [
      { x: 66.5, z: 53 },
      { x: 58.5, z: 39.6 },
    ],
    retake: [
      { x: 67.5, z: 55 },
      { x: 55.5, z: 46.5, y: UP },
      { x: 73, z: 47 },
    ],
  };
  const B: SiteDef = {
    id: 'B',
    name: 'Vault B',
    zone: { x0: 7, z0: 36, x1: 21.5, z1: 48 },
    center: { x: 15, z: 42 },
    plantSpots: [
      { x: 11.2, z: 42 },
      { x: 14.8, z: 43 },
      { x: 18.2, z: 42 },
    ],
    holds: [
      { name: 'tank', x: 23.6, z: 35.7, lookX: 15.5, lookZ: 32.5 },
      { name: 'planter lane', x: 11.2, z: 47.6, lookX: 15.5, lookZ: 34.5 },
      { name: 'glass watch', x: 7.6, z: 44.5, lookX: 3.5, lookZ: 28 },
      { name: 'east lane', x: 22.8, z: 49.5, lookX: 22.8, lookZ: 36.5 },
      { name: 'stairs watch', x: 18.2, z: 48.2, lookX: 25.5, lookZ: 46.5 },
    ],
    postPlant: [
      { x: 22.6, z: 50.5, lookX: 11.5, lookZ: 53 },
      { x: 7.5, z: 35.5, lookX: 11.5, lookZ: 52.5 },
      { x: 21.6, z: 35.6, lookX: 25.5, lookZ: 46.5 },
      { x: 15.5, z: 33.5, lookX: 15.5, lookZ: 50 },
      { x: 7.6, z: 49.5, lookX: 11.5, lookZ: 52.5 },
    ],
    entries: [
      { name: 'B Gate', stage: { x: 11, z: 28.6 }, path: [{ x: 15.5, z: 31 }, { x: 15.5, z: 34 }], viaMid: false },
      { name: 'Glass', stage: { x: 3.5, z: 22.6 }, path: [{ x: 3.5, z: 46 }, { x: 7.5, z: 46 }], viaMid: false },
      {
        name: 'B Stairs',
        stage: { x: 38.2, z: 18.6 },
        path: [
          { x: 46.5, z: 34.5 },
          { x: 46.5, z: 43.5, y: UP },
          { x: 33, z: 46.5, y: UP },
          { x: 24, z: 46.5 },
        ],
        viaMid: true,
      },
      { name: 'Crawl', stage: { x: 38.2, z: 18.6 }, path: [{ x: 33.5, z: 36.5 }, { x: 24, z: 36.5 }], viaMid: true },
    ],
    veilTargets: [
      { x: 15.5, z: 49 },
      { x: 11.5, z: 50.5 },
    ],
    retake: [
      { x: 11.5, z: 51 },
      { x: 24, z: 46.5 },
      { x: 15.5, z: 33.5 },
    ],
  };
  const midHolds: Spot[] = [
    { name: 'ledge', x: 37.5, z: 42.4, y: UP, lookX: 40, lookZ: 28.5 },
    { name: 'ledge east', x: 44, z: 47.5, y: UP, lookX: 46.5, lookZ: 40 },
  ];

  const atk = [];
  const def = [];
  for (let i = 0; i < 5; i++) {
    atk.push({ x: 42 + i * 2, z: i % 2 ? 8.2 : 6, yaw: 0 });
    def.push({ x: 37 + i * 2, z: i % 2 ? 72 : 74, yaw: Math.PI });
  }

  return b.finish({
    spawns: { atk, def },
    buyZones: { atk: { x0: 20, z0: 3, x1: 62, z1: 15 }, def: { x0: 22, z0: 64, x1: 60, z1: 77 } },
    sites: { A, B },
    midHolds,
  });
}

/** The map is immutable once built, so client, server and tests share one instance. */
export function getAnnex(): MapData {
  if (!cached) cached = buildAnnex();
  return cached;
}
