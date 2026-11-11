// faction-data: data-driven balance tables for both factions and neutral map objects.
import type { AbilityDef, EntityDef, Faction, TechDef, WeaponDef } from './types';
import { ARMOR_UPGRADE_STEP, ATTACK_UPGRADE_STEP, TAGS } from './types';

function weapon(w: Partial<WeaponDef> & Pick<WeaponDef, 'name' | 'damage' | 'period' | 'range' | 'fx'>): WeaponDef {
  return {
    minRange: 0, windup: 0.1, speed: 0, splash: 0, delay: 0, bonus: {}, melee: false, hitsHover: true, ground: false,
    ...w,
  };
}

function ent(e: Partial<EntityDef> & Pick<EntityDef, 'id' | 'name' | 'faction' | 'cls' | 'role' | 'hp'>): EntityDef {
  return {
    counters: '', ore: 0, flux: 0, supply: 0, supplyProvided: 0, buildTime: 0, armor: 0, speed: 0, radius: 0.6,
    sight: 0, tags: [], footprint: 0, requires: [], trains: [], researches: [], zone: 0, energy: 0, shield: 0, height: 1.5,
    ...e,
  };
}

const HELIX_TECH = ['helix_atk1', 'helix_arm1', 'helix_t2', 'helix_atk2', 'helix_arm2', 'helix_atk3', 'helix_arm3'];
const CHORUS_TECH = ['chorus_atk1', 'chorus_arm1', 'chorus_t2', 'chorus_atk2', 'chorus_arm2', 'chorus_atk3', 'chorus_arm3'];

export const ENTITY_DEFS: EntityDef[] = [
  // ------------------------------------------------------------------ Helix Directorate units
  ent({
    id: 'fabricator', name: 'Fabricator', faction: 'helix', cls: 'unit', worker: true,
    role: 'Worker. Mines Prism Ore and Flux, assembles structures and repairs mechanical targets.',
    counters: 'Fragile. Protect it from raids.',
    ore: 50, supply: 1, buildTime: 12, hp: 50, speed: 3.5, radius: 0.55, sight: 8, height: 1.1,
    tags: ['Light', 'Mechanical'], ability: 'weld',
    weapon: weapon({ name: 'Arc Torch', damage: 4, period: 1.0, range: 0.5, fx: 'tool', melee: true, hitsHover: false }),
  }),
  ent({
    id: 'kestrel', name: 'Kestrel', faction: 'helix', cls: 'unit', scout: true,
    role: 'Fast wheeled scout with long sight and a light carbine.',
    counters: 'Outruns everything; loses to any real fighter.',
    ore: 60, supply: 1, buildTime: 14, hp: 75, speed: 6.4, radius: 0.6, sight: 14, height: 1.0,
    tags: ['Light', 'Mechanical'], ability: 'spike',
    weapon: weapon({ name: 'Carbine', damage: 4, period: 0.8, range: 5, speed: 30, fx: 'rifle' }),
  }),
  ent({
    id: 'bulwark', name: 'Bulwark', faction: 'helix', cls: 'unit',
    role: 'Basic rifle walker. Reliable line infantry; Brace trades mobility for reach.',
    counters: 'Strong vs Light. Weak vs Armored tanks and siege.',
    ore: 75, supply: 1, buildTime: 15, hp: 95, armor: 1, speed: 3.3, radius: 0.6, sight: 9, height: 1.7,
    tags: ['Light', 'Mechanical'], ability: 'brace', requires: ['assembly_bay'],
    weapon: weapon({ name: 'Rail Rifle', damage: 8, period: 0.8, range: 6, speed: 28, fx: 'rifle', bonus: { Light: 2 } }),
  }),
  ent({
    id: 'lancer', name: 'Arc Lancer', faction: 'helix', cls: 'unit',
    role: 'Slow anti-armor platform. Its lance overpenetrates into one Light unit behind the target.',
    counters: 'Strong vs Armored and Massive. Weak vs swarms of Light units.',
    ore: 100, flux: 40, supply: 2, buildTime: 22, hp: 130, armor: 1, speed: 2.6, radius: 0.75, sight: 9, height: 1.5,
    tags: ['Armored', 'Mechanical'], requires: ['assembly_bay'],
    weapon: weapon({ name: 'Arc Lance', damage: 22, period: 1.8, range: 7.5, windup: 0.3, speed: 40, fx: 'lance', bonus: { Armored: 16, Massive: 16 }, pierce: true }),
  }),
  ent({
    id: 'mender', name: 'Mender Rig', faction: 'helix', cls: 'unit',
    role: 'Unarmed support vehicle. Automatically repairs nearby mechanical units from its Flux charge.',
    counters: 'Keeps a firing line alive. Defenceless alone.',
    ore: 75, flux: 50, supply: 2, buildTime: 20, hp: 90, speed: 3.6, radius: 0.7, sight: 9, height: 1.3, energy: 100,
    tags: ['Light', 'Mechanical'], requires: ['assembly_bay', 'signal_foundry'],
  }),
  ent({
    id: 'mortar', name: 'Mortar Crawler', faction: 'helix', cls: 'unit',
    role: 'Siege crawler. Lobs a visible shell with splash; cannot fire at close range.',
    counters: 'Strong vs structures and clumps. Weak when anything reaches it.',
    ore: 150, flux: 100, supply: 3, buildTime: 30, hp: 140, armor: 1, speed: 2.3, radius: 0.9, sight: 10, height: 1.6,
    tags: ['Armored', 'Mechanical'], requires: ['assembly_bay', 'signal_foundry'],
    weapon: weapon({ name: 'Siege Mortar', damage: 34, period: 3.2, range: 14, minRange: 5, windup: 0.8, speed: 13, splash: 2.2, fx: 'shell', bonus: { Structure: 30 }, ground: true, hitsHover: false }),
  }),
  ent({
    id: 'aegis', name: 'Aegis Frame', faction: 'helix', cls: 'unit',
    role: 'Late heavy walker. A directional shield soaks frontal projectile damage until it is depleted.',
    counters: 'Anchors a push. Flank it or bring anti-armor.',
    ore: 250, flux: 175, supply: 5, buildTime: 42, hp: 420, armor: 3, speed: 2.5, radius: 1.25, sight: 10, height: 2.6, shield: 160,
    tags: ['Massive', 'Mechanical'], requires: ['assembly_bay', 'signal_foundry'], requiresTech: 'helix_t2',
    weapon: weapon({ name: 'Twin Arc Cannon', damage: 30, period: 1.4, range: 6.5, windup: 0.2, speed: 26, fx: 'arc', bonus: { Structure: 10 } }),
  }),
  // ------------------------------------------------------------------ Helix structures
  ent({
    id: 'core_relay', name: 'Core Relay', faction: 'helix', cls: 'structure', hq: true, dropoff: true,
    role: 'Headquarters and resource drop-off. Lose every Core Relay and the match is lost.',
    counters: 'Projects a construction field.',
    ore: 400, buildTime: 80, hp: 1500, armor: 2, sight: 11, footprint: 6, supplyProvided: 12, zone: 20, height: 6,
    tags: ['Structure', 'Mechanical'], trains: ['fabricator', 'kestrel'],
  }),
  ent({
    id: 'grid_pylon', name: 'Grid Pylon', faction: 'helix', cls: 'structure',
    role: 'Supply structure. Extends the construction field.',
    ore: 100, buildTime: 22, hp: 300, armor: 1, sight: 8, footprint: 2, supplyProvided: 8, zone: 13, height: 3.6,
    tags: ['Structure', 'Mechanical'],
  }),
  ent({
    id: 'assembly_bay', name: 'Assembly Bay', faction: 'helix', cls: 'structure',
    role: 'Unit production. Builds every Directorate combat chassis.',
    ore: 150, buildTime: 40, hp: 800, armor: 1, sight: 9, footprint: 4, height: 3.2,
    tags: ['Structure', 'Mechanical'], requires: ['grid_pylon'], trains: ['bulwark', 'lancer', 'mender', 'mortar', 'aegis'],
  }),
  ent({
    id: 'signal_foundry', name: 'Signal Foundry', faction: 'helix', cls: 'structure',
    role: 'Advanced technology. Unlocks support and siege chassis and researches upgrades.',
    ore: 150, flux: 100, buildTime: 45, hp: 700, armor: 1, sight: 9, footprint: 4, height: 4.4,
    tags: ['Structure', 'Mechanical'], requires: ['assembly_bay'], researches: HELIX_TECH,
  }),
  ent({
    id: 'sentry_arc', name: 'Sentry Arc', faction: 'helix', cls: 'structure',
    role: 'Short-range defensive emitter. Its coverage ring is shown during placement.',
    counters: 'Outranged by siege units.',
    ore: 100, flux: 25, buildTime: 25, hp: 350, armor: 2, sight: 9.5, footprint: 2, height: 2.6,
    tags: ['Structure', 'Mechanical'], requires: ['assembly_bay'],
    weapon: weapon({ name: 'Arc Emitter', damage: 14, period: 0.9, range: 7.5, speed: 0, fx: 'arc' }),
  }),
  ent({
    id: 'flux_tap', name: 'Flux Tap', faction: 'helix', cls: 'structure', tap: true,
    role: 'Extractor erected on a Flux vent. Workers draw Flux from it.',
    ore: 75, buildTime: 20, hp: 350, armor: 1, sight: 7, footprint: 2, height: 2.4,
    tags: ['Structure', 'Mechanical'],
  }),
  // ------------------------------------------------------------------ Verdant Chorus units
  ent({
    id: 'tender', name: 'Tender', faction: 'chorus', cls: 'unit', worker: true,
    role: 'Worker. Harvests and germinates structures, which then grow on their own.',
    counters: 'Fragile. Frees itself the moment a seed is planted.',
    ore: 50, supply: 1, buildTime: 12, hp: 45, speed: 3.6, radius: 0.55, sight: 8, height: 1.0,
    tags: ['Light', 'Biological'],
    weapon: weapon({ name: 'Pruning Hooks', damage: 4, period: 1.0, range: 0.5, fx: 'tool', melee: true, hitsHover: false }),
  }),
  ent({
    id: 'glimmerwing', name: 'Glimmerwing', faction: 'chorus', cls: 'unit', scout: true, hover: true,
    role: 'Hovering scout. Unarmed, excellent sight, drifts over cliffs and the ravine.',
    counters: 'Ignores terrain. Dies to anything that can shoot upward.',
    ore: 50, supply: 1, buildTime: 14, hp: 55, speed: 6.0, radius: 0.6, sight: 15, height: 1.2,
    tags: ['Light', 'Biological', 'Hover'],
  }),
  ent({
    id: 'thornling', name: 'Thornling', faction: 'chorus', cls: 'unit',
    role: 'Cheap melee screen. Frenzies (+35% speed) while chasing a wounded enemy.',
    counters: 'Swarms slow shooters. Weak vs splash and braced lines.',
    ore: 40, supply: 1, buildTime: 9, hp: 80, speed: 4.6, radius: 0.5, sight: 8, height: 0.9,
    tags: ['Light', 'Biological'], requires: ['brood_hollow'],
    weapon: weapon({ name: 'Thorn Rake', damage: 8, period: 0.65, range: 0.5, fx: 'claw', melee: true, hitsHover: false }),
  }),
  ent({
    id: 'sporecaster', name: 'Sporecaster', faction: 'chorus', cls: 'unit',
    role: 'Ranged skirmisher. Spores apply a short, non-stacking slow.',
    counters: 'Kites slow walkers. Weak vs Light rushes in its face.',
    ore: 70, flux: 20, supply: 1, buildTime: 15, hp: 85, speed: 3.7, radius: 0.6, sight: 9.5, height: 1.6,
    tags: ['Light', 'Biological'], requires: ['brood_hollow'],
    weapon: weapon({ name: 'Spore Lob', damage: 12, period: 1.0, range: 6.5, speed: 16, fx: 'spore', slow: { factor: 0.7, seconds: 1.5 } }),
  }),
  ent({
    id: 'carapace', name: 'Carapace Guard', faction: 'chorus', cls: 'unit',
    role: 'Anti-ranged tank (-35% ranged damage). Curl roots it in place and hardens its front.',
    counters: 'Soaks rifle fire. Weak vs anti-armor lances and melee heavies.',
    ore: 100, flux: 30, supply: 2, buildTime: 22, hp: 240, armor: 2, speed: 2.9, radius: 0.85, sight: 8, height: 1.4,
    tags: ['Armored', 'Biological'], ability: 'curl', requires: ['brood_hollow'],
    weapon: weapon({ name: 'Shell Ram', damage: 14, period: 1.1, range: 0.6, fx: 'gore', melee: true, hitsHover: false, bonus: { Light: 6 } }),
  }),
  ent({
    id: 'sage', name: 'Bloom Sage', faction: 'chorus', cls: 'unit',
    role: 'Support caster. Mend Spores heals biological allies in an area (autocasts when idle energy allows).',
    counters: 'Sustains a brawl. Kill it first.',
    ore: 75, flux: 75, supply: 2, buildTime: 24, hp: 80, speed: 3.4, radius: 0.6, sight: 9, height: 2.0, energy: 100,
    tags: ['Light', 'Biological'], ability: 'mend', requires: ['brood_hollow', 'memory_bloom'],
  }),
  ent({
    id: 'stag', name: 'Rift Stag', faction: 'chorus', cls: 'unit',
    role: 'Mobile artillery. Calls delayed ground eruptions that can be sidestepped.',
    counters: 'Strong vs structures and static lines. Weak if engaged.',
    ore: 150, flux: 110, supply: 3, buildTime: 30, hp: 130, speed: 3.4, radius: 0.9, sight: 10.5, height: 2.2,
    tags: ['Armored', 'Biological'], requires: ['brood_hollow', 'memory_bloom'],
    weapon: weapon({ name: 'Rift Call', damage: 30, period: 3.0, range: 12, minRange: 3, windup: 0.5, delay: 1.1, splash: 2.4, fx: 'eruption', bonus: { Structure: 24 }, ground: true, hitsHover: false }),
  }),
  ent({
    id: 'crownbeast', name: 'Crownbeast', faction: 'chorus', cls: 'unit',
    role: 'Late assault beast. Nearby allies regenerate quickly while out of combat.',
    counters: 'Breaks armored lines. Kite it or focus it down.',
    ore: 240, flux: 180, supply: 5, buildTime: 42, hp: 520, armor: 2, speed: 3.0, radius: 1.3, sight: 9, height: 2.5,
    tags: ['Massive', 'Biological'], requires: ['brood_hollow', 'memory_bloom'], requiresTech: 'chorus_t2',
    weapon: weapon({ name: 'Crown Gore', damage: 34, period: 1.3, range: 0.8, windup: 0.25, fx: 'gore', melee: true, hitsHover: false, bonus: { Armored: 14, Structure: 14 } }),
  }),
  // ------------------------------------------------------------------ Chorus structures
  ent({
    id: 'heartgrove', name: 'Heartgrove', faction: 'chorus', cls: 'structure', hq: true, dropoff: true,
    role: 'Headquarters and resource drop-off. Lose every Heartgrove and the match is lost.',
    counters: 'Roots a living build zone.',
    ore: 400, buildTime: 88, hp: 1400, armor: 1, sight: 11, footprint: 6, supplyProvided: 12, zone: 20, height: 6,
    tags: ['Structure', 'Biological'], trains: ['tender', 'glimmerwing'],
  }),
  ent({
    id: 'root_node', name: 'Root Node', faction: 'chorus', cls: 'structure',
    role: 'Supply growth. Extends the living build zone.',
    ore: 100, buildTime: 24, hp: 260, sight: 8, footprint: 2, supplyProvided: 8, zone: 13, height: 3.0,
    tags: ['Structure', 'Biological'],
  }),
  ent({
    id: 'brood_hollow', name: 'Brood Hollow', faction: 'chorus', cls: 'structure',
    role: 'Unit growth. Hatches every Chorus combat organism.',
    ore: 150, buildTime: 44, hp: 750, armor: 1, sight: 9, footprint: 4, height: 3.0,
    tags: ['Structure', 'Biological'], requires: ['root_node'], trains: ['thornling', 'sporecaster', 'carapace', 'sage', 'stag', 'crownbeast'],
  }),
  ent({
    id: 'memory_bloom', name: 'Memory Bloom', faction: 'chorus', cls: 'structure',
    role: 'Technology. Unlocks casters and artillery and researches adaptations.',
    ore: 150, flux: 100, buildTime: 50, hp: 650, sight: 9, footprint: 4, height: 4.6,
    tags: ['Structure', 'Biological'], requires: ['brood_hollow'], researches: CHORUS_TECH,
  }),
  ent({
    id: 'needle_pod', name: 'Needle Pod', faction: 'chorus', cls: 'structure',
    role: 'Defensive growth. Prioritises hovering scouts, then the closest threat.',
    counters: 'Outranged by siege units.',
    ore: 100, flux: 25, buildTime: 26, hp: 320, armor: 1, sight: 9.5, footprint: 2, height: 2.4,
    tags: ['Structure', 'Biological'], requires: ['brood_hollow'],
    weapon: weapon({ name: 'Needle Volley', damage: 11, period: 0.7, range: 7.5, speed: 30, fx: 'needle', bonus: { Hover: 10 } }),
  }),
  ent({
    id: 'flux_bulb', name: 'Flux Tap', faction: 'chorus', cls: 'structure', tap: true,
    role: 'Root coil grown over a Flux vent. Workers draw Flux from it.',
    ore: 75, buildTime: 22, hp: 320, sight: 7, footprint: 2, height: 2.2,
    tags: ['Structure', 'Biological'],
  }),
  // ------------------------------------------------------------------ Neutral map objects
  ent({ id: 'ore', name: 'Prism Ore Seam', faction: 'neutral', cls: 'resource', role: 'Finite crystal seam. Workers mine it for Prism Ore.', hp: 1, radius: 1.0, footprint: 2, height: 1.6 }),
  ent({ id: 'vent', name: 'Flux Vent', faction: 'neutral', cls: 'resource', role: 'Energy vent. Build a Flux Tap on it to extract Flux.', hp: 1, radius: 1.0, footprint: 0, height: 0.4 }),
  ent({ id: 'watch_pylon', name: 'Watch Pylon', faction: 'neutral', cls: 'neutral', role: 'Neutral sensor. A unit standing beside it for 3 seconds captures it and gains vision of the lane.', hp: 1, radius: 1.0, footprint: 2, sight: 15, height: 5 }),
  ent({ id: 'barrier', name: 'Crystal Barrier', faction: 'neutral', cls: 'neutral', role: 'Destructible crystal wall. Break it to open a new route.', hp: 700, armor: 1, radius: 3.2, footprint: 0, tags: ['Structure'], height: 3.5 }),
  ent({ id: 'pod', name: 'Salvage Pod', faction: 'neutral', cls: 'neutral', role: 'Neutral salvage. The first unit to reach it recovers a fixed resource bundle.', hp: 1, radius: 0.8, footprint: 0, height: 1.0 }),
];

function tech(faction: Faction, names: string[], descs: string[]): TechDef[] {
  const p = faction;
  return [
    { id: `${p}_atk1`, name: names[0] + ' I', faction, ore: 100, flux: 100, time: 50, kind: 'attack', level: 1, desc: descs[0] },
    { id: `${p}_arm1`, name: names[1] + ' I', faction, ore: 100, flux: 100, time: 50, kind: 'armor', level: 1, desc: descs[1] },
    { id: `${p}_t2`, name: names[2], faction, ore: 150, flux: 150, time: 60, kind: 'tier', level: 1, desc: descs[2] },
    { id: `${p}_atk2`, name: names[0] + ' II', faction, ore: 150, flux: 150, time: 60, kind: 'attack', level: 2, requiresTech: `${p}_t2`, desc: descs[0] },
    { id: `${p}_arm2`, name: names[1] + ' II', faction, ore: 150, flux: 150, time: 60, kind: 'armor', level: 2, requiresTech: `${p}_t2`, desc: descs[1] },
    { id: `${p}_atk3`, name: names[0] + ' III', faction, ore: 200, flux: 200, time: 70, kind: 'attack', level: 3, requiresTech: `${p}_t2`, desc: descs[0] },
    { id: `${p}_arm3`, name: names[1] + ' III', faction, ore: 200, flux: 200, time: 70, kind: 'armor', level: 3, requiresTech: `${p}_t2`, desc: descs[1] },
  ];
}

const atkPct = Math.round(ATTACK_UPGRADE_STEP * 100);
const armPct = Math.round(ARMOR_UPGRADE_STEP * 100);

export const TECH_DEFS: TechDef[] = [
  ...tech('helix', ['Coil Calibration', 'Composite Plating', 'Overclock Lattice'], [
    `All Directorate weapons deal +${atkPct}% damage per level.`,
    `All Directorate units and structures take ${armPct}% less damage per level.`,
    'Tier II. Unlocks the Aegis Frame and level II-III upgrades.',
  ]),
  ...tech('chorus', ['Keen Thorns', 'Dense Membranes', 'Elder Growth'], [
    `All Chorus attacks deal +${atkPct}% damage per level.`,
    `All Chorus organisms and growths take ${armPct}% less damage per level.`,
    'Tier II. Unlocks the Crownbeast and level II-III adaptations.',
  ]),
];

export const ABILITY_DEFS: AbilityDef[] = [
  { id: 'weld', name: 'Emergency Weld', desc: 'Restore 60 HP to a friendly structure over 4 seconds.', target: 'unit', range: 3, cooldown: 20, energy: 0, flux: 25, radius: 0 },
  { id: 'spike', name: 'Sensor Spike', desc: 'Fire a sensor that grants vision of an area for 30 seconds. Enemies can see the spike.', target: 'point', range: 11, cooldown: 40, energy: 0, flux: 0, radius: 9 },
  { id: 'brace', name: 'Brace', desc: 'Toggle. +2 weapon range, but movement speed is cut by 55%.', target: 'none', range: 0, cooldown: 1, energy: 0, flux: 0, radius: 0, toggle: true },
  { id: 'curl', name: 'Curl', desc: 'Toggle. Cannot move or attack; frontal damage -60%, other damage -30%.', target: 'none', range: 0, cooldown: 1, energy: 0, flux: 0, radius: 0, toggle: true },
  { id: 'mend', name: 'Mend Spores', desc: 'Heal biological allies in an area for 45 HP over 4 seconds. Costs 50 energy.', target: 'point', range: 8, cooldown: 3, energy: 50, flux: 0, radius: 4 },
];

// ---------------------------------------------------------------------- lookup tables
export const DEF_INDEX: Record<string, number> = {};
ENTITY_DEFS.forEach((d, i) => { DEF_INDEX[d.id] = i; });
export const TECH_INDEX: Record<string, number> = {};
TECH_DEFS.forEach((d, i) => { TECH_INDEX[d.id] = i; });
export const ABILITY_BY_ID: Record<string, AbilityDef> = {};
ABILITY_DEFS.forEach((a) => { ABILITY_BY_ID[a.id] = a; });

export function defOf(id: string): EntityDef {
  const i = DEF_INDEX[id];
  if (i === undefined) throw new Error(`unknown entity def ${id}`);
  return ENTITY_DEFS[i];
}

export interface FactionInfo {
  id: Faction;
  name: string;
  tagline: string;
  blurb: string;
  hq: string; supply: string; production: string; tech: string; defense: string; tap: string;
  worker: string; scout: string;
  traits: string[];
}

export const FACTIONS: Record<Faction, FactionInfo> = {
  helix: {
    id: 'helix', name: 'Helix Directorate', tagline: 'Durable firing lines and positional setup',
    blurb: 'Industrial expeditionaries fielding modular walkers, projectile weapons and field engineering.',
    hq: 'core_relay', supply: 'grid_pylon', production: 'assembly_bay', tech: 'signal_foundry', defense: 'sentry_arc', tap: 'flux_tap',
    worker: 'fabricator', scout: 'kestrel',
    traits: ['Fabricators must stay to assemble a structure; extra hands speed it up', 'Armor on every chassis; damage is repaired, not regrown', 'Brace, shields and siege reward holding ground'],
  },
  chorus: {
    id: 'chorus', name: 'Verdant Chorus', tagline: 'Mobility, regeneration and encirclement',
    blurb: 'A distributed bio-synthetic ecology grown from seed organisms across living root zones.',
    hq: 'heartgrove', supply: 'root_node', production: 'brood_hollow', tech: 'memory_bloom', defense: 'needle_pod', tap: 'flux_bulb',
    worker: 'tender', scout: 'glimmerwing',
    traits: ['Tenders plant a seed and walk away; growths finish on their own', 'Everything regenerates slowly while out of combat', 'Cheap, fast bodies that slow and surround'],
  },
};

/** Schema validation for balance content. Returns a list of human-readable problems (empty = valid). */
export function validateDefs(): string[] {
  const errs: string[] = [];
  const ids = new Set<string>();
  const num = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
  for (const d of ENTITY_DEFS) {
    const at = `entity ${d.id}`;
    if (!/^[a-z_0-9]+$/.test(d.id)) errs.push(`${at}: bad id`);
    if (ids.has(d.id)) errs.push(`${at}: duplicate id`);
    ids.add(d.id);
    if (!d.name || d.name.length > 32) errs.push(`${at}: bad name`);
    for (const k of ['ore', 'flux', 'supply', 'supplyProvided', 'buildTime', 'hp', 'armor', 'speed', 'radius', 'sight', 'footprint', 'zone', 'energy', 'shield'] as const) {
      if (!num(d[k]) || d[k] < 0) errs.push(`${at}: ${k} must be a non-negative number`);
    }
    if (d.hp <= 0) errs.push(`${at}: hp must be positive`);
    if (d.footprint % 2 !== 0) errs.push(`${at}: footprint must be even`);
    for (const t of d.tags) if (!TAGS.includes(t)) errs.push(`${at}: unknown tag ${t}`);
    if (d.cls === 'unit') {
      if (d.speed <= 0) errs.push(`${at}: units need speed`);
      if (d.supply <= 0) errs.push(`${at}: units need supply`);
      if (d.buildTime <= 0) errs.push(`${at}: units need build time`);
      if (!d.role || !d.counters) errs.push(`${at}: units need role and counter text`);
    }
    if (d.cls === 'structure') {
      if (d.footprint <= 0) errs.push(`${at}: structures need a footprint`);
      if (d.speed !== 0) errs.push(`${at}: structures cannot move`);
      if (!d.tags.includes('Structure')) errs.push(`${at}: structures need the Structure tag`);
    }
    if (d.weapon) {
      const w = d.weapon;
      if (!(w.damage > 0) || !(w.period > 0) || !(w.range > 0)) errs.push(`${at}: weapon numbers invalid`);
      if (w.minRange >= w.range) errs.push(`${at}: minRange >= range`);
      for (const t of Object.keys(w.bonus)) if (!TAGS.includes(t as never)) errs.push(`${at}: weapon bonus tag ${t}`);
    }
    if (d.ability && !ABILITY_BY_ID[d.ability]) errs.push(`${at}: unknown ability ${d.ability}`);
  }
  for (const d of ENTITY_DEFS) {
    for (const r of [...d.requires, ...d.trains]) if (!ids.has(r)) errs.push(`entity ${d.id}: unknown reference ${r}`);
    for (const r of d.researches) if (TECH_INDEX[r] === undefined) errs.push(`entity ${d.id}: unknown tech ${r}`);
    if (d.requiresTech && TECH_INDEX[d.requiresTech] === undefined) errs.push(`entity ${d.id}: unknown tech ${d.requiresTech}`);
    for (const t of d.trains) {
      const u = ENTITY_DEFS[DEF_INDEX[t]];
      if (u && u.faction !== d.faction) errs.push(`entity ${d.id}: trains cross-faction ${t}`);
    }
  }
  for (const t of TECH_DEFS) {
    if (!num(t.ore) || !num(t.flux) || !(t.time > 0)) errs.push(`tech ${t.id}: bad numbers`);
    if (t.requiresTech && TECH_INDEX[t.requiresTech] === undefined) errs.push(`tech ${t.id}: unknown prerequisite`);
  }
  if (ATTACK_UPGRADE_STEP > 0.12 || ARMOR_UPGRADE_STEP > 0.12) errs.push('upgrade step exceeds the 12% cap');
  for (const f of Object.values(FACTIONS)) {
    for (const k of ['hq', 'supply', 'production', 'tech', 'defense', 'tap', 'worker', 'scout'] as const) {
      if (!ids.has(f[k])) errs.push(`faction ${f.id}: unknown ${k} ${f[k]}`);
    }
  }
  return errs;
}
