import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@/sim": path.resolve(__dirname, "src/sim"),
      "@/ecs": path.resolve(__dirname, "src/ecs"),
      "@/render": path.resolve(__dirname, "src/render"),
      "@/ui": path.resolve(__dirname, "src/ui"),
      "@/audio": path.resolve(__dirname, "src/audio"),
      "@/platform": path.resolve(__dirname, "src/platform"),
      "@/lib": path.resolve(__dirname, "src/lib"),
    },
  },
  build: {
    target: "es2022",
    sourcemap: true,
  },
  server: { host: true },
  preview: { host: "127.0.0.1", port: 41739 },
});
