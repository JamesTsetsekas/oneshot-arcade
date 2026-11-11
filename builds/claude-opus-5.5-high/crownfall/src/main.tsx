// Entry: capability checks, then the React shell.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './client/ui/App';
import './styles.css';

function capabilityError(): string | null {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2');
    if (!gl) return 'WebGL 2 is not available in this browser. Crownfall needs a WebGL 2 capable browser (current Chrome, Edge or Firefox) with hardware acceleration enabled.';
  } catch {
    return 'WebGL 2 could not be initialised.';
  }
  if (typeof Worker === 'undefined') return 'Web Workers are not available; the simulation room cannot start.';
  return null;
}

const root = createRoot(document.getElementById('root')!);
const err = capabilityError();
const params = new URLSearchParams(location.search);
const demoParam = params.get('demo');
const demo = demoParam !== null ? { minutes: Number(demoParam) || 8, seed: Number(params.get('seed') ?? 11) } : null;
if (err) {
  root.render(
    <div className="screen error-screen">
      <h1>Crownfall can't start</h1>
      <p>{err}</p>
      <p className="muted">Check chrome://gpu or edge://gpu, enable hardware acceleration, and reload.</p>
    </div>,
  );
} else {
  root.render(<App demo={demo} />);
}
