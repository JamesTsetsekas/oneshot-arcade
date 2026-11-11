import React, { useState } from "react";
import { controller } from "../app/controller";
import { AFFIX_BY_ID, POTION_INFO, POTION_KINDS, GLYPH_BY_ID } from "../data/items";
import { ENEMIES } from "../data/enemies";
import { canAddSocket, identifyCost, repairCost, rerollCost, socketCost } from "../items/generate";
import { Grid } from "../items/inventory";
import { itemName, salvageYield, RARITY_COLOR, type Item } from "../items/item";
import { SKILL_BY_ID } from "../data/skills";
import { WAYPOINTS } from "../world";
import { GridView, HoverTip, InventoryPanel, confirmThen, guardedAction, useGameVersion, useHover } from "./panels";
import { store, toast, useStore } from "./store";
import { statText } from "./text";

function Head({ title }: { title: string }) {
  return <div className="panel-head"><h2>{title}</h2><button className="x" onClick={() => controller.closePanel()}>✕</button></div>;
}
const report = (r: string | null, ok?: string) => { if (r) toast(r, "warn"); else if (ok) toast(ok); store.bump(); };

export function VendorPanel() {
  const g = useGameVersion();
  const { hover, setHover } = useHover();
  const stock = new Grid(10, 6);
  for (const it of g.vendorStock) stock.add(it);
  return (
    <div className="service-wrap">
      <div className="panel vendor">
        <Head title="Odo the Trader" />
        <div className="sub">“Ash-salt, star-iron, and draughts. Nothing free but advice.” Stock refreshes each time you return to the Refuge.</div>
        <h3>Draughts</h3>
        <div className="potions-buy">
          {POTION_KINDS.map((k) => (
            <button key={k} onClick={() => report(g.buyPotion(k))} title={POTION_INFO[k].desc}>
              <i style={{ background: POTION_INFO[k].color }} /> {POTION_INFO[k].name} — {POTION_INFO[k].price}g <small>({g.ch.belt[k]}/{g.ch.beltCap})</small>
            </button>
          ))}
        </div>
        <h3>Wares <small>(click to buy)</small></h3>
        <GridView grid={stock} hover={setHover} onItemClick={(it) => { const i = g.vendorStock.indexOf(it); confirmThen(`Buy ${itemName(it)} for ${g.buyPrice(it)} gold?`, "Buy", () => report(g.buy(i))); }} />
        <div className="inv-foot"><span>◉ {g.ch.gold} gold</span><span className="hint">Selling: click items in your inventory. Favorited items are protected.</span></div>
        {hover && <div className="price-tag" style={{ left: hover.x + 12, top: hover.y - 26 }}>{g.buyPrice(hover.it)} gold</div>}
        <HoverTip hover={hover} ctrl={false} />
      </div>
      <InventoryPanel mode="vendor" />
    </div>
  );
}

export function StashPanel() {
  const g = useGameVersion();
  const { hover, setHover } = useHover();
  const st = Grid.from(g.ch.stash);
  return (
    <div className="service-wrap">
      <div className="panel stash">
        <Head title="Warden's Stash" />
        <div className="sub">Items here are kept safe across expeditions and difficulties. Click to take.</div>
        <GridView grid={st} hover={setHover} onItemClick={(it) => report(g.fromStash(it.uid))} />
        <HoverTip hover={hover} ctrl={false} />
      </div>
      <InventoryPanel mode="stash" />
    </div>
  );
}

type ArtTab = "identify" | "salvage" | "reroll" | "repair" | "socket" | "glyphs";

export function ArtificerPanel() {
  const g = useGameVersion();
  const [tab, setTab] = useState<ArtTab>("identify");
  const [affix, setAffix] = useState<number | null>(null);
  const sel = useStore((s) => (s as any).artSel as number | null);
  const it = sel ? g.findItem(sel) : undefined;
  const invItems = Grid.from(g.ch.inventory).items();
  const eqItems = Object.values(g.ch.equipment).filter((x): x is Item => !!x);
  const tabs: [ArtTab, string][] = [["identify", "Identify"], ["salvage", "Salvage"], ["reroll", "Reroll affix"], ["repair", "Repair"], ["socket", "Sockets & glyphs"], ["glyphs", "Combine glyphs"]];
  const pickList = (items: Item[], filter: (i: Item) => boolean) => (
    <div className="pick-list">
      {items.filter(filter).map((i) => (
        <button key={i.uid} className={sel === i.uid ? "sel" : ""} style={{ color: i.kind === "glyph" ? "#c8a0ff" : RARITY_COLOR[i.rarity] }} onClick={() => { store.set({ artSel: i.uid } as any); setAffix(null); }}>{itemName(i)}</button>
      ))}
      {items.filter(filter).length === 0 && <div className="dim">Nothing suitable.</div>}
    </div>
  );
  const glyphGroups = new Map<string, number>();
  for (const i of invItems) if (i.kind === "glyph") glyphGroups.set(i.baseId, (glyphGroups.get(i.baseId) ?? 0) + 1);
  return (
    <div className="service-wrap">
      <div className="panel artificer">
        <Head title="Calder the Artificer" />
        <div className="tabs">{tabs.map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => { setTab(k); setAffix(null); }}>{l}</button>)}</div>
        <div className="art-body">
          {tab === "identify" && <>
            <p>Reveal the properties of Inscribed items and Relics.</p>
            {pickList([...invItems, ...eqItems], (i) => i.kind === "gear" && !i.identified)}
            {it && !it.identified && <button className="act" onClick={() => report(g.identify(it.uid))}>Identify — {identifyCost(it)} gold</button>}
          </>}
          {tab === "salvage" && <>
            <p>Break an unwanted item into dust. Favorited and equipped items are protected; Relics ask for confirmation.</p>
            {pickList(invItems, () => true)}
            {it && invItems.includes(it) && <button className="act danger" onClick={() => { const yieldN = salvageYield(it); confirmThen(`Salvage ${itemName(it)} for ${yieldN} dust? It will be destroyed.`, "Salvage", () => { guardedAction(it, "Salvage", (c) => g.salvage(it.uid, c)); store.set({ artSel: null } as any); }); }}>Salvage → {salvageYield(it)} dust</button>}
          </>}
          {tab === "reroll" && <>
            <p>Choose ONE affix to reroll. Other affixes stay. Cost rises with each reroll of the same item.</p>
            {pickList([...invItems, ...eqItems], (i) => i.kind === "gear" && i.identified && i.affixes.length > 0)}
            {it && it.identified && it.affixes.length > 0 && <>
              <div className="affix-pick">{it.affixes.map((a, i) => <button key={i} className={affix === i ? "sel" : ""} onClick={() => setAffix(i)}>{statText(AFFIX_BY_ID[a.id].stat, a.value)} <small>({AFFIX_BY_ID[a.id].kind}, T{a.tier})</small></button>)}</div>
              {affix !== null && <div className="preview">Result: a random {AFFIX_BY_ID[it.affixes[affix].id].kind} allowed for this item type, never duplicating another affix group. Tier depends on item level {it.ilvl}.</div>}
              {affix !== null && <button className="act" onClick={() => { const c = rerollCost(it); confirmThen(`Reroll "${statText(AFFIX_BY_ID[it.affixes[affix].id].stat, it.affixes[affix].value)}" for ${c.gold} gold and ${c.dust} dust?`, "Reroll", () => report(g.reroll(it.uid, affix), "Affix rerolled")); }}>Reroll — {rerollCost(it).gold} gold + {rerollCost(it).dust} dust</button>}
            </>}
          </>}
          {tab === "repair" && <>
            <p>Restore durability. Broken items (0) give no stats until repaired.</p>
            {[...eqItems, ...invItems].filter((i) => i.kind === "gear" && i.durability < i.maxDurability).map((i) => <div key={i.uid} className="repair-row"><span style={{ color: RARITY_COLOR[i.rarity] }}>{itemName(i)}</span> <small>{Math.ceil(i.durability)}/{i.maxDurability}</small> <button onClick={() => report(g.repair(i.uid))}>{repairCost(i)}g</button></div>)}
            <button className="act" onClick={() => report(g.repair("all"), "Repaired")}>Repair all</button>
          </>}
          {tab === "socket" && <>
            <p>Add one extra socket to an item (once per item, up to its base maximum), and set glyphs into empty sockets.</p>
            {pickList([...invItems, ...eqItems], (i) => i.kind === "gear")}
            {it && it.kind === "gear" && <>
              <div className="dim">Sockets: {it.glyphs.map((gg) => (gg ? `● ${GLYPH_BY_ID[gg].name}` : "○ empty")).join(", ") || "none"}</div>
              {canAddSocket(it) ? <button className="act" onClick={() => report(g.addSocket(it.uid), "Socket added")}>Add socket — {socketCost(it).gold} gold + {socketCost(it).dust} dust</button> : <div className="dim">No further socket can be added.</div>}
              {it.glyphs.includes(null) && <div className="pick-list">{invItems.filter((x) => x.kind === "glyph").map((gl) => <button key={gl.uid} style={{ color: "#c8a0ff" }} onClick={() => report(g.socketGlyph(it.uid, gl.uid), "Glyph set")}>Set {GLYPH_BY_ID[gl.baseId].name} ({statText(GLYPH_BY_ID[gl.baseId].stat, GLYPH_BY_ID[gl.baseId].value)})</button>)}</div>}
            </>}
          </>}
          {tab === "glyphs" && <>
            <p>Combine three matching glyphs into one of the next tier.</p>
            {[...glyphGroups.entries()].map(([id, n]) => <div key={id} className="repair-row"><span style={{ color: "#c8a0ff" }}>{GLYPH_BY_ID[id].name} ×{n}</span><button disabled={n < 3 || GLYPH_BY_ID[id].tier >= 3} onClick={() => report(g.combineGlyphs(id), "Glyphs combined")}>Combine 3</button></div>)}
            {glyphGroups.size === 0 && <div className="dim">You carry no glyphs.</div>}
          </>}
        </div>
        <div className="inv-foot"><span>◉ {g.ch.gold} gold</span><span>✦ {g.ch.dust} dust</span></div>
      </div>
      <InventoryPanel mode="artificer" />
    </div>
  );
}

export function WaypointPanel() {
  const g = useGameVersion();
  return (
    <div className="panel waypoint">
      <Head title="Waypoints" />
      <div className="sub">Travel between kindled waypoints. Dying returns you to the last waypoint you touched.</div>
      {Object.entries(WAYPOINTS).map(([id, w]) => {
        const has = g.ch.waypoints.includes(id);
        const here = g.zone.id === w.zone;
        return <button key={id} className="wp" disabled={!has || (here && id !== "threshold" && id !== "depths")} onClick={() => { g.requestZone(w.zone, w.entry); controller.closePanel(); }}>{has ? "◈" : "◇"} {w.name}{here ? " (here)" : ""}{!has ? " — not yet found" : ""}</button>;
      })}
    </div>
  );
}

export function DialogPanel() {
  const g = useGameVersion();
  const npc = useStore((s) => s.dialogNpc);
  const q = g.ch.quests;
  if (npc === "ivra") {
    const done = g.ch.actComplete[g.ch.difficulty];
    let text = "The ash has buried the old road, Warden. Find the Ashway shrine and kindle it, so we can move people and supplies. The Toll-Keeper still bars the crypt road beyond.";
    if (q.ashway.status === "done" && q.open_archive.status !== "done") text = "The Ashway burns again — good. Now the gate: the Toll-Keeper hoards the way into the Hollow Archive. Break its armor and it will stagger. Watch its chain; step to the side, not back.";
    else if (q.open_archive.status === "done" && !g.ch.flags.artificer_rescued) text = "Calder the Artificer went into the Archive and never came back. If he lives, he is somewhere on the first floor. Bring him home and he can work wonders with what you find.";
    else if (g.ch.flags.artificer_rescued && q.engine.status !== "done") text = "Calder is home, thanks to you. Below the Archive, something prays in light — the Orison Engine, wound about the buried star. Silence it.";
    if (done) text = "You silenced the Engine. The star still burns below, but the hymn is broken. If you want to go deeper — the Veteran road is harder, and richer. Or retrace a new path through a shifted March.";
    return (
      <div className="panel dialog">
        <Head title="Marshal Ivra" />
        <p className="npc-text">“{text}”</p>
        <div className="dialog-opts">
          {g.ch.veteranUnlocked && g.ch.difficulty === "normal" && <button onClick={() => confirmThen("Begin the Veteran expedition? Quests and waypoints reset; enemies grow stronger (elites gain two modifiers, −20% resistances, better affix tiers). Recommended level 15.", "Begin Veteran", () => { g.startVeteran(); controller.closePanel(); store.bump(); })}>Begin Veteran expedition (recommended level 15)</button>}
          {done && <button onClick={() => confirmThen("Start a new seeded expedition at this difficulty? The March and the Archive will be re-generated and refilled; quest completion is kept.", "New expedition", () => { g.newExpedition(); controller.closePanel(); store.bump(); })}>New seeded expedition (farm)</button>}
          <button onClick={() => controller.openPanel("quests")}>Quest log</button>
          <button onClick={() => controller.closePanel()}>Farewell</button>
        </div>
      </div>
    );
  }
  if (npc === "wren") return (<div className="panel dialog"><Head title="Sister Wren" /><p className="npc-text">“Hold still. There — the ash is out of your wounds. Come back whenever you need mending; it costs nothing here.”</p><p className="dim">Health and Focus restored, ailments cleansed.</p><div className="dialog-opts"><button onClick={() => controller.closePanel()}>Thank you</button></div></div>);
  if (npc === "sela") return (<div className="panel dialog"><Head title="Hunter Sela" /><p className="npc-text">{q.hunter.status === "done" ? "“The bandolier suits you. Hunt well.”" : "“The mire pack has my scent. Stay sharp.”"}</p><div className="dialog-opts"><button onClick={() => controller.closePanel()}>Leave</button></div></div>);
  return null;
}

export function TrainingPanel() {
  const g = useGameVersion();
  useStore((s) => s.hud);
  const tr = g.training;
  const secs = Math.max(1, (tr.last - tr.start) || 1);
  const total = tr.total;
  return (
    <div className="panel training">
      <Head title="Training Cell — Drill Bell" />
      <div className="sub">No loot or experience here. Respec is free while inside the cell.</div>
      <h3>Summon a sparring foe (your level)</h3>
      <div className="spawn-grid">{ENEMIES.filter((e) => e.behavior !== "dummy").map((e) => <button key={e.id} title={e.flavor} onClick={() => g.spawnTraining(e.id)}>{e.name}</button>)}</div>
      <div className="dialog-opts"><button onClick={() => g.clearTraining()}>Clear foes & reset meter</button><button onClick={() => controller.openPanel("skills")}>Skills</button></div>
      <h3>Damage breakdown</h3>
      <div className="statrow"><span>Total</span><b>{Math.round(total)} ({(total / secs).toFixed(1)} dps)</b></div>
      {Object.entries(tr.bySkill).sort((a, b) => b[1] - a[1]).map(([k, v]) => <div className="statrow" key={k}><span>{SKILL_BY_ID[k]?.name ?? k}</span><b>{Math.round(v)} · {Math.round((v / Math.max(1, total)) * 100)}%</b></div>)}
    </div>
  );
}

export function HuntPanel() {
  const g = useGameVersion();
  const best = g.ch.stats.huntBest;
  return (
    <div className="panel hunt">
      <Head title="Target Hunt" />
      <div className="sub">A short seeded route straight to a defeated boss. Normal loot rules apply; your best time is recorded. The main expedition is untouched.</div>
      {[["tollkeeper", "The Toll-Keeper"], ["engine", "Orison Engine"]].map(([id, n]) => (
        <button key={id} className="wp" onClick={() => { g.startHunt(id as any); controller.closePanel(); }}>Hunt {n}{best[`hunt_${id}`] ? ` — best ${best[`hunt_${id}`]} s` : ""}</button>
      ))}
    </div>
  );
}
