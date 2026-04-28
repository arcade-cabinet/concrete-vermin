import type { Graphics as PixiGraphics } from "pixi.js";
import { useCallback } from "react";
import { useGameStore } from "../runtime/store";

const SHADOW = { color: 0x000000, alpha: 0.35 };
const EYE_GLINT = 0xff5b3c;
const EYE_DARK = 0x140a06;

const RAT_BODY = 0x3a2e22;
const RAT_BELLY = 0x4a3a2c;
const RAT_TAIL = 0x2a2018;

const ROACH_BODY = 0x1a0f08;
const ROACH_SHELL = 0x2a1c10;
const ROACH_LEG = 0x0c0604;

const PIGEON_BODY = 0x6b6b6b;
const PIGEON_WING = 0x4d4d4d;
const PIGEON_HEAD = 0x5a5a5a;
const PIGEON_BEAK = 0xc4a056;

const RACCOON_BODY = 0x4a4036;
const RACCOON_MASK = 0x141008;
const RACCOON_RING = 0x6a5e50;

const SEAGULL_BODY = 0xe8e4dc;
const SEAGULL_WING = 0x9c9890;
const SEAGULL_BEAK = 0xd4943a;

const FERAL_CAT_BODY = 0x5a4232;
const FERAL_CAT_BELLY = 0x7c5e44;

const SEWER_FISH_BODY = 0x3a4a2e;
const SEWER_FISH_FIN = 0x2a3a20;

const STREET_DOG_BODY = 0x8a6a48;
const STREET_DOG_DARK = 0x5a4030;

const GOOSE_BODY = 0xe8e4dc;
const GOOSE_NECK = 0x141008;
const GOOSE_BEAK = 0xd4943a;

const BOSS_BEAR_BODY = 0x2a1c14;
const BOSS_BEAR_BELLY = 0x4a3a2c;
const BOSS_MUTANT_BODY = 0x4a6a3a;
const BOSS_MUTANT_GLOW = 0xa8d04a;
const BOSS_KING_BODY = 0x6b6b6b;
const BOSS_KING_CROWN = 0xd4943a;

const VERMIN_DEFAULT = 0x2c1f15;

const drawShadow = (g: PixiGraphics, x: number, y: number, hw: number, hh: number) => {
  g.ellipse(x, y + hh * 0.6, hw * 0.95, hh * 0.22).fill(SHADOW);
};

const drawRat = (g: PixiGraphics, v: { x: number; y: number; width: number; height: number }) => {
  const { x, y, width: w, height: h } = v;
  const hw = w / 2;
  const hh = h / 2;
  drawShadow(g, x, y, hw, hh);
  // Tail (curl behind)
  g.moveTo(x - hw * 0.95, y + hh * 0.1)
    .quadraticCurveTo(x - hw * 1.5, y + hh * 0.4, x - hw * 1.3, y - hh * 0.1)
    .stroke({ color: RAT_TAIL, width: 1.4 });
  // Body — egg-shaped, slightly stretched
  g.ellipse(x, y, hw, hh * 0.85).fill(RAT_BODY);
  // Belly highlight
  g.ellipse(x + hw * 0.1, y + hh * 0.2, hw * 0.7, hh * 0.4).fill(RAT_BELLY);
  // Snout point
  g.moveTo(x + hw * 0.85, y - hh * 0.05)
    .lineTo(x + hw * 1.15, y)
    .lineTo(x + hw * 0.85, y + hh * 0.15)
    .closePath()
    .fill(RAT_BODY);
  // Ears (two small triangles)
  g.circle(x + hw * 0.4, y - hh * 0.65, hh * 0.18).fill(RAT_BODY);
  g.circle(x + hw * 0.65, y - hh * 0.55, hh * 0.16).fill(RAT_BODY);
  // Eye
  g.circle(x + hw * 0.65, y - hh * 0.15, 1.6).fill(EYE_DARK);
  g.circle(x + hw * 0.7, y - hh * 0.18, 0.8).fill(EYE_GLINT);
};

const drawRoach = (g: PixiGraphics, v: { x: number; y: number; width: number; height: number }) => {
  const { x, y, width: w, height: h } = v;
  const hw = w / 2;
  const hh = h / 2;
  drawShadow(g, x, y, hw, hh);
  // Six legs: three each side, splayed
  for (const i of [-1, 0, 1]) {
    const lx = x + i * hw * 0.5;
    g.moveTo(lx, y + hh * 0.3)
      .lineTo(lx - hw * 0.5, y + hh * 0.85)
      .stroke({ color: ROACH_LEG, width: 1 });
    g.moveTo(lx, y + hh * 0.3)
      .lineTo(lx + hw * 0.5, y + hh * 0.85)
      .stroke({ color: ROACH_LEG, width: 1 });
  }
  // Body — flatter ellipse
  g.ellipse(x, y, hw * 1.05, hh * 0.7).fill(ROACH_BODY);
  // Shell highlight (sheen)
  g.ellipse(x - hw * 0.1, y - hh * 0.1, hw * 0.7, hh * 0.3).fill(ROACH_SHELL);
  // Antennae (two long curves forward)
  g.moveTo(x + hw * 0.5, y - hh * 0.4)
    .quadraticCurveTo(x + hw * 1.2, y - hh * 0.9, x + hw * 1.5, y - hh * 0.7)
    .stroke({ color: ROACH_LEG, width: 1 });
  g.moveTo(x + hw * 0.5, y - hh * 0.3)
    .quadraticCurveTo(x + hw * 1.2, y - hh * 0.4, x + hw * 1.6, y - hh * 0.2)
    .stroke({ color: ROACH_LEG, width: 1 });
};

const drawPigeon = (
  g: PixiGraphics,
  v: { x: number; y: number; width: number; height: number },
) => {
  const { x, y, width: w, height: h } = v;
  const hw = w / 2;
  const hh = h / 2;
  drawShadow(g, x, y, hw, hh);
  // Body
  g.ellipse(x, y, hw, hh * 0.85).fill(PIGEON_BODY);
  // Wing flap (a triangular wedge that pops up over the body)
  g.moveTo(x - hw * 0.2, y - hh * 0.1)
    .lineTo(x - hw * 0.85, y - hh * 0.6)
    .lineTo(x + hw * 0.05, y - hh * 0.4)
    .closePath()
    .fill(PIGEON_WING);
  // Head ball
  g.circle(x + hw * 0.7, y - hh * 0.3, hh * 0.32).fill(PIGEON_HEAD);
  // Beak
  g.moveTo(x + hw * 0.95, y - hh * 0.3)
    .lineTo(x + hw * 1.2, y - hh * 0.25)
    .lineTo(x + hw * 0.95, y - hh * 0.18)
    .closePath()
    .fill(PIGEON_BEAK);
  // Eye
  g.circle(x + hw * 0.78, y - hh * 0.4, 1.2).fill(EYE_DARK);
  g.circle(x + hw * 0.8, y - hh * 0.43, 0.5).fill(EYE_GLINT);
};

const drawRaccoon = (
  g: PixiGraphics,
  v: { x: number; y: number; width: number; height: number },
) => {
  const { x, y, width: w, height: h } = v;
  const hw = w / 2;
  const hh = h / 2;
  drawShadow(g, x, y, hw, hh);
  // Striped tail
  g.ellipse(x - hw * 1.1, y + hh * 0.1, hw * 0.4, hh * 0.25).fill(RACCOON_BODY);
  g.ellipse(x - hw * 1.1, y + hh * 0.1, hw * 0.3, hh * 0.18).fill(RACCOON_RING);
  // Body
  g.ellipse(x, y, hw, hh * 0.9).fill(RACCOON_BODY);
  // Mask
  g.ellipse(x + hw * 0.5, y - hh * 0.2, hw * 0.45, hh * 0.2).fill(RACCOON_MASK);
  // Eyes peek through mask
  g.circle(x + hw * 0.4, y - hh * 0.2, 1.2).fill(EYE_GLINT);
  g.circle(x + hw * 0.65, y - hh * 0.2, 1.2).fill(EYE_GLINT);
  // Snout
  g.circle(x + hw * 0.85, y, hh * 0.18).fill(RACCOON_BODY);
};

const drawSeagull = (
  g: PixiGraphics,
  v: { x: number; y: number; width: number; height: number },
) => {
  const { x, y, width: w, height: h } = v;
  const hw = w / 2;
  const hh = h / 2;
  drawShadow(g, x, y, hw, hh);
  // Wide M-shape wings
  g.moveTo(x - hw * 1.1, y)
    .quadraticCurveTo(x - hw * 0.5, y - hh * 0.7, x, y - hh * 0.1)
    .quadraticCurveTo(x + hw * 0.5, y - hh * 0.7, x + hw * 1.1, y)
    .stroke({ color: SEAGULL_WING, width: 2.4 });
  // Body
  g.ellipse(x, y + hh * 0.05, hw * 0.6, hh * 0.5).fill(SEAGULL_BODY);
  // Head + beak
  g.circle(x + hw * 0.5, y - hh * 0.1, hh * 0.25).fill(SEAGULL_BODY);
  g.moveTo(x + hw * 0.7, y - hh * 0.1)
    .lineTo(x + hw * 1.0, y - hh * 0.05)
    .lineTo(x + hw * 0.7, y)
    .closePath()
    .fill(SEAGULL_BEAK);
};

const drawFeralCat = (
  g: PixiGraphics,
  v: { x: number; y: number; width: number; height: number },
) => {
  const { x, y, width: w, height: h } = v;
  const hw = w / 2;
  const hh = h / 2;
  drawShadow(g, x, y, hw, hh);
  // Tail (long, S-curved)
  g.moveTo(x - hw * 0.9, y)
    .quadraticCurveTo(x - hw * 1.5, y - hh * 0.5, x - hw * 1.2, y - hh)
    .stroke({ color: FERAL_CAT_BODY, width: 2.2 });
  // Body
  g.ellipse(x, y, hw, hh * 0.75).fill(FERAL_CAT_BODY);
  // Belly
  g.ellipse(x, y + hh * 0.2, hw * 0.7, hh * 0.4).fill(FERAL_CAT_BELLY);
  // Head
  g.circle(x + hw * 0.7, y - hh * 0.3, hh * 0.45).fill(FERAL_CAT_BODY);
  // Pointed ears
  g.moveTo(x + hw * 0.5, y - hh * 0.7)
    .lineTo(x + hw * 0.55, y - hh * 1.05)
    .lineTo(x + hw * 0.7, y - hh * 0.65)
    .closePath()
    .fill(FERAL_CAT_BODY);
  g.moveTo(x + hw * 0.85, y - hh * 0.65)
    .lineTo(x + hw * 0.95, y - hh * 1.0)
    .lineTo(x + hw * 1.05, y - hh * 0.55)
    .closePath()
    .fill(FERAL_CAT_BODY);
  // Eyes (slit yellow)
  g.circle(x + hw * 0.55, y - hh * 0.35, 1.3).fill(EYE_GLINT);
  g.circle(x + hw * 0.85, y - hh * 0.35, 1.3).fill(EYE_GLINT);
};

const drawSewerFish = (
  g: PixiGraphics,
  v: { x: number; y: number; width: number; height: number },
) => {
  const { x, y, width: w, height: h } = v;
  const hw = w / 2;
  const hh = h / 2;
  drawShadow(g, x, y, hw, hh);
  // Body — torpedo
  g.ellipse(x, y, hw, hh * 0.5).fill(SEWER_FISH_BODY);
  // Tail fin (forked)
  g.moveTo(x - hw * 0.95, y)
    .lineTo(x - hw * 1.35, y - hh * 0.4)
    .lineTo(x - hw * 1.1, y)
    .lineTo(x - hw * 1.35, y + hh * 0.4)
    .closePath()
    .fill(SEWER_FISH_FIN);
  // Top fin
  g.moveTo(x - hw * 0.3, y - hh * 0.5)
    .lineTo(x, y - hh * 0.9)
    .lineTo(x + hw * 0.3, y - hh * 0.5)
    .closePath()
    .fill(SEWER_FISH_FIN);
  // Eye
  g.circle(x + hw * 0.6, y - hh * 0.15, 1.6).fill(EYE_DARK);
  g.circle(x + hw * 0.65, y - hh * 0.18, 0.7).fill(EYE_GLINT);
};

const drawStreetDog = (
  g: PixiGraphics,
  v: { x: number; y: number; width: number; height: number },
) => {
  const { x, y, width: w, height: h } = v;
  const hw = w / 2;
  const hh = h / 2;
  drawShadow(g, x, y, hw, hh);
  // Legs
  g.rect(x - hw * 0.6, y + hh * 0.2, 2, hh * 0.6).fill(STREET_DOG_DARK);
  g.rect(x + hw * 0.4, y + hh * 0.2, 2, hh * 0.6).fill(STREET_DOG_DARK);
  // Body — chunky
  g.roundRect(x - hw, y - hh * 0.4, w, hh * 0.85, 4).fill(STREET_DOG_BODY);
  // Head
  g.roundRect(x + hw * 0.5, y - hh * 0.6, hw * 0.6, hh * 0.7, 3).fill(STREET_DOG_BODY);
  // Ear (flopped)
  g.moveTo(x + hw * 0.6, y - hh * 0.6)
    .lineTo(x + hw * 0.4, y - hh * 0.85)
    .lineTo(x + hw * 0.7, y - hh * 0.4)
    .closePath()
    .fill(STREET_DOG_DARK);
  // Snout
  g.rect(x + hw * 1.0, y - hh * 0.2, hw * 0.3, hh * 0.3).fill(STREET_DOG_BODY);
  // Eye + bared teeth glint
  g.circle(x + hw * 0.85, y - hh * 0.35, 1.4).fill(EYE_GLINT);
};

const drawGoose = (g: PixiGraphics, v: { x: number; y: number; width: number; height: number }) => {
  const { x, y, width: w, height: h } = v;
  const hw = w / 2;
  const hh = h / 2;
  drawShadow(g, x, y, hw, hh);
  // Body
  g.ellipse(x, y, hw, hh * 0.85).fill(GOOSE_BODY);
  // Long S-neck
  g.moveTo(x + hw * 0.6, y - hh * 0.3)
    .quadraticCurveTo(x + hw * 1.1, y - hh * 0.9, x + hw * 1.0, y - hh * 1.3)
    .stroke({ color: GOOSE_BODY, width: 4 });
  // Black head
  g.circle(x + hw * 1.0, y - hh * 1.35, hh * 0.25).fill(GOOSE_NECK);
  // Beak
  g.moveTo(x + hw * 1.2, y - hh * 1.35)
    .lineTo(x + hw * 1.45, y - hh * 1.3)
    .lineTo(x + hw * 1.2, y - hh * 1.25)
    .closePath()
    .fill(GOOSE_BEAK);
};

const drawBossBear = (
  g: PixiGraphics,
  v: { x: number; y: number; width: number; height: number },
) => {
  const { x, y, width: w, height: h } = v;
  const hw = w / 2;
  const hh = h / 2;
  drawShadow(g, x, y, hw, hh);
  g.ellipse(x, y, hw * 1.1, hh).fill(BOSS_BEAR_BODY);
  g.ellipse(x, y + hh * 0.2, hw * 0.7, hh * 0.5).fill(BOSS_BEAR_BELLY);
  g.circle(x + hw * 0.7, y - hh * 0.5, hh * 0.45).fill(BOSS_BEAR_BODY);
  g.circle(x + hw * 0.45, y - hh * 0.85, hh * 0.18).fill(BOSS_BEAR_BODY);
  g.circle(x + hw * 0.95, y - hh * 0.85, hh * 0.18).fill(BOSS_BEAR_BODY);
  g.circle(x + hw * 0.6, y - hh * 0.45, 2).fill(EYE_GLINT);
  g.circle(x + hw * 0.85, y - hh * 0.45, 2).fill(EYE_GLINT);
};

const drawBossMutant = (
  g: PixiGraphics,
  v: { x: number; y: number; width: number; height: number },
) => {
  const { x, y, width: w, height: h } = v;
  const hw = w / 2;
  const hh = h / 2;
  drawShadow(g, x, y, hw, hh);
  g.ellipse(x, y, hw * 1.2, hh * 0.9).fill(BOSS_MUTANT_BODY);
  // Bioluminescent spots
  const spots: ReadonlyArray<readonly [number, number]> = [
    [-0.5, -0.3],
    [0.2, -0.4],
    [0.6, 0.1],
    [-0.3, 0.3],
  ];
  for (const [ox, oy] of spots) {
    g.circle(x + hw * ox, y + hh * oy, 2.5).fill({ color: BOSS_MUTANT_GLOW, alpha: 0.85 });
  }
  // Top fin (jagged)
  g.moveTo(x - hw * 0.5, y - hh * 0.7)
    .lineTo(x - hw * 0.2, y - hh * 1.2)
    .lineTo(x, y - hh * 0.6)
    .lineTo(x + hw * 0.3, y - hh * 1.1)
    .lineTo(x + hw * 0.5, y - hh * 0.7)
    .closePath()
    .fill(BOSS_MUTANT_BODY);
  g.circle(x + hw * 0.7, y - hh * 0.2, 3).fill(BOSS_MUTANT_GLOW);
};

const drawBossKing = (
  g: PixiGraphics,
  v: { x: number; y: number; width: number; height: number },
) => {
  const { x, y, width: w, height: h } = v;
  const hw = w / 2;
  const hh = h / 2;
  drawShadow(g, x, y, hw, hh);
  // Body
  g.ellipse(x, y, hw * 1.1, hh).fill(BOSS_KING_BODY);
  // Wings spread
  g.moveTo(x - hw * 0.3, y)
    .lineTo(x - hw * 1.4, y - hh * 0.6)
    .lineTo(x - hw * 0.2, y - hh * 0.3)
    .closePath()
    .fill(0x4d4d4d);
  g.moveTo(x + hw * 0.3, y)
    .lineTo(x + hw * 1.4, y - hh * 0.6)
    .lineTo(x + hw * 0.2, y - hh * 0.3)
    .closePath()
    .fill(0x4d4d4d);
  // Head
  g.circle(x, y - hh * 0.6, hh * 0.4).fill(0x5a5a5a);
  // Crown (3 spikes)
  for (const i of [-1, 0, 1]) {
    g.moveTo(x + i * hh * 0.25, y - hh * 0.95)
      .lineTo(x + i * hh * 0.25, y - hh * 1.4)
      .lineTo(x + i * hh * 0.25 + 4, y - hh * 1.1)
      .closePath()
      .fill(BOSS_KING_CROWN);
  }
  // Eyes glow
  g.circle(x - hh * 0.15, y - hh * 0.6, 1.6).fill(BOSS_KING_CROWN);
  g.circle(x + hh * 0.15, y - hh * 0.6, 1.6).fill(BOSS_KING_CROWN);
};

const DRAWERS: Record<
  string,
  (g: PixiGraphics, v: { x: number; y: number; width: number; height: number }) => void
> = {
  rat: drawRat,
  roach: drawRoach,
  pigeon: drawPigeon,
  raccoon: drawRaccoon,
  seagull: drawSeagull,
  "feral-cat": drawFeralCat,
  "sewer-fish": drawSewerFish,
  "street-dog": drawStreetDog,
  goose: drawGoose,
  "boss-dumpster-bear": drawBossBear,
  "boss-river-mutant": drawBossMutant,
  "boss-pigeon-king": drawBossKing,
};

const drawDefault = (
  g: PixiGraphics,
  v: { x: number; y: number; width: number; height: number },
) => {
  const { x, y, width: w, height: h } = v;
  drawShadow(g, x, y, w / 2, h / 2);
  g.ellipse(x, y, w / 2, h / 2).fill(VERMIN_DEFAULT);
};

/**
 * Idle/walk modulator. Returns a (dx, dy, tailPhase) per vermin per
 * frame so drawers can apply a breathing offset + tail/wing/antenna
 * waggle. Keeps the actual draw functions deterministic; animation is
 * a transform applied at draw time.
 */
function idleModulator(archetypeId: string, x: number, now: number): {
  bobY: number;
  wiggle: number;
} {
  // Use position + clock for phase so neighbouring vermin animate out
  // of phase. Per-archetype amplitude + frequency.
  let amp = 1;
  let freq = 6;
  switch (archetypeId) {
    case "rat":
    case "raccoon":
    case "feral-cat":
    case "street-dog":
      amp = 1;
      freq = 7;
      break;
    case "roach":
      amp = 0.6;
      freq = 14; // antennae buzz fast
      break;
    case "pigeon":
    case "seagull":
    case "goose":
    case "boss-pigeon-king":
      amp = 1.6;
      freq = 9; // wing-beat
      break;
    case "sewer-fish":
      amp = 1.2;
      freq = 5; // gill flutter
      break;
    case "boss-dumpster-bear":
    case "boss-river-mutant":
      amp = 2.2;
      freq = 3.5;
      break;
  }
  const phase = now * freq + x * 0.1;
  return {
    bobY: Math.sin(phase) * amp,
    wiggle: Math.sin(phase * 1.7) * 0.5,
  };
}

export function VerminLayer() {
  const vermin = useGameStore((s) => s.vermin);
  const now = useGameStore((s) => s.now);
  const reducedMotion = useGameStore((s) => s.settings.reducedMotion);

  const draw = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      for (const v of vermin) {
        const drawer = DRAWERS[v.archetypeId] ?? drawDefault;
        if (reducedMotion) {
          drawer(g, v);
          continue;
        }
        const m = idleModulator(v.archetypeId, v.x, now);
        // Apply a tiny bob + a horizontal wiggle to the draw position.
        // The drawers operate on (x, y) so substituting the offset is
        // safe without rewriting any drawer.
        drawer(g, { ...v, x: v.x + m.wiggle, y: v.y + m.bobY });
      }
    },
    [vermin, now, reducedMotion],
  );

  return <pixiGraphics draw={draw} />;
}
