import './style.css';
import { Game } from './game';

function webgl2Available(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!c.getContext('webgl2');
  } catch {
    return false;
  }
}

function fatal(title: string, body: string): void {
  const app = document.getElementById('app')!;
  app.innerHTML = `<div class="screen menu-bg"><div class="panel error-card"><h2>${title}</h2><p style="font-size:16px;line-height:1.6">${body}</p></div></div>`;
}

const app = document.getElementById('app')!;
const canvas = document.getElementById('view') as HTMLCanvasElement;

if (!webgl2Available()) {
  fatal('WebGL 2 is required', 'Skybreak renders with WebGL 2. Please use a recent desktop Chrome or Edge with hardware acceleration enabled, then reload this page.');
} else {
  try {
    const game = new Game(canvas, app);
    game.boot();
    (window as unknown as { __skybreak: Game }).__skybreak = game;
    window.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      game.screens.showError('Graphics context lost', 'The browser reset the GPU context. Reload the page to continue.', [{ label: 'Reload', fn: () => location.reload() }]);
    });
  } catch (err) {
    console.error(err);
    fatal('Skybreak could not start', `Something went wrong while starting the game: ${(err as Error).message}`);
  }
}
