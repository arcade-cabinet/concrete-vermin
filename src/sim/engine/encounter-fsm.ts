export type EncounterPhase = "WAITING_FOR_CAMERA" | "ARMING" | "ACTIVE" | "CLEARED" | "FAILED";

export interface EncounterFsm {
  phase: EncounterPhase;
  remaining: number;
  armingStartedAt: number;
  activeStartedAt: number;
  timeLimitS: number;
  armingDurationS: number;
}

export type EncounterEvent =
  | { kind: "camera-arrived" }
  | { kind: "tick" } // recompute time-based transitions
  | { kind: "vermin-killed"; count?: number } // default 1
  | { kind: "fail"; reason: string };

export type EncounterEmittedEvent =
  | { kind: "phase-entered"; phase: EncounterPhase; at: number }
  | { kind: "encounter-cleared"; at: number }
  | { kind: "encounter-failed"; at: number; reason: string };

export interface StepResult {
  next: EncounterFsm;
  emitted: EncounterEmittedEvent[];
}

export function makeEncounterFsm(opts: {
  totalVermin: number;
  armingDurationS: number;
  timeLimitS: number;
}): EncounterFsm {
  return {
    phase: "WAITING_FOR_CAMERA",
    remaining: opts.totalVermin,
    armingStartedAt: 0,
    activeStartedAt: 0,
    timeLimitS: opts.timeLimitS,
    armingDurationS: opts.armingDurationS,
  };
}

const isTerminal = (p: EncounterPhase): boolean => p === "CLEARED" || p === "FAILED";

export function step(fsm: EncounterFsm, event: EncounterEvent, now: number): StepResult {
  if (isTerminal(fsm.phase)) {
    return { next: fsm, emitted: [] };
  }

  switch (event.kind) {
    case "camera-arrived":
      if (fsm.phase !== "WAITING_FOR_CAMERA") return { next: fsm, emitted: [] };
      return {
        next: { ...fsm, phase: "ARMING", armingStartedAt: now },
        emitted: [{ kind: "phase-entered", phase: "ARMING", at: now }],
      };

    case "tick": {
      // ARMING → ACTIVE on countdown
      if (fsm.phase === "ARMING" && now - fsm.armingStartedAt >= fsm.armingDurationS) {
        return {
          next: { ...fsm, phase: "ACTIVE", activeStartedAt: now },
          emitted: [{ kind: "phase-entered", phase: "ACTIVE", at: now }],
        };
      }
      // ACTIVE → FAILED on timeout
      if (
        fsm.phase === "ACTIVE" &&
        fsm.timeLimitS > 0 &&
        now - fsm.activeStartedAt >= fsm.timeLimitS
      ) {
        return {
          next: { ...fsm, phase: "FAILED" },
          emitted: [
            { kind: "phase-entered", phase: "FAILED", at: now },
            { kind: "encounter-failed", at: now, reason: "timeout" },
          ],
        };
      }
      return { next: fsm, emitted: [] };
    }

    case "vermin-killed": {
      if (fsm.phase !== "ACTIVE") return { next: fsm, emitted: [] };
      const count = event.count ?? 1;
      const remaining = Math.max(0, fsm.remaining - count);
      if (remaining <= 0) {
        return {
          next: { ...fsm, remaining: 0, phase: "CLEARED" },
          emitted: [
            { kind: "phase-entered", phase: "CLEARED", at: now },
            { kind: "encounter-cleared", at: now },
          ],
        };
      }
      return { next: { ...fsm, remaining }, emitted: [] };
    }

    case "fail":
      if (fsm.phase !== "ACTIVE") return { next: fsm, emitted: [] };
      return {
        next: { ...fsm, phase: "FAILED" },
        emitted: [
          { kind: "phase-entered", phase: "FAILED", at: now },
          { kind: "encounter-failed", at: now, reason: event.reason },
        ],
      };
  }
}
