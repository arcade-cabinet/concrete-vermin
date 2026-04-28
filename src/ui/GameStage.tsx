import { Application, useTick } from "@pixi/react";
import { useEffect, useRef } from "react";
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

const STAGE_W = 480;
const STAGE_H = 270;
const KILLS_REQUIRED = 8;

function Loop({ runner }: { runner: GameRunner }) {
  useTick(({ deltaTime }) => {
    // Pixi delta is in 1/60-second units by default; convert to seconds.
    runner.step(deltaTime / 60);
  });
  return null;
}

export function GameStage() {
  const runnerRef = useRef<GameRunner | null>(null);
  const phase = useGameStore((s) => s.phase);
  const startMission = useGameStore((s) => s.startMission);
  const setReticle = useGameStore((s) => s.setReticle);
  const crtOn = useGameStore((s) => s.settings.crtOverlay);

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

  // Begin playing on mount of the briefing.
  useEffect(() => {
    if (phase === "briefing") {
      const id = setTimeout(() => startMission("tutorial-bodega", KILLS_REQUIRED), 600);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [phase, startMission]);

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * (STAGE_W / rect.width);
    const sy = (e.clientY - rect.top) * (STAGE_H / rect.height);
    setReticle(sx, sy);
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * (STAGE_W / rect.width);
    const sy = (e.clientY - rect.top) * (STAGE_H / rect.height);
    setReticle(sx, sy);
    runnerRef.current?.queueShot(sx, sy);
  }

  return (
    <div
      data-testid="game-stage"
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0d0c0a",
        touchAction: "none",
      }}
      onPointerMove={onPointerMove}
      onPointerDown={onPointerDown}
    >
      <div
        style={{
          width: "min(100vw, 96vh)",
          aspectRatio: `${STAGE_W} / ${STAGE_H}`,
          position: "relative",
        }}
      >
        <Application
          width={STAGE_W}
          height={STAGE_H}
          background={0x0d0c0a}
          autoDensity={true}
          resolution={window.devicePixelRatio || 1}
        >
          <Stage />
          <VerminLayer />
          <ProjectileLayer />
          <MuzzleFlashLayer />
          <SplashLayer />
          <ReticleLayer />
          {crtOn ? <CRTOverlay /> : null}
          {runnerRef.current ? <Loop runner={runnerRef.current} /> : null}
        </Application>
      </div>
    </div>
  );
}
