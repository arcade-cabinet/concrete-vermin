import { useCallback, useEffect, useRef } from "react";

/**
 * Arrow-key navigation across a flat grid of focusable elements
 * marked with `data-arrow-nav-item`. Wraps at the grid edges, supports
 * Home / End for first / last, Enter / Space activate via the
 * browser's default button behavior (no extra wiring required).
 *
 * Returns a ref to attach to the container element. The hook listens
 * for keydown on the container and moves document.activeElement to
 * the next visible non-disabled item.
 *
 * Layout-agnostic: the hook treats children as a single flat ring.
 * If the content wraps to multiple rows visually, ArrowDown / ArrowUp
 * still move by one item (predictable for keyboard-only players).
 */
export function useArrowGridNav<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);

  const getItems = useCallback((): HTMLElement[] => {
    const root = ref.current;
    if (!root) return [];
    return Array.from(root.querySelectorAll<HTMLElement>("[data-arrow-nav-item]")).filter(
      (el) => !el.hasAttribute("disabled") && !isHidden(el),
    );
  }, []);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const items = getItems();
      if (items.length === 0) return;
      const active = document.activeElement as HTMLElement | null;
      const idx = active ? items.indexOf(active) : -1;
      const last = items.length - 1;
      let next: number;
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          next = idx < 0 ? 0 : (idx + 1) % items.length;
          break;
        case "ArrowLeft":
        case "ArrowUp":
          next = idx < 0 ? last : (idx - 1 + items.length) % items.length;
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = last;
          break;
        default:
          return;
      }
      e.preventDefault();
      items[next]?.focus();
    };
    root.addEventListener("keydown", onKeyDown);
    return () => root.removeEventListener("keydown", onKeyDown);
  }, [getItems]);

  return ref;
}

function isHidden(el: HTMLElement): boolean {
  // Cheap check that works in both jsdom (no layout) and the live DOM.
  // hidden attribute, aria-hidden, or visibility/display style.
  if (el.hidden) return true;
  if (el.getAttribute("aria-hidden") === "true") return true;
  const cs =
    typeof window !== "undefined" && typeof window.getComputedStyle === "function"
      ? window.getComputedStyle(el)
      : null;
  if (cs && (cs.display === "none" || cs.visibility === "hidden")) return true;
  return false;
}
