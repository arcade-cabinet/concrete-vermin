import { defineConfig } from "vitest/config";
import path from "node:path";

// Real Chromium for canvas/WebGL/Pixi tests.
export default defineConfig({
  test: {
    include: ["src/**/*.browser.test.ts", "src/**/*.browser.test.tsx"],
    exclude: ["e2e/**", "node_modules/**"],
    passWithNoTests: true,
    browser: {
      enabled: true,
      provider: "playwright",
      headless: true,
      instances: [{ browser: "chromium" }],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
