import { useEffect, useRef, useState, useCallback } from "react";
import { loadProfile, saveProfile, resetProfile, applyResult, Profile, ProgressReport, Settings } from "../profile/profile";
import { MainMenu, PracticeSetup, LoadoutEditor, ProfileScreen, SettingsScreen, Credits, Results, Btn } from "./screens";
import type { GameSession } from "../client/session";
import { MatchResult } from "../shared/protocol";
import { levelForXp } from "../content/progression";
import { WEAPONS } from "../content/weapons";
import { keyLabel } from "./hud";
import { audio } from "../audio/audio";

type Screen = "menu" | "practice" | "loadouts" | "profile" | "settings" | "credits" | "game" | "results";

const params = new URLSearchParams(location.search);

export function App() {
  const [profile, setProfile] = useState<Profile>(() => loadProfile());
  const [screen, setScreen] = useState<Screen>("menu");
  const [result, setResult] = useState<{ r: MatchResult; rep: ProgressReport } | null>(null);
  const [paused, setPaused] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picker, setPicker] = useState(false);
  const [inMatchSettings, setInMatchSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needsClick, setNeedsClick] = useState(true);
  const gameRef = useRef<HTMLDivElement>(null);
  const session = useRef<GameSession | null>(null);
  const profileRef = useRef(profile);
  profileRef.current = profile;

  const update = useCallback((f: (p: Profile) => void) => {
    setProfile((old) => { const p: Profile = JSON.parse(JSON.stringify(old)); f(p); saveProfile(p); return p; });
  }, []);

  useEffect(() => {
    const unlock = () => { audio.init(); if (screen !== "game") audio.setMusic("menu"); };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => { window.removeEventListener("pointerdown", unlock); window.removeEventListener("keydown", unlock); };
  }, [screen]);

  useEffect(() => { audio.applySettings({ master: profile.settings.master, sfx: profile.settings.sfx, music: profile.settings.music, hitmarker: profile.settings.hitmarkerAudio }); }, [profile.settings]);

  const endSession = () => { session.current?.dispose(); session.current = null; (window as unknown as { __breachline?: unknown }).__breachline = undefined; };

  const startMatch = useCallback(() => {
    endSession();
    setScreen("game"); setPaused(null); setError(null); setPicker(false); setLoading(true); setNeedsClick(true);
    audio.setMusic("off");
    // let React paint the loading frame first
    // the 3D engine + simulation chunk is loaded on demand so the menu shell stays small
    import("../client/session").then(({ GameSession }) => {
      if (!gameRef.current) return;
      const pr = profileRef.current;
      const autopilot = params.get("demo") === "1";
      try {
        const s = new GameSession(gameRef.current, pr, {
          difficulty: pr.lastPractice.difficulty, scoreLimit: Number(params.get("score")) || pr.lastPractice.scoreLimit, timeLimit: Number(params.get("time")) || pr.lastPractice.timeLimit,
          teamSize: pr.lastPractice.teamSize, autopilot, warmup: params.get("warmup") ? Number(params.get("warmup")) : undefined,
        }, {
          onEnd: (r) => {
            const p: Profile = JSON.parse(JSON.stringify(profileRef.current));
            if (session.current) p.selected = (session.current as unknown as { profile: Profile }).profile.selected;
            const rep = applyResult(p, r);
            saveProfile(p);
            profileRef.current = p;
            setProfile(p);
            setResult({ r, rep });
            endSession(); setScreen("results"); audio.setMusic("menu");
          },
          onPauseChange: (pz, reason) => { setPaused(pz ? reason : null); if (!pz) { setInMatchSettings(false); setNeedsClick(false); } },
          onError: (m) => setError(m),
          onLoadoutPicker: (open) => setPicker(open),
        });
        session.current = s;
        (window as unknown as { __breachline?: unknown }).__breachline = { session: s, state: () => s.debugState() };
        s.start();
        if (autopilot) setNeedsClick(false);
      } catch (e) {
        setError(`Could not start the match: ${(e as Error).message}`);
      }
      setLoading(false);
    }).catch((e) => { setLoading(false); setError(`Could not load the game module: ${(e as Error).message}`); });
  }, []);

  useEffect(() => {
    if (params.get("autostart") === "1") startMatch();
    return () => endSession();
  }, [startMatch]);

  const leave = () => { endSession(); setScreen("menu"); setPaused(null); audio.setMusic("menu"); };
  const changeSettings = (s: Settings) => { update((p) => { p.settings = s; }); session.current?.applySettings(s); };
  const level = levelForXp(profile.xp);

  return (
    <div className={`app screen-${screen}`}>
      {screen !== "game" && screen !== "results" && <div className="backdrop"><div className="bd-sky" /><div className="bd-grid" /><div className="bd-dish" /></div>}
      {screen === "menu" && <MainMenu profile={profile} go={(s) => setScreen(s as Screen)} />}
      {screen === "practice" && <PracticeSetup profile={profile} update={update} onBack={() => setScreen("menu")} onStart={startMatch} />}
      {screen === "loadouts" && <LoadoutEditor profile={profile} update={update} onBack={() => setScreen("menu")} />}
      {screen === "profile" && <ProfileScreen profile={profile} update={update} onBack={() => setScreen("menu")} onReset={() => setProfile(resetProfile())} />}
      {screen === "settings" && <SettingsScreen settings={profile.settings} level={level} onChange={changeSettings} onBack={() => setScreen("menu")} />}
      {screen === "credits" && <Credits onBack={() => setScreen("menu")} />}
      {screen === "results" && result && <Results result={result.r} report={result.rep} onAgain={startMatch} onMenu={() => setScreen("menu")} />}
      {screen === "game" && (
        <div className="game" ref={gameRef}>
          {loading && <div className="overlay loading"><div className="spinner" /><p>Building Relay Station K-17…</p></div>}
          {!loading && needsClick && !paused && !error && params.get("demo") !== "1" && (
            <div className="overlay click-to-play" onClick={() => session.current?.requestLock()}>
              <h2>Click to deploy</h2>
              <p>Mouse aims · {keyLabel(profile.settings.binds.forward)}{keyLabel(profile.settings.binds.left)}{keyLabel(profile.settings.binds.back)}{keyLabel(profile.settings.binds.right)} move · {keyLabel(profile.settings.binds.sprint)} sprint · {keyLabel(profile.settings.binds.crouch)} crouch · Space jump/mantle</p>
              <p>{keyLabel(profile.settings.binds.lethal)} lethal (hold to cook) · {keyLabel(profile.settings.binds.tactical)} tactical · {keyLabel(profile.settings.binds.melee)} melee · {keyLabel(profile.settings.binds.supportSelect)}/{keyLabel(profile.settings.binds.supportDeploy)} support · Tab scores · Esc pause</p>
            </div>
          )}
          {paused && !error && (
            <div className="overlay pause">
              {!inMatchSettings ? (
                <div className="pause-card">
                  <h2>{paused}</h2>
                  <p className="muted">Practice is paused while the menu is open.</p>
                  <Btn kind="primary" onClick={() => session.current?.requestLock()}>Resume</Btn>
                  <Btn onClick={() => setInMatchSettings(true)}>Settings</Btn>
                  <Btn kind="danger" onClick={leave}>Leave match</Btn>
                </div>
              ) : (
                <div className="pause-settings"><SettingsScreen inMatch settings={profile.settings} level={level} onChange={changeSettings} onBack={() => setInMatchSettings(false)} /></div>
              )}
            </div>
          )}
          {picker && (
            <div className="overlay picker">
              <div className="pause-card wide"><h2>Choose loadout for next spawn</h2>
                <div className="picker-list">{profile.loadouts.map((l, i) => <div key={i} className={`picker-item ${i === profile.selected ? "sel" : ""}`}><kbd>{i + 1}</kbd><b>{l.name}</b><small>{WEAPONS[l.primary].name} · {WEAPONS[l.sidearm].name}</small></div>)}</div>
                <p className="muted">Press 1–5 to choose · {keyLabel(profile.settings.binds.loadout)} to close</p>
              </div>
            </div>
          )}
          {error && (
            <div className="overlay error"><div className="pause-card"><h2>Something needs attention</h2><p>{error}</p>
              <Btn kind="primary" onClick={() => { setError(null); session.current?.requestLock(); }}>Retry</Btn><Btn onClick={leave}>Back to menu</Btn></div></div>
          )}
        </div>
      )}
    </div>
  );
}
