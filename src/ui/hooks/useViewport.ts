import { useEffect, useState } from "react";

/**
 * Viewport breakpoint hook. Subscribes to a `matchMedia` query and
 * re-renders when the match flips. Cheap; one listener per call.
 *
 * Use this for layout decisions that genuinely change shape (stack vs
 * row), not for sizing — sizing should use CSS clamp() inline.
 */
export function useMediaMatch(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches,
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

/**
 * `true` when the viewport is at most 480 CSS pixels wide. This is the
 * narrow-portrait breakpoint for the HUD column stack and other layout
 * shifts. Mirrors the design's "phone in portrait" intent.
 */
export function useIsNarrow(): boolean {
  return useMediaMatch("(max-width: 480px)");
}

/**
 * Device pixel ratio, refreshed on the `change` of the matching dpr
 * media query. Returns 1 in non-browser environments. Used by the
 * reticle to thicken its stroke on high-DPR displays so the cross
 * doesn't disappear at retina.
 */
export function useDevicePixelRatio(): number {
  const [dpr, setDpr] = useState(() =>
    typeof window === "undefined" ? 1 : window.devicePixelRatio || 1,
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => setDpr(window.devicePixelRatio || 1);
    // matchMedia on resolution fires when the user moves a window
    // between displays of different DPR; resize covers everything else.
    const mql = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
    mql.addEventListener("change", update);
    window.addEventListener("resize", update);
    return () => {
      mql.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  return dpr;
}
