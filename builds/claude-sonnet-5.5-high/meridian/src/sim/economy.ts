import { WEAPONS } from './weapons';
import type { AmmoType } from './weapons';
import type { Inventory, PlayerState } from './types';

export const TRUST_THRESHOLDS = [0, 1, 3, 6, 10, 15]; // trust xp needed for level 0..5

export function trustLevel(xp: number): number {
  let lvl = 0;
  for (let i = 0; i < TRUST_THRESHOLDS.length; i++) if (xp >= TRUST_THRESHOLDS[i]) lvl = i;
  return lvl;
}

export function newInventory(): Inventory {
  return {
    sidearm: 'pistol', longGun: null, melee: 'baton', gadgets: ['smoke', 'chirper'],
    ammo: { pistol: 36, smg: 0, rifle: 0, shell: 0, dmr: 0, stun: 0, none: 0 },
    mags: { pistol: 12 },
    gadgetCount: { smoke: 1, chirper: 1 },
    medkits: 1, armorPlates: 0, owned: ['baton', 'pistol'],
  };
}

export interface ShopItem {
  id: string;
  label: string;
  desc: string;
  price: number;
  /** Returns a reason string if unavailable. */
  blocked: (p: PlayerState) => string | null;
  apply: (p: PlayerState) => void;
  where: Array<'store' | 'safehouse' | 'garage' | 'kiosk'>;
}

const ammoItem = (id: string, ammo: AmmoType): ShopItem => {
  const w = WEAPONS[id];
  return {
    id: 'ammo-' + id, label: `${w.name}: ammo pack (+${w.pack})`, desc: `${w.pack} rounds of ${ammo} ammunition.`, price: w.price,
    where: ['store'],
    blocked: (p) => (!p.inv.owned.includes(id) ? 'Weapon not owned' : p.inv.ammo[ammo] >= w.pack * 6 ? 'Ammo full' : null),
    apply: (p) => { p.inv.ammo[ammo] = (p.inv.ammo[ammo] ?? 0) + w.pack; },
  };
};

const weaponItem = (id: string, price: number): ShopItem => {
  const w = WEAPONS[id];
  return {
    id: 'buy-' + id, label: `${w.name}`, desc: `${w.desc} ${w.lethal ? '[Lethal]' : '[Non-lethal]'}`, price, where: ['store'],
    blocked: (p) => (p.inv.owned.includes(id) ? 'Owned' : p.trust < w.unlockTrust ? `Requires Trust ${w.unlockTrust}` : null),
    apply: (p) => {
      p.inv.owned.push(id);
      if (w.slot === 'long') p.inv.longGun = id;
      if (w.slot === 'sidearm' && id === 'stun') { /* stun is selectable as sidearm alt */ }
      p.inv.ammo[w.ammo] = (p.inv.ammo[w.ammo] ?? 0) + w.pack;
      p.inv.mags[id] = w.mag;
    },
  };
};

export const SHOP: ShopItem[] = [
  { id: 'medkit', label: 'Medical kit', desc: 'Restores 60 health. Carry up to 2. (Z)', price: 35, where: ['store'], blocked: (p) => (p.inv.medkits >= 2 ? 'Carrying 2 already' : null), apply: (p) => { p.inv.medkits++; } },
  { id: 'armor', label: 'Armor plate', desc: 'Light armor, absorbs about half of incoming damage. Degrades.', price: 60, where: ['store'], blocked: (p) => (p.human.armor >= 50 ? 'Armor full' : null), apply: (p) => { p.human.armor = 50; } },
  { id: 'smoke', label: 'Smoke canister', desc: 'Blocks sight lines. Carry up to 3.', price: 25, where: ['store'], blocked: (p) => ((p.inv.gadgetCount.smoke ?? 0) >= 3 ? 'Carrying 3 already' : null), apply: (p) => { p.inv.gadgetCount.smoke = (p.inv.gadgetCount.smoke ?? 0) + 1; } },
  { id: 'chirper', label: 'Distraction chirper', desc: 'Draws attention, cancels nearby witness calls. Carry up to 3.', price: 20, where: ['store'], blocked: (p) => ((p.inv.gadgetCount.chirper ?? 0) >= 3 ? 'Carrying 3 already' : null), apply: (p) => { p.inv.gadgetCount.chirper = (p.inv.gadgetCount.chirper ?? 0) + 1; } },
  ammoItem('pistol', 'pistol'),
  weaponItem('stun', 180),
  weaponItem('mp', 320),
  ammoItem('mp', 'smg'),
  weaponItem('carbine', 520),
  ammoItem('carbine', 'rifle'),
  weaponItem('shotgun', 420),
  ammoItem('shotgun', 'shell'),
  weaponItem('dmr', 700),
  ammoItem('dmr', 'dmr'),
];

export function canAfford(p: PlayerState, price: number): boolean { return p.cash >= price; }

export function buy(p: PlayerState, item: ShopItem): { ok: boolean; reason?: string } {
  const b = item.blocked(p);
  if (b) return { ok: false, reason: b };
  if (!canAfford(p, item.price)) return { ok: false, reason: 'Not enough cash' };
  p.cash -= item.price;
  item.apply(p);
  return { ok: true };
}

export function repairCost(health: number, maxHealth: number): number {
  return Math.round((maxHealth - health) * 1.4);
}

export const OUTFITS = ['Courier Orange', 'Harbor Navy', 'Tide Stripe', 'Copper Check', 'Night Grey'];
export const OUTFIT_PRICE = 45;
