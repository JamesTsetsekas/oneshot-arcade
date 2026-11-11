// App shell entry: fonts, styles, React menus and game boot with a clear error screen.
import '@fontsource/lilita-one/400.css';
import '@fontsource/rubik/400.css';
import '@fontsource/rubik/500.css';
import '@fontsource/rubik/700.css';
import '../ui/styles.css';
import { createRoot } from 'react-dom/client';
import { App } from '../ui/App';
import { ui } from '../ui/store';
import { game } from './game';

createRoot(document.getElementById('ui-root')!).render(<App />);

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const hudRoot = document.getElementById('hud-root') as HTMLElement;
game.init(canvas, hudRoot).catch((err: unknown) => {
  console.error(err);
  ui.set({ screen: 'error', error: err instanceof Error ? err.message : String(err) });
});
