import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// base "./" keeps every URL relative so the build works from any sub-path.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    target: 'es2022',
    chunkSizeWarningLimit: 8000,
  },
  server: { port: 5370, strictPort: true },
  preview: { port: 5371, strictPort: true },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 120000,
  },
});
