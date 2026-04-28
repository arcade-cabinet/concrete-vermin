import { Application, useTick } from "@pixi/react";
import { useEffect, useRef, useState } from "react";
import "../render/extend";
import { CRTOverlay } from "../render/CRTOverlay";
import { HudOverlay } from "../render/HudOverlay";
import { MuzzleFlashLayer } from "../render/MuzzleFlashLayer";
import { ProjectileLayer } from "../render/ProjectileLayer";
import { ReticleLayer } from "../render/ReticleLayer";
import { SplashLayer } from "../render/SplashLayer";
import { Stage } from "../render/Stage";
import { VerminLayer } from "../render/VerminLayer";
import { applyAimAssist } from "../input/aimAssist";
import { installGamepad } from "../input/gamepad";
import { installAppLifecycle } from "../platform/lifecycle";
import { GameRunner } from "../runtime/runner";
import { useGameStore } from "../runtime/store";
import { getMission } from "../sim/content/missions";
import { COLOR } from "../theme/tokens";
import { useScreenShake } from "./hooks/useScreenShake";
import { LoadingSplash } from "./LoadingSplash";
import { usePlayerProgress } from "./PlayerProgress";

const STAGE_W = 480;
const STAGE_H = 270;
const RETICLE_KEY_SPEED_PX = 220; // sim units per second when held

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
  const aimAssistOn = useGameStore((s) => s.settings.aimAssist);
  const invertY = useGameStore((s) => s.settings.invertY);
  const shake = useScreenShake();
  const [pixiReady, setPixiReady] = useState(false);
  // Live ref so closures (timers, gamepad poll, pointer handlers)
  // always read the current settings without re-installing.
  const aimAssistRef = useRef(aimAssistOn);
  aimAssistRef.current = aimAssistOn;

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

  // Reticle ref so closures (timers, gamepad poll) read current value.
  const lastReticleRef = useRef(reticle);
  lastReticleRef.current = reticle;

  // Keyboard reticle motion — held arrow keys move the reticle each frame.
  const keysHeld = useRef({ up: false, down: false, left: false, right: false });

  useEffect(() => {
    if (phase === "playing" && !runnerRef.current) {
      const missionId = useGameStore.getState().missionId || "streets-01-bodega";
      const mission = (() => {
        try {
          return getMission(missionId);
        } catch {
          return getMission("streets-01-bodega");
        }
      })();
      const activeMods = usePlayerProgress.getState().activeMods;
      runnerRef.current = new GameRunner(mission, activeMods);
    }
    if (phase === "briefing" && runnerRef.current) {
      runnerRef.current = null;
    }
  }, [phase]);

  // OS-level pause/resume: when the player backgrounds the app the
  // runner has to stop ticking — otherwise the simulation eats battery
  // and (worse) the player loses progress to off-screen contact damage.
  // Subscribes via installAppLifecycle (Capacitor App + visibilitychange).
  useEffect(() => {
    if (phase !== "playing") return;
    const teardown = installAppLifecycle({
      onPause: () => runnerRef.current?.pause(),
      onResume: () => runnerRef.current?.resume(),
    });
    return teardown;
  }, [phase]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: fireWithAssist closes over stable refs (runnerRef + aimAssistRef)
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
          fireWithAssist(lastReticleRef.current.x, lastReticleRef.current.y);
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

  // Gamepad: poll connected pads each frame, map standard layout to
  // game actions. Installed only while playing so an attached pad
  // doesn't fire shots while the briefing is up.
  // biome-ignore lint/correctness/useExhaustiveDependencies: fireWithAssist closes over stable refs (runnerRef + aimAssistRef)
  useEffect(() => {
    if (phase !== "playing") return;
    const reticleRef = lastReticleRef;
    const speedPxPerS = RETICLE_KEY_SPEED_PX;
    let lastTick = performance.now();
    const uninstall = installGamepad(
      {
        onAim: (dx, dy) => {
          const now = performance.now();
          const dt = (now - lastTick) / 1000;
          lastTick = now;
          if (dx === 0 && dy === 0) return;
          const r = reticleRef.current;
          const nx = Math.max(0, Math.min(STAGE_W, r.x + dx * speedPxPerS * dt));
          const ny = Math.max(0, Math.min(STAGE_H, r.y + dy * speedPxPerS * dt));
          setReticle(nx, ny);
        },
        onFire: () => {
          fireWithAssist(reticleRef.current.x, reticleRef.current.y);
        },
        onReload: () => {
          runnerRef.current?.queueReload();
        },
        onPause: () => {
          const isPaused = runnerRef.current?.isPaused() ?? false;
          if (isPaused) runnerRef.current?.resume();
          else runnerRef.current?.pause();
        },
      },
      { invertY },
    );
    return uninstall;
  }, [phase, invertY, setReticle]);

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

  function fireWithAssist(x: number, y: number) {
    const r = runnerRef.current;
    if (!r) return;
    // The tap-to-fire model uses the reticle as the hit-box. We snap the
    // shot to the nearest vermin within the reticle radius — that's what
    // "the kill box IS the reticle" means in the spec. Aim assist, when
    // on, just expands that radius slightly for forgiveness.
    const state = useGameStore.getState();
    const radius = state.reticleRadius * (aimAssistRef.current ? 1.25 : 1.0);
    const snapped = applyAimAssist(x, y, state.vermin, radius);
    r.queueShot(snapped.x, snapped.y);
  }

  // Tap-to-fire model. Click / tap places the reticle at the pointer
  // position and immediately queues a shot. No drag-to-aim, no long-
  // press-to-reload — reload is bound to R / gamepad bumper / auto when
  // the magazine drains. The reticle is the hit-box; weapon archetype
  // controls reticle radius via the `reticleShape` snapshot.
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    // Mouse: only fire on primary (left) button. Right-click should fall
    // through to the browser context menu, middle-click is reserved.
    // Touch and pen events report button === 0 by default, so this
    // doesn't break either.
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const p = clientToStage(e, e.currentTarget);
    setReticle(p.x, p.y);
    fireWithAssist(p.x, p.y);
  }

  return (
    <div
      data-testid="game-stage"
      // role + aria-label so a screen reader announces the canvas as
      // an interactive image with input affordances. The actual game
      // state is narrated through HUD's aria-live region (per design).
      role="img"
      aria-label="Game canvas — tap or click to fire at that point. R reloads."
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
      onPointerDown={onPointerDown}
    >
      <div
        className="cv-pixi-frame"
        style={{
          // Inside ArcadeFrame's canvas-well, fill whichever axis is the
          // tighter constraint: when the well is wider than 16:9, height
          // bottoms out at 100% and width follows the aspect ratio; when
          // it's taller, width bottoms out at 100% and height follows.
          // The Pixi <canvas> inside has fixed 480×270 HTML attrs — we
          // scale it up via CSS in the global rule defined below so it
          // fills the wrapper instead of sitting at its native size.
          height: "100%",
          width: "auto",
          maxWidth: "100%",
          maxHeight: "100%",
          aspectRatio: `${STAGE_W} / ${STAGE_H}`,
          position: "relative",
          // Screen-shake offset: <= 4 CSS px, decays over 80ms. Reduced-
          // motion short-circuits to (0, 0) so this is a no-op there.
          transform: `translate(${shake.dx}px, ${shake.dy}px)`,
        }}
      >
        <style>{`
          .cv-pixi-frame > canvas {
            display: block;
            width: 100% !important;
            height: 100% !important;
            image-rendering: pixelated;
          }
        `}</style>
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
          <HudOverlay />
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
