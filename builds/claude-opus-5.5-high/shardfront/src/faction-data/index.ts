import { ABILITIES, FACTIONS, NEUTRALS, STRUCTURES, TECHS, UNITS } from './data';
import { ALL_TAGS, type FactionId, type StructureDef, type TechDef, type UnitDef } from './schema';

export * from './schema';
export { ABILITIES, FACTIONS, NEUTRALS, STRUCTURES, TECHS, UNITS };

/** Numeric def indices used by the simulation SoA (stable order). */
export const UNIT_IDS = Object.keys(UNITS);
export const STRUCTURE_IDS = Object.keys(STRUCTURES);
export const unitIndex = (id: string) => UNIT_IDS.indexOf(id);
export const structureIndex = (id: string) => STRUCTURE_IDS.indexOf(id);

export function buildPalette(f: FactionId): StructureDef[] {
  const fd = FACTIONS[f];
  return [fd.supplyStructure, fd.production, fd.extractor, fd.tech, fd.defense, fd.hq].map((id) => STRUCTURES[id]);
}

export function factionUnits(f: FactionId): UnitDef[] {
  return Object.values(UNITS).filter((u) => u.faction === f);
}
export function factionStructures(f: FactionId): StructureDef[] {
  return Object.values(STRUCTURES).filter((u) => u.faction === f);
}
export function factionTechs(f: FactionId): TechDef[] {
  return Object.values(TECHS).filter((u) => u.faction === f);
}

export function requirementName(id: string): string {
  return STRUCTURES[id]?.name ?? TECHS[id]?.name ?? UNITS[id]?.name ?? id;
}

/** Schema validation. Returns a list of human-readable problems (empty = valid). */
export function validateFactionData(): string[] {
  const errs: string[] = [];
  const known = (id: string) => !!(STRUCTURES[id] || TECHS[id]);
  const pos = (n: number, label: string) => { if (!(Number.isFinite(n) && n > 0)) errs.push(`${label} must be > 0 (got ${n})`); };
  const nonneg = (n: number, label: string) => { if (!(Number.isFinite(n) && n >= 0)) errs.push(`${label} must be >= 0 (got ${n})`); };
  for (const [id, u] of Object.entries(UNITS)) {
    if (u.id !== id) errs.push(`unit key ${id} != id ${u.id}`);
    pos(u.hp, `${id}.hp`); pos(u.speed, `${id}.speed`); pos(u.radius, `${id}.radius`); pos(u.sight, `${id}.sight`);
    pos(u.buildTime, `${id}.buildTime`); nonneg(u.cost.ore, `${id}.cost.ore`); nonneg(u.cost.flux, `${id}.cost.flux`);
    pos(u.supply, `${id}.supply`); nonneg(u.armor, `${id}.armor`);
    if (!STRUCTURES[u.producedAt]) errs.push(`${id}.producedAt unknown ${u.producedAt}`);
    else if (!STRUCTURES[u.producedAt].trains.includes(id)) errs.push(`${id} not listed in ${u.producedAt}.trains`);
    for (const r of u.requires) if (!known(r)) errs.push(`${id}.requires unknown ${r}`);
    for (const a of u.abilities) if (!ABILITIES[a]) errs.push(`${id}.abilities unknown ${a}`);
    for (const t of u.tags) if (!ALL_TAGS.includes(t)) errs.push(`${id} bad tag ${t}`);
    if (u.weapon) {
      pos(u.weapon.damage, `${id}.weapon.damage`); pos(u.weapon.period, `${id}.weapon.period`); pos(u.weapon.range, `${id}.weapon.range`);
      if (u.weapon.windup >= u.weapon.period) errs.push(`${id} windup >= period`);
      for (const t of Object.keys(u.weapon.bonus ?? {})) if (!ALL_TAGS.includes(t as never)) errs.push(`${id} bonus tag ${t}`);
    }
    if (!u.strongVs || !u.weakVs) errs.push(`${id} missing counter relationship`);
    if (!u.role) errs.push(`${id} missing role tooltip`);
  }
  for (const [id, sd] of Object.entries(STRUCTURES)) {
    if (sd.id !== id) errs.push(`structure key ${id} != id ${sd.id}`);
    pos(sd.hp, `${id}.hp`); pos(sd.size, `${id}.size`); pos(sd.buildTime, `${id}.buildTime`);
    for (const t of sd.trains) if (!UNITS[t]) errs.push(`${id}.trains unknown ${t}`);
    for (const t of sd.researches) if (!TECHS[t]) errs.push(`${id}.researches unknown ${t}`);
    for (const r of sd.requires) if (!known(r)) errs.push(`${id}.requires unknown ${r}`);
    const keys = sd.trains.map((t) => UNITS[t].hotkey);
    if (new Set(keys).size !== keys.length) errs.push(`${id} duplicate train hotkeys`);
  }
  for (const [id, t] of Object.entries(TECHS)) {
    if (!STRUCTURES[t.at]) errs.push(`${id}.at unknown`);
    else if (!STRUCTURES[t.at].researches.includes(id)) errs.push(`${id} not in ${t.at}.researches`);
    for (const r of t.requires) if (!known(r)) errs.push(`${id}.requires unknown ${r}`);
  }
  for (const f of ['helix', 'verdant'] as const) {
    const pal = buildPalette(f);
    const keys = pal.map((p) => p.hotkey);
    if (new Set(keys).size !== keys.length) errs.push(`${f} duplicate build hotkeys ${keys.join(',')}`);
    const fd = FACTIONS[f];
    for (const id of [fd.worker, fd.scout]) if (UNITS[id]?.faction !== f) errs.push(`${f} roster ${id}`);
    for (const id of [fd.hq, fd.supplyStructure, fd.production, fd.tech, fd.defense, fd.extractor]) if (STRUCTURES[id]?.faction !== f) errs.push(`${f} roster ${id}`);
  }
  void NEUTRALS;
  return errs;
}
