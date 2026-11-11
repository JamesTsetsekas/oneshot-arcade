// client-ui: original vector pictograms for heroes, abilities, items and talents. Everything is
// authored here as inline SVG — no external icon packs.

import type { CSSProperties, ReactElement } from 'react';
import { HEROES, HeroId } from '../../shared/heroes';
import { ITEMS, TALENTS, TalentId } from '../../shared/items';

const S = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

const P: Record<string, string> = {
  // heroes
  brannoch: `<path d="M7 9h10l3 12H4z"/><rect x="4" y="2.5" width="16" height="5" rx="1"/>`,
  suri: `<path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-4 3-7 1 2 2 2 3-5z"/>`,
  oru: `<path d="M12 9C9 3 3 4 3 9s5 6 9 3zM12 9c3-6 9-5 9 0s-5 6-9 3zM12 14c-3 0-6 2-5 5s4 1 5-2zM12 14c3 0 6 2 5 5s-4 1-5-2z"/><path d="M12 6v14" ${S}/>`,
  kesh: `<path d="M5 21c0-9 2-14 5-18 0 6 0 11-1 18zM11 21c0-8 1-12 4-16 0 6 0 10-1 16zM17 21c0-6 1-9 3-12 0 5 0 8-1 12z"/>`,
  ilyra: `<path d="M20 3C10 4 6 10 5 17l-2 4 4-2c7-1 12-6 13-16z"/>`,
  vey: `<path d="M12 2l4 8-4 12-4-12z"/><path d="M4 8l3 5-2 6-2-6zM20 8l2 5-1 6-3-6z"/>`,
  // abilities
  fault_hammer: `<rect x="5" y="4" width="12" height="6" rx="1"/><rect x="9.5" y="10" width="3" height="10" rx="1"/><path d="M17 14l3 2-2 2 3 3" ${S}/>`,
  rampart_fold: `<path d="M3 17A10 10 0 0 1 21 17" ${S} stroke-width="5"/><path d="M8 9l1 5M16 9l-1 5M12 7v5" stroke="#0009" stroke-width="1.4" fill="none"/>`,
  anchor_line: `<circle cx="12" cy="5" r="2" ${S}/><path d="M12 7v13M5 13a7 7 0 0 0 14 0M8 11h8" ${S}/>`,
  citybreaker: `<path d="M12 2l2.5 6.5L21 9l-5 4.5L17.5 21 12 17l-5.5 4L8 13.5 3 9l6.5-.5z"/>`,
  ricochet_bolt: `<path d="M3 18l6-9 5 5 7-10" ${S}/><path d="M16 4h5v5" ${S}/>`,
  slipstream: `<path d="M4 6l6 6-6 6M11 6l6 6-6 6" ${S} stroke-width="2.6"/>`,
  parcel_charge: `<rect x="5" y="9" width="14" height="11" rx="1.5"/><path d="M12 9V5c0-1.5 2-2 3-1" ${S}/><circle cx="16.5" cy="3.5" r="1.6"/>`,
  redline_delivery: `<path d="M2 12h14" ${S} stroke-width="4"/><path d="M14 5l8 7-8 7z"/>`,
  luminous_swarm: `<circle cx="7" cy="8" r="2.5"/><circle cx="15" cy="6" r="2"/><circle cx="12" cy="13" r="3"/><circle cx="18" cy="14" r="2"/><circle cx="7" cy="17" r="2"/>`,
  hush_field: `<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z" ${S}/><circle cx="12" cy="12" r="2.5"/><path d="M4 20L20 4" ${S} stroke-width="2.6"/>`,
  guiding_draft: `<path d="M3 8h10a3 3 0 1 0-3-3M3 13h15a3 3 0 1 1-3 3M3 18h7" ${S}/>`,
  night_migration: `<path d="M3 7c3-3 6 3 9 0s6 3 9 0M3 12c3-3 6 3 9 0s6 3 9 0M3 17c3-3 6 3 9 0s6 3 9 0" ${S}/>`,
  reed_cleaver: `<path d="M5 19L17 4M9 21L21 7" ${S} stroke-width="3"/>`,
  bogskin: `<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/><path d="M8 9h8M7 13h10" stroke="#0008" stroke-width="1.5" fill="none"/>`,
  sinkstep: `<path d="M4 9a8 8 0 0 1 16 0" ${S}/><path d="M12 11v9M8 16l4 4 4-4" ${S}/>`,
  fen_claim: `<path d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z"/><path d="M3 21c2-1.5 4 1.5 6 0s4 1.5 6 0 4 1.5 6 0" ${S}/>`,
  linebreak: `<path d="M2 12h8M14 12h8" ${S} stroke-width="3.2"/><path d="M10 6l4 12" ${S}/>`,
  footnote: `<circle cx="12" cy="12" r="8.5" ${S}/><path d="M12 6v12M7 9l10 6M17 9L7 15" ${S}/>`,
  redaction: `<rect x="3" y="8" width="18" height="8" rx="1"/><path d="M5 4.5h9M5 19.5h13" ${S}/>`,
  final_draft: `<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="6.5" ${S}/><circle cx="12" cy="12" r="10" ${S}/>`,
  shardstep: `<path d="M15 3l5 8-5 10-4-10z"/><path d="M2 8h6M3 12h5M2 16h6" ${S}/>`,
  mirror_decoy: `<path d="M12 2v20" ${S} stroke-dasharray="2 3"/><path d="M9 6L4 18h5zM15 6l5 12h-5z"/>`,
  cut_the_light: `<circle cx="10" cy="10" r="5" ${S}/><path d="M3 21L21 3" ${S} stroke-width="3"/>`,
  prism_sentence: `<path d="M12 3l9 16H3z" ${S}/><circle cx="12" cy="14" r="2.2"/>`,
  // items
  chisel: `<path d="M14 3l7 7-3 3-7-7z"/><path d="M11 9L3 17l4 4 8-8z"/>`,
  satchel: `<path d="M5 9h14v11H5z"/><path d="M8 9V6a4 4 0 0 1 8 0v3" ${S}/>`,
  lantern: `<path d="M8 8h8l1 10H7z"/><path d="M9 8a3 3 0 0 1 6 0M12 2v3M8 21h8" ${S}/>`,
  fang: `<path d="M8 3h8c0 8-2 14-4 18-2-4-4-10-4-18z"/>`,
  inkpot: `<path d="M7 11h10l2 9H5z"/><path d="M9 11V8h6v3M14 8l5-6" ${S}/>`,
  shiv: `<path d="M19 3L9 13l2 2L21 5z"/><path d="M8 14l-4 4 2 2 4-4z"/>`,
  boot: `<path d="M8 3h6v10l6 3v4H6v-6z"/>`,
  boot2: `<path d="M8 2h6v9l6 3v3H6v-5z"/><path d="M3 21c2-1.5 4 1.5 6 0s4 1.5 6 0 4 1.5 6 0" ${S}/>`,
  boot3: `<path d="M8 3h6v10l6 3v4H6v-6z"/><path d="M8 7h6M8 11h6" stroke="#0009" stroke-width="1.6" fill="none"/>`,
  blade: `<path d="M12 2l3 4v9H9V6z"/><path d="M7 15h10M12 15v6" ${S}/>`,
  string: `<path d="M6 3c10 3 10 15 0 18" ${S} stroke-width="2.6"/><path d="M6 3v18" ${S} stroke-width="1.2"/>`,
  splinter: `<path d="M13 2l2 9 6 2-7 2-3 7-1-8-7-2 8-2z"/>`,
  shard: `<path d="M12 2l5 9-5 11-5-11z"/>`,
  lens: `<circle cx="10" cy="10" r="6" ${S}/><path d="M15 15l6 6" ${S} stroke-width="3"/>`,
  vial: `<path d="M9 3h6M10 3v6l-4 9a2 2 0 0 0 2 3h8a2 2 0 0 0 2-3l-4-9V3" ${S}/><path d="M8 16h8l1.5 3.5h-11z"/>`,
  token: `<circle cx="12" cy="12" r="9"/><path d="M8 12h8M12 8v8" stroke="#0008" stroke-width="2" fill="none"/>`,
  plate: `<path d="M5 4h14v7c0 5-3 8-7 10-4-2-7-5-7-10z"/><path d="M12 4v17" stroke="#0008" stroke-width="1.5" fill="none"/>`,
  thread: `<path d="M4 8c4-4 12 4 16 0M4 13c4-4 12 4 16 0M4 18c4-4 12 4 16 0" ${S}/>`,
  bow: `<path d="M5 3c12 2 12 16 0 18" ${S} stroke-width="2.6"/><path d="M5 3v18M5 12h15M16 8l4 4-4 4" ${S}/>`,
  maul: `<rect x="4" y="3" width="15" height="8" rx="1.5"/><path d="M11 11l-1 10h4l-1-10z"/>`,
  fangblade: `<path d="M6 21C6 10 10 5 19 2c-2 8-5 14-13 19z"/><path d="M3 22l5-5" ${S}/>`,
  glaive: `<path d="M4 21L16 9" ${S} stroke-width="2.6"/><path d="M13 5c5-3 8-1 8 3s-4 6-9 5z"/>`,
  index: `<path d="M4 4h7l1 1 1-1h7v15h-7l-1 1-1-1H4z"/><path d="M12 5v15" stroke="#0008" stroke-width="1.5" fill="none"/>`,
  aetherlens: `<circle cx="12" cy="12" r="8" ${S}/><circle cx="12" cy="12" r="3.6"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3" ${S}/>`,
  censer: `<path d="M6 13h12l-2 7H8z"/><path d="M12 13V9M9 6c0-2 3-2 3-4M14 7c0-2 2-2 2-4" ${S}/>`,
  cuirass: `<path d="M6 3l3 2h6l3-2 2 5-2 2v10H6V10L4 8z"/>`,
  mantle: `<path d="M12 3c5 0 8 3 9 18-3-2-6-2-9 0-3-2-6-2-9 0C4 6 7 3 12 3z"/>`,
  girdle: `<rect x="2" y="8" width="20" height="8" rx="2"/><rect x="9" y="6" width="6" height="12" rx="1" fill="#0007"/>`,
  loom: `<path d="M4 3v18M20 3v18M4 6h16M4 18h16" ${S}/><path d="M8 6v12M12 6v12M16 6v12" ${S} stroke-width="1.2"/>`,
  bell: `<path d="M12 3a6 6 0 0 1 6 6v6l2 3H4l2-3V9a6 6 0 0 1 6-6z"/><circle cx="12" cy="21" r="1.8"/>`,
  potion: `<path d="M10 2h4v5l4 6a5 5 0 0 1-4 8h-4a5 5 0 0 1-4-8l4-6z"/>`,
  phial: `<path d="M9 2h6v3l-1 1v4l3 8a2 2 0 0 1-2 3H9a2 2 0 0 1-2-3l3-8V6L9 5z"/>`,
  // talents / ui
  hop: `<path d="M4 18c2-12 14-12 16 0" ${S} stroke-dasharray="3 3"/><path d="M16 13l5 5 1-6z"/>`,
  mend: `<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>`,
  shield: `<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/>`,
  surge: `<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>`,
  flame: `<path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-4 3-7 1 2 2 2 3-5z"/>`,
  sunder: `<path d="M12 2l3 7-2 1 4 5-3 1 2 6-8-8 3-1-4-5 3-1z"/>`,
  coin: `<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4" stroke="#0008" stroke-width="1.6" fill="none"/>`,
  ward: `<path d="M12 2l5 7-5 7-5-7z"/><path d="M12 16v6" ${S}/>`,
  recall: `<path d="M12 21V8M6 13l6-6 6 6" ${S} stroke-width="2.6"/><path d="M5 3h14" ${S}/>`,
  passive: `<circle cx="12" cy="12" r="9" ${S}/><circle cx="12" cy="12" r="4"/>`,
  crown: `<path d="M3 19l2-12 5 6 2-9 2 9 5-6 2 12z"/>`,
  lock: `<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4" ${S}/>`,
  skull: `<path d="M12 2a8 8 0 0 0-8 8c0 3 1.5 5 3 6v4h10v-4c1.5-1 3-3 3-6a8 8 0 0 0-8-8z"/><circle cx="9" cy="11" r="1.8" fill="#000a"/><circle cx="15" cy="11" r="1.8" fill="#000a"/>`,
  tower: `<path d="M8 21l1-11H7V4h2v2h2V4h2v2h2V4h2v6h-2l1 11z"/>`,
};

const hex = (c: number): string => '#' + c.toString(16).padStart(6, '0');

export function Glyph({ id, size = 24, color = 'currentColor', style }: { id: string; size?: number; color?: string; style?: CSSProperties }): ReactElement {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ color, display: 'block', ...style }} dangerouslySetInnerHTML={{ __html: P[id] ?? P.passive }} />;
}

/** Framed icon tile: tinted backdrop + light glyph. */
export function Tile({ glyph, color, size = 48, round = false, dim = false }: { glyph: string; color: number; size?: number; round?: boolean; dim?: boolean }): ReactElement {
  const c = hex(color);
  return (
    <div
      className="tile"
      style={{
        width: size,
        height: size,
        borderRadius: round ? '50%' : Math.max(4, size * 0.14),
        background: `radial-gradient(circle at 35% 25%, ${c}cc, ${c}55 55%, #0c1026 100%)`,
        boxShadow: `inset 0 0 0 1.5px ${c}aa, inset 0 -${Math.round(size / 5)}px ${Math.round(size / 3)}px #0008`,
        filter: dim ? 'grayscale(0.85) brightness(0.6)' : undefined,
      }}
    >
      <Glyph id={glyph} size={Math.round(size * 0.62)} color="#fdf8e8" style={{ filter: 'drop-shadow(0 1px 1px #000a)' }} />
    </div>
  );
}

export const HeroIcon = ({ id, size = 48, round = true, dim = false }: { id: HeroId; size?: number; round?: boolean; dim?: boolean }): ReactElement => <Tile glyph={id} color={HEROES[id].color} size={size} round={round} dim={dim} />;
export const AbilityIcon = ({ hero, slot, size = 48, dim = false }: { hero: HeroId; slot: number; size?: number; dim?: boolean }): ReactElement => <Tile glyph={HEROES[hero].abilities[slot].id} color={HEROES[hero].color} size={size} dim={dim} />;
const CAT_COLOR: Record<string, number> = { attack: 0xd9642a, ability: 0x8a5ad0, defense: 0x4f8a6a, movement: 0x3f8ac0, support: 0xc9a25a };
export const ItemIcon = ({ id, size = 40, dim = false }: { id: string; size?: number; dim?: boolean }): ReactElement => <Tile glyph={ITEMS[id]?.glyph ?? 'passive'} color={CAT_COLOR[ITEMS[id]?.cat ?? 'support']} size={size} dim={dim} />;
export const TalentIcon = ({ id, size = 40, dim = false }: { id: TalentId; size?: number; dim?: boolean }): ReactElement => <Tile glyph={TALENTS[id].glyph} color={TALENTS[id].color} size={size} round dim={dim} />;
export const colorHex = hex;
