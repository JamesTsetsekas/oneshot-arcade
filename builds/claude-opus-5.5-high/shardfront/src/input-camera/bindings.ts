// Rebindable key actions. Values are KeyboardEvent.code strings.
export type Action =
  | 'attackMove' | 'stop' | 'hold' | 'patrol' | 'guard' | 'build' | 'rally' | 'focus' | 'alert' | 'home' | 'cycle'
  | 'panUp' | 'panDown' | 'panLeft' | 'panRight' | 'menu' | 'perf' | 'debugNav'
  | 'slot1' | 'slot2' | 'slot3' | 'slot4' | 'slot5' | 'slot6' | 'slot7';

export const ACTION_LABELS: Record<Action, string> = {
  attackMove: 'Attack-move', stop: 'Stop', hold: 'Hold position', patrol: 'Patrol', guard: 'Guard / follow',
  build: 'Construction palette', rally: 'Rally mode', focus: 'Focus selection', alert: 'Jump to latest alert', home: 'Center on base',
  cycle: 'Cycle subtype', panUp: 'Pan up', panDown: 'Pan down', panLeft: 'Pan left', panRight: 'Pan right', menu: 'Menu',
  perf: 'Performance panel', debugNav: 'Navigation debug overlay',
  slot1: 'Command slot 1 (ability Q)', slot2: 'Command slot 2 (ability W)', slot3: 'Command slot 3 (ability E)',
  slot4: 'Command slot 4', slot5: 'Command slot 5', slot6: 'Command slot 6', slot7: 'Command slot 7',
};

export const DEFAULT_BINDINGS: Record<Action, string> = {
  attackMove: 'KeyA', stop: 'KeyS', hold: 'KeyH', patrol: 'KeyP', guard: 'KeyG', build: 'KeyB', rally: 'KeyR',
  focus: 'KeyF', alert: 'Space', home: 'Home', cycle: 'Tab',
  panUp: 'ArrowUp', panDown: 'ArrowDown', panLeft: 'ArrowLeft', panRight: 'ArrowRight', menu: 'F10', perf: 'Backquote', debugNav: 'F9',
  slot1: 'KeyQ', slot2: 'KeyW', slot3: 'KeyE', slot4: 'KeyD', slot5: 'KeyF', slot6: 'KeyC', slot7: 'KeyG',
};

/** Command-card hotkey letter for a binding code (e.g. 'KeyQ' -> 'Q'). */
export function keyLabel(code: string): string {
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  return ({ Space: 'Space', Backquote: '`', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→' } as Record<string, string>)[code] ?? code;
}
