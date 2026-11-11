import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { boot } from './app/app';
import { App } from './ui/App';
import './ui/styles.css';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const overlay = document.getElementById('overlay') as HTMLCanvasElement;
const ui = document.getElementById('ui') as HTMLElement;

createRoot(ui).render(<StrictMode><App /></StrictMode>);
void boot(canvas, overlay);
