import { type PlayerProgress, usePlayerProgress } from "./PlayerProgress";

const STORAGE_KEY = "concrete-vermin:progress:v1";

interface PersistedShape {
  cash: number;
  unlockedWeapons: string[];
  activeMods: string[];
  completedMissionIds: string[];
  selectedMissionId: string;
  firstLaunchSeen?: boolean;
}

function snapshot(p: PlayerProgress): PersistedShape {
  return {
    cash: p.cash,
    unlockedWeapons: [...p.unlockedWeapons],
    activeMods: [...p.activeMods],
    completedMissionIds: [...p.completedMissionIds],
    selectedMissionId: p.selectedMissionId,
    firstLaunchSeen: p.firstLaunchSeen,
  };
}

function applySnapshot(data: PersistedShape): void {
  usePlayerProgress.setState({
    cash: Math.max(0, Number(data.cash) || 0),
    // biome-ignore lint/suspicious/noExplicitAny: schema-validated cast.
    unlockedWeapons: (data.unlockedWeapons ?? ["shotgun"]) as any,
    activeMods: data.activeMods ?? [],
    completedMissionIds: data.completedMissionIds ?? [],
    selectedMissionId: data.selectedMissionId || "streets-01-bodega",
    // Default false: a corrupted save / brand-new launch should still
    // see the tutorial overlay once.
    firstLaunchSeen: Boolean(data.firstLaunchSeen),
  });
}

/**
 * Load persisted progress on app startup. Capacitor-SQLite is the
 * eventual home; localStorage is the web/dev fallback. The interface
 * is the same — swap the implementation when Capacitor is wired.
 */
export function loadPlayerProgress(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw) as PersistedShape;
    applySnapshot(data);
  } catch {
    // Corrupted save — start fresh.
  }
}

/**
 * Subscribe progress → localStorage. Call once at app boot.
 * Returns an unsubscribe in case callers want to tear down (tests).
 */
export function autoPersistPlayerProgress(): () => void {
  if (typeof window === "undefined") return () => {};
  return usePlayerProgress.subscribe((state) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot(state)));
    } catch {
      // Quota exceeded or disabled — silently no-op; in-memory state is still authoritative.
    }
  });
}

export const PROGRESS_STORAGE_KEY = STORAGE_KEY;
