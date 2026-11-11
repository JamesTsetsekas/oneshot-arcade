// Attachments: each has a visible tradeoff. Multipliers are applied by resolveWeaponStats().
export type AttachSlot = "optic" | "barrel" | "underbarrel" | "magazine" | "stock";

export interface AttachmentDef {
  id: string;
  name: string;
  slot: AttachSlot;
  pro: string;
  con: string;
  excludeClasses?: string[];
  mods: Partial<{
    adsTime: number;
    adsFov: number;
    recoilPitch: number;
    recoilYaw: number;
    recoverRate: number;
    hipSpread: number;
    adsSpread: number;
    range: number;
    moveMul: number;
    adsMove: number;
    magSize: number;
    reload: number;
    swapTime: number;
    sprintOut: number;
    suppressed: boolean;
    loudness: number;
  }>;
}

const LIST: AttachmentDef[] = [
  { id: "reflex", name: "Reflex Sight", slot: "optic", pro: "Clean sight picture, steadier ADS", con: "Slightly slower to aim",
    mods: { adsTime: 1.1, adsSpread: 0.85 }, excludeClasses: ["marksman"] },
  { id: "optic2x", name: "2x Optic", slot: "optic", pro: "Magnified view, tighter ADS", con: "Slower ADS and slower walk while aimed",
    mods: { adsFov: 0.62, adsTime: 1.22, adsMove: 0.94 }, excludeClasses: ["shotgun", "marksman"] },
  { id: "suppressor", name: "Suppressor", slot: "barrel", pro: "Quiet, no tracer, hidden from the radar", con: "Shorter effective range",
    mods: { suppressed: true, range: 0.88, loudness: 0.4 }, excludeClasses: ["shotgun"] },
  { id: "compensator", name: "Compensator", slot: "barrel", pro: "Less vertical recoil", con: "Wider hip-fire spread",
    mods: { recoilPitch: 0.84, hipSpread: 1.15 } },
  { id: "lightbarrel", name: "Light Barrel", slot: "barrel", pro: "Faster aim-down-sights", con: "Reduced range",
    mods: { adsTime: 0.86, range: 0.92 } },
  { id: "angled", name: "Angled Grip", slot: "underbarrel", pro: "Tighter hip fire", con: "Slower ADS",
    mods: { hipSpread: 0.82, adsTime: 1.08 } },
  { id: "stable", name: "Stable Grip", slot: "underbarrel", pro: "Less lateral recoil, faster recovery", con: "Slower weapon swap",
    mods: { recoilYaw: 0.72, recoverRate: 1.15, swapTime: 1.12 } },
  { id: "extmag", name: "Extended Magazine", slot: "magazine", pro: "+40% magazine", con: "Slower reload, slightly slower movement",
    mods: { magSize: 1.4, reload: 1.14, moveMul: 0.985 }, excludeClasses: ["shotgun", "marksman"] },
  { id: "quickmag", name: "Quick Magazine", slot: "magazine", pro: "Much faster reload", con: "-20% magazine",
    mods: { magSize: 0.8, reload: 0.75 }, excludeClasses: ["shotgun", "marksman"] },
  { id: "lightstock", name: "Light Stock", slot: "stock", pro: "Faster movement and sprint-to-fire", con: "More recoil",
    mods: { moveMul: 1.03, sprintOut: 0.85, recoilPitch: 1.08, recoilYaw: 1.08 } },
  { id: "fixedstock", name: "Fixed Stock", slot: "stock", pro: "Less recoil, steadier aim", con: "Slower movement",
    mods: { recoilPitch: 0.9, recoilYaw: 0.9, adsSpread: 0.9, moveMul: 0.97 } },
];

export const ATTACHMENTS: Record<string, AttachmentDef> = Object.fromEntries(LIST.map((a) => [a.id, a]));
export const ATTACHMENT_SLOTS: AttachSlot[] = ["optic", "barrel", "underbarrel", "magazine", "stock"];
export const MAX_ATTACHMENTS = 3;
