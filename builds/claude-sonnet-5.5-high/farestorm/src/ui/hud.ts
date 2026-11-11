import { ARCHETYPES, TIER_INFO, DISTRICT_NAMES } from '../sim/data';
import { RULES } from '../sim/rules';
import type { Breakdown, GameEvent, Sim } from '../sim/sim';
import type { GameView } from '../render/view';
import { MiniMap } from './minimap';
import type { Settings } from '../persist';

const $ = <T extends HTMLElement>(root: HTMLElement, sel: string) => root.querySelector(sel) as T;

const GRADE_TEXT: Record<string, { t: string; c: string }> = {
  blazing: { t: 'BLAZING!', c: '#ffd34d' },
  fast: { t: 'FAST', c: '#2ee6a0' },
  close: { t: 'CLOSE', c: '#4fc3ff' },
  late: { t: 'LATE', c: '#ff8a5b' },
  failed: { t: 'MISSED', c: '#ff5e57' },
};

export class Hud {
  private root: HTMLElement;
  private el: Record<string, HTMLElement> = {};
  private mini: MiniMap;
  private miniCtx: CanvasRenderingContext2D;
  private bigCtx: CanvasRenderingContext2D;
  private fx: HTMLCanvasElement;
  private fxCtx: CanvasRenderingContext2D;
  private shownScore = 0;
  private callouts: { el: HTMLElement; t: number }[] = [];
  private deliverT = 0;
  private subT = 0;
  private hintT = 0;
  private flashT = 0;
  private centerT = 0;
  private controlsT = 16;
  private mapOpen = false;
  private edge: HTMLElement[] = [];
  private lastClockClass = '';
  private lastTrip = -1;
  private reduced = false;
  private photo = false;
  private colorblind = false;
  private subtitles = true;

  constructor(host: HTMLElement, private sim: Sim, private view: GameView) {
    this.root = document.createElement('div');
    this.root.id = 'hud';
    this.root.innerHTML = `
      <canvas class="fx"></canvas>
      <div class="flash"></div>
      <div class="corner tl"><div class="score-card"><div class="lab">FARE SCORE</div><div class="score" data-k="score">0</div><div class="tips" data-k="tips"></div></div></div>
      <div class="corner tc">
        <div class="clock" data-k="clock"><div class="clock-num" data-k="clocknum">60</div><div class="lab" data-k="clocklab">SHIFT CLOCK</div></div>
        <div class="trip" data-k="trip">
          <div class="trip-top"><span class="badge" data-k="badge"></span><span class="dest" data-k="dest"></span><span class="dist" data-k="dist"></span></div>
          <div class="patience"><div class="pfill" data-k="pfill"></div><div class="ppar" data-k="ppar"></div></div>
          <div class="trip-sub"><span data-k="who"></span><span data-k="ptime"></span></div>
        </div>
        <div class="hint" data-k="hint"></div>
      </div>
      <div class="corner ml"><div class="pulse" data-k="pulse"><div class="lab">PULSE</div><div class="mult" data-k="mult">×1</div><div class="pbar"><div data-k="pbarf"></div></div><div class="chain" data-k="chain"></div></div><div class="callouts" data-k="callouts"></div></div>
      <div class="corner bl"><canvas class="mini" width="220" height="220"></canvas><div class="minilab" data-k="zone"></div></div>
      <div class="corner br"><div class="speed"><span class="spd" data-k="speed">0</span><span class="unit">km/h</span><span class="spec" data-k="surf"></span></div>
        <div class="tail" data-k="tail"><div class="lab">TAILWIND <kbd>SHIFT</kbd></div><div class="tbar"><div data-k="tbarf"></div></div></div></div>
      <div class="corner mr"><div class="deliver" data-k="deliver"></div></div>
      <div class="edges" data-k="edges"></div>
      <div class="center" data-k="center"></div>
      <div class="sub" data-k="sub"></div>
      <div class="resetbar" data-k="resetbar"><div data-k="resetf"></div><span>HOLD R TO RESET</span></div>
      <div class="controls" data-k="controls"><span><kbd>W</kbd><kbd>S</kbd> gas / brake</span><span><kbd>A</kbd><kbd>D</kbd> steer</span><span><kbd>SPACE</kbd> + steer above 35 km/h = <b>drift</b></span><span><kbd>SHIFT</kbd> tailwind</span><span><kbd>C</kbd> camera</span><span><kbd>X</kbd> look back</span><span><kbd>M</kbd> map</span><span><kbd>ESC</kbd> pause</span></div>
      <div class="bigmap" data-k="bigmap"><canvas></canvas><div class="maphint">M to close</div></div>`;
    host.appendChild(this.root);
    this.root.querySelectorAll<HTMLElement>('[data-k]').forEach((e) => { this.el[e.dataset.k!] = e; });
    this.fx = $(this.root, 'canvas.fx') as HTMLCanvasElement;
    this.fxCtx = this.fx.getContext('2d')!;
    const mc = $(this.root, 'canvas.mini') as HTMLCanvasElement;
    this.miniCtx = mc.getContext('2d')!;
    this.bigCtx = (this.el.bigmap.querySelector('canvas') as HTMLCanvasElement).getContext('2d')!;
    this.mini = new MiniMap(sim.world);
    for (let i = 0; i < 4; i++) {
      const e = document.createElement('div');
      e.className = 'edge';
      e.innerHTML = '<div class="chev"></div><div class="elab"></div>';
      this.el.edges.appendChild(e);
      this.edge.push(e);
    }
    this.el.trip.style.display = 'none';
    if (sim.mode === 'trial') this.el.clocklab.textContent = 'TIME';
  }

  destroy(): void {
    this.root.remove();
  }

  applySettings(s: Settings): void {
    this.reduced = s.reducedMotion;
    this.photo = s.photosensitive;
    this.colorblind = s.colorblind;
    this.subtitles = s.subtitles;
    this.root.style.setProperty('--hud', String(s.hudScale));
    this.root.classList.toggle('cb', s.colorblind);
    this.root.classList.toggle('calm', s.reducedMotion || s.photosensitive);
  }

  toggleMap(): boolean {
    this.mapOpen = !this.mapOpen;
    this.el.bigmap.style.display = this.mapOpen ? 'flex' : 'none';
    return this.mapOpen;
  }
  get mapShown(): boolean {
    return this.mapOpen;
  }

  say(text: string, ms = 1400): void {
    const c = this.el.center;
    c.textContent = text;
    c.classList.remove('pop');
    void c.offsetWidth;
    c.classList.add('pop');
    this.centerT = ms / 1000;
  }

  hint(text: string, secs = 3.2): void {
    this.el.hint.textContent = text;
    this.hintT = secs;
  }

  private addCallout(label: string, points: number, mult: number, cat: string): void {
    const el = document.createElement('div');
    el.className = `callout c-${cat}`;
    el.innerHTML = `<b>${label}</b>${points ? `<i>+${points.toLocaleString()}</i>` : ''}${mult > 1 ? `<em>×${mult}</em>` : ''}`;
    this.el.callouts.prepend(el);
    this.callouts.unshift({ el, t: 1.9 });
    while (this.callouts.length > 4) { const o = this.callouts.pop()!; o.el.remove(); }
  }

  onEvent(e: GameEvent): void {
    switch (e.type) {
      case 'countdown': this.say(String(e.n), 900); break;
      case 'go': this.say('GO!', 900); break;
      case 'style': this.addCallout(e.label, e.points, e.mult, e.category); break;
      case 'bank': if (e.points > 0) this.addCallout('CHAIN BANKED', e.points, 0, 'bank'); break;
      case 'chainLoss': this.addCallout(e.mode === 'break' ? 'CHAIN LOST' : 'PULSE TIER DOWN', 0, 0, 'loss'); this.flash(); break;
      case 'boarded': {
        const a = ARCHETYPES[e.fare.archetype];
        this.say(e.clean ? 'CLEAN STOP!' : 'ON BOARD', 900);
        this.hint(`${a.name}: head to ${e.fare.dest.name}`, 4);
        break;
      }
      case 'delivered': this.showDelivery(e.breakdown, e.fare.dest.name); break;
      case 'fareFailed': this.say('FARE LOST', 1400); break;
      case 'candidates': break;
      case 'bark': if (this.subtitles) this.subtitle(e.who, e.text); break;
      case 'collision': if (e.impact > 4) this.flash(); break;
      case 'boost': if (e.on) this.say('TAILWIND', 700); break;
      case 'tailwindReady': this.hint('Tailwind ready - hold SHIFT', 2.4); break;
      case 'token': this.addCallout(e.kind === 'spark' ? 'CLOCK SPARK +1s' : 'TAILWIND TOKEN', 0, 0, 'token'); break;
      case 'shortcut': this.hint(e.first ? `NEW SHORTCUT: ${e.sc.name} (+${RULES.style.shortcutFirst})` : `Shortcut: ${e.sc.name}`, 3); break;
      case 'timeAdd': break;
      case 'respawn': this.say(e.reason === 'water' ? 'SPLASH! RESPAWN' : 'RESET', 1200); break;
      case 'hint': this.hint(e.text, 4); break;
      default: break;
    }
  }

  private flash(): void {
    if (this.reduced || this.photo) return;
    this.flashT = 0.35;
  }

  private subtitle(who: string, text: string): void {
    this.el.sub.innerHTML = `<b>${who.split(' ')[0]}</b> ${text}`;
    this.subT = 2.6;
  }

  private showDelivery(b: Breakdown, name: string): void {
    const g = GRADE_TEXT[b.grade];
    const rows: string[] = [];
    rows.push(`<div class="r"><span>Fare</span><b>${b.base.toLocaleString()}</b></div>`);
    if (b.timeBonus) rows.push(`<div class="r"><span>Time bonus</span><b>${b.timeBonus.toLocaleString()}</b></div>`);
    if (b.tips) rows.push(`<div class="r"><span>Style tips</span><b>${b.tips.toLocaleString()}</b></div>`);
    if (b.prefBonus) rows.push(`<div class="r"><span>${b.prefLabel}</span><b>${b.prefBonus > 0 ? '+' : ''}${b.prefBonus.toLocaleString()}</b></div>`);
    if (b.accuracy) rows.push(`<div class="r"><span>${b.precise ? 'Precision stop' : 'Accuracy'}</span><b>${b.accuracy}</b></div>`);
    if (b.discovery) rows.push(`<div class="r"><span>Discovery</span><b>${b.discovery}</b></div>`);
    this.el.deliver.innerHTML = `<div class="grade" style="color:${g.c}">${g.t}</div><div class="where">${name}</div>${rows.join('')}<div class="total"><span>TOTAL</span><b>+${b.total.toLocaleString()}</b></div>${b.shiftSeconds ? `<div class="secs">+${b.shiftSeconds}s SHIFT TIME</div>` : ''}`;
    this.el.deliver.classList.remove('show');
    void this.el.deliver.offsetWidth;
    this.el.deliver.classList.add('show');
    this.deliverT = 2.1;
  }

  // ------------------------------------------------------------------ per frame
  update(dt: number, camBack = false): void {
    const sim = this.sim;
    const v = sim.vehicle;
    const e = this.el;
    void camBack;
    // score roll-up
    const target = sim.displayScore;
    this.shownScore += (target - this.shownScore) * Math.min(1, dt * 8);
    if (Math.abs(target - this.shownScore) < 1) this.shownScore = target;
    e.score.textContent = Math.round(this.shownScore).toLocaleString();
    const tips = sim.liveTips;
    e.tips.textContent = tips > 0 ? `+${tips.toLocaleString()} TIPS` : '';
    // clock
    if (sim.mode === 'trial') {
      e.clocknum.textContent = sim.time.toFixed(1);
    } else {
      const c = Math.max(0, sim.clock);
      e.clocknum.textContent = c >= 10 ? String(Math.ceil(c)) : c.toFixed(1);
      const cls = sim.pauseTimer > 0 ? 'paused' : c <= 10 ? 'urgent' : '';
      if (cls !== this.lastClockClass) { e.clock.className = `clock ${cls}`; this.lastClockClass = cls; }
    }
    // trip
    const trip = sim.trip;
    if (trip) {
      e.trip.style.display = '';
      const f = trip.fare;
      const info = TIER_INFO[f.tier];
      if (this.lastTrip !== f.id) {
        this.lastTrip = f.id;
        e.badge.className = `badge ${f.tier}`;
        e.badge.textContent = this.colorblind ? info.label : '';
        e.dest.textContent = f.dest.name;
        e.who.textContent = ARCHETYPES[f.archetype].name;
        e.ppar.style.left = `${(f.par / f.limit) * 100}%`;
      }
      const left = f.limit - trip.time;
      const frac = Math.max(0, left / f.limit);
      const fill = e.pfill;
      fill.style.width = `${frac * 100}%`;
      fill.className = `pfill ${frac < 0.1 ? 'crit' : frac < 0.25 ? 'warn' : ''}`;
      e.ptime.textContent = left > 0 ? `${left.toFixed(1)}s` : `GRACE ${Math.max(0, trip.grace).toFixed(1)}s`;
      const d = Math.hypot(v.x - f.dest.x, v.z - f.dest.z);
      e.dist.textContent = `${Math.round(d)} m`;
    } else {
      e.trip.style.display = 'none';
      this.lastTrip = -1;
    }
    // pulse
    const sc = sim.score;
    const pulse = e.pulse;
    pulse.classList.toggle('on', sc.active);
    e.mult.textContent = `×${sc.mult}`;
    pulse.dataset.tier = String(sc.tier);
    e.pbarf.style.width = `${Math.max(0, (sc.chainTimer / RULES.pulse.decay) * 100)}%`;
    e.chain.textContent = sc.chainPoints > 0 ? `${sc.chainPoints.toLocaleString()} in chain` : '';
    // speed + tailwind
    e.speed.textContent = String(Math.round(sim.speedKmh));
    e.surf.textContent = v.surface === 'asphalt' ? '' : v.surface.toUpperCase();
    e.tbarf.style.width = `${sc.tailwind * 100}%`;
    e.tail.className = `tail ${sc.tailwind >= 0.999 ? 'ready' : sc.tailwind >= 0.12 ? 'usable' : ''} ${v.boosting ? 'active' : ''}`;
    // zone name
    const blk = sim.world.blockAt(v.x, v.z);
    const near = sim.world.nodes[sim.world.nearestNode(v.x, v.z)];
    const dist = blk ? blk.district : near.j >= 5 ? 'harbor' : near.i >= 6 ? 'beach' : near.i <= 1 && near.j >= 2 ? 'steps' : near.j <= 1 ? 'lantern' : 'civic';
    e.zone.textContent = DISTRICT_NAMES[dist];

    // transient timers
    for (let i = this.callouts.length - 1; i >= 0; i--) {
      const c = this.callouts[i];
      c.t -= dt;
      if (c.t < 0.4) c.el.style.opacity = String(Math.max(0, c.t / 0.4));
      if (c.t <= 0) { c.el.remove(); this.callouts.splice(i, 1); }
    }
    if (this.deliverT > 0) { this.deliverT -= dt; if (this.deliverT <= 0) e.deliver.classList.remove('show'); }
    if (this.subT > 0) { this.subT -= dt; if (this.subT <= 0) e.sub.innerHTML = ''; }
    if (this.hintT > 0) { this.hintT -= dt; if (this.hintT <= 0) e.hint.textContent = ''; }
    if (this.centerT > 0) { this.centerT -= dt; if (this.centerT <= 0) e.center.textContent = ''; }
    if (this.controlsT > 0 && sim.phase === 'running') { this.controlsT -= dt; if (this.controlsT <= 0) e.controls.classList.add('gone'); }
    e.resetbar.style.display = sim.resetProgress > 0.02 ? 'flex' : 'none';
    (e.resetf as HTMLElement).style.width = `${sim.resetProgress * 100}%`;
    this.root.style.setProperty('--flash', String(this.flashT > 0 ? this.flashT / 0.35 : 0));
    this.flashT = Math.max(0, this.flashT - dt);

    // contextual coaching: pickup & delivery prompts
    if (!trip && sim.phase === 'running') {
      for (const f of sim.fares.candidates) {
        const d = Math.hypot(v.x - f.pickup.x, v.z - f.pickup.z);
        if (d < 14 && sim.speedKmh > 35 && this.hintT <= 0) { this.hint('Slow below 35 km/h and stop in the ring', 1.5); break; }
      }
    } else if (trip) {
      const d = Math.hypot(v.x - trip.fare.dest.x, v.z - trip.fare.dest.z);
      if (d < 28 && sim.speedKmh > 20 && this.hintT <= 0) this.hint('Stop in the arrival ring (under 8 km/h)', 1.5);
    }

    this.drawEdgeMarkers();
    this.drawMini();
    this.drawSpeedLines(dt);
  }

  private drawMini(): void {
    this.mini.draw(this.miniCtx, 220, this.sim, 150);
    if (this.mapOpen) {
      const c = this.bigCtx.canvas;
      const w = c.clientWidth, h = c.clientHeight;
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
      this.mini.drawBig(this.bigCtx, w, h, this.sim);
    }
  }

  private drawEdgeMarkers(): void {
    const sim = this.sim;
    const targets: { x: number; z: number; css: string; label: string; r: number }[] = [];
    if (sim.trip) {
      const d = sim.trip.fare.dest;
      targets.push({ x: d.x, z: d.z, css: TIER_INFO[sim.trip.fare.tier].css, label: d.name, r: 0 });
    } else {
      const v = sim.vehicle;
      const sorted = [...sim.fares.candidates].sort((a, b) => Math.hypot(a.pickup.x - v.x, a.pickup.z - v.z) - Math.hypot(b.pickup.x - v.x, b.pickup.z - v.z)).slice(0, 3);
      for (const f of sorted) targets.push({ x: f.pickup.x, z: f.pickup.z, css: TIER_INFO[f.tier].css, label: TIER_INFO[f.tier].label, r: 0 });
    }
    const v = sim.vehicle;
    this.edge.forEach((el, i) => {
      const t = targets[i];
      if (!t || sim.phase !== 'running') { el.style.display = 'none'; return; }
      const p = this.view.project(t.x, 8, t.z);
      const on = !p.behind && p.x > 0.04 && p.x < 0.96 && p.y > 0.08 && p.y < 0.92;
      if (on) { el.style.display = 'none'; return; }
      let nx = p.x - 0.5, ny = p.y - 0.5;
      if (p.behind) { nx = -nx; ny = -ny; if (Math.abs(nx) < 0.02) nx = 0.3; ny = 0.5; }
      const m = Math.max(Math.abs(nx) / 0.45, Math.abs(ny) / 0.42, 1e-4);
      const ex = 0.5 + nx / m * 1, ey = 0.5 + ny / m * 1;
      el.style.display = '';
      el.style.left = `${ex * 100}%`;
      el.style.top = `${ey * 100}%`;
      (el.querySelector('.chev') as HTMLElement).style.transform = `rotate(${Math.atan2(ny, nx) * 180 / Math.PI + 90}deg)`;
      (el.querySelector('.chev') as HTMLElement).style.borderBottomColor = t.css;
      const d = Math.round(Math.hypot(t.x - v.x, t.z - v.z));
      (el.querySelector('.elab') as HTMLElement).textContent = `${d} m`;
    });
  }

  private drawSpeedLines(dt: number): void {
    const c = this.fx;
    const W = c.clientWidth, H = c.clientHeight;
    if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
    const g = this.fxCtx;
    g.clearRect(0, 0, W, H);
    if (this.reduced || this.photo) return;
    const kmh = this.sim.speedKmh;
    const boost = this.sim.vehicle.boosting;
    const k = Math.max(0, (kmh - 95) / 80) + (boost ? 0.6 : 0);
    if (k <= 0.02) return;
    const n = Math.floor(14 + 26 * Math.min(1, k));
    const t = performance.now() / 1000;
    g.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.sin(i * 12.9898) * 0.3;
      const ph = (t * (1.8 + (i % 5) * 0.35) + i * 0.37) % 1;
      const r0 = Math.min(W, H) * (0.34 + ph * 0.42), r1 = r0 + Math.min(W, H) * (0.08 + 0.22 * k);
      g.strokeStyle = `rgba(255,255,255,${0.12 * Math.min(1, k) * (1 - ph)})`;
      g.lineWidth = 1.5 + (i % 3);
      g.beginPath();
      g.moveTo(W / 2 + Math.cos(a) * r0 * 1.25, H / 2 + Math.sin(a) * r0 * 0.9);
      g.lineTo(W / 2 + Math.cos(a) * r1 * 1.25, H / 2 + Math.sin(a) * r1 * 0.9);
      g.stroke();
    }
    void dt;
  }
}
