/**
 * Unit coverage for `governorTick` — specifically the charge-shot gating
 * and stale-charge release paths. The playthrough harness exercises the
 * happy path; these tests pin the lifecycle corners where a held charge
 * would otherwise leak across mission state changes.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GameRunner } from "../../runtime/runner";
import { INITIAL_SNAPSHOT, useGameStore, type VerminSnapshot } from "../../runtime/store";
import { revolver } from "../../sim/archetypes/weapons/revolver";
import { shotgun } from "../../sim/archetypes/weapons/shotgun";
import { tesla } from "../../sim/archetypes/weapons/tesla";
import { flamethrower } from "../../sim/archetypes/weapons/flamethrower";
import { governorTick, makeGovernorState, STRESS } from "../decide";

interface MockRunner {
  queueShot: ReturnType<typeof vi.fn>;
  queueReload: ReturnType<typeof vi.fn>;
  queueChargeStart: ReturnType<typeof vi.fn>;
  queueChargeRelease: ReturnType<typeof vi.fn>;
  cancelCharge: ReturnType<typeof vi.fn>;
}

function makeMockRunner(): MockRunner {
  return {
    queueShot: vi.fn(),
    queueReload: vi.fn(),
    queueChargeStart: vi.fn(),
    queueChargeRelease: vi.fn(),
    cancelCharge: vi.fn(),
  };
}

type SnapOverrides = Partial<typeof INITIAL_SNAPSHOT> & {
  player?: { ammoCurrent: number; ammoMax: number; livesRemaining: number };
};

function setSnapshot(overrides: SnapOverrides): void {
  const { player, ...rest } = overrides;
  useGameStore.setState({ ...INITIAL_SNAPSHOT, ...rest });
  if (player) useGameStore.setState({ player });
}

function vermin(o: Partial<VerminSnapshot> & { id: number; archetypeId: string }): VerminSnapshot {
  return {
    x: 240,
    y: 200,
    vx: 0,
    vy: 0,
    width: 30,
    height: 30,
    health: 50,
    maxHealth: 50,
    ...o,
  };
}

beforeEach(() => {
  setSnapshot({});
});

describe("governorTick — charge gate (data-driven)", () => {
  it("absent governorGate: charge engages on every in-tolerance target (even boss)", () => {
    setSnapshot({
      now: 1,
      player: { ammoCurrent: 6, ammoMax: 6, livesRemaining: 3 },
      // Boss, stationary, in tolerance — shotgun has NO governorGate so
      // boss + speed-cap checks must not apply.
      vermin: [vermin({ id: 1, archetypeId: "boss-river-mutant", maxHealth: 800, vx: 0, vy: 0 })],
    });
    const runner = makeMockRunner();
    governorTick({
      runner: runner as unknown as GameRunner,
      weapon: shotgun,
      profile: STRESS,
      playerLineY: 270,
      shooterPos: { x: 240, y: 246 },
      state: makeGovernorState(),
    });
    expect(runner.queueChargeStart).toHaveBeenCalledOnce();
  });
});

describe("governorTick — charge gate", () => {
  it("napalm-pool gate: skips charge against fast targets and tap-fires instead", () => {
    setSnapshot({
      now: 1,
      player: { ammoCurrent: 80, ammoMax: 80, livesRemaining: 3 },
      vermin: [vermin({ id: 1, archetypeId: "rat", vx: 200, vy: 0 })],
    });
    const runner = makeMockRunner();
    governorTick({
      runner: runner as unknown as GameRunner,
      weapon: flamethrower,
      profile: STRESS,
      playerLineY: 270,
      shooterPos: { x: 240, y: 246 },
      state: makeGovernorState(),
    });
    expect(runner.queueChargeStart).not.toHaveBeenCalled();
    expect(runner.queueShot).toHaveBeenCalled();
  });

  it("napalm-pool gate: charge engages against stationary targets", () => {
    setSnapshot({
      now: 1,
      player: { ammoCurrent: 80, ammoMax: 80, livesRemaining: 3 },
      vermin: [vermin({ id: 1, archetypeId: "rat", vx: 0, vy: 0 })],
    });
    const runner = makeMockRunner();
    governorTick({
      runner: runner as unknown as GameRunner,
      weapon: flamethrower,
      profile: STRESS,
      playerLineY: 270,
      shooterPos: { x: 240, y: 246 },
      state: makeGovernorState(),
    });
    expect(runner.queueChargeStart).toHaveBeenCalledOnce();
  });

  it("napalm-pool gate: refuses to charge against any boss-prefixed archetype", () => {
    setSnapshot({
      now: 1,
      player: { ammoCurrent: 80, ammoMax: 80, livesRemaining: 3 },
      vermin: [vermin({ id: 1, archetypeId: "boss-river-mutant", vx: 0, vy: 0, maxHealth: 800 })],
    });
    const runner = makeMockRunner();
    governorTick({
      runner: runner as unknown as GameRunner,
      weapon: flamethrower,
      profile: STRESS,
      playerLineY: 270,
      shooterPos: { x: 240, y: 246 },
      state: makeGovernorState(),
    });
    expect(runner.queueChargeStart).not.toHaveBeenCalled();
  });

  it("arc-repeater gate: skips charge against heavy bosses", () => {
    setSnapshot({
      now: 1,
      player: { ammoCurrent: 24, ammoMax: 24, livesRemaining: 3 },
      vermin: [
        vermin({
          id: 1,
          archetypeId: "boss-river-mutant",
          maxHealth: 800,
          health: 800,
        }),
      ],
    });
    const runner = makeMockRunner();
    governorTick({
      runner: runner as unknown as GameRunner,
      weapon: tesla,
      profile: STRESS,
      playerLineY: 270,
      shooterPos: { x: 240, y: 246 },
      state: makeGovernorState(),
    });
    expect(runner.queueChargeStart).not.toHaveBeenCalled();
    expect(runner.queueShot).toHaveBeenCalled();
  });

  it("arc-repeater gate: charges trash mobs under the health cap", () => {
    setSnapshot({
      now: 1,
      player: { ammoCurrent: 24, ammoMax: 24, livesRemaining: 3 },
      vermin: [vermin({ id: 1, archetypeId: "rat", maxHealth: 50 })],
    });
    const runner = makeMockRunner();
    governorTick({
      runner: runner as unknown as GameRunner,
      weapon: tesla,
      profile: STRESS,
      playerLineY: 270,
      shooterPos: { x: 240, y: 246 },
      state: makeGovernorState(),
    });
    expect(runner.queueChargeStart).toHaveBeenCalledOnce();
  });

  it("ammo guard: refuses to charge if ammoCurrent < shellsConsumed", () => {
    // Shotgun chargeProfile.shellsConsumed = 2; give it only 1 shell.
    setSnapshot({
      now: 1,
      player: { ammoCurrent: 1, ammoMax: 6, livesRemaining: 3 },
      vermin: [vermin({ id: 1, archetypeId: "rat" })],
    });
    const runner = makeMockRunner();
    governorTick({
      runner: runner as unknown as GameRunner,
      weapon: shotgun,
      profile: STRESS,
      playerLineY: 270,
      shooterPos: { x: 240, y: 246 },
      state: makeGovernorState(),
    });
    expect(runner.queueChargeStart).not.toHaveBeenCalled();
    expect(runner.queueShot).toHaveBeenCalled();
  });
});

describe("governorTick — stale-charge lifecycle", () => {
  it("cancels charge when target disappears", () => {
    setSnapshot({
      now: 1,
      player: { ammoCurrent: 6, ammoMax: 6, livesRemaining: 3 },
      vermin: [],
    });
    const runner = makeMockRunner();
    const state = makeGovernorState();
    state.chargeStartedAtMs = 500;
    governorTick({
      runner: runner as unknown as GameRunner,
      weapon: revolver,
      profile: STRESS,
      playerLineY: 270,
      shooterPos: { x: 240, y: 246 },
      state,
    });
    expect(runner.cancelCharge).toHaveBeenCalledOnce();
    expect(state.chargeStartedAtMs).toBeNull();
  });

  it("cancels charge when reload starts", () => {
    setSnapshot({
      now: 1,
      reloadProgress: 0.5,
      player: { ammoCurrent: 0, ammoMax: 6, livesRemaining: 3 },
    });
    const runner = makeMockRunner();
    const state = makeGovernorState();
    state.chargeStartedAtMs = 500;
    governorTick({
      runner: runner as unknown as GameRunner,
      weapon: revolver,
      profile: STRESS,
      playerLineY: 270,
      shooterPos: { x: 240, y: 246 },
      state,
    });
    expect(runner.cancelCharge).toHaveBeenCalledOnce();
    expect(state.chargeStartedAtMs).toBeNull();
  });

  it("cancels charge when ammo runs dry mid-build", () => {
    setSnapshot({
      now: 1,
      player: { ammoCurrent: 0, ammoMax: 6, livesRemaining: 3 },
      vermin: [vermin({ id: 1, archetypeId: "rat" })],
    });
    const runner = makeMockRunner();
    const state = makeGovernorState();
    state.chargeStartedAtMs = 500;
    governorTick({
      runner: runner as unknown as GameRunner,
      weapon: revolver,
      profile: STRESS,
      playerLineY: 270,
      shooterPos: { x: 240, y: 246 },
      state,
    });
    expect(runner.queueReload).toHaveBeenCalledOnce();
    expect(runner.cancelCharge).toHaveBeenCalledOnce();
    expect(state.chargeStartedAtMs).toBeNull();
  });

  it("releases charge at fallback aim when target overshoots tolerance", () => {
    // Place a fast target whose velocity lead leaves the tolerance window.
    setSnapshot({
      now: 1,
      player: { ammoCurrent: 6, ammoMax: 6, livesRemaining: 3 },
      reticleRadius: 8,
      vermin: [vermin({ id: 1, archetypeId: "rat", x: 240, y: 200, vx: 1500, vy: 0 })],
    });
    const runner = makeMockRunner();
    const state = makeGovernorState();
    state.chargeStartedAtMs = 500;
    governorTick({
      runner: runner as unknown as GameRunner,
      weapon: revolver,
      profile: STRESS,
      playerLineY: 270,
      shooterPos: { x: 240, y: 246 },
      state,
    });
    expect(runner.queueChargeRelease).toHaveBeenCalledOnce();
    expect(state.chargeStartedAtMs).toBeNull();
  });
});
