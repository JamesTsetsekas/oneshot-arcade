import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  build: { outDir: 'dist', target: 'es2022', chunkSizeWarningLimit: 6000, sourcemap: false },
  server: { port: 5560, strictPort: true },
  preview: { port: 5560, strictPort: true },
  test: { environment: 'node', include: ['tests/**/*.test.ts'], testTimeout: 120000, hookTimeout: 60000, pool: 'forks', maxWorkers: 3 },
});
