// Combat HUD. Reads the batched store (<=10 Hz); never re-renders per frame.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { MatchController } from '../runtime/controller';
import { TUTORIAL_STEPS } from '../runtime/controller';
import { useHud } from '../runtime/store';
import { HEROES } from '../../shared/heroes';
import { ITEMS, ITEM_LIST, TALENTS, purchasePlan, SELL_RATIO } from '../../shared/items';
import { abilityTooltip } from '../../shared/types';
import type { HeroId, ItemDef, ItemTag } from '../../shared/types';
import { ItemIcon, AbilityIcon, Portrait, TalentIcon } from './icons';
import type { PingKind, Snapshot } from '../../protocol/messages';
import { PING_STYLE } from '../render/overlay';
import { rankAllowed } from '../../shared/rules';
import type { Settings } from '../../services/profile';
import { heroStatsAt } from '../../shared/heroes';

export const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const SLOTS = ['Q', 'W', 'E', 'R'] as const;

function keyLabel(code: string) {
  return code.replace('Key', '').replace('Digit', '').replace('Arrow', '').replace('Space', 'Spc');
}

export function Hud({ c, settings, onLeave, onSettings }: { c: MatchController; settings: Settings; onLeave: () => void; onSettings: () => void }) {
  const st = useHud(c.store);
  const snap = st.snap;
  const now = performance.now() / 1000;
  if (!snap) return <div className="hud-loading">Connecting to the authoritative room…</div>;
  const me = snap.me;
  const myTeam = c.renderer.myTeam;
  const dead = snap.time < me.respawnAt && me.respawnAt > 0 && !snap.ents.find((e) => e.id === me.heroId && !(e.st & 128));
  return (
    <div className="hud" style={{ ['--ui' as any]: settings.uiScale / 100 }}>
      <TopBar snap={snap} myTeam={myTeam} />
      <Feed st={st} />
      {st.banner && st.banner.until > now && <div className={`banner ${st.banner.tone}`}>{st.banner.text}</div>}
      {st.caption && st.caption.until > now && settings.captions && <div className="caption">{st.caption.text}</div>}
      {st.reject && st.reject.until > now && <div className="reject">{st.reject.text}</div>}
      {st.targeting && <div className="targeting-hint">{st.targeting.name}: {st.targeting.slot.length === 1 && 'QWER'.includes(st.targeting.slot) ? 'release / left-click to cast · right-click or Esc to cancel' : 'left-click to place · Esc to cancel'}</div>}
      <BottomLeft snap={snap} />
      <AbilityBar c={c} snap={snap} settings={settings} />
      <MinimapBox c={c} />
      {dead && <DeathRecap snap={snap} recap={st.recap} />}
      {me.recallUntil > snap.time && <RecallBar snap={snap} />}
      {st.shopOpen && <Shop c={c} snap={snap} />}
      {st.scoreOpen && <Scoreboard c={c} snap={snap} muted={st.muted} />}
      {st.statsOpen && <StatsPanel snap={snap} />}
      {st.mapOpen && <BigMap c={c} />}
      {st.pingWheel && <PingWheel c={c} x={st.pingWheel.x} y={st.pingWheel.y} />}
      <Chat c={c} st={st} enabled={settings.chat} />
      {c.setup.mode === 'practice' && <PracticePanel c={c} snap={snap} />}
      {c.setup.mode === 'tutorial' && settings.hints && <TutorialPanel step={st.tutorialStep} />}
      {c.setup.mode !== 'tutorial' && settings.botSuggestions && <Suggestions snap={snap} />}
      {snap.paused && <div className="paused">Paused</div>}
      <div className="perf">{st.fps} fps · {c.renderer.drawCalls} draws · {(c.renderer.triangles / 1000).toFixed(0)}k tris</div>
      {st.menuOpen && (
        <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && c.store.set({ menuOpen: false })}>
          <div className="menu-panel">
            <h2>Match menu</h2>
            <button className="btn" onClick={() => c.store.set({ menuOpen: false })}>Resume</button>
            <button className="btn" onClick={onSettings}>Settings</button>
            <button className="btn danger" onClick={onLeave}>Leave match</button>
            <p className="muted small">Leaving forfeits this offline match. Surrender votes are not available in this build.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function TopBar({ snap, myTeam }: { snap: Snapshot; myTeam: 0 | 1 }) {
  const towers = (t: 0 | 1) => snap.structures.filter((s) => s.team === t && s.alive && s.tier !== 'engine' && s.tier !== 'seal').length;
  const objs = snap.objectives.filter((o) => o.kind === 'colossus' || o.kind.startsWith('catalyst'));
  return (
    <div className="topbar">
      <div className={`team-score t0 ${myTeam === 0 ? 'mine' : ''}`}><span className="tname">Dawn</span><b>{snap.kills[0]}</b><span className="tw" title="Towers standing">▣ {towers(0)}</span></div>
      <div className="clock">{fmtTime(snap.time)}{snap.timeScale !== 1 && <small> ×{snap.timeScale}</small>}</div>
      <div className={`team-score t1 ${myTeam === 1 ? 'mine' : ''}`}><span className="tw" title="Towers standing">▣ {towers(1)}</span><b>{snap.kills[1]}</b><span className="tname">Dusk</span></div>
      <div className="objectives">
        {objs.map((o) => (
          <div key={o.key} className={`obj ${o.alive ? 'alive' : ''}`} title={o.kind}>
            <span className="obj-ico" style={{ color: o.kind === 'colossus' ? '#ff6ad5' : o.kind === 'catalystGale' ? '#9ff0ff' : '#ffa24a' }}>{o.kind === 'colossus' ? '✦' : '◆'}</span>
            <span>{o.kind === 'colossus' ? 'Colossus' : o.kind === 'catalystGale' ? 'Gale' : 'Forge'}</span>
            {o.alive ? <span className="obj-hp"><i style={{ width: `${(100 * o.hp) / Math.max(1, o.mhp)}%` }} /></span> : <span className="obj-t">{o.respawnAt > 0 ? fmtTime(Math.max(0, o.respawnAt - snap.time)) : '—'}</span>}
          </div>
        ))}
        {snap.teamBuffs.map((b, i) => <div key={i} className={`obj buff ${b.team === myTeam ? 'good' : 'bad'}`}>{b.kind} {fmtTime(Math.max(0, b.until - snap.time))}</div>)}
      </div>
    </div>
  );
}

function Feed({ st }: { st: ReturnType<typeof useHud> }) {
  const now = performance.now() / 1000;
  return <div className="feed">{st.feed.filter((f) => now - f.t < 12).map((f) => <div key={f.id} className={`feed-item ${f.tone}`}>{f.icon && <b>{f.icon} </b>}{f.text}</div>)}</div>;
}

function Bar({ v, m, cls, label }: { v: number; m: number; cls: string; label?: string }) {
  return <div className={`bar ${cls}`}><i style={{ width: `${Math.max(0, Math.min(100, (100 * v) / Math.max(1, m)))}%` }} /><span>{label ?? `${Math.round(v)} / ${Math.round(m)}`}</span></div>;
}

function BottomLeft({ snap }: { snap: Snapshot }) {
  const me = snap.me;
  const ent = snap.ents.find((e) => e.id === me.heroId);
  const s = me.stats;
  const h = HEROES[me.hero];
  return (
    <div className="bl">
      <div className="portrait-wrap">
        <Portrait hero={me.hero} size={84} dim={!ent || (ent.st & 128) !== 0} />
        <div className="lvl">{me.level}</div>
        <div className="xp"><i style={{ height: `${me.xpNext ? (100 * me.xpCur) / me.xpNext : 100}%` }} /></div>
      </div>
      <div className="bl-main">
        <div className="hero-name">{h.name} <small>{h.title}</small></div>
        {ent && <Bar v={ent.hp} m={ent.mhp} cls="hp" label={`${Math.round(ent.hp)} / ${ent.mhp}${ent.sh ? ` (+${ent.sh})` : ''}`} />}
        {ent && <Bar v={ent.mana ?? 0} m={ent.mmana ?? 1} cls={h.resource === 'energy' ? 'energy' : 'mana'} />}
        <div className="stats">
          <span title="Attack damage">⚔ {Math.round(s.ad)}</span><span title="Ability power">✧ {Math.round(s.ap)}</span><span title="Attack speed">⟳ {s.as.toFixed(2)}</span>
          <span title="Armor">⛨ {Math.round(s.armor)}</span><span title="Ward (arcane resist)">◈ {Math.round(s.ward)}</span><span title="Move speed (m/s)">➶ {s.ms.toFixed(2)}</span>
        </div>
        <div className="passive" title={h.abilities[0].desc}><AbilityIcon hero={me.hero} slot={0} size={22} /> {h.abilities[0].name}{me.passive.max > 0 && <b> {me.passive.label} {me.passive.value}{me.passive.max > 1 ? `/${me.passive.max}` : ''}</b>}</div>
        <div className="buffs">{me.buffs.map((b) => <span key={b.key} className="buff" title={b.label}>{b.label.split(':')[0]} {fmtTime(Math.max(0, b.until - snap.time))}</span>)}</div>
      </div>
    </div>
  );
}

function CdOverlay({ cd, max }: { cd: number; max: number }) {
  if (cd <= 0) return null;
  const pct = Math.max(0, Math.min(1, cd / Math.max(0.01, max)));
  return <div className="cd" style={{ background: `conic-gradient(rgba(5,8,16,0.78) ${pct * 360}deg, transparent 0deg)` }}><span>{cd >= 1 ? Math.ceil(cd) : cd.toFixed(1)}</span></div>;
}

function AbilityBar({ c, snap, settings }: { c: MatchController; snap: Snapshot; settings: Settings }) {
  const me = snap.me;
  const h = HEROES[me.hero];
  const [tip, setTip] = useState<React.ReactNode>(null);
  const keys = settings.keys;
  const aKeys = [keys.abilityQ, keys.abilityW, keys.abilityE, keys.abilityR];
  const base = heroStatsAt(h, me.level);
  const scaleCtx = { ad: me.stats.ad, ap: me.stats.ap, bonusAd: Math.max(0, me.stats.ad - base.ad), maxHp: me.stats.maxHp, level: me.level };
  return (
    <div className="abar">
      {tip && <div className="tooltip">{tip}</div>}
      <div className="abilities">
        {me.abilities.map((a, i) => {
          const def = h.abilities[i + 1];
          const canRank = me.skillPoints > 0 && rankAllowed(SLOTS[i], a.rank, me.level);
          const maxR = i === 3 ? 2 : 4;
          return (
            <div key={i} className={`ab ${a.rank === 0 ? 'unlearned' : ''} ${a.ready ? 'ready' : ''} ${a.recast ? 'recast' : ''}`}
              onMouseEnter={() => setTip(<><b>{def.name}</b> <span className="muted">[{SLOTS[i]}] · {def.targeting} · range {def.range} m</span><div>{abilityTooltip(def, Math.max(1, a.rank), a.rank ? scaleCtx : undefined)}</div><div className="muted">Cost {def.cost.join('/')} · Cooldown {def.cooldown.join('/')} s{def.castTime ? ` · Cast ${def.castTime} s` : ''}</div>{def.counter && <div className="counter">Counterplay: {def.counter}</div>}<div className="muted small">Full formula: {abilityTooltip(def, Math.max(1, a.rank))}</div></>)}
              onMouseLeave={() => setTip(null)}>
              {canRank && <button className="rank-up" onClick={() => c.send({ t: 'rank', slot: i })} title={`Rank up (Ctrl+${SLOTS[i]})`}>+</button>}
              <AbilityIcon hero={me.hero} slot={i + 1} size={54} />
              <CdOverlay cd={a.recast ? 0 : a.cd} max={a.max} />
              <span className="key">{keyLabel(aKeys[i])}</span>
              {a.rank > 0 && <span className="cost">{a.cost}</span>}
              <div className="pips">{Array.from({ length: maxR }, (_, k) => <i key={k} className={k < a.rank ? 'on' : ''} />)}</div>
            </div>
          );
        })}
        <div className="sep" />
        {me.talents.map((t, i) => (
          <div key={t.id} className="ab small" onMouseEnter={() => setTip(<><b>{TALENTS[t.id].name}</b> <span className="muted">[{i ? 'F' : 'D'}] cooldown {TALENTS[t.id].cooldown} s</span><div>{TALENTS[t.id].desc}</div></>)} onMouseLeave={() => setTip(null)}>
            <TalentIcon id={t.id} size={42} />
            <CdOverlay cd={t.cd} max={t.max} />
            <span className="key">{keyLabel(i ? keys.talentF : keys.talentD)}</span>
          </div>
        ))}
      </div>
      <div className="items">
        <div className="gold" title="Gold">◉ {me.gold}</div>
        {me.items.map((it, i) => (
          <div key={i} className="item-slot" onMouseEnter={() => it && setTip(<ItemTip def={ITEMS[it.id]} />)} onMouseLeave={() => setTip(null)}
            onContextMenu={(e) => { e.preventDefault(); if (it && snap.me.inShop) c.send({ t: 'sell', slot: i }); }}>
            {it ? <ItemIcon id={it.id} size={40} /> : <div className="empty" />}
            {it && it.count > 1 && <span className="count">{it.count}</span>}
            {it && <CdOverlay cd={it.cd} max={ITEMS[it.id].active?.cooldown ?? 1} />}
            <span className="key">{i + 1}</span>
          </div>
        ))}
        <div className="item-slot trinket" onMouseEnter={() => setTip(<><b>Ward Trinket</b><div>Place a ward that grants vision for 90 s. {me.wardCharges}/2 charges{me.wardCharges < 2 ? `, next in ${Math.ceil(me.wardRecharge)} s` : ''}. Team cap 3 trinket wards.</div></>)} onMouseLeave={() => setTip(null)}>
          <ItemIcon id="lantern" size={40} />
          <span className="count">{me.wardCharges}</span>
          <span className="key">{keyLabel(keys.ward)}</span>
        </div>
      </div>
    </div>
  );
}

function ItemTip({ def }: { def: ItemDef }) {
  return (
    <>
      <b>{def.name}</b> <span className="muted">{def.category} · {def.cost} g</span>
      <div className="stat-lines">{Object.entries(def.stats).map(([k, v]) => <span key={k}>+{k === 'as' ? `${Math.round((v as number) * 100)}% attack speed` : k === 'crit' ? `${Math.round((v as number) * 100)}% crit` : k === 'healPower' ? `${Math.round((v as number) * 100)}% heal & shield power` : `${v} ${statName(k)}`}</span>)}</div>
      {def.passive && <div><i>Passive:</i> {def.passive}</div>}
      {def.active && <div><i>Active — {def.active.name}:</i> {def.active.desc} ({def.active.cooldown} s)</div>}
      {def.from.length > 0 && <div className="muted">Built from: {def.from.map((f) => ITEMS[f].name).join(' + ')}</div>}
    </>
  );
}
const statName = (k: string) => ({ maxHp: 'health', hpRegen: 'health regen/s', maxMana: 'mana', manaRegen: 'mana regen/s', ad: 'attack damage', ap: 'ability power', armor: 'armor', ward: 'ward', ms: 'm/s move speed', haste: 'ability haste', armorPen: 'armor penetration', wardPen: 'ward penetration', lifesteal: 'lifesteal' } as Record<string, string>)[k] ?? k;

function MinimapBox({ c }: { c: MatchController }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.appendChild(c.minimap.canvas); }, [c]);
  const handle = (e: React.MouseEvent) => {
    const r = c.minimap.canvas.getBoundingClientRect();
    c.minimapClick(((e.clientX - r.left) / r.width) * c.minimap.canvas.width, ((e.clientY - r.top) / r.height) * c.minimap.canvas.height, e.button);
  };
  return <div className="minimap" ref={ref} onMouseDown={handle} onContextMenu={(e) => e.preventDefault()} onMouseMove={(e) => e.buttons === 1 && handle(e)} />;
}
function BigMap({ c }: { c: MatchController }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.appendChild(c.mapBig.canvas); }, [c]);
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && c.store.set({ mapOpen: false })}>
      <div className="bigmap" ref={ref} onContextMenu={(e) => e.preventDefault()} onMouseDown={(e) => { const r = c.mapBig.canvas.getBoundingClientRect(); c.minimapClick(((e.clientX - r.left) / r.width) * c.mapBig.canvas.width, ((e.clientY - r.top) / r.height) * c.mapBig.canvas.height, e.button, true); }} />
    </div>
  );
}

function RecallBar({ snap }: { snap: Snapshot }) {
  const k = (snap.time - snap.me.recallStart) / Math.max(0.1, snap.me.recallUntil - snap.me.recallStart);
  return <div className="recall"><span>Recalling…</span><div><i style={{ width: `${Math.min(100, k * 100)}%` }} /></div></div>;
}

function DeathRecap({ snap, recap }: { snap: Snapshot; recap: ReturnType<typeof useHud>['recap'] }) {
  const left = Math.max(0, snap.me.respawnAt - snap.time);
  return (
    <div className="recap">
      <h3>Respawning in {Math.ceil(left)} s</h3>
      {recap && <>
        <div>Slain by <b>{recap.killer}</b>{recap.killerHero ? ` (${recap.killerHero})` : ''}{recap.assists.length ? ` with ${recap.assists.join(', ')}` : ''}</div>
        <div className="muted small">Damage taken in the final 8 s: {recap.total}</div>
        <table><tbody>{recap.sources.map((s, i) => <tr key={i}><td>{s.name}</td><td>{s.source}</td><td className={`dt ${s.type}`}>{s.amount}</td></tr>)}</tbody></table>
        {recap.cc.length > 0 && <div className="small">Crowd control: {recap.cc.map((c) => `${c.kind} ${c.dur}s (${c.name})`).join(' → ')}</div>}
      </>}
      <div className="muted small">Shop is available while dead (P).</div>
    </div>
  );
}

// ------------------------------------------------------------------ shop
const CATS: Array<{ key: string; label: string; f: (d: ItemDef) => boolean }> = [
  { key: 'all', label: 'All', f: () => true },
  { key: 'starter', label: 'Starter', f: (d) => d.category === 'starter' },
  { key: 'attack', label: 'Attack', f: (d) => d.tags.includes('attack') && d.category !== 'starter' },
  { key: 'ability', label: 'Ability', f: (d) => d.tags.includes('ability') && d.category !== 'starter' },
  { key: 'defense', label: 'Defense', f: (d) => d.tags.includes('defense') && d.category !== 'starter' },
  { key: 'movement', label: 'Movement', f: (d) => d.tags.includes('movement') },
  { key: 'support', label: 'Support', f: (d) => (d.tags as ItemTag[]).includes('support') },
  { key: 'consumable', label: 'Consumable', f: (d) => d.category === 'consumable' },
];

function Shop({ c, snap }: { c: MatchController; snap: Snapshot }) {
  const me = snap.me;
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [sel, setSel] = useState<string>(HEROES[me.hero].builds[0].items[0]);
  const owned = me.items.map((i) => (i ? i.id : ''));
  const enemyHeroes = snap.score.filter((s) => s.team !== c.renderer.myTeam).map((s) => s.hero as HeroId);
  const phys = enemyHeroes.filter((h) => HEROES[h].damageProfile === 'physical').length;
  const arc = enemyHeroes.filter((h) => HEROES[h].damageProfile === 'arcane').length;
  const list = ITEM_LIST.filter((d) => CATS.find((x) => x.key === cat)!.f(d) && d.name.toLowerCase().includes(q.toLowerCase()));
  const selDef = ITEMS[sel];
  const plan = purchasePlan(sel, owned);
  const canBuy = me.inShop && me.gold >= plan.cost;
  const builds = HEROES[me.hero].builds;
  const order = ['starter', 'component', 'boots', 'completed', 'consumable'];
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && c.store.set({ shopOpen: false })}>
      <div className="shop">
        <div className="shop-head">
          <h2>Guild Exchange</h2>
          <input placeholder="Search items…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter') { (e.target as HTMLInputElement).blur(); } }} />
          <div className="gold big">◉ {me.gold}</div>
          <button className="btn small" disabled={!me.canUndo} onClick={() => c.send({ t: 'undo' })} title="Undo last purchase (only before leaving the fountain, fighting or using items)">Undo</button>
          <button className="btn small" onClick={() => c.store.set({ shopOpen: false })}>Close (P)</button>
        </div>
        {!me.inShop && <div className="shop-warn">Purchases are only possible in your fountain (or while dead). You can still browse.</div>}
        <div className="shop-body">
          <div className="shop-left">
            <div className="cats">{CATS.map((x) => <button key={x.key} className={cat === x.key ? 'on' : ''} onClick={() => setCat(x.key)}>{x.label}</button>)}</div>
            {order.map((grp) => {
              const items = list.filter((d) => d.category === grp);
              if (!items.length) return null;
              return (
                <div key={grp}>
                  <h4>{grp === 'completed' ? 'Completed' : grp[0].toUpperCase() + grp.slice(1)}</h4>
                  <div className="grid">{items.map((d) => {
                    const p = purchasePlan(d.id, owned);
                    return (
                      <div key={d.id} className={`shop-item ${sel === d.id ? 'sel' : ''} ${owned.includes(d.id) ? 'owned' : ''} ${p.cost > me.gold ? 'poor' : ''}`} onClick={() => setSel(d.id)} onDoubleClick={() => c.send({ t: 'buy', item: d.id })} onContextMenu={(e) => { e.preventDefault(); c.send({ t: 'buy', item: d.id }); }}>
                        <ItemIcon id={d.id} size={42} /><span>{p.cost}</span>
                      </div>
                    );
                  })}</div>
                </div>
              );
            })}
          </div>
          <div className="shop-right">
            <h4>Recommended for {HEROES[me.hero].name}</h4>
            {builds.map((b) => {
              const swaps: string[] = [];
              let items = b.items;
              if (phys >= 2 && b.vsPhysical) { swaps.push(`Enemy team is mostly physical (${phys}/3) → consider ${ITEMS[b.vsPhysical].name}`); items = [...items.slice(0, -1), b.vsPhysical]; }
              if (arc >= 2 && b.vsArcane) { swaps.push(`Enemy team is mostly arcane (${arc}/3) → consider ${ITEMS[b.vsArcane].name}`); items = [...items.slice(0, -1), b.vsArcane]; }
              return (
                <div key={b.name} className="build">
                  <div><b>{b.name}</b> <span className="muted small">{b.why}</span></div>
                  <div className="row">{items.map((id, i) => <div key={i} className={`mini ${owned.includes(id) ? 'owned' : ''}`} onClick={() => setSel(id)}><ItemIcon id={id} size={34} /></div>)}</div>
                  {swaps.map((s) => <div key={s} className="small swap">{s}</div>)}
                </div>
              );
            })}
            {selDef && (
              <div className="detail">
                <div className="detail-head"><ItemIcon id={sel} size={52} /><div><b>{selDef.name}</b><div className="muted small">{selDef.category} · total {selDef.cost} g · your price {plan.cost} g</div></div></div>
                <ItemTip def={selDef} />
                {selDef.from.length > 0 && (
                  <div className="tree">
                    <div className="tree-top"><ItemIcon id={sel} size={34} /></div>
                    <div className="tree-kids">{selDef.from.map((f, i) => <div key={i} className={`mini ${owned.includes(f) ? 'owned' : ''}`} onClick={() => setSel(f)} title={ITEMS[f].name}><ItemIcon id={f} size={30} /><small>{ITEMS[f].cost}</small></div>)}</div>
                  </div>
                )}
                <button className="btn primary" disabled={!canBuy} onClick={() => c.send({ t: 'buy', item: sel })}>{!me.inShop ? 'Return to fountain to buy' : me.gold < plan.cost ? `Need ${plan.cost - me.gold} more gold` : `Buy for ${plan.cost}`}</button>
                <div className="muted small">Selling returns {Math.round(SELL_RATIO * 100)}%. Right-click an inventory slot in the fountain to sell.</div>
              </div>
            )}
            <h4>Inventory</h4>
            <div className="row">{me.items.map((it, i) => <div key={i} className="mini inv" title={it ? `${ITEMS[it.id].name} — click to sell for ${Math.floor(ITEMS[it.id].cost * SELL_RATIO) * (ITEMS[it.id].maxStack ? it.count : 1)}` : 'empty'} onClick={() => it && me.inShop && c.send({ t: 'sell', slot: i })}>{it ? <ItemIcon id={it.id} size={34} /> : <div className="empty" />}</div>)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ scoreboard
function Scoreboard({ c, snap, muted }: { c: MatchController; snap: Snapshot; muted: Set<number> }) {
  const teams = [0, 1] as const;
  return (
    <div className="scoreboard">
      {teams.map((t) => (
        <table key={t} className={`sb t${t}`}>
          <thead><tr><th colSpan={2}>{t === 0 ? 'Dawn Guild' : 'Dusk Guild'} — {snap.kills[t]} kills</th><th>Lv</th><th>K/D/A</th><th>CS</th><th>Items</th><th>Wards</th><th>Obj</th><th>Bounty</th><th>Ping</th><th /></tr></thead>
          <tbody>
            {snap.score.filter((s) => s.team === t).map((s) => (
              <tr key={s.slot} className={s.slot === c.setup.humanSlot ? 'me' : ''}>
                <td><Portrait hero={s.hero} size={30} dim={s.dead} /></td>
                <td><b>{s.name}</b><div className="muted small">{HEROES[s.hero].name}{s.dead ? ` · respawn ${Math.ceil(Math.max(0, s.respawnAt - snap.time))}s` : ''}</div></td>
                <td>{s.level}</td><td>{s.k}/{s.d}/{s.a}</td><td>{s.cs}</td>
                <td className="sb-items">{s.items.map((i, k) => <ItemIcon key={k} id={i} size={22} />)}</td>
                <td>{s.wardScore}</td><td>{s.objectives}</td><td>{s.bounty ? `${s.bounty}g` : '—'}</td>
                <td className="muted small">{s.bot ? 'BOT' : 'local'}</td>
                <td>{s.slot !== c.setup.humanSlot && <button className="btn tiny" onClick={() => { const m = new Set(muted); m.has(s.slot) ? m.delete(s.slot) : m.add(s.slot); c.store.set({ muted: m }); }}>{muted.has(s.slot) ? 'Unmute' : 'Mute'}</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ))}
      <div className="muted small">Reports require an online account and are not available in this offline build.</div>
    </div>
  );
}

function StatsPanel({ snap }: { snap: Snapshot }) {
  const s = snap.me.stats;
  const row = snap.score.find((r) => r.slot === 0)!;
  const lines: Array<[string, string]> = [
    ['Max health', `${Math.round(s.maxHp)}`], ['Health regen', `${s.hpRegen.toFixed(1)}/s`], ['Max resource', `${Math.round(s.maxMana)}`], ['Resource regen', `${s.manaRegen.toFixed(1)}/s`],
    ['Attack damage', `${Math.round(s.ad)}`], ['Ability power', `${Math.round(s.ap)}`], ['Attack speed', `${s.as.toFixed(2)}/s (+${Math.round((s.bonusAs ?? 0) * 100)}%)`], ['Attack range', `${s.range.toFixed(1)} m`],
    ['Armor', `${Math.round(s.armor)} (−${Math.round((s.armor / (100 + Math.abs(s.armor))) * 100)}% physical)`], ['Ward', `${Math.round(s.ward)} (−${Math.round((s.ward / (100 + Math.abs(s.ward))) * 100)}% arcane)`],
    ['Move speed', `${s.ms.toFixed(2)} m/s`], ['Ability haste', `${Math.round(s.haste)} (−${Math.round((1 - 100 / (100 + s.haste)) * 100)}% cooldowns)`], ['Critical chance', `${Math.round(s.crit * 100)}%`],
    ['Armor pen.', `${Math.round(s.armorPen)}`], ['Ward pen.', `${Math.round(s.wardPen)}`], ['Heal & shield power', `${Math.round(s.healPower * 100)}%`],
    ['Damage to heroes', `${row.dmgHeroes}`], ['Damage taken', `${row.dmgTaken}`], ['Damage to structures', `${row.dmgStructures}`], ['Healing done', `${row.healing}`],
  ];
  return <div className="stats-panel"><h3>Advanced stats (C)</h3>{lines.map(([a, b]) => <div key={a} className="sl"><span>{a}</span><b>{b}</b></div>)}</div>;
}

function PingWheel({ c, x, y }: { c: MatchController; x: number; y: number }) {
  const kinds = Object.keys(PING_STYLE) as PingKind[];
  return (
    <div className="ping-back" onMouseDown={(e) => { if (e.target === e.currentTarget) c.store.set({ pingWheel: null }); }} onContextMenu={(e) => e.preventDefault()}>
      <div className="ping-wheel" style={{ left: x, top: y }}>
        {kinds.map((k, i) => {
          const a = (i / kinds.length) * Math.PI * 2 - Math.PI / 2;
          return <button key={k} style={{ left: Math.cos(a) * 70, top: Math.sin(a) * 70, borderColor: PING_STYLE[k].color }} onMouseUp={() => c.ping(k)} onClick={() => c.ping(k)}><b style={{ color: PING_STYLE[k].color }}>{PING_STYLE[k].glyph}</b>{PING_STYLE[k].label}</button>;
        })}
      </div>
    </div>
  );
}

function Chat({ c, st, enabled }: { c: MatchController; st: ReturnType<typeof useHud>; enabled: boolean }) {
  const [text, setText] = useState('');
  const now = performance.now() / 1000;
  if (!enabled) return null;
  return (
    <div className="chat">
      {st.chat.filter((m) => now - m.t < 15 || st.chatOpen).map((m) => <div key={m.id}><b>{m.from}:</b> {m.text}</div>)}
      {st.chatOpen && <input autoFocus value={text} maxLength={120} placeholder="Team chat — Enter to send, Esc to cancel" onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') { if (text.trim()) c.send({ t: 'chat', text }); setText(''); c.store.set({ chatOpen: false }); } if (e.key === 'Escape') { setText(''); c.store.set({ chatOpen: false }); } }} />}
    </div>
  );
}

function PracticePanel({ c, snap }: { c: MatchController; snap: Snapshot }) {
  const op = (o: 'gold' | 'level' | 'timescale' | 'pause' | 'resetcd' | 'spawnwave', value?: number) => c.send({ t: 'practice', op: o, value });
  return (
    <div className="practice">
      <b>Practice tools</b>
      <button className="btn tiny" onClick={() => op('gold')}>+1000 gold</button>
      <button className="btn tiny" onClick={() => op('level')}>Level up</button>
      <button className="btn tiny" onClick={() => op('resetcd')}>Reset cooldowns</button>
      <button className="btn tiny" onClick={() => op('spawnwave')}>Spawn wave</button>
      <button className="btn tiny" onClick={() => op('pause')}>{snap.paused ? 'Resume' : 'Pause'}</button>
      <span className="row">{[0.5, 1, 2, 4].map((v) => <button key={v} className={`btn tiny ${snap.timeScale === v ? 'on' : ''}`} onClick={() => op('timescale', v)}>×{v}</button>)}</span>
      <span className="muted small">Hold Alt to show ranges.</span>
    </div>
  );
}

function TutorialPanel({ step }: { step: number }) {
  const s = TUTORIAL_STEPS[Math.min(step, TUTORIAL_STEPS.length - 1)];
  const done = step >= TUTORIAL_STEPS.length;
  return (
    <div className="tutorial">
      <div className="muted small">Tutorial · step {Math.min(step + 1, TUTORIAL_STEPS.length)} / {TUTORIAL_STEPS.length}</div>
      <h3>{done ? 'Tutorial complete!' : s.title}</h3>
      <p>{done ? 'You know the full loop. Try Practice or an Unranked match next.' : s.text}</p>
      <div className="steps">{TUTORIAL_STEPS.map((t, i) => <i key={t.key} className={i < step ? 'done' : i === step ? 'cur' : ''} title={t.title} />)}</div>
    </div>
  );
}

function Suggestions({ snap }: { snap: Snapshot }) {
  const tips = useMemo(() => {
    const out: string[] = [];
    const me = snap.me;
    if (me.skillPoints > 0) out.push(`Skill point available — Ctrl+Q/W/E/R or click +`);
    if (me.inShop && me.gold >= 900) out.push('You can afford an upgrade — press P');
    return out;
  }, [snap.me.skillPoints, snap.me.inShop, Math.floor(snap.me.gold / 300)]);
  if (!tips.length) return null;
  return <div className="suggest">{tips.map((t) => <div key={t}>💡 {t}</div>)}</div>;
}
