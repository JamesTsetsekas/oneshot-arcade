import { defineConfig } from "vite";

// Relative base so the build works from any sub-path (delivery contract).
export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    target: "es2022",
    chunkSizeWarningLimit: 6000,
  },
  server: { port: 5350, strictPort: true },
  preview: { port: 5350, strictPort: true },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 120000,
  },
} as any);
