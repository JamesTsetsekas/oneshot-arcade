import { useCallback, useEffect, useRef, useState } from 'react';
import { GameSession, RADIO_LINES, getAnnex, type Mode, type UiState } from '../client/game';
import { loadHistory, loadSettings, saveSettings, type Settings } from '../client/settings';
import { Backdrop } from '../render/backdrop';
import { audio } from '../audio/audio';
import { BuyMenu } from './BuyMenu';
import { MatchEnd, Scoreboard } from './Panels';
import { SettingsPanel } from './SettingsPanel';
import { RULESET_VERSION, PROTOCOL_VERSION, RULES_QUICK, RULES_STANDARD } from '../content/rules';

type Screen = 'menu' | 'play' | 'learn' | 'settings' | 'history' | 'credits' | 'loading' | 'game' | 'error';

let glCache: boolean | null = null;
/** Probe once: each probe creates a WebGL context, and browsers cap live contexts. */
function webgl2Available(): boolean {
  if (glCache !== null) return glCache;
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2');
    glCache = !!gl;
    (gl?.getExtension('WEBGL_lose_context') as { loseContext?: () => void } | null)?.loseContext?.();
  } catch {
    glCache = false;
  }
  return glCache;
}

export function App() {
  const [settings, setSettingsState] = useState<Settings>(() => loadSettings());
  const [screen, setScreen] = useState<Screen>(() => (webgl2Available() ? 'menu' : 'error'));
  const [error, setError] = useState<string>(() => webgl2Available() ? '' : 'This browser or GPU does not provide WebGL 2, which Last Protocol requires. Try a current desktop Chrome, Edge or Firefox with hardware acceleration enabled.');
  const [ui, setUi] = useState<UiState | null>(null);
  const [canvasKey, setCanvasKey] = useState(0);
  const [pending, setPending] = useState<{ mode: Mode; side: 'intrusion' | 'custodian' } | null>(null);
  const [side, setSide] = useState<'intrusion' | 'custodian'>('intrusion');
  const [overlaySettings, setOverlaySettings] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<GameSession | null>(null);
  const backdropRef = useRef<Backdrop | null>(null);
  const lastMode = useRef<{ mode: Mode; side: 'intrusion' | 'custodian' } | null>(null);

  const setSettings = useCallback((s: Settings) => {
    setSettingsState(s);
    saveSettings(s);
    sessionRef.current?.applySettings(s);
    audio.setVolumes(s.volume, s.sfxVolume, s.musicVolume);
  }, []);

  const inMenus = screen !== 'game' && screen !== 'loading' && screen !== 'error';

  // menu backdrop lifecycle
  useEffect(() => {
    if (!inMenus || !canvasRef.current) return;
    if (backdropRef.current) return;
    try {
      backdropRef.current = new Backdrop(canvasRef.current, getAnnex().map, settings);
    } catch (e) {
      setError(`Graphics initialisation failed: ${(e as Error).message}`);
      setScreen('error');
    }
    return undefined;
  }, [inMenus, canvasKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // harness: auto-start a mode from the URL (used by automated browser checks)
  useEffect(() => {
    const qp = new URLSearchParams(location.search);
    const m = qp.get('autostart') as Mode | null;
    if (qp.get('harness') === '1' && m && ['quick', 'standard', 'practice'].includes(m)) {
      const t = setTimeout(() => startMatch(m, (qp.get('side') as 'intrusion' | 'custodian') || 'intrusion'), 300);
      return () => clearTimeout(t);
    }
    return undefined;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // menu music: first user gesture unlocks audio
  useEffect(() => {
    const unlock = () => {
      audio.init();
      audio.setVolumes(settings.volume, settings.sfxVolume, settings.musicVolume);
      if (inMenus) audio.startMusic();
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, [inMenus]); // eslint-disable-line react-hooks/exhaustive-deps

  const startMatch = (mode: Mode, s: 'intrusion' | 'custodian') => {
    audio.init();
    audio.stopMusic();
    backdropRef.current?.dispose();
    backdropRef.current = null;
    lastMode.current = { mode, side: s };
    setPending({ mode, side: s });
    setScreen('loading');
    setCanvasKey((k) => k + 1);
  };

  // create the session once the fresh canvas is mounted
  useEffect(() => {
    if (screen !== 'loading' || !pending) return;
    const id = window.setTimeout(() => {
      if (!canvasRef.current || !hudRef.current) return;
      try {
        const seed = (Date.now() ^ (Math.random() * 1e9)) >>> 0;
        const sess = new GameSession(canvasRef.current, hudRef.current, settings, pending.mode, pending.side, seed);
        sess.onUi = (u) => setUi({ ...u });
        sess.renderer.engine.onContextLostObservable.add(() => {
          setError('The graphics device was lost (GPU reset or driver issue). Reload the page to continue; the local match cannot be restored.');
          setScreen('error');
        });
        sessionRef.current = sess;
        const qp = new URLSearchParams(location.search);
        if (qp.get('harness') === '1') {
          (window as unknown as { __lp: unknown }).__lp = sess;
          if (qp.get('autopilot') === '1') sess.room.enableAutopilot(sess.humanId);
        }
        sess.start();
        setUi({ ...sess.ui });
        setScreen('game');
        setPending(null);
      } catch (e) {
        setError(`Could not start the match: ${(e as Error).message}`);
        setScreen('error');
      }
    }, 60);
    return () => clearTimeout(id);
  }, [screen, pending]); // eslint-disable-line react-hooks/exhaustive-deps

  const leaveMatch = () => {
    sessionRef.current?.stop();
    sessionRef.current = null;
    setUi(null);
    setOverlaySettings(false);
    setCanvasKey((k) => k + 1);
    setScreen('menu');
    audio.startMusic();
  };

  // radio hotkeys while the radio menu is open
  useEffect(() => {
    if (!ui?.radioOpen) return;
    const onKey = (e: KeyboardEvent) => {
      const m = /^Digit(\d)$/.exec(e.code);
      if (m) {
        e.stopPropagation();
        e.preventDefault();
        sessionRef.current?.radioKey(Number(m[1]) - 1);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [ui?.radioOpen]);

  const sess = sessionRef.current;
  const half = sess ? sess.room.rules.halfRounds : 8;

  return (
    <div className="app">
      <canvas key={canvasKey} ref={canvasRef} className="scene" tabIndex={0} />
      <div ref={hudRef} className="hud-host" style={{ display: screen === 'game' ? 'block' : 'none' }} />

      {screen === 'error' && (
        <div className="panel center errorbox">
          <h2>Cannot start Last Protocol</h2>
          <p>{error}</p>
          <button className="primary" onClick={() => location.reload()}>
            Reload
          </button>
        </div>
      )}

      {screen === 'loading' && (
        <div className="loading">
          <div className="logo small">LAST PROTOCOL</div>
          <div className="dim">Building Aperture Annex · validating collision {getAnnex().map.hash}</div>
        </div>
      )}

      {inMenus && (
        <div className="menu-shell">
          <div className="brand">
            <div className="logo">
              LAST <span>PROTOCOL</span>
            </div>
            <div className="tag">Cipher Breach · Aperture Annex · 5v5 tactical</div>
          </div>
          {screen === 'menu' && (
            <nav className="main-nav">
              <button className="primary" onClick={() => setScreen('play')}>Play</button>
              <button onClick={() => startMatch('practice', 'intrusion')}>Practice range</button>
              <button onClick={() => setScreen('history')}>Match history</button>
              <button onClick={() => setScreen('learn')}>Learn</button>
              <button onClick={() => setScreen('settings')}>Settings</button>
              <button onClick={() => setScreen('credits')}>Credits</button>
            </nav>
          )}
          {screen === 'play' && (
            <div className="panel play">
              <h2>Unranked · Cipher Breach vs bots</h2>
              <p className="dim">Local authoritative room at 64 Hz. You and four bots against five bots. Competitive queue needs ten humans and a hosted room, which this offline build does not include.</p>
              <div className="eyebrow">Starting side</div>
              <div className="seg">
                <button className={side === 'intrusion' ? 'on' : ''} onClick={() => setSide('intrusion')}>
                  Intrusion <small>attack · carry the Cipher</small>
                </button>
                <button className={side === 'custodian' ? 'on' : ''} onClick={() => setSide('custodian')}>
                  Custodians <small>defend the vaults</small>
                </button>
              </div>
              <div className="modes">
                <button className="mode" onClick={() => startMatch('quick', side)}>
                  <b>Quick match</b>
                  <span>First to {RULES_QUICK.winRounds} · swap after {RULES_QUICK.halfRounds} · {RULES_QUICK.buyTime}s buy · ~12–20 min</span>
                </button>
                <button className="mode" onClick={() => startMatch('standard', side)}>
                  <b>Full match</b>
                  <span>First to {RULES_STANDARD.winRounds} · swap after {RULES_STANDARD.halfRounds} · win by 2 · max {RULES_STANDARD.maxRounds} rounds · ~25–35 min</span>
                </button>
              </div>
              <div className="row">
                <span className="dim small">Bot difficulty: {settings.botDifficulty < 0.35 ? 'Recruit' : settings.botDifficulty < 0.65 ? 'Operative' : settings.botDifficulty < 0.85 ? 'Veteran' : 'Elite'} (change in Settings → Accessibility)</span>
                <button onClick={() => setScreen('menu')}>Back</button>
              </div>
            </div>
          )}
          {screen === 'settings' && <SettingsPanel settings={settings} onChange={setSettings} onClose={() => setScreen('menu')} inMatch={false} />}
          {screen === 'learn' && <Learn onBack={() => setScreen('menu')} />}
          {screen === 'credits' && <Credits onBack={() => setScreen('menu')} />}
          {screen === 'history' && <History onBack={() => setScreen('menu')} />}
          <div className="ver">ruleset {RULESET_VERSION} · protocol v{PROTOCOL_VERSION} · map {getAnnex().map.hash}</div>
        </div>
      )}

      {screen === 'game' && ui && sess && (
        <>
          {ui.buyOpen && <BuyMenu ui={ui} onBuy={(i) => sess.buy(i)} onRefund={(i) => sess.refund(i)} onClose={() => sess.setBuyOpen(false)} />}
          {ui.scoreOpen && !ui.result && <Scoreboard ui={ui} settings={settings} half={half} />}
          {ui.radioOpen && (
            <div className="radio-menu">
              <div className="eyebrow">RADIO</div>
              {RADIO_LINES.map((l, i) => (
                <div key={l}>
                  <kbd>{i + 1}</kbd> {l}
                </div>
              ))}
            </div>
          )}
          {ui.result && ui.phase === 'matchEnd' && (
            <MatchEnd
              ui={ui}
              settings={settings}
              half={half}
              onAgain={() => {
                const lm = lastMode.current!;
                leaveMatch();
                setTimeout(() => startMatch(lm.mode, lm.side), 30);
              }}
              onMenu={leaveMatch}
            />
          )}
          {ui.paused && !ui.buyOpen && !ui.result && (
            <div className="overlay pause">
              {overlaySettings ? (
                <SettingsPanel settings={settings} onChange={setSettings} onClose={() => setOverlaySettings(false)} inMatch />
              ) : (
                <div className="panel center">
                  <h2>{!sess.deployed ? (ui.snap.practice ? 'Practice range' : 'Match ready') : ui.snap.practice ? 'Practice paused' : 'Menu'}</h2>
                  {!ui.snap.practice && sess.deployed && <p className="dim small">The room keeps running — rounds do not pause.</p>}
                  <button className="primary" onClick={() => sess.resume()}>
                    {sess.deployed ? 'Resume' : 'Click to deploy'}
                  </button>
                  <button onClick={() => setOverlaySettings(true)}>Settings</button>
                  <button onClick={leaveMatch}>Leave match</button>
                  <ControlsCard />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ControlsCard() {
  return (
    <div className="controls-card small">
      <div><kbd>WASD</kbd> move · <kbd>Shift</kbd> silent walk · <kbd>Ctrl</kbd> crouch · <kbd>Space</kbd> jump</div>
      <div><kbd>LMB</kbd> fire · <kbd>RMB</kbd> scope / burst toggle / lob · <kbd>R</kbd> reload · <kbd>E</kbd> arm/disarm/pick up</div>
      <div><kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> weapons/tool (3 again: Cipher) · <kbd>4–7</kbd> utility · <kbd>Q</kbd> last · <kbd>G</kbd> drop</div>
      <div><kbd>B</kbd> buy · <kbd>Tab</kbd> scoreboard · <kbd>M</kbd> tactical map · <kbd>Z</kbd> radio · <kbd>F</kbd> inspect</div>
    </div>
  );
}

function Learn({ onBack }: { onBack: () => void }) {
  return (
    <div className="panel learn">
      <div className="panel-head">
        <h2>How Cipher Breach works</h2>
        <button onClick={onBack}>Back</button>
      </div>
      <div className="learn-grid">
        <section>
          <h3>The objective</h3>
          <p><b>Intrusion</b> carries the Cipher Spike and must arm it (hold <kbd>E</kbd> for 3.2 s) inside Vault A (Turbine Hall) or Vault B (Hydroponics). Once armed it detonates after 35 s.</p>
          <p><b>Custodians</b> win by running out the 105 s clock, eliminating the attackers before an arm, or disarming the Spike — 8 s, or 5 s with a Defuse Tool. Releasing <kbd>E</kbd> resets the disarm to zero.</p>
          <p>One life per round. No regeneration. Dead players spectate living teammates.</p>
        </section>
        <section>
          <h3>Economy</h3>
          <p>Start with $800. Round win $3,000. Losses pay $1,900, rising $400 per consecutive loss to $3,100 (a win steps the bonus down one tier). Arming pays $300 personally and $600 to every attacker. Survivors keep their gear.</p>
          <p>Purchases can be refunded during the buy phase if unused. Sides swap at halftime and money resets.</p>
        </section>
        <section>
          <h3>Gunplay</h3>
          <p>Stop before you shoot: rifles are only accurate under 0.45 m/s. Release your keys or tap the opposite direction to stop fast. Crouching tightens spread slightly. Jumping is wildly inaccurate.</p>
          <p>Every automatic weapon has a fixed, learnable recoil path — pull against it. Hatched-yellow walls, glass and crates can be shot through with damage loss.</p>
        </section>
        <section>
          <h3>Utility</h3>
          <p><b>Veil Canister</b> — opaque smoke for 17 s. <b>Arc Flash</b> — blinds anyone looking at it. <b>Thermite Vial</b> — burns floor cells for 7 s. <b>Pulse Shard</b> — two pings that reveal the rough direction of enemies. <b>Fragment Charge</b> — blast with falloff, blocked by cover.</p>
          <p>Hold LMB to prime and release to throw; RMB for a short lob.</p>
        </section>
      </div>
      <ControlsCard />
    </div>
  );
}

function Credits({ onBack }: { onBack: () => void }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Credits</h2>
        <button onClick={onBack}>Back</button>
      </div>
      <p>Last Protocol — an original tactical shooter vertical slice. Teams, weapons, map, economy numbers, recoil paths and UI are original.</p>
      <p>All textures, models and sounds are generated procedurally at runtime. No samples or third-party art are used.</p>
      <p className="dim">Built with Babylon.js (Apache-2.0), React (MIT), Vite (MIT), TypeScript (Apache-2.0), Vitest (MIT).</p>
    </div>
  );
}

function History({ onBack }: { onBack: () => void }) {
  const h = loadHistory();
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Match history</h2>
        <button onClick={onBack}>Back</button>
      </div>
      {h.length === 0 && <p className="dim">No finished matches yet. Results are stored only in this browser.</p>}
      <table className="sb-table">
        <tbody>
          {h.map((e) => (
            <tr key={e.matchId + e.date}>
              <td className={e.won === null ? '' : e.won ? 'win' : 'lose'}>{e.won === null ? 'Draw' : e.won ? 'Win' : 'Loss'}</td>
              <td>{e.mode}</td>
              <td>
                {e.score[0]}–{e.score[1]}
              </td>
              <td>
                {e.kills}/{e.deaths}/{e.assists}
              </td>
              <td>{e.adr} ADR</td>
              <td className="dim">{new Date(e.date).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
