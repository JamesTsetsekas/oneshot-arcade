// client-ui: application shell — main menu, draft, loading, match, results, codex and settings.

import { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BOT_TALENTS } from '../../ai/bots';
import { HEROES, HERO_IDS, HeroId, describeAbility, describePassive } from '../../shared/heroes';
import { ITEM_LIST, TALENTS, TALENT_IDS, TalentId } from '../../shared/items';
import type { Difficulty, MatchConfig, MatchMode, SeatConfig } from '../../shared/protocol';
import { BOT_NAMES, TEAM_NAMES } from '../../shared/units';
import { audio } from '../audio/audio';
import { GameClient, MatchResult } from '../game';
import { webglAvailable } from '../render/renderer';
import { DEFAULT_KEYS, KEY_LABELS, KeyAction, getProfile, getSettings, keyName, masteryLevel, profileLevel, setSettings, storageWasCorrupt, updateProfile } from '../runtime/persist';
import { Hud, ScoreTable } from './Hud';
import { ItemCard } from './Shop';
import { AbilityIcon, Glyph, HeroIcon, TalentIcon, colorHex } from './icons';

type Screen = 'menu' | 'draft' | 'loading' | 'game' | 'results' | 'heroes' | 'items' | 'history' | 'settings' | 'credits';

const TIPS = [
  'Only the killing blow on a minion pays gold — but standing nearby still earns experience.',
  'Towers shoot minions first. A red dashed line means the tower is aiming at you.',
  'Hitting an enemy hero under their tower makes it switch to you immediately.',
  'A Seal cannot be damaged until its Guard Tower falls. Break a Seal and Vanguards join your waves.',
  'Brush hides you from anyone outside it. Wards see into the brush they are placed in.',
  'The Aether Colossus empowers minions near your heroes for 150 seconds — use it to siege.',
  'Structures take far less damage when none of your minions are nearby.',
  'Recall (B) takes 7 seconds. Hero or tower damage interrupts it.',
];

function pick<T>(arr: T[], n: number, rnd: () => number): T[] {
  const a = arr.slice();
  const out: T[] = [];
  while (out.length < n && a.length) out.push(a.splice(Math.floor(rnd() * a.length), 1)[0]);
  return out;
}

/** Seat six players: the human plus named bots. Allies never duplicate a hero; mirrors across teams are allowed. */
function buildConfig(hero: HeroId, talents: [TalentId, TalentId], mode: MatchMode, difficulty: Difficulty, pace: 'quick' | 'standard'): MatchConfig {
  const seed = (Date.now() ^ (Math.random() * 0x7fffffff)) >>> 0;
  let s = seed || 1;
  const rnd = (): number => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const names = pick(BOT_NAMES, 5, rnd);
  const draftTeam = (taken: HeroId[]): HeroId[] => {
    const out = taken.slice();
    const needJungler = !out.some((h) => HEROES[h].builds.lane === 'jungle');
    const pool = HERO_IDS.filter((h) => !out.includes(h));
    if (needJungler) {
      const j = pick(
        pool.filter((h) => HEROES[h].builds.lane === 'jungle'),
        1,
        rnd,
      )[0];
      if (j) out.push(j);
    }
    // prefer a front-liner and a ranged carry so teams feel like teams
    const prefer = (pred: (h: HeroId) => boolean): void => {
      if (out.length >= 3 || out.some(pred)) return;
      const c = pick(
        HERO_IDS.filter((h) => !out.includes(h) && pred(h)),
        1,
        rnd,
      )[0];
      if (c) out.push(c);
    };
    prefer((h) => !HEROES[h].melee);
    prefer((h) => HEROES[h].roles.includes('Tank') || HEROES[h].roles.includes('Fighter'));
    while (out.length < 3) out.push(pick(HERO_IDS.filter((h) => !out.includes(h)), 1, rnd)[0]);
    return out;
  };
  const allies = draftTeam([hero]);
  const enemies = draftTeam([]);
  const seats: SeatConfig[] = [];
  let ni = 0;
  allies.forEach((h, i) => seats.push({ hero: h, team: 0, bot: i !== 0, name: i === 0 ? 'You' : names[ni++], talents: i === 0 ? talents : (BOT_TALENTS[h] as [TalentId, TalentId]) }));
  enemies.forEach((h) => seats.push({ hero: h, team: 1, bot: true, name: names[ni++], talents: BOT_TALENTS[h] as [TalentId, TalentId] }));
  return { seed, mode, difficulty: mode === 'tutorial' ? 'easy' : difficulty, pace, seats, humanSeat: 0 };
}

function Logo({ size = 64 }: { size?: number }): ReactElement {
  return (
    <div className="logo" style={{ fontSize: size }}>
      <Glyph id="crown" size={size * 0.9} color="#e8b64c" />
      <span>CROWNFALL</span>
    </div>
  );
}

// ---- menu ---------------------------------------------------------------------------------------

function Menu({ go, start }: { go: (s: Screen) => void; start: (m: MatchMode) => void }): ReactElement {
  const profile = getProfile();
  const item = (label: string, sub: string, fn: () => void, primary = false): ReactElement => (
    <button
      className={`menu-item ${primary ? 'primary' : ''}`}
      onClick={() => {
        audio.unlock();
        audio.play('ui');
        fn();
      }}
    >
      <b>{label}</b>
      <span>{sub}</span>
    </button>
  );
  return (
    <div className="screen menu">
      <div className="menu-art" />
      <div className="menu-col">
        <Logo />
        <p className="tagline">Two guilds. One shattered sky-island. Break the Seal, topple the Core Towers, claim the Crown Engine.</p>
        <div className="menu-list">
          {item('Play', 'Unranked 3v3 — you and two allied bots against three bots', () => start('unranked'), true)}
          {item('Tutorial', profile.tutorialDone ? 'Completed — replay the guided match' : 'A guided match that teaches the whole loop', () => start('tutorial'))}
          {item('Practice', 'Sandbox match with gold, level and time controls', () => start('practice'))}
          {item('Heroes', 'Six original heroes and their kits', () => go('heroes'))}
          {item('Items', 'All 32 items and the six Talents', () => go('items'))}
          {item('Match History', `${profile.history.length} recorded matches · Profile level ${profileLevel(profile)}`, () => go('history'))}
          {item('Settings', 'Graphics, audio, controls, accessibility', () => go('settings'))}
          {item('Credits', 'How this was made', () => go('credits'))}
        </div>
        {storageWasCorrupt && <p className="warn">Saved settings were unreadable and have been reset to defaults.</p>}
        <p className="fineprint">Vertical slice · single-player vs bots · the simulation runs in a local authoritative worker</p>
      </div>
    </div>
  );
}

// ---- draft --------------------------------------------------------------------------------------

function HeroDetail({ id, level = 1 }: { id: HeroId; level?: number }): ReactElement {
  const h = HEROES[id];
  return (
    <div className="herodetail">
      <div className="hd-head">
        <HeroIcon id={id} size={84} />
        <div>
          <h2>
            {h.name} <span>{h.title}</span>
          </h2>
          <div className="tags">
            {h.roles.map((r) => (
              <i key={r}>{r}</i>
            ))}
            <i className="diff">Difficulty {'●'.repeat(h.difficulty)}{'○'.repeat(3 - h.difficulty)}</i>
            <i>{h.melee ? 'Melee' : `Ranged ${h.base.range} m`}</i>
          </div>
          <p>{h.blurb}</p>
        </div>
      </div>
      <div className="kit">
        <div className="kit-row">
          <div className="kit-icon">
            <HeroIcon id={id} size={44} />
            <kbd>P</kbd>
          </div>
          <div>
            <b>{h.passive.name}</b>
            <p>{describePassive(h, level)}</p>
          </div>
        </div>
        {h.abilities.map((a, i) => (
          <div className="kit-row" key={a.id}>
            <div className="kit-icon">
              <AbilityIcon hero={id} slot={i} size={44} />
              <kbd>{a.key}</kbd>
            </div>
            <div>
              <b>
                {a.name}
                {a.ult ? ' — Ultimate' : ''}
              </b>
              <span className="kit-meta">
                {a.cost.join('/')} {h.resource} · {a.cd.join('/')} s
              </span>
              <p>{describeAbility(a, 0)}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="builds">
        {h.builds.paths.map((p) => (
          <div key={p.name}>
            <b>Build: {p.name}</b> — {p.why}
          </div>
        ))}
      </div>
    </div>
  );
}

function Draft({ mode, onLock, onBack }: { mode: MatchMode; onLock: (c: MatchConfig) => void; onBack: () => void }): ReactElement {
  const [hero, setHero] = useState<HeroId>('suri');
  const [talents, setTalents] = useState<TalentId[]>(['skyhop', 'mend']);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [pace, setPace] = useState<'quick' | 'standard'>('quick');
  const [left, setLeft] = useState(75);
  const lock = useCallback(() => {
    const t = (talents.length === 2 ? talents : [...talents, ...TALENT_IDS.filter((x) => !talents.includes(x))].slice(0, 2)) as [TalentId, TalentId];
    audio.play('buy');
    onLock(buildConfig(hero, t, mode, difficulty, pace));
  }, [hero, talents, mode, difficulty, pace, onLock]);
  useEffect(() => {
    const id = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (left <= 0) lock();
  }, [left, lock]);
  const toggleTalent = (t: TalentId): void => {
    audio.play('ui');
    setTalents((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : cur.length >= 2 ? [cur[1], t] : [...cur, t]));
  };
  const mastery = getProfile().mastery;
  return (
    <div className="screen draft">
      <div className="draft-top">
        <button className="back" onClick={onBack}>
          ← Back
        </button>
        <h1>{mode === 'tutorial' ? 'Tutorial — choose your hero' : mode === 'practice' ? 'Practice — choose your hero' : 'Hero Select'}</h1>
        <div className={`countdown ${left <= 10 ? 'hot' : ''}`}>{left}s</div>
      </div>
      <div className="draft-body">
        <div className="roster">
          {HERO_IDS.map((id) => (
            <button
              key={id}
              className={`hero-card ${hero === id ? 'sel' : ''}`}
              style={{ ['--hc' as string]: colorHex(HEROES[id].color) }}
              onClick={() => {
                setHero(id);
                audio.play('ui');
              }}
            >
              <HeroIcon id={id} size={56} />
              <div>
                <b>{HEROES[id].name}</b>
                <span>{HEROES[id].roles.join(' · ')}</span>
                <em>Mastery {masteryLevel(mastery[id] ?? 0)}</em>
              </div>
            </button>
          ))}
        </div>
        <div className="draft-mid panel">
          <HeroDetail id={hero} />
        </div>
        <div className="draft-side">
          <div className="panel">
            <h3>Talents — pick two</h3>
            <div className="talents">
              {TALENT_IDS.map((t) => (
                <button key={t} className={`talent ${talents.includes(t) ? 'sel' : ''}`} onClick={() => toggleTalent(t)}>
                  <TalentIcon id={t} size={38} />
                  <div>
                    <b>
                      {TALENTS[t].name}
                      {talents.includes(t) ? ` (${talents.indexOf(t) === 0 ? 'D' : 'F'})` : ''}
                    </b>
                    <span>{TALENTS[t].desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          {mode !== 'tutorial' && (
            <div className="panel opts">
              <h3>Match</h3>
              <label>
                Bot difficulty
                <div className="seg">
                  {(['easy', 'normal', 'hard'] as Difficulty[]).map((d) => (
                    <button key={d} className={difficulty === d ? 'on' : ''} onClick={() => setDifficulty(d)}>
                      {d}
                    </button>
                  ))}
                </div>
              </label>
              <label>
                Pace
                <div className="seg">
                  <button className={pace === 'quick' ? 'on' : ''} onClick={() => setPace('quick')} title="Faster gold and experience, earlier objectives, softer structures: roughly 10–16 minutes">
                    Quick
                  </button>
                  <button className={pace === 'standard' ? 'on' : ''} onClick={() => setPace('standard')} title="Brief timings: Catalysts 3:30, Colossus 9:00, roughly 18–25 minutes">
                    Standard
                  </button>
                </div>
              </label>
              <p className="hintline">Difficulty changes bot reaction time, aim and decision making — never their stats or vision.</p>
            </div>
          )}
          <button className="lockin primary" onClick={lock} disabled={talents.length !== 2}>
            {talents.length === 2 ? 'Lock In' : 'Pick two talents'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Loading({ config }: { config: MatchConfig }): ReactElement {
  const tip = useMemo(() => TIPS[config.seed % TIPS.length], [config.seed]);
  return (
    <div className="screen loading">
      <h1>The Broken Diadem</h1>
      <div className="vs">
        {[0, 1].map((t) => (
          <div key={t} className={`vs-team ${t === 0 ? 'ally' : 'enemy'}`}>
            <h3>{TEAM_NAMES[t]}</h3>
            {config.seats
              .filter((s) => s.team === t)
              .map((s, i) => (
                <div key={i} className="vs-seat">
                  <HeroIcon id={s.hero} size={64} />
                  <b>{HEROES[s.hero].name}</b>
                  <span>{s.bot ? `${s.name} (bot)` : 'You'}</span>
                </div>
              ))}
          </div>
        ))}
      </div>
      <p className="tip">Tip: {tip}</p>
      <div className="spinner" />
    </div>
  );
}

// ---- match --------------------------------------------------------------------------------------

function GameScreen({ config, onOver, onLeave }: { config: MatchConfig; onOver: (r: MatchResult) => void; onLeave: () => void }): ReactElement {
  const container = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLCanvasElement>(null);
  const minimap = useRef<HTMLCanvasElement>(null);
  const [client, setClient] = useState<GameClient | null>(null);
  const [error, setError] = useState('');
  const [lost, setLost] = useState(false);
  useEffect(() => {
    if (!container.current || !overlay.current || !minimap.current) return;
    let c: GameClient | null = null;
    try {
      c = new GameClient(container.current, overlay.current, minimap.current, config, onOver, setError);
      setClient(c);
      (window as unknown as { __crownfall?: GameClient }).__crownfall = c;
      const canvas = c.renderer.renderer.domElement;
      canvas.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        setLost(true);
      });
    } catch (err) {
      setError(String(err));
    }
    return () => {
      c?.dispose();
      setClient(null);
    };
  }, [config, onOver]);
  return (
    <div className="game" ref={container} onContextMenu={(e) => e.preventDefault()}>
      <canvas className="world-overlay" ref={overlay} />
      <Hud client={client} minimapRef={minimap} onLeave={onLeave} />
      {(error || lost) && (
        <div className="modal">
          <div className="panel pause">
            <h2>{lost ? 'Graphics context lost' : 'Something went wrong'}</h2>
            <p>{lost ? 'The browser reclaimed the WebGL context. The match cannot continue.' : error}</p>
            <button className="primary" onClick={onLeave}>
              Back to menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- results ------------------------------------------------------------------------------------

function Results({ r, again, menu }: { r: MatchResult; again: () => void; menu: () => void }): ReactElement {
  const me = r.heroes.find((h) => h.id === r.selfId);
  const won = r.winner === r.viewer;
  const xp = won ? 60 : 35;
  const score = (h: (typeof r.heroes)[number]): number => h.k * 3 + h.a * 1.5 - h.d * 1.2 + h.dmg / 900 + h.sdmg / 700 + h.obj * 1.5 + h.wards * 0.4 + h.cs / 25;
  const mvp = [...r.heroes].filter((h) => h.team === r.winner).sort((a, b) => score(b) - score(a))[0];
  const commend = (h: (typeof r.heroes)[number]): string => {
    const team = r.heroes.filter((x) => x.team === h.team);
    if (h.sdmg === Math.max(...team.map((x) => x.sdmg)) && h.sdmg > 0) return 'Siegebreaker — most structure damage';
    if (h.dmg === Math.max(...team.map((x) => x.dmg)) && h.dmg > 0) return 'Spearhead — most hero damage';
    if (h.heal === Math.max(...team.map((x) => x.heal)) && h.heal > 200) return 'Lifeline — most healing and shielding';
    if (h.wards === Math.max(...team.map((x) => x.wards)) && h.wards > 0) return 'Lamplighter — most wards placed';
    return 'Steadfast — fought to the end';
  };
  const mastery = me ? (getProfile().mastery[me.hero] ?? 0) : 0;
  return (
    <div className={`screen results ${won ? 'win' : 'lose'}`}>
      <div className="res-head">
        <h1>{won ? 'Victory' : 'Defeat'}</h1>
        <p>
          {TEAM_NAMES[r.winner]} destroyed the Crown Engine in {Math.floor(r.duration / 60)}:{String(Math.floor(r.duration % 60)).padStart(2, '0')}
        </p>
      </div>
      <div className="res-body">
        <div className="panel res-table">
          <ScoreTable heroes={r.heroes} viewer={r.viewer} selfId={r.selfId} final />
        </div>
        <div className="res-side">
          {me && (
            <div className="panel">
              <h3>Your match</h3>
              <div className="res-me">
                <HeroIcon id={me.hero} size={64} />
                <div>
                  <b>{HEROES[me.hero].name}</b>
                  <span>
                    {me.k} / {me.d} / {me.a} · {me.cs} last hits · {(me.gold / 1000).toFixed(1)}k gold
                  </span>
                  <em>{commend(me)}</em>
                </div>
              </div>
              <div className="mastery">
                <span>
                  {HEROES[me.hero].name} mastery {masteryLevel(mastery)} · +{xp} XP
                </span>
                <div className="mbar">
                  <div style={{ width: `${mastery % 100}%` }} />
                </div>
              </div>
            </div>
          )}
          {mvp && (
            <div className="panel mvp">
              <h3>Match MVP</h3>
              <div className="res-me">
                <HeroIcon id={mvp.hero} size={48} />
                <div>
                  <b>
                    {mvp.name} — {HEROES[mvp.hero].name}
                  </b>
                  <em>{commend(mvp)}</em>
                </div>
              </div>
            </div>
          )}
          <div className="panel timeline">
            <h3>Match timeline</h3>
            <ul>
              {r.timeline.map((t, i) => (
                <li key={i} className={t.team === 2 ? '' : t.team === r.viewer ? 'good' : 'bad'}>
                  <i>
                    {Math.floor(t.time / 60)}:{String(Math.floor(t.time % 60)).padStart(2, '0')}
                  </i>
                  {t.msg}
                </li>
              ))}
            </ul>
          </div>
          <div className="row">
            <button className="primary" onClick={again}>
              Play again
            </button>
            <button onClick={menu}>Main menu</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- codex / history / settings / credits -----------------------------------------------------------

function Page({ title, back, children }: { title: string; back: () => void; children: React.ReactNode }): ReactElement {
  return (
    <div className="screen page">
      <div className="draft-top">
        <button className="back" onClick={back}>
          ← Back
        </button>
        <h1>{title}</h1>
        <div />
      </div>
      <div className="page-body">{children}</div>
    </div>
  );
}

function HeroesPage({ back }: { back: () => void }): ReactElement {
  const [hero, setHero] = useState<HeroId>('brannoch');
  return (
    <Page title="Heroes" back={back}>
      <div className="codex">
        <div className="roster">
          {HERO_IDS.map((id) => (
            <button key={id} className={`hero-card ${hero === id ? 'sel' : ''}`} style={{ ['--hc' as string]: colorHex(HEROES[id].color) }} onClick={() => setHero(id)}>
              <HeroIcon id={id} size={56} />
              <div>
                <b>{HEROES[id].name}</b>
                <span>{HEROES[id].roles.join(' · ')}</span>
              </div>
            </button>
          ))}
        </div>
        <div className="panel">
          <HeroDetail id={hero} />
        </div>
      </div>
    </Page>
  );
}

function ItemsPage({ back }: { back: () => void }): ReactElement {
  return (
    <Page title="Items & Talents" back={back}>
      <h3 className="sect">Talents — choose two per match</h3>
      <div className="cards">
        {TALENT_IDS.map((t) => (
          <div key={t} className="itemcard">
            <div className="ic-head">
              <TalentIcon id={t} size={44} />
              <div>
                <b>{TALENTS[t].name}</b>
                <span>{TALENTS[t].cd}s cooldown</span>
              </div>
            </div>
            <p className="ic-passive">{TALENTS[t].desc}</p>
          </div>
        ))}
      </div>
      {(['starter', 'component', 'completed', 'boots', 'consumable'] as const).map((tier) => (
        <div key={tier}>
          <h3 className="sect">{tier === 'boots' ? 'Boot upgrades' : tier[0].toUpperCase() + tier.slice(1) + (tier === 'completed' ? ' items' : 's')}</h3>
          <div className="cards">
            {ITEM_LIST.filter((i) => i.tier === tier).map((i) => (
              <ItemCard key={i.id} def={i} />
            ))}
          </div>
        </div>
      ))}
    </Page>
  );
}

function HistoryPage({ back }: { back: () => void }): ReactElement {
  const p = getProfile();
  return (
    <Page title="Match History" back={back}>
      <div className="panel">
        <h3>Profile level {profileLevel(p)}</h3>
        <div className="mastery-row">
          {HERO_IDS.map((id) => (
            <div key={id} className="mastery-chip">
              <HeroIcon id={id} size={36} />
              <span>
                {HEROES[id].name}
                <em>Mastery {masteryLevel(p.mastery[id] ?? 0)}</em>
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="panel history">
        {!p.history.length && <p>No matches yet. Play one and it will be recorded here (stored only in this browser).</p>}
        {p.history.map((m, i) => (
          <div key={i} className={`hist-row ${m.win ? 'win' : 'lose'}`}>
            <HeroIcon id={m.hero} size={40} />
            <b>{m.win ? 'Victory' : 'Defeat'}</b>
            <span>
              {HEROES[m.hero].name} · {m.k}/{m.d}/{m.a} · {m.cs} CS
            </span>
            <span>
              {m.mode} · {m.difficulty} bots · {Math.floor(m.duration / 60)}:{String(Math.floor(m.duration % 60)).padStart(2, '0')}
            </span>
            <span className="hist-teams">
              {m.players.map((pl, k) => (
                <HeroIcon key={k} id={pl.hero} size={22} />
              ))}
            </span>
            <i>{new Date(m.date).toLocaleString()}</i>
          </div>
        ))}
      </div>
    </Page>
  );
}

function SettingsPage({ back }: { back: () => void }): ReactElement {
  const [s, setS] = useState(getSettings());
  const [rebinding, setRebinding] = useState<KeyAction | null>(null);
  const upd = (patch: Partial<typeof s>): void => {
    const n = setSettings(patch);
    setS({ ...n });
    audio.setVolumes(n.master, n.music, n.sfx);
  };
  useEffect(() => {
    if (!rebinding) return;
    const fn = (e: KeyboardEvent): void => {
      e.preventDefault();
      if (e.code !== 'Escape') upd({ keys: { ...s.keys, [rebinding]: e.code } });
      setRebinding(null);
    };
    window.addEventListener('keydown', fn, true);
    return () => window.removeEventListener('keydown', fn, true);
  });
  const toggle = (k: 'edgeScroll' | 'cameraLock' | 'screenShake' | 'damageNumbers' | 'colorblind' | 'tutorialHints', label: string, hint: string): ReactElement => (
    <label className="check" title={hint}>
      <input type="checkbox" checked={s[k]} onChange={(e) => upd({ [k]: e.target.checked })} />
      <span>
        {label}
        <em>{hint}</em>
      </span>
    </label>
  );
  const slider = (k: 'master' | 'music' | 'sfx', label: string): ReactElement => (
    <label>
      {label}
      <input type="range" min={0} max={1} step={0.05} value={s[k]} onChange={(e) => upd({ [k]: Number(e.target.value) })} />
    </label>
  );
  return (
    <Page title="Settings" back={back}>
      <div className="settings">
        <div className="panel">
          <h3>Graphics</h3>
          <label>
            Quality
            <div className="seg">
              {(['low', 'medium', 'high'] as const).map((q) => (
                <button key={q} className={s.quality === q ? 'on' : ''} onClick={() => upd({ quality: q })}>
                  {q}
                </button>
              ))}
            </div>
          </label>
          <p className="hintline">Low removes shadows and most particles but keeps every gameplay telegraph, projectile and zone.</p>
          <label>
            UI scale
            <div className="seg">
              {[1, 1.25, 1.5].map((v) => (
                <button key={v} className={s.uiScale === v ? 'on' : ''} onClick={() => upd({ uiScale: v })}>
                  {v * 100}%
                </button>
              ))}
            </div>
          </label>
          <h3>Audio</h3>
          {slider('master', 'Master')}
          {slider('music', 'Music')}
          {slider('sfx', 'Effects')}
        </div>
        <div className="panel">
          <h3>Gameplay</h3>
          <label>
            Cast mode
            <select value={s.castMode} onChange={(e) => upd({ castMode: e.target.value as typeof s.castMode })}>
              <option value="indicator">Quick cast with indicator (hold key, release to cast)</option>
              <option value="quick">Quick cast (cast instantly at the cursor)</option>
              <option value="normal">Normal cast (press key, left-click to confirm)</option>
            </select>
          </label>
          {toggle('cameraLock', 'Start with camera locked to hero', 'Toggle in a match with the camera-lock key')}
          {toggle('edgeScroll', 'Edge scrolling', 'Pan when the cursor touches a screen edge (arrow keys and middle-drag always work)')}
          {toggle('damageNumbers', 'Damage numbers', 'Aggregated floating combat text')}
          {toggle('tutorialHints', 'Tutorial hints', 'Show the checklist during Tutorial matches')}
          <h3>Accessibility</h3>
          {toggle('colorblind', 'Colourblind-safe team colours', 'Enemies and danger zones use amber instead of red')}
          {toggle('screenShake', 'Screen shake', 'Subtle shake on heavy impacts')}
          <p className="hintline">Critical events (structures, objectives, first blood, tower aggro) always have on-screen captions.</p>
        </div>
        <div className="panel keys">
          <h3>Key bindings</h3>
          {(Object.keys(KEY_LABELS) as KeyAction[]).map((k) => (
            <div key={k} className="keyrow">
              <span>{KEY_LABELS[k]}</span>
              <button className={rebinding === k ? 'on' : ''} onClick={() => setRebinding(k)}>
                {rebinding === k ? 'Press a key…' : keyName(s.keys[k])}
              </button>
            </div>
          ))}
          <button onClick={() => upd({ keys: { ...DEFAULT_KEYS } })}>Reset to defaults</button>
          <p className="hintline">Fixed: right-click move/attack, 1–6 items, Shift+ability to rank up, arrows / middle-drag to pan, wheel to zoom, Esc to pause.</p>
        </div>
      </div>
    </Page>
  );
}

function Credits({ back }: { back: () => void }): ReactElement {
  return (
    <Page title="Credits" back={back}>
      <div className="panel credits">
        <p>
          <b>Crownfall</b> is an original lane-and-objective MOBA vertical slice built in a single session for Oneshot Arcade.
        </p>
        <p>Design, code, models, effects, icons, sound and music: generated procedurally in code — there are no imported art or audio assets.</p>
        <p>Libraries: Three.js (MIT), React (MIT), Vite (MIT), TypeScript (Apache-2.0), Vitest (MIT).</p>
        <p>World, heroes, abilities, items and terminology are original to this project.</p>
      </div>
    </Page>
  );
}

// ---- root ---------------------------------------------------------------------------------------

export function App(): ReactElement {
  const [screen, setScreen] = useState<Screen>('menu');
  const [mode, setMode] = useState<MatchMode>('unranked');
  const [config, setConfig] = useState<MatchConfig | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [supported] = useState(() => webglAvailable());

  // automation hook: ?autostart=<hero>[&mode=practice] skips the shell (used for screenshots/tests)
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const h = q.get('autostart') as HeroId | null;
    if (h && HEROES[h]) {
      const m = (q.get('mode') as MatchMode) || 'unranked';
      setMode(m);
      setConfig(buildConfig(h, ['skyhop', 'mend'], m, (q.get('difficulty') as Difficulty) || 'normal', 'quick'));
      setScreen('game');
    }
  }, []);

  const start = useCallback((m: MatchMode) => {
    setMode(m);
    setScreen('draft');
  }, []);
  const onLock = useCallback((c: MatchConfig) => {
    setConfig(c);
    setScreen('loading');
    setTimeout(() => setScreen((s) => (s === 'loading' ? 'game' : s)), 2600);
  }, []);
  const onOver = useCallback((r: MatchResult) => {
    const me = r.heroes.find((h) => h.id === r.selfId);
    if (me) {
      const won = r.winner === r.viewer;
      updateProfile((p) => {
        p.mastery = { ...p.mastery, [me.hero]: (p.mastery[me.hero] ?? 0) + (won ? 60 : 35) };
        p.matches++;
        if (r.config.mode === 'tutorial') p.tutorialDone = true;
        p.history = [
          { date: new Date().toISOString(), mode: r.config.mode, hero: me.hero, win: won, duration: r.duration, k: me.k, d: me.d, a: me.a, cs: me.cs, difficulty: r.config.difficulty, players: r.heroes.map((h) => ({ hero: h.hero, name: h.name, team: h.team, k: h.k, d: h.d, a: h.a, lvl: h.lvl })) },
          ...p.history,
        ].slice(0, 30);
      });
    }
    setResult(r);
    setScreen('results');
  }, []);
  const toMenu = useCallback(() => {
    setConfig(null);
    setScreen('menu');
  }, []);

  if (!supported) {
    return (
      <div className="screen fatal">
        <Logo />
        <h2>WebGL 2 is required</h2>
        <p>Crownfall needs a browser and GPU with WebGL 2 support (current desktop Chrome, Edge or Firefox). Please enable hardware acceleration or try another browser.</p>
      </div>
    );
  }
  switch (screen) {
    case 'menu':
      return <Menu go={setScreen} start={start} />;
    case 'draft':
      return <Draft mode={mode} onLock={onLock} onBack={toMenu} />;
    case 'loading':
      return config ? <Loading config={config} /> : <Menu go={setScreen} start={start} />;
    case 'game':
      return config ? <GameScreen config={config} onOver={onOver} onLeave={toMenu} /> : <Menu go={setScreen} start={start} />;
    case 'results':
      return result ? <Results r={result} again={() => start(result.config.mode)} menu={toMenu} /> : <Menu go={setScreen} start={start} />;
    case 'heroes':
      return <HeroesPage back={toMenu} />;
    case 'items':
      return <ItemsPage back={toMenu} />;
    case 'history':
      return <HistoryPage back={toMenu} />;
    case 'settings':
      return <SettingsPage back={toMenu} />;
    case 'credits':
      return <Credits back={toMenu} />;
  }
}
