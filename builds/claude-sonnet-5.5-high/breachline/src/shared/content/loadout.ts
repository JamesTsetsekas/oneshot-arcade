// Loadout schema, validation and resolution into concrete weapon stats.
import { WEAPONS, type WeaponDef } from "./weapons";
import { ATTACHMENTS, MAX_ATTACHMENTS } from "./attachments";
import { PERKS, PERK_GROUPS, EQUIPMENT, SUPPORTS, SUPPORT_BY_TIER, SUPPORT_TIERS } from "./gear";

export interface Loadout {
  name: string;
  primary: string;
  secondary: string;
  attachments: string[]; // fitted to the primary weapon, max 3, one per slot
  perks: [string, string, string]; // mobility, awareness, sustain
  lethal: string;
  tactical: string;
  support: [string, string, string]; // tier 3, 5, 8
}

export function defaultLoadouts(): Loadout[] {
  return [
    { name: "Assault", primary: "ar4", secondary: "p9", attachments: ["reflex", "compensator", "extmag"], perks: ["fleet", "signalfilter", "rapid"], lethal: "frag", tactical: "flash", support: ["recon", "drone", "uplink"] },
    { name: "Rusher", primary: "m7", secondary: "cinder", attachments: ["lightbarrel", "angled", "lightstock"], perks: ["quickmantle", "munitions", "scavenger"], lethal: "adhesive", tactical: "obscurant", support: ["ammopod", "mortar", "flight"] },
    { name: "Anchor", primary: "lmg60", secondary: "h3", attachments: ["reflex", "stable", "fixedstock"], perks: ["lightkit", "tracereader", "fieldpatch"], lethal: "mine", tactical: "dart", support: ["recon", "mortar", "uplink"] },
    { name: "Marksman", primary: "mr1", secondary: "p9", attachments: ["lightbarrel", "stable"], perks: ["fleet", "signalfilter", "fieldpatch"], lethal: "frag", tactical: "dart", support: ["recon", "drone", "flight"] },
    { name: "Breacher", primary: "sg8", secondary: "h3", attachments: ["angled", "lightstock"], perks: ["quickmantle", "munitions", "rapid"], lethal: "adhesive", tactical: "obscurant", support: ["ammopod", "mortar", "uplink"] },
  ];
}

export interface ValidationResult { ok: boolean; errors: string[] }

/** Validates a loadout against content tables (and an optional owned-set). Used for tamper rejection. */
export function validateLoadout(l: Loadout, owned?: Set<string>): ValidationResult {
  const errors: string[] = [];
  const has = (id: string) => !owned || owned.has(id);
  const pw = WEAPONS[l.primary];
  const sw = WEAPONS[l.secondary];
  if (!pw || pw.slot !== "primary") errors.push("Invalid primary weapon");
  else if (!has(l.primary)) errors.push(`${pw.name} is not unlocked`);
  if (!sw || sw.slot !== "secondary") errors.push("Invalid sidearm");
  else if (!has(l.secondary)) errors.push(`${sw.name} is not unlocked`);
  if (!Array.isArray(l.attachments)) errors.push("Attachments malformed");
  else {
    if (l.attachments.length > MAX_ATTACHMENTS) errors.push(`Maximum ${MAX_ATTACHMENTS} attachments`);
    const slots = new Set<string>();
    for (const id of l.attachments) {
      const a = ATTACHMENTS[id];
      if (!a) { errors.push(`Unknown attachment ${String(id)}`); continue; }
      if (slots.has(a.slot)) errors.push(`Two ${a.slot} attachments`);
      slots.add(a.slot);
      if (pw && a.excludeClasses?.includes(pw.cls)) errors.push(`${a.name} cannot be fitted to the ${pw.name}`);
      if (!has(id)) errors.push(`${a.name} is not unlocked`);
    }
  }
  if (!Array.isArray(l.perks) || l.perks.length !== 3) errors.push("Perks malformed");
  else PERK_GROUPS.forEach((g, i) => {
    const p = PERKS[l.perks[i]];
    if (!p || p.group !== g) errors.push(`Invalid ${g} perk`);
    else if (!has(p.id)) errors.push(`${p.name} is not unlocked`);
  });
  const le = EQUIPMENT[l.lethal];
  if (!le || le.slot !== "lethal") errors.push("Invalid lethal equipment");
  const te = EQUIPMENT[l.tactical];
  if (!te || te.slot !== "tactical") errors.push("Invalid tactical equipment");
  if (!Array.isArray(l.support) || l.support.length !== 3) errors.push("Support actions malformed");
  else SUPPORT_TIERS.forEach((t, i) => {
    if (!SUPPORT_BY_TIER[t].includes(l.support[i])) errors.push(`Invalid tier ${t} support`);
    else if (!SUPPORTS[l.support[i]]) errors.push("Unknown support");
  });
  return { ok: errors.length === 0, errors };
}

/** Repairs a possibly tampered loadout by falling back to defaults; returns a valid loadout. */
export function sanitizeLoadout(l: Loadout | undefined | null, fallback = defaultLoadouts()[0]): Loadout {
  if (!l) return structuredClone(fallback);
  return validateLoadout(l).ok ? l : structuredClone(fallback);
}

export interface WeaponStats {
  def: WeaponDef;
  magSize: number;
  reserve: number;
  rpm: number;
  interval: number; // seconds between shots
  damage: number;
  falloffRange: number;
  reloadTactical: number;
  reloadEmpty: number;
  swapTime: number;
  adsTime: number;
  adsFov: number;
  adsMove: number;
  moveMul: number;
  sprintOut: number;
  hipSpread: number;
  hipSpreadMove: number;
  adsSpread: number;
  recoilPitch: number;
  recoilYaw: number;
  recoverRate: number;
  suppressed: boolean;
  loudness: number;
  attachments: string[];
}

export function resolveWeaponStats(weaponId: string, attachmentIds: string[], perkIds: string[]): WeaponStats {
  const def = WEAPONS[weaponId];
  const s: WeaponStats = {
    def, magSize: def.magSize, reserve: 0, rpm: def.rpm, interval: 60 / def.rpm, damage: def.damage, falloffRange: 1,
    reloadTactical: def.reloadTactical, reloadEmpty: def.reloadEmpty, swapTime: def.swapTime, adsTime: def.adsTime,
    adsFov: def.adsFovMul, adsMove: def.adsMoveMul, moveMul: def.moveMul, sprintOut: def.sprintOut,
    hipSpread: def.hipSpread, hipSpreadMove: def.hipSpreadMove, adsSpread: def.adsSpread, recoilPitch: 1, recoilYaw: 1,
    recoverRate: def.recoil.recoverRate, suppressed: false, loudness: def.loudness, attachments: [],
  };
  const fitted = def.slot === "primary" ? attachmentIds : attachmentIds.filter((id) => ATTACHMENTS[id]?.slot === "magazine");
  for (const id of fitted) {
    const a = ATTACHMENTS[id];
    if (!a || a.excludeClasses?.includes(def.cls)) continue;
    s.attachments.push(id);
    const m = a.mods;
    if (m.adsTime) s.adsTime *= m.adsTime;
    if (m.adsFov) s.adsFov *= m.adsFov;
    if (m.recoilPitch) s.recoilPitch *= m.recoilPitch;
    if (m.recoilYaw) s.recoilYaw *= m.recoilYaw;
    if (m.recoverRate) s.recoverRate *= m.recoverRate;
    if (m.hipSpread) { s.hipSpread *= m.hipSpread; s.hipSpreadMove *= m.hipSpread; }
    if (m.adsSpread) s.adsSpread *= m.adsSpread;
    if (m.range) s.falloffRange *= m.range;
    if (m.moveMul) s.moveMul *= m.moveMul;
    if (m.adsMove) s.adsMove *= m.adsMove;
    if (m.magSize) s.magSize = Math.max(1, Math.round(s.magSize * m.magSize));
    if (m.reload) { s.reloadTactical *= m.reload; s.reloadEmpty *= m.reload; }
    if (m.swapTime) s.swapTime *= m.swapTime;
    if (m.sprintOut) s.sprintOut *= m.sprintOut;
    if (m.suppressed) s.suppressed = true;
    if (m.loudness) s.loudness *= m.loudness;
  }
  let mags = def.reserveMags;
  if (perkIds.includes("scavenger")) mags += 1;
  s.reserve = mags * def.magSize;
  if (perkIds.includes("rapid")) s.swapTime *= 0.75;
  if (perkIds.includes("lightkit")) { s.sprintOut *= 0.85; s.adsMove *= 1.08; }
  s.adsFov = Math.max(0.3, s.adsFov);
  return s;
}
