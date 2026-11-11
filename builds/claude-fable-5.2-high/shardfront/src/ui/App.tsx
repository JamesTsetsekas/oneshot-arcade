// ui: screen router. The 3D canvas lives outside React; this layer only draws menus and overlays.
import { Hud } from './Hud';
import { Archive, Credits, ErrorScreen, Loading, Menu, PostGame, Replays, SettingsScreen, Setup } from './Screens';
import { useStore } from './store';

export function App() {
  const screen = useStore((s) => s.screen);
  switch (screen) {
    case 'boot': case 'loading': return <Loading />;
    case 'error': return <ErrorScreen />;
    case 'menu': return <Menu />;
    case 'setup': return <Setup />;
    case 'archive': return <Archive />;
    case 'replays': return <Replays />;
    case 'settings': return <SettingsScreen />;
    case 'credits': return <Credits />;
    case 'postgame': return <PostGame />;
    case 'game': return <Hud />;
  }
  return null;
}
