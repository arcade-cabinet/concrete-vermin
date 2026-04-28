---
title: Balance — Iterative Tuning System
updated: 2026-04-28
status: current
domain: technical
---

# Balance

Pointer doc + per-mission par tables. Canonical balance system lives in **Section 5** of the design spec: [docs/superpowers/specs/2026-04-27-concrete-vermin-design.md § 5](superpowers/specs/2026-04-27-concrete-vermin-design.md#5-iterative-balance-system).

## Day-to-day workflow

```bash
# 1. Add a new variant in src/sim/content/variants.ts
# 2. Reference it in a mission script (src/sim/content/missions/<mission>.ts)
# 3. Push branch, open PR
# 4. CI runs analysis:benchmark — flags out-of-band missions

# Local diagnosis:
pnpm analysis:focus --mission streets-04-dumpster-bear
pnpm analysis:sweep --shape vermin-health --variant rat-engorged --range 1,5 --step 1

# Auto-tune:
pnpm analysis:autobalance --mission streets-04-dumpster-bear

# Lock stable variants:
pnpm analysis:lock:quick
```

## Profiles

| Profile | Runs/mission | Governors | Use |
|---|---|---|---|
| smoke | 5 | median | local dev |
| ci | 25 | median + trash | every PR |
| standard | 100 | all three | local deeper check |
| release | 500 | all three | release gate |

## Governors

- **perfect**: 100% accuracy, instant reload — upper bound.
- **median**: 75% accuracy, ~250 ms reaction, occasional reload-too-early — target audience.
- **trash**: 50% accuracy, frequent panic — lower bound.

## Per-mission par table

The acceptance bands the analysis benchmark gates against. Numbers are **median-governor** unless noted. Reasoning per row explains *why* the par is what it is — content authors should re-derive (not just match) when they change the mission's spawn budget.

| Mission | Par accuracy | Par duration (s) | Median grade | Reasoning |
|---|---|---|---|---|
| `streets-01-bodega` | 0.85 | 35 ± 5 | A | Tutorial. The first 15 seconds are the player-journey gate; missing the par here means the cold-start UX is broken. |
| `streets-02-alley` | 0.78 | 60 ± 10 | B | First multi-archetype encounter (rats + roaches). Roaches drop accuracy because they cluster — the par bakes this in. |
| `streets-03-rooftop` | 0.70 | 75 ± 12 | B | First mid-air work. Pigeon dive-bombs are the skill check; accuracy par drops to reflect the difficulty curve. |
| `streets-04-dumpster-bear` | 0.65 | 90 ± 15 | B | Act-I boss. The revolver replaces the shotgun; lower mag forces aim. Par accuracy is the whole point of the mission. |
| `underworld-05-subway` | 0.72 | 80 ± 12 | B | Mac-10 spread compensates for the roach + cat mix. Par is forgiving on accuracy because spray-and-pray is now legal. |
| `underworld-06-sewer-shallows` | 0.68 | 95 ± 15 | B | Sawed-off + 2-round mag = lots of reloads. Par duration absorbs the reload tax; par accuracy stays high because pellets carry. |
| `underworld-07-river-mutant` | 0.75 | 75 ± 10 | A | Flamethrower. Continuous beam = cheap accuracy, but the boss has a small window. Par grade rises because the median run *should* feel decisive. |
| `above-08-rooftop-chase` | 0.66 | 100 ± 15 | B | Tesla rifle's homing arc forgives spread, but goose+gull mix punishes target-priority mistakes. Lowest par accuracy in the campaign. |
| `above-09-pigeon-king` | 0.70 | 110 ± 20 | A | Final boss. Tesla + Marksman Scope expected. Long mission; par grade rises to A because completing this mission *is* the campaign's victory condition. |

### Cross-mission invariants

- **Trash-governor clear rate ≥ 0.40** for every mission. If a mission is unwinnable for the worst tier of player, the band is too tight.
- **Perfect-governor median grade ≥ S** for missions 1-7. The two boss missions (4 and 7) are allowed to land at A under perfect — the bosses are designed to scale even past skill ceiling.
- **Mission-09 perfect-governor median grade = S+**. The campaign's exit must reward mastery; otherwise the multiplier feels unearned.

## Thresholds source of truth

Per-mission acceptance bands in `src/sim/analysis/thresholds.ts`. Each mission entry specifies:
- Median-governor clear rate (min)
- Median-governor median grade (min)
- Trash-governor clear rate (min)
- Perfect-governor achievable grade (min)
- Median duration band (min, max)
- Accuracy band (min, max)

CI fails if any mission drifts outside its band.

## Release gate

```bash
RELEASE_GATING=1 pnpm test:release
```

Requires balance lock coverage ≥ 70% AND release-profile benchmark within thresholds.

## When to widen a band vs. retune

- **Widen** the band when the mission is *intentionally* harder/easier than its neighbors (e.g., the river-mutant boss is allowed a tighter accuracy par because the flamethrower's beam is easy to keep on target).
- **Retune** the variant or encounter shape when the band is reasonable but the mission misses it. Don't move the goalpost to fit a regression.
