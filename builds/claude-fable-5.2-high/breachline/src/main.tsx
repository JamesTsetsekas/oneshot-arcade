import { createRoot } from 'react-dom/client';
import './ui/styles.css';
import { App } from './ui/App';

createRoot(document.getElementById('ui-root') as HTMLElement).render(<App />);
