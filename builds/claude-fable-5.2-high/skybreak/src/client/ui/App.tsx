// client-ui: shell. Menu, queue, results and the overlay router. The 3D canvas lives outside React.
import { useEffect, useRef, useState, useSyncExternalStore, type ReactElement } from "react";
import type { Pace } from "../../shared/content/rules";
import { RARITIES } from "../../shared/content/weapons";
import { audio } from "../audio/audio";
import { game } from "../game";
import { BODY_NAMES, CLOTH_COLORS, masteryLevel, profileStore } from "../runtime/settings";
import { fmtTime, Hud } from "./Hud";
import { drawFullMap } from "./hudCanvas";
import { RarityMark } from "./icons";
import { InventoryOverlay, MapOverlay, PauseMenu, SettingsPanel } from "./Overlays";
import { hud, useHud } from "./store";

function Logo(): ReactElement {
  return (
    <div className="logo">
      SKY<span>BREAK</span>
    </div>
  );
}

function Loading(): ReactElement {
  const label = useHud((s) => s.loadingLabel);
  const frac = useHud((s) => s.loadingFrac);
  return (
    <div className="splash">
      <Logo />
      <div className="tagline">Drop · Loot · Rotate · Survive</div>
      <div className="bar"><i style={{ width: `${Math.round(frac * 100)}%` }} /></div>
      <div style={{ color: "var(--muted)", fontSize: 13, letterSpacing: "0.08em" }}>{label}…</div>
    </div>
  );
}

function ErrorScreen(): ReactElement {
  const text = useHud((s) => s.errorText);
  return (
    <div className="splash interactive">
      <Logo />
      <div className="errorbox panel">
        <h2 style={{ marginTop: 0 }}>Skybreak can't start</h2>
        <p>{text}</p>
        <button className="btn primary" onClick={() => location.reload()}>Reload</button>
      </div>
    </div>
  );
}

function Swatches({ value, onChange }: { value: string; onChange: (c: string) => void }): ReactElement {
  return (
    <div className="swatches">
      {CLOTH_COLORS.map((c) => (
        <button key={c} className={"swatch" + (c === value ? " on" : "")} style={{ background: c }} aria-label={`Colour ${c}`} onClick={() => onChange(c)} />
      ))}
    </div>
  );
}

function Appearance(): ReactElement {
  const p = useSyncExternalStore(profileStore.subscribe, profileStore.get);
  return (
    <>
      <h2>Appearance</h2>
      <p>Cosmetic only. All four bodies share the same hitbox family and movement.</p>
      <div className="row">
        <label>Callsign</label>
        <input type="text" maxLength={16} value={p.name} onChange={(e) => profileStore.set({ name: e.target.value.replace(/[^\w \-']/g, "").slice(0, 16) })} />
      </div>
      <div className="row">
        <label>Body</label>
        <div className="seg">
          {BODY_NAMES.map((n, i) => (
            <button key={n} className={p.body === i ? "on" : ""} onClick={() => profileStore.set({ body: i })}>{n}</button>
          ))}
        </div>
      </div>
      <div className="row"><label>Jacket</label><Swatches value={p.primary} onChange={(c) => profileStore.set({ primary: c })} /></div>
      <div className="row"><label>Trousers &amp; pack</label><Swatches value={p.secondary} onChange={(c) => profileStore.set({ secondary: c })} /></div>
      <div className="row"><label>Wing-sail</label><Swatches value={p.sail} onChange={(c) => profileStore.set({ sail: c })} /></div>
      <p>Wayfarer wears a hood and satchel, Kiteback a wide-brim hat and bedroll, Coppercoat a helmet and shoulder plates, Driftweaver a scarf and tall frame pack.</p>
    </>
  );
}

function Career(): ReactElement {
  const p = useSyncExternalStore(profileStore.subscribe, profileStore.get);
  const lv = masteryLevel(p.xp);
  return (
    <>
      <h2>Career</h2>
      <div className="stat-grid">
        <div className="stat"><b>{lv.level}</b><span>Mastery</span></div>
        <div className="stat"><b>{p.matches}</b><span>Matches</span></div>
        <div className="stat"><b>{p.wins}</b><span>Wins</span></div>
        <div className="stat"><b>{p.kills}</b><span>Elims</span></div>
      </div>
      <div className="xp">
        Mastery {lv.into} / {lv.need} XP
        <div className="bar"><i style={{ width: `${(lv.into / lv.need) * 100}%` }} /></div>
      </div>
      <p>Mastery is cosmetic progress only. Every weapon, item and movement ability is available from your first drop; nothing here changes combat.</p>
      <h3>Recent matches</h3>
      {p.history.length === 0 ? (
        <p>No matches yet. Quick Drop to start your record.</p>
      ) : (
        <table className="tbl">
          <thead><tr><th>Date</th><th>Pace</th><th>Place</th><th>Elims</th><th>Damage</th></tr></thead>
          <tbody>
            {p.history.map((h, i) => (
              <tr key={i}><td>{h.date}</td><td>{h.pace}</td><td>#{h.placement}</td><td>{h.kills}</td><td>{h.damage}</td></tr>
            ))}
          </tbody>
        </table>
      )}
      <p style={{ fontSize: 12 }}>Stored only in this browser (localStorage). Best placement: {p.best ? `#${p.best}` : "-"}.</p>
    </>
  );
}

function Credits(): ReactElement {
  return (
    <>
      <h2>Credits</h2>
      <p>Skybreak is an original one-shot build for Oneshot Arcade, created by Claude Fable 5.2 (Claude Code).</p>
      <p>Every model, texture, icon, sound and note of music is generated procedurally in code at runtime. No third-party art, audio, maps or names are used.</p>
      <h3>Open-source libraries</h3>
      <p>Babylon.js (Apache-2.0) for rendering · React (MIT) for interface · Vite, TypeScript and Vitest for tooling.</p>
      <h3>How to play</h3>
      <p>Ride the skiff, drop onto the Highwake, loot weapons and shields, stay inside the Calmfield as the Riftstorm closes, and be the last survivor of 24.</p>
    </>
  );
}

function HowTo({ pace }: { pace: Pace }): ReactElement {
  return (
    <>
      <h2>Quick Drop briefing</h2>
      <p><b>24 players</b> (you and 23 bots), one island, no respawns. A {pace === "standard" ? "standard match runs about 13-15 minutes" : "blitz match runs about 6 minutes with the same phases compressed"}.</p>
      <h3>The loop</h3>
      <p>Warm up on the staging pier, ride the skiff, press <b>Space</b> to jump, steer your freefall, glide on the wing-sail, then loot floor items, resonance chests and supply lockers.</p>
      <h3>Staying alive</h3>
      <p>100 Health, 50 Aegis that recharges after 8 seconds without damage, and up to 50 Reserve Shield from flasks. The Riftstorm burns Health directly and gets worse every phase.</p>
      <h3>Rarity</h3>
      <div className="lootlist">
        {RARITIES.map((r) => (
          <span key={r.id} style={{ color: r.color }}><RarityMark rarity={r.id} /> {r.name}</span>
        ))}
      </div>
      <p>Higher tiers modestly improve handling. Prototype weapons only come from supply capsules, the vault and the caravan drone.</p>
      <h3>Getting around</h3>
      <p>Sprint, slide (crouch while sprinting), mantle crates and walls, ride ziplines and ascenders with <b>E</b>, launch from air vents and redeploy your sail with <b>Z</b>.</p>
    </>
  );
}

function MainMenu(): ReactElement {
  const [sheet, setSheet] = useState<"howto" | "appearance" | "career" | "settings" | "credits">("howto");
  const [pace, setPace] = useState<Pace>(hud.get().pace);
  const click = (fn: () => void) => (): void => {
    audio.unlock();
    audio.setMusic("menu");
    audio.ui("click");
    fn();
  };
  useEffect(() => {
    const unlock = (): void => {
      audio.unlock();
      audio.setMusic("menu");
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);
  return (
    <div className="menu interactive">
      <div className="menu-left">
        <Logo />
        <div className="tagline">Battle royale on the Highwake</div>
        <div className="menu-buttons">
          <button className="btn primary" onClick={click(() => { hud.set({ pace }); game.startMatch("solo", pace); })}>
            Quick Drop
            <small>Solo · 24 players · {pace === "standard" ? "standard pace (~14 min)" : "blitz pace (~6 min)"}</small>
          </button>
          <div className="seg" style={{ alignSelf: "flex-start" }}>
            <button className={pace === "standard" ? "on" : ""} onClick={click(() => setPace("standard"))}>Standard</button>
            <button className={pace === "blitz" ? "on" : ""} onClick={click(() => setPace("blitz"))}>Blitz</button>
          </div>
          <button className="btn" onClick={click(() => game.startMatch("practice", "standard"))}>
            Practice Range
            <small>Every weapon and item, targets, movement course</small>
          </button>
          <button className="btn ghost" onClick={click(() => setSheet("appearance"))}>Appearance</button>
          <button className="btn ghost" onClick={click(() => setSheet("career"))}>Career</button>
          <button className="btn ghost" onClick={click(() => setSheet("settings"))}>Settings</button>
          <button className="btn ghost" onClick={click(() => setSheet("credits"))}>Credits</button>
        </div>
        <div className="menu-foot">Local bot mode: the authoritative match simulation runs in your browser. No account, no network, nothing leaves this page.</div>
      </div>
      <div className="menu-right">
        <div className="sheet panel">
          {sheet === "howto" && <HowTo pace={pace} />}
          {sheet === "appearance" && <Appearance />}
          {sheet === "career" && <Career />}
          {sheet === "settings" && (
            <>
              <h2>Settings</h2>
              <SettingsPanel />
            </>
          )}
          {sheet === "credits" && <Credits />}
          {sheet !== "howto" && (
            <div style={{ marginTop: 14 }}>
              <button className="btn small ghost" onClick={click(() => setSheet("howto"))}>Back to briefing</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Results(): ReactElement | null {
  const res = useHud((s) => s.results);
  const mode = useHud((s) => s.mode);
  const pace = useHud((s) => s.pace);
  const ref = useRef<HTMLCanvasElement>(null);
  const p = useSyncExternalStore(profileStore.subscribe, profileStore.get);
  useEffect(() => {
    const cv = ref.current;
    if (!cv || !res || !game.mapImage) return;
    drawFullMap(cv.getContext("2d")!, cv.width, game.mapImage, {
      storm: null, stormVisible: false, px: 0, pz: 0, yaw: 0, showPlayer: false, marker: null, skiffPath: null, skiff: null, pings: [], time: 0,
      route: res.you?.route ?? [], labels: true,
    });
  }, [res]);
  if (!res) return null;
  const y = res.you;
  const won = !!y && y.placement === 1;
  const acc = y && y.shots > 0 ? Math.round((y.hits / y.shots) * 100) : 0;
  const lv = masteryLevel(p.xp);
  return (
    <div className="results interactive">
      <div className="results-inner panel">
        <div>
          <h1 className={won ? "win" : ""}>{mode === "practice" ? "Range session" : won ? "Skybreak!" : "Match over"}</h1>
          {y && mode === "solo" && (
            <div className="placement">
              You placed #{y.placement} of {res.rows.length} · Winner: {res.winnerName}
            </div>
          )}
          {y && (
            <div className="stat-grid">
              <div className="stat"><b>{y.kills}</b><span>Eliminations</span></div>
              <div className="stat"><b>{y.assists}</b><span>Assists</span></div>
              <div className="stat"><b>{y.damage}</b><span>Damage dealt</span></div>
              <div className="stat"><b>{acc}%</b><span>Accuracy</span></div>
              <div className="stat"><b>{fmtTime(y.survival)}</b><span>Survived</span></div>
              <div className="stat"><b>{y.distance} m</b><span>Travelled</span></div>
              <div className="stat"><b>{y.stormDamage}</b><span>Storm damage</span></div>
              <div className="stat"><b>{y.headshots}</b><span>Headshots</span></div>
            </div>
          )}
          <h3>Match timeline</h3>
          <div className="timeline">
            {y && y.timeline.length ? y.timeline.map((t, i) => (
              <div key={i}><span>{fmtTime(t.time)}</span>{t.text}</div>
            )) : <div>No notable events.</div>}
          </div>
          <h3>Loot history</h3>
          <div className="lootlist">
            {y && y.loot.length ? y.loot.map((l, i) => (
              <span key={i} style={{ color: RARITIES[l.rarity]!.color }}>{l.rarity > 0 && <RarityMark rarity={l.rarity} size={11} />}{l.name}</span>
            )) : <span>Nothing picked up</span>}
          </div>
          {mode === "solo" && (
            <div className="xp">
              Mastery level {lv.level} · {lv.into} / {lv.need} XP
              <div className="bar"><i style={{ width: `${(lv.into / lv.need) * 100}%` }} /></div>
            </div>
          )}
          <div className="acts">
            <button className="btn primary" onClick={() => { audio.ui("click"); game.startMatch(mode, pace); }}>{mode === "practice" ? "Back to the range" : "Drop again"}</button>
            <button className="btn ghost" onClick={() => { audio.ui("back"); game.leaveToMenu(); }}>Main menu</button>
          </div>
        </div>
        <div>
          <h3 style={{ marginTop: 0 }}>Your route</h3>
          <canvas ref={ref} width={520} height={520} />
          <h3>Standings</h3>
          <table className="tbl">
            <thead><tr><th>#</th><th>Player</th><th>Elims</th><th>Damage</th><th>Survived</th></tr></thead>
            <tbody>
              {res.rows.slice(0, 8).map((r) => (
                <tr key={r.id} className={!r.bot ? "me" : ""}><td>{r.placement}</td><td>{r.name}</td><td>{r.kills}</td><td>{r.damage}</td><td>{fmtTime(r.survival)}</td></tr>
              ))}
              {y && y.placement > 8 && res.rows.filter((r) => !r.bot).map((r) => (
                <tr key={r.id} className="me"><td>{r.placement}</td><td>{r.name}</td><td>{r.kills}</td><td>{r.damage}</td><td>{fmtTime(r.survival)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function App(): ReactElement {
  const screen = useHud((s) => s.screen);
  const overlay = useHud((s) => s.overlay);
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.code !== "Escape") return;
      const s = hud.get();
      if (s.screen === "match" && s.overlay !== "none") game.setOverlay("none");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  if (screen === "loading") return <Loading />;
  if (screen === "error") return <ErrorScreen />;
  if (screen === "menu") return <MainMenu />;
  if (screen === "results") return <Results />;
  return (
    <>
      <Hud />
      {overlay === "map" && <MapOverlay />}
      {overlay === "inventory" && <InventoryOverlay />}
      {overlay === "pause" && <PauseMenu />}
    </>
  );
}
