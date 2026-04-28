---
title: Concrete Vermin — Production Design Specification
updated: 2026-04-27
status: current
domain: technical
---

# Concrete Vermin: Tactical Reforged — Design Specification

> Canonical, locked design for the production rebuild of `poc.html`.
> All implementation work derives from this document. Conflicts resolve in this document's favor.

---

## 1. Identity & Scope

**Concrete Vermin: Tactical Reforged** is a side-on, on-rails, drag-to-aim mobile arcade shooter set in a pulpy 1979 New York. The player is the city's deniable Pest Control operator hunting vermin across subway grime, brick alleys, sodium-vapor streets, and rooftops.

### Locked identity

- **Genre**: side-on rail-shooter (player-paced advance through scripted dioramas)
- **Input model**: drag-to-aim with offset crosshair, auto-fire while held, tap to reload
- **Projectile rendering**: every shot draws a trail from bottom-center of screen to the reticle
- **Aesthetic**: The Warriors (1979) — sodium amber, brick, asphalt, subway tile. **No neon. No cyberpunk.** CRT scanlines stay (it's still an arcade cabinet) but sodium-tinted, not RGB-split.
- **Tone**: pulpy-stylized, Adult Swim energy, Teen-rated. Bright comic splash. Saturday-morning-violent, not grimdark.
- **Roster constraint**: vermin are **animal/insect/fish only** — anything you could imagine kicking like a football. No e-bikes, scooters, drones, or humans.
- **Story integration**: cutscene paragraphs are **gameplay**. Short skippable interstitials between missions; in-world collectible artifacts that you shoot to consume — pauses the action, surfaces full-screen prose, taps to resume.

### Mandatory tech stack

- **PixiJS** (renderer) + **pixi-react** (HUD/menu overlay bridge)
- **Koota** (ECS, runtime entity state)
- **Yuka** + custom GOAP port (vermin AI)
- **Tone.js** (gunshots, splash, ambience, music beds)
- **Capacitor** (Android-first mobile shell)
- **Radix UI** (menus, dialogs, sheets) + **Framer Motion** (UI motion, cutscene reveals)
- **Matter.js** (optional, for ragdoll death physics on splash)
- **Zod** (content schema validation)
- **seedrandom** (deterministic RNG; `Math.random` is a CI blocker in `sim/`)

### Out of scope for v1

- Multiplayer (single-player only)
- iOS launch (Android-first; iOS must compile but is not v1 ship target)
- Online leaderboards (local high scores only)
- User-generated content / level editor
- Microtransactions / IAP

### Definition of done

- 12 missions playable end-to-end across three acts
- All 5 weapons unlockable through campaign progression
- ~10 archetypes with 3-5 named variants each (~30-50 variants total)
- Pawn Shop with ~20 mods, three-slot loadout
- Complete Case File and Bestiary screens, fully populated by gameplay
- Full audio pass (Tone-driven, no missing sound events)
- S-rank attainable on every mission
- Android debug APK built by CI on every PR
- Balance lock coverage ≥ 70% per release-please tag

---

## 2. Architecture & Layering

Strict-layered, sim-pure, mirroring `bioluminescent-sea`'s proven pattern.

### Folder map

```
src/
├── sim/                          # PURE TypeScript. No React, no Pixi, no DOM, no Tone, no Capacitor.
│   ├── archetypes/               # vermin / weapon / mod data tables (typed, frozen)
│   │   ├── vermin/
│   │   ├── weapons/
│   │   └── mods/
│   ├── traits/                   # trait taxonomy (visual / behavioral / affliction)
│   ├── factories/
│   │   ├── actor.ts              # archetype + trait → spawn record (THE ONLY PATH to spawning a vermin)
│   │   ├── encounter.ts          # encounter zone composition
│   │   └── mission.ts            # mission script: encounters + cutscene anchors + collectibles
│   ├── ai/
│   │   └── goap/                 # Yuka-port GOAP planner
│   ├── engine/
│   │   ├── tick.ts               # fixed-step sim loop
│   │   ├── encounter-fsm.ts      # spawn → fight → cleared → advance
│   │   ├── scoring.ts            # multiplier chain, style modifiers, grade
│   │   ├── damage.ts             # hit resolution
│   │   └── runStats.ts           # per-mission accumulators
│   ├── content/
│   │   ├── missions/             # m01-bodega.ts ... m12-bridge.ts
│   │   ├── cutscenes/            # interstitial paragraphs
│   │   ├── collectibles/         # in-world story artifacts
│   │   └── bestiary/             # variant flavor text
│   ├── rng/                      # createRng(seed) — Math.random is a CI blocker
│   ├── analysis/                 # headless balance system (governors, profiles, sweeps, autobalance, locking)
│   └── _shared/                  # variance, easing, constants
├── ecs/                          # Koota — owns entity state at runtime
│   ├── traits.ts                 # Position, Velocity, Health, Sprite, AIBrain, Projectile, Collectible
│   ├── world.ts                  # createWorld(), system registration
│   ├── queries.ts                # named query builders
│   ├── actions.ts                # mutation API (spawnVermin, fireWeapon, takeDamage, consumeCollectible)
│   └── systems/                  # spawn, ai, motion, projectile, collide, score, lifecycle
├── render/                       # PixiJS only. Reads Koota, never writes.
│   ├── app.ts
│   ├── camera.ts                 # rail-camera, screen-shake, parallax projection
│   ├── layers/                   # sky, mid, near, vermin, projectiles, fx, hud-overlay
│   ├── effects/
│   │   ├── trails.ts             # bottom-center → reticle line per weapon
│   │   ├── splash.ts             # pulpy gore particles
│   │   ├── muzzle.ts
│   │   ├── crt.ts                # sodium-tinted scanlines + grain
│   │   └── magnetism.ts          # subtle reticle pull-toward-vermin
│   └── sprites/
│       ├── atlas.ts
│       └── compose.ts            # archetype + traits → final sprite stack
├── ui/                           # React + pixi-react. No Pixi sprite calls outside render/.
│   ├── shell/                    # AppShell, router, capacitor lifecycle, splash, orientation lock
│   ├── screens/                  # Title, MissionSelect, Briefing, PawnShop, CaseFile, Bestiary, Results
│   ├── hud/                      # Crosshair, AmmoStrip, MultiplierTag, GradeMeter, Lives, Reload
│   ├── cutscene/
│   │   ├── Interstitial.tsx
│   │   └── ArtifactReader.tsx
│   ├── primitives/               # Radix-based Button, Card, Drawer, Sheet
│   ├── theme/                    # Warriors palette tokens, type scale, motion tokens
│   └── hooks/
├── audio/                        # Tone.js
│   ├── context.ts
│   ├── weapons.ts
│   ├── vermin.ts
│   ├── ambience.ts
│   └── music.ts
├── platform/                     # Capacitor wrappers
│   ├── persistence/              # Drizzle + capacitor-community/sqlite
│   ├── haptics.ts
│   ├── orientation.ts
│   └── lifecycle.ts
├── lib/                          # pure utils (math, color, easing, scoring formulas)
└── test/                         # shared test setup
```

### Layering rules (enforced by hooks + Biome + tsconfig.sim.json)

| Rule | Mechanism |
|---|---|
| `sim/` cannot import React, Pixi, DOM, Tone, Capacitor | `tsconfig.sim.json` (no `dom` lib) + Biome import-restriction rule |
| `sim/` cannot use `Math.random` | Biome no-restricted-syntax + pre-edit hook scan |
| `render/` cannot import `ui` | Biome import-restriction |
| `ui/` cannot import `render` except via `pixi-react` bridge | Biome import-restriction |
| Direct vermin spawning outside `sim/factories/actor` | Biome no-restricted-imports + grep gate in CI |
| New `.ts` files in `src/sim` must compile under `tsconfig.sim.json` | CI step `pnpm -s tsc -b tsconfig.sim.json` |

### Frame loop

- **Render**: Pixi `app.ticker` drives the visual loop, free-running.
- **Sim**: separate fixed-step ticker at 60 Hz logical drives `sim/engine/tick`. Render interpolates between sim states (Glenn Fiedler "Fix Your Timestep" pattern).
- **Decoupling rationale**: gameplay determinism independent of frame rate. Enables replay (record seed + inputs, re-run).

### Yuka integration

Yuka's full `Vehicle` / `SteeringBehavior` model is too 3D-flight-y. We **port the GOAP planner** (`Goal` / `CompositeGoal` / `Think` / `GoalEvaluator`) into `sim/ai/goap/` as pure TS, exactly like `bioluminescent-sea`. Yuka stays as a dep for state-machine helpers and math utilities. AI lives in our sim layer where it can be unit-tested without rendering.

### pixi-react role

The Pixi `Application` is wrapped once in a `<GameStage>` React component. Inside, sprites are mounted declaratively for HUD overlays and menu-on-game scenes. The hot game loop (vermin, projectiles, particles) **bypasses pixi-react** and uses imperative Pixi for performance. Hybrid pattern — declarative for static/UI, imperative for the bullet-hell.

---

## 3. Data Model — Archetype + Trait + Variant

The composition system is the heart of content scalability.

### Archetype

Species class. Defines silhouette, base stats, AI brain, sprite atlas. ~12 total.

```ts
type ArchetypeId =
  | 'rat' | 'roach' | 'pigeon' | 'raccoon' | 'seagull'
  | 'feral-cat' | 'sewer-fish' | 'street-dog' | 'goose'
  | 'boss-dumpster-bear' | 'boss-river-mutant' | 'boss-pigeon-king';

type AIBrain =
  | 'ground-swarm'      // rats, roaches: charge in numbers
  | 'wall-climber'      // roaches: vertical surfaces
  | 'erratic-flyer'     // pigeons
  | 'dive-bomber'       // seagulls
  | 'lunger'            // raccoons
  | 'ambusher'          // cats
  | 'pop-up'            // catfish
  | 'charger'           // dogs
  | 'mixed-threat'      // geese
  | 'boss-scripted';

type Locomotion = 'ground' | 'wall' | 'flying' | 'amphibious' | 'mixed';

interface Archetype {
  id: ArchetypeId;
  brain: AIBrain;
  locomotion: Locomotion;
  baseStats: {
    health: number;
    speed: number;
    contactDamage: number;
    bounty: number;
    headshotMultiplier: number;
  };
  hitbox: { width: number; height: number; headOffset: { x: number; y: number } };
  spriteAtlas: AtlasRef;
  audio: { spawn: SfxId; hit: SfxId; death: SfxId; idle?: SfxId };
}
```

### Traits

Composable modifiers. Pure data, no logic.

```ts
interface VerminTraitSet {
  // visual
  furColor: 'mangy-brown' | 'oil-black' | 'piebald' | 'albino' | 'soot-grey' | 'rust';
  eyeGlow: 'none' | 'red' | 'amber' | 'sickly-green';
  bodySize: 'runt' | 'normal' | 'fat' | 'engorged';
  tailLength: 'stub' | 'normal' | 'whiplash';
  antennaSize: 'none' | 'short' | 'waving' | 'massive';

  // behavioral
  speedMod: 'sluggish' | 'normal' | 'scuttling' | 'panicked';
  healthMod: 'fragile' | 'normal' | 'tough' | 'armored';
  aggression: 'skittish' | 'curious' | 'aggressive' | 'berserk';

  // affliction (elite/boss tier — adds rendering AND behavioral effects)
  affliction: 'none' | 'rabid' | 'radioactive' | 'cybernetic';
}
```

Affliction effects:
- **rabid**: +50% speed, foam particle effect, on-death small AOE infect chance
- **radioactive**: sickly-green glow aura, leaves toxic puddle on death
- **cybernetic**: metallic plating, +100% health, spark particles on hit

### Variants

Named designer-authored compositions. Stored in `sim/content/variants.ts` as flat data registry.

```ts
export const VARIANTS = {
  'sewer-rat':       { archetype: 'rat',     traits: { furColor: 'oil-black', eyeGlow: 'red', bodySize: 'fat', healthMod: 'tough' }},
  'subway-roach':    { archetype: 'roach',   traits: { antennaSize: 'massive', speedMod: 'scuttling' }},
  'roof-pigeon':     { archetype: 'pigeon',  traits: { eyeGlow: 'amber', aggression: 'aggressive' }},
  'rabid-raccoon':   { archetype: 'raccoon', traits: { affliction: 'rabid', aggression: 'berserk' }},
  'central-park-goose': { archetype: 'goose', traits: { bodySize: 'engorged', aggression: 'berserk', affliction: 'rabid' }},
  // ~30-50 variants total
} as const;
```

### Composition function (only spawn path)

```ts
// sim/factories/actor.ts
function composeVermin(
  archetypeId: ArchetypeId,
  traits: Partial<VerminTraitSet>,
  rng: Rng
): VerminSpawnRecord;
```

**Bestiary auto-derives** from `VARIANTS`. **Encounters reference variants by name**, not raw archetype+traits.

### Weapons follow the same pattern in miniature

`WeaponArchetype` (shotgun/revolver/SMG/sawed-off/flame/tesla) + `WeaponMod` (choke, extended-mag, incendiary, scope, +crit) → `WeaponLoadout` (chosen at mission briefing or in Pawn Shop).

---

## 4. Mission, Encounter, Scoring & Cutscene Flow

### Campaign

12 missions across three acts (~3 min each, bosses ~5 min, total first-completion ~45 min).

| Act | Mission | Setting | Boss |
|---|---|---|---|
| **I — Streets** | 1 | Bodega backroom (tutorial, shotgun) | — |
| | 2 | Subway platform 137th St | — |
| | 3 | Chinatown alley night-market | — |
| | 4 | **Dumpster bear behind the deli** → unlock revolver | yes |
| **II — Underworld** | 5 | F-train tunnel | — |
| | 6 | Sewage plant catwalk | — |
| | 7 | Abandoned IRT station | — |
| | 8 | **River-mutant catfish, East River outflow** → unlock SMG | yes |
| **III — Above** | 9 | Tar-paper rooftop chase | — |
| | 10 | Central Park dusk | — |
| | 11 | Coney Island boardwalk midway | — |
| | 12 | **The Pigeon-King on Brooklyn Bridge spire** | yes |

### Mission lifecycle

```
Title → MissionSelect → Briefing(cutscene interstitial)
  → BeginMission (Pixi stage warms, sim seeded)
    → Encounter 1 (rail camera arrives, unpauses, vermin spawn from script)
       ├─ player drag-aims, auto-fires while held
       ├─ vermin take damage, splash, score multiplier ticks
       └─ collectibles can be shot → ArtifactReader pause-and-read
    → Encounter 2 … N
    → Mission Boss (acts 1, 2, 3 only; missions 4 / 8 / 12)
  → EndMission → Results (grade, score breakdown, unlocks, cash)
  → PawnShop (optional)
  → MissionSelect (next unlocked)
```

### Encounter FSM

```
WAITING_FOR_CAMERA
  → camera arrives → ARMING (1.0s telegraph beat)
ARMING
  → spawn schedule fires → ACTIVE
ACTIVE
  → all hostiles dead → CLEARED
  → player health == 0 → FAILED → respawn-at-checkpoint or game-over
CLEARED
  → save checkpoint → camera advances → WAITING_FOR_CAMERA
```

**No encounter timeout.** Camera does not advance until cleared. Player-paced rail.

### Spawn patterns

Pure functions: `(zone, count, rng) → SpawnRecord[]`.

`left-flood` / `right-flood` / `ceiling-drop` / `pop-from-vent` / `dive-from-sky` / `surface-from-grate` / `mixed-wave` / `boss-scripted`.

### Scoring engine

Per-frame state:

```ts
interface ScoreState {
  total: number;
  multiplier: number;          // 1.0 .. 5.0, capped
  multiplierDecayAt: number;
  multiplierGraceUntil: number;// 1.5s grace after each kill before decay starts
  noReloadStreak: number;
  lastArchetypeKilled: ArchetypeId | null;
  varietyChain: ArchetypeId[]; // last 3 unique kills
  modifierFlashes: ModifierFlash[];
}
```

**On kill**:
1. base = `archetype.bounty × variant.healthMod` multiplier
2. style modifiers (additive %): headshot +50%, two-for-one +100%, mid-air +75%, variety (3 different in last 4) +200%, no-reload (≥10 kills since reload) +10% per 5 kills, cap +50%
3. multiplier delta: +0.1 normally, +0.25 on style-bonus kill, capped 5.0
4. `total += round(base × (1 + sum(modifiers)) × multiplier)`
5. refresh grace + decay timer
6. push `ModifierFlash` for non-zero bonus
7. `recordKill(variant)` for bestiary

**On miss** (shot fired, no hit within 200ms): `multiplier × 0.85`, no decay reset.
**On collectible consumed**: no score, multiplier grace +5s.
**On reload**: `noReloadStreak = 0`.

### Mission grading

```
score_component   = clamp(score / par_score, 0, 1.5)
accuracy_component= shotsHit / shotsFired
collect_component = artifactsFound / artifactsAvailable
mission_grade_raw = 0.55*score + 0.30*accuracy + 0.15*collect

F < 0.30, D < 0.45, C < 0.60, B < 0.75, A < 0.90, S < 1.05, S+ ≥ 1.05
```

Cash reward = base × grade multiplier (F=0.5x → S+=2.5x).

### Cutscene & collectibles

**Interstitial**: between mission-select and mission-begin. 60-100 word artifact-style paragraph (newspaper clipping, sanitation memo, payphone transcript, etc.). Skippable. Auto-advance disabled.

**In-world collectible**:
- placed by mission script at named diorama anchor
- rendered as fluttering white silhouette with subtle halo (visually distinct from vermin)
- hit detection same as vermin, tagged as `Collectible`
- on consume: emits `cutscene:open`, sim enters PAUSED, audio ducks to ambient
- ArtifactReader mounts: sodium-amber overlay, paper-textured card, prose, optional READ MORE
- on resume: emits `cutscene:close`, sim unpauses, multiplier grace +5s

**Case File** (`ui/screens/CaseFile.tsx`): re-readable archive of consumed artifacts. Subway-bulletin-board layout. "23 / 47 collected." Drives meta-progression.

**Bestiary** (`ui/screens/Bestiary.tsx`): auto-populates from first kill of each variant. Card shows composed sprite, archetype + traits, flavor paragraph, kill count, fastest kill time.

### Failure & retry

3 lives + checkpoints between encounter zones. Lose all → restart from last checkpoint. No mission timeout.

### Meta-progression

After mission completion (any grade): cash + Case File entries + Bestiary entries.

Cash spent at **Pawn Shop** for weapon mods (chokes, extended mags, scopes, incendiary rounds, talisman mods like "rabbit's foot: +5% crit"). Loadout is **3-mod** active per weapon. Mods stay between missions.

---

## 5. Iterative Balance System

Lifted from `mean-streets`. Lives in `src/sim/analysis/`.

### Headless runner

Takes a mission ID, governor (perfect/median/trash), and seed. Runs the full sim loop with no rendering. Returns mission-level stats (outcome, accuracy, score, grade, hot-moments timeline, etc.).

### Governors

- **perfect**: 100% accuracy, instant reload — upper bound on mission difficulty
- **median**: 75% accuracy, ~250ms reaction time, occasional reload-too-early
- **trash**: 50% accuracy, frequent panic — lower bound

### Profiles

| Profile | Runs/mission | Governors | Use |
|---|---|---|---|
| smoke | 5 | median | local dev |
| ci | 25 | median + trash | every PR |
| standard | 100 | all three | local deeper check |
| release | 500 | all three | release gate |

### Thresholds

Per-mission acceptance bands defined in `sim/analysis/thresholds.ts`. Tutorial mission must have median-clear-rate ≥ 95%. Late missions may permit median-clear-rate ≥ 60%. CI fails if missions drift outside bands.

### Sweeps

```bash
pnpm analysis:sweep --shape vermin-health --variant sewer-rat --range 1,5 --step 1
pnpm analysis:sweep --shape weapon --weapon shotgun --param damage --range 0.5,2.0 --step 0.25
pnpm analysis:sweep --shape mod --mod extended-mag --param ammoBonus --range 2,8 --step 1
```

Outputs JSON to `sim/reports/sweeps/<shape>-<timestamp>.json`.

### Autobalance

Auto-edits raw data files within clamped bounds (`vermin.health ∈ [1, 12]`, `weapon.damage ∈ [1, 8]`, etc.). +1/-1 nudges only, never massive jumps. Reasons logged. Refuses if working tree dirty. Auto-commits each iteration.

### Locking

Variants stable across N consecutive runs get `locked: true`. Locked items skipped in subsequent autobalance passes. State persisted to `sim/reports/turf/balance-history.json`.

### Release gate

```ts
itRelease('balance lock coverage ≥ 70%', () => { ... });
itRelease('release-profile benchmark within thresholds', () => { ... });
```

CI on release-please-pr runs `RELEASE_GATING=1 pnpm test:release`. Won't tag a release without bar met.

### Playwright player governor

Beyond headless: `e2e/player-governor.spec.ts` drives the rendered game via touch events. Catches input lag, render perf, audio glitches, Capacitor lifecycle bugs. Nightly, not per-PR.

---

## 6. Tooling, Files, Infrastructure

### Tooling stack

| Concern | Tool |
|---|---|
| Package manager | pnpm@10.33.0 (lockfile committed, `--frozen-lockfile` in CI) |
| Build | Vite 8 |
| Language | TypeScript ~6.0.3, strict, project refs |
| Lint + Format | Biome 2.4 |
| Unit/sim tests | Vitest 4 — 3 configs (node, jsdom, browser) |
| E2E | Playwright 1.59 — 4 device projects, port 41739 |
| Mobile shell | Capacitor 8 (Android first) |

### CI workflows

| Workflow | Trigger | Jobs |
|---|---|---|
| `ci.yml` | PR | core (typecheck/lint/test:node/test:dom/build) · browser (canvas tests) · e2e (4 devices) · android-debug-apk · analysis (`analysis:benchmark --profile ci`) |
| `release.yml` | release-please tag | versioned web bundle + Android release APK + attest, runs `RELEASE_GATING=1 pnpm test:release` |
| `cd.yml` | push:main | deploy web preview + attach APK |
| `analysis-nightly.yml` | nightly + manual | `pnpm analysis:lock`, persists `balance-history.json` delta |
| `automerge.yml` | dependabot green | automerge |

All action SHAs pinned. Concurrency-cancel on new pushes. Order: ci → release → cd.

### Persistence schema

```sql
CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE high_scores (mission_id TEXT, score INTEGER, grade TEXT, played_at INTEGER);
CREATE TABLE artifacts (id TEXT PRIMARY KEY, found_at INTEGER, read_count INTEGER);
CREATE TABLE bestiary (variant_id TEXT PRIMARY KEY, first_kill_at INTEGER, kill_count INTEGER, fastest_kill_ms INTEGER);
CREATE TABLE loadout (mission_id TEXT PRIMARY KEY, weapon_id TEXT, mod_ids TEXT);
CREATE TABLE wallet (cash INTEGER NOT NULL DEFAULT 0);
```

### Mobile

- Orientation: lock landscape
- Safe areas: HUD respects `env(safe-area-inset-*)`
- Render budget: 60fps target on 3-year-old mid-range Android. Particle counts capped per quality tier (auto-detected on first launch)
- Battery: pause on background, suspend Tone audio context, suspend Pixi ticker
- Audio: gesture-gated start (mobile autoplay), single `Tone.start()` on first tap
- Haptics: light on hits, medium on kills, heavy on boss damage. Toggleable.

### Required project files

All `.md` files in root + `docs/` carry frontmatter:

```yaml
---
title: Architecture
updated: 2026-04-27
status: current
domain: technical
---
```

Root: `CLAUDE.md`, `AGENTS.md`, `README.md`, `STANDARDS.md`, `CHANGELOG.md`.
Docs: `docs/ARCHITECTURE.md`, `docs/DESIGN.md`, `docs/LORE.md`, `docs/BESTIARY.md`, `docs/BALANCE.md`, `docs/TESTING.md`, `docs/DEPLOYMENT.md`, `docs/STATE.md`.

---

## 7. Non-Negotiable Gates (`STANDARDS.md` Topics)

Enforced by hooks, Biome, and CI:

1. **Player-journey gate**: cold player must understand the goal within 15s. Tutorial mission must be passable on first try by a non-gamer.
2. **Sim-purity gate**: `Math.random` in `src/sim/**` = CI fail. DOM/Pixi/React imports in `src/sim/**` = CI fail.
3. **Balance gate**: `pnpm analysis:benchmark --profile ci` must pass.
4. **Brand gate**: no neon, no cyberpunk. Sodium amber + brick + asphalt + subway tile only. Pre-edit hook rejects forbidden hex codes (`#00f0ff`, `#ff00ff`, `#39ff14`, etc.) outside of CRT-overlay-tinting code.
5. **Pulpy gate**: no grimdark drift. Splash colors stay bright (`#7a2818` for blood, brighter than `#400`).
6. **Factory pyramid**: every spawnable vermin from `sim/factories/actor`; encounters from `sim/factories/encounter`; missions from `sim/factories/mission`. No raw spawns elsewhere.
7. **GOAP everywhere**: vermin AI uses the GOAP port, not ad-hoc state machines.

---

## 8. Implementation Strategy

The full PRD lives at `docs/plans/concrete-vermin.prq.md` and decomposes this design into dependency-ordered tasks for `/task-batch` autonomous execution.

Implementation proceeds in **8 phases** roughly mapping to:

1. **Foundation** — repo bootstrap, configs, CI, docs
2. **Sim core** — RNG, archetype/trait types, factories, scoring engine, encounter FSM
3. **ECS bridge** — Koota world, traits, actions, systems
4. **Render** — Pixi app, camera, sprite composition, effects (trails, splash, CRT)
5. **UI shell** — React shell, screens, HUD, cutscene reader, theme
6. **Audio** — Tone patches per weapon, vermin audio, ambience, music beds
7. **Content** — 12 missions, ~30-50 variants, ~50 collectible artifacts, bestiary text
8. **Balance & polish** — analysis system, governors, sweeps, autobalance, release gate, mobile QA

Each phase is gated by tests + balance benchmarks. No phase advances without its predecessors green.
