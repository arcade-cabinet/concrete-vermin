import type { World } from "koota";
import type { ArchetypeId } from "../../sim/archetypes/vermin";
import { resolveHit } from "../../sim/engine/damage";
import type { Rng } from "../../sim/rng";
import { spawnSplash, takeDamage } from "../actions";
import { Health, Hitbox, Lifecycle, Position, Projectile, Vermin } from "../traits";

export interface CollideEvent {
  kind: "hit" | "kill";
  verminEntity: number;
  archetypeId: string;
  isHeadshot: boolean;
  isCrit: boolean;
  damage: number;
  position: { x: number; y: number };
  at: number;
}

/**
 * Collide system: AABB hit-tests every live projectile against every
 * live vermin (small N, so brute force is fine). On hit, calls the
 * pure damage resolver, applies takeDamage, kills the projectile, and
 * spawns a splash for the renderer. Returns events for the score
 * system.
 *
 * The rng is forked per-call so crit rolls are tick-deterministic.
 */
export function collideSystem(world: World, rng: Rng, now: number): CollideEvent[] {
  const events: CollideEvent[] = [];
  // Track entities killed earlier in this same tick so subsequent
  // pellets / projectiles don't fire redundant kill/hit events against
  // a corpse. Without this, a multi-pellet shotgun blast where every
  // pellet converges on one rat produces N kill events for one death,
  // double-charging audio, haptics, and score.
  const killedThisTick = new Set<number>();
  const vermin: Array<{
    e: ReturnType<World["query"]>[number];
    pos: { x: number; y: number };
    box: { hw: number; hh: number; headY: number };
    arche: ArchetypeId;
  }> = [];

  for (const e of world.query(Vermin, Position, Hitbox, Health, Lifecycle)) {
    const l = e.get(Lifecycle);
    const h = e.get(Health);
    if (!l || !h || l.deadAt > 0 || h.current <= 0) continue;
    const p = e.get(Position);
    const hb = e.get(Hitbox);
    const v = e.get(Vermin);
    if (!p || !hb || !v) continue;
    vermin.push({
      e,
      pos: { x: p.x, y: p.y },
      box: { hw: hb.width / 2, hh: hb.height / 2, headY: hb.headOffsetY },
      arche: v.archetypeId,
    });
  }

  for (const proj of world.query(Projectile, Position, Lifecycle)) {
    const pl = proj.get(Lifecycle);
    if (!pl || pl.deadAt > 0) continue;
    const pp = proj.get(Position);
    const pj = proj.get(Projectile);
    if (!pp || !pj) continue;

    for (const v of vermin) {
      // Skip vermin already killed earlier this tick — protects audio,
      // haptics, score, and event consumers from double-firing on
      // multi-pellet shotgun blasts that converge on a single target.
      if (killedThisTick.has(v.e.id())) continue;
      const dx = pp.x - v.pos.x;
      const dy = pp.y - v.pos.y;
      if (Math.abs(dx) > v.box.hw || Math.abs(dy) > v.box.hh) continue;

      const isHeadshot = pp.y < v.pos.y + v.box.headY;
      const target = {
        health: v.e.get(Health)?.current ?? 0,
        healthMod: "normal" as const,
        headshotMultiplier: 2,
      };
      const hit = resolveHit(
        {
          damage: pj.damage,
          headshotBonus: pj.headshotBonus,
          critChance: pj.critChance,
          critMultiplier: pj.critMultiplier,
          damageMods: pj.damageMods,
          critChanceMods: pj.critChanceMods,
          armorPierce: pj.armorPierce,
        },
        target,
        { isHeadshot, critRoll: rng.next() },
      );

      takeDamage(world, v.e.id(), hit.damage, now);
      proj.set(Lifecycle, { spawnedAt: pl.spawnedAt, deadAt: now });

      const killed = hit.killed;
      if (killed) killedThisTick.add(v.e.id());
      events.push({
        kind: killed ? "kill" : "hit",
        verminEntity: v.e.id(),
        archetypeId: v.arche,
        isHeadshot,
        isCrit: hit.isCrit,
        damage: hit.damage,
        position: { x: pp.x, y: pp.y },
        at: now,
      });

      if (killed) {
        spawnSplash(world, v.pos, v.arche, v.arche, now);
      }
      break; // one projectile, one hit
    }
  }

  return events;
}
