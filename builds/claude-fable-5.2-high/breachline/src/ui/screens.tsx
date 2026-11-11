// client-ui: React screens for the shell (menus, loadout editor, settings, profile, results).
import { useEffect, useMemo, useState } from 'react';
import { EQUIP_BY_ID, LETHALS, PERK_GROUPS, PERKS, SUPPORT_TIERS, TACTICALS } from '../content/kit';
import { Loadout, PRACTICE_RULESET, validateLoadout } from '../content/loadout';
import { CHALLENGES, levelForXp, MAX_LEVEL, UNLOCK_TRACK, xpForLevel } from '../content/progression';
import { TEAM_LONG, TEAM_NAMES } from '../content/tuning';
import { ATTACHMENTS, AttachSlot, damageAt, MAX_ATTACHMENTS, PRIMARIES, resolveWeapon, SIDEARMS, statBars, WEAPON_BY_ID, WeaponStats } from '../content/weapons';
import { ACTION_LABELS, Action, ApplyOutcome, DEFAULT_BINDS, DEFAULT_SETTINGS, exportProfile, PracticeOptions, Profile, Settings } from '../profile/profile';
import type { MatchResult } from '../protocol/messages';
import { LATENCY_PRESETS } from '../client/net';

type Upd = (fn: (p: Profile) => void) => void;
const pct = (v: number): string => `${Math.round(v * 100)}%`;

export function XpCard({ profile }: { profile: Profile }) {
  const lvl = levelForXp(profile.xp);
  const a = xpForLevel(lvl), b = xpForLevel(lvl + 1);
  const frac = lvl >= MAX_LEVEL ? 1 : (profile.xp - a) / Math.max(1, b - a);
  return (
    <div className="profilecard">
      <div className="r"><span className="nm">{profile.name}</span><span className="lv">LEVEL {lvl}</span></div>
      <div className="xpbar"><b style={{ width: pct(frac) }} /></div>
      <div className="sm"><span>{lvl >= MAX_LEVEL ? 'Max level' : `${profile.xp - a} / ${b - a} XP`}</span><span>{profile.stats.matches} matches · {profile.stats.wins} wins</span></div>
    </div>
  );
}

// ------------------------------------------------------------------ practice setup
export function PracticeSetup({ profile, update, onStart, onBack, onEdit }: { profile: Profile; update: Upd; onStart: () => void; onBack: () => void; onEdit: () => void }) {
  const o = profile.practice;
  const set = (fn: (o: PracticeOptions) => void) => update((p) => fn(p.practice));
  const lo = profile.loadouts[profile.selected];
  return (
    <div className="shell solid">
      <div className="page">
        <div className="head">
          <div><h1>Practice · Team Clash</h1><div className="sub">Relay Station K-17 · bots fill every open seat · runs entirely in your browser</div></div>
          <button className="btn sm" onClick={onBack}>Back</button>
        </div>
        <div className="body">
          <div className="grid2">
            <div className="panel">
              <h2>Match rules</h2>
              <div className="field"><label>Bot difficulty</label>
                <div className="seg">{(['easy', 'normal', 'hard'] as const).map((d) => <button key={d} className={o.difficulty === d ? 'on' : ''} onClick={() => set((x) => { x.difficulty = d; })}>{d}</button>)}</div><span />
                <div className="hint">Difficulty changes reaction time, aim noise, burst discipline and teamwork. Bots never get extra health, damage or wall vision.</div>
              </div>
              <div className="field"><label>Team size</label><input type="range" min={1} max={6} value={o.teamSize} onChange={(e) => set((x) => { x.teamSize = Number(e.target.value); })} /><span className="val">{o.teamSize} v {o.teamSize}</span></div>
              <div className="field"><label>Score limit</label><input type="range" min={20} max={100} step={5} value={o.scoreLimit} onChange={(e) => set((x) => { x.scoreLimit = Number(e.target.value); })} /><span className="val">{o.scoreLimit}</span></div>
              <div className="field"><label>Time limit</label><input type="range" min={180} max={720} step={60} value={o.timeLimit} onChange={(e) => set((x) => { x.timeLimit = Number(e.target.value); })} /><span className="val">{o.timeLimit / 60} min</span></div>
              <div className="field"><label>Your side</label>
                <div className="seg">{([0, 1] as const).map((t) => <button key={t} className={o.team === t ? 'on' : ''} onClick={() => set((x) => { x.team = t; })}>{TEAM_NAMES[t]}</button>)}</div><span />
                <div className="hint">{TEAM_LONG[o.team]} — {o.team === 0 ? 'cyan accents, rounded pale helmets, slim radio packs.' : 'orange accents, angular dark helmets, wide salvage packs.'}</div>
              </div>
              <div className="field"><label>Latency lab</label>
                <div className="seg">{Object.keys(LATENCY_PRESETS).map((k) => <button key={k} className={o.latency === k ? 'on' : ''} onClick={() => set((x) => { x.latency = k; })}>{k}</button>)}</div><span />
                <div className="hint">Simulates round-trip delay, jitter and loss between you and the match server to exercise prediction and lag compensation ({LATENCY_PRESETS[o.latency]?.rtt ?? 0} ms RTT, ±{LATENCY_PRESETS[o.latency]?.jitter ?? 0} ms).</div>
              </div>
              <p className="note">First team to {o.scoreLimit} eliminations or the leader at {o.timeLimit / 60} minutes wins. A tied clock goes to 60 seconds of sudden death (+5). Respawn takes 3 seconds; Momentum resets when you die.</p>
            </div>
            <div className="panel">
              <h2>Deploying with</h2>
              <div className="tabs">{profile.loadouts.map((l, i) => <div key={i} className={'tab' + (i === profile.selected ? ' on' : '')} onClick={() => update((p) => { p.selected = i; })}>{i + 1} · {l.name}</div>)}</div>
              <LoadoutSummary lo={lo} />
              <div className="nav" style={{ marginTop: 12 }}>
                <button className="btn sm" onClick={onEdit}>Edit loadouts</button>
                <button className="btn primary" onClick={onStart}>Deploy<small>Enter</small></button>
              </div>
            </div>
          </div>
          <div className="panel" style={{ marginTop: 14 }}>
            <h2>Controls</h2>
            <ControlsList binds={profile.settings.binds} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoadoutSummary({ lo }: { lo: Loadout }) {
  const w = WEAPON_BY_ID[lo.primary], s = WEAPON_BY_ID[lo.sidearm];
  return (
    <div className="exact" style={{ marginTop: 0 }}>
      <div><span>Primary</span><b>{w.name}</b></div>
      <div><span>Sidearm</span><b>{s.name}</b></div>
      <div><span>Attachments</span><b>{lo.attachments.map((a) => ATTACHMENTS.find((x) => x.id === a)?.name).join(', ') || 'None'}</b></div>
      <div><span>Perks</span><b>{lo.perks.map((p) => PERKS.find((x) => x.id === p)?.name).join(', ')}</b></div>
      <div><span>Lethal</span><b>{EQUIP_BY_ID[lo.lethal].name}</b></div>
      <div><span>Tactical</span><b>{EQUIP_BY_ID[lo.tactical].name}</b></div>
      <div style={{ gridColumn: '1 / -1' }}><span>Support 3 / 5 / 8</span><b>{lo.supports.map((id, t) => SUPPORT_TIERS[t].find((x) => x.id === id)?.name).join(' · ')}</b></div>
    </div>
  );
}

export function ControlsList({ binds }: { binds: Record<Action, string> }) {
  const k = (a: Action) => keyName(binds[a]);
  const rows: [string, string][] = [
    [`${k('forward')} ${k('left')} ${k('back')} ${k('right')}`, 'Move'], ['Mouse', 'Aim'], ['Left mouse', 'Fire'], ['Right mouse', 'Aim down sights'],
    [k('sprint'), 'Sprint'], [`${k('crouch')} / C`, 'Crouch'], [k('jump'), 'Jump · mantle ledges up to 1.35 m'], [k('reload'), 'Reload'],
    [k('melee'), 'Quick melee'], [k('lethal'), 'Lethal (hold to cook a frag)'], [k('tactical'), 'Tactical equipment'], [`${k('primary')} / ${k('sidearm')} / wheel`, 'Switch weapon'],
    [k('supportSelect'), 'Cycle banked support action'], [k('supportDeploy'), 'Deploy support action'], [k('ping'), 'Ping for your team'], [k('scoreboard'), 'Scoreboard'],
    [k('inspect'), 'Inspect weapon'], ['1 – 5 while down', 'Pick loadout for next life'], ['Esc', 'Pause menu'],
  ];
  return <div className="keys" style={{ gridTemplateColumns: 'auto 1fr auto 1fr auto 1fr' }}>{rows.map(([key, what]) => [<kbd key={key}>{key}</kbd>, <span key={key + 'd'}>{what}</span>])}</div>;
}

export function keyName(code: string): string {
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  return ({ Space: 'Space', ShiftLeft: 'L-Shift', ShiftRight: 'R-Shift', ControlLeft: 'L-Ctrl', ControlRight: 'R-Ctrl', AltLeft: 'L-Alt', Tab: 'Tab', CapsLock: 'Caps' } as Record<string, string>)[code] ?? code;
}

// ------------------------------------------------------------------ loadout editor
const SLOT_LABEL: Record<AttachSlot, string> = { optic: 'Optic', barrel: 'Barrel', underbarrel: 'Underbarrel', magazine: 'Magazine', stock: 'Stock' };

function StatPanel({ st, base }: { st: WeaponStats; base: WeaponStats }) {
  const bars = statBars(st), b0 = statBars(base);
  const d = st.def;
  const ttk = (s: WeaponStats) => { const shots = Math.ceil(100 / (damageAt(s, 1, 1) * d.pellets)); return (shots - 1) * s.interval * 1000; };
  const row = (label: string, v: number, b: number, text: string) => (
    <div className="statrow" key={label}><span>{label}</span><div className="bar"><b className="base" style={{ width: pct(b) }} /><b style={{ width: pct(v), opacity: 0.85 }} /></div><span className="v">{text}</span></div>
  );
  const ex = (label: string, cur: number, bas: number, fmt: (n: number) => string, lowerBetter: boolean) => {
    const cls = Math.abs(cur - bas) < 1e-6 ? '' : (cur < bas) === lowerBetter ? 'up' : 'down';
    return <div key={label}><span>{label}</span><b className={cls}>{fmt(cur)}</b></div>;
  };
  return (
    <div>
      {row('Damage', bars.damage, b0.damage, `${d.dmgNear}${d.pellets > 1 ? `×${d.pellets}` : ''}–${d.dmgFar}`)}
      {row('Range', bars.range, b0.range, `${st.rangeNear.toFixed(0)}–${st.rangeFar.toFixed(0)} m`)}
      {row('Fire rate', bars.fireRate, b0.fireRate, `${d.rpm} rpm`)}
      {row('Control', bars.control, b0.control, `${st.recoilUp.toFixed(2)}° / shot`)}
      {row('Handling', bars.handling, b0.handling, `${(st.adsTime * 1000).toFixed(0)} ms ADS`)}
      {row('Mobility', bars.mobility, b0.mobility, `${pct(d.moveMult)} move`)}
      <div className="exact">
        {ex('Magazine', st.mag, base.mag, (n) => `${n}`, false)}
        {ex('Reserve', st.reserve, base.reserve, (n) => `${n}`, false)}
        {ex('Reload', (d.shell ? d.shell.per : d.reload.tactical) * st.reloadMul, (d.shell ? d.shell.per : d.reload.tactical) * base.reloadMul, (n) => `${n.toFixed(2)} s${d.shell ? ' / shell' : ''}`, true)}
        {ex('Empty reload', d.shell ? 0 : d.reload.empty * st.reloadMul, d.shell ? 0 : d.reload.empty * base.reloadMul, (n) => (d.shell ? '—' : `${n.toFixed(2)} s`), true)}
        {ex('ADS time', st.adsTime * 1000, base.adsTime * 1000, (n) => `${n.toFixed(0)} ms`, true)}
        {ex('ADS move', st.adsMove, base.adsMove, (n) => pct(n), false)}
        {ex('Sprint-to-fire', st.sprintOut * 1000, base.sprintOut * 1000, (n) => `${n.toFixed(0)} ms`, true)}
        {ex('Zoom', st.adsZoom, base.adsZoom, (n) => `${n.toFixed(2)}×`, false)}
        {ex('Hip spread', d.hip.base * st.hipMul, d.hip.base * base.hipMul, (n) => `${n.toFixed(2)}°`, true)}
        {ex('ADS spread', d.adsSpread, d.adsSpread, (n) => `${n.toFixed(2)}°`, true)}
        {ex('Body TTK (close)', ttk(st), ttk(base), (n) => `${n.toFixed(0)} ms`, true)}
        <div><span>Headshot / limb</span><b>×{d.mult.head} / ×{d.mult.limb}</b></div>
        <div><span>Penetration</span><b>{d.penetration >= 3 ? 'High' : d.penetration >= 1.5 ? 'Medium' : 'Low'}</b></div>
        <div><span>Minimap when firing</span><b className={st.suppressed ? 'up' : ''}>{st.suppressed ? 'Hidden' : 'Revealed'}</b></div>
      </div>
    </div>
  );
}

export function LoadoutEditor({ profile, update, onBack }: { profile: Profile; update: Upd; onBack: () => void }) {
  const [idx, setIdx] = useState(profile.selected);
  const [section, setSection] = useState<'primary' | 'attachments' | 'sidearm' | 'perks' | 'equipment' | 'support'>('primary');
  const lo = profile.loadouts[idx];
  const edit = (fn: (l: Loadout) => void) => update((p) => { fn(p.loadouts[idx]); });
  const w = WEAPON_BY_ID[lo.primary];
  const st = useMemo(() => resolveWeapon(w, lo.attachments), [w, lo.attachments]);
  const base = useMemo(() => resolveWeapon(w, []), [w]);
  const side = WEAPON_BY_ID[lo.sidearm];
  const sideSt = useMemo(() => resolveWeapon(side, []), [side]);
  const errs = validateLoadout(lo, PRACTICE_RULESET);
  const lvlTag = (n: number) => (n > 1 ? <em>LV {n} ONLINE</em> : <em>STARTER</em>);
  const toggleAttach = (id: string) => edit((l) => {
    const a = ATTACHMENTS.find((x) => x.id === id)!;
    if (l.attachments.includes(id)) { l.attachments = l.attachments.filter((x) => x !== id); return; }
    const rest = l.attachments.filter((x) => ATTACHMENTS.find((y) => y.id === x)!.slot !== a.slot);
    if (rest.length >= MAX_ATTACHMENTS) return; // conflict is surfaced in the UI instead of silently swapping
    l.attachments = [...rest, id];
  });
  const setPrimary = (id: string) => edit((l) => {
    l.primary = id;
    const slots = WEAPON_BY_ID[id].slots;
    l.attachments = l.attachments.filter((a) => slots.includes(ATTACHMENTS.find((x) => x.id === a)!.slot));
  });
  return (
    <div className="shell solid">
      <div className="page">
        <div className="head">
          <div><h1>Loadouts</h1><div className="sub">Five slots · changes save instantly · everything is unlocked in Practice (levels shown apply to online play)</div></div>
          <button className="btn sm" onClick={onBack}>Done</button>
        </div>
        <div className="tabs">
          {profile.loadouts.map((l, i) => <div key={i} className={'tab' + (i === idx ? ' on' : '')} onClick={() => { setIdx(i); update((p) => { p.selected = i; }); }}>{i + 1} · {l.name}</div>)}
        </div>
        <div className="body">
          <div className="grid2" style={{ gridTemplateColumns: '1.25fr 1fr' }}>
            <div className="panel">
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                <h2 style={{ margin: 0 }}>Name</h2>
                <input type="text" maxLength={16} value={lo.name} onChange={(e) => edit((l) => { l.name = e.target.value.replace(/[^\w \-.]/g, '').slice(0, 16); })} />
              </div>
              <div className="tabs">
                {(['primary', 'attachments', 'sidearm', 'perks', 'equipment', 'support'] as const).map((s) => <div key={s} className={'tab' + (section === s ? ' on' : '')} onClick={() => setSection(s)}>{s}</div>)}
              </div>
              {section === 'primary' && <div className="opt">{PRIMARIES.map((p) => (
                <button key={p.id} className={'pick' + (lo.primary === p.id ? ' on' : '')} onClick={() => setPrimary(p.id)}>
                  <span className="t"><span>{p.name} <span className="chip">{p.role}</span></span>{lvlTag(p.unlockLevel)}</span><span className="d">{p.desc}</span>
                </button>))}</div>}
              {section === 'attachments' && <div>
                <p className="note">{lo.attachments.length} / {MAX_ATTACHMENTS} fitted · one per slot · every attachment trades something away.</p>
                {(Object.keys(SLOT_LABEL) as AttachSlot[]).map((slot) => {
                  const allowed = w.slots.includes(slot);
                  return (
                    <div key={slot} style={{ marginBottom: 10 }}>
                      <h2>{SLOT_LABEL[slot]}{allowed ? '' : ` — not available on the ${w.name}`}</h2>
                      <div className="grid2" style={{ gap: 6 }}>{ATTACHMENTS.filter((a) => a.slot === slot).map((a) => {
                        const on = lo.attachments.includes(a.id);
                        const full = !on && lo.attachments.filter((x) => ATTACHMENTS.find((y) => y.id === x)!.slot !== slot).length >= MAX_ATTACHMENTS;
                        return (
                          <button key={a.id} className={'pick' + (on ? ' on' : '')} disabled={!allowed || full} title={full ? 'Remove an attachment first (maximum three)' : ''} onClick={() => toggleAttach(a.id)}>
                            <span className="t"><span>{a.name}</span>{lvlTag(a.unlockLevel)}</span>
                            <span className="d">{a.pros.map((x) => <span key={x} className="pro">+ {x}<br /></span>)}{a.cons.map((x) => <span key={x} className="con">− {x}<br /></span>)}</span>
                          </button>);
                      })}</div>
                    </div>);
                })}
              </div>}
              {section === 'sidearm' && <div className="opt">{SIDEARMS.map((p) => (
                <button key={p.id} className={'pick' + (lo.sidearm === p.id ? ' on' : '')} onClick={() => edit((l) => { l.sidearm = p.id; })}>
                  <span className="t"><span>{p.name} <span className="chip">{p.role}</span></span>{lvlTag(p.unlockLevel)}</span><span className="d">{p.desc}</span>
                </button>))}</div>}
              {section === 'perks' && <div className="grid3">{PERK_GROUPS.map((g, gi) => (
                <div key={g}><h2>{g}</h2><div className="opt">{PERKS.filter((p) => p.group === g).map((p) => (
                  <button key={p.id} className={'pick' + (lo.perks[gi] === p.id ? ' on' : '')} onClick={() => edit((l) => { l.perks[gi] = p.id; })}>
                    <span className="t"><span>{p.name}</span>{lvlTag(p.unlockLevel)}</span><span className="d">{p.desc}</span>
                  </button>))}</div></div>))}
                <p className="note" style={{ gridColumn: '1 / -1' }}>Perks never raise bullet damage, maximum health or headshot multipliers.</p>
              </div>}
              {section === 'equipment' && <div className="grid2">
                <div><h2>Lethal · G</h2><div className="opt">{LETHALS.map((e) => (
                  <button key={e.id} className={'pick' + (lo.lethal === e.id ? ' on' : '')} onClick={() => edit((l) => { l.lethal = e.id; })}>
                    <span className="t"><span>{e.name}</span>{lvlTag(e.unlockLevel)}</span><span className="d">{e.desc} Recharges in {e.recharge} s.</span>
                  </button>))}</div></div>
                <div><h2>Tactical · Q</h2><div className="opt">{TACTICALS.map((e) => (
                  <button key={e.id} className={'pick' + (lo.tactical === e.id ? ' on' : '')} onClick={() => edit((l) => { l.tactical = e.id; })}>
                    <span className="t"><span>{e.name}</span>{lvlTag(e.unlockLevel)}</span><span className="d">{e.desc} Recharges in {e.recharge} s.</span>
                  </button>))}</div></div>
              </div>}
              {section === 'support' && <div className="grid3">{SUPPORT_TIERS.map((tier, t) => (
                <div key={t}><h2>{tier[0].cost} Momentum</h2><div className="opt">{tier.map((s) => (
                  <button key={s.id} className={'pick' + (lo.supports[t] === s.id ? ' on' : '')} onClick={() => edit((l) => { l.supports[t] = s.id; })}>
                    <span className="t"><span>{s.name}</span>{lvlTag(s.unlockLevel)}</span><span className="d">{s.desc}<br /><span className="con">Counter: {s.counter}</span></span>
                  </button>))}</div></div>))}
                <p className="note" style={{ gridColumn: '1 / -1' }}>Momentum comes from eliminations (1), assists (½) and destroying hostile devices (1). It resets when you die; support-action kills score but never add Momentum.</p>
              </div>}
              {errs.length > 0 && <div className="errs">{errs.map((e) => <div key={e}>⚠ {e}</div>)}</div>}
            </div>
            <div className="panel">
              <h2>{section === 'sidearm' ? side.name : w.name} — stats</h2>
              {section === 'sidearm' ? <StatPanel st={sideSt} base={sideSt} /> : <StatPanel st={st} base={base} />}
              <p className="note" style={{ marginTop: 10 }}>Bars are plain-language comparisons across the arsenal; the table underneath shows the exact numbers the simulation uses. Grey bar = weapon without attachments.</p>
              <h2 style={{ marginTop: 14 }}>Loadout</h2>
              <LoadoutSummary lo={lo} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ settings
export function SettingsBody({ profile, update }: { profile: Profile; update: Upd }) {
  const s = profile.settings;
  const [tab, setTab] = useState<'gameplay' | 'video' | 'audio' | 'accessibility' | 'controls'>('gameplay');
  const [waiting, setWaiting] = useState<Action | null>(null);
  const set = (fn: (s: Settings) => void) => update((p) => fn(p.settings));
  useEffect(() => {
    if (!waiting) return;
    const h = (e: KeyboardEvent) => {
      e.preventDefault(); e.stopPropagation();
      if (e.code !== 'Escape') update((p) => {
        for (const k of Object.keys(p.settings.binds) as Action[]) if (p.settings.binds[k] === e.code && k !== waiting) p.settings.binds[k] = p.settings.binds[waiting];
        p.settings.binds[waiting] = e.code;
      });
      setWaiting(null);
    };
    window.addEventListener('keydown', h, true);
    return () => window.removeEventListener('keydown', h, true);
  }, [waiting, update]);
  const slider = (label: string, key: keyof Settings, min: number, max: number, step: number, fmt: (v: number) => string, hint?: string) => (
    <div className="field" key={key}><label>{label}</label>
      <input type="range" min={min} max={max} step={step} value={s[key] as number} onChange={(e) => set((x) => { (x[key] as number) = Number(e.target.value); })} />
      <span className="val">{fmt(s[key] as number)}</span>{hint && <div className="hint">{hint}</div>}
    </div>);
  const toggle = (label: string, key: keyof Settings, hint?: string, on = 'On', off = 'Off') => (
    <div className="field" key={key}><label>{label}</label>
      <div className="seg"><button className={s[key] ? 'on' : ''} onClick={() => set((x) => { (x[key] as boolean) = true; })}>{on}</button><button className={!s[key] ? 'on' : ''} onClick={() => set((x) => { (x[key] as boolean) = false; })}>{off}</button></div><span />
      {hint && <div className="hint">{hint}</div>}
    </div>);
  return (
    <div>
      <div className="tabs">{(['gameplay', 'video', 'audio', 'accessibility', 'controls'] as const).map((t) => <div key={t} className={'tab' + (tab === t ? ' on' : '')} onClick={() => setTab(t)}>{t}</div>)}</div>
      {tab === 'gameplay' && <div className="panel">
        {slider('Mouse sensitivity', 'sens', 0.1, 10, 0.05, (v) => v.toFixed(2), 'No acceleration is added. 0.022° per count × sensitivity.')}
        {slider('ADS sensitivity multiplier', 'adsSens', 0.2, 2, 0.05, (v) => v.toFixed(2) + '×', 'Applied on top of each optic\'s focal-length scaling.')}
        {toggle('Invert vertical look', 'invertY')}
        {slider('Field of view', 'fov', 75, 110, 1, (v) => v.toFixed(0) + '°', 'Horizontal at 16:9; wider screens see more (vertical FOV is preserved).')}
        {slider('Viewmodel field of view', 'vmFov', 55, 75, 1, (v) => v.toFixed(0) + '°', 'Only changes how the weapon is drawn. The aim ray is unaffected.')}
        {toggle('Aim down sights', 'adsToggle', undefined, 'Toggle', 'Hold')}
        {toggle('Crouch', 'crouchToggle', undefined, 'Toggle', 'Hold')}
        {toggle('Sprint', 'sprintToggle', undefined, 'Toggle', 'Hold')}
      </div>}
      {tab === 'video' && <div className="panel">
        <div className="field"><label>Quality preset</label>
          <div className="seg">{(['low', 'medium', 'high'] as const).map((q) => <button key={q} className={s.quality === q ? 'on' : ''} onClick={() => set((x) => { x.quality = q; })}>{q}</button>)}</div><span />
          <div className="hint">Low: no real-time shadows, bloom or anti-aliasing (sun shadows are baked per vertex instead). Medium: 3 shadow cascades, FXAA, bloom. High: 4 cascades, MSAA 4×, sharpening.</div>
        </div>
        {slider('Render scale', 'renderScale', 0.5, 1, 0.05, (v) => pct(v))}
        {toggle('Performance overlay', 'showFps', 'Frame rate, snapshot bandwidth, reconciliation count and interpolation delay.')}
      </div>}
      {tab === 'audio' && <div className="panel">
        {slider('Master volume', 'master', 0, 1, 0.01, pct)}
        {slider('Effects volume', 'sfx', 0, 1, 0.01, pct)}
        {slider('Music volume', 'music', 0, 1, 0.01, pct)}
        {toggle('Hit-marker sounds', 'hitSound')}
        {toggle('Announcer subtitles', 'subtitles', 'Shows the announcer\'s lines and support-action warnings as text.')}
      </div>}
      {tab === 'accessibility' && <div className="panel">
        <div className="field"><label>Colour-blind team accents</label>
          <select value={s.colorblind} onChange={(e) => set((x) => { x.colorblind = e.target.value as Settings['colorblind']; })}>
            <option value="off">Off (cyan / orange)</option><option value="deuteranopia">Deuteranopia (blue / yellow)</option><option value="protanopia">Protanopia (blue / yellow)</option><option value="tritanopia">Tritanopia (teal / pink)</option>
          </select><span />
          <div className="hint">Teams are also told apart by helmet, vest and pack shape, and teammates carry name tags.</div>
        </div>
        {slider('View bob', 'bob', 0, 1, 0.05, pct)}
        {slider('Camera shake', 'shake', 0, 1, 0.05, pct)}
        {toggle('Reduced motion', 'reducedMotion', 'Cuts bob, sway, shake and sprint FOV change to a quarter.')}
        {toggle('Photosensitivity: dark flash', 'flashDark', 'Flash Pulse darkens the screen instead of whiting it out.')}
      </div>}
      {tab === 'controls' && <div className="panel">
        <div className="grid2">
          {(Object.keys(ACTION_LABELS) as Action[]).map((a) => (
            <div className="field" key={a} style={{ gridTemplateColumns: '1fr auto' }}><label>{ACTION_LABELS[a]}</label>
              <button className={'kb' + (waiting === a ? ' wait' : '')} onClick={() => setWaiting(a)}>{waiting === a ? 'Press a key…' : keyName(s.binds[a])}</button>
            </div>))}
        </div>
        <p className="note">Fire is the left mouse button and aim is the right mouse button. The mouse wheel swaps weapons. Binding a key that is already in use swaps the two.</p>
        <div className="nav" style={{ flexDirection: 'row', marginTop: 8 }}>
          <button className="btn sm" onClick={() => set((x) => { x.binds = { ...DEFAULT_BINDS }; })}>Reset key bindings</button>
          <button className="btn sm" onClick={() => update((p) => { p.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS)); })}>Reset all settings</button>
        </div>
      </div>}
    </div>
  );
}

// ------------------------------------------------------------------ profile
export function ProfileScreen({ profile, update, onBack, onReset }: { profile: Profile; update: Upd; onBack: () => void; onReset: () => void }) {
  const lvl = levelForXp(profile.xp);
  const st = profile.stats;
  const [exported, setExported] = useState(false);
  const shots = Object.values(st.weapons).reduce((a, w) => a + w.shots, 0), hits = Object.values(st.weapons).reduce((a, w) => a + w.hits, 0);
  const doExport = () => {
    const blob = new Blob([exportProfile(profile)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'breachline-profile.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    setExported(true);
  };
  return (
    <div className="shell solid">
      <div className="page">
        <div className="head"><div><h1>Profile</h1><div className="sub">Guest profile stored only in this browser</div></div><button className="btn sm" onClick={onBack}>Back</button></div>
        <div className="body">
          <div className="grid2">
            <div className="panel">
              <h2>Operator</h2>
              <div className="field" style={{ gridTemplateColumns: '120px 1fr' }}><label>Callsign</label><input type="text" maxLength={16} value={profile.name} onChange={(e) => update((p) => { p.name = e.target.value.replace(/[^\w \-.]/g, '').slice(0, 16); })} /></div>
              <XpCard profile={profile} />
              <div className="exact">
                <div><span>Matches</span><b>{st.matches}</b></div><div><span>Wins / losses / draws</span><b>{st.wins} / {st.losses} / {st.draws}</b></div>
                <div><span>Eliminations</span><b>{st.kills}</b></div><div><span>Deaths</span><b>{st.deaths}</b></div>
                <div><span>Assists</span><b>{st.assists}</b></div><div><span>Best streak</span><b>{st.bestStreak}</b></div>
                <div><span>Accuracy</span><b>{shots ? pct(hits / shots) : '—'}</b></div><div><span>Time played</span><b>{(st.timePlayed / 60).toFixed(0)} min</b></div>
              </div>
              <h2 style={{ marginTop: 14 }}>Per-weapon</h2>
              <table className="tbl"><thead><tr><th>Weapon</th><th>Shots</th><th>Accuracy</th><th>Elims</th><th>Headshots</th></tr></thead><tbody>
                {Object.entries(st.weapons).length === 0 && <tr><td colSpan={5} style={{ textAlign: 'left', color: 'var(--dim)' }}>Play a match to record weapon usage.</td></tr>}
                {Object.entries(st.weapons).map(([id, w]) => <tr key={id}><td>{WEAPON_BY_ID[id]?.name ?? id}</td><td>{w.shots}</td><td>{w.shots ? pct(w.hits / w.shots) : '—'}</td><td>{w.kills}</td><td>{w.headshots}</td></tr>)}
              </tbody></table>
              <div className="nav" style={{ flexDirection: 'row', marginTop: 14 }}>
                <button className="btn sm" onClick={doExport}>{exported ? 'Exported' : 'Export my data'}</button>
                <button className="btn sm danger" onClick={() => { if (window.confirm('Erase your profile, loadouts and stats? Settings are kept.')) onReset(); }}>Reset profile</button>
              </div>
            </div>
            <div className="panel">
              <h2>Onboarding challenges</h2>
              {CHALLENGES.map((c) => {
                const v = profile.challenges[c.id] ?? 0, done = profile.challengesDone.includes(c.id);
                return (<div key={c.id} style={{ marginBottom: 9 }}>
                  <div className="xprow"><span>{c.name} {done && <span className="chip" style={{ color: 'var(--gold)', borderColor: 'var(--gold)' }}>Done</span>}</span><b>{v} / {c.goal} · {c.xp} XP</b></div>
                  <div className="note">{c.desc}</div>
                  <div className="xpbar"><b style={{ width: pct(v / c.goal) }} /></div>
                </div>);
              })}
              <h2 style={{ marginTop: 14 }}>Unlock track (levels 1–{MAX_LEVEL})</h2>
              <p className="note">Unlocks are sidegrades and cosmetics only — nothing raises health or damage. Everything is already available in Practice; levels gate online play.</p>
              <div className="track">{UNLOCK_TRACK.filter((u) => u.level > 1).map((u) => <div key={u.kind + u.id} className={'u' + (u.level <= lvl ? ' got' : '')}><b>{u.name}</b><span>LV {u.level}</span></div>)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ results
export function Results({ result, outcome, profile, onAgain, onMenu }: { result: MatchResult; outcome: ApplyOutcome | null; profile: Profile; onAgain: () => void; onMenu: () => void }) {
  const you = result.you;
  const verdict = result.winner < 0 ? 'draw' : result.winner === you.team ? 'win' : 'loss';
  const me = result.players.find((p) => p.id === you.id);
  const team = (t: number) => result.players.filter((p) => p.team === t).sort((a, b) => b.score - a.score);
  const lvl = levelForXp(profile.xp);
  const a = xpForLevel(lvl), b = xpForLevel(lvl + 1);
  return (
    <div className="modal">
      <div className="card wide">
        <div className="resulthead">
          <div><div className={'verdict ' + verdict}>{verdict === 'win' ? 'Victory' : verdict === 'loss' ? 'Defeat' : 'Draw'}</div>
            <div className="sub" style={{ margin: '4px 0 0' }}>Team Clash · Relay Station K-17 · {Math.floor(result.duration / 60)}:{String(Math.floor(result.duration % 60)).padStart(2, '0')}{result.suddenDeath ? ' · sudden death' : ''}</div></div>
          <div className="final"><span className="c0">{result.scores[0]}</span> <span style={{ color: 'var(--dim)', fontSize: 20 }}>{TEAM_NAMES[0]} — {TEAM_NAMES[1]}</span> <span className="c1">{result.scores[1]}</span></div>
        </div>
        <div className="body" style={{ overflow: 'auto' }}>
          <div className="grid2" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
            <div className="panel">
              <h2>Scoreboard</h2>
              <div className="grid2">{[0, 1].map((t) => (
                <table className="tbl" key={t}><thead><tr><th style={{ color: `var(--t${t})` }}>{TEAM_NAMES[t]}</th><th>Score</th><th>K</th><th>D</th><th>A</th><th>Dev</th></tr></thead><tbody>
                  {team(t).map((p) => <tr key={p.id} className={p.id === you.id ? 'me' : ''}><td>{p.name}</td><td>{p.score}</td><td>{p.kills}</td><td>{p.deaths}</td><td>{p.assists}</td><td>{p.devices}</td></tr>)}
                </tbody></table>))}</div>
              <h2 style={{ marginTop: 12 }}>Your weapons</h2>
              <table className="tbl"><thead><tr><th>Weapon</th><th>Shots</th><th>Hits</th><th>Accuracy</th><th>Elims</th><th>Headshots</th></tr></thead><tbody>
                {you.weapons.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'left', color: 'var(--dim)' }}>No shots fired.</td></tr>}
                {you.weapons.map((w) => <tr key={w.weapon}><td>{WEAPON_BY_ID[w.weapon]?.name ?? w.weapon}</td><td>{w.shots}</td><td>{w.hits}</td><td>{w.shots ? pct(w.hits / w.shots) : '—'}</td><td>{w.kills}</td><td>{w.headshots}</td></tr>)}
              </tbody></table>
            </div>
            <div className="panel">
              <h2>Your match</h2>
              <div className="exact" style={{ marginTop: 0 }}>
                <div><span>Eliminations</span><b>{me?.kills ?? 0}</b></div><div><span>Deaths</span><b>{me?.deaths ?? 0}</b></div>
                <div><span>Assists</span><b>{me?.assists ?? 0}</b></div><div><span>Best streak</span><b>{you.bestStreak}</b></div>
                <div><span>Devices destroyed</span><b>{you.devicesDestroyed}</b></div><div><span>Support actions</span><b>{me?.supportsUsed ?? 0}</b></div>
                <div><span>Districts visited</span><b>{you.districtsVisited} / 5</b></div><div><span>Network</span><b>Local room</b></div>
              </div>
              <h2 style={{ marginTop: 12 }}>Experience</h2>
              {you.xp.map((x) => <div className="xprow" key={x.label}><span>{x.label}</span><b>+{x.amount}</b></div>)}
              {outcome?.challengesCompleted.map((c) => { const d = CHALLENGES.find((x) => x.id === c)!; return <div className="xprow" key={c}><span>Challenge · {d.name}</span><b>+{d.xp}</b></div>; })}
              <div className="xprow" style={{ borderTop: '1px solid var(--line)', marginTop: 4, paddingTop: 4 }}><span>Total</span><b>+{outcome?.applied ? outcome.xpGained : 0}</b></div>
              {outcome && !outcome.applied && <div className="note">{outcome.reason}</div>}
              <div className="xprow" style={{ marginTop: 8 }}><span>Level {lvl}{outcome && outcome.levelAfter > outcome.levelBefore ? ` (up from ${outcome.levelBefore})` : ''}</span><span>{lvl >= MAX_LEVEL ? 'Max' : `${profile.xp - a} / ${b - a}`}</span></div>
              <div className="xpbar"><b style={{ width: pct(lvl >= MAX_LEVEL ? 1 : (profile.xp - a) / Math.max(1, b - a)) }} /></div>
              {outcome?.unlocked.map((u) => <div className="unl" key={u.kind + u.id}>Unlocked for online play · {u.name}</div>)}
            </div>
          </div>
        </div>
        <div className="nav" style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
          <button className="btn sm" onClick={onMenu}>Main menu</button>
          <button className="btn primary" style={{ minWidth: 260 }} onClick={onAgain}>Play again</button>
        </div>
      </div>
    </div>
  );
}
