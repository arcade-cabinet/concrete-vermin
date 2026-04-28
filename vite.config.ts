import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { gzipSync } from "node:zlib";

/**
 * Bundle-size budget: fail the build if any single emitted JS chunk
 * exceeds the gzipped threshold. Caught during `vite build` writeBundle
 * so CI and local builds enforce identically — Pages serves gzipped
 * over the wire, so gzipped is the metric players experience.
 */
function bundleSizeBudget(maxGzipBytes: number): Plugin {
  return {
    name: "cv-bundle-size-budget",
    apply: "build",
    writeBundle(_options, bundle) {
      const offenders: Array<{ name: string; bytes: number }> = [];
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (!fileName.endsWith(".js")) continue;
        if (chunk.type !== "chunk") continue;
        const code = chunk.code ?? "";
        const gzipped = gzipSync(Buffer.from(code, "utf8")).length;
        if (gzipped > maxGzipBytes) {
          offenders.push({ name: fileName, bytes: gzipped });
        }
      }
      if (offenders.length > 0) {
        const msg = offenders
          .map((o) => `  ${o.name}: ${(o.bytes / 1024).toFixed(1)} kB gz`)
          .join("\n");
        throw new Error(
          `Bundle-size budget exceeded — ${offenders.length} chunk(s) above ${(maxGzipBytes / 1024).toFixed(0)} kB gzipped:\n${msg}`,
        );
      }
    },
  };
}

// 1.5 MB gzipped per chunk is the directive ceiling. Currently the
// largest chunk (the main index bundle) lands ≈ 390 kB gz, so this
// budget gives ~4× headroom — it catches accidental ballooning (e.g.
// importing a giant lib by mistake) but doesn't gate normal feature
// growth. Tighten the number when we lazy-load PauseMenu/Settings/etc.
const MAX_CHUNK_GZIP_BYTES = 1.5 * 1024 * 1024;

export default defineConfig({
  base: "/concrete-vermin/",
  plugins: [react(), bundleSizeBudget(MAX_CHUNK_GZIP_BYTES)],
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
