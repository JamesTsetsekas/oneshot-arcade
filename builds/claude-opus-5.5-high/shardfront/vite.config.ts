import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Restrictive CSP injected for production builds only (dev server needs HMR websockets).
const csp = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'none'";
function cspPlugin(): Plugin {
  return {
    name: 'shardfront-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace('<!--CSP-->', `<meta http-equiv="Content-Security-Policy" content="${csp}">`);
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), cspPlugin()],
  build: { outDir: 'dist', target: 'es2022', chunkSizeWarningLimit: 2000, sourcemap: false },
  server: { port: 5400, strictPort: true },
  preview: { port: 5401, strictPort: true },
  test: { environment: 'node', include: ['tests/**/*.test.ts'], testTimeout: 120000 },
} as any);
