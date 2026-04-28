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
      spawns: [{ variant: "boss-dumpster-bear-classic", count: 1, pattern: "boss-scripted" }],
    },
  ],
  events: [
    {
      id: "lazzaro-warning",
      trigger: { kind: "at-time", seconds: 4 },
      effect: { kind: "boss-bark", text: "Pawnbroker: \"Six rounds. One for the head. Make it count.\"" },
    },
    {
      id: "engorged-extra",
      trigger: { kind: "at-kill-count", threshold: 4 },
      effect: { kind: "surprise-wave", variant: "raccoon-engorged", count: 1, pattern: "right-flood" },
    },
    {
      id: "bear-roars",
      trigger: { kind: "at-encounter-start", index: 1 },
      effect: { kind: "boss-bark", text: "BEAR: a sound that should not come out of a dumpster." },
    },
    {
      id: "alley-flood",
      trigger: { kind: "at-time", seconds: 30 },
      effect: {
        kind: "environmental-hazard",
        label: "GREASE TRAP RUPTURES",
        detail: "Footing slick. Reload window slows.",
      },
    },
  ],
  seed: 1979_01_04,
  livesAllowance: 5,
  cashAward: 500,
});
