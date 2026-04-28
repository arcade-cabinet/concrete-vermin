import { defineMission, type Mission } from "../../../factories/mission";

export const mission01: Mission = defineMission({
  id: "streets-01-bodega",
  act: "streets",
  weapon: "shotgun",
  cutscene: {
    interstitial: {
      title: "ACT I — STREETS · 1 of 4",
      body: "The Pawnbroker hands you the family shotgun. The bodega backroom is moving. Clean it out before opening time.",
      skipAfterMs: 800,
    },
    collectibles: [
      {
        id: "tutorial-flyer",
        label: "Yellowed Flyer",
        anchor: "register",
        prose:
          "EXTERMINATION SERVICES — DISCRETION ASSURED. Phone number scratched out, replaced with a Brooklyn exchange and three exclamation marks.",
      },
    ],
  },
  encounters: [
    {
      id: "warmup",
      isCheckpoint: false,
      spawns: [{ variant: "rat-mangy", count: 6, pattern: "left-flood" }],
    },
    {
      id: "second-wave",
      isCheckpoint: true,
      spawns: [
        { variant: "rat-runt", count: 4, pattern: "right-flood" },
        { variant: "rat-mangy", count: 4, pattern: "left-flood" },
      ],
    },
  ],
  events: [
    {
      id: "halpern-call-1",
      trigger: { kind: "at-time", seconds: 4 },
      effect: { kind: "boss-bark", text: "Halpern: \"Don't shoot up the freezer!\"" },
    },
    {
      id: "freezer-leak",
      trigger: { kind: "at-kill-count", threshold: 6 },
      effect: {
        kind: "environmental-hazard",
        label: "FREEZER COMPRESSOR KICKS",
        detail: "Storeroom lights flicker. Stay on the dot.",
      },
    },
    {
      id: "second-room-pop",
      trigger: { kind: "at-encounter-start", index: 1 },
      effect: { kind: "boss-bark", text: "Halpern: \"There's more behind the soda rack.\"" },
    },
    {
      id: "runt-ambush",
      trigger: { kind: "at-kill-count", threshold: 10 },
      effect: { kind: "surprise-wave", variant: "rat-runt", count: 3, pattern: "right-flood" },
    },
  ],
  seed: 1979_01_01,
  livesAllowance: 5,
  cashAward: 100,
});
