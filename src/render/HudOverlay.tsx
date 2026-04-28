import type { Text as PixiText } from "pixi.js";
import { useGameStore } from "../runtime/store";
import { COLOR, pixi } from "../theme/colors";

const SODIUM = pixi(COLOR.sodium);
const CREAM = pixi(COLOR.cream);
const BRICK = pixi(COLOR.brick);
const TTL_S = 0.4;
const RISE_PX = 24;

/**
 * Floating "+N" damage numbers, one per CollideEvent. Lifts 24 px,
 * fades out over 400 ms. Crit + headshot get a brighter cream tint
 * and a larger font.
 *
 * One Text node per visible event per frame — at typical pellet rates
 * (~10-20 active at once) Pixi handles this fine without pooling.
 * Reduced-motion hides the layer entirely (no rise, no fade — silent).
 */
export function HudOverlay() {
  const damageEvents = useGameStore((s) => s.damageEvents);
  const now = useGameStore((s) => s.now);
  const reducedMotion = useGameStore((s) => s.settings.reducedMotion);

  return (
    <pixiContainer>
      {!reducedMotion &&
        damageEvents.map((e) => {
          const age = Math.max(0, now - e.at);
          if (age >= TTL_S) return null;
          const t = age / TTL_S;
          const alpha = 1 - t;
          const yOffset = -RISE_PX * t;
          const baseSize = e.crit ? 14 : e.headshot ? 12 : 10;
          const color = e.crit ? CREAM : e.headshot ? SODIUM : BRICK;
          const drawText = makeDrawText(e.amount, color, baseSize);
          // Stable identity per event: time + position rarely collide.
          const key = `${e.at.toFixed(4)}:${e.x.toFixed(1)}:${e.y.toFixed(1)}:${e.amount}`;
          return (
            <pixiText
              key={key}
              x={e.x}
              y={e.y + yOffset}
              alpha={alpha}
              anchor={0.5}
              text={`+${e.amount}`}
              style={{
                fontFamily: "Big Shoulders Display, sans-serif",
                fontSize: baseSize,
                fontWeight: "700",
                fill: color,
              }}
              ref={drawText}
            />
          );
        })}
    </pixiContainer>
  );
}

// pixi-react's Text doesn't always honor the latest size on rerender;
// touching the underlying instance once after mount keeps the color
// in sync (color/fill is a string-typed style on pixi.js v8 Text).
function makeDrawText(_amount: number, _color: number, _size: number) {
  return (_t: PixiText | null) => {
    /* no-op — style prop above is sufficient on pixi.js v8 */
  };
}
