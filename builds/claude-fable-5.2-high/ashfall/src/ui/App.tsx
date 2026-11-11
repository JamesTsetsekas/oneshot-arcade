import { useEffect, useRef } from 'react';
import { game } from '../app-shell/game';
import { Hud } from './Hud';
import { CharactersScreen, CreateScreen, Credits, DeathScreen, ErrorScreen, MainMenu, PauseMenu, SettingsModal, Summary } from './Menus';
import { CharacterPanel, Dialogs, InventoryPanel, MapPanel, QuestPanel, SkillsPanel } from './Panels';
import { useUi } from './store';

function GameScreen() {
  const canvas = useRef<HTMLCanvasElement>(null), over = useRef<HTMLDivElement>(null);
  const panel = useUi((s) => s.panel), paused = useUi((s) => s.paused), summary = useUi((s) => s.summary), settingsOpen = useUi((s) => s.settingsOpen);
  useEffect(() => { if (canvas.current && over.current) game.attach(canvas.current, over.current); }, []);
  return (
    <div className="game">
      <canvas ref={canvas} className="view" tabIndex={0} />
      <div ref={over} className="overlay-root" />
      <Hud />
      {panel === 'inventory' && <InventoryPanel />}
      {panel === 'skills' && <SkillsPanel />}
      {panel === 'character' && <CharacterPanel />}
      {panel === 'quests' && <QuestPanel />}
      {panel === 'map' && <MapPanel />}
      <Dialogs />
      <DeathScreen />
      {summary && <div className="scrim"><Summary /></div>}
      {paused && !settingsOpen && <div className="scrim"><PauseMenu /></div>}
    </div>
  );
}
export function App() {
  const screen = useUi((s) => s.screen), settingsOpen = useUi((s) => s.settingsOpen);
  return (
    <>
      {screen === 'boot' && <div className="menu"><div className="title"><div className="sigil spin">✦</div><p>Kindling the Refuge…</p></div></div>}
      {screen === 'menu' && <MainMenu />}
      {screen === 'create' && <CreateScreen />}
      {screen === 'characters' && <CharactersScreen />}
      {screen === 'credits' && <Credits />}
      {screen === 'error' && <ErrorScreen />}
      {screen === 'game' && <GameScreen />}
      {settingsOpen && <div className="scrim top"><SettingsModal /></div>}
    </>
  );
}
