// In-frame HUD. Deliberately not React: it is a thin DOM adapter updated once per rendered frame with
// change detection, so HUD work never waits on (or triggers) React reconciliation.
import { TICK_RATE, UTILITY } from '../content/rules';
import { WEAPONS, isWeaponId } from '../content/weapons';
import type { Settings } from '../client/settings';
import type { MapData } from '../map/build';
import type { OwnState, ViewState, WorldSnap } from '../protocol/types';

export interface HudInput {
  own: OwnState;
  view: ViewState | null;
  world: WorldSnap;
  tick: number;
  settings: Settings;
  spread: number;
  pxPerRad: number;
  yaw: number;
  callout: string;
  names: { x: number; y: number; text: string }[];
  veil: number;
  fps: string;
  bigMap: boolean;
  practice: boolean;
}

const el = (cls: string, parent: HTMLElement, tag = 'div'): HTMLElement => {
  const e = document.createElement(tag);
  e.className = cls;
  parent.appendChild(e);
  return e;
};

const SIDE_NAME = { atk: 'INTRUSION', def: 'CUSTODIAN' } as const;

interface Wedge {
  x: number;
  z: number;
  a: number;
  d: number;
  t: number;
}

export class Hud {
  private root: HTMLElement;
  private pipsL: HTMLElement;
  private pipsR: HTMLElement;
  private scoreL: HTMLElement;
  private scoreR: HTMLElement;
  private clock: HTMLElement;
  private clockT: HTMLElement;
  private clockL: HTMLElement;
  private spikeBar: HTMLElement;
  private mapCanvas: HTMLCanvasElement;
  private bigCanvas: HTMLCanvasElement;
  private bigMap: HTMLElement;
  private mapBase: HTMLCanvasElement;
  private callout: HTMLElement;
  private money: HTMLElement;
  private feed: HTMLElement;
  private radioEl: HTMLElement;
  private hp: HTMLElement;
  private hpN: HTMLElement;
  private hpBar: HTMLElement;
  private arN: HTMLElement;
  private arBar: HTMLElement;
  private tags: HTMLElement;
  private ammo: HTMLElement;
  private wname: HTMLElement;
  private slots: HTMLElement;
  private prompt: HTMLElement;
  private promptText: HTMLElement;
  private progress: HTMLElement;
  private progressBar: HTMLElement;
  private bannerEl: HTMLElement;
  private bannerBig: HTMLElement;
  private bannerSub: HTMLElement;
  private cross: HTMLElement;
  private crossParts: HTMLElement[] = [];
  private hit: HTMLElement;
  private dmg: HTMLElement;
  private spec: HTMLElement;
  private caps: HTMLElement;
  private flashEl: HTMLElement;
  private veilEl: HTMLElement;
  private hurtEl: HTMLElement;
  private scopeEl: HTMLElement;
  private nameWrap: HTMLElement;
  private nameEls: HTMLElement[] = [];
  private fps: HTMLElement;
  private cache = new Map<string, string>();
  private bannerUntil = 0;
  private hitT = 0;
  private hurtT = 0;
  private flashT = 0;
  private flashDur = 1;
  private flashAmt = 0;
  private moneyT = 0;
  private moneyNote = '';
  private dmgMarks: { el: HTMLElement; ang: number; t: number }[] = [];
  private wedges: Wedge[] = [];
  private now = 0;
  private mapFrame = 0;

  constructor(
    parent: HTMLElement,
    private map: MapData,
  ) {
    const r = (this.root = parent);
    r.innerHTML = '';
    const top = el('h-top', r);
    this.pipsL = el('h-pips', top);
    this.scoreL = el('h-score', top);
    this.clock = el('h-clock', top);
    this.clockT = el('t', this.clock);
    this.clockL = el('l', this.clock);
    const sb = el('h-spikebar', this.clock);
    this.spikeBar = el('', sb, 'i');
    this.scoreR = el('h-score', top);
    this.pipsR = el('h-pips', top);
    const mapBox = el('h-map', r);
    this.mapCanvas = document.createElement('canvas');
    this.mapCanvas.width = this.mapCanvas.height = 240;
    mapBox.appendChild(this.mapCanvas);
    this.callout = el('h-callout', r);
    this.money = el('h-money', r);
    this.feed = el('h-feed', r);
    this.radioEl = el('h-radio', r);
    const vit = el('h-vitals', r);
    const hpBox = el('', vit);
    this.tags = el('h-tags', hpBox);
    this.hp = el('h-stat hp', hpBox);
    this.hpN = el('n', this.hp);
    this.hpBar = el('', el('bar', this.hp), 'i');
    el('l', this.hp).textContent = 'HEALTH';
    const ar = el('h-stat armor', vit);
    this.arN = el('n', ar);
    this.arBar = el('', el('bar', ar), 'i');
    el('l', ar).textContent = 'ARMOR';
    const wp = el('h-weapon', r);
    this.slots = el('h-slots', wp);
    this.ammo = el('h-ammo', wp);
    this.wname = el('h-wname', wp);
    this.prompt = el('h-prompt', r);
    this.promptText = el('', this.prompt);
    this.progress = el('h-progress', this.prompt);
    this.progressBar = el('', this.progress, 'i');
    this.bannerEl = el('h-banner', r);
    this.bannerBig = el('big', this.bannerEl);
    this.bannerSub = el('sub', this.bannerEl);
    this.nameWrap = el('h-tagsw', r);
    this.veilEl = el('h-over h-veil', r);
    this.scopeEl = el('h-over h-scope', r);
    this.cross = el('h-cross', r);
    for (let i = 0; i < 5; i++) this.crossParts.push(el('', this.cross, 'i'));
    this.hit = el('h-hit', r);
    this.dmg = el('h-dmg', r);
    this.hurtEl = el('h-over h-hurt', r);
    this.spec = el('h-spec', r);
    this.caps = el('h-caps', r);
    this.fps = el('h-fps', r);
    this.bigMap = el('h-bigmap', r);
    this.bigCanvas = document.createElement('canvas');
    this.bigCanvas.width = this.bigCanvas.height = 800;
    this.bigMap.appendChild(this.bigCanvas);
    this.flashEl = el('h-over h-flash', r);
    this.mapBase = this.renderMapBase(800);
  }

  setVisible(v: boolean): void {
    this.root.classList.toggle('on', v);
  }

  private set(key: string, e: HTMLElement, text: string): void {
    if (this.cache.get(key) === text) return;
    this.cache.set(key, text);
    e.textContent = text;
  }
  private setHtml(key: string, e: HTMLElement, html: string): void {
    if (this.cache.get(key) === html) return;
    this.cache.set(key, html);
    e.innerHTML = html;
  }
  private style(key: string, e: HTMLElement, prop: string, value: string): void {
    if (this.cache.get(key) === value) return;
    this.cache.set(key, value);
    e.style.setProperty(prop, value);
  }

  // ------------------------------------------------------------------ static tactical map
  private renderMapBase(size: number): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d')!;
    const m = this.map;
    const s = size / m.sizeX;
    ctx.fillStyle = '#0b0d11';
    ctx.fillRect(0, 0, size, size);
    const themeColor: Record<string, string> = {
      yard: '#3b4048',
      dock: '#3f444c',
      hall: '#3a3542',
      lab: '#33443c',
      atrium: '#46413a',
      corridor: '#3a3d44',
      mid: '#34424a',
      service: '#3d3731',
      glasshall: '#36444a',
    };
    for (let z = 0; z < m.sizeZ; z++)
      for (let x = 0; x < m.sizeX; x++) {
        const i = z * m.sizeX + x;
        if (!m.open[i]) continue;
        const room = m.rooms[m.roomAt[i]];
        ctx.fillStyle = themeColor[room.theme] ?? '#3a3d44';
        if (m.floor[i] > 1) ctx.fillStyle = '#4a5560';
        ctx.fillRect(x * s, (m.sizeZ - 1 - z) * s, s + 0.6, s + 0.6);
      }
    // props
    for (const b of m.props) {
      if (b.style === 'barrier' || b.style === 'foliage' || b.y1 - b.y0 < 0.5 || b.style === 'stair') continue;
      ctx.fillStyle = b.style === 'glass' ? '#7fd4e6' : b.style === 'gantry' ? 'rgba(120,130,145,0.55)' : b.style === 'planter' ? '#3f7a45' : '#191c22';
      ctx.fillRect(b.x0 * s, (m.sizeZ - b.z1) * s, (b.x1 - b.x0) * s, (b.z1 - b.z0) * s);
    }
    for (const b of m.props) {
      if (b.style !== 'stair') continue;
      ctx.fillStyle = 'rgba(255,255,255,0.09)';
      ctx.fillRect(b.x0 * s, (m.sizeZ - b.z1) * s, (b.x1 - b.x0) * s - 0.5, (b.z1 - b.z0) * s - 0.8);
    }
    // vault zones
    for (const site of [m.sites.A, m.sites.B]) {
      const z = site.zone;
      ctx.fillStyle = 'rgba(255,79,180,0.16)';
      ctx.strokeStyle = 'rgba(255,79,180,0.9)';
      ctx.lineWidth = Math.max(1, size / 400);
      ctx.setLineDash([size / 100, size / 160]);
      ctx.fillRect(z.x0 * s, (m.sizeZ - z.z1) * s, (z.x1 - z.x0) * s, (z.z1 - z.z0) * s);
      ctx.strokeRect(z.x0 * s, (m.sizeZ - z.z1) * s, (z.x1 - z.x0) * s, (z.z1 - z.z0) * s);
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,120,200,0.95)';
      ctx.font = `700 ${size / 11}px Bahnschrift, Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(site.id, site.center.x * s, (m.sizeZ - site.center.z) * s);
    }
    return c;
  }

  private drawMap(canvas: HTMLCanvasElement, i: HudInput, labels: boolean): void {
    const ctx = canvas.getContext('2d')!;
    const size = canvas.width;
    const m = this.map;
    const s = size / m.sizeX;
    const X = (x: number): number => x * s;
    const Z = (z: number): number => (m.sizeZ - z) * s;
    ctx.clearRect(0, 0, size, size);
    ctx.globalAlpha = 0.92;
    ctx.drawImage(this.mapBase, 0, 0, size, size);
    ctx.globalAlpha = 1;
    const w = i.world;
    if (labels) {
      ctx.font = `${size / 52}px Bahnschrift, Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(230,235,240,0.72)';
      const seen = new Set<string>();
      for (const room of m.rooms) {
        if (seen.has(room.name) || (room.x1 - room.x0) * (room.z1 - room.z0) < 9) continue;
        seen.add(room.name);
        ctx.fillText(room.name.toUpperCase(), X((room.x0 + room.x1) / 2), Z((room.z0 + room.z1) / 2));
      }
    }
    // veils and fires (public, visible utility)
    for (const v of w.veils) {
      ctx.fillStyle = 'rgba(200,205,212,0.6)';
      ctx.beginPath();
      ctx.arc(X(v.x), Z(v.z), v.r * s, 0, 7);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,140,30,0.75)';
    for (const f of w.fires) for (let c = 0; c < f.cells.length; c += 3) ctx.fillRect(X(f.cells[c] - 0.5), Z(f.cells[c + 2] + 0.5), s, s);
    // pulse wedges (coarse legal reveal)
    for (const wd of this.wedges) {
      const age = this.now - wd.t;
      if (age > 3.5) continue;
      ctx.fillStyle = `rgba(60,235,255,${0.45 * (1 - age / 3.5)})`;
      const a = wd.a * (Math.PI / 4);
      const r0 = (wd.d === 0 ? 0 : 6) * s;
      const r1 = (wd.d === 0 ? 6 : 13) * s;
      // canvas angle: 0 = +x, clockwise; world sector a is measured from +z toward +x
      const ca = -Math.PI / 2 + a;
      ctx.beginPath();
      ctx.arc(X(wd.x), Z(wd.z), r1, ca - Math.PI / 8, ca + Math.PI / 8);
      ctx.arc(X(wd.x), Z(wd.z), r0, ca + Math.PI / 8, ca - Math.PI / 8, true);
      ctx.closePath();
      ctx.fill();
    }
    // spike
    const sp = w.spike;
    if (sp.x !== undefined && sp.z !== undefined) {
      ctx.fillStyle = '#ff4fb4';
      ctx.save();
      ctx.translate(X(sp.x), Z(sp.z));
      ctx.rotate(Math.PI / 4);
      const k = size / 60;
      ctx.fillRect(-k / 2, -k / 2, k, k);
      ctx.restore();
    }
    const meTeam = i.own.team;
    const viewId = i.view ? i.view.id : -1;
    const dot = (x: number, z: number, yaw: number, color: string, self: boolean): void => {
      ctx.save();
      ctx.translate(X(x), Z(z));
      ctx.rotate(yaw);
      ctx.fillStyle = color;
      const r = size / (self ? 62 : 80);
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.9);
      ctx.lineTo(r, r);
      ctx.lineTo(-r, r);
      ctx.closePath();
      ctx.fill();
      if (self) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = size / 300;
        ctx.stroke();
      }
      ctx.restore();
    };
    for (const p of w.players) {
      const ro = w.roster[p.id];
      if (!ro || ro.team !== meTeam || p.id === viewId) continue;
      dot(p.x, p.z, p.yaw, ro.hasSpike ? '#ff8fd0' : '#5fd4ff', false);
    }
    ctx.fillStyle = '#ff5a48';
    for (const e of w.spotted) {
      ctx.beginPath();
      ctx.arc(X(e.x), Z(e.z), size / 95, 0, 7);
      ctx.fill();
    }
    if (i.view) dot(i.view.move.x, i.view.move.z, i.yaw, '#ffffff', true);
  }

  // ------------------------------------------------------------------ events
  banner(big: string, sub: string, cls: string, seconds: number): void {
    this.bannerBig.textContent = big;
    this.bannerSub.textContent = sub;
    this.bannerEl.className = 'h-banner on ' + cls;
    this.bannerUntil = this.now + seconds;
  }

  kill(killer: string, victim: string, weapon: string, head: boolean, wall: boolean, killerAlly: boolean, victimAlly: boolean, mine: boolean): void {
    const d = el('h-kill' + (mine ? ' mine' : ''), this.feed);
    const wn = isWeaponId(weapon) ? WEAPONS[weapon].name : weapon in UTILITY ? UTILITY[weapon as keyof typeof UTILITY].name : weapon;
    d.innerHTML = `<span class="${killerAlly ? 'ally' : 'enemy'}">${esc(killer)}</span><span class="w">${esc(wn)}${wall ? ' &#9645;' : ''}</span>${head ? '<span class="hs">&#9678;</span>' : ''}<span class="${victimAlly ? 'ally' : 'enemy'}">${esc(victim)}</span>`;
    window.setTimeout(() => d.remove(), 6500);
    while (this.feed.children.length > 6) this.feed.firstElementChild!.remove();
  }

  radio(name: string, text: string, sys: boolean): void {
    const d = el(sys ? 'sys' : '', this.radioEl);
    d.innerHTML = sys ? esc(text) : `<b>${esc(name)}</b>  ${esc(text)}`;
    window.setTimeout(() => d.remove(), 7500);
    while (this.radioEl.children.length > 6) this.radioEl.firstElementChild!.remove();
  }

  caption(text: string): void {
    const d = el('', this.caps);
    d.textContent = '[' + text + ']';
    window.setTimeout(() => d.remove(), 2600);
    while (this.caps.children.length > 3) this.caps.firstElementChild!.remove();
  }

  hitmarker(kill: boolean): void {
    this.hitT = kill ? 0.45 : 0.2;
    this.hit.className = 'h-hit' + (kill ? ' kill' : '');
  }

  hurt(relAngle: number): void {
    this.hurtT = 0.5;
    const e = el('', this.dmg, 'i');
    this.dmgMarks.push({ el: e, ang: relAngle, t: 1.1 });
    e.style.transform = `rotate(${relAngle}rad)`;
  }

  flash(amount: number, duration: number): void {
    this.flashT = duration;
    this.flashDur = duration;
    this.flashAmt = amount;
  }

  moneyNotice(amount: number, reason: string): void {
    this.moneyT = 4;
    this.moneyNote = `${amount >= 0 ? '+' : ''}$${amount} ${reason}`;
  }

  pulseWedges(x: number, z: number, wedges: { a: number; d: number }[]): void {
    for (const w of wedges) this.wedges.push({ x, z, a: w.a, d: w.d, t: this.now });
    if (this.wedges.length > 40) this.wedges.splice(0, this.wedges.length - 40);
  }

  reset(): void {
    this.feed.innerHTML = '';
    this.radioEl.innerHTML = '';
    this.caps.innerHTML = '';
    this.wedges.length = 0;
    this.flashT = 0;
    this.hurtT = 0;
    for (const d of this.dmgMarks) d.el.remove();
    this.dmgMarks.length = 0;
    this.bannerEl.className = 'h-banner';
    this.cache.clear();
  }

  // ------------------------------------------------------------------ per-frame update
  update(i: HudInput, dt: number): void {
    this.now += dt;
    const w = i.world;
    const own = i.own;
    const v = i.view;
    const myTeam = own.team;
    const enemyTeam = 1 - myTeam;
    // --- score, clock
    this.set('sl', this.scoreL, String(w.score[myTeam]));
    this.set('sr', this.scoreR, String(w.score[enemyTeam]));
    this.style('slc', this.scoreL, 'color', `var(--${w.sides[myTeam]})`);
    this.style('src', this.scoreR, 'color', `var(--${w.sides[enemyTeam]})`);
    const left = w.phaseEnd < 0 ? 0 : Math.max(0, (w.phaseEnd - i.tick) / TICK_RATE);
    let label = '';
    let cls = 'h-clock';
    let text = fmt(left);
    if (w.phase === 'buy') label = 'BUY PHASE';
    else if (w.phase === 'warmup') label = 'STARTING';
    else if (w.phase === 'live') {
      label = `ROUND ${w.round}`;
      if (left < 15) cls += ' low';
    } else if (w.phase === 'armed') {
      label = `ARMED ${w.spike.site ?? ''}`;
      cls += ' armed';
      if (left < 10) cls += ' urgent';
      text = left.toFixed(left < 10 ? 1 : 0);
      const total = w.spike.armedTick !== undefined ? (w.phaseEnd - w.spike.armedTick) / TICK_RATE : 35;
      this.style('sbw', this.spikeBar, 'width', `${Math.max(0, Math.min(100, (left / total) * 100)).toFixed(1)}%`);
    } else if (w.phase === 'roundEnd') {
      label = 'ROUND OVER';
      text = '';
    } else {
      label = 'MATCH OVER';
      text = '';
    }
    this.set('ct', this.clockT, text);
    this.set('cl', this.clockL, label);
    if (this.cache.get('cc') !== cls) {
      this.cache.set('cc', cls);
      this.clock.className = cls;
    }
    // --- alive pips
    let pl = '';
    let pr = '';
    for (const ro of w.roster) {
      const side = w.sides[ro.team];
      const h = `<div class="h-pip${ro.alive ? '' : ' dead'}${ro.id === own.id ? ' me' : ''}" style="color:var(--${side})">${ro.alive ? esc(ro.name[0]) : '&#10005;'}</div>`;
      if (ro.team === myTeam) pl += h;
      else pr += h;
    }
    this.setHtml('pl', this.pipsL, pl);
    this.setHtml('pr', this.pipsR, pr);
    // --- callout, money
    this.set('co', this.callout, i.callout || '—');
    if (this.moneyT > 0) this.moneyT -= dt;
    const showMoney = w.phase === 'buy' || w.phase === 'warmup' || this.moneyT > 0 || i.practice;
    this.setHtml('mo', this.money, `$${own.money.toLocaleString('en-US')}${this.moneyT > 0 ? `<small>${esc(this.moneyNote)}</small>` : ''}`);
    this.style('moo', this.money, 'opacity', showMoney ? '1' : '0');
    // --- vitals and weapon
    if (v) {
      this.set('hp', this.hpN, String(Math.max(0, Math.ceil(v.hp))));
      this.style('hpb', this.hpBar, 'width', `${v.hp}%`);
      if (this.cache.get('hpc') !== String(v.hp <= 30)) {
        this.cache.set('hpc', String(v.hp <= 30));
        this.hp.classList.toggle('low', v.hp <= 30);
      }
      this.set('ar', this.arN, String(v.armor));
      this.style('arb', this.arBar, 'width', `${v.armor}%`);
      let tags = '';
      if (v.helmet) tags += '<div class="h-tag">HELMET</div>';
      if (v.kit) tags += '<div class="h-tag">DISARM KIT</div>';
      if (v.hasSpike) tags += '<div class="h-tag spike">CIPHER SPIKE</div>';
      this.setHtml('tg', this.tags, tags);
      const inst = v.slot === 'primary' ? v.primary : v.slot === 'sidearm' ? v.sidearm : null;
      if (inst) {
        const def = WEAPONS[inst.id];
        this.setHtml('am', this.ammo, `${inst.ammo}<small>/ ${inst.reserve}</small>`);
        this.set('wn', this.wname, v.reloading > 0 ? 'RELOADING' : def.name);
        this.style('aml', this.ammo, 'color', inst.ammo <= def.mag * 0.25 ? 'var(--warn)' : '');
      } else {
        this.setHtml('am', this.ammo, '');
        this.set('wn', this.wname, v.slot === 'util' ? (UTILITY[v.util[v.utilSel]]?.name ?? '') : WEAPONS.tool.name);
        this.style('aml', this.ammo, 'color', '');
      }
      let sl = '';
      if (v.primary) sl += `<div class="h-slot${v.slot === 'primary' ? ' on' : ''}"><b>1</b>${WEAPONS[v.primary.id].name}</div>`;
      if (v.sidearm) sl += `<div class="h-slot${v.slot === 'sidearm' ? ' on' : ''}"><b>2</b>${WEAPONS[v.sidearm.id].name}</div>`;
      sl += `<div class="h-slot${v.slot === 'tool' ? ' on' : ''}"><b>3</b>${WEAPONS.tool.name}</div>`;
      v.util.forEach((u, k) => {
        sl += `<div class="h-slot${v.slot === 'util' && v.utilSel === k ? ' on' : ''}"><b>${4 + k}</b>${UTILITY[u].name}</div>`;
      });
      this.setHtml('sl2', this.slots, sl);
    }
    // --- prompts
    let prompt = '';
    let prog = -1;
    if (v && own.alive) {
      if (v.plant > 0) {
        prompt = 'ARMING CIPHER SPIKE';
        prog = v.plant;
      } else if (v.defuse > 0) {
        prompt = v.kit ? 'DISARMING (KIT)' : 'DISARMING';
        prog = v.defuse;
      } else if (w.phase === 'buy') {
        prompt = own.ready ? 'Ready — waiting for round start' : '<kbd>B</kbd> buy menu &nbsp; <kbd>Enter</kbd> ready up';
      } else if (w.phase === 'live' && v.hasSpike && v.site) prompt = '<kbd>E</kbd> hold to arm the Cipher Spike';
      else if (w.phase === 'armed' && own.side === 'def' && w.spike.x !== undefined && Math.hypot(w.spike.x - v.move.x, w.spike.z! - v.move.z) < 1.9) prompt = '<kbd>E</kbd> hold to disarm';
      else if (v.canPickup) prompt = `<kbd>E</kbd> swap for ${esc(v.canPickup)}`;
      else if (i.practice && w.phase !== 'roundEnd') prompt = '';
    }
    this.setHtml('pr2', this.promptText, prompt);
    this.style('pgd', this.progress, 'display', prog >= 0 ? 'block' : 'none');
    if (prog >= 0) this.progressBar.style.width = `${(prog * 100).toFixed(1)}%`;
    // --- spectating
    const specName = !own.alive && own.spectating >= 0 ? w.roster[own.spectating]?.name : '';
    this.style('spd', this.spec, 'display', !own.alive && w.phase !== 'matchEnd' ? 'block' : 'none');
    this.setHtml('spt', this.spec, specName ? `SPECTATING ${esc(specName.toUpperCase())}<small>click to switch teammate · team information only</small>` : 'TEAM ELIMINATED<small>tactical camera</small>');
    // --- banner timeout
    if (this.bannerUntil && this.now > this.bannerUntil) {
      this.bannerUntil = 0;
      this.bannerEl.classList.remove('on');
    }
    // --- crosshair
    const xh = i.settings.crosshair;
    const scoped = !!v && v.scope > 0;
    const showCross = !!v && !scoped && w.phase !== 'matchEnd' && !(v.slot !== 'util' && activeHasScope(v));
    this.style('xd', this.cross, 'display', showCross ? 'block' : 'none');
    if (showCross) {
      const gap = xh.gap + (xh.dynamic ? i.spread * i.pxPerRad : 0);
      const key = `${gap.toFixed(1)}|${xh.length}|${xh.thickness}|${xh.dot}|${xh.color}|${xh.outline}`;
      if (this.cache.get('xk') !== key) {
        this.cache.set('xk', key);
        this.cross.style.setProperty('--xh', xh.color);
        this.cross.classList.toggle('outline', xh.outline);
        const t = xh.thickness;
        const L = xh.length;
        const [l, r, u, d, c] = this.crossParts;
        l.style.cssText = `left:${-gap - L}px;top:${-t / 2}px;width:${L}px;height:${t}px`;
        r.style.cssText = `left:${gap}px;top:${-t / 2}px;width:${L}px;height:${t}px`;
        u.style.cssText = `left:${-t / 2}px;top:${-gap - L}px;width:${t}px;height:${L}px`;
        d.style.cssText = `left:${-t / 2}px;top:${gap}px;width:${t}px;height:${L}px`;
        c.style.cssText = xh.dot ? `left:${-t / 2}px;top:${-t / 2}px;width:${t}px;height:${t}px` : 'display:none';
      }
    }
    this.style('sco', this.scopeEl, 'opacity', scoped ? '1' : '0');
    // --- transient overlays
    if (this.hitT > 0) {
      this.hitT -= dt;
      this.hit.style.opacity = String(Math.max(0, Math.min(1, this.hitT * 6)));
    }
    if (this.hurtT > 0) {
      this.hurtT -= dt;
      this.hurtEl.style.opacity = String(Math.max(0, this.hurtT * 1.6));
    }
    for (let k = this.dmgMarks.length - 1; k >= 0; k--) {
      const d = this.dmgMarks[k];
      d.t -= dt;
      if (d.t <= 0) {
        d.el.remove();
        this.dmgMarks.splice(k, 1);
      } else d.el.style.opacity = String(Math.min(1, d.t * 1.5));
    }
    if (this.flashT > 0) {
      this.flashT -= dt;
      const k = Math.max(0, this.flashT / this.flashDur);
      // hold near-full obscuration, then recover; reduced-flash swaps white for dark at equal opacity
      const o = this.flashAmt * Math.min(1, k * 2.2);
      this.flashEl.style.opacity = String(o);
      const red = i.settings.reduceFlash;
      if (this.cache.get('fr') !== String(red)) {
        this.cache.set('fr', String(red));
        this.flashEl.classList.toggle('reduced', red);
      }
    } else this.style('flo', this.flashEl, 'opacity', '0');
    this.style('vlo', this.veilEl, 'opacity', i.veil.toFixed(2));
    // --- teammate name tags
    for (let k = 0; k < i.names.length; k++) {
      let e = this.nameEls[k];
      if (!e) this.nameEls[k] = e = el('h-name', this.nameWrap);
      const n = i.names[k];
      e.style.display = 'block';
      e.style.left = `${n.x.toFixed(0)}px`;
      e.style.top = `${n.y.toFixed(0)}px`;
      if (e.textContent !== n.text) e.textContent = n.text;
    }
    for (let k = i.names.length; k < this.nameEls.length; k++) this.nameEls[k].style.display = 'none';
    // --- maps (20 Hz is plenty)
    if (++this.mapFrame % 3 === 0) this.drawMap(this.mapCanvas, i, false);
    this.style('bm', this.bigMap, 'display', i.bigMap ? 'block' : 'none');
    if (i.bigMap && this.mapFrame % 3 === 1) this.drawMap(this.bigCanvas, i, true);
    this.set('fps', this.fps, i.fps);
  }
}

function activeHasScope(v: ViewState): boolean {
  const inst = v.slot === 'primary' ? v.primary : v.slot === 'sidearm' ? v.sidearm : null;
  return !!inst && WEAPONS[inst.id].cls === 'sniper' && inst.id === 'longglass';
}

function fmt(sec: number): string {
  const s = Math.ceil(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);
}

export { SIDE_NAME };
