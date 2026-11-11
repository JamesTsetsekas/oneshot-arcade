import React, { useEffect, useState } from "react";
import { controller } from "../app/controller";
import { BASE_BY_ID, GLYPH_BY_ID, AFFIX_BY_ID } from "../data/items";
import { classSkills, SKILL_BY_ID } from "../data/skills";
import type { EquipSlot, SkillDef } from "../data/types";
import { Grid } from "../items/inventory";
import { RARITY_COLOR, RARITY_MARK, itemName, itemSize, type Item } from "../items/item";
import { CLASS_INFO, LEVEL_CAP, respecCost, type AttrId } from "../progression/character";
import { QUESTS } from "../progression/quests";
import { canRankUp } from "../progression/skilltree";
import { FORMULAS, RES_CAP } from "../progression/stats";
import { MapCanvas } from "./hud";
import { store, toast, useStore } from "./store";
import { ItemTooltip, itemIcon, skillLines, slotLabel, statText } from "./text";

export const CELL = 40;

export function useGameVersion() {
  useStore((s) => s.version);
  useStore((s) => s.hud?.gold);
  return controller.game!;
}

export function confirmThen(text: string, yes: string, fn: () => void) {
  store.set({ confirm: { text, yes, onYes: fn } });
}

/** Runs a destructive item action with the protection/confirmation rules from the simulation. */
export function guardedAction(it: Item, verb: string, run: (confirmed: boolean) => string | null) {
  const r = run(false);
  if (r === "confirm") confirmThen(`${verb} the Relic ${itemName(it)}? This cannot be undone.`, verb, () => { const r2 = run(true); if (r2) toast(r2, "warn"); store.bump(); });
  else if (r) toast(r, "warn");
  store.bump();
}

interface Hover { it: Item; x: number; y: number; equippedSlot?: EquipSlot }
export function useHover() {
  const [hover, setHover] = useState<Hover | null>(null);
  return { hover, setHover };
}

export function HoverTip({ hover, ctrl }: { hover: Hover | null; ctrl: boolean }) {
  const g = controller.game!;
  if (!hover) return null;
  const it = hover.it;
  const compare = store.get().compare || ctrl;
  let equipped: Item[] = [];
  if (compare && it.kind === "gear" && !hover.equippedSlot) {
    const slot = BASE_BY_ID[it.baseId].slot;
    equipped = (slot === "ring" ? [g.ch.equipment.ring1, g.ch.equipment.ring2] : [g.ch.equipment[slot as EquipSlot]]).filter((x): x is Item => !!x);
  }
  const left = hover.x > window.innerWidth / 2;
  return (
    <div className="hovertip" style={{ left: left ? undefined : hover.x + 18, right: left ? window.innerWidth - hover.x + 18 : undefined, top: Math.min(hover.y, window.innerHeight - 420) }}>
      <ItemTooltip it={it} game={g} showDeltas={!hover.equippedSlot} title={hover.equippedSlot ? "Equipped" : undefined} />
      {equipped.map((e) => <ItemTooltip key={e.uid} it={e} game={g} title="Currently equipped" showDeltas={false} />)}
    </div>
  );
}

function useCtrl() {
  const [ctrl, setCtrl] = useState(false);
  useEffect(() => {
    const d = (e: KeyboardEvent) => { if (e.code === controller.settings.keys.compare) setCtrl(true); };
    const u = (e: KeyboardEvent) => { if (e.code === controller.settings.keys.compare) setCtrl(false); };
    window.addEventListener("keydown", d); window.addEventListener("keyup", u);
    return () => { window.removeEventListener("keydown", d); window.removeEventListener("keyup", u); };
  }, []);
  return ctrl;
}

export function ItemCell({ it, x, y, dim, onClick, onContext, onHover, onDragStart }: { it: Item; x: number; y: number; dim?: boolean; onClick?: () => void; onContext?: (e: React.MouseEvent) => void; onHover: (h: Hover | null) => void; onDragStart?: (e: React.PointerEvent) => void }) {
  const [w, h] = itemSize(it);
  const color = it.kind === "glyph" ? "#c8a0ff" : RARITY_COLOR[it.rarity];
  return (
    <div className={`icell r-${it.rarity} ${dim ? "dim" : ""} ${it.durability <= 0 ? "broken" : ""}`} style={{ left: x * CELL, top: y * CELL, width: w * CELL - 2, height: h * CELL - 2, borderColor: color }}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      onContextMenu={(e) => { e.preventDefault(); onContext?.(e); }}
      onPointerDown={(e) => { if (e.button === 0) onDragStart?.(e); }}
      onMouseEnter={(e) => onHover({ it, x: e.clientX, y: e.clientY })} onMouseMove={(e) => onHover({ it, x: e.clientX, y: e.clientY })} onMouseLeave={() => onHover(null)}>
      <span className="icell-icon" style={{ color }}>{itemIcon(it)}</span>
      <span className="icell-mark" style={{ color }}>{it.kind === "glyph" ? `T${GLYPH_BY_ID[it.baseId].tier}` : RARITY_MARK[it.rarity]}</span>
      {it.favorite && <span className="icell-fav">★</span>}
      {!it.identified && <span className="icell-unid">?</span>}
      {it.sockets > 0 && <span className="icell-sock">{it.glyphs.map((g) => (g ? "●" : "○")).join("")}</span>}
    </div>
  );
}

export function GridView({ grid, onItemClick, onContext, filter, hover, onDropCell, dragUid, onDragStart }: { grid: Grid; onItemClick: (it: Item) => void; onContext?: (it: Item, e: React.MouseEvent) => void; filter?: string; hover: (h: Hover | null) => void; onDropCell?: (x: number, y: number) => void; dragUid?: number | null; onDragStart?: (it: Item, e: React.PointerEvent) => void }) {
  const f = (filter ?? "").trim().toLowerCase();
  const matches = (it: Item) => {
    if (!f) return true;
    const txt = [itemName(it), it.rarity, it.kind === "gear" ? BASE_BY_ID[it.baseId].kind : "glyph", ...it.affixes.map((a) => statText(AFFIX_BY_ID[a.id].stat, a.value))].join(" ").toLowerCase();
    return txt.includes(f);
  };
  return (
    <div className="grid" style={{ width: grid.w * CELL, height: grid.h * CELL }}
      onPointerUp={(e) => { if (!onDropCell || dragUid == null) return; const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); onDropCell(Math.floor((e.clientX - r.left) / CELL), Math.floor((e.clientY - r.top) / CELL)); }}>
      {Array.from({ length: grid.w * grid.h }, (_, i) => <div key={i} className="gcell" style={{ left: (i % grid.w) * CELL, top: Math.floor(i / grid.w) * CELL }} />)}
      {grid.placed.map((p) => <ItemCell key={p.item.uid} it={p.item} x={p.x} y={p.y} dim={!matches(p.item) || dragUid === p.item.uid} onClick={() => onItemClick(p.item)} onContext={(e) => onContext?.(p.item, e)} onHover={hover} onDragStart={(e) => onDragStart?.(p.item, e)} />)}
    </div>
  );
}

const EQ_LAYOUT: [EquipSlot, number, number, number, number][] = [
  ["head", 112, 0, 56, 56], ["amulet", 182, 18, 40, 40], ["mainhand", 22, 70, 72, 112], ["chest", 104, 70, 72, 104], ["offhand", 186, 70, 72, 112],
  ["gloves", 22, 192, 56, 56], ["belt", 104, 184, 72, 36], ["boots", 202, 192, 56, 56], ["ring1", 84, 228, 40, 40], ["ring2", 156, 228, 40, 40],
];

export function InventoryPanel({ mode }: { mode?: "vendor" | "stash" | "artificer" }) {
  const g = useGameVersion();
  const { hover, setHover } = useHover();
  const ctrl = useCtrl();
  const [filter, setFilter] = useState("");
  const [menu, setMenu] = useState<{ it: Item; x: number; y: number } | null>(null);
  const [drag, setDrag] = useState<{ uid: number; sx: number; sy: number; moved: boolean } | null>(null);
  const compare = useStore((s) => s.compare);
  const inv = Grid.from(g.ch.inventory);
  useEffect(() => {
    if (!drag) return;
    const mv = (e: PointerEvent) => { if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 6) setDrag({ ...drag, moved: true }); };
    const up = () => setTimeout(() => setDrag(null), 0);
    window.addEventListener("pointermove", mv); window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); };
  }, [drag]);
  const primary = (it: Item) => {
    if (drag?.moved) return;
    if (mode === "vendor") return guardedAction(it, "Sell", (c) => g.sell(it.uid, c));
    if (mode === "stash") { const r = g.toStash(it.uid); if (r) toast(r, "warn"); store.bump(); return; }
    if (mode === "artificer") { store.set({ artSel: it.uid } as any); store.bump(); return; }
    if (it.kind === "gear") { g.equip(it.uid); store.bump(); }
  };
  const actions = (it: Item): [string, () => void][] => {
    const list: [string, () => void][] = [];
    if (it.kind === "gear") list.push(["Equip", () => g.equip(it.uid)]);
    if (it.kind === "gear" && BASE_BY_ID[it.baseId].slot === "ring") list.push(["Equip (right ring)", () => g.equip(it.uid, "ring2")]);
    list.push([it.favorite ? "Unfavorite" : "Favorite ★", () => g.toggleFavorite(it.uid)]);
    if (mode === "vendor") list.push(["Sell", () => guardedAction(it, "Sell", (c) => g.sell(it.uid, c))]);
    if (mode === "stash") list.push(["Move to stash", () => { const r = g.toStash(it.uid); if (r) toast(r, "warn"); }]);
    if (g.ch.flags.artificer_rescued && mode === "artificer") list.push(["Salvage", () => guardedAction(it, "Salvage", (c) => g.salvage(it.uid, c))]);
    list.push(["Drop", () => guardedAction(it, "Drop", (c) => g.dropFromInventory(it.uid, c))]);
    return list;
  };
  const eqDrop = (slot: EquipSlot) => { if (drag?.moved) { const it = inv.find(drag.uid)?.item; if (it) { g.equip(drag.uid, slot.startsWith("ring") && BASE_BY_ID[it.baseId]?.slot === "ring" ? slot : undefined); store.bump(); } } };
  return (
    <div className="panel inventory" onClick={() => setMenu(null)}>
      <div className="panel-head"><h2>Inventory</h2><button className="x" onClick={() => controller.closePanel()}>✕</button></div>
      <div className="equip">
        <div className="silhouette">{g.ch.classId === "cinder" ? "♜" : "♞"}</div>
        {EQ_LAYOUT.map(([slot, x, y, w, h]) => {
          const it = g.ch.equipment[slot];
          return (
            <div key={slot} className="eqslot" style={{ left: x, top: y, width: w, height: h, borderColor: it ? RARITY_COLOR[it.rarity] : undefined }}
              onClick={() => { if (it) { g.unequip(slot); store.bump(); setHover(null); } }}
              onPointerUp={() => eqDrop(slot)}
              onMouseEnter={(e) => it && setHover({ it, x: e.clientX, y: e.clientY, equippedSlot: slot })} onMouseLeave={() => setHover(null)}>
              {it ? <span className="icell-icon" style={{ color: RARITY_COLOR[it.rarity] }}>{itemIcon(it)}</span> : <span className="eqlabel">{slotLabel(slot)}</span>}
              {it && it.durability <= 0 && <span className="broken-tag">broken</span>}
            </div>
          );
        })}
      </div>
      <div className="inv-tools">
        <input placeholder="Search / filter…" value={filter} onChange={(e) => setFilter(e.target.value)} />
        <button onClick={() => { g.sortInventory(); store.bump(); }}>Sort</button>
        <label title="Show the equipped item side by side (hold Ctrl when off)"><input type="checkbox" checked={compare} onChange={(e) => store.set({ compare: e.target.checked })} /> Compare</label>
      </div>
      <GridView grid={inv} filter={filter} hover={setHover} onItemClick={primary} onContext={(it, e) => setMenu({ it, x: e.clientX, y: e.clientY })}
        dragUid={drag?.moved ? drag.uid : null}
        onDragStart={(it, e) => setDrag({ uid: it.uid, sx: e.clientX, sy: e.clientY, moved: false })}
        onDropCell={(x, y) => { if (drag?.moved) { g.moveInInventory(drag.uid, x, y); store.bump(); } }} />
      <div className="inv-foot">
        <span>◉ {g.ch.gold} gold</span><span>✦ {g.ch.dust} dust</span><span>{inv.freeCells()} free cells</span>
        <span className="hint">{mode === "vendor" ? "Click: sell" : mode === "stash" ? "Click: to stash" : mode === "artificer" ? "Click: select for crafting" : "Click: equip · Right-click: actions · Drag: move"}</span>
      </div>
      {menu && (
        <div className="ctxmenu" style={{ left: menu.x, top: menu.y }} onClick={(e) => e.stopPropagation()}>
          {actions(menu.it).map(([l, fn]) => <button key={l} onClick={() => { fn(); setMenu(null); store.bump(); }}>{l}</button>)}
        </div>
      )}
      <HoverTip hover={drag?.moved ? null : hover} ctrl={ctrl} />
    </div>
  );
}

// ───────────────────────── skills ─────────────────────────
export function SkillsPanel() {
  const g = useGameVersion();
  const [hover, setHover] = useState<{ s: SkillDef; x: number; y: number } | null>(null);
  const [pick, setPick] = useState<string | null>(null);
  const skills = classSkills(g.ch.classId);
  const actives = skills.filter((s) => s.kind === "basic" || s.kind === "core" || s.kind === "active" || s.kind === "ultimate");
  const passives = skills.filter((s) => s.kind === "passive");
  const caps = skills.filter((s) => s.kind === "capstone");
  const slotNames = ["RMB", "Q", "W", "E", "R"];
  const node = (s: SkillDef) => {
    const r = g.ch.ranks[s.id] ?? 0;
    const c = canRankUp(g.ch, s.id);
    const bonus = g.stats.rank(s.id) - r;
    const assignable = r > 0 && s.kind !== "passive" && s.kind !== "capstone" && s.kind !== "basic";
    return (
      <div key={s.id} className={`snode ${r > 0 ? "learned" : ""} ${c.ok ? "can" : ""} ${pick === s.id ? "picked" : ""} k-${s.kind}`}
        onMouseEnter={(e) => setHover({ s, x: e.clientX, y: e.clientY })} onMouseLeave={() => setHover(null)}
        onClick={() => { if (assignable) setPick(pick === s.id ? null : s.id); }}>
        <div className="snode-icon">{s.icon}</div>
        <div className="snode-name">{s.name}</div>
        <div className="snode-rank">{r}/{s.maxRank}{bonus > 0 && r > 0 ? <em> +{bonus}</em> : null}</div>
        {s.kind !== "basic" && <button className="plus" disabled={!c.ok} title={c.ok ? "Spend a skill point" : (c as any).reason} onClick={(e) => { e.stopPropagation(); g.rankSkill(s.id); store.bump(); }}>+</button>}
        {g.ch.hotbar.includes(s.id) && <div className="snode-slot">{slotNames[g.ch.hotbar.indexOf(s.id)]}</div>}
      </div>
    );
  };
  return (
    <div className="panel skills">
      <div className="panel-head"><h2>{CLASS_INFO[g.ch.classId].name} — Skills</h2><button className="x" onClick={() => controller.closePanel()}>✕</button></div>
      <div className="points">Skill points: <b>{g.ch.skillPoints}</b> · Level {g.ch.level}/{LEVEL_CAP}</div>
      <div className="tree">
        <div className="tree-col"><h3>Actives</h3>{actives.map(node)}</div>
        <div className="tree-col"><h3>Passives</h3>{passives.map(node)}<h3>Capstones (choose one)</h3>{caps.map(node)}</div>
      </div>
      <div className="hotbar-assign">
        <span>{pick ? `Assign ${SKILL_BY_ID[pick].name} to:` : "Click a learned active, then a slot to assign it."}</span>
        {slotNames.map((n, i) => <button key={n} className={pick ? "hot" : ""} onClick={() => { if (pick) { g.setHotbar(i, pick); setPick(null); } else g.setHotbar(i, null); store.bump(); }} title={g.ch.hotbar[i] ? SKILL_BY_ID[g.ch.hotbar[i]!].name : "empty"}>{n}: {g.ch.hotbar[i] ? SKILL_BY_ID[g.ch.hotbar[i]!].icon : "—"}</button>)}
      </div>
      <div className="respec">
        <button onClick={() => { const cost = g.zone.id === "training" ? 0 : respecCost(g.ch); confirmThen(`Reset all skill and attribute points${cost ? ` for ${cost} gold` : " (free)"}?`, "Respec", () => { const r = g.respecAll(); if (r) toast(r, "warn"); store.bump(); }); }}>Respec ({g.zone.id === "training" ? "free here" : respecCost(g.ch) ? `${respecCost(g.ch)} gold` : "free through level 8"})</button>
        {[0, 1].map((i) => (
          <span key={i} className="loadout">
            Loadout {i === 0 ? "A" : "B"}{g.ch.loadouts[i] ? ` (saved)` : ""}:
            <button onClick={() => { g.saveLoadout(i, i === 0 ? "A" : "B"); toast(`Loadout ${i === 0 ? "A" : "B"} saved`); store.bump(); }}>Save</button>
            <button disabled={!g.ch.loadouts[i]} onClick={() => { const r = g.applyLoadout(i); toast(r ?? `Loadout ${i === 0 ? "A" : "B"} applied`, r ? "warn" : "info"); store.bump(); }}>Apply</button>
          </span>
        ))}
      </div>
      {hover && (
        <div className="hovertip" style={{ left: Math.min(hover.x + 16, window.innerWidth - 380), top: Math.min(hover.y, window.innerHeight - 300) }}>
          <div className="tooltip">
            <div className="tt-name">{hover.s.icon} {hover.s.name} <small>rank {g.ch.ranks[hover.s.id] ?? 0}/{hover.s.maxRank}</small></div>
            <div className="tt-line">{hover.s.summary}</div>
            {skillLines(hover.s, g.stats.rank(hover.s.id), g).map((l, i) => <div key={i} className="tt-line dim">{l}</div>)}
          </div>
        </div>
      )}
    </div>
  );
}

// ───────────────────────── character ─────────────────────────
export function CharacterPanel() {
  const g = useGameVersion();
  const st = g.stats;
  const [adv, setAdv] = useState(false);
  const attrs: [AttrId, string, string][] = [
    ["might", "Might", "+1.5 armor; +1% damage for Cinder Vow"], ["finesse", "Finesse", "+0.06% crit, +0.4% attack speed; +1% damage for Veil Ranger"],
    ["will", "Will", "+1 Focus, +0.8% elemental damage, +0.1% cooldown recovery"], ["vigor", "Vigor", "+4 Health, +0.5 armor"],
  ];
  const row = (l: string, v: string, f?: string) => <div className="statrow" title={f}><span>{l}</span><b>{v}</b></div>;
  return (
    <div className="panel character">
      <div className="panel-head"><h2>{g.ch.name}</h2><button className="x" onClick={() => controller.closePanel()}>✕</button></div>
      <div className="sub">{CLASS_INFO[g.ch.classId].name} · Level {g.ch.level} · {g.ch.difficulty === "veteran" ? "Veteran" : "Normal"}</div>
      <div className="attrs">
        <div className="points">Attribute points: <b>{g.ch.attrPoints}</b></div>
        {attrs.map(([k, n, d]) => (
          <div className="statrow" key={k} title={d}><span>{n}</span><b>{st.attrs[k]}</b><button className="plus" disabled={g.ch.attrPoints <= 0} onClick={() => { g.allocAttr(k); store.bump(); }}>+</button><small>{d}</small></div>
        ))}
      </div>
      <div className="stats">
        {row("Health", `${st.maxHealth}`, FORMULAS.maxHealth)}
        {row("Focus", `${st.maxFocus} (+${st.focusRegen.toFixed(1)}/s)`, FORMULAS.maxFocus)}
        {row("Armor", `${st.armor}`, FORMULAS.armor)}
        {row("Ember resistance", `${st.res.ember}% (cap ${RES_CAP}%)`, FORMULAS.res)}
        {row("Frost resistance", `${st.res.frost}% (cap ${RES_CAP}%)`, FORMULAS.res)}
        {row("Blight resistance", `${st.res.blight}% (cap ${RES_CAP}%)`, FORMULAS.res)}
        {row("Weapon damage", `${st.weapon[0]}–${st.weapon[1]}`)}
        {row("Critical chance", `${(st.critChance * 100).toFixed(1)}%`, FORMULAS.crit)}
        {row("Critical damage", `${Math.round(st.critMult * 100)}%`, FORMULAS.critMult)}
        {row("Attack speed", `${st.attackSpeed.toFixed(2)}×`, FORMULAS.attackSpeed)}
        {row("Block chance", `${Math.round(st.blockChance * 100)}%`, FORMULAS.block)}
        {row("Move speed", `${st.moveSpeed.toFixed(1)} m/s`)}
        {row("Evade", `${st.evadeCharges} charges, ${st.evadeRecharge.toFixed(1)} s each`)}
        {adv && <>
          {row("Primary attribute bonus", `+${st.primaryBonus.toFixed(0)}% damage`, FORMULAS.primary)}
          {row("Elemental bonus", `+${st.elementalBonus.toFixed(0)}%`, FORMULAS.elemental)}
          {row("Cooldown recovery", `${st.cdr.toFixed(1)}% (cap 40%)`, FORMULAS.cdr)}
          {row("Potion effectiveness", `${Math.round(st.potionPower * 100)}%`)}
          {Object.entries(st.raw).filter(([k, v]) => v && !["armor", "maxHealth"].includes(k)).map(([k, v]) => <div className="statrow small" key={k}><span>{statText(k as any, v as number)}</span></div>)}
          {row("Kills / deaths", `${g.ch.stats.kills} / ${g.ch.stats.deaths}`)}
          {row("Play time", `${Math.floor(g.ch.stats.playTime / 60)} min`)}
        </>}
        <label className="advtoggle"><input type="checkbox" checked={adv} onChange={(e) => setAdv(e.target.checked)} /> Advanced stats</label>
      </div>
    </div>
  );
}

export function QuestPanel() {
  const g = useGameVersion();
  return (
    <div className="panel quests">
      <div className="panel-head"><h2>Quest Log — Act I: The Buried Star</h2><button className="x" onClick={() => controller.closePanel()}>✕</button></div>
      <div className="sub">Difficulty: {g.ch.difficulty === "veteran" ? "Veteran" : "Normal"}{g.ch.actComplete.normal ? " · Normal complete" : ""}{g.ch.actComplete.veteran ? " · Veteran complete" : ""}</div>
      {QUESTS.map((q) => {
        const st = g.ch.quests[q.id];
        if (!st || st.status === "inactive") return <div key={q.id} className="quest locked"><b>{q.optional ? "(Optional) " : ""}???</b></div>;
        return (
          <div key={q.id} className={`quest ${st.status}`}>
            <b>{q.optional ? "(Optional) " : ""}{q.name}</b> <small>{st.status === "done" ? "✓ Complete" : ""}</small>
            <ol>{q.steps.map((s, i) => <li key={i} className={st.status === "done" || i < st.step ? "done" : i === st.step ? "cur" : "todo"}>{i <= st.step || st.status === "done" ? s : "…"}</li>)}</ol>
            <div className="reward">Reward: {q.reward.text}</div>
          </div>
        );
      })}
    </div>
  );
}

export function MapPanel() {
  const g = useGameVersion();
  return (
    <div className="panel map">
      <div className="panel-head"><h2>{g.zone.name}</h2><button className="x" onClick={() => controller.closePanel()}>✕</button></div>
      <MapCanvas />
      <div className="legend">◈ waypoint · ⇵ exit (red = sealed) · ● NPC · ! quest · ⌐ lever · ☽ your Echo · only explored ground is shown</div>
    </div>
  );
}
