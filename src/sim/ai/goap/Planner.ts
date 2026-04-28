/**
 * GOAP A* planner. Given a current world state, a goal state, and a
 * set of actions (each with preconditions, effects, and cost), returns
 * the cheapest action sequence that reaches the goal.
 *
 * State is a flat record of string → primitive (boolean | number |
 * string). Preconditions and effects are partial records: only the
 * keys mentioned must match (precond) or get overwritten (effect).
 *
 * This is the "classical" GOAP planner, not Yuka's evaluator-driven
 * Think — vermin brains use Think for reactive arbitration, but boss
 * scripts and the meta-encounter director use Planner for sequenced
 * behavior trees ("approach → arm → fire → flee").
 *
 * Determinism: actions are tried in the order supplied. Heuristic is
 * the count of unsatisfied goal keys. Tie-breaking is FIFO within the
 * frontier so the same input always returns the same plan.
 */

export type Primitive = string | number | boolean;
export type WorldState = Readonly<Record<string, Primitive>>;

export interface GoapAction {
  readonly id: string;
  readonly cost: number;
  readonly preconditions: Readonly<Partial<Record<string, Primitive>>>;
  readonly effects: Readonly<Partial<Record<string, Primitive>>>;
}

export interface PlanResult {
  /** Action sequence from start to goal, in execution order. */
  actions: ReadonlyArray<GoapAction>;
  cost: number;
}

const stateMatches = (state: WorldState, partial: Readonly<Partial<Record<string, Primitive>>>) => {
  for (const k in partial) {
    if (state[k] !== partial[k]) return false;
  }
  return true;
};

const applyEffects = (
  state: WorldState,
  effects: Readonly<Partial<Record<string, Primitive>>>,
): WorldState => {
  const out: Record<string, Primitive> = { ...state };
  for (const k in effects) {
    const v = effects[k];
    if (v !== undefined) out[k] = v;
  }
  return out;
};

const heuristic = (state: WorldState, goal: WorldState): number => {
  let h = 0;
  for (const k in goal) {
    if (state[k] !== goal[k]) h++;
  }
  return h;
};

interface Node {
  state: WorldState;
  parent: Node | null;
  action: GoapAction | null;
  g: number; // cost so far
  f: number; // g + h
  /** Insertion order for stable tiebreak. */
  seq: number;
}

const reconstruct = (node: Node): GoapAction[] => {
  const path: GoapAction[] = [];
  let cur: Node | null = node;
  while (cur && cur.action) {
    path.unshift(cur.action);
    cur = cur.parent;
  }
  return path;
};

/**
 * A* planner. Returns null if no plan exists within `maxNodes`
 * expansions (prevents pathological infinite searches).
 */
export function plan(
  start: WorldState,
  goal: WorldState,
  actions: ReadonlyArray<GoapAction>,
  options: { maxNodes?: number } = {},
): PlanResult | null {
  const maxNodes = options.maxNodes ?? 1000;

  if (stateMatches(start, goal)) return { actions: [], cost: 0 };

  let seqCounter = 0;
  const startNode: Node = {
    state: start,
    parent: null,
    action: null,
    g: 0,
    f: heuristic(start, goal),
    seq: seqCounter++,
  };

  // Open list: simple array, repeatedly scanned for the cheapest f.
  // For the tiny action spaces vermin/boss scripts use (≤ 30 actions)
  // a heap is overkill and would cost determinism guarantees.
  const open: Node[] = [startNode];
  const closed = new Map<string, number>();
  let expanded = 0;

  while (open.length > 0 && expanded < maxNodes) {
    // Pick lowest f, tiebreak by seq (FIFO).
    let bestIdx = 0;
    for (let i = 1; i < open.length; i++) {
      const a = open[i] as Node;
      const b = open[bestIdx] as Node;
      if (a.f < b.f || (a.f === b.f && a.seq < b.seq)) {
        bestIdx = i;
      }
    }
    const current = open.splice(bestIdx, 1)[0] as Node;
    expanded++;

    if (stateMatches(current.state, goal)) {
      return { actions: reconstruct(current), cost: current.g };
    }

    const key = JSON.stringify(current.state);
    const prev = closed.get(key);
    if (prev !== undefined && prev <= current.g) continue;
    closed.set(key, current.g);

    for (const action of actions) {
      if (!stateMatches(current.state, action.preconditions)) continue;
      const nextState = applyEffects(current.state, action.effects);
      const g = current.g + action.cost;
      const f = g + heuristic(nextState, goal);
      open.push({
        state: nextState,
        parent: current,
        action,
        g,
        f,
        seq: seqCounter++,
      });
    }
  }

  return null;
}
