import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react()],
  build: { target: 'es2022', chunkSizeWarningLimit: 2500, sourcemap: false },
  server: { port: 5310, strictPort: true },
  test: { environment: 'node', include: mode === 'probe' ? ['tests/**/*.probe.ts'] : ['tests/**/*.test.ts'], testTimeout: 60000 },
}) as any);
