---
title: Yuka Governor + Per-Weapon Charge-Shot — Phased Build Plan
updated: 2026-04-28
status: draft
domain: technical
---

# Phased Plan — Yuka Governor + Per-Weapon Charge-Shot

Both features approved (user said "Both"). Build order is **governor first**, then **charge-shot**. Reason: charge-shot changes weapon balance per-weapon; without an end-to-end governor we have no automated way to verify "tap-fire still feels viable when hold-fire exists."

Reference codebase confirmed at `~/src/reference-codebases/yuka` (full source + `examples/playground/shooter`). Yuka is in `package.json` already (v0.7.8, ~32 KB gz, ~2 % of CV's 1.5 MB budget) and currently unused.

---

## Ground truth from exploration agents (2026-04-28)

### Input pipeline
- `GameStage.tsx` calls `runner.queueShot(x, y)` and `runner.queueReload()` directly (`src/ui/GameStage.tsx`). No input bus.
- The runner is exposed to React via `runnerRef`; the canonical seam for a governor is **a sibling React component** placed inside `<Application>` next to `<Loop>` that takes `runner` as a prop and uses `useTick` (or its own RAF) to call the same `queueShot` / `queueReload` methods that `GameStage` uses.
- Player-visible state (vermin, reticle, ammo, lives, killCount, now) is in `useGameStore` via `runner.publishSnapshot()` — `runner.ts:351–390`. The governor reads from the store, not the runner internals.
- Yuka is 3D-only (`Vector3` everywhere); we use it with `z = 0`.
- The hand-rolled GOAP port at `src/sim/ai/goap/` is sim-pure; the **real** `yuka` import will live in a governor adapter outside `src/sim/`.

### Weapon system
- Schema at `src/sim/archetypes/weapons/_types.ts:29-63`. No charge fields today.
- Mag decrements once per `queueShot` at `runner.ts:287` regardless of pellet count.
- Reticle drawn in `src/render/ReticleLayer.tsx` via Pixi `Graphics`; `useCallback` deps are the animation hook — adding `chargeProgress` to deps redraws on change.
- Reload is ad-hoc scalar fields (`pendingShot`, `pendingReload`, `mag`, `reloadStartedAt`) on `GameRunner`. No "input intent" enum.
- `applyLoadout` folds `WeaponMod` into `TunedWeapon` once at runner construction (`src/sim/archetypes/mods/index.ts:346-406`).

### Yuka primitives that actually help
- `PursuitBehavior` (lookAhead = `displacement.length() / (maxSpeed + targetSpeed) * predictionFactor`) — **the lead-prediction formula we want**, lifted directly from `~/src/reference-codebases/yuka/src/steering/behaviors/PursuitBehavior.js:88-94`.
- `Goal` / `CompositeGoal` / `Think` / `GoalEvaluator` — clean fit for `select target → aim → fire → reload`.
- Steering forces (`Vehicle.steering.add(...)`) — overkill for a 2D reticle that snaps; we use the prediction math but skip the full vehicle simulation.

---

## Phase 1 — Yuka governor (REQUIRED, mandated by user)

End state: a headless React component that drives the SAME `queueShot`/`queueReload` path the player uses, runs every mission to completion, and asserts pass conditions + grade tiers.

### 1.1 Adapter layer (1 PR)
- New dir: `src/governor/` (NOT under `src/sim/` — keeps sim-purity intact, allows the real `yuka` import).
- `src/governor/yuka-adapters.ts` — pure functions that take `{position, velocity, speed}` shaped objects and return a Yuka-style lead point. Wraps `PursuitBehavior` math (~10 LOC, no Vehicle subclass needed).
- `src/governor/threat.ts` — pure: `selectHighestThreat(vermin, playerLineY, weapon)` returns the target. Score = `f(distanceToPlayerLine, variant.damage, variant.health, weapon.damage)`.
- Unit tests for both — pure data in / data out, no React or runner.

### 1.2 GovernorLoop component (1 PR)
- `src/governor/GovernorLoop.tsx` — sibling of `<Loop>` inside `<Application>`. Props: `{ runner: GameRunner | null, enabled: boolean, profile: "playthrough" | "stress" }`.
- Per-tick: read `useGameStore` snapshot → pick threat via `selectHighestThreat` → compute lead point via `yuka-adapters` → call `runner.queueShot(leadX, leadY)` if reticle on target and ammo > 0 → call `runner.queueReload()` if `ammo === 0` and not already reloading.
- Honors weapon `reticleRadius` / `reticleShape` for hit gate.
- Honors `fireRate` (cooldown between `queueShot` calls per weapon).
- No subscription to runner internals — store-only.

### 1.3 Governor harness (1 PR)
- `src/governor/__tests__/playthrough.dom.test.ts` — boots the full `<Application>` in jsdom + Pixi node-canvas mock, mounts every canonical + secret mission with `<GovernorLoop enabled profile="playthrough" />`, asserts `phase === "won"` and grade tier per mission within a wall-clock budget.
- One mission per test (parallelizable). Hard 30 s/mission timeout.
- Replaces the abstract `analysis:benchmark` for pass/fail; `analysis:benchmark` keeps running for tuning sweeps.

### 1.4 Exit gate
- Every mission (incl. 3 secret missions) clears at grade ≥ B with default loadout in CI.
- Tutorial mission clears at grade ≥ A — confirms the player-journey gate from CLAUDE.md is governor-verifiable.

**LOC estimate**: 600–900 across the three PRs. **Risk**: Pixi node-canvas may need a thin shim for headless render — already partially in place per `vitest` config; verify in 1.3 spike.

---

## Phase 2 — Per-weapon charge-shot (VALUE-ADD, post-governor)

End state: every weapon has a tap-fire (current) AND a hold-fire (new). Hold builds a segmented charge ring around the reticle; release fires a per-weapon-themed heavier variant. Tap-fire remains balanced.

### 2.1 Schema + per-weapon profiles (1 PR)
- Add optional `chargeProfile` to `weaponArchetypeSchema` (`src/sim/archetypes/weapons/_types.ts`):
  ```ts
  chargeProfile: z.object({
    maxChargeMs: z.number().int().positive(),
    shellsConsumed: z.number().int().positive(),
    effect: z.enum([
      "wide-spray",     // shotgun: extra pellets in cone
      "auto-burst",     // revolver: 5-shot burst over 0.6s
      "double-barrel",  // sawed-off: both shells at once
      "mag-dump-cone",  // smg: full-auto burst, cone widens with charge
      "arc-repeater",   // tesla: 3 chain arcs in rapid succession
      "napalm-pool",    // flamethrower: lingering DoT entity
    ]),
  }).optional()
  ```
- Optional → existing factories don't break. Per-weapon files (`shotgun.ts`, `revolver.ts`, `smg.ts`, `sawed-off.ts`, `flamethrower.ts`, `tesla.ts`) each set their own profile.
- `WeaponMod` schema gains optional `chargeTimeMul` for future mods that speed/slow charge.
- `applyLoadout` threads it through into `TunedWeapon.chargeProfile`.

### 2.2 Charge state machine + simple effects (1 PR)
- New runner fields: `chargeStartedAt: number | null`, `chargePending: boolean`.
- New runner methods: `queueChargeStart()`, `queueChargeRelease()`.
- Snapshot adds `chargeProgress: number | null` (parallel to `reloadProgress`).
- Implement the **simple effects** first: `double-barrel` (sawed-off), `wide-spray` (shotgun), `arc-repeater` (tesla). These reuse existing `fireWeapon` with a `pelletOverride?: number` parameter — minimal surface area.
- Mag accounting: `this.mag = Math.max(0, this.mag - shellsConsumed)`.
- Audio: charge whine via existing Tone.js bus; release punch reuses existing weapon-fire sample with pitch shift per `chargeProgress`.

### 2.3 Burst-loop effects (1 PR)
- Add `pendingBurstQueue: { x, y, remaining, intervalMs, nextAt } | null` to runner.
- Implement `auto-burst` (revolver), `mag-dump-cone` (smg). On charge release: enqueue N shots; tick drains them at the interval like a deferred `queueShot`.
- `mag-dump-cone` mutates `tunedWeapon.base.spread` per shot in the burst (cone widens) — does NOT mutate the archetype, only a local per-burst override.

### 2.4 Napalm pool (1 PR — most invasive)
- New ECS trait `NapalmPool { x, y, radius, dps, ttlMs, expiresAt }` in `src/ecs/traits.ts`.
- New system `napalmSystem` in `src/sim/systems/` — per-tick: for each pool, query `Position` of vermin in radius, apply DoT.
- Renderer addition in `src/render/` for the visible pool (sodium-amber pulsing splat, brand-compliant).
- Flamethrower archetype gets `effect: "napalm-pool"`, `shellsConsumed: 8`, `maxChargeMs: 1500`.

### 2.5 Reticle charge ring (1 PR)
- `src/render/ReticleLayer.tsx` reads `chargeProgress` from store, adds it to `useCallback` deps.
- For circular reticles (`cross`, `ring`, `diamond`, `double`): draw `arc(x, y, r + 2, -PI/2, -PI/2 + 2*PI*chargeProgress)` in sodium amber.
- For `wide` reticle (`shotgun`, `sawed-off`): draw four corner L-brackets filling clockwise instead of an arc — matches the existing bracket visual.
- `double` reticle: two independent arcs centered on each pip (shared `chargeProgress`).

### 2.6 Input wiring (1 PR)
- `GameStage.tsx`: `pointerdown` → `queueChargeStart()`; `pointerup` → if held > 80 ms call `queueChargeRelease()`, else fall through to `queueShot()` (preserves existing tap-fire feel).
- Keyboard: `space` mirrors mouse for desktop accessibility.
- Gamepad: trigger `R2`/`RT` mirrors mouse hold.
- Governor (Phase 1): teach `GovernorLoop` the `profile === "stress"` mode that uses charge shots when `chargeProgress` reaches saturation AND the highest-threat target is leadable — verifies tap-fire still viable when hold-fire is in the move set.

### 2.7 Balance pass (1 PR)
- `pnpm analysis:benchmark --profile ci` thresholds re-locked.
- Governor `profile: "playthrough"` (tap-only) + `profile: "stress"` (mixed) BOTH must pass every mission.
- If a weapon's tap-fire viability drops below threshold, tune the per-weapon charge profile (cost, cooldown, or charge time) — not the tap-fire numbers.

**LOC estimate**: 1,800–2,400 across seven PRs (napalm pool is the largest at ~600). **Risk**: napalm-pool ECS trait could leak DoT bugs into existing collision math — mitigation is heavy unit + governor coverage in 2.4.

---

## Process discipline (carried over from this session)

- One rolling integration branch per phase, commits per task, local-agent code review (security + simplifier + reviewer + performance) folded in before push.
- No stubs, no TODOs, no `pass` bodies.
- Sim-purity remains absolute — `src/sim/**` never imports `yuka`. The governor adapter at `src/governor/` is the only file that imports it.
- Brand gate, factory pyramid, and balance gate all remain enforced.

## What I am NOT doing without explicit go-ahead

- Phase 2 starts only after Phase 1 ships and verifies in CI.
- The optional `chargeTimeMul` mod field is reserved — no actual charge-modifying mods built until designers ask for them.
- No backwards-compat shims around weapon archetype changes; the schema gains an optional field, callers stay unchanged.
