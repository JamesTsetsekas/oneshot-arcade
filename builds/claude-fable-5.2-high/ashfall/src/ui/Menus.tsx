import { useEffect, useState } from 'react';
import { CLASSES, classSkills } from '../abilities/skills';
import { game } from '../app-shell/game';
import type { ClassId } from '../entity-combat/types';
import { DEFAULT_KEYS, KEY_LABELS, LEFT_KEYS, keyName, ui, useUi, type Settings } from './store';
import { Btn } from './widgets';

const ago = (t: number) => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : new Date(t).toLocaleDateString(); };
const Title = () => <div className="title"><div className="sigil">✦</div><h1>Ashfall Covenant</h1><p>An action RPG of the ash-covered frontier</p></div>;

export function MainMenu() {
  const saves = useUi((s) => s.saves), notice = useUi((s) => s.notice), loading = useUi((s) => s.loading);
  const latest = saves.find((s) => !s.corrupt || s.hasBackup);
  return (
    <div className="menu">
      <Title />
      <div className="menu-col">
        {latest && <Btn cls="big primary" disabled={loading} onClick={() => void game.continueGame(latest.id)}>Continue<small>{latest.name} · Lv {latest.level} {CLASSES[latest.cls as ClassId]?.name} · saved {ago(latest.savedAt)}{latest.corrupt ? ' · will restore backup' : ''}</small></Btn>}
        <Btn cls={'big' + (latest ? '' : ' primary')} onClick={() => ui.set({ screen: 'create', notice: '' })}>Create Warden</Btn>
        {saves.length > 0 && <Btn cls="big" onClick={() => ui.set({ screen: 'characters', notice: '' })}>Characters</Btn>}
        <Btn cls="big" onClick={() => ui.set({ settingsOpen: true })}>Settings</Btn>
        <Btn cls="big" onClick={() => ui.set({ screen: 'credits' })}>Credits</Btn>
        {notice && <div className="notice">{notice}</div>}
      </div>
      <div className="foot">Single-player · runs entirely in your browser · progress is stored locally (IndexedDB)</div>
    </div>
  );
}
export function CreateScreen() {
  const [cls, setCls] = useState<ClassId>('cinder');
  const [name, setName] = useState('');
  const [look, setLook] = useState(0);
  const [busy, setBusy] = useState(false);
  return (
    <div className="menu create">
      <h2 className="screen-title">Create your Warden</h2>
      <div className="classes">
        {(['cinder', 'ranger'] as const).map((c) => (
          <div key={c} className={`class-card ${c}${cls === c ? ' sel' : ''}`} onClick={() => { setCls(c); game.audio.resume(); game.audio.play('ui'); }}>
            <div className="class-icon">{c === 'cinder' ? '⚒' : '➶'}</div>
            <h3>{CLASSES[c].name}</h3><p>{CLASSES[c].blurb}</p>
            <div className="class-res">Class resource: <b>{CLASSES[c].resource}</b></div>
            <ul>{classSkills(c).filter((s) => s.kind === 'active').map((s) => <li key={s.id}>{s.icon} {s.name}</li>)}</ul>
          </div>
        ))}
      </div>
      <div className="create-row">
        <label>Name <input maxLength={18} value={name} placeholder="Warden" onChange={(e) => setName(e.target.value)} /></label>
        <label>Bearing (cosmetic)
          <span className="looks">{['Steady', 'Wry', 'Grim'].map((l, i) => <button key={l} className={look === i ? 'sel' : ''} onClick={() => setLook(i)}>{l}</button>)}</span></label>
      </div>
      <div className="menu-row"><Btn onClick={() => ui.set({ screen: 'menu' })}>Back</Btn><Btn cls="primary big" disabled={busy} onClick={() => { setBusy(true); void game.newGame(name, cls, look); }}>Enter Ember Refuge</Btn></div>
    </div>
  );
}
export function CharactersScreen() {
  const saves = useUi((s) => s.saves);
  const [del, setDel] = useState('');
  return (
    <div className="menu">
      <h2 className="screen-title">Characters</h2>
      <div className="saves">
        {saves.map((s) => (
          <div key={s.id} className={'save' + (s.corrupt ? ' corrupt' : '')}>
            <div><b>{s.name}</b> · Level {s.level} {CLASSES[s.cls as ClassId]?.name}{s.difficulty ? ' · Veteran' : ''}<small>Saved {ago(s.savedAt)}{s.corrupt ? (s.hasBackup ? ' · save damaged — a backup is available' : ' · save damaged, no backup') : ''}</small></div>
            <Btn disabled={s.corrupt && !s.hasBackup} onClick={() => void game.continueGame(s.id)}>{s.corrupt ? 'Recover backup' : 'Play'}</Btn>
            <Btn cls={del === s.id ? 'danger' : ''} onClick={() => { if (del === s.id) { void game.deleteSave(s.id); setDel(''); } else setDel(s.id); }}>{del === s.id ? 'Confirm delete' : 'Delete'}</Btn>
          </div>
        ))}
        {!saves.length && <p className="note">No Wardens yet.</p>}
      </div>
      <Btn onClick={() => ui.set({ screen: 'menu' })}>Back</Btn>
    </div>
  );
}
export function Credits() {
  return (
    <div className="menu"><Title />
      <div className="credits"><p>Design, code, procedural models, textures and synthesized audio were generated for this build. No third-party art, audio, fonts or level data are included.</p>
        <p>Built with Babylon.js (Apache-2.0), React (MIT), Vite (MIT) and TypeScript (Apache-2.0). See ASSETS.md.</p>
        <p>Ashfall Covenant is an original work. Any resemblance to existing games is limited to genre conventions.</p></div>
      <Btn onClick={() => ui.set({ screen: 'menu' })}>Back</Btn></div>
  );
}
export function ErrorScreen() {
  const error = useUi((s) => s.error);
  return <div className="menu"><Title /><div className="notice big"><h3>Cannot start the game</h3><p>{error}</p></div><Btn onClick={() => location.reload()}>Retry</Btn></div>;
}
export function SettingsModal() {
  const st = useUi((s) => s.settings);
  const [bind, setBind] = useState<string | null>(null);
  useEffect(() => {
    if (!bind) return;
    const h = (e: KeyboardEvent) => { e.preventDefault(); e.stopPropagation(); if (e.code !== 'Escape') game.setSettings({ keys: { ...ui.get().settings.keys, [bind]: e.code } }); setBind(null); };
    window.addEventListener('keydown', h, true);
    return () => window.removeEventListener('keydown', h, true);
  }, [bind]);
  const set = (p: Partial<Settings>) => game.setSettings(p);
  const check = (k: keyof Settings, label: string) => <label className="chk"><input type="checkbox" checked={!!st[k]} onChange={(e) => set({ [k]: e.target.checked } as Partial<Settings>)} /> {label}</label>;
  const slider = (k: keyof Settings, label: string) => <label className="sld">{label}<input type="range" min={0} max={1} step={0.05} value={st[k] as number} onChange={(e) => set({ [k]: Number(e.target.value) } as Partial<Settings>)} /><span>{Math.round((st[k] as number) * 100)}</span></label>;
  const dup = (a: string) => Object.entries(st.keys).some(([k, v]) => k !== a && v === st.keys[a]);
  return (
    <div className="modal settings" onPointerDown={(e) => e.stopPropagation()}>
      <h2>Settings</h2>
      <div className="set-cols">
        <div><h3>Graphics</h3>
          <label className="selrow">Quality preset <select value={st.quality} onChange={(e) => set({ quality: e.target.value as Settings['quality'] })}><option value="low">Low (no shadows or bloom, 67% resolution)</option><option value="medium">Medium</option><option value="high">High</option></select></label>
          {slider('particles', 'Particle density')}{check('shake', 'Screen shake')}{check('reducedMotion', 'Reduced motion (no shake, fewer particles)')}
          <h3>Interface</h3>{check('damageNumbers', 'Damage numbers')}{check('labels', 'Always show item labels')}{check('minimap', 'Minimap')}{check('advanced', 'Advanced tooltips (item level, roll ranges)')}{check('colorblind', 'Colorblind-friendly rarity colors')}
          <h3>Audio</h3>{slider('master', 'Master')}{slider('sfx', 'Effects')}{slider('music', 'Music')}{slider('ambient', 'Ambience')}
        </div>
        <div><h3>Key bindings</h3>
          <div className="keys">{Object.keys(DEFAULT_KEYS).map((a) => <div key={a} className="keyrow"><span>{KEY_LABELS[a]}</span><button className={(bind === a ? 'binding ' : '') + (dup(a) ? 'dup' : '')} onClick={() => setBind(a)}>{bind === a ? 'Press a key…' : keyName(st.keys[a])}</button></div>)}</div>
          <p className="note">Left mouse: move / attack · Right mouse: skill slot 1 · Mouse wheel: zoom · Mouse 4: evade.</p>
          <div className="menu-row"><Btn onClick={() => set({ keys: { ...DEFAULT_KEYS } })}>Default preset</Btn><Btn onClick={() => set({ keys: { ...LEFT_KEYS } })}>Left-handed preset</Btn></div>
        </div>
      </div>
      <Btn cls="primary" onClick={() => ui.set({ settingsOpen: false })}>Done</Btn>
    </div>
  );
}
export function PauseMenu() {
  const keys = useUi((s) => s.settings.keys);
  return (
    <div className="modal pause" onPointerDown={(e) => e.stopPropagation()}>
      <h2>Paused</h2>
      <Btn cls="big primary" onClick={() => ui.set({ paused: false })}>Resume</Btn>
      <Btn cls="big" onClick={() => ui.set({ settingsOpen: true })}>Settings</Btn>
      <Btn cls="big" onClick={() => { ui.set({ paused: false }); void game.exitToMenu(); }}>Save & exit to menu</Btn>
      <div className="controls">
        <div><kbd>LMB</kbd> move · attack · interact</div><div><kbd>RMB</kbd> core skill</div><div><kbd>{keyName(keys.skill1)} {keyName(keys.skill2)} {keyName(keys.skill3)} {keyName(keys.skill4)}</kbd> skills</div>
        <div><kbd>{keyName(keys.potion1)}–{keyName(keys.potion4)}</kbd> belt</div><div><kbd>{keyName(keys.evade)}</kbd> evade</div><div><kbd>{keyName(keys.stand)}</kbd> stand still</div>
        <div><kbd>{keyName(keys.interact)}</kbd> interact / pick up</div><div><kbd>{keyName(keys.gate)}</kbd> town gate</div><div><kbd>{keyName(keys.labels)}</kbd> item labels</div>
        <div><kbd>{keyName(keys.inventory)}</kbd> inventory</div><div><kbd>{keyName(keys.skills)}</kbd> skills</div><div><kbd>{keyName(keys.character)}</kbd> character</div>
      </div>
    </div>
  );
}
export function DeathScreen() {
  const death = useUi((s) => s.death);
  if (!death) return null;
  const [src, type] = death.cause.split(' · ');
  return (
    <div className="death">
      <h1>You have fallen</h1>
      <p className="cause">Slain by <b>{src}</b> <span className={'dt ' + type}>{type} damage</span></p>
      <p>Your Echo lingers where you fell, holding <b>{death.echo} gold</b>. Touch it to reclaim the gold and gain +8% maximum Health for five minutes. Dying again moves the Echo but never takes more.</p>
      <p className="note">Equipped gear lost 5% durability. Enemies have returned to their posts; bosses reset.</p>
      <Btn cls="big primary" onClick={() => game.respawn()}>Respawn at {death.respawn}</Btn>
    </div>
  );
}
export function Summary() {
  const s = game.session;
  if (!s?.summary) return null;
  const m = s.summary, t = `${Math.floor(m.time / 60)}:${String(Math.floor(m.time % 60)).padStart(2, '0')}`;
  return (
    <div className="modal summary" onPointerDown={(e) => e.stopPropagation()}>
      <h2>{m.hunt ? 'Target Hunt complete' : m.difficulty ? 'Veteran expedition complete' : 'Act I complete'}</h2>
      <p>{m.hunt ? `${m.hunt} has fallen again.` : 'The Orison Engine is silent and the Refuge endures another night.'}</p>
      <div className="sum-grid"><div><b>{t}</b><span>{m.hunt ? 'Hunt time' : 'Expedition time'}</span></div><div><b>{m.level}</b><span>Level</span></div><div><b>{m.kills}</b><span>Enemies slain</span></div><div><b>{m.deaths}</b><span>Deaths</span></div></div>
      {!m.hunt && <p className="note">{m.difficulty ? 'Hunt the bosses again from the Refuge for stronger Relics.' : 'Veteran difficulty and the Hunt portal are now unlocked. Speak with Elder Maren in the Refuge to begin a Veteran expedition.'}</p>}
      <p className="note">Your loot is still on the ground — collect it, then take the portal home.</p>
      <Btn cls="primary big" onClick={() => ui.set({ summary: false })}>Continue</Btn>
    </div>
  );
}
