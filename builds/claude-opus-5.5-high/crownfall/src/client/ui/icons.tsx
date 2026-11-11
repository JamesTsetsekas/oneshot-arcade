// Original SVG iconography: item icons by shape+color, ability glyphs by shape language, hero portraits.
import React from 'react';
import { ITEMS } from '../../shared/items';
import { HEROES } from '../../shared/heroes';
import type { AbilityDef, HeroId } from '../../shared/types';

const hex = (c: number) => `#${c.toString(16).padStart(6, '0')}`;

export function ItemIcon({ id, size = 40 }: { id: string; size?: number }) {
  const d = ITEMS[id];
  if (!d) return <div style={{ width: size, height: size }} />;
  const c = d.icon.color;
  const shape = (() => {
    switch (d.icon.shape) {
      case 'blade': return <path d="M30 6 L36 10 L16 34 L10 34 L10 28 Z M8 30 L14 36 M6 38 L10 34" stroke="#20160c" strokeWidth="2" fill={c} />;
      case 'orb': return <><circle cx="22" cy="22" r="12" fill={c} stroke="#20160c" strokeWidth="2" /><circle cx="18" cy="17" r="4" fill="#fff" opacity=".6" /></>;
      case 'shield': return <path d="M22 6 L36 11 C36 24 31 32 22 38 C13 32 8 24 8 11 Z" fill={c} stroke="#20160c" strokeWidth="2" />;
      case 'boot': return <path d="M14 6 L24 6 L24 26 L36 30 L36 36 L10 36 L10 30 Z" fill={c} stroke="#20160c" strokeWidth="2" />;
      case 'gem': return <path d="M22 5 L35 17 L22 39 L9 17 Z M9 17 L35 17 M22 5 L17 17 L22 39 L27 17 Z" fill={c} stroke="#20160c" strokeWidth="1.6" />;
      case 'book': return <><rect x="9" y="8" width="26" height="28" rx="2" fill={c} stroke="#20160c" strokeWidth="2" /><path d="M14 14 H30 M14 19 H30 M14 24 H26" stroke="#fff" strokeWidth="1.6" opacity=".7" /></>;
      case 'bow': return <><path d="M12 6 C34 12 34 32 12 38" stroke={c} strokeWidth="4" fill="none" /><path d="M12 6 L12 38 M12 22 L36 22 M30 17 L36 22 L30 27" stroke="#20160c" strokeWidth="2" fill="none" /></>;
      case 'bell': return <><path d="M12 30 C12 14 16 8 22 8 C28 8 32 14 32 30 Z" fill={c} stroke="#20160c" strokeWidth="2" /><circle cx="22" cy="34" r="3" fill="#20160c" /><rect x="9" y="29" width="26" height="3" fill="#20160c" /></>;
      case 'potion': return <><path d="M18 6 H26 V14 L33 26 C35 33 30 38 22 38 C14 38 9 33 11 26 L18 14 Z" fill={c} stroke="#20160c" strokeWidth="2" /><path d="M14 26 H30" stroke="#fff" opacity=".6" strokeWidth="2" /></>;
      case 'ward': return <><rect x="20" y="16" width="4" height="22" fill="#6b4f22" /><circle cx="22" cy="12" r="7" fill={c} stroke="#20160c" strokeWidth="2" /></>;
      case 'gear': return <><circle cx="22" cy="22" r="10" fill={c} stroke="#20160c" strokeWidth="2" />{[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <rect key={i} x="20" y="5" width="4" height="7" fill={c} stroke="#20160c" strokeWidth="1" transform={`rotate(${i * 45} 22 22)`} />)}<circle cx="22" cy="22" r="4" fill="#20160c" /></>;
      case 'leaf': return <path d="M10 34 C10 14 22 8 36 8 C36 24 28 34 10 34 Z M10 34 L28 16" fill={c} stroke="#20160c" strokeWidth="2" />;
      case 'ring': return <><circle cx="22" cy="24" r="11" fill="none" stroke={c} strokeWidth="5" /><path d="M17 10 L22 4 L27 10 Z" fill="#fff" stroke="#20160c" /></>;
    }
  })();
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" className="icon">
      <rect x="1" y="1" width="42" height="42" rx="6" fill="#1a1d2b" stroke="#3b3f55" />
      {shape}
    </svg>
  );
}

/** Shape-language ability glyph derived from targeting data. */
export function AbilityIcon({ hero, slot, size = 48 }: { hero: HeroId; slot: number; size?: number }) {
  const h = HEROES[hero];
  const a: AbilityDef = h.abilities[slot];
  const c = hex(h.colors.glow), b = hex(h.colors.accent);
  let g: React.ReactNode;
  switch (a.targeting) {
    case 'direction': g = a.tags.includes('cone') ? <path d="M10 38 L38 14 A26 26 0 0 1 38 38 Z" fill={c} opacity=".85" /> : a.tags.includes('mobility') ? <path d="M8 36 L30 14 M22 12 H32 V22" stroke={c} strokeWidth="5" fill="none" strokeLinecap="round" /> : <><path d="M8 40 L40 8" stroke={c} strokeWidth="6" strokeLinecap="round" /><circle cx="40" cy="8" r="4" fill="#fff" /></>; break;
    case 'point': g = <><circle cx="26" cy="24" r="14" fill="none" stroke={c} strokeWidth="4" /><circle cx="26" cy="24" r="6" fill={c} /></>; break;
    case 'unit-enemy': g = <><circle cx="24" cy="24" r="12" fill="none" stroke={c} strokeWidth="3" /><path d="M24 6 V16 M24 32 V42 M6 24 H16 M32 24 H42" stroke={c} strokeWidth="3" /></>; break;
    case 'unit-ally': case 'ally-or-point': g = <><path d="M24 8 L28 20 L40 20 L30 28 L34 40 L24 32 L14 40 L18 28 L8 20 L20 20 Z" fill={c} /></>; break;
    case 'self': g = <><circle cx="24" cy="24" r="16" fill="none" stroke={c} strokeWidth="4" strokeDasharray="6 4" /><circle cx="24" cy="24" r="7" fill={c} /></>; break;
    default: g = <path d="M24 6 L40 24 L24 42 L8 24 Z" fill="none" stroke={c} strokeWidth="4" />;
  }
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className="icon">
      <defs><radialGradient id={`ab-${hero}-${slot}`}><stop offset="0" stopColor={b} stopOpacity=".55" /><stop offset="1" stopColor="#11131d" /></radialGradient></defs>
      <rect x="1" y="1" width="46" height="46" rx="7" fill={`url(#ab-${hero}-${slot})`} stroke={a.slot === 'R' ? '#ffd36b' : '#3b3f55'} strokeWidth={a.slot === 'R' ? 2 : 1} />
      {g}
      <text x="5" y="44" fontSize="10" fontWeight="800" fill="#fff" opacity=".85">{a.slot}</text>
    </svg>
  );
}

/** Original stylized hero portrait (silhouette + palette). */
export function Portrait({ hero, size = 64, dim = false }: { hero: HeroId; size?: number; dim?: boolean }) {
  const h = HEROES[hero];
  const body = hex(h.colors.body), acc = hex(h.colors.accent), glow = hex(h.colors.glow);
  const sil: Record<HeroId, React.ReactNode> = {
    brannoch: <><rect x="14" y="34" width="36" height="30" rx="4" fill={body} /><rect x="8" y="30" width="16" height="12" fill={acc} /><rect x="40" y="30" width="16" height="12" fill={acc} /><circle cx="32" cy="24" r="9" fill="#d9b38c" /><rect x="22" y="14" width="20" height="6" fill={acc} /><rect x="46" y="8" width="14" height="10" fill={glow} /></>,
    suri: <><rect x="22" y="36" width="20" height="28" rx="3" fill={body} /><circle cx="32" cy="26" r="8" fill="#d9b38c" /><rect x="22" y="16" width="20" height="5" rx="2" fill={acc} /><path d="M38 34 L58 24" stroke={glow} strokeWidth="4" /><rect x="10" y="42" width="10" height="10" fill={acc} /></>,
    oru: <><circle cx="32" cy="34" r="9" fill={glow} /><path d="M32 34 L8 18 L14 44 Z M32 34 L56 18 L50 44 Z" fill={body} opacity=".85" />{[0, 1, 2, 3, 4, 5].map((i) => <circle key={i} cx={32 + Math.cos(i) * 18} cy={34 + Math.sin(i * 1.7) * 14} r="2.5" fill="#fff" />)}</>,
    kesh: <><path d="M14 64 L18 34 L46 30 L52 64 Z" fill={body} /><circle cx="40" cy="26" r="9" fill={body} /><path d="M18 30 L14 10 M24 28 L22 6 M30 28 L32 8" stroke={acc} strokeWidth="3" /><rect x="50" y="20" width="6" height="26" fill={glow} /></>,
    ilyra: <><path d="M16 64 L32 30 L48 64 Z" fill={body} /><circle cx="32" cy="26" r="7" fill="#d9b38c" /><path d="M22 22 L32 4 L42 22 Z" fill={acc} /><rect x="6" y="34" width="14" height="10" fill={acc} /><path d="M44 40 L58 20" stroke={glow} strokeWidth="3" /></>,
    vey: <><rect x="24" y="34" width="16" height="30" fill={body} /><circle cx="32" cy="26" r="7" fill={body} /><path d="M26 18 L28 6 L32 16 L36 4 L38 18" fill={glow} /><path d="M44 38 L58 26 M20 38 L6 26" stroke={glow} strokeWidth="3" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="portrait" style={{ filter: dim ? 'grayscale(1) brightness(.5)' : undefined }}>
      <defs><linearGradient id={`pg-${hero}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2a3150" /><stop offset="1" stopColor="#141726" /></linearGradient></defs>
      <rect width="64" height="64" rx="8" fill={`url(#pg-${hero})`} />
      {sil[hero]}
    </svg>
  );
}

export function TalentIcon({ id, size = 40 }: { id: string; size?: number }) {
  const glyph: Record<string, React.ReactNode> = {
    phase: <path d="M10 30 L22 18 M26 14 L34 6 M28 30 A6 6 0 1 0 28.1 30" stroke="#c8f6ff" strokeWidth="3" fill="none" />,
    mend: <path d="M22 8 V36 M8 22 H36" stroke="#ffd36b" strokeWidth="6" />,
    scorch: <path d="M22 6 C30 16 34 22 30 30 C28 36 16 36 14 30 C12 24 18 20 22 6 Z" fill="#ff6a3d" />,
    bulwark: <path d="M22 6 L36 11 C36 24 31 32 22 38 C13 32 8 24 8 11 Z" fill="none" stroke="#7fd1ff" strokeWidth="4" />,
    rush: <path d="M8 14 H30 M4 22 H34 M8 30 H30 M30 10 L38 22 L30 34" stroke="#b6ff6e" strokeWidth="3" fill="none" />,
    reap: <path d="M10 34 L30 14 M24 8 C36 8 38 20 30 26" stroke="#ff6ad5" strokeWidth="4" fill="none" />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" className="icon">
      <rect x="1" y="1" width="42" height="42" rx="6" fill="#1a1d2b" stroke="#3b3f55" />
      {glyph[id]}
    </svg>
  );
}
