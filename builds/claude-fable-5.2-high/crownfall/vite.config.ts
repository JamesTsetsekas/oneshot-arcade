import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// base './' keeps every URL relative so dist/ works from any sub-path.
export default defineConfig({
  base: './',
  plugins: [react()],
  worker: { format: 'es' },
  build: { outDir: 'dist', target: 'es2022', chunkSizeWarningLimit: 1500 },
  server: { port: 5340, strictPort: true },
  preview: { port: 5341, strictPort: true },
  test: { include: ['tests/**/*.test.ts'], environment: 'node', testTimeout: 120000 },
});
