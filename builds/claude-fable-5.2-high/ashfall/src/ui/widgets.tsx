import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { SKILL, skillRank, skillTooltip, type SkillDef } from '../abilities/skills';
import { game } from '../app-shell/game';
import { itemStats } from '../entity-combat/stats';
import type { Hero, Item } from '../entity-combat/types';
import { AFFIX, BASE, RARITY, RELIC, glyphInfo, glyphStat, statText } from '../items/content';
import { sellValue } from '../items/economy';
import { affixRange, itemName } from '../items/generate';
import { canEquip, slotFor } from '../items/inventory';
import { useUi } from './store';

const ICON: Record<string, ReactNode> = {
  mace: <><path d="M6 20 15 9" strokeWidth="2.4" /><circle cx="16.5" cy="7.5" r="4" fill="currentColor" /></>,
  maul: <><path d="M5 21 14 10" strokeWidth="2.4" /><rect x="11" y="3" width="10" height="7" rx="1" transform="rotate(40 16 6.5)" fill="currentColor" /></>,
  shield: <path d="M12 3 20 6v6c0 5-4 8-8 10-4-2-8-5-8-10V6z" fill="currentColor" fillOpacity=".55" />,
  wristbow: <><path d="M7 6q10 6 0 12" /><path d="M7 6v12M4 12h14l-3-2.5M18 12l-3 2.5" /></>,
  longbow: <><path d="M8 2q13 10 0 20" strokeWidth="2.2" /><path d="M8 2v20" strokeWidth="1" /></>,
  quiver: <><rect x="8" y="8" width="8" height="13" rx="2" fill="currentColor" fillOpacity=".5" /><path d="M10 8V3M12 8V2M14 8V4" /></>,
  head: <path d="M5 15a7 7 0 0 1 14 0v4h-4v-4h-2v4H5z" fill="currentColor" fillOpacity=".55" />,
  chest: <path d="M6 4l4 2h4l4-2 3 5-3 2v9H6v-9L3 9z" fill="currentColor" fillOpacity=".55" />,
  gloves: <path d="M7 21v-8l-2-4 2-1 2 3V5h2v5h1V4h2v6h1V6h2v9l-2 6z" fill="currentColor" fillOpacity=".55" />,
  boots: <path d="M8 3h6v11l6 3v3H8z" fill="currentColor" fillOpacity=".55" />,
  belt: <><rect x="2" y="9.5" width="20" height="5" fill="currentColor" fillOpacity=".5" /><rect x="9.5" y="8" width="5" height="8" /></>,
  amulet: <><path d="M5 3q7 12 14 0" /><path d="M12 11l3 4-3 5-3-5z" fill="currentColor" /></>,
  ring: <><circle cx="12" cy="14" r="6" strokeWidth="2.2" /><path d="M12 3l3 3-3 3-3-3z" fill="currentColor" /></>,
  glyph: <><path d="M12 2l8 10-8 10-8-10z" fill="currentColor" fillOpacity=".4" /><path d="M12 7v10M8 12h8" /></>,
};
const TINT: Record<string, string> = { heavy: '#aab2bd', light: '#b08a5e', mace: '#c0b8ac', maul: '#c0b8ac', shield: '#c9a24e', wristbow: '#b89868', longbow: '#b89868', quiver: '#b08a5e', belt: '#b08a5e', amulet: '#d9c27a', ring: '#d9c27a' };
export function ItemIcon({ item, size = 28 }: { item: Item; size?: number }) {
  let key = 'glyph', tint = '#b86bff';
  if (item.kind === 'gear') { const t = BASE[item.base].type; key = t.includes('_') ? t.split('_')[1] : t; tint = TINT[t.split('_')[0]] ?? '#c0b8ac'; }
  else tint = glyphInfo(item.base).def.color;
  return <svg className="iicon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ color: item.identified ? tint : '#777' }}>{ICON[key]}</svg>;
}
const SLOT_NAME: Record<string, string> = { main: 'Main hand', off: 'Off hand', head: 'Head', chest: 'Chest', gloves: 'Gloves', boots: 'Boots', belt: 'Belt', amulet: 'Amulet', ring: 'Ring' };
export function ItemCard({ item, hero, label, price }: { item: Item; hero: Hero; label?: string; price?: string }) {
  const adv = useUi((s) => s.settings.advanced);
  const rar = RARITY[item.rarity];
  if (item.kind === 'glyph') {
    const g = glyphInfo(item.base), w = glyphStat(item.base, true), a = glyphStat(item.base, false);
    return <div className="tip-card r1">{label && <div className="tip-label">{label}</div>}<div className="tip-name">⬥ {itemName(item)}</div><div className="tip-sub">Glyph · Tier {g.tier}</div>
      <div className="tip-line">In a weapon: {statText(w[0], w[1])}</div><div className="tip-line">In armor: {statText(a[0], a[1])}</div><div className="tip-dim">Socket into equipped gear from the inventory. Three identical glyphs combine into the next tier.</div></div>;
  }
  const b = BASE[item.base];
  const err = canEquip(hero, item);
  return (
    <div className={`tip-card r${item.rarity}`}>
      {label && <div className="tip-label">{label}</div>}
      <div className="tip-name">{rar.shape} {itemName(item)}</div>
      <div className="tip-sub">{rar.name} {b.name !== itemName(item) ? b.name : ''} · {SLOT_NAME[b.slot]}{b.twoHand ? ' (two-handed)' : ''}{adv ? ` · ilvl ${item.ilvl}` : ''}</div>
      {b.dmg && <div className="tip-main">{b.dmg[0]}–{b.dmg[1]} damage · {b.aps!.toFixed(2)} attacks/s</div>}
      {b.armor ? <div className="tip-main">{b.armor} armor{b.block ? ` · ${b.block}% block` : ''}</div> : null}
      {b.implicit && <div className="tip-line imp">{statText(b.implicit[0], b.implicit[1])}</div>}
      {!item.identified ? <div className="tip-unid">Unidentified — bring it to Artificer Ilse in Ember Refuge.</div> : <>
        {item.relic && <>{RELIC[item.relic].fixed.map(([k, v]) => <div key={k} className="tip-line">{statText(k, v)}</div>)}<div className="tip-relic">✦ {RELIC[item.relic].power}</div></>}
        {item.affixes.map((a, i) => { const d = AFFIX[a.id], rg = affixRange(d, a.tier, item.rarity); return <div key={i} className="tip-line aff">{statText(d.stat, a.value)}{adv && <span className="tip-range"> [{rg[0]}–{rg[1]}] T{a.tier} {d.pos === 'p' ? 'prefix' : 'suffix'}</span>}</div>; })}
        {item.glyphs.map((g, i) => { const st = glyphStat(g, b.slot === 'main'); return <div key={'g' + i} className="tip-line glyph">⬥ {statText(st[0], st[1])}</div>; })}
        {item.sockets > item.glyphs.length && <div className="tip-dim">○ Empty socket</div>}
      </>}
      {item.dur < 100 && <div className={item.dur <= 20 ? 'tip-bad' : 'tip-dim'}>Durability {Math.round(item.dur)}%{item.dur <= 0 ? ' — broken, grants nothing' : ''}</div>}
      {err && item.identified && <div className="tip-bad">{err}</div>}
      <div className="tip-foot">{item.fav ? '★ Favorite · ' : ''}{price ?? `Sells for ${sellValue(item)} gold`}</div>
    </div>
  );
}
/** Tooltip with side-by-side comparison against what is equipped in the same slot. */
export function ItemTip({ item, hero, compare = true, label, price }: { item: Item; hero: Hero; compare?: boolean; label?: string; price?: string }) {
  const slot = compare && item.kind === 'gear' ? slotFor(hero, item) : null;
  const eq = slot ? hero.equip[slot] : undefined;
  let delta: ReactNode = null;
  if (eq && eq !== item && item.identified) {
    const sum = (it: Item) => { const m: Record<string, number> = {}; const b = BASE[it.base]; m.armorBase = b.armor ?? 0; m.dps = b.dmg ? ((b.dmg[0] + b.dmg[1]) / 2) * b.aps! : 0; for (const [k, v] of itemStats(it)) m[k] = (m[k] ?? 0) + v; return m; };
    const a = sum(item), c = sum(eq);
    const rows = [...new Set([...Object.keys(a), ...Object.keys(c)])].filter((k) => !k.startsWith('relic_')).map((k) => [k, (a[k] ?? 0) - (c[k] ?? 0)] as const).filter(([, v]) => Math.abs(v) > 0.05);
    delta = <div className="tip-delta">{rows.slice(0, 9).map(([k, v]) => <span key={k} className={v > 0 ? 'up' : 'down'}>{v > 0 ? '▲' : '▼'} {k === 'dps' ? `${Math.abs(v).toFixed(1)} weapon DPS` : k === 'armorBase' ? `${Math.abs(v)} base armor` : statText(k, Math.abs(v)).replace('+', '')}</span>)}</div>;
  }
  return <div className="tip-row"><div><ItemCard item={item} hero={hero} label={label} price={price} />{delta}</div>{eq && eq !== item && <ItemCard item={eq} hero={hero} label="Equipped" />}</div>;
}
export function SkillTip({ def, hero }: { def: SkillDef; hero: Hero }) {
  const s = game.session!;
  const base = hero.ranks[def.id] ?? 0, eff = skillRank(hero.ranks, s.stats, def.id);
  const cur = skillTooltip(def, Math.max(1, eff), s.stats);
  const next = base > 0 && base < def.maxRank && def.kind !== 'basic' ? skillTooltip(def, eff + 1, s.stats) : null;
  return (
    <div className="tip-card skill">
      <div className="tip-name">{def.icon} {def.name}</div>
      <div className="tip-sub">{def.kind === 'basic' ? 'Basic attack' : def.kind === 'active' ? `Active · Rank ${base}${eff > base ? ` (+${eff - base})` : ''}/${def.maxRank}` : def.kind === 'passive' ? `Passive · Rank ${base}/${def.maxRank}` : 'Capstone'} · {def.tags.join(' · ')}</div>
      {cur.lines.map((l) => <div key={l} className="tip-main">{l}</div>)}
      <div className="tip-line">{cur.desc}</div>
      {next && next.desc !== cur.desc && <><div className="tip-label">Next rank</div><div className="tip-line next">{next.desc}</div></>}
      {base === 0 && <div className={hero.level >= def.unlock ? 'tip-dim' : 'tip-bad'}>Requires level {def.unlock}{def.excl ? ` · excludes ${SKILL[def.excl].name}` : ''}</div>}
    </div>
  );
}
/** Hover tooltip rendered in a portal and clamped to the viewport. */
export function Tip({ content, children, className }: { content: () => ReactNode; children: ReactNode; className?: string }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const [fix, setFix] = useState({ x: 0, y: 0 });
  useLayoutEffect(() => {
    if (!pos || !ref.current) return;
    const r = ref.current.getBoundingClientRect(), W = window.innerWidth, H = window.innerHeight;
    let x = pos.x + 18, y = pos.y + 14;
    if (x + r.width > W - 8) x = Math.max(8, pos.x - r.width - 14);
    if (y + r.height > H - 8) y = Math.max(8, H - r.height - 8);
    setFix({ x, y });
  }, [pos]);
  useEffect(() => () => setPos(null), []);
  return (
    <div className={className} onPointerEnter={(e) => setPos({ x: e.clientX, y: e.clientY })} onPointerMove={(e) => setPos({ x: e.clientX, y: e.clientY })} onPointerLeave={() => setPos(null)}>
      {children}
      {pos && createPortal(<div ref={ref} className="tip" style={{ left: fix.x, top: fix.y }}>{content()}</div>, document.body)}
    </div>
  );
}
export const Btn = (p: { onClick: () => void; children: ReactNode; disabled?: boolean; cls?: string; title?: string }) => (
  <button className={'btn ' + (p.cls ?? '')} disabled={p.disabled} title={p.title} onClick={() => { game.audio.resume(); game.audio.play('ui'); p.onClick(); }}>{p.children}</button>
);
