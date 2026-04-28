import {
  playEmpty,
  playWeaponFire,
  playWeaponReload,
  playVerminDeath,
  playVerminHit,
  playVerminSpawn,
} from "../audio/sfx";
import {
  bossDeathSilenceSting,
  playLossSting,
  playMissionStartSting,
  playSGradeFanfare,
  playWinSting,
  setActAmbience,
  startBossLeitmotif,
  stopBossLeitmotif,
} from "../audio/music";
import { duckBus } from "../audio/setup";
import { bossDisplayName, srBossSpawn } from "./sr-only";
import { bossDamageHaptic, hitHaptic, killHaptic } from "../platform/haptics";
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
import { applyLoadout, MOD_REGISTRY, type WeaponMod } from "../sim/archetypes/mods";
import { WEAPON_REGISTRY } from "../sim/archetypes/weapons";
import { composeEncounter } from "../sim/factories/encounter";
import type { Mission } from "../sim/factories/mission";
import { pushShake } from "./screenShake";
import { useGameStore } from "./store";
import type {
  DamageEvent,
  ProjectileSnapshot,
  SplashSnapshot,
  VerminSnapshot,
} from "./store";

/**
 * GameRunner: holds the Koota world + sim clock and ticks the
 * end-to-end loop. The Pixi ticker calls `step()` once per frame.
 *
 * Mission-aware: takes a Mission spec and walks every encounter
 * sequentially, awarding cash and ending the run when:
 * - all encounters drained AND all spawned vermin killed → won
 * - livesRemaining hits zero → lost
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
  private kills = 0;
  private encounterIndex = 0;
  private pendingShot: { x: number; y: number } | null = null;
  private pendingReload = false;
  private muzzleFlashes: import("./store").MuzzleFlash[] = [];
  private modifierFlashes: import("./store").ModifierFlashSnapshot[] = [];
  // Weapon state — the player carries one weapon for the whole mission.
  private readonly tunedWeapon: ReturnType<typeof applyLoadout>;
  // Ammo + reload state. mag tracks the active mag's remaining shells;
  // when zero, fire is blocked and the next queueShot triggers a reload
  // (or the player can pre-reload via queueReload).
  private mag: number;
  private reloadStartedAt: number | null = null;
  private readonly mission: Readonly<Mission>;
  private livesRemaining: number;
  private paused = false;
  // Track contact-damage accumulation so the runner can deduct lives
  // when a vermin reaches the player.
  private playerHp: number;
  private readonly maxHpPerLife = 100;
  private ended = false;
  private bossLeitmotifActive = false;
  private damageEvents: DamageEvent[] = [];
  private static readonly DAMAGE_TTL_S = 0.4;

  constructor(mission: Readonly<Mission>, modIds: ReadonlyArray<string> = [], seed?: number) {
    this.mission = mission;
    this.gw = createGameWorld(seed ?? mission.seed ?? Date.now() & 0x7fffffff);
    const mods: WeaponMod[] = [];
    for (const id of modIds) {
      const mod = MOD_REGISTRY.get(id);
      if (!mod) continue;
      if (mod.compatibleWith.length > 0 && !mod.compatibleWith.includes(mission.weapon)) continue;
      mods.push(mod);
    }
    this.tunedWeapon = applyLoadout(WEAPON_REGISTRY[mission.weapon], mods);
    this.mag = this.tunedWeapon.magSize;
    this.livesRemaining = mission.livesAllowance;
    this.playerHp = this.maxHpPerLife;
    setActAmbience(mission.act);
    playMissionStartSting();
    this.startEncounter(0);
  }

  /** Queue an "ACTIVE encounter" with N vermin from the chosen pattern. */
  startEncounter(index: number): void {
    const enc = this.mission.encounters[index];
    if (!enc) return;
    this.encounterIndex = index;
    const composed = composeEncounter(enc, this.gw.rng.fork(`encounter:${enc.id}:${index}`));
    const newSpawns: PendingSpawn[] = [];
    for (const sched of composed.schedules) {
      for (const tick of sched.schedule) {
        newSpawns.push({
          variantId: sched.variant,
          timing: tick,
          activeStartedAt: this.now,
          zone: this.zone,
        });
      }
    }
    this.pendingSpawns = this.pendingSpawns.concat(newSpawns);
  }

  /** Player clicked / tapped — queue a shot to fire on the next tick. */
  queueShot(x: number, y: number): void {
    this.pendingShot = { x, y };
  }

  /** Player long-pressed or pressed R — start a reload window. */
  queueReload(): void {
    this.pendingReload = true;
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }

  isPaused(): boolean {
    return this.paused;
  }

  /** Run as many fixed substeps as fit in the elapsed real time. */
  step(realDtS: number): void {
    if (this.paused || this.ended) {
      this.publishSnapshot();
      return;
    }
    this.accumulator += realDtS;
    while (this.accumulator >= this.fixedDt) {
      this.tick(this.fixedDt);
      this.accumulator -= this.fixedDt;
    }
    this.publishSnapshot();
  }

  private tick(dt: number): void {
    this.now += dt;

    // Reload completion.
    if (this.reloadStartedAt !== null) {
      const elapsed = (this.now - this.reloadStartedAt) * 1000;
      if (elapsed >= this.tunedWeapon.reloadMs) {
        this.mag = this.tunedWeapon.magSize;
        this.reloadStartedAt = null;
      }
    }

    // Auto-start reload when player tapped R / long-pressed.
    if (this.pendingReload && this.reloadStartedAt === null && this.mag < this.tunedWeapon.magSize) {
      this.reloadStartedAt = this.now;
      playWeaponReload(this.tunedWeapon.base.id);
    }
    this.pendingReload = false;

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
    // Boss spawn detection: scan freshly-spawned vermin for a boss
    // archetype id, fire the leitmotif once.
    if (!this.bossLeitmotifActive && spawnedAfter > spawnedBefore) {
      const bossArche = this.bossArchetypeAlive();
      if (bossArche) {
        startBossLeitmotif();
        this.bossLeitmotifActive = true;
        useGameStore
          .getState()
          .announceForScreenReader(srBossSpawn(bossDisplayName(bossArche)).text, "assertive");
      }
    }

    // 2. AI replans/drives velocity.
    aiSystem(this.gw.world, this.gw.rng.fork(`ai:${this.now.toFixed(3)}`), this.now, this.zone);

    // 3. Fire weapon if a shot is queued + ammo available.
    let shotFired = false;
    if (this.pendingShot) {
      if (this.mag > 0 && this.reloadStartedAt === null) {
        const tuned = this.tunedWeapon;
        const reticle = this.pendingShot;
        const playerPos = { x: this.zone.maxX / 2, y: this.zone.maxY - 24 };
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
        this.muzzleFlashes.push({
          x: playerPos.x,
          y: playerPos.y,
          targetX: reticle.x,
          targetY: reticle.y,
          firedAt: this.now,
          ttlS: 0.08,
        });
        this.mag--;
        shotFired = true;
        playWeaponFire(tuned.base.id);
        // Per-shot music duck so weapon fire punches through the bed.
        duckBus("music", 4, 0.18, 0.25);
        if (this.mag === 0 && this.reloadStartedAt === null) {
          this.reloadStartedAt = this.now;
          playWeaponReload(this.tunedWeapon.base.id);
        }
      } else {
        playEmpty();
      }
      this.pendingShot = null;
    }
    this.muzzleFlashes = this.muzzleFlashes.filter((m) => this.now - m.firedAt < m.ttlS);

    // 4. Integrate motion; advance projectiles.
    motionSystem(this.gw.world, dt);
    projectileSystem(this.gw.world, dt, this.now);

    // 5. Hit-test. collideSystem dedupes per-tick kills internally so
    // multi-pellet shotgun blasts produce one event per actual kill —
    // safe to count directly.
    const events = collideSystem(
      this.gw.world,
      this.gw.rng.fork(`collide:${this.now.toFixed(3)}`),
      this.now,
    );
    const newKills = events.filter((e) => e.kind === "kill").length;
    this.kills += newKills;
    for (const e of events) {
      this.damageEvents.push({
        at: this.now,
        x: e.position.x,
        y: e.position.y,
        amount: e.damage,
        crit: e.isCrit,
        headshot: e.isHeadshot,
      });
      if (e.kind === "kill") {
        playVerminDeath(e.archetypeId);
        if (e.archetypeId.startsWith("boss-")) {
          void bossDamageHaptic();
          pushShake("bossDeath");
          if (this.bossLeitmotifActive) {
            stopBossLeitmotif();
            this.bossLeitmotifActive = false;
            bossDeathSilenceSting();
          }
        } else {
          void killHaptic();
          pushShake("kill");
        }
      } else {
        playVerminHit(e.archetypeId);
        if (e.archetypeId.startsWith("boss-")) {
          pushShake("bossHit");
          void bossDamageHaptic();
        } else {
          void hitHaptic();
        }
      }
    }

    const localMissCount = shotFired && events.length === 0 ? 1 : 0;

    // 6. Score.
    const flashes = scoreSystem(
      this.gw.world,
      this.gw.scoreEntity,
      events,
      localMissCount,
      this.now,
      this.reloadStartedAt !== null,
    );
    for (const f of flashes) {
      if (!this.modifierFlashes.some((m) => m.at === f.at && m.kind === f.kind)) {
        this.modifierFlashes.push(f);
      }
    }
    this.modifierFlashes = this.modifierFlashes.filter((f) => this.now - f.at < 1.2);
    this.damageEvents = this.damageEvents.filter((d) => this.now - d.at < GameRunner.DAMAGE_TTL_S);

    // 7. Cull off-screen + lifecycle GC. Off-screen vermin (those that
    // crossed the player line) bite — deduct contact damage proportional
    // to their archetype.
    const culled = cullOffscreenSystem(this.gw.world, this.zone, this.now);
    for (const c of culled) {
      this.applyContactDamage(c.contactDamage);
    }
    lifecycleSystem(this.gw.world, this.now);

    // 8. Encounter / mission progression.
    const encActive = this.pendingSpawns.some((s) => !s.spawned);
    const verminAlive = this.countAliveVermin() > 0;
    if (!encActive && !verminAlive) {
      // Current encounter drained. Advance or end the mission.
      if (this.encounterIndex + 1 < this.mission.encounters.length) {
        this.startEncounter(this.encounterIndex + 1);
      } else if (!this.ended) {
        this.ended = true;
        useGameStore.getState().endMission(true);
        useGameStore
          .getState()
          .awardCash(this.mission.cashAward ?? defaultCashFor(this.mission.act));
        // S-grade fanfare on a flawless run (no lives lost), otherwise
        // the standard win sting.
        if (this.livesRemaining === this.mission.livesAllowance && this.playerHp === this.maxHpPerLife) {
          playSGradeFanfare();
        } else {
          playWinSting();
        }
        if (this.bossLeitmotifActive) {
          stopBossLeitmotif();
          this.bossLeitmotifActive = false;
        }
      }
    }
    if (this.livesRemaining <= 0 && !this.ended) {
      this.ended = true;
      useGameStore.getState().endMission(false);
      playLossSting();
      if (this.bossLeitmotifActive) {
        stopBossLeitmotif();
        this.bossLeitmotifActive = false;
      }
    }
  }

  private bossArchetypeAlive(): string | null {
    for (const e of this.gw.world.query(Vermin, Lifecycle)) {
      const l = e.get(Lifecycle);
      const v = e.get(Vermin);
      if (!l || !v || l.deadAt > 0) continue;
      if (v.archetypeId.startsWith("boss-")) return v.archetypeId;
    }
    return null;
  }

  private countAliveVermin(): number {
    let n = 0;
    for (const e of this.gw.world.query(Vermin, Lifecycle)) {
      const l = e.get(Lifecycle);
      if (l && l.deadAt === 0) n++;
    }
    return n;
  }

  private applyContactDamage(amount: number): void {
    if (amount <= 0) return;
    this.playerHp -= amount;
    while (this.playerHp <= 0 && this.livesRemaining > 0) {
      this.livesRemaining -= 1;
      this.playerHp += this.maxHpPerLife;
    }
    if (this.livesRemaining <= 0) this.playerHp = 0;
  }

  /** Read traits → plain snapshots → push into the zustand store. */
  private publishSnapshot(): void {
    const w = this.gw.world;
    const vermin: VerminSnapshot[] = [];
    for (const e of w.query(Vermin, Position, Hitbox, Health, Lifecycle)) {
      const l = e.get(Lifecycle);
      const h = e.get(Health);
      if (!l || !h || l.deadAt > 0) continue;
      const p = e.get(Position);
      const hb = e.get(Hitbox);
      const v = e.get(Vermin);
      if (!p || !hb || !v) continue;
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
      const p = e.get(Position);
      const v = e.get(Velocity);
      if (!p || !v) continue;
      projectiles.push({ id: e.id(), x: p.x, y: p.y, vx: v.x, vy: v.y });
    }

    const splashes: SplashSnapshot[] = [];
    for (const e of w.query(Splash, Position, Lifecycle)) {
      const s = e.get(Splash);
      const l = e.get(Lifecycle);
      const p = e.get(Position);
      if (!s || !l || !p) continue;
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
      const s = e.get(Score);
      if (!s) continue;
      total = s.total;
      multiplier = s.multiplier;
    }

    const reloadProgress =
      this.reloadStartedAt === null
        ? null
        : Math.min(1, ((this.now - this.reloadStartedAt) * 1000) / this.tunedWeapon.reloadMs);

    useGameStore.getState().setSnapshot({
      vermin,
      projectiles,
      splashes,
      muzzleFlashes: this.muzzleFlashes.slice(),
      modifierFlashes: this.modifierFlashes.slice(),
      damageEvents: this.damageEvents.slice(),
      now: this.now,
      score: { total, multiplier },
      killCount: this.kills,
      player: {
        ammoCurrent: this.mag,
        ammoMax: this.tunedWeapon.magSize,
        livesRemaining: this.livesRemaining,
      },
      reloadProgress,
      reloadDurationMs: this.tunedWeapon.reloadMs,
      reticleRadius: this.tunedWeapon.reticleRadius,
      reticleShape: this.tunedWeapon.reticleShape,
    });
  }
}

function defaultCashFor(act: string): number {
  switch (act) {
    case "streets":
      return 100;
    case "underworld":
      return 200;
    case "above":
      return 350;
    default:
      return 100;
  }
}

// Quiet the unused import — AIPlan is still part of the trait set we
// rely on through the actions module; keep it referenced at runtime so
// tree-shakers don't drop the module-load side-effect.
void AIPlanTrait;
