import { defineConfig } from "vitest/config";
import path from "node:path";

// Node-only: pure simulation, ECS, lib, render-pure-helpers, platform.
export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: [
      "src/sim/**/*.test.ts",
      "src/ecs/**/*.test.ts",
      "src/data/**/*.test.ts",
      "src/lib/**/*.test.ts",
      "src/render/**/*.test.ts",
      "src/platform/**/*.test.ts",
      "src/theme/**/*.test.ts",
      "src/runtime/**/*.test.ts",
      "src/audio/**/*.test.ts",
      "src/input/**/*.test.ts",
      "src/governor/**/*.test.ts",
      // Pure-logic UI tests (stores, copy modules, helpers) — no DOM.
      // Anything that needs jsdom uses the .dom.test.ts suffix and goes
      // through vitest.dom.config.ts.
      "src/ui/**/*.test.ts",
      // Build-script unit tests (perf gate math, etc.) — pure logic.
      "scripts/__tests__/**/*.test.ts",
    ],
    exclude: ["e2e/**", "node_modules/**", "**/*.dom.test.*", "**/*.browser.test.*"],
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@/sim": path.resolve(__dirname, "src/sim"),
      "@/ecs": path.resolve(__dirname, "src/ecs"),
      "@/lib": path.resolve(__dirname, "src/lib"),
      "@/render": path.resolve(__dirname, "src/render"),
      "@/platform": path.resolve(__dirname, "src/platform"),
    },
  },
});
