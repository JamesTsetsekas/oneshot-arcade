import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: "dist",
    target: "es2022",
    chunkSizeWarningLimit: 4000,
    rollupOptions: { output: { manualChunks: { babylon: ["@babylonjs/core"] } } },
  },
  server: { port: 5520, strictPort: true },
  preview: { port: 5521, strictPort: true },
});
