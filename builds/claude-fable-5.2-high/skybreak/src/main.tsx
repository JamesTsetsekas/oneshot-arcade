import { createRoot } from "react-dom/client";
import { game } from "./client/game";
import { App } from "./client/ui/App";
import { settingsStore } from "./client/runtime/settings";
import "./client/ui/ui.css";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const overlay = document.getElementById("overlay") as HTMLCanvasElement;
createRoot(document.getElementById("ui")!).render(<App />);
void game.boot(canvas, overlay);
// Debug handle for automated capture and the perf overlay (?perf). Not used by gameplay code.
(window as unknown as { __skybreak: typeof game }).__skybreak = game;
(window as unknown as { __skybreakSettings: typeof settingsStore }).__skybreakSettings = settingsStore;
