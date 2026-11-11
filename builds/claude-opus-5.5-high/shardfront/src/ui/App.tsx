import { useCallback, useEffect, useRef, useState } from 'react';
import { GameClient } from '../game/client';
import type { MatchRunner } from '../game/runner';
import { audio } from '../audio/audio';
import { FACTIONS, type FactionId } from '../faction-data';
import { sanitizeLabel, type MatchSetup, type ReplayFile } from '../network-protocol/protocol';
import { BANNERS, createRepository, DEFAULT_PROFILE, DEFAULT_SETTINGS, type MatchRecord, type Profile, type Settings } from '../persistence/store';
import { Hud } from './Hud';
import { Credits, MainMenu, PostGame, ReplaysScreen, SettingsScreen, SkirmishSetup, TechArchive, type Difficulty } from './Screens';

const repo = createRepository();

type Screen =
  | { s: 'menu' } | { s: 'setup' } | { s: 'settings' } | { s: 'archive' } | { s: 'replays' } | { s: 'credits' }
  | { s: 'game'; setup: MatchSetup; replay: ReplayFile | null }
  | { s: 'post'; runner: MatchRunner; xp: number }
  | { s: 'error'; title: string; detail: string };

export function App() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [screen, setScreen] = useState<Screen>({ s: 'menu' });
  const [notice, setNotice] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await repo.loadSettings();
      const p = await repo.loadProfile();
      setSettings(s.value); setProfile(p.value);
      audio.volumes = { ...s.value.audio };
      if (s.recovered || p.recovered) setNotice('Some saved data was unreadable and has been reset to defaults. Your other data is intact.');
      setMatches(await repo.listMatches());
      setReady(true);
    })().catch(() => { setNotice('Local storage is unavailable (private mode?). Progress will not be saved this session.'); setReady(true); });
  }, []);

  const changeSettings = useCallback((s: Settings) => {
    setSettings(s);
    audio.volumes = { ...s.audio }; audio.applyVolumes();
    void repo.saveSettings(s).catch(() => {});
  }, []);

  const startSkirmish = (f: FactionId, enemy: FactionId, d: Difficulty) => {
    const setup: MatchSetup = {
      seed: (Math.random() * 2 ** 31) | 0, map: 'glass_ravine', mode: 'skirmish',
      players: [{ faction: f, ai: null, name: sanitizeLabel(settings.playerName) }, { faction: enemy, ai: d, name: `${FACTIONS[enemy].name.split(' ')[0]} AI` }],
    };
    setScreen({ s: 'game', setup, replay: null });
  };
  const startTutorial = () => {
    const setup: MatchSetup = { seed: 4242, map: 'glass_ravine', mode: 'tutorial', players: [{ faction: 'helix', ai: null, name: sanitizeLabel(settings.playerName) }, { faction: 'verdant', ai: 'tutorial', name: 'Training Grove' }] };
    setScreen({ s: 'game', setup, replay: null });
  };
  const startBenchmark = () => {
    const setup: MatchSetup = { seed: 777, map: 'glass_ravine', mode: 'benchmark', players: [{ faction: 'helix', ai: 'idle', name: 'Helix' }, { faction: 'verdant', ai: 'idle', name: 'Verdant' }] };
    setScreen({ s: 'game', setup, replay: null });
  };
  // expose for automated capture & dev tooling (no network, no secrets)
  useEffect(() => { (window as unknown as { __shardfront: unknown }).__shardfront = { startSkirmish, startTutorial, startBenchmark }; });
  useEffect(() => {
    if (!ready) return;
    const q = new URLSearchParams(location.search);
    if (q.get('benchmark') === '1') startBenchmark();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const onGameOver = async (runner: MatchRunner) => {
    const sim = runner.sim;
    if (runner.replay || sim.setup.mode === 'benchmark') { setScreen({ s: 'post', runner, xp: 0 }); return; }
    const win = sim.winner === 0;
    const minutes = sim.tick / 1200;
    const xp = Math.round((win ? 120 : 40) + minutes * 8 + (sim.setup.players[1].ai === 'hard' ? 80 : sim.setup.players[1].ai === 'normal' ? 30 : 0) * (win ? 1 : 0));
    const np = structuredClone(profile);
    const f = sim.players[0].faction;
    np.mastery[f] += xp;
    if (sim.setup.mode === 'tutorial' && win) { np.tutorialComplete = true; if (!np.badges.includes('Tutorial Graduate')) np.badges.push('Tutorial Graduate'); }
    if (win && sim.setup.players[1].ai === 'hard' && !np.badges.includes('Hard AI Breaker')) np.badges.push('Hard AI Breaker');
    if (win && !np.badges.includes(`${FACTIONS[f].name} Victor`)) np.badges.push(`${FACTIONS[f].name} Victor`);
    const total = np.mastery.helix + np.mastery.verdant;
    np.banner = [...BANNERS].reverse().find((b) => b.xp <= total)?.id ?? np.banner;
    setProfile(np);
    const id = `m${Date.now()}`;
    const rec: MatchRecord = {
      id, date: Date.now(), faction: f, enemyFaction: sim.players[1].faction, difficulty: sim.setup.players[1].ai ?? 'none', result: win ? 'victory' : 'defeat',
      durationTicks: sim.tick, mode: sim.setup.mode, replayId: id,
      stats: { oreCollected: sim.players[0].stats.oreCollected, fluxCollected: sim.players[0].stats.fluxCollected, unitsCreated: sim.players[0].stats.unitsCreated, unitsLost: sim.players[0].stats.unitsLost, kills: sim.players[0].stats.kills },
    };
    try {
      await repo.saveProfile(np);
      await repo.saveReplay(id, runner.toReplay());
      await repo.addMatch(rec);
      setMatches(await repo.listMatches());
    } catch { setNotice('Could not save the match to local storage.'); }
    setScreen({ s: 'post', runner, xp });
  };

  const watchReplay = async (m: MatchRecord) => {
    if (!m.replayId) return;
    const r = await repo.loadReplay(m.replayId);
    if (!r || !r.setup || !Array.isArray(r.commands)) { setNotice('That replay is missing or corrupted.'); return; }
    setScreen({ s: 'game', setup: r.setup, replay: r });
  };

  if (!ready) return <div className="screen"><div className="center">Loading profile…</div></div>;
  switch (screen.s) {
    case 'menu': return <MainMenu profile={profile} notice={notice} go={(id) => { setNotice(''); if (id === 'tutorial') startTutorial(); else setScreen({ s: id } as Screen); }} />;
    case 'setup': return <SkirmishSetup onBack={() => setScreen({ s: 'menu' })} onStart={startSkirmish} />;
    case 'settings': return <SettingsScreen settings={settings} onChange={changeSettings} onBenchmark={startBenchmark} onBack={() => setScreen({ s: 'menu' })} onReset={async () => { await repo.resetAll(); setSettings(structuredClone(DEFAULT_SETTINGS)); setProfile(structuredClone(DEFAULT_PROFILE)); setMatches([]); setNotice('All local data was reset.'); setScreen({ s: 'menu' }); }} />;
    case 'archive': return <TechArchive onBack={() => setScreen({ s: 'menu' })} />;
    case 'replays': return <ReplaysScreen matches={matches} onWatch={watchReplay} onBack={() => setScreen({ s: 'menu' })} />;
    case 'credits': return <Credits onBack={() => setScreen({ s: 'menu' })} />;
    case 'error': return <ErrorScreen title={screen.title} detail={screen.detail} onBack={() => setScreen({ s: 'menu' })} />;
    case 'post': return <PostGame runner={screen.runner} xpGained={screen.xp}
      onRematch={() => { const st = screen.runner.sim.setup; setScreen({ s: 'game', setup: { ...st, seed: (Math.random() * 2 ** 31) | 0 }, replay: null }); }}
      onLobby={() => setScreen({ s: 'menu' })}
      onReplay={() => setScreen({ s: 'game', setup: screen.runner.sim.setup, replay: screen.runner.replay ?? screen.runner.toReplay() })} />;
    case 'game': return <GameView key={screen.setup.seed + ':' + (screen.replay ? 'r' : 'g')} setup={screen.setup} replay={screen.replay} settings={settings} onSettings={changeSettings}
      onGameOver={onGameOver} onQuit={() => setScreen({ s: 'menu' })} onError={(t, d) => setScreen({ s: 'error', title: t, detail: d })} />;
  }
}

function ErrorScreen({ title, detail, onBack }: { title: string; detail: string; onBack: () => void }) {
  return (
    <div className="screen"><div className="bgArt" />
      <div className="center"><div className="errorBox"><h2>{title}</h2><p>{detail}</p><button className="btn" onClick={onBack}>Back to menu</button></div></div>
    </div>
  );
}

function GameView({ setup, replay, settings, onSettings, onGameOver, onQuit, onError }: {
  setup: MatchSetup; replay: ReplayFile | null; settings: Settings; onSettings: (s: Settings) => void;
  onGameOver: (r: MatchRunner) => void; onQuit: () => void; onError: (t: string, d: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [client, setClient] = useState<GameClient | null>(null);
  const [stage, setStage] = useState({ label: 'Preparing match…', pct: 5 });
  const [showSettings, setShowSettings] = useState(false);
  const [bench, setBench] = useState('');
  const [targeting, setTargeting] = useState(false);

  useEffect(() => {
    let disposed = false;
    let c: GameClient | null = null;
    const next = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
    (async () => {
      try {
        setStage({ label: 'Generating Glass Ravine terrain…', pct: 20 }); await next();
        if (disposed) return;
        c = new GameClient(canvasRef.current!, overlayRef.current!, setup, settings, replay);
        setStage({ label: 'Compiling shaders…', pct: 65 }); await next();
        c.renderer.renderer.compile(c.renderer.scene, c.renderer.camera);
        setStage({ label: 'Starting simulation…', pct: 92 }); await next();
        if (disposed) { c.dispose(); return; }
        c.onGameOver = (r) => onGameOver(r);
        c.onBenchmark = (s) => setBench(s);
        c.applySettings(settings);
        c.start();
        canvasRef.current?.focus();
        setClient(c);
        (window as unknown as { __client: GameClient }).__client = c;
      } catch (e) {
        console.error(e);
        onError('Could not start the match', `The 3D renderer failed to initialize (${(e as Error).message}). Try lowering graphics settings, enabling hardware acceleration, or updating your browser/GPU driver.`);
      }
    })();
    return () => { disposed = true; c?.dispose(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { client?.applySettings(settings); }, [client, settings]);
  useEffect(() => {
    if (!client) return;
    return client.hud.subscribe(() => setTargeting(client.mode.m !== 'normal' && client.mode.m !== 'palette'));
  }, [client]);

  return (
    <div className={'game' + (targeting ? ' targeting' : '')}>
      <canvas ref={canvasRef} className="main" tabIndex={0} aria-label="Battlefield" />
      <canvas ref={overlayRef} className="overlay" />
      {client && <Hud client={client} onOpenSettings={() => setShowSettings(true)} onQuit={(surrender) => {
        if (surrender) { client.setMenuOpen(false); client.issue('surrender', {}, []); }
        else onQuit();
      }} />}
      {!client && (
        <div className="screen" style={{ background: 'var(--bg)' }}>
          <div className="bgArt" />
          <div className="center">
            <h1 className="logo" style={{ fontSize: 40 }}>SHARD<span>FRONT</span></h1>
            <div className="progress"><i style={{ width: `${stage.pct}%` }} /></div>
            <div className="muted">{stage.label}</div>
          </div>
        </div>
      )}
      {showSettings && client && <SettingsScreen inGame settings={settings} onChange={onSettings} onBack={() => setShowSettings(false)} onReset={() => {}} />}
      {bench && (
        <div className="modalBack"><div className="hudPanel modal"><h2>Benchmark complete</h2><p>{bench}</p><button className="btn primary" onClick={onQuit}>Back to menu</button></div></div>
      )}
    </div>
  );
}
