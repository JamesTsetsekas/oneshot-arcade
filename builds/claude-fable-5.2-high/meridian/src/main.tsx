// app-shell boot: capability check, React shell, offline cache registration.
import { createRoot } from 'react-dom/client';
import { Game } from './game-session/game';
import { App } from './app-shell/App';
import './styles.css';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const game = new Game(canvas, document.getElementById('hud')!);
createRoot(document.getElementById('ui')!).render(<App game={game} />);
void game.boot();

// Offline-capable after first load: a small cache-first service worker (production builds only).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => undefined); });
}
