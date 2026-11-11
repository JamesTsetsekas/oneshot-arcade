// faction-data: human-readable stat lines shared by tooltips, the selection panel and the Tech Archive.
import { ABILITY_BY_ID, DEF_INDEX, ENTITY_DEFS, TECH_DEFS, TECH_INDEX } from './defs';
import type { EntityDef, TechDef, WeaponDef } from './types';

export function weaponLine(w: WeaponDef): string {
  const dps = (w.damage / w.period).toFixed(1);
  const parts = [`${w.name}: ${w.damage} dmg / ${w.period}s (${dps} dps)`, w.melee ? 'melee' : `range ${w.minRange > 0 ? w.minRange + '-' : ''}${w.range}`];
  if (w.speed > 0) parts.push(`projectile ${w.speed}/s`);
  if (w.splash > 0) parts.push(`splash ${w.splash}${w.delay > 0 ? ` after ${w.delay}s` : ''}`);
  const bonus = Object.entries(w.bonus).map(([t, v]) => `+${v} vs ${t}`).join(', ');
  if (bonus) parts.push(bonus);
  if (w.slow) parts.push(`slows ${Math.round((1 - w.slow.factor) * 100)}% for ${w.slow.seconds}s`);
  if (w.pierce) parts.push('overpenetrates');
  if (!w.hitsHover) parts.push('cannot hit hovering units');
  return parts.join(' · ');
}

export function statLines(d: EntityDef): string[] {
  const out: string[] = [];
  const core = [`HP ${d.hp}`];
  if (d.armor > 0) core.push(`Armor ${d.armor}`);
  if (d.shield > 0) core.push(`Frontal shield ${d.shield}`);
  if (d.speed > 0) core.push(`Speed ${d.speed}`);
  if (d.sight > 0) core.push(`Sight ${d.sight}`);
  out.push(core.join(' · '));
  if (d.weapon) out.push(weaponLine(d.weapon));
  if (d.ability) { const a = ABILITY_BY_ID[d.ability]; out.push(`${a.name}: ${a.desc}`); }
  if (d.supplyProvided > 0) out.push(`Provides ${d.supplyProvided} supply`);
  if (d.zone > 0) out.push(`Construction field radius ${d.zone}`);
  return out;
}

export function requirementText(d: EntityDef): string {
  const req = d.requires.map((r) => ENTITY_DEFS[DEF_INDEX[r]].name);
  if (d.requiresTech) req.push(TECH_DEFS[TECH_INDEX[d.requiresTech]].name);
  return req.length ? `Requires ${req.join(', ')}` : '';
}

export function defTip(d: EntityDef): string[] {
  const out = [d.role, ...statLines(d)];
  if (d.tags.length) out.push(d.tags.join(' · '));
  if (d.counters) out.push(d.counters);
  const req = requirementText(d);
  if (req) out.push(req);
  return out;
}

export function techTip(t: TechDef): string[] {
  const out = [t.desc];
  if (t.requiresTech) out.push(`Requires ${TECH_DEFS[TECH_INDEX[t.requiresTech]].name}`);
  return out;
}

export function fmtTime(ticks: number): string {
  const s = Math.floor(ticks / 20);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
