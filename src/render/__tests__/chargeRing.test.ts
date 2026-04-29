/**
 * Unit tests for the drawChargeRing helper (Phase 2.5).
 *
 * Tests the pure drawing logic extracted from ReticleLayer without any
 * React or Pixi rendering context.
 */
import { describe, expect, it, vi } from "vitest";
import { drawChargeRing } from "../ReticleLayer";

/** Build a minimal spy Graphics object with chainable methods. */
function makeG() {
  const g = {
    arc: vi.fn(),
    stroke: vi.fn(),
    circle: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    fill: vi.fn(),
    clear: vi.fn(),
  };
  // All methods return `g` for chaining.
  for (const key of Object.keys(g) as Array<keyof typeof g>) {
    (g[key] as ReturnType<typeof vi.fn>).mockReturnValue(g);
  }
  return g;
}

const AMBER = 0xffb347;

describe("drawChargeRing", () => {
  it("does nothing when progress is 0", () => {
    const g = makeG();
    drawChargeRing(g, 240, 135, 20, "cross", 0);
    expect(g.arc).not.toHaveBeenCalled();
  });

  it("does nothing when progress is negative", () => {
    const g = makeG();
    drawChargeRing(g, 240, 135, 20, "cross", -0.1);
    expect(g.arc).not.toHaveBeenCalled();
  });

  it("draws a single arc for cross shape at partial charge", () => {
    const g = makeG();
    drawChargeRing(g, 240, 135, 20, "cross", 0.5);
    expect(g.arc).toHaveBeenCalledOnce();
    const [cx, cy, r, startA] = g.arc.mock.calls[0];
    expect(cx).toBeCloseTo(240);
    expect(cy).toBeCloseTo(135);
    expect(r).toBe(24); // radius + 4
    expect(startA).toBeCloseTo(-Math.PI / 2);
  });

  it("draws a single arc for ring shape at partial charge", () => {
    const g = makeG();
    drawChargeRing(g, 100, 80, 15, "ring", 0.3);
    expect(g.arc).toHaveBeenCalledOnce();
  });

  it("draws a single arc for wide shape at partial charge", () => {
    const g = makeG();
    drawChargeRing(g, 100, 80, 15, "wide", 0.7);
    expect(g.arc).toHaveBeenCalledOnce();
  });

  it("draws two arcs for double shape at partial charge", () => {
    const g = makeG();
    drawChargeRing(g, 240, 135, 20, "double", 0.5);
    expect(g.arc).toHaveBeenCalledTimes(2);
    // Both arcs start at -PI/2
    for (const call of g.arc.mock.calls) {
      const [, , , startA] = call;
      expect(startA).toBeCloseTo(-Math.PI / 2);
    }
    // Left pip is offset left, right pip is offset right
    const [lx] = g.arc.mock.calls[0];
    const [rx] = g.arc.mock.calls[1];
    expect(lx).toBeLessThan(240);
    expect(rx).toBeGreaterThan(240);
  });

  it("draws a full-circle pulse arc when progress === 1 (cross)", () => {
    const g = makeG();
    drawChargeRing(g, 240, 135, 20, "cross", 1.0);
    // Two arc calls: charge arc + pulse ring
    expect(g.arc).toHaveBeenCalledTimes(2);
    const pulseCall = g.arc.mock.calls[1];
    const [, , , startA, endA] = pulseCall;
    expect(startA).toBeCloseTo(0);
    expect(endA).toBeCloseTo(Math.PI * 2);
  });

  it("draws a full-circle pulse arc when progress === 1 (double)", () => {
    const g = makeG();
    drawChargeRing(g, 240, 135, 20, "double", 1.0);
    // Three arc calls: 2 pip arcs + pulse ring
    expect(g.arc).toHaveBeenCalledTimes(3);
    const pulseCall = g.arc.mock.calls[2];
    const [, , , startA, endA] = pulseCall;
    expect(startA).toBeCloseTo(0);
    expect(endA).toBeCloseTo(Math.PI * 2);
  });

  it("stroke uses amber color (0xffb347) — not neon, not sodium", () => {
    const g = makeG();
    drawChargeRing(g, 240, 135, 20, "cross", 0.5);
    const strokeArg = g.stroke.mock.calls[0][0];
    expect(strokeArg.color).toBe(AMBER);
    // Not neon cyan, magenta, or POC-green
    expect(strokeArg.color).not.toBe(0x00f0ff);
    expect(strokeArg.color).not.toBe(0xff00ff);
    expect(strokeArg.color).not.toBe(0x39ff14);
  });

  it("alpha increases as progress increases (brighter at full charge)", () => {
    const g1 = makeG();
    const g2 = makeG();
    drawChargeRing(g1, 240, 135, 20, "cross", 0.1);
    drawChargeRing(g2, 240, 135, 20, "cross", 0.9);
    const alpha1 = g1.stroke.mock.calls[0][0].alpha;
    const alpha2 = g2.stroke.mock.calls[0][0].alpha;
    expect(alpha2).toBeGreaterThan(alpha1);
  });

  it("arc end angle matches progress * 2π offset from -π/2", () => {
    const g = makeG();
    const progress = 0.75;
    drawChargeRing(g, 240, 135, 20, "cross", progress);
    const [, , , startA, endA] = g.arc.mock.calls[0];
    const expectedEnd = -Math.PI / 2 + 2 * Math.PI * progress;
    expect(endA).toBeCloseTo(expectedEnd);
    expect(startA).toBeCloseTo(-Math.PI / 2);
  });
});
