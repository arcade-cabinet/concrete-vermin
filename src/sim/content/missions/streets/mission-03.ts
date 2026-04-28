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
  events: [
    {
      id: "costanza-scream",
      trigger: { kind: "at-time", seconds: 3 },
      effect: { kind: "boss-bark", text: "Mrs. Costanza screaming three floors down." },
    },
    {
      id: "october-gust",
      trigger: { kind: "at-time", seconds: 14 },
      effect: {
        kind: "environmental-hazard",
        label: "OCTOBER GUST",
        detail: "Wind shear — pigeon arcs go wide.",
      },
    },
    {
      id: "rabid-warning",
      trigger: { kind: "at-encounter-start", index: 1 },
      effect: { kind: "boss-bark", text: "Pawnbroker: \"Black-feather ones bite. Don't get close.\"" },
    },
    {
      id: "soot-flock-extra",
      trigger: { kind: "at-kill-count", threshold: 9 },
      effect: { kind: "surprise-wave", variant: "pigeon-soot", count: 4, pattern: "ceiling-drop" },
    },
    {
      id: "weather-vane-still",
      trigger: { kind: "at-kill-count", threshold: 14 },
      effect: {
        kind: "environmental-hazard",
        label: "WEATHER VANE STOPS",
        detail: "Wind dies. The roof goes quiet.",
      },
    },
  ],
  seed: 1979_01_03,
  cashAward: 200,
});
