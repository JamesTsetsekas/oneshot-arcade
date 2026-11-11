import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import './styles.css';

function hasWebGL2() {
  try {
    const c = document.createElement('canvas');
    return !!c.getContext('webgl2');
  } catch {
    return false;
  }
}

createRoot(document.getElementById('root')!).render(<App webgl2={hasWebGL2()} />);
