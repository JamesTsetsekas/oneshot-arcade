import React, { useEffect, useState } from "react";
import { controller } from "../app/controller";
import { ACTION_LABELS, DEFAULT_KEYS, LEFT_HANDED_KEYS, keyName, type Action, type Settings } from "../app/settings";
import { classSkills } from "../data/skills";
import type { ClassId } from "../data/types";
import { BODY_PRESETS, CLASS_INFO, TINTS, VOICE_PRESETS } from "../progression/character";
import { store, useStore } from "./store";

const fmtDate = (t: number) => (t ? new Date(t).toLocaleString() : "—");
const CLASS_NAME: Record<string, string> = { cinder: "Cinder Vow", ranger: "Veil Ranger" };

export function MainMenu() {
  const saves = useStore((s) => s.saves);
  const notice = useStore((s) => s.notice);
  const last = saves[0];
  return (
    <div className="menu-screen">
      <div className="menu-title"><h1>Ashfall Covenant</h1><div className="tagline">A Warden's descent beneath the buried star</div></div>
      <div className="menu-buttons">
        {last && last.status !== "corrupt" && (
          <button className="primary" onClick={() => controller.loadCharacter(last.id)}>
            Continue<small>{last.meta.name} · {CLASS_NAME[last.meta.classId] ?? ""} · Level {last.meta.level}{last.meta.difficulty === "veteran" ? " · Veteran" : ""} — saved {fmtDate(last.updatedAt)}{last.status === "recoverable" ? " (will restore backup)" : ""}</small>
          </button>
        )}
        <button onClick={() => store.set({ screen: "create" })}>Create Warden</button>
        {saves.length > 0 && <button onClick={() => store.set({ screen: "characters" })}>Characters</button>}
        <button onClick={() => store.set({ screen: "settings", settingsFrom: "menu" })}>Settings</button>
        <button onClick={() => store.set({ screen: "credits" })}>Credits</button>
      </div>
      {notice && <div className="notice">{notice}</div>}
      <div className="menu-foot">Single-player · runs entirely in your browser · progress saved locally (IndexedDB)</div>
    </div>
  );
}

export function CreateScreen() {
  const [name, setName] = useState("");
  const [cls, setCls] = useState<ClassId>("cinder");
  const [body, setBody] = useState(0);
  const [voice, setVoice] = useState(0);
  const [tint, setTint] = useState(0);
  const [busy, setBusy] = useState(false);
  return (
    <div className="menu-screen create">
      <h2>Create a Warden</h2>
      <div className="class-cards">
        {(["cinder", "ranger"] as ClassId[]).map((c) => (
          <div key={c} className={`class-card ${cls === c ? "on" : ""}`} onClick={() => setCls(c)}>
            <div className="class-glyph">{c === "cinder" ? "⚒" : "➶"}</div>
            <h3>{CLASS_INFO[c].name}</h3>
            <div className="dim">{CLASS_INFO[c].tagline}</div>
            <p>{CLASS_INFO[c].desc}</p>
            <div className="class-skills">{classSkills(c).filter((s) => s.kind !== "passive").map((s) => <span key={s.id} title={s.summary}>{s.icon} {s.name}</span>)}</div>
          </div>
        ))}
      </div>
      <div className="create-row">
        <label>Name <input maxLength={20} value={name} placeholder="Warden" onChange={(e) => setName(e.target.value)} /></label>
        <label>Body <select value={body} onChange={(e) => setBody(+e.target.value)}>{BODY_PRESETS.map((b, i) => <option key={b} value={i}>{b}</option>)}</select></label>
        <label>Voice <select value={voice} onChange={(e) => setVoice(+e.target.value)}>{VOICE_PRESETS.map((b, i) => <option key={b} value={i}>{b}</option>)}</select></label>
        <label>Cloth <span className="tints">{TINTS.map((t, i) => <i key={t} className={tint === i ? "on" : ""} style={{ background: t }} onClick={() => setTint(i)} />)}</span></label>
      </div>
      <div className="dim">Appearance is cosmetic only and never changes stats.</div>
      <div className="menu-buttons row">
        <button onClick={() => store.set({ screen: "menu" })}>Back</button>
        <button className="primary" disabled={busy} onClick={async () => { setBusy(true); await controller.createCharacter(name, cls, { body, voice, tint }); }}>Enter Ember Refuge</button>
      </div>
    </div>
  );
}

export function CharactersScreen() {
  const saves = useStore((s) => s.saves);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  return (
    <div className="menu-screen characters">
      <h2>Characters</h2>
      {saves.map((s) => (
        <div key={s.id} className={`save-row ${s.status}`}>
          <div><b>{s.meta.name}</b> — {CLASS_NAME[s.meta.classId] ?? "?"}, level {s.meta.level}{s.meta.difficulty === "veteran" ? ", Veteran" : ""}<div className="dim">Saved {fmtDate(s.updatedAt)} · {Math.floor((s.meta.playTime ?? 0) / 60)} min played</div>
            {s.status === "recoverable" && <div className="warn">Latest save is damaged — a good backup exists.</div>}
            {s.status === "corrupt" && <div className="warn">Save data is corrupt and has no usable backup.</div>}
          </div>
          <div className="save-btns">
            {s.status !== "corrupt" && <button onClick={() => controller.loadCharacter(s.id)}>Play</button>}
            {s.status === "recoverable" && <button onClick={async () => { await controller.repo.restore(s.id); await controller.refreshSaves(); }}>Restore backup</button>}
            {confirmDel === s.id ? <button className="danger" onClick={async () => { await controller.repo.remove(s.id); setConfirmDel(null); await controller.refreshSaves(); }}>Confirm delete</button> : <button onClick={() => setConfirmDel(s.id)}>Delete</button>}
          </div>
        </div>
      ))}
      <div className="menu-buttons row"><button onClick={() => store.set({ screen: "menu" })}>Back</button></div>
    </div>
  );
}

export function SettingsScreen() {
  const from = useStore((s) => s.settingsFrom);
  const [s, setS] = useState<Settings>(() => JSON.parse(JSON.stringify(controller.settings)));
  const [tab, setTab] = useState("video");
  const [capture, setCapture] = useState<Action | null>(null);
  useEffect(() => {
    if (!capture) { controller.input.rebindCapture = null; return; }
    controller.input.rebindCapture = (code) => { if (code) setS((p) => ({ ...p, keys: { ...p.keys, [capture]: code } })); setCapture(null); };
  }, [capture]);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((p) => ({ ...p, [k]: v }));
  const chk = (k: keyof Settings, label: string, hint?: string) => <label className="opt" title={hint}><input type="checkbox" checked={!!s[k]} onChange={(e) => set(k, e.target.checked as any)} /> {label}{hint && <small>{hint}</small>}</label>;
  const done = async (save: boolean) => {
    controller.input.rebindCapture = null;
    if (save) { await controller.saveSettings(s); (window as any).__ashSettings = s; }
    store.set({ screen: from === "pause" ? "game" : "menu" });
  };
  const conflicts = new Set(Object.values(s.keys).filter((v, i, a) => a.indexOf(v) !== i));
  return (
    <div className={`menu-screen settings ${from === "pause" ? "overgame" : ""}`}>
      <h2>Settings</h2>
      <div className="tabs">{[["video", "Video"], ["audio", "Audio"], ["access", "Accessibility"], ["gameplay", "Gameplay"], ["controls", "Controls"]].map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}</div>
      <div className="settings-body">
        {tab === "video" && <>
          <label className="opt">Quality preset <select value={s.quality} onChange={(e) => set("quality", e.target.value as any)}><option value="low">Low (no shadows/glow, 67% resolution)</option><option value="medium">Medium</option><option value="high">High (2K shadows, stronger glow)</option></select></label>
          {chk("dynamicResolution", "Dynamic resolution", "Lowers render scale when the frame rate drops below 48 fps")}
          {chk("shadows", "Shadows")}
          <label className="opt">Particles <input type="range" min={0.25} max={1} step={0.05} value={s.particles} onChange={(e) => set("particles", +e.target.value)} /> {Math.round(s.particles * 100)}%</label>
          {chk("gore", "Blood & debris (stylized)")}
          {chk("screenShake", "Screen shake")}
          {chk("damageNumbers", "Damage numbers")}
          <label className="opt">Item labels <select value={s.labels} onChange={(e) => set("labels", e.target.value as any)}><option value="rare">Rare items always, others nearby</option><option value="always">Always show all</option><option value="alt">Only while Alt is held</option></select></label>
          {chk("showFps", "Show FPS")}
        </>}
        {tab === "audio" && (Object.keys(s.volumes) as (keyof Settings["volumes"])[]).map((k) => (
          <label className="opt" key={k}>{k[0].toUpperCase() + k.slice(1)} <input type="range" min={0} max={1} step={0.05} value={s.volumes[k]} onChange={(e) => setS((p) => ({ ...p, volumes: { ...p.volumes, [k]: +e.target.value } }))} /> {Math.round(s.volumes[k] * 100)}%</label>
        ))}
        {tab === "access" && <>
          {chk("reducedMotion", "Reduced motion", "Disables screen shake and camera sway")}
          {chk("reducedFlash", "Reduce flashes", "Dims impact flashes and rings")}
          {chk("colorblind", "Colorblind mode", "Safe palette plus striped telegraph patterns and stronger boundary lines")}
          {chk("subtitles", "Subtitles for story speech")}
          <div className="dim">UI scales with browser zoom (tested at 100/125/150%). Critical audio cues always have a visual telegraph.</div>
        </>}
        {tab === "gameplay" && <>
          {chk("autoPickup", "Auto-pickup gold, dust and potions (below belt cap)")}
          {chk("attackWithoutMove", "Attack without moving", "Clicking an enemy out of range attacks toward it instead of walking")}
          {chk("advancedItems", "Show item level and affix roll ranges")}
          {chk("orbit", "Middle-mouse camera orbit (±25°)")}
        </>}
        {tab === "controls" && <>
          <div className="dialog-opts"><button onClick={() => set("keys", { ...DEFAULT_KEYS })}>Default preset</button><button onClick={() => set("keys", { ...LEFT_HANDED_KEYS })}>Left-handed preset</button></div>
          <div className="dim">Left click: move / attack · Right click: core skill · Mouse wheel: zoom · Escape: pause (fixed). Click a binding, then press a key or mouse button 4/5 (Esc cancels).</div>
          <div className="keybinds">
            {(Object.keys(ACTION_LABELS) as Action[]).map((a) => (
              <div key={a} className="keyrow"><span>{ACTION_LABELS[a]}</span><button className={`${capture === a ? "capture" : ""} ${conflicts.has(s.keys[a]) ? "conflict" : ""}`} onClick={() => setCapture(a)}>{capture === a ? "Press a key…" : keyName(s.keys[a])}</button></div>
            ))}
          </div>
          {conflicts.size > 0 && <div className="warn">Some keys are bound to more than one action.</div>}
        </>}
      </div>
      <div className="menu-buttons row"><button onClick={() => done(false)}>Cancel</button><button className="primary" onClick={() => done(true)}>Save</button></div>
    </div>
  );
}

export function CreditsScreen() {
  return (
    <div className="menu-screen credits">
      <h2>Credits</h2>
      <p>Ashfall Covenant — an original action-RPG vertical slice.</p>
      <p>Design, code, procedural art and procedural audio generated for this build. Every mesh is assembled from primitives at runtime, every texture is painted procedurally on a canvas, and every sound and note of music is synthesised live with the Web Audio API.</p>
      <p>Built with Babylon.js (Apache-2.0), React (MIT), Vite (MIT) and TypeScript (Apache-2.0).</p>
      <p className="dim">No proprietary names, art, audio, or level layouts are used.</p>
      <div className="menu-buttons row"><button onClick={() => store.set({ screen: "menu" })}>Back</button></div>
    </div>
  );
}

export function PauseMenu() {
  return (
    <div className="modal-bg">
      <div className="panel pause">
        <h2>Paused</h2>
        <div className="menu-buttons">
          <button className="primary" onClick={() => { store.set({ paused: false }); controller.input.enabled = true; }}>Resume</button>
          <button onClick={() => store.set({ screen: "settings", settingsFrom: "pause" })}>Settings</button>
          <button onClick={() => { controller.saveNow(); }}>Save now</button>
          <button onClick={() => controller.quitToMenu()}>Save & quit to menu</button>
        </div>
      </div>
    </div>
  );
}

export function DeathScreen() {
  const d = useStore((s) => s.death);
  if (!d) return null;
  const g = controller.game!;
  const echo = g.ch.echo;
  const typeCol: Record<string, string> = { physical: "#ddd", ember: "#ff6a2a", frost: "#9fdcff", blight: "#b44dff" };
  return (
    <div className="modal-bg death">
      <div className="panel">
        <h2>You have fallen</h2>
        <p>Slain by <b>{d.cause}</b> — <span style={{ color: typeCol[d.type] }}>{d.type} damage</span>.</p>
        <ul className="death-notes">
          <li>Your <b>Echo</b> now waits where you fell, holding {echo?.gold ?? 0} gold (10% of what you carried). Reclaim it once to recover the gold and gain +8% maximum health for 3 minutes. Dying again moves the Echo without losing more.</li>
          <li>Equipped items lost 5% durability. Repair them with Calder the Artificer.</li>
          <li>You will return at your last waypoint. Boss fights reset and can be retried immediately.</li>
        </ul>
        <div className="menu-buttons"><button className="primary" onClick={() => controller.respawn()}>Rise at the waypoint</button></div>
      </div>
    </div>
  );
}

export function ActBanner() {
  const show = useStore((s) => s.actBanner);
  if (!show) return null;
  return (
    <div className="act-banner">
      <div>Act Complete — the Orison Engine is silenced</div>
      <small>Your rewards remain on the ground. Veteran difficulty and Target Hunt are unlocked.</small>
      <button onClick={() => store.set({ summary: true, actBanner: false })}>View run summary</button>
    </div>
  );
}

export function SummaryScreen() {
  const show = useStore((s) => s.summary);
  if (!show) return null;
  const g = controller.game!;
  const ch = g.ch, r = ch.run;
  const mins = Math.max(0, Math.floor((ch.stats.playTime - r.startPlay) / 60));
  return (
    <div className="modal-bg">
      <div className="panel summary">
        <h2>Act I Complete{ch.difficulty === "veteran" ? " — Veteran" : ""}</h2>
        <div className="stats">
          <div className="statrow"><span>Warden</span><b>{ch.name}, {CLASS_NAME[ch.classId]} level {ch.level}</b></div>
          <div className="statrow"><span>Expedition time</span><b>{mins} min</b></div>
          <div className="statrow"><span>Enemies slain</span><b>{r.kills}</b></div>
          <div className="statrow"><span>Deaths</span><b>{r.deaths}</b></div>
          <div className="statrow"><span>Items found</span><b>{r.itemsFound}</b></div>
          <div className="statrow"><span>Best find</span><b>{r.best || "—"}</b></div>
          <div className="statrow"><span>Build</span><b>{Object.entries(ch.ranks).filter(([, v]) => v > 0).map(([k, v]) => `${k.replace(/_/g, " ")} ${v}`).join(", ")}</b></div>
        </div>
        <p>Speak with Marshal Ivra to begin the Veteran expedition or a new seeded expedition. The Target Hunt portal in Ember Refuge now opens short routes to either boss.</p>
        <div className="menu-buttons"><button className="primary" onClick={() => store.set({ summary: false })}>Continue</button></div>
      </div>
    </div>
  );
}

export function Tutorial() {
  const t = useStore((s) => s.tutorial);
  if (!t.visible) return null;
  const steps: [string, string][] = [["move", "Left-click the ground to move"], ["talk", "Click Marshal Ivra (or press F near her)"], ["attack", "Left-click a training dummy to attack"], ["skill", "Right-click to use your core skill"], ["evade", "Press Space to evade toward the cursor"], ["potion", "Press 1 to drink a Red Draught"]];
  return (
    <div className="tutorial">
      <b>Warden's Primer</b>
      {steps.map(([k, l]) => <div key={k} className={t.steps[k] ? "done" : ""}>{t.steps[k] ? "✓" : "○"} {l}</div>)}
      <button onClick={() => controller.skipTutorial()}>Skip</button>
    </div>
  );
}

export function ConfirmModal() {
  const c = useStore((s) => s.confirm);
  if (!c) return null;
  return (
    <div className="modal-bg top">
      <div className="panel confirm">
        <p>{c.text}</p>
        <div className="menu-buttons row"><button onClick={() => store.set({ confirm: null })}>Cancel</button><button className="primary" onClick={() => { const f = c.onYes; store.set({ confirm: null }); f(); }}>{c.yes}</button></div>
      </div>
    </div>
  );
}
