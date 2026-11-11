// app-shell: user settings (persisted through the repository).
export type Quality = 'low' | 'medium' | 'high';
export type Palette = 'default' | 'deuteranopia' | 'highContrast';

export interface Settings {
  quality: Quality;
  renderScale: number;
  shadows: boolean;
  bloom: boolean;
  antialias: boolean;
  effects: number;
  master: number;
  music: number;
  sfx: number;
  ui: number;
  edgeScroll: boolean;
  panSpeed: number;
  reducedMotion: boolean;
  palette: Palette;
  notifications: boolean;
  keys: Record<string, string>;
}

export const DEFAULT_KEYS: Record<string, string> = {
  attackMove: 'KeyA', stop: 'KeyS', hold: 'KeyH', patrol: 'KeyP', guard: 'KeyG', build: 'KeyB', rally: 'KeyR',
  slot1: 'KeyQ', slot2: 'KeyW', slot3: 'KeyE', slot4: 'KeyT', slot5: 'KeyD', slot6: 'KeyZ',
  cancel: 'KeyX', focus: 'KeyF', jumpAlert: 'Space', jumpBase: 'Home', cycle: 'Tab', menu: 'F10', perf: 'Backquote',
  panUp: 'ArrowUp', panDown: 'ArrowDown', panLeft: 'ArrowLeft', panRight: 'ArrowRight',
  idleWorker: 'Period',
};

export const KEY_LABELS: Record<string, string> = {
  attackMove: 'Attack-move', stop: 'Stop', hold: 'Hold position', patrol: 'Patrol', guard: 'Guard / follow', build: 'Build palette', rally: 'Set rally point',
  slot1: 'Command slot 1', slot2: 'Command slot 2', slot3: 'Command slot 3', slot4: 'Command slot 4', slot5: 'Command slot 5', slot6: 'Command slot 6',
  cancel: 'Cancel last queue item', focus: 'Focus selection', jumpAlert: 'Jump to latest alert', jumpBase: 'Jump to starting base', cycle: 'Cycle unit types', menu: 'Pause menu', perf: 'Performance panel',
  panUp: 'Pan up', panDown: 'Pan down', panLeft: 'Pan left', panRight: 'Pan right', idleWorker: 'Select idle worker',
};

export const DEFAULT_SETTINGS: Settings = {
  quality: 'high', renderScale: 1, shadows: true, bloom: true, antialias: true, effects: 1,
  master: 0.8, music: 0.5, sfx: 0.8, ui: 0.7,
  edgeScroll: false, panSpeed: 1, reducedMotion: false, palette: 'default', notifications: true,
  keys: { ...DEFAULT_KEYS },
};

export const QUALITY_PRESETS: Record<Quality, Partial<Settings>> = {
  low: { renderScale: 0.75, shadows: false, bloom: false, effects: 0.4 },
  medium: { renderScale: 1, shadows: true, bloom: false, effects: 0.7 },
  high: { renderScale: 1, shadows: true, bloom: true, effects: 1 },
};

export const PALETTES: Record<Palette, { self: number; enemy: number; neutral: number; label: string }> = {
  default: { self: 0x3aa8ff, enemy: 0xff5236, neutral: 0xaab2bf, label: 'Azure / Ember' },
  deuteranopia: { self: 0x3d8bff, enemy: 0xffc21a, neutral: 0xaab2bf, label: 'Blue / Gold (colour-blind safe)' },
  highContrast: { self: 0x33ffe0, enemy: 0xff3ad0, neutral: 0xd0d0d0, label: 'Cyan / Magenta (high contrast)' },
};

export function mergeSettings(raw: unknown): Settings {
  const s: Settings = { ...DEFAULT_SETTINGS, keys: { ...DEFAULT_KEYS } };
  if (!raw || typeof raw !== 'object') return s;
  const r = raw as Record<string, unknown>;
  for (const k of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
    if (k === 'keys') continue;
    if (typeof r[k] === typeof DEFAULT_SETTINGS[k]) (s as unknown as Record<string, unknown>)[k] = r[k];
  }
  if (r.keys && typeof r.keys === 'object') {
    for (const k of Object.keys(DEFAULT_KEYS)) {
      const v = (r.keys as Record<string, unknown>)[k];
      if (typeof v === 'string' && v.length < 24) s.keys[k] = v;
    }
  }
  s.renderScale = Math.min(1, Math.max(0.5, s.renderScale));
  if (!(s.palette in PALETTES)) s.palette = 'default';
  if (!(s.quality in QUALITY_PRESETS)) s.quality = 'high';
  return s;
}

export function keyName(code: string): string {
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Arrow')) return { ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→' }[code] ?? code;
  return { Space: 'Space', Backquote: '`', Period: '.', Comma: ',', Escape: 'Esc' }[code] ?? code;
}
