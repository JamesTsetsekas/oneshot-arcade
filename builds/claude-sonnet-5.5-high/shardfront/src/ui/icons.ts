// ui: procedural icons / portraits (original vector art drawn at runtime, cached as data URLs).
import { defById } from '../data';

const cache = new Map<string, string>();

function hexPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
  }
  ctx.closePath();
}

function glyph(ctx: CanvasRenderingContext2D, key: string, fg: string) {
  ctx.strokeStyle = fg; ctx.fillStyle = fg; ctx.lineWidth = 3.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const c = 32;
  const line = (x1: number, y1: number, x2: number, y2: number) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
  switch (key) {
    case 'worker': line(18, 46, 38, 26); ctx.beginPath(); ctx.arc(42, 22, 8, 0.6, 5.6); ctx.stroke(); line(24, 40, 30, 46); break;
    case 'scout': ctx.beginPath(); ctx.ellipse(c, c, 17, 10, 0, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(c, c, 5, 0, Math.PI * 2); ctx.fill(); break;
    case 'basic': for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(18, 24 + i * 9); ctx.lineTo(c, 14 + i * 9); ctx.lineTo(46, 24 + i * 9); ctx.stroke(); } break;
    case 'antiarmor': line(14, 50, 50, 14); ctx.beginPath(); ctx.moveTo(50, 14); ctx.lineTo(40, 16); ctx.lineTo(48, 24); ctx.closePath(); ctx.fill(); line(20, 40, 26, 46); break;
    case 'support': line(c, 16, c, 48); line(16, c, 48, c); ctx.beginPath(); ctx.arc(c, c, 16, 0, Math.PI * 2); ctx.stroke(); break;
    case 'siege': ctx.beginPath(); ctx.arc(24, 42, 9, 0, Math.PI * 2); ctx.stroke(); line(28, 36, 48, 16); ctx.beginPath(); ctx.arc(50, 14, 3, 0, Math.PI * 2); ctx.fill(); break;
    case 'heavy': ctx.beginPath(); ctx.moveTo(c, 12); ctx.lineTo(50, 20); ctx.lineTo(46, 42); ctx.lineTo(c, 52); ctx.lineTo(18, 42); ctx.lineTo(14, 20); ctx.closePath(); ctx.stroke(); line(c, 22, c, 42); break;
    case 'ranged': for (const [x, y, r] of [[22, 40, 4], [32, 30, 5], [44, 20, 6]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); } break;
    case 'hall': hexPath(ctx, c, c, 18); ctx.stroke(); hexPath(ctx, c, c, 8); ctx.fill(); break;
    case 'supply': ctx.beginPath(); ctx.moveTo(36, 10); ctx.lineTo(20, 34); ctx.lineTo(31, 34); ctx.lineTo(26, 54); ctx.lineTo(44, 28); ctx.lineTo(33, 28); ctx.closePath(); ctx.fill(); break;
    case 'production': ctx.strokeRect(14, 24, 36, 26); ctx.beginPath(); ctx.moveTo(14, 24); ctx.lineTo(c, 12); ctx.lineTo(50, 24); ctx.stroke(); ctx.fillRect(26, 36, 12, 14); break;
    case 'tech': ctx.beginPath(); ctx.moveTo(c, 10); ctx.lineTo(50, c); ctx.lineTo(c, 54); ctx.lineTo(14, c); ctx.closePath(); ctx.stroke(); ctx.beginPath(); ctx.arc(c, c, 5, 0, Math.PI * 2); ctx.fill(); break;
    case 'tap': ctx.beginPath(); ctx.moveTo(c, 10); ctx.bezierCurveTo(48, 30, 46, 52, c, 52); ctx.bezierCurveTo(18, 52, 16, 30, c, 10); ctx.closePath(); ctx.fill(); break;
    case 'defense': ctx.beginPath(); ctx.arc(c, c, 16, 0, Math.PI * 2); ctx.stroke(); line(c, 10, c, 22); line(c, 42, c, 54); line(10, c, 22, c); line(42, c, 54, c); break;
    case 'attack': line(14, 50, 46, 18); line(36, 14, 50, 28); line(18, 42, 26, 50); break;
    case 'armor': ctx.beginPath(); ctx.moveTo(c, 12); ctx.lineTo(48, 20); ctx.lineTo(44, 44); ctx.lineTo(c, 54); ctx.lineTo(20, 44); ctx.lineTo(16, 20); ctx.closePath(); ctx.fill(); break;
    case 'unlock': ctx.strokeRect(18, 28, 28, 22); ctx.beginPath(); ctx.arc(c, 24, 9, Math.PI, 0); ctx.stroke(); break;
    case 'move': line(12, c, 50, c); ctx.beginPath(); ctx.moveTo(52, c); ctx.lineTo(38, 20); ctx.lineTo(38, 44); ctx.closePath(); ctx.fill(); break;
    case 'stop': ctx.fillRect(18, 18, 28, 28); break;
    case 'hold': ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = (Math.PI / 4) * i + Math.PI / 8; const x = c + Math.cos(a) * 18, y = c + Math.sin(a) * 18; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.closePath(); ctx.stroke(); line(c, 22, c, 42); break;
    case 'attackmove': ctx.beginPath(); ctx.arc(c, c, 14, 0, Math.PI * 2); ctx.stroke(); line(c, 8, c, 20); line(c, 44, c, 56); line(8, c, 20, c); line(44, c, 56, c); ctx.beginPath(); ctx.arc(c, c, 3, 0, Math.PI * 2); ctx.fill(); break;
    case 'patrol': line(12, 24, 52, 24); line(12, 40, 52, 40); ctx.beginPath(); ctx.moveTo(54, 24); ctx.lineTo(44, 16); ctx.lineTo(44, 32); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(10, 40); ctx.lineTo(20, 32); ctx.lineTo(20, 48); ctx.closePath(); ctx.fill(); break;
    case 'build': ctx.strokeRect(14, 30, 36, 20); line(14, 30, c, 14); line(c, 14, 50, 30); line(c, 30, c, 50); break;
    case 'rally': line(20, 52, 20, 12); ctx.beginPath(); ctx.moveTo(20, 12); ctx.lineTo(48, 20); ctx.lineTo(20, 30); ctx.closePath(); ctx.fill(); break;
    case 'ability': ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = (Math.PI / 5) * i - Math.PI / 2; const r = i % 2 ? 8 : 19; const x = c + Math.cos(a) * r, y = c + Math.sin(a) * r; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.closePath(); ctx.fill(); break;
    case 'cancel': line(18, 18, 46, 46); line(46, 18, 18, 46); break;
    case 'back': line(46, c, 18, c); ctx.beginPath(); ctx.moveTo(14, c); ctx.lineTo(28, 20); ctx.lineTo(28, 44); ctx.closePath(); ctx.fill(); break;
    case 'idle': ctx.beginPath(); ctx.arc(c, 22, 8, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(c, 50, 16, Math.PI, 0); ctx.stroke(); break;
    default: ctx.beginPath(); ctx.arc(c, c, 12, 0, Math.PI * 2); ctx.stroke();
  }
}

export function iconURL(key: string, accent: string, size = 64): string {
  const ck = key + accent + size;
  const hit = cache.get(ck);
  if (hit) return hit;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d')!;
  ctx.scale(size / 64, size / 64);
  const g = ctx.createLinearGradient(0, 0, 0, 64);
  g.addColorStop(0, '#1a212b'); g.addColorStop(1, '#0c1016');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = accent;
  hexPath(ctx, 32, 32, 30);
  ctx.fill();
  ctx.globalAlpha = 1;
  glyph(ctx, key, accent);
  const url = cv.toDataURL();
  cache.set(ck, url);
  return url;
}

/** icon for an entity def id (role glyph tinted by faction accent) */
export function defIcon(defId: string): string {
  const d = defById(defId);
  const accent = d.faction === 'verdant' ? '#c9a0ff' : d.faction === 'helix' ? '#ffc75a' : '#7de9d6';
  const role = d.kind === 'neutral' ? (d.id === 'ore_seam' ? 'tap' : 'tech') : d.role;
  return iconURL(role === 'scout' && d.kind === 'unit' ? 'scout' : role, accent);
}
