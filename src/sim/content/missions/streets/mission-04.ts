import { defineMission, type Mission } from "../../../factories/mission";

export const mission04: Mission = defineMission({
  id: "streets-04-dumpster-bear",
  act: "streets",
  weapon: "revolver",
  cutscene: {
    interstitial: {
      title: "ACT I — STREETS · BOSS",
      body: "Sanitation called you. Said the rumor was a 'big raccoon'. The dumpster behind the deli is breathing. That is not a raccoon.",
      skipAfterMs: 1000,
    },
    collectibles: [
      {
        id: "sanitation-clipboard",
        label: "Sanitation Clipboard",
        anchor: "alley-wall",
        prose:
          "Work order, smudged. Pickup deferred three weeks running, signed by a name that doesn't match anyone on the city payroll.",
      },
    ],
  },
  encounters: [
    {
      id: "softening",
      isCheckpoint: false,
      spawns: [
        { variant: "raccoon-trash-panda", count: 4, pattern: "left-flood" },
        { variant: "raccoon-engorged", count: 2, pattern: "left-flood" },
      ],
    },
    {
      id: "boss-bear",
      isCheckpoint: true,
      spawns: [{ variant: "boss-dumpster-bear", count: 1, pattern: "boss-scripted" }],
    },
  ],
  seed: 1979_01_04,
  livesAllowance: 5,
  cashAward: 500,
});
