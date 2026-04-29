import { defineConfig } from "vitest/config";
import path from "node:path";

// jsdom for presentational React components without WebGL/Canvas.
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["src/ui/__tests__/setup.ts"],
    include: [
      "src/ui/**/*.dom.test.ts",
      "src/ui/**/*.dom.test.tsx",
      "src/platform/**/*.dom.test.ts",
      "src/governor/**/*.dom.test.tsx",
      "src/render/**/*.dom.test.tsx",
    ],
    exclude: ["e2e/**", "node_modules/**"],
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
