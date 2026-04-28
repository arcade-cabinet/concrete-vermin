import { describe, expect, it } from "vitest";
import {
  CompositeGoal,
  GOAL_STATUS,
  Goal,
  type GoalContext,
  type GoalEvaluator,
  type GoapAction,
  plan,
  Think,
} from "..";

const ctx = (now = 0, dt = 1 / 60): GoalContext => ({ now, dt });

describe("Goal", () => {
  it("starts INACTIVE and tick activates → executes", () => {
    const g = new Goal({});
    expect(g.status).toBe(GOAL_STATUS.INACTIVE);
    g.tick(ctx());
    expect(g.status).toBe(GOAL_STATUS.ACTIVE);
  });

  it("subclass execute updates state and can mark COMPLETED", () => {
    class Counting extends Goal<{ counter: number }> {
      override execute(_c: GoalContext): void {
        this.owner.counter += 1;
        if (this.owner.counter >= 3) this.status = GOAL_STATUS.COMPLETED;
      }
    }
    const owner = { counter: 0 };
    const g = new Counting(owner);
    g.tick(ctx());
    g.tick(ctx());
    g.tick(ctx());
    expect(g.completed()).toBe(true);
    expect(owner.counter).toBe(3);
  });
});

describe("CompositeGoal", () => {
  class Mark extends Goal<string[]> {
    constructor(
      owner: string[],
      readonly label: string,
    ) {
      super(owner);
    }
    override execute(_c: GoalContext): void {
      this.owner.push(this.label);
      this.status = GOAL_STATUS.COMPLETED;
    }
  }

  it("executes subgoals front-to-back", () => {
    const log: string[] = [];
    const c = new CompositeGoal(log);
    // addSubgoal pushes to front, so reverse-add to get a→b→c order
    c.addSubgoal(new Mark(log, "c"));
    c.addSubgoal(new Mark(log, "b"));
    c.addSubgoal(new Mark(log, "a"));
    c.executeSubgoals(ctx());
    c.executeSubgoals(ctx());
    c.executeSubgoals(ctx());
    expect(log).toEqual(["a", "b", "c"]);
  });

  it("removeAllSubgoals terminates and clears", () => {
    const log: string[] = [];
    const c = new CompositeGoal(log);
    c.addSubgoal(new Mark(log, "a"));
    c.addSubgoal(new Mark(log, "b"));
    c.removeAllSubgoals(ctx());
    expect(c.hasSubgoals()).toBe(false);
  });

  it("propagates messages to the head subgoal", () => {
    let received: string | null = null;
    type EmptyOwner = Record<string, never>;
    class Listener extends Goal<EmptyOwner> {
      override handleMessage<M>(msg: M): boolean {
        received = String(msg);
        return true;
      }
    }
    const owner: EmptyOwner = {};
    const c = new CompositeGoal<EmptyOwner>(owner);
    c.addSubgoal(new Listener(owner));
    expect(c.handleMessage("ping")).toBe(true);
    expect(received).toBe("ping");
  });
});

describe("Think", () => {
  type Owner = { hp: number; aware: boolean };
  type World = { enemyVisible: boolean };

  class Flee extends Goal<Owner> {
    override execute(_c: GoalContext): void {
      this.owner.aware = true;
      this.status = GOAL_STATUS.COMPLETED;
    }
  }
  class Attack extends Goal<Owner> {
    override execute(_c: GoalContext): void {
      this.owner.aware = false;
      this.status = GOAL_STATUS.COMPLETED;
    }
  }

  const fleeEvaluator: GoalEvaluator<Owner, World> = {
    id: "flee",
    characterBias: 1,
    calculateDesirability: (o) => (o.hp < 0.3 ? 1 : 0),
    setGoal: (o) => new Flee(o),
  };
  const attackEvaluator: GoalEvaluator<Owner, World> = {
    id: "attack",
    characterBias: 1,
    calculateDesirability: (o, w) => (w.enemyVisible && o.hp >= 0.3 ? 0.6 : 0),
    setGoal: (o) => new Attack(o),
  };

  it("picks the highest-scoring evaluator", () => {
    const owner: Owner = { hp: 0.9, aware: true };
    const t = new Think<Owner, World>(owner);
    t.addEvaluator(fleeEvaluator).addEvaluator(attackEvaluator);
    t.step({ enemyVisible: true }, ctx(0));
    expect(owner.aware).toBe(false); // Attack ran
  });

  it("flips when world changes", () => {
    const owner: Owner = { hp: 0.9, aware: true };
    const t = new Think<Owner, World>(owner);
    t.addEvaluator(fleeEvaluator).addEvaluator(attackEvaluator);
    t.step({ enemyVisible: true }, ctx(0));
    expect(owner.aware).toBe(false);
    owner.hp = 0.1;
    // Force re-arbitration by waiting past cadence.
    t.step({ enemyVisible: true }, ctx(0.5));
    expect(owner.aware).toBe(true); // Flee ran
  });

  it("returns null when nothing scores >0", () => {
    const t = new Think<Owner, World>({ hp: 1, aware: false });
    t.addEvaluator(fleeEvaluator); // hp=1, score 0
    const id = t.arbitrate({ enemyVisible: false }, ctx(0));
    expect(id).toBeNull();
  });
});

describe("plan (A* GOAP)", () => {
  // Classic 3-action / 3-goal scenario: the brigand wants to "kill enemy".
  // Path: getAxe → chopWood → makeFire? No — let's use the canonical
  // GOAP example: the agent needs `enemyDead = true`. It can swing a
  // melee weapon if it has one; or pick up a weapon then swing it.
  const actions: GoapAction[] = [
    {
      id: "pickupAxe",
      cost: 2,
      preconditions: { hasWeapon: false },
      effects: { hasWeapon: true },
    },
    {
      id: "approach",
      cost: 1,
      preconditions: { inRange: false },
      effects: { inRange: true },
    },
    {
      id: "swing",
      cost: 1,
      preconditions: { hasWeapon: true, inRange: true },
      effects: { enemyDead: true },
    },
    {
      id: "shoot",
      cost: 5,
      preconditions: { hasGun: true },
      effects: { enemyDead: true },
    },
  ];

  it("returns the cheapest plan (axe path beats gun)", () => {
    const start = { hasWeapon: false, inRange: false, hasGun: false, enemyDead: false };
    const goal = { enemyDead: true };
    const result = plan(start, goal, actions);
    expect(result).not.toBeNull();
    // A* may interleave pickupAxe / approach in either order (both
    // cost-1 prereqs of swing); what matters is the set + that swing
    // is last, and cost is the cheaper axe path total.
    const ids = result?.actions.map((a) => a.id) ?? [];
    expect(new Set(ids)).toEqual(new Set(["pickupAxe", "approach", "swing"]));
    expect(ids[ids.length - 1]).toBe("swing");
    expect(result?.cost).toBe(4);
  });

  it("uses gun when it's the only viable path", () => {
    const start = { hasGun: true, hasWeapon: false, inRange: false, enemyDead: false };
    // Restrict to actions that don't include pickupAxe
    const noAxe = actions.filter((a) => a.id !== "pickupAxe");
    const result = plan(start, { enemyDead: true }, noAxe);
    expect(result?.actions.map((a) => a.id)).toEqual(["shoot"]);
  });

  it("returns empty plan when start already matches goal", () => {
    const result = plan({ enemyDead: true }, { enemyDead: true }, actions);
    expect(result).toEqual({ actions: [], cost: 0 });
  });

  it("returns null when no plan exists", () => {
    const start = { hasWeapon: false, hasGun: false, inRange: false, enemyDead: false };
    const noWayActions: GoapAction[] = [
      {
        id: "magicWish",
        cost: 1,
        preconditions: { hasWeapon: true },
        effects: { enemyDead: true },
      },
    ];
    const result = plan(start, { enemyDead: true }, noWayActions);
    expect(result).toBeNull();
  });

  it("is deterministic — same inputs → same plan across N runs", () => {
    const start = { hasWeapon: false, inRange: false, hasGun: false, enemyDead: false };
    const goal = { enemyDead: true };
    const a = plan(start, goal, actions);
    const b = plan(start, goal, actions);
    const c = plan(start, goal, actions);
    expect(a).toEqual(b);
    expect(b).toEqual(c);
  });

  it("respects maxNodes guard", () => {
    const start = { a: false };
    const goal = { z: true };
    // No path to z; planner should quit.
    const result = plan(start, goal, actions, { maxNodes: 5 });
    expect(result).toBeNull();
  });
});
