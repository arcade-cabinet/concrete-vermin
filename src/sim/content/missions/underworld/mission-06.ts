import { defineMission, type Mission } from "../../../factories/mission";

export const mission06: Mission = defineMission({
  id: "underworld-06-sewer-shallows",
  act: "underworld",
  weapon: "sawed-off",
  cutscene: {
    interstitial: {
      title: "ACT II — UNDERWORLD · 2 of 3",
      body: "Knee-deep service tunnel under Bleecker. The water is warm. It shouldn't be warm. Things underneath it are watching the surface.",
      skipAfterMs: 800,
    },
    collectibles: [
      {
        id: "sewer-pipefitter-tag",
        label: "Pipefitter's Brass Tag",
        anchor: "service-ladder",
        prose:
          "DiSalvo Plumbing & Iron, est. 1938. Date of last inspection scratched out. Replaced with a question mark.",
      },
    ],
  },
  encounters: [
    {
      id: "first-lungers",
      isCheckpoint: false,
      spawns: [
        { variant: "sewer-fish-baseline", count: 5, pattern: "surface-from-grate" },
        // Sewer-pipe ceiling-drop is the act-2 signature for this
        // mission — distinguishes it from m05 (mixed-wave + pop-from-
        // vent) and m07 (boss-scripted) per the encounter composition
        // uniqueness gate.
        { variant: "roach-massive", count: 3, pattern: "ceiling-drop" },
      ],
    },
    {
      id: "deeper-water",
      isCheckpoint: true,
      spawns: [
        { variant: "sewer-fish-radioactive", count: 4, pattern: "surface-from-grate" },
        { variant: "sewer-fish-engorged", count: 3, pattern: "surface-from-grate" },
        { variant: "roach-radioactive", count: 4, pattern: "pop-from-vent" },
      ],
    },
  ],
  events: [
    {
      id: "warm-water-warning",
      trigger: { kind: "at-time", seconds: 4 },
      effect: { kind: "boss-bark", text: 'Pawnbroker: "If the water boils, run."' },
    },
    {
      id: "pipe-burst",
      trigger: { kind: "at-kill-count", threshold: 6 },
      effect: {
        kind: "environmental-hazard",
        label: "PIPE BURST",
        detail: "Steam vents the tunnel. Sight lines drop.",
      },
    },
    {
      id: "deeper-encounter-bark",
      trigger: { kind: "at-encounter-start", index: 1 },
      effect: {
        kind: "boss-bark",
        text: "DiSalvo's tag is in the deeper water. Don't dive for it.",
      },
    },
    {
      id: "roach-flood-extra",
      trigger: { kind: "at-kill-count", threshold: 14 },
      effect: {
        kind: "surprise-wave",
        variant: "roach-radioactive",
        count: 3,
        pattern: "pop-from-vent",
      },
    },
    {
      id: "current-shifts",
      trigger: { kind: "at-time", seconds: 32 },
      effect: {
        kind: "environmental-hazard",
        label: "CURRENT REVERSES",
        detail: "Fish push toward the player line.",
      },
    },
  ],
  seed: 1979_02_06,
  cashAward: 300,
});
