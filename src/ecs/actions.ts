import type { Entity, World } from "koota";
import type { TunedWeapon } from "../sim/archetypes/mods";
import type { ArchetypeId } from "../sim/archetypes/vermin";
import type { VerminSpawnRecord } from "../sim/factories/actor";
import {
  AIBrain,
  AIPlan,
  Collectible,
  Health,
  Hitbox,
  Lifecycle,
  Position,
  Projectile,
  Score,
  Splash,
  SpriteRef,
  Velocity,
  Vermin,
} from "./traits";

/**
 * ECS action API. Mutates the world; returns the entity (or void) the
 * caller might need. All entity lifecycle goes through here so that
 * the spawn/lifecycle systems can rely on consistent trait sets.
 */

export interface SpawnVerminOptions {
  position: Readonly<{ x: number; y: number }>;
  velocity?: Readonly<{ x: number; y: number }>;
  /** Sim time when this entity was spawned. */
  now: number;
}

export function spawnVermin(
  world: World,
  rec: VerminSpawnRecord,
  opts: SpawnVerminOptions,
): Entity {
  return world.spawn(
    Vermin({ archetypeId: rec.archetypeId, isBoss: rec.isBoss, locomotion: rec.locomotion }),
    Position({ x: opts.position.x, y: opts.position.y }),
    Velocity({ x: opts.velocity?.x ?? 0, y: opts.velocity?.y ?? 0 }),
    Health({ current: rec.stats.health, max: rec.stats.health }),
    Hitbox({
      width: rec.hitbox.width,
      height: rec.hitbox.height,
      headOffsetX: rec.hitbox.headOffset.x,
      headOffsetY: rec.hitbox.headOffset.y,
    }),
    SpriteRef({ atlas: rec.spriteAtlas, frame: 0, scale: 1 }),
    AIBrain({ id: rec.brain }),
    AIPlan,
    Lifecycle({ spawnedAt: opts.now, deadAt: 0 }),
  );
}

export interface FireWeaponOptions {
  origin: Readonly<{ x: number; y: number }>;
  target: Readonly<{ x: number; y: number }>;
  /** Sim time when the trigger was pulled. */
  now: number;
  /** Owner entity id (player). */
  ownerEntity: number;
}

/**
 * Spawns one projectile entity per pellet (shotguns produce many).
 * Spread is applied as a small angle perturbation per pellet — the
 * caller can pre-compute a deterministic spread sequence via rng to
 * keep visuals stable.
 */
export function fireWeapon(
  world: World,
  weapon: TunedWeapon,
  opts: FireWeaponOptions,
  spreadAngles: ReadonlyArray<number> = [],
): Entity[] {
  const entities: Entity[] = [];
  const dx = opts.target.x - opts.origin.x;
  const dy = opts.target.y - opts.origin.y;
  const baseAngle = Math.atan2(dy, dx);
  const speed = 1200; // projectile speed in units/sec; tunable later

  for (let p = 0; p < weapon.base.pellets; p++) {
    const a = baseAngle + (spreadAngles[p] ?? 0);
    const e = world.spawn(
      Position({ x: opts.origin.x, y: opts.origin.y }),
      Velocity({ x: Math.cos(a) * speed, y: Math.sin(a) * speed }),
      Projectile({
        ownerEntity: opts.ownerEntity,
        damage: weapon.base.damage,
        headshotBonus: weapon.headshotBonus,
        critChance: weapon.critChance,
        critMultiplier: weapon.base.critMultiplier,
        armorPierce: weapon.armorPierce,
        damageMods: weapon.damageMods,
        critChanceMods: weapon.critChanceMods,
        rangeRemaining: weapon.rangeMax,
        projectileType: weapon.base.projectileType,
        trailType: weapon.base.trailType,
      }),
      Lifecycle({ spawnedAt: opts.now, deadAt: 0 }),
    );
    entities.push(e);
  }
  return entities;
}

export function takeDamage(world: World, entityId: number, amount: number, now: number): void {
  for (const e of world.query(Health)) {
    if (e.id() !== entityId) continue;
    const h = e.get(Health);
    if (!h) return;
    const remaining = Math.max(0, h.current - amount);
    e.set(Health, { current: remaining, max: h.max });
    if (remaining <= 0) {
      // Mark for despawn; lifecycle system handles the removal + splash.
      const l = e.get(Lifecycle);
      e.set(Lifecycle, { spawnedAt: l?.spawnedAt ?? now, deadAt: now });
    }
    return;
  }
}

export function consumeCollectible(world: World, entityId: number, now: number): void {
  for (const e of world.query(Collectible)) {
    if (e.id() !== entityId) continue;
    const l = e.get(Lifecycle);
    e.set(Lifecycle, { spawnedAt: l?.spawnedAt ?? now, deadAt: now });
    return;
  }
}

export function spawnSplash(
  world: World,
  pos: Readonly<{ x: number; y: number }>,
  variantId: string,
  archetypeId: ArchetypeId,
  now: number,
  ttlS = 0.4,
): Entity {
  return world.spawn(
    Position({ x: pos.x, y: pos.y }),
    Splash({ variantId, archetypeId, intensity: 1, ttlS }),
    Lifecycle({ spawnedAt: now, deadAt: now + ttlS }),
  );
}

/** Update the singleton Score trait. */
export function setScore(
  world: World,
  scoreEntityId: number,
  next: {
    total: number;
    multiplier: number;
    multiplierGraceUntil: number;
    multiplierDecayAt: number;
    noReloadStreak: number;
  },
): void {
  for (const e of world.query(Score)) {
    if (e.id() !== scoreEntityId) continue;
    e.set(Score, next);
    return;
  }
}
