import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    target: "es2022",
    chunkSizeWarningLimit: 4000,
  },
  server: { port: 5470, strictPort: true },
  preview: { port: 5471, strictPort: true },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
} as any);
