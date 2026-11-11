import { createRoot } from 'react-dom/client';
import { GameClient, type MatchConfig } from './client/game';
import { loadHistory, loadSettings } from './client/settings';
import './styles.css';
import { App } from './ui/App';
import { UiStore } from './ui/store';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const hudRoot = document.getElementById('hud') as HTMLElement;
const uiRoot = document.getElementById('ui') as HTMLElement;

const store = new UiStore({
  screen: 'loading',
  loadingText: 'Starting renderer',
  error: '',
  overlay: '',
  scoreboard: false,
  needClick: false,
  buy: null,
  buyMsg: '',
  board: null,
  summary: null,
  settings: loadSettings(),
  history: loadHistory(),
});

function fail(message: string): void {
  store.set({ screen: 'error', error: message });
}

function supportsWebGL2(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!c.getContext('webgl2');
  } catch {
    return false;
  }
}

let game: GameClient | null = null;
const root = createRoot(uiRoot);

if (!supportsWebGL2()) {
  root.render(<App game={null as unknown as GameClient} store={store} />);
  fail('This browser or device does not provide WebGL 2, which Last Protocol requires. Try a current desktop Chrome or Edge with hardware acceleration enabled.');
} else {
  try {
    game = new GameClient(canvas, hudRoot, store);
    root.render(<App game={game} store={store} />);
    const g = game;
    g.core.engine.onContextLostObservable.add(() => fail('The graphics context was lost. Reload the page to continue.'));
    void g
      .init()
      .then(() => {
        // optional deep links, used for automated capture and the latency lab: ?autostart=quick&side=atk&autopilot=1&lag=50
        const q = new URLSearchParams(location.search);
        const auto = q.get('autostart');
        if (auto === 'quick' || auto === 'full' || auto === 'practice') {
          const cfg: MatchConfig = {
            mode: auto,
            side: q.get('side') === 'def' ? 'def' : 'atk',
            difficulty: (q.get('difficulty') as MatchConfig['difficulty']) || 'normal',
            autopilot: q.get('autopilot') === '1',
            seed: q.get('seed') ? Number(q.get('seed')) : undefined,
            lag: q.get('lag') ? Number(q.get('lag')) : undefined,
          };
          g.startMatch(cfg);
        }
      })
      .catch((e: unknown) => {
        console.error(e);
        fail('The game failed to initialise: ' + (e instanceof Error ? e.message : String(e)));
      });
    // automation / debugging handle (read-mostly; not a gameplay console)
    (window as unknown as Record<string, unknown>).__lp = {
      game: g,
      state: () => g.debugState(),
      start: (cfg: MatchConfig) => g.startMatch(cfg),
    };
  } catch (e) {
    console.error(e);
    root.render(<App game={null as unknown as GameClient} store={store} />);
    fail('The renderer could not start: ' + (e instanceof Error ? e.message : String(e)));
  }
}
