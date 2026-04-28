---
title: Balance — Iterative Tuning System
updated: 2026-04-27
status: current
domain: technical
---

# Balance

Pointer doc. Canonical balance system lives in **Section 5** of the design spec:
[docs/superpowers/specs/2026-04-27-concrete-vermin-design.md § 5](superpowers/specs/2026-04-27-concrete-vermin-design.md#5-iterative-balance-system).

## Day-to-day workflow

```bash
# 1. Add a new variant in src/sim/content/variants.ts
# 2. Reference it in a mission script (src/sim/content/missions/m07.ts)
# 3. Push branch, open PR
# 4. CI runs analysis:benchmark — flags out-of-band missions

# Local diagnosis:
pnpm analysis:focus --mission m07
pnpm analysis:sweep --shape vermin-health --variant glow-rat --range 1,5 --step 1

# Auto-tune:
pnpm analysis:autobalance --mission m07

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

- **perfect**: 100% accuracy, instant reload — upper bound
- **median**: 75% accuracy, ~250ms reaction, occasional reload-too-early — target audience
- **trash**: 50% accuracy, frequent panic — lower bound

## Thresholds

Per-mission acceptance bands in `src/sim/analysis/thresholds.ts`. Each mission specifies:
- Median-governor clear rate (min)
- Median-governor median grade (min)
- Trash-governor clear rate (min)
- Perfect-governor achievable grade (min)
- Median duration band
- Accuracy band

CI fails if missions drift outside bands.

## Release gate

```bash
RELEASE_GATING=1 pnpm test:release
```

Requires balance lock coverage ≥ 70% AND release-profile benchmark within thresholds.
