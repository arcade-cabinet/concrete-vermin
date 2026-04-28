import { defineMission, type Mission } from "../../../factories/mission";

export const mission08: Mission = defineMission({
  id: "above-08-rooftop-chase",
  act: "above",
  weapon: "tesla",
  cutscene: {
    interstitial: {
      title: "ACT III — ABOVE · 1 of 2",
      body: "Tar-paper rooftops, late September. The geese are nesting on water tanks. The seagulls are running protection. Neither one is afraid of you.",
      skipAfterMs: 800,
    },
    collectibles: [
      {
        id: "water-tank-graffiti",
        label: "Tar-paper Sigil",
        anchor: "water-tank",
        prose:
          "Painted in roofing tar by someone who knew the symbol but not the spelling. Underneath, in pencil: 'don't look up at noon.'",
      },
    ],
  },
  encounters: [
    {
      id: "goose-line",
      isCheckpoint: false,
      spawns: [
        { variant: "goose-baseline", count: 4, pattern: "left-flood" },
        { variant: "goose-aggressive", count: 3, pattern: "right-flood" },
      ],
    },
    {
      id: "gull-cover",
      isCheckpoint: true,
      spawns: [
        { variant: "seagull-aggressive", count: 5, pattern: "dive-from-sky" },
        { variant: "seagull-albino", count: 3, pattern: "dive-from-sky" },
        { variant: "goose-pied", count: 3, pattern: "ceiling-drop" },
      ],
    },
  ],
  events: [
    {
      id: "tesla-warning",
      trigger: { kind: "at-time", seconds: 3 },
      effect: {
        kind: "boss-bark",
        text: 'Pawnbroker: "The rifle bites both ways. Don\'t ground yourself."',
      },
    },
    {
      id: "tar-soft",
      trigger: { kind: "at-time", seconds: 16 },
      effect: {
        kind: "environmental-hazard",
        label: "TAR PAPER GIVES",
        detail: "Footing soft. Reload window slows.",
      },
    },
    {
      id: "gull-cover-bark",
      trigger: { kind: "at-encounter-start", index: 1 },
      effect: { kind: "boss-bark", text: "Gulls overhead. Geese are bait." },
    },
    {
      id: "goose-extra-charge",
      trigger: { kind: "at-kill-count", threshold: 9 },
      effect: { kind: "surprise-wave", variant: "goose-pied", count: 3, pattern: "ceiling-drop" },
    },
    {
      id: "noon-bell",
      trigger: { kind: "at-kill-count", threshold: 14 },
      effect: {
        kind: "environmental-hazard",
        label: "NOON BELL",
        detail: "Don't look up. The sigil knows.",
      },
    },
  ],
  seed: 1979_03_08,
  cashAward: 400,
});
