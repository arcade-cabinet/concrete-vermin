import { defineMission, type Mission } from "../../../factories/mission";

export const mission03: Mission = defineMission({
  id: "streets-03-rooftop",
  act: "streets",
  weapon: "shotgun",
  cutscene: {
    interstitial: {
      title: "ACT I — STREETS · 3 of 4",
      body: "Rooftop, six stories up. The pigeons have stopped flying south. They have started flying at people.",
      skipAfterMs: 800,
    },
    collectibles: [
      {
        id: "weather-vane-feather",
        label: "Black Feather",
        anchor: "weather-vane",
        prose:
          "Pinned to the iron weather vane with a sewing needle. Iridescent in the wrong way — like an oil slick that won't wash off.",
      },
    ],
  },
  encounters: [
    {
      id: "scout-flight",
      isCheckpoint: false,
      spawns: [{ variant: "pigeon-rooftop", count: 6, pattern: "dive-from-sky" }],
    },
    {
      id: "rabid-strafe",
      isCheckpoint: true,
      spawns: [
        { variant: "pigeon-rabid", count: 5, pattern: "dive-from-sky" },
        { variant: "pigeon-soot", count: 5, pattern: "ceiling-drop" },
      ],
    },
  ],
  seed: 1979_01_03,
});
