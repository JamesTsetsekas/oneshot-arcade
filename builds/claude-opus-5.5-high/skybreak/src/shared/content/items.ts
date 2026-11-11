// Consumables and utilities. Every entry occupies one of the five universal slots.

export type ItemId =
  | 'med' | 'trauma' | 'flask' | 'aegis_cell'
  | 'mist' | 'grapple' | 'echo' | 'wind_orb';

export interface ItemDef {
  id: ItemId;
  name: string;
  short: string;
  kind: 'heal' | 'shield' | 'utility' | 'throwable';
  stack: number;
  /** Use duration in seconds (0 = instant/thrown). */
  useTime: number;
  /** Movement speed multiplier while using. */
  moveMult: number;
  /** Cancelled by taking damage? */
  interruptible: boolean;
  heal?: number; // health restored over use
  healTo?: number;
  reserve?: number;
  blurb: string;
  color: string;
}

export const ITEMS: Record<ItemId, ItemDef> = {
  med: { id: 'med', name: 'Med Injector', short: 'MED', kind: 'heal', stack: 4, useTime: 3, moveMult: 0.55, interruptible: false, heal: 35, blurb: 'Restores 35 Health over 3s. Slows movement.', color: '#ff6b6b' },
  trauma: { id: 'trauma', name: 'Trauma Kit', short: 'KIT', kind: 'heal', stack: 2, useTime: 7, moveMult: 0.25, interruptible: true, healTo: 100, blurb: 'Restores Health to 100 over 7s. Cancelled by damage.', color: '#ff3d6e' },
  flask: { id: 'flask', name: 'Shield Flask', short: 'FLSK', kind: 'shield', stack: 4, useTime: 2.5, moveMult: 0.6, interruptible: false, reserve: 25, blurb: 'Adds 25 Reserve Shield over 2.5s (max 50).', color: '#a46bff' },
  aegis_cell: { id: 'aegis_cell', name: 'Aegis Cell', short: 'CELL', kind: 'shield', stack: 2, useTime: 3, moveMult: 0.6, interruptible: true, blurb: 'After 3s, Aegis begins recharging immediately. No Reserve.', color: '#4ad8ff' },
  mist: { id: 'mist', name: 'Mist Capsule', short: 'MIST', kind: 'throwable', stack: 2, useTime: 0, moveMult: 1, interruptible: false, blurb: 'Thrown. Creates a 7m cloud of visual cover for 14s.', color: '#d9e6ee' },
  grapple: { id: 'grapple', name: 'Grapple Spool', short: 'HOOK', kind: 'utility', stack: 3, useTime: 0, moveMult: 1, interruptible: false, blurb: 'Three charges. Pulls you to terrain up to 48m away.', color: '#ffb347' },
  echo: { id: 'echo', name: 'Echo Beacon', short: 'ECHO', kind: 'utility', stack: 2, useTime: 0, moveMult: 1, interruptible: false, blurb: 'Reveals movement trails within 70m for 8s (direction and age only).', color: '#7cffd4' },
  wind_orb: { id: 'wind_orb', name: 'Wind Orb', short: 'ORB', kind: 'throwable', stack: 3, useTime: 0, moveMult: 1, interruptible: false, blurb: 'Thrown concussive orb. Low damage, strong displacement.', color: '#9fe8ff' },
};

export const ITEM_IDS = Object.keys(ITEMS) as ItemId[];
