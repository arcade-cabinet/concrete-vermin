import { App } from "@capacitor/app";

/**
 * Pause the active mission when the OS backgrounds the app, resume it
 * when the player returns. Subscribes to:
 *
 *   - Capacitor App.appStateChange (native iOS/Android)
 *   - document.visibilitychange  (web fallback / desktop browser)
 *
 * Both fire in the same direction (active → inactive → active) so the
 * caller's onPause / onResume callbacks see a consistent edge regardless
 * of platform. Returns a teardown for tests.
 *
 * The runner already exposes pause()/resume() — the wiring in App.tsx
 * just looks up the active runner via the GameStage ref. This module
 * is the broker; it doesn't reach into the runner itself.
 */
export interface LifecycleCallbacks {
  onPause: () => void;
  onResume: () => void;
}

export function installAppLifecycle(cbs: LifecycleCallbacks): () => void {
  const teardowns: Array<() => void> = [];

  // Capacitor native bridge. listen() returns a Promise<PluginListenerHandle>;
  // we hold the handle and call .remove() on teardown. If the bridge isn't
  // present (web build with no Capacitor runtime) the call is a no-op.
  let nativeRemove: (() => void) | null = null;
  let nativeCancelled = false;
  void App.addListener("appStateChange", (state) => {
    if (state.isActive) cbs.onResume();
    else cbs.onPause();
  })
    .then((handle) => {
      if (nativeCancelled) {
        void handle.remove();
        return;
      }
      nativeRemove = () => {
        void handle.remove();
      };
    })
    .catch(() => {
      // Capacitor bridge not registered (pure-web build). Ignore — the
      // visibilitychange listener below covers that case.
    });
  teardowns.push(() => {
    nativeCancelled = true;
    if (nativeRemove) nativeRemove();
  });

  // Web fallback — fires for both desktop browsers and Capacitor's
  // WebView when the OS dispatches visibility events.
  if (typeof document !== "undefined") {
    const onVis = (): void => {
      if (document.visibilityState === "visible") cbs.onResume();
      else cbs.onPause();
    };
    document.addEventListener("visibilitychange", onVis);
    teardowns.push(() => document.removeEventListener("visibilitychange", onVis));
  }

  return () => {
    for (const t of teardowns) t();
  };
}
