import {
  playChargeRelease,
  playChargeWhine,
  playEmpty,
  playWeaponFire,
  playWeaponReload,
  playVerminDeath,
  playVerminHit,
  playVerminSpawn,
  stopChargeWhine,
  tickChargeWhine,
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
  napalmSystem,
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
  NapalmPool,
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
import { createObjectPool, type ObjectPool } from "./objectPool";
import { pushShake } from "./screenShake";
import { useGameStore } from "./store";
import type {
  DamageEvent,
  EventBarkSnapshot,
  NapalmPoolSnapshot,
  ProjectileSnapshot,
  SplashSnapshot,
  VerminSnapshot,
} from "./store";

/**
 * Pre-allocated pool capacities. Sized to comfortably exceed the worst-
 * case live count for any single mission tick on the most chaotic
 * encounters (boss + 12-vermin flood + smg burst). The pool will evict
 * the oldest entry if exceeded — visually fine for transients.
 */
const MUZZLE_FLASH_POOL = 32;
const DAMAGE_EVENT_POOL = 96;

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
  private chargeStartedAt: number | null = null;
  private chargePending = false;
  private pendingBurstQueue: {
    x: number;
    y: number;
    remaining: number;
    intervalMs: number;
    nextAt: number;
    burstIndex: number;
    isCone: boolean;
  } | null = null;
  private readonly muzzleFlashPool: ObjectPool<import("./store").MuzzleFlash> = createObjectPool(
    MUZZLE_FLASH_POOL,
    () => ({
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      firedAt: 0,
      ttlS: 0,
    }),
  );
  private modifierFlashes: import("./store").ModifierFlashSnapshot[] = [];
  // Mid-mission event dispatch — each event fires at most once per
  // mission run. We track ids of fired events here so we don't double-
  // fire across consecutive ticks where the trigger condition still
  // holds (e.g., kill-count >= N stays true forever after).
  private firedEventIds: Set<string> = new Set();
  private eventBarks: EventBarkSnapshot[] = [];
  private static readonly EVENT_BARK_TTL_S = 5;
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
  private readonly damageEventPool: ObjectPool<DamageEvent> = createObjectPool(
    DAMAGE_EVENT_POOL,
    () => ({ at: 0, x: 0, y: 0, amount: 0, crit: false, headshot: false }),
  );
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
    // Publish an initial snapshot so the renderer/UI sees the correct
    // reticleRadius/Shape (and ammo / lives) on frame 0, before the first
    // tick. Otherwise tap-to-fire briefly uses defaults from the previous
    // mission or the store init.
    this.publishSnapshot();
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

  /** Player pressed and held — begin charging a charge-shot. */
  queueChargeStart(): void {
    if (this.mag > 0 && this.reloadStartedAt === null && !this.chargePending) {
      this.chargeStartedAt = this.now;
      this.chargePending = true;
      playChargeWhine(this.tunedWeapon.base.id);
    }
  }

  /** Player released after holding — fire the charge effect (or tap fallback). */
  queueChargeRelease(aimX: number, aimY: number): void {
    if (!this.chargePending || this.chargeStartedAt === null) return;
    const chargeProgress = Math.min(
      1,
      ((this.now - this.chargeStartedAt) * 1000) /
        (this.tunedWeapon.chargeProfile?.maxChargeMs ?? 1000),
    );
    this.chargePending = false;
    this.chargeStartedAt = null;
    stopChargeWhine();
    if (chargeProgress < 0.1) {
      // Too short — treat as tap
      this.queueShot(aimX, aimY);
      return;
    }
    this.applyChargeEffect(aimX, aimY, chargeProgress);
    playChargeRelease(this.tunedWeapon.base.id, chargeProgress);
  }

  /** External cancel — e.g. pause, lose focus, or weapon swap while held. */
  cancelCharge(): void {
    if (!this.chargePending) return;
    this.chargePending = false;
    this.chargeStartedAt = null;
    stopChargeWhine();
  }

  pause(): void {
    this.paused = true;
    this.cancelCharge();
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
    if (
      this.pendingReload &&
      this.reloadStartedAt === null &&
      this.mag < this.tunedWeapon.magSize
    ) {
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
        const flash = this.muzzleFlashPool.acquire();
        flash.x = playerPos.x;
        flash.y = playerPos.y;
        flash.targetX = reticle.x;
        flash.targetY = reticle.y;
        flash.firedAt = this.now;
        flash.ttlS = 0.08;
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

    // Burst drain — fires queued burst shots on their scheduled intervals.
    if (this.pendingBurstQueue !== null) {
      const nowMs = this.now * 1000;
      while (
        this.pendingBurstQueue !== null &&
        nowMs >= this.pendingBurstQueue.nextAt &&
        this.pendingBurstQueue.remaining > 0
      ) {
        const bq = this.pendingBurstQueue;
        if (this.mag <= 0) {
          // Ran out of ammo mid-burst — abort.
          this.pendingBurstQueue = null;
          break;
        }
        const tuned = this.tunedWeapon;
        const playerPos = { x: this.zone.maxX / 2, y: this.zone.maxY - 24 };
        const target = { x: bq.x, y: bq.y };
        const fireOpts = {
          origin: playerPos,
          target,
          now: this.now,
          ownerEntity: this.gw.playerEntity,
        };

        if (bq.isCone) {
          // Widen spread per shot for the cone effect.
          const wideSpread = Math.min(Math.PI / 3, tuned.base.spread + bq.burstIndex * 0.04);
          const spreadRng = this.gw.rng.fork(`burst:cone:${bq.burstIndex}:${this.now.toFixed(3)}`);
          const spreads = Array.from(
            { length: tuned.base.pellets },
            () => (spreadRng.next() * 2 - 1) * wideSpread,
          );
          fireWeapon(this.gw.world, tuned, fireOpts, spreads);
        } else {
          const spreadRng = this.gw.rng.fork(`burst:auto:${bq.burstIndex}:${this.now.toFixed(3)}`);
          const spreads = Array.from(
            { length: tuned.base.pellets },
            () => (spreadRng.next() * 2 - 1) * tuned.spread,
          );
          fireWeapon(this.gw.world, tuned, fireOpts, spreads);
        }

        this.mag = Math.max(0, this.mag - 1);
        bq.remaining--;
        bq.burstIndex++;
        bq.nextAt += bq.intervalMs;

        if (bq.remaining === 0) {
          this.pendingBurstQueue = null;
        }
      }
    }

    this.muzzleFlashPool.retainWhere((m) => this.now - m.firedAt < m.ttlS);

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
      const dmg = this.damageEventPool.acquire();
      dmg.at = this.now;
      dmg.x = e.position.x;
      dmg.y = e.position.y;
      dmg.amount = e.damage;
      dmg.crit = e.isCrit;
      dmg.headshot = e.isHeadshot;
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
    this.damageEventPool.retainWhere((d) => this.now - d.at < GameRunner.DAMAGE_TTL_S);

    // 7. Cull off-screen + lifecycle GC. Off-screen vermin (those that
    // crossed the player line) bite — deduct contact damage proportional
    // to their archetype.
    const culled = cullOffscreenSystem(this.gw.world, this.zone, this.now);
    for (const c of culled) {
      this.applyContactDamage(c.contactDamage);
    }
    lifecycleSystem(this.gw.world, this.now);

    // 7.25 Napalm pool DoT — applies damage to vermin inside active pools,
    // then expires pools whose TTL has elapsed.
    napalmSystem(this.gw.world, this.now * 1000);

    // 7.5 Mid-mission dynamic event triggers.
    this.dispatchMissionEvents();

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
        if (
          this.livesRemaining === this.mission.livesAllowance &&
          this.playerHp === this.maxHpPerLife
        ) {
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

  /**
   * Walk the mission's event list and fire any whose trigger condition
   * is now satisfied and which haven't fired yet. Each event fires at
   * most once per run.
   */
  private dispatchMissionEvents(): void {
    if (this.ended) return;
    for (const ev of this.mission.events) {
      if (this.firedEventIds.has(ev.id)) continue;
      let fire = false;
      switch (ev.trigger.kind) {
        case "at-encounter-start":
          fire = this.encounterIndex >= ev.trigger.index;
          break;
        case "at-kill-count":
          fire = this.kills >= ev.trigger.threshold;
          break;
        case "at-time":
          fire = this.now >= ev.trigger.seconds;
          break;
      }
      if (!fire) continue;
      this.firedEventIds.add(ev.id);
      this.applyMissionEffect(ev);
    }
    // Evict expired barks before publishSnapshot picks them up.
    if (this.eventBarks.length > 0) {
      this.eventBarks = this.eventBarks.filter(
        (b) => this.now - b.at < GameRunner.EVENT_BARK_TTL_S,
      );
    }
  }

  private applyMissionEffect(ev: import("../sim/factories/mission").MissionEvent): void {
    const eff = ev.effect;
    switch (eff.kind) {
      case "boss-bark": {
        this.eventBarks.push({ id: ev.id, kind: "boss", text: eff.text, at: this.now });
        useGameStore.getState().announceForScreenReader(eff.text, "polite");
        break;
      }
      case "environmental-hazard": {
        this.eventBarks.push({
          id: ev.id,
          kind: "hazard",
          text: eff.label,
          ...(eff.detail ? { detail: eff.detail } : {}),
          at: this.now,
        });
        const sr = eff.detail ? `${eff.label}. ${eff.detail}` : eff.label;
        useGameStore.getState().announceForScreenReader(sr, "assertive");
        break;
      }
      case "surprise-wave": {
        // Synthesize a one-encounter spec on the fly and run it through
        // composeEncounter so the spawn schedule + zone math match the
        // normal encounter pipeline. Re-uses the active rng fork keyed
        // by the event id so seeded replays remain deterministic.
        const synth = {
          id: `event:${ev.id}`,
          isCheckpoint: false,
          spawns: [{ variant: eff.variant, count: eff.count, pattern: eff.pattern }],
        };
        const composed = composeEncounter(
          synth as unknown as Parameters<typeof composeEncounter>[0],
          this.gw.rng.fork(`event:${ev.id}`),
        );
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
        const text = `Surprise wave — ${eff.count}× ${eff.variant.replace(/[-_]/g, " ")}.`;
        this.eventBarks.push({ id: ev.id, kind: "wave", text, at: this.now });
        useGameStore.getState().announceForScreenReader(text, "assertive");
        break;
      }
    }
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

  /**
   * Execute the charge-shot effect for the active weapon. Consumes
   * shellsConsumed from mag (floored at 0). Implements simple effects
   * inline; deferred effects (burst-loop, napalm-pool) log a warning
   * and fall back to a single shot until their respective phases land.
   */
  private applyChargeEffect(aimX: number, aimY: number, chargeProgress: number): void {
    const profile = this.tunedWeapon.chargeProfile;
    if (!profile) {
      // Weapon has no charge profile — treat as normal shot.
      this.queueShot(aimX, aimY);
      return;
    }

    // Consume shells (never below zero).
    this.mag = Math.max(0, this.mag - profile.shellsConsumed);

    const tuned = this.tunedWeapon;
    const playerPos = { x: this.zone.maxX / 2, y: this.zone.maxY - 24 };
    const target = { x: aimX, y: aimY };
    const fireOpts = {
      origin: playerPos,
      target,
      now: this.now,
      ownerEntity: this.gw.playerEntity,
    };

    switch (profile.effect) {
      case "double-barrel": {
        // Both barrels fire at the same coords — two independent shots.
        const spreads = Array.from(
          { length: tuned.base.pellets },
          () =>
            (this.gw.rng.fork(`charge:db1:${this.now.toFixed(3)}`).next() * 2 - 1) * tuned.spread,
        );
        fireWeapon(this.gw.world, tuned, fireOpts, spreads);
        const spreads2 = Array.from(
          { length: tuned.base.pellets },
          () =>
            (this.gw.rng.fork(`charge:db2:${this.now.toFixed(3)}`).next() * 2 - 1) * tuned.spread,
        );
        fireWeapon(this.gw.world, tuned, fireOpts, spreads2);
        break;
      }
      case "wide-spray": {
        // Extra pellets proportional to charge progress.
        const extraPellets = Math.ceil(tuned.base.pellets * (1 + chargeProgress));
        const spreads = Array.from(
          { length: extraPellets },
          () =>
            (this.gw.rng.fork(`charge:ws:${this.now.toFixed(3)}`).next() * 2 - 1) * tuned.spread,
        );
        fireWeapon(this.gw.world, tuned, fireOpts, spreads, extraPellets);
        break;
      }
      case "arc-repeater": {
        // 3 rapid single-pellet arcs.
        for (let i = 0; i < 3; i++) {
          const spreads = [
            (this.gw.rng.fork(`charge:arc:${i}:${this.now.toFixed(3)}`).next() * 2 - 1) *
              tuned.spread,
          ];
          fireWeapon(this.gw.world, tuned, fireOpts, spreads, 1);
        }
        break;
      }
      case "auto-burst": {
        // 5-shot burst, one shell per shot, 120 ms between shots.
        // shellsConsumed shells were already deducted above; cap remaining
        // burst to actual mag count so we never fire into an empty mag.
        const burstSize = Math.min(5, this.mag + profile.shellsConsumed);
        this.pendingBurstQueue = {
          x: aimX,
          y: aimY,
          remaining: burstSize,
          intervalMs: 120,
          nextAt: this.now * 1000,
          burstIndex: 0,
          isCone: false,
        };
        // Restore the shellsConsumed deduction — burst drain handles per-shot
        // mag tracking itself.
        this.mag = Math.min(this.tunedWeapon.magSize, this.mag + profile.shellsConsumed);
        break;
      }
      case "mag-dump-cone": {
        // Dump up to 8 shells in a widening cone, 50 ms between shots.
        const dumpSize = Math.min(this.mag + profile.shellsConsumed, 8);
        this.pendingBurstQueue = {
          x: aimX,
          y: aimY,
          remaining: dumpSize,
          intervalMs: 50,
          nextAt: this.now * 1000,
          burstIndex: 0,
          isCone: true,
        };
        // Restore the shellsConsumed deduction — burst drain handles per-shot
        // mag tracking itself.
        this.mag = Math.min(this.tunedWeapon.magSize, this.mag + profile.shellsConsumed);
        break;
      }
      case "napalm-pool": {
        // Burning puddle. ttl/radius/dps scale with charge progress. Tuned
        // so 700ms-max charge for 4 shells lands a saturated DPS that
        // out-paces continuous tap-fire on a stationary target across the
        // pool lifetime — without making half-charges trivially better.
        const ttlMs = 1500 + chargeProgress * 3000; // 1.5–4.5 s
        const radius = 28 + chargeProgress * 18; // 28–46 px
        const dps = 28 + chargeProgress * 42; // 28–70 dps
        this.gw.world.spawn(
          NapalmPool({
            x: aimX,
            y: aimY,
            radius,
            dps,
            ttlMs,
            expiresAt: this.now * 1000 + ttlMs,
          }),
        );
        break;
      }
    }

    playWeaponFire(tuned.base.id);
    duckBus("music", 4, 0.18, 0.25);

    // Auto-reload if mag is now empty.
    if (this.mag === 0 && this.reloadStartedAt === null) {
      this.reloadStartedAt = this.now;
      playWeaponReload(tuned.base.id);
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
      const p = e.get(Position);
      const hb = e.get(Hitbox);
      const v = e.get(Vermin);
      const vel = e.get(Velocity);
      if (!p || !hb || !v) continue;
      vermin.push({
        id: e.id(),
        archetypeId: v.archetypeId,
        x: p.x,
        y: p.y,
        vx: vel?.x ?? 0,
        vy: vel?.y ?? 0,
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

    const napalmPools: NapalmPoolSnapshot[] = [];
    for (const e of w.query(NapalmPool)) {
      const pool = e.get(NapalmPool);
      if (!pool) continue;
      const nowMs = this.now * 1000;
      const ageFrac = Math.min(1, Math.max(0, 1 - (pool.expiresAt - nowMs) / pool.ttlMs));
      napalmPools.push({
        id: e.id(),
        x: pool.x,
        y: pool.y,
        radius: pool.radius,
        dps: pool.dps,
        ageFrac,
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

    const chargeProgress =
      this.chargeStartedAt !== null
        ? Math.min(
            1,
            ((this.now - this.chargeStartedAt) * 1000) /
              (this.tunedWeapon.chargeProfile?.maxChargeMs ?? 1000),
          )
        : null;

    if (chargeProgress !== null) {
      tickChargeWhine(chargeProgress);
    }

    useGameStore.getState().setSnapshot({
      vermin,
      projectiles,
      splashes,
      napalmPools,
      muzzleFlashes: this.muzzleFlashPool.liveSnapshot(),
      modifierFlashes: this.modifierFlashes.slice(),
      eventBarks: this.eventBarks.slice(),
      damageEvents: this.damageEventPool.liveSnapshot(),
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
      chargeProgress,
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
