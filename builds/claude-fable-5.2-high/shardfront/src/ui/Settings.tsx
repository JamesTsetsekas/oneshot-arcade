// ui: settings (graphics, audio, camera, accessibility, key bindings) and the controls reference.
import { useEffect, useState } from 'react';
import { applyQuality, resetLocalData, updateSettings } from '../app/app';
import { DEFAULT_KEYS, KEY_LABELS, PALETTES, keyName, type Palette, type Quality } from '../app/settings';
import { useStore } from './store';

function Slider({ label, value, min = 0, max = 1, step = 0.05, onChange, fmt }: { label: string; value: number; min?: number; max?: number; step?: number; onChange: (v: number) => void; fmt?: (v: number) => string }) {
  return (
    <label className="row">
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <em>{fmt ? fmt(value) : Math.round(value * 100) + '%'}</em>
    </label>
  );
}

function Toggle({ label, value, onChange, note }: { label: string; value: boolean; onChange: (v: boolean) => void; note?: string }) {
  return (
    <label className="row">
      <span>{label}{note ? <small> {note}</small> : null}</span>
      <button className={`toggle${value ? ' on' : ''}`} role="switch" aria-checked={value} onClick={(e) => { e.preventDefault(); onChange(!value); }}>{value ? 'On' : 'Off'}</button>
    </label>
  );
}

export function SettingsPanel({ compact }: { compact?: boolean }) {
  const s = useStore((st) => st.settings);
  const [rebinding, setRebinding] = useState<string | null>(null);
  useEffect(() => {
    if (!rebinding) return;
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault(); e.stopPropagation();
      if (e.code !== 'Escape') updateSettings({ keys: { ...s.keys, [rebinding]: e.code } });
      setRebinding(null);
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true });
  }, [rebinding, s.keys]);
  const dupes = new Set<string>();
  const seen = new Map<string, string>();
  for (const [k, v] of Object.entries(s.keys)) {
    // slot keys and unit commands may legitimately coexist with camera keys; only flag exact command clashes
    if (k.startsWith('pan')) continue;
    if (seen.has(v)) { dupes.add(k); dupes.add(seen.get(v) as string); }
    seen.set(v, k);
  }
  return (
    <div className={`settings${compact ? ' compact' : ''}`}>
      <section>
        <h3>Graphics</h3>
        <div className="row"><span>Preset</span><div className="seg">{(['low', 'medium', 'high'] as Quality[]).map((q) => <button key={q} className={s.quality === q ? 'on' : ''} onClick={() => applyQuality(q)}>{q}</button>)}</div></div>
        <Slider label="Render scale" value={s.renderScale} min={0.5} max={1} onChange={(v) => updateSettings({ renderScale: v })} />
        <Toggle label="Shadows" value={s.shadows} onChange={(v) => updateSettings({ shadows: v })} />
        <Toggle label="Bloom" value={s.bloom} onChange={(v) => updateSettings({ bloom: v })} />
        <Slider label="Effects density" value={s.effects} min={0.2} max={1} onChange={(v) => updateSettings({ effects: v })} />
        <Toggle label="Anti-aliasing" note="(applies after reload)" value={s.antialias} onChange={(v) => updateSettings({ antialias: v })} />
      </section>
      <section>
        <h3>Audio</h3>
        <Slider label="Master" value={s.master} onChange={(v) => updateSettings({ master: v })} />
        <Slider label="Music" value={s.music} onChange={(v) => updateSettings({ music: v })} />
        <Slider label="Effects" value={s.sfx} onChange={(v) => updateSettings({ sfx: v })} />
        <Slider label="Interface" value={s.ui} onChange={(v) => updateSettings({ ui: v })} />
      </section>
      <section>
        <h3>Camera &amp; accessibility</h3>
        <Toggle label="Edge scrolling" value={s.edgeScroll} onChange={(v) => updateSettings({ edgeScroll: v })} />
        <Slider label="Pan speed" value={s.panSpeed} min={0.5} max={2} step={0.1} onChange={(v) => updateSettings({ panSpeed: v })} fmt={(v) => v.toFixed(1) + 'x'} />
        <Toggle label="Reduced motion" note="(no camera shake)" value={s.reducedMotion} onChange={(v) => updateSettings({ reducedMotion: v })} />
        <Toggle label="Alert notifications" value={s.notifications} onChange={(v) => updateSettings({ notifications: v })} />
        <div className="row"><span>Team colours</span>
          <select value={s.palette} onChange={(e) => updateSettings({ palette: e.target.value as Palette })}>
            {(Object.keys(PALETTES) as Palette[]).map((p) => <option key={p} value={p}>{PALETTES[p].label}</option>)}
          </select>
        </div>
      </section>
      <section className="keys">
        <h3>Key bindings <button className="link" onClick={() => updateSettings({ keys: { ...DEFAULT_KEYS } })}>reset</button></h3>
        <div className="keygrid">
          {Object.keys(DEFAULT_KEYS).map((k) => (
            <div className="row" key={k}>
              <span>{KEY_LABELS[k]}</span>
              <button className={`kbd-btn${rebinding === k ? ' on' : ''}${dupes.has(k) ? ' dupe' : ''}`} onClick={() => setRebinding(k)}>{rebinding === k ? 'press a key' : keyName(s.keys[k])}</button>
            </div>
          ))}
        </div>
        <p className="dim small">Control groups use the number row (Ctrl or Alt + number assigns). Escape always cancels / opens the menu.</p>
      </section>
      {!compact && (
        <section>
          <h3>Local data</h3>
          <p className="dim small">Profile, history, replays and settings are stored only in this browser (IndexedDB). Nothing is uploaded.</p>
          <button onClick={() => { void resetLocalData(); }}>Clear local data</button>
        </section>
      )}
    </div>
  );
}

export function ControlsHelp() {
  const k = useStore((s) => s.settings.keys);
  const n = keyName;
  const rows: [string, string][] = [
    ['Left click / drag', 'Select a unit or box-select. Double-click or Ctrl+click selects all of that type on screen. Shift adds or removes.'],
    ['Right click', 'Context order: move, attack, harvest, repair, follow or set a rally point. Hold Shift to queue. Alt forces a plain move.'],
    [`${n(k.attackMove)} / ${n(k.stop)} / ${n(k.hold)} / ${n(k.patrol)} / ${n(k.guard)}`, 'Attack-move, stop, hold position, patrol, guard a friendly unit.'],
    [`${n(k.build)}, then ${n(k.slot1)} ${n(k.slot2)} ${n(k.slot3)} ${n(k.slot4)} ${n(k.slot5)} ${n(k.slot6)}`, 'Worker build palette. The same slot keys train units, start research and trigger abilities.'],
    [`${n(k.rally)} / ${n(k.cancel)}`, 'Rally point mode / cancel the last queued item or a construction.'],
    ['Ctrl or Alt + 1-9, then 1-9', 'Assign and recall control groups. Shift+number adds. Double-tap to centre the camera.'],
    [`Arrows, middle-drag, wheel`, 'Pan and zoom. WASD also pans while nothing is selected. Shift pans faster.'],
    [`${n(k.cycle)} / ${n(k.focus)} / ${n(k.jumpAlert)} / ${n(k.jumpBase)} / ${n(k.idleWorker)}`, 'Cycle unit types, focus selection, jump to last alert, jump home, select idle worker.'],
    [`Esc / ${n(k.menu)} / ${n(k.perf)}`, 'Cancel mode or open the pause menu / performance and debug panel.'],
  ];
  return (
    <div className="controls-help">
      {rows.map(([a, b]) => <div className="row" key={a}><span className="kbd wide">{a}</span><span>{b}</span></div>)}
    </div>
  );
}
