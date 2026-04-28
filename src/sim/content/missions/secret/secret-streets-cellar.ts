import { defineMission, type Mission } from "../../../factories/mission";

export const secretStreetsCellar: Mission = defineMission({
  id: "streets-secret-cellar",
  act: "streets",
  weapon: "sawed-off",
  secret: true,
  sGradeUnlockFrom: "streets-04-dumpster-bear",
  cutscene: {
    interstitial: {
      title: "STREETS · SECRET — THE CELLAR",
      body: "Halpern called the morning after Lazzaro's. Said there's a cellar door behind the soda rack he never opens. He's opening it for you. Tonight.",
      skipAfterMs: 1200,
    },
    collectibles: [
      {
        id: "cellar-padlock-key",
        label: "Padlock Key, Bent",
        anchor: "cellar-door",
        prose:
          "Halpern's father's. Bent at the bow because someone tried to twist it the wrong way. The lock turned anyway.",
      },
    ],
  },
  encounters: [
    {
      id: "stair-skitter",
      isCheckpoint: false,
      spawns: [
        { variant: "rat-engorged", count: 4, pattern: "left-flood" },
        { variant: "roach-massive", count: 5, pattern: "pop-from-vent" },
      ],
    },
    {
      id: "cellar-floor",
      isCheckpoint: true,
      spawns: [
        { variant: "rat-engorged", count: 5, pattern: "left-flood" },
        { variant: "roach-radioactive", count: 4, pattern: "pop-from-vent" },
        { variant: "feral-cat-tough", count: 2, pattern: "right-flood" },
      ],
    },
  ],
  events: [
    {
      id: "halpern-padlock-warning",
      trigger: { kind: "at-time", seconds: 3 },
      effect: {
        kind: "boss-bark",
        text: 'Halpern: "Whatever you find down there, leave it."',
      },
    },
    {
      id: "stair-light-dies",
      trigger: { kind: "at-time", seconds: 8 },
      effect: {
        kind: "environmental-hazard",
        label: "STAIR BULB DIES",
        detail: "Sodium-only for the next ten seconds.",
      },
    },
    {
      id: "second-floor-cats",
      trigger: { kind: "at-encounter-start", index: 1 },
      effect: { kind: "boss-bark", text: "Cats came up through the coal chute. Watch your right." },
    },
    {
      id: "cellar-flood",
      trigger: { kind: "at-kill-count", threshold: 12 },
      effect: { kind: "surprise-wave", variant: "rat-engorged", count: 4, pattern: "left-flood" },
    },
  ],
  seed: 1979_01_99,
  livesAllowance: 4,
  cashAward: 700,
});
