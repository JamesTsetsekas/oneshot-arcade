// Shared React panels: settings, loadout editor, profile, credits.
import { useEffect, useMemo, useState } from "react";
import { PRESETS, KEY_LABELS, DEFAULT_KEYS, defaultSettings, type Settings, type QualityPreset } from "../runtime/settings";
import { ATTACHMENTS, ATTACHMENT_SLOTS, MAX_ATTACHMENTS, type AttachSlot } from "../../shared/content/attachments";
import { WEAPONS, PRIMARY_IDS, SECONDARY_IDS, weaponLabel } from "../../shared/content/weapons";
import { EQUIPMENT, LETHAL_IDS, TACTICAL_IDS, PERKS, PERK_GROUPS, SUPPORTS, SUPPORT_BY_TIER, SUPPORT_TIERS } from "../../shared/content/gear";
import { resolveWeaponStats, validateLoadout, type Loadout } from "../../shared/content/loadout";
import { UNLOCK_LEVELS, levelFromXp, MAX_LEVEL } from "../../shared/content/progression";
import { ICONS } from "./hud";
import type { Profile } from "../runtime/profile";

export function Slider(p: { label: string; value: number; min: number; max: number; step: number; onChange(v: number): void; fmt?(v: number): string }) {
  return (
    <div className="field">
      <label>{p.label}</label>
      <input type="range" min={p.min} max={p.max} step={p.step} value={p.value} onChange={(e) => p.onChange(parseFloat(e.target.value))} aria-label={p.label} />
      <span className="val">{p.fmt ? p.fmt(p.value) : p.value}</span>
    </div>
  );
}
export function Check(p: { label: string; value: boolean; onChange(v: boolean): void }) {
  return (
    <div className="field check">
      <label>{p.label}</label>
      <span className="val"><input type="checkbox" checked={p.value} onChange={(e) => p.onChange(e.target.checked)} aria-label={p.label} /></span>
    </div>
  );
}
function Seg<T extends string>(p: { value: T; options: Array<[T, string]>; onChange: (v: T) => void }) {
  return <span className="seg">{p.options.map(([v, l]) => <button key={v} className={p.value === v ? "on" : ""} onClick={() => p.onChange(v)}>{l}</button>)}</span>;
}

const codeLabel = (c: string) => c.replace("Key", "").replace("Digit", "").replace("Left", "").replace("Space", "Space").replace("Control", "Ctrl") || c;

function KeyBind(p: { action: string; code: string; onSet(code: string): void; conflict: boolean }) {
  const [listen, setListen] = useState(false);
  useEffect(() => {
    if (!listen) return;
    const h = (e: KeyboardEvent) => { e.preventDefault(); e.stopPropagation(); if (e.code !== "Escape") p.onSet(e.code); setListen(false); };
    window.addEventListener("keydown", h, true);
    return () => window.removeEventListener("keydown", h, true);
  }, [listen]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="field" style={{ gridTemplateColumns: "1fr auto" }}>
      <label>{KEY_LABELS[p.action]}</label>
      <button className={"keybtn" + (listen ? " listen" : "")} onClick={() => setListen(true)} style={p.conflict ? { outline: "1px solid #ff5d73" } : undefined}>{listen ? "press a key…" : codeLabel(p.code)}</button>
    </div>
  );
}

export function SettingsPanel(p: { settings: Settings; onChange(s: Settings): void }) {
  const s = p.settings;
  type Tab = "graphics" | "controls" | "audio" | "access" | "keys";
  const [tab, setTab] = useState<Tab>("graphics");
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => p.onChange({ ...s, [k]: v });
  const preset = (pr: QualityPreset) => p.onChange({ ...s, preset: pr, ...PRESETS[pr] });
  const usedCodes = useMemo(() => { const m = new Map<string, number>(); Object.values(s.keys).forEach((c) => m.set(c, (m.get(c) ?? 0) + 1)); return m; }, [s.keys]);
  const keyActions = Object.keys(KEY_LABELS).filter((k) => !["interact", "fireMode"].includes(k));
  return (
    <div className="col" style={{ minHeight: 0 }}>
      <div className="row" style={{ marginBottom: 12 }}>
        <Seg<Tab> value={tab} onChange={setTab} options={[["graphics", "Graphics"], ["controls", "Mouse & camera"], ["audio", "Audio"], ["access", "Accessibility"], ["keys", "Key bindings"]]} />
      </div>
      <div className="scroll" style={{ maxHeight: "60vh" }}>
        {tab === "graphics" && (<>
          <div className="field" style={{ gridTemplateColumns: "170px 1fr" }}><label>Quality preset</label><Seg value={s.preset} onChange={preset} options={[["low", "Low"], ["medium", "Medium"], ["high", "High"]]} /></div>
          <Slider label="Render scale" value={s.renderScale} min={0.5} max={1} step={0.05} onChange={(v) => set("renderScale", v)} fmt={(v) => Math.round(v * 100) + "%"} />
          <Check label="Dynamic resolution" value={s.dynamicResolution} onChange={(v) => set("dynamicResolution", v)} />
          <Check label="Cascaded sun shadows" value={s.shadows} onChange={(v) => set("shadows", v)} />
          <Slider label="Effects density" value={s.effects} min={0.25} max={1} step={0.05} onChange={(v) => set("effects", v)} fmt={(v) => Math.round(v * 100) + "%"} />
          <Check label="Anti-aliasing" value={s.antiAliasing} onChange={(v) => set("antiAliasing", v)} />
          <Check label="Show FPS / sim time" value={s.showFps} onChange={(v) => set("showFps", v)} />
          <p className="tips">Shadow, anti-aliasing and preset changes rebuild the render pipeline and apply immediately.</p>
        </>)}
        {tab === "controls" && (<>
          <Slider label="Field of view (horizontal)" value={s.fov} min={75} max={110} step={1} onChange={(v) => set("fov", v)} fmt={(v) => v + "°"} />
          <Slider label="Viewmodel FOV" value={s.viewmodelFov} min={55} max={75} step={1} onChange={(v) => set("viewmodelFov", v)} fmt={(v) => v + "°"} />
          <Slider label="Mouse sensitivity" value={s.sensitivity} min={0.1} max={10} step={0.1} onChange={(v) => set("sensitivity", v)} fmt={(v) => v.toFixed(1)} />
          <Slider label="ADS sensitivity multiplier" value={s.adsSensMul} min={0.3} max={1.5} step={0.05} onChange={(v) => set("adsSensMul", v)} fmt={(v) => v.toFixed(2) + "x"} />
          <Check label="Invert Y axis" value={s.invertY} onChange={(v) => set("invertY", v)} />
          <Check label="Hold to aim (off = toggle)" value={s.holdAds} onChange={(v) => set("holdAds", v)} />
          <Check label="Hold to crouch (off = toggle)" value={s.holdCrouch} onChange={(v) => set("holdCrouch", v)} />
          <Check label="Hold to sprint (off = toggle)" value={s.holdSprint} onChange={(v) => set("holdSprint", v)} />
          <p className="tips">Raw mouse input is requested where the browser supports it; no acceleration is added.</p>
        </>)}
        {tab === "audio" && (<>
          <Slider label="Master volume" value={s.masterVolume} min={0} max={1} step={0.05} onChange={(v) => set("masterVolume", v)} fmt={(v) => Math.round(v * 100) + "%"} />
          <Slider label="Effects volume" value={s.sfxVolume} min={0} max={1} step={0.05} onChange={(v) => set("sfxVolume", v)} fmt={(v) => Math.round(v * 100) + "%"} />
          <Slider label="Music volume" value={s.musicVolume} min={0} max={1} step={0.05} onChange={(v) => set("musicVolume", v)} fmt={(v) => Math.round(v * 100) + "%"} />
          <Check label="Hit-marker sounds" value={s.hitMarkerAudio} onChange={(v) => set("hitMarkerAudio", v)} />
          <Check label="Directional sound cues (visual)" value={s.subtitles} onChange={(v) => set("subtitles", v)} />
        </>)}
        {tab === "access" && (<>
          <div className="field" style={{ gridTemplateColumns: "170px 1fr" }}><label>Team colours</label><Seg value={s.colorblind} onChange={(v) => set("colorblind", v)} options={[["off", "Default"], ["deuteranopia", "Deuter."], ["protanopia", "Protan."], ["tritanopia", "Tritan."]]} /></div>
          <Check label="Reduced motion" value={s.reducedMotion} onChange={(v) => set("reducedMotion", v)} />
          <Check label="Photosensitivity mode (softer flash and bloom)" value={s.photosensitive} onChange={(v) => set("photosensitive", v)} />
          <Slider label="Weapon bob" value={s.bobScale} min={0} max={1} step={0.05} onChange={(v) => set("bobScale", v)} fmt={(v) => Math.round(v * 100) + "%"} />
          <Slider label="Damage / explosion shake" value={s.shakeScale} min={0} max={1} step={0.05} onChange={(v) => set("shakeScale", v)} fmt={(v) => Math.round(v * 100) + "%"} />
          <p className="tips">Sprint bob, landing impulse, recoil, damage shake and explosions are separate additive layers. None of them move the real aim ray.</p>
        </>)}
        {tab === "keys" && (<>
          <div className="keygrid">
            {keyActions.map((a) => <KeyBind key={a} action={a} code={s.keys[a] ?? DEFAULT_KEYS[a]} conflict={(usedCodes.get(s.keys[a]) ?? 0) > 1} onSet={(code) => set("keys", { ...s.keys, [a]: code })} />)}
          </div>
          <div className="row" style={{ marginTop: 12 }}><button className="btn sm" onClick={() => set("keys", { ...DEFAULT_KEYS })}>Reset key bindings</button><button className="btn sm" onClick={() => p.onChange(defaultSettings())}>Reset all settings</button></div>
          <p className="tips">Fire is the left mouse button, aim is the right mouse button, wheel swaps weapons. Red outline = duplicate binding.</p>
        </>)}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- loadout editor
const pct = (v: number) => `${Math.max(2, Math.min(100, v * 100)).toFixed(0)}%`;

function StatBars(p: { weaponId: string; attach: string[]; perks: string[] }) {
  const st = resolveWeaponStats(p.weaponId, p.attach, p.perks);
  const d = st.def;
  const dmg = st.damage * d.pellets * (d.cls === "shotgun" ? 0.8 : 1);
  const bars: Array<[string, number, string]> = [
    ["Damage", Math.min(1, dmg / 110), `${Math.round(st.damage)}${d.pellets > 1 ? ` x${d.pellets}` : ""}`],
    ["Fire rate", Math.min(1, st.rpm / 1000), `${Math.round(st.rpm)} rpm`],
    ["Range", Math.min(1, (d.falloffEnd * st.falloffRange) / 100), `${Math.round(d.falloffStart * st.falloffRange)}-${Math.round(d.falloffEnd * st.falloffRange)} m`],
    ["Recoil control", Math.max(0.05, 1 - (d.recoil.pitchPerShot * st.recoilPitch) / 4.2), `${(d.recoil.pitchPerShot * st.recoilPitch).toFixed(2)}°/shot`],
    ["Hip accuracy", Math.max(0.05, 1 - st.hipSpread / 5.5), `${st.hipSpread.toFixed(1)}°`],
    ["Aim speed", Math.max(0.05, 1 - st.adsTime / 0.42), `${Math.round(st.adsTime * 1000)} ms`],
    ["Mobility", Math.max(0.05, (st.moveMul - 0.85) / 0.25), `${(st.moveMul * 100).toFixed(0)}%`],
    ["Magazine", Math.min(1, st.magSize / 60), `${st.magSize}`],
  ];
  const body = d.damage * d.zoneMul.upper;
  const shots = Math.ceil(100 / (body * d.pellets * (d.pellets > 1 ? 0.55 : 1)));
  const ttk = Math.round((shots - 1) * st.interval * 1000);
  return (
    <div>
      {bars.map(([n, v, t]) => <div className="stat" key={n}><span>{n}</span><div className="bar"><i style={{ width: pct(v) }} /></div><span>{t}</span></div>)}
      <div className="stat" style={{ marginTop: 10 }}><span>Close TTK</span><div className="bar"><i className="good" style={{ width: pct(Math.max(0.05, 1 - ttk / 900)) }} /></div><span>{d.cls === "marksman" ? "1 shot" : ttk + " ms"}</span></div>
    </div>
  );
}

export function LoadoutEditor(p: { loadouts: Loadout[]; selected: number; onSelect(i: number): void; onChange(i: number, l: Loadout): void; unlockedLevel?: number }) {
  const [adv, setAdv] = useState(false);
  const l = p.loadouts[p.selected];
  const v = validateLoadout(l);
  const set = (patch: Partial<Loadout>) => p.onChange(p.selected, { ...l, ...patch });
  const primary = WEAPONS[l.primary];
  const attachOptions = (slot: AttachSlot) => Object.values(ATTACHMENTS).filter((a) => a.slot === slot);
  const toggleAttach = (id: string) => {
    const a = ATTACHMENTS[id];
    let next = l.attachments.filter((x) => ATTACHMENTS[x]?.slot !== a.slot);
    if (!l.attachments.includes(id)) next = [...next, id];
    if (next.length > MAX_ATTACHMENTS) next = next.slice(next.length - MAX_ATTACHMENTS);
    set({ attachments: next });
  };
  const setPrimary = (id: string) => {
    const w = WEAPONS[id];
    set({ primary: id, attachments: l.attachments.filter((x) => !ATTACHMENTS[x].excludeClasses?.includes(w.cls)) });
  };
  const lv = p.unlockedLevel ?? MAX_LEVEL;
  const lockTag = (id: string) => (UNLOCK_LEVELS[id] ?? 1) > lv ? `Lv ${UNLOCK_LEVELS[id]}` : "";
  const attachCount = l.attachments.length;
  return (
    <div className="lo-grid">
      <div className="slots scroll">
        {p.loadouts.map((x, i) => (
          <div key={i} className={"slot" + (i === p.selected ? " on" : "")} onClick={() => p.onSelect(i)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && p.onSelect(i)}>
            <b>{i + 1}. {x.name}</b><small>{WEAPONS[x.primary]?.designation} · {WEAPONS[x.secondary]?.designation}</small>
          </div>
        ))}
        <p className="tips" style={{ marginTop: 10 }}>All gameplay unlocks are open in Practice. Unlocks are sidegrades: none raise health or base damage.</p>
      </div>
      <div className="scroll">
        <div className="sect"><h4>Loadout name</h4><input style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--line)", color: "var(--txt)", padding: "7px 10px", width: 260, fontFamily: "inherit" }} maxLength={18} value={l.name} onChange={(e) => set({ name: e.target.value || "Loadout" })} aria-label="Loadout name" /></div>
        <div className="sect"><h4>Primary weapon</h4>
          <div className="pickgrid">{PRIMARY_IDS.map((id) => <button key={id} className={"pick" + (l.primary === id ? " on" : "")} onClick={() => setPrimary(id)}><b>{weaponLabel(WEAPONS[id])}</b><small>{WEAPONS[id].blurb.slice(0, 54)}…</small></button>)}</div></div>
        <div className="sect"><h4>Sidearm</h4>
          <div className="pickgrid">{SECONDARY_IDS.map((id) => <button key={id} className={"pick" + (l.secondary === id ? " on" : "")} onClick={() => set({ secondary: id })}><b>{weaponLabel(WEAPONS[id])}</b><small>{WEAPONS[id].blurb.slice(0, 54)}…</small></button>)}</div></div>
        <div className="sect"><h4>Attachments ({attachCount}/{MAX_ATTACHMENTS}) — one per slot</h4>
          {ATTACHMENT_SLOTS.map((slot) => (
            <div key={slot} style={{ marginBottom: 8 }}><small style={{ color: "var(--dim)", letterSpacing: "0.2em", fontSize: 10 }}>{slot.toUpperCase()}</small>
              <div className="pickgrid">{attachOptions(slot).map((a) => {
                const blocked = a.excludeClasses?.includes(primary.cls);
                const on = l.attachments.includes(a.id);
                return <button key={a.id} disabled={blocked} className={"pick" + (on ? " on" : "") + (blocked ? " bad" : "")} onClick={() => toggleAttach(a.id)} title={blocked ? "Cannot be fitted to this weapon" : ""}><b>{a.name}</b><small><span className="pro">+ {a.pro}</span><br /><span className="con">− {a.con}</span></small></button>;
              })}</div></div>
          ))}
        </div>
        <div className="sect"><h4>Perks — one per group</h4>
          {PERK_GROUPS.map((g, gi) => (<div key={g} style={{ marginBottom: 8 }}><small style={{ color: "var(--dim)", letterSpacing: "0.2em", fontSize: 10 }}>{g.toUpperCase()}</small>
            <div className="pickgrid">{Object.values(PERKS).filter((x) => x.group === g).map((x) => <button key={x.id} className={"pick" + (l.perks[gi] === x.id ? " on" : "")} onClick={() => { const pk = [...l.perks] as [string, string, string]; pk[gi] = x.id; set({ perks: pk }); }}><b>{x.name}</b><small><span className="pro">+ {x.desc}</span><br /><span className="con">− {x.tradeoff}</span></small></button>)}</div></div>))}
        </div>
        <div className="sect"><h4>Equipment</h4>
          <div className="pickgrid">{LETHAL_IDS.map((id) => <button key={id} className={"pick" + (l.lethal === id ? " on" : "")} onClick={() => set({ lethal: id })}><b>{EQUIPMENT[id].name}</b><small>{EQUIPMENT[id].desc}</small></button>)}</div>
          <div className="pickgrid" style={{ marginTop: 8 }}>{TACTICAL_IDS.map((id) => <button key={id} className={"pick" + (l.tactical === id ? " on" : "")} onClick={() => set({ tactical: id })}><b>{EQUIPMENT[id].name}</b><small>{EQUIPMENT[id].desc}</small></button>)}</div>
        </div>
        <div className="sect"><h4>Momentum support actions — one per tier (earned at 3, 5 and 8 Momentum)</h4>
          {SUPPORT_TIERS.map((tier, ti) => (<div key={tier} style={{ marginBottom: 8 }}><small style={{ color: "var(--dim)", letterSpacing: "0.2em", fontSize: 10 }}>TIER {tier}</small>
            <div className="pickgrid">{SUPPORT_BY_TIER[tier].map((id) => <button key={id} className={"pick" + (l.support[ti] === id ? " on" : "")} onClick={() => { const sp = [...l.support] as [string, string, string]; sp[ti] = id; set({ support: sp }); }}><b>{SUPPORTS[id].name}</b><small>{SUPPORTS[id].desc}<br /><span className="con">Counter: {SUPPORTS[id].counter}</span></small></button>)}</div></div>))}
        </div>
      </div>
      <div className="scroll">
        <div className="card">
          <h3>{weaponLabel(primary)}</h3>
          <StatBars weaponId={l.primary} attach={l.attachments} perks={l.perks} />
          <div className="row" style={{ marginTop: 10 }}><button className="btn sm" onClick={() => setAdv(!adv)}>{adv ? "Hide" : "Show"} advanced stats</button></div>
          {adv && <AdvStats weaponId={l.primary} attach={l.attachments} perks={l.perks} />}
        </div>
        <div className="card" style={{ marginTop: 12 }}>
          <h3>Validation</h3>
          {v.ok ? <span className="pro">Loadout is legal for ruleset tc-1.0</span> : v.errors.map((e) => <div key={e} className="warn">{e}</div>)}
          <div className="tips" style={{ marginTop: 8 }}>
            Equipment: <b>{EQUIPMENT[l.lethal].name}</b>, <b>{EQUIPMENT[l.tactical].name}</b><br />
            Support: {l.support.map((s) => SUPPORTS[s].name).join(" / ")}<br />
            {Object.values(UNLOCK_LEVELS).length > 0 && [l.primary, l.secondary, ...l.attachments].map(lockTag).filter(Boolean).length > 0 && <span className="warn">Some items unlock by account level in online play.</span>}
          </div>
        </div>
        <div className="card" style={{ marginTop: 12 }}><h3>Icons</h3><div className="row">{[l.lethal, l.tactical, ...l.support].map((i, k) => <span key={k} style={{ width: 30, height: 30, color: "var(--acc)", display: "inline-block" }} dangerouslySetInnerHTML={{ __html: ICONS[i] ?? "" }} />)}</div></div>
      </div>
    </div>
  );
}

function AdvStats(p: { weaponId: string; attach: string[]; perks: string[] }) {
  const s = resolveWeaponStats(p.weaponId, p.attach, p.perks);
  const d = s.def;
  const rows: Array<[string, string]> = [
    ["Rate of fire", `${s.rpm} RPM (${(s.interval * 1000).toFixed(0)} ms)`], ["Damage", `${s.damage}${d.pellets > 1 ? " x " + d.pellets + " pellets" : ""}`],
    ["Zone multipliers", `head ${d.zoneMul.head}x · upper ${d.zoneMul.upper}x · lower ${d.zoneMul.lower}x · limb ${d.zoneMul.limb}x`],
    ["Falloff", `${(d.falloffStart * s.falloffRange).toFixed(0)} → ${(d.falloffEnd * s.falloffRange).toFixed(0)} m, min ${(d.minDamageMul * 100).toFixed(0)}%`],
    ["Magazine / reserve", `${s.magSize} / ${s.reserve}`], ["Reload (tactical / empty)", `${s.reloadTactical.toFixed(2)} s / ${s.reloadEmpty.toFixed(2)} s`],
    ["Weapon swap", `${(s.swapTime * 1000).toFixed(0)} ms`], ["ADS time / FOV", `${(s.adsTime * 1000).toFixed(0)} ms / ${(s.adsFov * 100).toFixed(0)}%`],
    ["Move / ADS move", `${(s.moveMul * 100).toFixed(1)}% / ${(s.adsMove * 100).toFixed(0)}%`], ["Sprint-to-fire", `${(s.sprintOut * 1000).toFixed(0)} ms`],
    ["Spread hip / move / ADS", `${s.hipSpread.toFixed(2)}° / ${s.hipSpreadMove.toFixed(2)}° / ${s.adsSpread.toFixed(2)}°`],
    ["Recoil pitch / yaw scale", `${(d.recoil.pitchPerShot * s.recoilPitch).toFixed(2)}° / ${(s.recoilYaw * 100).toFixed(0)}%`], ["Penetration energy", `${d.penetration.toFixed(2)}`],
    ["Suppressed", s.suppressed ? "yes (no tracer, hidden from radar)" : "no"],
  ];
  return <table className="board" style={{ marginTop: 10 }}><tbody>{rows.map(([a, b]) => <tr key={a}><td className="nm" style={{ color: "var(--dim)" }}>{a}</td><td style={{ textAlign: "right" }}>{b}</td></tr>)}</tbody></table>;
}

// ---------------------------------------------------------------- profile
export function ProfilePanel(p: { profile: Profile; onReset(): void; onExport(): void }) {
  const pr = p.profile;
  const lv = levelFromXp(pr.xp);
  const acc = pr.shots ? Math.round((pr.hits / pr.shots) * 100) : 0;
  const kd = pr.deaths ? (pr.kills / pr.deaths).toFixed(2) : pr.kills.toString();
  const challenges: Array<[string, string, boolean]> = [
    ["First contact", "Finish a Practice match. Try aiming down sights (right mouse) to tighten your spread.", pr.matches >= 1],
    ["Hardware check", "Score 10 eliminations. Equipment (G / Q) is how you clear corners.", pr.kills >= 10],
    ["Team player", "Earn 5 assists. Assists share Momentum but do not add team score.", pr.assists >= 5],
    ["On a roll", "Reach a 3-elimination streak in one life to earn a tier-3 support action.", pr.bestStreak >= 3],
    ["Know the routes", "Win a match. The north ridge is long, the utility pipeway is short and dark.", pr.wins >= 1],
  ];
  const usage = Object.entries(pr.weaponUsage).sort((a, b) => b[1].kills - a[1].kills);
  return (
    <div className="col" style={{ gap: 14 }}>
      <div className="card">
        <h3>Guest profile · {pr.guestId}</h3>
        <div className="row"><div style={{ fontSize: 44, fontWeight: 800 }}>LV {lv.level}</div><div style={{ flex: 1, minWidth: 200 }}><small style={{ color: "var(--dim)", letterSpacing: "0.2em" }}>{lv.level >= MAX_LEVEL ? "MAX LEVEL" : `${lv.into} / ${lv.need} XP`}</small><div className="xpbar"><i style={{ width: lv.level >= MAX_LEVEL ? "100%" : `${(lv.into / lv.need) * 100}%` }} /></div></div></div>
        <div className="kv" style={{ marginTop: 12 }}><div><small>MATCHES</small><b>{pr.matches}</b></div><div><small>WINS</small><b>{pr.wins}</b></div><div><small>K/D</small><b>{kd}</b></div><div><small>ACCURACY</small><b>{acc}%</b></div></div>
      </div>
      <div className="card"><h3>Onboarding challenges (cosmetic badges only)</h3>
        {challenges.map(([n, d, done]) => <div key={n} className="xp-line"><span><b style={{ color: done ? "var(--good)" : "var(--txt)" }}>{done ? "✓ " : "○ "}{n}</b><br /><small style={{ color: "var(--dim)" }}>{d}</small></span></div>)}
      </div>
      <div className="card"><h3>Weapon usage</h3>
        {usage.length === 0 ? <span className="tips">Play a match to see per-weapon accuracy and eliminations.</span> : <table className="board"><thead><tr><th className="nm">Weapon</th><th>Shots</th><th>Acc</th><th>Elims</th></tr></thead><tbody>{usage.map(([id, u]) => <tr key={id}><td className="nm">{WEAPONS[id] ? weaponLabel(WEAPONS[id]) : id}</td><td>{u.shots}</td><td>{u.shots ? Math.round((u.hits / u.shots) * 100) : 0}%</td><td>{u.kills}</td></tr>)}</tbody></table>}
      </div>
      <div className="row"><button className="btn sm" onClick={p.onExport}>Export profile (JSON)</button><button className="btn sm danger" onClick={() => { if (confirm("Reset all progress, stats and loadouts on this device?")) p.onReset(); }}>Reset profile</button></div>
      <p className="tips">Everything is stored locally in this browser. No account, no telemetry. Unlocks are sidegrades only; none change base health or universal damage.</p>
    </div>
  );
}

export function Credits() {
  return (
    <div className="card credits-list">
      <h3>Credits and licenses</h3>
      <p><b>Breachline</b> is an original fictional-setting browser FPS built for Oneshot Arcade. Factions (Meridian Guard, Ashfall Security), weapons, maps, UI, music and sounds are original.</p>
      <p>All art, models, textures, sound effects and music are generated procedurally in code at runtime; no third-party media files are shipped.</p>
      <p>Engine: Babylon.js (Apache-2.0). UI: React (MIT). Build tooling: Vite (MIT), TypeScript (Apache-2.0), Vitest (MIT).</p>
      <p>See <b>ASSETS.md</b> in the project root for the full source and license list.</p>
    </div>
  );
}
