// Lightweight in-game HUD: plain DOM updated imperatively once per frame (no React re-renders at 60 Hz).
import { Session, SessionEvent, LESSONS } from '../game-session/session';
import { GameView } from '../renderer/gameView';
import { Minimap } from './minimap';
import { TIERS, Tier, PICKUP_STOP_SPEED, DROP_STOP_SPEED } from '../fares/fares';
import { ARCHETYPES, PREF_INFO } from '../fares/passengers';
import { DISTRICT_NAMES, districtAt } from '../world/galeport';
import { PULSE_DECAY_TIME } from '../score/pulse';
import { BOOST_MIN_START } from '../vehicle/vehicle';
import { V3 } from '../core/math';

const $ = (root: HTMLElement, sel: string): HTMLElement => root.querySelector(sel) as HTMLElement;
const money = (n: number): string => Math.round(n).toLocaleString('en-US');
const SHAPE_CLASS: Record<Tier, string> = { short: 'sh-circle', medium: 'sh-diamond', long: 'sh-star', special: 'sh-hex' };

export function formatTime(t: number): string {
  const m = Math.floor(t / 60), s = t - m * 60;
  return `${m}:${s < 10 ? '0' : ''}${s.toFixed(1)}`;
}

interface Callout {
  el: HTMLElement;
  label: string;
  born: number;
  total: number;
}

export class Hud {
  root: HTMLElement;
  subtitles = true;
  showMinimap = true;
  mapOpen = false;
  private el: Record<string, HTMLElement> = {};
  private mini: HTMLCanvasElement;
  private big: HTMLCanvasElement;
  private callouts: Callout[] = [];
  private edges: HTMLElement[] = [];
  private time = 0;
  private subUntil = 0;
  private deliveryUntil = 0;
  private centerUntil = 0;
  private deltaUntil = 0;
  private last: Record<string, string> = {};
  private frame = 0;

  constructor(parent: HTMLElement, private minimap: Minimap) {
    parent.innerHTML = `
<div class="hud" style="display:none">
  <div class="hud-speedlines" data-k="lines"></div>
  <div class="hud-score"><div class="lbl">FARES</div><div class="val" data-k="score">0</div><div class="sub" data-k="deliv"></div></div>
  <div class="hud-clock"><div class="lbl" data-k="clockLbl">SHIFT CLOCK</div><div class="val" data-k="clock">60</div><div class="delta" data-k="delta"></div></div>
  <div class="hud-fare" data-k="fare">
    <div class="avatar" data-k="avatar"><i></i><b></b></div>
    <div class="who"><div class="name" data-k="fname"></div><div class="pref" data-k="fpref"></div></div>
    <div class="dest"><div class="to">TO</div><div class="dname" data-k="dname"></div><div class="ddist" data-k="ddist"></div></div>
    <div class="patience"><div class="pbar"><i data-k="pat"></i><em style="left:25%"></em><em style="left:10%"></em></div><div class="pgrade" data-k="pgrade"></div></div>
  </div>
  <div class="hud-seek" data-k="seek"></div>
  <div class="hud-pulse" data-k="pulse">
    <div class="pl">PULSE</div><div class="mult" data-k="mult">x1</div>
    <div class="pbar"><i data-k="pcharge"></i></div><div class="pdecay"><i data-k="pdecay"></i></div>
    <div class="tips" data-k="tips"></div>
  </div>
  <div class="hud-callouts" data-k="callouts"></div>
  <div class="hud-delivery" data-k="delivery"></div>
  <div class="hud-br">
    <div class="speed"><b data-k="speed">0</b><span>km/h</span></div>
    <div class="tailwind" data-k="twbox"><div class="lbl"><span>TAILWIND</span><kbd>SHIFT</kbd></div><div class="bar"><i data-k="tw"></i><em style="left:${BOOST_MIN_START * 100}%"></em></div></div>
  </div>
  <div class="hud-map" data-k="mapbox"><canvas width="220" height="220"></canvas><div class="district" data-k="district"></div></div>
  <div class="hud-lesson" data-k="lesson"></div>
  <div class="hud-sub" data-k="sub"></div>
  <div class="hud-center" data-k="center"></div>
  <div class="hud-prompt" data-k="prompt"></div>
  <div class="hud-edges" data-k="edges"></div>
  <div class="hud-bigmap" data-k="bigmap" style="display:none"><div class="bm-title">GALEPORT <span>press M to close</span></div><canvas width="1120" height="800"></canvas></div>
</div>`;
    this.root = parent.firstElementChild as HTMLElement;
    this.root.querySelectorAll('[data-k]').forEach((n) => (this.el[(n as HTMLElement).dataset.k!] = n as HTMLElement));
    this.mini = this.root.querySelector('.hud-map canvas') as HTMLCanvasElement;
    this.big = this.root.querySelector('.hud-bigmap canvas') as HTMLCanvasElement;
    for (let i = 0; i < 9; i++) {
      const e = document.createElement('div');
      e.className = 'edge';
      e.innerHTML = '<i></i><span></span>';
      this.el.edges.appendChild(e);
      this.edges.push(e);
    }
  }

  setVisible(v: boolean): void {
    this.root.style.display = v ? '' : 'none';
  }
  reset(): void {
    for (const c of this.callouts) c.el.remove();
    this.callouts = [];
    this.el.delivery.className = 'hud-delivery';
    this.el.delivery.innerHTML = '';
    this.el.center.innerHTML = '';
    this.el.sub.innerHTML = '';
    this.el.delta.textContent = '';
    this.subUntil = this.deliveryUntil = this.centerUntil = this.deltaUntil = 0;
    this.mapOpen = false;
    this.last = {};
  }
  private set(key: string, value: string): void {
    if (this.last[key] === value) return;
    this.last[key] = value;
    this.el[key].textContent = value;
  }
  private cls(key: string, value: string): void {
    const k = `c:${key}`;
    if (this.last[k] === value) return;
    this.last[k] = value;
    this.el[key].className = value;
  }
  private center(html: string, cls: string, dur: number): void {
    this.el.center.innerHTML = `<div class="${cls}">${html}</div>`;
    this.centerUntil = this.time + dur;
  }

  onEvent(e: SessionEvent, s: Session): void {
    switch (e.type) {
      case 'countdown': this.center(String(e.n), 'count', 0.9); break;
      case 'go': this.center('GO!', 'count go', 0.9); break;
      case 'style': {
        const now = this.time;
        const prev = this.callouts.find((c) => c.label === e.label && now - c.born < 1.2);
        if (prev) {
          prev.total += e.total; prev.born = now;
          prev.el.querySelector('b')!.textContent = `+${money(prev.total)}`;
          prev.el.classList.remove('bump'); void prev.el.offsetWidth; prev.el.classList.add('bump');
        } else {
          const el = document.createElement('div');
          el.className = `callout cat-${e.cat}`;
          el.innerHTML = `<span>${e.label}</span><b>+${money(e.total)}</b>${e.mult > 1 ? `<em>x${e.mult}</em>` : ''}`;
          this.el.callouts.prepend(el);
          this.callouts.unshift({ el, label: e.label, born: now, total: e.total });
          while (this.callouts.length > 5) this.callouts.pop()!.el.remove();
        }
        break;
      }
      case 'token': {
        const el = document.createElement('div');
        el.className = 'callout cat-shortcut';
        el.innerHTML = e.kind === 'tailwind' ? '<span>Tailwind token</span><b>+30%</b>' : s.mode.extend ? '<span>Clock spark</span><b>+1s</b>' : '<span>Clock spark</span><b>+' + e.value + '</b>';
        this.el.callouts.prepend(el);
        this.callouts.unshift({ el, label: 'token' + this.time, born: this.time, total: 0 });
        break;
      }
      case 'pulse':
        if (e.change === 'up') { this.el.pulse.classList.remove('up'); void this.el.pulse.offsetWidth; this.el.pulse.classList.add('up'); }
        else if (e.change === 'crash') { this.el.pulse.classList.remove('crash'); void this.el.pulse.offsetWidth; this.el.pulse.classList.add('crash'); }
        break;
      case 'time': {
        this.el.delta.textContent = `${e.delta > 0 ? '+' : ''}${e.delta}s`;
        this.el.delta.className = `delta show ${e.delta > 0 ? 'plus' : 'minus'}`;
        this.deltaUntil = this.time + 1.6;
        break;
      }
      case 'delivered': {
        const r = e.result;
        const row = (l: string, v: number) => (v ? `<div class="row"><span>${l}</span><b>${money(v)}</b></div>` : '');
        this.el.delivery.innerHTML = `<div class="grade g-${r.grade}">${r.grade.toUpperCase()}!</div><div class="rows">${row('Fare', r.base)}${row('Time bonus', r.timeBonus)}${row('Style tips', r.tips)}${row('Accuracy', r.accuracy)}${row('Discovery', r.discovery)}${row('Passenger bonus', r.prefBonus)}</div><div class="total"><span>TOTAL</span><b>${money(r.total)}</b></div>${s.mode.extend && r.timeAward ? `<div class="tplus">+${r.timeAward}s shift time</div>` : ''}`;
        this.el.delivery.className = 'hud-delivery show';
        this.deliveryUntil = this.time + 2.8;
        break;
      }
      case 'fareFailed': this.center('FARE LOST', 'banner bad', 1.6); break;
      case 'bark':
        if (this.subtitles) { this.el.sub.innerHTML = `<b>${e.who}</b> ${e.text}`; this.el.sub.className = 'hud-sub show'; this.subUntil = this.time + 3.2; }
        break;
      case 'shortcut': if (e.first) this.center(`SHORTCUT FOUND<small>${e.name}</small>`, 'banner good', 1.8); break;
      case 'respawn': this.center(e.reason === 'water' ? 'SPLASH! <small>-3s</small>' : 'RESET <small>-3s</small>', 'banner bad', 1.3); break;
      case 'special': this.center('STORM EXPRESS<small>A special fare is hailing nearby</small>', 'banner special', 2.2); break;
      case 'lesson': this.center(`LESSON CLEAR<small>${LESSONS[e.index].title}</small>`, 'banner good', 1.6); break;
      case 'finished': this.center(s.opts.mode === 'school' ? 'SCHOOL COMPLETE' : s.opts.mode === 'trial' ? 'FINISH!' : 'SHIFT OVER', 'banner over', 3); break;
      default: break;
    }
  }

  update(dt: number, s: Session, view: GameView): void {
    this.time += dt;
    this.frame++;
    const v = s.vehicle;
    const t = this.time;
    // Score + clock.
    this.set('score', money(s.score));
    this.set('deliv', s.opts.mode === 'trial' ? `fare ${Math.min(s.fares.chainIndex + 1, 3)} of 3` : `${s.fares.deliveries} delivered`);
    if (s.hasClock) {
      const c = s.clock;
      this.set('clock', c < 10 ? c.toFixed(1) : String(Math.ceil(c)));
      this.cls('clock', `val${c < 10 ? ' low' : ''}${s.phase === 'grace' ? ' grace' : ''}`);
      this.set('clockLbl', s.phase === 'grace' ? 'FINISH IT!' : 'SHIFT CLOCK');
    } else {
      this.set('clock', s.opts.mode === 'school' ? `${Math.min(s.lessonIndex + 1, LESSONS.length)}/${LESSONS.length}` : formatTime(s.elapsed));
      this.cls('clock', 'val small');
      this.set('clockLbl', s.opts.mode === 'school' ? 'SKILL SCHOOL' : 'TIME TRIAL');
    }
    if (this.deltaUntil && t > this.deltaUntil) { this.el.delta.className = 'delta'; this.deltaUntil = 0; }
    // Fare panel.
    const cur = s.fares.current;
    const carrying = !!cur && (s.fares.state === 'carrying' || s.fares.state === 'boarding');
    this.el.fare.style.display = carrying ? '' : 'none';
    this.el.seek.style.display = !carrying && s.phase !== 'ended' ? '' : 'none';
    const pos = v.pos;
    if (carrying && cur) {
      const p = ARCHETYPES[cur.who], dest = s.model.sites[cur.dest];
      if (this.last.fareId !== String(cur.id)) {
        this.last.fareId = String(cur.id);
        this.el.fname.textContent = p.name;
        this.el.fpref.textContent = `${PREF_INFO[p.pref].label} - ${PREF_INFO[p.pref].hint}`;
        this.el.dname.textContent = dest.name;
        this.el.avatar.style.setProperty('--body', p.body);
        this.el.avatar.style.setProperty('--accent', p.accent);
        this.el.avatar.style.setProperty('--skin', p.skin);
        this.el.fare.style.setProperty('--tier', TIERS[cur.tier].color);
      }
      const frac = s.fares.patienceFrac;
      this.el.pat.style.width = `${(frac * 100).toFixed(1)}%`;
      const grade = s.fares.patience <= 0 ? 'LATE' : frac >= 0.25 ? 'BLAZING' : frac >= 0.1 ? 'FAST' : 'CLOSE';
      this.set('pgrade', `${grade} ${Math.max(0, s.fares.patience).toFixed(0)}s`);
      this.cls('pat', grade === 'BLAZING' ? 'g1' : grade === 'FAST' ? 'g2' : 'g3');
      const d = Math.hypot(dest.x - pos.x, dest.z - pos.z);
      this.set('ddist', `${DISTRICT_NAMES[dest.district]} - ${Math.round(d)} m`);
    } else if (this.frame % 10 === 0) {
      let best: { tier: Tier; d: number } | null = null;
      for (const c of s.fares.candidates) { const site = s.model.sites[c.site]; const d = Math.hypot(site.x - pos.x, site.z - pos.z); if (!best || d < best.d) best = { tier: c.tier, d }; }
      const txt = best ? `<i class="shape ${SHAPE_CLASS[best.tier]}" style="--c:${TIERS[best.tier].color}"></i><span>NEAREST FARE</span><b>${TIERS[best.tier].label}</b><span>${Math.round(best.d)} m</span>` : '<span>Waiting for fares...</span>';
      if (this.last.seek !== txt) { this.last.seek = txt; this.el.seek.innerHTML = txt; }
    }
    // Pulse.
    const pu = s.pulse;
    this.set('mult', `x${pu.mult}`);
    this.cls('mult', `mult m${pu.mult}${pu.active ? ' on' : ''}`);
    this.el.pcharge.style.width = `${(pu.progress * 100).toFixed(0)}%`;
    this.el.pdecay.style.width = `${pu.active ? ((1 - pu.idle / PULSE_DECAY_TIME) * 100).toFixed(0) : 0}%`;
    this.set('tips', carrying && s.fares.tripTips > 0 ? `TIPS ${money(s.fares.tripTips)}` : pu.active ? `CHAIN ${pu.chain}` : '');
    for (let i = this.callouts.length - 1; i >= 0; i--) if (t - this.callouts[i].born > 2.4) { this.callouts[i].el.remove(); this.callouts.splice(i, 1); }
    if (this.deliveryUntil && t > this.deliveryUntil) { this.el.delivery.className = 'hud-delivery'; this.deliveryUntil = 0; }
    if (this.subUntil && t > this.subUntil) { this.el.sub.className = 'hud-sub'; this.subUntil = 0; }
    if (this.centerUntil && t > this.centerUntil) { this.el.center.innerHTML = ''; this.centerUntil = 0; }
    // Speed + tailwind.
    this.set('speed', String(Math.round(v.speedKmh)));
    this.el.tw.style.width = `${(v.tailwind * 100).toFixed(0)}%`;
    this.cls('twbox', `tailwind${v.boostActive ? ' active' : v.tailwind >= BOOST_MIN_START ? ' ready' : ''}`);
    const lines = v.boostActive ? 1 : Math.max(0, (v.speed - 34) / 18);
    this.el.lines.style.opacity = view.chase.reducedMotion ? '0' : Math.min(0.9, lines).toFixed(2);
    // Prompts.
    let prompt = '';
    if (s.resetPrompt) prompt = 'Hold <kbd>R</kbd> to reset';
    else if (s.fares.state === 'carrying' && s.fares.inDropZone && v.speed > DROP_STOP_SPEED) prompt = 'STOP in the ring!';
    else if (s.fares.state === 'seeking' && v.speed > PICKUP_STOP_SPEED) {
      for (const c of s.fares.candidates) { const site = s.model.sites[c.site]; if (Math.hypot(site.x - pos.x, site.z - pos.z) < 7.5) prompt = 'STOP to pick up!'; }
    }
    if (this.last.prompt !== prompt) { this.last.prompt = prompt; this.el.prompt.innerHTML = prompt; this.el.prompt.style.display = prompt ? '' : 'none'; }
    // Lesson card.
    const l = s.lesson;
    const lt = l ? `<div class="ln">LESSON ${s.lessonIndex + 1} / ${LESSONS.length}</div><div class="lt">${l.title}</div><div class="lx">${l.text}</div>` : '';
    if (this.last.lesson !== lt) { this.last.lesson = lt; this.el.lesson.innerHTML = lt; this.el.lesson.style.display = lt ? '' : 'none'; }
    // Minimap.
    this.el.mapbox.style.display = this.showMinimap ? '' : 'none';
    if (this.showMinimap && this.frame % 2 === 0) {
      this.minimap.draw(this.mini.getContext('2d')!, s, this.mini.width, view.taxiPos.x, view.taxiPos.z, view.taxiYaw);
      if (this.frame % 30 === 0) this.set('district', DISTRICT_NAMES[districtAt(pos.x, pos.z)]);
    }
    this.el.bigmap.style.display = this.mapOpen ? '' : 'none';
    if (this.mapOpen && this.frame % 3 === 0) this.minimap.drawFull(this.big.getContext('2d')!, s, this.big.width, this.big.height, pos.x, pos.z, view.taxiYaw);
    this.updateEdges(s, view);
  }

  /** Screen-edge indicators for off-screen fares / the destination; distance tags for on-screen ones. */
  private updateEdges(s: Session, view: GameView): void {
    const targets: { p: V3; color: string; shape: string; d: number; main: boolean }[] = [];
    const pos = s.vehicle.pos;
    if (s.phase !== 'ended') {
      if (s.fares.state === 'seeking') {
        for (const c of s.fares.candidates) {
          const site = s.model.sites[c.site];
          const d = Math.hypot(site.x - pos.x, site.z - pos.z);
          targets.push({ p: { x: site.sx, y: site.sy + 9.5, z: site.sz }, color: TIERS[c.tier].color, shape: SHAPE_CLASS[c.tier], d, main: false });
        }
        targets.sort((a, b) => a.d - b.d);
        targets.length = Math.min(targets.length, 6);
      } else if (s.fares.current && s.fares.state === 'carrying') {
        const d = s.model.sites[s.fares.current.dest];
        targets.push({ p: { x: d.x, y: d.y + 17, z: d.z }, color: TIERS[s.fares.current.tier].color, shape: 'sh-dest', d: Math.hypot(d.x - pos.x, d.z - pos.z), main: true });
      }
    }
    const w = this.root.clientWidth, h = this.root.clientHeight;
    const mx = 46, my = 46;
    for (let i = 0; i < this.edges.length; i++) {
      const e = this.edges[i], tg = targets[i];
      if (!tg) { if (e.style.display !== 'none') e.style.display = 'none'; continue; }
      const pr = view.project(tg.p);
      let x = pr.x, y = pr.y;
      const off = pr.behind || x < mx || x > w - mx || y < my + 60 || y > h - my;
      if (off) {
        // Clamp to the screen border along the direction from the centre.
        let dx = x - w / 2, dy = y - h / 2;
        if (pr.behind) { dx = -dx; dy = Math.abs(dy) + h; }
        const k = Math.min((w / 2 - mx) / Math.max(1e-3, Math.abs(dx)), (h / 2 - my - 30) / Math.max(1e-3, Math.abs(dy)));
        x = w / 2 + dx * k; y = h / 2 + dy * k + 20;
        e.className = `edge off ${tg.shape}${tg.main ? ' main' : ''}`;
        (e.firstElementChild as HTMLElement).style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
      } else {
        e.className = `edge on ${tg.shape}${tg.main ? ' main' : ''}`;
        (e.firstElementChild as HTMLElement).style.transform = '';
      }
      e.style.display = !off && tg.d < 26 ? 'none' : '';
      e.style.setProperty('--c', tg.color);
      e.style.transform = `translate(${x.toFixed(0)}px, ${y.toFixed(0)}px)`;
      const label = `${Math.round(tg.d)}m`;
      const span = e.lastElementChild as HTMLElement;
      if (span.textContent !== label) span.textContent = label;
    }
  }
}
