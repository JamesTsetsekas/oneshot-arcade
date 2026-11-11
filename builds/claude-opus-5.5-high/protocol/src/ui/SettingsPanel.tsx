import { useEffect, useState } from 'react';
import { ACTION_LABELS, DEFAULT_SETTINGS, keyLabel, type Action, type Settings } from '../client/settings';

const CROSS_PRESETS = ['#5cffb0', '#ffffff', '#00e5ff', '#ffe600', '#ff4fd8', '#ff3b3b'];

function Slider({ label, value, min, max, step, onChange, fmt }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; fmt?: (v: number) => string }) {
  return (
    <label className="set-row">
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <input className="num" type="number" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || min)))} />
      {fmt && <em>{fmt(value)}</em>}
    </label>
  );
}

function Toggle({ label, value, onChange, hint }: { label: string; value: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <label className="set-row toggle">
      <span>
        {label}
        {hint && <small>{hint}</small>}
      </span>
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export function SettingsPanel({ settings, onChange, onClose, inMatch }: { settings: Settings; onChange: (s: Settings) => void; onClose: () => void; inMatch: boolean }) {
  const [tab, setTab] = useState<'mouse' | 'cross' | 'audio' | 'access' | 'keys' | 'video'>('mouse');
  const [binding, setBinding] = useState<Action | null>(null);
  const [io, setIo] = useState('');
  const s = settings;
  const set = (patch: Partial<Settings>) => onChange({ ...s, ...patch });
  const setCross = (patch: Partial<Settings['crosshair']>) => onChange({ ...s, crosshair: { ...s.crosshair, ...patch } });

  useEffect(() => {
    if (!binding) return;
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.code !== 'Escape') onChange({ ...s, binds: { ...s.binds, [binding]: e.code } });
      setBinding(null);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [binding, s, onChange]);

  const ch = s.crosshair;
  const gap = ch.gap;
  return (
    <div className="panel settings">
      <div className="panel-head">
        <h2>Settings</h2>
        <button onClick={onClose}>Done</button>
      </div>
      <div className="tabs">
        {(['mouse', 'cross', 'video', 'audio', 'access', 'keys'] as const).map((t) => (
          <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
            {{ mouse: 'Mouse', cross: 'Crosshair', video: 'Video', audio: 'Audio', access: 'Accessibility', keys: 'Controls' }[t]}
          </button>
        ))}
      </div>
      <div className="tab-body">
        {tab === 'mouse' && (
          <>
            <Slider label="Sensitivity" value={s.sensitivity} min={0.1} max={10} step={0.05} onChange={(v) => set({ sensitivity: v })} fmt={(v) => `${(v * 0.022).toFixed(4)}°/count`} />
            <Slider label="Scoped sensitivity multiplier" value={s.zoomSensitivity} min={0.2} max={2} step={0.05} onChange={(v) => set({ zoomSensitivity: v })} />
            <Toggle label="Invert vertical" value={s.invertY} onChange={(v) => set({ invertY: v })} />
            <Toggle label="Toggle crouch" value={s.toggleCrouch} onChange={(v) => set({ toggleCrouch: v })} />
            <Toggle label="Toggle silent walk" value={s.toggleWalk} onChange={(v) => set({ toggleWalk: v })} />
            <p className="dim small">Raw pointer-lock input, no acceleration. Values are plain numbers and exportable below.</p>
            <div className="io">
              <button onClick={() => setIo(JSON.stringify({ sensitivity: s.sensitivity, zoomSensitivity: s.zoomSensitivity, fov: s.fov, crosshair: s.crosshair, binds: s.binds }, null, 1))}>Export</button>
              <button
                onClick={() => {
                  try {
                    const j = JSON.parse(io);
                    onChange({ ...s, ...j, crosshair: { ...s.crosshair, ...(j.crosshair ?? {}) }, binds: { ...s.binds, ...(j.binds ?? {}) } });
                  } catch {
                    setIo('Invalid JSON');
                  }
                }}
              >
                Import
              </button>
              <textarea value={io} onChange={(e) => setIo(e.target.value)} rows={3} spellCheck={false} />
            </div>
          </>
        )}
        {tab === 'cross' && (
          <div className="cross-edit">
            <div className="cross-preview">
              <div className="cp" style={{ ['--c' as string]: ch.color } as React.CSSProperties}>
                {[
                  [-gap - ch.length, -ch.thickness / 2, ch.length, ch.thickness],
                  [gap, -ch.thickness / 2, ch.length, ch.thickness],
                  [-ch.thickness / 2, -gap - ch.length, ch.thickness, ch.length],
                  [-ch.thickness / 2, gap, ch.thickness, ch.length],
                  ...(ch.dot ? [[-ch.thickness / 2, -ch.thickness / 2, ch.thickness, ch.thickness]] : []),
                ].map((r, i) => (
                  <i key={i} style={{ left: `calc(50% + ${r[0]}px)`, top: `calc(50% + ${r[1]}px)`, width: r[2], height: r[3], background: ch.color, boxShadow: ch.outline ? '0 0 0 1px #000' : 'none' }} />
                ))}
              </div>
            </div>
            <div>
              <div className="set-row">
                <span>Color</span>
                <div className="swatches">
                  {CROSS_PRESETS.map((c) => (
                    <button key={c} className={`sw${ch.color === c ? ' on' : ''}`} style={{ background: c }} onClick={() => setCross({ color: c })} aria-label={c} />
                  ))}
                  <input type="color" value={ch.color} onChange={(e) => setCross({ color: e.target.value })} />
                </div>
              </div>
              <Slider label="Gap" value={ch.gap} min={0} max={20} step={1} onChange={(v) => setCross({ gap: v })} />
              <Slider label="Length" value={ch.length} min={1} max={20} step={1} onChange={(v) => setCross({ length: v })} />
              <Slider label="Thickness" value={ch.thickness} min={1} max={6} step={1} onChange={(v) => setCross({ thickness: v })} />
              <Toggle label="Center dot" value={ch.dot} onChange={(v) => setCross({ dot: v })} />
              <Toggle label="Outline" value={ch.outline} onChange={(v) => setCross({ outline: v })} />
              <Toggle label="Dynamic gap" hint="shows movement/air inaccuracy only — never recoil" value={ch.dynamic} onChange={(v) => setCross({ dynamic: v })} />
            </div>
          </div>
        )}
        {tab === 'video' && (
          <>
            <Slider label="Horizontal FOV" value={s.fov} min={80} max={105} step={1} onChange={(v) => set({ fov: v })} fmt={(v) => `${v}°`} />
            <label className="set-row">
              <span>
                Quality preset
                <small>{inMatch ? 'applies to the next match' : 'shadows, bloom, resolution scale'}</small>
              </span>
              <select value={s.quality} onChange={(e) => set({ quality: e.target.value as Settings['quality'] })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <Toggle label="Show FPS" value={s.showFps} onChange={(v) => set({ showFps: v })} />
            <Toggle label="Left-handed viewmodel" value={s.leftHanded} onChange={(v) => set({ leftHanded: v })} />
            <p className="dim small">Smoke boundaries, flash duration, thermite borders and hitboxes are identical on every preset.</p>
          </>
        )}
        {tab === 'audio' && (
          <>
            <Slider label="Master volume" value={s.volume} min={0} max={1} step={0.01} onChange={(v) => set({ volume: v })} />
            <Slider label="Effects" value={s.sfxVolume} min={0} max={1} step={0.01} onChange={(v) => set({ sfxVolume: v })} />
            <Slider label="Menu music" value={s.musicVolume} min={0} max={1} step={0.01} onChange={(v) => set({ musicVolume: v })} />
            <Toggle label="Critical event captions" hint="objective & utility only" value={s.captions} onChange={(v) => set({ captions: v })} />
          </>
        )}
        {tab === 'access' && (
          <>
            <Toggle label="Reduced flash intensity" hint="lowers pure white; blind duration unchanged" value={s.reducedFlash} onChange={(v) => set({ reducedFlash: v })} />
            <Toggle label="Reduced motion" hint="less head bob and weapon sway" value={s.reducedMotion} onChange={(v) => set({ reducedMotion: v })} />
            <label className="set-row">
              <span>
                Team colors
                <small>IFF strips, HUD and map</small>
              </span>
              <select value={s.colorblind} onChange={(e) => set({ colorblind: e.target.value as Settings['colorblind'] })}>
                <option value="off">Default (amber / cyan)</option>
                <option value="deutan">Deuteranopia (orange / blue)</option>
                <option value="protan">Protanopia (orange / blue)</option>
                <option value="tritan">Tritanopia (red / teal)</option>
              </select>
            </label>
            <Slider label="Bot difficulty" value={s.botDifficulty} min={0.1} max={1} step={0.05} onChange={(v) => set({ botDifficulty: v })} fmt={(v) => (v < 0.35 ? 'Recruit' : v < 0.65 ? 'Operative' : v < 0.85 ? 'Veteran' : 'Elite')} />
          </>
        )}
        {tab === 'keys' && (
          <div className="binds">
            {(Object.keys(ACTION_LABELS) as Action[]).map((a) => (
              <div key={a} className="bind">
                <span>{ACTION_LABELS[a]}</span>
                <button className={binding === a ? 'on' : ''} onClick={() => setBinding(a)}>
                  {binding === a ? 'press a key…' : keyLabel(s.binds[a])}
                </button>
              </div>
            ))}
            <div className="bind">
              <span>Fire / alt-fire</span>
              <span className="fixedkey">Mouse 1 / 2</span>
            </div>
            <button className="ghost" onClick={() => onChange({ ...s, binds: { ...DEFAULT_SETTINGS.binds } })}>
              Reset bindings
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
