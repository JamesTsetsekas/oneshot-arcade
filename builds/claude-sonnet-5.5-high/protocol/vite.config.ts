import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: { outDir: 'dist', target: 'es2022', chunkSizeWarningLimit: 1200 },
  server: { port: 5530, strictPort: true },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
} as any);
