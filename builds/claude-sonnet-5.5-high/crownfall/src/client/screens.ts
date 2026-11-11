/** client-ui shell: menu, draft, heroes, history, settings, credits, loading, results, error. */
import { HEROES, HERO_BY_ID, ITEM_BY_ID, ITEMS, TALENTS, abilityText, type HeroDef } from '../shared/content';
import type { Sim } from '../sim/sim';
import { TEAM_NAMES } from '../sim/rules';
import { h, fmtTime, fmtNum, clear } from './dom';
import { DEFAULT_KEYS, DEFAULT_SETTINGS, loadHistory, masteryLevel, profileLevel, type Profile, type Settings } from './storage';
import { audio } from './audio';
import { heroPortraits } from './portraits';

export interface AppApi {
  settings: Settings; profile: Profile;
  saveSettings(): void;
  home(): void;
  openSettings(back: () => void): void;
  startDraft(): void; startTutorial(): void;
  beginMatch(sel: DraftSelection): void;
  playAgain(): void;
  toast(msg: string): void;
}
export interface DraftSelection { heroId: string; talents: [string, string]; difficulty: 'easy' | 'normal' | 'hard' }

const stars = (n: number) => '●'.repeat(n) + '○'.repeat(3 - n);

function heroKit(def: HeroDef, rank = 0): HTMLElement {
  return h('div', { class: 'kit' },
    h('div', { class: 'abil passive' }, h('div', { class: 'ico' }, '✦'), h('div', {}, h('b', {}, def.passive.name, h('small', {}, ' Passive')), h('p', {}, def.passive.desc))),
    ...def.abilities.map((a) => h('div', { class: `abil${a.ult ? ' ult' : ''}` }, h('div', { class: 'ico' }, a.icon),
      h('div', {}, h('b', {}, `${a.key} · ${a.name}`, h('small', {}, ` ${a.range ? a.range + 'm' : 'self'} · ${a.cd[0]}s cd${a.recast ? ' · recast' : ''}`)), h('p', {}, abilityText(a, rank))))));
}

export function heroPanel(def: HeroDef, portrait?: string): HTMLElement {
  return h('div', { class: 'hero-panel' },
    h('div', { class: 'hp-top' },
      h('div', { class: 'portrait-big', style: { backgroundImage: portrait ? `url(${portrait})` : 'none' } }, portrait ? null : h('span', {}, def.name[0])),
      h('div', {}, h('h2', {}, def.name), h('div', { class: 'sub' }, def.title), h('div', { class: 'tags' }, h('i', {}, def.role), h('i', {}, `Difficulty ${stars(def.difficulty)}`), h('i', {}, def.resource)), h('p', { class: 'blurb' }, def.blurb),
        h('div', { class: 'statline' }, h('span', {}, `HP ${def.hp}`), h('span', {}, `AD ${def.ad}`), h('span', {}, `Armor ${def.armor}`), h('span', {}, `Range ${def.range}m`), h('span', {}, `Speed ${def.ms}`)))),
    heroKit(def),
    h('div', { class: 'builds' }, h('h4', {}, 'Build directions'), ...def.builds.map((b) => h('div', { class: 'b' }, h('b', {}, b.name), h('span', {}, ' — ' + b.why), h('div', { class: 'build-items' }, ...b.items.map((id) => h('span', { class: 'chip', style: { color: ITEM_BY_ID[id].color } }, `${ITEM_BY_ID[id].icon} ${ITEM_BY_ID[id].name}`)))))));
}

// ---------------------------------------------------------------- main menu
export function menuScreen(app: AppApi): HTMLElement {
  const p = app.profile;
  const el = h('div', { class: 'screen menu' },
    h('div', { class: 'menu-left' },
      h('div', { class: 'logo' }, h('div', { class: 'crown' }, '♛'), h('h1', {}, 'CROWNFALL'), h('div', { class: 'tag' }, 'Two guilds. One sky-island. One reality engine.')),
      h('nav', {},
        h('button', { class: 'btn primary big', onclick: () => { audio.init(); app.startDraft(); } }, '▶  Play', h('small', {}, '3v3 vs bots · full match')),
        h('button', { class: `btn big${p.tutorialDone ? '' : ' glow'}`, onclick: () => { audio.init(); app.startTutorial(); } }, '❖  Tutorial', h('small', {}, p.tutorialDone ? 'Replay the guided first match' : 'Recommended for new players')),
        h('button', { class: 'btn', onclick: () => app.openSettings(() => app.home()) }, '⚙  Settings'),
        h('div', { class: 'row2' },
          h('button', { class: 'btn', onclick: () => showHeroes(app) }, 'Heroes'),
          h('button', { class: 'btn', onclick: () => showItems(app) }, 'Items'),
          h('button', { class: 'btn', onclick: () => showHistory(app) }, 'Match History'),
          h('button', { class: 'btn', onclick: () => showCredits(app) }, 'Credits'))),
      h('div', { class: 'profile' }, h('b', {}, `Profile level ${profileLevel(p)}`), h('span', {}, `${p.matches} matches · ${p.wins} wins`))),
    h('div', { class: 'menu-foot' }, 'Desktop Chrome / Edge · WebGL 2 · keyboard + mouse · 1280×720 and up'));
  return el;
}

function modal(app: AppApi, title: string, body: HTMLElement, wide = false): void {
  const root = document.getElementById('ui')!;
  const m = h('div', { class: 'screen modal-screen' }, h('div', { class: `panel modal${wide ? ' wide' : ''}` },
    h('div', { class: 'modal-head' }, h('h2', {}, title), h('button', { class: 'x', onclick: () => { m.remove(); } }, '×')), body));
  root.append(m);
  void app;
}

function showHeroes(app: AppApi) {
  const portraits = heroPortraits();
  const detail = h('div', { class: 'heroes-detail' });
  let sel = HEROES[0];
  const list = h('div', { class: 'heroes-list' });
  const draw = () => {
    clear(list); clear(detail);
    for (const hd of HEROES) list.append(h('div', { class: `hcard${sel === hd ? ' sel' : ''}`, onclick: () => { sel = hd; draw(); } }, h('div', { class: 'thumb', style: { backgroundImage: `url(${portraits[hd.id] ?? ''})` } }), h('div', {}, h('b', {}, hd.name), h('small', {}, hd.role))));
    detail.append(heroPanel(sel, portraits[sel.id]));
  };
  draw();
  modal(app, 'Heroes', h('div', { class: 'heroes' }, list, detail), true);
}
function showItems(app: AppApi) {
  const grid = h('div', { class: 'items-grid' });
  for (const it of ITEMS) {
    grid.append(h('div', { class: `icard tier-${it.tier}` }, h('div', { class: 'ico', style: { color: it.color, borderColor: it.color } }, it.icon),
      h('div', {}, h('b', {}, it.name), h('small', {}, ` ${it.tier} · ${it.cost}g`),
        h('div', { class: 'st' }, Object.entries(it.stats).map(([k, v]) => `${k} ${v}`).join(' · ')),
        it.from ? h('div', { class: 'st' }, 'Recipe: ' + it.from.map((f) => ITEM_BY_ID[f].name).join(' + ')) : null,
        it.passive ? h('div', { class: 'ps' }, it.passive) : null, it.active ? h('div', { class: 'ps' }, 'Active: ' + it.active) : null)));
  }
  modal(app, `Items (${ITEMS.length})`, grid, true);
}
function showHistory(app: AppApi) {
  const hist = loadHistory();
  const body = hist.length
    ? h('table', { class: 'hist' }, h('tr', {}, h('th', {}, 'Result'), h('th', {}, 'Hero'), h('th', {}, 'K/D/A'), h('th', {}, 'CS'), h('th', {}, 'Level'), h('th', {}, 'Length'), h('th', {}, 'Difficulty'), h('th', {}, 'Date')),
      ...hist.map((m) => h('tr', { class: m.win ? 'win' : 'loss' }, h('td', {}, m.win ? 'Victory' : 'Defeat'), h('td', {}, HERO_BY_ID[m.heroId]?.name ?? m.heroId), h('td', {}, `${m.kills}/${m.deaths}/${m.assists}`), h('td', {}, String(m.lastHits)), h('td', {}, String(m.level)), h('td', {}, fmtTime(m.durationSec)), h('td', {}, m.difficulty), h('td', {}, new Date(m.date).toLocaleDateString()))))
    : h('p', { class: 'empty' }, 'No matches yet. Play a match and it will appear here.');
  const mastery = Object.entries(app.profile.mastery);
  modal(app, 'Match History', h('div', {}, body, mastery.length ? h('div', { class: 'mastery' }, h('h4', {}, 'Hero mastery'), ...mastery.map(([id, xp]) => h('span', { class: 'chip' }, `${HERO_BY_ID[id]?.name ?? id}: Lv ${masteryLevel(xp)}`))) : null));
}
function showCredits(app: AppApi) {
  modal(app, 'Credits', h('div', { class: 'credits' },
    h('p', {}, 'Crownfall is an original game: all heroes, abilities, items, map, models, VFX and audio are procedural and authored for this project.'),
    h('p', {}, 'Built with TypeScript, Vite and Three.js (MIT). No external art, audio or font files are shipped. See ASSETS.md.'),
    h('p', {}, 'Created in a single autonomous session for the Oneshot Arcade evaluation.')));
}

// ---------------------------------------------------------------- settings
export function settingsPanel(app: AppApi, close: () => void): HTMLElement {
  const s = app.settings;
  const save = () => { app.saveSettings(); };
  const row = (label: string, ctl: HTMLElement) => h('div', { class: 'srow' }, h('label', {}, label), ctl);
  const range = (get: () => number, set: (v: number) => void, min = 0, max = 1, step = 0.05) => h('input', { type: 'range', min, max, step, value: get(), oninput: (e: Event) => { set(Number((e.target as HTMLInputElement).value)); save(); } });
  const sel = (opts: [string, string][], get: () => string, set: (v: string) => void) => h('select', { onchange: (e: Event) => { set((e.target as HTMLSelectElement).value); save(); } }, ...opts.map(([v, l]) => h('option', { value: v, selected: v === get() ? 'selected' : undefined }, l)));
  const chk = (get: () => boolean, set: (v: boolean) => void) => h('input', { type: 'checkbox', checked: get() ? 'checked' : undefined, onchange: (e: Event) => { set((e.target as HTMLInputElement).checked); save(); } });
  const keyBtns: HTMLElement[] = [];
  const names: Record<string, string> = { q: 'Ability 1 (Q)', w: 'Ability 2 (W)', e: 'Ability 3 (E)', r: 'Ultimate (R)', talent1: 'Talent 1', talent2: 'Talent 2', recall: 'Recall', shop: 'Shop', ward: 'Ward trinket', stop: 'Stop', hold: 'Hold', attackMove: 'Attack-move', scoreboard: 'Scoreboard', follow: 'Follow hero', lock: 'Camera lock' };
  const keysBox = h('div', { class: 'keys' });
  const renderKeys = () => {
    clear(keysBox); keyBtns.length = 0;
    for (const k of Object.keys(names)) {
      const b = h('button', { class: 'keybtn', onclick: () => {
        b.textContent = 'press a key…'; b.classList.add('wait');
        const on = (e: KeyboardEvent) => {
          e.preventDefault(); e.stopPropagation();
          window.removeEventListener('keydown', on, true);
          if (e.key !== 'Escape') { s.keys[k] = e.key.toLowerCase(); save(); }
          renderKeys();
        };
        window.addEventListener('keydown', on, true);
      } }, (s.keys[k] === ' ' ? 'SPACE' : s.keys[k]).toUpperCase());
      keysBox.append(h('div', { class: 'krow' }, h('span', {}, names[k]), b));
    }
    keysBox.append(h('button', { class: 'btn small', onclick: () => { s.keys = { ...DEFAULT_KEYS }; save(); renderKeys(); } }, 'Reset keys'));
  };
  renderKeys();
  const el = h('div', { class: 'panel settings' },
    h('div', { class: 'modal-head' }, h('h2', {}, 'Settings'), h('button', { class: 'x', onclick: close }, '×')),
    h('div', { class: 'sgrid' },
      h('div', {}, h('h4', {}, 'Controls'),
        row('Cast mode', sel([['indicator', 'Quick cast with indicator (hold, release)'], ['quick', 'Quick cast (instant)'], ['click', 'Normal (press, then click)']], () => s.castMode, (v) => { s.castMode = v as Settings['castMode']; })),
        row('Edge scrolling', chk(() => s.edgeScroll, (v) => { s.edgeScroll = v; })),
        h('h4', {}, 'Audio'),
        row('Effects volume', range(() => s.volume, (v) => { s.volume = v; audio.setVolumes(s.volume, s.music); })),
        row('Music volume', range(() => s.music, (v) => { s.music = v; audio.setVolumes(s.volume, s.music); })),
        h('h4', {}, 'Accessibility'),
        row('Colorblind-safe teams', chk(() => s.colorblind, (v) => { s.colorblind = v; })),
        row('Effects intensity', sel([['high', 'High'], ['low', 'Low (keeps all gameplay boundaries)']], () => s.effects, (v) => { s.effects = v as Settings['effects']; })),
        row('Camera shake', range(() => s.shake, (v) => { s.shake = v; })),
        row('Damage numbers', chk(() => s.showDamage, (v) => { s.showDamage = v; })),
        row('Event captions', chk(() => s.captions, (v) => { s.captions = v; })),
        row('Tutorial hints', chk(() => s.tutorialHints, (v) => { s.tutorialHints = v; })),
        row('UI scale', sel([['100', '100%'], ['125', '125%'], ['150', '150%']], () => String(s.uiScale), (v) => { s.uiScale = Number(v); document.documentElement.style.setProperty('--ui', String(s.uiScale / 100)); document.documentElement.dataset.ui = String(s.uiScale); })),
        h('h4', {}, 'Graphics'),
        row('Quality', sel([['high', 'High (shadows, full resolution)'], ['medium', 'Medium'], ['low', 'Low (no shadows)']], () => s.quality, (v) => { s.quality = v as Settings['quality']; }))),
      h('div', {}, h('h4', {}, 'Key bindings'), keysBox)),
    h('div', { class: 'srow end' }, h('button', { class: 'btn small', onclick: () => { Object.assign(s, JSON.parse(JSON.stringify(DEFAULT_SETTINGS))); save(); close(); } }, 'Restore defaults'), h('button', { class: 'btn primary', onclick: close }, 'Done')));
  return el;
}

// ---------------------------------------------------------------- draft
export function draftScreen(app: AppApi): HTMLElement {
  const portraits = heroPortraits();
  let selId = HEROES[0].id;
  let talents: string[] = ['mend', 'sprint'];
  let diff: 'easy' | 'normal' | 'hard' = 'normal';
  let locked = false;
  let left = 40;
  const center = h('div', { class: 'd-center' });
  const cards = h('div', { class: 'd-cards' });
  const talentBox = h('div', { class: 'talent-grid' });
  const slotBox = h('div', { class: 'slots' });
  const timer = h('div', { class: 'd-timer' }, '40');
  const lockBtn = h('button', { class: 'btn primary big', onclick: () => lock() }, 'Lock In');
  const draw = () => {
    clear(cards); clear(center); clear(talentBox); clear(slotBox);
    for (const hd of HEROES) cards.append(h('div', { class: `d-card${selId === hd.id ? ' sel' : ''}${locked ? ' off' : ''}`, onclick: () => { if (locked) return; selId = hd.id; audio.play('click', 0.6); draw(); } },
      h('div', { class: 'thumb', style: { backgroundImage: `url(${portraits[hd.id] ?? ''})` } }, portraits[hd.id] ? null : h('span', {}, hd.name[0])), h('b', {}, hd.name), h('small', {}, `${hd.role} · ${stars(hd.difficulty)}`)));
    center.append(heroPanel(HERO_BY_ID[selId], portraits[selId]));
    for (const t of TALENTS) {
      const on = talents.includes(t.id);
      talentBox.append(h('div', { class: `talent${on ? ' on' : ''}`, title: t.desc, onclick: () => { if (locked) return; if (on) talents = talents.filter((x) => x !== t.id); else talents = [...talents, t.id].slice(-2); draw(); } }, h('div', { class: 'ico' }, t.icon), h('b', {}, t.name), h('small', {}, `${t.desc} (${t.cd}s)`)));
    }
    slotBox.append(h('div', { class: 'team-slots' }, h('h4', {}, TEAM_NAMES[0] + ' (you)'),
      h('div', { class: 'slot me' }, h('b', {}, HERO_BY_ID[selId].name), h('small', {}, locked ? 'Locked' : 'Choosing…')),
      h('div', { class: 'slot' }, h('b', {}, 'Ally bot'), h('small', {}, 'Picks a complementary role')), h('div', { class: 'slot' }, h('b', {}, 'Ally bot'), h('small', {}, 'Picks after you lock'))),
      h('div', { class: 'team-slots foe' }, h('h4', {}, TEAM_NAMES[1]), h('div', { class: 'slot' }, h('b', {}, '???'), h('small', {}, 'Hidden until load')), h('div', { class: 'slot' }, h('b', {}, '???')), h('div', { class: 'slot' }, h('b', {}, '???'))));
    lockBtn.textContent = locked ? 'Locked ✔' : talents.length === 2 ? 'Lock In' : 'Choose 2 talents';
    lockBtn.classList.toggle('disabled', locked || talents.length !== 2);
  };
  const lock = () => {
    if (locked || talents.length !== 2) return;
    locked = true; window.clearInterval(iv); audio.play('ring', 0.8); draw();
    setTimeout(() => app.beginMatch({ heroId: selId, talents: [talents[0], talents[1]], difficulty: diff }), 450);
  };
  const iv = window.setInterval(() => { left--; timer.textContent = String(left); if (left <= 0) { window.clearInterval(iv); if (talents.length === 2) lock(); else { talents = ['mend', 'sprint']; lock(); } } }, 1000);
  const diffSel = h('div', { class: 'diff' }, ...(['easy', 'normal', 'hard'] as const).map((d) => h('button', { class: `btn small${diff === d ? ' on' : ''}`, onclick: (e: Event) => { diff = d; (e.target as HTMLElement).parentElement!.querySelectorAll('button').forEach((b) => b.classList.remove('on')); (e.target as HTMLElement).classList.add('on'); } }, d[0].toUpperCase() + d.slice(1))));
  draw();
  const el = h('div', { class: 'screen draft' },
    h('div', { class: 'd-head' }, h('h2', {}, 'Hero Select'), h('div', { class: 'sub' }, 'Pick a hero and two universal talents (D / F). Allies cannot duplicate; the enemy may mirror you.'), timer,
      h('button', { class: 'btn small', onclick: () => { window.clearInterval(iv); app.home(); } }, '← Back')),
    h('div', { class: 'd-body' }, cards, center, h('div', { class: 'd-right' }, slotBox, h('h4', {}, 'Talents'), talentBox, h('h4', {}, 'Bot difficulty'), diffSel, h('div', { class: 'diffnote' }, 'Difficulty changes reaction time, aim and map planning only: never stats or vision.'), lockBtn)));
  (el as HTMLElement & { stop?: () => void }).stop = () => window.clearInterval(iv);
  return el;
}

export function loadingScreen(lines: string[], tip: string): HTMLElement {
  return h('div', { class: 'screen loading' }, h('div', { class: 'ld-box panel' }, h('h2', {}, 'Entering The Broken Diadem'), h('div', { class: 'ld-bar' }, h('i', {})), ...lines.map((l) => h('p', {}, l)), h('div', { class: 'tip' }, 'Tip: ' + tip)));
}

export function errorScreen(title: string, msg: string): HTMLElement {
  return h('div', { class: 'screen error' }, h('div', { class: 'panel' }, h('h2', {}, title), h('p', {}, msg), h('button', { class: 'btn primary', onclick: () => location.reload() }, 'Reload')));
}

// ---------------------------------------------------------------- results
export function resultsScreen(app: AppApi, sim: Sim, tutorial: boolean): HTMLElement {
  const me = sim.player;
  const win = sim.winner === me.team;
  const dur = sim.time;
  const maxDmg = Math.max(...sim.heroes.map((x) => x.hero!.damageDealt), 1);
  const maxGold = Math.max(...sim.heroes.map((x) => x.hero!.totalGold), 1);
  const rows = (team: 0 | 1) => sim.heroes.filter((x) => x.team === team).map((u) => {
    const s = u.hero!, d = HERO_BY_ID[s.heroId];
    return h('tr', { class: u === me ? 'me' : '' }, h('td', {}, h('b', {}, d.name), h('small', {}, ` Lv${s.level}`)), h('td', {}, `${s.kills}/${s.deaths}/${s.assists}`), h('td', {}, String(s.lastHits + s.monsterKills)),
      h('td', { class: 'bars' }, h('div', { class: 'bar dmg' }, h('i', { style: { width: `${(s.damageDealt / maxDmg) * 100}%` } }), h('span', {}, fmtNum(s.damageDealt)))),
      h('td', { class: 'bars' }, h('div', { class: 'bar gold' }, h('i', { style: { width: `${(s.totalGold / maxGold) * 100}%` } }), h('span', {}, fmtNum(s.totalGold)))),
      h('td', {}, String(s.objectives)), h('td', {}, `${s.wardsPlaced}`), h('td', { class: 'it' }, ...s.items.map((i) => h('span', { style: { color: i ? ITEM_BY_ID[i.id].color : '#456' }, title: i ? ITEM_BY_ID[i.id].name : '' }, i ? ITEM_BY_ID[i.id].icon : '·'))));
  });
  const head = h('tr', {}, h('th', {}, 'Hero'), h('th', {}, 'K/D/A'), h('th', {}, 'CS'), h('th', {}, 'Damage'), h('th', {}, 'Gold'), h('th', {}, 'Obj'), h('th', {}, 'Wards'), h('th', {}, 'Items'));
  const hs = me.hero!;
  const best = [...sim.heroes].sort((a, b) => b.hero!.damageToStructures - a.hero!.damageToStructures)[0];
  const commend = hs.kills >= 6 ? 'Kingslayer' : hs.damageToStructures > 3000 ? 'Siege Mason' : hs.assists >= 8 ? 'Guild Anchor' : hs.lastHits + hs.monsterKills >= 150 ? 'Harvest Master' : 'Steady Hand';
  const timeline = sim.timeline.filter((e) => e.kind !== 'kill' || true).slice(-40);
  const el = h('div', { class: 'screen results' }, h('div', { class: 'panel res-panel' },
    h('div', { class: `res-banner ${win ? 'win' : 'loss'}` }, h('h1', {}, tutorial ? 'Tutorial Complete' : win ? 'VICTORY' : 'DEFEAT'), h('div', { class: 'sub' }, `${TEAM_NAMES[sim.winner === 0 ? 0 : 1]} destroyed the Crown Engine · ${fmtTime(dur)}`)),
    h('div', { class: 'res-grid' },
      h('div', {}, h('h4', { class: 'blue' }, `${TEAM_NAMES[0]} · ${sim.teams[0].kills} kills`), h('table', {}, head, ...rows(0)), h('h4', { class: 'red' }, `${TEAM_NAMES[1]} · ${sim.teams[1].kills} kills`), h('table', {}, head, ...rows(1))),
      h('div', { class: 'res-side' },
        h('h4', {}, 'Your match'), h('div', { class: 'commend' }, `Commendation: ${commend}`),
        h('p', {}, `Skill order: ${hs.skillLog.map((x) => x.split(':')[1]).join(' → ') || '—'}`),
        h('p', {}, `Build: ${hs.buildLog.map((b) => ITEM_BY_ID[b.item].name).join(' → ') || '—'}`),
        h('p', {}, `Damage to structures: ${fmtNum(hs.damageToStructures)} · Vision: ${hs.wardsPlaced} wards placed, ${hs.wardsKilled} destroyed`),
        h('p', {}, `Top siege: ${HERO_BY_ID[best.hero!.heroId].name}`),
        h('h4', {}, 'Match timeline'),
        h('div', { class: 'tl' }, ...timeline.map((e) => h('div', { class: `tl-row t${e.team}` }, h('time', {}, fmtTime(e.t)), h('span', {}, e.text)))))),
    h('div', { class: 'res-actions' }, h('button', { class: 'btn primary big', onclick: () => app.playAgain() }, tutorial ? 'Start a real match' : 'Play again'), h('button', { class: 'btn big', onclick: () => app.home() }, 'Main menu'))));
  return el;
}
