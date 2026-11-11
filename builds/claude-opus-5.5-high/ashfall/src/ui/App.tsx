import React from "react";
import { controller } from "../app/controller";
import { Hud, MapCanvas } from "./hud";
import { ActBanner, CharactersScreen, ConfirmModal, CreateScreen, CreditsScreen, DeathScreen, MainMenu, PauseMenu, SettingsScreen, SummaryScreen, Tutorial } from "./menus";
import { CharacterPanel, InventoryPanel, MapPanel, QuestPanel, SkillsPanel } from "./panels";
import { ArtificerPanel, DialogPanel, HuntPanel, StashPanel, TrainingPanel, VendorPanel, WaypointPanel } from "./services";
import { useStore } from "./store";

export function App() {
  const screen = useStore((s) => s.screen);
  const error = useStore((s) => s.error);
  const loading = useStore((s) => s.loading);
  const settingsFrom = useStore((s) => s.settingsFrom);
  if (screen === "error" && error) {
    return (
      <div className="menu-screen error-screen">
        <h1>Ashfall Covenant</h1>
        <h2>{error.title}</h2>
        <p>{error.detail}</p>
        <button onClick={() => location.reload()}>Retry</button>
      </div>
    );
  }
  if (screen === "boot") return <div className="menu-screen"><div className="loading-text">Loading…</div></div>;
  const inGame = screen === "game" || (screen === "settings" && settingsFrom === "pause");
  return (
    <>
      {inGame && <GameUI />}
      {screen === "menu" && <MainMenu />}
      {screen === "create" && <CreateScreen />}
      {screen === "characters" && <CharactersScreen />}
      {screen === "settings" && <SettingsScreen />}
      {screen === "credits" && <CreditsScreen />}
      {loading && <div className="loading-veil"><div className="loading-text">{loading}</div></div>}
      <ConfirmModal />
    </>
  );
}

function GameUI() {
  const panel = useStore((s) => s.panel);
  const paused = useStore((s) => s.paused);
  const automap = useStore((s) => s.automap);
  const screen = useStore((s) => s.screen);
  const game = controller.game;
  if (!game) return null;
  return (
    <div className="game-ui">
      <Hud />
      {automap && <MapCanvas overlay />}
      <Tutorial />
      {panel && (
        <div className="panel-layer">
          {panel === "inventory" && <InventoryPanel />}
          {panel === "skills" && <SkillsPanel />}
          {panel === "character" && <CharacterPanel />}
          {panel === "quests" && <QuestPanel />}
          {panel === "map" && <MapPanel />}
          {panel === "vendor" && <VendorPanel />}
          {panel === "stash" && <StashPanel />}
          {panel === "artificer" && <ArtificerPanel />}
          {panel === "waypoint" && <WaypointPanel />}
          {panel === "dialog" && <DialogPanel />}
          {panel === "training" && <TrainingPanel />}
          {panel === "hunt" && <HuntPanel />}
        </div>
      )}
      <ActBanner />
      <SummaryScreen />
      <DeathScreen />
      {paused && screen === "game" && <PauseMenu />}
    </div>
  );
}
