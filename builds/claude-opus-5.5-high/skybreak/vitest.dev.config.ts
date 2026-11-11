import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['tests/dev/*.dev.ts'], testTimeout: 900000 } });
