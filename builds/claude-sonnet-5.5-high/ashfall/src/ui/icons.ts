// Procedural item / skill icons drawn on a canvas and cached as data URLs.
import { BASE_BY_ID } from '../data/items';
import type { Item, PotionKind } from '../sim/types';

const cache = new Map<string, string>();
const TIER_METAL = ['#8a6a4a', '#b0a070', '#5fa090', '#7ae8ff'];
export const RARITY_CSS: Record<string, string> = { worn: '#b8b8b8', tempered: '#6aa8ff', inscribed: '#ffd45a', relic: '#ff7a3a' };
export const RARITY_ICON: Record<string, string> = { worn: '▫', tempered: '◆', inscribed: '✦', relic: '♛' };
export const RARITY_NAME: Record<string, string> = { worn: 'Worn', tempered: 'Tempered', inscribed: 'Inscribed', relic: 'Relic' };

function canvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  return [c, c.getContext('2d')!];
}

function drawShape(ctx: CanvasRenderingContext2D, shape: string, metal: string, glyphColor?: string) {
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#1b1612';
  ctx.fillStyle = metal;
  ctx.lineJoin = 'round';
  const dark = '#3a2e24';
  const path = (pts: number[][], fill = metal) => {
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.stroke();
  };
  switch (shape) {
    case 'mace':
      path([[30, 54], [34, 54], [35, 26], [29, 26]], dark);
      ctx.beginPath();
      ctx.arc(32, 18, 11, 0, 7);
      ctx.fillStyle = metal;
      ctx.fill();
      ctx.stroke();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * 6.28;
        path([[32 + Math.cos(a) * 10, 18 + Math.sin(a) * 10], [32 + Math.cos(a + 0.2) * 15, 18 + Math.sin(a + 0.2) * 15], [32 + Math.cos(a + 0.4) * 10, 18 + Math.sin(a + 0.4) * 10]]);
      }
      break;
    case 'maul':
      path([[30, 56], [34, 56], [35, 24], [29, 24]], dark);
      path([[14, 8], [50, 8], [50, 28], [14, 28]]);
      path([[14, 8], [20, 4], [44, 4], [50, 8]], '#ddd');
      break;
    case 'bow':
      ctx.beginPath();
      ctx.arc(12, 32, 30, -1.05, 1.05);
      ctx.lineWidth = 5;
      ctx.strokeStyle = metal;
      ctx.stroke();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ddd';
      ctx.beginPath();
      ctx.moveTo(27, 6);
      ctx.lineTo(27, 58);
      ctx.stroke();
      ctx.strokeStyle = '#1b1612';
      break;
    case 'shield':
      path([[12, 8], [52, 8], [52, 32], [32, 58], [12, 32]]);
      path([[28, 16], [36, 16], [36, 40], [32, 46], [28, 40]], glyphColor ?? '#c9a468');
      break;
    case 'quiver':
      path([[22, 20], [42, 20], [38, 58], [26, 58]], dark);
      for (let i = 0; i < 4; i++) path([[26 + i * 4, 20], [28 + i * 4, 8], [30 + i * 4, 20]], '#e8e0c8');
      break;
    case 'helm':
      ctx.beginPath();
      ctx.arc(32, 32, 20, Math.PI, 0);
      ctx.lineTo(52, 50);
      ctx.lineTo(12, 50);
      ctx.closePath();
      ctx.fillStyle = metal;
      ctx.fill();
      ctx.stroke();
      path([[20, 34], [44, 34], [44, 40], [20, 40]], '#111');
      break;
    case 'chest':
      path([[10, 14], [24, 8], [40, 8], [54, 14], [48, 54], [16, 54]]);
      path([[24, 8], [32, 18], [40, 8]], dark);
      path([[18, 40], [46, 40], [46, 46], [18, 46]], '#c9a468');
      break;
    case 'gloves':
      path([[20, 54], [20, 30], [18, 12], [24, 12], [26, 26], [28, 8], [34, 8], [34, 26], [38, 10], [43, 10], [42, 28], [48, 18], [52, 22], [46, 40], [44, 54]]);
      break;
    case 'boots':
      path([[22, 8], [38, 8], [38, 38], [54, 46], [54, 56], [20, 56], [22, 8]]);
      path([[20, 50], [54, 50], [54, 56], [20, 56]], dark);
      break;
    case 'belt':
      path([[6, 24], [58, 24], [58, 40], [6, 40]], dark);
      path([[24, 22], [40, 22], [40, 42], [24, 42]]);
      break;
    case 'amulet':
      ctx.beginPath();
      ctx.arc(32, 22, 18, 0.2, Math.PI - 0.2, false);
      ctx.strokeStyle = '#8a7a50';
      ctx.lineWidth = 3;
      ctx.stroke();
      path([[32, 30], [42, 42], [32, 56], [22, 42]], glyphColor ?? metal);
      break;
    case 'ring':
      ctx.beginPath();
      ctx.arc(32, 38, 15, 0, 7);
      ctx.lineWidth = 7;
      ctx.strokeStyle = metal;
      ctx.stroke();
      path([[32, 8], [40, 16], [32, 24], [24, 16]], glyphColor ?? '#cde');
      break;
    case 'glyph':
      path([[32, 6], [54, 18], [54, 46], [32, 58], [10, 46], [10, 18]], '#2a2a36');
      ctx.strokeStyle = glyphColor ?? '#ff7a3c';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(32, 16);
      ctx.lineTo(32, 48);
      ctx.moveTo(20, 28);
      ctx.lineTo(44, 28);
      ctx.moveTo(22, 40);
      ctx.lineTo(42, 40);
      ctx.stroke();
      break;
    default:
      path([[12, 12], [52, 12], [52, 52], [12, 52]]);
  }
}

export function itemIcon(item: Item): string {
  const b = BASE_BY_ID[item.base];
  const key = `${item.base}`;
  let u = cache.get(key);
  if (!u) {
    const [c, ctx] = canvas();
    let glyphColor: string | undefined;
    if (b.group === 'glyph') glyphColor = item.base.includes('ember') ? '#ff7a3c' : item.base.includes('ward') ? '#b9c4ce' : item.base.includes('keen') ? '#ffd56a' : '#e0505a';
    drawShape(ctx, b.shape, b.group === 'glyph' ? '#444' : TIER_METAL[b.tier - 1], glyphColor);
    u = c.toDataURL();
    cache.set(key, u);
  }
  return u;
}

export function potionIcon(kind: PotionKind): string {
  const key = `potion_${kind}`;
  let u = cache.get(key);
  if (!u) {
    const [c, ctx] = canvas();
    const col = { health: '#d8404c', focus: '#4a8cff', cleanse: '#e8eef2', tonic: '#e8b84a' }[kind];
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#1b1612';
    ctx.beginPath();
    ctx.arc(32, 40, 17, 0, 7);
    ctx.fillStyle = col;
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#8a8a8a';
    ctx.fillRect(27, 12, 10, 14);
    ctx.strokeRect(27, 12, 10, 14);
    ctx.fillStyle = '#6a4a30';
    ctx.fillRect(25, 8, 14, 6);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.arc(26, 36, 5, 0, 7);
    ctx.fill();
    u = c.toDataURL();
    cache.set(key, u);
  }
  return u;
}

const SKILL_COL: Record<string, string> = { ember: '#ff7a3c', frost: '#9fd4ff', blight: '#b36bff', phys: '#e8e0c8', buff: '#ffd56a', move: '#5ee0d0' };
export function skillIcon(id: string, tags: string[]): string {
  const key = `skill_${id}`;
  let u = cache.get(key);
  if (!u) {
    const [c, ctx] = canvas();
    const col = tags.includes('ember') ? SKILL_COL.ember : tags.includes('frost') ? SKILL_COL.frost : tags.includes('blight') ? SKILL_COL.blight : tags.includes('buff') ? SKILL_COL.buff : tags.includes('movement') ? SKILL_COL.move : SKILL_COL.phys;
    ctx.fillStyle = '#17141a';
    ctx.fillRect(0, 0, 64, 64);
    ctx.strokeStyle = col;
    ctx.fillStyle = col;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    const a = (n: number) => (n * Math.PI) / 180;
    switch (id) {
      case 'iron_litany':
        ctx.beginPath();
        ctx.arc(32, 32, 20, a(200), a(340));
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(32, 32, 10, a(200), a(340));
        ctx.stroke();
        break;
      case 'brand_arc':
        ctx.beginPath();
        ctx.arc(32, 44, 26, a(215), a(325));
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(32, 30);
        ctx.lineTo(26, 18);
        ctx.lineTo(32, 22);
        ctx.lineTo(38, 12);
        ctx.lineTo(37, 26);
        ctx.stroke();
        break;
      case 'bastion_step':
        ctx.fillRect(14, 20, 12, 24);
        ctx.beginPath();
        ctx.moveTo(30, 32);
        ctx.lineTo(54, 32);
        ctx.moveTo(46, 24);
        ctx.lineTo(54, 32);
        ctx.lineTo(46, 40);
        ctx.stroke();
        break;
      case 'cinder_ring':
        ctx.beginPath();
        ctx.arc(32, 32, 22, 0, 7);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(32, 32, 8, 0, 7);
        ctx.fill();
        break;
      case 'vow_chain':
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.ellipse(14 + i * 12, 32, 8, 5, i % 2 ? 0 : 1.2, 0, 7);
          ctx.stroke();
        }
        break;
      case 'furnace_heart':
        ctx.beginPath();
        ctx.moveTo(32, 54);
        ctx.bezierCurveTo(8, 36, 14, 10, 32, 22);
        ctx.bezierCurveTo(50, 10, 56, 36, 32, 54);
        ctx.fill();
        break;
      case 'ashen_standard':
        ctx.beginPath();
        ctx.moveTo(22, 56);
        ctx.lineTo(22, 8);
        ctx.stroke();
        ctx.fillRect(24, 10, 26, 18);
        break;
      case 'quickshot':
        ctx.beginPath();
        ctx.moveTo(8, 50);
        ctx.lineTo(54, 14);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(54, 14);
        ctx.lineTo(42, 14);
        ctx.moveTo(54, 14);
        ctx.lineTo(54, 26);
        ctx.stroke();
        break;
      case 'splinter_volley':
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.moveTo(12, 50);
          ctx.lineTo(52, 12 + i * 9);
          ctx.stroke();
        }
        break;
      case 'ghostline':
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(6, 32);
        ctx.lineTo(58, 32);
        ctx.stroke();
        for (const x of [20, 36, 50]) {
          ctx.beginPath();
          ctx.moveTo(x, 22);
          ctx.lineTo(x + 6, 32);
          ctx.lineTo(x, 42);
          ctx.lineTo(x - 6, 32);
          ctx.closePath();
          ctx.stroke();
        }
        break;
      case 'snare_bloom':
        for (let i = 0; i < 6; i++) {
          ctx.beginPath();
          ctx.ellipse(32 + Math.cos(i) * 14, 32 + Math.sin(i) * 14, 9, 5, i, 0, 7);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(32, 32, 5, 0, 7);
        ctx.fill();
        break;
      case 'mothcloak':
        ctx.beginPath();
        ctx.moveTo(32, 10);
        ctx.lineTo(54, 50);
        ctx.lineTo(32, 42);
        ctx.lineTo(10, 50);
        ctx.closePath();
        ctx.stroke();
        break;
      case 'backstep_flask':
        ctx.beginPath();
        ctx.arc(26, 40, 14, 0, 7);
        ctx.stroke();
        ctx.fillRect(22, 10, 8, 14);
        ctx.beginPath();
        ctx.moveTo(40, 20);
        ctx.lineTo(56, 8);
        ctx.stroke();
        break;
      case 'horizon_call':
        for (let i = 0; i < 6; i++) {
          ctx.beginPath();
          ctx.moveTo(12 + i * 8, 6);
          ctx.lineTo(8 + i * 8, 24);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(6, 52);
        ctx.lineTo(58, 52);
        ctx.stroke();
        break;
      default:
        ctx.beginPath();
        ctx.arc(32, 32, 18, 0, 7);
        ctx.stroke();
    }
    u = c.toDataURL();
    cache.set(key, u);
  }
  return u;
}
