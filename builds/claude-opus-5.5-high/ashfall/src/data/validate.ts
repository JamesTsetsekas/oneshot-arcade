import { CONTENT_VERSION, DAMAGE_TYPES, ROLE_POINTS, type SkillDef } from "./types";
import { SKILLS } from "./skills";
import { ENEMIES, ELITE_MODS } from "./enemies";
import { AFFIXES, BASE_ITEMS, BASE_BY_ID, GLYPHS, RELICS } from "./items";
import { BOSS_DEFS } from "../sim/boss";

/** Lightweight schema validation of all content tables. Returns a list of problems (empty = valid). */
export function validateContent(): string[] {
  const errs: string[] = [];
  const need = (cond: unknown, msg: string) => { if (!cond) errs.push(msg); };
  const ids = new Set<string>();
  const unique = (id: string, kind: string) => { need(!ids.has(`${kind}:${id}`), `duplicate ${kind} id ${id}`); ids.add(`${kind}:${id}`); };

  const skillFields: (keyof SkillDef)[] = ["id", "classId", "name", "kind", "tags", "cost", "cooldown", "targeting", "range", "timing", "coeff", "damageType", "allowedModifiers", "vfx", "sfx", "threat", "maxRank", "reqLevel", "summary", "icon"];
  for (const s of SKILLS) {
    unique(s.id, "skill");
    for (const f of skillFields) need(s[f] !== undefined, `skill ${s.id} missing ${String(f)}`);
    need(DAMAGE_TYPES.includes(s.damageType), `skill ${s.id} bad damage type`);
    need(s.timing.cancel >= 0 && s.timing.cancel <= 1, `skill ${s.id} cancel window out of range`);
    if (s.kind !== "passive" && s.kind !== "capstone") {
      need(s.vfx.length > 0 && s.sfx.length > 0, `skill ${s.id} missing vfx/sfx ids`);
      need(s.timing.impact > 0, `skill ${s.id} needs impact timing`);
    }
    if (s.exclusiveWith) need(SKILLS.some((o) => o.id === s.exclusiveWith && o.exclusiveWith === s.id), `capstone ${s.id} exclusivity not mutual`);
    for (const p of s.prereq ?? []) need(SKILLS.some((o) => o.id === p), `skill ${s.id} prereq ${p} missing`);
  }
  for (const cls of ["cinder", "ranger"] as const) {
    const cs = SKILLS.filter((s) => s.classId === cls);
    need(cs.filter((s) => s.kind === "basic").length === 1, `${cls} needs one basic attack`);
    need(cs.filter((s) => s.kind === "core" || s.kind === "active" || s.kind === "ultimate").length === 6, `${cls} needs six actives`);
    need(cs.filter((s) => s.kind === "passive").length === 6, `${cls} needs six passives`);
    need(cs.filter((s) => s.kind === "capstone").length === 2, `${cls} needs two capstones`);
  }
  for (const e of ENEMIES) {
    unique(e.id, "enemy");
    need(ROLE_POINTS[e.role] !== undefined, `enemy ${e.id} bad role`);
    need(e.hp > 0 && e.radius > 0, `enemy ${e.id} bad stats`);
    for (const a of e.attacks) {
      need(a.windup >= 300 || a.dmg <= 1.2, `enemy ${e.id} attack ${a.id}: heavy hits need ≥300 ms telegraph`);
      need(a.recovery >= 0 && a.cooldown > 0, `enemy ${e.id} attack ${a.id} timing`);
    }
  }
  need(ENEMIES.filter((e) => e.behavior !== "dummy").length >= 10, "need ten normal enemies");
  need(ELITE_MODS.length >= 3, "need three elite modifiers");
  for (const m of ELITE_MODS) for (const x of m.excludes) need(ELITE_MODS.find((o) => o.id === x)?.excludes.includes(m.id), `elite exclusion ${m.id}/${x} not mutual`);
  need(Object.keys(BOSS_DEFS).includes("tollkeeper") && Object.keys(BOSS_DEFS).includes("engine"), "two bosses");
  for (const b of BASE_ITEMS) {
    unique(b.id, "base");
    need(b.size[0] * b.size[1] === 1 || (b.size[0] === 1 && b.size[1] === 2) || (b.size[0] === 2 && b.size[1] === 3), `base ${b.id} has unsupported size`);
    if (b.slot === "mainhand") need(!!b.damage, `weapon ${b.id} needs damage`);
  }
  need(BASE_ITEMS.length >= 78, `need ~80 base items, have ${BASE_ITEMS.length}`);
  for (const a of AFFIXES) {
    unique(a.id, "affix");
    need(a.tiers.length > 0 && a.tiers.every((t, i) => t.min <= t.max && (i === 0 || t.ilvl > a.tiers[i - 1].ilvl)), `affix ${a.id} tiers invalid`);
    need(a.slots.length > 0 && a.weight > 0, `affix ${a.id} slots/weight`);
  }
  need(AFFIXES.length >= 45, `need 45 affixes, have ${AFFIXES.length}`);
  need(RELICS.length >= 8, "need eight relics");
  for (const r of RELICS) { unique(r.id, "relic"); need(!!BASE_BY_ID[r.baseId], `relic ${r.id} base missing`); need(r.rolls >= 2 && r.rolls <= 3, `relic ${r.id} rolls`); }
  need(GLYPHS.length >= 9, "glyph tiers");
  need(CONTENT_VERSION >= 1, "content version");
  return errs;
}
