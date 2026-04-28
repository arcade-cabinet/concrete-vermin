import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useGameStore } from "../../runtime/store";
import { GameStage } from "../GameStage";

/**
 * Browser smoke: render GameStage in real Chromium, force the playing
 * phase, give Pixi a frame to warm up, and assert the canvas exists +
 * has some non-zero pixels (i.e. Pixi actually drew something).
 *
 * This catches regressions where the renderer chain breaks but unit
 * tests pass — e.g. a missing pixiGraphics intrinsic, a Pixi version
 * mismatch, or a misregistered extend.
 */

describe("canvas renders something", () => {
  it("GameStage produces a non-blank canvas after one frame", async () => {
    // Force the store into the playing phase so GameStage mounts the
    // <Application/>. Mission state is synthetic — we don't need real
    // vermin to assert "the canvas drew."
    useGameStore.getState().startMission("streets-01-bodega", 8);

    render(<GameStage />);

    // Wait for Pixi to mount the canvas + render at least one frame.
    // Two requestAnimationFrame ticks is the standard pattern.
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    const canvas = document.querySelector("canvas");
    expect(canvas, "no <canvas> element produced").not.toBeNull();
    if (!canvas) return;

    expect(canvas.width).toBeGreaterThan(0);
    expect(canvas.height).toBeGreaterThan(0);

    // Sample-pixel hash: copy the WebGL canvas onto a 2D context so we
    // can inspect ImageData; if all sampled pixels are pure
    // transparent black, Pixi didn't draw anything.
    const probe = document.createElement("canvas");
    probe.width = canvas.width;
    probe.height = canvas.height;
    const ctx = probe.getContext("2d");
    expect(ctx, "no 2d context").not.toBeNull();
    if (!ctx) return;
    ctx.drawImage(canvas, 0, 0);
    const sample = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let nonBlack = 0;
    const samples = 10;
    for (let i = 0; i < samples; i++) {
      const idx = Math.floor((i / samples) * sample.length) & ~0x3;
      const r = sample[idx] ?? 0;
      const g = sample[idx + 1] ?? 0;
      const b = sample[idx + 2] ?? 0;
      const a = sample[idx + 3] ?? 0;
      if (r + g + b + a > 0) nonBlack++;
    }
    expect(nonBlack, "all sampled pixels were transparent black").toBeGreaterThan(0);
  });
});
