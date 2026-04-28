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
        { variant: "rat-engorged", count: 3, pattern: "left-flood" },
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
  seed: 1979_02_06,
  cashAward: 300,
});
