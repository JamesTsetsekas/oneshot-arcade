// 2D overlay: health bars (distinct per unit class, shield layer, segments, CC tags), aggregated
// damage numbers, pings, tower target lines, recall progress. Drawn every frame without React.
import type { GameRenderer } from './renderer';
import type { InterpEnt } from '../runtime/session';
import type { GameEvent, PingKind, Snapshot } from '../../protocol/messages';
import { K, ST } from '../../protocol/messages';
import { teamColor } from './models';

interface Float { x: number; y: number; z: number; text: string; color: string; t: number; size: number; key?: string; amt?: number }
interface Ping { x: number; y: number; kind: PingKind; t: number; name: string }

export const PING_STYLE: Record<PingKind, { color: string; label: string; glyph: string }> = {
  danger: { color: '#ff4a3a', label: 'Danger', glyph: '!' },
  omw: { color: '#7dff8a', label: 'On my way', glyph: '»' },
  assist: { color: '#ffd36b', label: 'Assist me', glyph: '+' },
  missing: { color: '#ffb347', label: 'Enemy missing', glyph: '?' },
  defend: { color: '#7fd1ff', label: 'Defend', glyph: '◆' },
  objective: { color: '#ff6ad5', label: 'Objective', glyph: '★' },
};

const hex = (c: number) => `#${c.toString(16).padStart(6, '0')}`;

export class Overlay {
  ctx: CanvasRenderingContext2D;
  floats: Float[] = [];
  pings: Ping[] = [];
  damageNumbers = true;
  colorblind = false;
  myTeam: 0 | 1 = 0;
  meId = 0;
  scale = 1;
  constructor(public canvas: HTMLCanvasElement) { this.ctx = canvas.getContext('2d')!; }

  setSize(w: number, h: number, dpr: number) {
    this.canvas.width = Math.round(w * dpr); this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  mutedNames = new Set<string>();
  onEvents(events: GameEvent[], r: GameRenderer, now: number) {
    for (const ev of events) {
      if (ev.e === 'ping' && this.mutedNames.has(ev.name)) continue;
      if (ev.e === 'dmg' && this.damageNumbers) {
        const tgt = r.entsById.get(ev.tgt);
        const mine = ev.src === this.meId, onMe = ev.tgt === this.meId;
        if (!mine && !onMe && !(tgt && tgt.k === K.Hero)) continue;
        const color = onMe ? '#ff6b6b' : ev.dt === 'arcane' ? '#d58bff' : ev.dt === 'pure' ? '#ffffff' : ev.crit ? '#ffcf3a' : '#ffe9c8';
        // local aggregation of multi-hit spam
        const key = `${ev.src}-${ev.tgt}-${ev.dt}`;
        const ex = this.floats.find((f) => f.key === key && now - f.t < 0.35);
        if (ex) { ex.amt! += ev.amt; ex.text = `${ex.amt}`; ex.t = now; continue; }
        this.floats.push({ x: ev.x, y: 2.6, z: ev.y, text: `${ev.amt}${ev.crit ? '!' : ''}`, color, t: now, size: ev.crit ? 20 : onMe ? 15 : 16, key, amt: ev.amt });
      } else if (ev.e === 'gold') {
        this.floats.push({ x: ev.x, y: 2.0, z: ev.y, text: `+${ev.amt}g`, color: '#ffd36b', t: now, size: 14 });
      } else if (ev.e === 'heal' && ev.tgt === this.meId && ev.amt > 20) {
        this.floats.push({ x: ev.x, y: 2.4, z: ev.y, text: `+${ev.amt}`, color: '#8aff9a', t: now, size: 14 });
      } else if (ev.e === 'ping') {
        this.pings.push({ x: ev.x, y: ev.y, kind: ev.kind, t: now, name: ev.name });
      } else if (ev.e === 'level' && ev.id === this.meId) {
        this.floats.push({ x: ev.x, y: 3.2, z: ev.y, text: `Level ${ev.level}`, color: '#ffd36b', t: now, size: 18 });
      }
    }
    if (this.floats.length > 80) this.floats.splice(0, this.floats.length - 80);
  }

  draw(r: GameRenderer, snap: Snapshot | null, now: number, hoverId: number) {
    const g = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, W, H);
    g.restore();
    if (!snap) return;
    const s = this.scale;
    // tower target lines (target change readability)
    for (const e of r.ents) {
      if ((e.k !== K.Tower && e.k !== K.Core) || !e.tgt) continue;
      const t = r.entsById.get(e.tgt);
      if (!t || t.k !== K.Hero) continue;
      const a = r.worldToScreen(e.x, 6, e.y), b = r.worldToScreen(t.x, 1.2, t.y);
      g.strokeStyle = (e.ramp ?? 0) > 1 ? 'rgba(255,60,40,0.9)' : 'rgba(255,140,60,0.75)';
      g.lineWidth = 2 + (e.ramp ?? 0) * 0.8;
      g.setLineDash([8, 6]);
      g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
      g.setLineDash([]);
    }
    for (const e of r.ents) {
      if (e.k === K.Proj || e.k === K.Zone || e.k === K.Wall || e.k === K.Fountain) continue;
      if (e.st & ST.dead) continue;
      if (e.k === K.Ward) { this.wardTimer(r, e, snap.time); continue; }
      this.bar(r, e, e.id === hoverId, s);
    }
    // floats
    g.textAlign = 'center';
    for (let i = this.floats.length - 1; i >= 0; i--) {
      const f = this.floats[i];
      const age = now - f.t;
      if (age > 1.1) { this.floats.splice(i, 1); continue; }
      const p = r.worldToScreen(f.x, f.y + age * 1.4, f.z);
      if (!p.on) continue;
      g.globalAlpha = Math.max(0, 1 - age / 1.1);
      g.font = `800 ${Math.round(f.size * s * (age < 0.1 ? 1.25 : 1))}px "Trebuchet MS", system-ui, sans-serif`;
      g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,0.75)';
      g.strokeText(f.text, p.x, p.y); g.fillStyle = f.color; g.fillText(f.text, p.x, p.y);
    }
    g.globalAlpha = 1;
    // pings
    for (let i = this.pings.length - 1; i >= 0; i--) {
      const p = this.pings[i];
      const age = now - p.t;
      if (age > 4) { this.pings.splice(i, 1); continue; }
      const sp = r.worldToScreen(p.x, 0, p.y);
      const st = PING_STYLE[p.kind];
      const pulse = (age * 1.5) % 1;
      g.strokeStyle = st.color; g.lineWidth = 3;
      g.globalAlpha = 1 - pulse;
      g.beginPath(); g.ellipse(sp.x, sp.y, 14 + pulse * 40, (14 + pulse * 40) * 0.55, 0, 0, Math.PI * 2); g.stroke();
      g.globalAlpha = Math.min(1, (4 - age) * 1.5);
      g.fillStyle = st.color;
      g.beginPath(); g.arc(sp.x, sp.y - 34, 15, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#10131c'; g.font = '900 18px system-ui'; g.fillText(st.glyph, sp.x, sp.y - 28);
      g.fillStyle = '#fff'; g.font = `700 ${12 * s}px system-ui`;
      g.strokeStyle = 'rgba(0,0,0,0.8)'; g.lineWidth = 3;
      g.strokeText(`${p.name}: ${st.label}`, sp.x, sp.y - 54); g.fillText(`${p.name}: ${st.label}`, sp.x, sp.y - 54);
      g.globalAlpha = 1;
    }
  }

  private wardTimer(r: GameRenderer, e: InterpEnt, time: number) {
    const p = r.worldToScreen(e.x, 1.6, e.y);
    if (!p.on || e.t1 === undefined) return;
    const g = this.ctx;
    const left = Math.max(0, e.t1 - time);
    g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(p.x - 14, p.y - 5, 28, 5);
    g.fillStyle = hex(teamColor(e.tm, this.colorblind)); g.fillRect(p.x - 14, p.y - 5, 28 * Math.min(1, left / 90), 5);
  }

  private bar(r: GameRenderer, e: InterpEnt, hover: boolean, s: number) {
    const g = this.ctx;
    const big = e.k === K.Tower || e.k === K.Core || e.k === K.Seal || e.k === K.Engine;
    const isHero = e.k === K.Hero || e.k === K.Decoy;
    const heightM = big ? (e.k === K.Engine ? 8.2 : 7.4) : isHero ? 3.9 : e.k === K.Monster ? (e.sub === 'colossus' ? 7.5 : e.sub?.startsWith('catalyst') ? 4.6 : 2.6) : e.sub === 'vanguard' ? 2.8 : 1.8;
    const p = r.worldToScreen(e.x, heightM, e.y);
    if (!p.on) return;
    const w = (isHero ? 86 : big ? 96 : e.k === K.Monster ? (e.sub === 'colossus' ? 120 : 60) : 34) * s;
    const h = (isHero ? 10 : big ? 9 : 5) * s;
    const x = p.x - w / 2, y = p.y;
    const mine = e.id === this.meId;
    const ally = e.tm === this.myTeam;
    const col = mine ? '#6dff7a' : e.tm === 2 ? '#f2c84b' : ally ? hex(teamColor(e.tm, this.colorblind)) : (this.colorblind ? '#ffd23f' : '#ff4d4d');
    const total = Math.max(e.mhp, e.hp + e.sh);
    g.fillStyle = 'rgba(8,10,18,0.82)';
    g.fillRect(x - 1.5, y - 1.5, w + 3, h + 3 + (isHero && e.mana !== undefined ? 4 * s : 0));
    const hpW = (w * Math.max(0, e.hp)) / total;
    g.fillStyle = col; g.fillRect(x, y, hpW, h);
    if (e.sh > 0) { g.fillStyle = 'rgba(200,245,255,0.95)'; g.fillRect(x + hpW, y, (w * e.sh) / total, h); }
    // segments every 250 hp (heroes) / 1000 (structures)
    if (isHero || big || (e.k === K.Monster && e.mhp > 2000)) {
      const seg = isHero ? 250 : 1000;
      g.fillStyle = 'rgba(0,0,0,0.55)';
      for (let v = seg; v < total; v += seg) { const sx = x + (w * v) / total; g.fillRect(sx, y, v % (seg * 4) === 0 ? 1.6 : 1, h * (v % (seg * 4) === 0 ? 1 : 0.6)); }
    }
    if (isHero && e.mana !== undefined && e.mmana) {
      g.fillStyle = e.sub === 'vey' ? '#ffe36b' : '#4aa8ff';
      g.fillRect(x, y + h + 1, (w * e.mana) / e.mmana, 3 * s);
    }
    if (isHero) {
      // level badge + name
      g.fillStyle = 'rgba(8,10,18,0.9)'; g.fillRect(x - 20 * s, y - 2, 18 * s, h + 4);
      g.fillStyle = '#fff'; g.font = `800 ${11 * s}px system-ui`; g.textAlign = 'center';
      g.fillText(String(e.lv ?? 1), x - 11 * s, y + h - 1);
      g.font = `700 ${11 * s}px system-ui`;
      g.strokeStyle = 'rgba(0,0,0,0.8)'; g.lineWidth = 3;
      g.strokeText(e.name ?? '', p.x, y - 5); g.fillStyle = ally ? '#e8f4ff' : '#ffd8d0'; g.fillText(e.name ?? '', p.x, y - 5);
      // crowd control tags
      const tags: Array<[number, string, string]> = [[ST.stun, 'STUN', '#ffd36b'], [ST.airborne, 'AIRBORNE', '#ffd36b'], [ST.root, 'ROOT', '#b6ff6e'], [ST.silence, 'SILENCE', '#d58bff'], [ST.slow, 'SLOW', '#9fe8ff'], [ST.recall, 'RECALL', '#9fe8ff'], [ST.revealed, 'REVEALED', '#ff9a6b'], [ST.channel, 'CHANNEL', '#ffb36b']];
      let ty = y + h + 16 * s;
      g.font = `800 ${10 * s}px system-ui`;
      for (const [bit, label, c] of tags) {
        if (!(e.st & bit)) continue;
        if (bit === ST.revealed && ally === false) continue;
        g.strokeText(label, p.x, ty); g.fillStyle = c; g.fillText(label, p.x, ty);
        ty += 11 * s;
      }
      if (e.st & ST.glint && !ally) { g.fillStyle = '#e8ffff'; g.beginPath(); g.arc(p.x + w / 2 + 8, y + 4, 4 + Math.sin(performance.now() / 80) * 2, 0, Math.PI * 2); g.fill(); }
    }
    if (big) {
      g.font = `700 ${10 * s}px system-ui`; g.textAlign = 'center';
      if (e.st & ST.invuln && !ally) { g.fillStyle = '#cfe8ff'; g.fillText('🔒 protected', p.x, y - 4); }
      else if (e.st & ST.backdoor && !ally) { g.fillStyle = '#9fe8ff'; g.fillText('backdoor ward −60%', p.x, y - 4); }
    }
    if (e.k === K.Monster && hover) { g.font = `700 ${11 * s}px system-ui`; g.textAlign = 'center'; g.fillStyle = '#ffe9a0'; g.fillText(e.name ?? e.sub ?? '', p.x, y - 4); }
    if (hover) { g.strokeStyle = '#ffffff'; g.lineWidth = 1.5; g.strokeRect(x - 2, y - 2, w + 4, h + 4); }
  }
}
