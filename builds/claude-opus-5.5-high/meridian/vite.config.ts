import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    target: "es2022",
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
        },
      },
    },
  },
  server: { port: 5460, strictPort: true },
  preview: { port: 5460, strictPort: true },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 60000,
  },
} as any);
