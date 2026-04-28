#!/usr/bin/env node
// Pre-edit enforcement gates for Concrete Vermin.
// Blocks edits that violate STANDARDS.md gates BEFORE they hit disk.
//
// Reads PreToolUse JSON from stdin. Exits non-zero with a message to
// reject the edit. Exits 0 (silent) to allow.
//
// Gates enforced:
//   1. Sim-purity: forbidden imports + Math.random in src/sim/**
//   2. Brand-no-neon: forbidden hex colors outside src/render/effects/crt.ts
//   3. Factory pyramid: direct world.spawn(Vermin... outside factories
//   4. UI no-direct-render: src/ui/** can't import src/render/** except via pixi-react bridge

import { readFileSync } from "node:fs";

const FORBIDDEN_NEON_HEX = [
  /#00f0ff/i, // POC neon cyan
  /#ff00ff/i, // neon magenta
  /#39ff14/i, // neon green
  /#ff2a2a/i, // POC neon red — replaced by brick #7a2818
  /#ffd700/i, // POC neon gold — replaced by sodium #d4943a
];

// Match the BARE module specifier inside a real import/require statement,
// not the literal string anywhere in the file. Otherwise a JSON key like
// `"tone": "pulpy"` or a comment mentioning React triggers a false reject.
//
// Two forms covered: `from "mod"` / `from 'mod'` and `require("mod")`.
// Pattern arg is a regex source fragment (escape regex meta yourself).
const importRe = (modSrc) => new RegExp(`(?:from\\s*|require\\s*\\(\\s*)["']${modSrc}["']`);

const FORBIDDEN_SIM_IMPORTS = [
  importRe("react"),
  importRe("react-dom"),
  importRe("@pixi/react"),
  importRe("pixi-react"),
  importRe("pixi\\.js"),
  importRe("@pixi/[^\"']+"),
  importRe("tone"),
  importRe("@capacitor/[^\"']+"),
  importRe("@capacitor-community/[^\"']+"),
  importRe("framer-motion"),
  importRe("@radix-ui/[^\"']+"),
  importRe("matter-js"),
];

let input = "";
try {
  input = readFileSync(0, "utf-8");
} catch {
  process.exit(0);
}

let event;
try {
  event = JSON.parse(input);
} catch {
  process.exit(0);
}

const { tool_input: ti = {} } = event;
const path = ti.file_path ?? ti.filePath ?? "";
const content = ti.content ?? ti.new_string ?? "";

if (!path || !content) process.exit(0);

const reject = (msg) => {
  process.stderr.write(`[concrete-vermin pre-edit-gate] ${msg}\n`);
  process.exit(2); // 2 = block tool call
};

// Normalize Windows backslashes so the segment patterns work everywhere.
const normalizedPath = path.replace(/\\/g, "/");
const isInSim = /(^|\/)src\/sim\//.test(normalizedPath);
const isPurityTest = /(^|\/)src\/sim\/__tests__\/purity\.test\.ts$/.test(normalizedPath);
const isInRender = /(^|\/)src\/render\//.test(normalizedPath);
const isInUi = /(^|\/)src\/ui\//.test(normalizedPath);
const isCrtFile = normalizedPath.endsWith("src/render/effects/crt.ts");

// Source-code-only check: skip data files (json/md/txt/csv/svg/png/etc).
// Sim-purity is about TS source — JSON content, fixtures, and prose
// can legitimately contain the word "tone" or "react" without being imports.
const isSourceFile = /\.(?:ts|tsx|js|jsx|mjs|cjs|mts|cts)$/.test(normalizedPath);

// 1. Sim-purity
if (isInSim && isSourceFile && !isPurityTest) {
  // Strip line/block comments before checking — comments may legitimately
  // reference Math.random / forbidden libraries.
  const stripped = content.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
  if (/\bMath\.random\s*\(/.test(stripped)) {
    reject(
      `Sim-purity gate: Math.random() in ${path}. Use createRng(seed) from '@/sim/rng'. ` +
        `STANDARDS.md §2.`,
    );
  }
  for (const re of FORBIDDEN_SIM_IMPORTS) {
    if (re.test(stripped)) {
      reject(
        `Sim-purity gate: forbidden import in ${path} (matched ${re}). ` +
          `src/sim/** is pure TypeScript — no React, Pixi, Tone, Capacitor, Radix, Framer, Matter. ` +
          `STANDARDS.md §2.`,
      );
    }
  }
}

// 2. Brand-no-neon
// Only enforce for source/style files. Docs (.md) and JSON catalogs may
// legitimately reference the forbidden palette to document the anti-palette
// or describe what was migrated away from.
const isStyleableFile = /\.(?:ts|tsx|js|jsx|mjs|cjs|css|scss|sass|less|svg|html)$/.test(
  normalizedPath,
);
if (!isCrtFile && isStyleableFile) {
  for (const re of FORBIDDEN_NEON_HEX) {
    if (re.test(content)) {
      reject(
        `Brand gate: forbidden neon hex in ${path} (matched ${re}). ` +
          `Sodium amber + brick + asphalt + subway tile only. ` +
          `STANDARDS.md §4.`,
      );
    }
  }
}

// 3. Factory pyramid (warning-level — block raw spawn outside factories)
if (!path.includes("/src/sim/factories/") && !path.includes("/src/ecs/")) {
  if (/world\.spawn\s*\(\s*Vermin/.test(content)) {
    reject(
      `Factory pyramid gate: raw world.spawn(Vermin) in ${path}. ` +
        `All vermin spawning must go through src/sim/factories/actor.composeVermin(). ` +
        `STANDARDS.md §6.`,
    );
  }
}

// 4. UI must not import render directly (except via pixi-react bridge)
if (isInUi && !path.endsWith("/GameStage.tsx")) {
  if (/from\s+["']\.\.\/\.\.\/render\//.test(content) || /from\s+["']@\/render\//.test(content)) {
    reject(
      `Layering gate: ${path} imports from src/render/. ` +
        `UI must go through pixi-react / GameStage bridge. ` +
        `STANDARDS.md §6 (factory pyramid implies layering).`,
    );
  }
}

// 5. Render must not import UI
if (isInRender) {
  if (/from\s+["']\.\.\/\.\.\/ui\//.test(content) || /from\s+["']@\/ui\//.test(content)) {
    reject(
      `Layering gate: ${path} imports from src/ui/. ` +
        `Render layer is one-way: reads Koota, draws to canvas. Never imports UI.`,
    );
  }
}

process.exit(0);
