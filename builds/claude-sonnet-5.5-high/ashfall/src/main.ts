import './style.css';
import { App } from './app';

function fatal(title: string, body: string) {
  const root = document.getElementById('app')!;
  root.innerHTML = `<div class="fatal"><h1>${title}</h1><p>${body}</p></div>`;
}

async function start() {
  const root = document.getElementById('app');
  if (!root) return;
  if (!App.hasWebGL2()) {
    fatal('Graphics unavailable', 'Ashfall Covenant needs a browser with WebGL 2 (current desktop Chrome, Edge or Firefox with hardware acceleration enabled). Please enable hardware acceleration or update your browser, then reload.');
    return;
  }
  try {
    const app = new App(root);
    (window as unknown as { __ashfall: App }).__ashfall = app;
    await app.boot();
  } catch (err) {
    console.error(err);
    fatal('Something went wrong while starting', `The game failed to initialise (${String((err as Error)?.message ?? err)}). Reload to retry; saved characters are not affected.`);
  }
}

window.addEventListener('error', (e) => {
  // keep the loop alive; surface a toast if the HUD exists
  console.error(e.error ?? e.message);
});
void start();
