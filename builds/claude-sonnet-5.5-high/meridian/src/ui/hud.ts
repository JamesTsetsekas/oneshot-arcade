import type { Game } from '../sim/game';
import type { GameEvent } from '../core/events';
import type { Settings } from '../core/settings';
import { equipped } from '../sim/combat';
import { AMMO_LABEL, WEAPONS } from '../sim/weapons';
import { TRUST_THRESHOLDS } from '../sim/economy';
import { MapRenderer, gpsRoute } from './minimap';
import type { MapFilters } from './minimap';
import { kmh } from '../sim/vehicle';

const el = (html: string): HTMLElement => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild as HTMLElement; };
const fmtTime = (s: number): string => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** In-world HUD: batched DOM updates driven from the sim state (React is reserved for menus in the brief; this slice uses plain DOM). */
export class Hud {
  root: HTMLElement;
  private objective: HTMLElement;
  private cash: HTMLElement;
  private trust: HTMLElement;
  private beacon: HTMLElement;
  private identState: HTMLElement;
  private hpBar: HTMLElement;
  private arBar: HTMLElement;
  private stBar: HTMLElement;
  private weapon: HTMLElement;
  private vehicle: HTMLElement;
  private cross: HTMLElement;
  private prompt: HTMLElement;
  private subs: HTMLElement;
  private toasts: HTMLElement;
  private vignette: HTMLElement;
  private fade: HTMLElement;
  private district: HTMLElement;
  private mini: HTMLCanvasElement;
  private miniLabel: HTMLElement;
  private radio: HTMLElement;
  private fps: HTMLElement;
  private hint: HTMLElement;
  private bannerHost: HTMLElement;
  private cache = new Map<string, string>();
  private lastDistrict = '';
  private districtT = 0;
  private route: Array<{ x: number; z: number }> | null = null;
  private routeT = 0;
  private lastTarget = '';
  map: MapRenderer;
  filters: MapFilters = { missions: true, shops: true, landmarks: true, police: true };
  waypoint: { x: number; z: number } | null = null;
  showFps = false;
  hintsOn = true;

  constructor(host: HTMLElement, game: Game) {
    this.map = new MapRenderer(game.world);
    this.root = host;
    host.innerHTML = '';
    host.appendChild(el('<div class="vignette abs"></div>'));
    this.objective = host.appendChild(el('<div class="objective panel abs hidden"></div>'));
    const status = host.appendChild(el('<div class="status panel abs"><div class="cash"></div><div class="trust"></div><div class="alert"><div class="beacon"><i></i><i></i><i></i><i></i><i></i></div><div class="state"></div></div></div>'));
    this.cash = status.querySelector('.cash')!;
    this.trust = status.querySelector('.trust')!;
    this.beacon = status.querySelector('.beacon')!;
    this.identState = status.querySelector('.state')!;
    const bl = host.appendChild(el('<div class="bl abs"><div class="minimap-wrap"><canvas width="420" height="420"></canvas><div class="minimap-label"></div></div><div class="bars"><div class="bar hp"><div></div><span>HEALTH</span></div><div class="bar ar"><div></div><span>ARMOR</span></div><div class="bar st"><div></div></div></div></div>'));
    this.mini = bl.querySelector('canvas')!;
    this.miniLabel = bl.querySelector('.minimap-label')!;
    this.hpBar = bl.querySelector('.bar.hp')!;
    this.arBar = bl.querySelector('.bar.ar')!;
    this.stBar = bl.querySelector('.bar.st')!;
    const br = host.appendChild(el('<div class="br abs"><div class="weapon panel"></div><div class="vehicle panel hidden"></div></div>'));
    this.weapon = br.querySelector('.weapon')!;
    this.vehicle = br.querySelector('.vehicle')!;
    this.cross = host.appendChild(el('<div class="crosshair abs"></div>'));
    this.prompt = host.appendChild(el('<div class="prompt abs hidden"></div>'));
    this.subs = host.appendChild(el('<div class="subs abs"></div>'));
    this.toasts = host.appendChild(el('<div class="toasts abs"></div>'));
    this.bannerHost = host.appendChild(el('<div class="abs" style="inset:0"></div>'));
    this.district = host.appendChild(el('<div class="district abs"></div>'));
    this.radio = host.appendChild(el('<div class="radio abs"></div>'));
    this.hint = host.appendChild(el('<div class="hint panel abs"></div>'));
    this.fps = host.appendChild(el('<div class="fps abs hidden"></div>'));
    this.fade = host.appendChild(el('<div class="fade abs"></div>'));
    this.vignette = host.querySelector('.vignette')!;
  }

  private set(key: string, node: HTMLElement, html: string): void {
    if (this.cache.get(key) === html) return;
    this.cache.set(key, html);
    node.innerHTML = html;
  }

  private setText(key: string, node: HTMLElement, text: string): void {
    if (this.cache.get(key) === text) return;
    this.cache.set(key, text);
    node.textContent = text;
  }

  event(e: GameEvent, settings: Settings): void {
    switch (e.type) {
      case 'toast': this.pushToast(e.text, e.tone ?? 'info'); break;
      case 'subtitle': if (settings.subtitles) this.pushSub(e.speaker, e.text, e.ms); break;
      case 'banner': this.pushBanner(e.title, e.sub); break;
      case 'fade': this.fade.style.transitionDuration = e.ms + 'ms'; this.fade.style.opacity = '1'; setTimeout(() => { this.fade.style.opacity = '0'; }, e.ms + e.hold); break;
      case 'saved': this.pushToast('Game saved', 'good'); break;
      default: break;
    }
  }

  private pushToast(text: string, tone: string): void {
    const t = el(`<div class="toast ${tone}"></div>`);
    t.textContent = text;
    this.toasts.appendChild(t);
    while (this.toasts.children.length > 4) this.toasts.firstElementChild?.remove();
    setTimeout(() => t.remove(), 3600);
  }

  private pushSub(who: string, text: string, ms: number): void {
    const d = el('<div><b></b><span></span></div>');
    d.querySelector('b')!.textContent = who + ':';
    d.querySelector('span')!.textContent = text;
    this.subs.appendChild(d);
    while (this.subs.children.length > 3) this.subs.firstElementChild?.remove();
    setTimeout(() => d.remove(), ms + 400);
  }

  private pushBanner(title: string, sub: string): void {
    const b = el('<div class="banner abs"><div class="bt"></div><div class="bs"></div></div>');
    b.querySelector('.bt')!.textContent = title;
    b.querySelector('.bs')!.textContent = sub;
    this.bannerHost.appendChild(b);
    setTimeout(() => b.remove(), 4600);
  }

  update(g: Game, settings: Settings, dt: number, fps: number): void {
    const P = g.player;
    const h = P.human;
    this.root.classList.toggle('cb-deuteranopia', settings.colorblind === 'deuteranopia');
    // objective -----------------------------------------------------------------------------------
    const mo = g.missionObjective;
    if (g.missions.running && mo.text) {
      this.objective.classList.remove('hidden');
      const def = g.missions.def!;
      const opt = def.optional.map((o) => `<div>${o.text}</div>`).join('');
      this.set('obj', this.objective, `<div class="t">${def.title}</div><div class="o">${mo.text}</div>${mo.timer !== null ? `<div class="tm">${fmtTime(mo.timer)}</div>` : ''}${opt ? `<div class="opt">${opt}</div>` : ''}`);
    } else if (!this.objective.classList.contains('hidden')) { this.objective.classList.add('hidden'); this.cache.delete('obj'); }
    // status ----------------------------------------------------------------------------------------
    this.setText('cash', this.cash, '$' + P.cash.toLocaleString());
    const lvl = P.trust;
    const next = TRUST_THRESHOLDS[Math.min(5, lvl + 1)];
    this.setText('trust', this.trust, `Trust ${lvl}/5${lvl < 5 ? ' · ' + (Math.floor(P.trustXp * 10) / 10) + '/' + next + ' xp' : ''}`);
    const tier = g.police.tier;
    const key = 'beacon' + tier;
    if (this.cache.get(key) !== '1') {
      this.cache.set(key, '1');
      this.beacon.querySelectorAll('i').forEach((i, idx) => i.classList.toggle('on', idx < tier));
      this.beacon.classList.toggle('flash', tier > 0);
    }
    const ident = g.police.ident;
    this.setText('ident', this.identState, tier === 0 && ident === 'Unnoticed' ? '' : ident);
    this.identState.className = 'state s-' + ident;
    // health ---------------------------------------------------------------------------------------------
    const hp = (this.hpBar.firstElementChild as HTMLElement);
    hp.style.width = Math.max(0, h.hp) + '%';
    this.hpBar.classList.toggle('low', h.hp < 30);
    (this.arBar.firstElementChild as HTMLElement).style.width = Math.max(0, (h.armor / 50) * 100) + '%';
    (this.stBar.firstElementChild as HTMLElement).style.width = (P.stamina / 8) * 100 + '%';
    (this.stBar as HTMLElement).style.opacity = P.stamina < 7.9 ? '1' : '0.25';
    this.vignette.style.opacity = String(Math.min(1, g.damageFlash * 0.9 + (h.hp < 25 ? 0.25 : 0)));
    // weapon / vehicle ------------------------------------------------------------------------------------
    const pv = g.playerVehicle();
    const w = equipped(g);
    if (pv) {
      this.vehicle.classList.remove('hidden');
      this.weapon.classList.add('hidden');
      const cond = Math.max(0, pv.health / pv.def.health) * 100;
      const gear = pv.gear < 0 ? 'R' : String(pv.gear);
      this.set('veh', this.vehicle, `<div class="nm">${pv.def.name}</div><div class="sp">${Math.round(kmh(pv))}<small>KM/H</small></div><div class="gear">GEAR ${gear}${cond < 35 ? ' &nbsp; <b style="color:#ff8a5c">DAMAGED</b>' : ''}${pv.tireDamage > 0.3 ? ' &nbsp; <b style="color:#ffc857">TYRES</b>' : ''}${pv.stalled ? ' &nbsp; <b style="color:#ff6b5e">STALLED</b>' : ''}</div><div class="cond"><div style="width:${cond}%"></div></div>`);
    } else {
      this.vehicle.classList.add('hidden');
      this.weapon.classList.remove('hidden');
      const gid = P.inv.gadgets[g.gadgetIdx];
      const gad = gid ? `${WEAPONS[gid].name.split(' ')[0]} x${P.inv.gadgetCount[gid] ?? 0}` : '';
      if (!w) this.set('wpn', this.weapon, `<div class="w">Holstered</div><div class="a">-</div><div class="g">${gad} &nbsp; Medkit x${P.inv.medkits}</div>`);
      else if (w.slot === 'melee') this.set('wpn', this.weapon, `<div class="w">${w.name}<span class="cls n">NON-LETHAL</span></div><div class="a">-</div><div class="g">${gad} &nbsp; Medkit x${P.inv.medkits}</div>`);
      else this.set('wpn', this.weapon, `<div class="w">${w.name}<span class="cls ${w.lethal ? 'l' : 'n'}">${w.lethal ? 'LETHAL' : 'NON-LETHAL'}</span></div><div class="a">${P.reloadT > 0 ? '...' : P.inv.mags[w.id] ?? 0}<small> / ${P.inv.ammo[w.ammo] ?? 0} ${AMMO_LABEL[w.ammo]}</small></div><div class="g">${gad} &nbsp; Medkit x${P.inv.medkits}</div>`);
    }
    const aimOn = P.aiming && !pv;
    this.cross.classList.toggle('on', aimOn);
    this.cross.classList.toggle('enemy', aimOn && P.aimPoint.hitKind === 'human');
    // prompt ------------------------------------------------------------------------------------------------
    if (g.prompt) {
      this.prompt.classList.remove('hidden');
      this.set('prompt', this.prompt, `<b>${g.prompt.key}</b>${g.prompt.text.replace(/^[EF] - /, '')}`);
    } else this.prompt.classList.add('hidden');
    // district banner -----------------------------------------------------------------------------------
    const d = g.world.districtAt(h.x, h.z);
    if (d !== this.lastDistrict) {
      this.lastDistrict = d;
      this.district.textContent = d === 'Outskirts' ? '' : d;
      this.district.classList.add('on');
      this.districtT = 2.6;
    }
    this.districtT -= dt;
    if (this.districtT <= 0) this.district.classList.remove('on');
    this.miniLabel.textContent = d.toUpperCase();
    // minimap -----------------------------------------------------------------------------------------
    this.routeT -= dt;
    const mk = g.currentMarker();
    const target = this.waypoint ?? (mk ? { x: mk.x, z: mk.z } : null);
    const tk = target ? Math.round(target.x) + ',' + Math.round(target.z) : '';
    if (!target) this.route = null;
    else if (this.routeT <= 0 || tk !== this.lastTarget) { this.route = gpsRoute(g, target); this.routeT = 0.6; this.lastTarget = tk; }
    this.map.drawMini(this.mini, g, pv ? 260 : 200, settings.minimapRotate, this.route, this.filters);
    // radio / fps / hints -----------------------------------------------------------------------------
    this.fps.classList.toggle('hidden', !this.showFps);
    if (this.showFps) this.fps.textContent = Math.round(fps) + ' fps';
    this.hint.classList.toggle('hidden', !this.hintsOn);
    if (this.hintsOn) {
      this.set('hint', this.hint, pv
        ? '<kbd>W</kbd><kbd>S</kbd> throttle/brake &nbsp; <kbd>A</kbd><kbd>D</kbd> steer &nbsp; <kbd>Space</kbd> handbrake<br><kbd>H</kbd> horn &nbsp; <kbd>C</kbd> camera &nbsp; <kbd>X</kbd> look back &nbsp; <kbd>F</kbd> exit &nbsp; <kbd>T</kbd> radio<br><kbd>M</kbd> map &nbsp; <kbd>P</kbd> phone &nbsp; <kbd>Esc</kbd> pause'
        : '<kbd>WASD</kbd> move &nbsp; <kbd>Shift</kbd> sprint &nbsp; <kbd>Ctrl</kbd> crouch &nbsp; <kbd>Space</kbd> jump/vault<br><kbd>RMB</kbd> aim &nbsp; <kbd>LMB</kbd> fire &nbsp; <kbd>R</kbd> reload &nbsp; <kbd>F</kbd> melee &nbsp; <kbd>G</kbd> gadget &nbsp; <kbd>Z</kbd> medkit<br><kbd>1-5</kbd> weapons &nbsp; <kbd>H</kbd> holster &nbsp; <kbd>E</kbd> interact &nbsp; <kbd>M</kbd> map &nbsp; <kbd>P</kbd> phone');
    }
  }

  setRadio(name: string): void { this.radio.textContent = name ? '♪ ' + name : ''; }
}
