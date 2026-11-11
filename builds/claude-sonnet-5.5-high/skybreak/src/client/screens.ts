/** Shell screens: main menu, queue, settings, career, credits, pause, results, map and inventory overlays. */
import { AMMO_CAPS, AMMO_NAMES, AMMO_TYPES, COSMETICS, ITEMS, RARITIES, WEAPONS, effectiveWeapon } from '../shared/content';
import type { Match } from '../sim/match';
import type { Player } from '../sim/types';
import { MapRenderer, type MapMarker } from './minimap';
import { drawItemIcon, drawWeaponIcon, keyName } from './hud';
import { drawRarityShape } from './gameview';
import { DEFAULT_KEYS, KEY_LABELS, OUTFIT_UNLOCK, masteryLevel, type Keybinds, type Profile, type Settings } from './settings';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', html = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

export interface ResultData {
  placement: number; total: number; winnerName: string; kills: number; assists: number; damage: number; accuracy: number; survive: number;
  distance: number; storm: number; headshots: number; killedBy: string; loot: { name: string; rarity: number; t: number }[];
  timeline: { t: number; text: string }[]; xpGain: number; mode: string; route: { x: number; z: number }[];
}

export class Screens {
  readonly root: HTMLElement;
  private current: HTMLElement | null = null;
  profile: Profile;
  settings: Settings;
  onQuick: () => void = () => {};
  onPractice: () => void = () => {};
  onSettingsChanged: () => void = () => {};
  onProfileChanged: () => void = () => {};
  onResume: () => void = () => {};
  onLeaveMatch: () => void = () => {};
  onRequeue: () => void = () => {};
  onMenu: () => void = () => {};
  onMarker: (m: MapMarker | null) => void = () => {};
  onDropSlot: (i: number) => void = () => {};
  onSelectSlot: (i: number) => void = () => {};
  onCancelQueue: () => void = () => {};
  private mapOverlay: HTMLElement | null = null;
  private mapCanvas: HTMLCanvasElement | null = null;
  private invOverlay: HTMLElement | null = null;
  private listening: { btn: HTMLElement; key: keyof Keybinds } | null = null;

  constructor(parent: HTMLElement, profile: Profile, settings: Settings) {
    this.root = el('div'); this.root.id = 'screens';
    parent.appendChild(this.root);
    this.profile = profile; this.settings = settings;
    window.addEventListener('keydown', (e) => {
      if (this.listening) {
        e.preventDefault(); e.stopPropagation();
        if (e.code !== 'Escape') { this.settings.keys[this.listening.key] = e.code; this.listening.btn.textContent = keyName(e.code); this.onSettingsChanged(); }
        else this.listening.btn.textContent = keyName(this.settings.keys[this.listening.key]);
        this.listening.btn.classList.remove('listening');
        this.listening = null;
      }
    }, true);
  }

  clear(): void { if (this.current) { this.current.remove(); this.current = null; } }
  private show(node: HTMLElement): HTMLElement { this.clear(); this.root.appendChild(node); this.current = node; return node; }

  /* ---------------------------------------------------------- menu */
  showMenu(): void {
    const s = el('div', 'screen menu-bg left');
    const art = el('div', 'menu-art');
    art.innerHTML = MENU_ART;
    s.appendChild(art);
    const lvl = masteryLevel(this.profile.xp);
    s.appendChild(el('div', 'profile-chip', `<b>${this.profile.name}</b> · Mastery ${lvl} · ${this.profile.wins} wins · ${this.profile.matches} matches`));
    const wrap = el('div', 'title-wrap');
    wrap.innerHTML = `<h1 class="logo">SKY<span>BREAK</span></h1><div class="tagline">Drop · Loot · Rotate · Survive</div>`;
    const col = el('div', 'menu-col');
    const quick = el('button', 'btn big', 'Quick Drop'); quick.onclick = () => this.onQuick();
    const practice = el('button', 'btn alt', this.profile.practiceVisited ? 'Practice Range' : 'Practice Range — start here'); practice.onclick = () => this.onPractice();
    const career = el('button', 'btn dark', 'Career & Appearance'); career.onclick = () => this.showCareer();
    const settings = el('button', 'btn dark', 'Settings'); settings.onclick = () => this.showSettings(() => this.showMenu());
    const credits = el('button', 'btn dark small', 'Controls & Credits'); credits.onclick = () => this.showCredits();
    col.append(quick, practice, career, settings, credits);
    wrap.appendChild(col);
    s.appendChild(wrap);
    s.appendChild(el('div', 'footer-note', 'Solo · 24 players · The Highwake · Desktop Chrome / Edge with WebGL 2 · Single-player, runs entirely in your browser'));
    this.show(s);
    quick.focus();
  }

  /* ---------------------------------------------------------- queue */
  showQueue(): { update: (secs: number, found: number, total: number, stage: string) => void } {
    const s = el('div', 'screen menu-bg');
    const card = el('div', 'panel queue-card');
    card.innerHTML = `<h2>Quick Drop · Solo</h2><div class="spinner"></div><div class="q-stage" style="font-size:18px;font-weight:700">Finding a room…</div>
      <div class="bar"><i style="width:0%"></i></div><div class="kv" style="justify-content:center;grid-template-columns:auto auto"><span class="k">Region</span><span>Local (host in this tab)</span><span class="k">Elapsed</span><span class="q-time">0:00</span><span class="k">Players</span><span class="q-players">1 / 24</span></div>`;
    const cancel = el('button', 'btn small dark', 'Cancel'); cancel.style.marginTop = '14px'; cancel.onclick = () => this.onCancelQueue();
    card.appendChild(cancel);
    s.appendChild(card);
    this.show(s);
    return {
      update: (secs, found, total, stage) => {
        (card.querySelector('.q-time') as HTMLElement).textContent = `0:${String(Math.floor(secs)).padStart(2, '0')}`;
        (card.querySelector('.q-players') as HTMLElement).textContent = `${found} / ${total}`;
        (card.querySelector('.q-stage') as HTMLElement).textContent = stage;
        (card.querySelector('.bar i') as HTMLElement).style.width = `${(found / total) * 100}%`;
      },
    };
  }

  showLoading(text: string): void {
    const s = el('div', 'screen menu-bg');
    s.innerHTML = `<div class="panel queue-card"><h2>${text}</h2><div class="spinner"></div><div style="opacity:.8">Generating island cells, collision and loot tables…</div></div>`;
    this.show(s);
  }

  showError(title: string, body: string, actions: { label: string; fn: () => void }[] = []): void {
    const s = el('div', 'screen menu-bg dim-bg');
    const c = el('div', 'panel error-card');
    c.innerHTML = `<h2>${title}</h2><p style="font-size:16px;line-height:1.6">${body}</p>`;
    const row = el('div', 'row'); row.style.justifyContent = 'center'; row.style.marginTop = '14px';
    for (const a of actions) { const b = el('button', 'btn small', a.label); b.onclick = a.fn; row.appendChild(b); }
    c.appendChild(row);
    s.appendChild(c);
    this.show(s);
  }

  /* ------------------------------------------------------- settings */
  showSettings(back: () => void, overlay = false): void {
    const s = el('div', 'screen ' + (overlay ? 'dim-bg' : 'menu-bg dim-bg'));
    const card = el('div', 'panel'); card.style.width = 'min(760px, 94vw)';
    card.innerHTML = '<h2>Settings</h2>';
    const tabs = el('div', 'tabs');
    const body = el('div');
    const names = ['Gameplay', 'Graphics', 'Audio', 'Accessibility', 'Controls'];
    let tab = 0;
    const render = () => {
      body.innerHTML = '';
      tabs.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('on', i === tab));
      const g = el('div', 'settings-grid');
      const st = this.settings;
      const slider = (label: string, key: keyof Settings, min: number, max: number, step: number, fmtv: (v: number) => string = (v) => v.toFixed(2)) => {
        g.appendChild(el('label', '', label));
        const inp = el('input'); inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(step); inp.value = String(st[key] as number);
        const val = el('div', 'val', fmtv(st[key] as number));
        inp.oninput = () => { (st[key] as number) = Number(inp.value); val.textContent = fmtv(Number(inp.value)); this.onSettingsChanged(); };
        g.append(inp, val);
      };
      const check = (label: string, key: keyof Settings) => {
        g.appendChild(el('label', '', label));
        const inp = el('input'); inp.type = 'checkbox'; inp.checked = !!st[key];
        inp.onchange = () => { (st[key] as boolean) = inp.checked; this.onSettingsChanged(); };
        inp.style.justifySelf = 'start'; inp.style.width = '20px'; inp.style.height = '20px';
        g.append(inp, el('div'));
      };
      if (tab === 0) {
        slider('Mouse sensitivity', 'sens', 0.2, 3, 0.05); slider('Scoped / ADS sensitivity', 'adsSens', 0.2, 2, 0.05);
        slider('Field of view (horizontal)', 'fov', 80, 105, 1, (v) => `${Math.round(v)}°`);
        check('Hold-to-toggle ADS (click to toggle)', 'adsToggle'); check('Toggle crouch', 'crouchToggle'); check('Toggle sprint', 'sprintToggle'); check('Invert Y', 'invertY');
      } else if (tab === 1) {
        g.appendChild(el('label', '', 'Quality preset'));
        const sel = el('select'); for (const q of ['low', 'medium', 'high']) { const o = el('option', '', q); o.value = q; if (st.quality === q) o.selected = true; sel.appendChild(o); }
        sel.onchange = () => { st.quality = sel.value as Settings['quality']; this.onSettingsChanged(); }; g.append(sel, el('div'));
        slider('Render resolution', 'resolution', 0.5, 1, 0.05, (v) => `${Math.round(v * 100)}%`);
        check('Dynamic resolution', 'dynamicRes'); check('Show FPS', 'showFps');
        const note = el('div', '', 'Low preserves storm wall, mist-cloud boundary, tracers and projectile threats; it only reduces shadows, effect counts, draw distance and resolution.'); note.style.gridColumn = '1 / -1'; note.style.opacity = '0.75'; note.style.fontSize = '12px'; g.appendChild(note);
      } else if (tab === 2) {
        slider('Master volume', 'volume', 0, 1, 0.05, (v) => `${Math.round(v * 100)}%`); slider('Music volume', 'music', 0, 1, 0.05, (v) => `${Math.round(v * 100)}%`);
      } else if (tab === 3) {
        check('Reduced motion (camera recoil & shake)', 'reducedMotion'); check('Colorblind-safe rarity colors', 'colorblind');
        check('Visual sound indicators', 'soundIndicators'); check('Closed captions', 'captions');
        const note = el('div', '', 'Rarity is always conveyed by shape and name as well as color: Field ● · Tuned ⌃ · Advanced ◆ · Masterwork ♛ · Prototype ★. The storm never strobes.'); note.style.gridColumn = '1 / -1'; note.style.opacity = '0.75'; note.style.fontSize = '12px'; g.appendChild(note);
      } else {
        for (const k of Object.keys(DEFAULT_KEYS) as (keyof Keybinds)[]) {
          g.appendChild(el('label', '', KEY_LABELS[k]));
          const b = el('button', 'keybtn', keyName(st.keys[k]));
          b.onclick = () => { if (this.listening) this.listening.btn.classList.remove('listening'); this.listening = { btn: b, key: k }; b.textContent = 'press a key…'; b.classList.add('listening'); };
          g.append(b, el('div'));
        }
        const rs = el('button', 'btn small dark', 'Reset to defaults'); rs.onclick = () => { st.keys = { ...DEFAULT_KEYS }; this.onSettingsChanged(); render(); };
        rs.style.gridColumn = '1 / -1'; g.appendChild(rs);
      }
      body.appendChild(g);
    };
    names.forEach((n, i) => { const t = el('div', 'tab', n); t.onclick = () => { tab = i; render(); }; tabs.appendChild(t); });
    card.append(tabs, body);
    const done = el('button', 'btn', 'Done'); done.style.marginTop = '16px'; done.onclick = () => { this.onSettingsChanged(); back(); };
    card.appendChild(done);
    s.appendChild(card);
    this.show(s);
    render();
  }

  /* --------------------------------------------------------- career */
  showCareer(): void {
    const s = el('div', 'screen menu-bg dim-bg');
    const card = el('div', 'panel'); card.style.width = 'min(820px, 94vw)';
    const p = this.profile;
    const lvl = masteryLevel(p.xp);
    const into = p.xp % 400;
    card.innerHTML = `<h2>Career</h2>
      <div class="stat-grid"><div class="stat"><div class="v">${lvl}</div><div class="l">Mastery level</div></div><div class="stat"><div class="v">${p.matches}</div><div class="l">Matches</div></div><div class="stat"><div class="v">${p.wins}</div><div class="l">Wins</div></div><div class="stat"><div class="v">${p.kills}</div><div class="l">Eliminations</div></div></div>
      <div>Mastery XP: ${p.xp} <span style="opacity:.7">(${into}/400 to next level)</span></div><div class="xp-bar"><i style="width:${(into / 400) * 100}%"></i></div>
      <h3>Appearance (cosmetic only — never affects gameplay)</h3>`;
    const outfits = el('div', 'outfits');
    COSMETICS.forEach((c, i) => {
      const unlocked = lvl >= OUTFIT_UNLOCK[i];
      const o = el('div', 'outfit' + (p.outfit === i ? ' on' : '') + (unlocked ? '' : ' locked'));
      o.style.background = `linear-gradient(160deg, ${c.primary}, ${c.accent})`;
      o.innerHTML = unlocked ? c.name : `Lv ${OUTFIT_UNLOCK[i]}`;
      o.onclick = () => { if (!unlocked) return; p.outfit = i; this.onProfileChanged(); this.showCareer(); };
      outfits.appendChild(o);
    });
    card.appendChild(outfits);
    card.appendChild(el('h3', '', 'Recent matches'));
    const list = el('div', 'list');
    list.innerHTML = p.history.length ? p.history.slice(0, 8).map((h) => `<div>${h.date} · ${h.mode === 'quick' ? 'Solo' : 'Practice'} · <b>#${h.placement}</b> · ${h.kills} elims · ${Math.round(h.damage)} dmg · +${h.xp} XP</div>`).join('') : '<div style="opacity:.7">No matches yet — drop in!</div>';
    card.appendChild(list);
    const back = el('button', 'btn', 'Back'); back.style.marginTop = '14px'; back.onclick = () => this.showMenu();
    card.appendChild(back);
    s.appendChild(card);
    this.show(s);
  }

  showCredits(): void {
    const s = el('div', 'screen menu-bg dim-bg');
    const card = el('div', 'panel credits'); card.style.width = 'min(880px, 94vw)';
    const k = this.settings.keys;
    card.innerHTML = `<h2>Controls</h2><div class="legend">
      <div><kbd>${keyName(k.forward)}${keyName(k.left)}${keyName(k.back)}${keyName(k.right)}</kbd>Move</div><div><kbd>Mouse</kbd>Aim · <kbd>LMB</kbd> fire · <kbd>RMB</kbd> ADS</div>
      <div><kbd>${keyName(k.sprint)}</kbd>Sprint (5 s energy)</div><div><kbd>${keyName(k.crouch)}</kbd>Crouch · slide while sprinting</div>
      <div><kbd>${keyName(k.jump)}</kbd>Jump · mantle ledges (hold) · wing-sail in the air</div><div><kbd>${keyName(k.interact)}</kbd>Interact / pick up · hold to swap · ride zipline</div>
      <div><kbd>1-5</kbd> / wheel Select slot · <kbd>${keyName(k.reload)}</kbd> reload</div><div><kbd>${keyName(k.drop)}</kbd>Drop selected · <kbd>${keyName(k.melee)}</kbd> melee</div>
      <div><kbd>${keyName(k.throwItem)}</kbd>Throw Wind Orb / Mist · <kbd>${keyName(k.swapShoulder)}</kbd> swap shoulder</div><div><kbd>${keyName(k.map)}</kbd>Full map · click to mark · <kbd>MMB</kbd> ping</div>
      <div><kbd>${keyName(k.inventory)}</kbd>Inventory · <kbd>${keyName(k.deploy)}</kbd> deploy/stow wing-sail</div><div><kbd>Esc</kbd>Menu · <kbd>Enter</kbd> skip staging</div></div>
      <h2 style="margin-top:20px">Credits</h2>
      <p><b>Skybreak</b> is an original game. The island, characters, weapons (wind-instrument inspired), items, wing-sails, skiff, music and sound are all generated procedurally in code. No third-party art, audio, maps or names are used. Engine: three.js (MIT). See ASSETS.md.</p>
      <p style="opacity:.75">The Highwake · The Calmfield · The Riftstorm · Aegis · Wayfarer · Tempest · Breakwater · Coil · Needler · Sundial · Longwake · Harbor · Gale</p>`;
    const back = el('button', 'btn', 'Back'); back.style.marginTop = '14px'; back.onclick = () => this.showMenu();
    card.appendChild(back);
    s.appendChild(card);
    this.show(s);
  }

  /* ---------------------------------------------------------- pause */
  showPause(practice: boolean): void {
    const s = el('div', 'screen dim-bg');
    const card = el('div', 'panel'); card.style.minWidth = '320px';
    card.innerHTML = `<h2>${practice ? 'Practice Range (paused)' : 'Menu'}</h2>`;
    const col = el('div', 'menu-col');
    const resume = el('button', 'btn', 'Resume'); resume.onclick = () => this.onResume();
    const settings = el('button', 'btn dark', 'Settings'); settings.onclick = () => this.showSettings(() => this.showPause(practice), true);
    const leave = el('button', 'btn dark', practice ? 'Back to Menu' : 'Leave Match'); leave.onclick = () => this.onLeaveMatch();
    col.append(resume, settings, leave);
    card.appendChild(col);
    if (!practice) card.appendChild(el('div', 'footer-note', '')).style.position = 'static';
    s.appendChild(card);
    this.show(s);
  }

  /* -------------------------------------------------------- results */
  showResults(r: ResultData, match: Match, map: MapRenderer | null): void {
    const s = el('div', 'screen menu-bg dim-bg');
    const card = el('div', 'panel results');
    const win = r.placement === 1;
    const lvlBefore = masteryLevel(this.profile.xp - r.xpGain), lvlNow = masteryLevel(this.profile.xp);
    card.innerHTML = `<div class="row"><div class="grow"><div class="place ${win ? 'win' : ''}">${win ? 'VICTORY' : `#${r.placement}`}</div>
      <div style="font-size:18px;margin-top:6px">${win ? 'Last one standing on The Highwake.' : `Placed ${r.placement} of ${r.total}${r.killedBy ? ` · eliminated by ${r.killedBy}` : ''}`}${r.winnerName && !win ? ` · Winner: ${r.winnerName}` : ''}</div></div>
      <div style="text-align:right"><div style="font-size:14px;color:#9cc3d1">MASTERY XP</div><div style="font-size:28px;font-weight:900;color:var(--violet)">+${r.xpGain}</div>${lvlNow > lvlBefore ? '<div style="color:var(--gold);font-weight:800">LEVEL UP! → ' + lvlNow + '</div>' : ''}</div></div>
      <div class="stat-grid">
        <div class="stat"><div class="v">${r.kills}</div><div class="l">Eliminations</div></div><div class="stat"><div class="v">${r.assists}</div><div class="l">Assists</div></div>
        <div class="stat"><div class="v">${Math.round(r.damage)}</div><div class="l">Damage dealt</div></div><div class="stat"><div class="v">${r.accuracy}%</div><div class="l">Accuracy · ${r.headshots} headshots</div></div>
        <div class="stat"><div class="v">${fmtTime(r.survive)}</div><div class="l">Survival time</div></div><div class="stat"><div class="v">${(r.distance / 1000).toFixed(2)} km</div><div class="l">Distance travelled</div></div>
        <div class="stat"><div class="v">${Math.round(r.storm)}</div><div class="l">Storm damage taken</div></div><div class="stat"><div class="v">${r.loot.length}</div><div class="l">Items picked up</div></div>
      </div><div class="res-cols"><div><h3>Loot history</h3><div class="list">${r.loot.slice(-40).map((l) => `<div><span class="chip" style="background:${RARITIES[l.rarity].color}"></span>${fmtTime(l.t)} · ${l.name}</div>`).join('') || '<div>No pickups</div>'}</div></div>
      <div><h3>Match timeline</h3><div class="list">${r.timeline.slice(-40).map((t) => `<div>${fmtTime(t.t)} · ${t.text}</div>`).join('')}</div></div><div><h3>Route</h3><canvas class="route" width="220" height="220" style="width:220px;height:220px;border-radius:10px"></canvas></div></div>`;
    const row = el('div', 'row'); row.style.marginTop = '16px';
    const again = el('button', 'btn', r.mode === 'quick' ? 'Requeue' : 'Play again'); again.onclick = () => this.onRequeue();
    const menu = el('button', 'btn dark', 'Main Menu'); menu.onclick = () => this.onMenu();
    row.append(again, menu);
    card.appendChild(row);
    s.appendChild(card);
    this.show(s);
    const cv = card.querySelector('canvas.route') as HTMLCanvasElement;
    if (cv && map) {
      const ctx = cv.getContext('2d')!;
      ctx.drawImage(map.base, 0, 0, 600, 600, 0, 0, 220, 220);
      ctx.strokeStyle = '#fff27a'; ctx.lineWidth = 2; ctx.beginPath();
      r.route.forEach((p, i) => { const x = ((p.x + 600) / 1200) * 220, y = ((p.z + 600) / 1200) * 220; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
      ctx.stroke();
      const last = r.route[r.route.length - 1];
      if (last) { ctx.fillStyle = '#ff5f6d'; ctx.beginPath(); ctx.arc(((last.x + 600) / 1200) * 220, ((last.z + 600) / 1200) * 220, 4, 0, Math.PI * 2); ctx.fill(); }
    }
    void match;
  }

  /* -------------------------------------------------- map overlay */
  openMap(match: Match, map: MapRenderer, getYaw: () => number, humanId: number, marker: MapMarker | null): void {
    this.closeMap();
    const ov = el('div', 'screen map-overlay');
    const card = el('div', 'panel map-card');
    const cv = el('canvas'); cv.width = cv.height = 900;
    const help = el('div', 'map-help', '<span>Click to place a marker · click it again to clear</span><span>M / Esc to close</span>');
    card.append(cv, help);
    ov.appendChild(card);
    this.root.appendChild(ov);
    this.mapOverlay = ov; this.mapCanvas = cv;
    let mk = marker;
    cv.onclick = (e) => {
      const rect = cv.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * map.fullSpan, z = ((e.clientY - rect.top) / rect.height - 0.5) * map.fullSpan;
      if (mk && Math.hypot(mk.x - x, mk.z - z) < 25) mk = null; else mk = { x, z };
      this.onMarker(mk);
    };
    const draw = () => {
      if (!this.mapOverlay) return;
      const h = match.players[humanId];
      map.draw(cv.getContext('2d')!, 900, { cx: 0, cz: 0, span: map.fullSpan }, { labels: true, marker: mk, humanId, yaw: getYaw(), showSkiff: match.phase === 'staging' || match.phase === 'skiff', trails: h ? match.beaconTrails(h) : [], colorblind: this.settings.colorblind });
      requestAnimationFrame(draw);
    };
    draw();
  }
  closeMap(): void { if (this.mapOverlay) { this.mapOverlay.remove(); this.mapOverlay = null; } }
  get mapOpen(): boolean { return !!this.mapOverlay; }

  /* ----------------------------------------------- inventory overlay */
  openInventory(getPlayer: () => Player): void {
    this.closeInventory();
    const ov = el('div', 'screen inv-overlay');
    const card = el('div', 'panel'); card.style.width = 'min(820px, 96vw)';
    ov.appendChild(card);
    this.root.appendChild(ov);
    this.invOverlay = ov;
    let sel = getPlayer().selected;
    const render = () => {
      if (!this.invOverlay) return;
      const p = getPlayer();
      card.innerHTML = '<h2>Inventory</h2>';
      const grid = el('div', 'inv-grid');
      p.slots.forEach((s, i) => {
        const d = el('div', 'inv-slot' + (i === sel ? ' sel' : ''));
        const cv = el('canvas'); cv.width = 240; cv.height = 80;
        d.appendChild(cv);
        if (!s) d.append(el('div', 'nm', `Slot ${i + 1}`), el('div', 'st', 'Empty'));
        else if (s.kind === 'weapon') {
          const r = RARITIES[s.rarity]; const col = this.settings.colorblind ? r.colorBlind : r.color;
          drawWeaponIcon(cv.getContext('2d')!, s.weapon, 240, 80, col);
          d.append(el('div', 'nm', `<span style="color:${col}">${WEAPONS[s.weapon].name}</span>`), el('div', 'st', `${r.name} · ${s.mag}/${effectiveWeapon(s.weapon, s.rarity).mag}`));
          d.style.borderColor = i === sel ? '#fff' : col;
          const rc = el('canvas'); rc.width = rc.height = 28; rc.style.cssText = 'position:absolute;top:6px;right:6px;width:22px;height:22px'; drawRarityShape(rc.getContext('2d')!, r.shape, col, 14, 14, 11, true); d.appendChild(rc);
        } else {
          drawItemIcon(cv.getContext('2d')!, s.item, 240, 80);
          d.append(el('div', 'nm', ITEMS[s.item].name), el('div', 'st', `×${s.count} · ${ITEMS[s.item].blurb}`));
        }
        d.onclick = () => { sel = i; this.onSelectSlot(i); render(); };
        grid.appendChild(d);
      });
      card.appendChild(grid);
      const detail = el('div', 'inv-detail');
      const cur = p.slots[sel];
      if (cur && cur.kind === 'weapon') {
        const e = effectiveWeapon(cur.weapon, cur.rarity);
        detail.innerHTML = `<b style="font-size:17px">${e.def.name}</b> — ${e.rarity.name} (${e.rarity.note})<br>${e.def.cls} · ${AMMO_NAMES[e.def.ammo]} ammo · ${e.def.kind === 'hitscan' ? 'Hitscan' : 'Projectile'}<br>
        Damage ${e.damage.toFixed(1)}${e.def.pellets > 1 ? ` ×${e.def.pellets} pellets (cap ${Math.round(e.def.pelletCap * e.rarity.damage)})` : ''} · Fire rate ${Math.round(e.rpm)} rpm · Magazine ${e.mag} · Reload ${e.reload.toFixed(2)}s<br>Head ×${e.def.headMult} · Falloff ${e.def.falloffStart}→${e.def.falloffEnd} m (min ${Math.round(e.def.falloffMin * 100)}%) · Spread ${(e.def.spread * e.spread).toFixed(2)}° hip / ${(e.def.adsSpread * e.spread).toFixed(2)}° ADS · Recoil ×${e.recoil.toFixed(2)}`;
      } else if (cur) detail.innerHTML = `<b style="font-size:17px">${ITEMS[cur.item].name}</b> ×${cur.count}<br>${ITEMS[cur.item].blurb}`;
      else detail.textContent = 'Empty slot. Pick up weapons, heals, shields and utility from the world. Five slots, shared by everything.';
      card.appendChild(detail);
      const ammo = el('div', 'ammo-row');
      ammo.innerHTML = AMMO_TYPES.map((t) => `<div>${AMMO_NAMES[t]}<br>${p.ammo[t]} / ${AMMO_CAPS[t]}</div>`).join('');
      card.appendChild(ammo);
      const row = el('div', 'row'); row.style.marginTop = '12px';
      const drop = el('button', 'btn small', 'Drop selected'); drop.onclick = () => { this.onDropSlot(sel); setTimeout(render, 80); };
      const close = el('button', 'btn small dark', 'Close (Tab)'); close.onclick = () => this.closeInventory();
      row.append(drop, close);
      card.appendChild(row);
    };
    render();
    const tick = setInterval(() => { if (!this.invOverlay) clearInterval(tick); else render(); }, 600);
  }
  closeInventory(): void { if (this.invOverlay) { this.invOverlay.remove(); this.invOverlay = null; } }
  get invOpen(): boolean { return !!this.invOverlay; }
}

const MENU_ART = `<svg viewBox="0 0 1200 520" preserveAspectRatio="xMidYMax meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cliff" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a58b6a"/><stop offset="0.5" stop-color="#7a6a8e"/><stop offset="1" stop-color="#4a3f7a"/></linearGradient>
    <linearGradient id="top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8bd36a"/><stop offset="1" stop-color="#4d9f4f"/></linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ffe9a8" stop-opacity="0.9"/><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/></radialGradient>
  </defs>
  <g opacity="0.9" transform="translate(60,60)"><path d="M60 80 L120 140 L90 190 L150 260 L110 300" stroke="#bff6ff" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M90 190 L40 230" stroke="#9b72ff" stroke-width="3" fill="none"/></g>
  <g transform="translate(0,40)">
    <path d="M140 330 Q600 250 1060 330 L960 420 Q820 480 760 520 L700 470 Q600 540 520 470 L440 520 Q380 470 240 420 Z" fill="url(#cliff)"/>
    <path d="M140 330 Q600 200 1060 330 Q600 390 140 330 Z" fill="url(#top)"/>
    <path d="M200 338 Q600 250 1000 338 Q700 372 200 338Z" fill="#c9be8e" opacity="0.55"/>
    <g fill="#e9dcbe" stroke="#b79a62" stroke-width="2">
      <rect x="470" y="300" width="58" height="34"/><rect x="540" y="288" width="44" height="46"/><rect x="600" y="302" width="62" height="32"/><rect x="676" y="294" width="40" height="40"/>
    </g>
    <g fill="#e8613f"><rect x="466" y="294" width="66" height="10"/><rect x="536" y="282" width="52" height="10"/></g>
    <g fill="#c77d3d"><rect x="800" y="236" width="8" height="96"/><circle cx="804" cy="236" r="6"/></g>
    <g stroke="#e9dcbe" stroke-width="6" stroke-linecap="round"><path d="M804 236 L804 186"/><path d="M804 236 L846 260"/><path d="M804 236 L762 260"/></g>
    <g fill="#2f8a47"><circle cx="330" cy="316" r="16"/><circle cx="366" cy="324" r="12"/><circle cx="740" cy="320" r="14"/><circle cx="916" cy="326" r="12"/><circle cx="260" cy="326" r="11"/><circle cx="410" cy="320" r="10"/></g>
    <g fill="#5aa84a"><circle cx="322" cy="308" r="10"/><circle cx="736" cy="312" r="9"/></g>
    <ellipse cx="1090" cy="360" rx="42" ry="12" fill="#6a5a86"/><path d="M1050 360 Q1090 392 1130 360Z" fill="#53457a"/>
    <ellipse cx="150" cy="420" rx="30" ry="9" fill="#6a5a86"/>
  </g>
  <g transform="translate(980,150) rotate(-6)">
    <path d="M-60 12 L60 12 L80 0 L60 -4 L-60 -4Z" fill="#f1e5c6" stroke="#b9a36e" stroke-width="2"/>
    <rect x="-52" y="-18" width="104" height="14" fill="#2aa6b4"/><rect x="-6" y="-60" width="4" height="44" fill="#4a4a55"/><path d="M-2 -60 L38 -34 L-2 -22Z" fill="#ff7b4a"/>
    <circle cx="-64" cy="2" r="8" fill="#c77d3d"/>
  </g>
</svg>`;

function fmtTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
