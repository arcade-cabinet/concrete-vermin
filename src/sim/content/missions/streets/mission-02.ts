import { defineMission, type Mission } from "../../../factories/mission";

export const mission02: Mission = defineMission({
  id: "streets-02-alley",
  act: "streets",
  weapon: "shotgun",
  cutscene: {
    interstitial: {
      title: "ACT I — STREETS · 2 of 4",
      body: "Alleyway between Mott and Mulberry. Garbage stacked to the second-floor windows. Something is chewing through it from inside.",
      skipAfterMs: 800,
    },
    collectibles: [
      {
        id: "alley-matchbook",
        label: "Hotel Carter Matchbook",
        anchor: "dumpster",
        prose:
          "Cover bears the Hotel Carter crest, half-burnt. Inside flap: a phone number, a rosary bead glued in place of the striker.",
      },
    ],
  },
  encounters: [
    {
      id: "rat-tide",
      isCheckpoint: false,
      spawns: [
        { variant: "rat-mangy", count: 6, pattern: "left-flood" },
        { variant: "rat-engorged", count: 2, pattern: "left-flood" },
      ],
    },
    {
      id: "first-roaches",
      isCheckpoint: true,
      spawns: [
        { variant: "roach-baseline", count: 8, pattern: "pop-from-vent" },
        { variant: "rat-mangy", count: 4, pattern: "right-flood" },
      ],
    },
  ],
  events: [
    {
      id: "alley-stink-warning",
      trigger: { kind: "at-time", seconds: 5 },
      effect: {
        kind: "environmental-hazard",
        label: "STENCH RISES",
        detail: "Reticle drift +1. Breathe through your sleeve.",
      },
    },
    {
      id: "carter-bark",
      trigger: { kind: "at-kill-count", threshold: 5 },
      effect: { kind: "boss-bark", text: 'Pawnbroker: "Don\'t step on the matchbook."' },
    },
    {
      id: "vent-pop",
      trigger: { kind: "at-encounter-start", index: 1 },
      effect: { kind: "boss-bark", text: "Roaches in the vent. Watch the wall." },
    },
    {
      id: "engorged-rush",
      trigger: { kind: "at-kill-count", threshold: 12 },
      effect: { kind: "surprise-wave", variant: "rat-engorged", count: 2, pattern: "left-flood" },
    },
    {
      id: "garbage-collapse",
      trigger: { kind: "at-time", seconds: 24 },
      effect: {
        kind: "environmental-hazard",
        label: "BAG TOWER COLLAPSES",
        detail: "Cover gone. Roaches scatter.",
      },
    },
  ],
  seed: 1979_01_02,
  cashAward: 150,
});
