// content-data + shared-protocol: loadout shape, defaults, resolution and server-side validation.
import { ATTACHMENT_BY_ID, MAX_ATTACHMENTS, WEAPON_BY_ID, WeaponStats, resolveWeapon } from './weapons';
import { EQUIP_BY_ID, EquipDef, PERK_BY_ID, PERK_GROUPS, PerkMods, SUPPORT_BY_ID, resolvePerks } from './kit';
import { CONTENT_VERSION } from './tuning';

export interface Loadout {
  name: string;
  primary: string;
  attachments: string[];
  sidearm: string;
  perks: [string, string, string]; // mobility, awareness, sustain
  lethal: string;
  tactical: string;
  supports: [string, string, string]; // tier 3 / 5 / 8
}

export const DEFAULT_LOADOUTS: Loadout[] = [
  { name: 'Vanguard', primary: 'ar4', attachments: ['reflex', 'angledgrip'], sidearm: 'p9', perks: ['fleet', 'trace', 'rapid'], lethal: 'frag', tactical: 'flash', supports: ['recon', 'drone', 'flight'] },
  { name: 'Breacher', primary: 'm7', attachments: ['suppressor', 'lightstock'], sidearm: 'h3', perks: ['quickmantle', 'filter', 'patch'], lethal: 'sticky', tactical: 'smoke', supports: ['pod', 'drone', 'uplink'] },
  { name: 'Overwatch', primary: 'br12', attachments: ['optic2x', 'stablegrip'], sidearm: 'p9', perks: ['lightkit', 'munitions', 'patch'], lethal: 'mine', tactical: 'dart', supports: ['recon', 'mortar', 'flight'] },
  { name: 'Doorkicker', primary: 'sg8', attachments: ['lightstock'], sidearm: 'cinder', perks: ['fleet', 'filter', 'scavenger'], lethal: 'frag', tactical: 'flash', supports: ['pod', 'mortar', 'uplink'] },
  { name: 'Longwatch', primary: 'mr1', attachments: ['quickmag'], sidearm: 'h3', perks: ['lightkit', 'trace', 'rapid'], lethal: 'mine', tactical: 'smoke', supports: ['recon', 'drone', 'flight'] },
];

export const BOT_LOADOUTS: Loadout[] = [
  { name: 'Rifleman', primary: 'ar4', attachments: ['reflex'], sidearm: 'p9', perks: ['fleet', 'trace', 'rapid'], lethal: 'frag', tactical: 'flash', supports: ['recon', 'drone', 'flight'] },
  { name: 'Runner', primary: 'm7', attachments: ['lightstock'], sidearm: 'p9', perks: ['fleet', 'filter', 'patch'], lethal: 'sticky', tactical: 'smoke', supports: ['pod', 'drone', 'uplink'] },
  { name: 'Marksman', primary: 'br12', attachments: ['optic2x'], sidearm: 'h3', perks: ['lightkit', 'munitions', 'patch'], lethal: 'frag', tactical: 'dart', supports: ['recon', 'mortar', 'flight'] },
  { name: 'Gunner', primary: 'lmg60', attachments: ['stablegrip'], sidearm: 'p9', perks: ['quickmantle', 'filter', 'scavenger'], lethal: 'frag', tactical: 'smoke', supports: ['pod', 'mortar', 'uplink'] },
  { name: 'Pointman', primary: 'sg8', attachments: [], sidearm: 'cinder', perks: ['fleet', 'filter', 'patch'], lethal: 'sticky', tactical: 'flash', supports: ['recon', 'drone', 'uplink'] },
  { name: 'Sentinel', primary: 'mr1', attachments: [], sidearm: 'h3', perks: ['lightkit', 'trace', 'rapid'], lethal: 'mine', tactical: 'dart', supports: ['recon', 'mortar', 'flight'] },
  { name: 'Rifleman II', primary: 'ar4', attachments: ['angledgrip', 'compensator'], sidearm: 'h3', perks: ['quickmantle', 'munitions', 'patch'], lethal: 'frag', tactical: 'flash', supports: ['pod', 'drone', 'flight'] },
];

export interface ResolvedLoadout {
  src: Loadout;
  weapons: [WeaponStats, WeaponStats];
  perks: PerkMods;
  lethal: EquipDef;
  tactical: EquipDef;
  supports: [string, string, string];
}

export function resolveLoadout(l: Loadout): ResolvedLoadout {
  return {
    src: l,
    weapons: [resolveWeapon(WEAPON_BY_ID[l.primary], l.attachments), resolveWeapon(WEAPON_BY_ID[l.sidearm], [])],
    perks: resolvePerks(l.perks),
    lethal: EQUIP_BY_ID[l.lethal],
    tactical: EQUIP_BY_ID[l.tactical],
    supports: l.supports,
  };
}

export interface Ruleset {
  version: string;
  /** null = everything unlocked (private Practice) */
  ownedLevel: number | null;
}

export const PRACTICE_RULESET: Ruleset = { version: CONTENT_VERSION, ownedLevel: null };

/** Returns a list of problems; empty means legal. Used by the editor (immediately) and by the room (authoritatively). */
export function validateLoadout(l: unknown, rules: Ruleset): string[] {
  const errs: string[] = [];
  if (rules.version !== CONTENT_VERSION) errs.push('Ruleset version mismatch');
  if (!l || typeof l !== 'object') return ['Loadout is not an object'];
  const lo = l as Partial<Loadout>;
  const lvl = rules.ownedLevel;
  const owned = (unlock: number) => lvl === null || unlock <= lvl;
  if (typeof lo.name !== 'string' || lo.name.length > 24) errs.push('Invalid name');
  const prim = typeof lo.primary === 'string' ? WEAPON_BY_ID[lo.primary] : undefined;
  if (!prim || prim.slot !== 'primary') errs.push('Unknown primary weapon');
  else if (!owned(prim.unlockLevel)) errs.push(`${prim.name} is locked`);
  const side = typeof lo.sidearm === 'string' ? WEAPON_BY_ID[lo.sidearm] : undefined;
  if (!side || side.slot !== 'sidearm') errs.push('Unknown sidearm');
  else if (!owned(side.unlockLevel)) errs.push(`${side.name} is locked`);
  if (!Array.isArray(lo.attachments)) errs.push('Attachments missing');
  else {
    if (lo.attachments.length > MAX_ATTACHMENTS) errs.push(`Maximum ${MAX_ATTACHMENTS} attachments`);
    const seen = new Set<string>();
    for (const id of lo.attachments) {
      const a = typeof id === 'string' ? ATTACHMENT_BY_ID[id] : undefined;
      if (!a) { errs.push('Unknown attachment'); continue; }
      if (seen.has(a.slot)) errs.push(`Two attachments in the ${a.slot} slot`);
      seen.add(a.slot);
      if (prim && !prim.slots.includes(a.slot)) errs.push(`${prim.name} has no ${a.slot} slot`);
      if (!owned(a.unlockLevel)) errs.push(`${a.name} is locked`);
    }
  }
  if (!Array.isArray(lo.perks) || lo.perks.length !== 3) errs.push('Pick one perk per group');
  else {
    lo.perks.forEach((id, i) => {
      const p = typeof id === 'string' ? PERK_BY_ID[id] : undefined;
      if (!p || p.group !== PERK_GROUPS[i]) errs.push(`Invalid ${PERK_GROUPS[i]} perk`);
      else if (!owned(p.unlockLevel)) errs.push(`${p.name} is locked`);
    });
  }
  const le = typeof lo.lethal === 'string' ? EQUIP_BY_ID[lo.lethal] : undefined;
  if (!le || le.kind !== 'lethal') errs.push('Invalid lethal equipment');
  else if (!owned(le.unlockLevel)) errs.push(`${le.name} is locked`);
  const ta = typeof lo.tactical === 'string' ? EQUIP_BY_ID[lo.tactical] : undefined;
  if (!ta || ta.kind !== 'tactical') errs.push('Invalid tactical equipment');
  else if (!owned(ta.unlockLevel)) errs.push(`${ta.name} is locked`);
  if (!Array.isArray(lo.supports) || lo.supports.length !== 3) errs.push('Pick one support action per tier');
  else {
    lo.supports.forEach((id, i) => {
      const s = typeof id === 'string' ? SUPPORT_BY_ID[id] : undefined;
      if (!s || s.tier !== i) errs.push(`Invalid tier ${i + 1} support action`);
      else if (!owned(s.unlockLevel)) errs.push(`${s.name} is locked`);
    });
  }
  return errs;
}

/** Repairs a possibly stale/tampered stored loadout into a legal one (client convenience; server still validates). */
export function sanitizeLoadout(l: unknown, fallback: Loadout, rules: Ruleset = PRACTICE_RULESET): Loadout {
  if (validateLoadout(l, rules).length === 0) {
    const lo = l as Loadout;
    return { name: lo.name, primary: lo.primary, attachments: lo.attachments.slice(), sidearm: lo.sidearm, perks: [...lo.perks] as [string, string, string], lethal: lo.lethal, tactical: lo.tactical, supports: [...lo.supports] as [string, string, string] };
  }
  return JSON.parse(JSON.stringify(fallback)) as Loadout;
}
