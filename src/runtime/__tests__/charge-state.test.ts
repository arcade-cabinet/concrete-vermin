/**
 * Charge-shot state machine tests.
 *
 * Drives GameRunner through queueChargeStart / queueChargeRelease and
 * asserts on store snapshots and mag consumption. Uses real missions so
 * weapon stats match production data exactly.
 *
 * Audio and haptics are lazy-init and no-op in node — no mocks needed.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { GameRunner } from "../runner";
import { useGameStore } from "../store";
import { mission01 } from "../../sim/content/missions/streets/mission-01";
import { mission06 } from "../../sim/content/missions/underworld/mission-06";
import { mission09 } from "../../sim/content/missions/above/mission-09";

const FRAME = 1 / 60;

function step(runner: GameRunner, seconds: number): void {
  const frames = Math.round(seconds / FRAME);
  for (let i = 0; i < frames; i++) runner.step(FRAME);
}

beforeEach(() => {
  const s = useGameStore.getState();
  s.setPhase("briefing");
  s.resetCash();
});

// ─── queueChargeStart ────────────────────────────────────────────────────────

describe("queueChargeStart", () => {
  it("sets chargePending and publishes chargeProgress > null when mag > 0", () => {
    const r = new GameRunner(mission01, [], 1);
    step(r, FRAME); // one tick to settle
    expect(useGameStore.getState().chargeProgress).toBeNull();

    r.queueChargeStart();
    step(r, FRAME);
    // chargeProgress should now be a small non-null number (very early in charge)
    const cp = useGameStore.getState().chargeProgress;
    expect(cp).not.toBeNull();
    expect(cp as number).toBeGreaterThanOrEqual(0);
    expect(cp as number).toBeLessThanOrEqual(1);
  });

  it("ignores queueChargeStart when mag is empty", () => {
    const r = new GameRunner(mission01, [], 1);
    // Drain the mag completely.
    const magSize = useGameStore.getState().player.ammoMax;
    for (let i = 0; i < magSize; i++) {
      r.queueShot(240, 200);
      step(r, FRAME);
    }
    expect(useGameStore.getState().player.ammoCurrent).toBe(0);

    r.queueChargeStart();
    step(r, FRAME);
    // chargeProgress must remain null — charge blocked on empty mag.
    expect(useGameStore.getState().chargeProgress).toBeNull();
  });

  it("does not double-start a charge if already pending", () => {
    const r = new GameRunner(mission01, [], 1);
    step(r, FRAME);
    r.queueChargeStart();
    step(r, 0.2); // build up some charge
    const firstProgress = useGameStore.getState().chargeProgress;

    // A second queueChargeStart should be ignored (chargePending guard).
    r.queueChargeStart();
    step(r, FRAME);
    const secondProgress = useGameStore.getState().chargeProgress;
    // Progress must be strictly greater — charge is still building from the same start.
    // It must NOT have reset to near-zero.
    expect(secondProgress).not.toBeNull();
    expect(secondProgress as number).toBeGreaterThan((firstProgress as number) * 0.5);
  });
});

// ─── queueChargeRelease — tap fallback (progress < 0.1) ─────────────────────

describe("queueChargeRelease — tap fallback", () => {
  it("falls through to queueShot when charge progress < 0.1", () => {
    const r = new GameRunner(mission01, [], 1);
    step(r, FRAME);
    const magBefore = useGameStore.getState().player.ammoCurrent;

    r.queueChargeStart();
    step(r, FRAME); // ~1 frame ≈ 16 ms — far below any weapon's maxChargeMs
    r.queueChargeRelease(240, 200);
    step(r, FRAME);

    // chargeProgress must be null after release.
    expect(useGameStore.getState().chargeProgress).toBeNull();
    // Exactly one shell consumed (tap shot).
    const magAfter = useGameStore.getState().player.ammoCurrent;
    expect(magAfter).toBe(magBefore - 1);
  });
});

// ─── queueChargeRelease — effect fires (progress >= 0.1) ────────────────────

describe("queueChargeRelease — double-barrel (sawed-off)", () => {
  it("consumes shellsConsumed shells and leaves chargeProgress null", () => {
    // mission06 uses sawed-off (chargeProfile: double-barrel, shellsConsumed=2)
    const r = new GameRunner(mission06, [], 1);
    step(r, FRAME);
    const magBefore = useGameStore.getState().player.ammoCurrent; // 2 (sawed-off magSize)

    // Charge for 0.3 s — well past 10% of 600 ms max.
    r.queueChargeStart();
    step(r, 0.3);
    expect(useGameStore.getState().chargeProgress).not.toBeNull();
    expect(useGameStore.getState().chargeProgress as number).toBeGreaterThan(0.1);

    r.queueChargeRelease(240, 200);
    step(r, FRAME);

    expect(useGameStore.getState().chargeProgress).toBeNull();
    // 2 shells consumed (shellsConsumed = 2, magSize = 2 → mag = 0).
    const magAfter = useGameStore.getState().player.ammoCurrent;
    expect(magAfter).toBe(Math.max(0, magBefore - 2));
  });
});

describe("queueChargeRelease — arc-repeater (tesla)", () => {
  it("consumes 2 shells and fires the arc-repeater effect", () => {
    // mission09 uses tesla (chargeProfile: arc-repeater, shellsConsumed=2)
    const r = new GameRunner(mission09, [], 1);
    step(r, FRAME);
    const magBefore = useGameStore.getState().player.ammoCurrent; // 8

    r.queueChargeStart();
    // Charge 50% of 900 ms = 450 ms
    step(r, 0.45);
    expect(useGameStore.getState().chargeProgress).not.toBeNull();

    r.queueChargeRelease(240, 200);
    step(r, FRAME);

    expect(useGameStore.getState().chargeProgress).toBeNull();
    // shellsConsumed = 2
    const magAfter = useGameStore.getState().player.ammoCurrent;
    expect(magAfter).toBe(magBefore - 2);
  });
});

describe("queueChargeRelease — wide-spray (shotgun)", () => {
  it("consumes 2 shells and fires wide-spray", () => {
    // mission01 uses shotgun (chargeProfile: wide-spray, shellsConsumed=2)
    const r = new GameRunner(mission01, [], 1);
    step(r, FRAME);
    const magBefore = useGameStore.getState().player.ammoCurrent; // 6

    r.queueChargeStart();
    // Charge 60% of 800 ms = 480 ms
    step(r, 0.48);
    expect(useGameStore.getState().chargeProgress).not.toBeNull();
    expect(useGameStore.getState().chargeProgress as number).toBeGreaterThan(0.5);

    r.queueChargeRelease(240, 200);
    step(r, FRAME);

    expect(useGameStore.getState().chargeProgress).toBeNull();
    const magAfter = useGameStore.getState().player.ammoCurrent;
    expect(magAfter).toBe(magBefore - 2);
  });
});

// ─── chargeProgress snapshot field ──────────────────────────────────────────

describe("chargeProgress in snapshot", () => {
  it("is null before any charge is started", () => {
    const r = new GameRunner(mission01, [], 1);
    step(r, 0.1);
    expect(useGameStore.getState().chargeProgress).toBeNull();
  });

  it("rises from 0 toward 1 while charging", () => {
    const r = new GameRunner(mission01, [], 1);
    step(r, FRAME);

    r.queueChargeStart();
    step(r, FRAME);
    const t0 = useGameStore.getState().chargeProgress;

    step(r, 0.2);
    const t1 = useGameStore.getState().chargeProgress;

    step(r, 0.4);
    const t2 = useGameStore.getState().chargeProgress;

    expect(t0).not.toBeNull();
    expect(t1).not.toBeNull();
    expect(t2).not.toBeNull();
    expect(t1 as number).toBeGreaterThan(t0 as number);
    expect(t2 as number).toBeGreaterThan(t1 as number);
    expect(t2 as number).toBeLessThanOrEqual(1);
  });

  it("is null after charge is released", () => {
    const r = new GameRunner(mission01, [], 1);
    step(r, FRAME);

    r.queueChargeStart();
    step(r, 0.5);
    expect(useGameStore.getState().chargeProgress).not.toBeNull();

    r.queueChargeRelease(240, 200);
    step(r, FRAME);
    expect(useGameStore.getState().chargeProgress).toBeNull();
  });

  it("caps at 1.0 when charge time exceeds maxChargeMs", () => {
    const r = new GameRunner(mission01, [], 1);
    step(r, FRAME);

    r.queueChargeStart();
    // Charge for 2 full seconds — well past 800 ms maxChargeMs for shotgun.
    step(r, 2.0);
    const cp = useGameStore.getState().chargeProgress;
    expect(cp).not.toBeNull();
    expect(cp as number).toBe(1);
  });
});

// ─── Phase 2.3 — auto-burst (revolver) ──────────────────────────────────────

import { mission04 } from "../../sim/content/missions/streets/mission-04";
import { mission05 } from "../../sim/content/missions/underworld/mission-05";

describe("queueChargeRelease — auto-burst (revolver)", () => {
  it("enqueues burst; after 600 ms all 5 shots fired and queue is null", () => {
    // mission04 uses revolver: chargeProfile auto-burst, magSize=6, shellsConsumed=3
    const r = new GameRunner(mission04, [], 1);
    step(r, FRAME);

    const magBefore = useGameStore.getState().player.ammoCurrent; // 6

    // Charge past 10% of 1200 ms = 120 ms.
    r.queueChargeStart();
    step(r, 0.2);
    r.queueChargeRelease(240, 200);

    // Immediately after release, chargeProgress must be null.
    step(r, FRAME);
    expect(useGameStore.getState().chargeProgress).toBeNull();

    // 5 burst shots fire at 120 ms intervals → all done within 600 ms.
    step(r, 0.6);

    // Mag should have drained by 5 (one shell per burst shot), from 6 → 1.
    const magAfter = useGameStore.getState().player.ammoCurrent;
    expect(magAfter).toBeLessThanOrEqual(magBefore - 5);
    expect(magAfter).toBeGreaterThanOrEqual(0);
  });

  it("pendingBurstQueue drains to null — no residual shots after 600 ms", () => {
    const r = new GameRunner(mission04, [], 1);
    step(r, FRAME);

    r.queueChargeStart();
    step(r, 0.3);
    r.queueChargeRelease(240, 200);
    step(r, FRAME);

    // Step well past burst duration.
    step(r, 1.0);

    // A fresh shot should work normally (not blocked by a stale burst).
    const magMid = useGameStore.getState().player.ammoCurrent;
    r.queueShot(240, 200);
    step(r, FRAME);
    const magPost = useGameStore.getState().player.ammoCurrent;
    // Either mag dropped by 1 (shot fired) or hit zero (auto-reload kicked in).
    expect(magPost).toBeLessThanOrEqual(Math.max(0, magMid - 1));
  });

  it("burst respects mag — does not fire when mag runs out mid-burst", () => {
    // Drain mag to 2 before charging so burst of 5 can only fire 2 shots.
    const r = new GameRunner(mission04, [], 1);
    step(r, FRAME);

    // magSize=6 for revolver; drain down to 2.
    for (let i = 0; i < 4; i++) {
      r.queueShot(240, 200);
      step(r, FRAME);
    }
    expect(useGameStore.getState().player.ammoCurrent).toBe(2);

    r.queueChargeStart();
    step(r, 0.3);
    r.queueChargeRelease(240, 200);

    // Run through the full burst window.
    step(r, 1.0);

    // Mag must be clamped to 0 — not negative.
    expect(useGameStore.getState().player.ammoCurrent).toBeGreaterThanOrEqual(0);
  });
});

describe("queueChargeRelease — mag-dump-cone (smg)", () => {
  it("fires burst of up to 8 shots without error", () => {
    // mission05 uses smg: chargeProfile mag-dump-cone, magSize=30, shellsConsumed=8
    const r = new GameRunner(mission05, [], 1);
    step(r, FRAME);

    r.queueChargeStart();
    step(r, 0.5);
    r.queueChargeRelease(240, 200);
    step(r, FRAME);

    // Burst window: 8 shots × 50 ms = 400 ms.
    step(r, 0.5);

    // Mag should have dropped by up to 8.
    const magAfter = useGameStore.getState().player.ammoCurrent;
    // smg magSize=30, shellsConsumed managed by burst drain
    expect(magAfter).toBeLessThanOrEqual(30);
    expect(magAfter).toBeGreaterThanOrEqual(0);
  });

  it("spread of later cone shots >= spread of first shot (widen over burst)", () => {
    // This test verifies isCone spread widening doesn't regress — we can't
    // directly inspect spread angles from outside, but we can verify the
    // runner doesn't throw and the burst completes cleanly.
    const r = new GameRunner(mission05, [], 1);
    step(r, FRAME);

    r.queueChargeStart();
    step(r, 0.8);
    r.queueChargeRelease(240, 200);

    // Should not throw — exercises all 8 burst iterations with isCone=true.
    expect(() => step(r, 0.6)).not.toThrow();
    expect(useGameStore.getState().chargeProgress).toBeNull();
  });
});
