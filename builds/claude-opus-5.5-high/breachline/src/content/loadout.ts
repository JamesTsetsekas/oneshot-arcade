import { WEAPONS, PRIMARY_IDS, SIDEARM_IDS } from "./weapons";
import { ATTACHMENTS, PERKS, EQUIPMENT, SUPPORT, MAX_ATTACHMENTS, AttachmentSlot } from "./items";
import { CONTENT_VERSION } from "./tuning";

export interface Loadout {
  name: string;
  primary: string;
  primaryAttachments: string[];
  sidearm: string;
  perks: { mobility: string; awareness: string; sustain: string };
  lethal: string;
  tactical: string;
  support: [string, string, string]; // tier 3, 5, 8
}

export const DEFAULT_LOADOUTS: Loadout[] = [
  { name: "Assault", primary: "jackal", primaryAttachments: ["reflex", "stableGrip"], sidearm: "relay", perks: { mobility: "fleetBoots", awareness: "traceReader", sustain: "rapidReady" }, lethal: "frag", tactical: "flash", support: ["reconSweep", "hunterDrone", "interdictionFlight"] },
  { name: "Close Quarters", primary: "kestrel", primaryAttachments: ["reflex"], sidearm: "relay", perks: { mobility: "fleetBoots", awareness: "traceReader", sustain: "rapidReady" }, lethal: "frag", tactical: "flash", support: ["reconSweep", "hunterDrone", "interdictionFlight"] },
  { name: "Long Lane", primary: "jackal", primaryAttachments: ["stableGrip"], sidearm: "relay", perks: { mobility: "fleetBoots", awareness: "traceReader", sustain: "rapidReady" }, lethal: "frag", tactical: "flash", support: ["reconSweep", "hunterDrone", "interdictionFlight"] },
  { name: "Custom 4", primary: "kestrel", primaryAttachments: [], sidearm: "relay", perks: { mobility: "fleetBoots", awareness: "traceReader", sustain: "rapidReady" }, lethal: "frag", tactical: "flash", support: ["reconSweep", "hunterDrone", "interdictionFlight"] },
  { name: "Custom 5", primary: "jackal", primaryAttachments: [], sidearm: "relay", perks: { mobility: "fleetBoots", awareness: "traceReader", sustain: "rapidReady" }, lethal: "frag", tactical: "flash", support: ["reconSweep", "hunterDrone", "interdictionFlight"] },
];

export interface UnlockContext { level: number; allUnlocked?: boolean }

export function isUnlocked(level: number, ctx: UnlockContext): boolean {
  return !!ctx.allUnlocked || ctx.level >= level;
}

export interface ValidationResult { ok: boolean; errors: string[]; version: string }

/** Server-side style validation against owned/unlocked IDs and ruleset version. */
export function validateLoadout(l: unknown, ctx: UnlockContext): ValidationResult {
  const errors: string[] = [];
  const lo = l as Partial<Loadout> | null;
  if (!lo || typeof lo !== "object") return { ok: false, errors: ["Loadout missing"], version: CONTENT_VERSION };
  const p = lo.primary && WEAPONS[lo.primary];
  if (!p || !PRIMARY_IDS.includes(lo.primary!)) errors.push("Invalid primary weapon");
  else if (!isUnlocked(p.unlockLevel, ctx)) errors.push(`${p.name} is locked (level ${p.unlockLevel})`);
  const s = lo.sidearm && WEAPONS[lo.sidearm];
  if (!s || !SIDEARM_IDS.includes(lo.sidearm!)) errors.push("Invalid sidearm");
  else if (!isUnlocked(s.unlockLevel, ctx)) errors.push(`${s.name} is locked (level ${s.unlockLevel})`);
  const atts = Array.isArray(lo.primaryAttachments) ? lo.primaryAttachments : null;
  if (!atts) errors.push("Attachments malformed");
  else {
    if (atts.length > MAX_ATTACHMENTS) errors.push(`At most ${MAX_ATTACHMENTS} attachments`);
    const slots = new Set<AttachmentSlot>();
    for (const id of atts) {
      const a = ATTACHMENTS[id];
      if (!a) { errors.push(`Unknown attachment ${String(id)}`); continue; }
      if (slots.has(a.slot)) errors.push(`Two ${a.slot} attachments conflict`);
      slots.add(a.slot);
      if (p && !a.classes.includes(p.cls)) errors.push(`${a.name} does not fit ${p.name}`);
      if (!isUnlocked(a.unlockLevel, ctx)) errors.push(`${a.name} is locked (level ${a.unlockLevel})`);
    }
  }
  const perks = lo.perks;
  if (!perks) errors.push("Perks missing");
  else {
    for (const g of ["mobility", "awareness", "sustain"] as const) {
      const pk = PERKS[perks[g]];
      if (!pk || pk.group !== g) errors.push(`Invalid ${g} perk`);
      else if (!isUnlocked(pk.unlockLevel, ctx)) errors.push(`${pk.name} is locked (level ${pk.unlockLevel})`);
    }
  }
  const le = lo.lethal && EQUIPMENT[lo.lethal];
  if (!le || le.kind !== "lethal") errors.push("Invalid lethal equipment");
  else if (!isUnlocked(le.unlockLevel, ctx)) errors.push(`${le.name} is locked`);
  const ta = lo.tactical && EQUIPMENT[lo.tactical];
  if (!ta || ta.kind !== "tactical") errors.push("Invalid tactical equipment");
  else if (!isUnlocked(ta.unlockLevel, ctx)) errors.push(`${ta.name} is locked`);
  const sup = lo.support;
  if (!Array.isArray(sup) || sup.length !== 3) errors.push("Three support actions required");
  else {
    const tiers = [3, 5, 8];
    sup.forEach((id, i) => {
      const sd = SUPPORT[id];
      if (!sd || sd.tier !== tiers[i]) errors.push(`Invalid tier-${tiers[i]} support action`);
      else if (!isUnlocked(sd.unlockLevel, ctx)) errors.push(`${sd.name} is locked`);
    });
  }
  return { ok: errors.length === 0, errors, version: CONTENT_VERSION };
}

export function cloneLoadout(l: Loadout): Loadout {
  return JSON.parse(JSON.stringify(l));
}
