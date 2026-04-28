import { defineMission, type Mission } from "../../../factories/mission";

export const mission09: Mission = defineMission({
  id: "above-09-pigeon-king",
  act: "above",
  weapon: "tesla",
  cutscene: {
    interstitial: {
      title: "ACT III — ABOVE · BOSS",
      body: "Top of the Woolworth Building. The clouds will not move tonight. He has been waiting for you longer than you have been alive. Let's get this done.",
      skipAfterMs: 1200,
    },
    collectibles: [
      {
        id: "king-crown",
        label: "Bottle-cap Crown",
        anchor: "spire-base",
        prose:
          "Twelve flattened bottle caps — Rheingold, Schaefer, Knickerbocker — wired into a circlet. Bigger than a man's head. Heavier than it looks.",
      },
      {
        id: "the-pawnbroker-letter",
        label: "Pawnbroker's Letter",
        anchor: "spire-shadow",
        prose:
          "If you're reading this, it means you got further than I did. The story I told you about your grandfather wasn't quite right. He didn't kill it. He just made it wait. Make a better job of it than that.",
      },
    ],
  },
  encounters: [
    {
      id: "court-of-pigeons",
      isCheckpoint: false,
      spawns: [
        { variant: "pigeon-rabid", count: 6, pattern: "dive-from-sky" },
        { variant: "pigeon-soot", count: 6, pattern: "ceiling-drop" },
      ],
    },
    {
      id: "boss-king",
      isCheckpoint: true,
      spawns: [{ variant: "boss-pigeon-king", count: 1, pattern: "boss-scripted" }],
    },
  ],
  seed: 1979_03_09,
  livesAllowance: 5,
  cashAward: 1000,
});
