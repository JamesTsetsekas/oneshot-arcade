// shared-content: hero and ability definitions. Pure data — the simulation implements the behaviour
// in src/sim/abilities.ts, and every tooltip in the UI is generated from these numbers.

export type TargetMode = 'direction' | 'point' | 'unit' | 'ally' | 'self';
export type AbilityShape = 'line' | 'cone' | 'circle' | 'rect' | 'none';

export interface AbilityDef {
  id: string;
  name: string;
  key: 'Q' | 'W' | 'E' | 'R';
  target: TargetMode;
  shape: AbilityShape;
  range: number;
  width?: number; // line / rect width
  radius?: number; // circle radius at the target point
  arc?: number; // cone total arc in degrees
  cost: number[];
  cd: number[];
  castTime: number;
  vals: Record<string, number[] | number>;
  desc: string;
  ult?: boolean;
  /** which targets a unit-targeted ability accepts */
  unitFilter?: 'enemy' | 'enemyHero' | 'ally';
}

export interface HeroDef {
  id: HeroId;
  name: string;
  title: string;
  roles: string[];
  difficulty: 1 | 2 | 3;
  blurb: string;
  resource: 'Mana' | 'Energy';
  color: number; // signature colour used by icons, VFX and the model
  accent: number;
  melee: boolean;
  base: {
    hp: number;
    hpPer: number;
    mana: number;
    manaPer: number;
    hpRegen: number;
    manaRegen: number;
    ad: number;
    adPer: number;
    as: number;
    asPer: number; // % per level
    armor: number;
    armorPer: number;
    ward: number;
    wardPer: number;
    speed: number;
    range: number;
    radius: number;
    windup: number; // fraction of the attack period spent winding up
    missileSpeed: number; // 0 for melee
  };
  passive: { name: string; desc: string };
  abilities: [AbilityDef, AbilityDef, AbilityDef, AbilityDef];
  /** Bot / recommendation build graph: two build directions plus adaptive defence picks. */
  builds: {
    starter: string;
    lane: 'lane' | 'jungle' | 'support';
    paths: { name: string; why: string; items: string[] }[];
    vsPhysical: string;
    vsArcane: string;
    skillOrder: number[]; // ability slot priority for auto-levelling (bots)
  };
}

export type HeroId = 'brannoch' | 'suri' | 'oru' | 'kesh' | 'ilyra' | 'vey';

export const HEROES: Record<HeroId, HeroDef> = {
  brannoch: {
    id: 'brannoch',
    name: 'Brannoch',
    title: 'Bastion Mason',
    roles: ['Vanguard', 'Tank'],
    difficulty: 1,
    blurb: 'A walking keystone. Starts fights, walls off escapes and gets sturdier the longer he stands in your face.',
    resource: 'Mana',
    color: 0xc9a25a,
    accent: 0x8fd0ff,
    melee: true,
    base: { hp: 720, hpPer: 88, mana: 280, manaPer: 30, hpRegen: 2.4, manaRegen: 2.0, ad: 62, adPer: 3.5, as: 0.7, asPer: 2, armor: 30, armorPer: 3.6, ward: 26, wardPer: 2.0, speed: 3.5, range: 1.7, radius: 0.65, windup: 0.28, missileSpeed: 0 },
    passive: { name: 'Set in Stone', desc: 'After standing within 6 m of an enemy hero for 3 s, Brannoch gains a stack of +{armor} armor and ward every 1.5 s (max 4). Stacks crumble 3 s after no enemy hero is near.' },
    abilities: [
      { id: 'fault_hammer', name: 'Fault Hammer', key: 'Q', target: 'direction', shape: 'cone', range: 5, arc: 70, cost: [40, 45, 50, 55], cd: [8, 7.5, 7, 6.5], castTime: 0.3, vals: { dmg: [60, 95, 130, 165], ad: 0.6, slow: 35, stun: [0.5, 0.6, 0.7, 0.8] }, desc: 'Slam a frontal cone for {dmg} (+60% AD) physical damage. The outer edge slows by {slow}% for 1.5 s; the inner half staggers, stunning for {stun} s.' },
      { id: 'rampart_fold', name: 'Rampart Fold', key: 'W', target: 'point', shape: 'circle', range: 6.5, radius: 2.6, cost: [60, 60, 60, 60], cd: [18, 17, 16, 15], castTime: 0.15, vals: { hp: [220, 300, 380, 460], dur: 3 }, desc: 'Raise a curved stone wall for {dur} s. It blocks enemy movement and projectiles, has {hp} health and can be broken.' },
      { id: 'anchor_line', name: 'Anchor Line', key: 'E', target: 'point', shape: 'none', range: 9, cost: [50, 50, 50, 50], cd: [14, 13, 12, 11], castTime: 0, vals: { shield: [60, 90, 120, 150], window: 4 }, desc: 'Tether to an allied hero or a patch of terrain. Recast within {window} s to haul Brannoch to the anchor and gain a {shield} shield for 2.5 s.' },
      { id: 'citybreaker', name: 'Citybreaker', key: 'R', target: 'point', shape: 'circle', range: 13, radius: 4, cost: [100, 100], cd: [90, 70], castTime: 0.75, vals: { dmg: [150, 260], ad: 0.5, air: 1.0 }, desc: 'Wind up, then leap to the target area, dealing {dmg} (+50% AD) physical damage and knocking enemies airborne for {air} s. The landing zone is telegraphed to everyone.', ult: true },
    ],
    builds: {
      starter: 'masons_chisel',
      lane: 'lane',
      paths: [
        { name: 'Unbreakable', why: 'Maximum frontline: armor and health so the team can fight around you.', items: ['trail_boots', 'kilnheart_plate', 'ironroot_greaves', 'mistward_mantle', 'stonewake_girdle', 'null_bell'] },
        { name: 'Quarry Bruiser', why: 'Trade some bulk for damage when your team already has a tank.', items: ['trail_boots', 'rivenwright_maul', 'ironroot_greaves', 'kilnheart_plate', 'tidecaller_glaive', 'mistward_mantle'] },
      ],
      vsPhysical: 'kilnheart_plate',
      vsArcane: 'mistward_mantle',
      skillOrder: [0, 2, 1],
    },
  },
  suri: {
    id: 'suri',
    name: 'Suri Vale',
    title: 'Ember Courier',
    roles: ['Marksman', 'Skirmisher'],
    difficulty: 2,
    blurb: 'Never stops moving. Kites with charged shots, banks bolts off walls and ends fights from half a lane away.',
    resource: 'Mana',
    color: 0xff8a3c,
    accent: 0xffd27a,
    melee: false,
    base: { hp: 540, hpPer: 72, mana: 300, manaPer: 32, hpRegen: 1.6, manaRegen: 2.2, ad: 56, adPer: 3.3, as: 0.78, asPer: 2.8, armor: 20, armorPer: 3.0, ward: 22, wardPer: 1.2, speed: 3.6, range: 6.5, radius: 0.5, windup: 0.22, missileSpeed: 22 },
    passive: { name: 'Hot Route', desc: 'Moving charges Suri\'s next basic attack (full after 8 m). A charged attack deals up to {bonus} (+25% AD) bonus arcane damage. Standing still and firing spends the charge without rebuilding it.' },
    abilities: [
      { id: 'ricochet_bolt', name: 'Ricochet Bolt', key: 'Q', target: 'direction', shape: 'line', range: 11, width: 0.9, cost: [40, 45, 50, 55], cd: [7, 6.5, 6, 5.5], castTime: 0.18, vals: { dmg: [70, 110, 150, 190], ad: 0.7 }, desc: 'Fire a bolt that hits the first enemy for {dmg} (+70% AD) physical damage. It ricochets once off terrain — the aim line previews the bounce.' },
      { id: 'slipstream', name: 'Slipstream', key: 'W', target: 'direction', shape: 'line', range: 5, width: 2.2, cost: [50, 50, 50, 50], cd: [14, 13, 12, 11], castTime: 0, vals: { speed: [30, 35, 40, 45], dur: 4 }, desc: 'Dash 5 m, leaving a slipstream for {dur} s. Each ally who touches it once gains {speed}% move speed for 2 s.' },
      { id: 'parcel_charge', name: 'Parcel Charge', key: 'E', target: 'unit', unitFilter: 'enemy', shape: 'none', range: 7, cost: [50, 55, 60, 65], cd: [11, 10, 9, 8], castTime: 0.1, vals: { dmg: [70, 110, 150, 190], ad: 0.4, ap: 0.5, fuse: 4 }, desc: 'Stick a charge to an enemy. After {fuse} s it detonates for {dmg} (+40% AD) (+50% AP) arcane damage in a small area. Each of Suri\'s basic attacks on the carrier shortens the fuse by 1 s.' },
      { id: 'redline_delivery', name: 'Redline Delivery', key: 'R', target: 'direction', shape: 'line', range: 40, width: 1.6, cost: [100, 100], cd: [80, 65], castTime: 1.0, vals: { dmg: [150, 250], ad: 0.8 }, desc: 'Channel for 1 s (revealing Suri), then fire down a long corridor. It pierces minions and stops on the first hero for {dmg} (+80% AD) physical damage, increased by up to 100% with distance travelled.', ult: true },
    ],
    builds: {
      starter: 'couriers_satchel',
      lane: 'lane',
      paths: [
        { name: 'Rapid Courier', why: 'Attack speed and on-hit pressure for long fights.', items: ['trail_boots', 'sunspoke_bow', 'riverglass_boots', 'cinderfang', 'tidecaller_glaive', 'rivenwright_maul'] },
        { name: 'Long Haul', why: 'Big single shots: Ricochet Bolt and Redline hit harder.', items: ['trail_boots', 'rivenwright_maul', 'riverglass_boots', 'cinderfang', 'sunspoke_bow', 'mistward_mantle'] },
      ],
      vsPhysical: 'kilnheart_plate',
      vsArcane: 'mistward_mantle',
      skillOrder: [0, 2, 1],
    },
  },
  oru: {
    id: 'oru',
    name: 'Oru',
    title: 'Choir of Moths',
    roles: ['Support', 'Controller'],
    difficulty: 2,
    blurb: 'A lantern-swarm that shields friends, smothers enemy vision and turns a fight with one sweeping migration.',
    resource: 'Mana',
    color: 0x9be7d8,
    accent: 0xf3e6a8,
    melee: false,
    base: { hp: 520, hpPer: 68, mana: 380, manaPer: 40, hpRegen: 1.6, manaRegen: 2.8, ad: 46, adPer: 2.5, as: 0.68, asPer: 1.6, armor: 18, armorPer: 2.8, ward: 24, wardPer: 1.4, speed: 3.6, range: 5.8, radius: 0.5, windup: 0.25, missileSpeed: 16 },
    passive: { name: 'Shared Wing', desc: 'When a shield Oru granted expires unbroken, {pct}% of what remains returns to the ally as health.' },
    abilities: [
      { id: 'luminous_swarm', name: 'Luminous Swarm', key: 'Q', target: 'direction', shape: 'line', range: 10, width: 1.8, cost: [45, 50, 55, 60], cd: [7, 6.5, 6, 5.5], castTime: 0.15, vals: { dmg: [60, 95, 130, 165], ap: 0.6, shield: [60, 90, 120, 150], sap: 0.5 }, desc: 'Send a slow swarm. It damages the first enemy for {dmg} (+60% AP) arcane, or shields the first allied hero for {shield} (+50% AP) for 3 s.' },
      { id: 'hush_field', name: 'Hush Field', key: 'W', target: 'point', shape: 'circle', range: 9, radius: 4.5, cost: [60, 60, 60, 60], cd: [20, 18, 16, 14], castTime: 0.1, vals: { dur: 5, vision: 4, slow: [12, 16, 20, 24] }, desc: 'Blanket an area for {dur} s. Enemies inside see only {vision} m, hear muffled audio and are slowed {slow}%. Telegraphs are never hidden.' },
      { id: 'guiding_draft', name: 'Guiding Draft', key: 'E', target: 'ally', unitFilter: 'ally', shape: 'none', range: 8, cost: [40, 40, 40, 40], cd: [12, 11, 10, 9], castTime: 0, vals: { speed: [30, 35, 40, 45], reveal: 4 }, desc: 'An ally (or Oru) gains {speed}% move speed for 2.5 s. Their next ability hit on an enemy hero marks it, revealing it to your team for {reveal} s.' },
      { id: 'night_migration', name: 'Night Migration', key: 'R', target: 'direction', shape: 'rect', range: 16, width: 9, cost: [100, 100], cd: [100, 80], castTime: 0.4, vals: { shield: [120, 200], sap: 0.6, dmg: [60, 110], root: 1.2 }, desc: 'Release a wide wave of moths. Allies it passes gain a {shield} (+60% AP) shield; enemies struck by its leading edge take {dmg} arcane damage and are rooted for {root} s.', ult: true },
    ],
    builds: {
      starter: 'moth_lantern',
      lane: 'support',
      paths: [
        { name: 'Lantern Keeper', why: 'Bigger shields, more vision, and a cleanse for your carry.', items: ['trail_boots', 'beacon_loom', 'riverglass_boots', 'null_bell', 'mistward_mantle', 'quiet_index'] },
        { name: 'Swarm Caller', why: 'Ability power so Luminous Swarm and Night Migration hurt.', items: ['trail_boots', 'quiet_index', 'riverglass_boots', 'wickfire_censer', 'aetherlens', 'beacon_loom'] },
      ],
      vsPhysical: 'kilnheart_plate',
      vsArcane: 'null_bell',
      skillOrder: [0, 2, 1],
    },
  },
  kesh: {
    id: 'kesh',
    name: 'Kesh',
    title: 'Mirebound',
    roles: ['Fighter', 'Jungler'],
    difficulty: 2,
    blurb: 'A patient marsh hunter. Clears camps fast, burrows through the mistwood and drowns skirmishes in his fen.',
    resource: 'Mana',
    color: 0x6fbf5a,
    accent: 0xc9e27a,
    melee: true,
    base: { hp: 640, hpPer: 84, mana: 260, manaPer: 28, hpRegen: 2.2, manaRegen: 2.0, ad: 64, adPer: 3.6, as: 0.74, asPer: 2.4, armor: 27, armorPer: 3.3, ward: 24, wardPer: 1.8, speed: 3.75, range: 1.8, radius: 0.6, windup: 0.25, missileSpeed: 0 },
    passive: { name: "Predator's Patience", desc: 'Damaging a monster or hero marks it for 6 s. Basic attacks on a marked target heal Kesh for {heal} (+3% missing health), once every 4 s.' },
    abilities: [
      { id: 'reed_cleaver', name: 'Reed Cleaver', key: 'Q', target: 'direction', shape: 'cone', range: 4.2, arc: 100, cost: [30, 35, 40, 45], cd: [7, 6.5, 6, 5.5], castTime: 0.15, vals: { dmg: [40, 65, 90, 115], ad: 0.5, missing: 8 }, desc: 'Two sweeping cuts in a cone, each dealing {dmg} (+50% AD) physical damage. The second also deals {missing}% of the target\'s missing health (max 150 vs monsters).' },
      { id: 'bogskin', name: 'Bogskin', key: 'W', target: 'self', shape: 'circle', range: 0, radius: 4, cost: [50, 50, 50, 50], cd: [16, 15, 14, 13], castTime: 0, vals: { dr: [30, 35, 40, 45], dur: 2.5 }, desc: 'Harden for {dur} s, reducing damage taken by {dr}%. When it ends, nearby enemies are slowed 20–60% for 2 s, scaling with the damage absorbed.' },
      { id: 'sinkstep', name: 'Sinkstep', key: 'E', target: 'direction', shape: 'line', range: 5.5, width: 1.2, cost: [40, 40, 40, 40], cd: [14, 13, 12, 11], castTime: 0, vals: { as: [40, 50, 60, 70] }, desc: 'Burrow 5.5 m — straight through brush and thin walls — and surface with {as}% attack speed for 3 s.' },
      { id: 'fen_claim', name: 'Fen Claim', key: 'R', target: 'point', shape: 'circle', range: 6, radius: 7, cost: [100, 100], cd: [95, 75], castTime: 0.3, vals: { slow: [25, 35], dps: [20, 35], dur: 6 }, desc: 'Flood an area for {dur} s. Kesh moves 30% faster inside; enemies are slowed {slow}%, take {dps} arcane damage per second and leave wakes that reveal them — even in brush.', ult: true },
    ],
    builds: {
      starter: 'reedcutters_fang',
      lane: 'jungle',
      paths: [
        { name: 'Marsh Stalker', why: 'Sustain and attack speed to duel and clear.', items: ['trail_boots', 'tidecaller_glaive', 'ironroot_greaves', 'rivenwright_maul', 'kilnheart_plate', 'mistward_mantle'] },
        { name: 'Bog Warden', why: 'Front-line build: stay inside Fen Claim forever.', items: ['trail_boots', 'kilnheart_plate', 'ironroot_greaves', 'stonewake_girdle', 'tidecaller_glaive', 'mistward_mantle'] },
      ],
      vsPhysical: 'kilnheart_plate',
      vsArcane: 'mistward_mantle',
      skillOrder: [0, 2, 1],
    },
  },
  ilyra: {
    id: 'ilyra',
    name: 'Ilyra Quill',
    title: 'Archive Exile',
    roles: ['Mage', 'Artillery'],
    difficulty: 3,
    blurb: 'Writes enemies out of the fight from range. Layers three different spells on a target to trigger a burst.',
    resource: 'Mana',
    color: 0xb48cff,
    accent: 0xf2e8ff,
    melee: false,
    base: { hp: 500, hpPer: 66, mana: 400, manaPer: 42, hpRegen: 1.4, manaRegen: 3.0, ad: 48, adPer: 2.6, as: 0.66, asPer: 1.4, armor: 17, armorPer: 2.8, ward: 22, wardPer: 1.2, speed: 3.5, range: 6.0, radius: 0.5, windup: 0.25, missileSpeed: 18 },
    passive: { name: 'Margin Notes', desc: 'Each of Ilyra\'s abilities leaves a different annotation on enemies hit (6 s). Three different annotations detonate for {burst} (+30% AP) arcane damage.' },
    abilities: [
      { id: 'linebreak', name: 'Linebreak', key: 'Q', target: 'direction', shape: 'line', range: 12, width: 0.8, cost: [45, 50, 55, 60], cd: [6, 5.5, 5, 4.5], castTime: 0.2, vals: { dmg: [70, 110, 150, 190], ap: 0.7 }, desc: 'A narrow piercing line dealing {dmg} (+70% AP) arcane damage. Damage is reduced to 60% after the first hero.' },
      { id: 'footnote', name: 'Footnote', key: 'W', target: 'point', shape: 'circle', range: 9, radius: 1.8, cost: [50, 50, 50, 50], cd: [14, 13, 12, 11], castTime: 0, vals: { dmg: [30, 45, 60, 75], ap: 0.2, dur: 6 }, desc: 'Place a sigil that arms after 0.6 s, dealing {dmg} (+20% AP) to enemies on it. For {dur} s, a Linebreak passing through it is repeated at 40% damage toward the nearest enemy hero.' },
      { id: 'redaction', name: 'Redaction', key: 'E', target: 'direction', shape: 'rect', range: 7, width: 3, cost: [60, 60, 60, 60], cd: [16, 15, 14, 13], castTime: 0.25, vals: { dmg: [50, 75, 100, 125], ap: 0.4, silence: [1.0, 1.2, 1.4, 1.6] }, desc: 'Strike out a rectangle: {dmg} (+40% AP) arcane damage and {silence} s silence. Erases enemy non-ultimate projectiles and zones inside it.' },
      { id: 'final_draft', name: 'Final Draft', key: 'R', target: 'point', shape: 'circle', range: 13, radius: 5.5, cost: [100, 100], cd: [100, 80], castTime: 0.3, vals: { dmg: [70, 120], ap: 0.35, stun: 1.0 }, desc: 'Three expanding manuscript rings land in sequence, each dealing {dmg} (+35% AP) arcane damage. The final ring stuns enemies already hit by both earlier rings for {stun} s.', ult: true },
    ],
    builds: {
      starter: 'exiles_inkpot',
      lane: 'lane',
      paths: [
        { name: 'Heavy Ink', why: 'Raw ability power and penetration: delete squishy targets.', items: ['trail_boots', 'quiet_index', 'riverglass_boots', 'aetherlens', 'wickfire_censer', 'beacon_loom'] },
        { name: 'Slow Burn', why: 'Health and burn damage to survive divers and grind tanks.', items: ['trail_boots', 'wickfire_censer', 'ironroot_greaves', 'quiet_index', 'aetherlens', 'mistward_mantle'] },
      ],
      vsPhysical: 'kilnheart_plate',
      vsArcane: 'null_bell',
      skillOrder: [0, 2, 1],
    },
  },
  vey: {
    id: 'vey',
    name: 'Vey',
    title: 'Glassknife',
    roles: ['Assassin', 'Roamer'],
    difficulty: 3,
    blurb: 'Strikes from where you are not looking. Lives in brush and fog, punishes anyone caught alone.',
    resource: 'Energy',
    color: 0x7fe3ff,
    accent: 0xffffff,
    melee: true,
    base: { hp: 560, hpPer: 76, mana: 200, manaPer: 0, hpRegen: 2.0, manaRegen: 12, ad: 62, adPer: 3.5, as: 0.76, asPer: 2.6, armor: 24, armorPer: 3.1, ward: 24, wardPer: 1.6, speed: 3.9, range: 1.7, radius: 0.5, windup: 0.22, missileSpeed: 0 },
    passive: { name: 'Refraction', desc: 'After leaving brush or enemy sight, Vey\'s next basic attack within 4 s ignores 40% armor and deals {bonus} bonus damage. Nearby targets see a warning glint.' },
    abilities: [
      { id: 'shardstep', name: 'Shardstep', key: 'Q', target: 'unit', unitFilter: 'enemy', shape: 'none', range: 5.5, cost: [50, 50, 50, 50], cd: [6, 5.5, 5, 4.5], castTime: 0, vals: { dmg: [60, 90, 120, 150], ad: 0.5, lock: 6 }, desc: 'Dash through an enemy, dealing {dmg} (+50% AD) physical damage. Cannot target the same enemy again for {lock} s.' },
      { id: 'mirror_decoy', name: 'Mirror Decoy', key: 'W', target: 'direction', shape: 'line', range: 8, width: 1, cost: [40, 40, 40, 40], cd: [18, 17, 16, 15], castTime: 0, vals: { dur: 4, swap: 9 }, desc: 'Send a harmless decoy along a path for {dur} s. Recast to swap places with it if within {swap} m.' },
      { id: 'cut_the_light', name: 'Cut the Light', key: 'E', target: 'direction', shape: 'cone', range: 4.5, arc: 80, cost: [45, 45, 45, 45], cd: [8, 7.5, 7, 6.5], castTime: 0.12, vals: { dmg: [65, 100, 135, 170], ad: 0.6, disable: 5 }, desc: 'A cone slash dealing {dmg} (+60% AD) physical damage to enemies and disabling enemy wards for {disable} s.' },
      { id: 'prism_sentence', name: 'Prism Sentence', key: 'R', target: 'unit', unitFilter: 'enemyHero', shape: 'none', range: 8, cost: [80, 80], cd: [80, 60], castTime: 0, vals: { dmg: [180, 300], ad: 1.0, delay: 1.2 }, desc: 'Mark a hero. After {delay} s Vey blinks behind them and strikes for {dmg} (+100% AD) physical damage. If the target breaks line of sight, the blink is cancelled and the strike deals only 40%.', ult: true },
    ],
    builds: {
      starter: 'glass_shiv',
      lane: 'jungle',
      paths: [
        { name: 'Clean Cut', why: 'Burst and penetration: one rotation kills a carry.', items: ['trail_boots', 'rivenwright_maul', 'riverglass_boots', 'cinderfang', 'tidecaller_glaive', 'mistward_mantle'] },
        { name: 'Long Knife', why: 'Sustain and speed for extended skirmishes.', items: ['trail_boots', 'tidecaller_glaive', 'riverglass_boots', 'sunspoke_bow', 'rivenwright_maul', 'kilnheart_plate'] },
      ],
      vsPhysical: 'kilnheart_plate',
      vsArcane: 'mistward_mantle',
      skillOrder: [0, 2, 1],
    },
  },
};

export const HERO_IDS = Object.keys(HEROES) as HeroId[];

/** Passive numbers that scale with level; shared so tooltips and sim agree. */
export const PASSIVE = {
  brannochStack: (lvl: number): number => 5 + Math.floor(lvl * 0.75),
  suriBonus: (lvl: number): number => 12 + 5 * lvl,
  oruReturn: 30,
  keshHeal: (lvl: number): number => 12 + 3 * lvl,
  ilyraBurst: (lvl: number): number => 40 + 10 * lvl,
  veyBonus: (lvl: number): number => 15 + 6 * lvl,
};

export function val(def: AbilityDef, key: string, rank: number): number {
  const v = def.vals[key];
  if (typeof v === 'number') return v;
  return v[Math.max(0, Math.min(v.length - 1, rank - 1))];
}

/** Render a tooltip string from data. rank 0 shows every rank ("60/95/130/165"). */
export function describeAbility(def: AbilityDef, rank: number): string {
  return def.desc.replace(/\{(\w+)\}/g, (_, k: string) => {
    const v = def.vals[k];
    if (v === undefined) return k;
    if (typeof v === 'number') return String(v);
    return rank > 0 ? String(v[Math.min(v.length - 1, rank - 1)]) : v.join('/');
  });
}

export function describePassive(hero: HeroDef, lvl: number): string {
  const map: Record<string, string> = {
    armor: String(PASSIVE.brannochStack(lvl)),
    bonus: String(hero.id === 'suri' ? PASSIVE.suriBonus(lvl) : PASSIVE.veyBonus(lvl)),
    pct: String(PASSIVE.oruReturn),
    heal: String(PASSIVE.keshHeal(lvl)),
    burst: String(PASSIVE.ilyraBurst(lvl)),
  };
  return hero.passive.desc.replace(/\{(\w+)\}/g, (_, k: string) => map[k] ?? k);
}

export const MAX_LEVEL = 12;
/** Cumulative XP required to reach level index+1. */
export const XP_TABLE = [0, 170, 400, 690, 1040, 1450, 1920, 2450, 3040, 3690, 4400, 5170];
export const ULT_LEVELS = [6, 11];
export const MAX_BASIC_RANK = 4;
