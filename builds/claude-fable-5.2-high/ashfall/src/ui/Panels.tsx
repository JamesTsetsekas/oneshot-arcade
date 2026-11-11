import { useState, type ReactNode } from 'react';
import { CLASSES, SKILL, classSkills, type SkillDef } from '../abilities/skills';
import { game } from '../app-shell/game';
import { ATTR_INFO } from '../entity-combat/stats';
import { EQUIP_SLOTS, type EquipSlot, type Hero, type Item } from '../entity-combat/types';
import { AFFIX, BASE, POTIONS, statText } from '../items/content';
import { SOCKET_COST, addSocket, buyItem, buyPotion, buyPrice, canSocket, combineGlyphs, identify, identifyCost, moveFromStash, moveToStash, potionPrice, repairAll, repairCost, rerollAffix, rerollCost, salvage, salvageYield, sellItem, sellValue, socketGlyph, vendorStock } from '../items/economy';
import { itemName, itemSize } from '../items/generate';
import { INV_H, INV_W, equipItem, removeItem, sortItems, unequip } from '../items/inventory';
import { LEVEL_CAP, allocAttr, applyLoadout, assignHotbar, canRank, rankUp, respec, respecCost, saveLoadout, xpToNext } from '../progression/progression';
import { QUEST, QUEST_DONE } from '../progression/quests';
import { ZONE_INFO } from '../world-generation/generate';
import { MapCanvas } from './Hud';
import { keyName, ui, useUi } from './store';
import { Btn, ItemIcon, ItemTip, SkillTip, Tip } from './widgets';

const CELLPX = 38;
function Panel({ title, side, children, wide }: { title: string; side: 'left' | 'right' | 'center'; children: ReactNode; wide?: boolean }) {
  return <div className={`panel ${side}${wide ? ' wide' : ''}`} onPointerDown={(e) => e.stopPropagation()}><div className="panel-head"><h2>{title}</h2><button className="x" onClick={() => game.closeAll()}>✕</button></div><div className="panel-body">{children}</div></div>;
}
function Grid({ items, hero, onClick, onContext, sel, filter, price }: { items: Item[]; hero: Hero; onClick: (it: Item) => void; onContext?: (it: Item) => void; sel?: string; filter?: string; price?: (it: Item) => string }) {
  const f = filter?.trim().toLowerCase();
  return (
    <div className="grid" style={{ width: INV_W * CELLPX, height: INV_H * CELLPX }}>
      {items.map((it) => {
        const [w, h] = itemSize(it);
        const dim = f && !(`${itemName(it)} ${['worn', 'tempered', 'inscribed', 'relic'][it.rarity]} ${it.kind === 'gear' ? BASE[it.base].slot + ' ' + BASE[it.base].type : 'glyph'}`.toLowerCase().includes(f));
        return (
          <Tip key={it.id} className={`cell r${it.rarity}${sel === it.id ? ' sel' : ''}${dim ? ' dim' : ''}${it.identified ? '' : ' unid'}`} content={() => <ItemTip item={it} hero={hero} price={price?.(it)} />}>
            <div className="cell-in" style={{ left: it.x * CELLPX, top: it.y * CELLPX, width: w * CELLPX - 2, height: h * CELLPX - 2 }} onClick={() => onClick(it)} onContextMenu={(e) => { e.preventDefault(); onContext?.(it); }}>
              <ItemIcon item={it} size={Math.min(w, h) * CELLPX - 10} />{it.fav && <i className="fav">★</i>}{it.sockets > 0 && <i className="sock">{it.glyphs.length ? '⬥' : '○'}</i>}
            </div>
          </Tip>
        );
      })}
    </div>
  );
}
const SLOT_POS: Record<EquipSlot, [number, number, string]> = { head: [1, 0, 'Head'], amulet: [2, 0, 'Amulet'], main: [0, 1, 'Main hand'], chest: [1, 1, 'Chest'], off: [2, 1, 'Off hand'], gloves: [0, 2, 'Gloves'], belt: [1, 2, 'Belt'], boots: [2, 2, 'Boots'], ring1: [0, 0, 'Ring'], ring2: [0, 3, 'Ring'] };

export function InventoryPanel() {
  useUi((s) => s.heroVersion);
  const dialog = useUi((s) => s.dialog);
  const [sel, setSel] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [confirm, setConfirm] = useState('');
  const s = game.session!;
  const hero = s.hero;
  const all = [...hero.inv, ...(Object.values(hero.equip).filter(Boolean) as Item[])];
  const item = all.find((i) => i.id === sel) ?? null;
  const equippedSlot = item ? (EQUIP_SLOTS.find((k) => hero.equip[k] === item) ?? null) : null;
  const vendor = dialog === 'vendor', stash = dialog === 'stash', art = dialog === 'artificer';
  const guarded = (key: string, fn: (c: boolean) => string | null) => game.act(() => { const r = fn(confirm === key); if (r === 'confirm') { setConfirm(key); return null; } setConfirm(''); if (!r) setSel(null); return r; });
  const quick = (it: Item) => {
    if (vendor) guarded('sell' + it.id, (c) => sellItem(hero, it.id, c));
    else if (stash) game.act(() => moveToStash(hero, it.id));
    else if (it.kind === 'gear') game.act(() => equipItem(hero, it.id), 'equip');
    else setSel(it.id);
  };
  const drop = (it: Item) => game.act(() => { if (it.fav) return 'Favorited items cannot be dropped.'; removeItem(hero.inv, it.id); s.zone.pickups.push({ id: s.id(), x: s.player.x + 0.8, y: s.player.y + 0.4, kind: 'item', amount: 1, item: it, t: 0 }); setSel(null); return null; });
  return (
    <>
      {vendor && <VendorSide hero={hero} />}
      {stash && <Panel title="Stash" side="left"><p className="note">Click an item to move it to your inventory. Right-click inventory items to store them.</p><Grid items={hero.stash} hero={hero} onClick={(it) => game.act(() => moveFromStash(hero, it.id))} /></Panel>}
      {art && <ArtificerSide hero={hero} item={item} confirm={confirm} guarded={guarded} />}
      <Panel title="Inventory" side="right">
        <div className="equip">
          {EQUIP_SLOTS.map((k) => {
            const it = hero.equip[k], [cx, cy, name] = SLOT_POS[k];
            const blocked = k === 'off' && hero.equip.main && BASE[hero.equip.main.base].twoHand;
            return (
              <div key={k} className={`eslot ${k} r${it?.rarity ?? 'n'}${sel === it?.id ? ' sel' : ''}${blocked ? ' blocked' : ''}`} style={{ gridColumn: k === 'ring2' ? 3 : k === 'ring1' ? 1 : cx + 1, gridRow: k.startsWith('ring') ? 4 : cy + 1 }}>
                {it ? <Tip content={() => <ItemTip item={it} hero={hero} compare={false} label={name} />}><div className="eslot-in" onClick={() => setSel(it.id)} onContextMenu={(e) => { e.preventDefault(); game.act(() => unequip(hero, k), 'equip'); }}><ItemIcon item={it} size={34} />{it.dur <= 20 && <i className="broken">!</i>}</div></Tip> : <span>{blocked ? '2H' : name}</span>}
              </div>
            );
          })}
        </div>
        <div className="inv-tools"><input placeholder="Search name, rarity, slot…" value={filter} onChange={(e) => setFilter(e.target.value)} /><Btn onClick={() => game.act(() => { sortItems(hero.inv); })}>Sort</Btn><span className="coin">◉ {hero.gold} · ◆ {hero.dust}</span></div>
        <Grid items={hero.inv} hero={hero} sel={sel ?? undefined} filter={filter} onClick={(it) => { setSel(it.id === sel ? null : it.id); setConfirm(''); }} onContext={quick} />
        <div className="actions">
          {!item && <span className="note">Click to select · right-click to {vendor ? 'sell' : stash ? 'stash' : 'equip'} · equipped gear: right-click to remove</span>}
          {item && <b className={`r${item.rarity}`}>{itemName(item)}</b>}
          {item && !equippedSlot && item.kind === 'gear' && <Btn onClick={() => game.act(() => equipItem(hero, item.id), 'equip')}>Equip</Btn>}
          {item && equippedSlot && <Btn onClick={() => game.act(() => unequip(hero, equippedSlot), 'equip')}>Unequip</Btn>}
          {item && <Btn onClick={() => game.act(() => { item.fav = !item.fav; })}>{item.fav ? '★ Unfavorite' : '☆ Favorite'}</Btn>}
          {item && !equippedSlot && <Btn onClick={() => drop(item)}>Drop</Btn>}
          {item && !equippedSlot && vendor && <Btn cls={confirm === 'sell' + item.id ? 'danger' : ''} onClick={() => guarded('sell' + item.id, (c) => sellItem(hero, item.id, c))}>{confirm === 'sell' + item.id ? 'Confirm: sell Relic' : `Sell ${sellValue(item)}g`}</Btn>}
          {item && !equippedSlot && stash && <Btn onClick={() => game.act(() => moveToStash(hero, item.id))}>Stash</Btn>}
          {item?.kind === 'glyph' && <>
            {EQUIP_SLOTS.filter((k) => hero.equip[k] && hero.equip[k]!.sockets > hero.equip[k]!.glyphs.length).map((k) => <Btn key={k} onClick={() => game.act(() => { const r = socketGlyph(hero, item.id, k); if (!r) setSel(null); return r; }, 'equip')}>Socket → {SLOT_POS[k][2]}</Btn>)}
            <Btn disabled={hero.inv.filter((i) => i.base === item.base).length < 3} onClick={() => game.act(() => combineGlyphs(hero, item.base))}>Combine ×3</Btn>
          </>}
        </div>
      </Panel>
    </>
  );
}
function VendorSide({ hero }: { hero: Hero }) {
  const stock = vendorStock(hero);
  return (
    <Panel title="Quartermaster Bren" side="left">
      <p className="note">“Coin for draughts, coin for steel. Right-click your goods to sell them.”</p>
      <div className="potrow">{POTIONS.map((p, i) => <Btn key={i} cls="potbuy" disabled={hero.belt[i] >= hero.beltCap || hero.gold < potionPrice(hero, i)} onClick={() => game.act(() => buyPotion(hero, i), 'potion')} title={p.desc}><i style={{ background: p.color }} />{p.name}<small>{potionPrice(hero, i)}g · {hero.belt[i]}/{hero.beltCap}</small></Btn>)}</div>
      <h3>Wares</h3>
      <div className="stock">{stock.length ? stock.map((it) => (
        <Tip key={it.id} className={`stock-row r${it.rarity}`} content={() => <ItemTip item={it} hero={hero} price={`Costs ${buyPrice(it)} gold`} />}>
          <div className="stock-in" onClick={() => game.act(() => buyItem(hero, it.id), 'gold')}><ItemIcon item={it} size={26} /><span>{itemName(it)}</span><b className={hero.gold < buyPrice(it) ? 'poor' : ''}>{buyPrice(it)}g</b></div>
        </Tip>)) : <p className="note">Sold out. New wares arrive as you grow stronger.</p>}</div>
      <Btn disabled={repairCost(hero) <= 0} onClick={() => game.act(() => repairAll(hero), 'equip')}>Repair all ({repairCost(hero)}g)</Btn>
    </Panel>
  );
}
function ArtificerSide({ hero, item, confirm, guarded }: { hero: Hero; item: Item | null; confirm: string; guarded: (k: string, fn: (c: boolean) => string | null) => boolean }) {
  const s = game.session!;
  const inInv = item && hero.inv.includes(item);
  return (
    <Panel title="Artificer Ilse" side="left">
      <p className="note">“Select a piece — in your pack or on your body — and I will see what can be done.”</p>
      {!item && <p className="note">No item selected.</p>}
      {item && <div className="craft">
        <div className={`craft-name r${item.rarity}`}><ItemIcon item={item} size={26} /> {itemName(item)}</div>
        {!item.identified && <Btn onClick={() => game.act(() => identify(hero, item.id), 'waypoint')}>Identify ({identifyCost(item)}g)</Btn>}
        {item.identified && item.kind === 'gear' && item.affixes.length > 0 && <>
          <h3>Reroll one affix <small>{rerollCost(item).gold}g + {rerollCost(item).dust} dust (rises each time)</small></h3>
          {item.affixes.map((a, i) => <div key={i} className="craft-row"><span>{statText(AFFIX[a.id].stat, a.value)}</span><Btn onClick={() => game.act(() => rerollAffix(hero, item.id, i, s.lootRng), 'waypoint')}>Reroll</Btn></div>)}
        </>}
        {item.kind === 'gear' && canSocket(item) && item.sockets === 0 && <Btn onClick={() => game.act(() => addSocket(hero, item.id), 'equip')}>Add socket ({SOCKET_COST.gold}g + {SOCKET_COST.dust} dust)</Btn>}
        {inInv && <Btn cls={confirm === 'salv' + item.id ? 'danger' : ''} onClick={() => guarded('salv' + item.id, (c) => salvage(hero, item.id, c))}>{confirm === 'salv' + item.id ? 'Confirm: destroy Relic' : `Salvage → ${salvageYield(item)} dust`}</Btn>}
        {item.fav && <p className="note">★ Favorited items are protected from salvage and sale.</p>}
      </div>}
      <h3>Workshop</h3>
      <Btn disabled={repairCost(hero) <= 0} onClick={() => game.act(() => repairAll(hero), 'equip')}>Repair all ({repairCost(hero)}g)</Btn>
      <Btn onClick={() => game.act(() => { let n = 0; for (const it of [...hero.inv]) if (it.kind === 'gear' && it.rarity === 0 && !it.fav) { salvage(hero, it.id); n++; } return n ? null : 'No Worn items to salvage.'; })}>Salvage all Worn items</Btn>
    </Panel>
  );
}
export function SkillsPanel() {
  useUi((s) => s.heroVersion);
  const keys = useUi((s) => s.settings.keys);
  const [pick, setPick] = useState<string | null>(null);
  const hero = game.session!.hero;
  const list = classSkills(hero.cls);
  const node = (d: SkillDef) => {
    const rank = hero.ranks[d.id] ?? 0, err = canRank(hero, d.id);
    return (
      <Tip key={d.id} className={`node ${d.kind} ${d.dtype}${rank ? ' on' : ''}${pick === d.id ? ' sel' : ''}${hero.level < d.unlock ? ' locked' : ''}`} content={() => <SkillTip def={d} hero={hero} />}>
        <div className="node-in" onClick={() => d.kind === 'active' && rank > 0 && setPick(pick === d.id ? null : d.id)}>
          <span className="glyph">{d.icon}</span><div className="node-name">{d.name}<small>{rank}/{d.maxRank}{hero.level < d.unlock ? ` · Lv ${d.unlock}` : ''}</small></div>
          {d.kind !== 'basic' && <button className="plus" disabled={!!err} title={err ?? 'Spend a skill point'} onClick={(e) => { e.stopPropagation(); game.act(() => rankUp(hero, d.id), 'quest'); }}>+</button>}
        </div>
      </Tip>
    );
  };
  const slotKeys = ['RMB', keyName(keys.skill1), keyName(keys.skill2), keyName(keys.skill3), keyName(keys.skill4)];
  return (
    <Panel title={`${CLASSES[hero.cls].name} — Skills`} side="left" wide>
      <div className="points"><b>{hero.skillPoints}</b> skill point{hero.skillPoints === 1 ? '' : 's'} available · Level {hero.level}/{LEVEL_CAP}</div>
      <div className="hotbar-edit">{hero.hotbar.map((id, i) => (
        <div key={i} className={`hb ${pick ? 'target' : ''}`} onClick={() => { if (pick) { game.act(() => { assignHotbar(hero, i, pick); }); setPick(null); } else if (id) game.act(() => { assignHotbar(hero, i, null); }); }} title={pick ? 'Assign here' : id ? 'Click to clear' : 'Select a learned skill, then click a slot'}>
          <span className="glyph">{id ? SKILL[id].icon : ''}</span><kbd>{slotKeys[i]}</kbd>
        </div>))}<span className="note">{pick ? `Click a slot for ${SKILL[pick].name}` : 'Click a learned active skill, then a slot, to assign it. Six actives, five slots — choose.'}</span></div>
      <h3>Basic & Actives</h3><div className="nodes">{list.filter((d) => d.kind === 'basic' || d.kind === 'active').map(node)}</div>
      <h3>Passives</h3><div className="nodes">{list.filter((d) => d.kind === 'passive').map(node)}</div>
      <h3>Capstones <small>(level 15 · choose one)</small></h3><div className="nodes">{list.filter((d) => d.kind === 'capstone').map(node)}</div>
      <div className="respec">
        <Btn onClick={() => game.act(() => respec(hero), 'waypoint')}>Respec all points ({respecCost(hero) ? respecCost(hero) + 'g' : 'free until level 9'})</Btn>
        {[0, 1].map((i) => <span key={i} className="loadout"><Btn onClick={() => game.act(() => { saveLoadout(hero, i, `Loadout ${i + 1}`); })} title="Save current skill allocation and hotbar">Save {i + 1}</Btn><Btn disabled={!hero.loadouts[i]} onClick={() => game.act(() => applyLoadout(hero, i), 'waypoint')} title="Apply saved allocation (same cost as a respec)">Apply {i + 1}</Btn></span>)}
      </div>
    </Panel>
  );
}
export function CharacterPanel() {
  useUi((s) => s.heroVersion);
  const s = game.session!, hero = s.hero, st = s.stats;
  const row = (name: string, val: string, tip: string) => <div className="stat" title={tip}><span>{name}</span><b>{val}</b></div>;
  const pct = (k: string) => `${Math.round(st[k] ?? 0)}%`;
  return (
    <Panel title={`${hero.name} — ${CLASSES[hero.cls].name}`} side="left">
      <div className="points">Level {hero.level} · {hero.level < LEVEL_CAP ? `${hero.xp} / ${xpToNext(hero.level)} XP` : 'Level cap'} · {hero.difficulty ? 'Veteran' : 'Normal'}</div>
      <h3>Attributes {hero.attrPoints > 0 && <small className="hl">{hero.attrPoints} point{hero.attrPoints > 1 ? 's' : ''} to spend</small>}</h3>
      {(['might', 'finesse', 'will', 'vigor'] as const).map((a) => (
        <div key={a} className="attr"><b>{a[0].toUpperCase() + a.slice(1)}</b><span className="val">{st[a]}</span><span className="note">{ATTR_INFO[a]}</span>
          <button className="plus" disabled={hero.attrPoints <= 0} onClick={() => game.act(() => { allocAttr(hero, a); }, 'quest')}>+</button></div>))}
      <h3>Offense</h3>
      {row('Weapon damage', `${Math.round(st.dmgMin)}–${Math.round(st.dmgMax)}`, 'Base weapon damage plus flat added damage. Skills multiply this by their coefficient.')}
      {row('Attacks per second', st.aps.toFixed(2), 'Weapon speed × (1 + attack speed% + 0.4% per Finesse)')}
      {row('Critical chance', pct('crit'), '5% base + gear + 0.2% per Finesse. Cap 75%.')}
      {row('Critical damage', `${Math.round(st.critMult * 100)}%`, '150% base + gear')}
      {row(hero.cls === 'cinder' ? 'Melee damage' : 'Ranged damage', '+' + pct(hero.cls === 'cinder' ? 'meleePct' : 'rangedPct'), '1.2% per primary attribute point plus gear')}
      {row('Skill damage', '+' + pct('skillPct'), '0.6% per Will plus gear. Applies to non-basic skills.')}
      <h3>Defense</h3>
      {row('Health', String(st.hpMax), '(90 + 14 × level + 8 × Vigor + flat) × (1 + Health%)')}
      {row('Focus', String(st.focusMax), '80 + 2 × Will + gear')}
      {row('Armor', `${st.armorTotal}`, `Reduces physical hits with diminishing returns: armor / (armor + 6 × hit + 20), capped at 75%. A 30-damage hit is reduced by ${Math.round((st.armorTotal / (st.armorTotal + 200)) * 100)}%.`)}
      {row('Block chance', pct('blockT'), 'Shield only. Blocked hits deal 30% damage and build Heat. Cap 60%.')}
      {row('Ember / Frost / Blight resist', `${Math.round(st.resEmberT)} / ${Math.round(st.resFrostT)} / ${Math.round(st.resBlightT)}%`, 'Each capped at 75%. Will adds 0.5% to all.')}
      {row('Movement speed', `${st.move.toFixed(2)} m/s`, '4.6 m/s base')}
      {row('Evade recharge', `${(2.8 / (1 + (st.evadeCdr ?? 0) / 100)).toFixed(1)} s`, '2.8 s per charge, three charges')}
      <h3>Utility</h3>
      {row('Focus regeneration', `${st.regen.toFixed(1)}/s`, '1.5 base + gear')}
      {row('Potion effect', '+' + pct('potionPct'), 'Increases healing and durations from belt consumables')}
      {row('Gold / item rarity find', `+${pct('goldFind')} / +${pct('magicFind')}`, 'From gear')}
      {row('Relic pity', `${hero.relicPity.toFixed(1)} / 6`, 'Bad-luck protection: boss and elite kills without a Relic raise this. At 6 the next boss or elite guarantees one.')}
    </Panel>
  );
}
export function QuestPanel() {
  useUi((s) => s.heroVersion);
  const s = game.session!, hero = s.hero;
  const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  return (
    <Panel title="Quest Log" side="left">
      <h3>Act I — The Buried Star {hero.difficulty ? '(Veteran)' : ''}</h3>
      {QUEST.map((q, i) => <div key={i} className={`quest ${i < hero.quest ? 'done' : i === hero.quest ? 'cur' : 'todo'}`}><b>{i < hero.quest ? '✔' : i === hero.quest ? '➤' : '·'} {q.title}</b><span>{i <= hero.quest ? q.text : '???'}</span></div>)}
      {hero.quest >= QUEST_DONE && <div className="quest cur"><b>➤ Act complete</b><span>Speak with Elder Maren for a new expedition, or step through the Hunt portal in the Refuge.</span></div>}
      <h3>Optional</h3>
      <div className={`quest ${hero.flags.hunter_belt ? 'done' : 'todo'}`}><b>{hero.flags.hunter_belt ? '✔' : '·'} The Hunter's Camp</b><span>Clear the beasts around Hunter Orrin's camp in the Soot March for a permanent belt upgrade.</span></div>
      <h3>Expedition</h3>
      <div className="stat"><span>Run time</span><b>{fmt(hero.stats.runTime)}</b></div>
      <div className="stat"><span>Enemies slain (elites)</span><b>{hero.stats.kills} ({hero.stats.elites})</b></div>
      <div className="stat"><span>Deaths</span><b>{hero.stats.deaths}</b></div>
      {hero.stats.lastDeath && <div className="stat"><span>Last cause of death</span><b>{hero.stats.lastDeath}</b></div>}
      {Object.entries(hero.stats.bestHunt).map(([k, v]) => <div key={k} className="stat"><span>Best hunt · {k.startsWith('toll') ? 'Toll-Keeper' : 'Orison Engine'} ({k.endsWith('1') ? 'Veteran' : 'Normal'})</span><b>{fmt(v)}</b></div>)}
      {hero.echo && <p className="note">Your Echo waits in {ZONE_INFO[hero.echo.zone].name} holding {hero.echo.gold} gold.</p>}
    </Panel>
  );
}
export function MapPanel() {
  const zone = useUi((s) => s.hud?.zone);
  return <Panel title={`Map — ${zone ?? ''}`} side="center"><MapCanvas size={[760, 560]} scale={3.2} cls="bigmap" /><p className="note">◆ waypoint · ■ exits · ● people and caches · the gold ring marks your objective once discovered. Unexplored ground is never shown.</p></Panel>;
}
const TALK: Record<string, [string, (h: Hero) => string]> = {
  elder: ['Elder Maren', (h) => h.quest >= QUEST_DONE ? 'The Engine is silent, yet the star still burns beneath us. The frontier will test you again — harder, if you wish it.' : h.quest <= 1 ? 'Warden. The ash thickens each night and our Artificer is gone — taken on the tollhouse road. Wake the Ashway shrine in the Soot March so you may return quickly, then find her.' : h.quest < 6 ? 'The Toll-Keeper bars the old road. Break its armor, mind its lanterns, and bring Ilse home.' : 'Ilse says the Hollow Archive feeds the thing below. Three floors down. End it.'],
  healer: ['Sister Ysolde', () => 'Be still. There — your wounds are closed. Carry draughts; out there, flesh does not mend itself quickly.'],
  hunter: ['Hunter Orrin', (h) => h.flags.hunter_done ? 'Clean work. Take this harness — it carries one more draught of each kind. Yours to keep.' : 'Hounds and crawlers circle my camp every dusk. Thin the pack around here and I will make it worth your while.'],
};
export function Dialogs() {
  const dialog = useUi((s) => s.dialog);
  useUi((s) => s.heroVersion);
  const s = game.session;
  if (!dialog || !s) return null;
  const hero = s.hero, close = () => ui.set({ dialog: null });
  if (dialog === 'waypoint') return (
    <div className="modal" onPointerDown={(e) => e.stopPropagation()}><h2>Waypoints</h2>
      {hero.waypoints.map((w) => <Btn key={w} cls="big" disabled={w === s.zone.id} onClick={() => { close(); s.travelWaypoint(w); }}>{ZONE_INFO[w].name}{w === s.zone.id ? ' (here)' : ''}</Btn>)}
      <p className="note">Wake waypoint shrines to add them. Press {keyName(ui.get().settings.keys.gate)} anywhere outside the Refuge to channel a town gate.</p><Btn onClick={close}>Close</Btn></div>
  );
  if (dialog === 'hunt') return (
    <div className="modal" onPointerDown={(e) => e.stopPropagation()}><h2>Target Hunt</h2><p className="note">A short seeded route straight to a defeated boss. Normal loot and resource rules apply; your completion time is recorded.</p>
      <Btn cls="big" onClick={() => { close(); s.startHunt('toll'); }}>Hunt the Toll-Keeper</Btn><Btn cls="big" onClick={() => { close(); s.startHunt('engine'); }}>Hunt the Orison Engine</Btn><Btn onClick={close}>Close</Btn></div>
  );
  if (dialog === 'artificer' || dialog === 'vendor' || dialog === 'stash') return null;
  const t = TALK[dialog];
  if (!t) return null;
  return (
    <div className="modal talk" onPointerDown={(e) => e.stopPropagation()}><h2>{t[0]}</h2><p>“{t[1](hero)}”</p>
      {dialog === 'elder' && hero.quest >= QUEST_DONE && <>
        {hero.maxDifficulty >= 1 && <Btn cls="big" onClick={() => { close(); s.newExpedition(1); }}>Begin a Veteran expedition (recommended level 15)</Btn>}
        <Btn cls="big" onClick={() => { close(); s.newExpedition(0); }}>Begin a new Normal expedition (new seed)</Btn></>}
      <Btn onClick={close}>Farewell</Btn></div>
  );
}
