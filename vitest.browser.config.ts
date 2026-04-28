import path from "node:path";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

// Real Chromium for canvas/WebGL/Pixi tests.
export default defineConfig({
  test: {
    include: ["src/**/*.browser.test.ts", "src/**/*.browser.test.tsx"],
    exclude: ["e2e/**", "node_modules/**"],
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
