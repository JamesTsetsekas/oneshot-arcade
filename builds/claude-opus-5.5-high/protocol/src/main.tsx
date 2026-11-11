import { Component, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import './ui/styles.css';

class Boundary extends Component<{ children: ReactNode }, { err: Error | null }> {
  state = { err: null as Error | null };
  static getDerivedStateFromError(err: Error) {
    return { err };
  }
  render() {
    if (this.state.err)
      return (
        <div className="panel center errorbox">
          <h2>Something went wrong</h2>
          <p>{this.state.err.message}</p>
          <button className="primary" onClick={() => location.reload()}>
            Reload
          </button>
        </div>
      );
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <Boundary>
    <App />
  </Boundary>,
);
