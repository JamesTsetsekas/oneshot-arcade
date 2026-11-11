import { SKILL_BY_ID, basicSkill, coreSkill, classSkills } from "../data/skills";
import type { CharacterData } from "./character";
import { respecCost } from "./character";

/** Level required to reach a given rank of a skill (ranks beyond the first need +2 levels each). */
export function rankLevelReq(skillId: string, rank: number): number {
  const s = SKILL_BY_ID[skillId];
  return s.reqLevel + Math.max(0, rank - 1) * 2;
}

export type RankCheck = { ok: true } | { ok: false; reason: string };

export function canRankUp(ch: CharacterData, skillId: string): RankCheck {
  const s = SKILL_BY_ID[skillId];
  if (!s || s.classId !== ch.classId) return { ok: false, reason: "Not a skill of your class" };
  const cur = ch.ranks[skillId] ?? 0;
  if (cur >= s.maxRank) return { ok: false, reason: "Maximum rank" };
  if (ch.skillPoints <= 0) return { ok: false, reason: "No skill points" };
  const need = rankLevelReq(skillId, cur + 1);
  if (ch.level < need) return { ok: false, reason: `Requires level ${need}` };
  for (const p of s.prereq ?? []) if ((ch.ranks[p] ?? 0) < 1) return { ok: false, reason: `Requires ${SKILL_BY_ID[p].name}` };
  if (s.exclusiveWith && (ch.ranks[s.exclusiveWith] ?? 0) > 0) return { ok: false, reason: `Exclusive with ${SKILL_BY_ID[s.exclusiveWith].name}` };
  return { ok: true };
}

export function rankUp(ch: CharacterData, skillId: string): boolean {
  const c = canRankUp(ch, skillId);
  if (!c.ok) return false;
  ch.ranks[skillId] = (ch.ranks[skillId] ?? 0) + 1;
  ch.skillPoints--;
  // auto-place newly unlocked actives on the first free hotbar slot
  const s = SKILL_BY_ID[skillId];
  if (ch.ranks[skillId] === 1 && (s.kind === "active" || s.kind === "ultimate" || s.kind === "core") && !ch.hotbar.includes(skillId)) {
    const free = ch.hotbar.findIndex((h, i) => i > 0 && h === null);
    if (free >= 0) ch.hotbar[free] = skillId;
  }
  return true;
}

export function spentSkillPoints(ch: CharacterData): number {
  let n = 0;
  for (const [id, r] of Object.entries(ch.ranks)) {
    if (id === basicSkill(ch.classId)) continue;
    n += id === coreSkill(ch.classId) ? r - 1 : r;
  }
  return n;
}

export function respec(ch: CharacterData, free = false): { ok: boolean; cost: number; reason?: string } {
  const cost = free ? 0 : respecCost(ch);
  if (ch.gold < cost) return { ok: false, cost, reason: "Not enough gold" };
  ch.gold -= cost;
  const refunded = spentSkillPoints(ch);
  ch.ranks = { [basicSkill(ch.classId)]: 1, [coreSkill(ch.classId)]: 1 };
  ch.skillPoints += refunded;
  const attrSpent = ch.attrs.might + ch.attrs.finesse + ch.attrs.will + ch.attrs.vigor;
  ch.attrs = { might: 0, finesse: 0, will: 0, vigor: 0 };
  ch.attrPoints += attrSpent;
  ch.hotbar = [coreSkill(ch.classId), null, null, null, null];
  return { ok: true, cost };
}

export function assignHotbar(ch: CharacterData, slot: number, skillId: string | null): boolean {
  if (slot < 0 || slot > 4) return false;
  if (skillId) {
    const s = SKILL_BY_ID[skillId];
    if (!s || s.classId !== ch.classId || (ch.ranks[skillId] ?? 0) < 1) return false;
    if (s.kind === "passive" || s.kind === "capstone" || s.kind === "basic") return false;
    const existing = ch.hotbar.indexOf(skillId);
    if (existing >= 0) ch.hotbar[existing] = ch.hotbar[slot];
  }
  ch.hotbar[slot] = skillId;
  return true;
}

export function classTree(ch: CharacterData) {
  return classSkills(ch.classId);
}
