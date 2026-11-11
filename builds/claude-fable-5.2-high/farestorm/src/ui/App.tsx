// React menus: title, shift setup / cab select, pause, results, records, settings, help, credits.
import { useEffect, useRef, useState, ReactNode } from 'react';
import { ui, useUI, Screen } from './store';
import { game } from '../app-shell/game';
import { MODES, ModeId, TRIALS, LESSONS, SessionResult } from '../game-session/session';
import { TAXIS, TAXI_ORDER, TaxiSpec, TaxiId } from '../vehicle/taxiSpecs';
import { Settings, bestRecords, DEFAULT_SETTINGS } from '../persistence/db';
import { Action, ACTION_LABELS, keyLabel } from '../camera-input/input';
import { formatTime } from './hud';
import { TIERS } from '../fares/fares';
import { HUB_DEFS, SHORTCUT_DEFS } from '../world/galeport';
import { RANK_THRESHOLDS } from '../score/pulse';

const money = (n: number): string => Math.round(n).toLocaleString('en-US');
const go = (screen: Screen, back?: Screen): void => { game.audio.ui('select'); ui.set({ screen, ...(back ? { back } : {}) }); };

/** Estimated 0-100 km/h time from the tuning sheet (same curve as the simulation). */
function zeroTo100(t: TaxiSpec): number {
  let v = 0, time = 0;
  while (v < 27.78 && time < 30) { v += t.accel * (1 - Math.pow(v / t.topSpeed, 2.4)) * 0.01; time += 0.01; }
  return time;
}

function Btn(props: { onClick: () => void; children: ReactNode; kind?: string; autoFocus?: boolean; disabled?: boolean }) {
  return (
    <button className={`btn ${props.kind ?? ''}`} onClick={props.onClick} autoFocus={props.autoFocus} disabled={props.disabled}
      onMouseEnter={() => game.audio.ui('move')} onFocus={() => game.audio.ui('move')}>
      {props.children}
    </button>
  );
}

function Logo({ small }: { small?: boolean }) {
  return (
    <div className={`logo ${small ? 'small' : ''}`}>
      <div className="logo-swirl"><i /><i /><i /></div>
      <div className="logo-word">FARE<span>STORM</span></div>
      {!small && <div className="logo-tag">Storm-cab hustle in the city of Galeport</div>}
    </div>
  );
}

function MainMenu() {
  const st = useUI();
  const bestArcade = bestRecords(st.records, 'arcade', 0, 1)[0];
  const setup = (mode: ModeId) => { game.audio.ui('select'); ui.set({ screen: 'setup', setupMode: mode }); };
  return (
    <div className="screen menu-screen">
      <div className="menu-col">
        <Logo />
        <div className="menu-list">
          <Btn kind="primary" autoFocus onClick={() => setup('arcade')}><b>Arcade Shift</b><small>60 seconds. Every fare buys more.</small></Btn>
          <Btn onClick={() => setup('quick')}><b>Quick Shift</b><small>Five minutes flat, pure score.</small></Btn>
          <Btn onClick={() => setup('trial')}><b>Time Trial</b><small>Fixed fare chains against the stopwatch.</small></Btn>
          <Btn onClick={() => setup('school')}><b>Skill School</b><small>{st.profile.lessonsDone >= LESSONS.length ? 'Graduated - replay any time.' : `Ten lessons - ${st.profile.lessonsDone}/${LESSONS.length} cleared.`}</small></Btn>
          <div className="menu-row">
            <Btn kind="mini" onClick={() => go('records')}>Records</Btn>
            <Btn kind="mini" onClick={() => go('settings', 'menu')}>Settings</Btn>
            <Btn kind="mini" onClick={() => go('howto', 'menu')}>How to Play</Btn>
            <Btn kind="mini" onClick={() => go('credits')}>Credits</Btn>
          </div>
        </div>
      </div>
      <div className="menu-chips">
        {bestArcade && <div className="chip">Best Arcade Shift <b>{money(bestArcade.score)}</b> <i className={`rank r-${bestArcade.rank}`}>{bestArcade.rank}</i></div>}
        <div className="chip">Shortcuts found <b>{st.profile.discovered.length}/{SHORTCUT_DEFS.length}</b></div>
        {st.gamepad && <div className="chip">Gamepad ready</div>}
        {!st.storageOk && <div className="chip warn">Storage unavailable - progress will not be saved</div>}
      </div>
    </div>
  );
}

function StatBar({ label, value, text }: { label: string; value: number; text: string }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <div className="stat-bar"><i style={{ width: `${Math.round(Math.max(0.06, Math.min(1, value)) * 100)}%` }} /></div>
      <em>{text}</em>
    </div>
  );
}

function Setup() {
  const st = useUI();
  const mode = MODES[st.setupMode];
  const [taxi, setTaxi] = useState<TaxiId>(st.settings.taxi);
  useEffect(() => { game.showcase(taxi); return () => game.showcase(null); }, [taxi]);
  const start = () => game.startRun(st.setupMode, taxi, { trial: st.trial });
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const i = TAXI_ORDER.indexOf(taxi);
      if (e.code === 'ArrowRight' || e.code === 'KeyD') setTaxi(TAXI_ORDER[(i + 1) % 3]);
      else if (e.code === 'ArrowLeft' || e.code === 'KeyA') setTaxi(TAXI_ORDER[(i + 2) % 3]);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [taxi]);
  const spec = TAXIS[taxi];
  const t100 = zeroTo100(spec);
  return (
    <div className="screen setup-screen">
      <div className="panel setup-panel">
        <div className="panel-head"><h2>{mode.name}</h2><p>{mode.blurb}</p></div>
        <div className="cab-tabs">
          {TAXI_ORDER.map((id) => (
            <button key={id} className={`cab-tab ${id === taxi ? 'on' : ''}`} onClick={() => { game.audio.ui('move'); setTaxi(id); }}
              style={{ ['--cab' as string]: `rgb(${TAXIS[id].body.map((c) => Math.round(c * 255)).join(',')})` }}>
              <i /><span>{TAXIS[id].name}</span>
            </button>
          ))}
        </div>
        <p className="cab-blurb">{spec.blurb}</p>
        <div className="stats">
          <StatBar label="Acceleration" value={(8.2 - t100) / 3.4} text={`0-100 in ${t100.toFixed(1)} s`} />
          <StatBar label="Top speed" value={(spec.topSpeed * 3.6 - 140) / 50} text={`${Math.round(spec.topSpeed * 3.6 * 0.975)} km/h`} />
          <StatBar label="Steering" value={(spec.steerRate - 2) / 1.6} text={`${spec.steerRate.toFixed(1)} rad/s`} />
          <StatBar label="Drift ease" value={(0.9 - spec.driftGrip) / 0.34} text={`${Math.round((1 - spec.driftGrip) * 100)}% slide`} />
          <StatBar label="Shove" value={(spec.mass - 900) / 1100} text={`${spec.mass} kg`} />
          <StatBar label="Braking" value={(spec.brake - 12) / 6} text={`${spec.brake.toFixed(1)} m/s2`} />
        </div>
        {st.setupMode === 'trial' && (
          <div className="opt-row"><span>Route</span>
            <div className="seg">{TRIALS.map((t, i) => (
              <button key={t.name} className={i === st.trial ? 'on' : ''} onClick={() => ui.set({ trial: i })}>{t.name}{st.profile.medals[`trial${i}`] ? <i className={`medal m-${st.profile.medals[`trial${i}`]}`} /> : null}</button>
            ))}</div>
          </div>
        )}
        {(st.setupMode === 'arcade' || st.setupMode === 'quick') && (
          <>
            <div className="opt-row"><span>Start rank</span>
              <div className="seg">
                <button className={st.hub === -1 ? 'on' : ''} onClick={() => ui.set({ hub: -1 })}>Random</button>
                {HUB_DEFS.map((h, i) => <button key={h.name} className={st.hub === i ? 'on' : ''} onClick={() => ui.set({ hub: i })}>{h.name.replace(' Rank', '')}</button>)}
              </div>
            </div>
            <div className="opt-row"><span>Traffic</span>
              <div className="seg">{(['low', 'medium', 'high'] as const).map((d) => (
                <button key={d} className={st.settings.traffic === d ? 'on' : ''} onClick={() => game.updateSettings({ traffic: d })}>{d[0].toUpperCase() + d.slice(1)}</button>
              ))}</div>
            </div>
          </>
        )}
        <div className="panel-foot">
          <Btn kind="ghost" onClick={() => go('menu')}>Back</Btn>
          <Btn kind="primary go" autoFocus onClick={start}>Start {st.setupMode === 'school' ? 'School' : st.setupMode === 'trial' ? 'Trial' : 'Shift'}</Btn>
        </div>
      </div>
      <div className="setup-hint">A / D or arrow keys switch cab</div>
    </div>
  );
}

function Pause() {
  return (
    <div className="screen overlay-screen">
      <div className="panel narrow">
        <div className="panel-head"><h2>Paused</h2><p>The meter is stopped. Galeport will wait.</p></div>
        <div className="vlist">
          <Btn kind="primary" autoFocus onClick={() => game.resume()}>Resume</Btn>
          <Btn onClick={() => game.retry()}>Restart</Btn>
          <Btn onClick={() => go('settings', 'paused')}>Settings</Btn>
          <Btn onClick={() => go('howto', 'paused')}>Controls</Btn>
          <Btn onClick={() => game.endShift()}>End shift now</Btn>
          <Btn kind="ghost" onClick={() => game.quitToMenu()}>Abandon to menu</Btn>
        </div>
      </div>
    </div>
  );
}

function Results() {
  const st = useUI();
  const r = st.result as SessionResult;
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.code === 'KeyR') game.retry(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
  if (!r) return null;
  const row = (label: string, value: string, cls = '') => <div className={`res-row ${cls}`}><span>{label}</span><b>{value}</b></div>;
  const scored = r.mode === 'arcade' || r.mode === 'quick';
  const next = scored && r.rank !== 'S' ? RANK_THRESHOLDS[r.mode][['S', 'A', 'B', 'C', 'D'].indexOf(r.rank!) - 1] : 0;
  return (
    <div className="screen overlay-screen results-screen">
      <div className="panel results">
        <div className="res-head">
          <div>
            <h2>{r.mode === 'trial' ? TRIALS[r.trial].name : MODES[r.mode].name}</h2>
            <p>{TAXIS[r.taxi].name} - {r.traffic} traffic{r.assisted ? ' - assisted' : ''}</p>
          </div>
          {scored && <div className={`rank-badge r-${r.rank}`}><small>RANK</small>{r.rank}</div>}
          {r.mode === 'trial' && <div className={`rank-badge medal-${r.medal}`}><small>{r.medal === 'none' ? 'NO MEDAL' : 'MEDAL'}</small>{r.medal === 'gold' ? 'G' : r.medal === 'silver' ? 'S' : r.medal === 'bronze' ? 'B' : '-'}</div>}
          {r.mode === 'school' && <div className="rank-badge r-A"><small>LESSONS</small>{r.lessonsDone}</div>}
        </div>
        {st.newBest && <div className="newbest">New personal best!</div>}
        <div className="res-grid">
          <div className="res-col">
            {r.mode === 'trial' ? row('Time', formatTime(r.trialTime), 'big') : row('Total', money(r.score), 'big')}
            {r.mode === 'trial' && r.medalTimes && row('Gold / Silver / Bronze', r.medalTimes.map((t) => formatTime(t)).join('  '))}
            {row('Fares', money(r.fares))}
            {row('Style tips', money(r.tips))}
            {row('Time bonuses', money(r.timeBonus))}
            {row('Bonuses', money(r.bonuses))}
            {row('Free-drive style', money(r.style))}
            {r.penalties > 0 && row('Penalties', `-${money(r.penalties)}`, 'bad')}
          </div>
          <div className="res-col">
            {row('Deliveries', `${r.deliveries}${r.failures ? ` (${r.failures} lost)` : ''}`)}
            {row('Best Pulse', `x${r.bestMult} - chain of ${r.bestChain}`)}
            {row('Collisions', String(r.collisions))}
            {row('Shortcuts used', `${r.shortcutsUsed}${r.newShortcuts.length ? ` (${r.newShortcuts.length} new!)` : ''}`)}
            {row('Route efficiency', r.deliveries ? `${Math.round(Math.min(1.5, r.efficiency) * 100)}%` : '-')}
            {row('Shift length', formatTime(r.duration))}
            {scored && next > 0 && row('Next rank at', money(next))}
          </div>
        </div>
        <div className="res-note">Local record{r.assisted ? ' (assist category)' : ''} - saved on this device. Ghost replays and online boards are not part of this build.</div>
        <div className="panel-foot">
          <Btn kind="ghost" onClick={() => game.quitToMenu()}>Menu</Btn>
          <Btn onClick={() => { game.quitToMenu(); ui.set({ screen: 'setup', setupMode: r.mode }); }}>Change cab</Btn>
          <Btn kind="primary go" autoFocus onClick={() => game.retry()}>Retry <kbd>R</kbd></Btn>
        </div>
      </div>
    </div>
  );
}

function Records() {
  const st = useUI();
  const [tab, setTab] = useState<'arcade' | 'quick' | 'trial'>('arcade');
  const [trial, setTrial] = useState(0);
  const list = bestRecords(st.records, tab, trial, 8);
  return (
    <div className="screen overlay-screen">
      <div className="panel wide">
        <div className="panel-head"><h2>Records</h2><p>Stored locally on this device.</p></div>
        <div className="seg big">
          {(['arcade', 'quick', 'trial'] as const).map((m) => <button key={m} className={tab === m ? 'on' : ''} onClick={() => setTab(m)}>{MODES[m].name}</button>)}
        </div>
        {tab === 'trial' && <div className="seg">{TRIALS.map((t, i) => <button key={t.name} className={trial === i ? 'on' : ''} onClick={() => setTrial(i)}>{t.name}</button>)}</div>}
        <div className="rec-list">
          {list.length === 0 && <div className="empty">No runs yet. Go earn one.</div>}
          {list.map((r, i) => (
            <div className="rec" key={i}>
              <i>{i + 1}</i>
              <b>{tab === 'trial' ? formatTime(r.time) : money(r.score)}</b>
              <span className={`rank r-${r.rank ?? 'x'} medal-${r.medal ?? 'x'}`}>{tab === 'trial' ? (r.medal ?? '-') : r.rank}</span>
              <span>{TAXIS[r.taxi as TaxiId]?.name ?? r.taxi}</span>
              <span>{r.deliveries} fares</span>
              <span>{r.traffic}{r.assisted ? ' / assist' : ''}</span>
              <span>{new Date(r.date).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
        <div className="sc-list">
          <h3>Shortcuts discovered {st.profile.discovered.length}/{SHORTCUT_DEFS.length}</h3>
          <div className="sc-grid">{SHORTCUT_DEFS.map((s) => <span key={s.id} className={st.profile.discovered.includes(s.id) ? 'on' : ''}>{st.profile.discovered.includes(s.id) ? s.name : '? ? ?'}</span>)}</div>
        </div>
        <div className="panel-foot"><Btn kind="primary" autoFocus onClick={() => go('menu')}>Back</Btn></div>
      </div>
    </div>
  );
}

function Slider(p: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; fmt?: (v: number) => string }) {
  return (
    <label className="set-row"><span>{p.label}</span>
      <input type="range" min={p.min} max={p.max} step={p.step} value={p.value} onChange={(e) => p.onChange(Number(e.target.value))} />
      <em>{p.fmt ? p.fmt(p.value) : `${Math.round(p.value * 100)}%`}</em>
    </label>
  );
}
function Toggle(p: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="set-row"><span>{p.label}{p.hint && <small>{p.hint}</small>}</span>
      <button className={`toggle ${p.value ? 'on' : ''}`} onClick={() => p.onChange(!p.value)} role="switch" aria-checked={p.value}><i /></button>
    </label>
  );
}
function Choice<T extends string | number>(p: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="set-row"><span>{p.label}</span>
      <div className="seg">{p.options.map(([v, l]) => <button key={String(v)} className={p.value === v ? 'on' : ''} onClick={() => p.onChange(v)}>{l}</button>)}</div>
    </div>
  );
}

function SettingsScreen() {
  const st = useUI();
  const s = st.settings;
  const set = (patch: Partial<Settings>) => game.updateSettings(patch);
  const [tab, setTab] = useState<'game' | 'video' | 'audio' | 'controls'>('game');
  const [listening, setListening] = useState<Action | null>(null);
  useEffect(() => {
    if (!listening) return;
    const h = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.code !== 'Escape') {
        const b = JSON.parse(JSON.stringify(s.bindings)) as Settings['bindings'];
        for (const k of Object.keys(b) as Action[]) b[k] = b[k].filter((c) => c !== e.code);
        b[listening] = [e.code, ...b[listening].slice(1)];
        set({ bindings: b });
      }
      setListening(null);
    };
    window.addEventListener('keydown', h, true);
    return () => window.removeEventListener('keydown', h, true);
  }, [listening, s.bindings]);
  return (
    <div className="screen overlay-screen">
      <div className="panel wide">
        <div className="panel-head"><h2>Settings</h2></div>
        <div className="seg big">
          {(['game', 'video', 'audio', 'controls'] as const).map((t) => <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>)}
        </div>
        <div className="set-body">
          {tab === 'game' && <>
            <Choice label="Default traffic" value={s.traffic} options={[['low', 'Low'], ['medium', 'Medium'], ['high', 'High']]} onChange={(v) => set({ traffic: v })} />
            <Toggle label="Subtitles" hint="Passenger barks as text" value={s.subtitles} onChange={(v) => set({ subtitles: v })} />
            <Toggle label="Minimap" value={s.minimap} onChange={(v) => set({ minimap: v })} />
            <Toggle label="Wide technique windows" hint="Easier Surge Start and Grip Turn timing. Marks runs as assisted." value={s.wideWindows} onChange={(v) => set({ wideWindows: v })} />
            <Toggle label="Steering assist" hint="Calmer steering lock for keyboards. Marks runs as assisted." value={s.steerAssist} onChange={(v) => set({ steerAssist: v })} />
            <Slider label="Steering sensitivity" value={s.steerSensitivity} min={0.5} max={1} step={0.05} onChange={(v) => set({ steerSensitivity: v })} />
          </>}
          {tab === 'video' && <>
            <Choice label="Quality" value={s.quality} options={[['low', 'Low'], ['medium', 'Medium'], ['high', 'High']]} onChange={(v) => set({ quality: v })} />
            <Toggle label="Dynamic resolution" hint="Lower the render scale when the frame rate drops" value={s.dynamicRes} onChange={(v) => set({ dynamicRes: v })} />
            <Choice label="HUD scale" value={s.hudScale} options={[[1, '100%'], [1.25, '125%'], [1.5, '150%']]} onChange={(v) => set({ hudScale: v })} />
            <Slider label="Field of view" value={s.fov} min={0.85} max={1.15} step={0.05} onChange={(v) => set({ fov: v })} />
            <Slider label="Camera shake" value={s.cameraShake} min={0} max={1} step={0.1} onChange={(v) => set({ cameraShake: v })} />
            <Toggle label="Reduced motion" hint="No camera tilt, shake, speed lines or bouncy menus" value={s.reducedMotion} onChange={(v) => set({ reducedMotion: v })} />
          </>}
          {tab === 'audio' && <>
            <Slider label="Master volume" value={s.master} min={0} max={1} step={0.05} onChange={(v) => set({ master: v })} />
            <Slider label="Music" value={s.music} min={0} max={1} step={0.05} onChange={(v) => set({ music: v })} />
            <Slider label="Effects" value={s.sfx} min={0} max={1} step={0.05} onChange={(v) => set({ sfx: v })} />
          </>}
          {tab === 'controls' && <>
            <div className="binds">
              {(Object.keys(ACTION_LABELS) as Action[]).map((a) => (
                <div className="bind" key={a}><span>{ACTION_LABELS[a]}</span>
                  <button className={listening === a ? 'listen' : ''} onClick={() => setListening(a)}>{listening === a ? 'Press a key...' : s.bindings[a].map(keyLabel).join(' / ')}</button>
                </div>
              ))}
            </div>
            <Slider label="Gamepad dead zone" value={s.deadZone} min={0.05} max={0.35} step={0.01} onChange={(v) => set({ deadZone: v })} />
            <Toggle label="Gamepad vibration" value={s.vibration} onChange={(v) => set({ vibration: v })} />
            <div className="set-row"><span>Gamepad<small>RT throttle - LT brake - stick steer - A drift - B Tailwind - Y look back - X reset</small></span><em>{st.gamepad ? 'Connected' : 'Not detected'}</em></div>
            <div className="set-row"><span>Reset key bindings</span><button className="btn mini" onClick={() => set({ bindings: DEFAULT_SETTINGS.bindings })}>Defaults</button></div>
          </>}
        </div>
        <div className="panel-foot"><Btn kind="primary" autoFocus onClick={() => go(st.back)}>Done</Btn></div>
      </div>
    </div>
  );
}

function HowTo() {
  const st = useUI();
  const k = (a: Action) => <kbd>{keyLabel(st.settings.bindings[a][0])}</kbd>;
  return (
    <div className="screen overlay-screen">
      <div className="panel wide howto">
        <div className="panel-head"><h2>How to Play</h2></div>
        <div className="how-grid">
          <div>
            <h3>The shift</h3>
            <ol>
              <li>Find a hailing passenger. The marker shape is the trip length:
                <div className="tiers">{(['short', 'medium', 'long', 'special'] as const).map((t) => <span key={t}><i className={`shape sh-${TIERS[t].shape === 'hexagon' ? 'hex' : TIERS[t].shape}`} style={{ ['--c' as string]: TIERS[t].color }} />{TIERS[t].label}</span>)}</div>
              </li>
              <li>Stop inside the ring to pick up. Pickups add time to the Shift Clock.</li>
              <li>Follow the vane over your cab, or beat it with shortcuts, and stop in the beacon ring.</li>
              <li>Faster arrivals grade higher: Blazing, Fast, Close, Late. Deliveries add a little more time.</li>
              <li>When the clock hits zero the shift is over. Chase a higher rank.</li>
            </ol>
            <h3>Pulse and Tailwind</h3>
            <p>Style moves build the Pulse multiplier (x2, x3, x5) which multiplies tips. Vary your tricks: repeats are worth less. Crashes drop it. Style also charges <b>Tailwind</b>, a short speed burst on {k('boost')}.</p>
          </div>
          <div>
            <h3>Controls</h3>
            <div className="keys">
              <span>{k('throttle')} {k('brake')}</span><em>Throttle / brake and reverse</em>
              <span>{k('left')} {k('right')}</span><em>Steer</em>
              <span>{k('handbrake')}</span><em>Handbrake / drift</em>
              <span>{k('boost')}</span><em>Tailwind boost</em>
              <span>{k('glanceL')} {k('glanceR')} {k('lookBack')}</span><em>Glance left / right, look back</em>
              <span>{k('camera')} {k('map')}</span><em>Camera, city map</em>
              <span>{k('reset')} (hold)</span><em>Reset to road (-3 s)</em>
              <span>{k('pause')}</span><em>Pause</em>
            </div>
            <h3>Techniques</h3>
            <p><b>Surge Start</b> - at a standstill tap {k('brake')}, release, then hit {k('throttle')} straight away.</p>
            <p><b>Snap Drift</b> - above 35 km/h steer hard and tap {k('handbrake')}. Straighten up to bank the points.</p>
            <p><b>Grip Turn</b> - mid-drift, tap {k('brake')} then {k('throttle')} to bite and tighten.</p>
            <p><b>Also scores</b> - near misses, threading two cars, airtime, marked shortcuts, clean high-speed sectors, wrong-side driving on avenues, precise stops.</p>
          </div>
        </div>
        <div className="panel-foot"><Btn kind="primary" autoFocus onClick={() => go(st.back)}>Got it</Btn></div>
      </div>
    </div>
  );
}

function Credits() {
  return (
    <div className="screen overlay-screen">
      <div className="panel narrow credits">
        <div className="panel-head"><h2>Credits</h2></div>
        <p><b>Farestorm</b> is an original arcade driving game. The city of Galeport, its cabs, passengers, destinations, music and sounds were all generated for this build - no third-party art, audio or maps.</p>
        <p>Built with Babylon.js (rendering), Rapier (physics), React (menus) and the Lilita One and Rubik typefaces (SIL Open Font License).</p>
        <p>Designed and implemented in one pass by Claude Fable 5.2 for Oneshot Arcade.</p>
        <div className="panel-foot"><Btn kind="primary" autoFocus onClick={() => go('menu')}>Back</Btn></div>
      </div>
    </div>
  );
}

export function App() {
  const st = useUI();
  const rootRef = useRef<HTMLDivElement>(null);
  // Menu keyboard navigation: arrows move focus, Escape goes back.
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const screen = ui.get().screen;
      if (screen === 'playing' || screen === 'loading') return;
      if (e.code === 'Escape' && screen !== 'paused') {
        if (screen === 'results') game.quitToMenu();
        else if (screen === 'setup' || screen === 'records' || screen === 'credits') go('menu');
        else if (screen === 'settings' || screen === 'howto') go(ui.get().back);
        return;
      }
      if (e.code !== 'ArrowDown' && e.code !== 'ArrowUp') return;
      const items = Array.from(rootRef.current?.querySelectorAll<HTMLElement>('button.btn:not(:disabled)') ?? []);
      if (!items.length) return;
      const i = items.indexOf(document.activeElement as HTMLElement);
      const n = e.code === 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
      items[n].focus();
      e.preventDefault();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
  let body: ReactNode = null;
  switch (st.screen) {
    case 'loading': body = <div className="screen loading-screen"><Logo /><div className="loading-bar"><i /></div><p>{st.loadingText}</p></div>; break;
    case 'error': body = <div className="screen loading-screen"><Logo small /><div className="panel narrow"><div className="panel-head"><h2>Cannot start</h2></div><p>{st.error}</p><p>Farestorm needs a desktop browser with WebGL 2 (current Chrome, Edge or Firefox) and hardware acceleration enabled.</p><div className="panel-foot"><Btn kind="primary" onClick={() => location.reload()}>Reload</Btn></div></div></div>; break;
    case 'menu': body = <MainMenu />; break;
    case 'setup': body = <Setup key={st.setupMode} />; break;
    case 'paused': body = <Pause />; break;
    case 'results': body = <Results />; break;
    case 'records': body = <Records />; break;
    case 'settings': body = <SettingsScreen />; break;
    case 'howto': body = <HowTo />; break;
    case 'credits': body = <Credits />; break;
    default: body = null;
  }
  return <div ref={rootRef} className={`ui screen-${st.screen}`}>{body}{st.notice && <div className="notice">{st.notice}</div>}</div>;
}
