import { Application, useTick } from "@pixi/react";
import { useEffect, useRef, useState } from "react";
import "../render/extend";
import { CRTOverlay } from "../render/CRTOverlay";
import { MuzzleFlashLayer } from "../render/MuzzleFlashLayer";
import { ProjectileLayer } from "../render/ProjectileLayer";
import { ReticleLayer } from "../render/ReticleLayer";
import { SplashLayer } from "../render/SplashLayer";
import { Stage } from "../render/Stage";
import { VerminLayer } from "../render/VerminLayer";
import { GameRunner } from "../runtime/runner";
import { useGameStore } from "../runtime/store";
import { COLOR } from "../theme/tokens";
import { useScreenShake } from "./hooks/useScreenShake";
import { LoadingSplash } from "./LoadingSplash";

const STAGE_W = 480;
const STAGE_H = 270;
const KILLS_REQUIRED = 8;
const RETICLE_KEY_SPEED_PX = 220; // sim units per second when held
const LONG_PRESS_MS = 350; // hold past this on press → reload, not fire

// Pixi resolution cap. On retina mobile (dpr 3+), full-resolution
// rasterization is needlessly expensive — capping at 2 saves ~40% GPU
// work without a visible quality drop on a < 7" screen. Caller must
// only read this once at mount; live-changing resolution requires a
// renderer rebuild.
const MAX_PIXI_RESOLUTION = 2;
function clampedResolution(): number {
  if (typeof window === "undefined") return 1;
  return Math.min(window.devicePixelRatio || 1, MAX_PIXI_RESOLUTION);
}

function Loop({ runner, onReady }: { runner: GameRunner; onReady: () => void }) {
  const firedRef = useRef(false);
  useTick(({ deltaTime }) => {
    if (!firedRef.current) {
      firedRef.current = true;
      onReady();
    }
    runner.step(deltaTime / 60);
  });
  return null;
}

export function GameStage() {
  const runnerRef = useRef<GameRunner | null>(null);
  const phase = useGameStore((s) => s.phase);
  const setReticle = useGameStore((s) => s.setReticle);
  const reticle = useGameStore((s) => s.reticle);
  const crtOn = useGameStore((s) => s.settings.crtOverlay);
  const shake = useScreenShake();
  const [pixiReady, setPixiReady] = useState(false);

  // Reset the splash visibility every time the player re-enters the
  // playing phase (next mission, restart). The Application unmounts +
  // remounts on phase flip via the conditional render in App.
  useEffect(() => {
    if (phase !== "playing") setPixiReady(false);
  }, [phase]);
  // Pixi resolution is fixed for the lifetime of the Application; reading
  // window once at mount is correct (live-changing it would require
  // tearing down the renderer).
  const resolutionRef = useRef<number>(0);
  if (resolutionRef.current === 0) resolutionRef.current = clampedResolution();
  const resolution = resolutionRef.current;

  // Pointer state for drag-to-aim + long-press detection.
  const pointerDownAt = useRef<number | null>(null);
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);
  const pointerMoved = useRef(false);
  const longPressTimer = useRef<number | null>(null);
  const lastReticleRef = useRef(reticle);
  lastReticleRef.current = reticle;

  // Keyboard reticle motion — held arrow keys move the reticle each frame.
  const keysHeld = useRef({ up: false, down: false, left: false, right: false });

  useEffect(() => {
    if (phase === "playing" && !runnerRef.current) {
      const r = new GameRunner(Date.now() & 0x7fffffff);
      r.startTutorialMission(KILLS_REQUIRED);
      runnerRef.current = r;
    }
    if (phase === "briefing" && runnerRef.current) {
      runnerRef.current = null;
    }
  }, [phase]);

  // Keyboard handlers — arrows aim, space fires, R reloads.
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (phase !== "playing") return;
      switch (e.key) {
        case "ArrowUp":
          keysHeld.current.up = true;
          e.preventDefault();
          break;
        case "ArrowDown":
          keysHeld.current.down = true;
          e.preventDefault();
          break;
        case "ArrowLeft":
          keysHeld.current.left = true;
          e.preventDefault();
          break;
        case "ArrowRight":
          keysHeld.current.right = true;
          e.preventDefault();
          break;
        case " ":
        case "Enter":
          runnerRef.current?.queueShot(lastReticleRef.current.x, lastReticleRef.current.y);
          e.preventDefault();
          break;
        case "r":
        case "R":
          runnerRef.current?.queueReload();
          e.preventDefault();
          break;
      }
    };
    const onUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
          keysHeld.current.up = false;
          break;
        case "ArrowDown":
          keysHeld.current.down = false;
          break;
        case "ArrowLeft":
          keysHeld.current.left = false;
          break;
        case "ArrowRight":
          keysHeld.current.right = false;
          break;
      }
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [phase]);

  // Per-frame keyboard reticle integration via rAF.
  useEffect(() => {
    if (phase !== "playing") return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const k = keysHeld.current;
      if (k.up || k.down || k.left || k.right) {
        const r = lastReticleRef.current;
        const dx = (k.right ? 1 : 0) - (k.left ? 1 : 0);
        const dy = (k.down ? 1 : 0) - (k.up ? 1 : 0);
        const nx = Math.max(0, Math.min(STAGE_W, r.x + dx * RETICLE_KEY_SPEED_PX * dt));
        const ny = Math.max(0, Math.min(STAGE_H, r.y + dy * RETICLE_KEY_SPEED_PX * dt));
        setReticle(nx, ny);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, setReticle]);

  function clientToStage(e: { clientX: number; clientY: number }, target: HTMLElement) {
    const rect = target.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * (STAGE_W / rect.width);
    const sy = (e.clientY - rect.top) * (STAGE_H / rect.height);
    return { x: sx, y: sy };
  }

  function clearLongPress() {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const p = clientToStage(e, e.currentTarget);
    setReticle(p.x, p.y);
    if (pointerDownPos.current) {
      const dx = p.x - pointerDownPos.current.x;
      const dy = p.y - pointerDownPos.current.y;
      // Movement threshold: dragging cancels the long-press-reload intent.
      if (Math.hypot(dx, dy) > 6) {
        pointerMoved.current = true;
        clearLongPress();
      }
    }
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const p = clientToStage(e, e.currentTarget);
    setReticle(p.x, p.y);
    pointerDownAt.current = performance.now();
    pointerDownPos.current = p;
    pointerMoved.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
    // Long-press → reload. Any drag cancels via clearLongPress in onPointerMove.
    clearLongPress();
    longPressTimer.current = window.setTimeout(() => {
      if (!pointerMoved.current) {
        runnerRef.current?.queueReload();
        // Mark as consumed so onPointerUp doesn't also fire.
        pointerDownAt.current = null;
      }
    }, LONG_PRESS_MS);
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    clearLongPress();
    const downAt = pointerDownAt.current;
    pointerDownAt.current = null;
    pointerDownPos.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (downAt === null) return; // long-press already fired
    const heldMs = performance.now() - downAt;
    if (heldMs >= LONG_PRESS_MS) return; // safety
    // Short press → fire at the current reticle (which the drag updated).
    const p = clientToStage(e, e.currentTarget);
    runnerRef.current?.queueShot(p.x, p.y);
  }

  function onPointerCancel() {
    clearLongPress();
    pointerDownAt.current = null;
    pointerDownPos.current = null;
  }

  return (
    <div
      data-testid="game-stage"
      // role + aria-label so a screen reader announces the canvas as
      // an interactive image with input affordances. The actual game
      // state is narrated through HUD's aria-live region (per design).
      role="img"
      aria-label="Game canvas — drag to aim, tap to fire, R to reload"
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: COLOR.bgAsphalt,
        touchAction: "none",
        userSelect: "none",
        WebkitTouchCallout: "none",
      }}
      onPointerMove={onPointerMove}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <div
        style={{
          width: "min(100vw, 96vh)",
          aspectRatio: `${STAGE_W} / ${STAGE_H}`,
          position: "relative",
          // Screen-shake offset: <= 4 CSS px, decays over 80ms. Reduced-
          // motion short-circuits to (0, 0) so this is a no-op there.
          transform: `translate(${shake.dx}px, ${shake.dy}px)`,
        }}
      >
        <Application
          width={STAGE_W}
          height={STAGE_H}
          background={0x0d0c0a}
          autoDensity={true}
          resolution={resolution}
        >
          <Stage />
          <VerminLayer />
          <ProjectileLayer />
          <MuzzleFlashLayer />
          <SplashLayer />
          <ReticleLayer />
          {crtOn ? <CRTOverlay /> : null}
          {runnerRef.current ? (
            <Loop runner={runnerRef.current} onReady={() => setPixiReady(true)} />
          ) : null}
        </Application>
        {!pixiReady ? <LoadingSplash message="Loading mission…" /> : null}
      </div>
    </div>
  );
}
