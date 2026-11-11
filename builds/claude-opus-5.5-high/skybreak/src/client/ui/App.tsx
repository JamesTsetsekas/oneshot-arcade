import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { GameSession, SessionOptions } from '../game';
import { Hud, fmtTime, rarityColor } from './Hud';
import { FullMap, Inventory } from './Overlays';
import { useHud } from './store';
import { audio } from '../audio/audio';
import {
  getSettings, updateSettings, applyPreset, subscribeSettings, ACTION_LABELS, Action, keyName, DEFAULT_KEYS,
  getProfile, updateProfile, masteryLevel, xpForMatch, BODY_NAMES, GLIDER_SKINS, GLIDER_UNLOCK, Settings,
} from '../settings';
import type { MatchResult } from '../../shared/protocol/messages';
import type { MatchPace } from '../../shared/content/rules';
import { islandImage, toMap } from './mapdraw';
import { RARITIES } from '../../shared/content/rarity';

type Screen =
  | { s: 'menu' }
  | { s: 'game'; opts: SessionOptions }
  | { s: 'results'; r: MatchResult; opts: SessionOptions; xp: number }
  | { s: 'settings'; back: Screen }
  | { s: 'career' }
  | { s: 'credits' }
  | { s: 'error'; msg: string };

const useSettings = () => useSyncExternalStore(subscribeSettings, getSettings);
const useProfile = () => useSyncExternalStore(subscribeSettings, getProfile);

export function App({ webgl2 }: { webgl2: boolean }) {
  const autoplay = new URLSearchParams(location.search).get('autoplay');
  const [screen, setScreen] = useState<Screen>(!webgl2 ? { s: 'error', msg: 'Skybreak needs WebGL 2. Your browser or GPU does not expose it. Try an up-to-date Chrome, Edge or Firefox with hardware acceleration enabled.' }
    : autoplay ? { s: 'game', opts: { mode: autoplay === 'practice' ? 'practice' : 'solo', pace: 'short', seed: Number(new URLSearchParams(location.search).get('seed') ?? 7), autopilot: true, staging: 2 } } : { s: 'menu' });
  useEffect(() => {
    const unlock = () => { audio.ensure(); if (screen.s === 'menu') audio.playMusic('menu'); };
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, [screen.s]);
  useEffect(() => { if (screen.s === 'menu' || screen.s === 'results' || screen.s === 'career') { if (audio.ctx) audio.playMusic('menu'); } }, [screen.s]);

  const startGame = (mode: 'solo' | 'practice', pace: MatchPace) => {
    audio.ensure();
    setScreen({ s: 'game', opts: { mode, pace, seed: (Date.now() ^ Math.floor(performance.now() * 1000)) >>> 0 } });
  };

  switch (screen.s) {
    case 'menu': return <Menu onPlay={startGame} go={setScreen} />;
    case 'game': return (
      <GameScreen key={screen.opts.seed} opts={screen.opts}
        onEnd={(r) => {
          if (screen.opts.mode === 'practice') { setScreen({ s: 'menu' }); return; }
          const xp = xpForMatch(r.placement, r.total, r.kills, r.damage);
          const p = getProfile();
          updateProfile({
            xp: p.xp + xp, matches: p.matches + 1, wins: p.wins + (r.youWon ? 1 : 0), top5: p.top5 + (r.placement <= 5 ? 1 : 0),
            kills: p.kills + r.kills, damage: p.damage + r.damage, bestPlacement: p.bestPlacement ? Math.min(p.bestPlacement, r.placement) : r.placement,
            history: [{ date: new Date().toISOString().slice(0, 10), placement: r.placement, kills: r.kills, damage: r.damage }, ...p.history].slice(0, 12),
          });
          setScreen({ s: 'results', r, opts: screen.opts, xp });
        }}
        onError={(msg) => setScreen({ s: 'error', msg })}
        onMenu={() => setScreen({ s: 'menu' })} />
    );
    case 'results': return <Results r={screen.r} xp={screen.xp} onRequeue={() => startGame('solo', screen.opts.pace)} onMenu={() => setScreen({ s: 'menu' })} />;
    case 'settings': return <div className="screen menu-bg"><SettingsPanel onClose={() => setScreen(screen.back)} /></div>;
    case 'career': return <Career onBack={() => setScreen({ s: 'menu' })} />;
    case 'credits': return <Credits onBack={() => setScreen({ s: 'menu' })} />;
    case 'error': return <ErrorScreen msg={screen.msg} onBack={webgl2 ? () => setScreen({ s: 'menu' }) : undefined} />;
  }
}

function Logo() {
  return (
    <div className="logo">
      <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden>
        <path d="M32 4 L56 30 L40 30 L46 60 L18 26 L32 26 Z" fill="#7cffd4" stroke="#0b3a40" strokeWidth="2" />
      </svg>
      <div>
        <h1>SKYBREAK</h1>
        <div className="tag">Drop · Loot · Rotate · Survive — no building, all movement</div>
      </div>
    </div>
  );
}

function Menu({ onPlay, go }: { onPlay: (m: 'solo' | 'practice', p: MatchPace) => void; go: (s: Screen) => void }) {
  const [pace, setPace] = useState<MatchPace>('standard');
  const prof = useProfile();
  return (
    <div className="screen menu-bg">
      <div className="fracture" />
      <div className="menu">
        <Logo />
        <div className="menu-cols">
          <div className="menu-buttons">
            <button className="primary big" onClick={() => onPlay('solo', pace)}>Quick Drop <small>Solo · 24 players (bots fill seats)</small></button>
            <div className="pace">
              <span>Match length</span>
              <button className={pace === 'standard' ? 'on' : ''} onClick={() => setPace('standard')}>Standard ~15 min</button>
              <button className={pace === 'short' ? 'on' : ''} onClick={() => setPace('short')}>Short ~8 min</button>
            </div>
            <button className="big" onClick={() => onPlay('practice', 'standard')}>Practice Range <small>All weapons, items, movement course, target bots</small></button>
            <button onClick={() => go({ s: 'career' })}>Career & Appearance</button>
            <button onClick={() => go({ s: 'settings', back: { s: 'menu' } })}>Settings</button>
            <button onClick={() => go({ s: 'credits' })}>Credits</button>
          </div>
          <div className="menu-info">
            <div className="card">
              <div className="b-title">{prof.name} · Mastery {masteryLevel(prof.xp)}</div>
              <div className="dim">{prof.matches} matches · {prof.wins} wins · {prof.kills} eliminations</div>
              <div className="dim">{BODY_NAMES[prof.body]} · {GLIDER_SKINS[prof.glider].name} wing-sail</div>
            </div>
            <div className="card">
              <div className="b-title">The Highwake</div>
              <div className="dim">An island lifted into a permanent atmospheric fracture. Jump from the transit skiff, glide on wing-sails, scavenge resonance chests, and stay inside the shrinking Calmfield as the Riftstorm closes. Last one standing wins.</div>
            </div>
            <div className="card keys">
              <div className="b-title">Controls</div>
              <div className="dim">WASD move · Mouse aim · LMB fire · RMB aim · Shift sprint · Ctrl crouch/slide · Space jump/mantle/zipline · E interact (hold to swap) · R reload · F melee · 1–5 / wheel slots · G throw · X shoulder · Z wing-sail · Tab inventory · M map · MMB marker · Esc menu</div>
            </div>
          </div>
        </div>
        <div className="foot dim">Local single-player build · authoritative 30Hz simulation runs in your browser · no accounts, no telemetry</div>
      </div>
    </div>
  );
}

function GameScreen({ opts, onEnd, onError, onMenu }: { opts: SessionOptions; onEnd: (r: MatchResult) => void; onError: (m: string) => void; onMenu: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [session, setSession] = useState<GameSession | null>(null);
  const [loading, setLoading] = useState<{ label: string; k: number }>({ label: 'Contacting matchmaker (local)', k: 0 });
  const [ready, setReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [t0] = useState(() => performance.now());
  const [, force] = useState(0);
  const cancelled = useRef(false);
  useEffect(() => {
    const id = setInterval(() => force((x) => x + 1), 500);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const c = canvasRef.current!;
    const s = new GameSession(c, opts);
    let alive = true;
    s.onEnd = (r) => onEnd(r);
    s.onError = (m) => onError(m);
    s.init((label, k) => { if (alive) setLoading({ label, k }); }).then(() => {
      if (!alive || cancelled.current) return;
      setSession(s);
      setReady(true);
      s.start();
    }).catch((e: Error) => {
      if (!alive) return;
      onError(e.message === 'WEBGL2' ? 'Skybreak needs WebGL 2, which this browser/GPU does not provide.' : `Failed to load the match: ${e.message}`);
    });
    return () => { alive = false; s.dispose(); };
  }, []);
  const hud = session ? <SessionUI session={session} onMenu={onMenu} settingsOpen={settingsOpen} setSettingsOpen={setSettingsOpen} /> : null;
  return (
    <div className="screen game">
      <canvas ref={canvasRef} className="game-canvas" onClick={() => { if (session && session.hud.state.overlay === 'none' && !settingsOpen) { session.input.requestLock(); session.setPaused(false); } }} />
      {!ready && (
        <div className="loading menu-bg">
          <Logo />
          <div className="queue">
            <div className="b-title">{opts.mode === 'solo' ? 'Quick Drop · Solo' : 'Practice Range'}</div>
            <div className="dim">Region: local (offline) · ping 0 ms · elapsed {((performance.now() - t0) / 1000).toFixed(0)}s</div>
            <div className="prog"><i style={{ width: `${loading.k * 100}%` }} /></div>
            <div className="dim">{loading.label} <span className="req">required</span></div>
            <button onClick={() => { cancelled.current = true; onMenu(); }}>Cancel</button>
          </div>
        </div>
      )}
      {hud}
    </div>
  );
}

function SessionUI({ session, onMenu, settingsOpen, setSettingsOpen }: { session: GameSession; onMenu: () => void; settingsOpen: boolean; setSettingsOpen: (b: boolean) => void }) {
  const st = useHud(session.hud);
  const snap = st.snap;
  // pause the local sim while the pause menu is open (not while dead/spectating)
  const pausedUi = !session.opts.autopilot && !st.locked && st.overlay === 'none' && !!snap?.you.alive && !st.winner;
  useEffect(() => { session.setPaused(pausedUi || settingsOpen); }, [pausedUi, settingsOpen]);
  const leave = () => {
    if (!snap) return;
    if (snap.mode === 'practice') { onMenu(); return; }
    session.finish();
  };
  return (
    <>
      <Hud session={session} onLeave={leave} onResume={() => { session.input.requestLock(); session.setPaused(false); }} onSettings={() => setSettingsOpen(true)} />
      {st.overlay === 'map' && <FullMap session={session} />}
      {st.overlay === 'inventory' && <Inventory session={session} />}
      {settingsOpen && <div className="overlay"><SettingsPanel onClose={() => setSettingsOpen(false)} /></div>}
    </>
  );
}

// ---------------------------------------------------------------- results
function Results({ r, xp, onRequeue, onMenu }: { r: MatchResult; xp: number; onRequeue: () => void; onMenu: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const g = c.getContext('2d')!;
    g.drawImage(islandImage(), 0, 0, c.width, c.height);
    g.strokeStyle = '#7cffd4'; g.lineWidth = 3;
    g.beginPath();
    r.route.forEach(([x, z], i) => { const p = toMap(x, z, c.width); if (i === 0) g.moveTo(p.x, p.y); else g.lineTo(p.x, p.y); });
    g.stroke();
    if (r.route.length) {
      const a = toMap(r.route[0][0], r.route[0][1], c.width), b = toMap(r.route[r.route.length - 1][0], r.route[r.route.length - 1][1], c.width);
      g.fillStyle = '#ffd23d'; g.beginPath(); g.arc(a.x, a.y, 6, 0, 7); g.fill();
      g.fillStyle = r.youWon ? '#7cffd4' : '#ff4d6d'; g.beginPath(); g.arc(b.x, b.y, 6, 0, 7); g.fill();
    }
  }, []);
  const acc = r.shots ? Math.round((r.hits / r.shots) * 100) : 0;
  return (
    <div className="screen menu-bg results">
      <div className="res-head">
        <div className={`place ${r.youWon ? 'won' : ''}`}>#{r.placement}<small>/{r.total}</small></div>
        <div>
          <h1>{r.youWon ? 'Last one standing!' : r.placement <= 5 ? 'Top five finish' : 'Eliminated'}</h1>
          <div className="dim">Winner: <b>{r.winner}</b>{r.deathCause && !r.youWon ? ` · You were eliminated by ${r.deathCause}` : ''}</div>
          <div className="dim small">Mastery +{xp} XP (cosmetic progression only) · seed {r.seed} · {r.ruleset} · manifest {r.manifest}</div>
        </div>
      </div>
      <div className="res-grid">
        <div className="card stats">
          <Stat l="Eliminations" v={r.kills} /><Stat l="Assists" v={r.assists} /><Stat l="Damage dealt" v={r.damage} />
          <Stat l="Accuracy" v={`${acc}%`} sub={`${r.hits}/${r.shots}`} /><Stat l="Survived" v={fmtTime(r.survival)} /><Stat l="Travelled" v={`${(r.distance / 1000).toFixed(2)} km`} />
          <Stat l="Storm damage" v={r.stormDamage} /><Stat l="Healed" v={r.healed} />
        </div>
        <div className="card">
          <div className="b-title">Route</div>
          <canvas ref={ref} width={300} height={300} className="route" />
        </div>
        <div className="card scroll">
          <div className="b-title">Timeline</div>
          {r.timeline.map((t, i) => <div key={i} className="tl"><span className="dim">{fmtTime(t.t)}</span> {t.text}</div>)}
        </div>
        <div className="card scroll">
          <div className="b-title">Loot history</div>
          {r.loot.length === 0 && <div className="dim">Nothing picked up.</div>}
          {r.loot.map((l, i) => <div key={i} className="tl"><span className="dim">{fmtTime(l.t)}</span> <span style={{ color: l.rarity ? rarityColor(l.rarity) : undefined }}>{l.rarity ? RARITIES[l.rarity].glyph + ' ' : ''}{l.label}</span></div>)}
        </div>
      </div>
      <div className="res-actions">
        <button className="primary big" onClick={onRequeue}>Requeue Quick Drop</button>
        <button className="big" onClick={onMenu}>Main menu</button>
      </div>
    </div>
  );
}
const Stat = ({ l, v, sub }: { l: string; v: string | number; sub?: string }) => <div className="stat"><b>{v}</b><span>{l}</span>{sub && <small className="dim">{sub}</small>}</div>;

// ---------------------------------------------------------------- settings
export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const s = useSettings();
  const [tab, setTab] = useState<'graphics' | 'controls' | 'audio' | 'access'>('graphics');
  const [binding, setBinding] = useState<Action | null>(null);
  useEffect(() => {
    if (!binding) return;
    const h = (e: KeyboardEvent) => {
      e.preventDefault(); e.stopPropagation();
      if (e.code !== 'Escape') updateSettings({ keys: { ...getSettings().keys, [binding]: e.code } });
      setBinding(null);
    };
    window.addEventListener('keydown', h, true);
    return () => window.removeEventListener('keydown', h, true);
  }, [binding]);
  const set = (p: Partial<Settings>) => { updateSettings(p); audio.applyVolumes(); };
  const Toggle = ({ k, label }: { k: keyof Settings; label: string }) => (
    <label className="opt"><span>{label}</span><input type="checkbox" checked={!!s[k]} onChange={(e) => set({ [k]: e.target.checked } as Partial<Settings>)} /></label>
  );
  const Slider = ({ k, label, min, max, step, fmt }: { k: keyof Settings; label: string; min: number; max: number; step: number; fmt?: (v: number) => string }) => (
    <label className="opt"><span>{label}</span><input type="range" min={min} max={max} step={step} value={s[k] as number} onChange={(e) => set({ [k]: Number(e.target.value) } as Partial<Settings>)} /><b>{fmt ? fmt(s[k] as number) : String(s[k])}</b></label>
  );
  const Choice = <T extends string>({ k, label, opts }: { k: keyof Settings; label: string; opts: T[] }) => (
    <div className="opt"><span>{label}</span><div className="seg">{opts.map((o) => <button key={o} className={s[k] === o ? 'on' : ''} onClick={() => set({ [k]: o } as Partial<Settings>)}>{o}</button>)}</div></div>
  );
  return (
    <div className="settings card">
      <div className="ov-head"><h2>Settings</h2><button onClick={onClose}>Done</button></div>
      <div className="tabs">{(['graphics', 'controls', 'audio', 'access'] as const).map((t) => <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{{ graphics: 'Graphics', controls: 'Controls', audio: 'Audio', access: 'Accessibility' }[t]}</button>)}</div>
      {tab === 'graphics' && <div className="opts">
        <div className="opt"><span>Preset</span><div className="seg">{(['low', 'medium', 'high'] as const).map((p) => <button key={p} className={s.preset === p ? 'on' : ''} onClick={() => applyPreset(p)}>{p}</button>)}</div></div>
        <Slider k="renderScale" label="Render scale" min={0.5} max={1} step={0.05} fmt={(v) => `${Math.round(v * 100)}%`} />
        <Toggle k="dynamicRes" label="Dynamic resolution (targets 60 fps)" />
        <Choice k="shadows" label="Shadows" opts={['off', 'low', 'high']} />
        <Slider k="viewDistance" label="View distance" min={400} max={1500} step={50} fmt={(v) => `${v} m`} />
        <Choice k="foliage" label="Decorative foliage (restart match)" opts={['low', 'high']} />
        <Choice k="effects" label="Effects" opts={['low', 'high']} />
        <Toggle k="fxaa" label="Anti-aliasing (FXAA)" />
        <Toggle k="showFps" label="Show FPS" />
        <div className="dim small">Smoke, storm, cover and gameplay foliage are identical on every preset.</div>
      </div>}
      {tab === 'controls' && <div className="opts">
        <Slider k="fov" label="Field of view (horizontal)" min={80} max={105} step={1} fmt={(v) => `${v}°`} />
        <Slider k="sens" label="Mouse sensitivity" min={0.2} max={3} step={0.05} fmt={(v) => v.toFixed(2)} />
        <Slider k="adsSens" label="Aim (scoped) sensitivity" min={0.2} max={1.5} step={0.05} fmt={(v) => v.toFixed(2)} />
        <Toggle k="invertY" label="Invert Y" />
        <Toggle k="adsToggle" label="Toggle aim (instead of hold)" />
        <Toggle k="crouchToggle" label="Toggle crouch" />
        <Toggle k="sprintToggle" label="Toggle sprint" />
        <div className="binds">
          {(Object.keys(ACTION_LABELS) as Action[]).map((a) => (
            <div key={a} className="bind"><span>{ACTION_LABELS[a]}</span><button className={binding === a ? 'on' : ''} onClick={() => setBinding(a)}>{binding === a ? 'Press a key…' : keyName(s.keys[a])}</button></div>
          ))}
          <div className="bind"><span>Fire / Aim / Marker</span><span className="dim">LMB / RMB / MMB</span></div>
        </div>
        <button onClick={() => updateSettings({ keys: { ...DEFAULT_KEYS } })}>Reset key bindings</button>
      </div>}
      {tab === 'audio' && <div className="opts">
        <Slider k="masterVol" label="Master" min={0} max={1} step={0.05} fmt={(v) => `${Math.round(v * 100)}`} />
        <Slider k="musicVol" label="Music" min={0} max={1} step={0.05} fmt={(v) => `${Math.round(v * 100)}`} />
        <Slider k="sfxVol" label="Effects" min={0} max={1} step={0.05} fmt={(v) => `${Math.round(v * 100)}`} />
      </div>}
      {tab === 'access' && <div className="opts">
        <Toggle k="soundViz" label="Visual sound indicators (broad direction only)" />
        <Toggle k="captions" label="Captions for gameplay sounds" />
        <Toggle k="colorblind" label="Colour-blind rarity palette (shapes always shown)" />
        <Toggle k="reducedMotion" label="Reduced motion (no camera shake / sprint FOV)" />
        <Toggle k="photosensitive" label="Photosensitivity mode (no muzzle flashes)" />
      </div>}
    </div>
  );
}

// ---------------------------------------------------------------- career
function Career({ onBack }: { onBack: () => void }) {
  const p = useProfile();
  const lvl = masteryLevel(p.xp);
  const next = Math.pow(lvl, 2) * 120;
  return (
    <div className="screen menu-bg">
      <div className="career">
        <div className="ov-head"><h2>Career & Appearance</h2><button onClick={onBack}>Back</button></div>
        <div className="res-grid">
          <div className="card stats">
            <Stat l="Mastery level" v={lvl} sub={`${p.xp} / ${next} XP`} /><Stat l="Matches" v={p.matches} /><Stat l="Wins" v={p.wins} />
            <Stat l="Top 5" v={p.top5} /><Stat l="Eliminations" v={p.kills} /><Stat l="Best placement" v={p.bestPlacement ? `#${p.bestPlacement}` : '—'} />
          </div>
          <div className="card">
            <div className="b-title">Name</div>
            <input className="name" maxLength={16} value={p.name} onChange={(e) => updateProfile({ name: e.target.value.replace(/[^\w \-]/g, '') || 'Guest' })} />
            <div className="b-title">Outfit (shared hitbox family)</div>
            <div className="seg">{BODY_NAMES.map((n, i) => <button key={n} className={p.body === i ? 'on' : ''} onClick={() => updateProfile({ body: i })}>{n}</button>)}</div>
            <div className="b-title">Wing-sail</div>
            <div className="gliders">{GLIDER_SKINS.map((g, i) => {
              const locked = lvl < GLIDER_UNLOCK[i];
              return <button key={g.name} disabled={locked} className={p.glider === i ? 'on' : ''} onClick={() => updateProfile({ glider: i })}><i style={{ background: g.color, borderColor: g.accent }} />{g.name}{locked ? ` (Mastery ${GLIDER_UNLOCK[i]})` : ''}</button>;
            })}</div>
            <div className="dim small">Cosmetics never change stats. Everything that affects combat is world loot.</div>
          </div>
          <div className="card scroll">
            <div className="b-title">Match history</div>
            {p.history.length === 0 && <div className="dim">No matches yet.</div>}
            {p.history.map((h, i) => <div key={i} className="tl"><span className="dim">{h.date}</span> #{h.placement} · {h.kills} elims · {h.damage} dmg</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function Credits({ onBack }: { onBack: () => void }) {
  return (
    <div className="screen menu-bg">
      <div className="career">
        <div className="ov-head"><h2>Credits</h2><button onClick={onBack}>Back</button></div>
        <div className="card">
          <p>Skybreak — an original browser battle royale vertical slice. World, characters, weapons, items, music and sound are all procedurally generated at runtime from code in this project.</p>
          <p>Built with Babylon.js (Apache-2.0), React (MIT), Vite (MIT), TypeScript (Apache-2.0).</p>
          <p className="dim">No external art, audio, fonts, trackers or services are used. See ASSETS.md.</p>
        </div>
      </div>
    </div>
  );
}

function ErrorScreen({ msg, onBack }: { msg: string; onBack?: () => void }) {
  return (
    <div className="screen menu-bg">
      <div className="career">
        <Logo />
        <div className="card error-card">
          <div className="b-title">Something went wrong</div>
          <p>{msg}</p>
          <div className="row">
            <button className="primary" onClick={() => location.reload()}>Reload</button>
            {onBack && <button onClick={onBack}>Main menu</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
