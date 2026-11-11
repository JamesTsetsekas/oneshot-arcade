// Aperture Annex — original map source. Authored as walkable regions on a
// 0.5 m grid (everything outside a region is solid structure) plus explicit
// props. The same source produces collision, nav, zones, callouts and render
// geometry, so render and ballistics can never disagree.

export type MaterialId =
  | 'concrete'
  | 'panel'
  | 'tile'
  | 'drywall'
  | 'glass'
  | 'crate'
  | 'container'
  | 'metal'
  | 'planter'
  | 'rack'
  | 'turbine'
  | 'rail'
  | 'asphalt'
  | 'ground';

export interface MaterialDef {
  id: MaterialId;
  /** only tagged materials can be penetrated */
  penetrable: boolean;
  /** penetration power consumed per metre of thickness */
  penCost: number;
  /** sight/LOS passes through */
  seeThrough: boolean;
  restitution: number;
  step: 'concrete' | 'metal' | 'tile' | 'soil' | 'glass';
}

export const MATERIALS: Record<MaterialId, MaterialDef> = {
  concrete: { id: 'concrete', penetrable: false, penCost: 99, seeThrough: false, restitution: 0.42, step: 'concrete' },
  panel: { id: 'panel', penetrable: false, penCost: 99, seeThrough: false, restitution: 0.35, step: 'concrete' },
  tile: { id: 'tile', penetrable: false, penCost: 99, seeThrough: false, restitution: 0.45, step: 'tile' },
  asphalt: { id: 'asphalt', penetrable: false, penCost: 99, seeThrough: false, restitution: 0.38, step: 'concrete' },
  ground: { id: 'ground', penetrable: false, penCost: 99, seeThrough: false, restitution: 0.4, step: 'concrete' },
  drywall: { id: 'drywall', penetrable: true, penCost: 3.0, seeThrough: false, restitution: 0.3, step: 'concrete' },
  glass: { id: 'glass', penetrable: true, penCost: 2.0, seeThrough: true, restitution: 0.25, step: 'glass' },
  crate: { id: 'crate', penetrable: true, penCost: 1.2, seeThrough: false, restitution: 0.3, step: 'soil' },
  container: { id: 'container', penetrable: false, penCost: 99, seeThrough: false, restitution: 0.5, step: 'metal' },
  metal: { id: 'metal', penetrable: true, penCost: 2.2, seeThrough: false, restitution: 0.5, step: 'metal' },
  planter: { id: 'planter', penetrable: false, penCost: 99, seeThrough: false, restitution: 0.2, step: 'soil' },
  rack: { id: 'rack', penetrable: true, penCost: 0.8, seeThrough: false, restitution: 0.3, step: 'metal' },
  turbine: { id: 'turbine', penetrable: false, penCost: 99, seeThrough: false, restitution: 0.55, step: 'metal' },
  rail: { id: 'rail', penetrable: true, penCost: 0.5, seeThrough: true, restitution: 0.5, step: 'metal' },
};

export type RegionStyle = 'yard' | 'lane' | 'hall' | 'lab' | 'mid' | 'atrium' | 'corridor' | 'glass' | 'gallery' | 'garden' | 'crawl';

export interface RegionDef {
  id: string;
  callout: string;
  rect: [number, number, number, number];
  floor: number;
  /** null = open sky */
  ceil: number | null;
  style: RegionStyle;
}

export interface PropDef {
  rect: [number, number, number, number];
  y0: number;
  y1: number;
  mat: MaterialId;
}

export interface ZoneDef {
  id: string;
  rect: [number, number, number, number];
  y0: number;
  y1: number;
}

export interface MapDef {
  id: string;
  name: string;
  version: number;
  bounds: [number, number, number, number];
  cell: number;
  solidTop: number;
  regions: RegionDef[];
  props: PropDef[];
  vaults: ZoneDef[];
  spawns: { intrusion: [number, number][]; custodian: [number, number][] };
  spawnRegions: { intrusion: string; custodian: string };
  /** plant spots the bots use; must be inside vault zones */
  plantSpots: Record<string, [number, number][]>;
  signs: { pos: [number, number, number]; facing: number; text: string }[];
}

const r = (
  id: string,
  callout: string,
  rect: [number, number, number, number],
  style: RegionStyle,
  ceil: number | null,
  floor = 0,
): RegionDef => ({ id, callout, rect, floor, ceil, style });

const regions: RegionDef[] = [
  r('yard', 'Freight Yard', [-12, -38, 12, -24], 'yard', null),
  r('freightLane', 'Freight Lane', [-40, -34, -12, -28], 'lane', null),
  r('cargoLane', 'Cargo Lane', [-42, -28, -34, -8], 'lane', null),
  r('aMain', 'A Main', [-40, -8, -35, -4], 'hall', 5),
  r('aHall', 'Turbine Hall', [-46, -4, -24, 18], 'hall', 11),
  r('aGantry', 'Gantry', [-46, 4, -42, 18], 'hall', 11, 3.2),
  r('aBack', 'A Back', [-36, 18, -32, 22], 'corridor', 5),
  r('westGallery', 'West Gallery', [-38, 22, -10, 26], 'gallery', 5),
  r('atrium', 'Atrium', [-10, 18, 10, 32], 'atrium', 8),
  r('eastGallery', 'East Gallery', [10, 22, 40, 26], 'gallery', 5),
  r('bBack', 'B Back', [34, 14, 38, 22], 'corridor', 4.5),
  r('bLab', 'Hydroponics', [24, -4, 44, 14], 'lab', 4.5),
  r('pipeLane', 'Pipe Lane', [12, -34, 36, -28], 'lane', null),
  r('bRamp', 'B Ramp', [30, -28, 36, -8], 'lane', null),
  r('bMain', 'B Main', [31, -8, 35, -4], 'lab', 4.5),
  r('crawlA', 'Crawl', [36, -14, 42, -12], 'crawl', 1.35),
  r('crawlB', 'Crawl', [40, -12, 42, -4], 'crawl', 1.35),
  r('lowerRamp', 'Lower Ramp', [-6, -24, -2, -16], 'corridor', 5),
  r('mid', 'Calibration', [-10, -16, 10, 0], 'mid', 7),
  r('midDeck', 'Calibration Deck', [3, -16, 10, -9], 'mid', 7, 1.6),
  r('upperHall', 'Upper Hall', [4, 0, 8, 18], 'corridor', 5),
  r('aLink', 'A Link', [-24, -9, -10, -5], 'corridor', 4),
  r('service', 'Service', [-24, -9, -20, 10], 'corridor', 4),
  r('glass', 'Glass', [10, -4, 24, 0], 'glass', 4),
  r('garden', 'Garden', [12, 0, 22, 9], 'garden', null),
];

// Gantry stairs: eight 0.4 m steps rising north toward the gantry.
for (let k = 0; k < 8; k++) {
  regions.push(r(`aStair${k}`, 'Gantry Stairs', [-46, 0.5 * k, -42, 0.5 + 0.5 * k], 'hall', 11, 0.4 * (k + 1)));
}
// Calibration deck steps descending north.
[1.2, 0.8, 0.4].forEach((h, k) => {
  regions.push(r(`deckStep${k}`, 'Calibration Deck', [3, -9 + 0.5 * k, 10, -8.5 + 0.5 * k], 'mid', 7, h));
});

const p = (rect: [number, number, number, number], y0: number, y1: number, mat: MaterialId): PropDef => ({ rect, y0, y1, mat });

const props: PropDef[] = [
  // Freight Yard containers and crates
  p([-9, -32, -6, -26], 0, 2.6, 'container'),
  p([6, -33, 9, -27], 0, 2.6, 'container'),
  p([-2, -30, 0, -28], 0, 1.2, 'crate'),
  p([0.5, -29.5, 1.7, -28.3], 0, 1.2, 'crate'),
  // Freight Lane
  p([-30, -33.5, -28, -31.5], 0, 1.2, 'crate'),
  p([-22, -30, -20, -28], 0, 1.2, 'crate'),
  p([-16, -34, -14.5, -32.5], 0, 2.2, 'crate'),
  // Cargo Lane
  p([-42, -20, -39, -19.2], 0, 1.1, 'metal'),
  p([-36, -14, -34, -12], 0, 1.8, 'crate'),
  // Turbine Hall: turbines, crates, gantry rails
  p([-31, -1, -27, 3], 0, 9, 'turbine'),
  p([-31, 11, -27, 15], 0, 9, 'turbine'),
  p([-38.5, 4, -37, 5.5], 0, 1.2, 'crate'),
  p([-34, 8, -32, 10], 0, 1.4, 'crate'),
  p([-37.5, 9, -36.5, 10], 0, 2.4, 'crate'),
  p([-42.1, 4, -41.9, 9], 3.2, 4.25, 'rail'),
  p([-42.1, 12, -41.9, 18], 3.2, 4.25, 'rail'),
  // Penetrable service wall between Turbine Hall and Service, gap = A Short door
  p([-24, -4, -23.7, 4], 0, 4, 'drywall'),
  p([-24, 7, -23.7, 10], 0, 4, 'drywall'),
  // Hydroponics: planters (low, obscuring) and grow racks (tall)
  p([27, 0, 29, 6], 0, 1.1, 'planter'),
  p([27, 8, 29, 12], 0, 1.1, 'planter'),
  p([42, 2, 44, 6], 0, 1.1, 'planter'),
  p([40, 8, 42, 12], 0, 1.1, 'planter'),
  p([33, 3, 34, 7], 0, 2.4, 'rack'),
  p([37, 10.5, 41, 11.3], 0, 2.4, 'rack'),
  p([25, -3.6, 26.5, -2.4], 0, 1.1, 'planter'),
  // Glass corridor window onto Garden
  p([12, -0.08, 22, 0.08], 0, 4, 'glass'),
  // Calibration chamber
  p([-2, -10, 0, -8], 0, 7, 'turbine'),
  p([-8, -4, -6, -2], 0, 1.1, 'metal'),
  p([7.2, -16, 7.4, -12.5], 1.6, 2.6, 'rail'),
  // Atrium
  p([-3, 24, 3, 25.5], 0, 1.1, 'metal'),
  p([-7, 21, -6, 22], 0, 8, 'concrete'),
  p([6, 21, 7, 22], 0, 8, 'concrete'),
  // Pipe Lane
  p([18, -34, 20, -33], 0, 1.4, 'metal'),
  p([26, -30, 28, -28], 0, 1.2, 'crate'),
  // B Ramp
  p([30, -18, 32, -16], 0, 1.2, 'crate'),
  p([33, -12, 36, -11.2], 0, 1.1, 'metal'),
  // Garden decor
  p([14, 3, 16, 5], 0, 1.0, 'planter'),
  p([18, 5, 20, 7], 0, 1.0, 'planter'),
];

export const ANNEX: MapDef = {
  id: 'aperture-annex',
  name: 'Aperture Annex',
  version: 3,
  bounds: [-50, -42, 50, 36],
  cell: 0.5,
  solidTop: 12,
  regions,
  props,
  vaults: [
    { id: 'A', rect: [-41, 1, -30, 12], y0: -0.5, y1: 3.5 },
    { id: 'B', rect: [29, 1, 40, 10], y0: -0.5, y1: 3 },
  ],
  spawns: {
    intrusion: [[-6, -35], [-3, -36.5], [0, -35], [3, -36.5], [-9, -36.5]],
    custodian: [[-5, 29], [-2, 30], [1, 29], [4, 30], [7, 28.5]],
  },
  spawnRegions: { intrusion: 'yard', custodian: 'atrium' },
  plantSpots: {
    A: [[-35.5, 6.5], [-39, 7], [-33, 3], [-38.5, 11]],
    B: [[35.5, 5], [31, 8], [38.5, 3], [31.5, 2.5]],
  },
  signs: [
    { pos: [-37.5, 3.2, -4.3], facing: 0, text: 'A  TURBINE' },
    { pos: [33, 3.0, -8.3], facing: 0, text: 'B  HYDRO' },
    { pos: [-10.3, 3.0, -7], facing: -Math.PI / 2, text: '◄ A LINK' },
    { pos: [10.3, 3.0, -2], facing: Math.PI / 2, text: 'GLASS ► B' },
    { pos: [-4, 3.4, -23.7], facing: 0, text: 'CALIBRATION' },
    { pos: [-34, 3.6, 21.7], facing: Math.PI, text: 'A  ▼' },
    { pos: [36, 3.4, 21.7], facing: Math.PI, text: 'B  ▼' },
  ],
};
