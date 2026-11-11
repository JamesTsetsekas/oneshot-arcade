import { defineConfig } from 'vite';

// Developer tools (balance simulator, benchmark) run through Vitest's TypeScript pipeline but are not part of `npm test`.
export default defineConfig({
  test: { include: ['tools/**/*.tool.ts'], environment: 'node', testTimeout: 1200000, silent: false },
} as any);
