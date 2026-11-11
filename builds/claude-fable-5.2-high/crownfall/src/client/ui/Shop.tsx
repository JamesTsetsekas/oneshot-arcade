// client-ui: the item shop — search, category filters, recipe tree, owned components, buy / undo /
// sell, and explainable build recommendations. Purchases are requests; the server decides.

import { ReactElement, useMemo, useState } from 'react';
import { HEROES, HeroId } from '../../shared/heroes';
import { ITEMS, ITEM_LIST, ItemCat, ItemDef, ItemStats, SELL_RATIO, STAT_LABEL, buyPlan } from '../../shared/items';
import type { HeroPublic } from '../../shared/protocol';
import { audio } from '../audio/audio';
import type { GameClient } from '../game';
import { hud, useHud } from '../runtime/store';
import { ItemIcon } from './icons';

const CATS: (ItemCat | 'all')[] = ['all', 'attack', 'ability', 'defense', 'movement', 'support'];
const TIERS: { tier: ItemDef['tier']; label: string }[] = [
  { tier: 'starter', label: 'Starters' },
  { tier: 'consumable', label: 'Consumables' },
  { tier: 'component', label: 'Components' },
  { tier: 'boots', label: 'Boots' },
  { tier: 'completed', label: 'Completed' },
];

export function statLines(stats: ItemStats): string[] {
  return (Object.keys(stats) as (keyof ItemStats)[]).map((k) => `+${stats[k]} ${STAT_LABEL[k]}`.replace(/\+(\d+(?:\.\d+)?) %/, '+$1%'));
}

/** Enemy damage profile -> an explainable defensive suggestion (never auto-purchased). */
export function adaptiveAdvice(hero: HeroId, heroes: HeroPublic[], viewer: number): { item: string; why: string } | null {
  let phys = 0;
  let arc = 0;
  for (const e of heroes) {
    if (e.team === viewer) continue;
    if (['brannoch', 'suri', 'kesh', 'vey'].includes(e.hero)) phys += 1 + e.k * 0.3;
    else arc += 1 + e.k * 0.3;
  }
  const b = HEROES[hero].builds;
  if (phys >= arc * 1.8) return { item: b.vsPhysical, why: 'The enemy team deals mostly physical damage — armor is worth more than usual.' };
  if (arc >= phys * 1.8) return { item: b.vsArcane, why: 'The enemy team deals mostly arcane damage — ward and cleanse are worth more than usual.' };
  return null;
}

export function ItemCard({ def }: { def: ItemDef }): ReactElement {
  return (
    <div className="itemcard">
      <div className="ic-head">
        <ItemIcon id={def.id} size={44} />
        <div>
          <b>{def.name}</b>
          <span>
            {def.tier} · {def.cat} · {def.cost}g
          </span>
        </div>
      </div>
      <ul>
        {statLines(def.stats).map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
      {def.passive && <p className="ic-passive">{def.passive}</p>}
      {def.active && (
        <p className="ic-active">
          <b>Active:</b> {def.active.desc} {def.active.cd > 1 ? `(${def.active.cd}s cooldown)` : ''}
        </p>
      )}
    </div>
  );
}

export function Shop({ client }: { client: GameClient }): ReactElement | null {
  const you = useHud((s) => s.you);
  const heroId = useHud((s) => s.heroId);
  const heroes = useHud((s) => s.heroes);
  const viewer = useHud((s) => s.viewer);
  const [cat, setCat] = useState<ItemCat | 'all'>('all');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<string>(HEROES[heroId].builds.starter);
  const [path, setPath] = useState(0);
  const owned = useMemo(() => new Set((you?.inv ?? []).filter(Boolean).map((s) => s!.id)), [you?.inv]);
  if (!you) return null;
  const def = ITEMS[sel];
  const plan = buyPlan(you.inv, sel);
  const canBuy = you.inFountain && you.gold >= plan.cost;
  const builds = HEROES[heroId].builds;
  const advice = adaptiveAdvice(heroId, heroes, viewer);
  const filtered = ITEM_LIST.filter((i) => (cat === 'all' || i.cat === cat) && (!q || i.name.toLowerCase().includes(q.toLowerCase())));
  const buildsInto = ITEM_LIST.filter((i) => i.from?.includes(sel));
  const buy = (id: string): void => {
    client.send({ t: 'buy', item: id });
    audio.play('ui');
  };
  const itemBtn = (i: ItemDef, size = 40): ReactElement => {
    const cost = buyPlan(you.inv, i.id).cost;
    return (
      <button
        key={i.id}
        className={`shopitem ${sel === i.id ? 'sel' : ''} ${owned.has(i.id) ? 'owned' : ''} ${you.gold >= cost ? 'afford' : ''}`}
        onClick={() => setSel(i.id)}
        onDoubleClick={() => buy(i.id)}
        onContextMenu={(e) => {
          e.preventDefault();
          buy(i.id);
        }}
        title={`${i.name} — ${cost}g (double-click or right-click to buy)`}
      >
        <ItemIcon id={i.id} size={size} />
        <span>{cost}</span>
      </button>
    );
  };
  return (
    <div className="shop panel" onContextMenu={(e) => e.preventDefault()}>
      <div className="shop-head">
        <h2>Guild Quartermaster</h2>
        <div className="shop-gold">{you.gold} gold</div>
        {!you.inFountain && <div className="shop-warn">Browsing only — return to the fountain (B) to buy</div>}
        <button className="close" onClick={() => hud.set({ shopOpen: false })}>
          ×
        </button>
      </div>
      <div className="shop-body">
        <div className="shop-left">
          <div className="rec">
            <div className="rec-h">
              <b>Recommended for {HEROES[heroId].name}</b>
              <div className="tabs">
                {builds.paths.map((p, i) => (
                  <button key={p.name} className={path === i ? 'on' : ''} onClick={() => setPath(i)}>
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
            <p className="rec-why">{builds.paths[path].why}</p>
            <div className="rec-row">
              {[builds.starter, ...builds.paths[path].items].map((id, i) => (
                <div key={id + i} className="rec-step">
                  {itemBtn(ITEMS[id], 36)}
                </div>
              ))}
            </div>
            {advice && (
              <p className="rec-adapt">
                <b>Situational:</b> {advice.why} Consider <a onClick={() => setSel(advice.item)}>{ITEMS[advice.item].name}</a>.
              </p>
            )}
          </div>
          <div className="filters">
            <input placeholder="Search items…" value={q} onChange={(e) => setQ(e.target.value)} />
            {CATS.map((c) => (
              <button key={c} className={cat === c ? 'on' : ''} onClick={() => setCat(c)}>
                {c}
              </button>
            ))}
          </div>
          <div className="grid">
            {TIERS.map(({ tier, label }) => {
              const list = filtered.filter((i) => i.tier === tier);
              if (!list.length) return null;
              return (
                <div key={tier} className="tier">
                  <h4>{label}</h4>
                  <div className="tier-items">{list.map((i) => itemBtn(i))}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="shop-right">
          <ItemCard def={def} />
          {def.from && (
            <div className="tree">
              <h4>Recipe</h4>
              <div className="tree-row">
                {def.from.map((c, i) => (
                  <div key={c + i} className={`tree-node ${owned.has(c) ? 'have' : ''}`}>
                    {itemBtn(ITEMS[c], 34)}
                    <em>{owned.has(c) ? 'owned' : ITEMS[c].name}</em>
                  </div>
                ))}
                <div className="tree-plus">+ {def.cost - def.from.reduce((a, c) => a + ITEMS[c].cost, 0)}g</div>
              </div>
            </div>
          )}
          {buildsInto.length > 0 && (
            <div className="tree">
              <h4>Builds into</h4>
              <div className="tree-row">{buildsInto.map((i) => itemBtn(i, 34))}</div>
            </div>
          )}
          <div className="buyrow">
            <button className="primary" disabled={!canBuy} onClick={() => buy(sel)}>
              Buy for {plan.cost}g
            </button>
            <button disabled={!you.canUndo} onClick={() => client.send({ t: 'undo' })} title="Undo is available until you leave the fountain, use the item, or deal/take damage">
              Undo
            </button>
          </div>
          <div className="inv">
            <h4>Inventory — click to sell ({Math.round(SELL_RATIO * 100)}% refund)</h4>
            <div className="inv-row">
              {you.inv.map((s, i) => (
                <button key={i} className="invslot" disabled={!s || !you.inFountain} onClick={() => s && client.send({ t: 'sell', slot: i })} title={s ? `Sell ${ITEMS[s.id].name} for ${Math.round(ITEMS[s.id].cost * s.n * SELL_RATIO)}g` : 'Empty'}>
                  {s ? <ItemIcon id={s.id} size={34} /> : <div className="empty" />}
                  {s && s.n > 1 && <em className="count">{s.n}</em>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
