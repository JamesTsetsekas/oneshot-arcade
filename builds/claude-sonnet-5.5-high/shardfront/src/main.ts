// app-shell: boot, capability detection, error boundary.
import { App } from './app/app';
import { defIndex } from './data';
import { createAI } from './ai/ai';
import { openRepository, sanitizeSettings } from './app/persist';

function showFatal(title: string, html: string) {
  document.getElementById('boot')?.remove();
  const root = document.getElementById('app')!;
  root.innerHTML = `<div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#07090d;color:#d7e4ee;font-family:system-ui,sans-serif"><div style="max-width:640px;padding:28px 34px;border:1px solid #2b3b4d;background:#0d1219;line-height:1.6"><h2 style="margin:0 0 12px;color:#ff6a5a;font-weight:400;letter-spacing:.15em;text-transform:uppercase">${title}</h2><div style="color:#b8c8d6;font-size:14px">${html}</div></div></div>`;
}

function detectCapabilities(): string | null {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2');
    if (!gl) return 'webgl2';
    return null;
  } catch {
    return 'webgl2';
  }
}

async function boot() {
  const missing = detectCapabilities();
  if (missing) {
    showFatal('WebGL 2 is required', 'Shardfront needs a browser with WebGL 2 and hardware acceleration.<br><br>• Use a current desktop Chrome or Edge.<br>• Make sure hardware acceleration is enabled (Settings → System).<br>• Update your graphics driver, then reload this page.');
    return;
  }
  const root = document.getElementById('app')!;
  try {
    const repo = await openRepository();
    const saved = await repo.get<unknown>('settings', 'main');
    const settings = sanitizeSettings(saved);
    const app = new App(root, repo, settings);
    (window as unknown as { __app: App; __defIndex: unknown }).__app = app;
    (window as unknown as { __defIndex: unknown; __createAI: unknown }).__defIndex = defIndex;
    (window as unknown as { __createAI: unknown }).__createAI = createAI;
    await app.init();
    if (new URLSearchParams(location.search).has('bench')) await app.startBenchmark();
  } catch (e) {
    console.error(e);
    showFatal('Something went wrong while starting', `${String((e as Error)?.message ?? e).replace(/[<>&]/g, '')}<br><br>Reload the page. If the problem persists, clear this site's data and try again.`);
  }
}

window.addEventListener('error', (e) => { console.error(e.error ?? e.message); });
void boot();
