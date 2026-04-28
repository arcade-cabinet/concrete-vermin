import { describe, expect, it } from "vitest";
import { createRng } from "../../../rng";
import { BRAIN_REGISTRY, type BrainWorld, getBrain, type VerminSelf } from "..";

const baseSelf = (overrides?: Partial<VerminSelf>): VerminSelf => ({
  spawnId: 1,
  archetypeId: "rat",
  position: { x: 100, y: 100 },
  velocity: { x: 0, y: 0 },
  health: 10,
  aggression: 0.5,
  reactionDelayS: 0.2,
  jitter: 0.3,
  ...overrides,
});

const baseWorld = (overrides?: Partial<BrainWorld>): BrainWorld => ({
  playerPosition: { x: 300, y: 200 },
  now: 0,
  zone: { minX: 0, maxX: 480, minY: 0, maxY: 270 },
  ...overrides,
});

describe("brain registry", () => {
  it("has every non-boss brain", () => {
    const ids = Object.keys(BRAIN_REGISTRY).sort();
    expect(ids).toEqual(
      [
        "ambusher",
        "charger",
        "dive-bomber",
        "erratic-flyer",
        "ground-swarm",
        "lunger",
        "mixed-threat",
        "pop-up",
        "wall-climber",
      ].sort(),
    );
  });

  it("getBrain returns null for boss-scripted", () => {
    expect(getBrain("boss-scripted")).toBeNull();
  });

  it("getBrain returns a function for every other brain", () => {
    for (const id of Object.keys(BRAIN_REGISTRY)) {
      expect(typeof getBrain(id as keyof typeof BRAIN_REGISTRY)).toBe("function");
    }
  });
});

describe("each brain produces a plan", () => {
  for (const [id, brain] of Object.entries(BRAIN_REGISTRY)) {
    it(`${id} returns a non-empty steps array`, () => {
      const plan = brain(baseSelf(), baseWorld(), createRng(1));
      expect(plan.brainId).toBe(id);
      expect(plan.steps.length).toBeGreaterThan(0);
      expect(plan.plannedAt).toBe(0);
    });
  }
});

describe("brain personality", () => {
  it("ground-swarm ends in a lunge at the player", () => {
    const plan = BRAIN_REGISTRY["ground-swarm"](baseSelf(), baseWorld(), createRng(1));
    const last = plan.steps[plan.steps.length - 1];
    expect(last?.kind).toBe("lunge-at");
  });

  it("wall-climber climbs to a wall first", () => {
    const plan = BRAIN_REGISTRY["wall-climber"](baseSelf(), baseWorld(), createRng(1));
    expect(plan.steps[0]?.kind).toBe("climb-to");
    const last = plan.steps[plan.steps.length - 1];
    expect(last?.kind).toBe("dive-at");
  });

  it("dive-bomber climbs → waits → dives", () => {
    const plan = BRAIN_REGISTRY["dive-bomber"](baseSelf(), baseWorld(), createRng(1));
    expect(plan.steps.map((s) => s.kind)).toEqual(["climb-to", "wait", "dive-at"]);
  });

  it("ambusher waits a long time before lunging", () => {
    const plan = BRAIN_REGISTRY.ambusher(baseSelf(), baseWorld(), createRng(1));
    expect(plan.steps[0]?.kind).toBe("wait");
    const wait = plan.steps[0];
    if (wait?.kind === "wait") expect(wait.durationS).toBeGreaterThan(0.5);
  });

  it("charger has no jitter — straight at player", () => {
    const plan = BRAIN_REGISTRY.charger(
      baseSelf({ jitter: 1 }),
      baseWorld({ playerPosition: { x: 250, y: 240 } }),
      createRng(1),
    );
    const move = plan.steps.find((s) => s.kind === "move-to");
    if (move?.kind === "move-to") {
      expect(move.target).toEqual({ x: 250, y: 240 });
    } else {
      throw new Error("expected a move-to step");
    }
  });

  it("erratic-flyer high-aggression usually dives", () => {
    let dives = 0;
    for (let i = 0; i < 20; i++) {
      const plan = BRAIN_REGISTRY["erratic-flyer"](
        baseSelf({ aggression: 0.95 }),
        baseWorld(),
        createRng(i + 1),
      );
      if (plan.steps.some((s) => s.kind === "dive-at")) dives++;
    }
    expect(dives).toBeGreaterThan(15);
  });

  it("pop-up starts with a pop-out step", () => {
    const plan = BRAIN_REGISTRY["pop-up"](baseSelf(), baseWorld(), createRng(1));
    expect(plan.steps[0]?.kind).toBe("pop-out");
  });

  it("mixed-threat picks an air OR ground sequence based on rng + aggression", () => {
    // High aggression + low rng draw → air path; check both shapes are
    // possible across seeds.
    const shapes = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const plan = BRAIN_REGISTRY["mixed-threat"](
        baseSelf({ aggression: 0.5 }),
        baseWorld(),
        createRng(i + 1),
      );
      const kinds = plan.steps.map((s) => s.kind).join("/");
      shapes.add(kinds);
    }
    expect(shapes.size).toBeGreaterThan(1);
  });
});

describe("determinism", () => {
  it("same self+world+seed → identical plan", () => {
    for (const [, brain] of Object.entries(BRAIN_REGISTRY)) {
      const a = brain(baseSelf(), baseWorld(), createRng(42));
      const b = brain(baseSelf(), baseWorld(), createRng(42));
      expect(a).toEqual(b);
    }
  });
});
