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
              width: "min(86vw, 320px)",
              background: COLOR.bgConcreteDark,
              color: COLOR.cream,
              border: `1px solid ${COLOR.sodium}`,
              padding: "20px 24px",
              fontFamily: TYPE.faceDisplay,
              zIndex: 51,
            }}
          >
            <Dialog.Title
              style={{
                color: COLOR.sodium,
                margin: 0,
                marginBottom: 12,
                fontSize: 22,
                letterSpacing: 2,
              }}
            >
              PAUSED
            </Dialog.Title>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <PauseButton primary onClick={() => setOpen(false)}>
                ▶ RESUME
              </PauseButton>
              <PauseButton
                onClick={() => {
                  setOpen(false);
                  onRestart();
                }}
              >
                ↻ RESTART MISSION
              </PauseButton>
              <PauseButton onClick={() => setSettingsOpen(true)}>⚙ SETTINGS</PauseButton>
              <PauseButton
                danger
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
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: primary ? COLOR.sodium : danger ? COLOR.brick : "transparent",
        color: primary ? COLOR.bgAsphalt : COLOR.cream,
        border: `1px solid ${primary ? COLOR.sodium : danger ? COLOR.brick : COLOR.borderMute}`,
        minWidth: 44,
        minHeight: 44,
        padding: "12px 14px",
        fontFamily: TYPE.faceMono,
        fontSize: 14,
        letterSpacing: 1,
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      {children}
    </button>
  );
}
