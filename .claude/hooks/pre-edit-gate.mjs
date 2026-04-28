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

const FORBIDDEN_SIM_IMPORTS = [
  /["']react["']/,
  /["']react-dom["']/,
  /["']@pixi\/react["']/,
  /["']pixi-react["']/,
  /["']pixi\.js["']/,
  /["']@pixi\//,
  /["']tone["']/,
  /["']@capacitor\//,
  /["']@capacitor-community\//,
  /["']framer-motion["']/,
  /["']@radix-ui\//,
  /["']matter-js["']/,
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

const isInSim = path.includes("/src/sim/");
// Test files inside sim are allowed to reference forbidden patterns in
// regex literals / string assertions — that's how the purity test itself
// works. Skip the import + Math.random scan for them.
const isSimTest = isInSim && /\.test\.ts$/.test(path);
const isInRender = path.includes("/src/render/");
const isInUi = path.includes("/src/ui/");
const isCrtFile = path.endsWith("src/render/effects/crt.ts");

// 1. Sim-purity
if (isInSim && !isSimTest) {
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
if (!isCrtFile) {
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
