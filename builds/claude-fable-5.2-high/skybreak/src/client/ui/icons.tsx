// client-ui: original vector icons. Rarity is always communicated by shape AND colour.
import type { ReactElement } from "react";
import type { ItemId } from "../../shared/content/items";
import { RARITIES, type AmmoType, type RarityShape, type WeaponId } from "../../shared/content/weapons";

const WEAPON_PATHS: Record<WeaponId, ReactElement> = {
  wayfarer: (
    <g>
      <rect x="6" y="13" width="14" height="7" rx="1.5" />
      <rect x="18" y="11" width="22" height="8" rx="2" />
      <rect x="40" y="13" width="18" height="3.4" rx="1.2" />
      <rect x="57" y="12" width="4" height="5.4" rx="1" />
      <path d="M27 19 l6 0 l-2 9 l-6 0z" />
      <rect x="22" y="8.6" width="3" height="2.6" /><rect x="28" y="8.6" width="3" height="2.6" /><rect x="34" y="8.6" width="3" height="2.6" />
    </g>
  ),
  tempest: (
    <g>
      <rect x="8" y="13" width="12" height="6" rx="1.5" />
      <rect x="18" y="10" width="20" height="9" rx="2" />
      <rect x="38" y="11.5" width="18" height="2.4" rx="1" /><rect x="38" y="15" width="18" height="2.4" rx="1" />
      <circle cx="29" cy="23" r="5.5" />
      <path d="M20 19 l5 0 l-2 7 l-5 0z" />
    </g>
  ),
  breakwater: (
    <g>
      <path d="M4 14 l14 -2 l0 8 l-14 3z" />
      <rect x="17" y="11" width="16" height="8" rx="2" />
      <rect x="33" y="12.5" width="18" height="4.6" rx="1.4" />
      <path d="M50 14.8 l10 -6 l0 12z" />
      <rect x="34" y="18.5" width="11" height="3.4" rx="1.4" />
    </g>
  ),
  coil: (
    <g>
      <rect x="6" y="13" width="13" height="7" rx="1.5" />
      <rect x="18" y="11" width="16" height="8" rx="2" />
      <rect x="34" y="13" width="20" height="4" rx="1.4" />
      <rect x="37" y="9.5" width="2.6" height="11" rx="1" /><rect x="42.5" y="9.5" width="2.6" height="11" rx="1" /><rect x="48" y="9.5" width="2.6" height="11" rx="1" />
      <path d="M54 15 l7 -4 l0 8z" />
      <path d="M21 19 l5 0 l-2 7 l-5 0z" />
    </g>
  ),
  needler: (
    <g>
      <rect x="12" y="13" width="9" height="4" rx="1.4" />
      <rect x="20" y="11" width="16" height="9" rx="2" />
      <rect x="36" y="14.2" width="20" height="1.8" rx="0.9" />
      <path d="M55 15.1 l6 -2.4 l0 4.8z" />
      <rect x="25" y="2.5" width="5" height="9" rx="1.2" />
      <path d="M23 20 l5 0 l-2 7 l-5 0z" />
    </g>
  ),
  sundial: (
    <g>
      <path d="M3 14 l14 -1.6 l0 7.4 l-14 2.4z" />
      <rect x="16" y="12" width="20" height="7" rx="2" />
      <rect x="36" y="13.6" width="23" height="3" rx="1.2" />
      <rect x="58" y="12.6" width="3.5" height="5" rx="1" />
      <circle cx="24" cy="8" r="4.6" /><rect x="23.4" y="2.5" width="1.2" height="6" fill="#0b2a3a" />
      <path d="M27 19 l5 0 l-1.5 6 l-5 0z" />
    </g>
  ),
  longwake: (
    <g>
      <rect x="5" y="13" width="13" height="7" rx="1.5" />
      <rect x="17" y="11" width="14" height="9" rx="2" />
      <rect x="31" y="11.4" width="30" height="2.2" rx="1" /><rect x="31" y="17.2" width="30" height="2.2" rx="1" />
      <rect x="33" y="14.4" width="26" height="1.6" rx="0.8" opacity="0.6" />
      <rect x="18" y="5.5" width="13" height="4" rx="2" />
      <path d="M20 20 l5 0 l-2 7 l-5 0z" />
    </g>
  ),
  harbor: (
    <g>
      <rect x="20" y="10" width="26" height="8" rx="2" />
      <rect x="45" y="11.6" width="5" height="4.8" rx="1.4" />
      <path d="M22 18 l8 0 l-3 11 l-8 0z" />
      <rect x="36" y="7.6" width="3" height="2.4" />
    </g>
  ),
  gale: (
    <g>
      <rect x="6" y="14" width="10" height="6" rx="1.5" />
      <rect x="15" y="9.5" width="26" height="12" rx="5" />
      <path d="M40 15.5 l16 -9 l0 18z" />
      <rect x="18" y="8" width="2.4" height="15" /><rect x="23" y="8" width="2.4" height="15" /><rect x="28" y="8" width="2.4" height="15" />
      <path d="M28 21.5 l5 0 l-2 7 l-5 0z" />
    </g>
  ),
};

export function WeaponIcon({ id, size = 64 }: { id: WeaponId; size?: number }): ReactElement {
  return (
    <svg viewBox="0 0 64 32" width={size} height={size / 2} fill="currentColor" aria-hidden="true">
      {WEAPON_PATHS[id]}
    </svg>
  );
}

const ITEM_PATHS: Record<ItemId, ReactElement> = {
  injector: (
    <g>
      <rect x="12" y="8" width="8" height="15" rx="2" /><rect x="10.5" y="5" width="11" height="3.4" rx="1.4" /><rect x="15.2" y="23" width="1.6" height="6" />
      <rect x="14" y="12" width="4" height="1.6" fill="#0b2a3a" /><rect x="15.2" y="10.8" width="1.6" height="4" fill="#0b2a3a" />
    </g>
  ),
  trauma: (
    <g>
      <rect x="4" y="9" width="24" height="17" rx="3" /><rect x="12" y="5.5" width="8" height="4" rx="1.6" />
      <rect x="14.2" y="12.5" width="3.6" height="10" fill="#0b2a3a" /><rect x="11" y="15.7" width="10" height="3.6" fill="#0b2a3a" />
    </g>
  ),
  flask: (
    <g>
      <path d="M13 4 h6 v7 l6 10 a5 5 0 0 1 -4.4 7.5 h-9.2 a5 5 0 0 1 -4.4 -7.5 l6 -10z" />
      <path d="M10.5 21 h11 l1.6 3 a2 2 0 0 1 -1.8 3 h-10.6 a2 2 0 0 1 -1.8 -3z" fill="#0b2a3a" opacity="0.45" />
    </g>
  ),
  cell: (
    <g>
      <path d="M16 3 l10 6 v14 l-10 6 l-10 -6 v-14z" />
      <path d="M17.5 9 l-6 8.5 h4.5 l-1.5 6 l6 -8.5 h-4.5z" fill="#0b2a3a" />
    </g>
  ),
  mist: (
    <g>
      <circle cx="12" cy="18" r="7" /><circle cx="20" cy="14" r="7.5" /><circle cx="21.5" cy="21.5" r="5.5" />
    </g>
  ),
  grapple: (
    <g>
      <circle cx="12" cy="20" r="8" /><circle cx="12" cy="20" r="3.4" fill="#0b2a3a" />
      <path d="M18 14 l8 -8 M26 6 l-5 0.5 M26 6 l-0.5 5" stroke="currentColor" strokeWidth="2.6" fill="none" strokeLinecap="round" />
    </g>
  ),
  beacon: (
    <g>
      <path d="M16 13 l6 14 h-12z" />
      <circle cx="16" cy="9" r="3" />
      <path d="M8 4 a11 11 0 0 0 0 10 M24 4 a11 11 0 0 1 0 10" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </g>
  ),
  orb: (
    <g>
      <circle cx="16" cy="16" r="9" />
      <path d="M5 16 a11 5 0 0 0 22 0" stroke="#0b2a3a" strokeWidth="2" fill="none" />
      <path d="M3 9 l5 2 M29 9 l-5 2 M16 2 v4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </g>
  ),
};

export function ItemIcon({ id, size = 32 }: { id: ItemId; size?: number }): ReactElement {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="currentColor" aria-hidden="true">
      {ITEM_PATHS[id]}
    </svg>
  );
}

export const AMMO_COLORS: Record<AmmoType, string> = { light: "#e9dfc6", shell: "#ff7b6b", heavy: "#f4b63a", charge: "#c79bff" };

export function AmmoIcon({ type, size = 16 }: { type: AmmoType; size?: number }): ReactElement {
  const c = AMMO_COLORS[type];
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true">
      {type === "light" && <g fill={c}><rect x="2" y="5" width="3" height="9" rx="1" /><rect x="6.5" y="5" width="3" height="9" rx="1" /><rect x="11" y="5" width="3" height="9" rx="1" /><path d="M2 5 l1.5 -3 l1.5 3z M6.5 5 l1.5 -3 l1.5 3z M11 5 l1.5 -3 l1.5 3z" /></g>}
      {type === "shell" && <g fill={c}><rect x="2.5" y="3" width="4.6" height="11" rx="1.2" /><rect x="9" y="3" width="4.6" height="11" rx="1.2" /><rect x="2.5" y="10.5" width="4.6" height="3.5" fill="#c9793d" /><rect x="9" y="10.5" width="4.6" height="3.5" fill="#c9793d" /></g>}
      {type === "heavy" && <g fill={c}><path d="M5 14 v-8 l3 -5 l3 5 v8z" /></g>}
      {type === "charge" && <g fill={c}><path d="M9.5 1 l-6 8.4 h4 l-1.5 5.6 l6.5 -8.6 h-4.2z" /></g>}
    </svg>
  );
}

const SHAPES: Record<RarityShape, ReactElement> = {
  circle: <circle cx="8" cy="8" r="5.6" />,
  chevron: <path d="M8 1.5 l6.4 6.5 v5 l-6.4 -6.2 l-6.4 6.2 v-5z" />,
  diamond: <path d="M8 1 l5.6 7 l-5.6 7 l-5.6 -7z" />,
  crown: <path d="M1.5 13.5 v-9.5 l3.3 4 l3.2 -6 l3.2 6 l3.3 -4 v9.5z" />,
  star: <path d="M8 0.8 l2.1 4.6 l5 0.6 l-3.7 3.4 l1 5 l-4.4 -2.5 l-4.4 2.5 l1 -5 l-3.7 -3.4 l5 -0.6z" />,
};

export function RarityMark({ rarity, size = 14 }: { rarity: number; size?: number }): ReactElement {
  const r = RARITIES[rarity] ?? RARITIES[0]!;
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} fill={r.color} stroke="rgba(8,28,40,0.7)" strokeWidth="1" aria-label={r.name}>
      {SHAPES[r.shape]}
    </svg>
  );
}
