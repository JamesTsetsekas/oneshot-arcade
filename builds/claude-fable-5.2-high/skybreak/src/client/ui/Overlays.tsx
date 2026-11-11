// client-ui: full map, inventory, pause and settings overlays.
import { useEffect, useRef, useState, useSyncExternalStore, type ReactElement } from "react";
import { ITEMS } from "../../shared/content/items";
import { AMMO_CAPS, AMMO_NAMES, AMMO_TYPES, RARITIES, weaponStats } from "../../shared/content/weapons";
import { audio } from "../audio/audio";
import { game } from "../game";
import { ACTION_LABELS, DEFAULT_BINDS, keyLabel, settingsStore, type Action, type Settings } from "../runtime/settings";
import { drawFullMap } from "./hudCanvas";
import { AmmoIcon, ItemIcon, RarityMark, WeaponIcon } from "./icons";
import { mapToWorld } from "./mapRender";
import { useHud } from "./store";

export function MapOverlay(): ReactElement {
  const ref = useRef<HTMLCanvasElement>(null);
  const size = Math.round(Math.min(window.innerHeight * 0.86, window.innerWidth * 0.62));
  useEffect(() => {
    let raf = 0;
    const draw = (): void => {
      const cv = ref.current;
      if (cv) {
        const ctx = cv.getContext("2d")!;
        const m = game.mapState();
        drawFullMap(ctx, size, game.mapImage, {
          storm: m.snap ? m.snap.storm : null, stormVisible: m.stormVisible, px: m.px, pz: m.pz, yaw: m.yaw, showPlayer: !!m.snap && (m.snap.phase !== "skiff" || !m.snap.skiff.active || !!m.snap.actors.length),
          marker: m.snap ? m.snap.you.marker : null, skiffPath: m.skiffPath, skiff: m.snap && m.snap.skiff.active ? m.snap.skiff : null, pings: m.pings, time: m.time, labels: true,
        });
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [size]);
  const click = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    const rect = e.currentTarget.getBoundingClientRect();
    const [x, z] = mapToWorld(e.clientX - rect.left, e.clientY - rect.top, rect.width);
    if (e.button === 2) game.action({ type: "clearMarker" });
    else {
      game.action({ type: "marker", x, z });
      audio.ui("marker");
    }
  };
  return (
    <div className="shade interactive" onContextMenu={(e) => e.preventDefault()}>
      <div className="mapwrap">
        <canvas ref={ref} width={size} height={size} style={{ width: size, height: size }} onMouseDown={click} />
        <div className="legend panel">
          <h2>The Highwake</h2>
          <div><i style={{ background: "#fff" }} />You</div>
          <div><i style={{ background: "#ffd24a", borderRadius: 2, transform: "rotate(45deg)" }} />Your marker</div>
          <div><i style={{ background: "transparent", border: "2px solid #fff" }} />Next Calmfield</div>
          <div><i style={{ background: "rgba(128,70,235,0.8)" }} />Riftstorm</div>
          <div><i style={{ background: "#ffb347" }} />Supply capsule</div>
          <div><i style={{ background: "#c79bff" }} />Caravan (approx.)</div>
          <div><i style={{ background: "#7ff5e6" }} />Air vent</div>
          <p style={{ color: "var(--muted)", marginTop: 12 }}>
            Left-click to place a marker, right-click to clear it. Dashed lines are ziplines; the white dashed line is the skiff route.
          </p>
          <button className="btn small ghost" onClick={() => game.setOverlay("none")}>Close map</button>
        </div>
      </div>
    </div>
  );
}

export function InventoryOverlay(): ReactElement | null {
  const you = useHud((s) => s.you);
  const [over, setOver] = useState(-1);
  const drag = useRef(-1);
  if (!you) return null;
  return (
    <div className="shade interactive">
      <div className="inv panel">
        <h2>Inventory</h2>
        <div className="sub">Five universal slots. Drag a card onto another to swap. Click a card to equip it. Ammo is carried separately and capped.</div>
        <div className="cards">
          {you.slots.map((s, i) => {
            if (!s) {
              return (
                <div
                  key={i} className={"card empty" + (over === i ? " over" : "")}
                  onDragOver={(e) => { e.preventDefault(); setOver(i); }} onDragLeave={() => setOver(-1)}
                  onDrop={() => { if (drag.current >= 0) game.action({ type: "swapSlots", a: drag.current, b: i }); setOver(-1); audio.ui("swap"); }}
                >
                  <span className="k">{i + 1}</span>Empty
                </div>
              );
            }
            const st = s.kind === "weapon" ? weaponStats(s.weapon, s.rarity) : null;
            return (
              <div
                key={i} className={"card" + (you.selected === i ? " sel" : "") + (over === i ? " over" : "")} draggable
                onDragStart={() => { drag.current = i; }} onDragEnd={() => { drag.current = -1; setOver(-1); }}
                onDragOver={(e) => { e.preventDefault(); setOver(i); }} onDragLeave={() => setOver(-1)}
                onDrop={() => { if (drag.current >= 0 && drag.current !== i) { game.action({ type: "swapSlots", a: drag.current, b: i }); audio.ui("swap"); } setOver(-1); }}
                onClick={() => { game.input.slot = i; audio.ui("swap"); }}
              >
                <span className="k">{i + 1}</span>
                {s.kind === "weapon" && st ? (
                  <>
                    <div className="ico" style={{ color: "var(--cream)" }}><WeaponIcon id={s.weapon} size={110} /></div>
                    <div className="nm">{st.def.name}</div>
                    <div className="rr" style={{ color: RARITIES[s.rarity]!.color }}><RarityMark rarity={s.rarity} /> {RARITIES[s.rarity]!.name}</div>
                    <div className="st">
                      Damage <b>{st.damage}{st.pellets > 1 ? ` x${st.pellets}` : ""}</b> · Head <b>x{st.def.head}</b><br />
                      Fire rate <b>{Math.round(st.rpm)}</b> rpm · DPS <b>{st.dps}</b><br />
                      Magazine <b>{s.mag}/{st.mag}</b> · Reload <b>{st.reload.toFixed(2)}s{st.def.shellReload ? "/shell" : ""}</b><br />
                      {st.def.projectile ? <>Projectile <b>{Math.round(st.projSpeed)} m/s</b></> : <>Falloff <b>{Math.round(st.falloffStart)}-{Math.round(st.falloffEnd)} m</b></>} · {AMMO_NAMES[st.def.ammo]}
                    </div>
                    {st.perk && <div className="perk">+ {st.perk}</div>}
                    {st.drawback && <div className="dr">- {st.drawback}</div>}
                  </>
                ) : s.kind === "item" ? (
                  <>
                    <div className="ico" style={{ color: ITEMS[s.item].color }}><ItemIcon id={s.item} size={64} /></div>
                    <div className="nm">{ITEMS[s.item].name}</div>
                    <div className="rr">x{s.count} / {ITEMS[s.item].stack}</div>
                    <div className="st">{ITEMS[s.item].desc}</div>
                  </>
                ) : null}
                <button className="btn small ghost" onClick={(e) => { e.stopPropagation(); game.action({ type: "dropSlot", slot: i }); }}>Drop</button>
              </div>
            );
          })}
        </div>
        <div className="ammotable">
          {AMMO_TYPES.map((t) => (
            <div key={t}>
              <AmmoIcon type={t} size={18} /> {AMMO_NAMES[t]} <b>{you.ammo[t]}</b> <small>/ {AMMO_CAPS[t]}</small>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "var(--muted)", fontSize: 13 }}>Health {Math.ceil(you.health)} · Aegis {Math.round(you.aegis)} · Reserve {Math.round(you.reserve)}</span>
          <button className="btn small primary" onClick={() => game.setOverlay("none")}>Back to the fight</button>
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }): ReactElement {
  return (
    <div className="row">
      <div>
        <label>{label}</label>
        {hint && <div className="hint">{hint}</div>}
      </div>
      <div className="seg">
        <button className={value ? "on" : ""} onClick={() => onChange(true)}>On</button>
        <button className={!value ? "on" : ""} onClick={() => onChange(false)}>Off</button>
      </div>
    </div>
  );
}

function Slider({ label, hint, value, min, max, step, fmt, onChange }: { label: string; hint?: string; value: number; min: number; max: number; step: number; fmt: (v: number) => string; onChange: (v: number) => void }): ReactElement {
  return (
    <div className="row">
      <div>
        <label>{label}</label>
        {hint && <div className="hint">{hint}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
        <span style={{ width: 52, textAlign: "right", fontWeight: 800 }}>{fmt(value)}</span>
      </div>
    </div>
  );
}

export function SettingsPanel(): ReactElement {
  const s = useSyncExternalStore(settingsStore.subscribe, settingsStore.get);
  const [tab, setTab] = useState<"video" | "controls" | "audio" | "access" | "keys">("video");
  const [capture, setCapture] = useState<Action | null>(null);
  const set = (p: Partial<Settings>): void => settingsStore.set(p);
  useEffect(() => {
    if (!capture) return;
    const onKey = (e: KeyboardEvent): void => {
      e.preventDefault();
      e.stopPropagation();
      if (e.code !== "Escape") {
        const binds = { ...settingsStore.value.binds, [capture]: [e.code] };
        settingsStore.set({ binds });
      }
      setCapture(null);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [capture]);
  const pct = (v: number): string => `${Math.round(v * 100)}%`;
  return (
    <div>
      <div className="tabs">
        {(["video", "controls", "audio", "access", "keys"] as const).map((t) => (
          <button key={t} className={"btn small " + (tab === t ? "primary" : "ghost")} onClick={() => setTab(t)}>
            {{ video: "Video", controls: "Controls", audio: "Audio", access: "Accessibility", keys: "Key binds" }[t]}
          </button>
        ))}
      </div>
      {tab === "video" && (
        <>
          <div className="row">
            <div>
              <label>Quality preset</label>
              <div className="hint">Low removes shadows and post effects. Mist, storm and cover visibility are identical on every preset.</div>
            </div>
            <div className="seg">
              {(["low", "medium", "high"] as const).map((q) => (
                <button key={q} className={s.quality === q ? "on" : ""} onClick={() => set({ quality: q })}>{q}</button>
              ))}
            </div>
          </div>
          <Toggle label="Dynamic resolution" hint="Lowers render scale when frames run long, restores it when they recover." value={s.dynamicRes} onChange={(v) => set({ dynamicRes: v })} />
          <Slider label="Field of view" hint="Horizontal, at 16:9" value={s.fov} min={80} max={105} step={1} fmt={(v) => `${v}°`} onChange={(v) => set({ fov: v })} />
        </>
      )}
      {tab === "controls" && (
        <>
          <Slider label="Mouse sensitivity" value={s.sens} min={0.2} max={3} step={0.05} fmt={(v) => v.toFixed(2)} onChange={(v) => set({ sens: v })} />
          <Slider label="Aim-down-sights sensitivity" hint="Multiplier, also scaled by weapon zoom" value={s.adsSens} min={0.2} max={1.5} step={0.05} fmt={(v) => v.toFixed(2)} onChange={(v) => set({ adsSens: v })} />
          <Toggle label="Invert Y" value={s.invertY} onChange={(v) => set({ invertY: v })} />
          <Toggle label="Toggle aim" hint="Right mouse toggles ADS instead of holding" value={s.toggleAds} onChange={(v) => set({ toggleAds: v })} />
          <Toggle label="Toggle crouch" value={s.toggleCrouch} onChange={(v) => set({ toggleCrouch: v })} />
        </>
      )}
      {tab === "audio" && (
        <>
          <Slider label="Master volume" value={s.master} min={0} max={1} step={0.05} fmt={pct} onChange={(v) => set({ master: v })} />
          <Slider label="Effects" value={s.sfx} min={0} max={1} step={0.05} fmt={pct} onChange={(v) => set({ sfx: v })} />
          <Slider label="Music" value={s.music} min={0} max={1} step={0.05} fmt={pct} onChange={(v) => set({ music: v })} />
        </>
      )}
      {tab === "access" && (
        <>
          <Toggle label="Visual sound indicators" hint="Shows broad direction arcs for gunfire and nearby footsteps. Never an exact position." value={s.soundIndicators} onChange={(v) => set({ soundIndicators: v })} />
          <Toggle label="Reduced motion" hint="Removes camera shake, sprint FOV push and pulsing screen edges." value={s.reducedMotion} onChange={(v) => set({ reducedMotion: v })} />
          <Toggle label="Damage numbers" value={s.damageNumbers} onChange={(v) => set({ damageNumbers: v })} />
          <p>Rarity is always shown with a shape as well as a colour: circle, chevron, diamond, crown, star. Shield, health and headshot hits use different marker colours and sounds. The Riftstorm never strobes.</p>
        </>
      )}
      {tab === "keys" && (
        <>
          <p>Click a binding, then press a key. Escape cancels. Mouse buttons are fixed: left fire / use, right aim, middle ping, wheel cycles slots.</p>
          {(Object.keys(ACTION_LABELS) as Action[]).map((a) => (
            <div className="bind" key={a}>
              <span>{ACTION_LABELS[a]}</span>
              <button className={"btn small " + (capture === a ? "primary" : "ghost")} onClick={() => setCapture(a)}>
                {capture === a ? "Press a key…" : s.binds[a].map(keyLabel).join(" / ")}
              </button>
            </div>
          ))}
          <div style={{ marginTop: 10 }}>
            <button className="btn small ghost" onClick={() => set({ binds: JSON.parse(JSON.stringify(DEFAULT_BINDS)) as Settings["binds"] })}>Restore defaults</button>
          </div>
          <p>Browsers reserve some shortcuts: Ctrl+W closes the tab. Skybreak asks before leaving mid-match, and C is bound to crouch as well. Fullscreen (F11) captures more keys.</p>
        </>
      )}
    </div>
  );
}

const CONTROL_ROWS: [string, string][] = [
  ["Move", "W A S D"], ["Aim / fire", "Mouse / Left click"], ["Aim down sights", "Right click"], ["Sprint", "L-Shift"],
  ["Crouch / slide while sprinting", "L-Ctrl or C"], ["Jump / mantle ledges", "Space"], ["Interact / pick up / open", "E (hold to swap)"],
  ["Reload", "R"], ["Quick melee", "F"], ["Inventory slots", "1-5 / wheel"], ["Throw utility", "G"], ["Wing-sail deploy / stow", "Z"],
  ["Swap shoulder", "X"], ["Full map / inventory", "M / Tab"], ["Ping marker at crosshair", "Middle click"], ["Free look", "L-Alt"],
];

export function PauseMenu(): ReactElement {
  const mode = useHud((s) => s.mode);
  const [view, setView] = useState<"main" | "settings">("main");
  return (
    <div className="shade interactive">
      <div className="pause panel">
        <h2>{view === "settings" ? "Settings" : "Paused"}</h2>
        {view === "main" ? (
          <>
            <div className="acts">
              <button className="btn primary" onClick={() => game.setOverlay("none")}>Resume</button>
              <button className="btn ghost" onClick={() => setView("settings")}>Settings</button>
              <button className="btn ghost" onClick={() => (document.fullscreenElement ? void document.exitFullscreen() : void document.documentElement.requestFullscreen().then(() => (navigator as unknown as { keyboard?: { lock?: () => Promise<void> } }).keyboard?.lock?.()).catch(() => {}))}>Fullscreen</button>
              <button className="btn danger" onClick={() => game.leaveToMenu()}>{mode === "practice" ? "Leave range" : "Leave match"}</button>
            </div>
            <p style={{ color: "var(--muted)", fontSize: 13, margin: "0 0 12px" }}>
              {mode === "solo" ? "The match keeps running while this menu is open." : "The range keeps running while this menu is open."}
            </p>
            <div className="controls">
              {CONTROL_ROWS.map(([a, b]) => (
                <div key={a}><span>{a}</span><b>{b}</b></div>
              ))}
            </div>
          </>
        ) : (
          <>
            <SettingsPanel />
            <div style={{ marginTop: 14 }}>
              <button className="btn small ghost" onClick={() => setView("main")}>Back</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
