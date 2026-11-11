import { defineConfig } from 'vite';

// base "./" keeps every URL relative so the build can be hosted from any sub-path.
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    outDir: 'dist',
    chunkSizeWarningLimit: 9000,
    sourcemap: false,
  },
  server: { port: 5360, strictPort: true },
  preview: { port: 5361, strictPort: true },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 60000,
  },
} as any);
