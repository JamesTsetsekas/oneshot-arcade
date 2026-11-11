// In-world HUD drawn with plain DOM and updated from one batched state snapshot (no React here).
import type { Sim } from '../game-session/sim';
import type { Settings } from '../core/settings';
import { MapPainter, MapOverlay } from './minimap';
import { streetNameAt, zoneAt, ZONE_NAMES } from '../world/district';
import { OUTFITS } from '../character/player';

const el = (html: string) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild as HTMLElement; };

export class Hud {
  root: HTMLElement; private mini: HTMLCanvasElement; private mctx: CanvasRenderingContext2D;
  private q: Record<string, HTMLElement> = {};
  private last: Record<string, string> = {};
  private subs: { speaker: string; text: string; until: number }[] = []; private toasts: { el: HTMLElement; until: number }[] = [];
  private zone = ''; private zoneUntil = 0; private t = 0; private fpsAcc = 0; private fpsN = 0; fps = 60;
  radioText = '';
  constructor(parent: HTMLElement, public sim: Sim, public settings: Settings, public painter: MapPainter) {
    this.root = el(`<div class="hud">
      <div class="hud-tl panel"><div class="obj-title" data-q="objTitle"></div><div class="obj-text" data-q="objText"></div><div class="obj-opt" data-q="objOpt"></div><div class="obj-timer" data-q="objTimer"></div><div class="obj-hint" data-q="objHint"></div></div>
      <div class="hud-tr"><div class="panel money"><span data-q="cash">$0</span><span class="trust" data-q="trust"></span></div>
        <div class="panel alert" data-q="alert"><div class="beacon" data-q="beacon"><i></i><i></i><i></i><i></i><i></i></div><div class="alert-status" data-q="alertStatus"></div></div>
        <div class="fps" data-q="fps"></div></div>
      <div class="hud-bl"><div class="mini-wrap"><canvas width="200" height="200"></canvas></div>
        <div class="vitals"><div class="street" data-q="street"></div><div class="bar hp"><b data-q="hp"></b></div><div class="bar armor"><b data-q="armor"></b></div><div class="bar stam"><b data-q="stam"></b></div><div class="clock" data-q="clock"></div></div></div>
      <div class="hud-br panel"><div class="veh" data-q="veh"><span class="speed" data-q="speed">0</span><span class="unit">km/h</span><span class="gear" data-q="gear">N</span><div class="cond" data-q="cond"></div></div>
        <div class="weap" data-q="weap"><div class="wname" data-q="wname"></div><div class="ammo" data-q="ammo"></div></div><div class="kit" data-q="kit"></div></div>
      <div class="hud-center"><div class="crosshair" data-q="cross"></div><div class="lock" data-q="lock"><div class="lock-band" data-q="lockBand"></div><div class="lock-needle" data-q="lockNeedle"></div><div class="lock-text" data-q="lockText"></div></div></div>
      <div class="hud-bc"><div class="radio" data-q="radio"></div><div class="subs" data-q="subs"></div><div class="prompt" data-q="prompt"><span data-q="promptText"></span><div class="prompt-bar"><b data-q="promptBar"></b></div></div></div>
      <div class="hud-tc"><div class="zone" data-q="zone"></div><div class="toasts" data-q="toasts"></div><div class="cargo" data-q="cargo"></div></div>
      <div class="lockhint" data-q="lockhint">Click the game to capture the mouse</div>
      <div class="vignette" data-q="hurt"></div>
    </div>`);
    parent.appendChild(this.root);
    this.root.querySelectorAll<HTMLElement>('[data-q]').forEach((e) => (this.q[e.dataset.q!] = e));
    this.mini = this.root.querySelector('canvas')!; this.mctx = this.mini.getContext('2d')!;
    sim.bus.on('subtitle', (s) => { if (!this.settings.subtitles) return; this.subs.push({ speaker: s.speaker, text: s.text, until: this.t + (s.dur ?? 3.2) }); if (this.subs.length > 3) this.subs.shift(); this.last.subs = ''; });
    sim.bus.on('toast', (t) => this.toast(t.text, t.kind ?? 'info'));
  }
  toast(text: string, kind = 'info') {
    const e = el(`<div class="toast ${kind}"></div>`); e.textContent = text;
    this.q.toasts.appendChild(e); this.toasts.push({ el: e, until: this.t + 4.2 });
    if (this.toasts.length > 4) this.toasts.shift()!.el.remove();
  }
  private set(key: string, text: string) { if (this.last[key] !== text) { this.last[key] = text; this.q[key].textContent = text; } }
  private html(key: string, html: string) { if (this.last[key] !== html) { this.last[key] = html; this.q[key].innerHTML = html; } }
  private cls(key: string, cls: string) { const k = 'c:' + key; if (this.last[k] !== cls) { this.last[k] = cls; this.q[key].className = cls; } }
  private show(key: string, on: boolean) { const k = 's:' + key; const v = on ? '1' : '0'; if (this.last[k] !== v) { this.last[k] = v; this.q[key].style.display = on ? '' : 'none'; } }
  setVisible(on: boolean) { this.root.style.display = on ? '' : 'none'; }
  setLockHint(on: boolean) { this.show('lockhint', on); }

  update(dt: number, overlay: MapOverlay) {
    this.t += dt; this.fpsAcc += dt; this.fpsN++;
    if (this.fpsAcc > 0.5) { this.fps = this.fpsN / this.fpsAcc; this.fpsAcc = 0; this.fpsN = 0; }
    const sim = this.sim, p = sim.player, pol = sim.police, m = sim.missions, v = p.vehicle, st = this.settings;
    this.root.classList.toggle('cb', st.colorblind);
    this.root.style.setProperty('--sub-scale', String(st.subtitleScale));
    // objective panel
    const hasObj = !!m.active && !m.failed;
    this.show('objTitle', hasObj); this.show('objText', hasObj); this.show('objOpt', hasObj && m.optional.length > 0); this.show('objTimer', hasObj && !!m.timerText); this.show('objHint', hasObj && !!m.hint);
    (this.q.objTitle.parentElement as HTMLElement).style.display = hasObj ? '' : 'none';
    if (hasObj) {
      this.set('objTitle', m.active!.title); this.set('objText', m.objective); this.set('objTimer', m.timerText); this.set('objHint', m.hint);
      this.html('objOpt', m.optional.map((o) => `<div class="${o.ok ? 'ok' : 'no'}">${o.ok ? '◆' : '◇'} ${o.text}</div>`).join(''));
    }
    // money / trust / alert
    this.set('cash', '$' + Math.floor(sim.economy.cash).toLocaleString('en-US'));
    this.set('trust', 'Trust ' + sim.trustLevel);
    const status = pol.detain > 0 ? 'Detained — comply or run' : pol.status;
    this.show('alert', pol.tier > 0 || pol.status !== 'Unnoticed');
    this.cls('beacon', `beacon t${pol.tier} s-${pol.status.replace(/\s/g, '')}`);
    this.set('alertStatus', pol.tier > 0 ? `ALERT ${pol.tier} · ${status}` : status);
    this.show('fps', st.showFps); if (st.showFps) this.set('fps', `${this.fps.toFixed(0)} fps`);
    // vitals
    this.q.hp.style.width = `${Math.max(0, p.health)}%`; this.q.armor.style.width = `${(p.inv.armor / 50) * 100}%`; this.q.stam.style.width = `${p.stamina * 100}%`;
    this.show('armor', p.inv.armor > 0); (this.q.armor.parentElement as HTMLElement).style.display = p.inv.armor > 0 ? '' : 'none';
    this.set('street', streetNameAt(p.x, p.z)); this.set('clock', `${sim.clock.label} · ${sim.weather.rain > 0.3 ? 'Rain' : sim.clock.night > 0.6 ? 'Night' : sim.clock.sunset > 0.4 ? 'Sunset' : 'Clear'}`);
    this.q.hurt.style.opacity = String(Math.max(0, Math.min(0.75, (1 - p.health / 45) * 0.8 + (p.stunned > 0 ? 0.35 : 0))));
    // vehicle / weapon cluster
    this.show('veh', !!v); this.show('weap', !v);
    if (v) {
      this.set('speed', String(Math.round(v.speedAbs * 3.6))); this.set('gear', v.gear === 0 ? 'R' : v.speedAbs < 0.5 ? 'N' : String(v.gear));
      const warn = v.stalled ? 'ENGINE DEAD — find another ride' : v.engine < 30 ? 'Engine failing' : v.engine < 55 ? 'Engine damaged' : v.wheels.some((w) => w.burst) ? 'Tyre burst' : '';
      this.set('cond', warn); this.cls('cond', 'cond' + (v.engine < 30 || v.stalled ? ' bad' : ''));
    } else {
      const w = p.weapon();
      if (w) { this.set('wname', `${w.name} · ${w.lethal ? 'LETHAL' : 'NONLETHAL'}`); this.set('ammo', p.reloadT > 0 ? 'reloading…' : `${p.inv.mags[w.id] ?? 0} / ${p.inv.ammo[w.ammo]}`); this.cls('wname', 'wname ' + (w.lethal ? 'lethal' : 'non')); }
      else { this.set('wname', 'Baton (F) · NONLETHAL'); this.set('ammo', 'holstered'); this.cls('wname', 'wname non'); }
    }
    this.set('kit', `Medkit ${p.inv.medkits}  ·  ${p.gadget === 'chirper' ? `Chirper ${p.inv.chirper}` : `Smoke ${p.inv.smoke}`}  ·  ${OUTFITS[p.outfit].name.split(' ')[0]}`);
    // centre
    this.show('cross', p.armed && !v); this.cls('cross', 'crosshair' + (p.aiming ? ' aim' : ''));
    const L = m.lock; this.show('lock', !!L);
    if (L) { this.q.lockBand.style.left = `${L.lo * 100}%`; this.q.lockBand.style.width = `${(L.hi - L.lo) * 100}%`; this.q.lockNeedle.style.left = `${L.needle * 100}%`; this.set('lockText', `Press E in the green band  ·  ${L.hits}/${L.need}`); }
    // prompt + subtitles + radio
    const pr = p.prompt; this.show('prompt', !!pr && !p.downed);
    if (pr) { this.set('promptText', pr.text); this.q.promptBar.style.width = `${pr.progress * 100}%`; (this.q.promptBar.parentElement as HTMLElement).style.display = pr.progress > 0 ? '' : 'none'; }
    this.subs = this.subs.filter((s) => s.until > this.t);
    this.html('subs', this.subs.map((s) => `<div><b>${s.speaker}:</b> ${s.text}</div>`).join(''));
    this.show('radio', !!v && !!this.radioText); this.set('radio', this.radioText ? '♪ ' + this.radioText + '   (N: next station)' : '');
    for (let i = this.toasts.length - 1; i >= 0; i--) if (this.toasts[i].until < this.t) { this.toasts[i].el.remove(); this.toasts.splice(i, 1); }
    const zn = ZONE_NAMES[zoneAt(p.x, p.z)];
    if (zn !== this.zone) { this.zone = zn; this.zoneUntil = this.t + 3.5; this.set('zone', zn); }
    this.q.zone.style.opacity = this.zoneUntil > this.t ? '1' : '0';
    const cv = m.cargoRef ? m.refs.get(m.cargoRef) : null;
    this.show('cargo', !!cv && hasObj); if (cv) this.html('cargo', `Cargo <span class="cbar"><b style="width:${cv.cargo}%"></b></span> ${Math.round(cv.cargo)}%`);
    this.painter.drawMini(this.mctx, 200, overlay, st.minimapRotate, v ? 0.95 : 0.6);
  }
}
