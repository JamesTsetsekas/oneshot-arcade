import React from "react";
import { createRoot } from "react-dom/client";
import { controller } from "./app/controller";
import { App } from "./ui/App";
import { store } from "./ui/store";
import "./ui/styles.css";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const overlay = document.getElementById("overlay3d") as HTMLElement;
const root = createRoot(document.getElementById("ui")!);
root.render(<App />);

window.addEventListener("error", (e) => {
  console.error(e.error ?? e.message);
});
window.addEventListener("unhandledrejection", (e) => console.error(e.reason));

controller.boot(canvas, overlay).then(() => {
  (window as any).__ashSettings = controller.settings;
  (window as any).__ash = { controller, store };
}).catch((err) => {
  store.set({ screen: "error", error: { title: "Startup failed", detail: String(err) } });
});
