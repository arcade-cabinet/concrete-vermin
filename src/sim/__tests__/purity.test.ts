import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const SIM_ROOT = join(__dirname, "..");
const REPO_ROOT = join(SIM_ROOT, "..", "..");

const FORBIDDEN_IMPORT_RE =
  /from\s+["'](react|react-dom|@pixi\/react|pixi-react|pixi\.js|@pixi\/[^"']+|tone|@capacitor\/[^"']+|@capacitor-community\/[^"']+|framer-motion|@radix-ui\/[^"']+|matter-js)["']/;

const MATH_RANDOM_RE = /\bMath\.random\s*\(/;

function walk(dir: string, ext: RegExp, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const s = statSync(full);
    if (s.isDirectory()) {
      walk(full, ext, out);
    } else if (s.isFile() && ext.test(name)) {
      out.push(full);
    }
  }
  return out;
}

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

describe("src/sim purity (defense in depth)", () => {
  const files = walk(SIM_ROOT, /\.ts$/);

  it("has at least one source file", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it("no production file under src/sim/** imports a forbidden runtime module", () => {
    const violations: string[] = [];
    for (const f of files) {
      if (/\.test\.ts$/.test(f)) continue;
      const stripped = stripComments(readFileSync(f, "utf-8"));
      const m = stripped.match(FORBIDDEN_IMPORT_RE);
      if (m) violations.push(`${relative(REPO_ROOT, f)}: ${m[0]}`);
    }
    expect(violations).toEqual([]);
  });

  it("no production file under src/sim/** calls Math.random()", () => {
    const violations: string[] = [];
    for (const f of files) {
      if (/\.test\.ts$/.test(f)) continue;
      const stripped = stripComments(readFileSync(f, "utf-8"));
      if (MATH_RANDOM_RE.test(stripped)) violations.push(relative(REPO_ROOT, f));
    }
    expect(violations).toEqual([]);
  });

  it("tsc -b tsconfig.sim.json passes (no DOM lib leak) — opt-in via CV_PURITY_TSC=1", () => {
    if (process.env.CV_PURITY_TSC !== "1") {
      expect(true).toBe(true);
      return;
    }
    expect(() =>
      execFileSync("pnpm", ["exec", "tsc", "-b", "tsconfig.sim.json", "--pretty", "false"], {
        cwd: REPO_ROOT,
        stdio: "pipe",
      }),
    ).not.toThrow();
  });
});
