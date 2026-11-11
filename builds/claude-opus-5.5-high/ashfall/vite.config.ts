import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  worker: { format: "es" },
  build: {
    outDir: "dist",
    target: "es2022",
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      output: {
        manualChunks: (id: string) => (id.includes("@babylonjs") ? "babylon" : id.includes("node_modules") ? "vendor" : undefined),
      },
    },
  },
  server: { port: 5410, strictPort: true },
  preview: { port: 5411, strictPort: true },
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
} as any);
