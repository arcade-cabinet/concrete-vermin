import type { Graphics as PixiGraphics } from "pixi.js";
import { useCallback } from "react";
import { useGameStore } from "../runtime/store";

interface SplashPalette {
  core: number;
  ring: number;
  fleck: number;
}

const DEFAULT_PALETTE: SplashPalette = { core: 0xfff0c8, ring: 0xd4943a, fleck: 0x7a2818 };

const PALETTES: Record<string, SplashPalette> = {
  // Mammals — brick + brown blood
  rat: { core: 0xc23a28, ring: 0x7a2818, fleck: 0x3a1810 },
  raccoon: { core: 0xa83828, ring: 0x6a2618, fleck: 0x301008 },
  "feral-cat": { core: 0xb83828, ring: 0x7a2818, fleck: 0x3a1810 },
  "street-dog": { core: 0xb24028, ring: 0x6e2818, fleck: 0x3a1408 },
  // Roach — tar + amber goo
  roach: { core: 0xd49b3a, ring: 0x6a4018, fleck: 0x1a0f08 },
  // Birds — pale + grey ash
  pigeon: { core: 0xe8e4dc, ring: 0x6b6b6b, fleck: 0x2a2a2a },
  seagull: { core: 0xfff0c8, ring: 0x9c9890, fleck: 0x4a4a40 },
  goose: { core: 0xfff0c8, ring: 0x141008, fleck: 0xd4943a },
  // Sewer fish — algal green + slime
  "sewer-fish": { core: 0xa8d04a, ring: 0x3a4a2e, fleck: 0x1a2a18 },
  // Bosses — saturated, distinctive
  "boss-dumpster-bear": { core: 0xc23a28, ring: 0x4a3a2c, fleck: 0x2a1c14 },
  "boss-river-mutant": { core: 0xa8d04a, ring: 0x4a6a3a, fleck: 0xfff0c8 },
  "boss-pigeon-king": { core: 0xd4943a, ring: 0x4d4d4d, fleck: 0x141008 },
};

export function SplashLayer() {
  const splashes = useGameStore((s) => s.splashes);

  const draw = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      for (const s of splashes) {
        const palette = PALETTES[s.archetypeId] ?? DEFAULT_PALETTE;
        const t = Math.min(1, s.ageS / Math.max(0.001, s.ttlS));
        const r = 4 + 16 * t;
        // Two-phase fade: blooms in over first 12 % of life (so frame 1
        // isn't a single-frame pop at full opacity), then linearly
        // fades the remainder. Sharp peak at the bloom point reads as
        // an impact, not a glitch.
        const PEAK = 0.12;
        const alpha = t < PEAK ? t / PEAK : 1 - (t - PEAK) / (1 - PEAK);
        // Outer ring
        g.circle(s.x, s.y, r).stroke({ color: palette.ring, width: 2, alpha });
        // Bright core
        g.circle(s.x, s.y, r * 0.4).fill({ color: palette.core, alpha: alpha * 0.8 });
        // Six radial flecks (arterial spray, pulpy)
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2 + t * 0.5;
          const flickR = r * (0.7 + (0.3 * ((i * 7) % 3)) / 3);
          const fx = s.x + Math.cos(angle) * flickR;
          const fy = s.y + Math.sin(angle) * flickR;
          g.circle(fx, fy, 1.4 * (1 - t * 0.6)).fill({
            color: palette.fleck,
            alpha: alpha * 0.9,
          });
        }
      }
    },
    [splashes],
  );

  return <pixiGraphics draw={draw} />;
}
