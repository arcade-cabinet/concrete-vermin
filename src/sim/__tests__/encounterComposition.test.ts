import { describe, expect, it } from "vitest";
import { MISSIONS } from "../content/missions";
import type { Mission } from "../factories/mission";

/**
 * Per-act uniqueness gate. The directive: "no two missions feel
 * identical." Two missions feel identical when they reuse the same
 * (variant, pattern) tuples across their encounters in the same multi-
 * set, even if counts vary — count-only differences are tuning, not
 * composition.
 */

interface SpawnTuple {
  variant: string;
  pattern: string;
}

function spawnTuplesOf(m: Mission): ReadonlyArray<SpawnTuple> {
  const out: SpawnTuple[] = [];
  for (const enc of m.encounters) {
    for (const s of enc.spawns) {
      out.push({ variant: s.variant, pattern: s.pattern });
    }
  }
  return out;
}

/** Stable, order-independent signature of a mission's spawn multiset. */
function compositionSignature(m: Mission): string {
  const tuples = spawnTuplesOf(m).map((t) => `${t.variant}@${t.pattern}`);
  tuples.sort();
  return tuples.join("|");
}

const ALL = [...MISSIONS];

describe("encounter composition uniqueness", () => {
  it("no two missions share the same (variant, pattern) multiset", () => {
    const seen = new Map<string, string>(); // signature -> first mission id
    for (const m of ALL) {
      const sig = compositionSignature(m);
      const prior = seen.get(sig);
      expect(
        prior,
        `${m.id} duplicates composition of ${prior} (signature=${sig})`,
      ).toBeUndefined();
      seen.set(sig, m.id);
    }
  });

  it("each mission's encounter list mixes at least 2 distinct variants OR 2 distinct patterns", () => {
    for (const m of ALL) {
      const variants = new Set<string>();
      const patterns = new Set<string>();
      for (const enc of m.encounters) {
        for (const s of enc.spawns) {
          variants.add(s.variant);
          patterns.add(s.pattern);
        }
      }
      const variety = variants.size + patterns.size;
      expect(
        variety,
        `${m.id}: too monotonous (${variants.size} variants × ${patterns.size} patterns)`,
      ).toBeGreaterThanOrEqual(4);
    }
  });

  it("missions in the same act do not share an entire encounter (variant/pattern/count) verbatim", () => {
    // Stronger check: even one identical encounter (full signature including
    // count) across two missions in the same act is a composition smell.
    const byAct = new Map<string, { missionId: string; encounterId: string; sig: string }[]>();
    for (const m of ALL) {
      const key = m.act;
      let list = byAct.get(key);
      if (!list) {
        list = [];
        byAct.set(key, list);
      }
      for (const enc of m.encounters) {
        const sig = enc.spawns
          .map((s) => `${s.variant}@${s.pattern}x${s.count}`)
          .sort()
          .join("|");
        for (const prior of list) {
          if (prior.sig === sig) {
            throw new Error(
              `Duplicate encounter in act "${key}": ${m.id}/${enc.id} matches ${prior.missionId}/${prior.encounterId} (sig=${sig})`,
            );
          }
        }
        list.push({ missionId: m.id, encounterId: enc.id, sig });
      }
    }
    expect(byAct.size).toBeGreaterThan(0);
  });

  it("every non-tutorial mission carries at least one distinguishing variant or pattern within its act", () => {
    // Tutorial mission (streets-01-bodega) intentionally uses a reduced
    // palette so a non-gamer can pass it on first try. Every other
    // mission must own at least one (variant, pattern) tuple that no
    // sibling in the same act uses, otherwise players feel deja vu.
    const TUTORIAL_ID = "streets-01-bodega";
    const byAct = new Map<string, Mission[]>();
    for (const m of ALL) {
      let bucket = byAct.get(m.act);
      if (!bucket) {
        bucket = [];
        byAct.set(m.act, bucket);
      }
      bucket.push(m);
    }
    for (const [act, missions] of byAct) {
      if (missions.length < 2) continue;
      for (const m of missions) {
        if (m.id === TUTORIAL_ID) continue;
        const ownTuples = new Set(spawnTuplesOf(m).map((t) => `${t.variant}@${t.pattern}`));
        const siblingTuples = new Set<string>();
        for (const other of missions) {
          if (other.id === m.id) continue;
          for (const t of spawnTuplesOf(other)) {
            siblingTuples.add(`${t.variant}@${t.pattern}`);
          }
        }
        const distinguishing = [...ownTuples].filter((t) => !siblingTuples.has(t));
        expect(
          distinguishing.length,
          `${m.id} (act ${act}) has no distinguishing (variant, pattern) tuple — every spawn type is reused by a sibling mission`,
        ).toBeGreaterThan(0);
      }
    }
  });
});
