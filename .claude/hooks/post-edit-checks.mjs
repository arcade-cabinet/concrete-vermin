#!/usr/bin/env node
// Post-edit checks. Runs lightweight verification AFTER an edit.
// Non-blocking warnings via stderr; never fails the tool call.
import { readFileSync } from "node:fs";

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

const path = event?.tool_input?.file_path ?? event?.tool_input?.filePath ?? "";
if (!path) process.exit(0);

const warn = (msg) => process.stderr.write(`[concrete-vermin post-edit] ${msg}\n`);

// File-length warning at 600 lines (not blocking — STANDARDS.md §8)
try {
  const content = readFileSync(path, "utf-8");
  const lineCount = content.split("\n").length;
  if (lineCount > 600) {
    warn(
      `${path} is ${lineCount} lines. Consider whether responsibilities are still cohesive. ` +
        `STANDARDS.md §8 (warning, not blocking).`,
    );
  }
} catch {
  // File might be deleted; ignore
}

process.exit(0);
