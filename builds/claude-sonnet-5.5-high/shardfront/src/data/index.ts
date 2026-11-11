import type { EntityDef, FactionDef, FactionId, UpgradeDef, Tag } from './types';
import { helixFaction, helixStructures, helixUnits, helixUpgrades } from './helix';
import { verdantFaction, verdantStructures, verdantUnits, verdantUpgrades } from './verdant';

export * from './types';

const neutral = (id: string, name: string, desc: string, extra: Partial<EntityDef>): EntityDef => ({
  id, name, faction: 'neutral', kind: 'neutral', role: id, desc, counter: '', tags: ['Structure'], hp: 1, armor: 0, radius: 1, speed: 0, sight: 0,
  cost: { ore: 0, flux: 0 }, buildTime: 0, supply: 0, model: id, ...extra,
});

export const neutralDefs: EntityDef[] = [
  neutral('ore_seam', 'Prism Ore Seam', 'Finite crystal seam of Prism Ore.', { size: 2, radius: 1 }),
  neutral('flux_vent', 'Flux Vent', 'Energy vent. Build a Flux Tap on it to extract Flux.', { size: 3, radius: 1.5 }),
  neutral('watch_pylon', 'Watch Pylon', 'Channel 3 seconds to capture; grants vision over a route until contested.', { size: 2, radius: 1, sight: 15, hp: 400, tags: ['Structure', 'Armored'] }),
  neutral('salvage_pod', 'Salvage Pod', 'One-time fixed resource bundle (100 Ore, 40 Flux).', { size: 1, radius: 0.6 }),
  neutral('crystal_barrier', 'Crystal Barrier', 'Destructible crystal formation blocking a shortcut.', { size: 3, radius: 1.5, hp: 900, armor: 2, tags: ['Structure', 'Armored'] }),
];

export const factions: Record<FactionId, FactionDef> = { helix: helixFaction, verdant: verdantFaction };
export const allUpgrades: UpgradeDef[] = [...helixUpgrades, ...verdantUpgrades];

/** All definitions, in a stable order; the numeric index is the "type id" used by the simulation. */
export const allDefs: EntityDef[] = [...helixUnits, ...helixStructures, ...verdantUnits, ...verdantStructures, ...neutralDefs];
export const defIndex: Record<string, number> = Object.fromEntries(allDefs.map((d, i) => [d.id, i]));
export const defById = (id: string): EntityDef => {
  const d = allDefs[defIndex[id]];
  if (!d) throw new Error('unknown def ' + id);
  return d;
};
export const upgradeById: Record<string, UpgradeDef> = Object.fromEntries(allUpgrades.map((u) => [u.id, u]));
export const upgradeIndex: Record<string, number> = Object.fromEntries(allUpgrades.map((u, i) => [u.id, i]));

/** Damage bonuses displayed in tooltips */
export const TAGS: Tag[] = ['Light', 'Armored', 'Massive', 'Biological', 'Mechanical', 'Structure', 'Hover'];

/** Schema validation of balance data. Returns a list of problems (empty = valid). */
export function validateData(): string[] {
  const errs: string[] = [];
  const seen = new Set<string>();
  for (const d of allDefs) {
    if (seen.has(d.id)) errs.push(`duplicate id ${d.id}`);
    seen.add(d.id);
    if (!(d.hp > 0)) errs.push(`${d.id}: hp`);
    if (d.kind === 'unit' && !(d.speed > 0)) errs.push(`${d.id}: speed`);
    if (d.kind === 'structure' && !d.size) errs.push(`${d.id}: size`);
    if (d.weapon) {
      const w = d.weapon;
      if (!(w.damage > 0 && w.period > 0 && w.range > 0)) errs.push(`${d.id}: weapon numbers`);
    }
    for (const r of d.requires ?? []) if (!(r in defIndex) && !(r in upgradeById)) errs.push(`${d.id}: requires unknown ${r}`);
    if (d.producedBy && !(d.producedBy in defIndex)) errs.push(`${d.id}: producedBy unknown ${d.producedBy}`);
    for (const p of d.produces ?? []) if (!(p in defIndex)) errs.push(`${d.id}: produces unknown ${p}`);
    for (const p of d.researches ?? []) if (!(p in upgradeById)) errs.push(`${d.id}: researches unknown ${p}`);
  }
  for (const f of Object.values(factions)) {
    for (const k of [f.worker, f.scout, f.hall, f.supply, f.tap, f.defense, f.basicProd, f.tech, ...f.units, ...f.structures]) if (!(k in defIndex)) errs.push(`${f.id}: unknown ${k}`);
    for (const id of [...f.units, ...f.structures]) if (defById(id).faction !== f.id) errs.push(`${f.id}: ${id} wrong faction`);
    // every unit is produced by something in the faction
    for (const u of f.units) {
      const d = defById(u);
      if (!d.producedBy || !f.structures.includes(d.producedBy)) errs.push(`${u}: no producer`);
      else if (!defById(d.producedBy).produces?.includes(u)) errs.push(`${u}: producer does not list it`);
    }
  }
  return errs;
}

/** Number of attack/armor upgrade levels currently available; no single upgrade exceeds 12% power. */
export const MAX_UPGRADE_POWER = 0.12;
