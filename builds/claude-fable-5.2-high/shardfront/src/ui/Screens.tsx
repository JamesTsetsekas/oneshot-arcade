// ui: menus, pre-match setup, tech archive, replays, credits and the post-game summary.
import { useEffect, useRef, useState } from 'react';
import { audio, openScreen, rematch, setProfileName, startReplay, startSkirmish, startSpectate, startTutorial, toMenu, watchSavedReplay } from '../app/app';
import { PALETTES } from '../app/settings';
import { ABILITY_DEFS, DEF_INDEX, ENTITY_DEFS, FACTIONS, TECH_DEFS } from '../data/defs';
import { fmtTime, requirementText, statLines } from '../data/describe';
import type { Faction } from '../data/types';
import { sanitizeLabel, type Difficulty } from '../net/protocol';
import { F_BRIDGE, F_BRUSH, F_CHASM, F_CLIFF, F_RAMP, F_ROCK, MAP_SIZE, getMap } from '../world/map';
import { SettingsPanel, ControlsHelp } from './Settings';
import { setState, useStore, type MatchResult } from './store';

const click = () => audio.ui('click');

function Frame({ title, children, wide, back = true }: { title: string; children: React.ReactNode; wide?: boolean; back?: boolean }) {
  return (
    <div className="screen">
      <div className={`panel sheet${wide ? ' wide' : ''}`}>
        <header><h2>{title}</h2>{back && <button onClick={() => { click(); openScreen('menu'); }}>Back</button>}</header>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}

export function Loading() {
  const text = useStore((s) => s.loadingText);
  const p = useStore((s) => s.loadingProgress);
  return (
    <div className="screen solid">
      <div className="loading">
        <h1 className="logo">SHARDFRONT</h1>
        <div className="loadbar"><i style={{ width: `${p * 100}%` }} /></div>
        <div className="dim">{text}…</div>
      </div>
    </div>
  );
}

export function ErrorScreen() {
  const error = useStore((s) => s.error);
  return (
    <div className="screen solid">
      <div className="panel sheet">
        <header><h2>Something went wrong</h2></header>
        <div className="sheet-body">
          <p>{error}</p>
          <div className="menu-list horizontal"><button className="primary" onClick={() => location.reload()}>Reload</button></div>
        </div>
      </div>
    </div>
  );
}

export function Menu() {
  const profile = useStore((s) => s.profile);
  const notice = useStore((s) => s.notice);
  const history = useStore((s) => s.history);
  const replays = useStore((s) => s.replays);
  const level = 1 + Math.floor((profile.xp.helix + profile.xp.chorus) / 300);
  const go = (fn: () => void) => () => { audio.init(); click(); fn(); };
  return (
    <div className="screen menu">
      <div className="menu-col">
        <h1 className="logo">SHARDFRONT</h1>
        <div className="tagline">Two factions. One fractured moon. Hold the wells.</div>
        <nav className="menu-list">
          <button className="primary" onClick={go(() => openScreen('setup'))}>Play Skirmish</button>
          <button onClick={go(() => startTutorial())}>Tutorial{profile.tutorialDone ? ' ✓' : ''}<small>guided 8-10 minute scenario</small></button>
          <button onClick={go(() => openScreen('archive'))}>Tech Archive</button>
          <button onClick={go(() => openScreen('replays'))}>Replays{replays.length ? <small>{replays.length} saved</small> : null}</button>
          <button onClick={go(() => openScreen('settings'))}>Settings</button>
          <button onClick={go(() => openScreen('credits'))}>Credits</button>
        </nav>
        {notice && <div className="notice" onClick={() => setState({ notice: '' })}>{notice}</div>}
      </div>
      <div className="panel profile">
        <div className="banner" style={{ background: `linear-gradient(135deg, hsl(${(level * 47) % 360} 70% 45%), hsl(${(level * 47 + 60) % 360} 70% 30%))` }}>{level}</div>
        <div>
          <input className="name" value={profile.name} maxLength={20} aria-label="Commander name" onChange={(e) => setProfileName(e.target.value.slice(0, 20))} onBlur={(e) => setProfileName(sanitizeLabel(e.target.value))} />
          <div className="dim small">Level {level} · {profile.wins} wins · {profile.losses} losses</div>
          <div className="dim small">Mastery: Directorate {profile.xp.helix} xp · Chorus {profile.xp.chorus} xp (cosmetic only)</div>
          {history[0] && <div className="dim small">Last match: {history[0].won ? 'Victory' : 'Defeat'} as {FACTIONS[history[0].faction].name} · {fmtTime(history[0].durationTicks)}</div>}
        </div>
      </div>
      <div className="foot dim small">Vertical slice · local play versus AI · no accounts, no telemetry</div>
    </div>
  );
}

function MapPreview() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const map = getMap();
    cv.width = MAP_SIZE; cv.height = MAP_SIZE;
    const ctx = cv.getContext('2d') as CanvasRenderingContext2D;
    const img = ctx.createImageData(MAP_SIZE, MAP_SIZE);
    for (let i = 0; i < MAP_SIZE * MAP_SIZE; i++) {
      const f = map.flags[i], e = map.elev[i];
      let c = [52, 60, 74];
      if (f & F_ROCK) c = [22, 25, 32]; else if (f & F_CLIFF) c = [30, 34, 42]; else if (f & F_CHASM) c = [14, 110, 112]; else if (f & F_BRIDGE) c = [150, 160, 175];
      else if (f & F_RAMP) c = [96, 102, 116]; else if (f & F_BRUSH) c = [74, 62, 120]; else if (e === 2) c = [118, 122, 130]; else if (e === 0) c = [36, 52, 60];
      img.data.set([c[0], c[1], c[2], 255], i * 4);
    }
    ctx.putImageData(img, 0, 0);
    for (const r of map.resources) { ctx.fillStyle = r.kind === 'ore' ? '#35e0d0' : '#d8ff5a'; ctx.fillRect(r.x - 1, r.z - 1, 2, 2); }
    for (const p of map.pylons) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x, p.z, 2.2, 0, 6.3); ctx.fill(); }
    const pal = PALETTES.default;
    map.starts.forEach((s, i) => { ctx.fillStyle = '#' + (i === 0 ? pal.self : pal.enemy).toString(16); ctx.fillRect(s.x - 4, s.z - 4, 8, 8); });
  }, []);
  return <canvas ref={ref} className="map-preview" />;
}

const DIFF_TEXT: Record<Difficulty, string> = {
  easy: 'Slow decisions, small economy, no scouting, never retreats. Good for learning a faction.',
  normal: 'Scouts before countering, expands, techs, retreats from bad fights. A fair fight.',
  hard: 'Twice the decision speed, bigger economy, harassment squads and tighter reinforcement. No resource or vision cheats.',
};

export function Setup() {
  const [faction, setFaction] = useState<Faction>('helix');
  const [enemy, setEnemy] = useState<Faction | 'random'>('random');
  const [diff, setDiff] = useState<Difficulty>('normal');
  const icons = useStore((s) => s.icons);
  return (
    <Frame title="Skirmish" wide>
      <div className="setup">
        <div className="factions">
          {(Object.keys(FACTIONS) as Faction[]).map((f) => {
            const info = FACTIONS[f];
            return (
              <button key={f} className={`faction-card ${f}${faction === f ? ' on' : ''}`} onClick={() => { click(); setFaction(f); }} aria-pressed={faction === f}>
                <div className="fc-art">{[info.hq, info.worker, ...ENTITY_DEFS.filter((d) => d.faction === f && d.cls === 'unit' && !d.worker && !d.scout).slice(0, 3).map((d) => d.id)].map((id) => icons[id] ? <img key={id} src={icons[id]} alt="" /> : null)}</div>
                <h3>{info.name}</h3>
                <div className="fc-tag">{info.tagline}</div>
                <p>{info.blurb}</p>
                <ul>{info.traits.map((t) => <li key={t}>{t}</li>)}</ul>
              </button>
            );
          })}
        </div>
        <div className="setup-side">
          <h4>Map - Glass Ravine</h4>
          <MapPreview />
          <p className="dim small">Two protected mains, natural expansions behind a choke, two bridges, a low basin route, crystal barriers and two Watch Pylons. You start bottom-left.</p>
          <h4>Opponent</h4>
          <div className="seg">{(['random', 'helix', 'chorus'] as const).map((e) => <button key={e} className={enemy === e ? 'on' : ''} onClick={() => { click(); setEnemy(e); }}>{e === 'random' ? 'Random' : FACTIONS[e].name.split(' ')[0]}</button>)}</div>
          <h4>Difficulty</h4>
          <div className="seg">{(['easy', 'normal', 'hard'] as Difficulty[]).map((d) => <button key={d} className={diff === d ? 'on' : ''} onClick={() => { click(); setDiff(d); }}>{d}</button>)}</div>
          <p className="dim small">{DIFF_TEXT[diff]}</p>
          <div className="menu-list">
            <button className="primary" onClick={() => { audio.init(); click(); startSkirmish(faction, enemy, diff); }}>Start match</button>
            <button onClick={() => { audio.init(); click(); startSpectate(faction, enemy, diff); }}>Spectate AI vs AI<small>watch this matchup play itself</small></button>
          </div>
        </div>
      </div>
    </Frame>
  );
}

export function Archive() {
  const [f, setF] = useState<Faction>('helix');
  const icons = useStore((s) => s.icons);
  const defs = ENTITY_DEFS.filter((d) => d.faction === f);
  const section = (title: string, list: typeof defs) => (
    <>
      <h4>{title}</h4>
      <div className="arch-grid">
        {list.map((d) => (
          <div className="arch-item" key={d.id}>
            <div className="arch-icon">{icons[d.id] ? <img src={icons[d.id]} alt="" /> : null}</div>
            <div>
              <b>{d.name}</b>
              <span className="cost"><span className="res ore"><i />{d.ore}</span>{d.flux ? <span className="res flux"><i />{d.flux}</span> : null}{d.supply ? <span className="res sup"><i />{d.supply}</span> : null}<span className="res time">{d.buildTime}s</span></span>
              <p>{d.role}</p>
              {statLines(d).map((l) => <div className="dim small" key={l}>{l}</div>)}
              {d.tags.length > 0 && <div className="tags">{d.tags.map((t) => <span key={t}>{t}</span>)}</div>}
              {d.counters && <div className="small counters">{d.counters}</div>}
              {requirementText(d) && <div className="dim small">{requirementText(d)}</div>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
  return (
    <Frame title="Tech Archive" wide>
      <div className="seg">{(Object.keys(FACTIONS) as Faction[]).map((x) => <button key={x} className={f === x ? 'on' : ''} onClick={() => { click(); setF(x); }}>{FACTIONS[x].name}</button>)}</div>
      <p className="dim">{FACTIONS[f].blurb} {FACTIONS[f].traits.join('. ')}.</p>
      {section('Units', defs.filter((d) => d.cls === 'unit'))}
      {section('Structures', defs.filter((d) => d.cls === 'structure'))}
      <h4>Research ({ENTITY_DEFS[DEF_INDEX[FACTIONS[f].tech]].name})</h4>
      <div className="arch-grid">
        {TECH_DEFS.filter((t) => t.faction === f).map((t) => (
          <div className="arch-item slim" key={t.id}><div><b>{t.name}</b><span className="cost"><span className="res ore"><i />{t.ore}</span><span className="res flux"><i />{t.flux}</span><span className="res time">{t.time}s</span></span><p>{t.desc}</p></div></div>
        ))}
      </div>
      <h4>Shared rules</h4>
      <ul className="rules">
        <li>Damage bonuses are flat additions against the listed tags; armor subtracts from every hit (minimum 1).</li>
        <li>High ground grants +2 sight and hides units from below. Brush blocks vision but not movement.</li>
        <li>Stand a unit beside a Watch Pylon for 3 seconds to capture it and gain vision of the lane.</li>
        <li>After 18:00 wells yield 15% more per trip and the ravine core reveals the whole map every 90 seconds.</li>
        <li>Abilities: {ABILITY_DEFS.map((a) => a.name).join(', ')}.</li>
      </ul>
    </Frame>
  );
}

export function Replays() {
  const replays = useStore((s) => s.replays);
  const history = useStore((s) => s.history);
  return (
    <Frame title="Replays">
      {replays.length === 0 ? <p className="dim">No replays yet. Finish a skirmish and it is recorded here automatically (last six matches).</p> : (
        <div className="list">
          {replays.map((r) => (
            <div className="row" key={r.id}><span>{r.label}</span><em>{new Date(r.date).toLocaleString()}</em><button onClick={() => { click(); void watchSavedReplay(r.id); }}>Watch</button></div>
          ))}
        </div>
      )}
      <p className="dim small">Replays store the match seed and the validated command stream, then re-simulate. Periodic state hashes are checked during playback.</p>
      <h4>Match history</h4>
      {history.length === 0 ? <p className="dim">No matches played yet.</p> : (
        <div className="list">
          {history.slice(0, 12).map((h) => <div className="row" key={h.id}><span className={h.won ? 'good' : 'bad'}>{h.won ? 'Victory' : 'Defeat'}</span><span>{h.mode === 'tutorial' ? 'Tutorial' : `${FACTIONS[h.faction].name} vs ${FACTIONS[h.enemy].name} (${h.difficulty})`}</span><em>{fmtTime(h.durationTicks)}</em></div>)}
        </div>
      )}
    </Frame>
  );
}

export function SettingsScreen() { return <Frame title="Settings" wide><SettingsPanel /><h4>Controls</h4><ControlsHelp /></Frame>; }

export function Credits() {
  return (
    <Frame title="Credits">
      <p><b>Shardfront</b> - an original browser RTS vertical slice built for Oneshot Arcade.</p>
      <p>Design, simulation, rendering, interface, models, effects and audio were all produced in a single unattended session by Claude (Fable 5.2, Claude Code). Every model is assembled procedurally from primitives at load time and every sound is synthesised with the Web Audio API; no external art, audio, fonts or game data are used.</p>
      <p className="dim">Built with TypeScript, Three.js (MIT), React (MIT) and Vite (MIT). See ASSETS.md for the full manifest.</p>
    </Frame>
  );
}

// ---------------------------------------------------------------------- post-game
function Graph({ result, field, label }: { result: MatchResult; field: 'army' | 'income' | 'workers'; label: string }) {
  const W = 420, H = 130;
  const series = result.stats.map((st) => st.samples.map((s) => ({ t: s.t, v: s[field] })));
  const maxT = Math.max(1, result.durationTicks);
  const maxV = Math.max(1, ...series.flat().map((p) => p.v));
  const pal = PALETTES[useStore((s) => s.settings.palette)];
  const col = (i: number) => '#' + (i === result.localPlayer ? pal.self : pal.enemy).toString(16).padStart(6, '0');
  return (
    <div className="graph">
      <div className="graph-title">{label}<em>peak {Math.round(maxV)}</em></div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {[0.25, 0.5, 0.75].map((g) => <line key={g} x1="0" x2={W} y1={H * g} y2={H * g} stroke="rgba(255,255,255,0.07)" />)}
        {series.map((pts, i) => <polyline key={i} fill="none" stroke={col(i)} strokeWidth="2" points={pts.map((p) => `${(p.t / maxT) * W},${H - 4 - (p.v / maxV) * (H - 10)}`).join(' ')} />)}
      </svg>
    </div>
  );
}

export function PostGame() {
  const result = useStore((s) => s.result);
  if (!result) return null;
  const me = result.localPlayer;
  const won = result.winner === me;
  const isReplay = result.mode === 'replay';
  const spectate = result.config.players[0].controller === 'ai' && !isReplay;
  const title = isReplay ? 'Replay finished' : spectate ? `${result.config.players[result.winner]?.name ?? 'Nobody'} wins` : result.winner < 0 ? 'Match ended' : won ? 'Victory' : 'Defeat';
  const events = result.stats.flatMap((st, i) => st.timeline.map((e) => ({ ...e, p: i }))).sort((a, b) => a.t - b.t).slice(0, 40);
  const rows: [string, (i: number) => string | number][] = [
    ['Prism Ore collected', (i) => Math.round(result.stats[i].oreCollected)],
    ['Flux collected', (i) => Math.round(result.stats[i].fluxCollected)],
    ['Units created', (i) => result.stats[i].unitsCreated],
    ['Units lost', (i) => result.stats[i].unitsLost],
    ['Units destroyed', (i) => result.stats[i].unitsKilled],
    ['Structures built', (i) => result.stats[i].structuresBuilt],
    ['Structures lost', (i) => result.stats[i].structuresLost],
    ['First expansion', (i) => (result.stats[i].firstExpansionTick >= 0 ? fmtTime(result.stats[i].firstExpansionTick) : '-')],
    ['Peak army value', (i) => Math.max(0, ...result.stats[i].samples.map((s) => s.army))],
    ['Commands issued', (i) => result.stats[i].commands],
  ];
  return (
    <div className="screen">
      <div className="panel sheet wide postgame">
        <header>
          <h2 className={won && !isReplay && !spectate ? 'victory' : isReplay || spectate ? '' : 'defeat'}>{title}</h2>
          <span className="dim">{result.config.mode === 'tutorial' ? 'Tutorial' : 'Skirmish'} · Glass Ravine · {fmtTime(result.durationTicks)}</span>
        </header>
        <div className="sheet-body">
          {result.config.mode === 'tutorial' && won && <p className="notice">Tutorial complete - badge earned. You have used every core tool: selection, economy, production, control groups, abilities, attack-move and a headquarters kill.</p>}
          {result.replayVerified !== null && <p className={result.replayVerified ? 'notice' : 'notice bad'}>{result.replayVerified ? 'Replay verified: every periodic state hash and the outcome matched the original match.' : 'Replay diverged from the recorded hashes (different build or browser).'}</p>}
          <div className="pg-grid">
            <table>
              <thead><tr><th /><th>{result.config.players[0].name}<small>{FACTIONS[result.config.players[0].faction].name}</small></th><th>{result.config.players[1].name}<small>{FACTIONS[result.config.players[1].faction].name}</small></th></tr></thead>
              <tbody>{rows.map(([l, fn]) => <tr key={l}><td>{l}</td><td>{fn(0)}</td><td>{fn(1)}</td></tr>)}</tbody>
            </table>
            <div className="graphs">
              <Graph result={result} field="army" label="Army value over time" />
              <Graph result={result} field="income" label="Resources collected" />
              <Graph result={result} field="workers" label="Workers" />
            </div>
            <div className="timeline">
              <h4>Timeline</h4>
              {events.length === 0 && <div className="dim small">No major events recorded.</div>}
              {events.map((e, i) => <div key={i} className={`tl p${e.p === me ? 'self' : 'enemy'}`}><em>{fmtTime(e.t)}</em>{result.config.players[e.p].name}: {e.text}</div>)}
            </div>
          </div>
          <div className="menu-list horizontal">
            {!isReplay && !spectate && <button className="primary" onClick={() => { click(); rematch(); }}>{result.config.mode === 'tutorial' ? 'Replay tutorial' : 'Rematch'}</button>}
            {result.replay && result.config.mode === 'skirmish' && <button onClick={() => { click(); startReplay(result.replay as NonNullable<MatchResult['replay']>); }}>Watch replay</button>}
            <button onClick={() => { click(); toMenu(); openScreen('setup'); }}>New match</button>
            <button onClick={() => { click(); toMenu(); }}>Main menu</button>
          </div>
        </div>
      </div>
    </div>
  );
}
