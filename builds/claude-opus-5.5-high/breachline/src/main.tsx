import { createRoot } from "react-dom/client";
import { App } from "./ui/App";
import "./ui/styles.css";

function capabilityError(): string | null {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2");
    if (!gl) return "WebGL 2 is not available. Breachline needs a desktop browser with WebGL 2 enabled (Chrome, Edge or Firefox) and hardware acceleration turned on.";
  } catch {
    return "WebGL 2 could not be initialised.";
  }
  if (!("AudioContext" in window)) return "The Web Audio API is not available in this browser.";
  return null;
}

const root = document.getElementById("root")!;
const err = capabilityError();
if (err) {
  root.innerHTML = `<div class="fatal"><h1>BREACHLINE</h1><h2>This browser can't run the game</h2><p>${err}</p><p>Check chrome://gpu (or edge://gpu) and make sure "Use hardware acceleration" is enabled.</p></div>`;
} else {
  createRoot(root).render(<App />);
}
