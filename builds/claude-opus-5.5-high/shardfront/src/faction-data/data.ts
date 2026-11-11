import type { AbilityDef, FactionDef, StructureDef, TechDef, UnitDef } from './schema';

/** seconds -> simulation ticks (20 Hz) */
const s = (sec: number) => Math.round(sec * 20);

export const FACTIONS: Record<'helix' | 'verdant', FactionDef> = {
  helix: {
    id: 'helix',
    name: 'Helix Directorate',
    tagline: 'Hold the line. Build the line. Move the line.',
    description:
      'Industrial expeditionaries fielding modular walkers and projectile weapons. Fabricators stay on site to weld every structure together, and Directorate armies win by bracing into firing lines before the enemy arrives.',
    worker: 'fabricator', scout: 'kestrel', hq: 'core_relay', supplyStructure: 'grid_pylon',
    production: 'assembly_bay', tech: 'signal_foundry', defense: 'sentry_arc', extractor: 'flux_tap',
    selfGrowingStructures: false, passiveRegen: 0, zoneRegen: 0, color: '#f2b45a',
  },
  verdant: {
    id: 'verdant',
    name: 'Verdant Chorus',
    tagline: 'Every seed remembers the shape of the forest.',
    description:
      'A distributed bio-synthetic ecology. Tenders plant seeds that grow into structures on their own, living root zones heal the swarm, and Chorus forces win through mobility, regeneration and encirclement.',
    worker: 'tender', scout: 'glimmerwing', hq: 'heartgrove', supplyStructure: 'root_node',
    production: 'brood_hollow', tech: 'memory_bloom', defense: 'needle_pod', extractor: 'flux_siphon',
    selfGrowingStructures: true, passiveRegen: 0.6, zoneRegen: 2.0, color: '#b48cff',
  },
};

export const ABILITIES: Record<string, AbilityDef> = {
  emergency_weld: {
    id: 'emergency_weld', name: 'Emergency Weld', slot: 0, target: 'unit', cost: { ore: 0, flux: 25 },
    cooldown: s(10), range: 2.5, description: 'Restore 60 HP to a friendly structure over 4 seconds. Costs 25 Flux.',
  },
  sensor_spike: {
    id: 'sensor_spike', name: 'Sensor Spike', slot: 0, target: 'point', cooldown: s(25), range: 9, radius: 6,
    description: 'Plant a cloaked sensor that grants vision in a small area for 20 s. Detectors can reveal and destroy it.',
  },
  brace: {
    id: 'brace', name: 'Brace', slot: 0, target: 'toggle', cooldown: s(1), range: 0,
    description: 'Lock legs into the ground: +2 range, cannot move. Takes 0.75 s to brace or release.',
  },
  rootstep: {
    id: 'rootstep', name: 'Rootstep', slot: 0, target: 'unit', cooldown: s(30), range: 999,
    description: 'While near a friendly grove (Heartgrove or Root Node), step through the roots to another friendly grove.',
  },
  curl: {
    id: 'curl', name: 'Curl', slot: 0, target: 'toggle', cooldown: s(1), range: 0,
    description: 'Curl into an armored ball: immobile, cannot attack, takes 50% damage. Excellent for absorbing ranged volleys.',
  },
  mend_spores: {
    id: 'mend_spores', name: 'Mend Spores', slot: 0, target: 'point', energy: 50, cooldown: s(4), range: 7, radius: 3,
    description: 'Release healing spores: allies in the area regenerate 50 HP over 5 s.',
  },
  silence_patch: {
    id: 'silence_patch', name: 'Silence Patch', slot: 1, target: 'point', energy: 75, cooldown: s(12), range: 8, radius: 2.6,
    description: 'Telegraph a silence zone. After 1.2 s, enemies inside cannot attack or use abilities for 3 s.',
  },
};

const WORKER_TORCH = { kind: 'torch' as const, damage: 4, period: 30, range: 0.9, windup: 6, canTargetHover: false };

export const UNITS: Record<string, UnitDef> = {
  // ---------------- Helix Directorate ----------------
  fabricator: {
    id: 'fabricator', name: 'Fabricator', faction: 'helix', role: 'Worker: mines, repairs mechanical targets, constructs.',
    cost: { ore: 50, flux: 0 }, supply: 1, buildTime: s(12), hp: 45, armor: 0, speed: 3.1, radius: 0.45, sight: 7,
    tags: ['Light', 'Mechanical'], weapon: WORKER_TORCH, abilities: ['emergency_weld'], producedAt: 'core_relay', requires: [],
    worker: true, strongVs: 'Nothing; keep it mining.', weakVs: 'Everything.', hotkey: 'Q',
  },
  kestrel: {
    id: 'kestrel', name: 'Kestrel', faction: 'helix', role: 'Fast wheeled scout with long sight.',
    cost: { ore: 60, flux: 0 }, supply: 1, buildTime: s(14), hp: 55, armor: 0, speed: 5.4, radius: 0.5, sight: 11,
    tags: ['Light', 'Mechanical'],
    weapon: { kind: 'rifle', damage: 4, period: 16, range: 4, windup: 2, canTargetHover: true },
    abilities: ['sensor_spike'], producedAt: 'assembly_bay', requires: [],
    strongVs: 'Workers, scouting.', weakVs: 'Bulwarks, Needle Pods.', hotkey: 'Q',
  },
  bulwark: {
    id: 'bulwark', name: 'Bulwark', faction: 'helix', role: 'Rifle walker. Reliable against Light targets; braces for range.',
    cost: { ore: 60, flux: 0 }, supply: 1, buildTime: s(16), hp: 95, armor: 1, speed: 2.7, radius: 0.55, sight: 9,
    tags: ['Mechanical'],
    weapon: { kind: 'rifle', damage: 7, period: 18, range: 5, bonus: { Light: 3 }, windup: 3, canTargetHover: true },
    abilities: ['brace'], producedAt: 'assembly_bay', requires: [],
    strongVs: 'Thornlings, Sporecasters (Light).', weakVs: 'Rift Stags, Carapace Guards.', hotkey: 'W',
  },
  arc_lancer: {
    id: 'arc_lancer', name: 'Arc Lancer', faction: 'helix', role: 'Slow anti-armor walker. Lance bolts overpenetrate one Light unit.',
    cost: { ore: 90, flux: 30 }, supply: 2, buildTime: s(22), hp: 115, armor: 1, speed: 2.15, radius: 0.65, sight: 9,
    tags: ['Armored', 'Mechanical'],
    weapon: { kind: 'lance', damage: 14, period: 36, range: 6, projectileSpeed: 24, bonus: { Armored: 16 }, windup: 8, overpenetrate: true, canTargetHover: false },
    abilities: [], producedAt: 'assembly_bay', requires: [],
    strongVs: 'Carapace Guards, Crownbeasts (Armored).', weakVs: 'Thornling swarms.', hotkey: 'E',
  },
  mender_rig: {
    id: 'mender_rig', name: 'Mender Rig', faction: 'helix', role: 'Support drone vehicle. Repairs nearby mechanical units using Flux charge.',
    cost: { ore: 75, flux: 50 }, supply: 2, buildTime: s(22), hp: 80, armor: 0, speed: 3.0, radius: 0.55, sight: 9,
    tags: ['Light', 'Mechanical'], abilities: [], producedAt: 'assembly_bay', requires: ['signal_foundry'],
    energyMax: 120, energyStart: 60, energyRegen: 1.2,
    strongVs: 'Sustaining mechanical armies.', weakVs: 'Anything that reaches it.', hotkey: 'D',
  },
  mortar_crawler: {
    id: 'mortar_crawler', name: 'Mortar Crawler', faction: 'helix', role: 'Siege crawler. Must set up; arcing shells, minimum range, heavy structure damage.',
    cost: { ore: 125, flux: 75 }, supply: 3, buildTime: s(30), hp: 125, armor: 1, speed: 1.95, radius: 0.7, sight: 10,
    tags: ['Armored', 'Mechanical'],
    weapon: { kind: 'shell', damage: 22, period: 60, range: 11, minRange: 3, projectileSpeed: 9, splash: 1.6, bonus: { Structure: 22 }, windup: 6, setupTicks: 30, canTargetHover: false },
    abilities: [], producedAt: 'assembly_bay', requires: ['signal_foundry'],
    strongVs: 'Structures, clumped Light units.', weakVs: 'Thornlings, Glimmerwing-spotted dives.', hotkey: 'F',
  },
  aegis_frame: {
    id: 'aegis_frame', name: 'Aegis Frame', faction: 'helix', role: 'Late heavy walker with a frontal shield that blocks projectile damage.',
    cost: { ore: 200, flux: 125 }, supply: 4, buildTime: s(40), hp: 360, armor: 2, speed: 2.25, radius: 0.95, sight: 10,
    tags: ['Massive', 'Armored', 'Mechanical'],
    weapon: { kind: 'arc', damage: 20, period: 30, range: 5, bonus: { Biological: 6 }, splash: 0.9, windup: 6, canTargetHover: true },
    abilities: [], producedAt: 'assembly_bay', requires: ['signal_foundry', 'aegis_protocol'],
    strongVs: 'Ranged Biological armies.', weakVs: 'Arc Lancers, flanking melee.', hotkey: 'C',
  },

  // ---------------- Verdant Chorus ----------------
  tender: {
    id: 'tender', name: 'Tender', faction: 'verdant', role: 'Worker: harvests and germinates structures. Rootsteps between groves.',
    cost: { ore: 50, flux: 0 }, supply: 1, buildTime: s(12), hp: 40, armor: 0, speed: 3.2, radius: 0.45, sight: 7,
    tags: ['Light', 'Biological'], weapon: { ...WORKER_TORCH, kind: 'bite' }, abilities: ['rootstep'], producedAt: 'heartgrove', requires: [],
    worker: true, strongVs: 'Nothing; keep it harvesting.', weakVs: 'Everything.', hotkey: 'Q',
  },
  glimmerwing: {
    id: 'glimmerwing', name: 'Glimmerwing', faction: 'verdant', role: 'Hovering scout. No attack, excellent sight, detects cloaked sensors.',
    cost: { ore: 60, flux: 0 }, supply: 1, buildTime: s(14), hp: 50, armor: 0, speed: 5.0, radius: 0.5, sight: 13,
    tags: ['Light', 'Biological', 'Hover'], abilities: [], producedAt: 'brood_hollow', requires: [], hover: true, detector: 9,
    strongVs: 'Information.', weakVs: 'Needle fire, Bulwarks, Sentry Arcs.', hotkey: 'Q',
  },
  thornling: {
    id: 'thornling', name: 'Thornling', faction: 'verdant', role: 'Cheap melee screen. Faster when near damaged enemies.',
    cost: { ore: 40, flux: 0 }, supply: 1, buildTime: s(11), hp: 62, armor: 0, speed: 3.4, radius: 0.45, sight: 8,
    tags: ['Light', 'Biological'],
    weapon: { kind: 'melee', damage: 6, period: 14, range: 0.7, windup: 3, canTargetHover: false },
    abilities: [], producedAt: 'brood_hollow', requires: [],
    strongVs: 'Arc Lancers, Mortar Crawlers.', weakVs: 'Bulwarks, Aegis Frames.', hotkey: 'W',
  },
  sporecaster: {
    id: 'sporecaster', name: 'Sporecaster', faction: 'verdant', role: 'Ranged skirmisher. Spores apply a short non-stacking slow.',
    cost: { ore: 70, flux: 15 }, supply: 1, buildTime: s(18), hp: 70, armor: 0, speed: 2.95, radius: 0.5, sight: 9,
    tags: ['Light', 'Biological'],
    weapon: { kind: 'spore', damage: 8, period: 22, range: 5.5, projectileSpeed: 15, bonus: { Mechanical: 2 }, slow: 0.3, slowTicks: s(2), windup: 5, canTargetHover: true },
    abilities: [], producedAt: 'brood_hollow', requires: [],
    strongVs: 'Kiting slow walkers, Mender Rigs.', weakVs: 'Bulwarks, Aegis Frames.', hotkey: 'E',
  },
  carapace_guard: {
    id: 'carapace_guard', name: 'Carapace Guard', faction: 'verdant', role: 'Anti-ranged tank. Curls into immobility to halve incoming damage.',
    cost: { ore: 100, flux: 25 }, supply: 2, buildTime: s(24), hp: 230, armor: 2, speed: 2.45, radius: 0.75, sight: 8,
    tags: ['Armored', 'Biological'],
    weapon: { kind: 'melee', damage: 12, period: 24, range: 1.0, bonus: { Mechanical: 4 }, windup: 6, canTargetHover: false },
    abilities: ['curl'], producedAt: 'brood_hollow', requires: [],
    strongVs: 'Bulwark firing lines.', weakVs: 'Arc Lancers.', hotkey: 'D',
  },
  bloom_sage: {
    id: 'bloom_sage', name: 'Bloom Sage', faction: 'verdant', role: 'Support caster: Mend Spores and a telegraphed Silence Patch.',
    cost: { ore: 75, flux: 75 }, supply: 2, buildTime: s(24), hp: 80, armor: 0, speed: 2.9, radius: 0.55, sight: 10,
    tags: ['Light', 'Biological'], abilities: ['mend_spores', 'silence_patch'], producedAt: 'brood_hollow', requires: ['memory_bloom'],
    energyMax: 200, energyStart: 80, energyRegen: 0.9,
    strongVs: 'Sustained fights, silencing Mortars and Aegis lines.', weakVs: 'Kestrel raids, focus fire.', hotkey: 'F',
  },
  rift_stag: {
    id: 'rift_stag', name: 'Rift Stag', faction: 'verdant', role: 'Mobile artillery creature: delayed ground eruptions. Weak if engaged.',
    cost: { ore: 125, flux: 75 }, supply: 3, buildTime: s(30), hp: 110, armor: 0, speed: 3.0, radius: 0.75, sight: 10,
    tags: ['Armored', 'Biological'],
    weapon: { kind: 'eruption', damage: 26, period: 64, range: 10, minRange: 3, eruptionDelay: 24, splash: 1.8, bonus: { Structure: 14 }, windup: 10, canTargetHover: false },
    abilities: [], producedAt: 'brood_hollow', requires: ['memory_bloom'],
    strongVs: 'Static defenses, braced lines.', weakVs: 'Kestrels, anything that closes the gap.', hotkey: 'G',
  },
  crownbeast: {
    id: 'crownbeast', name: 'Crownbeast', faction: 'verdant', role: 'Late assault beast with a cleave. Projects a regeneration aura outside combat.',
    cost: { ore: 225, flux: 125 }, supply: 4, buildTime: s(40), hp: 430, armor: 2, speed: 2.85, radius: 1.0, sight: 9,
    tags: ['Massive', 'Armored', 'Biological'],
    weapon: { kind: 'melee', damage: 26, period: 30, range: 1.6, splash: 1.1, windup: 8, canTargetHover: false },
    abilities: [], producedAt: 'brood_hollow', requires: ['memory_bloom', 'crown_rite'],
    strongVs: 'Bulwark lines, Sentry Arcs.', weakVs: 'Arc Lancers.', hotkey: 'C',
  },
};

const DEF_RIFLE = { kind: 'rifle' as const, damage: 10, period: 16, range: 7, windup: 2, canTargetHover: true, coneHalfAngle: 80 };

export const STRUCTURES: Record<string, StructureDef> = {
  // ---------------- Helix ----------------
  core_relay: {
    id: 'core_relay', name: 'Core Relay', faction: 'helix', role: 'Headquarters and resource drop-off. Trains Fabricators.',
    cost: { ore: 400, flux: 0 }, buildTime: s(70), hp: 1500, armor: 1, size: 5, sight: 11, supply: 10,
    trains: ['fabricator'], researches: [], requires: [], isHQ: true, isDropoff: true, zoneRadius: 9, tags: ['Armored', 'Mechanical', 'Structure'], hotkey: 'C',
  },
  grid_pylon: {
    id: 'grid_pylon', name: 'Grid Pylon', faction: 'helix', role: 'Provides 8 supply and projects a construction field.',
    cost: { ore: 100, flux: 0 }, buildTime: s(22), hp: 320, armor: 1, size: 2, sight: 7, supply: 8,
    trains: [], researches: [], requires: [], zoneRadius: 7, tags: ['Armored', 'Mechanical', 'Structure'], hotkey: 'Q',
  },
  assembly_bay: {
    id: 'assembly_bay', name: 'Assembly Bay', faction: 'helix', role: 'Basic unit production.',
    cost: { ore: 150, flux: 0 }, buildTime: s(40), hp: 850, armor: 1, size: 4, sight: 8, supply: 0,
    trains: ['kestrel', 'bulwark', 'arc_lancer', 'mender_rig', 'mortar_crawler', 'aegis_frame'], researches: [],
    requires: ['grid_pylon'], tags: ['Armored', 'Mechanical', 'Structure'], hotkey: 'W',
  },
  flux_tap: {
    id: 'flux_tap', name: 'Flux Tap', faction: 'helix', role: 'Extractor built on a Flux vent. Fabricators haul Flux from it.',
    cost: { ore: 75, flux: 0 }, buildTime: s(20), hp: 420, armor: 1, size: 3, sight: 6, supply: 0,
    trains: [], researches: [], requires: [], isExtractor: true, tags: ['Armored', 'Mechanical', 'Structure'], hotkey: 'E',
  },
  signal_foundry: {
    id: 'signal_foundry', name: 'Signal Foundry', faction: 'helix', role: 'Advanced technology and upgrades. Unlocks support and siege.',
    cost: { ore: 150, flux: 100 }, buildTime: s(45), hp: 750, armor: 1, size: 4, sight: 8, supply: 0,
    trains: [], researches: ['helix_attack_1', 'helix_attack_2', 'helix_attack_3', 'helix_armor_1', 'helix_armor_2', 'helix_armor_3', 'aegis_protocol'],
    requires: ['assembly_bay'], tags: ['Armored', 'Mechanical', 'Structure'], hotkey: 'D',
  },
  sentry_arc: {
    id: 'sentry_arc', name: 'Sentry Arc', faction: 'helix', role: 'Short-range defense with a fixed 160° firing cone.',
    cost: { ore: 125, flux: 0 }, buildTime: s(28), hp: 420, armor: 1, size: 2, sight: 9, supply: 0,
    trains: [], researches: [], requires: ['assembly_bay'], weapon: DEF_RIFLE, tags: ['Armored', 'Mechanical', 'Structure'], hotkey: 'F',
  },

  // ---------------- Verdant ----------------
  heartgrove: {
    id: 'heartgrove', name: 'Heartgrove', faction: 'verdant', role: 'Headquarters and resource drop-off. Grows Tenders.',
    cost: { ore: 400, flux: 0 }, buildTime: s(75), hp: 1500, armor: 1, size: 5, sight: 11, supply: 10,
    trains: ['tender'], researches: [], requires: [], isHQ: true, isDropoff: true, zoneRadius: 10, tags: ['Armored', 'Biological', 'Structure'], hotkey: 'C',
  },
  root_node: {
    id: 'root_node', name: 'Root Node', faction: 'verdant', role: 'Provides 8 supply and extends the living root zone.',
    cost: { ore: 100, flux: 0 }, buildTime: s(24), hp: 300, armor: 0, size: 2, sight: 7, supply: 8,
    trains: [], researches: [], requires: [], zoneRadius: 8, tags: ['Biological', 'Structure'], hotkey: 'Q',
  },
  brood_hollow: {
    id: 'brood_hollow', name: 'Brood Hollow', faction: 'verdant', role: 'Basic unit growth.',
    cost: { ore: 150, flux: 0 }, buildTime: s(44), hp: 800, armor: 1, size: 4, sight: 8, supply: 0,
    trains: ['glimmerwing', 'thornling', 'sporecaster', 'carapace_guard', 'bloom_sage', 'rift_stag', 'crownbeast'], researches: [],
    requires: ['root_node'], tags: ['Armored', 'Biological', 'Structure'], hotkey: 'W',
  },
  flux_siphon: {
    id: 'flux_siphon', name: 'Flux Siphon', faction: 'verdant', role: 'Living extractor grown over a Flux vent.',
    cost: { ore: 75, flux: 0 }, buildTime: s(22), hp: 400, armor: 1, size: 3, sight: 6, supply: 0,
    trains: [], researches: [], requires: [], isExtractor: true, tags: ['Armored', 'Biological', 'Structure'], hotkey: 'E',
  },
  memory_bloom: {
    id: 'memory_bloom', name: 'Memory Bloom', faction: 'verdant', role: 'Technology and upgrades. Unlocks casters and artillery.',
    cost: { ore: 150, flux: 100 }, buildTime: s(48), hp: 700, armor: 1, size: 4, sight: 8, supply: 0,
    trains: [], researches: ['verdant_attack_1', 'verdant_attack_2', 'verdant_attack_3', 'verdant_armor_1', 'verdant_armor_2', 'verdant_armor_3', 'crown_rite'],
    requires: ['brood_hollow'], tags: ['Armored', 'Biological', 'Structure'], hotkey: 'D',
  },
  needle_pod: {
    id: 'needle_pod', name: 'Needle Pod', faction: 'verdant', role: 'Defensive pod. Prioritizes hovering scouts, then closest threats.',
    cost: { ore: 125, flux: 0 }, buildTime: s(30), hp: 380, armor: 1, size: 2, sight: 9, supply: 0,
    trains: [], researches: [], requires: ['brood_hollow'], detector: 8,
    weapon: { kind: 'needle', damage: 9, period: 14, range: 7, projectileSpeed: 26, bonus: { Hover: 8 }, windup: 2, canTargetHover: true },
    tags: ['Armored', 'Biological', 'Structure'], hotkey: 'F',
  },
};

function upgradeLine(f: 'helix' | 'verdant', at: string, names: [string, string]): Record<string, TechDef> {
  const out: Record<string, TechDef> = {};
  const costs = [{ ore: 100, flux: 100 }, { ore: 150, flux: 150 }, { ore: 200, flux: 200 }];
  const times = [s(50), s(60), s(70)];
  const keys = [['Q', 'W', 'E'], ['A', 'S', 'D']];
  (['attack', 'armor'] as const).forEach((kind, ki) => {
    for (let lvl = 1; lvl <= 3; lvl++) {
      const id = `${f}_${kind}_${lvl}`;
      out[id] = {
        id, name: `${names[ki]} ${'I'.repeat(lvl)}`, faction: f, cost: costs[lvl - 1], time: times[lvl - 1], at,
        requires: lvl > 1 ? [`${f}_${kind}_${lvl - 1}`] : [],
        effect: kind === 'attack' ? { attackLevel: lvl } : { armorLevel: lvl },
        description: kind === 'attack'
          ? `Tier ${lvl === 1 ? 1 : 2}: all unit and defense weapons deal +6% damage (cumulative ${lvl * 6}%).`
          : `Tier ${lvl === 1 ? 1 : 2}: all units take 5% less damage (cumulative ${lvl * 5}%).`,
        hotkey: keys[ki][lvl - 1],
      };
    }
  });
  return out;
}

export const TECHS: Record<string, TechDef> = {
  ...upgradeLine('helix', 'signal_foundry', ['Calibrated Munitions', 'Laminate Plating']),
  ...upgradeLine('verdant', 'memory_bloom', ['Barbed Lineage', 'Chitin Memory']),
  aegis_protocol: {
    id: 'aegis_protocol', name: 'Aegis Protocol', faction: 'helix', cost: { ore: 150, flux: 150 }, time: s(55), at: 'signal_foundry',
    requires: [], effect: { unlock: 'aegis_frame' }, description: 'Unlocks the Aegis Frame heavy walker at the Assembly Bay.', hotkey: 'F',
  },
  crown_rite: {
    id: 'crown_rite', name: 'Crown Rite', faction: 'verdant', cost: { ore: 150, flux: 150 }, time: s(55), at: 'memory_bloom',
    requires: [], effect: { unlock: 'crownbeast' }, description: 'Unlocks the Crownbeast at the Brood Hollow.', hotkey: 'F',
  },
};

// Fix hotkeys for tech lines into the command card layout used by the UI (row 1: attack, row 2: armor).
for (const t of Object.values(TECHS)) {
  if (t.effect.attackLevel) t.hotkey = 'Q';
  if (t.effect.armorLevel) t.hotkey = 'W';
  if (t.effect.unlock) t.hotkey = 'E';
}

/** Neutral map objects */
export const NEUTRALS = {
  ore: { name: 'Prism Ore', hp: 1, radius: 0.9 },
  vent: { name: 'Flux Vent', hp: 1, radius: 1.5 },
  barrier: { name: 'Crystal Barrier', hp: 450, armor: 2, size: 3 },
  pylon: { name: 'Watch Pylon', sight: 15, captureTicks: s(3) },
  pod: { name: 'Salvage Pod', ore: 100, flux: 40 },
};
