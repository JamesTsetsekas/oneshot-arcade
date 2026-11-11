import { defineConfig } from 'vitest/config';
// Development probes (balance sweeps, round traces). Not part of `npm test`.
//   BALANCE=1 npx vitest run --config tools/probes/vitest.config.ts balance
//   TRACE=1 npx vitest run --config tools/probes/vitest.config.ts trace
export default defineConfig({ test: { include: ['tools/probes/**/*.test.ts'], environment: 'node', testTimeout: 600000 } });
