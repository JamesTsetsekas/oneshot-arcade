import { defineConfig } from 'vite';

// Relative base so the static build works from any sub-path.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    target: 'es2022',
    chunkSizeWarningLimit: 1500,
  },
  server: { port: 5300, strictPort: true },
  preview: { port: 5300, strictPort: true },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    testTimeout: 120000,
  },
} as any);
