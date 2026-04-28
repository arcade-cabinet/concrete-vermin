import { playShotgun, playVerminDeath, playVerminHit, playVerminSpawn } from "../audio/sfx";
import { fireWeapon } from "../ecs/actions";
import {
  aiSystem,
  collideSystem,
  cullOffscreenSystem,
  lifecycleSystem,
  motionSystem,
  type PendingSpawn,
  projectileSystem,
  scoreSystem,
  spawnSystem,
} from "../ecs/systems";
import {
  AIPlan as AIPlanTrait,
  Health,
  Hitbox,
  Lifecycle,
  Position,
  Projectile,
  Score,
  Splash,
  Velocity,
  Vermin,
} from "../ecs/traits";
import { createGameWorld, type GameWorld } from "../ecs/world";
import { applyLoadout } from "../sim/archetypes/mods";
import { WEAPON_REGISTRY } from "../sim/archetypes/weapons";
import { planSpawnPattern } from "../sim/factories/patterns";
import {
  type ProjectileSnapshot,
  type SplashSnapshot,
  useGameStore,
  type VerminSnapshot,
} from "./store";

/**
 * GameRunner: holds the Koota world + sim clock and ticks the
 * end-to-end loop. The Pixi ticker calls `step()` once per frame.
 *
 * One mission per runner — re-instantiate to start a new one.
 */
export class GameRunner {
  readonly gw: GameWorld;
  private now = 0;
  private accumulator = 0;
  private readonly fixedDt = 1 / 60;
  private readonly zone = { minX: 0, maxX: 480, minY: 0, maxY: 270 };
  private pendingSpawns: PendingSpawn[] = [];
  private killsTarget = 0;
  private kills = 0;
  private pendingShot: { x: number; y: number } | null = null;
  private pendingReload = false;
  // Muzzle flashes are too short-lived (80ms) to be worth ECS entities;
  // hold them in a rolling list pruned by TTL each tick.
  private muzzleFlashes: import("./store").MuzzleFlash[] = [];
  // Modifier flashes (headshot/two-for-one/variety/no-reload/mid-air)
  // for the HUD pop-up. Same rolling-list approach.
  private modifierFlashes: import("./store").ModifierFlashSnapshot[] = [];

  constructor(seed: number) {
    this.gw = createGameWorld(seed);
  }

  /** Queue an "ACTIVE encounter" with N rats from a left-flood pattern. */
  startTutorialMission(killsRequired: number): void {
    const rng = this.gw.rng.fork("tutorial-encounter");
    const timings = planSpawnPattern("left-flood", killsRequired, rng);
    this.pendingSpawns = timings.map((t) => ({
      variantId: "rat-mangy",
      timing: t,
      activeStartedAt: this.now,
      zone: this.zone,
    }));
    this.killsTarget = killsRequired;
    this.kills = 0;
  }

  /** Player clicked / tapped — queue a shot to fire on the next tick. */
  queueShot(x: number, y: number): void {
    this.pendingShot = { x, y };
  }

  /** Player long-pressed or pressed R — reload (drops the no-reload streak). */
  queueReload(): void {
    this.pendingReload = true;
  }

  /** Run as many fixed substeps as fit in the elapsed real time. */
  step(realDtS: number): void {
    this.accumulator += realDtS;
    while (this.accumulator >= this.fixedDt) {
      this.tick(this.fixedDt);
      this.accumulator -= this.fixedDt;
    }
    this.publishSnapshot();
  }

  private tick(dt: number): void {
    this.now += dt;

    // 1. Spawn pending vermin whose delay has elapsed.
    const spawnedBefore = this.pendingSpawns.filter((p) => p.spawned).length;
    spawnSystem(
      this.gw.world,
      this.gw.rng.fork(`spawn:${this.now.toFixed(3)}`),
      this.now,
      this.pendingSpawns,
    );
    const spawnedAfter = this.pendingSpawns.filter((p) => p.spawned).length;
    for (let i = 0; i < spawnedAfter - spawnedBefore; i++) playVerminSpawn();

    // 2. AI replans/drives velocity.
    aiSystem(this.gw.world, this.gw.rng.fork(`ai:${this.now.toFixed(3)}`), this.now, this.zone);

    // 3. Fire weapon if a shot is queued.
    let shotFired = false;
    if (this.pendingShot) {
      const tuned = applyLoadout(WEAPON_REGISTRY.shotgun, []);
      const reticle = this.pendingShot;
      const playerPos = { x: this.zone.maxX / 2, y: this.zone.maxY - 24 };
      // Spread per pellet — deterministic via rng fork.
      const spreadRng = this.gw.rng.fork(`shot:${this.now.toFixed(3)}`);
      const spreads = Array.from(
        { length: tuned.base.pellets },
        () => (spreadRng.next() * 2 - 1) * tuned.spread,
      );
      fireWeapon(
        this.gw.world,
        tuned,
        {
          origin: playerPos,
          target: reticle,
          now: this.now,
          ownerEntity: this.gw.playerEntity,
        },
        spreads,
      );
      // Spawn the muzzle flash — sodium amber pulse pointing at the
      // reticle for 80ms (matches design's "snap-pop" weapon feel).
      this.muzzleFlashes.push({
        x: playerPos.x,
        y: playerPos.y,
        targetX: reticle.x,
        targetY: reticle.y,
        firedAt: this.now,
        ttlS: 0.08,
      });
      this.pendingShot = null;
      shotFired = true;
      playShotgun();
    }
    // Prune expired muzzle flashes regardless of whether we just fired.
    this.muzzleFlashes = this.muzzleFlashes.filter((m) => this.now - m.firedAt < m.ttlS);

    // 4. Integrate motion; advance projectiles.
    motionSystem(this.gw.world, dt);
    projectileSystem(this.gw.world, dt, this.now);

    // 5. Hit-test.
    const events = collideSystem(
      this.gw.world,
      this.gw.rng.fork(`collide:${this.now.toFixed(3)}`),
      this.now,
    );
    const newKills = events.filter((e) => e.kind === "kill").length;
    this.kills += newKills;
    for (const e of events) {
      if (e.kind === "kill") playVerminDeath();
      else playVerminHit();
    }

    // Misses — only count if we fired AND nothing was hit.
    const localMissCount = shotFired && events.length === 0 ? 1 : 0;

    // 6. Score.
    const flashes = scoreSystem(
      this.gw.world,
      this.gw.scoreEntity,
      events,
      localMissCount,
      this.now,
      this.pendingReload,
    );
    this.pendingReload = false;
    // Append new flashes to the rolling list, prune anything older than the
    // HUD fade window (1.2s).
    for (const f of flashes) {
      if (!this.modifierFlashes.some((m) => m.at === f.at && m.kind === f.kind)) {
        this.modifierFlashes.push(f);
      }
    }
    this.modifierFlashes = this.modifierFlashes.filter((f) => this.now - f.at < 1.2);

    // 7. Cull off-screen + lifecycle GC.
    cullOffscreenSystem(this.gw.world, this.zone, this.now);
    lifecycleSystem(this.gw.world, this.now);

    // 8. End-of-mission?
    if (this.kills >= this.killsTarget && this.killsTarget > 0) {
      useGameStore.getState().endMission(true);
      this.killsTarget = 0; // latch
    }
  }

  /** Read traits → plain snapshots → push into the zustand store. */
  private publishSnapshot(): void {
    const w = this.gw.world;
    const vermin: VerminSnapshot[] = [];
    for (const e of w.query(Vermin, Position, Hitbox, Health, Lifecycle)) {
      const l = e.get(Lifecycle);
      const h = e.get(Health);
      if (!l || !h || l.deadAt > 0) continue;
      const p = e.get(Position)!;
      const hb = e.get(Hitbox)!;
      const v = e.get(Vermin)!;
      vermin.push({
        id: e.id(),
        archetypeId: v.archetypeId,
        x: p.x,
        y: p.y,
        width: hb.width,
        height: hb.height,
        health: h.current,
        maxHealth: h.max,
      });
    }

    const projectiles: ProjectileSnapshot[] = [];
    for (const e of w.query(Projectile, Position, Velocity, Lifecycle)) {
      const l = e.get(Lifecycle);
      if (!l || l.deadAt > 0) continue;
      const p = e.get(Position)!;
      const v = e.get(Velocity)!;
      projectiles.push({ id: e.id(), x: p.x, y: p.y, vx: v.x, vy: v.y });
    }

    const splashes: SplashSnapshot[] = [];
    for (const e of w.query(Splash, Position, Lifecycle)) {
      const s = e.get(Splash)!;
      const l = e.get(Lifecycle)!;
      const p = e.get(Position)!;
      const ageS = this.now - l.spawnedAt;
      splashes.push({
        id: e.id(),
        x: p.x,
        y: p.y,
        ageS,
        ttlS: s.ttlS,
        archetypeId: s.archetypeId,
      });
    }

    let total = 0;
    let multiplier = 1;
    for (const e of w.query(Score)) {
      if (e.id() !== this.gw.scoreEntity) continue;
      const s = e.get(Score)!;
      total = s.total;
      multiplier = s.multiplier;
    }

    useGameStore.getState().setSnapshot({
      vermin,
      projectiles,
      splashes,
      muzzleFlashes: this.muzzleFlashes.slice(),
      modifierFlashes: this.modifierFlashes.slice(),
      now: this.now,
      score: { total, multiplier },
      killCount: this.kills,
    });
  }
}

// Quiet the unused import — AIPlan is still part of the trait set we
// rely on through the actions module; keep it referenced at runtime so
// tree-shakers don't drop the module-load side-effect.
void AIPlanTrait;
