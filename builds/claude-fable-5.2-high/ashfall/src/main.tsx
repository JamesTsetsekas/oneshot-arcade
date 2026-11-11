import { createRoot } from 'react-dom/client';
import { game } from './app-shell/game';
import { App } from './ui/App';
import { ui } from './ui/store';
import './ui/styles.css';

createRoot(document.getElementById('root')!).render(<App />);
window.addEventListener('error', (e) => { if (ui.get().screen === 'boot') ui.set({ screen: 'error', error: e.message }); });
void game.boot().catch((e) => ui.set({ screen: 'error', error: String(e?.message ?? e) }));
// Automation hook for the screenshot script and manual debugging (no UI exposes it).
(window as unknown as { __ashfall: unknown }).__ashfall = game;
