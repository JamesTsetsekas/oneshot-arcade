import { useCallback, useEffect, useRef, useState } from "react";
import { GameSession, DEFAULT_PRACTICE, type PracticeConfig } from "../runtime/game";
import { loadSettings, saveSettings, type Settings } from "../runtime/settings";
import { loadProfile, saveProfile, resetProfile, exportProfile, type Profile, type MatchResult } from "../runtime/profile";
import { AudioEngine } from "../audio/audio";
import { LoadoutEditor, ProfilePanel, SettingsPanel, Credits, Slider } from "./panels";
import { WEAPONS, weaponLabel } from "../../shared/content/weapons";
import { levelFromXp, MAX_LEVEL } from "../../shared/content/progression";
import { TEAM_NAMES } from "../renderer/characters";
import type { World } from "../../shared/sim/world";
import type { PlayerState } from "../../shared/sim/types";
import type { Loadout } from "../../shared/content/loadout";

type Screen = "menu" | "practice" | "loadout" | "profile" | "settings" | "credits" | "loading" | "match" | "results";

interface ResultData {
  players: Array<{ id: number; name: string; team: number; kills: number; deaths: number; assists: number; score: number; devices: number; isMe: boolean }>;
  teamScore: [number, number];
  winner: number;
  reason: string;
  me: PlayerState["stats"];
  weaponStats: PlayerState["weaponStats"];
  result: MatchResult;
  cfg: PracticeConfig;
  duration: number;
}

function snapshot(world: World, me: PlayerState, result: MatchResult, cfg: PracticeConfig): ResultData {
  return {
    players: world.players.map((p) => ({ id: p.id, name: p.name, team: p.team, kills: p.stats.kills, deaths: p.stats.deaths, assists: p.stats.assists, score: p.stats.score, devices: p.stats.supportDestroyed, isMe: p.id === me.id })),
    teamScore: [world.match.teamScore[0], world.match.teamScore[1]], winner: world.match.winner, reason: world.match.endReason,
    me: { ...me.stats }, weaponStats: JSON.parse(JSON.stringify(me.weaponStats)), result, cfg, duration: world.match.clock,
  };
}

export function App() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [profile, setProfile] = useState<Profile>(() => loadProfile());
  const [cfg, setCfg] = useState<PracticeConfig>(DEFAULT_PRACTICE);
  const [paused, setPaused] = useState<null | "escape" | "lockLost">(null);
  const [pauseTab, setPauseTab] = useState<"main" | "settings">("main");
  const [error, setError] = useState<string | null>(null);
  const [lockMsg, setLockMsg] = useState<string | null>(null);
  const [results, setResults] = useState<ResultData | null>(null);
  const [selSlot, setSelSlot] = useState(0);
  const sessionRef = useRef<GameSession | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const audioRef = useRef<AudioEngine | null>(null);
  if (!audioRef.current) audioRef.current = new AudioEngine(() => settingsRef.current);
  const audio = audioRef.current;
  const cfgRef = useRef(cfg);
  cfgRef.current = cfg;

  const musicKick = useCallback(() => { audio.init(); void audio.resume().then(() => { if (!sessionRef.current) audio.startMusic("menu"); }); }, [audio]);

  const updateSettings = useCallback((s: Settings) => { setSettings(s); settingsRef.current = s; saveSettings(s); sessionRef.current?.applySettings(); audio.applyVolumes(); }, [audio]);
  const updateProfile = useCallback((p: Profile) => { setProfile({ ...p }); profileRef.current = p; saveProfile(p); }, []);

  const endSession = useCallback(() => {
    const s = sessionRef.current;
    if (s) { s.dispose(); sessionRef.current = null; }
    hostRef.current?.querySelectorAll("canvas").forEach((c) => c.remove());
  }, []);

  const startMatch = useCallback(async (c: PracticeConfig) => {
    musicKick();
    setError(null); setLockMsg(null); setPaused(null); setPauseTab("main");
    endSession();
    setScreen("loading");
    await new Promise((r) => setTimeout(r, 60));
    try {
      const canvas = document.createElement("canvas");
      canvas.id = "game"; canvas.tabIndex = 0;
      hostRef.current!.appendChild(canvas);
      const session = new GameSession(canvas, hudRef.current!, () => settingsRef.current, profileRef.current, audio, c, {
        onPauseRequest: (reason) => { setPauseTab("main"); setPaused(reason); },
        onEnded: (world, me, result) => {
          const data = snapshot(world, me, result, c);
          setProfile({ ...profileRef.current });
          setResults(data);
          endSession();
          audio.setMusicMode("menu"); audio.startMusic("menu");
          setScreen("results");
        },
        onError: (m) => setError(m),
        onLockError: (m) => setLockMsg(m),
      });
      sessionRef.current = session;
      session.start();
      setScreen("match");
      await session.input.lock();
      if (!session.input.locked) { session.hud.showLockHint(true); session.pause(); setPaused("lockLost"); }
    } catch (e) {
      endSession();
      setScreen("menu");
      setError(`The match could not start: ${(e as Error).message}`);
    }
  }, [audio, endSession, musicKick]);

  const resume = useCallback(async () => {
    setPaused(null); setLockMsg(null);
    await sessionRef.current?.resume();
    if (sessionRef.current && !sessionRef.current.input.locked) { setPaused("lockLost"); sessionRef.current.pause(); }
  }, []);
  const quitToMenu = useCallback(() => { endSession(); setPaused(null); audio.setMusicMode("menu"); audio.startMusic("menu"); setScreen("menu"); }, [audio, endSession]);

  useEffect(() => () => endSession(), [endSession]);

  const lv = levelFromXp(profile.xp);
  const inMatch = screen === "match" || screen === "loading";

  return (
    <>
      <div ref={hostRef} />
      <div ref={hudRef} />
      {screen === "loading" && (<div className="loading"><div className="spinner" /><div>PREPARING RELAY STATION K-17</div><small style={{ color: "var(--dim)", letterSpacing: "0.2em" }}>Building map, characters and shaders…</small></div>)}
      {!inMatch && screen !== "results" && (
        <div className="shell" onClick={musicKick}>
          <div className="shell-bg" />
          {screen === "menu" && <MainMenu lv={lv.level} onPlay={() => { setScreen("practice"); }} onScreen={setScreen} />}
          {screen === "practice" && <PracticeSetup cfg={cfg} setCfg={setCfg} profile={profile} onSelect={(i) => updateProfile({ ...profile, selected: i })} onStart={() => void startMatch(cfg)} onBack={() => setScreen("menu")} onLoadout={() => setScreen("loadout")} />}
          {screen === "loadout" && (<>
            <TopBar title="Loadouts" onBack={() => setScreen("menu")} lv={lv.level} />
            <LoadoutEditor loadouts={profile.loadouts} selected={selSlot} onSelect={setSelSlot} onChange={(i, l: Loadout) => { const lo = [...profile.loadouts]; lo[i] = l; updateProfile({ ...profile, loadouts: lo }); }} />
          </>)}
          {screen === "profile" && (<>
            <TopBar title="Profile" onBack={() => setScreen("menu")} lv={lv.level} />
            <div className="wrap" style={{ overflow: "auto" }}><div style={{ width: "min(860px,100%)", margin: "0 auto" }}><ProfilePanel profile={profile} onReset={() => { updateProfile(resetProfile()); }} onExport={() => downloadJson(exportProfile(profile))} /></div></div>
          </>)}
          {screen === "settings" && (<>
            <TopBar title="Settings" onBack={() => setScreen("menu")} lv={lv.level} />
            <div className="wrap" style={{ overflow: "auto" }}><div className="card" style={{ width: "min(860px,100%)", margin: "0 auto", alignSelf: "flex-start" }}><SettingsPanel settings={settings} onChange={updateSettings} /></div></div>
          </>)}
          {screen === "credits" && (<>
            <TopBar title="Credits" onBack={() => setScreen("menu")} lv={lv.level} />
            <div className="wrap"><div style={{ width: "min(760px,100%)", margin: "0 auto" }}><Credits /></div></div>
          </>)}
        </div>
      )}
      {screen === "results" && results && <Results data={results} onAgain={() => void startMatch(results.cfg)} onMenu={() => { setScreen("menu"); }} onLoadout={() => setScreen("loadout")} />}
      {paused && screen === "match" && (
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="box" style={pauseTab === "settings" ? { width: "min(780px, 94vw)" } : undefined}>
            {pauseTab === "main" ? (<>
              <h2>{paused === "lockLost" ? "Paused" : "Match paused"}</h2>
              <p>{paused === "lockLost" ? "Pointer Lock was released (window lost focus, tab hidden, or the browser refused it). The match is paused: nothing moves while you are away." : "The simulation is paused. Your match is safe."}</p>
              {lockMsg && <p style={{ color: "#ffd34d" }}>{lockMsg}</p>}
              <div className="menu" style={{ width: "100%", marginTop: 14 }}>
                <button className="btn primary" autoFocus onClick={() => void resume()}>Resume <small>click to re-lock the mouse</small></button>
                <button className="btn" onClick={() => setPauseTab("settings")}>Settings</button>
                <button className="btn danger" onClick={quitToMenu}>Quit to menu <small>progress for this match is lost</small></button>
              </div>
            </>) : (<>
              <h2>Settings</h2>
              <SettingsPanel settings={settings} onChange={updateSettings} />
              <div className="row" style={{ marginTop: 12 }}><button className="btn sm" onClick={() => setPauseTab("main")}>Back</button></div>
            </>)}
          </div>
        </div>
      )}
      {error && (
        <div className="modal" style={{ zIndex: 60 }}><div className="box" style={{ borderTopColor: "var(--bad)" }}><h2>Something went wrong</h2><p>{error}</p><div className="row"><button className="btn sm" onClick={() => { setError(null); if (screen === "match") quitToMenu(); }}>OK</button><button className="btn sm" onClick={() => location.reload()}>Reload page</button></div></div></div>
      )}
    </>
  );
}

function downloadJson(text: string): void {
  try {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    a.download = "breachline-profile.json";
    a.click();
  } catch { /* ignore */ }
}

function TopBar(p: { title: string; onBack(): void; lv: number }) {
  return (
    <div className="topbar">
      <div className="row"><button className="btn sm" onClick={p.onBack}>← Back</button><h2>{p.title}</h2></div>
      <span className="pill">Guest · Level {p.lv}</span>
    </div>
  );
}

function MainMenu(p: { lv: number; onPlay(): void; onScreen(s: Screen): void }) {
  return (
    <div className="wrap">
      <div className="col" style={{ justifyContent: "center" }}>
        <div className="brand">K-17 RELAY STATION · FICTIONAL SECURITY CONTRACT</div>
        <div className="logo">BREACH<span>LINE</span></div>
        <div className="tag">Fast-respawn 6v6 team combat on a storm-cleared island relay station. Aim, flank, earn Momentum, and call in support. Original factions, weapons and map.</div>
        <div className="menu">
          <button className="btn primary" autoFocus onClick={p.onPlay}>Practice <small>6v6 vs bots</small></button>
          <button className="btn" onClick={() => p.onScreen("loadout")}>Loadouts <small>5 slots</small></button>
          <button className="btn" onClick={() => p.onScreen("profile")}>Profile <small>Level {p.lv}</small></button>
          <button className="btn" onClick={() => p.onScreen("settings")}>Settings</button>
          <button className="btn" onClick={() => p.onScreen("credits")}>Credits</button>
        </div>
      </div>
      <div className="right">
        <div className="card"><h3>Team Clash · Relay Station K-17</h3>
          <div className="tips"><b>Mode:</b> 6v6 elimination, first to 75 points or the highest score at 8:00. Ties go to a 60-second sudden death (+5).<br /><b>Quick Play online</b> needs a hosted room service and is not included in this slice. Practice runs fully offline in your browser with server-style bots.</div></div>
        <div className="card"><h3>Controls</h3>
          <div className="ctl-grid"><kbd>WASD</kbd><span>Move</span><kbd>Shift</kbd><span>Sprint</span><kbd>Mouse</kbd><span>Aim</span><kbd>Ctrl / C</kbd><span>Crouch</span><kbd>LMB</kbd><span>Fire</span><kbd>Space</kbd><span>Jump / mantle</span><kbd>RMB</kbd><span>Aim down sights</span><kbd>R</kbd><span>Reload</span><kbd>F</kbd><span>Quick melee</span><kbd>G / Q</kbd><span>Lethal / tactical</span><kbd>1 / 2</kbd><span>Primary / sidearm</span><kbd>3 / 4</kbd><span>Select / deploy support</span><kbd>Tab</kbd><span>Scoreboard</span><kbd>M</kbd><span>Loadout (on death)</span><kbd>X</kbd><span>Ping</span><kbd>B</kbd><span>Inspect weapon</span></div></div>
      </div>
    </div>
  );
}

function PracticeSetup(p: { cfg: PracticeConfig; setCfg(c: PracticeConfig): void; profile: Profile; onSelect(i: number): void; onStart(): void; onBack(): void; onLoadout(): void }) {
  const c = p.cfg;
  const set = (patch: Partial<PracticeConfig>) => p.setCfg({ ...c, ...patch });
  const l = p.profile.loadouts[p.profile.selected];
  const Seg = <T extends string | number>(o: { value: T; options: Array<[T, string]>; onChange(v: T): void }) => <span className="seg">{o.options.map(([v, lbl]) => <button key={String(v)} className={o.value === v ? "on" : ""} onClick={() => o.onChange(v)}>{lbl}</button>)}</span>;
  return (
    <>
      <TopBar title="Practice" onBack={p.onBack} lv={levelFromXp(p.profile.xp).level} />
      <div className="wrap" style={{ overflow: "auto" }}>
        <div className="col" style={{ gap: 14, width: "min(620px, 100%)" }}>
          <div className="card"><h3>Match rules</h3>
            <div className="field" style={{ gridTemplateColumns: "170px 1fr" }}><label>Bot difficulty</label><Seg value={c.difficulty} onChange={(v) => set({ difficulty: v })} options={[["easy", "Easy"], ["normal", "Normal"], ["hard", "Hard"]]} /></div>
            <div className="field" style={{ gridTemplateColumns: "170px 1fr" }}><label>Score limit</label><Seg value={c.scoreLimit} onChange={(v) => set({ scoreLimit: v })} options={[[25, "25"], [50, "50"], [75, "75"]]} /></div>
            <div className="field" style={{ gridTemplateColumns: "170px 1fr" }}><label>Time limit</label><Seg value={c.timeLimit} onChange={(v) => set({ timeLimit: v })} options={[[180, "3 min"], [300, "5 min"], [480, "8 min"]]} /></div>
            <Slider label="Allied bots" value={c.allies} min={0} max={5} step={1} onChange={(v) => set({ allies: v })} />
            <Slider label="Enemy bots" value={c.enemies} min={1} max={6} step={1} onChange={(v) => set({ enemies: v })} />
            <p className="tips">Bot difficulty changes reaction time, aim noise, burst control and teamwork. It never changes bot health, damage or awareness: bots only see what a player could see.</p>
          </div>
          <div className="card"><h3>Loadout</h3>
            <div className="row">{p.profile.loadouts.map((x, i) => <button key={i} className={"btn sm" + (i === p.profile.selected ? " primary" : "")} onClick={() => p.onSelect(i)}>{i + 1}. {x.name}</button>)}</div>
            <p className="tips" style={{ marginTop: 10 }}><b>{weaponLabel(WEAPONS[l.primary])}</b> + {weaponLabel(WEAPONS[l.secondary])} · {l.attachments.length} attachments</p>
            <button className="btn sm" onClick={p.onLoadout}>Edit loadouts</button>
          </div>
          <button className="btn primary" onClick={p.onStart}>Deploy <small>pointer lock engages on start</small></button>
        </div>
        <div className="right"><div className="card"><h3>Briefing</h3><div className="tips"><b>{TEAM_NAMES[0]}</b> (you, cyan) deploy from the Operations Wing in the west. <b>{TEAM_NAMES[1]}</b> (orange) hold the Maintenance Bay in the east.<br /><br />Three lanes cross the island: the long <b>North Ridge</b>, the open <b>Dish Courtyard</b>, and the tight <b>Utility Pipeway</b>. Service tunnels and the control room link the wings.<br /><br />Kills, assists and destroyed devices build <b>Momentum</b>. Hit 3, 5 and 8 in one life to unlock your support actions. Dying resets it.</div></div></div>
      </div>
    </>
  );
}

function Results(p: { data: ResultData; onAgain(): void; onMenu(): void; onLoadout(): void }) {
  const d = p.data;
  const won = d.winner === 0, draw = d.winner === 2;
  const r = d.result;
  const lvl = levelFromXp(r.xpAfter);
  const acc = (id: string) => { const u = d.weaponStats[id]; return u && u.shots ? Math.round((u.hits / u.shots) * 100) : 0; };
  const wl = Object.entries(d.weaponStats).filter(([, u]) => u.shots > 0);
  const team = (t: number) => d.players.filter((x) => x.team === t).sort((a, b) => b.score - a.score);
  return (
    <div className="shell">
      <div className="shell-bg" />
      <div className="topbar"><div className="res-banner-small row"><b className={"res-banner " + (draw ? "draw" : won ? "win" : "loss")} style={{ fontSize: 34 }}>{draw ? "DRAW" : won ? "VICTORY" : "DEFEAT"}</b><span className="pill">{d.reason}</span><span className="pill">{TEAM_NAMES[0]} {d.teamScore[0]} – {d.teamScore[1]} {TEAM_NAMES[1]}</span></div><span className="pill">Match time {Math.floor(d.duration / 60)}:{String(Math.floor(d.duration % 60)).padStart(2, "0")}</span></div>
      <div className="res-grid">
        <div className="col scroll" style={{ gap: 12 }}>
          {[0, 1].map((t) => (
            <div className="card" key={t} style={{ borderTop: `3px solid var(--t${t})` }}>
              <h3 className={t === 0 ? "t0c" : "t1c"}>{TEAM_NAMES[t]} · {d.teamScore[t]}</h3>
              <table className="board"><thead><tr><th className="nm">Operator</th><th>Score</th><th>K</th><th>D</th><th>A</th><th>Devices</th></tr></thead><tbody>{team(t).map((x) => <tr key={x.id} className={x.isMe ? "me" : ""}><td className="nm">{x.name}</td><td>{x.score}</td><td>{x.kills}</td><td>{x.deaths}</td><td>{x.assists}</td><td>{x.devices}</td></tr>)}</tbody></table>
            </div>))}
        </div>
        <div className="col scroll" style={{ gap: 12 }}>
          <div className="card"><h3>Your match</h3>
            <div className="kv"><div><small>ELIMS</small><b>{d.me.kills}</b></div><div><small>DEATHS</small><b>{d.me.deaths}</b></div><div><small>ASSISTS</small><b>{d.me.assists}</b></div><div><small>HEADSHOTS</small><b>{d.me.headshots}</b></div>
              <div><small>BEST STREAK</small><b>{d.me.bestStreak}</b></div><div><small>BEST MOMENTUM</small><b>{d.me.bestMomentum}</b></div><div><small>DEVICES DESTROYED</small><b>{d.me.supportDestroyed}</b></div><div><small>SUPPORT KILLS</small><b>{d.me.supportKills}</b></div></div>
            <div className="tips" style={{ marginTop: 8 }}>Network quality: <b>Local simulation</b> · 0 ms · 0% loss (Practice runs in-browser)</div>
          </div>
          <div className="card"><h3>Accuracy by weapon</h3>
            {wl.length === 0 ? <span className="tips">No shots fired.</span> : <table className="board"><thead><tr><th className="nm">Weapon</th><th>Shots</th><th>Hits</th><th>Acc</th><th>Elims</th></tr></thead><tbody>{wl.map(([id, u]) => <tr key={id}><td className="nm">{WEAPONS[id] ? weaponLabel(WEAPONS[id]) : id}</td><td>{u.shots}</td><td>{u.hits}</td><td>{acc(id)}%</td><td>{u.kills}</td></tr>)}</tbody></table>}
          </div>
          <div className="card"><h3>Progression</h3>
            {r.breakdown.map((b) => <div className="xp-line" key={b.label}><span>{b.label}</span><b>+{b.xp}</b></div>)}
            <div className="xp-line"><span><b>Total XP</b></span><b style={{ color: "var(--acc)" }}>+{r.xpGained}</b></div>
            <div className="row" style={{ marginTop: 10 }}><b style={{ fontSize: 26 }}>LV {lvl.level}</b>{r.levelAfter > r.levelBefore && <span className="pill" style={{ color: "var(--good)", borderColor: "var(--good)" }}>Level up! {r.levelBefore} → {r.levelAfter}</span>}</div>
            <div className="xpbar"><i style={{ width: lvl.level >= MAX_LEVEL ? "100%" : `${(lvl.into / lvl.need) * 100}%` }} /></div>
            <p className="tips">Level unlocks are sidegrades (new weapons, attachments, perks). Practice already has every option open.</p>
          </div>
          <div className="row"><button className="btn primary" onClick={p.onAgain}>Play again</button><button className="btn" onClick={p.onLoadout}>Loadouts</button><button className="btn" onClick={p.onMenu}>Main menu</button></div>
        </div>
      </div>
    </div>
  );
}
