/** Item shop: search, filters, recipe tree, owned components, buy / sell / undo, explainable recommendations. */
import { HERO_BY_ID, ITEMS, ITEM_BY_ID, SELL_RATE, STAT_LABEL, formatStat, type ItemDef } from '../shared/content';
import type { Sim } from '../sim/sim';
import { quote } from '../sim/items';
import { clear, h } from './dom';
import { audio } from './audio';

type Filter = 'recommended' | 'all' | 'attack' | 'ability' | 'defense' | 'movement' | 'support' | 'starter' | 'consumable';

export class Shop {
  el: HTMLElement;
  private grid!: HTMLElement; private detail!: HTMLElement; private inv!: HTMLElement; private goldEl!: HTMLElement; private note!: HTMLElement;
  private filter: Filter = 'recommended';
  private query = '';
  private selected: string | null = null;
  private visible = false;
  private tabs = new Map<Filter, HTMLElement>();
  constructor(private sim: Sim, private send: (c: Record<string, unknown>) => void, private close: () => void) {
    this.el = h('div', { class: 'shop panel hidden' });
    this.build();
  }
  get open() { return this.visible; }
  show(v: boolean) {
    this.visible = v;
    this.el.classList.toggle('hidden', !v);
    if (v) this.refresh();
  }
  private hero() { return this.sim.player; }

  private build() {
    const search = h('input', { type: 'search', placeholder: 'Search items…', class: 'shop-search', oninput: (e: Event) => { this.query = (e.target as HTMLInputElement).value.toLowerCase(); this.renderGrid(); } });
    const tabs = h('div', { class: 'shop-tabs' });
    const defs: [Filter, string][] = [['recommended', '★ Recommended'], ['all', 'All'], ['starter', 'Starters'], ['attack', 'Attack'], ['ability', 'Ability'], ['defense', 'Defense'], ['movement', 'Movement'], ['support', 'Support'], ['consumable', 'Consumables']];
    for (const [f, label] of defs) {
      const b = h('button', { class: 'tab', onclick: () => { this.filter = f; this.syncTabs(); this.renderGrid(); } }, label);
      this.tabs.set(f, b); tabs.append(b);
    }
    this.goldEl = h('div', { class: 'shop-gold' });
    this.grid = h('div', { class: 'shop-grid' });
    this.detail = h('div', { class: 'shop-detail' });
    this.inv = h('div', { class: 'shop-inv' });
    this.note = h('div', { class: 'shop-note' });
    this.el.append(
      h('div', { class: 'shop-head' }, h('h2', {}, 'Item Shop'), this.goldEl, h('button', { class: 'x', title: 'Close (P / Esc)', onclick: () => this.close() }, '×')),
      h('div', { class: 'shop-body' },
        h('div', { class: 'shop-left' }, search, tabs, this.note, this.grid),
        this.detail),
      this.inv,
    );
    this.syncTabs();
  }
  private syncTabs() { for (const [f, el] of this.tabs) el.classList.toggle('on', f === this.filter); }

  private cards = new Map<string, HTMLElement>();
  private sig = '';
  /** cheap per-tick update: never rebuilds the grid (so clicks and double-clicks land on stable elements) */
  tick() {
    const hs = this.hero().hero!;
    this.goldEl.textContent = `◉ ${Math.floor(hs.gold)} gold`;
    const poor = ITEMS.map((it) => { const q = quote(hs, it.id); return hs.gold >= q.cost && q.ok ? 1 : 0; }).join('');
    const owned = hs.items.map((i) => i?.id ?? '-').join(',');
    const sig = poor + '|' + owned + '|' + this.selected;
    if (sig === this.sig) return;
    this.sig = sig;
    for (const [id, el] of this.cards) { const q = quote(hs, id); el.classList.toggle('poor', !(hs.gold >= q.cost && q.ok)); }
    this.renderDetail();
    this.renderInv();
  }

  refresh() {
    const hs = this.hero().hero!;
    this.sig = '';
    this.goldEl.textContent = `◉ ${Math.floor(hs.gold)} gold`;
    this.renderGrid();
    this.renderDetail();
    this.renderInv();
  }

  private enemyProfile(): { phys: number; arc: number } {
    let phys = 0, arc = 0;
    for (const e of this.sim.heroes) {
      if (e.team === this.hero().team) continue;
      const id = e.hero!.heroId;
      if (id === 'oru' || id === 'ilyra') arc++; else phys++;
    }
    return { phys, arc };
  }

  private card(it: ItemDef): HTMLElement {
    const hs = this.hero().hero!;
    const q = quote(hs, it.id);
    const owned = hs.items.some((s) => s && s.id === it.id);
    const afford = hs.gold >= q.cost && q.ok;
    const c = h('div', {
      class: `card tier-${it.tier}${afford ? '' : ' poor'}${owned ? ' owned' : ''}${this.selected === it.id ? ' sel' : ''}`,
      onclick: (e: Event) => { this.selected = it.id; this.grid.querySelectorAll('.card.sel').forEach((n) => n.classList.remove('sel')); (e.currentTarget as HTMLElement).classList.add('sel'); this.renderDetail(); audio.play('click', 0.6); },
      ondblclick: () => this.buy(it.id),
      title: it.name,
    },
    h('div', { class: 'ico', style: { color: it.color, borderColor: it.color } }, it.icon),
    h('div', { class: 'nm' }, it.name),
    h('div', { class: 'pr' }, `${q.cost}${q.cost < it.cost ? ' (−' + (it.cost - q.cost) + ')' : ''}`));
    return c;
  }

  private renderGrid() {
    clear(this.grid);
    clear(this.note);
    this.cards.clear();
    const hero = this.hero();
    const def = HERO_BY_ID[hero.hero!.heroId];
    let list: ItemDef[] = ITEMS;
    if (this.filter === 'recommended') {
      const prof = this.enemyProfile();
      const tip = prof.phys > prof.arc ? `Enemy damage is mostly physical (${prof.phys}/3): Armor items blunt it.` : prof.arc > 0 ? `Enemy team has ${prof.arc} arcane threats: consider Ward.` : 'Balanced enemy damage.';
      this.note.append(h('div', { class: 'rec-tip' }, tip));
      for (const b of def.builds) {
        this.note.append(h('div', { class: 'build' }, h('b', {}, b.name), h('span', {}, ' — ' + b.why),
          h('div', { class: 'build-items' }, ...b.items.map((id) => { const it = ITEM_BY_ID[id]; return h('span', { class: 'chip', style: { color: it.color }, title: it.name, onclick: () => { this.selected = id; this.renderDetail(); } }, `${it.icon} ${it.name}`); }))));
      }
      const hs = hero.hero!;
      const seen = new Set<string>();
      const next: ItemDef[] = [];
      for (const b of def.builds) for (const id of b.items) { if (!seen.has(id)) { seen.add(id); const it = ITEM_BY_ID[id]; if (!hs.items.some((s) => s && s.id === id)) next.push(it); } }
      list = next;
    } else if (this.filter === 'starter') list = ITEMS.filter((i) => i.tier === 'starter');
    else if (this.filter === 'consumable') list = ITEMS.filter((i) => i.tier === 'consumable');
    else if (this.filter !== 'all') list = ITEMS.filter((i) => i.cat === this.filter);
    if (this.query) list = list.filter((i) => i.name.toLowerCase().includes(this.query) || i.cat.includes(this.query) || (i.passive ?? '').toLowerCase().includes(this.query));
    const order = { starter: 0, component: 1, boots: 2, complete: 3, consumable: 4 } as const;
    list = [...list].sort((a, b) => order[a.tier] - order[b.tier] || a.cost - b.cost);
    for (const it of list) { const c = this.card(it); this.cards.set(it.id, c); this.grid.append(c); }
    if (!list.length) this.grid.append(h('div', { class: 'empty' }, 'Nothing here.'));
  }

  private renderDetail() {
    clear(this.detail);
    const it = this.selected ? ITEM_BY_ID[this.selected] : null;
    if (!it) { this.detail.append(h('div', { class: 'empty' }, 'Select an item to see its recipe and effects. Double-click to buy.')); return; }
    const hs = this.hero().hero!;
    const q = quote(hs, it.id);
    this.detail.append(
      h('div', { class: 'd-head' }, h('div', { class: 'ico big', style: { color: it.color, borderColor: it.color } }, it.icon), h('div', {}, h('h3', {}, it.name), h('div', { class: 'sub' }, `${it.tier} · ${it.cat}`))),
      h('ul', { class: 'stats' }, ...Object.entries(it.stats).map(([k, v]) => h('li', {}, formatStat(k, v as number)))),
      ...(it.passive ? [h('p', { class: 'pass' }, h('b', {}, 'Passive: '), it.passive)] : []),
      ...(it.active ? [h('p', { class: 'pass' }, h('b', {}, 'Active: '), it.active)] : []),
    );
    // recipe tree
    const builtFrom = it.from ?? [];
    const buildsInto = ITEMS.filter((o) => o.from?.includes(it.id));
    if (builtFrom.length) {
      this.detail.append(h('div', { class: 'tree' }, h('div', { class: 'sub' }, 'Builds from'), h('div', { class: 'tree-row' }, ...builtFrom.map((id) => {
        const c = ITEM_BY_ID[id];
        const have = hs.items.some((s) => s && s.id === id);
        return h('span', { class: `chip${have ? ' have' : ''}`, style: { color: c.color }, onclick: () => { this.selected = id; this.refresh(); } }, `${c.icon} ${c.name} ${have ? '✔' : c.cost}`);
      }))));
    }
    if (buildsInto.length) {
      this.detail.append(h('div', { class: 'tree' }, h('div', { class: 'sub' }, 'Builds into'), h('div', { class: 'tree-row' }, ...buildsInto.map((c) => h('span', { class: 'chip', style: { color: c.color }, onclick: () => { this.selected = c.id; this.refresh(); } }, `${c.icon} ${c.name}`)))));
    }
    const can = q.ok && hs.gold >= q.cost;
    this.detail.append(
      h('div', { class: 'd-buy' },
        h('div', { class: 'price' }, `◉ ${q.cost}`, q.cost < it.cost ? h('small', {}, ` (list ${it.cost})`) : null),
        h('button', { class: `btn primary${can ? '' : ' disabled'}`, onclick: () => this.buy(it.id) }, q.ok ? (hs.gold >= q.cost ? 'Buy' : 'Not enough gold') : (q.reason ?? 'Unavailable'))));
  }

  private buy(id: string) { this.send({ c: 'buy', item: id }); setTimeout(() => this.refresh(), 30); }

  private renderInv() {
    clear(this.inv);
    const hs = this.hero().hero!;
    const slots = h('div', { class: 'inv-slots' });
    hs.items.forEach((s, i) => {
      const it = s ? ITEM_BY_ID[s.id] : null;
      slots.append(h('div', { class: `slot${it ? ' full' : ''}`, title: it ? `${it.name} — sells for ${Math.floor(it.cost * SELL_RATE)}` : 'Empty', onclick: () => { if (it) { this.selected = it.id; this.renderDetail(); } } },
        it ? h('span', { style: { color: it.color } }, it.icon) : '',
        s && s.qty > 1 ? h('em', {}, `×${s.qty}`) : null,
        it ? h('button', { class: 'sell', title: 'Sell', onclick: (e: Event) => { e.stopPropagation(); this.send({ c: 'sell', idx: i }); setTimeout(() => this.refresh(), 30); } }, '$') : null));
    });
    this.inv.append(h('div', { class: 'inv-label' }, 'Inventory'), slots,
      h('button', { class: `btn${hs.undo ? '' : ' disabled'}`, onclick: () => { this.send({ c: 'undo' }); setTimeout(() => this.refresh(), 30); } }, '↶ Undo purchase'),
      h('div', { class: 'inv-hint' }, 'Sell for 65%. Components auto-combine into the item you buy.'));
    void STAT_LABEL;
  }
}
