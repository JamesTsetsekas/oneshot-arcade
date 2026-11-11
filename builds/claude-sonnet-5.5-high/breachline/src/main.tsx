import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./client/ui/styles.css";
import { App } from "./client/ui/App";

function capability(): string | null {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2");
    if (!gl) return "This game needs WebGL 2, and your browser or GPU did not provide it. Try a current desktop Chrome or Edge with hardware acceleration enabled.";
  } catch { return "Creating a WebGL 2 context failed. Enable hardware acceleration in your browser settings and reload."; }
  if (!window.AudioContext && !(window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext) return "Web Audio is not available in this browser.";
  return null;
}

const root = document.getElementById("root")!;
const problem = capability();
if (problem) {
  root.innerHTML = `<div class="errscreen"><div class="box"><h1>Cannot start Breachline</h1><p>${problem}</p><p>Required: desktop Chrome / Edge / Firefox, WebGL 2, Web Audio, keyboard and mouse (Pointer Lock).</p></div></div>`;
} else {
  createRoot(root).render(<StrictMode><App /></StrictMode>);
}
