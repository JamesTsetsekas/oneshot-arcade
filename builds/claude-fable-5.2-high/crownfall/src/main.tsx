import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './client/ui/App';
import './client/ui/styles.css';

const root = document.getElementById('root');
if (root) {
  // StrictMode is skipped for the match itself (double-mounting would start two simulations);
  // the shell has no effects that depend on it.
  createRoot(root).render(<App />);
}
void StrictMode;
