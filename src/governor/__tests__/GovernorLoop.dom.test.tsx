import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { useGameStore } from "../../runtime/store";
import { WEAPON_REGISTRY } from "../../sim/archetypes/weapons";
import { GovernorLoop, PLAYTHROUGH } from "../GovernorLoop";

let tickCb: (() => void) | null = null;

vi.mock("@pixi/react", () => ({
  useTick: (cb: () => void) => {
    tickCb = cb;
  },
}));

interface FakeRunner {
  queueShot: ReturnType<typeof vi.fn>;
  queueReload: ReturnType<typeof vi.fn>;
}

function makeRunner(): FakeRunner {
  return {
    queueShot: vi.fn(),
    queueReload: vi.fn(),
  };
}

beforeEach(() => {
  tickCb = null;
  useGameStore.setState({
    now: 1,
    vermin: [],
    player: { ammoCurrent: 6, ammoMax: 6, livesRemaining: 3 },
    reloadProgress: null,
  });
});

afterEach(() => {
  cleanup();
});

describe("GovernorLoop", () => {
  it("does nothing when disabled", () => {
    const runner = makeRunner();
    render(
      <GovernorLoop
        runner={runner as never}
        weapon={WEAPON_REGISTRY.revolver}
        enabled={false}
        playerLineY={270}
        shooterPos={{ x: 240, y: 260 }}
      />,
    );
    tickCb?.();
    expect(runner.queueShot).not.toHaveBeenCalled();
    expect(runner.queueReload).not.toHaveBeenCalled();
  });

  it("queues a reload when ammo is empty and not already reloading", () => {
    const runner = makeRunner();
    useGameStore.setState({ player: { ammoCurrent: 0, ammoMax: 6, livesRemaining: 3 } });
    render(
      <GovernorLoop
        runner={runner as never}
        weapon={WEAPON_REGISTRY.revolver}
        enabled={true}
        playerLineY={270}
        shooterPos={{ x: 240, y: 260 }}
      />,
    );
    tickCb?.();
    expect(runner.queueReload).toHaveBeenCalledOnce();
    expect(runner.queueShot).not.toHaveBeenCalled();
  });

  it("does not double-queue a reload across consecutive empty-ammo ticks", () => {
    const runner = makeRunner();
    useGameStore.setState({ player: { ammoCurrent: 0, ammoMax: 6, livesRemaining: 3 } });
    render(
      <GovernorLoop
        runner={runner as never}
        weapon={WEAPON_REGISTRY.revolver}
        enabled={true}
        playerLineY={270}
        shooterPos={{ x: 240, y: 260 }}
      />,
    );
    tickCb?.();
    tickCb?.();
    tickCb?.();
    expect(runner.queueReload).toHaveBeenCalledOnce();
  });

  it("does not fire while reload is in progress", () => {
    const runner = makeRunner();
    useGameStore.setState({
      reloadProgress: 0.4,
      vermin: [
        {
          id: 1,
          archetypeId: "rat",
          x: 200,
          y: 250,
          vx: 0,
          vy: 0,
          width: 16,
          height: 16,
          health: 5,
          maxHealth: 5,
        },
      ],
    });
    render(
      <GovernorLoop
        runner={runner as never}
        weapon={WEAPON_REGISTRY.revolver}
        enabled={true}
        playerLineY={270}
        shooterPos={{ x: 240, y: 260 }}
      />,
    );
    tickCb?.();
    expect(runner.queueShot).not.toHaveBeenCalled();
  });

  it("queues a shot at the lead point of the highest-threat vermin", () => {
    const runner = makeRunner();
    useGameStore.setState({
      vermin: [
        // Far one, lower priority
        {
          id: 1,
          archetypeId: "rat",
          x: 100,
          y: 100,
          vx: 0,
          vy: 0,
          width: 16,
          height: 16,
          health: 5,
          maxHealth: 5,
        },
        // Near one — should be picked
        {
          id: 2,
          archetypeId: "rat",
          x: 240,
          y: 250,
          vx: 0,
          vy: 0,
          width: 16,
          height: 16,
          health: 5,
          maxHealth: 5,
        },
      ],
    });
    render(
      <GovernorLoop
        runner={runner as never}
        weapon={WEAPON_REGISTRY.revolver}
        enabled={true}
        playerLineY={270}
        shooterPos={{ x: 240, y: 260 }}
      />,
    );
    tickCb?.();
    expect(runner.queueShot).toHaveBeenCalledOnce();
    const [x, y] = runner.queueShot.mock.calls[0];
    // Stationary target → leadPoint returns the target's current position.
    expect(x).toBeCloseTo(240);
    expect(y).toBeCloseTo(250);
  });

  it("respects the shotCooldownMs gate between consecutive ticks", () => {
    const runner = makeRunner();
    useGameStore.setState({
      now: 1,
      vermin: [
        {
          id: 1,
          archetypeId: "rat",
          x: 240,
          y: 250,
          vx: 0,
          vy: 0,
          width: 16,
          height: 16,
          health: 5,
          maxHealth: 5,
        },
      ],
    });
    render(
      <GovernorLoop
        runner={runner as never}
        weapon={WEAPON_REGISTRY.revolver}
        enabled={true}
        playerLineY={270}
        shooterPos={{ x: 240, y: 260 }}
      />,
    );
    tickCb?.();
    tickCb?.(); // same now → blocked by cooldown
    expect(runner.queueShot).toHaveBeenCalledOnce();

    useGameStore.setState({ now: 1 + (PLAYTHROUGH.shotCooldownMs / 1000) + 0.01 });
    tickCb?.();
    expect(runner.queueShot).toHaveBeenCalledTimes(2);
  });

  it("skips firing when lead point overshoots reticle radius + tolerance", () => {
    const runner = makeRunner();
    useGameStore.setState({
      vermin: [
        {
          id: 1,
          archetypeId: "rat",
          // Far away, fast-moving — leadPoint will overshoot reticleRadius
          x: 50,
          y: 100,
          vx: 999,
          vy: 0,
          width: 16,
          height: 16,
          health: 5,
          maxHealth: 5,
        },
      ],
    });
    render(
      <GovernorLoop
        runner={runner as never}
        weapon={WEAPON_REGISTRY.revolver}
        enabled={true}
        playerLineY={270}
        shooterPos={{ x: 240, y: 260 }}
      />,
    );
    tickCb?.();
    expect(runner.queueShot).not.toHaveBeenCalled();
  });
});
