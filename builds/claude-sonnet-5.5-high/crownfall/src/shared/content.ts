/**
 * shared-content: schema-typed hero / ability / item / talent data.
 * Both the authoritative simulation and the UI (tooltips) read from here.
 */
export type Role = 'Vanguard' | 'Marksman' | 'Support' | 'Fighter' | 'Mage' | 'Assassin';
export type Targeting = 'dir' | 'point' | 'unit' | 'ally' | 'self';
export type DamageType = 'physical' | 'arcane' | 'pure';

export interface StatBlock {
  hp?: number; mana?: number; ad?: number; ap?: number; as?: number; armor?: number; ward?: number;
  ms?: number; haste?: number; pen?: number; lifesteal?: number; hpRegen?: number; manaRegen?: number;
  shieldPower?: number; apPct?: number; structDmg?: number; monsterDmg?: number; passiveGold?: number; wardCharges?: number;
}

export interface AbilityDef {
  slot: 0 | 1 | 2 | 3;
  key: 'Q' | 'W' | 'E' | 'R';
  name: string;
  targeting: Targeting;
  range: number;
  /** radius or width, used for telegraphs */
  size: number;
  shape: 'line' | 'circle' | 'cone' | 'rect' | 'unit' | 'self';
  castTime: number;
  cd: number[];
  cost: number[];
  /** numeric tunables, indexed by rank-1 */
  v: Record<string, number[]>;
  desc: string; // {name} is replaced with the value list
  ult?: boolean;
  recast?: number; // recast window seconds
  /** bot hint */
  ai: 'skillshot' | 'point' | 'unit' | 'ally' | 'self' | 'engage' | 'escape';
  tags: string[];
  /** power level used by Redaction-style erasure (1 minor, 2 medium, 3 ultimate) */
  power: number;
  icon: string; // glyph for UI
}

export interface HeroDef {
  id: string;
  name: string;
  title: string;
  role: Role;
  difficulty: 1 | 2 | 3;
  blurb: string;
  resource: 'mana' | 'energy';
  hp: number; hpGrow: number; mana: number; manaGrow: number;
  ad: number; adGrow: number; armor: number; armorGrow: number; ward: number; wardGrow: number;
  as: number; asGrow: number; ms: number; range: number; windup: number; radius: number; projSpeed: number;
  hpRegen: number; manaRegen: number;
  color: number; accent: number;
  passive: { name: string; desc: string };
  abilities: [AbilityDef, AbilityDef, AbilityDef, AbilityDef];
  builds: { name: string; why: string; items: string[] }[];
  /** jungle suitability for bot role assignment */
  jungle: number;
}

const f4 = (a: number, b: number, c: number, d: number) => [a, b, c, d];

export const HEROES: HeroDef[] = [
  {
    id: 'brannoch', name: 'Brannoch', title: 'Bastion Mason', role: 'Vanguard', difficulty: 1,
    blurb: 'A walking fortress who builds cover mid-fight and leaps across the lane to break formations.',
    resource: 'mana', hp: 640, hpGrow: 98, mana: 260, manaGrow: 34, ad: 56, adGrow: 3.4, armor: 34, armorGrow: 4.2, ward: 28, wardGrow: 1.8,
    as: 0.72, asGrow: 0.018, ms: 3.5, range: 1.9, windup: 0.32, radius: 0.65, projSpeed: 0, hpRegen: 1.8, manaRegen: 1.0,
    color: 0xc9bfae, accent: 0xd49a3a, jungle: 1,
    passive: { name: 'Set in Stone', desc: 'After standing near an enemy hero for 3s, gain a stacking armor and ward bonus (up to 5 stacks). Moving away decays the stacks.' },
    abilities: [
      { slot: 0, key: 'Q', name: 'Fault Hammer', targeting: 'dir', range: 3.8, size: 3.8, shape: 'cone', castTime: 0.3, cd: f4(7, 6.5, 6, 5.5), cost: f4(30, 35, 40, 45),
        v: { dmg: f4(70, 110, 150, 190), slow: f4(30, 35, 40, 45), bonus: f4(40, 60, 80, 100) },
        desc: 'Slam the ground in front. Deals {dmg} + 80% AD physical damage. The outer edge slows by {slow}% for 1.5s; the inner edge deals {bonus} bonus stagger damage.',
        ai: 'skillshot', tags: ['damage', 'slow'], power: 1, icon: '⚒' },
      { slot: 1, key: 'W', name: 'Rampart Fold', targeting: 'dir', range: 4.5, size: 2.6, shape: 'rect', castTime: 0.15, cd: f4(16, 15, 14, 13), cost: f4(50, 55, 60, 65),
        v: { hp: f4(260, 360, 460, 560) }, desc: 'Raise a curved stone wall for 3s ({hp} health). It blocks movement and projectiles of both teams and can be broken.',
        ai: 'self', tags: ['terrain'], power: 1, icon: '▥' },
      { slot: 2, key: 'E', name: 'Anchor Line', targeting: 'point', range: 10, size: 1, shape: 'circle', castTime: 0.1, cd: f4(14, 13, 12, 11), cost: f4(40, 40, 40, 40), recast: 4,
        v: { shield: f4(70, 110, 150, 190) }, desc: 'Throw an anchor to a point (or an allied hero). Recast within 4s to haul yourself to it and gain a {shield} shield for 2.5s.',
        ai: 'engage', tags: ['mobility', 'shield'], power: 1, icon: '⚓' },
      { slot: 3, key: 'R', name: 'Citybreaker', targeting: 'point', range: 11, size: 4.2, shape: 'circle', castTime: 0.75, cd: f4(90, 70, 70, 70), cost: f4(100, 120, 120, 120), ult: true,
        v: { dmg: f4(220, 340, 340, 340) }, desc: 'After a telegraphed wind-up, leap to the target area (max 11m). Deals {dmg} + 100% AD physical damage and knocks enemies up for 1.1s.',
        ai: 'engage', tags: ['knockup', 'mobility'], power: 3, icon: '☄' },
    ],
    builds: [
      { name: 'Unbreakable Wall', why: 'Stack health and armor to hold the front line against physical teams.', items: ['brace', 'ironwood', 'platescrap', 'kilnheart', 'stalwart', 'aegis'] },
      { name: 'Siege Breaker', why: 'Trade some bulk for damage to crack towers and bruise carries.', items: ['whetstone', 'sinew', 'ironwood', 'tithe', 'maul', 'swiftsole'] },
    ],
  },
  {
    id: 'suri', name: 'Suri Vale', title: 'Ember Courier', role: 'Marksman', difficulty: 2,
    blurb: 'A mobile ranged carrier who delivers burning parcels and one very long, very late corridor shot.',
    resource: 'mana', hp: 540, hpGrow: 82, mana: 280, manaGrow: 36, ad: 58, adGrow: 3.6, armor: 24, armorGrow: 3.4, ward: 26, wardGrow: 1.6,
    as: 0.8, asGrow: 0.024, ms: 3.6, range: 7.2, windup: 0.28, radius: 0.5, projSpeed: 20, hpRegen: 1.3, manaRegen: 1.1,
    color: 0xe8764a, accent: 0xffc44a, jungle: 1,
    passive: { name: 'Hot Route', desc: 'Moving 3 meters charges your next basic attack with Ember damage. Attacking repeatedly without moving loses the bonus.' },
    abilities: [
      { slot: 0, key: 'Q', name: 'Ricochet Bolt', targeting: 'dir', range: 13, size: 0.7, shape: 'line', castTime: 0.22, cd: f4(8, 7.5, 7, 6.5), cost: f4(45, 50, 55, 60),
        v: { dmg: f4(60, 100, 140, 180) }, desc: 'Fire a bolt that bounces once off terrain. Deals {dmg} + 90% AD physical damage to the first enemy hit.',
        ai: 'skillshot', tags: ['damage', 'bounce'], power: 1, icon: '➶' },
      { slot: 1, key: 'W', name: 'Slipstream', targeting: 'dir', range: 5.5, size: 1.6, shape: 'line', castTime: 0.05, cd: f4(14, 13, 12, 11), cost: f4(40, 40, 40, 40),
        v: { speed: f4(30, 35, 40, 45) }, desc: 'Dash forward, leaving a speed lane for 3s. The first time each ally crosses it they gain +{speed}% move speed for 1.5s.',
        ai: 'escape', tags: ['dash'], power: 1, icon: '≋' },
      { slot: 2, key: 'E', name: 'Parcel Charge', targeting: 'unit', range: 8, size: 2.4, shape: 'unit', castTime: 0.2, cd: f4(12, 11.5, 11, 10.5), cost: f4(50, 55, 60, 65),
        v: { dmg: f4(80, 130, 180, 230) }, desc: 'Attach a charge to an enemy for 3s. Each attack on it speeds detonation by 0.5s. Detonates for {dmg} + 70% AD in a small area.',
        ai: 'unit', tags: ['damage', 'mark'], power: 1, icon: '✺' },
      { slot: 3, key: 'R', name: 'Redline Delivery', targeting: 'dir', range: 30, size: 1.6, shape: 'line', castTime: 0.9, cd: f4(100, 85, 85, 85), cost: f4(100, 100, 100, 100), ult: true,
        v: { dmg: f4(200, 320, 320, 320) }, desc: 'Channel for 0.9s (revealing you), then fire a corridor shot across the lane. Deals {dmg} + 120% AD, up to +60% more by travel distance.',
        ai: 'skillshot', tags: ['damage', 'reveal'], power: 3, icon: '➤' },
    ],
    builds: [
      { name: 'Sunspoke Carry', why: 'Attack speed and bolts for sustained dps against tanks and towers.', items: ['whetstone', 'gale', 'sinew', 'sunspoke', 'swiftsole', 'glassfang'] },
      { name: 'Glassfang Sniper', why: 'Armor penetration for burst against squishy teams.', items: ['whetstone', 'keenedge', 'sinew', 'glassfang', 'riverglass', 'tithe'] },
    ],
  },
  {
    id: 'oru', name: 'Oru', title: 'Choir of Moths', role: 'Support', difficulty: 2,
    blurb: 'A swarm-caller who shields allies, blinds the enemy with a hush, and shields entire teams with a wave.',
    resource: 'mana', hp: 520, hpGrow: 80, mana: 340, manaGrow: 44, ad: 48, adGrow: 2.6, armor: 22, armorGrow: 3.2, ward: 30, wardGrow: 2.0,
    as: 0.68, asGrow: 0.016, ms: 3.55, range: 6.2, windup: 0.3, radius: 0.5, projSpeed: 15, hpRegen: 1.4, manaRegen: 1.7,
    color: 0xb9a8e8, accent: 0x7ff0ff, jungle: 0,
    passive: { name: 'Shared Wing', desc: 'Shields Oru grants return 20% of their value to Oru as health after 3s, if they were not broken.' },
    abilities: [
      { slot: 0, key: 'Q', name: 'Luminous Swarm', targeting: 'dir', range: 11, size: 0.9, shape: 'line', castTime: 0.2, cd: f4(7, 6.5, 6, 5.5), cost: f4(50, 55, 60, 65),
        v: { dmg: f4(60, 100, 140, 180), shield: f4(70, 110, 150, 190) }, desc: 'A slow swarm that deals {dmg} + 60% AP arcane damage to the first enemy, or shields the first ally for {shield}.',
        ai: 'skillshot', tags: ['damage', 'shield'], power: 1, icon: '❋' },
      { slot: 1, key: 'W', name: 'Hush Field', targeting: 'point', range: 9, size: 4.2, shape: 'circle', castTime: 0.2, cd: f4(16, 15, 14, 13), cost: f4(70, 75, 80, 85),
        v: { dur: f4(3.5, 4, 4.5, 5) }, desc: 'Create a field for {dur}s. Enemy heroes inside have their vision radius halved and are marked HUSHED. Telegraphs stay visible.',
        ai: 'point', tags: ['zone', 'vision'], power: 2, icon: '◌' },
      { slot: 2, key: 'E', name: 'Guiding Draft', targeting: 'ally', range: 9, size: 1.2, shape: 'unit', castTime: 0.15, cd: f4(13, 12, 11, 10), cost: f4(60, 60, 60, 60),
        v: { speed: f4(25, 30, 35, 40) }, desc: 'An allied hero gains +{speed}% move speed for 3s. Their next ability to hit an enemy hero marks it for team vision for 4s.',
        ai: 'ally', tags: ['buff', 'vision'], power: 1, icon: '➳' },
      { slot: 3, key: 'R', name: 'Night Migration', targeting: 'dir', range: 20, size: 4.0, shape: 'line', castTime: 0.45, cd: f4(100, 85, 85, 85), cost: f4(120, 120, 120, 120), ult: true,
        v: { shield: f4(150, 240, 240, 240), dmg: f4(80, 140, 140, 140) }, desc: 'Send a wide wave. Allied heroes it passes gain a {shield} shield; enemies at the leading edge take {dmg} + 50% AP and are rooted for 1.1s.',
        ai: 'skillshot', tags: ['shield', 'root'], power: 3, icon: '✦' },
    ],
    builds: [
      { name: 'Choir Warden', why: 'Shield strength and mana to keep a lane partner alive.', items: ['lantern', 'mote', 'veilthread', 'beacon', 'stalwart', 'nullbell'] },
      { name: 'Hexing Songstress', why: 'Ability power and haste to lean on swarm damage and cooldowns.', items: ['quill', 'glyph', 'inkwell', 'quietindex', 'riverglass', 'tempest'] },
    ],
  },
  {
    id: 'kesh', name: 'Kesh', title: 'Mirebound', role: 'Fighter', difficulty: 2,
    blurb: 'A swamp predator who farms the jungle, hunts marked prey and claims the ground he fights on.',
    resource: 'mana', hp: 600, hpGrow: 92, mana: 240, manaGrow: 28, ad: 60, adGrow: 3.5, armor: 30, armorGrow: 3.8, ward: 28, wardGrow: 1.7,
    as: 0.74, asGrow: 0.021, ms: 3.55, range: 2.0, windup: 0.3, radius: 0.6, projSpeed: 0, hpRegen: 2.0, manaRegen: 0.9,
    color: 0x5a9a58, accent: 0xd9e67a, jungle: 3,
    passive: { name: "Predator's Patience", desc: 'The first monster or hero you damage is marked. Attacking the same mark heals you slightly (6s cooldown).' },
    abilities: [
      { slot: 0, key: 'Q', name: 'Reed Cleaver', targeting: 'dir', range: 3.4, size: 3.4, shape: 'cone', castTime: 0.2, cd: f4(6, 5.5, 5, 4.5), cost: f4(30, 30, 35, 35), recast: 2.2,
        v: { dmg: f4(55, 90, 125, 160), miss: f4(8, 10, 12, 14) }, desc: 'Cleave a cone for {dmg} + 60% AD. Recast within 2.2s for a second swing that also deals {miss}% of the target\'s missing health.',
        ai: 'skillshot', tags: ['damage'], power: 1, icon: '⚔' },
      { slot: 1, key: 'W', name: 'Bogskin', targeting: 'self', range: 0, size: 4, shape: 'self', castTime: 0.05, cd: f4(15, 14, 13, 12), cost: f4(50, 50, 50, 50),
        v: { dr: f4(35, 40, 45, 50) }, desc: 'For 2s take {dr}% less damage. When it ends, enemies nearby are slowed in proportion to the damage absorbed (up to 50%).',
        ai: 'self', tags: ['defense', 'slow'], power: 1, icon: '◍' },
      { slot: 2, key: 'E', name: 'Sinkstep', targeting: 'dir', range: 7, size: 1, shape: 'line', castTime: 0.05, cd: f4(14, 13, 12, 11), cost: f4(40, 40, 40, 40),
        v: { as: f4(30, 35, 40, 45) }, desc: 'Burrow up to 7m, ignoring units, then emerge with +{as}% attack speed for 3s.',
        ai: 'engage', tags: ['dash'], power: 1, icon: '↯' },
      { slot: 3, key: 'R', name: 'Fen Claim', targeting: 'self', range: 0, size: 6, shape: 'self', castTime: 0.2, cd: f4(95, 80, 80, 80), cost: f4(100, 100, 100, 100), ult: true,
        v: { dur: f4(6, 7, 7, 7) }, desc: 'Create a marsh around you for {dur}s. You move faster in it; enemies are slowed 30% and leave visible wakes.',
        ai: 'self', tags: ['zone', 'slow'], power: 3, icon: '❂' },
    ],
    builds: [
      { name: 'Predator', why: 'Damage and sustain to dominate skirmishes and the jungle.', items: ['totem', 'sinew', 'ironwood', 'tithe', 'swiftsole', 'maul'] },
      { name: 'Bog Bulwark', why: 'Resistances so Bogskin and Fen Claim keep him in the fight.', items: ['brace', 'platescrap', 'mote', 'thornmail', 'stalwart', 'aegis'] },
    ],
  },
  {
    id: 'ilyra', name: 'Ilyra Quill', title: 'Archive Exile', role: 'Mage', difficulty: 3,
    blurb: 'An artillery mage who annotates enemies with spells, erases their magic and rewrites a battlefield with rings of text.',
    resource: 'mana', hp: 500, hpGrow: 76, mana: 380, manaGrow: 46, ad: 46, adGrow: 2.4, armor: 20, armorGrow: 3.0, ward: 28, wardGrow: 1.7,
    as: 0.66, asGrow: 0.015, ms: 3.45, range: 6.8, windup: 0.32, radius: 0.5, projSpeed: 16, hpRegen: 1.2, manaRegen: 1.7,
    color: 0x6f8fe8, accent: 0xffe27a, jungle: 0,
    passive: { name: 'Margin Notes', desc: 'Each of your abilities that hits adds a unique annotation. At three different annotations the target takes an Arcane burst.' },
    abilities: [
      { slot: 0, key: 'Q', name: 'Linebreak', targeting: 'dir', range: 14, size: 0.7, shape: 'line', castTime: 0.25, cd: f4(7, 6.5, 6, 5.5), cost: f4(55, 60, 65, 70),
        v: { dmg: f4(70, 115, 160, 205) }, desc: 'A narrow piercing line. Deals {dmg} + 70% AP arcane damage, reduced by 30% after the first hero.',
        ai: 'skillshot', tags: ['damage', 'pierce'], power: 1, icon: '⟶' },
      { slot: 1, key: 'W', name: 'Footnote', targeting: 'point', range: 9, size: 1.6, shape: 'circle', castTime: 0.15, cd: f4(14, 13, 12, 11), cost: f4(40, 40, 40, 40),
        v: { copy: f4(40, 40, 40, 40) }, desc: 'Place a sigil for 6s. The next Linebreak that passes through it repeats at {copy}% power from the sigil at a new angle.',
        ai: 'point', tags: ['sigil'], power: 1, icon: '※' },
      { slot: 2, key: 'E', name: 'Redaction', targeting: 'point', range: 8, size: 3.2, shape: 'rect', castTime: 0.3, cd: f4(15, 14, 13, 12), cost: f4(60, 65, 70, 75),
        v: { dmg: f4(50, 80, 110, 140), sil: f4(1.0, 1.1, 1.2, 1.3) }, desc: 'Strike a rectangle: {dmg} + 40% AP, silence heroes for {sil}s, and erase enemy non-ultimate projectiles and zones inside.',
        ai: 'point', tags: ['silence', 'erase'], power: 2, icon: '▭' },
      { slot: 3, key: 'R', name: 'Final Draft', targeting: 'point', range: 11, size: 5.5, shape: 'circle', castTime: 0.3, cd: f4(100, 85, 85, 85), cost: f4(120, 120, 120, 120), ult: true,
        v: { dmg: f4(90, 150, 150, 150) }, desc: 'Three expanding manuscript rings strike the area for {dmg} + 40% AP each. The final ring stuns enemies hit by both earlier rings.',
        ai: 'point', tags: ['damage', 'stun'], power: 3, icon: '◎' },
    ],
    builds: [
      { name: 'Archive Burst', why: 'Pure ability power for rotation damage.', items: ['quill', 'glyph', 'glyph', 'aethercrown', 'riverglass', 'quietindex'] },
      { name: 'Tempo Scribe', why: 'Haste and mana to spam lines and rings through fights.', items: ['quill', 'inkwell', 'glyph', 'tempest', 'swiftsole', 'quietindex'] },
    ],
  },
  {
    id: 'vey', name: 'Vey', title: 'Glassknife', role: 'Assassin', difficulty: 3,
    blurb: 'A roaming assassin who vanishes into brush, splits to a decoy and pins a hero with a prism sentence.',
    resource: 'energy', hp: 530, hpGrow: 84, mana: 200, manaGrow: 0, ad: 62, adGrow: 3.6, armor: 26, armorGrow: 3.5, ward: 26, wardGrow: 1.6,
    as: 0.82, asGrow: 0.022, ms: 3.9, range: 1.8, windup: 0.26, radius: 0.5, projSpeed: 0, hpRegen: 1.5, manaRegen: 4.2,
    color: 0xe6e9ff, accent: 0xff5ad2, jungle: 2,
    passive: { name: 'Refraction', desc: 'After entering brush or staying unseen for 1.5s, your next attack from a new angle gains armor penetration and bonus damage. A glint warns nearby targets.' },
    abilities: [
      { slot: 0, key: 'Q', name: 'Shardstep', targeting: 'unit', range: 8, size: 1.2, shape: 'unit', castTime: 0.05, cd: f4(8, 7, 6, 5), cost: f4(40, 40, 40, 40),
        v: { dmg: f4(60, 100, 140, 180) }, desc: 'Dash through an enemy, dealing {dmg} + 70% AD. Cannot hit the same target again for 4s.',
        ai: 'unit', tags: ['dash', 'damage'], power: 1, icon: '✧' },
      { slot: 1, key: 'W', name: 'Mirror Decoy', targeting: 'point', range: 12, size: 1, shape: 'circle', castTime: 0.1, cd: f4(16, 15, 14, 13), cost: f4(50, 50, 50, 50), recast: 3,
        v: { swap: f4(10, 10, 10, 10) }, desc: 'Send a harmless decoy to a point. Recast within 3s to swap places, if you are within {swap}m of it.',
        ai: 'escape', tags: ['decoy', 'mobility'], power: 1, icon: '◈' },
      { slot: 2, key: 'E', name: 'Cut the Light', targeting: 'dir', range: 5, size: 5, shape: 'cone', castTime: 0.25, cd: f4(11, 10, 9, 8), cost: f4(50, 50, 50, 50),
        v: { dmg: f4(55, 90, 125, 160) }, desc: 'Strike a cone for {dmg} + 60% AD to heroes and minions. Wards hit are disabled for 5s.',
        ai: 'skillshot', tags: ['damage', 'ward'], power: 1, icon: '◣' },
      { slot: 3, key: 'R', name: 'Prism Sentence', targeting: 'unit', range: 9, size: 1.4, shape: 'unit', castTime: 0.2, cd: f4(90, 75, 75, 75), cost: f4(100, 100, 100, 100), ult: true,
        v: { dmg: f4(220, 340, 340, 340) }, desc: 'Mark a hero. After 1.2s strike from the current angle for {dmg} + 100% AD and blink to them. If they break line of sight, damage is halved and the blink is canceled.',
        ai: 'unit', tags: ['damage', 'blink', 'mark'], power: 3, icon: '❖' },
    ],
    builds: [
      { name: 'Glass Cutter', why: 'Penetration and burst to delete backline targets.', items: ['whetstone', 'keenedge', 'sinew', 'glassfang', 'riverglass', 'tithe'] },
      { name: 'Duelist', why: 'Lifesteal and health to win extended skirmishes.', items: ['totem', 'sinew', 'ironwood', 'tithe', 'swiftsole', 'maul'] },
    ],
  },
];
export const HERO_BY_ID: Record<string, HeroDef> = Object.fromEntries(HEROES.map((h) => [h.id, h]));

export function abilityVal(def: AbilityDef, key: string, rank: number): number {
  const arr = def.v[key];
  return arr[Math.max(0, Math.min(arr.length - 1, rank - 1))];
}

export function abilityText(def: AbilityDef, rank: number): string {
  return def.desc.replace(/\{(\w+)\}/g, (_m, k: string) => {
    const arr = def.v[k];
    if (!arr) return '?';
    if (rank > 0) return String(arr[Math.min(arr.length - 1, rank - 1)]);
    const u = Array.from(new Set(arr));
    return u.join('/');
  });
}

// ---------------------------------------------------------------- Talents
export interface TalentDef { id: string; name: string; desc: string; cd: number; icon: string }
export const TALENTS: TalentDef[] = [
  { id: 'skyhop', name: 'Skyhop', desc: 'Blink 6m toward the cursor.', cd: 75, icon: '⇱' },
  { id: 'mend', name: 'Mend', desc: 'Restore 14% of max health (doubled below 40% health).', cd: 70, icon: '✚' },
  { id: 'aegis', name: 'Aegis Pulse', desc: 'Gain a shield worth 12% max health + 60 for 3s.', cd: 60, icon: '◉' },
  { id: 'sprint', name: 'Windrunner', desc: 'Gain +35% move speed for 3s.', cd: 55, icon: '»' },
  { id: 'cinder', name: 'Cinder Mark', desc: 'Burn the nearest enemy hero within 6m for 60 + 10/level true damage over 3s.', cd: 70, icon: '♨' },
  { id: 'purify', name: 'Purify', desc: 'Cleanse slows, roots, silences and stuns (not airborne).', cd: 90, icon: '❂' },
];
export const TALENT_BY_ID: Record<string, TalentDef> = Object.fromEntries(TALENTS.map((t) => [t.id, t]));

// ---------------------------------------------------------------- Items
export type ItemTier = 'starter' | 'component' | 'complete' | 'boots' | 'consumable';
export type ItemCat = 'attack' | 'ability' | 'defense' | 'movement' | 'support';
export interface ItemDef {
  id: string; name: string; tier: ItemTier; cat: ItemCat; cost: number;
  stats: StatBlock; from?: string[]; passive?: string; active?: string; icon: string; color: string;
  /** roles this serves (used for recommendations, >= 2 each for completed items) */
  tags: Role[];
}
const I = (d: ItemDef) => d;
export const ITEMS: ItemDef[] = [
  // starters
  I({ id: 'whetstone', name: 'Whetstone Blade', tier: 'starter', cat: 'attack', cost: 450, stats: { ad: 9, hp: 40 }, icon: '🗡', color: '#e0a040', tags: ['Marksman', 'Assassin', 'Fighter'], passive: 'Hunt: +5 gold on minion last hits.' }),
  I({ id: 'quill', name: "Apprentice's Quill", tier: 'starter', cat: 'ability', cost: 450, stats: { ap: 16, mana: 60 }, icon: '✒', color: '#6a8cff', tags: ['Mage', 'Support'], passive: 'Siphon: restore 8 mana on minion last hits.' }),
  I({ id: 'brace', name: "Mason's Brace", tier: 'starter', cat: 'defense', cost: 450, stats: { hp: 130, armor: 4, hpRegen: 1 }, icon: '⛨', color: '#c8b48a', tags: ['Vanguard', 'Fighter'] }),
  I({ id: 'satchel', name: "Courier's Satchel", tier: 'starter', cat: 'movement', cost: 400, stats: { ms: 0.15, hp: 60, passiveGold: 0.25 }, icon: '✉', color: '#e8b060', tags: ['Marksman', 'Assassin', 'Support'], passive: 'Parcel: +0.25 gold per second.' }),
  I({ id: 'lantern', name: 'Lantern Charm', tier: 'starter', cat: 'support', cost: 450, stats: { hp: 50, manaRegen: 1.5, wardCharges: 1 }, icon: '🏮', color: '#9ff0d8', tags: ['Support', 'Mage'], passive: 'Carry one extra ward charge.' }),
  I({ id: 'totem', name: "Hunter's Totem", tier: 'starter', cat: 'attack', cost: 450, stats: { ad: 8, hp: 70, monsterDmg: 0.35 }, icon: '☗', color: '#7bbf6a', tags: ['Fighter', 'Assassin', 'Marksman'], passive: 'Prey: +35% damage to monsters.' }),
  // components
  I({ id: 'sinew', name: 'Brass Sinew', tier: 'component', cat: 'attack', cost: 800, stats: { ad: 24 }, icon: '⚙', color: '#d4a040', tags: ['Marksman', 'Assassin', 'Fighter'] }),
  I({ id: 'gale', name: 'Gale Thread', tier: 'component', cat: 'attack', cost: 700, stats: { as: 0.28 }, icon: '〰', color: '#8fe0ff', tags: ['Marksman', 'Fighter'] }),
  I({ id: 'keenedge', name: 'Keen Edge', tier: 'component', cat: 'attack', cost: 850, stats: { ad: 14, pen: 0.1 }, icon: '◢', color: '#ff9a8a', tags: ['Assassin', 'Marksman'] }),
  I({ id: 'glyph', name: 'Glyph Page', tier: 'component', cat: 'ability', cost: 750, stats: { ap: 34 }, icon: '☰', color: '#a07aff', tags: ['Mage', 'Support'] }),
  I({ id: 'inkwell', name: 'Inkwell', tier: 'component', cat: 'ability', cost: 700, stats: { mana: 300, haste: 10, ap: 12 }, icon: '⚗', color: '#5a7aff', tags: ['Mage', 'Support'] }),
  I({ id: 'ironwood', name: 'Ironwood Plank', tier: 'component', cat: 'defense', cost: 700, stats: { hp: 320 }, icon: '▤', color: '#b08850', tags: ['Vanguard', 'Fighter', 'Support'] }),
  I({ id: 'platescrap', name: 'Plate Scrap', tier: 'component', cat: 'defense', cost: 650, stats: { armor: 30 }, icon: '▣', color: '#aab6c0', tags: ['Vanguard', 'Fighter'] }),
  I({ id: 'veilthread', name: 'Veil Thread', tier: 'component', cat: 'defense', cost: 650, stats: { ward: 30 }, icon: '☁', color: '#b0a0e0', tags: ['Support', 'Vanguard', 'Mage'] }),
  I({ id: 'swiftsole', name: 'Swiftsole Boots', tier: 'component', cat: 'movement', cost: 350, stats: { ms: 0.35 }, icon: '👢', color: '#e0c070', tags: ['Marksman', 'Assassin', 'Fighter', 'Mage', 'Support', 'Vanguard'] }),
  I({ id: 'mote', name: 'Mote Cloth', tier: 'component', cat: 'support', cost: 600, stats: { hp: 150, hpRegen: 2, manaRegen: 2 }, icon: '❋', color: '#ffd878', tags: ['Support', 'Vanguard'] }),
  // completed
  I({ id: 'sunspoke', name: 'Sunspoke Bow', tier: 'complete', cat: 'attack', cost: 2400, stats: { ad: 22, as: 0.35 }, from: ['gale', 'sinew'], icon: '☀', color: '#ffc040', tags: ['Marksman', 'Fighter'], passive: 'Every third attack also fires a bolt at a nearby target for 60% damage.' }),
  I({ id: 'kilnheart', name: 'Kilnheart Plate', tier: 'complete', cat: 'defense', cost: 2200, stats: { hp: 420, armor: 40 }, from: ['ironwood', 'platescrap'], icon: '⬢', color: '#ff8a50', tags: ['Vanguard', 'Fighter'], passive: 'Taking physical hits grants +4 armor (stacks 5x, 4s).' }),
  I({ id: 'quietindex', name: 'Quiet Index', tier: 'complete', cat: 'ability', cost: 2300, stats: { ap: 52, haste: 15, mana: 300 }, from: ['glyph', 'inkwell'], icon: '☷', color: '#7a8cff', tags: ['Mage', 'Support'], passive: 'Hitting with an ability from beyond 7m refunds 1s of its cooldown (once per cast).' }),
  I({ id: 'beacon', name: 'Beacon Loom', tier: 'complete', cat: 'support', cost: 2000, stats: { hp: 280, ward: 22, manaRegen: 3, shieldPower: 0.14, ap: 20 }, from: ['mote', 'veilthread'], icon: '✺', color: '#7ff0d0', tags: ['Support', 'Mage'], passive: 'Shielding an ally briefly reveals the area around them.' }),
  I({ id: 'nullbell', name: 'Null Bell', tier: 'complete', cat: 'support', cost: 2100, stats: { hp: 320, ward: 38 }, from: ['veilthread', 'ironwood'], icon: '🔔', color: '#d0c8ff', tags: ['Support', 'Vanguard', 'Mage'], active: 'Cleanse yourself of slows, roots, silences and stuns (not airborne). 90s cooldown.' }),
  I({ id: 'glassfang', name: 'Glassfang', tier: 'complete', cat: 'attack', cost: 2500, stats: { ad: 48, pen: 0.28 }, from: ['keenedge', 'sinew'], icon: '◆', color: '#ff6a9a', tags: ['Marksman', 'Assassin'], passive: '28% armor penetration.' }),
  I({ id: 'tithe', name: 'Tithe Reaper', tier: 'complete', cat: 'attack', cost: 2300, stats: { ad: 32, hp: 300, lifesteal: 0.1 }, from: ['sinew', 'ironwood'], icon: '☽', color: '#e04a5a', tags: ['Fighter', 'Assassin', 'Vanguard'], passive: '10% lifesteal on attacks.' }),
  I({ id: 'thornmail', name: 'Thornwoven Mail', tier: 'complete', cat: 'defense', cost: 2100, stats: { armor: 56, hpRegen: 4, hp: 200 }, from: ['platescrap', 'mote'], icon: '✱', color: '#7ab870', tags: ['Vanguard', 'Fighter'], passive: 'Reflect 25 + 20% armor physical damage to attackers.' }),
  I({ id: 'aethercrown', name: 'Aether Crown', tier: 'complete', cat: 'ability', cost: 2400, stats: { ap: 80, apPct: 0.15 }, from: ['glyph', 'glyph'], icon: '♛', color: '#ff7ad8', tags: ['Mage', 'Support'], passive: '+15% ability power.' }),
  I({ id: 'tempest', name: 'Tempest Compass', tier: 'complete', cat: 'ability', cost: 2300, stats: { ap: 42, haste: 22, ms: 0.12, mana: 200 }, from: ['inkwell', 'glyph'], icon: '✢', color: '#6af0ff', tags: ['Mage', 'Support', 'Assassin'] }),
  I({ id: 'aegis', name: "Warden's Aegis", tier: 'complete', cat: 'defense', cost: 2400, stats: { hp: 360, armor: 36, ward: 36 }, from: ['platescrap', 'veilthread'], icon: '⬣', color: '#9ab0ff', tags: ['Vanguard', 'Fighter', 'Support'] }),
  I({ id: 'maul', name: "Siegewright's Maul", tier: 'complete', cat: 'attack', cost: 2300, stats: { as: 0.26, hp: 260, ad: 20, structDmg: 0.25 }, from: ['gale', 'ironwood'], icon: '🔨', color: '#d08a50', tags: ['Fighter', 'Marksman', 'Vanguard'], passive: '+25% damage to structures.' }),
  // boots upgrades
  I({ id: 'riverglass', name: 'Riverglass Boots', tier: 'boots', cat: 'movement', cost: 1050, stats: { ms: 0.45 }, from: ['swiftsole', 'mote'], icon: '🥾', color: '#6fd8ff', tags: ['Marksman', 'Assassin', 'Mage', 'Support', 'Fighter'], passive: 'In the river and out of combat: +0.5 move speed.' }),
  I({ id: 'stalwart', name: 'Stalwart Treads', tier: 'boots', cat: 'defense', cost: 1100, stats: { ms: 0.35, armor: 20, ward: 20 }, from: ['swiftsole', 'platescrap'], icon: '🛡', color: '#b0bcd8', tags: ['Vanguard', 'Fighter', 'Support'] }),
  // consumables
  I({ id: 'draught', name: "Mender's Draught", tier: 'consumable', cat: 'support', cost: 70, stats: {}, icon: '⚱', color: '#ff7a7a', tags: ['Support', 'Vanguard', 'Fighter', 'Marksman', 'Mage', 'Assassin'], active: 'Restore 200 health over 6s. 3 charges per slot.' }),
  I({ id: 'phial', name: 'Clarity Phial', tier: 'consumable', cat: 'ability', cost: 60, stats: {}, icon: '⚗', color: '#7aa8ff', tags: ['Support', 'Mage', 'Marksman', 'Vanguard', 'Fighter', 'Assassin'], active: 'Restore 120 mana or energy over 4s. 3 charges per slot.' }),
];
export const ITEM_BY_ID: Record<string, ItemDef> = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

export const STAT_LABEL: Record<string, string> = {
  hp: 'Health', mana: 'Mana', ad: 'Attack Damage', ap: 'Ability Power', as: 'Attack Speed', armor: 'Armor', ward: 'Ward', ms: 'Move Speed',
  haste: 'Ability Haste', pen: 'Armor Penetration', lifesteal: 'Lifesteal', hpRegen: 'Health Regen', manaRegen: 'Mana Regen',
  shieldPower: 'Shield Power', apPct: 'Ability Power %', structDmg: 'Structure Damage', monsterDmg: 'Monster Damage', passiveGold: 'Gold / s', wardCharges: 'Ward Charges',
};
export function formatStat(k: string, v: number): string {
  const pct = ['as', 'pen', 'lifesteal', 'shieldPower', 'apPct', 'structDmg', 'monsterDmg'];
  if (pct.includes(k)) return `+${Math.round(v * 100)}% ${STAT_LABEL[k]}`;
  if (k === 'ms') return `+${v.toFixed(2)} ${STAT_LABEL[k]}`;
  return `+${v} ${STAT_LABEL[k] ?? k}`;
}

// ---------------------------------------------------------------- Game constants
export const TICK_RATE = 30;
export const DT = 1 / TICK_RATE;
export const MAX_LEVEL = 12;
export const XP_TO_LEVEL = [0, 0, 200, 450, 750, 1100, 1500, 1950, 2450, 3000, 3600, 4250, 4950]; // index = level
export const START_GOLD = 500;
export const PASSIVE_GOLD = 1.7; // per second
export const RECALL_TIME = 7;
export const SHOP_RANGE = 11;
export const SELL_RATE = 0.65;
export const WAVE_FIRST = 14;
export const WAVE_PERIOD = 30;
export const CATALYST_SPAWN = 210;
export const CATALYST_RESPAWN = 240;
export const COLOSSUS_SPAWN = 540;
export const COLOSSUS_RESPAWN = 360;
export const SEAL_RESPAWN = 240;
