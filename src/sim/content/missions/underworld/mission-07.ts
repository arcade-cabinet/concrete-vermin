import { defineMission, type Mission } from "../../../factories/mission";

export const mission07: Mission = defineMission({
  id: "underworld-07-river-mutant",
  act: "underworld",
  weapon: "flamethrower",
  cutscene: {
    interstitial: {
      title: "ACT II — UNDERWORLD · BOSS",
      body: "Where the East River cuts under the Williamsburg piers. The Pawnbroker said you'd know it when you saw it. He was being kind.",
      skipAfterMs: 1000,
    },
    collectibles: [
      {
        id: "river-mutant-icon",
        label: "Saint-Anthony Icon, Submerged",
        anchor: "rotting-pylon",
        prose:
          "Wood-painted icon nailed to a piling at the high-water line. The face has been worn smooth — current, or something less neutral.",
      },
    ],
  },
  encounters: [
    {
      id: "spawn-cordon",
      isCheckpoint: false,
      spawns: [
        { variant: "sewer-fish-radioactive", count: 6, pattern: "surface-from-grate" },
        { variant: "sewer-fish-engorged", count: 3, pattern: "surface-from-grate" },
      ],
    },
    {
      id: "boss-mutant",
      isCheckpoint: true,
      spawns: [{ variant: "boss-river-mutant", count: 1, pattern: "boss-scripted" }],
    },
  ],
  seed: 1979_02_07,
});
