import './ui/styles.css';
import { Game, DevFlags } from './client/game';
import { Menus } from './ui/menus';

function capabilityErrors(canvas: HTMLCanvasElement): string[] {
  const errors: string[] = [];
  let gl: WebGL2RenderingContext | null = null;
  try { gl = canvas.getContext('webgl2'); } catch { gl = null; }
  if (!gl) errors.push('WebGL 2 is not available. Use a current desktop Chrome or Edge with hardware acceleration enabled.');
  if (!('requestPointerLock' in HTMLElement.prototype)) errors.push('Pointer Lock is not supported by this browser.');
  if (typeof (window as any).AudioContext === 'undefined' && typeof (window as any).webkitAudioContext === 'undefined') errors.push('Web Audio is not available.');
  try { localStorage.getItem('x'); } catch { /* settings just will not persist */ }
  return errors;
}

function parseDev(): DevFlags {
  const q = new URLSearchParams(location.search);
  const dev = q.get('dev') === '1';
  return {
    dev,
    autoplay: dev && q.get('autoplay') === '1',
    seed: q.has('seed') ? Number(q.get('seed')) : undefined,
    side: q.get('side') === 'cus' ? 'cus' : q.get('side') === 'int' ? 'int' : undefined,
    rules: q.get('rules') === 'full' ? 'full' : 'quick',
    difficulty: (['easy', 'normal', 'hard'] as const).find((d) => d === q.get('difficulty')),
    practice: q.get('practice') === '1',
  };
}

function boot(): void {
  const canvas = document.getElementById('view') as HTMLCanvasElement;
  const screens = document.getElementById('screens')!;
  const errors = capabilityErrors(canvas);
  if (errors.length) {
    const m = new Menus(screens, () => ({}) as never);
    m.showError('Cannot start Last Protocol', errors.join(' '), '<p style="color:var(--dim);margin-top:14px">Required: WebGL 2, Pointer Lock, Web Audio. Target: desktop Chrome or Edge, keyboard and mouse.</p>');
    return;
  }
  let game: Game;
  try {
    game = new Game(canvas, document.getElementById('app')!, parseDev());
  } catch (e) {
    const m = new Menus(screens, () => ({}) as never);
    m.showError('Graphics initialisation failed', String((e as Error)?.message ?? e), '<p style="color:var(--dim);margin-top:14px">Check that hardware acceleration is enabled and reload.</p>');
    return;
  }
  const dev = game.dev;
  (window as any).__lp = { game, state: () => game.debugState() };
  game.menus.showTitle();
  if (dev.dev && (new URLSearchParams(location.search).get('start') === '1')) {
    game.startMatch({ mode: dev.practice ? 'practice' : 'match', rules: dev.rules ?? 'quick', side: dev.side ?? 'int', difficulty: dev.difficulty ?? 'normal' });
  }
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    new Menus(screens, () => ({}) as never).showError('Graphics context lost', 'The GPU reset the WebGL context. Reload the page to continue.');
  });
}

boot();
