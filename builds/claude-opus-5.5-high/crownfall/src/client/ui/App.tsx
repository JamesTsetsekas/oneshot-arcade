// App shell: screen state machine from launch through draft, match, results and requeue.
import React, { useEffect, useRef, useState } from 'react';
import { MainMenu, PlayMenu, HeroesCodex, ItemsCodex, History, Credits } from './Menus';
import { Queue, Draft, DraftOutcome } from './Draft';
import { Results } from './Results';
import { SettingsPanel } from './SettingsPanel';
import { Hud } from './Hud';
import { MatchController } from '../runtime/controller';
import { loadProfile, loadSettings, saveSettings, recordMatch, storageNotice, Settings, Profile } from '../../services/profile';
import { makeSetup, defaultTalents } from '../../services/matchmaker';
import type { MatchResult, MatchSetup } from '../../protocol/messages';
import { HEROES } from '../../shared/heroes';
import { Portrait } from './icons';
import { BOT_NAMES } from '../../ai/bot';
import { audio } from '../../audio/audio';

type Screen = 'menu' | 'play' | 'queue' | 'draft' | 'practiceDraft' | 'match' | 'results' | 'heroes' | 'items' | 'history' | 'settings' | 'credits' | 'error';

export function App({ demo }: { demo: { minutes: number; seed: number } | null }) {
  const [screen, setScreen] = useState<Screen>('menu');
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [profile, setProfile] = useState<Profile>(loadProfile);
  const [seed, setSeed] = useState(() => (Date.now() & 0xffff) + 1);
  const [names, setNames] = useState<string[]>([]);
  const [setup, setSetup] = useState<MatchSetup | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [reward, setReward] = useState<{ xp: number; mastery: number } | null>(null);
  const [practice, setPractice] = useState<{ allies: number; enemies: number; diff: 'easy' | 'normal' | 'hard' }>({ allies: 2, enemies: 3, diff: 'normal' });
  const [error, setError] = useState<string | null>(null);
  const [settingsOverlay, setSettingsOverlay] = useState(false);
  const [notice] = useState(storageNotice);

  useEffect(() => {
    if (!demo) return;
    const s = makeSetup('unranked', demo.seed, { hero: 'suri', talents: defaultTalents('suri') }, 'Demo');
    s.players[0].bot = true;
    s.warmup = demo.minutes * 60;
    setSetup(s); setScreen('match');
  }, []);

  const changeSettings = (s: Settings) => { setSettings(s); saveSettings(s); audio.setVolumes(s.master, s.music, s.sfx); };
  const go = (s: string) => {
    audio.ensure(); audio.play('click');
    if (s === 'tutorial') {
      const st = makeSetup('tutorial', seed, { hero: 'suri', talents: ['phase', 'mend'] }, settings.playerName, { allyCount: 0, enemyCount: 0 });
      setSetup(st); setScreen('match');
      return;
    }
    if (s === 'queue') setSeed((x) => x + 1);
    setScreen(s as Screen);
  };
  const startMatch = (mode: 'unranked' | 'practice', o: DraftOutcome) => {
    const st = makeSetup(mode, seed, { hero: o.hero, talents: o.talents }, settings.playerName, {
      allies: o.allies, enemies: o.enemies, botNames: o.botNames, difficulty: mode === 'practice' ? practice.diff : settings.difficulty,
      allyCount: mode === 'practice' ? practice.allies : 2, enemyCount: mode === 'practice' ? practice.enemies : 3,
    });
    setSetup(st); setScreen('match');
  };
  const onResult = (r: MatchResult) => {
    const p = structuredClone(profile);
    p.history = profile.history.slice();
    if (r.mode === 'tutorial') p.tutorialDone = true;
    const rw = recordMatch(p, r, 0);
    setProfile(p); setReward(rw); setResult(r); setScreen('results');
  };

  switch (screen) {
    case 'menu': return <MainMenu go={go} profile={profile} notice={notice} />;
    case 'play': return <PlayMenu go={go} back={() => setScreen('menu')} onPractice={(a, e, d) => { setPractice({ allies: a, enemies: e, diff: d }); setScreen('practiceDraft'); }} />;
    case 'queue': return <Queue seed={seed} onCancel={() => setScreen('play')} onReady={(n) => { setNames(n); setScreen('draft'); }} />;
    case 'draft': return <Draft seed={seed} profile={profile} botNames={names} onBack={() => setScreen('menu')} onLock={(o) => startMatch('unranked', o)} />;
    case 'practiceDraft': return <Draft seed={seed} profile={profile} title="Practice — choose your hero" botNames={BOT_NAMES.slice(3)} allyCount={practice.allies} enemyCount={practice.enemies} timer={90} onBack={() => setScreen('play')} onLock={(o) => startMatch('practice', o)} />;
    case 'match': return setup ? <>{settingsOverlay && <div className="settings-overlay"><SettingsPanel settings={settings} onChange={changeSettings} back={() => setSettingsOverlay(false)} /></div>}<MatchView key={seed + (setup.mode)} setup={setup} settings={settings} onResult={onResult} onLeave={() => { setScreen('menu'); }} onError={(m) => { setError(m); setScreen('error'); }} onSettings={() => setSettingsOverlay(true)} demo={!!demo} /></> : null;
    case 'results': return result ? <Results r={result} reward={reward} onRequeue={() => go(result.mode === 'tutorial' ? 'play' : result.mode === 'practice' ? 'play' : 'queue')} onMenu={() => setScreen('menu')} onReview={() => setScreen('heroes')} /> : null;
    case 'heroes': return <HeroesCodex back={() => setScreen('menu')} profile={profile} />;
    case 'items': return <ItemsCodex back={() => setScreen('menu')} />;
    case 'history': return <History back={() => setScreen('menu')} profile={profile} />;
    case 'settings': return <SettingsPanel settings={settings} onChange={changeSettings} back={() => setScreen('menu')} />;
    case 'credits': return <Credits back={() => setScreen('menu')} />;
    case 'error': return <div className="screen error-screen"><h1>Something went wrong</h1><p>{error}</p><button className="btn" onClick={() => location.reload()}>Reload</button><button className="btn" onClick={() => setScreen('menu')}>Main menu</button></div>;
  }
}

function MatchView({ setup, settings, onResult, onLeave, onError, onSettings, demo }: { setup: MatchSetup; settings: Settings; onResult: (r: MatchResult) => void; onLeave: () => void; onError: (m: string) => void; onSettings: () => void; demo: boolean }) {
  const game = useRef<HTMLCanvasElement>(null);
  const over = useRef<HTMLCanvasElement>(null);
  const [ctl, setCtl] = useState<MatchController | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  useEffect(() => {
    let c: MatchController | null = null;
    // let the loading screen paint before heavy map construction
    const t = setTimeout(() => {
      try {
        const mini = document.createElement('canvas'); mini.width = 270; mini.height = 207;
        const big = document.createElement('canvas'); big.width = 900; big.height = 690;
        c = new MatchController(setup, settings, game.current!, over.current!, mini, big);
      } catch (e) { onError(`Failed to initialise the renderer: ${(e as Error).message}`); return; }
      c.onResult = onResult;
      c.onError = onError;
      c.session.listeners.snapshot.push(() => setLoaded(true));
      (window as any).__crownfall = c;
      c.start();
      if (demo) { c.renderer.height = 30; (c as any).follow = true; }
      setCtl(c);
    }, 60);
    return () => { clearTimeout(t); c?.dispose(); };
  }, []);
  useEffect(() => {
    if (!ctl) return;
    ctl.settings = settings;
    ctl.renderer.shakeOn = settings.shake;
    ctl.overlay.damageNumbers = settings.damageNumbers;
    ctl.renderer.colorblind = ctl.overlay.colorblind = ctl.minimap.colorblind = ctl.mapBig.colorblind = settings.colorblind;
    audio.setVolumes(settings.master, settings.music, settings.sfx);
  }, [settings, ctl]);
  const leave = () => { setConfirmLeave(true); };
  return (
    <div className="match-view">
      <canvas ref={game} className="game-canvas" />
      <canvas ref={over} className="overlay-canvas" />
      {ctl && loaded && <Hud c={ctl} settings={settings} onLeave={leave} onSettings={onSettings} />}
      {(!ctl || !loaded) && <Loading setup={setup} />}
      {confirmLeave && (
        <div className="modal-back"><div className="menu-panel"><h2>Leave match?</h2><p className="muted">The match will end and count as abandoned.</p><button className="btn danger" onClick={onLeave}>Leave</button><button className="btn" onClick={() => setConfirmLeave(false)}>Stay</button></div></div>
      )}
    </div>
  );
}

function Loading({ setup }: { setup: MatchSetup }) {
  return (
    <div className="loading">
      <h1>The Broken Diadem</h1>
      <div className="load-teams">
        {[0, 1].map((t) => (
          <div key={t} className={`load-team t${t}`}>
            <h3>{t === 0 ? 'Dawn Guild' : 'Dusk Guild'}</h3>
            {setup.players.filter((p) => p.team === t).map((p) => <div key={p.slot} className="load-card"><Portrait hero={p.hero} size={64} /><div><b>{p.name}</b><div className="muted small">{HEROES[p.hero].name}{p.bot ? ' · bot' : ''}</div></div></div>)}
          </div>
        ))}
      </div>
      <div className="load-bar"><i /></div>
      <p className="muted">Raising causeways, seeding mistwood, waking the Crown Engine…</p>
      <p className="muted small tip">Tip: towers prefer minions — but strike an enemy hero under their tower and the tower turns on you.</p>
    </div>
  );
}
