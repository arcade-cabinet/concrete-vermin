export type Primitive = string | number | boolean;
export type WorldState = Readonly<Record<string, Primitive>>;

export interface GoapAction {
  readonly id: string;
  readonly cost: number;
  readonly preconditions: Readonly<Partial<Record<string, Primitive>>>;
  readonly effects: Readonly<Partial<Record<string, Primitive>>>;
}

export interface PlanResult {
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

// Admissible heuristic: count of unsatisfied goal keys × the cheapest
// available action cost. Capped at 0 so it never overestimates when an
// action satisfies multiple goal keys at once (which would otherwise
// break A*'s "cheapest-plan" guarantee for non-uniform costs).
const heuristic = (state: WorldState, goal: WorldState, minCost: number): number => {
  let h = 0;
  for (const k in goal) {
    if (state[k] !== goal[k]) h++;
  }
  return h * minCost;
};

// Canonicalize state for closed-set keys: sorted property order so
// equivalent states reached via different effect orders collapse to
// the same key.
const stateKey = (s: WorldState): string => {
  const keys = Object.keys(s).sort();
  const parts: string[] = [];
  for (const k of keys) parts.push(`${k}=${String(s[k])}`);
  return parts.join("|");
};

interface Node {
  state: WorldState;
  parent: Node | null;
  action: GoapAction | null;
  g: number; // cost so far
  f: number; // g + h
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

export function plan(
  start: WorldState,
  goal: WorldState,
  actions: ReadonlyArray<GoapAction>,
  options: { maxNodes?: number } = {},
): PlanResult | null {
  const maxNodes = options.maxNodes ?? 1000;

  if (stateMatches(start, goal)) return { actions: [], cost: 0 };

  // Cheapest action cost — used by the admissible heuristic. If any
  // action has cost <= 0, fall back to 0 (always admissible).
  let minCost = Number.POSITIVE_INFINITY;
  for (const a of actions) {
    if (a.cost < minCost) minCost = a.cost;
  }
  if (!Number.isFinite(minCost) || minCost < 0) minCost = 0;

  let seqCounter = 0;
  const startNode: Node = {
    state: start,
    parent: null,
    action: null,
    g: 0,
    f: heuristic(start, goal, minCost),
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

    const key = stateKey(current.state);
    const prev = closed.get(key);
    if (prev !== undefined && prev <= current.g) continue;
    closed.set(key, current.g);

    for (const action of actions) {
      if (!stateMatches(current.state, action.preconditions)) continue;
      const nextState = applyEffects(current.state, action.effects);
      const g = current.g + action.cost;
      const f = g + heuristic(nextState, goal, minCost);
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
