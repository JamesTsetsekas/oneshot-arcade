import { useState, useMemo, useEffect } from "react";
import { Profile, Settings, BIND_LABELS, DEFAULT_SETTINGS, exportProfile, ProgressReport } from "../profile/profile";
import { WEAPONS, PRIMARY_IDS, SIDEARM_IDS } from "../content/weapons";
import { ATTACHMENTS, PERKS, EQUIPMENT, SUPPORT, AttachmentSlot, MAX_ATTACHMENTS, PerkGroup } from "../content/items";
import { Loadout, validateLoadout, cloneLoadout } from "../content/loadout";
import { levelForXp, xpForLevel, MAX_LEVEL, CHALLENGES, unlockTable, RETICLES } from "../content/progression";
import { computeStats } from "../shared/weapon-sim";
import { MatchResult } from "../shared/protocol";
import { keyLabel, TEAM_NAMES } from "./hud";
import { audio } from "../audio/audio";

const click = () => audio.play("uiClick", { bus: "ui", gain: 0.3, priority: 2 });

export function Btn(props: { children: React.ReactNode; onClick: () => void; kind?: "primary" | "ghost" | "danger"; disabled?: boolean; title?: string }) {
  return <button className={`btn ${props.kind ?? ""}`} disabled={props.disabled} title={props.title} onClick={() => { click(); props.onClick(); }} onMouseEnter={() => audio.play("uiHover", { bus: "ui", gain: 0.12, priority: 0 })}>{props.children}</button>;
}

export function Panel(props: { title: string; onBack: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`panel ${props.wide ? "wide" : ""}`}>
      <div className="panel-head"><button className="back" onClick={() => { click(); props.onBack(); }}>‹ Back</button><h1>{props.title}</h1></div>
      <div className="panel-body">{props.children}</div>
    </div>
  );
}

export function LevelBadge({ xp }: { xp: number }) {
  const lvl = levelForXp(xp);
  const a = xpForLevel(lvl), b = xpForLevel(Math.min(MAX_LEVEL, lvl + 1));
  const pct = lvl >= MAX_LEVEL ? 100 : ((xp - a) / (b - a)) * 100;
  return <div className="level-badge"><b>{lvl}</b><div><small>LEVEL</small><div className="xpbar"><i style={{ width: `${pct}%` }} /></div><small>{lvl >= MAX_LEVEL ? "MAX" : `${xp - a} / ${b - a} XP`}</small></div></div>;
}

// ---------------------------------------------------------------- main menu
export function MainMenu(p: { profile: Profile; go: (s: string) => void }) {
  return (
    <div className="menu">
      <div className="menu-left">
        <div className="logo"><span className="logo-mark" /><div><h1>BREACHLINE</h1><small>RELAY STATION K-17 · TEAM CLASH</small></div></div>
        <nav>
          <Btn kind="primary" onClick={() => p.go("practice")}>Practice <small>6v6 vs bots · offline</small></Btn>
          <Btn onClick={() => p.go("loadouts")}>Loadouts</Btn>
          <Btn onClick={() => p.go("profile")}>Profile</Btn>
          <Btn onClick={() => p.go("settings")}>Settings</Btn>
          <Btn onClick={() => p.go("credits")}>Credits</Btn>
        </nav>
        <p className="menu-note">Online Quick Play needs a Breachline room server, which this build does not include. Practice runs the same authoritative room locally in your browser.</p>
      </div>
      <div className="menu-right">
        <div className="card profile-card">
          <small>GUEST PROFILE</small>
          <h2>{p.profile.name}</h2>
          <LevelBadge xp={p.profile.xp} />
          <div className="mini-stats"><span><b>{p.profile.stats.matches}</b> matches</span><span><b>{p.profile.stats.wins}</b> wins</span><span><b>{p.profile.stats.kills}</b> eliminations</span></div>
        </div>
        <div className="card">
          <small>ACTIVE LOADOUT</small>
          <h3>{p.profile.loadouts[p.profile.selected].name}</h3>
          <LoadoutSummary l={p.profile.loadouts[p.profile.selected]} />
        </div>
        <div className="card">
          <small>ONBOARDING CHALLENGES</small>
          <ul className="challenges">{CHALLENGES.map((c) => { const st = p.profile.challenges[c.id]; return <li key={c.id} className={st?.done ? "done" : ""}><b>{c.name}</b><span>{c.desc}</span><i>{st?.done ? "✓" : `${st?.progress ?? 0}/${c.goal}`}</i></li>; })}</ul>
        </div>
      </div>
    </div>
  );
}

export function LoadoutSummary({ l }: { l: Loadout }) {
  return (
    <div className="lo-summary">
      <div><small>Primary</small><b>{WEAPONS[l.primary].name}</b><span>{l.primaryAttachments.map((a) => ATTACHMENTS[a]?.name).join(" · ") || "No attachments"}</span></div>
      <div><small>Sidearm</small><b>{WEAPONS[l.sidearm].name}</b></div>
      <div><small>Perks</small><span>{Object.values(l.perks).map((x) => PERKS[x].name).join(" · ")}</span></div>
      <div><small>Equipment</small><span>{EQUIPMENT[l.lethal].name} · {EQUIPMENT[l.tactical].name}</span></div>
      <div><small>Support</small><span>{l.support.map((x) => SUPPORT[x].name).join(" · ")}</span></div>
    </div>
  );
}

// ---------------------------------------------------------------- practice setup
export function PracticeSetup(p: { profile: Profile; update: (f: (pr: Profile) => void) => void; onBack: () => void; onStart: () => void }) {
  const lp = p.profile.lastPractice;
  const set = (k: keyof Profile["lastPractice"], v: unknown) => p.update((pr) => { (pr.lastPractice as Record<string, unknown>)[k] = v; });
  const level = levelForXp(p.profile.xp);
  return (
    <Panel title="Practice — Team Clash" onBack={p.onBack} wide>
      <div className="practice">
        <div className="map-card">
          <div className="map-art"><MapArt /></div>
          <h2>Relay Station K-17</h2>
          <p>An island communications facility mid-evacuation. Three lanes — the long North Ridge, the Dish Courtyard with its service tunnel, and the pipe-choked South Utility route — connect the Operations Wing and the Maintenance Bay.</p>
          <ul className="rules"><li>Elimination = 1 point · assists score XP only</li><li>First to {lp.scoreLimit} or leader at {Math.round(lp.timeLimit / 60)}:00</li><li>Ties: 60 s sudden death, first to +5</li><li>Respawn 3 s · 2 s spawn protection · friendly fire off</li><li>Momentum 3 / 5 / 8 unlocks support actions (resets on death)</li></ul>
        </div>
        <div className="practice-opts">
          <Field label="Bot difficulty"><Seg value={lp.difficulty} options={[["easy", "Easy"], ["normal", "Normal"], ["hard", "Hard"]]} onChange={(v) => set("difficulty", v)} /></Field>
          <Field label="Team size"><Seg value={String(lp.teamSize)} options={[["6", "6v6"], ["3", "3v3"], ["1", "1v1"]]} onChange={(v) => set("teamSize", Number(v))} /></Field>
          <Field label="Score limit"><Seg value={String(lp.scoreLimit)} options={[["25", "25"], ["50", "50"], ["75", "75"]]} onChange={(v) => set("scoreLimit", Number(v))} /></Field>
          <Field label="Time limit"><Seg value={String(lp.timeLimit)} options={[["300", "5 min"], ["480", "8 min"], ["600", "10 min"]]} onChange={(v) => set("timeLimit", Number(v))} /></Field>
          <Field label="Practice unlocks"><label className="check"><input type="checkbox" checked={p.profile.practiceAllUnlocked} onChange={(e) => p.update((pr) => { pr.practiceAllUnlocked = e.target.checked; })} /> Unlock every weapon, attachment and perk for Practice (level {level} otherwise)</label></Field>
          <Field label="Loadout">
            <div className="lo-pick">{p.profile.loadouts.map((l, i) => {
              const ok = validateLoadout(l, { level, allUnlocked: p.profile.practiceAllUnlocked }).ok;
              return <button key={i} className={`lo-chip ${p.profile.selected === i ? "sel" : ""}`} disabled={!ok} onClick={() => { click(); p.update((pr) => { pr.selected = i; }); }}><b>{l.name}</b><small>{WEAPONS[l.primary].name}</small></button>;
            })}</div>
          </Field>
          <div className="start-row"><Btn kind="primary" onClick={p.onStart}>Deploy</Btn><small>Click the view to capture the mouse. Esc pauses Practice.</small></div>
        </div>
      </div>
    </Panel>
  );
}

function MapArt() {
  return (
    <svg viewBox="-60 -50 120 100" className="map-svg">
      <rect x="-57.5" y="-47.5" width="115" height="95" fill="#2b3740" stroke="#9fb3bd" strokeWidth="0.6" />
      <rect x="-57.5" y="-47.5" width="115" height="27.5" fill="#3a464d" />
      <rect x="-44" y="-14" width="16" height="28" fill="#cfd6d8" opacity="0.85" />
      <rect x="28" y="-14" width="18" height="28" fill="#cfd6d8" opacity="0.85" />
      <circle cx="0" cy="0" r="3.5" fill="#2ec4d6" />
      <rect x="-24" y="10" width="48" height="3" fill="#e8a33d" opacity="0.6" />
      <rect x="-46" y="18" width="92" height="17" fill="#6c7a72" opacity="0.4" />
      <rect x="-57" y="-18" width="10" height="36" fill="#29b6c8" opacity="0.35" />
      <rect x="47" y="-18" width="10" height="36" fill="#e2702b" opacity="0.35" />
      <text x="-36" y="1" fontSize="3.4" fill="#1b252c" textAnchor="middle">OPS</text>
      <text x="37" y="1" fontSize="3.4" fill="#1b252c" textAnchor="middle">BAY</text>
      <text x="0" y="-34" fontSize="3.4" fill="#cfe" textAnchor="middle">NORTH RIDGE</text>
      <text x="0" y="36" fontSize="3.4" fill="#cfe" textAnchor="middle">SOUTH UTILITY</text>
      <text x="0" y="14" fontSize="2.6" fill="#e8a33d" textAnchor="middle">TUNNEL</text>
    </svg>
  );
}

export function Field(p: { label: string; children: React.ReactNode; hint?: string }) {
  return <div className="field"><label>{p.label}</label><div className="field-ctl">{p.children}</div>{p.hint && <small className="hint">{p.hint}</small>}</div>;
}
export function Seg<T extends string>(p: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return <div className="seg">{p.options.map(([v, l]) => <button key={v} className={p.value === v ? "on" : ""} onClick={() => { click(); p.onChange(v); }}>{l}</button>)}</div>;
}
function Slider(p: { value: number; min: number; max: number; step: number; onChange: (v: number) => void; fmt?: (v: number) => string }) {
  return <div className="slider"><input type="range" min={p.min} max={p.max} step={p.step} value={p.value} onChange={(e) => p.onChange(Number(e.target.value))} /><span>{p.fmt ? p.fmt(p.value) : p.value}</span></div>;
}

// ---------------------------------------------------------------- loadout editor
function bars(id: string, atts: string[]) {
  const s = computeStats(id, atts, []);
  const d = s.def;
  const c = (v: number) => Math.max(0.04, Math.min(1, v));
  return [
    ["Damage", c((d.damage.near * d.pellets) / 100)],
    ["Fire rate", c(d.rpm / 1100)],
    ["Range", c((d.damage.farRange * s.rangeMult) / 90)],
    ["Handling", c(1 - (s.adsTime - 0.12) / 0.3)],
    ["Control", c(1 - (s.recoilV + s.recoilH * 1.5) / 4)],
    ["Mobility", c((s.adsMove - 0.5) / 0.4)],
  ] as [string, number][];
}

export function LoadoutEditor(p: { profile: Profile; update: (f: (pr: Profile) => void) => void; onBack: () => void; compact?: boolean }) {
  const [idx, setIdx] = useState(p.profile.selected);
  const [advanced, setAdvanced] = useState(false);
  const level = levelForXp(p.profile.xp);
  const ctx = { level, allUnlocked: p.profile.practiceAllUnlocked };
  const lo = p.profile.loadouts[idx];
  const v = validateLoadout(lo, ctx);
  const edit = (f: (l: Loadout) => void) => p.update((pr) => { const l = cloneLoadout(pr.loadouts[idx]); f(l); pr.loadouts[idx] = l; });
  const locked = (lvl: number) => !(ctx.allUnlocked || level >= lvl);
  const def = WEAPONS[lo.primary];
  const stats = useMemo(() => computeStats(lo.primary, lo.primaryAttachments, Object.values(lo.perks)), [lo]);
  const slots: AttachmentSlot[] = ["optic", "barrel", "underbarrel", "magazine", "stock"];
  return (
    <Panel title="Loadouts" onBack={p.onBack} wide>
      <div className="lo-editor">
        <div className="lo-list">
          {p.profile.loadouts.map((l, i) => <button key={i} className={`lo-item ${i === idx ? "sel" : ""} ${p.profile.selected === i ? "active" : ""}`} onClick={() => { click(); setIdx(i); }}><b>{l.name}</b><small>{WEAPONS[l.primary].name} · {WEAPONS[l.sidearm].name}</small>{p.profile.selected === i && <em>ACTIVE</em>}</button>)}
          <Btn kind="primary" disabled={!v.ok || p.profile.selected === idx} onClick={() => p.update((pr) => { pr.selected = idx; })}>{p.profile.selected === idx ? "Active loadout" : "Set active"}</Btn>
          <label className="check small"><input type="checkbox" checked={p.profile.practiceAllUnlocked} onChange={(e) => p.update((pr) => { pr.practiceAllUnlocked = e.target.checked; })} /> Practice: all unlocks</label>
        </div>
        <div className="lo-main">
          <div className="lo-name"><input value={lo.name} maxLength={20} onChange={(e) => edit((l) => { l.name = e.target.value || "Loadout"; })} />
            {!v.ok && <div className="errors">{v.errors.map((e) => <div key={e}>⚠ {e}</div>)}</div>}
            {v.ok && <div className="ok">✓ Valid for ruleset {v.version}</div>}
          </div>
          <h3>Primary</h3>
          <div className="weapon-grid">{PRIMARY_IDS.map((id) => { const w = WEAPONS[id]; const lk = locked(w.unlockLevel); return (
            <button key={id} className={`wcard ${lo.primary === id ? "sel" : ""} ${lk ? "locked" : ""}`} disabled={lk} onClick={() => { click(); edit((l) => { l.primary = id; l.primaryAttachments = l.primaryAttachments.filter((a) => ATTACHMENTS[a].classes.includes(w.cls)); }); }}>
              <b>{w.name}</b><small>{w.role}</small>{lk && <em>🔒 Level {w.unlockLevel}</em>}
            </button>); })}</div>
          <div className="wdetail">
            <div className="bars">{bars(lo.primary, lo.primaryAttachments).map(([n, x]) => <div key={n} className="bar"><span>{n}</span><i><u style={{ width: `${x * 100}%` }} /></i></div>)}</div>
            <div className="wdesc"><p><b>{def.name}</b> — {def.role}. {def.firstShot}</p>
              <button className="link" onClick={() => setAdvanced(!advanced)}>{advanced ? "Hide" : "Show"} exact stats</button>
              {advanced && <table className="adv"><tbody>
                <tr><td>Damage</td><td>{def.damage.near}{def.pellets > 1 ? ` ×${def.pellets}` : ""} → {def.damage.far} ({(def.damage.nearRange * stats.rangeMult).toFixed(0)}–{(def.damage.farRange * stats.rangeMult).toFixed(0)} m)</td></tr>
                <tr><td>Multipliers</td><td>head ×{def.zones.head} · upper ×{def.zones.upper} · lower ×{def.zones.lower} · limb ×{def.zones.limb}{def.lethalRange ? ` · head/upper lethal ≤ ${def.lethalRange} m` : ""}</td></tr>
                <tr><td>Fire rate</td><td>{def.rpm} RPM · {def.modes.join("/")}</td></tr>
                <tr><td>Magazine</td><td>{stats.mag} + {stats.reserveMax} reserve</td></tr>
                <tr><td>Reload</td><td>{stats.reloadTac.total.toFixed(2)} s tactical · {stats.reloadEmpty.total.toFixed(2)} s empty</td></tr>
                <tr><td>ADS time</td><td>{(stats.adsTime * 1000).toFixed(0)} ms · {stats.adsZoom.toFixed(2)}× · move ×{stats.adsMove.toFixed(2)}</td></tr>
                <tr><td>Sprint-to-fire</td><td>{(stats.sprintToFire * 1000).toFixed(0)} ms</td></tr>
                <tr><td>Hip spread</td><td>{stats.hip.base.toFixed(2)}° base, +{stats.hip.move.toFixed(1)}° moving, max {stats.hip.max.toFixed(1)}°</td></tr>
                <tr><td>Recoil</td><td>{stats.recoilV.toFixed(2)}° vertical · {stats.recoilH.toFixed(2)}° lateral per shot</td></tr>
              </tbody></table>}
            </div>
          </div>
          <h3>Attachments <small>{lo.primaryAttachments.length}/{MAX_ATTACHMENTS}</small></h3>
          <div className="att-grid">{slots.map((slot) => {
            const opts = Object.values(ATTACHMENTS).filter((a) => a.slot === slot && a.classes.includes(def.cls));
            const cur = lo.primaryAttachments.find((a) => ATTACHMENTS[a].slot === slot) ?? "";
            const full = lo.primaryAttachments.length >= MAX_ATTACHMENTS && !cur;
            return (
              <div key={slot} className="att-slot"><small>{slot.toUpperCase()}</small>
                <select value={cur} disabled={opts.length === 0} onChange={(e) => edit((l) => { l.primaryAttachments = l.primaryAttachments.filter((a) => ATTACHMENTS[a].slot !== slot); if (e.target.value) l.primaryAttachments.push(e.target.value); })}>
                  <option value="">{opts.length ? "None" : "Not available"}</option>
                  {opts.map((a) => <option key={a.id} value={a.id} disabled={locked(a.unlockLevel) || (full && a.id !== cur)}>{a.name}{locked(a.unlockLevel) ? ` (Lv ${a.unlockLevel})` : ""}</option>)}
                </select>
                {cur && <div className="tradeoff"><span className="pro">+ {ATTACHMENTS[cur].pro}</span><span className="con">− {ATTACHMENTS[cur].con}</span></div>}
                {full && <div className="tradeoff"><span className="con">Max {MAX_ATTACHMENTS} attachments</span></div>}
              </div>);
          })}</div>
          <div className="lo-row">
            <div><h3>Sidearm</h3><div className="chips">{SIDEARM_IDS.map((id) => { const w = WEAPONS[id]; const lk = locked(w.unlockLevel); return <button key={id} disabled={lk} className={`chip ${lo.sidearm === id ? "sel" : ""}`} onClick={() => edit((l) => { l.sidearm = id; })}><b>{w.name}</b><small>{lk ? `🔒 Lv ${w.unlockLevel}` : w.role}</small></button>; })}</div></div>
          </div>
          <h3>Perks <small>one per group · no damage or health boosts</small></h3>
          <div className="lo-row three">{(["mobility", "awareness", "sustain"] as PerkGroup[]).map((g) => (
            <div key={g}><small className="grp">{g.toUpperCase()}</small><div className="chips col">{Object.values(PERKS).filter((x) => x.group === g).map((pk) => { const lk = locked(pk.unlockLevel); return <button key={pk.id} disabled={lk} className={`chip ${lo.perks[g] === pk.id ? "sel" : ""}`} onClick={() => edit((l) => { l.perks[g] = pk.id; })}><b>{pk.name}</b><small>{lk ? `🔒 Level ${pk.unlockLevel}` : pk.desc}</small></button>; })}</div></div>))}</div>
          <h3>Equipment</h3>
          <div className="lo-row two">{(["lethal", "tactical"] as const).map((k) => (
            <div key={k}><small className="grp">{k.toUpperCase()}</small><div className="chips col">{Object.values(EQUIPMENT).filter((e) => e.kind === k).map((e) => { const lk = locked(e.unlockLevel); return <button key={e.id} disabled={lk} className={`chip ${lo[k] === e.id ? "sel" : ""}`} onClick={() => edit((l) => { l[k] = e.id; })}><b>{e.name}</b><small>{lk ? `🔒 Level ${e.unlockLevel}` : e.desc}</small></button>; })}</div></div>))}</div>
          <h3>Momentum support actions <small>one per tier · resets on death</small></h3>
          <div className="lo-row three">{([3, 5, 8] as const).map((tier, i) => (
            <div key={tier}><small className="grp">TIER {tier}</small><div className="chips col">{Object.values(SUPPORT).filter((s) => s.tier === tier).map((s) => { const lk = locked(s.unlockLevel); return <button key={s.id} disabled={lk} className={`chip ${lo.support[i] === s.id ? "sel" : ""}`} onClick={() => edit((l) => { l.support[i] = s.id; })}><b>{s.name}</b><small>{lk ? `🔒 Level ${s.unlockLevel}` : `${s.desc} Counter: ${s.counter}`}</small></button>; })}</div></div>))}</div>
        </div>
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------- profile
export function ProfileScreen(p: { profile: Profile; update: (f: (pr: Profile) => void) => void; onBack: () => void; onReset: () => void }) {
  const st = p.profile.stats;
  const [confirm, setConfirm] = useState(false);
  const level = levelForXp(p.profile.xp);
  const upcoming = unlockTable().filter((u) => u.level > level).slice(0, 10);
  const download = () => {
    const blob = new Blob([exportProfile(p.profile)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "breachline-profile.json"; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  const acc = st.shots ? ((st.hits / st.shots) * 100).toFixed(1) : "—";
  return (
    <Panel title="Profile" onBack={p.onBack} wide>
      <div className="profile">
        <div className="card">
          <Field label="Callsign"><input className="text" value={p.profile.name} maxLength={16} onChange={(e) => p.update((pr) => { pr.name = e.target.value.replace(/[^\w\- ]/g, "") || "Guest"; })} /></Field>
          <LevelBadge xp={p.profile.xp} />
          <div className="stat-grid">
            <div><b>{st.matches}</b><small>Matches</small></div><div><b>{st.wins}</b><small>Wins</small></div>
            <div><b>{st.kills}</b><small>Eliminations</small></div><div><b>{st.deaths}</b><small>Deaths</small></div>
            <div><b>{st.assists}</b><small>Assists</small></div><div><b>{acc}%</b><small>Accuracy</small></div>
            <div><b>{st.bestStreak}</b><small>Best streak</small></div><div><b>{st.deaths ? (st.kills / st.deaths).toFixed(2) : st.kills}</b><small>K/D</small></div>
          </div>
          <h3>Weapon usage</h3>
          <table className="adv"><thead><tr><th>Weapon</th><th>Kills</th><th>Accuracy</th></tr></thead><tbody>
            {Object.entries(st.weaponUse).sort((a, b) => b[1].kills - a[1].kills).map(([id, u]) => <tr key={id}><td>{WEAPONS[id]?.name ?? id}</td><td>{u.kills}</td><td>{u.shots ? ((u.hits / u.shots) * 100).toFixed(1) : "—"}%</td></tr>)}
            {Object.keys(st.weaponUse).length === 0 && <tr><td colSpan={3}>Play a match to record weapon stats.</td></tr>}
          </tbody></table>
        </div>
        <div className="card">
          <h3>Onboarding challenges</h3>
          <ul className="challenges">{CHALLENGES.map((c) => { const s = p.profile.challenges[c.id]; return <li key={c.id} className={s?.done ? "done" : ""}><b>{c.name}</b><span>{c.desc}</span><i>{s?.done ? "✓" : `${s?.progress ?? 0}/${c.goal}`}</i></li>; })}</ul>
          <h3>Next unlocks <small>sidegrades & cosmetics only</small></h3>
          <ul className="unlocks">{upcoming.map((u) => <li key={u.kind + u.id}><b>Lv {u.level}</b> {u.name} <small>{u.kind}</small></li>)}{upcoming.length === 0 && <li>Everything unlocked.</li>}</ul>
          <h3>Privacy</h3>
          <p className="muted">Your guest profile lives only in this browser's local storage. Nothing is sent anywhere.</p>
          <div className="row"><Btn onClick={download}>Export profile (JSON)</Btn>{!confirm ? <Btn kind="danger" onClick={() => setConfirm(true)}>Reset profile…</Btn> : <Btn kind="danger" onClick={() => { setConfirm(false); p.onReset(); }}>Confirm reset — erases progress</Btn>}</div>
        </div>
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------- settings
export function SettingsScreen(p: { settings: Settings; level: number; onChange: (s: Settings) => void; onBack: () => void; inMatch?: boolean }) {
  const s = p.settings;
  const [rebinding, setRebinding] = useState<string | null>(null);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => p.onChange({ ...s, [k]: v });
  useEffect(() => {
    if (!rebinding) return;
    const onKey = (e: KeyboardEvent) => { e.preventDefault(); e.stopPropagation(); if (e.code !== "Escape") p.onChange({ ...s, binds: { ...s.binds, [rebinding]: e.code } }); setRebinding(null); };
    const onMouse = (e: MouseEvent) => { e.preventDefault(); e.stopPropagation(); p.onChange({ ...s, binds: { ...s.binds, [rebinding]: `Mouse${e.button}` } }); setRebinding(null); };
    const t = setTimeout(() => { window.addEventListener("keydown", onKey, true); window.addEventListener("mousedown", onMouse, true); }, 50);
    return () => { clearTimeout(t); window.removeEventListener("keydown", onKey, true); window.removeEventListener("mousedown", onMouse, true); };
  }, [rebinding, s, p]);
  const conflicts = (code: string) => Object.entries(s.binds).filter(([, c]) => c === code).length > 1;
  return (
    <Panel title="Settings" onBack={p.onBack} wide>
      <div className="settings">
        <section><h3>Video</h3>
          <Field label="Quality preset" hint={p.inMatch ? "Applies from the next match" : "Low: no shadows/bloom · Medium: 3-cascade shadows, bloom · High: 4 cascades, MSAA, sharpen"}><Seg value={s.quality} options={[["low", "Low"], ["medium", "Medium"], ["high", "High"]]} onChange={(v) => set("quality", v)} /></Field>
          <Field label="Sun shadows" hint={p.inMatch ? "Applies from the next match" : undefined}><label className="check"><input type="checkbox" checked={s.shadows} onChange={(e) => set("shadows", e.target.checked)} /> Cascaded shadows</label></Field>
          <Field label="Render scale"><Slider value={s.renderScale} min={0.5} max={1} step={0.05} onChange={(v) => set("renderScale", v)} fmt={(v) => `${Math.round(v * 100)}%`} /></Field>
          <Field label="Field of view (horizontal 16:9)"><Slider value={s.fov} min={75} max={110} step={1} onChange={(v) => set("fov", v)} fmt={(v) => `${v}°`} /></Field>
          <Field label="Viewmodel FOV"><Slider value={s.vmFov} min={55} max={75} step={1} onChange={(v) => set("vmFov", v)} fmt={(v) => `${v}°`} /></Field>
          <Field label="FPS counter"><label className="check"><input type="checkbox" checked={s.showFps} onChange={(e) => set("showFps", e.target.checked)} /> Show</label></Field>
        </section>
        <section><h3>Mouse & aiming</h3>
          <Field label="Sensitivity"><Slider value={s.sens} min={0.1} max={10} step={0.1} onChange={(v) => set("sens", v)} fmt={(v) => v.toFixed(1)} /></Field>
          <Field label="ADS multiplier" hint="Scaled by optic zoom (monitor-distance style)"><Slider value={s.adsSens} min={0.3} max={2} step={0.05} onChange={(v) => set("adsSens", v)} fmt={(v) => `×${v.toFixed(2)}`} /></Field>
          <Field label="Scoped multiplier"><Slider value={s.scopedSens} min={0.3} max={2} step={0.05} onChange={(v) => set("scopedSens", v)} fmt={(v) => `×${v.toFixed(2)}`} /></Field>
          <Field label="Invert Y"><label className="check"><input type="checkbox" checked={s.invertY} onChange={(e) => set("invertY", e.target.checked)} /> Invert</label></Field>
          <Field label="Aim down sights"><Seg value={s.adsMode} options={[["hold", "Hold"], ["toggle", "Toggle"]]} onChange={(v) => set("adsMode", v)} /></Field>
          <Field label="Crouch"><Seg value={s.crouchMode} options={[["toggle", "Toggle"], ["hold", "Hold"]]} onChange={(v) => set("crouchMode", v)} /></Field>
          <Field label="Sprint"><Seg value={s.sprintMode} options={[["hold", "Hold"], ["toggle", "Toggle"]]} onChange={(v) => set("sprintMode", v)} /></Field>
        </section>
        <section><h3>Audio</h3>
          <Field label="Master"><Slider value={s.master} min={0} max={1} step={0.05} onChange={(v) => set("master", v)} fmt={(v) => `${Math.round(v * 100)}`} /></Field>
          <Field label="Effects"><Slider value={s.sfx} min={0} max={1} step={0.05} onChange={(v) => set("sfx", v)} fmt={(v) => `${Math.round(v * 100)}`} /></Field>
          <Field label="Music"><Slider value={s.music} min={0} max={1} step={0.05} onChange={(v) => set("music", v)} fmt={(v) => `${Math.round(v * 100)}`} /></Field>
          <Field label="Hit-marker audio"><label className="check"><input type="checkbox" checked={s.hitmarkerAudio} onChange={(e) => set("hitmarkerAudio", e.target.checked)} /> Play</label></Field>
          <Field label="Subtitles / announcer text"><label className="check"><input type="checkbox" checked={s.subtitles} onChange={(e) => set("subtitles", e.target.checked)} /> Show</label></Field>
        </section>
        <section><h3>Accessibility</h3>
          <Field label="Colorblind IFF" hint="Friendly blue / enemy yellow instead of cyan / orange"><label className="check"><input type="checkbox" checked={s.colorblind} onChange={(e) => set("colorblind", e.target.checked)} /> Enable</label></Field>
          <Field label="Reduced motion"><label className="check"><input type="checkbox" checked={s.reducedMotion} onChange={(e) => set("reducedMotion", e.target.checked)} /> Reduce bob, sway and shake</label></Field>
          <Field label="Photosensitivity" hint="Flash Pulse darkens instead of whiting out; dimmer flashes"><label className="check"><input type="checkbox" checked={s.photosensitive} onChange={(e) => set("photosensitive", e.target.checked)} /> Enable</label></Field>
          <Field label="Camera shake"><Slider value={s.shake} min={0} max={1} step={0.05} onChange={(v) => set("shake", v)} fmt={(v) => `${Math.round(v * 100)}%`} /></Field>
          <Field label="View bob"><Slider value={s.bob} min={0} max={1} step={0.05} onChange={(v) => set("bob", v)} fmt={(v) => `${Math.round(v * 100)}%`} /></Field>
          <Field label="Crosshair colour"><input type="color" value={s.crosshairColor} onChange={(e) => set("crosshairColor", e.target.value)} /></Field>
          <Field label="Reticle"><div className="seg">{RETICLES.map((r) => <button key={r.id} disabled={p.level < r.unlockLevel} className={s.reticle === r.id ? "on" : ""} onClick={() => set("reticle", r.id)}>{r.name}{p.level < r.unlockLevel ? ` · Lv ${r.unlockLevel}` : ""}</button>)}</div></Field>
        </section>
        <section className="binds"><h3>Key bindings</h3>
          <div className="bind-grid">{Object.keys(BIND_LABELS).map((a) => <div key={a} className={`bind ${conflicts(s.binds[a]) ? "conflict" : ""}`}><span>{BIND_LABELS[a]}</span><button onClick={() => setRebinding(a)}>{rebinding === a ? "Press a key…" : keyLabel(s.binds[a])}</button></div>)}</div>
          <div className="row"><Btn onClick={() => p.onChange({ ...s, binds: { ...DEFAULT_SETTINGS.binds } })}>Reset bindings</Btn><Btn onClick={() => p.onChange(JSON.parse(JSON.stringify(DEFAULT_SETTINGS)))}>Reset all settings</Btn></div>
          <p className="muted">Fixed keys: Esc pause / menu. Mouse wheel swaps weapons.</p>
        </section>
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------- credits
export function Credits(p: { onBack: () => void }) {
  return (
    <Panel title="Credits" onBack={p.onBack}>
      <div className="credits">
        <p><b>Breachline</b> is an original arcade military shooter vertical slice. All factions (Halyard Security, Vantor Response), weapons, the map Relay Station K-17, UI, sounds and music are original and generated procedurally at runtime.</p>
        <h3>Open-source software</h3>
        <ul><li>Babylon.js — Apache License 2.0</li><li>React / React DOM — MIT License</li><li>Vite, Vitest, TypeScript — MIT / Apache-2.0 (build & test tooling)</li></ul>
        <h3>Assets</h3>
        <p>No external textures, models or audio files are used. Textures are painted onto canvases, models are assembled from primitives and audio is synthesized with the Web Audio API.</p>
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------- results
export function Results(p: { result: MatchResult; report: ProgressReport; onAgain: () => void; onMenu: () => void }) {
  const r = p.result;
  const me = r.players.find((x) => x.id === r.localId)!;
  const [count, setCount] = useState(25);
  const [stay, setStay] = useState(false);
  useEffect(() => {
    if (stay) return;
    const t = setInterval(() => setCount((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [stay]);
  useEffect(() => { if (count <= 0 && !stay) p.onAgain(); }, [count, stay, p]);
  useEffect(() => { if (p.report.levelAfter > p.report.levelBefore) audio.play("levelUp", { bus: "ui", gain: 0.5, priority: 3 }); }, [p.report]);
  const won = r.winner === me.team;
  const draw = r.winner === -1;
  const acc = Object.entries(me.weapons);
  const team = (t: 0 | 1) => r.players.filter((x) => x.team === t).sort((a, b) => b.score - a.score);
  return (
    <div className="results">
      <div className={`result-banner ${draw ? "draw" : won ? "win" : "loss"}`}><small>TEAM CLASH · RELAY STATION K-17</small><h1>{draw ? "DRAW" : won ? "VICTORY" : "DEFEAT"}</h1><div className="final"><span>{TEAM_NAMES[0]} <b>{r.scores[0]}</b></span><span>—</span><span><b>{r.scores[1]}</b> {TEAM_NAMES[1]}</span></div></div>
      <div className="results-grid">
        <div className="card">
          <h3>Your match</h3>
          <div className="stat-grid">
            <div><b>{me.score}</b><small>Score</small></div><div><b>{me.kills}</b><small>Eliminations</small></div><div><b>{me.deaths}</b><small>Deaths</small></div><div><b>{me.assists}</b><small>Assists</small></div>
            <div><b>{me.bestStreak}</b><small>Best streak</small></div><div><b>{me.headshots}</b><small>Headshots</small></div><div><b>{me.supportDestroyed}</b><small>Support destroyed</small></div><div><b>{me.zonesVisited}/5</b><small>Zones visited</small></div>
          </div>
          <h3>Accuracy by weapon</h3>
          <table className="adv"><thead><tr><th>Weapon</th><th>Shots</th><th>Hits</th><th>Accuracy</th><th>Kills</th></tr></thead><tbody>
            {acc.map(([id, w]) => <tr key={id}><td>{WEAPONS[id]?.name ?? id}</td><td>{w.shots}</td><td>{w.hits}</td><td>{w.shots ? ((w.hits / w.shots) * 100).toFixed(1) : "—"}%</td><td>{w.kills}</td></tr>)}
            {acc.length === 0 && <tr><td colSpan={5}>No shots fired.</td></tr>}
          </tbody></table>
          <p className="muted">Network quality: local Practice room — 0 ms, no packet loss. Result {r.matchId} · integrity {r.signature}</p>
        </div>
        <div className="card">
          <h3>Progression</h3>
          {!p.report.applied && <p className="muted">This result was already applied to your profile.</p>}
          <ul className="xp-lines">{p.report.xpLines.map((l) => <li key={l.label}><span>{l.label}</span><b>+{l.xp}</b></li>)}<li className="total"><span>Total</span><b>+{p.report.totalXp} XP</b></li></ul>
          {p.report.levelAfter > p.report.levelBefore && <div className="levelup">LEVEL UP · {p.report.levelBefore} → {p.report.levelAfter}</div>}
          {p.report.unlocks.length > 0 && <><h3>Unlocked</h3><ul className="unlocks">{p.report.unlocks.map((u) => <li key={u.kind + u.id}><b>{u.name}</b> <small>{u.kind}</small></li>)}</ul></>}
          {p.report.challengesCompleted.length > 0 && <><h3>Challenges completed</h3><ul className="unlocks">{p.report.challengesCompleted.map((c) => <li key={c}><b>{c}</b></li>)}</ul></>}
        </div>
        <div className="card scoreboard-card">
          {([0, 1] as const).map((t) => <div key={t} className={`sb-team ${t === me.team ? "friendly" : "enemy"}`}><h3>{TEAM_NAMES[t]} <span>{r.scores[t]}</span></h3><table><thead><tr><th>Name</th><th>Score</th><th>K</th><th>D</th><th>A</th><th>Streak</th><th>Sup.</th></tr></thead><tbody>{team(t).map((x) => <tr key={x.id} className={x.id === me.id ? "me" : ""}><td>{x.name}{x.bot ? " · BOT" : ""}</td><td>{x.score}</td><td>{x.kills}</td><td>{x.deaths}</td><td>{x.assists}</td><td>{x.bestStreak}</td><td>{x.supportDestroyed}</td></tr>)}</tbody></table></div>)}
        </div>
      </div>
      <div className="results-actions">
        <Btn kind="primary" onClick={p.onAgain}>Play again{!stay ? ` (${Math.max(0, count)})` : ""}</Btn>
        {!stay && <Btn kind="ghost" onClick={() => setStay(true)}>Stay on results</Btn>}
        <Btn onClick={p.onMenu}>Main menu</Btn>
      </div>
    </div>
  );
}
