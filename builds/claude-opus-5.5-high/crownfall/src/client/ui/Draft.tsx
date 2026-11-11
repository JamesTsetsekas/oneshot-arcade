// Queue (local matchmaker with named bots + ready check) and simultaneous hero draft with Talents.
import React, { useEffect, useMemo, useState } from 'react';
import { HEROES } from '../../shared/heroes';
import { HERO_IDS, HeroId, TalentId, abilityTooltip } from '../../shared/types';
import { TALENTS, TALENT_IDS, ITEMS } from '../../shared/items';
import { AbilityIcon, Portrait, TalentIcon, ItemIcon } from './icons';
import { HeroPreview } from './HeroPreview';
import { BOT_NAMES } from '../../ai/bot';
import { Rng } from '../../shared/math';
import { botPick, defaultTalents } from '../../services/matchmaker';
import { masteryRank, Profile } from '../../services/profile';

export interface DraftOutcome { hero: HeroId; talents: [TalentId, TalentId]; allies: HeroId[]; enemies: HeroId[]; botNames: string[] }

export function Queue({ onReady, onCancel, seed }: { onReady: (names: string[]) => void; onCancel: () => void; seed: number }) {
  const [seated, setSeated] = useState(1);
  const [ready, setReady] = useState(false);
  const names = useMemo(() => { const r = new Rng(seed); return [...BOT_NAMES].sort(() => r.next() - 0.5).slice(0, 5); }, [seed]);
  useEffect(() => {
    if (seated >= 6) return;
    const t = setTimeout(() => setSeated((s) => s + 1), 350 + Math.random() * 350);
    return () => clearTimeout(t);
  }, [seated]);
  return (
    <div className="screen queue">
      <h1>Unranked 3v3</h1>
      <p className="muted">Region: Local · Party: 1 · Filling empty seats with named bots (Normal difficulty)</p>
      <div className="seats">
        {Array.from({ length: 6 }, (_, i) => <div key={i} className={`seat ${i < seated ? 'on' : ''}`}>{i === 0 ? 'You' : i < seated ? `${names[i - 1]} (bot)` : 'Searching…'}</div>)}
      </div>
      {seated >= 6 ? (
        <div className="ready-check">
          <h2>Match found</h2>
          <button className="btn primary big" disabled={ready} onClick={() => { setReady(true); setTimeout(() => onReady(names), 500); }}>{ready ? 'Ready ✓' : 'Accept'}</button>
          <button className="btn" onClick={onCancel}>Decline</button>
        </div>
      ) : <button className="btn" onClick={onCancel}>Cancel queue</button>}
    </div>
  );
}

export function Draft({ onLock, onBack, seed, profile, title = 'Hero Select', botNames, allyCount = 2, enemyCount = 3, timer = 45 }: { onLock: (o: DraftOutcome) => void; onBack: () => void; seed: number; profile: Profile; title?: string; botNames: string[]; allyCount?: number; enemyCount?: number; timer?: number }) {
  const [hover, setHover] = useState<HeroId>('suri');
  const [pick, setPick] = useState<HeroId | null>(null);
  const [talents, setTalents] = useState<TalentId[]>(defaultTalents('suri'));
  const [locked, setLocked] = useState(false);
  const [left, setLeft] = useState(timer);
  // bots draft simultaneously; allies cannot duplicate each other, enemies may mirror
  const rng = useMemo(() => new Rng(seed), [seed]);
  const [allyPicks, setAllyPicks] = useState<HeroId[]>([]);
  const [enemyPicks, setEnemyPicks] = useState<HeroId[]>([]);
  useEffect(() => {
    const t = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (left === timer - 3 || left === timer - 7 || left === timer - 11) {
      setAllyPicks((a) => a.length < allyCount ? [...a, botPick(rng, [...a, ...(pick ? [pick] : [])], [...a, ...(pick ? [pick] : [])])] : a);
    }
    if (left === timer - 2 || left === timer - 5 || left === timer - 9) {
      setEnemyPicks((e) => e.length < enemyCount ? [...e, botPick(rng, e, e)] : e);
    }
    if (left === 0 && !locked) lock(pick ?? hover);
  }, [left]);
  const showHero = pick ?? hover;
  const h = HEROES[showHero];
  const toggleTalent = (t: TalentId) => {
    if (locked) return;
    setTalents((cur) => cur.includes(t) ? cur.filter((x) => x !== t) : cur.length >= 2 ? [cur[1], t] : [...cur, t]);
  };
  const lock = (hero: HeroId) => {
    if (locked) return;
    setLocked(true);
    let allies = [...allyPicks].filter((a) => a !== hero);
    while (allies.length < allyCount) allies.push(botPick(rng, [hero, ...allies], [hero, ...allies]));
    let enemies = [...enemyPicks];
    while (enemies.length < enemyCount) enemies.push(botPick(rng, enemies, enemies));
    const tl = (talents.length === 2 ? talents : defaultTalents(hero)) as [TalentId, TalentId];
    setTimeout(() => onLock({ hero, talents: tl, allies, enemies, botNames }), 900);
  };
  const takenByAlly = (id: HeroId) => allyPicks.includes(id);
  const mastery = masteryRank(profile.mastery[showHero] ?? 0);
  return (
    <div className="screen draft">
      <div className="draft-top">
        <button className="btn" onClick={onBack} disabled={locked}>Leave</button>
        <h1>{title}</h1>
        <div className={`timer ${left < 10 ? 'warn' : ''}`}>{left}s</div>
      </div>
      <div className="draft-body">
        <div className="team-col">
          <h3>Your team (Dawn)</h3>
          <div className={`pick-card me ${locked ? 'locked' : ''}`}>{pick ? <Portrait hero={pick} size={54} /> : <div className="ph">?</div>}<div><b>You</b><div className="muted small">{pick ? HEROES[pick].name : 'Picking…'}{locked ? ' · locked' : ''}</div></div></div>
          {Array.from({ length: allyCount }, (_, i) => <div key={i} className="pick-card">{allyPicks[i] ? <Portrait hero={allyPicks[i]} size={54} /> : <div className="ph">…</div>}<div><b>{botNames[i] ?? 'Bot'}</b><div className="muted small">{allyPicks[i] ? HEROES[allyPicks[i]].name : 'Picking…'}</div></div></div>)}
        </div>
        <div className="draft-center">
          <div className="hero-grid">
            {HERO_IDS.map((id) => (
              <button key={id} className={`hero-tile ${pick === id ? 'sel' : ''} ${takenByAlly(id) ? 'taken' : ''}`} disabled={locked || takenByAlly(id)} onMouseEnter={() => setHover(id)} onClick={() => { setPick(id); setHover(id); if (talents.length === 0) setTalents(defaultTalents(id)); }}>
                <Portrait hero={id} size={72} dim={takenByAlly(id)} />
                <span>{HEROES[id].name}</span>
              </button>
            ))}
          </div>
          <div className="hero-detail">
            <div className="preview"><HeroPreview hero={showHero} size={210} /></div>
            <div className="info">
              <h2>{h.name} <small>{h.title}</small></h2>
              <div className="tags">{h.roles.map((r) => <span key={r} className="tag">{r}</span>)}<span className="tag diff">Difficulty {'●'.repeat(h.difficulty)}{'○'.repeat(3 - h.difficulty)}</span><span className="tag">Mastery {mastery.rank} · {mastery.title}</span></div>
              <p className="muted">{h.lore}</p>
              <PowerBudget hero={showHero} />
              <div className="kit">
                {h.abilities.map((a, i) => (
                  <div key={a.id} className="kit-row"><AbilityIcon hero={showHero} slot={i} size={40} /><div><b>{a.slot === 'P' ? 'Passive' : a.slot} · {a.name}</b> <span className="muted small">{a.targeting !== 'passive' ? `${a.targeting}, ${a.range} m, cd ${a.cooldown[0]}s` : ''}</span><div className="small">{abilityTooltip(a, 1)}</div>{a.counter && <div className="small counter">Counterplay: {a.counter}</div>}</div></div>
                ))}
              </div>
              <div className="builds">{h.builds.map((b) => <div key={b.name} className="build-mini"><b>{b.name}</b> {b.items.map((i) => <ItemIcon key={i} id={i} size={24} />)} <span className="muted small">{b.why}</span></div>)}</div>
            </div>
          </div>
          <div className="talents">
            <h3>Talents <span className="muted small">choose two (D / F)</span></h3>
            <div className="talent-row">{TALENT_IDS.map((t) => (
              <button key={t} className={`talent ${talents.includes(t) ? 'sel' : ''}`} onClick={() => toggleTalent(t)} disabled={locked} title={TALENTS[t].desc}>
                <TalentIcon id={t} size={36} /><span>{TALENTS[t].name}</span>{talents.includes(t) && <b className="tkey">{talents.indexOf(t) === 0 ? 'D' : 'F'}</b>}
              </button>
            ))}</div>
            <div className="muted small">{talents.map((t) => `${TALENTS[t].name}: ${TALENTS[t].desc}`).join('  ·  ')}</div>
          </div>
          <button className="btn primary big lock" disabled={!pick || locked || talents.length !== 2} onClick={() => pick && lock(pick)}>{locked ? 'Locked in' : !pick ? 'Select a hero' : talents.length !== 2 ? 'Pick two talents' : `Lock in ${HEROES[pick].name}`}</button>
        </div>
        <div className="team-col enemy">
          <h3>Enemy team (Dusk)</h3>
          {Array.from({ length: enemyCount }, (_, i) => <div key={i} className="pick-card">{enemyPicks[i] ? <Portrait hero={enemyPicks[i]} size={54} /> : <div className="ph">…</div>}<div><b>{botNames[allyCount + i] ?? 'Bot'}</b><div className="muted small">{enemyPicks[i] ? HEROES[enemyPicks[i]].name : 'Picking…'}</div></div></div>)}
          <p className="muted small">Duplicate heroes are not allowed on the same team; mirrored enemy picks are allowed.</p>
        </div>
      </div>
    </div>
  );
}

export function PowerBudget({ hero }: { hero: HeroId }) {
  const p = HEROES[hero].power;
  const rows: Array<[string, number]> = [['Burst', p.burst], ['Mobility', p.mobility], ['Control', p.control], ['Sustain', p.sustain], ['Range', p.range], ['Safety', p.safety]];
  return <div className="power">{rows.map(([k, v]) => <div key={k}><span>{k}</span><i>{Array.from({ length: 5 }, (_, j) => <b key={j} className={j < v ? 'on' : ''} />)}</i></div>)}</div>;
}
void ITEMS;
