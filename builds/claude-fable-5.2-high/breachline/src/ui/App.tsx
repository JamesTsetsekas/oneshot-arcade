// client-ui: application shell. React owns menus and flow; the match itself renders through the game runtime.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Game } from '../client/game';
import { applyMatchResult, ApplyOutcome, loadProfile, Profile, resetProfile, saveProfile } from '../profile/profile';
import type { MatchResult } from '../protocol/messages';
import { ControlsList, LoadoutEditor, PracticeSetup, ProfileScreen, Results, SettingsBody, XpCard } from './screens';

type Screen = 'menu' | 'practice' | 'loadouts' | 'settings' | 'profile' | 'credits';
type Boot = 'loading' | 'ready' | 'unsupported' | 'failed';
type MatchState = 'none' | 'connecting' | 'deploy' | 'live' | 'paused' | 'results';

function capabilityProblems(): string[] {
  const out: string[] = [];
  try {
    const c = document.createElement('canvas');
    if (!c.getContext('webgl2')) out.push('WebGL 2 is not available (it may be disabled, or the graphics driver is blocked).');
  } catch { out.push('WebGL 2 could not be initialised.'); }
  if (typeof WebAssembly !== 'object') out.push('WebAssembly is not available (needed for the physics engine).');
  if (typeof Worker !== 'function') out.push('Web Workers are not available (needed for the local match server).');
  if (!('requestPointerLock' in HTMLElement.prototype)) out.push('Pointer Lock is not available (needed for mouse look).');
  return out;
}

export function App() {
  const [boot, setBoot] = useState<Boot>('loading');
  const [bootMsg, setBootMsg] = useState('Loading station geometry');
  const [problems, setProblems] = useState<string[]>([]);
  const [profile, setProfile] = useState<Profile>(() => loadProfile());
  const [screen, setScreen] = useState<Screen>('menu');
  const [back, setBack] = useState<Screen>('menu');
  const [match, setMatch] = useState<MatchState>('none');
  const [pauseTab, setPauseTab] = useState<'main' | 'settings'>('main');
  const [result, setResult] = useState<MatchResult | null>(null);
  const [outcome, setOutcome] = useState<ApplyOutcome | null>(null);
  const [error, setError] = useState<{ code: string; detail: string } | null>(null);
  const game = useRef<Game | null>(null);
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const demo = useRef(new URLSearchParams(location.search).get('demo') === '1');

  const update = useCallback((fn: (p: Profile) => void) => {
    setProfile((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as Profile;
      fn(next);
      saveProfile(next);
      return next;
    });
  }, []);

  // boot: capability check, then lazy-load the engine chunk so the shell paints first
  useEffect(() => {
    let cancelled = false;
    const probs = capabilityProblems();
    if (probs.length) { setProblems(probs); setBoot('unsupported'); return; }
    (async () => {
      try {
        const [{ Game }, { loadRapier }] = await Promise.all([import('../client/game'), import('../sim/physics')]);
        if (cancelled) return;
        setBootMsg('Starting physics');
        const R = await loadRapier();
        if (cancelled) return;
        setBootMsg('Baking light for Relay Station K-17');
        await new Promise((r) => setTimeout(r, 30));
        const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
        const hudRoot = document.getElementById('hud-root') as HTMLElement;
        const g = new Game(R, canvas, hudRoot, profileRef.current, {
          onMatchReady: () => setMatch(demo.current ? 'live' : 'deploy'),
          onPause: (p) => setMatch((m) => (m === 'results' || m === 'none' ? m : p ? 'paused' : 'live')),
          onResult: (r) => {
            const next = JSON.parse(JSON.stringify(profileRef.current)) as Profile;
            const out = applyMatchResult(next, r);
            saveProfile(next);
            setProfile(next);
            setOutcome(out);
            setResult(r);
            setMatch('results');
          },
          onError: (code, detail) => {
            if (code === 'context-restored') { setError((e) => (e && e.code === 'context' ? null : e)); return; }
            setError({ code, detail });
          },
        });
        g.demo = demo.current;
        game.current = g;
        (window as unknown as { __breachline: unknown }).__breachline = { game: g };
        setBoot('ready');
        (window as unknown as { __ready: boolean }).__ready = true;
        if (demo.current) {
          const lo = Number(new URLSearchParams(location.search).get('loadout') ?? -1);
          const prof = lo >= 0 && lo < 5 ? { ...profileRef.current, selected: lo } : profileRef.current;
          g.audio.unlock(); setMatch('connecting'); g.startMatch(prof, { ...prof.practice, ...demoOverrides() });
        }
      } catch (e) {
        console.error(e);
        setProblems([String((e as Error)?.message ?? e)]);
        setBoot('failed');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { game.current?.applySettings(profile.settings); }, [profile.settings, boot]);

  const startMatch = useCallback(() => {
    const g = game.current;
    if (!g) return;
    g.audio.unlock();
    setError(null); setResult(null); setOutcome(null); setPauseTab('main');
    setMatch('connecting');
    g.startMatch(profileRef.current, profileRef.current.practice);
  }, []);

  const leave = useCallback(() => {
    game.current?.leaveMatch();
    setMatch('none'); setResult(null); setScreen('menu'); setError(null);
  }, []);

  const go = (s: Screen, from: Screen = 'menu') => { game.current?.audio.unlock(); game.current?.audio.ui('click'); game.current?.audio.music('menu'); setBack(from); setScreen(s); };

  // keyboard: Escape backs out of shell screens; Enter deploys from the practice screen
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (match !== 'none') { if (e.code === 'Enter' && match === 'deploy') game.current?.resume(); return; }
      if (e.code === 'Escape' && screen !== 'menu') setScreen(back === screen ? 'menu' : back);
      if (e.code === 'Enter' && screen === 'practice') startMatch();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [screen, back, match, startMatch]);

  if (boot === 'unsupported' || boot === 'failed') {
    return (
      <div className="loader">
        <div className="panel errorbox">
          <h1>{boot === 'unsupported' ? 'This browser cannot run Breachline' : 'Breachline failed to start'}</h1>
          {problems.map((p) => <p key={p}>• {p}</p>)}
          <p>Breachline needs a desktop browser with WebGL 2, WebAssembly, Web Workers and Pointer Lock — current Chrome, Edge or Firefox with hardware acceleration enabled.</p>
          <button className="btn sm" onClick={() => location.reload()}>Try again</button>
        </div>
      </div>
    );
  }
  if (boot === 'loading') {
    return <div className="loader"><div className="big">BREACH<span>LINE</span></div><div className="bar"><b /></div><div className="msg">{bootMsg}</div></div>;
  }

  const errorModal = error && (
    <div className="modal" style={{ zIndex: 5 }}>
      <div className="card">
        <h1>{({ pointerlock: 'Mouse capture refused', server: 'Match server stopped', version: 'Version mismatch', full: 'Match is full', loadout: 'Loadout rejected', context: 'Graphics context lost' } as Record<string, string>)[error.code] ?? 'Something went wrong'}</h1>
        <div className="sub">{error.code}</div>
        <p className="note">{error.detail || 'No further detail was reported.'}</p>
        <div className="nav">
          {error.code === 'pointerlock' && <button className="btn primary" onClick={() => { setError(null); game.current?.resume(); }}>Try again</button>}
          {error.code === 'context' && <button className="btn sm" onClick={() => setError(null)}>Dismiss</button>}
          {(error.code === 'server' || error.code === 'version' || error.code === 'full' || error.code === 'loadout') && <button className="btn primary" onClick={() => { setError(null); startMatch(); }}>Restart match</button>}
          <button className="btn sm" onClick={leave}>Main menu</button>
        </div>
      </div>
    </div>
  );

  if (match !== 'none') {
    return (
      <>
        {match === 'connecting' && <div className="modal"><div className="card"><h1>Starting match</h1><div className="sub">Spinning up the local match server and seating bots</div><div className="loader" style={{ position: 'static', background: 'none' }}><div className="bar"><b /></div></div></div></div>}
        {match === 'deploy' && (
          <div className="modal" onClick={() => game.current?.resume()} style={{ cursor: 'pointer' }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <h1>Click to deploy</h1>
              <div className="sub">Your mouse will be captured · Esc opens the pause menu</div>
              <button className="btn primary" style={{ width: '100%', justifyContent: 'center' }} onClick={(e) => { e.stopPropagation(); game.current?.resume(); }}>Deploy to K-17</button>
            </div>
          </div>
        )}
        {match === 'paused' && (
          <div className="modal">
            <div className={'card' + (pauseTab === 'settings' ? ' wide' : '')}>
              <h1>Paused</h1>
              <div className="sub">The match keeps running — this is a live room</div>
              {pauseTab === 'main' ? (
                <>
                  <div className="nav">
                    <button className="btn primary" onClick={() => game.current?.resume()}>Resume</button>
                    <button className="btn" onClick={() => setPauseTab('settings')}>Settings</button>
                    <button className="btn danger" onClick={leave}>Leave match</button>
                  </div>
                  <div style={{ marginTop: 14 }}><ControlsList binds={profile.settings.binds} /></div>
                </>
              ) : (
                <>
                  <div className="body" style={{ overflow: 'auto' }}><SettingsBody profile={profile} update={update} /></div>
                  <div className="nav" style={{ flexDirection: 'row', marginTop: 10 }}>
                    <button className="btn sm" onClick={() => setPauseTab('main')}>Back</button>
                    <button className="btn sm" onClick={() => game.current?.resume()}>Resume</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        {match === 'results' && result && <Results result={result} outcome={outcome} profile={profile} onAgain={startMatch} onMenu={leave} />}
        {errorModal}
      </>
    );
  }

  if (screen === 'practice') return <>{<PracticeSetup profile={profile} update={update} onStart={startMatch} onBack={() => setScreen('menu')} onEdit={() => go('loadouts', 'practice')} />}{errorModal}</>;
  if (screen === 'loadouts') return <LoadoutEditor profile={profile} update={update} onBack={() => setScreen(back === 'practice' ? 'practice' : 'menu')} />;
  if (screen === 'profile') return <ProfileScreen profile={profile} update={update} onBack={() => setScreen('menu')} onReset={() => setProfile(resetProfile(profile))} />;
  if (screen === 'settings') {
    return (
      <div className="shell solid"><div className="page">
        <div className="head"><div><h1>Settings</h1><div className="sub">Saved automatically</div></div><button className="btn sm" onClick={() => setScreen('menu')}>Back</button></div>
        <div className="body"><SettingsBody profile={profile} update={update} /></div>
      </div></div>
    );
  }
  if (screen === 'credits') {
    return (
      <div className="shell solid"><div className="page">
        <div className="head"><div><h1>Credits</h1><div className="sub">Breachline · Oneshot Arcade vertical slice</div></div><button className="btn sm" onClick={() => setScreen('menu')}>Back</button></div>
        <div className="body"><div className="panel" style={{ maxWidth: 820 }}>
          <h2>About this build</h2>
          <p className="note">Breachline is an original arcade military shooter set on a fictional island relay station. Its factions (Tidewatch Station Security and Ferrous Recovery Group), map (Relay Station K-17), weapons, equipment, support actions, interface, sounds and music were created for this project. Nothing is taken from an existing game.</p>
          <h2>Assets</h2>
          <p className="note">Every model, texture, sound effect and piece of music is generated procedurally in code at runtime — there are no image, mesh or audio files in the build. See ASSETS.md in the source for the full list.</p>
          <h2>Technology</h2>
          <p className="note">Babylon.js (rendering, Apache-2.0) · Rapier (physics, Apache-2.0) · React (shell UI, MIT) · TypeScript · Vite. Text uses fonts already installed on your system.</p>
          <h2>How it runs</h2>
          <p className="note">Practice matches run an authoritative room in a Web Worker inside your browser. Your client sends input commands, predicts its own movement and weapon timing, and reconciles against 20 Hz binary snapshots — the same protocol a hosted room would speak. No account, network service or telemetry is involved; your profile lives in this browser's local storage.</p>
        </div></div>
      </div></div>
    );
  }

  return (
    <div className="shell dim">
      <div className="menu">
        <div className="logo">Breach<span>line</span></div>
        <div className="tagline">Relay Station K-17 · 6v6 Team Clash</div>
        <div className="nav">
          <button className="btn primary" onClick={() => go('practice')}>Practice<small>vs bots · offline</small></button>
          <button className="btn" onClick={() => go('loadouts')}>Loadouts<small>5 slots</small></button>
          <button className="btn" onClick={() => go('profile')}>Profile<small>level · stats · challenges</small></button>
          <button className="btn" onClick={() => go('settings')}>Settings</button>
          <button className="btn" onClick={() => go('credits')}>Credits</button>
        </div>
        <XpCard profile={profile} />
        <div className="foot">This build ships the offline Practice mode: a full authoritative match against bots, hosted in your browser.<br />Desktop · keyboard and mouse · WebGL 2</div>
      </div>
      {errorModal}
    </div>
  );
}

function demoOverrides(): Partial<Profile['practice']> {
  const q = new URLSearchParams(location.search);
  const out: Partial<Profile['practice']> = {};
  if (q.get('score')) out.scoreLimit = Math.max(3, Number(q.get('score')));
  if (q.get('latency')) out.latency = q.get('latency') as string;
  if (q.get('size')) out.teamSize = Math.max(1, Math.min(6, Number(q.get('size'))));
  if (q.get('diff')) out.difficulty = q.get('diff') as Profile['practice']['difficulty'];
  return out;
}
