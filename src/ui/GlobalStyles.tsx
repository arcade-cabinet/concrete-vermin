import { useEffect } from "react";
import { useGameStore } from "../runtime/store";
import { COLOR } from "../theme/tokens";

const STYLE_ID = "cv-global-styles";

const BASE_STYLES = `
/* Sodium-amber focus ring on every focusable element. Outlined, not
   tinted, so it doesn't compete with the brand-colored backgrounds. */
*:focus-visible {
  outline: 2px solid ${COLOR.sodium};
  outline-offset: 2px;
}

/* Disable the default browser tap-highlight color on touch — we draw
   our own feedback through hover/active states. */
* {
  -webkit-tap-highlight-color: transparent;
}

/* High-contrast variant. Activated by toggling the cv-high-contrast
   class on <html>. Bumps body text to pure cream + thickens button
   strokes + drops accent transparency. */
html.cv-high-contrast button,
html.cv-high-contrast [role="button"] {
  outline-offset: 2px;
}
html.cv-high-contrast *:focus-visible {
  outline-width: 3px;
}
html.cv-high-contrast {
  /* Maximize background/foreground contrast — the cream gets brighter,
     the asphalt darker (already pure black-grey, so no shift). */
  color-scheme: dark;
}
`;

/**
 * Inject global focus + tap-highlight + high-contrast styles once.
 * Toggles the `cv-high-contrast` class on <html> in response to the
 * settings store, so Radix dialogs and any future surface inherit it.
 */
export function GlobalStyles() {
  const highContrast = useGameStore((s) => s.settings.highContrast);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!document.getElementById(STYLE_ID)) {
      const el = document.createElement("style");
      el.id = STYLE_ID;
      el.textContent = BASE_STYLES;
      document.head.appendChild(el);
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("cv-high-contrast", highContrast);
    return () => {
      document.documentElement.classList.remove("cv-high-contrast");
    };
  }, [highContrast]);

  return null;
}
