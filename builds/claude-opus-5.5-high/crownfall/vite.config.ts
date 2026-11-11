import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: { outDir: 'dist', target: 'es2022', chunkSizeWarningLimit: 1500 },
  worker: { format: 'es' },
  server: { port: 5440, strictPort: true },
  preview: { port: 5441, strictPort: true },
  test: { environment: 'node', include: ['tests/**/*.test.ts'], testTimeout: 120000 },
} as any);
