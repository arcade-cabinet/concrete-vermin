import path from "node:path";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

// Real Chromium for canvas/WebGL/Pixi tests.
export default defineConfig({
  test: {
    include: [
      "src/**/*.browser.test.ts",
      "src/**/*.browser.test.tsx",
      "src/render/**/*.test.ts",
      "src/render/**/*.test.tsx",
      "src/render/effects/**/*.test.ts",
    ],
    exclude: ["e2e/**", "node_modules/**", "**/*.dom.test.*"],
    passWithNoTests: true,
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      viewport: { width: 1280, height: 720 },
      instances: [{ browser: "chromium" }],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
