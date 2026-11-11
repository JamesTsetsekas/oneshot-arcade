import type { EntityDef, FactionDef, UpgradeDef } from './types';

const NONE = '';
export const helixUnits: EntityDef[] = [
  {
    id: 'fabricator', name: 'Fabricator', faction: 'helix', kind: 'unit', role: 'worker',
    desc: 'Mines Prism Ore and Flux, raises structures and repairs mechanical targets. Emergency Weld restores structure HP over 4 s.',
    counter: 'Fragile: raid it with fast units.', tags: ['Light', 'Mechanical'], hp: 45, armor: 0, radius: 0.5, speed: 3.2, sight: 9,
    cost: { ore: 50, flux: 0 }, buildTime: 12, supply: 1, producedBy: 'core_relay', worker: true,
    weapon: { damage: 5, period: 1.5, range: 1.0, targets: 'ground', visual: 'weld' },
    abilities: [{ id: 'weld', name: 'Emergency Weld', hotkey: 'q', target: 'structure', cooldown: 8, range: 2.5, flux: 20, desc: 'Restores 60 structure HP over 4 s. Costs 20 Flux.' }],
    model: 'fabricator',
  },
  {
    id: 'kestrel', name: 'Kestrel', faction: 'helix', kind: 'unit', role: 'scout',
    desc: 'Fast wheeled scout with long sight and a light gun. Sensor Spike plants a short-lived vision beacon that enemies can see.',
    counter: 'Dies to anything that can catch it.', tags: ['Light', 'Mechanical'], hp: 55, armor: 0, radius: 0.55, speed: 6.0, sight: 16,
    cost: { ore: 75, flux: 25 }, buildTime: 14, supply: 1, producedBy: 'assembly_bay',
    weapon: { damage: 3, period: 0.8, range: 5, targets: 'both', projectileSpeed: 40, visual: 'rifle' },
    abilities: [{ id: 'spike', name: 'Sensor Spike', hotkey: 'q', target: 'point', cooldown: 30, range: 12, radius: 8, desc: 'Plant a beacon granting vision (radius 8) for 14 s. Visible to enemies.' }],
    model: 'kestrel',
  },
  {
    id: 'bulwark', name: 'Bulwark', faction: 'helix', kind: 'unit', role: 'basic',
    desc: 'Basic rifle walker. Reliable against light targets. Brace for +2 range at the cost of movement.',
    counter: 'Swarmed by melee Thornlings; slowed by Sporecasters.', tags: ['Mechanical'], hp: 120, armor: 1, radius: 0.7, speed: 3.0, sight: 10,
    cost: { ore: 100, flux: 0 }, buildTime: 18, supply: 2, producedBy: 'assembly_bay',
    weapon: { damage: 9, period: 1.0, range: 6, windup: 0.15, projectileSpeed: 34, bonus: { Light: 4 }, targets: 'both', visual: 'rifle' },
    abilities: [{ id: 'brace', name: 'Brace', hotkey: 'q', target: 'toggle', cooldown: 1, desc: 'Toggle: +2 range, cannot move while braced.' }],
    model: 'bulwark',
  },
  {
    id: 'arc_lancer', name: 'Arc Lancer', faction: 'helix', kind: 'unit', role: 'antiarmor',
    desc: 'Slow anti-armor walker. Its lance overpenetrates one light unit behind the target.',
    counter: 'Countered by fast light swarms.', tags: ['Armored', 'Mechanical'], hp: 105, armor: 1, radius: 0.75, speed: 2.7, sight: 10,
    cost: { ore: 125, flux: 50 }, buildTime: 24, supply: 2, producedBy: 'assembly_bay', requires: ['signal_foundry'],
    weapon: { damage: 24, period: 1.7, range: 7, windup: 0.3, projectileSpeed: 45, bonus: { Armored: 16 }, pierce: true, targets: 'ground', visual: 'lance' },
    model: 'arc_lancer',
  },
  {
    id: 'mender_rig', name: 'Mender Rig', faction: 'helix', kind: 'unit', role: 'support',
    desc: 'Support drone vehicle. Repairs nearby mechanical units using Flux charge; cannot attack.',
    counter: 'Focus it first.', tags: ['Mechanical'], hp: 80, armor: 0, radius: 0.65, speed: 3.4, sight: 10, energy: 100,
    cost: { ore: 75, flux: 50 }, buildTime: 20, supply: 2, producedBy: 'assembly_bay', requires: ['signal_foundry'],
    model: 'mender_rig',
  },
  {
    id: 'mortar_crawler', name: 'Mortar Crawler', faction: 'helix', kind: 'unit', role: 'siege',
    desc: 'Siege unit with minimum range, setup time and a visible shell arc. Excellent against structures.',
    counter: 'Defenseless up close: flank it.', tags: ['Armored', 'Mechanical'], hp: 95, armor: 0, radius: 0.8, speed: 2.4, sight: 10,
    cost: { ore: 150, flux: 75 }, buildTime: 30, supply: 3, producedBy: 'assembly_bay', requires: ['signal_foundry'],
    weapon: { damage: 40, period: 3.2, range: 17, minRange: 5, windup: 0.3, projectileSpeed: 13, splash: 2.2, bonus: { Structure: 28 }, setup: 1.5, targets: 'ground', visual: 'mortar' },
    model: 'mortar_crawler',
  },
  {
    id: 'aegis_frame', name: 'Aegis Frame', faction: 'helix', kind: 'unit', role: 'heavy',
    desc: 'Late heavy walker. A directional shield blocks up to 160 frontal projectile damage and recharges out of combat.',
    counter: 'Flank it; Arc Lancers pierce its armor.', tags: ['Armored', 'Massive', 'Mechanical'], hp: 400, armor: 3, radius: 0.95, speed: 2.4, sight: 10, shield: 160,
    cost: { ore: 250, flux: 125 }, buildTime: 40, supply: 5, producedBy: 'assembly_bay', requires: ['signal_foundry', 'heavy_chassis'],
    weapon: { damage: 20, period: 1.4, range: 6.5, windup: 0.2, projectileSpeed: 30, targets: 'both', visual: 'rifle' },
    model: 'aegis_frame',
  },
];

export const helixStructures: EntityDef[] = [
  {
    id: 'core_relay', name: 'Core Relay', faction: 'helix', kind: 'structure', role: 'hall',
    desc: 'Headquarters and resource drop-off. Trains Fabricators. Lose every Core Relay and the match is lost.',
    counter: NONE, tags: ['Structure', 'Armored'], hp: 1500, armor: 2, radius: 2.5, speed: 0, sight: 13,
    cost: { ore: 400, flux: 0 }, buildTime: 70, supply: 0, supplyProvided: 10, size: 5, isHall: true, field: 15, produces: ['fabricator'], model: 'core_relay',
  },
  {
    id: 'grid_pylon', name: 'Grid Pylon', faction: 'helix', kind: 'structure', role: 'supply',
    desc: 'Provides 8 supply and a construction field of radius 10.',
    counter: NONE, tags: ['Structure', 'Armored'], hp: 350, armor: 1, radius: 1, speed: 0, sight: 8,
    cost: { ore: 100, flux: 0 }, buildTime: 20, supply: 0, supplyProvided: 8, size: 2, field: 10, model: 'grid_pylon',
  },
  {
    id: 'assembly_bay', name: 'Assembly Bay', faction: 'helix', kind: 'structure', role: 'production',
    desc: 'Basic unit production: Kestrels, Bulwarks; advanced units once a Signal Foundry stands.',
    counter: NONE, tags: ['Structure', 'Armored'], hp: 650, armor: 1, radius: 1.5, speed: 0, sight: 9,
    cost: { ore: 150, flux: 0 }, buildTime: 35, supply: 0, size: 3, produces: ['kestrel', 'bulwark', 'arc_lancer', 'mender_rig', 'mortar_crawler', 'aegis_frame'], model: 'assembly_bay',
  },
  {
    id: 'signal_foundry', name: 'Signal Foundry', faction: 'helix', kind: 'structure', role: 'tech',
    desc: 'Advanced technology and upgrades. Unlocks Arc Lancers, Mender Rigs and Mortar Crawlers.',
    counter: NONE, tags: ['Structure', 'Armored'], hp: 700, armor: 1, radius: 1.5, speed: 0, sight: 9,
    cost: { ore: 150, flux: 100 }, buildTime: 45, supply: 0, size: 3, requires: ['assembly_bay'],
    researches: ['piercing_rounds_1', 'piercing_rounds_2', 'piercing_rounds_3', 'plate_lamination_1', 'plate_lamination_2', 'plate_lamination_3', 'heavy_chassis'], model: 'signal_foundry',
  },
  {
    id: 'flux_tap', name: 'Flux Tap', faction: 'helix', kind: 'structure', role: 'tap',
    desc: 'Extracts Flux from a vent. Fabricators haul the Flux back to a Core Relay.',
    counter: NONE, tags: ['Structure', 'Armored'], hp: 450, armor: 1, radius: 1.5, speed: 0, sight: 7,
    cost: { ore: 75, flux: 0 }, buildTime: 25, supply: 0, size: 3, onVent: true, model: 'flux_tap',
  },
  {
    id: 'sentry_arc', name: 'Sentry Arc', faction: 'helix', kind: 'structure', role: 'defense',
    desc: 'Short-range defense turret. Fires only inside its visible forward cone.',
    counter: 'Outrange it with Mortar Crawlers or flank it.', tags: ['Structure', 'Armored'], hp: 450, armor: 1, radius: 1, speed: 0, sight: 10,
    cost: { ore: 125, flux: 0 }, buildTime: 28, supply: 0, size: 2, requires: ['assembly_bay'], turret: true,
    weapon: { damage: 11, period: 0.9, range: 8.5, targets: 'both', cone: 0.95, visual: 'arc', projectileSpeed: 0 }, model: 'sentry_arc',
  },
];

export const helixUpgrades: UpgradeDef[] = [
  ...[1, 2, 3].map((n): UpgradeDef => ({
    id: `piercing_rounds_${n}`, name: `Piercing Rounds ${'I'.repeat(n)}`, desc: '+8% damage for all Directorate weapons.', faction: 'helix',
    cost: { ore: 75 + 75 * n, flux: 75 + 50 * n }, time: 30 + 20 * n, at: 'signal_foundry', requires: n > 1 ? [`piercing_rounds_${n - 1}`] : [],
    effect: { kind: 'attack', amount: 0.08 },
  })),
  ...[1, 2, 3].map((n): UpgradeDef => ({
    id: `plate_lamination_${n}`, name: `Plate Lamination ${'I'.repeat(n)}`, desc: '+1 armor for all Directorate units.', faction: 'helix',
    cost: { ore: 75 + 75 * n, flux: 75 + 50 * n }, time: 30 + 20 * n, at: 'signal_foundry', requires: n > 1 ? [`plate_lamination_${n - 1}`] : [],
    effect: { kind: 'armor', amount: 1 },
  })),
  { id: 'heavy_chassis', name: 'Heavy Chassis', desc: 'Unlocks the Aegis Frame.', faction: 'helix', cost: { ore: 150, flux: 150 }, time: 50, at: 'signal_foundry', effect: { kind: 'unlock', amount: 1, key: 'heavy_chassis' } },
];

export const helixFaction: FactionDef = {
  id: 'helix', name: 'Helix Directorate', tagline: 'Durable firing lines. Positional setup.',
  blurb: 'Industrial expeditionaries with modular walkers and field engineering. Fabricators must stay at the work site to build, but every unit is sturdy and structures can be repaired. Win by holding ground with braced rifles, lances and shelling.',
  accent: '#ffb347', buildMode: 'attend', buildTimeMult: 1,
  worker: 'fabricator', scout: 'kestrel', hall: 'core_relay', supply: 'grid_pylon', tap: 'flux_tap', defense: 'sentry_arc', basicProd: 'assembly_bay', tech: 'signal_foundry',
  units: ['fabricator', 'kestrel', 'bulwark', 'arc_lancer', 'mender_rig', 'mortar_crawler', 'aegis_frame'],
  structures: ['core_relay', 'grid_pylon', 'assembly_bay', 'signal_foundry', 'flux_tap', 'sentry_arc'],
  upgrades: helixUpgrades.map((u) => u.id),
  traits: ['Fabricators stay on site until construction finishes', 'Workers repair structures and mechanical units', 'Sturdier units, higher cost per supply'],
  composition: [{ id: 'bulwark', weight: 5 }, { id: 'arc_lancer', weight: 2.5 }, { id: 'mortar_crawler', weight: 1.2 }, { id: 'mender_rig', weight: 0.8 }, { id: 'aegis_frame', weight: 1.5 }, { id: 'kestrel', weight: 0.3 }],
};
