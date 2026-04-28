import { defineMission, type Mission } from "../../../factories/mission";

export const mission05: Mission = defineMission({
  id: "underworld-05-subway",
  act: "underworld",
  weapon: "smg",
  cutscene: {
    interstitial: {
      title: "ACT II — UNDERWORLD · 1 of 3",
      body: "Canal Street platform. The MTA is not running tonight. Whatever is on the third rail is not commuter.",
      skipAfterMs: 800,
    },
    collectibles: [
      {
        id: "transfer-stub",
        label: "Transfer Stub",
        anchor: "turnstile",
        prose:
          "Punched for a station that doesn't exist. The route map below it has been clawed off and replaced with a rosary diagram in chalk.",
      },
    ],
  },
  encounters: [
    {
      id: "platform-skitter",
      isCheckpoint: false,
      spawns: [
        { variant: "rat-engorged", count: 3, pattern: "left-flood" },
        { variant: "rat-mangy", count: 6, pattern: "right-flood" },
      ],
    },
    {
      id: "tunnel-mouth",
      isCheckpoint: true,
      spawns: [
        { variant: "roach-massive", count: 4, pattern: "pop-from-vent" },
        { variant: "feral-cat-baseline", count: 4, pattern: "mixed-wave" },
        { variant: "rat-engorged", count: 2, pattern: "left-flood" },
      ],
    },
  ],
  seed: 1979_02_05,
});
