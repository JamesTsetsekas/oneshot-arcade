// App shell: capability detection, error boundary, routing into the React UI.
import { Component, StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '../ui/App';
import '../ui/styles.css';

export function detectCapabilities(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2');
    if (!gl) problems.push('WebGL 2 is not available. Enable hardware acceleration in your browser settings or update your GPU driver.');
    else gl.getExtension('WEBGL_lose_context')?.loseContext();
  } catch { problems.push('WebGL 2 initialization threw an error.'); }
  if (typeof Float32Array === 'undefined' || typeof requestAnimationFrame === 'undefined') problems.push('This browser lacks required JavaScript features.');
  return { ok: problems.length === 0, problems };
}

class Boundary extends Component<{ children: ReactNode }, { err: Error | null }> {
  state = { err: null as Error | null };
  static getDerivedStateFromError(err: Error) { return { err }; }
  render() {
    if (this.state.err) {
      return (
        <div className="screen"><div className="center"><div className="errorBox">
          <h2>Something went wrong</h2>
          <p>{this.state.err.message}</p>
          <p className="muted">Your settings and match history are stored locally and were not affected.</p>
          <button className="btn" onClick={() => location.reload()}>Reload</button>
        </div></div></div>
      );
    }
    return this.props.children;
  }
}

function CapabilityError({ problems }: { problems: string[] }) {
  return (
    <div className="screen"><div className="center"><div className="errorBox">
      <h2>Your browser can't run Shardfront</h2>
      {problems.map((p) => <p key={p}>{p}</p>)}
      <p className="muted">Shardfront targets desktop Chrome, Edge and Firefox with WebGL 2.</p>
      <button className="btn" onClick={() => location.reload()}>Retry</button>
    </div></div></div>
  );
}

const shell = document.getElementById('boot');
const cap = detectCapabilities();
const root = createRoot(document.getElementById('root')!);
root.render(
  <StrictMode>
    <Boundary>{cap.ok ? <App /> : <CapabilityError problems={cap.problems} />}</Boundary>
  </StrictMode>,
);
shell?.remove();
