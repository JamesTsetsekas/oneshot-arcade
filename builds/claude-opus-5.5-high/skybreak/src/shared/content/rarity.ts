// Rarity tiers. Each tier is identified by colour AND shape AND name prefix so
// value judgements survive colour-blindness. Curves are data, not code.

export type Rarity = 0 | 1 | 2 | 3 | 4;

export interface RarityDef {
  id: Rarity;
  name: string;
  shape: 'circle' | 'chevron' | 'diamond' | 'crown' | 'star';
  glyph: string;
  color: string;
  /** Colour-blind-safe alternative palette (Okabe–Ito based). */
  colorAlt: string;
  damageMult: number;
  reloadMult: number;
  handlingMult: number; // equip/swap speed multiplier on time
  recoilMult: number;
  spreadMult: number;
}

export const RARITIES: readonly RarityDef[] = [
  { id: 0, name: 'Field', shape: 'circle', glyph: '●', color: '#b8bcc4', colorAlt: '#c8c8c8', damageMult: 1.0, reloadMult: 1.0, handlingMult: 1.0, recoilMult: 1.0, spreadMult: 1.0 },
  { id: 1, name: 'Tuned', shape: 'chevron', glyph: '⌃', color: '#5fd068', colorAlt: '#009e73', damageMult: 1.03, reloadMult: 0.95, handlingMult: 0.92, recoilMult: 1.0, spreadMult: 1.0 },
  { id: 2, name: 'Advanced', shape: 'diamond', glyph: '◆', color: '#4aa8ff', colorAlt: '#56b4e9', damageMult: 1.055, reloadMult: 0.93, handlingMult: 0.9, recoilMult: 0.85, spreadMult: 0.88 },
  { id: 3, name: 'Masterwork', shape: 'crown', glyph: '♛', color: '#b77cff', colorAlt: '#cc79a7', damageMult: 1.075, reloadMult: 0.92, handlingMult: 0.88, recoilMult: 0.8, spreadMult: 0.85 },
  { id: 4, name: 'Prototype', shape: 'star', glyph: '★', color: '#ffc23d', colorAlt: '#e69f00', damageMult: 1.09, reloadMult: 0.92, handlingMult: 0.88, recoilMult: 0.8, spreadMult: 0.85 },
];

export const rarity = (r: number) => RARITIES[Math.max(0, Math.min(4, r))];
