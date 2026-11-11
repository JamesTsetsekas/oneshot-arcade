// Boot: capability checks, then the app shell.
import "./ui/styles.css";

function fatal(title: string, body: string) {
  document.getElementById("loading")?.remove();
  const d = document.createElement("div");
  d.className = "fatal";
  d.innerHTML = `<div class="box"><h1>${title}</h1><p>${body}</p></div>`;
  document.body.appendChild(d);
}

function hasWebGL2(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!c.getContext("webgl2");
  } catch {
    return false;
  }
}

async function main() {
  if (!hasWebGL2()) {
    fatal("WebGL 2 required", "Farestorm needs a browser with WebGL 2 enabled (current Chrome, Edge or Firefox on a desktop GPU). Check that hardware acceleration is turned on in your browser settings, then reload.");
    return;
  }
  // let the loading screen paint before the heavy city build
  await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 30)));
  try {
    const { App } = await import("./app");
    const canvas = document.getElementById("game") as HTMLCanvasElement;
    const app = new App(canvas, document.getElementById("ui")!);
    await app.boot();
    (window as unknown as { farestorm: unknown }).farestorm = app;
    const l = document.getElementById("loading");
    if (l) { l.style.opacity = "0"; setTimeout(() => l.remove(), 500); }
  } catch (e) {
    console.error(e);
    fatal("Something went wrong", `The game failed to start: ${(e as Error)?.message ?? e}. Try reloading the page.`);
  }
}

main();
