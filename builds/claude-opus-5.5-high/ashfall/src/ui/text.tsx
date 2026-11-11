import React from "react";
import { AFFIX_BY_ID, BASE_BY_ID, GLYPH_BY_ID, RELIC_BY_ID } from "../data/items";
import { SKILL_BY_ID, skillCoeff, skillCooldown } from "../data/skills";
import type { EquipSlot, SkillDef, StatId } from "../data/types";
import { RARITY_COLOR, RARITY_LABEL, RARITY_MARK, itemName, type Item } from "../items/item";
import { computeStats } from "../progression/stats";
import type { Game } from "../sim/game";
import { rankLevelReq } from "../progression/skilltree";

const STAT_TEXT: Partial<Record<StatId, [string, boolean?]>> = {
  might: ["Might"], finesse: ["Finesse"], will: ["Will"], vigor: ["Vigor"], maxHealth: ["maximum Health"], maxHealthPct: ["maximum Health", true], maxFocus: ["maximum Focus"],
  focusRegen: ["Focus regenerated per second"], focusOnHit: ["Focus on attack hit"], armor: ["Armor"], armorPct: ["Armor", true], resEmber: ["Ember resistance", true],
  resFrost: ["Frost resistance", true], resBlight: ["Blight resistance", true], resAll: ["to all resistances", true], flatPhys: ["Physical damage to hits"], flatEmber: ["Ember damage to hits"],
  flatFrost: ["Frost damage to hits"], flatBlight: ["Blight damage to hits"], pctPhys: ["Physical damage", true], pctEmber: ["Ember damage", true], pctFrost: ["Frost damage", true],
  pctBlight: ["Blight damage", true], pctMelee: ["melee damage", true], pctProjectile: ["projectile damage", true], pctArea: ["area damage", true], pctTrap: ["trap damage", true], pctAll: ["damage", true],
  attackSpeed: ["attack and cast speed", true], cdr: ["cooldown recovery", true], critChance: ["critical chance", true], critDamage: ["critical damage", true], moveSpeed: ["movement speed", true],
  evadeRecovery: ["evade charge recovery", true], potionPower: ["potion effectiveness", true], healthOnKill: ["Health on kill"], lifeOnHit: ["Health on hit"], blockChance: ["block chance", true],
  retaliation: ["retaliation damage"], heatGain: ["Heat gain", true], markDamage: ["Trace mark damage", true], trapDamage: ["trap damage", true], burnChance: ["chance to Burn", true],
  chillChance: ["chance to Chill", true], blightChance: ["chance to Blight", true], ailmentRes: ["ailment resistance", true], dmgVsBurning: ["damage against Burning enemies", true],
  dmgVsMarked: ["damage against Traced enemies", true], dmgVsElites: ["damage against elites and bosses", true], dmgWhileGuarded: ["damage while Guarded", true], dmgAtRange: ["damage against enemies beyond 6 m", true],
  goldFind: ["gold found", true], rarityFind: ["chance of rarer items", true], rankAll: ["to all skills"],
};

export const STAT_HINT: Partial<Record<StatId, string>> = {
  dmgVsBurning: "Burning: Ember damage over time from Brand Arc, Cinder Ring, flames.",
  dmgVsMarked: "Trace marks come from Quickshot after moving 2 m.",
  heatGain: "Cinder Vow gains Heat when hit or blocking.",
  retaliation: "Dealt back to melee attackers; scales with level.",
  dmgWhileGuarded: "Guard comes from Bastion Step.",
  armor: "Reduces Physical hits; less effective against big hits.",
};

export function statText(stat: StatId, v: number): string {
  if (stat.startsWith("rank:")) { const s = SKILL_BY_ID[stat.slice(5)]; return `+${v} to ${s?.name ?? stat} rank`; }
  const t = STAT_TEXT[stat];
  if (!t) return `${v > 0 ? "+" : ""}${v} ${stat}`;
  const sign = v >= 0 ? "+" : "−";
  return `${sign}${Math.abs(Math.round(v * 10) / 10)}${t[1] ? "%" : ""} ${t[0]}`;
}

export function slotLabel(slot: string) {
  return ({ mainhand: "Main hand", offhand: "Off hand", head: "Head", chest: "Chest", gloves: "Gloves", boots: "Boots", belt: "Belt", amulet: "Amulet", ring: "Ring", ring1: "Ring", ring2: "Ring" } as Record<string, string>)[slot] ?? slot;
}

export function itemIcon(it: Item): string {
  if (it.kind === "glyph") return "✧";
  const k = BASE_BY_ID[it.baseId].kind;
  return ({ mace: "⚒", maul: "⚒", bow: "➶", longbow: "➶", shield: "⛉", quiver: "↟", helm: "⛑", chest: "⛊", gloves: "✋", boots: "⊔", belt: "═", amulet: "☉", ring: "◯" } as Record<string, string>)[k] ?? "▪";
}

function deltas(game: Game, it: Item): { label: string; d: number; pct?: boolean }[] {
  if (it.kind !== "gear") return [];
  const ch = game.ch;
  const slot = game.slotFor(it);
  const base = BASE_BY_ID[it.baseId];
  const before = game.stats;
  const eq = { ...ch.equipment } as Record<EquipSlot, Item | null>;
  eq[slot] = it;
  if (base.twoHanded && base.kind === "maul") eq.offhand = null;
  const after = computeStats({ ...ch, equipment: eq }, {}, ch.difficulty === "veteran");
  const avg = (s: typeof before) => ((s.weapon[0] + s.weapon[1]) / 2 + (s.raw.flatPhys ?? 0)) * s.attackSpeed * (1 + s.primaryBonus / 100) * (1 + s.critChance * (s.critMult - 1));
  const out: { label: string; d: number; pct?: boolean }[] = [
    { label: "Basic attack damage/s", d: avg(after) - avg(before) },
    { label: "Health", d: after.maxHealth - before.maxHealth },
    { label: "Armor", d: after.armor - before.armor },
    { label: "Focus", d: after.maxFocus - before.maxFocus },
    { label: "Crit chance", d: (after.critChance - before.critChance) * 100, pct: true },
    { label: "Ember res", d: after.res.ember - before.res.ember, pct: true },
    { label: "Frost res", d: after.res.frost - before.res.frost, pct: true },
    { label: "Blight res", d: after.res.blight - before.res.blight, pct: true },
    { label: "Move speed", d: ((after.moveSpeed - before.moveSpeed) / before.moveSpeed) * 100, pct: true },
  ];
  return out.filter((x) => Math.abs(x.d) >= 0.5);
}

export function ItemTooltip({ it, game, title, showDeltas = true }: { it: Item; game: Game; title?: string; showDeltas?: boolean }) {
  const adv = (window as any).__ashSettings?.advancedItems;
  if (it.kind === "glyph") {
    const g = GLYPH_BY_ID[it.baseId];
    return (
      <div className="tooltip">
        {title && <div className="tt-title">{title}</div>}
        <div className="tt-name" style={{ color: "#c8a0ff" }}>✧ {g.name}</div>
        <div className="tt-sub">Glyph · Tier {g.tier}</div>
        <div className="tt-line">{statText(g.stat, g.value)}</div>
        <div className="tt-hint">Socket into gear at the Artificer. Three matching glyphs combine into the next tier.</div>
      </div>
    );
  }
  const base = BASE_BY_ID[it.baseId];
  const relic = it.relicId ? RELIC_BY_ID[it.relicId] : null;
  const canUse = game.canEquip(it);
  const ds = showDeltas ? deltas(game, it) : [];
  return (
    <div className="tooltip" style={{ borderColor: RARITY_COLOR[it.rarity] }}>
      {title && <div className="tt-title">{title}</div>}
      <div className="tt-name" style={{ color: RARITY_COLOR[it.rarity] }}>{RARITY_MARK[it.rarity]} {itemName(it)} {it.favorite && "★"}</div>
      <div className="tt-sub">{RARITY_LABEL[it.rarity]} {base.name} · {slotLabel(base.slot)}{base.twoHanded ? " (two-handed)" : ""}{adv ? ` · ilvl ${it.ilvl}` : ""}</div>
      {base.damage && <div className="tt-line big">{base.damage[0]}–{base.damage[1]} weapon damage{base.attackSpeed !== 1 ? ` · ${base.attackSpeed}× speed` : ""}</div>}
      {Object.entries(base.implicit).map(([k, v]) => <div className="tt-line implicit" key={k}>{statText(k as StatId, v as number)}</div>)}
      {!it.identified && <div className="tt-warn">Unidentified — Calder the Artificer can reveal its {it.affixes.length} properties.</div>}
      {it.identified && relic && <div className="tt-relic">{relic.power}</div>}
      {it.identified && relic && Object.entries(relic.fixed).map(([k, v]) => <div className="tt-line relicfix" key={k}>{statText(k as StatId, v as number)}</div>)}
      {it.identified && it.affixes.map((a, i) => {
        const d = AFFIX_BY_ID[a.id];
        const tier = d.tiers[a.tier - 1];
        const hint = STAT_HINT[d.stat];
        return (
          <div className="tt-line affix" key={i} title={hint}>
            {statText(d.stat, a.value)}
            {adv && <span className="tt-range"> T{a.tier} [{tier.min}–{tier.max}]</span>}
            {d.classTag && <span className="tt-range"> ({d.classTag === "cinder" ? "Cinder Vow" : "Veil Ranger"})</span>}
            {hint && <div className="tt-hint">{hint}</div>}
          </div>
        );
      })}
      {it.sockets > 0 && <div className="tt-line sockets">{it.glyphs.map((g, i) => <span key={i}>{g ? `● ${GLYPH_BY_ID[g].name} (${statText(GLYPH_BY_ID[g].stat, GLYPH_BY_ID[g].value)})` : "○ Empty socket"} </span>)}</div>}
      <div className={`tt-line ${it.durability <= 0 ? "bad" : "dim"}`}>{it.maxDurability < 900 ? `Durability ${Math.ceil(it.durability)}/${it.maxDurability}${it.durability <= 0 ? " — BROKEN (no stats)" : ""}` : "Indestructible"}</div>
      <div className={`tt-line ${game.ch.level < base.reqLevel ? "bad" : "dim"}`}>Requires level {base.reqLevel}</div>
      {base.classReq && <div className={`tt-line ${base.classReq !== game.ch.classId ? "bad" : "dim"}`}>{base.classReq === "cinder" ? "Cinder Vow" : "Veil Ranger"} only</div>}
      {ds.length > 0 && canUse.ok && (
        <div className="tt-deltas">
          <div className="tt-title">If equipped:</div>
          {ds.map((x) => <div key={x.label} className={x.d > 0 ? "good" : "bad"}>{x.d > 0 ? "▲ +" : "▼ "}{Math.round(x.d * 10) / 10}{x.pct ? "%" : ""} {x.label}</div>)}
        </div>
      )}
    </div>
  );
}

export function skillLines(s: SkillDef, rank: number, game: Game): string[] {
  const st = game.stats;
  const lines: string[] = [];
  const kind = { basic: "Basic attack", core: "Core skill", active: "Active skill", ultimate: "Ultimate", passive: "Passive", capstone: "Capstone (exclusive)" }[s.kind];
  lines.push(`${kind} · ${s.tags.join(", ")}`);
  if (s.kind !== "passive" && s.kind !== "capstone") {
    const parts: string[] = [];
    if (s.cost) parts.push(`${s.cost} Focus`);
    if (s.heatCost) parts.push(`${s.heatCost} Heat to start`);
    if (s.cooldown) parts.push(`${skillCooldown(s, st.cdr).toFixed(1)} s cooldown`);
    if (s.charges) parts.push(`${s.charges} charges`);
    if (s.kind === "basic") parts.push("builds Focus");
    lines.push(parts.join(" · "));
    if (s.coeff.base > 0) {
      const cur = Math.round(skillCoeff(s, Math.max(1, rank)) * 100);
      const nxt = Math.round(skillCoeff(s, rank + 1) * 100);
      lines.push(`${cur}% weapon damage as ${s.damageType}${s.maxRank > 1 && rank < s.maxRank ? ` (next rank: ${nxt}%)` : ""}`);
    }
    if (s.ailment) lines.push(`${Math.round(s.ailment.chance * 100)}% chance to ${s.ailment.type}`);
    lines.push(`Range ${s.range} m · ${Math.round((s.timing.impact + s.timing.recovery) / st.attackSpeed)} ms action, movement may cancel after ${Math.round(s.timing.cancel * 100)}%`);
  } else if (s.passive) {
    lines.push(Object.entries(s.passive).map(([k, v]) => statText(k as StatId, (v as number) * Math.max(1, rank))).join(", ") + (rank > 0 && rank < s.maxRank ? `  (next: ${Object.entries(s.passive).map(([k, v]) => statText(k as StatId, (v as number) * (rank + 1))).join(", ")})` : ""));
  }
  if (s.prereq) lines.push(`Requires: ${s.prereq.map((p) => SKILL_BY_ID[p].name).join(", ")}`);
  if (s.exclusiveWith) lines.push(`Mutually exclusive with ${SKILL_BY_ID[s.exclusiveWith].name}`);
  if (rank < s.maxRank) lines.push(`Next rank requires level ${rankLevelReq(s.id, rank + 1)}`);
  return lines;
}
