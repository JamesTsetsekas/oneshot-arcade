// Settings: audio, video/effects, accessibility, cast modes, full key remapping.
import React, { useEffect, useState } from 'react';
import { ACTION_LABELS, Action, DEFAULT_KEYS, DEFAULT_SETTINGS, Settings, CastMode } from '../../services/profile';

export function SettingsPanel({ settings, onChange, back }: { settings: Settings; onChange: (s: Settings) => void; back: () => void }) {
  const [s, setS] = useState<Settings>(structuredClone(settings));
  const [rebind, setRebind] = useState<Action | null>(null);
  const upd = (p: Partial<Settings>) => { const n = { ...s, ...p }; setS(n); onChange(n); };
  useEffect(() => {
    if (!rebind) return;
    const f = (e: KeyboardEvent) => {
      e.preventDefault(); e.stopPropagation();
      if (e.code !== 'Escape') upd({ keys: { ...s.keys, [rebind]: e.code } });
      setRebind(null);
    };
    window.addEventListener('keydown', f, true);
    return () => window.removeEventListener('keydown', f, true);
  }, [rebind, s]);
  const conflicts = new Map<string, number>();
  for (const k of Object.values(s.keys)) conflicts.set(k, (conflicts.get(k) ?? 0) + 1);
  const slider = (label: string, key: 'master' | 'music' | 'sfx') => (
    <label className="set-row"><span>{label}</span><input type="range" min={0} max={1} step={0.05} value={s[key]} onChange={(e) => upd({ [key]: Number(e.target.value) } as any)} /><b>{Math.round(s[key] * 100)}</b></label>
  );
  const toggle = (label: string, key: keyof Settings, hint?: string) => (
    <label className="set-row"><span>{label}{hint && <small className="muted"> {hint}</small>}</span><input type="checkbox" checked={!!s[key]} onChange={(e) => upd({ [key]: e.target.checked } as any)} /></label>
  );
  return (
    <div className="screen settings">
      <div className="codex-head"><button className="btn" onClick={back}>Done</button><h1>Settings</h1><button className="btn small" onClick={() => { const n = structuredClone(DEFAULT_SETTINGS); setS(n); onChange(n); }}>Reset to defaults</button></div>
      <div className="settings-grid">
        <section>
          <h3>Audio</h3>
          {slider('Master volume', 'master')}{slider('Music', 'music')}{slider('Effects', 'sfx')}
          {toggle('Captions for critical events', 'captions')}
          <h3>Video</h3>
          <label className="set-row"><span>Effects quality <small className="muted">low keeps all gameplay telegraphs</small></span><select value={s.effects} onChange={(e) => upd({ effects: e.target.value as any })}><option value="high">High</option><option value="low">Low</option></select></label>
          <label className="set-row"><span>UI scale</span><select value={s.uiScale} onChange={(e) => upd({ uiScale: Number(e.target.value) as any })}><option value={100}>100%</option><option value={125}>125%</option><option value={150}>150%</option></select></label>
          {toggle('Screen shake', 'shake')}
          {toggle('Colorblind team palette', 'colorblind', '(blue / yellow)')}
          {toggle('Damage numbers', 'damageNumbers')}
          <h3>Gameplay</h3>
          {toggle('Edge scroll', 'edgeScroll', '(arrow keys and middle-drag always work)')}
          {toggle('Team chat', 'chat')}
          {toggle('Tutorial hints', 'hints')}
          {toggle('Bot / build suggestions', 'botSuggestions')}
          <label className="set-row"><span>Bot difficulty</span><select value={s.difficulty} onChange={(e) => upd({ difficulty: e.target.value as any })}><option value="easy">Easy</option><option value="normal">Normal</option><option value="hard">Hard</option></select></label>
          <h3>Cast mode</h3>
          {(['Q', 'W', 'E', 'R'] as const).map((k) => (
            <label key={k} className="set-row"><span>Ability {k}</span><select value={s.castMode[k]} onChange={(e) => upd({ castMode: { ...s.castMode, [k]: e.target.value as CastMode } })}><option value="normal">Normal (click to confirm)</option><option value="quickIndicator">Quick cast with indicator (release)</option><option value="quick">Quick cast (instant)</option></select></label>
          ))}
        </section>
        <section>
          <h3>Key bindings <small className="muted">click, then press a key (Esc cancels)</small></h3>
          {(Object.keys(ACTION_LABELS) as Action[]).map((a) => (
            <div key={a} className="set-row key-row">
              <span>{ACTION_LABELS[a]}</span>
              <button className={`btn tiny keycap ${rebind === a ? 'on' : ''} ${(conflicts.get(s.keys[a]) ?? 0) > 1 && !(a === 'ward' || a === 'item4') ? 'conflict' : ''}`} onClick={() => setRebind(a)}>{rebind === a ? 'press a key…' : s.keys[a].replace('Key', '').replace('Digit', '')}</button>
              {s.keys[a] !== DEFAULT_KEYS[a] && <button className="btn tiny" onClick={() => upd({ keys: { ...s.keys, [a]: DEFAULT_KEYS[a] } })}>↺</button>}
            </div>
          ))}
          <p className="muted small">Ctrl + ability key ranks that ability. Ward shares 4 with Item 4 when that slot has no active item. Camera panning uses arrow keys by default because W/E/S/D/A are ability/command keys.</p>
        </section>
      </div>
    </div>
  );
}
