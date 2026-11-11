// Title, character creation, character list, credits and fatal-error screens.
import { CLASSES } from '../data/skills';
import type { SaveRepo } from '../persist/save';
import type { ClassId } from '../sim/types';
import { esc } from './tooltip';

export interface MenuHost {
  repo: SaveRepo;
  onContinue(id: string): void;
  onCreate(name: string, cls: ClassId, body: number, voice: number): void;
  onLoad(id: string): void;
  onSettings(): void;
  previewClass(cls: ClassId, look: number): void;
  previewVoice(preset: number): void;
  showTitleStage(): void;
  playUi(): void;
}

const NAMES = ['Varra', 'Oskel', 'Maren', 'Tavish', 'Ilse', 'Corvane', 'Brannoch', 'Sabel', 'Kestrel', 'Wren', 'Hollis', 'Ysolde'];

function ago(ts: number): string {
  const s = Math.max(0, (Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(ts).toLocaleDateString();
}

export class Menus {
  root: HTMLElement;
  private cls: ClassId = 'cinder';
  private body = 0;
  private voice = 0;
  private name = NAMES[Math.floor(Math.random() * NAMES.length)];

  constructor(private host: MenuHost, parent: HTMLElement) {
    this.root = document.createElement('div');
    this.root.id = 'menus';
    parent.appendChild(this.root);
  }

  hide() {
    this.root.classList.add('hidden');
    this.root.innerHTML = '';
  }

  async title(message = '') {
    this.root.classList.remove('hidden');
    this.host.showTitleStage();
    const list = await this.host.repo.list();
    const last = list[0];
    this.root.innerHTML = `<div class="title-screen">
      <div class="title-art"><h1>ASHFALL<span>COVENANT</span></h1><div class="tagline">The star fell. The bells did not stop.</div></div>
      <div class="menu-btns">
        ${last ? `<button class="btn big primary" data-m="continue" data-id="${last.id}">Continue<small>${esc(last.name)} · ${CLASSES[last.cls as ClassId].name} · Lv ${last.level} · ${last.difficulty === 'veteran' ? 'Veteran' : 'Normal'} · saved ${ago(last.saved)}${last.damaged ? ' · recovered from backup' : ''}</small></button>` : ''}
        <button class="btn big ${last ? '' : 'primary'}" data-m="create">Create Warden</button>
        <button class="btn big" data-m="chars" ${list.length ? '' : 'disabled'}>Characters<small>${list.length} saved</small></button>
        <button class="btn big" data-m="settings">Settings</button>
        <button class="btn big" data-m="credits">Credits</button>
      </div>
      ${message ? `<div class="menu-msg">${esc(message)}</div>` : ''}
      <div class="ver">Oneshot build · saves stay in this browser (IndexedDB) · offline play</div></div>`;
    this.root.onclick = (e) => this.onClick(e);
  }

  create() {
    this.root.classList.remove('hidden');
    this.root.innerHTML = `<div class="create">
      <div class="create-panel">
        <h2>Create Warden</h2>
        <div class="class-cards">
          ${(['cinder', 'ranger'] as ClassId[])
            .map((c) => {
              const d = CLASSES[c];
              return `<button class="class-card ${this.cls === c ? 'on' : ''}" data-m="cls" data-c="${c}"><h3>${d.name}</h3><div class="ct">${d.title}</div><p>${d.blurb}</p><div class="tags">${d.playstyle.map((p) => `<span>${p}</span>`).join('')}</div><div class="small">Resource: <b>${d.resource}</b> · Starts with ${c === 'cinder' ? 'mace and shield' : 'a hunter\'s bow'}</div></button>`;
            })
            .join('')}
        </div>
        <div class="row"><label>Name</label><input id="cname" maxlength="18" value="${esc(this.name)}"></div>
        <div class="row"><label>Body preset</label><div class="swatches">${['Ember brass', 'Verdigris', 'Bleached bone'].map((n, i) => `<button class="sw ${this.body === i ? 'on' : ''}" data-m="body" data-i="${i}" title="${n}" style="background:${['#ffb347', '#5ee0d0', '#d8dde4'][i]}"></button>`).join('')}<span class="small dim">${['Ember brass', 'Verdigris', 'Bleached bone'][this.body]} (cosmetic only)</span></div></div>
        <div class="row"><label>Voice preset</label><div class="swatches">${['Low', 'Deep', 'Bright'].map((n, i) => `<button class="btn sm ${this.voice === i ? 'on' : ''}" data-m="voice" data-i="${i}">${n}</button>`).join('')}<span class="small dim">cosmetic only</span></div></div>
        <div class="btnrow"><button class="btn primary big" data-m="begin">Enter the Refuge</button><button class="btn" data-m="back">Back</button></div>
        <div class="small dim">Appearance never changes stats. A short input tutorial follows in Ember Refuge.</div>
      </div></div>`;
    this.root.onclick = (e) => this.onClick(e);
    this.host.previewClass(this.cls, this.body);
  }

  async characters() {
    this.root.classList.remove('hidden');
    const list = await this.host.repo.list();
    this.root.innerHTML = `<div class="create"><div class="create-panel"><h2>Characters</h2>
      ${list.length ? list.map((c) => `<div class="char-row"><div><b>${esc(c.name)}</b> · ${CLASSES[c.cls as ClassId].name} · Lv ${c.level} · ${c.difficulty}<div class="small dim">saved ${ago(c.saved)}${c.damaged ? ' · <span class="bad">primary save was damaged - recovered from backup</span>' : ''}</div></div><div><button class="btn sm primary" data-m="load" data-id="${c.id}">Play</button> <button class="btn sm danger" data-m="del" data-id="${c.id}">Delete</button></div></div>`).join('') : '<div class="dim">No saved characters.</div>'}
      <div class="btnrow"><button class="btn" data-m="back">Back</button></div></div></div>`;
    this.root.onclick = (e) => this.onClick(e);
  }

  credits() {
    this.root.classList.remove('hidden');
    this.root.innerHTML = `<div class="create"><div class="create-panel"><h2>Credits</h2>
      <p>Ashfall Covenant is an original vertical slice. All geometry, textures, icons, names, sounds and music are generated procedurally at runtime; no third-party art or audio is bundled.</p>
      <p>Built with TypeScript, Vite and three.js (MIT). Audio is synthesised with the Web Audio API.</p>
      <p class="dim small">Genre principles only: click-to-move combat, packs, affix loot, skill trees, waypoints and boss runs. No names, monsters, items, levels or story beats are taken from any existing game.</p>
      <div class="btnrow"><button class="btn" data-m="back">Back</button></div></div></div>`;
    this.root.onclick = (e) => this.onClick(e);
  }

  error(title: string, body: string, actions: { label: string; fn: () => void }[] = []) {
    this.root.classList.remove('hidden');
    this.root.innerHTML = `<div class="create"><div class="create-panel error"><h2>${esc(title)}</h2><p>${body}</p><div class="btnrow">${actions.map((a, i) => `<button class="btn primary" data-err="${i}">${esc(a.label)}</button>`).join('')}</div></div></div>`;
    this.root.onclick = (e) => {
      const b = (e.target as HTMLElement).closest('[data-err]') as HTMLElement | null;
      if (b) actions[Number(b.dataset.err)].fn();
    };
  }

  private async onClick(e: MouseEvent) {
    const el = (e.target as HTMLElement).closest('[data-m]') as HTMLElement | null;
    if (!el || (el as HTMLButtonElement).disabled) return;
    this.host.playUi();
    const m = el.dataset.m!;
    switch (m) {
      case 'continue':
        this.host.onContinue(el.dataset.id!);
        break;
      case 'create':
        this.create();
        break;
      case 'chars':
        await this.characters();
        break;
      case 'settings':
        this.host.onSettings();
        break;
      case 'credits':
        this.credits();
        break;
      case 'back':
        await this.title();
        break;
      case 'cls':
        this.cls = el.dataset.c as ClassId;
        this.name = (document.getElementById('cname') as HTMLInputElement)?.value ?? this.name;
        this.create();
        break;
      case 'body':
        this.body = Number(el.dataset.i);
        this.name = (document.getElementById('cname') as HTMLInputElement)?.value ?? this.name;
        this.create();
        break;
      case 'voice':
        this.voice = Number(el.dataset.i);
        this.host.previewVoice(this.voice);
        this.name = (document.getElementById('cname') as HTMLInputElement)?.value ?? this.name;
        this.create();
        break;
      case 'begin': {
        const n = (document.getElementById('cname') as HTMLInputElement).value.trim() || 'Warden';
        this.host.onCreate(n, this.cls, this.body, this.voice);
        break;
      }
      case 'load':
        this.host.onLoad(el.dataset.id!);
        break;
      case 'del':
        if (window.confirm('Delete this character permanently?')) {
          await this.host.repo.remove(el.dataset.id!);
          await this.characters();
        }
        break;
    }
  }
}
