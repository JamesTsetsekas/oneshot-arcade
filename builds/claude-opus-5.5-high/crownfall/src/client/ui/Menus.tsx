// Shell screens: main menu, play/practice setup, hero & item codex, match history, credits.
import React, { useState } from 'react';
import { HEROES } from '../../shared/heroes';
import { HERO_IDS, HeroId, abilityTooltip } from '../../shared/types';
import { ITEM_LIST, ITEMS } from '../../shared/items';
import { AbilityIcon, ItemIcon, Portrait } from './icons';
import { HeroPreview } from './HeroPreview';
import { PowerBudget } from './Draft';
import { masteryRank, Profile, PROFILE_XP_PER_LEVEL } from '../../services/profile';
import { fmtTime } from './Hud';

export function MainMenu({ go, profile, notice }: { go: (s: string) => void; profile: Profile; notice: string | null }) {
  return (
    <div className="screen main-menu">
      <div className="title-block">
        <div className="crest">♛</div>
        <h1 className="title">CROWNFALL</h1>
        <div className="subtitle">The Broken Diadem · 3v3 lane-and-objective battles in the sky</div>
      </div>
      <div className="menu-buttons">
        <button className="btn primary big" onClick={() => go('play')}>Play</button>
        <button className="btn big" onClick={() => go('tutorial')}>Tutorial{!profile.tutorialDone && <span className="badge">new</span>}</button>
        <button className="btn" onClick={() => go('heroes')}>Heroes</button>
        <button className="btn" onClick={() => go('items')}>Items</button>
        <button className="btn" onClick={() => go('history')}>Match History</button>
        <button className="btn" onClick={() => go('settings')}>Settings</button>
        <button className="btn" onClick={() => go('credits')}>Credits</button>
      </div>
      <div className="profile-card">
        <div><b>Guest</b> · Profile level {profile.level}</div>
        <div className="bar xpbar"><i style={{ width: `${(100 * profile.xp) / PROFILE_XP_PER_LEVEL}%` }} /></div>
        <div className="muted small">Banner: {profile.banner} · {profile.history.length} matches played</div>
      </div>
      {notice && <div className="notice">{notice}</div>}
      <div className="footer muted small">Offline build — the authoritative room and bots run locally in a background worker. No accounts, no telemetry.</div>
    </div>
  );
}

export function PlayMenu({ go, onPractice, back }: { go: (s: string) => void; onPractice: (allies: number, enemies: number, diff: 'easy' | 'normal' | 'hard') => void; back: () => void }) {
  const [allies, setAllies] = useState(2);
  const [enemies, setEnemies] = useState(3);
  const [diff, setDiff] = useState<'easy' | 'normal' | 'hard'>('normal');
  return (
    <div className="screen play-menu">
      <h1>Play</h1>
      <div className="mode-cards">
        <div className="mode-card">
          <h2>Unranked 3v3</h2>
          <p>Full Broken Diadem match. The matchmaker seats you with named bots, then everyone drafts simultaneously. 14–22 minutes.</p>
          <button className="btn primary big" onClick={() => go('queue')}>Find match</button>
        </div>
        <div className="mode-card">
          <h2>Practice</h2>
          <p>You plus configurable bots. Pause, time scale, gold and level controls, range display.</p>
          <div className="opt">Allied bots <span className="row">{[0, 1, 2].map((n) => <button key={n} className={`btn tiny ${allies === n ? 'on' : ''}`} onClick={() => setAllies(n)}>{n}</button>)}</span></div>
          <div className="opt">Enemy bots <span className="row">{[0, 1, 2, 3].map((n) => <button key={n} className={`btn tiny ${enemies === n ? 'on' : ''}`} onClick={() => setEnemies(n)}>{n}</button>)}</span></div>
          <div className="opt">Difficulty <span className="row">{(['easy', 'normal', 'hard'] as const).map((d) => <button key={d} className={`btn tiny ${diff === d ? 'on' : ''}`} onClick={() => setDiff(d)}>{d}</button>)}</span></div>
          <button className="btn big" onClick={() => onPractice(allies, enemies, diff)}>Choose hero</button>
        </div>
        <div className="mode-card">
          <h2>Tutorial</h2>
          <p>Guided: move, attack, cast, last-hit, recall & shop, wards, towers, objectives and base victory.</p>
          <button className="btn big" onClick={() => go('tutorial')}>Start tutorial</button>
        </div>
      </div>
      <button className="btn" onClick={back}>Back</button>
    </div>
  );
}

export function HeroesCodex({ back, profile }: { back: () => void; profile: Profile }) {
  const [sel, setSel] = useState<HeroId>('brannoch');
  const h = HEROES[sel];
  const m = masteryRank(profile.mastery[sel] ?? 0);
  return (
    <div className="screen codex">
      <div className="codex-head"><button className="btn" onClick={back}>Back</button><h1>Heroes</h1></div>
      <div className="codex-body">
        <div className="codex-list">{HERO_IDS.map((id) => <button key={id} className={`hero-tile ${sel === id ? 'sel' : ''}`} onClick={() => setSel(id)}><Portrait hero={id} size={60} /><span>{HEROES[id].name}</span></button>)}</div>
        <div className="codex-detail">
          <HeroPreview hero={sel} size={280} />
          <div>
            <h2>{h.name} <small>{h.title}</small></h2>
            <div className="tags">{h.roles.map((r) => <span key={r} className="tag">{r}</span>)}<span className="tag">Difficulty {h.difficulty}/3</span><span className="tag">Mastery {m.rank} · {m.title} ({profile.mastery[sel] ?? 0} xp)</span></div>
            <p>{h.lore}</p>
            <PowerBudget hero={sel} />
            <div className="muted small">Base: {h.base.maxHp} HP · {h.base.ad} AD · {h.base.as} AS · {h.base.armor} armor · {h.base.ms} m/s · range {h.base.range} m · {h.resource}</div>
            {h.abilities.map((a, i) => <div key={a.id} className="kit-row"><AbilityIcon hero={sel} slot={i} size={44} /><div><b>{a.slot === 'P' ? 'Passive' : a.slot} · {a.name}</b><div className="small">{abilityTooltip(a, 1)}</div>{a.counter && <div className="small counter">Counterplay: {a.counter}</div>}</div></div>)}
            <h3>Build directions</h3>
            {h.builds.map((b) => <div key={b.name} className="build-mini"><b>{b.name}</b> {b.items.map((i) => <ItemIcon key={i} id={i} size={28} />)} <span className="muted small">{b.why}</span></div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ItemsCodex({ back }: { back: () => void }) {
  const [sel, setSel] = useState('sunspoke');
  const d = ITEMS[sel];
  const users = HERO_IDS.filter((h) => HEROES[h].builds.some((b) => b.items.includes(sel) || b.vsArcane === sel || b.vsPhysical === sel));
  return (
    <div className="screen codex">
      <div className="codex-head"><button className="btn" onClick={back}>Back</button><h1>Items <small className="muted">({ITEM_LIST.length})</small></h1></div>
      <div className="codex-body">
        <div className="item-grid">{(['starter', 'component', 'boots', 'completed', 'consumable'] as const).map((cat) => (
          <div key={cat}><h4>{cat}</h4><div className="grid">{ITEM_LIST.filter((i) => i.category === cat).map((i) => <div key={i.id} className={`shop-item ${sel === i.id ? 'sel' : ''}`} onClick={() => setSel(i.id)}><ItemIcon id={i.id} size={44} /><span>{i.cost}</span></div>)}</div></div>
        ))}</div>
        <div className="codex-detail item">
          <ItemIcon id={sel} size={72} />
          <h2>{d.name}</h2>
          <div className="muted">{d.category} · {d.tags.join(', ')} · {d.cost} gold</div>
          <div className="stat-lines">{Object.entries(d.stats).map(([k, v]) => <div key={k}>+{k === 'as' || k === 'crit' || k === 'healPower' ? `${Math.round((v as number) * 100)}%` : v} {k}</div>)}</div>
          {d.passive && <p><b>Passive:</b> {d.passive}</p>}
          {d.active && <p><b>Active ({d.active.name}, {d.active.cooldown}s):</b> {d.active.desc}</p>}
          {d.from.length > 0 && <p>Recipe: {d.from.map((f) => ITEMS[f].name).join(' + ')} + {d.cost - d.from.reduce((s, f) => s + ITEMS[f].cost, 0)} g</p>}
          {users.length > 0 && <p>Recommended for: {users.map((u) => HEROES[u].name).join(', ')}</p>}
          {ITEM_LIST.filter((x) => x.from.includes(sel)).length > 0 && <p>Builds into: {ITEM_LIST.filter((x) => x.from.includes(sel)).map((x) => x.name).join(', ')}</p>}
        </div>
      </div>
    </div>
  );
}

export function History({ back, profile }: { back: () => void; profile: Profile }) {
  return (
    <div className="screen history">
      <div className="codex-head"><button className="btn" onClick={back}>Back</button><h1>Match History</h1></div>
      {profile.history.length === 0 && <p className="muted">No matches yet. Play one!</p>}
      <table className="hist"><tbody>
        {profile.history.map((h) => (
          <tr key={h.id} className={h.win ? 'win' : 'loss'}>
            <td><Portrait hero={h.hero} size={36} /></td><td><b>{h.win ? 'Victory' : 'Defeat'}</b><div className="muted small">{h.mode} · {new Date(h.date).toLocaleString()}</div></td>
            <td>{HEROES[h.hero].name}</td><td>{h.k}/{h.d}/{h.a}</td><td>{h.cs} cs</td><td>{fmtTime(h.duration)}</td><td>{h.items.map((i, k) => <ItemIcon key={k} id={i} size={22} />)}</td>
          </tr>
        ))}
      </tbody></table>
      <h3>Hero mastery</h3>
      <div className="mastery">{HERO_IDS.map((id) => { const m = masteryRank(profile.mastery[id] ?? 0); return <div key={id} className="m"><Portrait hero={id} size={40} /><div><b>{HEROES[id].name}</b><div className="small">Rank {m.rank} · {m.title}</div></div></div>; })}</div>
    </div>
  );
}

export function Credits({ back }: { back: () => void }) {
  return (
    <div className="screen credits">
      <h1>Credits</h1>
      <p>Crownfall — an original browser MOBA vertical slice built for Oneshot Arcade.</p>
      <p>Design, code, procedural models, VFX, synthesized audio and UI: generated in a single session by Claude Opus 5.5 (Claude Code).</p>
      <p>Built with Three.js (MIT), React (MIT), Vite (MIT), TypeScript (Apache-2.0). All heroes, abilities, items, map, names and assets are original; see ASSETS.md.</p>
      <button className="btn" onClick={back}>Back</button>
    </div>
  );
}
