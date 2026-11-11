import { defineConfig, type Plugin } from 'vite';

// Restrictive CSP is injected for production builds only (the dev server needs inline HMR scripts / websockets).
const csp = (): Plugin => ({
  name: 'shardfront-csp',
  apply: 'build',
  transformIndexHtml(html) {
    const policy =
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'";
    return html.replace('<!--CSP-->', `<meta http-equiv="Content-Security-Policy" content="${policy}">`);
  },
});

export default defineConfig({
  base: './',
  plugins: [csp()],
  build: { target: 'es2022', outDir: 'dist', chunkSizeWarningLimit: 1200 },
});
