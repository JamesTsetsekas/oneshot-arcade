import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: { outDir: 'dist', target: 'es2022', chunkSizeWarningLimit: 1200 },
  server: { port: 5550, strictPort: true },
  test: { include: ['tests/**/*.test.ts'], environment: 'node', testTimeout: 60000 },
});
