// Buy menu: keyboard-first (B, category number, item number) with full mouse support. Shows money, the predicted
// minimum income for next round, teammate money and equipment, and supports refunds during the buy phase.

import { ARMOR, ECON, UTILITY, UTILITY_LIST } from '../content/economy';
import { WEAPONS, WeaponId } from '../content/weapons';
import type { RosterEntry, Snapshot } from '../protocol/schema';
import type { Side } from '../sim/types';
import { el, esc } from './hud';

interface Item { id: string; name: string; price: number; blurb: string; cat: number; weapon?: WeaponId; side?: Side }

const CATS = ['Sidearms', 'SMGs', 'Rifles', 'Heavy', 'Armor & Kit', 'Utility'];

function buildItems(): Item[] {
  const items: Item[] = [];
  const w = (id: WeaponId, cat: number) => items.push({ id, name: WEAPONS[id].name, price: WEAPONS[id].price, blurb: WEAPONS[id].blurb, cat, weapon: id });
  w('vela', 0); w('rook', 0); w('needle', 0);
  w('kite', 1); w('vectora', 1);
  w('aster', 2); w('krait', 2); w('lumen', 2);
  w('longglass', 3); w('sable', 3); w('rampart', 3); w('atlas', 3);
  items.push({ id: 'vest', name: ARMOR.vest.name, price: ARMOR.vest.price, blurb: 'Absorbs part of body damage. Degrades as it absorbs.', cat: 4 });
  items.push({ id: 'vesthelmet', name: ARMOR.vestHelmet.name, price: ARMOR.vestHelmet.price, blurb: 'Vest plus a helmet that cuts headshot damage.', cat: 4 });
  items.push({ id: 'helmet', name: 'Helmet', price: ARMOR.helmetUpgrade, blurb: 'Helmet only (upgrade).', cat: 4 });
  items.push({ id: 'kit', name: ARMOR.kit.name, price: ARMOR.kit.price, blurb: 'Disarm the Cipher in 5 s instead of 8 s. Custodians only.', cat: 4, side: 'cus' });
  for (const u of UTILITY_LIST) items.push({ id: u.id, name: u.name, price: u.price, blurb: u.blurb, cat: 5 });
  return items;
}
const ITEMS = buildItems();

export interface BuyView {
  snap: Snapshot;
  side: Side;
  practice: boolean;
}

export class BuyMenu {
  readonly root: HTMLElement;
  private cat = 2;
  private catsEl: HTMLElement;
  private itemsEl: HTMLElement;
  private sideEl: HTMLElement;
  open = false;
  onBuy: (id: string) => void = () => undefined;
  onRefund: (id: string) => void = () => undefined;
  onClose: () => void = () => undefined;
  private view: BuyView | null = null;
  private lastKey = '';

  constructor(parent: HTMLElement) {
    this.root = el('div', 'overlay hidden');
    const box = el('div', 'buy');
    const left = el('div'); left.innerHTML = '<h3>Buy menu</h3>';
    this.catsEl = el('div', 'cats'); left.append(this.catsEl);
    const hint = el('div'); hint.style.cssText = 'margin-top:14px;color:var(--dim);font-size:12px;line-height:1.6';
    hint.innerHTML = '<kbd>1-6</kbd> category · <kbd>1-9</kbd> item<br>Click an owned, unused item to refund<br><kbd>B</kbd> / <kbd>Esc</kbd> close';
    left.append(hint);
    const mid = el('div'); mid.style.cssText = 'display:flex;flex-direction:column;min-height:0';
    mid.innerHTML = '<h3 id="buy-cat-title">Rifles</h3>';
    this.itemsEl = el('div', 'items'); mid.append(this.itemsEl);
    this.sideEl = el('div', 'side');
    box.append(left, mid, this.sideEl);
    this.root.append(box);
    parent.append(this.root);
    this.root.addEventListener('mousedown', (e) => { if (e.target === this.root) this.onClose(); });
    this.renderCats();
  }

  show(v: boolean): void {
    this.open = v;
    this.root.classList.toggle('hidden', !v);
    this.lastKey = '';
  }

  private renderCats(): void {
    this.catsEl.innerHTML = '';
    CATS.forEach((c, i) => {
      const d = el('div', 'cat' + (i === this.cat ? ' on' : ''), `<kbd>${i + 1}</kbd>${c}`);
      d.addEventListener('click', () => { this.cat = i; this.lastKey = ''; this.renderCats(); this.render(); });
      this.catsEl.append(d);
    });
  }

  /** Returns true if the key was consumed. */
  handleKey(code: string): boolean {
    if (!this.open) return false;
    if (code === 'KeyB' || code === 'Escape') { this.onClose(); return true; }
    const m = /^Digit(\d)$/.exec(code);
    if (!m) return false;
    const n = Number(m[1]);
    // First digit chooses a category if we are in "category mode"; numbers 1-6 always pick items of the visible category when
    // pressed twice quickly - keep it simple: 1-6 category, Shift+digit not needed; items via Numpad or digits 7-9.
    const visible = this.visibleItems();
    if (this.itemMode) {
      const it = visible[n - 1];
      this.itemMode = false;
      if (it) this.activate(it);
      return true;
    }
    if (n >= 1 && n <= CATS.length) {
      this.cat = n - 1;
      this.itemMode = true;
      setTimeout(() => { this.itemMode = false; }, 2500);
      this.lastKey = '';
      this.renderCats();
      this.render();
      return true;
    }
    return true;
  }
  private itemMode = false;

  private visibleItems(): Item[] {
    return ITEMS.filter((i) => i.cat === this.cat && (!i.side || i.side === this.view?.side));
  }

  private owned(it: Item): boolean {
    const me = this.view!.snap.self;
    if (it.weapon) {
      const slot = WEAPONS[it.weapon].slot === 'secondary' ? me.weapons.secondary : me.weapons.primary;
      return !!slot && slot.id === it.weapon;
    }
    if (it.id === 'vest') return me.armor >= 100;
    if (it.id === 'helmet') return me.helmet;
    if (it.id === 'vesthelmet') return me.armor >= 100 && me.helmet;
    if (it.id === 'kit') return me.kit;
    const u = UTILITY[it.id as keyof typeof UTILITY];
    return !!u && me.util.filter((x) => x === u.id).length >= u.max;
  }

  private activate(it: Item): void {
    const v = this.view!;
    const me = v.snap.self;
    const refundable = !v.practice && me.purchases.includes(it.id) && v.snap.phase === 'buy';
    if (this.owned(it) && refundable) { this.onRefund(it.id); return; }
    this.onBuy(it.id);
  }

  update(v: BuyView): void {
    this.view = v;
    if (!this.open) return;
    this.render();
  }

  private render(): void {
    const v = this.view;
    if (!v) return;
    const me = v.snap.self;
    const key = JSON.stringify([this.cat, me.money, me.weapons.primary?.id, me.weapons.secondary?.id, me.armor, me.helmet, me.kit, me.util, me.purchases, me.canBuy, v.snap.phase, v.snap.roster?.map((r) => [r.money, r.primary, r.secondary, r.alive, r.util?.length])]);
    if (key === this.lastKey) return;
    this.lastKey = key;
    const title = this.root.querySelector('#buy-cat-title');
    if (title) title.textContent = CATS[this.cat];
    this.itemsEl.innerHTML = '';
    const list = this.visibleItems();
    list.forEach((it, i) => {
      const price = it.id === 'vesthelmet' ? ARMOR.vestHelmet.price - (me.armor >= 100 ? ARMOR.vest.price : 0) - (me.helmet ? ARMOR.helmetUpgrade : 0) : it.price;
      const owned = this.owned(it);
      const refundable = !v.practice && me.purchases.includes(it.id) && v.snap.phase === 'buy';
      const canAfford = v.practice || me.money >= price;
      const disabled = (!me.canBuy) || (!canAfford && !(owned && refundable)) || (owned && !refundable && it.weapon === undefined && it.cat !== 5);
      const d = el('div', 'item' + (owned ? ' owned' : '') + (disabled ? ' disabled' : ''));
      let stats = '';
      if (it.weapon) {
        const w = WEAPONS[it.weapon];
        const bar = (label: string, frac: number) => `<span>${label}</span><i><b style="width:${Math.max(4, Math.min(100, frac * 100))}%"></b></i>`;
        if (w.mode !== 'melee') stats = `<div class="st">${bar('Damage', (w.damage * Math.min(w.pellets, 4) * (w.pellets > 1 ? 0.7 : 1)) / 125)}${bar('Rate', Math.min(1, (w.mode === 'bolt' ? 90 : w.rpm) / 900))}${bar('Mobility', w.moveSpeed / 5.4)}${bar('Armor pen', w.armorPen)}</div>`;
      }
      d.innerHTML = `<div class="top"><span class="nm">${esc(it.name)}</span><span class="pr">${price > 0 ? '$' + price.toLocaleString() : ''}</span></div><div class="ds">${esc(it.blurb)}</div>${stats}<span class="key"><kbd>${i + 1}</kbd></span>${owned ? `<span class="own-tag">${refundable ? 'OWNED · CLICK TO REFUND' : 'OWNED'}</span>` : ''}`;
      d.addEventListener('click', () => { if (!disabled) this.activate(it); });
      this.itemsEl.append(d);
    });

    // side panel
    const tier = v.snap.lossTier[me.id < 5 ? 0 : 1];
    const mates = (v.snap.roster ?? []).filter((r) => r.side === v.side);
    const eq = (r: RosterEntry) => [r.primary ? WEAPONS[r.primary].name : r.secondary ? WEAPONS[r.secondary].name : 'Pistol', (r.armor ?? 0) > 0 ? (r.helmet ? 'Vest+Helm' : 'Vest') : '', r.kit ? 'Kit' : '', ...(r.util ?? []).map((u) => UTILITY[u].name.split(' ')[0])].filter(Boolean).join(' · ');
    this.sideEl.innerHTML = `<h3>Your money</h3><div class="cash">$${me.money.toLocaleString()}</div>
      <div style="color:var(--dim);font-size:12px;letter-spacing:.06em">Next round minimum: <b style="color:#9dff9a">$${ECON.lossBase + ECON.lossStep * tier}</b> (loss) · <b style="color:#9dff9a">$${ECON.roundWin}</b> (win)${v.side === 'int' ? '<br>Arming the Cipher earns $600 for the team even in defeat.' : ''}</div>
      ${me.canBuy ? '' : '<div style="color:var(--bad);font-size:13px">Buying is locked: ' + (v.snap.phase === 'buy' ? 'return to your spawn area' : 'buy phase is over') + '.</div>'}
      <h3 style="margin-top:8px">Team</h3>
      ${mates.map((r) => `<div class="team-row"><span>${esc(r.name)}${r.id === me.id ? ' (you)' : ''}</span><span style="color:#9dff9a">$${(r.money ?? 0).toLocaleString()}</span><span class="eq">${esc(eq(r))}</span></div>`).join('')}`;
  }
}
