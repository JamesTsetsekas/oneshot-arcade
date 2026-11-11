// shared-content: non-hero unit definitions and global rule constants.

export interface NpcDef {
  name: string;
  hp: number;
  ad: number;
  as: number;
  range: number;
  speed: number;
  radius: number;
  armor: number;
  ward: number;
  missile: number; // missile speed, 0 = melee
  windup: number;
  gold: number;
  xp: number;
  vision: number;
}

export const MINIONS: Record<string, NpcDef> = {
  guard: { name: 'Guard', hp: 430, ad: 15, as: 0.8, range: 1.3, speed: 3.25, radius: 0.5, armor: 8, ward: 0, missile: 0, windup: 0.3, gold: 21, xp: 40, vision: 7.5 },
  bolt: { name: 'Bolt', hp: 270, ad: 23, as: 0.7, range: 5.5, speed: 3.25, radius: 0.45, armor: 0, ward: 0, missile: 15, windup: 0.3, gold: 15, xp: 27, vision: 7.5 },
  siege: { name: 'Siege', hp: 820, ad: 42, as: 0.5, range: 7.2, speed: 3.25, radius: 0.75, armor: 25, ward: 25, missile: 13, windup: 0.35, gold: 45, xp: 62, vision: 8 },
  vanguard: { name: 'Vanguard', hp: 1500, ad: 70, as: 0.75, range: 1.6, speed: 3.25, radius: 0.85, armor: 35, ward: 20, missile: 0, windup: 0.3, gold: 40, xp: 70, vision: 8 },
};

export const MONSTERS: Record<string, NpcDef & { respawn: number; count: number; buff?: string; big?: boolean }> = {
  thorn: { name: 'Thornling', hp: 300, ad: 10, as: 1.0, range: 1.3, speed: 3.6, radius: 0.45, armor: 5, ward: 5, missile: 0, windup: 0.25, gold: 18, xp: 42, vision: 0, respawn: 75, count: 3 },
  moss: { name: 'Mossback', hp: 820, ad: 27, as: 0.6, range: 1.5, speed: 3.3, radius: 0.85, armor: 18, ward: 10, missile: 0, windup: 0.4, gold: 55, xp: 125, vision: 0, respawn: 75, count: 1 },
  brass: { name: 'Brassmaw', hp: 1150, ad: 32, as: 0.7, range: 4.5, speed: 3.3, radius: 0.95, armor: 22, ward: 18, missile: 14, windup: 0.35, gold: 80, xp: 170, vision: 0, respawn: 100, count: 1, buff: 'brass' },
  mist: { name: 'Mistwarden', hp: 1100, ad: 30, as: 0.65, range: 1.8, speed: 3.3, radius: 0.95, armor: 16, ward: 26, missile: 0, windup: 0.4, gold: 80, xp: 170, vision: 0, respawn: 100, count: 1, buff: 'mist' },
  catalystN: { name: 'Gale Catalyst', hp: 2600, ad: 50, as: 0.7, range: 2.4, speed: 3.0, radius: 1.5, armor: 25, ward: 25, missile: 0, windup: 0.4, gold: 60, xp: 240, vision: 0, respawn: 240, count: 1, big: true },
  catalystS: { name: 'Forge Catalyst', hp: 2600, ad: 50, as: 0.7, range: 2.4, speed: 3.0, radius: 1.5, armor: 25, ward: 25, missile: 0, windup: 0.4, gold: 60, xp: 240, vision: 0, respawn: 240, count: 1, big: true },
  colossus: { name: 'Aether Colossus', hp: 6000, ad: 90, as: 0.6, range: 3.2, speed: 2.8, radius: 2.3, armor: 45, ward: 45, missile: 0, windup: 0.45, gold: 110, xp: 420, vision: 0, respawn: 360, count: 1, big: true },
};

export const STRUCTS: Record<string, { name: string; hp: number; ad: number; armor: number; ward: number; gold: number }> = {
  outer: { name: 'Outer Tower', hp: 1700, ad: 135, armor: 40, ward: 40, gold: 130 },
  inner: { name: 'Inner Tower', hp: 1950, ad: 155, armor: 48, ward: 48, gold: 150 },
  guard: { name: 'Seal Guard Tower', hp: 2100, ad: 175, armor: 52, ward: 52, gold: 170 },
  seal: { name: 'Seal', hp: 1700, ad: 0, armor: 45, ward: 45, gold: 150 },
  core: { name: 'Core Tower', hp: 1900, ad: 185, armor: 52, ward: 52, gold: 150 },
  engine: { name: 'Crown Engine', hp: 3000, ad: 0, armor: 40, ward: 40, gold: 0 },
};

export const RULES = {
  towerRange: 8.5,
  towerAs: 0.95,
  towerMissile: 19,
  towerRampMax: 4,
  towerRampStep: 0.25,
  heroVision: 11,
  structVision: 9.5,
  wardVision: 9,
  wardDuration: 90,
  wardCharges: 2,
  wardRecharge: 55,
  wardCapPerTeam: 5,
  wardRange: 6,
  xpRange: 14,
  xpShare: [1, 0.62, 0.46],
  passiveGold: 1.7, // per second
  startGold: 500,
  recallTime: 7,
  recallTimeBuffed: 4,
  assistWindow: 10,
  backdoorRange: 13,
  backdoorMult: 0.3,
  minionVsHero: 0.6,
  siegeVsStruct: 2.6,
  minionVsStruct: 0.8,
  heroVsStruct: 1.0,
  apVsStruct: 0.6,
  waveInterval: 30,
  firstWave: 15,
  sealRespawn: 240,
  killGold: 200,
  assistGold: 110,
  fountainDps: 420,
  catalystFirst: 210,
  colossusFirst: 540,
  campFirst: 40,
  colossusBuff: 150,
  catalystBuff: 240,
  hushVision: 4,
};

export const TEAM_NAMES = ['Azure Guild', 'Coral Guild'];
export const BOT_NAMES = ['Tamsin', 'Okoro', 'Lirael', 'Fenwick', 'Mireya', 'Dask', 'Ilsabet', 'Corvin', 'Wren', 'Halden'];
