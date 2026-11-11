import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 6000,
    target: 'es2022',
  },
  server: { port: 5450, strictPort: true },
  preview: { port: 5451, strictPort: true },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    testTimeout: 180000,
  },
} as any);
