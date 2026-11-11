import { useEffect, useMemo, useState } from 'react';
import { ARMOR, TICK_RATE, UTILITY, lossBonus, type UtilityId } from '../content/rules';
import { WEAPONS, type WeaponId } from '../content/weapons';
import type { ItemId, Snapshot } from '../protocol/messages';
import type { UiState } from '../client/game';
import { ITEM_NAME } from './hud';

interface Cat {
  name: string;
  items: ItemId[];
}

const CATS: Cat[] = [
  { name: 'Sidearms', items: ['vela', 'rook', 'needle'] },
  { name: 'SMGs', items: ['kite', 'vectora'] },
  { name: 'Rifles', items: ['lumen', 'aster', 'krait'] },
  { name: 'Precision / Heavy', items: ['rampart', 'sable', 'atlas', 'longglass'] },
  { name: 'Gear', items: ['vest', 'vesthelm', 'kit'] },
  { name: 'Utility', items: ['veil', 'flash', 'thermite', 'pulse', 'frag'] },
];

function price(snap: Snapshot, item: ItemId): number {
  const y = snap.you;
  if (item === 'vest') return ARMOR.vest;
  if (item === 'vesthelm') return y.armor >= 100 && !y.helmet ? ARMOR.helmetOnly : ARMOR.vestHelmet;
  if (item === 'kit') return ARMOR.kit;
  if (item in UTILITY) return UTILITY[item as UtilityId].price;
  return WEAPONS[item as WeaponId].price;
}

function blurb(item: ItemId): string {
  if (item in WEAPONS) return WEAPONS[item as WeaponId].blurb;
  if (item in UTILITY) return UTILITY[item as UtilityId].blurb;
  if (item === 'vest') return 'Absorbs body damage. Degrades as it is hit.';
  if (item === 'vesthelm') return 'Vest plus helmet: reduces head damage.';
  return 'Custodians only: disarm in 5 s instead of 8 s.';
}

function blocked(snap: Snapshot, item: ItemId, infinite: boolean): string | null {
  const y = snap.you;
  if (!infinite && y.money < price(snap, item)) return 'Not enough money';
  if (item === 'kit') return y.side !== 'custodian' ? 'Custodians only' : y.kit ? 'Owned' : null;
  if (item === 'vest') return y.armor >= 100 ? 'Owned' : null;
  if (item === 'vesthelm') return y.armor >= 100 && y.helmet ? 'Owned' : null;
  if (item in UTILITY) {
    if (y.utils.length >= 4) return 'Utility full';
    if (y.utils.filter((u) => u === item).length >= UTILITY[item as UtilityId].cap) return 'Carry limit';
    return null;
  }
  const d = WEAPONS[item as WeaponId];
  const cur = d.slot === 'primary' ? y.primary : y.secondary;
  if (cur?.id === item) return 'Owned';
  return null;
}

export function BuyMenu({ ui, onBuy, onRefund, onClose }: { ui: UiState; onBuy: (i: ItemId) => void; onRefund: (i: ItemId) => void; onClose: () => void }) {
  const snap = ui.snap;
  const [cat, setCat] = useState(-1);
  const infinite = snap.practice;
  const team = snap.teams[snap.you.team];
  const left = (snap.phaseEndTick - snap.tick) / TICK_RATE;
  const nextMin = snap.you.money + Math.min(3100, lossBonus(Math.min(4, team.lossTier + 1)));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      const m = /^Digit(\d)$/.exec(e.code);
      if (!m) return;
      const n = Number(m[1]);
      e.preventDefault();
      if (cat < 0) {
        if (n >= 1 && n <= CATS.length) setCat(n - 1);
      } else {
        if (n === 0) setCat(-1);
        const it = CATS[cat].items[n - 1];
        if (it) {
          onBuy(it);
          setCat(-1);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cat, onBuy, onClose]);

  const mates = useMemo(() => snap.players.filter((p) => p.team === snap.you.team), [snap]);

  return (
    <div className="overlay buy" onContextMenu={(e) => e.preventDefault()}>
      <div className="buy-head">
        <div>
          <div className="eyebrow">{snap.practice ? 'PRACTICE ARMORY' : `BUY PHASE · ${Math.max(0, Math.ceil(left))} s`}</div>
          <div className="money">${snap.you.money.toLocaleString()}</div>
          {!snap.practice && <div className="dim small">If you lose next round you will have at least ${Math.min(12000, nextMin).toLocaleString()}</div>}
        </div>
        <div className="buy-keys dim small">Number keys: category, then item · 0 back · B / Esc close</div>
      </div>
      <div className="buy-grid">
        {CATS.map((c, ci) => (
          <div key={c.name} className={`buy-cat${cat === ci ? ' sel' : ''}`}>
            <div className="cat-name"><kbd>{ci + 1}</kbd>{c.name}</div>
            {c.items.map((it, ii) => {
              const b = blocked(snap, it, infinite);
              const owned = b === 'Owned';
              return (
                <button key={it} className={`buy-item${b ? ' off' : ''}${owned ? ' owned' : ''}`} onClick={() => !b && onBuy(it)} title={blurb(it)}>
                  <span className="k">{ii + 1}</span>
                  <span className="nm">{ITEM_NAME(it)}</span>
                  <span className="pr">{infinite ? 'free' : `$${price(snap, it)}`}</span>
                  {b && <span className="bl">{b}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="buy-foot">
        <div className="team-eq">
          <div className="eyebrow">TEAM</div>
          {mates.map((m) => (
            <div key={m.id} className={`mate${m.alive ? '' : ' dead'}`}>
              <span className="nm">{m.name}</span>
              <span className="eq">{m.primary ? WEAPONS[m.primary].name : m.secondary ? WEAPONS[m.secondary].name : '—'}</span>
              <span className="eq">{m.armor ? (m.helmet ? 'Vest+Helm' : 'Vest') : ''}{m.kit ? ' · Kit' : ''}{m.hasSpike ? ' · Cipher' : ''}</span>
              <span className="mn">${(m.money ?? 0).toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="refunds">
          <div className="eyebrow">REFUNDS</div>
          {snap.you.refundable.length === 0 && <div className="dim small">Unused purchases can be refunded here during the buy phase.</div>}
          {[...new Set(snap.you.refundable)].map((it) => (
            <button key={it} className="ghost" onClick={() => onRefund(it)}>
              Refund {ITEM_NAME(it)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
