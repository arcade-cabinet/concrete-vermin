import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { useGameStore } from "../runtime/store";
import { COLOR, TYPE } from "../theme/tokens";
import { SettingsDialog } from "./SettingsDialog";

interface PauseMenuProps {
  /** Called when the player picks "Restart Mission". */
  onRestart: () => void;
}

/**
 * Pause menu. Opens on Esc during play. Renders Resume / Restart /
 * Settings / Quit-to-Menu. Settings hop into a nested Radix Dialog —
 * Radix handles the focus stack correctly.
 *
 * Note: Radix Dialog auto-focuses the first focusable element on open
 * and traps focus inside until close, which gives us free keyboard
 * navigation + tab order without extra wiring.
 */
export function PauseMenu({ onRestart }: PauseMenuProps) {
  const phase = useGameStore((s) => s.phase);
  const setPhase = useGameStore((s) => s.setPhase);
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Esc to open during play. Radix's own Esc handling closes the
  // dialog when it's already open, so we only intercept when it's not.
  useEffect(() => {
    if (phase !== "playing") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (open || settingsOpen) return;
      e.preventDefault();
      setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, open, settingsOpen]);

  // Hide the trigger button on non-playing phases (don't render menus
  // over the briefing or mission select).
  if (phase !== "playing") return null;

  return (
    <>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <button
            type="button"
            aria-label="Pause"
            style={{
              position: "fixed",
              top: "calc(12px + env(safe-area-inset-top))",
              right: "calc(56px + env(safe-area-inset-right))",
              background: "transparent",
              border: `1px solid ${COLOR.sodium}`,
              color: COLOR.sodium,
              minWidth: 44,
              minHeight: 44,
              padding: "0 12px",
              fontFamily: TYPE.faceMono,
              fontSize: 12,
              cursor: "pointer",
              zIndex: 5,
            }}
          >
            ⏸ PAUSE
          </button>
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Overlay
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(13, 12, 10, 0.78)",
              zIndex: 50,
            }}
          />
          <Dialog.Content
            aria-describedby={undefined}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "min(86vw, 360px)",
              fontFamily: TYPE.faceDisplay,
              zIndex: 51,
            }}
          >
            <Dialog.Title style={{ position: "absolute", left: -9999 }}>PAUSED</Dialog.Title>
            {/* Polaroid: paused frame on top — a "snapshot" of the
               game with PAUSED stamped in the white border. */}
            <div
              style={{
                background: "#f5ebd5",
                padding: "12px 12px 38px",
                transform: "rotate(-3.2deg)",
                boxShadow: `8px 10px 0 ${COLOR.bgConcreteDark}, 16px 18px 28px ${COLOR.bgAsphalt}cc`,
                marginBottom: -12,
                position: "relative",
                zIndex: 2,
              }}
            >
              <div
                style={{
                  background: COLOR.bgAsphalt,
                  height: 90,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: '"Big Shoulders Display", Impact, sans-serif',
                  fontSize: 36,
                  color: COLOR.sodium,
                  letterSpacing: "0.2em",
                  textShadow: `0 0 18px ${COLOR.sodium}99`,
                }}
                aria-hidden="true"
              >
                ⏸
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: 8,
                  left: 0,
                  right: 0,
                  textAlign: "center",
                  fontFamily: '"Special Elite", "Courier Prime", monospace',
                  color: "#7a2818",
                  fontSize: 12,
                  letterSpacing: "0.4em",
                }}
              >
                PAUSED
              </div>
            </div>

            {/* Stack of "torn-edge" option cards — each rotated slightly
               for the snapshot-pile feel. */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                position: "relative",
                zIndex: 1,
              }}
            >
              <PauseButton primary onClick={() => setOpen(false)} rotation="0.6deg">
                ▶ RESUME
              </PauseButton>
              <PauseButton
                rotation="-1.1deg"
                onClick={() => {
                  setOpen(false);
                  onRestart();
                }}
              >
                ↻ RESTART MISSION
              </PauseButton>
              <PauseButton rotation="0.9deg" onClick={() => setSettingsOpen(true)}>
                ⚙ SETTINGS
              </PauseButton>
              <PauseButton
                danger
                rotation="-0.7deg"
                onClick={() => {
                  setOpen(false);
                  setPhase("mission-select");
                }}
              >
                ✕ QUIT TO MENU
              </PauseButton>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}

function PauseButton({
  children,
  onClick,
  primary,
  danger,
  rotation,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  danger?: boolean;
  rotation?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: primary ? COLOR.sodium : danger ? COLOR.brick : "#f5ebd5",
        color: primary ? COLOR.bgAsphalt : danger ? COLOR.cream : "#1a1715",
        border: `1px solid ${primary ? COLOR.sodium : danger ? COLOR.brick : COLOR.borderMute}`,
        minWidth: 44,
        minHeight: 44,
        padding: "12px 16px",
        fontFamily: TYPE.faceMono,
        fontSize: 14,
        letterSpacing: 1,
        cursor: "pointer",
        textAlign: "left",
        transform: rotation ? `rotate(${rotation})` : undefined,
        boxShadow: `4px 5px 0 ${COLOR.bgConcreteDark}99`,
      }}
    >
      {children}
    </button>
  );
}
