import type { EntityDef, FactionDef, UpgradeDef } from './types';

const NONE = '';
export const verdantUnits: EntityDef[] = [
  {
    id: 'tender', name: 'Tender', faction: 'verdant', kind: 'unit', role: 'worker',
    desc: 'Harvests and germinates structures: plant a seed and it grows on its own. Rootstep jumps to another friendly grove.',
    counter: 'Fragile: raid it with fast units.', tags: ['Light', 'Biological'], hp: 40, armor: 0, radius: 0.5, speed: 3.4, sight: 9,
    cost: { ore: 50, flux: 0 }, buildTime: 12, supply: 1, producedBy: 'heartgrove', worker: true,
    weapon: { damage: 4, period: 1.4, range: 1.0, targets: 'ground', visual: 'claw' },
    abilities: [{ id: 'rootstep', name: 'Rootstep', hotkey: 'q', target: 'grove', cooldown: 25, range: 999, desc: 'Channel 1 s, then emerge at another friendly Heartgrove or Root Node.' }],
    model: 'tender',
  },
  {
    id: 'glimmerwing', name: 'Glimmerwing', faction: 'verdant', kind: 'unit', role: 'scout',
    desc: 'Hovering scout with excellent sight and no attack. Ignores terrain, and ground-only weapons cannot hit it.',
    counter: 'Needle Pods and Bulwarks shoot it down.', tags: ['Light', 'Biological', 'Hover'], hp: 45, armor: 0, radius: 0.55, speed: 6.5, sight: 17,
    cost: { ore: 75, flux: 25 }, buildTime: 14, supply: 1, producedBy: 'brood_hollow', hover: true,
    model: 'glimmerwing',
  },
  {
    id: 'thornling', name: 'Thornling', faction: 'verdant', kind: 'unit', role: 'basic',
    desc: 'Cheap melee screen. Gains speed near damaged enemies.',
    counter: 'Splash damage and ranged kiting.', tags: ['Light', 'Biological'], hp: 62, armor: 0, radius: 0.5, speed: 4.0, sight: 9,
    cost: { ore: 50, flux: 0 }, buildTime: 12, supply: 1, producedBy: 'brood_hollow',
    weapon: { damage: 9, period: 0.8, range: 1.1, windup: 0.1, targets: 'ground', visual: 'thorn' },
    model: 'thornling',
  },
  {
    id: 'sporecaster', name: 'Sporecaster', faction: 'verdant', kind: 'unit', role: 'ranged',
    desc: 'Ranged skirmisher. Its spores apply a short, non-stacking slow.',
    counter: 'Dives from fast melee units.', tags: ['Light', 'Biological'], hp: 70, armor: 0, radius: 0.6, speed: 3.3, sight: 10,
    cost: { ore: 90, flux: 25 }, buildTime: 20, supply: 2, producedBy: 'brood_hollow',
    weapon: { damage: 9, period: 1.3, range: 7.5, windup: 0.2, projectileSpeed: 20, slow: { factor: 0.7, duration: 1.5 }, targets: 'both', visual: 'spore' },
    model: 'sporecaster',
  },
  {
    id: 'carapace_guard', name: 'Carapace Guard', faction: 'verdant', kind: 'unit', role: 'antiarmor',
    desc: 'Anti-ranged tank. Curl up to halve ranged damage, but it cannot move or attack while curled.',
    counter: 'Armor-piercing lances and siege.', tags: ['Armored', 'Biological'], hp: 250, armor: 2, radius: 0.8, speed: 2.9, sight: 10,
    cost: { ore: 125, flux: 25 }, buildTime: 24, supply: 2, producedBy: 'brood_hollow', requires: ['memory_bloom'],
    weapon: { damage: 12, period: 1.2, range: 1.4, windup: 0.15, bonus: { Mechanical: 6 }, targets: 'ground', visual: 'claw' },
    abilities: [{ id: 'curl', name: 'Curl', hotkey: 'q', target: 'toggle', cooldown: 1, desc: 'Toggle: -50% ranged damage taken; immobile and unarmed.' }],
    model: 'carapace_guard',
  },
  {
    id: 'bloom_sage', name: 'Bloom Sage', faction: 'verdant', kind: 'unit', role: 'support',
    desc: 'Support caster. Mend Spores heal Biological allies; Silence Patch telegraphs a zone that shuts down abilities.',
    counter: 'Focus it first.', tags: ['Light', 'Biological'], hp: 80, armor: 0, radius: 0.6, speed: 3.3, sight: 10, energy: 100,
    cost: { ore: 100, flux: 75 }, buildTime: 24, supply: 2, producedBy: 'brood_hollow', requires: ['memory_bloom'],
    abilities: [{ id: 'silence', name: 'Silence Patch', hotkey: 'q', target: 'point', cooldown: 20, range: 9, radius: 3.2, energy: 40, desc: 'After a 1 s telegraph, silences enemy units in the patch for 5 s.' }],
    model: 'bloom_sage',
  },
  {
    id: 'rift_stag', name: 'Rift Stag', faction: 'verdant', kind: 'unit', role: 'siege',
    desc: 'Mobile artillery that fires delayed ground eruptions. Weak if engaged.',
    counter: 'Dive it; its eruptions are slow to land.', tags: ['Biological'], hp: 120, armor: 0, radius: 0.85, speed: 3.8, sight: 10,
    cost: { ore: 175, flux: 100 }, buildTime: 32, supply: 3, producedBy: 'brood_hollow', requires: ['memory_bloom'],
    weapon: { damage: 34, period: 3.0, range: 13, minRange: 4, windup: 0.4, delayed: 1.1, splash: 2.4, bonus: { Structure: 14 }, targets: 'ground', visual: 'stag' },
    model: 'rift_stag',
  },
  {
    id: 'crownbeast', name: 'Crownbeast', faction: 'verdant', kind: 'unit', role: 'heavy',
    desc: 'Late assault beast that cleaves enemies and projects a regeneration aura to nearby Biological allies outside combat.',
    counter: 'Kite it with ranged units.', tags: ['Massive', 'Biological'], hp: 480, armor: 2, radius: 1.0, speed: 3.0, sight: 10,
    cost: { ore: 300, flux: 150 }, buildTime: 44, supply: 6, producedBy: 'brood_hollow', requires: ['memory_bloom', 'crown_rites'],
    weapon: { damage: 30, period: 1.6, range: 1.8, windup: 0.3, splash: 1.6, targets: 'ground', visual: 'beast' },
    model: 'crownbeast',
  },
];

export const verdantStructures: EntityDef[] = [
  {
    id: 'heartgrove', name: 'Heartgrove', faction: 'verdant', kind: 'structure', role: 'hall',
    desc: 'Headquarters and resource drop-off. Grows Tenders. Lose every Heartgrove and the match is lost.',
    counter: NONE, tags: ['Structure', 'Armored', 'Biological'], hp: 1400, armor: 1, radius: 2.5, speed: 0, sight: 13, regen: 0.6,
    cost: { ore: 400, flux: 0 }, buildTime: 70, supply: 0, supplyProvided: 10, size: 5, isHall: true, field: 15, produces: ['tender'], model: 'heartgrove',
  },
  {
    id: 'root_node', name: 'Root Node', faction: 'verdant', kind: 'structure', role: 'supply',
    desc: 'Provides 8 supply and extends the living build zone (radius 10).',
    counter: NONE, tags: ['Structure', 'Biological'], hp: 300, armor: 1, radius: 1, speed: 0, sight: 8, regen: 0.6,
    cost: { ore: 75, flux: 0 }, buildTime: 18, supply: 0, supplyProvided: 8, size: 2, field: 10, model: 'root_node',
  },
  {
    id: 'brood_hollow', name: 'Brood Hollow', faction: 'verdant', kind: 'structure', role: 'production',
    desc: 'Grows Glimmerwings, Thornlings and Sporecasters; advanced units once a Memory Bloom flowers.',
    counter: NONE, tags: ['Structure', 'Armored', 'Biological'], hp: 550, armor: 1, radius: 1.5, speed: 0, sight: 9, regen: 0.6,
    cost: { ore: 150, flux: 0 }, buildTime: 32, supply: 0, size: 3, produces: ['thornling', 'glimmerwing', 'sporecaster', 'carapace_guard', 'bloom_sage', 'rift_stag', 'crownbeast'], model: 'brood_hollow',
  },
  {
    id: 'memory_bloom', name: 'Memory Bloom', faction: 'verdant', kind: 'structure', role: 'tech',
    desc: 'Technology and upgrades. Unlocks Carapace Guards, Bloom Sages and Rift Stags.',
    counter: NONE, tags: ['Structure', 'Armored', 'Biological'], hp: 600, armor: 1, radius: 1.5, speed: 0, sight: 9, regen: 0.6,
    cost: { ore: 150, flux: 100 }, buildTime: 40, supply: 0, size: 3, requires: ['brood_hollow'],
    researches: ['barbed_growth_1', 'barbed_growth_2', 'barbed_growth_3', 'chitin_layers_1', 'chitin_layers_2', 'chitin_layers_3', 'crown_rites'], model: 'memory_bloom',
  },
  {
    id: 'flux_tap_v', name: 'Flux Tap', faction: 'verdant', kind: 'structure', role: 'tap',
    desc: 'A grown siphon that extracts Flux from a vent. Tenders haul the Flux back to a Heartgrove.',
    counter: NONE, tags: ['Structure', 'Biological'], hp: 400, armor: 1, radius: 1.5, speed: 0, sight: 7, regen: 0.6,
    cost: { ore: 75, flux: 0 }, buildTime: 25, supply: 0, size: 3, onVent: true, model: 'flux_tap_v',
  },
  {
    id: 'needle_pod', name: 'Needle Pod', faction: 'verdant', kind: 'structure', role: 'defense',
    desc: 'Defensive pod that prioritises hovering scouts, then the closest threat.',
    counter: 'Outrange it with Rift Stags and siege.', tags: ['Structure', 'Biological'], hp: 380, armor: 1, radius: 1, speed: 0, sight: 10, regen: 0.6,
    cost: { ore: 100, flux: 0 }, buildTime: 24, supply: 0, size: 2, requires: ['brood_hollow'], turret: true,
    weapon: { damage: 9, period: 0.7, range: 9, targets: 'both', hoverFirst: true, projectileSpeed: 36, visual: 'needle' }, model: 'needle_pod',
  },
];

export const verdantUpgrades: UpgradeDef[] = [
  ...[1, 2, 3].map((n): UpgradeDef => ({
    id: `barbed_growth_${n}`, name: `Barbed Growth ${'I'.repeat(n)}`, desc: '+8% damage for all Chorus weapons.', faction: 'verdant',
    cost: { ore: 75 + 75 * n, flux: 75 + 50 * n }, time: 30 + 20 * n, at: 'memory_bloom', requires: n > 1 ? [`barbed_growth_${n - 1}`] : [],
    effect: { kind: 'attack', amount: 0.08 },
  })),
  ...[1, 2, 3].map((n): UpgradeDef => ({
    id: `chitin_layers_${n}`, name: `Chitin Layers ${'I'.repeat(n)}`, desc: '+1 armor for all Chorus units.', faction: 'verdant',
    cost: { ore: 75 + 75 * n, flux: 75 + 50 * n }, time: 30 + 20 * n, at: 'memory_bloom', requires: n > 1 ? [`chitin_layers_${n - 1}`] : [],
    effect: { kind: 'armor', amount: 1 },
  })),
  { id: 'crown_rites', name: 'Crown Rites', desc: 'Unlocks the Crownbeast.', faction: 'verdant', cost: { ore: 150, flux: 150 }, time: 50, at: 'memory_bloom', effect: { kind: 'unlock', amount: 1, key: 'crown_rites' } },
];

export const verdantFaction: FactionDef = {
  id: 'verdant', name: 'Verdant Chorus', tagline: 'Mobility. Regeneration. Encirclement.',
  blurb: 'A bio-synthetic ecology grown from seed organisms. Tenders plant structures that then grow on their own, so workers stay productive. Cheaper, faster, more fragile units that regenerate; win by surrounding and overwhelming.',
  accent: '#b57bff', buildMode: 'seed', buildTimeMult: 1.1,
  worker: 'tender', scout: 'glimmerwing', hall: 'heartgrove', supply: 'root_node', tap: 'flux_tap_v', defense: 'needle_pod', basicProd: 'brood_hollow', tech: 'memory_bloom',
  units: ['tender', 'glimmerwing', 'thornling', 'sporecaster', 'carapace_guard', 'bloom_sage', 'rift_stag', 'crownbeast'],
  structures: ['heartgrove', 'root_node', 'brood_hollow', 'memory_bloom', 'flux_tap_v', 'needle_pod'],
  upgrades: verdantUpgrades.map((u) => u.id),
  traits: ['Structures grow on their own once seeded: Tenders are freed at once', 'Units and structures regenerate out of combat', 'Cheaper, faster, more fragile units'],
  composition: [{ id: 'thornling', weight: 4 }, { id: 'sporecaster', weight: 3 }, { id: 'carapace_guard', weight: 2 }, { id: 'rift_stag', weight: 1.2 }, { id: 'bloom_sage', weight: 0.7 }, { id: 'crownbeast', weight: 1.5 }, { id: 'glimmerwing', weight: 0.3 }],
};
