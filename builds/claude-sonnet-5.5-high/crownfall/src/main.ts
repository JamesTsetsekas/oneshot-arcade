import './client/style.css';
import { App } from './client/app';

const root = document.getElementById('app');
if (root) {
  const app = new App(root);
  app.start();
  (window as unknown as { __crownfall: App }).__crownfall = app;
}
