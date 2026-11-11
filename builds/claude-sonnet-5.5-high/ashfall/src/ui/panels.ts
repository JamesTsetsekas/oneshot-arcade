// Menu-style panels: inventory/equipment, character, skills, quests, vendor, artificer, stash, waypoint, portal,
// summary, dialog, map, pause and settings. Panels read the Game and call its command methods; they hold no rules.
import type { AudioEngine } from '../audio/audio';
import { QUESTS } from '../data/quests';
import { AFFIX_BY_ID, BASE_BY_ID, GLYPH_TYPES, POTIONS } from '../data/items';
import { CLASSES, CLASS_SKILLS, PASSIVES, SKILL_BY_ID, SKILL_MAX_RANK, respecCost } from '../data/skills';
import { canRankUp } from '../sim/character';
import { WAYPOINT_INFO, formatTime, type Game } from '../sim/game';
import { canUse, targetSlot } from '../sim/inventory';
import { affixText, identifyCost, repairCost, rerollCost, salvageDust, sellValue, socketCost, buyValue } from '../sim/loot';
import type { Item, SlotId } from '../sim/types';
import { SLOT_IDS } from '../sim/types';
import { equippedItems } from '../sim/character';
import type { GameView } from '../render/view';
import type { Hud } from './hud';
import { RARITY_CSS, RARITY_ICON, itemIcon, skillIcon } from './icons';
import { ACTION_LABELS, DEFAULT_KEYS, LEFTY_KEYS, PRESETS, defaultSettings, keyLabel, type Action, type Settings } from './settings';
import { esc, itemTooltip, skillTooltip } from './tooltip';

export interface PanelHost {
  game: Game | null;
  view: GameView;
  settings: Settings;
  audio: AudioEngine;
  hud: Hud | null;
  ctrlHeld: boolean;
  saveSettings(): void;
  applySettings(): void;
  tooltip(html: string | null, x?: number, y?: number, flipLeft?: boolean): void;
  goMenu(): void;
  saveNow(): Promise<void>;
  respawn(): void;
  menuReturn?(): void;
}

const SLOT_LABEL: Record<SlotId, string> = { weapon: 'Weapon', offhand: 'Off-hand', head: 'Head', chest: 'Chest', gloves: 'Gloves', boots: 'Boots', belt: 'Belt', amulet: 'Amulet', ring1: 'Ring', ring2: 'Ring' };
const CELL = 36;
const DIALOGS: Record<string, { name: string; lines: string[] }> = {
  captain: {
    name: 'Marshal Orsa Vell',
    lines: [
      'Warden. The star fell three winters ago, and the ash has not stopped since. The dead settlers walk, the beasts have gone strange, and the old machines under the Archive have begun to sing.',
      'Light the Ashway shrine in the Soot March so we can reach you quickly. Then break the Toll-Keeper - a bell-wrought gatekeeper that chains the Hollow Archive shut.',
      'Somewhere in the Archive a craftsperson is caged. Free her and the Refuge will have an Artificer again. Then silence the Orison Engine, whatever it has become.',
      'Take what the vendor sells, tend your wounds at the healer, and practice on the dummies. The east gate is open. Come back alive.',
    ],
  },
  artificer_locked: { name: 'Empty Workbench', lines: ['The Artificer\'s bench is cold. Tools lie in neat rows, waiting for their owner.', 'Rescue the Artificer from the Hollow Archive to identify, salvage, reroll, socket and repair here.'] },
  artificer_freed: {
    name: 'Artificer Ilsabet Corr',
    lines: ['You... you came. Three days I counted the bells. Take me home, Warden - the Refuge forge is cold without me.', 'My bench in the Refuge is yours: I can identify strange finds, salvage gear into glyph dust, reroll a modifier, add sockets and mend your armor.'],
  },
};

export class Panels {
  root: HTMLElement;
  private left: HTMLElement;
  private right: HTMLElement;
  private modal: HTMLElement;
  private open = new Set<string>();
  private selected: { where: 'inv' | 'equip' | 'stash' | 'vendor' | 'art'; key: string } | null = null;
  private search = '';
  private artSel = '';
  private rebinding: Action | null = null;
  private dialogIdx = 0;
  private dialogNpc = '';
  private mapCanvas: HTMLCanvasElement | null = null;
  private mapTimer = 0;
  private settingsReturn = '';
  private msg = '';

  constructor(private host: PanelHost, parent: HTMLElement) {
    this.root = document.createElement('div');
    this.root.id = 'panels';
    this.root.innerHTML = '<div id="pl" class="pcol left"></div><div id="pr" class="pcol right"></div><div id="pm" class="pmodal hidden"></div>';
    parent.appendChild(this.root);
    this.left = this.root.querySelector('#pl') as HTMLElement;
    this.right = this.root.querySelector('#pr') as HTMLElement;
    this.modal = this.root.querySelector('#pm') as HTMLElement;
    this.root.addEventListener('click', (e) => this.onClick(e));
    this.root.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const t = (e.target as HTMLElement).closest('[data-uid]') as HTMLElement | null;
      if (t && t.dataset.where === 'inv' && this.host.game) {
        const r = this.host.game.equip(t.dataset.uid!);
        if (!r.ok && r.reason) this.flash(r.reason);
        this.renderAll();
      }
    });
    this.root.addEventListener('mouseover', (e) => this.onHover(e));
    this.root.addEventListener('mouseleave', () => this.host.tooltip(null));
    this.root.addEventListener('input', (e) => this.onInput(e));
    this.root.addEventListener('change', (e) => this.onInput(e));
  }

  get game(): Game {
    return this.host.game!;
  }
  isOpen(id: string) {
    return this.open.has(id);
  }
  anyOpen() {
    return this.open.size > 0;
  }
  modalOpen() {
    return !this.modal.classList.contains('hidden');
  }
  flash(msg: string) {
    this.msg = msg;
    this.host.hud?.toast(msg, 'warn', 3);
    this.host.audio.play('invalid');
  }

  toggle(id: string) {
    if (this.open.has(id)) this.close(id);
    else this.openPanel(id);
  }

  openPanel(id: string) {
    const g = this.host.game;
    if (!g && id !== 'settings') return;
    const leftSet = ['character', 'skills', 'quests', 'vendor', 'artificer', 'stash'];
    const modalSet = ['waypoint', 'portal', 'summary', 'pause', 'settings', 'dialog', 'map'];
    if (modalSet.includes(id)) {
      this.closeModal();
      this.open.add(id);
      this.modal.classList.remove('hidden');
      if (g && ['pause', 'settings', 'dialog', 'summary'].includes(id)) g.paused = true;
    } else if (leftSet.includes(id)) {
      for (const l of leftSet) this.open.delete(l);
      this.open.add(id);
      if (['vendor', 'artificer', 'stash'].includes(id)) this.open.add('inventory');
    } else this.open.add(id);
    if (id === 'inventory' && g) g.tutorial('inventory', true);
    this.host.audio.play('ui');
    this.renderAll();
  }

  close(id: string) {
    const modalSet = ['waypoint', 'portal', 'summary', 'pause', 'settings', 'dialog', 'map'];
    this.open.delete(id);
    if (modalSet.includes(id)) this.closeModal(id);
    this.host.tooltip(null);
    this.renderAll();
  }

  private closeModal(except = '') {
    for (const m of ['waypoint', 'portal', 'summary', 'pause', 'settings', 'dialog', 'map']) if (m !== except) this.open.delete(m);
    this.modal.classList.add('hidden');
    this.modal.innerHTML = '';
    if (this.host.game) this.host.game.paused = false;
    this.mapCanvas = null;
  }

  closeAll() {
    for (const id of [...this.open]) this.open.delete(id);
    this.modal.classList.add('hidden');
    this.modal.innerHTML = '';
    if (this.host.game) this.host.game.paused = false;
    this.host.tooltip(null);
    this.renderAll();
  }

  /** Escape handler: closes the topmost thing; returns true if something was closed. */
  closeTop(): boolean {
    if (this.modalOpen()) {
      const m = ['dialog', 'summary', 'settings', 'portal', 'waypoint', 'map', 'pause'].find((x) => this.open.has(x));
      if (m === 'settings' && this.settingsReturn === 'pause') {
        this.openPanel('pause');
        return true;
      }
      if (m === 'settings' && this.settingsReturn === 'menu') {
        this.closeModal();
        this.host.menuReturn?.();
        return true;
      }
      this.closeModal();
      this.renderAll();
      return true;
    }
    if (this.open.size) {
      const order = ['artificer', 'vendor', 'stash', 'skills', 'character', 'quests', 'inventory'];
      for (const o of order) {
        if (this.open.has(o)) {
          this.close(o);
          return true;
        }
      }
    }
    return false;
  }

  openDialog(npc: string) {
    this.dialogNpc = npc;
    this.dialogIdx = 0;
    this.openPanel('dialog');
  }

  refresh() {
    if (this.open.size) this.renderAll();
  }

  // ------------------------------------------------------------ rendering
  renderAll() {
    const g = this.host.game;
    if (!g && !this.open.has('settings')) return;
    if (g) {
      this.renderLeft();
      this.renderRight();
    }
    this.renderModal();
  }

  private head(title: string, id: string) {
    return `<div class="ph"><h3>${title}</h3><button class="x" data-act="close" data-id="${id}" title="Close">✕</button></div>`;
  }

  private renderLeft() {
    const g = this.game;
    const id = ['character', 'skills', 'quests', 'vendor', 'artificer', 'stash'].find((x) => this.open.has(x));
    if (!id) {
      this.left.innerHTML = '';
      this.left.classList.remove('on');
      return;
    }
    this.left.classList.add('on');
    let html = '';
    switch (id) {
      case 'character':
        html = this.charHtml(g);
        break;
      case 'skills':
        html = this.skillsHtml(g);
        break;
      case 'quests':
        html = this.questsHtml(g);
        break;
      case 'vendor':
        html = this.vendorHtml(g);
        break;
      case 'artificer':
        html = this.artificerHtml(g);
        break;
      case 'stash':
        html = this.stashHtml(g);
        break;
    }
    this.left.innerHTML = html;
  }

  private renderRight() {
    const g = this.game;
    if (!this.open.has('inventory')) {
      this.right.innerHTML = '';
      this.right.classList.remove('on');
      return;
    }
    this.right.classList.add('on');
    this.right.innerHTML = this.inventoryHtml(g);
  }

  private renderModal() {
    if (!this.modalOpen()) return;
    const id = ['dialog', 'summary', 'settings', 'portal', 'waypoint', 'map', 'pause'].find((x) => this.open.has(x));
    let html = '';
    switch (id) {
      case 'dialog':
        html = this.dialogHtml();
        break;
      case 'summary':
        html = this.summaryHtml();
        break;
      case 'settings':
        html = this.settingsHtml();
        break;
      case 'portal':
        html = this.portalHtml();
        break;
      case 'waypoint':
        html = this.waypointHtml();
        break;
      case 'map':
        html = this.mapHtml();
        break;
      case 'pause':
        html = this.pauseHtml();
        break;
    }
    this.modal.innerHTML = html;
    if (id === 'map') {
      this.mapCanvas = this.modal.querySelector('#bigmap') as HTMLCanvasElement;
      this.drawMap();
    }
  }

  tick(dt: number) {
    if (this.open.has('map') && this.mapCanvas) {
      this.mapTimer -= dt;
      if (this.mapTimer <= 0) {
        this.mapTimer = 0.3;
        this.drawMap();
      }
    }
  }
  private drawMap() {
    const g = this.host.game;
    const hud = this.host.hud;
    if (!g || !hud || !this.mapCanvas) return;
    const c = this.mapCanvas.getContext('2d')!;
    const scale = Math.min(this.mapCanvas.width / (g.zone.w * 1.45), 7);
    hud.drawMap(c, this.mapCanvas.width, scale, true, g, true);
  }

  // ------------------------------------------------------------ inventory
  private itemCell(it: Item, x: number, y: number, where: string): string {
    const b = BASE_BY_ID[it.base];
    const col = RARITY_CSS[it.rarity];
    const sel = this.selected?.where === where && this.selected.key === it.uid;
    const q = this.search.trim().toLowerCase();
    const match = !q || it.name.toLowerCase().includes(q) || it.affixes.some((a) => it.identified && affixText(AFFIX_BY_ID[a.id], a.value).toLowerCase().includes(q)) || b.name.toLowerCase().includes(q);
    return `<div class="it ${sel ? 'sel' : ''} ${match ? '' : 'dim'} ${it.favorite ? 'fav' : ''} ${canUse(it, this.game.ch.cls) || b.group === 'glyph' ? '' : 'unusable'}" data-uid="${it.uid}" data-where="${where}" style="left:${x * CELL}px;top:${y * CELL}px;width:${b.w * CELL - 2}px;height:${b.h * CELL - 2}px;border-color:${col};--rc:${col}">
      <img src="${itemIcon(it)}" alt=""><span class="ri">${RARITY_ICON[it.rarity]}</span>${it.favorite ? '<span class="fv">★</span>' : ''}${!it.identified ? '<span class="uid">?</span>' : ''}${it.dur <= 0 ? '<span class="brk">!</span>' : ''}</div>`;
  }

  private inventoryHtml(g: Game): string {
    const ch = g.ch;
    const eq = (slot: SlotId) => {
      const it = ch.equip[slot];
      const sel = this.selected?.where === 'equip' && this.selected.key === slot;
      if (!it) return `<div class="eslot empty" data-slot="${slot}"><span>${SLOT_LABEL[slot]}</span></div>`;
      const col = RARITY_CSS[it.rarity];
      return `<div class="eslot ${sel ? 'sel' : ''}" data-slot="${slot}" data-uid="${it.uid}" data-where="equip" style="border-color:${col};--rc:${col}"><img src="${itemIcon(it)}" alt=""><span class="ri">${RARITY_ICON[it.rarity]}</span>${it.dur <= 0 ? '<span class="brk">!</span>' : ''}${it.favorite ? '<span class="fv">★</span>' : ''}</div>`;
    };
    const twoH = ch.equip.weapon && BASE_BY_ID[ch.equip.weapon.base].twoHanded;
    const grid = ch.inv.placed.map((p) => this.itemCell(p.item, p.x, p.y, 'inv')).join('');
    const belt = (['health', 'focus', 'cleanse', 'tonic'] as const).map((k) => `<span class="beltp" title="${esc(POTIONS[k].name)}: ${esc(POTIONS[k].desc)}" style="color:${POTIONS[k].color}">● ${ch.belt[k]}/${ch.beltCap}</span>`).join(' ');
    let detail = '<div class="detail-empty">Select an item. Right-click an inventory item to equip it quickly. Hover for a comparison.</div>';
    if (this.selected) detail = this.detailHtml(g);
    return `${this.head('Inventory', 'inventory')}
      <div class="eq">
        <div class="eqgrid">
          <div class="g-head">${eq('head')}</div><div class="g-amu">${eq('amulet')}</div>
          <div class="g-wpn">${eq('weapon')}</div><div class="g-chest">${eq('chest')}</div><div class="g-off ${twoH ? 'twoh' : ''}">${eq('offhand')}</div>
          <div class="g-glv">${eq('gloves')}</div><div class="g-belt">${eq('belt')}</div><div class="g-boots">${eq('boots')}</div>
          <div class="g-r1">${eq('ring1')}</div><div class="g-r2">${eq('ring2')}</div>
        </div>
        <div class="eqinfo">
          <div class="gold">◉ ${ch.gold} gold</div><div class="dust">◆ ${ch.dust} glyph dust</div><div class="belt">${belt}</div>
          <div class="dim small">${twoH ? 'Two-handed weapon: off-hand unavailable.' : ''}</div>
        </div>
      </div>
      <div class="invtools"><input type="search" id="invsearch" placeholder="Search / filter..." value="${esc(this.search)}"><button class="btn sm" data-act="sort">Sort</button></div>
      <div class="invgrid" style="width:${ch.inv.w * CELL}px;height:${ch.inv.h * CELL}px;background-size:${CELL}px ${CELL}px">${grid}</div>
      <div class="detail">${detail}</div>`;
  }

  private selectedItem(g: Game): { it: Item | null; where: string } {
    const s = this.selected;
    if (!s) return { it: null, where: '' };
    if (s.where === 'equip') return { it: g.ch.equip[s.key as SlotId] ?? null, where: 'equip' };
    if (s.where === 'inv') return { it: g.ch.inv.get(s.key)?.item ?? null, where: 'inv' };
    if (s.where === 'stash') return { it: g.ch.stash.get(s.key)?.item ?? null, where: 'stash' };
    if (s.where === 'vendor') return { it: g.vendorStock[Number(s.key)] ?? null, where: 'vendor' };
    return { it: null, where: '' };
  }

  private detailHtml(g: Game): string {
    const { it, where } = this.selectedItem(g);
    if (!it) return '<div class="detail-empty">Select an item.</div>';
    const b = BASE_BY_ID[it.base];
    const ctx = ['vendor', 'artificer', 'stash'].find((x) => this.open.has(x));
    let btns = '';
    if (where === 'inv') {
      const usable = canUse(it, g.ch.cls);
      if (b.group !== 'glyph') btns += `<button class="btn sm" data-act="equip" ${usable ? '' : 'disabled'}>Equip</button>`;
      btns += `<button class="btn sm" data-act="fav">${it.favorite ? 'Unfavorite' : 'Favorite'}</button>`;
      if (ctx === 'vendor') btns += `<button class="btn sm gold" data-act="sell">Sell (${sellValue(it)}g)</button>`;
      if (ctx === 'stash') btns += `<button class="btn sm" data-act="tostash">To stash</button>`;
      if (g.zone.id !== 'refuge') btns += `<button class="btn sm" data-act="drop">Drop</button>`;
      if (b.group === 'glyph') {
        btns += `<button class="btn sm" data-act="socketpick">Socket into gear...</button>`;
        if (b.tier < 3) btns += `<button class="btn sm" data-act="combine" ${g.ch.inv.items().filter((i) => i.base === it.base).length >= 3 && g.ch.flags.artificerRescued ? '' : 'disabled'} title="Artificer: combine three matching glyphs">Combine 3→1</button>`;
      }
    } else if (where === 'equip') {
      btns += `<button class="btn sm" data-act="unequip">Unequip</button><button class="btn sm" data-act="fav">${it.favorite ? 'Unfavorite' : 'Favorite'}</button>`;
    } else if (where === 'stash') btns += '<button class="btn sm" data-act="fromstash">To inventory</button>';
    else if (where === 'vendor') btns += `<button class="btn sm gold" data-act="buy">Buy (${buyValue(it)}g)</button>`;
    const compact = window.innerHeight < 900;
    const tt = itemTooltip(g, it, { advanced: this.host.settings.advancedItems, compare: where !== 'equip' && where !== 'stash', price: where === 'vendor' ? 'buy' : where === 'inv' && ctx === 'vendor' ? 'sell' : undefined, equipped: where === 'equip' });
    const head = `<div class="selhead" style="color:${RARITY_CSS[it.rarity]}">${RARITY_ICON[it.rarity]} ${esc(it.name)} <span class="dim small">${esc(b.name)} - hover for details</span></div>`;
    return `${compact ? head : `<div class="tt inline">${tt}</div>`}<div class="btnrow">${btns}</div>${this.msg ? `<div class="msg">${esc(this.msg)}</div>` : ''}`;
  }

  // ------------------------------------------------------------ character
  private charHtml(g: Game): string {
    const ch = g.ch;
    const d = g.d;
    const cd = CLASSES[ch.cls];
    const attr = (k: 'might' | 'finesse' | 'will' | 'vigor', name: string, desc: string) => `<div class="attr"><div><b>${name}</b> <span class="val">${d.attrs[k]}</span>${d.attrs[k] !== ch.attrs[k] ? `<span class="dim"> (${ch.attrs[k]} base +${d.attrs[k] - ch.attrs[k]} gear)</span>` : ''}</div><div class="dim small">${desc}</div>${ch.attrPoints > 0 ? `<button class="btn sm" data-act="attr" data-k="${k}">+1</button>` : ''}</div>`;
    const redTypical = Math.round((d.armor / (d.armor + 5 * 40 + 45)) * 100);
    const row = (label: string, val: string, tip: string) => `<div class="stat" title="${esc(tip)}"><span>${label}</span><b>${val}</b></div>`;
    return `${this.head(`${esc(ch.name)} – ${cd.name} (Level ${ch.level})`, 'character')}
      <div class="pbody">
      <div class="dim small">Attribute points: <b>${ch.attrPoints}</b> (one every other level). Skill points: <b>${ch.skillPoints}</b>.</div>
      ${attr('might', 'Might', `+0.7% physical damage, +0.4% melee damage, +3 armor per point.`)}
      ${attr('finesse', 'Finesse', `+0.6% projectile damage, +0.2% critical chance per point.`)}
      ${attr('will', 'Will', `+4 maximum Focus, +0.7% Ember damage, +0.5% Blight/Frost damage, faster Focus regen per point.`)}
      ${attr('vigor', 'Vigor', `+10 maximum health, +0.4% potion potency, +0.5% ailment resistance per point.`)}
      <h4>Defence</h4>
      ${row('Health', `${d.maxHp}`, '60 + 10 x Vigor + 8 x level + gear, then % increases')}
      ${row('Focus', `${d.maxFocus}`, '80 + 4 x Will + gear')}
      ${row('Armor', `${d.armor}`, `Reduces physical damage by armor / (armor + 5 x hit + 45). Against a typical 40-damage hit: ~${redTypical}%. Capped at 85%.`)}
      ${row('Ember / Frost / Blight resist', `${d.res.ember}% / ${d.res.frost}% / ${d.res.blight}%`, 'Percentage reduction, capped at 75%.')}
      ${row('Block chance', `${d.block}%`, 'Cinder Vow with a shield: blocks frontal hits for 65% less damage and builds Heat. Cap 60%.')}
      ${row('Ailment resistance', `${Math.round(d.ailmentResist)}%`, '0.5% per Vigor plus gear; cap 75%.')}
      <h4>Offence</h4>
      ${row('Weapon damage (avg)', d.weaponPool.toFixed(1), 'Average weapon damage plus all flat damage modifiers. Every skill scales from this pool.')}
      ${row('Critical chance / multiplier', `${d.critChance.toFixed(1)}% / x${d.critMult.toFixed(2)}`, '5% + 0.2% per Finesse + gear. Cap 60%. Base multiplier x1.5.')}
      ${row('Attack & cast speed', `+${Math.round((d.speedMul - 1) * 100)}%`, 'Shortens all skill animations.')}
      ${row('Cooldown recovery', `+${Math.round(d.cdr)}%`, 'Cap 40%.')}
      ${row('Ailment chance (bonus)', `+${Math.round(d.ailmentChance)}%`, 'Added to skill ailment chances; also gives a small chance for basic hits.')}
      <h4>Utility</h4>
      ${row('Movement speed', `${d.moveSpeed.toFixed(2)} m/s`, 'Base 4.6 m/s.')}
      ${row('Potion potency', `+${Math.round(d.potionPotency)}%`, '0.4% per Vigor plus gear.')}
      ${row('Gold found', `+${Math.round(d.goldFind)}%`, 'From gear.')}
      ${row('Evade recovery', `+${Math.round(d.evadeRec)}%`, 'Base 2.8 s per charge, 3 charges.')}
      </div>`;
  }

  // ------------------------------------------------------------ skills
  private skillsHtml(g: Game): string {
    const ch = g.ch;
    const cd = CLASSES[ch.cls];
    const rows = CLASS_SKILLS[ch.cls]
      .map((sk) => {
        const rank = ch.ranks[sk.id] ?? 0;
        const can = canRankUp(ch, sk.id);
        const slots = (['rmb', 'q', 'w', 'e', 'r'] as const).map((s) => `<button class="slotbtn ${ch.hotbar[s] === sk.id ? 'on' : ''}" data-act="assign" data-skill="${sk.id}" data-slot="${s}" ${rank <= 0 && sk.kind !== 'basic' ? 'disabled' : ''}>${s === 'rmb' ? 'RMB' : s.toUpperCase()}</button>`).join('');
        return `<div class="skill ${rank > 0 || sk.kind === 'basic' ? 'known' : ''}" data-skilltip="${sk.id}">
          <img src="${skillIcon(sk.id, sk.tags)}" width="44" height="44" alt="">
          <div class="sk-main"><div class="sk-name">${esc(sk.name)} <span class="dim">${sk.kind === 'basic' ? 'basic' : sk.kind === 'core' ? 'core' : 'active'} · ${sk.kind === 'basic' ? 'always known' : `rank ${rank}/${SKILL_MAX_RANK}`}</span></div>
            <div class="small dim">${esc(sk.desc)}</div>
            <div class="small">${sk.cost ? `${sk.cost} Focus · ` : ''}${sk.cooldown ? `${sk.cooldown}s cd · ` : ''}${sk.kind !== 'basic' && ch.level < sk.unlock ? `<span class="bad">Requires level ${sk.unlock}</span>` : `${sk.kind === 'basic' ? '' : `Dmg ~${Math.round(g.skillTooltipDamage(sk.id))}`}`}</div>
            <div class="slots">${slots}</div></div>
          ${sk.kind === 'basic' ? '' : `<button class="btn sm" data-act="learn" data-id="${sk.id}" ${can.ok ? '' : 'disabled'} title="${esc(can.reason ?? 'Spend a skill point')}">${rank > 0 ? '+' : 'Learn'}</button>`}
        </div>`;
      })
      .join('');
    const pas = PASSIVES.filter((p) => p.cls === ch.cls)
      .map((p) => {
        const r = ch.ranks[p.id] ?? 0;
        const can = canRankUp(ch, p.id);
        return `<div class="passive ${r > 0 ? 'known' : ''} ${p.capstone ? 'cap' : ''}"><div><b>${esc(p.name)}</b> <span class="dim">${p.capstone ? 'capstone' : 'passive'} · ${r}/${p.maxRank} · req. level ${p.req}</span></div><div class="small dim">${esc(p.desc)}</div>${p.exclusiveWith ? `<div class="small dim">Mutually exclusive with ${esc(PASSIVES.find((x) => x.id === p.exclusiveWith)!.name)}.</div>` : ''}<button class="btn sm" data-act="learn" data-id="${p.id}" ${can.ok ? '' : 'disabled'} title="${esc(can.reason ?? 'Spend a skill point')}">+</button></div>`;
      })
      .join('');
    const cost = respecCost(ch.level);
    return `${this.head(`Skills – ${cd.name}`, 'skills')}
      <div class="pbody"><div class="dim small">Skill points available: <b>${ch.skillPoints}</b> · Right-click uses your RMB core skill; Q/W/E/R use the others. Assign skills with the slot buttons.</div>
      ${rows}<h4>Passive nodes</h4>${pas}
      <div class="respec"><button class="btn sm" data-act="respec" ${ch.gold >= cost ? '' : 'disabled'}>Respec all (${cost === 0 ? 'free through level 8' : `${cost} gold`})</button>
        <span class="small dim">Refunds skill and attribute points.</span></div>
      <div class="loadouts">${ch.loadouts.map((l, i) => `<div>${esc(l.name)}: <button class="btn sm" data-act="saveload" data-i="${i}">Save current</button> <button class="btn sm" data-act="applyload" data-i="${i}" ${Object.keys(l.ranks).length ? '' : 'disabled'}>Apply</button></div>`).join('')}<div class="small dim">Loadouts store skill ranks and hotbar only - changing gear still requires owning the items.</div></div>
      </div>`;
  }

  private questsHtml(g: Game): string {
    const ch = g.ch;
    const items = QUESTS.filter((q) => ch.quests[q.id]).map((q) => {
      const st = ch.quests[q.id];
      return `<div class="quest ${st}"><div><b>${esc(q.name)}</b> ${q.optional ? '<i class="dim">optional</i>' : ''} <span class="qs">${st === 'done' ? '✓ complete' : 'active'}</span></div><div class="small">${esc(q.summary)}</div><div class="small ${st === 'done' ? 'dim' : 'obj'}">${st === 'done' ? '' : '▶ '}${esc(q.objective)}</div></div>`;
    });
    const diff = `<div class="small dim">Difficulty: <b>${ch.difficulty === 'veteran' ? 'Veteran' : 'Normal'}</b> · Expedition #${ch.expedition}${ch.veteranUnlocked ? '' : ' · Veteran unlocks after the Orison Engine falls'}</div>`;
    const rec = ch.records && Object.keys(ch.records).length ? `<h4>Target Hunt records</h4>${Object.entries(ch.records).map(([k, v]) => `<div class="small">${k === 'hunt_toll_keeper' ? 'The Toll-Keeper' : 'Orison Engine'}: ${formatTime(v)}</div>`).join('')}` : '';
    return `${this.head('Quest Log', 'quests')}<div class="pbody">${diff}${items.length ? items.join('') : '<div class="dim">No quests yet. Speak to Marshal Orsa Vell in Ember Refuge.</div>'}${rec}</div>`;
  }

  // ------------------------------------------------------------ vendor / stash / artificer
  private vendorHtml(g: Game): string {
    const ch = g.ch;
    const pots = (['health', 'focus', 'cleanse', 'tonic'] as const).map((k) => `<div class="vrow"><span style="color:${POTIONS[k].color}">● ${esc(POTIONS[k].name)}</span> <span class="dim small">${ch.belt[k]}/${ch.beltCap}</span> <span class="small dim">${esc(POTIONS[k].desc)}</span> <button class="btn sm gold" data-act="buypot" data-k="${k}" ${ch.belt[k] >= ch.beltCap ? 'disabled' : ''}>${POTIONS[k].price}g</button></div>`).join('');
    const stock = g.vendorStock
      .map((it, i) => `<div class="vrow item ${this.selected?.where === 'vendor' && this.selected.key === String(i) ? 'sel' : ''}" data-where="vendor" data-vi="${i}"><img src="${itemIcon(it)}" width="28" height="28" alt=""><span style="color:${RARITY_CSS[it.rarity]}">${RARITY_ICON[it.rarity]} ${esc(it.name)}</span><span class="gold small">${buyValue(it)}g</span></div>`)
      .join('');
    return `${this.head('Peddler Dov – Vendor', 'vendor')}<div class="pbody"><div class="dim small">Gold: ${ch.gold}. Select an inventory item and press Sell, or click stock to preview and buy.</div><h4>Potions</h4>${pots}<h4>Wares</h4>${stock || '<div class="dim">Sold out.</div>'}</div>`;
  }

  private stashHtml(g: Game): string {
    const s = g.ch.stash;
    const cell = 32;
    const grid = s.placed
      .map((p) => {
        const b = BASE_BY_ID[p.item.base];
        const col = RARITY_CSS[p.item.rarity];
        const sel = this.selected?.where === 'stash' && this.selected.key === p.item.uid;
        return `<div class="it ${sel ? 'sel' : ''}" data-uid="${p.item.uid}" data-where="stash" style="left:${p.x * cell}px;top:${p.y * cell}px;width:${b.w * cell - 2}px;height:${b.h * cell - 2}px;border-color:${col};--rc:${col}"><img src="${itemIcon(p.item)}" alt=""></div>`;
      })
      .join('');
    return `${this.head('Stash', 'stash')}<div class="pbody"><div class="dim small">Shared storage in the Refuge. Select an inventory item and press "To stash"; select a stashed item to move it back.</div><div class="invgrid stash" style="width:${s.w * cell}px;height:${s.h * cell}px;background-size:${cell}px ${cell}px">${grid}</div>${this.selected?.where === 'stash' ? this.detailHtmlStash(g) : ''}</div>`;
  }
  private detailHtmlStash(g: Game): string {
    const { it } = this.selectedItem(g);
    if (!it) return '';
    return `<div class="tt inline">${itemTooltip(g, it, { advanced: this.host.settings.advancedItems, compare: false })}</div><div class="btnrow"><button class="btn sm" data-act="fromstash">To inventory</button></div>`;
  }

  private artificerHtml(g: Game): string {
    const ch = g.ch;
    const all: { it: Item; where: string }[] = [...ch.inv.items().map((it) => ({ it, where: 'inv' })), ...equippedItems(ch.equip).map((it) => ({ it, where: 'equip' }))];
    const list = all
      .filter((x) => BASE_BY_ID[x.it.base].group !== 'glyph')
      .map((x) => `<div class="vrow item ${this.artSel === x.it.uid ? 'sel' : ''}" data-where="art" data-aid="${x.it.uid}"><img src="${itemIcon(x.it)}" width="26" height="26" alt=""><span style="color:${RARITY_CSS[x.it.rarity]}">${RARITY_ICON[x.it.rarity]} ${esc(x.it.name)}</span>${x.where === 'equip' ? '<span class="dim small">equipped</span>' : ''}${x.it.identified ? '' : '<span class="uid">?</span>'}</div>`)
      .join('');
    const sel = all.find((x) => x.it.uid === this.artSel)?.it;
    let panel = '<div class="dim">Choose an item on the left.</div>';
    if (sel) {
      const rc = rerollCost(sel);
      const sc = socketCost(sel);
      const rep = repairCost(sel);
      const canSock = sel.sockets.length < sel.socketCap;
      panel = `<div class="tt inline">${itemTooltip(g, sel, { advanced: true, compare: false })}</div><div class="actions">
        <div class="arow"><button class="btn sm" data-act="identify" ${sel.identified ? 'disabled' : ''}>Identify</button> <span class="small">${sel.identified ? 'Already identified' : `${identifyCost(sel)} gold - reveals ${sel.affixes.length} modifiers`}</span></div>
        <div class="arow">Reroll one modifier (${rc.gold}g + ${rc.dust} dust, cost rises each time - rerolled ${sel.rerolls}x):<div class="affs">${sel.identified && sel.rarity !== 'worn' ? sel.affixes.map((a, i) => `<button class="btn sm" data-act="reroll" data-i="${i}">${esc(affixText(AFFIX_BY_ID[a.id], a.value))}</button>`).join('') : '<span class="dim small">Needs an identified item with modifiers.</span>'}</div></div>
        <div class="arow"><button class="btn sm" data-act="addsocket" ${canSock ? '' : 'disabled'}>Add socket</button> <span class="small">${canSock ? `${sc.gold}g + ${sc.dust} dust` : `Max sockets for this item (${sel.socketCap})`} · sockets ${sel.sockets.length}/${sel.socketCap}</span></div>
        <div class="arow"><button class="btn sm" data-act="repair1" ${sel.dur < sel.durMax ? '' : 'disabled'}>Repair this (${rep}g)</button></div>
        <div class="arow"><button class="btn sm danger" data-act="salvage" ${this.artSelWhere(g) === 'inv' ? '' : 'disabled'}>Salvage → ${salvageDust(sel)} dust</button> <span class="small dim">${this.artSelWhere(g) === 'equip' ? 'Unequip first.' : sel.favorite ? 'Favorited: unfavorite first.' : sel.rarity === 'relic' || sel.rarity === 'inscribed' ? 'Asks for confirmation.' : ''}</span></div>
      </div>`;
    }
    const glyphs = [1, 2].flatMap((t) => GLYPH_TYPES.map((gt) => ({ id: `glyph_${gt.id}_${t}`, name: gt.name, t }))).filter((x) => ch.inv.items().filter((i) => i.base === x.id).length >= 3);
    return `${this.head('Artificer Station', 'artificer')}<div class="pbody"><div class="dim small">Gold ${ch.gold} · Dust ${ch.dust}. Previews show cost and constraints before you commit.</div>
      <div class="art"><div class="artlist">${list || '<div class="dim">Nothing to work on.</div>'}</div><div class="artpanel">${panel}</div></div>
      <div class="arow"><button class="btn sm" data-act="repairall">Repair all equipped (${equippedItems(ch.equip).reduce((s, i) => s + repairCost(i), 0)}g)</button>
      ${glyphs.map((x) => `<button class="btn sm" data-act="combine" data-base="${x.id}">Combine 3 ${GLYPH_TYPES.find((gt) => x.id.includes(gt.id))!.name} T${x.t}</button>`).join(' ')}</div>
      ${this.msg ? `<div class="msg">${esc(this.msg)}</div>` : ''}</div>`;
  }
  private artSelWhere(g: Game) {
    return g.ch.inv.get(this.artSel) ? 'inv' : 'equip';
  }

  // ------------------------------------------------------------ modals
  private dialogHtml(): string {
    const d = DIALOGS[this.dialogNpc] ?? DIALOGS.captain;
    const last = this.dialogIdx >= d.lines.length - 1;
    return `<div class="modal-box dialog"><h3>${esc(d.name)}</h3><p class="dl">${esc(d.lines[this.dialogIdx])}</p><div class="dim small">${this.host.settings.subtitles ? 'Subtitles on' : ''}</div><div class="btnrow"><button class="btn primary" data-act="dnext">${last ? 'Farewell' : 'Continue'}</button></div></div>`;
  }

  private summaryHtml(): string {
    const g = this.game;
    const s = g.summary ?? g.makeSummary();
    return `<div class="modal-box summary"><h2>The Engine Falls Silent</h2><p class="dim">Act I complete. Veteran difficulty and Target Hunt are unlocked.</p>
      <div class="sumgrid"><div>Time played<b>${formatTime(s.time)}</b></div><div>Enemies slain<b>${s.kills}</b></div><div>Deaths<b>${s.deaths}</b></div><div>Level<b>${s.level}</b></div><div>Items found<b>${s.items}</b></div><div>Best find<b style="color:${RARITY_CSS[s.bestRarity] ?? '#fff'}">${esc(s.bestRarity)}</b></div><div>Difficulty<b>${esc(s.difficulty)}</b></div><div>Boss kills<b>${s.bossKills}</b></div></div>
      <p class="small">Build: ${esc(s.build)}</p>
      <div class="btnrow"><button class="btn" data-act="sumstay">Keep exploring</button><button class="btn primary" data-act="sumhome">Return to Ember Refuge</button></div></div>`;
  }

  private waypointHtml(): string {
    const g = this.game;
    const rows = Object.entries(WAYPOINT_INFO)
      .map(([id, info]) => {
        const unlocked = g.ch.waypoints.includes(id);
        const here = g.zone.id === info.zone && g.ch.lastWaypoint === id;
        return `<div class="wp ${unlocked ? '' : 'locked'}"><span>${unlocked ? '◈' : '◇'} ${esc(info.name)}</span><button class="btn sm" data-act="travel" data-id="${id}" ${unlocked && !here ? '' : 'disabled'}>${!unlocked ? 'Not found' : here ? 'You are here' : 'Travel'}</button></div>`;
      })
      .join('');
    return `<div class="modal-box"><h3>Ashway Waypoints</h3><div class="dim small">Waypoints are star-metal anchors. Activate each to travel between them instantly.</div>${rows}<div class="btnrow"><button class="btn" data-act="closemodal">Close</button></div></div>`;
  }

  private portalHtml(): string {
    const g = this.game;
    const r = g.ch.records ?? {};
    return `<div class="modal-box"><h3>Ashen Portal</h3><div class="dim small">The star-metal portal opens onto seeded routes. Normal loot and resource rules apply.</div>
      <div class="portal-opt"><b>Target Hunt: The Toll-Keeper</b><div class="small dim">Short seeded route to the Gate arena. ${r.hunt_toll_keeper ? `Best: ${formatTime(r.hunt_toll_keeper)}` : 'No record yet.'}</div><button class="btn sm" data-act="hunt" data-b="toll_keeper">Begin hunt</button></div>
      <div class="portal-opt"><b>Target Hunt: The Orison Engine</b><div class="small dim">Approach hall and the three-phase fight. ${r.hunt_orison_engine ? `Best: ${formatTime(r.hunt_orison_engine)}` : 'No record yet.'}</div><button class="btn sm" data-act="hunt" data-b="orison_engine">Begin hunt</button></div>
      <div class="portal-opt"><b>New Expedition – Normal</b><div class="small dim">A fresh seeded Soot March and Archive. Quests reset.</div><button class="btn sm" data-act="exped" data-d="normal">Begin</button></div>
      <div class="portal-opt ${g.ch.veteranUnlocked ? '' : 'locked'}"><b>New Expedition – Veteran</b><div class="small dim">Recommended level 15. More elites with extra modifiers, tougher resistances, a new boss pattern each, higher item levels and better affix tiers.</div><button class="btn sm primary" data-act="exped" data-d="veteran" ${g.ch.veteranUnlocked ? '' : 'disabled'}>Begin Veteran</button></div>
      <div class="btnrow"><button class="btn" data-act="closemodal">Close</button></div></div>`;
  }

  private mapHtml(): string {
    return `<div class="modal-box map"><h3>${esc(this.game.zone.name)}</h3><canvas id="bigmap" width="640" height="560"></canvas><div class="small dim">Only discovered areas are shown. Cyan: waypoints · Gold: exits · Red: nearby threats.</div><div class="btnrow"><button class="btn" data-act="closemodal">Close (M)</button></div></div>`;
  }

  private pauseHtml(): string {
    return `<div class="modal-box pause"><h2>Paused</h2><div class="btncol">
      <button class="btn primary" data-act="closemodal">Resume</button>
      <button class="btn" data-act="opensettings">Settings</button>
      <button class="btn" data-act="savenow">Save now</button>
      <button class="btn" data-act="tomenu">Save and quit to menu</button></div>
      <div class="small dim controls"><b>Controls:</b> left-click move/attack · right-click core skill · Q W E R skills · 1-4 potions · Space evade · F interact · T town gate · I K C J panels · Tab/M maps · Shift stand still · Alt labels · Ctrl compare · wheel zoom</div></div>`;
  }

  private settingsHtml(): string {
    const s = this.host.settings;
    const sl = (id: string, label: string, v: number, min = 0, max = 1, step = 0.05) => `<label class="srow">${label}<input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${v}"><span>${Math.round(v * 100)}</span></label>`;
    const ck = (id: string, label: string, v: boolean) => `<label class="srow"><span>${label}</span><input type="checkbox" id="${id}" ${v ? 'checked' : ''}></label>`;
    const keys = (Object.keys(ACTION_LABELS) as Action[]).map((a) => `<div class="krow"><span>${ACTION_LABELS[a]}</span><button class="btn sm ${this.rebinding === a ? 'on' : ''}" data-act="rebind" data-a="${a}">${this.rebinding === a ? 'Press a key...' : keyLabel(s.keys[a])}</button></div>`).join('');
    return `<div class="modal-box settings"><h2>Settings</h2><div class="scols">
      <div><h4>Graphics</h4>
        <label class="srow">Quality preset<select id="s-quality">${(['low', 'medium', 'high'] as const).map((q) => `<option value="${q}" ${s.quality === q ? 'selected' : ''}>${q}</option>`).join('')}</select></label>
        <label class="srow">Shadows<select id="s-shadows">${(['off', 'low', 'high'] as const).map((q) => `<option value="${q}" ${s.shadows === q ? 'selected' : ''}>${q}</option>`).join('')}</select></label>
        ${sl('s-particles', 'Particles', s.particles, 0.2, 1, 0.05)}
        ${ck('s-dyn', 'Dynamic resolution', s.dynamicRes)}
        ${sl('s-shake', 'Screen shake', s.shake)}
        ${ck('s-dmg', 'Damage numbers', s.damageNumbers)}
        <label class="srow">Item label filter<select id="s-label">${(['worn', 'tempered', 'inscribed'] as const).map((q) => `<option value="${q}" ${s.labelMin === q ? 'selected' : ''}>${q === 'worn' ? 'all items' : `${q} and better`}</option>`).join('')}</select></label>
        ${ck('s-fps', 'Show performance counter', s.showFps)}
        <h4>Audio</h4>
        ${sl('a-master', 'Master', s.audio.master)}${sl('a-music', 'Music', s.audio.music)}${sl('a-sfx', 'Effects', s.audio.sfx)}${sl('a-amb', 'Ambience', s.audio.ambient)}${sl('a-ui', 'Interface', s.audio.ui)}
        <h4>Accessibility</h4>
        ${ck('s-rm', 'Reduced motion (no screen shake)', s.reducedMotion)}
        ${ck('s-cb', 'Colorblind patterns on telegraphs', s.colorblind)}
        ${ck('s-rf', 'Reduce flashes', s.reducedFlash)}
        ${ck('s-sub', 'Subtitles for dialogue', s.subtitles)}
        <label class="srow">UI scale<select id="s-ui">${[1, 1.25, 1.5].map((q) => `<option value="${q}" ${s.uiScale === q ? 'selected' : ''}>${q * 100}%</option>`).join('')}</select></label>
        <h4>Gameplay</h4>
        ${ck('s-adv', 'Show item level and affix ranges', s.advancedItems)}
        ${ck('s-cmp', 'Always show item comparison', s.alwaysCompare)}
        ${ck('s-aip', 'Left-click attacks without moving (attack in place)', s.attackInPlace)}
      </div>
      <div><h4>Key bindings</h4>${keys}
        <div class="btnrow"><button class="btn sm" data-act="lefty">Left-handed preset</button><button class="btn sm" data-act="keyreset">Reset keys</button></div></div></div>
      <div class="btnrow"><button class="btn primary" data-act="settingsdone">Done</button></div></div>`;
  }

  openSettings(from = '') {
    this.settingsReturn = from;
    this.openPanel('settings');
  }

  // ------------------------------------------------------------ events
  private onHover(e: MouseEvent) {
    const g = this.host.game;
    if (!g) return;
    const t = e.target as HTMLElement;
    const sk = t.closest('[data-skilltip]') as HTMLElement | null;
    if (sk) {
      this.host.tooltip(skillTooltip(g, sk.dataset.skilltip!), e.clientX, e.clientY);
      return;
    }
    const itEl = t.closest('[data-uid], [data-vi]') as HTMLElement | null;
    if (itEl) {
      let it: Item | null = null;
      const where = itEl.dataset.where;
      if (itEl.dataset.vi !== undefined) it = g.vendorStock[Number(itEl.dataset.vi)] ?? null;
      else if (where === 'equip') it = SLOT_IDS.map((s) => g.ch.equip[s]).find((x) => x?.uid === itEl.dataset.uid) ?? null;
      else if (where === 'stash') it = g.ch.stash.get(itEl.dataset.uid!)?.item ?? null;
      else it = g.ch.inv.get(itEl.dataset.uid!)?.item ?? null;
      if (it) {
        const rect = itEl.getBoundingClientRect();
        this.host.tooltip(itemTooltip(g, it, { advanced: this.host.settings.advancedItems, compare: (this.host.settings.alwaysCompare || this.host.ctrlHeld) && where !== 'equip', equipped: where === 'equip', price: where === 'vendor' ? 'buy' : undefined }), rect.left < window.innerWidth / 2 ? rect.right + 8 : rect.left - 8, rect.top, rect.left >= window.innerWidth / 2);
        return;
      }
    }
    this.host.tooltip(null);
  }

  private onInput(e: Event) {
    const t = e.target as HTMLInputElement | HTMLSelectElement;
    const s = this.host.settings;
    if (t.id === 'invsearch') {
      this.search = t.value;
      const pos = (t as HTMLInputElement).selectionStart ?? 0;
      this.renderRight();
      const inp = this.right.querySelector('#invsearch') as HTMLInputElement | null;
      if (inp) {
        inp.focus();
        inp.setSelectionRange(pos, pos);
      }
      return;
    }
    if (!t.id) return;
    const num = Number(t.value);
    const ck = (t as HTMLInputElement).checked;
    switch (t.id) {
      case 's-quality': {
        const q = t.value as 'low' | 'medium' | 'high';
        s.quality = q;
        Object.assign(s, PRESETS[q]);
        break;
      }
      case 's-shadows':
        s.shadows = t.value as Settings['shadows'];
        break;
      case 's-particles':
        s.particles = num;
        break;
      case 's-dyn':
        s.dynamicRes = ck;
        break;
      case 's-shake':
        s.shake = num;
        break;
      case 's-dmg':
        s.damageNumbers = ck;
        break;
      case 's-label':
        s.labelMin = t.value as Settings['labelMin'];
        break;
      case 's-fps':
        s.showFps = ck;
        break;
      case 'a-master':
        s.audio.master = num;
        break;
      case 'a-music':
        s.audio.music = num;
        break;
      case 'a-sfx':
        s.audio.sfx = num;
        break;
      case 'a-amb':
        s.audio.ambient = num;
        break;
      case 'a-ui':
        s.audio.ui = num;
        break;
      case 's-rm':
        s.reducedMotion = ck;
        break;
      case 's-cb':
        s.colorblind = ck;
        break;
      case 's-rf':
        s.reducedFlash = ck;
        break;
      case 's-sub':
        s.subtitles = ck;
        break;
      case 's-ui':
        s.uiScale = num;
        break;
      case 's-adv':
        s.advancedItems = ck;
        break;
      case 's-cmp':
        s.alwaysCompare = ck;
        break;
      case 's-aip':
        s.attackInPlace = ck;
        break;
      default:
        return;
    }
    this.host.applySettings();
    this.host.saveSettings();
    if (t.id === 's-quality' || t.id === 's-ui') this.renderModal();
    else if (t.type === 'range') (t.nextElementSibling as HTMLElement).textContent = String(Math.round(num * 100));
  }

  handleKeyRebind(code: string): boolean {
    if (!this.rebinding) return false;
    if (code !== 'Escape') this.host.settings.keys[this.rebinding] = code;
    this.rebinding = null;
    this.host.saveSettings();
    this.host.applySettings();
    this.renderModal();
    return true;
  }
  get isRebinding() {
    return this.rebinding !== null;
  }

  private onClick(e: MouseEvent) {
    const g = this.host.game as Game;
    const t = e.target as HTMLElement;
    const act = (t.closest('[data-act]') as HTMLElement | null)?.dataset;
    const actEl = t.closest('[data-act]') as HTMLElement | null;
    if (!g && !(act && ['settingsdone', 'rebind', 'lefty', 'keyreset'].includes(act.act ?? ''))) return;
    if (!act || !actEl) {
      // item selection clicks
      const itEl = t.closest('[data-uid], [data-vi], [data-aid]') as HTMLElement | null;
      if (itEl) {
        if (itEl.dataset.aid) {
          this.artSel = itEl.dataset.aid;
          this.msg = '';
          this.renderLeft();
          return;
        }
        const where = itEl.dataset.where as 'inv' | 'equip' | 'stash' | 'vendor';
        if (itEl.dataset.vi !== undefined) this.selected = { where: 'vendor', key: itEl.dataset.vi };
        else if (where === 'equip') this.selected = { where: 'equip', key: itEl.dataset.slot ?? (SLOT_IDS.find((s) => g.ch.equip[s]?.uid === itEl.dataset.uid) as string) };
        else this.selected = { where, key: itEl.dataset.uid! };
        this.msg = '';
        this.host.audio.play('ui');
        this.renderAll();
      }
      return;
    }
    if ((actEl as HTMLButtonElement).disabled) return;
    const a = act.act!;
    const sel = g ? this.selectedItem(g) : { it: null as Item | null, where: '' };
    const ch = g?.ch as Game['ch'];
    const after = (r?: { ok: boolean; reason?: string }) => {
      if (r && !r.ok && r.reason) this.flash(r.reason);
      else this.msg = '';
      this.renderAll();
    };
    switch (a) {
      case 'close':
        this.close(act.id!);
        return;
      case 'closemodal':
        this.closeModal();
        this.renderAll();
        return;
      case 'sort':
        ch.inv.sort();
        this.renderAll();
        return;
      case 'equip':
        if (sel.it) {
          const r = g.equip(sel.it.uid);
          if (r.ok) this.selected = { where: 'equip', key: targetSlot(sel.it, {}, undefined) ? (SLOT_IDS.find((s) => g.ch.equip[s]?.uid === sel.it!.uid) as string) : '' };
          after(r);
        }
        return;
      case 'unequip':
        if (this.selected?.where === 'equip') {
          const r = g.unequip(this.selected.key as SlotId);
          if (r.ok) this.selected = null;
          after(r);
        }
        return;
      case 'fav':
        if (sel.it) g.toggleFavorite(sel.it.uid);
        this.renderAll();
        return;
      case 'drop':
        if (sel.it) {
          const c = g.canDestroy(sel.it);
          if (!c.ok) return after({ ok: false, reason: c.reason });
          const run = () => {
            g.dropFromInventory(sel.it!.uid);
            this.selected = null;
            this.renderAll();
          };
          if (c.confirm) this.confirm(`Drop ${sel.it.name}? It is a ${sel.it.rarity} item.`, run);
          else run();
        }
        return;
      case 'sell':
        if (sel.it) {
          const c = g.canDestroy(sel.it);
          if (!c.ok) return after({ ok: false, reason: c.reason });
          const run = () => {
            g.sellItem(sel.it!.uid);
            this.selected = null;
            this.renderAll();
          };
          if (c.confirm) this.confirm(`Sell ${sel.it.name} for ${sellValue(sel.it)} gold? It is a ${sel.it.rarity} item and cannot be bought back.`, run);
          else run();
        }
        return;
      case 'tostash':
        if (sel.it) {
          if (!g.moveToStash(sel.it.uid)) return after({ ok: false, reason: 'Stash is full' });
          this.selected = null;
        }
        this.renderAll();
        return;
      case 'fromstash':
        if (sel.it) {
          if (!g.moveFromStash(sel.it.uid)) return after({ ok: false, reason: 'Inventory is full' });
          this.selected = null;
        }
        this.renderAll();
        return;
      case 'buy':
        if (this.selected?.where === 'vendor') {
          const r = g.buyItem(Number(this.selected.key));
          if (r.ok) this.selected = null;
          after(r);
        }
        return;
      case 'buypot':
        after(g.buyPotion(act.k as 'health'));
        return;
      case 'attr':
        g.spendAttribute(act.k as 'might');
        this.renderAll();
        return;
      case 'learn':
        g.learnSkill(act.id!);
        this.renderAll();
        return;
      case 'assign': {
        const cur = ch.hotbar[act.slot as 'rmb'];
        g.assign(act.slot as 'rmb', cur === act.skill ? null : act.skill!);
        this.renderAll();
        return;
      }
      case 'respec':
        if (g.respec()) this.host.hud?.toast('Skills and attributes refunded.', 'info');
        this.renderAll();
        return;
      case 'saveload':
        g.saveLoadoutSlot(Number(act.i));
        this.host.hud?.toast('Loadout saved.', 'info');
        this.renderAll();
        return;
      case 'applyload':
        if (!g.applyLoadoutSlot(Number(act.i))) this.flash('Not enough skill points for that loadout.');
        this.renderAll();
        return;
      case 'identify':
        after(g.identify(this.artSel));
        return;
      case 'reroll': {
        const it = ch.inv.get(this.artSel)?.item ?? equippedItems(ch.equip).find((i) => i.uid === this.artSel);
        if (!it) return;
        const c = rerollCost(it);
        this.confirm(`Reroll "${affixText(AFFIX_BY_ID[it.affixes[Number(act.i)].id], it.affixes[Number(act.i)].value)}" for ${c.gold} gold and ${c.dust} dust? The new modifier is random.`, () => after(g.reroll(this.artSel, Number(act.i))));
        return;
      }
      case 'addsocket':
        after(g.addSocket(this.artSel));
        return;
      case 'repair1': {
        const it = ch.inv.get(this.artSel)?.item ?? equippedItems(ch.equip).find((i) => i.uid === this.artSel);
        if (it) {
          const c = repairCost(it);
          if (ch.gold < c) return after({ ok: false, reason: 'Not enough gold' });
          ch.gold -= c;
          it.dur = it.durMax;
          g.recompute();
          g.events.push({ t: 'sfx', id: 'craft' });
        }
        this.renderAll();
        return;
      }
      case 'repairall':
        after(g.repairAll());
        return;
      case 'salvage': {
        const it = ch.inv.get(this.artSel)?.item;
        if (!it) return;
        const c = g.canDestroy(it);
        if (!c.ok) return after({ ok: false, reason: c.reason });
        const run = () => {
          after(g.salvage(it.uid));
          this.artSel = '';
        };
        if (c.confirm) this.confirm(`Salvage ${it.name} into ${salvageDust(it)} glyph dust? This destroys the item permanently.`, run);
        else run();
        return;
      }
      case 'combine': {
        const base = act.base ?? sel.it?.base;
        if (base) after(g.combineGlyphs(base));
        return;
      }
      case 'socketpick': {
        if (!sel.it) return;
        const glyph = sel.it;
        const targets = [...equippedItems(ch.equip), ...ch.inv.items()].filter((i) => BASE_BY_ID[i.base].group !== 'glyph' && i.sockets.some((s) => !s));
        if (!targets.length) return this.flash('No gear with an empty socket. Add sockets at the Artificer.');
        this.pickTarget(`Socket ${glyph.name} into:`, targets, (it) => {
          after(g.socketGlyph(glyph.uid, it.uid));
        });
        return;
      }
      case 'dnext': {
        const d = DIALOGS[this.dialogNpc] ?? DIALOGS.captain;
        if (this.dialogIdx < d.lines.length - 1) {
          this.dialogIdx++;
          this.renderModal();
        } else this.closeModal(), this.renderAll();
        return;
      }
      case 'travel':
        this.closeModal();
        g.cmdTravel(act.id!);
        this.renderAll();
        return;
      case 'hunt':
        this.closeModal();
        g.startHunt(act.b as 'toll_keeper');
        this.renderAll();
        return;
      case 'exped':
        this.closeModal();
        g.newExpedition(act.d as 'normal');
        this.host.saveNow();
        this.renderAll();
        return;
      case 'sumstay':
        this.closeModal();
        this.renderAll();
        return;
      case 'sumhome':
        this.closeModal();
        g.enterZone('refuge', { x: 24, z: 22 });
        this.host.saveNow();
        this.renderAll();
        return;
      case 'opensettings':
        this.openSettings('pause');
        return;
      case 'savenow':
        this.host.saveNow().then(() => this.host.hud?.toast('Game saved.', 'info'));
        return;
      case 'tomenu':
        this.closeAll();
        this.host.goMenu();
        return;
      case 'settingsdone':
        if (this.settingsReturn === 'pause') this.openPanel('pause');
        else {
          this.closeModal();
          this.renderAll();
          if (this.settingsReturn === 'menu') this.host.menuReturn?.();
        }
        return;
      case 'rebind':
        this.rebinding = act.a as Action;
        this.renderModal();
        return;
      case 'lefty':
        Object.assign(this.host.settings.keys, LEFTY_KEYS);
        this.host.saveSettings();
        this.renderModal();
        return;
      case 'keyreset':
        this.host.settings.keys = { ...DEFAULT_KEYS };
        this.host.saveSettings();
        this.renderModal();
        return;
    }
  }

  private confirm(text: string, ok: () => void) {
    const wrap = document.createElement('div');
    wrap.className = 'confirm-wrap';
    wrap.innerHTML = `<div class="modal-box small"><p>${esc(text)}</p><div class="btnrow"><button class="btn danger" id="cf-ok">Confirm</button><button class="btn" id="cf-no">Cancel</button></div></div>`;
    this.root.appendChild(wrap);
    (wrap.querySelector('#cf-ok') as HTMLElement).onclick = () => {
      wrap.remove();
      ok();
    };
    (wrap.querySelector('#cf-no') as HTMLElement).onclick = () => wrap.remove();
  }

  private pickTarget(title: string, items: Item[], cb: (it: Item) => void) {
    const wrap = document.createElement('div');
    wrap.className = 'confirm-wrap';
    wrap.innerHTML = `<div class="modal-box small"><p>${esc(title)}</p><div class="targets">${items.map((it, i) => `<button class="btn sm" data-i="${i}" style="color:${RARITY_CSS[it.rarity]}">${esc(it.name)}</button>`).join('')}</div><div class="btnrow"><button class="btn" id="cf-no">Cancel</button></div></div>`;
    this.root.appendChild(wrap);
    wrap.querySelectorAll('[data-i]').forEach((b) =>
      b.addEventListener('click', () => {
        const it = items[Number((b as HTMLElement).dataset.i)];
        wrap.remove();
        cb(it);
      }),
    );
    (wrap.querySelector('#cf-no') as HTMLElement).onclick = () => wrap.remove();
  }
}

export { defaultSettings };
