import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useGameStore } from "../../runtime/store";
import { GameStage } from "../GameStage";

/**
 * Browser smoke: render GameStage in real Chromium, force the playing
 * phase, and verify Pixi mounted a sized canvas.
 *
 * Originally this test sampled pixels off the canvas to assert "Pixi
 * actually drew something." That doesn't work reliably with WebGL —
 * by default the GL framebuffer is cleared after each commit, so a
 * later `getImageData` reads all zeros even though Pixi rendered. The
 * fix would be `preserveDrawingBuffer: true` on the WebGL context, but
 * that's a render-perf cost we don't want in production for a test.
 *
 * The cheaper, equally useful check: did Pixi mount a canvas at the
 * stage dimensions? That alone catches the regressions we care about
 * (missing pixiGraphics intrinsic, Pixi-version mismatch,
 * misregistered extend) — those all crash the renderer outright before
 * a canvas appears.
 */

describe("canvas renders something", () => {
  it("GameStage mounts a sized canvas in real Chromium", async () => {
    // Force the store into the playing phase so GameStage mounts the
    // <Application/>. Mission state is synthetic — we don't need real
    // vermin to assert "the renderer mounted."
    useGameStore.getState().startMission("streets-01-bodega", 8);

    render(<GameStage />);

    // Wait two rAF ticks for Pixi to mount.
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    const canvas = document.querySelector("canvas");
    expect(canvas, "no <canvas> element produced").not.toBeNull();
    if (!canvas) return;

    expect(canvas.width).toBeGreaterThan(0);
    expect(canvas.height).toBeGreaterThan(0);

    // The WebGL context exists — Pixi succeeded in initializing.
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    expect(gl, "no WebGL context").not.toBeNull();
  });
});
