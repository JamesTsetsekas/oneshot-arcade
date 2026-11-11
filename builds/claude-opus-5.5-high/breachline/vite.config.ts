import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: "dist",
    target: "es2022",
    chunkSizeWarningLimit: 6000,
  },
  server: { port: 5420, strictPort: true },
  preview: { port: 5421, strictPort: true },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    testTimeout: 60000,
  },
} as any);
