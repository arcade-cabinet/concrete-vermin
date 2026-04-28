import * as RToast from "@radix-ui/react-toast";
import { useEffect, useState } from "react";
import { useGameStore } from "../runtime/store";
import { COLOR, TYPE } from "../theme/tokens";

interface ToastEvent {
  id: number;
  title: string;
  body?: string;
  /** "info" | "win" | "warn" — drives the left-edge accent color. */
  kind: "info" | "win" | "warn";
}

let _id = 0;
const _subs = new Set<(e: ToastEvent) => void>();

/**
 * Push a non-blocking toast notification. Pure dispatcher — no React.
 * Components subscribe via the ToastHost; persistence and dismissal
 * are handled by Radix Toast.
 *
 * Use sparingly: cash earned, weapon unlocked, achievement unlocked.
 * Anything time-critical goes through the SR live region instead.
 */
export function toast(title: string, opts: { body?: string; kind?: "info" | "win" | "warn" } = {}): void {
  const e: ToastEvent = { id: ++_id, title, ...(opts.body ? { body: opts.body } : {}), kind: opts.kind ?? "info" };
  for (const s of _subs) s(e);
}

const ACCENT: Record<ToastEvent["kind"], string> = {
  info: COLOR.sodium,
  win: COLOR.flashGreen,
  warn: COLOR.brickAccessible,
};

/**
 * Mount once at the App root. Subscribes to the toast() dispatcher,
 * holds up to 4 active toasts, dismisses each after 4 s.
 */
export function ToastHost() {
  const [toasts, setToasts] = useState<ToastEvent[]>([]);
  const reducedMotion = useGameStore((s) => s.settings.reducedMotion);
  useEffect(() => {
    const sub = (e: ToastEvent) => {
      setToasts((prev) => [...prev, e].slice(-4));
    };
    _subs.add(sub);
    return () => {
      _subs.delete(sub);
    };
  }, []);

  return (
    <RToast.Provider swipeDirection="right" duration={4000}>
      {toasts.map((t) => (
        <RToast.Root
          key={t.id}
          data-testid={`toast-${t.id}`}
          onOpenChange={(open) => {
            if (!open) setToasts((prev) => prev.filter((x) => x.id !== t.id));
          }}
          style={{
            background: COLOR.bgConcreteDark,
            color: COLOR.cream,
            borderLeft: `3px solid ${ACCENT[t.kind]}`,
            padding: "10px 16px",
            fontFamily: TYPE.faceMono,
            fontSize: 13,
            boxShadow: `0 4px 16px ${COLOR.bgAsphalt}cc`,
            animation: reducedMotion
              ? undefined
              : "cv-toast-slide-in 220ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <RToast.Title style={{ color: ACCENT[t.kind], letterSpacing: "0.15em", fontSize: 11, marginBottom: t.body ? 2 : 0 }}>
            {t.title}
          </RToast.Title>
          {t.body ? (
            <RToast.Description style={{ fontSize: 12, color: COLOR.cream }}>
              {t.body}
            </RToast.Description>
          ) : null}
        </RToast.Root>
      ))}
      <RToast.Viewport
        style={{
          position: "fixed",
          bottom: "calc(16px + env(safe-area-inset-bottom))",
          right: "calc(16px + env(safe-area-inset-right))",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          maxWidth: 380,
          listStyle: "none",
          margin: 0,
          padding: 0,
          outline: "none",
          zIndex: 100,
        }}
      />
      <style>{`
        @keyframes cv-toast-slide-in {
          from { opacity: 0; transform: translateX(24px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </RToast.Provider>
  );
}
